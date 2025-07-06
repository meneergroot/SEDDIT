// Service Worker for SEDDIT PWA
const CACHE_NAME = 'seddit-v1.0.0';
const STATIC_CACHE = 'seddit-static-v1.0.0';
const DYNAMIC_CACHE = 'seddit-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/index.html',
    '/manifest.json',
    '/styles/main.css',
    '/styles/components.css',
    '/styles/responsive.css',
    '/js/app.js',
    '/js/utils/constants.js',
    '/js/utils/helpers.js',
    '/js/utils/storage.js',
    '/js/hooks/useWallet.js',
    '/js/hooks/useTransactions.js',
    '/js/components/Tweet.js',
    '/js/components/Toast.js',
    '/js/pages/Feed.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js',
    'https://unpkg.com/@solana/wallet-adapter-base@latest/lib/index.iife.min.js',
    'https://unpkg.com/@solana/wallet-adapter-phantom@latest/lib/index.iife.min.js'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Caching static files...');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Error caching static files:', error);
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
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
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

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle different types of requests
    if (url.origin === self.location.origin) {
        // Same-origin requests
        event.respondWith(handleSameOriginRequest(request));
    } else if (url.origin === 'https://fonts.googleapis.com' || 
               url.origin === 'https://cdnjs.cloudflare.com' ||
               url.origin === 'https://unpkg.com') {
        // External resources
        event.respondWith(handleExternalRequest(request));
    } else {
        // Other requests - network first
        event.respondWith(handleNetworkFirstRequest(request));
    }
});

// Handle same-origin requests (cache first)
async function handleSameOriginRequest(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Fallback to network
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Error handling same-origin request:', error);
        
        // Return offline page for HTML requests
        if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
        }
        
        throw error;
    }
}

// Handle external requests (cache first)
async function handleExternalRequest(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Fallback to network
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Error handling external request:', error);
        throw error;
    }
}

// Handle network-first requests
async function handleNetworkFirstRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Network failed, trying cache:', error);
        
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// Handle background sync
async function doBackgroundSync() {
    try {
        // Get stored offline actions
        const offlineActions = await getOfflineActions();
        
        if (offlineActions.length > 0) {
            console.log('Processing offline actions:', offlineActions.length);
            
            // Process each offline action
            for (const action of offlineActions) {
                try {
                    await processOfflineAction(action);
                    await removeOfflineAction(action.id);
                } catch (error) {
                    console.error('Error processing offline action:', error);
                }
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Get stored offline actions
async function getOfflineActions() {
    try {
        const db = await openDB();
        const transaction = db.transaction(['offlineActions'], 'readonly');
        const store = transaction.objectStore('offlineActions');
        return await store.getAll();
    } catch (error) {
        console.error('Error getting offline actions:', error);
        return [];
    }
}

// Process offline action
async function processOfflineAction(action) {
    // Implement based on action type
    switch (action.type) {
        case 'post_tweet':
            // Process tweet posting
            break;
        case 'like_tweet':
            // Process tweet liking
            break;
        case 'retweet':
            // Process retweeting
            break;
        default:
            console.warn('Unknown action type:', action.type);
    }
}

// Remove processed offline action
async function removeOfflineAction(actionId) {
    try {
        const db = await openDB();
        const transaction = db.transaction(['offlineActions'], 'readwrite');
        const store = transaction.objectStore('offlineActions');
        await store.delete(actionId);
    } catch (error) {
        console.error('Error removing offline action:', error);
    }
}

// Open IndexedDB
async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('SEDDITOfflineDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create object store for offline actions
            if (!db.objectStoreNames.contains('offlineActions')) {
                const store = db.createObjectStore('offlineActions', { keyPath: 'id', autoIncrement: true });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('Push notification received:', event);
    
    const options = {
        body: event.data ? event.data.text() : 'New activity on SEDDIT!',
        icon: '/assets/icon-192x192.png',
        badge: '/assets/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View',
                icon: '/assets/icon-72x72.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/assets/icon-72x72.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('SEDDIT', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker received message:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_TWEETS') {
        cacheTweets(event.data.tweets);
    }
});

// Cache tweets for offline viewing
async function cacheTweets(tweets) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        
        for (const tweet of tweets) {
            const response = new Response(JSON.stringify(tweet), {
                headers: { 'Content-Type': 'application/json' }
            });
            
            const url = `/api/tweets/${tweet.id}`;
            await cache.put(url, response);
        }
        
        console.log('Tweets cached successfully');
    } catch (error) {
        console.error('Error caching tweets:', error);
    }
}

console.log('Service Worker script loaded'); 