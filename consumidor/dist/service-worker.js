const CACHE_NAME = 'smartparkin-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/index.css',
  '/icon-192.png',
  '/icon-512.png',
  '/smartparkin-logo.png'
];

// Instalación - cachear archivos básicos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activación - limpiar cachés antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - Network First (para APIs), Cache First (para assets)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Si es llamada a API (localhost:3000) → siempre red
  if (url.origin.includes('localhost:3000') || url.origin.includes(':3000')) {
    event.respondWith(fetch(request));
    return;
  }

  // Para el resto → Cache First
  event.respondWith(
    caches.match(request)
      .then((response) => {
        return response || fetch(request).then((fetchResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
      .catch(() => caches.match('/index.html'))
  );
});
