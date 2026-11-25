/* Elite Smart Hub: small service worker so the site can be installed as an app. Network first; cache only as offline fallback. */
const C = "esh-v4";
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(["./", "assets/site.css", "assets/site.js", "img/icon-192.png"]).catch(() => { }))) });
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET" || new URL(r.url).origin !== location.origin || /\/(admin|shop-api)/.test(r.url)) return;
  e.respondWith(fetch(r).then(res => { if (res.ok && /\.(css|js|jpg|png|webp|svg)$/.test(new URL(r.url).pathname)) { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)) } return res }).catch(() => caches.match(r).then(m => m || caches.match("./"))));
});
