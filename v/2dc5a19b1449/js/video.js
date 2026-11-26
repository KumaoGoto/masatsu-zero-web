import { HASHTAG, formatTenths } from './text.js';
import { COLORS, font, rr, drawLogo } from './card.js';
export const VIDEO = {
  w: 720, h: 1280,
  low: 0.75,
  fps: 30,
  bps: 3000000,
  house: { x: 28, y: 184, w: 664, h: 988, r: 40 },
  min: 6, max: 18,
  card: 1.4,
  cardFade: 0.28,
  lead: 0.35,
  endOut: 1.15, endFail: 0.9,
  maxSpeed: 4,
  capSec: 1.1,
};
const { INK, PAPER, SKY, MUTED } = COLORS;
export function videoSpeed(runSec, outcome) {
  const body = VIDEO.max - VIDEO.card - VIDEO.lead - (outcome === 'out' ? VIDEO.endOut : VIDEO.endFail) - 0.2;
  return Math.min(VIDEO.maxSpeed, Math.max(1, runSec / body));
}
export function videoSupport(withAudio) {
  try {
    if (typeof MediaRecorder !== 'function' || typeof MediaRecorder.isTypeSupported !== 'function') return null;
    if (typeof HTMLCanvasElement === 'undefined' || typeof HTMLCanvasElement.prototype.captureStream !== 'function') return null;
    const list = withAudio
      ? [['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'mp4'], ['video/mp4;codecs=avc1,mp4a.40.2', 'mp4'], ['video/mp4', 'mp4'], ['video/webm;codecs=vp9,opus', 'webm'], ['video/webm;codecs=vp8,opus', 'webm'], ['video/webm', 'webm']]
      : [['video/mp4;codecs=avc1.42E01E', 'mp4'], ['video/mp4;codecs=avc1', 'mp4'], ['video/mp4', 'mp4'], ['video/webm;codecs=vp9', 'webm'], ['video/webm;codecs=vp8', 'webm'], ['video/webm', 'webm']];
    for (const [mime, ext] of list) if (MediaRecorder.isTypeSupported(mime)) return { mime, ext, type: 'video/' + ext };
  } catch (e) {   }
  return null;
}
export function videoRegion(cssW, cssH) {
  const a = VIDEO.house.w / VIDEO.house.h;
  let w = cssW, h = cssW / a;
  if (h > cssH) { h = cssH; w = cssH * a; }
  return { x: (cssW - w) / 2, y: (cssH - h) / 2, w, h };
}
export function createVideo(o) {
  const k = o.low ? VIDEO.low : 1, W = VIDEO.w, H = VIDEO.h, HR = VIDEO.house;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * k); canvas.height = Math.round(H * k);
  const g = canvas.getContext('2d', { alpha: false });
  g.imageSmoothingQuality = k < 1 ? 'medium' : 'high';
  const over = document.createElement('canvas');
  over.width = canvas.width; over.height = canvas.height;
  {
    const c = over.getContext('2d');
    c.setTransform(k, 0, 0, k, 0, 0);
    const bg = c.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#fffdf8'); bg.addColorStop(1, '#ffecd4');
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    const sun = c.createRadialGradient(W - 60, -80, 0, W - 60, -80, 700);
    sun.addColorStop(0, 'rgba(255, 176, 96, .6)'); sun.addColorStop(0.45, 'rgba(255, 200, 140, .22)'); sun.addColorStop(1, 'rgba(255, 220, 180, 0)');
    c.fillStyle = sun; c.fillRect(0, 0, W, H);
    c.save();
    c.shadowColor = 'rgba(30, 39, 66, .3)'; c.shadowBlur = 36; c.shadowOffsetY = 16;
    c.fillStyle = '#fff'; rr(c, HR.x - 8, HR.y - 8, HR.w + 16, HR.h + 16, HR.r + 8); c.fill();
    c.restore();
    c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; rr(c, HR.x, HR.y, HR.w, HR.h, HR.r); c.fill(); c.restore();
    c.textBaseline = 'alphabetic';
    drawLogo(c, 36, 116, 58);
    c.font = font(700, 32); c.fillStyle = SKY; c.textAlign = 'right';
    c.fillText(HASHTAG, W - 36, H - 44);
    c.textAlign = 'left';
  }
  let rec = null, chunks = [], stream = null, t0 = 0, stopped = null, dead = false;
  function drawTime(tenths, speed) {
    const s = formatTenths(tenths), px = 86, cell = px * 0.56, dot = px * 0.28;
    g.textBaseline = 'alphabetic';
    g.font = font(900, 34); g.fillStyle = MUTED; g.textAlign = 'right';
    g.fillText('秒', W - 36, 118);
    let x = W - 36 - 40;
    g.font = font(900, px); g.fillStyle = INK; g.textAlign = 'center';
    for (let i = s.length - 1; i >= 0; i--) {
      const w = s[i] === '.' ? dot : cell;
      g.fillText(s[i], x - w / 2, 120);
      x -= w;
    }
    if (speed > 1.04) {
      g.font = font(900, 24); g.fillStyle = MUTED; g.textAlign = 'right';
      g.fillText((Math.round(speed * 10) / 10) + ' 倍速', W - 36, 160);
    }
    g.textAlign = 'left';
  }
  function drawCap(icon, name, a) {
    if (!(a > 0)) return;
    g.globalAlpha = a;
    const y = H - 86 + (1 - a) * 8;
    if (icon && icon.width) g.drawImage(icon, 30, y - 8, 68, 68);
    g.font = font(900, 34); g.fillStyle = INK; g.textBaseline = 'alphabetic';
    g.fillText(name, icon && icon.width ? 104 : 36, y + 40);
    g.globalAlpha = 1;
  }
  return {
    canvas,
    width: canvas.width, height: canvas.height,
    frame(f) {
      g.setTransform(k, 0, 0, k, 0, 0);
      if (f.card && f.cardA >= 1) { g.drawImage(f.card, 0, 0, W, H); return; }
      if (f.src && f.sw > 0) g.drawImage(f.src, f.sx, f.sy, f.sw, f.sh, HR.x, HR.y, HR.w, HR.h);
      else { g.fillStyle = '#f0d5a4'; g.fillRect(HR.x, HR.y, HR.w, HR.h); }
      g.drawImage(over, 0, 0, W, H);
      drawTime(f.tenths, f.speed);
      if (f.cap) drawCap(f.cap.icon, f.cap.name, f.cap.a);
      if (f.card && f.cardA > 0) { g.globalAlpha = f.cardA; g.drawImage(f.card, 0, 0, W, H); g.globalAlpha = 1; }
    },
    begin() {
      if (rec || dead) return false;
      try {
        stream = canvas.captureStream(VIDEO.fps);
        if (o.audio && typeof o.audio.getAudioTracks === 'function') for (const t of o.audio.getAudioTracks()) stream.addTrack(t);
        rec = new MediaRecorder(stream, { mimeType: o.format.mime, videoBitsPerSecond: Math.round(VIDEO.bps * k * k), audioBitsPerSecond: 128000 });
        chunks = [];
        rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
        stopped = new Promise((res) => { rec.onstop = () => res(true); rec.onerror = () => res(false); });
        rec.start();
        t0 = performance.now();
        return true;
      } catch (e) { rec = null; dead = true; return false; }
    },
    get recording() { return !!rec && rec.state === 'recording'; },
    async finish() {
      if (!rec) return null;
      const ms = performance.now() - t0, r = rec;
      try { if (r.state !== 'inactive') r.stop(); } catch (e) {   }
      const ok = await stopped;
      this.release();
      if (!ok || !chunks.length || dead) return null;
      const blob = new Blob(chunks, { type: o.format.type });
      chunks = [];
      return blob.size ? { blob, type: o.format.type, ext: o.format.ext, ms } : null;
    },
    abort() {
      dead = true;
      try { if (rec && rec.state !== 'inactive') rec.stop(); } catch (e) {   }
      chunks = [];
      this.release();
      this.dispose();
    },
    dispose() {
      canvas.width = canvas.height = 0;
      over.width = over.height = 0;
    },
    release() {
      try { if (stream) for (const t of stream.getVideoTracks()) t.stop(); } catch (e) {   }
      stream = null; rec = null;
    },
  };
}
