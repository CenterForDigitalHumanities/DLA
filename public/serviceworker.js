const filesToCache = [
    '/',
    '/index.html',
    // '/pages/offline.html',
    // '/pages/404.html'
]
const staticCacheName = 'deer-cache-20251217'
// Collections may include many records; allow a larger cache size
const maxCacheSize = 2000

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
    // Only handle GET requests
    if (event.request.method !== 'GET') return

    const requestUrl = new URL(event.request.url)
    const allowedOrigins = [self.location.origin, 'https://store.rerum.io']
    const isAllowedOrigin = allowedOrigins.some(o => requestUrl.origin === o)
    if (!isAllowedOrigin) return

    // Support forced refresh via ?refresh=true
    const forceRefresh = requestUrl.searchParams.get('refresh') === 'true'

    event.respondWith((async () => {
        try {
            const cache = await caches.open(staticCacheName)

            if (forceRefresh) {
                const netResp = await fetch(event.request)
                if (netResp && netResp.ok) {
                    await cache.put(event.request.url, netResp.clone())
                    trimCache(staticCacheName, maxCacheSize)
                }
                return netResp
            }

            const cached = await cache.match(event.request)
            if (cached) return cached

            const networkResponse = await fetch(event.request)
            if (!networkResponse || !networkResponse.ok) return networkResponse

            // Only cache permissive response types
            if (['basic', 'cors', 'opaque'].includes(networkResponse.type)) {
                await cache.put(event.request.url, networkResponse.clone())
                trimCache(staticCacheName, maxCacheSize)
            }

            return networkResponse
        } catch (err) {
            console.error('ServiceWorker fetch handler error:', err)
            return caches.match('/pages/offline.html')
        }
    })())
})

// Trim cache to max entries (FIFO)
async function trimCache(cacheName, maxItems) {
    try {
        const cache = await caches.open(cacheName)
        const keys = await cache.keys()
        if (keys.length <= maxItems) return
        const removeCount = keys.length - maxItems
        for (let i = 0; i < removeCount; i++) {
            await cache.delete(keys[i])
        }
    } catch (err) {
        console.error('trimCache error:', err)
    }
}
