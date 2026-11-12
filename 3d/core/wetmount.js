// Bàn làm tiêu bản ướt + kính hiển vi (dùng cho các bài thực hành sinh học lớp 6)
import { THREE, MAT, canvasTex, lerp } from './lab3d.js';
import { vessel } from './chem.js';
import { microscope, scopeUI } from './microscope.js';
import { toast } from './ui.js';

/**
 * src: 'cup' (cốc nước ao/mẫu lỏng) | 'bread' (bánh mì mốc – gắp bằng panh)
 * liquid: màu mẫu lỏng; srcLabel: nhãn nguồn mẫu
 * onStep(i), onSeen(objIndex), onPick(name)
 */
export function wetMount(lab, stage, { sample, stain, src = 'cup', liquid = 0xcfe0c0, liqOp = .55, srcLabel = 'Cốc mẫu vật', onStep, onSeen, onPick } = {}) {
  const { scene } = lab;
  const M = microscope(lab, stage, [.2, 0, -.05], { sample, stain, onChange: () => check(), onPick });
  M.g.rotation.y = -.35;
  const tb = document.createElement('div'); tb.className = 'tb'; stage.appendChild(tb); scopeUI(M, tb);
  const glassM = MAT.glassLite({ opacity: .45, color: 0xdff3ff });
  const slide = new THREE.Group(); scene.add(slide); slide.position.set(-.12, .002, .08);
  slide.add(new THREE.Mesh(new THREE.BoxGeometry(.075, .0012, .025), glassM));
  const drop = new THREE.Mesh(new THREE.SphereGeometry(.004, 20, 10, 0, 6.3, 0, 1.2), new THREE.MeshPhysicalMaterial({ color: src == 'bread' ? 0xd8eef8 : liquid, transparent: true, opacity: .6, roughness: .05 })); drop.scale.y = .35; drop.position.y = .0006; drop.visible = false; slide.add(drop);
  const bit = new THREE.Mesh(new THREE.SphereGeometry(.0025, 12, 8), new THREE.MeshStandardMaterial({ color: 0x6b6b5e, roughness: 1 })); bit.scale.y = .3; bit.position.y = .0009; bit.visible = false; slide.add(bit);
  const cover = new THREE.Mesh(new THREE.BoxGeometry(.018, .0004, .018), MAT.glassLite({ opacity: .35 })); cover.visible = false; slide.add(cover);
  lab.label(slide, 'Lam kính', [-.03, .006, .01]);
  // nguồn mẫu
  const srcG = new THREE.Group(); srcG.position.set(-.28, 0, .0); scene.add(srcG);
  let cup = null;
  if (src == 'cup') { cup = vessel(lab, { kind: 'beaker', R: .03, H: .075 }); srcG.add(cup.g); cup.set({ level: .55, color: liquid, op: liqOp }); }
  else {
    const tex = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#e9d6a8'; g.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${150 + Math.random() * 60},${110 + Math.random() * 40},60,.25)`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, Math.random() * 4, 0, 7); g.fill(); }
      for (let k = 0; k < 9; k++) { const x = 60 + Math.random() * 390, y = 60 + Math.random() * 390, r = 25 + Math.random() * 45; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, k % 3 ? 'rgba(40,60,40,.95)' : 'rgba(60,60,60,.95)'); gr.addColorStop(.6, 'rgba(160,170,150,.8)'); gr.addColorStop(1, 'rgba(240,240,230,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); for (let d = 0; d < 80; d++) { g.fillStyle = 'rgba(20,20,20,.7)'; const a = Math.random() * 6.3, rr = Math.random() * r * .6; g.fillRect(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 2, 2); } } });
    const crust = new THREE.MeshStandardMaterial({ color: 0x9c6a32, roughness: .9 }), top = new THREE.MeshStandardMaterial({ map: tex, roughness: 1 });
    const bread = new THREE.Mesh(new THREE.BoxGeometry(.1, .014, .1), [crust, crust, top, crust, crust, crust]); bread.position.y = .007; srcG.add(bread);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(.075, .065, .006, 48), MAT.plastic(0xf8f8f8, .3)); plate.position.y = -.002; srcG.add(plate); bread.position.y = .008;
  }
  lab.label(srcG, srcLabel, [0, src == 'cup' ? .095 : .04, 0]);
  // ống nhỏ giọt, panh, lamen, giấy thấm
  const drp = new THREE.Group(); scene.add(drp); drp.position.set(-.04, .01, .17); drp.rotation.z = Math.PI / 2;
  drp.add(new THREE.Mesh(new THREE.CylinderGeometry(.004, .0015, .08, 16), MAT.glassLite({ opacity: .4 })));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.007, 16, 12), MAT.plastic(0xd9480f, .6)); bulb.scale.y = 1.8; bulb.position.y = .048; drp.add(bulb);
  lab.label(drp, src == 'bread' ? 'Ống nhỏ giọt (nước cất)' : 'Ống nhỏ giọt', [0, .02, 0]);
  const tw = new THREE.Group(); scene.add(tw); tw.position.set(-.22, .004, .14); tw.rotation.y = .5;
  for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.BoxGeometry(.11, .002, .005), MAT.metal(0xd9dde2, .25)); a.position.set(0, 0, s * .003); a.rotation.y = s * .03; tw.add(a); }
  const twBit = bit.clone(); twBit.position.set(-.056, -.002, 0); twBit.visible = false; tw.add(twBit);
  if (src == 'bread') lab.label(tw, 'Panh', [.04, .01, 0]); else tw.visible = false;
  const lamen = new THREE.Mesh(new THREE.BoxGeometry(.018, .0004, .018), MAT.glassLite({ opacity: .4 })); lamen.position.set(-.04, .0003, .04); scene.add(lamen); lab.label(lamen, 'Lamen', [0, .01, 0]);
  const paper = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .0006, 40), new THREE.MeshStandardMaterial({ color: 0xfdfcf7, roughness: 1 })); paper.position.set(-.04, .0003, -.06); scene.add(paper); lab.label(paper, 'Giấy thấm', [0, .01, 0]);
  lab.shadow(drp); lab.shadow(tw); lab.shadow(srcG);
  // hoạt cảnh
  const anims = [];
  const tween = (dur, f, done) => anims.push({ t: 0, dur, f, done });
  lab.onTick(dt => { for (let i = anims.length - 1; i >= 0; i--) { const a = anims[i]; a.t = Math.min(a.dur, a.t + dt); const k = a.t / a.dur; a.f(k * k * (3 - 2 * k)); if (a.t >= a.dur) { anims.splice(i, 1); a.done && a.done(); } } if (M.S.view) check(); });
  const moveTo = (o, to, dur, done) => { const p0 = o.position.clone(), p1 = new THREE.Vector3(...to); tween(dur, e => o.position.lerpVectors(p0, p1, e), done); };
  const P0 = { tw: tw.position.clone(), drp: drp.position.clone(), lamen: lamen.position.clone(), slide: slide.position.clone(), paper: paper.position.clone() };
  const sp = slide.position, SX = sp.x, SZ = sp.z;
  const dropperTo = (from, then) => { moveTo(drp, from, .6, () => { drp.rotation.z = 0; drp.position.y = from[1]; tween(.4, e => drp.position.y = lerp(from[1], from[1] - .03, Math.sin(e * Math.PI)), () => { moveTo(drp, [SX, .05, SZ], .6, () => { drop.visible = true; drp.rotation.z = Math.PI / 2; moveTo(drp, P0.drp.toArray(), .5); then(); }); }); }); };
  const S = { step: 0, busy: false, onStage: false, seen: [false, false, false] };
  const STEPS = src == 'bread' ? [
    () => { lab.view([-.22, .2, .22], [-.22, .0, .05]); moveTo(tw, [-.25, .03, .0], .8, () => { twBit.visible = true; moveTo(tw, [SX + .056, .01, SZ], .8, () => { twBit.visible = false; bit.visible = true; moveTo(tw, P0.tw.toArray(), .6, end); }); }); },
    () => { lab.view([-.1, .16, .2], [-.12, 0, .08]); moveTo(drp, [SX, .05, SZ], .7, () => { drp.rotation.z = 0; drop.visible = true; drop.scale.set(1, .3, 1); drp.rotation.z = Math.PI / 2; moveTo(drp, P0.drp.toArray(), .5, end); }); },
    () => coverAndBlot(),
    () => toStage(),
  ] : [
    () => { lab.view([-.18, .2, .25], [-.2, .02, .04]); dropperTo([-.28, .1, .0], end); },
    () => coverAndBlot(true),
    () => toStage(),
  ];
  function coverAndBlot(blotOnly) {
    lamen.rotation.z = .5; lab.view([-.1, .16, .2], [-.12, 0, .08]);
    moveTo(lamen, [SX + .004, .008, SZ], .7, () => { tween(.6, e => { lamen.rotation.z = .5 * (1 - e); lamen.position.y = lerp(.008, .0028, e); }, () => { lamen.visible = false; cover.visible = true; cover.position.y = .0012; drop.scale.set(1.6, .2, 1.6);
      moveTo(paper, [SX + .045, .003, SZ], .6, () => { drop.scale.set(1.1, .12, 1.1); toast('Đã thấm bớt nước thừa'); moveTo(paper, P0.paper.toArray(), .5, end); }); }); });
  }
  function toStage() { moveTo(slide, [M.g.position.x + .006, .12, M.g.position.z + .03], .8, () => { slide.visible = false; S.onStage = true; M.slide(true); lab.view([.45, .3, .3], [.2, .13, -.05]); toast('Bật đèn, chọn vật kính 10x, lấy nét rồi chuyển sang 40x.'); end(); }); }
  function end() { S.busy = false; S.step++; onStep && onStep(S.step); check(); }
  const origSlide = M.slide; M.slide = v => { if (!S.onStage && (v ?? !M.S.slide)) return toast('Hãy làm tiêu bản trước (bấm “Làm bước tiếp theo”).'); origSlide(v); };
  function check() { const s = M.S; if (s.view && s.sharp && S.onStage && !S.seen[s.obj]) { S.seen[s.obj] = true; onSeen && onSeen(s.obj); } }
  return { M, S, steps: STEPS.length,
    next() { if (S.busy) return; if (S.step >= STEPS.length) return toast('Tiêu bản đã ở trên kính hiển vi.'); S.busy = true; STEPS[S.step](); },
    redo() { if (S.busy) return; S.step = 0; S.onStage = false; origSlide(false); slide.visible = true; slide.position.copy(P0.slide); drop.visible = bit.visible = cover.visible = twBit.visible = false; drop.scale.set(1, .35, 1); lamen.visible = true; lamen.position.copy(P0.lamen); lamen.rotation.z = 0; onStep && onStep(0); },
    srcG, cup };
}
