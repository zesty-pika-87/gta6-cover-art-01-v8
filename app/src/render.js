// Cover Coast v8 — one renderer for preview AND export (same pixels, same seed).
// Canvas 2D only, no network, deterministic: seeded grain + halftone + sunburst.
export const PHOTOS = [
  { id: 'boulevard', file: 'samples/boulevard.jpg', label: 'Boulevard', place: 'OCEAN DRIVE', time: '6:42 PM', line: 'LOOKING FOR TROUBLE', fy: 0.30 },
  { id: 'pier', file: 'samples/pier.jpg', label: 'Pier', place: 'LONELY PIER', time: '5:15 PM', line: 'ONE LAST CAST', fy: 0.28 },
  { id: 'skyline', file: 'samples/skyline.png', label: 'Skyline', place: 'DOWNTOWN', time: '7:58 PM', line: 'THE CITY NEVER SLEEPS', fx: 0.66 },
  { id: 'neon', file: 'samples/neon.png', label: 'Neon Street', place: 'NEON ROW', time: '11:20 PM', line: 'NO WITNESSES', fx: 0.16 },
  { id: 'speedboat', file: 'samples/speedboat.png', label: 'Speedboat', place: 'VISTA BAY', time: '4:05 PM', line: 'FULL THROTTLE', fx: 0.52 },
  { id: 'palmroad', file: 'samples/palmroad.png', label: 'Palm Road', place: 'PALM HIGHWAY', time: '6:05 PM', line: 'DRIVE INTO THE SUN' },
];

export const LAYOUTS = {
  'full-bleed': { name: 'Full Bleed', slots: [{ x: 0, y: 0, w: 1, h: 1 }] },
  'four-panel': { name: 'Four Panel', slots: [
    { x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 },
    { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 } ] },
  'hero-three': { name: 'Hero + Three', slots: [
    { x: 0, y: 0, w: 0.58, h: 1 },
    { x: 0.58, y: 0, w: 0.42, h: 0.34 }, { x: 0.58, y: 0.34, w: 0.42, h: 0.33 }, { x: 0.58, y: 0.67, w: 0.42, h: 0.33 } ] },
  'hero-four': { name: 'Hero + Four', slots: [
    { x: 0, y: 0, w: 0.55, h: 1 },
    { x: 0.55, y: 0, w: 0.225, h: 0.5 }, { x: 0.775, y: 0, w: 0.225, h: 0.5 },
    { x: 0.55, y: 0.5, w: 0.225, h: 0.5 }, { x: 0.775, y: 0.5, w: 0.225, h: 0.5 } ] },
  'nine-panel': { name: 'Nine Panel', slots: [
    { x: 0, y: 0, w: 1 / 3, h: 1 / 3 }, { x: 1 / 3, y: 0, w: 1 / 3, h: 1 / 3 }, { x: 2 / 3, y: 0, w: 1 / 3, h: 1 / 3 },
    { x: 0, y: 1 / 3, w: 1 / 3, h: 1 / 3 }, { x: 1 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 }, { x: 2 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
    { x: 0, y: 2 / 3, w: 1 / 3, h: 1 / 3 }, { x: 1 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 }, { x: 2 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 } ] },
  'mosaic': { name: 'Mosaic', slots: [
    { x: 0, y: 0, w: 0.66, h: 0.5 }, { x: 0.66, y: 0, w: 0.34, h: 0.25 }, { x: 0.66, y: 0.25, w: 0.34, h: 0.25 },
    { x: 0, y: 0.5, w: 0.34, h: 0.5 }, { x: 0.34, y: 0.5, w: 0.33, h: 0.25 }, { x: 0.67, y: 0.5, w: 0.33, h: 0.25 },
    { x: 0.34, y: 0.75, w: 0.66, h: 0.25 } ] },
  'tilted': { name: 'Tilted Snapshots', slots: [
    { x: 0.04, y: 0.06, w: 0.52, h: 0.52, rot: -5 }, { x: 0.44, y: 0.10, w: 0.52, h: 0.46, rot: 4 },
    { x: 0.20, y: 0.50, w: 0.56, h: 0.44, rot: -2 } ] },
  'story-stack': { name: 'Story Stack', slots: [
    { x: 0, y: 0, w: 1, h: 0.36 }, { x: 0, y: 0.36, w: 1, h: 0.32 }, { x: 0, y: 0.68, w: 1, h: 0.32 } ] },
  'poster-strip': { name: 'Poster Strip', slots: [
    { x: 0, y: 0, w: 0.55, h: 0.76 }, { x: 0.55, y: 0, w: 0.225, h: 0.38 },
    { x: 0.775, y: 0, w: 0.225, h: 0.38 }, { x: 0.55, y: 0.38, w: 0.225, h: 0.38 },
    { x: 0.775, y: 0.38, w: 0.225, h: 0.38 } ] },
};

// Pixel-map grades: per-channel shadow lift + highlight gain + saturation +
// gamma + temperature + contrast. The lift/gain make the grade VISIBLE even
// on dark photos (a plain overlay wash does not). `posterize` = Ink look.
export const GRADES = {
  'vice-sunset': { name: 'Vice Sunset', shadow: [42, 10, 52], high: [255, 148, 58], sat: 1.16, gamma: 1.0, temp: 0.08, contrast: 1.08, posterize: 0, title: ['#ffd76a', '#ff7a3c', '#ff2e88'] },
  'neon-nights': { name: 'Neon Nights', shadow: [12, 12, 64], high: [255, 62, 182], sat: 1.26, gamma: 0.98, temp: -0.05, contrast: 1.12, posterize: 0, title: ['#7df9ff', '#ff4fd8', '#ff2e63'] },
  'palm-dusk': { name: 'Palm Dusk', shadow: [48, 12, 58], high: [255, 122, 92], sat: 1.1, gamma: 1.02, temp: 0.05, contrast: 1.06, posterize: 0, title: ['#ffe9a8', '#ff9a5c', '#e0397a'] },
  'magenta-heat': { name: 'Magenta Heat', shadow: [58, 6, 52], high: [255, 82, 142], sat: 1.3, gamma: 1.0, temp: 0.04, contrast: 1.1, posterize: 0, title: ['#ffffff', '#ff7ab8', '#ff2e88'] },
  'teal-noir': { name: 'Teal Noir', shadow: [6, 34, 40], high: [122, 224, 202], sat: 0.96, gamma: 0.98, temp: -0.08, contrast: 1.16, posterize: 0, title: ['#c8fff2', '#5eead4', '#0ea5a5'] },
  'golden-hour': { name: 'Golden Hour', shadow: [46, 24, 6], high: [255, 202, 92], sat: 1.16, gamma: 1.0, temp: 0.12, contrast: 1.08, posterize: 0, title: ['#fff3b0', '#ffb347', '#ff7a18'] },
  'ink-poster': { name: 'Ink Poster', shadow: [12, 6, 24], high: [255, 182, 62], sat: 1.22, gamma: 0.92, temp: 0.05, contrast: 1.26, posterize: 5, title: ['#ffe95e', '#ff9a1f', '#ff2e63'] },
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Slot rects in canvas pixels (gutter + strip already accounted for). */
export function layoutSlots(state, W, H) {
  const stripH = state.layout === 'poster-strip' ? H * 0.24 : 0;
  const areaH = H - stripH;
  const g = Math.max(3, Math.round(W * 0.012));
  const layout = LAYOUTS[state.layout] ?? LAYOUTS['hero-four'];
  return layout.slots.map((s) => {
    const x = s.x * W + (s.x > 0 ? g / 2 : 0);
    const y = s.y * areaH + (s.y > 0 ? g / 2 : 0);
    const w = s.w * W - (s.x > 0 ? g / 2 : 0) - (s.x + s.w < 1 ? g / 2 : 0);
    const h = s.h * areaH - (s.y > 0 ? g / 2 : 0) - (s.y + s.h < 1 ? g / 2 : 0);
    return { ...s, x, y, w, h };
  });
}

function gradeImageData(img, grade, strength) {
  const d = img.data;
  const { shadow, high, sat, gamma, temp, contrast, posterize } = grade;
  const s = strength;
  for (let i = 0; i < d.length; i += 4) {
    const r0 = d[i], g0 = d[i + 1], b0 = d[i + 2];
    const lum = (0.2126 * r0 + 0.7152 * g0 + 0.0722 * b0) / 255;
    const sh = (1 - lum) * (1 - lum);
    const hi = lum * lum;
    let r = r0 + (shadow[0] * sh + high[0] * hi) * 0.55;
    let g = g0 + (shadow[1] * sh + high[1] * hi) * 0.55;
    let b = b0 + (shadow[2] * sh + high[2] * hi) * 0.55;
    // temperature + contrast around mid grey
    r = ((r - 128) * contrast + 128) * (1 + temp);
    b = ((b - 128) * contrast + 128) * (1 - temp);
    g = (g - 128) * contrast + 128;
    // saturation (skin-safe: blend toward luma, never past 1.35x)
    const l2 = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = l2 + (r - l2) * sat; g = l2 + (g - l2) * sat; b = l2 + (b - l2) * sat;
    // gamma
    r = 255 * Math.pow(Math.max(r, 0) / 255, gamma);
    g = 255 * Math.pow(Math.max(g, 0) / 255, gamma);
    b = 255 * Math.pow(Math.max(b, 0) / 255, gamma);
    if (posterize) {
      const q = 255 / (posterize - 1);
      r = Math.round(r / q) * q; g = Math.round(g / q) * q; b = Math.round(b / q) * q;
    }
    d[i] = r0 + (Math.max(0, Math.min(255, r)) - r0) * s;
    d[i + 1] = g0 + (Math.max(0, Math.min(255, g)) - g0) * s;
    d[i + 2] = b0 + (Math.max(0, Math.min(255, b)) - b0) * s;
  }
  return img;
}

function star(ctx, cx, cy, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitFont(ctx, text, maxW, startPx, family, weight = '') {
  let size = startPx;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxW && size > 10) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

/**
 * The single renderer. `images` maps photo id -> loaded HTMLImageElement.
 * `state` is the editor state (see state.js). Draws at any W x H.
 */
export function renderCover(ctx, W, H, state, images) {
  const grade = GRADES[state.grade] ?? GRADES['vice-sunset'];
  const strength = state.gradeStrength ?? 0.85;
  // cream paper + gutters
  ctx.fillStyle = '#fff3df';
  ctx.fillRect(0, 0, W, H);
  const stripH = state.layout === 'poster-strip' ? H * 0.24 : 0;
  const areaH = H - stripH;

  // --- panels (graded per slot, offscreen so the grade is baked in) ---
  const slots = layoutSlots(state, W, H);
  const tmp = document.createElement('canvas');
  const tctx = tmp.getContext('2d', { willReadFrequently: true });
  slots.forEach((slot, i) => {
    const ss = state.slots?.[i];
    const photo = PHOTOS.find((p) => p.id === ss?.photo) ?? PHOTOS[0];
    const img = images.get(ss?.photo ?? photo.id) ?? images.get('boulevard');
    if (!img) return;
    const tw = Math.max(2, Math.round(Math.min(slot.w, 640)));
    const th = Math.max(2, Math.round((tw * slot.h) / slot.w));
    tmp.width = tw; tmp.height = th;
    tctx.clearRect(0, 0, tw, th);
    // draw the slot's crop into the temp canvas, then grade its pixels
    const zoom = ss?.zoom ?? 1, fx = ss?.px ?? 0.5, fy = ss?.py ?? 0.5;
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    // cover scale, boosted (capped 1.6x) so a shifted focal point never
    // exposes empty space; the focal point is then clamped to what the
    // boosted scale can actually show
    let scale = Math.max(tw / iw, th / ih);
    const needX = (tw / 2) / (iw * Math.min(Math.max(fx, 0.05), 0.95));
    const needY = (th / 2) / (ih * Math.min(Math.max(fy, 0.05), 0.95));
    scale = Math.min(Math.max(scale, needX, needY), scale * 1.6) * zoom;
    const pw = iw * scale, ph = ih * scale;
    const fx2 = Math.min(Math.max(fx, (tw / 2) / pw), 1 - (tw / 2) / pw);
    const fy2 = Math.min(Math.max(fy, (th / 2) / ph), 1 - (th / 2) / ph);
    tctx.drawImage(img, tw / 2 - pw * fx2, th / 2 - ph * fy2, pw, ph);
    const data = tctx.getImageData(0, 0, tw, th);
    gradeImageData(data, grade, strength);
    tctx.putImageData(data, 0, 0);
    ctx.save();
    if (slot.rot) {
      ctx.translate(slot.x + slot.w / 2, slot.y + slot.h / 2);
      ctx.rotate((slot.rot * Math.PI) / 180);
      ctx.fillStyle = '#fffdf6';
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = W * 0.02;
      ctx.fillRect(-slot.w / 2 - 8, -slot.h / 2 - 8, slot.w + 16, slot.h + 16);
      ctx.shadowBlur = 0;
      ctx.drawImage(tmp, -slot.w / 2, -slot.h / 2, slot.w, slot.h);
      ctx.restore();
    } else {
      ctx.drawImage(tmp, slot.x, slot.y, slot.w, slot.h);
    }
    // per-panel caption chip
    const cap = ss?.caption ?? photo;
    if (slot.w > W * 0.14 && slot.h > H * 0.09) {
      const pad = Math.max(6, W * 0.008);
      const chipH = Math.max(26, H * 0.052);
      const chipW = Math.min(slot.w - pad * 2, Math.max(W * 0.2, (cap.place + '  ' + cap.time).length * W * 0.008));
      const cx = slot.x + pad;
      // lift the chip above the bottom tagline strip when the slot touches it
      const bandH = state.layout === 'poster-strip' ? 0 : H * 0.062;
      let cy = slot.y + slot.h - pad - chipH;
      if (slot.y + slot.h > H - bandH - pad) cy = Math.min(cy, H - bandH - pad - chipH);
      // never draw a chip under the giant title band
      const tY = state.titlePos === 'top' ? areaH * 0.20 : state.titlePos === 'bottom' ? areaH * 0.80 : areaH * 0.60;
      if (Math.abs(cy + chipH / 2 - tY) < H * 0.10) return;
      ctx.fillStyle = 'rgba(12,6,20,0.82)';
      roundRect(ctx, cx, cy, chipW, chipH, Math.max(3, W * 0.004));
      ctx.fill();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const fs = fitFont(ctx, `${cap.place}  ${cap.time}`, chipW - pad, H * 0.016, 'Anton');
      ctx.fillStyle = '#ffe9a8';
      ctx.fillText(`${cap.place}  ${cap.time}`, cx + pad / 2, cy + chipH * 0.32);
      const fs2 = fitFont(ctx, cap.line, chipW - pad, H * 0.013, 'system-ui, sans-serif', '600 ');
      ctx.fillStyle = '#ffffff';
      ctx.fillText(cap.line, cx + pad / 2, cy + chipH * 0.74);
    }
  });

  // --- sunburst rays (soft, from the sky) ---
  if (state.sunburst) {
    const sx = W * 0.5, sy = areaH * 0.16;
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 12; i++) {
      const a0 = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.arc(sx, sy, Math.max(W, H) * 0.9, a0, a0 + 0.10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // --- halftone dots over the sky band only (default ON, light touch) ---
  if (state.halftone) {
    const step = Math.max(10, W * 0.018);
    ctx.save();
    ctx.fillStyle = 'rgba(24,8,36,0.13)';
    const dens = state.halftoneDensity ?? 0.55;
    for (let yy = step / 2; yy < areaH * 0.22; yy += step) {
      for (let xx = step / 2; xx < W; xx += step) {
        const r = step * 0.22 * (0.4 + dens * (1 - yy / (areaH * 0.22)));
        ctx.beginPath();
        ctx.arc(xx, yy, Math.max(0.5, r), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // --- title block (giant, over the photos) ---
  const titleY = state.titlePos === 'top' ? areaH * 0.20 : state.titlePos === 'bottom' ? areaH * 0.80 : areaH * 0.60;
  const lines = (state.title || 'SUNSET HEIST').toUpperCase().split('\n');
  // scrim so lettering never fights a face
  const scrim = ctx.createLinearGradient(0, titleY - H * 0.16, 0, titleY + H * 0.10);
  scrim.addColorStop(0, 'rgba(10,4,18,0)');
  scrim.addColorStop(0.5, 'rgba(10,4,18,0.42)');
  scrim.addColorStop(1, 'rgba(10,4,18,0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, titleY - H * 0.16, W, H * 0.26);
  const gradT = ctx.createLinearGradient(0, titleY - H * 0.09, 0, titleY + H * 0.03);
  gradT.addColorStop(0, grade.title[0]);
  gradT.addColorStop(0.55, grade.title[1]);
  gradT.addColorStop(1, grade.title[2]);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lineH = H * 0.115;
  lines.forEach((line, li) => {
    const cy = titleY + (li - (lines.length - 1) / 2) * lineH;
    const size = fitFont(ctx, line, W * 0.94, H * 0.105, 'Anton, "Arial Black", sans-serif');
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#12060f';
    ctx.lineWidth = Math.max(3, size * 0.10);
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowOffsetX = size * 0.035;
    ctx.shadowOffsetY = size * 0.045;
    ctx.shadowBlur = size * 0.06;
    ctx.strokeText(line, W / 2, cy);
    ctx.fillStyle = gradT;
    ctx.fillText(line, W / 2, cy);
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.shadowBlur = 0;
  });
  // subtitle script overlapping the title's lower edge
  if (state.subtitle) {
    const subY = titleY + ((lines.length - 1) / 2) * lineH + H * 0.075;
    ctx.save();
    ctx.translate(W / 2, subY);
    ctx.rotate(-0.03);
    const sSize = fitFont(ctx, state.subtitle, W * 0.6, H * 0.048, 'Pacifico, cursive');
    ctx.lineWidth = Math.max(2, sSize * 0.12);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText(state.subtitle, 0, 0);
    ctx.fillStyle = '#ff4f9a';
    ctx.fillText(state.subtitle, 0, 0);
    ctx.restore();
  }

  // --- ribbon badge (tilted) ---
  if (state.ribbon) {
    ctx.save();
    ctx.translate(W * 0.10, H * 0.055);
    ctx.rotate(-0.10);
    const rSize = fitFont(ctx, state.ribbon, W * 0.3, H * 0.024, 'Anton, sans-serif');
    const rw = ctx.measureText(state.ribbon).width + W * 0.03;
    ctx.fillStyle = '#ff2e63';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 6;
    ctx.fillRect(-rw / 2, -H * 0.02, rw, H * 0.04);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(state.ribbon, 0, 0);
    ctx.restore();
  }

  // --- star meter (anchored from the right edge so the 5th star never clips) ---
  const stars = state.stars ?? 5;
  const sr = Math.max(7, H * 0.014);
  const starRight = W * 0.98 - sr;
  for (let i = 0; i < 5; i++) {
    star(ctx, starRight - (4 - i) * sr * 2.4, H * 0.055, sr, i < stars ? '#ffd76a' : 'rgba(255,255,255,0.35)');
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.max(10, H * 0.016)}px Anton, sans-serif`;
  ctx.fillText('ORIGINAL COVER ART', W * 0.98, H * 0.10);

  // --- bottom strip / tagline ---
  if (state.layout === 'poster-strip') {
    ctx.fillStyle = '#160a24';
    ctx.fillRect(0, areaH, W, stripH);
    ctx.fillStyle = '#ffd76a';
    ctx.textAlign = 'center';
    const tSize = fitFont(ctx, state.strip, W * 0.92, stripH * 0.30, 'Anton, sans-serif');
    ctx.fillText(state.strip, W / 2, areaH + stripH * 0.42);
    ctx.fillStyle = '#ff4f9a';
    ctx.font = `${Math.max(11, stripH * 0.20)}px Pacifico, cursive`;
    ctx.fillText(state.subtitle || '', W / 2, areaH + stripH * 0.78);
  } else if (state.strip) {
    const bandH = H * 0.062;
    const g2 = ctx.createLinearGradient(0, H - bandH, 0, H);
    g2.addColorStop(0, 'rgba(14,5,24,0)');
    g2.addColorStop(1, 'rgba(14,5,24,0.85)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, H - bandH, W, bandH);
    ctx.fillStyle = '#ffe9a8';
    ctx.textAlign = 'center';
    fitFont(ctx, state.strip, W * 0.94, H * 0.02, 'Anton, sans-serif');
    ctx.fillText(state.strip, W / 2, H - bandH * 0.32);
  }

  // --- vignette + grain (seeded, identical every render) ---
  if (state.vignette) {
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.30)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }
  if (state.grain) {
    const rnd = mulberry32(state.seed ?? 7);
    const n = document.createElement('canvas');
    n.width = 140; n.height = 140;
    const nctx = n.getContext('2d');
    const id = nctx.createImageData(140, 140);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = Math.floor(rnd() * 255);
      id.data[i] = v; id.data[i + 1] = v; id.data[i + 2] = v; id.data[i + 3] = 26;
    }
    nctx.putImageData(id, 0, 0);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = ctx.createPattern(n, 'repeat');
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  // cream outer frame
  ctx.strokeStyle = '#fff3df';
  ctx.lineWidth = Math.max(4, W * 0.012);
  ctx.strokeRect(0, 0, W, H);
}
