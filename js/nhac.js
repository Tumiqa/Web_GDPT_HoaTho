/* ============================================================
   NHẠC GĐPT — Music Player JavaScript
   Streams audio from Archive.org
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

  // ===== VISUALIZER BARS =====
  const BAR_COUNT = 40;
  let visualizerBars = [];

  function createVisualizer() {
    // Insert bars before the overlay
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
      visualizerBars.forEach((bar, i) => {
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
    // Reset bars
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

  // ===== SEARCH =====
  const searchInput = document.getElementById("search-input");
  const searchClear = document.getElementById("search-clear");
  const searchNoResults = document.getElementById("search-no-results");
  let searchTerm = "";

  // Remove Vietnamese diacritics for fuzzy search
  function removeDiacritics(str) {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  }

  function filterPlaylist(query) {
    if (!query) return PLAYLIST.map((t, i) => ({ track: t, originalIndex: i }));
    const q = removeDiacritics(query);
    return PLAYLIST
      .map((track, i) => ({ track, originalIndex: i }))
      .filter(({ track }) => {
        const title = removeDiacritics(track.title);
        const artist = removeDiacritics(track.artist);
        return title.includes(q) || artist.includes(q);
      });
  }

  // ===== RENDER PLAYLIST =====
  function renderPlaylist(query) {
    if (!playlistList) return;

    const filtered = filterPlaylist(query);
    playlistList.innerHTML = "";

    if (playlistCount) {
      if (query && filtered.length !== PLAYLIST.length) {
        playlistCount.textContent = filtered.length + " / " + PLAYLIST.length + " bài hát";
      } else {
        playlistCount.textContent = PLAYLIST.length + " bài hát";
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
          <div class="playlist-item-title">${track.title}</div>
          <div class="playlist-item-meta">${track.artist}</div>
        </div>
        <div class="playlist-item-duration">${track.duration}</div>
        <a class="playlist-item-download" href="${track.src}" download title="Tải về ${track.title}" aria-label="Tải về ${track.title}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </a>
      `;

      // Click on row (but not on download) to play
      item.addEventListener("click", (e) => {
        // Don't trigger play if clicking download
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
    if (trackArtistEl) trackArtistEl.textContent = track.artist;

    // Reset progress
    if (progressFill) progressFill.style.width = "0%";
    if (currentTimeEl) currentTimeEl.textContent = "0:00";
    if (totalTimeEl) totalTimeEl.textContent = track.duration;

    // Update download button
    if (playerDownloadBtn) {
      playerDownloadBtn.href = track.src;
      playerDownloadBtn.title = "Tải về: " + track.title;
    }

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
    // If more than 3 seconds in, restart current track
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

  // ===== SHUFFLE & REPEAT =====
  function toggleShuffle() {
    isShuffle = !isShuffle;
    if (btnShuffle) {
      btnShuffle.style.color = isShuffle ? "var(--brand-primary)" : "";
    }
  }

  function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    if (btnRepeat) {
      switch (repeatMode) {
        case 0:
          btnRepeat.style.color = "";
          btnRepeat.title = "Lặp lại: Tắt";
          break;
        case 1:
          btnRepeat.style.color = "var(--brand-primary)";
          btnRepeat.title = "Lặp lại: Tất cả";
          break;
        case 2:
          btnRepeat.style.color = "#fff";
          btnRepeat.title = "Lặp lại: 1 bài";
          break;
      }
    }
  }

  // ===== PROGRESS =====
  function updateProgress() {
    if (!audio.duration) return;

    const percent = (audio.currentTime / audio.duration) * 100;
    if (progressFill) progressFill.style.width = percent + "%";
    if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
  }

  function seekTo(e) {
    if (!audio.duration) return;
    const rect = progressWrapper.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    audio.currentTime = percent * audio.duration;
  }

  // ===== VOLUME =====
  function changeVolume(e) {
    const val = e.target.value / 100;
    audio.volume = val;

    // Update volume icon
    const volumeIcon = document.getElementById("volume-icon");
    if (volumeIcon) {
      if (val === 0) {
        volumeIcon.innerHTML = `
          <line x1="23" y1="1" x2="1" y2="23"/>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        `;
      } else if (val < 0.5) {
        volumeIcon.innerHTML = `
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        `;
      } else {
        volumeIcon.innerHTML = `
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        `;
      }
    }
  }

  // ===== UPDATE PLAYLIST UI =====
  function updatePlaylistUI() {
    const items = document.querySelectorAll(".playlist-item");
    items.forEach((item) => {
      const idx = parseInt(item.getAttribute("data-index"));
      item.classList.remove("active", "is-playing");
      if (idx === currentIndex) {
        item.classList.add("active");
        if (isPlaying) item.classList.add("is-playing");
      }
    });
  }

  // ===== FORMAT TIME =====
  function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ":" + String(secs).padStart(2, "0");
  }

  // ===== AUDIO EVENTS =====
  audio.addEventListener("timeupdate", updateProgress);

  audio.addEventListener("loadedmetadata", () => {
    if (totalTimeEl) totalTimeEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("ended", () => {
    if (repeatMode === 2) {
      // Repeat one
      audio.currentTime = 0;
      playTrack();
    } else if (repeatMode === 1) {
      // Repeat all
      nextTrack();
    } else {
      // No repeat — stop at end of playlist
      if (currentIndex < PLAYLIST.length - 1) {
        nextTrack();
      } else {
        pauseTrack();
      }
    }
  });

  // ===== EVENT LISTENERS =====
  if (btnPlay) btnPlay.addEventListener("click", togglePlayPause);
  if (btnNext) btnNext.addEventListener("click", nextTrack);
  if (btnPrev) btnPrev.addEventListener("click", prevTrack);
  if (btnShuffle) btnShuffle.addEventListener("click", toggleShuffle);
  if (btnRepeat) btnRepeat.addEventListener("click", toggleRepeat);
  if (progressWrapper) progressWrapper.addEventListener("click", seekTo);
  if (volumeSlider) volumeSlider.addEventListener("input", changeVolume);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Don't intercept if user is typing in an input
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    switch (e.code) {
      case "Space":
        e.preventDefault();
        togglePlayPause();
        break;
      case "ArrowRight":
        if (e.shiftKey) {
          nextTrack();
        } else {
          audio.currentTime = Math.min(audio.currentTime + 5, audio.duration || 0);
        }
        break;
      case "ArrowLeft":
        if (e.shiftKey) {
          prevTrack();
        } else {
          audio.currentTime = Math.max(audio.currentTime - 5, 0);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        audio.volume = Math.min(audio.volume + 0.1, 1);
        if (volumeSlider) volumeSlider.value = audio.volume * 100;
        break;
      case "ArrowDown":
        e.preventDefault();
        audio.volume = Math.max(audio.volume - 0.1, 0);
        if (volumeSlider) volumeSlider.value = audio.volume * 100;
        break;
    }
  });

  // ===== SEARCH INIT =====
  function initSearch() {
    if (!searchInput) return;

    let debounceTimer = null;

    searchInput.addEventListener("input", (e) => {
      searchTerm = e.target.value.trim();

      // Show/hide clear button
      if (searchClear) {
        searchClear.style.display = searchTerm ? "flex" : "none";
      }

      // Debounce search
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        renderPlaylist(searchTerm);
      }, 200);
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
        PLAYLIST = await res.json();
      }
    } catch (e) {
      console.warn("Could not load nhac.json", e);
    }

    createVisualizer();
    createMusicNotes();
    if (PLAYLIST.length > 0) {
      renderPlaylist();
      loadTrack(0);
    } else {
      if (playlistList) playlistList.innerHTML = '<div class="playlist-item" style="text-align: center; color: var(--text-dark);">Chưa có bài nhạc nào.</div>';
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
