const OFFLINE_CACHE = "chetesai-offline-v1";
const OFFLINE_PAGE = "/offline.html";

self.addEventListener("install", event => {
  event.waitUntil(caches.open(OFFLINE_CACHE).then(cache => cache.add(OFFLINE_PAGE)));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith("chetesai-offline-") && key !== OFFLINE_CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

// Only the public offline document is cached. Account pages and APIs always use the network.
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || event.request.mode !== "navigate" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(async () =>
    (await caches.match(OFFLINE_PAGE)) || Response.error()
  ));
});
