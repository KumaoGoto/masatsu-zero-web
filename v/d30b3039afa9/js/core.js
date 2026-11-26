(function (root) {
  'use strict';
  const CONFIG = {
    VER: 3,
    HZ: 240,
    LIMIT_TICKS: 7200,
    DIRS: 256,
    POWERS: 100,
    MIN_POWER: 8,
    W_MAX: 160000,
    BODY_G: 20000,
    PLAYER_R: 240,
    FIRST_ITEM: 3,
    THROW_GAP: 30,
    E_WALL: 50,
    E_BODY: 85,
    E_ITEM_WALL: 30,
    E_ITEM_BODY: 50,
    GOAL_PAD: 50,
    OUT_X: 1000,
    OUT_Y: 1600,
    STUCK_MM_S: 4,
    V_CAP: 262144,
    SUB_MAX: 16,
    FIX_ITERS: 8,
    PREDICT_TICKS: 480,
    HIT_MIN: 60,
    CAT_MIN: 500,
    MAX_HITS: 8,
    GRID_SHIFT: 17,
    GRID_R: [80, 160, 260, 400],
    AFTER_PARK: 20000,
    R_MIN: 30, R_MAX: 400,
    G_MAX: 100000,
    CIRCLE_R_MAX: 2000,
  };
  Object.freeze(CONFIG.GRID_R);
  Object.freeze(CONFIG);
  const ITEMS = [
    { id: 'keshi', name: '消しゴム', g: 30, n: 1, r: 60 },
    { id: 'kutsu', name: '靴下', g: 60, n: 2, r: 70 },
    { id: 'toast', name: 'トースト', g: 80, n: 1, r: 80 },
    { id: 'kyoka', name: '教科書', g: 500, n: 2, r: 110 },
    { id: 'rando', name: 'ランドセル', g: 1400, n: 1, r: 150 },
  ];
  for (const it of ITEMS) Object.freeze(it);
  Object.freeze(ITEMS);
  const RANDO = ITEMS.findIndex((it) => it.id === 'rando');
  const UM = 1000;
  const NS = 16384;
  const NS2 = NS * NS;
  const HZ = CONFIG.HZ, LIMIT = CONFIG.LIMIT_TICKS, V_CAP = CONFIG.V_CAP, SUB_MAX = CONFIG.SUB_MAX;
  const E_WALL = CONFIG.E_WALL, E_BODY = CONFIG.E_BODY, E_ITEM_WALL = CONFIG.E_ITEM_WALL, E_ITEM_BODY = CONFIG.E_ITEM_BODY;
  const HIT_MIN = CONFIG.HIT_MIN, CAT_MIN = CONFIG.CAT_MIN, MAX_HITS = CONFIG.MAX_HITS, FIX_ITERS = CONFIG.FIX_ITERS;
  const GSH = CONFIG.GRID_SHIFT;
  const STUCK2 = CONFIG.STUCK_MM_S * UM * CONFIG.STUCK_MM_S * UM;
  const OUTCOMES = [null, 'out', 'late', 'stuck'];
  const K_PLAYER = 0, K_ITEM = 1, K_CAT = 2, K_OTHER = 3;
  const QUARTER = [
    16384, 16379, 16364, 16340, 16305, 16261, 16207, 16143, 16069, 15986, 15893, 15791, 15679, 15557, 15426, 15286,
    15137, 14978, 14811, 14635, 14449, 14256, 14053, 13842, 13623, 13395, 13160, 12916, 12665, 12406, 12140, 11866,
    11585, 11297, 11003, 10702, 10394, 10080, 9760, 9434, 9102, 8765, 8423, 8076, 7723, 7366, 7005, 6639,
    6270, 5897, 5520, 5139, 4756, 4370, 3981, 3590, 3196, 2801, 2404, 2006, 1606, 1205, 804, 402,
    0,
  ];
  const DIRX = new Int32Array(256), DIRY = new Int32Array(256);
  for (let k = 0; k < 256; k++) {
    const q = k >> 6, m = k & 63, c = QUARTER[m], s = QUARTER[64 - m];
    DIRX[k] = q === 0 ? c : q === 1 ? -s : q === 2 ? -c : s;
    DIRY[k] = q === 0 ? s : q === 1 ? c : q === 2 ? -s : -c;
  }
  function isqrt(n) {
    let s = Math.floor(Math.sqrt(n));
    while (s * s > n) s--;
    while ((s + 1) * (s + 1) <= n) s++;
    return s;
  }
  function isInt(v) { return typeof v === 'number' && Number.isInteger(v); }
  function checkLayout(L) {
    if (!L || typeof L !== 'object') return 'layout';
    if (!isInt(L.w) || !isInt(L.h) || !isInt(L.wallT)) return 'size';
    if (L.w < 1000 || L.w > 12000 || L.h < 1000 || L.h > 12000) return 'size';
    if (L.wallT < 20 || L.wallT * 4 > L.w || L.wallT * 4 > L.h) return 'wallT';
    const d = L.door;
    if (!d || !isInt(d.x1) || !isInt(d.x2) || d.x1 < L.wallT || d.x2 > L.w - L.wallT || d.x2 <= d.x1) return 'door';
    const s = L.start;
    if (!s || !isInt(s.x) || !isInt(s.y) || s.x <= 0 || s.x >= L.w || s.y <= 0 || s.y >= L.h) return 'start';
    const boxes = (L.walls || []).concat(L.rects || []);
    for (const r of boxes) {
      if (!r || !isInt(r.x1) || !isInt(r.y1) || !isInt(r.x2) || !isInt(r.y2)) return 'rect';
      if (r.x1 >= r.x2 || r.y1 >= r.y2 || r.x1 < 0 || r.y1 < 0 || r.x2 > L.w || r.y2 > L.h) return 'rect';
    }
    const cs = L.circles || [];
    for (const c of cs) {
      if (!c || !isInt(c.x) || !isInt(c.y) || !isInt(c.r)) return 'circle';
      if (c.r < 1 || c.r > CONFIG.CIRCLE_R_MAX || c.x < 0 || c.x > L.w || c.y < 0 || c.y > L.h) return 'circle';
    }
    const bs = L.bodies || [];
    for (const b of bs) {
      if (!b || !isInt(b.x) || !isInt(b.y) || !isInt(b.r) || !isInt(b.g) || typeof b.kind !== 'string') return 'body';
      if (b.r < CONFIG.R_MIN || b.r > CONFIG.R_MAX || b.g < 1 || b.g > CONFIG.G_MAX) return 'body';
      if (b.kind === 'player' || b.kind === 'item') return 'body';
      if (b.x <= 0 || b.x >= L.w || b.y <= 0 || b.y >= L.h) return 'body';
    }
    if (boxes.length + cs.length > 2000 || bs.length > 200) return 'count';
    return null;
  }
  function buildGeom(L) {
    const err = checkLayout(L);
    if (err) throw new Error('NFCore: 間取りが正しくない（' + err + '）');
    const w = L.w * UM, h = L.h * UM, t = L.wallT * UM;
    const rx1 = [], ry1 = [], rx2 = [], ry2 = [], names = [];
    const box = (x1, y1, x2, y2, kind) => { rx1.push(x1); ry1.push(y1); rx2.push(x2); ry2.push(y2); names.push(kind); };
    box(0, 0, w, t, 'wall'); box(0, 0, t, h, 'wall'); box(w - t, 0, w, h, 'wall');
    box(0, h - t, L.door.x1 * UM, h, 'wall'); box(L.door.x2 * UM, h - t, w, h, 'wall');
    for (const r of (L.walls || [])) box(r.x1 * UM, r.y1 * UM, r.x2 * UM, r.y2 * UM, r.kind || 'wall');
    for (const r of (L.rects || [])) box(r.x1 * UM, r.y1 * UM, r.x2 * UM, r.y2 * UM, r.kind || 'rect');
    const nR = rx1.length;
    const cs = L.circles || [], nC = cs.length;
    const CX = new Float64Array(nC), CY = new Float64Array(nC), CR = new Float64Array(nC);
    for (let i = 0; i < nC; i++) { CX[i] = cs[i].x * UM; CY[i] = cs[i].y * UM; CR[i] = cs[i].r * UM; names.push(cs[i].kind || 'circle'); }
    const reaches = CONFIG.GRID_R.map((mm) => mm * UM + UM);
    const cell = 1 << GSH;
    const GM = (Math.floor(reaches[reaches.length - 1] / cell) + 2) * cell;
    const GW = Math.ceil((w + 2 * GM) / cell), GH = Math.ceil((h + 2 * GM) / cell);
    const cells = GW * GH, nS = nR + nC;
    const CS = new Int32Array(reaches.length * (cells + 1));
    const span = (i, reach) => {
      let x1, y1, x2, y2;
      if (i < nR) { x1 = rx1[i]; y1 = ry1[i]; x2 = rx2[i]; y2 = ry2[i]; }
      else { const k = i - nR; x1 = CX[k] - CR[k]; x2 = CX[k] + CR[k]; y1 = CY[k] - CR[k]; y2 = CY[k] + CR[k]; }
      return [
        Math.max(0, (x1 - reach + GM) >> GSH), Math.min(GW - 1, (x2 + reach + GM) >> GSH),
        Math.max(0, (y1 - reach + GM) >> GSH), Math.min(GH - 1, (y2 + reach + GM) >> GSH),
      ];
    };
    const each = (fn) => {
      for (let k = 0; k < reaches.length; k++) {
        const base = k * (cells + 1);
        for (let i = 0; i < nS; i++) {
          const sp = span(i, reaches[k]);
          for (let gy = sp[2]; gy <= sp[3]; gy++) for (let gx = sp[0]; gx <= sp[1]; gx++) fn(base + gy * GW + gx, i);
        }
      }
    };
    each((c) => { CS[c + 1]++; });
    for (let c = 0; c + 1 < CS.length; c++) CS[c + 1] += CS[c];
    const CL = new Int16Array(CS[CS.length - 1]);
    const fill = new Int32Array(CS.length);
    each((c, i) => { CL[CS[c] + fill[c]++] = i; });
    return {
      nR, nC, names,
      RX1: Float64Array.from(rx1), RY1: Float64Array.from(ry1), RX2: Float64Array.from(rx2), RY2: Float64Array.from(ry2),
      CX, CY, CR, CS, CL, GW, GH, GM, cells1: cells + 1,
      goalY: h + CONFIG.GOAL_PAD * UM,
      outX1: -CONFIG.OUT_X * UM, outX2: w + CONFIG.OUT_X * UM, outY1: -CONFIG.OUT_Y * UM, outY2: h + CONFIG.OUT_Y * UM,
    };
  }
  const geomCache = new WeakMap();
  function geomOf(layout) {
    let g = geomCache.get(layout);
    if (!g) { g = buildGeom(layout); geomCache.set(layout, g); }
    return g;
  }
  let CAP = 0;
  let X, Y, VX, VY, RR, RC, G;
  let KD, AL, IT, LIVE, GB;
  let SLP, MV, SK, POS, AWK, AWK2;
  let NA = 0;
  let NSUB = 1;
  const CATL = new Int32Array(8); let NCAT = 0;
  let N = 0, NL = 0;
  let RMAX2 = 0;
  let wTick = 0, wOut = 0, wLeft = 0, wCatUm = 0, wCatOut = 0;
  let REC = false, STAT = false;
  const stats = { saves: 0 };
  function grow(n) {
    const f = (old) => { const a = new Float64Array(n); if (old) a.set(old); return a; };
    const b = (old) => { const a = new Uint8Array(n); if (old) a.set(old); return a; };
    X = f(X); Y = f(Y); VX = f(VX); VY = f(VY); RR = f(RR); RC = f(RC); G = f(G);
    KD = b(KD); AL = b(AL); SLP = b(SLP); MV = b(MV); SK = f(SK);
    const ps = new Int32Array(n); if (POS) ps.set(POS); POS = ps;
    const aw = new Int32Array(n); if (AWK) aw.set(AWK); AWK = aw;
    AWK2 = new Int32Array(n);
    const it = new Int8Array(n); if (IT) it.set(IT); IT = it;
    const lv = new Int32Array(n); if (LIVE) lv.set(LIVE); LIVE = lv;
    const gb = new Int32Array(n); if (GB) gb.set(GB); GB = gb;
    CAP = n;
  }
  grow(64);
  let curLayout = null, GEO = null;
  let gNR = 0, gRX1, gRY1, gRX2, gRY2, gCX, gCY, gCR, gCS, gCL, gGW = 0, gGH = 0, gGM = 0;
  let GOAL_Y = 0, OUT_X1 = 0, OUT_X2 = 0, OUT_Y1 = 0, OUT_Y2 = 0;
  const GR1 = CONFIG.GRID_R[0] * UM, GR2 = CONFIG.GRID_R[1] * UM, GR3 = CONFIG.GRID_R[2] * UM;
  function gridBase(r) {
    return (r > GR1 ? r > GR2 ? r > GR3 ? 3 : 2 : 1 : 0) * GEO.cells1;
  }
  function bind(layout) {
    const g = geomOf(layout);
    curLayout = layout; GEO = g;
    gNR = g.nR; gRX1 = g.RX1; gRY1 = g.RY1; gRX2 = g.RX2; gRY2 = g.RY2; gCX = g.CX; gCY = g.CY; gCR = g.CR;
    gCS = g.CS; gCL = g.CL; gGW = g.GW; gGH = g.GH; gGM = g.GM;
    OUT_X1 = g.outX1; OUT_X2 = g.outX2; OUT_Y1 = g.outY1; OUT_Y2 = g.outY2;
  }
  const EV_MAX = 48, TC_MAX = 32;
  const EVT = new Uint8Array(EV_MAX), EVA = new Int32Array(EV_MAX), EVB = new Int32Array(EV_MAX), EVS = new Int32Array(EV_MAX), EVK = new Int32Array(EV_MAX);
  const EVX = new Float64Array(EV_MAX), EVY = new Float64Array(EV_MAX), EVV = new Float64Array(EV_MAX);
  let NE = 0, NH = 0;
  let PT = new Int32Array(TC_MAX), CT = new Int32Array(TC_MAX), NPT = 0, NCT = 0;
  const T_HIT = 1, T_CAT = 2, T_OUT = 3;
  function touch(key) {
    for (let i = 0; i < NCT; i++) if (CT[i] === key) return;
    if (NCT < TC_MAX) CT[NCT++] = key;
  }
  function emitHit(a, b, s, key, x, y, v) {
    for (let i = 0; i < NE; i++) if (EVT[i] === T_HIT && EVK[i] === key) return false;
    for (let i = 0; i < NPT; i++) if (PT[i] === key) return false;
    if (NH >= MAX_HITS || NE >= EV_MAX) return false;
    EVT[NE] = T_HIT; EVA[NE] = a; EVB[NE] = b; EVS[NE] = s; EVK[NE] = key; EVX[NE] = x; EVY[NE] = y; EVV[NE] = v;
    NE++; NH++;
    return true;
  }
  function emit(t, a, v) {
    if (NE >= EV_MAX) return;
    EVT[NE] = t; EVA[NE] = a; EVB[NE] = -1; EVS[NE] = -1; EVK[NE] = -1; EVX[NE] = 0; EVY[NE] = 0; EVV[NE] = v;
    NE++;
  }
  function load(state) {
    if (state.layout !== curLayout) bind(state.layout);
    const bs = state.bodies, n = bs.length;
    if (n + ITEMS.length + 4 > CAP) grow(n + 32);
    const x = X, y = Y, vx = VX, vy = VY, g = G, rr = RR, rc = RC, gb = GB, it = IT, kd = KD, al = AL, lv = LIVE, slp = SLP, mv = MV, aw = AWK, sk = SK, c1 = GEO.cells1;
    let nl = 0, rmax2 = 0, ncat = 0;
    N = n;
    for (let i = 0; i < n; i++) {
      const b = bs[i];
      if (!b.alive) { al[i] = 0; continue; }
      al[i] = 1; lv[nl] = i; aw[nl] = i; slp[i] = 0; mv[i] = 0;
      const r = b.r, by = b.y;
      x[i] = b.x; y[i] = by; vx[i] = b.vx; vy[i] = b.vy; g[i] = b.g;
      rr[i] = r; rc[i] = Math.trunc(r / 2) + 2; gb[i] = (r > GR1 ? r > GR2 ? r > GR3 ? 3 : 2 : 1 : 0) * c1;
      sk[nl] = by - r; nl++;
      if (2 * r > rmax2) rmax2 = 2 * r;
      const item = b.item, k = i === 0 ? K_PLAYER : item >= 0 ? K_ITEM : b.kind === 'cat' ? K_CAT : K_OTHER;
      it[i] = item; kd[i] = k;
      if (k === K_CAT && ncat < CATL.length) CATL[ncat++] = i;
    }
    NL = nl; NA = nl; RMAX2 = rmax2; NCAT = ncat;
    GOAL_Y = GEO.goalY + RR[0];
    sortLive();
    subAll();
    wTick = state.tick; wOut = 0; wCatUm = state.catUm; wCatOut = state.catOut;
    const inv = state.inv; wLeft = 0;
    for (let i = 0; i < inv.length; i++) wLeft += inv[i];
  }
  function store(state) {
    const bs = state.bodies;
    for (let i = 0; i < N; i++) {
      let b = bs[i];
      if (b === undefined) { b = mkBody(i, 'item', IT[i], 0, 0, 0, 0, RR[i], G[i]); bs.push(b); }
      else if (!b.alive) continue;
      b.x = X[i]; b.y = Y[i]; b.vx = VX[i]; b.vy = VY[i];
      if (AL[i] === 0) b.alive = false;
    }
    bs[0].g = G[0];
    state.tick = wTick; state.catUm = wCatUm; state.catOut = wCatOut;
    if (wOut !== 0) { state.over = true; state.outcome = OUTCOMES[wOut]; }
  }
  function cutsOne(s, x0, y0, x1, y1) {
    if (s < gNR) {
      const ax = gRX1[s], bx = gRX2[s], ay = gRY1[s], by = gRY2[s];
      if ((x0 <= ax && x1 <= ax) || (x0 >= bx && x1 >= bx) || (y0 <= ay && y1 <= ay) || (y0 >= by && y1 >= by)) return false;
      if (x0 > ax && x0 < bx && y0 > ay && y0 < by) return false;
      if (x1 > ax && x1 < bx && y1 > ay && y1 < by) return true;
      const ex = x1 - x0, ey = y1 - y0;
      const c1 = ex * (ay - y0) - ey * (ax - x0), c2 = ex * (ay - y0) - ey * (bx - x0);
      const c3 = ex * (by - y0) - ey * (ax - x0), c4 = ex * (by - y0) - ey * (bx - x0);
      return !((c1 >= 0 && c2 >= 0 && c3 >= 0 && c4 >= 0) || (c1 <= 0 && c2 <= 0 && c3 <= 0 && c4 <= 0));
    }
    const k = s - gNR, cr = gCR[k], dx = x1 - gCX[k], dy = y1 - gCY[k];
    if (dx >= cr || dx <= -cr || dy >= cr || dy <= -cr || dx * dx + dy * dy >= cr * cr) return false;
    const fx = x0 - gCX[k], fy = y0 - gCY[k];
    return !(fx < cr && fx > -cr && fy < cr && fy > -cr && fx * fx + fy * fy < cr * cr);
  }
  function cuts(i, x0, y0, x1, y1) {
    const r = RR[i], ex = x1 - x0, ey = y1 - y0;
    if (ex > r || ex < -r || ey > r || ey < -r) {
      const n = gNR + gCX.length;
      for (let s = 0; s < n; s++) if (cutsOne(s, x0, y0, x1, y1)) return true;
      return false;
    }
    const CS = gCS, CL = gCL, GW = gGW, GH = gGH, GM = gGM, base = GB[i];
    for (let side = 0; side < 2; side++) {
      const gx = ((side ? x0 : x1) + GM) >> GSH, gy = ((side ? y0 : y1) + GM) >> GSH;
      if (gx < 0 || gx >= GW || gy < 0 || gy >= GH) continue;
      const c = base + gy * GW + gx, p1 = CS[c + 1];
      for (let p = CS[c]; p < p1; p++) if (cutsOne(CL[p], x0, y0, x1, y1)) return true;
    }
    return false;
  }
  function fixStatic(i, x0, y0) {
    const RX1 = gRX1, RY1 = gRY1, RX2 = gRX2, RY2 = gRY2, CX = gCX, CY = gCY, CR = gCR, CS = gCS, CL = gCL;
    const nR = gNR, GW = gGW, GH = gGH, GM = gGM, base = GB[i];
    let x = X[i], y = Y[i], pushed = false;
    const r = RR[i];
    for (let iter = 0; iter < FIX_ITERS; iter++) {
      const gx = (x + GM) >> GSH, gy = (y + GM) >> GSH;
      if (gx < 0 || gx >= GW || gy < 0 || gy >= GH) break;
      const c = base + gy * GW + gx, p1 = CS[c + 1];
      let best = -1, bestPen = 0;
      for (let p = CS[c]; p < p1; p++) {
        const s = CL[p];
        let pen;
        if (s < nR) {
          const x1 = RX1[s], x2 = RX2[s], y1 = RY1[s], y2 = RY2[s];
          if (x + r <= x1 || x - r >= x2 || y + r <= y1 || y - r >= y2) continue;
          const dx = x < x1 ? x - x1 : x > x2 ? x - x2 : 0;
          const dy = y < y1 ? y - y1 : y > y2 ? y - y2 : 0;
          if (dx !== 0 && dy !== 0) {
            const d2 = dx * dx + dy * dy;
            if (d2 >= r * r) continue;
            pen = r - isqrt(d2);
          } else if (dx !== 0) pen = r - (dx < 0 ? -dx : dx);
          else if (dy !== 0) pen = r - (dy < 0 ? -dy : dy);
          else {
            let m = x - x1;
            if (x2 - x < m) m = x2 - x;
            if (y - y1 < m) m = y - y1;
            if (y2 - y < m) m = y2 - y;
            pen = r + m;
          }
        } else {
          const k = s - nR, dx = x - CX[k], dy = y - CY[k], rr = r + CR[k];
          if (dx >= rr || dx <= -rr || dy >= rr || dy <= -rr) continue;
          const d2 = dx * dx + dy * dy;
          if (d2 >= rr * rr) continue;
          pen = rr - isqrt(d2);
        }
        if (pen > bestPen) { bestPen = pen; best = s; }
      }
      if (best < 0) break;
      pushed = true; MV[i] = 1;
      let nx = 0, ny = 0, px = x, py = y;
      if (best < nR) {
        const x1 = RX1[best], x2 = RX2[best], y1 = RY1[best], y2 = RY2[best];
        const dx = x < x1 ? x - x1 : x > x2 ? x - x2 : 0;
        const dy = y < y1 ? y - y1 : y > y2 ? y - y2 : 0;
        if (dx !== 0 && dy !== 0) {
          const d = isqrt(dx * dx + dy * dy);
          nx = Math.trunc(dx * NS / d); ny = Math.trunc(dy * NS / d);
          px = x - dx; py = y - dy;
          x = px + Math.trunc(dx * r / d) + (dx > 0 ? 1 : -1);
          y = py + Math.trunc(dy * r / d) + (dy > 0 ? 1 : -1);
        } else if (dx !== 0) {
          px = x - dx;
          if (dx < 0) { nx = -NS; x = px - r; } else { nx = NS; x = px + r; }
        } else if (dy !== 0) {
          py = y - dy;
          if (dy < 0) { ny = -NS; y = py - r; } else { ny = NS; y = py + r; }
        } else {
          const l = x - x1, rt = x2 - x, u = y - y1, dn = y2 - y;
          let m = l; if (rt < m) m = rt; if (u < m) m = u; if (dn < m) m = dn;
          if (m === l) { nx = -NS; px = x1; x = x1 - r; }
          else if (m === rt) { nx = NS; px = x2; x = x2 + r; }
          else if (m === u) { ny = -NS; py = y1; y = y1 - r; }
          else { ny = NS; py = y2; y = y2 + r; }
        }
      } else {
        const k = best - nR, rr = r + CR[k];
        let dx = x - CX[k], dy = y - CY[k], d = isqrt(dx * dx + dy * dy);
        if (d === 0) { dx = 1; dy = 0; d = 1; }
        nx = Math.trunc(dx * NS / d); ny = Math.trunc(dy * NS / d);
        px = CX[k] + Math.trunc(dx * CR[k] / d); py = CY[k] + Math.trunc(dy * CR[k] / d);
        x = CX[k] + Math.trunc(dx * rr / d) + (dx > 0 ? 1 : dx < 0 ? -1 : 0);
        y = CY[k] + Math.trunc(dy * rr / d) + (dy > 0 ? 1 : dy < 0 ? -1 : 0);
      }
      const vx = VX[i], vy = VY[i];
      const vn = vx * nx + vy * ny;
      const key = i * 65536 + 32768 + best;
      if (vn < 0) {
        const j = Math.trunc((100 + (KD[i] === K_ITEM ? E_ITEM_WALL : E_WALL)) * vn / 100);
        VX[i] = vx - Math.trunc(j * nx / NS2);
        VY[i] = vy - Math.trunc(j * ny / NS2);
        if (REC) { const v = Math.trunc(-vn / NS); if (v >= HIT_MIN) emitHit(i, -1, best, key, px, py, v); }
      }
      if (REC) touch(key);
    }
    if (pushed && cuts(i, x0, y0, x, y)) {
      x = x0; y = y0; VX[i] = 0; VY[i] = 0;
      stats.saves++;
    }
    X[i] = x; Y[i] = y;
  }
  function hitPair(i, j, dx, dy, d2, rr) {
    let d = isqrt(d2);
    if (d === 0) { dx = 1; dy = 0; d = 1; }
    const pen = rr - d, mi = G[i], mj = G[j], M = mi + mj;
    MV[i] = 1; MV[j] = 1;
    if (SLP[i] !== 0) { SLP[i] = 0; AWK[NA++] = i; }
    if (SLP[j] !== 0) { SLP[j] = 0; AWK[NA++] = j; }
    const sx = Math.trunc(dx * pen / d) + (dx > 0 ? 1 : dx < 0 ? -1 : 0);
    const sy = Math.trunc(dy * pen / d) + (dy > 0 ? 1 : dy < 0 ? -1 : 0);
    let ax = Math.trunc(sx * mj / M), ay = Math.trunc(sy * mj / M);
    let bx = sx - ax, by = sy - ay;
    const ci = RC[i], cj = RC[j];
    if (ax > ci) ax = ci; else if (ax < -ci) ax = -ci;
    if (ay > ci) ay = ci; else if (ay < -ci) ay = -ci;
    if (bx > cj) bx = cj; else if (bx < -cj) bx = -cj;
    if (by > cj) by = cj; else if (by < -cj) by = -cj;
    const xi = X[i], yi = Y[i], xj = X[j], yj = Y[j];
    X[i] = xi - ax; Y[i] = yi - ay; X[j] = xj + bx; Y[j] = yj + by;
    const nx = Math.trunc(dx * NS / d), ny = Math.trunc(dy * NS / d);
    const vn = (VX[j] - VX[i]) * nx + (VY[j] - VY[i]) * ny;
    const key = i * 65536 + j;
    if (vn < 0) {
      const a1 = Math.trunc((100 + ((KD[i] === K_ITEM || KD[j] === K_ITEM) ? E_ITEM_BODY : E_BODY)) * vn / 100);
      const pa = Math.trunc(a1 * mj / M), pb = a1 - pa;
      let v;
      v = VX[i] + Math.trunc(pa * nx / NS2); VX[i] = v > V_CAP ? V_CAP : v < -V_CAP ? -V_CAP : v;
      v = VY[i] + Math.trunc(pa * ny / NS2); VY[i] = v > V_CAP ? V_CAP : v < -V_CAP ? -V_CAP : v;
      v = VX[j] - Math.trunc(pb * nx / NS2); VX[j] = v > V_CAP ? V_CAP : v < -V_CAP ? -V_CAP : v;
      v = VY[j] - Math.trunc(pb * ny / NS2); VY[j] = v > V_CAP ? V_CAP : v < -V_CAP ? -V_CAP : v;
      if (REC) {
        const sp = Math.trunc(-vn / NS);
        if (sp >= HIT_MIN && emitHit(i, j, -1, key, xi + Math.trunc(dx * RR[i] / d), yi + Math.trunc(dy * RR[i] / d), sp) && sp >= CAT_MIN) {
          if (KD[i] === K_CAT) emit(T_CAT, i, sp);
          if (KD[j] === K_CAT) emit(T_CAT, j, sp);
        }
      }
    }
    if (REC) touch(key);
    fixStatic(i, xi, yi); fixStatic(j, xj, yj);
  }
  function needSub(i, n) {
    const vx = VX[i], vy = VY[i];
    if (vx === 0 && vy === 0) return n;
    const q = 4 * (vx * vx + vy * vy), r = RR[i], r2 = r * r;
    while (n < SUB_MAX && q > n * n * r2) n++;
    return n;
  }
  function subAll() {
    let n = 1;
    for (let q = 0; q < NA; q++) n = needSub(AWK[q], n);
    NSUB = n;
  }
  function sortLive() {
    const lv = LIVE, sk = SK, pos = POS, nl = NL;
    for (let a = 1; a < nl; a++) {
      const i = lv[a], key = sk[a];
      let b = a - 1;
      while (b >= 0) {
        const kj = sk[b];
        if (kj < key || (kj === key && lv[b] < i)) break;
        lv[b + 1] = lv[b]; sk[b + 1] = kj; b--;
      }
      lv[b + 1] = i; sk[b + 1] = key;
    }
    for (let a = 0; a < nl; a++) pos[lv[a]] = a;
  }
  function tick() {
    const lx = X, ly = Y, lvx = VX, lvy = VY, lr = RR, lv = LIVE, slp = SLP, mv = MV, sk = SK, pos = POS, aw = AWK, kd = KD, rc = RC;
    const n = NSUB;
    if (STAT) for (let q = 0; q < NCAT; q++) {
      const i = CATL[q], vx = lvx[i], vy = lvy[i];
      if (AL[i] !== 0 && (vx !== 0 || vy !== 0)) wCatUm += isqrt(vx * vx + vy * vy);
    }
    if (REC) { const t = PT; PT = CT; CT = t; NPT = NCT; NCT = 0; NE = 0; NH = 0; }
    const cs = gCS, gb = GB, gw = gGW, gh = gGH, gm = gGM;
    const ox1 = OUT_X1, ox2 = OUT_X2, oy1 = OUT_Y1, oy2 = OUT_Y2;
    let w = 0, dead = false, nn = 1, fused = false;
    for (let k = 0; k < n; k++) {
      const nl = NL, all = NA * 2 >= nl;
      let bad = false, any = all;
      if (all) {
        for (let a = 0; a < nl; a++) {
          const i = lv[a];
          if (slp[i] === 0) {
            const vx = lvx[i], vy = lvy[i], x0 = lx[i], y0 = ly[i];
            let x = x0, y = y0;
            if (vx !== 0 || vy !== 0) {
              let dx = vx, dy = vy;
              if (n !== 1) {
                dx = Math.trunc(vx * (k + 1) / n) - Math.trunc(vx * k / n);
                dy = Math.trunc(vy * (k + 1) / n) - Math.trunc(vy * k / n);
                const c = rc[i];
                if (dx > c) dx = c; else if (dx < -c) dx = -c;
                if (dy > c) dy = c; else if (dy < -c) dy = -c;
              }
              x += dx; y += dy;
              lx[i] = x; ly[i] = y; mv[i] = 1;
            }
            const gx = (x + gm) >> GSH, gy = (y + gm) >> GSH;
            if (gx >= 0 && gx < gw && gy >= 0 && gy < gh) {
              const c = gb[i] + gy * gw + gx;
              if (cs[c] !== cs[c + 1]) fixStatic(i, x0, y0);
            }
          }
          const key = ly[i] - lr[i];
          let b = a - 1;
          while (b >= 0) {
            const kj = sk[b];
            if (kj < key || (kj === key && lv[b] < i)) break;
            lv[b + 1] = lv[b]; sk[b + 1] = kj; b--; bad = true;
          }
          b++;
          lv[b] = i; sk[b] = key;
        }
        if (bad) for (let a = 0; a < nl; a++) pos[lv[a]] = a;
      } else {
        for (let q = 0; q < NA; q++) {
          const i = aw[q], vx = lvx[i], vy = lvy[i], x0 = lx[i], y0 = ly[i];
          let x = x0, y = y0;
          if (vx !== 0 || vy !== 0) {
            let dx = vx, dy = vy;
            if (n !== 1) {
              dx = Math.trunc(vx * (k + 1) / n) - Math.trunc(vx * k / n);
              dy = Math.trunc(vy * (k + 1) / n) - Math.trunc(vy * k / n);
              const c = rc[i];
              if (dx > c) dx = c; else if (dx < -c) dx = -c;
              if (dy > c) dy = c; else if (dy < -c) dy = -c;
            }
            x += dx; y += dy;
            lx[i] = x; ly[i] = y; mv[i] = 1;
          }
          const gx = (x + gm) >> GSH, gy = (y + gm) >> GSH;
          if (gx >= 0 && gx < gw && gy >= 0 && gy < gh) {
            const c = gb[i] + gy * gw + gx;
            if (cs[c] !== cs[c + 1]) fixStatic(i, x0, y0);
          }
        }
        for (let q = 0; q < NA; q++) { const i = aw[q]; sk[pos[i]] = ly[i] - lr[i]; }
        for (let q = 0; q < NA && !bad; q++) {
          const i = aw[q], p = pos[i], key = sk[p];
          if (p > 0) { const kj = sk[p - 1]; if (kj > key || (kj === key && lv[p - 1] > i)) bad = true; }
          if (p + 1 < nl) { const kj = sk[p + 1]; if (kj < key || (kj === key && lv[p + 1] < i)) bad = true; }
        }
        if (bad) sortLive();
        for (let q = 0; q < NA && !any; q++) {
          const i = aw[q], p = pos[i], ri = lr[i], xi = lx[i], yi = ly[i], bottom = yi + ri, reach = sk[p] - RMAX2;
          for (let b = p + 1; b < nl; b++) {
            if (sk[b] >= bottom) break;
            const j = lv[b], rr = ri + lr[j], dx = lx[j] - xi;
            if (dx >= rr || dx <= -rr) continue;
            const dy = ly[j] - yi;
            if (dy < rr && dy > -rr && dx * dx + dy * dy < rr * rr) { any = true; break; }
          }
          for (let b = p - 1; b >= 0 && !any && sk[b] > reach; b--) {
            const j = lv[b];
            if (slp[j] === 0) continue;
            const rr = ri + lr[j], dx = lx[j] - xi;
            if (dx >= rr || dx <= -rr) continue;
            const dy = ly[j] - yi;
            if (dy < rr && dy > -rr && dx * dx + dy * dy < rr * rr) any = true;
          }
        }
      }
      if (!any) continue;
      fused = all && k === n - 1;
      const aw2 = AWK2;
      for (let a = 0; a < nl; a++) {
        const i = lv[a], ri = lr[i];
        let si = slp[i], xi = lx[i], yi = ly[i], bottom = yi + ri;
        for (let b = a + 1; b < nl; b++) {
          if (sk[b] >= bottom) break;
          const j = lv[b];
          if (si !== 0 && slp[j] !== 0) continue;
          const rr = ri + lr[j], dx = lx[j] - xi, dy = ly[j] - yi, d2 = dx * dx + dy * dy;
          if (d2 >= rr * rr) continue;
          if (i < j) hitPair(i, j, dx, dy, d2, rr); else hitPair(j, i, -dx, -dy, d2, rr);
          si = 0; xi = lx[i]; yi = ly[i]; bottom = yi + ri;
        }
        if (fused && slp[i] === 0) {
          if (i !== 0 && (yi > oy2 || xi < ox1 || xi > ox2 || yi < oy1)) {
            AL[i] = 0; dead = true;
            if (kd[i] === K_CAT) wCatOut++;
            if (REC) emit(T_OUT, i, 0);
          } else if (mv[i] !== 0) {
            mv[i] = 0; aw2[w++] = i;
            const vx = lvx[i], vy = lvy[i];
            if (vx !== 0 || vy !== 0) { const q4 = 4 * (vx * vx + vy * vy), r2 = ri * ri; while (nn < SUB_MAX && q4 > nn * nn * r2) nn++; }
          } else slp[i] = 1;
        }
      }
    }
    if (fused) { AWK = AWK2; AWK2 = aw; }
    else {
      for (let q = 0; q < NA; q++) {
        const i = aw[q], x = lx[i], y = ly[i];
        if (i !== 0 && (y > oy2 || x < ox1 || x > ox2 || y < oy1)) {
          AL[i] = 0; dead = true;
          if (kd[i] === K_CAT) wCatOut++;
          if (REC) emit(T_OUT, i, 0);
        } else if (mv[i] !== 0) {
          mv[i] = 0; aw[w++] = i;
          const vx = lvx[i], vy = lvy[i];
          if (vx !== 0 || vy !== 0) { const q4 = 4 * (vx * vx + vy * vy), r = lr[i], r2 = r * r; while (nn < SUB_MAX && q4 > nn * nn * r2) nn++; }
        } else slp[i] = 1;
      }
    }
    NA = w; NSUB = nn;
    if (dead) {
      const nl = NL;
      let m = 0;
      for (let a = 0; a < nl; a++) { const i = lv[a]; if (AL[i] !== 0) { lv[m] = i; sk[m] = sk[a]; pos[i] = m; m++; } }
      NL = m;
    }
    wTick++;
    if (ly[0] > GOAL_Y) wOut = 1;
    else if (wTick >= LIMIT) wOut = 2;
    else if (wLeft === 0 && (lvx[0] * lvx[0] + lvy[0] * lvy[0]) * HZ * HZ < STUCK2) wOut = 3;
  }
  function wThrow(item, dir, power) {
    const def = ITEMS[item], g = def.g, M = G[0];
    const w = Math.trunc(CONFIG.W_MAX * power / CONFIG.POWERS);
    const ux = DIRX[dir], uy = DIRY[dir];
    const wx = Math.trunc(w * ux / NS), wy = Math.trunc(w * uy / NS);
    let vx = VX[0] - Math.trunc(g * wx / M), vy = VY[0] - Math.trunc(g * wy / M);
    vx = vx > V_CAP ? V_CAP : vx < -V_CAP ? -V_CAP : vx;
    vy = vy > V_CAP ? V_CAP : vy < -V_CAP ? -V_CAP : vy;
    VX[0] = vx; VY[0] = vy; G[0] = M - g; MV[0] = 1;
    if (SLP[0] !== 0) { SLP[0] = 0; AWK[NA++] = 0; }
    const i = N++;
    const r = def.r * UM;
    AL[i] = 1; KD[i] = K_ITEM; IT[i] = item; SLP[i] = 0; MV[i] = 1;
    POS[i] = NL; LIVE[NL++] = i; AWK[NA++] = i;
    RR[i] = r; RC[i] = Math.trunc(r / 2) + 2; GB[i] = gridBase(r); G[i] = g;
    if (2 * r > RMAX2) RMAX2 = 2 * r;
    const off = RR[0] + r + CONFIG.THROW_GAP * UM;
    const tx = Math.trunc(off * ux / NS), ty = Math.trunc(off * uy / NS);
    let m = 1;
    while (4 * (tx * tx + ty * ty) > m * m * r * r) m++;
    X[i] = X[0]; Y[i] = Y[0]; VX[i] = 0; VY[i] = 0;
    const rec = REC; REC = false;
    for (let k = 0; k < m; k++) {
      const x0 = X[i], y0 = Y[i];
      X[i] = x0 + Math.trunc(tx * (k + 1) / m) - Math.trunc(tx * k / m);
      Y[i] = y0 + Math.trunc(ty * (k + 1) / m) - Math.trunc(ty * k / m);
      fixStatic(i, x0, y0);
    }
    REC = rec;
    SK[POS[i]] = Y[i] - r;
    vx += wx; vy += wy;
    VX[i] = vx > V_CAP ? V_CAP : vx < -V_CAP ? -V_CAP : vx;
    VY[i] = vy > V_CAP ? V_CAP : vy < -V_CAP ? -V_CAP : vy;
    wLeft--;
    subAll();
    return i;
  }
  function mkBody(id, kind, item, x, y, vx, vy, r, g) { return { id, kind, item, x, y, vx, vy, r, g, alive: true }; }
  function createState(layout) {
    geomOf(layout);
    let carry = 0;
    for (const it of ITEMS) carry += it.g * it.n;
    const bodies = [mkBody(0, 'player', -1, layout.start.x * UM, layout.start.y * UM, 0, 0, CONFIG.PLAYER_R * UM, CONFIG.BODY_G + carry)];
    const lb = layout.bodies || [];
    for (let i = 0; i < lb.length; i++) bodies.push(mkBody(i + 1, lb[i].kind, -1, lb[i].x * UM, lb[i].y * UM, 0, 0, lb[i].r * UM, lb[i].g));
    return {
      ver: CONFIG.VER, tick: 0, over: false, outcome: null,
      bodies, inv: ITEMS.map((it) => it.n), log: [], events: [],
      layout,
      catUm: 0,
      catOut: 0,
      touch: [],
    };
  }
  function clone(state) {
    const bodies = new Array(state.bodies.length);
    for (let i = 0; i < bodies.length; i++) {
      const b = state.bodies[i];
      bodies[i] = { id: b.id, kind: b.kind, item: b.item, x: b.x, y: b.y, vx: b.vx, vy: b.vy, r: b.r, g: b.g, alive: b.alive };
    }
    return {
      ver: state.ver, tick: state.tick, over: state.over, outcome: state.outcome,
      bodies, inv: state.inv.slice(), log: state.log.map((e) => e.slice()), events: state.events.map((e) => Object.assign({}, e)),
      layout: state.layout,
      catUm: state.catUm, catOut: state.catOut, touch: state.touch.slice(),
    };
  }
  function advance(state, keep) {
    load(state);
    REC = true; STAT = !keep;
    const tc = state.touch;
    NCT = tc.length < TC_MAX ? tc.length : TC_MAX;
    for (let i = 0; i < NCT; i++) CT[i] = tc[i];
    const t0 = wTick, cats0 = wCatOut, px = X[0], py = Y[0];
    tick();
    REC = false;
    if (keep) {
      wTick = t0; wCatOut = cats0; wOut = 0;
      const park = CONFIG.AFTER_PARK * UM, L = state.layout;
      if (px < -park || px > L.w * UM + park || py < -park || py > L.h * UM + park) { X[0] = px; Y[0] = py; }
    }
    store(state);
    if (tc.length !== 0 || NCT !== 0) { tc.length = 0; for (let i = 0; i < NCT; i++) tc.push(CT[i]); }
    const ev = state.events;
    ev.length = 0;
    for (let e = 0; e < NE; e++) {
      const t = EVT[e];
      if (t === T_HIT) ev.push({ t: 'hit', a: EVA[e], b: EVB[e], s: EVS[e] < 0 ? null : GEO.names[EVS[e]], x: EVX[e], y: EVY[e], v: EVV[e] });
      else if (t === T_CAT) ev.push({ t: 'cat', id: EVA[e], v: EVV[e] });
      else ev.push({ t: 'out', id: EVA[e], kind: state.bodies[EVA[e]].kind });
    }
    if (wOut !== 0) ev.push({ t: 'end', outcome: OUTCOMES[wOut] });
  }
  function step(state) {
    if (state.over) return;
    advance(state, false);
  }
  function stepAfter(state) {
    if (!state.over) return;
    advance(state, true);
  }
  function canThrow(state, item, dir, power) {
    if (state.over) return false;
    if (!isInt(item) || item < 0 || item >= ITEMS.length) return false;
    if (!isInt(dir) || dir < 0 || dir >= CONFIG.DIRS) return false;
    if (!isInt(power) || power < CONFIG.MIN_POWER || power > CONFIG.POWERS) return false;
    if (!(state.inv[item] > 0)) return false;
    const log = state.log;
    if (log.length !== 0 && log[log.length - 1][0] >= state.tick) return false;
    return true;
  }
  function throwItem(state, item, dir, power) {
    if (!canThrow(state, item, dir, power)) return false;
    load(state);
    REC = false; STAT = false;
    const i = wThrow(item, dir, power);
    store(state);
    state.inv[item]--;
    state.log.push([state.tick, item, dir, power]);
    state.events.push({ t: 'throw', id: i, item, dir, power });
    return true;
  }
  function previewDv(state, item, power) {
    const def = ITEMS[item];
    if (!def) return 0;
    const w = Math.trunc(CONFIG.W_MAX * power / CONFIG.POWERS);
    return Math.trunc(def.g * w / state.bodies[0].g);
  }
  function predict(state, item, dir, power, ticks, stride, out) {
    const cap = out.length >> 1;
    if (cap < 1) return 0;
    const p = state.bodies[0];
    out[0] = p.x; out[1] = p.y;
    if (state.over) return 1;
    if (!(stride >= 1)) stride = 1;
    load(state);
    REC = false; STAT = false;
    if (canThrow(state, item, dir, power)) wThrow(item, dir, power);
    let np = 1;
    for (let t = 1; t <= ticks && np < cap; t++) {
      tick();
      if (wOut !== 0 || t % stride === 0) { out[np * 2] = X[0]; out[np * 2 + 1] = Y[0]; np++; }
      if (wOut !== 0) break;
    }
    return np;
  }
  function summary(state) {
    const p = state.bodies[0], L = state.layout;
    const dx = p.x - (L.door.x1 + L.door.x2) * (UM / 2), dy = p.y - L.h * UM;
    const thrown = new Array(state.log.length);
    for (let i = 0; i < thrown.length; i++) thrown[i] = state.log[i][1];
    return {
      outcome: state.outcome,
      ticks: state.tick,
      tenths: Math.floor(state.tick / (HZ / 10)),
      throws: state.log.length,
      thrown,
      distDoor: Math.trunc(isqrt(dx * dx + dy * dy) / UM),
      catDist: Math.trunc(state.catUm / UM),
      catOut: state.catOut,
      randoLeft: state.inv[RANDO] === 0,
    };
  }
  function simulate(layout, log, opt) {
    const bad = (reason) => ({ ok: false, reason });
    let state;
    try { state = createState(layout); } catch (e) { return bad('layout'); }
    if (!Array.isArray(log)) return bad('log');
    let total = 0;
    for (const it of ITEMS) total += it.n;
    if (log.length > total) return bad('too_many');
    const inv = state.inv.slice();
    let prev = -1;
    for (let k = 0; k < log.length; k++) {
      const e = log[k];
      if (!Array.isArray(e) || e.length !== 4 || !isInt(e[0]) || !isInt(e[1]) || !isInt(e[2]) || !isInt(e[3])) return bad('entry');
      if (e[0] < 0 || e[0] <= prev) return bad('time_order');
      if (e[0] >= LIMIT) return bad('time_limit');
      if (e[1] < 0 || e[1] >= ITEMS.length) return bad('item');
      if (e[2] < 0 || e[2] >= CONFIG.DIRS) return bad('dir');
      if (e[3] < CONFIG.MIN_POWER || e[3] > CONFIG.POWERS) return bad('power');
      if (inv[e[1]] <= 0) return bad('no_item');
      inv[e[1]]--; prev = e[0];
    }
    if (log.length !== 0 && log[0][0] !== 0) return bad('first_tick');
    const stride = opt && opt.stride >= 1 ? opt.stride : 0;
    const out = stride ? opt.out : null, cap = out ? out.length >> 1 : 0;
    const maxTicks = opt && opt.maxTicks >= 0 && opt.maxTicks < LIMIT ? opt.maxTicks : LIMIT;
    let np = 0;
    load(state);
    REC = false; STAT = true;
    if (np < cap) { out[0] = X[0]; out[1] = Y[0]; np = 1; }
    for (let k = 0; k <= log.length; k++) {
      const until = k < log.length && log[k][0] < maxTicks ? log[k][0] : maxTicks;
      while (wOut === 0 && wTick < until) {
        tick();
        if (np < cap && (wOut !== 0 || wTick % stride === 0)) { out[np * 2] = X[0]; out[np * 2 + 1] = Y[0]; np++; }
      }
      if (k === log.length || wTick >= maxTicks) break;
      if (wOut !== 0) return bad('after_end');
      wThrow(log[k][1], log[k][2], log[k][3]);
      state.inv[log[k][1]]--;
      state.log.push([log[k][0], log[k][1], log[k][2], log[k][3]]);
    }
    store(state);
    const res = summary(state);
    res.ok = true;
    if (stride) res.points = np;
    return res;
  }
  function speed(body) {
    return Math.trunc(isqrt((body.vx * body.vx + body.vy * body.vy) * 576) / 100);
  }
  function dirOf(dx, dy) {
    let best = 0, bv = -Infinity;
    for (let k = 0; k < 256; k++) {
      const v = dx * DIRX[k] + dy * DIRY[k];
      if (v > bv) { bv = v; best = k; }
    }
    return best;
  }
  function statics(layout) {
    const g = geomOf(layout), rects = [], circles = [];
    for (let i = 0; i < g.nR; i++) rects.push({ kind: g.names[i], x1: g.RX1[i] / UM, y1: g.RY1[i] / UM, x2: g.RX2[i] / UM, y2: g.RY2[i] / UM });
    for (let i = 0; i < g.nC; i++) circles.push({ kind: g.names[g.nR + i], x: g.CX[i] / UM, y: g.CY[i] / UM, r: g.CR[i] / UM });
    return { rects, circles };
  }
  const NFCore = {
    CONFIG, ITEMS, DIRX, DIRY,
    createState, step, throwItem, previewDv, predict, clone, simulate, summary, speed,
    stepAfter, canThrow, dirOf, checkLayout, statics,
    _internal: { isqrt, stats },
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = NFCore;
  else root.NFCore = NFCore;
})(typeof self !== 'undefined' ? self : this);
