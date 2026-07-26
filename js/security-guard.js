/* ============================================================
   GĐPT HÒA THỌ — Security Guard v2.0
   Bảo vệ Frontend: Domain Lock, Anti-Save, Anti-Debug
   File này phải được load TRƯỚC các file JS khác (không defer)
   ============================================================ */

(function () {
  "use strict";

  // ===== AUTOMATIC CACHE-BUSTING & REVALIDATION ENGINE =====
  // Khi deploy code mới, tăng version này để ÉP TẤT CẢ TRÌNH DUYỆT XÓA CACHE CŨ & RENDER CODE MỚI 100%
  var APP_BUILD_VERSION = "3.0.0_20260726_v3";

  function autoPurgeStaleCache() {
    try {
      var savedVersion = localStorage.getItem("gdpt_app_version");

      // Hủy bỏ Service Worker cũ nếu có
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then(function (registrations) {
          for (var i = 0; i < registrations.length; i++) {
            registrations[i].unregister();
          }
        });
      }

      if (savedVersion !== APP_BUILD_VERSION) {
        localStorage.setItem("gdpt_app_version", APP_BUILD_VERSION);

        // Xóa toàn bộ CacheStorage cũ của trình duyệt
        if ("caches" in window) {
          caches.keys().then(function (names) {
            for (var k = 0; k < names.length; k++) {
              caches.delete(names[k]);
            }
          });
        }

        // Nếu là phiên bản cũ nâng cấp lên -> Tải lại trang với bypass cache
        if (savedVersion) {
          window.location.reload(true);
        }
      }
    } catch (e) {}
  }
  autoPurgeStaleCache();

  // ===== CẤU HÌNH =====
  // Danh sách domain được phép chạy trang web
  // Thêm domain của bạn vào đây nếu cần
  var ALLOWED_HOSTS = [
    "gdpthoatho.id.vn",
    "www.gdpthoatho.id.vn",
    "localhost",
    "127.0.0.1",
  ];

  // =============================================
  // 1. DOMAIN LOCK — Khóa tên miền
  // Nếu kẻ clone copy code chạy trên domain khác,
  // trang web sẽ tự động xóa nội dung & chuyển hướng
  // =============================================
  function checkDomain() {
    var host = window.location.hostname;

    // Cho phép mở file cục bộ (file://) để phát triển
    if (window.location.protocol === "file:") return;

    var isAllowed = false;
    for (var i = 0; i < ALLOWED_HOSTS.length; i++) {
      if (host === ALLOWED_HOSTS[i]) {
        isAllowed = true;
        break;
      }
    }

    if (!isAllowed) {
      // Xóa toàn bộ nội dung trang — kẻ clone chỉ thấy trang trắng
      document.documentElement.innerHTML = "";
      document.title = "";

      // Chuyển hướng về trang chính chủ sau 100ms
      setTimeout(function () {
        window.location.replace("https://gdpthoatho.id.vn");
      }, 100);
    }
  }

  // Chạy kiểm tra domain ngay lập tức (không đợi DOM load)
  checkDomain();

  // =============================================
  // 2. CHẶN LƯU TRANG — Block Ctrl+S (Save Page)
  // Chỉ chặn lưu trang, KHÔNG chặn copy/paste thông thường
  // để người dùng vẫn copy được văn bản thoải mái
  // =============================================
  document.addEventListener("keydown", function (e) {
    // Chặn Ctrl+S / Cmd+S (Lưu trang web)
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Chặn Ctrl+U (View Source code HTML)
    if ((e.ctrlKey || e.metaKey) && e.key === "u") {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });

  // =============================================
  // 3. CHỐNG MỞ DEVTOOLS (Anti-Debug) — Phiên bản nhẹ
  // Phát hiện DevTools bằng kỹ thuật đo thời gian debugger
  // Khi phát hiện → ghi log cảnh báo (không phá vỡ trang)
  // =============================================
  var devtoolsWarned = false;

  function detectDevTools() {
    var threshold = 160; // pixel threshold (DevTools chiếm ít nhất 160px)

    // Phát hiện qua kích thước cửa sổ (DevTools docked chiếm không gian)
    var widthDiff = window.outerWidth - window.innerWidth;
    var heightDiff = window.outerHeight - window.innerHeight;

    if (widthDiff > threshold || heightDiff > threshold) {
      if (!devtoolsWarned) {
        devtoolsWarned = true;
        console.log(
          "%c🛡️ GĐPT Hòa Thọ — Website được bảo vệ bản quyền",
          "color: #e6a817; font-size: 16px; font-weight: bold;"
        );
        console.log(
          "%cMọi hành vi sao chép, tái sử dụng mã nguồn hoặc nội dung website " +
            "mà không có sự cho phép bằng văn bản đều vi phạm quyền sở hữu trí tuệ.",
          "color: #ff6b6b; font-size: 13px;"
        );
        console.log(
          "%c© 2025 GĐPT Hòa Thọ — https://gdpthoatho.id.vn",
          "color: #888; font-size: 12px;"
        );
      }
    }
  }

  // Kiểm tra định kỳ mỗi 2 giây (nhẹ nhàng, không ảnh hưởng hiệu suất)
  setInterval(detectDevTools, 2000);

  // =============================================
  // 4. WATERMARK BẢN QUYỀN TRONG MÃ NGUỒN
  // Chèn bình luận ẩn để chứng minh quyền sở hữu
  // =============================================
  var watermark = document.createComment(
    "\n" +
    "  ╔══════════════════════════════════════════════════════════╗\n" +
    "  ║  © 2025 GĐPT Hòa Thọ — Gia Đình Phật Tử Hòa Thọ     ║\n" +
    "  ║  Website: https://gdpthoatho.id.vn                     ║\n" +
    "  ║  Bản quyền thuộc về GĐPT Hòa Thọ.                     ║\n" +
    "  ║  Mọi hành vi sao chép trái phép sẽ bị xử lý theo      ║\n" +
    "  ║  Luật Sở hữu trí tuệ và DMCA.                         ║\n" +
    "  ╚══════════════════════════════════════════════════════════╝\n"
  );
  document.documentElement.appendChild(watermark);

  // =============================================
  // 5. CHẶN KÉO THẢ HÌNH ẢNH (Anti-Drag Image)
  // Ngăn kéo thả ảnh ra ngoài trình duyệt để lưu nhanh
  // =============================================
  document.addEventListener("dragstart", function (e) {
    if (e.target.tagName === "IMG") {
      e.preventDefault();
    }
  });

  // =============================================
  // 6. BẢO VỆ NỘI DUNG KHI IN (Print Protection)
  // Thêm watermark bản quyền khi người dùng in trang
  // =============================================
  var printStyle = document.createElement("style");
  printStyle.textContent =
    "@media print {" +
    "  body::after {" +
    '    content: "© GĐPT Hòa Thọ — gdpthoatho.id.vn — Bản in từ website chính thức";' +
    "    position: fixed;" +
    "    bottom: 10px;" +
    "    left: 0;" +
    "    right: 0;" +
    "    text-align: center;" +
    "    font-size: 10px;" +
    "    color: #999;" +
    "    z-index: 99999;" +
    "  }" +
    "}";
  document.head.appendChild(printStyle);
})();
