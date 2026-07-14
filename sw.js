/* 筋トレ Lab — Service Worker
   方針:
   - HTML(ナビゲーション)はネットワーク優先: オンラインなら常に最新、オフラインならキャッシュ。
   - アイコン・manifest等はキャッシュ優先。
   - アプリを更新したら CACHE のバージョン番号を上げること（古いキャッシュは activate で削除される）。 */
const CACHE = 'kintore-lab-v8';
const ASSETS = [
  './index.html',
  './manifest.webmanifest',
  './apple-touch-icon.png',
  './apple-touch-icon-v2.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(ASSETS.map(async url => {
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (res.ok) await cache.put(url, res);
      } catch (err) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  if (req.mode === 'navigate' || req.destination === 'document') {
    // ネットワーク優先（成功したらキャッシュも更新）
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
  } else {
    // キャッシュ優先（なければ取得してキャッシュ）
    e.respondWith(
      caches.match(req).then(r => r || fetch(req).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }))
    );
  }
});
