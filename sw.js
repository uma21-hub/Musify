/* ═══════════════════════════════════════════════════════
   Play For You — Service Worker v3.0
   Fixed for GitHub Pages & mobile PWA install
═══════════════════════════════════════════════════════ */
const CACHE_NAME = "playforyou-v3";
const OFFLINE_URL = "./index.html";

// Only cache the app shell — never cache media streams
const CACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// Install: cache app shell
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: delete old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: serve from cache for shell, network for everything else
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  
  // Always network-only for these (media streams, APIs)
  const networkOnly = [
    "youtube.com", "youtu.be", "googlevideo.com",
    "googleapis.com", "ytimg.com",
    "itunes.apple.com", "mzstatic.com",
    "allorigins.win", "cors-anywhere"
  ];
  
  if(networkOnly.some(domain => url.hostname.includes(domain))) {
    return; // Let browser handle it
  }

  // Cache-first for local files
  if(url.origin === self.location.origin || event.request.mode === "navigate") {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if(cached) return cached;
        return fetch(event.request).then(response => {
          // Cache successful GET responses for local files
          if(response.ok && event.request.method === "GET") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => caches.match(OFFLINE_URL));
      })
    );
  }
});

// Message: force update
self.addEventListener("message", event => {
  if(event.data === "SKIP_WAITING") self.skipWaiting();
});
