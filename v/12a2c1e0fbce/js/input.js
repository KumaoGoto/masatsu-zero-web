export function createPull(canvas, hooks) {
  const st = { active: false, x0: 0, y0: 0, x: 0, y: 0 };
  let id = null;
  function read(e) {
    let p = e;
    if (typeof e.getCoalescedEvents === 'function') {
      const list = e.getCoalescedEvents();
      if (list && list.length) p = list[list.length - 1];
    }
    st.x = p.clientX; st.y = p.clientY;
  }
  function drop(e) {
    const pid = id;
    id = null; st.active = false;
    try { if (e && canvas.hasPointerCapture && canvas.hasPointerCapture(pid)) canvas.releasePointerCapture(pid); } catch (err) {   }
  }
  canvas.addEventListener('pointerdown', (e) => {
    if (id !== null) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    if (!hooks.down(e.clientX, e.clientY)) return;
    id = e.pointerId;
    st.active = true; st.x0 = st.x = e.clientX; st.y0 = st.y = e.clientY;
    try { canvas.setPointerCapture(id); } catch (err) {   }
  });
  window.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id) return;
    read(e);
    if (e.pointerType === 'mouse' && (e.buttons & 1) === 0) { drop(e); hooks.up(st.x, st.y); }
  });
  window.addEventListener('pointerup', (e) => {
    if (e.pointerId !== id) return;
    st.x = e.clientX; st.y = e.clientY;
    drop(e);
    hooks.up(st.x, st.y);
  });
  const cancel = (e) => {
    if (id === null || (e && e.pointerId !== undefined && e.pointerId !== id)) return;
    drop(e);
    hooks.cancel();
  };
  window.addEventListener('pointercancel', cancel);
  canvas.addEventListener('lostpointercapture', cancel);
  window.addEventListener('blur', () => cancel(null));
  return {
    state: st,
    abort() { if (id !== null) drop(null); },
  };
}
export function guardGestures(canvas) {
  const ui = document.getElementById('ui');
  const mine = (t) => {
    if (t && t.nodeType !== 1) t = t.parentElement;
    if (!t || !t.closest) return false;
    if (t.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return false;
    return t === canvas || (!!ui && ui.contains(t)) || !!t.closest('#pull');
  };
  const stop = (e) => { if (mine(e.target)) e.preventDefault(); };
  document.addEventListener('contextmenu', stop);
  document.addEventListener('selectstart', stop);
  document.addEventListener('dragstart', stop);
  document.addEventListener('dblclick', stop);
  const always = (e) => { e.preventDefault(); };
  document.addEventListener('gesturestart', always);
  document.addEventListener('gesturechange', always);
  canvas.addEventListener('touchstart', always, { passive: false });
  canvas.addEventListener('touchmove', always, { passive: false });
  window.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
}
