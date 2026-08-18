import fs from "fs";
import path from "path";
import zlib from "zlib";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const ICONS_DIR = path.join(PUBLIC_DIR, "icons");

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// 1. Create crisp SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="100" fill="#09090b" />
  <g transform="translate(64, 70) scale(3.84)">
    <polygon points="50,10 88,78 12,78" fill="white" opacity="0.06"/>
    <polygon points="50,10 88,78 12,78" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <line x1="34" y1="40" x2="72" y2="49" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
    <line x1="24" y1="58" x2="80" y2="63" stroke="#ec4899" stroke-width="4" stroke-linecap="round"/>
    <line x1="18" y1="71" x2="82" y2="71" stroke="#a855f7" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(ICONS_DIR, "icon.svg"), svgContent);
fs.writeFileSync(path.join(ICONS_DIR, "icon-512.svg"), svgContent);
fs.writeFileSync(path.join(ICONS_DIR, "icon-192.svg"), svgContent);
fs.writeFileSync(path.join(PUBLIC_DIR, "favicon.svg"), svgContent);

/**
 * Pure Node.js uncompressed raw PNG encoder (no external deps needed!)
 */
function createSolidPng(width, height) {
  // Simple PNG header & chunks
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk("IHDR", ihdrData);

  // Raw Image Data (Filter byte 0 for each scanline)
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Background dark #09090b
      let r = 9, g = 9, b = 11, a = 255;

      // Draw stylized Prism Triangle centered
      const cx = width / 2;
      const cy = height / 2;
      const scale = width / 100;
      const nx = (x - cx) / scale + 50;
      const ny = (y - cy) / scale + 48;

      // Outer triangle check
      if (ny >= 10 && ny <= 78) {
        const leftBound = 50 - (ny - 10) * 0.55;
        const rightBound = 50 + (ny - 10) * 0.55;
        if (nx >= leftBound && nx <= rightBound) {
          // Inside triangle
          r = 20; g = 20; b = 25;
          // Border check
          const distToLeft = Math.abs(nx - leftBound);
          const distToRight = Math.abs(nx - rightBound);
          const distToBottom = Math.abs(ny - 78);
          if (distToLeft < 3 || distToRight < 3 || distToBottom < 3) {
            r = 255; g = 255; b = 255;
          }
          // Horizontal spectral ray lines
          if (Math.abs(ny - 44) < 2 && nx > 34 && nx < 72) {
            r = 56; g = 189; b = 248; // sky
          } else if (Math.abs(ny - 60) < 2 && nx > 24 && nx < 80) {
            r = 236; g = 72; b = 153; // pink
          } else if (Math.abs(ny - 71) < 2 && nx > 18 && nx < 82) {
            r = 168; g = 85; b = 247; // purple
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const idat = makeChunk("IDAT", zlib.deflateSync(rawData));
  const iend = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, "ascii");
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc >>> 0, 8 + len);
  return chunk;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Generate PNGs
fs.writeFileSync(path.join(ICONS_DIR, "icon-192.png"), createSolidPng(192, 192));
fs.writeFileSync(path.join(ICONS_DIR, "icon-512.png"), createSolidPng(512, 512));
fs.writeFileSync(path.join(ICONS_DIR, "apple-touch-icon.png"), createSolidPng(180, 180));
fs.writeFileSync(path.join(PUBLIC_DIR, "icon-192.png"), createSolidPng(192, 192));
fs.writeFileSync(path.join(PUBLIC_DIR, "icon-512.png"), createSolidPng(512, 512));

console.log("Successfully generated all PWA icons in /public/icons!");
