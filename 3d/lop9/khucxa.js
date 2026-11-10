// Bộ thí nghiệm bảng chia độ + bán trụ thuỷ tinh (Bài 5 khúc xạ, Bài 6 phản xạ toàn phần)
import { createLab, THREE, MAT, canvasTex, roundBox, cable, clamp } from '../core/lab3d.js';
import { powerSupply, tripod } from '../core/kit.js';
import { Beams, fresnel, rad, deg } from '../core/optics.js';
import { $, toast, fmt, ready } from '../core/ui.js';

export const HOME = [[.08, .5, 1.1], [0, .32, -.05]], NEAR = [[0, .37, .42], [0, .35, -.05]];
export function opticBoard(stage, { mode = 'refr', n = 1.5, onChange } = {}) {
  const lab = createLab(stage, { cam: HOME[0], target: HOME[1], table: 'bench', tableSize: [1.5, .8], minDist: .12 });
  const C = new THREE.Vector3(0, .36, -.05);           // tâm bảng
  const board = new THREE.Group(); board.position.copy(C); lab.scene.add(board);
  const panel = roundBox(.6, .5, .012, .006, new THREE.MeshStandardMaterial({ color: 0xb4bac0, roughness: .4, metalness: .05 })); panel.position.z = -.008; board.add(panel);
  const frame = roundBox(.62, .52, .006, .003, MAT.metal(0xaeb4ba, .35)); frame.position.z = -.016; board.add(frame);
  const st = tripod(lab, [0, 0, -.06], .14); void st;

  // Đĩa chia độ (Hình 5.2): 0° ở hai đầu pháp tuyến NN', 90° ở mặt phân cách
  const RP = .17, disk = new THREE.Mesh(new THREE.CircleGeometry(RP, 128), new THREE.MeshStandardMaterial({
    roughness: .5, transparent: true, map: canvasTex(1024, 1024, (g, w, h) => {
      const cx = w / 2, cy = h / 2, R = w / 2 - 4; g.clearRect(0, 0, w, h);
      g.fillStyle = 'rgba(206,209,205,.97)'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
      g.strokeStyle = '#333'; g.fillStyle = '#222'; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let a = 0; a < 360; a++) {
        const L = a % 10 == 0 ? 34 : a % 5 == 0 ? 22 : 13, t = rad(a);
        g.lineWidth = a % 10 == 0 ? 2.4 : 1.4; g.beginPath(); g.moveTo(cx + Math.sin(t) * R, cy - Math.cos(t) * R); g.lineTo(cx + Math.sin(t) * (R - L), cy - Math.cos(t) * (R - L)); g.stroke();
        if (a % 10 == 0) { const v = a <= 90 ? a : a <= 180 ? 180 - a : a <= 270 ? a - 180 : 360 - a; g.font = 'bold 30px Arial'; g.save(); g.translate(cx + Math.sin(t) * (R - 56), cy - Math.cos(t) * (R - 56)); g.rotate(t); g.fillText(String(v), 0, 0); g.restore(); }
      }
      g.strokeStyle = 'rgba(30,30,30,.55)'; g.lineWidth = 2; g.setLineDash([12, 8]);
      g.beginPath(); g.moveTo(cx, cy - R); g.lineTo(cx, cy + R); g.stroke(); g.setLineDash([]);
      g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.stroke();
      g.font = 'bold 34px Arial'; g.fillText('N', cx + 24, cy - R + 70); g.fillText("N'", cx + 30, cy + R - 70);
    })
  }));
  disk.position.z = .0005; board.add(disk);

  // Bán trụ thuỷ tinh: mặt phẳng nằm ngang qua tâm, nửa dưới là thuỷ tinh
  const RG = .075, TH = .022;
  const gGeo = new THREE.CylinderGeometry(RG, RG, TH, 96, 1, false, -Math.PI / 2, Math.PI); gGeo.rotateX(Math.PI / 2);
  const glass = new THREE.Mesh(gGeo, MAT.glassLite({ color: 0xd8f3ee, opacity: .28 }));
  const edge = new THREE.Mesh(new THREE.TorusGeometry(RG, .0009, 6, 96, Math.PI), new THREE.MeshBasicMaterial({ color: 0x9fd8cc, transparent: true, opacity: .6 }));
  edge.rotation.z = Math.PI; edge.position.z = TH + .001; board.add(edge);
  glass.position.z = TH / 2 + .001; board.add(glass);
  lab.label(glass, 'Bản bán trụ thuỷ tinh', [.0, -.095, .02]);
  lab.label(board, 'Bảng thí nghiệm gắn đĩa chia độ', [.2, .23, 0]);

  // Đèn khe hẹp trên vòng tròn quanh tâm
  const RL = .215, lamp = new THREE.Group(); board.add(lamp);
  const body = roundBox(.07, .036, .036, .005, MAT.plastic(0x202326, .45)); body.position.x = -.035; lamp.add(body);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(.004, .03, .03), MAT.plastic(0x111111, .5)); cap.position.x = .002; lamp.add(cap);
  const slit = new THREE.Mesh(new THREE.PlaneGeometry(.022, .0025), new THREE.MeshBasicMaterial({ color: 0x333333 })); slit.rotation.y = Math.PI / 2; slit.position.x = .0045; slit.rotation.x = Math.PI / 2; lamp.add(slit);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(.05, .002, .03), MAT.metal(0x777777, .5)); fin.position.set(-.035, .019, 0); lamp.add(fin);
  lamp.position.z = .02; lab.shadow(lamp);
  lab.label(lamp, 'Đèn 12 V có khe hẹp', [-.04, .04, 0]);

  const S = { i: mode == 'refr' ? 40 : 30, on: false };
  const psu = powerSupply(lab, [.45, 0, .05], { label: 'Nguồn điện (biến áp)', onToggle: on => { S.on = on; draw(); toast(on ? 'Đã bật đèn' : 'Đã tắt đèn'); } });
  let wires = [];
  function rewire() {
    wires.forEach(w => { lab.scene.remove(w); w.geometry.dispose(); });
    const p = lamp.localToWorld(new THREE.Vector3(-.07, 0, 0)), a = psu.post(0), b = psu.post(1);
    const e = board.localToWorld(new THREE.Vector3(p.x - C.x > 0 ? .31 : -.31, clamp(p.y - C.y, -.2, .2), -.02));   // vòng ra sau mép bảng
    const q = board.localToWorld(new THREE.Vector3(Math.sign(e.x - C.x) * .3, -.22, -.04));
    wires = [cable([p.x, p.y, p.z], [e.x, e.y, e.z], { color: 0x222222, sag: .03, r: .0022 }), cable([e.x, e.y, e.z], [q.x, q.y, q.z], { color: 0x222222, sag: .02, r: .0022 }),
      cable([q.x, q.y, q.z], [a.x, a.y, a.z], { color: 0xc0392b, sag: .06 }), cable([q.x, q.y - .004, q.z], [b.x, b.y, b.z], { color: 0x222222, sag: .07 })];
    wires.forEach(w => lab.scene.add(w));
  }

  const beams = new Beams(board, .0016), beamsIn = new Beams(board, TH * .5 + .001);
  const W = .0032, WHITE = 0xffb84d;
  function result() {
    const i = rad(S.i);
    if (mode == 'refr') { const f = fresnel(1, n, i); return { i: S.i, r: deg(f.t), R: f.R, T: 1 - f.R }; }
    const f = fresnel(n, 1, i); return { i: S.i, r: f.t == null ? null : deg(f.t), R: f.R, T: f.t == null ? 0 : 1 - f.R };
  }
  function draw() {
    const i = rad(S.i), sgn = mode == 'refr' ? 1 : -1;   // đèn ở nửa trên (khúc xạ) hay nửa dưới (phản xạ toàn phần)
    const lx = -Math.sin(i) * RL, ly = sgn * Math.cos(i) * RL;
    lamp.position.x = lx; lamp.position.y = ly; lamp.rotation.z = Math.atan2(-ly, -lx);
    rewire();
    const o = result(), list = [];
    if (S.on) {
      const lit = (a, b, k, w = W) => list.push({ a, b, c: WHITE, o: clamp(k, 0, 1) * 1.1, w });
      const P = (ang, r, s = 1) => [Math.sin(ang) * r, s * Math.cos(ang) * r];
      const end = RP * .97;
      // tia tới (đến I)
      lit([lx + Math.sin(i) * .004, ly - sgn * Math.cos(i) * .004], [0, 0], 1);
      if (mode == 'refr') {
        if (o.R > .004) lit([0, 0], P(i, end * .95, 1), o.R * 3.2);              // phản xạ một phần
        const r = rad(o.r); lit([0, 0], P(r, end, -1), o.T);                     // khúc xạ vào thuỷ tinh rồi ra theo bán kính
      } else {
        lit([0, 0], P(i, end, -1), Math.min(1, o.R * (o.T > 0 ? 3 : 1)));         // tia phản xạ (về nửa dưới)
        if (o.T > 0) lit([0, 0], P(rad(o.r), end, 1), o.T);                         // tia khúc xạ ra không khí
      }
      list.push({ a: [-.003, 0], b: [.003, 0], c: 0xffffff, o: .9, w: .006 });       // điểm tới I sáng
    }
    beams.set(list);
    // phần chùm sáng đi trong khối thuỷ tinh (nửa dưới, trong bán kính RG)
    const inG = [];
    for (const b of list) {
      if (b.a[1] > 1e-6 || b.b[1] > 1e-6) continue;
      const da = Math.hypot(...b.a), db = Math.hypot(...b.b); if (Math.max(da, db) < .01) continue;
      const far = da > db ? b.a : b.b, near = da > db ? b.b : b.a, L = Math.max(da, db);
      inG.push({ ...b, a: near, b: [far[0] / L * RG, far[1] / L * RG], o: (b.o || 1) * .55, w: (b.w || W) * 1.6 });
    }
    beamsIn.set(inG);
    onChange && onChange(o, S);
  }
  // kéo đèn quanh vòng tròn
  const tmp = new THREE.Vector3();
  lab.draggable({ obj: lamp, plane: new THREE.Vector3(0, 0, 1), get: () => 0,
    set(p) { board.worldToLocal(tmp.copy(p)); const sgn = mode == 'refr' ? 1 : -1; let a = deg(Math.atan2(-tmp.x, sgn * tmp.y)); S.i = clamp(Math.round(a * 2) / 2, 0, 88); draw(); } });
  draw(); ready();
  return { lab, S, draw, result, setI(v) { S.i = clamp(v, 0, 88); draw(); }, psu };
}
