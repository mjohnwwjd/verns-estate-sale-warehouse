const CACHE_NAME = "verns-estate-sale-warehouse-v20260606-deep-smoke";
const APP_SHELL = [
  "./",
  "./index.html",
  "./meet-vern.html",
  "./manifest.webmanifest",
  "./assets/css/styles.css",
  "./assets/js/today-photo-items.js",
  "./assets/js/site-data.js",
  "./assets/js/app.js",
  "./assets/img/logo-vern-option-2.png",
  "./assets/img/maps-app-style-icon.svg",
  "./assets/img/app/verns-app-icon-192.png",
  "./assets/img/app/verns-app-icon-512.png",
  "./assets/img/app/apple-touch-icon.png",
  "./assets/img/estatesales-net-logo.svg",
  "./assets/img/sale-coming-soon-west-mi.png",
  "./assets/img/sale-spring-lake-horse.jpeg",
  "./assets/img/sale-muskegon-pop-up-tent.jpeg",
  "./assets/img/demo/demo-mid-century-dresser.jpeg",
  "./assets/img/demo/demo-tools-table.jpeg",
  "./assets/img/demo/demo-glass-collectibles.jpeg",
  "./assets/img/demo/demo-warehouse-furniture-aisle.jpeg",
  "./assets/img/1m-project-reference-style.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cacheAppShell(cache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "./index.html"));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(new Request(request, { cache: "reload" }));
    cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || cache.match(fallbackUrl);
  }
}

async function cacheAppShell(cache) {
  await Promise.all(
    APP_SHELL.map(async (url) => {
      const request = new Request(url, { cache: "reload" });
      const response = await fetch(request);
      if (response.ok) await cache.put(url, response);
    })
  );
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}
