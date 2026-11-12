// Âm thanh thao tác và hiện tượng – tự tổng hợp bằng Web Audio (không cần tệp âm thanh)
// sfx('ten')  : tiếng ngắn (bấm, rót, sủi, va chạm…)
// level('ten', 0..1) : tiếng nền liên tục (sủi bọt, ngọn lửa, sôi, nước chảy…), gọi lại để đổi độ lớn
let C = null, OUT = null, MUTE = false;
try { MUTE = localStorage.getItem('sfxMute') == '1'; } catch (e) { }
const listeners = [];

export function ctx() {
  if (!C) {
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return null;
    C = new A(); OUT = C.createGain(); OUT.gain.value = MUTE ? 0 : .8;
    const comp = C.createDynamicsCompressor(); OUT.connect(comp); comp.connect(C.destination);
  }
  if (C.state == 'suspended') C.resume();
  return C;
}
export const out = () => (ctx(), OUT);
export const isMuted = () => MUTE;
export function setMuted(v) { MUTE = v; try { localStorage.setItem('sfxMute', v ? '1' : '0'); } catch (e) { } if (OUT) OUT.gain.setTargetAtTime(v ? 0 : .8, C.currentTime, .05); listeners.forEach(f => f(v)); }
export function onMute(f) { listeners.push(f); f(MUTE); }
// mở khoá âm thanh ở lần chạm đầu tiên (bắt buộc trên điện thoại)
const unlock = () => { const c = ctx(); if (c) { const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } };
['pointerdown', 'touchend', 'keydown'].forEach(e => addEventListener(e, unlock, { capture: true, passive: true }));
document.addEventListener('visibilitychange', () => { if (!C) return; document.hidden ? C.suspend() : C.resume(); });

/* ---------- tiện ích ---------- */
const BUF = {};
function buf(key, sec, fn) {
  if (BUF[key]) return BUF[key];
  const c = ctx(), n = Math.floor(c.sampleRate * sec), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  fn(d, c.sampleRate); let m = 0; for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(d[i])); if (m > 0) for (let i = 0; i < n; i++) d[i] /= m;
  return BUF[key] = b;
}
const R = Math.random;
const white = () => buf('white', 2, d => { for (let i = 0; i < d.length; i++) d[i] = R() * 2 - 1; });
function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(0, t + a, dec); }
function noise(t, dur, { type = 'bandpass', f = 1000, f2, Q = 1, peak = .3, a = .003, dec, rate = 1 } = {}) {
  const c = C, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
  s.buffer = white(); s.playbackRate.value = rate; fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur); fl.Q.value = Q;
  env(g, t, a, peak, dec ?? dur / 3); s.connect(fl); fl.connect(g); g.connect(OUT); s.start(t, R() * 1.5); s.stop(t + dur + .3);
}
function osc(t, dur, { type = 'sine', f = 440, f2, peak = .2, a = .002, dec, vib } = {}) {
  const c = C, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = vib[0]; lg.gain.value = vib[1]; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + .3); }
  env(g, t, a, peak, dec ?? dur / 3); o.connect(g); g.connect(OUT); o.start(t); o.stop(t + dur + .3);
}
function bell(t, fs, peak, dec) { fs.forEach((f, i) => osc(t, dec * 4, { f: f * (1 + (R() - .5) * .01), peak: peak / (i + 1), dec })); }

/* ---------- tiếng ngắn ---------- */
const SHOT = {
  click: t => noise(t, .02, { f: 2600, Q: 2, peak: .18 }),
  tap: t => { osc(t, .05, { f: 900, f2: 700, peak: .08 }); noise(t, .02, { f: 3000, Q: 1.5, peak: .1 }); },
  toggle: t => { noise(t, .02, { type: 'lowpass', f: 2500, peak: .35 }); noise(t + .035, .02, { type: 'lowpass', f: 1800, peak: .25 }); },
  clack: t => { noise(t, .05, { type: 'lowpass', f: 1400, peak: .45 }); osc(t, .06, { f: 140, f2: 80, peak: .25 }); },
  grab: t => noise(t, .1, { f: 600, f2: 1600, Q: .8, peak: .08, a: .02 }),
  drop: t => { osc(t, .08, { f: 150, f2: 70, peak: .25 }); noise(t, .03, { type: 'lowpass', f: 1500, peak: .15 }); },
  thud: t => { osc(t, .18, { f: 95, f2: 45, peak: .55 }); noise(t, .08, { type: 'lowpass', f: 500, peak: .3 }); },
  clink: t => { bell(t, [2350, 3480, 5250], .18, .08); noise(t, .01, { type: 'highpass', f: 5000, peak: .1 }); },
  metal: t => bell(t, [1250, 2760, 4120], .15, .12),
  drip: t => { osc(t, .05, { f: 500, f2: 1500, peak: .25, dec: .02 }); },
  plop: t => osc(t, .08, { f: 260, f2: 900, peak: .25, dec: .03 }),
  pop: t => osc(t, .03, { f: 1100, f2: 2300, peak: .12, dec: .01 }),
  sprinkle: t => { for (let i = 0; i < 16; i++) noise(t + R() * .45, .012, { type: 'highpass', f: 4000 + R() * 3000, peak: .06 + R() * .06 }); },
  whoosh: t => noise(t, .45, { f: 300, f2: 2200, Q: .7, peak: .35, a: .08, dec: .15 }),
  match: t => { noise(t, .18, { f: 3500, Q: 1.2, peak: .25, a: .01 }); noise(t + .12, .4, { f: 400, f2: 1400, Q: .7, peak: .25, a: .05 }); },
  puff: t => noise(t, .25, { type: 'lowpass', f: 900, f2: 300, peak: .25, a: .01 }),
  beep: t => osc(t, .07, { type: 'square', f: 2700, peak: .06, dec: .02 }),
  beep2: t => { osc(t, .06, { type: 'square', f: 2000, peak: .05, dec: .02 }); osc(t + .09, .06, { type: 'square', f: 2600, peak: .05, dec: .02 }); },
  chime: t => { bell(t, [880, 1760], .16, .25); bell(t + .12, [1320, 2640], .14, .3); },
  error: t => { osc(t, .14, { type: 'square', f: 190, peak: .06, dec: .06 }); osc(t + .16, .14, { type: 'square', f: 150, peak: .06, dec: .06 }); },
  boing: t => osc(t, .7, { f: 230, f2: 160, peak: .25, vib: [11, 30], dec: .22 }),
  snap: t => { noise(t, .02, { type: 'highpass', f: 2000, peak: .3 }); bell(t, [1800, 3100], .08, .05); },
  spark: t => { for (let i = 0; i < 8; i++) noise(t + R() * .2, .015, { type: 'highpass', f: 3000, peak: .15 + R() * .15 }); },
  splash: t => noise(t, .6, { type: 'lowpass', f: 2400, f2: 350, peak: .3, a: .01, dec: .2 }),
  rattle: t => { for (let i = 0; i < 14; i++) { noise(t + i * .07, .025, { f: 2200 + R() * 800, Q: 2, peak: .12 }); bell(t + i * .07 + .02, [2600 + R() * 400], .03, .03); } },
  slide: t => noise(t, .3, { f: 900, Q: 2, peak: .12, a: .03 }),
  tick: t => noise(t, .015, { f: 3200, Q: 3, peak: .2 }),
  ratchet: t => { for (let i = 0; i < 3; i++) noise(t + i * .045, .015, { f: 2800, Q: 3, peak: .14 }); },
  paper: t => noise(t, .25, { f: 3000, Q: .5, peak: .08, a: .03 }),
  swish: t => noise(t, .25, { f: 500, f2: 2500, Q: 1, peak: .12, a: .05 }),
};
const lastShot = {};
export function sfx(name, { vol = 1, delay = 0 } = {}) {
  if (!C || MUTE) return;
  const f = SHOT[name]; if (!f) return; const now = performance.now(); if (lastShot[name] && now - lastShot[name] < 35) return; lastShot[name] = now;
  if (vol != 1) { const g = C.createGain(); g.gain.value = vol; g.connect(OUT); const o = OUT; OUT = g; try { f(C.currentTime + delay); } finally { OUT = o; } }
  else f(C.currentTime + delay);
}

/* ---------- tiếng nền liên tục ---------- */
function burst(d, sr, rate, fmin, fmax, dec) { // nhiều tiếng "lục bục" nhỏ ngẫu nhiên
  for (let k = 0; k < d.length / sr * rate; k++) { const s0 = Math.floor(R() * d.length), f = fmin + R() * (fmax - fmin), a = .3 + R() * .7, L = Math.floor(sr * dec * (.5 + R()));
    for (let i = 0; i < L && s0 + i < d.length; i++) { const t = i / sr; d[s0 + i] += a * Math.sin(2 * Math.PI * f * t * (1 + t * 8)) * Math.exp(-i / (sr * dec * .3)); } }
}
const LOOP = {
  fizz: () => ({ b: buf('fizz', 2, (d, sr) => { burst(d, sr, 260, 2500, 6000, .006); for (let i = 0; i < d.length; i++) d[i] += (R() * 2 - 1) * .05; }), f: ['highpass', 1800], g: .35 }),
  boil: () => ({ b: buf('boil', 3, (d, sr) => { burst(d, sr, 45, 180, 520, .03); let y = 0; for (let i = 0; i < d.length; i++) { y += ((R() * 2 - 1) - y) * .02; d[i] += y * 1.2; } }), f: ['lowpass', 1600], g: .6 }),
  flame: () => ({ b: buf('flame', 2, (d, sr) => { let y = 0; for (let i = 0; i < d.length; i++) { y += ((R() * 2 - 1) - y) * .06; d[i] = y; } burst(d, sr, 6, 1500, 3500, .004); }), f: ['lowpass', 900], g: .35 }),
  burner: () => ({ b: white(), f: ['lowpass', 380], g: .22 }),
  pour: () => ({ b: buf('pour', 2, (d, sr) => { for (let i = 0; i < d.length; i++) { const t = i / sr; d[i] = (R() * 2 - 1) * (.55 + .45 * Math.sin(t * 2 * Math.PI * 7 + Math.sin(t * 13) * 2)); } burst(d, sr, 30, 400, 1200, .02); }), f: ['bandpass', 1000, .7], g: .3 }),
  stream: () => ({ b: buf('stream', 2, (d, sr) => { for (let i = 0; i < d.length; i++) d[i] = (R() * 2 - 1) * .4; burst(d, sr, 120, 1200, 3500, .006); }), f: ['bandpass', 2200, .8], g: .25 }),
  steam: () => ({ b: white(), f: ['highpass', 2500], g: .1 }),
  roll: () => ({ b: buf('roll', 2, (d, sr) => { let y = 0; for (let i = 0; i < d.length; i++) { y += ((R() * 2 - 1) - y) * .05; d[i] = y * (1 + .3 * Math.sin(i / sr * 2 * Math.PI * 23)); } }), f: ['lowpass', 500], g: .5 }),
  scrape: () => ({ b: white(), f: ['bandpass', 750, 1.5], g: .22 }),
  hum: () => ({ osc: [[100, .5], [200, .3], [300, .1]], g: .05 }),
  buzz: () => ({ osc: [[120, .5, 'sawtooth']], f: ['lowpass', 900], g: .05 }),
  motor: () => ({ osc: [[95, .6, 'sawtooth'], [190, .3, 'square']], f: ['lowpass', 700], g: .06 }),
  wind: () => ({ b: white(), f: ['bandpass', 500, .5], g: .2 }),
};
const L = {};
function make(name) {
  const spec = LOOP[name](), c = C, g = c.createGain(); g.gain.value = 0;
  let node = g; if (spec.f) { const fl = c.createBiquadFilter(); fl.type = spec.f[0]; fl.frequency.value = spec.f[1]; if (spec.f[2]) fl.Q.value = spec.f[2]; fl.connect(g); node = fl; }
  const srcs = [];
  if (spec.b) { const s = c.createBufferSource(); s.buffer = spec.b; s.loop = true; s.connect(node); s.start(0, R() * spec.b.duration); srcs.push(s); }
  if (spec.osc) spec.osc.forEach(([f, a, type]) => { const o = c.createOscillator(), og = c.createGain(); o.type = type || 'sine'; o.frequency.value = f; og.gain.value = a; o.connect(og); og.connect(node); o.start(); srcs.push(o); });
  g.connect(OUT); return { g, srcs, base: spec.g, v: 0, rate: srcs[0] && srcs[0].playbackRate };
}
/** đặt độ lớn tiếng nền name (0 = tắt). pitch: hệ số cao độ (tuỳ chọn) */
export function level(name, v, pitch) {
  v = Math.max(0, Math.min(1, v || 0));
  if (!C) { if (!v || !ctx()) return; }
  let l = L[name]; if (!l) { if (!v) return; if (!LOOP[name]) return; l = L[name] = make(name); }
  if (Math.abs(l.v - v) < .01 && pitch == null) return; l.v = v;
  l.g.gain.setTargetAtTime(v * l.base, C.currentTime, .08);
  if (pitch && l.rate) l.rate.setTargetAtTime(pitch, C.currentTime, .1);
}
/** tổng hợp mức từ nhiều nguồn: mix('fizz', id, v) – lấy tổng các nguồn */
const MIX = {};
export function mix(name, id, v) { const m = MIX[name] || (MIX[name] = new Map()); if (v > 0) m.set(id, v); else m.delete(id); let s = 0; m.forEach(x => s += x); level(name, Math.min(1, s)); }
