# verns website

Clean retro public website and hidden employee tool area for Vern's Estate Sale Warehouse.

## What is included

- Public customer site: home, warehouse photo board, clearance area, official EstateSales.NET profile button, current sale/photo button, contact, and hours.
- Vern's commercial redo brief: `promo-video/verns-commercial-redo-brief.md` includes script, storyboard, Nano Banana prompts, Canva assembly notes, and website integration guidance.
- Dynamic upcoming sale board: public sale cards with live EstateSales.NET links and a backend daily-sync endpoint.
- Bottom donation bar for 1M Project with the official logo, mission link, and direct Stripe donation button.
- Upcoming sale cards include a main-photo slot. Staff can upload a local picture or paste an approved image URL from the employee `Public Content` tab.
- Hidden employee area: go to `index.html#employee` or `/Vern’s website/#employee`, then enter passcode `3939`.
- Staff content manager: publish uploaded pictures into Featured, Last Chance clearance, Warehouse Special, or general gallery categories, then assign an item type such as furniture, lamps, tools, glassware, books, kids, electronics, seasonal, or auto.
- Warehouse photo board: public customers see no more than three quick-peek cards at a time, with popular category buttons and a `More categories` toggle under the cards.
- AI thrift pricing camera: take/upload one item picture, identify the item, estimate market value, generate a sales-floor price, Marketplace price, and clearance price.
- Manager pricing settings: change the thrift markdown, Marketplace percentage, clearance markdown, and pricing basis. The starting thrift markdown matches Quick Flip's 50% thrift setting.
- AI photo publish station: take/upload a picture, generate a suggested item name/category/price, and show yellow clearance price overlays.
- Marketplace manager: manual-post workflow with generated title, description, price, copy buttons, photo saving, posted tracking, sold price, and closed-out date.
- Manager dashboard: pending, posted, sold, closed, priced item counts, employee activity, and vacation/closed-out notes.
- Local placeholder art, generated resale promo artwork, and copied reference photos.
- Installable phone web app: PWA manifest, app icons, service worker, and `Save App` prompt/instructions for phone shortcuts.
- Canva artwork checklist and integration notes in `docs/`.

## Run locally

For the full version with AI pricing and sale sync, run the Node backend:

```bash
npm start
```

Then open:

```text
http://localhost:8080/
```

Run the local checks:

```bash
npm run check
npm run smoke
```

`npm run smoke` starts a temporary backend, checks the home page, API status, sale sync response, local image/CSS/JS assets, and external links used by the public site. See `docs/deep-smoke-test-report.md` for the latest manual browser smoke notes.

AI pricing requires `OPENAI_API_KEY` in the server environment or in `Vern’s website/.env.local`. On this computer, the same key can be reused at runtime from Quick Flip without changing Quick Flip's files.

## Phone app option

This site is now a PWA, which means it can be saved to a phone home screen like an app without paying for an App Store or Google Play listing.

- iPhone: open the site in Safari, tap Share, then tap `Add to Home Screen`.
- Android/Chrome: tap `Save App` if shown, or use the browser menu and choose `Add to Home screen` / `Install app`.

A full native store app is still possible later, but it usually adds account fees, review steps, and ongoing maintenance. The PWA is the free first step.

## Stable public hosting on Render

The customer-facing site can be deployed as a Render static site for a stable public link that works away from the local computer.

Suggested Render settings:

```text
Name: verns-estate-sale-warehouse
Build command: npm run check
Publish directory: .
```

This static deployment is best for showing the public phone website, floor photos, sale links, contact details, and PWA install behavior. The employee pricing tools still open, and photo pricing falls back to the local pricing helper if the hosted AI endpoint is not available.

For full server-side AI photo pricing and permission-gated EstateSales.NET sync, deploy the Node server as a Render web service later and set server environment variables such as `OPENAI_API_KEY` and `ESTATESALES_SYNC_ENABLED` in Render, never in browser code.

If you only need the static public mockup, you can still run:

```bash
python3 -m http.server 8080
```

If you run the server from the parent workspace, open:

```text
http://localhost:8080/Vern%E2%80%99s%20website/
```

## Update public content

1. Open the site.
2. Add `#employee` to the URL.
3. Enter passcode `3939`.
4. Open `Public Content`.
5. Use `Add website photo or item`.
6. Choose the category:
   - `Featured hot item` appears in the warehouse photo board.
   - `Last Chance clearance` appears under the bright clearance callout.
   - `Warehouse special photo` appears in the warehouse photo board.
   - `General floor photo` appears in the warehouse photo board.
7. Choose the item type for public filtering, such as `Furniture`, `Lamps`, `Tools`, `Glassware`, `Kids`, `Electronics`, `Sporting Goods`, or `Auto`.
8. Add title, price, note, and a picture.
9. Click `Publish to selected category`.

Photos are resized in-browser before storage. This keeps the workflow quick, but browser storage is still not a permanent database. Use `Export data` regularly if staff are using a shared device.

## Use AI thrift pricing

1. Open the employee area.
2. Go to `Pricing`.
3. Tap `Take item picture`.
4. Add an optional hint if the photo has no clear brand, model, or label.
5. Click `AI price from photo`.
6. Review the AI item name, category, condition, market value, sales-floor price, Marketplace price, clearance price, and notes.
7. Choose where to add it:
   - `Sales floor / priced item only`
   - `Featured hot item`
   - `Last Chance clearance`
   - `Marketplace draft`
   - `Warehouse special`
   - `General floor photo`
8. Click `Save / add item`.

Clearance items publish with the bright yellow price overlay automatically.

## Use the AI photo station

1. Open the employee area.
2. Go to `Public Content`.
3. Tap `Take or add picture`.
4. Add an optional hint like `lamp`, `dresser`, `tools`, or `dishes`.
5. Click `AI suggest item`.
6. Review the suggested title, category, price, tag, and notes.
7. If the category is `Last Chance clearance`, the public photo gets a yellow price overlay.
8. Click `Publish to selected category`.

The current version includes a fast local suggestion helper so the workflow works immediately. For real image recognition, add a backend endpoint in `Public site settings` under `Optional AI image endpoint`. Keep API keys on the backend, not in this public static page.

## Update EstateSales.NET links

1. Open the employee area.
2. Go to `Public Content`.
3. Keep `EstateSales.NET company/profile URL` set to Vern's official company page:

```text
https://www.estatesales.net/companies/MI/Muskegon/49441/16076
```

4. Paste a specific active-sale URL into `EstateSales.NET live sale URL` when a current sale is posted.
5. Save settings.

The public site always shows Vern's official EstateSales.NET page. The sale-photo button opens the live sale URL when one is saved; otherwise it falls back to the official company page. Only use the `Authorized embed URL` field if EstateSales.NET gives Vern's a permitted iframe/embed URL.

## Manage upcoming sales

1. Open the employee area.
2. Go to `Public Content`.
3. Use `EstateSales.NET sale board`.
4. Paste the official sale URL, title, city, dates, hours, status, and a short note.
5. Click `Add sale link`.
6. Each day, open the official sale page from the staff list, confirm the dates/times/status, then click `Reviewed today`.

The public sale board is built for fast changes: cards can be added, removed, marked `Past`, or marked `Canceled / removed` without touching code. Public customers always click through to EstateSales.NET for photos and final details.

For future automation, the site points to `/api/estate-sales/sync` by default. The browser checks that endpoint once per day while the site is open. The server returns the current cached sale list unless EstateSales.NET page checking is explicitly enabled with written permission/API access.

To enable EstateSales.NET company-page checking after permission is granted:

```bash
ESTATESALES_SYNC_ENABLED=true npm start
```

The backend also accepts:

```text
ESTATESALES_COMPANY_URL=https://www.estatesales.net/companies/MI/Muskegon/49441/16076
```

See `data/estate-sales.example.json` for the fallback feed shape.

## Stage Lightspeed items for EstateSales.NET

Lightspeed is connected through the official read-only API on this Mac. To test the connection:

```bash
npm run lightspeed:pull -- 10
```

To generate a local EstateSales.NET review pack with item descriptions, suggested categories, internal prices, and downloaded Lightspeed photos:

```bash
npm run lightspeed:stage -- --limit 25
```

The output goes to:

```text
output/lightspeed-estatesales/
```

Open the generated `lightspeed-estatesales-review.html` for the visual review board. Use `upload-by-category/` for upload-ready image folders and `estate-sales-upload-checklist.md` to track what has been moved to EstateSales.NET. This bridge intentionally does not auto-publish to EstateSales.NET.

## Early Entry sign-up

The public Early Entry page is:

```text
early-entry.html
```

Payment settings live in:

```text
assets/js/early-entry-config.js
```

The current local draft points to the live Stripe Payment Link:

```text
stripePaymentLink: "https://buy.stripe.com/eVqfZj5MVdy1diF5LsaR200"
paymentPreviewMode: false
```

That lets the `Pay $25 & Sign Up Early` button open Stripe checkout for a `$25` Early Entry spot. The page checks the live Worker count before showing the public spots remaining.

The visible spots-remaining countdown uses the live Worker:

```text
spotCounterMode: "live"
previewPaidSpots: 7
spotCounterEndpoint: "https://verns-early-entry-api.mjohnwwjd.workers.dev/api/early-entry/count"
```

The live counter and employee roster are designed to read from the Cloudflare Worker. Stripe should send `checkout.session.completed` events to:

```text
https://verns-early-entry-api.mjohnwwjd.workers.dev/api/early-entry/stripe-webhook
```

The Worker stores completed Stripe sessions, returns the public spots remaining from `/api/early-entry/count`, and returns the staff read-off list from `/api/early-entry/roster`.

To use the local mock checkout instead, clear `stripePaymentLink` and set:

```text
paymentPreviewMode: true
paymentPreviewUrl: "payment-preview.html"
```

If both Stripe and preview mode are off, the page falls back to Venmo at `@ebuyingstore` and clearly says Venmo sign-ups must be manually confirmed.

## 1M Project donation bar

The bottom donation bar links to:

```text
https://1mproject.org/
https://1mproject.org/support-the-mission/
https://donate.stripe.com/bJebJ126O4IifCOa6Gbwk00
```

The logo file is saved locally as:

```text
assets/img/1m-project-reference-style.svg
```

The earlier official white horizontal logo is still staged at `assets/img/1m-project-white-horizontal.png`, but the public donation bar now uses the cleaner orange/navy reference-style SVG.

## AI backend

The AI pricing endpoint is:

```text
/api/price-photo
```

It expects one image file in a multipart field named `images`. Keep `OPENAI_API_KEY` on the server. Do not paste API keys into the browser or employee settings.

## Canva artwork

Canva project folder:

```text
https://www.canva.com/folder/FAHLRzpZoW0
```

Saved editable candidates:

- Logo concept: `https://www.canva.com/d/UNLq_9O4Nc-7jR9`
- Hero banner concept: `https://www.canva.com/d/2U3_xGnJRF4neM6`
- Corrected singular Estate Sale hero candidate: `https://www.canva.com/d/qmpV739rFNtMAEl`

Current active site logo: Option 2, `Elegant V Crest Logo`, saved as `assets/img/logo-vern-option-2.png`. When the final logo is exported from Canva, replace that PNG or update the image path in `index.html`, `site-data.js`, or the employee content manager.

## GitHub Pages

This site has no build step. For GitHub Pages:

1. Commit the `Vern’s website` folder.
2. In GitHub repo settings, enable Pages from the branch.
3. If publishing only this folder is awkward, move the contents of `Vern’s website` to the repo root.

## Folder structure

```text
Vern’s website/
  index.html
  README.md
  assets/
    css/styles.css
    js/app.js
    js/site-data.js
    img/
  docs/
```

## Important limits

- Passcode `3939` is only a lightweight staff gate. It is not secure authentication.
- Staff data is saved in the current browser's local storage.
- This does not scrape EstateSales.NET.
- This does not automate Facebook Marketplace posting.
