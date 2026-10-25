const CACHE_PREFIX = "repairlens-next-";
const SHELL_CACHE = `${CACHE_PREFIX}shell-v1`;
const PAGE_CACHE = `${CACHE_PREFIX}pages-v1`;
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

function guideCacheName(slug) {
  return `${CACHE_PREFIX}guide-${slug}`;
}

function validSlug(slug) {
  return typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function isSupabaseStorageUrl(url) {
  return url.hostname.endsWith(".supabase.co") && url.pathname.startsWith("/storage/v1/object/");
}

async function cacheGuide(slug, images) {
  if (!validSlug(slug)) return { ok: false, error: "That guide address is not valid." };
  const pageUrl = new URL(`/guides/${slug}/`, self.location.origin).href;
  const cache = await caches.open(guideCacheName(slug));

  try {
    const response = await fetch(new Request(pageUrl, { credentials: "same-origin" }));
    if (!response.ok) return { ok: false, error: "Connect to the internet and open this guide before saving it offline." };
    await cache.put(pageUrl, response.clone());
  } catch {
    return { ok: false, error: "Connect to the internet before saving this guide offline." };
  }

  let imagesSaved = 0;
  let imagesFailed = 0;
  const imageUrls = Array.isArray(images) ? images.slice(0, 40) : [];
  for (const source of imageUrls) {
    try {
      const imageUrl = new URL(source, self.location.origin);
      if (imageUrl.origin !== self.location.origin && !isSupabaseStorageUrl(imageUrl)) {
        imagesFailed += 1;
        continue;
      }
      const request = new Request(imageUrl.href, {
        credentials: imageUrl.origin === self.location.origin ? "same-origin" : "omit",
        mode: imageUrl.origin === self.location.origin ? "same-origin" : "cors",
      });
      const response = await fetch(request);
      if (!response.ok || response.type === "opaque") {
        imagesFailed += 1;
        continue;
      }
      await cache.put(request, response.clone());
      imagesSaved += 1;
    } catch {
      imagesFailed += 1;
    }
  }
  return { ok: true, saved: true, imagesSaved, imagesFailed };
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => {
              if (key.startsWith(`${CACHE_PREFIX}guide-`)) return false;
              return (key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE && key !== PAGE_CACHE) || key.startsWith("repairlens-v");
            })
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  const message = event.data || {};
  const reply = (data) => event.ports?.[0]?.postMessage(data);

  if (message.type === "SAVE_GUIDE_OFFLINE") {
    event.waitUntil(cacheGuide(message.slug, message.images).then(reply));
    return;
  }

  if (message.type === "CHECK_GUIDE_OFFLINE") {
    if (!validSlug(message.slug)) return reply({ ok: false, error: "That guide address is not valid." });
    const url = new URL(`/guides/${message.slug}/`, self.location.origin).href;
    event.waitUntil(
      caches
        .open(guideCacheName(message.slug))
        .then((cache) => cache.match(url))
        .then((cached) => reply({ ok: true, saved: Boolean(cached) })),
    );
    return;
  }

  if (message.type === "REMOVE_GUIDE_OFFLINE") {
    if (!validSlug(message.slug)) return reply({ ok: false, error: "That guide address is not valid." });
    event.waitUntil(caches.delete(guideCacheName(message.slug)).then((removed) => reply({ ok: true, removed })));
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  const supabaseStorage = isSupabaseStorageUrl(url);
  if ((!sameOrigin && !supabaseStorage) || url.pathname.startsWith("/api/")) return;

  if (sameOrigin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.put(request, response.clone())));
            return response;
          }),
      ),
    );
    return;
  }

  if (sameOrigin && request.mode === "navigate") {
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

  if ((sameOrigin && /\.(?:png|jpe?g|webp|svg|json|wasm|woff2?)$/i.test(url.pathname)) || supabaseStorage) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (sameOrigin && response.ok) event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.put(request, response.clone())));
            return response;
          }),
      ),
    );
  }
});
