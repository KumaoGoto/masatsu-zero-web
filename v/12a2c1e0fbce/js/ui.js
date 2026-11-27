import {
  ITEMS, LIMIT_TENTHS, limitSec, smashLine, smashParts, TRUTH, TAGLINE, MEDAL_NAME, FAIL, HOWTO_PULL, PULLS, PULL_NOTE, pullMode, readyHint,
  formatTenths, weightLabel, dayLabel, resultHeadlineParts, catLine, randoLine,
  thrownList, medalFor, nextMedalText,
} from './text.js';
const TUNE = {
  hintMs: 0,
  toastMs: 2200,
  countDelay: 260,
  countMs: 900,
  swipe: 40,
  gap: 6,
};
const ICONS = {
  pause: '<path d="M9 6.5v11M15 6.5v11"/>',
  retry: '<path d="M19.2 13.9A7.5 7.5 0 1 1 17.3 6.7"/><path d="M13.3 6.7h4v-4"/>',
  settings: '<path d="M4 8h8M16 8h4M4 16h4M12 16h8"/><circle cx="14" cy="8" r="2"/><circle cx="10" cy="16" r="2"/>',
  rank: '<path d="M4 20v-6h5V7.5h6V12h5v8z"/><path d="M12 10.5v3"/>',
  book: '<path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z"/><path d="M12 6.5v13"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="3"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/><path d="M8.5 14h.01M12 14h.01M15.5 14h.01"/>',
  share: '<path d="M12 3.5v11M8 7.5l4-4 4 4"/><path d="M7.5 11H7a2.5 2.5 0 0 0-2.5 2.5v4A2.5 2.5 0 0 0 7 20h10a2.5 2.5 0 0 0 2.5-2.5v-4A2.5 2.5 0 0 0 17 11h-.5"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  play: '<path d="M8.5 6.2v11.6a1 1 0 0 0 1.5.9l9-5.8a1 1 0 0 0 0-1.7l-9-5.8a1 1 0 0 0-1.5.8z"/>',
  home: '<path d="M4 11.5l8-7 8 7"/><path d="M6.5 9.5V19a1 1 0 0 0 1 1h3v-5h3v5h3a1 1 0 0 0 1-1V9.5"/>',
  check: '<path d="M5.5 12.5l4 4 9-9"/>',
  sound: '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10"/>',
  music: '<path d="M9 17.5V6.5l10-2v11"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>',
  vibe: '<rect x="8" y="4" width="8" height="16" rx="2"/><path d="M4.5 9v6M19.5 9v6"/>',
  ghost: '<path d="M6 20v-8.5a6 6 0 0 1 12 0V20l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5z"/><path d="M10 11v1M14 11v1"/>',
  sparkle: '<path d="M11 4l1.7 4.8L17.5 10.5l-4.8 1.7L11 17l-1.7-4.8L4.5 10.5l4.8-1.7z"/><path d="M18.5 15v5M16 17.5h5"/>',
  cat: '<path d="M5 10.5L5.5 4l4 3.2a8 8 0 0 1 5 0l4-3.2.5 6.5a7.5 7.5 0 1 1-14 0z"/><path d="M9.5 12.5v1M14.5 12.5v1M11 16.2l1 .8 1-.8"/>',
  rando: '<path d="M6 11a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v7.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 18.5z"/><path d="M6 12.5h12M12 12.5v3M9.5 6V4.5h5V6"/>',
  throw: '<path d="M5 19c3-7 7-11 13.5-13"/><path d="M13.5 5h5v5"/>',
  door: '<path d="M6.5 20V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v15M4 20h16M14.5 12.5v.5"/>',
  sun: '<circle cx="12" cy="12" r="3.5"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M6 18l1.4-1.4M16.6 7.4L18 6"/>',
  drag: '<circle cx="8" cy="8" r="2.2" fill="currentColor"/><circle cx="8" cy="8" r="5.5" opacity=".45"/><path d="M13 13l6.5 6.5M19.5 14.5v5h-5"/>',
  back: '<path d="M14.5 6l-6 6 6 6"/>',
  replay: '<path d="M5.6 13.2a6.6 6.6 0 1 0 1.7-5.6"/><path d="M4.6 4.6v3.6h3.6"/><path d="M10.6 10v5l4.2-2.5z" fill="currentColor"/>',
  movie: '<rect x="3.5" y="6.5" width="12" height="11" rx="3"/><path d="M15.5 10.6l5-2.6v8l-5-2.6z"/>',
  save: '<path d="M12 4.5v10M8 10.5l4 4 4-4"/><path d="M5 19h14"/>',
  next: '<path d="M9.5 6l6 6-6 6"/>',
};
const ic = (name, cls = '') => `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
const PICS = {
  keshi: '<g transform="rotate(-20 16 16)"><rect x="5" y="11" width="22" height="10" rx="2.5" fill="#fbf8f1"/><path d="M15 11v10H7.5A2.5 2.5 0 0 1 5 18.5v-5A2.5 2.5 0 0 1 7.5 11z" fill="#4f86d9"/><rect x="5" y="11" width="22" height="10" rx="2.5"/></g>',
  kutsu: '<path d="M12.5 4.5h8v12.5l-5.5 8.5a4.4 4.4 0 0 1-7.4-4.8l4.9-7z" fill="#7fb3e6"/><path d="M12.5 8.5h8" />',
  toast: '<path d="M8 26.5V14.6A5.3 5.3 0 0 1 10.3 4.5h11.4A5.3 5.3 0 0 1 24 14.6v11.9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z" fill="#e0a45a"/><path d="M11 24.5v-10.8a2.8 2.8 0 0 1-.2-5.2h10.4a2.8 2.8 0 0 1-.2 5.2v10.8z" fill="#f6dcaa" stroke="none"/>',
  kyoka: '<path d="M8.5 4.5h15a1 1 0 0 1 1 1v22h-15A2.5 2.5 0 0 1 7 25V6a1.5 1.5 0 0 1 1.5-1.5z" fill="#4f86d9"/><path d="M7 25a2.5 2.5 0 0 1 2.5-2.5h15"/><rect x="12" y="8.5" width="8.5" height="4" rx="1" fill="#fbf8f1" stroke="none"/>',
  rando: '<path d="M5.5 12a6 6 0 0 1 6-6h9a6 6 0 0 1 6 6v13a2.5 2.5 0 0 1-2.5 2.5H8A2.5 2.5 0 0 1 5.5 25z" fill="#e5392f"/><path d="M5.5 16.5h21V12a6 6 0 0 0-6-6h-9a6 6 0 0 0-6 6z" fill="#b82a23"/><rect x="14" y="14" width="4" height="5" rx="1" fill="#ffd23f"/>',
};
const pic = (id, cls = '') => `<svg class="pic${cls ? ' ' + cls : ''}" viewBox="0 0 32 32" aria-hidden="true" focusable="false">${PICS[id] || ''}</svg>`;
export function medalSVG(kind, cls = '') {
  const k = kind === 'gold' || kind === 'silver' || kind === 'bronze' ? kind : null;
  if (!k) {
    return `<svg class="medal none${cls ? ' ' + cls : ''}" viewBox="0 0 48 56" aria-hidden="true" focusable="false">
      <circle cx="24" cy="34" r="15" class="m-empty"/><path class="m-empty-sun" d="M17.5 37.5a6.5 6.5 0 0 1 13 0M16 37.5h16"/></svg>`;
  }
  return `<svg class="medal ${k}${cls ? ' ' + cls : ''}" viewBox="0 0 48 56" aria-hidden="true" focusable="false">
    <path class="rb-l" d="M9 1.5h9.5l8.5 20h-9.5z"/><path class="rb-r" d="M39 1.5h-9.5L21 21.5h9.5z"/>
    <path class="rb-s" d="M13.2 1.5h1.6l8.5 20h-1.6zM34.8 1.5h-1.6l-8.5 20h1.6z"/>
    <circle cx="24" cy="35" r="16.5" class="m-rim"/>
    <circle cx="24" cy="35" r="15" fill="url(#nf-m-${k})"/>
    <circle cx="24" cy="35" r="11.5" class="m-ring"/>
    <g class="m-eng"><path d="M17.5 38.5a6.5 6.5 0 0 1 13 0"/><path d="M15.5 38.5h17M24 27.8v2.2M17.8 30.4l1.5 1.5M30.2 30.4l-1.5 1.5"/></g>
    <path class="m-gloss" d="M12.2 30.5a12.5 12.5 0 0 1 9-8.4"/>
  </svg>`;
}
const DEFS = `<svg class="nf-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>
  <linearGradient id="nf-m-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".42" stop-color="#f5c542"/><stop offset="1" stop-color="#c98d17"/></linearGradient>
  <linearGradient id="nf-m-silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#d3dae2"/><stop offset="1" stop-color="#8f9aa8"/></linearGradient>
  <linearGradient id="nf-m-bronze" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8cda6"/><stop offset=".45" stop-color="#d08a55"/><stop offset="1" stop-color="#985222"/></linearGradient>
  <linearGradient id="nf-floor" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e0b6"/><stop offset="1" stop-color="#ecc993"/></linearGradient>
  <radialGradient id="nf-glow"><stop offset="0" stop-color="#ffd23f" stop-opacity=".9"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/></radialGradient>
</defs></svg>`;
const KID = `<g class="kid-b"><ellipse cx="2" cy="4" rx="15" ry="13" class="shadow"/><rect x="-19" y="-10" width="11" height="20" rx="4" fill="#e5392f"/><circle r="13" fill="#2e4374"/><circle r="10" fill="#ffd23f"/><path d="M6 -7a10 10 0 0 1 0 14" class="brim"/></g>`;
const FLOOR = (w, h) => `<rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="18" fill="url(#nf-floor)"/>
  <path class="planks" d="M2 27H${w - 2}M2 52H${w - 2}M2 77H${w - 2}M2 102H${w - 2}M2 127H${w - 2}M58 2v25M170 27v25M96 52v25M226 77v25M40 102v25M150 127v21M244 2v25"/>
  <path d="M60 2l-40 ${h - 4}h26l40-${h - 4}zM190 2l-40 ${h - 4}h12l40-${h - 4}z" fill="#fff" opacity=".22"/>`;
const HOWTO_DOOR = {
    h: `${limitSec()} 秒で遅刻`,
    p: '玄関のドアから、外へ出よう。',
    svg: `<svg class="ht-svg ht3" viewBox="0 0 280 150" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="276" height="146" rx="18" fill="#d9ead0"/>
      <g class="house" transform="translate(30 12)">
        <rect x="0" y="0" width="76" height="54" fill="#f2d6a6"/><rect x="0" y="54" width="76" height="34" fill="#e9c68f"/><rect x="0" y="88" width="76" height="32" fill="#e3dccf"/>
        <rect x="40" y="108" width="20" height="8" rx="2" fill="#7b9e6b" opacity=".8"/>
        <rect x="8" y="10" width="20" height="26" rx="3" fill="#f3b6b6"/><rect x="11" y="12" width="14" height="7" rx="2.5" fill="#fff"/>
        <circle cx="50" cy="126" r="24" fill="url(#nf-glow)" class="doorglow"/>
        <path class="wall" d="M2 2h72v118H58M42 120H2V2M2 54h46M62 54h12M2 88h8M28 88h46"/>
        <path class="path" id="nf-ht3-path" d="M18 26C30 40 52 44 55 60S28 74 19 92 56 106 52 146"/>
        <g class="outside"><path d="M50 126v10M46 132l4 4 4-4"/></g>
        <g class="mover"><circle r="7" fill="#2e4374"/><circle r="5" fill="#ffd23f"/>
          <animateMotion dur="4s" repeatCount="indefinite" keyPoints="0;0;1;1" keyTimes="0;.1;.82;1" calcMode="linear"><mpath href="#nf-ht3-path"/></animateMotion></g>
      </g>
      <g class="clock" transform="translate(196 75)">
        <circle r="38" class="c-bg"/>
        <circle r="38" class="c-ring" transform="rotate(-90)"/>
        <text y="6" class="c-num">${limitSec()}</text><text y="24" class="c-u">秒</text>
      </g>
    </svg>`,
  };
function howtoPull(mode) {
  const same = mode !== 'opposite', t = same ? HOWTO_PULL.same : HOWTO_PULL.opposite;
  const lw = (s, px) => Math.round([...s].length * px * 1.04 + 40);
  const w1 = lw(t.pull, 12), w2 = lw(t.item, 12), w3 = lw(t.self, 13.5);
  const kx = same ? 118 : 122, ky = 62, fy = 116;
  const go = 100, gx = kx + go;
  const fx1 = same ? kx + 70 : kx - 70;
  const badge = (x, y, n) => `<circle class="no" cx="${x}" cy="${y}" r="8.5"/><text class="no-t" x="${x}" y="${y + 4}">${n}</text>`;
  const pill = (cls, x, y, w, h, n, s) => `<g class="lbl ${cls}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"/>${badge(x + h / 2, y + h / 2, n)}<text x="${x + h / 2 + 10 + (w - h / 2 - 10) / 2 - 4}" y="${y + h / 2 + 4.5}">${s}</text></g>`;
  const l1x = same ? kx - 18 - w1 : kx + 20;
  const svg = `<svg class="ht-svg ht1 ${same ? 'ht1-same' : 'ht1-opp'}" viewBox="0 0 280 150" aria-hidden="true" focusable="false">${FLOOR(280, 150)}
      <path class="trail" d="M${kx} ${ky}H${gx}"/>
      <path class="fl-bg" d="M${kx} ${fy}H${fx1}"/><path class="fl" d="M${kx} ${fy}H${fx1}"/>
      ${same ? '' : `<g class="sling"><circle class="post" cx="${kx}" cy="${ky - 19}" r="3.2"/><circle class="post" cx="${kx}" cy="${ky + 19}" r="3.2"/><path class="band-bg" d="M${kx} ${ky - 19}L${kx - 16} ${ky}L${kx} ${ky + 19}"/><path class="band" d="M${kx} ${ky - 19}L${kx - 16} ${ky}L${kx} ${ky + 19}"/></g>`}
      ${same ? `<g class="puff"><circle cx="${kx - 24}" cy="${ky - 6}" r="5"/><circle cx="${kx - 30}" cy="${ky + 5}" r="4"/><circle cx="${kx - 20}" cy="${ky + 8}" r="3.2"/></g>` : ''}
      <g class="book"><g transform="translate(${kx - 37} ${ky - 9.5}) scale(.6)"><g class="pic">${PICS.kyoka}</g></g></g>
      <g class="kid"><g transform="translate(${kx} ${ky})">${KID}</g></g>
      <g class="finger"><circle cx="${kx}" cy="${fy}" r="15"/><circle cx="${kx}" cy="${fy}" r="4.5" class="dot"/>${same ? `<path class="tip" d="M${kx + 21} ${fy - 6}L${kx + 27} ${fy}L${kx + 21} ${fy + 6}"/>` : ''}</g>
      ${pill('l-pull', l1x, fy - 12, w1, 24, 1, t.pull)}
      ${pill('l-item', 12, same ? 12 : ky + 17, w2, 24, 2, t.item)}
      ${pill('l-self', 268 - w3, 11, w3, 26, 3, t.self)}
    </svg>`;
  return { h: t.h, p: t.p, svg };
}
const weightOf = (id) => { const it = ITEMS.find((x) => x.id === id); return it ? weightLabel(it.g) : ''; };
const lightest = () => (ITEMS.length ? ITEMS.reduce((a, b) => (b.g < a.g ? b : a)).id : 'kutsu');
const heaviest = () => (ITEMS.length ? ITEMS.reduce((a, b) => (b.g > a.g ? b : a)).id : 'rando');
const howtoPages = (mode, lt = lightest(), hv = heaviest()) => [
  howtoPull(mode),
  {
    h: 'ピンにぶつかると、ぶっ飛ぶ',
    p: '重い物を投げるほど、速くすべる。ピンのかたまりに突っこもう。',
    svg: `<svg class="ht-svg ht2" viewBox="0 0 280 150" aria-hidden="true" focusable="false">${FLOOR(280, 150)}
      <path d="M16 75h248" class="lane"/>
      <g class="tag"><g transform="translate(14 28) scale(.75)"><g class="pic">${PICS[lt] || ''}</g></g><text x="44" y="45">${weightOf(lt)}</text></g>
      <g class="tag"><g transform="translate(14 98) scale(.75)"><g class="pic">${PICS[hv] || ''}</g></g><text x="44" y="115">${weightOf(hv)}</text></g>
      <path class="tr tr1" d="M150 40H160"/><path class="tr tr2" d="M150 110H214"/>
      <circle class="pop" cx="204" cy="110" r="16"/>
      ${[[208, 110], [220, 103], [220, 117], [232, 96], [232, 110], [232, 124]].map(([x, y], i) => `<g class="pin p${i + 1}"><circle cx="${x}" cy="${y}" r="5.5"/><circle cx="${x - 1.6}" cy="${y - 1.8}" r="1.6" class="hl"/></g>`).join('')}
      <g class="it it1"><g transform="translate(118 32) scale(.5)"><g class="pic">${PICS[lt] || ''}</g></g></g>
      <g class="it it2"><g transform="translate(111 99) scale(.72)"><g class="pic">${PICS[hv] || ''}</g></g></g>
      <g class="k1"><g transform="translate(150 40) scale(.78)">${KID}</g></g>
      <g class="k2"><g transform="translate(150 110) scale(.78)">${KID}</g></g>
    </svg>`,
  },
  HOWTO_DOOR,
];
const PULL_FIG = (mode) => `<svg class="pull-fig" viewBox="0 0 64 40" aria-hidden="true" focusable="false">
  <rect class="pf-item" x="11" y="10" width="6" height="6" rx="1.5"/>
  <circle cx="25" cy="13" r="4" class="pf-kid"/><path class="pf-go" d="M32 13H55M50 8L55 13L50 18"/>
  ${mode === 'opposite'
    ? '<path class="pf-band" d="M42 31H23"/><circle class="pf-finger" cx="18.5" cy="31" r="4.5"/>'
    : '<path class="pf-puff" d="M5.5 10.5v0M4 15.5v0"/><path class="pf-band" d="M21 31H40"/><path class="pf-tip" d="M41 28L44 31L41 34"/><circle class="pf-finger" cx="48.5" cy="31" r="4.5"/>'}
</svg>`;
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function refs(el) { const o = {}; el.querySelectorAll('[data-r]').forEach((e) => { o[e.dataset.r] = e; }); return o; }
const reduceMQ = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
const SPRING = 'cubic-bezier(.2,.9,.25,1.15)';
function anim(el, frames, o) {
  if (!el || reduceMQ.matches || typeof el.animate !== 'function') return null;
  try { return el.animate(frames, o); } catch (e) { return null; }
}
function digitBox(el, n, keep) {
  el.textContent = '';
  el.classList.add('digits');
  if (keep) el.classList.add('keep');
  const cells = [];
  for (let i = 0; i < n; i++) { const s = document.createElement('span'); s.className = 'dg off'; el.appendChild(s); cells.push(s); }
  let last = null;
  return (str) => {
    if (str === last) return;
    last = str;
    const pad = n - str.length;
    for (let i = 0; i < n; i++) {
      const ch = i < pad ? '' : str[i - pad];
      const c = cells[i];
      if (c.textContent !== ch) { c.textContent = ch; c.className = ch === '.' ? 'dg dot' : ch === '' ? 'dg off' : 'dg'; }
    }
  };
}
function phraseHTML(text) {
  return pieces(String(text)).map((c) => `<span class="ch">${esc(c)}</span>`).join('');
}
function pieces(s) {
  const out = [];
  let cur = '';
  for (const ch of s) {
    if (ch === '（' && cur) { out.push(cur); cur = ''; }
    cur += ch;
    if (ch === '、' || ch === '。' || ch === '…') { out.push(cur); cur = ''; }
  }
  if (cur) out.push(cur);
  return out;
}
function chunkHTML(text) {
  return String(text).split(/( +)/).map((tok) => {
    if (!tok) return '';
    if (/^ +$/.test(tok)) return ' ';
    return pieces(tok).map((c) => `<span class="ch">${esc(c)}</span>`).join('');
  }).join('');
}
function headlineLineHTML(ln) {
  const parts = ln.map((p) => ({ ...p }));
  let html = '';
  let open = false;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.k === 'lead') { html += `<span class="lead">${esc(p.t)}</span>`; continue; }
    if (p.k === 'num') {
      const nx = parts[i + 1];
      let glue = '';
      const m = nx && !nx.k && nx.t.match(/^ ([^ ]+)/);
      if (m) { glue = '\u00a0' + m[1]; nx.t = nx.t.slice(m[0].length); }
      html += `${open ? '' : '<span class="nw">'}<span class="num" data-num>${esc(p.t)}</span><span class="unit">${esc(glue)}</span></span>`;
      open = false;
      continue;
    }
    const nx = parts[i + 1];
    if (nx && nx.k === 'num') {
      const body = p.t.replace(/ +$/, '');
      const sp = body.lastIndexOf(' ');
      const ps = pieces(body.slice(sp + 1));
      const tail = ps.pop() || '';
      html += chunkHTML(body.slice(0, sp + 1) + ps.join(''));
      html += `<span class="nw">${esc(tail)}${body !== p.t ? '\u00a0' : ''}`;
      open = true;
      continue;
    }
    html += chunkHTML(p.t);
  }
  return html;
}
function titleHTML() {
  const chars = [['摩', 0], ['擦', 1], ['ゼ', 2, 1], ['ロ', 3, 1], ['の', 4], ['朝', 5]];
  const line = (cls) => `<span class="lg-line ${cls}">${chars.map(([c, i, z]) => `<span class="lc${z ? ' z' : ''}" style="--i:${i}">${c}</span>`).join('')}</span>`;
  return `
  <section class="layer L-title" data-layer="title" aria-label="タイトル">
    <header class="t-top">
      <h1 class="logo" aria-label="摩擦ゼロの朝">
        <span class="lg" aria-hidden="true">
          <svg class="lg-streak" viewBox="0 0 80 48" focusable="false"><path d="M6 12h46"/><path d="M22 25h54"/><path d="M12 38h34"/></svg>
          <span class="lg-stack">${line('lg-back')}${line('lg-front')}</span>
          <span class="lg-ice"></span>
          <span class="lg-mirror">${line('lg-ref')}</span>
          <svg class="lg-glint" viewBox="0 0 24 24" focusable="false"><path d="M12 1.5c.6 5.6 4.9 9.9 10.5 10.5-5.6.6-9.9 4.9-10.5 10.5C11.4 16.9 7.1 12.6 1.5 12 7.1 11.4 11.4 7.1 12 1.5z"/></svg>
        </span>
      </h1>
      <p class="tagline">${esc(TAGLINE)}</p>
    </header>
    <button type="button" class="btn-round t-gear pe" data-r="gear" aria-label="設定">${ic('settings')}</button>
    <div class="t-bottom">
      <div class="card t-card pe">
        <div class="t-info">
          <div class="t-text">
            <p class="eyebrow" data-r="tDay">今日の間取り</p>
            <h2 class="t-name" data-r="tName">いつもの家</h2>
            <p class="t-theme" data-r="tTheme"></p>
          </div>
          <div class="t-best" data-r="tBest">
            <span class="t-medal" data-r="tMedal">${medalSVG(null)}</span>
            <span class="t-best-l">自己ベスト</span>
            <span class="t-best-v" data-r="tBestV">まだ記録なし</span>
          </div>
        </div>
        <button type="button" class="btn btn-primary btn-xl" data-r="start"><span class="btn-in">${ic('play', 'solid')}<span>スタート</span></span></button>
        <div class="t-tiles">
          <button type="button" class="tile" data-r="tRank">${ic('rank')}<span>ランキング</span></button>
          <button type="button" class="tile" data-r="tHowto">${ic('book')}<span>あそびかた</span></button>
          <button type="button" class="tile" data-r="tPractice">${ic('calendar')}<span>れんしゅう</span></button>
        </div>
        <div id="web-title" class="web-slot pe"></div>
      </div>
      <p class="t-ver" data-r="tVer"></p>
      <div id="web-foot" class="web-slot pe"></div>
    </div>
  </section>`;
}
function hudHTML() {
  return `
  <section class="layer L-hud" data-layer="hud" aria-label="のこり時間">
    <div class="hud" data-r="hudBox">
      <button type="button" class="btn-round pe h-pause" data-r="hPause" aria-label="一時停止">${ic('pause')}</button>
      <div class="timer idle" data-r="timer" role="timer" aria-label="のこり時間">
        <span class="timer-row"><span class="timer-v" data-r="time">${formatTenths(LIMIT_TENTHS)}</span><span class="timer-u">秒</span></span>
        <span class="timer-bar"><span data-r="prog"></span></span>
      </div>
      <button type="button" class="btn-round pe h-retry" data-r="hRetry" aria-label="やりなおす">${ic('retry')}</button>
      <p class="idle-l" data-r="idleL"><span class="idle-dot"></span><span class="idle-t" data-r="idleT">${esc(readyHint(PULLS.def))}</span></p>
      <p class="replay-l">${ic('replay')}<span>リプレイ</span><b data-r="hReplayV"></b></p>
      <div class="hint" data-r="hint" role="status"><span class="hint-in" data-r="hintIn">${ic('drag')}<span class="hint-t" data-r="hintText"></span></span></div>
    </div>
  </section>`;
}
function barHTML() {
  const slots = ITEMS.map((it, i) => `
    <button type="button" class="slot" data-i="${i}" aria-pressed="false" aria-label="${esc(it.name)} ${weightLabel(it.g)}">
      <span class="chip"><span class="ring"></span><span class="art">${pic(it.id)}</span><span class="nm">${esc(it.name)}</span><span class="w">${weightLabel(it.g)}</span><span class="cnt"></span></span>
    </button>`).join('');
  return `
  <section class="layer L-bar" data-layer="bar" aria-label="持ち物">
    <div class="bar" data-r="barBox">
      <div class="tray pe${ITEMS.length <= 5 ? ' few' : ''}${ITEMS.length <= 3 ? ' n3' : ''}" role="group" aria-label="投げる持ち物" data-r="tray" style="--n:${ITEMS.length || 1}">${slots}</div>
    </div>
  </section>`;
}
function pauseHTML() {
  return `
  <section class="layer L-pause L-sheet" data-layer="pause">
    <div class="scrim pe"></div>
    <div class="sheet pe" role="dialog" aria-modal="true" aria-labelledby="nf-pause-h" tabindex="-1" data-r="pauseSheet">
      <header class="sheet-head center">
        <h2 class="h-sheet" id="nf-pause-h">一時停止</h2>
        <p class="sub" data-r="pauseSub"></p>
      </header>
      <div class="stack">
        <button type="button" class="btn btn-primary btn-xl" data-r="pResume"><span class="btn-in">${ic('play', 'solid')}<span>つづける</span></span></button>
        <button type="button" class="btn btn-secondary" data-r="pRetry"><span class="btn-in">${ic('retry')}<span>やりなおす</span></span></button>
        <button type="button" class="btn btn-secondary" data-r="pQuit"><span class="btn-in">${ic('home')}<span>タイトルへ</span></span></button>
      </div>
      <div class="links">
        <button type="button" class="link" data-r="pSettings">${ic('settings')}<span>設定</span></button>
        <button type="button" class="link" data-r="pHowto">${ic('book')}<span>あそびかた</span></button>
      </div>
    </div>
  </section>`;
}
function resultHTML() {
  return `
  <section class="layer L-result L-sheet" data-layer="result" aria-label="結果">
    <div class="scrim scrim-soft"></div>
    <div class="sheet sheet-tall pe" role="region" aria-labelledby="nf-res-h" tabindex="-1" data-r="resSheet">
      <div class="sheet-scroll" data-r="rScroll">
        <div class="r-top">
          <header class="r-head rise" style="--d:0">
            <p class="eyebrow" data-r="rWhere"></p>
            <p class="tags"><span class="tag tag-practice" data-r="rPractice">${ic('calendar')}れんしゅう</span><span class="tag tag-new" data-r="rNew">自己ベスト！</span></p>
          </header>
          <h2 class="r-big rise" style="--d:1" id="nf-res-h" data-r="rBig"></h2>
          <figure class="r-photo" data-r="rPhoto"></figure>
        </div>
        <div class="r-medal rise" style="--d:2" data-r="rMedal"></div>
        <div class="r-info rise" style="--d:3">
          <p class="r-meta" data-r="rMeta"></p>
          <p class="r-smash" data-r="rSmash"></p>
          <p class="r-thrown" data-r="rThrown"></p>
          <p class="r-note" data-r="rNote"></p>
        </div>
        <aside class="truth rise" style="--d:4"><h3 class="truth-h">${ic('sun')}<span>この世界の本当</span></h3><p class="truth-p">${esc(TRUTH)}</p></aside>
      </div>
      <div id="web-result" class="web-slot pe"></div>
      <footer class="sheet-foot">
        <button type="button" class="btn btn-primary btn-xl grow" data-r="rAgain"><span class="btn-in">${ic('retry')}<span>もう一回</span></span></button>
        <button type="button" class="tile tile-sq" data-r="rRank">${ic('rank')}<span>ランキング</span></button>
        <button type="button" class="tile tile-sq" data-r="rReplay">${ic('replay')}<span>リプレイ</span></button>
        <button type="button" class="tile tile-sq" data-r="rShare">${ic('share')}<span>シェア</span></button>
      </footer>
    </div>
  </section>`;
}
function replayHTML() {
  return `
  <section class="layer L-replay" data-layer="replay" data-mode="watch" aria-label="リプレイ">
    <div class="rp-view" data-r="rpView"></div>
    <p class="rp-chip" role="status"><span class="rp-dot"></span><span data-r="rpChip"></span></p>
    <div class="rp-bar" data-r="rpBar">
      <div class="rp-row rp-watch pe">
        <button type="button" class="btn-round rp-back" data-r="rpBack" aria-label="結果へもどる">${ic('back')}</button>
        <div class="seg rp-speed" role="radiogroup" aria-label="リプレイの速さ" data-r="rpSpeed">
          <span class="seg-ind" aria-hidden="true"></span>
          <button type="button" role="radio" aria-checked="true" data-v="1">1×</button>
          <button type="button" role="radio" aria-checked="false" data-v="2">2×</button>
          <button type="button" role="radio" aria-checked="false" data-v="4">4×</button>
        </div>
        <button type="button" class="btn btn-primary rp-btn grow" data-r="rpRec"><span class="btn-in">${ic('movie')}<span>動画にする</span></span></button>
      </div>
      <div class="rp-row rp-rec pe">
        <button type="button" class="btn btn-secondary rp-btn grow" data-r="rpStop"><span class="btn-in"><span>やめる</span></span></button>
      </div>
      <div class="rp-row rp-done pe">
        <button type="button" class="btn-round rp-back" data-r="rpBack2" aria-label="結果へもどる">${ic('back')}</button>
        <button type="button" class="btn btn-secondary rp-btn" data-r="rpSave"><span class="btn-in">${ic('save')}<span>保存</span></span></button>
        <button type="button" class="btn btn-primary rp-btn grow" data-r="rpShare"><span class="btn-in">${ic('share')}<span>動画をシェア</span></span></button>
      </div>
    </div>
  </section>`;
}
function failHTML() {
  return `
  <section class="layer L-fail L-sheet" data-layer="fail">
    <div class="scrim pe"></div>
    <div class="sheet pe" role="alertdialog" aria-modal="true" aria-labelledby="nf-fail-h" aria-describedby="nf-fail-p" tabindex="-1" data-r="failSheet">
      <header class="sheet-head center">
        <span class="fail-ic" aria-hidden="true">${ic('home')}</span>
        <h2 class="h-sheet" id="nf-fail-h">${esc(FAIL.title)}</h2>
        <p class="fail-p" id="nf-fail-p">${esc(FAIL.sub)}</p>
      </header>
      <div class="stack fail-stack">
        <button type="button" class="btn btn-primary btn-xl" data-r="failReload"><span class="btn-in">${ic('retry')}<span>${esc(FAIL.button)}</span></span></button>
      </div>
    </div>
  </section>`;
}
function modalHTML(name, title, body, extra = '') {
  return `
  <section class="layer L-modal L-sheet" data-layer="${name}">
    <div class="scrim pe" data-close></div>
    <div class="sheet sheet-modal pe ${extra}" role="dialog" aria-modal="true" aria-labelledby="nf-${name}-h" tabindex="-1" data-r="${name}Sheet">
      <header class="sheet-head row">
        <h2 class="h-sheet" id="nf-${name}-h">${title}</h2>
        <button type="button" class="btn-round sm" data-close aria-label="閉じる">${ic('close')}</button>
      </header>
      ${body}
    </div>
  </section>`;
}
function settingsHTML() {
  const range = (k, label, icon) => `
    <div class="set-row">
      <span class="set-ic">${ic(icon)}</span>
      <label class="set-l" for="nf-s-${k}">${label}</label>
      <span class="range-wrap"><input id="nf-s-${k}" class="range" type="range" min="0" max="100" step="1" value="80" data-r="s_${k}" data-k="${k}"></span>
    </div>`;
  const sw = (k, label, icon, sub) => `
    <div class="set-row">
      <span class="set-ic">${ic(icon)}</span>
      <span class="set-l" id="nf-s-${k}-l">${label}${sub ? `<small>${sub}</small>` : ''}</span>
      <button type="button" class="switch" role="switch" aria-checked="false" aria-labelledby="nf-s-${k}-l" data-r="s_${k}" data-k="${k}"><span class="knob"></span></button>
    </div>`;
  const pullName = (n) => {
    const m = /^(.+?)（(.+)）$/.exec(String(n));
    return m ? `<b class="opt-k">${esc(m[1])}</b><span class="opt-p"><span class="opt-paren">（</span>${phraseHTML(m[2])}<span class="opt-paren">）</span></span>` : esc(n);
  };
  const def = pullMode(PULLS.def), modes = [def, def === 'same' ? 'opposite' : 'same'];
  const opt = (m) => `
          <button type="button" class="opt" role="radio" aria-checked="${m === def}" data-v="${m}">${PULL_FIG(m)}<span class="opt-t"><span class="opt-n">${pullName(PULLS[m])}${m === def ? `<small>${esc(PULLS.mark)}</small>` : ''}</span><span class="opt-sub">${phraseHTML(PULL_NOTE[m])}</span></span><span class="opt-mark">${ic('check')}</span></button>`;
  const body = `
    <div class="sheet-scroll set">
      <div class="set-block">
        <p class="set-cap" id="nf-s-inv-l">引く向き</p>
        <div class="choice" role="radiogroup" aria-labelledby="nf-s-inv-l" data-r="s_pull">${modes.map(opt).join('')}
        </div>
      </div>
      <div class="set-group">${range('sfx', '効果音', 'sound')}${range('bgm', 'BGM', 'music')}</div>
      <div class="set-group">${sw('vibe', '振動', 'vibe')}${sw('ghost', 'ゴースト', 'ghost', '自己ベストの自分と一緒にすべる')}</div>
      <div class="set-block">
        <p class="set-cap" id="nf-s-q-l">${ic('sparkle')}画質</p>
        <div class="seg" role="radiogroup" aria-labelledby="nf-s-q-l" data-r="s_quality">
          <span class="seg-ind" aria-hidden="true"></span>
          <button type="button" role="radio" aria-checked="true" data-v="auto">自動</button>
          <button type="button" role="radio" aria-checked="false" data-v="high">きれい</button>
          <button type="button" role="radio" aria-checked="false" data-v="low">軽い</button>
        </div>
      </div>
      <button type="button" class="btn btn-secondary" data-r="sHowto"><span class="btn-in">${ic('book')}<span>あそびかたを見る</span></span></button>
    </div>`;
  return modalHTML('settings', '設定', body);
}
function howtoHTML() {
  const list = howtoPages(pullMode(PULLS.def));
  const pages = list.map((p, i) => `
    <div class="ht-page" data-p="${i}" role="group" aria-roledescription="ページ" aria-label="${i + 1} / ${list.length}">
      <div class="ht-fig">${p.svg}</div>
      <h3 class="ht-h">${esc(p.h)}</h3>
      <p class="ht-p">${phraseHTML(p.p)}</p>
    </div>`).join('');
  const dots = list.map((_, i) => `<button type="button" class="dot" data-p="${i}" aria-label="${i + 1} 枚目"></button>`).join('');
  const body = `
    <div class="ht" data-r="ht">
      <div class="ht-pages" data-r="htPages" data-clip>${pages}</div>
      <div class="ht-dots" data-r="htDots">${dots}</div>
    </div>
    <footer class="sheet-foot">
      <button type="button" class="btn btn-secondary" data-r="htBack"><span class="btn-in"><span data-r="htBackT">とじる</span></span></button>
      <button type="button" class="btn btn-primary grow" data-r="htNext"><span class="btn-in"><span data-r="htNextT">つぎへ</span>${ic('next')}</span></button>
    </footer>`;
  return modalHTML('howto', 'あそびかた', body, 'sheet-howto');
}
function practiceHTML() {
  const body = `
    <p class="sheet-lead">ほかの曜日の間取りも遊べる。記録はランキングに入らない。</p>
    <div class="sheet-scroll"><ul class="pr-list" data-r="prList"></ul></div>`;
  return modalHTML('practice', 'れんしゅう', body);
}
export function createUI(handlers = {}) {
  const H = handlers || {};
  const call = (name, ...a) => {
    const f = H[name];
    if (typeof f !== 'function') return undefined;
    try { return f(...a); } catch (e) { console.error(e); return undefined; }
  };
  let root = document.getElementById('ui');
  if (!root) { root = document.createElement('div'); root.id = 'ui'; document.body.appendChild(root); }
  root.classList.add('nf');
  root.classList.add('fonts-wait');
  {
    const go = () => root.classList.remove('fonts-wait');
    const fs = document.fonts;
    if (fs && typeof fs.load === 'function') {
      Promise.race([Promise.all([fs.load('900 48px "Zen Maru Gothic"'), fs.load('700 15px "Zen Maru Gothic"')]), new Promise((r) => setTimeout(r, 2000))]).then(go, go);
    } else go();
  }
  root.innerHTML = DEFS + titleHTML() + hudHTML() + barHTML() + replayHTML() + pauseHTML() + failHTML() + resultHTML() + settingsHTML() + howtoHTML() + practiceHTML()
    + '<div class="toast" role="status" aria-live="polite"><span class="toast-in"></span></div>';
  const R = refs(root);
  const layers = {};
  root.querySelectorAll('[data-layer]').forEach((el) => { layers[el.dataset.layer] = el; });
  const toastEl = root.querySelector('.toast');
  const slots = [...R.tray.querySelectorAll('.slot')].map((btn) => ({
    btn, chip: btn.querySelector('.chip'), art: btn.querySelector('.art'), cnt: btn.querySelector('.cnt'), ring: btn.querySelector('.ring'), w: btn.querySelector('.w'),
  }));
  const BASE = { title: ['title'], play: ['hud', 'bar'], pause: ['hud', 'pause'], result: ['result'], replay: ['hud', 'replay'], fail: ['title', 'fail'] };
  const OVER = ['settings', 'howto', 'practice'];
  let base = 'title';
  const stack = [];
  function topName() { return stack.length ? stack[stack.length - 1].name : null; }
  function apply() {
    const on = new Set(BASE[base]);
    for (const o of stack) on.add(o.name);
    const top = topName() || (base === 'pause' ? 'pause' : base === 'fail' ? 'fail' : null);
    for (const [name, el] of Object.entries(layers)) {
      if (on.has(name)) el.setAttribute('data-on', ''); else el.removeAttribute('data-on');
      el.inert = !on.has(name) || (!!top && name !== top);
      if (OVER.includes(name)) el.style.zIndex = on.has(name) ? String(60 + stack.findIndex((o) => o.name === name)) : '';
    }
    const stage = document.getElementById('stage');
    if (stage) stage.inert = !!top;
    root.dataset.base = base;
    root.dataset.top = top || '';
    if (base !== 'play') hint(null);
    const a = document.activeElement;
    if (a && a !== document.body && root.contains(a)) {
      const layer = a.closest('[data-layer]');
      if (layer && layer.inert) a.blur();
    }
  }
  function focusIn(el) {
    if (!el) return;
    requestAnimationFrame(() => { try { el.focus({ preventScroll: true }); } catch (e) {   } });
  }
  function openOverlay(name) {
    if (topName() === name) return;
    const at = stack.findIndex((o) => o.name === name);
    if (at >= 0) stack.splice(at, 1);
    stack.push({ name, back: document.activeElement });
    if (name === 'howto') htGo(0, true);
    apply();
    focusIn(R[name + 'Sheet']);
  }
  function closeOverlay() {
    const o = stack.pop();
    if (!o) return;
    apply();
    const b = o.back;
    if (b && b.isConnected && !b.closest('[inert]') && typeof b.focus === 'function') focusIn(b);
    call('onOverlayClose', o.name);
  }
  function screen(name) {
    if (name === undefined) return topName() || base;
    if (OVER.includes(name)) { openOverlay(name); return name; }
    if (!BASE[name]) return base;
    const prev = base;
    stack.length = 0;
    base = name;
    quiet(false);
    if (name === 'pause') R.pauseSub.textContent = hud.t >= 0 ? `のこり ${formatTenths(hud.t)} 秒` : '';
    apply();
    if (name === 'pause') focusIn(R.pauseSheet);
    else if (name === 'fail') focusIn(R.failSheet);
    else if (name === 'result' && prev !== 'result') { R.rScroll.scrollTop = 0; focusIn(R.resSheet); }
    if (name === 'title') animTitle();
    return name;
  }
  let titleOnce = false;
  function animTitle() {
    root.classList.toggle('title-again', titleOnce);
    titleOnce = true;
  }
  let titleDay = '';
  let titleName = '';
  function setTitle(t = {}) {
    titleDay = t.day || '';
    titleName = t.layoutName || '';
    R.tDay.textContent = t.day ? `${dayLabel(t.day)}の間取り` : '今日の間取り';
    R.tName.textContent = t.layoutName || '';
    R.tTheme.textContent = t.theme || '';
    R.tTheme.hidden = !t.theme;
    R.tMedal.innerHTML = medalSVG(t.medal || null);
    R.tBest.classList.toggle('has', t.best != null);
    R.tBestV.innerHTML = t.best != null ? `${formatTenths(t.best)}<small> 秒</small>` : 'まだ記録なし';
    R.tBest.setAttribute('aria-label', t.best != null ? `自己ベスト ${formatTenths(t.best)} 秒${t.medal ? '、' + MEDAL_NAME[t.medal] + 'メダル' : ''}` : '自己ベストはまだない');
    R.tVer.textContent = t.version ? String(t.version) : '';
    markToday();
  }
  const hud = { t: -1, hot: null, run: null, sec: -1 };
  const putTime = digitBox(R.time, 4);
  putTime(formatTenths(LIMIT_TENTHS));
  function pulse() {
    anim(R.timer, [
      { transform: 'scale(1)' }, { transform: 'scale(1.12)', offset: 0.28 }, { transform: 'scale(.98)', offset: 0.62 }, { transform: 'scale(1)' },
    ], { duration: 440, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  function setHud(s) {
    if (!s) return;
    const t = Math.max(0, Math.round(s.tenths) || 0);
    const hot = s.hot != null ? !!s.hot : t <= LIMIT_TENTHS / 6;
    const run = s.running == null ? true : !!s.running;
    if (run !== hud.run) {
      hud.run = run;
      R.timer.classList.toggle('idle', !run);
      R.hudBox.classList.toggle('idle', !run);
    }
    if (hot !== hud.hot) { hud.hot = hot; R.timer.classList.toggle('hot', hot); }
    if (t !== hud.t) {
      hud.t = t;
      putTime(formatTenths(t));
      R.prog.style.transform = `scaleX(${Math.min(1, t / LIMIT_TENTHS)})`;
      const sec = Math.ceil(t / 10);
      if (hot && run && sec !== hud.sec && hud.sec !== -1) pulse();
      hud.sec = sec;
    }
  }
  function idleHint(on) { R.idleL.classList.toggle('off', !on); }
  const inv = { counts: [], max: ITEMS.map((it) => it.n), sel: -1, icons: [] };
  function slotLabel(i) {
    const c = inv.counts[i] ?? ITEMS[i].n;
    return `${ITEMS[i].name} ${weightLabel(ITEMS[i].g)}、のこり ${c}`;
  }
  function markSel(i, bounce) {
    const prev = inv.sel;
    inv.sel = i;
    slots.forEach((s, k) => {
      const on = k === i;
      s.btn.classList.toggle('sel', on);
      s.btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (bounce && i >= 0 && slots[i]) {
      const s = slots[i];
      anim(s.chip, [
        { transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-10px) scale(1.1)', offset: 0.35 },
        { transform: 'translateY(-5px) scale(.98)', offset: 0.7 }, { transform: 'translateY(-6px) scale(1)' },
      ], { duration: 340, easing: 'ease-out' });
      anim(s.ring, [{ opacity: 0.95, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.32)' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
      anim(s.art, [{ transform: 'rotate(0)' }, { transform: 'rotate(-10deg)', offset: 0.3 }, { transform: 'rotate(6deg)', offset: 0.65 }, { transform: 'rotate(0)' }], { duration: 420, easing: 'ease-out' });
    }
    return prev;
  }
  function pick(i) {
    if (base !== 'play' || stack.length) return;
    const c = inv.counts[i] ?? ITEMS[i].n;
    if (c <= 0) return;
    const was = inv.sel;
    if (call('onSelect', i) === false) return;
    if (i !== inv.sel) markSel(i, true);
    else if (was === i) anim(slots[i].chip, [{ transform: 'translateY(-6px) scale(1)' }, { transform: 'translateY(-8px) scale(1.05)' }, { transform: 'translateY(-6px) scale(1)' }], { duration: 200, easing: 'ease-out' });
  }
  slots.forEach((s, i) => {
    s.btn.addEventListener('pointerdown', (e) => { if (e.button === 0) { s.btn._pd = performance.now(); pick(i); } });
    s.btn.addEventListener('click', (e) => { if (performance.now() - (s.btn._pd || 0) > 600) pick(i); });
  });
  function setInventory(o = {}) {
    const counts = o.counts || [];
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      const c = counts[i] == null ? (inv.counts[i] ?? ITEMS[i].n) : counts[i] | 0;
      if (c !== inv.counts[i]) {
        const before = inv.counts[i];
        inv.max[i] = Math.max(inv.max[i], c);
        inv.counts[i] = c;
        s.cnt.textContent = c > 0 && inv.max[i] > 1 ? '×' + c : '';
        s.btn.disabled = c <= 0;
        s.btn.classList.toggle('empty', c <= 0);
        s.btn.setAttribute('aria-label', slotLabel(i));
        if (before != null && c < before) anim(s.chip, [{ transform: s.btn.classList.contains('sel') ? 'translateY(-6px) scale(.9)' : 'scale(.9)' }, { transform: s.btn.classList.contains('sel') ? 'translateY(-6px)' : 'none' }], { duration: 260, easing: SPRING });
      }
      const icon = o.icons && o.icons[i];
      if (icon && icon !== inv.icons[i]) {
        inv.icons[i] = icon;
        icon.setAttribute('aria-hidden', 'true');
        icon.style.width = icon.style.height = '';
        s.art.replaceChildren(icon);
        s.btn.classList.add('has-icon');
      }
    }
    if (o.sel != null && o.sel !== inv.sel) markSel(o.sel, inv.sel >= 0 && base === 'play');
  }
  let hintTimer = 0;
  let hintNow = '';
  function hint(text, ms, at) {
    clearTimeout(hintTimer);
    if (!text) { R.hint.removeAttribute('data-on'); return; }
    const showing = R.hint.hasAttribute('data-on');
    if (hintNow !== text) {
      hintNow = text;
      R.hintText.innerHTML = phraseHTML(text);
      fitHint();
      requestAnimationFrame(fitHint);
      if (document.fonts) document.fonts.ready.then(fitHint);
      if (showing) anim(R.hintIn, [{ opacity: 0.2, transform: 'translateY(6px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: SPRING });
    }
    placeHint(at);
    R.hint.setAttribute('data-on', '');
    const d = ms == null ? TUNE.hintMs : ms;
    if (d > 0) hintTimer = setTimeout(() => R.hint.removeAttribute('data-on'), d);
  }
  function placeHint(at) {
    if (at == null || !Number.isFinite(at)) { R.hint.style.marginTop = ''; return; }
    const hb = R.hudBox.getBoundingClientRect().bottom, h = R.hintIn.offsetHeight || 44;
    R.hint.style.marginTop = Math.max(8, Math.round(at - hb - h / 2)) + 'px';
  }
  function fitHint() {
    const el = R.hintText;
    el.style.width = '';
    if (!hintNow) return;
    const rg = document.createRange();
    rg.selectNodeContents(el);
    const rects = [...rg.getClientRects()];
    const top = rects.length ? rects[0].top : 0;
    if (!rects.length || rects.every((r) => Math.abs(r.top - top) < 2)) return;
    let l = Infinity, r = -Infinity;
    for (const b of rects) { l = Math.min(l, b.left); r = Math.max(r, b.right); }
    const k = el.offsetWidth ? el.getBoundingClientRect().width / el.offsetWidth : 1;
    el.style.width = Math.ceil((r - l) / (k || 1)) + 2 + 'px';
  }
  window.addEventListener('resize', fitHint);
  if (document.fonts) document.fonts.addEventListener('loadingdone', fitHint);
  let toastTimer = 0;
  function toast(text) {
    clearTimeout(toastTimer);
    if (!text) { toastEl.removeAttribute('data-on'); return; }
    toastEl.firstChild.textContent = text;
    toastEl.removeAttribute('data-on');
    void toastEl.offsetWidth;
    toastEl.setAttribute('data-on', '');
    toastTimer = setTimeout(() => toastEl.removeAttribute('data-on'), TUNE.toastMs);
  }
  let lastResult = null;
  let countRaf = 0;
  function showResult(r = {}) {
    lastResult = r;
    cancelAnimationFrame(countRaf);
    const ok = r.outcome === 'out';
    R.resSheet.dataset.outcome = r.outcome || '';
    const where = [r.day ? dayLabel(r.day) : '', r.layoutName || ''].filter(Boolean).join(' ・ ');
    R.rWhere.textContent = where;
    R.rWhere.hidden = !where;
    R.rPractice.hidden = !r.practice;
    R.rNew.hidden = !(ok && r.newBest);
    R.rPhoto.replaceChildren();
    if (r.image && r.image.nodeType === 1) { r.image.setAttribute('aria-hidden', 'true'); R.rPhoto.appendChild(r.image); }
    R.rPhoto.hidden = !R.rPhoto.firstChild;
    const parts = resultHeadlineParts(r);
    const lines = [[]];
    for (const p of parts) { if (p.k === 'br') lines.push([]); else lines[lines.length - 1].push(p); }
    R.rBig.className = `r-big rise ${r.outcome || ''}`;
    R.rBig.setAttribute('aria-label', parts.map((p) => p.t).join(''));
    if (ok) {
      const rest = parts.filter((p) => !p.k).map((p) => p.t.trim());
      R.rBig.innerHTML = `<span class="r-line lockup" aria-hidden="true"><span class="num" data-num>${esc(parts[0].t)}</span><span class="lock-t">${rest.map((t) => `<span class="ch">${esc(t)}</span>`).join('')}</span></span>`;
    } else {
      R.rBig.innerHTML = lines.map((ln, li) => `<span class="r-line l${li}" aria-hidden="true">${headlineLineHTML(ln)}</span>`).join('');
    }
    const medal = ok ? (r.medal !== undefined ? r.medal : medalFor(r.tenths, r.medalTimes)) : null;
    const next = ok ? nextMedalText(r.tenths, r.medalTimes, medal) : null;
    if (ok && (medal || next)) {
      R.rMedal.hidden = false;
      R.rMedal.innerHTML = `${medalSVG(medal, 'big')}<div class="m-txt"><p class="m-name">${medal ? MEDAL_NAME[medal] + 'メダル' : 'メダルまで、もう少し'}</p>${next ? `<p class="m-next">${esc(next)}</p>` : '<p class="m-next">いちばん上のメダル</p>'}</div>`;
    } else { R.rMedal.hidden = true; R.rMedal.innerHTML = ''; }
    const best = r.best != null ? r.best : null;
    const meta = [`<span class="mt"><span class="mt-l">投げた数</span><b>${r.throws | 0}</b></span>`];
    if (best != null && !(ok && r.newBest)) meta.push(`<span class="mt"><span class="mt-l">自己ベスト</span><b>${formatTenths(best)}<small> 秒</small></b></span>`);
    R.rMeta.innerHTML = meta.join('<span class="mt-dot"></span>');
    const cl = catLine(r), rl = randoLine(r);
    const catOut = typeof r.catOut === 'number' ? r.catOut > 0 : !!r.catOut;
    const note = cl && catOut ? ['cat', cl] : rl ? ['rando', rl] : cl && (Number(r.catDist) || 0) >= 0.05 ? ['cat', cl] : null;
    R.rNote.innerHTML = note ? `${ic(note[0])}<span>${esc(note[1])}</span>` : '';
    R.rNote.hidden = !note;
    const sp = smashParts(r);
    R.rSmash.innerHTML = sp ? `${ic('throw')}<span class="sm-t"><span class="sm-a">${esc(sp[0])}</span>${sp[1] ? `<span class="sm-dot">・</span><span class="sm-b">${esc(sp[1])}</span>` : ''}</span>` : '';
    R.rSmash.setAttribute('aria-label', smashLine(r) || '');
    R.rSmash.hidden = !sp;
    const tl = thrownList(r.thrown);
    R.rThrown.innerHTML = `<span class="lbl">投げた物：</span><span class="val">${esc(tl.replace(/^投げた物：/, ''))}</span>`;
    R.rThrown.setAttribute('aria-label', tl);
    R.rRank.hidden = !!r.practice;
    screen('result');
    const numEl = R.rBig.querySelector('[data-num]');
    if (ok && numEl) countUp(numEl, Math.max(0, Math.round(r.tenths) || 0));
  }
  function countUp(el, to) {
    const final = formatTenths(to);
    const put = digitBox(el, final.length, true);
    if (reduceMQ.matches) { put(final); return; }
    const t0 = performance.now() + TUNE.countDelay;
    put(formatTenths(0));
    const step = (now) => {
      const k = Math.min(1, Math.max(0, (now - t0) / TUNE.countMs));
      const e = 1 - Math.pow(1 - k, 3);
      put(formatTenths(Math.round(to * e)));
      if (k < 1) countRaf = requestAnimationFrame(step);
      else anim(el, [{ transform: 'scale(1.08)' }, { transform: 'none' }], { duration: 320, easing: SPRING });
    };
    countRaf = requestAnimationFrame(step);
  }
  let settings = { sfx: 0.8, bgm: 0.6, vibe: true, ghost: true, pull: pullMode(PULLS.def), quality: 'auto' };
  let pullShown = pullMode(PULLS.def);
  function paintPull() {
    const mode = pullMode(settings.pull);
    setRadio(R.s_pull, mode);
    if (mode === pullShown) return;
    pullShown = mode;
    R.idleT.textContent = readyHint(mode);
    const pg = htPages[0], p = howtoPull(mode);
    pg.querySelector('.ht-fig').innerHTML = p.svg;
    pg.querySelector('.ht-h').textContent = p.h;
    pg.querySelector('.ht-p').innerHTML = phraseHTML(p.p);
  }
  function paintRange(el) { el.style.setProperty('--v', el.value + '%'); }
  function setSwitch(el, on) { el.setAttribute('aria-checked', on ? 'true' : 'false'); }
  function setRadio(group, v) {
    const btns = [...group.querySelectorAll('[role="radio"]')];
    btns.forEach((b) => { const on = b.dataset.v === String(v); b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
    const idx = btns.findIndex((b) => b.dataset.v === String(v));
    group.style.setProperty('--idx', String(Math.max(0, idx)));
  }
  function setSettings(s = {}) {
    settings = { ...settings, ...s };
    for (const k of ['sfx', 'bgm']) { const el = R['s_' + k]; el.value = String(Math.round((Number(settings[k]) || 0) * 100)); paintRange(el); }
    setSwitch(R.s_vibe, !!settings.vibe);
    setSwitch(R.s_ghost, !!settings.ghost);
    setRadio(R.s_quality, settings.quality === 'high' || settings.quality === 'low' ? settings.quality : 'auto');
    paintPull();
  }
  for (const k of ['sfx', 'bgm']) {
    const el = R['s_' + k];
    el.addEventListener('input', () => { paintRange(el); settings[k] = +el.value / 100; call('onSetting', k, settings[k]); });
  }
  for (const k of ['vibe', 'ghost']) {
    const el = R['s_' + k];
    el.addEventListener('click', () => { settings[k] = !settings[k]; setSwitch(el, settings[k]); call('onSetting', k, settings[k]); });
  }
  function radioGroup(group, onPick) {
    group.addEventListener('click', (e) => { const b = e.target.closest('[role="radio"]'); if (b && group.contains(b)) onPick(b.dataset.v); });
    group.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const btns = [...group.querySelectorAll('[role="radio"]')];
      const cur = btns.findIndex((b) => b.getAttribute('aria-checked') === 'true');
      const nb = btns[(cur + d + btns.length) % btns.length];
      onPick(nb.dataset.v); nb.focus();
    });
  }
  radioGroup(R.s_pull, (v) => { settings.pull = pullMode(v); paintPull(); call('onSetting', 'pull', settings.pull); });
  radioGroup(R.s_quality, (v) => { settings.quality = v; setRadio(R.s_quality, v); call('onSetting', 'quality', v); });
  function setReplay(o = {}) {
    if (o.mode) { layers.replay.dataset.mode = o.mode; root.dataset.rp = o.mode; }
    if (o.speed != null) setRadio(R.rpSpeed, o.speed);
    if (o.label != null) R.hReplayV.textContent = o.label;
    if (o.canRecord != null) R.rpRec.hidden = !o.canRecord;
    if (o.canShare != null) R.rpShare.hidden = !o.canShare;
    if (o.chip != null && R.rpChip.textContent !== o.chip) R.rpChip.textContent = o.chip;
    if ('view' in o) { R.rpView.replaceChildren(); if (o.view && o.view.nodeType === 1) R.rpView.appendChild(o.view); }
  }
  radioGroup(R.rpSpeed, (v) => { setRadio(R.rpSpeed, v); call('onReplaySpeed', +v); });
  const htPages = [...R.htPages.querySelectorAll('.ht-page')];
  const htDots = [...R.htDots.querySelectorAll('.dot')];
  let htCur = 0;
  function htGo(i, instant) {
    const n = Math.max(0, Math.min(htPages.length - 1, i));
    const dir = n >= htCur ? 1 : -1;
    htCur = n;
    htPages.forEach((p, k) => {
      if (k === n) p.setAttribute('data-cur', ''); else p.removeAttribute('data-cur');
      p.dataset.side = k < n ? 'l' : k > n ? 'r' : '';
      p.inert = k !== n;
      const svg = p.querySelector('svg');
      if (svg && typeof svg.pauseAnimations === 'function') {
        if (k === n) { svg.setCurrentTime(reduceMQ.matches ? 2.4 : 0); if (reduceMQ.matches) svg.pauseAnimations(); else svg.unpauseAnimations(); }
        else svg.pauseAnimations();
      }
    });
    R.htPages.dataset.dir = dir > 0 ? 'f' : 'b';
    R.htPages.classList.toggle('instant', !!instant);
    htDots.forEach((d, k) => d.setAttribute('aria-current', k === n ? 'true' : 'false'));
    R.htBackT.textContent = n === 0 ? 'とじる' : 'もどる';
    R.htNextT.textContent = n === htPages.length - 1 ? 'わかった' : 'つぎへ';
    R.htNext.classList.toggle('last', n === htPages.length - 1);
  }
  R.htNext.addEventListener('click', () => { if (htCur >= htPages.length - 1) closeOverlay(); else htGo(htCur + 1); });
  R.htBack.addEventListener('click', () => { if (htCur === 0) closeOverlay(); else htGo(htCur - 1); });
  htDots.forEach((d, k) => d.addEventListener('click', () => htGo(k)));
  {
    let sx = null, sy = 0;
    R.htPages.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
    R.htPages.addEventListener('pointerup', (e) => {
      if (sx == null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dx) > TUNE.swipe && Math.abs(dx) > Math.abs(dy) * 1.2) htGo(htCur + (dx < 0 ? 1 : -1));
    });
    R.htPages.addEventListener('pointercancel', () => { sx = null; });
  }
  htGo(0, true);
  let layoutList = [];
  function markToday() {
    R.prList.querySelectorAll('.pr-item').forEach((b) => {
      const l = layoutList[+b.dataset.k];
      const today = l && (l.today === true || (l.today == null && ((titleName && l.name === titleName) || (!titleName && titleDay && l.day === titleDay))));
      b.classList.toggle('today', !!today);
      const tag = b.querySelector('.pr-today');
      if (tag) tag.hidden = !today;
    });
  }
  function setLayouts(list = []) {
    layoutList = list.slice();
    R.prList.innerHTML = layoutList.map((l, k) => `
      <li><button type="button" class="pr-item" data-k="${k}">
        <span class="pr-day">${esc(String(l.day || '').slice(0, 1))}</span>
        <span class="pr-txt"><span class="pr-name">${esc(l.name || '')}</span>${l.theme ? `<span class="pr-theme">${esc(l.theme)}</span>` : ''}</span>
        <span class="pr-best">${l.best != null ? `<span class="pr-t">${formatTenths(l.best)}<small> 秒</small></span>` : '<span class="pr-t none">—</span>'}${medalSVG(l.medal || null, 'sm')}</span>
        <span class="pr-today" hidden>今日</span>
      </button></li>`).join('');
    R.prList.querySelectorAll('.pr-item').forEach((b) => {
      const l = layoutList[+b.dataset.k];
      b.setAttribute('aria-label', `${dayLabel(l.day)} ${l.name}${l.best != null ? `、自己ベスト ${formatTenths(l.best)} 秒` : ''}`);
      b.addEventListener('click', () => {
        stack.length = 0;
        apply();
        call('onPractice', l.id);
      });
    });
    markToday();
  }
  const on = (el, f) => el && el.addEventListener('click', f);
  on(R.start, () => call('onStart'));
  on(R.gear, () => openOverlay('settings'));
  on(R.tRank, () => call('onRanking'));
  on(R.tHowto, () => { openOverlay('howto'); call('onHowto'); });
  on(R.tPractice, () => openOverlay('practice'));
  on(R.hPause, () => call('onPause'));
  on(R.hRetry, () => call('onRetry'));
  on(R.pResume, () => call('onResume'));
  on(R.pRetry, () => call('onRetry'));
  on(R.pQuit, () => call('onQuit'));
  on(R.pSettings, () => openOverlay('settings'));
  on(R.pHowto, () => { openOverlay('howto'); call('onHowto'); });
  on(R.rAgain, () => call('onRetry'));
  on(R.rRank, () => call('onRanking'));
  on(R.rShare, () => call('onShare'));
  on(R.rReplay, () => call('onReplay'));
  on(R.failReload, () => call('onReload'));
  on(R.rpBack, () => call('onReplayBack'));
  on(R.rpBack2, () => call('onReplayBack'));
  on(R.rpRec, () => call('onRecord'));
  on(R.rpStop, () => call('onRecordStop'));
  on(R.rpShare, () => call('onVideoShare'));
  on(R.rpSave, () => call('onVideoSave'));
  on(R.sHowto, () => { openOverlay('howto'); call('onHowto'); });
  root.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', () => closeOverlay()));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && stack.length) { e.preventDefault(); e.stopImmediatePropagation(); closeOverlay(); return; }
    if (base === 'play' && !stack.length && !e.repeat && !e.metaKey && !e.ctrlKey && !e.altKey && /^[1-9]$/.test(e.key) && +e.key <= slots.length) {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      pick(+e.key - 1);
    }
  }, true);
  function quiet(on) {
    if (on) root.setAttribute('data-quiet', ''); else root.removeAttribute('data-quiet');
  }
  function insets(name) {
    const h = root.clientHeight || window.innerHeight;
    if (name === 'title') {
      const tt = root.querySelector('.t-top'), tb = root.querySelector('.t-bottom');
      if (tt && tb) return { top: Math.round(tt.offsetTop + tt.offsetHeight), bottom: Math.round(Math.max(0, h - tb.offsetTop)) };
    }
    if (name === 'result') return { top: 0, bottom: Math.round(Math.max(0, h - R.resSheet.offsetTop)) };
    if (name === 'replay') return { top: Math.round(R.hudBox.offsetTop + replayL.offsetTop + replayL.offsetHeight + 8), bottom: Math.round(Math.max(0, h - R.rpBar.offsetTop) + 8) };
    const top = R.hudBox.offsetTop + R.hudBox.offsetHeight + TUNE.gap;
    const bottom = Math.max(0, h - R.barBox.offsetTop - R.tray.offsetTop) + TUNE.gap;
    return { top: Math.round(top), bottom: Math.round(bottom) };
  }
  const replayL = root.querySelector('.replay-l');
  setSettings({});
  const C0 = typeof globalThis !== 'undefined' && globalThis.NFCore ? globalThis.NFCore.CONFIG : null;
  setInventory({ counts: ITEMS.map((it) => it.n), sel: C0 && Number.isInteger(C0.FIRST_ITEM) && C0.FIRST_ITEM >= 0 && C0.FIRST_ITEM < ITEMS.length ? C0.FIRST_ITEM : Math.max(0, ITEMS.findIndex((it) => it.id === 'kyoka')) });
  screen('title');
  return {
    screen, setTitle, setHud, setInventory, idleHint, hint, toast, showResult, setSettings, setLayouts, insets, quiet, setReplay,
    get result() { return lastResult; },
  };
}
