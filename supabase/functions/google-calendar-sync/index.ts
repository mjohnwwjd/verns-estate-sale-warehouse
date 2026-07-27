import { createClient } from "npm:@supabase/supabase-js@2";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

type CalendarDate = { date?: string; dateTime?: string; timeZone?: string };
type CalendarEventInput = {
  kind: "potential-customer-meeting" | "onsite-sale";
  localRecordId: string;
  existingEventId?: string | null;
  summary: string;
  location?: string;
  description?: string;
  start: CalendarDate;
  end: CalendarDate;
};

function env(name: string): string {
  return (Deno.env.get(name) || "").trim();
}

function response(origin: string, status: number, body: unknown): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "authorization, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin"
    }
  });
}

function allowedOrigin(request: Request): string {
  const origin = request.headers.get("Origin") || "";
  const configured = env("SITE_ORIGIN") || "https://estatesbyvern.com";
  return origin === configured ? origin : "";
}

function clean(value: unknown, max = 500): string {
  return String(value || "").trim().slice(0, max);
}

function validDateBoundary(value: CalendarDate): boolean {
  return Boolean(
    /^\d{4}-\d{2}-\d{2}$/.test(clean(value?.date))
    || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(clean(value?.dateTime))
  );
}

async function googleAccessToken(): Promise<string> {
  const body = new URLSearchParams({
    client_id: env("GOOGLE_OAUTH_CLIENT_ID"),
    client_secret: env("GOOGLE_OAUTH_CLIENT_SECRET"),
    refresh_token: env("GOOGLE_OAUTH_REFRESH_TOKEN"),
    grant_type: "refresh_token"
  });
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const token = await tokenResponse.json();
  if (!tokenResponse.ok || !token.access_token) throw new Error("Google authorization refresh failed.");
  return token.access_token;
}

function boundaryIso(value: CalendarDate): string {
  const local = value.dateTime || `${value.date}T00:00:00`;
  const utcGuess = new Date(`${local}Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Detroit",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(utcGuess);
  const fields = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  const representedInDetroit = Date.UTC(
    Number(fields.year),
    Number(fields.month) - 1,
    Number(fields.day),
    Number(fields.hour),
    Number(fields.minute),
    Number(fields.second)
  );
  const offset = representedInDetroit - utcGuess.getTime();
  return new Date(utcGuess.getTime() - offset).toISOString();
}

async function stableEventId(kind: string, localRecordId: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${kind}:${localRecordId}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `verns${hex.slice(0, 48)}`;
}

async function googleJson(url: string, token: string, init: RequestInit = {}): Promise<any> {
  const result = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });
  const body = await result.json().catch(() => ({}));
  if (!result.ok) throw new Error(body?.error?.message || `Google Calendar returned ${result.status}.`);
  return body;
}

async function conflictingEvents(
  calendarId: string,
  event: CalendarEventInput,
  token: string
): Promise<Array<{ id: string; summary: string; start: CalendarDate; end: CalendarDate }>> {
  const params = new URLSearchParams({
    timeMin: boundaryIso(event.start),
    timeMax: boundaryIso(event.end),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50"
  });
  const listed = await googleJson(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    token
  );
  return (listed.items || [])
    .filter((item: any) =>
      item.status !== "cancelled"
      && item.transparency !== "transparent"
      && item.id !== event.existingEventId
    )
    .map((item: any) => ({
      id: clean(item.id, 200),
      summary: clean(item.summary || "Busy", 200),
      start: item.start,
      end: item.end
    }));
}

Deno.serve(async (request: Request) => {
  const origin = allowedOrigin(request);
  if (!origin) return response("https://estatesbyvern.com", 403, { ok: false, message: "Origin is not allowed." });
  if (request.method === "OPTIONS") return response(origin, 204, null);
  if (request.method !== "POST") return response(origin, 405, { ok: false, message: "POST required." });

  try {
    const bearer = request.headers.get("Authorization") || "";
    if (!bearer.startsWith("Bearer ")) return response(origin, 401, { ok: false, message: "Employee sign-in required." });
    const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
      global: { headers: { Authorization: bearer } },
      auth: { persistSession: false }
    });
    const { data: userData, error: userError } = await supabase.auth.getUser(bearer.slice(7));
    if (userError || !userData.user) return response(origin, 401, { ok: false, message: "Employee session is invalid." });
    const { data: employee } = await supabase
      .from("employee_profiles")
      .select("active")
      .eq("user_id", userData.user.id)
      .eq("active", true)
      .maybeSingle();
    if (!employee) return response(origin, 403, { ok: false, message: "Active employee access is required." });

    const payload = await request.json();
    const event = payload?.event as CalendarEventInput;
    const allowedCalendarId = env("GOOGLE_CALENDAR_ID");
    if (!allowedCalendarId || payload?.calendarId !== allowedCalendarId) {
      return response(origin, 400, { ok: false, message: "Calendar is not configured." });
    }
    if (
      payload?.operation !== "upsert"
      || !["potential-customer-meeting", "onsite-sale"].includes(event?.kind)
      || !clean(event?.localRecordId, 160)
      || !clean(event?.summary, 200)
      || !validDateBoundary(event?.start)
      || !validDateBoundary(event?.end)
    ) {
      return response(origin, 400, { ok: false, message: "Calendar event details are incomplete." });
    }

    const token = await googleAccessToken();
    const conflicts = payload?.checkFreeBusy
      ? await conflictingEvents(allowedCalendarId, event, token)
      : [];
    if (conflicts.length) return response(origin, 200, { ok: true, conflict: true, event: null, conflicts });

    const eventId = clean(event.existingEventId, 200) || await stableEventId(event.kind, event.localRecordId);
    const googleEvent = {
      id: eventId,
      summary: clean(event.summary, 200),
      location: clean(event.location, 500),
      description: clean(event.description, 2000),
      start: event.start,
      end: event.end,
      extendedProperties: {
        private: {
          vernsLocalRecordId: clean(event.localRecordId, 160),
          vernsWorkflowKind: event.kind
        }
      }
    };
    const method = event.existingEventId ? "PUT" : "POST";
    const url = event.existingEventId
      ? `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(allowedCalendarId)}/events/${encodeURIComponent(eventId)}`
      : `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(allowedCalendarId)}/events`;
    const saved = await googleJson(url, token, { method, body: JSON.stringify(googleEvent) });
    return response(origin, 200, {
      ok: true,
      conflict: false,
      event: { id: saved.id, htmlLink: saved.htmlLink, updatedAt: saved.updated }
    });
  } catch (error) {
    console.error("Google Calendar sync failed.", error);
    return response(origin, 500, { ok: false, message: "Google Calendar could not be updated." });
  }
});
