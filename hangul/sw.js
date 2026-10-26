// 한글 놀이 오프라인 지원: 한 번 열면 게임 파일과 글꼴을 기기에 저장해 두고, 인터넷이 없을 때 저장본으로 엽니다.
// 게임을 고치면 CACHE 이름의 숫자를 올려서 새 버전이 저장되게 합니다.
const CACHE = 'hangul-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('hangul-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 페이지가 이미 받아 둔 글꼴 파일 목록을 보내오면 저장해 둡니다.
self.addEventListener('message', e => {
  if (e.data?.type !== 'cache' || !Array.isArray(e.data.urls)) return;
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(e.data.urls.map(u =>
    c.match(u).then(hit => hit || fetch(u, { mode: 'cors' }).then(r => r.ok && c.put(u, r))).catch(() => {})
  ))));
});

const timeout = ms => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 글꼴: 저장본 먼저, 없으면 받아서 저장
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => hit ||
      fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }))));
    return;
  }

  // 게임 파일: 인터넷이 되면 새 버전, 안 되거나 느리면 저장본
  if (url.origin === location.origin && url.pathname.startsWith(new URL('./', self.registration.scope).pathname)) {
    e.respondWith(
      Promise.race([fetch(req), timeout(4000)])
        .then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; })
        .catch(() => caches.match(req, { ignoreSearch: true })
          .then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
    );
  }
});
