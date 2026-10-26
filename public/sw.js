// Progressive Web App (PWA) Service Worker with Mobile Lock Screen Push Notification & Offline Support
const CACHE_NAME = 'moneymanagement-v3';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-caching non-fatal warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event listener required for PWA installability
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip API / WebSocket requests from cache
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/api/')) {
    // API calls always go straight to network
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If response is valid, clone and update cache for static assets
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Network failed, attempt cache match
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Fallback to home/index.html for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
  );
});

// Listen to message from client to display lock screen notification
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const finalOptions = {
      body: options.body || '',
      icon: options.icon || '/icon-192.png',
      badge: options.badge || '/icon-192.png',
      tag: options.tag || `money-${Date.now()}`,
      renotify: true,
      vibrate: [300, 150, 300],
      requireInteraction: false,
      data: options.data || { url: '/transaksi' },
      ...options,
    };
    event.waitUntil(self.registration.showNotification(title, finalOptions));
  }
});

// Handle incoming push event from server or background
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Money Management', body: event.data.text() };
    }
  }
  const title = data.title || '⏰ Money Management';
  const options = {
    body: data.body || 'Pengingat pencatatan keuangan harian.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || `push-${Date.now()}`,
    renotify: true,
    vibrate: [300, 150, 300],
    data: { url: data.url || '/transaksi' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click from lock screen or status bar
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/transaksi';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
