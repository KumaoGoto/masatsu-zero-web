import { COACH } from './text.js';
const NS = 'http://www.w3.org/2000/svg';
function layer(after) {
  let root = document.getElementById('pull');
  if (root) return root;
  root = document.createElement('div');
  root.id = 'pull';
  root.setAttribute('aria-hidden', 'true');
  if (after && after.parentNode) after.parentNode.insertBefore(root, after.nextSibling); else document.body.appendChild(root);
  return root;
}
export function createAimView(after) {
  const root = layer(after);
  root.insertAdjacentHTML('beforeend', `<svg class="pl-svg" xmlns="${NS}" width="100%" height="100%" focusable="false">
      <g class="pl-g">
        <circle class="pl-max" r="130"/>
        <line class="pl-band-bg"/><line class="pl-band"/>
        <circle class="pl-anchor-bg" r="9"/><circle class="pl-anchor" r="9"/>
        <circle class="pl-knob" r="4.5"/>
      </g>
    </svg>
    <div class="pl-more"><span>もっと引く</span></div>
    <div class="pl-note"><span></span></div>`);
  const q = (s) => root.querySelector(s);
  const g = q('.pl-g'), max = q('.pl-max'), bandBg = q('.pl-band-bg'), band = q('.pl-band'), knob = q('.pl-knob'), more = q('.pl-more');
  const noteEl = q('.pl-note'), noteT = noteEl.firstChild;
  const last = { x: NaN, y: NaN, p: -1, ok: null, more: null, mx: NaN, my: NaN };
  let hideTimer = 0;
  return {
    show(x0, y0, r) {
      clearTimeout(hideTimer);
      g.setAttribute('transform', `translate(${x0.toFixed(1)} ${y0.toFixed(1)})`);
      max.setAttribute('r', r.toFixed(1));
      last.x = last.y = NaN; last.p = -1; last.ok = null;
      root.removeAttribute('data-out');
      root.setAttribute('data-on', '');
      this.update(0, 0, 0, false);
    },
    update(dx, dy, p, ok) {
      const x = Math.round(dx * 2) / 2, y = Math.round(dy * 2) / 2;
      if (x !== last.x || y !== last.y) {
        last.x = x; last.y = y;
        bandBg.setAttribute('x2', x); bandBg.setAttribute('y2', y);
        band.setAttribute('x2', x); band.setAttribute('y2', y);
        knob.setAttribute('cx', x); knob.setAttribute('cy', y);
      }
      const pq = Math.round(p * 20) / 20;
      if (pq !== last.p || ok !== last.ok) {
        last.p = pq; last.ok = ok;
        const w = 1.75 + 1.25 * pq;
        band.style.strokeWidth = w.toFixed(2);
        bandBg.style.strokeWidth = (w + 2).toFixed(2);
        if (ok) root.setAttribute('data-ok', ''); else root.removeAttribute('data-ok');
        if (pq >= 1) root.setAttribute('data-full', ''); else root.removeAttribute('data-full');
      }
    },
    more(on, x, y) {
      if (on) {
        const mx = Math.round(x), my = Math.round(y);
        if (mx !== last.mx || my !== last.my) { last.mx = mx; last.my = my; more.style.transform = `translate(${mx}px, ${my}px)`; }
      }
      if (on !== last.more) { last.more = on; if (on) more.setAttribute('data-on', ''); else more.removeAttribute('data-on'); }
    },
    note(text, x, y) {
      noteEl.removeAttribute('data-on');
      if (!text) return;
      noteT.textContent = text;
      noteEl.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
      void noteEl.offsetWidth;
      noteEl.setAttribute('data-on', '');
    },
    hide(thrown) {
      this.more(false);
      root.removeAttribute('data-on');
      if (thrown) {
        root.setAttribute('data-out', '');
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => root.removeAttribute('data-out'), 220);
      }
    },
  };
}
const ARROW = `<svg viewBox="0 0 40 16" focusable="false"><path d="M2 8h32M27 2.5l8 5.5-8 5.5"/></svg>`;
export function createCoach(after) {
  const root = layer(after);
  const el = document.createElement('div');
  el.className = 'coach';
  el.innerHTML = `<div class="co-rot">
      <i class="co-arr co-to">${ARROW}</i><i class="co-arr co-back">${ARROW}</i>
      <i class="co-band"></i><i class="co-anchor"></i><i class="co-finger"></i>
    </div>
    <span class="co-lbl co-l-to"></span><span class="co-lbl co-l-back"></span>`;
  root.appendChild(el);
  const q = (c) => el.querySelector(c);
  const lTo = q('.co-l-to'), lBack = q('.co-l-back'), rot = q('.co-rot'), finger = q('.co-finger'), band = q('.co-band'), aTo = q('.co-to'), aBack = q('.co-back');
  let invert = null;
  const around = (e1, e2, m) => {
    const a = e1.getBoundingClientRect(), b = e2.getBoundingClientRect();
    const x1 = Math.min(a.left, b.left) - m, y1 = Math.min(a.top, b.top) - m, x2 = Math.max(a.right, b.right) + m, y2 = Math.max(a.bottom, b.bottom) + m;
    return { x: Math.round(x1), y: Math.round(y1), w: Math.round(x2 - x1), h: Math.round(y2 - y1) };
  };
  return {
    show(cx, cy, inv) {
      el.style.transform = `translate(${Math.round(cx)}px, ${Math.round(cy)}px)`;
      if (inv !== invert) {
        invert = inv;
        lTo.textContent = inv ? COACH.self : COACH.item;
        lBack.textContent = inv ? COACH.item : COACH.self;
        if (inv) el.setAttribute('data-invert', ''); else el.removeAttribute('data-invert');
      }
      el.setAttribute('data-on', '');
    },
    hide() { el.removeAttribute('data-on'); },
    rects() {
      const o = el.getBoundingClientRect();
      const m = new DOMMatrixReadOnly(getComputedStyle(rot).transform);
      const x1 = finger.offsetLeft, y1 = finger.offsetTop, x2 = x1 + finger.offsetWidth + band.offsetWidth, y2 = y1 + finger.offsetHeight;
      let l = Infinity, t = Infinity, r = -Infinity, btm = -Infinity;
      for (const [x, y] of [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]) {
        const px = m.a * x + m.c * y, py = m.b * x + m.d * y;
        if (px < l) l = px; if (px > r) r = px; if (py < t) t = py; if (py > btm) btm = py;
      }
      const pad = finger.offsetWidth * 0.2;
      return [
        { x: Math.round(o.left + l - pad), y: Math.round(o.top + t - pad), w: Math.round(r - l + pad * 2), h: Math.round(btm - t + pad * 2) },
        around(lTo, aTo, 2), around(lBack, aBack, 2),
      ];
    },
  };
}
