const CACHE_NAME = "ai-app-v1";
const ASSETS = [
  "./",
  "./index.html",
    "./env.js",
  "./icons/icon-192.png", // Optional: Add this if you created icons
  "./icons/icon-512.png
  "./manifest.json",
  "https://cdn.jsdelivr.net/npm/marked/marked.min.js"
];

// Install Event (Downloads the app to the phone)
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Fetch Event (Loads from phone first, then internet)
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});


