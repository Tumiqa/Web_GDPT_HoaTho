/* ============================================================
   MEME DANCE FLOOR — Dancing GIF Meme Stage
   Tích hợp Tenor API v2 + Giphy + Kho Fallback Đa Dạng (45+ Memes)
   ============================================================ */

(function () {
  "use strict";

  // ===== TENOR API CONFIG =====
  const TENOR_API_KEY = "AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ";
  const TENOR_CLIENT_KEY = "gdpt_hoatho_web";
  const TENOR_API_URL = "https://tenor.googleapis.com/v2/search";

  // ===== GIPHY API FALLBACK CONFIG =====
  const GIPHY_API_KEY = "cw958tA9RcxWmgDbgBxLnoWGlBxTFgnA"; // Public demo key
  const GIPHY_API_URL = "https://api.giphy.com/v1/gifs/search";

  // 30 Chủ đề tìm kiếm đa dạng — luôn xoay vòng
  const SEARCH_QUERIES = [
    "dancing meme funny",
    "toothless dance meme",
    "wednesday addams dance",
    "fortnite dance emote",
    "coffin dance astronomia",
    "snoop dogg dance",
    "happy dance celebration",
    "funny dance moves",
    "party parrot dance",
    "cat dancing meme",
    "vibing cat dance",
    "dog dancing funny",
    "dance battle meme",
    "robot dance meme",
    "cartoon dancing funny",
    "spiderman dance meme",
    "shrek dance meme",
    "minions dance party",
    "carlton dance fresh prince",
    "disco dance groovy",
    "chicken dance funny",
    "duck dance meme",
    "frog dancing meme",
    "bear dancing funny",
    "bird dancing meme",
    "skeleton dance spooky",
    "dinosaur dance funny",
    "super mario dance",
    "pikachu dance funny",
    "elmo dance fire"
  ];

  // ===== KHO FALLBACK GIF MEME SIÊU ĐA DẠNG (45+ MEMES NỔI TIẾNG HÀNG ĐẦU) =====
  const FALLBACK_GIFS = [
    // --- ICONIC TRENDING MEMES ---
    { url: "https://media.tenor.com/-9lHctoXbJkAAAAM/toothless-toothless-dragon.gif", label: "Toothless Dance 🐉" },
    { url: "https://media.tenor.com/P3mVlQI024MAAAAM/dragon-toothless.gif", label: "Toothless Groove 🐲" },
    { url: "https://media.tenor.com/17pFKrJQR4AAAAM/default-dance-fortnite.gif", label: "Fortnite Default Dance 🎮" },
    { url: "https://media.tenor.com/gWbbLIR91zMAAAAM/sigma.gif", label: "Peely Banana Dance 🍌" },
    { url: "https://media.tenor.com/T7eqVK6--PkAAAAM/peter-griffin-popular-vibe.gif", label: "Peter Griffin Vibe 🕺" },
    { url: "https://media.tenor.com/lJyt1AMal5UAAAAM/fortnite-fortnite-dance.gif", label: "Godzilla Griddy 🦖" },
    { url: "https://media.tenor.com/TQ-H4qHEEc4AAAAM/wednesday-dance.gif", label: "Wednesday Jenna Ortega 🖤" },
    { url: "https://media.tenor.com/SvX0wHFhUwwAAAAM/addams-family-wednesday-addams.gif", label: "Classic Wednesday Dance 💃" },
    { url: "https://media.tenor.com/Lbrr3HR3CnkAAAAM/snoop-dogg-rap.gif", label: "Snoop Dogg Rap 🎤" },
    { url: "https://media.tenor.com/m9UvUbZfqkkAAAAM/snoop-dogg-happy.gif", label: "Snoop Dogg Happy Dance 😎" },
    { url: "https://media.tenor.com/x9cDk1TwUaoAAAAM/parrot.gif", label: "SpongeBob Dance 🧽" },
    { url: "https://media.tenor.com/C9azToQLLVoAAAAM/venom-spider-man.gif", label: "Venom Floss Dance 🕷️" },
    { url: "https://media.tenor.com/dJR-_7ynz4EAAAAM/spider-man-hot-to-go.gif", label: "Spiderman Hot To Go 🕸️" },
    { url: "https://media.tenor.com/Wgb4xw9TvZ8AAAAM/deku-fortnite.gif", label: "Deku Gangnam Style 🦸" },
    { url: "https://media.tenor.com/3xUw0rsM0t4AAAAM/fortnite-take-the-l.gif", label: "Take The L Dance 🏆" },

    // --- ANIMALS & BIRDS ---
    { url: "https://media.tenor.com/3_mXIoBPNhoAAAAM/party-parrot.gif", label: "Party Parrot 🦜" },
    { url: "https://media.tenor.com/3EAL8JxXr04AAAAM/cat-vibe-cat.gif", label: "Vibing Cat 😎" },
    { url: "https://media.tenor.com/TcGFFG6utCkAAAAM/dancing-cat-dance.gif", label: "Dancing Cat 🐱" },
    { url: "https://media.tenor.com/Bq2aAQc8gOQAAAAM/bird-dance.gif", label: "Bird Jam 🐦" },
    { url: "https://media.tenor.com/sAdUgAlKEloAAAAM/party-parrot-rgb-rainbow-dance-cool.gif", label: "Rainbow Party Parrot 🌈" },
    { url: "https://media.tenor.com/8dTA0WCA99AAAAAM/cats-cat.gif", label: "Triple Cats Dance 🐱🐱🐱" },
    { url: "https://media.tenor.com/0r-5ii_eiLIAAAAM/cats-dancing-dancing-3d-cat.gif", label: "3D Dance Party 🎮" },
    { url: "https://media.tenor.com/nZsn90X3OpYAAAAM/baby-cat-dancing-png.gif", label: "Baby Cat Dance 🍼" },
    { url: "https://media.tenor.com/CGGpySo03JcAAAAM/yeah.gif", label: "Cool Parrot 😎" },
    { url: "https://media.tenor.com/T_avUEk3aWwAAAAM/catgroove7tv-catgroove.gif", label: "Cat Groove 🎶" },
    { url: "https://media.tenor.com/u4PtkN93TDQAAAAM/headbanging-headbanging-parrot.gif", label: "Headbang Parrot 🤘" },
    { url: "https://media.tenor.com/rLOjyzhrq2cAAAAM/parrot-dancing-parrot.gif", label: "Birthday Parrot 🎉" },
    { url: "https://media.tenor.com/Ck9TuwngeuUAAAAM/funny-cats-funny-cat.gif", label: "Shadow Dance Cat 🖤" },
    { url: "https://media.tenor.com/HAU_nZjbw9gAAAAM/cat-dance.gif", label: "Spin Dance Cat 🌀" },
    { url: "https://media.tenor.com/6KtNqNFjSVMAAAAM/parrot-slack.gif", label: "Rasta Parrot 🌈" },
    { url: "https://media.tenor.com/Doz_0PR3GQkAAAAM/cat-cats.gif", label: "Tabby Groove 🐱" },
    { url: "https://media.tenor.com/iFJ3QHQjblEAAAAM/party-parrot.gif", label: "Blue Parrot 🦜" },
    { url: "https://media.tenor.com/UKgPV009348AAAAM/bird-dancing.gif", label: "Hula Bird 🌺" },
    { url: "https://media.tenor.com/Q8k95YQqEEMAAAAM/partyparrot.gif", label: "Santa Parrot 🎅" },
    { url: "https://media.tenor.com/zO98E2iI0rYAAAAM/bird-colors.gif", label: "Cheers Dance 🍺" },
    { url: "https://media.tenor.com/Kn0-wxZ3OAsAAAAM/parrot-wiggle.gif", label: "Football Parrot 🏈" },
    { url: "https://media.tenor.com/W6gYvyBDMeEAAAAM/party-parrot.gif", label: "Parrot Trio 🦜🦜🦜" },
    { url: "https://media.tenor.com/DTaGwlaEDbwAAAAM/povjisoo-cat-tiktok-dancing.gif", label: "TikTok Cat 📱" },
    { url: "https://media.tenor.com/5BYK-WS0__gAAAAM/cool-fun.gif", label: "White Cat Vibes ✨" },
    { url: "https://media.tenor.com/dL6KEHdRaaIAAAAM/orange-cat-dancing.gif", label: "Orange Cat Dance 🧡" },
    { url: "https://media.tenor.com/UZQrH3AhqzQAAAAM/xiv-cat-brazil.gif", label: "Brazil Cats 🇧🇷" },
    { url: "https://media.tenor.com/GQAsycjoZG8AAAAM/scuba-scuba-cat.gif", label: "Scuba Cat 🐱" },

    // --- CARTOONS, PEOPLE & MISC ---
    { url: "https://media.tenor.com/4mqZMKJ_pisAAAAM/bob-ross-party-parrot.gif", label: "Bob Ross Dance 🎨" },
    { url: "https://media.tenor.com/opE011ucJ6kAAAAM/dancing-cat.gif", label: "Happy Dance 💃" }
  ];

  // ===== STATE =====
  let danceStageEl = null;
  let danceGridEl = null;
  let danceToggleBtn = null;
  let rotateInterval = null;
  let refreshInterval = null;
  let isStageVisible = false;
  let isDanceEnabled = true;
  let tenorApiAvailable = true;
  let giphyApiAvailable = true;

  // GIF pool — kho GIF sống
  let gifPool = [];
  let displayedGifs = [];
  let usedGifUrls = new Set();
  let currentQueryIndex = 0;
  let fetchInProgress = false;
  let fallbackIndex = 0;
  let fallbackOrder = [];

  // ===== CONSTANTS =====
  const ROTATE_INTERVAL_MS = 4000;
  const REFRESH_POOL_MS = 25000;
  const GIFS_PER_FETCH = 25;
  const MIN_POOL_SIZE = 8;
  const SLOT_COUNT_DESKTOP = 4;
  const SLOT_COUNT_TABLET = 3;
  const SLOT_COUNT_MOBILE = 2;

  // ===== HELPERS =====
  function getSlotCount() {
    const w = window.innerWidth;
    if (w >= 992) return SLOT_COUNT_DESKTOP;
    if (w >= 600) return SLOT_COUNT_TABLET;
    return SLOT_COUNT_MOBILE;
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function initFallbackOrder() {
    fallbackOrder = FALLBACK_GIFS.map((_, i) => i);
    shuffleArray(fallbackOrder);
    fallbackIndex = 0;
  }

  function getGifFromFallback() {
    if (fallbackOrder.length === 0) initFallbackOrder();
    if (fallbackIndex >= fallbackOrder.length) {
      shuffleArray(fallbackOrder);
      fallbackIndex = 0;
    }
    const gif = FALLBACK_GIFS[fallbackOrder[fallbackIndex]];
    fallbackIndex++;
    return gif;
  }

  // ===== FETCH FROM TENOR API =====
  async function fetchFromTenor(query) {
    if (!tenorApiAvailable) return [];
    try {
      const pos = Math.floor(Math.random() * 40);
      const url = `${TENOR_API_URL}?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&client_key=${TENOR_CLIENT_KEY}&limit=${GIFS_PER_FETCH}&pos=${pos}&media_filter=tinygif&contentfilter=medium`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (!data.results || data.results.length === 0) return [];

      return data.results
        .map(r => {
          const tinygif = r.media_formats?.tinygif;
          if (!tinygif?.url) return null;
          return {
            url: tinygif.url,
            label: (r.content_description || query).slice(0, 30)
          };
        })
        .filter(g => g && !usedGifUrls.has(g.url));
    } catch (err) {
      console.warn("Dance Floor: Tenor API query error, trying Giphy/Fallback...", err.message);
      tenorApiAvailable = false;
      return [];
    }
  }

  // ===== FETCH FROM GIPHY API (SECONDARY FALLBACK) =====
  async function fetchFromGiphy(query) {
    if (!giphyApiAvailable) return [];
    try {
      const offset = Math.floor(Math.random() * 30);
      const url = `${GIPHY_API_URL}?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${GIFS_PER_FETCH}&offset=${offset}&rating=g`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (!data.data || data.data.length === 0) return [];

      return data.data
        .map(r => {
          const gifUrl = r.images?.fixed_height_small?.url || r.images?.downsized?.url;
          if (!gifUrl) return null;
          return {
            url: gifUrl,
            label: (r.title || query).slice(0, 30)
          };
        })
        .filter(g => g && !usedGifUrls.has(g.url));
    } catch (err) {
      console.warn("Dance Floor: Giphy API query error", err.message);
      giphyApiAvailable = false;
      return [];
    }
  }

  // ===== FETCH BATCH =====
  async function fetchNextBatch() {
    if (fetchInProgress) return 0;
    fetchInProgress = true;

    const query = SEARCH_QUERIES[currentQueryIndex];
    currentQueryIndex = (currentQueryIndex + 1) % SEARCH_QUERIES.length;

    let newGifs = await fetchFromTenor(query);
    if (newGifs.length === 0) {
      newGifs = await fetchFromGiphy(query);
    }

    if (newGifs.length > 0) {
      newGifs.forEach(g => {
        usedGifUrls.add(g.url);
        gifPool.push(g);
      });
      shuffleArray(gifPool);
    }

    fetchInProgress = false;
    return newGifs.length;
  }

  async function ensurePoolFilled() {
    if (gifPool.length < MIN_POOL_SIZE && !fetchInProgress) {
      await fetchNextBatch();
      if (gifPool.length < MIN_POOL_SIZE && (tenorApiAvailable || giphyApiAvailable)) {
        await fetchNextBatch();
      }
    }
  }

  function getNextGif() {
    if (gifPool.length > 0) {
      return gifPool.splice(Math.floor(Math.random() * gifPool.length), 1)[0];
    }
    return getGifFromFallback();
  }

  // ===== CREATE STAGE =====
  function createDanceStage() {
    const playerCol = document.querySelector(".music-app-player");
    if (!playerCol) return;

    danceStageEl = document.createElement("div");
    danceStageEl.id = "dance-floor";
    danceStageEl.className = "dance-floor";
    danceStageEl.setAttribute("aria-hidden", "true");

    danceStageEl.innerHTML = `
      <div class="dance-floor-header">
        <div class="dance-floor-title">
          <span class="dance-floor-icon">🕺</span>
          <span>Dance Floor</span>
          <span class="dance-floor-icon">💃</span>
        </div>
        <button class="dance-floor-toggle" id="dance-floor-toggle" aria-label="Bật/tắt Dance Floor" title="Bật/tắt Dance Floor">
          <svg class="toggle-icon-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <svg class="toggle-icon-eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        </button>
      </div>
      <div class="dance-floor-grid" id="dance-floor-grid"></div>
    `;

    playerCol.appendChild(danceStageEl);
    danceGridEl = document.getElementById("dance-floor-grid");
    danceToggleBtn = document.getElementById("dance-floor-toggle");

    danceToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      isDanceEnabled = !isDanceEnabled;
      const eyeOn = danceToggleBtn.querySelector(".toggle-icon-eye");
      const eyeOff = danceToggleBtn.querySelector(".toggle-icon-eye-off");
      if (isDanceEnabled) {
        eyeOn.style.display = "";
        eyeOff.style.display = "none";
        danceGridEl.style.display = "";
        showDanceStage();
      } else {
        eyeOn.style.display = "none";
        eyeOff.style.display = "";
        stopRotation();
        danceGridEl.style.display = "none";
      }
    });
  }

  // ===== POPULATE GIFS =====
  async function populateGifs() {
    if (!danceGridEl) return;

    await ensurePoolFilled();

    danceGridEl.innerHTML = "";
    displayedGifs = [];

    const count = getSlotCount();
    for (let i = 0; i < count; i++) {
      const gif = getNextGif();
      displayedGifs.push(gif);

      const slot = document.createElement("div");
      slot.className = "dance-floor-slot";
      slot.setAttribute("data-slot", i);

      const img = document.createElement("img");
      img.src = gif.url;
      img.alt = gif.label;
      img.loading = "eager";
      img.draggable = false;
      img.onerror = function () {
        const replacement = getGifFromFallback();
        this.src = replacement.url;
        this.alt = replacement.label;
        const lbl = this.parentElement?.querySelector(".dance-floor-label");
        if (lbl) lbl.textContent = replacement.label;
      };

      const label = document.createElement("div");
      label.className = "dance-floor-label";
      label.textContent = gif.label;

      slot.appendChild(img);
      slot.appendChild(label);
      danceGridEl.appendChild(slot);
    }
  }

  // ===== ROTATE SPECIFIC SLOT =====
  let slotTimers = [];

  function rotateSlot(slotIndex) {
    if (!danceGridEl || !displayedGifs[slotIndex]) return;

    ensurePoolFilled();

    const slotEl = danceGridEl.querySelector(`[data-slot="${slotIndex}"]`);
    if (!slotEl) return;

    const newGif = getNextGif();
    if (!newGif) return;

    displayedGifs[slotIndex] = newGif;

    const preload = new Image();
    preload.src = newGif.url;

    slotEl.classList.add("fading");

    setTimeout(() => {
      const img = slotEl.querySelector("img");
      const label = slotEl.querySelector(".dance-floor-label");
      if (img) {
        img.src = newGif.url;
        img.alt = newGif.label;
        img.onerror = function () {
          const replacement = getGifFromFallback();
          this.src = replacement.url;
          this.alt = replacement.label;
          if (label) label.textContent = replacement.label;
        };
      }
      if (label) label.textContent = newGif.label;

      requestAnimationFrame(() => {
        slotEl.classList.remove("fading");
      });
    }, 300);
  }

  // ===== START / STOP ROTATION =====
  function startRotation() {
    stopRotation(); // Clear previous timers

    const count = getSlotCount();
    const baseInterval = 7000; // Chu kỳ trung bình ~7 giây (thoải mái, vừa xem)

    // Mỗi ô có chu kỳ & thời điểm đảo GIF độc lập (Staggered per-slot timers)
    for (let i = 0; i < count; i++) {
      const slotIndex = i;
      // Delay lần đầu để các ô đổi lệch nhịp mượt mà (0s, 1.8s, 3.6s, 5.4s)
      const initialDelay = slotIndex * 1800 + Math.floor(Math.random() * 500);
      // Chu kỳ riêng biệt cho từng ô (ví dụ 6.6s, 7.5s, 6.4s, 7.8s)
      const slotInterval = baseInterval + (slotIndex % 2 === 0 ? 600 : -500) + Math.floor(Math.random() * 800 - 400);

      const timeoutId = setTimeout(() => {
        rotateSlot(slotIndex);
        const intervalId = setInterval(() => rotateSlot(slotIndex), slotInterval);
        slotTimers.push(intervalId);
      }, initialDelay);

      slotTimers.push(timeoutId);
    }

    if (!refreshInterval) {
      refreshInterval = setInterval(() => {
        if (isDanceEnabled && isStageVisible && (tenorApiAvailable || giphyApiAvailable)) {
          fetchNextBatch();
        }
      }, REFRESH_POOL_MS);
    }
  }

  function stopRotation() {
    slotTimers.forEach(id => {
      clearTimeout(id);
      clearInterval(id);
    });
    slotTimers = [];

    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }

  // ===== SHOW / HIDE STAGE =====
  async function showDanceStage() {
    if (!danceStageEl || !isDanceEnabled) return;

    if (!isStageVisible) {
      currentQueryIndex = Math.floor(Math.random() * SEARCH_QUERIES.length);
      await populateGifs();
      isStageVisible = true;
    }

    danceStageEl.classList.add("active");
    startRotation();
  }

  function hideDanceStage() {
    if (!danceStageEl) return;
    danceStageEl.classList.remove("active");
    stopRotation();
  }

  // ===== RESIZE HANDLER =====
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (isStageVisible && isDanceEnabled) {
        populateGifs();
      }
    }, 300);
  });

  // ===== INIT =====
  function init() {
    initFallbackOrder();
    createDanceStage();
    currentQueryIndex = Math.floor(Math.random() * SEARCH_QUERIES.length);
    fetchNextBatch().then(() => fetchNextBatch());
  }

  // ===== EXPOSE TO GLOBAL =====
  window.MemeDanceFloor = {
    show: showDanceStage,
    hide: hideDanceStage,
    init: init
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
