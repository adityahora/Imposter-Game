/* ===========================
   BUILD SCRIPT
   Copies web assets into www/
   for Capacitor to bundle.
   =========================== */

const fs = require('fs');
const path = require('path');

const SRC = __dirname;
const DEST = path.join(__dirname, 'www');

// Files and folders to copy
const items = [
  'index.html',
  'logo.png',
  'css',
  'js',
  'data'
];

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Clean www/ first
if (fs.existsSync(DEST)) {
  fs.rmSync(DEST, { recursive: true, force: true });
}
fs.mkdirSync(DEST, { recursive: true });

// Copy each item
for (const item of items) {
  const src = path.join(SRC, item);
  const dest = path.join(DEST, item);
  if (fs.existsSync(src)) {
    copyRecursive(src, dest);
    console.log(`  ✓ ${item}`);
  } else {
    console.log(`  ✗ ${item} (not found, skipping)`);
  }
}

console.log('\n  Build complete → www/\n');
