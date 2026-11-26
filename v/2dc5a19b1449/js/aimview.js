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
        <circle class="pl-anchor-bg" r="6"/><circle class="pl-anchor" r="6"/>
        <circle class="pl-knob" r="3"/>
        <g class="pl-tip"><path class="pl-tip-bg" d="M-6 -5.5L0 0L-6 5.5"/><path class="pl-tip-fg" d="M-6 -5.5L0 0L-6 5.5"/></g>
      </g>
    </svg>
    <div class="pl-more"><span>もっと引く</span></div>
    <div class="pl-note"><span></span></div>`);
  const q = (s) => root.querySelector(s);
  const g = q('.pl-g'), max = q('.pl-max'), band = q('.pl-band'), bandBg = q('.pl-band-bg'), knob = q('.pl-knob'), tip = q('.pl-tip'), more = q('.pl-more');
  const noteEl = q('.pl-note'), noteT = noteEl.firstChild;
  const last = { x: NaN, y: NaN, p: -1, ok: null, more: null, mx: NaN, my: NaN };
  let hideTimer = 0;
  return {
    show(x0, y0, r, same) {
      clearTimeout(hideTimer);
      if (same) root.setAttribute('data-same', ''); else root.removeAttribute('data-same');
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
        band.setAttribute('x2', x); band.setAttribute('y2', y);
        bandBg.setAttribute('x2', x); bandBg.setAttribute('y2', y);
        knob.setAttribute('cx', x); knob.setAttribute('cy', y);
        const len = Math.hypot(x, y);
        if (len > 0.5) tip.setAttribute('transform', `translate(${(x + x / len * 9).toFixed(1)} ${(y + y / len * 9).toFixed(1)}) rotate(${(Math.atan2(y, x) * 180 / Math.PI).toFixed(1)})`);
      }
      const pq = Math.round(p * 20) / 20;
      if (pq !== last.p || ok !== last.ok) {
        last.p = pq; last.ok = ok;
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
export function createCoach(after) {
  const root = layer(after);
  const el = document.createElement('div');
  el.className = 'coach';
  el.innerHTML = `<div class="co-rot">
      <i class="co-span co-s1"></i><i class="co-span co-s2"></i><i class="co-span co-s3"></i>
      <i class="co-trail"></i><i class="co-path"></i><i class="co-ghost"></i><i class="co-band"></i><i class="co-tip"></i><i class="co-sling"><b></b><b></b></i><i class="co-puff"><b></b><b></b><b></b></i><i class="co-item"></i><i class="co-kid"></i><i class="co-finger"></i>
    </div>
    <span class="co-lbl co-l-sub"></span><span class="co-lbl co-l-main"></span>`;
  root.appendChild(el);
  const q = (c) => el.querySelector(c);
  const lSub = q('.co-l-sub'), lMain = q('.co-l-main'), spans = [...el.querySelectorAll('.co-span')];
  let mode = null, flipped = null;
  const box = (e, m) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.left - m), y: Math.round(r.top - m), w: Math.round(r.width + m * 2), h: Math.round(r.height + m * 2) }; };
  return {
    show(cx, cy, same, flip) {
      el.style.transform = `translate(${Math.round(cx)}px, ${Math.round(cy)}px)`;
      if (!!flip !== flipped) { flipped = !!flip; if (flipped) el.setAttribute('data-flip', ''); else el.removeAttribute('data-flip'); }
      if (same !== mode) {
        mode = same;
        const t = same ? COACH.same : COACH.opposite;
        lMain.textContent = t.main; lSub.textContent = t.sub;
        if (same) el.setAttribute('data-same', ''); else el.removeAttribute('data-same');
      }
      el.setAttribute('data-on', '');
    },
    hide() { el.removeAttribute('data-on'); },
    rects() { return spans.map((e) => box(e, 0)).concat([lSub, lMain].filter((e) => e.offsetWidth > 0).map((e) => box(e, 2))); },
  };
}
