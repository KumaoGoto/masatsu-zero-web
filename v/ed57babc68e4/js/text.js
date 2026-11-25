export const LIMIT_TENTHS = 600;
export const HASHTAG = '#摩擦ゼロの朝';
export const TITLE = '摩擦ゼロの朝';
export const TAGLINE = 'ある朝、世界から摩擦が消えた。';
export const TRUTH = '歩けるのは、足と床のあいだに摩擦があるから。摩擦がないと、物を投げた反動（作用・反作用）でしか動けない。重い物を投げるほど、大きく動く。';
export const HINTS = {
  first: '下で物を選んで、画面を指で引っぱって離す',
  after: 'すべって止まれない。また投げて、向きを変えよう',
  ready: '画面を引っぱって離すと、反対へすべる',
  readyInv: '引っぱって離すと、引いた向きへすべる',
  readySub: '投げたらスタート',
};
export const COACH = { self: '引いた反対へ すべる', selfInv: '引いた向きへ すべる', item: '物が飛ぶ' };
export const HOWTO_PULL = { h: '引っぱって離すと、反対へすべる', p: '物を投げた反動で動く。物は、引いた向きへ飛ぶ。', self: '反対へ すべる', item: '物' };
export const PULLS = { normal: '引いた反対へすべる', invert: '引いた向きへすべる', mark: '標準' };
export const VIEWS = [
  { id: 'near', name: '寄り', note: 'すべる間は大きく映す。引く間は家ぜんぶ' },
  { id: 'wide', name: '横いっぱい', note: '家を横いっぱいに映して、たてに追う' },
  { id: 'whole', name: '家ぜんぶ', note: 'いつも家ぜんぶを映す。物は小さめ' },
];
export const VIEW_DEFAULT = 'near';
export const DOOR_TIP = '玄関';
export const FAIL = { title: 'この端末では絵を出せませんでした', sub: 'ブラウザを新しくするか、ほかの端末で開いてみてください。', button: '読み直す' };
export const ITEMS = [
  { id: 'keshi', name: '消しゴム', g: 30, n: 1 },
  { id: 'kutsu', name: '靴下', g: 60, n: 2 },
  { id: 'toast', name: 'トースト', g: 80, n: 1 },
  { id: 'sumaho', name: 'スマホ', g: 200, n: 1 },
  { id: 'kyoka', name: '教科書', g: 500, n: 2 },
  { id: 'suito', name: '水筒', g: 800, n: 1 },
  { id: 'rando', name: 'ランドセル', g: 1400, n: 1 },
];
const BY_ID = Object.fromEntries(ITEMS.map((it, i) => [it.id, { ...it, i }]));
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
export function formatDv(dv) {
  const v = Math.max(0, Number(dv) || 0);
  return '+' + (Math.round(v * 100) / 100).toFixed(2);
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
export function captionParts(c) {
  return {
    name: c.name || '',
    weight: typeof c.weight === 'number' ? weightLabel(c.weight) : String(c.weight || ''),
    lead: 'いっぱいに引くと',
    dv: formatDv(c.dv) + ' m/秒',
  };
}
export function captionText(c) {
  const p = captionParts(c);
  return `${p.name} ${p.weight} ・ ${p.lead} ${p.dv}`;
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
