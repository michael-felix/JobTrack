// One-off icon generator: writes PNG icon files for the Chrome extension
// using only Node's built-in zlib (no image library available/installed).
// Draws a rounded terracotta square with three cream bars (a small kanban/
// pipeline glyph) rather than text, since rasterizing a font by hand isn't
// worth it and a letterform reads poorly at 16px anyway.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ACCENT = [0xbd, 0x5b, 0x36]; // terracotta
const CREAM = [0xfa, 0xf6, 0xef];

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function roundedRectAlpha(x, y, w, h, r) {
  // Returns 1 if (x,y) is inside a rounded rect of size w x h with corner
  // radius r (rect spans [0,w) x [0,h)), else 0. Simple hard edge, no AA.
  const cx = x < r ? r : x > w - r - 1 ? w - r - 1 : x;
  const cy = y < r ? r : y > h - r - 1 ? h - r - 1 : y;
  if ((x === cx || y === cy)) return 1;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r ? 1 : 0;
}

function drawIcon(size) {
  const px = new Uint8Array(size * size * 4);
  const radius = Math.max(2, Math.round(size * 0.22));

  // Bars: three vertical bars of increasing height, centered, cream on accent.
  const barCount = 3;
  const barGap = Math.max(1, Math.round(size * 0.08));
  const barWidth = Math.max(1, Math.round((size * 0.5 - barGap * (barCount - 1)) / barCount));
  const totalBarsWidth = barWidth * barCount + barGap * (barCount - 1);
  const startX = Math.round((size - totalBarsWidth) / 2);
  const baseY = Math.round(size * 0.72);
  const heights = [0.28, 0.44, 0.36].map((f) => Math.round(size * f));

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const inRect = roundedRectAlpha(x, y, size, size, radius);
      let color = inRect ? ACCENT : null;

      if (inRect) {
        for (let b = 0; b < barCount; b++) {
          const bx0 = startX + b * (barWidth + barGap);
          const bx1 = bx0 + barWidth;
          const by0 = baseY - heights[b];
          if (x >= bx0 && x < bx1 && y >= by0 && y <= baseY) {
            color = CREAM;
            break;
          }
        }
      }

      if (color) {
        px[i] = color[0];
        px[i + 1] = color[1];
        px[i + 2] = color[2];
        px[i + 3] = 255;
      } else {
        px[i + 3] = 0;
      }
    }
  }
  return px;
}

function encodePng(size) {
  const px = drawIcon(size);
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter type: none
    Buffer.from(px.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, "..", "icons");
fs.mkdirSync(outDir, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  const png = encodePng(size);
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), png);
  console.log(`wrote icons/icon-${size}.png (${png.length} bytes)`);
}
