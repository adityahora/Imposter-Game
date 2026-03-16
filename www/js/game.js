/* ===========================
   GAME ENGINE MODULE
   Core game state & logic
   Players persist in localStorage
   =========================== */

const Game = (() => {
  const PLAYERS_KEY = 'imposter_players';
  const IMPOSTER_COUNT_KEY = 'imposter_imposter_count';
  const NO_HINT_KEY = 'imposter_no_hint';

  // ---- State ----
  let state = {
    players: [],          // [{ name, photo (base64|null) }]
    imposterCount: 1,
    timerDuration: 300,   // seconds (default 5 min)
    selectedCategory: 'all',
    noHint: false,        // if true, imposter gets no hint
    currentWord: null,    // { word, hint, category }
    imposters: [],        // indices
    revealIndex: 0,       // current player being revealed
    revealOrder: [],      // shuffled indices
    phase: 'lobby'        // lobby | reveal | discussion | results
  };

  // ---- Persist/load settings ----
  function loadSettings() {
    try {
      const ic = localStorage.getItem(IMPOSTER_COUNT_KEY);
      if (ic !== null) state.imposterCount = Math.max(1, parseInt(ic, 10) || 1);
      const nh = localStorage.getItem(NO_HINT_KEY);
      if (nh !== null) state.noHint = nh === 'true';
    } catch (e) { /* ignore */ }
  }

  function saveImposterCount() {
    localStorage.setItem(IMPOSTER_COUNT_KEY, String(state.imposterCount));
  }

  function saveNoHint() {
    localStorage.setItem(NO_HINT_KEY, String(state.noHint));
  }

  // ---- Player persistence ----
  function savePlayers() {
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(state.players));
  }

  function loadPlayers() {
    const saved = localStorage.getItem(PLAYERS_KEY);
    if (saved) {
      try {
        state.players = JSON.parse(saved);
      } catch (e) {
        state.players = [];
      }
    }
  }

  // Load on module init
  loadPlayers();
  loadSettings();

  // ---- Players ----
  function addPlayer(name, photo = null) {
    if (state.players.length >= 20) return false;
    if (state.players.some(p => p.name.toLowerCase() === name.toLowerCase())) return false;
    state.players.push({ name, photo });
    savePlayers();
    return true;
  }

  function removePlayer(index) {
    state.players.splice(index, 1);
    // Don't call savePlayers() — removal is temporary (lobby only)
    // Player remains in the database for future games
  }

  function getPlayers() {
    return state.players;
  }

  function getPlayerCount() {
    return state.players.length;
  }

  // ---- Imposter count ----
  function setImposterCount(n) {
    state.imposterCount = Math.max(1, Math.min(n, Math.floor(state.players.length / 2) || 1));
    saveImposterCount();
  }

  function getImposterCount() {
    return state.imposterCount;
  }

  function getMaxImposters() {
    return Math.max(1, Math.floor(state.players.length / 2));
  }

  // ---- Timer ----
  function setTimerDuration(seconds) {
    state.timerDuration = Math.max(60, Math.min(seconds, 900)); // 1 min – 15 min
  }

  function getTimerDuration() {
    return state.timerDuration;
  }

  // ---- Category ----
  function setCategory(cat) {
    state.selectedCategory = cat;
  }

  function getCategory() {
    return state.selectedCategory;
  }

  // ---- No Hint mode ----
  function setNoHint(val) {
    state.noHint = !!val;
    saveNoHint();
  }

  function getNoHint() {
    return state.noHint;
  }

  // ---- Start game ----
  function startGame() {
    if (state.players.length < 3) return false;

    // Auto-clamp imposter count to valid range
    const maxImp = Math.max(1, Math.floor(state.players.length / 2));
    if (state.imposterCount > maxImp) {
      state.imposterCount = maxImp;
      saveImposterCount();
    }
    if (state.imposterCount >= state.players.length) return false;

    // Pick word
    state.currentWord = WordManager.getRandomWord(state.selectedCategory);

    // Choose imposters randomly
    const indices = state.players.map((_, i) => i);
    shuffleArray(indices);
    state.imposters = indices.slice(0, state.imposterCount);

    // Shuffle reveal order
    state.revealOrder = state.players.map((_, i) => i);
    shuffleArray(state.revealOrder);
    state.revealIndex = 0;

    state.phase = 'reveal';
    return true;
  }

  // ---- Reveal helpers ----
  function getCurrentRevealPlayer() {
    if (state.revealIndex >= state.revealOrder.length) return null;
    const idx = state.revealOrder[state.revealIndex];
    return {
      index: idx,
      player: state.players[idx],
      isImposter: state.imposters.includes(idx)
    };
  }

  function nextReveal() {
    state.revealIndex++;
    return state.revealIndex < state.revealOrder.length;
  }

  function isRevealDone() {
    return state.revealIndex >= state.revealOrder.length;
  }

  // ---- Discussion ----
  function getRandomStarter() {
    return state.players[Math.floor(Math.random() * state.players.length)];
  }

  // ---- Imposter guess ----
  function checkImposterGuess(guess) {
    if (!state.currentWord) return false;
    return guess.trim().toLowerCase() === state.currentWord.word.toLowerCase();
  }

  // ---- Getters ----
  function getWord() { return state.currentWord; }
  function getImposters() { return state.imposters; }
  function getPhase() { return state.phase; }
  function setPhase(p) { state.phase = p; }

  // ---- Reset for new round (keep players, shuffle order) ----
  function newRound() {
    state.currentWord = null;
    state.imposters = [];
    state.revealIndex = 0;
    state.revealOrder = [];
    state.phase = 'lobby';
    // Randomize player order for next round
    shuffleArray(state.players);
    savePlayers();
  }

  // ---- Full reset (keeps saved players!) ----
  function fullReset() {
    // Don't reset imposterCount — it's persisted
    newRound();
    // Players stay — they persist until manually deleted
  }

  // ---- Utility ----
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  return {
    addPlayer, removePlayer, getPlayers, getPlayerCount,
    setImposterCount, getImposterCount, getMaxImposters,
    setTimerDuration, getTimerDuration,
    setCategory, getCategory,
    setNoHint, getNoHint,
    startGame, getCurrentRevealPlayer, nextReveal, isRevealDone,
    getRandomStarter,
    checkImposterGuess,
    getWord, getImposters, getPhase, setPhase,
    newRound, fullReset
  };
})();
