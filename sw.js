// A Gift of Time — Service Worker
const CACHE_NAME = 'rc-v167';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/clock.js',
  '/studio.hdr',
  '/icon-192.png',
  '/icon-512.png',
  '/og-image.png',
  '/apple-touch-icon.png'
];

// Install: cache core assets
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Fetch: network-first, fallback to cache
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).then(r => {
      const clone = r.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return r;
    }).catch(() => caches.match(e.request))
  );
});

// Handle notification click — focus or open the app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('/') && 'focus' in c) return c.focus();
      }
      return clients.openWindow('/');
    })
  );
});

// Receive push events (future: server-sent prayer notifications)
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'Ramadan Clock', body: 'Prayer time' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'prayer',
      renotify: true
    })
  );
});
