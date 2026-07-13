/* ============================================================
   GĐPT HÒA THỌ — Login Page JavaScript
   Handles: form submission, password toggle, error display
   ============================================================ */

(function () {
  "use strict";

  const AUTH_URL = "auth.php";

  // Wait for DOM + Lucide icons
  document.addEventListener("DOMContentLoaded", () => {
    // Initialize Lucide icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    } else {
      // Retry after a short delay if lucide hasn't loaded yet
      setTimeout(() => {
        if (typeof lucide !== "undefined") lucide.createIcons();
      }, 500);
    }

    initLogin();
  });

  function initLogin() {
    const form = document.getElementById("login-form");
    const usernameInput = document.getElementById("login-username");
    const passwordInput = document.getElementById("login-password");
    const togglePwBtn = document.getElementById("toggle-password");
    const errorEl = document.getElementById("login-error");
    const submitBtn = document.getElementById("login-btn");

    if (!form) return;

    // ===== Check if already logged in =====
    checkExistingSession();

    // ===== Form Submit =====
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearError();

      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      if (!username) {
        showError("Vui lòng nhập tên đăng nhập");
        usernameInput.focus();
        return;
      }
      if (!password) {
        showError("Vui lòng nhập mật khẩu");
        passwordInput.focus();
        return;
      }

      setLoading(true);

      try {
        const res = await fetch(`${AUTH_URL}?action=login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          // Success — show brief success state then redirect
          submitBtn.classList.add("success");
          submitBtn.querySelector(".login-btn__text").textContent = "Thành công!";

          // Redirect after short delay
          setTimeout(() => {
            const redirectUrl = getRedirectUrl();
            window.location.href = redirectUrl;
          }, 600);
        } else {
          showError(data.error || "Đăng nhập thất bại");
          setLoading(false);
          // Shake the card
          const card = document.getElementById("login-card");
          card.style.animation = "none";
          card.offsetHeight; // Trigger reflow
          card.style.animation = "";
        }
      } catch (err) {
        showError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
        setLoading(false);
        console.error("Login error:", err);
      }
    });

    // ===== Password Toggle =====
    if (togglePwBtn) {
      togglePwBtn.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";
        passwordInput.type = isPassword ? "text" : "password";

        const showIcon = togglePwBtn.querySelector(".icon-show");
        const hideIcon = togglePwBtn.querySelector(".icon-hide");
        if (showIcon) showIcon.style.display = isPassword ? "none" : "";
        if (hideIcon) hideIcon.style.display = isPassword ? "" : "none";
      });
    }

    // ===== Clear error on input =====
    [usernameInput, passwordInput].forEach((input) => {
      input.addEventListener("input", () => {
        clearError();
        input.closest(".login-field")?.classList.remove("has-error");
      });
    });

    // ===== Enter key handling =====
    usernameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        passwordInput.focus();
      }
    });

    // ===== Helper Functions =====
    function showError(message) {
      errorEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>${escapeHtml(message)}</span>`;
      errorEl.classList.add("visible");

      // Mark fields as error
      document.getElementById("field-username")?.classList.add("has-error");
      document.getElementById("field-password")?.classList.add("has-error");
    }

    function clearError() {
      errorEl.classList.remove("visible");
      errorEl.innerHTML = "";
    }

    function setLoading(loading) {
      submitBtn.disabled = loading;
      const textEl = submitBtn.querySelector(".login-btn__text");
      const loadingEl = submitBtn.querySelector(".login-btn__loading");
      const iconEl = submitBtn.querySelector(".login-btn__icon");

      if (loading) {
        if (textEl) textEl.style.display = "none";
        if (loadingEl) loadingEl.style.display = "";
        if (iconEl) iconEl.style.display = "none";
      } else {
        if (textEl) { textEl.style.display = ""; textEl.textContent = "Đăng nhập"; }
        if (loadingEl) loadingEl.style.display = "none";
        if (iconEl) iconEl.style.display = "";
      }
    }

    function getRedirectUrl() {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      // Only allow same-origin redirects
      if (redirect && redirect.startsWith("/")) {
        return redirect;
      }
      return "/?admin";
    }

    function escapeHtml(str) {
      return (str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }
  }

  // ===== Check Existing Session =====
  async function checkExistingSession() {
    try {
      const res = await fetch(`${AUTH_URL}?action=me`, {
        credentials: "same-origin",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          // Already logged in — redirect
          const params = new URLSearchParams(window.location.search);
          const redirect = params.get("redirect");
          window.location.href = redirect && redirect.startsWith("/") ? redirect : "/?admin";
        }
      }
    } catch (e) {
      // Ignore — user is not logged in
    }
  }
})();
