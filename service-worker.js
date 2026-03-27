const CACHE_NAME = 'melona-v3'; // Naikkan versi ke v3 untuk membersihkan cache lama
const assets = [
  './',
  './index.html',
  './melona_logo.png'
];

// 1. Install & Cache Assets
self.addEventListener('install', e => {
  self.skipWaiting(); 
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

// 3. Strategi: Stale-While-Revalidate dengan Filter Method
self.addEventListener('fetch', e => {
  // PENTING: Hanya proses permintaan GET. 
  // POST, PUT, DELETE (Firebase/Analytics) tidak boleh di-cache.
  if (e.request.method !== 'GET') return;

  // Abaikan permintaan ke Firebase Firestore agar tidak konflik dengan cache internal Firebase
  if (e.request.url.includes('firestore.googleapis.com')) return;

  e.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(e.request).then(response => {
        const fetchPromise = fetch(e.request).then(networkResponse => {
          // Hanya simpan ke cache jika status OK (200)
          if (networkResponse && networkResponse.status === 200) {
            cache.put(e.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
           // Fallback jika offline dan data tidak ada di cache
           return response; 
        });

        // Kembalikan dari cache dulu (cepat), fetchPromise akan update cache di background
        return response || fetchPromise;
      });
    })
  );
});
