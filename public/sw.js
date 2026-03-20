const CACHE_NAME = 'hrt-tracker-v1';

const selfWorker = self;

selfWorker.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // In a statically exported Next.js app, we can confidently cache the root
      return cache.addAll([
        '/',
        '/manifest.json',
        '/icon512_maskable.png',
        '/icon512_rounded.png'
      ]).catch(err => console.log('SW cache add error (likely missing icons)', err));
    })
  );
  selfWorker.skipWaiting();
});

selfWorker.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  selfWorker.clients.claim();
});

selfWorker.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response immediately if present
      if (cachedResponse) {
        // Softly update the cache in the background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {}); // ignore offline network errors
        return cachedResponse;
      }

      // If not in cache, fetch from network and cache it
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback for navigation requests when offline
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        return new Response('Offline content not available');
      });
    })
  );
});
