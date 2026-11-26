const VERSION = '2dc5a19b1449';
const PRECACHE = [
  ['./', 'ffe2e331'],
  ['v/2dc5a19b1449/app.css', 'd33a4972'],
  ['assets/icons/apple-touch-icon.png', '76bf395d'],
  ['assets/icons/favicon-32.png', '10d11c7f'],
  ['assets/icons/icon-192.png', '365b3042'],
  ['assets/icons/icon-512.png', 'e37c4978'],
  ['assets/icons/icon-maskable-512.png', '45a746b7'],
  ['fonts/zen-maru-gothic-500.2fbe529a.woff', '2fbe529a'],
  ['fonts/zen-maru-gothic-700.188ff671.woff', '188ff671'],
  ['fonts/zen-maru-gothic-900.939dd641.woff', '939dd641'],
  ['index.html', 'ffe2e331'],
  ['v/2dc5a19b1449/js/aimview.js', 'd2e3cb9e'],
  ['v/2dc5a19b1449/js/card.js', 'b2a0e4d6'],
  ['v/2dc5a19b1449/js/core.js', '47001b11'],
  ['v/2dc5a19b1449/js/game.js', '73e9582a'],
  ['v/2dc5a19b1449/js/input.js', '9f88da9c'],
  ['v/2dc5a19b1449/js/kit.js', 'c607809c'],
  ['v/2dc5a19b1449/js/layouts.js', '384cfa03'],
  ['v/2dc5a19b1449/js/models.js', '3c535939'],
  ['v/2dc5a19b1449/js/sfx.js', '0cd121c8'],
  ['v/2dc5a19b1449/js/stage.js', '29455ae9'],
  ['v/2dc5a19b1449/js/store.js', 'a10c8ad9'],
  ['v/2dc5a19b1449/js/text.js', '41d93f37'],
  ['v/2dc5a19b1449/js/ui.js', 'b73e6537'],
  ['v/2dc5a19b1449/js/video.js', '115765a0'],
  ['v/2dc5a19b1449/js/web.js', '8794a562'],
  ['manifest.webmanifest', 'feffdb50'],
  ['privacy.html', '783cf78f'],
  ['v/2dc5a19b1449/vendor/three/three.module.js', 'ce1fa418'],
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
