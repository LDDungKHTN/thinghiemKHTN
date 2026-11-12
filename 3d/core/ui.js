// Giao diện chung: khung trang, thẻ, câu hỏi, thông báo
import { sfx, setMuted, isMuted, onMute } from './sfx.js';
export const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const fmt = (n, d = 1) => Number(n).toLocaleString('vi-VN', { maximumFractionDigits: d, minimumFractionDigits: 0 });

/** Dựng khung trang. panes: [{id, title, html}] */
export function shell({ title, sub = '', back = '../index.html', panes = [] }) {
  document.title = title.replace(/<[^>]+>/g, '');
  document.body.innerHTML = `<div class="app"><header class="hd"><a class="bk" href="${back}">← Danh sách</a><h1>${title}</h1><span class="sub">${sub}</span><button class="snd" id="snd" title="Bật/tắt âm thanh" aria-label="Bật/tắt âm thanh">🔊</button></header>
  <div class="main"><div class="stage" id="stage"><div class="ld" id="ld">Đang dựng phòng thí nghiệm 3D…</div><div class="toast" id="toast"></div></div>
  <aside class="side"><nav class="tabs">${panes.map((p, i) => `<button class="${i ? '' : 'on'}" data-i="${i}">${p.title}</button>`).join('')}</nav>
  ${panes.map((p, i) => `<section class="pane" id="${p.id}" ${i ? 'hidden' : ''}>${p.html || ''}</section>`).join('')}</aside></div></div>`;
  $$('.tabs button').forEach(b => b.onclick = () => showPane(+b.dataset.i));
  const sb = $('#snd'); sb.onclick = () => setMuted(!isMuted()); onMute(m => { sb.textContent = m ? '🔇' : '🔊'; sb.classList.toggle('off', m); });
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('button, .btn, label'); if (b && b.id != 'snd') sfx('click'); }, true);
  return $('#stage');
}
export function showPane(i) {
  $$('.tabs button').forEach((x, j) => x.classList.toggle('on', i == j));
  $$('.pane').forEach((p, j) => p.hidden = i != j);
}
export function ready() { setTimeout(() => $('#ld')?.classList.add('hide'), 150); }
let tt;
export function toast(msg, ms = 2600) { const t = $('#toast'); t.innerHTML = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), ms); }
export function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

/** Câu hỏi: {q, o:[...], a, e} hoặc {q, n:đáp số, e} */
export function quiz(host, Q) {
  const id = 'qz' + Math.random().toString(36).slice(2, 6);
  host.innerHTML = Q.map((q, i) => `<div class="q" id="${id}q${i}"><b>Câu ${i + 1}.</b> ${q.q}<div style="margin-top:6px">${q.o ? q.o.map((o, j) => `<label><input type="radio" name="${id}r${i}" value="${j}"> ${o}</label>`).join('') : `<input type="text" id="${id}n${i}" inputmode="decimal" placeholder="đáp số" style="width:120px"> ${q.u || ''}`}</div><div class="row"><button class="btn g" data-i="${i}">Kiểm tra</button><span id="${id}s${i}"></span></div></div>`).join('');
  host.querySelectorAll('button').forEach(b => b.onclick = () => {
    const i = +b.dataset.i, q = Q[i]; let ok = false, has = true;
    if (q.o) { const c = host.querySelector(`input[name=${id}r${i}]:checked`); has = !!c; ok = c && +c.value == q.a; }
    else { const s = $('#' + id + 'n' + i).value.replace(/\s/g, '').replace(',', '.'); has = s !== ''; ok = has && Math.abs(parseFloat(s) - q.n) <= Math.max(Math.abs(q.n) * (q.tol ?? .02), .011); }
    const s = $('#' + id + 's' + i);
    if (!has) { s.innerHTML = '<span class="sm">Hãy chọn hoặc nhập đáp án.</span>'; return; }
    $('#' + id + 'q' + i).className = 'q ' + (ok ? 'good' : 'bad'); sfx(ok ? 'chime' : 'error');
    s.innerHTML = `<span class="${ok ? 'ok' : 'er'}">${ok ? 'Chính xác!' : 'Chưa đúng.'}</span> <span class="sm">${ok || q.showE ? q.e || '' : 'Thử lại nhé.'}</span>`;
  });
}

/** Nạp Three.js qua importmap (gọi trước khi import lab3d) – đặt trong HTML */
export const THREE_VER = '0.160.0';
