const CACHE_NAME = "ai-app-v2"; // Change to v3, v4, etc. to force an update
const ASSETS = [
  "./",
  "./index.html",
  "./env.js",             // Only uncomment if you actually have this file
   "./manifest.json",      // Only uncomment if you have a physical manifest file
  "./icons/icon-192.png", // Only uncomment if you have these icons
  "./icons/icon-512.png",
  "https://cdn.jsdelivr.net/npm/marked/marked.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-dark-reasonable.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js",
  "https://fonts.googleapis.com/icon?family=Material+Icons+Round",
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
];

// 1. INSTALL: Cache assets immediately
self.addEventListener("install", (e) => {
  self.skipWaiting(); // Forces this new SW to become active immediately
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching Assets");
      return cache.addAll(ASSETS);
    })
  );
});

// 2. ACTIVATE: Auto-Clear Old Caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control of the page immediately
});

// 3. FETCH: Load from Phone First, Then Internet
self.addEventListener("fetch", (e) => {
  // Ignore non-GET requests (like API calls)
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request).then((cachedRes) => {
      return cachedRes || fetch(e.request);
    })
  );
});
