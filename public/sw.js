// Service Worker with automatic updates and cache management
// This will be generated with a unique version on each build

const CACHE_VERSION = '1761240527495-927540a'; // This will be replaced during build
const CACHE_NAME = `everytodo-v${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `everytodo-static-v${CACHE_VERSION}`;

// Static assets to cache
const STATIC_URLS = [
  '/',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/_next/static/css/',
  '/_next/static/js/'
];

// Dynamic cache for API calls and other resources
const DYNAMIC_CACHE_NAME = `everytodo-dynamic-v${CACHE_VERSION}`;

// Install event - cache static resources and skip waiting
self.addEventListener('install', (event) => {
  console.log(`Service Worker: Installing version ${CACHE_VERSION}...`);
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching static assets...');
        return cache.addAll(STATIC_URLS).catch((error) => {
          console.log('Service Worker: Static cache failed:', error);
          return Promise.allSettled(
            STATIC_URLS.map(url => 
              cache.add(url).catch(err => console.log(`Service Worker: Failed to cache ${url}:`, err))
            )
          );
        });
      }),
      // Create dynamic cache
      caches.open(DYNAMIC_CACHE_NAME)
    ]).then(() => {
      console.log('Service Worker: Installation complete, skipping waiting...');
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log(`Service Worker: Activating version ${CACHE_VERSION}...`);
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.includes(CACHE_VERSION)) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker: Activation complete, claiming clients...');
      // Notify all clients about the update
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: CACHE_VERSION,
            message: 'New version available!'
          });
        });
      });
    })
  );
});

// Fetch event - serve from cache with network fallback
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
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache:', request.url);
          return cachedResponse;
        }
        
        // If not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Determine which cache to use
            const cacheName = isStaticAsset(request.url) ? STATIC_CACHE_NAME : DYNAMIC_CACHE_NAME;
            
            // Cache the response
            caches.open(cacheName)
              .then((cache) => {
                cache.put(request, responseToCache);
                console.log('Service Worker: Cached response:', request.url);
              });
            
            return response;
          })
          .catch((error) => {
            console.log('Service Worker: Fetch failed:', request.url, error);
            // Return a fallback response for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/') || new Response('Offline', { status: 503 });
            }
            throw error;
          });
      })
  );
});

// Helper function to determine if a URL is a static asset
function isStaticAsset(url) {
  return url.includes('/_next/static/') || 
         url.includes('/icon-') || 
         url.includes('/manifest.json') ||
         url === self.location.origin + '/';
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: 'EveryTodo Alarm',
    body: 'Your todo alarm is ringing!',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: 'everytodo-alarm',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    actions: [
      { action: 'complete', title: 'Mark Done', icon: '/icon-192.svg' },
      { action: 'snooze', title: 'Snooze 5min', icon: '/icon-192.svg' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icon-192.svg' }
    ],
    data: {
      timestamp: Date.now(),
      type: 'alarm'
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        tag: data.tag || `alarm-${Date.now()}`,
        data: {
          ...notificationData.data,
          ...data,
          todoId: data.todoId,
          type: data.type || 'alarm'
        }
      };
    } catch (error) {
      console.log('Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action, event.notification.data);
  event.notification.close();

  const data = event.notification.data;
  const action = event.action;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          
          // Send message to the app about the notification action
          client.postMessage({
            type: 'NOTIFICATION_ACTION',
            action: action || 'click',
            todoId: data?.todoId,
            minutes: action === 'snooze' ? 5 : undefined
          });
          
          return;
        }
      }
      
      // If no window is open, open a new one
      if (clients.openWindow) {
        let url = '/';
        if (action === 'complete' && data?.todoId) {
          url = `/?action=complete&id=${data.todoId}`;
        } else if (action === 'snooze' && data?.todoId) {
          url = `/?action=snooze&id=${data.todoId}`;
        }
        
        return clients.openWindow(url).then(newClient => {
          if (newClient) {
            // Send message to the new window
            newClient.postMessage({
              type: 'NOTIFICATION_ACTION',
              action: action || 'click',
              todoId: data?.todoId,
              minutes: action === 'snooze' ? 5 : undefined
            });
          }
        });
      }
    })
  );
});

// Handle background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    // Handle background sync tasks here
  }
});

// Handle message events
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'SEND_PUSH_NOTIFICATION') {
    // Handle push notification request from main app
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        ...options,
        icon: '/icon-192.svg',
        badge: '/icon-192.svg',
        vibrate: [200, 100, 200, 100, 200, 100, 200]
      })
    );
  }
});
