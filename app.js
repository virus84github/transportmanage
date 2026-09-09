// Transport Manage - Service Worker (sw.js)
// Gestione PWA: cache del framework dell'applicazione e bypass della cache per sincronizzazione cloud in tempo reale

const CACHE_NAME = 'transport-manage-v1';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  'https://cdn.tailwindcss.com?plugins=forms,container-queries',
  'https://unpkg.com/lucide@latest'
];

// 1. Installazione del Service Worker e caching degli asset statici della scocca
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Attivazione e pulizia di vecchie versioni della cache
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

// 3. Intercettazione delle richieste di rete:
// - Le chiamate API (Cloudflare Worker / GitHub) bypassano rigorosamente la cache
//   per garantire che tutti i dispositivi abbiano dati freschi e sincronizzati
// - Gli asset statici dell'interfaccia usano cache-first con fallback di rete
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Bypass cache per le chiamate API Cloudflare / GitHub / query dinamiche
  if (
    requestUrl.hostname.includes('workers.dev') ||
    requestUrl.hostname.includes('api.github.com') ||
    event.request.url.includes('?file=') ||
    event.request.method !== 'GET'
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Per asset UI: Cache First con fallback di rete
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Opzionale: non memorizzare richieste non riuscite
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        return networkResponse;
      });
    }).catch(() => {
      // Fallback offline se la rete non è disponibile
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
