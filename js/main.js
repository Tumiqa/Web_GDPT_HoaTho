/* ============================================================
   GĐPT HÒA THỌ — Main JavaScript
   Shared across all pages: preloader, cursor, header, animations
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // ===== PRELOADER =====
  initPreloader();

  // ===== CUSTOM CURSOR =====
  initCustomCursor();

  // ===== HEADER =====
  initHeader();

  // ===== MOBILE MENU =====
  initMobileMenu();

  // ===== BACK TO TOP =====
  initBackToTop();

  // ===== HERO PARTICLES =====
  initHeroParticles();

  // ===== SCROLL REVEAL ANIMATIONS =====
  initScrollReveal();

  // ===== STATS COUNTER =====
  initStatsCounter();

  // ===== ACTIVE NAV LINK =====
  initActiveNavLink();

  // ===== PAGE TRANSITIONS =====
  initPageTransitions();

  // ===== ABOUT 3D TILT =====
  initAbout3DTilt();

  // ===== TAGLINE TYPEWRITER =====
  initTaglineTypewriter();

  // ===== LUCIDE ICONS =====
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
});

/* =====================
   PRELOADER
   ===================== */
function initPreloader() {
  const preloader = document.getElementById("preloader");
  const fill = document.getElementById("preloader-fill");
  const percent = document.getElementById("preloader-percent");

  if (!preloader) {
    document.body.classList.remove("loading");
    return;
  }

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15 + 5;
    if (progress > 100) progress = 100;

    if (fill) fill.style.width = progress + "%";
    if (percent) percent.textContent = Math.round(progress) + "%";

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        preloader.classList.add("hidden");
        document.body.classList.remove("loading");

        // Trigger hero animations after preloader
        animateHero();

        setTimeout(() => {
          preloader.style.display = "none";
        }, 800);
      }, 400);
    }
  }, 120);
}

/* =====================
   HERO ANIMATION
   ===================== */
function animateHero() {
  if (typeof gsap === "undefined") return;

  const heroTitle = document.getElementById("hero-title");
  const heroSubtitle = document.getElementById("hero-subtitle");
  const heroMotto = document.getElementById("hero-motto");
  const heroCta = document.getElementById("hero-cta");
  const scrollIndicator = document.getElementById("scroll-down-indicator");

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  if (heroTitle) {
    tl.fromTo(heroTitle,
      { opacity: 0, y: 40, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 1.2 }
    );
  }
  if (heroSubtitle) {
    tl.fromTo(heroSubtitle,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8 },
      "-=0.6"
    );
  }
  if (heroMotto) {
    tl.fromTo(heroMotto,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8 },
      "-=0.4"
    );
  }
  if (heroCta) {
    tl.fromTo(heroCta,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6 },
      "-=0.3"
    );
  }
  if (scrollIndicator) {
    tl.fromTo(scrollIndicator,
      { opacity: 0 },
      { opacity: 0.7, duration: 0.6 },
      "-=0.2"
    );
  }
}

/* =====================
   CUSTOM CURSOR
   ===================== */
function initCustomCursor() {
  const dot = document.querySelector(".cursor-dot");
  const outline = document.querySelector(".cursor-outline");

  if (!dot || !outline || window.innerWidth < 1024) return;

  let mouseX = 0, mouseY = 0;
  let outlineX = 0, outlineY = 0;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + "px";
    dot.style.top = mouseY + "px";
  });

  function animateOutline() {
    outlineX += (mouseX - outlineX) * 0.15;
    outlineY += (mouseY - outlineY) * 0.15;
    outline.style.left = outlineX + "px";
    outline.style.top = outlineY + "px";
    requestAnimationFrame(animateOutline);
  }
  animateOutline();

  // Hover effect on interactive elements
  const hoverElements = document.querySelectorAll("a, button, .card, .highlight-card, .card-overlay");
  hoverElements.forEach((el) => {
    el.addEventListener("mouseenter", () => outline.classList.add("hover"));
    el.addEventListener("mouseleave", () => outline.classList.remove("hover"));
  });
}

/* =====================
   HEADER SCROLL
   ===================== */
function initHeader() {
  const header = document.getElementById("main-header");
  if (!header) return;

  let lastScroll = 0;

  window.addEventListener("scroll", () => {
    const currentScroll = window.scrollY;

    if (currentScroll > 80) {
      header.classList.add("header-scrolled");
    } else {
      header.classList.remove("header-scrolled");
    }

    // Auto-hide header on scroll down, show on scroll up
    if (currentScroll > 600 && currentScroll > lastScroll) {
      header.style.transform = "translateY(-100%)";
    } else {
      header.style.transform = "translateY(0)";
    }

    lastScroll = currentScroll;
  });
}

/* =====================
   MOBILE MENU
   ===================== */
function initMobileMenu() {
  const btn = document.getElementById("mobile-menu-button");
  const menu = document.getElementById("mobile-menu");

  if (!btn || !menu) return;

  btn.addEventListener("click", () => {
    menu.classList.toggle("hidden");
    // Toggle icon between menu and X
    const icon = btn.querySelector("i");
    if (icon) {
      const isOpen = !menu.classList.contains("hidden");
      icon.setAttribute("data-lucide", isOpen ? "x" : "menu");
      if (typeof lucide !== "undefined") lucide.createIcons();
    }
  });

  // Close menu on link click
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.add("hidden");
      const icon = btn.querySelector("i");
      if (icon) {
        icon.setAttribute("data-lucide", "menu");
        if (typeof lucide !== "undefined") lucide.createIcons();
      }
    });
  });
}

/* =====================
   BACK TO TOP
   ===================== */
function initBackToTop() {
  const btn = document.getElementById("back-to-top");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 500) {
      btn.classList.add("show");
    } else {
      btn.classList.remove("show");
    }
  });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* =====================
   HERO PARTICLES
   ===================== */
function initHeroParticles() {
  const layer = document.getElementById("hero-particles");
  if (!layer || window.innerWidth < 768) return;

  const count = 25;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");
    particle.classList.add("hero-particle");
    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDuration = (Math.random() * 8 + 6) + "s";
    particle.style.animationDelay = (Math.random() * 10) + "s";
    particle.style.width = (Math.random() * 3 + 1) + "px";
    particle.style.height = particle.style.width;
    particle.style.opacity = Math.random() * 0.4 + 0.1;
    layer.appendChild(particle);
  }
}

/* =====================
   SCROLL REVEAL
   ===================== */
function initScrollReveal() {
  const reveals = document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale");
  if (reveals.length === 0) return;

  // Use GSAP ScrollTrigger if available
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);

    reveals.forEach((el, i) => {
      const isLeft = el.classList.contains("reveal-left");
      const isRight = el.classList.contains("reveal-right");
      const isScale = el.classList.contains("reveal-scale");

      const fromVars = { opacity: 0 };
      if (isLeft) fromVars.x = -60;
      else if (isRight) fromVars.x = 60;
      else if (isScale) fromVars.scale = 0.9;
      else fromVars.y = 50;

      const toVars = {
        opacity: 1, x: 0, y: 0, scale: 1,
        duration: 0.8,
        ease: "power3.out",
        delay: (i % 3) * 0.15,
        clearProps: "will-change",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none",
          once: true,
        }
      };

      gsap.fromTo(el, fromVars, toVars);
    });
  } else {
    // Fallback: IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

    reveals.forEach((el) => observer.observe(el));
  }
}

/* =====================
   STATS COUNTER
   ===================== */
function initStatsCounter() {
  const statNumbers = document.querySelectorAll("[data-count]");
  if (statNumbers.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute("data-count"));
        const suffix = el.getAttribute("data-suffix") || "";
        const duration = 2000;
        const startTime = performance.now();

        function updateCount(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(target * eased);
          el.textContent = current + suffix;

          if (progress < 1) {
            requestAnimationFrame(updateCount);
          }
        }

        requestAnimationFrame(updateCount);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach((el) => observer.observe(el));
}

/* =====================
   ACTIVE NAV LINK
   ===================== */
function initActiveNavLink() {
  // For same-page scroll nav
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link, .nav-link-mobile");

  if (sections.length === 0 || navLinks.length === 0) return;

  window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === "#" + current) {
        link.classList.add("active");
      }
    });
  });

  // For multi-page nav: highlight based on current page
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href && href === currentPage) {
      link.classList.add("active");
    }
  });
}

/* =====================
   PAGE TRANSITIONS
   ===================== */
function initPageTransitions() {
  const overlay = document.querySelector(".page-transition-overlay");
  if (!overlay) return;

  // Internal links get smooth transitions
  const internalLinks = document.querySelectorAll('a[href$=".html"]');
  internalLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) return;

      e.preventDefault();
      overlay.classList.add("active");

      setTimeout(() => {
        window.location.href = href;
      }, 400);
    });
  });

  // Fade in on page load
  window.addEventListener("load", () => {
    overlay.classList.remove("active");
  });
}

/* =====================
   ABOUT 3D TILT
   ===================== */
function initAbout3DTilt() {
  const wrapper = document.getElementById("about-image-3d");
  const inner = wrapper?.querySelector(".about-image-3d-inner");

  if (!wrapper || !inner || window.innerWidth < 768) return;

  wrapper.addEventListener("mousemove", (e) => {
    const rect = wrapper.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    inner.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
  });

  wrapper.addEventListener("mouseleave", () => {
    inner.style.transform = "rotateY(0) rotateX(0)";
  });
}

/* =====================
   TAGLINE TYPEWRITER
   ===================== */
function initTaglineTypewriter() {
  const el = document.getElementById("tagline-text");
  if (!el) return;

  const phrases = [
    "Trưởng thành trong ánh sáng Phật pháp...",
    "Kỷ Luật · Tinh Tấn · Lợi Tha",
    "Một gia đình, một lý tưởng...",
    "Nơi đoàn viên và tình lam...",
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function type() {
    const current = phrases[phraseIndex];

    if (isDeleting) {
      el.textContent = current.substring(0, charIndex - 1);
      charIndex--;
    } else {
      el.textContent = current.substring(0, charIndex + 1);
      charIndex++;
    }

    let delay = isDeleting ? 30 : 60;

    if (!isDeleting && charIndex === current.length) {
      delay = 2500; // Pause at full text
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      delay = 500;
    }

    setTimeout(type, delay);
  }

  // Start after a short delay
  setTimeout(type, 1500);
}
