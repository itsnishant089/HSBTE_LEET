const CACHE_NAME = 'hsbte-leet-v4';
const NETWORK_ONLY_PATHS = [
  '/counseling',
  '/counseling-admin',
  '/user-counseling',
  '/premium-login',
  '/premium-admin',
  '/html/counseling.html',
  '/html/counseling-admin.html',
  '/html/user-counseling.html',
  '/html/premium-login.html',
  '/html/premium-admin.html',
  '/js/lead-capture.js'
];
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/main.js',
  '/js/include.js',
  '/js/chatbot.js',
  '/js/search.js',
  '/js/translate.js',
  '/partials/header.html',
  '/partials/footer.html',
  '/partials/chatbot.html',
  '/image/robo.webp',
  '/image/favicon.webp'
];

/** Install Event: Cache essential assets */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('SW: Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

/** Activate Event: Cleanup old caches */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

/** Fetch Event: Stale-While-Revalidate Strategy */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const shouldBypassCache = NETWORK_ONLY_PATHS.some(path => url.pathname === path || url.pathname.endsWith(path));

  // We don't cache API calls or Google Analytics/Clarity in SW (they have their own logic)
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  if (shouldBypassCache) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
            // Update cache in background
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
        }).catch(() => response); // Fallback to cache if network fails

        return response || fetchPromise;
      });
    })
  );
});
