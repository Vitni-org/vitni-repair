const CACHE_PREFIX = "repairlens-next-";
const SHELL_CACHE = `${CACHE_PREFIX}shell-v1`;
const PAGE_CACHE = `${CACHE_PREFIX}pages-v1`;
// Keep this install-time refresh in place when core artwork changes; addAll replaces cached responses without renaming these caches.
const CORE_ASSETS = [
  "/manifest.webmanifest",
  "/icon.svg",
  "/images/vitni-mark.svg",
  "/images/vitni.svg",
  "/images/og/repairlens-share.png",
  "/images/test/chain-off-test.jpg",
  "/animations/vitni-repair-v4.json",
  "/dotlottie-player.wasm",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => (key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE && key !== PAGE_CACHE) || key.startsWith("repairlens-v")).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && !url.search) event.waitUntil(caches.open(PAGE_CACHE).then((cache) => cache.put(request, response.clone())));
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match(new URL("/", self.location.origin).href)) || Response.error()),
    );
    return;
  }

  if (/\.(?:png|jpe?g|webp|svg|json|wasm|woff2?)$/i.test(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.put(request, response.clone())));
      return response;
    })));
  }
});
