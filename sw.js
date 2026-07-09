// ===== SERVICE WORKER (app shell cache) =====
const CACHE = 'worknote-v1.2.0';
const ASSETS = [
  './', './index.html', './manifest.json', './icons/icon.svg',
  './css/base.css', './css/layout.css',
  './js/app.js', './js/firebase.js', './js/store.js', './js/model.js',
  './js/crypto.js', './js/ui.js',
  './js/views/today.js', './js/views/week.js', './js/views/inbox.js',
  './js/views/search.js', './js/views/secret.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // 페이지 이동은 네트워크 우선, 오프라인이면 캐시된 셸 제공
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('./index.html')));
    return;
  }
  // 정적 자산은 캐시 우선
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }))
  );
});
