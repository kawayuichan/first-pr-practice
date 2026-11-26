// オフライン対応(Service Worker)。
// - 初回に data/manifest.json の shell(アプリ本体)と files(参考書・問題)をすべてキャッシュする
// - 表示はキャッシュを先に使い、裏で新しい版を取りにいく(電車の中など電波が弱くても速く開く)
// - data/manifest.json だけはネットワークを先に試す(新しい論点の追加にすぐ気づくため)

const CACHE = 'boki2-v1';
const MANIFEST = 'data/manifest.json';

async function precacheAll() {
  const cache = await caches.open(CACHE);
  let manifest;
  try {
    const res = await fetch(MANIFEST, { cache: 'no-cache' });
    if (!res.ok) return;
    await cache.put(MANIFEST, res.clone());
    manifest = await res.json();
  } catch {
    return;
  }
  const urls = ['./', ...(manifest.shell ?? []), ...(manifest.files ?? [])];
  await Promise.all(
    urls.map((u) =>
      fetch(u, { cache: 'no-cache' })
        .then((r) => (r.ok ? cache.put(u, r) : null))
        .catch(() => null),
    ),
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheAll().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'precache') event.waitUntil(precacheAll());
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const hit = await cache.match(request, { ignoreSearch: true });
    return hit ?? new Response('offline', { status: 503 });
  }
}

async function staleWhileRevalidate(event) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(event.request, { ignoreSearch: true });
  const network = fetch(event.request)
    .then((res) => {
      if (res.ok) cache.put(event.request, res.clone());
      return res;
    })
    .catch(() => null);
  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  return (await network) ?? new Response('offline', { status: 503 });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/' + MANIFEST)) {
    event.respondWith(networkFirst(req));
    return;
  }
  event.respondWith(staleWhileRevalidate(event));
});
