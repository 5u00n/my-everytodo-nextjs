const CACHE_NAME = 'everytodo-v1';
const urlsToCache = [
  '/',
  '/calendar/',
  '/reports/',
  '/icon-192x192.svg',
  '/icon-512x512.svg',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event
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

// Background sync for alarms
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: data.tag,
      requireInteraction: data.persistent || false,
      actions: [
        {
          action: 'complete',
          title: 'Mark Complete',
          icon: '/icon-192x192.png'
        },
        {
          action: 'snooze',
          title: 'Snooze 1 min',
          icon: '/icon-192x192.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'complete') {
    // Send message to main thread to complete todo
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          action: 'complete-todo',
          todoId: event.notification.tag?.replace('alarm-', '')
        });
      });
    });
  } else if (event.action === 'snooze') {
    // Send message to main thread to snooze todo
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          action: 'snooze-todo',
          todoId: event.notification.tag?.replace('alarm-', '')
        });
      });
    });
  } else {
    // Default click - focus the app
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        if (clients.length > 0) {
          return clients[0].focus();
        } else {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data.action === 'closeNotification') {
    self.registration.getNotifications({ tag: event.data.tag }).then((notifications) => {
      notifications.forEach((notification) => {
        notification.close();
      });
    });
  }
});

// Background sync function
async function doBackgroundSync() {
  try {
    // Check for due alarms and trigger notifications
    const response = await fetch('/api/check-due-alarms');
    if (response.ok) {
      const alarms = await response.json();
      for (const alarm of alarms) {
        self.registration.showNotification(
          `⏰ ${alarm.title}`,
          {
            body: alarm.description || 'Time to complete your tasks!',
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: `alarm-${alarm.id}`,
            requireInteraction: true,
            vibrate: alarm.vibrate ? [200, 100, 200] : undefined,
            actions: [
              {
                action: 'complete',
                title: 'Mark Complete',
                icon: '/icon-192x192.png'
              },
              {
                action: 'snooze',
                title: 'Snooze 1 min',
                icon: '/icon-192x192.png'
              }
            ]
          }
        );
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}
