const CACHE_NAME = 'wfh-movement-v11';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/exercises.js',
  '/storage.js',
  '/rotation.js',
  '/coaching.js',
  '/reminder.js',
  '/timer.js',
  '/game.js',
  '/quests.js',
  '/insights.js',
  '/figures.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
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
      self.registration.showNotification('Time to move', {
        body: 'Your next quest is ready. Two minutes buys back an hour of sitting.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'wfh-movement-break',
        renotify: true,
        data: { url: '/' },
        actions: [
          { action: 'start', title: 'Start quest' },
          { action: 'later', title: 'Later' }
        ]
      });
    }, delayMs);
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const action = event.action;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const client = list[0];
      if (client) {
        client.focus();
        if (action === 'start') client.postMessage({ type: 'START_SUGGESTED' });
        else if (action === 'later') client.postMessage({ type: 'SNOOZE' });
        else client.postMessage({ type: 'SHOW_CHOICE' });
        return;
      }
      if (action === 'later') return;
      return clients.openWindow(action === 'start' ? '/?break=start' : '/');
    })
  );
});
