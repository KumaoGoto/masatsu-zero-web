import * as THREE from 'three';
import { PAL, MATS, Builder, roundedBoxGeo, linear, TAU, clamp, lerp, damp, hash2 } from './kit.js';
const PI = Math.PI, HP = Math.PI / 2;
export const HEIGHTS = {
  desk: 0.62, closet: 1.0, bookshelf: 0.95, sofa: 0.62, shoebox: 0.85, table: 0.38, kotatsu: 0.4, tvboard: 0.9,
  fridge: 1.0, kitchen: 0.8, washer: 0.85, tansu: 0.9, counter: 0.8, bench: 0.4, shelf: 0.9, bed: 0.46, cardboard: 0.5,
  plant: 0.9, kasa: 0.85, pillar: 0.55, lamp: 0.95, vase: 0.85, stool: 0.42, bin: 0.4,
  cat: 0.33, chair: 0.75, ball: 0.24, robot: 0.1, shoe: 0.11, slipper: 0.07, cushion: 0.1, box: 0.3, toy: 0.14,
  child: 0.65,
};
export const FACE = { S: 0, E: HP, N: PI, W: -HP };
export const FUTON_TOP = 0.05;
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
const mix = (a, b, t) => { _c1.set(a); _c2.set(b); return '#' + _c1.lerp(_c2, t).getHexString(); };
const dk = (c, t = 0.16) => mix(c, PAL.wallCap, t);
const lt = (c, t = 0.2) => mix(c, PAL.paper, t);
function rng(seed) { let i = 0; return () => hash2(seed | 0, (i += 1) * 7919 + 11); }
const pick = (r, list) => list[Math.min(list.length - 1, Math.floor(r() * list.length))];
function strSeed(s) { let h = 5381; s = String(s); for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) + s.charCodeAt(i)) | 0; return h; }
const setc = (c, i, rgb) => { c[i] = rgb[0]; c[i + 1] = rgb[1]; c[i + 2] = rgb[2]; };
const mixc = (c, i, rgb, t) => { c[i] += (rgb[0] - c[i]) * t; c[i + 1] += (rgb[1] - c[i + 1]) * t; c[i + 2] += (rgb[2] - c[i + 2]) * t; };
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const _geo = new Map();
const k4 = (v) => Math.round(v * 1e4);
function memo(key, make) { let g = _geo.get(key); if (!g) { g = make(); if (g.index) g = g.toNonIndexed(); _geo.set(key, g); } return g; }
const sphGeo = (ws, hs) => memo(`s${ws}_${hs}`, () => new THREE.SphereGeometry(1, ws, hs));
const cylGeo = (rt, rb, h, seg, open) => memo(`c${k4(rt)}_${k4(rb)}_${k4(h)}_${seg}_${open ? 1 : 0}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open));
const capGeo = (r, len, cs, rs) => memo(`k${k4(r)}_${k4(len)}_${cs}_${rs}`, () => new THREE.CapsuleGeometry(r, len, cs, rs));
const torGeo = (R, r, rs, ts, arc) => memo(`t${k4(R)}_${k4(r)}_${rs}_${ts}_${k4(arc)}`, () => new THREE.TorusGeometry(R, r, rs, ts, arc));
function softBoxGeo(w, h, d, R = 0.02, rt = 0.01, rb = 0, cs = 2, es = 2) {
  R = clamp(R, 0, Math.min(w, d) / 2);
  rt = clamp(rt, 0, Math.min(R, h * 0.5));
  rb = clamp(rb, 0, Math.min(R, h - rt));
  if (R < 1e-4) cs = 1;
  return memo(`b${k4(w)}_${k4(h)}_${k4(d)}_${k4(R)}_${k4(rt)}_${k4(rb)}_${cs}_${es}`, () => {
    const hx = w / 2 - R, hz = d / 2 - R, n = 4 * (cs + 1);
    const cc = [[hx, hz], [-hx, hz], [-hx, -hz], [hx, -hz]], ring = [], rows = [];
    for (let k = 0; k < 4; k++) for (let j = 0; j <= cs; j++) { const a = (k + j / cs) * HP; ring.push([cc[k][0], cc[k][1], Math.cos(a), Math.sin(a)]); }
    if (rb > 0) for (let j = 0; j <= es; j++) { const a = -HP + HP * j / es; rows.push([rb * (1 - Math.cos(a)), -h / 2 + rb + rb * Math.sin(a), Math.cos(a), Math.sin(a)]); }
    else rows.push([0, -h / 2, 0, -1], [0, -h / 2, 1, 0]);
    if (rt > 0) for (let j = 0; j <= es; j++) { const a = HP * j / es; rows.push([rt * (1 - Math.cos(a)), h / 2 - rt + rt * Math.sin(a), Math.cos(a), Math.sin(a)]); }
    else rows.push([0, h / 2, 1, 0], [0, h / 2, 0, 1]);
    const P = [], N = [];
    const v = (i, j) => { const r = rows[i], q = ring[j % n], k = R - r[0]; P.push(q[0] + q[2] * k, r[1], q[1] + q[3] * k); N.push(q[2] * r[2], r[3], q[3] * r[2]); };
    for (let i = 0; i < rows.length - 1; i++) {
      if (rows[i][0] === rows[i + 1][0] && rows[i][1] === rows[i + 1][1]) continue;
      for (let j = 0; j < n; j++) { v(i, j); v(i + 1, j); v(i, j + 1); v(i, j + 1); v(i + 1, j); v(i + 1, j + 1); }
    }
    const top = rows.length - 1;
    for (let j = 1; j < n - 1; j++) { v(0, 0); v(0, j); v(0, j + 1); v(top, 0); v(top, j + 1); v(top, j); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    return g;
  });
}
function crease(geo, deg = 45) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const p = g.attributes.position.array, nt = p.length / 9, fn = new Float32Array(nt * 3), fu = new Float32Array(nt * 3), map = new Map();
  for (let t = 0; t < nt; t++) {
    const i = t * 9, ax = p[i + 3] - p[i], ay = p[i + 4] - p[i + 1], az = p[i + 5] - p[i + 2], bx = p[i + 6] - p[i], by = p[i + 7] - p[i + 1], bz = p[i + 8] - p[i + 2];
    const x = ay * bz - az * by, y = az * bx - ax * bz, z = ax * by - ay * bx, l = Math.hypot(x, y, z) || 1;
    fn.set([x, y, z], t * 3); fu.set([x / l, y / l, z / l], t * 3);
    for (let k = 0; k < 3; k++) { const key = Math.round(p[i + k * 3] * 2e4) + '_' + Math.round(p[i + k * 3 + 1] * 2e4) + '_' + Math.round(p[i + k * 3 + 2] * 2e4); let a = map.get(key); if (!a) map.set(key, a = []); a.push(t); }
  }
  const cosT = Math.cos(deg * PI / 180), nor = new Float32Array(p.length);
  for (let t = 0; t < nt; t++) for (let k = 0; k < 3; k++) {
    const i = t * 9 + k * 3, key = Math.round(p[i] * 2e4) + '_' + Math.round(p[i + 1] * 2e4) + '_' + Math.round(p[i + 2] * 2e4);
    let x = 0, y = 0, z = 0;
    for (const u of map.get(key)) if (fu[u * 3] * fu[t * 3] + fu[u * 3 + 1] * fu[t * 3 + 1] + fu[u * 3 + 2] * fu[t * 3 + 2] >= cosT) { x += fn[u * 3]; y += fn[u * 3 + 1]; z += fn[u * 3 + 2]; }
    const l = Math.hypot(x, y, z) || 1; nor[i] = x / l; nor[i + 1] = y / l; nor[i + 2] = z / l;
  }
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return g;
}
function extrudeGeo(pts, depth, bevel = 0.004, bs = 1, deg = 50) {
  const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(1e-4, depth - 2 * bevel), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: bs, steps: 1, curveSegments: 1 });
  g.translate(0, 0, -Math.max(1e-4, depth - 2 * bevel) / 2);
  g.deleteAttribute('uv');
  return crease(g, deg);
}
function fillet(pts, seg = 4) {
  const out = [], n = pts.length;
  for (let i = 0; i < n; i++) {
    const [px, py, r = 0] = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
    let ux = a[0] - px, uy = a[1] - py, vx = b[0] - px, vy = b[1] - py;
    const ul = Math.hypot(ux, uy), vl = Math.hypot(vx, vy);
    if (r < 1e-5 || ul < 1e-6 || vl < 1e-6) { out.push([px, py]); continue; }
    ux /= ul; uy /= ul; vx /= vl; vy /= vl;
    const half = Math.acos(clamp(ux * vx + uy * vy, -1, 1)) / 2;
    const dd = Math.min(r / Math.tan(half), ul * 0.5, vl * 0.5), rr = dd * Math.tan(half);
    const bl = Math.hypot(ux + vx, uy + vy) || 1, cx = px + (ux + vx) / bl * rr / Math.sin(half), cy = py + (uy + vy) / bl * rr / Math.sin(half);
    const a0 = Math.atan2(py + uy * dd - cy, px + ux * dd - cx);
    let da = Math.atan2(py + vy * dd - cy, px + vx * dd - cx) - a0;
    while (da > PI) da -= TAU; while (da < -PI) da += TAU;
    for (let k = 0; k <= seg; k++) { const t = a0 + da * k / seg; out.push([cx + Math.cos(t) * rr, cy + Math.sin(t) * rr]); }
  }
  return out;
}
const smooth2 = (pts, n) => new THREE.SplineCurve(pts.map(([x, y]) => new THREE.Vector2(x, y))).getPoints(n).map((p) => [Math.max(0, p.x), p.y]);
function tubeGeo(pts, r, seg, rad = 6, closed = false) {
  const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), closed, 'catmullrom', 0.5);
  const g = new THREE.TubeGeometry(c, seg, r, rad, closed);
  g.deleteAttribute('uv');
  return g.toNonIndexed();
}
function ribbonGeo(pts, rw, rh, out, seg = 16, rad = 6) {
  const sp = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'catmullrom', 0.5).getPoints(seg);
  const R = [], t = new THREE.Vector3(), n = new THREE.Vector3(), b = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    t.subVectors(sp[Math.min(seg, i + 1)], sp[Math.max(0, i - 1)]).normalize();
    const o = out(sp[i]); n.set(o[0], o[1], o[2]); n.addScaledVector(t, -n.dot(t)).normalize(); b.crossVectors(t, n);
    const ring = [];
    for (let j = 0; j < rad; j++) {
      const a = j / rad * TAU, c = Math.cos(a), s = Math.sin(a);
      const nn = new THREE.Vector3().addScaledVector(n, c / rh).addScaledVector(b, s / rw).normalize();
      ring.push([sp[i].x + n.x * rh * c + b.x * rw * s, sp[i].y + n.y * rh * c + b.y * rw * s, sp[i].z + n.z * rh * c + b.z * rw * s, nn.x, nn.y, nn.z]);
    }
    R.push(ring);
  }
  const P = [], N = [], v = (q) => { P.push(q[0], q[1], q[2]); N.push(q[3], q[4], q[5]); };
  for (let i = 0; i < seg; i++) for (let j = 0; j < rad; j++) { const a = R[i][j], c = R[i][(j + 1) % rad], d = R[i + 1][j], e = R[i + 1][(j + 1) % rad]; v(a); v(c); v(d); v(c); v(e); v(d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  return g;
}
function ringFillGeo(pts, scales) {
  const P = [], n = pts.length;
  for (let s = 0; s < scales.length - 1; s++) {
    const a = scales[s], b = scales[s + 1];
    for (let j = 0; j < n; j++) {
      const p = pts[j], q = pts[(j + 1) % n];
      P.push(p[0] * a, 0, p[1] * a, p[0] * b, 0, p[1] * b, q[0] * a, 0, q[1] * a);
      if (b > 1e-6) P.push(q[0] * a, 0, q[1] * a, p[0] * b, 0, p[1] * b, q[0] * b, 0, q[1] * b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.computeVertexNormals();
  const nr = g.attributes.normal.array;
  if (nr[1] < 0) { const pa = g.attributes.position.array; for (let i = 0; i < pa.length; i += 9) for (let k = 0; k < 3; k++) { const t = pa[i + 3 + k]; pa[i + 3 + k] = pa[i + 6 + k]; pa[i + 6 + k] = t; } g.computeVertexNormals(); }
  return g;
}
const _m4 = new THREE.Matrix4(), _q4 = new THREE.Quaternion(), _e4 = new THREE.Euler(), _p4 = new THREE.Vector3(), _s4 = new THREE.Vector3(), _n3 = new THREE.Matrix3(), _v4 = new THREE.Vector3();
class MB extends Builder {
  n(cls = 'matte') { const k = this.b[cls]; return k ? k.p.length : 0; }
  edit(cls, from, fn) { const k = this.b[cls]; if (k) for (let i = from; i < k.p.length; i += 3) fn(k.p, k.c, k.n, i); return this; }
  _o(h, o) { return o.b != null ? { ...o, y: o.b + h / 2 } : o; }
  sb(w, h, d, color, o = {}) {
    const R = o.R ?? Math.min(0.02, Math.min(w, d) * 0.25), r = o.r ?? Math.min(R, 0.012, h * 0.45);
    return this.geo(softBoxGeo(w, h, d, R, r, o.rb ?? 0, o.cs ?? 2, o.es ?? 2), color, this._o(h, o));
  }
  fp(w, h, t, color, o = {}) {
    const R = o.R ?? Math.min(0.012, Math.min(w, h) * 0.2), r = o.r ?? Math.min(R, t * 0.6);
    return this.geo(softBoxGeo(w, t, h, R, r, 0, o.cs ?? 2, o.es ?? 1), color, { ...o, rx: HP, z: (o.z || 0) + t / 2 });
  }
  pb(w, h, d, color, o = {}) { return this.geo(roundedBoxGeo(w, h, d, 0), color, this._o(h, o)); }
  cy(rt, rb, h, color, o = {}) { return this.geo(cylGeo(rt, rb, h, o.seg ?? 16, !!o.open), color, this._o(h, o)); }
  ball(r, color, o = {}) { return this.geo(sphGeo(o.ws ?? 12, o.hs ?? 8), color, { ...o, sx: (o.sx ?? 1) * r, sy: (o.sy ?? 1) * r, sz: (o.sz ?? 1) * r }); }
  pill(r, len, color, o = {}) { return this.geo(capGeo(r, len, o.cs ?? 3, o.rs ?? 10), color, o); }
  tor(R, r, color, o = {}) { return this.geo(torGeo(R, r, o.rs ?? 6, o.ts ?? 16, o.arc ?? TAU), color, o); }
  rev(pts, color, o = {}) { return this.lathe(pts, color, { seg: 20, ...o }); }
  tube(pts, r, color, o = {}) {
    this.geo(tubeGeo(pts, r, o.seg ?? pts.length * 3, o.rad ?? 6, !!o.closed), color, { cls: o.cls, color2: o.color2 });
    if (o.caps) for (const p of [pts[0], pts[pts.length - 1]]) this.ball(r, color, { x: p[0], y: p[1], z: p[2], ws: 6, hs: 4, cls: o.cls });
    return this;
  }
  ribbon(pts, rw, rh, out, color, o = {}) { return this.geo(ribbonGeo(pts, rw, rh, out, o.seg ?? 16, o.rad ?? 6), color, { cls: o.cls }); }
  ex(pts, depth, color, o = {}) { return this.geo(extrudeGeo(pts, depth, o.bevel ?? 0.004, o.bs ?? 1, o.deg ?? 50), color, o); }
  put(fn, o = {}) {
    const sub = new MB(); fn(sub);
    _e4.set(o.rx || 0, o.ry || 0, o.rz || 0, 'YXZ'); _q4.setFromEuler(_e4);
    _p4.set(o.x || 0, o.y || 0, o.z || 0); const s = o.s ?? 1; _s4.set((o.sx ?? 1) * s, (o.sy ?? 1) * s, (o.sz ?? 1) * s);
    _m4.compose(_p4, _q4, _s4); _n3.getNormalMatrix(_m4);
    for (const cls in sub.b) {
      const a = sub.b[cls], k = this.b[cls] || (this.b[cls] = { p: [], n: [], c: [] });
      for (let i = 0; i < a.p.length; i += 3) {
        _v4.set(a.p[i], a.p[i + 1], a.p[i + 2]).applyMatrix4(_m4); k.p.push(_v4.x, _v4.y, _v4.z);
        _v4.set(a.n[i], a.n[i + 1], a.n[i + 2]).applyMatrix3(_n3).normalize(); k.n.push(_v4.x, _v4.y, _v4.z);
        k.c.push(a.c[i], a.c[i + 1], a.c[i + 2]);
      }
    }
    return this;
  }
}
function part(parent, name, b, x = 0, y = 0, z = 0, opt) {
  const g = b ? b.build(opt) : new THREE.Group();
  g.name = name; g.position.set(x, y, z); parent.add(g);
  return g;
}
const _tpl = new Map();
function stamp(key, make) {
  let t = _tpl.get(key);
  if (!t) { t = make(); _tpl.set(key, t); }
  return t.clone(true);
}
function randoBody(b) {
  const body = fillet([[0.0775, 0, 0.018], [0.0775, 0.245, 0.03], [-0.0775, 0.245, 0.062], [-0.0775, 0, 0.02]], 4);
  b.ex(body, 0.228, PAL.redDark, { cls: 'gloss', bevel: 0.012, bs: 1 });
  const flap = fillet([[0.05, 0.258, 0.005], [-0.089, 0.258, 0.068], [-0.089, 0.03, 0.006], [-0.06, 0.03, 0], [-0.06, 0.215, 0.03], [0.05, 0.215, 0]], 5);
  b.ex(flap, 0.246, PAL.red, { cls: 'gloss', bevel: 0.007, bs: 2 });
  b.sb(0.012, 0.05, 0.034, PAL.redDark, { x: -0.089, y: 0.03, z: 0, R: 0.004, r: 0.003, cls: 'gloss', cs: 1, es: 1 });
  b.sb(0.012, 0.03, 0.04, PAL.gold, { x: -0.092, y: 0.016, z: 0, R: 0.005, r: 0.004, cls: 'metal', cs: 1, es: 1 });
  for (const s of [1, -1]) {
    b.ball(0.011, PAL.chrome, { x: 0.01, y: 0.1, z: s * 0.117, sz: 0.5, ws: 6, hs: 4, cls: 'metal' });
    b.ball(0.009, PAL.gold, { x: -0.0895, y: 0.062, z: s * 0.088, sx: 0.5, ws: 6, hs: 4, cls: 'metal' });
  }
  b.tube([[0.062, 0.25, -0.03], [0.066, 0.272, -0.016], [0.066, 0.272, 0.016], [0.062, 0.25, 0.03]], 0.007, PAL.redDark, { cls: 'gloss', seg: 6, rad: 4 });
}
function randoStraps(b) {
  for (const s of [1, -1]) {
    b.ribbon([[0.066, 0.2, 0.05 * s], [0.1, 0.236, 0.058 * s], [0.146, 0.236, 0.064 * s], [0.188, 0.2, 0.066 * s], [0.208, 0.145, 0.068 * s], [0.2, 0.085, 0.08 * s], [0.16, 0.04, 0.094 * s], [0.08, 0.03, 0.1 * s]],
      0.017, 0.0065, (p) => [p.x - 0.135, p.y - 0.13, (p.z - 0.02 * s) * 0.6], PAL.red, { cls: 'gloss', seg: 14, rad: 6 });
  }
}
const CH = { hipY: 0.18, hipZ: 0.045, torsoY: 0.165, neckY: 0.185, shY: 0.158, shZ: 0.097, hx: 0.008, hy: 0.125, hr: 0.14 };
function buildChild() {
  const root = new THREE.Group();
  const pivot = part(root, 'pivot');
  const S = { cls: 'soft' };
  for (const [name, s] of [['legR', 1], ['legL', -1]]) {
    const b = new MB();
    b.cy(0.04, 0.048, 0.06, PAL.navyDark, { y: -0.014, seg: 10, ...S });
    b.pill(0.031, 0.06, PAL.skin, { y: -0.072, rs: 8, ...S, color2: PAL.skinShade });
    b.pill(0.0345, 0.036, PAL.white, { y: -0.125, rs: 8, ...S });
    b.cy(0.0355, 0.0355, 0.007, PAL.navy, { y: -0.097, seg: 8, open: true, ...S });
    b.ball(1, PAL.white, { x: 0.02, y: -CH.hipY + 0.027, sx: 0.054, sy: 0.027, sz: 0.037, ws: 10, hs: 6, ...S });
    part(pivot, name, b, 0, CH.hipY, s * CH.hipZ);
  }
  const torso = part(pivot, 'torso', null, 0, CH.torsoY, 0);
  {
    const b = new MB();
    b.rev([[0, 0], [0.062, 0], [0.09, 0.014], [0.097, 0.045], [0.093, 0.08]], PAL.navyDark, { ...S, sx: 0.8, seg: 16 });
    b.rev([[0.08, 0.074], [0.099, 0.066], [0.102, 0.076], [0.097, 0.115], [0.085, 0.152], [0.06, 0.182], [0.03, 0.197], [0, 0.2]], PAL.navy, { ...S, sx: 0.78, color2: PAL.navyDark, seg: 16 });
    b.tor(0.041, 0.014, PAL.white, { y: 0.189, rx: HP, sx: 0.85, sz: 0.62, rs: 5, ts: 12, ...S });
    for (const [y, x] of [[0.15, 0.068], [0.115, 0.077]]) b.ball(0.0075, PAL.yellow, { x, y, ws: 6, hs: 4, ...S });
    b.pb(0.006, 0.024, 0.03, PAL.white, { x: 0.068, y: 0.13, z: -0.04, ry: 0.45, ...S });
    torso.add(...b.build().children);
  }
  for (const [name, s] of [['armR', 1], ['armL', -1]]) {
    const b = new MB();
    b.ball(0.036, PAL.navy, { ws: 8, hs: 6, ...S });
    b.pill(0.031, 0.08, PAL.navy, { y: -0.056, rs: 8, ...S });
    b.cy(0.032, 0.032, 0.009, PAL.white, { y: -0.104, seg: 8, open: true, ...S });
    b.ball(0.035, PAL.skin, { y: -0.136, sy: 1.05, ws: 10, hs: 6, ...S });
    const arm = part(torso, name, b, 0, CH.shY, s * CH.shZ);
    if (s > 0) { const h = new THREE.Object3D(); h.name = 'hand'; h.position.set(0.012, -0.168, 0); arm.add(h); }
  }
  const head = part(torso, 'head', null, 0, CH.neckY, 0);
  const onHead = (yaw, pitch, k = 1) => [CH.hx + CH.hr * k * Math.cos(pitch) * Math.cos(yaw), CH.hy + CH.hr * 0.94 * k * Math.sin(pitch), CH.hr * 1.04 * k * Math.cos(pitch) * Math.sin(yaw)];
  {
    const b = new MB();
    b.ball(CH.hr, PAL.skin, { x: CH.hx, y: CH.hy, sy: 0.94, sz: 1.04, ws: 20, hs: 14, ...S });
    b.ball(0.14, PAL.hair, { x: -0.008, y: CH.hy + 0.012, sy: 0.95, sz: 1.03, ws: 16, hs: 10, ...S });
    b.geo(memo('bangs', () => new THREE.SphereGeometry(1, 20, 6, 0, TAU, 0, 1.08)), PAL.hair, { x: CH.hx, y: CH.hy, sx: 0.1432, sy: 0.1432 * 0.945, sz: 0.1432 * 1.04, rz: -0.34, ...S });
    b.ball(1, PAL.hair, { x: -0.07, y: 0.062, sx: 0.085, sy: 0.07, sz: 0.125, ws: 10, hs: 6, ...S });
    for (const s of [1, -1]) {
      b.ball(0.027, PAL.skin, { x: 0.004, y: 0.108, z: s * 0.144, sz: 0.55, ws: 6, hs: 4, ...S });
      b.ball(1, PAL.hair, { x: 0.034, y: 0.132, z: s * 0.127, sx: 0.028, sy: 0.058, sz: 0.022, ws: 8, hs: 6, rz: 0.15, ...S });
      const [x, y, z] = onHead(s * 0.66, -0.3, 0.985);
      b.ball(0.024, mix(PAL.pink, PAL.skin, 0.2), { x, y, z, sx: 0.3, ry: -s * 0.66, ws: 12, hs: 4, ...S });
    }
    head.add(...b.build().children);
  }
  {
    const ey = onHead(0.37, -0.1)[1];
    const b = new MB();
    for (const s of [1, -1]) {
      const [x, y, z] = onHead(s * 0.37, -0.1, 0.99);
      b.ball(0.0185, PAL.black, { x, y: y - ey, z, sx: 0.4, sy: 1.25, ry: -s * 0.37, ws: 10, hs: 6, cls: 'gloss' });
      const [hx2, hy2, hz2] = onHead(s * 0.37 - 0.035, -0.045, 1.035);
      b.ball(0.0055, PAL.white, { x: hx2, y: hy2 - ey, z: hz2, ws: 5, hs: 3, cls: 'gloss' });
    }
    part(head, 'eyes', b, 0, ey, 0, { cast: false });
    const m = new MB(), [mx, my] = onHead(0, -0.43, 0.985);
    m.ball(0.012, mix(PAL.redDark, PAL.hair, 0.35), { sx: 0.45, sy: 0.9, sz: 1.15, ws: 8, hs: 4, ...S });
    part(head, 'mouth', m, mx, my, 0, { cast: false });
  }
  const hatA = new THREE.Object3D(); hatA.name = 'hatAnchor'; hatA.position.set(CH.hx - 0.005, 0.186, 0); hatA.rotation.z = 0.07; head.add(hatA);
  const ranA = new THREE.Object3D(); ranA.name = 'randoAnchor'; ranA.position.set(-0.142, -0.027, 0); torso.add(ranA);
  {
    const b = new MB(), n0 = b.n('soft'), under = linear(PAL.yellowDark);
    b.rev([[0.128, -0.002], [0.162, -0.005], [0.167, -0.001], [0.162, 0.004], [0.144, 0.009], [0.1445, 0.022], [0.139, 0.046], [0.123, 0.069], [0.096, 0.086], [0.06, 0.097], [0.03, 0.101], [0, 0.102]],
      PAL.yellow, { ...S, seg: 24 });
    b.edit('soft', n0, (p, c, nn, i) => {
      const x = p[i], y = p[i + 1], z = p[i + 2], r = Math.hypot(x, z);
      if (y < -0.0015 || (y > 0.006 && y < 0.012)) setc(c, i, under);
      const t = clamp((r - 0.144) / 0.023, 0, 1);
      if (t > 0) {
        const f = Math.pow((1 + x / r) / 2, 2.2), k = (-0.005 + 0.062 * f) * t, s = (r + k) / r;
        p[i] = x * s; p[i + 2] = z * s; p[i + 1] = y - Math.max(0, k) * 0.38;
      }
    });
    b.ball(0.012, PAL.yellowDark, { y: 0.103, sy: 0.6, ws: 8, hs: 4, ...S });
    part(root, 'hat', b);
  }
  {
    const b = new MB(); randoBody(b); randoStraps(b);
    part(root, 'rando', b);
  }
  return root;
}
const SLEEP_HAT = { p: new THREE.Vector3(-0.6, FUTON_TOP + 0.004, 0.43), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.7, 0)) };
const SLEEP_RANDO = { p: new THREE.Vector3(-0.66, FUTON_TOP, -0.47), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 2.6, 0)) };
const POSE_KEYS = ['px', 'py', 'lean', 'roll', 'twist', 'bend', 'hy', 'nod', 'tilt', 'hx', 'aRf', 'aRo', 'aLf', 'aLo', 'lRf', 'lRo', 'lLf', 'lLo', 'eye', 'mouth'];
const _fm = new THREE.Matrix4(), _fp = new THREE.Vector3(), _fq = new THREE.Quaternion(), _fs = new THREE.Vector3();
const ease = (t) => t * t * (3 - 2 * t);
const wrapPi = (a) => a - TAU * Math.round(a / TAU);
export function createChild() {
  const g = stamp('child', buildChild);
  const P = (n) => g.getObjectByName(n);
  const pivot = P('pivot'), torso = P('torso'), head = P('head'), armR = P('armR'), armL = P('armL'), legR = P('legR'), legL = P('legL');
  const hat = P('hat'), rando = P('rando'), eyes = P('eyes'), mouth = P('mouth'), hatA = P('hatAnchor'), ranA = P('randoAnchor');
  for (const a of [armR, armL, legR, legL]) a.rotation.order = 'ZXY';
  for (const a of [pivot, torso, head]) a.rotation.order = 'YXZ';
  const W = { sleep: 0, idle: 1, slide: 0, happy: 0, late: 0 };
  const T = {}, A = {}, carried = [[hat, [pivot, torso, head, hatA], SLEEP_HAT], [rando, [pivot, torso, ranA], SLEEP_RANDO]];
  let init = false, aimW = 0, aimP = 0, face = 0, spd = 0, kickW = 0, ph = 0, eyeNow = 1, mvx = 1, mvz = 0;
  function anim(t, dt, st = {}) {
    dt = clamp(dt || 0, 0, 0.05);
    const mood = W[st.mood] != null ? st.mood : 'idle';
    const aim = st.aim || null, speed = st.speed || 0;
    if (!init) { for (const k in W) W[k] = k === mood ? 1 : 0; spd = speed; init = true; }
    let sum = 0;
    for (const k in W) { W[k] = damp(W[k], k === mood ? 1 : 0, mood === 'sleep' || k === 'sleep' ? 5 : 9, dt); sum += W[k]; }
    for (const k in W) W[k] /= sum;
    spd = damp(spd, speed, 6, dt);
    aimW = damp(aimW, aim ? 1 : 0, 14, dt);
    if (aim) { aimP = damp(aimP, clamp(aim.power, 0, 1), 16, dt); face += wrapPi(-(aim.ang || 0) - face) * (1 - Math.exp(-14 * dt)); }
    else if (kickW < 0.05) face = damp(wrapPi(face), 0, 3, dt);
    kickW = damp(kickW, clamp(st.kick || 0, 0, 1), 28, dt);
    const f = clamp(spd / 3, 0, 1), amp = 0.3 + 0.7 * f;
    ph += dt * (7 + 9 * f);
    const mv = (st.move || 0) + face; mvx = damp(mvx, Math.cos(mv), 8, dt); mvz = damp(mvz, Math.sin(mv), 8, dt);
    for (const k of POSE_KEYS) T[k] = 0;
    const add = (w, p) => { for (const k in p) T[k] += w * p[k]; };
    const look = Math.sin(t * 0.7) * 0.55 + Math.sin(t * 1.9 + 1) * 0.16;
    if (W.idle > 0.0005) add(W.idle, { py: 0.003 * Math.sin(t * 2.4), lean: 0.02 * Math.sin(t * 1.1), roll: 0.025 * Math.sin(t * 1.45 + 0.7), twist: look * 0.15, hy: look, nod: 0.03 * Math.sin(t * 0.9), tilt: 0.05 * Math.sin(t * 0.6),
      aRf: 0.08 * Math.sin(t * 1.3), aRo: 0.24 + 0.04 * Math.sin(t * 2), aLf: -0.08 * Math.sin(t * 1.3), aLo: 0.24 + 0.04 * Math.sin(t * 2 + 1), eye: 1, mouth: 0.3 });
    const L = 0.15 + 0.2 * f;
    if (W.slide > 0.0005) add(W.slide, { py: 0.012 + 0.012 * amp * Math.abs(Math.sin(ph)), lean: L * mvx, roll: -L * mvz + 0.05 * amp * Math.sin(ph * 0.5), bend: -0.06, hy: 0.22 * Math.sin(ph * 0.31), nod: -0.12, tilt: 0.06 * Math.sin(ph * 0.5),
      aRf: 1.45 + 1.05 * amp * Math.sin(ph), aRo: 1.05 + 0.3 * Math.sin(ph * 0.6 + 1), aLf: 1.45 + 1.05 * amp * Math.sin(ph + PI), aLo: 1.05 + 0.3 * Math.sin(ph * 0.6 + 2.5),
      lRf: 0.12 + 0.55 * amp * Math.sin(ph + PI), lRo: 0.14, lLf: 0.12 + 0.55 * amp * Math.sin(ph), lLo: 0.14, eye: 1.12, mouth: 1 });
    const hop = Math.abs(Math.sin(t * 5.5));
    if (W.happy > 0.0005) add(W.happy, { py: 0.055 * hop, lean: -0.03, roll: 0.05 * Math.sin(t * 5.5), hy: 0.15 * Math.sin(t * 2.7), nod: -0.22,
      aRf: PI - 0.1, aRo: 0.62 + 0.14 * Math.sin(t * 11), aLf: PI - 0.1, aLo: 0.62 + 0.14 * Math.sin(t * 11 + 1), lRf: 0.25 * hop, lRo: 0.16, lLf: -0.12 * hop, lLo: 0.16, eye: 0.16, mouth: 1.15 });
    if (W.late > 0.0005) add(W.late, { py: -0.004, lean: -0.03, roll: 0.02 * Math.sin(t * 0.8), bend: 0.3, nod: 0.26, aRf: 0.3 + 0.05 * Math.sin(t * 1.2), aRo: 0.06, aLf: 0.3 + 0.05 * Math.sin(t * 1.2 + 0.8), aLo: 0.06, lRf: 0.06, eye: 0.14, mouth: 0.14 });
    if (W.sleep > 0.0005) add(W.sleep, { px: -0.15, py: FUTON_TOP + 0.077, lean: HP, hx: 0.04, hy: 0.22, nod: 0.42, tilt: 0.08, aRf: 0.3, aRo: 2.25, aLf: -0.3, aLo: 1.2, lRf: -0.2, lRo: 0.42, lLf: -0.2, lLo: 0.22, eye: 0.1, mouth: 0.36 + 0.14 * Math.sin(t * 1.5) });
    if (aimW > 0.001) {
      const e = ease(aimP);
      A.lean = 0.05 + 0.13 * e; A.roll = 0; A.py = 0.012 * e; A.twist = -0.6 * e; A.bend = -0.06 * e; A.hy = 0.5 * e; A.nod = -0.04; A.tilt = 0;
      A.aRf = lerp(1.25, 3.8, e); A.aRo = 0.18 + 0.3 * e; A.aLf = 1.35 + 0.25 * e; A.aLo = 0.12; A.lRf = -0.32 * e; A.lRo = 0.1; A.lLf = 0.36 * e; A.lLo = 0.1; A.eye = 0.86; A.mouth = 0.14;
      for (const k in A) T[k] = lerp(T[k], A[k], aimW);
    }
    if (kickW > 0.001) {
      A.lean = 0.22; A.roll = 0; A.py = 0.02; A.twist = 0.4; A.bend = 0.5; A.hy = -0.2; A.nod = 0.08; A.tilt = 0;
      A.aRf = 1.6; A.aRo = 0.08; A.aLf = 1.15; A.aLo = 0.4; A.lRf = 0.75; A.lRo = 0.16; A.lLf = 0.5; A.lLo = 0.16; A.eye = 0.3; A.mouth = 0.95;
      for (const k in A) T[k] = lerp(T[k], A[k], kickW);
    }
    const sl = W.sleep;
    pivot.position.set(T.px, T.py + 0.1 * Math.sin(PI * sl) * (1 - sl), 0);
    pivot.rotation.set(T.roll, face * (1 - sl), T.lean);
    torso.rotation.set(0, T.twist, -T.bend);
    head.rotation.set(T.tilt, T.hy, -T.nod); head.position.x = T.hx;
    armR.rotation.set(-T.aRo, 0, T.aRf); armL.rotation.set(T.aLo, 0, T.aLf);
    legR.rotation.set(-T.lRo, 0, T.lRf); legL.rotation.set(T.lLo, 0, T.lLf);
    const blink = (t % 3.3) < 0.11 ? 0.12 : 1;
    eyeNow = damp(eyeNow, Math.min(T.eye, T.eye * blink + (1 - blink) * 0.1), 30, dt || 1);
    eyes.scale.set(1, clamp(eyeNow, 0.08, 1.3), 1);
    mouth.scale.set(1, clamp(T.mouth, 0.1, 1.3), 0.7 + 0.3 * clamp(T.mouth, 0, 1));
    const e = ease(clamp(sl, 0, 1));
    for (const [obj, chain, spot] of carried) {
      _fm.identity(); for (const o of chain) { o.updateMatrix(); _fm.multiply(o.matrix); }
      _fm.decompose(_fp, _fq, _fs);
      if (e > 0.001) { _fp.lerp(spot.p, e); _fp.y += Math.sin(PI * e) * 0.2; _fq.slerp(spot.q, e); }
      obj.position.copy(_fp); obj.quaternion.copy(_fq);
    }
  }
  g.userData.h = HEIGHTS.child; g.userData.kind = 'child';
  g.userData.hand = P('hand');
  g.userData.api = { setRando(on) { rando.visible = !!on; }, anim };
  anim(0, 0, { mood: 'idle' }); init = false;
  return g;
}
const CAT_R = 0.22, CAT = { hx: 0.128, hy: 0.198, ox: -0.004 };
const CATV = {
  chatora: { base: PAL.cat, dark: mix(PAL.catDark, PAL.woodRed, 0.5), pale: PAL.catPale, inner: PAL.pink, nose: PAL.pink, iris: PAL.yellow, lid: PAL.woodDark, collar: PAL.blue, pat: 'tabby' },
  kuro: { base: PAL.catBlack, ear: mix(PAL.catBlack, PAL.catGrey, 0.55), sheen: mix(PAL.catBlack, PAL.catGrey, 0.45), dark: PAL.catBlack, pale: mix(PAL.catBlack, PAL.catGrey, 0.32), inner: PAL.pink, nose: PAL.pink, iris: PAL.yellow, lid: PAL.catGrey, collar: PAL.red, pat: 'plain' },
  mike: { base: PAL.catWhite, dark: PAL.catBlack, pale: PAL.catWhite, inner: PAL.pink, nose: PAL.pink, iris: PAL.yellow, lid: PAL.woodDark, collar: PAL.yellow, pat: 'mike' },
  shiro: { base: PAL.catWhite, dark: PAL.catWhite, pale: PAL.catWhite, inner: PAL.pink, nose: PAL.pink, iris: PAL.sky, lid: PAL.brown, collar: PAL.red, pat: 'plain' },
  hachi: { base: PAL.catBlack, ear: mix(PAL.catBlack, PAL.catGrey, 0.55), dark: PAL.catBlack, pale: PAL.catWhite, inner: PAL.pink, nose: PAL.pink, iris: PAL.leafLight, lid: PAL.catGrey, collar: PAL.green, pat: 'hachi' },
};
function catCoat(V) {
  const base = linear(V.base), dark = linear(V.dark), pale = linear(V.pale), orange = linear(PAL.cat), out = [0, 0, 0];
  const set = (a, b, t) => { out[0] = a[0] + (b[0] - a[0]) * t; out[1] = a[1] + (b[1] - a[1]) * t; out[2] = a[2] + (b[2] - a[2]) * t; return out; };
  return (part, x, y, z) => {
    const hx = x - CAT.hx, hy = y - CAT.hy;
    if (V.pat === 'tabby') {
      if (part === 0 || part === 3) {
        const s = Math.max(sstep(0.45, 0.8, Math.cos((x + 0.012) * TAU / 0.058)) * (1 - sstep(0.0, 0.014, Math.abs(z) - 0.085 - (y - 0.1) * 0.6)), sstep(0.012, 0.004, Math.abs(z))) * sstep(0.1, 0.16, y) * (part === 3 ? 0 : 1);
        set(base, dark, s);
        const belly = Math.max(1 - sstep(0.02, 0.06, y), sstep(0.11, 0.15, x) * (1 - sstep(0.1, 0.17, y)));
        return set(out, pale, belly * 0.9);
      }
      if (part === 1) {
        const top = sstep(0.03, 0.055, hy) * (1 - sstep(0.03, 0.065, hx));
        const s = Math.max(sstep(0.008, 0.002, Math.abs(z)), sstep(0.008, 0.002, Math.abs(Math.abs(z) - 0.042))) * top;
        set(base, dark, s);
        return set(out, pale, sstep(0.05, 0.085, hx) * (1 - sstep(-0.025, 0.01, hy)));
      }
      if (part === 2 || part === 4) return set(pale, pale, 0);
      return set(base, base, 0);
    }
    const blob = (cx, cz, rx, rz) => 1 - sstep(0.75, 1.1, Math.hypot((x - cx) / rx, (z - cz) / rz));
    if (V.pat === 'mike') {
      if (part === 0 || part === 3) {
        const up = sstep(0.05, 0.1, y);
        set(base, orange, Math.max(blob(0.05, -0.05, 0.1, 0.1), blob(-0.15, 0.09, 0.06, 0.06)) * up);
        return set(out, dark, Math.max(blob(-0.09, 0.03, 0.075, 0.1), blob(0.07, 0.13, 0.05, 0.04)) * up);
      }
      if (part === 1) {
        const d1 = Math.hypot(hx + 0.015, hy - 0.05, z + 0.062), d2 = Math.hypot(hx + 0.02, hy - 0.055, z - 0.066);
        set(base, orange, 1 - sstep(0.062, 0.08, d1));
        return set(out, dark, 1 - sstep(0.055, 0.072, d2));
      }
      if (part === 5) return z < 0 ? set(orange, orange, 0) : set(dark, dark, 0);
      return set(base, base, 0);
    }
    if (V.pat === 'hachi') {
      if (part === 0 || part === 3) {
        const w = Math.max(1 - sstep(0.03, 0.055, y), sstep(0.1, 0.13, x) * (1 - sstep(0.1, 0.15, y + Math.abs(z) * 0.4)));
        return set(base, pale, w);
      }
      if (part === 1) return set(base, pale, sstep(0.015, 0.04, hx) * sstep(0, 0.014, 0.018 + Math.max(0, 0.04 - hy) * 0.95 - Math.abs(z)));
      if (part === 2 || part === 4) return set(pale, pale, 0);
      return set(base, base, 0);
    }
    if (V.pat === 'plain' && (part === 0 || part === 1)) return set(base, linear(V.sheen || V.base), part === 0 ? sstep(0.12, 0.2, y) * 0.5 : sstep(0.04, 0.08, hy) * 0.4);
    return set(base, base, 0);
  };
}
function catTailColor(V) {
  return (u) => {
    if (V.pat === 'tabby') return Math.round(u * 12) % 3 === 1 || u > 0.93 ? V.dark : V.base;
    if (V.pat === 'mike') return u < 0.4 ? PAL.catBlack : u < 0.75 ? PAL.cat : PAL.catBlack;
    if (V.pat === 'hachi') return u > 0.86 ? V.pale : V.base;
    return V.base;
  };
}
const TN = 13, TM = 8;
function tailGeo(colorAt) {
  const nv = TN * TM + 1, col = new Float32Array(nv * 3), idx = [];
  for (let i = 0; i < TN; i++) { const c = linear(colorAt(i / (TN - 1))); for (let j = 0; j < TM; j++) col.set(c, (i * TM + j) * 3); }
  col.set(linear(colorAt(1)), TN * TM * 3);
  for (let i = 0; i < TN - 1; i++) for (let j = 0; j < TM; j++) { const a = i * TM + j, b = i * TM + (j + 1) % TM; idx.push(a, b, a + TM, b, b + TM, a + TM); }
  for (let j = 0; j < TM; j++) idx.push((TN - 1) * TM + j, (TN - 1) * TM + (j + 1) % TM, TN * TM);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(-0.1, 0.15, 0), 0.6);
  return g;
}
function tailShape(g, pts, rad) {
  const pos = g.attributes.position.array, nor = g.attributes.normal.array;
  let nx = 0, ny = 1, nz = 0, tx = 0, ty = 0, tz = 0;
  for (let i = 0; i < TN; i++) {
    const a = Math.max(0, i - 1) * 3, b = Math.min(TN - 1, i + 1) * 3;
    tx = pts[b] - pts[a]; ty = pts[b + 1] - pts[a + 1]; tz = pts[b + 2] - pts[a + 2];
    const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    let d = nx * tx + ny * ty + nz * tz; nx -= tx * d; ny -= ty * d; nz -= tz * d;
    let nl = Math.hypot(nx, ny, nz);
    if (nl < 1e-3) { nx = 0; ny = 0; nz = 1; d = tz; nx -= tx * d; ny -= ty * d; nz -= tz * d; nl = Math.hypot(nx, ny, nz) || 1; }
    nx /= nl; ny /= nl; nz /= nl;
    const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx, r = rad[i];
    for (let j = 0; j < TM; j++) {
      const an = j / TM * TAU, c = Math.cos(an), s = Math.sin(an), k = (i * TM + j) * 3;
      const ox = c * nx + s * bx, oy = c * ny + s * by, oz = c * nz + s * bz;
      pos[k] = pts[i * 3] + ox * r; pos[k + 1] = pts[i * 3 + 1] + oy * r; pos[k + 2] = pts[i * 3 + 2] + oz * r;
      nor[k] = ox; nor[k + 1] = oy; nor[k + 2] = oz;
    }
  }
  const k = TN * TM * 3, e = (TN - 1) * 3, r = rad[TN - 1];
  pos[k] = pts[e] + tx * r; pos[k + 1] = pts[e + 1] + ty * r; pos[k + 2] = pts[e + 2] + tz * r; nor[k] = tx; nor[k + 1] = ty; nor[k + 2] = tz;
  g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true;
}
const _tp = new Float32Array(TN * 3), _tr = new Float32Array(TN);
function tailPose(g, t, wUp, wFlow) {
  const wRest = Math.max(0, 1 - wUp - wFlow);
  for (let i = 0; i < TN; i++) {
    const u = i / (TN - 1), a = PI - 0.1 - u * 1.62, flick = Math.sin(t * 1.3) > 0.82 ? Math.sin(t * 9) * 0.012 * u * u : 0;
    const out = 1 + 0.32 * Math.pow(Math.max(0, (u - 0.55) / 0.45), 2);
    const rx = 0.2 * Math.cos(a) * (0.5 + 0.5 * out) - 0.014, ry = 0.034 - 0.006 * u + flick, rz = 0.162 * Math.sin(a) * out;
    const ux = -0.185 - 0.035 * u + 0.02 * Math.sin(u * 3), uy = 0.07 + 0.31 * u, uz = 0.01 * Math.sin(t * 40) * u;
    const fx = -0.185 - 0.27 * u, fy = 0.07 + 0.05 * Math.sin(u * 2.6), fz = 0.035 * Math.sin(t * 9 - u * 4) * u;
    _tp[i * 3] = rx * wRest + ux * wUp + fx * wFlow; _tp[i * 3 + 1] = ry * wRest + uy * wUp + fy * wFlow; _tp[i * 3 + 2] = rz * wRest + uz * wUp + fz * wFlow;
    _tr[i] = (0.024 - 0.008 * u) * (1 + wUp * (0.5 + 0.7 * Math.sin(u * PI)));
  }
  tailShape(g, _tp, _tr);
}
function buildCat(variant) {
  const V = CATV[variant] || CATV.chatora, coat = catCoat(V);
  const inner = new THREE.Group(); inner.name = 'inner';
  const body = part(inner, 'body', null, CAT.ox, 0, 0);
  const b = new MB(), M = 'matte';
  const paint = (code, from) => b.edit(M, from, (p, c, nn, i) => setc(c, i, coat(code, p[i], p[i + 1], p[i + 2])));
  let n0 = b.n(M);
  const BX = -0.02, BY = 0.1, PW = 2.7;
  b.geo(sphGeo(18, 26), V.base, { rz: -HP });
  b.edit(M, n0, (p, c, nn, i) => {
    let u = p[i], v = p[i + 1], w = p[i + 2];
    const k = Math.pow(Math.pow(Math.abs(u), PW) + Math.pow(Math.abs(v), PW) + Math.pow(Math.abs(w), PW), -1 / PW);
    u *= k; v *= k; w *= k;
    const sz = 0.134 * (1 - 0.1 * u), sy = 0.1 * (1 - 0.05 * u);
    p[i] = BX + u * 0.178; p[i + 1] = Math.max(0.002, BY + v * sy); p[i + 2] = w * sz;
    const nx = Math.sign(u) * Math.pow(Math.abs(u), PW - 1) / 0.178, ny = Math.sign(v) * Math.pow(Math.abs(v), PW - 1) / sy, nz = Math.sign(w) * Math.pow(Math.abs(w), PW - 1) / sz, nl = Math.hypot(nx, ny, nz) || 1;
    nn[i] = nx / nl; nn[i + 1] = ny / nl; nn[i + 2] = nz / nl;
  });
  paint(0, n0);
  n0 = b.n(M);
  for (const s of [1, -1]) b.ball(1, V.base, { x: -0.075, y: 0.06, z: s * 0.122, sx: 0.085, sy: 0.06, sz: 0.04, ws: 10, hs: 6 });
  paint(3, n0);
  n0 = b.n(M);
  for (const s of [1, -1]) b.ball(1, V.pale, { x: 0.166, y: 0.021, z: s * 0.052, sx: 0.045, sy: 0.021, sz: 0.032, ws: 10, hs: 6 });
  b.ball(1, V.pale, { x: 0.125, y: 0.08, sx: 0.055, sy: 0.062, sz: 0.09, ws: 10, hs: 6 });
  paint(2, n0);
  n0 = b.n(M);
  b.geo(sphGeo(20, 16), V.base, { x: CAT.hx, y: CAT.hy, rx: HP, sx: 0.095, sy: 0.11, sz: 0.086 });
  paint(1, n0);
  n0 = b.n(M);
  for (const s of [1, -1]) b.ball(1, V.pale, { x: CAT.hx + 0.04, y: CAT.hy - 0.04, z: s * 0.066, sx: 0.04, sy: 0.034, sz: 0.04, ws: 8, hs: 6 });
  b.ball(1, V.pale, { x: CAT.hx + 0.08, y: CAT.hy - 0.036, sx: 0.03, sy: 0.026, sz: 0.044, ws: 8, hs: 6 });
  paint(4, n0);
  b.ball(0.012, V.nose, { x: CAT.hx + 0.108, y: CAT.hy - 0.022, sy: 0.75, ws: 6, hs: 4 });
  for (const s of [1, -1]) for (const k of [0, 1]) b.pb(0.056, 0.0016, 0.0016, PAL.white, { x: CAT.hx + 0.084, y: CAT.hy - 0.032 - k * 0.012, z: s * 0.068, ry: -s * (0.9 + k * 0.25), rz: (k ? -0.12 : 0.1) });
  b.tor(0.0975, 0.019, V.collar, { x: 0.094, y: 0.1575, rx: -1.0385, ry: HP, sz: 1.35, rs: 5, ts: 16 });
  body.add(...b.build().children);
  {
    const g = new MB();
    g.ball(0.023, PAL.gold, { x: 0.033, y: -0.046, ws: 8, hs: 6, cls: 'gloss' });
    g.pb(0.005, 0.007, 0.026, PAL.woodDark, { x: 0.053, y: -0.054, rz: 0.5, cls: 'gloss' });
    g.cy(0.006, 0.006, 0.03, PAL.gold, { x: 0.014, y: -0.018, rz: 0.62, seg: 5, open: true, cls: 'gloss' });
    part(body, 'bell', g, 0.178, 0.108, 0);
  }
  {
    const e = new MB(), cone = memo('catEar', () => new THREE.ConeGeometry(1, 1, 8, 1));
    let n1 = e.n(M);
    for (const s of [1, -1]) e.geo(cone, V.base, { x: 0, y: 0.038, z: s * 0.068, sx: 0.024, sy: 0.1, sz: 0.048, rx: s * 0.32 });
    const earCol = V.ear ? linear(V.ear) : null;
    e.edit(M, n1, (p, c, nn, i) => setc(c, i, earCol || coat(5, p[i] + CAT.hx, p[i + 1] + CAT.hy + 0.06, p[i + 2])));
    for (const s of [1, -1]) e.geo(cone, V.inner, { x: 0.012, y: 0.032, z: s * 0.0675, sx: 0.02, sy: 0.08, sz: 0.037, rx: s * 0.32 });
    part(body, 'ears', e, CAT.hx - 0.006, CAT.hy + 0.064, 0);
  }
  const eyeAt = (s, k = 1, pit = 0.1) => { const yaw = s * 0.52; return [0.095 * k * Math.cos(pit) * Math.cos(yaw), 0.086 * k * Math.sin(pit), 0.11 * k * Math.cos(pit) * Math.sin(yaw)]; };
  const UP = 0.3;
  {
    const c = new MB(), o = new MB();
    for (const s of [1, -1]) {
      const [x, y, z] = eyeAt(s, 1.0);
      c.tor(0.017, 0.004, V.lid, { x, y: y + 0.007, z, rz: PI, ry: HP - s * 0.52, rs: 4, ts: 8, arc: PI });
      const [ix, iy, iz] = eyeAt(s, 0.99, UP);
      o.ball(0.033, V.iris, { x: ix, y: iy, z: iz, sx: 0.42, ry: -s * 0.52, rz: UP, ws: 10, hs: 6, cls: 'gloss' });
      const [px, py, pz] = eyeAt(s, 1.085, UP);
      o.ball(0.021, PAL.black, { x: px, y: py, z: pz, sx: 0.3, ry: -s * 0.52, rz: UP, ws: 8, hs: 4, cls: 'gloss' });
      const [qx, qy, qz] = eyeAt(s * 0.9, 1.15, UP);
      o.ball(0.006, PAL.white, { x: qx, y: qy + 0.01, z: qz, ws: 5, hs: 3, cls: 'gloss' });
    }
    part(body, 'eyesC', c, CAT.hx, CAT.hy, 0, { cast: false });
    part(body, 'eyesO', o, CAT.hx, CAT.hy, 0, { cast: false }).visible = false;
  }
  {
    const sp = new MB(), cone = memo('catSpike', () => new THREE.ConeGeometry(1, 1, 5, 1));
    const col = V.pat === 'tabby' ? V.dark : V.base;
    for (let i = 0; i < 7; i++) {
      const x = -0.165 + i * 0.036, y = 0.1 + 0.1 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x + 0.02) / 0.178, 2.7)), 1 / 2.7);
      sp.geo(cone, col, { x, y: y + 0.014, sx: 0.017, sy: 0.055, sz: 0.017, rz: 0.35 - i * 0.06 });
      if (i % 2 === 0) for (const s of [1, -1]) sp.geo(cone, col, { x: x + 0.016, y: y - 0.012, z: s * 0.05, sx: 0.014, sy: 0.04, sz: 0.014, rz: 0.3, rx: s * 0.5 });
    }
    for (const s of [1, -1]) sp.geo(cone, V.pat === 'hachi' || V.pat === 'tabby' ? V.pale : V.base, { x: CAT.hx + 0.03, y: CAT.hy - 0.045, z: s * 0.108, sx: 0.015, sy: 0.045, sz: 0.015, rx: s * 1.5 });
    const g = part(body, 'spikes', sp, 0, 0, 0, { cast: false }); g.visible = false;
  }
  const tg = tailGeo(catTailColor(V)); tailPose(tg, 0, 0, 0);
  const tail = new THREE.Mesh(tg, MATS.matte); tail.name = 'tail'; tail.castShadow = true; tail.receiveShadow = true;
  body.add(tail);
  return inner;
}
function catAnim(inner) {
  const body = inner.getObjectByName('body'), ears = inner.getObjectByName('ears'), eyesC = inner.getObjectByName('eyesC'), eyesO = inner.getObjectByName('eyesO');
  const spikes = inner.getObjectByName('spikes'), tail = inner.getObjectByName('tail'), bell = inner.getObjectByName('bell');
  tail.geometry = tail.geometry.clone();
  tail.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(-0.1, 0.15, 0), 0.6);
  let sur = 0, sp = 0;
  return (t, dt, st = {}) => {
    dt = clamp(dt || 0, 0, 0.05);
    const s1 = clamp(st.surprised || 0, 0, 1);
    sur = damp(sur, s1, s1 > sur ? 30 : 5, dt);
    sp = damp(sp, clamp((st.speed || 0) / 1.2, 0, 1), 6, dt);
    const br = Math.sin(t * 1.8) * 0.012;
    body.scale.set(1 + sur * 0.04, 1 + br + sur * 0.16, 1 + sur * 0.08 - br * 0.3);
    body.position.y = sur * 0.012 + Math.abs(Math.sin(t * 46)) * 0.006 * sur;
    const open = Math.max(sur, sp * 0.85);
    eyesO.visible = open > 0.12; eyesC.visible = !eyesO.visible;
    if (eyesO.visible) { const k = 0.55 + 0.5 * open + 0.12 * sur; eyesO.scale.set(1, k, k); }
    spikes.visible = sur > 0.03; if (spikes.visible) spikes.scale.setScalar(0.3 + 0.7 * sur);
    const twitch = Math.sin(t * 0.9 + 2) > 0.96 ? Math.sin(t * 30) * 0.12 : 0;
    ears.rotation.z = 0.3 + sp * (1 - sur) * 0.75 - sur * 0.3 + twitch;
    const sw = sp + sur * 0.8;
    bell.rotation.set(Math.sin(t * 13) * 0.45 * sw, 0, (0.14 + Math.cos(t * 9) * 0.24) * sw);
    ears.scale.set(1, 1 - 0.25 * sp * (1 - sur) + 0.12 * sur, 1 + 0.1 * sur);
    tailPose(tail.geometry, t, sur, sp * (1 - sur));
  };
}
const ITEMS = {
  keshi(b) {
    b.sb(0.128, 0.046, 0.064, PAL.white, { b: 0, R: 0.014, r: 0.012, rb: 0.008, cls: 'soft', color2: PAL.cream, cs: 3 });
    b.sb(0.074, 0.049, 0.067, PAL.blue, { x: 0.02, b: -0.0005, R: 0.008, r: 0.006, rb: 0.004, cls: 'matte' });
    b.sb(0.012, 0.0496, 0.0676, PAL.white, { x: -0.001, b: -0.0006, R: 0.008, r: 0.006, rb: 0.004, cls: 'matte', cs: 1, es: 1 });
    b.sb(0.012, 0.0496, 0.0676, PAL.navy, { x: -0.014, b: -0.0006, R: 0.008, r: 0.006, rb: 0.004, cls: 'matte', cs: 1, es: 1 });
    return 0.05;
  },
  kutsu(b) {
    const sock = (s) => {
      s.cy(0.027, 0.027, 0.08, PAL.white, { z: -0.03, rx: HP, seg: 12 });
      s.cy(0.0295, 0.0295, 0.02, PAL.red, { z: -0.064, rx: HP, seg: 12 });
      for (const z of [-0.044, -0.022, 0]) s.cy(0.0278, 0.0278, 0.01, PAL.navy, { z, rx: HP, seg: 12, open: true });
      s.ball(0.0305, PAL.red, { x: -0.001, z: 0.019, rx: HP, ws: 12, hs: 6 });
      s.cy(0.027, 0.027, 0.05, PAL.white, { x: 0.028, z: 0.02, rz: HP, seg: 12, open: true });
      for (const x of [0.022, 0.042]) s.cy(0.0278, 0.0278, 0.01, PAL.navy, { x, z: 0.02, rz: HP, seg: 12, open: true });
      s.ball(0.0285, PAL.red, { x: 0.056, z: 0.02, rz: HP, sy: 1.2, ws: 12, hs: 6 });
    };
    b.put(sock, { x: -0.052, y: 0.0125, z: 0.012, sy: 0.44, ry: 0.1 });
    b.put(sock, { x: 0.004, y: 0.016, z: 0.03, sy: 0.44, ry: -0.08 });
    return 0.03;
  },
  toast(b) {
    const base = fillet([[-0.068, -0.078, 0.02], [0.068, -0.078, 0.02], [0.068, 0.03, 0], [-0.068, 0.03, 0]], 3);
    const out = base.slice(0, base.length - 1);
    const lobe = (cx, a0, a1) => { for (let k = 0; k <= 6; k++) { const a = lerp(a0, a1, k / 6); out.push([cx + Math.cos(a) * 0.04, 0.044 + Math.sin(a) * 0.038]); } };
    lobe(0.04, -0.35, 1.9); lobe(-0.04, PI - 1.9, PI + 0.35);
    out.push(base[base.length - 1]);
    b.ex(out, 0.03, PAL.toastCrust, { rx: -HP, y: 0.015, bevel: 0.007, bs: 2, cls: 'soft', deg: 60 });
    const n0 = b.n('soft'), edge = linear(mix(PAL.toast, PAL.cream, 0.55)), gold = linear(PAL.toast), brown = linear(mix(PAL.toast, PAL.toastCrust, 0.55));
    b.geo(ringFillGeo(out.map(([x, y]) => [x, -y]), [0.93, 0.84, 0.66, 0.4, 0]), PAL.toast, { y: 0.0305, cls: 'soft' });
    b.edit('soft', n0, (p, c, nn, i) => {
      const s = Math.max(Math.abs(p[i]) / 0.07, Math.abs(p[i + 2] + 0.0) / 0.08);
      setc(c, i, s > 0.88 ? edge : gold); if (s < 0.88) mixc(c, i, brown, 1 - sstep(0.3, 0.78, s) * 0.85);
      p[i + 1] += (1 - s) * 0.0015;
    });
    b.ball(1, mix(PAL.butter, PAL.toast, 0.25), { x: 0.004, y: 0.0325, z: 0.012, sx: 0.036, sy: 0.003, sz: 0.032, ws: 12, hs: 6, cls: 'gloss' });
    b.sb(0.036, 0.013, 0.036, PAL.butter, { x: 0.002, b: 0.032, z: 0.01, ry: 0.5, R: 0.006, r: 0.005, cls: 'gloss' });
    return 0.045;
  },
  sumaho(b) {
    b.sb(0.076, 0.013, 0.152, PAL.black, { b: 0, R: 0.016, r: 0.005, rb: 0.005, cls: 'gloss', cs: 3 });
    b.geo(softBoxGeo(0.066, 0.142, 0.001, 0.011, 0, 0, 3, 1), PAL.sky, { y: 0.0133, rx: -HP, cls: 'glow', color2: PAL.pinkPale });
    b.geo(softBoxGeo(0.034, 0.014, 0.001, 0.006, 0, 0, 2, 1), PAL.white, { y: 0.0138, z: -0.04, rx: -HP, cls: 'glow' });
    b.geo(softBoxGeo(0.022, 0.005, 0.001, 0.002, 0, 0, 1, 1), PAL.white, { y: 0.0138, z: -0.026, rx: -HP, cls: 'glow' });
    for (const z of [0.012, 0.036]) b.geo(softBoxGeo(0.054, 0.018, 0.001, 0.005, 0, 0, 2, 1), lt(PAL.skyPale, 0.5), { y: 0.0138, z, rx: -HP, cls: 'glow' });
    b.geo(softBoxGeo(0.024, 0.003, 0.001, 0.0014, 0, 0, 1, 1), PAL.white, { y: 0.0138, z: 0.064, rx: -HP, cls: 'glow' });
    b.pb(0.003, 0.004, 0.022, PAL.charcoal, { x: 0.038, y: 0.007, z: -0.03, cls: 'gloss' });
    return 0.014;
  },
  kyoka(b) {
    const G = PAL.green, GD = dk(PAL.green, 0.25);
    b.sb(0.152, 0.026, 0.208, PAL.paper, { x: 0.004, b: 0.004, R: 0.004, r: 0.002, cls: 'matte', color2: PAL.linen, cs: 1, es: 1 });
    b.sb(0.164, 0.005, 0.218, G, { b: 0, R: 0.008, r: 0.002, cls: 'soft' });
    b.sb(0.164, 0.006, 0.218, G, { b: 0.029, R: 0.008, r: 0.003, cls: 'soft' });
    b.sb(0.016, 0.035, 0.218, GD, { x: -0.076, b: 0, R: 0.007, r: 0.006, rb: 0.006, cls: 'soft' });
    b.sb(0.126, 0.0012, 0.03, mix(PAL.green, PAL.leafLight, 0.6), { x: 0.014, b: 0.0348, z: 0.086, R: 0.004, r: 0, cls: 'soft', cs: 1, es: 1 });
    b.sb(0.092, 0.0016, 0.05, PAL.paper, { x: 0.012, b: 0.0348, z: -0.056, R: 0.007, r: 0, cls: 'soft' });
    b.pb(0.066, 0.0006, 0.009, PAL.navy, { x: 0.012, y: 0.0367, z: -0.062 });
    b.pb(0.04, 0.0006, 0.005, PAL.fabricGrey, { x: 0.0, y: 0.0367, z: -0.046 });
    b.cy(0.021, 0.021, 0.0014, PAL.yellow, { x: 0.035, y: 0.0356, z: 0.022, seg: 16, cls: 'soft' });
    b.geo(memo('tri3', () => new THREE.CylinderGeometry(0.02, 0.02, 0.0014, 3)), PAL.red, { x: -0.022, y: 0.0356, z: 0.01, ry: 0.5, cls: 'soft' });
    b.sb(0.03, 0.0014, 0.03, PAL.white, { x: -0.002, b: 0.0349, z: 0.045, R: 0.004, r: 0, ry: 0.3, cls: 'soft', cs: 1, es: 1 });
    return 0.036;
  },
  suito(b) {
    const C = PAL.teal;
    b.put((s) => {
      s.rev([[0, 0], [0.03, 0], [0.037, 0.007], [0.037, 0.112], [0.034, 0.126], [0.03, 0.131]], lt(PAL.chrome, 0.12), { cls: 'gloss', seg: 20, color2: PAL.steel });
      for (const y of [0.05, 0.057]) s.cy(0.0373, 0.0373, 0.002, PAL.steel, { y, seg: 20, cls: 'gloss' });
      s.cy(0.0378, 0.0378, 0.012, C, { y: 0.016, seg: 20, cls: 'soft' });
      s.rev([[0.03, 0.127], [0.0385, 0.131], [0.0385, 0.16], [0.034, 0.172], [0.022, 0.177], [0, 0.178]], C, { cls: 'soft', seg: 20 });
      s.cy(0.0392, 0.0392, 0.006, dk(C, 0.2), { y: 0.136, seg: 20, cls: 'soft' });
      s.tor(0.014, 0.0045, dk(C, 0.2), { y: 0.18, rs: 5, ts: 12, arc: PI, cls: 'soft' });
    }, { rz: -HP, x: -0.09, y: 0.0385 });
    b.tube([[0.05, 0.03, 0.036], [0.04, 0.008, 0.075], [0.0, 0.006, 0.098], [-0.05, 0.007, 0.082], [-0.074, 0.03, 0.036]], 0.0045, C, { seg: 14, rad: 5 });
    for (const x of [0.05, -0.074]) b.ball(0.007, PAL.steelDark, { x, y: 0.032, z: 0.035, ws: 6, hs: 4, cls: 'metal' });
    return 0.078;
  },
  rando(b) {
    b.put((s) => {
      s.put(randoBody, { rz: -HP, x: -0.125, y: 0.0775 });
      for (const k of [1, -1]) s.ribbon([[0.105, 0.03, 0.07 * k], [0.09, 0.009, 0.138 * k], [0.02, 0.008, 0.158 * k], [-0.06, 0.008, 0.148 * k], [-0.1, 0.03, 0.1 * k]], 0.015, 0.0065, () => [0, 1, 0], PAL.red, { cls: 'gloss', seg: 12, rad: 6 });
    }, { ry: HP });
    return 0.17;
  },
};
export function createItem(id) {
  const g = stamp('item|' + id, () => {
    const b = new MB(), h = (ITEMS[id] || ITEMS.keshi)(b);
    const t = b.build(); t.userData.h = h; t.userData.item = id;
    return t;
  });
  return g;
}
const BOOKS = [PAL.red, PAL.navy, PAL.blue, PAL.sky, PAL.yellow, PAL.orange, PAL.green, PAL.teal, PAL.cream, PAL.pink, PAL.purple, PAL.woodRed, PAL.fabricGreen, PAL.white, PAL.navyDark, PAL.mint];
const FABRICS = [PAL.fabricGreen, mix(PAL.mustard, PAL.cream, 0.35), PAL.fabricBlue, mix(PAL.terracotta, PAL.cream, 0.4), PAL.fabricBlueDark];
const ACCENTS = [PAL.yellow, PAL.red, PAL.cream, PAL.teal, PAL.orange, PAL.pink];
const WARM = mix(PAL.butter, PAL.white, 0.45);
const leafGeo = (lo) => memo(lo ? 'leafLo' : 'leaf', () => {
  const nu = lo ? 3 : 6, nv = lo ? 2 : 4, pos = [], idx = [];
  for (let iu = 0; iu <= nu; iu++) for (let iv = 0; iv <= nv; iv++) {
    const u = iu / nu, v = iv / nv * 2 - 1, w = Math.pow(Math.sin(PI * Math.pow(u, 0.72)), 0.8);
    pos.push(u, 0.17 * Math.abs(v) * w - 0.24 * u * u, v * 0.5 * w);
  }
  for (let iu = 0; iu < nu; iu++) for (let iv = 0; iv < nv; iv++) { const a = iu * (nv + 1) + iv, c = a + nv + 1; idx.push(a, a + 1, c, a + 1, c + 1, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const t = g.toNonIndexed(), p = t.attributes.position.array, n = t.attributes.normal.array, P2 = [], N2 = [];
  for (let i = 0; i < p.length; i += 9) {
    for (let k = 0; k < 9; k++) { P2.push(p[i + k]); N2.push(n[i + k]); }
    for (const k of [0, 6, 3]) { P2.push(p[i + k], p[i + k + 1], p[i + k + 2]); N2.push(-n[i + k], -n[i + k + 1], -n[i + k + 2]); }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(P2, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(N2, 3));
  return out;
});
const P = {
  stack(b, x, y, z, rnd, n = 3, s = 1) {
    for (let i = 0; i < n; i++) {
      const w = (0.15 + rnd() * 0.04) * s, d = (0.2 + rnd() * 0.04) * s, h = (0.022 + rnd() * 0.012) * s, ry = (rnd() - 0.5) * 0.5;
      b.sb(w, h, d, pick(rnd, BOOKS), { x, b: y, z, ry, R: 0.006, r: 0.003, cs: 1, es: 1, cls: 'soft' });
      b.pb(w - 0.008, h * 0.5, d + 0.002, PAL.paper, { x, y: y + h / 2, z, ry });
      y += h;
    }
    return y;
  },
  row(b, x0, x1, y, zFront, depth, hMax, rnd, top, face = 1) {
    let x = x0 + 0.004;
    const k = clamp((x1 - x0) / 0.95, 1, 3.2);
    while (x < x1 - 0.028) {
      if (rnd() < 0.1) { x += (0.02 + rnd() * 0.05) * k; continue; }
      const th = Math.min((0.022 + rnd() * 0.03) * k, x1 - x - 0.002), h = hMax * (0.66 + rnd() * 0.32), d = depth * (0.8 + rnd() * 0.18), z = zFront - face * (d / 2 + 0.008);
      b.pb(th, h, d, pick(rnd, BOOKS), { x: x + th / 2, b: y, z });
      if (top) b.pb(th * 0.56, 0.003, d * 0.94, PAL.paper, { x: x + th / 2, b: y + h, z });
      x += th + 0.0025;
    }
  },
  cup(b, x, y, z, col, tea = mix(PAL.leafLight, PAL.yellow, 0.35), s = 1) {
    b.cy(0.03 * s, 0.024 * s, 0.055 * s, col, { x, b: y, z, seg: 12, cls: 'gloss' });
    b.cy(0.025 * s, 0.025 * s, 0.002, tea, { x, b: y + 0.0545 * s, z, seg: 12, cls: 'gloss' });
  },
  flowers(b, x, y, z, s, rnd, cols = [PAL.red, PAL.yellow, PAL.pink, PAL.white, PAL.orange]) {
    b.rev([[0, 0], [0.022, 0], [0.034, 0.022], [0.03, 0.055], [0.017, 0.08], [0.021, 0.095]].map(([r, h]) => [r * s, y + h * s]), PAL.white, { x, z, cls: 'gloss', seg: 12, color2: PAL.skyPale });
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1 + rnd() * 1.2, lean = 0.15 + rnd() * 0.3, len = (0.1 + rnd() * 0.06) * s, y0 = y + 0.085 * s;
      const tx = x + Math.cos(a) * Math.sin(lean) * len, tz = z + Math.sin(a) * Math.sin(lean) * len, ty = y0 + Math.cos(lean) * len;
      b.tube([[x, y0, z], [(x * 0.6 + tx * 0.4), y0 + (ty - y0) * 0.5, (z * 0.6 + tz * 0.4)], [tx, ty, tz]], 0.0035 * s, PAL.leaf, { seg: 4, rad: 4 });
      b.ball(0.024 * s, pick(rnd, cols), { x: tx, y: ty, z: tz, sy: 0.72, ws: 8, hs: 6, cls: 'soft' });
      b.ball(0.009 * s, PAL.yellowDark, { x: tx, y: ty + 0.013 * s, z: tz, ws: 6, hs: 4 });
    }
  },
  pot(b, x, y, z, s, rnd, potCol = PAL.white) {
    b.cy(0.045 * s, 0.034 * s, 0.07 * s, potCol, { x, b: y, z, seg: 12, cls: 'gloss' });
    b.cy(0.04 * s, 0.04 * s, 0.004, PAL.soil, { x, b: y + 0.068 * s, z, seg: 12 });
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4 + rnd() * 0.5, t = 0.25 + i * 0.13, len = (0.13 - i * 0.006) * s;
      b.geo(leafGeo(true), pick(rnd, [PAL.leaf, PAL.leafLight, PAL.green]), { x, y: y + (0.07 + i * 0.006) * s, z, ry: -a, rz: t, sx: len, sy: len, sz: len * 0.6, cls: 'soft' });
    }
  },
  frame(b, x, y, z, ry = 0, col = PAL.woodLight) {
    b.put((s) => {
      s.sb(0.11, 0.14, 0.014, col, { b: 0, R: 0.006, r: 0.004, cs: 1, es: 1, cls: 'soft' });
      s.pb(0.084, 0.11, 0.002, PAL.skyPale, { y: 0.07, z: 0.0075 });
      s.pb(0.084, 0.04, 0.0024, PAL.leafLight, { y: 0.035, z: 0.0076 });
      s.cy(0.014, 0.014, 0.0026, PAL.yellow, { x: 0.018, y: 0.095, z: 0.0076, rx: HP, seg: 10 });
      s.pb(0.012, 0.1, 0.012, col, { y: 0.045, z: -0.03, rx: -0.5 });
    }, { x, y, z, ry, rx: -0.2 });
  },
  clock(b, x, y, z, ry = 0, col = PAL.red) {
    b.put((s) => {
      s.cy(0.045, 0.045, 0.035, col, { y: 0.055, rx: HP, seg: 16, cls: 'gloss' });
      s.cy(0.037, 0.037, 0.002, PAL.white, { y: 0.055, z: 0.018, rx: HP, seg: 16 });
      s.pb(0.004, 0.024, 0.002, PAL.black, { y: 0.064, z: 0.0195 }); s.pb(0.018, 0.004, 0.002, PAL.black, { x: 0.007, y: 0.055, z: 0.0195 });
      for (const k of [1, -1]) { s.ball(0.016, PAL.gold, { x: k * 0.028, y: 0.1, sy: 0.7, ws: 8, hs: 6, cls: 'metal' }); s.cy(0.005, 0.005, 0.022, PAL.charcoal, { x: k * 0.03, y: 0.012, rz: k * 0.4, seg: 6 }); }
    }, { x, y, z, ry });
  },
  mikan(b, x, y, z, r = 0.03) {
    b.ball(r, PAL.orange, { x, y: y + r * 0.86, z, sy: 0.86, ws: 10, hs: 8, cls: 'soft' });
    b.ball(r * 0.17, PAL.leaf, { x, y: y + r * 1.72, z, sy: 0.5, ws: 5, hs: 3 });
  },
  bowl(b, x, y, z, r, h, col, cls = 'gloss') {
    b.rev([[0, 0.003], [r * 0.45, 0], [r * 0.52, 0.004], [r, h], [r * 0.93, h], [r * 0.46, 0.014], [0, 0.014]].map(([q, k]) => [q, y + k]), col, { x, z, cls, seg: 16 });
  },
  basket(b, x, y, z, w, h, d, fill) {
    const R = Math.min(w, d) * 0.2;
    b.sb(w, h, d, PAL.beige, { x, b: y, z, R, r: 0.008, color2: dk(PAL.beige, 0.18) });
    b.sb(w - 0.03, 0.004, d - 0.03, dk(PAL.beige, 0.4), { x, b: y + h - 0.002, z, R: R * 0.8, r: 0, cs: 1, es: 1 });
    if (fill) b.ball(1, fill, { x, y: y + h - 0.005, z, sx: w * 0.36, sy: Math.min(0.05, h * 0.35), sz: d * 0.36, ws: 8, hs: 4 });
  },
  deskLamp(b, x, y, z, ry, col) {
    b.put((s) => {
      s.cy(0.05, 0.056, 0.014, col, { b: 0, seg: 16, cls: 'gloss' });
      s.tube([[0, 0.014, 0], [0, 0.15, 0], [0.02, 0.21, 0], [0.08, 0.232, 0]], 0.0065, PAL.chrome, { cls: 'metal', seg: 10, rad: 5 });
      s.put((h) => {
        h.rev([[0.06, 0], [0.063, 0.004], [0.026, 0.056], [0, 0.06]], col, { cls: 'gloss', seg: 16 });
        h.ball(0.024, WARM, { y: 0.004, ws: 8, hs: 6, cls: 'glow' });
      }, { x: 0.105, y: 0.19, rz: -0.25 });
    }, { x, y, z, ry });
  },
  globe(b, x, y, z, r) {
    b.cy(r * 0.5, r * 0.62, 0.012, PAL.woodDark, { x, b: y, z, seg: 12, cls: 'soft' });
    b.cy(0.005, 0.005, r * 0.5, PAL.gold, { x, b: y + 0.01, z, seg: 6, cls: 'metal' });
    const n0 = b.n('gloss'), land = linear(PAL.leafLight), cy = y + r * 1.45;
    b.ball(r, PAL.sky, { x, y: cy, z, ws: 16, hs: 12, cls: 'gloss' });
    b.edit('gloss', n0, (p, c, nn, i) => {
      const u = (p[i] - x) / r, v = (p[i + 1] - cy) / r, w = (p[i + 2] - z) / r;
      if (Math.sin(u * 4.1 + 1) * Math.sin(v * 3.3 + 2) + Math.sin(w * 4.7 + u * 2) * 0.7 > 0.35 && Math.abs(v) < 0.85) setc(c, i, land);
    });
    b.tor(r * 1.09, 0.004, PAL.gold, { x, y: cy, z, rz: -HP + 0.35, rs: 4, ts: 14, arc: PI, cls: 'metal' });
  },
  kettle(b, x, y, z, ry, col = PAL.gold) {
    b.put((s) => {
      s.rev([[0, 0], [0.068, 0], [0.086, 0.022], [0.08, 0.07], [0.05, 0.098], [0.02, 0.106], [0, 0.108]], col, { cls: 'gloss', seg: 18, color2: dk(col, 0.18) });
      s.ball(0.012, PAL.black, { y: 0.115, ws: 8, hs: 6, cls: 'soft' });
      s.tube([[-0.058, 0.085, 0], [-0.052, 0.15, 0], [0, 0.172, 0], [0.052, 0.15, 0], [0.058, 0.085, 0]], 0.007, PAL.black, { seg: 10, rad: 5, cls: 'soft' });
      s.cy(0.009, 0.017, 0.075, col, { x: 0.098, y: 0.075, rz: -0.85, seg: 8, cls: 'gloss' });
    }, { x, y, z, ry });
  },
  kokeshi(b, x, y, z) {
    b.cy(0.02, 0.026, 0.075, PAL.cream, { x, b: y, z, seg: 10, cls: 'soft' });
    for (const k of [0.018, 0.05]) b.cy(0.0245, 0.0245, 0.008, PAL.red, { x, b: y + k, z, seg: 10, cls: 'soft' });
    b.ball(0.03, PAL.skin, { x, y: y + 0.1, z, ws: 10, hs: 8, cls: 'soft' });
    b.geo(memo('cap8', () => new THREE.SphereGeometry(1, 10, 4, 0, TAU, 0, 1.15)), PAL.hair, { x, y: y + 0.1, z, sx: 0.031, sy: 0.031, sz: 0.031, cls: 'soft' });
  },
};
const FR = 0.034;
function fronts(b, x0, x1, y0, y1, zF, rows, col, hcol, cls = 'soft') {
  const gap = 0.012, total = rows.reduce((s, r) => s + r[0], 0), W = x1 - x0;
  let y = y1;
  for (const [hr, n, kind] of rows) {
    const h = (y1 - y0) * hr / total, w = (W - gap) / n; y -= h;
    for (let i = 0; i < n; i++) {
      const x = x0 + gap / 2 + w * (i + 0.5), yc = y + h / 2;
      b.fp(w - gap, h - gap, 0.014, col, { x, y: yc, z: zF, cls, cs: 1 });
      if (kind === 'knob') b.ball(0.012, hcol, { x, y: yc, z: zF + 0.02, ws: 8, hs: 6, cls: 'soft' });
      else if (kind === 'bar') b.sb(Math.min(0.14, w * 0.45), 0.012, 0.016, hcol, { x, y: y + h - 0.04, z: zF + 0.02, R: 0.005, r: 0.004, cs: 1, es: 1, cls: 'metal' });
      else if (kind === 'iron') { b.pb(Math.min(0.09, w * 0.4), 0.012, 0.01, hcol, { x, y: yc, z: zF + 0.018 }); b.pb(0.022, 0.03, 0.004, hcol, { x, y: yc + 0.004, z: zF + 0.015 }); }
      else if (kind === 'pull') b.sb(0.014, Math.min(0.14, h * 0.4), 0.016, hcol, { x: x + (i < n / 2 ? 1 : -1) * (w / 2 - 0.035), y: yc, z: zF + 0.02, R: 0.005, r: 0.004, cs: 1, es: 1, cls: 'metal' });
      else if (kind === 'slat') { for (let k = 1; k <= 3; k++) b.pb(w - gap - 0.04, 0.006, 0.004, hcol, { x, y: y + h * k / 4, z: zF + 0.015 }); b.ball(0.01, PAL.charcoal, { x: x + (i % 2 ? -1 : 1) * (w / 2 - 0.03), y: yc, z: zF + 0.02, ws: 6, hs: 4, cls: 'metal' }); }
    }
  }
}
function carton(b, x, y, z, w, h, d, ry, rnd, open) {
  const C = mix(PAL.cardboard, PAL.beige, rnd() * 0.3), tape = mix(PAL.cardboard, PAL.paper, 0.55);
  b.put((s) => {
    s.sb(w, h, d, C, { b: 0, R: 0.006, r: 0.004, cs: 1, es: 1, color2: dk(C, 0.12) });
    if (open) {
      s.pb(w - 0.02, 0.002, d - 0.02, dk(C, 0.45), { y: h + 0.001 });
      for (const k of [1, -1]) { s.pb(w - 0.01, 0.006, d * 0.42, C, { y: h + d * 0.19, z: k * (d / 2 + d * 0.02), rx: -k * 1.25 }); s.pb(w * 0.4, 0.006, d - 0.02, lt(C, 0.1), { x: k * (w / 2 + w * 0.02), y: h + w * 0.17, rz: k * 1.2 }); }
      s.ball(Math.min(w, d) * 0.22, PAL.paper, { y: h - 0.01, x: w * 0.1, ws: 6, hs: 4 });
    } else {
      s.pb(w + 0.002, 0.002, 0.045, tape, { y: h + 0.0006 });
      for (const k of [1, -1]) s.pb(0.002, h * 0.28, 0.045, tape, { x: k * (w / 2 + 0.0006), y: h * 0.86 });
      s.pb(0.004, 0.001, d - 0.01, dk(C, 0.3), { y: h + 0.0008, x: 0 });
    }
    s.pb(Math.min(0.1, w * 0.3), Math.min(0.06, h * 0.3), 0.002, PAL.paper, { x: -w * 0.18, y: h * 0.55, z: d / 2 });
    for (const k of [0, 1]) s.geo(memo('tri3', () => new THREE.CylinderGeometry(0.02, 0.02, 0.0014, 3)), PAL.red, { x: w * 0.22 + k * 0.04, y: h * 0.6, z: d / 2 + 0.0004, rx: HP });
  }, { x, y, z, ry });
}
const FURN = {
  desk(b, W, D, H, rnd) {
    const top = 0.04, wl = PAL.woodLight, wd = PAL.wood, ih = H - top, zF = D / 2;
    b.sb(W, top, D, wl, { b: ih, R: 0.022, r: 0.012, rb: 0.006, cls: 'soft', cs: 3, color2: dk(wl, 0.1) });
    if (W >= 0.9) {
      const ped = clamp(W * 0.3, 0.3, 0.42), px = W / 2 - ped / 2 - 0.025;
      b.sb(ped, ih - 0.03, D - 0.08, wd, { x: px, b: 0.03, R: 0.012, r: 0, cls: 'soft', color2: dk(wd, 0.12) });
      for (const z of [-1, 1]) b.pb(ped - 0.06, 0.03, 0.03, PAL.charcoal, { x: px, y: 0.015, z: z * (D / 2 - 0.1) });
      fronts(b, px - ped / 2 + 0.012, px + ped / 2 - 0.012, 0.05, ih - 0.01, zF - 0.04, [[0.26, 1, 'knob'], [0.3, 1, 'knob'], [0.44, 1, 'knob']], lt(wd, 0.2), PAL.woodDark);
      b.sb(0.034, ih, D - 0.1, wd, { x: -W / 2 + 0.045, b: 0, R: 0.01, r: 0, cls: 'soft', color2: dk(wd, 0.12) });
    } else for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.sb(0.045, ih, 0.045, wd, { x: sx * (W / 2 - 0.05), z: sz * (D / 2 - 0.05), b: 0, R: 0.01, r: 0, cs: 1, es: 1, cls: 'soft' });
    b.pb(W - 0.12, ih * 0.4, 0.02, wd, { y: ih * 0.76, z: -D / 2 + 0.06 });
    const big = W >= 0.9;
    if (W > 0.55 && D > 0.4) P.deskLamp(b, -W * 0.37 + 0.02, H, -D * 0.2, -0.6, PAL.navy);
    b.cy(0.034, 0.03, 0.085, PAL.sky, { x: -W * 0.12, b: H, z: -D * 0.3, seg: 12, cls: 'soft' });
    b.cy(0.029, 0.029, 0.002, dk(PAL.sky, 0.5), { x: -W * 0.12, b: H + 0.0845, z: -D * 0.3, seg: 12 });
    [PAL.yellow, PAL.red, PAL.green, PAL.blue].forEach((c, i) => b.cy(0.0055, 0.0055, 0.12, c, { x: -W * 0.12 + Math.cos(i * 1.7) * 0.012, y: H + 0.085, z: -D * 0.3 + Math.sin(i * 1.7) * 0.012, rz: Math.cos(i * 1.7) * -0.22, rx: Math.sin(i * 1.7) * 0.22, seg: 6 }));
    if (big) P.globe(b, W * 0.06, H, -D * 0.26, 0.055);
    P.stack(b, W * (big ? 0.34 : 0.26), H, -D * 0.12, rnd, 3, 0.9);
    const nx = -W * 0.04, nz = D * 0.16;
    for (const k of [-1, 1]) b.sb(0.12, 0.008, 0.17, PAL.paper, { x: nx + k * 0.061, b: H, z: nz, R: 0.006, r: 0.004, cs: 1, es: 1, rz: k * 0.03 });
    for (let i = 0; i < 4; i++) b.pb(0.08, 0.0006, 0.003, PAL.skyPale, { x: nx + 0.061, y: H + 0.0088, z: nz - 0.05 + i * 0.03 });
    b.cy(0.0055, 0.0055, 0.13, PAL.yellow, { x: nx - 0.05, y: H + 0.0145, z: nz + 0.01, rx: HP, ry: 0.5, seg: 6 });
    b.sb(0.04, 0.018, 0.022, PAL.white, { x: nx + 0.16, b: H, z: nz + 0.06, ry: 0.4, R: 0.005, r: 0.004, cs: 1, es: 1 });
  },
  closet(b, W, D, H, rnd) {
    const wd = PAL.wood, t = 0.035, base = 0.05, iw = W - 2 * t, mid = 0.52;
    b.sb(W, base, D, dk(wd, 0.12), { b: 0, R: 0.008, r: 0, cs: 1, es: 1 });
    for (const s of [1, -1]) b.sb(t, H - base, D, wd, { x: s * (W / 2 - t / 2), b: base, R: 0.008, r: 0.008, cls: 'soft', cs: 1, color2: dk(wd, 0.1) });
    b.sb(iw + 0.01, H - base, t, wd, { z: -D / 2 + t / 2, b: base, R: 0.008, r: 0.008, cls: 'soft', cs: 1, color2: dk(wd, 0.1) });
    b.pb(iw, H - base - 0.02, 0.004, PAL.linen, { z: -D / 2 + t + 0.002, y: base + (H - base - 0.02) / 2 });
    b.pb(iw, 0.03, D - t - 0.05, lt(wd, 0.15), { y: mid, z: (t - 0.05) / 2 });
    b.pb(iw, 0.012, 0.06, dk(wd, 0.2), { y: base + 0.006, z: D / 2 - 0.035 });
    const fw = iw / 2 + 0.015, fh = H - base - 0.03, slide = W < 0.9 ? 0.5 : 0.58;
    const fus = (x, z, pullSide) => {
      b.fp(fw, fh, 0.018, PAL.paper, { x, y: base + 0.012 + fh / 2, z, R: 0.004, r: 0.003, cs: 1 });
      b.pb(fw - 0.03, fh * 0.26, 0.002, mix(PAL.tatami, PAL.paper, 0.6), { x, y: base + 0.03 + fh * 0.13, z: z + 0.0185 });
      for (const s of [1, -1]) b.pb(0.016, fh + 0.004, 0.022, PAL.woodDark, { x: x + s * (fw / 2 - 0.008), y: base + 0.012 + fh / 2, z: z + 0.01 });
      for (const s of [1, -1]) b.pb(fw + 0.001, 0.018, 0.0225, PAL.woodDark, { x, y: base + 0.012 + fh / 2 + s * (fh / 2 - 0.007), z: z + 0.01 });
      b.cy(0.022, 0.022, 0.006, PAL.charcoal, { x: x + pullSide * (fw / 2 - 0.07), y: base + fh * 0.52, z: z + 0.02, rx: HP, seg: 12, cls: 'metal' });
    };
    fus(-iw / 4, D / 2 - 0.026, 1);
    fus(iw / 4 - fw * slide, D / 2 - 0.05, -1);
    const fx = iw / 4 + 0.01, fwid = Math.min(0.72, iw / 2 - 0.05), fd = D - t - 0.11, fz = (t - 0.05) / 2 - 0.005;
    let y = mid + 0.015;
    for (const [c, h] of [[PAL.white, 0.1], [PAL.sky, 0.11], [PAL.pinkPale, 0.09]]) { b.sb(fwid, h, fd, c, { x: fx, b: y, z: fz, R: 0.06, r: 0.045, rb: 0.035, cs: 3, es: 2, color2: dk(c, 0.08) }); y += h - 0.008; }
    b.sb(fwid * 0.55, 0.06, fd * 0.6, PAL.white, { x: fx - fwid * 0.1, b: y, z: fz, R: 0.05, r: 0.028, rb: 0.02, cs: 3, es: 2 });
    if (iw > 0.8) {
      const cw = Math.min(0.42, iw / 2 - 0.08); y = mid + 0.015;
      for (const c of [PAL.azuki, PAL.mustard, PAL.navy, PAL.fabricGreen]) { b.sb(cw, 0.06, Math.min(cw, fd), c, { x: -iw / 4 + 0.01 * (rnd() - 0.5) * 6, b: y, z: fz, ry: (rnd() - 0.5) * 0.16, R: 0.07, r: 0.03, rb: 0.025, cs: 3, es: 2 }); y += 0.052; }
    }
    b.sb(fwid, mid - base - 0.07, fd, PAL.white, { x: fx, b: base + 0.012, z: fz, R: 0.015, r: 0.01, cls: 'soft' });
    for (const k of [0.3, 0.72]) b.pb(fwid - 0.06, 0.02, 0.006, PAL.skyPale, { x: fx, y: base + 0.012 + (mid - base - 0.07) * k, z: fz + fd / 2 + 0.002 });
  },
  bookshelf(b, W, D, H, rnd) {
    const wd = mix(PAL.woodDark, PAL.wood, 0.45), t = 0.03, iw = W - 2 * t, two = D > 0.5, sh = [0.05, 0.35, 0.65];
    for (const s of [1, -1]) b.sb(t, H * 0.94, D, wd, { x: s * (W / 2 - t / 2), b: 0, R: 0.008, r: 0.008, cls: 'soft', cs: 1, color2: dk(wd, 0.12) });
    b.pb(iw, 0.05, D - 0.02, dk(wd, 0.15), { y: 0.025 });
    for (const y of sh.slice(1)) b.pb(iw, 0.022, D - 0.01, wd, { y: y - 0.011 });
    b.pb(iw, H * 0.9, 0.02, dk(wd, 0.1), { y: H * 0.45, z: two ? 0 : -D / 2 + 0.012 });
    const depth = two ? D / 2 - 0.03 : D - 0.04;
    sh.forEach((y, li) => {
      const top = li === sh.length - 1, hMax = top ? H - y - 0.02 : 0.27;
      P.row(b, -iw / 2, iw / 2, y, D / 2 - 0.004, Math.min(depth, 0.3), hMax, rnd, top, 1);
      if (two) P.row(b, -iw / 2, iw / 2, y, -D / 2 + 0.004, Math.min(depth, 0.3), hMax, rnd, top, -1);
    });
  },
  sofa(b, W, D, H, rnd, v) {
    const fab = FABRICS[v % FABRICS.length], fd = dk(fab, 0.14), fl = lt(fab, 0.12), arm = Math.min(0.15, W * 0.12), bk = Math.min(0.18, D * 0.3);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cy(0.022, 0.016, 0.06, PAL.woodDark, { x: sx * (W / 2 - 0.07), z: sz * (D / 2 - 0.07), b: 0, seg: 8, cls: 'soft' });
    b.sb(W, 0.2, D, fd, { b: 0.05, R: 0.04, r: 0.02, rb: 0.02, cs: 3 });
    b.sb(W, H - 0.2, bk, fab, { b: 0.2, z: -D / 2 + bk / 2, R: 0.06, r: 0.05, cs: 3, es: 3, color2: fd });
    for (const s of [1, -1]) b.sb(arm, 0.3, D, fab, { x: s * (W / 2 - arm / 2), b: 0.12, R: 0.055, r: 0.05, cs: 3, es: 3, color2: fd });
    const iw = W - 2 * arm, n = clamp(Math.round(iw / 0.66), 1, 3), cw = iw / n, cd = D - bk;
    for (let i = 0; i < n; i++) {
      const x = -iw / 2 + cw * (i + 0.5);
      b.sb(cw - 0.012, 0.12, cd - 0.01, fl, { x, b: 0.22, z: -D / 2 + bk + cd / 2, R: 0.05, r: 0.04, cs: 3, es: 3, color2: fab });
      b.sb(cw - 0.03, H - 0.4, 0.11, fl, { x, b: 0.33, z: -D / 2 + bk + 0.035, rx: -0.14, R: 0.05, r: 0.045, cs: 3, es: 3, color2: fab });
    }
    const pc = [pick(rnd, ACCENTS), pick(rnd, ACCENTS)], pz = -D / 2 + bk + 0.17;
    if (iw > 0.7 && cd > 0.34) b.sb(0.3, 0.1, 0.3, pc[0], { x: -iw / 2 + 0.17, y: 0.475, z: pz, rx: 1.12, ry: 0.22, R: 0.09, r: 0.045, rb: 0.045, cs: 3, es: 3 });
    if (n > 1 && cd > 0.34) b.sb(0.26, 0.09, 0.26, pc[1] === pc[0] ? PAL.cream : pc[1], { x: iw / 2 - 0.15, y: 0.455, z: pz - 0.01, rx: 1.05, ry: -0.3, R: 0.08, r: 0.04, rb: 0.04, cs: 3, es: 3 });
  },
  shoebox(b, W, D, H, rnd) {
    const wd = PAL.wood, top = 0.035;
    b.sb(W - 0.03, 0.05, D - 0.07, dk(wd, 0.3), { b: 0, z: -0.02, R: 0.006, r: 0, cs: 1, es: 1 });
    b.sb(W, H - top - 0.05, D - FR, wd, { b: 0.05, z: -FR / 2, R: 0.014, r: 0, cls: 'soft', color2: dk(wd, 0.12) });
    b.sb(W, top, D, PAL.woodLight, { b: H - top, R: 0.018, r: 0.01, rb: 0.004, cls: 'soft', cs: 3 });
    fronts(b, -W / 2 + 0.01, W / 2 - 0.01, 0.07, H - top - 0.012, D / 2 - FR - 0.002, [[1, clamp(Math.round(W / 0.46), 1, 5), 'slat']], lt(wd, 0.22), dk(wd, 0.1));
    const k = W > 1.2 ? 1 : 0.6;
    P.bowl(b, -W * 0.3 * k, H, D * 0.05, 0.075, 0.022, PAL.skyPale);
    b.tor(0.014, 0.003, PAL.gold, { x: -W * 0.3 * k - 0.015, y: H + 0.019, z: D * 0.05, rx: HP, rs: 4, ts: 10, cls: 'metal' });
    b.pb(0.045, 0.004, 0.012, PAL.chrome, { x: -W * 0.3 * k + 0.022, y: H + 0.019, z: D * 0.05 + 0.006, ry: 0.4, cls: 'metal' });
    P.flowers(b, W * 0.02, H, -D * 0.12, 1.25, rnd);
    if (W > 0.8) P.frame(b, W * 0.32 * k, H, -D * 0.1, -0.25);
  },
  table(b, W, D, H, rnd) {
    const wl = PAL.wood, t = 0.035, R = Math.min(W, D) * 0.16;
    b.sb(W, t, D, wl, { b: H - t, R, r: 0.014, rb: 0.01, cls: 'soft', cs: 4, es: 2, color2: dk(wl, 0.12) });
    b.sb(W - 0.16, 0.05, D - 0.16, dk(wl, 0.18), { b: H - t - 0.05, R: R * 0.7, r: 0, cls: 'soft' });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cy(0.03, 0.022, H - t, dk(wl, 0.18), { x: sx * (W / 2 - 0.13), z: sz * (D / 2 - 0.13), b: 0, seg: 10, cls: 'soft' });
    b.put((s) => {
      s.rev([[0, 0], [0.04, 0], [0.062, 0.02], [0.058, 0.06], [0.035, 0.078], [0, 0.08]], PAL.azuki, { cls: 'gloss', seg: 14 });
      s.ball(0.01, PAL.azuki, { y: 0.086, ws: 6, hs: 4, cls: 'gloss' });
      s.cy(0.008, 0.013, 0.05, PAL.azuki, { x: 0.07, y: 0.055, rz: -0.9, seg: 8, cls: 'gloss' });
      s.cy(0.011, 0.011, 0.07, PAL.azuki, { z: 0.085, y: 0.05, rx: HP, seg: 8, cls: 'gloss' });
    }, { x: W * 0.08, y: H, z: -D * 0.08, ry: 0.5 });
    P.cup(b, -W * 0.2, H, D * 0.12, PAL.white);
    if (Math.max(W, D) > 0.8) P.cup(b, W * 0.26, H, D * 0.22, PAL.white);
    b.sb(0.2, 0.012, 0.13, PAL.woodDark, { x: -W * 0.16, b: H, z: -D * 0.2, R: 0.015, r: 0.005, cls: 'soft' });
    for (const k of [-1, 1]) { b.ball(0.034, PAL.white, { x: -W * 0.16 + k * 0.045, y: H + 0.036, z: -D * 0.2, sy: 0.8, ws: 8, hs: 6 }); b.pb(0.03, 0.022, 0.05, PAL.black, { x: -W * 0.16 + k * 0.045, y: H + 0.022, z: -D * 0.2 }); }
  },
  kotatsu(b, W, D, H, rnd) {
    const cloth = PAL.navy, tw = W * 0.72, td = D * 0.72, hh = H - 0.06, R = Math.min(W, D) * 0.22, r = Math.min(R - 0.01, 0.2);
    b.sb(W, 0.035, D, PAL.azuki, { b: 0, R, r: 0.012, cs: 4, es: 1 });
    b.sb(W - 0.02, hh, D - 0.02, cloth, { b: 0.012, R: R - 0.01, r, cs: 5, es: 5, color2: PAL.navyDark });
    const cy = 0.012 + hh - r, sq = (x, z, th, ax) => {
      const k = r * Math.cos(th), y = cy + r * Math.sin(th) + 0.0015, t = HP - th;
      b.put((s) => s.pb(0.042, 0.002, 0.042, PAL.cream, { ry: PI / 4 }), ax === 'x' ? { x: x + Math.sign(x) * k, y, z, rz: -Math.sign(x) * t } : { x, y, z: z + Math.sign(z) * k, rx: Math.sign(z) * t });
    };
    for (const s of [1, -1]) for (const [u, th] of [[-0.2, 0.75], [0.16, 1.02]]) { sq(s * (W / 2 - 0.01 - r), u * (D - 0.5) * s, th, 'x'); sq(u * (W - 0.5) * s, s * (D / 2 - 0.01 - r), th, 'z'); }
    b.sb(tw - 0.05, 0.02, td - 0.05, dk(PAL.wood, 0.25), { b: H - 0.05, R: 0.02, r: 0, cs: 2, es: 1, cls: 'soft' });
    b.sb(tw, 0.035, td, PAL.wood, { b: H - 0.035, R: 0.03, r: 0.012, rb: 0.008, cls: 'soft', cs: 3, color2: dk(PAL.wood, 0.1) });
    P.bowl(b, 0, H, 0, 0.1, 0.04, PAL.woodDark, 'soft');
    for (const [x, z, h] of [[-0.035, 0.02, 0.014], [0.035, 0.015, 0.014], [0, -0.035, 0.014], [0.005, 0.005, 0.055]]) P.mikan(b, x, H + h, z, 0.03);
    P.mikan(b, tw * 0.3, H, td * 0.26, 0.03);
    P.cup(b, -tw * 0.3, H, td * 0.2, PAL.cream);
  },
  tvboard(b, W, D, H, rnd) {
    const wd = mix(PAL.woodDark, PAL.wood, 0.3), bh = 0.36;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cy(0.02, 0.015, 0.05, PAL.charcoal, { x: sx * (W / 2 - 0.06), z: sz * (D / 2 - 0.06), b: 0, seg: 8 });
    b.sb(W, bh - 0.08, D - FR, wd, { b: 0.05, z: -FR / 2, R: 0.014, r: 0, cls: 'soft', color2: dk(wd, 0.12) });
    b.sb(W, 0.03, D, wd, { b: bh - 0.03, R: 0.014, r: 0.01, cls: 'soft' });
    const nw = W > 0.9 ? W * 0.36 : 0;
    if (nw) {
      b.pb(nw, bh - 0.12, 0.004, PAL.charcoal, { y: 0.05 + (bh - 0.08) / 2, z: D / 2 - FR + 0.001 });
      b.sb(nw * 0.7, 0.05, 0.024, PAL.white, { b: 0.11, z: D / 2 - FR + 0.012, R: 0.008, r: 0.006, cls: 'gloss' });
      b.pb(0.012, 0.006, 0.002, PAL.teal, { x: nw * 0.25, y: 0.135, z: D / 2 - FR + 0.025, cls: 'glow' });
      for (const s of [1, -1]) fronts(b, s > 0 ? nw / 2 : -W / 2 + 0.01, s > 0 ? W / 2 - 0.01 : -nw / 2, 0.065, bh - 0.04, D / 2 - FR - 0.002, [[1, 1, 'knob']], lt(wd, 0.14), PAL.gold);
    } else fronts(b, -W / 2 + 0.01, W / 2 - 0.01, 0.065, bh - 0.04, D / 2 - FR - 0.002, [[1, 1, 'knob']], lt(wd, 0.14), PAL.gold);
    const tw = Math.min(W * 0.88, 1.3), th = Math.min(tw * 0.58, H - bh - 0.05), tz = -D * 0.12, ty = bh + 0.05 + th / 2;
    b.sb(Math.min(0.34, tw * 0.5), 0.012, Math.min(0.2, D - 0.1), PAL.charcoal, { b: bh, z: tz, R: 0.02, r: 0.006, cls: 'gloss' });
    b.pb(0.07, 0.07, 0.02, PAL.charcoal, { y: bh + 0.04, z: tz - 0.01 });
    b.fp(tw, th, 0.03, PAL.black, { y: ty, z: tz - 0.015, R: 0.014, r: 0.008, cls: 'gloss' });
    b.fp(tw - 0.03, th - 0.03, 0.002, mix(PAL.sky, PAL.navy, 0.38), { y: ty, z: tz + 0.0152, R: 0.006, r: 0, cs: 1, es: 1, cls: 'glow', color2: mix(PAL.sky, PAL.skyPale, 0.4) });
    b.cy(th * 0.14, th * 0.14, 0.002, PAL.butter, { x: -tw * 0.22, y: ty + th * 0.12, z: tz + 0.0182, rx: HP, seg: 14, cls: 'glow' });
    for (const [x, y, s] of [[0.12, 0.06, 1], [0.28, -0.1, 0.8], [-0.05, -0.2, 0.7]]) b.fp(tw * 0.2 * s, th * 0.13 * s, 0.001, PAL.skyPale, { x: tw * x, y: ty + th * y, z: tz + 0.0176, R: th * 0.06 * s, r: 0, cs: 2, es: 1, cls: 'glow' });
    b.sb(0.045, 0.014, 0.13, PAL.charcoal, { x: W * 0.36, b: bh, z: D * 0.22, ry: 0.4, R: 0.01, r: 0.005, cs: 1, es: 1 });
    if (W > 1) P.pot(b, -W * 0.4, bh, D * 0.12, 0.9, rnd, PAL.terracotta);
  },
  fridge(b, W, D, H, rnd, v) {
    const body = [PAL.white, mix(PAL.mint, PAL.white, 0.45), PAL.cream][v % 3], dz = D / 2 - 0.075, hl = (H - 0.04) * 0.36;
    b.sb(W, H, D - 0.075, body, { b: 0, z: -0.0375, R: 0.03, r: 0.025, cls: 'soft', cs: 3, es: 2, color2: dk(body, 0.1) });
    b.pb(W - 0.06, 0.03, 0.02, PAL.charcoal, { y: 0.015, z: dz - 0.01 });
    b.fp(W - 0.008, hl, 0.045, body, { y: 0.04 + hl / 2, z: dz, R: 0.028, r: 0.02, cls: 'soft', cs: 3, es: 2 });
    b.fp(W - 0.008, H - 0.05 - hl, 0.045, body, { y: 0.045 + hl + (H - 0.05 - hl) / 2, z: dz, R: 0.028, r: 0.02, cls: 'soft', cs: 3, es: 2 });
    for (const [y, h] of [[0.04 + hl - 0.09, 0.12], [0.045 + hl + 0.14, 0.2]]) b.sb(0.022, h, 0.028, PAL.chrome, { x: -W / 2 + 0.07, y, z: D / 2 - 0.022, R: 0.008, r: 0.008, rb: 0.008, cs: 1, es: 1, cls: 'metal' });
    b.pb(0.07, 0.085, 0.002, PAL.butter, { x: W * 0.14, y: H * 0.72, z: D / 2 - 0.029, rz: 0.08 });
    b.put((s) => { s.pb(0.13, 0.1, 0.002, PAL.paper, {}); s.cy(0.02, 0.02, 0.0024, PAL.yellow, { x: -0.035, y: 0.022, rx: HP, seg: 10 }); s.pb(0.11, 0.022, 0.0024, PAL.leafLight, { y: -0.036 }); s.cy(0.015, 0.015, 0.0026, PAL.red, { x: 0.025, y: -0.008, rx: HP, seg: 8 }); s.pb(0.004, 0.03, 0.0024, PAL.leaf, { x: 0.025, y: -0.03 }); }, { x: -W * 0.08, y: H * 0.56, z: D / 2 - 0.029, rz: -0.06 });
    b.cy(0.012, 0.012, 0.006, PAL.teal, { x: -W * 0.08, y: H * 0.56 + 0.04, z: D / 2 - 0.026, rx: HP, seg: 8, cls: 'gloss' });
    b.cy(0.012, 0.012, 0.006, PAL.red, { x: W * 0.14, y: H * 0.72 + 0.034, z: D / 2 - 0.026, rx: HP, seg: 8, cls: 'gloss' });
    b.cy(0.014, 0.014, 0.006, PAL.blue, { x: W * 0.27, y: H * 0.6, z: D / 2 - 0.026, rx: HP, seg: 8, cls: 'gloss' });
    b.cy(0.013, 0.013, 0.006, PAL.yellow, { x: W * 0.02, y: H * 0.86, z: D / 2 - 0.026, rx: HP, seg: 8, cls: 'gloss' });
    const tw = Math.min(0.3, W * 0.42), td = Math.min(0.24, (D - 0.075) * 0.5);
    P.basket(b, -W * 0.2, H, -0.06, tw, 0.09, td, PAL.mustard);
    if (W > 0.5) P.pot(b, W * 0.24, H, -0.05, 0.9, rnd, PAL.terracotta);
  },
  kitchen(b, W, D, H, rnd) {
    const body = PAL.white, ct = 0.04, topC = lt(PAL.chrome, 0.3), yb = H - ct;
    b.sb(W - 0.02, 0.07, D - 0.08, PAL.charcoal, { b: 0, z: -0.025, R: 0.006, r: 0, cs: 1, es: 1 });
    b.sb(W, yb - 0.07, D - FR, body, { b: 0.07, z: -FR / 2, R: 0.012, r: 0, cls: 'soft', color2: dk(body, 0.08) });
    const sinkOk = W >= 0.7, sw = sinkOk ? clamp(W * 0.34, 0.3, 0.6) : 0, sd = D - 0.24, sx = -W / 2 + 0.07 + sw / 2, sz = 0.02;
    const strip = (x0, x1, z0, z1) => { if (x1 - x0 > 0.002 && z1 - z0 > 0.002) b.pb(x1 - x0, ct, z1 - z0, topC, { x: (x0 + x1) / 2, y: yb + ct / 2, z: (z0 + z1) / 2, cls: 'gloss' }); };
    if (sinkOk) {
      strip(-W / 2, sx - sw / 2, -D / 2, D / 2); strip(sx + sw / 2, W / 2, -D / 2, D / 2); strip(sx - sw / 2, sx + sw / 2, sz + sd / 2, D / 2); strip(sx - sw / 2, sx + sw / 2, -D / 2, sz - sd / 2);
      const fl = H - 0.17, wc = PAL.steel;
      b.pb(sw, 0.01, sd, PAL.chrome, { x: sx, y: fl, z: sz, cls: 'gloss' });
      for (const s of [1, -1]) { b.pb(0.008, H - fl, sd, wc, { x: sx + s * (sw / 2 + 0.004), y: (H + fl) / 2 - 0.002, z: sz, cls: 'gloss' }); b.pb(sw, H - fl, 0.008, wc, { x: sx, y: (H + fl) / 2 - 0.002, z: sz + s * (sd / 2 + 0.004), cls: 'gloss' }); }
      b.cy(0.026, 0.026, 0.004, PAL.steelDark, { x: sx, y: fl + 0.007, z: sz, seg: 12, cls: 'metal' });
      b.cy(0.02, 0.024, 0.03, PAL.chrome, { x: sx, b: H, z: -D / 2 + 0.065, seg: 10, cls: 'metal' });
      b.tube([[sx, H + 0.02, -D / 2 + 0.065], [sx, H + 0.15, -D / 2 + 0.065], [sx, H + 0.19, -D / 2 + 0.1], [sx, H + 0.15, -D / 2 + 0.17]], 0.011, PAL.chrome, { cls: 'metal', seg: 10, rad: 6, caps: true });
      b.sb(0.06, 0.026, 0.04, PAL.yellow, { x: sx + sw / 2 + 0.05, b: H, z: -D / 2 + 0.07, R: 0.008, r: 0.006, cs: 1, es: 1 });
      b.pb(0.058, 0.006, 0.038, PAL.green, { x: sx + sw / 2 + 0.05, y: H + 0.028, z: -D / 2 + 0.07 });
    } else b.sb(W, ct, D, topC, { b: yb, R: 0.01, r: 0.006, cls: 'gloss' });
    const gx0 = sinkOk ? sx + sw / 2 + 0.12 : -W / 2 + 0.05, gw = Math.min(W / 2 - 0.05 - gx0, 0.62), gx = gx0 + gw / 2, gd = D - 0.14;
    if (gw > 0.24) {
      b.sb(gw, 0.014, gd, PAL.black, { x: gx, b: H - 0.002, R: 0.015, r: 0.005, cls: 'gloss' });
      const nb = gw > 0.5 ? 2 : 1;
      for (let i = 0; i < nb; i++) {
        const x = gx + (nb === 2 ? (i - 0.5) * gw * 0.5 : 0);
        b.tor(0.065, 0.008, PAL.steelDark, { x, y: H + 0.018, rx: HP, rs: 5, ts: 16, cls: 'soft' });
        b.cy(0.03, 0.03, 0.01, PAL.charcoal, { x, b: H + 0.01, seg: 10 });
        for (let k = 0; k < 4; k++) b.pb(0.05, 0.008, 0.008, PAL.steelDark, { x: x + Math.cos(k * HP) * 0.06, y: H + 0.024, z: Math.sin(k * HP) * 0.06, ry: -k * HP });
        b.cy(0.016, 0.016, 0.014, PAL.charcoal, { x, y: H - 0.08, z: D / 2 - 0.012, rx: HP, seg: 10, cls: 'soft' });
      }
      P.kettle(b, gx + (nb === 2 ? -gw * 0.25 : 0), H + 0.026, 0, 0.7);
    }
    const n = clamp(Math.round(W / 0.45), 1, 4);
    fronts(b, -W / 2 + 0.01, W / 2 - 0.01, 0.085, yb - 0.01, D / 2 - FR - 0.002, [[0.24, n, 'bar'], [1, n, 'bar']], lt(body, 0.3), PAL.chrome);
  },
  washer(b, W, D, H, rnd) {
    const body = PAL.white, deck = 0.07, ph = 0.05, yd = H - ph;
    b.sb(W, yd - deck, D, body, { b: 0, R: 0.03, r: 0, cls: 'soft', cs: 3, color2: dk(body, 0.1) });
    b.sb(W, deck, D, lt(body, 0.3), { b: yd - deck, R: 0.03, r: 0.022, cls: 'soft', cs: 3, es: 2 });
    const pd = Math.min(0.16, D * 0.24), lw = Math.min(W - 0.1, (D - pd) * 1.25), ld = D - pd - 0.08, lz = pd / 2;
    b.sb(W - 0.03, ph + 0.01, pd, PAL.chrome, { b: yd - 0.01, z: -D / 2 + pd / 2 + 0.01, R: 0.02, r: 0.014, cls: 'gloss' });
    b.pb(0.07, 0.003, pd * 0.4, PAL.screen, { x: -W * 0.22, y: H + 0.0016, z: -D / 2 + pd / 2 + 0.01, cls: 'glow' });
    [PAL.white, PAL.sky, PAL.red].forEach((c, i) => b.cy(0.014, 0.014, 0.008, c, { x: W * (0.05 + i * 0.13), y: H + 0.003, z: -D / 2 + pd / 2 + 0.01, seg: 10, cls: 'gloss' }));
    b.sb(lw, 0.016, ld, PAL.chrome, { b: yd - 0.004, z: lz, R: Math.min(lw, ld) * 0.22, r: 0.008, cls: 'gloss', cs: 3 });
    b.sb(lw - 0.07, 0.004, ld - 0.07, mix(PAL.glassBlue, PAL.navy, 0.35), { b: yd + 0.0115, z: lz, R: Math.min(lw, ld) * 0.2, r: 0, cls: 'gloss', cs: 3, es: 1 });
    b.tor(Math.min(lw, ld) * 0.26, 0.006, PAL.chrome, { y: yd + 0.016, z: lz, rx: HP, rs: 4, ts: 18, cls: 'metal' });
    b.sb(0.08, 0.012, 0.02, PAL.chrome, { b: yd + 0.012, z: lz + ld / 2 - 0.035, R: 0.006, r: 0.005, cs: 1, es: 1, cls: 'metal' });
    b.pb(W * 0.5, 0.012, 0.002, PAL.fabricGrey, { y: 0.07, z: D / 2 });
    b.pb(0.07, 0.03, 0.002, PAL.sky, { x: W * 0.3, y: yd - deck - 0.05, z: D / 2 });
  },
  tansu(b, W, D, H, rnd) {
    const wd = PAL.woodRed, top = 0.03, n = W > 1.25 ? 2 : 1;
    b.sb(W - 0.02, 0.04, D - 0.06, dk(wd, 0.3), { b: 0, z: -0.015, R: 0.006, r: 0, cs: 1, es: 1 });
    b.sb(W, H - top - 0.04, D - FR, wd, { b: 0.04, z: -FR / 2, R: 0.012, r: 0, cls: 'soft', color2: dk(wd, 0.14) });
    b.sb(W, top, D, lt(wd, 0.1), { b: H - top, R: 0.014, r: 0.008, rb: 0.004, cls: 'soft', cs: 3 });
    fronts(b, -W / 2 + 0.012, W / 2 - 0.012, 0.055, H - top - 0.012, D / 2 - FR - 0.002, [[0.75, W > 0.7 ? n + 1 : 2, 'iron'], [1, n, 'iron'], [1, n, 'iron'], [1.15, n, 'iron']], lt(wd, 0.1), PAL.charcoal);
    for (const sx of [1, -1]) for (const y of [0.06, H - top - 0.03]) b.pb(0.03, 0.03, 0.004, PAL.charcoal, { x: sx * (W / 2 - 0.02), y, z: D / 2 - FR + 0.002 });
    b.sb(Math.min(0.42, W * 0.5), 0.004, D * 0.52, PAL.cream, { b: H, R: 0.01, r: 0.002, cs: 1, es: 1 });
    b.sb(Math.min(0.42, W * 0.5) - 0.04, 0.0045, D * 0.52 - 0.04, mix(PAL.azuki, PAL.cream, 0.6), { b: H, R: 0.006, r: 0.002, cs: 1, es: 1 });
    P.kokeshi(b, -W * 0.14, H + 0.004, D * 0.02);
    P.clock(b, W * 0.12, H + 0.004, -D * 0.02, 0.2, PAL.teal);
  },
  counter(b, W, D, H, rnd) {
    const body = PAL.cream, top = 0.045, n = clamp(Math.round(W / 0.5), 1, 3);
    b.sb(W - 0.02, 0.07, D - 0.08, PAL.charcoal, { b: 0, z: -0.025, R: 0.006, r: 0, cs: 1, es: 1 });
    b.sb(W, H - top - 0.07, D - FR, body, { b: 0.07, z: -FR / 2, R: 0.012, r: 0, cls: 'soft', color2: dk(body, 0.1) });
    b.sb(W, top, D, PAL.wood, { b: H - top, R: 0.018, r: 0.012, rb: 0.006, cls: 'soft', cs: 3, color2: dk(PAL.wood, 0.1) });
    fronts(b, -W / 2 + 0.01, W / 2 - 0.01, 0.085, H - top - 0.012, D / 2 - FR - 0.002, [[0.3, n, 'bar'], [1, n * 2, 'pull']], lt(body, 0.4), PAL.chrome);
    const bx = -W * 0.26;
    P.bowl(b, bx, H, 0, Math.min(0.13, D * 0.3, W * 0.2), 0.05, PAL.white);
    for (const [x, z, c] of [[-0.04, 0.02, PAL.red], [0.04, -0.03, PAL.red], [0.01, 0.045, PAL.orange]]) b.ball(0.034, c, { x: bx + x, y: H + 0.05, z, ws: 10, hs: 8, cls: 'gloss' });
    b.tube([[bx - 0.06, H + 0.07, -0.03], [bx - 0.01, H + 0.095, -0.05], [bx + 0.05, H + 0.075, -0.045]], 0.014, PAL.yellow, { seg: 6, rad: 5, caps: true, cls: 'soft' });
    for (let i = 0; i < (W > 1 ? 3 : 1); i++) {
      const x = W * 0.12 + i * 0.1, h = 0.11 + (i % 2) * 0.04;
      b.cy(0.036, 0.036, h, [PAL.cream, PAL.toast, PAL.terracotta][i], { x, b: H, z: -D * 0.2, seg: 12, cls: 'gloss' });
      b.cy(0.039, 0.039, 0.018, PAL.woodDark, { x, b: H + h, z: -D * 0.2, seg: 12, cls: 'soft' });
    }
    if (W > 1.3) { b.sb(0.26, 0.016, 0.17, PAL.woodLight, { x: W * 0.36, b: H, z: D * 0.08, ry: 0.15, R: 0.02, r: 0.006, cls: 'soft' }); b.sb(0.15, 0.07, 0.085, PAL.toast, { x: W * 0.36, b: H + 0.016, z: D * 0.08, ry: 0.15, R: 0.035, r: 0.034, cs: 3, es: 3, color2: PAL.toastCrust }); }
  },
  bench(b, W, D, H, rnd) {
    const wd = PAL.wood, n = Math.max(2, Math.round(D / 0.11)), g = 0.012, sw = (D - g * (n - 1)) / n, st = 0.032;
    for (let i = 0; i < n; i++) b.sb(W, st, sw, i % 2 ? lt(wd, 0.08) : wd, { b: H - st, z: -D / 2 + sw / 2 + i * (sw + g), R: 0.008, r: 0.007, cls: 'soft', cs: 1, color2: dk(wd, 0.1) });
    for (const s of [1, -1]) {
      const x = s * (W / 2 - 0.08);
      for (const k of [1, -1]) b.sb(0.045, H - st, 0.045, dk(wd, 0.12), { x, b: 0, z: k * (D / 2 - 0.04), R: 0.01, r: 0, cs: 1, es: 1, cls: 'soft' });
      b.pb(0.035, 0.04, D - 0.1, dk(wd, 0.12), { x, y: H - st - 0.02 });
    }
    b.pb(W - 0.16, 0.03, 0.03, dk(wd, 0.12), { y: 0.13 });
    if (W > 0.8) b.sb(Math.min(0.34, W * 0.3), 0.05, D - 0.05, pick(rnd, [PAL.azuki, PAL.mustard, PAL.fabricBlue]), { x: -W / 2 + Math.min(0.34, W * 0.3) / 2 + 0.05, b: H - 0.004, R: 0.05, r: 0.028, rb: 0.015, cs: 3, es: 2 });
  },
  shelf(b, W, D, H, rnd) {
    const wd = PAL.white, post = 0.032, lv = [0.07, 0.36, 0.64], bt = 0.026;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.sb(post, lv[2] + 0.04, post, wd, { x: sx * (W / 2 - post / 2), z: sz * (D / 2 - post / 2), b: 0, R: 0.008, r: 0.006, cs: 1, es: 1, cls: 'soft', color2: dk(wd, 0.1) });
    for (const y of lv) b.sb(W - 0.006, bt, D - 0.006, PAL.woodLight, { b: y - bt, R: 0.008, r: 0.004, cs: 1, es: 1, cls: 'soft' });
    const slots = clamp(Math.round((W - 0.08) / 0.4), 1, 3), sw = (W - 0.08) / slots, sd = D - 0.06;
    lv.forEach((y, li) => {
      const hMax = li === 2 ? H - y - 0.01 : 0.24;
      for (let i = 0; i < slots; i++) {
        const x = -(W - 0.08) / 2 + sw * (i + 0.5), k = Math.floor(rnd() * 5 + li * 2 + i) % 5, w = sw - 0.04;
        if (li === 2 && k % 2 === 0) { P.pot(b, x, y, 0, Math.min(1.3, sd / 0.16), rnd, pick(rnd, [PAL.white, PAL.terracotta, PAL.skyPale])); continue; }
        if (k === 0 || k === 3) P.basket(b, x, y, 0, w, hMax * 0.7, sd, k === 3 ? pick(rnd, [PAL.white, PAL.skyPale, PAL.pinkPale]) : null);
        else if (k === 1) { let yy = y; for (const c of [PAL.white, PAL.sky, PAL.pinkPale, PAL.white].slice(0, li === 2 ? 3 : 4)) { b.sb(Math.min(w * 0.9, 0.34), 0.05, sd * 0.9, c, { x, b: yy, z: 0, R: 0.04, r: 0.024, cs: 2, es: 1 }); yy += 0.046; } }
        else if (k === 2) { const c = pick(rnd, [PAL.navy, PAL.teal, PAL.mustard, PAL.azuki]); b.sb(w, hMax * 0.62, sd * 0.92, c, { x, b: y, z: 0, R: 0.012, r: 0.006, cls: 'soft' }); b.sb(w + 0.008, 0.03, sd * 0.92 + 0.008, lt(c, 0.25), { x, b: y + hMax * 0.62 - 0.01, z: 0, R: 0.012, r: 0.006, cls: 'soft' }); b.pb(w * 0.4, 0.03, 0.002, PAL.paper, { x, y: y + hMax * 0.3, z: sd * 0.46 + 0.001 }); }
        else P.stack(b, x, y, 0, rnd, 3, Math.min(1, sd / 0.26, w / 0.2));
      }
    });
  },
  bed(b, W, D, H, rnd, v) {
    const cover = [PAL.fabricBlue, PAL.mint, PAL.mustard, PAL.pink][v % 4], wd = PAL.woodLight;
    const draw = (s, w, l) => {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) s.pb(0.05, 0.05, 0.05, PAL.woodDark, { x: sx * (w / 2 - 0.05), y: 0.025, z: sz * (l / 2 - 0.05) });
      s.sb(w, 0.17, l, wd, { b: 0.045, R: 0.02, r: 0.008, cls: 'soft', color2: dk(wd, 0.12) });
      s.sb(w, H - 0.045, 0.055, wd, { b: 0.045, z: -l / 2 + 0.0275, R: 0.02, r: 0.02, cls: 'soft', cs: 3, color2: dk(wd, 0.12) });
      s.sb(w - 0.05, 0.12, l - 0.1, PAL.white, { b: 0.2, z: 0.022, R: 0.05, r: 0.035, cs: 3, es: 3, color2: PAL.linen });
      const np = w > 1.25 ? 2 : 1, pw = Math.min(0.52, (w - 0.14) / np);
      for (let i = 0; i < np; i++) s.sb(pw, 0.075, 0.3, PAL.white, { x: (i - (np - 1) / 2) * (pw + 0.04), b: 0.305, z: -l / 2 + 0.27, R: 0.08, r: 0.036, rb: 0.02, cs: 3, es: 3 });
      const dl = l * 0.6, dz = l / 2 - dl / 2 - 0.03;
      s.sb(w - 0.01, 0.1, dl, cover, { b: 0.292, z: dz, R: 0.07, r: 0.05, rb: 0.02, cs: 3, es: 3, color2: dk(cover, 0.12) });
      s.sb(w - 0.01, 0.06, 0.2, PAL.white, { b: 0.35, z: dz - dl / 2 + 0.1, R: 0.06, r: 0.03, rb: 0.02, cs: 3, es: 2 });
      for (let i = 0; i < 2; i++) s.sb(w - 0.008, 0.012, 0.07, lt(cover, 0.45), { b: 0.384, z: dz + dl * (0.08 + i * 0.26), R: 0.03, r: 0.006, cs: 2, es: 1 });
    };
    if (D >= W) draw(b, W, D); else b.put((s) => draw(s, D, W), { ry: HP });
  },
  cardboard(b, W, D, H, rnd) {
    const along = W >= D, L = along ? W : D, S = along ? D : W, n = clamp(Math.round(L / Math.max(0.36, S * 0.95)), 1, 4), cells = [];
    let u = -L / 2;
    for (let i = 0; i < n; i++) {
      const len = i === n - 1 ? L / 2 - u : (L / n) * (0.88 + rnd() * 0.24), h = Math.min(H * 0.66, 0.22 + rnd() * 0.1), c = u + len / 2;
      carton(b, along ? c : 0, 0, along ? 0 : c, (along ? len : S) - 0.006, h, (along ? S : len) - 0.006, 0, rnd, false);
      cells.push([c, len, h]); u += len;
    }
    cells.forEach(([c, len, h], i) => {
      if (n > 1 && rnd() < 0.3 && i > 0) return;
      const m = Math.min(len, S), s = m * (0.5 + rnd() * 0.14), hh = Math.min(H - h, 0.16 + rnd() * 0.08);
      carton(b, along ? c : 0, h, along ? 0 : c, s, hh, s * (0.8 + rnd() * 0.15), (rnd() - 0.5) * 0.5, rnd, i === 0);
    });
  },
};
function umbrella(s, col, handle) {
  s.cy(0.004, 0.003, 0.05, PAL.steel, { b: 0, seg: 6, cls: 'metal' });
  s.rev([[0.005, 0.04], [0.016, 0.07], [0.033, 0.5], [0.031, 0.56], [0.012, 0.6], [0, 0.6]], col, { seg: 8, color2: dk(col, 0.15) });
  s.cy(0.0345, 0.034, 0.012, lt(col, 0.4), { y: 0.42, seg: 8 });
  s.cy(0.006, 0.006, 0.08, PAL.charcoal, { b: 0.59, seg: 6 });
  s.tube([[0, 0.66, 0], [0, 0.735, 0], [0.012, 0.772, 0], [0.04, 0.78, 0], [0.06, 0.755, 0], [0.06, 0.725, 0]], 0.0095, handle, { seg: 12, rad: 6, caps: true, cls: 'soft' });
}
const ROUND = {
  plant(b, r, H, rnd) {
    const pr = r * 0.8, ph = 0.3;
    b.rev([[0, 0], [pr * 0.6, 0], [pr * 0.66, 0.012], [pr * 0.9, ph - 0.055], [pr, ph - 0.05], [pr, ph], [pr * 0.86, ph], [pr * 0.84, ph - 0.03]], PAL.terracotta, { cls: 'soft', seg: 20, color2: dk(PAL.terracotta, 0.22) });
    b.cy(pr * 0.85, pr * 0.85, 0.01, PAL.soil, { b: ph - 0.035, seg: 16 });
    b.cy(0.011, 0.02, 0.5, PAL.brown, { b: ph - 0.03, seg: 6 });
    for (let i = 0; i < 17; i++) {
      const az = i * 2.4 + rnd() * 0.3, tilt = -0.28 + i * 0.07 + (rnd() - 0.5) * 0.12, len = r * (1.22 - i * 0.022) / Math.max(0.75, Math.cos(tilt)) * (0.95 + rnd() * 0.1);
      b.geo(leafGeo(), mix(i < 6 ? PAL.leaf : i < 12 ? PAL.green : PAL.leafLight, PAL.leafLight, rnd() * 0.3), { x: Math.cos(az) * 0.015, y: 0.37 + i * 0.024, z: Math.sin(az) * 0.015, ry: -az, rz: tilt, sx: len, sy: len, sz: len * 0.6, cls: 'soft' });
    }
  },
  kasa(b, r, H, rnd, v) {
    const sh = 0.42, cols = [[PAL.red, PAL.navy, PAL.yellow], [PAL.yellow, PAL.sky, PAL.navy], [PAL.navy, PAL.pink, PAL.teal]][v % 3];
    b.rev([[0, 0], [r * 0.86, 0], [r * 0.9, 0.012], [r * 0.9, sh - 0.012], [r * 0.95, sh], [r * 0.85, sh], [r * 0.82, sh - 0.014], [r * 0.82, 0.03], [0, 0.03]], PAL.white, { cls: 'gloss', seg: 20, color2: PAL.cream });
    b.cy(r * 0.905, r * 0.905, 0.05, PAL.navy, { y: sh * 0.72, seg: 20, open: true, cls: 'gloss' });
    cols.forEach((c, i) => {
      const a = i / 3 * TAU + 0.5 + rnd() * 0.5, lean = 0.1 + rnd() * 0.06;
      b.put((s) => umbrella(s, c, i === 2 ? PAL.woodLight : PAL.black), { x: Math.cos(a) * r * 0.2, y: 0.035, z: Math.sin(a) * r * 0.2, ry: -a, rz: -lean, sx: 1.55, sz: 1.55 });
    });
  },
  pillar(b, r, H) {
    b.cy(r, r, H - 0.004, PAL.wood, { b: 0, seg: 20, cls: 'soft', color2: dk(PAL.wood, 0.12) });
    b.cy(r, r, 0.004, PAL.wallCap, { b: H - 0.004, seg: 20 });
    b.cy(r * 1.0, r * 1.0, 0.03, dk(PAL.wood, 0.22), { b: 0, seg: 20, open: true, cls: 'soft', sx: 1.04, sz: 1.04 });
  },
  lamp(b, r, H, rnd) {
    b.cy(r * 0.7, r * 0.78, 0.028, PAL.charcoal, { b: 0, seg: 20, cls: 'soft' });
    b.cy(0.011, 0.011, H - 0.2, PAL.gold, { b: 0.02, seg: 8, cls: 'metal' });
    b.rev([[r * 0.96, 0.66], [r * 0.6, 0.94], [r * 0.57, 0.94]], PAL.cream, { seg: 20, color2: mix(PAL.cream, PAL.butter, 0.5) });
    b.rev([[r * 0.57, 0.94], [r * 0.93, 0.662]], WARM, { seg: 20, cls: 'glow' });
    b.ball(0.05, WARM, { y: 0.79, ws: 10, hs: 8, cls: 'glow' });
    b.cy(r * 0.93, r * 0.93, 0.003, mix(WARM, PAL.cream, 0.5), { y: 0.67, seg: 20 });
  },
  vase(b, r, H, rnd, v) {
    const vh = 0.42, glaze = [PAL.sky, PAL.teal, PAL.azuki][v % 3], bloom = [PAL.pink, PAL.white, PAL.yellow][v % 3];
    b.rev([[0, 0], [r * 0.5, 0], ...smooth2([[r * 0.56, 0.008], [r * 0.9, 0.09], [r * 0.99, 0.18], [r * 0.82, 0.29], [r * 0.44, 0.365], [r * 0.4, 0.395], [r * 0.52, vh]], 14), [r * 0.42, vh], [r * 0.34, 0.39]], PAL.white, { cls: 'gloss', seg: 20, color2: glaze });
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * TAU + rnd(), out = r * (0.5 + rnd() * 0.6), top = 0.6 + rnd() * (H - 0.64);
      const p0 = [0, vh - 0.04, 0], p1 = [Math.cos(a) * out * 0.3, vh + (top - vh) * 0.5, Math.sin(a) * out * 0.3], p2 = [Math.cos(a) * out, top, Math.sin(a) * out];
      b.tube([p0, p1, p2], 0.005, PAL.brown, { seg: 5, rad: 4 });
      for (const [t, s] of [[1, 1], [0.72, 0.8], [0.45, 0.65]]) {
        const q = t === 1 ? p2 : [lerp(p1[0], p2[0], (t - 0.3) / 0.7), lerp(p1[1], p2[1], (t - 0.3) / 0.7), lerp(p1[2], p2[2], (t - 0.3) / 0.7)];
        b.ball(0.03 * s, mix(bloom, PAL.white, rnd() * 0.4), { x: q[0] + (rnd() - 0.5) * 0.02, y: q[1] + 0.008, z: q[2] + (rnd() - 0.5) * 0.02, sy: 0.8, ws: 8, hs: 6 });
      }
    }
  },
  stool(b, r, H, rnd, v) {
    const wd = PAL.wood, seat = [PAL.azuki, PAL.mustard, PAL.fabricBlue, PAL.fabricGreen][v % 4];
    b.rev([[0, H - 0.085], [r * 0.9, H - 0.085], [r * 0.95, H - 0.07], [r * 0.95, H - 0.055]], wd, { cls: 'soft', seg: 20 });
    b.rev([[r * 0.95, H - 0.058], [r, H - 0.045], [r, H - 0.02], [r * 0.9, H - 0.002], [0, H]], seat, { seg: 20 });
    for (let k = 0; k < 4; k++) { const a = k * HP + PI / 4; b.cy(0.016, 0.02, H - 0.07, dk(wd, 0.1), { x: Math.cos(a) * r * 0.62, y: (H - 0.07) / 2, z: Math.sin(a) * r * 0.62, rz: Math.cos(a) * 0.14, rx: -Math.sin(a) * 0.14, seg: 8, cls: 'soft' }); }
    b.tor(r * 0.62, 0.008, dk(wd, 0.1), { y: 0.13, rx: HP, rs: 5, ts: 16, cls: 'soft' });
  },
  bin(b, r, H, rnd, v) {
    const col = [PAL.mint, PAL.fabricGrey, PAL.navy, PAL.woodLight][v % 4];
    b.rev([[0, 0], [r * 0.72, 0], [r * 0.76, 0.01], [r * 0.97, H - 0.014], [r, H], [r * 0.92, H], [r * 0.9, H - 0.016], [r * 0.7, 0.03], [0, 0.03]], col, { cls: 'soft', seg: 20, color2: dk(col, 0.14) });
    for (const [x, y, z, s] of [[-0.25, 0.5, 0.1, 0.42], [0.25, 0.56, -0.15, 0.36], [0.05, 0.7, 0.25, 0.34]]) b.ball(r * s, PAL.paper, { x: r * x, y: H * y, z: r * z, ws: 6, hs: 4, ry: x * 9 });
  },
};
const ROUND_KINDS = new Set(Object.keys(ROUND));
const KIND_SEED = {};
[...Object.keys(FURN), ...Object.keys(ROUND)].forEach((k, i) => { KIND_SEED[k] = (i + 1) * 977; });
const variantNum = (v, fallback) => (v == null ? fallback : typeof v === 'number' ? Math.abs(Math.round(v)) : Math.abs(strSeed(v)));
export function createStatic(kind, o = {}) {
  const face = FACE[o.face] != null ? o.face : 'S';
  let round = ROUND_KINDS.has(kind), w = o.w, d = o.d, r = o.r;
  if (round && r == null) { if (kind === 'pillar' && w > 0 && d > 0) round = false; else r = Math.min(w || 0.4, d || 0.4) / 2; }
  if (!round && !(w > 0 && d > 0)) { w = d = (r || 0.25) * 2; }
  const H = HEIGHTS[kind] || 0.5;
  const sd = o.seed == null ? 0 : variantNum(o.seed, 0) % 9973;
  const key = round ? `st|${kind}|${k4(r)}|${o.variant ?? ''}|${sd}` : `st|${kind}|${k4(w)}|${k4(d)}|${face}|${o.variant ?? ''}|${sd}`;
  return stamp(key, () => {
    const b = new MB(), seed = (KIND_SEED[kind] || 1) + (round ? k4(r) * 13 : k4(w) * 13 + k4(d) * 7) + sd * 31, rnd = rng(seed + variantNum(o.variant, 0) * 101);
    const v = variantNum(o.variant, Math.floor(hash2(seed, 5) * 12));
    if (round) ROUND[kind](b, r, H, rnd, v);
    else {
      const side = face === 'E' || face === 'W', lw = side ? d : w, ld = side ? w : d;
      if (FURN[kind]) FURN[kind](b, lw, ld, H, rnd, v);
      else if (kind === 'pillar') { b.sb(lw, H - 0.004, ld, PAL.wood, { b: 0, R: 0.01, r: 0, cls: 'soft' }); b.pb(lw, 0.004, ld, PAL.wallCap, { y: H - 0.002 }); }
      else b.sb(lw, H, ld, PAL.wood, { b: 0, cls: 'soft' });
    }
    const g = b.build();
    if (!round && FACE[face]) for (const m of g.children) { m.geometry.rotateY(FACE[face]); m.geometry.computeBoundingBox(); m.geometry.computeBoundingSphere(); }
    g.userData.h = H; g.userData.kind = kind;
    return g;
  });
}
const domeGeo = () => memo('dome', () => new THREE.SphereGeometry(1, 14, 5, 0, TAU, 0, HP));
const prismGeo = () => memo('prism', () => crease(new THREE.CylinderGeometry(0.046, 0.046, 0.07, 3).toNonIndexed(), 30));
const SHOES = {
  sneaker(b, v) {
    const col = [PAL.red, PAL.navy, PAL.sky, PAL.yellow][v % 4];
    b.sb(0.232, 0.024, 0.092, PAL.white, { b: 0, R: 0.042, r: 0.006, rb: 0.008, cs: 3, cls: 'soft' });
    b.sb(0.22, 0.05, 0.084, col, { x: -0.004, b: 0.02, R: 0.04, r: 0.03, cs: 3, es: 3 });
    b.ball(1, PAL.white, { x: 0.07, y: 0.04, sx: 0.045, sy: 0.026, sz: 0.04, ws: 10, hs: 6, cls: 'soft' });
    b.sb(0.11, 0.045, 0.078, col, { x: -0.055, b: 0.045, R: 0.036, r: 0.012, cs: 3, es: 2 });
    b.sb(0.082, 0.004, 0.05, PAL.charcoal, { x: -0.058, b: 0.0885, R: 0.024, r: 0, cs: 3, es: 1 });
    b.sb(0.07, 0.014, 0.04, PAL.white, { x: 0.014, y: 0.074, rz: -0.42, R: 0.015, r: 0.006, cs: 2, es: 1 });
    for (let i = 0; i < 3; i++) b.pb(0.009, 0.005, 0.052, PAL.white, { x: 0.002 + i * 0.022, y: 0.0795 - i * 0.0097, rz: -0.42 });
    for (const s of [1, -1]) for (const k of [0, 1]) b.pb(0.012, 0.04, 0.003, PAL.white, { x: -0.012 + k * 0.03, y: 0.046, z: s * 0.0425, rz: 0.5 });
    b.pb(0.006, 0.03, 0.02, PAL.white, { x: -0.112, y: 0.07 });
    return 0.095;
  },
  loafer(b, v) {
    const col = [mix(PAL.woodDark, PAL.black, 0.3), PAL.black, PAL.azuki][v % 3];
    b.sb(0.23, 0.014, 0.088, PAL.black, { b: 0, R: 0.04, r: 0.003, cs: 3, es: 1 });
    b.sb(0.226, 0.05, 0.084, col, { b: 0.012, R: 0.04, r: 0.03, cs: 3, es: 3, cls: 'gloss' });
    b.sb(0.1, 0.03, 0.076, col, { x: -0.058, b: 0.046, R: 0.034, r: 0.008, cs: 3, es: 2, cls: 'gloss' });
    b.sb(0.076, 0.004, 0.05, PAL.beige, { x: -0.058, b: 0.0735, R: 0.024, r: 0, cs: 3, es: 1 });
    b.sb(0.026, 0.01, 0.088, lt(col, 0.12), { x: 0.014, y: 0.063, rz: -0.2, R: 0.004, r: 0.003, cs: 1, es: 1, cls: 'gloss' });
    b.pb(0.01, 0.004, 0.024, PAL.gold, { x: 0.014, y: 0.069, rz: -0.2, cls: 'metal' });
    return 0.08;
  },
  boot(b, v) {
    const col = [PAL.yellow, PAL.red, PAL.sky][v % 3];
    b.sb(0.232, 0.016, 0.094, PAL.white, { b: 0, R: 0.042, r: 0.004, cs: 3, es: 1, cls: 'soft' });
    b.sb(0.226, 0.075, 0.09, col, { b: 0.012, R: 0.042, r: 0.036, cs: 3, es: 3, cls: 'gloss' });
    b.rev([[0.044, 0.05], [0.047, 0.185], [0.051, 0.2], [0.043, 0.2], [0.04, 0.09]], col, { x: -0.058, cls: 'gloss', seg: 14 });
    b.cy(0.0405, 0.0405, 0.003, dk(col, 0.55), { x: -0.058, y: 0.15, seg: 14 });
    b.cy(0.0495, 0.0485, 0.02, lt(col, 0.4), { x: -0.058, y: 0.184, seg: 14, open: true, cls: 'gloss' });
    return 0.2;
  },
  geta(b, v) {
    const col = [PAL.red, PAL.navy, PAL.azuki][v % 3];
    b.sb(0.225, 0.024, 0.098, PAL.woodLight, { b: 0.05, R: 0.036, r: 0.007, rb: 0.004, cs: 3, cls: 'soft', color2: dk(PAL.woodLight, 0.12) });
    for (const x of [0.045, -0.055]) b.sb(0.026, 0.052, 0.09, PAL.wood, { x, b: 0, R: 0.004, r: 0, cs: 1, es: 1, cls: 'soft' });
    for (const s of [1, -1]) b.tube([[0.064, 0.072, 0], [0.04, 0.1, s * 0.012], [-0.005, 0.1, s * 0.032], [-0.04, 0.074, s * 0.041]], 0.008, col, { seg: 8, rad: 5, caps: true });
    return 0.105;
  },
};
const TOYS = {
  car(b, v) {
    const col = [PAL.red, PAL.blue, PAL.yellow][v % 3];
    b.sb(0.185, 0.042, 0.094, col, { b: 0.02, R: 0.03, r: 0.016, rb: 0.008, cs: 3, cls: 'gloss' });
    b.sb(0.1, 0.04, 0.082, PAL.skyPale, { x: -0.008, b: 0.058, R: 0.028, r: 0.016, cs: 3, cls: 'gloss' });
    b.sb(0.082, 0.01, 0.07, PAL.white, { x: -0.008, b: 0.094, R: 0.022, r: 0.006, cs: 3, cls: 'gloss' });
    for (const sx of [1, -1]) for (const sz of [1, -1]) { b.cy(0.024, 0.024, 0.02, PAL.black, { x: sx * 0.056, y: 0.024, z: sz * 0.044, rx: HP, seg: 12, cls: 'soft' }); b.cy(0.011, 0.011, 0.022, PAL.chrome, { x: sx * 0.056, y: 0.024, z: sz * 0.044, rx: HP, seg: 8, cls: 'metal' }); }
    for (const sz of [1, -1]) b.ball(0.01, PAL.butter, { x: 0.092, y: 0.044, z: sz * 0.03, sx: 0.5, ws: 6, hs: 4, cls: 'glow' });
    b.pb(0.006, 0.012, 0.08, PAL.chrome, { x: 0.094, y: 0.028, cls: 'metal' });
    return 0.105;
  },
  duck(b) {
    const Y = PAL.yellow, G = { cls: 'gloss' };
    b.ball(1, Y, { x: -0.008, y: 0.048, sx: 0.08, sy: 0.048, sz: 0.06, ws: 14, hs: 10, ...G });
    b.geo(memo('catSpike', () => new THREE.ConeGeometry(1, 1, 5, 1)), Y, { x: -0.082, y: 0.07, sx: 0.02, sy: 0.04, sz: 0.03, rz: 0.9, ...G });
    b.ball(0.042, Y, { x: 0.04, y: 0.105, ws: 12, hs: 8, ...G });
    b.ball(1, PAL.orange, { x: 0.082, y: 0.098, sx: 0.022, sy: 0.009, sz: 0.022, ws: 8, hs: 4, ...G });
    for (const s of [1, -1]) { b.ball(0.007, PAL.black, { x: 0.066, y: 0.115, z: s * 0.028, ws: 6, hs: 4, ...G }); b.ball(1, PAL.yellowDark, { x: -0.012, y: 0.055, z: s * 0.056, sx: 0.045, sy: 0.026, sz: 0.012, ws: 8, hs: 6, ...G }); }
    return 0.147;
  },
  blocks(b) {
    const S = { R: 0.008, r: 0.006, cs: 1, es: 1, cls: 'soft' };
    b.sb(0.075, 0.075, 0.075, PAL.red, { x: -0.035, b: 0, z: -0.02, ry: 0.2, ...S });
    b.cy(0.034, 0.034, 0.075, PAL.blue, { x: 0.05, b: 0, z: 0.012, seg: 14, cls: 'soft' });
    b.geo(prismGeo(), PAL.yellow, { x: -0.035, y: 0.098, z: -0.02, rx: -HP, ry: 0.2, cls: 'soft' });
    b.sb(0.11, 0.024, 0.036, PAL.green, { x: 0.005, b: 0, z: 0.072, ry: -0.25, ...S });
    return 0.145;
  },
};
const BODY = {
  chair: { r: 0.26, build(b, v) {
    const seat = [PAL.blue, PAL.red, PAL.teal, PAL.mustard][v % 4], fr = PAL.charcoal;
    for (let k = 0; k < 5; k++) {
      const a = k / 5 * TAU + 0.3, c = Math.cos(a), s = Math.sin(a);
      b.sb(0.19, 0.024, 0.04, fr, { x: c * 0.105, y: 0.066, z: s * 0.105, ry: -a, R: 0.012, r: 0.008, cs: 1, es: 1, cls: 'soft' });
      b.cy(0.027, 0.027, 0.024, PAL.black, { x: c * 0.2, y: 0.027, z: s * 0.2, rx: HP, ry: -a, seg: 10, cls: 'soft' });
    }
    b.cy(0.04, 0.046, 0.05, fr, { b: 0.05, seg: 12, cls: 'soft' });
    b.cy(0.017, 0.017, 0.2, PAL.chrome, { b: 0.1, seg: 8, cls: 'metal' });
    b.cy(0.03, 0.034, 0.09, fr, { b: 0.1, seg: 10, cls: 'soft' });
    b.sb(0.3, 0.03, 0.3, fr, { b: 0.295, R: 0.07, r: 0.006, cls: 'soft' });
    b.sb(0.39, 0.075, 0.39, seat, { x: 0.01, b: 0.32, R: 0.12, r: 0.04, rb: 0.025, cs: 3, es: 2, color2: dk(seat, 0.15) });
    b.tube([[-0.13, 0.31, 0], [-0.2, 0.33, 0], [-0.228, 0.42, 0], [-0.218, 0.52, 0]], 0.015, fr, { seg: 8, rad: 6, cls: 'soft' });
    const n0 = b.n('matte');
    b.sb(0.06, 0.25, 0.36, seat, { x: -0.2, b: 0.46, R: 0.03, r: 0.03, rb: 0.03, cs: 3, es: 3, color2: dk(seat, 0.15) });
    b.edit('matte', n0, (p, c, nn, i) => { const z = p[i + 2]; p[i] += z * z * 2.2 - (p[i + 1] - 0.46) * 0.12; });
    return 0.72;
  } },
  ball: { r: 0.12, build(b, v) {
    const set = [[PAL.red, PAL.white, PAL.sky, PAL.white, PAL.yellow, PAL.white], [PAL.sky, PAL.white, PAL.sky, PAL.white, PAL.sky, PAL.white], [PAL.red, PAL.yellow, PAL.red, PAL.yellow, PAL.red, PAL.yellow]][v % 3].map((c) => linear(c)), cap = linear(PAL.navy);
    b.put((s) => {
      s.ball(0.12, PAL.white, { ws: 24, hs: 16, cls: 'gloss' });
      const k = s.b.gloss;
      for (let i = 0; i < k.p.length; i += 9) {
        const x = (k.p[i] + k.p[i + 3] + k.p[i + 6]) / 3, y = (k.p[i + 1] + k.p[i + 4] + k.p[i + 7]) / 3, z = (k.p[i + 2] + k.p[i + 5] + k.p[i + 8]) / 3;
        const col = Math.abs(y) > 0.103 ? cap : set[Math.floor(((Math.atan2(z, x) / TAU) + 1.5) * 6 + 1e-4) % 6];
        for (let j = 0; j < 9; j += 3) setc(k.c, i + j, col);
      }
    }, { y: 0.12, rz: -0.55, rx: 0.3 });
    return 0.24;
  } },
  robot: { r: 0.17, build(b) {
    b.rev([[0, 0.008], [0.15, 0.008], [0.166, 0.018], [0.17, 0.04], [0.168, 0.068], [0.158, 0.08], [0, 0.082]], PAL.white, { cls: 'soft', seg: 28, color2: PAL.linen });
    b.cy(0.1712, 0.1712, 0.022, PAL.charcoal, { y: 0.04, seg: 28, open: true, cls: 'soft' });
    b.cy(0.118, 0.118, 0.004, PAL.black, { b: 0.0815, seg: 24, cls: 'gloss' });
    b.cy(0.046, 0.052, 0.02, PAL.charcoal, { x: -0.052, b: 0.084, seg: 16, cls: 'soft' });
    b.cy(0.03, 0.03, 0.003, PAL.chrome, { x: -0.052, b: 0.104, seg: 12, cls: 'metal' });
    b.tor(0.027, 0.006, PAL.teal, { x: 0.068, y: 0.087, rx: HP, rs: 4, ts: 14, cls: 'glow' });
    b.cy(0.017, 0.017, 0.004, PAL.white, { x: 0.068, b: 0.085, seg: 10, cls: 'soft' });
    b.pb(0.005, 0.004, 0.06, PAL.teal, { x: 0.14, y: 0.0825, cls: 'glow' });
    for (const s of [1, -1]) for (let k = 0; k < 3; k++) b.pb(0.07, 0.003, 0.007, PAL.yellow, { x: 0.105, y: 0.006, z: s * 0.105, ry: k * 1.05 + 0.3 });
    return 0.107;
  } },
  shoe: { r: 0.12, named: ['sneaker', 'loafer', 'boot', 'geta'], build(b, v, name) { return SHOES[name](b, v); } },
  slipper: { r: 0.12, build(b, v) {
    const col = [PAL.pink, PAL.mint, PAL.fabricBlue, PAL.mustard, PAL.cream][v % 5];
    b.sb(0.235, 0.02, 0.1, PAL.beige, { b: 0, R: 0.046, r: 0.007, cs: 3, color2: dk(PAL.beige, 0.15) });
    b.sb(0.215, 0.006, 0.082, lt(col, 0.6), { b: 0.018, R: 0.04, r: 0.004, cs: 3, es: 1 });
    b.geo(domeGeo(), col, { x: 0.04, y: 0.018, sx: 0.079, sy: 0.058, sz: 0.054 });
    b.geo(domeGeo(), dk(col, 0.5), { x: -0.014, y: 0.019, sx: 0.036, sy: 0.046, sz: 0.042 });
    b.tor(0.046, 0.007, lt(col, 0.35), { x: -0.022, y: 0.02, rz: -0.12, ry: HP, rs: 5, ts: 12, arc: PI, sx: 0.95 });
    return 0.078;
  } },
  cushion: { r: 0.25, build(b, v) {
    const col = [PAL.azuki, PAL.mustard, PAL.navy, PAL.fabricGreen, PAL.purple][v % 5], s = 0.375;
    b.sb(s, 0.09, s, col, { b: 0, R: 0.075, r: 0.045, rb: 0.04, cs: 4, es: 3, color2: dk(col, 0.14) });
    b.sb(s - 0.11, 0.004, s - 0.11, lt(col, 0.14), { b: 0.088, R: 0.04, r: 0.004, cs: 3, es: 1 });
    b.ball(0.014, PAL.cream, { y: 0.092, sy: 0.6, ws: 8, hs: 6 });
    for (const sx of [1, -1]) for (const sz of [1, -1]) b.ball(0.013, PAL.cream, { x: sx * (s / 2 - 0.026), y: 0.046, z: sz * (s / 2 - 0.026), ws: 6, hs: 4 });
    return 0.095;
  } },
  box: { r: 0.2, build(b, v, name, rnd) { carton(b, 0, 0, 0, 0.275, 0.27, 0.275, 0, rnd, false); return 0.272; } },
  toy: { r: 0.1, named: ['car', 'duck', 'blocks'], build(b, v, name) { return TOYS[name](b, v); } },
};
export function createBody(kind, o = {}) {
  const g = new THREE.Group(), def = BODY[kind];
  g.userData.kind = kind;
  if (kind === 'cat') {
    const variant = CATV[o.variant] ? o.variant : Object.keys(CATV)[variantNum(o.variant ?? o.seed, 0) % 5], r = o.r || CAT_R;
    const inner = stamp('cat|' + variant, () => buildCat(variant));
    inner.scale.setScalar(r / CAT_R); g.add(inner);
    g.userData.anim = catAnim(inner); g.userData.h = HEIGHTS.cat * r / CAT_R;
    return g;
  }
  if (!def) {
    const b = new MB(), r = o.r || 0.2, h = HEIGHTS[kind] || 0.3;
    b.cy(r, r, h, PAL.steel, { b: 0, cls: 'soft' });
    g.add(b.build()); g.userData.h = h; g.userData.anim = () => {};
    return g;
  }
  const r = o.r || def.r, named = def.named;
  const name = named ? (named.includes(o.variant) ? o.variant : named[variantNum(o.variant ?? o.seed, 0) % named.length]) : '';
  const v = variantNum(named ? o.seed : (o.variant ?? o.seed), 0) % 12;
  const inner = stamp(`bd|${kind}|${name}|${v}`, () => {
    const b = new MB(), h = def.build(b, v, name, rng(strSeed(kind) + v * 131));
    const t = b.build(); t.name = 'inner'; t.userData.h = h;
    return t;
  });
  const k = r / def.r; inner.scale.setScalar(k); g.add(inner);
  g.userData.h = inner.userData.h * k;
  let own = 0;
  g.userData.anim = (t, dt, st = {}) => {
    if (kind !== 'robot') return;
    own += clamp(dt || 0, 0, 0.05) * clamp((st.speed || 0) * 2.2, 0, 7);
    inner.rotation.y = -own;
  };
  return g;
}
const DECOR = {
  futon(b, w, d, v) {
    const cover = [PAL.sky, PAL.pink, PAL.mint, PAL.mustard][v % 4], lining = PAL.cream, T = FUTON_TOP;
    b.sb(w * 0.94, T, d * 0.97, mix(PAL.white, PAL.linen, 0.45), { b: 0, R: 0.09, r: 0.03, cs: 4, es: 2, color2: PAL.linen });
    const pz = Math.max(-d / 2 + 0.22, -0.6), pw = Math.min(0.46, w * 0.5);
    b.sb(pw, 0.075, 0.28, PAL.white, { b: T - 0.006, z: pz, R: 0.09, r: 0.036, rb: 0.02, cs: 4, es: 3 });
    b.sb(pw - 0.1, 0.0775, 0.284, mix(cover, PAL.white, 0.5), { b: T - 0.006, z: pz, R: 0.03, r: 0.029, rb: 0.012, cs: 2, es: 3 });
    const k0 = Math.min(0.16, d * 0.1), k1 = d / 2 * 0.97, kl = k1 - k0, kw = w * 0.98, top = T + 0.082;
    b.sb(kw, 0.092, kl, cover, { b: T - 0.01, z: (k0 + k1) / 2, R: 0.1, r: 0.046, rb: 0.03, cs: 4, es: 3, color2: dk(cover, 0.1) });
    const rnd = rng(31 + v);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      const x = (i - 1.5) * kw * 0.21 + (j % 2 ? kw * 0.105 : 0) + (rnd() - 0.5) * 0.03, z = k0 + 0.42 + j * (kl - 0.52) / 2.6 + (rnd() - 0.5) * 0.03;
      if (Math.abs(x) < kw / 2 - 0.09 && z < k1 - 0.09) b.cy(0.032, 0.032, 0.002, PAL.white, { x, y: top + 0.0006, z, seg: 14 });
    }
    b.sb(kw, 0.08, 0.3, lining, { b: T + 0.05, z: k0 + 0.17, ry: 0.03, R: 0.1, r: 0.038, rb: 0.032, cs: 4, es: 3, color2: dk(lining, 0.08) });
    b.sb(kw * 0.99, 0.03, 0.06, cover, { b: T + 0.045, z: k0 + 0.325, ry: 0.03, R: 0.03, r: 0.014, cs: 2, es: 2 });
  },
  rug(b, w, d, v) {
    const along = w >= d, L = along ? w : d, S = along ? d : w, T = 0.012;
    b.put((s) => {
      if (v % 3 === 2) {
        const cols = [mix(PAL.mustard, PAL.cream, 0.35), PAL.cream, mix(PAL.teal, PAL.cream, 0.45), PAL.cream, mix(PAL.terracotta, PAL.cream, 0.4), PAL.cream, mix(PAL.mustard, PAL.cream, 0.35)].map((c) => linear(c)), pts = [[1, 0], [1, T * 0.5]];
        for (let i = 7; i >= 0; i--) pts.push([i / 7 * 0.985, T]);
        s.rev(pts, PAL.cream, { seg: 40 });
        const k = s.b.matte;
        for (let i = 0; i < k.p.length; i += 9) {
          const r = Math.hypot(k.p[i] + k.p[i + 3] + k.p[i + 6], k.p[i + 2] + k.p[i + 5] + k.p[i + 8]) / 3;
          if (k.p[i + 1] + k.p[i + 4] + k.p[i + 7] > T * 2.7) { const col = cols[Math.min(6, Math.floor(r * 7 / 0.985))]; for (let j = 0; j < 9; j += 3) setc(k.c, i + j, col); }
        }
        for (let i = 0; i < k.p.length; i += 3) { k.p[i] *= L / 2; k.p[i + 2] *= S / 2; }
        return;
      }
      const base = v % 3 === 1 ? mix(PAL.red, PAL.cream, 0.62) : PAL.cream;
      s.sb(L - 0.08, T, S, base, { b: 0, R: 0.02, r: 0.005, cs: 2, es: 1, color2: dk(base, 0.1) });
      if (v % 3 === 1) {
        const nx = Math.max(3, Math.round((L - 0.08) / 0.22)), nz = Math.max(3, Math.round(S / 0.22)), cw = (L - 0.12) / nx, cd = (S - 0.04) / nz;
        for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) if ((i + j) % 2 === 0) s.pb(cw, 0.001, cd, PAL.cream, { x: -(L - 0.12) / 2 + cw * (i + 0.5), y: T + 0.0005, z: -(S - 0.04) / 2 + cd * (j + 0.5) });
          else if (i % 2 === 0) s.pb(cw, 0.001, cd, mix(PAL.red, PAL.cream, 0.38), { x: -(L - 0.12) / 2 + cw * (i + 0.5), y: T + 0.0005, z: -(S - 0.04) / 2 + cd * (j + 0.5) });
      } else {
        for (const k of [1, -1]) {
          s.pb(0.1, 0.001, S - 0.02, PAL.navy, { x: k * (L / 2 - 0.2), y: T + 0.0005 });
          s.pb(0.022, 0.001, S - 0.02, PAL.red, { x: k * (L / 2 - 0.29), y: T + 0.0005 });
          s.pb(0.022, 0.001, S - 0.02, PAL.mustard, { x: k * (L / 2 - 0.33), y: T + 0.0005 });
        }
        s.pb(0.03, 0.001, S - 0.02, PAL.navy, { y: T + 0.0005 });
      }
      const nf = Math.max(4, Math.round(S / 0.06));
      for (const k of [1, -1]) for (let i = 0; i < nf; i++) s.pb(0.045, 0.005, 0.014, PAL.cream, { x: k * (L / 2 - 0.022), y: 0.003, z: -S / 2 + (i + 0.5) * S / nf });
    }, { ry: along ? 0 : HP });
  },
  doormat(b, w, d, v) {
    const base = mix(PAL.brown, PAL.beige, 0.55), dark = mix(PAL.brown, PAL.woodDark, 0.4), T = 0.016;
    b.sb(w, T, d, dark, { b: 0, R: 0.03, r: 0.006, cs: 3, es: 1 });
    b.sb(w - 0.07, 0.003, d - 0.07, base, { b: T - 0.001, R: 0.018, r: 0.002, cs: 2, es: 1 });
    const n = Math.max(3, Math.round(d / 0.06));
    for (let i = 1; i < n; i++) b.pb(w - 0.09, 0.0012, 0.006, lt(base, 0.12), { y: T + 0.0024, z: -d / 2 + 0.035 + (d - 0.07) * i / n });
    const k = Math.min(w, d * 2) / 0.9, y = T + 0.0034;
    for (const [ox, rot] of [[-0.14, -0.25], [0.16, 0.2]]) {
      const c = Math.cos(rot), s = Math.sin(rot), at = (x, z) => [ox * k + (x * c - z * s) * k, (ox > 0 ? -0.03 : 0.03) * k + (x * s + z * c) * k];
      const [px, pz] = at(0, 0.03); b.cy(0.05 * k, 0.05 * k, 0.002, dark, { x: px, y, z: pz, seg: 12, sz: 0.85 });
      for (const [tx, tz] of [[-0.06, -0.035], [-0.022, -0.065], [0.022, -0.065], [0.06, -0.035]]) { const [qx, qz] = at(tx, tz); b.cy(0.021 * k, 0.021 * k, 0.002, dark, { x: qx, y, z: qz, seg: 8 }); }
    }
  },
};
export function createDecor(kind, o = {}) {
  const w = o.w || 1, d = o.d || 1, v = variantNum(o.variant, 0);
  return stamp(`dc|${kind}|${k4(w)}|${k4(d)}|${v}`, () => {
    const b = new MB();
    if (DECOR[kind]) DECOR[kind](b, w, d, v); else b.sb(w, 0.012, d, PAL.cream, { b: 0 });
    const g = b.build({ cast: kind === 'futon' }); g.userData.kind = kind;
    return g;
  });
}
