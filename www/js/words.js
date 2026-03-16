/* ===========================
   WORDS MODULE
   Manages word data loading,
   saving, and admin CRUD.
   Persists in localStorage
   (same approach as players).
   =========================== */

const WordManager = (() => {
  const STORAGE_KEY = 'imposter_words';
  const DATA_URL = 'data/words.json';
  const RECENT_KEY = 'imposter_recent_words';
  const RECENT_LIMIT = 10;

  let wordData = null; // { categories: [...] }
  let recentWords = []; // words used in last N rounds (by word string)

  // ---- Load recent words from localStorage ----
  function loadRecent() {
    try {
      recentWords = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch (e) { recentWords = []; }
  }

  function saveRecent() {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentWords));
  }

  loadRecent();

  // ---- Save to localStorage ----
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wordData));
  }

  // ---- Load words: localStorage first, then fetch words.json on first ever run ----
  async function load() {
    // 1. Try localStorage (persisted data including admin edits)
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        wordData = JSON.parse(saved);
        if (wordData && wordData.categories && wordData.categories.length > 0) {
          return wordData;
        }
      } catch (e) { /* fall through */ }
    }
    // 2. First run — fetch from the bundled words.json file
    try {
      const res = await fetch(DATA_URL + '?t=' + Date.now());
      wordData = await res.json();
      save(); // store in localStorage for next time
      return wordData;
    } catch (e) {
      console.error('Failed to fetch words.json:', e);
    }
    // 3. Should never reach here, but just in case
    wordData = { categories: [] };
    save();
    return wordData;
  }

  // Load from localStorage immediately if available (sync)
  // The async load() will be called from app.js on startup
  (function initSync() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { wordData = JSON.parse(saved); } catch (e) { /* */ }
    }
  })();

  // ---- Get all categories ----
  function getCategories() {
    if (!wordData) return [];
    return wordData.categories.map(c => c.name);
  }

  // ---- Get all words (optionally filtered) ----
  function getAllWords(category = 'all') {
    if (!wordData) return [];
    if (category === 'all') {
      return wordData.categories.flatMap(c =>
        c.words.map(w => ({ ...w, category: c.name }))
      );
    }
    const cat = wordData.categories.find(c => c.name === category);
    return cat ? cat.words.map(w => ({ ...w, category: cat.name })) : [];
  }

  function consumeWord(chosen) {
    if (!wordData || !chosen) return;
    const cat = wordData.categories.find(c => c.name === chosen.category);
    if (!cat) return;

    let idx = cat.words.findIndex(w => w.word === chosen.word && w.hint === chosen.hint);
    if (idx === -1) {
      idx = cat.words.findIndex(w => w.word.toLowerCase() === chosen.word.toLowerCase());
    }
    if (idx === -1) return;

    cat.words.splice(idx, 1);
    if (cat.words.length === 0) {
      wordData.categories = wordData.categories.filter(c => c.name !== cat.name);
    }
    save();
  }

  // ---- Pick a random word (avoids last 10 and consumes used word) ----
  function getRandomWord(category = 'all') {
    const allWords = getAllWords(category);
    if (allWords.length === 0) return { word: 'Mystery', hint: 'No words available', category: 'None' };

    // Filter out recently used words (unless there aren't enough words)
    const available = allWords.filter(w => !recentWords.includes(w.word));
    const pool = available.length > 0 ? available : allWords;

    const chosen = pool[Math.floor(Math.random() * pool.length)];

    // Track it
    recentWords.push(chosen.word);
    if (recentWords.length > RECENT_LIMIT) recentWords.shift();
    saveRecent();

    // Consume it so it cannot repeat in future rounds
    consumeWord(chosen);

    return chosen;
  }

  // ---- Admin: Add a word ----
  function addWord(categoryName, word, hint) {
    if (!wordData) return false;
    let cat = wordData.categories.find(c => c.name === categoryName);
    if (!cat) {
      cat = { name: categoryName, words: [] };
      wordData.categories.push(cat);
    }
    // Prevent duplicates
    if (cat.words.some(w => w.word.toLowerCase() === word.toLowerCase())) {
      return false;
    }
    cat.words.push({ word, hint });
    save();
    return true;
  }

  // ---- Admin: Remove a word ----
  function removeWord(categoryName, word) {
    if (!wordData) return false;
    const cat = wordData.categories.find(c => c.name === categoryName);
    if (!cat) return false;
    const idx = cat.words.findIndex(w => w.word === word);
    if (idx === -1) return false;
    cat.words.splice(idx, 1);
    // Remove empty categories
    if (cat.words.length === 0) {
      wordData.categories = wordData.categories.filter(c => c.name !== categoryName);
    }
    save();
    return true;
  }

  // ---- Reset to defaults (clear localStorage, re-fetch words.json) ----
  async function reset() {
    localStorage.removeItem(STORAGE_KEY);
    wordData = null;
    await load();
  }

  return { load, getCategories, getAllWords, getRandomWord, addWord, removeWord, reset };
})();
