// Linh kiện điện 3D: nguồn, đồng hồ đo, bóng đèn, điện trở, công tắc, biến trở, dây nối
import { THREE, MAT, canvasTex, roundBox, lathe, clamp } from './lab3d.js';
const V3 = (...a) => new THREE.Vector3(...a);

function post(g, x, z, red, y = 0) {          // cọc đấu dây
  const p = new THREE.Mesh(new THREE.CylinderGeometry(.0045, .0052, .012, 20), MAT.plastic(red ? 0xc92a2a : 0x1b1b1b, .35));
  p.position.set(x, y + .006, z); g.add(p);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(.0022, .0022, .006, 12), MAT.metal(0xd4b26a, .3)); m.position.set(x, y + .014, z); g.add(m);
  return V3(x, y + .016, z);
}
function base(g, w, d, h = .012, color = 0xe9edf0) { const b = roundBox(w, h, d, .003, MAT.plastic(color, .5)); b.position.y = h / 2; g.add(b); return h; }
function plate(text, w = .06, h = .014, bg = '#fffbe6') {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ roughness: .6, map: canvasTex(Math.round(w * 6000), Math.round(h * 6000), (g, W, H) => { g.fillStyle = bg; g.fillRect(0, 0, W, H); g.fillStyle = '#111'; g.font = `bold ${H * .62}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, W / 2, H / 2 + 2); }) }));
  m.rotation.x = -Math.PI / 2; return m;
}
function mk(lab, pos, rotY = 0) { const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = rotY; lab.scene.add(g); return g; }
const world = (g, v) => { g.updateMatrixWorld(true); return g.localToWorld(v.clone()); };

/** Nguồn điện một chiều có màn hiển thị số */
export function supply(lab, pos, { V = 12, label = 'Nguồn điện', onToggle } = {}) {
  const g = mk(lab, pos);
  const b = roundBox(.17, .08, .12, .008, MAT.plastic(0x2f3a45, .45)); b.position.y = .04; g.add(b);
  const disp = canvasTex(256, 96, () => { }); const dm = new THREE.Mesh(new THREE.PlaneGeometry(.06, .0225), new THREE.MeshStandardMaterial({ map: disp, emissive: 0xffffff, emissiveMap: disp, emissiveIntensity: .9 }));
  dm.position.set(-.03, .052, .0605); g.add(dm);
  const sw = new THREE.Mesh(new THREE.BoxGeometry(.022, .016, .01), MAT.plastic(0xc92a2a, .35)); sw.position.set(.05, .05, .064); g.add(sw);
  const t = [post(g, -.03, .078, true, 0), post(g, 0, .078, false, 0)];
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(.15, .016), new THREE.MeshStandardMaterial({ map: canvasTex(600, 64, (c, w, h) => { c.fillStyle = '#2f3a45'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = 'bold 34px Arial'; c.fillText('DC POWER SUPPLY  0–12 V', 16, 44); }) }));
  lbl.position.set(0, .07, .0605); g.add(lbl);
  lab.shadow(g); if (label) lab.label(g, label, [0, .11, 0]);
  const api = { g, on: false, V, term: i => world(g, t[i]),
    set(on) { api.on = on; sw.rotation.x = on ? -.3 : .3; draw(); },
    setV(v) { api.V = v; draw(); } };
  function draw() { const c = disp.image.getContext('2d'); c.fillStyle = '#0b1a0b'; c.fillRect(0, 0, 256, 96); c.fillStyle = api.on ? '#7dff7a' : '#1f3a1f'; c.font = 'bold 64px "Courier New",monospace'; c.textAlign = 'right'; c.fillText((api.on ? api.V : 0).toFixed(1).replace('.', ',') + 'V', 246, 72); disp.needsUpdate = true; }
  lab.clickable(sw, () => { api.set(!api.on); onToggle && onToggle(api.on); });
  api.set(false); return api;
}

/** Đồng hồ đo kim (ampe kế 'A' / vôn kế 'V') */
export function meter(lab, pos, { kind = 'A', max = 3, step, label, rotY = 0, center = false } = {}) {
  const g = mk(lab, pos, rotY), W = .1, H = .075;
  const body = roundBox(W, H, .045, .006, MAT.plastic(0x1f2a33, .4)); body.position.y = H / 2; body.rotation.x = -.35; g.add(body);
  const face = new THREE.Group(); face.position.set(0, H / 2, 0); face.rotation.x = -.35; g.add(face);
  step = step || (max <= 1 ? .02 : max <= 3 ? .1 : max <= 6 ? .2 : max <= 15 ? .5 : 1);
  const dial = canvasTex(512, 384, (c, w, h) => {
    c.fillStyle = '#f8f6ee'; c.fillRect(0, 0, w, h); const cx = w / 2, cy = h * .92, R = h * .75;
    c.strokeStyle = '#111'; c.fillStyle = '#111'; c.textAlign = 'center'; c.lineWidth = 3;
    c.beginPath(); c.arc(cx, cy, R, rad(-140), rad(-40)); c.stroke();
    const n = Math.round((center ? 2 : 1) * max / step);
    for (let i = 0; i <= n; i++) {
      const a = rad(-140 + 100 * i / n), big = i % 5 == 0, L = big ? 26 : 13;
      c.lineWidth = big ? 3 : 1.6; c.beginPath(); c.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); c.lineTo(cx + Math.cos(a) * (R + L), cy + Math.sin(a) * (R + L)); c.stroke();
      if (big) { c.font = 'bold 26px Arial'; const v = +((center ? i * step - max : i * step)).toFixed(3); c.fillText(String(v).replace('.', ','), cx + Math.cos(a) * (R + 50), cy + Math.sin(a) * (R + 50) + 9); }
    }
    c.fillStyle = 'rgba(150,170,190,.35)'; c.beginPath(); c.arc(cx, cy, R - 10, rad(-140), rad(-40)); c.arc(cx, cy, R - 24, rad(-40), rad(-140), true); c.fill();
    c.fillStyle = kind == 'A' ? '#c92a2a' : '#1864ab'; c.font = 'bold 76px Arial'; c.fillText(kind, cx, cy - 60);
    c.fillStyle = '#444'; c.font = '20px Arial'; c.fillText(center ? 'ĐIỆN KẾ (G)' : `GHĐ ${String(max).replace('.', ',')} ${kind}  ·  ĐCNN ${String(step).replace('.', ',')} ${kind}`, cx, h - 8);
  });
  const dm = new THREE.Mesh(new THREE.PlaneGeometry(W * .86, H * .78), new THREE.MeshStandardMaterial({ map: dial, roughness: .5 })); dm.position.set(0, .002, .0228); face.add(dm);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(W * .88, H * .8), MAT.glassLite({ opacity: .12 })); glass.position.set(0, .002, .0236); face.add(glass);
  const piv = new THREE.Group(); piv.position.set(0, .002 - H * .78 / 2 + H * .78 * .08, .0232); face.add(piv);
  const nd = new THREE.Mesh(new THREE.BoxGeometry(.0009, H * .78 * .74, .0004), new THREE.MeshBasicMaterial({ color: 0x111111 })); nd.position.y = H * .78 * .37; piv.add(nd);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.003, .003, .002, 16), MAT.plastic(0x111111, .3)); hub.rotation.x = Math.PI / 2; piv.add(hub);
  const t = [post(g, -.03, .03, true), post(g, .03, .03, false)];
  lab.shadow(g); if (label) lab.label(g, label, [0, H + .02, 0], 'big');
  let tgt = 0, cur = 0;
  lab.onTick(dt => { cur += (tgt - cur) * Math.min(1, dt * 7); piv.rotation.z = rad(50 - 100 * clamp(cur, -0.03, 1.04)); });
  return { g, term: i => world(g, t[i]), set(v) { tgt = center ? (v / max + 1) / 2 : v / max; }, max, step };
}

/** Đèn LED nhỏ (sáng khi có dòng theo chiều thuận) */
export function led(lab, parent, pos, { color = 0xff2a2a } = {}) {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  const dome = new THREE.Mesh(new THREE.CapsuleGeometry(.0028, .004, 6, 16), new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity: .75, roughness: .15, emissive: color, emissiveIntensity: 0 }));
  dome.position.y = .006; g.add(dome);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(.0033, .0033, .001, 16), new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity: .8 })); rim.position.y = .0025; g.add(rim);
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.0004, .0004, .006, 6), MAT.metal(0xcccccc, .3)); l.position.set(s * .0012, -.0005, 0); g.add(l); }
  const glow = new THREE.Mesh(new THREE.SphereGeometry(.009, 16, 12), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  glow.position.y = .007; g.add(glow);
  return { g, set(k) { k = clamp(k, 0, 1); dome.material.emissiveIntensity = k * 4; glow.material.opacity = k * .7; } };
}

/** Cuộn dây đồng (trục theo x), bán kính r, dài L, n vòng */
export function coil(r = .025, L = .06, n = 24, { color = 0xb87333, wire = .0016, core = true } = {}) {
  const g = new THREE.Group(), pts = [];
  for (let i = 0; i <= n * 24; i++) { const t = i / 24 * Math.PI * 2, x = -L / 2 + L * i / (n * 24); pts.push(V3(x, Math.cos(t) * r, Math.sin(t) * r)); }
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 24, wire, 6, false), new THREE.MeshStandardMaterial({ color, metalness: .85, roughness: .3 }));
  m.castShadow = true; g.add(m);
  if (core) { const c = new THREE.Mesh(new THREE.CylinderGeometry(r - wire * 1.2, r - wire * 1.2, L * 1.08, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0xd8c9a8, roughness: .7, side: THREE.DoubleSide })); c.rotation.z = Math.PI / 2; g.add(c); }
  return g;
}

/** Thanh nam châm (trục x, cực N ở +x) */
export function barMagnet(L = .1, w = .018) {
  const g = new THREE.Group();
  const lbl = (t, bg) => new THREE.MeshStandardMaterial({ roughness: .4, metalness: .2, map: canvasTex(128, 64, (c, W, H) => { c.fillStyle = bg; c.fillRect(0, 0, W, H); c.fillStyle = '#fff'; c.font = 'bold 44px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, W / 2, H / 2 + 2); }) });
  const mN = lbl('N', '#c92a2a'), mS = lbl('S', '#1c5fb8');
  const n = new THREE.Mesh(new THREE.BoxGeometry(L / 2, w, w), mN); n.position.x = L / 4; g.add(n);
  const s = new THREE.Mesh(new THREE.BoxGeometry(L / 2, w, w), mS); s.position.x = -L / 4; g.add(s);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
const rad = d => d * Math.PI / 180;

/** Bóng đèn sợi đốt trên đế */
export function bulb(lab, pos, { label, Unom = 6, Pnom = 3, rotY = 0 } = {}) {
  const g = mk(lab, pos, rotY), h = base(g, .07, .06);
  const sock = new THREE.Mesh(new THREE.CylinderGeometry(.009, .011, .02, 24), MAT.metal(0xbfc4c9, .3)); sock.position.y = h + .01; g.add(sock);
  const gl = new THREE.Mesh(lathe([[0, 0], [.008, 0], [.009, .006], [.016, .02], [.017, .03], [.013, .042], [0, .047]], 40), MAT.glassLite({ color: 0xffffff, opacity: .22 }));
  gl.position.y = h + .02; g.add(gl);
  const fm = new THREE.MeshStandardMaterial({ color: 0x444444, emissive: 0xffa040, emissiveIntensity: 0, roughness: .5 });
  const fil = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(-.006, .012, 0), V3(-.004, .028, 0), V3(-.002, .026, 0), V3(0, .029, 0), V3(.002, .026, 0), V3(.004, .028, 0), V3(.006, .012, 0)]), 40, .0006, 6), fm);
  fil.position.y = h + .02; g.add(fil);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(.016, 20, 16), new THREE.MeshBasicMaterial({ color: 0xffc070, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  glow.position.y = h + .048; g.add(glow);
  const pl = new THREE.PointLight(0xffb060, 0, .6, 2); pl.position.y = h + .05; g.add(pl);
  const t = [post(g, -.026, .018, true, h), post(g, .026, .018, false, h)];
  const pl2 = plate(`${String(Unom).replace('.', ',')} V – ${String(Pnom).replace('.', ',')} W`, .05, .011); pl2.position.set(0, h + .0005, -.02); g.add(pl2);
  lab.shadow(g); gl.castShadow = false; if (label) lab.label(g, label, [0, .1, 0]);
  return { g, term: i => world(g, t[i]), Unom, Pnom, R: Unom * Unom / Pnom,
    set(P) {   // công suất thực tế (W)
      const k = clamp(P / Pnom, 0, 1.6), b = k < .02 ? 0 : Math.pow(k, 1.6);
      fm.emissiveIntensity = b * 6; fm.emissive.setHSL(.07 + .04 * Math.min(1, k), 1, .45 + .1 * Math.min(1, k)); glow.material.opacity = Math.min(.9, b * .55); pl.intensity = b * .5;
    } };
}

/** Điện trở trên đế, có nhãn */
export function resistor(lab, pos, { R, name = 'R', rotY = 0, label = true } = {}) {
  const g = mk(lab, pos, rotY), h = base(g, .09, .045);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.007, .007, .04, 24), new THREE.MeshStandardMaterial({ color: 0xd9c9a3, roughness: .6 }));
  body.rotation.z = Math.PI / 2; body.position.y = h + .012; g.add(body);
  const cols = [0x8b4513, 0x111111, 0xc92a2a, 0xd4af37];
  cols.forEach((c, i) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(.0072, .0072, .003, 24), MAT.plastic(c, .5)); b.rotation.z = Math.PI / 2; b.position.set(-.012 + i * .007 + (i == 3 ? .006 : 0), h + .012, 0); g.add(b); });
  const legs = MAT.metal(0xbfc4c9, .3);
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.0008, .0008, .022, 8), legs); l.rotation.z = Math.PI / 2; l.position.set(s * .031, h + .012, 0); g.add(l); const d = new THREE.Mesh(new THREE.CylinderGeometry(.0008, .0008, .012, 8), legs); d.position.set(s * .041, h + .006, 0); g.add(d); }
  const t = [post(g, -.038, -.012, true, h), post(g, .038, -.012, false, h)];
  const pl = plate(`${name} = ${String(R).replace('.', ',')} Ω`, .055, .012); pl.position.set(0, h + .0005, .014); g.add(pl);
  lab.shadow(g); if (label) lab.label(g, `${name} = ${String(R).replace('.', ',')} Ω`, [0, .045, 0]);
  return { g, R, name, term: i => world(g, t[i]) };
}

/** Công tắc (khoá K) dạng cầu dao, bấm để đóng/mở */
export function knife(lab, pos, { onToggle, rotY = 0, label = 'Khoá K' } = {}) {
  const g = mk(lab, pos, rotY), h = base(g, .08, .045, .012, 0x3b2f2f);
  const hinge = new THREE.Group(); hinge.position.set(-.022, h + .012, 0); g.add(hinge);
  const blk = (x) => { const b = new THREE.Mesh(new THREE.BoxGeometry(.008, .016, .014), MAT.metal(0xd4b26a, .3)); b.position.set(x, h + .008, 0); g.add(b); };
  blk(-.022); blk(.024);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(.05, .003, .008), MAT.metal(0xe0c27a, .25)); blade.position.x = .025; hinge.add(blade);
  const hd = new THREE.Mesh(new THREE.CylinderGeometry(.005, .005, .018, 16), MAT.plastic(0x111111, .4)); hd.position.set(.05, .008, 0); hinge.add(hd);
  const t = [post(g, -.032, .014, true, h), post(g, .034, .014, false, h)];
  lab.shadow(g); if (label) lab.label(g, label, [0, .06, 0]);
  const api = { g, closed: false, term: i => world(g, t[i]), set(c) { api.closed = c; tgt = c ? 0 : .85; } };
  let tgt = .85, cur = .85;
  lab.onTick(dt => { cur += (tgt - cur) * Math.min(1, dt * 10); hinge.rotation.z = cur; });
  lab.clickable(g, () => { api.set(!api.closed); onToggle && onToggle(api.closed); });
  return api;
}

/** Biến trở con chạy: kéo con chạy để thay đổi; get() trả về tỉ lệ 0..1 */
export function rheostat(lab, pos, { Rmax = 20, onChange, rotY = 0, label = 'Biến trở' } = {}) {
  const g = mk(lab, pos, rotY), h = base(g, .2, .06, .01, 0x3b3f45);
  const L = .15, core = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, L, 32), new THREE.MeshStandardMaterial({ color: 0xe8e2d0, roughness: .6 }));
  core.rotation.z = Math.PI / 2; core.position.y = h + .02; g.add(core);
  const coilTex = canvasTex(512, 64, (c, w, hh) => { c.fillStyle = '#b87333'; c.fillRect(0, 0, w, hh); for (let x = 0; x < w; x += 4) { c.fillStyle = 'rgba(60,30,10,.55)'; c.fillRect(x, 0, 1.4, hh); } }, { repeat: [1, 1] });
  const coil = new THREE.Mesh(new THREE.CylinderGeometry(.0128, .0128, L - .01, 48, 1, true), new THREE.MeshStandardMaterial({ map: coilTex, metalness: .7, roughness: .35 }));
  coilTex.rotation = Math.PI / 2; coil.rotation.z = Math.PI / 2; coil.position.y = h + .02; g.add(coil);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(.008, .04, .03), MAT.plastic(0x2a2d31, .5)); e.position.set(s * (L / 2 + .006), h + .02, 0); g.add(e); }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(L + .01, .005, .005), MAT.metal(0xc0c5ca, .3)); rail.position.set(0, h + .04, 0); g.add(rail);
  const slider = new THREE.Group(); g.add(slider);
  const sb = new THREE.Mesh(new THREE.BoxGeometry(.014, .012, .02), MAT.plastic(0x1c1c1c, .4)); sb.position.y = h + .042; slider.add(sb);
  const sk = new THREE.Mesh(new THREE.BoxGeometry(.003, .012, .012), MAT.metal(0xd4b26a, .3)); sk.position.y = h + .032; slider.add(sk);
  const t = [post(g, -.09, .022, true, h), post(g, .09, .022, false, h), post(g, .0, .022, false, h)];
  lab.shadow(g); if (label) lab.label(g, label + ` (${Rmax} Ω)`, [0, .08, 0]);
  const api = { g, k: .5, Rmax, term: i => world(g, t[i]), get: () => api.k, set(k) { api.k = clamp(k, 0, 1); slider.position.x = -L / 2 + L * api.k; } };
  api.set(.5);
  const ax = V3(1, 0, 0).applyAxisAngle(V3(0, 1, 0), rotY);
  lab.draggable({ obj: slider, axis: ax, min: -1, max: 1, get: () => -L / 2 + L * api.k, set(v) { api.set((v + L / 2) / L); onChange && onChange(api.k); } });
  return api;
}

/** Dây nối mềm giữa hai điểm (thế giới), có đầu cốt */
export function wire(lab, a, b, { color = 0xc92a2a, sag = .04, r = .0016 } = {}) {
  const A = a.clone(), B = b.clone(), up = .02;
  const pts = [A, A.clone().add(V3(0, up, 0)), A.clone().lerp(B, .5).add(V3(0, Math.max(0, up - sag) + (Math.min(A.y, B.y) - Math.max(A.y, B.y)) * .2, 0)), B.clone().add(V3(0, up, 0)), B];
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 48, r, 8, false), MAT.plastic(color, .45));
  m.castShadow = true; const g = new THREE.Group(); g.add(m); lab.scene.add(g);
  for (const p of [A, B]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(r * 2.2, r * 2.2, .008, 12), MAT.plastic(color, .4)); c.position.copy(p).add(V3(0, .005, 0)); g.add(c); }
  return g;
}
/** Bảng nhựa nền */
export function board(lab, pos, w, d, color = 0x9cc9e8) { const g = mk(lab, pos); const b = roundBox(w, .008, d, .003, MAT.plastic(color, .55)); b.position.y = .004; g.add(b); b.receiveShadow = true; return g; }
