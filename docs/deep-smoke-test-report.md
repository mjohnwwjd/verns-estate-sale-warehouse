# Deep Smoke Test Report

Date: 2026-06-02

## Commands

- `npm run check` passed.
- `npm run smoke` passed.
- Local server restarted cleanly at `http://127.0.0.1:8080/`.

## Public Website Checks

- Rendered anchor crawl found 28 anchors, 26 visible.
- No empty `#` links.
- No missing internal section targets.
- External new-tab links include `rel="noopener"`.
- No broken images in the rendered public page.
- No horizontal page overflow.
- Removed/redundant copy stayed removed:
  - `Fresh finds`
  - `Upcoming EstateSales.NET Sales`
  - `Official sale links`
- Public sections present:
  - `#home`
  - `#photos`
  - `#sales`
  - `#last-chance`
  - `#visit`
  - `#donate`
- Sales board shows 3 cards, including the `More Sales Coming Soon` card.
- Quick Peeks shows 3 cards and no search field.
- Category controls passed:
  - `More categories` expands the full category list.
  - `Tools` filter shows 1 result.
  - Result note updates to `Showing 1 floor peek in Tools.`
- Yellow-band variant switch works:
  - Active balanced link: `?v=thin-yellow-bands#last-chance`
  - Tighter fallback link: `?v=yellow-band-variants&band=tight#last-chance`

## Link Checks

Automated probes:

- Google Maps address link: `200`
- EstateSales.NET company page: `200`
- Spring Lake EstateSales.NET listing: `200`
- Muskegon EstateSales.NET listing: `200`
- 1M Project home: `200`
- 1M Project support page: `200`
- Stripe donation link: `200`
- Facebook profile ID: `301` redirect to `https://www.facebook.com/people/Quick-Flip/61590076124139/`

Facebook note: the current Facebook ID is reachable, but the redirected slug says `Quick-Flip` while the site label says `Verns Estate Sales on Facebook`. Confirm whether that is the desired page/renamed page.

## Browser Click Smoke

- Top nav links passed:
  - Home
  - Photos
  - EstateSales
  - Clearance
  - Visit
- Hero action links passed after the page settles:
  - View Floor Photos
  - Upcoming Sales
  - Last Chance Clearance
- Clearance tag directions link passed.
- Added explicit same-page hash-link handling so anchor buttons navigate consistently.

## Employee Area Smoke

- `#employee` opens hidden employee login modal.
- Wrong passcode shows `Wrong passcode.`
- Passcode `3939` opens employee panel.
- Pricing camera input exists.
- Employee tabs switch correctly:
  - Pricing
  - Marketplace
  - Dashboard
  - Settings
  - Public Content
- `Back to Website` closes employee panel and clears `#employee` from the URL.

## Backend/API Smoke

- `/api/status` returned `ok: true`.
- `/api/estate-sales/sync` returned the seed sale list and correctly reports sync is permission-gated/off.
- `/api/price-photo` accepts the employee camera field name `photo`.
- OpenAI is not configured locally, so pricing currently returns the local fallback with the note `OPENAI_API_KEY is not configured for this server.`

## Fixes Made During Test

- Added repeatable `npm run smoke`.
- Added `scripts/smoke-check.mjs`.
- Fixed same-page CTA/hash links with explicit hash navigation handling.
- Fixed backend photo upload parser to accept `images`, `photo`, or `image`.
- Documented smoke commands in `README.md`.
