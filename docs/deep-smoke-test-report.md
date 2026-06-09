# Deep Smoke Test Report

Date: 2026-06-09

## Commands

- `npm run check` passed.
- `npm run smoke` passed.
- `git diff --check` passed.
- Direct local backend probe passed on `http://127.0.0.1:18123`.
- Static fallback/link crawl passed on the local homepage.
- Headless Chrome DOM render loaded the local homepage, current sale copy, real address, and real phone number.

## Backend/API Coverage

- `/api/status` returns `ok: true` and exposes only safe configuration flags.
- `/api/estate-sales/sync` returns a sales array and `syncAllowed` flag.
- `/api/price-photo` returns a safe fallback result when no readable image is uploaded.
- Malformed encoded URLs now return `400 Bad request`.
- Source/private paths are blocked from the Node static server:
  - `/server.js`
  - `/package.json`
  - `/README.md`
  - `/docs/deep-smoke-test-report.md`
  - `/scripts/smoke-check.mjs`
  - `/data/estate-sales.example.json`
  - `/.env.local`
  - `/assets/%2e%2e/server.js`

## Link/Asset Coverage

- Homepage app scripts, stylesheet, and manifest return `200`.
- Existing smoke still checks both `index.html` and `meet-vern.html`.
- No empty or placeholder `href="#"` links were found in static HTML.
- Same-page hash links point to existing IDs.
- New-tab links are checked for `rel="noopener"`.
- PWA assets and service worker return successfully.
- External references are checked by the smoke script with warnings instead of false failures for sites that block automated HEAD/GET checks.

## Fixes Saved

- Hardened `serveStatic` so the Node server only serves public root files and `assets/`.
- Added smoke-test coverage for blocked private/source paths.
- Added a clean `400` response for malformed encoded URLs.
- Replaced the raw homepage address fallback with `1663 West Sherman Boulevard, Norton Shores, MI 49441`.
- Replaced the raw homepage phone fallback with `(616) 638-3873`.

## Live Site Check

- `http://estatesbyvern.com/` redirects to `https://estatesbyvern.com/`.
- `https://estatesbyvern.com/` returns `200` and includes the Vern site title.
- `http://www.estatesbyvern.com/` and `https://www.estatesbyvern.com/` redirect to `https://estatesbyvern.com/`.
- GitHub Pages reports `https_enforced: true`.
- GitHub Pages reports the HTTPS certificate as `approved` for `estatesbyvern.com` and `www.estatesbyvern.com`.
- GitHub Pages certificate expires on `2026-09-07`.

## Follow-Up

- The employee passcode gate is still a convenience screen in a static app, not true protected authentication. Use real server-side auth before storing private employee data online.
