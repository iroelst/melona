const CACHE_NAME = 'melona-v2'; // Ubah v1 ke v2 agar cache lama terbuang
const assets = [
  './',
  './index.html',
  './melona_logo.png'
];

// 1. Install & Cache Assets
self.addEventListener('install', e => {
  self.skipWaiting(); // Paksa service worker baru aktif segera
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// 2. Aktivasi & Pembersihan Cache Lama
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// 3. Strategi: Stale-While-Revalidate (Cepat tapi Tetap Update)
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(e.request).then(response => {
        const fetchPromise = fetch(e.request).then(networkResponse => {
          // Update cache dengan versi terbaru dari internet
          if (networkResponse.status === 200) {
            cache.put(e.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
           // Jika offline dan tidak ada di cache, biarkan saja error
        });

        // Kembalikan response dari cache jika ada, atau tunggu hasil network
        return response || fetchPromise;
      });
    })
  );
});
