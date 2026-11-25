import * as THREE from 'three';
export const PAL = {
  wallSide: '#f4ede2', wallCap: '#3a2e28', wallTrim: '#e2d6c3', frame: '#8a6a4c',
  oak: '#dba968', oakDark: '#c8904f', oakLight: '#e9c189', hall: '#cf9a5c',
  tatami: '#b9c188', tatamiDark: '#a3ad74', heri: '#3e5a3b',
  tile: '#ded7cb', tileDark: '#cdc5b7', doma: '#b9b1a5', domaDark: '#a39b8f', step: '#9c7b58',
  grass: '#8ebd6b', grassDark: '#74a856', stone: '#d9d2c4', soil: '#8a6b4f',
  wood: '#b98452', woodDark: '#7f5733', woodLight: '#e6c594', woodRed: '#9a5a3c',
  white: '#fbf8f1', cream: '#f2e7d2', paper: '#fffaf0', linen: '#ece3d3',
  navy: '#2e4374', navyDark: '#22335c', blue: '#4f86d9', sky: '#73b9f2', skyPale: '#cfe7fb',
  red: '#e5392f', redDark: '#b82a23', orange: '#f28a3c', yellow: '#ffd23f', yellowDark: '#e6b422',
  green: '#57a55a', leaf: '#3f8f4a', leafLight: '#7cc071', teal: '#35b5a6', mint: '#bfe6d6',
  pink: '#f3a9b5', pinkPale: '#f9d7dc', purple: '#9c7fd0', beige: '#d8c49c', brown: '#8c6a4a',
  fabricBlue: '#6f8fbf', fabricBlueDark: '#5a78a6', fabricGrey: '#a9adb6', fabricGreen: '#7b9e6b',
  steel: '#8f969e', steelDark: '#5f666e', chrome: '#c9cfd6', black: '#262a31', charcoal: '#3b4048', rubber: '#34373d',
  terracotta: '#bd6a41', skin: '#f6cba4', skinShade: '#eab58c', hair: '#3a2a22',
  cat: '#f0a04b', catDark: '#d98432', catPale: '#fbe3c0', catWhite: '#fdfbf6', catBlack: '#2f2c2b', catGrey: '#8f9299',
  toast: '#e0a45a', toastCrust: '#b9783a', butter: '#ffe27a', glassBlue: '#9fd0f5', screen: '#7fd0ff',
  aim: '#2f7fd0', trail: '#ff6b5e', gold: '#f5c542', silver: '#cfd6de', bronze: '#d08a55',
  cardboard: '#c99f6a', mustard: '#dba63c', azuki: '#9b4a4f',
  soilDark: '#6e533c', leafDark: '#2c6a39', stoneDark: '#b4ab9b', floorInk: '#4a3526', sun: '#ff7a3d', ink: '#1e2742', inkMuted: '#6b7088', paperUi: '#fffbf3',
};
const _col = new THREE.Color();
export function linear(hex) { _col.set(hex); return [_col.r, _col.g, _col.b]; }
function std(o) { return new THREE.MeshStandardMaterial({ vertexColors: true, ...o }); }
export const MATS = {
  matte: std({ roughness: 0.86, metalness: 0 }),
  soft: std({ roughness: 0.58, metalness: 0 }),
  gloss: std({ roughness: 0.22, metalness: 0 }),
  metal: std({ roughness: 0.34, metalness: 0.92 }),
  glow: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
  glass: std({ roughness: 0.08, metalness: 0, transparent: true, opacity: 0.38, depthWrite: false }),
};
for (const k in MATS) MATS[k].name = 'nf-' + k;
const _geoCache = new Map();
export function roundedBoxGeo(w, h, d, r = 0.02, s = 2) {
  r = Math.max(0, Math.min(r, w / 2, h / 2, d / 2));
  const key = [w, h, d, r, s].map((v) => Math.round(v * 1e4)).join('_');
  let g = _geoCache.get(key);
  if (g) return g;
  if (r < 1e-4) { g = new THREE.BoxGeometry(w, h, d).toNonIndexed(); _geoCache.set(key, g); return g; }
  const seg = s * 2 + 1;
  g = new THREE.BoxGeometry(1, 1, 1, seg, seg, seg).toNonIndexed();
  const p = g.attributes.position.array, n = g.attributes.normal.array;
  const bx = w / 2 - r, by = h / 2 - r, bz = d / 2 - r, half = 0.5 / seg;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.length; i += 3) {
    const x = p[i], y = p[i + 1], z = p[i + 2];
    v.set(x - Math.sign(x) * half, y - Math.sign(y) * half, z - Math.sign(z) * half).normalize();
    p[i] = bx * Math.sign(x) + v.x * r; p[i + 1] = by * Math.sign(y) + v.y * r; p[i + 2] = bz * Math.sign(z) + v.z * r;
    n[i] = v.x; n[i + 1] = v.y; n[i + 2] = v.z;
  }
  g.deleteAttribute('uv');
  _geoCache.set(key, g);
  return g;
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const _nm = new THREE.Matrix3(), _v = new THREE.Vector3();
export class Builder {
  constructor() { this.b = {}; }
  geo(geometry, color, o = {}) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    const cls = o.cls || 'matte';
    const bk = this.b[cls] || (this.b[cls] = { p: [], n: [], c: [] });
    _e.set(o.rx || 0, o.ry || 0, o.rz || 0, 'YXZ'); _q.setFromEuler(_e);
    _p.set(o.x || 0, o.y || 0, o.z || 0); _s.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1);
    _m.compose(_p, _q, _s); _nm.getNormalMatrix(_m);
    const pa = g.attributes.position.array, na = g.attributes.normal.array;
    const c1 = linear(color), c2 = o.color2 ? linear(o.color2) : null;
    let y0 = Infinity, y1 = -Infinity;
    if (c2) for (let i = 1; i < pa.length; i += 3) { if (pa[i] < y0) y0 = pa[i]; if (pa[i] > y1) y1 = pa[i]; }
    for (let i = 0; i < pa.length; i += 3) {
      const py = pa[i + 1];
      _v.set(pa[i], py, pa[i + 2]).applyMatrix4(_m); bk.p.push(_v.x, _v.y, _v.z);
      _v.set(na[i], na[i + 1], na[i + 2]).applyMatrix3(_nm).normalize(); bk.n.push(_v.x, _v.y, _v.z);
      if (c2) { const t = (py - y0) / Math.max(1e-6, y1 - y0); bk.c.push(c2[0] + (c1[0] - c2[0]) * t, c2[1] + (c1[1] - c2[1]) * t, c2[2] + (c1[2] - c2[2]) * t); }
      else bk.c.push(c1[0], c1[1], c1[2]);
    }
    return this;
  }
  box(w, h, d, color, o = {}) {
    const r = o.r ?? Math.min(0.03, Math.min(w, h, d) * 0.12);
    return this.geo(roundedBoxGeo(w, h, d, r, o.seg ?? 2), color, o);
  }
  cyl(rTop, rBot, h, color, o = {}) { return this.geo(new THREE.CylinderGeometry(rTop, rBot, h, o.seg ?? 24, 1, !!o.open), color, o); }
  sph(r, color, o = {}) { return this.geo(new THREE.SphereGeometry(r, o.seg ?? 20, Math.max(8, Math.round((o.seg ?? 20) * 0.6))), color, o); }
  lathe(pts, color, o = {}) { return this.geo(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), o.seg ?? 24), color, o); }
  torus(R, r, color, o = {}) { return this.geo(new THREE.TorusGeometry(R, r, 10, o.seg ?? 24), color, o); }
  cap(r, len, color, o = {}) { return this.geo(new THREE.CapsuleGeometry(r, len, 6, o.seg ?? 14), color, o); }
  build({ cast = true, receive = true } = {}) {
    const grp = new THREE.Group();
    for (const cls in this.b) {
      const bk = this.b[cls];
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(bk.p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(bk.n, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(bk.c, 3));
      g.computeBoundingSphere(); g.computeBoundingBox();
      const mesh = new THREE.Mesh(g, MATS[cls] || MATS.matte);
      mesh.name = cls;
      const solid = cls !== 'glow' && cls !== 'glass';
      mesh.castShadow = cast && solid; mesh.receiveShadow = receive && solid;
      if (cls === 'glass') mesh.renderOrder = 5;
      grp.add(mesh);
    }
    this.b = {};
    return grp;
  }
}
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
export function hash2(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
