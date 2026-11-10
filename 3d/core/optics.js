// Hỗ trợ vẽ chùm sáng phát sáng (glow) và tính khúc xạ
import { THREE, canvasTex } from './lab3d.js';

const glowTex = canvasTex(64, 64, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.32, 'rgba(255,255,255,.35)');
  gr.addColorStop(.5, 'rgba(255,255,255,1)'); gr.addColorStop(.68, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}, { srgb: false });
const quad = new THREE.PlaneGeometry(1, 1);

/** Nhóm chùm sáng nằm trong mặt phẳng xy cục bộ của `parent`. */
export class Beams {
  constructor(parent, z = .0015) { this.g = new THREE.Group(); this.g.position.z = z; parent.add(this.g); this.pool = []; }
  set(list) {
    while (this.pool.length < list.length) {
      const m = new THREE.Mesh(quad, new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      m.renderOrder = 5; this.g.add(m); this.pool.push(m);
    }
    this.pool.forEach((m, i) => {
      const b = list[i]; m.visible = !!b; if (!b) return;
      const [ax, ay] = b.a, [bx, by] = b.b, L = Math.hypot(bx - ax, by - ay);
      m.position.set((ax + bx) / 2, (ay + by) / 2, (b.z || 0));
      m.rotation.z = Math.atan2(by - ay, bx - ax); m.scale.set(L, b.w || .004, 1);
      m.material.color.set(b.c ?? 0xfff3d0).multiplyScalar(b.o ?? 1);
    });
  }
}

const D = Math.PI / 180;
export const deg = r => r / D, rad = d => d * D;
/** Hệ số phản xạ Fresnel (ánh sáng không phân cực). Trả về {R, t (góc khúc xạ, rad) | null nếu phản xạ toàn phần} */
export function fresnel(n1, n2, i) {
  const s = n1 / n2 * Math.sin(i);
  if (Math.abs(s) >= 1) return { R: 1, t: null };
  const t = Math.asin(s), ci = Math.cos(i), ct = Math.cos(t);
  const rs = ((n1 * ci - n2 * ct) / (n1 * ci + n2 * ct)) ** 2, rp = ((n1 * ct - n2 * ci) / (n1 * ct + n2 * ci)) ** 2;
  return { R: (rs + rp) / 2, t };
}
/** chiết suất thuỷ tinh crown theo bước sóng (nm) – công thức Cauchy */
export const nGlass = (lam, A = 1.5046, B = 4200) => A + B / (lam * lam);
/** màu RGB gần đúng của bước sóng (nm) */
export function lamRGB(l) {
  let r = 0, g = 0, b = 0;
  if (l < 440) { r = -(l - 440) / 60; b = 1; } else if (l < 490) { g = (l - 440) / 50; b = 1; } else if (l < 510) { g = 1; b = -(l - 510) / 20; }
  else if (l < 580) { r = (l - 510) / 70; g = 1; } else if (l < 645) { r = 1; g = -(l - 645) / 65; } else r = 1;
  const f = l < 420 ? .3 + .7 * (l - 380) / 40 : l > 700 ? .3 + .7 * (780 - l) / 80 : 1;
  return new THREE.Color(r * f, g * f, b * f);
}
