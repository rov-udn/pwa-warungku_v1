const CACHE_NAME = 'warungku-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  // Jangan masukkan file firebase dynamic di sini, cukup file statis inti
];

// 1. Install Service Worker & Simpan Aset Inti
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Aktivasi & Hapus Cache Lama jika ada update
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Strategi Network First dengan Fallback Cache
// Mencoba ambil data terbaru dari internet, kalau gagal/offline, ambil dari memori lokal
self.addEventListener('fetch', (e) => {
  // Abaikan request ke Firebase Auth atau Realtime DB agar tidak bentrok dengan SDK
  if (e.request.url.includes('firebase') || e.request.url.includes('firestore')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Jika sukses dapat internet, kloning hasilnya ke memori cache
        if (response.status === 200) {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(e.request).then((res) => res || fetch(e.request)))
  );
});