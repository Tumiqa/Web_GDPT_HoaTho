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
  };

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
  function openAddUserModal() {
    let overlay = document.getElementById("add-user-modal-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "add-user-modal-overlay";
      overlay.className = "auth-modal-overlay";
      document.body.appendChild(overlay);
    }

    const isSuperAdmin = currentUser && currentUser.username === '0903549528';

    overlay.innerHTML = `
      <div class="auth-modal" style="width: min(540px, 94vw);">
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
          <div class="adm-field">
            <label>Cấp</label>
            <input type="text" class="adm-input" id="add-usr-rank" placeholder="Tập sự, Kiên..." />
          </div>
          <div class="adm-field" style="grid-column: span 2;">
            <label>Bậc học</label>
            <input type="text" class="adm-input" id="add-usr-studyLevel" placeholder="Kiên, Trì, Hướng thiện..." />
          </div>
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

    overlay.querySelector("#add-usr-save").addEventListener("click", async () => {
      const username = overlay.querySelector("#add-usr-username").value.trim();
      const password = overlay.querySelector("#add-usr-password").value;
      const fullName = overlay.querySelector("#add-usr-fullName").value.trim();
      const dharmaName = overlay.querySelector("#add-usr-dharmaName").value.trim();
      const dob = overlay.querySelector("#add-usr-dob").value.trim();
      const role = overlay.querySelector("#add-usr-role").value;
      const position = overlay.querySelector("#add-usr-position").value;
      const rank = overlay.querySelector("#add-usr-rank").value.trim();
      const studyLevel = overlay.querySelector("#add-usr-studyLevel").value.trim();
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
          body: JSON.stringify({ username, password, displayName: dharmaName || fullName, role, fullName, dob, position, rank, studyLevel, dharmaName }),
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

    overlay.innerHTML = `
      <div class="auth-modal" style="width: min(540px, 94vw);">
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
              <option value="Đoàn sinh" ${(u.position || '') === 'Đoàn sinh' ? 'selected' : ''}>Đoàn sinh</option>
              <option value="Huynh trưởng" ${(u.position || '') === 'Huynh trưởng' ? 'selected' : ''}>Huynh trưởng</option>
            </select>
          </div>
          <div class="adm-field">
            <label>Cấp</label>
            <input type="text" class="adm-input" id="edit-usr-rank" value="${escAttr(u.rank || '')}" placeholder="Tập sự, Kiên..." />
          </div>
          <div class="adm-field">
            <label>Bậc học</label>
            <input type="text" class="adm-input" id="edit-usr-studyLevel" value="${escAttr(u.study_level || '')}" placeholder="Kiên, Trì, Hướng thiện..." />
          </div>
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

    overlay.querySelector("#edit-usr-save").addEventListener("click", async () => {
      const fullName = overlay.querySelector("#edit-usr-fullName").value.trim();
      const dharmaName = overlay.querySelector("#edit-usr-dharmaName").value.trim();
      const dob = overlay.querySelector("#edit-usr-dob").value.trim();
      const position = overlay.querySelector("#edit-usr-position").value;
      const rank = overlay.querySelector("#edit-usr-rank").value.trim();
      const studyLevel = overlay.querySelector("#edit-usr-studyLevel").value.trim();
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
          body: JSON.stringify({ userId: u.id, fullName, dharmaName, dob, position, rank, studyLevel }),
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

    overlay.innerHTML = `
      <div class="auth-modal">
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

        <div class="auth-modal__grid">
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
              <option value="Đoàn sinh" ${(currentUser.position || '') === 'Đoàn sinh' ? 'selected' : ''}>Đoàn sinh</option>
              <option value="Huynh trưởng" ${(currentUser.position || '') === 'Huynh trưởng' ? 'selected' : ''}>Huynh trưởng</option>
            </select>
          </div>
          <div class="adm-field" id="prof-rank-group" style="${(currentUser.position || '') === 'Huynh trưởng' ? '' : 'display:none;'}">
            <label>Cấp <span style="font-size:0.75rem; color:rgba(255,255,255,0.5);">(dành cho Huynh trưởng)</span></label>
            <input type="text" class="adm-input" id="prof-rank" value="${escAttr(currentUser.rank || '')}" placeholder="Tập sự, Kiên..." />
          </div>
          <div class="adm-field" style="grid-column: span 2;">
            <label>Bậc học</label>
            <input type="text" class="adm-input" id="prof-studyLevel" value="${escAttr(currentUser.studyLevel || '')}" placeholder="Kiên, Trì, Hướng thiện..." />
          </div>
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

    // Position & Rank dynamic toggle
    const profPosSelect = overlay.querySelector("#prof-position");
    const profRankGroup = overlay.querySelector("#prof-rank-group");
    const profRankInput = overlay.querySelector("#prof-rank");

    if (profPosSelect && profRankGroup) {
      profPosSelect.addEventListener("change", () => {
        if (profPosSelect.value === "Huynh trưởng") {
          profRankGroup.style.display = "block";
        } else {
          profRankGroup.style.display = "none";
          if (profRankInput) profRankInput.value = "";
        }
      });
    }

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
          // Restore
          const initial = (currentUser.displayName || "?").charAt(0).toUpperCase();
          profAvatarDisplay.innerHTML = currentUser.avatarUrl
            ? `<img src="${currentUser.avatarUrl}" style="width:100%; height:100%; object-fit:cover;" />`
            : initial;
        }
      } catch (err) {
        showToast("Lỗi kết nối máy chủ", true);
        // Restore
        const initial = (currentUser.displayName || "?").charAt(0).toUpperCase();
        profAvatarDisplay.innerHTML = currentUser.avatarUrl
          ? `<img src="${currentUser.avatarUrl}" style="width:100%; height:100%; object-fit:cover;" />`
          : initial;
      }
    });

    overlay.querySelector("#prof-btn-save").addEventListener("click", async () => {
      const fullName = overlay.querySelector("#prof-fullName").value.trim();
      const dob = overlay.querySelector("#prof-dob").value.trim();
      const dharmaName = overlay.querySelector("#prof-dharmaName").value.trim();
      const position = overlay.querySelector("#prof-position").value;
      const rank = overlay.querySelector("#prof-rank") ? overlay.querySelector("#prof-rank").value.trim() : "";
      const studyLevel = overlay.querySelector("#prof-studyLevel").value.trim();
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
          body: JSON.stringify({ fullName, dob, dharmaName, position, rank, studyLevel }),
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
