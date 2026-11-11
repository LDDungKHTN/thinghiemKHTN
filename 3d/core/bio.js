// Mô hình sinh học: chậu, cây non, lá, rễ, hạt
import { THREE, MAT, lathe, canvasTex, clamp } from './lab3d.js';
const V3 = (...a) => new THREE.Vector3(...a);

export function pot(R = .045, H = .06, color = 0xb5562a) {
  const g = new THREE.Group();
  const p = new THREE.Mesh(lathe([[0, 0], [R * .75, 0], [R, H], [R * 1.08, H], [R * 1.08, H + .008], [R * .98, H + .008], [R * .92, H - .002], [0, H - .002]], 40), new THREE.MeshStandardMaterial({ color, roughness: .85 }));
  g.add(p);
  const soil = new THREE.Mesh(new THREE.CircleGeometry(R * .94, 32), new THREE.MeshStandardMaterial({ color: 0x3b2716, roughness: 1, map: canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#3b2716'; c.fillRect(0, 0, w, h); for (let i = 0; i < 1500; i++) { c.fillStyle = `rgba(${90 + Math.random() * 60},${60 + Math.random() * 40},${30},.6)`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }) }));
  soil.rotation.x = -Math.PI / 2; soil.position.y = H - .004; g.add(soil);
  g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
  g.userData.top = H - .004; return g;
}

/** Hình lá: kiểu 'heart' (khoai lang), 'oval' (đậu), 'small' */
export function leafGeo(kind = 'heart', s = .04) {
  const sh = new THREE.Shape();
  if (kind == 'heart') { sh.moveTo(0, 0); sh.bezierCurveTo(-s * .7, s * .15, -s * .75, s * .85, 0, s * .55); sh.bezierCurveTo(s * .75, s * .85, s * .7, s * .15, 0, 0); }
  else { sh.moveTo(0, 0); sh.bezierCurveTo(-s * .45, s * .25, -s * .35, s * .85, 0, s); sh.bezierCurveTo(s * .35, s * .85, s * .45, s * .25, 0, 0); }
  const g = new THREE.ShapeGeometry(sh, 12);
  // uốn nhẹ cho tự nhiên
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, -Math.abs(x) * .25 + y * y * 2); }
  g.computeVertexNormals(); return g;
}
export function leafMat(color = 0x3f8f2f, map) { return new THREE.MeshStandardMaterial({ color, map, roughness: .55, side: THREE.DoubleSide }); }

/** Cây non: thân cong theo bend (rad, hướng dir trong mặt phẳng xz), số lá */
export function seedling({ h = .12, leaves = 4, kind = 'oval', size = .03, color = 0x3f8f2f } = {}) {
  const g = new THREE.Group(), stemM = new THREE.MeshStandardMaterial({ color: 0x7aa64a, roughness: .6 }), lm = leafMat(color);
  let stem = null; const lv = [];
  for (let i = 0; i < leaves; i++) { const l = new THREE.Mesh(leafGeo(kind, size * (.7 + .3 * (i / leaves))), lm); l.castShadow = true; g.add(l); lv.push(l); }
  const api = { g, h, bend: 0, dir: 0, grow: 1, lv, stemM, lm,
    set({ h = api.h, bend = api.bend, dir = api.dir, grow = api.grow } = {}) {
      Object.assign(api, { h, bend, dir, grow }); const H = h * grow, pts = [];
      for (let i = 0; i <= 12; i++) { const t = i / 12, a = bend * t * t; pts.push(V3(Math.sin(a) * H * t * .7 * Math.cos(dir), H * t * (1 - .25 * Math.abs(Math.sin(bend)) * t), Math.sin(a) * H * t * .7 * -Math.sin(dir))); }
      const curve = new THREE.CatmullRomCurve3(pts);
      if (stem) { g.remove(stem); stem.geometry.dispose(); }
      stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, .0022 * (.6 + .4 * grow), 8), stemM); stem.castShadow = true; g.add(stem);
      lv.forEach((l, i) => { const t = .45 + .55 * (i + 1) / lv.length, p = curve.getPoint(Math.min(1, t)), tan = curve.getTangent(Math.min(1, t)); l.position.copy(p); l.visible = grow > .15 + i * .12;
        l.rotation.set(0, i * 2.4 + dir, 0); l.rotateX(-.9 + bend * .2); l.scale.setScalar(clamp(grow * 1.2 - i * .1, .2, 1)); void tan; });
    } };
  api.set(); return api;
}

/** Bộ rễ: hướng lệch về phía (dir) với độ lệch k */
export function roots(k = 0, dir = 0, L = .05) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0xe9dcb8, roughness: .8 });
  for (let r = 0; r < 7; r++) { const pts = [V3(0, 0, 0)], a0 = r * .9; let p = V3(0, 0, 0);
    for (let i = 1; i <= 10; i++) { const t = i / 10; p = p.clone().add(V3(Math.cos(a0) * .002 * (1 - k) + k * .004 * Math.cos(dir), -L / 10, Math.sin(a0) * .002 * (1 - k) - k * .004 * Math.sin(dir))); pts.push(p); }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, r ? .0007 : .0012, 5), m)); }
  return g;
}

/** Hạt đậu (có thể nảy mầm: sprout 0..1) */
export function seed(sprout = 0, color = 0x6ea34a) {
  const g = new THREE.Group();
  const s = new THREE.Mesh(new THREE.SphereGeometry(.0035, 12, 10), new THREE.MeshStandardMaterial({ color, roughness: .5 })); s.scale.set(1.3, .9, 1); g.add(s);
  if (sprout > 0) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.0006, .0009, .012 * sprout, 6), new THREE.MeshStandardMaterial({ color: 0xf2edd6 })); r.position.set(.004, -.002, 0); r.rotation.z = 1.2; g.add(r); }
  return g;
}

/** Đồng hồ thời gian tua nhanh (HTML) */
export function timeHud(stage) {
  const d = document.createElement('div'); d.className = 'hud hud2'; d.style.fontSize = '14px'; stage.appendChild(d);
  return { el: d, set(text) { d.innerHTML = '⏱ ' + text; } };
}
