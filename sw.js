const CACHE = 'repairlens-v9';
const assets = ['/', '/index.html', '/styles.css', '/camera.css', '/detection.css', '/stories.css', '/playbook.css', '/brand.css', '/hero-lottie.css', '/analysis.css', '/presentation.css', '/app.js', '/hero-lottie.js', '/animations/repair-orbit.json', '/animations/repair-route.json', '/manifest.webmanifest', '/icon.svg', '/images/repairlens-mark.svg', '/images/bike-chain.svg', '/images/denim-seam.svg', '/images/lamp-repair.svg', '/images/window-hinge.svg', '/images/icons/scan-search.svg', '/images/icons/sparkles.svg', '/images/icons/map-pin.svg', '/images/icons/shield-check.svg'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(assets))));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request))));
