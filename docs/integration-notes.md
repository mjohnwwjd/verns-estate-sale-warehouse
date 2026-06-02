# Integration Notes

Research date: May 31, 2026.

## EstateSales.NET

Recommended implementation:

- Keep Vern's official EstateSales.NET company/profile URL visible on the public site:

```text
https://www.estatesales.net/companies/MI/Muskegon/49441/16076
```

- Staff paste the live sale URL in the employee `Public Content` tab.
- Staff can still manage public upcoming-sale cards in the employee `EstateSales.NET sale board`, but the site now prefers the backend daily-sync endpoint.
- Public customers see `Open Vern's EstateSales.NET Page` and, when a live sale URL is saved, `View Current Sale Photos on EstateSales.NET`.
- Public customers also see simple upcoming sale cards that link to the official EstateSales.NET listings.
- Sale cards support a staff-supplied main image. Use Vern-owned local photos or an image URL EstateSales.NET has approved for this use.
- Links open in new tabs.
- The public profile card uses the EstateSales.NET logo from their public website header as an outbound-link identifier.
- Only use the optional embed field if EstateSales.NET gives Vern's a written permission or official embed URL.
- The default daily-sync endpoint is `/api/estate-sales/sync`.
- EstateSales.NET company-page checking is controlled by the server env var `ESTATESALES_SYNC_ENABLED=true`. Leave it off unless EstateSales.NET gives written permission or an API.

Why:

- EstateSales.NET content and photos should not be copied, scraped, harvested, or republished without permission.
- EstateSales.NET's Terms of Service prohibit using automated tools to harvest or collect service information without express written permission.
- If EstateSales.NET says Vern's should not display their logo, remove `assets/img/estatesales-net-logo.svg` and fall back to the plain text button.
- A normal outbound link to Vern's official EstateSales.NET company page is the cleanest technical and legal path while waiting for permission.
- If EstateSales.NET provides an approved embed in the future, the site already has a safe iframe slot for that URL.
- If EstateSales.NET provides an approved data feed, the site already knows how to check a JSON endpoint once per day while open.
- If written permission covers Vern's own company page, the backend can check that page daily, update current sale cards, and drop expired listings no longer present on the company page.

Useful source:

```text
https://www.estatesales.net/terms-of-service
```

Approved sales-feed shape:

```json
{
  "sales": [
    {
      "id": "optional-stable-id",
      "title": "Spring Lake Estate Sale",
      "url": "https://www.estatesales.net/MI/Spring-Lake/49456/4932078",
      "city": "Spring Lake, MI",
      "dateSummary": "Jun 1-3, 2026",
      "hours": "Mon-Tue 8:30 AM-5 PM; Wed 8:30 AM-3 PM",
      "status": "upcoming",
      "note": "Full details and photos open on EstateSales.NET.",
      "lastReviewed": "2026-05-31"
    }
  ]
}
```

Valid statuses:

```text
upcoming
live
past
canceled
```

## Facebook Marketplace

Recommended implementation:

- Do not auto-post listings.
- Generate a title, description, and suggested price.
- Save listing photos locally in the staff workflow.
- Provide copy buttons.
- Track whether an employee posted manually.
- Track posted date, employee name, listed price, status, sold price, and closed-out date.

Why:

- Facebook Marketplace is designed around manual listing and Meta policy compliance.
- Public posting automation can violate platform rules or require unavailable permissions.
- The site keeps Vern's workflow fast without pretending to be an approved Marketplace API client.

Useful sources:

```text
https://www.facebook.com/help/130910837313345
https://transparency.meta.com/policies/ad-standards/commerce
https://developers.facebook.com/docs/graph-api
```

## Practical staff checklist before posting

- Confirm the item is allowed by Meta Commerce Policies.
- Do not post recalled items, weapons, medical products, animals, counterfeit goods, or restricted goods.
- Make the condition clear.
- Include pickup expectations.
- Mark the item posted manually in the dashboard.
- Close out sold or removed listings.

## AI photo endpoint

The static site includes a built-in local suggestion helper. For real image recognition, add a backend endpoint and paste its URL in the employee `Public Content` settings.

Expected request body:

```json
{
  "image": "data:image/jpeg;base64,...",
  "hint": "optional employee hint",
  "filename": "optional-file-name.jpg",
  "currentCategory": "featured"
}
```

Expected response:

```json
{
  "category": "clearance",
  "title": "Vintage brass lamp",
  "price": "$18",
  "tag": "Last chance",
  "note": "Test before posting; note shade condition."
}
```

Keep AI provider keys on that backend. Do not put API keys into this static website.
