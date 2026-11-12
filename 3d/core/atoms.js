// Dữ liệu nguyên tố (Z = 1..20) và mô hình phân tử 3D (đặc / que – bóng)
import { THREE } from './lab3d.js';

// [kí hiệu, tên tiếng Việt, số neutron phổ biến, khối lượng nguyên tử (amu), màu CPK, bán kính hiển thị (tương đối)]
export const EL = [null,
  ['H', 'Hydrogen', 0, 1, 0xf5f5f5, .55], ['He', 'Helium', 2, 4, 0x7fe3f5, .6], ['Li', 'Lithium', 4, 7, 0xb57edc, .9], ['Be', 'Beryllium', 5, 9, 0x9ccf3a, .8], ['B', 'Boron', 6, 11, 0xf0b27a, .8],
  ['C', 'Carbon', 6, 12, 0x3a3a3a, .8], ['N', 'Nitrogen', 7, 14, 0x3050f8, .78], ['O', 'Oxygen', 8, 16, 0xe53935, .76], ['F', 'Fluorine', 10, 19, 0x90e050, .72], ['Ne', 'Neon', 10, 20, 0xb3e3f5, .7],
  ['Na', 'Sodium', 12, 23, 0x8e44ad, 1.05], ['Mg', 'Magnesium', 12, 24, 0x2ecc40, 1], ['Al', 'Aluminium', 14, 27, 0xbfa6a6, .98], ['Si', 'Silicon', 14, 28, 0xf0c8a0, .95], ['P', 'Phosphorus', 16, 31, 0xff8000, .92],
  ['S', 'Sulfur', 16, 32, 0xf1c40f, .9], ['Cl', 'Chlorine', 18, 35.5, 0x1fb81f, .9], ['Ar', 'Argon', 22, 40, 0x80d1e3, .88], ['K', 'Potassium', 20, 39, 0x8f40d4, 1.2], ['Ca', 'Calcium', 20, 40, 0x3dff00, 1.1]];
export const BY = Object.fromEntries(EL.filter(Boolean).map((e, i) => [e[0], i + 1]));
EL.Cu = ['Cu', 'Copper (đồng)', 35, 64, 0xc87533, 1];
export const shells = Z => { const s = []; let r = Z; for (const cap of [2, 8, 8, 2]) { if (r <= 0) break; s.push(Math.min(cap, r)); r -= cap; } return s; };
export const elOf = s => s == 'Cu' ? EL.Cu : EL[BY[s]];

// Phân tử: atoms [[kí hiệu, x, y, z]] (Å), bonds [[i, j, bậc]]
const ang = (a, d = 1) => [Math.cos(a) * d, Math.sin(a) * d];
const tet = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]].map(v => v.map(x => x / Math.sqrt(3)));
export const MOL = {
  H2: { n: 'Hydrogen', f: 'H₂', k: 'đơn chất', atoms: [['H', -.37, 0, 0], ['H', .37, 0, 0]], bonds: [[0, 1, 1]] },
  O2: { n: 'Oxygen', f: 'O₂', k: 'đơn chất', atoms: [['O', -.6, 0, 0], ['O', .6, 0, 0]], bonds: [[0, 1, 2]] },
  N2: { n: 'Nitrogen', f: 'N₂', k: 'đơn chất', atoms: [['N', -.55, 0, 0], ['N', .55, 0, 0]], bonds: [[0, 1, 3]] },
  Cl2: { n: 'Chlorine', f: 'Cl₂', k: 'đơn chất', atoms: [['Cl', -1, 0, 0], ['Cl', 1, 0, 0]], bonds: [[0, 1, 1]] },
  O3: { n: 'Ozone', f: 'O₃', k: 'đơn chất', atoms: [['O', 0, .45, 0], ['O', -1.1, -.25, 0], ['O', 1.1, -.25, 0]], bonds: [[0, 1, 2], [0, 2, 1]] },
  He: { n: 'Helium (khí hiếm)', f: 'He', k: 'đơn chất', atoms: [['He', 0, 0, 0]], bonds: [] },
  Cu: { n: 'Đồng (kim loại)', f: 'Cu', k: 'đơn chất', lattice: 'Cu' },
  H2O: { n: 'Nước', f: 'H₂O', k: 'hợp chất', atoms: [['O', 0, 0, 0], ['H', ...ang(-.91, .96), 0], ['H', ...ang(-2.23, .96), 0]], bonds: [[0, 1, 1], [0, 2, 1]] },
  CO2: { n: 'Carbon dioxide', f: 'CO₂', k: 'hợp chất', atoms: [['C', 0, 0, 0], ['O', -1.16, 0, 0], ['O', 1.16, 0, 0]], bonds: [[0, 1, 2], [0, 2, 2]] },
  CH4: { n: 'Methane', f: 'CH₄', k: 'hợp chất', atoms: [['C', 0, 0, 0], ...tet.map(v => ['H', ...v.map(x => x * 1.09)])], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] },
  NH3: { n: 'Ammonia', f: 'NH₃', k: 'hợp chất', atoms: [['N', 0, .38, 0], ...[0, 2.094, 4.189].map(a => ['H', Math.cos(a) * .94, 0, Math.sin(a) * .94])], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] },
  HCl: { n: 'Hydrogen chloride', f: 'HCl', k: 'hợp chất', atoms: [['H', -.64, 0, 0], ['Cl', .64, 0, 0]], bonds: [[0, 1, 1]] },
  NaCl: { n: 'Muối ăn (sodium chloride)', f: 'NaCl', k: 'hợp chất', lattice: 'NaCl' },
  C2H5OH: { n: 'Ethanol (cồn)', f: 'C₂H₅OH', k: 'hợp chất', atoms: [['C', -.75, 0, 0], ['C', .75, 0, 0], ['O', 1.25, 1.2, 0], ['H', 2.2, 1.15, 0], ['H', -1.15, 1, 0], ['H', -1.15, -.5, .9], ['H', -1.15, -.5, -.9], ['H', 1.15, -.5, .9], ['H', 1.15, -.5, -.9]], bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1], [1, 7, 1], [1, 8, 1]] },
};
/** Thành phần nguyên tố và khối lượng phân tử (amu) */
export function formula(m) {
  if (m.lattice == 'Cu') return { comp: { Cu: 1 }, M: 64 };
  if (m.lattice == 'NaCl') return { comp: { Na: 1, Cl: 1 }, M: 58.5 };
  const comp = {}; m.atoms.forEach(a => comp[a[0]] = (comp[a[0]] || 0) + 1);
  return { comp, M: Object.entries(comp).reduce((s, [k, n]) => s + elOf(k)[3] * n, 0) };
}
const mats = {};
export function atomMat(s) { return mats[s] || (mats[s] = new THREE.MeshStandardMaterial({ color: elOf(s)[4], roughness: .35, metalness: s == 'Cu' ? .6 : .05 })); }
const bondM = new THREE.MeshStandardMaterial({ color: 0xbfc4c9, roughness: .4 });
/** Dựng mô hình phân tử; style 'fill' (đặc) hoặc 'stick' (que – bóng); scale: m / Å */
export function buildMol(m, { style = 'stick', scale = .03 } = {}) {
  const g = new THREE.Group();
  if (m.lattice) {
    const n = 3, a = m.lattice == 'Cu' ? 2.55 : 2.82;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
      const s = m.lattice == 'Cu' ? 'Cu' : (i + j + k) % 2 ? 'Na' : 'Cl', r = m.lattice == 'Cu' ? 1.28 : s == 'Na' ? .95 : 1.8;
      const b = new THREE.Mesh(new THREE.SphereGeometry(r * scale * (style == 'fill' ? 1 : .45), 24, 16), atomMat(s)); b.position.set((i - 1) * a * scale, (j - 1) * a * scale, (k - 1) * a * scale); b.castShadow = true; b.userData.el = s; g.add(b);
      if (style != 'fill') for (const [di, dj, dk] of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) if (i + di < n && j + dj < n && k + dk < n) { const p2 = new THREE.Vector3((i + di - 1) * a * scale, (j + dj - 1) * a * scale, (k + dk - 1) * a * scale); g.add(stick(b.position, p2, .12 * scale)); }
    }
    return g;
  }
  const P = m.atoms.map(a => new THREE.Vector3(a[1], a[2], a[3]).multiplyScalar(scale));
  const c = P.reduce((s, p) => s.add(p), new THREE.Vector3()).multiplyScalar(1 / P.length); P.forEach(p => p.sub(c));
  m.atoms.forEach((a, i) => { const r = elOf(a[0])[5] * scale * (style == 'fill' ? 1.75 : .55); const b = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 20), atomMat(a[0])); b.position.copy(P[i]); b.castShadow = true; b.userData.el = a[0]; g.add(b); });
  if (style != 'fill') m.bonds.forEach(([i, j, o]) => { const d = P[j].clone().sub(P[i]), perp = new THREE.Vector3(0, 0, 1).cross(d).normalize(); if (perp.lengthSq() < .1) perp.set(0, 1, 0); for (let k = 0; k < o; k++) { const off = perp.clone().multiplyScalar((k - (o - 1) / 2) * .22 * scale); g.add(stick(P[i].clone().add(off), P[j].clone().add(off), (o > 1 ? .09 : .13) * scale)); } });
  return g;
}
function stick(a, b, r) { const d = b.clone().sub(a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 12), bondM); m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); m.castShadow = true; return m; }
