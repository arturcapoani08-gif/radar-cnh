// ═══════════════════════════════════════════════
// Radar CNH — Service Worker
// Versão do cache: incrementar ao atualizar o app
// ═══════════════════════════════════════════════
const CACHE = 'radar-cnh-v3';

// Recursos locais sempre em cache
const LOCAL_ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// CDNs externos — tenta rede, cai no cache
const CDN_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Titillium+Web:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,300;1,400;1,600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
];

// ── Install: pré-cacheia tudo ──────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => {
      // Locais: tenta cachear silenciosamente
      cache.addAll(LOCAL_ASSETS).catch(() => {});
      // CDNs: tenta silenciosamente
      CDN_ASSETS.forEach(url => {
        fetch(url, { mode: 'cors' })
          .then(r => { if (r.ok) cache.put(url, r); })
          .catch(() => {});
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: limpa caches antigos ────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: Cache First para locais, Network First para CDNs ──
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Ignora requisições não-GET
  if (event.request.method !== 'GET') return;

  // Arquivos locais: cache first
  if (LOCAL_ASSETS.some(a => url.includes(a.replace('./', '')))) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
    return;
  }

  // CDNs e fonts: network first com fallback para cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
