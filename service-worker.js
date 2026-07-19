const CACHE_NAME = 'daily-proverbs-v5';

// Precached shell + offline content. Bump CACHE_NAME on every release.
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/app-logic.js',
    '/translations.js',
    '/data/proverbs-en.json',
    '/data/proverbs-zh.json',
    '/data/proverbs-es.json',
    '/data/proverbs-fr.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/manifest.json'
];

function isSameOrigin(request) {
    return new URL(request.url).origin === self.location.origin;
}

/** HTML documents and JS: prefer network so deploys take effect quickly. */
function isNetworkFirst(request) {
    if (request.mode === 'navigate') return true;

    const path = new URL(request.url).pathname;
    return (
        path === '/' ||
        path.endsWith('.html') ||
        path.endsWith('.js')
    );
}

async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    try {
        const response = await fetch(request);
        // Only cache successful same-origin responses into the known cache
        if (response && response.status === 200 && response.type === 'basic') {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await cache.match(request);
        if (cached) return cached;
        // Navigations often request "/" which may be stored as /index.html
        if (request.mode === 'navigate') {
            const fallback = await cache.match('/index.html') || await cache.match('/');
            if (fallback) return fallback;
        }
        throw error;
    }
}

/** Static assets (CSS, JSON, icons): cache-first from precache only. */
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    // Do not runtime-cache arbitrary URLs — only serve network for misses.
    // Precache is populated at install time.
    return response;
}

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const { request } = event;

    // Only handle same-origin GET
    if (request.method !== 'GET' || !isSameOrigin(request)) {
        return;
    }

    if (isNetworkFirst(request)) {
        event.respondWith(networkFirst(request));
        return;
    }

    event.respondWith(cacheFirst(request));
});
