# Lightspeed to EstateSales.net Bridge

This is the safe workflow for entering an item once in Lightspeed and reusing that information for EstateSales.net sale photos.

## Goal

Use Lightspeed as the source of truth for:

- item photo
- item name / description
- category
- price, if needed internally
- notes

Then stage that information into an EstateSales.net upload/review pack so we are not typing the same descriptions twice.

## Current Safe Architecture

1. Add the item in Lightspeed.
2. Pull your own Lightspeed item data through the official Lightspeed Retail R-Series API.
3. Generate a local review folder with renamed photos and short EstateSales.net-ready descriptions.
4. Upload or update EstateSales.net through the normal editor workflow.
5. Do not publish test sales.

EstateSales.net does not appear to provide a public upload API for this account flow, so we should not scrape or force hidden endpoints unless EstateSales.net gives permission. The practical bridge is: Lightspeed API in, EstateSales.net reviewed browser workflow out.

## Lightspeed API Client Signup

Official signup page:

`https://cloud.lightspeedapp.com/oauth/register.php`

Use these values:

- Integration Name: `Estates by Vern Sale Bridge`
- Website: `https://estatesbyvern.com`
- Redirect URI: `https://estatesbyvern.com/lightspeed/callback/`

The signup form also requires contact name, email, phone, and terms acceptance. Submit only when you are ready to create the client ID and secret.

Important: the client secret is private. Do not paste it into chat, Facebook, EstateSales.net, or public website code.

## Local Setup After Signup

Copy the example file:

```sh
cp .env.lightspeed.example .env.lightspeed.local
```

Fill in:

```sh
LIGHTSPEED_CLIENT_ID=...
LIGHTSPEED_CLIENT_SECRET=...
```

Leave this for now:

```sh
LIGHTSPEED_SCOPE=employee:inventory_read
```

Start narrow. If categories or images require an additional scope, add only the exact scope needed after testing.

## Connect the Store

Generate the Lightspeed authorization link:

```sh
node scripts/lightspeed-auth-url.mjs
```

Open the printed URL while logged into Lightspeed. Lightspeed redirects to:

```text
https://estatesbyvern.com/lightspeed/callback/?code=...
```

Copy the full redirected URL, then exchange the code locally:

```sh
node scripts/lightspeed-exchange-code.mjs "PASTE_THE_FULL_REDIRECT_URL_HERE"
```

This writes:

```text
tmp/lightspeed-token.json
```

That file is ignored by Git and must stay private.

## First Pull Test

After token exchange, try:

```sh
node scripts/lightspeed-pull-items.mjs 10
```

To search by description:

```sh
node scripts/lightspeed-pull-items.mjs 10 "test"
```

## EstateSales.net Test Flow

Create a private/unpublished test sale:

- Sale title: `Mike's Garage Sale`
- Do not publish it.
- Add one category card.
- Upload one or two test item photos.

The first bridge test should prove:

1. Lightspeed item name comes across.
2. Lightspeed photo can be staged locally.
3. Lightspeed category can map to an EstateSales.net section.
4. EstateSales.net description stays short and sales-friendly.
5. Nothing is published accidentally.

## Suggested Category Mapping

Start with a small mapping table:

- Lamps -> Lamps & Lighting
- Furniture -> Furniture, Mirrors & Rugs
- Glassware -> Glassware, Pottery & China
- Tools -> Tools, Garage & Outdoor
- Toys -> Toys, Dolls & Seasonal
- Art -> Art, Clocks & Paper
- Outdoor -> Garden & Patio Pieces

## What Not To Do

- Do not store the Lightspeed client secret in public website files.
- Do not commit token files.
- Do not publish EstateSales.net test listings.
- Do not scrape EstateSales.net unless they explicitly approve it.
- Do not use broad Lightspeed permissions until narrow read-only access fails.

## Sources

- Lightspeed R-Series API registration and OAuth flow: `https://retail-support.lightspeedhq.com/hc/en-us/articles/229129268-Integrating-with-the-Lightspeed-Retail-POS-R-Series-API`
- Lightspeed spreadsheet import/export fallback: `https://retail-support.lightspeedhq.com/hc/en-us/articles/115004963387-Importing-and-updating-items-using-a-spreadsheet`
