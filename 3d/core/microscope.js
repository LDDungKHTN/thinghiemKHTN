// Kính hiển vi quang học 3D + thị trường (nhìn qua thị kính) với mẫu vật vẽ theo tỉ lệ thật (µm)
import { THREE, MAT, roundBox, lathe, canvasTex, clamp } from './lab3d.js';
const V3 = (...a) => new THREE.Vector3(...a);
let _s = 1; const rnd = () => (_s = (_s * 16807) % 2147483647) / 2147483647; const seed = n => { _s = n; };

/* ---------- Mẫu vật: draw(ctx, s px/µm, t giây) quanh gốc (0,0) ---------- */
export const SAMPLES = {
  onion: { n: 'Tế bào biểu bì vảy hành', stain: 'iod', draw(g, s, t, o) {
    seed(11); const cw = 260, ch = 60; g.lineJoin = 'round';
    for (let j = -18; j <= 18; j++) for (let i = -6; i <= 6; i++) {
      const x = i * cw + (j % 2) * cw * .45 + (rnd() - .5) * 30, y = j * ch + (rnd() - .5) * 8, w = cw * (.85 + rnd() * .3), h = ch * (.9 + rnd() * .2);
      const C = { mb: ['rgba(120,160,230,.35)', 'rgba(40,60,140,.9)', 'rgba(30,40,130,.85)'], none: ['rgba(235,232,215,.35)', 'rgba(110,110,95,.75)', 'rgba(120,120,100,.6)'] }[o.stain] || ['rgba(230,190,110,.35)', 'rgba(120,80,30,.9)', 'rgba(110,60,20,.85)'];
      g.fillStyle = C[0]; g.strokeStyle = C[1]; g.lineWidth = Math.max(1, 3 * s);
      g.beginPath(); g.moveTo((x - w / 2 + 10) * s, (y - h / 2) * s); g.lineTo((x + w / 2) * s, (y - h / 2 + 4) * s); g.lineTo((x + w / 2 - 10) * s, (y + h / 2) * s); g.lineTo((x - w / 2) * s, (y + h / 2 - 4) * s); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = C[2]; g.beginPath(); g.ellipse((x + (rnd() - .5) * w * .5) * s, (y + (rnd() - .5) * h * .3) * s, 11 * s, 9 * s, 0, 0, 7); g.fill();
      if (s > .8) { g.fillStyle = 'rgba(80,40,10,.6)'; g.beginPath(); g.arc((x + (rnd() - .5) * w * .4) * s, y * s, 2 * s, 0, 7); g.fill(); }
    } } },
  cheek: { n: 'Tế bào niêm mạc miệng (nhuộm xanh methylene)', bg: '#e9eef6', draw(g, s) {
    seed(5); for (let k = 0; k < 160; k++) { const x = (rnd() - .5) * 2400, y = (rnd() - .5) * 2400, r = 30 + rnd() * 20; g.fillStyle = 'rgba(140,170,230,.35)'; g.strokeStyle = 'rgba(60,90,170,.7)'; g.lineWidth = Math.max(1, 1.5 * s); g.beginPath(); for (let a = 0; a < 6.3; a += .5) { const rr = r * (.85 + rnd() * .3); g.lineTo((x + Math.cos(a) * rr) * s, (y + Math.sin(a) * rr) * s); } g.closePath(); g.fill(); g.stroke(); g.fillStyle = 'rgba(30,40,140,.85)'; g.beginPath(); g.arc(x * s, y * s, 5 * s, 0, 7); g.fill(); } } },
  paramecium: { n: 'Giọt nước ao: trùng giày, trùng roi', bg: '#eef3e6', moving: true, draw(g, s, t) {
    seed(3); for (let k = 0; k < 18; k++) { const kind = k % 3, x0 = (rnd() - .5) * 2600, y0 = (rnd() - .5) * 2600, sp = 40 + rnd() * 60, a0 = rnd() * 6.28, wob = Math.sin(t * 1.3 + k) * .6;
      const a = a0 + wob, x = x0 + Math.cos(a0) * sp * Math.sin(t * .2 + k), y = y0 + Math.sin(a0) * sp * Math.sin(t * .2 + k);
      g.save(); g.translate(x * s, y * s); g.rotate(a);
      if (kind == 0) { // trùng giày ~220 µm
        g.fillStyle = 'rgba(190,200,170,.55)'; g.strokeStyle = 'rgba(90,100,70,.9)'; g.lineWidth = Math.max(1, 2 * s); g.beginPath(); g.ellipse(0, 0, 110 * s, 38 * s, 0, 0, 7); g.fill(); g.stroke();
        g.fillStyle = 'rgba(120,130,90,.5)'; g.beginPath(); g.ellipse(20 * s, 6 * s, 26 * s, 14 * s, .2, 0, 7); g.fill();
        g.strokeStyle = 'rgba(80,90,60,.6)'; g.lineWidth = Math.max(.5, .8 * s); for (let c = 0; c < 60; c++) { const ca = c / 60 * 6.28, cx = Math.cos(ca) * 110 * s, cy = Math.sin(ca) * 38 * s; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx * 1.08 + Math.sin(t * 20 + c) * 2 * s, cy * 1.15); g.stroke(); }
        g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(-60 * s, 0, 10 * s, 0, 7); g.arc(60 * s, -5 * s, 8 * s, 0, 7); g.fill();
      } else if (kind == 1) { // trùng roi ~60 µm, màu xanh lục
        g.fillStyle = 'rgba(60,160,60,.8)'; g.beginPath(); g.ellipse(0, 0, 30 * s, 10 * s, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(220,40,20,.9)'; g.beginPath(); g.arc(24 * s, -3 * s, 2.5 * s, 0, 7); g.fill();
        g.strokeStyle = 'rgba(60,120,60,.8)'; g.lineWidth = Math.max(.6, 1 * s); g.beginPath(); g.moveTo(30 * s, 0); for (let i = 0; i < 20; i++) g.lineTo((30 + i * 3) * s, Math.sin(i * .9 + t * 15) * 5 * s); g.stroke();
      } else { // tảo lục (chlorella / tảo sợi)
        g.fillStyle = 'rgba(40,140,50,.75)'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc((i - 4) * 9 * s, Math.sin(i) * 6 * s, 4 * s, 0, 7); g.fill(); }
      }
      g.restore(); } } },
  pond: { n: 'Giọt nước ao, hồ', bg: '#eef2e4', moving: true, draw(g, s, t, o) {
    seed(21); const L = []; const SP = { giay: 60, roi: 30, bh: 6, loa: 4, bx: 15, tao: 1, cau: 1, truc: 3, xoan: 12 };
    for (const [k, n] of [['giay', 9], ['roi', 16], ['bh', 3], ['loa', 3], ['bx', 3], ['tao', 50], ['cau', 260], ['truc', 260], ['xoan', 80]]) for (let i = 0; i < n; i++) L.push({ k, x: (rnd() - .5) * 2000, y: (rnd() - .5) * 2000, a: rnd() * 6.28, v: SP[k] * (.5 + rnd()), ph: rnd() * 6 });
    const wrap = v => ((v + 1000) % 2000 + 2000) % 2000 - 1000, lw = w => Math.max(.6, w * s);
    for (const b of L) {
      const a = b.a + .35 * Math.sin(t * .4 + b.ph), x = wrap(b.x + Math.cos(b.a) * b.v * t), y = wrap(b.y + Math.sin(b.a) * b.v * t);
      g.save(); g.translate(x * s, y * s); g.rotate(a); let r = 10, nm = '';
      if (b.k == 'giay') { r = 110; nm = 'Trùng giày'; g.fillStyle = 'rgba(190,200,170,.55)'; g.strokeStyle = 'rgba(90,100,70,.9)'; g.lineWidth = lw(2); g.beginPath(); g.moveTo(-110 * s, 0); g.bezierCurveTo(-100 * s, -45 * s, 60 * s, -50 * s, 110 * s, -10 * s); g.bezierCurveTo(120 * s, 20 * s, 40 * s, 30 * s, 10 * s, 18 * s); g.bezierCurveTo(-20 * s, 40 * s, -100 * s, 40 * s, -110 * s, 0); g.fill(); g.stroke();
        g.fillStyle = 'rgba(120,130,90,.55)'; g.beginPath(); g.ellipse(0, 0, 26 * s, 14 * s, .2, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.65)'; g.beginPath(); g.arc(-60 * s, -5 * s, 10 * s, 0, 7); g.fill(); g.beginPath(); g.arc(60 * s, -12 * s, 9 * s, 0, 7); g.fill();
        if (s > .8) { g.strokeStyle = 'rgba(80,90,60,.5)'; g.lineWidth = lw(.8); for (let c = 0; c < 70; c++) { const ca = c / 70 * 6.28, cx = Math.cos(ca) * 112 * s, cy = Math.sin(ca) * 40 * s; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx * 1.07 + Math.sin(t * 25 + c) * 2 * s, cy * 1.18); g.stroke(); } } }
      else if (b.k == 'roi') { r = 35; nm = 'Trùng roi xanh'; g.fillStyle = 'rgba(60,160,60,.8)'; g.beginPath(); g.moveTo(30 * s, 0); g.bezierCurveTo(20 * s, -11 * s, -20 * s, -11 * s, -30 * s, 0); g.bezierCurveTo(-20 * s, 9 * s, 20 * s, 11 * s, 30 * s, 0); g.fill(); g.fillStyle = 'rgba(30,110,30,.7)'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc((-18 + i * 5) * s, (i % 2 ? 3 : -3) * s, 2.2 * s, 0, 7); g.fill(); }
        g.fillStyle = 'rgba(220,40,20,.9)'; g.beginPath(); g.arc(24 * s, -3 * s, 2.2 * s, 0, 7); g.fill(); g.strokeStyle = 'rgba(60,120,60,.8)'; g.lineWidth = lw(1); g.beginPath(); g.moveTo(30 * s, 0); for (let i = 0; i < 20; i++) g.lineTo((30 + i * 3) * s, Math.sin(i * .9 + t * 15) * 5 * s); g.stroke(); }
      else if (b.k == 'bh') { r = 150; nm = 'Trùng biến hình'; g.fillStyle = 'rgba(200,190,175,.55)'; g.strokeStyle = 'rgba(110,100,80,.8)'; g.lineWidth = lw(2); g.beginPath(); for (let q = 0; q <= 6.3; q += .15) { const rr = 110 + 45 * Math.sin(q * 3 + t * .6 + b.ph) + 25 * Math.sin(q * 5 - t * .4); g.lineTo(Math.cos(q) * rr * s, Math.sin(q) * rr * s); } g.closePath(); g.fill(); g.stroke(); g.fillStyle = 'rgba(110,90,70,.7)'; g.beginPath(); g.arc(10 * s, 0, 18 * s, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(-40 * s, 20 * s, 12 * s, 0, 7); g.fill(); }
      else if (b.k == 'loa') { r = 260; nm = 'Trùng loa kèn'; g.fillStyle = 'rgba(70,130,175,.5)'; g.strokeStyle = 'rgba(40,80,120,.85)'; g.lineWidth = lw(2); g.beginPath(); g.moveTo(-250 * s, -6 * s); g.bezierCurveTo(-80 * s, -20 * s, 150 * s, -60 * s, 250 * s, -120 * s); g.quadraticCurveTo(280 * s, 0, 250 * s, 120 * s); g.bezierCurveTo(150 * s, 60 * s, -80 * s, 20 * s, -250 * s, 6 * s); g.closePath(); g.fill(); g.stroke();
        g.strokeStyle = 'rgba(40,80,120,.5)'; g.lineWidth = lw(1); for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(-200 * s, i * 1.5 * s); g.quadraticCurveTo(60 * s, i * 12 * s, 245 * s, i * 27 * s); g.stroke(); } g.fillStyle = 'rgba(30,60,100,.6)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc((40 + i * 22) * s, Math.sin(i) * 8 * s, 9 * s, 0, 7); g.fill(); } }
      else if (b.k == 'bx') { r = 150; nm = 'Trùng bánh xe'; g.fillStyle = 'rgba(215,205,170,.6)'; g.strokeStyle = 'rgba(120,110,80,.85)'; g.lineWidth = lw(2); g.beginPath(); g.ellipse(0, 0, 100 * s, 50 * s, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-100 * s, -10 * s); g.lineTo(-170 * s, -4 * s); g.lineTo(-170 * s, 4 * s); g.lineTo(-100 * s, 10 * s); g.fill(); g.stroke();
        for (const sy of [-1, 1]) { g.beginPath(); g.arc(110 * s, sy * 30 * s, 26 * s, 0, 7); g.stroke(); for (let c = 0; c < 12; c++) { const ca = c / 12 * 6.28 + t * 6 * sy; g.beginPath(); g.moveTo((110 + Math.cos(ca) * 26) * s, (sy * 30 + Math.sin(ca) * 26) * s); g.lineTo((110 + Math.cos(ca) * 36) * s, (sy * 30 + Math.sin(ca) * 36) * s); g.stroke(); } } g.fillStyle = 'rgba(150,110,60,.6)'; g.beginPath(); g.ellipse(0, 0, 40 * s, 22 * s, 0, 0, 7); g.fill(); }
      else if (b.k == 'tao') { r = 15; nm = 'Tảo lục đơn bào'; g.fillStyle = 'rgba(40,140,50,.8)'; g.beginPath(); g.arc(0, 0, 8 * s, 0, 7); g.fill(); g.strokeStyle = 'rgba(20,90,30,.8)'; g.lineWidth = lw(.6); g.stroke(); }
      else if (b.k == 'cau') { r = 6; nm = 'Cầu khuẩn'; g.fillStyle = 'rgba(80,70,60,.85)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(i * 2.1 * s, 0, 1 * s, 0, 7); g.fill(); } }
      else if (b.k == 'truc') { r = 6; nm = 'Trực khuẩn'; g.strokeStyle = 'rgba(80,70,60,.85)'; g.lineCap = 'round'; g.lineWidth = lw(1.1); g.beginPath(); g.moveTo(-2.5 * s, 0); g.lineTo(2.5 * s, 0); g.stroke(); }
      else { r = 10; nm = 'Xoắn khuẩn'; g.strokeStyle = 'rgba(80,70,60,.85)'; g.lineWidth = lw(.8); g.beginPath(); for (let i = 0; i <= 30; i++) g.lineTo((i - 15) * .6 * s, Math.sin(i * .9 + t * 4) * 1.6 * s); g.stroke(); }
      g.restore(); o.hits && o.hits.push({ x, y, r, nm });
    } } },
  amoeba: { n: 'Trùng biến hình', bg: '#eef0e8', moving: true, draw(g, s, t) {
    seed(7); for (let k = 0; k < 6; k++) { const x = (rnd() - .5) * 1500 + Math.sin(t * .1 + k) * 40, y = (rnd() - .5) * 1500; g.fillStyle = 'rgba(190,190,170,.6)'; g.strokeStyle = 'rgba(100,100,80,.8)'; g.lineWidth = Math.max(1, 2 * s); g.beginPath(); for (let a = 0; a <= 6.3; a += .2) { const r = 120 + 50 * Math.sin(a * 3 + t * .7 + k) + 25 * Math.sin(a * 5 - t * .5); g.lineTo((x + Math.cos(a) * r) * s, (y + Math.sin(a) * r) * s); } g.closePath(); g.fill(); g.stroke(); g.fillStyle = 'rgba(90,90,70,.7)'; g.beginPath(); g.arc(x * s, y * s, 18 * s, 0, 7); g.fill(); } } },
  yogurt: { n: 'Vi khuẩn trong sữa chua (nhuộm)', bg: '#f1ece8', draw(g, s, t, o) {
    seed(9); g.lineCap = 'round';
    for (let k = 0; k < 1400; k++) { const x = (rnd() - .5) * 400, y = (rnd() - .5) * 400, a = rnd() * 3.14; g.strokeStyle = 'rgba(110,40,140,.85)'; g.lineWidth = Math.max(.8, 1 * s);
      if (k % 2) { const L = 3 + rnd() * 3; g.beginPath(); g.moveTo((x - Math.cos(a) * L) * s, (y - Math.sin(a) * L) * s); g.lineTo((x + Math.cos(a) * L) * s, (y + Math.sin(a) * L) * s); g.stroke(); }
      else { g.fillStyle = 'rgba(110,40,140,.85)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc((x + Math.cos(a) * i * 1.2) * s, (y + Math.sin(a) * i * 1.2) * s, .5 * s, 0, 7); g.fill(); } }
      o.hits && o.hits.push({ x, y, r: 4, nm: k % 2 ? 'Trực khuẩn (hình que)' : 'Liên cầu khuẩn (chuỗi hình cầu)' }); } } },
  mold: { n: 'Mốc trên bánh mì', bg: '#efe9dc', draw(g, s, t, o) {
    seed(13); g.lineCap = 'round'; for (let k = 0; k < 40; k++) { let x = (rnd() - .5) * 3000, y = (rnd() - .5) * 3000, a = rnd() * 6.28; g.strokeStyle = 'rgba(150,150,135,.9)'; g.lineWidth = Math.max(1, 8 * s); g.beginPath(); g.moveTo(x * s, y * s); for (let i = 0; i < 30; i++) { a += (rnd() - .5) * .5; x += Math.cos(a) * 30; y += Math.sin(a) * 30; g.lineTo(x * s, y * s); if (i % 4 == 0 && o.hits) o.hits.push({ x, y, r: 20, nm: 'Sợi nấm (hệ sợi)' }); } g.stroke(); o.hits && o.hits.push({ x, y, r: 60, nm: 'Túi bào tử (chứa bào tử)' }); g.fillStyle = 'rgba(40,40,40,.9)'; g.beginPath(); g.arc(x * s, y * s, 50 * s, 0, 7); g.fill(); g.fillStyle = 'rgba(90,90,90,.6)'; g.beginPath(); g.arc((x - 15) * s, (y - 15) * s, 20 * s, 0, 7); g.fill(); } } },
  leaf: { n: 'Lá cây (biểu bì)', bg: '#e6f0dc', draw(g, s) {
    seed(17); for (let j = -14; j <= 14; j++) for (let i = -14; i <= 14; i++) { const x = i * 60 + (rnd() - .5) * 20, y = j * 50 + (rnd() - .5) * 20; g.strokeStyle = 'rgba(70,120,50,.7)'; g.lineWidth = Math.max(1, 2 * s); g.fillStyle = 'rgba(150,200,120,.3)'; g.beginPath(); for (let a = 0; a < 6.3; a += 1.05) g.lineTo((x + Math.cos(a) * 32 * (1 + Math.sin(a * 3 + i) * .2)) * s, (y + Math.sin(a) * 28) * s); g.closePath(); g.fill(); g.stroke();
      if (rnd() < .15) { g.fillStyle = 'rgba(40,110,40,.8)'; g.beginPath(); g.ellipse((x + 10) * s, y * s, 12 * s, 8 * s, .3, 0, 7); g.ellipse((x + 10) * s, (y + 9) * s, 12 * s, 8 * s, -.3, 0, 7); g.fill(); g.fillStyle = 'rgba(230,240,220,.9)'; g.fillRect((x + 2) * s, (y + 3) * s, 16 * s, 2 * s); } } } },
};

/** Kính hiển vi: tạo mô hình 3D + bảng điều khiển; trả về api */
export function microscope(lab, stage, pos = [0, 0, 0], { sample = 'onion', stain = 'iod', onChange, onPick } = {}) {
  const g = new THREE.Group(); g.position.set(...pos); lab.scene.add(g);
  const body = MAT.plastic(0xeef0f2, .35), dark = MAT.plastic(0x2a2e33, .4), chrome = MAT.metal(0xd0d4d8, .2);
  const base = roundBox(.13, .02, .17, .01, body); base.position.y = .01; g.add(base);
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(.016, .018, .01, 24), new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0xfff4d0, emissiveIntensity: 0 })); lamp.position.set(0, .025, .02); g.add(lamp);
  const pillar = roundBox(.03, .2, .04, .008, body); pillar.position.set(0, .12, -.05); g.add(pillar);
  const stageP = roundBox(.1, .008, .09, .003, dark); stageP.position.set(0, .085, .02); g.add(stageP);
  for (const x of [-.03, .03]) { const c = new THREE.Mesh(new THREE.BoxGeometry(.004, .002, .03), chrome); c.position.set(x, .09, .03); g.add(c); }
  const slide = new THREE.Group(); slide.position.set(0, .09, .02); g.add(slide);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(.075, .0012, .025), MAT.glassLite({ opacity: .35 })); slide.add(glass);
  const spec = new THREE.Mesh(new THREE.BoxGeometry(.018, .0005, .018), new THREE.MeshStandardMaterial({ color: 0xd6b070, transparent: true, opacity: .7 })); spec.position.y = .0009; slide.add(spec);
  const knobC = [-1, 1].map(sx => { const k = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .01, 24), dark); k.rotation.z = Math.PI / 2; k.position.set(sx * .03, .12, -.05); g.add(k); return k; });
  const knobF = [-1, 1].map(sx => { const k = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, .01, 20), dark); k.rotation.z = Math.PI / 2; k.position.set(sx * .042, .12, -.05); g.add(k); return k; });
  const head = new THREE.Group(); g.add(head);
  const arm = roundBox(.032, .03, .1, .01, body); arm.position.set(0, .215, -.02); head.add(arm);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(.014, .014, .08, 24), body); tube.position.set(0, .19, .03); head.add(tube);
  const eyeT = new THREE.Mesh(new THREE.CylinderGeometry(.009, .009, .06, 20), dark); eyeT.rotation.x = -.6; eyeT.position.set(0, .245, .045); head.add(eyeT);
  const turret = new THREE.Group(); turret.position.set(0, .145, .03); head.add(turret);
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(.022, .02, .012, 32), chrome); turret.add(disk);
  const OBJ = [{ m: 10, c: 0xf2c94c, L: .022 }, { m: 40, c: 0x2d6cdf, L: .03 }, { m: 100, c: 0xf4f4f4, L: .036 }];
  OBJ.forEach((o, i) => { const a = i * 2.094; const ob = new THREE.Group(); ob.position.set(Math.cos(a) * .012, -.006, Math.sin(a) * .012); turret.add(ob); const b = new THREE.Mesh(new THREE.CylinderGeometry(.006, .004, o.L, 16), chrome); b.position.y = -o.L / 2; ob.add(b); const r = new THREE.Mesh(new THREE.CylinderGeometry(.0062, .0062, .003, 16), MAT.plastic(o.c, .4)); r.position.y = -o.L * .35; ob.add(r); o.g = ob; o.a = a; });
  lab.shadow(g);
  lab.label(eyeT, 'Thị kính (10x)', [0, .03, 0]); lab.label(turret, 'Đĩa quay gắn vật kính', [.05, 0, 0]); lab.label(stageP, 'Bàn kính', [.06, 0, .03]); lab.label(knobC[1], 'Ốc to', [.03, .0, 0]); lab.label(knobF[1], 'Ốc nhỏ', [.03, -.02, 0]); lab.label(lamp, 'Đèn', [0, .0, .04]);
  // trạng thái
  // z: vị trí ốc (0 = vật kính sát tiêu bản, 1 = nâng cao nhất); ZF: vị trí ảnh rõ nét (đồng tiêu cho các vật kính)
  const S = { obj: 0, z: .7, light: false, slide: false, sample, stain, pan: [0, 0], view: false };
  const ZF = .22;
  function place() {
    turret.rotation.y = -OBJ[S.obj].a + Math.PI / 2;
    head.position.y = (S.z - ZF) * .06; slide.visible = S.slide; lamp.material.emissiveIntensity = S.light ? 2 : 0;
    knobC.forEach(k => k.rotation.x = S.z * 20); knobF.forEach(k => k.rotation.x = S.z * 200);
  }
  // màn nhìn qua thị kính
  const ov = document.createElement('div'); ov.style.cssText = 'position:absolute;inset:0;background:#000;display:none;z-index:8;align-items:center;justify-content:center';
  const cv = document.createElement('canvas'); cv.width = cv.height = 640; cv.style.cssText = 'border-radius:50%;touch-action:none;cursor:grab;flex:none';
  const fit = () => { const d = Math.max(120, Math.min(ov.clientWidth, ov.clientHeight) * .92) + 'px'; cv.style.width = cv.style.height = d; };
  addEventListener('resize', () => S.view && fit()); ov.appendChild(cv);
  const info = document.createElement('div'); info.style.cssText = 'position:absolute;left:10px;top:10px;color:#ffd43b;font:600 13px Segoe UI,sans-serif;background:rgba(0,0,0,.6);padding:6px 9px;border-radius:6px'; ov.appendChild(info);
  stage.appendChild(ov);
  const hasFilter = 'filter' in CanvasRenderingContext2D.prototype;
  const off = document.createElement('canvas'); off.width = off.height = 640;
  let drag = null;
  cv.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY, ...S.pan]; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (!drag) return; const k = FOV() / cv.clientWidth; S.pan = [drag[2] - (e.clientX - drag[0]) * k, drag[3] - (e.clientY - drag[1]) * k]; });
  cv.addEventListener('pointerup', e => {
    const moved = drag && Math.hypot(e.clientX - drag[0], e.clientY - drag[1]) > 6; drag = null; if (moved || !S.hits || !S.sharp) return;
    const k = FOV() / cv.clientWidth, r = cv.getBoundingClientRect(), ux = S.pan[0] + (e.clientX - r.left - r.width / 2) * k, uy = S.pan[1] + (e.clientY - r.top - r.height / 2) * k;
    let best = null, bd = 1e9; for (const h of S.hits) { const d = Math.hypot(h.x - ux, h.y - uy) - h.r; if (d < bd) { bd = d; best = h; } }
    if (best && bd < 14 * k) { S.pick = { ...best, t: performance.now() }; onPick && onPick(best.nm); }
  });
  const FOV = () => 18000 / OBJ[S.obj].m;   // đường kính thị trường (µm) – thị kính 10x, số trường 18 mm
  function render(t) {
    const c = cv.getContext('2d'), W = 640, sp = SAMPLES[S.sample], s = W / FOV();
    c.fillStyle = '#000'; c.fillRect(0, 0, W, W);
    if (!S.light) { info.innerHTML = 'Đèn chưa bật – không nhìn thấy gì.'; return; }
    const o = off.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.filter = 'none';
    o.fillStyle = S.slide ? (sp.bg || '#f3efe4') : '#fbf7ee'; o.fillRect(0, 0, W, W);
    S.hits = [];
    if (S.slide) { o.save(); o.translate(W / 2 - S.pan[0] * s, W / 2 - S.pan[1] * s); sp.draw(o, s, t, S); o.restore(); }
    const err = Math.abs(S.z - ZF), blur = err * 900 * (OBJ[S.obj].m / 10) ** .5;
    c.save(); c.beginPath(); c.arc(W / 2, W / 2, W / 2 - 2, 0, 7); c.clip();
    if (hasFilter) c.filter = `blur(${Math.min(40, blur).toFixed(1)}px) brightness(${S.bright ?? 1})`;
    c.drawImage(off, 0, 0); c.filter = 'none';
    if (!hasFilter && blur > 1) { c.globalAlpha = .5; c.drawImage(off, 0, 0, W / Math.max(2, blur), W / Math.max(2, blur)); c.globalAlpha = 1; }
    const vg = c.createRadialGradient(W / 2, W / 2, W * .3, W / 2, W / 2, W / 2); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.65)'); c.fillStyle = vg; c.fillRect(0, 0, W, W);
    c.restore();
    const sharp = blur < 1.6;
    const pk = S.pick && performance.now() - S.pick.t < 3000 && S.hits.find(h => h.nm == S.pick.nm && Math.hypot(h.x - S.pick.x, h.y - S.pick.y) < 400);
    if (pk) { S.pick.x = pk.x; S.pick.y = pk.y; const px = W / 2 + (pk.x - S.pan[0]) * s, py = W / 2 + (pk.y - S.pan[1]) * s, rr = Math.max(14, pk.r * s * 1.15);
      c.strokeStyle = '#ffd43b'; c.lineWidth = 3; c.beginPath(); c.arc(px, py, rr, 0, 7); c.stroke(); c.font = '600 20px Segoe UI,sans-serif'; c.textAlign = 'center'; c.lineWidth = 5; c.strokeStyle = 'rgba(0,0,0,.75)'; c.strokeText(pk.nm, px, py - rr - 8); c.fillStyle = '#ffd43b'; c.fillText(pk.nm, px, py - rr - 8); }
    if (S.slide && sharp) { // thước tỉ lệ
      const L = [500, 100, 20, 10, 5].find(v => v * s < 200) || 5; c.fillStyle = '#111'; c.fillRect(W / 2 - L * s / 2, W - 70, L * s, 5); c.font = '600 18px Segoe UI,sans-serif'; c.textAlign = 'center'; c.fillText(L + ' µm', W / 2, W - 78);
    }
    info.innerHTML = `${S.slide ? '<b style="color:#fff">' + sp.n + '</b><br>' : ''}Vật kính ${OBJ[S.obj].m}x × thị kính 10x = <b>${OBJ[S.obj].m * 10} lần</b><br>${!S.slide ? 'Chưa đặt tiêu bản lên bàn kính' : S.z < .04 && S.obj ? '<span style="color:#ff8787">Vật kính quá sát tiêu bản!</span>' : sharp ? '<span style="color:#8ce99a">Ảnh rõ nét</span>' : 'Ảnh mờ – vặn ốc to, rồi ốc nhỏ'}<br><span style="opacity:.75">Kéo trong vòng tròn để dịch tiêu bản${S.hits.length && sharp ? '<br>Bấm vào một vật để biết tên' : ''}</span>`;
    S.sharp = S.slide && sharp;
  }
  const cls = document.createElement('button'); cls.className = 'btn'; cls.textContent = '✕ Rời mắt khỏi thị kính'; cls.style.cssText = 'position:absolute;right:10px;top:10px'; cls.onclick = () => api.view(false); ov.appendChild(cls);
  lab.onTick((dt, t) => { if (S.view) render(t); });
  const api = { g, S, OBJ, ZF, place, render,
    setObj(i) { S.obj = i; place(); api.changed(); }, focus(dz) { S.z = clamp(S.z + dz, 0, 1); place(); api.changed(); },
    light(v) { S.light = v ?? !S.light; place(); api.changed(); }, slide(v) { S.slide = v ?? !S.slide; place(); api.changed(); },
    setSample(k, st) { S.sample = k; if (st) S.stain = st; api.changed(); },
    view(v) { S.view = v ?? !S.view; ov.style.display = S.view ? 'flex' : 'none'; if (S.view) fit(), render(performance.now() / 1000); api.changed(); },
    changed() { onChange && onChange(S); } };
  lab.clickable(turret, () => api.setObj((S.obj + 1) % 3)); lab.clickable(lamp, () => api.light());
  knobC.forEach(k => lab.clickable(k, () => api.focus(.05))); knobF.forEach(k => lab.clickable(k, () => api.focus(.005)));
  place(); return api;
}

/** Thanh điều khiển kính hiển vi (đặt trong .tb, nổi trên cả màn thị kính) */
export function scopeUI(api, host) {
  host.style.zIndex = 9;
  const box = 'display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.92);color:#0b4f5c;border-radius:8px;padding:4px 9px;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.15)';
  host.innerHTML = `<button class="btn" data-a="light">💡 Đèn</button><button class="btn" data-a="slide">Tiêu bản</button><button class="btn p" data-a="view">👁 Nhìn thị kính</button>
  <span style="${box}">Vật kính <button class="btn" data-o="0">10x</button><button class="btn" data-o="1">40x</button><button class="btn" data-o="2">100x</button></span>
  <span style="${box}">Ốc to <input type="range" id="msC" min="0" max="1" step=".01" style="width:110px"></span>
  <span style="${box}">Ốc nhỏ <input type="range" id="msF" min="-.05" max=".05" step=".001" value="0" style="width:110px"></span>`;
  let fine = 0; const C = host.querySelector('#msC'), F = host.querySelector('#msF');
  const sync = () => { const S = api.S; host.querySelectorAll('[data-o]').forEach(b => b.classList.toggle('on', +b.dataset.o == S.obj));
    host.querySelector('[data-a=light]').classList.toggle('on', S.light); host.querySelector('[data-a=slide]').classList.toggle('on', S.slide); host.querySelector('[data-a=view]').textContent = S.view ? '✕ Rời thị kính' : '👁 Nhìn thị kính';
    C.value = S.z - fine; };
  host.querySelectorAll('[data-a]').forEach(b => b.onclick = () => api[b.dataset.a]());
  host.querySelectorAll('[data-o]').forEach(b => b.onclick = () => api.setObj(+b.dataset.o));
  const apply = () => { api.S.z = clamp(+C.value + fine, 0, 1); api.place(); api.changed(); };
  C.oninput = apply; F.oninput = () => { fine = +F.value; apply(); };
  const prev = api.changed; api.changed = () => { prev(); sync(); };
  sync(); return { sync };
}
