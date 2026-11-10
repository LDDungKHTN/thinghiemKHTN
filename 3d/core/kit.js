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
export { cable };
