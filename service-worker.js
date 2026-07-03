const CACHE_NAME = 'wfh-movement-v6';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/exercises.js',
  '/storage.js',
  '/rotation.js',
  '/reminder.js',
  '/timer.js',
  '/game.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SCHEDULE_NOTIFICATION') {
    const { delayMs, title, body } = event.data;
    setTimeout(() => {
      self.registration.showNotification('Focus Buff available', {
        body: 'Pick your energy: easy, medium, or hard',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'wfh-movement-break',
        renotify: true,
        data: { url: '/' },
        actions: [
          { action: 'easy', title: '🌱 Easy' },
          { action: 'medium', title: '🚶 Medium' },
          { action: 'hard', title: '🔥 Hard' }
        ]
      });
    }, delayMs);
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const tier = ['easy', 'medium', 'hard'].includes(event.action) ? event.action : null;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const client = list[0];
      if (client) {
        client.focus();
        if (tier) client.postMessage({ type: 'START_TIER', tier });
        else client.postMessage({ type: 'SHOW_CHOICE' });
        return;
      }
      const url = tier ? `/?tier=${tier}` : '/';
      return clients.openWindow(url);
    })
  );
});
