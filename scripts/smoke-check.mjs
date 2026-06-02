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
  await checkLocalAssets();
  await checkPwaAssets();
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
  expect(!html.includes("Upcoming EstateSales.NET Sales"), "removed sale-board header is back");
  expect(!html.includes("Official sale links"), "removed official-sale intro is back");
}

async function checkLocalAssets() {
  const refs = new Set();
  for (const file of ["index.html", "assets/css/styles.css", "assets/js/site-data.js", "assets/js/app.js"]) {
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
  expect((await serviceWorker.text()).includes("CACHE_NAME"), "service-worker.js missing cache setup");
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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
