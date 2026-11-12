// Bàn thí nghiệm hoá học: giá ống nghiệm + lọ hoá chất + đèn cồn; phản ứng do từng bài định nghĩa
import { THREE, MAT, roundBox, clamp } from './lab3d.js';
import { vessel, rack, bottle, burner, paperPack } from './chem.js';
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
  const isPaper = r => r.paper || (r.solid && r.solid.kind == 'strip');
  const B = R.map((r, i) => { const b = isPaper(r) ? paperPack(lab, [-(nb - 1) * gap / 2 + i * gap, 0, -.13], { name: r.n, color: r.solid ? r.solid.c : r.c }) : bottle(lab, [-(nb - 1) * gap / 2 + i * gap, 0, -.13], { name: r.n, color: r.c, liquid: r.k != 'sol', solidColor: r.solid ? r.solid.c : r.c, tag: r.tag || '#fffdf5' }); b.r = r; b.home = b.g.position.clone(); return b; });
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
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(.0012, .0008, 1, 8), new THREE.MeshPhysicalMaterial({ color: 0xcfe8f3, transparent: true, opacity: .6, roughness: .05 })); stream.visible = false; lab.scene.add(stream);
  const grains = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.0012, 0), new THREE.MeshStandardMaterial({ color: 0xffffff }), 14); grains.visible = false; lab.scene.add(grains);
  const dummy = new THREE.Object3D();
  let anim = null, busy = false;

  const rd = id => R.find(r => r.id == id);
  const level = t => t.items.reduce((s, x) => s + (rd(x.id).k != 'sol' ? x.amt : 0), 0) / cap;
  function draw(i) {
    const t = T[i], s = opt.react(t.items, t.heat, t.age, i, R) || {};
    if (s.level == null) s.level = level(t);
    t.s = s; t.v.set({ level: s.level, color: s.color ?? 0xcfe8f3, op: s.op ?? .45, ppt: s.ppt || null, cloud: s.cloud || 0, cloudC: s.cloudC, bubbles: s.bubbles || 0, gas: s.gas || null, solid: s.solid || null, layer: s.layer || null, mirror: s.mirror || 0 });
    if (i == sel) showObs();
    opt.onChange && opt.onChange(i, s, t);
  }
  function showObs() {
    const t = T[sel], s = t.s || {}, n = s.notes || [];
    const html = `<b>${opt.tubes[sel]}</b>${t.heat ? ' · <span style="color:#e8590c">đang đun nóng</span>' : ''}<br>${t.items.length ? (n.length ? n.join('<br>') : 'Chưa quan sát thấy hiện tượng.') : 'Ống nghiệm trống – bấm vào lọ hoá chất để cho vào ống.'}${s.eq && s.eq.length ? `<div class="eq">${s.eq.join('<br>')}</div>` : ''}`;
    if (opt.obs) $(opt.obs).innerHTML = html;
    opt.onObs && opt.onObs(html, t, s);
  }
  function select(i) { sel = i; T.forEach((t, j) => t.tag.element.classList.toggle('read', j == i)); showObs(); api && api.onSelect && api.onSelect(i); }
  function place() { const t = T[sel]; const p = t.v.g.position; selMark.position.set(p.x, p.y + t.v.H + .03 + Math.sin(performance.now() / 300) * .003, p.z); }
  T.forEach((t, i) => lab.clickable(t.v.g, () => select(i)));
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
    T.forEach((t, i) => { if (t.items.length && t.age < 40) { t.age += dt; if (((t.age * 8) | 0) != ((t.age - dt) * 8 | 0)) draw(i); } });
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
      const mouth = t.v.mouth(), side = b.home.x <= mouth.x ? -1 : 1;
      const over = V3(mouth.x + side * .035, mouth.y + .045, mouth.z);
      const e = x => x < .5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
      if (k < .3) b.g.position.lerpVectors(b.home, over, e(k / .3));
      else if (k < .7) { b.g.position.copy(over); b.g.rotation.z = side * -1 * Math.sin(Math.min(1, (k - .3) / .12) * Math.PI / 2) * 1.75; }
      else { b.g.rotation.z = side * -1.75 * (1 - e((k - .7) / .3)); b.g.position.lerpVectors(over, b.home, e((k - .7) / .3)); }
      const pouring = k > .38 && k < .68;
      if (!anim.s0) { anim.s0 = 1; sfx('clink', { vol: .4 }); }
      if (r.k == 'liq') mix('pour', 'bench', pouring ? .9 : 0);
      else if (r.k == 'drop') { if (pouring && (anim.dn = (anim.dn || 0) + dt) > .22) { anim.dn = 0; sfx('drip'); } }
      else if (pouring && !anim.spr) { anim.spr = 1; sfx('sprinkle'); }
      if (r.k != 'sol') {
        stream.visible = pouring; if (pouring) { const lip = b.g.localToWorld(V3(0, .078, 0)), end = mouth.clone().add(V3(0, -.02, 0)), L = lip.distanceTo(end); stream.position.copy(lip).lerp(end, .5); stream.scale.set(r.k == 'drop' ? .6 : 1, L, r.k == 'drop' ? .6 : 1); stream.quaternion.setFromUnitVectors(V3(0, 1, 0), lip.clone().sub(end).normalize()); stream.material.color.set(r.c); }
      } else {
        grains.visible = pouring; if (pouring) { grains.material.color.set(r.solid ? r.solid.c : r.c); const lip = b.g.localToWorld(V3(0, .078, 0)); for (let j = 0; j < 14; j++) { const f = ((performance.now() / 600 + j / 14) % 1); dummy.position.copy(lip).lerp(mouth.clone().add(V3(0, -.03, 0)), f); dummy.position.x += Math.sin(j * 7) * .002; dummy.updateMatrix(); grains.setMatrixAt(j, dummy.matrix); } grains.instanceMatrix.needsUpdate = true; }
      }
      if (k >= .68 && !anim.done) { anim.done = true; commit(t, r); }
      if (k >= 1) { b.g.position.copy(b.home); b.g.rotation.z = 0; stream.visible = grains.visible = false; anim = null; busy = false; mix('pour', 'bench', 0); sfx('clink', { vol: .5 }); }
    }
  });
  const api = {
    T, B, lamp, select, get sel() { return sel; },
    add: (id, i) => add(B.find(b => b.r.id == id), i),
    clean() { sfx('splash'); const t = T[sel]; t.items = []; t.age = 0; if (t.heat) api.heat(); draw(sel); },
    heat() {
      if (!lamp) return; const t = T[sel];
      if (!t.heat && T.some(x => x.heat)) { toast('Đèn cồn đang đun ống khác.'); return; }
      t.heat = t.heat ? 0 : 1; t.age = 0;
      if (t.heat && bath) { t.v.g.position.set(.3, .106, .06); lamp.set(true); bath.set({ bubbles: .25 }); }
      else if (t.heat) { t.v.g.position.set(.3, .12, .06); t.v.g.rotation.z = -.35; holder.visible = true; holder.position.set(.3 + Math.sin(.35) * .1, .12 + Math.cos(.35) * .1, .06); holder.rotation.z = -.35; lamp.set(true); }
      else { t.v.g.position.copy(t.home); t.v.g.rotation.z = 0; holder.visible = false; lamp.set(false); bath && bath.set({ bubbles: 0 }); }
      draw(sel); return t.heat;
    },
    draw, redraw() { T.forEach((_, i) => draw(i)); },
  };
  T.forEach((_, i) => draw(i)); select(0);
  return api;
}

/** Thanh công cụ + danh sách hoá chất trong ô HTML */
export function benchUI(bench, host, opt) {
  host.innerHTML = `<div class="row">${opt.tubes.map((t, i) => `<button class="btn ${i ? 'g' : 'on'}" data-t="${i}">${t}</button>`).join('')}</div>
  <div class="row">${opt.reagents.map(r => `<button class="btn g" data-r="${r.id}" title="${r.n}"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#${new THREE.Color(r.c).getHexString()};border:1px solid #888"></i>${r.n}</button>`).join('')}</div>
  <div class="row">${opt.heat !== false ? '<button class="btn o" data-h="1">Đun nóng / thôi đun</button>' : ''}<button class="btn g" data-c="1">Rửa ống nghiệm</button></div>`;
  const sync = () => host.querySelectorAll('[data-t]').forEach(b => { b.classList.toggle('on', +b.dataset.t == bench.sel); b.classList.toggle('g', +b.dataset.t != bench.sel); });
  host.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { bench.select(+b.dataset.t); sync(); });
  host.querySelectorAll('[data-r]').forEach(b => b.onclick = () => bench.add(b.dataset.r));
  host.querySelector('[data-h]') && (host.querySelector('[data-h]').onclick = () => bench.heat());
  host.querySelector('[data-c]').onclick = () => bench.clean();
  bench.onSelect = sync; return { sync };
}
