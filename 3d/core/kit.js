// Dụng cụ dùng chung: nguồn điện, giá đỡ, ...
import { THREE, MAT, canvasTex, roundBox, cable } from './lab3d.js';

/** Hộp nguồn điện (biến áp nguồn) có công tắc bấm được. */
export function powerSupply(lab, pos = [0, 0, 0], { title = 'NGUỒN ĐIỆN 12 V', label = 'Nguồn điện', onToggle } = {}) {
  const g = new THREE.Group(); g.position.set(...pos); lab.scene.add(g);
  const box = roundBox(.2, .085, .13, .008, MAT.plastic(0xdfe3e6, .45)); box.position.y = .0425; g.add(box);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(.18, .06), new THREE.MeshStandardMaterial({ roughness: .5, map: canvasTex(360, 120, (c, w, h) => { c.fillStyle = '#2f3b46'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = 'bold 20px Arial'; c.fillText(title, 14, 30); c.font = '15px Arial'; c.fillText('ON / OFF', 210, 98); c.fillText('POWER', 30, 98); }) }));
  panel.position.set(0, .045, .0655); g.add(panel);
  const sw = new THREE.Mesh(new THREE.BoxGeometry(.03, .022, .012), MAT.plastic(0xc92a2a, .35)); sw.position.set(.055, .035, .071); g.add(sw);
  const led = new THREE.Mesh(new THREE.SphereGeometry(.004, 16, 12), new THREE.MeshStandardMaterial({ color: 0x331111, emissive: 0xff2200, emissiveIntensity: 0 })); led.position.set(-.06, .03, .068); g.add(led);
  for (const [x, c] of [[-.02, 0xc0392b], [0, 0x222222]]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .012, 16), MAT.plastic(c, .4)); t.rotation.x = Math.PI / 2; t.position.set(x, .02, .07); g.add(t); }
  lab.shadow(g); if (label) lab.label(g, label, [0, .11, 0]);
  const api = { g, on: false, set(v) { api.on = v; led.material.emissiveIntensity = v ? 3 : 0; sw.rotation.x = v ? -.25 : .25; } };
  lab.clickable(sw, () => { api.set(!api.on); onToggle && onToggle(api.on); });
  api.set(false);
  /** điểm cọc nối (toạ độ thế giới) */
  api.post = i => g.localToWorld(new THREE.Vector3(i ? 0 : -.02, .02, .076));
  return api;
}

/** Giá ba chân có thanh đứng, đỉnh ở độ cao h */
export function tripod(lab, pos, h = .3) {
  const g = new THREE.Group(); g.position.set(...pos); lab.scene.add(g);
  const m = MAT.metal(0x2d3136, .45);
  for (let k = 0; k < 3; k++) {
    const a = k * 2.094 + .5, leg = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .16, 12), m);
    leg.position.set(Math.cos(a) * .0625, .05, Math.sin(a) * .0625);
    leg.quaternion.setFromAxisAngle(new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)), .9); g.add(leg);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.016, .016, .03, 20), m); hub.position.y = .095; g.add(hub);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.007, .007, h - .08, 16), MAT.metal(0xcfd3d8, .2)); rod.position.y = .08 + (h - .08) / 2; g.add(rod);
  lab.shadow(g); return g;
}
/** Đồng hồ bấm giây cầm tay: bấm nút trái (Bắt đầu/Dừng), nút phải (Đặt lại) */
export function stopwatch(lab, pos, { label = 'Đồng hồ bấm giây', onChange } = {}) {
  const g = new THREE.Group(); g.position.set(...pos); lab.scene.add(g);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .014, 40), MAT.plastic(0x1c1f22, .4)); body.rotation.x = Math.PI / 2 - .9; body.position.y = .022; g.add(body);
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.CircleGeometry(.026, 40), new THREE.MeshStandardMaterial({ map: tex, roughness: .4 })); face.position.set(0, .0071, 0); face.rotation.x = -Math.PI / 2; body.add(face); face.rotation.set(Math.PI / 2, 0, 0); face.position.set(0, .0072, 0);
  const mkB = (x, col) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .01, 16), MAT.plastic(col, .35)); b.position.set(x, .03, 0); body.add(b); return b; };
  const top = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .01, 16), MAT.metal(0xc8cdd2, .3)); top.position.set(0, .034, 0); body.add(top);
  const bS = mkB(-.016, 0x2f9e44), bR = mkB(.016, 0xc92a2a); bS.rotation.z = .5; bR.rotation.z = -.5; bS.position.set(-.017, .027, 0); bR.position.set(.017, .027, 0);
  lab.shadow(g); if (label) lab.label(g, label, [0, .07, 0]);
  const api = { g, t: 0, run: false,
    start() { api.run = true; }, stop() { api.run = false; onChange && onChange(api.t); }, reset() { api.run = false; api.t = 0; draw(); },
    toggle() { api.run ? api.stop() : api.start(); } };
  function draw() { const x = c.getContext('2d'); x.fillStyle = '#e9eee4'; x.beginPath(); x.arc(128, 128, 128, 0, 7); x.fill(); x.fillStyle = '#1b2a1b'; x.font = 'bold 54px "Courier New",monospace'; x.textAlign = 'center'; x.fillText(api.t.toFixed(2).replace('.', ','), 128, 145); x.font = '22px Arial'; x.fillText('giây', 128, 185); x.fillText(api.run ? '● CHẠY' : '', 128, 80); tex.needsUpdate = true; }
  lab.clickable(bS, () => api.toggle()); lab.clickable(bR, () => api.reset());
  let acc = 0; lab.onTick(dt => { if (api.run) { api.t += dt; acc += dt; if (acc > .03) { acc = 0; draw(); } } });
  draw(); return api;
}
export { cable };
