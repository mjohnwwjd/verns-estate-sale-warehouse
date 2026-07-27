# Vern's Google Calendar connection

The employee workflow is ready in two modes:

- Without Google authorization, employees can open Vern's calendar and open a prefilled meeting or sale-date event for review. Google requires the employee to choose the correct calendar and save it.
- With the secure connection configured, saving a Potential Customer asks the authenticated backend to check Vern's free/busy information and create or update one meeting event. Contract Prep can do the same for an all-day sale hold.

The static GitHub Pages site cannot safely hold a Google OAuth client secret or refresh token. Those values must live in an authenticated server-side function.

## User-owned setup

1. Create or select Vern's Google Cloud project.
2. Enable the Google Calendar API.
3. Configure the OAuth consent screen and authorize Vern's calendar account.
4. Use the least-privilege Calendar scopes needed to check free/busy and create/update events.
5. Store the OAuth client secret and refresh token only in the backend's secret manager.
6. Deploy `supabase/functions/google-calendar-sync/index.ts`.
7. Configure `calendarId` and the authenticated function URL as `syncEndpoint` in `assets/js/google-calendar-config.js`. These are public routing values, not credentials.

Until both public fields are configured, the site remains in honest manual-review mode.

## Endpoint contract

The browser sends an authenticated `POST` with the signed-in employee's short-lived Supabase bearer token:

```json
{
  "operation": "upsert",
  "calendarId": "user-owned-calendar-id",
  "timeZone": "America/Detroit",
  "checkFreeBusy": true,
  "event": {
    "kind": "potential-customer-meeting",
    "localRecordId": "potential-customer-...",
    "existingEventId": null,
    "summary": "Potential customer visit - Customer Name",
    "location": "structured sale-site address",
    "description": "customer contact and employee notes",
    "start": { "dateTime": "2026-07-30T10:00:00", "timeZone": "America/Detroit" },
    "end": { "dateTime": "2026-07-30T11:00:00", "timeZone": "America/Detroit" }
  }
}
```

Sale holds use `kind: "onsite-sale"` and all-day `start.date` / exclusive `end.date`.

Before creating a new event, the backend must:

1. authenticate an approved employee;
2. query free/busy for the requested period;
3. return a conflict without creating an event when the time is unavailable;
4. use `existingEventId` to update the prior event after an employee changes the meeting;
5. use a stable Google event ID derived server-side from `kind` and `localRecordId` as duplicate protection;
6. return only safe event metadata.

Expected success:

```json
{
  "ok": true,
  "conflict": false,
  "event": {
    "id": "google-event-id",
    "htmlLink": "https://calendar.google.com/calendar/event?..."
  }
}
```

Expected conflict without insertion:

```json
{
  "ok": true,
  "conflict": true,
  "event": null,
  "conflicts": [{ "start": "...", "end": "..." }]
}
```

Never log or return customer details more broadly than the authenticated employee session requires.

## Required function secrets

```text
SITE_ORIGIN=https://estatesbyvern.com
GOOGLE_CALENDAR_ID=Vern's selected calendar ID
GOOGLE_OAUTH_CLIENT_ID=Google OAuth web client ID
GOOGLE_OAUTH_CLIENT_SECRET=Google OAuth client secret
GOOGLE_OAUTH_REFRESH_TOKEN=refresh token granted by Vern
```

Supabase supplies `SUPABASE_URL` and `SUPABASE_ANON_KEY` to its Edge Function environment. The checked-in browser config must contain none of the OAuth values above.
