const DEFAULT_SALE_ID = "wyoming-extraordinary-2026";
const DEFAULT_MAX_SPOTS = 25;
const DEFAULT_BASELINE_CLAIMED = 5;
const DEFAULT_PRICE_CENTS = 2500;
const DEFAULT_STAFF_CODE = "3939";
const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = allowedOrigin(request);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    try {
      if (url.pathname === "/api/early-entry/count" && request.method === "GET") {
        return json(await countResponse(env), { origin });
      }

      if (url.pathname === "/api/early-entry/roster" && request.method === "GET") {
        requireStaffAccess(request, env);
        return json(await rosterResponse(env), { origin });
      }

      if (url.pathname === "/api/early-entry/roster" && request.method === "POST") {
        requireStaffAccess(request, env);
        const body = await request.json().catch(() => ({}));
        await addManualRosterEntry(env, body);
        return json(await rosterResponse(env), { origin, status: 201 });
      }

      if (url.pathname === "/api/early-entry/stripe-webhook" && request.method === "POST") {
        return stripeWebhook(request, env, origin);
      }

      if (url.pathname === "/api/early-entry/health" && request.method === "GET") {
        return json({ ok: true, service: "verns-early-entry-api" }, { origin });
      }

      return json({ error: "Not found" }, { origin, status: 404 });
    } catch (error) {
      const status = error.status || 500;
      return json({ error: status === 500 ? "Server error" : error.message }, { origin, status });
    }
  }
};

async function stripeWebhook(request, env, origin) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  await verifyStripeSignature(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);

  const event = JSON.parse(rawBody);
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data?.object || {};
    if (sessionMatchesEarlyEntry(session, env)) {
      await saveStripeSession(env, session, event.id);
    }
  }

  return json({ received: true }, { origin });
}

async function countResponse(env) {
  const config = getConfig(env);
  const paidSessions = await listEntries(env, sessionPrefix(config.saleId));
  const manualEntries = await listEntries(env, manualPrefix(config.saleId));
  const paidSpots = Math.min(config.maxPaidSpots, config.baselineClaimedSpots + paidSessions.length + manualEntries.length);

  return {
    mode: "live",
    saleId: config.saleId,
    paidSpots,
    maxPaidSpots: config.maxPaidSpots,
    remainingSpots: Math.max(0, config.maxPaidSpots - paidSpots),
    stripePayments: paidSessions.length,
    manualEntries: manualEntries.length,
    baselineClaimedSpots: config.baselineClaimedSpots,
    updatedAt: new Date().toISOString()
  };
}

async function rosterResponse(env) {
  const config = getConfig(env);
  const reserved = reservedRows(env, config);
  const paidSessions = await listEntries(env, sessionPrefix(config.saleId));
  const manualEntries = await listEntries(env, manualPrefix(config.saleId));

  const paymentRows = paidSessions
    .sort(byCreatedAt)
    .map((entry, index) => ({
      id: entry.id,
      spot: reserved.length + index + 1,
      name: entry.name || "Paid customer",
      contact: [entry.email, entry.phone].filter(Boolean).join(" / "),
      source: "Stripe",
      status: "Paid",
      notes: entry.amount ? `${formatMoney(entry.amount, entry.currency)} paid` : "",
      createdAt: entry.createdAt,
      locked: true
    }));

  const manualRows = manualEntries
    .sort(byCreatedAt)
    .map((entry, index) => ({
      id: entry.id,
      spot: reserved.length + paymentRows.length + index + 1,
      name: entry.name || "Manual entry",
      contact: entry.contact || "",
      source: entry.source || "Manual",
      status: entry.status || entry.source || "Manual",
      notes: entry.notes || "",
      createdAt: entry.createdAt,
      locked: true
    }));

  const entries = [...reserved, ...paymentRows, ...manualRows].slice(0, config.maxPaidSpots);
  return {
    mode: "live",
    saleId: config.saleId,
    entries,
    paidSpots: entries.length,
    maxPaidSpots: config.maxPaidSpots,
    remainingSpots: Math.max(0, config.maxPaidSpots - entries.length),
    updatedAt: new Date().toISOString()
  };
}

async function addManualRosterEntry(env, body) {
  const config = getConfig(env);
  const current = await rosterResponse(env);
  if (current.entries.length >= config.maxPaidSpots) {
    throw httpError(409, "Early-entry list is full.");
  }

  const name = clean(body.name);
  if (!name) throw httpError(400, "Shopper name is required.");

  const createdAt = new Date().toISOString();
  const id = `manual_${crypto.randomUUID()}`;
  const entry = {
    id,
    name,
    contact: clean(body.contact),
    source: clean(body.source) || "Manual",
    status: clean(body.status) || clean(body.source) || "Manual",
    notes: clean(body.notes),
    createdAt
  };

  await env.EARLY_ENTRY_KV.put(`${manualPrefix(config.saleId)}${id}`, JSON.stringify(entry));
}

async function saveStripeSession(env, session, eventId) {
  const config = getConfig(env);
  const id = session.id || eventId;
  if (!id) return;

  const key = `${sessionPrefix(config.saleId)}${id}`;
  const existing = await env.EARLY_ENTRY_KV.get(key);
  if (existing) return;

  const entry = {
    id,
    eventId,
    name: customerName(session),
    email: session.customer_details?.email || session.customer_email || "",
    phone: session.customer_details?.phone || "",
    amount: Number(session.amount_total || 0),
    currency: String(session.currency || "usd").toUpperCase(),
    paymentLink: session.payment_link || "",
    paymentIntent: session.payment_intent || "",
    createdAt: session.created ? new Date(session.created * 1000).toISOString() : new Date().toISOString()
  };

  await env.EARLY_ENTRY_KV.put(key, JSON.stringify(entry));
}

function sessionMatchesEarlyEntry(session, env) {
  const config = getConfig(env);
  const paymentLinkId = clean(env.STRIPE_PAYMENT_LINK_ID);
  if (paymentLinkId && session.payment_link !== paymentLinkId) return false;
  if (session.mode && session.mode !== "payment") return false;
  if (session.payment_status && !["paid", "no_payment_required"].includes(session.payment_status)) return false;

  const amount = Number(session.amount_total || 0);
  if (config.priceCents && amount !== config.priceCents) return false;

  return true;
}

function customerName(session) {
  const customName = Array.isArray(session.custom_fields)
    ? session.custom_fields.map((field) => field.text?.value || field.dropdown?.value || "").find(Boolean)
    : "";
  return session.customer_details?.name
    || session.customer_name
    || session.metadata?.name
    || session.metadata?.shopper_name
    || customName
    || session.customer_details?.email
    || session.customer_email
    || "Paid customer";
}

async function verifyStripeSignature(rawBody, header, webhookSecret) {
  if (!webhookSecret) throw httpError(500, "Stripe webhook secret is not configured.");

  const parts = Object.fromEntries(header.split(",").map((part) => {
    const [key, value] = part.split("=");
    return [key, value];
  }));
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) throw httpError(400, "Missing Stripe signature.");

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > SIGNATURE_TOLERANCE_SECONDS) {
    throw httpError(400, "Expired Stripe signature.");
  }

  const expected = await hmacSha256Hex(webhookSecret, `${timestamp}.${rawBody}`);
  if (!constantTimeEqual(signature, expected)) {
    throw httpError(400, "Invalid Stripe signature.");
  }
}

async function hmacSha256Hex(secret, payload) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}

async function listEntries(env, prefix) {
  const listed = await env.EARLY_ENTRY_KV.list({ prefix, limit: 1000 });
  const rows = await Promise.all(listed.keys.map((key) => env.EARLY_ENTRY_KV.get(key.name, { type: "json" })));
  return rows.filter(Boolean);
}

function reservedRows(env, config) {
  const configured = parseJsonArray(env.RESERVED_SPOTS_JSON);
  if (configured.length) {
    return configured.slice(0, config.baselineClaimedSpots).map((item, index) => ({
      id: `reserved-${index + 1}`,
      spot: Number.isFinite(Number(item.spot)) ? Number(item.spot) : index + 1,
      name: clean(item.name) || `Claimed spot ${index + 1}`,
      contact: clean(item.contact),
      source: clean(item.source) || "Claimed",
      status: clean(item.status) || "Claimed",
      notes: clean(item.notes),
      createdAt: clean(item.createdAt),
      locked: true
    }));
  }

  return Array.from({ length: config.baselineClaimedSpots }, (_, index) => ({
    id: `baseline-${index + 1}`,
    spot: index + 1,
    name: `Claimed spot ${index + 1}`,
    contact: "",
    source: "Early entry",
    status: "Claimed",
    notes: "",
    createdAt: "",
    locked: true
  }));
}

function parseJsonArray(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getConfig(env) {
  return {
    saleId: clean(env.SALE_ID) || DEFAULT_SALE_ID,
    maxPaidSpots: positiveInt(env.MAX_PAID_SPOTS, DEFAULT_MAX_SPOTS),
    baselineClaimedSpots: positiveInt(env.BASELINE_CLAIMED_SPOTS, DEFAULT_BASELINE_CLAIMED),
    priceCents: positiveInt(env.PRICE_CENTS, DEFAULT_PRICE_CENTS)
  };
}

function positiveInt(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : fallback;
}

function requireStaffAccess(request, env) {
  const expected = clean(env.STAFF_API_PASSCODE) || DEFAULT_STAFF_CODE;
  const actual = request.headers.get("x-verns-staff-code") || new URL(request.url).searchParams.get("staffCode") || "";
  if (actual !== expected) throw httpError(401, "Staff access required.");
}

function sessionPrefix(saleId) {
  return `sale:${saleId}:stripe:`;
}

function manualPrefix(saleId) {
  return `sale:${saleId}:manual:`;
}

function byCreatedAt(a, b) {
  return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
}

function clean(value) {
  return String(value || "").trim();
}

function formatMoney(amount, currency) {
  return `${(Number(amount || 0) / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency || "USD"
  })}`;
}

function allowedOrigin(request) {
  const origin = request.headers.get("Origin") || "";
  const allowed = new Set([
    "https://estatesbyvern.com",
    "https://www.estatesbyvern.com",
    "https://mjohnwwjd.github.io",
    "http://127.0.0.1:8080",
    "http://localhost:8080"
  ]);
  return allowed.has(origin) ? origin : "https://estatesbyvern.com";
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Stripe-Signature,x-verns-staff-code",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(data, { origin = "https://estatesbyvern.com", status = 200 } = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders(origin)
    }
  });
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
