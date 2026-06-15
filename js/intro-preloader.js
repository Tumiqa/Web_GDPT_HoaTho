/* ============================================================
   GĐPT HÒA THỌ — Cinematic Intro Preloader V6
   2-stage spectacular with sacred geometry, orbs, light rays
   Total duration: ~10s
   ============================================================ */

(function () {
  "use strict";

  const p = window.location.pathname;
  const isHome = p.endsWith("index.html") || p.endsWith("/") || p === "" || p.split("/").pop() === "";

  // Detect navigation type: only show intro on reload or direct access
  // Skip intro when navigating from another page on the same site
  const navEntry = performance.getEntriesByType("navigation")[0];
  const navType = navEntry ? navEntry.type : "navigate";
  const referrer = document.referrer;
  const sameOrigin = referrer && new URL(referrer, location.href).origin === location.origin;
  const fromOtherPage = sameOrigin && navType === "navigate";

  const showIntro = isHome && !fromOtherPage;

  if (!showIntro) {
    const el = document.getElementById("intro-preloader");
    if (el) el.remove();
    return;
  }

  window.__introActive = true;

  const regularPreloader = document.getElementById("preloader");
  if (regularPreloader) regularPreloader.style.display = "none";

  // ===== HELPERS =====
  const $ = (id) => document.getElementById(id);
  function anim(el, props, dur = 1000, ease = "cubic-bezier(.16,1,.3,1)", delay = 0) {
    if (!el) return;
    el.style.transition = Object.keys(props)
      .map((p) => `${p} ${dur}ms ${ease} ${delay}ms`)
      .join(",");
    requestAnimationFrame(() => {
      Object.entries(props).forEach(([k, v]) => {
        el.style[k] = v;
      });
    });
  }

  // ===== GOLDEN-GREEN PARTICLE SYSTEM =====
  const cvs = $("intro-particles");
  if (!cvs) return;
  const ctx = cvs.getContext("2d");
  let W, H;
  function resize() {
    W = cvs.width = innerWidth;
    H = cvs.height = innerHeight;
  }
  resize();
  addEventListener("resize", resize);

  let particleAlpha = 1;
  const PCOUNT = Math.min(200, Math.floor(innerWidth / 5));

  class Particle {
    constructor() { this.init(); }
    init() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.z = Math.random() * 600 + 200;
      this.size = Math.random() * 1.5 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.2;
      this.vy = (Math.random() - 0.5) * 0.2;
      this.vz = -(Math.random() * 0.5 + 0.1);
      this.hue = 140 + Math.random() * 20;
      this.lightness = 50 + Math.random() * 25;
      this.twinkleSpeed = Math.random() * 0.015 + 0.003;
      this.twinkleOffset = Math.random() * Math.PI * 2;
    }
    update(t) {
      this.x += this.vx;
      this.y += this.vy;
      this.z += this.vz;
      if (this.z < 1 || this.x < -50 || this.x > W + 50 || this.y < -50 || this.y > H + 50) {
        this.init();
      }
    }
    draw(t) {
      const scale = 400 / (400 + this.z);
      const sx = (this.x - W / 2) * scale + W / 2;
      const sy = (this.y - H / 2) * scale + H / 2;
      const r = this.size * scale;
      const twinkle = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * this.twinkleSpeed + this.twinkleOffset));
      const alpha = scale * twinkle * particleAlpha;
      if (alpha < 0.01) return;

      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(r, 0.3), 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue},50%,${this.lightness}%,${alpha})`;
      ctx.fill();

      if (r > 0.8) {
        ctx.beginPath();
        ctx.arc(sx, sy, r * 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue},60%,65%,${alpha * 0.08})`;
        ctx.fill();
      }
    }
  }

  const particles = Array.from({ length: PCOUNT }, () => new Particle());
  let fc = 0;
  let animating = true;

  function renderParticles() {
    if (!animating) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgb(6,11,8)";
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "screen";
    particles.forEach((p) => { p.update(fc); p.draw(fc); });
    fc++;
    requestAnimationFrame(renderParticles);
  }
  renderParticles();

  // ===== TYPEWRITER =====
  const twText = "Bi · Trí · Dũng";
  let twI = 0;
  function typeWrite() {
    const el = $("intro-typewriter");
    if (!el) return;
    if (twI <= twText.length) {
      el.textContent = twText.substring(0, twI);
      twI++;
      setTimeout(typeWrite, 100);
    } else {
      setTimeout(() => { el.style.borderColor = "transparent"; }, 1200);
    }
  }

  // ===== DIRECTOR'S TIMELINE V6 (~10s) =====
  function runTimeline() {

    // == Open letterbox (0.5s) ==
    setTimeout(() => {
      const lbT = $("intro-lb-top");
      const lbB = $("intro-lb-bot");
      if (lbT) lbT.classList.add("open");
      if (lbB) lbB.classList.add("open");
    }, 500);

    // == Scanline fade in (0.3s) ==
    setTimeout(() => {
      anim($("intro-scanline"), { opacity: "1" }, 2000);
    }, 300);

    // == Decorative elements (0.3s) ==
    setTimeout(() => {
      document.querySelectorAll(".intro-deco").forEach((d, i) => {
        d.style.transition = `opacity 2s ease ${i * 150}ms`;
        d.style.opacity = "1";
      });
      document.querySelectorAll(".intro-corner").forEach((c, i) => {
        c.style.transition = `opacity 1.5s cubic-bezier(.16,1,.3,1) ${500 + i * 100}ms`;
        c.style.opacity = "1";
      });
    }, 300);

    // ═══════════════════════════════════════
    // STAGE 1: LOTUS + SACRED GEOMETRY (0.5s - 4s)
    // ═══════════════════════════════════════

    // Sacred rings appear staggered
    setTimeout(() => {
      anim($("intro-ring-1"), { opacity: "0.6" }, 2000, "ease");
    }, 500);
    setTimeout(() => {
      anim($("intro-ring-2"), { opacity: "0.4" }, 2200, "ease");
    }, 800);
    setTimeout(() => {
      anim($("intro-ring-3"), { opacity: "0.3" }, 2500, "ease");
    }, 1100);

    // Light rays appear
    setTimeout(() => {
      anim($("intro-light-rays"), { opacity: "1" }, 2500, "ease");
    }, 700);

    // Light burst
    setTimeout(() => {
      anim($("intro-light-burst"), {
        opacity: "1",
        transform: "scale(2.5)",
      }, 2500);
    }, 600);

    // Floating orbs appear staggered
    for (let i = 1; i <= 6; i++) {
      setTimeout(() => {
        anim($(`intro-orb-${i}`), { opacity: "0.8" }, 1500, "ease");
      }, 800 + i * 150);
    }

    // Lotus materializes
    setTimeout(() => {
      anim($("intro-lotus-img"), {
        opacity: "1",
        transform: "scale(1)",
        filter: "drop-shadow(0 0 50px rgba(138,176,151,0.5)) brightness(1)",
      }, 2200);
    }, 1000);

    // Lotus subtitle text slides up + fades in
    setTimeout(() => {
      anim($("intro-lotus-text"), {
        opacity: "1",
        transform: "translateX(-50%) translateY(0)",
      }, 1800, "ease");
    }, 2200);

    // ═══════════════════════════════════════
    // STAGE 1→2 TRANSITION: Lotus dissolves (4s)
    // ═══════════════════════════════════════
    setTimeout(() => {
      // Fade lotus
      anim($("intro-lotus-img"), {
        opacity: "0",
        transform: "scale(1.1)",
        filter: "drop-shadow(0 0 80px rgba(138,176,151,0.7)) brightness(1.8)",
      }, 1200, "ease");

      // Fade lotus text
      anim($("intro-lotus-text"), {
        opacity: "0",
        transform: "translateX(-50%) translateY(-10px)",
      }, 800, "ease");

      // Fade light burst
      anim($("intro-light-burst"), {
        opacity: "0",
        transform: "scale(4)",
      }, 1200, "ease");

      // Fade sacred rings
      anim($("intro-ring-1"), { opacity: "0" }, 1000, "ease");
      anim($("intro-ring-2"), { opacity: "0" }, 1000, "ease");
      anim($("intro-ring-3"), { opacity: "0" }, 1000, "ease");

      // Fade light rays
      anim($("intro-light-rays"), { opacity: "0" }, 1000, "ease");

      // Fade orbs
      for (let i = 1; i <= 6; i++) {
        anim($(`intro-orb-${i}`), { opacity: "0" }, 800, "ease");
      }
    }, 4000);

    // ═══════════════════════════════════════
    // STAGE 2: LOGO + SCOUTS + TITLE (5s - 8.5s)
    // ═══════════════════════════════════════
    setTimeout(() => {
      const stg1 = $("intro-stage-lotus");
      if (stg1) stg1.style.display = "none";

      // Show separator
      const sep = $("intro-sep");
      if (sep) {
        sep.style.transition = "opacity 1.5s ease 0.3s";
        sep.style.opacity = "1";
      }

      // Logo glow + halo
      anim($("intro-glow-ring"), { opacity: "1", transform: "scale(1.8)" }, 1800);
      anim($("intro-halo-ring"), { opacity: "0.6" }, 1600);

      // Logo reveals
      anim($("intro-logo-img"), {
        opacity: "1",
        transform: "scale(1) translateY(0)",
        filter: "drop-shadow(0 0 40px rgba(138,176,151,0.5)) brightness(1)",
      }, 1600);

      // Organization name slides up + fades in
      setTimeout(() => {
        anim($("intro-org-name"), {
          opacity: "1",
          transform: "translateY(0)",
        }, 1500, "cubic-bezier(.16,1,.3,1)");
      }, 500);

      // Scouts appear with slight delay
      setTimeout(() => {
        anim($("intro-scouts-img"), {
          opacity: "1",
          transform: "scale(1) translateY(0)",
        }, 1800);
      }, 600);

      // Start typewriter
      setTimeout(() => {
        const tw = $("intro-typewriter");
        if (tw) tw.classList.add("typing");
        typeWrite();
      }, 1000);
    }, 5000);

    // ═══════════════════════════════════════
    // FADE OUT (8.5s - 9.5s)
    // ═══════════════════════════════════════
    setTimeout(() => {
      // Fade logo
      anim($("intro-logo-img"), {
        opacity: "0",
        filter: "drop-shadow(0 0 40px rgba(138,176,151,0.5)) brightness(1.5)",
      }, 1000, "ease");
      anim($("intro-glow-ring"), { opacity: "0" }, 800, "ease");
      anim($("intro-halo-ring"), { opacity: "0" }, 800, "ease");

      // Fade org name
      anim($("intro-org-name"), {
        opacity: "0",
        transform: "translateY(-10px)",
      }, 800, "ease");

      // Fade scouts
      anim($("intro-scouts-img"), {
        opacity: "0",
        transform: "scale(1.03)",
        filter: "drop-shadow(0 0 40px rgba(138,176,151,0.5)) brightness(1.5)",
      }, 1000, "ease");

      // Fade decoratives
      document.querySelectorAll(".intro-deco,.intro-corner").forEach((e) => {
        anim(e, { opacity: "0" }, 800, "ease");
      });
      anim($("intro-sep"), { opacity: "0" }, 600, "ease");
      anim($("intro-typewriter"), { opacity: "0" }, 600, "ease");
      anim($("intro-scanline"), { opacity: "0" }, 600, "ease");
    }, 8500);

    // Final overlay
    setTimeout(() => {
      anim($("intro-final"), { opacity: "1" }, 1000, "ease");
      particleAlpha = 0;
    }, 9200);

    // Cleanup — reveal main page
    setTimeout(() => {
      const intro = $("intro-preloader");
      if (intro) intro.style.display = "none";
      animating = false;
      document.body.classList.remove("loading");
      window.__introActive = false;
      if (regularPreloader) regularPreloader.style.display = "none";
      if (typeof animateHero === "function") animateHero();
    }, 10500);
  }

  // ===== KICK OFF =====
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runTimeline);
  } else {
    runTimeline();
  }
})();
