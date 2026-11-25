import * as THREE from 'three';
import { PAL, MATS, Builder, roundedBoxGeo, linear, clamp, lerp, damp, TAU } from './kit.js';
import * as MODELS from './models.js';
const T = {
  fov: 20,
  tiltPlay: 20, tiltTitle: 50, tiltFinish: 38, tiltResult: 21, tiltResultNear: 40, yawResultNear: 10,
  resultBand: 0.42, resultSpan: 2.3, resultPx: 70,
  yawTitle: -18, yawFinish: 8,
  fitMargin: 0.2, fitSouth: 1.4, fitPad: 8,
  titleSpan: [3.3, 4.6], finishSpan: [4.4, 5.2],
  introSec: 1.2, introFastSec: 0.5, modeSec: 0.9, finishSec: 1.1,
  shake: 0.011, shakeDecay: 8, speedZoom: 0.02, speedLead: 0.03,
  view: 'near',
  nearPx: 78,
  nearZoom: [1.3, 2.1],
  nearLeadSec: 0.55, nearLeadMax: 0.9, nearLeadRate: 2.6,
  viewOutSec: 0.35, viewInSec: 0.5,
  nearAimK: 0,
  viewCutSec: 0.45, viewJump: 0.8,
  viewMargin: 0.25,
  aimPullMin: 0.08,
  wideSide: 0.02, wideMaxZoom: 1.6,
  wideKeep: 1.1, wideAimRate: 5,
  sunAz: 46, sunEl: 34, sunCol: '#ffe0bd', sunPow: 1.25, sunSoft: 0.045,
  skyCol: '#c2d7ff', skyPow: 0.9, horizonCol: '#fff1df', bounceCol: '#ffd9a8', bouncePow: 0.42,
  winCol: '#ffd29c', winPow: 1.25, winSill: 0.07, winHead: 1.3, doorGlow: 0.55,
  outBoost: 1.22,
  dustCol: '#fff0d8', glowCol: '#ffe2b0', leakCol: '#ffd9b0', leak: 0.06, contactCol: '#5d4a5c', ghostTint: '#cfe6ff',
  iconKey: ['#fff0dc', 2.3], iconFill: ['#cfe2ff', 0.7],
  skyRefl: '#c6d8f2', skyReflPow: 0.44, ceilH: 2.6,
  streakEvery: 4.8, streakSec: 1.6, streakPow: 0.95, streakW: 0.17,
  wallH: 0.5, wallSouthH: 0.22, halfH: 0.3, domaDrop: 0.1, lawnDrop: 0.15,
  plinthM: 0.47, plinthS: 2.5, plinthR: 0.42, soilT: 0.09, baseT: 0.34,
  labelSize: 0.27, labelInk: 0.56, skirt: 0.008, fusumaOver: 0.012,
  reflBlur: 0.045, reflFade: 0.95, reflMaxLod: 3.2, reflStretch: 1.6, reflAmbient: 2.7,
  exposure: 0.8, saturation: 1.06, contrast: 0.3, bloom: 0.24, bloomThresh: 1.1,
  warm: [1.02, 1.0, 0.972], vignette: 0.24,
  tiltBlurPx: 7, tiltBand: 0.33,
  bg: ['#d3e4f3', '#a9c8e6', '#ffdcb8'],
  itemSpin: 13, itemLift: 0.3, itemLiftSec: 0.3, vanishSec: 0.28, glintStep: 0.16, faceSpeed: 0.05,
  smallR: 0.15, smallMax: 1.4,
  dotGap: 0.22, dotMinGapPx: 12.5, dotR: 0.075, dotMinPx: 4.2, dotFlow: 0.55, dotMax: 80,
  goLen: [0.5, 1.2], goW: [0.075, 0.135], goMinPx: 5, goMinLenPx: [30, 58],
  bandLen: [0.3, 1.4], bandMinLenPx: [16, 60], bandBase: 0.17, bandW: 0.024, bandMinPx: 1.6,
  bandHint: 0.62,
  snapSec: 0.1, slackSec: 0.16,
  tipSize: 0.46, tipMinPx: 24,
  labelPx: 17, labelGap: 7, labelFollow: 13, bangPx: 46,
  coachZone: [[-128, -98, 102, 74], [-60, -44, 120, 88], [26, 24, 102, 74]],
  trailW: 0.25, trailOpacity: 0.86, trailFade: 5.5, trailMin: 0.46, trailWhite: 0.14, trailGlow: 1.08, trailSnap: [1.0, 0.96],
  ringR: 0.44, ringLift: 0.2, chevFlow: 0.32,
  autoWorkMs: 12.5, autoFrameMs: 42, autoFrames: 70, autoSkip: 30, autoStrikes: 2,
  snapSize: [720, 1200], snapMsaa: 4,
};
const QUALITY = {
  high: { dpr: 2, msaa: 4, refl: 0.5, reflQ: 2, shadow: 2048, shq: 2, blk: 10, pcf: 16, bloom: true, tilt: true },
  mid: { dpr: 2, msaa: 4, refl: 0.25, reflQ: 1, shadow: 2048, shq: 1, blk: 6, pcf: 10, bloom: false, tilt: true },
  low: { dpr: 1.5, msaa: 2, refl: 0, reflQ: 0, shadow: 1024, shq: 0, blk: 4, pcf: 4, bloom: false, tilt: false },
};
const ITEM_IDS = ['keshi', 'kutsu', 'toast', 'sumaho', 'kyoka', 'suito', 'rando'];
const FLOOR_KIND = { oak: 0, hall: 1, tatami: 2, tile: 3, doma: 4 };
const SMALL_KIND = { shoe: 1, slipper: 1, toy: 1 };
const D2R = Math.PI / 180;
const FONT = '"Zen Maru Gothic", "Hiragino Maru Gothic ProN", "Hiragino Sans", "Yu Gothic", sans-serif';
const HEIGHTS = MODELS.HEIGHTS || {};
const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const smooth = (a, b, v) => { const k = clamp((v - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
const backOut = (k) => { const c = 2.2; const x = k - 1; return 1 + (c + 1) * x * x * x + c * x * x; };
function srgb(hex) { const n = parseInt(hex.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
function lin(hex, k = 1) { const c = new THREE.Color(hex); return new THREE.Vector3(c.r * k, c.g * k, c.b * k); }
function makeRnd(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
function angDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3();
const _m4 = new THREE.Matrix4(), _m4b = new THREE.Matrix4(), _nm = new THREE.Matrix3(), _q = new THREE.Quaternion();
const GL_COMMON =  `
float h11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float sdBox(vec2 p, vec2 b){ vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
float sdRBox(vec2 p, vec2 b, float r){ return sdBox(p, b - r) - r; }
`;
const GL_SHADOW =  `
uniform sampler2D uShadowMap; uniform mat4 uShadowMatrix;
uniform vec4 uShadowPar;   // x,y = 1 m あたりの uv、z = 奥行きの幅（m）、w = 使うか
uniform float uSunSoft;
const vec2 POI[16] = vec2[16](
  vec2(-0.94201624, -0.39906216), vec2(0.94558609, -0.76890725), vec2(-0.094184101, -0.92938870), vec2(0.34495938, 0.29387760),
  vec2(-0.91588581, 0.45771432), vec2(-0.81544232, -0.87912464), vec2(-0.38277543, 0.27676845), vec2(0.97484398, 0.75648379),
  vec2(0.44323325, -0.97511554), vec2(0.53742981, -0.47373420), vec2(-0.26496911, -0.41893023), vec2(0.79197514, 0.19090188),
  vec2(-0.24188840, 0.99706507), vec2(-0.81409955, 0.91437590), vec2(0.19984126, 0.78641367), vec2(0.14383161, -0.14100790));
float nfDepth(vec2 uv){ return unpackRGBAToDepth(texture2D(uShadowMap, uv)); }
float nfShadow(vec3 wp, float rnd){
  if (uShadowPar.w < 0.5) return 1.0;
  vec4 sc = uShadowMatrix * vec4(wp, 1.0);
  vec3 c = sc.xyz / sc.w;
  if (c.x < 0.0 || c.x > 1.0 || c.y < 0.0 || c.y > 1.0 || c.z > 1.0) return 1.0;
  float zr = c.z - 0.012 / uShadowPar.z;
  float a = rnd * 6.2831853; float ca = cos(a), sa = sin(a); mat2 R = mat2(ca, sa, -sa, ca);
#if NF_SHQ >= 1
  float sum = 0.0, cnt = 0.0;
  for (int i = 0; i < NF_BLK; i++) { float d = nfDepth(c.xy + R * POI[i] * (NF_SEARCH * uShadowPar.xy)); if (d < zr) { sum += d; cnt += 1.0; } }
  if (cnt < 0.5) return 1.0;
  float gap = (zr - sum / cnt) * uShadowPar.z;
  float pr = clamp(gap * uSunSoft, 0.010, NF_SEARCH);
  float lit = 0.0;
  for (int i = 0; i < NF_PCF; i++) lit += step(zr, nfDepth(c.xy + R * POI[i] * (pr * uShadowPar.xy)));
  return lit / float(NF_PCF);
#else
  float lit = 0.0;
  for (int i = 0; i < 4; i++) lit += step(zr, nfDepth(c.xy + R * POI[i] * (0.02 * uShadowPar.xy)));
  return lit * 0.25;
#endif
}
`;
const FLOOR_VS =  `
attribute float aKind; attribute vec4 aRoom; attribute float aDir;
uniform mat4 uReflMatrix;
varying vec3 vW; varying float vKind; varying vec4 vRoom; varying float vDir; varying vec4 vRefl;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz; vKind = aKind; vRoom = aRoom; vDir = aDir;
  vRefl = uReflMatrix * wp;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FLOOR_FS =  `
#include <packing>
${GL_COMMON}
${GL_SHADOW}
uniform vec3 uSunDir, uSunCol, uSkyCol, uBounceCol, uWinCol, uSkyRefl;
uniform sampler2D uHouseMap; uniform vec4 uHouseRect;    // R = 窓の光、G = 接地の影、B・A = にせの映り
uniform sampler2D uRefl; uniform sampler2D uReflDepth; uniform mat4 uReflInv; uniform vec2 uReflTexel;
uniform vec4 uReflPar;   // x = 強さ、y = 高さ 1 m でぼける幅（映す絵の画素）、z = 高さで弱まる量、w = ぼけの上限
uniform vec3 uPal[11];
uniform vec4 uStreak;    // x = 位置、y = 幅、z = 強さ
uniform vec4 uDoor;      // x = 玄関の中心 x、y = z、z = 半分の幅、w = 強さ
uniform float uCeil;
varying vec3 vW; varying float vKind; varying vec4 vRoom; varying float vDir; varying vec4 vRefl;
// 細い線を、画素より細くなってもちらつかせない
float lineCov(float d, float w, float aa){ return clamp((w - d) / aa + 0.5, 0.0, 1.0) * min(1.0, (2.0 * w) / aa + 0.3); }
void main(){
  vec2 P = vW.xz;
  float aa = max(length(dFdx(P)), length(dFdy(P))) + 1e-5;
  vec3 alb; float gloss = 1.0; float F0 = 0.25; float seam = 0.0; vec2 wob = vec2(0.0);
  if (vKind < 1.5) {
    // 板張り（0 = 楢、1 = 廊下の細い板）
    bool hall = vKind > 0.5;
    vec2 p = vDir < 0.5 ? P : P.yx;
    float pw = hall ? 0.105 : 0.15, pl = hall ? 1.3 : 1.75;
    float row = floor(p.y / pw);
    float off = h11(row * 7.13 + (hall ? 3.0 : 0.0)) * pl;
    float ci = floor((p.x + off) / pl);
    float id = h21(vec2(row, ci) + (hall ? 17.0 : 0.0));
    float id2 = h21(vec2(ci + 5.0, row * 1.7));
    float sy = (0.5 - abs(fract(p.y / pw) - 0.5)) * pw;
    float sx = (0.5 - abs(fract((p.x + off) / pl) - 0.5)) * pl;
    seam = max(lineCov(sy, 0.0032, aa), lineCov(sx, 0.003, aa));
    vec3 base = hall ? uPal[3] : uPal[0];
    alb = mix(base, uPal[2], smoothstep(0.55, 1.0, id) * 0.5);
    alb = mix(alb, uPal[1], smoothstep(0.38, 0.0, id) * 0.5);
    alb *= 0.955 + 0.09 * id2;
    float fade = clamp(0.014 / aa, 0.0, 1.0);
    float g1 = vnoise(vec2(p.x * 1.6 + id * 37.0, p.y * 70.0 + id2 * 11.0));
    float g2 = vnoise(vec2(p.x * 0.5 + id2 * 9.0, p.y * 22.0));
    alb *= 1.0 + ((g1 - 0.5) * 0.11 + (g2 - 0.5) * 0.09) * fade;
    alb *= 1.0 - 0.36 * seam;
    gloss = 0.84 + 0.3 * id2;
    wob = (vec2(id, id2) - 0.5) * 0.004;
    F0 = 0.36;
  } else if (vKind < 2.5) {
    // 畳（へりと目。映りは弱い）
    vec2 sz = vRoom.zw - vRoom.xy; vec2 q = P - vRoom.xy;
    bool lx = sz.x >= sz.y;
    vec2 ql = lx ? q : q.yx; vec2 sl = lx ? sz : sz.yx;
    vec2 n = max(vec2(1.0), floor(sl / vec2(1.82, 0.91) + 0.5));
    vec2 cell = sl / n; vec2 u = ql / cell; vec2 ci = floor(u); vec2 f = fract(u);
    float idt = h21(ci + 3.0);
    float ex = (0.5 - abs(f.x - 0.5)) * cell.x;
    float ey = (0.5 - abs(f.y - 0.5)) * cell.y;
    float heri = lineCov(ey, 0.03, aa);
    float cut = lineCov(ex, 0.004, aa);
    alb = mix(uPal[4], uPal[5], idt * 0.55);
    float fade = clamp(0.006 / aa, 0.0, 1.0);
    alb *= 1.0 - 0.1 * abs(fract(ql.x / 0.014) - 0.5) * 2.0 * fade;
    alb *= 0.96 + 0.08 * vnoise(ql * vec2(3.0, 9.0));
    alb = mix(alb, uPal[6], heri);
    alb *= 1.0 - 0.3 * cut * (1.0 - heri);
    gloss = 0.42; F0 = 0.07; seam = max(heri * 0.5, cut);
  } else if (vKind < 3.5) {
    // 玄関ホールの大きなタイル
    float ts = 0.45; vec2 u = P / ts; vec2 ci = floor(u); vec2 f = fract(u);
    float e = min(0.5 - abs(f.x - 0.5), 0.5 - abs(f.y - 0.5)) * ts;
    seam = lineCov(e, 0.0045, aa);
    float idt = h21(ci);
    alb = mix(uPal[7], uPal[8], idt * 0.4 + 0.25 * vnoise(P * 2.3));
    alb = mix(alb, uPal[8] * 0.7, seam);
    gloss = 1.0 + 0.1 * idt; F0 = 0.4; wob = (vec2(idt, h21(ci + 9.0)) - 0.5) * 0.002;
  } else {
    // 土間：目地のはっきりしたタイル（馬目地）。よく映る
    vec2 ts = vec2(0.4, 0.2); float rowi = floor(P.y / ts.y);
    vec2 u = vec2(P.x / ts.x + 0.5 * mod(rowi, 2.0), P.y / ts.y);
    vec2 ci = floor(u); vec2 f = fract(u);
    float e = min((0.5 - abs(f.x - 0.5)) * ts.x, (0.5 - abs(f.y - 0.5)) * ts.y);
    seam = lineCov(e, 0.007, aa);
    float idt = h21(ci + 31.0);
    alb = mix(uPal[9], uPal[10], idt * 0.7);
    alb *= 0.95 + 0.1 * vnoise(P * 5.0);
    alb = mix(alb, uPal[10] * 0.5, seam);
    gloss = 1.05; F0 = 0.46; wob = (vec2(idt, h21(ci + 2.0)) - 0.5) * 0.003;
  }
  // 光：空の明るさ＋朝日（影つき）＋窓から落ちる四角＋玄関の外の明るさ
  vec4 hm = texture2D(uHouseMap, (P - uHouseRect.xy) * uHouseRect.zw);
  float ao = hm.g;
  float sh = nfShadow(vW, ign(gl_FragCoord.xy));
  vec3 amb = mix(uBounceCol, uSkyCol, 0.84) * mix(0.5, 1.0, ao);
  vec3 light = amb + uSunCol * (max(uSunDir.y, 0.0) * sh) * mix(0.75, 1.0, ao) + uWinCol * (hm.r * sh);
  vec2 dd = vec2(max(abs(P.x - uDoor.x) - uDoor.z, 0.0), max(uDoor.y - P.y, 0.0));
  light += uWinCol * (uDoor.w * exp(-length(dd * vec2(1.0, 0.7)) / 0.85)) * mix(0.6, 1.0, sh);
  vec3 col = alb * light;
  // 映りこみ：見る角度が寝るほど強い
  vec3 V = normalize(cameraPosition - vW);
  float NdV = clamp(V.y, 0.0, 1.0);
  float fres = (F0 + (1.0 - F0) * pow(1.0 - NdV, 1.3)) * gloss * (1.0 - 0.85 * seam) * uReflPar.x;
  // 見えない天井の明るい帯。カメラが動くと床の上をすべる（磨いた床のしるし）
  vec2 cp = P - V.xz / max(V.y, 0.25) * uCeil;
  float s = dot(cp, vec2(0.83, 0.56));
  float band = smoothstep(0.1, 0.95, 0.5 + 0.5 * sin(s * 0.9 + 1.3 * sin(s * 0.31 + 0.7)));
  float gl = exp(-pow((s - uStreak.x) / uStreak.y, 2.0)) + 0.7 * exp(-pow((s - uStreak.x - uStreak.y * 3.4) / (uStreak.y * 0.3), 2.0));
  vec3 sky = uSkyRefl * (0.8 + 0.55 * band);
  vec3 rcol = sky;
#if NF_REFL == 2
  vec2 ruv = vRefl.xy / vRefl.w + wob;
  float dref = texture2D(uReflDepth, ruv).r;
  vec4 hp = uReflInv * vec4(ruv * 2.0 - 1.0, dref * 2.0 - 1.0, 1.0);
  float far = step(0.99995, dref);
  float hy = mix(max(hp.y / hp.w - vW.y, 0.0), 0.45, far);
  float lod = min(uReflPar.w, 0.1 + log2(max(1.0, hy * uReflPar.y)));
  vec2 px = uReflTexel * exp2(lod) * 0.8;
  vec4 rc = textureLod(uRefl, ruv, lod) * 0.36;
  rc += textureLod(uRefl, ruv + px * vec2(0.9, 0.5), lod) * 0.16;
  rc += textureLod(uRefl, ruv + px * vec2(-0.5, 0.9), lod) * 0.16;
  rc += textureLod(uRefl, ruv + px * vec2(-0.9, -0.5), lod) * 0.16;
  rc += textureLod(uRefl, ruv + px * vec2(0.5, -0.9), lod) * 0.16;
  float k = exp(-hy * uReflPar.z);
  rcol = sky * (1.0 - rc.a * k) + rc.rgb * k;
#elif NF_REFL == 1
  vec2 ruv = vRefl.xy / vRefl.w + wob;
  vec2 px = uReflTexel * 1.6;
  vec4 rc = textureLod(uRefl, ruv, 1.0) * 0.4 + textureLod(uRefl, ruv + px, 1.0) * 0.3 + textureLod(uRefl, ruv - px, 1.0) * 0.3;
  rcol = sky * (1.0 - rc.a * 0.7) + rc.rgb * 0.7;
#else
  rcol = mix(sky, vec3(hm.a) * (uSkyCol * 0.85 + uSunCol * 0.3), hm.b * 0.8);
#endif
  rcol += uSunCol * (gl * uStreak.z);
  col = col * (1.0 - fres * 0.45) + rcol * fres * mix(0.6, 1.0, ao) * 1.2;
  gl_FragColor = vec4(col, 1.0);
}`;
const WORLD_VS =  `
varying vec3 vW;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const LAWN_FS =  `
#include <packing>
${GL_COMMON}
${GL_SHADOW}
uniform vec3 uSunDir, uSunCol, uSkyCol, uBounceCol, uG0, uG1;
uniform vec4 uHouse, uPlinth; uniform float uPlinthR, uOutBoost;
varying vec3 vW;
void main(){
  vec2 P = vW.xz;
  float aa = max(length(dFdx(P)), length(dFdy(P))) + 1e-5;
  float fade = clamp(0.03 / aa, 0.0, 1.0);
  float m = vnoise(P * 1.3) * 0.5 + vnoise(P * 6.0 + 7.0) * 0.32 + vnoise(P * 31.0) * 0.18 * fade;
  vec3 alb = mix(uG1, uG0, smoothstep(0.22, 0.8, m));
  alb *= 1.0 + 0.05 * smoothstep(-0.35, 0.35, sin(P.x * 6.98));      // 刈りあとのしま
  alb *= 0.94 + 0.12 * h21(floor(P * 90.0)) * fade;
  float ao = 1.0 - 0.45 * exp(-max(sdBox(P - uHouse.xy, uHouse.zw), 0.0) / 0.15);
  float dE = -sdRBox(P - uPlinth.xy, uPlinth.zw, uPlinthR);
  ao *= 1.0 - 0.3 * exp(-max(dE - 0.34, 0.0) / 0.1);                 // 生け垣の根もと
  float sh = nfShadow(vW, ign(gl_FragCoord.xy));
  vec3 light = mix(uBounceCol, uSkyCol, 0.8) * ao + uSunCol * (max(uSunDir.y, 0.0) * sh * uOutBoost);
  gl_FragColor = vec4(alb * light, 1.0);
}`;
const TABLE_FS =  `
${GL_COMMON}
uniform vec4 uPlinth; uniform float uPlinthR; uniform vec3 uBg0, uBg1, uBg2; uniform vec2 uSunXZ;
varying vec3 vW;
void main(){
  vec2 q = vW.xz - uPlinth.xy;
  float d0 = sdRBox(q, uPlinth.zw, uPlinthR);
  float d1 = sdRBox(q + uSunXZ * 0.85, uPlinth.zw, uPlinthR);        // 台の影は朝日の反対へ長く
  float contact = 1.0 - 0.42 * (1.0 - smoothstep(-0.05, 0.3, d0));
  float soft = 1.0 - 0.36 * (1.0 - smoothstep(-0.5, 1.7, d1));
  float r = length(q / vec2(8.0, 11.0));
  vec3 c = mix(uBg0, uBg1, smoothstep(0.35, 1.7, r));
  float w = dot(normalize(q + 1e-4), normalize(uSunXZ)) * 0.5 + 0.5;  // 朝日の側は暖かい
  c = mix(c, uBg2, w * w * 0.6 * smoothstep(0.3, 1.5, r));
  gl_FragColor = vec4(c * contact * soft, 1.0);
}`;
const BAKE_MAXR = 64, BAKE_MAXC = 24, BAKE_MAXW = 12;
const FS_VS =  `
varying vec2 vUv;
void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const BAKE_FS =  `
#define MAXR ${BAKE_MAXR}
#define MAXC ${BAKE_MAXC}
#define MAXW ${BAKE_MAXW}
uniform vec4 uR[MAXR]; uniform vec2 uRH[MAXR]; uniform int uNR;   // 四角（x1,z1,x2,z2）、(高さ, 映る明るさ)
uniform vec4 uC[MAXC]; uniform int uNC;                            // 丸（x,z,r,h）
uniform vec4 uWa[MAXW], uWb[MAXW], uWc[MAXW]; uniform int uNW;     // 窓：(始点 x,z, 沿う向き)、(長さ, 枚数, 内向き)、部屋
uniform vec3 uSun; uniform vec2 uSize; uniform vec4 uP;            // uP = (窓台, 窓の上, 映りの長さ)
varying vec2 vUv;
void main(){
  vec2 p = vUv * uSize;
  float ao = 1.0, cov = 0.0, lum = 0.0;
  for (int i = 0; i < MAXR; i++) {
    if (i >= uNR) break;
    vec4 r = uR[i]; float h = uRH[i].x;
    vec2 q = abs(p - (r.xy + r.zw) * 0.5) - (r.zw - r.xy) * 0.5;
    float d = length(max(q, 0.0));
    float o = 1.0 - smoothstep(0.0, 0.1 + 0.3 * min(h, 1.0), d);
    ao *= 1.0 - 0.6 * o * o * min(1.0, h * 2.5 + 0.15);
    float tz = (p.y - r.w) / max(h * uP.z, 0.001);
    float inx = smoothstep(r.x - 0.015, r.x + 0.015, p.x) * (1.0 - smoothstep(r.z - 0.015, r.z + 0.015, p.x));
    float c = step(0.0, tz) * clamp(1.0 - tz, 0.0, 1.0); c = c * sqrt(c) * inx;
    if (c > cov) { cov = c; lum = uRH[i].y; }
  }
  for (int i = 0; i < MAXC; i++) {
    if (i >= uNC) break;
    vec4 c4 = uC[i];
    float d = max(length(p - c4.xy) - c4.z, 0.0);
    float o = 1.0 - smoothstep(0.0, 0.1 + 0.3 * min(c4.w, 1.0), d);
    ao *= 1.0 - 0.6 * o * o * min(1.0, c4.w * 2.5 + 0.15);
    vec2 e = p - (c4.xy + vec2(0.0, c4.z + c4.w * uP.z * 0.5));
    float c = 1.0 - smoothstep(0.5, 1.0, length(e / vec2(c4.z, c4.w * uP.z * 0.5 + 0.01)));
    if (c > cov) { cov = c; lum = 0.4; }
  }
  float win = 0.0; vec2 s = uSun.xz;
  for (int i = 0; i < MAXW; i++) {
    if (i >= uNW) break;
    vec2 o = uWa[i].xy, u = uWa[i].zw, n = uWb[i].zw; float len = uWb[i].x, panes = uWb[i].y;
    float sn = dot(s, n); if (sn > -0.05) continue;
    vec4 rc = uWc[i];
    if (p.x < rc.x || p.x > rc.z || p.y < rc.y || p.y > rc.w) continue;
    vec2 w = p - o; float dn = dot(w, n); if (dn < 0.0) continue;
    float t = -dn / sn;
    float a = dot(w + s * t, u), hh = t * uSun.y, dist = t * length(s);
    float soft = 0.010 + 0.036 * dist;
    float m = smoothstep(0.05 - soft, 0.05 + soft, a) * (1.0 - smoothstep(len - 0.05 - soft, len - 0.05 + soft, a));
    m *= smoothstep(uP.x - soft, uP.x + soft, hh) * (1.0 - smoothstep(uP.y - soft * 1.5, uP.y + soft * 1.5, hh));
    float pwid = len / panes;
    float thin = clamp(0.05 / (soft * 2.0), 0.0, 1.0);
    float dm = abs(fract(a / pwid + 0.5) - 0.5) * pwid;
    m *= 1.0 - (1.0 - smoothstep(0.016 - soft * 0.5, 0.016 + soft * 0.9, dm)) * thin;
    float dh = abs(hh - uP.y * 0.5);
    m *= 1.0 - (1.0 - smoothstep(0.014 - soft * 0.5, 0.014 + soft * 0.9, dh)) * thin;
    win = max(win, m * mix(1.0, 0.7, clamp(dist / 3.0, 0.0, 1.0)));
  }
  gl_FragColor = vec4(win, ao, cov, lum);
}`;
const SHAFT_VS =  `
attribute float aPanes; varying vec2 vUv; varying float vPanes;
void main(){ vUv = uv; vPanes = aPanes; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`;
const SHAFT_FS =  `
${GL_COMMON}
uniform vec3 uCol; uniform float uTime; varying vec2 vUv; varying float vPanes;
void main(){
  float edge = smoothstep(0.0, 0.07, vUv.x) * smoothstep(1.0, 0.93, vUv.x);
  float dm = abs(fract(vUv.x * vPanes + 0.5) - 0.5);
  float mull = mix(0.5, 1.0, smoothstep(0.02, 0.1, dm));
  float along = pow(max(1.0 - vUv.y, 0.0), 1.3) * smoothstep(0.0, 0.05, vUv.y);
  float n = 0.7 + 0.3 * vnoise(vec2(vUv.x * 7.0 + uTime * 0.02, vUv.y * 2.5 - uTime * 0.04));
  gl_FragColor = vec4(uCol * (edge * mull * along * n), 1.0);
}`;
const DUST_VS =  `
attribute vec4 aSeed; uniform vec3 uSunDir; uniform float uTime, uPx;
varying float vA;
void main(){
  float fr = fract(aSeed.x + uTime * 0.016 * (0.5 + aSeed.y));
  vec3 p = position - uSunDir * (fr * position.y / max(uSunDir.y, 0.05));     // 光の帯に沿ってゆっくり降りる
  float ph = aSeed.z * 6.2831853;
  p += vec3(sin(uTime * 0.31 + ph), sin(uTime * 0.23 + ph * 1.7) * 0.6, cos(uTime * 0.27 + ph * 0.6)) * 0.035;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPx * (1.0 + 2.2 * aSeed.w) * clamp(34.0 / -mv.z, 0.8, 3.2);
  vA = smoothstep(0.0, 0.12, fr) * smoothstep(1.0, 0.85, fr) * (0.55 + 0.45 * sin(uTime * (0.8 + aSeed.w * 1.7) + ph * 3.0));
}`;
const DUST_FS =  `
uniform vec3 uCol; varying float vA;
void main(){ float a = smoothstep(0.5, 0.05, length(gl_PointCoord - 0.5)); gl_FragColor = vec4(uCol * (a * a * vA), 1.0); }`;
const BLOB_VS =  `
attribute vec4 iPos; attribute float iStr; varying vec2 vUv; varying float vS;
void main(){ vUv = position.xz; vS = iStr; gl_Position = projectionMatrix * viewMatrix * vec4(iPos.xyz + vec3(position.x, 0.0, position.z) * iPos.w, 1.0); }`;
const BLOB_FS =  `
uniform vec3 uCol; varying vec2 vUv; varying float vS;
void main(){ float a = 1.0 - smoothstep(0.12, 1.0, length(vUv)); gl_FragColor = vec4(mix(vec3(1.0), uCol, a * a * vS), 1.0); }`;
const UV_VS =  `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`;
const DECAL_FS =  `
uniform sampler2D uMap; uniform vec3 uInk; uniform float uOpacity; varying vec2 vUv;
void main(){ gl_FragColor = vec4(mix(vec3(1.0), uInk, texture2D(uMap, vUv).a * uOpacity), 1.0); }`;
const CHEV_FS =  `
uniform vec3 uCol; uniform float uFlow, uGoal; varying vec2 vUv;
void main(){
  float x = abs(vUv.x - 0.5) * 2.0;
  float y = vUv.y * 2.4 - fract(uFlow);
  float d = abs(fract(y + (x - 1.0) * 0.55) - 0.5);          // まん中が外へ突き出た「くの字」
  float aa = fwidth(y) * 1.2;
  float a = (1.0 - smoothstep(0.11 - aa, 0.11 + aa, d)) * (1.0 - smoothstep(0.84, 0.92, x));
  a *= smoothstep(0.0, 0.22, vUv.y) * smoothstep(1.0, 0.72, vUv.y);
  gl_FragColor = vec4(uCol * (1.0 + uGoal), a * 0.85);
}`;
const GLOW_FS =  `
uniform vec3 uCol; uniform float uPow; varying vec2 vUv;
void main(){ float a = max(1.0 - length((vUv - vec2(0.5, 0.25)) * vec2(2.0, 1.3)), 0.0); gl_FragColor = vec4(uCol * (a * a * uPow), 1.0); }`;
const TRAIL_VS =  `
attribute float aSide, aLen; varying float vSide, vLen;
void main(){ vSide = aSide; vLen = aLen; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`;
const TRAIL_FS =  `
uniform vec3 uCol; uniform vec4 uPar;   // 濃さ、先頭までの道のり、消えていく長さ、古い所に残す濃さ
varying float vSide, vLen;
void main(){
  float a = max(exp(-vSide * vSide * 3.0) * 0.8, 1.0 - smoothstep(0.16, 0.42, abs(vSide)));      // やわらかいふちに、しっかりした芯
  a *= max(uPar.w, exp(-(uPar.y - vLen) / uPar.z)) * uPar.x;
  if (a < 0.012) discard;
  gl_FragColor = vec4(uCol * a, a * 0.9);
}`;
const RING_VS =  `
uniform vec4 uP;      // 中心 x,y,z、半分の大きさ
varying vec2 vUv;
void main(){ vUv = position.xz * uP.w; gl_Position = projectionMatrix * viewMatrix * vec4(uP.xyz + vec3(position.x, 0.0, position.z) * uP.w, 1.0); }`;
const RING_FS =  `
uniform vec3 uCol; uniform vec4 uQ;   // 濃さ、時計、輪の半径
varying vec2 vUv;
void main(){
  float r = length(vUv), t = fract(uQ.y / 1.5), aa = fwidth(r) * 1.3;
  float d = abs(r - uQ.z * (1.0 + 0.045 * sin(uQ.y * 4.19)));
  float core = 1.0 - smoothstep(0.016, 0.016 + aa, d), halo = 1.0 - smoothstep(0.03, 0.05 + aa, d);
  float wave = (1.0 - smoothstep(0.012, 0.04 + aa, abs(r - mix(uQ.z, 0.95, t)))) * (1.0 - t) * (1.0 - t);
  float glow = exp(-r * r * 9.0) * 0.16;
  float a = max(max(core, halo * 0.6), max(wave * 0.75, glow));
  gl_FragColor = vec4(mix(vec3(1.3), uCol, max(core, wave)), a * uQ.x);
}`;
const PART_VS =  `
attribute vec3 iPos; attribute vec4 iPar;   // 大きさ、回り、種類、伸び
attribute vec4 iCol; attribute vec3 iDir;   // 床の上の向き（x,z）、光として足す度合い
varying vec2 vUv; varying vec4 vCol; varying float vType; varying float vAdd;
void main(){
  vUv = position.xy; vCol = iCol; vType = iPar.z; vAdd = iDir.z;
  if (iPar.z > 2.5) {          // 床に寝かせる（風の筋・波紋）
    vec2 d = iDir.xy, n = vec2(-d.y, d.x);
    vec2 o = d * position.x * iPar.x * iPar.w + n * position.y * iPar.x;
    gl_Position = projectionMatrix * viewMatrix * vec4(iPos + vec3(o.x, 0.0, o.y), 1.0);
  } else {                     // いつもこちらを向く
    float c = cos(iPar.y), s = sin(iPar.y);
    vec4 mv = viewMatrix * vec4(iPos, 1.0);
    mv.xy += vec2(c * position.x - s * position.y, s * position.x + c * position.y) * iPar.x;
    gl_Position = projectionMatrix * mv;
  }
}`;
const PART_FS =  `
varying vec2 vUv; varying vec4 vCol; varying float vType; varying float vAdd;
void main(){
  float r = length(vUv), a;
  if (vType < 0.5) { a = smoothstep(1.0, 0.0, r); a *= a; }                                      // やわらかい光の粒
  else if (vType < 1.5) { vec2 q = abs(vUv); a = max(0.0, 1.0 - (q.x * q.y * 30.0 + r * 0.9)); a = a * a + 0.5 * smoothstep(0.3, 0.0, r); }   // 小さな星
  else if (vType < 2.5) { a = smoothstep(1.0, 0.25, r) * 0.6; }                                  // ほこり
  else if (vType < 3.5) { float e = 1.0 - abs(vUv.y); a = e * e * smoothstep(1.0, 0.1, abs(vUv.x)); }    // 風の筋
  else { a = smoothstep(0.07, 0.0, abs(r - 0.9)) + 0.2 * smoothstep(0.9, 0.35, r) * step(r, 0.9); }   // 床の波紋
  a *= vCol.a;
  gl_FragColor = vec4(vCol.rgb * a, a * (1.0 - vAdd));
}`;
const TINT_VS =  `
varying vec3 vC; varying vec3 vN;
void main(){ vC = color; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const GHOST_FS =  `
uniform float uAlpha; uniform vec3 uTint; varying vec3 vC; varying vec3 vN;
void main(){ float rim = pow(1.0 - abs(normalize(vN).z), 2.0); gl_FragColor = vec4(mix(vC, uTint, 0.62) * 1.15 + rim * 0.35, clamp(uAlpha + rim * 0.25, 0.0, 1.0)); }`;
const SIL_FS =  `
uniform float uAlpha; uniform vec3 uTint; varying vec3 vC; varying vec3 vN;
void main(){ float st = step(0.5, fract((gl_FragCoord.x + gl_FragCoord.y) / 7.0)); gl_FragColor = vec4(mix(vC, uTint, 0.5) * 1.1, uAlpha * mix(0.72, 1.0, st)); }`;
const DOWN_FS =  `
uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThresh; varying vec2 vUv;
void main(){
  vec3 c = texture2D(tSrc, vUv).rgb * 4.0;
  c += texture2D(tSrc, vUv + uTexel).rgb + texture2D(tSrc, vUv - uTexel).rgb;
  c += texture2D(tSrc, vUv + vec2(uTexel.x, -uTexel.y)).rgb + texture2D(tSrc, vUv - vec2(uTexel.x, -uTexel.y)).rgb;
  c *= 0.125;
  if (uThresh > 0.0) {
    c = min(c, vec3(10.0)); float br = max(c.r, max(c.g, c.b)), knee = uThresh * 0.5;
    float soft = clamp(br - uThresh + knee, 0.0, 2.0 * knee); soft = soft * soft / (4.0 * knee + 1e-4);
    c *= max(soft, br - uThresh) / max(br, 1e-4);
  }
  gl_FragColor = vec4(c, 1.0);
}`;
const UP_FS =  `
uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uGain; varying vec2 vUv;
void main(){
  vec2 h = uTexel * 0.5;
  vec3 c = texture2D(tSrc, vUv + vec2(-h.x * 2.0, 0.0)).rgb + texture2D(tSrc, vUv + vec2(h.x * 2.0, 0.0)).rgb
         + texture2D(tSrc, vUv + vec2(0.0, h.y * 2.0)).rgb + texture2D(tSrc, vUv + vec2(0.0, -h.y * 2.0)).rgb;
  c += (texture2D(tSrc, vUv + vec2(-h.x, h.y)).rgb + texture2D(tSrc, vUv + vec2(h.x, h.y)).rgb
      + texture2D(tSrc, vUv + vec2(h.x, -h.y)).rgb + texture2D(tSrc, vUv + vec2(-h.x, -h.y)).rgb) * 2.0;
  gl_FragColor = vec4(c / 12.0 * uGain, 1.0);
}`;
const GL_TONE =  `
vec3 nfTone(vec3 c){   // 色ごとに肩を丸める：ふつうの明るさはそのまま、強い朝日だけ黄みの白へ抜ける
  const float a = 0.56;
  vec3 hi = a + (1.0 - a) * (1.0 - exp(-(max(c, a) - a) / (1.0 - a)));
  vec3 t = mix(c, hi, step(vec3(a), c));
  float pk = max(c.r, max(c.g, c.b));
  return mix(t, vec3(dot(t, vec3(0.2126, 0.7152, 0.0722))), 0.3 * smoothstep(1.0, 2.6, pk));
}
vec3 nfSRGB(vec3 c){ c = clamp(c, 0.0, 1.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }
`;
const POST_FS =  `
${GL_COMMON}
${GL_TONE}
uniform sampler2D tScene, tBloom; uniform vec2 uRes;
uniform vec4 uTilt;    // 焦点の y、はっきり見える半分の幅、ぼけの最大（画素）、強さ
uniform vec4 uGrade;   // 露出、彩度、コントラスト、にじみ
uniform vec3 uWarm; uniform float uVig;
uniform vec4 uMood;    // 遅刻、ゴール、止まった
uniform vec4 uLeak;    // 朝日の差しこむ角（x,y）、強さ
uniform vec3 uLeakCol; uniform float uFlip;
varying vec2 vUv;
void main(){
  vec2 uv = uFlip > 0.5 ? vec2(vUv.x, 1.0 - vUv.y) : vUv; vec3 c;
#ifdef NF_TILT
  float blur = uTilt.w * smoothstep(0.0, 0.3, abs(uv.y - uTilt.x) - uTilt.y);
  if (blur > 0.01) {
    float rad = blur * uTilt.z, rnd = ign(gl_FragCoord.xy) * 6.2831853; c = vec3(0.0);
    for (int i = 0; i < 12; i++) { float fi = float(i); float r = sqrt((fi + 0.5) / 12.0) * rad, a = fi * 2.39996323 + rnd;
      c += texture2D(tScene, uv + vec2(cos(a), sin(a)) * r / uRes).rgb; }
    c /= 12.0;
  } else c = texture2D(tScene, uv).rgb;
#else
  c = texture2D(tScene, uv).rgb;
#endif
#ifdef NF_BLOOM
  c += texture2D(tBloom, uv).rgb * uGrade.w * (1.0 + 0.8 * uMood.y);
#endif
  float lk = max(0.0, 1.0 - length((uv - uLeak.xy) * vec2(uRes.x / uRes.y, 1.0)) / 1.25);
  c += uLeakCol * (lk * lk * uLeak.z) * (1.0 + 0.8 * uMood.y);          // 朝日の側のあたたかいもや
  c = nfTone(c * uGrade.x * (1.0 + 0.08 * uMood.y));
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, uGrade.y);
  c = mix(c, c * c * (3.0 - 2.0 * c), uGrade.z);
  c *= uWarm;
  c += (1.0 - l) * (1.0 - l) * vec3(0.012, 0.0, 0.026);                 // 影はほんの少し紫へ
  float l2 = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(c, vec3(l2) * vec3(0.9, 0.97, 1.08), uMood.x * 0.78 + uMood.z * 0.3);     // 遅刻：色がさめる
  c *= 1.0 - 0.1 * uMood.x;
  vec2 q = uv - 0.5;
  c *= 1.0 - (uVig + 0.25 * uMood.x + 0.1 * uMood.z) * smoothstep(0.1, 0.62, dot(q, q));
  c = nfSRGB(c) + (ign(gl_FragCoord.xy + 17.0) - 0.5) / 255.0;
  gl_FragColor = vec4(c, 1.0);
}`;
const ICON_FS =  `
${GL_TONE}
uniform sampler2D tScene; uniform float uExposure; varying vec2 vUv;
void main(){ vec4 t = texture2D(tScene, vUv); vec3 c = t.a > 0.001 ? t.rgb / t.a : vec3(0.0); gl_FragColor = vec4(nfSRGB(nfTone(c * uExposure)), t.a); }`;
const DOT_VS =  `
attribute vec4 iPos; attribute float iA;    // 位置と大きさの倍率、濃さ
uniform vec2 uSize;                         // 半径（m）、1 画素の大きさ（m）
varying vec2 vUv; varying float vA; varying float vPx;
void main(){
  float r = uSize.x * iPos.w * 1.6;         // ふちの影のぶん広く
  vUv = position.xz; vA = iA; vPx = r / uSize.y;
  gl_Position = projectionMatrix * viewMatrix * vec4(iPos.xyz + vec3(position.x, 0.0, position.z) * r, 1.0);
}`;
const DOT_FS =  `
uniform vec3 uCol; varying vec2 vUv; varying float vA; varying float vPx;
void main(){
  float kind = floor(vA * 0.5 + 0.01), al = vA - kind * 2.0;      // 0 = ふつうの点、1 以上 = しるし（行き着く先・当たって曲がる所）
  float r = length(vUv), aa = 1.2 / max(vPx, 1.0);
  float core = 1.0 - smoothstep(0.44 - aa, 0.44 + aa, r);
  float ring = 1.0 - smoothstep(0.625 - aa, 0.625 + aa, r);
  float sh = (1.0 - smoothstep(0.55, 1.0, r)) * 0.42;
  vec3 c = mix(vec3(1.0), uCol, core);
  if (kind > 0.5) c = mix(c, vec3(1.0), 1.0 - smoothstep(0.2 - aa, 0.2 + aa, r));        // しるしは白い目つき
  gl_FragColor = vec4(mix(vec3(0.07, 0.09, 0.2), c, ring), max(ring, sh) * al);
}`;
const ARROW_VS =  `
uniform vec4 uA;      // 始点 x,z、向き x,z
uniform vec4 uB;      // 長さ、太さ、高さ
varying vec2 vP;
void main(){
  float pad = uB.y * 2.8 + 0.08;
  vP = vec2(position.x * (uB.x + pad * 2.0) - pad, position.z * pad);
  vec2 d = uA.zw, n = vec2(-d.y, d.x), w = uA.xy + d * vP.x + n * vP.y;
  gl_Position = projectionMatrix * viewMatrix * vec4(w.x, uB.z, w.y, 1.0);
}`;
const ARROW_FS =  `
uniform vec4 uB; uniform vec3 uCol; uniform float uAlpha; varying vec2 vP;
float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }
float sdTri(vec2 p, vec2 p0, vec2 p1, vec2 p2){
  vec2 e0 = p1 - p0, e1 = p2 - p1, e2 = p0 - p2, v0 = p - p0, v1 = p - p1, v2 = p - p2;
  vec2 q0 = v0 - e0 * clamp(dot(v0, e0) / dot(e0, e0), 0.0, 1.0), q1 = v1 - e1 * clamp(dot(v1, e1) / dot(e1, e1), 0.0, 1.0), q2 = v2 - e2 * clamp(dot(v2, e2) / dot(e2, e2), 0.0, 1.0);
  float s = sign(e0.x * e2.y - e0.y * e2.x);
  vec2 d = min(min(vec2(dot(q0, q0), s * (v0.x * e0.y - v0.y * e0.x)), vec2(dot(q1, q1), s * (v1.x * e1.y - v1.y * e1.x))), vec2(dot(q2, q2), s * (v2.x * e2.y - v2.y * e2.x)));
  return -sqrt(d.x) * sign(d.y);
}
void main(){
  float L = uB.x, w = uB.y, hl = w * 3.6, hw = w * 2.4;
  float ws = w * mix(0.55, 1.0, clamp(vP.x / max(L - hl, 0.01), 0.0, 1.0));      // 根もとは細く
  float d = sdSeg(vP, vec2(0.0), vec2(L - hl * 0.8, 0.0)) - ws;
  d = min(d, sdTri(vP, vec2(L - hl, hw), vec2(L - hl, -hw), vec2(L, 0.0)) - 0.012);
  float aa = fwidth(d) * 0.9 + 1e-5, ow = max(0.018, aa * 1.7);
  float fill = 1.0 - smoothstep(-aa, aa, d), edge = 1.0 - smoothstep(ow - aa, ow + aa, d);
  float sh = (1.0 - smoothstep(ow, ow + 0.06, d)) * 0.28;
  gl_FragColor = vec4(mix(vec3(0.07, 0.09, 0.2), mix(vec3(1.0), uCol, fill), edge), max(edge, sh) * uAlpha);
}`;
const BAND_VS =  `
uniform vec4 uA;      // 主人公 x,z、引いた向き x,z
uniform vec4 uB;      // 根もと・先（主人公からの距離）、根もとの半分の幅、高さ
uniform vec4 uC;      // 線の半分の太さ、たるみ 0..1、濃さ、先の点々の長さ
varying vec2 vP;
void main(){
  float pad = 0.12;
  vP = vec2(mix(uB.x - pad, uB.y + uC.w + pad, position.x), position.z * (uB.z + pad));
  vec2 d = uA.zw, n = vec2(-d.y, d.x), w = uA.xy + d * vP.x + n * vP.y;
  gl_Position = projectionMatrix * viewMatrix * vec4(w.x, uB.w, w.y, 1.0);
}`;
const BAND_FS =  `
uniform vec4 uB, uC; uniform vec4 uD;      // uD = 先の物の大きさ（点々はその外から）、時計
uniform vec3 uCol, uSlack; varying vec2 vP;
float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }
void main(){
  vec2 p = vP;
  float tt = clamp((p.x - uB.x) / max(uB.y - uB.x, 1e-3), 0.0, 1.0);
  p.y += uC.y * 0.03 * sin(tt * 14.0 + uD.y * 5.0) * sin(tt * 3.1416);        // たるんでいる間は、ゆるく波うつ
  float d = min(sdSeg(p, vec2(uB.x, uB.z), vec2(uB.y, 0.0)), sdSeg(p, vec2(uB.x, -uB.z), vec2(uB.y, 0.0))) - uC.x;
  float aa = fwidth(d) * 0.9 + 1e-5, ow = max(0.012, aa * 1.6);
  float fill = 1.0 - smoothstep(-aa, aa, d), edge = 1.0 - smoothstep(ow - aa, ow + aa, d);
  vec3 col = mix(uCol, uSlack, uC.y);
  vec3 c = mix(vec3(1.0), col, fill);
  float a = edge * mix(1.0, 0.8, uC.y);
  float hx = vP.x - uB.y - uD.x;
  if (hx > 0.0 && uC.w > 0.0) {
    // 物が飛ぶ向き：外へ流れる小さな点々（ひかえめに）
    float cell = 0.16, u = hx / cell - fract(uD.y * 1.3), fx = (fract(u) - 0.5) * cell, k = clamp(1.0 - hx / uC.w, 0.0, 1.0);
    float dd = length(vec2(fx, vP.y)) - 0.026 * (0.55 + 0.45 * k);
    float core = 1.0 - smoothstep(-aa, aa, dd), ring = 1.0 - smoothstep(0.012 - aa, 0.012 + aa, dd);
    float al = ring * k * smoothstep(0.0, 0.08, hx) * 0.85;
    if (al > a) { c = mix(col, vec3(1.0), core); a = al; }
  }
  gl_FragColor = vec4(c, a * uC.z);
}`;
const TIP_VS =  `
uniform vec4 uA;      // 中心 x,z、向き x,z
uniform vec4 uB;      // 大きさ、高さ、何番目、ぜんぶで何個
varying vec2 vUv;
void main(){
  vec2 d = uA.zw, n = vec2(-d.y, d.x), l = position.xz * uB.x * 0.5, w = uA.xy + d * l.x + n * l.y;
  vUv = vec2((uB.z + position.x * 0.5 + 0.5) / uB.w, 0.5 - position.z * 0.5);
  gl_Position = projectionMatrix * viewMatrix * vec4(w.x, uB.y, w.y, 1.0);
}`;
const TIP_FS =  `
uniform sampler2D uMap; uniform vec4 uB; uniform float uAlpha; uniform vec2 uTexel; varying vec2 vUv;
void main(){
  float u0 = uB.z / uB.w, u1 = (uB.z + 1.0) / uB.w; vec4 t = texture2D(uMap, vUv); float o = t.a;
  for (int i = 0; i < 8; i++) { float an = float(i) * 0.7853982; vec2 uv = vUv + vec2(cos(an), sin(an)) * uTexel * 4.0; uv.x = clamp(uv.x, u0, u1); o = max(o, texture2D(uMap, uv).a); }
  vec3 c = t.a > 0.01 ? t.rgb / max(t.a, 0.35) * min(1.0, t.a / 0.35) : vec3(1.0);     // 本物の色。ふちは白くなじませる
  gl_FragColor = vec4(mix(vec3(1.0), c, t.a), max(t.a * 0.86, o * 0.8) * uAlpha);
}`;
const SPR_VS =  `
attribute vec4 iRect; attribute vec4 iUv; attribute vec4 iCol; attribute float iMode;
uniform vec2 uView;
varying vec2 vUv; varying vec4 vCol; varying vec4 vE; varying float vMode; varying vec2 vL; varying vec2 vS;
void main(){
  vec2 c = position.xy, p = iRect.xy + vec2(c.x, -c.y) * 0.5 * iRect.zw;
  vUv = mix(iUv.xy, iUv.zw, c * 0.5 + 0.5); vCol = iCol; vE = iUv; vMode = iMode; vL = c * 0.5 * iRect.zw; vS = iRect.zw;
  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);
}`;
const SPR_FS =  `
${GL_COMMON}
uniform sampler2D uMap;
varying vec2 vUv; varying vec4 vCol; varying vec4 vE; varying float vMode; varying vec2 vL; varying vec2 vS;
void main(){
  if (vMode < 0.5) { vec4 t = texture2D(uMap, vUv); gl_FragColor = vec4(t.rgb * vCol.rgb * vCol.a, t.a * vCol.a); }
  else {     // 角の丸い札（ふちは vE の色）
    float pad = 7.0; vec2 hs = vS * 0.5 - pad; float d = sdRBox(vL, hs, min(hs.x, hs.y));
    float fill = 1.0 - smoothstep(-0.6, 0.6, d);
    float ring = fill * smoothstep(-2.6, -1.6, d);
    float sh = (1.0 - smoothstep(-1.0, pad, d)) * 0.26 * (1.0 - fill);
    vec3 c = mix(vCol.rgb, vE.rgb, ring * vE.a);
    gl_FragColor = vec4(c * fill + vec3(0.07, 0.09, 0.2) * sh, fill + sh) * vCol.a;
  }
}`;
class Batch {
  constructor() { this.buckets = new Map(); }
  add(geometry, matrix, material, o = {}) {
    const cast = o.cast !== false, receive = o.receive !== false;
    const key = material.uuid + (cast ? 'c' : '-') + (receive ? 'r' : '-');
    let b = this.buckets.get(key);
    if (!b) { b = { material, cast, receive, p: [], n: [], c: [] }; this.buckets.set(key, b); }
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    const pa = g.attributes.position, na = g.attributes.normal, ca = g.attributes.color, col = o.color;
    _nm.getNormalMatrix(matrix);
    for (let i = 0; i < pa.count; i++) {
      _v.fromBufferAttribute(pa, i).applyMatrix4(matrix); b.p.push(_v.x, _v.y, _v.z);
      if (na) _v.fromBufferAttribute(na, i).applyMatrix3(_nm).normalize(); else _v.set(0, 1, 0);
      b.n.push(_v.x, _v.y, _v.z);
      if (typeof col === 'function') { const c = col(_v.x, _v.y, _v.z); b.c.push(c[0], c[1], c[2]); }
      else if (col) b.c.push(col[0], col[1], col[2]);
      else if (ca) b.c.push(ca.getX(i), ca.getY(i), ca.getZ(i));
      else b.c.push(1, 1, 1);
    }
  }
  addObject(root) {
    root.updateMatrixWorld(true);
    root.traverse((m) => {
      if (!m.isMesh || !m.geometry || !m.geometry.attributes.position) return;
      this.add(m.geometry, m.matrixWorld, Array.isArray(m.material) ? m.material[0] : m.material, { cast: m.castShadow, receive: m.receiveShadow });
    });
  }
  build(parent, reflect = true, shadow = null) {
    const out = [];
    for (const b of this.buckets.values()) {
      if (!b.p.length) continue;
      if (shadow && b.cast) for (let i = 0; i < b.p.length; i++) shadow.push(b.p[i]);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(b.c, 3));
      g.computeBoundingSphere(); g.computeBoundingBox();
      const m = new THREE.Mesh(g, b.material);
      m.castShadow = b.cast; m.receiveShadow = b.receive; m.matrixAutoUpdate = false;
      if (b.material.transparent) m.renderOrder = 5;
      if (reflect) m.layers.enable(1);
      parent.add(m); out.push(m);
    }
    this.buckets.clear();
    return out;
  }
}
function boxInto(B, x1, z1, x2, z2, y0, y1, side, cap, o = {}) {
  const w = x2 - x1, d = z2 - z1, h = y1 - y0;
  if (w <= 0.001 || d <= 0.001 || h <= 0.001) return;
  const cs = linear(side), cc = linear(cap || side);
  _m4.makeTranslation((x1 + x2) / 2, (y0 + y1) / 2, (z1 + z2) / 2);
  B.add(roundedBoxGeo(w, h, d, o.r ?? 0.01, 1), _m4, o.mat || MATS.matte, { cast: o.cast, receive: o.receive, color: (nx, ny) => (ny > 0.5 ? cc : cs) });
}
function meanLum(root) {
  let s = 0, n = 0;
  root.traverse((m) => {
    const c = m.isMesh && m.geometry && m.geometry.attributes.color;
    if (!c) return;
    const st = Math.max(1, Math.floor(c.count / 160));
    for (let i = 0; i < c.count; i += st) { s += 0.2126 * c.getX(i) + 0.7152 * c.getY(i) + 0.0722 * c.getZ(i); n++; }
  });
  return n ? clamp(s / n * 1.3, 0.08, 1) : 0.4;
}
let _ico = null;
function icoGeo() {
  if (_ico) return _ico;
  _ico = new THREE.IcosahedronGeometry(1, 1);
  const p = _ico.attributes.position, n = _ico.attributes.normal;
  for (let i = 0; i < p.count; i++) { _v.fromBufferAttribute(p, i).normalize(); n.setXYZ(i, _v.x, _v.y, _v.z); }
  return _ico;
}
function rrShape(x0, z0, x1, z1, r) {
  const s = new THREE.Shape(), y0 = -z1, y1 = -z0, h = Math.PI / 2;
  s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.absarc(x1 - r, y0 + r, r, -h, 0, false);
  s.lineTo(x1, y1 - r); s.absarc(x1 - r, y1 - r, r, 0, h, false);
  s.lineTo(x0 + r, y1); s.absarc(x0 + r, y1 - r, r, h, h * 2, false);
  s.lineTo(x0, y0 + r); s.absarc(x0 + r, y0 + r, r, h * 2, h * 3, false);
  return s;
}
function buildHouse(L) {
  const W = L.w / 1000, H = L.h / 1000, Tk = L.wallT / 1000, yLow = -T.lawnDrop, yD = -T.domaDrop;
  const B = new Batch(), Bn = new Batch();
  const door = { x1: L.door.x1 / 1000, x2: L.door.x2 / 1000 };
  const info = {
    W, H, Tk, door, rooms: [], occ: [], circ: [], wins: [], live: [], flat: [],
    start: { x: L.start.x / 1000, z: L.start.y / 1000 },
    px0: -T.plinthM, pz0: -T.plinthM, px1: W + T.plinthM, pz1: H + T.plinthS,
  };
  for (const r of L.rooms || []) {
    info.rooms.push({ x1: r.x1 / 1000, z1: r.y1 / 1000, x2: r.x2 / 1000, z2: r.y2 / 1000, kind: FLOOR_KIND[r.floor] ?? 0, doma: r.floor === 'doma',
      name: r.name || '', label: r.label ? { x: r.label.x / 1000, z: r.label.y / 1000 } : null });
  }
  const roomAt = (x, z) => { for (const r of info.rooms) if (x >= r.x1 && x <= r.x2 && z >= r.z1 && z <= r.z2) return r; return null; };
  info.floorY = (x, z) => {
    if (z > H - Tk * 0.5) return yD;
    if (x < 0 || x > W || z < 0) return yLow;
    const r = roomAt(x, z);
    return r && r.doma ? yD : 0;
  };
  const occ = (x1, z1, x2, z2, h, lum) => info.occ.push({ x1, z1, x2, z2, h, lum });
  const skirt = (x1, z1, x2, z2) => boxInto(B, x1 - T.skirt, z1 - T.skirt, x2 + T.skirt, z2 + T.skirt, yLow, 0.05, PAL.wallTrim, PAL.wallTrim, { r: 0.005, cast: false });
  const wins = (L.decor || []).filter((d) => d.kind === 'window');
  const sides = {
    N: { ax: true, u0: 0, u1: W, v0: 0, v1: Tk, h: T.wallH, n: [0, 1] },
    W: { ax: false, u0: 0, u1: H, v0: 0, v1: Tk, h: T.wallH, n: [1, 0] },
    E: { ax: false, u0: 0, u1: H, v0: W - Tk, v1: W, h: T.wallH, n: [-1, 0] },
    S: { ax: true, u0: 0, u1: W, v0: H - Tk, v1: H, h: T.wallSouthH, n: [0, -1] },
  };
  for (const name in sides) {
    const S = sides[name], vm = (S.v0 + S.v1) / 2;
    const R = (ua, ub, va, vb) => (S.ax ? [ua, va, ub, vb] : [va, ua, vb, ub]);
    const gaps = wins.filter((w) => w.side === name).map((w) => ({ a: Math.min(w.a, w.b) / 1000, b: Math.max(w.a, w.b) / 1000, win: true }));
    if (name === 'S') gaps.push({ a: door.x1, b: door.x2, win: false });
    gaps.sort((p, q) => p.a - q.a);
    const solid = (a, b) => {
      if (b - a < 0.005) return;
      const r = R(a, b, S.v0, S.v1);
      boxInto(B, r[0], r[1], r[2], r[3], yLow, S.h, PAL.wallSide, PAL.wallCap);
      skirt(r[0], r[1], r[2], r[3]);
      occ(r[0], r[1], r[2], r[3], S.h, 0.92);
    };
    let u = S.u0;
    for (const g of gaps) {
      solid(u, g.a); u = g.b;
      const a = g.a, b = g.b;
      if (g.win) {
        const sill = T.winSill, fw = 0.05, n = Math.max(1, Math.round((b - a) / 0.72));
        let r = R(a, b, S.v0, S.v1); boxInto(B, r[0], r[1], r[2], r[3], yLow, sill, PAL.wallSide, PAL.wallTrim);
        occ(r[0], r[1], r[2], r[3], sill, 0.9);
        for (const e of [a, b - fw]) { r = R(e, e + fw, S.v0 - 0.008, S.v1 + 0.008); boxInto(Bn, r[0], r[1], r[2], r[3], sill - 0.004, S.h, PAL.frame, PAL.woodDark, { r: 0.006, cast: false }); }
        for (let i = 1; i < n; i++) { const m = a + (b - a) * i / n; r = R(m - 0.016, m + 0.016, vm - 0.03, vm + 0.03); boxInto(Bn, r[0], r[1], r[2], r[3], sill, S.h - 0.002, PAL.frame, PAL.woodDark, { r: 0.004, cast: false }); }
        r = R(a + fw, b - fw, vm - 0.036, vm + 0.036); boxInto(Bn, r[0], r[1], r[2], r[3], sill - 0.002, sill + 0.03, PAL.frame, PAL.frame, { r: 0.004, cast: false });
        r = R(a + fw, b - fw, vm - 0.009, vm + 0.009); boxInto(Bn, r[0], r[1], r[2], r[3], sill + 0.026, S.h - 0.006, PAL.glassBlue, PAL.skyPale, { mat: MATS.glass, r: 0.003, cast: false, receive: false });
        const inner = S.n[0] + S.n[1] > 0 ? S.v1 : S.v0;
        const o = S.ax ? [a, inner] : [inner, a], uu = S.ax ? [1, 0] : [0, 1];
        const mx = o[0] + uu[0] * (b - a) / 2 + S.n[0] * 0.3, mz = o[1] + uu[1] * (b - a) / 2 + S.n[1] * 0.3;
        const rm = roomAt(mx, mz) || { x1: 0, z1: 0, x2: W, z2: H };
        info.wins.push({ side: name, o, u: uu, n: S.n, len: b - a, panes: n, room: [rm.x1, rm.z1, rm.x2, rm.z2], h: S.h });
      } else {
        let r = R(a, b, S.v0, S.v1); boxInto(B, r[0], r[1], r[2], r[3], yLow, yD + 0.012, PAL.stone, PAL.steel, { r: 0.006 });
        for (const e of [a - 0.03, b - 0.05]) { r = R(e, e + 0.08, S.v0 - 0.012, S.v1 + 0.012); boxInto(B, r[0], r[1], r[2], r[3], yLow, T.wallH, PAL.frame, PAL.woodDark, { r: 0.008, mat: MATS.soft }); occ(r[0], r[1], r[2], r[3], T.wallH, 0.4); }
        const len = (b - a - 0.1) / 2 - 0.012, lt = 0.046, y0 = yD + 0.014, lh = T.wallH - y0, st = 0.075;
        const cDoor = linear(PAL.woodRed), cPanel = linear(PAL.wood), cCut = linear(PAL.woodDark), cKnob = linear(PAL.chrome);
        for (const sgn of [1, -1]) {
          _m4.makeRotationY((sgn > 0 ? -102 : -78) * D2R); _m4.setPosition(sgn > 0 ? a + 0.05 : b - 0.05, y0, H + 0.012);
          const part = (u0, u1, v0, v1, th, col, mat, dz = 0, cap = cCut) => {
            _m4b.makeTranslation((u0 + u1) / 2 + 0.012, (v0 + v1) / 2, dz); _m4b.premultiply(_m4);
            B.add(roundedBoxGeo(u1 - u0, v1 - v0, th, 0.006, 1), _m4b, mat, { color: (nx, ny) => (ny > 0.5 ? cap : col) });
          };
          part(0, st, 0, lh, lt, cDoor, MATS.soft); part(len - st, len, 0, lh, lt, cDoor, MATS.soft);
          part(st, len - st, 0, 0.1, lt, cDoor, MATS.soft); part(st, len - st, 0.27, 0.33, lt, cDoor, MATS.soft);
          part(st - 0.004, len - st + 0.004, 0.02, lh - 0.004, lt * 0.42, cPanel, MATS.soft);
          for (const sd of [-1, 1]) {
            part(len - 0.105, len - 0.083, 0.19, 0.41, 0.02, cKnob, MATS.metal, sd * (lt / 2 + 0.024), cKnob);
            part(len - 0.1, len - 0.088, 0.22, 0.24, 0.03, cKnob, MATS.metal, sd * (lt / 2 + 0.01), cKnob); part(len - 0.1, len - 0.088, 0.36, 0.38, 0.03, cKnob, MATS.metal, sd * (lt / 2 + 0.01), cKnob);
          }
        }
      }
    }
    solid(u, S.u1);
  }
  for (const w of L.walls || []) {
    const x1 = w.x1 / 1000, z1 = w.y1 / 1000, x2 = w.x2 / 1000, z2 = w.y2 / 1000, kind = w.kind || 'wall';
    if (kind === 'half') {
      boxInto(B, x1, z1, x2, z2, yD, T.halfH - 0.02, PAL.wallSide, PAL.wallSide);
      skirt(x1, z1, x2, z2);
      boxInto(B, x1 - 0.014, z1 - 0.014, x2 + 0.014, z2 + 0.014, T.halfH - 0.03, T.halfH, PAL.woodLight, PAL.woodLight, { mat: MATS.soft, r: 0.008 });
      occ(x1, z1, x2, z2, T.halfH, 0.9);
    } else if (kind === 'fusuma') {
      const ax = x2 - x1 >= z2 - z1, len = ax ? x2 - x1 : z2 - z1, th = ax ? z2 - z1 : x2 - x1, n = Math.max(1, Math.round((len - 0.16) / 0.92));
      const R = (ua, ub, va, vb) => (ax ? [x1 + ua, z1 + va, x1 + ub, z1 + vb] : [x1 + va, z1 + ua, x1 + vb, z1 + ub]);
      const put = (bt, r, y0, y1, side, cap, o) => boxInto(bt, r[0], r[1], r[2], r[3], y0, y1, side, cap, o);
      const e = T.fusumaOver, post = 0.08, pl = (len - post * 2) / n, soft = { mat: MATS.soft, r: 0.004 };
      put(B, R(0, len, -e - 0.014, th + e + 0.014), yD, 0.014, PAL.woodDark, PAL.woodDark, { ...soft, cast: false });
      for (const u0 of [0, len - post]) put(B, R(u0, u0 + post, -e - 0.016, th + e + 0.016), 0.01, T.wallH + 0.004, PAL.woodDark, PAL.wallCap, { mat: MATS.soft, r: 0.006 });
      for (let i = 0; i < n; i++) {
        const off = (i % 2 ? 1 : -1) * th * 0.14, ua = post + i * pl, ub = ua + pl, v0 = -e + off, v1 = th + e + off, fw = 0.024;
        put(B, R(ua + 0.004, ub - 0.004, v0, v1), 0.012, T.wallH, PAL.paper, PAL.wallCap, { r: 0.003 });
        for (const u0 of [ua, ub - fw]) put(B, R(u0, u0 + fw, v0 - 0.005, v1 + 0.005), 0.012, T.wallH + 0.002, PAL.wallCap, PAL.wallCap, { ...soft, cast: false });
        put(B, R(ua, ub, v0 - 0.005, v1 + 0.005), 0.012, 0.05, PAL.wallCap, PAL.wallCap, { ...soft, cast: false });
        const hu = i % 2 ? ua + 0.11 : ub - 0.17;
        put(Bn, R(hu, hu + 0.06, v0 - 0.008, v1 + 0.008), 0.19, 0.29, PAL.charcoal, PAL.charcoal, { mat: MATS.soft, r: 0.006, cast: false });
      }
      occ(x1, z1, x2, z2, T.wallH, 0.95);
    } else {
      boxInto(B, x1, z1, x2, z2, yD - 0.02, T.wallH, PAL.wallSide, PAL.wallCap);
      skirt(x1, z1, x2, z2);
      occ(x1, z1, x2, z2, T.wallH, 0.92);
    }
  }
  const fp = [], fk = [], fr = [], fd = [];
  const quad = (x1, z1, x2, z2, y, kind, dir) => {
    fp.push(x1, y, z1, x1, y, z2, x2, y, z2, x1, y, z1, x2, y, z2, x2, y, z1);
    for (let i = 0; i < 6; i++) { fk.push(kind); fr.push(x1, z1, x2, z2); fd.push(dir); }
  };
  quad(0, 0, W, H, yD - 0.004, 0, 0);
  for (const r of info.rooms) quad(r.x1, r.z1, r.x2, r.z2, r.doma ? yD : 0, r.kind, r.x2 - r.x1 >= r.z2 - r.z1 ? 0 : 1);
  const floorGeo = new THREE.BufferGeometry();
  floorGeo.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
  floorGeo.setAttribute('aKind', new THREE.Float32BufferAttribute(fk, 1));
  floorGeo.setAttribute('aRoom', new THREE.Float32BufferAttribute(fr, 4));
  floorGeo.setAttribute('aDir', new THREE.Float32BufferAttribute(fd, 1));
  floorGeo.computeBoundingSphere();
  for (let i = 0; i < info.rooms.length; i++) for (let j = i + 1; j < info.rooms.length; j++) {
    const a = info.rooms[i], b = info.rooms[j];
    if (a.doma || b.doma || a.kind === b.kind) continue;
    const xa = Math.max(a.x1, b.x1), xb = Math.min(a.x2, b.x2), za = Math.max(a.z1, b.z1), zb = Math.min(a.z2, b.z2), w = 0.028, o = { mat: MATS.soft, r: 0.003, cast: false };
    if (xb - xa > 0.01 && Math.abs(zb - za) < 0.003) boxInto(B, xa, za - w, xb, za + w, -0.004, 0.005, PAL.step, PAL.step, o);
    else if (zb - za > 0.01 && Math.abs(xb - xa) < 0.003) boxInto(B, xa - w, za, xa + w, zb, -0.004, 0.005, PAL.step, PAL.step, o);
  }
  const kw = 0.09, kt = 0.014, e = 0.003, ko = { mat: MATS.soft, r: 0.012 };
  for (const d of info.rooms) {
    if (!d.doma) continue;
    for (const r of info.rooms) {
      if (r.doma) continue;
      const xa = Math.max(d.x1, r.x1), xb = Math.min(d.x2, r.x2), za = Math.max(d.z1, r.z1), zb = Math.min(d.z2, r.z2);
      if (xb - xa > 0.01 && Math.abs(d.z1 - r.z2) < e) boxInto(B, xa, r.z2 - kw, xb, r.z2 + kt, yD - 0.01, 0.006, PAL.step, PAL.step, ko);
      else if (xb - xa > 0.01 && Math.abs(d.z2 - r.z1) < e) boxInto(B, xa, r.z1 - kt, xb, r.z1 + kw, yD - 0.01, 0.006, PAL.step, PAL.step, ko);
      else if (zb - za > 0.01 && Math.abs(d.x1 - r.x2) < e) boxInto(B, r.x2 - kw, za, r.x2 + kt, zb, yD - 0.01, 0.006, PAL.step, PAL.step, ko);
      else if (zb - za > 0.01 && Math.abs(d.x2 - r.x1) < e) boxInto(B, r.x1 - kt, za, r.x1 + kw, zb, yD - 0.01, 0.006, PAL.step, PAL.step, ko);
    }
  }
  const place = (g, x, z) => {
    g.position.set(x, info.floorY(x, z), z);
    if (typeof g.userData.anim === 'function') { g.traverse((m) => m.layers.enable(1)); info.live.push(g); } else B.addObject(g);
  };
  const safe = (fn, fallback) => { try { const g = fn(); if (g && g.isObject3D) return g; } catch (err) { console.warn('[stage] 形を作れなかった', err); } return fallback(); };
  for (const q of L.rects || []) {
    const w = (q.x2 - q.x1) / 1000, d = (q.y2 - q.y1) / 1000, cx = (q.x1 + q.x2) / 2000, cz = (q.y1 + q.y2) / 2000;
    const g = safe(() => MODELS.createStatic(q.kind, { w, d, face: q.face || 'S' }), () => new Builder().box(w, 0.5, d, PAL.wood, { y: 0.25, cls: 'soft' }).build());
    occ(q.x1 / 1000, q.y1 / 1000, q.x2 / 1000, q.y2 / 1000, g.userData.h ?? HEIGHTS[q.kind] ?? 0.5, meanLum(g));
    place(g, cx, cz);
  }
  for (const q of L.circles || []) {
    const r = q.r / 1000, x = q.x / 1000, z = q.y / 1000;
    const g = safe(() => MODELS.createStatic(q.kind, { r }), () => new Builder().cyl(r, r, 0.5, PAL.wood, { y: 0.25, cls: 'soft' }).build());
    const h = g.userData.h ?? HEIGHTS[q.kind] ?? 0.5;
    info.circ.push({ x, z, r, h });
    info.occ.push({ x1: x - r * 0.8, z1: z - r * 0.8, x2: x + r * 0.8, z2: z + r * 0.8, h, lum: -1 });
    place(g, x, z);
  }
  for (const q of L.decor || []) {
    if (q.kind === 'window') continue;
    const g = safe(() => MODELS.createDecor(q.kind, { w: q.w / 1000, d: q.h / 1000, variant: q.variant }), () => new THREE.Group());
    place(g, q.x / 1000, q.y / 1000);
    info.flat.push({ x1: (q.x - q.w / 2) / 1000, z1: (q.y - q.h / 2) / 1000, x2: (q.x + q.w / 2) / 1000, z2: (q.y + q.h / 2) / 1000, futon: q.kind === 'futon' });
  }
  const futonTop = MODELS.FUTON_TOP ?? 0.05;
  info.lift = (x, z) => {
    let k = 0;
    for (let i = 0; i < info.flat.length; i++) {
      const q = info.flat[i];
      if (!q.futon) continue;
      const d = Math.min(x - q.x1, q.x2 - x, z - q.z1, q.z2 - z);
      if (d > 0) k = Math.max(k, Math.min(1, d / 0.1));
    }
    return k * futonTop;
  };
  return { info, B, Bn, floorGeo };
}
function buildGarden(info, B, Bp) {
  const { W, H, door, px0, pz0, px1, pz1 } = info, yL = -T.lawnDrop, rnd = makeRnd(20240901);
  const dcx = (door.x1 + door.x2) / 2;
  const rot = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
  const cSoil = linear(PAL.soil), cSoilD = linear(PAL.soilDark), cBase = linear(PAL.cream), cBaseT = linear(PAL.white);
  let g = new THREE.ExtrudeGeometry(rrShape(px0, pz0, px1, pz1, T.plinthR), { depth: T.soilT, bevelEnabled: false, curveSegments: 12 });
  _m4.makeTranslation(0, yL - T.soilT, 0).multiply(rot);
  Bp.add(g, _m4, MATS.matte, { cast: false, color: (nx, ny) => (ny > 0.5 ? cSoilD : cSoil) });
  g = new THREE.ExtrudeGeometry(rrShape(px0 - 0.07, pz0 - 0.07, px1 + 0.07, pz1 + 0.07, T.plinthR + 0.07), { depth: T.baseT - 0.05, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3, curveSegments: 12 });
  _m4.makeTranslation(0, yL - T.soilT - T.baseT + 0.025, 0).multiply(rot);
  Bp.add(g, _m4, MATS.soft, { cast: false, color: (nx, ny) => (ny > 0.5 ? cBaseT : cBase) });
  const leafA = linear(PAL.leaf), leafB = linear(PAL.leafLight), leafC = linear(PAL.green), leafD = linear(PAL.leafDark);
  const inset = 0.19, r = T.plinthR - inset, x0 = px0 + inset, z0 = pz0 + inset, x1 = px1 - inset, z1 = pz1 - inset, step = 0.165, pts = [];
  const line = (ax, az, bx, bz) => { const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / step)); for (let i = 0; i < n; i++) pts.push([ax + (bx - ax) * i / n, az + (bz - az) * i / n]); };
  const arc = (cx, cz, a0) => { const n = Math.max(2, Math.round(r * Math.PI / 2 / step)); for (let i = 0; i < n; i++) { const a = a0 + Math.PI / 2 * i / n; pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } };
  line(x0 + r, z0, x1 - r, z0); arc(x1 - r, z0 + r, -Math.PI / 2); line(x1, z0 + r, x1, z1 - r); arc(x1 - r, z1 - r, 0);
  line(x1 - r, z1, x0 + r, z1); arc(x0 + r, z1 - r, Math.PI / 2); line(x0, z1 - r, x0, z0 + r); arc(x0 + r, z0 + r, Math.PI);
  const gap = (door.x2 - door.x1) / 2 + 0.42, ico = icoGeo(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  const blob = (x, y, z, rx, ry, top, bot) => {
    _m4.compose(ps.set(x, y, z), _q.identity(), sc.set(rx, ry, rx));
    B.add(ico, _m4, MATS.matte, { color: (nx, ny) => { const k = clamp(ny * 0.65 + 0.5, 0, 1); return [bot[0] + (top[0] - bot[0]) * k, bot[1] + (top[1] - bot[1]) * k, bot[2] + (top[2] - bot[2]) * k]; } });
  };
  for (const [x, z] of pts) {
    if (z > H + 1 && Math.abs(x - dcx) < gap) continue;
    const k = rnd(), top = k < 0.45 ? leafB : k < 0.8 ? leafC : leafA, rr = 0.135 + rnd() * 0.04;
    blob(x + (rnd() - 0.5) * 0.04, yL + 0.13 + rnd() * 0.03, z + (rnd() - 0.5) * 0.04, rr, rr * (1.1 + rnd() * 0.25), top, leafD);
    if (rnd() < 0.35) blob(x + (rnd() - 0.5) * 0.07, yL + 0.26 + rnd() * 0.03, z + (rnd() - 0.5) * 0.07, 0.075 + rnd() * 0.03, 0.08, leafB, leafA);
  }
  for (const sx of [-1, 1]) boxInto(B, dcx + sx * gap - 0.08, pz1 - inset - 0.08, dcx + sx * gap + 0.08, pz1 - inset + 0.08, yL, yL + 0.42, PAL.cream, PAL.wallCap, { r: 0.014 });
  const pxa = door.x1 - 0.3, pxb = door.x2 + 0.3, pza = H - 0.005, pzb = H + 1.36, yP = -T.domaDrop, jt = 0.012;
  boxInto(B, pxa, pza, pxb, pzb, yL - 0.02, yP - 0.008, PAL.domaDark, PAL.domaDark, { r: 0.012 });
  const tnx = Math.max(2, Math.round((pxb - pxa) / 0.3)), tnz = Math.max(2, Math.round((pzb - pza) / 0.3)), tw = (pxb - pxa - jt) / tnx, td = (pzb - pza - jt) / tnz;
  const tileCol = [PAL.tile, PAL.tile, PAL.stone, PAL.tile, PAL.tileDark];
  for (let ix = 0; ix < tnx; ix++) for (let iz = 0; iz < tnz; iz++) {
    const tx = pxa + jt + ix * tw, tz = pza + jt + iz * td, c = tileCol[Math.floor(rnd() * tileCol.length)];
    boxInto(B, tx, tz, tx + tw - jt, tz + td - jt, yP - 0.02, yP, c, c, { r: 0.005, mat: MATS.soft, cast: false });
  }
  for (const bx of [pxa - 0.27, pxb + 0.27]) {
    if (bx < px0 + 0.5 || bx > px1 - 0.5) continue;
    blob(bx, yL + 0.15, H + 0.36, 0.17, 0.19, leafB, leafD); blob(bx + 0.04, yL + 0.3, H + 0.33, 0.1, 0.1, leafB, leafA);
  }
  const mx = dcx + gap + 0.02, mz = pz1 - inset - 0.38;
  boxInto(B, mx - 0.022, mz - 0.022, mx + 0.022, mz + 0.022, yL, yL + 0.34, PAL.woodDark, PAL.woodDark, { r: 0.006, mat: MATS.soft });
  boxInto(B, mx - 0.11, mz - 0.08, mx + 0.11, mz + 0.08, yL + 0.33, yL + 0.47, PAL.red, PAL.redDark, { r: 0.03, mat: MATS.gloss });
  boxInto(B, mx - 0.07, mz + 0.076, mx + 0.07, mz + 0.086, yL + 0.41, yL + 0.432, PAL.black, PAL.black, { r: 0.002, mat: MATS.soft, cast: false });
  const cyl = new THREE.CylinderGeometry(1, 1.1, 1, 10), stA = linear(PAL.stone), stB = linear(PAL.stoneDark);
  let i = 0;
  for (let z = H + 1.62; z < pz1 - 0.12; z += 0.42, i++) {
    _q.setFromAxisAngle(_v.set(0, 1, 0), rnd() * 3);
    _m4.compose(ps.set(dcx + (i % 2 ? 0.13 : -0.13) + (rnd() - 0.5) * 0.06, yL + 0.016, z), _q, sc.set(0.2 + rnd() * 0.05, 0.036, 0.15 + rnd() * 0.04));
    B.add(cyl, _m4, MATS.matte, { color: (nx, ny) => (ny > 0.5 ? stA : stB) });
  }
  const fl = [linear(PAL.white), linear(PAL.yellow), linear(PAL.pink)];
  const spots = [[pxa - 0.3, H + 0.86], [pxb + 0.34, H + 0.92], [px0 + 0.62, pz1 - 0.7], [px1 - 0.66, pz1 - 0.62], [px0 + 0.7, H + 1.15], [px1 - 0.75, H + 1.3], [dcx - 1.5, pz1 - 0.55], [dcx + 1.45, pz1 - 0.5]];
  spots.forEach(([fx, fz], n) => {
    for (let k = 0; k < 5; k++) { _m4.compose(ps.set(fx + (rnd() - 0.5) * 0.26, yL + 0.03, fz + (rnd() - 0.5) * 0.22), _q.identity(), sc.set(0.03, 0.028, 0.03)); B.add(ico, _m4, MATS.matte, { cast: false, color: fl[(n + (k > 2 ? 1 : 0)) % 3] }); }
  });
}
function ensureFont(done) {
  try {
    if (!document.fonts || typeof FontFace === 'undefined') { done(); return; }
    let has = false;
    document.fonts.forEach((f) => { if (f.family.replace(/["']/g, '') === 'Zen Maru Gothic') has = true; });
    if (!has) {
      for (const [w, name] of [[700, 'Bold'], [900, 'Black']]) {
        document.fonts.add(new FontFace('Zen Maru Gothic', `url(${new URL(`../vendor/fonts/ZenMaruGothic-${name}.ttf`, import.meta.url).href})`, { weight: String(w) }));
      }
    }
    Promise.all([document.fonts.load('700 32px "Zen Maru Gothic"', '寝室'), document.fonts.load('900 32px "Zen Maru Gothic"', '0')]).then(done, done);
  } catch (err) { done(); }
}
function drawGlyphs(cv) {
  const g = cv.getContext('2d'), G = {};
  g.clearRect(0, 0, cv.width, cv.height);
  g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
  let x = 6;
  const put = (key, text, font, y0, hc, base, fill, stroke, sw) => {
    g.font = font;
    const adv = g.measureText(text).width, pad = 6 + (sw || 0) / 2, w = Math.ceil(adv + pad * 2);
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = sw; g.strokeText(text, x + pad, y0 + base); }
    g.fillStyle = fill; g.fillText(text, x + pad, y0 + base);
    G[key] = { u0: x / cv.width, u1: (x + w) / cv.width, v0: 1 - (y0 + hc) / cv.height, v1: 1 - y0 / cv.height, w, h: hc, adv, pad };
    x += w + 6;
  };
  for (const ch of '0123456789+.') put(ch, ch, `900 64px ${FONT}`, 0, 84, 66, '#fff');
  put('u', 'm/秒', `700 44px ${FONT}`, 0, 84, 64, '#fff');
  x = 6;
  put('!', '！', `900 104px ${FONT}`, 92, 150, 122, PAL.red, '#fff', 16);
  put('…', '…', `900 96px ${FONT}`, 92, 150, 112, PAL.ink, '#fff', 16);
  return G;
}
const ENV_FS =  `
uniform vec3 uSky, uHorizon, uBounce, uSunCol, uSunDir; varying vec3 vD;
void main(){
  vec3 d = normalize(vD);
  vec3 c = d.y > 0.0 ? mix(uHorizon, uSky, pow(d.y, 0.45)) : mix(uHorizon, uBounce, pow(-d.y, 0.35));
  float sd = max(dot(d, uSunDir), 0.0);
  c += uSunCol * (pow(sd, 6.0) * 0.7 + pow(sd, 70.0) * 5.0);
  gl_FragColor = vec4(c, 1.0);
}`;
function mkPose() { return { tx: 0, ty: 0, tz: 0, yaw: 0, tilt: 0.3, dist: 40, panX: 0, panY: 0 }; }
function copyPose(o, a) { o.tx = a.tx; o.ty = a.ty; o.tz = a.tz; o.yaw = a.yaw; o.tilt = a.tilt; o.dist = a.dist; o.panX = a.panX; o.panY = a.panY; return o; }
function lerpPose(o, a, b, k) {
  o.tx = lerp(a.tx, b.tx, k); o.ty = lerp(a.ty, b.ty, k); o.tz = lerp(a.tz, b.tz, k); o.yaw = lerp(a.yaw, b.yaw, k);
  o.tilt = lerp(a.tilt, b.tilt, k); o.dist = lerp(a.dist, b.dist, k); o.panX = lerp(a.panX, b.panX, k); o.panY = lerp(a.panY, b.panY, k);
}
export function createStage(canvas, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.shadowMap.autoUpdate = false;
  renderer.info.autoReset = false;
  const gl = renderer.getContext();
  const hdr = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
  const rtType = hdr ? THREE.HalfFloatType : THREE.UnsignedByteType;
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  let qName = 'high', Q = QUALITY.high;
  let cssW = 1, cssH = 1, bufW = 2, bufH = 2, rectL = 0, rectT = 0;
  const insets = { top: 0, bottom: 0 };
  let house = null, time = 0, lost = false, disposed = false;
  const rnd = makeRnd(9731);
  const scene = new THREE.Scene(), overlay = new THREE.Scene(), iconScene = new THREE.Scene();
  const world = new THREE.Group(); scene.add(world);
  const sunDir = new THREE.Vector3(Math.sin(T.sunAz * D2R) * Math.cos(T.sunEl * D2R), Math.sin(T.sunEl * D2R), -Math.cos(T.sunAz * D2R) * Math.cos(T.sunEl * D2R));
  const sun = new THREE.DirectionalLight(T.sunCol, T.sunPow);
  sun.castShadow = true; sun.layers.enable(1); sun.layers.enable(2);
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.015; sun.shadow.radius = 2.4;
  sun.shadow.camera.up.set(0, 0, -1);
  scene.add(sun, sun.target);
  const U = {
    time: { value: 0 }, sunDir: { value: sunDir }, sunCol: { value: lin(T.sunCol, T.sunPow) },
    skyCol: { value: lin(T.skyCol, T.skyPow) }, bounceCol: { value: lin(T.bounceCol, T.bouncePow) },
    shadowMap: { value: null }, shadowMatrix: { value: sun.shadow.matrix }, shadowPar: { value: new THREE.Vector4(1, 1, 1, 0) }, sunSoft: { value: T.sunSoft },
    plinth: { value: new THREE.Vector4() }, plinthR: { value: T.plinthR }, goal: { value: 0 },
  };
  const shadowDefs = () => ({ NF_SHQ: Q.shq, NF_BLK: Q.blk, NF_PCF: Q.pcf, NF_SEARCH: '0.22' });
  const floorU = {
    uSunDir: U.sunDir, uSunCol: U.sunCol, uSkyCol: U.skyCol, uBounceCol: U.bounceCol,
    uWinCol: { value: lin(T.winCol, T.winPow) }, uSkyRefl: { value: lin(T.skyRefl, T.skyReflPow) },
    uShadowMap: U.shadowMap, uShadowMatrix: U.shadowMatrix, uShadowPar: U.shadowPar, uSunSoft: U.sunSoft,
    uHouseMap: { value: null }, uHouseRect: { value: new THREE.Vector4(0, 0, 1, 1) },
    uRefl: { value: null }, uReflDepth: { value: null }, uReflMatrix: { value: new THREE.Matrix4() }, uReflInv: { value: new THREE.Matrix4() },
    uReflTexel: { value: new THREE.Vector2(1, 1) }, uReflPar: { value: new THREE.Vector4(1, T.reflBlur, T.reflFade, T.reflMaxLod) },
    uPal: { value: [PAL.oak, PAL.oakDark, PAL.oakLight, PAL.hall, PAL.tatami, PAL.tatamiDark, PAL.heri, PAL.tile, PAL.tileDark, PAL.doma, PAL.domaDark].map((h) => lin(h)) },
    uStreak: { value: new THREE.Vector4(-99, 0.3, 0, 0) }, uDoor: { value: new THREE.Vector4(0, 0, 0.6, T.doorGlow) }, uCeil: { value: T.ceilH },
  };
  const floorMat = new THREE.ShaderMaterial({ uniforms: floorU, vertexShader: FLOOR_VS, fragmentShader: FLOOR_FS });
  const lawnMat = new THREE.ShaderMaterial({
    uniforms: {
      uSunDir: U.sunDir, uSunCol: U.sunCol, uSkyCol: U.skyCol, uBounceCol: U.bounceCol, uG0: { value: lin(PAL.grass) }, uG1: { value: lin(PAL.grassDark) },
      uShadowMap: U.shadowMap, uShadowMatrix: U.shadowMatrix, uShadowPar: U.shadowPar, uSunSoft: U.sunSoft,
      uHouse: { value: new THREE.Vector4() }, uPlinth: U.plinth, uPlinthR: U.plinthR, uOutBoost: { value: T.outBoost },
    }, vertexShader: WORLD_VS, fragmentShader: LAWN_FS,
  });
  const tableMat = new THREE.ShaderMaterial({
    uniforms: { uPlinth: U.plinth, uPlinthR: U.plinthR, uBg0: { value: lin(T.bg[0], 1 / T.exposure) }, uBg1: { value: lin(T.bg[1], 1 / T.exposure) }, uBg2: { value: lin(T.bg[2], 1 / T.exposure) }, uSunXZ: { value: new THREE.Vector2(sunDir.x, sunDir.z) } },
    vertexShader: WORLD_VS, fragmentShader: TABLE_FS,
  });
  const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
  const shaftMat = new THREE.ShaderMaterial({ ...add, side: THREE.DoubleSide, uniforms: { uCol: { value: lin(T.winCol, 0.085) }, uTime: U.time }, vertexShader: SHAFT_VS, fragmentShader: SHAFT_FS });
  const dustMat = new THREE.ShaderMaterial({ ...add, uniforms: { uCol: { value: lin(T.dustCol, 1.5) }, uTime: U.time, uSunDir: U.sunDir, uPx: { value: 2 } }, vertexShader: DUST_VS, fragmentShader: DUST_FS });
  const labelCanvas = document.createElement('canvas'); labelCanvas.width = 1024; labelCanvas.height = 512;
  const labelTex = new THREE.CanvasTexture(labelCanvas); labelTex.anisotropy = maxAniso;
  const labelMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.MultiplyBlending, uniforms: { uMap: { value: labelTex }, uInk: { value: lin(PAL.floorInk) }, uOpacity: { value: T.labelInk } }, vertexShader: UV_VS, fragmentShader: DECAL_FS });
  const chevMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uCol: { value: lin(PAL.sun, 1.25) }, uFlow: { value: 0 }, uGoal: U.goal }, vertexShader: UV_VS, fragmentShader: CHEV_FS });
  const glowMat = new THREE.ShaderMaterial({ ...add, uniforms: { uCol: { value: lin(T.glowCol) }, uPow: { value: 0.3 } }, vertexShader: UV_VS, fragmentShader: GLOW_FS });
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envRT = null;
  function buildEnv() {
    const es = new THREE.Scene();
    const m = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { uSky: { value: lin(T.skyCol, T.skyPow) }, uHorizon: { value: lin(T.horizonCol, T.skyPow * 0.95) }, uBounce: { value: lin(T.bounceCol, T.bouncePow) }, uSunCol: { value: lin(T.sunCol) }, uSunDir: { value: sunDir } },
      vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: ENV_FS,
    }));
    es.add(m);
    if (envRT) envRT.dispose();
    envRT = pmrem.fromScene(es, 0.03, 0.1, 100);
    scene.environment = envRT.texture; iconScene.environment = envRT.texture;
    m.geometry.dispose(); m.material.dispose();
  }
  const fsGeo = new THREE.BufferGeometry(); fsGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const fsMesh = new THREE.Mesh(fsGeo, null); fsMesh.frustumCulled = false;
  const fsCam = new THREE.Camera();
  const fsOpt = { depthTest: false, depthWrite: false, vertexShader: FS_VS };
  const downMat = new THREE.ShaderMaterial({ ...fsOpt, uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThresh: { value: 0 } }, fragmentShader: DOWN_FS });
  const upMat = new THREE.ShaderMaterial({ ...fsOpt, transparent: true, blending: THREE.AdditiveBlending, uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uGain: { value: 1 } }, fragmentShader: UP_FS });
  const postU = {
    tScene: { value: null }, tBloom: { value: null }, uRes: { value: new THREE.Vector2(1, 1) },
    uTilt: { value: new THREE.Vector4(0.5, T.tiltBand, T.tiltBlurPx, 1) }, uGrade: { value: new THREE.Vector4(T.exposure, T.saturation, T.contrast, T.bloom) },
    uWarm: { value: new THREE.Vector3(T.warm[0], T.warm[1], T.warm[2]) }, uVig: { value: T.vignette }, uMood: { value: new THREE.Vector4(0, 0, 0, 0) },
    uLeak: { value: new THREE.Vector4(0.95, 1.02, T.leak, 0) }, uLeakCol: { value: lin(T.leakCol) }, uFlip: { value: 0 },
  };
  const postMat = new THREE.ShaderMaterial({ ...fsOpt, uniforms: postU, fragmentShader: POST_FS });
  const iconPostMat = new THREE.ShaderMaterial({ ...fsOpt, uniforms: { tScene: { value: null }, uExposure: { value: T.exposure } }, fragmentShader: ICON_FS });
  function pass(mat, target) { fsMesh.material = mat; renderer.setRenderTarget(target); renderer.render(fsMesh, fsCam); }
  const shadowCam = new THREE.PerspectiveCamera(10, 1, 0.1, 1), rtNull = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
  shadowCam.position.set(0, 900, 0); shadowCam.lookAt(0, 1000, 1); shadowCam.layers.set(2); shadowCam.updateMatrixWorld();
  const proxyMat = new THREE.MeshBasicMaterial();
  let rtHouse = null, main = null;
  function buildTargets(w, h, msaa = Q.msaa) {
    const lf = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false }, t = { w, h, scene: null, refl: null, bloom: [] };
    t.scene = new THREE.WebGLRenderTarget(w, h, { ...lf, type: rtType, samples: msaa, depthBuffer: true, stencilBuffer: true });
    if (Q.refl > 0) {
      const rw = Math.max(32, Math.round(w * Q.refl)), rh = Math.max(32, Math.round(h * Q.refl));
      t.refl = new THREE.WebGLRenderTarget(rw, rh, { type: rtType, depthBuffer: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: true });
      t.refl.depthTexture = new THREE.DepthTexture(rw, rh);
    }
    if (Q.bloom) { let bw = w, bh = h; for (let i = 0; i < 5; i++) { bw = Math.max(4, bw >> 1); bh = Math.max(4, bh >> 1); t.bloom.push(new THREE.WebGLRenderTarget(bw, bh, { ...lf, type: rtType, depthBuffer: false })); } }
    return t;
  }
  function freeTargets(t) { if (!t) return; t.scene.dispose(); if (t.refl) { t.refl.depthTexture.dispose(); t.refl.dispose(); } for (const b of t.bloom) b.dispose(); }
  function makeTargets() { freeTargets(main); main = buildTargets(bufW, bufH); freeSnap(); warmKey = ''; warmJob = null; }
  function applyQuality(name) {
    qName = QUALITY[name] ? name : 'high'; Q = QUALITY[qName];
    floorMat.defines = { NF_REFL: rtType === THREE.UnsignedByteType && Q.reflQ === 2 ? 1 : Q.reflQ, ...shadowDefs() }; floorMat.needsUpdate = true;
    lawnMat.defines = shadowDefs(); lawnMat.needsUpdate = true;
    postMat.defines = {}; if (Q.bloom) postMat.defines.NF_BLOOM = 1; if (Q.tilt) postMat.defines.NF_TILT = 1; postMat.needsUpdate = true;
    if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    if (house) fitSun();
    resize();
  }
  const cam = new THREE.PerspectiveCamera(T.fov, 1, 1, 200), mirrorCam = new THREE.PerspectiveCamera(T.fov, 1, 1, 200), fitCam = new THREE.PerspectiveCamera(T.fov, 1, 1, 200);
  mirrorCam.layers.set(1);
  const pose = mkPose(), poseFrom = mkPose(), poseGoal = mkPose(), posePlay = mkPose(), poseLive = mkPose(), poseM = mkPose(), poseKeep = mkPose();
  let camMode = 'play', camT0 = -10, camDur = 0, playDirty = true, poseOk = false, poiX = 0, poiZ = 0, shake = 0, speedK = 0, pxPerM = 50, playerX = 0, playerZ = 0, playerSpeed = 0;
  function applyPose(p, c) {
    const st = Math.sin(p.tilt), ct = Math.cos(p.tilt), half = p.dist * Math.tan(T.fov * D2R / 2);
    c.position.set(p.tx + p.dist * st * Math.sin(p.yaw), p.ty + p.dist * ct, p.tz + p.dist * st * Math.cos(p.yaw));
    c.up.set(0, 1, 0); c.lookAt(p.tx, p.ty, p.tz);
    c.translateX(-p.panX * half * c.aspect); c.translateY(-p.panY * half);
    c.near = Math.max(1, p.dist - 24); c.far = p.dist + 46;
    c.updateProjectionMatrix(); c.updateMatrixWorld();
  }
  function fitPlay(o, m = T.fitMargin, south = T.fitSouth, pad = T.fitPad, tilt = T.tiltPlay) {
    const h = house;
    o.yaw = 0; o.tilt = tilt * D2R; o.tx = h.W / 2; o.ty = 0.15; o.tz = (h.H + south) / 2; o.dist = 40; o.panX = 0; o.panY = 0;
    const l = pad, r = cssW - pad, t = insets.top + pad, b = Math.max(t + 40, cssH - insets.bottom - pad);
    const nx0 = l / cssW * 2 - 1, nx1 = r / cssW * 2 - 1, ny1 = 1 - t / cssH * 2, ny0 = 1 - b / cssH * 2;
    fitCam.aspect = cssW / cssH;
    for (let it = 0; it < 14; it++) {
      applyPose(o, fitCam);
      let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
      for (let i = 0; i < 8; i++) {
        _v.set(i & 1 ? h.W + m : -m, i & 2 ? T.wallH : 0, i & 4 ? h.H + south : -m).project(fitCam);
        x0 = Math.min(x0, _v.x); x1 = Math.max(x1, _v.x); y0 = Math.min(y0, _v.y); y1 = Math.max(y1, _v.y);
      }
      const s = Math.max((x1 - x0) / (nx1 - nx0), (y1 - y0) / (ny1 - ny0));
      o.dist *= s;
      o.panX += (nx0 + nx1) / 2 - (o.panX + ((x0 + x1) / 2 - o.panX) / s);
      o.panY += (ny0 + ny1) / 2 - (o.panY + ((y0 + y1) / 2 - o.panY) / s);
    }
  }
  function goalPose(mode, o) {
    const th = Math.tan(T.fov * D2R / 2), aspect = cssW / cssH, py = (insets.bottom - insets.top) / cssH;
    if (mode === 'title') {
      o.tx = house.start.x + 0.3; o.ty = 0.15; o.tz = house.start.z + 0.2;
      o.tilt = T.tiltTitle * D2R; o.yaw = (T.yawTitle + 3.5 * Math.sin(time * 0.21)) * D2R;
      o.dist = Math.max(T.titleSpan[0] / (2 * th * aspect), T.titleSpan[1] / (2 * th)) * (1 + 0.03 * Math.sin(time * 0.16 + 1));
      o.panX = 0; o.panY = py;
    } else if (mode === 'finish') {
      const out = clamp(poiZ - house.H - 0.3, 0, T.plinthS - 1.1), dcx = (house.door.x1 + house.door.x2) / 2;
      o.tx = lerp(dcx, clamp(poiX, house.px0 + 0.8, house.px1 - 0.8), smooth(0, 0.9, out) * 0.85); o.ty = 0; o.tz = house.H + 0.1 + out * 0.85;
      o.tilt = T.tiltFinish * D2R; o.yaw = T.yawFinish * D2R;
      o.dist = Math.max(T.finishSpan[0] / (2 * th * aspect), T.finishSpan[1] / (2 * th)) * (1 - 0.05 * clamp((time - camT0) / 4, 0, 1));
      o.panX = 0; o.panY = py;
    } else {
      const hb = cssH - insets.top - insets.bottom;
      if (mode === 'result' && hb < cssH * T.resultBand) {
        const h = house;
        o.tx = clamp(poiX, h.px0 + 0.7, h.px1 - 0.7); o.ty = 0.25; o.tz = clamp(poiZ, h.pz0 + 0.7, h.pz1 - 0.6);
        o.tilt = T.tiltResultNear * D2R; o.yaw = (T.yawResultNear + 2.5 * Math.sin(time * 0.24)) * D2R;
        o.dist = Math.max(T.resultSpan, hb / T.resultPx) * cssH / Math.max(48, hb) / (2 * th) * (1 - 0.04 * clamp((time - camT0) / 5, 0, 1));
        o.panX = 0; o.panY = py;
      } else if (mode === 'result') {
        copyPose(o, posePlay); o.yaw = 2.2 * Math.sin(time * 0.2) * D2R; o.tilt = T.tiltResult * D2R; o.dist *= 1.03;
      } else copyPose(o, poseZoom);
    }
  }
  let viewMode = T.view === 'wide' || T.view === 'whole' ? T.view : 'near';
  const poseWhole = mkPose(), poseZoom = mkPose();
  const vw = { k: 0, kv: 0, want: 0, aim: false, hasPath: false, pathZ: 0, lx: 0, lz: 0, az: 0, init: false, px: 0, pz: 0 };
  function refitPlay() {
    fitPlay(posePlay); playDirty = false;
    const py = (insets.bottom - insets.top) / cssH, th = Math.tan(T.fov * D2R / 2), w = poseWhole;
    fitCam.aspect = cssW / cssH; applyPose(posePlay, fitCam);
    _v.set(0, 0, 1).applyQuaternion(fitCam.quaternion); _v2.set(0, 1, 0).applyQuaternion(fitCam.quaternion);
    w.yaw = 0; w.tilt = posePlay.tilt; w.panX = 0; w.panY = py; w.ty = posePlay.ty;
    w.dist = (fitCam.position.y - w.ty) / (_v.y - py * th * _v2.y);
    w.tx = fitCam.position.x - w.dist * _v.x + py * w.dist * th * _v2.x;
    w.tz = fitCam.position.z - w.dist * _v.z + py * w.dist * th * _v2.z;
  }
  function softCut(sec) {
    if (!poseOk) return;
    const rest = Math.max(0, camT0 + camDur - time);
    copyPose(poseFrom, pose); camT0 = time; camDur = Math.max(rest, sec);
  }
  function updateView(dt) {
    const h = house, w = poseWhole, th = Math.tan(T.fov * D2R / 2), pxWhole = cssH / (2 * th * w.dist);
    const px = viewMode === 'wide' ? clamp(cssW / (h.W + T.wideSide * 2), pxWhole, pxWhole * T.wideMaxZoom)
      : viewMode === 'near' ? clamp(T.nearPx, pxWhole * T.nearZoom[0], pxWhole * T.nearZoom[1]) : pxWhole;
    const dz = w.dist * pxWhole / px, hx = cssW / (2 * px), hz = Math.max(60, cssH - insets.top - insets.bottom) / (2 * px * Math.cos(w.tilt));
    const sp = playerSpeed, lm = sp > 1e-3 && playerRec ? Math.min(sp * T.nearLeadSec, T.nearLeadMax) / sp : 0;
    vw.lx = damp(vw.lx, playerRec ? playerRec.vx * lm : 0, T.nearLeadRate, dt); vw.lz = damp(vw.lz, playerRec ? playerRec.vz * lm : 0, T.nearLeadRate, dt);
    let cx = playerX + vw.lx, cz = playerZ + vw.lz;
    if (viewMode === 'wide') {
      let off = vw.lz;
      if (vw.aim && vw.hasPath) { const keep = Math.max(0.2, hz - T.wideKeep); off = clamp((vw.pathZ - playerZ) / 2, -keep, keep); }
      vw.az = damp(vw.az, off, T.wideAimRate, dt);
      cx = h.W / 2; cz = playerZ + vw.az;
    }
    const m = T.viewMargin, x0 = h.px0 - m + hx, x1 = h.px1 + m - hx, z0 = h.pz0 - m + hz, z1 = h.pz1 + m - hz;
    cx = x0 <= x1 ? clamp(cx, x0, x1) : (h.px0 + h.px1) / 2;
    cz = z0 <= z1 ? clamp(cz, z0, z1) : (h.pz0 + h.pz1) / 2;
    const tau = (vw.want > vw.k ? T.viewInSec : T.viewOutSec) / 2.4, om = 2 / tau, x = om * dt, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x), ch = vw.k - vw.want, tmp = (vw.kv + om * ch) * dt;
    vw.kv = (vw.kv - om * tmp) * e; vw.k = vw.want + (ch + tmp) * e;
    const k = clamp(vw.k, 0, 1), d = Math.exp(lerp(Math.log(w.dist), Math.log(dz), k));
    const ox = lerp((playerX - w.tx) / w.dist, (playerX - cx) / dz, k), oz = lerp((playerZ - w.tz) / w.dist, (playerZ - cz) / dz, k);
    copyPose(poseZoom, w); poseZoom.dist = d; poseZoom.tx = playerX - ox * d; poseZoom.tz = playerZ - oz * d;
  }
  function updateCamera(dt) {
    if (playDirty) refitPlay();
    updateView(dt);
    if (camMode === 'play') placeLabels();
    if (!poseOk) { poseOk = true; goalPose(camMode, pose); copyPose(poseFrom, pose); }
    if (time < camT0) camT0 = time - camDur;
    goalPose(camMode, poseGoal);
    const k = camDur > 0 ? clamp((time - camT0) / camDur, 0, 1) : 1;
    lerpPose(pose, poseFrom, poseGoal, easeInOut(k));
    shake = damp(shake, 0, T.shakeDecay, dt);
    speedK = damp(speedK, camMode === 'play' && k >= 1 ? smooth(1.2, 5, playerSpeed) : 0, 2.5, dt);
    poiX = damp(poiX, playerX, 3.5, dt); poiZ = damp(poiZ, playerZ, 3.5, dt);
    copyPose(poseLive, pose);
    poseLive.dist *= 1 - T.speedZoom * speedK;
    poseLive.tx += (playerX - pose.tx) * T.speedLead * speedK; poseLive.tz += (playerZ - pose.tz) * T.speedLead * speedK;
    poseLive.panX += shake * Math.sin(time * 53); poseLive.panY += shake * Math.cos(time * 67);
    cam.aspect = cssW / cssH;
    applyPose(poseLive, cam);
    _v.set(house.W / 2 - 0.5, 0, house.H / 2).project(cam); _v2.set(house.W / 2 + 0.5, 0, house.H / 2).project(cam);
    pxPerM = Math.max(4, Math.hypot((_v2.x - _v.x) * cssW / 2, (_v2.y - _v.y) * cssH / 2));
  }
  function fitSun() {
    const h = house, cx = (h.px0 + h.px1) / 2, cz = (h.pz0 + h.pz1) / 2, sc = sun.shadow.camera;
    sun.target.position.set(cx, 0.2, cz); sun.position.copy(sun.target.position).addScaledVector(sunDir, 30);
    sun.updateMatrixWorld(); sun.target.updateMatrixWorld();
    sc.position.copy(sun.position); sc.lookAt(sun.target.position); sc.updateMatrixWorld();
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < 8; i++) {
      _v.set(i & 1 ? h.px1 : h.px0, i & 2 ? 1.15 : -0.45, i & 4 ? h.pz1 : h.pz0).applyMatrix4(sc.matrixWorldInverse);
      x0 = Math.min(x0, _v.x); x1 = Math.max(x1, _v.x); y0 = Math.min(y0, _v.y); y1 = Math.max(y1, _v.y); z0 = Math.min(z0, _v.z); z1 = Math.max(z1, _v.z);
    }
    sc.left = x0 - 0.1; sc.right = x1 + 0.1; sc.bottom = y0 - 0.1; sc.top = y1 + 0.1; sc.near = Math.max(0.5, -z1 - 0.5); sc.far = -z0 + 0.5;
    sc.updateProjectionMatrix();
    const ex = sc.right - sc.left, ey = sc.top - sc.bottom, k = Math.sqrt(ex / ey);
    sun.shadow.mapSize.set(Math.min(4096, Math.round(Q.shadow * k / 64) * 64), Math.min(4096, Math.round(Q.shadow / k / 64) * 64));
    if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    U.shadowPar.value.set(1 / ex, 1 / ey, sc.far - sc.near, 0);
    sun.shadow.normalBias = Math.max(0.012, 2.4 * ex / sun.shadow.mapSize.x);
  }
  const bakeU = {
    uR: { value: new Float32Array(BAKE_MAXR * 4) }, uRH: { value: new Float32Array(BAKE_MAXR * 2) }, uNR: { value: 0 },
    uC: { value: new Float32Array(BAKE_MAXC * 4) }, uNC: { value: 0 },
    uWa: { value: new Float32Array(BAKE_MAXW * 4) }, uWb: { value: new Float32Array(BAKE_MAXW * 4) }, uWc: { value: new Float32Array(BAKE_MAXW * 4) }, uNW: { value: 0 },
    uSun: { value: sunDir }, uSize: { value: new THREE.Vector2(1, 1) }, uP: { value: new THREE.Vector4(T.winSill, T.winHead, Math.tan(T.tiltPlay * D2R), 0) },
  };
  const bakeMat = new THREE.ShaderMaterial({ ...fsOpt, uniforms: bakeU, fragmentShader: BAKE_FS });
  let bakeDirty = false;
  function bake() {
    const h = house, w = 1024, hh = clamp(Math.round(1024 * h.H / h.W / 4) * 4, 256, 2048);
    if (!rtHouse || rtHouse.height !== hh) {
      if (rtHouse) rtHouse.dispose();
      rtHouse = new THREE.WebGLRenderTarget(w, hh, { depthBuffer: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
      rtHouse.texture.anisotropy = maxAniso;
    }
    let n = 0;
    for (const o of h.occ) { if (o.lum < 0 || n >= BAKE_MAXR) continue; bakeU.uR.value.set([o.x1, o.z1, o.x2, o.z2], n * 4); bakeU.uRH.value.set([o.h, o.lum], n * 2); n++; }
    bakeU.uNR.value = n; n = 0;
    for (const c of h.circ) { if (n >= BAKE_MAXC) break; bakeU.uC.value.set([c.x, c.z, c.r, c.h], n * 4); n++; }
    bakeU.uNC.value = n; n = 0;
    for (const wi of h.wins) { if (n >= BAKE_MAXW) break; bakeU.uWa.value.set([wi.o[0], wi.o[1], wi.u[0], wi.u[1]], n * 4); bakeU.uWb.value.set([wi.len, wi.panes, wi.n[0], wi.n[1]], n * 4); bakeU.uWc.value.set(wi.room, n * 4); n++; }
    bakeU.uNW.value = n;
    bakeU.uSize.value.set(h.W, h.H);
    pass(bakeMat, rtHouse);
    floorU.uHouseMap.value = rtHouse.texture;
    bakeDirty = false;
  }
  let houseMeshes = [], layoutObjs = [];
  function clearHouse() {
    for (const m of houseMeshes) { world.remove(m); m.geometry.dispose(); }
    for (const m of layoutObjs) { world.remove(m); if (m.geometry) m.geometry.dispose(); }
    if (house) for (const g of house.live) world.remove(g);
    houseMeshes = []; layoutObjs = [];
  }
  function addLayoutObj(m, reflect) { if (reflect) m.layers.enable(1); world.add(m); layoutObjs.push(m); return m; }
  function setLayout(L) {
    clearHouse();
    const hb = buildHouse(L), Bp = new Batch(); house = hb.info;
    buildGarden(house, hb.B, Bp);
    const sh = [];
    houseMeshes = hb.B.build(world, true, sh).concat(hb.Bn.build(world), Bp.build(world, false));
    if (sh.length) {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(sh, 3)); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, proxyMat); m.castShadow = true; m.matrixAutoUpdate = false; m.layers.set(2); world.add(m); houseMeshes.push(m);
    }
    for (const g of house.live) { g.traverse((m) => m.layers.enable(2)); world.add(g); }
    const h = house, yL = -T.lawnDrop, dcx = (h.door.x1 + h.door.x2) / 2;
    addLayoutObj(new THREE.Mesh(hb.floorGeo, floorMat));
    const lawn = addLayoutObj(new THREE.Mesh(new THREE.ShapeGeometry(rrShape(h.px0, h.pz0, h.px1, h.pz1, T.plinthR), 12), lawnMat));
    lawn.rotation.x = -Math.PI / 2; lawn.position.y = yL + 0.002;
    const table = addLayoutObj(new THREE.Mesh(new THREE.PlaneGeometry(400, 400), tableMat));
    table.rotation.x = -Math.PI / 2; table.position.set(h.W / 2, yL - T.soilT - T.baseT, h.H / 2);
    U.plinth.value.set((h.px0 + h.px1) / 2, (h.pz0 + h.pz1) / 2, (h.px1 - h.px0) / 2 + 0.07, (h.pz1 - h.pz0) / 2 + 0.07);
    lawnMat.uniforms.uHouse.value.set(h.W / 2, h.H / 2, h.W / 2, h.H / 2);
    floorU.uHouseRect.value.set(0, 0, 1 / h.W, 1 / h.H);
    floorU.uDoor.value.set(dcx, h.H - h.Tk, (h.door.x2 - h.door.x1) / 2, T.doorGlow);
    const sp = [], su = [], spn = [], dp = [], ds = [], r2 = makeRnd(77), sx = sunDir.x, sy = sunDir.y, sz = sunDir.z;
    for (const w of h.wins) {
      if (sx * w.n[0] + sz * w.n[1] > -0.05) continue;
      const ax = w.o[0], az = w.o[1], bx = ax + w.u[0] * w.len, bz = az + w.u[1] * w.len, rm = w.room;
      for (const hf of [1, 0.68, 0.38]) {
        const hy = T.winSill + (T.winHead - T.winSill) * hf;
        let t = hy / sy;
        for (const [ex, ez] of [[ax, az], [bx, bz]]) {
          if (sx > 1e-3) t = Math.min(t, (ex - rm[0]) / sx); else if (sx < -1e-3) t = Math.min(t, (rm[2] - ex) / -sx);
          if (sz > 1e-3) t = Math.min(t, (ez - rm[1]) / sz); else if (sz < -1e-3) t = Math.min(t, (rm[3] - ez) / -sz);
        }
        const f = t / (hy / sy), y1 = Math.max(0.012, hy - sy * t);
        sp.push(ax, hy, az, bx, hy, bz, bx - sx * t, y1, bz - sz * t, ax, hy, az, bx - sx * t, y1, bz - sz * t, ax - sx * t, y1, az - sz * t);
        su.push(0, 0, 1, 0, 1, f, 0, 0, 1, f, 0, f);
        for (let i = 0; i < 6; i++) spn.push(w.panes);
      }
      for (let i = 0; i < 26; i++) {
        const a = 0.06 + r2() * (w.len - 0.12);
        dp.push(w.o[0] + w.u[0] * a, T.winSill + (T.winHead - T.winSill) * (0.15 + 0.85 * r2()), w.o[1] + w.u[1] * a);
        ds.push(r2(), r2(), r2(), r2());
      }
    }
    if (sp.length) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(su, 2)); g.setAttribute('aPanes', new THREE.Float32BufferAttribute(spn, 1));
      addLayoutObj(new THREE.Mesh(g, shaftMat)).renderOrder = 8;
      const d = new THREE.BufferGeometry();
      d.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); d.setAttribute('aSeed', new THREE.Float32BufferAttribute(ds, 4));
      const pts = addLayoutObj(new THREE.Points(d, dustMat)); pts.frustumCulled = false; pts.renderOrder = 9;
    }
    const flatQuad = (x0, z0, x1, z1, y) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([x0, y, z0, x0, y, z1, x1, y, z1, x0, y, z0, x1, y, z1, x1, y, z0], 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0], 2));
      return g;
    };
    labelGeo = new THREE.BufferGeometry();
    addLayoutObj(new THREE.Mesh(labelGeo, labelMat)).renderOrder = 6;
    drawLabels();
    addLayoutObj(new THREE.Mesh(flatQuad(dcx - 0.24, h.H + 0.86, dcx + 0.24, h.H + 1.34, -T.domaDrop + 0.004), chevMat)).renderOrder = 6;
    addLayoutObj(new THREE.Mesh(flatQuad(dcx - 1.5, h.H - 0.3, dcx + 1.5, h.H + 2.3, -T.domaDrop + 0.01), glowMat)).renderOrder = 7;
    fitSun(); bakeDirty = true; playDirty = true;
    resetFx();
  }
  const avoidW = [];
  let avoidPx = null, labelDirty = true, lbW = 0, lbH = 0, lbT = -1, lbB = -1;
  function placeLabel(r, w, d, useAvoid) {
    const h = house, tan = Math.tan(T.tiltPlay * D2R), hw = w / 2 + 0.06, hd = d / 2 + 0.05, x0 = r.label.x, z0 = r.label.z;
    const free = (x, z) => {
      if (x - hw < r.x1 || x + hw > r.x2 || z - hd < r.z1 || z + hd > r.z2) return false;
      for (const o of h.occ) if (x + hw > o.x1 && x - hw < o.x2 && z + hd > o.z1 - o.h * tan && z - hd < o.z2) return false;
      for (const o of h.flat) if (x + hw > o.x1 && x - hw < o.x2 && z + hd > o.z1 && z - hd < o.z2) return false;
      if (useAvoid) for (const o of avoidW) if (x + hw > o.x1 && x - hw < o.x2 && z + hd > o.z1 && z - hd < o.z2) return false;
      return true;
    };
    if (free(x0, z0)) return { x: x0, z: z0 };
    let best = null, bd = 1e9;
    for (let x = r.x1; x <= r.x2; x += 0.12) for (let z = r.z1; z <= r.z2; z += 0.12) { const dd = (x - x0) * (x - x0) + (z - z0) * (z - z0); if (dd < bd && free(x, z)) { bd = dd; best = { x, z }; } }
    return best;
  }
  function screenToFloor(x0, y0, x1, y1, out) {
    out.x1 = out.z1 = 1e9; out.x2 = out.z2 = -1e9;
    for (let i = 0; i < 4; i++) {
      _v.set((i & 1 ? x1 : x0) / cssW * 2 - 1, 1 - (i & 2 ? y1 : y0) / cssH * 2, 0.5).unproject(fitCam).sub(fitCam.position);
      const t = Math.abs(_v.y) > 1e-9 ? -fitCam.position.y / _v.y : 0, x = fitCam.position.x + _v.x * t, z = fitCam.position.z + _v.z * t;
      out.x1 = Math.min(out.x1, x); out.x2 = Math.max(out.x2, x); out.z1 = Math.min(out.z1, z); out.z2 = Math.max(out.z2, z);
    }
    return out;
  }
  let labelGeo = null, labelSlots = [];
  function drawLabels() {
    if (!house || !labelGeo) return;
    const cv = labelCanvas, g = cv.getContext('2d'), h = house, fs = 56, rowH = 84;
    g.clearRect(0, 0, cv.width, cv.height);
    g.font = `700 ${fs}px ${FONT}`; g.fillStyle = '#fff'; g.textBaseline = 'alphabetic';
    labelSlots = [];
    for (const r of h.rooms) if (r.name && r.label) labelSlots.push({ text: r.name, room: r, y: r.doma ? -T.domaDrop : 0, size: T.labelSize });
    labelSlots.push({ text: 'ここから外へ', room: null, x: (h.door.x1 + h.door.x2) / 2, z: h.H + 0.74, y: -T.domaDrop, size: 0.15 });
    let cx = 8, cy = 0;
    for (const it of labelSlots) {
      const sp = fs * 0.12; let w = -sp;
      for (const ch of it.text) w += g.measureText(ch).width + sp;
      if (cx + w + 24 > cv.width) { cx = 8; cy += rowH; }
      let x = cx + 6;
      for (const ch of it.text) { g.fillText(ch, x, cy + 62); x += g.measureText(ch).width + sp; }
      it.ww = (w + 12) / fs * it.size; it.hh = rowH / fs * it.size;
      it.u0 = cx / cv.width; it.u1 = (cx + w + 12) / cv.width; it.v1 = 1 - cy / cv.height; it.v0 = 1 - (cy + rowH) / cv.height;
      cx += w + 28;
    }
    labelTex.needsUpdate = true;
    labelDirty = true; placeLabels();
  }
  function placeLabels() {
    if (!house || !labelGeo || !labelSlots.length) return;
    if (!labelDirty && lbW === cssW && lbH === cssH && lbT === insets.top && lbB === insets.bottom) return;
    labelDirty = false; lbW = cssW; lbH = cssH; lbT = insets.top; lbB = insets.bottom;
    avoidW.length = 0;
    if (cssW > 2 && cssH > 2) {
      refitPlay(); fitCam.aspect = cssW / cssH; applyPose(posePlay, fitCam);
      const cxp = cssW / 2, cyp = (insets.top + cssH - insets.bottom) / 2;
      if (avoidPx) for (const q of avoidPx) avoidW.push(screenToFloor(q.x - rectL, q.y - rectT, q.x - rectL + q.w, q.y - rectT + q.h, {}));
      else for (const q of T.coachZone) avoidW.push(screenToFloor(cxp + q[0], cyp + q[1], cxp + q[0] + q[2], cyp + q[1] + q[3], {}));
    }
    const pos = [], uv = [];
    for (const it of labelSlots) {
      let x = it.x, z = it.z;
      if (it.room) {
        const w = it.text.length * it.size * 1.14, d = it.size * 1.15, p = placeLabel(it.room, w, d, true) || placeLabel(it.room, w, d, false);
        if (!p) continue;
        x = p.x; z = p.z;
      }
      const y = it.y + 0.003, x0 = x - it.ww / 2, x1 = x + it.ww / 2, z0 = z - it.hh / 2, z1 = z + it.hh / 2;
      pos.push(x0, y, z0, x0, y, z1, x1, y, z1, x0, y, z0, x1, y, z1, x1, y, z0);
      uv.push(it.u0, it.v1, it.u0, it.v0, it.u1, it.v0, it.u0, it.v1, it.u1, it.v0, it.u1, it.v1);
    }
    labelGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    labelGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    labelGeo.computeBoundingSphere();
  }
  const PMAX = 400, PS = 24;
  const PD = new Float32Array(PMAX * PS); let pN = 0;
  const quadXY = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]);
  const quadXZ = new Float32Array([-1, 0, -1, -1, 0, 1, 1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0, -1]);
  const inst = (geo, name, n, size) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(n * size), size); a.setUsage(THREE.DynamicDrawUsage); geo.setAttribute(name, a); return a; };
  const partGeo = new THREE.InstancedBufferGeometry(); partGeo.setAttribute('position', new THREE.BufferAttribute(quadXY, 3));
  const pPos = inst(partGeo, 'iPos', PMAX, 3), pPar = inst(partGeo, 'iPar', PMAX, 4), pCol = inst(partGeo, 'iCol', PMAX, 4), pDir = inst(partGeo, 'iDir', PMAX, 3);
  partGeo.instanceCount = 0;
  const premul = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };
  const partMesh = new THREE.Mesh(partGeo, new THREE.ShaderMaterial({ ...premul, side: THREE.DoubleSide, vertexShader: PART_VS, fragmentShader: PART_FS }));
  partMesh.frustumCulled = false; partMesh.renderOrder = 12; scene.add(partMesh);
  function emit(type, x, y, z, vx, vy, vz, life, s0, s1, r, g, b, a, addv, rot, rv, drag, grav, dx, dz, st, delay) {
    if (pN >= PMAX) return;
    const o = pN++ * PS;
    PD[o] = x; PD[o + 1] = y; PD[o + 2] = z; PD[o + 3] = vx; PD[o + 4] = vy; PD[o + 5] = vz; PD[o + 6] = 0; PD[o + 7] = life; PD[o + 8] = s0; PD[o + 9] = s1;
    PD[o + 10] = rot; PD[o + 11] = rv; PD[o + 12] = type; PD[o + 13] = r; PD[o + 14] = g; PD[o + 15] = b; PD[o + 16] = a; PD[o + 17] = addv; PD[o + 18] = drag; PD[o + 19] = grav;
    PD[o + 20] = dx; PD[o + 21] = dz; PD[o + 22] = st; PD[o + 23] = delay;
  }
  function updateParticles(dt) {
    let w = 0;
    for (let i = 0; i < pN; i++) {
      const o = i * PS;
      let k = 0, vis = 1;
      if (PD[o + 23] > 0) { PD[o + 23] -= dt; vis = 0; }
      else {
        PD[o + 6] += dt;
        if (PD[o + 6] >= PD[o + 7]) { pN--; if (i < pN) PD.copyWithin(o, pN * PS, pN * PS + PS); i--; continue; }
        const dr = Math.exp(-PD[o + 18] * dt);
        PD[o + 3] *= dr; PD[o + 4] = PD[o + 4] * dr - PD[o + 19] * dt; PD[o + 5] *= dr;
        PD[o] += PD[o + 3] * dt; PD[o + 1] += PD[o + 4] * dt; PD[o + 2] += PD[o + 5] * dt; PD[o + 10] += PD[o + 11] * dt;
        k = PD[o + 6] / PD[o + 7];
      }
      const type = PD[o + 12], e = 1 - (1 - k) * (1 - k);
      let al = PD[o + 16] * vis * (type === 4 ? 1 - k : Math.pow(1 - k, 1.4));
      if (type === 0) al *= Math.min(1, k * 8) * (0.65 + 0.35 * Math.sin(k * 26 + i));
      pPos.array[w * 3] = PD[o]; pPos.array[w * 3 + 1] = PD[o + 1]; pPos.array[w * 3 + 2] = PD[o + 2];
      pPar.array[w * 4] = PD[o + 8] + (PD[o + 9] - PD[o + 8]) * e; pPar.array[w * 4 + 1] = PD[o + 10]; pPar.array[w * 4 + 2] = type; pPar.array[w * 4 + 3] = PD[o + 22];
      pCol.array[w * 4] = PD[o + 13]; pCol.array[w * 4 + 1] = PD[o + 14]; pCol.array[w * 4 + 2] = PD[o + 15]; pCol.array[w * 4 + 3] = al;
      pDir.array[w * 3] = PD[o + 20]; pDir.array[w * 3 + 1] = PD[o + 21]; pDir.array[w * 3 + 2] = PD[o + 17];
      w++;
    }
    partGeo.instanceCount = w; partMesh.visible = w > 0;
    if (w) { pPos.needsUpdate = true; pPar.needsUpdate = true; pCol.needsUpdate = true; pDir.needsUpdate = true; }
  }
  const bodyRoot = new THREE.Group(); scene.add(bodyRoot);
  const recs = [], recById = new Map();
  let playerRec = null;
  const silMat = new THREE.ShaderMaterial({
    vertexColors: true, uniforms: { uAlpha: { value: T.silAlpha }, uTint: { value: lin('#ffffff') } }, vertexShader: TINT_VS, fragmentShader: SIL_FS,
    blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, depthFunc: THREE.GreaterDepth, depthWrite: false,
    stencilWrite: true, stencilRef: 1, stencilFuncMask: 1, stencilWriteMask: 1, stencilFunc: THREE.NotEqualStencilFunc, stencilZPass: THREE.ReplaceStencilOp,
  });
  const ghostMat = new THREE.ShaderMaterial({ vertexColors: true, alphaToCoverage: true, uniforms: { uAlpha: { value: T.ghostAlpha }, uTint: { value: lin(T.ghostTint) } }, vertexShader: TINT_VS, fragmentShader: GHOST_FS });
  const hash01 = (n) => { const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };
  const idNum = (id) => { if (typeof id === 'number') return id; let h = 7; const s = String(id); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973; return h; };
  const itemId = (v) => (typeof v === 'number' ? ITEM_IDS[v] || 'keshi' : v || 'keshi');
  const bodyMat = new THREE.MeshStandardMaterial({ vertexColors: true });
  bodyMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aRME; varying vec3 vRME;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvRME = aRME;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vRME;')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = vRME.x;')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = vRME.y;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * vRME.z; diffuseColor.rgb *= 1.0 - vRME.z;');
  };
  const BATCH_N = 80, BATCH_V = 120000;
  const batch = new THREE.BatchedMesh(BATCH_N, BATCH_V, 3, bodyMat);
  batch.perObjectFrustumCulled = false; batch.sortObjects = false; batch.castShadow = true; batch.receiveShadow = true; batch.renderOrder = 2;
  batch.layers.enable(1); batch.layers.enable(2); batch.visible = false;
  batch.boundingSphere = new THREE.Sphere(new THREE.Vector3(3, 0, 5), 40); batch.boundingBox = new THREE.Box3(new THREE.Vector3(-40, -5, -40), new THREE.Vector3(40, 5, 40));
  scene.add(batch);
  const bodyKinds = new Map();
  let batchVerts = 0, batchLive = 0;
  function mergeBody(root, castOnly) {
    const p = [], n = [], c = [], e = [];
    let rest = 0;
    root.updateMatrixWorld(true); _m4b.copy(root.matrixWorld).invert();
    root.traverse((m) => {
      if (!m.isMesh || !m.geometry || !m.geometry.attributes.position) return;
      const mat = Array.isArray(m.material) ? m.material[0] : m.material;
      if (castOnly ? !m.castShadow : mat.transparent) { rest++; return; }
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry, pa = g.attributes.position, na = g.attributes.normal, ca = mat.vertexColors ? g.attributes.color : null, mc = mat.color;
      const em = mat.isMeshBasicMaterial ? 1 : 0, ro = em ? 1 : mat.roughness ?? 1, me = em ? 0 : mat.metalness ?? 0;
      _m4.multiplyMatrices(_m4b, m.matrixWorld); _nm.getNormalMatrix(_m4);
      for (let i = 0; i < pa.count; i++) {
        _v.fromBufferAttribute(pa, i).applyMatrix4(_m4); p.push(_v.x, _v.y, _v.z);
        if (na) _v.fromBufferAttribute(na, i).applyMatrix3(_nm).normalize(); else _v.set(0, 1, 0);
        n.push(_v.x, _v.y, _v.z);
        if (ca) c.push(ca.getX(i), ca.getY(i), ca.getZ(i)); else c.push(mc ? mc.r : 1, mc ? mc.g : 1, mc ? mc.b : 1);
        e.push(ro, me, em);
      }
    });
    if (!p.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); g.setAttribute('aRME', new THREE.Float32BufferAttribute(e, 3));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return { geo: g, rest };
  }
  const probeSt = { speed: 2, surprised: 1, spin: 1.3 };
  function isRigid(obj) {
    const an = obj.userData.anim;
    if (typeof an !== 'function') return true;
    const nodes = [], sig = () => { let k = 0; for (const o of nodes) k += o.position.x * 1.1 + o.position.y * 2.3 + o.position.z * 3.7 + o.quaternion.x * 5.1 + o.quaternion.y * 7.3 + o.quaternion.z * 11.9 + o.quaternion.w * 13.1 + o.scale.x * 17.3 + o.scale.y * 19.1 + o.scale.z * 23.9 + (o.visible ? 29.3 : 0); return k; };
    obj.traverse((o) => nodes.push(o));
    const s0 = sig();
    for (const t of [0.37, 1.93, 3.1]) { an(t, 0.05, probeSt); if (Math.abs(sig() - s0) > 1e-6) return false; }
    return true;
  }
  function makeModel(def) {
    const kind = def.kind;
    let obj = null;
    try { obj = kind === 'player' ? MODELS.createChild() : kind === 'item' ? MODELS.createItem(itemId(def.item)) : MODELS.createBody(kind, { r: def.r, variant: def.variant }); }
    catch (err) { console.warn('[stage] 形を作れなかった', kind, err); }
    return obj || new Builder().cyl(def.r || 0.15, def.r || 0.15, 0.2, PAL.steel, { y: 0.1, cls: 'soft' }).build();
  }
  function makeBody(def) {
    const kind = def.kind, isPlayer = kind === 'player', isItem = kind === 'item', root = new THREE.Group();
    const key = isPlayer ? null : isItem ? 'item|' + itemId(def.item) : kind + '|' + (def.variant || '') + '|' + Math.round((def.r || 0) * 1000);
    let bk = key ? bodyKinds.get(key) : null, obj = null;
    if (!bk || !bk.rigid || bk.rest) { obj = makeModel(def); root.add(obj); }
    if (key && !bk) {
      bk = { rigid: isRigid(obj), h: obj.userData.h, geo: null, gid: -1, rest: 0, proxy: null };
      const mg = mergeBody(root, !bk.rigid);
      if (bk.rigid) {
        if (mg) {
          bk.geo = mg.geo; bk.rest = mg.rest;
          if (batchVerts + mg.geo.attributes.position.count <= BATCH_V) { bk.gid = batch.addGeometry(mg.geo); batchVerts += mg.geo.attributes.position.count; }
        } else bk.rigid = false;
      } else bk.proxy = mg ? mg.geo : null;
      bodyKinds.set(key, bk);
    }
    const hn = idNum(def.id), h1 = hash01(hn), h2 = hash01(hn + 5.3), ud = obj ? obj.userData : {}, r0 = def.r || 0.15;
    const r = {
      id: def.id, kind, item: def.item, variant: def.variant, root, obj, twins: [], inst: -1,
      h: ud.h ?? (bk && bk.h) ?? HEIGHTS[kind] ?? 0.3, r: def.r || 0.15, api: ud.api || null, anim: bk && bk.rigid ? null : typeof ud.anim === 'function' ? ud.anim : null,
      isPlayer, isCat: kind === 'cat', isItem, faceVel: isPlayer || kind === 'cat' || kind === 'robot',
      x: 0, y: 0, z: 0, vx: 0, vz: 0, pvx: 0, pvz: 0, yaw: 0, spin: 0, spinRate: 0, age: 0, placed: false, fresh: false, gone: 0, seen: true, lift: 0, hitT: -9,
      surprised: 0, glint: 0, hits: 0, sil: false, hn, st: { speed: 0, surprised: 0, spin: 0 },
      vis: SMALL_KIND[kind] && r0 < T.smallR ? clamp(T.smallR / r0, 1, T.smallMax) : 1,
    };
    r.yaw = isPlayer ? Math.PI / 2 : r.isCat ? Math.PI / 2 + (h1 - 0.5) * 1.6 : h1 * TAU;
    if (isItem) r.spinRate = (h1 < 0.5 ? -1 : 1) * T.itemSpin * (0.7 + 0.6 * h2);
    const sil = isPlayer || r.isCat || isItem, meshes = [];
    const twin = (g, parent) => { const tw = new THREE.Mesh(g, silMat); tw.renderOrder = 1; tw.visible = false; tw.matrixAutoUpdate = false; parent.add(tw); r.twins.push(tw); };
    if (obj) obj.traverse((m) => { if (m.isMesh) meshes.push(m); });
    if (bk && bk.rigid) {
      for (const m of meshes) { if ((Array.isArray(m.material) ? m.material[0] : m.material).transparent) m.layers.enable(1); else m.parent.remove(m); }
      if (bk.gid >= 0 && batchLive < BATCH_N) { r.inst = batch.addInstance(bk.gid); batch.setVisibleAt(r.inst, false); batch.visible = true; batchLive++; }
      else { const m = new THREE.Mesh(bk.geo, bodyMat); m.castShadow = m.receiveShadow = true; m.renderOrder = 2; m.matrixAutoUpdate = false; m.layers.enable(1); m.layers.enable(2); root.add(m); }
      if (sil) twin(bk.geo, root);
    } else {
      for (const m of meshes) {
        m.layers.enable(1);
        if (isPlayer || !bk || !bk.proxy) m.layers.enable(2);
        if (!m.material.transparent) m.renderOrder = 2;
        if (sil && m.geometry.attributes.color && !m.material.transparent) twin(m.geometry, m);
      }
      if (bk && bk.proxy) { const m = new THREE.Mesh(bk.proxy, proxyMat); m.castShadow = true; m.matrixAutoUpdate = false; m.layers.set(2); root.add(m); }
    }
    root.visible = false; bodyRoot.add(root);
    return r;
  }
  function spinHit(r, v) { if (!r || r.faceVel) return; r.hits++; r.hitT = time; r.spinRate = r.spinRate * 0.4 + (hash01(r.hn * 7.31 + r.hits * 3.7) - 0.5) * 2 * Math.min(10, 3 + v * 2.4); }
  function removeRec(r) {
    bodyRoot.remove(r.root);
    if (r.inst >= 0) { batch.deleteInstance(r.inst); r.inst = -1; if (--batchLive <= 0) batch.visible = false; }
    if (playerRec === r) playerRec = null;
  }
  function setBodies(defs) {
    for (let i = 0; i < recs.length; i++) recs[i].seen = false;
    for (let i = 0; i < defs.length; i++) {
      const d = defs[i]; let r = recById.get(d.id);
      if (r && (r.kind !== d.kind || r.item !== d.item || r.variant !== d.variant)) { r.gone = 1; recById.delete(d.id); r = null; }
      if (!r) { r = makeBody(d); recs.push(r); recById.set(d.id, r); }
      r.seen = true;
    }
    for (let i = 0; i < recs.length; i++) { const r = recs[i]; if (!r.seen && r.gone === 0) { r.gone = 1e-4; recById.delete(r.id); } }
  }
  function hiddenBehind(r) {
    const ox = r.x, oy = r.y + Math.min(r.h * 0.4, 0.2), oz = r.z, dx = cam.position.x - ox, dy = cam.position.y - oy, dz = cam.position.z - oz, pad = r.r * 0.6, occ = house.occ;
    for (let i = 0; i < occ.length; i++) {
      const b = occ[i];
      if (b.h <= oy) continue;
      let t0 = 0, t1 = (b.h - oy) / dy;
      if (Math.abs(dx) > 1e-6) { const a = (b.x1 - pad - ox) / dx, c = (b.x2 + pad - ox) / dx; t0 = Math.max(t0, Math.min(a, c)); t1 = Math.min(t1, Math.max(a, c)); } else if (ox < b.x1 - pad || ox > b.x2 + pad) continue;
      if (Math.abs(dz) > 1e-6) { const a = (b.z1 - pad - oz) / dz, c = (b.z2 + pad - oz) / dz; t0 = Math.max(t0, Math.min(a, c)); t1 = Math.min(t1, Math.max(a, c)); } else if (oz < b.z1 - pad || oz > b.z2 + pad) continue;
      if (t0 < t1) return true;
    }
    return false;
  }
  const BMAX = 48;
  const blobGeo = new THREE.InstancedBufferGeometry(); blobGeo.setAttribute('position', new THREE.BufferAttribute(quadXZ, 3));
  const bPos = inst(blobGeo, 'iPos', BMAX, 4), bStr = inst(blobGeo, 'iStr', BMAX, 1);
  const blobMesh = new THREE.Mesh(blobGeo, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.MultiplyBlending, side: THREE.DoubleSide, uniforms: { uCol: { value: lin(T.contactCol) } }, vertexShader: BLOB_VS, fragmentShader: BLOB_FS }));
  blobMesh.frustumCulled = false; blobMesh.renderOrder = 4; scene.add(blobMesh);
  let blobN = 0;
  function blob(x, y, z, rad, str) { if (blobN >= BMAX) return; const o = blobN * 4; bPos.array[o] = x; bPos.array[o + 1] = y; bPos.array[o + 2] = z; bPos.array[o + 3] = rad; bStr.array[blobN++] = str; }
  const ringMat = new THREE.ShaderMaterial({
    uniforms: { uP: { value: new THREE.Vector4(0, 0, 0, 1) }, uQ: { value: new THREE.Vector4(0, 0, T.ringR, 0) }, uCol: { value: lin(PAL.aim, 1.1) } }, vertexShader: RING_VS, fragmentShader: RING_FS,
    side: THREE.DoubleSide, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  const ringMesh = new THREE.Mesh(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(quadXZ, 3)), ringMat);
  ringMesh.frustumCulled = false; ringMesh.renderOrder = 1.5; ringMesh.visible = false; scene.add(ringMesh);
  let readyK = 0, chevFlow = 0;
  const stP = { speed: 0, mood: 'idle', aim: null, kick: 0, move: 0 }, stAim = { ang: 0, power: 0 }, stG = { speed: 0, mood: 'slide', aim: null, kick: 0, move: 0 };
  function updateBodies(f, dt) {
    const fb = f.bodies;
    if (fb) for (let i = 0; i < fb.length; i++) {
      const b = fb[i], r = recById.get(b.id);
      if (!r) continue;
      if (!r.placed) { r.placed = true; r.root.visible = true; if (r.inst >= 0) batch.setVisibleAt(r.inst, true); r.y = house.floorY(b.x, b.y); r.pvx = b.vx; r.pvz = b.vy; } else { r.pvx = r.vx; r.pvz = r.vz; }
      r.x = b.x; r.z = b.y; r.vx = b.vx; r.vz = b.vy; r.fresh = true;
    }
    blobN = 0;
    for (let i = recs.length - 1; i >= 0; i--) {
      const r = recs[i];
      if (r.gone > 0) { r.gone += dt / T.vanishSec; if (r.gone >= 1 || !r.placed) { removeRec(r); recs.splice(i, 1); continue; } }
      if (!r.placed) continue;
      const sp = Math.hypot(r.vx, r.vz);
      r.age += dt;
      if (r.fresh) {
        r.fresh = false;
        const dv = Math.hypot(r.vx - r.pvx, r.vz - r.pvz);
        if (dv > 0.3 && r.age > 0.06 && time - r.hitT > 0.15) spinHit(r, dv);
      }
      if (r.faceVel) { if (sp > T.faceSpeed) r.yaw += angDiff(r.yaw, Math.atan2(r.vz, r.vx)) * (1 - Math.exp(-10 * dt)); }
      else { r.spin += r.spinRate * dt; r.spinRate *= Math.exp(-(sp < 0.08 ? 2.5 : r.isItem ? 0.18 : 0.5) * dt); }
      const fy = house.floorY(r.x, r.z), sleeping = r.isPlayer && (f.player && f.player.mood ? f.player.mood === 'sleep' : f.phase === 'title');
      r.y = damp(r.y, fy, 18, dt);
      r.lift = damp(r.lift, sleeping ? 0 : house.lift(r.x, r.z), 7, dt);
      let lift = 0;
      if (r.isItem && r.age < T.itemLiftSec) { const k = r.age / T.itemLiftSec; lift = T.itemLift * (1 - k * k); }
      const s = r.gone > 0 ? Math.max(0.001, 1 - r.gone * r.gone) : 1;
      r.root.position.set(r.x, r.y + r.lift + lift, r.z);
      r.root.rotation.y = -(r.yaw + r.spin);
      r.root.scale.setScalar(s * r.vis);
      if (r.inst >= 0) { r.root.updateMatrix(); batch.setMatrixAt(r.inst, r.root.matrix); }
      if (r.isPlayer) {
        const p = f.player;
        stP.speed = sp; stP.mood = (p && p.mood) || (f.phase === 'title' ? 'sleep' : sp > 0.08 ? 'slide' : 'idle'); stP.kick = (p && p.kick) || 0;
        const hold = f.aim && f.phase !== 'done' ? itemId(f.aim.item) : null;
        if (f.aim) { stAim.ang = Math.atan2(-f.aim.dy, -f.aim.dx) - r.yaw; stAim.power = f.aim.power; stP.aim = stAim; } else stP.aim = null;
        stP.move = sp > T.faceSpeed ? angDiff(r.yaw, Math.atan2(r.vz, r.vx)) : 0;
        if (r.api) { if (r.api.setRando) r.api.setRando((!p || p.rando !== false) && hold !== 'rando'); if (r.api.anim) r.api.anim(worldT, dt, stP); }
        playerX = r.x; playerZ = r.z; playerSpeed = sp; playerRec = r;
      } else if (r.anim) { r.surprised = Math.max(0, r.surprised - dt / 1.4); r.st.speed = sp; r.st.surprised = r.surprised; r.st.spin = r.spin; r.anim(worldT, dt, r.st); }
      if (r.gone === 0 && sp > 0.3 && lift === 0) {
        r.glint += sp * dt;
        if (r.glint > T.glintStep) {
          r.glint = 0;
          emit(1, r.x - r.vx / sp * r.r * 0.7 + (rnd() - 0.5) * r.r, fy + 0.02, r.z - r.vz / sp * r.r * 0.7 + (rnd() - 0.5) * r.r, 0, 0.02, 0, 0.4 + rnd() * 0.25, 0.028 + rnd() * 0.03, 0.006, 2.2, 2.1, 1.8, 0.9, 1, rnd() * 3, 1.5, 0, 0, 0, 0, 1, 0);
        }
      }
      blob(r.x - sunDir.x * 0.03, fy + r.lift + 0.004, r.z - sunDir.z * 0.03, r.r * (r.vis > 1 ? 1.75 : 1.4) + lift * 0.5, (r.vis > 1 ? 0.8 : 0.62) * s * (1 - lift * 1.5));
      if (r.twins.length) { const on = r.gone === 0 && hiddenBehind(r); if (on !== r.sil) { r.sil = on; for (let k = 0; k < r.twins.length; k++) r.twins[k].visible = on; } }
    }
  }
  let ghost = null;
  function ensureGhost() {
    if (ghost) return;
    const obj = MODELS.createChild();
    obj.traverse((m) => { if (m.isMesh) { m.material = ghostMat; m.castShadow = false; m.receiveShadow = false; m.renderOrder = 3; } });
    ghost = { root: new THREE.Group(), obj, api: obj.userData.api || null, yaw: Math.PI / 2, y: 0 };
    ghost.root.visible = false; ghost.root.add(obj); scene.add(ghost.root);
  }
  function updateGhost(f, dt) {
    const g = f.ghost;
    if (!g) { if (ghost) ghost.root.visible = false; return; }
    ensureGhost();
    const sp = Math.hypot(g.vx, g.vy), fy = house.floorY(g.x, g.y);
    if (sp > T.faceSpeed) ghost.yaw += angDiff(ghost.yaw, Math.atan2(g.vy, g.vx)) * (1 - Math.exp(-10 * dt));
    ghost.y = damp(ghost.y, fy, 18, dt);
    ghost.root.visible = true; ghost.root.position.set(g.x, ghost.y, g.y); ghost.root.rotation.y = -ghost.yaw;
    stG.speed = sp; stG.mood = sp > 0.08 ? 'slide' : 'idle';
    if (ghost.api && ghost.api.anim) ghost.api.anim(worldT, dt, stG);
    blob(g.x, fy + 0.004, g.y, 0.3, 0.25);
  }
  const TMAX = 3000;
  const trailGeo = new THREE.BufferGeometry(), trailPos = new THREE.BufferAttribute(new Float32Array(TMAX * 6), 3);
  const trailLen = new THREE.BufferAttribute(new Float32Array(TMAX * 2), 1);
  trailPos.setUsage(THREE.DynamicDrawUsage); trailLen.setUsage(THREE.DynamicDrawUsage); trailGeo.setAttribute('position', trailPos); trailGeo.setAttribute('aLen', trailLen);
  { const sd = new Float32Array(TMAX * 2), ix = new Uint16Array((TMAX - 1) * 6);
    for (let i = 0; i < TMAX; i++) { sd[i * 2] = -1; sd[i * 2 + 1] = 1; }
    for (let i = 0; i < TMAX - 1; i++) ix.set([i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2], i * 6);
    trailGeo.setAttribute('aSide', new THREE.BufferAttribute(sd, 1)); trailGeo.setIndex(new THREE.BufferAttribute(ix, 1)); }
  const trailU = { uCol: { value: lin(PAL.trail).lerp(new THREE.Vector3(1, 1, 1), T.trailWhite).multiplyScalar(T.trailGlow) }, uPar: { value: new THREE.Vector4(T.trailOpacity, 0, T.trailFade, T.trailMin) } };
  const trailMesh = new THREE.Mesh(trailGeo, new THREE.ShaderMaterial({
    ...premul, side: THREE.DoubleSide, uniforms: trailU, vertexShader: TRAIL_VS, fragmentShader: TRAIL_FS,
    stencilWrite: true, stencilRef: 2, stencilFuncMask: 2, stencilWriteMask: 2, stencilFunc: THREE.NotEqualStencilFunc, stencilZPass: THREE.ReplaceStencilOp,
  }));
  trailMesh.frustumCulled = false; trailMesh.renderOrder = 5; trailMesh.visible = false; scene.add(trailMesh);
  let trailN = 0, trailStride = 1, trailX0 = 0, trailZ0 = 0;
  function updateTrail(f) {
    const tr = f.trail;
    if (!tr || tr.n < 2) { trailMesh.visible = false; trailN = 0; return; }
    const p = tr.pts, stride = Math.ceil(tr.n / TMAX), n = Math.min(TMAX, Math.ceil(tr.n / stride)), a = trailPos.array, ln = trailLen.array, w = T.trailW / 2;
    let from = Math.max(0, trailN - 2);
    if (n < trailN || stride !== trailStride || p[0] !== trailX0 || p[1] !== trailZ0) from = 0;
    trailStride = stride; trailX0 = p[0]; trailZ0 = p[1];
    if (from < n) {
      for (let i = from; i < n; i++) {
        const j = Math.min(tr.n - 1, i * stride), j0 = Math.min(tr.n - 1, Math.max(0, i - 1) * stride), j1 = Math.min(tr.n - 1, (i + 1) * stride);
        let dx = p[j1 * 2] - p[j0 * 2], dz = p[j1 * 2 + 1] - p[j0 * 2 + 1];
        const l = Math.hypot(dx, dz); if (l > 1e-6) { dx /= l; dz /= l; } else { dx = 0; dz = 0; }
        const x = p[j * 2], z = p[j * 2 + 1], y = house.floorY(x, z) + house.lift(x, z) + 0.006, o = i * 6;
        a[o] = x - dz * w; a[o + 1] = y; a[o + 2] = z + dx * w; a[o + 3] = x + dz * w; a[o + 4] = y; a[o + 5] = z - dx * w;
        ln[i * 2] = ln[i * 2 + 1] = i ? ln[i * 2 - 1] + Math.hypot(x - p[j0 * 2], z - p[j0 * 2 + 1]) : 0;
      }
      trailPos.needsUpdate = true; trailLen.needsUpdate = true;
    }
    trailN = n; trailGeo.setDrawRange(0, (n - 1) * 6); trailMesh.visible = true;
    trailU.uPar.value.y = ln[n * 2 - 1];
  }
  const ov = { transparent: true, depthTest: false, depthWrite: false };
  const dotGeo = new THREE.InstancedBufferGeometry(); dotGeo.setAttribute('position', new THREE.BufferAttribute(quadXZ, 3));
  const dPos = inst(dotGeo, 'iPos', T.dotMax, 4), dA = inst(dotGeo, 'iA', T.dotMax, 1);
  const dotMat = new THREE.ShaderMaterial({ ...ov, side: THREE.DoubleSide, uniforms: { uCol: { value: new THREE.Vector3() }, uSize: { value: new THREE.Vector2(T.dotR, 0.01) } }, vertexShader: DOT_VS, fragmentShader: DOT_FS });
  const dotMesh = new THREE.Mesh(dotGeo, dotMat); dotMesh.frustumCulled = false; dotMesh.visible = false; overlay.add(dotMesh);
  const arrowGeo = new THREE.BufferGeometry(); arrowGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, -1, 0, 0, 1, 1, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0, -1]), 3));
  const arrowMat = new THREE.ShaderMaterial({ ...ov, side: THREE.DoubleSide, uniforms: { uA: { value: new THREE.Vector4() }, uB: { value: new THREE.Vector4() }, uCol: { value: new THREE.Vector3() }, uAlpha: { value: 1 } }, vertexShader: ARROW_VS, fragmentShader: ARROW_FS });
  const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat); arrowMesh.frustumCulled = false; arrowMesh.visible = false; arrowMesh.renderOrder = 1; overlay.add(arrowMesh);
  const bandMat = new THREE.ShaderMaterial({ ...ov, side: THREE.DoubleSide, uniforms: { uA: { value: new THREE.Vector4() }, uB: { value: new THREE.Vector4() }, uC: { value: new THREE.Vector4() }, uD: { value: new THREE.Vector4() }, uCol: { value: new THREE.Vector3(...srgb(PAL.ink)) }, uSlack: { value: new THREE.Vector3(...srgb(PAL.fabricGrey)) } }, vertexShader: BAND_VS, fragmentShader: BAND_FS });
  const bandMesh = new THREE.Mesh(arrowGeo, bandMat); bandMesh.frustumCulled = false; bandMesh.visible = false; bandMesh.renderOrder = 0.5; overlay.add(bandMesh);
  const MASK = 128;
  let rtMask = null, masksDirty = true;
  const tipGeo = new THREE.BufferGeometry(); tipGeo.setAttribute('position', new THREE.BufferAttribute(quadXZ, 3));
  const tipMat = new THREE.ShaderMaterial({ ...ov, side: THREE.DoubleSide, uniforms: { uMap: { value: null }, uA: { value: new THREE.Vector4() }, uB: { value: new THREE.Vector4(T.tipSize, 0, 0, ITEM_IDS.length) }, uAlpha: { value: 1 }, uTexel: { value: new THREE.Vector2(1 / (MASK * ITEM_IDS.length), 1 / MASK) } }, vertexShader: TIP_VS, fragmentShader: TIP_FS });
  const tipMesh = new THREE.Mesh(tipGeo, tipMat); tipMesh.frustumCulled = false; tipMesh.visible = false; tipMesh.renderOrder = 2; overlay.add(tipMesh);
  const SMAX = 40;
  const glyphCanvas = document.createElement('canvas'); glyphCanvas.width = 1024; glyphCanvas.height = 256;
  const glyphTex = new THREE.CanvasTexture(glyphCanvas); glyphTex.premultiplyAlpha = true; glyphTex.generateMipmaps = true; glyphTex.minFilter = THREE.LinearMipmapLinearFilter;
  let G = drawGlyphs(glyphCanvas);
  const sprGeo = new THREE.InstancedBufferGeometry(); sprGeo.setAttribute('position', new THREE.BufferAttribute(quadXY, 3));
  const sRect = inst(sprGeo, 'iRect', SMAX, 4), sUv = inst(sprGeo, 'iUv', SMAX, 4), sCol = inst(sprGeo, 'iCol', SMAX, 4), sMode = inst(sprGeo, 'iMode', SMAX, 1);
  const sprMat = new THREE.ShaderMaterial({ ...ov, ...premul, side: THREE.DoubleSide, uniforms: { uMap: { value: glyphTex }, uView: { value: new THREE.Vector2(1, 1) } }, vertexShader: SPR_VS, fragmentShader: SPR_FS });
  const sprMesh = new THREE.Mesh(sprGeo, sprMat); sprMesh.frustumCulled = false; sprMesh.renderOrder = 3; overlay.add(sprMesh);
  let sprN = 0;
  function spr(mode, cx, cy, w, h, u0, v0, u1, v1, r, g, b, a) {
    if (sprN >= SMAX) return;
    const o = sprN * 4;
    sRect.array[o] = cx; sRect.array[o + 1] = cy; sRect.array[o + 2] = w; sRect.array[o + 3] = h;
    sUv.array[o] = u0; sUv.array[o + 1] = v0; sUv.array[o + 2] = u1; sUv.array[o + 3] = v1;
    sCol.array[o] = r; sCol.array[o + 1] = g; sCol.array[o + 2] = b; sCol.array[o + 3] = a; sMode.array[sprN++] = mode;
  }
  function glyph(key, x, cy, scale, r, g, b, a) {
    const q = G[key]; if (!q) return 0;
    spr(0, x - q.pad * scale + q.w * scale / 2, cy, q.w * scale, q.h * scale, q.u0, q.v0, q.u1, q.v1, r, g, b, a);
    return q.adv * scale;
  }
  const cBlue = srgb(PAL.aim), cInk = srgb(PAL.ink), cMuted = srgb(PAL.inkMuted), cPaper = srgb(PAL.paperUi);
  const scr = { x: 0, y: 0 };
  function toScreen(x, y, z) { _v.set(x, y, z).project(cam); scr.x = (_v.x * 0.5 + 0.5) * cssW; scr.y = (0.5 - _v.y * 0.5) * cssH; }
  const bangs = [{ id: null, t0: -9 }, { id: null, t0: -9 }, { id: null, t0: -9 }, { id: null, t0: -9 }];
  let stuckT0 = -99;
  const lab = { x: 0, y: 0, k: -1, on: false }, labOb = new Float32Array(160);
  const sling = { on: false, t: 9, snap: false, dx: 0, dz: 1, len: 0, st: 0, slack: 0, item: 0 };
  let throwT = -9;
  function drawBand(x, z, fy, len, slack, alpha, tipAlpha) {
    const s = sling, ts = Math.max(T.tipSize, T.tipMinPx / pxPerM), hw = Math.max(T.bandW, T.bandMinPx / pxPerM);
    bandMesh.visible = alpha > 0.01;
    bandMat.uniforms.uA.value.set(x, z, s.dx, s.dz);
    bandMat.uniforms.uB.value.set(s.st, s.st + len, Math.max(T.bandBase, 7 / pxPerM) * (1 - 0.35 * slack), fy + 0.03);
    bandMat.uniforms.uC.value.set(hw * (1 - 0.3 * slack), slack, alpha, tipAlpha > 0.5 && slack < 0.5 ? T.bandHint : 0);
    bandMat.uniforms.uD.value.set(ts * 0.92, time, 0, 0);
    const td = s.st + len + ts * 0.42;
    tipMesh.visible = !!rtMask && tipAlpha > 0.01;
    tipMat.uniforms.uA.value.set(x + s.dx * td, z + s.dz * td, s.dx, s.dz); tipMat.uniforms.uB.value.set(ts, fy + 0.04, s.item, ITEM_IDS.length);
    tipMat.uniforms.uAlpha.value = tipAlpha;
    return td + ts * 0.5;
  }
  function updateOverlay(f, rdt) {
    sprN = 0;
    const a = f.aim, aiming = !!(a && playerRec && f.phase !== 'done'), on = aiming && !!a.path && a.n > 1;
    dotMesh.visible = arrowMesh.visible = on;
    if (!on) { lab.on = false; lab.k = -1; }
    const fy = playerRec ? house.floorY(playerX, playerZ) + playerRec.lift : 0;
    let bandEnd = 0;
    if (aiming) {
      const pw = clamp(a.power, 0, 1), s = sling;
      s.on = true; s.t = 0; s.dx = a.dx; s.dz = a.dy; s.st = playerRec.r * 0.62; s.slack = damp(s.slack, on ? 0 : 1, 22, rdt);
      s.len = Math.max(lerp(T.bandLen[0], T.bandLen[1], pw), lerp(T.bandMinLenPx[0], T.bandMinLenPx[1], pw) / pxPerM) * (on ? 1 : 0.8);
      {
        const ts = Math.max(T.tipSize, T.tipMinPx / pxPerM), reach = s.st + s.len + ts * 0.42, pad = ts * pxPerM * 0.6 + 4;
        toScreen(playerX, fy, playerZ); const ax = scr.x, ay = scr.y;
        toScreen(playerX + a.dx * reach, fy, playerZ + a.dy * reach);
        const ex = scr.x - ax, ey = scr.y - ay;
        let t = 1;
        if (ex > 1e-3) t = Math.min(t, (cssW - pad - ax) / ex); else if (ex < -1e-3) t = Math.min(t, (pad - ax) / ex);
        if (ey > 1e-3) t = Math.min(t, (cssH - insets.bottom - pad - ay) / ey); else if (ey < -1e-3) t = Math.min(t, (insets.top + pad - ay) / ey);
        if (t < 1) s.len = Math.max(T.bandLen[0] * 0.6, reach * Math.max(t, 0) - s.st - ts * 0.42);
      }
      s.item = typeof a.item === 'number' ? a.item : Math.max(0, ITEM_IDS.indexOf(a.item));
      bandEnd = drawBand(playerX, playerZ, fy, s.len, s.slack, 1, 1);
    } else {
      const s = sling;
      if (s.on) { s.on = false; s.t = 0; s.snap = time - throwT < 0.2; }
      const dur = s.snap ? T.snapSec : T.slackSec;
      if (s.t < dur && playerRec) {
        s.t += rdt;
        const k = clamp(s.t / dur, 0, 1);
        if (s.snap) drawBand(playerX, playerZ, fy, s.len * (1 - k) * (1 - k), 0, 1 - k * k, 0);
        else drawBand(playerX, playerZ, fy, s.len * (1 - 0.3 * k), Math.max(s.slack, k), 1 - k, 1 - k);
      } else { bandMesh.visible = false; tipMesh.visible = false; s.slack = 0; }
    }
    if (on) {
      const pw = clamp(a.power, 0, 1), path = a.path, n = a.n;
      const goX = -a.dx, goZ = -a.dy, st = playerRec.r + 0.08;
      const wd = Math.max(lerp(T.goW[0], T.goW[1], pw), T.goMinPx / pxPerM), len = Math.max(lerp(T.goLen[0], T.goLen[1], pw), lerp(T.goMinLenPx[0], T.goMinLenPx[1], pw) / pxPerM);
      arrowMat.uniforms.uA.value.set(playerX + goX * st, playerZ + goZ * st, goX, goZ); arrowMat.uniforms.uB.value.set(len, wd, fy + 0.03, 0);
      arrowMat.uniforms.uCol.value.set(cBlue[0], cBlue[1], cBlue[2]);
      let along = false;
      for (let j = 1; j < Math.min(n, 10); j++) {
        const ex = path[j * 2] - path[0], ez = path[j * 2 + 1] - path[1], l = Math.hypot(ex, ez);
        if (l > 0.01) { along = (ex * goX + ez * goZ) / l > 0.97; break; }
      }
      let total = 0;
      for (let i = 1; i < n; i++) total += Math.hypot(path[i * 2] - path[i * 2 - 2], path[i * 2 + 1] - path[i * 2 - 1]);
      const rM = Math.max(T.dotR, T.dotMinPx / pxPerM) * (0.92 + 0.22 * pw);
      const gap = Math.max(T.dotGap, T.dotMinGapPx / pxPerM, total / (T.dotMax - 2)), s0 = along ? st + len + rM * 1.2 : playerRec.r + 0.1;
      let s = s0 + (time * T.dotFlow) % gap, acc = 0, c = 0;
      const cap = T.dotMax - 10;
      for (let i = 1; i < n && c < cap; i++) {
        const x0 = path[i * 2 - 2], z0 = path[i * 2 - 1], x1 = path[i * 2], z1 = path[i * 2 + 1], l = Math.hypot(x1 - x0, z1 - z0);
        while (s <= acc + l && c < cap) {
          const k = l > 1e-6 ? (s - acc) / l : 0, x = x0 + (x1 - x0) * k, z = z0 + (z1 - z0) * k, u = total > 0 ? s / total : 0;
          dPos.array[c * 4] = x; dPos.array[c * 4 + 1] = house.floorY(x, z) + 0.02; dPos.array[c * 4 + 2] = z; dPos.array[c * 4 + 3] = 1.06 - 0.36 * u;
          dA.array[c] = (1 - 0.34 * u) * smooth(s0, s0 + gap * 0.9, s) * smooth(total, total - gap * 0.45, s);
          c++; s += gap;
        }
        acc += l;
      }
      let lx = 1e9, lz = 1e9; acc = 0;
      for (let i = 1; i < n - 1 && c < T.dotMax - 1; i++) {
        const ux = path[i * 2] - path[i * 2 - 2], uz = path[i * 2 + 1] - path[i * 2 - 1], vx = path[i * 2 + 2] - path[i * 2], vz = path[i * 2 + 3] - path[i * 2 + 1], lu = Math.hypot(ux, uz), lv = Math.hypot(vx, vz);
        acc += lu;
        if (lu < 0.003 || lv < 0.003 || (ux * vx + uz * vz) / (lu * lv) > 0.94 || acc < s0 || Math.hypot(path[i * 2] - lx, path[i * 2 + 1] - lz) < 0.2) continue;
        lx = path[i * 2]; lz = path[i * 2 + 1];
        dPos.array[c * 4] = lx; dPos.array[c * 4 + 1] = house.floorY(lx, lz) + 0.022; dPos.array[c * 4 + 2] = lz; dPos.array[c * 4 + 3] = 1.3; dA.array[c++] = 4 + (1 - 0.25 * acc / total);
      }
      if (total > s0 + gap) { const ex = path[n * 2 - 2], ez = path[n * 2 - 1]; dPos.array[c * 4] = ex; dPos.array[c * 4 + 1] = house.floorY(ex, ez) + 0.024; dPos.array[c * 4 + 2] = ez; dPos.array[c * 4 + 3] = 1.45; dA.array[c++] = 2 + 0.92; }
      dotGeo.instanceCount = c; dPos.needsUpdate = true; dA.needsUpdate = true;
      dotMat.uniforms.uCol.value.set(cBlue[0], cBlue[1], cBlue[2]); dotMat.uniforms.uSize.value.set(rM, cssW / (pxPerM * bufW));
      const v = Math.min(9999, Math.round(Math.max(0, a.dv || 0) * 100)), sc = T.labelPx / 64, su = T.labelPx * 0.74 / 44;
      const d2 = Math.floor(v / 1000), d1 = Math.floor(v / 100) % 10, c1 = Math.floor(v / 10) % 10, c2 = v % 10;
      const tw = (G['+'].adv + G[d1].adv + G['.'].adv + G[c1].adv + G[c2].adv + (d2 ? G[d2].adv : 0)) * sc + 5 + G.u.adv * su;
      const bw = tw + 26, bh = T.labelPx + 15, hw = bw / 2 + T.labelGap, hh = bh / 2 + T.labelGap;
      toScreen(playerX, fy + 0.3, playerZ); const px = scr.x, py = scr.y;
      let no = 0;
      const stp = Math.max(1, Math.floor(n / 44));
      for (let i = 0; i < n && no < 60; i += stp) { toScreen(path[i * 2], fy, path[i * 2 + 1]); labOb[no * 2] = scr.x; labOb[no * 2 + 1] = scr.y; no++; }
      for (let i = 1; i <= 6; i++) { const d = st + len * i / 6; toScreen(playerX + goX * d, fy, playerZ + goZ * d); labOb[no * 2] = scr.x; labOb[no * 2 + 1] = scr.y; no++; }
      for (let i = 1; i <= 8; i++) { const d = bandEnd * i / 8; toScreen(playerX + a.dx * d, fy, playerZ + a.dy * d); labOb[no * 2] = scr.x; labOb[no * 2 + 1] = scr.y; no++; }
      const xa = bw / 2 + 5, xb = cssW - bw / 2 - 5, ya = insets.top + bh / 2 + 7, yb = Math.max(ya, cssH - insets.bottom - bh / 2 - 7);
      let bk = 0, bs = -1e9, bx = px, by = py;
      for (let k = 0; k < 12; k++) {
        const th = k * TAU / 12, wx = px + Math.cos(th) * (bw / 2 + 30), wy = py + Math.sin(th) * (bh / 2 + 36), kx = clamp(wx, xa, xb), ky = clamp(wy, ya, yb);
        let dm = Math.hypot(Math.max(Math.abs(px - kx) - bw / 2, 0), Math.max(Math.abs(py - ky) - bh / 2, 0)) - 12;
        for (let i = 0; i < no; i++) { const d = Math.hypot(Math.max(Math.abs(labOb[i * 2] - kx) - hw, 0), Math.max(Math.abs(labOb[i * 2 + 1] - ky) - hh, 0)); if (d < dm) dm = d; }
        const score = Math.min(dm, 22) - Math.hypot(kx - wx, ky - wy) * 0.5 + (Math.sin(th) < -0.3 ? 2 : 0) + (k === lab.k ? 9 : 0);
        if (score > bs) { bs = score; bk = k; bx = kx; by = ky; }
      }
      if (!lab.on) { lab.x = bx; lab.y = by; lab.on = true; } else { const e = 1 - Math.exp(-T.labelFollow * rdt); lab.x += (bx - lab.x) * e; lab.y += (by - lab.y) * e; }
      lab.k = bk;
      const cx = lab.x, cy = lab.y;
      spr(1, cx, cy, bw + 14, bh + 14, cBlue[0], cBlue[1], cBlue[2], 1, cPaper[0], cPaper[1], cPaper[2], 0.96);
      let x = cx - tw / 2;
      x += glyph('+', x, cy, sc, cInk[0], cInk[1], cInk[2], 1);
      if (d2) x += glyph(d2, x, cy, sc, cInk[0], cInk[1], cInk[2], 1);
      x += glyph(d1, x, cy, sc, cInk[0], cInk[1], cInk[2], 1); x += glyph('.', x, cy, sc, cInk[0], cInk[1], cInk[2], 1);
      x += glyph(c1, x, cy, sc, cInk[0], cInk[1], cInk[2], 1); x += glyph(c2, x, cy, sc, cInk[0], cInk[1], cInk[2], 1);
      glyph('u', x + 5, cy + 0.5, su, cMuted[0], cMuted[1], cMuted[2], 1);
    }
    for (let i = 0; i < bangs.length; i++) {
      const b = bangs[i], age = time - b.t0; if (b.id === null || age < 0 || age > 1.25) continue;
      const r = recById.get(b.id); if (!r || !r.placed) continue;
      const q = G['!'], pop = age < 0.28 ? backOut(age / 0.28) : 1, hop = Math.sin(Math.min(1, age / 0.42) * Math.PI) * 9, al = 1 - smooth(0.95, 1.25, age), bp = T.bangPx * clamp(pxPerM / 56, 1, 1.35), sc = bp / q.h * pop;
      toScreen(r.x, r.y + r.h + 0.1, r.z);
      spr(0, scr.x + 1, scr.y - bp * 0.42 - hop, q.w * sc, q.h * sc, q.u0, q.v0, q.u1, q.v1, 1, 1, 1, al);
    }
    if (playerRec && time - stuckT0 >= 0 && time - stuckT0 < 3.2) {
      const age = time - stuckT0, q = G['…'], pop = age < 0.3 ? backOut(age / 0.3) : 1, al = 1 - smooth(2.7, 3.2, age), sc = T.bangPx * 0.9 / q.h * pop;
      toScreen(playerX, playerRec.y + playerRec.h + 0.1, playerZ);
      spr(0, scr.x, scr.y - T.bangPx * 0.4 + Math.sin(age * 3) * 2, q.w * sc, q.h * sc, q.u0, q.v0, q.u1, q.v1, 1, 1, 1, al);
    }
    sprGeo.instanceCount = sprN; sprMesh.visible = sprN > 0;
    if (sprN) { sRect.needsUpdate = true; sUv.needsUpdate = true; sCol.needsUpdate = true; sMode.needsUpdate = true; }
    sprMat.uniforms.uView.value.set(cssW, cssH);
  }
  const mood = { late: 0, goal: 0, stuck: 0, lateT: 0, goalT: 0, stuckT: 0 };
  let goalEmit = 0, lastPhase = null;
  function resetFx() {
    pN = 0; goalEmit = 0; stuckT0 = -99; shake = 0; sling.on = false; sling.t = 9; sling.slack = 0;
    mood.late = mood.goal = mood.stuck = mood.lateT = mood.goalT = mood.stuckT = 0;
    for (const b of bangs) b.id = null;
  }
  function fx(name, p) {
    if (!house) return;
    p = p || {};
    if (name === 'hit') {
      const v = p.v || 1, heavy = !!p.heavy, y0 = house.floorY(p.x, p.y), k = Math.min(v, 6);
      const n = heavy ? clamp(Math.round(3 + v * 1.8), 4, 10) : clamp(Math.round(1.6 + v * 0.35), 2, 4), sz = heavy ? 1 : 0.62;
      for (let i = 0; i < n; i++) {
        const a = rnd() * TAU, s = (0.5 + rnd() * 1.1) * (0.6 + k * 0.22) * (heavy ? 1 : 0.7);
        emit(1, p.x, y0 + 0.12 + rnd() * 0.15, p.y, Math.cos(a) * s, 0.5 + rnd() * 0.9, Math.sin(a) * s, 0.32 + rnd() * 0.3, (0.05 + rnd() * 0.05 + k * 0.008) * sz, 0.01, 2.6, 2.3, 1.6, 1, 1, rnd() * TAU, (rnd() - 0.5) * 6, 3, 2.2, 0, 0, 1, 0);
      }
      if (heavy) {
        for (let i = 0; i < 3; i++) emit(2, p.x + (rnd() - 0.5) * 0.12, y0 + 0.05, p.y + (rnd() - 0.5) * 0.12, (rnd() - 0.5) * 0.5, 0.15 + rnd() * 0.2, (rnd() - 0.5) * 0.5, 0.5 + rnd() * 0.3, 0.06, 0.18 + k * 0.02, 1.0, 0.96, 0.9, 0.3, 0, 0, 0, 1.5, 0, 0, 0, 1, 0);
        emit(4, p.x, y0 + 0.008, p.y, 0, 0, 0, 0.5 + k * 0.04, 0.1, 0.3 + k * 0.15, 1.7, 1.6, 1.4, 0.2 + k * 0.045, 1, 0, 0, 0, 0, 1, 0, 1, 0);
        shake = Math.max(shake, T.shake * clamp(v / 4, 0.12, 1));
      }
      if (p.id != null) spinHit(recById.get(p.id), v);
      if (p.b != null && p.b >= 0) spinHit(recById.get(p.b), v);
    } else if (name === 'throw') {
      throwT = time;
      const pw = clamp(p.power == null ? 0.6 : p.power > 1 ? p.power / 100 : p.power, 0, 1), y0 = house.floorY(p.x, p.y) + 0.3;
      for (let i = 0; i < 6; i++) {
        const off = (rnd() - 0.5) * 0.2, d = 0.3 + rnd() * 0.25, s = 3 + 7 * pw * rnd();
        emit(3, p.x + p.dx * d - p.dy * off, y0 - rnd() * 0.12, p.y + p.dy * d + p.dx * off, p.dx * s, 0, p.dy * s, 0.2 + rnd() * 0.18, 0.02, 0.01, 1.9, 1.9, 2.0, 0.5, 1, 0, 0, 4, 0, p.dx, p.dy, 7 + 9 * pw, i * 0.012);
      }
      emit(2, p.x - p.dx * 0.2, y0 - 0.25, p.y - p.dy * 0.2, -p.dx * 0.5, 0.1, -p.dy * 0.5, 0.45, 0.08, 0.26, 1, 0.97, 0.92, 0.25, 0, 0, 0, 2, 0, 0, 0, 1, 0);
      const r = recById.get(p.id); if (r && r.isItem) r.spinRate = Math.sign(r.spinRate || 1) * T.itemSpin * (0.6 + 0.8 * pw);
      shake = Math.max(shake, T.shake * 0.25 * pw);
    } else if (name === 'cat') {
      const r = recById.get(p.id); if (r) r.surprised = 1;
      let b = bangs[0]; for (const q of bangs) { if (q.id === p.id) { b = q; break; } if (q.t0 < b.t0) b = q; }
      b.id = p.id; b.t0 = time;
    } else if (name === 'out') {
      const y0 = house.floorY(p.x, p.y);
      for (let i = 0; i < 7; i++) { const a = rnd() * TAU, s = 0.4 + rnd() * 0.8; emit(1, p.x, y0 + 0.1, p.y, Math.cos(a) * s, 0.4 + rnd() * 0.6, Math.sin(a) * s, 0.5 + rnd() * 0.3, 0.05 + rnd() * 0.04, 0.01, 2.6, 2.2, 1.4, 1, 1, rnd() * TAU, 3, 2.5, 1, 0, 0, 1, 0); }
      emit(4, p.x, y0 + 0.008, p.y, 0, 0, 0, 0.5, 0.1, 0.5, 1.8, 1.6, 1.2, 0.5, 1, 0, 0, 0, 0, 1, 0, 1, 0);
    } else if (name === 'goal') { mood.goalT = 1; goalEmit = 90; }
    else if (name === 'late') {
      mood.lateT = 1;
      for (let i = 0; i < 4; i++) emit(4, playerX, house.floorY(playerX, playerZ) + 0.01, playerZ, 0, 0, 0, 1.8, 0.3, 3.2, 0.9, 1.15, 1.6, 0.2, 1, 0, 0, 0, 0, 1, 0, 1, i * 0.42);
    } else if (name === 'stuck') { mood.stuckT = 1; stuckT0 = time; emit(2, playerX, house.floorY(playerX, playerZ) + 0.1, playerZ, 0, 0.12, 0, 0.9, 0.12, 0.34, 1, 0.97, 0.92, 0.22, 0, 0, 0, 1, 0, 0, 0, 1, 0); }
    else if (name === 'reset') { resetFx(); softCut(T.viewCutSec); }
  }
  function updateFx(dt) {
    mood.late = damp(mood.late, mood.lateT, 3.5, dt); mood.goal = damp(mood.goal, mood.goalT, 5, dt); mood.stuck = damp(mood.stuck, mood.stuckT, 4, dt);
    postU.uMood.value.set(mood.late, mood.goal, mood.stuck, 0);
    U.goal.value = mood.goal;
    glowMat.uniforms.uPow.value = 0.28 + 0.05 * Math.sin(time * 1.7) + 1.7 * mood.goal;
    floorU.uDoor.value.w = T.doorGlow * (1 + 2.2 * mood.goal);
    if (goalEmit > 0) {
      const h = house, n = Math.min(goalEmit, Math.ceil(70 * dt));
      for (let i = 0; i < n; i++) {
        const x = lerp(h.door.x1 - 0.2, h.door.x2 + 0.2, rnd()), z = h.H - 0.7 + rnd() * 1.7, up = 0.15 + rnd() * 0.45;
        if (rnd() < 0.82) emit(0, x, -0.05 + rnd() * 0.3, z, (rnd() - 0.5) * 0.5, up, -0.15 - rnd() * 0.5, 1.5 + rnd() * 1.3, 0.035 + rnd() * 0.05, 0.02, 2.6, 2.0, 1.1, 0.95, 1, 0, 0, 0.4, -0.05, 0, 0, 1, 0);
        else emit(1, x, 0.1 + rnd() * 0.4, z, (rnd() - 0.5) * 0.4, up, -0.2 - rnd() * 0.4, 0.9 + rnd() * 0.7, 0.06 + rnd() * 0.06, 0.01, 2.8, 2.4, 1.6, 1, 1, rnd() * TAU, 1.5, 0.6, 0, 0, 0, 1, 0);
      }
      goalEmit -= n;
    }
    const ph = (time % T.streakEvery) / T.streakSec;
    if (ph < 1) floorU.uStreak.value.set(lerp(-3, 14, easeInOut(ph)), T.streakW, T.streakPow * Math.sin(ph * Math.PI), 0); else floorU.uStreak.value.z = 0;
  }
  const iconCache = new Map(), iconCam = new THREE.PerspectiveCamera(22, 1, 0.05, 30), maskCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.05, 10);
  { const key = new THREE.DirectionalLight(T.iconKey[0], T.iconKey[1]); key.position.set(-1.6, 3, 2.2); const fill = new THREE.DirectionalLight(T.iconFill[0], T.iconFill[1]); fill.position.set(2, 1.2, -1.5); iconScene.add(key, fill); }
  const iconShadow = new THREE.Mesh(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(quadXZ, 3)), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, vertexShader: 'varying vec2 vU; void main(){ vU = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec2 vU; void main(){ float a = 1.0 - smoothstep(0.1, 1.0, length(vU)); gl_FragColor = vec4(0.12, 0.1, 0.2, a * a * 0.42); }',
  }));
  iconScene.add(iconShadow);
  const _box = new THREE.Box3(), _sph = new THREE.Sphere();
  function makeItem(id) { try { return MODELS.createItem(id); } catch (err) { return new Builder().box(0.14, 0.06, 0.1, PAL.white, { y: 0.03 }).build(); } }
  function freeItem(obj) { iconScene.remove(obj); obj.traverse((m) => { if (m.isMesh && m.geometry) m.geometry.dispose(); }); }
  function itemIcon(id, px) {
    id = itemId(id); px = Math.max(16, Math.round(px || 44));
    const key = id + '@' + px;
    let cv = iconCache.get(key);
    if (cv) return cv;
    cv = document.createElement('canvas'); cv.width = cv.height = px * 2; cv.style.width = cv.style.height = px + 'px';
    iconCache.set(key, cv);
    if (!lost) drawIcon(id, cv);
    return cv;
  }
  function drawIcon(id, cv) {
    const size = cv.width, obj = makeItem(id);
    const a = new THREE.WebGLRenderTarget(size, size, { type: rtType, samples: 4, depthBuffer: true }), b = new THREE.WebGLRenderTarget(size, size, { depthBuffer: false });
    iconScene.add(obj); obj.updateMatrixWorld(true);
    _box.setFromObject(obj).getBoundingSphere(_sph);
    const c = _sph.center, R = Math.max(0.03, _sph.radius);
    iconCam.position.copy(c).addScaledVector(_v.set(-0.42, 0.8, 0.62).normalize(), R / Math.sin(11 * D2R) * 1.04); iconCam.lookAt(c); iconCam.updateMatrixWorld();
    iconShadow.visible = true; iconShadow.position.set(c.x + R * 0.1, 0.002, c.z + R * 0.05); iconShadow.scale.setScalar(R * 1.12);
    iconScene.overrideMaterial = null;
    renderer.setRenderTarget(a); renderer.setClearColor(0x000000, 0); renderer.render(iconScene, iconCam);
    iconPostMat.uniforms.tScene.value = a.texture; pass(iconPostMat, b);
    const buf = new Uint8Array(size * size * 4);
    renderer.readRenderTargetPixels(b, 0, 0, size, size, buf);
    const ctx = cv.getContext('2d'), img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) img.data.set(buf.subarray((size - 1 - y) * size * 4, (size - y) * size * 4), y * size * 4);
    ctx.putImageData(img, 0, 0);
    freeItem(obj); a.dispose(); b.dispose(); renderer.setRenderTarget(null);
  }
  function drawMasks() {
    const w = MASK * ITEM_IDS.length, a = new THREE.WebGLRenderTarget(w, MASK, { type: rtType, samples: 4, depthBuffer: true });
    if (!rtMask) rtMask = new THREE.WebGLRenderTarget(w, MASK, { depthBuffer: false });
    iconShadow.visible = false; iconScene.overrideMaterial = null;
    renderer.setRenderTarget(a); renderer.setClearColor(0x000000, 0); renderer.clear();
    renderer.autoClear = false;
    for (let i = 0; i < ITEM_IDS.length; i++) {
      const obj = makeItem(ITEM_IDS[i]);
      iconScene.add(obj); obj.updateMatrixWorld(true); _box.setFromObject(obj);
      const cx = (_box.min.x + _box.max.x) / 2, cz = (_box.min.z + _box.max.z) / 2, s = Math.max(_box.max.x - _box.min.x, _box.max.z - _box.min.z, 0.04) * 0.5 * 1.3;
      maskCam.left = -s; maskCam.right = s; maskCam.top = s; maskCam.bottom = -s; maskCam.updateProjectionMatrix();
      maskCam.position.set(cx, 5, cz); maskCam.up.set(0, 0, -1); maskCam.lookAt(cx, 0, cz); maskCam.updateMatrixWorld();
      a.viewport.set(i * MASK, 0, MASK, MASK); renderer.setRenderTarget(a);
      renderer.render(iconScene, maskCam);
      freeItem(obj);
    }
    renderer.autoClear = true;
    iconPostMat.uniforms.tScene.value = a.texture; pass(iconPostMat, rtMask);
    a.dispose(); renderer.setRenderTarget(null);
    tipMat.uniforms.uMap.value = rtMask.texture; masksDirty = false;
  }
  const stat = { fps: 60, calls: 0, tris: 0, quality: qName, ms: 0 };
  const auto = { on: false, want: false, viewed: false, n: 0, skip: T.autoSkip, strikes: 0, iv: new Float32Array(T.autoFrames), wk: new Float32Array(T.autoFrames), nw: 0 };
  const px1 = new Uint8Array(4), bgCol = new THREE.Color(T.bg[1]), moodClean = new THREE.Vector4();
  let tiltF = 0.5, tiltB = 0.3, lastDraw = 0, worldT = 0, curPhase = null, stillN = 0, pendingQ = null;
  const liveSt = { speed: 0, surprised: 0, spin: 0 };
  function update(f) {
    if (!f || !house) return;
    const dt = clamp(f.dt || 0, 0, 0.1), rdt = clamp((f.t || 0) - time, 0, 0.1);
    time = f.t || 0; worldT += dt; U.time.value = time;
    curPhase = f.phase; stillN = dt === 0 ? stillN + 1 : 0; aimOn = !!f.aim;
    if (f.phase !== lastPhase) { if (lastPhase === 'done' && f.phase !== 'done') resetFx(); lastPhase = f.phase; }
    for (let i = 0; i < house.live.length; i++) house.live[i].userData.anim(worldT, dt, liveSt);
    updateBodies(f, dt);
    const fa = f.aim, pulling = !!fa && f.phase === 'play' && fa.power >= T.aimPullMin;
    vw.aim = pulling; vw.hasPath = pulling && !!fa.path && fa.n > 1;
    if (vw.hasPath) vw.pathZ = fa.path[fa.n * 2 - 1];
    vw.want = viewMode === 'whole' || !f.trail || (f.phase !== 'play' && f.phase !== 'done') ? 0 : viewMode === 'near' && pulling ? T.nearAimK : 1;
    if (playerRec) {
      if (vw.init && Math.abs(playerX - vw.px) + Math.abs(playerZ - vw.pz) > T.viewJump) { softCut(T.viewCutSec); vw.lx = vw.lz = vw.az = 0; }
      vw.px = playerX; vw.pz = playerZ; vw.init = true;
    }
    updateCamera(rdt);
    if (auto.want && !auto.viewed && !auto.on && !pendingQ && qName !== 'low' && camMode === 'play' && vw.k > 0.95) { auto.viewed = true; auto.on = true; auto.n = 0; auto.nw = 0; auto.skip = 20; auto.strikes = 0; }
    updateGhost(f, dt);
    updateTrail(f);
    updateFx(rdt);
    updateParticles(dt);
    updateOverlay(f, rdt);
    blobGeo.instanceCount = blobN; blobMesh.visible = blobN > 0; if (blobN) { bPos.needsUpdate = true; bStr.needsUpdate = true; }
    const ready = f.phase === 'play' && !!playerRec && playerSpeed < 0.03 && !(f.trail && f.trail.n > 1);
    readyK = damp(readyK, ready ? 1 : 0, ready ? 4 : 9, rdt);
    ringMesh.visible = readyK > 0.01 && !!playerRec;
    if (ringMesh.visible) { ringMat.uniforms.uP.value.set(playerX, playerRec.y + T.ringLift, playerZ, 1); ringMat.uniforms.uQ.value.set(readyK, time, T.ringR, 0); }
    chevFlow += rdt * T.chevFlow * readyK; chevMat.uniforms.uFlow.value = chevFlow;
    tiltBand(camMode);
    tiltF = damp(tiltF, tb.f, 5, rdt); tiltB = damp(tiltB, tb.b, 5, rdt);
    viewUniforms(tiltF, tiltB);
  }
  const tb = { f: 0.5, b: 0.3 };
  function tiltBand(mode) {
    if (mode === 'title') { toScreen(house.start.x, 0, house.start.z); tb.f = 1 - scr.y / cssH; tb.b = 0.15; }
    else if (mode === 'finish') { toScreen((house.door.x1 + house.door.x2) / 2, 0, house.H); tb.f = 1 - scr.y / cssH; tb.b = 0.19; }
    else if (mode === 'result' && cssH - insets.top - insets.bottom < cssH * T.resultBand) { toScreen(poseLive.tx, 0.2, poseLive.tz); tb.f = 1 - scr.y / cssH; tb.b = Math.max(0.05, (cssH - insets.top - insets.bottom) / cssH * 0.42); }
    else { toScreen(house.W / 2, T.wallH, 0); const y0 = scr.y; toScreen(house.W / 2, 0, house.H + 0.7); tb.f = 1 - (y0 + scr.y) / 2 / cssH; tb.b = Math.abs(scr.y - y0) / 2 / cssH; }
  }
  function viewUniforms(focus, band, bw = bufW, bh = bufH) {
    postU.uTilt.value.set(focus, band, T.tiltBlurPx * bh / 900, 1);
    dustMat.uniforms.uPx.value = 1.25 * bh / cssH;
    floorU.uReflPar.value.y = T.reflBlur * pxPerM * (bw / cssW) * Q.refl;
  }
  function updateMirror() {
    const k = lerp(T.reflStretch, 1, smooth(22 * D2R, 42 * D2R, poseLive.tilt)), src = fitCam;
    copyPose(poseM, poseLive); poseM.tilt = Math.atan(Math.tan(poseLive.tilt) * k);
    src.aspect = cam.aspect; applyPose(poseM, src);
    mirrorCam.position.set(src.position.x, -src.position.y, src.position.z);
    _v.set(0, 0, -1).applyQuaternion(src.quaternion); _v.y = -_v.y; _v.add(mirrorCam.position);
    mirrorCam.up.set(0, 1, 0).applyQuaternion(src.quaternion); mirrorCam.up.y = -mirrorCam.up.y;
    mirrorCam.lookAt(_v);
    mirrorCam.projectionMatrix.copy(src.projectionMatrix); mirrorCam.projectionMatrixInverse.copy(src.projectionMatrixInverse);
    mirrorCam.updateMatrixWorld();
    floorU.uReflMatrix.value.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(mirrorCam.projectionMatrix).multiply(mirrorCam.matrixWorldInverse);
    floorU.uReflInv.value.multiplyMatrices(mirrorCam.projectionMatrix, mirrorCam.matrixWorldInverse).invert();
  }
  function drawTo(t, out, withOverlay) {
    floorU.uRefl.value = t.refl ? t.refl.texture : null; floorU.uReflDepth.value = t.refl ? t.refl.depthTexture : null;
    if (t.refl) floorU.uReflTexel.value.set(1 / t.refl.width, 1 / t.refl.height);
    postU.uRes.value.set(t.w, t.h);
    renderer.shadowMap.needsUpdate = true;
    renderer.setRenderTarget(rtNull); renderer.render(scene, shadowCam);
    U.shadowMap.value = sun.shadow.map ? sun.shadow.map.texture : null; U.shadowPar.value.w = sun.shadow.map ? 1 : 0;
    if (t.refl) {
      updateMirror();
      renderer.setRenderTarget(t.refl); renderer.setClearColor(0x000000, 0);
      scene.environmentIntensity = T.reflAmbient;
      renderer.render(scene, mirrorCam);
      scene.environmentIntensity = 1;
    }
    renderer.setRenderTarget(t.scene); renderer.setClearColor(bgCol, 1);
    renderer.render(scene, cam);
    if (t.bloom.length) {
      let src = t.scene;
      for (let i = 0; i < t.bloom.length; i++) {
        downMat.uniforms.tSrc.value = src.texture; downMat.uniforms.uTexel.value.set(1 / src.width, 1 / src.height); downMat.uniforms.uThresh.value = i === 0 ? T.bloomThresh : 0;
        pass(downMat, t.bloom[i]); src = t.bloom[i];
      }
      renderer.autoClear = false;
      for (let i = t.bloom.length - 1; i > 0; i--) { upMat.uniforms.tSrc.value = t.bloom[i].texture; upMat.uniforms.uTexel.value.set(1 / t.bloom[i].width, 1 / t.bloom[i].height); pass(upMat, t.bloom[i - 1]); }
      renderer.autoClear = true;
      postU.tBloom.value = t.bloom[0].texture;
    }
    postU.tScene.value = t.scene.texture;
    pass(postMat, out);
    if (withOverlay) { renderer.autoClear = false; renderer.render(overlay, cam); renderer.autoClear = true; }
  }
  function draw() {
    if (!house || lost || disposed || cssW < 2 || !main) return;
    if (pendingQ && (curPhase === 'title' || curPhase === 'intro' || stillN >= 2)) { const q = pendingQ; pendingQ = null; applyQuality(q); viewUniforms(tiltF, tiltB); auto.skip = 20; auto.viewed = false; }
    if (warmJob && !aimOn && (curPhase !== 'play' || readyK > 0.6 || stillN > 8)) { const j = warmJob; warmJob = null; warmNow(j.w, j.h, j.mode, j.key); auto.skip = Math.max(auto.skip, 4); }
    const t0 = performance.now();
    renderer.info.reset();
    if (bakeDirty) bake();
    if (masksDirty) drawMasks();
    drawTo(main, null, true);
    stat.calls = renderer.info.render.calls; stat.tris = renderer.info.render.triangles; stat.quality = qName;
    const now = performance.now(), iv = now - lastDraw; lastDraw = now;
    if (iv > 0 && iv < 250) stat.fps = stat.fps * 0.92 + (1000 / iv) * 0.08;
    if (auto.on && iv > 0 && iv < 250) {
      if (auto.skip > 0) auto.skip--;
      else {
        if (auto.n % 3 === 0) { gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px1); auto.wk[auto.nw++] = performance.now() - t0; }
        auto.iv[auto.n++] = iv;
        if (auto.n >= T.autoFrames) {
          const mi = auto.iv.subarray(0, auto.n).sort()[auto.n >> 1], mw = auto.wk.subarray(0, auto.nw).sort()[auto.nw >> 1];
          stat.ms = mw;
          auto.n = 0; auto.nw = 0;
          if (!((mw > T.autoWorkMs || mi > T.autoFrameMs) && qName !== 'low')) auto.on = false;
          else if (++auto.strikes >= T.autoStrikes) { pendingQ = qName === 'high' ? 'mid' : 'low'; auto.strikes = 0; auto.skip = 1e9; }
        }
      }
    }
  }
  function render(f) { update(f); if (typeof document !== 'undefined' && document.hidden) return; draw(); }
  let sizeKey = '';
  function resize() {
    const r = canvas.getBoundingClientRect(), w = Math.max(1, Math.round(r.width || canvas.clientWidth || 1)), h = Math.max(1, Math.round(r.height || canvas.clientHeight || 1));
    rectL = r.left; rectT = r.top;
    const d = Math.min(Q.dpr, Math.max(1, window.devicePixelRatio || 1)), key = w + 'x' + h + '@' + d + qName;
    if (key === sizeKey && main) return;
    sizeKey = key; cssW = w; cssH = h; bufW = Math.max(2, Math.round(w * d)); bufH = Math.max(2, Math.round(h * d));
    renderer.setSize(bufW, bufH, false);
    makeTargets(); playDirty = true;
  }
  function ground(clientX, clientY, out) {
    const o = out || { x: 0, y: 0 };
    _v2.set((clientX - rectL) / cssW * 2 - 1, 1 - (clientY - rectT) / cssH * 2, 0.5).unproject(cam).sub(cam.position);
    const t = Math.abs(_v2.y) > 1e-9 ? -cam.position.y / _v2.y : 0;
    o.x = cam.position.x + _v2.x * t; o.y = cam.position.z + _v2.z * t;
    return o;
  }
  function project(x, y, h, out) {
    const o = out || { x: 0, y: 0 };
    _v2.set(x, h || 0, y).project(cam);
    o.x = rectL + (_v2.x * 0.5 + 0.5) * cssW; o.y = rectT + (0.5 - _v2.y * 0.5) * cssH;
    return o;
  }
  let snap = null;
  function freeSnap() { if (!snap) return; freeTargets(snap.t); snap.out.dispose(); snap = null; }
  function snapSet(w, h) {
    if (snap && (snap.w !== w || snap.h !== h || snap.q !== qName)) freeSnap();
    if (!snap) {
      const img = new ImageData(w, h);
      snap = { w, h, q: qName, t: buildTargets(w, h, Math.min(Q.msaa, T.snapMsaa)), out: new THREE.WebGLRenderTarget(w, h, { depthBuffer: false }), img, px: new Uint8Array(img.data.buffer) };
    }
    return snap;
  }
  function shoot(w, h, mode, cv) {
    if (bakeDirty) bake();
    const kW = cssW, kH = cssH, kT = insets.top, kB = insets.bottom, kPx = pxPerM, kGhost = ghost ? ghost.root.visible : false, kRing = ringMesh.visible, kOp = trailU.uPar.value.x, kMin = trailU.uPar.value.w, kMood = postU.uMood.value;
    copyPose(poseKeep, poseLive);
    cssW = w; cssH = h; insets.top = insets.bottom = 0;
    fitPlay(poseLive, T.plinthM + 0.08, T.fitSouth + 0.35, 0, mode === 'result' ? T.tiltResult : T.tiltPlay);
    cam.aspect = w / h; applyPose(poseLive, cam);
    _v.set(house.W / 2 - 0.5, 0, house.H / 2).project(cam); _v2.set(house.W / 2 + 0.5, 0, house.H / 2).project(cam);
    pxPerM = Math.max(4, Math.hypot((_v2.x - _v.x) * w / 2, (_v2.y - _v.y) * h / 2));
    tiltBand('play'); viewUniforms(tb.f, tb.b + 0.04, w, h);
    if (ghost) ghost.root.visible = false;
    ringMesh.visible = false; trailU.uPar.value.x = T.trailSnap[0]; trailU.uPar.value.w = T.trailSnap[1];
    postU.uMood.value = moodClean.set(0, kMood.y * 0.5, 0, 0);
    postU.uFlip.value = 1;
    const sn = snapSet(w, h);
    drawTo(sn.t, sn.out, false);
    postU.uFlip.value = 0;
    if (cv) { renderer.readRenderTargetPixels(sn.out, 0, 0, w, h, sn.px); cv.getContext('2d').putImageData(sn.img, 0, 0); }
    else renderer.readRenderTargetPixels(sn.out, 0, 0, 1, 1, px1);
    renderer.setRenderTarget(null);
    cssW = kW; cssH = kH; insets.top = kT; insets.bottom = kB; pxPerM = kPx; copyPose(poseLive, poseKeep);
    cam.aspect = cssW / cssH; applyPose(poseLive, cam);
    if (ghost) ghost.root.visible = kGhost;
    ringMesh.visible = kRing; trailU.uPar.value.x = kOp; trailU.uPar.value.w = kMin; postU.uMood.value = kMood;
    viewUniforms(tiltF, tiltB);
  }
  function snapshot(opts) {
    const cv = document.createElement('canvas');
    if (!opts || !(opts.w || opts.h || opts.clean || opts.mode)) { cv.width = bufW; cv.height = bufH; draw(); cv.getContext('2d').drawImage(canvas, 0, 0); return cv; }
    cv.width = Math.max(16, Math.round(opts.w || bufW)); cv.height = Math.max(16, Math.round(opts.h || bufH));
    if (house && !lost && !disposed) shoot(cv.width, cv.height, opts.mode, cv);
    return cv;
  }
  let warmKey = '', warmJob = null, warmBusy = false, aimOn = false;
  function warm(opts) {
    if (!house || lost || disposed) return false;
    const w = Math.round((opts && opts.w) || T.snapSize[0]), h = Math.round((opts && opts.h) || T.snapSize[1]), key = qName + w + 'x' + h;
    if ((key === warmKey && snap) || warmBusy || warmJob) return true;
    const job = { w, h, mode: (opts && opts.mode) || 'play', key }, go = () => { warmBusy = false; if (!disposed) warmJob = job; };
    ensureGhost();
    if (typeof renderer.compileAsync !== 'function' || !main) { warmJob = job; return true; }
    warmBusy = true;
    renderer.setRenderTarget(main.scene); const a = renderer.compileAsync(scene, cam);
    renderer.setRenderTarget(null); const b = renderer.compileAsync(overlay, cam);
    Promise.all([a, b]).then(go, go);
    return true;
  }
  function warmNow(w, h, mode, key) {
    warmKey = key;
    const yy = -0.3, tmp = [];
    for (let i = 0; i < ITEM_IDS.length; i++) {
      const r = makeBody({ id: '__warm' + i, kind: 'item', item: i, r: 0.1 });
      r.root.position.set(house.W / 2, yy, house.H / 2); r.root.visible = true; r.root.updateMatrix();
      if (r.inst >= 0) { batch.setVisibleAt(r.inst, true); batch.setMatrixAt(r.inst, r.root.matrix); }
      for (const t of r.twins) t.visible = true;
      tmp.push(r);
    }
    ensureGhost();
    const gv = ghost.root.visible, pn = pN, tv = trailMesh.visible, rv = ringMesh.visible, bv = blobMesh.visible, bc = blobGeo.instanceCount;
    ghost.root.visible = true; ghost.root.position.set(house.W / 2, yy, house.H / 2);
    for (let k = 0; k < 5; k++) emit(k, house.W / 2, yy, house.H / 2, 0, 0, 0, 1, 0.01, 0.01, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0);
    updateParticles(0);
    trailMesh.visible = ringMesh.visible = blobMesh.visible = true; blobGeo.instanceCount = Math.max(1, bc);
    if (!tv) trailGeo.setDrawRange(0, 6);
    shoot(w, h, mode, null);
    const ovm = [dotMesh, arrowMesh, bandMesh, tipMesh, sprMesh], vis = [dotMesh.visible, arrowMesh.visible, bandMesh.visible, tipMesh.visible, sprMesh.visible], dc = dotGeo.instanceCount, sc = sprGeo.instanceCount, aa = arrowMat.uniforms.uAlpha.value, ta = tipMat.uniforms.uAlpha.value;
    for (const m of ovm) m.visible = true;
    dotGeo.instanceCount = 1; dA.array[0] = 0; dA.needsUpdate = true; sprGeo.instanceCount = 1; sCol.array[3] = 0; sCol.needsUpdate = true;
    arrowMat.uniforms.uAlpha.value = 0; tipMat.uniforms.uAlpha.value = 0; bandMat.uniforms.uC.value.z = 0; tipMesh.visible = !!rtMask;
    renderer.setRenderTarget(null); renderer.autoClear = false; renderer.render(overlay, cam); renderer.autoClear = true;
    for (let i = 0; i < ovm.length; i++) ovm[i].visible = vis[i];
    dotGeo.instanceCount = dc; sprGeo.instanceCount = sc; arrowMat.uniforms.uAlpha.value = aa; tipMat.uniforms.uAlpha.value = ta;
    ghost.root.visible = gv; trailMesh.visible = tv; ringMesh.visible = rv; blobMesh.visible = bv; blobGeo.instanceCount = bc;
    pN = pn; updateParticles(0);
    for (const r of tmp) removeRec(r);
  }
  function setCamera(mode, o = {}) {
    const m = mode === 'title' || mode === 'finish' || mode === 'result' ? mode : 'play';
    copyPose(poseFrom, pose);
    if (m !== camMode && (m === 'result' || m === 'finish') && camMode !== 'finish' && camMode !== 'result') { poiX = playerX; poiZ = playerZ; }
    camMode = m; camT0 = time;
    camDur = o.instant ? 0 : mode === 'intro' ? (o.fast ? T.introFastSec : T.introSec) : mode === 'finish' ? T.finishSec : T.modeSec;
    if (camDur === 0 && house) { if (playDirty) refitPlay(); updateView(0); goalPose(camMode, pose); copyPose(poseFrom, pose); poseOk = true; }
  }
  function onLost(e) { e.preventDefault(); lost = true; }
  function onRestored() {
    lost = false; sizeKey = '';
    if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    if (rtMask) { rtMask.dispose(); rtMask = null; } masksDirty = true;
    if (rtHouse) { rtHouse.dispose(); rtHouse = null; } bakeDirty = !!house;
    buildEnv(); resize();
    for (const [key, cv] of iconCache) drawIcon(key.split('@')[0], cv);
  }
  canvas.addEventListener('webglcontextlost', onLost, false);
  canvas.addEventListener('webglcontextrestored', onRestored, false);
  buildEnv();
  const q0 = opts.quality || 'auto';
  auto.on = auto.want = q0 === 'auto';
  applyQuality(q0 === 'auto' ? 'high' : q0);
  let readyDone; const ready = new Promise((res) => { readyDone = res; });
  ensureFont(() => { if (disposed) return; G = drawGlyphs(glyphCanvas); glyphTex.needsUpdate = true; drawLabels(); readyDone(); });
  return {
    setLayout, setBodies,
    setInsets(v) {
      const t = (v && v.top) || 0, b = (v && v.bottom) || 0;
      if (t === insets.top && b === insets.bottom) return;
      insets.top = t; insets.bottom = b; playDirty = true;
      if (poseOk && camMode !== 'play') { copyPose(poseFrom, pose); camT0 = time; camDur = Math.max(camDur, T.modeSec * 0.7); }
    },
    resize, setCamera, render, fx, ground, project, itemIcon, snapshot, warm,
    setView(mode) { if ((mode === 'near' || mode === 'wide' || mode === 'whole') && mode !== viewMode) { viewMode = mode; softCut(T.viewCutSec); } return viewMode; },
    setAvoid(list) { avoidPx = list && list.length ? list.map((q) => ({ x: q.x, y: q.y, w: q.w, h: q.h })) : list ? [] : null; labelDirty = true; placeLabels(); },
    setQuality(q) { auto.on = auto.want = q === 'auto'; auto.viewed = false; auto.n = 0; auto.nw = 0; auto.skip = 20; auto.strikes = 0; pendingQ = null; applyQuality(q === 'auto' ? 'high' : q); },
    stats() { return stat; },
    dispose() {
      disposed = true;
      canvas.removeEventListener('webglcontextlost', onLost, false); canvas.removeEventListener('webglcontextrestored', onRestored, false);
      clearHouse();
      for (const r of recs) removeRec(r);
      recs.length = 0; recById.clear();
      for (const k of bodyKinds.values()) { if (k.geo) k.geo.dispose(); if (k.proxy) k.proxy.dispose(); }
      batch.dispose(); bodyMat.dispose(); proxyMat.dispose(); rtNull.dispose();
      freeTargets(main); freeSnap();
      for (const t of [rtHouse, rtMask, envRT]) if (t) t.dispose();
      if (sun.shadow.map) sun.shadow.map.dispose();
      for (const m of [floorMat, lawnMat, tableMat, shaftMat, dustMat, labelMat, chevMat, glowMat, downMat, upMat, postMat, iconPostMat, bakeMat, silMat, ghostMat, dotMat, arrowMat, bandMat, tipMat, sprMat, ringMat, partMesh.material, blobMesh.material, trailMesh.material, iconShadow.material]) m.dispose();
      for (const g of [fsGeo, partGeo, blobGeo, trailGeo, dotGeo, arrowGeo, tipGeo, sprGeo, ringMesh.geometry, iconShadow.geometry]) g.dispose();
      labelTex.dispose(); glyphTex.dispose(); pmrem.dispose(); renderer.dispose();
    },
    ready,
    update, draw,
    debug: { renderer, scene, cam, T, get house() { return house; }, get pxPerM() { return pxPerM; }, get avoid() { return avoidW; }, get labels() { return labelSlots; } },
  };
}
