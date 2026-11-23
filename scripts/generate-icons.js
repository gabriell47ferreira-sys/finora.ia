import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, r, g, b) {
  // Raw RGBA pixels with filter byte 0 at beginning of each row
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowBytes);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.45;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Dark background #080808
      let pr = 8, pg = 8, pb = 8, pa = 255;

      // Stylized F icon in neon lime (#B7FF35)
      // Normalized coords [0, 1]
      const nx = x / width;
      const ny = y / height;

      // Inner icon bounding box roughly 0.28 to 0.72
      if (nx >= 0.30 && nx <= 0.42 && ny >= 0.25 && ny <= 0.75) {
        // Vertical stem of F
        pr = 183; pg = 255; pb = 53;
      } else if (nx >= 0.42 && nx <= 0.72 && ny >= 0.25 && ny <= 0.35) {
        // Top bar of F
        pr = 183; pg = 255; pb = 53;
      } else if (nx >= 0.42 && nx <= 0.64 && ny >= 0.43 && ny <= 0.52) {
        // Mid bar of F
        pr = 183; pg = 255; pb = 53;
      } else if (dist <= radius && (Math.abs(dist - radius) < width * 0.015)) {
        // Border ring
        pr = 41; pg = 41; pb = 41;
      }

      rawData[pxOffset] = pr;
      rawData[pxOffset + 1] = pg;
      rawData[pxOffset + 2] = pb;
      rawData[pxOffset + 3] = pa;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    // CRC calculation
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeInt32BE(crc, 8 + len);
    return buf;
  }

  // Precomputed CRC table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) | 0;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

fs.writeFileSync('public/pwa-192x192.png', createPNG(192, 192, 183, 255, 53));
fs.writeFileSync('public/pwa-512x512.png', createPNG(512, 512, 183, 255, 53));
fs.writeFileSync('public/apple-touch-icon.png', createPNG(180, 180, 183, 255, 53));
console.log('PWA icons created successfully.');
