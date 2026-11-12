// Thư viện 3D dùng chung cho các thí nghiệm ảo (Three.js r160)
import * as THREE from '../lib/three.module.js';
import { OrbitControls } from '../lib/OrbitControls.js';
import { RoomEnvironment } from '../lib/RoomEnvironment.js';
import { CSS2DRenderer, CSS2DObject } from '../lib/CSS2DRenderer.js';
import { sfx } from './sfx.js';
export { THREE, CSS2DObject };

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
const V = (...a) => new THREE.Vector3(...a);

/* ---------- Kết cấu vẽ bằng canvas ---------- */
export function canvasTex(w, h, draw, { repeat, srgb = true, aniso = 8 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
function noise(ctx, w, h, amt, alpha = .05) {
  for (let i = 0; i < amt; i++) {
    ctx.fillStyle = Math.random() < .5 ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}
export const TEX = {
  wood: () => canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = '#9a6a43'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) {
      const k = Math.sin(y * .05 + Math.sin(y * .013) * 3) * .5 + .5;
      g.fillStyle = `rgba(${70 + k * 40},${40 + k * 25},${20 + k * 10},${.18 + k * .12})`;
      g.fillRect(0, y, w, 2);
    }
    for (let i = 0; i < 60; i++) {
      g.strokeStyle = `rgba(60,32,14,${.08 + Math.random() * .1})`; g.lineWidth = 1 + Math.random() * 2;
      g.beginPath(); const y0 = Math.random() * h; g.moveTo(0, y0);
      for (let x = 0; x <= w; x += 32) g.lineTo(x, y0 + Math.sin(x * .01 + i) * 6);
      g.stroke();
    }
    noise(g, w, h, 6000, .04);
  }, { repeat: [2, 1] }),
  bench: () => canvasTex(512, 512, (g, w, h) => {          // mặt bàn thí nghiệm (epoxy xám)
    g.fillStyle = '#3d4247'; g.fillRect(0, 0, w, h); noise(g, w, h, 20000, .035);
  }, { repeat: [4, 2] }),
  tiles: () => canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#e9ecee'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c9cfd4'; g.lineWidth = 4;
    for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(w, i * 128); g.stroke(); }
    noise(g, w, h, 3000, .02);
  }, { repeat: [12, 4] }),
  ruler(mm, { px = 4, bg = '#f4f1e6', ink = '#1d1d1d', step = 10, h = 64, start = 0 } = {}) {     // thước có vạch mm
    return canvasTex(Math.min(8192, mm * px), h, (g, w, hh) => {
      const k = w / mm; g.fillStyle = bg; g.fillRect(0, 0, w, hh); g.fillStyle = ink;
      g.font = `600 ${hh * .36}px Arial`; g.textAlign = 'center';
      for (let i = 0; i <= mm; i++) {
        const L = i % step == 0 ? .55 : i % 5 == 0 ? .38 : .22;
        g.fillRect(i * k - .6, 0, 1.2, hh * L);
        if (i % step == 0 && i > 0 && i < mm) g.fillText(String((i + start) / (step == 10 ? 10 : 1)), i * k, hh * .93);
      }
    }, { aniso: 16 });
  },
};

/* ---------- Vật liệu ---------- */
export const MAT = {
  glass: (o = {}) => new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: .04, transmission: 1, thickness: .0015, ior: 1.5, transparent: true, opacity: 1, envMapIntensity: 1.2, side: THREE.DoubleSide, specularIntensity: 1, ...o }),
  glassLite: (o = {}) => new THREE.MeshPhysicalMaterial({ color: 0xeaf6ff, metalness: 0, roughness: .03, transparent: true, opacity: .18, envMapIntensity: 1.6, clearcoat: 1, clearcoatRoughness: .02, side: THREE.DoubleSide, depthWrite: false, ...o }),
  metal: (c = 0xb8bcc2, r = .32) => new THREE.MeshStandardMaterial({ color: c, metalness: 1, roughness: r }),
  plastic: (c, r = .5) => new THREE.MeshStandardMaterial({ color: c, metalness: 0, roughness: r }),
  rubber: (c = 0x222222) => new THREE.MeshStandardMaterial({ color: c, roughness: .85 }),
  liquid: (c = 0xcfe8f3, op = .55) => new THREE.MeshPhysicalMaterial({ color: c, roughness: .08, transmission: 0, transparent: true, opacity: op, envMapIntensity: 1, clearcoat: .6, depthWrite: false }),
};

/* ---------- Khởi tạo phòng thí nghiệm ---------- */
export function createLab(host, o = {}) {
  const opt = { cam: [0, .45, .9], target: [0, .12, 0], fov: 38, minDist: .15, maxDist: 2.6, table: 'wood', tableSize: [2.4, 1.2], ...o };
  // điện thoại / máy tính bảng: giảm độ phân giải và bóng đổ cho mượt, đỡ tốn bộ nhớ
  const mobile = matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  const renderer = new THREE.WebGLRenderer({ antialias: !mobile || devicePixelRatio < 2, powerPreference: mobile ? 'default' : 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = opt.exposure || 1;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  const lr = new CSS2DRenderer(); lr.domElement.className = 'lbl3d'; lr.domElement.style.zIndex = 2; host.appendChild(lr.domElement);

  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(renderer), .04).texture;
  scene.background = new THREE.Color(0xd9dee3);
  scene.fog = new THREE.Fog(0xd9dee3, 4, 9);

  const camera = new THREE.PerspectiveCamera(opt.fov, 1, .005, 30);
  camera.position.set(...opt.cam);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...opt.target); controls.enableDamping = true; controls.dampingFactor = .08;
  controls.minDistance = opt.minDist; controls.maxDistance = opt.maxDist; controls.maxPolarAngle = Math.PI * .49;
  controls.screenSpacePanning = true; controls.update();

  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a7a66, .45); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff6ea, 1.5);
  sun.position.set(1.2, 2.6, 1.6); sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048); sun.shadow.bias = -.0003; sun.shadow.normalBias = .01; sun.shadow.radius = 4;
  Object.assign(sun.shadow.camera, { left: -1.4, right: 1.4, top: 1.4, bottom: -1.4, near: .5, far: 7 });
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xeef4ff, .55); fill.position.set(-1.6, 1.4, 1.4); scene.add(fill);

  // Phòng: bàn, tường, sàn
  const room = new THREE.Group(); scene.add(room);
  const [tw, td] = opt.tableSize;
  if (opt.table) {
    const top = new THREE.Mesh(new THREE.BoxGeometry(tw, .04, td),
      opt.table == 'wood' ? new THREE.MeshStandardMaterial({ map: TEX.wood(), roughness: .55, metalness: 0 })
        : new THREE.MeshStandardMaterial({ map: TEX.bench(), roughness: .35, metalness: 0 }));
    top.position.y = -.02; top.receiveShadow = true; room.add(top);
    const legM = MAT.metal(0x6b7075, .5);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(.05, .76, .05), legM);
      leg.position.set(sx * (tw / 2 - .08), -.42, sz * (td / 2 - .08)); room.add(leg);
    }
    const apron = new THREE.Mesh(new THREE.BoxGeometry(tw - .04, .08, td - .04), MAT.plastic(0x5a4632, .7));
    apron.position.y = -.08; room.add(apron);
  }
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(12, 4), new THREE.MeshStandardMaterial({ map: TEX.tiles(), roughness: .6 }));
  wall.position.set(0, .9, -td / 2 - .5); room.add(wall);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), new THREE.MeshStandardMaterial({ color: 0xb9b2a6, roughness: .8 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.8; floor.receiveShadow = true; room.add(floor);

  // ---- vòng lặp ----
  const ticks = [], clock = new THREE.Clock();
  let tween = null;
  function resize() {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h, false); lr.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host); resize();
  // màn hình hẹp (điện thoại dọc): lùi camera ra xa cho vừa khung
  const fitK = () => Math.max(1, (1.75 / camera.aspect) ** .75);
  const fitPos = (p, t) => V(...t).add(V(...p).sub(V(...t)).multiplyScalar(fitK()));
  camera.position.copy(fitPos(opt.cam, opt.target)); controls.update();
  renderer.setAnimationLoop(() => frame());
  let tOff = 0;   // thời gian cộng thêm khi chạy nhanh bằng pump() (kiểm thử)
  function frame(fdt) {
    if (fdt != null) tOff += fdt;
    const dt = fdt ?? Math.min(clock.getDelta(), .05), t = clock.elapsedTime + tOff;
    if (tween) {
      tween.k = Math.min(1, tween.k + dt / tween.dur); const e = tween.k < .5 ? 2 * tween.k * tween.k : 1 - (-2 * tween.k + 2) ** 2 / 2;
      camera.position.lerpVectors(tween.p0, tween.p1, e); controls.target.lerpVectors(tween.t0, tween.t1, e);
      if (tween.k >= 1) tween = null;
    }
    for (const f of ticks) f(dt, t);
    controls.update();
    renderer.render(scene, camera); lr.render(scene, camera);
    for (const l of labels) { if (l.element.style.display == 'none') continue; for (let o = l.parent; o; o = o.parent) if (!o.visible) { l.element.style.display = 'none'; break; } }
  }
  const labels = [];

  // ---- tương tác: kéo theo trục, bấm ----
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), drags = [], clicks = [];
  let active = null, down = null;
  const setPtr = e => { const r = renderer.domElement.getBoundingClientRect(); ptr.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ptr, camera); };
  const owner = (obj, list) => { for (let o = obj; o; o = o.parent) { const it = list.find(d => d.obj === o || d.handles?.includes(o)); if (it) return it; } return null; };
  function pick() {
    const vis = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
    const all = [...drags, ...clicks].filter(d => d.enabled !== false && vis(d.obj)).flatMap(d => d.handles || [d.obj]);
    const hits = ray.intersectObjects(all, true);
    for (const h of hits) { const d = owner(h.object, drags) || owner(h.object, clicks); if (d) return { d, h }; }
    return null;
  }
  function axisPlane(d, pt) {
    const camDir = camera.getWorldDirection(V()), ax = d.axis;
    if (d.plane) return new THREE.Plane().setFromNormalAndCoplanarPoint(d.plane, pt);
    const n = V().crossVectors(ax, V().crossVectors(camDir, ax)).normalize();
    if (n.lengthSq() < 1e-6) n.copy(camDir);
    return new THREE.Plane().setFromNormalAndCoplanarPoint(n, pt);
  }
  const el = renderer.domElement;
  el.addEventListener('pointerdown', e => {
    setPtr(e); const p = pick(); down = { x: e.clientX, y: e.clientY, t: performance.now(), p };
    if (p && drags.includes(p.d)) {
      const d = p.d, pt = p.h.point.clone(), pl = axisPlane(d, pt);
      active = { d, pl, start: d.get(), hit0: pt, id: e.pointerId };
      controls.enabled = false; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing';
      d.onStart && d.onStart(); d.quiet || sfx('grab');
    }
  }, { capture: true });
  el.addEventListener('pointermove', e => {
    setPtr(e);
    if (active) {
      const p = V(); if (!ray.ray.intersectPlane(active.pl, p)) return;
      const d = active.d;
      if (d.axis && !d.plane) { const dv = p.sub(active.hit0).dot(d.axis); d.set(clamp(active.start + dv, d.min, d.max)); }
      else d.set(p, active);
      return;
    }
    if (e.pointerType === 'mouse') { const p = pick(); el.style.cursor = p ? (drags.includes(p.d) ? 'grab' : 'pointer') : ''; }
  });
  const up = e => {
    if (active) { active.d.onEnd && active.d.onEnd(); active.d.quiet || sfx('drop', { vol: .5 }); active = null; controls.enabled = true; el.style.cursor = ''; try { el.releasePointerCapture(e.pointerId) } catch (_) { } }
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8 && performance.now() - down.t < 600 && down.p && clicks.includes(down.p.d)) { sfx('tap'); down.p.d.fn(down.p.h); }
    down = null;
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);

  const lab = {
    THREE, scene, camera, renderer, controls, room, sun, host, lights: { hemi, sun, fill },
    /** độ sáng phòng 0..1 (tắt đèn phòng cho thí nghiệm quang học) */
    roomLight(k) { hemi.intensity = .45 * k; sun.intensity = 1.5 * k; fill.intensity = .55 * k; scene.background.setHex(0xd9dee3).multiplyScalar(.15 + .85 * k); scene.fog.color.copy(scene.background); scene.traverse(o => { const m = o.material; if (m && m.envMapIntensity !== undefined && !o.userData.keepEnv) { if (m.userData.env0 == null) m.userData.env0 = m.envMapIntensity; m.envMapIntensity = m.userData.env0 * k; } }); },
    onTick: f => (ticks.push(f), f),
    offTick: f => { const i = ticks.indexOf(f); if (i >= 0) ticks.splice(i, 1); },
    /** kéo vật theo trục: {obj, axis:Vector3, min, max, get(), set(v), handles?} */
    draggable(d) { d.axis = d.axis || V(1, 0, 0); drags.push(d); return d; },
    clickable(obj, fn, handles) { const d = { obj, fn, handles }; clicks.push(d); return d; },
    unregister(d) { for (const L of [drags, clicks]) { const i = L.indexOf(d); if (i >= 0) L.splice(i, 1); } },
    view(pos, target, dur = .9) { tween = { p0: camera.position.clone(), p1: fitPos(pos, target), t0: controls.target.clone(), t1: V(...target), k: 0, dur }; },
    label(obj, text, off = [0, .05, 0], cls = '') {
      const d = document.createElement('div'); d.className = 'tag3d ' + cls; d.innerHTML = text;
      const l = new CSS2DObject(d); l.position.set(...off); obj.add(l); labels.push(l); return l;
    },
    showLabels(on) { lr.domElement.classList.toggle('off', !on); },
    /** (kiểm thử) đặt camera, vẽ một khung và phủ ảnh lên sân khấu; gọi lại không tham số để bỏ */
    /** (kiểm thử) chạy nhanh n giây mô phỏng khi trang bị ẩn */
    pump(sec = 1, dt = 1 / 30) { for (let i = 0; i < sec / dt; i++) frame(dt); return 'ok'; },
    shot(p, t) {
      let im = host.querySelector('#shotimg'); if (!p) { im && im.remove(); return; }
      tween = null; camera.position.set(...p); controls.target.set(...t); controls.update(); renderer.render(scene, camera);
      if (!im) { im = document.createElement('img'); im.id = 'shotimg'; im.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:9;pointer-events:none'; host.appendChild(im); }
      im.src = renderer.domElement.toDataURL(); return 'ok';
    },
    /** gỡ vật khỏi cảnh, xoá cả nhãn HTML của nó */
    remove(o) { if (!o) return; o.traverse(c => { if (c.isCSS2DObject && c.element.parentNode) c.element.remove(); }); o.parent && o.parent.remove(o); },
    shadow(o) { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true } }); return o; },
  };
  return lab;
}

/* ---------- Hình học tiện ích ---------- */
export function lathe(pts, seg = 48) { return new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg); }
export function tubeAlong(points, r = .003, seg = 64) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => V(...p))), seg, r, 10, false);
}
/** dây điện mềm giữa 2 điểm, võng xuống */
export function cable(a, b, { sag = .06, r = .0025, color = 0xc0392b } = {}) {
  const A = V(...a), B = V(...b), M = A.clone().lerp(B, .5); M.y = Math.min(A.y, B.y) - sag;
  const g = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(A, M, B), 40, r, 8, false);
  const m = new THREE.Mesh(g, MAT.plastic(color, .45)); m.castShadow = true; return m;
}
export function roundBox(W, H, d, r = .004, mat) {
  r = Math.min(r, W / 2.2, H / 2.2, d / 2.2);
  const bs = r * .8, w = W - 2 * bs, h = H - 2 * bs, s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  r = Math.min(r, w / 2.01, h / 2.01);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const bt = Math.min(bs * 1.25, d / 2.2);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * bt, bevelEnabled: true, bevelThickness: bt, bevelSize: bs, bevelSegments: 3, curveSegments: 6 });
  g.translate(0, 0, -(d - 2 * bt) / 2);
  return new THREE.Mesh(g, mat);
}
