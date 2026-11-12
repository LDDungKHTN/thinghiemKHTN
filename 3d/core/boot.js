// Chạy trước mọi thứ (script thường, không phải module): báo lỗi lên màn hình thay vì để trang trắng
(function () {
  var shown = false;
  function box(msg, detail) {
    if (shown) return; shown = true;
    var d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:12px;right:12px;top:12px;z-index:99999;background:#fff4e6;color:#5c2b00;border:2px solid #e8590c;border-radius:10px;padding:14px;font:15px/1.5 Segoe UI,Arial,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.25)';
    d.innerHTML = '<b>Chưa mở được thí nghiệm 3D</b><br>' + msg +
      '<br><span style="font-size:13px;opacity:.8">Cách khắc phục: mở link bằng <b>Chrome</b> (Android) hoặc <b>Safari</b> (iPhone), cập nhật trình duyệt/hệ điều hành mới nhất, rồi tải lại trang.</span>' +
      (detail ? '<br><code style="font-size:12px;word-break:break-all;opacity:.75">' + String(detail).slice(0, 300) + '</code>' : '') +
      '<br><button onclick="location.reload()" style="margin-top:8px;padding:6px 14px;border-radius:6px;border:0;background:#e8590c;color:#fff;font-weight:600">Tải lại</button> <a href="../index.html" style="margin-left:8px">← Danh sách</a>';
    (document.body || document.documentElement).appendChild(d);
  }
  window.__labError = box;
  // 1) trình duyệt không hỗ trợ ES module
  var s = document.createElement('script');
  if (!('noModule' in s)) { document.addEventListener('DOMContentLoaded', function () { box('Trình duyệt này quá cũ, không chạy được mô phỏng 3D.'); }); return; }
  // 2) không có WebGL
  try { var c = document.createElement('canvas'); if (!(c.getContext('webgl2') || c.getContext('webgl'))) document.addEventListener('DOMContentLoaded', function () { box('Thiết bị/trình duyệt đang tắt đồ hoạ 3D (WebGL).'); }); } catch (e) { }
  // 3) lỗi khi chạy hoặc không tải được tệp
  window.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t !== window && t.tagName === 'SCRIPT') box('Không tải được tệp chương trình (mạng chậm hoặc bị chặn).', t.src || 'module');
    else if (e.message && !document.querySelector('#stage canvas')) box('Có lỗi khi chạy thí nghiệm.', e.message + (e.filename ? ' @ ' + e.filename.split('/').pop() + ':' + e.lineno : ''));
  }, true);
  window.addEventListener('unhandledrejection', function (e) { box('Có lỗi khi chạy thí nghiệm.', e.reason && (e.reason.message || e.reason)); });
  // 4) chữ "Đang tải" trong lúc chờ; quá lâu mà chưa dựng xong thì báo
  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('stage')) { var p = document.createElement('div'); p.id = 'bootld'; p.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;font:600 16px Segoe UI,Arial,sans-serif;color:#37474f;background:#d9dee3'; p.textContent = 'Đang tải thí nghiệm 3D…'; document.body.appendChild(p); }
  });
  setTimeout(function () { if (!document.getElementById('stage')) box('Tải quá lâu – có thể mạng chậm hoặc trình duyệt không hỗ trợ.'); }, 25000);
})();
