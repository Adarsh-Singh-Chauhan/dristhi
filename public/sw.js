const CACHE_NAME = "drishti-shell-v4";
const SHELL_URLS = ["/", "/app.html", "/demo.html", "/demo.css", "/demo.js", "/admin.html", "/alerts.html", "/guide.html", "/styles.css", "/operations.css", "/app.js", "/admin.js", "/alerts.js", "/config.js", "/manifest.webmanifest", "/icons/drishti-icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(SHELL_URLS.map((url) => cache.add(url)));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("drishti-shell-") && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never cache account, analysis, SOS, admin or health API responses.
  if (url.pathname.startsWith("/api/") || url.pathname === "/health" || url.pathname === "/docs" || url.pathname.startsWith("/openapi")) return;
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch {
        return (await caches.match(request)) || (await caches.match("/")) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await caches.match(request);
    const network = fetch(request).then((response) => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
      }
      return response;
    }).catch(() => cached);
    return cached || network;
  })());
});
