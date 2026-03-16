/* ===========================
   APP CONTROLLER
   Wires everything together:
   event listeners, flow control
   =========================== */

(async function () {
  'use strict';

  // ---- Init ----
  await WordManager.load();

  // ---- DOM refs ----
  const $ = id => document.getElementById(id);

  // Home
  const btnNewGame    = $('btn-new-game');
  const btnHowToPlay  = $('btn-how-to-play');
  const btnSettings   = $('btn-settings');

  // How to play
  const btnBackHow = $('btn-back-how');

  // Settings
  const btnBackSettings = $('btn-back-settings');
  const timerMinus      = $('timer-minus');
  const timerPlus       = $('timer-plus');
  const timerValue      = $('timer-value');
  const categorySelect  = $('category-select');
  const btnAdminWords   = $('btn-admin-words');

  // Admin modal
  const adminPassword   = $('admin-password');
  const adminError      = $('admin-error');
  const btnAdminCancel  = $('btn-admin-cancel');
  const btnAdminSubmit  = $('btn-admin-submit');

  // Admin word manager
  const btnBackAdmin        = $('btn-back-admin');
  const adminCategory       = $('admin-category');
  const adminNewCategory    = $('admin-new-category');
  const adminWord           = $('admin-word');
  const adminHint           = $('admin-hint');
  const btnAddWord          = $('btn-add-word');
  const adminFilterCategory = $('admin-filter-category');
  const adminWordList       = $('admin-word-list');

  // Lobby
  const btnBackLobby  = $('btn-back-lobby');
  const impMinus      = $('imp-minus');
  const impPlus       = $('imp-plus');
  const impValue      = $('imp-value');
  const playerCount   = $('player-count');
  const playerList    = $('player-list');
  const btnAddNewPlayer = $('btn-add-new-player');
  const btnAddExistingPlayer = $('btn-add-existing-player');
  const btnStartGame  = $('btn-start-game');

  // Add player modal
  const avatarPreview    = $('avatar-preview');
  const btnTakePhoto     = $('btn-take-photo');
  const btnUploadPhoto   = $('btn-upload-photo');
  const photoInput       = $('photo-input');
  const cameraInput      = $('camera-input');
  const playerNameInput  = $('player-name-input');
  const savePlayerDb     = $('save-player-db');
  const btnCancelPlayer  = $('btn-cancel-player');
  const btnConfirmPlayer = $('btn-confirm-player');

  // Existing player modal
  const existingPlayerList = $('existing-player-list');
  const btnCancelExistingPlayer = $('btn-cancel-existing-player');

  // Reveal
  const revealPass       = $('reveal-pass');
  const revealCard       = $('reveal-card');
  const passAvatar       = $('pass-avatar');
  const passPlayerName   = $('pass-player-name');
  const revealAvatar     = $('reveal-avatar');
  const revealPlayerName = $('reveal-player-name');
  const revealWordArea   = $('reveal-word-area');
  const swipeInstruction = $('swipe-instruction');
  const wordDisplay      = $('word-display');
  const wordRoleBadge    = $('word-role-badge');
  const wordText         = $('word-text');
  const wordHint         = $('word-hint');
  const btnNextPlayer    = $('btn-next-player');

  // Discussion
  const starterName          = $('starter-name');
  const discussionStarterWrap = $('discussion-starter-wrapper');
  const timerText            = $('timer-text');
  const timerProgress        = $('timer-progress');
  const btnPauseTimer        = $('btn-pause-timer');
  const pauseIcon            = $('pause-icon');
  const btnRevealImposter    = $('btn-reveal-imposter');

  // Results
  const resultsOutcome         = $('results-outcome');
  const resultsImposterSection = $('results-imposter-section');
  const resultsWordSection     = $('results-word-section');
  const resultsWord            = $('results-word');
  const btnRevealWord          = $('btn-reveal-word');
  const resultsFinalMessage    = $('results-final-message');
  const btnPlayAgain           = $('btn-play-again');
  const btnBackHome            = $('btn-back-home');

  // ---- Temp state ----
  let tempPhoto = null;
  let timerInterval = null;
  let timerRemaining = 0;
  let timerPaused = false;
  let adminTarget = 'words'; // 'words' or 'players'
  const PLAYER_LIBRARY_KEY = 'imposter_player_library';

  function loadPlayerLibrary() {
    const raw = localStorage.getItem(PLAYER_LIBRARY_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function savePlayerLibrary(players) {
    localStorage.setItem(PLAYER_LIBRARY_KEY, JSON.stringify(players));
  }

  function upsertLibraryPlayer(name, photo) {
    const library = loadPlayerLibrary();
    const idx = library.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
    const record = { name, photo: photo || null };
    if (idx >= 0) library[idx] = record;
    else library.push(record);
    savePlayerLibrary(library);
  }

  function removeLibraryPlayer(name) {
    const library = loadPlayerLibrary();
    const filtered = library.filter(p => p.name.toLowerCase() !== name.toLowerCase());
    savePlayerLibrary(filtered);
  }

  function renderExistingPlayerList() {
    const library = loadPlayerLibrary();
    const inGameNames = new Set(Game.getPlayers().map(p => p.name.toLowerCase()));
    const candidates = library.filter(p => !inGameNames.has(p.name.toLowerCase()));

    if (candidates.length === 0) {
      existingPlayerList.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:12px;">No saved players available</p>';
      return;
    }

    existingPlayerList.innerHTML = candidates.map((p, i) => `
      <div class="existing-player-item">
        <div class="player-card-avatar">${UI.avatarHTML(p.photo)}</div>
        <span class="existing-player-name">${p.name}</span>
        <button class="btn btn-small btn-primary existing-player-add" data-index="${i}">Add</button>
      </div>
    `).join('');

    existingPlayerList.querySelectorAll('.existing-player-add').forEach(btn => {
      btn.addEventListener('click', () => {
        const player = candidates[parseInt(btn.dataset.index, 10)];
        if (!player) return;
        if (!Game.addPlayer(player.name, player.photo || null)) {
          UI.toast('Name already taken or max players reached', 'error');
          return;
        }
        UI.toast(`${player.name} added!`, 'success');
        refreshPlayerList();
        renderExistingPlayerList();
      });
    });
  }

  // ==============================
  // INITIALIZATION
  // ==============================
  populateCategorySelects();
  timerValue.textContent = UI.formatTime(Game.getTimerDuration());
  impValue.textContent = Game.getImposterCount();

  // ==============================
  // HOME SCREEN
  // ==============================
  btnNewGame.addEventListener('click', () => {
    UI.showScreen('screen-lobby');
    impValue.textContent = Game.getImposterCount();
    refreshPlayerList();
  });

  btnHowToPlay.addEventListener('click', () => UI.showScreen('screen-how-to-play'));
  btnSettings.addEventListener('click', () => UI.showScreen('screen-settings'));

  // ==============================
  // HOW TO PLAY
  // ==============================
  btnBackHow.addEventListener('click', () => UI.showScreen('screen-home'));

  // ==============================
  // SETTINGS
  // ==============================
  btnBackSettings.addEventListener('click', () => UI.showScreen('screen-home'));

  // Timer stepper (30 second steps)
  timerMinus.addEventListener('click', () => {
    Game.setTimerDuration(Game.getTimerDuration() - 30);
    timerValue.textContent = UI.formatTime(Game.getTimerDuration());
  });

  timerPlus.addEventListener('click', () => {
    Game.setTimerDuration(Game.getTimerDuration() + 30);
    timerValue.textContent = UI.formatTime(Game.getTimerDuration());
  });

  // Category select
  categorySelect.addEventListener('change', () => {
    Game.setCategory(categorySelect.value);
  });

  // No hint toggle
  const noHintToggle = $('no-hint-toggle');
  noHintToggle.checked = Game.getNoHint();
  noHintToggle.addEventListener('change', () => {
    Game.setNoHint(noHintToggle.checked);
  });

  // Admin words
  btnAdminWords.addEventListener('click', () => {
    adminTarget = 'words';
    adminPassword.value = '';
    adminError.classList.add('hidden');
    UI.showModal('modal-admin');
    setTimeout(() => adminPassword.focus(), 300);
  });

  // Admin players
  $('btn-admin-players').addEventListener('click', () => {
    adminTarget = 'players';
    adminPassword.value = '';
    adminError.classList.add('hidden');
    UI.showModal('modal-admin');
    setTimeout(() => adminPassword.focus(), 300);
  });

  btnAdminCancel.addEventListener('click', () => UI.hideModal('modal-admin'));

  btnAdminSubmit.addEventListener('click', () => {
    if (adminPassword.value === 'hello1234') {
      UI.hideModal('modal-admin');
      if (adminTarget === 'players') {
        openAdminPlayersPanel();
      } else {
        openAdminPanel();
      }
    } else {
      adminError.classList.remove('hidden');
      UI.vibrate(100);
    }
  });

  adminPassword.addEventListener('keydown', e => {
    if (e.key === 'Enter') btnAdminSubmit.click();
  });

  // ==============================
  // ADMIN PANEL
  // ==============================
  const tabViewWords = $('tab-view-words');
  const tabAddWord   = $('tab-add-word');
  const panelViewWords = $('panel-view-words');
  const panelAddWord   = $('panel-add-word');
  const adminWordCount = $('admin-word-count');

  function switchAdminTab(tab) {
    tabViewWords.classList.toggle('active', tab === 'view');
    tabAddWord.classList.toggle('active', tab === 'add');
    panelViewWords.classList.toggle('active', tab === 'view');
    panelAddWord.classList.toggle('active', tab === 'add');
  }

  tabViewWords.addEventListener('click', () => switchAdminTab('view'));
  tabAddWord.addEventListener('click', () => {
    switchAdminTab('add');
    populateAdminCategories();
  });

  function openAdminPanel() {
    UI.showScreen('screen-admin');
    switchAdminTab('view');
    populateAdminCategories();
    renderAdminWordList();
  }

  btnBackAdmin.addEventListener('click', () => {
    UI.showScreen('screen-settings');
    populateCategorySelects();
  });

  // ==============================
  // ADMIN PLAYERS PANEL
  // ==============================
  const adminPlayerList  = $('admin-player-list');
  const adminPlayerCount = $('admin-player-count');

  function openAdminPlayersPanel() {
    UI.showScreen('screen-admin-players');
    renderAdminPlayerList();
  }

  $('btn-back-admin-players').addEventListener('click', () => {
    UI.showScreen('screen-settings');
  });

  function renderAdminPlayerList() {
    const library = loadPlayerLibrary();
    adminPlayerCount.textContent = `${library.length} player${library.length !== 1 ? 's' : ''} saved`;
    if (library.length === 0) {
      adminPlayerList.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No saved players</p>';
      return;
    }
    adminPlayerList.innerHTML = library.map((p, i) => `
      <div class="word-item">
        <div class="word-item-info" style="display:flex;align-items:center;gap:10px;">
          <div class="player-card-avatar" style="width:36px;height:36px;min-width:36px;">${UI.avatarHTML(p.photo)}</div>
          <div class="word-name">${p.name}</div>
        </div>
        <button class="word-item-delete admin-player-delete" data-name="${p.name}">
          <span class="material-symbols-rounded">delete</span>
        </button>
      </div>
    `).join('');

    adminPlayerList.querySelectorAll('.admin-player-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.name;
        if (confirm(`Remove "${name}" from the database?`)) {
          removeLibraryPlayer(name);
          UI.toast(`${name} removed from database`, 'info');
          renderAdminPlayerList();
        }
      });
    });
  }

  function populateAdminCategories() {
    const cats = WordManager.getCategories();
    adminCategory.innerHTML = '<option value="">Select existing category</option>' +
      cats.map(c => `<option value="${c}">${c}</option>`).join('');
    adminFilterCategory.innerHTML = '<option value="all">All Categories</option>' +
      cats.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  function renderAdminWordList(filter = 'all') {
    const words = WordManager.getAllWords(filter);
    adminWordCount.textContent = `${words.length} word${words.length !== 1 ? 's' : ''} total`;
    if (words.length === 0) {
      adminWordList.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No words found</p>';
      return;
    }
    adminWordList.innerHTML = words.map(w => `
      <div class="word-item">
        <div class="word-item-info">
          <div class="word-name">${w.word}</div>
          <div class="word-meta">${w.category} · ${w.hint}</div>
        </div>
        <button class="word-item-delete" data-cat="${w.category}" data-word="${w.word}">
          <span class="material-symbols-rounded">delete</span>
        </button>
      </div>
    `).join('');

    adminWordList.querySelectorAll('.word-item-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.cat;
        const word = btn.dataset.word;
        if (WordManager.removeWord(cat, word)) {
          UI.toast('Word removed', 'info');
          populateAdminCategories();
          renderAdminWordList(adminFilterCategory.value);
        }
      });
    });
  }

  adminFilterCategory.addEventListener('change', () => {
    renderAdminWordList(adminFilterCategory.value);
  });

  btnAddWord.addEventListener('click', () => {
    const catExisting = adminCategory.value;
    const catNew = adminNewCategory.value.trim();
    const word = adminWord.value.trim();
    const hint = adminHint.value.trim();

    const category = catNew || catExisting;
    if (!category) { UI.toast('Select or type a category', 'error'); return; }
    if (!word) { UI.toast('Enter a word', 'error'); return; }
    if (!hint) { UI.toast('Enter a hint', 'error'); return; }

    if (WordManager.addWord(category, word, hint)) {
      UI.toast(`"${word}" added to ${category}`, 'success');
      adminWord.value = '';
      adminHint.value = '';
      adminNewCategory.value = '';
      populateAdminCategories();
      renderAdminWordList(adminFilterCategory.value);
      // Switch to View Words tab so user sees the new word
      switchAdminTab('view');
      // Set filter to the category they just added to
      adminFilterCategory.value = category;
      renderAdminWordList(category);
    } else {
      UI.toast('Word already exists in that category', 'error');
    }
  });

  // ==============================
  // LOBBY
  // ==============================
  btnBackLobby.addEventListener('click', () => UI.showScreen('screen-home'));

  // Imposter count stepper
  impMinus.addEventListener('click', () => {
    const cur = Game.getImposterCount();
    if (cur > 1) {
      Game.setImposterCount(cur - 1);
      impValue.textContent = Game.getImposterCount();
    }
  });

  impPlus.addEventListener('click', () => {
    const cur = Game.getImposterCount();
    const max = Game.getMaxImposters();
    if (cur < max) {
      Game.setImposterCount(cur + 1);
      impValue.textContent = Game.getImposterCount();
    } else {
      UI.toast(`Max ${max} imposters for ${Game.getPlayerCount()} players`, 'info');
    }
  });

  // Add new player
  btnAddNewPlayer.addEventListener('click', () => {
    tempPhoto = null;
    playerNameInput.value = '';
    savePlayerDb.checked = true;
    avatarPreview.innerHTML = '<span class="material-symbols-rounded">person</span>';
    UI.showModal('modal-add-player');
    setTimeout(() => playerNameInput.focus(), 300);
  });

  // Add existing player
  btnAddExistingPlayer.addEventListener('click', () => {
    renderExistingPlayerList();
    UI.showModal('modal-existing-player');
  });

  btnCancelExistingPlayer.addEventListener('click', () => UI.hideModal('modal-existing-player'));

  btnCancelPlayer.addEventListener('click', () => UI.hideModal('modal-add-player'));

  // Photo handling — Gallery
  btnUploadPhoto.addEventListener('click', () => photoInput.click());

  // Photo handling — Camera (works on both desktop webcam and mobile)
  btnTakePhoto.addEventListener('click', async () => {
    // Try getUserMedia first for desktop webcam support
    // On mobile, the capture="environment" input will natively open the camera app
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        openCameraModal(stream);
        return;
      } catch (err) {
        // getUserMedia failed or was denied — fall back to file input with capture
      }
    }
    // Fallback: use input[capture] which opens camera on mobile
    cameraInput.click();
  });

  photoInput.addEventListener('change', handlePhotoFile);
  cameraInput.addEventListener('change', handlePhotoFile);

  function handlePhotoFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      compressAndSetPhoto(ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function compressAndSetPhoto(dataUrl) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 600;
      let w = img.width, h = img.height;
      if (w > h) { h = (h / w) * MAX; w = MAX; }
      else { w = (w / h) * MAX; h = MAX; }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      tempPhoto = canvas.toDataURL('image/jpeg', 0.92);
      avatarPreview.innerHTML = `<img src="${tempPhoto}" alt="preview" />`;
    };
    img.src = dataUrl;
  }

  // ---- Live camera modal (desktop webcam) ----
  function openCameraModal(stream) {
    // Build a temporary fullscreen camera overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.style.zIndex = '150';
    overlay.innerHTML = `
      <div class="modal" style="max-width:360px;">
        <div class="modal-header">
          <span class="material-symbols-rounded modal-icon">photo_camera</span>
          <h3>Take Photo</h3>
        </div>
        <div class="modal-body" style="text-align:center;">
          <video id="camera-live-video" autoplay playsinline style="width:100%;border-radius:12px;background:#000;"></video>
          <canvas id="camera-live-canvas" style="display:none;"></canvas>
        </div>
        <div class="modal-footer" style="justify-content:center;gap:12px;">
          <button class="btn btn-ghost" id="camera-live-cancel">Cancel</button>
          <button class="btn btn-primary" id="camera-live-capture">
            <span class="material-symbols-rounded">camera</span> Capture
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const video = document.getElementById('camera-live-video');
    const canvas = document.getElementById('camera-live-canvas');
    video.srcObject = stream;

    document.getElementById('camera-live-cancel').addEventListener('click', () => {
      stream.getTracks().forEach(t => t.stop());
      overlay.remove();
    });

    document.getElementById('camera-live-capture').addEventListener('click', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      stream.getTracks().forEach(t => t.stop());
      overlay.remove();
      compressAndSetPhoto(dataUrl);
    });
  }

  btnConfirmPlayer.addEventListener('click', () => {
    const name = playerNameInput.value.trim();
    if (!name) {
      UI.toast('Enter a player name', 'error');
      return;
    }
    if (!Game.addPlayer(name, tempPhoto)) {
      UI.toast('Name already taken or max players reached', 'error');
      return;
    }
    if (savePlayerDb.checked) {
      upsertLibraryPlayer(name, tempPhoto);
    }
    UI.hideModal('modal-add-player');
    refreshPlayerList();
    UI.toast(`${name} added!`, 'success');
  });

  playerNameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') btnConfirmPlayer.click();
  });

  function refreshPlayerList() {
    const players = Game.getPlayers();
    playerCount.textContent = players.length;

    if (players.length === 0) {
      playerList.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:16px;">No players yet. Add at least 3!</p>';
    } else {
      playerList.innerHTML = players.map((p, i) => `
        <div class="player-card">
          <div class="player-card-avatar">${UI.avatarHTML(p.photo)}</div>
          <span class="player-card-name">${p.name}</span>
          <div class="player-card-menu">
            <button class="player-card-remove" data-index="${i}" aria-label="More actions">
              <span class="material-symbols-rounded">more_vert</span>
            </button>
            <div class="player-card-menu-pop hidden" id="player-menu-${i}">
              <button class="player-card-menu-item player-menu-save-db" data-index="${i}">Add to Database</button>
              <button class="player-card-menu-item player-menu-remove" data-index="${i}">Remove</button>
            </div>
          </div>
        </div>
      `).join('');

      playerList.querySelectorAll('.player-card-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.dataset.index, 10);
          const pop = $(`player-menu-${index}`);
          const allPops = playerList.querySelectorAll('.player-card-menu-pop');
          allPops.forEach(el => { if (el !== pop) el.classList.add('hidden'); });
          if (pop) pop.classList.toggle('hidden');
        });
      });

      playerList.querySelectorAll('.player-menu-save-db').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.dataset.index, 10);
          const p = players[index];
          if (!p) return;
          const library = loadPlayerLibrary();
          const alreadySaved = library.some(lp => lp.name.toLowerCase() === p.name.toLowerCase());
          if (alreadySaved) {
            UI.toast(`${p.name} is already in the database`, 'info');
          } else {
            upsertLibraryPlayer(p.name, p.photo);
            UI.toast(`${p.name} saved to database`, 'success');
          }
          playerList.querySelectorAll('.player-card-menu-pop').forEach(pop => pop.classList.add('hidden'));
        });
      });

      playerList.querySelectorAll('.player-menu-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          Game.removePlayer(parseInt(btn.dataset.index, 10));
          refreshPlayerList();
        });
      });
    }

    // Clamp imposter count
    if (Game.getImposterCount() > Game.getMaxImposters()) {
      Game.setImposterCount(Game.getMaxImposters());
      impValue.textContent = Game.getImposterCount();
    }

    btnStartGame.disabled = players.length < 3;
    btnStartGame.style.opacity = players.length < 3 ? '0.5' : '1';
  }

  document.addEventListener('click', e => {
    if (!e.target.closest('.player-card-menu')) {
      playerList.querySelectorAll('.player-card-menu-pop').forEach(pop => pop.classList.add('hidden'));
    }
  });

  // Start game
  btnStartGame.addEventListener('click', () => {
    if (!Game.startGame()) {
      UI.toast('Need at least 3 players', 'error');
      return;
    }
    UI.vibrate(100);
    startRevealPhase();
  });

  // ==============================
  // REVEAL PHASE
  // ==============================
  function startRevealPhase() {
    showPassScreen();
    UI.showScreen('screen-reveal');
  }

  function showPassScreen() {
    const data = Game.getCurrentRevealPlayer();
    if (!data) return;

    revealPass.classList.remove('hidden');
    revealCard.classList.add('hidden');

    passAvatar.innerHTML = UI.avatarHTML(data.player.photo);
    passPlayerName.textContent = data.player.name;
  }

  // Tap anywhere on the pass screen to proceed (no Ready button)
  revealPass.addEventListener('click', () => {
    revealPass.classList.add('hidden');
    revealCard.classList.remove('hidden');
    showRevealCard();
  });

  function showRevealCard() {
    const data = Game.getCurrentRevealPlayer();
    if (!data) return;

    revealAvatar.innerHTML = UI.avatarHTML(data.player.photo);
    revealPlayerName.textContent = data.player.name;

    // Reset swipe state
    swipeInstruction.classList.remove('hidden');
    wordDisplay.classList.add('hidden');
    btnNextPlayer.classList.add('hidden');

    const w = Game.getWord();

    // Prepare word content (hidden until swipe)
    if (data.isImposter) {
      wordRoleBadge.textContent = 'IMPOSTER';
      wordRoleBadge.className = 'role-badge imposter';
      if (Game.getNoHint()) {
        wordText.textContent = '???';
        wordText.className = 'word-text imposter-text';
        wordHint.textContent = 'haha no hint for you';
      } else {
        wordText.textContent = w.hint;
        wordText.className = 'word-text imposter-text';
        wordHint.textContent = 'You are the imposter! This is your only clue.';
      }
    } else {
      wordRoleBadge.textContent = 'CITIZEN';
      wordRoleBadge.className = 'role-badge';
      wordText.textContent = w.word;
      wordText.className = 'word-text';
      wordHint.textContent = '';
    }
  }

  // Swipe up to reveal
  let touchStartY = 0;
  revealWordArea.addEventListener('touchstart', e => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  revealWordArea.addEventListener('touchend', e => {
    const diff = touchStartY - e.changedTouches[0].clientY;
    if (diff > 50) revealWord();
  });

  // Also click for desktop
  revealWordArea.addEventListener('click', () => {
    revealWord();
  });

  function revealWord() {
    if (!wordDisplay.classList.contains('hidden')) return;
    swipeInstruction.classList.add('hidden');
    wordDisplay.classList.remove('hidden');
    btnNextPlayer.classList.remove('hidden');
    UI.vibrate(30);
  }

  btnNextPlayer.addEventListener('click', () => {
    const hasMore = Game.nextReveal();
    if (hasMore) {
      showPassScreen();
    } else {
      startDiscussion();
    }
  });

  // ==============================
  // DISCUSSION PHASE
  // ==============================
  function startDiscussion() {
    Game.setPhase('discussion');
    UI.showScreen('screen-discussion');

    // Random starter — show for 10 seconds then fade out
    const starter = Game.getRandomStarter();
    starterName.textContent = starter.name;
    discussionStarterWrap.style.opacity = '1';
    discussionStarterWrap.style.transition = 'opacity 0.6s ease';
    discussionStarterWrap.classList.remove('hidden');

    setTimeout(() => {
      discussionStarterWrap.style.opacity = '0';
      setTimeout(() => {
        discussionStarterWrap.classList.add('hidden');
      }, 600);
    }, 10000);

    // Start timer
    timerRemaining = Game.getTimerDuration();
    timerPaused = false;
    pauseIcon.textContent = 'pause';
    updateTimerDisplay();
    startTimer();
  }

  function startTimer() {
    clearInterval(timerInterval);
    const total = Game.getTimerDuration();
    const circumference = 2 * Math.PI * 90; // r=90

    timerInterval = setInterval(() => {
      if (timerPaused) return;
      timerRemaining--;

      if (timerRemaining <= 0) {
        clearInterval(timerInterval);
        timerRemaining = 0;
        UI.vibrate(300);
        UI.toast("Time's up!", 'info');
      }

      updateTimerDisplay();

      // Progress ring
      const pct = timerRemaining / total;
      timerProgress.style.strokeDashoffset = circumference * (1 - pct);

      // Color changes
      timerProgress.classList.remove('warning', 'danger');
      if (pct < 0.15) timerProgress.classList.add('danger');
      else if (pct < 0.35) timerProgress.classList.add('warning');
    }, 1000);
  }

  function updateTimerDisplay() {
    timerText.textContent = UI.formatTime(timerRemaining);
  }

  btnPauseTimer.addEventListener('click', () => {
    timerPaused = !timerPaused;
    pauseIcon.textContent = timerPaused ? 'play_arrow' : 'pause';
  });

  // Reveal Imposter button — goes straight to results
  btnRevealImposter.addEventListener('click', () => {
    clearInterval(timerInterval);
    showResults();
  });

  // ==============================
  // RESULTS PHASE
  // ==============================
  function showResults() {
    Game.setPhase('results');
    UI.showScreen('screen-results');

    const imposters = Game.getImposters();
    const players = Game.getPlayers();
    const word = Game.getWord();

    // Hide word until button tapped
    resultsWordSection.classList.add('hidden');
    btnRevealWord.classList.remove('hidden');
    resultsFinalMessage.classList.add('hidden');

    // Store word for reveal
    resultsWord.textContent = word.word;

    // Big imposter cards
    resultsImposterSection.innerHTML = imposters.map(i => {
      const p = players[i];
      return `
        <div class="imposter-reveal-card">
          <div class="imposter-reveal-avatar">${UI.avatarHTML(p.photo)}</div>
          <div class="imposter-reveal-label">IMPOSTER</div>
          <div class="imposter-reveal-name">${p.name}</div>
        </div>
      `;
    }).join('');

    // Outcome header
    resultsOutcome.innerHTML = `
      <span class="material-symbols-rounded win-icon citizens-win" style="font-size:64px;">visibility</span>
      <h1>The Imposter Was...</h1>
    `;

    UI.showConfetti();
  }

  // Reveal Word button
  btnRevealWord.addEventListener('click', () => {
    btnRevealWord.classList.add('hidden');
    resultsWordSection.classList.remove('hidden');
  });

  function cleanupRoundUi() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerPaused = false;
    pauseIcon.textContent = 'pause';
    resultsWordSection.classList.add('hidden');
    btnRevealWord.classList.remove('hidden');
    revealPass.classList.remove('hidden');
    revealCard.classList.add('hidden');
  }

  // Quit-game back buttons (reveal / discussion / results)
  function quitToLobby() {
    if (!confirm('Quit this round and go back to the lobby?')) return;
    cleanupRoundUi();
    Game.newRound();
    UI.showScreen('screen-lobby');
    refreshPlayerList();
    impValue.textContent = Game.getImposterCount();
  }

  $('btn-quit-reveal').addEventListener('click', quitToLobby);
  $('btn-quit-discussion').addEventListener('click', quitToLobby);
  $('btn-quit-results').addEventListener('click', quitToLobby);

  // Play again (keep players)
  btnPlayAgain.addEventListener('click', () => {
    cleanupRoundUi();
    Game.newRound();
    UI.showScreen('screen-lobby');
    refreshPlayerList();
    impValue.textContent = Game.getImposterCount();
  });

  // Back to home
  btnBackHome.addEventListener('click', () => {
    cleanupRoundUi();
    Game.fullReset();
    UI.showScreen('screen-home');
    impValue.textContent = Game.getImposterCount();
  });

  // ==============================
  // HELPERS
  // ==============================
  function populateCategorySelects() {
    const cats = WordManager.getCategories();
    const opts = '<option value="all">All Categories</option>' +
      cats.map(c => `<option value="${c}">${c}</option>`).join('');
    categorySelect.innerHTML = opts;
    categorySelect.value = Game.getCategory();
  }

})();
