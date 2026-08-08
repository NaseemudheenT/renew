/* Renew service worker — conservative and update-safe.
 * - Immutable Next static assets: cache-first (hashed URLs, never stale).
 * - Navigations: network-first with an offline fallback to the cached shell.
 * - API/auth: never cached.
 * - skipWaiting + clients.claim so new versions take over immediately.
 */
const CACHE = "renew-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api")) return; // never cache API/auth

  // Immutable, content-hashed static assets: cache-first.
  if (url.pathname.startsWith("/_next/static")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })(),
    );
    return;
  }

  // Navigations and everything else: network-first, offline fallback to cache.
  event.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        if (req.mode === "navigate" && res.ok) {
          const cache = await caches.open(CACHE);
          cache.put(req, res.clone());
        }
        return res;
      } catch (err) {
        const cache = await caches.open(CACHE);
        const hit = (await cache.match(req)) || (await cache.match("/"));
        if (hit) return hit;
        throw err;
      }
    })(),
  );
});
