/* ===========================
   UI MODULE
   DOM manipulation, toasts,
   screen transitions, confetti
   =========================== */

const UI = (() => {
  // ---- Screen management ----
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => {
      if (s.classList.contains('active')) {
        s.classList.remove('active');
        s.classList.add('slide-out');
        setTimeout(() => s.classList.remove('slide-out'), 400);
      }
    });
    setTimeout(() => {
      const target = document.getElementById(id);
      if (target) target.classList.add('active');
    }, 50);
  }

  // ---- Modal management ----
  function showModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('active');
  }

  function hideModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('active');
  }

  // ---- Toast ----
  function toast(message, type = 'success') {
    const el = document.getElementById('toast');
    const icon = document.getElementById('toast-icon');
    const msg = document.getElementById('toast-message');

    el.className = 'toast ' + type;
    msg.textContent = message;
    icon.textContent = type === 'success' ? 'check_circle' :
                       type === 'error' ? 'error' : 'info';

    el.classList.add('visible');
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.classList.remove('visible'), 2500);
  }

  // ---- Format seconds to mm:ss ----
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // ---- Create player avatar HTML ----
  function avatarHTML(photo, size = 'medium') {
    if (photo) {
      return `<img src="${photo}" alt="avatar" />`;
    }
    return `<span class="material-symbols-rounded">person</span>`;
  }

  // ---- Confetti ----
  function showConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    const colors = ['#e94560', '#7c5cfc', '#00d4aa', '#ffc107', '#ff8a80', '#82b1ff'];
    for (let i = 0; i < 80; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = (2 + Math.random() * 3) + 's';
      piece.style.animationDelay = Math.random() * 2 + 's';
      piece.style.width = (6 + Math.random() * 8) + 'px';
      piece.style.height = (6 + Math.random() * 8) + 'px';
      container.appendChild(piece);
    }
    setTimeout(() => container.remove(), 6000);
  }

  // ---- Haptic feedback (for Capacitor later) ----
  function vibrate(duration = 50) {
    if (navigator.vibrate) navigator.vibrate(duration);
  }

  return { showScreen, showModal, hideModal, toast, formatTime, avatarHTML, showConfetti, vibrate };
})();
