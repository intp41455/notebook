const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const appDir = path.join(__dirname, '..', 'app');

if (!fs.existsSync(appDir)) fs.mkdirSync(appDir, { recursive: true });

const files = ['index.html', 'manifest.json', 'sw.js'];
for (const f of files) {
  const src = path.join(root, f);
  const dst = path.join(appDir, f);
  if (!fs.existsSync(src)) {
    console.error('missing source file:', src);
    process.exit(1);
  }
  fs.copyFileSync(src, dst);
  console.log('copied', f);
}
