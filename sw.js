// sw.js — Red Hands offline service worker (game shell, scripts, icons, announcer voice).
// Bump VERSION on every deploy that changes files in PRECACHE; the page then offers "update" (never forced
// mid-use, so a user never runs half-old/half-new code).
const VERSION = 'v15';
const CACHE = `app-${VERSION}`;
const PRECACHE = [
"./",
"./index.html",
"./manifest.webmanifest",
"./offline.html",
"./i18n.js",
"./data.js",
"./render.js",
"./gesture.js",
"./hands.js",
"./cartoon.js",
"./game.js",
"./cinema.js",
"./ui.js",
"./menufx.js",
"./duo.js",
"./online.js",
"./career.js",
"./music.js",
"./pwa.js",
"./icons/apple-touch-icon.png",
"./icons/favicon-32.png",
"./icons/icon-192.png",
"./icons/icon-512.png",
"./icons/maskable-512.png",
"./vo/blue.mp3",
"./vo/breaker.mp3",
"./vo/combo.mp3",
"./vo/cpuwins.mp3",
"./vo/fatality.mp3",
"./vo/fight.mp3",
"./vo/finish.mp3",
"./vo/flawless.mp3",
"./vo/ko.mp3",
"./vo/legend.mp3",
"./vo/onfire.mp3",
"./vo/red.mp3",
"./vo/sp_bolt.mp3",
"./vo/sp_fire.mp3",
"./vo/sp_ice.mp3",
"./vo/sp_mega.mp3",
"./vo/sp_tornado.mp3",
"./vo/unstop.mp3",
"./vo/youwin.mp3"
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  // no skipWaiting() here: the page asks the user first (see app.js "update available")
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('app-') && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'VERSION') event.source?.postMessage({ version: VERSION });
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;                         // never cache POST/PUT…
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // third-party requests: browser default
  if (url.pathname.endsWith('.mp4')) return;               // fatality videos stream from the network (Range requests); offline the game uses its live finisher animation

  // Pages: network first (fresh content when online), cached shell when offline, offline page as last resort.
  if (req.mode === 'navigate') {
    const scope = new URL(self.registration.scope);
    const atRoot = url.pathname === scope.pathname || url.pathname === scope.pathname + 'index.html';
    event.respondWith((async () => {
      try {
        const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 4000);   // slow network = offline
        const res = await fetch(req, { signal: ctrl.signal }); clearTimeout(t);
        // refresh the cached shell ONLY from the shell itself (another page must never overwrite index.html)
        if (res.ok && atRoot) (await caches.open(CACHE)).put('./index.html', res.clone());
        return res;
      } catch {
        // Offline. At the app's own start URL serve the cached shell; for any other in-scope URL redirect to the
        // start URL, so relative paths (app.js, icons/…) resolve correctly instead of /some/deep/app.js.
        if (!atRoot && (await caches.match('./index.html'))) return Response.redirect(scope.href, 302);
        return (await caches.match('./index.html')) || (await caches.match('./offline.html'));
      }
    })());
    return;
  }
  // Static files: serve from cache instantly, refresh in the background (stale-while-revalidate).
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });
    const network = fetch(req).then((res) => { if (res.ok && res.type === 'basic') cache.put(req, res.clone()); return res; }).catch(() => null);
    return cached || (await network) || new Response('', { status: 504, statusText: 'offline' });
  })());
});
