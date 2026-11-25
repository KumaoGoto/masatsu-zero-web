const VERSION = 'e165a193716e';
const PRECACHE = [
  ['./', '36a33323'],
  ['v/e165a193716e/app.css', '66880106'],
  ['assets/icons/apple-touch-icon.png', '76bf395d'],
  ['assets/icons/favicon-32.png', '10d11c7f'],
  ['assets/icons/icon-192.png', '365b3042'],
  ['assets/icons/icon-512.png', 'e37c4978'],
  ['assets/icons/icon-maskable-512.png', '45a746b7'],
  ['fonts/zen-maru-gothic-500.5acd869e.woff', '5acd869e'],
  ['fonts/zen-maru-gothic-700.e09d7b4c.woff', 'e09d7b4c'],
  ['fonts/zen-maru-gothic-900.29edc284.woff', '29edc284'],
  ['index.html', '36a33323'],
  ['v/e165a193716e/js/aimview.js', 'b23a64d3'],
  ['v/e165a193716e/js/card.js', 'b2a0e4d6'],
  ['v/e165a193716e/js/core.js', 'c28461fd'],
  ['v/e165a193716e/js/game.js', '97a1ae7f'],
  ['v/e165a193716e/js/input.js', '9f88da9c'],
  ['v/e165a193716e/js/kit.js', 'c607809c'],
  ['v/e165a193716e/js/layouts.js', 'f899fc2e'],
  ['v/e165a193716e/js/models.js', 'a88eb200'],
  ['v/e165a193716e/js/sfx.js', 'db6cec6b'],
  ['v/e165a193716e/js/stage.js', '597e1ae0'],
  ['v/e165a193716e/js/store.js', 'a10c8ad9'],
  ['v/e165a193716e/js/text.js', 'e833aa5e'],
  ['v/e165a193716e/js/ui.js', '4c752803'],
  ['v/e165a193716e/js/video.js', '115765a0'],
  ['v/e165a193716e/js/web.js', '83bc7db3'],
  ['manifest.webmanifest', 'feffdb50'],
  ['privacy.html', '6a207ae5'],
  ['v/e165a193716e/vendor/three/three.module.js', 'ce1fa418'],
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
