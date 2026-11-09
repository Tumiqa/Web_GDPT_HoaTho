/* ============================================================
   NHẠC GĐPT — Music Player JavaScript
   Streams audio from Archive.org
   Includes Category Filter & Lyrics Display
   ============================================================ */

(function () {
  "use strict";

  // ===== PLAYLIST DATA =====
  let PLAYLIST = [];

  // ===== STATE =====
  let currentIndex = 0;
  let isPlaying = false;
  let isShuffle = false;
  let repeatMode = 0; // 0 = off, 1 = all, 2 = one
  let currentCategory = "all";
  let audio = new Audio();
  audio.preload = "metadata";
  audio.volume = 0.8;

  // ===== DOM ELEMENTS =====
  const playerContainer = document.getElementById("player-container");
  const btnPlay = document.getElementById("btn-play");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const btnShuffle = document.getElementById("btn-shuffle");
  const btnRepeat = document.getElementById("btn-repeat");
  const iconPlay = document.getElementById("icon-play");
  const iconPause = document.getElementById("icon-pause");
  const progressWrapper = document.getElementById("player-progress-wrapper");
  const progressFill = document.getElementById("player-progress-fill");
  const currentTimeEl = document.getElementById("player-current-time");
  const totalTimeEl = document.getElementById("player-total-time");
  const trackNumberEl = document.getElementById("player-track-number");
  const trackTitleEl = document.getElementById("player-track-title");
  const trackArtistEl = document.getElementById("player-track-artist");
  const volumeSlider = document.getElementById("volume-slider");
  const playerDownloadBtn = document.getElementById("player-download-btn");
  const playlistList = document.getElementById("playlist-list");
  const playlistCount = document.getElementById("playlist-count");
  const visualizerContainer = document.getElementById("player-visualizer");

  // Lyrics Elements
  const lyricsSubheadingEl = document.getElementById("lyrics-subheading");
  const lyricsTextEl = document.getElementById("lyrics-text");
  const lyricsCopyBtn = document.getElementById("lyrics-copy-btn");
  const lyricsCopyText = document.getElementById("lyrics-copy-text");

  // ===== VISUALIZER BARS =====
  const BAR_COUNT = 40;
  let visualizerBars = [];

  function createVisualizer() {
    if (!visualizerContainer) return;
    for (let i = 0; i < BAR_COUNT; i++) {
      const bar = document.createElement("div");
      bar.classList.add("visualizer-bar");
      bar.style.height = "4px";
      visualizerContainer.insertBefore(bar, visualizerContainer.firstChild);
      visualizerBars.push(bar);
    }
  }

  let visualizerInterval = null;

  function startVisualizer() {
    if (visualizerInterval) return;
    visualizerInterval = setInterval(() => {
      visualizerBars.forEach((bar) => {
        const height = Math.random() * 80 + 10;
        bar.style.height = height + "%";
        bar.style.opacity = 0.4 + Math.random() * 0.6;
      });
    }, 150);
  }

  function stopVisualizer() {
    if (visualizerInterval) {
      clearInterval(visualizerInterval);
      visualizerInterval = null;
    }
    visualizerBars.forEach((bar) => {
      bar.style.height = "4px";
      bar.style.opacity = "0.6";
    });
  }

  // ===== FLOATING MUSIC NOTES =====
  function createMusicNotes() {
    const container = document.getElementById("music-notes-bg");
    if (!container || window.innerWidth < 768) return;

    const notes = ["♪", "♫", "♬", "♩", "🎵", "🎶"];
    for (let i = 0; i < 12; i++) {
      const note = document.createElement("div");
      note.classList.add("music-note-float");
      note.textContent = notes[Math.floor(Math.random() * notes.length)];
      note.style.left = Math.random() * 100 + "%";
      note.style.animationDuration = Math.random() * 8 + 8 + "s";
      note.style.animationDelay = Math.random() * 10 + "s";
      note.style.fontSize = Math.random() * 1.5 + 1 + "rem";
      container.appendChild(note);
    }
  }

  // ===== SEARCH & FILTER =====
  const searchInput = document.getElementById("search-input");
  const searchClear = document.getElementById("search-clear");
  const searchNoResults = document.getElementById("search-no-results");
  let searchTerm = "";

  function removeDiacritics(str) {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  }

  function filterPlaylist(query, category) {
    let list = PLAYLIST.map((t, i) => ({ track: t, originalIndex: i }));

    // Filter by Category
    if (category && category !== "all") {
      list = list.filter(({ track }) => track.category === category);
    }

    // Filter by Search Term
    if (query && query.trim()) {
      const q = removeDiacritics(query.trim());
      list = list.filter(({ track }) => {
        const title = removeDiacritics(track.title || "");
        const artist = removeDiacritics(track.artist || "");
        const cat = removeDiacritics(track.category || "");
        return title.includes(q) || artist.includes(q) || cat.includes(q);
      });
    }

    return list;
  }

  // ===== CATEGORY COUNTS =====
  function updateCategoryCounts() {
    const counts = { all: PLAYLIST.length };
    PLAYLIST.forEach((t) => {
      const c = t.category || "Khác";
      counts[c] = (counts[c] || 0) + 1;
    });

    const setEl = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val || 0;
    };

    setEl("count-all", counts.all);
    setEl("count-sh", counts["Nhạc Sinh Hoạt"]);
    setEl("count-vn", counts["Nhạc Văn Nghệ"]);
    setEl("count-pg", counts["Nhạc Phật Giáo"]);
    setEl("count-vl", counts["Nhạc Vu Lan"]);
    setEl("count-pd", counts["Nhạc Phật Đản"]);
    setEl("count-le", counts["Nhạc Lễ"]);
    setEl("count-lt", counts["Nhạc Lửa Trại"]);
  }

  function initCategoryFilters() {
    const pills = document.querySelectorAll(".cat-pill");
    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        pills.forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        currentCategory = pill.dataset.category || "all";
        renderPlaylist(searchTerm);
      });
    });
  }

  // ===== LYRICS DISPLAY =====
  function updateLyrics(track) {
    if (!lyricsTextEl) return;

    if (lyricsSubheadingEl) {
      const catText = track.category ? ` · ${track.category}` : "";
      lyricsSubheadingEl.textContent = `${track.title} · ${track.artist || "Nhạc GĐPT"}${catText}`;
    }

    if (track.lyrics && track.lyrics.trim().length > 0) {
      // Split into verses by double newline
      const verses = track.lyrics.trim().split(/\n\s*\n/);
      lyricsTextEl.innerHTML = verses
        .map((verse) => {
          const formatted = verse.trim().replace(/\n/g, "<br>");
          return `<div class="lyrics-verse">${formatted}</div>`;
        })
        .join("");

      if (lyricsCopyBtn) lyricsCopyBtn.style.display = "inline-flex";
    } else {
      lyricsTextEl.innerHTML = `
        <div class="lyrics-empty">
          <div class="lyrics-empty-icon">🪷</div>
          <div class="lyrics-empty-title">Lời bài hát đang được cập nhật</div>
          <p class="lyrics-empty-desc">Lời ca cho bài hát "${track.title}" đang được ban biên tập sưu tầm và cập nhật.</p>
        </div>
      `;
      if (lyricsCopyBtn) lyricsCopyBtn.style.display = "none";
    }

    // Scroll to top of lyrics container
    const bodyEl = document.getElementById("lyrics-card-body");
    if (bodyEl) bodyEl.scrollTop = 0;
  }

  function initLyricsCopy() {
    if (!lyricsCopyBtn) return;
    lyricsCopyBtn.addEventListener("click", () => {
      const track = PLAYLIST[currentIndex];
      if (!track || !track.lyrics) return;
      const textToCopy = `${track.title} - ${track.artist || "GĐPT"}\n\n${track.lyrics}`;
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          if (lyricsCopyText) lyricsCopyText.textContent = "Đã chép!";
          setTimeout(() => {
            if (lyricsCopyText) lyricsCopyText.textContent = "Sao chép";
          }, 2000);
        })
        .catch(() => {});
    });
  }

  // ===== RENDER PLAYLIST =====
  function renderPlaylist(query) {
    if (!playlistList) return;

    const filtered = filterPlaylist(query, currentCategory);
    playlistList.innerHTML = "";

    if (playlistCount) {
      if ((query && query.trim()) || currentCategory !== "all") {
        playlistCount.textContent = `${filtered.length} / ${PLAYLIST.length} bài hát`;
      } else {
        playlistCount.textContent = `${PLAYLIST.length} bài hát`;
      }
    }

    // Show/hide no results
    if (searchNoResults) {
      searchNoResults.style.display = filtered.length === 0 ? "block" : "none";
    }

    filtered.forEach(({ track, originalIndex }) => {
      const item = document.createElement("div");
      item.classList.add("playlist-item");
      if (originalIndex === currentIndex) item.classList.add("active");
      if (originalIndex === currentIndex && isPlaying) item.classList.add("is-playing");
      item.setAttribute("data-index", originalIndex);
      item.id = "playlist-item-" + originalIndex;

      const hasLyricsBadge = track.lyrics && track.lyrics.trim().length > 0 
        ? `<span class="has-lyrics-badge" title="Có lời bài hát">📜</span>` 
        : "";

      const categoryBadge = track.category 
        ? `<span class="playlist-item-cat">${track.category}</span>` 
        : "";

      item.innerHTML = `
        <div class="playlist-item-number">
          <span class="num-text">${String(originalIndex + 1).padStart(2, "0")}</span>
          <span class="play-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="6 3 20 12 6 21 6 3"/>
            </svg>
          </span>
          <div class="eq-bars">
            <div class="eq-bar"></div>
            <div class="eq-bar"></div>
            <div class="eq-bar"></div>
            <div class="eq-bar"></div>
          </div>
        </div>
        <div class="playlist-item-info">
          <div class="playlist-item-title">${track.title} ${hasLyricsBadge}</div>
          <div class="playlist-item-meta">
            <span>${track.artist || "Nhạc GĐPT"}</span>
            ${categoryBadge}
          </div>
        </div>
        <div class="playlist-item-duration">${track.duration || "--:--"}</div>
        <a class="playlist-item-download" href="${track.src}" download title="Tải về ${track.title}" aria-label="Tải về ${track.title}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </a>
      `;

      item.addEventListener("click", (e) => {
        if (e.target.closest(".playlist-item-download")) return;
        if (currentIndex === originalIndex && isPlaying) {
          pauseTrack();
        } else {
          loadTrack(originalIndex);
          playTrack();
        }
      });

      playlistList.appendChild(item);
    });
  }

  // ===== LOAD TRACK =====
  function loadTrack(index) {
    if (PLAYLIST.length === 0) return;
    currentIndex = index;
    const track = PLAYLIST[currentIndex];

    audio.src = track.src;
    audio.load();

    // Update player UI
    if (trackNumberEl) trackNumberEl.textContent = "TRACK " + String(currentIndex + 1).padStart(2, "0");
    if (trackTitleEl) trackTitleEl.textContent = track.title;
    if (trackArtistEl) trackArtistEl.textContent = track.artist || "Nhạc GĐPT";

    // Reset progress
    if (progressFill) progressFill.style.width = "0%";
    if (currentTimeEl) currentTimeEl.textContent = "0:00";
    if (totalTimeEl) totalTimeEl.textContent = track.duration || "--:--";

    // Update download button
    if (playerDownloadBtn) {
      playerDownloadBtn.href = track.src;
      playerDownloadBtn.title = "Tải về: " + track.title;
    }

    // Update Lyrics
    updateLyrics(track);

    // Update playlist active state
    updatePlaylistUI();
  }

  // ===== PLAY / PAUSE =====
  function playTrack() {
    audio.play().catch((err) => {
      console.warn("Playback failed:", err);
    });
    isPlaying = true;
    updatePlayPauseIcon();
    playerContainer?.classList.add("playing");
    startVisualizer();
    updatePlaylistUI();
  }

  function pauseTrack() {
    audio.pause();
    isPlaying = false;
    updatePlayPauseIcon();
    playerContainer?.classList.remove("playing");
    stopVisualizer();
    updatePlaylistUI();
  }

  function togglePlayPause() {
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack();
    }
  }

  function updatePlayPauseIcon() {
    if (!iconPlay || !iconPause) return;
    if (isPlaying) {
      iconPlay.style.display = "none";
      iconPause.style.display = "block";
    } else {
      iconPlay.style.display = "block";
      iconPause.style.display = "none";
    }
  }

  // ===== NEXT / PREV =====
  function nextTrack() {
    if (isShuffle) {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * PLAYLIST.length);
      } while (newIndex === currentIndex && PLAYLIST.length > 1);
      loadTrack(newIndex);
    } else {
      loadTrack((currentIndex + 1) % PLAYLIST.length);
    }
    playTrack();
  }

  function prevTrack() {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (isShuffle) {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * PLAYLIST.length);
      } while (newIndex === currentIndex && PLAYLIST.length > 1);
      loadTrack(newIndex);
    } else {
      loadTrack((currentIndex - 1 + PLAYLIST.length) % PLAYLIST.length);
    }
    playTrack();
  }

  // ===== PLAYLIST ACTIVE UI =====
  function updatePlaylistUI() {
    document.querySelectorAll(".playlist-item").forEach((item) => {
      const idx = parseInt(item.getAttribute("data-index"), 10);
      if (idx === currentIndex) {
        item.classList.add("active");
        if (isPlaying) {
          item.classList.add("is-playing");
        } else {
          item.classList.remove("is-playing");
        }
      } else {
        item.classList.remove("active", "is-playing");
      }
    });

    // Auto scroll active item into view smoothly
    const activeEl = document.getElementById("playlist-item-" + currentIndex);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  // ===== TIME FORMAT =====
  function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ":" + (secs < 10 ? "0" : "") + secs;
  }

  // ===== EVENTS =====
  function initEvents() {
    btnPlay?.addEventListener("click", togglePlayPause);
    btnNext?.addEventListener("click", nextTrack);
    btnPrev?.addEventListener("click", prevTrack);

    btnShuffle?.addEventListener("click", () => {
      isShuffle = !isShuffle;
      btnShuffle.classList.toggle("active", isShuffle);
    });

    btnRepeat?.addEventListener("click", () => {
      repeatMode = (repeatMode + 1) % 3;
      btnRepeat.classList.toggle("active", repeatMode > 0);
      if (repeatMode === 2) {
        btnRepeat.setAttribute("title", "Lặp lại 1 bài");
      } else if (repeatMode === 1) {
        btnRepeat.setAttribute("title", "Lặp lại tất cả");
      } else {
        btnRepeat.setAttribute("title", "Lặp lại");
      }
    });

    audio.addEventListener("timeupdate", () => {
      if (audio.duration) {
        const pct = (audio.currentTime / audio.duration) * 100;
        if (progressFill) progressFill.style.width = pct + "%";
        if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
      }
    });

    audio.addEventListener("loadedmetadata", () => {
      if (totalTimeEl && audio.duration) {
        totalTimeEl.textContent = formatTime(audio.duration);
      }
    });

    audio.addEventListener("ended", () => {
      if (repeatMode === 2) {
        audio.currentTime = 0;
        playTrack();
      } else if (repeatMode === 1 || currentIndex < PLAYLIST.length - 1) {
        nextTrack();
      } else {
        pauseTrack();
      }
    });

    // Progress Bar Scrubbing
    if (progressWrapper) {
      let isDragging = false;

      const seek = (e) => {
        const rect = progressWrapper.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        if (audio.duration) {
          audio.currentTime = pos * audio.duration;
        }
      };

      progressWrapper.addEventListener("mousedown", (e) => {
        isDragging = true;
        seek(e);
      });

      window.addEventListener("mousemove", (e) => {
        if (isDragging) seek(e);
      });

      window.addEventListener("mouseup", () => {
        isDragging = false;
      });

      // Touch for mobile
      progressWrapper.addEventListener("touchstart", (e) => {
        const touch = e.touches[0];
        const rect = progressWrapper.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
        if (audio.duration) audio.currentTime = pos * audio.duration;
      }, { passive: true });
    }

    // Volume Slider
    if (volumeSlider) {
      volumeSlider.addEventListener("input", (e) => {
        audio.volume = e.target.value / 100;
      });
    }

    // Keyboard Shortcuts (Space to Play/Pause, Left/Right for Seek)
    window.addEventListener("keydown", (e) => {
      // Don't intercept if typing in an input/textarea
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === "ArrowRight") {
        audio.currentTime = Math.min(audio.currentTime + 5, audio.duration || 0);
      } else if (e.code === "ArrowLeft") {
        audio.currentTime = Math.max(audio.currentTime - 5, 0);
      }
    });
  }

  // ===== SEARCH INITIALIZATION =====
  function initSearch() {
    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
      searchTerm = e.target.value;
      if (searchClear) {
        searchClear.style.display = searchTerm ? "block" : "none";
      }
      renderPlaylist(searchTerm);
    });

    if (searchClear) {
      searchClear.addEventListener("click", () => {
        searchInput.value = "";
        searchTerm = "";
        searchClear.style.display = "none";
        renderPlaylist();
        searchInput.focus();
      });
    }
  }

  // ===== INITIALIZE =====
  async function init() {
    try {
      const res = await fetch("data/nhac.json");
      if (res.ok) {
        const rawData = await res.json();
        PLAYLIST = rawData.map((track) => {
          let src = track.src || "";
          const match = src.match(/archive\.org\/details\/([^\/?#]+)/);
          if (match) {
            const id = match[1];
            src = `https://archive.org/download/${id}/${id}.mp3`;
          }
          return { ...track, src };
        });
        // Vietnamese title collation
        PLAYLIST.sort((a, b) => a.title.localeCompare(b.title, "vi", { sensitivity: "accent" }));
      }
    } catch (e) {
      console.warn("Could not load nhac.json", e);
    }

    createVisualizer();
    createMusicNotes();
    updateCategoryCounts();
    initCategoryFilters();
    initLyricsCopy();
    initEvents();

    if (PLAYLIST.length > 0) {
      renderPlaylist();
      loadTrack(0);
    } else {
      if (playlistList) {
        playlistList.innerHTML = '<div class="playlist-item" style="text-align: center; color: var(--text-dark);">Chưa có bài nhạc nào.</div>';
      }
      if (playlistCount) playlistCount.textContent = "0 bài hát";
    }
    initSearch();
  }

  // Wait for DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
