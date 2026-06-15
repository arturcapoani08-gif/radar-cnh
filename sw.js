// ═══════════════════════════════════════════════
// Radar CNH — Service Worker v4
// ═══════════════════════════════════════════════
const CACHE = 'radar-cnh-v18';

const LOCAL_ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

const CDN_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Titillium+Web:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,300;1,400;1,600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      cache.addAll(LOCAL_ASSETS).catch(() => {});
      CDN_ASSETS.forEach(url => {
        fetch(url, { mode: 'cors' })
          .then(r => { if (r.ok) cache.put(url, r); })
          .catch(() => {});
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(r => {
        if (r.ok) {
          const cl = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, cl));
        }
        return r;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
