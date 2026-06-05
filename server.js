const http = require("node:http");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");

loadLocalEnv();

const PORT = Number(process.env.PORT || 8080);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const SALES_SEED_FILE = path.join(DATA_DIR, "estate-sales.example.json");
const SALES_CACHE_FILE = path.join(DATA_DIR, "estate-sales-cache.json");
const DEFAULT_COMPANY_URL = "https://www.estatesales.net/companies/MI/Muskegon/49441/16076";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 25000);
const ESTATESALES_SYNC_ENABLED = /^true$/i.test(process.env.ESTATESALES_SYNC_ENABLED || "");
const ESTATESALES_COMPANY_URL = process.env.ESTATESALES_COMPANY_URL || DEFAULT_COMPANY_URL;
const MAX_BODY_BYTES = 8 * 1024 * 1024;
const PRICING_CATEGORIES = [
  "furniture",
  "decor",
  "lamps",
  "tools",
  "glassware",
  "collectibles",
  "housewares",
  "appliances",
  "homegoods",
  "clothing",
  "exercise",
  "medical",
  "kids",
  "electronics",
  "clocks",
  "jewelry",
  "books",
  "outdoor",
  "sporting",
  "seasonal",
  "auto",
  "scratch-dent"
];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "camera=(self), microphone=(), geolocation=()"
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      sendJson(res, 204, {});
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (url.pathname === "/api/status" && req.method === "GET") {
      sendJson(res, 200, {
        ok: true,
        openAiConfigured: hasUsableOpenAiKey(),
        estateSalesSyncEnabled: ESTATESALES_SYNC_ENABLED,
        estateSalesCompanyUrl: ESTATESALES_COMPANY_URL,
        model: OPENAI_MODEL
      });
      return;
    }

    if (url.pathname === "/api/estate-sales/sync" && req.method === "GET") {
      const result = await syncEstateSales();
      sendJson(res, 200, result);
      return;
    }

    if (url.pathname === "/api/price-photo" && req.method === "POST") {
      const body = await getRequestBody(req);
      const { images, fields } = parseMultipartForm(body, req.headers["content-type"] || "");
      const result = await pricePhoto(images, fields);
      sendJson(res, 200, { result });
      return;
    }

    await serveStatic(req, res, url);
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: publicError(error) });
  }
});

server.listen(PORT, () => {
  console.log(`Vern's website running at http://127.0.0.1:${PORT}/`);
  console.log(`OpenAI photo pricing: ${hasUsableOpenAiKey() ? "configured" : "not configured"}`);
  console.log(`EstateSales.NET page sync: ${ESTATESALES_SYNC_ENABLED ? "enabled" : "permission-gated/off"}`);
});

async function syncEstateSales() {
  const cached = await readSalesCache();

  if (!ESTATESALES_SYNC_ENABLED) {
    return {
      sales: cached.sales,
      source: cached.source || "seed",
      checkedAt: new Date().toISOString(),
      syncAllowed: false,
      message: "Automatic EstateSales.NET page checking is off until permission/API access is configured on the server."
    };
  }

  try {
    const response = await fetch(ESTATESALES_COMPANY_URL, {
      headers: {
        "Accept": "text/html",
        "User-Agent": "VernsEstateSaleWarehouse/1.0 (+official company owner sync)"
      }
    });
    if (!response.ok) throw new Error(`EstateSales.NET returned ${response.status}.`);
    const html = await response.text();
    const sales = extractEstateSalesFromCompanyPage(html);
    const payload = {
      sales: sales.length ? sales : cached.sales,
      source: sales.length ? "estatesales-company-page" : cached.source || "seed",
      checkedAt: new Date().toISOString(),
      syncAllowed: true,
      message: sales.length
        ? `Updated ${sales.length} sale link${sales.length === 1 ? "" : "s"} from Vern's EstateSales.NET company page.`
        : "No active sale links were found on Vern's EstateSales.NET company page; keeping the last saved list."
    };
    await writeSalesCache(payload);
    return payload;
  } catch (error) {
    return {
      sales: cached.sales,
      source: cached.source || "cache",
      checkedAt: new Date().toISOString(),
      syncAllowed: true,
      message: `EstateSales.NET sync failed, so the site kept the last saved list. ${error.message}`
    };
  }
}

function extractEstateSalesFromCompanyPage(html) {
  const anchors = [];
  const anchorPattern = /<a\b[^>]*href=["']([^"']*\/MI\/[^"']*\/\d{5,}[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorPattern.exec(html))) {
    const url = absoluteEstateSalesUrl(match[1]);
    if (!url) continue;
    const id = estateSaleIdFromUrl(url);
    if (!id) continue;
    const text = cleanHtml(match[2]);
    const context = cleanHtml(html.slice(Math.max(0, match.index - 500), match.index + 1400));
    anchors.push({ id, url, text, context });
  }

  const byId = new Map();
  anchors.forEach((anchor) => {
    const existing = byId.get(anchor.id) || { id: anchor.id, url: anchor.url, texts: [], context: "" };
    existing.texts.push(anchor.text);
    existing.context = `${existing.context} ${anchor.context}`.slice(0, 3000);
    byId.set(anchor.id, existing);
  });

  return Array.from(byId.values()).map((entry) => {
    const title = chooseSaleTitle(entry.texts) || "Estate sale";
    return {
      id: `estate-sale-${entry.id}`,
      title,
      url: entry.url,
      city: firstMatch(entry.context, /([A-Z][A-Za-z.\s'-]+,\s*MI\s*\d{5})/) || "",
      dateSummary: firstMatch(entry.context, /([A-Z][a-z]{2}\s+\d{1,2}(?:,\s*\d{1,2})*(?:\s*,?\s*\d{4})?)/) || "",
      hours: firstMatch(entry.context, /(\d{1,2}:\d{2}\s*(?:am|pm)\s*to\s*\d{1,2}(?::\d{2})?\s*(?:am|pm))/i) || "",
      status: "upcoming",
      note: "Full details and photos open on the official EstateSales.NET listing.",
      lastReviewed: todayIsoDate()
    };
  });
}

async function pricePhoto(images, fields) {
  const startedAt = Date.now();
  const image = images.map(uploadedImageToVisionImage).filter(Boolean)[0];
  const settings = pricingSettingsFromFields(fields);

  if (!image) {
    return fallbackPricing({
      itemName: fields.hint || "Photo upload unreadable",
      category: fields.category || "furniture",
      condition: fields.condition || "good",
      notes: "Retake the photo or choose a JPG, PNG, or WebP image.",
      confidence: "Low",
      priceBasis: "No readable image was uploaded.",
      source: "fallback"
    }, settings, startedAt);
  }

  if (!hasUsableOpenAiKey()) {
    return fallbackPricing({
      itemName: fields.hint || "Estate sale warehouse item",
      category: fields.category || "furniture",
      condition: fields.condition || "good",
      notes: "OPENAI_API_KEY is not configured for this server.",
      confidence: "Low",
      priceBasis: "Local category fallback.",
      source: "fallback"
    }, settings, startedAt);
  }

  const content = [
    {
      type: "input_text",
      text:
        "You are Vern's Estate Sale Warehouse thrift-store pricing assistant. " +
        "Identify the photographed item and estimate practical resale value for a discount estate-sale warehouse. " +
        "Use general resale knowledge only; do not claim live access to EstateSales.NET, eBay, Facebook Marketplace, or retail databases. " +
        `Employee hint: ${fields.hint || "none"}. Category selected by employee: ${fields.category || "none"}. Condition selected by employee: ${fields.condition || "good"}. ` +
        "Return ONLY valid JSON with these keys: itemName, category, condition, marketValue, retailValue, estimatedLow, estimatedHigh, confidence, priceBasis, notes, marketplaceTitle, marketplaceDescription. " +
        `category must be one of ${PRICING_CATEGORIES.join(", ")}. ` +
        "condition must be one of new, excellent, good, fair, repair. " +
        "Use numbers only for marketValue, retailValue, estimatedLow, and estimatedHigh. " +
        "marketValue means likely local resale value. retailValue means estimated original/new retail if knowable. Keep notes short and practical for store staff."
    },
    {
      type: "input_image",
      image_url: `data:${image.mimeType};base64,${image.base64}`,
      detail: "auto"
    }
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_output_tokens: 900,
        input: [{ role: "user", content }]
      })
    });

    const rawText = await response.text();
    if (!response.ok) {
      throw new Error(normalizeProviderErrorMessage(rawText, "Photo pricing request was rejected."));
    }

    const payload = JSON.parse(rawText);
    const parsed = parseJsonText(extractTextFromResponse(payload));
    return normalizePricingResult(parsed, settings, {
      modelUsed: OPENAI_MODEL,
      elapsedMs: Date.now() - startedAt,
      source: "openai"
    });
  } catch (error) {
    return fallbackPricing({
      itemName: fields.hint || "Estate sale warehouse item",
      category: fields.category || "furniture",
      condition: fields.condition || "good",
      notes: error.name === "AbortError" ? "Photo pricing timed out. Try again with one clear photo." : error.message,
      confidence: "Low",
      priceBasis: "AI pricing failed; local category fallback used.",
      source: "fallback"
    }, settings, startedAt);
  } finally {
    clearTimeout(timeout);
  }
}

function normalizePricingResult(result, settings, meta = {}) {
  const category = allowedCategory(result.category, result.itemName, result.marketplaceTitle, result.notes);
  const condition = allowedCondition(result.condition);
  const fallbackRange = fallbackRangeFor(category, condition);
  const marketValue = positiveNumber(result.marketValue) || positiveNumber(result.likelySellingPrice) || average(fallbackRange);
  const retailValue = positiveNumber(result.retailValue) || Math.round(marketValue * 1.6);
  const basisValue = settings.defaultPricingBasis === "retail" && retailValue > 0 ? retailValue : marketValue;
  const storePrice = roundPrice(basisValue * (1 - settings.thriftMarkdownPercent / 100));
  const marketplacePrice = roundPrice(marketValue * (settings.marketplacePercent / 100));
  const clearancePrice = roundPrice(basisValue * (1 - settings.clearanceMarkdownPercent / 100));
  const itemName = String(result.itemName || "Estate sale warehouse item").slice(0, 90);

  return {
    itemName,
    category,
    condition,
    marketValue,
    retailValue,
    estimatedLow: positiveNumber(result.estimatedLow) || fallbackRange[0],
    estimatedHigh: positiveNumber(result.estimatedHigh) || fallbackRange[1],
    storePrice,
    marketplacePrice,
    clearancePrice,
    confidence: ["High", "Medium", "Low"].includes(result.confidence) ? result.confidence : "Low",
    priceBasis: String(result.priceBasis || "AI visual estimate. Verify condition and demand before tagging.").slice(0, 220),
    notes: String(result.notes || "Check condition, measurements, and visible flaws before pricing.").slice(0, 260),
    marketplaceTitle: String(result.marketplaceTitle || `${itemName} - Vern's Estate Sale Warehouse`).slice(0, 100),
    marketplaceDescription: String(result.marketplaceDescription || `${itemName} available at Vern's Estate Sale Warehouse. See photos and inspect in person before buying.`).slice(0, 700),
    ...meta
  };
}

function fallbackPricing(base, settings, startedAt) {
  const category = allowedCategory(base.category, base.itemName, base.notes);
  const condition = allowedCondition(base.condition);
  const range = fallbackRangeFor(category, condition);
  return normalizePricingResult({
    ...base,
    category,
    condition,
    marketValue: average(range),
    retailValue: Math.round(average(range) * 1.6),
    estimatedLow: range[0],
    estimatedHigh: range[1]
  }, settings, {
    modelUsed: "none",
    elapsedMs: Date.now() - startedAt,
    source: "fallback"
  });
}

function pricingSettingsFromFields(fields) {
  return {
    thriftMarkdownPercent: clampPercent(fields.thriftMarkdownPercent, 50),
    marketplacePercent: clampPercent(fields.marketplacePercent, 90, 10, 150),
    clearanceMarkdownPercent: clampPercent(fields.clearanceMarkdownPercent, 75),
    defaultPricingBasis: fields.defaultPricingBasis === "retail" ? "retail" : "market"
  };
}

function fallbackRangeFor(category, condition) {
  const ranges = {
    furniture: [25, 180],
    decor: [8, 45],
    lamps: [8, 55],
    tools: [6, 75],
    glassware: [3, 40],
    collectibles: [5, 90],
    housewares: [3, 35],
    appliances: [15, 120],
    homegoods: [5, 50],
    clothing: [3, 30],
    exercise: [8, 70],
    medical: [8, 65],
    kids: [4, 45],
    electronics: [10, 90],
    clocks: [8, 65],
    jewelry: [4, 60],
    books: [1, 18],
    outdoor: [8, 80],
    sporting: [5, 65],
    seasonal: [3, 45],
    auto: [5, 60],
    "scratch-dent": [2, 30]
  };
  const multipliers = { new: 1.25, excellent: 1.12, good: 1, fair: 0.72, repair: 0.42 };
  const range = ranges[category] || ranges.furniture;
  const multiplier = multipliers[condition] || 1;
  return [Math.max(1, Math.round(range[0] * multiplier)), Math.max(2, Math.round(range[1] * multiplier))];
}

async function readSalesCache() {
  for (const file of [SALES_CACHE_FILE, SALES_SEED_FILE]) {
    try {
      const data = JSON.parse(await fsp.readFile(file, "utf8"));
      return {
        sales: Array.isArray(data.sales) ? data.sales : [],
        source: data.source || (file === SALES_SEED_FILE ? "seed" : "cache")
      };
    } catch {
      // Try the next source.
    }
  }
  return { sales: [], source: "empty" };
}

async function writeSalesCache(payload) {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.writeFile(SALES_CACHE_FILE, `${JSON.stringify(payload, null, 2)}\n`);
}

async function serveStatic(req, res, url) {
  let filePath = decodeURIComponent(url.pathname);
  if (filePath === "/") filePath = "/index.html";
  const resolved = path.normalize(path.join(ROOT, filePath));

  if (!resolved.startsWith(ROOT)) {
    sendText(res, 403, "text/plain; charset=utf-8", "Forbidden");
    return;
  }

  let stat;
  try {
    stat = await fsp.stat(resolved);
  } catch {
    sendText(res, 404, "text/plain; charset=utf-8", "Not found");
    return;
  }

  const finalPath = stat.isDirectory() ? path.join(resolved, "index.html") : resolved;
  const content = await fsp.readFile(finalPath);
  sendText(res, 200, mimeTypes[path.extname(finalPath).toLowerCase()] || "application/octet-stream", req.method === "HEAD" ? "" : content);
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    req.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_BODY_BYTES) {
        const error = new Error("Request is too large. Try one smaller photo.");
        error.statusCode = 413;
        reject(error);
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function parseMultipartForm(body, contentType) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) return { images: [], fields: {} };

  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
  const images = [];
  const fields = {};
  let start = body.indexOf(boundary);

  while (start !== -1) {
    const partStart = start + boundary.length + 2;
    const nextBoundary = body.indexOf(boundary, partStart);
    if (nextBoundary === -1) break;

    const part = body.subarray(partStart, nextBoundary - 2);
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd !== -1) {
      const header = part.subarray(0, headerEnd).toString("utf8");
      const content = part.subarray(headerEnd + 4);
      const nameMatch = header.match(/name="([^"]+)"/i);
      const filenameMatch = header.match(/filename="([^"]+)"/i);
      const typeMatch = header.match(/Content-Type:\s*([^\r\n]+)/i);
      const fieldName = nameMatch ? nameMatch[1] : "";
      const mimeType = typeMatch ? typeMatch[1].trim() : "application/octet-stream";

      if (isImageUploadField(fieldName) && filenameMatch && mimeType.startsWith("image/") && content.length > 0) {
        images.push({ filename: filenameMatch[1], mimeType, base64: content.toString("base64") });
      } else if (fieldName && !filenameMatch) {
        fields[fieldName] = content.toString("utf8").trim();
      }
    }
    start = nextBoundary;
  }

  return { images, fields };
}

function isImageUploadField(fieldName) {
  return fieldName === "images" || fieldName === "photo" || fieldName === "image";
}

function sendJson(res, statusCode, payload) {
  sendText(res, statusCode, "application/json; charset=utf-8", JSON.stringify(payload));
}

function sendText(res, statusCode, contentType, content) {
  res.writeHead(statusCode, { "Content-Type": contentType, ...securityHeaders });
  res.end(content);
}

function hasUsableOpenAiKey() {
  return looksLikeOpenAiKey(OPENAI_API_KEY);
}

function looksLikeOpenAiKey(value) {
  const key = String(value || "").trim();
  return key.startsWith("sk-") && key.length >= 40 && !/YOUR_|HERE|placeholder|example|changeme/i.test(key);
}

function uploadedImageToVisionImage(image) {
  const mimeType = normalizeImageMimeType(image?.mimeType);
  const base64 = String(image?.base64 || "").replace(/\s/g, "");
  if (!mimeType || !validBase64Payload(base64)) return null;
  return { filename: image.filename || "photo.jpg", mimeType, base64 };
}

function normalizeImageMimeType(mimeType) {
  const clean = String(mimeType || "").split(";")[0].trim().toLowerCase();
  if (clean === "image/jpg") return "image/jpeg";
  return ["image/jpeg", "image/png", "image/webp"].includes(clean) ? clean : "";
}

function validBase64Payload(base64, minBytes = 32) {
  const clean = String(base64 || "").replace(/\s/g, "");
  if (!clean || clean.length % 4 === 1 || !/^[A-Za-z0-9+/]+={0,2}$/.test(clean)) return false;
  try {
    return Buffer.from(clean, "base64").length >= minBytes;
  } catch {
    return false;
  }
}

function extractTextFromResponse(data) {
  if (typeof data.output_text === "string") return data.output_text;
  const message = data.output?.find((item) => item.type === "message");
  const textPart = message?.content?.find((item) => item.type === "output_text");
  return textPart?.text || "";
}

function parseJsonText(text) {
  const trimmed = String(text || "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse(fenced ? fenced[1].trim() : trimmed);
}

function normalizeProviderErrorMessage(raw, fallback) {
  try {
    const payload = JSON.parse(raw);
    return payload.error?.message || payload.message || fallback;
  } catch {
    return String(raw || fallback).slice(0, 240);
  }
}

function publicError(error) {
  return String(error?.message || "Server error").slice(0, 300);
}

function allowedCategory(value, ...context) {
  const direct = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s*&\s*/g, "-")
    .replace(/\s*\/\s*/g, "-")
    .replace(/\s+/g, "-");
  const aliases = {
    "home-decor": "decor",
    "home-goods": "homegoods",
    "small-appliances": "appliances",
    "small-appliance": "appliances",
    "books-media": "books",
    media: "books",
    "kids-baby": "kids",
    baby: "kids",
    "sporting-goods": "sporting",
    sports: "sporting",
    "medical-mobility": "medical",
    mobility: "medical",
    "tools-garage": "tools",
    garage: "tools",
    clearance: "scratch-dent",
    "as-is": "scratch-dent",
    "scratch/dent": "scratch-dent",
    "outdoor-garden": "outdoor"
  };
  const directCategory = aliases[direct] || direct;
  if (PRICING_CATEGORIES.includes(directCategory)) return directCategory;

  const text = [value, ...context].filter(Boolean).join(" ").toLowerCase();
  const rules = [
    { category: "electronics", pattern: /\b(electronics?|radio|stereo|receiver|speaker|subwoofer|turntable|television|tv|camera|lens|vcr|dvd|cd player|laptop|tablet|phone|monitor|printer|console|gaming|remote|amp|amplifier)\b/ },
    { category: "tools", pattern: /\b(tool|tools|drill|saw|wrench|socket|clamp|compressor|ladder|garage|hardware|workbench)\b/ },
    { category: "furniture", pattern: /\b(furniture|dresser|chair|table|cabinet|desk|sofa|couch|shelf|shelves|nightstand|bed|crib)\b/ },
    { category: "lamps", pattern: /\b(lamp|lamps|lighting|light fixture|shade|chandelier|sconce)\b/ },
    { category: "glassware", pattern: /\b(glass|glassware|crystal|vase|goblet|decanter|china|pyrex)\b/ },
    { category: "appliances", pattern: /\b(appliance|appliances|refrigerator|fridge|freezer|washer|dryer|microwave|dehumidifier)\b/ },
    { category: "housewares", pattern: /\b(housewares|dish|dishes|cookware|pan|pot|kitchen|utensil|sewing machine)\b/ },
    { category: "homegoods", pattern: /\b(homegoods|home goods|decor|basket|frame|mirror|art|wall hanging|rug|blanket)\b/ },
    { category: "clothing", pattern: /\b(clothing|clothes|shirt|jacket|coat|shoe|shoes|boots|linen|linens|purse|bag)\b/ },
    { category: "books", pattern: /\b(book|books|record|records|vinyl|dvd|cd|media|magazine)\b/ },
    { category: "exercise", pattern: /\b(exercise|fitness|weights|dumbbell|treadmill|workout|elliptical)\b/ },
    { category: "medical", pattern: /\b(medical|walker|cane|wheelchair|mobility|health|shower chair)\b/ },
    { category: "kids", pattern: /\b(kid|kids|baby|toy|toys|child|children|stroller|crib|high chair)\b/ },
    { category: "clocks", pattern: /\b(clock|clocks|watch|timepiece|mantel clock|wall clock)\b/ },
    { category: "jewelry", pattern: /\b(jewelry|jewellery|necklace|bracelet|ring|earrings|watch|accessories)\b/ },
    { category: "sporting", pattern: /\b(sport|sporting|golf|bike|bicycle|fishing|camping|ball|baseball|hockey|tennis)\b/ },
    { category: "seasonal", pattern: /\b(seasonal|holiday|christmas|halloween|easter|patio|summer|winter)\b/ },
    { category: "auto", pattern: /\b(auto|car|truck|automotive|tire|tires|motor oil|floor mats)\b/ },
    { category: "collectibles", pattern: /\b(collectible|collectibles|vintage|antique|figurine|brass|coin|stamp|memorabilia)\b/ },
    { category: "scratch-dent", pattern: /\b(scratch|dent|as-is|repair|parts|project|needs work|broken)\b/ }
  ];
  return rules.find((rule) => rule.pattern.test(text))?.category || "furniture";
}

function allowedCondition(value) {
  const clean = String(value || "").toLowerCase();
  if (["new", "excellent", "good", "fair", "repair"].includes(clean)) return clean;
  if (clean.includes("new")) return "new";
  if (clean.includes("excellent")) return "excellent";
  if (clean.includes("fair")) return "fair";
  if (clean.includes("repair") || clean.includes("poor")) return "repair";
  return "good";
}

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function average(range) {
  return Math.round((Number(range[0]) + Number(range[1])) / 2);
}

function clampPercent(value, fallback, min = 0, max = 95) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function roundPrice(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return 0;
  if (number < 20) return Math.max(1, Math.round(number));
  if (number < 100) return Math.round(number / 5) * 5;
  return Math.round(number / 10) * 10;
}

function estateSaleIdFromUrl(value) {
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts.findLast((part) => /^\d{5,}$/.test(part)) || "";
  } catch {
    return "";
  }
}

function absoluteEstateSalesUrl(value) {
  try {
    const url = new URL(value, "https://www.estatesales.net");
    return url.hostname.endsWith("estatesales.net") ? url.toString().split("?")[0] : "";
  } catch {
    return "";
  }
}

function chooseSaleTitle(texts) {
  return texts
    .map((text) => String(text || "").replace(/\s+/g, " ").trim())
    .filter((text) => text.length > 5 && !/^\d+$/.test(text))
    .sort((a, b) => scoreSaleTitle(b) - scoreSaleTitle(a))[0] || "";
}

function scoreSaleTitle(text) {
  let score = Math.min(text.length, 120);
  if (/sale|estate|popup|pop up|vintage|antique/i.test(text)) score += 100;
  if (/picture|photo|view sale/i.test(text)) score -= 80;
  return score;
}

function firstMatch(text, pattern) {
  const match = String(text || "").match(pattern);
  return match ? match[1].replace(/\s+/g, " ").trim() : "";
}

function cleanHtml(value) {
  return decodeEntities(String(value || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function loadLocalEnv() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(__dirname, file);
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    lines.forEach((line) => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
      if (!match) return;
      const existingValue = process.env[match[1]];
      if (existingValue && (match[1] !== "OPENAI_API_KEY" || looksLikeOpenAiKey(existingValue))) return;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    });
  }
}
