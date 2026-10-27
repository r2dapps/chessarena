const CACHE_CORE = 'chess-core-v2';
const CACHE_MODELS = 'chess-models-v2';

const CORE_ASSETS = [
  './',
  'index.html',
  'app.bundle.js',
  'engine.js',
  'ai-worker.js',
  'icon.svg',
  'manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_CORE).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_CORE && key !== CACHE_MODELS) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignore non-GET requests and cross-origin external queries (e.g. peerjs signaling)
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Large 3D binary assets (GLB & HDR): Cache-first
  if (url.pathname.endsWith('.glb') || url.pathname.endsWith('.hdr')) {
    event.respondWith(
      caches.open(CACHE_MODELS).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const res = await fetch(event.request);
          if (res && res.status === 200) {
            cache.put(event.request, res.clone());
          }
          return res;
        } catch (err) {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // Navigation requests: Network-first falling back to cached shell
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_CORE).then((cache) => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => caches.match('index.html'))
    );
    return;
  }

  // Core shell assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_CORE).then((cache) => cache.put(event.request, clone));
        }
        return networkRes;
      }).catch(() => null);

      return cached || fetchPromise;
    })
  );
});
