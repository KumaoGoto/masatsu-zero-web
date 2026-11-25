const PREFIX = 'nofriction.';
export const KEYS = {
  settings: 'settings',
  howto: 'howto',
  best: 'best.',
  daily: 'daily',
  plays: 'plays',
  intro: 'intro',
};
export function createStore(onFail) {
  const mem = new Map();
  let failed = false;
  let ls = null;
  try { ls = window.localStorage; } catch (e) { ls = null; }
  function fail() {
    if (failed) return;
    failed = true;
    try { if (typeof onFail === 'function') onFail(); } catch (e) {   }
  }
  function getRaw(key) {
    if (mem.has(key)) return mem.get(key);
    try { return ls ? ls.getItem(PREFIX + key) : null; } catch (e) { return null; }
  }
  function setRaw(key, value) {
    try {
      if (!ls) throw new Error('no storage');
      ls.setItem(PREFIX + key, value);
      mem.delete(key);
      return true;
    } catch (e) {
      mem.set(key, value);
      fail();
      return false;
    }
  }
  return {
    get(key, d = null) {
      const raw = getRaw(key);
      if (raw == null) return d;
      try { const v = JSON.parse(raw); return v == null ? d : v; } catch (e) { return d; }
    },
    set(key, value) { return setRaw(key, JSON.stringify(value)); },
    remove(key) {
      mem.delete(key);
      try { if (ls) ls.removeItem(PREFIX + key); } catch (e) {   }
    },
    owns(fullKey) { return fullKey == null || String(fullKey).startsWith(PREFIX); },
    get failed() { return failed; },
  };
}
export function better(a, b) {
  if (!b || typeof b.tenths !== 'number') return true;
  if (!a || typeof a.tenths !== 'number') return false;
  if (a.tenths !== b.tenths) return a.tenths < b.tenths;
  return (a.throws | 0) < (b.throws | 0);
}
export function validRecord(r) {
  return !!r && typeof r === 'object' && Number.isFinite(r.tenths) && r.tenths >= 0 && Number.isFinite(r.throws)
    && (r.log == null || Array.isArray(r.log));
}
