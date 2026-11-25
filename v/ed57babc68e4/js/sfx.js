const TUNE = {
  lead: 0.004,
  out: {
    trim: 0.42,
    comp: { threshold: -18, knee: 12, ratio: 2.2, attack: 0.006, release: 0.22 },
    limit: { threshold: -4, knee: 0, ratio: 20, attack: 0.001, release: 0.09 },
    clipKnee: 0.8,
  },
  verb: { sec: 1.5, rt60: 0.85, pre: 0.014, damp: 0.2, ret: 0.9,
    early: [[2.5, 0.45], [6.5, 0.32], [11, 0.26], [16.5, 0.2], [24, 0.14]] },
  panWidth: 0.45,
  voice: {
    throw:   { lv: 1.30, send: 0.10, gap: 0.04, max: 3 },
    hit:     { lv: 1.00, send: 0.14, gap: 0.07, max: 5 },
    meow:    { lv: 0.50, send: 0.12, gap: 0.70, max: 1 },
    select:  { lv: 0.60, send: 0.10, gap: 0.03, max: 3 },
    ui:      { lv: 1.20, send: 0.08, gap: 0.03, max: 3 },
    alarm:   { lv: 0.36, send: 0.14, gap: 0.50, max: 1 },
    start:   { lv: 0.40, send: 0.18, gap: 0.30, max: 1 },
    tick:    { lv: 2.20, send: 0.08, gap: 0.20, max: 2 },
    goal:    { lv: 0.38, send: 0.30, gap: 1.00, max: 1, duck: 2.0 },
    newbest: { lv: 0.36, send: 0.32, gap: 0.50, max: 1 },
    medal:   { lv: 0.38, send: 0.32, gap: 0.50, max: 1 },
    late:    { lv: 0.38, send: 0.30, gap: 1.00, max: 1, duck: 3.0 },
    stuck:   { lv: 0.45, send: 0.16, gap: 0.50, max: 1 },
    slide:   { lv: 1.00, send: 0.05 },
    aim:     { lv: 1.00, send: 0.04 },
  },
  throw: {
    gLight: 30, gHeavy: 1400,
    dur: [0.13, 0.36],
    amp0: 0.6,
    light: 4.0,
    oct: 1.1,
    body: [2100, 620], bodyQ: [1.5, 0.75], bodyA: 0.55,
    wh: [3500, 1250], whQ: [8, 3.5], whA: [0.6, 0.10],
    low: { f: [150, 72], a: 0.2, nf: [560, 240], na: 0.8 },
    chirp: { f: 1900, up: 1.45, a: 0.035 },
    cloth: { f: 3200, a: 0.14 },
  },
  slide: {
    vMax: 2.4, vMin: 0.012, curve: 0.45, amp: 0.38,
    tauUp: 0.07, tauDown: 0.11, tauF: 0.14, idle: 1.5,
    breath: { hp: 300, lp: [850, 5200], a: 1.0 },
    sheen: { f: [2300, 4600], q: 0.9, a: [0.10, 0.34] },
    floor: { f: [130, 290], a: [0.05, 0.55] },
    sing: { f: [1450, 2650], q: 7, a: [0.04, 0.10] },
    wob: 0.20,
  },
  aim: {
    amp: 0.30, f: [300, 820], q: 14, h2: 0.4,
    creak: { rate: [15, 40], f: [1300, 2600], q: 9, a: 1.6, k: 1.6 },
    tau: 0.035, tauOff: 0.05, idle: 0.6,
  },
  hit: {
    vMin: 0.015, floor: 0.10, curve: 0.8, det: 0.065,
    heavy: { g: 2.0, body: [150, 74], bodyA: 0.4, bodyT60: 0.26, drum: [300, 215], drumA: 0.7, drumT60: 0.17,
      thump: [1500, 260], thumpA: 1.0, thumpTau: 0.028,
      wood: [265, 2.37, 4.12], woodA: [0.45, 0.28, 0.14], woodT60: [0.24, 0.14, 0.08], knock: 1700, knockA: 0.4,
      cloth: 2300, clothA: 0.12 },
    light: { g: 2.3, f: [950, 1400], ratios: [1, 2.71, 4.53, 6.83], amps: [1, 0.42, 0.2, 0.07], t60: [0.15, 0.085, 0.05, 0.03],
      click: 4300, clickA: 0.55, body: 330, bodyA: 0.28 },
    soft: { g: 3.4, lp: [900, 2200], lpEnd: 340, hp: 230, a: 1.0, atk: 0.008, tau: 0.05, thud: [160, 110], thudA: 0.22, cloth: 700, clothA: 0.3 },
  },
  meow: {
    f0: 700, vUp: 0.32, dur: 0.25, nLen: 0.04, open: 0.045,
    shape: [0.86, 1.17, 0.8], riseAt: 0.075,
    n: [360, 1800, 2700], a: [1000, 1620, 3000], end: [800, 1500, 2850],
    q: [3.0, 5.0, 6.5], fa: [1.0, 0.72, 0.3],
    nasal: 0.5, breath: 0.06, vib: 0.012, vibHz: 9,
  },
  select: { f: 1250, ratios: [1, 2.62, 4.35], amps: [1, 0.3, 0.1], t60: [0.11, 0.055, 0.03], click: 3900, clickA: 0.3,
    second: { dt: 0.048, mul: 1.335, a: 0.5 }, gOct: 0.35 },
  ui: { f: 830, ratios: [1, 2.31, 3.9], amps: [1, 0.22, 0.06], t60: [0.09, 0.04, 0.02], click: 2600, clickA: 0.2 },
  alarm: { bells: [1320, 1490], ratios: [1, 2.42, 4.1], amps: [1, 0.28, 0.08], rate: 21, ring: 0.68, after: 0.12,
    rattle: 0.12, lp: 5200, click: { f: 2100, a: 0.55 } },
  start: { click: 3100, notes: [783.99, 1174.66], step: 0.085, a: 0.62, len: 0.75, air: 0.10 },
  tick: { f: [2900, 2350], up: 0.14, grow: 0.3, clickA: 3.2, metalA: 0.5, metalT60: 0.07, wood: [1180, 990], woodA: 0.7, woodT60: 0.08,
    pulse: [150, 96], pulseA: [0.03, 0.28], drum: 185, drumA: 1.2, thump: 700, thumpA: 1.6, dbl: 3 },
  goal: {
    run: [587.33, 659.26, 739.99, 880, 987.77, 1174.66], step: 0.062, runA: 0.5, runLen: 0.7,
    at: 0.39, chord: [1174.66, 1479.98, 1760], chordA: 0.4, chordLen: 1.5, strum: 0.014,
    base: [293.66, 440], baseA: 0.45, bass: 146.83, bassA: 0.42,
    pad: [293.66, 369.99, 440, 659.26], padA: 0.07,
    spark: [2349.32, 1760, 2959.96, 2349.32], sparkAt: 0.6, sparkStep: 0.075, sparkA: 0.14,
  },
  newbest: { notes: [1760, 1975.53, 2349.32, 2637.02, 2959.96, 3520], step: 0.036, a: 0.3, ding: [2349.32, 3520], dingA: 0.32, shine: 0.09 },
  medal: { gold: [1760, 2637.02], silver: [1479.98, 2217.46], bronze: [1174.66, 1760], a: 0.5, len: 1.4,
    trill: [3520, 2959.96, 3951.07, 4698.64], trillAt: 0.11, trillStep: 0.05, trillA: 0.12 },
  late: { notes: [659.26, 523.25, 587.33, 392.0], at: [0, 0.5, 1.0, 1.54], a: 0.6, len: [1.5, 1.5, 1.5, 2.4],
    lp: [4200, 1900], sag: -14 },
  stuck: { f: [560, 270], len: 0.5, vib: [6.2, 0.022], lp: 1600, a: 0.5, breath: { f: [1300, 420], a: 0.3 }, plop: { at: 0.47, f: 300, a: 0.38 } },
  bgm: { level: 0.32, xfade: 0.6, duck: 0.3, duckIn: 0.08, duckOut: 0.45, keep: 2 },
};
const NAMES = ['throw', 'hit', 'meow', 'select', 'ui', 'start', 'goal', 'late', 'stuck', 'tick', 'alarm', 'newbest', 'medal'];
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, k) => a + (b - a) * k;
let seedS = (Math.random() * 4294967296) >>> 0;
function rnd() {
  seedS = (seedS + 0x6d2b79f5) >>> 0;
  let x = seedS;
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
}
const jit = (r) => 1 + (rnd() * 2 - 1) * r;
function amt(v, d) {
  v = +v;
  if (!Number.isFinite(v)) return d;
  if (v > 1) v /= 100;
  return clamp(v, 0, 1);
}
function heft(g) {
  const T = TUNE.throw;
  g = +g;
  if (!Number.isFinite(g) || g <= 0) g = 300;
  return clamp(Math.log(g / T.gLight) / Math.log(T.gHeavy / T.gLight), 0, 1);
}
const PREP = {
  rate: 48000,
  slice: 4,
  started: false, done: false, data: null, ab: null, irs: {}, waiters: [], warm: false,
  stats: { slices: 0, maxSlice: 0, t0: 0, total: 0, warmMs: [] },
};
const nowMs = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
function later(fn, ms) {
  let done = false, id = 0, tm = 0;
  const go = () => {
    if (done) return;
    done = true;
    clearTimeout(tm);
    try { if (id && typeof cancelIdleCallback === 'function') cancelIdleCallback(id); } catch (e) {   }
    fn();
  };
  if (typeof requestIdleCallback === 'function') id = requestIdleCallback(go, { timeout: ms || 50 });
  tm = setTimeout(go, ms || 50);
}
function runSliced(gen, done) {
  const st = PREP.stats;
  const step = () => {
    const t0 = nowMs();
    const end = () => { const d = nowMs() - t0; st.slices++; if (d > st.maxSlice) st.maxSlice = d; };
    for (;;) {
      let r;
      try { r = gen.next(); } catch (e) { end(); done(null); return; }
      if (r.done) { end(); done(r.value); return; }
      if (nowMs() - t0 > PREP.slice) break;
    }
    end();
    later(step);
  };
  later(step);
}
function runNow(gen) { for (;;) { const r = gen.next(); if (r.done) return r.value; } }
function lcg(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2147483648 - 1; };
}
const CHUNK = 8192;
function* genNoise(sr, sec, pink, seed) {
  const n = Math.floor(sr * sec), m = 4096;
  const r = lcg(seed), raw = new Float32Array(n + m);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < n + m; i++) {
    const w = r();
    if (!pink) raw[i] = w * 0.7;
    else {
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
      raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.12;
      b6 = w * 0.115926;
    }
    if (i % CHUNK === CHUNK - 1) yield;
  }
  yield;
  const out = new Float32Array(n);
  out.set(raw.subarray(0, n));
  for (let i = 0; i < m; i++) {
    const k = (i / m) * Math.PI * 0.5;
    out[i] = raw[i] * Math.sin(k) + raw[n + i] * Math.cos(k);
  }
  return out;
}
const WOB_RATE = 22050;
function* genWobble() {
  const sec = 7.3, n = Math.floor(WOB_RATE * sec), r = lcg(77);
  const pts = [], k = 23;
  for (let i = 0; i < k; i++) pts.push(r());
  const d = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / n) * k, j = Math.floor(x), f = x - j;
    const a = pts[j % k], c = pts[(j + 1) % k], s = (1 - Math.cos(f * Math.PI)) * 0.5;
    d[i] = (a + (c - a) * s) * 0.8 + Math.sin((i / n) * Math.PI * 2 * 5) * 0.2;
    if (i % CHUNK === CHUNK - 1) yield;
  }
  return d;
}
function* genIR(sr) {
  const V = TUNE.verb, n = Math.floor(sr * V.sec), tau = V.rt60 / 6.91, pre = Math.floor(V.pre * sr), chans = [];
  for (let c = 0; c < 2; c++) {
    const r = lcg(0x2468ace + c * 977), d = new Float32Array(n);
    let lp = 0;
    for (let i = pre; i < n; i++) {
      const x = (i - pre) / sr;
      const k = V.damp + (1 - V.damp) * Math.exp(-x / 0.16);
      lp += k * (r() - lp);
      d[i] = lp * Math.exp(-x / tau) * Math.min(1, x / 0.006);
      if (i % CHUNK === CHUNK - 1) yield;
    }
    for (const [ms, g] of V.early) {
      const i = Math.floor((V.pre + ms / 1000 + c * 0.0011) * sr);
      if (i < n) d[i] += g * 0.25 * (c ? -1 : 1);
    }
    chans.push(d);
  }
  return { sr, chans };
}
function clipCurve() {
  const n = 4096, c = new Float32Array(n), k = TUNE.out.clipKnee, top = 0.98 - k;
  for (let i = 0; i < n; i++) {
    const x = ((i / (n - 1)) * 2 - 1) * 2, ax = Math.abs(x);
    const y = ax <= k ? ax : k + top * Math.tanh((ax - k) / top);
    c[i] = Math.sign(x) * y;
  }
  return c;
}
function toBuf(chans, sr, ac) {
  let b = null;
  try {
    if (typeof AudioBuffer === 'function') b = new AudioBuffer({ numberOfChannels: chans.length, length: chans[0].length, sampleRate: sr });
  } catch (e) { b = null; }
  if (!b) { if (!ac) return null; b = ac.createBuffer(chans.length, chans[0].length, sr); }
  chans.forEach((d, c) => b.getChannelData(c).set(d));
  return b;
}
function* genAll() {
  const sr = PREP.rate;
  const white = yield* genNoise(sr, 2.5, false, 1234);
  const pink = yield* genNoise(sr, 5, true, 5678);
  const wob = yield* genWobble();
  const ir = yield* genIR(sr);
  const curve = clipCurve();
  yield;
  const ab = { white: toBuf([white], sr) };
  yield;
  ab.pink = toBuf([pink], sr);
  yield;
  ab.wob = toBuf([wob], WOB_RATE);
  return { sr, white, pink, wob, ir, curve, ab: ab.white && ab.pink && ab.wob ? ab : null };
}
function prepStart() {
  if (PREP.started) return;
  PREP.started = true;
  PREP.stats.t0 = nowMs();
  runSliced(genAll(), (d) => {
    if (!d) return;
    PREP.data = d; PREP.ab = d.ab; PREP.irs[d.sr] = d.ir; PREP.done = true;
    PREP.stats.total = nowMs() - PREP.stats.t0;
    const w = PREP.waiters.splice(0);
    for (const f of w) try { f(); } catch (e) {   }
    warmUp();
  });
}
function prepWhen(fn) { if (PREP.done) fn(); else { PREP.waiters.push(fn); prepStart(); } }
function warmUp() {
  if (PREP.warm) return;
  const OAC = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
  if (!OAC) { PREP.warm = true; return; }
  let eng = null;
  const list = NAMES.slice(), seed = seedS;
  const step = () => {
    const t0 = nowMs();
    try {
      if (!eng) eng = makeEngine(new OAC(2, 128, PREP.rate), { verb: false });
      else if (list.length) eng.play(list.shift(), { v: 0.5 }, 0);
      else { eng.slide(1, 0); eng.aim(0.5, 0); }
    } catch (e) { list.length = 0; }
    PREP.stats.warmMs.push(+(nowMs() - t0).toFixed(2));
    if (eng && !list.length && PREP.stats.warmMs.length > NAMES.length + 1) { PREP.warm = true; seedS = seed; return; }
    later(step, 400);
  };
  later(step, 400);
}
function irFor(sr, fn) {
  if (PREP.irs[sr]) { fn(PREP.irs[sr]); return; }
  runSliced(genIR(sr), (ir) => { if (ir) { PREP.irs[sr] = ir; fn(ir); } });
}
function makeEngine(ac, opt) {
  opt = opt || {};
  const N = { white: null, pink: null, wob: null, real: false };
  function adopt() {
    const d = PREP.data;
    if (!d || N.real) return;
    const ab = PREP.ab || { white: toBuf([d.white], d.sr, ac), pink: toBuf([d.pink], d.sr, ac), wob: toBuf([d.wob], WOB_RATE, ac) };
    N.white = ab.white; N.pink = ab.pink; N.wob = ab.wob; N.real = true;
  }
  adopt();
  if (!N.real) {
    const r = lcg(4321), n = Math.floor(ac.sampleRate * 0.35), q = ac.createBuffer(1, n, ac.sampleRate), d = q.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = r() * 0.7;
    N.white = q; N.pink = q;
  }
  const has = { pan: typeof ac.createStereoPanner === 'function' };
  const G = (dst, v) => { const g = ac.createGain(); g.gain.value = v == null ? 1 : v; if (dst) g.connect(dst); return g; };
  const conn = (...a) => { for (let i = 0; i + 1 < a.length; i++) a[i].connect(a[i + 1]); return a[a.length - 1]; };
  function dyn(o) {
    const c = ac.createDynamicsCompressor();
    c.threshold.value = o.threshold; c.knee.value = o.knee; c.ratio.value = o.ratio; c.attack.value = o.attack; c.release.value = o.release;
    return c;
  }
  const trim = G(null, TUNE.out.trim);
  const comp = dyn(TUNE.out.comp), lim = dyn(TUNE.out.limit);
  conn(trim, comp, lim);
  let outNode = lim;
  if (opt.clip !== false) {
    const half = G(null, 0.5), sh = ac.createWaveShaper();
    sh.curve = PREP.data ? PREP.data.curve : clipCurve(); sh.oversample = '2x';
    conn(lim, half, sh);
    outNode = sh;
  }
  outNode.connect(ac.destination);
  const sfxVol = G(trim, 1);
  const dry = G(sfxVol, 1);
  const verbIn = G(null, 1), conv = ac.createConvolver();
  conv.normalize = true;
  conn(verbIn, conv, G(sfxVol, TUNE.verb.ret));
  let verbOn = false;
  function fillVerb(ir) {
    if (verbOn || !ir || ir.sr !== ac.sampleRate) return;
    conv.buffer = toBuf(ir.chans, ir.sr, ac);
    verbOn = true;
  }
  if (opt.verb === 'now') fillVerb(PREP.irs[ac.sampleRate] || runNow(genIR(ac.sampleRate)));
  function fill() {
    prepWhen(() => { adopt(); if (opt.verb !== false) irFor(ac.sampleRate, (ir) => later(() => fillVerb(ir), 300)); });
  }
  const bgmGate = G(trim, 1);
  const bgmDuck = G(bgmGate, 1);
  const bgmIn = G(bgmDuck, 1);
  function F(type, q, t, f) {
    const b = ac.createBiquadFilter();
    b.type = type;
    if (q != null) b.Q.value = q;
    if (f != null) b.frequency.setValueAtTime(f, t);
    return b;
  }
  function path(param, t, pts) {
    param.setValueAtTime(pts[0][1], t + pts[0][0]);
    for (let i = 1; i < pts.length; i++) param.exponentialRampToValueAtTime(Math.max(1e-4, pts[i][1]), t + pts[i][0]);
  }
  function env(param, t, a, atk, tau) {
    param.setValueAtTime(0, t);
    param.linearRampToValueAtTime(a, t + atk);
    param.setTargetAtTime(0, t + atk, tau);
    return t + atk + tau * 9;
  }
  function src(kind, t) {
    const s = ac.createBufferSource();
    s.buffer = N[kind]; s.loop = true;
    s.start(t, rnd() * (N[kind].duration - 0.05));
    return s;
  }
  function osc(type, t) { const o = ac.createOscillator(); o.type = type; o.start(t); return o; }
  function mode(dst, t, f, a, t60, o) {
    if (a <= 0) return t;
    o = o || {};
    const os = ac.createOscillator();
    os.type = o.type || 'sine';
    if (o.from) path(os.frequency, t, [[0, f * o.from], [o.glide || 0.02, f]]);
    else os.frequency.setValueAtTime(f, t);
    if (o.det) os.detune.setValueAtTime(o.det, t);
    const g = G(dst, 0);
    const end = env(g.gain, t, a, o.atk || 0.0015, t60 / 6.91);
    os.connect(g); os.start(t); os.stop(end);
    return end;
  }
  function burst(dst, t, o) {
    const s = src(o.buf || 'white', t);
    const b = F(o.type || 'bandpass', o.q == null ? 1 : o.q, t, o.f);
    if (o.f1) b.frequency.exponentialRampToValueAtTime(o.f1, t + (o.fAt || o.tau * 3));
    const g = G(dst, 0);
    const end = env(g.gain, t, o.a, o.atk || 0.001, o.tau);
    conn(s, b, g); s.stop(end);
    return end;
  }
  function swish(dst, t, o) {
    if (!(o.a > 0)) return;
    const s = src(o.buf || 'white', t);
    const b = F(o.type || 'bandpass', o.q, t, o.f[0]);
    b.frequency.exponentialRampToValueAtTime(o.f[1], o.tp);
    b.frequency.exponentialRampToValueAtTime(o.f[2], t + o.d);
    const g = G(dst, 0), tau = Math.max(0.01, (t + o.d - o.tp) / 4);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(o.a * 0.04, t + 0.004);
    g.gain.exponentialRampToValueAtTime(o.a, o.tp);
    g.gain.setTargetAtTime(0, o.tp, tau);
    conn(s, b, g); s.stop(o.tp + tau * 9);
  }
  function panTo(dst, pan) {
    if (!has.pan || !pan) return dst;
    const p = ac.createStereoPanner();
    p.pan.value = clamp(pan, -1, 1);
    p.connect(dst);
    return p;
  }
  function marimba(dst, t, f, a, len) {
    mode(dst, t, f, a, len);
    mode(dst, t, f * 3.93, a * 0.2, len * 0.28);
    mode(dst, t, f * 9.2, a * 0.045, len * 0.09);
    burst(dst, t, { buf: 'pink', type: 'lowpass', f: Math.min(6000, f * 2.2), q: 0, a: a * 0.22, tau: 0.004 });
  }
  function glock(dst, t, f, a, len) {
    mode(dst, t, f, a, len);
    mode(dst, t, f * 2.756, a * 0.28, len * 0.42);
    mode(dst, t, f * 5.404, a * 0.08, len * 0.18);
    burst(dst, t, { type: 'bandpass', f: Math.min(12000, f * 4), q: 1.5, a: a * 0.12, tau: 0.002 });
  }
  function chime(dst, t, f, a, len) {
    const end = mode(dst, t, f, a, len);
    mode(dst, t, f + 1.4, a * 0.38, len * 0.85);
    mode(dst, t, f * 0.5, a * 0.14, len * 1.05);
    mode(dst, t, f * 2.0, a * 0.24, len * 0.5);
    mode(dst, t, f * 2.76, a * 0.09, len * 0.2);
    mode(dst, t, f * 4.07, a * 0.04, len * 0.09);
    burst(dst, t, { type: 'bandpass', f: Math.min(9000, f * 3), q: 1.4, a: a * 0.1, tau: 0.004 });
    return end;
  }
  function pad(dst, t, fs, a, atk, hold, rel) {
    const lp = F('lowpass', 0, t, 1700), g = G(dst, 0);
    lp.connect(g);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(a, t + atk);
    g.gain.setTargetAtTime(0, t + atk + hold, rel / 5);
    const end = t + atk + hold + rel * 1.8;
    for (const f of fs) for (const d of [-7, 7]) {
      const o = osc('triangle', t);
      o.frequency.setValueAtTime(f, t); o.detune.setValueAtTime(d, t);
      o.connect(lp); o.stop(end);
    }
    return end;
  }
  const S = {};
  S.throw = (o, t, p) => {
    const T = TUNE.throw, pw = amt(p.power, 0.6), wt = heft(p.g);
    const d = lerp(T.dur[0], T.dur[1], wt) * lerp(0.85, 1.15, pw);
    const a = lerp(T.amp0, 1, pw) * lerp(T.light, 1, wt);
    const sh = Math.pow(2, (pw - 0.5) * T.oct) * jit(0.04);
    const tp = t + d * 0.4;
    const fb = lerp(T.body[0], T.body[1], wt) * sh;
    swish(o, t, { q: lerp(T.bodyQ[0], T.bodyQ[1], wt), f: [fb * 0.45, fb * 1.15, fb * 0.5], a: a * T.bodyA, tp, d });
    const fw = lerp(T.wh[0], T.wh[1], wt) * sh;
    swish(o, t + 0.004, { q: lerp(T.whQ[0], T.whQ[1], wt), f: [fw * 0.7, fw * 1.2, fw * 0.8], a: a * lerp(T.whA[0], T.whA[1], wt), tp: tp - d * 0.05, d: d * 0.9 });
    if (wt > 0.2) {
      const k = (wt - 0.2) / 0.8;
      swish(o, t, { buf: 'pink', type: 'bandpass', q: 0.8, f: [T.low.nf[1], T.low.nf[0] * sh, T.low.nf[1]], a: a * k * T.low.na, tp, d });
      const os = osc('sine', t), g = G(o, 0);
      path(os.frequency, t, [[0, T.low.f[0] * sh], [d, T.low.f[1]]]);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(a * k * T.low.a, tp);
      g.gain.setTargetAtTime(0, tp, d * 0.16);
      os.connect(g); os.stop(tp + d * 1.5);
    }
    if (wt < 0.6) {
      const k = 1 - wt / 0.6, f = T.chirp.f * sh * lerp(1.2, 0.8, wt);
      const os = osc('sine', t), g = G(o, 0);
      path(os.frequency, t, [[0, f], [0.045, f * T.chirp.up], [0.09, f * 1.1]]);
      const end = env(g.gain, t, a * k * T.chirp.a, 0.008, 0.025);
      os.connect(g); os.stop(end);
    }
    burst(o, t, { type: 'highpass', f: T.cloth.f, q: 0, a: a * T.cloth.a, tau: 0.006 });
    return d * 1.6;
  };
  S.hit = (o, t, p) => {
    const H = TUNE.hit, v = clamp(p.v == null ? 0.5 : +p.v || 0, 0, 1);
    if (v < H.vMin) return 0;
    const a = (H.floor + (1 - H.floor) * Math.pow(v, H.curve)) * (p.soft ? H.soft.g : p.heavy ? H.heavy.g : H.light.g);
    const det = Math.pow(2, (rnd() * 2 - 1) * H.det);
    const col = jit(0.2);
    if (p.soft) {
      const T = H.soft;
      const s = src('pink', t), lp = F('lowpass', 0, t, lerp(T.lp[0], T.lp[1], v) * col), hp = F('highpass', 0, t, T.hp), g = G(o, 0);
      lp.frequency.exponentialRampToValueAtTime(T.lpEnd, t + 0.08);
      conn(s, lp, hp, g); s.stop(env(g.gain, t, a * T.a, T.atk, T.tau * jit(0.15)));
      mode(o, t, T.thud[1] * det, a * T.thudA, 0.3, { from: T.thud[0] / T.thud[1], glide: 0.05, atk: 0.005 });
      burst(o, t + 0.004, { type: 'bandpass', q: 0.8, f: T.cloth * col, a: a * T.clothA * v, atk: 0.004, tau: 0.03 });
      return 0.3;
    }
    if (p.heavy) {
      const T = H.heavy;
      mode(o, t, T.body[1] * det, a * T.bodyA, T.bodyT60, { from: T.body[0] / T.body[1], glide: 0.07 });
      mode(o, t, T.drum[1] * det, a * T.drumA, T.drumT60, { from: T.drum[0] / T.drum[1], glide: 0.04 });
      burst(o, t, { buf: 'pink', type: 'lowpass', q: 1, f: T.thump[0] * (0.6 + 0.6 * v) * col, f1: T.thump[1], fAt: 0.06, a: a * T.thumpA, tau: T.thumpTau });
      const f0 = T.wood[0] * det * jit(0.04);
      mode(o, t, f0, a * T.woodA[0] * col, T.woodT60[0]);
      mode(o, t, f0 * T.wood[1] * jit(0.03), a * T.woodA[1] * jit(0.25), T.woodT60[1]);
      mode(o, t, f0 * T.wood[2] * jit(0.03), a * T.woodA[2] * jit(0.25), T.woodT60[2]);
      burst(o, t, { type: 'bandpass', q: 1.2, f: T.knock * col, a: a * T.knockA * (0.3 + 0.7 * v), tau: 0.008 });
      burst(o, t + 0.003, { type: 'bandpass', q: 0.8, f: T.cloth * col, a: a * T.clothA * v, atk: 0.004, tau: 0.035 });
      return 0.45;
    }
    const T = H.light;
    const f0 = lerp(T.f[0], T.f[1], rnd()) * det;
    for (let i = 0; i < T.ratios.length; i++) {
      mode(o, t, f0 * T.ratios[i] * (i ? jit(0.025) : 1), a * T.amps[i] * (i ? jit(0.3) : 1) * (i ? 0.5 + 0.5 * v : 1), T.t60[i] * jit(0.15));
    }
    burst(o, t, { type: 'bandpass', q: 1.4, f: T.click * col, a: a * T.clickA * (0.35 + 0.65 * v), tau: 0.0035 });
    mode(o, t, T.body * det, a * T.bodyA, 0.06, { from: 1.25, glide: 0.015 });
    return 0.2;
  };
  S.meow = (o, t, p) => {
    const T = TUNE.meow, v = clamp(p.v == null ? 0.5 : +p.v || 0, 0, 1);
    const f0 = T.f0 * (1 + T.vUp * v) * jit(0.03);
    const d = T.dur * jit(0.06), tn = t + T.nLen, ta = tn + T.open, te = t + d;
    let s;
    if (p.probe) s = src('white', t);
    else {
      s = osc('sawtooth', t);
      path(s.frequency, t, [[0, f0 * T.shape[0]], [T.riseAt, f0 * T.shape[1]], [d, f0 * T.shape[2]]]);
      const lfo = osc('sine', t), lg = G(s.frequency, f0 * T.vib);
      lfo.frequency.setValueAtTime(T.vibHz * jit(0.1), t);
      lfo.connect(lg); lfo.stop(te + 0.05);
    }
    s.stop(te + 0.05);
    const amp = G(o, 0), sum = G(amp, 1);
    for (let i = 0; i < 3; i++) {
      const b = F('bandpass', T.q[i], t, T.n[i]);
      b.frequency.setValueAtTime(T.n[i], tn);
      b.frequency.exponentialRampToValueAtTime(T.a[i] * jit(0.03), ta);
      b.frequency.exponentialRampToValueAtTime(T.end[i], te);
      conn(s, b, G(sum, T.fa[i]));
    }
    const nas = F('lowpass', 0, t, 480), ng = G(sum, T.nasal);
    ng.gain.setValueAtTime(T.nasal, t); ng.gain.setValueAtTime(T.nasal, tn); ng.gain.linearRampToValueAtTime(0, ta);
    conn(s, nas, ng);
    const br = src('white', t), bb = F('bandpass', 1.1, t, 2800), bg = G(sum, T.breath);
    conn(br, bb, bg); br.stop(te + 0.05);
    const g = amp.gain;
    g.setValueAtTime(0, t);
    g.linearRampToValueAtTime(0.32, t + 0.012);
    g.linearRampToValueAtTime(0.42, tn);
    g.linearRampToValueAtTime(1, ta);
    g.linearRampToValueAtTime(0.82, te - 0.028);
    g.linearRampToValueAtTime(0, te);
    return d + 0.05;
  };
  function woodTap(o, t, T, f, a) {
    for (let i = 0; i < T.ratios.length; i++) mode(o, t, f * T.ratios[i] * (i ? jit(0.02) : 1), a * T.amps[i], T.t60[i] * jit(0.1));
    burst(o, t, { type: 'bandpass', q: 1.6, f: T.click * jit(0.1), a: a * T.clickA, tau: 0.003 });
  }
  S.select = (o, t, p) => {
    const T = TUNE.select;
    const k = p.g != null ? Math.pow(2, (0.5 - heft(p.g)) * T.gOct) : 1;
    const f = T.f * k * jit(0.015);
    woodTap(o, t, T, f, 1);
    woodTap(o, t + T.second.dt, T, f * T.second.mul, T.second.a);
    return 0.2;
  };
  S.ui = (o, t) => {
    woodTap(o, t, TUNE.ui, TUNE.ui.f * jit(0.015), 1);
    return 0.13;
  };
  S.alarm = (o, t) => {
    const T = TUNE.alarm, lp = F('lowpass', 0, t, T.lp);
    lp.connect(o);
    const tEnd = t + T.ring, step = 1 / T.rate;
    const end = tEnd + T.after * 9;
    T.bells.forEach((fb, bi) => {
      const g = G(lp, 0);
      for (let i = 0; i < T.ratios.length; i++) {
        const os = osc('sine', t), mg = G(g, T.amps[i]);
        os.frequency.setValueAtTime(fb * T.ratios[i], t);
        os.connect(mg); os.stop(end);
      }
      g.gain.setValueAtTime(0, t);
      for (let k = 0, tk = t + bi * step * 0.5; tk < tEnd; k++, tk += step) {
        const pk = 0.5 * (k < 2 ? 0.7 + 0.15 * k : 1);
        g.gain.setTargetAtTime(pk, tk, 0.0015);
        g.gain.setTargetAtTime(pk * 0.3, tk + 0.006, 0.022);
      }
      g.gain.setTargetAtTime(0, tEnd, T.after);
    });
    const rs = src('white', t), rb = F('bandpass', 2, t, 5200), rg = G(lp, 0);
    rg.gain.setValueAtTime(0, t);
    for (let tk = t; tk < tEnd; tk += step * 0.5) { rg.gain.setTargetAtTime(T.rattle, tk, 0.001); rg.gain.setTargetAtTime(0, tk + 0.003, 0.004); }
    conn(rs, rb, rg); rs.stop(tEnd + 0.05);
    burst(o, tEnd, { type: 'bandpass', q: 1.8, f: T.click.f, a: T.click.a, tau: 0.004 });
    mode(o, tEnd, 760, T.click.a * 0.5, 0.05);
    mode(o, tEnd + 0.004, 1900, T.click.a * 0.25, 0.03);
    return T.ring + T.after * 6;
  };
  S.start = (o, t) => {
    const T = TUNE.start;
    burst(o, t, { type: 'bandpass', q: 1.5, f: T.click, a: 0.55, tau: 0.004 });
    mode(o, t, T.click * 0.86, 0.22, 0.04);
    mode(o, t, 1150, 0.25, 0.05);
    marimba(o, t + 0.03, T.notes[0], T.a * 0.8, T.len);
    marimba(o, t + 0.03 + T.step, T.notes[1], T.a, T.len);
    const s = src('pink', t), b = F('highpass', 0, t, 3500), g = G(o, 0);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(T.air, t + 0.12); g.gain.setTargetAtTime(0, t + 0.12, 0.08);
    conn(s, b, g); s.stop(t + 0.9);
    return 0.9;
  };
  S.tick = (o, t, p) => {
    const T = TUNE.tick, left = Number.isFinite(+p.left) ? +p.left : 10;
    const u = clamp((10 - left) / 9, 0, 1);
    const odd = Math.round(left) % 2 ? 1 : 0;
    const f = T.f[odd] * (1 + T.up * u);
    const a = 1 - T.grow + T.grow * u;
    burst(o, t, { type: 'bandpass', q: 3, f, a: a * T.clickA, tau: 0.005 });
    mode(o, t, f * 0.92, a * T.metalA, T.metalT60);
    mode(o, t, T.wood[odd] * (1 + 0.08 * u), a * T.woodA, T.woodT60);
    const pa = lerp(T.pulseA[0], T.pulseA[1], Math.pow(u, 1.4));
    const beat = (tb, k) => {
      mode(o, tb, T.pulse[1], pa * k, 0.3, { from: T.pulse[0] / T.pulse[1], glide: 0.05, atk: 0.004 });
      mode(o, tb, T.drum, pa * k * T.drumA, 0.16, { from: 1.25, glide: 0.03, atk: 0.003 });
      burst(o, tb, { buf: 'pink', type: 'lowpass', q: 0, f: T.thump, a: pa * k * T.thumpA, atk: 0.003, tau: 0.03 });
    };
    beat(t, 1);
    if (left <= T.dbl) beat(t + 0.15, 0.6);
    return left <= T.dbl ? 0.5 : 0.35;
  };
  S.goal = (o, t) => {
    const T = TUNE.goal, L = panTo(o, -0.18), R = panTo(o, 0.18);
    T.run.forEach((f, i) => marimba(i % 2 ? R : L, t + i * T.step, f, T.runA * (0.82 + 0.18 * i / (T.run.length - 1)), T.runLen));
    const tc = t + T.at;
    T.chord.forEach((f, i) => glock(i === 1 ? o : i ? R : L, tc + i * T.strum, f, T.chordA, T.chordLen));
    T.base.forEach((f) => marimba(o, tc, f, T.baseA, 1.1));
    mode(o, tc, T.bass, T.bassA, 1.2, { atk: 0.01 });
    pad(o, t + 0.05, T.pad, T.padA, 0.35, 0.25, 1.0);
    T.spark.forEach((f, i) => glock(i % 2 ? L : R, t + T.sparkAt + i * T.sparkStep, f, T.sparkA * (1 - i * 0.15), 0.6));
    return 2.0;
  };
  S.newbest = (o, t) => {
    const T = TUNE.newbest, L = panTo(o, -0.25), R = panTo(o, 0.25);
    T.notes.forEach((f, i) => glock(i % 2 ? R : L, t + i * T.step, f, T.a * (0.7 + 0.3 * i / (T.notes.length - 1)), 0.5));
    const td = t + T.notes.length * T.step + 0.02;
    T.ding.forEach((f) => glock(o, td, f, T.dingA, 1.0));
    const s = src('white', t), b = F('bandpass', 2.5, t, 5000), g = G(o, 0);
    b.frequency.exponentialRampToValueAtTime(10000, td + 0.1);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(T.shine, td); g.gain.setTargetAtTime(0, td, 0.12);
    conn(s, b, g); s.stop(td + 1.2);
    return td - t + 0.9;
  };
  S.medal = (o, t, p) => {
    const T = TUNE.medal, fs = T[p.medal] || T.gold;
    fs.forEach((f, i) => {
      glock(o, t, f, T.a * (i ? 0.6 : 1), T.len);
      mode(panTo(o, i ? 0.3 : -0.3), t, f * 1.003, T.a * 0.3 * (i ? 0.6 : 1), T.len * 0.8);
    });
    T.trill.forEach((f, i) => glock(i % 2 ? panTo(o, 0.3) : panTo(o, -0.3), t + T.trillAt + i * T.trillStep, f * (fs === T.gold ? 1 : fs[0] / T.gold[0]), T.trillA, 0.4));
    return T.len * 0.9;
  };
  S.late = (o, t) => {
    const T = TUNE.late, lp = F('lowpass', 0, t, T.lp[0]);
    lp.connect(o);
    const tl = t + T.at[3];
    lp.frequency.setTargetAtTime(T.lp[1], t + 0.3, 0.9);
    T.notes.forEach((f, i) => chime(lp, t + T.at[i], f, T.a * (i === 3 ? 1.05 : 1), T.len[i]));
    mode(lp, tl, T.notes[3], T.a * 0.3, T.len[3] * 0.9, { det: T.sag });
    return T.at[3] + T.len[3] * 0.7;
  };
  S.stuck = (o, t) => {
    const T = TUNE.stuck;
    const os = osc('triangle', t), lp = F('lowpass', 0, t, T.lp), g = G(o, 0);
    path(os.frequency, t, [[0, T.f[0]], [T.len, T.f[1]]]);
    const lfo = osc('sine', t), lg = G(os.frequency, T.f[0] * T.vib[1]);
    path(lfo.frequency, t, [[0, T.vib[0]], [T.len, T.vib[0] * 0.5]]);
    lfo.connect(lg);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(T.a, t + 0.03);
    g.gain.linearRampToValueAtTime(T.a * 0.6, t + T.len * 0.7);
    g.gain.linearRampToValueAtTime(0, t + T.len);
    conn(os, lp, g); os.stop(t + T.len + 0.02); lfo.stop(t + T.len + 0.02);
    const s = src('pink', t), b = F('bandpass', 1.2, t, T.breath.f[0]), bg = G(o, 0);
    b.frequency.exponentialRampToValueAtTime(T.breath.f[1], t + T.len);
    bg.gain.setValueAtTime(0, t); bg.gain.linearRampToValueAtTime(T.breath.a, t + 0.06); bg.gain.linearRampToValueAtTime(0, t + T.len);
    conn(s, b, bg); s.stop(t + T.len + 0.02);
    const tp = t + T.plop.at;
    mode(o, tp, T.plop.f, T.plop.a, 0.09, { from: 1.3, glide: 0.02 });
    mode(o, tp, T.plop.f * 2.6, T.plop.a * 0.2, 0.04);
    return T.plop.at + 0.15;
  };
  const last = {}, lastV = {}, voices = {};
  function voiceOut(name, p) {
    const V = TUNE.voice[name];
    const g = G(null, V.lv * (p.gain != null ? clamp(+p.gain || 0, 0, 2) : 1));
    let o = g;
    const pan = +p.pan || 0;
    if (pan && has.pan) { o = ac.createStereoPanner(); o.pan.value = clamp(pan * TUNE.panWidth, -1, 1); g.connect(o); }
    o.connect(dry);
    if (V.send > 0) o.connect(G(verbIn, V.send));
    return g;
  }
  function play(name, p, t) {
    const V = TUNE.voice[name];
    if (!S[name] || !V) return false;
    p = p || {};
    const key = name === 'hit' ? (p.soft ? 'hit.soft' : p.heavy ? 'hit.heavy' : 'hit.light') : name;
    if (last[key] != null && t - last[key] < V.gap && !(name === 'hit' && (+p.v || 0) > (lastV[key] || 0) + 0.35)) return false;
    const list = voices[name] || (voices[name] = []);
    for (let i = list.length - 1; i >= 0; i--) if (list[i].end <= t) list.splice(i, 1);
    if (list.length >= V.max) {
      const old = list.shift();
      old.g.gain.cancelScheduledValues(t);
      old.g.gain.setTargetAtTime(0, t, 0.012);
    }
    const g = voiceOut(name, p);
    const len = S[name](g, t, p);
    if (!(len > 0)) { g.disconnect(); return false; }
    last[key] = t; lastV[key] = +p.v || 0;
    list.push({ g, end: t + len });
    return true;
  }
  let sv = null;
  function slideVoice(t) {
    const T = TUNE.slide, out = voiceOut('slide', {});
    out.gain.setValueAtTime(0, t);
    const wob = G(out, 1), srcs = [];
    if (N.wob) {
      const ws = ac.createBufferSource();
      ws.buffer = N.wob; ws.loop = true;
      conn(ws, G(wob.gain, T.wob));
      ws.start(t, rnd() * 6);
      srcs.push(ws);
    }
    const p1 = src('pink', t), p2 = src('pink', t), w1 = src('white', t);
    srcs.push(p1, p2, w1);
    const hp = F('highpass', 0, t, T.breath.hp), lp = F('lowpass', 0, t, T.breath.lp[0]);
    conn(p1, hp, lp, G(wob, T.breath.a));
    const bp = F('bandpass', T.sheen.q, t, T.sheen.f[0]), gB = G(wob, 0);
    conn(w1, bp, gB);
    const lo = F('lowpass', 1, t, T.floor.f[0]), gC = G(wob, 0);
    conn(p2, lo, gC);
    const sg = F('bandpass', T.sing.q, t, T.sing.f[0]), gD = G(wob, 0);
    conn(w1, sg, gD);
    return { out, srcs, lp, bp, lo, sg, gB, gC, gD, lv: 0, quiet: t };
  }
  function slide(speed, t) {
    const T = TUNE.slide;
    speed = +speed;
    const v = Number.isFinite(speed) && speed > T.vMin ? Math.min(1, speed / T.vMax) : 0;
    if (!sv) { if (v === 0) return; sv = slideVoice(t); }
    const lv = v > 0 ? T.amp * Math.pow(v, T.curve) : 0;
    if (Math.abs(lv - sv.lv) > 0.0015 || (lv === 0 && sv.lv !== 0)) {
      sv.out.gain.setTargetAtTime(lv, t, lv > sv.lv ? T.tauUp : T.tauDown);
      if (v > 0) {
        const b = Math.pow(v, 0.8);
        sv.lp.frequency.setTargetAtTime(lerp(T.breath.lp[0], T.breath.lp[1], b), t, T.tauF);
        sv.bp.frequency.setTargetAtTime(lerp(T.sheen.f[0], T.sheen.f[1], v), t, T.tauF);
        sv.lo.frequency.setTargetAtTime(lerp(T.floor.f[0], T.floor.f[1], v), t, T.tauF);
        sv.sg.frequency.setTargetAtTime(lerp(T.sing.f[0], T.sing.f[1], v), t, T.tauF);
        sv.gB.gain.setTargetAtTime(lerp(T.sheen.a[0], T.sheen.a[1], v), t, T.tauF);
        sv.gC.gain.setTargetAtTime(lerp(T.floor.a[0], T.floor.a[1], v), t, T.tauF);
        sv.gD.gain.setTargetAtTime(lerp(T.sing.a[0], T.sing.a[1], v), t, T.tauF);
      }
      sv.lv = lv;
    }
    if (lv > 0) sv.quiet = t;
    else if (t - sv.quiet > T.idle) {
      const old = sv;
      sv = null;
      for (const s of old.srcs) s.stop(t + 0.05);
    }
  }
  let av = null;
  function aimVoice(t) {
    const T = TUNE.aim, out = voiceOut('aim', {});
    out.gain.setValueAtTime(0, t);
    const s = src('white', t);
    const b1 = F('bandpass', T.q, t, T.f[0]), b2 = F('bandpass', T.q, t, T.f[0] * 2);
    conn(s, b1, G(out, 1));
    conn(s, b2, G(out, T.h2));
    const saw = osc('sawtooth', t), cb = F('bandpass', T.creak.q, t, T.creak.f[0]), cg = G(out, 0);
    saw.frequency.setValueAtTime(T.creak.rate[0], t);
    conn(saw, cb, cg);
    return { out, srcs: [s, saw], b1, b2, saw, cb, cg, pw: 0, t: t, quiet: t, lv: 0 };
  }
  function aim(power, t) {
    const T = TUNE.aim, pw = amt(power, 0);
    if (!av) { if (pw <= 0) return; av = aimVoice(t); av.pw = pw; }
    if (pw > 0) {
      const f = lerp(T.f[0], T.f[1], Math.pow(pw, 0.7));
      av.b1.frequency.setTargetAtTime(f, t, T.tau);
      av.b2.frequency.setTargetAtTime(f * 2, t, T.tau);
      av.saw.frequency.setTargetAtTime(lerp(T.creak.rate[0], T.creak.rate[1], pw), t, T.tau);
      av.cb.frequency.setTargetAtTime(lerp(T.creak.f[0], T.creak.f[1], pw), t, T.tau);
      const dt = Math.max(1 / 120, t - av.t), mv = Math.abs(pw - av.pw) / dt;
      av.cg.gain.setTargetAtTime(clamp(mv * T.creak.k, 0, 1) * T.creak.a, t, T.tau);
      const lv = T.amp * (0.35 + 0.65 * pw);
      av.out.gain.setTargetAtTime(lv, t, T.tau);
      av.lv = lv; av.quiet = t;
    } else if (av.lv > 0) {
      av.out.gain.setTargetAtTime(0, t, T.tauOff);
      av.cg.gain.setTargetAtTime(0, t, T.tauOff);
      av.lv = 0;
    } else if (t - av.quiet > T.idle) {
      const old = av;
      av = null;
      for (const s of old.srcs) s.stop(t + 0.05);
    }
    if (av) { av.pw = pw; av.t = t; }
  }
  function hush(t) {
    if (sv) { sv.out.gain.setTargetAtTime(0, t, 0.04); sv.lv = 0; }
    if (av) { av.out.gain.setTargetAtTime(0, t, 0.03); av.cg.gain.setTargetAtTime(0, t, 0.03); av.lv = 0; }
  }
  return { ac, play, slide, aim, hush, fill, sfxVol, bgmIn, bgmDuck, bgmGate, has, outNode, info: () => ({ real: N.real, verb: verbOn }) };
}
export function createSfx(opts) {
  opts = opts || {};
  let ac = null, eng = null, unlocked = false, paused = false, wakeUntil = 0, sleepTimer = 0;
  const vol = { sfx: 1, bgm: 1 };
  const B = { want: null, cur: null, bufs: {}, order: [], loading: {}, failed: {} };
  let base = '';
  try { base = opts.bgmBase || new URL('../bgm/', import.meta.url).href; } catch (e) { base = 'bgm/'; }
  let tapDest = null, tapGate = null, unlockMs = null, acMs = null;
  try { prepStart(); } catch (e) {   }
  const quiet = (p) => { if (p && typeof p.then === 'function') p.then(null, () => {}); };
  const ready = () => !!eng && unlocked && (ac.state === 'running' || (ac.state === 'suspended' && nowMs() < wakeUntil));
  const curve = (v) => { v = clamp(+v || 0, 0, 1); return v * v; };
  function wake() {
    if (!ac) return;
    wakeUntil = nowMs() + 1000;
    try { quiet(ac.resume()); } catch (e) {   }
  }
  function unlock() {
    const t0 = nowMs();
    try {
      if (!ac) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return;
        const a0 = nowMs();
        try { ac = new AC({ latencyHint: 'interactive' }); } catch (e) { ac = new AC(); }
        acMs = nowMs() - a0;
        try { eng = makeEngine(ac); } catch (e) { eng = null; }
        if (eng) {
          eng.sfxVol.gain.value = curve(vol.sfx);
          eng.bgmIn.gain.value = curve(vol.bgm);
          eng.fill();
        }
      }
      if (!unlocked) {
        const b = ac.createBuffer(1, 1, 22050), s = ac.createBufferSource();
        s.buffer = b; s.connect(ac.destination); s.start(0);
        unlocked = true;
      }
      if (ac.state !== 'running' && !(paused && isHidden())) wake();
      bgmSync();
    } catch (e) {   }
    if (unlockMs == null && ac) unlockMs = nowMs() - t0;
  }
  function tap() {
    if (!eng || !unlocked || typeof ac.createMediaStreamDestination !== 'function') return null;
    try {
      if (!tapDest) {
        tapDest = ac.createMediaStreamDestination();
        tapGate = ac.createGain();
        eng.outNode.connect(tapGate);
      }
      tapGate.disconnect();
      tapGate.connect(tapDest);
      return tapDest.stream;
    } catch (e) { return null; }
  }
  function untap() {
    try { if (tapGate) tapGate.disconnect(); } catch (e) {   }
  }
  function play(name, p) {
    if (!ready()) return false;
    try {
      const ok = eng.play(name, p || {}, ac.currentTime + TUNE.lead);
      const V = TUNE.voice[name];
      if (ok && V && V.duck) duck(V.duck);
      return ok;
    } catch (e) { return false; }
  }
  function slide(speed) {
    if (!ready() || paused) return;
    try { eng.slide(speed, ac.currentTime); } catch (e) {   }
  }
  function aim(power) {
    if (!ready() || paused) return;
    try { eng.aim(power, ac.currentTime); } catch (e) {   }
  }
  function setVolume(v) {
    if (!v) return;
    if (v.sfx != null) vol.sfx = clamp(+v.sfx || 0, 0, 1);
    if (v.bgm != null) vol.bgm = clamp(+v.bgm || 0, 0, 1);
    if (!eng) return;
    try {
      const t = ac.currentTime;
      eng.sfxVol.gain.setTargetAtTime(curve(vol.sfx), t, 0.03);
      eng.bgmIn.gain.setTargetAtTime(curve(vol.bgm), t, 0.03);
    } catch (e) {   }
  }
  const isHidden = () => { try { return typeof document !== 'undefined' && document.visibilityState === 'hidden'; } catch (e) { return false; } };
  function pause() {
    paused = true;
    if (!eng) return;
    try {
      const t = ac.currentTime;
      eng.hush(t);
      eng.bgmGate.gain.setTargetAtTime(0, t, 0.08);
      clearTimeout(sleepTimer);
      if (isHidden()) sleepTimer = setTimeout(() => { if (paused && ac) try { quiet(ac.suspend()); } catch (e) {   } }, 400);
    } catch (e) {   }
  }
  function resume() {
    paused = false;
    clearTimeout(sleepTimer);
    if (!eng || !unlocked) return;
    try {
      if (ac.state !== 'running') wake();
      eng.bgmGate.gain.setTargetAtTime(1, ac.currentTime, 0.15);
    } catch (e) {   }
  }
  function duck(sec) {
    try {
      const g = eng.bgmDuck.gain, t = ac.currentTime, Bt = TUNE.bgm;
      g.cancelScheduledValues(t);
      g.setTargetAtTime(Bt.duck, t, Bt.duckIn);
      g.setTargetAtTime(1, t + sec, Bt.duckOut);
    } catch (e) {   }
  }
  function bgm(name) {
    B.want = typeof name === 'string' && /^[A-Za-z0-9_-]+$/.test(name) ? name : null;
    bgmSync();
  }
  function bgmSync() {
    if (!eng || !unlocked) return;
    try {
      const w = B.want;
      if (B.cur && B.cur.name === w) return;
      if (!w || B.failed[w] || (Array.isArray(opts.bgmList) && opts.bgmList.indexOf(w) < 0)) { bgmStop(); return; }
      const buf = B.bufs[w];
      if (!buf) { bgmLoad(w); return; }
      bgmStop();
      B.cur = bgmStart(w, buf);
    } catch (e) {   }
  }
  function bgmStart(name, buf) {
    const t = ac.currentTime, X = TUNE.bgm.xfade;
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(TUNE.bgm.level, t + X);
    g.connect(eng.bgmIn);
    const s = ac.createBufferSource();
    s.buffer = buf; s.loop = true;
    s.connect(g); s.start(t);
    return { name, s, g };
  }
  function bgmStop() {
    const c = B.cur;
    B.cur = null;
    if (!c) return;
    try {
      const t = ac.currentTime, X = TUNE.bgm.xfade;
      c.g.gain.cancelScheduledValues(t);
      c.g.gain.setTargetAtTime(0, t, X / 4);
      c.s.stop(t + X * 1.6);
    } catch (e) {   }
  }
  function decode(ab) {
    return new Promise((res) => {
      let done = false;
      const ok = (b) => { if (!done) { done = true; res(b || null); } };
      const ng = () => { if (!done) { done = true; res(null); } };
      try {
        const p = ac.decodeAudioData(ab, ok, ng);
        if (p && typeof p.then === 'function') p.then(ok, ng);
      } catch (e) { ng(); }
    });
  }
  function bgmLoad(name) {
    if (B.loading[name]) return;
    B.loading[name] = true;
    const get = (ext) => {
      if (typeof fetch !== 'function') return Promise.resolve(null);
      try {
        return fetch(base + name + ext).then((r) => (r && r.ok ? r.arrayBuffer() : null)).then((ab) => (ab ? decode(ab) : null), () => null);
      } catch (e) { return Promise.resolve(null); }
    };
    get('.m4a').then((b) => b || get('.mp3')).then((buf) => {
      B.loading[name] = false;
      if (!buf) { B.failed[name] = true; bgmSync(); return; }
      B.bufs[name] = buf;
      B.order = B.order.filter((k) => k !== name).concat(name);
      while (B.order.length > TUNE.bgm.keep) delete B.bufs[B.order.shift()];
      bgmSync();
    }, () => { B.loading[name] = false; B.failed[name] = true; });
  }
  return {
    NAMES: NAMES.slice(),
    unlock, play, slide, aim, setVolume, pause, resume, bgm, tap, untap,
    state: () => (ac ? ac.state : 'none'),
    info: () => ({ state: ac ? ac.state : 'none', rate: ac ? ac.sampleRate : 0, prep: PREP.done, real: eng ? eng.info().real : false, verb: eng ? eng.info().verb : false, unlockMs, acMs }),
    bgmInfo: () => ({ want: B.want, playing: B.cur ? B.cur.name : null, loaded: Object.keys(B.bufs), failed: Object.keys(B.failed) }),
  };
}
async function render(spec) {
  const OAC = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
  const sr = spec.sr || 48000, dur = spec.dur || 2;
  await new Promise((res) => prepWhen(res));
  const ac = new OAC(2, Math.ceil(sr * dur), sr);
  if (spec.seed != null) seedS = spec.seed >>> 0;
  const eng = makeEngine(ac, { clip: spec.clip, verb: 'now' });
  const played = [];
  for (const e of spec.events || []) played.push(eng.play(e.name, e.p || {}, e.at || 0));
  const cont = [];
  for (const [t, v] of spec.slide || []) cont.push([t, 0, v]);
  for (const [t, v] of spec.aim || []) cont.push([t, 1, v]);
  cont.sort((a, b) => a[0] - b[0]);
  for (const [t, k, v] of cont) (k ? eng.aim : eng.slide)(v, t);
  const buf = await ac.startRendering();
  return { buf, played };
}
export const __test = { NAMES, TUNE, render, seed: (n) => { seedS = n >>> 0; }, prepDone: () => PREP.done, warm: () => PREP.warm, prepStats: () => PREP.stats };
