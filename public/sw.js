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
      // Do not force activation: existing clients keep their consistent asset set.
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      const url = new URL(event.request.url);

      // Notification API data must never be served from an offline cache.
      if (url.pathname.startsWith('/api/')) {
        return fetch(event.request);
      }

      // Strategy for index.html and root path: Network-First
      // This ensures the latest version of the main page is always attempted first.
      if (url.pathname === '/' || url.pathname === '/index.html') {
        try {
          const networkResponse = await fetch(event.request);
          // If network fetch is successful, update the cache with the new version
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        } catch (error) {
          // Network request failed (e.g., offline), try to get it from the cache
          console.log('Network fetch failed for index.html, falling back to cache.');
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // If no network and no cache, return a fallback response or throw
          return new Response('Application is offline and no cached version of index.html is available.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        }
      }

      // For other assets: Cache-First with Network Fallback (existing strategy)
      // This is suitable for static assets that are versioned or less critical for immediate updates.
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, try to use the navigation preload response if available
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
      console.log('Service Worker activated.');
      // Enable navigation preload if supported
      if (self.registration.navigationPreload) {
        console.log('Navigation preload is supported. Enabling it.');
        return self.registration.navigationPreload.enable();
      }
      return undefined;
    })
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'DescoWise notification', body: 'You have a new update.', icon: '/icon-192x192.png', badge: '/icon-192x192.png', data: { url: '/' } };
  if (event.data) {
    try { data = { ...data, ...event.data.json() }; }
    catch { data.body = event.data.text(); }
  }
  const title = data.title;
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    renotify: data.renotify ?? false,
    data: data.data,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const requested = event.notification.data?.url || '/';
  const target = new URL(requested, self.location.origin);
  const targetUrl = target.origin === self.location.origin ? target.href : self.location.origin + '/';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
    for (const client of windowClients) {
      if ('focus' in client) { client.navigate(targetUrl); return client.focus(); }
    }
    return clients.openWindow(targetUrl);
  }));
});

self.addEventListener('pushsubscriptionchange', (event) => {
  // Some browsers do not fire this reliably; the page also refreshes subscriptions on startup.
  event.waitUntil((async () => {
    const response = await fetch('/api/push/config', { cache: 'no-store' });
    const { vapidPublicKey } = await response.json();
    const base64 = vapidPublicKey.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - vapidPublicKey.length % 4) % 4);
    const key = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
    const subscription = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    clientList.forEach(client => client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED', subscription: subscription.toJSON() }));
  })());
});
