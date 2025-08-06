const CACHE_NAME = 'desco-wise-cache-__CACHE_KEY_PLACEHOLDER__';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.css',
  '/index.tsx',
  '/favicon.svg',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Force immediate activation
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      // Try to get the response from the cache
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, try to use the navigation preload response if available
      // This is useful for faster initial loads and updates
      if (event.request.mode === 'navigate' && event.preloadResponse) {
        console.log('Using navigation preload response for:', event.request.url);
        return await event.preloadResponse;
      }

      // Otherwise, fetch from the network
      return fetch(event.request);
    })()
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log(`Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated. Claiming clients.');
      // Enable navigation preload if supported
      if (self.registration.navigationPreload) {
        console.log('Navigation preload is supported. Enabling it.');
        return self.registration.navigationPreload.enable();
      }
      return clients.claim(); // Take control of all clients immediately
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data.json();
  console.log('Push received:', data);

  const title = data.title || 'DescoWise Notification';
  const options = {
    body: data.body || 'You have a new notification.',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/favicon.svg',
    data: data.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickData = event.notification.data;
  if (clickData && clickData.url) {
    event.waitUntil(clients.openWindow(clickData.url));
  } else {
    event.waitUntil(clients.openWindow('/'));
  }
});