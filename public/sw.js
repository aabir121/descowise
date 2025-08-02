// Service Worker for caching and performance optimization
const CACHE_NAME = 'desco-account-manager-v1';
const STATIC_CACHE_NAME = 'desco-static-v1';
const DYNAMIC_CACHE_NAME = 'desco-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add other critical assets here
];

// Assets to cache dynamically
const DYNAMIC_CACHE_PATTERNS = [
  /\.js$/,
  /\.css$/,
  /\.woff2?$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.svg$/,
  /\.ico$/
];

// Network-first patterns (for API calls)
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /desco\.gov\.bd/
];

// Cache-first patterns (for static assets)
const CACHE_FIRST_PATTERNS = [
  /\.js$/,
  /\.css$/,
  /\.woff2?$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.svg$/,
  /\.ico$/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Network-first strategy for API calls
  if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Cache-first strategy for static assets
  if (CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // Stale-while-revalidate for HTML pages
  if (request.destination === 'document') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  
  // Default to network-first
  event.respondWith(networkFirst(request));
});

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache-first failed:', error);
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const networkResponsePromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(DYNAMIC_CACHE_NAME);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => {
    // Network failed, but we might have cache
    return cachedResponse;
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Otherwise wait for network
  return networkResponsePromise;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }

  if (event.tag === 'notification-check') {
    event.waitUntil(performNotificationCheck());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  console.log('Background sync triggered');
}

// Notification check function for background sync
async function performNotificationCheck() {
  console.log('Performing background notification check...');

  try {
    // Get accounts from IndexedDB or localStorage
    const accounts = await getStoredAccounts();
    if (!accounts || accounts.length === 0) {
      console.log('No accounts found for notification check');
      return;
    }

    // Check notification settings
    const settings = await getNotificationSettings();
    if (!settings || !settings.enabled) {
      console.log('Notifications are disabled');
      return;
    }

    // Check if we already performed the daily check today
    if (await wasDailyCheckPerformed()) {
      console.log('Daily notification check already performed today');
      return;
    }

    // Perform account monitoring
    const alerts = await checkAccountsForAlerts(accounts, settings.lowBalanceThreshold);

    if (alerts.length > 0) {
      await sendNotificationAlerts(alerts);
    }

    // Update last check time
    await updateLastCheckTime();

    console.log(`Notification check completed. Sent ${alerts.length} alerts.`);
  } catch (error) {
    console.error('Error during notification check:', error);
  }
}

// Push notifications (if needed in the future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'View Details',
          icon: '/icon-192x192.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icon-192x192.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore' || event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME)
        .then(cache => cache.addAll(event.data.urls))
    );
  }

  if (event.data && event.data.type === 'FORCE_NOTIFICATION_CHECK') {
    event.waitUntil(performNotificationCheck());
  }
});

// Helper functions for notification system

async function getStoredAccounts() {
  try {
    // Try to get accounts from localStorage via clients
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      // Send message to client to get accounts
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.accounts || []);
        };
        clients[0].postMessage({ type: 'GET_ACCOUNTS' }, [messageChannel.port2]);
      });
    }
    return [];
  } catch (error) {
    console.error('Error getting stored accounts:', error);
    return [];
  }
}

async function getNotificationSettings() {
  try {
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.settings || null);
        };
        clients[0].postMessage({ type: 'GET_NOTIFICATION_SETTINGS' }, [messageChannel.port2]);
      });
    }
    return null;
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return null;
  }
}

async function wasDailyCheckPerformed() {
  try {
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.performed || false);
        };
        clients[0].postMessage({ type: 'WAS_DAILY_CHECK_PERFORMED' }, [messageChannel.port2]);
      });
    }
    return false;
  } catch (error) {
    console.error('Error checking daily check status:', error);
    return false;
  }
}

async function updateLastCheckTime() {
  try {
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      clients[0].postMessage({ type: 'UPDATE_LAST_CHECK_TIME' });
    }
  } catch (error) {
    console.error('Error updating last check time:', error);
  }
}

async function checkAccountsForAlerts(accounts, threshold) {
  const alerts = [];

  for (const account of accounts) {
    try {
      const response = await fetch(`https://prepaid.desco.org.bd/api/unified/customer/getBalance?accountNo=${account.accountNo}`);
      const result = await response.json();

      if (result.code === 200 && result.data) {
        const balance = result.data.balance;
        const accountName = account.displayName || `Account ${account.accountNo}`;

        // Check for data unavailable
        if (balance === null || balance === undefined) {
          alerts.push({
            accountNo: account.accountNo,
            accountName,
            type: 'data_unavailable',
            message: `Account data is unavailable for ${accountName}`
          });
        }
        // Check for low balance
        else if (typeof balance === 'number' && balance < threshold) {
          alerts.push({
            accountNo: account.accountNo,
            accountName,
            type: 'low_balance',
            balance,
            threshold,
            message: `Low balance: ${accountName} has ৳${balance.toFixed(2)}`
          });
        }
      }
    } catch (error) {
      console.error(`Error checking account ${account.accountNo}:`, error);
    }

    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return alerts;
}

async function sendNotificationAlerts(alerts) {
  const lowBalanceAlerts = alerts.filter(alert => alert.type === 'low_balance');
  const dataUnavailableAlerts = alerts.filter(alert => alert.type === 'data_unavailable');

  if (lowBalanceAlerts.length > 0) {
    const title = 'Low Balance Alert';
    const body = lowBalanceAlerts.length === 1
      ? lowBalanceAlerts[0].message
      : `${lowBalanceAlerts.length} accounts have low balance`;

    await self.registration.showNotification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: 'low-balance',
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'View Accounts' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
  }

  if (dataUnavailableAlerts.length > 0) {
    const title = 'Account Data Unavailable';
    const body = dataUnavailableAlerts.length === 1
      ? dataUnavailableAlerts[0].message
      : `Data unavailable for ${dataUnavailableAlerts.length} accounts`;

    await self.registration.showNotification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: 'data-unavailable',
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'View Accounts' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
  }
}
