var CACHE = 'cw-park-v3';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './icon-512.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  // Network first for HTML — always get fresh content, fall back to cache
  if(e.request.url.indexOf('.html') > -1 || e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(function(response) {
        var clone = response.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        return response;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
  } else {
    // Cache first for everything else (icons, manifest)
    e.respondWith(
      caches.match(e.request).then(function(r) {
        return r || fetch(e.request).then(function(response) {
          var clone = response.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
          return response;
        });
      })
    );
  }
});
