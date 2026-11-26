export let LIMIT_TENTHS = 600;
export function useLimit(config) {
  const t = config && Number.isInteger(config.LIMIT_TICKS) && config.LIMIT_TICKS > 0 ? config.LIMIT_TICKS : 0;
  if (t) LIMIT_TENTHS = Math.round(t / 24);
  return LIMIT_TENTHS;
}
useLimit(typeof globalThis !== 'undefined' && globalThis.NFCore ? globalThis.NFCore.CONFIG : null);
export function limitSec() { return Math.round(LIMIT_TENTHS / 10); }
export const HASHTAG = '#摩擦ゼロの朝';
export const TITLE = '摩擦ゼロの朝';
export const TAGLINE = 'ある朝、世界から摩擦が消えた。';
export const TRUTH = '歩けるのは、足と床のあいだに摩擦があるから。摩擦がないと、物を投げた反動（作用・反作用）でしか動けない。重い物を投げるほど、大きく動く。';
export const HINTS = {
  first: '下で物を選んで、画面を指で引っぱって離す',
  after: 'ぶつかるまで止まれない。次の物で向きを変えよう',
  ready: '行きたい方へ引っぱって離す',
  readyOpp: '引っぱって離すと、反対へ飛び出す',
};
export const PULLS = { same: 'ロケット式（行きたい方へ引く）', opposite: 'パチンコ式（引いて離すと反対へ飛び出す）', mark: '標準', def: 'same' };
export const PULL_NOTE = { same: '物を後ろに投げて、その反動で進む', opposite: '物は引いた向きへ飛び、自分は反対へ' };
export function pullMode(v) { return v === 'same' || v === 'opposite' ? v : PULLS.def; }
export function readyHint(mode) { return pullMode(mode) === 'same' ? HINTS.ready : HINTS.readyOpp; }
export const COACH = {
  same: { main: '行きたい方へ引く', sub: '物を後ろに投げて進む' },
  opposite: { main: '引いた反対へ 飛び出す', sub: '物は引いた向きへ' },
};
export const HOWTO_PULL = {
  same: { h: '行きたい方へ、引っぱって離す', p: '物を後ろに投げて、その反動で進む。', pull: '引く', item: '物は後ろへ', self: '前へ進む' },
  opposite: { h: '引っぱって離すと、反対へ飛び出す', p: '物は引いた向きへ飛び、その反動で、自分は反対へ飛び出す。', pull: '引く', item: '物は引いた向きへ', self: '反対へ飛び出す' },
};
export const FAIL = { title: 'この端末では絵を出せませんでした', sub: 'ブラウザを新しくするか、ほかの端末で開いてみてください。', button: '読み直す' };
export let ITEMS = [];
let BY_ID = {};
export function useItems(list) {
  ITEMS = (list || []).map((it) => ({ id: it.id, name: it.name, g: it.g, n: it.n }));
  BY_ID = Object.fromEntries(ITEMS.map((it, i) => [it.id, { ...it, i }]));
  return ITEMS;
}
useItems(typeof globalThis !== 'undefined' && globalThis.NFCore ? globalThis.NFCore.ITEMS : []);
export const MEDALS = ['gold', 'silver', 'bronze'];
export const MEDAL_NAME = { gold: '金', silver: '銀', bronze: '銅' };
const DAYS = '月火水木金土日';
export function formatTenths(t) {
  const v = Math.max(0, Math.round(Number(t) || 0));
  return Math.floor(v / 10) + '.' + (v % 10);
}
export function weightLabel(g) {
  const v = Math.max(0, Number(g) || 0);
  if (v < 1000) return Math.round(v) + 'g';
  return String(Math.round(v / 10) / 100) + 'kg';
}
export function formatMeters(m) {
  return formatTenths(Math.round(Math.max(0, Number(m) || 0) * 10));
}
export function dayLabel(day) {
  if (!day) return '';
  const s = String(day);
  if (s.length === 1 && DAYS.includes(s)) return s + '曜日';
  if (/^.曜$/.test(s)) return s + '日';
  return s;
}
export function normThrown(thrown) {
  const out = [];
  const at = new Map();
  for (const t of thrown || []) {
    let id, name, n = 1;
    if (typeof t === 'number') { const it = ITEMS[t]; if (!it) continue; id = it.id; name = it.name; }
    else if (typeof t === 'string') { const it = BY_ID[t]; id = t; name = it ? it.name : t; }
    else if (t && typeof t === 'object') { id = t.id; name = t.name || (BY_ID[t.id] && BY_ID[t.id].name) || String(t.id); n = t.n == null ? 1 : t.n; }
    else continue;
    if (n <= 0) continue;
    if (at.has(id)) out[at.get(id)].n += n;
    else { at.set(id, out.length); out.push({ id, name, n }); }
  }
  return out;
}
function threwRando(r) {
  if (r && r.thrown) return normThrown(r.thrown).some((t) => t.id === 'rando');
  return !!(r && r.randoLeft);
}
function throwCount(r) {
  if (r && r.throws != null) return r.throws;
  return normThrown(r && r.thrown).reduce((s, t) => s + t.n, 0);
}
export function thrownList(thrown) {
  const list = normThrown(thrown).map((t) => t.name + (t.n > 1 ? ' ×' + t.n : '')).join('、');
  return '投げた物：' + (list || 'なし');
}
export function resultHeadlineParts(r) {
  if (r.outcome === 'out') return [{ t: formatTenths(r.tenths), k: 'num' }, { t: ' 秒で' }, { t: '家を出た' }];
  const m = formatMeters(r.dist);
  if (r.outcome === 'late') return [{ t: '遅刻！', k: 'lead' }, { t: ' ', k: 'br' }, { t: '玄関まで あと ' }, { t: m, k: 'num' }, { t: ' m' }];
  return [{ t: '止まってしまった…', k: 'lead' }, { t: ' ', k: 'br' }, { t: 'もう投げる物がない（玄関まで ' }, { t: m, k: 'num' }, { t: ' m）' }];
}
export function resultHeadline(r) {
  return resultHeadlineParts(r).map((p) => p.t).join('');
}
export function catLine(r) {
  const cats = r.cats == null ? 1 : r.cats;
  if (!cats) return null;
  const out = typeof r.catOut === 'number' ? r.catOut : (r.catOut ? 1 : 0);
  if (out >= 2) return `ねこが ${out} 匹 外へすべっていった`;
  if (out === 1) return 'ねこも外へすべっていった';
  const d = Math.max(0, Number(r.catDist) || 0), who = cats > 1 ? 'ねこたちは' : 'ねこは';
  if (d < 0.05) return `${who} すべらずにすんだ`;
  return cats > 1 ? `${who} 合わせて ${formatMeters(d)} m すべった` : `${who} ${formatMeters(d)} m すべった`;
}
export function smashLine(r) {
  const p = smashParts(r);
  return p ? p.join('・') : null;
}
export function smashParts(r) {
  const n = Math.max(0, Math.round(Number(r && r.smashed) || 0)), best = Math.max(0, Math.round(Number(r && r.smashBest) || 0));
  if (!n) return null;
  return best >= 2 ? [`ぶっ飛ばした物 ${n} 個`, `最大 ${best} コ ぶっ飛ばし`] : [`ぶっ飛ばした物 ${n} 個`];
}
export function randoLine(r) {
  return threwRando(r) ? 'ランドセルは家に置いてきた' : null;
}
export function medalFor(tenths, times) {
  if (!times || tenths == null) return null;
  for (const m of MEDALS) if (times[m] != null && tenths <= times[m]) return m;
  return null;
}
export function nextMedal(tenths, times, medal) {
  if (!times || tenths == null) return null;
  const have = medal === undefined ? medalFor(tenths, times) : medal;
  const order = ['bronze', 'silver', 'gold'];
  const from = have ? order.indexOf(have) + 1 : 0;
  for (let i = from; i < order.length; i++) {
    const m = order[i];
    if (times[m] != null && times[m] < tenths) return { medal: m, diff: tenths - times[m] };
  }
  return null;
}
export function nextMedalText(tenths, times, medal) {
  const n = nextMedal(tenths, times, medal);
  if (!n) return null;
  return `${MEDAL_NAME[n.medal]}まで あと ${formatTenths(n.diff)} 秒`;
}
export function shareText(r, url) {
  let s;
  if (r.outcome === 'out') {
    const rando = threwRando(r);
    let kinds = normThrown(r.thrown);
    if (rando && kinds.length > 1) kinds = kinds.filter((t) => t.id !== 'rando');
    const names = kinds.map((t) => t.name);
    const what = names.length > 2 ? names.slice(0, 2).join('と') + 'など' : names.join('と');
    const bonus = rando ? 'ランドセルは家に置いてきた' : `投げた数 ${throwCount(r)}`;
    s = `🧦 ${TITLE}：${what}を投げて、${formatTenths(r.tenths)} 秒で家を出た（${bonus}）${HASHTAG}`;
  } else {
    s = `🧦 ${TITLE}：${throwCount(r)} 個投げたのに、すべり続けて遅刻した（玄関まで あと ${formatMeters(r.dist)}m）${HASHTAG}`;
  }
  return url ? s + '\n' + url : s;
}
