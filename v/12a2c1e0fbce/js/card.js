import { TITLE, HASHTAG, MEDAL_NAME, formatTenths, formatMeters, dayLabel, normThrown } from './text.js';
export const CARD = {
  w: 1200, h: 675,
  shotW: 720, shotH: 1200,
  thumbW: 192, thumbH: 252,
  tallW: 720, tallH: 1280,
  cropSide: 0.7, cropNorth: 0.75, cropSouth: 1.6,
};
const INK = '#1e2742', PAPER = '#fffbf3', SUN = '#ff7a3d', RED = '#e5392f', SKY = '#2f7fd0', MUTED = '#6b7088';
const FONT = '"Zen Maru Gothic", "Hiragino Maru Gothic ProN", "Hiragino Sans", "Yu Gothic", sans-serif';
const font = (weight, px) => `${weight} ${px}px ${FONT}`;
export const COLORS = { INK, PAPER, SUN, RED, SKY, MUTED };
export { font, rr };
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rr(g, x, y, w, h, r) {
  g.beginPath();
  if (typeof g.roundRect === 'function') { g.roundRect(x, y, w, h, r); return; }
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
export function cropShot(src, rect) {
  const out = mk(CARD.shotW, CARD.shotH), g = out.getContext('2d');
  const want = CARD.shotW / CARD.shotH;
  let { x, y, w, h } = rect;
  if (w / h < want) { const nw = h * want; x -= (nw - w) / 2; w = nw; } else { const nh = w / want; y -= (nh - h) / 2; h = nh; }
  if (w > src.width) { const k = src.width / w; x += (w - src.width) / 2; y += h * (1 - k) / 2; w *= k; h *= k; }
  if (h > src.height) { const k = src.height / h; y += (h - src.height) / 2; x += w * (1 - k) / 2; w *= k; h *= k; }
  x = Math.max(0, Math.min(src.width - w, x)); y = Math.max(0, Math.min(src.height - h, y));
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, x, y, w, h, 0, 0, out.width, out.height);
  return out;
}
const FLOORS = { oak: '#f0d5a4', hall: '#e9c891', tatami: '#cfd29a', tile: '#e4ddd0', doma: '#cbc3b5' };
export function planShot(layout, trail) {
  const out = mk(CARD.shotW, CARD.shotH), g = out.getContext('2d'), L = layout;
  const k = Math.min(out.width / (L.w + 1400), out.height / (L.h + 2300));
  const ox = (out.width - L.w * k) / 2, oy = (out.height - (L.h + 900) * k) / 2;
  g.fillStyle = '#a5cc7a'; g.fillRect(0, 0, out.width, out.height);
  g.translate(ox, oy); g.scale(k, k);
  g.fillStyle = FLOORS.oak; g.fillRect(0, 0, L.w, L.h);
  for (const r of L.rooms || []) { g.fillStyle = FLOORS[r.floor] || FLOORS.oak; g.fillRect(r.x1, r.y1, r.x2 - r.x1, r.y2 - r.y1); }
  g.fillStyle = '#d9d2c4'; g.fillRect(L.door.x1 - 150, L.h, L.door.x2 - L.door.x1 + 300, 1500);
  g.fillStyle = '#b98a5c';
  for (const r of L.rects || []) { rr(g, r.x1, r.y1, r.x2 - r.x1, r.y2 - r.y1, 60); g.fill(); }
  for (const c of L.circles || []) { g.beginPath(); g.arc(c.x, c.y, c.r, 0, 7); g.fill(); }
  g.fillStyle = '#4a3526';
  const T = L.wallT;
  const walls = [{ x1: 0, y1: 0, x2: L.w, y2: T }, { x1: 0, y1: 0, x2: T, y2: L.h }, { x1: L.w - T, y1: 0, x2: L.w, y2: L.h },
    { x1: 0, y1: L.h - T, x2: L.door.x1, y2: L.h }, { x1: L.door.x2, y1: L.h - T, x2: L.w, y2: L.h }, ...(L.walls || [])];
  for (const w of walls) g.fillRect(w.x1, w.y1, w.x2 - w.x1, w.y2 - w.y1);
  if (trail && trail.n > 1) {
    g.strokeStyle = '#ff6b5e'; g.lineWidth = 130; g.lineCap = g.lineJoin = 'round';
    g.beginPath();
    for (let i = 0; i < trail.n; i++) { const x = trail.pts[i * 2] * 1000, y = trail.pts[i * 2 + 1] * 1000; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke();
    const x = trail.pts[trail.n * 2 - 2] * 1000, y = trail.pts[trail.n * 2 - 1] * 1000;
    g.fillStyle = '#2e4374'; g.beginPath(); g.arc(x, y, 250, 0, 7); g.fill();
    g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(x, y, 190, 0, 7); g.fill();
  }
  return out;
}
export function makeThumb(shot, into) {
  const out = into || mk(CARD.thumbW, CARD.thumbH), g = out.getContext('2d');
  const sh = shot.width * out.height / out.width, sy = Math.max(0, (shot.height - sh) * 0.42);
  g.imageSmoothingQuality = 'high';
  g.drawImage(shot, 0, sy, shot.width, Math.min(sh, shot.height), 0, 0, out.width, out.height);
  return out;
}
const MEDAL = {
  gold: { stops: ['#fff0b0', '#f5c542', '#c98d17'], dark: '#b27a0e' },
  silver: { stops: ['#ffffff', '#d3dae2', '#8f9aa8'], dark: '#7c8796' },
  bronze: { stops: ['#f8cda6', '#d08a55', '#985222'], dark: '#8a4a1e' },
};
function drawMedal(g, kind, x, y, s) {
  const m = MEDAL[kind];
  if (!m || typeof Path2D !== 'function') return;
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = '#2b3a63'; g.fill(new Path2D('M9 1.5h9.5l8.5 20h-9.5z'));
  g.fillStyle = SKY; g.fill(new Path2D('M39 1.5h-9.5L21 21.5h9.5z'));
  g.fillStyle = 'rgba(255,255,255,.55)'; g.fill(new Path2D('M13.2 1.5h1.6l8.5 20h-1.6zM34.8 1.5h-1.6l-8.5 20h1.6z'));
  g.shadowColor = 'rgba(30,39,66,.28)'; g.shadowBlur = 10 * s; g.shadowOffsetY = 4 * s;
  g.fillStyle = m.dark; g.beginPath(); g.arc(24, 35, 16.5, 0, 7); g.fill();
  g.shadowColor = 'transparent';
  const gr = g.createLinearGradient(9, 20, 39, 50);
  gr.addColorStop(0, m.stops[0]); gr.addColorStop(0.43, m.stops[1]); gr.addColorStop(1, m.stops[2]);
  g.fillStyle = gr; g.beginPath(); g.arc(24, 35, 15, 0, 7); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.2; g.beginPath(); g.arc(24, 35, 11.5, 0, 7); g.stroke();
  g.lineCap = 'round'; g.globalAlpha = 0.8; g.strokeStyle = m.dark; g.lineWidth = 1.8;
  g.stroke(new Path2D('M17.5 38.5a6.5 6.5 0 0 1 13 0M15.5 38.5h17M24 27.8v2.2M17.8 30.4l1.5 1.5M30.2 30.4l-1.5 1.5'));
  g.globalAlpha = 1; g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2.4;
  g.stroke(new Path2D('M12.2 30.5a12.5 12.5 0 0 1 9-8.4'));
  g.restore();
}
function sticker(g, s, x, y, fill, edge) {
  g.save();
  g.lineJoin = 'round'; g.strokeStyle = '#fff'; g.lineWidth = edge;
  g.shadowColor = 'rgba(30, 39, 66, .16)'; g.shadowBlur = edge * 1.2; g.shadowOffsetY = edge * 0.4;
  g.strokeText(s, x, y);
  g.shadowColor = 'transparent';
  g.fillStyle = fill; g.fillText(s, x, y);
  g.restore();
  return g.measureText(s).width;
}
function sunGrad(g, y0, y1) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, '#ff9a4f'); gr.addColorStop(1, '#f2511f');
  return gr;
}
function pill(g, s, x, cy, bg, fg) {
  g.save();
  g.font = font(900, 24);
  const w = g.measureText(s).width + 32, h = 42;
  rr(g, x, cy - h / 2, w, h, h / 2); g.fillStyle = bg; g.fill();
  g.fillStyle = fg; g.textBaseline = 'middle'; g.fillText(s, x + 16, cy + 1);
  g.restore();
  return w;
}
function paper(g, W, H, bands) {
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#fffdf8'); bg.addColorStop(1, '#ffecd4');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const R = Math.max(W, H) * 0.64;
  const sun = g.createRadialGradient(W - 90, -60, 0, W - 90, -60, R);
  sun.addColorStop(0, 'rgba(255, 176, 96, .62)'); sun.addColorStop(0.42, 'rgba(255, 200, 140, .24)'); sun.addColorStop(1, 'rgba(255, 220, 180, 0)');
  g.fillStyle = sun; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = 0.4; g.fillStyle = '#fff';
  const lean = H * 0.37;
  for (const [x, w] of bands) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + w, 0); g.lineTo(x + w - lean, H); g.lineTo(x - lean, H); g.closePath(); g.fill(); }
  g.restore();
}
function photo(g, shot, cx, cy, pw, ph) {
  g.save(); g.translate(cx, cy); g.rotate(-2 * Math.PI / 180);
  g.shadowColor = 'rgba(30, 39, 66, .32)'; g.shadowBlur = 46; g.shadowOffsetY = 22;
  g.fillStyle = '#fff'; rr(g, -pw / 2 - 10, -ph / 2 - 10, pw + 20, ph + 20, 30); g.fill();
  g.shadowColor = 'transparent';
  rr(g, -pw / 2, -ph / 2, pw, ph, 21); g.clip();
  if (shot && shot.width) g.drawImage(shot, -pw / 2, -ph / 2, pw, ph);
  else { g.fillStyle = '#f0d5a4'; g.fillRect(-pw / 2, -ph / 2, pw, ph); }
  g.restore();
}
function wordsBottom(r, list) {
  return (r.outcome === 'out' ? 276 + (r.medal && MEDAL[r.medal] ? 98 : 12) : r.outcome === 'late' ? 328 : 342) + (list.length ? 140 : 0);
}
const WORDS_W = 650;
function words(g, r, list, icons, x0) {
  let y = 98;
  const where = [r.day ? dayLabel(r.day) : '', r.layoutName || ''].filter(Boolean).join(' ・ ');
  const pills = [];
  if (r.practice) pills.push(['れんしゅう', 'rgba(30, 39, 66, .1)', INK]);
  if (r.outcome === 'out' && r.newBest) pills.push(['自己ベスト！', SUN, '#fff']);
  g.font = font(900, 24);
  const room = WORDS_W - pills.reduce((w, p) => w + g.measureText(p[0]).width + 32 + 10, 0) - (pills.length ? 8 : 0);
  let size = 27;
  g.font = font(700, size);
  const ww = g.measureText(where).width;
  if (ww > room) { size = Math.max(19, Math.floor(size * room / ww)); g.font = font(700, size); }
  g.fillStyle = MUTED;
  g.fillText(where, x0, y);
  let tx = x0 + g.measureText(where).width + (where ? 18 : 0);
  for (const p of pills) tx += pill(g, p[0], tx, y - 10, p[1], p[2]) + 10;
  if (r.outcome === 'out') {
    const num = formatTenths(r.tenths);
    g.font = font(900, 176);
    const nw = sticker(g, num, x0 - 6, 276, sunGrad(g, 150, 280), 16);
    g.font = font(900, 62); g.fillStyle = INK;
    g.fillText('秒で', x0 + nw + 14, 204); g.fillText('家を出た', x0 + nw + 14, 274);
    y = 276;
    if (r.medal && MEDAL[r.medal]) {
      drawMedal(g, r.medal, x0, y + 26, 1.36);
      g.font = font(900, 38); g.fillStyle = INK; g.fillText(MEDAL_NAME[r.medal] + 'メダル', x0 + 82, y + 26 + 54);
      y += 26 + 72;
    } else y += 12;
  } else if (r.outcome === 'late') {
    g.font = font(900, 128);
    sticker(g, '遅刻！', x0 - 4, 232, RED, 14);
    let x = x0;
    g.font = font(900, 48); g.fillStyle = INK; g.fillText('玄関まで あと', x, 316); x += g.measureText('玄関まで あと').width + 14;
    g.font = font(900, 84); x += sticker(g, formatMeters(r.dist), x, 318, sunGrad(g, 250, 320), 10) + 12;
    g.font = font(900, 48); g.fillStyle = INK; g.fillText('m', x, 316);
    y = 328;
  } else {
    g.font = font(900, 70);
    sticker(g, '止まってしまった…', x0 - 2, 204, INK, 12);
    g.font = font(700, 36); g.fillStyle = INK; g.fillText('もう投げる物がない', x0, 268);
    let x = x0 - 14;
    g.font = font(700, 36); g.fillText('（玄関まで', x, 330); x += g.measureText('（玄関まで').width + 12;
    g.font = font(900, 68); x += sticker(g, formatMeters(r.dist), x, 332, sunGrad(g, 276, 334), 9) + 10;
    g.font = font(700, 36); g.fillStyle = INK; g.fillText('m）', x, 330);
    y = 342;
  }
  if (list.length) {
    y += 46;
    g.font = font(700, 24); g.fillStyle = MUTED; g.fillText('投げた物', x0, y);
    y += 16;
    const ts = 78, gap = 12;
    let x = x0;
    for (const t of list.slice(0, 7)) {
      g.save();
      g.shadowColor = 'rgba(30, 39, 66, .16)'; g.shadowBlur = 18; g.shadowOffsetY = 8;
      g.fillStyle = 'rgba(255, 255, 255, .94)'; rr(g, x, y, ts, ts, 22); g.fill();
      g.restore();
      const ic = icons && icons[t.id];
      if (ic && ic.width) g.drawImage(ic, x + 7, y + 7, ts - 14, ts - 14);
      else { g.font = font(900, 26); g.fillStyle = INK; g.textAlign = 'center'; g.fillText(String(t.name).slice(0, 2), x + ts / 2, y + ts / 2 + 9); g.textAlign = 'left'; }
      if (t.n > 1) {
        g.fillStyle = INK; g.beginPath(); g.arc(x + ts - 8, y + 10, 18, 0, 7); g.fill();
        g.font = font(900, 20); g.fillStyle = PAPER; g.textAlign = 'center'; g.fillText('×' + t.n, x + ts - 8, y + 17); g.textAlign = 'left';
      }
      x += ts + gap;
    }
  }
}
export function drawLogo(g, x, by, px) {
  g.save();
  g.font = font(900, px);
  const e = px * 0.2;
  let lx = x;
  lx += sticker(g, TITLE.slice(0, 2), lx, by, INK, e);
  lx += sticker(g, TITLE.slice(2, 4), lx, by, sunGrad(g, by - px * 0.93, by + px * 0.07), e);
  lx += sticker(g, TITLE.slice(4), lx, by, INK, e);
  g.restore();
  return lx - x;
}
function tag(g, xRight, by, px) {
  g.font = font(700, px); g.fillStyle = SKY; g.textAlign = 'right';
  g.fillText(HASHTAG, xRight, by);
  g.textAlign = 'left';
}
export function composeCard(o) {
  const W = CARD.w, H = CARD.h, r = o.r || {}, cv = mk(W, H), g = cv.getContext('2d');
  g.textBaseline = 'alphabetic'; g.imageSmoothingQuality = 'high';
  paper(g, W, H, [[560, 64], [668, 20], [960, 104], [1110, 28]]);
  photo(g, o.shot, 78 + 180, H / 2, 360, 600);
  const x0 = 496, list = normThrown(r.thrown);
  g.save(); g.translate(0, Math.max(0, Math.min(64, (H - 152 - wordsBottom(r, list)) / 2)));
  words(g, r, list, o.icons, x0);
  g.restore();
  drawLogo(g, x0 - 4, H - 56, 60);
  tag(g, W - 60, H - 58, 28);
  return cv;
}
export function composeCardTall(o) {
  const W = CARD.tallW, H = CARD.tallH, r = o.r || {}, cv = mk(W, H), g = cv.getContext('2d');
  g.textBaseline = 'alphabetic'; g.imageSmoothingQuality = 'high';
  paper(g, W, H, [[260, 70], [400, 22], [690, 110], [900, 30]]);
  photo(g, o.shot, W / 2, 64 + 275, 330, 550);
  const list = normThrown(r.thrown), top = 566;
  g.save(); g.translate(44 - 496, top + Math.max(0, Math.min(70, (H - 152 - top - wordsBottom(r, list)) / 2)));
  words(g, r, list, o.icons, 496);
  g.restore();
  drawLogo(g, 40, H - 58, 60);
  tag(g, W - 40, H - 60, 28);
  return cv;
}
export function toBlob(canvas) {
  return new Promise((res) => {
    try { canvas.toBlob((b) => res(b || null), 'image/png'); } catch (e) { res(null); }
  });
}
export function fontsReady() {
  const fs = typeof document !== 'undefined' && document.fonts;
  if (!fs || typeof fs.load !== 'function') return Promise.resolve();
  const all = Promise.all([fs.load(font(900, 60)), fs.load(font(700, 27))]).then(() => {}, () => {});
  return Promise.race([all, new Promise((r) => setTimeout(r, 1500))]);
}
