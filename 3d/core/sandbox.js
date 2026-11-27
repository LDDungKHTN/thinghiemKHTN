// Phòng thực hành tự do: bàn trống + Kho dụng cụ (Hoá – Lý – Sinh) + Tủ hoá chất.
// Người dùng lấy dụng cụ ra bàn, kéo thả, bấm trực tiếp để thao tác (mở nắp – châm lửa – đậy nắp đèn cồn,
// cắm ống vào giá, đặt cốc lên kiềng để đun, rót hoá chất, cầm ống lên quan sát…).
import { THREE, MAT, lathe, roundBox, canvasTex, clamp } from './lab3d.js';
import { vessel, rack, bottle, solidDish, gasJar, paperPack, burner, thermometer, pourBase, liquidStream } from './chem.js';
import { stopwatch, balance } from './kit.js';
import { supply, bulb, knife, meter, barMagnet, wire } from './elec.js';
import { compass, field } from './magnet.js';
import { candle } from './candle.js';
import { microscope, scopeUI, SAMPLES } from './microscope.js';
import { pot, seedling } from './bio.js';
import { CAT, findChem, genericReact } from './chemdb.js';
import { toast } from './ui.js';
import { sfx, mix } from './sfx.js';

const V3 = (...a) => new THREE.Vector3(...a);
const e2 = x => x < .5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
const xz = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

// ===== Danh mục kho dụng cụ =====
// cat: 'hoa' | 'ly' | 'sinh'; mỗi mục: n (tên), icon, make(ctx, pos) → item
export const KHO = [
  { id: 'tube', cat: 'hoa', n: 'Ống nghiệm', ic: '🧪' },
  { id: 'rack', cat: 'hoa', n: 'Giá (khay) ống nghiệm', ic: '🗄' },
  { id: 'b100', cat: 'hoa', n: 'Cốc thuỷ tinh 100 mL', ic: '🥛' },
  { id: 'b250', cat: 'hoa', n: 'Cốc thuỷ tinh 250 mL', ic: '🥛' },
  { id: 'flask', cat: 'hoa', n: 'Bình cầu', ic: '⚗️' },
  { id: 'burner', cat: 'hoa', n: 'Đèn cồn', ic: '🔥' },
  { id: 'tripod', cat: 'hoa', n: 'Kiềng sắt + lưới thép', ic: '🔩' },
  { id: 'stand', cat: 'hoa', n: 'Giá sắt có kẹp', ic: '🏗' },
  { id: 'thermo', cat: 'hoa', n: 'Nhiệt kế', ic: '🌡' },
  { id: 'rod', cat: 'hoa', n: 'Đũa thuỷ tinh', ic: '🥢' },
  { id: 'balance', cat: 'hoa', n: 'Cân điện tử', ic: '⚖️' },
  { id: 'candle', cat: 'hoa', n: 'Nến', ic: '🕯' },
  { id: 'supply', cat: 'ly', n: 'Nguồn điện', ic: '🔌' },
  { id: 'bulb', cat: 'ly', n: 'Bóng đèn 6 V', ic: '💡' },
  { id: 'knife', cat: 'ly', n: 'Công tắc (khoá K)', ic: '🔘' },
  { id: 'ammeter', cat: 'ly', n: 'Ampe kế', ic: '🅰' },
  { id: 'magnet', cat: 'ly', n: 'Nam châm thẳng', ic: '🧲' },
  { id: 'compass', cat: 'ly', n: 'La bàn (kim nam châm)', ic: '🧭' },
  { id: 'watch', cat: 'ly', n: 'Đồng hồ bấm giây', ic: '⏱' },
  { id: 'balance', cat: 'ly', n: 'Cân điện tử', ic: '⚖️' },
  { id: 'thermo', cat: 'ly', n: 'Nhiệt kế', ic: '🌡' },
  { id: 'candle', cat: 'ly', n: 'Nến', ic: '🕯' },
  { id: 'scope', cat: 'sinh', n: 'Kính hiển vi', ic: '🔬' },
  ...Object.keys(SAMPLES).map(k => ({ id: 'slide:' + k, cat: 'sinh', n: 'Tiêu bản: ' + SAMPLES[k].n, ic: '🔲' })),
  { id: 'lens', cat: 'sinh', n: 'Kính lúp', ic: '🔍' },
  { id: 'petri', cat: 'sinh', n: 'Đĩa petri', ic: '🧫' },
  { id: 'plant', cat: 'sinh', n: 'Chậu cây non', ic: '🪴' },
];
const VES = { tube: { kind: 'tube', R: .0085, H: .15, cap: 8, heat: 3, mass: 15, n: 'Ống nghiệm' }, b100: { kind: 'beaker', R: .025, H: .06, cap: 20, heat: 2.5, mass: 55, n: 'Cốc 100 mL' }, b250: { kind: 'beaker', R: .035, H: .09, cap: 40, heat: 1.5, mass: 95, n: 'Cốc 250 mL' }, flask: { kind: 'flask', R: .04, H: .15, neck: .012, cap: 30, heat: 2, mass: 80, n: 'Bình cầu' } };

export function sandbox(lab, stage, { panel, onSelect } = {}) {
  const scene = lab.scene, items = [];
  let sel = null, uid = 0, anim = null;
  const count = {};
  const selMark = new THREE.Mesh(new THREE.ConeGeometry(.006, .014, 16), new THREE.MeshBasicMaterial({ color: 0xff7a00 })); selMark.rotation.x = Math.PI; selMark.visible = false; scene.add(selMark);
  const stream = liquidStream(lab);
  const pipe = new THREE.Mesh(new THREE.BufferGeometry(), MAT.glassLite({ opacity: .45 })); pipe.renderOrder = 4; pipe.visible = false; scene.add(pipe);

  // ---------- chỗ trống trên bàn ----------
  function freeSpot(R) {
    for (let r = 0; r < 9; r++) for (let c = 0; c < 15; c++) {
      const x = (c % 2 ? 1 : -1) * Math.ceil(c / 2) * .075, z = .2 - r * .075;
      if (items.every(it => it.hidden || Math.hypot(it.g.position.x - x, it.g.position.z - z) > R + it.R + .012)) return V3(x, 0, z);
    }
    return V3((Math.random() - .5) * .8, 0, (Math.random() - .5) * .4);
  }
  const nameOf = (base) => { count[base] = (count[base] || 0) + 1; return count[base] > 1 ? `${base} ${count[base]}` : base; };

  // ---------- tạo vật ----------
  function add(it, pos) {
    it.uid = ++uid; it.base = it.base || 0; items.push(it);
    if (!pos) pos = freeSpot(it.R);
    it.g.position.set(pos.x, it.base, pos.z);
    if (!it.noDrag) makeDrag(it);
    if (it.label !== false) it.lb = lab.label(it.g, it.name, [0, it.lbY ?? .05, 0]);
    sfx('clink', { vol: .35 }); return it;
  }
  function makeDrag(it) {
    let off = null, start = null, moved = 0;
    it.drag = lab.draggable({ obj: it.g, handles: it.handles, plane: V3(0, 1, 0), quiet: true, get: () => 0,
      onStart() { off = null; start = it.g.position.clone(); moved = 0; if (anim && (anim.cont === it || anim.ves === it)) return; },
      set(p) {
        if (anim && (anim.cont === it || anim.ves === it)) return;
        if (!off) off = V3(p.x - it.g.position.x, 0, p.z - it.g.position.z);
        const nx = clamp(p.x - off.x, -.72, .72), nz = clamp(p.z - off.z, -.36, .36); moved = Math.max(moved, Math.hypot(nx - start.x, nz - start.z));
        if (moved > .004) { detach(it); it.g.position.set(nx, (it.base || 0) + .025, nz); it.g.rotation.set(0, it.g.rotation.y, 0); }
      },
      onEnd() { if (moved <= .004) { if (start) it.g.position.copy(start); tap(it); return; } it.g.position.y = it.base || 0; drop(it); sfx('drop', { vol: .4 }); } });
  }
  function remove(it) {
    detach(it); if (it.drag) lab.unregister(it.drag); if (it.clk) it.clk.forEach(c => lab.unregister(c));
    it.dispose && it.dispose(); scene.remove(it.g); it.hidden = true; items.splice(items.indexOf(it), 1);
    if (sel === it) select(null); rebuildCircuit();
  }

  // ---------- gắn / tháo (giá ống, kiềng, kẹp, cân, nhiệt kế…) ----------
  function detach(it) {
    if (it.on) { const h = it.on; if (h.slots) h.slots[it.slot] = null; if (h.held === it) h.held = null; if (h.loads) h.loads.delete(it); it.on = null; }
    if (it.inV) { it.inV.thermo = it.inV.thermo === it ? null : it.inV.thermo; it.inV.rodIn = it.inV.rodIn === it ? null : it.inV.rodIn; it.inV = null; }
    if (it.overB) { it.overB = null; it.g.rotation.z = 0; if (it.clampM) it.clampM.visible = false; }
    if (it.inverted) { it.inverted = null; it.g.rotation.x = 0; }
    if (it.look || it.lookFrom) { it.look = null; it.lookFrom = null; it.lk = 0; if (it.clampM) it.clampM.visible = false; }
  }
  function drop(it) {
    const p = it.g.position;
    const near = (type, r, f) => items.filter(o => o !== it && !o.hidden && o.type == type && xz(o.g.position, p) < r && (!f || f(o))).sort((a, b) => xz(a.g.position, p) - xz(b.g.position, p))[0];
    if (it.ves) {
      // ống nghiệm → lỗ trống gần nhất trên giá ống nghiệm
      if (it.type == 'tube') { for (const r of items.filter(o => o.type == 'rack')) { const i = r.slotPos.findIndex((s, k) => !r.slots[k] && xz(s, p) < .03); if (i >= 0) { r.slots[i] = it; it.on = r; it.slot = i; p.copy(r.slotPos[i]); toast('Đã cắm ống nghiệm vào giá.'); return; } } }
      // cốc / bình → đặt lên lưới của kiềng
      const tri = it.type != 'tube' && near('tripod', .06, o => !o.held); if (tri) { tri.held = it; it.on = tri; p.set(tri.g.position.x, tri.topY, tri.g.position.z); toast('Đã đặt lên kiềng (lưới thép). Đặt đèn cồn dưới kiềng rồi châm lửa để đun.'); return; }
      // ống nghiệm / bình cầu → kẹp trên giá sắt
      const st = near('stand', .12, o => !o.held && xz(o.clampPt(), p) < .06); if (st) { st.held = it; it.on = st; const c = st.clampPt(); p.set(c.x, c.y - it.ves.H * .78, c.z); toast('Đã kẹp vào giá sắt.'); return; }
      // ống nghiệm → cầm bằng kẹp gỗ, hơ trên đèn cồn
      const b = it.type == 'tube' && near('burner', .07); if (b) { it.overB = b; it.g.rotation.z = -.35; p.set(b.g.position.x, .095, b.g.position.z); it.clampM.visible = true; toast(b.lit ? 'Đang hơ nóng ống nghiệm trên ngọn lửa đèn cồn.' : 'Ống nghiệm đã kẹp trên đèn cồn – hãy châm lửa đèn.'); return; }
      // cốc úp lên nến
      const cd = it.kind == 'beaker' && near('candle', .04); if (cd) { it.inverted = cd; it.g.rotation.x = Math.PI; p.set(cd.g.position.x, it.ves.H + .002, cd.g.position.z); cd.coveredT = 0; toast('Đã úp cốc lên ngọn nến – quan sát ngọn lửa.'); return; }
    }
    // lên mặt cân
    const bal = near('balance', .08); if (bal && it.type != 'balance' && it.mass != null) { bal.loads.add(it); it.on = bal; p.set(bal.g.position.x + (Math.random() - .5) * .02, .04, bal.g.position.z - .01); return; }
    // nhiệt kế / đũa thuỷ tinh cắm vào cốc, ống
    if (it.type == 'thermo' || it.type == 'rod') { const v = items.find(o => o.ves && !o.hidden && xz(o.g.position, p) < o.ves.R + .02); if (v) { if (it.type == 'thermo') v.thermo = it; else v.rodIn = it; it.inV = v; toast(it.type == 'thermo' ? 'Đã đặt nhiệt kế vào ' + v.name.toLowerCase() + '.' : 'Đã cho đũa thuỷ tinh vào – khuấy giúp chất tan nhanh hơn.'); return; } }
    // tiêu bản → bàn kính hiển vi
    if (it.type == 'slide') { const sc = near('scope', .12); if (sc) { sc.api.setSample(it.sample); sc.api.slide(true); sc.slideItem = it; it.hidden = true; it.g.visible = false; if (it.drag) lab.unregister(it.drag); it.drag = null; toast('Đã đặt tiêu bản lên bàn kính. Bật đèn, chỉnh ốc rồi nhìn vào thị kính.'); select(sc); return; } }
    if (it.circuit) rebuildCircuit();
  }

  // ---------- chọn vật ----------
  function select(it) { sel = it; renderPanel(); onSelect && onSelect(it); }
  function tap(it) {
    if (it.onTap && it.onTap() === true) return;     // thao tác riêng của dụng cụ (đèn cồn, nến, công tắc…)
    if (it.cont) { const v = sel && sel.ves ? sel : null; if (!v) { select(it); toast('Hãy bấm chọn ống nghiệm / cốc / bình cần cho hoá chất vào trước.'); return; } transfer(it, v); return; }
    select(it);
  }

  // ---------- chứa hoá chất ----------
  function makeVessel(type, pos) {
    const d = VES[type], v = vessel(lab, { kind: d.kind, R: d.R, H: d.H, neck: d.neck }); scene.add(v.g);
    const it = { type, name: nameOf(d.n), g: v.g, R: d.kind == 'tube' ? .012 : d.R + .006, ves: d, kind: d.kind, v, items: [], age: 0, T: 25, mass: d.mass, lbY: d.H + .03 };
    // kẹp gỗ (hiện khi hơ ống trên đèn cồn hoặc cầm lên quan sát)
    const w = new THREE.MeshStandardMaterial({ color: 0xc9a06a, roughness: .6 }); const cm = new THREE.Group(); const a = new THREE.Mesh(new THREE.BoxGeometry(.12, .005, .01), w); a.position.x = -.07; cm.add(a); const rg = new THREE.Mesh(new THREE.TorusGeometry(.0105, .002, 8, 20), MAT.metal(0x999999, .3)); rg.rotation.x = Math.PI / 2; cm.add(rg); cm.position.y = d.H * .8; cm.visible = false; v.g.add(cm); it.clampM = cm;
    return add(it, pos);
  }
  const rd = id => findChem(id);
  const levelOf = v => v.items.reduce((s, x) => { const c = rd(x.id); return s + (c && (c.k == 'liq' || c.k == 'drop') ? x.amt : 0); }, 0) / v.ves.cap;
  function drawV(v) {
    const heat = v.T > 60;
    const s = v.items.length ? genericReact(v.items, heat, v.age) : { notes: [] };
    const L = Math.min(1, levelOf(v)), water = v.items.some(x => { const c = rd(x.id); return c && (c.k == 'liq') && !c.oily; });
    if (water && v.T >= 99.5 && L > 0) { s.bubbles = Math.max(s.bubbles || 0, .8); s.gas = { c: 0xffffff, amt: .35 }; s.notes = ['Nước <b>sôi</b> ở 100 °C: sủi bọt mạnh, hơi nước bốc lên.', ...(s.notes || []).filter(n => !/^Chưa quan sát/.test(n))]; }
    else if (water && v.T > 70 && L > 0) { s.bubbles = Math.max(s.bubbles || 0, .1 * (v.T - 70) / 30); }
    v.s = s;
    const tg = new THREE.Color(s.color ?? 0xeef6f8); if (!v.cur || !v.items.length) v.cur = { c: tg.clone(), op: s.op ?? .3 };
    v.tg = { c: tg, op: s.op ?? .3 };
    applyV(v, L);
  }
  function applyV(v, L = Math.min(1, levelOf(v))) { const s = v.s || {}; v.v.set({ level: L, color: v.cur.c.getHex(), op: v.cur.op, ppt: s.ppt || null, cloud: s.cloud || 0, cloudC: s.cloudC, bubbles: s.bubbles || 0, gas: s.gas || null, solid: s.solid || null, layer: s.layer || null, mirror: s.mirror || 0 }); }

  // ---------- hộp đựng hoá chất (lấy từ tủ) ----------
  function makeContainer(id) {
    const c = findChem(id); if (!c) return;
    const ex = items.find(o => o.cont && o.chem.id == id); if (ex) { select(ex); toast(`${c.n} đã có trên bàn.`); return ex; }
    const pos = freeSpot(.03).setY(0), P = [pos.x, 0, pos.z];
    const b = c.paper ? paperPack(lab, P, { name: c.n, color: c.solid.c }) : c.k == 'gas' ? gasJar(lab, P, { name: c.n, color: c.c }) : c.k == 'sol' ? solidDish(lab, P, { name: c.n, kind: c.solid.kind, color: c.solid.c, metal: !!c.solid.metal }) : bottle(lab, P, { name: c.n, color: c.c, liquid: true, tag: c.tag || '#fffdf5' });
    const it = { type: 'chem', name: c.n, g: b.g, R: .03, cont: b, chem: c, label: false, mass: 120 };
    return add(it, pos);
  }
  // rót / gắp / sục hoá chất vào bình chứa
  function transfer(cont, ves) {
    if (anim) return; const c = cont.chem;
    if (c.k == 'gas' && !(levelOf(ves) > 0)) { toast('Hãy cho dung dịch vào trước rồi mới sục khí.'); return; }
    if ((c.k == 'liq') && levelOf(ves) > .95) { toast('Đã đầy. Hãy đổ bỏ bớt hoặc dùng dụng cụ khác.'); return; }
    if (ves.look || ves.overB || ves.inverted) { /* vẫn cho phép */ }
    anim = { cont, ves, k: 0, dur: c.k == 'gas' ? 3 : c.k == 'drop' ? 1.3 : 1.7, home: cont.g.position.clone() };
  }
  function commit(ves, c) {
    const it = ves.items.find(x => x.id == c.id), dose = c.k == 'drop' ? Math.max(.3, ves.ves.cap * .04) : ves.ves.cap * .25;
    if (c.k == 'gas') { if (!it) ves.items.push({ id: c.id, amt: 1 }); }
    else if (c.k == 'sol') { if (it) it.amt = Math.min(it.amt + 1, c.max || 3); else ves.items.push({ id: c.id, amt: 1 }); }
    else if (it) it.amt += dose; else ves.items.push({ id: c.id, amt: dose });
    ves.age = 0; drawV(ves); if (sel === ves) renderPanel();
  }
  function stepAnim(dt) {
    if (!anim) return; const { cont, ves } = anim, b = cont.cont, c = cont.chem; anim.k += dt / anim.dur; const k = Math.min(1, anim.k);
    const mouth = ves.v.mouth();
    if (b.gas) {
      const top = cont.g.position.clone().add(V3(0, b.topY, 0)), lvl = ves.g.position.y + Math.max(.006, Math.min(1, levelOf(ves)) * ves.ves.H * .85 * .5);
      if (!anim.pipe) { anim.pipe = 1; const hi = Math.max(top.y, mouth.y) + .04; pipe.geometry.dispose(); pipe.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([top.clone().add(V3(0, -.02, 0)), top.clone().add(V3(0, .03, 0)), V3(top.x, hi, top.z), V3(mouth.x, hi, mouth.z), mouth.clone(), V3(mouth.x + .002, lvl, mouth.z)], false, 'catmullrom', .1), 80, .0022, 8); }
      b.lid.position.x = k > .1 && k < .95 ? .03 : 0; pipe.visible = k > .12 && k < .95; if (k > .25 && k < .9) ves.v.set({ bubbles: .7 });
    } else if (b.dish) {
      const P = b.piece, Tl = b.tool, from = anim.home.clone().add(V3(0, .005, 0)), over = mouth.clone().add(V3(0, .035, 0)), atM = mouth.clone().add(V3(0, .004, 0)), bot = ves.g.position.y + .006, pw = b.kind == 'powder';
      P.visible = k < .7 && !(pw && k > .62); Tl.visible = k < .98; let tip;
      if (k < .12) tip = from.clone().add(V3(0, .03 * (1 - k / .12), 0)); else if (k < .45) { const f = e2((k - .12) / .33); tip = from.clone().lerp(over, f); tip.y += Math.sin(f * Math.PI) * .05; } else if (k < .55) tip = over.clone().lerp(atM, e2((k - .45) / .1)); else if (k < .7) tip = atM.clone(); else tip = atM.clone().lerp(from.clone().add(V3(0, .04, 0)), e2((k - .7) / .3));
      Tl.position.copy(tip); Tl.rotation.z = pw && k > .55 && k < .7 ? -1.2 * Math.sin((k - .55) / .15 * Math.PI) : 0;
      if (k < .55 || pw) { P.position.copy(tip); P.rotation.set(0, 0, ['nail', 'wire', 'strip'].includes(b.kind) && k > .12 ? Math.PI / 2 : 0); P.scale.setScalar(pw ? .35 : 1); } else { const f = clamp((k - .55) / .13, 0, 1); P.position.set(mouth.x, atM.y + (bot - atM.y) * f * f, mouth.z); }
      if (k >= 1) { P.visible = Tl.visible = false; P.scale.setScalar(1); }
    } else if (b.paper) {
      const s = b.strip, from = anim.home.clone().add(V3(0, .025, 0)), over = mouth.clone().add(V3(0, .04, 0)), inT = mouth.clone().add(V3(0, -.03, 0));
      s.visible = k < .7; if (k < .35) s.position.lerpVectors(from, over, k / .35); else s.position.lerpVectors(over, inT, Math.min(1, (k - .35) / .3));
    } else {   // lọ dung dịch: đặt miệng lọ ngay trên miệng bình chứa, nghiêng rót
      const side = anim.home.x <= mouth.x ? -1 : 1, Lp = b.lipY || .078, th = side * (c.k == 'drop' ? 1.55 : 1.95);
      const lipT = mouth.clone().add(V3(side * (ves.kind == 'tube' ? .005 : ves.ves.R * .6), .01, 0)), base = pourBase(V3(0, Lp, 0), lipT, th), pre = base.clone().add(V3(side * .03, .035, 0));
      if (b.cap) b.cap.visible = k < .05 || k > .95;
      if (k < .28) { const f = e2(k / .28); cont.g.position.lerpVectors(anim.home, pre, f); cont.g.position.y += Math.sin(f * Math.PI) * .04; cont.g.rotation.z = 0; }
      else if (k < .4) { const f = e2((k - .28) / .12); cont.g.position.lerpVectors(pre, base, f); cont.g.rotation.z = th * f; }
      else if (k < .7) { cont.g.position.copy(base); cont.g.rotation.z = th; }
      else if (k < .8) { const f = e2((k - .7) / .1); cont.g.position.lerpVectors(base, pre, f); cont.g.rotation.z = th * (1 - f); }
      else { const f = e2((k - .8) / .2); cont.g.position.lerpVectors(pre, anim.home, f); cont.g.position.y += Math.sin(f * Math.PI) * .04; cont.g.rotation.z = 0; }
      const pouring = k > .42 && k < .68; mix('pour', 'sb', c.k == 'liq' && pouring ? .9 : 0);
      if (pouring) { const lip = cont.g.localToWorld(V3(0, Lp, 0)), sy = ves.g.position.y + Math.max(.008, Math.min(1, levelOf(ves)) * ves.ves.H * .85); stream.set(lip, V3(mouth.x + clamp(lip.x - mouth.x, -ves.ves.R * .6, ves.ves.R * .6), sy, mouth.z), c.c, c.k == 'drop' ? .6 : 1); } else stream.hide();
      if (c.k == 'drop' && pouring && (anim.dn = (anim.dn || 0) + dt) > .22) { anim.dn = 0; sfx('drip'); }
    }
    if (k >= .68 && !anim.done) { anim.done = true; commit(ves, c); sfx(c.k == 'sol' ? 'clink' : 'drip', { vol: .5 }); }
    if (k >= 1) { if (!b.gas && !b.dish && !b.paper) { cont.g.position.copy(anim.home); cont.g.rotation.z = 0; if (b.cap) b.cap.visible = true; } pipe.visible = false; if (b.lid) b.lid.position.x = 0; stream.hide(); mix('pour', 'sb', 0); anim = null; }
  }

  // ---------- các dụng cụ ----------
  const MAKE = {
    tube(p) {   // ống nghiệm không tự đứng được: cắm vào giá (chưa có giá thì lấy giá ra trước)
      let r = items.find(o => o.type == 'rack' && !o.hidden && o.slots.some(s => !s)); if (!r) r = MAKE.rack();
      const it = makeVessel('tube', p), i = r.slots.findIndex(s => !s); r.slots[i] = it; it.on = r; it.slot = i; it.g.position.copy(r.slotPos[i]); return it; }, b100: p => makeVessel('b100', p), b250: p => makeVessel('b250', p), flask: p => makeVessel('flask', p),
    rack(p) { const r = rack(lab, [0, 0, 0], 6, .045); return add({ type: 'rack', name: 'Giá ống nghiệm', g: r.g, R: .17, slots: Array(6).fill(null), lbY: .1, get slotPos() { return [0, 1, 2, 3, 4, 5].map(i => r.slot(i).add(this.g.position)); } }, p); },
    burner(p) {
      const b = burner(lab, [0, 0, 0]); const it = { type: 'burner', name: nameOf('Đèn cồn'), g: b.g, R: .045, api: b, capOn: true, lit: false, lbY: .12, mass: 150 };
      const CAP_ON = V3(0, .0705, 0), CAP_OFF = V3(.055, .0125, .0);
      const place = () => b.cap.position.copy(it.capOn ? CAP_ON : CAP_OFF); place();
      it.state = () => it.lit ? 'đang cháy – bấm để đậy nắp tắt đèn' : it.capOn ? 'đang đậy nắp – bấm để mở nắp' : 'đã mở nắp – bấm để châm lửa';
      it.onTap = () => {
        if (it.capOn) { it.capOn = false; place(); sfx('clink', { vol: .4 }); toast('Đã mở nắp đèn cồn. Bấm lần nữa để châm lửa (quẹt diêm).'); }
        else if (!it.lit) { it.match = 0; toast('Quẹt diêm, châm vào bấc đèn…'); }
        else { it.lit = false; b.set(false); it.capOn = true; place(); toast('Đậy nắp để tắt đèn cồn (không được thổi).'); }
        renderPanel(); return true;
      };
      // que diêm
      const mt = new THREE.Group(); const st = new THREE.Mesh(new THREE.CylinderGeometry(.0012, .0012, .045, 6), new THREE.MeshStandardMaterial({ color: 0xe0c08a })); st.rotation.z = 1.2; mt.add(st); const hd = new THREE.Mesh(new THREE.SphereGeometry(.0025, 8, 6), new THREE.MeshStandardMaterial({ color: 0xff7a30, emissive: 0xff5a10, emissiveIntensity: 2 })); hd.position.set(-.02, -.008, 0); mt.add(hd); mt.visible = false; b.g.add(mt);
      it.tick = dt => { if (it.match == null) return; it.match += dt; mt.visible = it.match < 1; mt.position.set(.06 - .04 * Math.min(1, it.match / .7), .085, .0); if (it.match > .7 && !it.lit) { it.lit = true; b.set(true); renderPanel(); } if (it.match >= 1) it.match = null; };
      return add(it, p);
    },
    tripod(p) {
      const g = new THREE.Group(); scene.add(g); const m = MAT.metal(0x3a3f45, .5);
      for (let k = 0; k < 3; k++) { const a = k * 2.094 + .3, l = new THREE.Mesh(new THREE.CylinderGeometry(.0025, .0025, .1, 8), m); l.position.set(Math.cos(a) * .045, .05, Math.sin(a) * .045); g.add(l); }
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.045, .003, 8, 32), m); ring.rotation.x = Math.PI / 2; ring.position.y = .1; g.add(ring);
      const gz = new THREE.Mesh(new THREE.BoxGeometry(.1, .002, .1), new THREE.MeshStandardMaterial({ color: 0x8a8f95, metalness: .7, roughness: .5, map: canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#9aa0a6'; c.fillRect(0, 0, w, h); c.strokeStyle = '#555'; for (let i = 0; i < w; i += 6) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); } c.fillStyle = '#d8d2c4'; c.beginPath(); c.arc(64, 64, 30, 0, 7); c.fill(); }) })); gz.position.y = .102; g.add(gz);
      lab.shadow(g); return add({ type: 'tripod', name: 'Kiềng sắt + lưới', g, R: .06, topY: .104, lbY: .13 }, p);
    },
    stand(p) {
      const g = new THREE.Group(); scene.add(g); const bs = roundBox(.16, .012, .1, .003, MAT.plastic(0x2b2f33, .5)); bs.position.y = .006; g.add(bs);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(.005, .005, .42, 14), MAT.metal(0xc8cdd2, .25)); rod.position.set(-.05, .21, 0); g.add(rod);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(.1, .008, .012), MAT.metal(0x9aa3ab, .35)); arm.position.set(0, .2, 0); g.add(arm);
      const jaw = new THREE.Mesh(new THREE.TorusGeometry(.013, .003, 8, 20), MAT.metal(0x9aa3ab, .35)); jaw.rotation.x = Math.PI / 2; jaw.position.set(.055, .2, 0); g.add(jaw);
      lab.shadow(g); const it = add({ type: 'stand', name: 'Giá sắt', g, R: .07, lbY: .44 }, p); it.clampPt = () => it.g.localToWorld(V3(.055, .2, 0)); return it;
    },
    thermo(p) { const g = new THREE.Group(); scene.add(g); const t = thermometer(lab, g, [0, 0, 0], { L: .16 }); g.rotation.z = 0; const it = add({ type: 'thermo', name: nameOf('Nhiệt kế'), g, R: .012, api: t, mass: 20, lbY: .18 }, p); return it; },
    rod(p) { const g = new THREE.Group(); scene.add(g); const r = new THREE.Mesh(new THREE.CylinderGeometry(.0022, .0022, .18, 10), MAT.glassLite({ opacity: .5 })); r.position.y = .09; r.renderOrder = 4; g.add(r); return add({ type: 'rod', name: 'Đũa thuỷ tinh', g, R: .01, mass: 8, lbY: .19 }, p); },
    balance(p) { const b = balance(lab, [0, 0, 0], { label: '' }); const it = add({ type: 'balance', name: 'Cân điện tử', g: b.g, R: .12, api: b, loads: new Set(), lbY: .07 }, p); return it; },
    candle(p) { const c = candle(lab, { light: true }); scene.add(c.g); c.setLit(false); const it = add({ type: 'candle', name: nameOf('Nến'), g: c.g, R: .03, api: c, lbY: .09, mass: 40 }, p);
      it.onTap = () => { if (it.coveredBy && it.coveredBy()) { toast('Hãy nhấc cốc ra trước.'); return true; } c.setLit(!c.lit); toast(c.lit ? 'Đã thắp nến.' : 'Đã tắt nến.'); return true; };
      it.coveredBy = () => items.find(o => o.inverted === it); return it; },
    supply(p) { const s = supply(lab, [0, 0, 0], { V: 6, label: '' }); s.setV(6); return add({ type: 'supply', name: 'Nguồn điện 6 V', g: s.g, R: .1, api: s, circuit: 1, lbY: .12 }, p); },
    bulb(p) { const b = bulb(lab, [0, 0, 0], { Unom: 6, Pnom: 3 }); return add({ type: 'bulb', name: 'Bóng đèn 6 V – 3 W', g: b.g, R: .05, api: b, circuit: 1, lbY: .1 }, p); },
    knife(p) { const k = knife(lab, [0, 0, 0], { label: '' }); const it = add({ type: 'knife', name: 'Công tắc K', g: k.g, R: .05, api: k, circuit: 1, lbY: .07 }, p); it.onTap = () => { k.set(!k.closed); return true; }; return it; },
    ammeter(p) { const m = meter(lab, [0, 0, 0], { kind: 'A', max: 1 }); return add({ type: 'ammeter', name: 'Ampe kế', g: m.g, R: .06, api: m, circuit: 1, lbY: .11 }, p); },
    magnet(p) { const g = barMagnet(.1, .018); g.position.y = .009; const w = new THREE.Group(); w.add(g); scene.add(w); const it = add({ type: 'magnet', name: 'Nam châm thẳng', g: w, R: .055, lbY: .04, mass: 60 }, p); it.onTap = () => { w.rotation.y += Math.PI / 4; sfx('clink', { vol: .3 }); return true; }; return it; },
    compass(p) { const g = new THREE.Group(); scene.add(g); const c = compass(lab, g, [0, 0, 0], { r: .02 }); return add({ type: 'compass', name: nameOf('La bàn'), g, R: .025, api: c, lbY: .06 }, p); },
    watch(p) { const s = stopwatch(lab, [0, 0, 0], { label: '' }); return add({ type: 'watch', name: 'Đồng hồ bấm giây', g: s.g, R: .035, api: s, lbY: .07 }, p); },
    scope(p) {
      const host = document.createElement('div'); host.className = 'tb'; host.style.cssText = 'position:static;flex-wrap:wrap;margin:6px 0'; const m = microscope(lab, stage, [0, 0, 0]);
      scopeUI(m, host); const it = add({ type: 'scope', name: 'Kính hiển vi', g: m.g, R: .09, api: m, lbY: .3 }, p); it.host = host; return it;
    },
    lens(p) { const g = new THREE.Group(); scene.add(g); const ring = new THREE.Mesh(new THREE.TorusGeometry(.025, .003, 10, 32), MAT.plastic(0x222222, .4)); ring.position.y = .03; ring.rotation.x = -1.2; g.add(ring); const gl = new THREE.Mesh(new THREE.CircleGeometry(.025, 32), MAT.glassLite({ opacity: .25 })); gl.position.copy(ring.position); gl.rotation.copy(ring.rotation); g.add(gl); const h = new THREE.Mesh(new THREE.CylinderGeometry(.004, .004, .07, 10), MAT.plastic(0x222222, .4)); h.rotation.z = Math.PI / 2; h.position.set(.06, .012, 0); g.add(h);
      const it = add({ type: 'lens', name: 'Kính lúp', g, R: .04, lbY: .07 }, p);
      it.onTap = () => { const t = items.filter(o => o !== it && !o.hidden).sort((a, b) => xz(a.g.position, it.g.position) - xz(b.g.position, it.g.position))[0]; if (!t) { toast('Đặt kính lúp cạnh vật cần quan sát.'); return true; } const q = t.g.position; lab.view([q.x + .02, q.y + .07, q.z + .09], [q.x, q.y + .02, q.z], .8); toast('Quan sát qua kính lúp: ' + t.name.toLowerCase() + '. Kéo xoay để trở lại.'); return true; }; return it; },
    petri(p) { const g = new THREE.Group(); scene.add(g); const d = new THREE.Mesh(lathe([[0, 0], [.04, 0], [.04, .012], [.038, .012], [.038, .0015], [0, .0015]], 40), MAT.glassLite({ opacity: .35 })); d.renderOrder = 4; g.add(d); const ag = new THREE.Mesh(new THREE.CylinderGeometry(.037, .037, .005, 32), new THREE.MeshStandardMaterial({ color: 0xe8d9a0, transparent: true, opacity: .8 })); ag.position.y = .004; g.add(ag); for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.CircleGeometry(.002 + Math.random() * .003, 12), new THREE.MeshStandardMaterial({ color: [0xf2f2e8, 0xe8d070, 0x8fb070][i % 3] })); c.rotation.x = -Math.PI / 2; const a = Math.random() * 6.3, r = Math.random() * .03; c.position.set(Math.cos(a) * r, .0068, Math.sin(a) * r); g.add(c); } return add({ type: 'petri', name: 'Đĩa petri (khuẩn lạc)', g, R: .045, lbY: .04, mass: 30 }, p); },
    plant(p) { const g = new THREE.Group(); scene.add(g); const pt = pot(); g.add(pt); const s = seedling({ h: .1, leaves: 5 }); s.g.position.y = pt.userData.top; g.add(s.g); return add({ type: 'plant', name: 'Chậu cây non', g, R: .055, lbY: .2, mass: 400 }, p); },
  };
  function makeSlide(key, p) { const g = new THREE.Group(); scene.add(g); const gl = new THREE.Mesh(new THREE.BoxGeometry(.075, .0012, .025), MAT.glassLite({ opacity: .45 })); gl.position.y = .001; g.add(gl); const sp = new THREE.Mesh(new THREE.BoxGeometry(.016, .0006, .016), new THREE.MeshStandardMaterial({ color: 0xd6b070, transparent: true, opacity: .8 })); sp.position.y = .0019; g.add(sp); return add({ type: 'slide', name: 'Tiêu bản', sample: key, g, R: .04, lbY: .02, mass: 5 }, p); }

  // ---------- mạch điện: tự nối dây nối tiếp giữa các linh kiện có trên bàn ----------
  let wires = [];
  function rebuildCircuit() {
    wires.forEach(w => { scene.remove(w); w.traverse(o => o.geometry && o.geometry.dispose()); }); wires = [];
    const S = items.find(o => o.type == 'supply' && !o.hidden), L = items.find(o => o.type == 'bulb' && !o.hidden); if (!S || !L) return;
    const chain = [S, items.find(o => o.type == 'knife' && !o.hidden), items.find(o => o.type == 'ammeter' && !o.hidden), L].filter(Boolean);
    for (let i = 0; i < chain.length; i++) { const a = chain[i], b = chain[(i + 1) % chain.length]; wires.push(wire(lab, a.api.term(i == 0 ? 0 : 1), b.api.term(b === S ? 1 : 0), { color: i == chain.length - 1 ? 0x1b1b1b : 0xc92a2a })); }
  }

  // ---------- vòng lặp ----------
  const earth = V3(0, 0, -40);
  lab.onTick((dt, t) => {
    stepAnim(dt);
    for (const it of items) {
      it.tick && it.tick(dt, t);
      if (it.ves) {
        // nguồn nhiệt: đèn cồn dưới kiềng / dưới bình kẹp trên giá sắt / ống nghiệm hơ trên đèn
        const lit = b => b && b.lit;
        let heat = false;
        if (it.on && it.on.type == 'tripod') heat = items.some(b => b.type == 'burner' && lit(b) && xz(b.g.position, it.on.g.position) < .035);
        else if (it.on && it.on.type == 'stand') heat = items.some(b => b.type == 'burner' && lit(b) && xz(b.g.position, it.g.position) < .035 && it.g.position.y > .07);
        else if (it.overB) heat = lit(it.overB);
        const L = levelOf(it), cap = L > 0 ? 100 : 300;
        if (heat) it.T = Math.min(cap, it.T + dt * it.ves.heat * (L > 0 ? 1 / Math.max(.4, L) : 3)); else it.T += (25 - it.T) * dt * .02;
        if (it.thermo) it.thermo.api.set(it.T);
        if (it.items.length && it.age < 60) { const sp = it.rodIn ? 2 : 1; const a0 = it.age; it.age += dt * sp; if ((it.age * 8 | 0) != (a0 * 8 | 0)) drawV(it); }
        else if (it.items.length && ((t * 4 | 0) != ((t - dt) * 4 | 0))) drawV(it);
        if (it.cur && it.tg) { const k = 1 - Math.exp(-dt / 1.6); const before = it.cur.c.getHex(); it.cur.c.lerp(it.tg.c, k); it.cur.op += (it.tg.op - it.cur.op) * k; if (before != it.cur.c.getHex()) applyV(it); }
        if (it.rodIn) { const r = it.rodIn, a = t * 4; r.g.position.set(it.g.position.x + Math.cos(a) * it.ves.R * .4, it.g.position.y + .004, it.g.position.z + Math.sin(a) * it.ves.R * .4); r.g.rotation.set(Math.sin(a) * .15, 0, Math.cos(a) * .15); }
        if (it.thermo) { const r = it.thermo; r.g.position.set(it.g.position.x + it.ves.R * .45, it.g.position.y + .004, it.g.position.z); r.g.rotation.set(0, 0, -.08); }
        if (it.on && it.on.type == 'stand') { const c = it.on.clampPt(); it.g.position.set(c.x, c.y - it.ves.H * .78, c.z); }
        if (it.look) { it.lk = Math.min(1, (it.lk || 0) + dt / .8); } else if (it.lk > 0) it.lk = 0;
        if (it.shake > 0) { it.shake -= dt; it.g.rotation.z = Math.sin(it.shake * 30) * .12 * Math.min(1, it.shake * 2); if (it.shake <= 0) it.g.rotation.z = it.overB ? -.35 : 0; }
      }
      if (it.type == 'thermo' && !it.inV) it.api.set(it.api.T + (25 - it.api.T) * dt * .2);
      if (it.type == 'candle' && it.api.lit) { const cv = it.coveredBy(); if (cv) { it.coveredT = (it.coveredT || 0) + dt; const k = clamp(1 - it.coveredT / 9, 0, 1); it.api.flame.scale.setScalar(.3 + .7 * k); if (k <= 0) { it.api.setLit(false); toast('Ngọn nến tắt dần rồi tắt hẳn: khí oxygen trong cốc đã hết – sự cháy cần oxygen.', 4000); } } }
      if (it.type == 'balance') { let m = 0; it.loads.forEach(o => { m += (o.mass || 0) + (o.ves ? levelOf(o) * o.ves.cap : 0); }); it.api.set(Math.round(m * 10) / 10); }
      if (it.type == 'compass') { const poles = []; items.filter(o => o.type == 'magnet').forEach(o => { const ax = V3(1, 0, 0).applyQuaternion(o.g.quaternion); poles.push({ p: o.g.position.clone().addScaledVector(ax, .05), q: 1 }, { p: o.g.position.clone().addScaledVector(ax, -.05), q: -1 }); }); const B = field(poles, it.g.position.clone().setY(.03)).multiplyScalar(4).add(earth); it.api.step(dt, B.x, B.z); }
    }
    // mạch điện
    const S = items.find(o => o.type == 'supply'), L = items.find(o => o.type == 'bulb');
    if (L) { const K = items.find(o => o.type == 'knife'), A = items.find(o => o.type == 'ammeter'); const I = S && S.api.on && (!K || K.api.closed) ? S.api.V / L.api.R : 0; L.api.set(I * I * L.api.R); A && A.api.set(I); }
    // mũi chọn + cầm lên quan sát
    if (sel && !sel.hidden) { const p = sel.g.position, h = sel.ves ? sel.ves.H : .06; selMark.visible = !anim; selMark.position.set(p.x, p.y + h + .035 + Math.sin(t * 5) * .003, p.z); } else selMark.visible = false;
    for (const it of items) if (it.ves && it.look != null) { if (it.look) { if (!it.lookFrom) it.lookFrom = it.g.position.clone(); const f = e2(Math.min(1, it.lk || 0)); it.g.position.lerpVectors(it.lookFrom, V3(it.lookFrom.x, .1, .22), f); it.clampM.visible = true; } else if (it.lookFrom) { it.g.position.copy(it.lookFrom); it.lookFrom = null; it.clampM.visible = !!it.overB; it.look = null; } }
  });

  // ---------- bảng điều khiển vật đang chọn ----------
  function renderPanel() {
    if (!panel) return; const it = sel;
    if (!it || it.hidden) { panel.innerHTML = '<p>Bấm vào một dụng cụ trên bàn để chọn. <b>Kéo</b> để di chuyển; <b>bấm</b> để thao tác.</p>'; return; }
    let h = `<h3>${it.name}</h3>`;
    if (it.ves) { const s = it.s || {}; h += `<p>Nhiệt độ: <b>${Math.round(it.T)} °C</b> · Chứa: ${it.items.length ? it.items.map(x => findChem(x.id)?.n || x.id).join(', ') : '<i>trống</i>'}</p>${it.items.length ? `<div class="note">${(s.notes || []).join('<br>')}${s.eq && s.eq.length ? `<div class="eq">${s.eq.join('<br>')}</div>` : ''}</div>` : '<p class="sm">Mở <b>Tủ hoá chất</b>, lấy hoá chất ra bàn rồi bấm vào lọ/đĩa để cho vào.</p>'}
      <div class="row"><button class="btn" data-a="look">${it.look ? '✋ Đặt xuống' : '🔍 Cầm lên quan sát'}</button><button class="btn g" data-a="shake">〰 Lắc nhẹ</button><button class="btn g" data-a="empty">🚿 Đổ bỏ & rửa</button></div>`; }
    if (it.type == 'burner') h += `<p>Đèn cồn ${it.state()}.</p><p class="sm">Châm lửa bằng diêm, <b>không</b> châm từ đèn cồn khác; tắt đèn bằng cách <b>đậy nắp</b>, không thổi.</p>`;
    if (it.type == 'candle') h += `<p>Bấm vào nến để thắp/tắt. Kéo một cốc thuỷ tinh thả lên nến để <b>úp cốc</b> lên ngọn nến.</p>`;
    if (it.type == 'tripod') h += `<p>Kéo cốc / bình thả lên kiềng; kéo đèn cồn đặt vào giữa ba chân kiềng rồi châm lửa để đun.</p>`;
    if (it.type == 'stand') h += `<p>Kéo ống nghiệm / bình cầu thả gần kẹp để kẹp lên giá; đặt đèn cồn ngay dưới để đun.</p>`;
    if (it.type == 'rack') h += `<p>Kéo ống nghiệm thả vào lỗ trên giá.</p>`;
    if (it.type == 'thermo') h += `<p>Nhiệt kế chỉ: <b>${Math.round(it.api.T)} °C</b>. Kéo thả vào cốc / ống nghiệm để đo.</p>`;
    if (it.type == 'balance') h += `<p>Kéo dụng cụ thả lên mặt cân để cân.</p>`;
    if (it.circuit) h += `<p class="sm">Khi trên bàn có <b>nguồn điện</b> và <b>bóng đèn</b>, dây nối được nối tự động nối tiếp qua công tắc K và ampe kế (nếu có). Bấm nút đỏ của nguồn để bật/tắt; bấm công tắc để đóng/mở mạch.</p>`;
    if (it.type == 'magnet') h += `<p>Bấm vào nam châm để xoay 45°. Đặt la bàn lại gần để thấy kim nam châm định hướng theo từ trường.</p>`;
    if (it.type == 'scope') h += `<p>Kéo <b>tiêu bản</b> thả lên kính hiển vi. Bấm vào đèn, đĩa vật kính, ốc to/nhỏ trên kính, hoặc dùng các nút dưới đây.</p><div class="sbx-scope tb" style="position:static;flex-wrap:wrap"></div>${it.slideItem ? '<div class="row"><button class="btn g" data-a="unslide">Lấy tiêu bản ra</button></div>' : ''}`;
    if (it.type == 'lens') h += `<p>Đặt kính lúp cạnh vật cần xem rồi bấm vào kính lúp.</p>`;
    h += `<div class="row"><button class="btn g" data-a="store">↩ Cất vào kho</button></div>`;
    panel.innerHTML = h;
    const A = a => panel.querySelector(`[data-a="${a}"]`);
    A('look') && (A('look').onclick = () => { if (it.overB || it.on) detach(it); it.look = it.look ? 0 : 1; it.lk = 0; if (it.look) { const p = it.g.position; lab.view([p.x + .02, .18, .5], [p.x, .13, .22], 1); } renderPanel(); });
    A('shake') && (A('shake').onclick = () => { it.shake = 1; it.age += 3; sfx('swish'); });
    A('empty') && (A('empty').onclick = () => { it.items = []; it.age = 0; it.cur = null; drawV(it); sfx('splash'); renderPanel(); });
    A('store') && (A('store').onclick = () => { if (it.type == 'scope' && it.slideItem) { remove(it.slideItem); } remove(it); });
    A('unslide') && (A('unslide').onclick = () => { it.api.slide(false); const s = it.slideItem; it.slideItem = null; items.splice(items.indexOf(s), 1); scene.remove(s.g); makeSlide(s.sample); renderPanel(); });
    if (it.type == 'scope') panel.querySelector('.sbx-scope').replaceWith(it.host);
  }
  setInterval(() => { if (sel && sel.ves && panel && !panel.contains(document.activeElement)) { const t = panel.querySelector('p b'); if (t) t.textContent = Math.round(sel.T) + ' °C'; } }, 500);

  const api = {
    items, get sel() { return sel; }, select,
    take(id) { const p = null; if (id.startsWith('slide:')) return makeSlide(id.slice(6), p); const f = MAKE[id]; if (!f) return; const it = f(p); if (it.circuit) rebuildCircuit(); select(it); return it; },
    takeChem: id => makeContainer(id), remove, transfer, drop,
    clear() { [...items].forEach(remove); },
    pump: s => lab.pump(s),
  };
  renderPanel();
  return api;
}
