const filesToCache = [
    '/',
    '/index.html',
    // '/pages/offline.html',
    // '/pages/404.html'
]
const staticCacheName = 'deer-cache-20251217'
const maxCacheSize = 50

self.addEventListener('install', event => {
    console.log('Attempting to install service worker and cache static assets')
    // self.skipWaiting()
    event.waitUntil(
        caches.open(staticCacheName)
            .then(cache => {
                return cache.addAll(filesToCache)
            })
    )
})

self.addEventListener('activate', event => {
    console.log('Activating new service worker...')

    const cacheWhitelist = [staticCacheName]

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName)
                    }
                })
            )
        })
    )
})

self.addEventListener('fetch', event => {
    // Only cache same-origin GET requests
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        return
    }
    
    console.log('Fetch event for ', event.request.url)
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    console.log('Found ', event.request.url, ' in cache')
                    return response
                }
                console.log('Network request for ', event.request.url)
                return fetch(event.request)
                    .then(response => {
                        // Don't cache error responses
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response
                        }
                        
                        // Cache successful responses
                        return caches.open(staticCacheName).then(cache => {
                            cache.put(event.request.url, response.clone())
                            return response
                        })
                    })
                    .catch(error => {
                        console.log('Fetch error: ', error)
                        return caches.match('/pages/offline.html')
                    })
            })
    )
})
