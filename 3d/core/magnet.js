// Nam châm, la bàn, mạt sắt, trường từ (mô hình hai cực)
import { THREE, MAT, canvasTex, clamp } from './lab3d.js';
import { barMagnet } from './elec.js';
export { barMagnet };
const V3 = (...a) => new THREE.Vector3(...a);

/** Nam châm chữ U: hai cực ở đầu, mở về phía +x */
export function uMagnet(w = .05, L = .09, t = .016) {
  const g = new THREE.Group(), r = w / 2;
  const mR = MAT.plastic(0xc92a2a, .35), mB = MAT.plastic(0x1c5fb8, .35);
  const arcR = new THREE.Mesh(new THREE.TorusGeometry(r, t / 2, 12, 24, Math.PI / 2), mR); arcR.rotation.z = Math.PI / 2; g.add(arcR);
  const arcB = new THREE.Mesh(new THREE.TorusGeometry(r, t / 2, 12, 24, Math.PI / 2), mB); arcB.rotation.z = Math.PI; g.add(arcB);
  const legN = new THREE.Mesh(new THREE.BoxGeometry(L, t, t), mR); legN.position.set(L / 2, r, 0); g.add(legN);
  const legS = new THREE.Mesh(new THREE.BoxGeometry(L, t, t), mB); legS.position.set(L / 2, -r, 0); g.add(legS);
  const tag = (txt, y) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(t * .9, t * .9), new THREE.MeshBasicMaterial({ map: canvasTex(64, 64, (c, w, h) => { c.fillStyle = '#fff'; c.font = 'bold 48px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, 32, 34); }), transparent: true })); m.position.set(L - t * .6, y, t / 2 + .0005); g.add(m); };
  tag('N', r); tag('S', -r);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.userData.poles = () => [g.localToWorld(V3(L, r, 0)), g.localToWorld(V3(L, -r, 0))];   // N, S
  return g;
}

/** La bàn / kim nam châm đặt trên mũi nhọn; set hướng theo trường, có quán tính */
export function compass(lab, parent, pos, { r = .016, stand = true } = {}) {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  if (stand) { const s = new THREE.Mesh(new THREE.ConeGeometry(.012, .03, 20), MAT.plastic(0x2a2a2a, .4)); s.position.y = .015; g.add(s); }
  const pivot = new THREE.Group(); pivot.position.y = stand ? .032 : .004; g.add(pivot);
  const n = new THREE.Mesh(new THREE.ConeGeometry(r * .18, r, 4), MAT.plastic(0xc92a2a, .35)); n.rotation.z = -Math.PI / 2; n.position.x = r / 2; pivot.add(n);
  const s = new THREE.Mesh(new THREE.ConeGeometry(r * .18, r, 4), MAT.plastic(0x1c5fb8, .35)); s.rotation.z = Math.PI / 2; s.position.x = -r / 2; pivot.add(s);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(r * .12, 10, 8), MAT.metal(0xd4b26a, .3)); pivot.add(cap);
  pivot.children.forEach(o => o.castShadow = true);
  const api = { g, pivot, ang: Math.random() * 6, w: 0, target: null,
    step(dt, Bx, Bz) {   // trường trong mặt phẳng ngang (thế giới x, z)
      const B = Math.hypot(Bx, Bz); if (B < 1e-9) return; const tgt = Math.atan2(-Bz, Bx); let d = Math.atan2(Math.sin(tgt - api.ang), Math.cos(tgt - api.ang));
      api.w += (d * clamp(B, 0, 400) * 1.2 - api.w * 3) * dt; api.ang += api.w * dt; pivot.rotation.y = api.ang; } };
  return api;
}

/** Trường từ của các cực: poles = [{p: Vector3, q}] (q > 0: cực Bắc) – trả về vector B */
export function field(poles, p, out = V3()) {
  out.set(0, 0, 0); const d = V3();
  for (const P of poles) { d.copy(p).sub(P.p); const r = Math.max(d.length(), .004); out.addScaledVector(d, P.q / (r * r * r)); }
  return out;
}
