// AuraBeats Service Worker — aggressive caching for offline app shell
const CACHE = "aurabeats-v2";
const SHELL = [
  "/",
  "/home",
  "/search",
  "/radio",
  "/library",
  "/favorites",
  "/history",
  "/downloads",
  "/settings",
  "/about",
  "/privacy",
  "/index.html",
  "/manifest.json",
  "/icon.svg",
  "/icon-512.png",
  "/og-card.svg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => {
      // Add all known app routes to cache so they work offline directly
      return c.addAll(SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  
  // 1. Navigation requests (pages) — always serve index.html for SPA routes
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // 2. Only cache same-origin assets
  if (url.origin !== location.origin) return;

  // 3. Static assets — Cache-First strategy
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (!res || res.status !== 200 || res.type !== "basic") return res;
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return res;
      });
    })
  );
});
