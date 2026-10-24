const CACHE = 'repairlens-v4';
const assets = ['/', '/index.html', '/styles.css', '/camera.css', '/stories.css', '/playbook.css', '/app.js', '/manifest.webmanifest', '/icon.svg', '/images/bike-chain.svg', '/images/denim-seam.svg', '/images/lamp-repair.svg', '/images/window-hinge.svg'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(assets))));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request))));
