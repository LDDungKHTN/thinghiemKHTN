// Ngọn nến 3D có lửa lung linh
import { THREE, lathe } from './lab3d.js';

export function candle(lab, { h = .06, r = .011, light = true } = {}) {
  const g = new THREE.Group();
  const wax = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.02, h, 32), new THREE.MeshPhysicalMaterial({ color: 0xf3ead8, roughness: .55, transmission: 0, sheen: .4, clearcoat: .1 }));
  wax.position.y = h / 2; g.add(wax);
  const top = new THREE.Mesh(new THREE.CircleGeometry(r * .98, 32), new THREE.MeshStandardMaterial({ color: 0xe9dfc8, roughness: .5 })); top.rotation.x = -Math.PI / 2; top.position.y = h - .0012; g.add(top);
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(.0006, .0006, .007, 8), new THREE.MeshStandardMaterial({ color: 0x1a1410 })); wick.position.y = h + .0025; g.add(wick);
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(r * 2.2, r * 2.4, .004, 32), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: .8, roughness: .3 })); dish.position.y = .002; g.add(dish);
  const fl = new THREE.Group(); fl.position.y = h + .004; g.add(fl);
  const prof = [[0, 0], [.0035, .002], [.0048, .006], [.0042, .011], [.0025, .016], [0, .021]];
  const outer = new THREE.Mesh(lathe(prof, 24), new THREE.MeshBasicMaterial({ color: 0xffb030, transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  const inner = new THREE.Mesh(lathe(prof.map(([a, b]) => [a * .55, b * .6]), 20), new THREE.MeshBasicMaterial({ color: 0xfff4c8, transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  const blue = new THREE.Mesh(lathe([[0, 0], [.0028, .001], [.0022, .003], [0, .0035]], 16), new THREE.MeshBasicMaterial({ color: 0x3355ff, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false }));
  fl.add(outer, inner, blue);
  let pl = null;
  if (light) { pl = new THREE.PointLight(0xffa040, .25, 1.2, 2); pl.position.y = h + .015; g.add(pl); }
  wax.castShadow = true; wax.receiveShadow = true;
  const api = { g, flame: fl, parts: [wax, top, wick, dish, outer, inner, blue], lit: true, light: pl,
    setLit(v) { api.lit = v; fl.visible = v; if (pl) pl.visible = v; } };
  lab.onTick((dt, t) => {
    if (!api.lit) return;
    const k = 1 + Math.sin(t * 13) * .04 + Math.sin(t * 23.7) * .03;
    fl.scale.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k)); fl.rotation.z = Math.sin(t * 3.1) * .05;
    if (pl) pl.intensity = .22 + Math.sin(t * 17) * .02;
  });
  return api;
}
