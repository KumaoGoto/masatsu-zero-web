const VERSION = '6dcc3f74a1fd';
const PRECACHE = [
  ['./', 'd75cc5de'],
  ['v/6dcc3f74a1fd/app.css', '0a4927bb'],
  ['assets/icons/apple-touch-icon.png', '76bf395d'],
  ['assets/icons/favicon-32.png', '10d11c7f'],
  ['assets/icons/icon-192.png', '365b3042'],
  ['assets/icons/icon-512.png', 'e37c4978'],
  ['assets/icons/icon-maskable-512.png', '45a746b7'],
  ['fonts/zen-maru-gothic-500.ec702718.woff', 'ec702718'],
  ['fonts/zen-maru-gothic-700.bdc3952c.woff', 'bdc3952c'],
  ['fonts/zen-maru-gothic-900.2374f5a8.woff', '2374f5a8'],
  ['index.html', 'd75cc5de'],
  ['v/6dcc3f74a1fd/js/aimview.js', 'd2e3cb9e'],
  ['v/6dcc3f74a1fd/js/card.js', 'b2a0e4d6'],
  ['v/6dcc3f74a1fd/js/core.js', '47001b11'],
  ['v/6dcc3f74a1fd/js/game.js', '0ef060ab'],
  ['v/6dcc3f74a1fd/js/input.js', '9f88da9c'],
  ['v/6dcc3f74a1fd/js/kit.js', 'c607809c'],
  ['v/6dcc3f74a1fd/js/layouts.js', '384cfa03'],
  ['v/6dcc3f74a1fd/js/models.js', 'ec1358cf'],
  ['v/6dcc3f74a1fd/js/sfx.js', '0cd121c8'],
  ['v/6dcc3f74a1fd/js/stage.js', '72a04ab5'],
  ['v/6dcc3f74a1fd/js/store.js', 'a10c8ad9'],
  ['v/6dcc3f74a1fd/js/text.js', '6b251e19'],
  ['v/6dcc3f74a1fd/js/ui.js', 'abb58514'],
  ['v/6dcc3f74a1fd/js/video.js', '115765a0'],
  ['v/6dcc3f74a1fd/js/web.js', '3dd2deb2'],
  ['manifest.webmanifest', 'feffdb50'],
  ['privacy.html', 'f7a449cc'],
  ['v/6dcc3f74a1fd/vendor/three/three.module.js', 'ce1fa418'],
];
const BGM = [];
const PREFIX = 'nofriction-';
const CACHE = `${PREFIX}${VERSION}`;
const BGM_CACHE = `${PREFIX}bgm`;
const MARKS = '__nf-marks.json';
const abs = (u) => new URL(u, self.registration.scope).href;
const stable = (u) => /(^|\/)v\/[0-9a-f]{6,}\//.test(u) || /\.[0-9a-f]{8}\.woff2?$/.test(u);
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const have = await oldMarks();
    const marks = {};
    await Promise.all(PRECACHE.map(async ([u, mark]) => {
      const url = abs(u);
      marks[url] = mark;
      const from = have.get(mark);
      if (from) {
        try {
          const hit = await (await caches.open(from.cache)).match(from.url);
          if (hit) {
            const type = hit.headers.get('content-type');
            await cache.put(url, new Response(await hit.blob(), { status: 200, headers: type ? { 'content-type': type } : {} }));
            return;
          }
        } catch (err) {   }
      }
      const res = await fetch(new Request(url, { cache: stable(u) ? 'default' : 'reload' }));
      if (!res.ok) throw new Error(`${url} ${res.status}`);
      await cache.put(url, res);
    }));
    await cache.put(abs(MARKS), new Response(JSON.stringify(marks), { headers: { 'content-type': 'application/json' } }));
    await self.skipWaiting();
  })());
});
async function oldMarks() {
  const out = new Map();
  try {
    for (const name of await caches.keys()) {
      if (!name.startsWith(PREFIX) || name === CACHE || name === BGM_CACHE) continue;
      const c = await caches.open(name);
      const hit = await c.match(abs(MARKS));
      if (!hit) continue;
      const marks = await hit.json();
      for (const url of Object.keys(marks)) if (!out.has(marks[url])) out.set(marks[url], { cache: name, url });
    }
  } catch (e) {   }
  return out;
}
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    const old = keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE && k !== BGM_CACHE);
    await Promise.all(old.map((k) => caches.delete(k)));
    if (keys.includes(BGM_CACHE)) await pruneBgm();
    await self.clients.claim();
    if (old.length) await tellPages();
  })());
});
function isGameUrl(href) {
  try {
    const scope = new URL(self.registration.scope).pathname;
    const p = new URL(href).pathname;
    return p === scope || p === `${scope}index.html`;
  } catch (e) { return false; }
}
function bgmUrls() { return BGM.map((f) => abs(f)); }
function inBgmDir(href) {
  try { return /\/bgm\//.test(new URL(href).pathname); } catch (e) { return false; }
}
async function pruneBgm() {
  try {
    const keep = new Set(bgmUrls());
    const c = await caches.open(BGM_CACHE);
    for (const r of await c.keys()) {
      const u = typeof r === 'string' ? r : r.url;
      if (!keep.has(u)) await c.delete(r);
    }
  } catch (e) {   }
}
async function tellPages() {
  try {
    const list = (await self.clients.matchAll({ type: 'window' })).filter((c) => isGameUrl(c.url));
    for (const c of list) { try { c.postMessage({ type: 'nf-update' }); } catch (e) {   } }
  } catch (e) {   }
}
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (inBgmDir(url.href)) {
    const listed = bgmUrls().includes(url.href);
    e.respondWith((async () => {
      const c = listed ? await caches.open(BGM_CACHE) : null;
      const hit = c ? await c.match(req) : null;
      if (hit) return hit;
      const res = await fetch(req);
      if (c && res.status === 200 && res.type === 'basic') e.waitUntil(c.put(req, res.clone()));
      return res;
    })());
    return;
  }
  const game = req.mode === 'navigate' && isGameUrl(url.href);
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(game ? abs('index.html') : req, { ignoreSearch: game });
    if (hit) return hit;
    const res = await fetch(req);
    if (res.status === 200 && res.type === 'basic') e.waitUntil(cache.put(req, res.clone()));
    return res;
  })());
});
