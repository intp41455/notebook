const { Jimp } = require('jimp');
const path = require('path');

const size = 512;
const pad = 96;
const radius = 96;
const pageRadius = 24;
const image = new Jimp({ width: size, height: size, color: 0x00000000 });

function drawRoundRect(img, x0, y0, w, h, r, color) {
  for (let x = x0; x < x0 + w; x++) {
    for (let y = y0; y < y0 + h; y++) {
      const dx = x - x0;
      const dy = y - y0;
      const inCorner =
        (dx < r && dy < r && Math.hypot(dx - r, dy - r) > r) ||
        (dx >= w - r && dy < r && Math.hypot(dx - (w - r), dy - r) > r) ||
        (dx < r && dy >= h - r && Math.hypot(dx - r, dy - (h - r)) > r) ||
        (dx >= w - r && dy >= h - r && Math.hypot(dx - (w - r), dy - (h - r)) > r);
      if (!inCorner) img.setPixelColor(color, x, y);
    }
  }
}

// blue background rounded
drawRoundRect(image, 0, 0, size, size, radius, 0x3b82f6ff);

// white page
drawRoundRect(image, pad, pad + 48, size - pad * 2, size - pad * 2 - 48, pageRadius, 0xffffffff);

// lines
function drawLine(x1, y1, w, h, color) {
  for (let x = x1; x < x1 + w; x++) {
    for (let y = y1; y < y1 + h; y++) {
      image.setPixelColor(color, x, y);
    }
  }
}
drawLine(pad + 32, pad + 48 + 48, 192, 16, 0x3b82f6ff);
drawLine(pad + 32, pad + 48 + 96, 256, 16, 0x93c5fdff);
drawLine(pad + 32, pad + 48 + 144, 224, 16, 0x93c5fdff);
drawLine(pad + 32, pad + 48 + 192, 160, 16, 0x93c5fdff);

image.write(path.join(__dirname, '..', 'assets', 'icon.png'));

// tray icon 16x16
const tray = new Jimp({ width: 16, height: 16, color: 0x00000000 });
for (let x = 2; x < 14; x++) {
  for (let y = 3; y < 14; y++) {
    tray.setPixelColor(0x3b82f6ff, x, y);
  }
}
// small white page inside
for (let x = 5; x < 11; x++) {
  for (let y = 6; y < 12; y++) {
    tray.setPixelColor(0xffffffff, x, y);
  }
}
tray.write(path.join(__dirname, '..', 'assets', 'tray.png'));

console.log('icons generated');
