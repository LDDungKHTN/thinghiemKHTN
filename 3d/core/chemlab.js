// Bàn thí nghiệm hoá học: giá ống nghiệm + lọ hoá chất + đèn cồn; phản ứng do từng bài định nghĩa
import { THREE, MAT, roundBox, clamp } from './lab3d.js';
import { vessel, rack, bottle, burner, paperPack, solidDish } from './chem.js';
import { $, toast } from './ui.js';
import { sfx, mix } from './sfx.js';
const V3 = (...a) => new THREE.Vector3(...a);

/**
 * opt: { tubes:[label], reagents:[{id,n,c,k:'liq'|'sol'|'drop',solid?:{kind,c,metal},tag?}], react(items,heat,age,i,R)→state,
 *        vol=4 (mL mỗi lần rót), cap=20, heat=true, obs:'#id' phần tử hiển thị quan sát, onChange }
 * state: {color, op, ppt:{c,amt,settle}, cloud, bubbles, gas:{c,amt}, solid:{kind,c,amt,metal}, notes:[], eq:[], fire?}
 */
export function chemBench(lab, opt) {
  const R = opt.reagents, N = opt.tubes.length, vol = opt.vol || 4, cap = opt.cap || 20;
  const rk = rack(lab, [0, 0, .03], Math.max(N, 2), .05);
  const T = opt.tubes.map((lb, i) => {
    const v = vessel(lab, { kind: 'tube', R: .0085, H: .15 }); const p = rk.slot(i); v.g.position.copy(p); lab.scene.add(v.g);
    const tag = lab.label(v.g, lb, [0, -.0, .03]);
    return { v, items: [], heat: 0, age: 0, home: p.clone(), tag, s: {} };
  });
  // lọ hoá chất xếp hàng phía sau
  const nb = R.length, gap = Math.min(.075, .6 / nb);
  const isPaper = r => r.paper || (r.solid && r.solid.kind == 'strip' && !r.solid.metal);
  // lọ (cao) xếp hàng sau giá; đĩa chất rắn & giấy chỉ thị (thấp, sẽ bị giá che nếu để sau giá) xếp 2 cột BÊN TRÁI giá
  const flat = r => isPaper(r) || (r.k == 'sol' && r.solid);
  const backR = R.filter(r => !flat(r)), frontR = R.filter(flat);
  const rackHalf = (Math.max(N, 2) * .05 + .02) / 2;
  const rowPos = r => {
    if (flat(r)) { const i = frontR.indexOf(r); return [-rackHalf - .06 - (i % 2) * .066, 0, -.05 + Math.floor(i / 2) * .085]; }
    const n = backR.length, gp = Math.min(.075, .6 / Math.max(n, 1)), i = backR.indexOf(r); return [-(n - 1) * gp / 2 + i * gp, 0, -.13];
  };
  const B = R.map((r, i) => { const b = isPaper(r) ? paperPack(lab, rowPos(r), { name: r.n, color: r.solid ? r.solid.c : r.c })
    : r.k == 'sol' && r.solid ? solidDish(lab, rowPos(r), { name: r.n, kind: r.solid.kind, color: r.solid.c, metal: !!r.solid.metal }) : bottle(lab, rowPos(r), { name: r.n, color: r.c, liquid: r.k != 'sol', solidColor: r.solid ? r.solid.c : r.c, tag: r.tag || '#fffdf5' }); b.r = r; b.home = b.g.position.clone(); return b; });
  // đèn cồn + kẹp gỗ
  const lamp = opt.heat !== false ? burner(lab, [.3, 0, .06]) : null;
  if (lamp) lab.label(lamp.g, 'Đèn cồn', [0, .12, 0]);
  // đun cách thuỷ: cốc nước nóng trên kiềng, phía trên đèn cồn
  let bath = null;
  if (lamp && opt.bath) {
    bath = vessel(lab, { kind: 'beaker', R: .035, H: .08 }); bath.g.position.set(.3, .1, .06); lab.scene.add(bath.g); bath.set({ level: .65, color: 0xdcf0fa, op: .3 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.04, .002, 8, 32), MAT.metal(0x3a3f45, .5)); ring.rotation.x = Math.PI / 2; ring.position.set(.3, .1, .06); lab.scene.add(ring);
    for (let k = 0; k < 3; k++) { const a = k * 2.094, l = new THREE.Mesh(new THREE.CylinderGeometry(.002, .002, .1, 8), MAT.metal(0x3a3f45, .5)); l.position.set(.3 + Math.cos(a) * .04, .05, .06 + Math.sin(a) * .04); lab.scene.add(l); }
    const gauze = new THREE.Mesh(new THREE.BoxGeometry(.09, .002, .09), MAT.metal(0x777777, .6)); gauze.position.set(.3, .101, .06); lab.scene.add(gauze);
    lab.label(bath.g, 'Cốc nước nóng', [.05, .1, 0]);
  }
  const holder = new THREE.Group(); lab.scene.add(holder); holder.visible = false;
  { const w = new THREE.MeshStandardMaterial({ color: 0xc9a06a, roughness: .6 }); const a = new THREE.Mesh(new THREE.BoxGeometry(.13, .006, .012), w); a.position.x = -.075; holder.add(a); const b = new THREE.Mesh(new THREE.BoxGeometry(.13, .006, .012), w); b.position.set(-.075, .0, .016); holder.add(b); const ring = new THREE.Mesh(new THREE.TorusGeometry(.011, .002, 8, 20), MAT.metal(0x999999, .3)); ring.rotation.x = Math.PI / 2; holder.add(ring); }
  let sel = 0;
  const selMark = new THREE.Mesh(new THREE.ConeGeometry(.006, .014, 16), new THREE.MeshBasicMaterial({ color: 0xff7a00 })); selMark.rotation.x = Math.PI; lab.scene.add(selMark);
  // dòng chất lỏng khi rót
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(.0017, .0011, 1, 12), new THREE.MeshPhysicalMaterial({ color: 0xcfe8f3, transparent: true, opacity: .78, roughness: .02, clearcoat: 1, emissive: 0x2a5d78, emissiveIntensity: .25 })); stream.visible = false; lab.scene.add(stream);
  const grains = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.0012, 0), new THREE.MeshStandardMaterial({ color: 0xffffff }), 14); grains.visible = false; lab.scene.add(grains);
  const dummy = new THREE.Object3D();
  let anim = null, busy = false;

  const rd = id => R.find(r => r.id == id);
  const level = t => t.items.reduce((s, x) => s + (rd(x.id).k != 'sol' ? x.amt : 0), 0) / cap;
  function draw(i) {
    const t = T[i], s = opt.react(t.items, t.heat, t.age, i, R) || {};
    if (s.level == null) s.level = level(t);
    t.s = s;
    // màu đích; màu hiển thị đổi DẦN tới màu đích (xem fade() trong vòng lặp)
    const tg = { c: new THREE.Color(s.color ?? 0xcfe8f3), op: s.op ?? .45, sc: s.solid ? new THREE.Color(s.solid.c) : null, pc: s.ppt ? new THREE.Color(s.ppt.c) : null, cc: new THREE.Color(s.cloudC ?? (s.ppt ? s.ppt.c : 0xffffff)) };
    if (!t.cur || !t.items.length) t.cur = { c: tg.c.clone(), op: tg.op, sc: tg.sc && tg.sc.clone(), pc: tg.pc && tg.pc.clone(), cc: tg.cc.clone() };
    if (tg.sc && !t.cur.sc) t.cur.sc = tg.sc.clone(); if (tg.pc && !t.cur.pc) t.cur.pc = tg.pc.clone();
    t.tg = tg; applyCur(t);
    if (!t.items.length) t.cur = null;
    if (i == sel) showObs();
    opt.onChange && opt.onChange(i, s, t);
  }
  function applyCur(t) {
    const s = t.s || {}, c = t.cur || t.tg;
    t.v.set({ level: s.level || 0, color: c.c.getHex(), op: c.op, ppt: s.ppt ? { ...s.ppt, c: (c.pc || t.tg.pc).getHex() } : null, cloud: s.cloud || 0, cloudC: c.cc.getHex(), bubbles: s.bubbles || 0, gas: s.gas || null, solid: s.solid ? { ...s.solid, c: (c.sc || t.tg.sc).getHex() } : null, layer: s.layer || null, mirror: s.mirror || 0 });
  }
  // đổi màu từ từ: mỗi giây tiến ~45% quãng còn lại (đổi hẳn sau khoảng 4–6 giây)
  function fade(t, dt) {
    if (!t.cur || !t.tg) return; const k = 1 - Math.exp(-dt / 1.6), c = t.cur, g = t.tg;
    const d = c.c.clone().sub(g.c), diff = Math.abs(d.r) + Math.abs(d.g) + Math.abs(d.b) + Math.abs(c.op - g.op) + (g.sc && c.sc ? Math.abs(c.sc.r - g.sc.r) + Math.abs(c.sc.g - g.sc.g) + Math.abs(c.sc.b - g.sc.b) : 0) + (g.pc && c.pc ? Math.abs(c.pc.r - g.pc.r) + Math.abs(c.pc.g - g.pc.g) + Math.abs(c.pc.b - g.pc.b) : 0) + Math.abs(c.cc.r - g.cc.r) + Math.abs(c.cc.g - g.cc.g) + Math.abs(c.cc.b - g.cc.b);
    if (diff < .004) return;
    c.c.lerp(g.c, k); c.op += (g.op - c.op) * k; c.cc.lerp(g.cc, k); if (g.sc && c.sc) c.sc.lerp(g.sc, k); if (g.pc && c.pc) c.pc.lerp(g.pc, k);
    applyCur(t);
  }
  function showObs() {
    const t = T[sel], s = t.s || {}, n = s.notes || [];
    const html = `<b>${opt.tubes[sel]}</b>${t.heat ? ' · <span style="color:#e8590c">đang đun nóng</span>' : ''}<br>${t.items.length ? (n.length ? n.join('<br>') : 'Chưa quan sát thấy hiện tượng.') : 'Ống nghiệm trống – bấm vào lọ hoá chất để cho vào ống.'}${s.eq && s.eq.length ? `<div class="eq">${s.eq.join('<br>')}</div>` : ''}`;
    if (opt.obs) $(opt.obs).innerHTML = html;
    opt.onObs && opt.onObs(html, t, s);
  }
  function select(i) { sel = i; T.forEach((t, j) => t.tag.element.classList.toggle('read', j == i)); showObs(); api && api.onSelect && api.onSelect(i); }
  function place() { selMark.visible = !anim; const t = T[sel]; const p = t.v.g.position; selMark.position.set(p.x, p.y + t.v.H + .03 + Math.sin(performance.now() / 300) * .003, p.z); }
  T.forEach((t, i) => lab.clickable(t.v.g, () => { if (sel == i && api) api.inspect(); else select(i); }));   // bấm ống đang chọn: nhấc lên quan sát
  B.forEach(b => lab.clickable(b.g, () => add(b)));
  function add(b, toIdx) {
    if (busy) return; const t = T[toIdx ?? sel], r = b.r;
    if (r.k != 'sol' && level(t) + vol / cap > 1.0001) { toast('Ống nghiệm đã đầy. Hãy rửa ống hoặc chọn ống khác.'); return; }
    busy = true; anim = { b, t, k: 0, dur: r.k == 'drop' ? 1.2 : 1.6 };
  }
  function commit(t, r) {
    let it = t.items.find(x => x.id == r.id);
    const a = r.k == 'sol' ? 1 : r.k == 'drop' ? 1 : vol;
    if (r.k == 'sol') { if (it) it.amt = Math.min(it.amt + 1, r.max || 3); else t.items.push({ id: r.id, amt: 1 }); }
    else if (it) it.amt += r.k == 'drop' ? .5 : vol; else t.items.push({ id: r.id, amt: r.k == 'drop' ? .5 : vol });
    void a; t.age = 0; draw(T.indexOf(t));
  }
  lab.onTick((dt) => {
    place();
    T.forEach((t, i) => { if (t.items.length && t.age < 40) { t.age += dt; if (((t.age * 8) | 0) != ((t.age - dt) * 8 | 0)) draw(i); } fade(t, dt); });
    if (anim) {
      const { b, t } = anim; anim.k += dt / anim.dur; const k = Math.min(1, anim.k), r = b.r;
      if (b.paper) {   // giấy chỉ thị: lấy một mẩu giấy từ đĩa, nhúng vào ống nghiệm
        const s = b.strip, mouth = t.v.mouth(), from = b.home.clone().add(V3(0, .025, 0)), over = mouth.clone().add(V3(0, .04, 0)), inT = mouth.clone().add(V3(0, -.03, 0));
        s.visible = k < .7; if (!anim.s0) { anim.s0 = 1; sfx('paper'); }
        if (k < .35) s.position.lerpVectors(from, over, k / .35); else s.position.lerpVectors(over, inT, Math.min(1, (k - .35) / .3));
        if (k >= .68 && !anim.done) { anim.done = true; commit(t, r); sfx('drip', { vol: .4 }); }
        if (k >= 1) { s.visible = false; anim = null; busy = false; }
        return;
      }
      if (b.dish) {   // chất rắn: dùng panh gắp (hoặc thìa xúc bột) lấy một mẫu từ mặt kính, đưa tới miệng ống rồi thả vào
        const mouth = t.v.mouth(), from = b.home.clone().add(V3(0, .005, 0)), over = mouth.clone().add(V3(0, .035, 0)), atM = mouth.clone().add(V3(0, .004, 0));
        const bottomY = t.v.g.position.y + .006, e = x => x < .5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2, P = b.piece, Tl = b.tool, pw = b.kind == 'powder';
        P.visible = k < .7 && !(pw && k > .62); Tl.visible = k < .98;
        let tip;
        if (k < .12) tip = from.clone().add(V3(0, .03 * (1 - k / .12), 0));
        else if (k < .45) { const f = e((k - .12) / .33); tip = from.clone().lerp(over, f); tip.y += Math.sin(f * Math.PI) * .05; }
        else if (k < .55) tip = over.clone().lerp(atM, e((k - .45) / .1));
        else if (k < .7) tip = atM.clone();
        else { const f = e((k - .7) / .3); tip = atM.clone().lerp(from.clone().add(V3(0, .04, 0)), f); }
        Tl.position.copy(tip); Tl.rotation.z = pw && k > .55 && k < .7 ? -1.2 * Math.sin((k - .55) / .15 * Math.PI) : 0;
        if (k < .55 || pw) { P.position.copy(tip); P.rotation.set(0, 0, b.kind == 'nail' || b.kind == 'wire' || b.kind == 'strip' ? (k > .12 ? Math.PI / 2 : 0) : 0); if (pw) { P.scale.setScalar(.35); P.position.y += .002; } }
        else { const f = clamp((k - .55) / .13, 0, 1); P.position.set(mouth.x, atM.y + (bottomY - atM.y) * f * f, mouth.z); }
        if (!anim.s0 && k > .12) { anim.s0 = 1; sfx('clink', { vol: .3 }); }
        if (k >= .68 && !anim.done) { anim.done = true; P.visible = false; commit(t, r); sfx(pw ? 'sprinkle' : 'clink', { vol: .5 }); }
        if (k >= 1) { P.visible = Tl.visible = false; P.scale.setScalar(1); anim = null; busy = false; }
        return;
      }
      // Rót như thật: miệng lọ đặt sát trên miệng ống nghiệm được chọn, lọ nghiêng về phía ống
      const mouth = t.v.mouth(), side = b.home.x <= mouth.x ? -1 : 1, Lp = b.lipY || .078;
      const A = r.k == 'drop' ? 1.55 : r.k == 'sol' ? 1.75 : 1.95, th = side * A;       // góc nghiêng (lọ bên trái nghiêng theo chiều kim đồng hồ)
      const lipAt = ang => V3(-Lp * Math.sin(ang), Lp * Math.cos(ang), 0);              // vị trí miệng lọ so với đáy lọ khi nghiêng góc ang
      const lipT = mouth.clone().add(V3(side * .005, .01, 0));                           // miệng lọ: ngay trên vành ống, lệch nhẹ về phía lọ
      const pourBase = lipT.clone().sub(lipAt(th)), pre = pourBase.clone().add(V3(side * .03, .035, 0));
      const e = x => x < .5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
      if (b.cap) b.cap.visible = k < .05 || k > .95;                                     // mở nắp lọ khi rót
      if (k < .28) { const f = e(k / .28); b.g.position.lerpVectors(b.home, pre, f); b.g.position.y += Math.sin(f * Math.PI) * .04; b.g.rotation.z = 0; }
      else if (k < .4) { const f = e((k - .28) / .12); b.g.position.lerpVectors(pre, pourBase, f); b.g.rotation.z = th * f; }
      else if (k < .7) { b.g.position.copy(pourBase); b.g.rotation.z = th + Math.sin(k * 40) * .015; }
      else if (k < .8) { const f = e((k - .7) / .1); b.g.position.lerpVectors(pourBase, pre, f); b.g.rotation.z = th * (1 - f); }
      else { const f = e((k - .8) / .2); b.g.position.lerpVectors(pre, b.home, f); b.g.position.y += Math.sin(f * Math.PI) * .04; b.g.rotation.z = 0; }
      const pouring = k > .42 && k < .68;
      // điểm rơi: mặt chất lỏng hiện có trong ống (hoặc đáy ống)
      const tb = t.v.g.position, surfY = tb.y + Math.max(.008, (t.v.st.level || 0) * t.v.H * .85), Rin = (t.v.R || .0085) * .6;
      if (!anim.s0) { anim.s0 = 1; sfx('clink', { vol: .4 }); }
      if (r.k == 'liq') mix('pour', 'bench', pouring ? .9 : 0);
      else if (r.k == 'drop') { if (pouring && (anim.dn = (anim.dn || 0) + dt) > .22) { anim.dn = 0; sfx('drip'); } }
      else if (pouring && !anim.spr) { anim.spr = 1; sfx('sprinkle'); }
      if (r.k != 'sol') {
        stream.visible = pouring; if (pouring) { const lip = b.g.localToWorld(V3(0, Lp, 0)), end = V3(mouth.x + clamp(lip.x - mouth.x, -Rin, Rin), surfY, mouth.z), L = lip.distanceTo(end); stream.position.copy(lip).lerp(end, .5); stream.scale.set(r.k == 'drop' ? .6 : 1, L, r.k == 'drop' ? .6 : 1); stream.quaternion.setFromUnitVectors(V3(0, 1, 0), lip.clone().sub(end).normalize()); stream.material.color.set(r.c).lerp(new THREE.Color(0x9fd3f0), .35); }
      } else {
        grains.visible = pouring; if (pouring) { grains.material.color.set(r.solid ? r.solid.c : r.c); const lip = b.g.localToWorld(V3(0, Lp, 0)), endS = V3(mouth.x, surfY, mouth.z); for (let j = 0; j < 14; j++) { const f = ((performance.now() / 600 + j / 14) % 1); dummy.position.copy(lip).lerp(endS, f); dummy.position.x += Math.sin(j * 7) * .002; dummy.updateMatrix(); grains.setMatrixAt(j, dummy.matrix); } grains.instanceMatrix.needsUpdate = true; }
      }
      if (k >= .68 && !anim.done) { anim.done = true; commit(t, r); }
      if (k >= 1) { b.g.position.copy(b.home); b.g.rotation.z = 0; if (b.cap) b.cap.visible = true; stream.visible = grains.visible = false; anim = null; busy = false; mix('pour', 'bench', 0); sfx('clink', { vol: .5 }); }
    }
  });
  const api = {
    T, B, lamp, select, get sel() { return sel; },
    add: (id, i) => add(B.find(b => b.r.id == id), i),
    clean() { sfx('splash'); const t = T[sel]; t.items = []; t.age = 0; if (t.heat) api.heat(); draw(sel); },
    heat() {
      if (!lamp) return; const t = T[sel];
      if (!t.heat && T.some(x => x.heat)) { toast('Đèn cồn đang đun ống khác.'); return; }
      if (t.look) { t.look = 0; t.lk = 0; if (lookCam) { lab.view(lookCam[0], lookCam[1], 1); lookCam = null; } }
      t.heat = t.heat ? 0 : 1; t.age = 0;
      if (t.heat && bath) { t.v.g.position.set(.3, .106, .06); lamp.set(true); bath.set({ bubbles: .25 }); }
      else if (t.heat) { t.v.g.position.set(.3, .12, .06); t.v.g.rotation.z = -.35; holder.visible = true; holder.position.set(.3 + Math.sin(.35) * .1, .12 + Math.cos(.35) * .1, .06); holder.rotation.z = -.35; lamp.set(true); }
      else { t.v.g.position.copy(t.home); t.v.g.rotation.z = 0; holder.visible = false; lamp.set(false); bath && bath.set({ bubbles: 0 }); }
      draw(sel); return t.heat;
    },
    /** Nhấc ống nghiệm đang chọn ra khỏi giá, đưa lên trước mắt để quan sát (bấm lần nữa để đặt lại) */
    inspect() {
      const t = T[sel]; if (t.heat) { toast('Hãy thôi đun trước.'); return; }
      const on = !T.some(x => x.look && x === t);
      T.forEach(x => { if (x.look && x !== t) x.look = 0; });
      t.look = on ? 1 : 0; sfx('clink', { vol: .3 });
      if (on) { lookCam = lookCam || [lab.camera.position.toArray(), lab.controls.target.toArray()]; const p = t.home; lab.view([p.x + .03, .15, .32], [p.x, .1, .13], 1.1); }
      else if (lookCam) { lab.view(lookCam[0], lookCam[1], 1); lookCam = null; }
      return on;
    },
    draw, redraw() { T.forEach((_, i) => draw(i)); },
  };
  let lookCam = null;
  const lookE = x => x < .5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
  lab.onTick(dt => T.forEach(t => {
    if (t.heat) return; const goal = t.look ? 1 : 0; t.lk = t.lk ?? 0; if (t.lk == goal) return;
    t.lk = clamp(t.lk + (goal ? dt : -dt) / 1.1, 0, 1); const f = t.lk, up = t.home.clone().add(V3(0, .16, 0)), front = V3(t.home.x, .1, .13);
    if (f < .5) t.v.g.position.copy(t.home).add(V3(0, .16 * lookE(f * 2), 0)); else t.v.g.position.lerpVectors(up, front, lookE((f - .5) * 2));
    // kẹp gỗ giữ ống khi nhấc lên
    holder.visible = f > 0; holder.rotation.z = 0; holder.position.copy(t.v.g.position).add(V3(0, .12, 0));
  }));
  T.forEach((_, i) => draw(i)); select(0);
  return api;
}

/** Thanh công cụ + danh sách hoá chất trong ô HTML */
export function benchUI(bench, host, opt) {
  host.innerHTML = `<div class="row">${opt.tubes.map((t, i) => `<button class="btn ${i ? 'g' : 'on'}" data-t="${i}">${t}</button>`).join('')}</div>
  <div class="row">${opt.reagents.map(r => `<button class="btn g" data-r="${r.id}" title="${r.n}"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#${new THREE.Color(r.c).getHexString()};border:1px solid #888"></i>${r.n}</button>`).join('')}</div>
  <div class="row">${opt.heat !== false ? '<button class="btn o" data-h="1">Đun nóng / thôi đun</button>' : ''}<button class="btn g" data-l="1">🔍 Đưa ống lên quan sát / đặt lại</button><button class="btn g" data-c="1">Rửa ống nghiệm</button></div>`;
  host.querySelector('[data-l]').onclick = () => bench.inspect();
  const sync = () => host.querySelectorAll('[data-t]').forEach(b => { b.classList.toggle('on', +b.dataset.t == bench.sel); b.classList.toggle('g', +b.dataset.t != bench.sel); });
  host.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { bench.select(+b.dataset.t); sync(); });
  host.querySelectorAll('[data-r]').forEach(b => b.onclick = () => bench.add(b.dataset.r));
  host.querySelector('[data-h]') && (host.querySelector('[data-h]').onclick = () => bench.heat());
  host.querySelector('[data-c]').onclick = () => bench.clean();
  bench.onSelect = sync; return { sync };
}
