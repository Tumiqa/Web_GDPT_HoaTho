/* ============================================================
   GĐPT HÒA THỌ — Admin CMS v2.0
   Hệ thống quản trị nội dung đầy đủ
   Sidebar navigation · Facebook-style posting · Rich media
   ============================================================ */

(function () {
  "use strict";

  // ===== CONFIG =====
  const API_URL = "api.php";
  const AUTH_URL = "auth.php";

  function createModalOverlay(id) {
    let overlay = document.getElementById(id);
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = id;
      overlay.className = "auth-modal-overlay";
      document.body.appendChild(overlay);
    }
    return overlay;
  }
  const MODULES = {
    sinhhoat: {
      label: "Sinh Hoạt",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
      createLabel: "Tạo bài Sinh Hoạt mới",
      createHint: "Chia sẻ khoảnh khắc hoạt động, lễ hội, trại mạc...",
    },
    nhac: {
      label: "Nhạc GĐPT",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
      createLabel: "Thêm bài nhạc mới",
      createHint: "Thêm bài hát GĐPT vào bộ sưu tập...",
    },
    tailieu: {
      label: "Tài Liệu",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
      createLabel: "Thêm tài liệu mới",
      createHint: "Chia sẻ giáo án, sách, bài giảng...",
    },
    kynang: {
      label: "Kỹ Năng",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
      createLabel: "Thêm bài kỹ năng mới",
      createHint: "Hướng dẫn kết dây, morse, dựng trại...",
    },
    users: {
      label: "Tài Khoản",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
      createLabel: "Thêm tài khoản mới",
      createHint: "Tạo tài khoản thành viên, phân quyền...",
      adminOnly: true,
    },
    exams: {
      label: "Đề Thi & Kiểm Tra",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
      createLabel: "Tạo đề thi mới",
      createHint: "Soạn đề thi trắc nghiệm, điền từ, thời gian...",
      adminOnly: true,
    },
  };

  // ===== NGÀNH (BRANCH) CONFIGURATION =====
  // Maps each Ngành to its Bậc Học list with optional badge images
  const NGANH_CONFIG = {
    'Oanh Vũ Nam': {
      label: 'Oanh Vũ Nam',
      position: 'Đoàn sinh',
      studyLevels: [
        { name: 'Mở Mắt',    img: 'images/badges/mo-mat.jpg' },
        { name: 'Cánh Mềm',  img: 'images/badges/canh-mem.jpg' },
        { name: 'Chân Cứng',  img: 'images/badges/chan-cung.jpg' },
        { name: 'Tung Bay',  img: 'images/badges/tung-bay.jpg' },
      ],
      ranks: [],
    },
    'Oanh Vũ Nữ': {
      label: 'Oanh Vũ Nữ',
      position: 'Đoàn sinh',
      studyLevels: [
        { name: 'Mở Mắt',    img: 'images/badges/mo-mat.jpg' },
        { name: 'Cánh Mềm',  img: 'images/badges/canh-mem.jpg' },
        { name: 'Chân Cứng',  img: 'images/badges/chan-cung.jpg' },
        { name: 'Tung Bay',  img: 'images/badges/tung-bay.jpg' },
      ],
      ranks: [],
    },
    'Thiếu Nam': {
      label: 'Thiếu Nam',
      position: 'Đoàn sinh',
      studyLevels: [
        { name: 'Hướng Thiện', img: 'images/badges/huong-thien.jpg' },
        { name: 'Sơ Thiện',    img: 'images/badges/so-thien.jpg' },
        { name: 'Trung Thiện', img: 'images/badges/trung-thien.jpg' },
        { name: 'Chánh Thiện', img: 'images/badges/chanh-thien.jpg' },
      ],
      ranks: [],
    },
    'Thiếu Nữ': {
      label: 'Thiếu Nữ',
      position: 'Đoàn sinh',
      studyLevels: [
        { name: 'Hướng Thiện', img: 'images/badges/huong-thien.jpg' },
        { name: 'Sơ Thiện',    img: 'images/badges/so-thien.jpg' },
        { name: 'Trung Thiện', img: 'images/badges/trung-thien.jpg' },
        { name: 'Chánh Thiện', img: 'images/badges/chanh-thien.jpg' },
      ],
      ranks: [],
    },
    'Thanh Nam': {
      label: 'Thanh Nam',
      position: 'Đoàn sinh',
      studyLevels: [
        { name: 'Hòa',  img: 'images/badges/hoa.jpg' },
        { name: 'Minh',  img: 'images/badges/minh.jpg' },
        { name: 'Kiến',  img: 'images/badges/kien.jpg' },
        { name: 'Trực',  img: 'images/badges/truc.jpg' },
      ],
      ranks: [],
    },
    'Thanh Nữ': {
      label: 'Thanh Nữ',
      position: 'Đoàn sinh',
      studyLevels: [
        { name: 'Hòa',  img: 'images/badges/hoa.jpg' },
        { name: 'Minh',  img: 'images/badges/minh.jpg' },
        { name: 'Kiến',  img: 'images/badges/kien.jpg' },
        { name: 'Trực',  img: 'images/badges/truc.jpg' },
      ],
      ranks: [],
    },
    'Huynh Trưởng': {
      label: 'Huynh Trưởng',
      position: 'Huynh trưởng',
      studyLevels: [
        { name: 'Kiên', img: null },
        { name: 'Trì',  img: null },
        { name: 'Định', img: null },
        { name: 'Lực',  img: null },
      ],
      ranks: [
        { name: 'Tập Sự', img: 'images/badges/tap-su.jpg' },
        { name: 'Tập', img: 'images/badges/tap.jpg' },
        { name: 'Tín', img: 'images/badges/tin.jpg' },
        { name: 'Tấn', img: 'images/badges/tan.jpg' },
        { name: 'Dũng', img: 'images/badges/dung.jpg' },
      ],
    },
  };

  /**
   * Render badge items HTML for a list of levels/ranks
   * @param {Array} items - [{name, img}]
   * @param {string} currentValue - Currently selected value
   * @param {string} dataAttr - Data attribute name ('study-level' or 'rank')
   * @param {boolean} isSquare - If true, render square photo frame (for Cấp Huynh Trưởng)
   * @returns {string} HTML
   */
  function renderBadgeItems(items, currentValue, dataAttr, isSquare = false) {
    return items.map(item => {
      const isActive = currentValue === item.name ? ' active' : '';
      if (isSquare && item.img) {
        // Square photo frame for Cấp Huynh Trưởng (Tập, Tín, Tấn, Dũng)
        return `
          <div class="badge-item badge-item--square${isActive}" data-badge-${dataAttr}="${escAttr(item.name)}">
            <div class="badge-square-frame">
              <img src="${item.img}" alt="${esc(item.name)}" />
            </div>
            <div class="badge-label">${esc(item.name)}</div>
          </div>
        `;
      } else if (item.img) {
        // Diamond image badge for Bậc học Đoàn sinh
        return `
          <div class="badge-item badge-item--has-img${isActive}" data-badge-${dataAttr}="${escAttr(item.name)}">
            <div class="badge-diamond-frame">
              <div class="badge-diamond-border"></div>
              <div class="badge-diamond-inner">
                <img src="${item.img}" alt="${esc(item.name)}" />
              </div>
            </div>
            <div class="badge-label">${esc(item.name)}</div>
          </div>
        `;
      } else {
        // Text-only 45° diamond box (Kiên, Trì, Định, Lực, Minh, Kiến) - NO sub-label
        return `
          <div class="badge-item badge-item--text-only${isActive}" data-badge-${dataAttr}="${escAttr(item.name)}">
            <div class="badge-diamond-text-box">
              <span>${esc(item.name)}</span>
            </div>
          </div>
        `;
      }
    }).join('');
  }

  /**
   * Render the full badge selector section for position / nganh
   * @param {string} position - 'Đoàn sinh' or 'Huynh trưởng'
   * @param {string} nganhKey - Key in NGANH_CONFIG
   * @param {string} currentStudyLevel - Current study level
   * @param {string} currentRank - Current rank
   * @returns {string} HTML for study level + rank badge sections
   */
  function renderBadgeSections(position, nganhKey, currentStudyLevel, currentRank) {
    let html = '';

    if (position === 'Huynh trưởng') {
      const htConfig = NGANH_CONFIG['Huynh Trưởng'];
      if (htConfig) {
        // Bậc Học — Huynh Trưởng (Text-only 4 diamond boxes)
        if (htConfig.studyLevels && htConfig.studyLevels.length > 0) {
          html += `
            <div class="badge-section" id="badge-study-level-section">
              <div class="badge-section__header">Bậc Học — Huynh Trưởng</div>
              <div class="badge-selector" id="badge-study-level-selector">
                ${renderBadgeItems(htConfig.studyLevels, currentStudyLevel, 'study-level', false)}
              </div>
            </div>
          `;
        }
        // Cấp — Huynh Trưởng (Square photo cards: Tập, Tín, Tấn, Dũng)
        if (htConfig.ranks && htConfig.ranks.length > 0) {
          html += `
            <div class="badge-section" id="badge-rank-section">
              <div class="badge-section__header">Cấp — Huynh Trưởng</div>
              <div class="badge-selector" id="badge-rank-selector">
                ${renderBadgeItems(htConfig.ranks, currentRank, 'rank', true)}
              </div>
            </div>
          `;
        }
      }
    } else {
      // Đoàn sinh
      const config = NGANH_CONFIG[nganhKey];
      if (config && config.studyLevels && config.studyLevels.length > 0) {
        html += `
          <div class="badge-section" id="badge-study-level-section">
            <div class="badge-section__header">Bậc Học — ${esc(config.label)}</div>
            <div class="badge-selector" id="badge-study-level-selector">
              ${renderBadgeItems(config.studyLevels, currentStudyLevel, 'study-level', false)}
            </div>
          </div>
        `;
      }
    }

    return html;
  }

  /**
   * Render the Ngành dropdown select HTML
   * @param {string} id - Element ID
   * @param {string} currentNganh - Current value
   * @returns {string} HTML
   */
  function renderNganhSelect(id, currentNganh) {
    const nganhOptions = ['Oanh Vũ Nam', 'Oanh Vũ Nữ', 'Thiếu Nam', 'Thiếu Nữ', 'Thanh Nam', 'Thanh Nữ'];
    let opts = '<option value="">— Chọn ngành —</option>';
    nganhOptions.forEach(key => {
      const selected = currentNganh === key ? 'selected' : '';
      opts += `<option value="${escAttr(key)}" ${selected}>${esc(key)}</option>`;
    });
    return `<select class="adm-input" id="${id}" style="background:#1e3222; color:#fff;">${opts}</select>`;
  }

  let isLoggedIn = false;
  let adminHash = "";
  let currentUser = null; // { id, username, displayName, role }
  let currentModule = "sinhhoat";
  let moduleData = {};
  let searchQuery = "";

  // ===== ICONS (reusable) =====
  const ICONS = {
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
    search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    video: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
    tag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
    file: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  };

  // ===== SHA-256 HASH =====
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  // ===== DATA SERVICE =====
  const DataService = {
    async fetch(module) {
      try { const res = await fetch(`${API_URL}?module=${module}`); if (res.ok) return await res.json(); } catch (e) {}
      try { const res = await fetch(`data/${module}.json`); if (res.ok) return await res.json(); } catch (e) {}
      return null;
    },
    async save(module, data) {
      try {
        const headers = { "Content-Type": "application/json" };
        // Legacy fallback: include X-Admin-Token if available
        if (adminHash) headers["X-Admin-Token"] = adminHash;
        const res = await fetch(`${API_URL}?module=${module}`, {
          method: "POST",
          headers,
          credentials: "same-origin", // Send session cookie
          body: JSON.stringify(data),
        });
        if (res.ok) { const r = await res.json(); if (r.success) return { success: true, method: "server" }; }
      } catch (e) {}
      localStorage.setItem(`gdpt_${module}`, JSON.stringify(data));
      return { success: true, method: "local" };
    },
  };
  window.GDPTData = DataService;

  // ===== HELPERS =====
  function esc(str) { return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function escAttr(str) { return (str || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }

  function getYouTubeId(url) {
    const m = (url || "").match(/(?:youtu\.be\/|v=|embed\/)([^#&?]{11})/);
    return m ? m[1] : null;
  }

  function getYouTubeThumb(url) {
    const id = getYouTubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  }

  // ===== TOAST =====
  function showToast(message, isError = false) {
    let toast = document.getElementById("admin-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "admin-toast";
      toast.className = "adm-toast";
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span class="adm-toast__icon">${isError ? ICONS.warning : ICONS.check}</span><span>${esc(message)}</span>`;
    toast.className = `adm-toast visible${isError ? " error" : ""}`;
    setTimeout(() => toast.classList.remove("visible"), 3500);
  }

  // ===== CONFIRM DIALOG =====
  function showConfirm(title, message) {
    return new Promise(resolve => {
      const overlay = document.createElement("div");
      overlay.className = "adm-confirm-overlay";
      overlay.innerHTML = `
        <div class="adm-confirm">
          <div class="adm-confirm__icon">${ICONS.warning}</div>
          <h3>${esc(title)}</h3>
          <p>${esc(message)}</p>
          <div class="adm-confirm__btns">
            <button class="adm-btn adm-btn--ghost" id="adm-confirm-no">Hủy</button>
            <button class="adm-btn adm-btn--danger" id="adm-confirm-yes">Xóa</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add("visible"));
      const cleanup = (val) => { overlay.classList.remove("visible"); setTimeout(() => overlay.remove(), 300); resolve(val); };
      overlay.querySelector("#adm-confirm-yes").addEventListener("click", () => cleanup(true));
      overlay.querySelector("#adm-confirm-no").addEventListener("click", () => cleanup(false));
      overlay.addEventListener("click", e => { if (e.target === overlay) cleanup(false); });
    });
  }

  // ===== DYNAMIC LOAD SCRIPT/STYLE =====
  function loadScript(src) {
    return new Promise(resolve => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      document.head.appendChild(s);
    });
  }
  function loadStyle(href) {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = href;
      document.head.appendChild(l);
    }
  }

  // ===== ROLE HELPERS =====
  function isAdmin() { return currentUser && currentUser.role === 'admin'; }
  function isMember() { return currentUser && currentUser.role === 'member'; }

  // ===== BUILD ADMIN UI =====
  function buildAdminHTML() {
    if (document.getElementById("adm-root")) return;

    const root = document.createElement("div");
    root.id = "adm-root";
    root.className = "adm-root";
    root.innerHTML = `
      <!-- Login Modal -->
      <div class="adm-login" id="adm-login" style="display:none;">
        <div class="adm-login__card">
          <button class="adm-btn-icon adm-login__close" id="adm-login-close">${ICONS.close}</button>
          <div class="adm-login__logo">🔐</div>
          <h2>Đăng nhập</h2>
          <p>Tính năng này chỉ dành riêng cho thành viên <span style="white-space: nowrap;">GĐPT Hòa Thọ</span>.</p>
          <input type="text" class="adm-input" id="adm-username" placeholder="Tên đăng nhập / Số điện thoại..." autocomplete="username" style="margin-bottom:12px;" />
          <div class="adm-pwd-wrapper">
            <input type="password" class="adm-input" id="adm-pwd" placeholder="Mật khẩu..." autocomplete="current-password" />
            <button type="button" class="adm-pwd-toggle" id="adm-pwd-toggle" aria-label="Hiện/ẩn mật khẩu" tabindex="-1">
              <svg class="adm-eye-show" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg class="adm-eye-hide" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>
          </div>
          <button class="adm-btn adm-btn--primary adm-btn--full" id="adm-login-btn" style="margin-top:16px;">Đăng nhập</button>
          <div class="adm-login__error" id="adm-login-err"></div>
        </div>
      </div>

      <!-- Dashboard -->
      <div class="adm-dashboard" id="adm-dashboard" style="display:none;">
        <!-- Mobile header -->
        <div class="adm-mobile-header">
          <button class="adm-btn-icon" id="adm-sidebar-toggle">${ICONS.menu}</button>
          <h3 id="adm-mobile-title">Quản Trị</h3>
          <button class="adm-btn-icon" id="adm-close-mobile">${ICONS.close}</button>
        </div>

        <!-- Sidebar -->
        <aside class="adm-sidebar" id="adm-sidebar">
          <div class="adm-sidebar__header">
            <div class="adm-sidebar__brand">
              <span class="adm-sidebar__brand-icon">⚙️</span>
              <span>Admin Panel</span>
            </div>
            <button class="adm-btn-icon adm-sidebar__close-btn" id="adm-sidebar-close">${ICONS.close}</button>
          </div>
          <!-- User info -->
          <div class="adm-sidebar__user" id="adm-user-info"></div>
          <nav class="adm-sidebar__nav" id="adm-nav"></nav>
          <div class="adm-sidebar__footer">
            <button class="adm-sidebar__action adm-admin-only" id="adm-btn-export">${ICONS.download}<span>Xuất JSON</span></button>
            <button class="adm-sidebar__action adm-admin-only" id="adm-btn-import">${ICONS.upload}<span>Nhập JSON</span></button>
            <input type="file" accept=".json" id="adm-import-file" style="display:none" />
            <div class="adm-sidebar__divider"></div>
            <button class="adm-sidebar__action adm-sidebar__action--logout" id="adm-btn-logout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span>Đăng xuất</span>
            </button>
            <button class="adm-sidebar__action adm-sidebar__action--exit" id="adm-btn-exit">${ICONS.close}<span>Đóng</span></button>
          </div>
        </aside>

        <!-- Main content -->
        <main class="adm-main" id="adm-main">
          <!-- Breadcrumb -->
          <div class="adm-breadcrumb" id="adm-breadcrumb"></div>
          <!-- Content area -->
          <div class="adm-content" id="adm-content"></div>
        </main>
      </div>

      <!-- Form overlay -->
      <div class="adm-form-overlay" id="adm-form-overlay"></div>
    `;
    document.body.appendChild(root);
    initEvents();
    buildSidebar();
    updateUserInfoUI();
    applyRoleRestrictions();
  }

  // ===== BUILD SIDEBAR NAV =====
  function buildSidebar() {
    const nav = document.getElementById("adm-nav");
    nav.innerHTML = "";
    Object.entries(MODULES).forEach(([key, mod]) => {
      // Hide admin-only modules for members
      if (mod.adminOnly && !isAdmin()) return;

      const btn = document.createElement("button");
      btn.className = `adm-nav-item${key === currentModule ? " active" : ""}`;
      btn.dataset.module = key;
      btn.innerHTML = `<span class="adm-nav-item__icon">${mod.icon}</span><span>${mod.label}</span>`;
      btn.addEventListener("click", () => {
        switchModule(key);
        // Close sidebar on mobile
        document.getElementById("adm-sidebar").classList.remove("open");
      });
      nav.appendChild(btn);
    });
  }

  // ===== UPDATE USER INFO UI =====
  function updateUserInfoUI() {
    const userInfo = document.getElementById("adm-user-info");
    if (!userInfo || !currentUser) return;
    const roleBadge = currentUser.role === 'admin'
      ? '<span class="adm-role-badge adm-role-badge--admin">Admin</span>'
      : '<span class="adm-role-badge adm-role-badge--member">Member</span>';
    const avatarHtml = currentUser.avatarUrl
      ? `<img src="${currentUser.avatarUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;" />`
      : currentUser.displayName.charAt(0).toUpperCase();
    userInfo.innerHTML = `
      <div class="adm-user-card">
        <div class="adm-user-card__avatar">${avatarHtml}</div>
        <div class="adm-user-card__info">
          <div class="adm-user-card__name">${esc(currentUser.displayName)}</div>
          <div class="adm-user-card__meta">@${esc(currentUser.username)} ${roleBadge}</div>
        </div>
      </div>
    `;
  }

  // ===== APPLY ROLE RESTRICTIONS =====
  function applyRoleRestrictions() {
    if (!isAdmin()) {
      // Hide admin-only elements
      document.querySelectorAll('.adm-admin-only').forEach(el => el.style.display = 'none');
    }
  }

  // ===== INIT EVENTS =====
  function initEvents() {
    // Login events
    const loginBtn = document.getElementById("adm-login-btn");
    if (loginBtn) loginBtn.addEventListener("click", handleLogin);
    const pwdInput = document.getElementById("adm-pwd");
    if (pwdInput) pwdInput.addEventListener("keydown", e => { if (e.key === "Enter") handleLogin(); });
    const usernameInput = document.getElementById("adm-username");
    if (usernameInput) usernameInput.addEventListener("keydown", e => { if (e.key === "Enter") document.getElementById("adm-pwd").focus(); });
    const loginClose = document.getElementById("adm-login-close");
    if (loginClose) loginClose.addEventListener("click", closeAdmin);

    // Password eye toggle
    const pwdToggle = document.getElementById("adm-pwd-toggle");
    if (pwdToggle && pwdInput) {
      pwdToggle.addEventListener("click", () => {
        const isHidden = pwdInput.type === "password";
        pwdInput.type = isHidden ? "text" : "password";
        pwdToggle.querySelector(".adm-eye-show").style.display = isHidden ? "none" : "";
        pwdToggle.querySelector(".adm-eye-hide").style.display = isHidden ? "" : "none";
      });
    }

    // Close admin
    document.getElementById("adm-close-mobile").addEventListener("click", closeAdmin);
    document.getElementById("adm-btn-exit").addEventListener("click", closeAdmin);

    // Logout
    document.getElementById("adm-btn-logout").addEventListener("click", handleLogout);

    // Sidebar toggle (mobile)
    document.getElementById("adm-sidebar-toggle").addEventListener("click", () => {
      document.getElementById("adm-sidebar").classList.toggle("open");
    });
    document.getElementById("adm-sidebar-close").addEventListener("click", () => {
      document.getElementById("adm-sidebar").classList.remove("open");
    });

    // Export/Import (admin only)
    const exportBtn = document.getElementById("adm-btn-export");
    const importBtn = document.getElementById("adm-btn-import");
    if (exportBtn) exportBtn.addEventListener("click", exportAllData);
    if (importBtn) importBtn.addEventListener("click", () => document.getElementById("adm-import-file").click());
    document.getElementById("adm-import-file").addEventListener("change", importData);

    // Close on Esc
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        const formOverlay = document.getElementById("adm-form-overlay");
        if (formOverlay && formOverlay.classList.contains("visible")) {
          formOverlay.classList.remove("visible");
        } else {
          closeAdmin();
        }
      }
    });
  }

  // ===== LOGIN =====
  async function handleLogin() {
    const username = document.getElementById("adm-username").value.trim();
    const pwd = document.getElementById("adm-pwd").value;
    const err = document.getElementById("adm-login-err");
    if (!username || !pwd) { err.textContent = "Vui lòng nhập đầy đủ thông tin"; return; }

    try {
      const res = await fetch(`${AUTH_URL}?action=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username, password: pwd }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        currentUser = data.user;
        isLoggedIn = true;
        
        // Legacy compat: store hash in session for DataService
        const config = await DataService.fetch('config');
        if (config && config.adminPasswordHash && currentUser.role === 'admin') {
          adminHash = config.adminPasswordHash;
          sessionStorage.setItem('gdpt_admin', adminHash);
        }

        // Hide login and close admin panel overlay (staying on current page)
        document.getElementById("adm-login").style.display = "none";
        closeAdmin();
        
        // Render authenticated user menu in site header
        renderHeaderUser(currentUser);
        
        showToast("Đăng nhập thành công!");
      } else {
        err.textContent = data.error || "Đăng nhập thất bại";
      }
    } catch (e) {
      err.textContent = "Không thể kết nối đến máy chủ";
    }
  }

  // ===== LOGOUT =====
  async function handleLogout() {
    try {
      await fetch(`${AUTH_URL}?action=logout`, { credentials: 'same-origin' });
    } catch (e) {}
    currentUser = null;
    isLoggedIn = false;
    adminHash = "";
    sessionStorage.removeItem("gdpt_admin");
    
    // Hide dashboard and close admin panel overlay
    const dashboardEl = document.getElementById("adm-dashboard");
    if (dashboardEl) dashboardEl.style.display = "none";
    closeAdmin();
    
    // Restore login button in site header
    renderHeaderGuest();
    
    showToast("Đã đăng xuất thành công");
  }

  // ===== SWITCH MODULE =====
  async function switchModule(module) {
    currentModule = module;
    searchQuery = "";

    // Update sidebar active state
    document.querySelectorAll(".adm-nav-item").forEach(t => t.classList.toggle("active", t.dataset.module === module));

    // Update mobile title
    const mTitle = document.getElementById("adm-mobile-title");
    if (mTitle) mTitle.textContent = MODULES[module].label;

    // Update breadcrumb
    const bc = document.getElementById("adm-breadcrumb");
    bc.innerHTML = `<span class="adm-breadcrumb__item">Admin</span><span class="adm-breadcrumb__sep">›</span><span class="adm-breadcrumb__item active">${MODULES[module].label}</span>`;

    // Load data
    if (module === "users") {
      await loadAndRenderUsers();
      return;
    }
    if (module === "exams") {
      await loadAndRenderExams();
      return;
    }

    const data = await DataService.fetch(module);
    moduleData[module] = data;
    renderModule(module, data);
  }

  // ===== LOAD & RENDER USERS (ADMIN MODULE) =====
  async function loadAndRenderUsers() {
    const content = document.getElementById("adm-content");
    content.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
        <div>
          <h3 style="font-size:1.25rem; font-weight:700; color:#fff;">Quản Lý Tài Khoản</h3>
          <p style="font-size:0.8rem; color:rgba(255,255,255,0.5);">Quản trị danh sách huynh trưởng, đoàn sinh và phân quyền</p>
        </div>
        <button class="adm-btn adm-btn--primary" id="btn-add-user" style="display:flex; align-items:center; gap:8px;">
          ${ICONS.plus} <span>Thêm tài khoản mới</span>
        </button>
      </div>

      <div class="adm-item-list" id="users-list-container">
        <!-- Rendered users will go here -->
      </div>
    `;

    document.getElementById("btn-add-user").addEventListener("click", openAddUserModal);

    await refreshUsersList();
  }

  async function refreshUsersList() {
    const listContainer = document.getElementById("users-list-container");
    if (!listContainer) return;

    listContainer.innerHTML = `<div class="adm-loading">Đang tải danh sách tài khoản...</div>`;

    try {
      const res = await fetch(`${AUTH_URL}?action=list-users`, { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        const users = data.users || [];
        
        if (users.length === 0) {
          listContainer.innerHTML = `<div class="adm-empty"><p>Chưa có tài khoản nào được tạo.</p></div>`;
          return;
        }

        const isSuperAdmin = currentUser && currentUser.username === '0903549528';

        listContainer.innerHTML = users.map(u => {
          const roleBadge = u.role === 'admin' 
            ? '<span class="adm-role-badge adm-role-badge--admin">Admin</span>' 
            : '<span class="adm-role-badge adm-role-badge--member">Member</span>';
          const avatarHtml = u.avatar_url
            ? `<img src="${u.avatar_url}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;" />`
            : (u.full_name || u.display_name || "?").charAt(0).toUpperCase();
          
          // Super admin 0903549528 can edit profile, change password & delete other users.
          const canEditInfo = isSuperAdmin;
          const canChangePw = isSuperAdmin || (currentUser && u.id === currentUser.userId);
          const canDelete = isSuperAdmin && currentUser && (u.id !== currentUser.userId);

          const actionButtons = [];
          if (canEditInfo) {
            actionButtons.push(`
              <button class="adm-btn adm-btn--sm" data-user-action="edit-info" data-user-id="${u.id}">
                Sửa thông tin
              </button>
            `);
          }
          if (canChangePw) {
            actionButtons.push(`
              <button class="adm-btn adm-btn--sm" data-user-action="password" data-user-id="${u.id}" data-username="${escAttr(u.username)}">
                Đổi mật khẩu
              </button>
            `);
          }
          if (canDelete) {
            actionButtons.push(`
              <button class="adm-btn adm-btn--sm adm-btn--danger" data-user-action="delete" data-user-id="${u.id}" data-username="${escAttr(u.username)}">
                Xóa
              </button>
            `);
          }

          return `
            <div class="adm-card" style="flex-direction:column; align-items:stretch; gap:12px;">
              <div style="display:flex; align-items:center; gap:12px;">
                <div class="adm-user-card__avatar">${avatarHtml}</div>
                <div style="flex:1; min-width:0;">
                  <div class="adm-card__title">${esc(u.full_name || u.display_name)}</div>
                  <div class="adm-card__meta">
                    @${esc(u.username)} ${roleBadge}
                  </div>
                </div>
              </div>
              
              <div style="display:flex; gap:10px; flex-wrap:wrap; font-size:0.75rem; color:rgba(255,255,255,0.6);">
                ${u.dharma_name ? `<div>PD: <strong>${esc(u.dharma_name)}</strong></div>` : ''}
                ${u.position ? `<div>Chức vụ: <strong>${esc(u.position)}</strong></div>` : ''}
                ${u.nganh ? `<div>Ngành: <span class="nganh-badge">${esc(u.nganh)}</span></div>` : ''}
                ${u.rank ? `<div>Cấp: <strong>${esc(u.rank)}</strong></div>` : ''}
                ${u.study_level ? `<div>Bậc học: <strong>${esc(u.study_level)}</strong></div>` : ''}
              </div>

              ${actionButtons.length > 0 ? `
                <div style="display:flex; justify-content:flex-end; gap:8px; border-top:1px solid rgba(255,255,255,0.06); padding-top:10px; margin-top:4px;">
                  ${actionButtons.join('')}
                </div>
              ` : ''}
            </div>
          `;
        }).join("");

        // Attach event listeners using delegation
        const newContainer = listContainer.cloneNode(true);
        listContainer.parentNode.replaceChild(newContainer, listContainer);

        newContainer.addEventListener("click", async e => {
          const btn = e.target.closest("[data-user-action]");
          if (!btn) return;
          const action = btn.dataset.userAction;
          const userId = btn.dataset.userId;
          const username = btn.dataset.username;

          if (action === "edit-info") {
            const targetUser = users.find(x => x.id === userId);
            if (targetUser) openAdminEditUserProfileModal(targetUser);
          } else if (action === "password") {
            openAdminChangeUserPasswordModal(userId, username);
          } else if (action === "delete") {
            const confirmed = await showConfirm("Xác nhận xóa", `Bạn có chắc chắn muốn xóa tài khoản @${username}?`);
            if (confirmed) {
              try {
                const delRes = await fetch(`${AUTH_URL}?action=delete-user`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: 'same-origin',
                  body: JSON.stringify({ userId }),
                });
                const delData = await delRes.json();
                if (delRes.ok && delData.success) {
                  showToast(`Đã xóa tài khoản @${username}`);
                  await refreshUsersList();
                } else {
                  showToast(delData.error || "Xóa thất bại", true);
                }
              } catch (err) {
                showToast("Lỗi kết nối", true);
              }
            }
          }
        });

      } else {
        listContainer.innerHTML = `<div class="adm-empty"><p>Không thể tải danh sách tài khoản.</p></div>`;
      }
    } catch (err) {
      listContainer.innerHTML = `<div class="adm-empty"><p>Lỗi kết nối máy chủ.</p></div>`;
    }
  }

  // ===== ADMIN CREATE USER MODAL =====
  // ===== ADMIN CREATE USER MODAL =====
  function openAddUserModal() {
    let overlay = document.getElementById("add-user-modal-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "add-user-modal-overlay";
      overlay.className = "auth-modal-overlay";
      document.body.appendChild(overlay);
    }

    const isSuperAdmin = currentUser && currentUser.username === '0903549528';

    // State for badge selections
    let state = { position: 'Đoàn sinh', nganh: '', studyLevel: '', rank: '' };

    overlay.innerHTML = `
      <div class="auth-modal" style="width: min(600px, 94vw); max-height:90vh; overflow-y:auto;">
        <button class="adm-btn-icon auth-modal__close" id="add-user-close">${ICONS.close}</button>
        <h3>Thêm Tài Khoản Mới</h3>
        <p class="auth-modal__desc">Tạo tài khoản thành viên tu học cho huynh trưởng, đoàn sinh</p>
        
        <div class="auth-modal__grid" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="adm-field" style="grid-column: span 2;">
            <label>Tên đăng nhập / Số điện thoại *</label>
            <input type="text" class="adm-input" id="add-usr-username" placeholder="Nhập SĐT hoặc username..." required />
          </div>
          <div class="adm-field" style="grid-column: span 2;">
            <label>Mật khẩu * (Tối thiểu 6 ký tự)</label>
            <input type="password" class="adm-input" id="add-usr-password" placeholder="Nhập mật khẩu..." required />
          </div>
          <div class="adm-field">
            <label>Họ và tên *</label>
            <input type="text" class="adm-input" id="add-usr-fullName" placeholder="Trương Minh Quân..." required />
          </div>
          <div class="adm-field">
            <label>Pháp danh</label>
            <input type="text" class="adm-input" id="add-usr-dharmaName" placeholder="Chúc Vương..." />
          </div>
          <div class="adm-field">
            <label>Ngày sinh</label>
            <input type="text" class="adm-input" id="add-usr-dob" placeholder="DD/MM/YYYY" />
          </div>
          <div class="adm-field">
            <label>Vai trò hệ thống</label>
            <select class="adm-input" id="add-usr-role" style="background:#1e3222; color:#fff;">
              <option value="member">Member (Chỉ đọc / Tu học)</option>
              ${isSuperAdmin ? '<option value="admin">Admin (Toàn quyền CMS)</option>' : ''}
            </select>
          </div>
          <div class="adm-field">
            <label>Chức vụ</label>
            <select class="adm-input" id="add-usr-position" style="background:#1e3222; color:#fff;">
              <option value="Đoàn sinh">Đoàn sinh</option>
              <option value="Huynh trưởng">Huynh trưởng</option>
            </select>
          </div>
          <div class="adm-field" id="add-usr-nganh-group">
            <label>Ngành</label>
            ${renderNganhSelect('add-usr-nganh', '')}
          </div>

          <!-- Badge sections container -->
          <div id="add-usr-badge-container" style="grid-column: span 2;"></div>
        </div>

        <div class="auth-modal__error" id="add-usr-error" style="color:#ff6b6b; font-size:0.85rem; margin-top:12px; display:none;"></div>

        <div class="auth-modal__footer">
          <button class="adm-btn" id="add-usr-cancel">Hủy</button>
          <button class="adm-btn adm-btn--primary" id="add-usr-save">Tạo tài khoản</button>
        </div>
      </div>
    `;

    overlay.classList.add("visible");
    document.body.style.overflow = "hidden";

    const closeMod = () => {
      overlay.classList.remove("visible");
      document.body.style.overflow = "";
    };
    overlay.querySelector("#add-user-close").addEventListener("click", closeMod);
    overlay.querySelector("#add-usr-cancel").addEventListener("click", closeMod);

    const posSelect = overlay.querySelector("#add-usr-position");
    const nganhGroup = overlay.querySelector("#add-usr-nganh-group");
    const nganhSelect = overlay.querySelector("#add-usr-nganh");
    const badgeContainer = overlay.querySelector("#add-usr-badge-container");

    function updateModalBadges() {
      const currentPos = posSelect.value;
      if (currentPos === 'Huynh trưởng') {
        nganhGroup.style.display = 'none';
        state.nganh = '';
        badgeContainer.innerHTML = renderBadgeSections('Huynh trưởng', '', state.studyLevel, state.rank);
      } else {
        nganhGroup.style.display = 'block';
        state.nganh = nganhSelect.value;
        badgeContainer.innerHTML = renderBadgeSections('Đoàn sinh', state.nganh, state.studyLevel, state.rank);
      }
    }

    updateModalBadges();

    posSelect.addEventListener("change", () => {
      state.position = posSelect.value;
      state.studyLevel = '';
      state.rank = '';
      updateModalBadges();
    });

    nganhSelect.addEventListener("change", () => {
      state.nganh = nganhSelect.value;
      state.studyLevel = '';
      state.rank = '';
      updateModalBadges();
    });

    // Event delegation on badgeContainer for instant responsive clicks
    badgeContainer.addEventListener("click", (e) => {
      const studyItem = e.target.closest("[data-badge-study-level]");
      if (studyItem) {
        const val = studyItem.dataset.badgeStudyLevel;
        const isAlreadyActive = studyItem.classList.contains("active");
        badgeContainer.querySelectorAll("[data-badge-study-level]").forEach(el => el.classList.remove("active"));
        if (!isAlreadyActive) {
          studyItem.classList.add("active");
          state.studyLevel = val;
        } else {
          state.studyLevel = "";
        }
        return;
      }

      const rankItem = e.target.closest("[data-badge-rank]");
      if (rankItem) {
        const val = rankItem.dataset.badgeRank;
        const isAlreadyActive = rankItem.classList.contains("active");
        badgeContainer.querySelectorAll("[data-badge-rank]").forEach(el => el.classList.remove("active"));
        if (!isAlreadyActive) {
          rankItem.classList.add("active");
          state.rank = val;
        } else {
          state.rank = "";
        }
        return;
      }
    });

    // Save handler
    overlay.querySelector("#add-usr-save").addEventListener("click", async () => {
      const username = overlay.querySelector("#add-usr-username").value.trim();
      const password = overlay.querySelector("#add-usr-password").value;
      const fullName = overlay.querySelector("#add-usr-fullName").value.trim();
      const dharmaName = overlay.querySelector("#add-usr-dharmaName").value.trim();
      const dob = overlay.querySelector("#add-usr-dob").value.trim();
      const role = overlay.querySelector("#add-usr-role").value;
      const position = posSelect.value;
      const nganh = state.nganh;
      const rank = state.rank;
      const studyLevel = state.studyLevel;
      const errEl = overlay.querySelector("#add-usr-error");

      if (!username || !password || !fullName) {
        errEl.textContent = "Vui lòng nhập đầy đủ các trường bắt buộc (*)";
        errEl.style.display = "block";
        return;
      }
      if (password.length < 6) {
        errEl.textContent = "Mật khẩu tối thiểu 6 ký tự";
        errEl.style.display = "block";
        return;
      }

      try {
        const res = await fetch(`${AUTH_URL}?action=create-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'same-origin',
          body: JSON.stringify({ username, password, displayName: dharmaName || fullName, role, fullName, dob, position, rank, studyLevel, dharmaName, nganh }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          closeMod();
          showToast(`Tạo thành công tài khoản @${username}`);
          await refreshUsersList();
        } else {
          errEl.textContent = data.error || "Tạo tài khoản thất bại";
          errEl.style.display = "block";
        }
      } catch (err) {
        errEl.textContent = "Lỗi kết nối máy chủ";
        errEl.style.display = "block";
      }
    });
  }

  // ===== ADMIN EDIT USER PROFILE MODAL (Super Admin 0903549528) =====
  function openAdminEditUserProfileModal(u) {
    if (!u) return;

    let overlay = document.getElementById("admin-edit-user-modal-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "admin-edit-user-modal-overlay";
      overlay.className = "auth-modal-overlay";
      document.body.appendChild(overlay);
    }

    const initialPosition = u.position || 'Đoàn sinh';
    const initialNganh = u.nganh || '';
    const initialStudyLevel = u.study_level || '';
    const initialRank = u.rank || '';

    let state = {
      position: initialPosition,
      nganh: initialNganh,
      studyLevel: initialStudyLevel,
      rank: initialRank
    };

    overlay.innerHTML = `
      <div class="auth-modal" style="width: min(600px, 94vw); max-height:90vh; overflow-y:auto;">
        <button class="adm-btn-icon auth-modal__close" id="edit-usr-close">${ICONS.close}</button>
        <h3>Sửa Thông Tin Đoàn Sinh</h3>
        <p class="auth-modal__desc">Chỉnh sửa thông tin cá nhân tài khoản <strong>@${esc(u.username)}</strong></p>
        
        <div class="auth-modal__grid" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="adm-field">
            <label>Họ và tên *</label>
            <input type="text" class="adm-input" id="edit-usr-fullName" value="${escAttr(u.full_name || '')}" placeholder="Họ và tên..." required />
          </div>
          <div class="adm-field">
            <label>Pháp danh</label>
            <input type="text" class="adm-input" id="edit-usr-dharmaName" value="${escAttr(u.dharma_name || '')}" placeholder="Pháp danh..." />
          </div>
          <div class="adm-field">
            <label>Ngày sinh</label>
            <input type="text" class="adm-input" id="edit-usr-dob" value="${escAttr(u.dob || '')}" placeholder="DD/MM/YYYY" />
          </div>
          <div class="adm-field">
            <label>Chức vụ</label>
            <select class="adm-input" id="edit-usr-position" style="background:#1e3222; color:#fff;">
              <option value="Đoàn sinh" ${initialPosition === 'Đoàn sinh' ? 'selected' : ''}>Đoàn sinh</option>
              <option value="Huynh trưởng" ${initialPosition === 'Huynh trưởng' ? 'selected' : ''}>Huynh trưởng</option>
            </select>
          </div>
          <div class="adm-field" id="edit-usr-nganh-group" style="${initialPosition === 'Huynh trưởng' ? 'display:none;' : ''}">
            <label>Ngành</label>
            ${renderNganhSelect('edit-usr-nganh', initialNganh)}
          </div>

          <!-- Badge section container -->
          <div id="edit-usr-badge-container" style="grid-column: span 2;"></div>
        </div>

        <div class="auth-modal__error" id="edit-usr-error" style="color:#ff6b6b; font-size:0.85rem; margin-top:12px; display:none;"></div>

        <div class="auth-modal__footer">
          <button class="adm-btn" id="edit-usr-cancel">Hủy</button>
          <button class="adm-btn adm-btn--primary" id="edit-usr-save">Lưu thay đổi</button>
        </div>
      </div>
    `;

    overlay.classList.add("visible");
    document.body.style.overflow = "hidden";

    const closeMod = () => {
      overlay.classList.remove("visible");
      document.body.style.overflow = "";
    };
    overlay.querySelector("#edit-usr-close").addEventListener("click", closeMod);
    overlay.querySelector("#edit-usr-cancel").addEventListener("click", closeMod);

    const posSelect = overlay.querySelector("#edit-usr-position");
    const nganhGroup = overlay.querySelector("#edit-usr-nganh-group");
    const nganhSelect = overlay.querySelector("#edit-usr-nganh");
    const badgeContainer = overlay.querySelector("#edit-usr-badge-container");

    function updateModalBadges() {
      const currentPos = posSelect.value;
      if (currentPos === 'Huynh trưởng') {
        nganhGroup.style.display = 'none';
        state.nganh = '';
        badgeContainer.innerHTML = renderBadgeSections('Huynh trưởng', '', state.studyLevel, state.rank);
      } else {
        nganhGroup.style.display = 'block';
        state.nganh = nganhSelect.value;
        badgeContainer.innerHTML = renderBadgeSections('Đoàn sinh', state.nganh, state.studyLevel, state.rank);
      }
    }

    updateModalBadges();

    posSelect.addEventListener("change", () => {
      state.position = posSelect.value;
      state.studyLevel = '';
      state.rank = '';
      updateModalBadges();
    });

    nganhSelect.addEventListener("change", () => {
      state.nganh = nganhSelect.value;
      state.studyLevel = '';
      state.rank = '';
      updateModalBadges();
    });

    // Event delegation on badgeContainer
    badgeContainer.addEventListener("click", (e) => {
      const studyItem = e.target.closest("[data-badge-study-level]");
      if (studyItem) {
        const val = studyItem.dataset.badgeStudyLevel;
        const isAlreadyActive = studyItem.classList.contains("active");
        badgeContainer.querySelectorAll("[data-badge-study-level]").forEach(el => el.classList.remove("active"));
        if (!isAlreadyActive) {
          studyItem.classList.add("active");
          state.studyLevel = val;
        } else {
          state.studyLevel = "";
        }
        return;
      }

      const rankItem = e.target.closest("[data-badge-rank]");
      if (rankItem) {
        const val = rankItem.dataset.badgeRank;
        const isAlreadyActive = rankItem.classList.contains("active");
        badgeContainer.querySelectorAll("[data-badge-rank]").forEach(el => el.classList.remove("active"));
        if (!isAlreadyActive) {
          rankItem.classList.add("active");
          state.rank = val;
        } else {
          state.rank = "";
        }
        return;
      }
    });

    overlay.querySelector("#edit-usr-save").addEventListener("click", async () => {
      const fullName = overlay.querySelector("#edit-usr-fullName").value.trim();
      const dharmaName = overlay.querySelector("#edit-usr-dharmaName").value.trim();
      const dob = overlay.querySelector("#edit-usr-dob").value.trim();
      const position = posSelect.value;
      const nganh = state.nganh;
      const rank = state.rank;
      const studyLevel = state.studyLevel;
      const errEl = overlay.querySelector("#edit-usr-error");

      if (!fullName) {
        errEl.textContent = "Họ và tên không được để trống";
        errEl.style.display = "block";
        return;
      }

      try {
        const res = await fetch(`${AUTH_URL}?action=update-profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'same-origin',
          body: JSON.stringify({ userId: u.id, fullName, dharmaName, dob, position, rank, studyLevel, nganh }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          closeMod();
          showToast(`Đã cập nhật thông tin cho @${u.username}`);
          await refreshUsersList();
        } else {
          errEl.textContent = data.error || "Cập nhật thông tin thất bại";
          errEl.style.display = "block";
        }
      } catch (err) {
        errEl.textContent = "Lỗi kết nối máy chủ";
        errEl.style.display = "block";
      }
    });
  }


  // ===== ADMIN CHANGE USER PASSWORD =====
  function openAdminChangeUserPasswordModal(userId, username) {
    let overlay = document.getElementById("admin-password-modal-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "admin-password-modal-overlay";
      overlay.className = "auth-modal-overlay";
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="auth-modal">
        <button class="adm-btn-icon auth-modal__close" id="admin-pw-close">${ICONS.close}</button>
        <h3>Đổi Mật Khẩu tài khoản</h3>
        <p class="auth-modal__desc">Đang thay đổi mật khẩu cho tài khoản: <strong>@${esc(username)}</strong></p>
        
        <div class="auth-modal__grid">
          <div class="adm-field">
            <label>Mật khẩu mới</label>
            <input type="password" class="adm-input" id="adm-pw-new" placeholder="Nhập mật khẩu mới..." required />
          </div>
        </div>

        <div class="auth-modal__error" id="adm-pw-error" style="color:#ff6b6b; font-size:0.85rem; margin-top:12px; display:none;"></div>

        <div class="auth-modal__footer">
          <button class="adm-btn" id="adm-pw-cancel">Hủy</button>
          <button class="adm-btn adm-btn--primary" id="adm-pw-save">Cập nhật mật khẩu</button>
        </div>
      </div>
    `;

    overlay.classList.add("visible");
    document.body.style.overflow = "hidden";

    const closeMod = () => {
      overlay.classList.remove("visible");
      document.body.style.overflow = "";
    };
    overlay.querySelector("#admin-pw-close").addEventListener("click", closeMod);
    overlay.querySelector("#adm-pw-cancel").addEventListener("click", closeMod);

    overlay.querySelector("#adm-pw-save").addEventListener("click", async () => {
      const newPassword = overlay.querySelector("#adm-pw-new").value;
      const errEl = overlay.querySelector("#adm-pw-error");

      if (newPassword.length < 6) {
        errEl.textContent = "Mật khẩu tối thiểu 6 ký tự";
        errEl.style.display = "block";
        return;
      }

      try {
        const res = await fetch(`${AUTH_URL}?action=change-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'same-origin',
          body: JSON.stringify({ userId, newPassword }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          closeMod();
          showToast(`Đã đổi mật khẩu cho tài khoản @${username}`);
        } else {
          errEl.textContent = data.error || "Thay đổi thất bại";
          errEl.style.display = "block";
        }
      } catch (err) {
        errEl.textContent = "Lỗi kết nối máy chủ";
        errEl.style.display = "block";
      }
    });
  }

  // ===== RENDER MODULE =====
  function renderModule(module, data) {
    const content = document.getElementById("adm-content");

    const items = Array.isArray(data) ? data : [];
    const mod = MODULES[module];

    content.innerHTML = `
      <!-- Create Post Box (Admin only) -->
      ${isAdmin() ? `<div class="adm-create-box" id="adm-create-box">
        <div class="adm-create-box__prompt">
          <div class="adm-create-box__avatar">${ICONS.plus}</div>
          <div class="adm-create-box__text">
            <strong>${mod.createLabel}</strong>
            <span>${mod.createHint}</span>
          </div>
        </div>
      </div>` : `<div class="adm-member-notice"><span>📋</span> Bạn đang xem ở chế độ Member (chỉ đọc)</div>`}

      <!-- Search bar -->
      <div class="adm-search-bar">
        <span class="adm-search-bar__icon">${ICONS.search}</span>
        <input type="text" class="adm-search-bar__input" id="adm-search" placeholder="Tìm kiếm trong ${mod.label}..." value="${escAttr(searchQuery)}" />
        <span class="adm-search-bar__count" id="adm-count">${items.length} mục</span>
      </div>

      <!-- Item list -->
      <div class="adm-item-list" id="adm-items"></div>
    `;

    // Create box click (admin only)
    const createBox = document.getElementById("adm-create-box");
    if (createBox) createBox.addEventListener("click", () => openForm(module, -1));

    // Search
    const searchInput = document.getElementById("adm-search");
    searchInput.addEventListener("input", () => {
      searchQuery = searchInput.value.toLowerCase();
      renderItems(module, items);
    });

    renderItems(module, items);
  }

  // ===== RENDER ITEMS =====
  function renderItems(module, items) {
    const container = document.getElementById("adm-items");
    const countEl = document.getElementById("adm-count");

    const filtered = items.filter(item => {
      if (!searchQuery) return true;
      const text = (item.title || item.name || "").toLowerCase() + " " + ((item.tags || []).join(" ")).toLowerCase() + " " + (item.content || item.description || "").toLowerCase();
      return text.includes(searchQuery);
    });

    countEl.textContent = `${filtered.length} / ${items.length} mục`;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="adm-empty">
          <div class="adm-empty__icon">${searchQuery ? ICONS.search : ICONS.file}</div>
          <p>${searchQuery ? "Không tìm thấy kết quả" : "Chưa có dữ liệu. Bấm nút ở trên để tạo mới!"}</p>
        </div>`;
      return;
    }

    container.innerHTML = filtered.map((item, idx) => {
      const realIdx = items.indexOf(item);
      const title = item.title || item.name || `Mục ${realIdx + 1}`;
      const meta = getItemMeta(module, item);
      const thumb = getItemThumb(module, item);
      const tags = (item.tags || []).slice(0, 3).map(t => `<span class="adm-chip">${esc(t)}</span>`).join("");

      return `
        <div class="adm-card" data-index="${realIdx}">
          ${thumb ? `<div class="adm-card__thumb"><img src="${escAttr(thumb)}" alt="" loading="lazy" onerror="this.parentElement.remove()" /></div>` : ""}
          <div class="adm-card__body">
            <div class="adm-card__title">${esc(title)}</div>
            <div class="adm-card__meta">${esc(meta)}</div>
            ${tags ? `<div class="adm-card__tags">${tags}</div>` : ""}
          </div>
          ${isAdmin() ? `<div class="adm-card__actions">
            <button class="adm-btn-icon adm-btn-icon--sm" data-action="edit" data-index="${realIdx}" title="Sửa">${ICONS.edit}</button>
            <button class="adm-btn-icon adm-btn-icon--sm adm-btn-icon--danger" data-action="delete" data-index="${realIdx}" title="Xóa">${ICONS.trash}</button>
          </div>` : ''}
        </div>`;
    }).join("");

    // Event delegation
    container.addEventListener("click", async e => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      const index = parseInt(btn.dataset.index);
      if (action === "edit") openForm(module, index);
      if (action === "delete") await deleteItem(module, index);
    }, { once: false });
  }

  function getItemMeta(module, item) {
    switch (module) {
      case "sinhhoat": return `${item.year || ""} · ${item.date || ""} · ${(item.images || []).length} ảnh · ${(item.videos || []).length} video`;
      case "nhac": return `${item.artist || "Nhạc GĐPT"} · ${item.duration || ""}`;
      case "tailieu": {
        const nganh = item.nganh || item.category || "Tài liệu chung";
        const bac = item.bac ? ` · ${item.bac}` : "";
        const access = item.access === 'internal' ? '🔒 Nội bộ' : '🌐 Công khai';
        return `${nganh}${bac} · ${access} · ${(item.fileType || "").toUpperCase()}`;
      }
      case "kynang": return `${item.category || ""} · ${(item.images || []).length} ảnh · ${(item.videos || []).length} video`;
      default: return "";
    }
  }

  function getItemThumb(module, item) {
    if (item.images && item.images.length) return item.images[0];
    if (item.videos && item.videos.length) return getYouTubeThumb(item.videos[0]);
    return null;
  }



  // ===== FORM: Build fields per module =====
  function getFormFields(module, item, isEdit) {
    const fields = [];
    switch (module) {
      case "sinhhoat":
        fields.push(
          { type: "text", id: "title", label: "Tiêu đề", placeholder: "Ví dụ: Trại Họp Bạn Diệu Định 2025", value: item.title, required: true },
          { type: "row", children: [
            { type: "text", id: "year", label: "Năm", placeholder: "2026", value: item.year || new Date().getFullYear().toString() },
            { type: "text", id: "date", label: "Ngày hiển thị", placeholder: "Tháng 5, 2026", value: item.date || "" },
          ]},
          { type: "richtext", id: "content", label: "Nội dung bài viết", placeholder: "Mô tả chi tiết về sự kiện, sinh hoạt...", value: item.content, height: "300px" },
          { type: "media", id: "images", label: "Hình ảnh", placeholder: "Dán link ảnh (mỗi dòng 1 URL)...", value: (item.images || []).join("\n"), hint: "URL ảnh trực tiếp hoặc đường dẫn trong project (images/...)", icon: "image" },
          { type: "media", id: "videos", label: "Video", placeholder: "Dán link YouTube (mỗi dòng 1 URL)...", value: (item.videos || []).join("\n"), hint: "YouTube, Google Drive hoặc link bất kỳ", icon: "video" },
          { type: "tags", id: "tags", label: "Gắn thẻ (Tags)", value: item.tags || [], hint: "Gõ tag rồi bấm Enter để thêm" },
        );
        break;
      case "nhac":
        fields.push(
          { type: "text", id: "title", label: "Tên bài hát", placeholder: "Ví dụ: Hồn Lửa Thiêng", value: item.title, required: true },
          { type: "text", id: "artist", label: "Nghệ sĩ / Thể loại", placeholder: "Nhạc GĐPT", value: item.artist || "Nhạc GĐPT" },
          { type: "text", id: "src", label: "Link MP3", placeholder: "https://archive.org/download/...", value: item.src || "", hint: "Archive.org, Google Drive hoặc URL MP3 trực tiếp" },
          { type: "text", id: "duration", label: "Thời lượng", placeholder: "3:45", value: item.duration || "" },
        );
        break;
      case "tailieu":
        fields.push(
          { type: "text", id: "title", label: "Tên tài liệu", placeholder: "Ví dụ: Giáo Án Ngành Thiếu - Bậc Hướng Thiện", value: item.title, required: true },
          { type: "textarea", id: "description", label: "Mô tả", placeholder: "Mô tả ngắn về tài liệu...", value: item.description, rows: 3 },
          { type: "row", children: [
            { type: "select", id: "nganh", label: "Ngành", value: item.nganh || 'Tài liệu chung', options: ["Tài liệu chung", "Ngành Oanh", "Ngành Thiếu", "Ngành Thanh", "Huynh Trưởng"] },
            { type: "select", id: "bac", label: "Bậc", value: item.bac || '', options: [''] },
          ]},
          { type: "row", children: [
            { type: "select", id: "access", label: "Quyền truy cập", value: item.access || 'public', options: ["public", "internal"], optionLabels: { "public": "🌐 Công khai", "internal": "🔒 Nội bộ" } },
            { type: "select", id: "attachmentType", label: "Loại đính kèm", value: item.attachmentType || 'link', options: ["link", "upload"], optionLabels: { "link": "🔗 Đường link", "upload": "📎 Upload file" } },
          ]},
          { type: "text", id: "url", label: "Link tài liệu", placeholder: "https://drive.google.com/...", value: item.url || "", hint: "Google Drive, PDF URL, hoặc link tải" },
          { type: "file_upload", id: "fileUpload", label: "Upload tài liệu", accept: ".pdf,.doc,.docx,.xls,.xlsx", hint: "Chấp nhận PDF, DOC, DOCX, XLS, XLSX (tối đa 10MB)", existingFile: item.attachmentType === 'upload' ? item.url : '' },
        );
        break;
      case "kynang":
        fields.push(
          { type: "text", id: "title", label: "Tiêu đề", placeholder: "Ví dụ: Nút Dây Cơ Bản", value: item.title, required: true },
          { type: "select", id: "category", label: "Chủ đề", value: item.category, options: ["Kết Dây", "Morse", "Semaphore", "Dựng Trại", "Cứu Thương", "La Bàn", "Trò Chơi", "Khác"] },
          { type: "richtext", id: "content", label: "Nội dung", placeholder: "Hướng dẫn chi tiết...", value: item.content, height: "300px" },
          { type: "media", id: "images", label: "Hình ảnh minh họa", placeholder: "Dán link ảnh (mỗi dòng 1 URL)...", value: (item.images || []).join("\n"), icon: "image" },
          { type: "media", id: "videos", label: "Video hướng dẫn", placeholder: "Dán link YouTube (mỗi dòng 1 URL)...", value: (item.videos || []).join("\n"), icon: "video" },
        );
        break;
    }
    return fields;
  }

  // ===== FORM: Render =====
  function renderFormField(field) {
    if (field.type === "row") {
      return `<div class="adm-form-row">${field.children.map(renderFormField).join("")}</div>`;
    }
    if (field.type === "tags") {
      const chips = (field.value || []).map(t => `<span class="adm-chip adm-chip--removable" data-tag="${escAttr(t)}">${esc(t)}<button class="adm-chip__remove">&times;</button></span>`).join("");
      return `
        <div class="adm-field adm-field--tags" id="field-${field.id}">
          <label><span class="adm-field__icon">${ICONS.tag}</span>${field.label}</label>
          <div class="adm-tag-input">
            <div class="adm-tag-chips" id="chips-${field.id}">${chips}</div>
            <input type="text" class="adm-tag-input__field" id="form-${field.id}-input" placeholder="Gõ tag rồi bấm Enter..." />
          </div>
          ${field.hint ? `<small>${field.hint}</small>` : ""}
        </div>`;
    }
    if (field.type === "media") {
      const previewId = `preview-${field.id}`;
      return `
        <div class="adm-field adm-field--media">
          <label><span class="adm-field__icon">${ICONS[field.icon] || ""}</span>${field.label}</label>
          <textarea class="adm-input adm-media-textarea" id="form-${field.id}" rows="3" placeholder="${escAttr(field.placeholder)}">${esc(field.value || "")}</textarea>
          ${field.hint ? `<small>${field.hint}</small>` : ""}
          <div class="adm-media-preview" id="${previewId}"></div>
        </div>`;
    }
    if (field.type === "select") {
      const labels = field.optionLabels || {};
      const opts = (field.options || []).map(o => {
        const displayText = labels[o] || o;
        return `<option value="${escAttr(o)}" ${field.value === o ? "selected" : ""}>${esc(displayText)}</option>`;
      }).join("");
      return `
        <div class="adm-field">
          <label>${field.label}</label>
          <select class="adm-input" id="form-${field.id}">${opts}</select>
        </div>`;
    }
    if (field.type === "file_upload") {
      const existingInfo = field.existingFile
        ? `<div class="adm-file-existing" style="margin-top:8px; padding:8px 12px; background:rgba(138,176,151,0.08); border-radius:8px; font-size:0.8rem; color:rgba(255,255,255,0.7);">
             📎 File hiện tại: <strong>${esc(field.existingFile.split('/').pop())}</strong>
             <input type="hidden" id="form-${field.id}-existing" value="${escAttr(field.existingFile)}" />
           </div>`
        : `<input type="hidden" id="form-${field.id}-existing" value="" />`;
      return `
        <div class="adm-field adm-field--file-upload" id="field-${field.id}">
          <label>${field.label}</label>
          <div class="adm-file-dropzone" id="dropzone-${field.id}" style="border:2px dashed rgba(138,176,151,0.2); border-radius:12px; padding:1.5rem; text-align:center; cursor:pointer; transition:all 0.3s; background:rgba(138,176,151,0.03);">
            <div style="font-size:2rem; margin-bottom:0.5rem;">📂</div>
            <div style="font-size:0.85rem; color:rgba(255,255,255,0.6);">Kéo thả file vào đây hoặc <span style="color:var(--brand-primary); font-weight:600;">nhấp để chọn</span></div>
            <div id="file-info-${field.id}" style="margin-top:8px; font-size:0.8rem; color:var(--brand-primary); display:none;"></div>
            <input type="file" id="form-${field.id}" accept="${field.accept || ''}" style="display:none;" />
          </div>
          ${existingInfo}
          ${field.hint ? `<small>${field.hint}</small>` : ""}
        </div>`;
    }
    if (field.type === "richtext") {
      return `
        <div class="adm-field">
          <label>${field.label}</label>
          <div class="adm-richtext-wrapper" style="background: rgba(26, 43, 34, 0.4); border-radius: 0.5rem; border: 1px solid rgba(138, 176, 151, 0.2);">
            <div id="form-${field.id}" style="height: ${field.height || '200px'}; color: var(--text-light); font-size: 1rem;">${field.value || ""}</div>
          </div>
        </div>`;
    }
    if (field.type === "textarea") {
      return `
        <div class="adm-field">
          <label>${field.label}</label>
          <textarea class="adm-input" id="form-${field.id}" rows="${field.rows || 4}" placeholder="${escAttr(field.placeholder || "")}">${esc(field.value || "")}</textarea>
        </div>`;
    }
    // Default: text
    return `
      <div class="adm-field">
        <label>${field.label}${field.required ? ' <span class="adm-required">*</span>' : ""}</label>
        <input type="text" class="adm-input" id="form-${field.id}" value="${escAttr(field.value || "")}" placeholder="${escAttr(field.placeholder || "")}" ${field.required ? "required" : ""} />
        ${field.hint ? `<small>${field.hint}</small>` : ""}
      </div>`;
  }

  // Global variable to store quill instances
  let quillInstances = {};

  // ===== FORM: Open =====
  async function openForm(module, index) {
    const overlay = document.getElementById("adm-form-overlay");
    const isEdit = index >= 0;
    const items = moduleData[module] || [];
    const item = isEdit ? { ...items[index] } : {};
    const mod = MODULES[module];

    const fields = getFormFields(module, item, isEdit);

    if (fields.some(f => f.type === "richtext")) {
      loadStyle("https://cdn.quilljs.com/1.3.6/quill.snow.css");
      await loadScript("https://cdn.quilljs.com/1.3.6/quill.min.js");
    }

    const fieldsHTML = fields.map(renderFormField).join("");

    overlay.innerHTML = `
      <div class="adm-form-panel">
        <div class="adm-form-panel__header">
          <h3>${isEdit ? "✏️ Chỉnh sửa" : "➕ " + mod.createLabel}</h3>
          <button class="adm-btn-icon" id="adm-form-close">${ICONS.close}</button>
        </div>
        <div class="adm-form-panel__body">
          ${fieldsHTML}
        </div>
        <div class="adm-form-panel__footer">
          <button class="adm-btn adm-btn--ghost" id="adm-form-cancel">Hủy</button>
          <button class="adm-btn adm-btn--primary" id="adm-form-save">
            ${ICONS.check}<span>${isEdit ? "Cập nhật" : "Đăng bài"}</span>
          </button>
        </div>
      </div>`;

    overlay.classList.add("visible");

    // Close events
    document.getElementById("adm-form-close").addEventListener("click", () => overlay.classList.remove("visible"));
    document.getElementById("adm-form-cancel").addEventListener("click", () => overlay.classList.remove("visible"));
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.classList.remove("visible"); });

    // Save
    document.getElementById("adm-form-save").addEventListener("click", () => saveForm(module, index));

    // Init tag chips
    initTagChips(module);

    // Init media preview
    initMediaPreview(module);

    // Init file upload dropzones
    document.querySelectorAll('.adm-field--file-upload').forEach(fieldEl => {
      const input = fieldEl.querySelector('input[type="file"]');
      const dropzone = fieldEl.querySelector('.adm-file-dropzone');
      const fileInfoId = 'file-info-' + input.id.replace('form-', '');
      const fileInfo = document.getElementById(fileInfoId);
      if (!input || !dropzone) return;

      dropzone.addEventListener('click', () => input.click());
      dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.style.borderColor = 'var(--brand-primary)'; dropzone.style.background = 'rgba(138,176,151,0.08)'; });
      dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = 'rgba(138,176,151,0.2)'; dropzone.style.background = 'rgba(138,176,151,0.03)'; });
      dropzone.addEventListener('drop', e => {
        e.preventDefault();
        dropzone.style.borderColor = 'rgba(138,176,151,0.2)';
        dropzone.style.background = 'rgba(138,176,151,0.03)';
        if (e.dataTransfer.files.length) {
          input.files = e.dataTransfer.files;
          input.dispatchEvent(new Event('change'));
        }
      });
      input.addEventListener('change', () => {
        if (input.files.length && fileInfo) {
          const f = input.files[0];
          const sizeMB = (f.size / 1024 / 1024).toFixed(2);
          fileInfo.innerHTML = `✅ ${esc(f.name)} (${sizeMB} MB)`;
          fileInfo.style.display = 'block';
        }
      });
    });

    // === TAILIEU MODULE: Dynamic Ngành/Bậc + AttachmentType toggle ===
    if (module === 'tailieu') {
      const NGANH_BAC_MAP = {
        'Ngành Oanh': ['Mở Mắt', 'Cánh Mềm', 'Chân Cứng', 'Tung Bay'],
        'Ngành Thiếu': ['Hướng Thiện', 'Sơ Thiện', 'Trung Thiện', 'Chánh Thiện'],
        'Ngành Thanh': ['Hòa', 'Minh', 'Kiến', 'Trực'],
        'Huynh Trưởng': ['Kiên', 'Trì', 'Định', 'Lực'],
      };

      const nganhSelect = document.getElementById('form-nganh');
      const bacSelect = document.getElementById('form-bac');
      const attachTypeSelect = document.getElementById('form-attachmentType');
      const urlField = document.getElementById('form-url')?.closest('.adm-field');
      const fileUploadField = document.getElementById('field-fileUpload');

      // Populate Bậc based on Ngành
      function updateBacOptions() {
        const nganh = nganhSelect.value;
        const bacs = NGANH_BAC_MAP[nganh] || [];
        const currentBac = bacSelect.value;
        bacSelect.innerHTML = '<option value="">— Không chọn —</option>' +
          bacs.map(b => `<option value="${escAttr(b)}" ${currentBac === b ? 'selected' : ''}>${esc(b)}</option>`).join('');
        bacSelect.closest('.adm-field').style.display = bacs.length ? '' : 'none';
      }

      // Toggle URL vs Upload
      function updateAttachmentFields() {
        const isUpload = attachTypeSelect.value === 'upload';
        if (urlField) urlField.style.display = isUpload ? 'none' : '';
        if (fileUploadField) fileUploadField.style.display = isUpload ? '' : 'none';
      }

      nganhSelect.addEventListener('change', updateBacOptions);
      attachTypeSelect.addEventListener('change', updateAttachmentFields);

      // Init on load
      updateBacOptions();
      // If editing, restore the bac value
      if (isEdit && item.bac) {
        bacSelect.value = item.bac;
      }
      updateAttachmentFields();
    }

    // Init Quill instances
    quillInstances = {};
    fields.forEach(f => {
      if (f.type === "richtext" && window.Quill) {
        quillInstances[f.id] = new Quill(`#form-${f.id}`, {
          theme: 'snow',
          placeholder: f.placeholder || "Viết nội dung...",
          modules: {
            toolbar: [
              ['bold', 'italic', 'underline', 'strike'],
              [{ 'header': [2, 3, 4, false] }],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              ['link', 'blockquote', 'code-block'],
              [{ 'align': [] }],
              ['clean']
            ]
          }
        });
      }
    });
  }

  // ===== TAG CHIPS =====
  function initTagChips(module) {
    const fields = getFormFields(module, {}, false);
    fields.filter(f => f.type === "tags").forEach(field => {
      const input = document.getElementById(`form-${field.id}-input`);
      const chipsContainer = document.getElementById(`chips-${field.id}`);
      if (!input || !chipsContainer) return;

      input.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === ",") {
          e.preventDefault();
          const tag = input.value.trim();
          if (!tag) return;
          // Check duplicate
          if (chipsContainer.querySelector(`[data-tag="${tag}"]`)) { input.value = ""; return; }
          const chip = document.createElement("span");
          chip.className = "adm-chip adm-chip--removable";
          chip.dataset.tag = tag;
          chip.innerHTML = `${esc(tag)}<button class="adm-chip__remove">&times;</button>`;
          chip.querySelector(".adm-chip__remove").addEventListener("click", () => chip.remove());
          chipsContainer.appendChild(chip);
          input.value = "";
        }
      });

      // Remove existing chip buttons
      chipsContainer.querySelectorAll(".adm-chip__remove").forEach(btn => {
        btn.addEventListener("click", () => btn.parentElement.remove());
      });
    });
  }

  // ===== MEDIA PREVIEW =====
  function initMediaPreview(module) {
    document.querySelectorAll(".adm-media-textarea").forEach(textarea => {
      const previewEl = textarea.closest(".adm-field--media").querySelector(".adm-media-preview");
      if (!previewEl) return;

      const updatePreview = () => {
        const urls = textarea.value.split("\n").map(s => s.trim()).filter(Boolean);
        previewEl.innerHTML = urls.slice(0, 6).map(url => {
          const ytThumb = getYouTubeThumb(url);
          const src = ytThumb || url;
          return `<div class="adm-media-preview__item">
            <img src="${escAttr(src)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<span class=\\'adm-media-preview__broken\\'>❌</span>'" />
            ${ytThumb ? '<span class="adm-media-preview__play">▶</span>' : ""}
          </div>`;
        }).join("") + (urls.length > 6 ? `<div class="adm-media-preview__more">+${urls.length - 6}</div>` : "");
      };

      textarea.addEventListener("input", updatePreview);
      updatePreview(); // Initial render
    });
  }

  // ===== FORM: Save =====
  async function saveForm(module, index) {
    const items = Array.isArray(moduleData[module]) ? [...moduleData[module]] : [];
    let item = {};

    switch (module) {
      case "sinhhoat":
        item = {
          id: index >= 0 ? items[index].id : "post-" + Date.now(),
          title: document.getElementById("form-title").value,
          year: document.getElementById("form-year").value,
          date: document.getElementById("form-date").value,
          content: quillInstances["content"] ? quillInstances["content"].root.innerHTML : document.getElementById("form-content").value,
          videos: document.getElementById("form-videos").value.split("\n").map(s => s.trim()).filter(Boolean),
          images: document.getElementById("form-images").value.split("\n").map(s => s.trim()).filter(Boolean),
          tags: Array.from(document.querySelectorAll("#chips-tags .adm-chip")).map(c => c.dataset.tag),
        };
        if (item.content === "<p><br></p>") item.content = "";
        break;
      case "nhac":
        item = {
          id: index >= 0 ? items[index].id : items.length + 1,
          title: document.getElementById("form-title").value,
          artist: document.getElementById("form-artist").value,
          src: document.getElementById("form-src").value,
          duration: document.getElementById("form-duration").value,
        };
        break;
      case "tailieu": {
        const attachType = document.getElementById("form-attachmentType").value;
        let fileUrl = '';
        let fileType = 'link';

        if (attachType === 'upload') {
          // Check if a new file was uploaded
          const uploadInput = document.getElementById('form-fileUpload');
          const existingUrl = document.getElementById('form-fileUpload-existing');
          
          if (uploadInput && uploadInput.files && uploadInput.files.length > 0) {
            // Upload file to server
            const formData = new FormData();
            formData.append('file', uploadInput.files[0]);
            
            try {
              showToast('Đang tải file lên...');
              const uploadRes = await fetch(`${API_URL}?module=tailieu&action=upload`, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
              });
              const uploadData = await uploadRes.json();
              if (uploadRes.ok && uploadData.success) {
                fileUrl = uploadData.url;
                fileType = uploadData.fileType || 'pdf';
              } else {
                showToast(uploadData.error || 'Upload thất bại', true);
                return;
              }
            } catch (e) {
              showToast('Lỗi kết nối khi upload file', true);
              return;
            }
          } else if (existingUrl && existingUrl.value) {
            // Keep existing uploaded file
            fileUrl = existingUrl.value;
            const ext = fileUrl.split('.').pop().toLowerCase();
            fileType = ['pdf','doc','docx','xls','xlsx'].includes(ext) ? ext : 'pdf';
          }
        } else {
          fileUrl = document.getElementById("form-url").value;
          // Auto-detect file type from URL
          const urlLower = fileUrl.toLowerCase();
          if (urlLower.endsWith('.pdf')) fileType = 'pdf';
          else if (urlLower.endsWith('.doc') || urlLower.endsWith('.docx')) fileType = 'doc';
          else if (urlLower.endsWith('.xls') || urlLower.endsWith('.xlsx')) fileType = 'xlsx';
          else fileType = 'link';
        }

        item = {
          id: index >= 0 ? items[index].id : "tl-" + Date.now(),
          title: document.getElementById("form-title").value,
          description: document.getElementById("form-description").value,
          nganh: document.getElementById("form-nganh").value,
          bac: document.getElementById("form-bac").value,
          access: document.getElementById("form-access").value,
          attachmentType: attachType,
          url: fileUrl,
          fileType: fileType,
          date: new Date().getFullYear().toString(),
        };
        break;
      }
      case "kynang":
        item = {
          id: index >= 0 ? items[index].id : "kn-" + Date.now(),
          title: document.getElementById("form-title").value,
          category: document.getElementById("form-category").value,
          content: quillInstances["content"] ? quillInstances["content"].root.innerHTML : document.getElementById("form-content").value,
          videos: document.getElementById("form-videos").value.split("\n").map(s => s.trim()).filter(Boolean),
          images: document.getElementById("form-images").value.split("\n").map(s => s.trim()).filter(Boolean),
          date: new Date().getFullYear().toString(),
        };
        if (item.content === "<p><br></p>") item.content = "";
        break;
    }

    if (!item.title) { showToast("Vui lòng nhập tiêu đề", true); return; }

    if (index >= 0) items[index] = item; else items.unshift(item);
    if (module === "nhac") {
      items.sort((a, b) => a.title.localeCompare(b.title, "vi", { sensitivity: "accent" }));
    }
    moduleData[module] = items;

    const result = await DataService.save(module, items);
    document.getElementById("adm-form-overlay").classList.remove("visible");
    renderModule(module, items);

    if (result.method === "local") showToast("Đã lưu tạm! Xuất JSON để cập nhật server.");
    else showToast("Đã lưu thành công! ✓");
  }

  // ===== DELETE ITEM =====
  async function deleteItem(module, index) {
    const items = [...(moduleData[module] || [])];
    const title = items[index]?.title || items[index]?.name || "mục này";
    const confirmed = await showConfirm("Xác nhận xóa", `Bạn có chắc muốn xóa "${title}"? Hành động này không thể hoàn tác.`);
    if (!confirmed) return;

    items.splice(index, 1);
    moduleData[module] = items;
    await DataService.save(module, items);
    renderModule(module, items);
    showToast("Đã xóa thành công!");
  }

  // ===== EXPORT =====
  async function exportAllData() {
    const allData = {};
    for (const mod of Object.keys(MODULES)) {
      allData[mod] = moduleData[mod] || await DataService.fetch(mod);
    }
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gdpt-hoatho-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Đã xuất dữ liệu!");
  }

  // ===== IMPORT =====
  async function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const allData = JSON.parse(text);
      for (const [mod, data] of Object.entries(allData)) {
        if (MODULES[mod]) {
          let sortedData = data;
          if (mod === "nhac" && Array.isArray(sortedData)) {
            sortedData.sort((a, b) => a.title.localeCompare(b.title, "vi", { sensitivity: "accent" }));
          }
          moduleData[mod] = sortedData;
          await DataService.save(mod, sortedData);
        }
      }
      showToast("Đã nhập dữ liệu thành công!");
      await switchModule(currentModule);
    } catch (err) { showToast("Lỗi đọc file: " + err.message, true); }
    e.target.value = "";
  }

  // ===== OPEN / CLOSE =====
  async function openAdmin() {
    buildAdminHTML();

    // Check session via auth API
    try {
      const res = await fetch(`${AUTH_URL}?action=me`, { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          currentUser = data.user;
          isLoggedIn = true;

          if (currentUser.role === 'admin') {
            // Admin: Open Dashboard Panel
            const root = document.getElementById('adm-root');
            root.classList.add('visible');
            document.body.style.overflow = 'hidden';
            
            document.getElementById('adm-login').style.display = 'none';
            document.getElementById('adm-dashboard').style.display = 'flex';
            
            // Legacy compat: store hash in session for DataService
            const config = await DataService.fetch('config');
            if (config && config.adminPasswordHash) {
              adminHash = config.adminPasswordHash;
              sessionStorage.setItem('gdpt_admin', adminHash);
            }
            
            buildSidebar();
            updateUserInfoUI();
            applyRoleRestrictions();
            
            await switchModule(currentModule || 'sinhhoat');
          } else {
            // Member: Prohibited from entering Admin Panel
            showToast("Tài khoản thành viên không thể truy cập trang quản trị", true);
            closeAdmin();
          }
          
          // Sync header avatar
          renderHeaderUser(currentUser);
          return;
        }
      }
    } catch (e) {
      console.warn('Auth check failed:', e);
    }

    // Not authenticated — show inline login modal
    const root = document.getElementById('adm-root');
    root.classList.add('visible');
    document.body.style.overflow = 'hidden';
    
    document.getElementById('adm-dashboard').style.display = 'none';
    document.getElementById('adm-login').style.display = 'flex';
    document.getElementById('adm-login-err').textContent = '';
    setTimeout(() => document.getElementById('adm-username')?.focus(), 300);
  }

  function closeAdmin() {
    const root = document.getElementById("adm-root");
    if (root) {
      root.classList.remove("visible");
      document.body.style.overflow = "";
    }
  }

  // ===== HEADER AUTH & USER MENUS =====
  async function initHeaderAuth() {
    try {
      const res = await fetch(`${AUTH_URL}?action=me`, { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          currentUser = data.user;
          isLoggedIn = true;
          
          // Legacy compat: store hash in session for DataService
          const config = await DataService.fetch('config');
          if (config && config.adminPasswordHash && currentUser.role === 'admin') {
            adminHash = config.adminPasswordHash;
            sessionStorage.setItem('gdpt_admin', adminHash);
          }
          
          renderHeaderUser(currentUser);
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to check header session", e);
    }
    
    renderHeaderGuest();
  }

  function renderHeaderGuest() {
    // Remove avatar if exists
    const existingAvatar = document.getElementById("header-user-menu");
    if (existingAvatar) existingAvatar.remove();

    // Desktop Menu Login Button
    const deskNavDiv = document.querySelector("#desktop-nav > div");
    if (deskNavDiv && !document.getElementById("nav-login-btn")) {
      const loginLink = document.createElement("a");
      loginLink.href = "#";
      loginLink.id = "nav-login-btn";
      loginLink.className = "nav-link";
      loginLink.textContent = "Đăng nhập";
      loginLink.addEventListener("click", e => {
        e.preventDefault();
        openAdmin();
      });
      deskNavDiv.appendChild(loginLink);
    }

    // Mobile Menu Login Button
    const mobMenu = document.getElementById("mobile-menu");
    if (mobMenu && !document.getElementById("nav-login-btn-mob")) {
      const loginLinkMob = document.createElement("a");
      loginLinkMob.href = "#";
      loginLinkMob.id = "nav-login-btn-mob";
      loginLinkMob.className = "nav-link-mobile";
      loginLinkMob.textContent = "Đăng nhập";
      loginLinkMob.addEventListener("click", e => {
        e.preventDefault();
        mobMenu.classList.add("hidden");
        openAdmin();
      });
      mobMenu.appendChild(loginLinkMob);
    }
  }

  function renderHeaderUser(user) {
    // Remove login buttons if they exist
    const deskBtn = document.getElementById("nav-login-btn");
    if (deskBtn) deskBtn.remove();
    const mobBtn = document.getElementById("nav-login-btn-mob");
    if (mobBtn) mobBtn.remove();

    // Check if avatar already exists
    let userWrap = document.getElementById("header-user-menu");
    if (!userWrap) {
      const headerContainer = document.querySelector("#main-header .container > div");
      if (!headerContainer) return;

      userWrap = document.createElement("div");
      userWrap.id = "header-user-menu";
      userWrap.className = "header-user-wrap";

      const mobBtnEl = document.getElementById("mobile-menu-button");
      if (mobBtnEl) {
        headerContainer.insertBefore(userWrap, mobBtnEl);
      } else {
        headerContainer.appendChild(userWrap);
      }
    }

    // Render User Avatar and Dropdown Menu
    const initial = user.displayName ? user.displayName.charAt(0).toUpperCase() : "?";
    const avatarContent = user.avatarUrl
      ? `<img src="${user.avatarUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;" />`
      : initial;
    userWrap.innerHTML = `
      <div class="header-avatar" id="header-avatar-btn">${avatarContent}</div>
      <div class="header-dropdown" id="header-dropdown-menu">
        <div class="header-dropdown__user">
          <div class="header-dropdown__name">${esc(user.fullName || user.displayName)}</div>
          <div class="header-dropdown__meta">
            @${esc(user.username)}
            <span class="adm-role-badge adm-role-badge--${user.role}">${user.role === 'admin' ? 'Admin' : 'Member'}</span>
          </div>
        </div>
        <button class="header-dropdown__item" id="hdr-btn-profile">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span>Thông tin cá nhân</span>
        </button>
        <button class="header-dropdown__item" id="hdr-btn-password">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <span>Đổi mật khẩu</span>
        </button>
        ${user.role === 'admin' ? `
        <button class="header-dropdown__item" id="hdr-btn-admin">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          <span>Trang quản trị</span>
        </button>
        ` : ''}
        <div class="header-dropdown__divider"></div>
        <button class="header-dropdown__item header-dropdown__item--logout" id="hdr-btn-logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          <span>Đăng xuất</span>
        </button>
      </div>
    `;

    // Dropdown toggling logic
    const avatarBtn = userWrap.querySelector("#header-avatar-btn");
    const dropdownMenu = userWrap.querySelector("#header-dropdown-menu");
    
    avatarBtn.addEventListener("click", e => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("visible");
    });

    document.addEventListener("click", () => {
      dropdownMenu.classList.remove("visible");
    });

    dropdownMenu.addEventListener("click", e => e.stopPropagation());

    // Action listeners
    userWrap.querySelector("#hdr-btn-profile").addEventListener("click", () => {
      dropdownMenu.classList.remove("visible");
      openProfileModal();
    });
    userWrap.querySelector("#hdr-btn-password").addEventListener("click", () => {
      dropdownMenu.classList.remove("visible");
      openChangePasswordModal();
    });
    if (user.role === 'admin') {
      userWrap.querySelector("#hdr-btn-admin").addEventListener("click", () => {
        dropdownMenu.classList.remove("visible");
        openAdmin();
      });
    }
    userWrap.querySelector("#hdr-btn-logout").addEventListener("click", () => {
      dropdownMenu.classList.remove("visible");
      handleLogout();
    });
  }

  // ===== PROFILE MODAL =====
  function openProfileModal() {
    if (!currentUser) return;
    
    let overlay = document.getElementById("profile-modal-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "profile-modal-overlay";
      overlay.className = "auth-modal-overlay";
      document.body.appendChild(overlay);
    }

    const initial = (currentUser.displayName || "?").charAt(0).toUpperCase();
    const avatarHtml = currentUser.avatarUrl
      ? `<img src="${currentUser.avatarUrl}" style="width:100%; height:100%; object-fit:cover;" />`
      : initial;

    const initialPosition = currentUser.position || 'Đoàn sinh';
    const initialNganh = currentUser.nganh || '';
    const initialStudyLevel = currentUser.studyLevel || '';
    const initialRank = currentUser.rank || '';

    let state = {
      position: initialPosition,
      nganh: initialNganh,
      studyLevel: initialStudyLevel,
      rank: initialRank
    };

    overlay.innerHTML = `
      <div class="auth-modal" style="width: min(600px, 94vw); max-height:90vh; overflow-y:auto;">
        <button class="adm-btn-icon auth-modal__close" id="profile-modal-close">${ICONS.close}</button>
        <h3>Thông Tin Cá Nhân</h3>
        <p class="auth-modal__desc">Xem và cập nhật thông tin thành viên của bạn</p>
        
        <div style="display:flex; flex-direction:column; align-items:center; margin-bottom:20px;">
          <div class="profile-avatar-container" style="position:relative; width:80px; height:80px; cursor:pointer;" id="profile-avatar-btn">
            <div class="profile-avatar-display" style="width:100%; height:100%; border-radius:50%; background:linear-gradient(135deg, #b8860b 0%, #d4a843 100%); color:#fff; font-weight:700; font-size:2rem; display:flex; align-items:center; justify-content:center; overflow:hidden;">
              ${avatarHtml}
            </div>
            <div class="profile-avatar-overlay" style="position:absolute; inset:0; border-radius:50%; background:rgba(0,0,0,0.5); color:#fff; display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.2s; font-size:0.75rem;">
              Thay đổi
            </div>
          </div>
          <input type="file" id="profile-avatar-input" accept="image/*" style="display:none;" />
          <span style="font-size:0.72rem; color:rgba(255,255,255,0.4); margin-top:8px;">Nhấp để thay ảnh đại diện (Tối đa 2MB)</span>
        </div>

        <div class="auth-modal__grid" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="adm-field">
            <label>Tên đăng nhập / Số điện thoại</label>
            <input type="text" class="adm-input" value="${escAttr(currentUser.username)}" disabled />
          </div>
          <div class="adm-field">
            <label>Pháp danh</label>
            <input type="text" class="adm-input" id="prof-dharmaName" value="${escAttr(currentUser.dharmaName || '')}" placeholder="Ví dụ: Chúc Vương" />
          </div>
          <div class="adm-field">
            <label>Họ và tên *</label>
            <input type="text" class="adm-input" id="prof-fullName" value="${escAttr(currentUser.fullName || '')}" required />
          </div>
          <div class="adm-field">
            <label>Ngày sinh</label>
            <input type="text" class="adm-input" id="prof-dob" value="${escAttr(currentUser.dob || '')}" placeholder="DD/MM/YYYY" />
          </div>
          <div class="adm-field">
            <label>Chức vụ</label>
            <select class="adm-input" id="prof-position" style="background:#1e3222; color:#fff;">
              <option value="Đoàn sinh" ${initialPosition === 'Đoàn sinh' ? 'selected' : ''}>Đoàn sinh</option>
              <option value="Huynh trưởng" ${initialPosition === 'Huynh trưởng' ? 'selected' : ''}>Huynh trưởng</option>
            </select>
          </div>
          <div class="adm-field" id="prof-nganh-group" style="${initialPosition === 'Huynh trưởng' ? 'display:none;' : ''}">
            <label>Ngành</label>
            ${renderNganhSelect('prof-nganh', initialNganh)}
          </div>

          <!-- Badge section container -->
          <div id="prof-badge-container" style="grid-column: span 2;"></div>
        </div>

        <div class="auth-modal__error" id="prof-error" style="color:#ff6b6b; font-size:0.85rem; margin-top:12px; display:none;"></div>

        <div class="auth-modal__footer">
          <button class="adm-btn" id="prof-btn-cancel">Hủy</button>
          <button class="adm-btn adm-btn--primary" id="prof-btn-save">Lưu thay đổi</button>
        </div>
      </div>
    `;

    overlay.classList.add("visible");
    document.body.style.overflow = "hidden";

    const closeProfile = () => {
      overlay.classList.remove("visible");
      document.body.style.overflow = "";
    };
    overlay.querySelector("#profile-modal-close").addEventListener("click", closeProfile);
    overlay.querySelector("#prof-btn-cancel").addEventListener("click", closeProfile);

    const posSelect = overlay.querySelector("#prof-position");
    const nganhGroup = overlay.querySelector("#prof-nganh-group");
    const nganhSelect = overlay.querySelector("#prof-nganh");
    const badgeContainer = overlay.querySelector("#prof-badge-container");

    function updateModalBadges() {
      const currentPos = posSelect.value;
      if (currentPos === 'Huynh trưởng') {
        nganhGroup.style.display = 'none';
        state.nganh = '';
        badgeContainer.innerHTML = renderBadgeSections('Huynh trưởng', '', state.studyLevel, state.rank);
      } else {
        nganhGroup.style.display = 'block';
        state.nganh = nganhSelect.value;
        badgeContainer.innerHTML = renderBadgeSections('Đoàn sinh', state.nganh, state.studyLevel, state.rank);
      }
    }

    updateModalBadges();

    posSelect.addEventListener("change", () => {
      state.position = posSelect.value;
      state.studyLevel = '';
      state.rank = '';
      updateModalBadges();
    });

    nganhSelect.addEventListener("change", () => {
      state.nganh = nganhSelect.value;
      state.studyLevel = '';
      state.rank = '';
      updateModalBadges();
    });

    // Event delegation on badgeContainer
    badgeContainer.addEventListener("click", (e) => {
      const studyItem = e.target.closest("[data-badge-study-level]");
      if (studyItem) {
        const val = studyItem.dataset.badgeStudyLevel;
        const isAlreadyActive = studyItem.classList.contains("active");
        badgeContainer.querySelectorAll("[data-badge-study-level]").forEach(el => el.classList.remove("active"));
        if (!isAlreadyActive) {
          studyItem.classList.add("active");
          state.studyLevel = val;
        } else {
          state.studyLevel = "";
        }
        return;
      }

      const rankItem = e.target.closest("[data-badge-rank]");
      if (rankItem) {
        const val = rankItem.dataset.badgeRank;
        const isAlreadyActive = rankItem.classList.contains("active");
        badgeContainer.querySelectorAll("[data-badge-rank]").forEach(el => el.classList.remove("active"));
        if (!isAlreadyActive) {
          rankItem.classList.add("active");
          state.rank = val;
        } else {
          state.rank = "";
        }
        return;
      }
    });

    // Avatar upload handlers
    const profAvatarBtn = overlay.querySelector("#profile-avatar-btn");
    const profAvatarInput = overlay.querySelector("#profile-avatar-input");
    const profAvatarDisplay = overlay.querySelector(".profile-avatar-display");

    profAvatarBtn.addEventListener("click", () => profAvatarInput.click());

    profAvatarInput.addEventListener("change", async () => {
      const file = profAvatarInput.files[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        showToast("Kích thước ảnh tối đa là 2MB", true);
        return;
      }

      const formData = new FormData();
      formData.append("avatar", file);

      profAvatarDisplay.innerHTML = `<div style="font-size:0.8rem;color:#fff;">...</div>`;

      try {
        const res = await fetch(`${AUTH_URL}?action=upload-avatar`, {
          method: "POST",
          body: formData,
          credentials: "same-origin"
        });
        const data = await res.json();
        if (res.ok && data.success) {
          currentUser.avatarUrl = data.avatarUrl;
          profAvatarDisplay.innerHTML = `<img src="${data.avatarUrl}" style="width:100%; height:100%; object-fit:cover;" />`;
          
          renderHeaderUser(currentUser);
          updateUserInfoUI();
          showToast("Cập nhật ảnh đại diện thành công!");
        } else {
          showToast(data.error || "Tải ảnh lên thất bại", true);
          const initialStr = (currentUser.displayName || "?").charAt(0).toUpperCase();
          profAvatarDisplay.innerHTML = currentUser.avatarUrl
            ? `<img src="${currentUser.avatarUrl}" style="width:100%; height:100%; object-fit:cover;" />`
            : initialStr;
        }
      } catch (err) {
        showToast("Lỗi kết nối máy chủ", true);
        const initialStr = (currentUser.displayName || "?").charAt(0).toUpperCase();
        profAvatarDisplay.innerHTML = currentUser.avatarUrl
          ? `<img src="${currentUser.avatarUrl}" style="width:100%; height:100%; object-fit:cover;" />`
          : initialStr;
      }
    });

    // Save profile handler
    overlay.querySelector("#prof-btn-save").addEventListener("click", async () => {
      const fullName = overlay.querySelector("#prof-fullName").value.trim();
      const dob = overlay.querySelector("#prof-dob").value.trim();
      const dharmaName = overlay.querySelector("#prof-dharmaName").value.trim();
      const position = posSelect.value;
      const nganh = state.nganh;
      const rank = state.rank;
      const studyLevel = state.studyLevel;
      const errEl = overlay.querySelector("#prof-error");

      if (!fullName) {
        errEl.textContent = "Họ và tên không được để trống";
        errEl.style.display = "block";
        return;
      }

      try {
        const res = await fetch(`${AUTH_URL}?action=update-profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ fullName, dob, dharmaName, position, rank, studyLevel, nganh }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          currentUser.fullName = fullName;
          currentUser.dob = dob;
          currentUser.dharmaName = dharmaName;
          currentUser.displayName = dharmaName || fullName;
          currentUser.position = position;
          currentUser.rank = rank;
          currentUser.studyLevel = studyLevel;
          currentUser.nganh = nganh;
          
          renderHeaderUser(currentUser);
          closeProfile();
          showToast("Cập nhật thông tin thành công");
        } else {
          errEl.textContent = data.error || "Cập nhật thất bại";
          errEl.style.display = "block";
        }
      } catch (e) {
        errEl.textContent = "Không thể kết nối đến máy chủ";
        errEl.style.display = "block";
      }
    });
  }

  // ===== CHANGE PASSWORD MODAL =====
  function openChangePasswordModal() {
    if (!currentUser) return;

    let overlay = document.getElementById("password-modal-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "password-modal-overlay";
      overlay.className = "auth-modal-overlay";
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="auth-modal">
        <button class="adm-btn-icon auth-modal__close" id="password-modal-close">${ICONS.close}</button>
        <h3>Đổi Mật Khẩu</h3>
        <p class="auth-modal__desc">Nhập mật khẩu mới của bạn (tối thiểu 6 ký tự)</p>
        
        <div class="auth-modal__grid">
          <div class="adm-field">
            <label>Mật khẩu mới</label>
            <input type="password" class="adm-input" id="pw-new" placeholder="Nhập mật khẩu mới..." required />
          </div>
          <div class="adm-field">
            <label>Xác nhận mật khẩu mới</label>
            <input type="password" class="adm-input" id="pw-confirm" placeholder="Nhập lại mật khẩu..." required />
          </div>
        </div>

        <div class="auth-modal__error" id="pw-error" style="color:#ff6b6b; font-size:0.85rem; margin-top:12px; display:none;"></div>

        <div class="auth-modal__footer">
          <button class="adm-btn" id="pw-btn-cancel">Hủy</button>
          <button class="adm-btn adm-btn--primary" id="pw-btn-save">Cập nhật mật khẩu</button>
        </div>
      </div>
    `;

    overlay.classList.add("visible");
    document.body.style.overflow = "hidden";

    const closePw = () => {
      overlay.classList.remove("visible");
      document.body.style.overflow = "";
    };
    overlay.querySelector("#password-modal-close").addEventListener("click", closePw);
    overlay.querySelector("#pw-btn-cancel").addEventListener("click", closePw);

    overlay.querySelector("#pw-btn-save").addEventListener("click", async () => {
      const newPassword = overlay.querySelector("#pw-new").value;
      const confirmPassword = overlay.querySelector("#pw-confirm").value;
      const errEl = overlay.querySelector("#pw-error");

      if (newPassword.length < 6) {
        errEl.textContent = "Mật khẩu phải từ 6 ký tự trở lên";
        errEl.style.display = "block";
        return;
      }
      if (newPassword !== confirmPassword) {
        errEl.textContent = "Mật khẩu xác nhận không khớp";
        errEl.style.display = "block";
        return;
      }

      try {
        const res = await fetch(`${AUTH_URL}?action=change-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ newPassword }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          closePw();
          showToast("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
          handleLogout();
        } else {
          errEl.textContent = data.error || "Đổi mật khẩu thất bại";
          errEl.style.display = "block";
        }
      } catch (e) {
        errEl.textContent = "Không thể kết nối đến máy chủ";
        errEl.style.display = "block";
      }
    });
  }

  // ============================================================
  // ADMIN EXAM MANAGEMENT MODULE
  // ============================================================
  async function loadAndRenderExams() {
    const content = document.getElementById("adm-content");
    content.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
        <div>
          <h3 style="font-size:1.25rem; font-weight:700; color:#fff;">Quản Lý Đề Thi & Kiểm Tra</h3>
          <p style="font-size:0.8rem; color:rgba(255,255,255,0.5);">Soạn đề thi trắc nghiệm, điền từ ngắn, đính kèm hình ảnh, nhập/xuất file JSON và theo dõi điểm số</p>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="adm-btn adm-btn--secondary" id="btn-import-exam-json" style="display:flex; align-items:center; gap:8px; background:rgba(138,176,151,0.15); border-color:#8ab097; color:#8ab097;" title="Tải file JSON đề thi từ máy tính lên Server">
            📥 Nhập đề (JSON)
          </button>
          <input type="file" id="input-import-exam-json" accept=".json" style="display:none;" />
          <button class="adm-btn adm-btn--secondary" id="btn-view-all-results" style="display:flex; align-items:center; gap:8px;">
            📊 Bảng Điểm Đoàn Sinh
          </button>
          <button class="adm-btn adm-btn--primary" id="btn-add-exam" style="display:flex; align-items:center; gap:8px;">
            ${ICONS.plus} <span>Tạo đề thi mới</span>
          </button>
        </div>
      </div>
      <div class="adm-item-list" id="exams-list-container">
        <!-- Rendered exams will go here -->
      </div>
    `;

    document.getElementById("btn-add-exam").addEventListener("click", () => openExamEditModal(null));
    document.getElementById("btn-view-all-results").addEventListener("click", openAllResultsModal);

    const btnImport = document.getElementById("btn-import-exam-json");
    const inputImport = document.getElementById("input-import-exam-json");
    if (btnImport && inputImport) {
      btnImport.addEventListener("click", () => inputImport.click());
      inputImport.addEventListener("change", handleImportExamJSON);
    }

    await refreshExamsList();
  }

  async function refreshExamsList() {
    const container = document.getElementById("exams-list-container");
    if (!container) return;

    container.innerHTML = `<div class="adm-loading">Đang tải danh sách đề thi...</div>`;

    try {
      const res = await fetch(`${AUTH_URL}?action=list-exams`);
      if (!res.ok) throw new Error('Không thể tải danh sách đề thi');
      const data = await res.json();
      const exams = data.exams || [];

      if (exams.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; padding:3rem; color:rgba(255,255,255,0.5);">
            <p>Chưa có đề thi nào trong hệ thống.</p>
            <button class="adm-btn adm-btn--primary" id="btn-add-exam-empty" style="margin-top:1rem;">Tạo đề thi đầu tiên</button>
          </div>
        `;
        const btnEmpty = document.getElementById("btn-add-exam-empty");
        if (btnEmpty) btnEmpty.addEventListener("click", () => openExamEditModal(null));
        return;
      }

      container.innerHTML = exams.map(e => `
        <div class="adm-user-card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding:16px; background:rgba(255,255,255,0.03); border:1px solid rgba(138,176,151,0.2); border-radius:12px; margin-bottom:12px;">
          <div>
            <div style="font-weight:700; font-size:1.05rem; color:#fff;">📝 ${esc(e.title)}</div>
            <div style="font-size:0.8rem; color:#8ab097; margin-top:4px;">
              <span>${esc(e.nganh || 'Tất cả Ngành')}</span> · 
              <span>${esc(e.bac || 'Tất cả Bậc')}</span> · 
              <span>⏱️ ${e.time_limit_minutes} phút</span> · 
              <span>❓ ${e.question_count} câu hỏi</span> · 
              <span>🎯 Đạt: ${e.pass_score}%</span>
            </div>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="adm-btn adm-btn--secondary btn-export-exam-json" data-id="${e.id}" style="font-size:0.8rem; padding:4px 10px; background:rgba(212,168,67,0.15); border-color:#d4a843; color:#f6d365;" title="Xuất đề thi thành file JSON để lưu trữ hoặc upload lên server khác">📤 Xuất JSON</button>
            <button class="adm-btn adm-btn--secondary btn-edit-exam" data-id="${e.id}">Sửa đề</button>
            <button class="adm-btn adm-btn--danger btn-del-exam" data-id="${e.id}" style="background:rgba(239,68,68,0.2); color:#f87171; border:1px solid rgba(239,68,68,0.3);">Xóa</button>
          </div>
        </div>
      `).join('');

      container.querySelectorAll('.btn-export-exam-json').forEach(btn => {
        btn.addEventListener('click', () => exportExamToJSON(btn.dataset.id));
      });

      container.querySelectorAll('.btn-edit-exam').forEach(btn => {
        btn.addEventListener('click', () => openExamEditModal(btn.dataset.id));
      });

      container.querySelectorAll('.btn-del-exam').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Bạn có chắc chắn muốn xóa đề thi này? Tất cả dữ liệu điểm thi liên quan cũng sẽ bị xóa.')) {
            await fetch(`${AUTH_URL}?action=admin-delete-exam`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify({ id: btn.dataset.id })
            });
            await refreshExamsList();
          }
        });
      });
    } catch (err) {
      container.innerHTML = `<div style="color:#f87171; padding:1rem;">Lỗi tải đề thi: ${err.message}</div>`;
    }
  }

  // ===== EXPORT EXAM TO JSON FILE =====
  async function exportExamToJSON(examId) {
    try {
      const res = await fetch(`${AUTH_URL}?action=get-exam&id=${encodeURIComponent(examId)}`);
      if (!res.ok) throw new Error('Không thể tải dữ liệu đề thi');
      const data = await res.json();
      if (!data.exam) throw new Error('Đề thi không tồn tại');

      const examData = data.exam;
      const jsonStr = JSON.stringify(examData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      const filename = (examData.id || 'de_thi') + '.json';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Lỗi xuất file JSON: ' + err.message);
    }
  }

  // ===== IMPORT EXAM FROM JSON FILE =====
  async function handleImportExamJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(evt) {
      try {
        const jsonText = evt.target.result;
        const parsed = JSON.parse(jsonText);
        const examList = Array.isArray(parsed) ? parsed : [parsed];

        if (examList.length === 0 || !examList[0].title) {
          throw new Error('Cấu trúc file JSON không đúng định dạng đề thi (thiếu tên đề thi hoặc câu hỏi).');
        }

        const confirmMsg = `Bạn có chắc chắn muốn nhập ${examList.length} đề thi từ file "${file.name}" vào cơ sở dữ liệu hệ thống?`;
        if (!confirm('XÁC NHẬN NHẬP ĐỀ THI VÀO CƠ SỞ DỮ LIỆU:\n\n' + confirmMsg)) {
          e.target.value = '';
          return;
        }

        let successCount = 0;
        let failCount = 0;

        for (const examObj of examList) {
          try {
            const saveRes = await fetch(`${AUTH_URL}?action=admin-save-exam`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify(examObj)
            });
            const resData = await saveRes.json();
            if (saveRes.ok && resData.success) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (err) {
            failCount++;
          }
        }

        alert(`✅ Đã nhập thành công ${successCount} đề thi vào cơ sở dữ liệu!` + (failCount > 0 ? `\n⚠️ Có ${failCount} đề thi bị lỗi.` : ''));
        await refreshExamsList();
      } catch (err) {
        alert('❌ Lỗi đọc file JSON: ' + err.message);
      } finally {
        e.target.value = '';
      }
    };

    reader.readAsText(file, 'UTF-8');
  }

  // ===== OPEN EXAM EDIT MODAL (100% VIETNAMESE GOOGLE FORMS STYLE) =====
  async function openExamEditModal(examId) {
    let examData = {
      id: '',
      title: '',
      description: '',
      nganh: 'Ngành Thiếu',
      bac: 'Hướng Thiện',
      time_limit_minutes: 15,
      pass_score: 70,
      max_tab_switches: 3,
      questions: []
    };

    if (examId) {
      try {
        const res = await fetch(`${AUTH_URL}?action=get-exam&id=${encodeURIComponent(examId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.exam) examData = data.exam;
        }
      } catch (e) {}
    }

    const overlay = createModalOverlay('adm-exam-modal-overlay');
    overlay.innerHTML = `
      <div class="auth-modal" style="width:min(880px, 95vw); max-height:92vh; display:flex; flex-direction:column; padding:1.25rem;">
        <button class="auth-modal__close" id="exam-modal-close">✕</button>
        <h3 class="auth-modal__title">${examId ? 'Chỉnh Sửa Đề Thi' : 'Tạo Đề Thi Mới'}</h3>

        <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:10px; margin-bottom:12px;">
          <div class="adm-field" style="grid-column: span 2;">
            <label style="font-size:0.8rem;">Tên / Tiêu đề bài thi *</label>
            <input type="text" class="adm-input" id="ex-title" value="${escAttr(examData.title)}" placeholder="Ví dụ: Kiểm Tra Kiến Thức Bậc Hướng Thiện - Bài 1" style="font-size:0.88rem; padding:6px 10px;" required />
          </div>
          <div class="adm-field" style="grid-column: span 2;">
            <label style="font-size:0.8rem;">Mô tả / Hướng dẫn</label>
            <input type="text" class="adm-input" id="ex-desc" value="${escAttr(examData.description)}" placeholder="Hướng dẫn ngắn cho học viên..." style="font-size:0.88rem; padding:6px 10px;" />
          </div>
          <div class="adm-field">
            <label style="font-size:0.8rem;">Ngành</label>
            <select class="adm-input" id="ex-nganh" style="background:#1e3222; color:#fff; font-size:0.85rem; padding:6px;">
              <option value="Ngành Oanh" ${examData.nganh === 'Ngành Oanh' ? 'selected' : ''}>Ngành Oanh</option>
              <option value="Ngành Thiếu" ${examData.nganh === 'Ngành Thiếu' ? 'selected' : ''}>Ngành Thiếu</option>
              <option value="Ngành Thanh" ${examData.nganh === 'Ngành Thanh' ? 'selected' : ''}>Ngành Thanh</option>
              <option value="Huynh Trưởng" ${examData.nganh === 'Huynh Trưởng' ? 'selected' : ''}>Huynh Trưởng</option>
            </select>
          </div>
          <div class="adm-field">
            <label style="font-size:0.8rem;">Bậc Học</label>
            <input type="text" class="adm-input" id="ex-bac" value="${escAttr(examData.bac)}" placeholder="Ví dụ: Hướng Thiện..." style="font-size:0.85rem; padding:6px 10px;" />
          </div>
          <div class="adm-field">
            <label style="font-size:0.8rem;">Thời gian (Phút)</label>
            <input type="number" class="adm-input" id="ex-time" value="${examData.time_limit_minutes}" min="1" max="180" style="font-size:0.85rem; padding:6px 10px;" />
          </div>
          <div class="adm-field">
            <label style="font-size:0.8rem;">Điểm đạt (%)</label>
            <input type="number" class="adm-input" id="ex-pass" value="${examData.pass_score}" min="10" max="100" style="font-size:0.85rem; padding:6px 10px;" />
          </div>
        </div>

        <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:10px; flex:1; display:flex; flex-direction:column; overflow:hidden;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <h4 style="color:#8ab097; font-size:0.95rem; font-weight:700;">📋 DANH SÁCH CÂU HỎI (<span id="ex-q-count">0</span>)</h4>
            <button type="button" class="adm-btn adm-btn--secondary" id="ex-btn-add-q" style="font-size:0.82rem; padding:6px 14px; background:rgba(212,168,67,0.2); border-color:#d4a843; color:#f6d365;">
              ➕ Thêm câu hỏi mới
            </button>
          </div>
          <div id="ex-questions-list" style="flex:1; overflow-y:auto; padding-right:6px; display:flex; flex-direction:column; gap:12px;">
            <!-- Questions list rendered dynamically -->
          </div>
        </div>

        <div class="auth-modal__error" id="ex-error" style="color:#ff6b6b; font-size:0.85rem; margin-top:12px; display:none;"></div>

        <div class="auth-modal__footer" style="margin-top:12px;">
          <button class="adm-btn" id="ex-btn-cancel">Hủy bỏ</button>
          <button class="adm-btn adm-btn--primary" id="ex-btn-save">💾 Lưu đề thi</button>
        </div>
      </div>
    `;

    overlay.classList.add("visible");
    document.body.style.overflow = "hidden";

    let questionsState = JSON.parse(JSON.stringify(examData.questions || []));

    function renderQuestionsBuilder() {
      const qListEl = overlay.querySelector("#ex-questions-list");
      const qCountEl = overlay.querySelector("#ex-q-count");
      if (qCountEl) qCountEl.textContent = questionsState.length;
      if (!qListEl) return;

      if (questionsState.length === 0) {
        qListEl.innerHTML = `
          <div style="color:rgba(255,255,255,0.4); text-align:center; padding:2rem; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.1); border-radius:10px;">
            <p style="font-size:0.95rem; margin-bottom:8px;">Bài thi này chưa có câu hỏi nào.</p>
            <button type="button" class="adm-btn adm-btn--primary" onclick="document.getElementById('ex-btn-add-q').click()">+ Tạo câu hỏi đầu tiên</button>
          </div>
        `;
        return;
      }

      qListEl.innerHTML = questionsState.map((q, qIdx) => `
        <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(138,176,151,0.25); border-radius:10px; padding:14px; position:relative;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
            <span style="font-weight:700; color:#d4a843; font-size:0.9rem;">CÂU HỎI ${qIdx + 1}</span>
            <div style="display:flex; gap:8px; align-items:center;">
              <select class="adm-input q-type-select" data-qidx="${qIdx}" style="padding:4px 10px; font-size:0.8rem; background:#1e3222; color:#fff; border-color:rgba(138,176,151,0.4);">
                <option value="single" ${q.type === 'single' ? 'selected' : ''}>🔘 Trắc nghiệm 1 đáp án</option>
                <option value="multiple" ${q.type === 'multiple' ? 'selected' : ''}>☑️ Trắc nghiệm nhiều đáp án</option>
                <option value="boolean" ${q.type === 'boolean' ? 'selected' : ''}>⚖️ Đúng / Sai</option>
                <option value="short_answer" ${q.type === 'short_answer' ? 'selected' : ''}>✍️ Trả lời ngắn / Điền từ</option>
              </select>
              <button type="button" class="btn-del-q" data-qidx="${qIdx}" style="background:rgba(239,68,68,0.2); border:1px solid rgba(239,68,68,0.4); color:#f87171; padding:4px 8px; border-radius:6px; font-size:0.8rem; cursor:pointer;">🗑️ Xóa</button>
            </div>
          </div>

          <div style="margin-bottom:10px;">
            <input type="text" class="adm-input q-text-input" data-qidx="${qIdx}" value="${escAttr(q.text || '')}" placeholder="Nội dung câu hỏi..." style="font-size:0.95rem; font-weight:600;" />
          </div>

          <div style="display:flex; gap:8px; align-items:center; margin-bottom:10px;">
            <input type="text" class="adm-input q-img-input" data-qidx="${qIdx}" value="${escAttr(q.image_url || '')}" placeholder="Đường dẫn ảnh minh họa (nếu có)..." style="font-size:0.82rem; flex:1;" />
            <label class="adm-btn adm-btn--secondary" style="padding:4px 10px; font-size:0.78rem; cursor:pointer;">
              📷 <span>Up ảnh</span>
              <input type="file" class="q-img-file" data-qidx="${qIdx}" accept="image/*" style="display:none;" />
            </label>
          </div>
          ${q.image_url ? `<img src="${q.image_url}" style="max-height:120px; border-radius:6px; margin-bottom:10px; display:block;" />` : ''}

          <!-- OPTIONS BUILDER -->
          ${renderOptionsInputHTML(q, qIdx)}

          <div style="margin-top:10px; border-top:1px dashed rgba(255,255,255,0.1); padding-top:8px;">
            <input type="text" class="adm-input q-exp-input" data-qidx="${qIdx}" value="${escAttr(q.explanation || '')}" placeholder="💡 Lời giải thích chi tiết khi xem lại bài làm..." style="font-size:0.82rem; color:#cbd5e1;" />
          </div>
        </div>
      `).join('');

      // Event Listeners for Question Field Updates
      qListEl.querySelectorAll('.q-type-select').forEach(el => {
        el.addEventListener('change', (e) => {
          const idx = parseInt(e.target.dataset.qidx, 10);
          questionsState[idx].type = e.target.value;
          renderQuestionsBuilder();
        });
      });

      qListEl.querySelectorAll('.q-text-input').forEach(el => {
        el.addEventListener('input', (e) => {
          const idx = parseInt(e.target.dataset.qidx, 10);
          questionsState[idx].text = e.target.value;
        });
      });

      qListEl.querySelectorAll('.q-img-input').forEach(el => {
        el.addEventListener('input', (e) => {
          const idx = parseInt(e.target.dataset.qidx, 10);
          questionsState[idx].image_url = e.target.value;
        });
      });

      qListEl.querySelectorAll('.q-exp-input').forEach(el => {
        el.addEventListener('input', (e) => {
          const idx = parseInt(e.target.dataset.qidx, 10);
          questionsState[idx].explanation = e.target.value;
        });
      });

      qListEl.querySelectorAll('.q-img-file').forEach(el => {
        el.addEventListener('change', async (e) => {
          const idx = parseInt(e.target.dataset.qidx, 10);
          const file = e.target.files[0];
          if (!file) return;

          const formData = new FormData();
          formData.append('image', file);

          try {
            const uploadRes = await fetch(`${AUTH_URL}?action=upload-exam-image`, {
              method: 'POST',
              credentials: 'same-origin',
              body: formData
            });
            const data = await uploadRes.json();
            if (data.success && data.imageUrl) {
              questionsState[idx].image_url = data.imageUrl;
              renderQuestionsBuilder();
            } else {
              alert(data.error || 'Lỗi up ảnh');
            }
          } catch (err) {
            alert('Không thể tải ảnh lên máy chủ');
          }
        });
      });

      qListEl.querySelectorAll('.btn-del-q').forEach(el => {
        el.addEventListener('click', (e) => {
          const idx = parseInt(e.target.dataset.qidx, 10);
          questionsState.splice(idx, 1);
          renderQuestionsBuilder();
        });
      });
    }

    function renderOptionsInputHTML(q, qIdx) {
      if (q.type === 'single' || q.type === 'multiple') {
        const options = q.options || ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'];
        q.options = options;

        return `
          <div style="font-size:0.8rem; color:#8ab097; margin-bottom:6px; font-weight:600;">Lựa chọn phương án (Tích chọn phương án ĐÚNG):</div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            ${options.map((opt, oIdx) => {
              const isChecked = q.type === 'single' ? (q.correct_answer === oIdx) : ((q.correct_answers || []).includes(oIdx));
              const inputType = q.type === 'single' ? 'radio' : 'checkbox';
              return `
                <div style="display:flex; align-items:center; gap:8px;">
                  <input type="${inputType}" name="correct_${qIdx}" ${isChecked ? 'checked' : ''} onchange="window.GDPTAdminExamHelper.setCorrect(${qIdx}, ${oIdx}, '${q.type}', this.checked)" title="Tích chọn nếu đây là đáp án đúng" />
                  <input type="text" class="adm-input" value="${escAttr(opt)}" oninput="window.GDPTAdminExamHelper.setOptionText(${qIdx}, ${oIdx}, this.value)" style="font-size:0.85rem; padding:4px 8px; flex:1;" />
                  ${options.length > 2 ? `<button type="button" onclick="window.GDPTAdminExamHelper.deleteOption(${qIdx}, ${oIdx})" style="background:none; border:none; color:#f87171; cursor:pointer; font-size:0.8rem;">✕</button>` : ''}
                </div>
              `;
            }).join('')}
          </div>
          <button type="button" class="adm-btn adm-btn--secondary" onclick="window.GDPTAdminExamHelper.addOption(${qIdx})" style="margin-top:6px; font-size:0.75rem; padding:3px 10px;">+ Thêm phương án</button>
        `;
      } else if (q.type === 'boolean') {
        q.correct_answer = q.correct_answer !== undefined ? q.correct_answer : 1;
        return `
          <div style="font-size:0.8rem; color:#8ab097; margin-bottom:6px; font-weight:600;">Đáp án đúng:</div>
          <div style="display:flex; gap:20px;">
            <label style="color:#fff; font-size:0.9rem; cursor:pointer;"><input type="radio" name="bool_${qIdx}" value="1" ${q.correct_answer === 1 ? 'checked' : ''} onchange="window.GDPTAdminExamHelper.setBool(${qIdx}, 1)" /> ✅ Đúng</label>
            <label style="color:#fff; font-size:0.9rem; cursor:pointer;"><input type="radio" name="bool_${qIdx}" value="0" ${q.correct_answer === 0 ? 'checked' : ''} onchange="window.GDPTAdminExamHelper.setBool(${qIdx}, 0)" /> ❌ Sai</label>
          </div>
        `;
      } else if (q.type === 'short_answer') {
        const acc = (q.acceptable_answers || []).join(', ');
        return `
          <div style="font-size:0.8rem; color:#8ab097; margin-bottom:6px; font-weight:600;">Các từ/cụm từ chấp nhận được (Ngăn cách bởi dấu phẩy):</div>
          <input type="text" class="adm-input" value="${escAttr(acc)}" oninput="window.GDPTAdminExamHelper.setShortAnswers(${qIdx}, this.value)" placeholder="Ví dụ: Tất Đạt Đa, Thái Tử Tất Đạt Đa, Siddhartha" style="font-size:0.85rem;" />
        `;
      }
      return '';
    }

    // Helper functions for inline question editing
    window.GDPTAdminExamHelper = {
      setOptionText(qIdx, oIdx, text) {
        if (questionsState[qIdx] && questionsState[qIdx].options) {
          questionsState[qIdx].options[oIdx] = text;
        }
      },
      addOption(qIdx) {
        if (questionsState[qIdx]) {
          if (!questionsState[qIdx].options) questionsState[qIdx].options = [];
          const nextLetter = String.fromCharCode(65 + questionsState[qIdx].options.length);
          questionsState[qIdx].options.push(`Lựa chọn ${nextLetter}`);
          renderQuestionsBuilder();
        }
      },
      deleteOption(qIdx, oIdx) {
        if (questionsState[qIdx] && questionsState[qIdx].options) {
          questionsState[qIdx].options.splice(oIdx, 1);
          renderQuestionsBuilder();
        }
      },
      setCorrect(qIdx, oIdx, type, checked) {
        if (!questionsState[qIdx]) return;
        if (type === 'single') {
          questionsState[qIdx].correct_answer = oIdx;
        } else if (type === 'multiple') {
          if (!questionsState[qIdx].correct_answers) questionsState[qIdx].correct_answers = [];
          if (checked) {
            if (!questionsState[qIdx].correct_answers.includes(oIdx)) questionsState[qIdx].correct_answers.push(oIdx);
          } else {
            questionsState[qIdx].correct_answers = questionsState[qIdx].correct_answers.filter(x => x !== oIdx);
          }
        }
      },
      setBool(qIdx, val) {
        if (questionsState[qIdx]) questionsState[qIdx].correct_answer = val;
      },
      setShortAnswers(qIdx, valStr) {
        if (questionsState[qIdx]) {
          questionsState[qIdx].acceptable_answers = valStr.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
    };

    overlay.querySelector("#ex-btn-add-q").addEventListener("click", () => {
      questionsState.push({
        id: 'q_' + Date.now() + '_' + Math.floor(Math.random()*1000),
        type: 'single',
        text: '',
        image_url: '',
        options: ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'],
        correct_answer: 0,
        explanation: ''
      });
      renderQuestionsBuilder();
    });

    renderQuestionsBuilder();

    const closeModal = () => {
      overlay.classList.remove("visible");
      document.body.style.overflow = "";
    };

    overlay.querySelector("#exam-modal-close").addEventListener("click", closeModal);
    overlay.querySelector("#ex-btn-cancel").addEventListener("click", closeModal);

    overlay.querySelector("#ex-btn-save").addEventListener("click", async () => {
      const title = overlay.querySelector("#ex-title").value.trim();
      const errEl = overlay.querySelector("#ex-error");
      errEl.style.display = "none";

      if (!title) {
        errEl.textContent = "Vui lòng nhập tên/tiêu đề đề thi";
        errEl.style.display = "block";
        return;
      }

      const payload = {
        id: examData.id || '',
        title: title,
        description: overlay.querySelector("#ex-desc").value.trim(),
        nganh: overlay.querySelector("#ex-nganh").value,
        bac: overlay.querySelector("#ex-bac").value.trim(),
        time_limit_minutes: parseInt(overlay.querySelector("#ex-time").value, 10) || 15,
        pass_score: parseInt(overlay.querySelector("#ex-pass").value, 10) || 70,
        questions: questionsState
      };

      try {
        const saveRes = await fetch(`${AUTH_URL}?action=admin-save-exam`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(payload)
        });
        const resData = await saveRes.json();
        if (resData.success) {
          closeModal();
          await refreshExamsList();
        } else {
          errEl.textContent = resData.error || "Không thể lưu đề thi";
          errEl.style.display = "block";
        }
      } catch (err) {
        errEl.textContent = "Lỗi kết nối máy chủ";
        errEl.style.display = "block";
      }
    });
  }

  // ===== OPEN ALL RESULTS MODAL (ADMIN) =====
  async function openAllResultsModal() {
    const overlay = createModalOverlay('adm-results-modal-overlay');
    overlay.innerHTML = `
      <div class="auth-modal" style="width:min(800px, 94vw); max-height:90vh;">
        <button class="auth-modal__close" id="res-modal-close">✕</button>
        <h3 class="auth-modal__title">📊 Bảng Điểm Thi Đoàn Sinh</h3>
        <div id="all-results-container" style="max-height:65vh; overflow-y:auto; margin-top:1rem;">
          <div class="adm-loading">Đang tải bảng điểm...</div>
        </div>
      </div>
    `;

    overlay.classList.add("visible");
    document.body.style.overflow = "hidden";

    overlay.querySelector("#res-modal-close").addEventListener("click", () => {
      overlay.classList.remove("visible");
      document.body.style.overflow = "";
    });

    try {
      const res = await fetch(`${AUTH_URL}?action=admin-list-exam-results`, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Không thể tải bảng điểm');
      const data = await res.json();
      const results = data.results || [];

      const container = overlay.querySelector("#all-results-container");
      if (results.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:rgba(255,255,255,0.4); padding:2rem;">Chưa có lượt làm bài thi nào.</div>`;
        return;
      }

      container.innerHTML = `
        <table style="width:100%; border-collapse:collapse; color:#fff; font-size:0.85rem;">
          <thead>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.1); text-align:left; color:#8ab097;">
              <th style="padding:8px;">Họ tên / User</th>
              <th style="padding:8px;">Đề thi</th>
              <th style="padding:8px;">Bậc</th>
              <th style="padding:8px;">Điểm số</th>
              <th style="padding:8px;">Thời gian</th>
              <th style="padding:8px;">Ngày thi</th>
            </tr>
          </thead>
          <tbody>
            ${results.map(r => `
              <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:8px;"><strong>${esc(r.full_name || r.display_name)}</strong><br><span style="color:#64748b;">@${esc(r.username)}</span></td>
                <td style="padding:8px;">${esc(r.exam_title)}</td>
                <td style="padding:8px;"><span class="adm-role-badge">${esc(r.bac || '—')}</span></td>
                <td style="padding:8px;"><strong style="color:${r.score >= 70 ? '#34d399' : '#f87171'};">${r.score}%</strong> (${r.correct_count}/${r.total_questions})</td>
                <td style="padding:8px;">${Math.floor(r.time_spent_seconds/60)}p ${r.time_spent_seconds%60}s</td>
                <td style="padding:8px; color:#64748b;">${new Date(r.submitted_at * 1000).toLocaleDateString('vi-VN')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      overlay.querySelector("#all-results-container").innerHTML = `<div style="color:#f87171;">Lỗi: ${err.message}</div>`;
    }
  }

  // ===== ENTRY POINTS =====
  let clickCount = 0, clickTimer = null;
  document.addEventListener("click", e => {
    if (!e.target.closest(".logo-circle--footer, .footer-logo-section a")) return;
    clickCount++;
    if (clickCount === 1) clickTimer = setTimeout(() => { clickCount = 0; }, 3000);
    if (clickCount >= 5) { clearTimeout(clickTimer); clickCount = 0; e.preventDefault(); openAdmin(); }
  });

  document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.shiftKey && e.key === "A") { e.preventDefault(); openAdmin(); }
  });

  // Check auth and render header buttons/avatar
  document.addEventListener("DOMContentLoaded", () => {
    initHeaderAuth();
  });

  if (window.location.search.includes("admin")) {
    document.addEventListener("DOMContentLoaded", () => setTimeout(openAdmin, 500));
  }

  window.openGDPTAdmin = openAdmin;
})();
