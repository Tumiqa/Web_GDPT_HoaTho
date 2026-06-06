/* ============================================================
   GĐPT HÒA THỌ — Admin Panel Engine
   Client-side CMS: CRUD cho sinh hoạt, nhạc, tài liệu, kỹ năng
   Lưu qua api.php (server) hoặc export JSON (offline)
   ============================================================ */

(function () {
  "use strict";

  // ===== CONFIG =====
  const API_URL = "api.php";
  const MODULES = {
    sinhhoat: { label: "Sinh Hoạt", icon: "📸" },
    nhac: { label: "Nhạc", icon: "🎵" },
    tailieu: { label: "Tài Liệu", icon: "📚" },
    kynang: { label: "Kỹ Năng", icon: "🧭" },
    bachoc: { label: "Bậc Học", icon: "🎓" },
    config: { label: "Cấu Hình", icon: "⚙️" },
  };

  let isLoggedIn = false;
  let adminHash = "";
  let currentModule = "sinhhoat";
  let moduleData = {};

  // ===== SHA-256 HASH =====
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // ===== DATA SERVICE =====
  const DataService = {
    async fetch(module) {
      try {
        const res = await fetch(`${API_URL}?module=${module}`);
        if (res.ok) return await res.json();
      } catch (e) {
        // API not available, try direct JSON file
      }
      try {
        const res = await fetch(`data/${module}.json`);
        if (res.ok) return await res.json();
      } catch (e) {}
      return null;
    },

    async save(module, data) {
      // Try API first
      try {
        const res = await fetch(`${API_URL}?module=${module}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Token": adminHash,
          },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const result = await res.json();
          if (result.success) return { success: true, method: "server" };
        }
      } catch (e) {}

      // Fallback: save to localStorage + offer download
      localStorage.setItem(`gdpt_${module}`, JSON.stringify(data));
      return { success: true, method: "local" };
    },
  };

  // Export DataService globally for other scripts to use
  window.GDPTData = DataService;

  // ===== BUILD ADMIN UI =====
  function buildAdminHTML() {
    // Check if already exists
    if (document.getElementById("admin-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "admin-overlay";
    overlay.className = "admin-overlay";
    overlay.innerHTML = `
      <!-- Login View -->
      <div class="admin-login" id="admin-login-view">
        <div class="admin-login__logo">🔐</div>
        <h2>Admin Panel</h2>
        <p>Nhập mật khẩu để truy cập quản trị nội dung</p>
        <input type="password" class="admin-login__input" id="admin-password" placeholder="Mật khẩu..." autocomplete="off" />
        <button class="admin-login__btn" id="admin-login-btn">Đăng nhập</button>
        <div class="admin-login__error" id="admin-login-error"></div>
      </div>

      <!-- Dashboard View (hidden initially) -->
      <div class="admin-dashboard" id="admin-dashboard-view" style="display:none;">
        <div class="admin-header">
          <h2>⚙️ Quản Trị Nội Dung</h2>
          <div class="admin-header__actions">
            <button class="admin-btn-icon" id="admin-btn-export" title="Xuất dữ liệu JSON">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button class="admin-btn-icon" id="admin-btn-import" title="Nhập dữ liệu JSON">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </button>
            <button class="admin-btn-icon" id="admin-btn-close" title="Đóng">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div class="admin-tabs" id="admin-tabs"></div>
        <div class="admin-content" id="admin-content"></div>

        <!-- Form overlay (inside dashboard) -->
        <div class="admin-form-overlay" id="admin-form-overlay"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Hidden file input for import
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";
    fileInput.id = "admin-import-input";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    // Toast
    const toast = document.createElement("div");
    toast.id = "admin-toast";
    toast.className = "admin-toast";
    document.body.appendChild(toast);

    initAdminEvents();
    buildTabs();
  }

  // ===== INIT EVENTS =====
  function initAdminEvents() {
    // Login
    const loginBtn = document.getElementById("admin-login-btn");
    const passwordInput = document.getElementById("admin-password");

    loginBtn.addEventListener("click", handleLogin);
    passwordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleLogin();
    });

    // Close
    document.getElementById("admin-btn-close").addEventListener("click", closeAdmin);

    // Export
    document.getElementById("admin-btn-export").addEventListener("click", exportAllData);

    // Import
    document.getElementById("admin-btn-import").addEventListener("click", () => {
      document.getElementById("admin-import-input").click();
    });
    document.getElementById("admin-import-input").addEventListener("change", importData);

    // Close on overlay click
    document.getElementById("admin-overlay").addEventListener("click", (e) => {
      if (e.target.id === "admin-overlay") closeAdmin();
    });

    // Close on Esc
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const formOverlay = document.getElementById("admin-form-overlay");
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
    const password = document.getElementById("admin-password").value;
    const errorEl = document.getElementById("admin-login-error");

    if (!password) {
      errorEl.textContent = "Vui lòng nhập mật khẩu";
      return;
    }

    const hash = await sha256(password);

    // Verify against config
    const config = await DataService.fetch("config");
    if (!config || hash !== config.adminPasswordHash) {
      errorEl.textContent = "Mật khẩu không đúng";
      return;
    }

    adminHash = hash;
    isLoggedIn = true;
    sessionStorage.setItem("gdpt_admin", hash);

    // Switch to dashboard
    document.getElementById("admin-login-view").style.display = "none";
    document.getElementById("admin-dashboard-view").style.display = "flex";

    // Load first module
    await switchModule("sinhhoat");
  }

  // ===== TABS =====
  function buildTabs() {
    const tabsContainer = document.getElementById("admin-tabs");
    tabsContainer.innerHTML = "";

    Object.entries(MODULES).forEach(([key, mod]) => {
      const btn = document.createElement("button");
      btn.className = `admin-tab${key === currentModule ? " active" : ""}`;
      btn.dataset.module = key;
      btn.textContent = `${mod.icon} ${mod.label}`;
      btn.addEventListener("click", () => switchModule(key));
      tabsContainer.appendChild(btn);
    });
  }

  // ===== SWITCH MODULE =====
  async function switchModule(module) {
    currentModule = module;

    // Update tabs
    document.querySelectorAll(".admin-tab").forEach((t) => {
      t.classList.toggle("active", t.dataset.module === module);
    });

    // Load data
    const data = await DataService.fetch(module);
    moduleData[module] = data;

    renderModule(module, data);
  }

  // ===== RENDER MODULE =====
  function renderModule(module, data) {
    const content = document.getElementById("admin-content");

    if (module === "config") {
      renderConfigModule(data);
      return;
    }

    if (module === "bachoc") {
      renderBacHocModule(data);
      return;
    }

    // Generic list module
    const items = Array.isArray(data) ? data : [];
    const mod = MODULES[module];

    content.innerHTML = `
      <div class="admin-module-header">
        <h3>${mod.icon} ${mod.label} (${items.length} mục)</h3>
        <button class="admin-btn-add" id="admin-add-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Thêm mới
        </button>
      </div>
      <div class="admin-item-list" id="admin-items"></div>
    `;

    const itemsContainer = document.getElementById("admin-items");

    if (items.length === 0) {
      itemsContainer.innerHTML = `
        <div class="admin-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <p>Chưa có dữ liệu. Nhấn "Thêm mới" để bắt đầu.</p>
        </div>
      `;
    } else {
      items.forEach((item, idx) => {
        const title = item.title || item.name || `Mục ${idx + 1}`;
        const meta = getItemMeta(module, item);
        const el = document.createElement("div");
        el.className = "admin-item";
        el.innerHTML = `
          <div class="admin-item__info">
            <div class="admin-item__title">${escapeHTML(title)}</div>
            <div class="admin-item__meta">${escapeHTML(meta)}</div>
          </div>
          <div class="admin-item__actions">
            <button class="admin-item__btn" data-action="edit" data-index="${idx}" title="Sửa">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="admin-item__btn admin-item__btn--delete" data-action="delete" data-index="${idx}" title="Xóa">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        `;
        itemsContainer.appendChild(el);
      });

      // Delegate clicks
      itemsContainer.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;
        const action = btn.dataset.action;
        const index = parseInt(btn.dataset.index);
        if (action === "edit") openForm(module, index);
        if (action === "delete") deleteItem(module, index);
      });
    }

    // Add button
    document.getElementById("admin-add-btn").addEventListener("click", () => openForm(module, -1));
  }

  function getItemMeta(module, item) {
    switch (module) {
      case "sinhhoat": return `${item.year || ""} · ${(item.tags || []).join(", ")}`;
      case "nhac": return `${item.artist || ""} · ${item.duration || ""}`;
      case "tailieu": return `${item.category || ""} · ${item.fileType || ""}`;
      case "kynang": return `${item.category || ""} · ${item.date || ""}`;
      default: return "";
    }
  }

  // ===== CONFIG MODULE =====
  function renderConfigModule(data) {
    const content = document.getElementById("admin-content");
    if (!data) data = {};

    content.innerHTML = `
      <div class="admin-module-header"><h3>⚙️ Cấu Hình Website</h3></div>
      <div class="admin-item-list">
        <div class="admin-form-group">
          <label>Tên website</label>
          <input type="text" id="cfg-siteName" value="${escapeAttr(data.siteName || "")}" />
        </div>
        <div class="admin-form-group">
          <label>Châm ngôn</label>
          <input type="text" id="cfg-motto" value="${escapeAttr(data.motto || "")}" />
        </div>
        <div class="admin-form-group">
          <label>Email</label>
          <input type="email" id="cfg-email" value="${escapeAttr(data.email || "")}" />
        </div>
        <div class="admin-form-group">
          <label>Link Facebook</label>
          <input type="url" id="cfg-facebook" value="${escapeAttr(data.facebook || "")}" />
        </div>
        <div class="admin-form-group">
          <label>Địa chỉ</label>
          <input type="text" id="cfg-address" value="${escapeAttr(data.address || "")}" />
        </div>
        <div class="admin-form__btns">
          <button class="admin-btn-save" id="cfg-save-btn">Lưu cấu hình</button>
        </div>
      </div>
    `;

    document.getElementById("cfg-save-btn").addEventListener("click", async () => {
      data.siteName = document.getElementById("cfg-siteName").value;
      data.motto = document.getElementById("cfg-motto").value;
      data.email = document.getElementById("cfg-email").value;
      data.facebook = document.getElementById("cfg-facebook").value;
      data.address = document.getElementById("cfg-address").value;

      const result = await DataService.save("config", data);
      showToast(result.success ? "Đã lưu cấu hình!" : "Lỗi khi lưu", !result.success);
      if (result.method === "local") {
        showToast("Đã lưu tạm vào trình duyệt. Hãy Export JSON để cập nhật lên server.", false);
      }
    });
  }

  // ===== BAC HOC MODULE =====
  function renderBacHocModule(data) {
    const content = document.getElementById("admin-content");
    if (!data || !data.nganh) {
      content.innerHTML = `<div class="admin-empty"><p>Không có dữ liệu bậc học.</p></div>`;
      return;
    }

    let html = `<div class="admin-module-header"><h3>🎓 Bậc Học & Ngành Đoàn</h3></div>`;

    data.nganh.forEach((nganh, ni) => {
      html += `
        <div class="admin-item" style="flex-direction: column; align-items: stretch; gap: 0.5rem; margin-bottom: 1rem;">
          <div class="admin-item__title" style="font-size: 1rem;">${nganh.emoji} ${escapeHTML(nganh.name)}</div>
          <div class="admin-form-group" style="margin-bottom: 0;">
            <label>Mô tả ngành</label>
            <textarea id="bachoc-desc-${ni}" rows="2">${escapeHTML(nganh.description)}</textarea>
          </div>
          ${nganh.bacHoc.map((bac, bi) => `
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <input type="text" value="${escapeAttr(bac.name)}" id="bachoc-${ni}-${bi}-name" style="flex: 0 0 120px;" />
              <input type="text" value="${escapeAttr(bac.description)}" id="bachoc-${ni}-${bi}-desc" style="flex: 1;" />
            </div>
          `).join("")}
        </div>
      `;
    });

    html += `
      <div class="admin-form__btns">
        <button class="admin-btn-save" id="bachoc-save-btn">Lưu bậc học</button>
      </div>
    `;

    content.innerHTML = html;

    document.getElementById("bachoc-save-btn").addEventListener("click", async () => {
      data.nganh.forEach((nganh, ni) => {
        nganh.description = document.getElementById(`bachoc-desc-${ni}`).value;
        nganh.bacHoc.forEach((bac, bi) => {
          bac.name = document.getElementById(`bachoc-${ni}-${bi}-name`).value;
          bac.description = document.getElementById(`bachoc-${ni}-${bi}-desc`).value;
        });
      });

      const result = await DataService.save("bachoc", data);
      showToast(result.success ? "Đã lưu bậc học!" : "Lỗi khi lưu", !result.success);
    });
  }

  // ===== FORM: OPEN =====
  function openForm(module, index) {
    const overlay = document.getElementById("admin-form-overlay");
    const isEdit = index >= 0;
    const items = moduleData[module] || [];
    const item = isEdit ? items[index] : {};

    let formHTML = "";

    switch (module) {
      case "sinhhoat":
        formHTML = `
          <h3>${isEdit ? "✏️ Sửa bài viết" : "➕ Thêm bài viết"}</h3>
          <div class="admin-form-group"><label>Tiêu đề</label><input type="text" id="form-title" value="${escapeAttr(item.title || "")}" placeholder="Ví dụ: Trại Họp Bạn Diệu Định 2025" /></div>
          <div class="admin-form-group"><label>Năm</label><input type="text" id="form-year" value="${escapeAttr(item.year || new Date().getFullYear().toString())}" placeholder="2025" /></div>
          <div class="admin-form-group"><label>Ngày hiển thị</label><input type="text" id="form-date" value="${escapeAttr(item.date || "")}" placeholder="Tháng 5, 2026" /></div>
          <div class="admin-form-group"><label>Nội dung</label><textarea id="form-content" placeholder="Mô tả chi tiết về sự kiện...">${escapeHTML(item.content || "")}</textarea></div>
          <div class="admin-form-group"><label>Link video</label><textarea id="form-videos" rows="2" placeholder="Mỗi dòng 1 link YouTube/Drive...">${(item.videos || []).join("\n")}</textarea><small>YouTube, Google Drive hoặc link bất kỳ — hệ thống tự nhận diện</small></div>
          <div class="admin-form-group"><label>Link hình ảnh</label><textarea id="form-images" rows="2" placeholder="Mỗi dòng 1 URL ảnh...">${(item.images || []).join("\n")}</textarea><small>URL ảnh trực tiếp hoặc đường dẫn trong project (images/...)</small></div>
          <div class="admin-form-group"><label>Tags</label><input type="text" id="form-tags" value="${(item.tags || []).join(", ")}" placeholder="Tag1, Tag2, Tag3" /><small>Phân cách bằng dấu phẩy</small></div>
        `;
        break;

      case "nhac":
        formHTML = `
          <h3>${isEdit ? "✏️ Sửa bài nhạc" : "➕ Thêm bài nhạc"}</h3>
          <div class="admin-form-group"><label>Tên bài hát</label><input type="text" id="form-title" value="${escapeAttr(item.title || "")}" /></div>
          <div class="admin-form-group"><label>Nghệ sĩ / Thể loại</label><input type="text" id="form-artist" value="${escapeAttr(item.artist || "Nhạc GĐPT")}" /></div>
          <div class="admin-form-group"><label>Link MP3</label><input type="url" id="form-src" value="${escapeAttr(item.src || "")}" placeholder="https://archive.org/download/..." /><small>Archive.org, Google Drive hoặc URL MP3 trực tiếp</small></div>
          <div class="admin-form-group"><label>Thời lượng</label><input type="text" id="form-duration" value="${escapeAttr(item.duration || "")}" placeholder="3:45" /></div>
        `;
        break;

      case "tailieu":
        formHTML = `
          <h3>${isEdit ? "✏️ Sửa tài liệu" : "➕ Thêm tài liệu"}</h3>
          <div class="admin-form-group"><label>Tên tài liệu</label><input type="text" id="form-title" value="${escapeAttr(item.title || "")}" /></div>
          <div class="admin-form-group"><label>Mô tả</label><textarea id="form-description" rows="3">${escapeHTML(item.description || "")}</textarea></div>
          <div class="admin-form-group"><label>Danh mục</label>
            <select id="form-category">
              ${["Phật Pháp", "Giáo Án", "Kỹ Năng", "Sách Tham Khảo", "Khác"].map(c => `<option value="${c}" ${item.category === c ? "selected" : ""}>${c}</option>`).join("")}
            </select>
          </div>
          <div class="admin-form-group"><label>Link tài liệu</label><input type="url" id="form-url" value="${escapeAttr(item.url || "")}" placeholder="https://drive.google.com/..." /><small>Google Drive, PDF URL, hoặc link tải</small></div>
          <div class="admin-form-group"><label>Loại file</label>
            <select id="form-fileType">
              ${["pdf", "doc", "ppt", "link", "video"].map(t => `<option value="${t}" ${item.fileType === t ? "selected" : ""}>${t.toUpperCase()}</option>`).join("")}
            </select>
          </div>
        `;
        break;

      case "kynang":
        formHTML = `
          <h3>${isEdit ? "✏️ Sửa bài kỹ năng" : "➕ Thêm bài kỹ năng"}</h3>
          <div class="admin-form-group"><label>Tiêu đề</label><input type="text" id="form-title" value="${escapeAttr(item.title || "")}" /></div>
          <div class="admin-form-group"><label>Chủ đề</label>
            <select id="form-category">
              ${["Kết Dây", "Morse", "Dựng Trại", "Cứu Thương", "La Bàn", "Trò Chơi", "Khác"].map(c => `<option value="${c}" ${item.category === c ? "selected" : ""}>${c}</option>`).join("")}
            </select>
          </div>
          <div class="admin-form-group"><label>Nội dung</label><textarea id="form-content" rows="5">${escapeHTML(item.content || "")}</textarea></div>
          <div class="admin-form-group"><label>Link video</label><textarea id="form-videos" rows="2" placeholder="Mỗi dòng 1 link...">${(item.videos || []).join("\n")}</textarea></div>
          <div class="admin-form-group"><label>Link hình ảnh</label><textarea id="form-images" rows="2" placeholder="Mỗi dòng 1 URL ảnh...">${(item.images || []).join("\n")}</textarea></div>
        `;
        break;
    }

    formHTML += `
      <div class="admin-form__btns">
        <button class="admin-btn-cancel" id="form-cancel-btn">Hủy</button>
        <button class="admin-btn-save" id="form-save-btn">Lưu</button>
      </div>
    `;

    overlay.innerHTML = `<div class="admin-form">${formHTML}</div>`;
    overlay.classList.add("visible");

    // Events
    document.getElementById("form-cancel-btn").addEventListener("click", () => overlay.classList.remove("visible"));
    document.getElementById("form-save-btn").addEventListener("click", () => saveForm(module, index));
  }

  // ===== FORM: SAVE =====
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
          tags: document.getElementById("form-tags").value.split(",").map(s => s.trim()).filter(Boolean),
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

    if (!item.title) {
      showToast("Vui lòng nhập tiêu đề", true);
      return;
    }

    if (index >= 0) {
      items[index] = item;
    } else {
      items.unshift(item); // Add to beginning
    }

    moduleData[module] = items;
    const result = await DataService.save(module, items);

    document.getElementById("admin-form-overlay").classList.remove("visible");
    renderModule(module, items);

    if (result.method === "local") {
      showToast("Đã lưu tạm! Export JSON để cập nhật server.");
    } else {
      showToast("Đã lưu thành công!");
    }
  }

  // ===== DELETE ITEM =====
  async function deleteItem(module, index) {
    if (!confirm("Bạn có chắc muốn xóa mục này?")) return;

    const items = [...(moduleData[module] || [])];
    items.splice(index, 1);
    moduleData[module] = items;

    const result = await DataService.save(module, items);
    renderModule(module, items);
    showToast("Đã xóa!");
  }

  // ===== EXPORT ALL DATA =====
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

  // ===== IMPORT DATA =====
  async function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const allData = JSON.parse(text);

      for (const [mod, data] of Object.entries(allData)) {
        if (MODULES[mod]) {
          moduleData[mod] = data;
          await DataService.save(mod, data);
        }
      }

      showToast("Đã nhập dữ liệu thành công!");
      await switchModule(currentModule);
    } catch (err) {
      showToast("Lỗi đọc file JSON: " + err.message, true);
    }

    e.target.value = "";
  }

  // ===== HELPERS =====
  function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function showToast(message, isError = false) {
    const toast = document.getElementById("admin-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.className = `admin-toast visible${isError ? " error" : ""}`;
    setTimeout(() => toast.classList.remove("visible"), 3000);
  }

  // ===== OPEN / CLOSE ADMIN =====
  function openAdmin() {
    buildAdminHTML();
    const overlay = document.getElementById("admin-overlay");
    overlay.classList.add("visible");

    // Check if already logged in (session)
    const sessionHash = sessionStorage.getItem("gdpt_admin");
    if (sessionHash) {
      adminHash = sessionHash;
      isLoggedIn = true;
      document.getElementById("admin-login-view").style.display = "none";
      document.getElementById("admin-dashboard-view").style.display = "flex";
      switchModule("sinhhoat");
    } else {
      document.getElementById("admin-login-view").style.display = "";
      document.getElementById("admin-dashboard-view").style.display = "none";
      setTimeout(() => document.getElementById("admin-password")?.focus(), 300);
    }
  }

  function closeAdmin() {
    const overlay = document.getElementById("admin-overlay");
    if (overlay) overlay.classList.remove("visible");
  }

  // ===== ENTRY POINTS =====
  // 1. Click logo footer 5 times in 3 seconds
  let clickCount = 0;
  let clickTimer = null;

  document.addEventListener("click", (e) => {
    const footerLogo = e.target.closest(".logo-circle--footer, .footer-logo-section a");
    if (!footerLogo) return;

    clickCount++;
    if (clickCount === 1) {
      clickTimer = setTimeout(() => { clickCount = 0; }, 3000);
    }

    if (clickCount >= 5) {
      clearTimeout(clickTimer);
      clickCount = 0;
      e.preventDefault();
      openAdmin();
    }
  });

  // 2. Ctrl+Shift+A
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === "A") {
      e.preventDefault();
      openAdmin();
    }
  });

  // 3. ?admin in URL
  if (window.location.search.includes("admin")) {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(openAdmin, 500);
    });
  }

  // Export openAdmin globally
  window.openGDPTAdmin = openAdmin;

})();
