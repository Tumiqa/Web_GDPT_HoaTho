document.addEventListener("DOMContentLoaded", () => {
  // ===== BRAILLE DOT PATTERNS (6-dot cell) =====
  // Dot numbering:  1 4
  //                 2 5
  //                 3 6
  const brailleDots = {
    'A': [1],         'B': [1,2],       'C': [1,4],
    'D': [1,4,5],     'E': [1,5],       'F': [1,2,4],
    'G': [1,2,4,5],   'H': [1,2,5],     'I': [2,4],
    'J': [2,4,5],     'K': [1,3],       'L': [1,2,3],
    'M': [1,3,4],     'N': [1,3,4,5],   'O': [1,3,5],
    'P': [1,2,3,4],   'Q': [1,2,3,4,5], 'R': [1,2,3,5],
    'S': [2,3,4],     'T': [2,3,4,5],   'U': [1,3,6],
    'V': [1,2,3,6],   'W': [2,4,5,6],   'X': [1,3,4,6],
    'Y': [1,3,4,5,6], 'Z': [1,3,5,6],
    '1': [1],         '2': [1,2],       '3': [1,4],
    '4': [1,4,5],     '5': [1,5],       '6': [1,2,4],
    '7': [1,2,4,5],   '8': [1,2,5],     '9': [2,4],
    '0': [2,4,5]
  };

  // Build a Braille cell HTML (2x3 grid showing all 6 dots)
  function buildBrailleCell(char, showHover) {
    const dots = brailleDots[char.toUpperCase()] || [];
    const activeDots = new Set(dots);

    let html = `<div class="braille-cell-wrapper${showHover ? ' braille-hoverable' : ''}">`;
    html += `<div class="braille-cell">`;
    for (let i = 1; i <= 6; i++) {
      const isActive = activeDots.has(i);
      html += `<span class="braille-dot${isActive ? ' active' : ''}"></span>`;
    }
    html += `</div>`;
    if (showHover) {
      html += `<span class="braille-latin">${char.toUpperCase()}</span>`;
    }
    html += `</div>`;
    return html;
  }

  // Build multiple Braille cells for a word/sentence
  function buildBrailleCells(text, showHover) {
    return text.split('').map(c => {
      if (c === ' ') return '<span class="braille-space"></span>';
      return buildBrailleCell(c, showHover);
    }).join('');
  }

  // ===== CIPHER TYPES =====
  const cipherTypes = {
    dancing: {
      name: 'Hình Nhân Nhảy Múa',
      fontClass: 'dancing-men-font',
      useHTML: false,
      transform: (char) => char.toUpperCase(),
    },
    asl: {
      name: 'Thủ Ngữ Ngón Tay',
      fontClass: 'asl-font',
      useHTML: false,
      transform: (char) => char.toLowerCase(),
    },
    braille: {
      name: 'Mật Mã Braille',
      fontClass: 'braille-font',
      useHTML: true,
      transformHTML: (char) => buildBrailleCell(char, true),
      transformMultiHTML: (text) => buildBrailleCells(text, true),
    }
  };

  // ===== DOM ELEMENTS =====
  const cipherModal = document.getElementById("cipher-modal-backdrop");
  const openBtn = document.getElementById("open-cipher-btn");
  const closeBtn = document.getElementById("cipher-modal-close");
  const selectScreen = document.getElementById("cipher-select-screen");
  const toolScreen = document.getElementById("cipher-tool-screen");
  const backBtn = document.getElementById("cipher-back-btn");
  const toolTitle = document.getElementById("cipher-tool-title");
  const displayMain = document.getElementById("cipher-display-main");
  const displaySub = document.getElementById("cipher-display-sub");
  const keyboard = document.getElementById("cipher-keyboard");
  const tabs = document.querySelectorAll(".cipher-tab");
  const tabContents = document.querySelectorAll(".cipher-tab-content");

  // Practice elements
  const pracLevel = document.getElementById("cipher-prac-level");
  const pracStart = document.getElementById("cipher-prac-start");
  const pracInput = document.getElementById("cipher-prac-input");
  const pracSubmit = document.getElementById("cipher-prac-submit");
  const pracFeedback = document.getElementById("cipher-prac-feedback");
  const pracInputArea = pracInput ? pracInput.closest(".sema-prac-input-area") : null;

  let currentType = null;
  let currentPracAnswer = "";

  // Practice word bank
  const pracChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
  const pracWords = [
    "HELLO", "SCOUT", "PEACE", "BRAVE", "UNITY",
    "TRUST", "HONOR", "LIGHT", "TRUTH", "NOBLE",
    "WORLD", "HEART", "FLAME", "STORM", "DREAM"
  ];
  const pracSentences = [
    "BE BRAVE", "STAY TRUE", "FIND PEACE",
    "SEEK TRUTH", "KEEP CALM", "GO FORWARD"
  ];

  // ===== MODAL OPEN/CLOSE =====
  if (openBtn) {
    openBtn.addEventListener("click", () => {
      cipherModal.classList.add("visible");
      document.body.style.overflow = "hidden";
    });
  }

  function closeCipher() {
    cipherModal.classList.remove("visible");
    document.body.style.overflow = "";
    toolScreen.classList.remove("active");
    selectScreen.style.display = "flex";
    currentType = null;
  }

  if (closeBtn) closeBtn.addEventListener("click", closeCipher);
  if (cipherModal) {
    cipherModal.addEventListener("click", (e) => {
      if (e.target === cipherModal) closeCipher();
    });
  }

  // ===== SELECTION SCREEN =====
  document.querySelectorAll(".cipher-card").forEach(card => {
    card.addEventListener("click", () => {
      openCipherTool(card.dataset.type);
    });
  });

  function openCipherTool(type) {
    currentType = type;
    const cfg = cipherTypes[type];
    if (!cfg) return;

    toolTitle.textContent = cfg.name;
    selectScreen.style.display = "none";
    toolScreen.classList.add("active");

    // Reset display
    displayMain.className = "cipher-display-main " + cfg.fontClass;
    displayMain.textContent = "";
    displayMain.innerHTML = "";
    displaySub.textContent = "";

    // Reset tabs to Learn
    tabs.forEach(t => t.classList.remove("active"));
    tabContents.forEach(tc => tc.classList.remove("active"));
    tabs[0].classList.add("active");
    document.getElementById("cipher-tab-learn").classList.add("active");

    buildKeyboard();
    resetPractice();
  }

  function resetPractice() {
    pracFeedback.textContent = "Nhấn Bắt đầu để nhận đề bài!";
    pracFeedback.style.color = "#fbbf24";
    pracInput.value = "";
    pracInput.disabled = true;
    pracSubmit.disabled = true;
    if (pracInputArea) pracInputArea.classList.remove("active");
    currentPracAnswer = "";
    pracStart.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg> Bắt Đầu Luyện Tập`;
  }

  // ===== BACK BUTTON =====
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      toolScreen.classList.remove("active");
      selectScreen.style.display = "flex";
      currentType = null;
      displayMain.textContent = "";
      displayMain.innerHTML = "";
      displaySub.textContent = "";
    });
  }

  // ===== TABS =====
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tabContents.forEach(tc => tc.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("cipher-tab-" + tab.dataset.tab).classList.add("active");
      displayMain.textContent = "";
      displayMain.innerHTML = "";
      displaySub.textContent = "";
      if (tab.dataset.tab === "learn") resetPractice();
    });
  });

  // ===== BUILD KEYBOARD =====
  function buildKeyboard() {
    keyboard.innerHTML = "";
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').forEach(c => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#";
      a.textContent = c;
      a.dataset.char = c;
      a.id = "cipher-key-" + c;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        showChar(c, a);
      });
      li.appendChild(a);
      keyboard.appendChild(li);
    });
  }

  // ===== SHOW CHARACTER =====
  function showChar(char, btnEl) {
    if (!currentType) return;
    const cfg = cipherTypes[currentType];

    keyboard.querySelectorAll("a.active").forEach(el => el.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");

    displayMain.className = "cipher-display-main " + cfg.fontClass;
    if (cfg.useHTML) {
      displayMain.innerHTML = cfg.transformHTML(char);
      displaySub.textContent = char;
    } else {
      displayMain.innerHTML = "";
      displayMain.textContent = cfg.transform(char);
      displaySub.textContent = char;
    }
  }

  // ===== KEYBOARD INPUT =====
  document.addEventListener("keydown", (e) => {
    if (!cipherModal || !cipherModal.classList.contains("visible")) return;
    if (!currentType) return;
    const learnTab = document.getElementById("cipher-tab-learn");
    if (!learnTab || !learnTab.classList.contains("active")) return;
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    let key = e.key.toUpperCase();
    if ((key >= 'A' && key <= 'Z') || (key >= '0' && key <= '9')) {
      e.preventDefault();
      showChar(key, document.getElementById("cipher-key-" + key));
    }
  });

  // Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && cipherModal && cipherModal.classList.contains("visible")) {
      if (currentType && toolScreen.classList.contains("active")) {
        toolScreen.classList.remove("active");
        selectScreen.style.display = "flex";
        currentType = null;
      } else {
        closeCipher();
      }
    }
  });

  // ===== PRACTICE MODE =====
  if (pracStart) {
    pracStart.addEventListener("click", startPractice);
  }

  function startPractice() {
    if (!currentType) return;
    const cfg = cipherTypes[currentType];
    const level = pracLevel.value;

    let targetText = "";
    if (level === "char") {
      targetText = pracChars[Math.floor(Math.random() * pracChars.length)];
    } else if (level === "word") {
      targetText = pracWords[Math.floor(Math.random() * pracWords.length)];
    } else {
      targetText = pracSentences[Math.floor(Math.random() * pracSentences.length)];
    }

    currentPracAnswer = targetText.replace(/\s+/g, '');

    // Display cipher
    displayMain.className = "cipher-display-main " + cfg.fontClass;
    if (cfg.useHTML) {
      // Braille: visual cells WITHOUT hover (don't reveal answer)
      let html = targetText.split('').map(c => {
        if (c === ' ') return '<span class="braille-space"></span>';
        return buildBrailleCell(c, false);
      }).join('');
      displayMain.innerHTML = html;
    } else {
      let cipherText = targetText.split('').map(c => {
        if (c === ' ') return '  ';
        return cfg.transform(c);
      }).join('');
      displayMain.innerHTML = "";
      displayMain.textContent = cipherText;
    }
    displaySub.textContent = "???";

    pracFeedback.textContent = "Hãy đọc ký hiệu trên và nhập đáp án:";
    pracFeedback.style.color = "#a0aec0";
    pracInput.value = "";
    pracInput.disabled = false;
    pracSubmit.disabled = false;
    if (pracInputArea) pracInputArea.classList.add("active");
    pracInput.focus();

    pracStart.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg> Đề Mới`;
  }

  function checkAnswer() {
    if (!currentPracAnswer) return;
    const userAns = pracInput.value.toUpperCase().replace(/\s+/g, '');
    if (userAns === currentPracAnswer) {
      pracFeedback.textContent = "🎉 CHÍNH XÁC! Quá tuyệt vời!";
      pracFeedback.style.color = "#48bb78";
      displaySub.textContent = currentPracAnswer;
    } else {
      pracFeedback.textContent = `❌ SAI RỒI! Đáp án đúng là: ${currentPracAnswer}`;
      pracFeedback.style.color = "#f56565";
      displaySub.textContent = currentPracAnswer;
    }
  }

  if (pracSubmit) pracSubmit.addEventListener("click", checkAnswer);
  if (pracInput) {
    pracInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") checkAnswer();
    });
  }
});
