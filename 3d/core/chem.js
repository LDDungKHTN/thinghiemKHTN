// Dụng cụ thuỷ tinh & hiện tượng hoá học 3D
import { THREE, MAT, lathe, canvasTex, roundBox, clamp } from './lab3d.js';
const V3 = (...a) => new THREE.Vector3(...a);
const glassM = () => { const m = MAT.glassLite({ color: 0xf2fbff, opacity: .2 }); return m; };
let _seed = 1; const rnd = () => (_seed = (_seed * 16807) % 2147483647) / 2147483647;

/* ---- Hình dạng trong (profile bên trong) của các dụng cụ: hàm r(y) ---- */
const PROF = {
  tube: (R, H) => y => y < R ? Math.sqrt(Math.max(0, R * R - (R - y) ** 2)) : R,
  beaker: (R) => () => R,
  flask: (R, H, n) => y => y < R * 1.6 ? R * Math.sin(Math.acos(clamp((y - R * .95) / (R * 1.0), -1, 1))) * (y < R * .2 ? 1 : 1) : n,
};

/** Bình chứa tổng quát: kind 'tube' | 'beaker' | 'flask' */
export function vessel(lab, { kind = 'tube', R = .009, H = .15, neck = .008, label } = {}) {
  const g = new THREE.Group(), wt = kind == 'tube' ? .0008 : .0016;
  let outer, rIn;
  if (kind == 'tube') {
    const p = []; for (let i = 0; i <= 12; i++) { const a = Math.PI / 2 * (1 - i / 12); p.push([Math.cos(a) * (R + wt), (R + wt) - Math.sin(a) * (R + wt)]); }
    p.push([R + wt, H], [R + wt * 2.4, H + .0012], [R, H + .002]);
    for (let i = 12; i >= 0; i--) { const a = Math.PI / 2 * (1 - i / 12); p.push([Math.cos(a) * R, R + wt - Math.sin(a) * R]); }
    outer = lathe(p, 40); rIn = PROF.tube(R, H);
  } else if (kind == 'beaker') {
    outer = lathe([[0, 0], [R + wt - .002, 0], [R + wt, .002], [R + wt, H], [R + wt * 2.5, H + .002], [R, H + .002], [R, wt + .001], [R - .002, wt], [0, wt]], 48); rIn = PROF.beaker(R);
  } else {   // bình cầu / bình tam giác đáy tròn
    const p = [], N = 24; for (let i = 0; i <= N; i++) { const a = -Math.PI / 2 + Math.PI * .86 * i / N; p.push([Math.cos(a) * (R + wt), R + Math.sin(a) * (R + wt)]); }
    const yN = R + Math.sin(-Math.PI / 2 + Math.PI * .86) * R; p.push([neck + wt, yN + .006], [neck + wt, H], [neck + wt * 2.5, H + .002], [neck, H + .002], [neck, yN + .006]);
    for (let i = N; i >= 0; i--) { const a = -Math.PI / 2 + Math.PI * .86 * i / N; p.push([Math.cos(a) * R, R + Math.sin(a) * (R)]); }
    outer = lathe(p, 48); rIn = y => y <= yN ? Math.sqrt(Math.max(0, R * R - (y - R) ** 2)) : neck;
  }
  const gl = new THREE.Mesh(outer, glassM()); gl.renderOrder = 4; g.add(gl);
  // khắc vạch chia (cốc)
  if (kind == 'beaker') { const sc = new THREE.Mesh(new THREE.CylinderGeometry(R + wt + .0002, R + wt + .0002, H * .7, 32, 1, true, -.5, 1), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: canvasTex(128, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,.85)'; c.fillStyle = 'rgba(255,255,255,.9)'; c.font = 'bold 20px Arial'; for (let i = 0; i <= 10; i++) { const y = h - i * h / 10.5 - 4; c.lineWidth = 2; c.beginPath(); c.moveTo(20, y); c.lineTo(i % 2 ? 50 : 70, y); c.stroke(); if (i % 2 == 0 && i) c.fillText(String(i * 10), 76, y + 7); } }) })); sc.position.y = H * .35 + .003; sc.renderOrder = 5; g.add(sc); }

  // Chất lỏng
  const liqM = new THREE.MeshPhysicalMaterial({ color: 0xcfe8f3, transparent: true, opacity: .45, roughness: .1, clearcoat: .8, depthWrite: false, side: THREE.DoubleSide });
  const liq = new THREE.Mesh(new THREE.BufferGeometry(), liqM); liq.renderOrder = 2; g.add(liq);
  const surfM = new THREE.MeshPhysicalMaterial({ color: 0xcfe8f3, transparent: true, opacity: .55, roughness: .05, depthWrite: false });
  const surf = new THREE.Mesh(new THREE.CircleGeometry(1, 32), surfM); surf.rotation.x = -Math.PI / 2; surf.renderOrder = 3; g.add(surf);
  // lớp kết tủa lắng ở đáy
  const pptM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .95, transparent: true, opacity: .95 });
  const pptB = new THREE.Mesh(new THREE.BufferGeometry(), pptM); pptB.renderOrder = 1; g.add(pptB);
  // hạt lơ lửng (kết tủa / vẩn đục) và bọt khí
  const NP = 160, dummy = new THREE.Object3D();
  const parts = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .9, transparent: true, opacity: .85 }), NP); parts.count = 0; parts.renderOrder = 2; g.add(parts);
  const NB = 70;
  const bub = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .55, roughness: 0, clearcoat: 1, depthWrite: false }), NB); bub.count = 0; bub.renderOrder = 3; g.add(bub);
  // lớp chất lỏng phía trên (dầu, ester…) và lớp gương bạc trên thành ống
  const layM = new THREE.MeshPhysicalMaterial({ color: 0xf2e2a0, transparent: true, opacity: .6, roughness: .05, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide });
  const lay = new THREE.Mesh(new THREE.BufferGeometry(), layM); lay.renderOrder = 2.5; lay.visible = false; g.add(lay);
  const mirM = new THREE.MeshStandardMaterial({ color: 0xe8ecef, metalness: 1, roughness: .08, transparent: true, opacity: 0, side: THREE.DoubleSide });
  const mir = new THREE.Mesh(new THREE.BufferGeometry(), mirM); mir.renderOrder = 1; g.add(mir);
  // chất rắn ở đáy (mảnh kim loại, bột…)
  const solids = new THREE.Group(); g.add(solids);
  // khí / khói phía trên miệng
  const gasM = new THREE.SpriteMaterial({ map: smokeTex(), color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  const gasSp = [0, 1, 2, 3].map(i => { const s = new THREE.Sprite(gasM.clone()); s.renderOrder = 6; g.add(s); return s; });

  const P = { y: H * .0, B: [], pp: [] };
  const st = { level: 0, color: 0xcfe8f3, op: .45, ppt: null, cloud: 0, bubbles: 0, gas: null, solid: null, temp: 20 };
  const rAt = y => rIn(y) * .985;
  function buildLiq(L) {
    if (L <= .0005) { liq.visible = surf.visible = false; return; }
    const N = 16, p = [[0, wt + .0003]];
    for (let i = 0; i <= N; i++) { const y = wt + .0003 + (L - wt) * i / N; p.push([rAt(y), y]); }
    p.push([0, L]);
    liq.geometry.dispose(); liq.geometry = lathe(p, 32); liq.visible = true;
    surf.visible = true; surf.position.y = L; const rr = rAt(L); surf.scale.set(rr, rr, 1);
  }
  function buildPpt(h) {
    if (h <= .0003) { pptB.visible = false; return; }
    const N = 8, p = [[0, wt + .0002]]; for (let i = 0; i <= N; i++) { const y = wt + .0002 + h * i / N; p.push([rAt(y) * .99, y]); } p.push([0, wt + h]);
    pptB.geometry.dispose(); pptB.geometry = lathe(p, 28); pptB.visible = true;
  }
  const api = {
    g, kind, R, H, st, rIn,
    mouth: () => g.localToWorld(V3(0, H + .004, 0)),
    /** cập nhật trạng thái: level (0..1 phần thể tích), color, op, ppt {c, amt, settle}, cloud, bubbles 0..1, gas {c, amt}, solid {kind, c, amt, metal} */
    set(s) {
      Object.assign(st, s);
      const L = st.level * H * (kind == 'flask' ? .55 : .85) + (st.level > 0 ? wt : 0);
      if (Math.abs(L - (P.L ?? -1)) > 1e-5) buildLiq(L); P.L = L;
      const c = new THREE.Color(st.color); liqM.color.copy(c); surfM.color.copy(c);
      liqM.opacity = st.op; surfM.opacity = Math.min(1, st.op + .1);
      // lớp trên
      const ly = st.layer, lh = ly && L > .002 ? Math.min(L * .9, ly.h * H) : 0, lkey = Math.round(lh * 1e5) + ':' + Math.round(L * 1e5);
      if (lkey != P.lk) { P.lk = lkey; lay.visible = lh > .0005; if (lay.visible) { const y0 = L - lh, N = 6, p = [[0, y0]]; for (let i = 0; i <= N; i++) { const y = y0 + lh * i / N; p.push([rAt(y) * .995, y]); } p.push([0, L + .0003]); lay.geometry.dispose(); lay.geometry = lathe(p, 32); } }
      if (ly) { layM.color.set(ly.c); layM.opacity = ly.op ?? .6; }
      const mk = st.mirror || 0;
      if (mk > 0 && !P.mb) { P.mb = 1; const p = []; for (let i = 0; i <= 12; i++) { const y = wt + (H * .55) * i / 12; p.push([rAt(y) * .99, y]); } mir.geometry.dispose(); mir.geometry = lathe(p, 32); }
      mirM.opacity = clamp(mk, 0, 1) * .97; mir.visible = mk > 0;
      const pp = st.ppt; pptM.color.set(pp ? pp.c : 0xffffff); const ph = pp && L > 0 ? Math.min(L * .9, pp.amt * pp.settle * H * .12) : 0; if (Math.abs(ph - (P.ph ?? -1)) > 2e-5) { buildPpt(ph); P.ph = ph; }
      parts.material.color.set(pp ? pp.c : st.cloudC || 0xffffff);
      gasSp.forEach(sp => sp.material.color.set(st.gas ? st.gas.c : 0xffffff));
      // chất rắn
      const sd = st.solid, key = sd ? sd.kind + sd.c + Math.round(sd.amt * 20) : '';
      if (key != P.sk) {
        P.sk = key; while (solids.children.length) { const o = solids.children.pop(); o.geometry.dispose(); }
        if (sd && sd.amt > .02) {
          _seed = 7; const m = new THREE.MeshStandardMaterial({ color: sd.c, metalness: sd.metal ? .9 : 0, roughness: sd.metal ? .35 : .8 });
          if (sd.kind == 'wire') { const pts = []; for (let i = 0; i <= 160; i++) { const a = i / 160 * Math.PI * 14, y = wt + .004 + i / 160 * H * .45; pts.push(V3(Math.cos(a) * R * .5, y, Math.sin(a) * R * .5)); } pts.push(V3(R * .5, H * .7, 0), V3(R * .3, H * 1.05, 0)); solids.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, .0008, 6), m)); }
          else if (sd.kind == 'nail') { const o = new THREE.Mesh(new THREE.CylinderGeometry(.0012, .0005, H * .7, 10), m); o.position.set(R * .3, H * .38, 0); o.rotation.z = .12; const hd = new THREE.Mesh(new THREE.CylinderGeometry(.0028, .0028, .0012, 14), m); hd.position.y = H * .35; o.add(hd); solids.add(o); }
          else if (sd.kind == 'sheet' || sd.kind == 'strip') { const o = new THREE.Mesh(new THREE.BoxGeometry(R * .9, H * .6, .0008), m); o.position.set(0, H * .32, 0); o.rotation.y = .4; o.rotation.z = .08; solids.add(o); }
          else { const n = Math.round(4 + sd.amt * (sd.kind == 'powder' ? 30 : 6)), sz = sd.kind == 'powder' ? R * .1 : R * .3;
            for (let i = 0; i < n; i++) { const o = new THREE.Mesh(sd.kind == 'powder' ? new THREE.IcosahedronGeometry(sz * (.6 + rnd() * .6), 0) : new THREE.DodecahedronGeometry(sz * (.6 + rnd() * .5), 0), m); const a = rnd() * 6.28, r = rnd() * (R * .6); o.position.set(Math.cos(a) * r, wt + sz * .8 + (i / n) * sz * (sd.kind == 'powder' ? 1.5 : 1.2), Math.sin(a) * r); o.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); solids.add(o); } }
          solids.children.forEach(o => o.castShadow = true);
        }
      }
    },
    tick(dt, t) {
      const L = P.L || 0;
      // bọt khí
      const nb = L > .002 ? Math.round(st.bubbles * NB) : 0;
      while (P.B.length < nb) P.B.push({ x: 0, y: 0, z: 0, v: 0, r: 0, born: false });
      P.B.length = nb; bub.count = nb;
      P.B.forEach((b, i) => {
        if (!b.born || b.y > L) { const a = rnd() * 6.28, rr = rnd() * rAt(wt + .002) * .7; b.x = Math.cos(a) * rr; b.z = Math.sin(a) * rr; b.y = wt + .002 + rnd() * (b.born ? .002 : L); b.v = .015 + rnd() * .03; b.r = (.0004 + rnd() * .0009) * (kind == 'tube' ? 1 : 1.6); b.born = true; }
        b.y += b.v * dt; b.x += Math.sin(t * 9 + i) * .0003 * dt * 60 * .02;
        dummy.position.set(b.x, b.y, b.z); dummy.scale.setScalar(b.r * (1 + (b.y / Math.max(L, .001)) * .4)); dummy.updateMatrix(); bub.setMatrixAt(i, dummy.matrix);
      });
      bub.instanceMatrix.needsUpdate = true;
      // hạt lơ lửng
      const pp = st.ppt, cloud = pp ? pp.amt * (1 - pp.settle) : st.cloud || 0, np = L > .002 ? Math.round(clamp(cloud, 0, 1) * NP) : 0;
      while (P.pp.length < np) { const a = rnd() * 6.28, y = wt + rnd() * L; P.pp.push({ a, r: rnd() * rAt(y) * .9, y, s: .00035 + rnd() * .0005 }); }
      P.pp.length = np; parts.count = np;
      P.pp.forEach((q, i) => { q.y -= dt * .002; if (q.y < wt) q.y = L * rnd(); q.a += dt * .3; dummy.position.set(Math.cos(q.a) * q.r, Math.min(q.y, L - .0005), Math.sin(q.a) * q.r); dummy.scale.setScalar(q.s); dummy.rotation.set(q.a, q.y * 50, 0); dummy.updateMatrix(); parts.setMatrixAt(i, dummy.matrix); });
      parts.instanceMatrix.needsUpdate = true;
      // khí bay lên
      const ga = st.gas ? st.gas.amt : 0;
      gasSp.forEach((s, i) => { const ph = (t * .35 + i / 4) % 1; s.position.set(Math.sin(i * 2 + t * .5) * .004, H + .01 + ph * .06, Math.cos(i * 3) * .004); const sc = (kind == 'tube' ? .018 : .04) * (.5 + ph); s.scale.set(sc, sc, 1); s.material.opacity = ga * .55 * Math.sin(ph * Math.PI); });
    },
  };
  lab.onTick((dt, t) => api.tick(dt, t));
  gl.castShadow = false; if (label) lab.label(g, label, [0, H + .03, 0]);
  api.set({});
  return api;
}
function smokeTex() {
  return canvasTex(64, 64, (c, w, h) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }, { srgb: false });
}

/** Giá ống nghiệm bằng gỗ, n lỗ; trả về vị trí đặt ống */
export function rack(lab, pos, n = 4, gap = .04) {
  const g = new THREE.Group(); g.position.set(...pos); lab.scene.add(g);
  const wood = new THREE.MeshStandardMaterial({ color: 0xb07a45, roughness: .6 }), W = n * gap + .02;
  const base = roundBox(W, .01, .07, .003, wood); base.position.y = .005; g.add(base);
  const top = roundBox(W, .008, .05, .002, wood); top.position.y = .022; g.add(top);
  for (const x of [-W / 2 + .006, W / 2 - .006]) { const s = new THREE.Mesh(new THREE.BoxGeometry(.008, .022, .05), wood); s.position.set(x, .016, 0); g.add(s); }
  for (let i = 0; i < n; i++) { const h = new THREE.Mesh(new THREE.CylinderGeometry(.0105, .0105, .0085, 20), new THREE.MeshStandardMaterial({ color: 0x3a2412 })); h.position.set(-((n - 1) * gap) / 2 + i * gap, .0262, 0); g.add(h); }
  lab.shadow(g);
  return { g, slot: i => new THREE.Vector3(pos[0] - ((n - 1) * gap) / 2 + i * gap, pos[1] + .012, pos[2]) };
}

/** Lọ hoá chất có nhãn */
export function bottle(lab, pos, { name = '', color = 0xdff3ff, liquid = true, solidColor, tag = '#fff' } = {}) {
  const g = new THREE.Group(); g.position.set(...pos); lab.scene.add(g);
  const R = .016, H = .06;
  const body = new THREE.Mesh(lathe([[0, 0], [R, 0], [R, H], [R * .55, H + .01], [R * .55, H + .018], [0, H + .018]], 32), new THREE.MeshPhysicalMaterial({ color: liquid ? 0x8a5a2b : 0xffffff, transparent: true, opacity: liquid ? .55 : .35, roughness: .1, clearcoat: 1, depthWrite: false }));
  body.renderOrder = 4; g.add(body);
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(R * .93, R * .93, H * .7, 24), new THREE.MeshStandardMaterial({ color: liquid ? color : (solidColor || color), roughness: liquid ? .2 : .9, transparent: liquid, opacity: liquid ? .8 : 1 }));
  fill.position.y = H * .35 + .001; fill.renderOrder = 2; g.add(fill);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(R * .62, R * .62, .012, 24), MAT.plastic(0x2a2a2a, .4)); cap.position.y = H + .022; g.add(cap);
  const lb = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.005, R * 1.005, .03, 32, 1, true, -.9, 1.8), new THREE.MeshStandardMaterial({ roughness: .7, map: canvasTex(256, 128, (c, w, h) => { c.fillStyle = tag; c.fillRect(0, 0, w, h); c.strokeStyle = '#999'; c.strokeRect(2, 2, w - 4, h - 4); c.fillStyle = '#111'; c.textAlign = 'center'; c.textBaseline = 'middle'; let fs = 46; c.font = `bold ${fs}px Arial`; while (c.measureText(name).width > w - 16 && fs > 18) { fs -= 2; c.font = `bold ${fs}px Arial`; } c.fillText(name, w / 2, h / 2); }) }));
  lb.position.y = H * .45; g.add(lb);
  lab.shadow(g); body.castShadow = false;
  return { g, name };
}

/** Đèn cồn */
export function burner(lab, pos) {
  const g = new THREE.Group(); g.position.set(...pos); lab.scene.add(g);
  const body = new THREE.Mesh(lathe([[0, 0], [.03, 0], [.034, .01], [.032, .03], [.02, .045], [.01, .05], [0, .05]], 40), new THREE.MeshPhysicalMaterial({ color: 0xf0fbff, transparent: true, opacity: .3, roughness: .05, clearcoat: 1, depthWrite: false }));
  body.renderOrder = 4; g.add(body);
  const alc = new THREE.Mesh(new THREE.CylinderGeometry(.028, .03, .02, 32), new THREE.MeshStandardMaterial({ color: 0xc7e6f5, transparent: true, opacity: .6 })); alc.position.y = .011; g.add(alc);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(.008, .009, .012, 20), MAT.metal(0xb8a46a, .3)); collar.position.y = .055; g.add(collar);
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(.0025, .0025, .008, 12), new THREE.MeshStandardMaterial({ color: 0x2b2116 })); wick.position.y = .064; g.add(wick);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .025, 24), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .3, clearcoat: 1 })); cap.position.set(.05, .0125, .0); g.add(cap);
  const fl = new THREE.Group(); fl.position.y = .068; g.add(fl);
  const prof = [[0, 0], [.006, .004], [.0075, .012], [.006, .022], [.003, .032], [0, .04]];
  const outer = new THREE.Mesh(lathe(prof, 24), new THREE.MeshBasicMaterial({ color: 0x5a7dff, transparent: true, opacity: .32, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  const inner = new THREE.Mesh(lathe(prof.map(([a, b]) => [a * .55, b * .55]), 20), new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  fl.add(outer, inner);
  const pl = new THREE.PointLight(0xffa860, 0, .5, 2); pl.position.y = .085; g.add(pl);
  lab.shadow(g);
  const api = { g, lit: false, set(v) { api.lit = v; fl.visible = v; pl.intensity = v ? .15 : 0; } };
  lab.onTick((dt, t) => { if (!api.lit) return; const k = 1 + Math.sin(t * 15) * .05 + Math.sin(t * 27) * .03; fl.scale.set(1, k, 1); });
  api.set(false); return api;
}

/** Nhiệt kế (thuỷ tinh, cột chất lỏng đỏ); set(t °C) với thang 0–100 */
export function thermometer(lab, parent, pos, { L = .16 } = {}) {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(.0028, .0028, L, 16), MAT.glassLite({ opacity: .35 })); tube.position.y = L / 2; tube.renderOrder = 4; g.add(tube);
  const bulbM = new THREE.Mesh(new THREE.SphereGeometry(.0034, 16, 12), new THREE.MeshStandardMaterial({ color: 0xd01818, roughness: .3 })); g.add(bulbM);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(.0009, .0009, 1, 8), new THREE.MeshStandardMaterial({ color: 0xd01818, roughness: .3 })); g.add(col);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(.008, L * .8), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(64, 512, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = '#fff'; c.globalAlpha = .9; c.fillRect(0, 0, w, h); c.globalAlpha = 1; c.fillStyle = '#111'; c.font = 'bold 15px Arial'; for (let i = 0; i <= 100; i += 2) { const y = h - 8 - i / 100 * (h - 16); c.fillRect(0, y, i % 10 ? 10 : 20, 1.5); if (i % 20 == 0) c.fillText(String(i), 26, y + 5); } }) }));
  sc.position.set(0, .02 + L * .4, .0036); g.add(sc);
  const y0 = .02, y100 = .02 + L * .8 * (1 - 16 / 512) ;
  const api = { g, T: 20, set(T) { api.T = T; const h = Math.max(.002, y0 - .01 + (clamp(T, -5, 105) / 100) * (y100 - y0) + .01); col.scale.y = h; col.position.y = h / 2; } };
  api.set(20); return api;
}
