/* Service worker minimal : met en cache le shell de l'application pour un usage hors ligne.
 * Les fichiers de données (data/*.json) sont servis "réseau d'abord" pour refléter le dernier seed committé.
 * Incrémenter CACHE_NAME à chaque déploiement qui modifie les fichiers du shell. */
const CACHE_NAME = 'gymtrack-v8';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './assets/fonts/barlow-latin-400-normal.woff2',
  './assets/fonts/barlow-latin-500-normal.woff2',
  './assets/fonts/barlow-latin-600-normal.woff2',
  './assets/fonts/barlow-condensed-latin-600-normal.woff2',
  './assets/fonts/barlow-condensed-latin-700-normal.woff2',
  './assets/fonts/silkscreen-latin-400-normal.woff2',
  './assets/fonts/silkscreen-latin-700-normal.woff2',
  './assets/fonts/pixelify-sans-latin-400-normal.woff2',
  './assets/fonts/pixelify-sans-latin-500-normal.woff2',
  './assets/fonts/pixelify-sans-latin-700-normal.woff2',
  './assets/fonts/press-start-2p-latin-400-normal.woff2',
  './data/programme.json',
  './data/seed.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isData = req.url.includes('/data/');
  if (isData) {
    // Réseau d'abord, cache en secours.
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }
  // Cache d'abord (shell + GIF), réseau en secours puis mise en cache.
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE_NAME).then((c) => c.put(req, copy)); }
      return res;
    }))
  );
});
