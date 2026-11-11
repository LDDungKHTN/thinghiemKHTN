// Âm thanh thật (Web Audio) + máy dao động kí 3D
import { THREE, MAT, roundBox, canvasTex } from './lab3d.js';

let ctx = null, master = null;
export function audio() {
  if (!ctx) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ctx = new A(); master = ctx.createGain(); master.gain.value = .5; master.connect(ctx.destination); }
  if (ctx.state == 'suspended') ctx.resume();
  return ctx;
}
export const muted = { v: false };
/** Phát âm có tần số f (Hz), biên độ amp (0..1), tắt dần trong tau giây. Trả về {stop} */
export function tone(f, amp = .5, tau = 1.5, { type = 'sine', dur } = {}) {
  const c = audio(); if (!c || muted.v) return { stop() { } };
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime, D = dur || tau * 5;
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + .005); g.gain.setTargetAtTime(0, t + .01, tau);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + D);
  return { stop() { try { g.gain.cancelScheduledValues(c.currentTime); g.gain.setTargetAtTime(0, c.currentTime, .02); o.stop(c.currentTime + .1); } catch (e) { } } };
}
/** tiếng "tích" ngắn (đồng hồ) với âm lượng v */
export function tick(v = .4) {
  const c = audio(); if (!c || muted.v) return;
  const n = c.createBuffer(1, c.sampleRate * .03, c.sampleRate), d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * .004));
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = n; f.type = 'bandpass'; f.frequency.value = 3200; f.Q.value = 3; g.gain.value = v;
  s.connect(f); f.connect(g); g.connect(master); s.start();
}

/** Máy dao động kí: set({f, A, tau, t0}) – vẽ đường sóng trên màn */
export function scope(lab, pos, { label = 'Máy dao động kí', tb = .005 } = {}) {
  const g = new THREE.Group(); g.position.set(...pos); lab.scene.add(g);
  const box = roundBox(.22, .15, .16, .008, MAT.plastic(0xd8c99a, .5)); box.position.y = .075; g.add(box);
  const tex = canvasTex(512, 384, () => { });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(.13, .1), new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: .9 })); scr.position.set(-.025, .085, .0805); g.add(scr);
  const bezel = roundBox(.14, .11, .006, .003, MAT.plastic(0x2a2a2a, .5)); bezel.position.set(-.025, .085, .078); g.add(bezel);
  for (let i = 0; i < 6; i++) { const k = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .008, 16), MAT.plastic(0x222222, .4)); k.rotation.x = Math.PI / 2; k.position.set(.068 + (i % 2) * .022, .04 + Math.floor(i / 2) * .035, .082); g.add(k); }
  lab.shadow(g); if (label) lab.label(g, label, [0, .18, 0]);
  const st = { f: 0, A: 0, tau: 1, t0: 0, on: true };
  let tt = 0;
  lab.onTick(dt => {
    tt += dt; const c = tex.image.getContext('2d'), W = 512, H = 384;
    c.fillStyle = '#04140c'; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(90,200,140,.25)'; c.lineWidth = 1;
    for (let i = 0; i <= 10; i++) { c.beginPath(); c.moveTo(i * W / 10, 0); c.lineTo(i * W / 10, H); c.stroke(); }
    for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(0, i * H / 8); c.lineTo(W, i * H / 8); c.stroke(); }
    const age = performance.now() / 1000 - st.t0, A = st.A * Math.exp(-age / st.tau);
    c.strokeStyle = '#7dff9e'; c.lineWidth = 3; c.shadowColor = '#7dff9e'; c.shadowBlur = 8; c.beginPath();
    for (let x = 0; x <= W; x += 2) { const t = x / W * tb * 10, y = H / 2 - A * (H * .42) * Math.sin(2 * Math.PI * st.f * t) + (Math.random() - .5) * 1.5; x ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke(); c.shadowBlur = 0;
    c.fillStyle = 'rgba(160,255,190,.8)'; c.font = '20px monospace'; c.fillText(`${(tb * 1000).toFixed(0)} ms/ô`, 10, H - 12);
    tex.needsUpdate = true;
  });
  return { g, st, set(o) { Object.assign(st, o); if (o.A != null) st.t0 = performance.now() / 1000; } };
}
