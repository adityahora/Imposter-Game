# Imposter — Who's The Spy? 🎭

A fun party game where players must figure out who the imposter is! Built with HTML, CSS & JavaScript, ready for Android via Capacitor.

## 🎮 How It Works

1. **Add Players** — Add 3-20 players with names and optional photos
2. **Set Imposters** — Choose how many imposters (default: 1)
3. **Reveal Phase** — Pass the phone around. Each player swipes up to see their word (or discover they're the imposter)
4. **Discussion** — A timer starts, and players ask each other questions to find the imposter
5. **Vote** — Vote on who you think the imposter is
6. **Results** — If caught, the imposter gets one last chance to guess the word

## 🚀 Quick Start

### Run locally
```bash
# Option 1: Use any local server
npx serve .

# Option 2: Just open index.html in a browser
```

### Build for Android (Capacitor)
```bash
# Install dependencies
npm install

# Initialize Capacitor
npm run cap:init

# Add Android platform
npm run cap:add:android

# Sync web files
npm run cap:sync

# Open in Android Studio
npm run cap:open:android
```

## ⚙️ Settings

- **Discussion Timer** — Adjustable from 1 to 15 minutes (30s steps)
- **Word Category** — Filter by Places, Animals, Food & Drinks, etc.
- **Admin Panel** — Add/remove words (password: `hello1234`)

## 📁 Project Structure

```
├── index.html              # Main HTML
├── css/
│   └── style.css           # All styles
├── js/
│   ├── words.js            # Word data management
│   ├── game.js             # Game engine / state
│   ├── ui.js               # UI helpers (screens, toasts, confetti)
│   └── app.js              # Main controller / event wiring
├── data/
│   └── words.json          # Default word list
├── package.json            # NPM config
├── capacitor.config.json   # Capacitor config for Android
└── README.md
```

## 🎨 Features

- Beautiful dark-mode UI with gradient accents
- Smooth screen transitions and animations
- Player photo support (camera or gallery)
- Swipe-up word reveal
- Animated countdown timer with color changes
- Confetti on win
- Admin word management with password protection
- Works offline (words stored in localStorage)
- Capacitor-ready for Android builds
