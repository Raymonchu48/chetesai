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

self.addEventListener("push", event => {
  // A push with no payload does not transmit private client data to notification services.
  const title = "Chetesaí Fitness+";
  event.waitUntil(self.registration.showNotification(title, {
    body: "Tienes un recordatorio en tu portal. Abre Chetesaí para consultar los detalles.",
    icon: "/brand/app-icon-192.png",
    badge: "/brand/app-icon-192.png",
    tag: "chetesai-recordatorio",
    data: { url: "/portal" }
  }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = new URL("/portal", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async clients => {
    const existing = clients.find(client => client.url.startsWith(self.location.origin) && "focus" in client);
    if (existing) { await existing.focus(); if ("navigate" in existing) return existing.navigate(url); }
    return self.clients.openWindow(url);
  }));
});
