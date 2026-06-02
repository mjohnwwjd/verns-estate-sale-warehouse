# Content Update Guide

## Open staff tools

1. Open the website.
2. Add `#employee` to the URL.
3. Enter passcode `3939`.

Example:

```text
https://your-site.com/#employee
```

## Add a featured item

1. Go to `Public Content`.
2. Use `Add website photo or item`.
3. Choose `Featured hot item`.
4. Add a title, price, short note, and photo.
5. Click `Publish to selected category`.

The item appears in the top carousel.

## Add a clearance item

1. Go to `Pricing`.
2. Tap `Take item picture`.
3. Click `AI price from photo`.
4. Choose `Last Chance clearance` under `Add after pricing`.
5. Confirm the clearance price.
6. Click `Save / add item`.

The item appears under the yellow clearance callout with a bright price overlay on the photo.

## Price an item with AI

1. Go to `Pricing`.
2. Take or upload one clear item photo.
3. Add an optional hint if the item needs help, such as `brass lamp`, `MCM dresser`, `Ryobi drill`, or a visible model number.
4. Click `AI price from photo`.
5. Review the item name, category, condition, AI market value, regular retail estimate, sales-floor price, Marketplace price, clearance price, and notes.
6. Pick where the item should go:
   - `Sales floor / priced item only`
   - `Featured hot item`
   - `Last Chance clearance`
   - `Marketplace draft`
   - `Warehouse special`
   - `General floor photo`
7. Click `Save / add item`.

Manager settings start with the same Quick Flip thrift markdown: 50% off the AI market value. Change that in `Settings`.

## Use AI photo suggestions

1. Go to `Public Content`.
2. Take or upload a photo in `AI photo publish station`.
3. Click `AI suggest item`.
4. Review and edit the category, name, price, tag, and note.
5. Publish it to the selected category.

The built-in helper works without a backend. A real image-recognition endpoint can be added in `Public site settings` using `Optional AI image endpoint`.

## Add a warehouse special photo

1. Go to `Public Content`.
2. Choose `Warehouse special photo`.
3. Add title, note, and picture.
4. Publish it.

The item appears in current specials.

## Add a general floor photo

1. Go to `Public Content`.
2. Choose `General floor photo`.
3. Add a simple title and photo.
4. Publish it.

The photo appears in the warehouse photo board.

## Update contact info and hours

1. Go to `Public Content`.
2. Edit address, phone, email, and hours.
3. Save settings.

## Update EstateSales.NET links

1. Go to `Public Content`.
2. Leave `EstateSales.NET company/profile URL` set to Vern's official page unless EstateSales.NET gives you a better company URL.
3. Paste a current sale URL into `EstateSales.NET live sale URL` only when you want the sale-photo button to point at one active listing.
4. Save settings.

If there is no current sale URL saved, the public sale-photo button opens Vern's official EstateSales.NET company page.

## Add or review upcoming sales

1. Go to `Public Content`.
2. Find `EstateSales.NET sale board`.
3. Paste the official EstateSales.NET sale URL.
4. Add the customer-facing title, city, dates, hours, status, and short note.
5. Add the main sale picture if you have it, or paste a local/approved image URL.
6. Click `Add sale link`.

Daily review workflow:

1. In the staff sale board, open any sale marked for review.
2. Compare the public card with the official EstateSales.NET listing.
3. If dates, times, title, or status changed, remove and re-add the card with corrected details.
4. If the main picture changed, re-add the same sale URL with the new picture. The matching sale card updates instead of duplicating.
5. Click `Reviewed today`.

The public card should stay short. Do not copy the full EstateSales.NET description or photo gallery unless EstateSales.NET gives written permission.

## Use an authorized sales feed later

The default sync endpoint is:

```text
/api/estate-sales/sync
```

The site checks that endpoint once per day while it is open. The backend returns the cached/current sale board by default.

If EstateSales.NET gives Vern's written permission or an API, enable company-page checking on the server:

```bash
ESTATESALES_SYNC_ENABLED=true npm start
```

The feed should look like `data/estate-sales.example.json`:

```json
{
  "sales": [
    {
      "title": "Spring Lake Estate Sale",
      "url": "https://www.estatesales.net/MI/Spring-Lake/49456/4932078",
      "city": "Spring Lake, MI",
      "dateSummary": "Jun 1-3, 2026",
      "hours": "Mon-Tue 8:30 AM-5 PM; Wed 8:30 AM-3 PM",
      "status": "upcoming",
      "note": "Full details and photos open on the official EstateSales.NET listing.",
      "lastReviewed": "2026-05-31"
    }
  ]
}
```

## Back up staff data

1. Open the employee area.
2. Click `Export data`.
3. Keep the JSON file somewhere safe.

To restore it, use `Import exported JSON` in `Public Content`.
