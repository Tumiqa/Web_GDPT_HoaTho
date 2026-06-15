/* ============================================================
   GĐPT HÒA THỌ — Admin CMS v2.0
   Hệ thống quản trị nội dung đầy đủ
   Sidebar navigation · Facebook-style posting · Rich media
   ============================================================ */

(function () {
  "use strict";

  // ===== CONFIG =====
  const API_URL = "api.php";
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
    config: {
      label: "Cấu Hình",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
      createLabel: "",
      createHint: "",
    },
  };

  let isLoggedIn = false;
  let adminHash = "";
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
        const res = await fetch(`${API_URL}?module=${module}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Admin-Token": adminHash },
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

  // ===== BUILD ADMIN UI =====
  function buildAdminHTML() {
    if (document.getElementById("adm-root")) return;

    const root = document.createElement("div");
    root.id = "adm-root";
    root.className = "adm-root";
    root.innerHTML = `
      <!-- Login -->
      <div class="adm-login" id="adm-login">
        <button class="adm-btn-icon adm-login__close" id="adm-login-close">${ICONS.close}</button>
        <div class="adm-login__card">
          <div class="adm-login__logo">🔐</div>
          <h2>Quản Trị Nội Dung</h2>
          <p>Nhập mật khẩu để truy cập bảng điều khiển</p>
          <input type="password" class="adm-input" id="adm-pwd" placeholder="Mật khẩu..." autocomplete="off" />
          <button class="adm-btn adm-btn--primary adm-btn--full" id="adm-login-btn">Đăng nhập</button>
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
          <nav class="adm-sidebar__nav" id="adm-nav"></nav>
          <div class="adm-sidebar__footer">
            <button class="adm-sidebar__action" id="adm-btn-export">${ICONS.download}<span>Xuất JSON</span></button>
            <button class="adm-sidebar__action" id="adm-btn-import">${ICONS.upload}<span>Nhập JSON</span></button>
            <input type="file" accept=".json" id="adm-import-file" style="display:none" />
            <div class="adm-sidebar__divider"></div>
            <button class="adm-sidebar__action adm-sidebar__action--exit" id="adm-btn-exit">${ICONS.close}<span>Thoát Admin</span></button>
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
  }

  // ===== BUILD SIDEBAR NAV =====
  function buildSidebar() {
    const nav = document.getElementById("adm-nav");
    nav.innerHTML = "";
    Object.entries(MODULES).forEach(([key, mod]) => {
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

  // ===== INIT EVENTS =====
  function initEvents() {
    // Login
    document.getElementById("adm-login-btn").addEventListener("click", handleLogin);
    document.getElementById("adm-pwd").addEventListener("keydown", e => { if (e.key === "Enter") handleLogin(); });

    // Close admin
    document.getElementById("adm-close-mobile").addEventListener("click", closeAdmin);
    document.getElementById("adm-login-close").addEventListener("click", closeAdmin);
    document.getElementById("adm-btn-exit").addEventListener("click", closeAdmin);

    // Sidebar toggle (mobile)
    document.getElementById("adm-sidebar-toggle").addEventListener("click", () => {
      document.getElementById("adm-sidebar").classList.toggle("open");
    });
    document.getElementById("adm-sidebar-close").addEventListener("click", () => {
      document.getElementById("adm-sidebar").classList.remove("open");
    });

    // Export/Import
    document.getElementById("adm-btn-export").addEventListener("click", exportAllData);
    document.getElementById("adm-btn-import").addEventListener("click", () => document.getElementById("adm-import-file").click());
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
    const pwd = document.getElementById("adm-pwd").value;
    const err = document.getElementById("adm-login-err");
    if (!pwd) { err.textContent = "Vui lòng nhập mật khẩu"; return; }

    const hash = await sha256(pwd);
    const config = await DataService.fetch("config");
    if (!config || hash !== config.adminPasswordHash) { err.textContent = "Mật khẩu không đúng"; return; }

    adminHash = hash;
    isLoggedIn = true;
    sessionStorage.setItem("gdpt_admin", hash);
    document.getElementById("adm-login").style.display = "none";
    document.getElementById("adm-dashboard").style.display = "flex";
    await switchModule("sinhhoat");
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
    const data = await DataService.fetch(module);
    moduleData[module] = data;
    renderModule(module, data);
  }

  // ===== RENDER MODULE =====
  function renderModule(module, data) {
    const content = document.getElementById("adm-content");

    if (module === "config") { renderConfig(data); return; }

    const items = Array.isArray(data) ? data : [];
    const mod = MODULES[module];

    content.innerHTML = `
      <!-- Create Post Box -->
      <div class="adm-create-box" id="adm-create-box">
        <div class="adm-create-box__prompt">
          <div class="adm-create-box__avatar">${ICONS.plus}</div>
          <div class="adm-create-box__text">
            <strong>${mod.createLabel}</strong>
            <span>${mod.createHint}</span>
          </div>
        </div>
      </div>

      <!-- Search bar -->
      <div class="adm-search-bar">
        <span class="adm-search-bar__icon">${ICONS.search}</span>
        <input type="text" class="adm-search-bar__input" id="adm-search" placeholder="Tìm kiếm trong ${mod.label}..." value="${escAttr(searchQuery)}" />
        <span class="adm-search-bar__count" id="adm-count">${items.length} mục</span>
      </div>

      <!-- Item list -->
      <div class="adm-item-list" id="adm-items"></div>
    `;

    // Create box click
    document.getElementById("adm-create-box").addEventListener("click", () => openForm(module, -1));

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
          <div class="adm-card__actions">
            <button class="adm-btn-icon adm-btn-icon--sm" data-action="edit" data-index="${realIdx}" title="Sửa">${ICONS.edit}</button>
            <button class="adm-btn-icon adm-btn-icon--sm adm-btn-icon--danger" data-action="delete" data-index="${realIdx}" title="Xóa">${ICONS.trash}</button>
          </div>
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
      case "tailieu": return `${item.category || ""} · ${(item.fileType || "").toUpperCase()}`;
      case "kynang": return `${item.category || ""} · ${(item.images || []).length} ảnh · ${(item.videos || []).length} video`;
      default: return "";
    }
  }

  function getItemThumb(module, item) {
    if (item.images && item.images.length) return item.images[0];
    if (item.videos && item.videos.length) return getYouTubeThumb(item.videos[0]);
    return null;
  }

  // ===== CONFIG MODULE =====
  function renderConfig(data) {
    const content = document.getElementById("adm-content");
    if (!data) data = {};
    content.innerHTML = `
      <div class="adm-config-section">
        <h3>⚙️ Cấu Hình Website</h3>
        <p class="adm-config-desc">Thay đổi các thông tin hiển thị trên website</p>

        <div class="adm-form-grid">
          <div class="adm-field">
            <label>Tên website</label>
            <input type="text" class="adm-input" id="cfg-siteName" value="${escAttr(data.siteName || "")}" />
          </div>
          <div class="adm-field">
            <label>Châm ngôn</label>
            <input type="text" class="adm-input" id="cfg-motto" value="${escAttr(data.motto || "")}" />
          </div>
          <div class="adm-field">
            <label>Email</label>
            <input type="email" class="adm-input" id="cfg-email" value="${escAttr(data.email || "")}" />
          </div>
          <div class="adm-field">
            <label>Link Facebook</label>
            <input type="url" class="adm-input" id="cfg-facebook" value="${escAttr(data.facebook || "")}" />
          </div>
          <div class="adm-field">
            <label>Địa chỉ</label>
            <input type="text" class="adm-input" id="cfg-address" value="${escAttr(data.address || "")}" />
          </div>
        </div>

        <div class="adm-form-actions">
          <button class="adm-btn adm-btn--primary" id="cfg-save">Lưu cấu hình</button>
        </div>
      </div>

      <div class="adm-config-section" style="margin-top: 2rem;">
        <h3>🔑 Đổi Mật Khẩu Admin</h3>
        <div class="adm-form-grid">
          <div class="adm-field">
            <label>Mật khẩu mới</label>
            <input type="password" class="adm-input" id="cfg-newpwd" placeholder="Nhập mật khẩu mới..." />
          </div>
          <div class="adm-field">
            <label>Xác nhận</label>
            <input type="password" class="adm-input" id="cfg-newpwd2" placeholder="Nhập lại mật khẩu..." />
          </div>
        </div>
        <div class="adm-form-actions">
          <button class="adm-btn adm-btn--ghost" id="cfg-changepwd">Đổi mật khẩu</button>
        </div>
      </div>
    `;

    document.getElementById("cfg-save").addEventListener("click", async () => {
      data.siteName = document.getElementById("cfg-siteName").value;
      data.motto = document.getElementById("cfg-motto").value;
      data.email = document.getElementById("cfg-email").value;
      data.facebook = document.getElementById("cfg-facebook").value;
      data.address = document.getElementById("cfg-address").value;
      const result = await DataService.save("config", data);
      showToast(result.success ? "Đã lưu cấu hình!" : "Lỗi khi lưu", !result.success);
    });

    document.getElementById("cfg-changepwd").addEventListener("click", async () => {
      const p1 = document.getElementById("cfg-newpwd").value;
      const p2 = document.getElementById("cfg-newpwd2").value;
      if (!p1 || p1.length < 4) { showToast("Mật khẩu phải ít nhất 4 ký tự", true); return; }
      if (p1 !== p2) { showToast("Mật khẩu xác nhận không khớp", true); return; }
      data.adminPasswordHash = await sha256(p1);
      adminHash = data.adminPasswordHash;
      sessionStorage.setItem("gdpt_admin", adminHash);
      const result = await DataService.save("config", data);
      showToast(result.success ? "Đã đổi mật khẩu!" : "Lỗi khi đổi", !result.success);
      document.getElementById("cfg-newpwd").value = "";
      document.getElementById("cfg-newpwd2").value = "";
    });
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
          { type: "textarea", id: "content", label: "Nội dung bài viết", placeholder: "Mô tả chi tiết về sự kiện, sinh hoạt...", value: item.content, rows: 5 },
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
          { type: "text", id: "title", label: "Tên tài liệu", placeholder: "Ví dụ: Giáo Án Ngành Thiếu", value: item.title, required: true },
          { type: "textarea", id: "description", label: "Mô tả", placeholder: "Mô tả ngắn về tài liệu...", value: item.description, rows: 3 },
          { type: "row", children: [
            { type: "select", id: "category", label: "Danh mục", value: item.category, options: ["Phật Pháp", "Giáo Án", "Kỹ Năng", "Sách Tham Khảo", "Khác"] },
            { type: "select", id: "fileType", label: "Loại file", value: item.fileType, options: ["pdf", "doc", "ppt", "link", "video"] },
          ]},
          { type: "text", id: "url", label: "Link tài liệu", placeholder: "https://drive.google.com/...", value: item.url || "", hint: "Google Drive, PDF URL, hoặc link tải" },
        );
        break;
      case "kynang":
        fields.push(
          { type: "text", id: "title", label: "Tiêu đề", placeholder: "Ví dụ: Nút Dây Cơ Bản", value: item.title, required: true },
          { type: "select", id: "category", label: "Chủ đề", value: item.category, options: ["Kết Dây", "Morse", "Semaphore", "Dựng Trại", "Cứu Thương", "La Bàn", "Trò Chơi", "Khác"] },
          { type: "textarea", id: "content", label: "Nội dung", placeholder: "Hướng dẫn chi tiết...", value: item.content, rows: 5 },
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
      const opts = (field.options || []).map(o => `<option value="${escAttr(o)}" ${field.value === o ? "selected" : ""}>${esc(o)}</option>`).join("");
      return `
        <div class="adm-field">
          <label>${field.label}</label>
          <select class="adm-input" id="form-${field.id}">${opts}</select>
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

  // ===== FORM: Open =====
  function openForm(module, index) {
    const overlay = document.getElementById("adm-form-overlay");
    const isEdit = index >= 0;
    const items = moduleData[module] || [];
    const item = isEdit ? { ...items[index] } : {};
    const mod = MODULES[module];

    const fields = getFormFields(module, item, isEdit);
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
          content: document.getElementById("form-content").value,
          videos: document.getElementById("form-videos").value.split("\n").map(s => s.trim()).filter(Boolean),
          images: document.getElementById("form-images").value.split("\n").map(s => s.trim()).filter(Boolean),
          tags: Array.from(document.querySelectorAll("#chips-tags .adm-chip")).map(c => c.dataset.tag),
        };
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
      case "tailieu":
        item = {
          id: index >= 0 ? items[index].id : "tl-" + Date.now(),
          title: document.getElementById("form-title").value,
          description: document.getElementById("form-description").value,
          category: document.getElementById("form-category").value,
          url: document.getElementById("form-url").value,
          fileType: document.getElementById("form-fileType").value,
          date: new Date().getFullYear().toString(),
        };
        break;
      case "kynang":
        item = {
          id: index >= 0 ? items[index].id : "kn-" + Date.now(),
          title: document.getElementById("form-title").value,
          category: document.getElementById("form-category").value,
          content: document.getElementById("form-content").value,
          videos: document.getElementById("form-videos").value.split("\n").map(s => s.trim()).filter(Boolean),
          images: document.getElementById("form-images").value.split("\n").map(s => s.trim()).filter(Boolean),
          date: new Date().getFullYear().toString(),
        };
        break;
    }

    if (!item.title) { showToast("Vui lòng nhập tiêu đề", true); return; }

    if (index >= 0) items[index] = item; else items.unshift(item);
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
        if (MODULES[mod]) { moduleData[mod] = data; await DataService.save(mod, data); }
      }
      showToast("Đã nhập dữ liệu thành công!");
      await switchModule(currentModule);
    } catch (err) { showToast("Lỗi đọc file: " + err.message, true); }
    e.target.value = "";
  }

  // ===== OPEN / CLOSE =====
  function openAdmin() {
    buildAdminHTML();
    const root = document.getElementById("adm-root");
    root.classList.add("visible");
    document.body.style.overflow = "hidden";

    const sessionHash = sessionStorage.getItem("gdpt_admin");
    if (sessionHash) {
      adminHash = sessionHash;
      isLoggedIn = true;
      document.getElementById("adm-login").style.display = "none";
      document.getElementById("adm-dashboard").style.display = "flex";
      switchModule("sinhhoat");
    } else {
      document.getElementById("adm-login").style.display = "flex";
      document.getElementById("adm-dashboard").style.display = "none";
      setTimeout(() => document.getElementById("adm-pwd")?.focus(), 300);
    }
  }

  function closeAdmin() {
    const root = document.getElementById("adm-root");
    if (root) {
      root.classList.remove("visible");
      document.body.style.overflow = "";
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

  if (window.location.search.includes("admin")) {
    document.addEventListener("DOMContentLoaded", () => setTimeout(openAdmin, 500));
  }

  window.openGDPTAdmin = openAdmin;
})();
