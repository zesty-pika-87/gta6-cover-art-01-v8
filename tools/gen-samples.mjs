// Generates 4 textured procedural "photos" (720x720 PNG) for Cover Coast v8.
// Pure Node stdlib: pixel renderer + hand-rolled PNG encoder (zlib deflate).
// Scenes: sunset skyline, neon street, ocean speedboat, palm road.
// Deterministic: same seed -> same bytes.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const W = 720, H = 720;
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'samples');
mkdirSync(outDir, { recursive: true });

// ---------- utils ----------
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// deterministic 2D value noise
function hash2(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + s * 974634211) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (((h ^ (h >>> 16)) >>> 0) % 100000) / 100000;
}
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s);
  const c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
}
function grad(stops, t) {
  t = clamp(t);
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i], [t1, c1] = stops[i + 1];
    if (t >= t0 && t <= t1) {
      const k = (t - t0) / (t1 - t0 || 1);
      return [lerp(c0[0], c1[0], k), lerp(c0[1], c1[1], k), lerp(c0[2], c1[2], k)];
    }
  }
  return stops[stops.length - 1][1];
}
function addGrain(px, x, y, seed, amp) {
  const g = (hash2(x, y, seed) - 0.5) * amp;
  px[0] += g; px[1] += g; px[2] += g;
}
function lineMask(mask, x0, y0, x1, y1, thick) {
  const dx = x1 - x0, dy = y1 - y0;
  const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 2) + 1;
  const r = Math.max(1, Math.round(thick / 2));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cx = Math.round(x0 + dx * t), cy = Math.round(y0 + dy * t);
    for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) {
      const xx = cx + a, yy = cy + b;
      if (xx >= 0 && xx < W && yy >= 0 && yy < H) mask[yy * W + xx] = 1;
    }
  }
}
function palmMask(seed, baseX, baseY, height, lean) {
  const mask = new Uint8Array(W * H);
  const rnd = mulberry32(seed);
  const topX = baseX + lean, topY = baseY - height;
  lineMask(mask, baseX, baseY, topX, topY, 9);
  const fronds = 7 + Math.floor(rnd() * 3);
  for (let i = 0; i < fronds; i++) {
    const ang = (-Math.PI * (0.08 + (i / fronds) * 0.84)) + (rnd() - 0.5) * 0.25;
    const len = height * (0.42 + rnd() * 0.22);
    const ex = topX + Math.cos(ang) * len, ey = topY + Math.sin(ang) * len * 0.55 + len * 0.28;
    // drooping frond: two segments
    const mx = topX + Math.cos(ang) * len * 0.55, my = topY + Math.sin(ang) * len * 0.3 + len * 0.12;
    lineMask(mask, topX, topY, mx, my, 4);
    lineMask(mask, mx, my, ex, ey + len * 0.22, 3);
  }
  // coconuts
  lineMask(mask, topX - 6, topY + 4, topX + 6, topY + 4, 7);
  return mask;
}

// ---------- PNG encoder ----------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}
function encodePNG(rgb) {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    rgb.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
function render(name, seed, fn) {
  const buf = Buffer.alloc(W * H * 3);
  const px = [0, 0, 0];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      fn(x / W, y / H, x, y, px);
      const i = (y * W + x) * 3;
      buf[i] = clamp(Math.round(px[0]), 0, 255);
      buf[i + 1] = clamp(Math.round(px[1]), 0, 255);
      buf[i + 2] = clamp(Math.round(px[2]), 0, 255);
    }
  }
  const png = encodePNG(buf);
  writeFileSync(join(outDir, name), png);
  console.log(name, 'written', (png.length / 1024).toFixed(0) + ' KiB');
}

// ---------- scene 1: sunset skyline ----------
function buildingHeight(nx, seed) {
  const seg = Math.floor(nx * 14);
  const h = hash2(seg, 0, seed);
  return 0.16 + h * 0.34 + (seg % 3 === 0 ? 0.1 : 0);
}
render('skyline.png', 11, (nx, ny, x, y, px) => {
  const sky = grad([[0, [38, 16, 74]], [0.35, [122, 32, 96]], [0.6, [232, 92, 66]], [0.75, [255, 166, 66]], [1, [255, 214, 130]]], ny);
  px[0] = sky[0]; px[1] = sky[1]; px[2] = sky[2];
  // sun + glow
  const dx = nx - 0.66, dy = (ny - 0.58) * 1.0;
  const d = Math.sqrt(dx * dx + dy * dy);
  const glow = Math.max(0, 1 - d / 0.42);
  px[0] += glow * glow * 150; px[1] += glow * glow * 90; px[2] += glow * glow * 30;
  if (d < 0.085) { px[0] = 255; px[1] = 236; px[2] = 170; }
  const horizon = 0.66;
  if (ny > horizon) {
    // water with reflection streaks
    const n = vnoise(nx * 26, ny * 60, 5);
    const streak = Math.max(0, 1 - Math.abs(nx - 0.66) / 0.3) * (0.4 + 0.6 * n);
    px[0] = lerp(28, 235, streak * 0.55); px[1] = lerp(12, 110, streak * 0.55); px[2] = lerp(48, 60, streak * 0.4);
    px[0] += (n - 0.5) * 22; px[1] += (n - 0.5) * 14; px[2] += (n - 0.5) * 18;
  } else {
    const bh = buildingHeight(nx, 11);
    const top = horizon - bh;
    if (ny > top) {
      const shade = 0.75 + 0.25 * vnoise(nx * 8, ny * 4, 3);
      px[0] = 26 * shade; px[1] = 12 * shade; px[2] = 44 * shade;
      // lit windows
      const wx = Math.floor(nx * 52), wy = Math.floor(ny * 52);
      if (hash2(wx, wy, 21) < 0.16 && (wx % 2 === 0)) {
        const warm = hash2(wx, wy, 22) < 0.6;
        px[0] = warm ? 255 : 150; px[1] = warm ? 196 : 220; px[2] = warm ? 90 : 255;
      }
    }
  }
  addGrain(px, x, y, 31, 13);
});

// ---------- scene 2: neon street ----------
const SIGNS = [
  { x: 0.06, y: 0.10, w: 0.16, h: 0.07, c: [255, 45, 149] },
  { x: 0.05, y: 0.24, w: 0.12, h: 0.05, c: [0, 229, 255] },
  { x: 0.78, y: 0.08, w: 0.17, h: 0.08, c: [255, 214, 64] },
  { x: 0.80, y: 0.26, w: 0.13, h: 0.05, c: [0, 255, 170] },
  { x: 0.30, y: 0.05, w: 0.10, h: 0.05, c: [190, 90, 255] },
];
render('neon.png', 22, (nx, ny, x, y, px) => {
  const sky = grad([[0, [10, 8, 34]], [0.5, [26, 14, 58]], [1, [58, 20, 74]]], ny);
  px[0] = sky[0]; px[1] = sky[1]; px[2] = sky[2];
  const n = vnoise(nx * 18, ny * 18, 7);
  px[0] += (n - 0.5) * 10; px[1] += (n - 0.5) * 10; px[2] += (n - 0.5) * 12;
  // buildings left/right
  const edge = 0.16 + 0.10 * vnoise(nx * 3, 0.5, 9);
  const inB = (nx < edge && ny < 0.72) || (nx > 1 - edge && ny < 0.72);
  if (inB) { px[0] = 14; px[1] = 10; px[2] = 30; }
  // neon signs + glow
  for (const s of SIGNS) {
    const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
    const d = Math.hypot((nx - cx) * 1.4, (ny - cy) * 2.2);
    const glow = Math.max(0, 1 - d / 0.30);
    px[0] += s.c[0] * glow * glow * 0.55; px[1] += s.c[1] * glow * glow * 0.55; px[2] += s.c[2] * glow * glow * 0.55;
    if (nx > s.x && nx < s.x + s.w && ny > s.y && ny < s.y + s.h) {
      px[0] = s.c[0]; px[1] = s.c[1]; px[2] = s.c[2];
    }
  }
  // wet road
  if (ny > 0.72) {
    const persp = (ny - 0.72) / 0.28;
    const roadW = 0.16 + persp * 0.30;
    const inRoad = Math.abs(nx - 0.5) < roadW;
    if (inRoad) {
      px[0] = 16 + persp * 8; px[1] = 14 + persp * 6; px[2] = 30 + persp * 10;
      // reflections: vertical streaks under each sign colour
      for (const s of SIGNS) {
        const streak = Math.max(0, 1 - Math.abs(nx - (s.x + s.w / 2)) / 0.05) * (0.5 + 0.5 * vnoise(nx * 90, ny * 8, 4));
        const fade = (1 - persp) * 0.9;
        px[0] += s.c[0] * streak * fade * 0.5; px[1] += s.c[1] * streak * fade * 0.5; px[2] += s.c[2] * streak * fade * 0.5;
      }
      // centre dashes
      const dashY = ((ny * 14) % 1);
      if (Math.abs(nx - 0.5) < 0.008 && dashY < 0.45) { px[0] = 240; px[1] = 220; px[2] = 120; }
    } else { px[0] = 10; px[1] = 8; px[2] = 22; }
  }
  // string lights
  const ly = 0.30 + 0.05 * Math.sin(nx * 9);
  if (Math.abs(ny - ly) < 0.006 && hash2(Math.floor(nx * 60), 0, 55) < 0.7) {
    px[0] = 255; px[1] = 214; px[2] = 140;
  }
  addGrain(px, x, y, 32, 12);
});

// ---------- scene 3: ocean speedboat ----------
render('speedboat.png', 33, (nx, ny, x, y, px) => {
  const sky = grad([[0, [255, 196, 110]], [0.3, [255, 224, 170]], [0.45, [150, 214, 226]], [1, [40, 150, 190]]], ny);
  px[0] = sky[0]; px[1] = sky[1]; px[2] = sky[2];
  if (ny < 0.42) {
    const d = Math.hypot(nx - 0.24, (ny - 0.16) * 1.1);
    const glow = Math.max(0, 1 - d / 0.3);
    px[0] += glow * 60; px[1] += glow * 40; px[2] += glow * 10;
    if (d < 0.06) { px[0] = 255; px[1] = 244; px[2] = 200; }
    const cl = vnoise(nx * 6, ny * 6, 8);
    if (cl > 0.62 && ny > 0.08 && ny < 0.34) { px[0] = 255; px[1] = 250; px[2] = 245; }
  } else {
    // sea
    const wave = vnoise(nx * 14, ny * 40, 6);
    const depth = (ny - 0.42) / 0.58;
    px[0] = lerp(24, 8, depth) + (wave - 0.5) * 26;
    px[1] = lerp(148, 60, depth) + (wave - 0.5) * 30;
    px[2] = lerp(186, 96, depth) + (wave - 0.5) * 26;
    // sun glitter
    if (Math.abs(nx - 0.24) < 0.10 * (0.5 + depth) && wave > 0.72) { px[0] = 255; px[1] = 240; px[2] = 190; }
    // wake foam behind boat (boat centre ~0.52, 0.52)
    const wakeX = 0.52 - (ny - 0.52) * 1.6;
    if (ny > 0.52 && Math.abs(nx - wakeX) < 0.10 + (ny - 0.52) * 0.5 && vnoise(nx * 40, ny * 40, 12) > 0.42) {
      px[0] = 245; px[1] = 252; px[2] = 250;
    }
    // boat hull: trapezoid + cabin
    const hullTop = 0.50, hullBot = 0.565;
    const hw = lerp(0.02, 0.16, (ny - hullTop) / (hullBot - hullTop));
    if (ny > hullTop && ny < hullBot && Math.abs(nx - 0.52) < hw) {
      px[0] = 245; px[1] = 246; px[2] = 240;
      if (ny > hullBot - 0.012) { px[0] = 220; px[1] = 40; px[2] = 60; }
    }
    if (ny > 0.455 && ny < 0.50 && Math.abs(nx - 0.52) < 0.055) {
      px[0] = 30; px[1] = 42; px[2] = 58; // windshield
      if (nx > 0.52) { px[0] = 120; px[1] = 200; px[2] = 230; }
    }
    // driver silhouette
    if (ny > 0.44 && ny < 0.46 && Math.abs(nx - 0.50) < 0.012) { px[0] = 20; px[1] = 20; px[2] = 26; }
  }
  addGrain(px, x, y, 33, 11);
});

// ---------- scene 4: palm road ----------
const palmL = palmMask(101, 92, 700, 330, -40);
const palmR = palmMask(202, 628, 700, 360, 46);
const palmR2 = palmMask(303, 560, 470, 190, 30);
render('palmroad.png', 44, (nx, ny, x, y, px) => {
  const sky = grad([[0, [64, 24, 96]], [0.35, [214, 64, 110]], [0.55, [255, 140, 80]], [0.7, [255, 205, 110]], [1, [255, 230, 160]]], ny);
  px[0] = sky[0]; px[1] = sky[1]; px[2] = sky[2];
  const d = Math.hypot(nx - 0.5, (ny - 0.52) * 1.15);
  const glow = Math.max(0, 1 - d / 0.36);
  px[0] += glow * glow * 120; px[1] += glow * glow * 70; px[2] += glow * glow * 20;
  if (d < 0.075) { px[0] = 255; px[1] = 240; px[2] = 180; }
  // road perspective
  const vpY = 0.55;
  if (ny > vpY) {
    const t = (ny - vpY) / (1 - vpY);
    const halfW = 0.03 + t * 0.34;
    const inRoad = Math.abs(nx - 0.5) < halfW;
    if (inRoad) {
      const n = vnoise(nx * 30, ny * 30, 9);
      px[0] = 52 + (n - 0.5) * 16; px[1] = 34 + (n - 0.5) * 12; px[2] = 58 + (n - 0.5) * 14;
      const dash = ((ny * 9 + 0.2) % 1);
      if (Math.abs(nx - 0.5) < 0.006 + t * 0.004 && dash < 0.5) { px[0] = 255; px[1] = 214; px[2] = 120; }
      // sun reflection stripe
      if (Math.abs(nx - 0.5) < 0.05 * t) { px[0] += 60 * t; px[1] += 30 * t; }
    } else {
      // sandy verge with scrub
      const n = vnoise(nx * 40, ny * 40, 10);
      px[0] = 176 + (n - 0.5) * 30; px[1] = 96 + (n - 0.5) * 22; px[2] = 66 + (n - 0.5) * 18;
    }
  }
  // palms (dark silhouettes)
  const i = y * W + x;
  if (palmL[i] || palmR[i] || palmR2[i]) { px[0] = 24; px[1] = 12; px[2] = 40; }
  addGrain(px, x, y, 34, 13);
});
console.log('done');
