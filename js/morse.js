document.addEventListener("DOMContentLoaded", () => {
  const morseCode = {
    'A': ".-", 'B': "-...", 'C': "-.-.", 'D': "-..", 'E': ".", 'F': "..-.", 'G': "--.", 'H': "....", 'I': "..",
    'J': ".---", 'K': "-.-", 'L': ".-..", 'M': "--", 'N': "-.", 'O': "---", 'P': ".--.", 'Q': "--.-", 'R': ".-.",
    'S': "...", 'T': "-", 'U': "..-", 'V': "...-", 'W': ".--", 'X': "-..-", 'Y': "-.--", 'Z': "--..",
    '0': "-----", '1': ".----", '2': "..---", '3': "...--", '4': "....-", '5': ".....", '6': "-....",
    '7': "--...", '8': "---..", '9': "----."
  };

  const reverseMorseCode = {};
  for (const key in morseCode) reverseMorseCode[morseCode[key]] = key;

  // Vietnamese to Telex mapping
  const telexMap = {
    'ă': 'aw', 'â': 'aa', 'đ': 'dd', 'ê': 'ee', 'ô': 'oo', 'ơ': 'ow', 'ư': 'uw',
    'á': 'as', 'à': 'af', 'ả': 'ar', 'ã': 'ax', 'ạ': 'aj',
    'ắ': 'aws', 'ằ': 'awf', 'ẳ': 'awr', 'ẵ': 'awx', 'ặ': 'awj',
    'ấ': 'aas', 'ầ': 'aaf', 'ẩ': 'aar', 'ẫ': 'aax', 'ậ': 'aaj',
    'é': 'es', 'è': 'ef', 'ẻ': 'er', 'ẽ': 'ex', 'ẹ': 'ej',
    'ế': 'ees', 'ề': 'eef', 'ể': 'eer', 'ễ': 'eex', 'ệ': 'eej',
    'í': 'is', 'ì': 'if', 'ỉ': 'ir', 'ĩ': 'ix', 'ị': 'ij',
    'ó': 'os', 'ò': 'of', 'ỏ': 'or', 'õ': 'ox', 'ọ': 'oj',
    'ố': 'oos', 'ồ': 'oof', 'ổ': 'oor', 'ỗ': 'oox', 'ộ': 'ooj',
    'ớ': 'ows', 'ờ': 'owf', 'ở': 'owr', 'ỡ': 'owx', 'ợ': 'owj',
    'ú': 'us', 'ù': 'uf', 'ủ': 'ur', 'ũ': 'ux', 'ụ': 'uj',
    'ứ': 'uws', 'ừ': 'uwf', 'ử': 'uwr', 'ữ': 'uwx', 'ự': 'uwj',
    'ý': 'ys', 'ỳ': 'yf', 'ỷ': 'yr', 'ỹ': 'yx', 'ỵ': 'yj'
  };

  function toTelex(str) {
    let result = '';
    str = str.toLowerCase();
    for (let i = 0; i < str.length; i++) {
      let char = str[i];
      if (telexMap[char]) {
        result += telexMap[char];
      } else {
        result += char;
      }
    }
    return result.toUpperCase();
  }

  function removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toUpperCase();
  }

  // Audio Context
  let audioCtx = null;
  
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  let isPlaying = false;
  let currentTimeout = null;
  let oscillator = null;
  let gainNode = null;

  const beacon = document.getElementById("morse-beacon");
  const outputDisplay = document.getElementById("morse-output-display");
  const outputText = document.getElementById("morse-output-text");

  function stopPlayback() {
    isPlaying = false;
    clearTimeout(currentTimeout);
    if (oscillator) {
      try { oscillator.stop(); } catch(e) {}
      oscillator.disconnect();
      oscillator = null;
    }
    if (beacon) beacon.classList.remove('morse-beacon-on');
  }

  function playTone(duration, callback) {
    if (!audioCtx) return callback();
    
    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 800; // 800Hz
    
    // Smooth envelope to prevent popping clicks
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.01);
    gainNode.gain.setValueAtTime(1, audioCtx.currentTime + (duration/1000) - 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + (duration/1000));

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + (duration/1000));
    
    if (beacon) beacon.classList.add('morse-beacon-on');

    currentTimeout = setTimeout(() => {
      if (beacon) beacon.classList.remove('morse-beacon-on');
      callback();
    }, duration);
  }

  // Play a sequence of dots and dashes
  function playSequence(sequence, speedWPM, onComplete) {
    if (!isPlaying) return;

    // standard formula: DOT duration = 1200 / WPM (ms)
    const DOT = Math.round(1200 / speedWPM);
    const DASH = 3 * DOT;
    const SYMBOL_SPACE = DOT; // between dots/dashes in a char
    const CHAR_SPACE = 3 * DOT; // between chars
    const WORD_SPACE = 7 * DOT; // between words

    let i = 0;
    
    function next() {
      if (!isPlaying || i >= sequence.length) {
        if (onComplete) onComplete();
        return;
      }

      let char = sequence[i];
      i++;

      if (char === '.') {
        playTone(DOT, () => {
          currentTimeout = setTimeout(next, SYMBOL_SPACE);
        });
      } else if (char === '-') {
        playTone(DASH, () => {
          currentTimeout = setTimeout(next, SYMBOL_SPACE);
        });
      } else if (char === ' ') {
        // Space between characters
        currentTimeout = setTimeout(next, CHAR_SPACE - SYMBOL_SPACE);
      } else if (char === '/') {
        // Space between words
        currentTimeout = setTimeout(next, WORD_SPACE - SYMBOL_SPACE);
      } else {
        next();
      }
    }

    next();
  }

  // UI Setup
  const morseModal = document.getElementById("morse-modal-backdrop");
  const openMorseBtn = document.getElementById("open-morse-btn");
  const closeMorseBtn = document.getElementById("morse-modal-close");

  if (openMorseBtn) {
    openMorseBtn.addEventListener("click", () => {
      morseModal.style.display = "flex";
      setTimeout(() => morseModal.classList.add("visible"), 10);
      initAudio();
    });
  }

  if (closeMorseBtn) {
    closeMorseBtn.addEventListener("click", () => {
      stopPlayback();
      morseModal.classList.remove("visible");
      setTimeout(() => morseModal.style.display = "none", 300);
    });
  }

  // Tabs
  const tabs = document.querySelectorAll(".morse-tab");
  const tabContents = document.querySelectorAll(".morse-tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      stopPlayback();
      const target = tab.getAttribute("data-tab");
      tabs.forEach(t => t.classList.remove("active"));
      tabContents.forEach(tc => tc.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`morse-tab-${target}`).classList.add("active");
      outputDisplay.textContent = "";
      outputText.textContent = "";
    });
  });

  // TRANSLATE MODE
  const learnInput = document.getElementById("morse-learn-input");
  const learnPlayBtn = document.getElementById("morse-learn-play");
  const learnStopBtn = document.getElementById("morse-learn-stop");
  const learnSpeed = document.getElementById("morse-learn-speed");

  function isMorseCode(str) {
    const validMorse = /^[.\-\s/]+$/;
    return validMorse.test(str.trim());
  }

  learnPlayBtn.addEventListener("click", () => {
    initAudio();
    stopPlayback();
    
    let text = learnInput.value.trim();
    if (!text) return;

    if (isMorseCode(text)) {
      // Translate Morse to Text
      let words = text.split('/');
      let translated = words.map(w => {
        let chars = w.trim().split(' ');
        return chars.map(c => reverseMorseCode[c] || '?').join('');
      }).join(' ');
      
      outputDisplay.textContent = text;
      outputText.textContent = translated;
      
      // Play it
      isPlaying = true;
      learnPlayBtn.style.display = 'none';
      learnStopBtn.style.display = 'block';
      playSequence(text, parseInt(learnSpeed.value), () => {
        learnPlayBtn.style.display = 'block';
        learnStopBtn.style.display = 'none';
      });

    } else {
      // Translate Text to Morse (Using Telex)
      let telexText = toTelex(text);
      let words = telexText.split(/\s+/);
      let morseWords = words.map(w => {
        let chars = w.split('');
        return chars.map(c => morseCode[c] || '').filter(Boolean).join(' ');
      });
      let morseTranslation = morseWords.join(' / ');

      outputDisplay.textContent = morseTranslation;
      outputText.textContent = telexText;

      isPlaying = true;
      learnPlayBtn.style.display = 'none';
      learnStopBtn.style.display = 'block';
      playSequence(morseTranslation, parseInt(learnSpeed.value), () => {
        learnPlayBtn.style.display = 'block';
        learnStopBtn.style.display = 'none';
      });
    }
  });

  learnStopBtn.addEventListener("click", () => {
    stopPlayback();
    learnPlayBtn.style.display = 'block';
    learnStopBtn.style.display = 'none';
  });

  // PRACTICE MODE
  const pracLevel = document.getElementById("morse-prac-level");
  const pracSpeed = document.getElementById("morse-prac-speed");
  const pracStart = document.getElementById("morse-prac-start");
  const pracInput = document.getElementById("morse-prac-input");
  const pracSubmit = document.getElementById("morse-prac-submit");
  const pracFeedback = document.getElementById("morse-prac-feedback");
  
  let currentPracAnswer = "";
  let pracActive = false;

  const pracWords = ["LIEN HOA", "TINH TAN", "HOA BINH", "THIEN NHIEN", "PHAT PHAP", "TRI TUE", "BI DUNG", "GIA DINH"];
  const pracSentences = ["SEN TRANG SANG NGOI", "TINH TAN TU HOC", "GIU GIN GIOI LUAT", "PHAT TU VIET NAM", "HOA BINH THANH TINH"];

  function startPractice() {
    initAudio();
    stopPlayback();
    pracActive = true;
    pracInput.value = "";
    pracInput.disabled = true;
    pracSubmit.disabled = true;
    pracFeedback.textContent = "Đang phát tín hiệu... Lắng nghe/Quan sát nhé!";
    pracFeedback.style.color = "#a0aec0";
    outputDisplay.textContent = "";
    outputText.textContent = "";

    let level = pracLevel.value;
    let targetText = "";

    if (level === 'char') {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      targetText = chars[Math.floor(Math.random() * chars.length)];
    } else if (level === 'word_notone') {
      targetText = pracWords[Math.floor(Math.random() * pracWords.length)];
    } else if (level === 'word_telex') {
      let word = pracWords[Math.floor(Math.random() * pracWords.length)];
      // add fake accents for practice
      const accentedWords = ["LIÊN HOA", "TINH TẤN", "HÒA BÌNH", "THIÊN NHIÊN", "PHẬT PHÁP", "TRÍ TUỆ", "BI DŨNG", "GIA ĐÌNH"];
      let accWord = accentedWords[Math.floor(Math.random() * accentedWords.length)];
      targetText = toTelex(accWord);
    } else {
      let sent = pracSentences[Math.floor(Math.random() * pracSentences.length)];
      targetText = toTelex(sent);
    }

    currentPracAnswer = targetText.replace(/\s+/g, ''); // ignore spaces for answering

    // Convert to morse
    let words = targetText.split(/\s+/);
    let morseWords = words.map(w => {
      return w.split('').map(c => morseCode[c] || '').filter(Boolean).join(' ');
    });
    let sequence = morseWords.join(' / ');

    isPlaying = true;
    pracStart.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Dừng Truyền Tin`;
    
    playSequence(sequence, parseInt(pracSpeed.value), () => {
      pracActive = false;
      pracStart.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg> Phát Lại / Chơi Tiếp`;
      pracFeedback.textContent = "Đã phát xong! Hãy nhập đáp án của bạn:";
      pracFeedback.style.color = "#48bb78";
      pracInput.disabled = false;
      pracSubmit.disabled = false;
      pracInput.focus();
    });
  }

  pracStart.addEventListener("click", () => {
    if (isPlaying) {
      stopPlayback();
      pracActive = false;
      pracStart.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg> Bắt Đầu Luyện Tập`;
      pracFeedback.textContent = "Đã dừng. Nhấn Bắt đầu để thử lại.";
      pracFeedback.style.color = "#f56565";
      pracInput.disabled = true;
      pracSubmit.disabled = true;
    } else {
      startPractice();
    }
  });

  function checkAnswer() {
    if (!currentPracAnswer) return;
    let userAns = pracInput.value.toUpperCase().replace(/\s+/g, '');
    if (userAns === currentPracAnswer) {
      pracFeedback.textContent = "🎉 CHÍNH XÁC! Quá tuyệt vời!";
      pracFeedback.style.color = "#48bb78";
      outputDisplay.textContent = currentPracAnswer;
    } else {
      pracFeedback.textContent = `❌ SAI RỒI! Đáp án đúng là: ${currentPracAnswer}`;
      pracFeedback.style.color = "#f56565";
    }
  }

  pracSubmit.addEventListener("click", checkAnswer);
  pracInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") checkAnswer();
  });
});
