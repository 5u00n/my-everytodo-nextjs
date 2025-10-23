// Service Worker with automatic updates and cache management
// This will be generated with a unique version on each build

const CACHE_VERSION = '{{BUILD_VERSION}}'; // This will be replaced during build
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
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || '1'
      },
      actions: [
        {
          action: 'complete',
          title: 'Mark Complete',
          icon: '/icon-192.svg'
        },
        {
          action: 'snooze',
          title: 'Snooze 1 min',
          icon: '/icon-192.svg'
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

// Handle background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    // Handle background sync tasks here
  }
});

// Handle message events
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
