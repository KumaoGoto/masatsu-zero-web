import { createUI } from './ui.js';
import { HINTS, PULLS, pullMode, medalFor, shareText } from './text.js';
import { createStore, KEYS, better, validRecord } from './store.js';
import { createPull, guardGestures } from './input.js';
import { createAimView, createCoach } from './aimview.js';
import { CARD, cropShot, planShot, makeThumb, composeCard, composeCardTall, toBlob, fontsReady } from './card.js';
import { VIDEO, videoSupport, videoSpeed, videoRegion, createVideo } from './video.js';
const SITE = {
  announce: '',
  version: 'v0.1.0',
};
const TUNE = {
  frameCap: 0.1,
  stepsCap: 60,
  pullPx: 130,
  pullRef: 390,
  pullWide: 1.6,
  aimDead: 3,
  predictTicks: 720,
  predictStride: 8,
  repredict: 2,
  kickSec: 0.35,
  moreAbove: 1.0,
  introSec: 1.2,
  introFastSec: 0.5,
  wakeAt: 0.62,
  hintAfterMs: 2600,
  hintUpper: 0.45,
  hintClear: 72,
  hintDoor: 64,
  coachPlays: 2,
  coachIdleSec: 3,
  coachFlipMm: 400,
  iconPx: 64,
  iconPx3: 76,
  retryStill: 3,
  slow: 0.25,
  slowHold: 0.42,
  slowBack: 0.22,
  resultOut: 1.3,
  resultFail: 0.9,
  shotAt: 0.12,
  warmFrames: 45,
  afterSec: 14,
  retryKeyLock: 0.35,
  newbestGap: 550,
  replayLead: 0.6,
  replayAuto2xFrac: 1 / 2,
  replayMinSec: 5,
  recFrameCap: 5,
  recStepsCap: 6000,
  trailEvery: 6,
  trailMax: 2048,
  heavyG: 2000,
  hitFull: 2.4,
  hitFullLight: 9,
  hitSndMin: 0.05,
  hitFxMin: 0.25,
  hitFxMax: 4,
  afterGain: 0.55,
  pinG: 1500,
  crashMin: 0.5,
  crashFull: 8,
  smashV: 0.8,
  stillV: 0.05,
  smashWinSec: 1.5,
  smashQuietSec: 0.3,
  strikeN: 5,
  comboN: 2,
  stopMin: 0.04, stopMax: 0.09,
  stopHitV: 1.8,
  stopHitFull: 5,
  stopPins: 3,
  stopPinsFull: 8,
  stopGap: 0.6,
  throwSlow: 0.32,
  throwSlowSec: 0.2,
  throwSlowBigSec: 0.35,
  throwSlowBack: 0.15,
  throwSlowRec: 0.6,
  blastVRef: 7.9,
  blastBig: 0.6,
  blastStopMin: 0.06, blastStopMax: 0.1,
  dashFull: 2.4,
  vibThrow: [8, 22], vibHit: [6, 18], vibGoal: [14, 70, 22],
  vibBlast: [40, 80], vibBlastTail: [34, 16, 34, 16],
  vibHeavy: [25, 40],
  vibStrike: [12, 36, 12, 36, 14],
  vibHitFull: 2.0,
  hotFrac: 1 / 6,
  wakeIdleSec: 30,
  dayCheckFrames: 120,
  volumeTick: 140,
};
const DEFAULT_SETTINGS = { sfx: 0.8, bgm: 0.6, vibe: true, ghost: true, pull: PULLS.def, quality: 'auto' };
const PULL_VER = 3;
const C = window.NFCore;
const LIMIT = C.CONFIG.LIMIT_TICKS;
const HOT_TICKS = Math.max(240, Math.round(LIMIT * TUNE.hotFrac / 240) * 240);
const PREDICT_TICKS = Number.isInteger(C.CONFIG.PREDICT_TICKS) && C.CONFIG.PREDICT_TICKS > 0 ? C.CONFIG.PREDICT_TICKS : TUNE.predictTicks;
const LAYOUTS = window.NF_LAYOUTS || [];
const WEB = window.NF_WEB || null;
const QS = new URLSearchParams(location.search);
const DEBUG_URL = QS.has('debug');
const DEBUG = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const UM = 1e-6;
const VMS = 240e-6;
const BLAST_ITEMS = C.ITEMS.some((it) => it.blast && it.blast.v > 0);
const BLAST_V = BLAST_ITEMS ? Math.max(...C.ITEMS.map((it) => (it.blast && it.blast.v) || 0)) : TUNE.blastVRef / VMS;
const G_MAX = Math.max(1, ...C.ITEMS.map((it) => it.g));
const STEP = 1 / 240;
const DAY_CH = '日月火水木金土';
const SOFT = { sofa: true, bed: true, futon: true, cat: true, cushion: true };
const PHASE_F = { boot: 'title', title: 'title', intro: 'intro', ready: 'play', play: 'play', ending: 'done', result: 'done', replay: 'play', replayEnd: 'done', replayDone: 'done' };
const INSTANT = { instant: true }, FAST = { fast: true };
const SHOT_OPTS = { w: CARD.shotW, h: CARD.shotH, mode: 'play', clean: true };
const errs = [];
function note(e) { if (errs.length < 30) errs.push(String((e && e.stack) || e)); }
function web(name, a, b) {
  if (!WEB || typeof WEB[name] !== 'function') return undefined;
  try {
    const r = WEB[name](a, b);
    if (r && typeof r.then === 'function') r.then(null, () => {});
    return r;
  } catch (e) { note(e); return undefined; }
}
const NO_STAGE = {
  setLayout() {}, setBodies() {}, setInsets() {}, setAvoid() {}, setView() {}, resize() {}, setCamera() {}, render() {}, update() {}, draw() {}, fx() {},
  ground() { return null; }, project() { return null; }, itemIcon() { return null; }, snapshot() { return null; }, warm() { return false; },
  setQuality() {}, stats() { return null; },
};
const NO_SFX = { unlock() {}, play() { return false; }, slide() {}, aim() {}, setVolume() {}, pause() {}, resume() {}, bgm() {}, state() { return 'none'; }, tap() { return null; }, untap() {} };
function guard(real, stub) {
  const o = {};
  for (const k of Object.keys(stub)) {
    const fn = real && real[k];
    o[k] = typeof fn === 'function'
      ? (a, b, c, d) => { try { return fn.call(real, a, b, c, d); } catch (e) { note(e); return undefined; } }
      : stub[k];
  }
  return o;
}
let ui = null, stage = NO_STAGE, sfx = NO_SFX, store = null, pull = null, view = null, coach = null, canvas = null;
let settings = { ...DEFAULT_SETTINGS };
let todayL = null, layout = null, cats = 0;
let todayKey = '';
let runDate = '';
let stageDead = false;
let state = null;
let phase = 'boot';
let paused = false;
const FIRST = Math.max(0, Number.isInteger(C.CONFIG.FIRST_ITEM) ? C.CONFIG.FIRST_ITEM : C.ITEMS.findIndex((it) => it.id === 'kyoka'));
const RANDO = C.ITEMS.findIndex((it) => it.id === 'rando');
let sel = FIRST;
let runId = 0;
let tampered = false;
let plays = 0;
let pendingStart = null;
let storeDirty = false;
let rafId = 0, last = -1, frames = 0, readyAt = -1;
let warmAt = -1;
let acc = 0;
let timeScale = 1;
let introT = 0, introLen = 0, readyT = 0, coachOn = false;
let avoidNow = null;
let stillLeft = 0;
let idleT = 0, wakeIdle = false;
let endT = 0, endOutcome = null, resultAt = 0, resultDelay = 0;
let kick = 0;
let drawHold = 0;
const perf = { ms: 0, max: 0, n: 0, steps: 0, draws: 0, shot: 0, clean: 0, card: 0, slow: [], gaps: [], tag: '', endAt: 0, result: 0, introAt: 0, intro: 0 };
const prevX = new Float64Array(256), prevY = new Float64Array(256);
let gPrevX = 0, gPrevY = 0;
const pool = [];
const fBodies = [];
const aimF = { dx: 0, dy: 1, power: 0, item: 'kyoka', dv: 0, path: new Float32Array(200), n: 0 };
const ghostF = { x: 0, y: 0, vx: 0, vy: 0 };
const trail = { pts: new Float32Array(TUNE.trailMax * 2), n: 0 };
const f = { t: 0, dt: 0, bodies: fBodies, player: { rando: true, mood: 'sleep', kick: 0 }, aim: null, trail: null, ghost: null, timeLeft: LIMIT / 240, phase: 'title' };
let trailEvery = TUNE.trailEvery;
let bodiesDirty = true;
const defs = [];
const predOut = new Int32Array(200);
const aim = { on: false, dir: 64, power: 0, item: -1, age: 0, r: TUNE.pullPx };
const gA = { x: 0, y: 0 }, gB = { x: 0, y: 0 }, pA = { x: 0, y: 0 };
let queued = null;
const queueBox = { item: 0, dir: 0, power: 0 };
const fr = { hitV: 0, hitHeavy: false, hitSoft: false, hitPan: 0, meow: -1, meowPan: 0, fx: 0, vib: 0, vibHeavy: 0, vibStrike: false, vibBlast: 0, crashN: 0, crashV: 0, crashMat: 'plastic', crashPan: 0, stamp: 1 };
const sndHit = { v: 0, heavy: false, soft: false, pan: 0, gain: 1 }, sndMeow = { v: 0, pan: 0 }, sndThrow = { power: 0, g: 0, pan: 0 };
const sndCrash = { v: 0, n: 0, mat: 'plastic', pan: 0 }, sndStrike = { n: 0 }, fxStrike = { n: 0, x: 0, y: 0 };
const sndSel = { g: 0 }, sndTick = { left: 0 }, sndMedal = { medal: null };
const fxHit = { x: 0, y: 0, v: 0, heavy: false, id: 0, b: -1 }, fxThrow = { id: 0, x: 0, y: 0, dx: 0, dy: 0, power: 0 }, fxOut = { id: 0, x: 0, y: 0 }, fxCat = { id: 0 };
const fxBlast = { x: 0, y: 0, r: 0, power: 0, src: 'throw', item: null }, sndBoom = { power: 0, src: 'throw', pan: 0 };
const hudArg = { tenths: LIMIT / 24, hot: false, running: false };
const invArg = { counts: null, sel: FIRST, icons: null };
let ghost = null, ghostLog = null, ghostI = 0;
const ghostOk = { key: '', ok: false };
let sum = null, lastR = null, endLog = null, medalUp = false;
let wantShot = false, shotDone = false, shot = null, thumb = null, share = null;
let cleanAt = 0;
let cleanOk = null;
const shotBodies = [], shotPool = [];
let staleThumb = null;
let iconMap = null;
let officialRun = false, dailyNew = false, lastRun = null;
const rp = {
  on: false,
  pick: 1,
  speed: 1,
  lead: 0,
  i: 0,
  t: 0,
  rec: null,
  recording: false,
  began: false,
  total: 0,
  extra: 0,
  left: -1,
  region: null,
  card: null, cardT: -1,
  cap: -1, capT: 9,
  hidden: false,
  video: null,
};
const vf = { src: null, sx: 0, sy: 0, sw: 0, sh: 0, tenths: 0, speed: 1, cap: { icon: null, name: '', a: 0 }, card: null, cardA: 0 };
const lerp = (a, b, k) => a + (b - a) * k;
function freeCanvas(c) { if (c && c.width) { c.width = 0; c.height = 0; } }
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
function jstNow() {
  const d = new Date(Date.now() + 9 * 3600000);
  return { day: d.getUTCDay(), date: d.toISOString().slice(0, 10) };
}
function dayChar(L) { return L && Number.isInteger(L.day) && L.day >= 0 && L.day <= 6 ? DAY_CH[L.day] : ''; }
function layoutOfDay(d) { return LAYOUTS.find((l) => l.day === d) || LAYOUTS[0]; }
function layoutOfDate(date) { const d = new Date(date + 'T00:00:00Z').getUTCDay(); return layoutOfDay(Number.isFinite(d) ? d : jstNow().day); }
function pickToday() { const n = jstNow(); todayKey = n.date; todayL = layoutOfDay(n.day); }
function dayChanged() {
  if (!todayKey || jstNow().date === todayKey) return false;
  toTitle();
  ui.toast('日付が変わりました。今日の間取りです');
  return true;
}
function shareUrl() { return (WEB && typeof WEB.shareUrl === 'string' && WEB.shareUrl) || SITE.announce || undefined; }
function pullLen() {
  const s = Math.min(window.innerWidth || TUNE.pullRef, window.innerHeight || TUNE.pullRef) / TUNE.pullRef;
  return TUNE.pullPx * Math.min(TUNE.pullWide, Math.max(1, s));
}
function tenthsLeft() { return Math.ceil((LIMIT - state.tick) / 24); }
function loadSettings() {
  const s = store.get(KEYS.settings, {}) || {}, d = DEFAULT_SETTINGS;
  const num = (v, dv) => (Number.isFinite(v) ? clamp01(v) : dv);
  return {
    sfx: num(s.sfx, d.sfx), bgm: num(s.bgm, d.bgm),
    vibe: typeof s.vibe === 'boolean' ? s.vibe : d.vibe, ghost: typeof s.ghost === 'boolean' ? s.ghost : d.ghost,
    pull: s.pullv === PULL_VER ? pullMode(s.pull) : d.pull,
    quality: s.quality === 'high' || s.quality === 'low' ? s.quality : 'auto',
  };
}
function readBest(id) {
  const b = store.get(KEYS.best + id);
  return validRecord(b) && b.ver === C.CONFIG.VER ? b : null;
}
function dailyBest() {
  const d = store.get(KEYS.daily);
  if (!validRecord(d) || d.date !== jstNow().date || d.layout !== layoutOfDate(d.date).id || d.ver !== C.CONFIG.VER) return null;
  return { tenths: d.tenths, throws: d.throws, log: d.log, ver: d.ver, date: d.date, layout: d.layout };
}
function webTitle() {
  web('onTitle', { dayKey: todayKey, layout: { id: todayL.id, name: todayL.name, day: todayL.day }, best: dailyBest() });
}
function applySettings() {
  ui.setSettings(settings);
  sfx.setVolume(settings);
}
function reloadStore() {
  storeDirty = false;
  const q = settings.quality;
  settings = loadSettings();
  applySettings();
  if (settings.quality !== q) stage.setQuality(settings.quality);
  plays = store.get(KEYS.plays, 0) | 0;
  refreshTitle();
}
function refreshTitle() {
  const b = readBest(todayL.id);
  ui.setTitle({
    day: todayL.day === jstNow().day ? dayChar(todayL) : '', layoutName: todayL.name, theme: todayL.theme,
    best: b ? b.tenths : null, medal: b ? medalFor(b.tenths, todayL.medals) : null,
    version: WEB ? '' : SITE.version,
  });
  const key = (l) => (Number.isInteger(l.day) ? (l.day + 6) % 7 : 7);
  const order = LAYOUTS.slice().sort((p, q) => key(p) - key(q));
  ui.setLayouts(order.map((l) => {
    const x = readBest(l.id);
    return { id: l.id, day: dayChar(l), name: l.name, theme: l.theme, best: x ? x.tenths : null, medal: x ? medalFor(x.tenths, l.medals) : null, today: l === todayL };
  }));
}
function useLayout(L) {
  if (!L || layout === L) return;
  layout = L;
  cats = (L.bodies || []).filter((b) => b.kind === 'cat').length;
  stage.setLayout(L);
}
let insetsNow = null;
function setInsets(v) { insetsNow = v; stage.setInsets(v); }
function applyInsets() {
  if (rp.on) { setInsets(rp.rec ? regionInsets() : ui.insets('replay')); return; }
  setInsets(phase === 'title' || phase === 'boot' ? ui.insets('title') : phase === 'result' ? ui.insets('result') : ui.insets());
}
function coachShow() {
  if (!coach || plays >= TUNE.coachPlays) return;
  const ins = ui.insets(), h = window.innerHeight || 0;
  const doorX = (layout.door.x1 + layout.door.x2) / 2, flip = doorX < layout.start.x - TUNE.coachFlipMm;
  coach.show((window.innerWidth || 0) / 2, (ins.top + (h - ins.bottom)) / 2, settings.pull === 'same', flip);
  coachOn = true;
  syncIdleHint();
  setAvoid(coach.rects());
}
function coachHide() {
  if (!coachOn) return;
  coachOn = false;
  coach.hide();
  syncIdleHint();
  setAvoid(null);
}
function syncIdleHint() { ui.idleHint(!coachOn && !aim.on); }
function setAvoid(list) { avoidNow = list; stage.setAvoid(list); }
function snapPrev(st, px, py) {
  const bs = st.bodies;
  for (let i = 0; i < bs.length && i < px.length; i++) { px[i] = bs[i].x; py[i] = bs[i].y; }
}
function resetRun() {
  hintT = -1;
  if (pull) pull.abort();
  endAim(false);
  coachHide();
  recDrop();
  rp.on = false;
  dropVideo();
  runId++;
  runDate = todayKey;
  state = C.createState(layout);
  snapPrev(state, prevX, prevY);
  acc = 0; timeScale = 1; endT = 0; endOutcome = null; kick = 0; queued = null;
  trail.n = 0; trailEvery = TUNE.trailEvery;
  smashReset();
  sel = FIRST;
  autoSelect();
  tampered = false; wantShot = false; shotDone = false; cleanAt = 0; sum = null; medalUp = false;
  freeCanvas(shot); shot = null;
  if (share) freeCanvas(share.card);
  share = null;
  if (thumb) { freeCanvas(staleThumb); staleThumb = thumb; thumb = null; }
  setupGhost();
  bodiesDirty = true;
  stage.fx('reset');
  syncInventory();
  syncHud();
}
function setupGhost() {
  ghost = null; ghostLog = null; ghostI = 0;
  if (!settings.ghost) return;
  const b = readBest(layout.id);
  if (!b || !Array.isArray(b.log) || !b.log.length) return;
  const key = layout.id + ':' + b.at + ':' + b.tenths + ':' + b.throws;
  if (ghostOk.key !== key) {
    ghostOk.key = key; ghostOk.ok = false;
    try { const s = C.simulate(layout, b.log); ghostOk.ok = !!(s && s.ok && s.outcome === 'out'); } catch (e) { note(e); }
  }
  if (!ghostOk.ok) return;
  ghostLog = b.log;
  ghost = C.createState(layout);
  gPrevX = ghost.bodies[0].x; gPrevY = ghost.bodies[0].y;
}
function syncInventory() {
  invArg.counts = state.inv; invArg.sel = sel;
  ui.setInventory(invArg);
}
function syncHud() {
  hudArg.tenths = tenthsLeft();
  hudArg.running = phase === 'play' || phase === 'ending' || phase === 'replay' || phase === 'replayEnd';
  hudArg.hot = hudArg.running && hudArg.tenths * 24 <= HOT_TICKS;
  ui.setHud(hudArg);
}
function autoSelect() {
  if (state.inv[sel] > 0) return;
  let best = -1;
  for (let i = 0; i < state.inv.length; i++) if (state.inv[i] > 0 && (best < 0 || C.ITEMS[i].g > C.ITEMS[best].g)) best = i;
  if (best >= 0) { sel = best; aim.item = -1; }
}
function select(i, byUser) {
  if (phase !== 'intro' && phase !== 'ready' && phase !== 'play') return false;
  if (paused || !(state.inv[i] > 0)) return false;
  sel = i; aim.item = -1;
  syncInventory();
  if (byUser) { sndSel.g = C.ITEMS[i].g; sfx.play('select', sndSel); }
  touched();
  return true;
}
function touched() {
  idleT = 0;
  if (!wakeIdle) return;
  wakeIdle = false;
  if (!paused && (phase === 'ready' || phase === 'play')) wakeOn();
}
function veil(on) {
  if (!canvas) return;
  if (on) canvas.setAttribute('data-veil', ''); else canvas.removeAttribute('data-veil');
}
function requestStart(L) {
  if (phase !== 'title') return;
  if (stageDead) { ui.screen('fail'); return; }
  if (dayChanged()) return;
  sfx.unlock();
  if (!store.get(KEYS.howto)) {
    store.set(KEYS.howto, 1);
    pendingStart = L || todayL;
    ui.screen('howto');
    return;
  }
  begin(L || todayL, false);
}
function begin(L, instant) {
  useLayout(L);
  resetRun();
  phase = 'intro';
  applyInsets();
  ui.screen('play');
  sfx.bgm('play');
  if (instant) { stage.setCamera('play', INSTANT); enterReady(); return; }
  const day = jstNow().date, full = store.get(KEYS.intro) !== day;
  introT = 0; introLen = full ? TUNE.introSec : TUNE.introFastSec;
  perf.introAt = performance.now();
  if (full) { sfx.play('alarm'); store.set(KEYS.intro, day); }
  stage.setCamera('intro', full ? undefined : FAST);
}
function enterReady() {
  if (phase === 'intro' && perf.introAt) { perf.intro = performance.now() - perf.introAt; perf.introAt = 0; }
  phase = 'ready';
  readyT = 0; idleT = 0;
  wakeIdle = false;
  syncInventory();
  coachShow();
  syncIdleHint();
  syncHud();
  wakeOn();
}
function retry() {
  if (phase !== 'ready' && phase !== 'play' && phase !== 'ending' && phase !== 'result') return;
  if (dayChanged()) return;
  const from = phase;
  if (paused) { paused = false; sfx.resume(); }
  veil(false);
  if (storeDirty) reloadStore();
  resetRun();
  ui.screen('play');
  ui.hint(null); hintT = -1;
  if (from === 'ending' || from === 'result') { setInsets(ui.insets()); stage.setCamera('intro', FAST); }
  enterReady();
  stillLeft = TUNE.retryStill;
}
function toTitle() {
  if (paused) { paused = false; sfx.resume(); }
  veil(false);
  wakeOff();
  phase = 'title';
  pickToday();
  useLayout(todayL);
  resetRun();
  reloadStore();
  applyInsets();
  stage.setCamera('title');
  ui.screen('title');
  sfx.bgm('title');
  webTitle();
}
function pause(byHide) {
  if (paused) return;
  if (phase === 'play' || (phase === 'ready' && !byHide)) {
    paused = true;
    veil(phase === 'play');
    if (pull) pull.abort();
    endAim(false);
    coachHide();
    syncHud();
    ui.screen('pause');
    sfx.pause();
    wakeOff();
    drawHold = 3;
  }
}
function resume() {
  if (!paused) return;
  paused = false;
  veil(false);
  ui.screen('play');
  if (phase === 'ready') coachShow();
  sfx.resume();
  wakeOn();
  last = -1;
}
function startAim(x, y) {
  if ((phase !== 'ready' && phase !== 'play') || paused || ui.screen() !== 'play') return false;
  autoSelect();
  if (!(state.inv[sel] > 0)) return false;
  touched();
  aim.on = true; aim.power = 0; aim.item = -1; aim.age = 0; aim.r = pullLen();
  aimF.n = 0; aimF.power = 0; aimF.dv = 0;
  readyT = 0;
  coachHide();
  syncIdleHint();
  view.show(x, y, aim.r, settings.pull === 'same');
  return true;
}
function endAim(thrown) {
  if (!aim.on) return;
  aim.on = false;
  syncIdleHint();
  f.aim = null;
  sfx.aim(0);
  if (view) view.hide(thrown);
}
function updateAim() {
  const st = pull.state, dx = st.x - st.x0, dy = st.y - st.y0, len = Math.hypot(dx, dy);
  let power = Math.round(len / aim.r * C.CONFIG.POWERS);
  if (power > C.CONFIG.POWERS) power = C.CONFIG.POWERS;
  let dir = aim.dir;
  if (len >= TUNE.aimDead) {
    let gx = dx, gy = dy;
    const a = stage.ground(st.x0, st.y0, gA), b = stage.ground(st.x, st.y, gB);
    if (a && b) {
      const ex = b.x - a.x, ey = b.y - a.y, el = ex * ex + ey * ey;
      if (el > 1e-10 && el < 1e6) { gx = ex; gy = ey; }
    }
    if (settings.pull === 'same') { gx = -gx; gy = -gy; }
    dir = C.dirOf(gx, gy);
  }
  const ok = power >= C.CONFIG.MIN_POWER;
  aim.age++;
  if (dir !== aim.dir || power !== aim.power || sel !== aim.item || (phase === 'play' && aim.age >= TUNE.repredict)) {
    aim.dir = dir; aim.power = power; aim.item = sel; aim.age = 0;
    aimF.dx = C.DIRX[dir] / 16384; aimF.dy = C.DIRY[dir] / 16384;
    aimF.power = power / C.CONFIG.POWERS;
    aimF.item = C.ITEMS[sel].id;
    aimF.inv = settings.pull === 'same';
    if (ok) {
      const n = C.predict(state, sel, dir, power, PREDICT_TICKS, TUNE.predictStride, predOut);
      const path = aimF.path;
      for (let i = 0; i < n * 2; i++) path[i] = predOut[i] * UM;
      aimF.n = n;
      aimF.dv = C.previewDv(state, sel, power) * VMS;
    } else { aimF.n = 0; aimF.dv = 0; }
  }
  f.aim = aimF;
  sfx.aim(power / C.CONFIG.POWERS);
  const k = len > aim.r ? aim.r / len : 1;
  view.update(dx * k, dy * k, aimF.power, ok);
  if (!ok) {
    const p = state.bodies[0], q = stage.project(p.x * UM, p.y * UM, TUNE.moreAbove, pA);
    view.more(!!q, q ? q.x : 0, q ? q.y : 0);
  } else view.more(false, 0, 0);
}
function releaseAim() {
  if (!aim.on) return;
  let thrown = false;
  if (phase === 'ready' || phase === 'play') {
    updateAim();
    if (aim.power >= C.CONFIG.MIN_POWER) thrown = doThrow(sel, aim.dir, aim.power);
  }
  endAim(thrown);
}
let hintT = -1, hintAt = null;
const pB = { x: 0, y: 0 };
function hintPlace() {
  const ins = insetsNow || ui.insets(), top = ins.top, bot = (window.innerHeight || 0) - ins.bottom, p = state.bodies[0];
  const q = stage.project(p.x * UM, p.y * UM, 0, pA);
  if (!q || !(bot > top)) return null;
  const heroY = q.y;
  if (heroY > top + (bot - top) * TUNE.hintUpper) return null;
  const d = stage.project((layout.door.x1 + layout.door.x2) / 2000, layout.h / 1000, 0, pB), doorY = d ? Math.min(d.y, bot) : bot;
  const lo = heroY + TUNE.hintClear, hi = doorY - TUNE.hintDoor;
  return lo <= hi ? Math.round(Math.max(lo, Math.min(hi, (heroY + doorY) / 2))) : null;
}
function hintFollow(dt) {
  if (hintT < 0) return;
  hintT += dt;
  if (hintT * 1000 >= TUNE.hintAfterMs) { hintT = -1; return; }
  const p = state.bodies[0], q = stage.project(p.x * UM, p.y * UM, 0, pA);
  if (!q) return;
  const at = hintAt == null ? (insetsNow ? insetsNow.top + 30 : 0) : hintAt;
  if (Math.abs(q.y - at) >= TUNE.hintClear) return;
  const next = hintPlace();
  if (next === hintAt) return;
  hintAt = next;
  ui.hint(HINTS.after, Math.max(1, TUNE.hintAfterMs - hintT * 1000), hintAt);
}
function doThrow(item, dir, power) {
  if (phase !== 'ready' && phase !== 'play') return false;
  if (!C.canThrow(state, item, dir, power)) {
    const lg = state.log;
    if (phase === 'play' && lg.length && lg[lg.length - 1][0] >= state.tick && state.inv[item] > 0 && power >= C.CONFIG.MIN_POWER) {
      queueBox.item = item; queueBox.dir = dir; queueBox.power = power; queued = queueBox;
      return true;
    }
    return false;
  }
  const first = phase === 'ready', n0 = state.events.length;
  preThrow();
  if (!C.throwItem(state, item, dir, power)) return false;
  throwEffects(item, dir, power, n0);
  if (!(fr.vibBlast > 0)) buzz('throw', power / C.CONFIG.POWERS);
  const p = state.bodies[0];
  if (first) {
    phase = 'play';
    acc = 0;
    coachHide();
    sfx.play('start');
    if (plays === 0) { hintT = 0; hintAt = hintPlace(); ui.hint(HINTS.after, TUNE.hintAfterMs, hintAt); } else ui.hint(null);
    plays++;
    store.set(KEYS.plays, plays);
    trail.pts[0] = p.x * UM; trail.pts[1] = p.y * UM; trail.n = 1;
  }
  autoSelect();
  syncInventory();
  syncHud();
  return true;
}
function throwEffects(item, dir, power, n0) {
  const evs = state.events;
  let ev = null, k = -1;
  for (let i = n0; i < evs.length; i++) if (evs[i].t === 'throw') ev = evs[i];
  if (!ev) for (let i = evs.length - 1; i >= 0 && !ev; i--) if (evs[i].t === 'throw') ev = evs[i];
  const b = state.bodies[ev.id], p = state.bodies[0];
  if (ev.id < prevX.length) { prevX[ev.id] = b.x; prevY[ev.id] = b.y; }
  bodiesDirty = true;
  fxThrow.id = ev.id; fxThrow.x = p.x * UM; fxThrow.y = p.y * UM;
  fxThrow.dx = C.DIRX[dir] / 16384; fxThrow.dy = C.DIRY[dir] / 16384; fxThrow.power = power / C.CONFIG.POWERS;
  syncBodies();
  stage.fx('throw', fxThrow);
  sndThrow.power = power / C.CONFIG.POWERS; sndThrow.g = C.ITEMS[item].g; sndThrow.pan = (p.x * UM) / (layout.w / 1000) * 2 - 1;
  sfx.play('throw', sndThrow);
  sndDash.power = clamp01(Math.hypot(p.vx - pre.vx, p.vy - pre.vy) * VMS / TUNE.dashFull);
  sfx.play('dash', sndDash);
  kick = 1;
  smashOpen(false);
  for (let i = n0; i < evs.length; i++) if (evs[i].t === 'blast') { const kb = onBlast(evs[i], 1); if (evs[i].src !== 'crash' && kb > k) k = kb; }
  throwPunch(k >= 0 ? k : throwK(item, power));
}
const pre = { vx: 0, vy: 0 }, sndDash = { power: 0 };
function preThrow() { const p = state.bodies[0]; pre.vx = p.vx; pre.vy = p.vy; }
function throwK(item, power) {
  const it = C.ITEMS[item];
  if (!it) return 0;
  const p = power / C.CONFIG.POWERS;
  return clamp01(BLAST_ITEMS ? ((it.blast && it.blast.v) || 0) * p / BLAST_V : it.g * p / G_MAX);
}
function throwPunch(k) {
  const big = clamp01((k - TUNE.blastBig) / (1 - TUNE.blastBig));
  slowStart(lerp(TUNE.throwSlowSec, TUNE.throwSlowBigSec, big));
  if (k >= TUNE.blastBig) stopNow(lerp(TUNE.blastStopMin, TUNE.blastStopMax, big));
}
function onBlast(e, gain) {
  if (!(e.v > 0) || !(e.r > 0)) return -1;
  const k = clamp01(e.v / BLAST_V), x = e.x * UM;
  fxBlast.x = x; fxBlast.y = e.y * UM; fxBlast.r = e.r * UM; fxBlast.power = k;
  fxBlast.src = e.src === 'crash' ? 'crash' : 'throw';
  fxBlast.item = typeof e.item === 'number' && C.ITEMS[e.item] ? C.ITEMS[e.item].id : typeof e.item === 'string' ? e.item : null;
  blastLog.n++; if (k > blastLog.max) blastLog.max = +k.toFixed(3);
  stage.fx('blast', fxBlast);
  sndBoom.power = k * gain; sndBoom.src = fxBlast.src; sndBoom.pan = x / (layout.w / 1000) * 2 - 1;
  sfx.play('boom', sndBoom);
  if (gain === 1 && !rp.on && k > fr.vibBlast) fr.vibBlast = k;
  return k;
}
const slow = { t: -1, hold: 0, back: 0, n: 0, real: 0, fresh: false };
const blastLog = { n: 0, max: 0, punch: 0, punchSec: 0 };
function slowReset() { slow.t = -1; slow.fresh = false; timeScale = 1; }
function slowStart(hold) {
  let back = TUNE.throwSlowBack;
  if (rp.recording) { hold *= TUNE.throwSlowRec; back *= TUNE.throwSlowRec; }
  else if (rp.on) { hold /= rp.speed; back /= rp.speed; }
  if (slow.t >= 0 && slow.t < slow.hold && slow.hold - slow.t >= hold) return;
  slow.t = 0; slow.hold = hold; slow.back = back; slow.n++; slow.fresh = true;
}
function slowNow() {
  if (slow.t < 0) return 1;
  if (slow.t <= slow.hold) return TUNE.throwSlow;
  const k = clamp01((slow.t - slow.hold) / slow.back);
  return lerp(TUNE.throwSlow, 1, k * k * (3 - 2 * k));
}
const smoothInt = (k) => k * k * k - k * k * k * k / 2;
function slowInt(a, b) {
  const s = TUNE.throwSlow, H = slow.hold, B = slow.back;
  let w = (Math.min(b, H) - Math.min(a, H)) * s;
  if (B > 0) { const k0 = clamp01((a - H) / B), k1 = clamp01((b - H) / B); w += B * (s * (k1 - k0) + (1 - s) * (smoothInt(k1) - smoothInt(k0))); }
  return w + Math.max(b, H + B) - Math.max(a, H + B);
}
function slowSpan(dt, live) {
  slow.fresh = false;
  if (slow.t < 0) { timeScale = 1; return live; }
  const b = slow.t + dt, w = slowInt(b - live, b);
  slow.t = b; slow.real += dt;
  if (b >= slow.hold + slow.back) slow.t = -1;
  timeScale = slowNow();
  return w;
}
function slowCatch() { if (slow.fresh) { slow.fresh = false; acc *= TUNE.throwSlow; timeScale = TUNE.throwSlow; } }
function stopNow(d) {
  if (phase !== 'play' && phase !== 'ready' && phase !== 'replay') return;
  if (phase === 'replay') d /= rp.speed;
  blastLog.punch++; blastLog.punchSec += d;
  if (d > stopT) stopT = d;
  if (stopGapT < TUNE.stopGap) stopGapT = TUNE.stopGap;
}
function pushTrail() {
  if (trail.n >= TUNE.trailMax) {
    const p = trail.pts;
    let w = 0;
    for (let i = 0; i < trail.n; i += 2) { p[w * 2] = p[i * 2]; p[w * 2 + 1] = p[i * 2 + 1]; w++; }
    trail.n = w; trailEvery *= 2;
  }
  const b = state.bodies[0];
  trail.pts[trail.n * 2] = b.x * UM; trail.pts[trail.n * 2 + 1] = b.y * UM; trail.n++;
}
function stepGhost() {
  while (ghostI < ghostLog.length && ghostLog[ghostI][0] <= ghost.tick) {
    const e = ghostLog[ghostI++];
    C.throwItem(ghost, e[1], e[2], e[3]);
  }
  gPrevX = ghost.bodies[0].x; gPrevY = ghost.bodies[0].y;
  C.step(ghost);
  if (ghost.over) ghost = null;
}
function stepOnce(quiet) {
  snapPrev(state, prevX, prevY);
  C.step(state);
  perf.steps++;
  if (state.tick % trailEvery === 0 || state.over) pushTrail();
  if (ghost) stepGhost();
  smashTick(quiet);
  if (state.events.length) handleEvents(state.events, quiet, 1);
  if (phase !== 'play') return;
  const left = LIMIT - state.tick;
  if (!quiet && left > 0 && left <= HOT_TICKS && left % 240 === 0) { sndTick.left = left / 240; sfx.play('tick', sndTick); }
  if (queued) { const q = queued; queued = null; doThrow(q.item, q.dir, q.power); }
}
const realG = (b) => (b.item >= 0 && C.ITEMS[b.item] ? C.ITEMS[b.item].g : b.g);
function handleEvents(evs, quiet, gain) {
  const bs = state.bodies, wM = layout.w / 1000;
  for (let i = 0; i < evs.length; i++) {
    const e = evs[i];
    if (e.t === 'hit') {
      if (quiet) continue;
      const A = bs[e.a], B = e.b >= 0 ? bs[e.b] : null, v = e.v * VMS;
      const heavy = (B ? Math.min(realG(A), realG(B)) : realG(A)) >= TUNE.heavyG;
      const soft = B ? !!(SOFT[A.kind] || SOFT[B.kind]) : !!SOFT[e.s];
      const x = e.x * UM, y = e.y * UM;
      if (v >= TUNE.hitFxMin && fr.fx < TUNE.hitFxMax) {
        fr.fx++;
        fxHit.x = x; fxHit.y = y; fxHit.v = v; fxHit.heavy = heavy; fxHit.id = e.a; fxHit.b = e.b;
        stage.fx('hit', fxHit);
      }
      if (v >= TUNE.hitSndMin) {
        const s = clamp01(v / (heavy ? TUNE.hitFull : TUNE.hitFullLight)) * gain;
        if (s > fr.hitV) { fr.hitV = s; fr.hitHeavy = heavy; fr.hitSoft = soft; fr.hitPan = x / wM * 2 - 1; }
      }
      if ((e.a === 0 || e.b === 0) && gain === 1 && !rp.on) { const k = clamp01(v / TUNE.vibHitFull); if (k > fr.vib) fr.vib = k; }
      if ((e.a === 0 || e.b === 0) && v >= TUNE.stopHitV) askStop((v - TUNE.stopHitV) / (TUNE.stopHitFull - TUNE.stopHitV), gain === 1 && !rp.on);
      crashOf(e.a, v, x, gain);
      if (B) crashOf(e.b, v, x, gain);
    } else if (e.t === 'cat') {
      if (quiet) continue;
      const cb = bs[e.id], s = clamp01(e.v * VMS / TUNE.hitFull) * gain;
      if (s > fr.meow) { fr.meow = s; fr.meowPan = cb ? (cb.x * UM) / wM * 2 - 1 : 0; }
      fxCat.id = e.id;
      stage.fx('cat', fxCat);
    } else if (e.t === 'out') {
      const ob = bs[e.id];
      bodiesDirty = true;
      if (quiet || !ob) continue;
      fxOut.id = e.id; fxOut.x = ob.x * UM; fxOut.y = Math.min(ob.y * UM, layout.h / 1000 + 1.5);
      stage.fx('out', fxOut);
    } else if (e.t === 'blast') {
      if (quiet) continue;
      const k = onBlast(e, gain);
      if (k >= 0 && e.src !== 'crash' && gain === 1) throwPunch(k);
    } else if (e.t === 'end') { if (phase === 'replay') replayEnded(e.outcome); else onEnd(e.outcome); }
  }
}
function flushFrame() {
  if (fr.hitV > 0) { sndHit.v = fr.hitV; sndHit.heavy = fr.hitHeavy; sndHit.soft = fr.hitSoft; sndHit.pan = fr.hitPan; sfx.play('hit', sndHit); }
  if (fr.crashN > 0) { sndCrash.v = fr.crashV; sndCrash.n = fr.crashN; sndCrash.mat = fr.crashMat; sndCrash.pan = fr.crashPan; sfx.play('crash', sndCrash); }
  if (fr.meow >= 0) { sndMeow.v = fr.meow; sndMeow.pan = fr.meowPan; sfx.play('meow', sndMeow); }
  if (fr.vibBlast > 0) buzz('blast', fr.vibBlast);
  else if (fr.vibStrike) buzz('strike', 1);
  else if (fr.vibHeavy > 0) buzz('heavy', fr.vibHeavy);
  else if (fr.vib > 0) buzz('hit', fr.vib);
  fr.hitV = 0; fr.meow = -1; fr.fx = 0; fr.vib = 0; fr.vibHeavy = 0; fr.vibStrike = false; fr.vibBlast = 0; fr.crashN = 0; fr.crashV = 0;
  fr.stamp++;
}
const sm = {
  mv: new Uint8Array(256),
  got: new Uint8Array(256),
  seen: new Uint32Array(256),
  total: 0, best: 0,
  strikes: 0, combos: 0, last: null,
  open: false, t0: 0, tl: 0, n: 0, sx: 0, sy: 0,
};
const SMASH_GO2 = (TUNE.smashV / VMS) ** 2, SMASH_STILL2 = (TUNE.stillV / VMS) ** 2;
const SMASH_WIN = Math.round(TUNE.smashWinSec * 240), SMASH_QUIET = Math.round(TUNE.smashQuietSec * 240);
const MAT = {
  book: 'paper', books: 'paper', manga: 'paper', magazine: 'paper', notebook: 'paper', newspaper: 'paper', paper: 'paper',
  cushion: 'soft', pillow: 'soft', makura: 'soft', plush: 'soft', nuigurumi: 'soft', teddy: 'soft', doll: 'soft', towel: 'soft',
  shoe: 'soft', slipper: 'soft', sneaker: 'soft', loafer: 'soft',
  bottle: 'plastic', pet: 'plastic', toy: 'plastic', basket: 'plastic', kago: 'plastic', ball: 'plastic', bucket: 'plastic', cup: 'plastic', can: 'plastic', robot: 'plastic', boot: 'plastic',
  chair: 'wood', box: 'wood', stool: 'wood', block: 'wood', tsumiki: 'wood', geta: 'wood',
};
let stopT = 0, stopGapT = 0, stopReq = 0, stopVib = 0;
const stopLog = { n: 0, sec: 0 };
function smashReset() {
  sm.mv.fill(0); sm.got.fill(0);
  sm.total = 0; sm.best = 0; sm.strikes = 0; sm.combos = 0; sm.last = null; sm.open = false; sm.n = 0;
  stopT = 0; stopGapT = 0; stopReq = 0; stopVib = 0; stopLog.n = 0; stopLog.sec = 0;
  slowReset(); slow.n = 0; slow.real = 0;
  blastLog.n = 0; blastLog.max = 0; blastLog.punch = 0; blastLog.punchSec = 0;
}
function smashOpen(quiet) {
  if (sm.open) smashClose(quiet);
  sm.open = true; sm.t0 = state.tick; sm.tl = state.tick; sm.n = 0; sm.sx = 0; sm.sy = 0;
}
function smashClose(quiet) {
  if (!sm.open) return;
  sm.open = false;
  const n = sm.n;
  if (n > sm.best) sm.best = n;
  if (n < TUNE.comboN) return;
  fxStrike.n = n; fxStrike.x = sm.sx / n * UM; fxStrike.y = sm.sy / n * UM;
  sm.last = { n, x: +fxStrike.x.toFixed(2), y: +fxStrike.y.toFixed(2), tick: state.tick };
  if (n >= TUNE.strikeN) sm.strikes++; else sm.combos++;
  if (quiet) return;
  if (n >= TUNE.strikeN) {
    stage.fx('strike', fxStrike);
    sndStrike.n = n; sfx.play('strike', sndStrike);
    if (!rp.on) fr.vibStrike = true;
  } else stage.fx('combo', fxStrike);
}
function smashTick(quiet) {
  const bs = state.bodies, mv = sm.mv, got = sm.got;
  let fresh = 0;
  for (let i = 1; i < bs.length && i < mv.length; i++) {
    const b = bs[i];
    if (!b.alive || b.item >= 0 || b.kind === 'cat') continue;
    const v2 = b.vx * b.vx + b.vy * b.vy;
    if (mv[i]) { if (v2 < SMASH_STILL2) mv[i] = 0; continue; }
    if (v2 <= SMASH_GO2) continue;
    mv[i] = 1; fresh++;
    if (!got[i]) { got[i] = 1; sm.total++; }
    if (sm.open) { sm.n++; sm.sx += b.x; sm.sy += b.y; sm.tl = state.tick; }
  }
  if (fresh >= TUNE.stopPins && !quiet) askStop((fresh - TUNE.stopPins) / (TUNE.stopPinsFull - TUNE.stopPins), false);
  if (sm.open && (state.tick - sm.t0 >= SMASH_WIN || (sm.n > 0 && state.tick - sm.tl >= SMASH_QUIET))) smashClose(quiet);
}
function askStop(k, vib) {
  const d = lerp(TUNE.stopMin, TUNE.stopMax, clamp01(k));
  if (d > stopReq) stopReq = d;
  if (vib && clamp01(k) + 0.01 > stopVib) stopVib = clamp01(k) + 0.01;
}
function takeStop() {
  const d = stopReq, k = stopVib;
  stopReq = 0; stopVib = 0;
  if (!(d > 0) || stopGapT > 0 || (phase !== 'play' && phase !== 'replay')) return false;
  stopT = phase === 'replay' ? d / rp.speed : d;
  stopGapT = TUNE.stopGap;
  stopLog.n++; stopLog.sec += stopT;
  if (k > 0 && !rp.on) fr.vibHeavy = Math.max(fr.vibHeavy, k);
  return true;
}
function eatStop(dt) {
  if (stopGapT > 0) stopGapT -= dt;
  if (stopT <= 0) return dt;
  const u = Math.min(stopT, dt);
  stopT -= u;
  return dt - u;
}
function crashOf(i, v, x, gain) {
  const b = state.bodies[i];
  if (!b || i === 0 || b.item >= 0 || b.kind === 'cat' || b.g > TUNE.pinG || v < TUNE.crashMin || i >= sm.seen.length) return;
  if (sm.seen[i] === fr.stamp) return;
  sm.seen[i] = fr.stamp;
  fr.crashN++;
  const s = clamp01(v / TUNE.crashFull) * gain;
  if (s > fr.crashV) {
    const src = layout.bodies && layout.bodies[i - 1];
    fr.crashV = s; fr.crashMat = (src && MAT[src.variant]) || MAT[b.kind] || 'plastic'; fr.crashPan = x / (layout.w / 1000) * 2 - 1;
  }
}
function onEnd(outcome) {
  if (phase !== 'play') return;
  phase = 'ending';
  endT = 0; endOutcome = outcome;
  perf.endAt = performance.now();
  if (pull) pull.abort();
  endAim(false);
  ghost = null;
  smashClose(false);
  stopT = 0; stopReq = 0; slowReset();
  sum = C.summary(state);
  endLog = state.log.map((e) => e.slice());
  resultDelay = outcome === 'out' ? TUNE.resultOut : TUNE.resultFail;
  ui.hint(null); hintT = -1;
  syncHud();
  ui.quiet(true);
  if (outcome === 'out') {
    sfx.play('goal');
    stage.fx('goal');
    stage.setCamera('finish');
    buzz('goal', 1);
  } else {
    sfx.play(outcome);
    stage.fx(outcome);
  }
  lastR = makeResult();
  lastRun = {
    outcome, tenths: sum.tenths, ticks: sum.ticks, throws: sum.throws, log: endLog.map((e) => e.slice()),
    layout: layout.id, date: runDate, ver: C.CONFIG.VER, official: officialRun, newBest: dailyNew,
  };
  web('onRun', lastRun);
}
function makeResult() {
  const practice = layout !== layoutOfDate(runDate), ok = sum.outcome === 'out';
  officialRun = !practice && !tampered && !DEBUG_URL;
  const prev = readBest(layout.id);
  const rec = { tenths: sum.tenths, throws: sum.throws, log: endLog, ver: C.CONFIG.VER, at: Date.now() };
  const rank = { bronze: 1, silver: 2, gold: 3 };
  let newBest = false, best = prev ? prev.tenths : null, medal = null;
  dailyNew = false;
  if (ok) {
    medal = medalFor(sum.tenths, layout.medals);
    if (better(rec, prev)) { newBest = true; best = rec.tenths; store.set(KEYS.best + layout.id, rec); ghostOk.key = ''; }
    medalUp = (rank[medal] || 0) > (prev ? rank[medalFor(prev.tenths, layout.medals)] || 0 : 0);
    if (officialRun) {
      const date = runDate, d = store.get(KEYS.daily);
      const stale = !validRecord(d) || typeof d.date !== 'string' || d.date < date || (d.date === date && (d.layout !== layout.id || d.ver !== rec.ver));
      if (stale || (d.date === date && better(rec, d))) {
        store.set(KEYS.daily, { date, layout: layout.id, tenths: rec.tenths, throws: rec.throws, log: rec.log, ver: rec.ver });
        dailyNew = true;
      }
    }
  }
  const r = {
    outcome: sum.outcome, tenths: sum.tenths, throws: sum.throws, best, newBest, medal, medalTimes: layout.medals || null,
    dist: sum.distDoor / 1000, catDist: sum.catDist / 1000, catOut: sum.catOut, cats, randoLeft: sum.randoLeft,
    thrown: sum.thrown, day: dayChar(layout), layoutName: layout.name, practice, image: null, shareText: '',
    smashed: sm.total, smashBest: sm.best,
  };
  r.shareText = shareText(r, shareUrl());
  return r;
}
function showResult() {
  if (phase !== 'ending') return;
  phase = 'result';
  resultAt = f.t;
  perf.result = performance.now() - perf.endAt;
  wakeOff();
  if (!shotDone) takeQuickShot();
  cleanAt = frames + 2;
  const r = lastR;
  r.image = thumb;
  ui.showResult(r);
  web('onResultShown', document.getElementById('web-result'), lastRun);
  applyInsets();
  stage.setCamera('result');
  if (r.newBest) sfx.play('newbest');
  if (medalUp && r.medal) {
    const id = runId;
    sndMedal.medal = r.medal;
    if (r.newBest) setTimeout(() => { if (id === runId && phase === 'result') sfx.play('medal', sndMedal); }, TUNE.newbestGap);
    else sfx.play('medal', sndMedal);
  }
  if (storeDirty) reloadStore();
}
function setShot(pic) {
  if (shot !== pic) freeCanvas(shot);
  shot = pic;
  freeCanvas(staleThumb); staleThumb = null;
  try { thumb = makeThumb(pic, thumb); } catch (e) { note(e); }
}
function takeQuickShot() {
  shotDone = true;
  let n = 0;
  for (; n < fBodies.length; n++) {
    const s = fBodies[n];
    let o = shotPool[n];
    if (!o) o = shotPool[n] = { id: 0, x: 0, y: 0, vx: 0, vy: 0 };
    o.id = s.id; o.x = s.x; o.y = s.y; o.vx = s.vx; o.vy = s.vy;
    shotBodies[n] = o;
  }
  shotBodies.length = n;
  const t0 = performance.now();
  let pic = null;
  const cv = stage.snapshot();
  if (cv && cv.width > 1) { pic = cropFromScreen(cv); freeCanvas(cv); }
  if (!pic) { try { pic = planShot(layout, trail); } catch (e) { note(e); } }
  perf.shot = performance.now() - t0;
  perf.tag = 'quick' + perf.shot.toFixed(0);
  if (pic) setShot(pic);
  if (cleanOk === false) buildCard(runId);
}
function takeCleanShot() {
  const id = runId, t0 = performance.now();
  if (cleanOk !== false && shotBodies.length) {
    const dt0 = f.dt;
    f.bodies = shotBodies; f.dt = 0; f.aim = null; f.ghost = null;
    stage.update(f);
    const cv = stage.snapshot(SHOT_OPTS);
    f.bodies = fBodies; f.dt = dt0;
    if (cv && cv.width === CARD.shotW && cv.height === CARD.shotH) { cleanOk = true; setShot(cv); } else { cleanOk = false; freeCanvas(cv); }
    perf.clean = performance.now() - t0;
    perf.tag = 'clean' + perf.clean.toFixed(0);
  }
  buildCard(id);
}
function cropFromScreen(cv) {
  try {
    const rect = canvas.getBoundingClientRect(), k = cv.width / (rect.width || 1);
    const W = layout.w / 1000, H = layout.h / 1000, s = CARD.cropSide, n = CARD.cropNorth, so = CARD.cropSouth;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const pts = [[-s, -n, 0.5], [W + s, -n, 0.5], [-s, -n, 0], [W + s, -n, 0], [-s, H + so, 0], [W + s, H + so, 0]];
    for (const p of pts) {
      const q = stage.project(p[0], p[1], p[2], pA);
      if (!q) return null;
      x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y);
    }
    return cropShot(cv, { x: (x0 - rect.left) * k, y: (y0 - rect.top) * k, w: (x1 - x0) * k, h: (y1 - y0) * k });
  } catch (e) { note(e); return null; }
}
async function buildCard(id) {
  try {
    await new Promise((res) => setTimeout(res, 80));
    await fontsReady();
    if (id !== runId || !lastR) return;
    const t0 = performance.now();
    const card = composeCard({ shot, r: lastR, icons: iconMap });
    perf.card = performance.now() - t0;
    const blob = await toBlob(card);
    if (id !== runId) { freeCanvas(card); return; }
    if (share) freeCanvas(share.card);
    let file = null;
    try { if (blob && typeof File === 'function') file = new File([blob], 'masatsu-zero-no-asa.png', { type: 'image/png' }); } catch (e) { file = null; }
    share = { run: id, card, blob, file };
  } catch (e) { note(e); }
}
function replayOpen() {
  if (phase !== 'result' || !sum || !lastR || !Array.isArray(endLog) || !endLog.length) return;
  rp.pick = sum.ticks > LIMIT * TUNE.replayAuto2xFrac ? 2 : 1;
  ui.setReplay({ mode: 'watch', speed: rp.pick, label: rp.pick > 1 ? rp.pick + '×' : '', canRecord: !!videoSupport(false), view: null, chip: '' });
  ui.screen('replay');
  replayBegin(false);
}
function regionInsets() {
  const h = window.innerHeight || 0, rg = rp.region = videoRegion(window.innerWidth || 0, h);
  return { top: Math.round(rg.y), bottom: Math.round(h - rg.y - rg.h) };
}
function replayBegin(record) {
  rp.on = true; rp.recording = record;
  rp.i = 0; rp.t = 0; rp.cardT = -1; rp.cap = -1; rp.capT = 9; rp.began = false; rp.left = -1;
  const secs = sum.ticks / 240;
  rp.extra = record ? slowExtra(endLog) : 0;
  rp.speed = record ? videoSpeed(secs, sum.outcome) : rp.pick;
  if (record && rp.speed > 1) rp.speed = videoSpeed(secs + rp.extra * rp.speed, sum.outcome);
  rp.lead = record ? VIDEO.lead : TUNE.replayLead;
  const body = VIDEO.lead + secs / rp.speed + rp.extra, end = sum.outcome === 'out' ? VIDEO.endOut : VIDEO.endFail;
  rp.total = body + Math.max(end, VIDEO.min - VIDEO.card - body) + VIDEO.card;
  state = C.createState(layout);
  snapPrev(state, prevX, prevY);
  acc = 0; timeScale = 1; endT = 0; endOutcome = null; kick = 0; queued = null; ghost = null;
  trail.n = 0; trailEvery = TUNE.trailEvery;
  smashReset();
  bodiesDirty = true;
  stage.fx('reset');
  view.note(null);
  ui.quiet(false);
  phase = 'replay';
  if (record) {
    setInsets(regionInsets());
    stage.setCamera('play', INSTANT);
  } else {
    setInsets(ui.insets('replay'));
    stage.setCamera('intro', FAST);
  }
  syncHud();
  wakeOn();
}
function slowExtra(log) {
  let e = 0;
  for (const x of log || []) {
    const big = clamp01((throwK(x[1], x[3]) - TUNE.blastBig) / (1 - TUNE.blastBig));
    e += (1 - TUNE.throwSlow) * TUNE.throwSlowRec * (lerp(TUNE.throwSlowSec, TUNE.throwSlowBigSec, big) + TUNE.throwSlowBack / 2);
  }
  return e;
}
function replayStep() {
  while (rp.i < endLog.length && endLog[rp.i][0] <= state.tick && !state.over) {
    const e = endLog[rp.i++], n0 = state.events.length;
    preThrow();
    if (!C.throwItem(state, e[1], e[2], e[3])) continue;
    throwEffects(e[1], e[2], e[3], n0);
    const p = state.bodies[0];
    if (rp.i === 1) { sfx.play('start'); trail.pts[0] = p.x * UM; trail.pts[1] = p.y * UM; trail.n = 1; }
    rp.cap = e[1]; rp.capT = 0;
    if (!rp.recording) { const q = stage.project(p.x * UM, p.y * UM, TUNE.moreAbove, pA); if (q) view.note(C.ITEMS[e[1]].name, q.x, q.y); }
  }
  snapPrev(state, prevX, prevY);
  C.step(state);
  if (state.tick % trailEvery === 0 || state.over) pushTrail();
  smashTick(false);
  if (state.events.length) handleEvents(state.events, false, 1);
  if (phase !== 'replay') return;
  const left = LIMIT - state.tick;
  if (left > 0 && left <= HOT_TICKS && left % 240 === 0) { sndTick.left = left / 240; sfx.play('tick', sndTick); }
}
function replayEnded(outcome) {
  smashClose(false);
  stopT = 0; stopReq = 0; slowReset();
  phase = 'replayEnd';
  endT = 0; endOutcome = outcome;
  const end = rp.recording ? (outcome === 'out' ? VIDEO.endOut : VIDEO.endFail) : (outcome === 'out' ? TUNE.resultOut : TUNE.resultFail);
  resultDelay = Math.max(end, (rp.recording ? VIDEO.min - VIDEO.card : TUNE.replayMinSec) - rp.t);
  if (outcome === 'out') { sfx.play('goal'); stage.fx('goal'); stage.setCamera('finish'); } else { sfx.play(outcome); stage.fx(outcome); }
  if (!rp.recording) ui.quiet(true);
}
function replayExit() {
  if (!rp.on) return;
  recDrop();
  if (!state.over) {
    let guard = LIMIT + 8;
    while (!state.over && guard-- > 0) {
      while (rp.i < endLog.length && endLog[rp.i][0] <= state.tick) { const e = endLog[rp.i++]; C.throwItem(state, e[1], e[2], e[3]); }
      C.step(state);
      if (trail.n === 0 || state.tick % trailEvery === 0 || state.over) pushTrail();
    }
    snapPrev(state, prevX, prevY);
    acc = STEP; endT = 0; endOutcome = state.outcome; bodiesDirty = true;
    stage.fx('reset');
  }
  rp.on = false; slowReset();
  view.note(null);
  phase = 'result';
  ui.setReplay({ view: null });
  ui.showResult(lastR);
  applyInsets();
  stage.setCamera('result');
  wakeOff();
}
function replayBack() {
  if (!rp.on) return;
  if (rp.recording) recordStop(false); else replayExit();
}
function replaySpeed(v) {
  if (v !== 1 && v !== 2 && v !== 4) return;
  rp.pick = v;
  if (!rp.recording) rp.speed = v;
  ui.setReplay({ label: v > 1 ? v + '×' : '' });
}
function recDrop() {
  if (rp.rec) { rp.rec.abort(); rp.rec = null; sfx.untap(); }
  rp.recording = false;
  freeCanvas(rp.card); rp.card = null;
}
function dropVideo() {
  const v = rp.video;
  rp.video = null;
  if (!v) return;
  try { v.el.pause(); v.el.removeAttribute('src'); v.el.load(); } catch (e) {   }
  try { URL.revokeObjectURL(v.url); } catch (e) {   }
}
function recordStart() {
  if (!rp.on || rp.recording || rp.rec) return;
  const tap = sfx.tap() || null, fa = tap ? videoSupport(true) : null, fmt = fa || videoSupport(false);
  if (!fmt) { ui.setReplay({ canRecord: false }); return; }
  dropVideo();
  const st = stage.stats();
  try { rp.card = composeCardTall({ shot, r: lastR, icons: iconMap }); } catch (e) { note(e); rp.card = null; }
  try { rp.rec = createVideo({ low: !!st && st.quality !== 'high', audio: fa ? tap : null, format: fmt, icons: iconMap }); } catch (e) { note(e); rp.rec = null; }
  if (!rp.rec) { recordFail(); return; }
  ui.setReplay({ mode: 'rec', view: rp.rec.canvas, chip: '録画中' });
  replayBegin(true);
}
function recFrame() {
  const rec = rp.rec, rg = rp.region, k = canvas.width / (canvas.clientWidth || window.innerWidth || 1);
  vf.src = canvas; vf.sx = rg.x * k; vf.sy = rg.y * k; vf.sw = rg.w * k; vf.sh = rg.h * k;
  vf.tenths = Math.floor(state.tick / 24);
  vf.speed = rp.speed;
  const c = vf.cap;
  if (rp.cap >= 0 && rp.capT < VIDEO.capSec) {
    const it = C.ITEMS[rp.cap];
    c.icon = iconMap ? iconMap[it.id] : null; c.name = it.name;
    c.a = clamp01(rp.capT / 0.12) * clamp01((VIDEO.capSec - rp.capT) / 0.25);
  } else c.a = 0;
  vf.card = rp.card; vf.cardA = rp.cardT < 0 ? 0 : clamp01(rp.cardT / VIDEO.cardFade);
  rec.frame(vf);
  if (!rp.began) { rp.began = rec.begin(); if (!rp.began) { recordFail(); return; } }
  const left = Math.max(0, Math.ceil(rp.total - rp.t));
  if (left !== rp.left) { rp.left = left; ui.setReplay({ chip: '録画中　のこり 約 ' + left + ' 秒' }); }
}
function recordFinish() {
  const rec = rp.rec;
  if (!rec) return;
  rp.recording = false;
  phase = 'replayDone';
  wakeOff();
  ui.setReplay({ chip: 'しあげ中…' });
  rec.finish().then((v) => {
    if (rp.rec !== rec) return;
    rp.rec = null;
    sfx.untap();
    rec.dispose();
    freeCanvas(rp.card); rp.card = null;
    if (!v || !rp.on) { recordFail(); return; }
    const name = 'masatsu-zero-' + (sum.outcome === 'out' ? sum.tenths : sum.outcome) + '.' + v.ext;
    let file = null, can = false;
    try { if (typeof File === 'function') file = new File([v.blob], name, { type: v.type }); } catch (e) { file = null; }
    try { can = !!(file && typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })); } catch (e) { can = false; }
    const url = URL.createObjectURL(v.blob), el = document.createElement('video');
    el.muted = true; el.loop = true; el.playsInline = true; el.setAttribute('playsinline', ''); el.setAttribute('aria-label', 'できた動画');
    el.src = url;
    el.addEventListener('click', () => { el.muted = !el.muted; });
    rp.video = { blob: v.blob, url, file, name, type: v.type, ext: v.ext, ms: v.ms, el };
    ui.setReplay({ mode: 'done', view: el, canShare: can, chip: 'できた！ ' + (Math.round(v.ms / 100) / 10) + ' 秒' });
    try { const p = el.play(); if (p && typeof p.then === 'function') p.then(null, () => {}); } catch (e) {   }
  }, (e) => { note(e); if (rp.rec === rec) { rp.rec = null; recordFail(); } });
}
function recordStop(byHide) {
  if (!rp.on) return;
  recDrop();
  if (byHide) rp.hidden = true;
  ui.setReplay({ mode: 'watch', view: null });
  replayBegin(false);
}
function recordFail() {
  recDrop();
  sfx.untap();
  ui.toast('動画にできませんでした');
  if (!rp.on) return;
  ui.setReplay({ mode: 'watch', view: null });
  replayBegin(false);
}
function videoShare() {
  const v = rp.video, nav = navigator;
  if (!v || sharing) return;
  let ok = false;
  try { ok = !!(v.file && typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare({ files: [v.file] })); } catch (e) { ok = false; }
  if (!ok) { videoSave(); return; }
  let p;
  try { p = nav.share({ files: [v.file], text: lastR ? lastR.shareText : '' }); } catch (e) { p = Promise.reject(e); }
  sharing = true;
  Promise.resolve(p).then(() => { sharing = false; }, (e) => { sharing = false; if (!quietShareError(e)) videoSave(); });
}
function videoSave() {
  const v = rp.video;
  if (!v) return;
  try {
    const a = document.createElement('a');
    a.href = v.url; a.download = v.name; a.rel = 'noopener'; a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
  } catch (e) { note(e); }
}
function openUrl(url) {
  try {
    const w = window.open(url, '_blank');
    if (w) { try { w.opener = null; } catch (e) {   } } else location.href = url;
  } catch (e) { note(e); }
}
function openIntent(text) { openUrl('https://x.com/intent/post?text=' + encodeURIComponent(text)); }
function quietShareError(e) { return !!e && (e.name === 'AbortError' || e.name === 'InvalidStateError' || e.name === 'NotAllowedError'); }
let sharing = false;
function onShare() {
  const r = lastR;
  if (!r || sharing) return;
  const text = r.shareText, nav = navigator;
  if (typeof nav.share !== 'function') { openIntent(text); return; }
  const data = { text };
  const s = share;
  if (s && s.run === runId && s.file && typeof nav.canShare === 'function') {
    try { if (nav.canShare({ files: [s.file] })) data.files = [s.file]; } catch (e) {   }
  }
  let p;
  try { p = nav.share(data); } catch (e) { p = Promise.reject(e); }
  sharing = true;
  Promise.resolve(p).then(() => { sharing = false; }, (e) => {
    sharing = false;
    if (!quietShareError(e)) openIntent(text);
  });
}
function onRanking() {
  if (WEB && typeof WEB.openRanking === 'function') web('openRanking', { from: ui.screen() === 'result' ? 'result' : 'title' });
  else ui.toast('ランキングは公開版で開きます');
}
function buzz(kind, k) {
  if (!settings.vibe) return;
  if (WEB && typeof WEB.haptic === 'function') { web('haptic', { kind, k }); return; }
  const nav = navigator;
  if (typeof nav.vibrate !== 'function' || !(nav.userActivation && nav.userActivation.hasBeenActive)) return;
  try {
    if (kind === 'throw') nav.vibrate(Math.round(lerp(TUNE.vibThrow[0], TUNE.vibThrow[1], k)));
    else if (kind === 'hit') nav.vibrate(Math.round(lerp(TUNE.vibHit[0], TUNE.vibHit[1], k)));
    else if (kind === 'heavy') nav.vibrate(Math.round(lerp(TUNE.vibHeavy[0], TUNE.vibHeavy[1], k)));
    else if (kind === 'strike') nav.vibrate(TUNE.vibStrike);
    else if (kind === 'blast') nav.vibrate([Math.round(lerp(TUNE.vibBlast[0], TUNE.vibBlast[1], k))].concat(TUNE.vibBlastTail));
    else nav.vibrate(TUNE.vibGoal);
  } catch (e) {   }
}
let wake = null, wakeWant = false;
function wakeOn() {
  wakeWant = true;
  const wl = navigator.wakeLock;
  if (wake || !wl || typeof wl.request !== 'function' || document.visibilityState !== 'visible') return;
  try {
    wl.request('screen').then((w) => {
      if (!wakeWant || wake) { try { w.release().then(null, () => {}); } catch (e) {   } return; }
      wake = w;
      w.addEventListener('release', () => { if (wake === w) wake = null; });
    }, () => {});
  } catch (e) {   }
}
function wakeOff() {
  wakeWant = false;
  const w = wake;
  wake = null;
  if (w) { try { w.release().then(null, () => {}); } catch (e) {   } }
}
let volumeAt = 0;
function setSetting(k, v) {
  if (!(k in DEFAULT_SETTINGS)) return;
  settings[k] = v;
  store.set(KEYS.settings, { ...settings, pullv: PULL_VER });
  if (k === 'sfx' || k === 'bgm') {
    sfx.setVolume(settings);
    const now = performance.now();
    if (k === 'sfx' && now - volumeAt > TUNE.volumeTick) { volumeAt = now; sfx.play('ui'); }
  } else if (k === 'quality') { stage.setQuality(v); drawHold = 3; }
  else if (k === 'ghost') { if (!v) ghost = null; else if (phase === 'ready') setupGhost(); }
  else if (k === 'vibe' && v) buzz('throw', 0.5);
  else if (k === 'pull' && coachOn) coachShow();
}
function syncBodies() {
  if (!bodiesDirty) return;
  bodiesDirty = false;
  const bs = state.bodies, lb = layout.bodies || [];
  defs.length = 0;
  for (let i = 0; i < bs.length; i++) {
    const b = bs[i];
    if (!b.alive) continue;
    const src = b.item < 0 && i > 0 ? lb[i - 1] : null;
    defs.push({ id: b.id, kind: b.kind, variant: src ? src.variant : undefined, item: b.item, r: b.r * UM });
  }
  stage.setBodies(defs);
}
function fillBodies(alpha) {
  const bs = state.bodies;
  let n = 0;
  for (let i = 0; i < bs.length; i++) {
    const b = bs[i];
    if (!b.alive) continue;
    let o = pool[n];
    if (!o) o = pool[n] = { id: 0, x: 0, y: 0, vx: 0, vy: 0 };
    const px = i < prevX.length ? prevX[i] : b.x, py = i < prevY.length ? prevY[i] : b.y;
    o.id = b.id;
    o.x = (px + (b.x - px) * alpha) * UM; o.y = (py + (b.y - py) * alpha) * UM;
    o.vx = b.vx * VMS; o.vy = b.vy * VMS;
    fBodies[n++] = o;
  }
  fBodies.length = n;
}
function advance(dt) {
  if (kick > 0) { kick -= dt / TUNE.kickSec; if (kick < 0) kick = 0; }
  if (phase === 'intro') {
    introT += dt;
    if (introT >= introLen) enterReady();
  } else if (phase === 'ready') {
    if (aim.on) updateAim();
    else if (!coachOn && plays < TUNE.coachPlays) {
      readyT += dt;
      if (readyT >= TUNE.coachIdleSec) coachShow();
    }
    idleT += dt;
    if (!wakeIdle && idleT >= TUNE.wakeIdleSec) { wakeIdle = true; wakeOff(); }
  } else if (phase === 'play') {
    acc += slowSpan(dt, eatStop(dt));
    let n = 0;
    while (acc >= STEP && n < TUNE.stepsCap && phase === 'play') {
      stepOnce(false); acc -= STEP; n++;
      slowCatch();
      if (stopReq > 0 && takeStop()) break;
    }
    if (n >= TUNE.stepsCap && acc >= STEP) acc -= Math.floor(acc / STEP) * STEP;
    if (phase === 'play' && aim.on) updateAim();
    if (phase === 'play') hintFollow(dt);
  } else if (phase === 'replay') {
    rp.t += dt; rp.capT += dt;
    if (rp.lead > 0) rp.lead -= dt;
    else {
      acc += slowSpan(dt, eatStop(dt)) * rp.speed;
      let n = 0;
      const lim = rp.recording ? TUNE.recStepsCap : TUNE.stepsCap;
      while (acc >= STEP && n < lim && phase === 'replay') {
        replayStep(); acc -= STEP; n++;
        slowCatch();
        if (stopReq > 0 && takeStop()) break;
      }
      if (n >= lim && acc >= STEP) acc -= Math.floor(acc / STEP) * STEP;
    }
  } else if (phase === 'ending' || phase === 'result' || phase === 'replayEnd') {
    endT += dt;
    if (phase === 'replayEnd') { rp.t += dt; rp.capT += dt; }
    if (endOutcome === 'out') {
      const k = clamp01((endT - TUNE.slowHold) / TUNE.slowBack);
      timeScale = lerp(TUNE.slow, 1, k * k * (3 - 2 * k));
    } else timeScale = 1;
    if (typeof C.stepAfter === 'function' && endT < TUNE.afterSec) {
      acc += dt * timeScale;
      let n = 0;
      const quiet = phase === 'result';
      while (acc >= STEP && n < TUNE.stepsCap) {
        snapPrev(state, prevX, prevY);
        C.stepAfter(state);
        if (state.events.length) handleEvents(state.events, quiet, TUNE.afterGain);
        acc -= STEP; n++;
      }
      if (n >= TUNE.stepsCap && acc >= STEP) acc -= Math.floor(acc / STEP) * STEP;
    } else acc = STEP;
    stopReq = 0; stopVib = 0; stopT = 0;
    if (phase === 'ending') {
      if (!shotDone && endT >= TUNE.shotAt) wantShot = true;
      if (endT >= resultDelay) showResult();
    } else if (phase === 'replayEnd') {
      if (!rp.recording) { if (endT >= resultDelay) replayExit(); }
      else if (rp.cardT < 0) { if (endT >= resultDelay) rp.cardT = 0; }
      else { rp.cardT += dt; if (rp.cardT >= VIDEO.card) recordFinish(); }
    }
  }
  flushFrame();
}
function draw(dt) {
  perf.draws++;
  const alpha = acc >= STEP ? 1 : acc / STEP;
  syncBodies();
  fillBodies(alpha);
  const p = state.bodies[0], sp = C.speed(p);
  f.t += dt; f.dt = stopT > 0 ? 0 : dt * timeScale;
  if (stillLeft > 0) { if (phase === 'ready') { stillLeft--; f.dt = 0; } else stillLeft = 0; }
  f.phase = PHASE_F[phase];
  f.player.rando = RANDO >= 0 && state.inv[RANDO] > 0;
  f.player.kick = kick;
  f.player.mood = phase === 'title' || phase === 'boot' ? 'sleep'
    : phase === 'intro' ? (introT < introLen * TUNE.wakeAt ? 'sleep' : 'idle')
      : PHASE_F[phase] === 'done' ? (endOutcome === 'out' ? 'happy' : 'late')
        : sp > 80 ? 'slide' : 'idle';
  f.aim = aim.on ? aimF : null;
  f.trail = trail.n > 0 ? trail : null;
  if (ghost && phase === 'play') {
    const g = ghost.bodies[0];
    ghostF.x = (gPrevX + (g.x - gPrevX) * alpha) * UM; ghostF.y = (gPrevY + (g.y - gPrevY) * alpha) * UM;
    ghostF.vx = g.vx * VMS; ghostF.vy = g.vy * VMS;
    f.ghost = ghostF;
  } else f.ghost = null;
  f.timeLeft = (LIMIT - state.tick) / 240;
  if (wantShot) {
    wantShot = false;
    stage.update(f);
    takeQuickShot();
  } else {
    if (cleanAt > 0 && frames >= cleanAt && phase === 'result') { cleanAt = 0; takeCleanShot(); }
    stage.render(f);
    if (rp.recording && rp.rec) recFrame();
  }
  sfx.slide(phase === 'play' || phase === 'replay' ? sp / 1000 : 0);
  if (phase === 'ready' || phase === 'play' || phase === 'ending' || phase === 'replay') syncHud();
}
function frame(now) {
  rafId = requestAnimationFrame(frame);
  const w0 = performance.now();
  if (last < 0) last = now;
  let dt = (now - last) / 1000;
  last = now;
  if (DEBUG && dt > 0.08 && perf.gaps.length < 40) perf.gaps.push(frames + ':' + phase + ':' + Math.round(dt * 1000));
  const cap = rp.recording ? TUNE.recFrameCap : TUNE.frameCap;
  if (!(dt > 0)) dt = 0; else if (dt > cap) dt = cap;
  frames++;
  if (phase === 'title' && frames % TUNE.dayCheckFrames === 0) dayChanged();
  if (paused) {
    if (drawHold > 0) { drawHold--; draw(0); }
  } else if (phase === 'replayDone') {
  } else {
    advance(dt);
    draw(dt);
  }
  const w = performance.now() - w0;
  perf.ms += (w - perf.ms) * 0.05;
  if (++perf.n >= 240) { perf.n = 0; perf.max = 0; }
  if (w > perf.max) perf.max = w;
  if (DEBUG && w > 30 && perf.slow.length < 40) perf.slow.push(frames + ':' + phase + ':' + w.toFixed(0) + (perf.tag ? ':' + perf.tag : ''));
  perf.tag = '';
  if (readyAt >= 0 && frames >= readyAt) { readyAt = -1; window.__nfReady = true; warmAt = frames + TUNE.warmFrames; }
  if (warmAt >= 0 && frames >= warmAt && (phase === 'title' || phase === 'intro' || (phase === 'ready' && !aim.on))) { warmAt = -1; stage.warm(SHOT_OPTS); }
}
async function boot() {
  canvas = document.getElementById('stage');
  if (!C || !LAYOUTS.length || !canvas) return;
  const handlers = {
    onStart() { requestStart(null); },
    onRetry() { retry(); },
    onPause() { pause(false); },
    onResume() { resume(); },
    onQuit() { toTitle(); },
    onSelect(i) { return select(i, true); },
    onPractice(id) { const L = LAYOUTS.find((l) => l.id === id); if (L) requestStart(L); },
    onShare, onRanking,
    onReplay() { replayOpen(); },
    onReplayBack() { replayBack(); },
    onReplaySpeed(v) { replaySpeed(v); },
    onRecord() { recordStart(); },
    onRecordStop() { recordStop(false); },
    onVideoShare() { videoShare(); },
    onVideoSave() { videoSave(); },
    onSetting(k, v) { setSetting(k, v); },
    onHowto() { store.set(KEYS.howto, 1); },
    onReload() { try { location.reload(); } catch (e) { note(e); } },
    onOverlayClose(name) {
      if (name === 'howto' && pendingStart) { const L = pendingStart; pendingStart = null; if (phase === 'title') begin(L, false); }
    },
  };
  ui = createUI(handlers);
  store = createStore(() => { try { ui.toast('このブラウザでは記録が残りません'); } catch (e) { note(e); } });
  settings = loadSettings();
  ui.setSettings(settings);
  plays = store.get(KEYS.plays, 0) | 0;
  guardGestures(canvas);
  const [stageMod, sfxMod] = await Promise.all([
    import('./stage.js').then((m) => m, (e) => { note(e); return null; }),
    import('./sfx.js').then((m) => m, (e) => { note(e); return null; }),
  ]);
  let realStage = null, realSfx = null;
  try { if (stageMod) realStage = stageMod.createStage(canvas, { quality: settings.quality }); } catch (e) { note(e); }
  const sfxOpt = { bgmList: WEB && Array.isArray(WEB.bgmList) ? WEB.bgmList : [] };
  if (WEB && typeof WEB.bgmBase === 'string' && WEB.bgmBase) sfxOpt.bgmBase = WEB.bgmBase;
  try { if (sfxMod) realSfx = sfxMod.createSfx(sfxOpt); } catch (e) { note(e); }
  stage = guard(realStage, NO_STAGE);
  stage.setView('whole');
  sfx = guard(realSfx, NO_SFX);
  stageDead = !realStage;
  applySettings();
  pickToday();
  useLayout(todayL);
  phase = 'title';
  resetRun();
  refreshTitle();
  const iconPx = C.ITEMS.length <= 3 ? TUNE.iconPx3 : TUNE.iconPx;
  const icons = C.ITEMS.map((it) => stage.itemIcon(it.id, iconPx) || null);
  if (icons.every((c) => c)) {
    invArg.icons = icons;
    iconMap = {};
    C.ITEMS.forEach((it, i) => { iconMap[it.id] = icons[i]; });
    syncInventory();
  }
  view = createAimView(canvas);
  coach = createCoach(canvas);
  pull = createPull(canvas, { down: startAim, up: releaseAim, cancel() { endAim(false); } });
  stage.resize();
  applyInsets();
  stage.setCamera('title', INSTANT);
  sfx.bgm('title');
  for (const type of ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown']) {
    window.addEventListener(type, () => { sfx.unlock(); touched(); }, { capture: true, passive: true });
  }
  canvas.addEventListener('webglcontextrestored', () => { drawHold = 4; });
  const uiRoot = document.getElementById('ui');
  if (uiRoot) uiRoot.addEventListener('click', (e) => {
    const b = e.target && e.target.closest ? e.target.closest('button') : null;
    if (b && !b.disabled && !b.classList.contains('slot')) sfx.play('ui');
  }, true);
  window.addEventListener('keydown', onKey);
  const onResize = () => { stage.resize(); applyInsets(); drawHold = 3; if (coachOn) coachShow(); };
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize, () => {});
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (rp.recording || rp.rec) recordStop(true);
      if (phase === 'play') pause(true);
      else { if (pull) pull.abort(); endAim(false); }
      sfx.pause();
    } else {
      last = -1;
      if (!paused) sfx.resume();
      if (wakeWant) wakeOn();
      if (phase === 'title') dayChanged();
      drawHold = 4;
      if (rp.hidden) { rp.hidden = false; ui.toast('録画を止めました。もう一度「動画にする」で録れます'); }
    }
  });
  window.addEventListener('storage', (e) => {
    if (!store.owns(e.key)) return;
    if (phase === 'title' || phase === 'result') reloadStore(); else storeDirty = true;
  });
  if (DEBUG) installDebug();
  if (stageDead) ui.screen('fail');
  web('attach', {
    phase: () => phase, sfx, layout: () => layout, settings: () => ({ ...settings }),
    dayKey: () => jstNow().date,
    today: () => { const L = layoutOfDay(jstNow().day); return { id: L.id, name: L.name, day: L.day }; },
    best: dailyBest,
    toast: (text) => { try { ui.toast(String(text)); } catch (e) { note(e); } },
    ver: C.CONFIG.VER,
  });
  webTitle();
  if (typeof ResizeObserver === 'function') {
    try {
      const ro = new ResizeObserver(() => { if (phase === 'title' || phase === 'result') applyInsets(); });
      for (const sel of ['.t-bottom', '[data-r="resSheet"]']) { const el = document.querySelector('#ui ' + sel); if (el) ro.observe(el); }
    } catch (e) { note(e); }
  }
  rafId = requestAnimationFrame(frame);
  const rs = realStage && realStage.ready;
  Promise.race([Promise.resolve(rs).then(null, () => {}), new Promise((res) => setTimeout(res, 2500))]).then(() => { readyAt = frames + 2; });
}
function onKey(e) {
  if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
  const scr = ui.screen();
  if (scr === 'howto' || scr === 'settings' || scr === 'practice') return;
  const k = e.key;
  if (k === 'r' || k === 'R') {
    if (phase === 'ready' || phase === 'play' || phase === 'ending' || phase === 'result') { e.preventDefault(); retry(); }
  } else if (k === 'p' || k === 'P' || k === 'Escape') {
    if (rp.on) { if (k === 'Escape') { e.preventDefault(); replayBack(); } }
    else if (paused) { e.preventDefault(); resume(); } else if (phase === 'ready' || phase === 'play') { e.preventDefault(); pause(false); }
  } else if (k === ' ' || k === 'Enter') {
    const t = e.target;
    if (t && t.closest && t.closest('button, input, [role="switch"], [role="radio"]')) return;
    if (phase === 'title') { e.preventDefault(); requestStart(null); } else if (phase === 'result' && f.t - resultAt >= TUNE.retryKeyLock) { e.preventDefault(); retry(); }
  }
}
function installDebug() {
  const snap = () => {
    const p = state.bodies[0];
    return {
      phase, screen: ui.screen(), paused, tick: state.tick, left: tenthsLeft(), over: state.over, outcome: state.outcome,
      sel, inv: state.inv.slice(), throws: state.log.length, log: state.log.map((e) => e.slice()),
      player: { x: p.x * UM, y: p.y * UM, vx: p.vx * VMS, vy: p.vy * VMS, speed: C.speed(p) / 1000 },
      bodies: state.bodies.filter((b) => b.alive).length, layout: layout.id, practice: layout !== layoutOfDate(runDate), official: !tampered && !DEBUG_URL && layout === layoutOfDate(runDate), runDate, todayKey,
      aim: aim.on ? { dir: aim.dir, power: aim.power, n: aimF.n, dv: aimF.dv } : null,
      smash: { total: sm.total, best: sm.best, strikes: sm.strikes, combos: sm.combos, last: sm.last, open: sm.open },
      stop: { n: stopLog.n, ms: Math.round(stopLog.sec * 1000), on: stopT > 0 },
      slow: { n: slow.n, on: slow.t >= 0, t: +Math.max(0, slow.t).toFixed(4), hold: +slow.hold.toFixed(4), back: +slow.back.toFixed(4), scale: +timeScale.toFixed(4), real: Math.round(slow.real * 1000) },
      blast: { n: blastLog.n, max: blastLog.max, punch: blastLog.punch, punchMs: Math.round(blastLog.punchSec * 1000), vmax: BLAST_V, fromItems: BLAST_ITEMS },
      trail: trail.n, ghost: !!ghost, plays, stageDead, wake: wakeWant, veil: !!(canvas && canvas.hasAttribute('data-veil')), settings: { ...settings }, insets: insetsNow, coach: coachOn, avoid: avoidNow, pull: settings.pull,
      replay: { on: rp.on, speed: rp.speed, pick: rp.pick, recording: rp.recording, t: +rp.t.toFixed(2), total: +rp.total.toFixed(2), extra: +rp.extra.toFixed(4),
        video: rp.video ? { size: rp.video.blob.size, type: rp.video.type, name: rp.video.name, ms: Math.round(rp.video.ms) } : null },
      shot: !!shot, cleanShot: cleanOk, card: !!(share && share.blob), frames, perf: { ms: +perf.ms.toFixed(3), max: +perf.max.toFixed(2), steps: perf.steps, draws: perf.draws, shot: +perf.shot.toFixed(1), clean: +perf.clean.toFixed(1), card: +perf.card.toFixed(1), result: Math.round(perf.result), intro: Math.round(perf.intro), slow: perf.slow.slice(), gaps: perf.gaps.slice() },
      stage: stage.stats() ? { ...stage.stats() } : null, errors: errs.slice(),
    };
  };
  const run = (n) => {
    for (let i = 0; i < n && phase === 'play'; i++) stepOnce(true);
    if (phase === 'play') { acc = 0; snapPrev(state, prevX, prevY); }
    stopReq = 0; stopVib = 0;
    flushFrame();
  };
  const toReady = (L) => {
    if (phase === 'title' || phase === 'intro' || phase === 'boot') { store.set(KEYS.howto, 1); pendingStart = null; phase = 'title'; begin(L || layout, true); }
    else if (L && L !== layout) { phase = 'title'; begin(L, true); }
    else retry();
    tampered = true;
  };
  window.__nf = {
    get state() { return snap(); },
    get result() { return lastR ? { ...lastR, image: !!lastR.image } : null; },
    get share() { return share; },
    get shot() { return shot; },
    get video() { return rp.video; },
    get rec() { return rp.rec; },
    get stage() { return stage; },
    start() { if (phase === 'title') toReady(todayL); return snap(); },
    retry() { retry(); return snap(); },
    throwAt(item, dir, power) { tampered = true; return doThrow(item | 0, dir & 255, power | 0); },
    ff(sec) { tampered = true; run(Math.round(sec * 240)); return snap(); },
    play(log) {
      toReady(null);
      for (const e of log || []) {
        if (phase === 'play') run(e[0] - state.tick);
        if (phase !== 'ready' && phase !== 'play') break;
        doThrow(e[1], e[2], e[3]);
      }
      if (phase === 'play') run(LIMIT);
      return sum || snap();
    },
    layout(id) { const L = LAYOUTS.find((l) => l.id === id); if (L) toReady(L); return layout.id; },
    title() { toTitle(); return snap(); },
    pull(mode) { if (mode === pullMode(mode)) { setSetting('pull', mode); ui.setSettings(settings); } return settings.pull; },
    replay() { replayOpen(); return snap(); },
  };
}
boot().then(null, (e) => { note(e); });
