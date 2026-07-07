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
const minQoh = args['min-qoh'] === undefined ? null : Number(args['min-qoh']);
const requireImages = args['require-images'] === 'true';
const outDir = path.resolve(root, args.out || path.join('output', 'lightspeed-estatesales', timestampSlug()));
if (args.clean === 'true') {
  fs.rmSync(outDir, { recursive: true, force: true });
}

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
const categoryFilter = resolveCategoryFilter(categories, args);

const itemParams = { limit };
if (search) itemParams.description = search;
if (categoryFilter?.categoryID) itemParams.categoryID = categoryFilter.categoryID;
if (minQoh !== null) itemParams.load_relations = '["ItemShops"]';

let items = await fetchAll('Item.json', 'Item', itemParams, limit);
items = items.filter((item) => String(item.archived) !== 'true');
if (minQoh !== null) {
  items = items.filter((item) => quantityOnHand(item) >= minQoh);
}
const itemIds = new Set(items.map((item) => String(item.itemID)));

const imagesByItemId = await fetchImagesByItemIds([...itemIds], maxImages);

fs.mkdirSync(outDir, { recursive: true });
const imageDir = path.join(outDir, 'images');
if (downloadImages) fs.mkdirSync(imageDir, { recursive: true });

const rows = [];
for (const item of items) {
  const itemID = String(item.itemID);
  const categoryName = categoryById.get(String(item.categoryID)) || 'Uncategorized';
  const images = imagesByItemId.get(itemID) || [];
  if (requireImages && images.length === 0) continue;

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
    quantityOnHand: quantityOnHand(item),
    price: priceDefault(item),
    customSku: item.customSku || '',
    upc: item.upc || '',
    imageCount: images.length,
    imageFiles: imageFiles.join('; '),
    uploadFiles: '',
  });
}

const uploadPackage = downloadImages ? createUploadPackage(rows, outDir) : null;

const csvPath = path.join(outDir, 'lightspeed-estatesales-review.csv');
const mdPath = path.join(outDir, 'lightspeed-estatesales-review.md');
const htmlPath = path.join(outDir, 'lightspeed-estatesales-review.html');
const uploadChecklistPath = path.join(outDir, 'estate-sales-upload-checklist.md');
const manifestPath = path.join(outDir, 'manifest.json');

fs.writeFileSync(csvPath, toCsv(rows));
fs.writeFileSync(mdPath, toMarkdown(rows));
fs.writeFileSync(htmlPath, toHtml(rows));
fs.writeFileSync(uploadChecklistPath, toUploadChecklist(rows));
fs.writeFileSync(manifestPath, JSON.stringify({
  createdAt: new Date().toISOString(),
  accountId,
  limit,
  search,
  categoryFilter,
  minQoh,
  requireImages,
  itemCount: rows.length,
  imageDownload: downloadImages,
  files: {
    csv: path.basename(csvPath),
    markdown: path.basename(mdPath),
    html: path.basename(htmlPath),
    uploadChecklist: path.basename(uploadChecklistPath),
    uploadFolders: uploadPackage ? 'upload-by-category/' : null,
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
  htmlPath,
  uploadChecklistPath,
  uploadByCategoryDir: uploadPackage?.uploadRoot || null,
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

async function fetchImagesByItemIds(itemIds, maxRecords = Infinity) {
  const grouped = new Map();
  let imageCount = 0;

  for (const itemID of itemIds) {
    if (imageCount >= maxRecords) break;

    const remaining = maxRecords - imageCount;
    const images = await fetchAll('Image.json', 'Image', { itemID, limit: 100 }, remaining);
    grouped.set(String(itemID), images);
    imageCount += images.length;
  }

  return grouped;
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

function quantityOnHand(item) {
  const itemShops = item.ItemShops?.ItemShop;
  const shops = Array.isArray(itemShops) ? itemShops : itemShops ? [itemShops] : [];
  const shopQuantities = shops
    .map((shop) => Number(shop.qoh))
    .filter(Number.isFinite);

  if (shopQuantities.length) return Math.max(...shopQuantities);

  const directQuantity = Number(item.qoh);
  return Number.isFinite(directQuantity) ? directQuantity : 0;
}

function resolveCategoryFilter(categories, parsedArgs) {
  if (parsedArgs['category-id']) {
    const match = categories.find((category) => String(category.categoryID) === String(parsedArgs['category-id']));
    if (!match) fail(`No Lightspeed category found for ID ${parsedArgs['category-id']}.`);
    return {
      categoryID: String(match.categoryID),
      name: match.fullPathName || match.name || `Category ${match.categoryID}`,
    };
  }

  const categoryCode = parsedArgs['category-code'];
  if (categoryCode) {
    const pattern = new RegExp(`\\(${escapeRegExp(categoryCode)}\\)`, 'i');
    const match = categories.find((category) => {
      const name = category.fullPathName || category.name || '';
      return pattern.test(name);
    });
    if (!match) fail(`No Lightspeed category found for code ${categoryCode}.`);
    return {
      categoryID: String(match.categoryID),
      name: match.fullPathName || match.name || `Category ${match.categoryID}`,
    };
  }

  const categoryName = parsedArgs['category-name'];
  if (categoryName) {
    const wanted = categoryName.toLowerCase();
    const match = categories.find((category) => {
      const name = String(category.fullPathName || category.name || '').toLowerCase();
      return name === wanted || name.includes(wanted);
    });
    if (!match) fail(`No Lightspeed category found for name ${categoryName}.`);
    return {
      categoryID: String(match.categoryID),
      name: match.fullPathName || match.name || `Category ${match.categoryID}`,
    };
  }

  return null;
}

function cleanTitle(value) {
  return String(value)
    .replace(/^\s*\([A-Z0-9]+\)\s*/i, '')
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
    ['Clothing, Jewelry & Accessories', ['purse', 'handbag', 'bag', 'wallet', 'clothing', 'coat', 'dress', 'hat', 'jewelry', 'necklace']],
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
    && !/^\s*\([a-z0-9]+\)/i.test(categoryName)
    && !/vern|estate$/i.test(categoryName);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createUploadPackage(rows, baseOutDir) {
  const uploadRoot = path.join(baseOutDir, 'upload-by-category');
  fs.mkdirSync(uploadRoot, { recursive: true });

  const categoryNames = [...new Set(rows.map((row) => row.suggestedEstateSalesCategory))]
    .sort((a, b) => a.localeCompare(b));
  const categoryFolderByName = new Map(categoryNames.map((categoryName, index) => {
    const folder = `${String(index + 1).padStart(2, '0')}-${safeSlug(categoryName)}`;
    return [categoryName, folder];
  }));
  const countersByCategory = new Map();

  for (const row of rows) {
    const categoryFolder = categoryFolderByName.get(row.suggestedEstateSalesCategory) || '99-estate-highlights';
    const categoryDir = path.join(uploadRoot, categoryFolder);
    fs.mkdirSync(categoryDir, { recursive: true });

    const imageFiles = String(row.imageFiles || '').split('; ').filter(Boolean);
    const uploadFiles = [];

    for (const [imageIndex, imageFile] of imageFiles.entries()) {
      const sourcePath = path.join(baseOutDir, imageFile);
      if (!fs.existsSync(sourcePath)) continue;

      const next = (countersByCategory.get(categoryFolder) || 0) + 1;
      countersByCategory.set(categoryFolder, next);

      const filename = `${String(next).padStart(3, '0')}-${safeSlug(row.title)}-${row.itemID}-${imageIndex + 1}.jpg`;
      const targetPath = path.join(categoryDir, filename);
      fs.copyFileSync(sourcePath, targetPath);
      uploadFiles.push(path.relative(baseOutDir, targetPath));
    }

    row.uploadFiles = uploadFiles.join('; ');
  }

  return {
    uploadRoot,
    categoryCount: categoryNames.length,
    imageCount: rows.reduce((total, row) => total + String(row.uploadFiles || '').split('; ').filter(Boolean).length, 0),
  };
}

function toCsv(rows) {
  const headers = [
    'itemID',
    'title',
    'estateSalesDescription',
    'lightspeedCategory',
    'suggestedEstateSalesCategory',
    'quantityOnHand',
    'price',
    'customSku',
    'upc',
    'imageCount',
    'imageFiles',
    'uploadFiles',
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

function toUploadChecklist(rows) {
  const grouped = groupBy(rows, (row) => row.suggestedEstateSalesCategory);
  const lines = [
    '# EstateSales.NET Upload Checklist',
    '',
    `Generated: ${new Date().toLocaleString()}`,
    '',
    'Upload one category folder at a time. Copy the public description from the review board or this file. Prices are internal reference unless Vern chooses to publish them.',
    '',
  ];

  for (const [category, categoryRows] of [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`## ${category}`, '');
    const categoryUploadFiles = categoryRows
      .flatMap((row) => String(row.uploadFiles || '').split('; ').filter(Boolean));
    const folder = categoryUploadFiles[0]?.split('/').slice(0, 2).join('/') || 'No upload folder';
    lines.push(`Folder: \`${folder}\``, '');

    for (const row of categoryRows) {
      lines.push(`- [ ] ${row.title}`);
      lines.push(`  - Description: ${row.estateSalesDescription}`);
      lines.push(`  - Quantity on hand: ${row.quantityOnHand}`);
      if (row.price) lines.push(`  - Internal price: $${row.price}`);
      lines.push(`  - Upload files: ${row.uploadFiles || 'No photo downloaded'}`);
    }

    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function toMarkdown(rows) {
  const grouped = groupBy(rows, (row) => row.suggestedEstateSalesCategory);
  const lines = [
    '# Lightspeed to EstateSales.NET Review',
    '',
    `Generated: ${new Date().toLocaleString()}`,
    '',
    'Use this as the review sheet before uploading to EstateSales.NET. Prices are included for internal reference only; remove prices from customer-facing EstateSales.NET captions unless Vern wants them shown.',
    '',
  ];

  for (const [category, categoryRows] of [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`## ${category}`, '');
    for (const row of categoryRows) {
      lines.push(`### ${row.title}`);
      lines.push(`- Lightspeed ID: ${row.itemID}`);
      lines.push(`- Lightspeed category: ${row.lightspeedCategory}`);
      lines.push(`- Quantity on hand: ${row.quantityOnHand}`);
      if (row.price) lines.push(`- Internal price: $${row.price}`);
      lines.push(`- EstateSales.NET description: ${row.estateSalesDescription}`);
      lines.push(`- Photos: ${row.imageFiles || `${row.imageCount} Lightspeed image(s), not downloaded`}`);
      if (row.uploadFiles) lines.push(`- Upload-ready files: ${row.uploadFiles}`);
      lines.push('');
    }
  }

  return `${lines.join('\n')}\n`;
}

function toHtml(rows) {
  const grouped = groupBy(rows, (row) => row.suggestedEstateSalesCategory);
  const categoryEntries = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
  const totalImages = rows.reduce((total, row) => total + row.imageCount, 0);
  const generatedAt = new Date().toLocaleString();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Lightspeed to EstateSales.NET Review</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #151515;
      --paper: #f8f2df;
      --gold: #f5c542;
      --red: #bb1f2d;
      --muted: #6b6658;
      --line: #d4c69a;
      --card: #fffaf0;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      background: var(--paper);
      color: var(--ink);
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.45;
    }

    header {
      background: #111;
      color: #fff8df;
      border-bottom: 6px solid var(--gold);
      padding: 28px clamp(18px, 4vw, 48px);
    }

    h1 {
      margin: 0;
      color: var(--gold);
      font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
      font-size: clamp(2rem, 7vw, 4.6rem);
      line-height: 0.95;
      text-transform: uppercase;
      letter-spacing: 0;
    }

    header p {
      max-width: 820px;
      margin: 14px 0 0;
      font-size: 1rem;
    }

    .stats {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 20px;
    }

    .pill {
      border: 2px solid var(--gold);
      border-radius: 999px;
      padding: 8px 12px;
      color: var(--gold);
      font-weight: 800;
      text-transform: uppercase;
    }

    main {
      padding: 24px clamp(14px, 3vw, 42px) 44px;
    }

    .category {
      margin: 0 0 34px;
    }

    h2 {
      display: inline-block;
      margin: 0 0 14px;
      border: 3px solid var(--red);
      border-radius: 999px;
      background: var(--red);
      color: #fff;
      padding: 7px 18px;
      font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
      font-size: 1.1rem;
      text-transform: uppercase;
      letter-spacing: 0;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }

    article {
      display: flex;
      flex-direction: column;
      border: 3px solid var(--ink);
      border-radius: 8px;
      overflow: hidden;
      background: var(--card);
      box-shadow: 7px 7px 0 rgba(0, 0, 0, 0.15);
    }

    .photo {
      display: grid;
      place-items: center;
      aspect-ratio: 4 / 3;
      background: #ded6be;
      border-bottom: 3px solid var(--ink);
    }

    .photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .no-photo {
      color: var(--muted);
      font-weight: 900;
      text-transform: uppercase;
      text-align: center;
      padding: 20px;
    }

    .body {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 10px;
      padding: 14px;
    }

    h3 {
      margin: 0;
      font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
      font-size: 1.55rem;
      line-height: 1.02;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    dl {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 4px 8px;
      margin: 0;
      font-size: 0.92rem;
    }

    dt {
      color: var(--muted);
      font-weight: 800;
    }

    dd {
      margin: 0;
      font-weight: 700;
    }

    textarea {
      width: 100%;
      min-height: 74px;
      resize: vertical;
      border: 2px solid var(--line);
      border-radius: 6px;
      padding: 9px;
      background: #fffdf6;
      color: var(--ink);
      font: 700 0.98rem Arial, Helvetica, sans-serif;
    }

    .actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: auto;
    }

    button {
      cursor: pointer;
      border: 0;
      border-radius: 6px;
      background: #111;
      color: var(--gold);
      padding: 10px;
      font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
      font-size: 0.95rem;
      text-transform: uppercase;
      box-shadow: 0 4px 0 #000;
    }

    button.secondary {
      background: var(--gold);
      color: #111;
      box-shadow: 0 4px 0 #b98615;
    }

    button:active {
      transform: translateY(2px);
      box-shadow: 0 2px 0 #000;
    }

    footer {
      padding: 20px clamp(14px, 3vw, 42px) 34px;
      color: var(--muted);
      font-weight: 700;
    }

    @media (max-width: 540px) {
      .actions { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <h1>EstateSales.NET Review Board</h1>
    <p>Review these Lightspeed items before posting. Photos and descriptions are staged locally only. Prices stay internal unless Vern wants them public.</p>
    <div class="stats">
      <span class="pill">${rows.length} items</span>
      <span class="pill">${totalImages} Lightspeed photos</span>
      <span class="pill">Generated ${escapeHtml(generatedAt)}</span>
    </div>
  </header>
  <main>
    ${categoryEntries.map(([category, categoryRows]) => `
      <section class="category">
        <h2>${escapeHtml(category)}</h2>
        <div class="grid">
          ${categoryRows.map((row) => itemCardHtml(row)).join('\n')}
        </div>
      </section>
    `).join('\n')}
  </main>
  <footer>
    Use copy buttons for EstateSales.NET titles and descriptions. Use the image filenames beside each card when uploading photos.
  </footer>
  <script>
    document.addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-copy]');
      if (!button) return;
      const target = document.getElementById(button.dataset.copy);
      if (!target) return;
      await navigator.clipboard.writeText(target.value || target.textContent || '');
      const original = button.textContent;
      button.textContent = 'Copied';
      setTimeout(() => { button.textContent = original; }, 900);
    });
  </script>
</body>
</html>`;
}

function itemCardHtml(row) {
  const imageFiles = String(row.imageFiles || '').split('; ').filter(Boolean);
  const primaryImage = imageFiles[0] || '';
  const descriptionId = `desc-${safeSlug(`${row.itemID}-${row.title}`)}`;
  const titleId = `title-${safeSlug(`${row.itemID}-${row.title}`)}`;

  return `<article>
    <div class="photo">
      ${primaryImage
    ? `<img src="${escapeAttribute(primaryImage)}" alt="${escapeAttribute(row.title)}">`
    : '<div class="no-photo">No Lightspeed photo</div>'}
    </div>
    <div class="body">
      <h3 id="${titleId}">${escapeHtml(row.title)}</h3>
      <dl>
        <dt>ID</dt><dd>${escapeHtml(row.itemID)}</dd>
        <dt>Qty on hand</dt><dd>${escapeHtml(row.quantityOnHand)}</dd>
        <dt>Price</dt><dd>${row.price ? `$${escapeHtml(row.price)}` : 'None'}</dd>
        <dt>Lightspeed</dt><dd>${escapeHtml(row.lightspeedCategory)}</dd>
        <dt>Photos</dt><dd>${imageFiles.length ? escapeHtml(imageFiles.join(', ')) : 'None'}</dd>
        <dt>Upload</dt><dd>${row.uploadFiles ? escapeHtml(row.uploadFiles) : 'No upload file'}</dd>
      </dl>
      <textarea id="${descriptionId}">${escapeHtml(row.estateSalesDescription)}</textarea>
      <div class="actions">
        <button class="secondary" data-copy="${descriptionId}" type="button">Copy EstateSales Description</button>
        <button data-copy="${titleId}" type="button">Copy Item Title</button>
      </div>
    </div>
  </article>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#096;');
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
