/* Chetesaí Fitness+ PWA — deliberadamente no se almacena información privada. */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(
          "<!doctype html><html lang='es'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Sin conexión · Chetesaí Fitness+</title><body style='background:#101914;color:#f7f3ea;font:16px system-ui;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center'><main><h1>Chetesaí Fitness+</h1><p>Necesitas conexión a Internet para consultar tu portal privado.</p><button style='padding:12px 24px;border:0;border-radius:12px;background:#8cdb78;color:#101914;font-weight:700' onclick='location.reload()'>Reintentar</button></main></body></html>",
          { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
        )
    )
  );
});
