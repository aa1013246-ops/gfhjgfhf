// Service Worker for Al-Umam Recruitment Office
// Progressive Web App functionality

const CACHE_NAME = 'samma-sa-v2.0.0';
const STATIC_CACHE = 'samma-static-v2.0.0';
const DYNAMIC_CACHE = 'samma-dynamic-v2.0.0';
const IMAGE_CACHE = 'samma-images-v2.0.0';

// Core files that must be cached
const CORE_FILES = [
    '/',
    '/index.html',
    '/about.html',
    '/services.html',
    '/gallery.html',
    '/news.html',
    '/contact.html',
    '/styles/main.css',
    '/js/main.js',
    '/manifest.json',
    '/sw.js'
];

// Static assets
const STATIC_ASSETS = [
    '/humans.txt',
    '/robots.txt',
    '/sitemap.xml',
    '/favicon.ico',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&family=Amiri:wght@400;700&display=swap'
];

// Cache strategies
const CACHE_STRATEGIES = {
    cacheFirst: ['css', 'js', 'fonts', 'images'],
    networkFirst: ['html', 'api'],
    staleWhileRevalidate: ['css', 'js']
};

// Install event - cache core resources
self.addEventListener('install', function(event) {
    console.log('[Service Worker] Installing v2.0.0...');
    
    event.waitUntil(
        Promise.all([
            // Cache core files
            caches.open(CACHE_NAME)
                .then(function(cache) {
                    console.log('[Service Worker] Caching core files');
                    return cache.addAll(CORE_FILES);
                }),
            // Cache static assets
            caches.open(STATIC_CACHE)
                .then(function(cache) {
                    console.log('[Service Worker] Caching static assets');
                    return cache.addAll(STATIC_ASSETS);
                })
        ])
        .then(function() {
            console.log('[Service Worker] Install completed successfully');
            return self.skipWaiting();
        })
        .catch(function(error) {
            console.error('[Service Worker] Install failed:', error);
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
    console.log('[Service Worker] Activating v2.0.0...');
    
    const expectedCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];
    
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (!expectedCaches.includes(cacheName)) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function() {
            console.log('[Service Worker] Activation completed successfully');
            return self.clients.claim();
        })
        .catch(function(error) {
            console.error('[Service Worker] Activation failed:', error);
        })
    );
});

// Advanced fetch event with multiple caching strategies
self.addEventListener('fetch', function(event) {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip cross-origin requests (except fonts and APIs)
    if (!request.url.startsWith(self.location.origin) && 
        !request.url.includes('fonts.googleapis.com') &&
        !request.url.includes('fonts.gstatic.com')) {
        return;
    }
    
    // Skip POST requests and other non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Determine caching strategy based on request type
    if (isImageRequest(request)) {
        event.respondWith(handleImageRequest(request));
    } else if (isStaticAsset(request)) {
        event.respondWith(handleStaticAsset(request));
    } else if (isHTMLRequest(request)) {
        event.respondWith(handleHTMLRequest(request));
    } else {
        event.respondWith(handleDefaultRequest(request));
    }
});

// Helper functions for different request types
function isImageRequest(request) {
    return request.destination === 'image' || 
           /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(request.url);
}

function isStaticAsset(request) {
    return /\.(css|js|woff|woff2|eot|ttf|otf)$/i.test(request.url);
}

function isHTMLRequest(request) {
    return request.destination === 'document' || 
           request.headers.get('Accept').includes('text/html');
}

// Cache-first strategy for images
function handleImageRequest(request) {
    return caches.open(IMAGE_CACHE)
        .then(function(cache) {
            return cache.match(request)
                .then(function(response) {
                    if (response) {
                        return response;
                    }
                    
                    return fetch(request)
                        .then(function(networkResponse) {
                            if (networkResponse.status === 200) {
                                cache.put(request, networkResponse.clone());
                            }
                            return networkResponse;
                        })
                        .catch(function() {
                            // Return a fallback image if available
                            return caches.match('/assets/fallback-image.png');
                        });
                });
        });
}

// Cache-first strategy for static assets
function handleStaticAsset(request) {
    return caches.match(request)
        .then(function(response) {
            if (response) {
                // Update in background
                fetch(request)
                    .then(function(networkResponse) {
                        if (networkResponse.status === 200) {
                            return caches.open(STATIC_CACHE)
                                .then(function(cache) {
                                    cache.put(request, networkResponse);
                                });
                        }
                    })
                    .catch(function() { /* Fail silently */ });
                
                return response;
            }
            
            return fetch(request)
                .then(function(networkResponse) {
                    if (networkResponse.status === 200) {
                        return caches.open(STATIC_CACHE)
                            .then(function(cache) {
                                cache.put(request, networkResponse.clone());
                                return networkResponse;
                            });
                    }
                    return networkResponse;
                });
        });
}

// Network-first strategy for HTML pages
function handleHTMLRequest(request) {
    return fetch(request)
        .then(function(networkResponse) {
            if (networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(DYNAMIC_CACHE)
                    .then(function(cache) {
                        cache.put(request, responseClone);
                    });
            }
            return networkResponse;
        })
        .catch(function() {
            return caches.match(request)
                .then(function(response) {
                    return response || caches.match('/index.html');
                });
        });
}

// Default caching strategy
function handleDefaultRequest(request) {
    return caches.match(request)
        .then(function(response) {
                // Return cached version or fetch from network
                if (response) {
                    console.log('[Service Worker] Serving from cache:', event.request.url);
                    return response;
                }
                
                console.log('[Service Worker] Fetching from network:', event.request.url);
                return fetch(event.request).then(function(response) {
                    // Don't cache if not a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response
                    const responseToCache = response.clone();
                    
                    // Cache the fetched response
                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                }).catch(function(error) {
                    console.log('[Service Worker] Fetch failed:', error);
                    
                    // Return offline page for HTML requests
                    if (event.request.headers.get('Accept').includes('text/html')) {
                        return caches.match('/offline.html');
                    }
                    
                    // Return error for other requests
                    throw error;
                });
            })
    );
});

// Background sync
self.addEventListener('sync', function(event) {
    console.log('[Service Worker] Background sync:', event.tag);
    
    if (event.tag === 'contact-form') {
        event.waitUntil(sendContactForm());
    }
});

// Push notifications
self.addEventListener('push', function(event) {
    console.log('[Service Worker] Push received');
    
    const options = {
        body: event.data ? event.data.text() : 'رسالة جديدة من مكتب الأمم للاستقدام',
        icon: '/assets/icon-192x192.png',
        badge: '/assets/badge-72x72.png',
        dir: 'rtl',
        lang: 'ar',
        tag: 'samma-notification',
        requireInteraction: true,
        actions: [
            {
                action: 'view',
                title: 'عرض',
                icon: '/assets/action-view.png'
            },
            {
                action: 'close',
                title: 'إغلاق',
                icon: '/assets/action-close.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('مكتب الأمم للاستقدام', options)
    );
});

// Notification click
self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Notification clicked');
    
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('https://samma-sa.com')
        );
    }
});

// Message from main thread
self.addEventListener('message', function(event) {
    console.log('[Service Worker] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Helper functions
function sendContactForm() {
    // Implement contact form submission logic
    return Promise.resolve();
}

// Update cache periodically
function updateCache() {
    console.log('[Service Worker] Updating cache...');
    
    return caches.open(CACHE_NAME)
        .then(function(cache) {
            return cache.addAll(urlsToCache);
        })
        .then(function() {
            console.log('[Service Worker] Cache updated');
        })
        .catch(function(error) {
            console.log('[Service Worker] Cache update failed:', error);
        });
}

// Periodic background sync
setInterval(updateCache, 24 * 60 * 60 * 1000); // Update every 24 hours