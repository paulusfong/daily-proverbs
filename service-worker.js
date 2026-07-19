// Cache name: bump on every release that changes precached assets.
const CACHE_NAME = 'daily-proverbs-v7';

// Paths relative to the service worker scope (works on domain root and
// GitHub Pages project sites like /daily-proverbs/).
const PRECACHE_PATHS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './app-logic.js',
    './translations.js',
    './data/proverbs-en.json',
    './data/proverbs-zh.json',
    './data/proverbs-es.json',
    './data/proverbs-fr.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './manifest.json'
];

function scopeURL(relativePath) {
    return new URL(relativePath, self.registration.scope).href;
}

function isSameOrigin(request) {
    return new URL(request.url).origin === self.location.origin;
}

function isInScope(request) {
    return request.url.startsWith(self.registration.scope);
}

/** HTML documents and JS: prefer network so deploys take effect quickly. */
function isNetworkFirst(request) {
    if (request.mode === 'navigate') return true;

    const path = new URL(request.url).pathname;
    return path.endsWith('.html') || path.endsWith('.js') || path.endsWith('/');
}

async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    try {
        const response = await fetch(request);
        if (response && response.status === 200 && response.type === 'basic') {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await cache.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') {
            const fallback =
                (await cache.match(scopeURL('./index.html'))) ||
                (await cache.match(scopeURL('./')));
            if (fallback) return fallback;
        }
        throw error;
    }
}

/** Static assets: cache-first (precache + any previously network-updated shell). */
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return fetch(request);
}

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_PATHS.map(scopeURL)))
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

    if (request.method !== 'GET' || !isSameOrigin(request) || !isInScope(request)) {
        return;
    }

    if (isNetworkFirst(request)) {
        event.respondWith(networkFirst(request));
        return;
    }

    event.respondWith(cacheFirst(request));
});
