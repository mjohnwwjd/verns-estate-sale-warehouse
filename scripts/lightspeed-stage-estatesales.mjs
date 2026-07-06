#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env.lightspeed.local');
const tokenPath = path.join(root, 'tmp', 'lightspeed-token.json');

const args = parseArgs(process.argv.slice(2));
const limit = Number(args.limit || 25);
const search = args.search || '';
const downloadImages = args['skip-images'] !== 'true';
const maxImages = Number(args['max-images'] || 1000);
const outDir = path.resolve(root, args.out || path.join('output', 'lightspeed-estatesales', timestampSlug()));

const env = { ...parseEnv(path.join(root, '.env.lightspeed.example')), ...parseEnv(envPath), ...process.env };
let token = readToken();
token = await refreshTokenIfNeeded(token);
const apiBase = env.LIGHTSPEED_API_BASE || 'https://api.lightspeedapp.com/API/V3';
const accessToken = token.access_token;
const accountId = env.LIGHTSPEED_ACCOUNT_ID || token.account_id || token.accountID || await fetchAccountId();

if (!accessToken) fail(`Missing access token in ${tokenPath}. Run scripts/lightspeed-exchange-code.mjs first.`);
if (!accountId) fail('Missing Lightspeed account ID. Re-run scripts/lightspeed-exchange-code.mjs or set LIGHTSPEED_ACCOUNT_ID.');

const categories = await fetchAll('Category.json', 'Category', { limit: 100 });
const categoryById = new Map(categories.map((category) => [
  String(category.categoryID),
  category.fullPathName || category.name || `Category ${category.categoryID}`,
]));

const itemParams = { limit };
if (search) itemParams.description = search;
const items = await fetchAll('Item.json', 'Item', itemParams, limit);
const itemIds = new Set(items.map((item) => String(item.itemID)));

const allImages = await fetchAll('Image.json', 'Image', { limit: 100 }, maxImages);
const imagesByItemId = groupBy(
  allImages.filter((image) => itemIds.has(String(image.itemID))),
  (image) => String(image.itemID),
);

fs.mkdirSync(outDir, { recursive: true });
const imageDir = path.join(outDir, 'images');
if (downloadImages) fs.mkdirSync(imageDir, { recursive: true });

const rows = [];
for (const item of items) {
  const itemID = String(item.itemID);
  const categoryName = categoryById.get(String(item.categoryID)) || 'Uncategorized';
  const images = imagesByItemId.get(itemID) || [];
  const imageFiles = [];

  if (downloadImages) {
    for (const [index, image] of images.entries()) {
      const imageUrl = buildImageUrl(image, 1400);
      if (!imageUrl) continue;

      const filename = `${safeSlug(item.description || `item-${itemID}`)}-${itemID}-${index + 1}.jpg`;
      const filePath = path.join(imageDir, filename);
      await downloadFile(imageUrl, filePath);
      imageFiles.push(path.relative(outDir, filePath));
    }
  }

  rows.push({
    itemID,
    title: cleanTitle(item.description || `Lightspeed Item ${itemID}`),
    estateSalesDescription: cleanEstateDescription(item.description || ''),
    categoryID: item.categoryID || '',
    lightspeedCategory: categoryName,
    suggestedEstateSalesCategory: mapEstateSalesCategory(categoryName, item.description || ''),
    price: priceDefault(item),
    customSku: item.customSku || '',
    upc: item.upc || '',
    imageCount: images.length,
    imageFiles: imageFiles.join('; '),
  });
}

const csvPath = path.join(outDir, 'lightspeed-estatesales-review.csv');
const mdPath = path.join(outDir, 'lightspeed-estatesales-review.md');
const manifestPath = path.join(outDir, 'manifest.json');

fs.writeFileSync(csvPath, toCsv(rows));
fs.writeFileSync(mdPath, toMarkdown(rows));
fs.writeFileSync(manifestPath, JSON.stringify({
  createdAt: new Date().toISOString(),
  accountId,
  limit,
  search,
  itemCount: rows.length,
  imageDownload: downloadImages,
  files: {
    csv: path.basename(csvPath),
    markdown: path.basename(mdPath),
    images: downloadImages ? 'images/' : null,
  },
}, null, 2));

console.log(JSON.stringify({
  ok: true,
  itemCount: rows.length,
  imageCount: rows.reduce((total, row) => total + row.imageCount, 0),
  outDir,
  csvPath,
  mdPath,
}, null, 2));

function parseArgs(rawArgs) {
  const parsed = {};
  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = rawArgs[index + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = 'true';
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

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

function readToken() {
  if (!fs.existsSync(tokenPath)) {
    fail(`Missing ${tokenPath}. Run scripts/lightspeed-exchange-code.mjs first.`);
  }
  return JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
}

async function refreshTokenIfNeeded(currentToken) {
  if (!currentToken.refresh_token || !isTokenExpired(currentToken)) return currentToken;

  const tokenUrl = env.LIGHTSPEED_TOKEN_URL || 'https://cloud.lightspeedapp.com/auth/oauth/token';
  const body = new URLSearchParams({
    client_id: env.LIGHTSPEED_CLIENT_ID,
    client_secret: env.LIGHTSPEED_CLIENT_SECRET,
    refresh_token: currentToken.refresh_token,
    grant_type: 'refresh_token',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });

  const text = await response.text();
  if (!response.ok) fail(`Lightspeed token refresh failed ${response.status} ${response.statusText}: ${text}`);

  const refreshed = JSON.parse(text);
  const nextToken = {
    ...currentToken,
    ...refreshed,
    refresh_token: refreshed.refresh_token || currentToken.refresh_token,
    createdAt: new Date().toISOString(),
  };

  fs.writeFileSync(tokenPath, JSON.stringify(nextToken, null, 2), { mode: 0o600 });
  return nextToken;
}

function isTokenExpired(currentToken) {
  if (!currentToken.createdAt || !currentToken.expires_in) return false;

  const createdAt = new Date(currentToken.createdAt).getTime();
  const expiresAt = createdAt + (Number(currentToken.expires_in) * 1000);
  return Date.now() > expiresAt - (2 * 60 * 1000);
}

async function fetchAccountId() {
  const data = await apiJson('Account.json');
  const account = Array.isArray(data.Account) ? data.Account[0] : data.Account;
  return account?.accountID || account?.accountId || account?.id || '';
}

async function fetchAll(endpoint, nodeName, params = {}, maxRecords = Infinity) {
  const results = [];
  let url = buildApiUrl(endpoint, params);

  while (url && results.length < maxRecords) {
    const data = await apiJson(url);
    const value = data[nodeName];
    const page = Array.isArray(value) ? value : value ? [value] : [];
    results.push(...page.slice(0, maxRecords - results.length));

    const next = data['@attributes']?.next;
    url = next ? normalizeNextUrl(next) : '';
  }

  return results;
}

async function apiJson(endpointOrUrl) {
  const url = endpointOrUrl.startsWith('http') ? endpointOrUrl : buildApiUrl(endpointOrUrl);
  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: 'application/json',
    },
  });

  const text = await response.text();
  if (!response.ok) {
    fail(`Lightspeed API failed ${response.status} ${response.statusText}: ${text}`);
  }

  return JSON.parse(text);
}

function buildApiUrl(endpoint, params = {}) {
  const cleanEndpoint = endpoint.replace(/^\//, '');
  const url = new URL(cleanEndpoint.startsWith('Account/')
    ? `${apiBase}/${cleanEndpoint}`
    : `${apiBase}/Account/${accountId}/${cleanEndpoint}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }

  return url.toString();
}

function normalizeNextUrl(next) {
  if (next.startsWith('http')) return next;
  if (next.startsWith('/')) return `https://api.lightspeedapp.com${next}`;
  return `${apiBase}/${next.replace(/^\//, '')}`;
}

function groupBy(values, getKey) {
  const grouped = new Map();
  for (const value of values) {
    const key = getKey(value);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(value);
  }
  return grouped;
}

function buildImageUrl(image, width) {
  if (!image?.baseImageURL || !image?.publicID) return '';
  const base = image.baseImageURL.endsWith('/') ? image.baseImageURL : `${image.baseImageURL}/`;
  return `${base}w_${width}/${image.publicID}.jpg`;
}

async function downloadFile(url, filePath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download ${url}: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
}

function priceDefault(item) {
  const prices = item.Prices?.ItemPrice;
  const priceList = Array.isArray(prices) ? prices : prices ? [prices] : [];
  return priceList.find((price) => price.useType === 'Default')?.amount || priceList[0]?.amount || '';
}

function cleanTitle(value) {
  return String(value)
    .replace(/^\s*\([A-Z]\)\s*/i, '')
    .replace(/\s+/g, ' ')
    .replace(/\buntested\b/gi, '')
    .trim();
}

function cleanEstateDescription(value) {
  const title = cleanTitle(value);
  return title.length > 110 ? `${title.slice(0, 107).trim()}...` : title;
}

function mapEstateSalesCategory(categoryName, description) {
  const text = `${categoryName} ${description}`.toLowerCase();
  const rules = [
    ['Lamps & Lighting', ['lamp', 'lighting', 'chandelier', 'sconce', 'torch', 'torchiere']],
    ['Sporting Goods', ['sport', 'bike', 'golf', 'fishing', 'fishfinder', 'exercise', 'dumbbell', 'hockey']],
    ['Furniture, Mirrors & Rugs', ['furniture', 'chair', 'stool', 'table', 'dresser', 'cabinet', 'bookcase', 'mirror', 'rug', 'sofa']],
    ['Glassware, Pottery & China', ['glass', 'pyrex', 'pottery', 'china', 'ceramic', 'lladro', 'vase', 'bowl']],
    ['Art, Clocks, Books & Paper', ['art', 'clock', 'painting', 'print', 'book', 'comic', 'paper', 'record', 'lp']],
    ['Tools, Garage & Outdoor', ['tool', 'garage', 'outdoor', 'garden', 'power', 'saw', 'drill']],
    ['Toys, Dolls & Seasonal', ['toy', 'doll', 'seasonal', 'christmas', 'holiday']],
    ['Electronics & Appliances', ['electronic', 'stereo', 'speaker', 'appliance', 'vacuum', 'dispenser', 'refrigerator', 'fridge', 'freezer']],
  ];

  for (const [mapped, words] of rules) {
    if (words.some((word) => wordMatches(text, word))) return mapped;
  }

  return isPublicCategoryName(categoryName) ? categoryName : 'Estate Highlights';
}

function wordMatches(text, word) {
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(word)}s?($|[^a-z0-9])`, 'i').test(text);
}

function isPublicCategoryName(categoryName) {
  return categoryName
    && categoryName !== 'Uncategorized'
    && !/^\W*\([a-z]\)/i.test(categoryName)
    && !/vern|estate$/i.test(categoryName);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toCsv(rows) {
  const headers = [
    'itemID',
    'title',
    'estateSalesDescription',
    'lightspeedCategory',
    'suggestedEstateSalesCategory',
    'price',
    'customSku',
    'upc',
    'imageCount',
    'imageFiles',
  ];

  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
  ].join('\n');
}

function csvCell(value) {
  const string = String(value ?? '');
  return /[",\n]/.test(string) ? `"${string.replace(/"/g, '""')}"` : string;
}

function toMarkdown(rows) {
  const grouped = groupBy(rows, (row) => row.suggestedEstateSalesCategory);
  const lines = [
    '# Lightspeed to EstateSales.net Review',
    '',
    `Generated: ${new Date().toLocaleString()}`,
    '',
    'Use this as the review sheet before uploading to EstateSales.net. Prices are included for internal reference only; remove prices from customer-facing EstateSales.net captions unless Vern wants them shown.',
    '',
  ];

  for (const [category, categoryRows] of [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`## ${category}`, '');
    for (const row of categoryRows) {
      lines.push(`### ${row.title}`);
      lines.push(`- Lightspeed ID: ${row.itemID}`);
      lines.push(`- Lightspeed category: ${row.lightspeedCategory}`);
      if (row.price) lines.push(`- Internal price: $${row.price}`);
      lines.push(`- EstateSales.net description: ${row.estateSalesDescription}`);
      lines.push(`- Photos: ${row.imageFiles || `${row.imageCount} Lightspeed image(s), not downloaded`}`);
      lines.push('');
    }
  }

  return `${lines.join('\n')}\n`;
}

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
}

function safeSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70) || 'item';
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
