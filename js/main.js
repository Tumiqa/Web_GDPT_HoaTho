/* ============================================================
   GĐPT HÒA THỌ — Main JavaScript
   Shared across all pages: preloader, cursor, header, animations
   ============================================================ */

// Fallback: Tự động tắt loading nếu mạng quá chậm sau 7 giây
setTimeout(() => {
  document.body.classList.remove("loading");
  const p = document.getElementById("preloader");
  if (p) { p.style.opacity = "0"; setTimeout(() => p.style.display = "none", 500); }
  const ip = document.getElementById("intro-preloader");
  if (ip) { ip.style.opacity = "0"; setTimeout(() => ip.style.display = "none", 500); }
}, 7000);

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

  // ===== COMPASS =====
  if (document.getElementById("culture-compass")) {
    initCompass();
  }

  // ===== MAPBOX =====
  if (document.getElementById("map-container")) {
    initMapbox();
  }

  // ===== HERO SLIDESHOW =====
  initHeroSlideshow();

  // ===== LUCIDE ICONS =====
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
});

/* =====================
   PRELOADER
   ===================== */
function initPreloader() {
  // Skip regular preloader if cinematic intro is active (first visit)
  if (window.__introActive) {
    return;
  }

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

  let ticking = false;

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        // Khi cuộn xuống quá 80px, thêm class để làm mờ/đổi màu nền
        if (window.scrollY > 80) {
          header.classList.add("header-scrolled");
        } else {
          header.classList.remove("header-scrolled");
        }
        ticking = false;
      });
      ticking = true;
    }
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
    "Bi · Trí · Dũng",
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

/* =====================
   MAPBOX INTEGRATION
   ===================== */
async function initMapbox() {
  // Lấy API key thật từ hệ thống Danasoul
  mapboxgl.accessToken = "pk.eyJ1IjoiY3VxdWFuYmFsYTEyMyIsImEiOiJjbWJwNXB5ODkwMTBjMmxxMnkyMDJvMmp3In0.tyApat-yhPZrf3SsdvMEFw";
  
  const map = new mapboxgl.Map({
    container: "map-container",
    style: "mapbox://styles/mapbox/dark-v11",
    center: [108.2208, 16.0678], // Da Nang center
    zoom: 11.5,
  });

  let markers = [];
  let activePopup = null;

  try {
    const response = await fetch("data/gdpt_locations.json");
    const locations = await response.json();
    const listContainer = document.getElementById("map-locations-list");

    map.on("load", () => {
      locations.forEach((loc) => {
        // Create custom marker element
        const el = document.createElement("div");
        el.className = "custom-marker";
        if (loc.isPrimary) el.classList.add("marker-primary");
        el.dataset.id = loc.id;

        // Create list item
        const listItem = document.createElement("div");
        listItem.className = "location-item";
        if (loc.isPrimary) listItem.classList.add("active");
        listItem.dataset.id = loc.id;
        
        listItem.innerHTML = `
          ${loc.district ? `<div class="location-district">${loc.district}</div>` : ''}
          <div class="location-title">${loc.title}</div>
          <div class="location-address"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" style="margin-right: 4px; display: inline-block; vertical-align: middle;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>${loc.address}</div>
        `;
        listContainer.appendChild(listItem);

        const flyToLocation = (isUserInteraction = true) => {
          if (activePopup) {
            activePopup.remove();
            activePopup = null;
          }
          document.querySelectorAll(".custom-marker, .location-item").forEach((item) => item.classList.remove("active"));

          map.flyTo({
            center: loc.coords,
            zoom: loc.zoom || 15,
            essential: true,
            speed: 1.2,
            curve: 1.4,
            easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
          });

          setTimeout(() => {
            const popupContent = `
              <div class="popup-inner">
                <h4>${loc.title}</h4>
                <p><strong>Địa chỉ:</strong> ${loc.address}</p>
                <div style="margin: 8px 0; border-top: 1px solid rgba(138, 176, 151, 0.2);"></div>
                <p>${loc.description}</p>
              </div>
            `;
            activePopup = new mapboxgl.Popup({
              offset: 15,
              closeOnClick: false,
              anchor: "bottom",
              focusAfterOpen: false
            })
              .setLngLat(loc.coords)
              .setHTML(popupContent)
              .addTo(map);

            activePopup.on("close", () => {
              el.classList.remove("active");
              listItem.classList.remove("active");
              activePopup = null;
            });
          }, 300);

          el.classList.add("active");
          listItem.classList.add("active");
          
          // Only scroll if it's user interaction
          if (isUserInteraction) {
            listItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        };

        const marker = new mapboxgl.Marker(el)
          .setLngLat(loc.coords)
          .addTo(map);
        markers.push(marker);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          flyToLocation(true);
        });
        listItem.addEventListener("click", () => flyToLocation(true));
        
        // Auto focus primary marker on load (isUserInteraction = false)
        if (loc.isPrimary) {
          setTimeout(() => {
            flyToLocation(false);
          }, 1000); // Wait for map to settle
        }
      });

      // Clear selection on map click
      map.on("click", () => {
        if (activePopup) {
          activePopup.remove();
          activePopup = null;
          document.querySelectorAll(".custom-marker, .location-item").forEach((item) => item.classList.remove("active"));
        }
      });
    });

  } catch (error) {
    console.error("Error loading map data:", error);
  }
}

/* =====================
   ROTATING COMPASS
   ===================== */
function initCompass() {
  const compassPoints = [
    {
      id: "sinh-hoat",
      label: "Hình Ảnh",
      title: "Hình Ảnh Sinh Hoạt",
      desc: "Thư viện hình ảnh và video ghi lại những khoảnh khắc đáng nhớ, các kỳ trại và hoạt động ý nghĩa của đoàn.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
      link: "sinh-hoat.html"
    },
    {
      id: "nhac",
      label: "Nhạc Lễ",
      title: "Nhạc Sinh Hoạt GĐPT",
      desc: "Bộ sưu tập nhạc lễ, nhạc sinh hoạt, ca khúc GĐPT truyền thống — nghe trực tuyến và tải về dễ dàng.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
      link: "nhac.html"
    },
    {
      id: "tai-lieu",
      label: "Tài Liệu",
      title: "Tài Liệu Tu Học",
      desc: "Kho tài liệu Phật pháp, giáo án sinh hoạt, sách hướng dẫn tu học từ cơ bản đến nâng cao.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
      link: "tai-lieu.html"
    },
    {
      id: "ky-nang",
      label: "Kỹ Năng",
      title: "Kỹ Năng",
      desc: "Khám phá la bàn kỹ năng: nút dây, morse, dựng trại, sơ cấp cứu và phương hướng trên đường tu học.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
      link: "ky-nang.html"
    },
    {
      id: "lien-he",
      label: "Liên Hệ",
      title: "Liên Hệ & Góp Ý",
      desc: "Gửi lời nhắn, đóng góp ý kiến hoặc liên hệ trực tiếp với Ban Huynh Trưởng GĐPT Hòa Thọ.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
      link: "lien-he.html"
    }
  ];

  const container = document.getElementById("compass-points");
  const compass = document.getElementById("culture-compass");
  const contentDisplay = document.getElementById("culture-content-display");
  const ring = document.querySelector(".compass-ring");

  const radius = window.innerWidth < 768 ? 150 : 250; 
  const centerX = radius;
  const centerY = radius;

  // Xóa nội dung cũ nếu có
  container.innerHTML = "";

  // Thêm các điểm vào la bàn
  compassPoints.forEach((point, index) => {
    // Góc bắt đầu từ trên cùng (-90 độ)
    const angle = (index * (360 / compassPoints.length)) - 90;
    const radian = angle * (Math.PI / 180);

    const x = centerX + radius * Math.cos(radian);
    const y = centerY + radius * Math.sin(radian);

    const pointEl = document.createElement("div");
    pointEl.className = "compass-point";
    pointEl.style.left = `${x}px`;
    pointEl.style.top = `${y}px`;

    pointEl.innerHTML = `
      <div class="compass-point-icon">${point.icon}</div>
      <div class="compass-point-text">${point.label}</div>
    `;

    // Sự kiện click vào điểm la bàn
    pointEl.addEventListener("click", (e) => {
      e.stopPropagation();
      showCompassContent(point);
    });

    container.appendChild(pointEl);
  });

  // Tạm dừng xoay khi hover vào la bàn
  compass.addEventListener("mouseenter", () => {
    ring.style.animationPlayState = "paused";
    document.querySelectorAll('.compass-point, .compass-center').forEach(el => {
      el.style.animationPlayState = "paused";
    });
  });

  compass.addEventListener("mouseleave", () => {
    ring.style.animationPlayState = "running";
    document.querySelectorAll('.compass-point, .compass-center').forEach(el => {
      el.style.animationPlayState = "running";
    });
  });

  // Sự kiện click ra ngoài để đóng nội dung
  document.addEventListener("click", (e) => {
    if (contentDisplay.style.opacity === "1") {
      const card = document.querySelector(".compass-content-card");
      if (card && !card.contains(e.target) && !compass.contains(e.target)) {
        hideCompassContent();
      }
    }
  });

  function showCompassContent(point) {
    // Render nội dung
    contentDisplay.innerHTML = `
      <div class="compass-content-card">
        <button class="compass-close-btn" aria-label="Đóng">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <div class="compass-content-icon">${point.icon}</div>
        <h3>${point.title}</h3>
        <p>${point.desc}</p>
        <a href="${point.link}" class="hero-cta" style="display: inline-block;">Khám Phá Ngay</a>
      </div>
    `;

    // Gắn sự kiện cho nút đóng
    setTimeout(() => {
      document.querySelector(".compass-close-btn").addEventListener("click", hideCompassContent);
    }, 100);

    // Dừng la bàn và mờ đi
    ring.style.animationPlayState = "paused";
    document.querySelectorAll('.compass-point, .compass-center').forEach(el => {
      el.style.animationPlayState = "paused";
    });

    compass.style.opacity = "0";
    compass.style.transform = "scale(0.8)";
    compass.style.pointerEvents = "none";

    // Hiện nội dung
    contentDisplay.style.opacity = "1";
    contentDisplay.style.transform = "scale(1)";
    contentDisplay.style.pointerEvents = "auto";
  }

  function hideCompassContent() {
    // Ẩn nội dung
    contentDisplay.style.opacity = "0";
    contentDisplay.style.transform = "scale(0.95)";
    contentDisplay.style.pointerEvents = "none";

    // Phục hồi la bàn
    compass.style.opacity = "1";
    compass.style.transform = "scale(1)";
    compass.style.pointerEvents = "auto";
    
    setTimeout(() => {
      ring.style.animationPlayState = "running";
      document.querySelectorAll('.compass-point, .compass-center').forEach(el => {
        el.style.animationPlayState = "running";
      });
    }, 500); // Đợi animation CSS chạy xong
  }
}

/* =====================
   HERO SLIDESHOW
   ===================== */
function initHeroSlideshow() {
  const slides = document.querySelectorAll(".hero-slide");
  if (!slides.length) return;

  // Create an array of indices [0, 1, 2, ... N-1]
  let indices = Array.from(slides.keys());
  
  // Fisher-Yates shuffle function
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Initial shuffle
  shuffle(indices);
  
  // Make the first random slide active immediately
  slides.forEach(slide => slide.classList.remove("active"));
  let currentPos = 0;
  let currentSlide = indices[currentPos];
  slides[currentSlide].classList.add("active");
  
  // Start cycling slides every 6 seconds
  setInterval(() => {
    // Remove active class from current slide
    slides[currentSlide].classList.remove("active");
    
    // Move to next position in the shuffled array
    currentPos++;
    
    // If we've shown all slides, reshuffle and start over
    if (currentPos >= indices.length) {
      // Keep track of the last shown slide to prevent it from being the first in the new shuffle
      const lastSlide = indices[indices.length - 1];
      
      shuffle(indices);
      
      // If the new first slide is the same as the last shown slide, swap it with the second one
      if (indices[0] === lastSlide && indices.length > 1) {
        [indices[0], indices[1]] = [indices[1], indices[0]];
      }
      
      currentPos = 0;
    }
    
    currentSlide = indices[currentPos];
    
    // Add active class to new slide
    slides[currentSlide].classList.add("active");
  }, 6000);
}
