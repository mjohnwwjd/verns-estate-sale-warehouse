# Deep Smoke Test Report

Date: 2026-06-06

## Commands

- `npm run check` passed.
- `node --check scripts/smoke-check.mjs` passed.
- `npm run smoke` passed.
- Local rendered browser smoke used `http://127.0.0.1:18097/?v=20260606-deep-smoke`.

## Static Smoke Coverage

- `index.html` and `meet-vern.html` both return successfully.
- No empty links or placeholder `href="#"` links remain in either HTML page.
- Same-page hash links point to existing section IDs.
- Static dropdowns have options.
- Required employee dynamic dropdown hooks are present:
  - `data-category-select`
  - `data-pricing-destination`
  - `data-priced-item-select`
  - `data-market-category-select`
  - `data-photo-item-type-select`

## Rendered Link Checks

- Homepage rendered 20 anchors, 18 visible.
- Meet Vern rendered 5 anchors, 5 visible.
- No rendered placeholder links.
- No missing rendered hash targets.
- New-tab links include `rel="noopener"`.
- Fresh browser console error checks passed on the homepage, employee area, and Meet Vern page.
- Asset cache tag verified: `20260606-deep-smoke`.

## Employee Area Dropdown Checks

- Employee passcode `3939` opens Vern's Staff Tools.
- Pricing tab dropdowns work:
  - Category: 22 options
  - Condition: 5 options
  - Status: 2 options
  - Destination: 6 options
- Marketplace tab dropdowns work:
  - Priced item: 1 option
  - Category: 22 options
  - Status: 4 options
- Dashboard works:
  - Request time off opens.
  - `Email Vern` is a button, not a fake link.
  - `Text Vern` is a button, not a fake link.
  - Manager view unlocks and shows the manager dashboard.
- Calendar tab dropdowns work:
  - Type: 5 options
  - Status: 4 options
- Settings tab dropdown works:
  - Default pricing basis: 2 options
- Public Content tab dropdowns work:
  - Sale status: 4 options
  - Photo category: 4 options
  - Item type: 19 options

## Fixes Made During Test

- Replaced staff time-off placeholder send links with action buttons that build email/text handoffs only when needed.
- Added real fallback URLs for EstateSales.NET, Google Maps, and Facebook links before JavaScript finishes loading.
- Fixed shared settings rendering so `meet-vern.html` no longer throws when homepage-only elements are absent.
- Bumped homepage, Meet Vern, and service worker cache tags to `20260606-deep-smoke`.
- Expanded `npm run smoke` to check both HTML pages, placeholder links, hash targets, static dropdown options, and required employee dropdown hooks.
