const CACHE_NAME = 'hsk1-v2'; // bump version to force refresh
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './auth.js',
  './features.js',
  './vocabulary.js',
  './bonus-sentences.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cacheName) => (cacheName !== CACHE_NAME ? caches.delete(cacheName) : null))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
