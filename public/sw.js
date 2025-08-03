const CACHE_NAME = 'desco-wise-cache-v1';
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
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
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