const zlib = require('zlib');
const fs = require('fs');
function crc32(buf) {
  let crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    let c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, px) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0;
    for (let x = 0; x < size; x++) { const p = px(x, y); raw[o++] = p[0]; raw[o++] = p[1]; raw[o++] = p[2]; raw[o++] = p[3]; }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const S = 1024;
const TEAL = [15, 140, 132, 255];
const NAVY = [11, 31, 58, 255];
const WHITE = [255, 255, 255, 255];
const NONE = [0, 0, 0, 0];
function inRound(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}
function cross(x, y, arm, len, r) {
  const c = S / 2;
  return inRound(x, y, c - arm, c - len, c + arm, c + len, r) || inRound(x, y, c - len, c - arm, c + len, c + arm, r);
}
function heart(x, y, cx, cy, s) {
  const u = (x - cx) / s; const v = -(y - cy) / s;
  return (u * u + v * v - 1) ** 3 - u * u * v * v * v <= 0;
}
// Icône principale : fond bleu nuit arrondi, croix blanche, petit cœur sarcelle au centre
fs.writeFileSync('icon.png', png(S, (x, y) => {
  if (!inRound(x, y, 0, 0, S - 1, S - 1, 220)) return NAVY;
  if (heart(x, y, S / 2, S / 2 + 10, 95)) return TEAL;
  if (cross(x, y, 120, 330, 60)) return WHITE;
  return NAVY;
}));
// Icône adaptative Android : premier plan transparent (zone sûre au centre)
fs.writeFileSync('adaptive.png', png(S, (x, y) => {
  if (heart(x, y, S / 2, S / 2 + 8, 68)) return TEAL;
  if (cross(x, y, 86, 240, 44)) return WHITE;
  return NONE;
}));
const a = JSON.parse(fs.readFileSync('app.json', 'utf8'));
a.expo.icon = './icon.png';
a.expo.android = Object.assign({}, a.expo.android, { adaptiveIcon: { foregroundImage: './adaptive.png', backgroundColor: '#0B1F3A' } });
a.expo.web = Object.assign({}, a.expo.web, { favicon: './icon.png' });
fs.writeFileSync('app.json', JSON.stringify(a, null, 2));
console.log('Icônes générées');
