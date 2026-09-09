// Transport Manage - Service Worker (sw.js)
// IMPORTANTE: variables.json e bookings.json NON DEVONO MAI ESSERE MESSI IN CACHE!
// Devono essere sempre scaricati freschi dalla rete per garantire il sync multi-dispositivo.

const CACHE_NAME = 'transport-manage-v2';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  'https://cdn.tailwindcss.com?plugins=forms,container-queries',
  'https://unpkg.com/lucide@latest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // BYPASS TOTALE DELLA CACHE PER TUTTI I FILE DATI E API:
  // variables.json, bookings.json, GitHub API non devono MAI passare dalla cache del Service Worker!
  if (
    requestUrl.pathname.endsWith('variables.json') ||
    requestUrl.pathname.endsWith('bookings.json') ||
    requestUrl.hostname.includes('api.github.com') ||
    requestUrl.hostname.includes('raw.githubusercontent.com') ||
    event.request.url.includes('nocache') ||
    event.request.method !== 'GET'
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache First per asset grafici e codice dell'interfaccia
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    }).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
