import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = String(process.env.SMOKE_PORT || 18080);
const origin = `http://127.0.0.1:${port}`;
const failures = [];
const warnings = [];

const server = spawn(process.execPath, ["server.js"], {
  cwd: root,
  env: { ...process.env, PORT: port },
  stdio: ["ignore", "pipe", "pipe"]
});

server.stdout.on("data", () => {});
server.stderr.on("data", (chunk) => warnings.push(`server stderr: ${String(chunk).trim()}`));

try {
  await waitForServer();
  await checkCorePages();
  await checkStaticLinksAndDropdowns();
  await checkLocalAssets();
  await checkPwaAssets();
  await checkPrivateStaticFiles();
  await checkApi();
  await checkExternalReferences();
} finally {
  server.kill();
}

if (failures.length) {
  console.error("\nSmoke check failed:");
  failures.forEach((item) => console.error(`- ${item}`));
  if (warnings.length) {
    console.error("\nWarnings:");
    warnings.forEach((item) => console.error(`- ${item}`));
  }
  process.exitCode = 1;
} else {
  console.log("Smoke check passed.");
  if (warnings.length) {
    console.log("\nWarnings:");
    warnings.forEach((item) => console.log(`- ${item}`));
  }
}

async function waitForServer() {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${origin}/api/status`);
      if (response.ok) return;
    } catch {
      await delay(150);
    }
  }
  failures.push(`server did not become ready at ${origin}`);
}

async function checkCorePages() {
  const response = await fetch(`${origin}/?smoke=1`);
  const html = await response.text();
  expect(response.ok, `home page returned ${response.status}`);
  expect(html.includes("Vern's Estate Sale Warehouse"), "home page missing site title");
  expect(html.includes('rel="manifest"'), "home page missing web app manifest link");
  expect(html.includes("apple-mobile-web-app-capable"), "home page missing Apple mobile app metadata");
  expect(html.includes("data-estate-sales-grid"), "home page missing estate sales grid");
  expect(!html.includes("early-entry.html"), "home page still links to early-entry page");
  expect(!html.includes("assets/js/early-entry.js"), "home page still loads public early-entry counter script");
  expect(!html.includes("data-early-entry-remaining"), "home page still shows early-entry spots counter");
  expect(!html.includes("Early Entry Sold Out"), "home page still shows early-entry promo copy");
  expect(!html.includes("first 10 minutes"), "home page still shows staged early-entry timing");
  expect(!html.includes("Want to be one of the first shoppers inside"), "old early-entry lead copy is back");
  expect(html.indexOf('id="sales"') < html.indexOf('id="photos"'), "sales section should appear before floor photos");
  expect(!html.includes("Mona Lake Frontage Estate Sale"), "ended Mona Lake sale should not be hardcoded into the public homepage");
  expect(!html.includes("Upcoming EstateSales.NET Sales"), "removed sale-board header is back");
  expect(!html.includes("Official sale links"), "removed official-sale intro is back");

  const meetResponse = await fetch(`${origin}/meet-vern.html?smoke=1`);
  const meetHtml = await meetResponse.text();
  expect(meetResponse.ok, `meet-vern.html returned ${meetResponse.status}`);
  expect(meetHtml.includes("Meet Vern | Vern's Estate Sale Warehouse"), "meet-vern page missing title");
  expect(meetHtml.includes("Back to Vern's Warehouse"), "meet-vern page missing back link");

  const earlyEntryResponse = await fetch(`${origin}/early-entry.html?smoke=1`);
  const earlyEntryHtml = await earlyEntryResponse.text();
  expect(earlyEntryResponse.ok, `early-entry.html returned ${earlyEntryResponse.status}`);
  expect(earlyEntryHtml.includes("Early Entry Closed | Vern's Estate Sale Warehouse"), "early-entry page missing closed title");
  expect(earlyEntryHtml.includes("Early Entry Is Closed"), "early-entry page missing closed heading");
  expect(earlyEntryHtml.includes("Early-entry payment is no longer available"), "early-entry page missing closed payment notice");
  expect(!earlyEntryHtml.includes("data-early-entry-pay-button"), "early-entry page still has payment button hook");
  expect(!earlyEntryHtml.includes("Pay $"), "early-entry page still shows payment button copy");
  const earlyEntryConfig = await readFile(path.join(root, "assets/js/early-entry-config.js"), "utf8");
  expect(earlyEntryConfig.includes('stripePaymentLink: ""'), "early-entry config should not expose a checkout link");
  expect(earlyEntryConfig.includes("Early entry is closed now that the sale has ended."), "early-entry config missing closed payment message");
  expect(earlyEntryConfig.includes('spotCounterEndpoint: ""'), "early-entry config should not expose a public count endpoint");
  expect(earlyEntryConfig.includes("spotCounterMode: \"closed\""), "early-entry config should mark public counting closed");

  const previewResponse = await fetch(`${origin}/payment-preview.html?smoke=1`);
  const previewHtml = await previewResponse.text();
  expect(previewResponse.ok, `payment-preview.html returned ${previewResponse.status}`);
  expect(previewHtml.includes("Checkout Preview | Vern's Estate Sale Warehouse"), "payment preview page missing title");
  expect(previewHtml.includes("Preview only"), "payment preview page missing preview-only warning");
  expect(previewHtml.includes("Wave 2 Early Entry Checkout"), "payment preview page missing Wave 2 checkout copy");
  expect(previewHtml.includes("$20.00"), "payment preview page missing Wave 2 price");
  expect(!previewHtml.includes("$25.00"), "payment preview page still shows old early-entry price");
}

async function checkStaticLinksAndDropdowns() {
  for (const file of ["index.html", "meet-vern.html", "early-entry.html", "payment-preview.html"]) {
    const html = await readFile(path.join(root, file), "utf8");
    const ids = new Set(Array.from(html.matchAll(/\sid=["']([^"']+)["']/g), (match) => match[1]));
    const anchors = Array.from(html.matchAll(/<a\b[^>]*\bhref=["']([^"']*)["'][^>]*>/g), (match) => match[1]);

    for (const href of anchors) {
      expect(href.trim() !== "", `${file} anchor has an empty href`);
      expect(href !== "#", `${file} anchor still uses placeholder href="#"`);
      if (href.startsWith("#")) expect(ids.has(href.slice(1)), `${file} anchor target ${href} is missing`);
    }

    const staticSelects = Array.from(html.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g));
    for (const [, attrs, optionsHtml] of staticSelects) {
      if (/data-category-select|data-market-category-select|data-photo-item-type-select/.test(attrs)) continue;
      const optionCount = Array.from(optionsHtml.matchAll(/<option\b/g)).length;
      expect(optionCount > 0, `${file} select ${selectName(attrs)} has no options`);
    }
  }

  const html = await readFile(path.join(root, "index.html"), "utf8");
  expect(!/<a\b[^>]*data-timeoff-email/i.test(html), "Email Vern should be a button, not a placeholder link");
  expect(!/<a\b[^>]*data-timeoff-sms/i.test(html), "Text Vern should be a button, not a placeholder link");
  expect(html.includes('data-tab="customers"'), "employee tools missing Potential Customers tab");
  expect(html.includes("data-potential-customer-form"), "employee tools missing potential-customer intake form");
  expect(html.includes("data-customer-calendar-download"), "potential-customer workspace missing calendar handoff");
  expect(html.includes("data-customer-contract-open"), "potential-customer workspace missing contract preparation action");
  expect(html.includes("data-view-onsite-contract"), "contract preparation missing Onsite Contract review action");
  expect(html.includes('href="onsite-contract-viewer.html"'), "Onsite Contract review action missing inline viewer");
  expect(html.includes('name="specialNotesAgreements"'), "potential-customer intake missing shared Special Notes or Agreements");
  expect(/name="saleSiteStreet"[^>]*required/.test(html), "potential-customer intake missing required sale-site street");
  expect(html.includes('name="saleSiteLine2"'), "potential-customer intake missing optional sale-site Address Line 2");
  expect(/name="saleSiteCity"[^>]*required/.test(html), "potential-customer intake missing required sale-site city");
  expect(/name="saleSiteState"[^>]*required/.test(html), "potential-customer intake missing required sale-site state");
  expect(/name="saleSiteZip"[^>]*required/.test(html), "potential-customer intake missing required sale-site ZIP");
  expect(html.includes("data-contract-special-notes"), "Contract Prep missing editable Special Notes or Agreements");
  expect(html.includes('name="checkAddressMode"'), "potential-customer intake missing check/report address choice");
  expect(html.includes("data-contract-check-address-mode"), "Contract Prep missing check/report address choice");
  expect(html.includes("data-contract-mailing-address-fields"), "Contract Prep missing different mailing-address fields");
  expect(html.includes("data-contract-details-confirm"), "Contract Prep missing read-only review confirmation");
  expect(html.includes("data-contract-signed-confirm"), "contract preparation missing signed-contract confirmation");
  expect(html.includes("No customer code is assigned here"), "potential-customer intake must explain code timing");

  const requiredSelects = [
    "data-category-select",
    "data-pricing-destination",
    "data-priced-item-select",
    "data-market-category-select",
    "data-photo-item-type-select"
  ];

  for (const attribute of requiredSelects) {
    expect(new RegExp(`<select[^>]*${attribute}`, "i").test(html), `missing select ${attribute}`);
  }

}

async function checkLocalAssets() {
  const refs = new Set();
  for (const file of [
    "index.html",
    "meet-vern.html",
    "early-entry.html",
    "payment-preview.html",
    "assets/css/styles.css",
    "assets/js/site-data.js",
    "assets/js/app.js",
    "assets/js/early-entry-config.js",
    "assets/js/early-entry.js"
  ]) {
    const text = await readFile(path.join(root, file), "utf8");
    for (const match of text.matchAll(/assets\/[^"'`)>\s]+/g)) {
      const ref = match[0].replace(/^url\(/, "").split("?")[0];
      if (isPlaceholderReference(ref)) continue;
      refs.add(ref);
    }
  }

  for (const ref of refs) {
    const response = await fetch(`${origin}/${ref}`);
    expect(response.ok, `${ref} returned ${response.status}`);
    if (response.ok) {
      const bytes = await response.arrayBuffer();
      expect(bytes.byteLength > 0, `${ref} is empty`);
    }
  }

  const contractResponse = await fetch(`${origin}/assets/docs/onsite-contract.pdf`);
  const contractBytes = Buffer.from(await contractResponse.arrayBuffer());
  expect(contractResponse.ok, `Onsite Contract PDF returned ${contractResponse.status}`);
  expect((contractResponse.headers.get("content-type") || "").includes("application/pdf"), "Onsite Contract has wrong content type");
  expect((contractResponse.headers.get("content-disposition") || "").startsWith("inline"), "Onsite Contract PDF is not explicitly served inline");
  expect(contractBytes.subarray(0, 5).toString("ascii") === "%PDF-", "Onsite Contract asset is not a PDF");
  expect(contractBytes.byteLength > 50_000, "Onsite Contract PDF appears incomplete");

  const viewerResponse = await fetch(`${origin}/onsite-contract-viewer.html`);
  const viewerHtml = await viewerResponse.text();
  expect(viewerResponse.ok, `Onsite Contract viewer returned ${viewerResponse.status}`);
  expect(viewerHtml.includes("Onsite Contract - Review Copy"), "Onsite Contract viewer missing review heading");
  expect(viewerHtml.includes("onsite-contract-page-1.png"), "Onsite Contract viewer missing page 1");
  expect(viewerHtml.includes("onsite-contract-page-2.png"), "Onsite Contract viewer missing page 2");
  expect(viewerHtml.includes("data-contract-client"), "Onsite Contract viewer missing Client prefill");
  expect(viewerHtml.includes("data-contract-phone"), "Onsite Contract viewer missing Phone prefill");
  expect(viewerHtml.includes("data-contract-address"), "Onsite Contract viewer missing Sale Site Address prefill");
  expect(viewerHtml.includes("data-contract-special-notes"), "Onsite Contract viewer missing Special Notes or Agreements prefill");
  expect(viewerHtml.includes("data-contract-mailing"), "Onsite Contract viewer missing check/report address prefill");
  expect(viewerHtml.includes("Customer signature activates after secure signature integration"), "Onsite Contract viewer missing in-place customer signature placeholder");
  expect(viewerHtml.includes("representative signature activates after secure signature integration"), "Onsite Contract viewer missing in-place representative signature placeholder");
  const viewerScript = viewerHtml.match(/<script>([\s\S]*?)<\/script>/)?.[1] || "";
  expect(Boolean(viewerScript), "Onsite Contract viewer missing customer-prefill script");
  try {
    new Function(viewerScript);
  } catch (error) {
    failures.push(`Onsite Contract viewer script has invalid syntax: ${error.message}`);
  }
  const renderedContract = renderContractViewerScript(viewerScript, {
    id: "potential-customer-smoke",
    firstName: "Jamie",
    lastName: "Customer",
    phone: "(231) 555-0100",
    saleSiteStreet: "100 Sale Site Rd",
    saleSiteLine2: "Unit B",
    saleSiteCity: "Norton Shores",
    saleSiteState: "MI",
    saleSiteZip: "49441",
    specialNotesAgreements: "Keep the family piano out of the sale.",
    checkAddressMode: "different",
    mailingStreet: "200 Mailing Ave",
    mailingLine2: "Suite 3",
    mailingCity: "Muskegon",
    mailingState: "mi",
    mailingZip: "49440"
  });
  expect(renderedContract["[data-contract-client]"]?.textContent === "Jamie Customer", "Onsite Contract viewer did not map Client");
  expect(renderedContract["[data-contract-phone]"]?.textContent === "(231) 555-0100", "Onsite Contract viewer did not map Phone");
  expect(renderedContract["[data-contract-address]"]?.textContent === "100 Sale Site Rd, Unit B, Norton Shores MI 49441", "Onsite Contract viewer did not map structured Sale Site Address");
  expect(renderedContract["[data-contract-special-notes]"]?.textContent.includes("family piano"), "Onsite Contract viewer did not map Special Notes or Agreements");
  expect(renderedContract["[data-contract-mailing]"]?.textContent === "200 Mailing Ave, Suite 3, Muskegon MI 49440", "Onsite Contract viewer did not map different check/report address");
  const sameAddressContract = renderContractViewerScript(viewerScript, {
    id: "potential-customer-same-address",
    firstName: "Taylor",
    lastName: "Seller",
    phone: "(231) 555-0199",
    address: "300 Same Address St, Muskegon, MI 49442",
    checkAddressMode: "same"
  });
  expect(sameAddressContract["[data-contract-mailing]"]?.textContent === "300 Same Address St, Muskegon MI 49442", "Onsite Contract viewer did not prefill sale-site address for check/report");
  const appScript = await readFile(path.join(root, "assets/js/app.js"), "utf8");
  expect(appScript.includes("specialNotesOrAgreements:"), "contract payload missing Special Notes or Agreements");
  expect(appScript.includes("checkAndReportAddress:"), "contract payload missing check/report address");
  expect(appScript.includes("mailingAddress,"), "contract payload missing structured mailing address");
  expect(appScript.includes("saleSiteAddress,"), "contract payload missing structured sale-site address");
  expect(appScript.includes(".map(normalizePotentialCustomerRecord)"), "potential-customer state missing legacy address migration");
}

function renderContractViewerScript(script, record) {
  const selectors = [
    "[data-contract-client]",
    "[data-contract-phone]",
    "[data-contract-address]",
    "[data-contract-special-notes]",
    "[data-contract-mailing]",
    "[data-viewer-status]",
    "[data-viewer-title]"
  ];
  const elements = Object.fromEntries(selectors.map((selector) => [
    selector,
    {
      textContent: "",
      hidden: false,
      classList: { add() {} }
    }
  ]));
  const documentStub = {
    querySelector(selector) {
      return elements[selector] || null;
    }
  };
  const localStorageStub = {
    getItem() {
      return JSON.stringify({ potentialCustomers: [record] });
    }
  };
  try {
    new Function("window", "localStorage", "document", "URLSearchParams", script)(
      { location: { search: `?customer=${encodeURIComponent(record.id)}` } },
      localStorageStub,
      documentStub,
      URLSearchParams
    );
  } catch (error) {
    failures.push(`Onsite Contract viewer mapping failed: ${error.message}`);
  }
  return elements;
}

async function checkPwaAssets() {
  const manifestResponse = await fetch(`${origin}/manifest.webmanifest`);
  expect(manifestResponse.ok, `manifest.webmanifest returned ${manifestResponse.status}`);
  expect((manifestResponse.headers.get("content-type") || "").includes("application/manifest+json"), "manifest.webmanifest has wrong content type");

  let manifest = null;
  try {
    manifest = await manifestResponse.json();
  } catch {
    failures.push("manifest.webmanifest is not valid JSON");
  }

  expect(manifest?.display === "standalone", "manifest display is not standalone");
  expect(Array.isArray(manifest?.icons) && manifest.icons.length >= 2, "manifest missing app icons");

  for (const icon of manifest?.icons || []) {
    const response = await fetch(`${origin}/${icon.src}`);
    expect(response.ok, `${icon.src} returned ${response.status}`);
  }

  const serviceWorker = await fetch(`${origin}/service-worker.js`);
  expect(serviceWorker.ok, `service-worker.js returned ${serviceWorker.status}`);
  const serviceWorkerText = await serviceWorker.text();
  expect(serviceWorkerText.includes("CACHE_NAME"), "service-worker.js missing cache setup");
  expect(serviceWorkerText.includes("assets/docs/onsite-contract.pdf"), "service worker missing Onsite Contract PDF");
  expect(serviceWorkerText.includes("onsite-contract-viewer.html"), "service worker missing Onsite Contract viewer");
  expect(serviceWorkerText.includes("assets/docs/onsite-contract-page-1.png"), "service worker missing Onsite Contract page 1");
  expect(serviceWorkerText.includes("assets/docs/onsite-contract-page-2.png"), "service worker missing Onsite Contract page 2");
}

async function checkPrivateStaticFiles() {
  const blockedPaths = [
    "/server.js",
    "/package.json",
    "/README.md",
    "/docs/deep-smoke-test-report.md",
    "/scripts/smoke-check.mjs",
    "/data/estate-sales.example.json",
    "/.env.local",
    "/assets/%2e%2e/server.js"
  ];

  for (const pathname of blockedPaths) {
    const response = await fetch(`${origin}${pathname}`);
    const text = await response.text();
    expect([403, 404].includes(response.status), `${pathname} should be blocked but returned ${response.status}`);
    expect(!/OPENAI_API_KEY|const http = require|passcode|sk-[A-Za-z0-9]/.test(text), `${pathname} exposed private/source content`);
  }

  const malformed = await fetch(`${origin}/%E0%A4%A`);
  expect(malformed.status === 400, `malformed encoded URL should return 400 but returned ${malformed.status}`);
}

async function checkApi() {
  const status = await jsonFetch("/api/status");
  expect(status?.ok === true, "/api/status did not return ok=true");

  const sync = await jsonFetch("/api/estate-sales/sync");
  expect(Array.isArray(sync?.sales), "/api/estate-sales/sync missing sales array");
  expect(sync?.syncAllowed === false || sync?.syncAllowed === true, "/api/estate-sales/sync missing syncAllowed flag");
}

async function checkExternalReferences() {
  const text = [
    await readFile(path.join(root, "index.html"), "utf8"),
    await readFile(path.join(root, "assets/js/site-data.js"), "utf8")
  ].join("\n");
  const urls = Array.from(new Set(Array.from(text.matchAll(/https:\/\/[^"'\s<>]+/g), (match) => match[0].replace(/[),.]+$/, ""))));

  for (const url of urls) {
    if (isPlaceholderReference(url)) continue;
    const response = await timedFetch(url, { method: "HEAD" }, 7000);
    if (response?.ok || isRedirect(response?.status)) continue;

    const getResponse = await timedFetch(url, { method: "GET" }, 7000);
    if (getResponse?.ok || isRedirect(getResponse?.status)) continue;

    warnings.push(`${url} returned ${getResponse?.status || response?.status || "no response"} to automated checks`);
  }
}

async function jsonFetch(pathname) {
  try {
    const response = await fetch(`${origin}${pathname}`);
    expect(response.ok, `${pathname} returned ${response.status}`);
    return await response.json();
  } catch (error) {
    failures.push(`${pathname} failed: ${error.message}`);
    return null;
  }
}

async function timedFetch(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": "VernsWebsiteSmokeCheck/1.0"
      }
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function isRedirect(status) {
  return status >= 300 && status < 400;
}

function isPlaceholderReference(value) {
  return value.includes("assets/img/file.svg")
    || value.includes("/MI/City/Zip/SaleId")
    || value.endsWith("/companies/...");
}

function selectName(attrs) {
  const name = attrs.match(/\bname=["']([^"']+)["']/)?.[1];
  const dataAttribute = attrs.match(/\b(data-[\w-]+)/)?.[1];
  return name || dataAttribute || attrs.trim() || "unknown";
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
