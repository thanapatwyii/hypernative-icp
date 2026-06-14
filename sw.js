var VERSION = "icp-v5";

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  var isShell = url.origin === location.origin && (url.pathname.endsWith("/") || url.pathname.endsWith("index.html"));
  if (isShell) {
    e.respondWith(
      fetch(req).then(function (r) {
        var copy = r.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copy); });
        return r;
      }).catch(function () { return caches.match(req); })
    );
  } else {
    e.respondWith(
      caches.match(req).then(function (hit) {
        return hit || fetch(req).then(function (r) {
          if (r && (r.status === 200 || r.type === "opaque")) {
            var copy = r.clone();
            caches.open(VERSION).then(function (c) { c.put(req, copy); });
          }
          return r;
        });
      })
    );
  }
});
