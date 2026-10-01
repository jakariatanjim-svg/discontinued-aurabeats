// AuraBeats Service Worker — Offline-First PWA Shell
const CACHE = "aurabeats-v3";
const SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.svg",
  "/icon-512.png",
  "/og-card.svg"
];

self.addEventListener("install", (e) => {
  // Force installing the new worker immediately
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL))
  );
});

self.addEventListener("activate", (e) => {
  // Claim clients immediately so the worker takes over the current page
  e.waitUntil(self.clients.claim());
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  
  // 1. Handle Navigation Requests (e.g., /home, /search, or PWA startup)
  // For any HTML page request, we MUST return index.html from cache if offline.
  if (e.request.mode === "navigate" || (e.request.method === "GET" && e.request.headers.get("accept")?.includes("text/html"))) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // 2. We only cache our own app assets (JS, CSS, Images from our domain)
  // We NEVER cache the music API calls (JioSaavn, Audius) here, nor the MP3 streams
  if (url.origin !== location.origin) return;

  // 3. Static Assets (JS, CSS) — Network First, fallback to Cache
  // Vite generates new filenames for JS/CSS on every build (e.g., index-xyz.js).
  // Network-first ensures users get the latest app if online.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Save the valid new asset to cache
        if (res && res.status === 200 && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // If offline, serve from cache
        return caches.match(e.request);
      })
  );
});
