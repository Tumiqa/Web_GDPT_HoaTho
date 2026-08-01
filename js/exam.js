/* ============================================================
   GĐPT HÒA THỌ — Exam Portal Frontend Engine (Tiếng Việt 100%)
   Anti-Cheat Security · Dynamic Watermark · Minimalist Clean UI · Re-take Exam Support
   ============================================================ */

(function () {
  'use strict';

  const AUTH_URL = 'auth.php';
  let currentExam = null;
  let currentQuestions = [];
  let userAnswers = {};
  let timerInterval = null;
  let timeRemaining = 0;
  let timeSpentSeconds = 0;
  let tabSwitches = 0;
  let hasLeftTab = false;
  let isExamActive = false;
  let currentUserInfo = null;

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ===== HTML MODAL TEMPLATE =====
  function injectExamModalHTML() {
    if (document.getElementById('exam-modal-overlay')) return;

    const modalHTML = `
      <div class="exam-modal-overlay" id="exam-modal-overlay">
        <div class="exam-watermark-overlay" id="exam-watermark-overlay"></div>
        <div class="exam-modal" id="exam-modal">
          <div class="exam-header">
            <div class="exam-header__title" id="exam-header-title">
              <span id="exam-title-text">Bài Kiểm Tra Kiến Thức</span>
            </div>
            <div class="exam-header__badges">
              <span class="exam-warning-pill" id="exam-tab-warning" style="display:none;">Chuyển tab: 0/3</span>
              <span class="exam-timer-pill" id="exam-timer-pill">00:00</span>
            </div>
          </div>
          <div class="exam-progress-bar">
            <div class="exam-progress-fill" id="exam-progress-fill"></div>
          </div>
          <div class="exam-body" id="exam-body">
            <!-- Questions or Results rendered here -->
          </div>
          <div class="exam-footer" id="exam-footer">
            <button type="button" class="exam-btn exam-btn--cancel" id="exam-cancel-btn">Hủy bỏ</button>
            <button type="button" class="exam-btn exam-btn--submit" id="exam-submit-btn">Nộp bài thi</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('exam-cancel-btn').addEventListener('click', () => {
      if (isExamActive) {
        if (confirm('Bạn có chắc chắn muốn hủy bài thi đang làm? Kết quả lần này sẽ không được lưu.')) {
          closeExamModal();
        }
      } else {
        closeExamModal();
      }
    });

    document.getElementById('exam-submit-btn').addEventListener('click', () => {
      const btn = document.getElementById('exam-submit-btn');
      const retakeId = btn ? btn.dataset.retakeExamId : null;
      if (retakeId) {
        // Đang ở màn hình review → Làm lại bài thi
        delete btn.dataset.retakeExamId;
        openExamModal(retakeId);
      } else if (isExamActive) {
        if (confirm('Bạn có chắc chắn muốn nộp bài thi ngay bây giờ?')) {
          submitExam(false);
        }
      }
    });
  }

  // ===== ANTI-CHEAT SECURITY ENGINE =====
  function enableAntiCheat(user) {
    const watermarkContainer = document.getElementById('exam-watermark-overlay');
    if (watermarkContainer) {
      watermarkContainer.innerHTML = '';
      const text = `${user.displayName || user.fullName || user.username} • @${user.username} • ${new Date().toLocaleDateString('vi-VN')}`;
      for (let i = 0; i < 18; i++) {
        const item = document.createElement('div');
        item.className = 'exam-watermark-item';
        item.textContent = text;
        watermarkContainer.appendChild(item);
      }
    }

    document.addEventListener('contextmenu', blockEvent);
    document.addEventListener('copy', blockEvent);
    document.addEventListener('cut', blockEvent);
    document.addEventListener('selectstart', blockEvent);
    document.addEventListener('keydown', handleKeyLock);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  function disableAntiCheat() {
    document.removeEventListener('contextmenu', blockEvent);
    document.removeEventListener('copy', blockEvent);
    document.removeEventListener('cut', blockEvent);
    document.removeEventListener('selectstart', blockEvent);
    document.removeEventListener('keydown', handleKeyLock);
    window.removeEventListener('blur', handleWindowBlur);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  }

  function blockEvent(e) {
    if (!isExamActive) return;
    if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'text') return;
    e.preventDefault();
    return false;
  }

  function handleKeyLock(e) {
    if (!isExamActive) return;
    if (e.target && e.target.tagName === 'INPUT') return;

    if (
      (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'u' || e.key === 's' || e.key === 'a')) ||
      e.key === 'F12' ||
      e.key === 'PrintScreen'
    ) {
      e.preventDefault();
      alert('Thao tác bàn phím này bị chặn trong khi làm bài thi.');
      return false;
    }
  }

  // Đánh dấu khi mất focus cửa sổ (dùng blur để bắt cả trường hợp Alt+Tab)
  function handleWindowBlur() {
    if (!isExamActive) return;
    hasLeftTab = true;
  }

  function handleVisibilityChange() {
    if (!isExamActive) return;
    if (document.hidden) {
      // Rời khỏi tab → đánh dấu
      hasLeftTab = true;
    } else {
      // Quay lại tab → nếu đã rời đi thì mới tính 1 lần
      if (hasLeftTab) {
        hasLeftTab = false;
        registerTabSwitchViolation();
      }
    }
  }

  function registerTabSwitchViolation() {
    tabSwitches++;
    const maxAllowed = currentExam ? (currentExam.max_tab_switches || 3) : 3;
    const warningPill = document.getElementById('exam-tab-warning');
    if (warningPill) {
      warningPill.style.display = 'inline-flex';
      warningPill.textContent = `Chuyển tab: ${tabSwitches}/${maxAllowed}`;
    }

    if (tabSwitches >= maxAllowed) {
      alert(`Bạn đã vi phạm rời màn hình thi ${tabSwitches} lần. Hệ thống sẽ tự động nộp bài!`);
      submitExam(true);
    } else {
      alert(`Cảnh báo vi phạm (${tabSwitches}/${maxAllowed}): Bạn đã chuyển tab/màn hình. Vui lòng không rời khỏi bài thi!`);
    }
  }

  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  async function openExamModal(examId) {
    injectExamModalHTML();

    try {
      const authRes = await fetch(`${AUTH_URL}?action=me`, { credentials: 'same-origin' });
      if (!authRes.ok) throw new Error('Chưa đăng nhập');
      const authData = await authRes.json();
      if (!authData.authenticated || !authData.user) {
        alert('Vui lòng đăng nhập để làm bài thi.');
        if (window.openGDPTAdmin) window.openGDPTAdmin();
        return;
      }
      currentUserInfo = authData.user;
    } catch (e) {
      alert('Vui lòng đăng nhập để làm bài thi.');
      if (window.openGDPTAdmin) window.openGDPTAdmin();
      return;
    }

    try {
      const res = await fetch(`${AUTH_URL}?action=get-exam&id=${encodeURIComponent(examId)}`);
      if (!res.ok) throw new Error('Không thể tải bài thi');
      const data = await res.json();
      if (!data.exam) throw new Error('Bài thi không tồn tại');
      currentExam = data.exam;
    } catch (e) {
      alert('Lỗi: ' + e.message);
      return;
    }

    let rawQuestions = currentExam.questions || [];
    if (rawQuestions.length === 0) {
      alert('Bài thi này chưa có câu hỏi.');
      return;
    }

    if (currentExam.shuffle_questions) {
      currentQuestions = shuffleArray(rawQuestions);
    } else {
      currentQuestions = [...rawQuestions];
    }

    currentQuestions = currentQuestions.map(q => {
      const qCopy = { ...q };
      if (currentExam.shuffle_options && (q.type === 'single' || q.type === 'multiple') && Array.isArray(q.options)) {
        const indexedOptions = q.options.map((opt, idx) => ({ text: opt, originalIndex: idx }));
        qCopy.displayOptions = shuffleArray(indexedOptions);
      } else if (Array.isArray(q.options)) {
        qCopy.displayOptions = q.options.map((opt, idx) => ({ text: opt, originalIndex: idx }));
      }
      return qCopy;
    });

    // Reset Exam State completely
    userAnswers = {};
    timeSpentSeconds = 0;
    tabSwitches = 0;
    hasLeftTab = false;
    isExamActive = true;
    timeRemaining = (currentExam.time_limit_minutes || 15) * 60;

    // Reset UI Elements & Buttons
    const submitBtn = document.getElementById('exam-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Nộp bài thi';
      submitBtn.className = 'exam-btn exam-btn--submit'; // Restore class gốc
      submitBtn.onclick = null; // Xóa onclick cũ nếu còn sót
      delete submitBtn.dataset.retakeExamId; // Xóa flag làm lại
    }

    const cancelBtn = document.getElementById('exam-cancel-btn');
    if (cancelBtn) {
      cancelBtn.textContent = 'Hủy bỏ';
      cancelBtn.style.display = 'inline-flex';
    }

    document.getElementById('exam-title-text').textContent = currentExam.title;
    document.getElementById('exam-tab-warning').style.display = 'none';
    document.getElementById('exam-footer').style.display = 'flex';
    document.getElementById('exam-modal-overlay').classList.add('visible');

    disableAntiCheat(); // Cleanup listeners cũ trước khi add mới (tránh chồng chất khi làm lại)
    enableAntiCheat(currentUserInfo);
    renderQuestionsForm();
    startTimer();
  }

  function renderQuestionsForm() {
    const container = document.getElementById('exam-body');
    container.innerHTML = currentQuestions.map((q, idx) => {
      const qNum = idx + 1;
      const imgHTML = q.image_url ? `<img src="${q.image_url}" class="exam-q-img" alt="Hình minh họa" />` : '';

      let optionsHTML = '';
      if (q.type === 'single' || q.type === 'boolean') {
        const opts = q.type === 'boolean' ? [
          { text: 'Đúng', originalIndex: 1 },
          { text: 'Sai', originalIndex: 0 }
        ] : (q.displayOptions || []);

        optionsHTML = `<div class="exam-options-list">` +
          opts.map(opt => `
            <label class="exam-option" data-qid="${q.id}">
              <input type="radio" name="q_${q.id}" value="${opt.originalIndex}" onchange="window.GDPTExamEngine.recordAnswer('${q.id}', ${opt.originalIndex}, 'single', this)" />
              <span class="exam-option-text">${esc(opt.text)}</span>
            </label>
          `).join('') +
          `</div>`;
      } else if (q.type === 'multiple') {
        const opts = q.displayOptions || [];
        optionsHTML = `<div class="exam-options-list">` +
          opts.map(opt => `
            <label class="exam-option" data-qid="${q.id}">
              <input type="checkbox" name="q_${q.id}" value="${opt.originalIndex}" onchange="window.GDPTExamEngine.recordAnswer('${q.id}', ${opt.originalIndex}, 'multiple', this)" />
              <span class="exam-option-text">${esc(opt.text)}</span>
            </label>
          `).join('') +
          `</div>`;
      } else if (q.type === 'short_answer') {
        optionsHTML = `
          <input type="text" class="exam-short-input" placeholder="Nhập câu trả lời của bạn vào đây..." oninput="window.GDPTExamEngine.recordAnswer('${q.id}', this.value, 'short', this)" />
        `;
      }

      return `
        <div class="exam-q-card" id="q-card-${q.id}">
          <div class="exam-q-num">Câu hỏi ${qNum} / ${currentQuestions.length}</div>
          <div class="exam-q-text">${esc(q.text)}</div>
          ${imgHTML}
          ${optionsHTML}
        </div>
      `;
    }).join('');
  }

  function recordAnswer(qId, value, type, inputEl) {
    if (!isExamActive) return;

    if (type === 'single') {
      userAnswers[qId] = parseInt(value, 10);
      const card = document.getElementById(`q-card-${qId}`);
      if (card) {
        card.querySelectorAll('.exam-option').forEach(el => el.classList.remove('selected'));
        if (inputEl) inputEl.closest('.exam-option').classList.add('selected');
      }
    } else if (type === 'multiple') {
      if (!userAnswers[qId]) userAnswers[qId] = [];
      const valInt = parseInt(value, 10);
      if (inputEl.checked) {
        if (!userAnswers[qId].includes(valInt)) userAnswers[qId].push(valInt);
        inputEl.closest('.exam-option').classList.add('selected');
      } else {
        userAnswers[qId] = userAnswers[qId].filter(x => x !== valInt);
        inputEl.closest('.exam-option').classList.remove('selected');
      }
    } else if (type === 'short') {
      userAnswers[qId] = value;
    }
  }

  function startTimer() {
    clearInterval(timerInterval);
    updateTimerUI();

    timerInterval = setInterval(() => {
      timeRemaining--;
      timeSpentSeconds++;
      updateTimerUI();

      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        alert('Hết giờ làm bài! Hệ thống tự động nộp bài thi.');
        submitExam(true);
      }
    }, 1000);
  }

  function updateTimerUI() {
    const timerPill = document.getElementById('exam-timer-pill');
    const progressFill = document.getElementById('exam-progress-fill');
    if (!timerPill) return;

    const mins = Math.floor(Math.max(0, timeRemaining) / 60);
    const secs = Math.max(0, timeRemaining) % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    timerPill.textContent = formatted;

    if (timeRemaining <= 180) {
      timerPill.classList.add('warning');
    } else {
      timerPill.classList.remove('warning');
    }

    const totalSeconds = (currentExam.time_limit_minutes || 15) * 60;
    const pct = Math.min(100, Math.max(0, (timeSpentSeconds / totalSeconds) * 100));
    if (progressFill) progressFill.style.width = `${pct}%`;
  }

  async function submitExam(isAutoSubmit = false) {
    if (!isExamActive) return;
    isExamActive = false;
    clearInterval(timerInterval);
    disableAntiCheat();

    const submitBtn = document.getElementById('exam-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang chấm điểm...';
    }

    try {
      const res = await fetch(`${AUTH_URL}?action=submit-exam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          examId: currentExam.id,
          answers: userAnswers,
          timeSpentSeconds: timeSpentSeconds,
          tabSwitches: tabSwitches
        })
      });

      if (!res.ok) throw new Error('Không thể nộp bài thi');
      const data = await res.json();
      if (!data.success || !data.result) throw new Error(data.error || 'Lỗi chấm điểm bài thi');

      renderReviewScreen(data.result);
    } catch (e) {
      alert('Lỗi nộp bài thi: ' + e.message);
      // Restore exam state để user có thể thử nộp lại
      isExamActive = true;
      enableAntiCheat(currentUserInfo);
      startTimer();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Nộp bài thi';
      }
    }
  }

  function renderReviewScreen(result) {
    const container = document.getElementById('exam-body');
    const footer = document.getElementById('exam-footer');
    if (footer) footer.style.display = 'flex';

    // Update footer buttons for Result Review screen
    const cancelBtn = document.getElementById('exam-cancel-btn');
    if (cancelBtn) {
      cancelBtn.textContent = 'Đóng cửa sổ';
    }

    const submitBtn = document.getElementById('exam-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Làm lại bài thi';
      submitBtn.className = 'exam-btn exam-btn--primary';
      // Dùng dataset flag để addEventListener gốc biết cần gọi openExamModal
      // thay vì gán onclick trực tiếp (tránh xung đột với addEventListener gốc)
      submitBtn.dataset.retakeExamId = currentExam.id;
    }

    const passed = result.passed;
    const statusClass = passed ? 'exam-result-status--pass' : 'exam-result-status--fail';
    const statusText = passed ? 'KẾT QUẢ: ĐẠT CHUẨN' : 'KẾT QUẢ: CHƯA ĐẠT CHUẨN';

    const totalSecs = parseInt(result.time_spent_seconds ?? timeSpentSeconds ?? 0, 10) || 0;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const timeText = `${mins} phút ${secs} giây`;

    let html = `
      <div class="exam-result-card">
        <div class="exam-result-status ${statusClass}">${statusText}</div>
        <div class="exam-result-score">${result.score}%</div>
        <p style="color:#cbd5e1; font-size:0.9rem; margin-top:0.5rem;">
          Đúng <strong>${result.correct_count} / ${result.total_questions}</strong> câu hỏi · Thời gian: <strong>${timeText}</strong>
          ${result.tab_switches > 0 ? `<br><span style="color:#f59e0b;">(Số lần chuyển tab: ${result.tab_switches})</span>` : ''}
        </p>
      </div>

      <h3 style="color:#ffffff; font-size:1.05rem; margin-bottom:1rem; border-left:3px solid #d4a843; padding-left:10px; font-weight:700;">Xem lại đáp án & Giải thích</h3>
    `;

    const breakdownMap = {};
    (result.breakdown || []).forEach(b => {
      breakdownMap[b.question_id] = b;
    });

    currentQuestions.forEach((q, idx) => {
      const qNum = idx + 1;
      const b = breakdownMap[q.id] || {};
      const isCorrect = b.is_correct;
      const cardClass = isCorrect ? 'exam-review-card--correct' : 'exam-review-card--wrong';
      const badgeText = isCorrect ? 'Đúng' : 'Sai';

      let optionsReviewHTML = '';
      if (q.type === 'single' || q.type === 'boolean') {
        const opts = q.type === 'boolean' ? [
          { text: 'Đúng', originalIndex: 1 },
          { text: 'Sai', originalIndex: 0 }
        ] : (q.displayOptions || []);

        optionsReviewHTML = `<div class="exam-options-list">` +
          opts.map(opt => {
            const isUserChoice = (b.user_answer !== null && intval(b.user_answer) === opt.originalIndex);
            const isCorrectChoice = (intval(b.correct_answer) === opt.originalIndex);

            let styleClass = '';
            if (isCorrectChoice) styleClass = 'style="background:rgba(138, 176, 151, 0.15); border-color:#8ab097; color:#8ab097;"';
            else if (isUserChoice && !isCorrectChoice) styleClass = 'style="background:rgba(239, 68, 68, 0.15); border-color:#ef4444; color:#ef4444;"';

            return `
              <div class="exam-option" ${styleClass}>
                <span>${isCorrectChoice ? '✓' : (isUserChoice ? '✕' : '•')}</span>
                <span class="exam-option-text">${esc(opt.text)}</span>
              </div>
            `;
          }).join('') +
          `</div>`;
      } else if (q.type === 'multiple') {
        const opts = q.displayOptions || [];
        const userArr = Array.isArray(b.user_answer) ? b.user_answer.map(x => intval(x)) : [];
        const correctArr = Array.isArray(b.correct_answer) ? b.correct_answer.map(x => intval(x)) : [];

        optionsReviewHTML = `<div class="exam-options-list">` +
          opts.map(opt => {
            const isUserChoice = userArr.includes(opt.originalIndex);
            const isCorrectChoice = correctArr.includes(opt.originalIndex);

            let styleClass = '';
            if (isCorrectChoice) styleClass = 'style="background:rgba(138, 176, 151, 0.15); border-color:#8ab097; color:#8ab097;"';
            else if (isUserChoice && !isCorrectChoice) styleClass = 'style="background:rgba(239, 68, 68, 0.15); border-color:#ef4444; color:#ef4444;"';

            return `
              <div class="exam-option" ${styleClass}>
                <span>${isCorrectChoice ? '✓' : (isUserChoice ? '✕' : '•')}</span>
                <span class="exam-option-text">${esc(opt.text)}</span>
              </div>
            `;
          }).join('') +
          `</div>`;
      } else if (q.type === 'short_answer') {
        const userText = strval(b.user_answer || '(Chưa trả lời)');
        const accList = Array.isArray(b.correct_answer) ? b.correct_answer.join(', ') : strval(b.correct_answer || '');

        optionsReviewHTML = `
          <p style="margin-bottom:0.4rem; color:${isCorrect ? '#8ab097' : '#ef4444'}; font-size:0.9rem;">
            <strong>Câu trả lời của bạn:</strong> ${esc(userText)}
          </p>
          <p style="color:#8ab097; font-size:0.9rem;">
            <strong>Đáp án chuẩn:</strong> ${esc(accList)}
          </p>
        `;
      }

      const imgHTML = q.image_url ? `<img src="${q.image_url}" class="exam-q-img" alt="Hình minh họa" />` : '';
      const expHTML = b.explanation ? `
        <div class="exam-explanation">
          <strong>Lời giải thích:</strong> ${esc(b.explanation)}
        </div>
      ` : '';

      html += `
        <div class="exam-review-card ${cardClass}">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
            <span class="exam-q-num">Câu ${qNum} / ${currentQuestions.length}</span>
            <span style="font-size:0.82rem; font-weight:600; color:${isCorrect ? '#8ab097' : '#ef4444'};">${badgeText}</span>
          </div>
          <div class="exam-q-text">${esc(q.text)}</div>
          ${imgHTML}
          ${optionsReviewHTML}
          ${expHTML}
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function intval(v) { return parseInt(v, 10); }
  function strval(v) { return String(v); }

  function closeExamModal() {
    isExamActive = false;
    clearInterval(timerInterval);
    disableAntiCheat();
    const overlay = document.getElementById('exam-modal-overlay');
    if (overlay) overlay.classList.remove('visible');

    // Refresh exam list on page to show updated attempt status
    if (window.lastLoadedExamParams) {
      loadExamsForBac(window.lastLoadedExamParams.nganh, window.lastLoadedExamParams.bac, window.lastLoadedExamParams.targetContainerId);
    }
  }

  async function loadExamsForBac(nganh, bac, targetContainerId) {
    window.lastLoadedExamParams = { nganh, bac, targetContainerId };
    const container = document.getElementById(targetContainerId);
    if (!container) return;

    if (!bac || bac === 'all' || !nganh || nganh === 'all' || nganh === 'Tài liệu chung') {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }

    try {
      // Fetch exams list and user's past results concurrently
      const [examsRes, resultsRes] = await Promise.all([
        fetch(`${AUTH_URL}?action=list-exams&nganh=${encodeURIComponent(nganh)}&bac=${encodeURIComponent(bac)}`),
        fetch(`${AUTH_URL}?action=user-exam-results`, { credentials: 'same-origin' }).catch(() => null)
      ]);

      if (examsRes.status === 401) {
        container.style.display = 'block';
        container.innerHTML = `
          <div class="exam-login-card">
            <div class="exam-login-card__icon">🔒</div>
            <div class="exam-login-card__content">
              <h4>Hệ Thống Đề Thi Khảo Thí Nội Bộ</h4>
              <p>Các bộ đề thi trắc nghiệm chỉ dành riêng cho Đoàn sinh & Huynh trưởng GĐPT. Vui lòng đăng nhập để xem danh sách đề thi và làm bài.</p>
              <button type="button" class="exam-btn exam-btn--primary" onclick="if(window.openGDPTAdmin) window.openGDPTAdmin();">
                Đăng Nhập Tài Khoản
              </button>
            </div>
          </div>
        `;
        return;
      }

      if (!examsRes.ok) return;
      const data = await examsRes.json();
      const exams = data.exams || [];

      let userResultsMap = {};
      if (resultsRes && resultsRes.ok) {
        const resData = await resultsRes.json();
        (resData.results || []).forEach(r => {
          if (!userResultsMap[r.exam_id] || r.score > userResultsMap[r.exam_id].score) {
            userResultsMap[r.exam_id] = r;
          }
        });
      }

      if (exams.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
      }

      container.style.display = 'grid';
      container.innerHTML = exams.map(e => {
        const pastResult = userResultsMap[e.id];
        let statusBadge = '';
        let btnText = 'Vào làm bài thi';

        if (pastResult) {
          btnText = 'Làm lại bài thi';
          const passed = pastResult.score >= (e.pass_score || 70);
          statusBadge = `
            <div class="exam-card-item__score">
              Điểm cao nhất: <strong>${pastResult.score}%</strong> (${passed ? 'Đã đạt' : 'Chưa đạt'})
            </div>
          `;
        }

        return `
          <div class="exam-card-item">
            <div>
              <div class="exam-card-item__title">${e.title}</div>
              <p style="font-size:0.85rem; color:#cbd5e1; margin-bottom:0.75rem;">${e.description || 'Bài kiểm tra trắc nghiệm đánh giá kiến thức.'}</p>
              <div class="exam-card-item__meta">
                <span>Thời gian: ${e.time_limit_minutes} phút</span>
                <span>Điểm đạt: ${e.pass_score}%</span>
              </div>
              ${statusBadge}
            </div>
            <button type="button" class="exam-btn exam-btn--primary" onclick="window.GDPTExamEngine.openExamModal('${e.id}')">
              ${btnText}
            </button>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error('Lỗi tải bài thi:', err);
    }
  }

  window.GDPTExamEngine = {
    openExamModal,
    closeExamModal,
    recordAnswer,
    loadExamsForBac
  };

})();
