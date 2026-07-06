#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env.lightspeed.local');
const tokenPath = path.join(root, 'tmp', 'lightspeed-token.json');

function parseEnv(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const idx = line.indexOf('=');
        return idx === -1 ? [line, ''] : [line.slice(0, idx), line.slice(idx + 1)];
      }),
  );
}

const env = { ...parseEnv(path.join(root, '.env.lightspeed.example')), ...parseEnv(envPath), ...process.env };
if (!fs.existsSync(tokenPath)) {
  console.error(`Missing ${tokenPath}. Run scripts/lightspeed-exchange-code.mjs first.`);
  process.exit(1);
}

const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
const accessToken = token.access_token;
const accountId = env.LIGHTSPEED_ACCOUNT_ID || token.account_id || token.accountID;
if (!accessToken || !accountId) {
  console.error('Missing access token or account id. Check token response and LIGHTSPEED_ACCOUNT_ID.');
  process.exit(1);
}

const apiBase = env.LIGHTSPEED_API_BASE || 'https://api.lightspeedapp.com/API/V3';
const limit = Number(process.argv[2] || 10);
const search = process.argv.slice(3).join(' ');

const url = new URL(`${apiBase}/Account/${accountId}/Item.json`);
url.searchParams.set('limit', String(limit));
if (search) url.searchParams.set('description', search);

const response = await fetch(url, {
  headers: {
    authorization: `Bearer ${accessToken}`,
    accept: 'application/json',
  },
});

const text = await response.text();
if (!response.ok) {
  console.error(`Lightspeed item pull failed: ${response.status} ${response.statusText}`);
  console.error(text);
  process.exit(1);
}

const data = JSON.parse(text);
const items = Array.isArray(data.Item) ? data.Item : data.Item ? [data.Item] : [];
const normalized = items.map((item) => ({
  itemID: item.itemID,
  description: item.description,
  categoryID: item.categoryID,
  priceDefault: item.Prices?.ItemPrice?.find?.((p) => p.useType === 'Default')?.amount ?? item.Prices?.ItemPrice?.[0]?.amount,
  customSku: item.customSku,
  upc: item.upc,
}));

console.log(JSON.stringify({ count: normalized.length, items: normalized }, null, 2));
