const CACHE_NAME = 'everytodo-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache).catch((error) => {
          console.log('Cache addAll failed:', error);
          // Try to add each URL individually
          return Promise.allSettled(
            urlsToCache.map(url => 
              cache.add(url).catch(err => console.log(`Failed to cache ${url}:`, err))
            )
          );
        });
      })
  );
});

// Fetch event - serve from cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || '1'
      },
      actions: [
        {
          action: 'complete',
          title: 'Mark Complete',
          icon: '/icon-192.png'
        },
        {
          action: 'snooze',
          title: 'Snooze 1 min',
          icon: '/icon-192.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'complete') {
    // Handle complete action
    event.waitUntil(
      clients.openWindow('/?action=complete&id=' + event.notification.data.primaryKey)
    );
  } else if (event.action === 'snooze') {
    // Handle snooze action
    event.waitUntil(
      clients.openWindow('/?action=snooze&id=' + event.notification.data.primaryKey)
    );
  } else {
    // Default click action
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
