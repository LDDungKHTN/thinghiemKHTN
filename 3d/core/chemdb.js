// Tủ hoá chất dùng chung + bộ quy tắc phản ứng tổng quát (KHTN 8–9)
// Mỗi chất: id, n (tên), f (công thức), g: 'vc' (vô cơ) | 'hc' (hữu cơ), st: 'r' | 'l' | 'k' (rắn/lỏng/khí),
// c: màu, k: 'liq' | 'drop' | 'sol' | 'gas' (cách cho vào ống), solid {kind,c,metal}, và các thuộc tính hoá học.
import { THREE, clamp } from './lab3d.js';

const S = (kind, c, metal) => ({ kind, c, metal: !!metal });
export const CAT = [
  // ===== VÔ CƠ – RẮN =====
  { id: 'na', n: 'Natri', f: 'Na', g: 'vc', st: 'r', c: 0xd6d9dc, k: 'sol', solid: S('chunk', 0xd6d9dc, 1), metal: 'Na', max: 1 },
  { id: 'mg', n: 'Magnesium (băng)', f: 'Mg', g: 'vc', st: 'r', c: 0xcfd2d6, k: 'sol', solid: S('strip', 0xcfd2d6, 1), metal: 'Mg', max: 1 },
  { id: 'al', n: 'Nhôm (lá)', f: 'Al', g: 'vc', st: 'r', c: 0xd8dce0, k: 'sol', solid: S('sheet', 0xd8dce0, 1), metal: 'Al', max: 1 },
  { id: 'albot', n: 'Bột nhôm', f: 'Al', g: 'vc', st: 'r', c: 0xc8ccd0, k: 'sol', solid: S('powder', 0xc8ccd0, 1), metal: 'Al' },
  { id: 'zn', n: 'Kẽm viên', f: 'Zn', g: 'vc', st: 'r', c: 0xb8bcc4, k: 'sol', solid: S('chunk', 0xb8bcc4, 1), metal: 'Zn' },
  { id: 'fe', n: 'Đinh sắt', f: 'Fe', g: 'vc', st: 'r', c: 0x8f969c, k: 'sol', solid: S('nail', 0x8f969c, 1), metal: 'Fe', max: 1 },
  { id: 'febot', n: 'Bột sắt', f: 'Fe', g: 'vc', st: 'r', c: 0x55595e, k: 'sol', solid: S('powder', 0x55595e), metal: 'Fe' },
  { id: 'cu', n: 'Dây đồng', f: 'Cu', g: 'vc', st: 'r', c: 0xc06a3a, k: 'sol', solid: S('wire', 0xc06a3a, 1), metal: 'Cu', max: 1 },
  { id: 's', n: 'Bột lưu huỳnh', f: 'S', g: 'vc', st: 'r', c: 0xe8cf2c, k: 'sol', solid: S('powder', 0xe8cf2c) },
  { id: 'p', n: 'Phosphorus đỏ', f: 'P', g: 'vc', st: 'r', c: 0xa0281e, k: 'sol', solid: S('powder', 0xa0281e), insol: 1 },
  { id: 'fewire', n: 'Dây sắt (xoắn)', f: 'Fe', g: 'vc', st: 'r', c: 0x8f969c, k: 'sol', solid: S('wire', 0x8f969c, 1), metal: 'Fe', max: 1 },
  { id: 'c', n: 'Than gỗ', f: 'C', g: 'vc', st: 'r', c: 0x1b1b1b, k: 'sol', solid: S('chunk', 0x1b1b1b) },
  { id: 'cuo', n: 'Bột CuO', f: 'CuO', g: 'vc', st: 'r', c: 0x1c1c1c, k: 'sol', solid: S('powder', 0x1c1c1c), oxide: 'Cu' },
  { id: 'fe2o3', n: 'Bột Fe₂O₃', f: 'Fe₂O₃', g: 'vc', st: 'r', c: 0x8b2f1a, k: 'sol', solid: S('powder', 0x8b2f1a), oxide: 'Fe3' },
  { id: 'cao', n: 'Vôi sống', f: 'CaO', g: 'vc', st: 'r', c: 0xf0ede4, k: 'sol', solid: S('chunk', 0xf0ede4), cao: 1 },
  { id: 'mno2', n: 'Bột MnO₂', f: 'MnO₂', g: 'vc', st: 'r', c: 0x2a2420, k: 'sol', solid: S('powder', 0x2a2420), cat: 1 },
  { id: 'caco3', n: 'Đá vôi', f: 'CaCO₃', g: 'vc', st: 'r', c: 0xe9e4d8, k: 'sol', solid: S('chunk', 0xe9e4d8), co3: 'Ca', insol: 1 },
  { id: 'na2co3s', n: 'Soda (bột)', f: 'Na₂CO₃', g: 'vc', st: 'r', c: 0xf6f6f2, k: 'sol', solid: S('powder', 0xf6f6f2), co3: 'Na', dis: 1 },
  { id: 'nahco3', n: 'Baking soda', f: 'NaHCO₃', g: 'vc', st: 'r', c: 0xf8f8f4, k: 'sol', solid: S('powder', 0xf8f8f4), co3: 'Na', dis: 1 },
  { id: 'nacls', n: 'Muối ăn', f: 'NaCl', g: 'vc', st: 'r', c: 0xf4f6f8, k: 'sol', solid: S('powder', 0xf4f6f8), dis: 1, ion: ['Na', 'Cl'] },
  { id: 'cuso4s', n: 'CuSO₄·5H₂O', f: 'CuSO₄·5H₂O', g: 'vc', st: 'r', c: 0x2f8fe0, k: 'sol', solid: S('powder', 0x2f8fe0), dis: 1, ion: ['Cu', 'SO4'], tint: 0x1f74d6 },
  { id: 'kmno4s', n: 'KMnO₄ (tinh thể)', f: 'KMnO₄', g: 'vc', st: 'r', c: 0x3b1a4a, k: 'sol', solid: S('powder', 0x3b1a4a), dis: 1, tint: 0x8e2a9e, mno4: 1 },
  { id: 'q', n: 'Giấy quỳ tím', f: 'quỳ', g: 'vc', st: 'r', c: 0x8e5bd6, k: 'sol', solid: S('strip', 0x8e5bd6), paper: 1, ind: 'qt', max: 1 },
  // ===== VÔ CƠ – LỎNG =====
  { id: 'h2o', n: 'Nước cất', f: 'H₂O', g: 'vc', st: 'l', c: 0xdff1fa, k: 'liq', water: 1 },
  { id: 'hcl', n: 'dd HCl', f: 'HCl', g: 'vc', st: 'l', c: 0xeef6f8, k: 'liq', acid: 1, ion: ['H', 'Cl'], an: 'Cl' },
  { id: 'h2so4', n: 'dd H₂SO₄ loãng', f: 'H₂SO₄', g: 'vc', st: 'l', c: 0xf2f6f8, k: 'liq', acid: 1, ion: ['H', 'SO4'], an: 'SO4' },
  { id: 'h2so4d', n: 'H₂SO₄ đặc', f: 'H₂SO₄', g: 'vc', st: 'l', c: 0xf6f6f0, k: 'drop', acid: .5, ion: ['H', 'SO4'], an: 'SO4', conc: 1 },
  { id: 'naoh', n: 'dd NaOH', f: 'NaOH', g: 'vc', st: 'l', c: 0xf2f6f8, k: 'liq', base: 1, ion: ['Na', 'OH'] },
  { id: 'koh', n: 'dd KOH', f: 'KOH', g: 'vc', st: 'l', c: 0xf2f6f8, k: 'liq', base: 1, ion: ['K', 'OH'] },
  { id: 'caoh2', n: 'Nước vôi trong', f: 'Ca(OH)₂', g: 'vc', st: 'l', c: 0xf4f8fa, k: 'liq', base: .6, ion: ['Ca', 'OH'] },
  { id: 'nh3', n: 'dd NH₃', f: 'NH₃', g: 'vc', st: 'l', c: 0xf2f6f8, k: 'drop', base: .5, ion: ['NH4', 'OH'] },
  { id: 'cuso4', n: 'dd CuSO₄', f: 'CuSO₄', g: 'vc', st: 'l', c: 0x1f74d6, k: 'liq', ion: ['Cu', 'SO4'], tag: '#e3f1ff' },
  { id: 'cucl2', n: 'dd CuCl₂', f: 'CuCl₂', g: 'vc', st: 'l', c: 0x3fa58a, k: 'liq', ion: ['Cu', 'Cl'] },
  { id: 'fecl3', n: 'dd FeCl₃', f: 'FeCl₃', g: 'vc', st: 'l', c: 0xc8892a, k: 'liq', ion: ['Fe3', 'Cl'], tag: '#fff1d6' },
  { id: 'feso4', n: 'dd FeSO₄', f: 'FeSO₄', g: 'vc', st: 'l', c: 0xa8d8a0, k: 'liq', ion: ['Fe2', 'SO4'] },
  { id: 'agno3', n: 'dd AgNO₃', f: 'AgNO₃', g: 'vc', st: 'l', c: 0xf4f4f4, k: 'liq', ion: ['Ag', 'NO3'], tag: '#f1e8ff' },
  { id: 'bacl2', n: 'dd BaCl₂', f: 'BaCl₂', g: 'vc', st: 'l', c: 0xf3f8fa, k: 'liq', ion: ['Ba', 'Cl'] },
  { id: 'na2so4', n: 'dd Na₂SO₄', f: 'Na₂SO₄', g: 'vc', st: 'l', c: 0xf3f8fa, k: 'liq', ion: ['Na', 'SO4'] },
  { id: 'na2co3', n: 'dd Na₂CO₃', f: 'Na₂CO₃', g: 'vc', st: 'l', c: 0xf3f8fa, k: 'liq', ion: ['Na', 'CO3'], co3: 'Na', base: .3 },
  { id: 'nacl', n: 'dd NaCl', f: 'NaCl', g: 'vc', st: 'l', c: 0xeef4f6, k: 'liq', ion: ['Na', 'Cl'] },
  { id: 'mgcl2', n: 'dd MgCl₂', f: 'MgCl₂', g: 'vc', st: 'l', c: 0xf2f6f8, k: 'liq', ion: ['Mg', 'Cl'] },
  { id: 'kmno4', n: 'dd KMnO₄', f: 'KMnO₄', g: 'vc', st: 'l', c: 0x8e2a9e, k: 'drop', mno4: 1, tag: '#f6e8ff' },
  { id: 'br2', n: 'Nước bromine', f: 'Br₂', g: 'vc', st: 'l', c: 0xf0a020, k: 'liq', br2: 1, tag: '#fff0dc' },
  { id: 'i2', n: 'Dd iodine', f: 'I₂', g: 'vc', st: 'l', c: 0xb5651d, k: 'drop', i2: 1, tag: '#fff0dc' },
  { id: 'h2o2', n: 'H₂O₂ 3%', f: 'H₂O₂', g: 'vc', st: 'l', c: 0xf4f9fb, k: 'liq', h2o2: 1 },
  { id: 'php', n: 'Phenolphthalein', f: 'P.P', g: 'vc', st: 'l', c: 0xf8f8f8, k: 'drop', ind: 'php' },
  { id: 'qt', n: 'Quỳ tím (dd)', f: 'quỳ', g: 'vc', st: 'l', c: 0x7c4dff, k: 'drop', ind: 'qt' },
  // ===== VÔ CƠ – KHÍ =====
  { id: 'o2', n: 'Khí oxygen', f: 'O₂', g: 'vc', st: 'k', c: 0xf4fbff, k: 'gas' },
  { id: 'h2', n: 'Khí hydrogen', f: 'H₂', g: 'vc', st: 'k', c: 0xf4fbff, k: 'gas' },
  { id: 'cl2', n: 'Khí chlorine', f: 'Cl₂', g: 'vc', st: 'k', c: 0xb8d84a, k: 'gas', cl2: 1 },
  { id: 'co2', n: 'Khí carbon dioxide', f: 'CO₂', g: 'vc', st: 'k', c: 0xf4fbff, k: 'gas', acid: .2, co2: 1 },
  { id: 'so2', n: 'Khí sulfur dioxide', f: 'SO₂', g: 'vc', st: 'k', c: 0xf4fbff, k: 'gas', acid: .4, so2: 1 },
  { id: 'nh3k', n: 'Khí ammonia', f: 'NH₃', g: 'vc', st: 'k', c: 0xf4fbff, k: 'gas', base: .5 },
  { id: 'no2', n: 'Khí nitrogen dioxide', f: 'NO₂', g: 'vc', st: 'k', c: 0xa0441a, k: 'gas', acid: .6 },
  // ===== HỮU CƠ – RẮN =====
  { id: 'glus', n: 'Glucose (bột)', f: 'C₆H₁₂O₆', g: 'hc', st: 'r', c: 0xfafaf6, k: 'sol', solid: S('powder', 0xfafaf6), dis: 1, glu: 1 },
  { id: 'sacs', n: 'Đường saccharose', f: 'C₁₂H₂₂O₁₁', g: 'hc', st: 'r', c: 0xfbfbf6, k: 'sol', solid: S('powder', 0xfbfbf6), dis: 1 },
  { id: 'tbs', n: 'Bột tinh bột', f: '(C₆H₁₀O₅)ₙ', g: 'hc', st: 'r', c: 0xf6f3ea, k: 'sol', solid: S('powder', 0xf6f3ea), starch: 1 },
  { id: 'paraffin', n: 'Nến (paraffin)', f: 'CₙH₂ₙ₊₂', g: 'hc', st: 'r', c: 0xf3efe0, k: 'sol', solid: S('chunk', 0xf3efe0), insol: 1 },
  { id: 'pe', n: 'Mảnh nhựa PE', f: '(–CH₂–CH₂–)ₙ', g: 'hc', st: 'r', c: 0xe8f0f6, k: 'sol', solid: S('sheet', 0xe8f0f6), insol: 1 },
  // ===== HỮU CƠ – LỎNG =====
  { id: 'et', n: 'Ethylic alcohol', f: 'C₂H₅OH', g: 'hc', st: 'l', c: 0xf4f9fb, k: 'liq', alc: 1 },
  { id: 'ac', n: 'Acetic acid', f: 'CH₃COOH', g: 'hc', st: 'l', c: 0xf4f9fb, k: 'liq', acid: .5, weak: 1, an: 'CH3COO' },
  { id: 'ester', n: 'Ethyl acetate', f: 'CH₃COOC₂H₅', g: 'hc', st: 'l', c: 0xfff8e0, k: 'liq', oily: 1 },
  { id: 'oil', n: 'Dầu ăn', f: 'chất béo', g: 'hc', st: 'l', c: 0xf0c844, k: 'liq', oily: 1, tag: '#fff6d0' },
  { id: 'xang', n: 'Xăng', f: 'hydrocarbon', g: 'hc', st: 'l', c: 0xf6f1de, k: 'liq', solv: 1 },
  { id: 'glu', n: 'dd Glucose', f: 'C₆H₁₂O₆', g: 'hc', st: 'l', c: 0xf6f8f4, k: 'liq', glu: 1 },
  { id: 'sac', n: 'dd Saccharose', f: 'C₁₂H₂₂O₁₁', g: 'hc', st: 'l', c: 0xf6f8f4, k: 'liq' },
  { id: 'tb', n: 'Hồ tinh bột', f: '(C₆H₁₀O₅)ₙ', g: 'hc', st: 'l', c: 0xf1efe6, k: 'liq', starch: 1 },
  { id: 'egg', n: 'Lòng trắng trứng', f: 'protein', g: 'hc', st: 'l', c: 0xf3edc8, k: 'liq', protein: 1, tag: '#fffbea' },
  { id: 'glyc', n: 'Glycerol', f: 'C₃H₅(OH)₃', g: 'hc', st: 'l', c: 0xf6f8f8, k: 'liq' },
  { id: 'soap', n: 'Nước xà phòng', f: 'RCOONa', g: 'hc', st: 'l', c: 0xeef2ee, k: 'liq', base: .15, soap: 1 },
  // ===== HỮU CƠ – KHÍ =====
  { id: 'ch4', n: 'Khí methane', f: 'CH₄', g: 'hc', st: 'k', c: 0xf4fbff, k: 'gas' },
  { id: 'c2h4', n: 'Khí ethylene', f: 'C₂H₄', g: 'hc', st: 'k', c: 0xf4fbff, k: 'gas', unsat: 1 },
  { id: 'c2h2', n: 'Khí acetylene', f: 'C₂H₂', g: 'hc', st: 'k', c: 0xf4fbff, k: 'gas', unsat: 1 },
];
export const CATI = Object.fromEntries(CAT.map(c => [c.id, c]));
// mã hoá chất ở các bài cũ → mã trong tủ
const ALIAS = { h1: 'hcl', h01: 'hcl', cav: 'caco3', cab: 'caco3', vt: 'caoh2', ach: 'ac', pp: 'php', ag: 'agno3', w: 'h2o', su: 'sacs', sa: 'nacls', ca: 'caco3', i2: 'i2', mix: 'febot' };
export const findChem = id => CATI[id] || CATI[ALIAS[id]] || null;

// dãy hoạt động hoá học (càng nhỏ càng mạnh)
const ACT = { K: 0, Na: 1, Ca: 2, Mg: 3, Al: 4, Zn: 5, Fe: 6, Pb: 7, H: 8, Cu: 9, Ag: 10, Au: 11 };
const VAL = { Na: 1, K: 1, Ag: 1, Mg: 2, Ca: 2, Zn: 2, Fe: 2, Cu: 2, Ba: 2, Al: 3, Fe3: 3, Fe2: 2 };
const SALTC = { Fe: 0xa8d8a0, Cu: 0x4f9be6 };   // màu dung dịch muối của kim loại (Fe²⁺ lục nhạt, Cu²⁺ xanh lam)
const OHP = { Cu: [0x2f7fd0, 'kết tủa xanh lam Cu(OH)₂'], Fe3: [0x8b3a12, 'kết tủa nâu đỏ Fe(OH)₃'], Fe2: [0xb8c8a8, 'kết tủa trắng xanh Fe(OH)₂'], Mg: [0xffffff, 'kết tủa trắng Mg(OH)₂'], Zn: [0xffffff, 'kết tủa trắng Zn(OH)₂'], Al: [0xf4f6f8, 'kết tủa keo trắng Al(OH)₃'], Ag: [0x5a4a3a, 'kết tủa nâu đen Ag₂O'] };
const OHEQ = { Cu: 'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄', Fe3: 'FeCl₃ + 3NaOH → Fe(OH)₃↓ + 3NaCl', Fe2: 'FeSO₄ + 2NaOH → Fe(OH)₂↓ + Na₂SO₄', Mg: 'MgCl₂ + 2NaOH → Mg(OH)₂↓ + 2NaCl', Zn: 'ZnSO₄ + 2NaOH → Zn(OH)₂↓ + Na₂SO₄', Al: 'AlCl₃ + 3NaOH → Al(OH)₃↓ + 3NaCl', Ag: '2AgNO₃ + 2NaOH → Ag₂O↓ + 2NaNO₃ + H₂O' };
const mixc = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), clamp(t, 0, 1)).getHex();

/** Phản ứng tổng quát: items [{id, amt}] → trạng thái ống nghiệm (giống react của từng bài) */
export function genericReact(items, heat, age) {
  const s = { notes: [], eq: [] }; if (!items.length) return s;
  const X = items.map(it => ({ ...it, c: findChem(it.id) })).filter(x => x.c);
  const has = p => X.filter(x => p(x.c));
  const liq = X.filter(x => x.c.k == 'liq' || x.c.k == 'drop'), gas = X.filter(x => x.c.k == 'gas'), sol = X.filter(x => x.c.k == 'sol');
  const V = liq.reduce((a, x) => a + x.amt, 0), wet = V > 0;
  const K = clamp(age / 6, 0, 1);       // tiến trình phản ứng (đổi dần)
  // màu nền: trộn màu các dung dịch theo thể tích (dung dịch có màu chiếm ưu thế)
  let col = new THREE.Color(0xeef6f8), op = .3;
  if (wet) { let w = 0; const acc = new THREE.Color(0, 0, 0); liq.forEach(x => { const strong = x.c.c != null && new THREE.Color(x.c.c).getHSL({}).s > .25 ? 3 : 1, ww = x.amt * strong; acc.r += new THREE.Color(x.c.c).r * ww; acc.g += new THREE.Color(x.c.c).g * ww; acc.b += new THREE.Color(x.c.c).b * ww; w += ww; }); col.setRGB(acc.r / w, acc.g / w, acc.b / w); const sat = col.getHSL({}).s; op = .3 + .4 * sat; }
  // chất rắn tan → nhuộm màu dung dịch
  sol.filter(x => x.c.dis && x.c.tint && wet).forEach(x => { col = new THREE.Color(mixc(col.getHex(), x.c.tint, .9 * K)); op = Math.max(op, .3 + .4 * K); });
  s.color = col.getHex(); s.op = op;
  // ion có trong dung dịch
  const ions = new Set(); X.forEach(x => { if (x.c.ion && (x.c.k != 'sol' || (x.c.dis && wet))) x.c.ion.forEach(i => ions.add(i)); });
  let acid = has(c => c.acid).reduce((a, x) => a + x.amt * x.c.acid, 0), base = has(c => c.base).reduce((a, x) => a + x.amt * x.c.base, 0);
  // chất rắn hiển thị (ưu tiên kim loại / mẫu lớn)
  const main = sol.find(x => x.c.solid && x.c.solid.kind != 'powder' && !x.c.paper) || sol.find(x => x.c.solid && !x.c.paper);
  if (main && !(main.c.dis && wet)) s.solid = { ...main.c.solid, amt: Math.min(1, main.amt) };
  else if (main && main.c.dis && wet) { const left = 1 - K; if (left > .05) s.solid = { ...main.c.solid, amt: left * .8 }; if (left < .1) s.notes.push(`${main.c.n} <b>tan hết</b> trong nước.`); else s.notes.push(`${main.c.n} đang tan dần…`); }
  const paper = sol.find(x => x.c.paper);
  // Natri + nước / rượu
  const Na = sol.find(x => x.c.metal == 'Na');
  if (Na && wet) { const left = 1 - clamp(age / 5, 0, 1); s.solid = { ...Na.c.solid, amt: left }; s.bubbles = .9 * left + .05; s.gas = { c: 0xffffff, amt: .3 * left }; base += 2; ions.add('Na'); ions.add('OH');
    s.notes.push('Natri phản ứng <b>mãnh liệt</b>, nóng chảy thành giọt tròn chạy trên mặt nước, có khí H₂ thoát ra.'); s.eq.push('2Na + 2H₂O → 2NaOH + H₂↑'); }
  // Vôi sống + nước
  if (sol.find(x => x.c.cao) && wet) { base += 1; ions.add('Ca'); ions.add('OH'); s.cloud = .4 * (1 - K * .5); s.cloudC = 0xffffff; s.notes.push('Vôi sống tan, phản ứng <b>toả nhiều nhiệt</b>, tạo nước vôi (Ca(OH)₂).'); s.eq.push('CaO + H₂O → Ca(OH)₂'); }
  // khí sục vào dung dịch
  gas.forEach(g => { if (!wet) return; s.bubbles = Math.max(s.bubbles || 0, .5 * (1 - clamp(age / 4, 0, 1)));
    if (g.c.co2 && ions.has('Ca') && ions.has('OH')) { s.cloud = .8 * K; s.cloudC = 0xffffff; s.op = .5; s.notes.push('Sục khí CO₂: nước vôi trong bị <b>vẩn đục</b> (CaCO₃ kết tủa trắng).'); s.eq.push('CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O'); }
    if (g.c.cl2) { s.color = mixc(s.color, 0xd6e88a, K * .8); s.op = Math.max(s.op, .4); s.notes.push('Khí chlorine tan một phần trong nước tạo <b>nước chlorine màu vàng nhạt</b>.'); s.eq.push('Cl₂ + H₂O ⇌ HCl + HClO'); acid += .5; }
    if (g.c.so2) s.eq.push('SO₂ + H₂O ⇌ H₂SO₃');
    if (g.c.id == 'no2') { s.gas = { c: 0xa0441a, amt: .4 * (1 - K) }; s.notes.push('Khí NO₂ màu <b>nâu đỏ</b> tan trong nước tạo dung dịch acid.'); }
    if ((g.c.unsat || g.c.so2) && has(c => c.br2).length) { s.color = mixc(s.color, 0xf2f2ee, K); s.op = .3; s.notes.push(`Dẫn ${g.c.n.toLowerCase()} qua nước bromine: màu vàng cam <b>nhạt dần rồi mất màu</b>.`); s.eq.push(g.c.so2 ? 'SO₂ + Br₂ + 2H₂O → H₂SO₄ + 2HBr' : g.c.id == 'c2h4' ? 'C₂H₄ + Br₂ → C₂H₄Br₂' : 'C₂H₂ + 2Br₂ → C₂H₂Br₄'); }
    if ((g.c.unsat || g.c.so2) && has(c => c.mno4).length) { s.color = mixc(s.color, 0xf2f2ee, K); s.op = .3; s.notes.push(`Dẫn ${g.c.n.toLowerCase()} qua dd KMnO₄: màu tím <b>nhạt dần rồi mất màu</b>.`); }
    if (g.c.id == 'ch4' && has(c => c.br2).length) s.notes.push('Methane <b>không làm mất màu</b> nước bromine (ở điều kiện thường).');
  });
  // kim loại + acid → khí H₂
  const metals = sol.filter(x => x.c.metal && x.c.metal != 'Na');
  if (acid > 0 && wet) metals.forEach(m => { const M = m.c.metal; if (ACT[M] < ACT.H) { const weak = has(c => c.weak).length && !has(c => c.acid && !c.weak && c.k != 'gas').length; s.bubbles = Math.max(s.bubbles || 0, ({ Mg: 1, Al: .6, Zn: .55, Fe: .4 }[M] || .4) * (weak ? .4 : 1) * (heat ? 1.4 : 1));
      if (M == 'Fe') { s.color = mixc(s.color, SALTC.Fe, clamp(age / 15, 0, 1)); s.op = Math.max(s.op, .3 + .2 * clamp(age / 15, 0, 1)); }
      if (M == 'Mg' || M == 'Al') s.solid && (s.solid.amt = Math.max(.1, 1 - age / 20));
      s.notes.push(`Có <b>bọt khí không màu</b> (H₂) thoát ra trên bề mặt ${m.c.n.toLowerCase()}${M == 'Fe' ? '; dung dịch chuyển dần <b>lục nhạt</b>' : ''}.`);
      const an = ions.has('SO4') ? 'SO4' : weak ? 'CH3COO' : 'Cl';
      s.eq.push(M == 'Al' ? (an == 'SO4' ? '2Al + 3H₂SO₄ → Al₂(SO₄)₃ + 3H₂↑' : an == 'Cl' ? '2Al + 6HCl → 2AlCl₃ + 3H₂↑' : '2Al + 6CH₃COOH → 2(CH₃COO)₃Al + 3H₂↑')
        : an == 'SO4' ? `${M} + H₂SO₄ → ${M}SO₄ + H₂↑` : an == 'Cl' ? `${M} + 2HCl → ${M}Cl₂ + H₂↑` : `${M} + 2CH₃COOH → (CH₃COO)₂${M} + H₂↑`); }
    else s.notes.push(`${m.c.n} <b>không tác dụng</b> với dung dịch acid (đứng sau H trong dãy hoạt động).`); });
  // carbonate + acid → CO₂
  if (acid > 0 && wet) X.filter(x => x.c.co3).forEach(x => { const left = 1 - clamp(age / 20, 0, 1); s.bubbles = Math.max(s.bubbles || 0, .7 * left + .05); if (x.c.k == 'sol') s.solid = { ...x.c.solid, amt: .2 + .8 * left }; s.notes.push(`${x.c.n} <b>sủi bọt khí</b> CO₂.`); s.eq.push(x.c.id == 'nahco3' ? 'NaHCO₃ + HCl → NaCl + CO₂↑ + H₂O' : x.c.co3 == 'Ca' ? 'CaCO₃ + 2HCl → CaCl₂ + CO₂↑ + H₂O' : 'Na₂CO₃ + 2HCl → 2NaCl + CO₂↑ + H₂O'); acid = Math.max(0, acid - .5); });
  // oxide base + acid
  if (acid > 0 && wet) sol.filter(x => x.c.oxide).forEach(x => { const k = clamp(age / (heat ? 8 : 30), 0, 1); s.solid = { ...x.c.solid, amt: 1 - .85 * k }; const cc = x.c.oxide == 'Cu' ? 0x3fa58a : 0xc8892a; s.color = mixc(s.color, cc, k); s.op = .3 + .35 * k; s.notes.push(`${x.c.n} tan dần${heat ? '' : ' (nên đun nhẹ)'}, dung dịch chuyển sang <b>${x.c.oxide == 'Cu' ? 'màu xanh' : 'màu vàng nâu'}</b>.`); s.eq.push(x.c.oxide == 'Cu' ? 'CuO + 2HCl → CuCl₂ + H₂O' : 'Fe₂O₃ + 6HCl → 2FeCl₃ + 3H₂O'); if (x.c.oxide == 'Cu') ions.add('Cu'); else ions.add('Fe3'); });
  // trung hoà
  if (acid > 0 && base > 0 && has(c => c.acid && c.k != 'gas').length && has(c => c.base && c.k != 'gas' && !c.co3).length) s.eq.push('Acid + Base → Muối + Nước (phản ứng trung hoà)');
  const ex = base - acid;
  // kết tủa hydroxide
  if (ex > 0) for (const M in OHP) if (ions.has(M) && !(M == 'Ag' && ions.has('NH4') && base > 1.5)) { const k = clamp(age / 5, 0, 1), st = clamp((age - 5) / 25, 0, .7); let pc = OHP[M][0]; if (M == 'Fe2') pc = mixc(pc, 0x8b3a12, clamp((age - 8) / 30, 0, .8)); s.ppt = { c: pc, amt: .9 * k, settle: st }; s.cloud = .8 * k * (1 - st); s.cloudC = pc; if (M == 'Cu') s.color = mixc(s.color, 0xeaf3fa, k * .8); s.notes.push(`Xuất hiện <b>${OHP[M][1]}</b>${M == 'Fe2' ? ', để lâu hoá nâu đỏ' : ''}.`); s.eq.push(M == 'Cu' && !ions.has('SO4') ? 'CuCl₂ + 2NaOH → Cu(OH)₂↓ + 2NaCl' : OHEQ[M]); break; }
  // kết tủa muối
  const ppt2 = (c, txt, eq) => { const k = clamp(age / 3, 0, 1); s.ppt = { c, amt: .9 * k, settle: clamp((age - 4) / 25, 0, .7) }; s.cloud = .6 * k * (1 - clamp((age - 4) / 25, 0, 1)); s.cloudC = c; s.notes.push(txt); s.eq.push(eq); };
  if (ions.has('Ba') && ions.has('SO4')) ppt2(0xffffff, 'Xuất hiện <b>kết tủa trắng</b> BaSO₄.', 'BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl');
  if (ions.has('Ag') && ions.has('Cl')) ppt2(mixc(0xffffff, 0x9a9a9a, clamp((age - 15) / 40, 0, .5)), 'Xuất hiện <b>kết tủa trắng</b> AgCl (để ngoài sáng hoá xám dần).', 'AgNO₃ + NaCl → AgCl↓ + NaNO₃');
  if (ions.has('Ca') && ions.has('CO3')) ppt2(0xffffff, 'Xuất hiện <b>kết tủa trắng</b> CaCO₃.', 'Ca(OH)₂ + Na₂CO₃ → CaCO₃↓ + 2NaOH');
  if (ions.has('Ba') && ions.has('CO3')) ppt2(0xffffff, 'Xuất hiện <b>kết tủa trắng</b> BaCO₃.', 'BaCl₂ + Na₂CO₃ → BaCO₃↓ + 2NaCl');
  // kim loại đẩy kim loại yếu hơn ra khỏi dung dịch muối
  if (wet) metals.forEach(m => { const M = m.c.metal; for (const C of ['Ag', 'Cu']) { const CM = C; if (!ions.has(C) || ACT[M] >= ACT[CM]) continue;
    const g = clamp(age / 15, 0, 1), dep = CM == 'Cu' ? 0xb4532a : CM == 'Ag' ? 0xaeb4ba : 0x55595e;
    if (s.solid) { s.solid.c = mixc(m.c.solid.c, dep, clamp(age / 7, 0, 1)); s.solid.c0 = m.c.solid.c; s.solid.metal = true; }
    const prod = SALTC[M] ?? 0xf2f6f8; s.color = mixc(s.color, prod, g); s.op = .3 + .25 * (prod != 0xf2f6f8 ? 1 : 0) + (C == 'Cu' ? .2 * (1 - g) : 0);
    s.notes.push(`Có lớp <b>${CM == 'Cu' ? 'đồng màu đỏ' : CM == 'Ag' ? 'bạc màu xám' : 'kim loại'}</b> bám trên phần ${m.c.n.toLowerCase()} ngâm trong dung dịch; ${C == 'Cu' ? 'màu xanh lam nhạt dần' : M == 'Cu' ? 'dung dịch chuyển dần <b>xanh lam</b>' : 'dung dịch đổi màu dần'}.`);
    const so4 = ions.has('SO4');
    s.eq.push(C == 'Ag' ? (M == 'Al' ? 'Al + 3AgNO₃ → Al(NO₃)₃ + 3Ag↓' : `${M} + 2AgNO₃ → ${M}(NO₃)₂ + 2Ag↓`)
      : M == 'Al' ? (so4 ? '2Al + 3CuSO₄ → Al₂(SO₄)₃ + 3Cu' : '2Al + 3CuCl₂ → 2AlCl₃ + 3Cu') : so4 ? `${M} + CuSO₄ → ${M}SO₄ + Cu` : `${M} + CuCl₂ → ${M}Cl₂ + Cu`); break; } });
  // H₂O₂ + MnO₂
  if (has(c => c.h2o2).length && sol.find(x => x.c.cat)) { s.bubbles = .9; s.gas = { c: 0xffffff, amt: .15 }; s.notes.push('Có MnO₂: khí oxygen thoát ra <b>rất mạnh</b>.'); s.eq.push('2H₂O₂ → 2H₂O + O₂↑ (xúc tác MnO₂)'); }
  // tinh bột + iodine
  if (X.find(x => x.c.starch) && has(c => c.i2).length && !heat) { s.color = mixc(s.color, 0x1c1660, K); s.op = .9; s.notes.push('Xuất hiện <b>màu xanh tím</b>: tinh bột tác dụng với iodine.'); }
  // protein
  if (has(c => c.protein).length && (acid > .3 || heat)) { s.ppt = { c: 0xffffff, amt: .9 * K, settle: clamp((age - 3) / 20, 0, .6) }; s.notes.push(`Lòng trắng trứng <b>đông tụ</b> (kết tủa trắng) ${heat ? 'khi đun nóng' : 'trong môi trường acid'}.`); }
  // chất lỏng không tan (dầu, ester) nổi thành lớp
  const oily = has(c => c.oily); if (oily.length && wet) { const solvent = has(c => c.solv || c.alc).length; if (!solvent && liq.some(x => !x.c.oily)) { const o = oily.reduce((a, x) => a + x.amt, 0); s.layer = { h: Math.min(.6, o / V * .9), c: oily[0].c.c, op: .7 }; s.color = mixc(0xeef6f8, s.color, .3); s.notes.push(`${oily[0].c.n} <b>không tan</b> trong nước, nổi thành lớp riêng phía trên.`); } else if (solvent) s.notes.push(`${oily[0].c.n} <b>tan</b> trong ${has(c => c.solv).length ? 'xăng' : 'cồn'}.`); }
  // chất rắn không tan
  sol.filter(x => x.c.insol && wet && !(acid > 0 && x.c.co3)).forEach(x => s.notes.push(`${x.c.n} <b>không tan</b> trong nước.`));
  // chất chỉ thị
  if (has(c => c.ind == 'php').length) { const k = clamp(ex / 1, 0, 1); s.color = mixc(s.color, 0xd6246e, k > 0 ? .5 + .5 * k : 0); s.op = Math.max(s.op, .3 + .5 * (k > 0)); s.notes.push(ex > 0 ? 'Phenolphthalein chuyển <b>màu hồng</b> (môi trường base).' : 'Phenolphthalein <b>không màu</b> (môi trường acid/trung tính).'); }
  if (has(c => c.ind == 'qt' && c.k != 'sol').length) { const bl = has(c => c.cl2).length && wet; s.color = bl && age > 6 ? mixc(s.color, 0xf2f2ee, clamp((age - 6) / 8, 0, 1)) : ex < -.05 ? 0xe03131 : ex > .05 ? 0x3b5bdb : 0x7e57c2; s.op = .7; s.notes.push(ex < -.05 ? 'Quỳ tím hoá <b>đỏ</b> (acid).' + (bl ? ' Sau đó <b>mất màu</b> (nước chlorine có tính tẩy màu).' : '') : ex > .05 ? 'Quỳ tím hoá <b>xanh</b> (base).' : 'Quỳ tím giữ màu tím.'); }
  if (paper) { s.solid = { kind: 'strip', c: ex < -.05 && wet ? 0xd6334c : ex > .05 && wet ? 0x2f66d6 : 0x8e5bd6, amt: 1 }; if (wet) s.notes.push(ex < -.05 ? 'Giấy quỳ tím chuyển <b>đỏ</b>.' : ex > .05 ? 'Giấy quỳ tím chuyển <b>xanh</b>.' : 'Giấy quỳ tím không đổi màu.'); }
  if (!s.notes.length) s.notes.push(wet ? 'Chưa quan sát thấy hiện tượng.' : 'Chưa có dung dịch trong ống.');
  s.notes = [...new Set(s.notes)]; s.eq = [...new Set(s.eq)];
  return s;
}
