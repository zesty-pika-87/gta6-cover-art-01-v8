// Cover Coast v8 — wires the editor: panels, canvas interaction, export.
// One renderer (render.js) serves preview and export, so what you see is
// exactly what the PNG contains.
import { renderCover, layoutSlots, PHOTOS, LAYOUTS, GRADES } from './render.js';
import { defaultState, createHistory, applyPreset, PRESETS, slotsForLayout, slugifyTitle } from './state.js';
import { createZip } from './zip.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const ctx = canvas.getContext('2d');
const history = createHistory(defaultState());
let state = history.get();
const images = new Map();
let dragging = null;

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadAllPhotos() {
  for (const p of PHOTOS) {
    if (!images.has(p.id)) {
      try { images.set(p.id, await loadImage(p.file)); } catch { /* keep going */ }
    }
  }
}

function render() {
  renderCover(ctx, canvas.width, canvas.height, state, images);
  syncPanel();
}

function setState(next, record = true) {
  state = next;
  if (record) history.push(next);
  render();
  updateUndoButtons();
}

function updateUndoButtons() {
  $('undo').disabled = !history.canUndo();
  $('redo').disabled = !history.canRedo();
}

/** Rebuild the dynamic panel contents from the current state. */
function syncPanel() {
  // layout buttons
  document.querySelectorAll('#layouts button').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('#grades button').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('#presets button').forEach((b) => {
    b.classList.toggle('active', b.dataset.preset === state._presetName);
  });
  $('strength').value = state.gradeStrength;
  $('strengthVal').textContent = Math.round(state.gradeStrength * 100) + '%';
  $('title').value = state.title;
  $('subtitle').value = state.subtitle;
  $('ribbon').value = state.ribbon;
  $('strip').value = state.strip;
  $('titlePos').value = state.titlePos;
  $('stars').value = state.stars;
  $('halftone').checked = state.halftone;
  $('grain').checked = state.grain;
  $('vignette').checked = state.vignette;
  $('sunburst').checked = state.sunburst;
  const sel = state.slots[state.selectedSlot];
  if (sel) {
    $('capPlace').value = sel.caption.place;
    $('capTime').value = sel.caption.time;
    $('capLine').value = sel.caption.line;
    $('slotLabel').textContent = `Panel ${state.selectedSlot + 1} — ${sel.photo}`;
    $('zoom').value = sel.zoom;
  }
  // photo thumbnails: mark the selected slot's photo
  document.querySelectorAll('#photos .thumb').forEach((t) => {
    t.classList.toggle('active', t.dataset.photo === sel?.photo);
  });
}

function buildPanels() {
  // presets
  const presetsEl = $('presets');
  PRESETS.forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = p.name;
    b.dataset.preset = p.name;
    b.addEventListener('click', () => {
      const next = applyPreset(state, p);
      next._presetName = p.name;
      setState(next);
      $('status').textContent = `Preset applied: ${p.name}`;
    });
    presetsEl.appendChild(b);
  });
  // layouts
  const layoutsEl = $('layouts');
  Object.entries(LAYOUTS).forEach(([key, l]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = l.name;
    b.dataset.layout = key;
    b.addEventListener('click', () => {
      const next = { ...state, layout: key };
      // keep existing photos, extend/cycle to the new slot count
      const order = state.slots.map((s) => s.photo);
      next.slots = slotsForLayout(key, order.length ? order : PHOTOS.map((p) => p.id));
      // preserve captions/photos of overlapping slots
      state.slots.forEach((s, i) => { if (next.slots[i]) next.slots[i] = { ...next.slots[i], ...s, photo: s.photo, caption: s.caption }; });
      next.selectedSlot = 0;
      setState(next);
    });
    layoutsEl.appendChild(b);
  });
  // grades
  const gradesEl = $('grades');
  Object.entries(GRADES).forEach(([key, g]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = g.name;
    b.dataset.grade = key;
    b.style.setProperty('--sw', `linear-gradient(135deg, ${g.title[0]}, ${g.title[2]})`);
    b.addEventListener('click', () => setState({ ...state, grade: key }));
    gradesEl.appendChild(b);
  });
  // photos
  const photosEl = $('photos');
  PHOTOS.forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb';
    b.dataset.photo = p.id;
    const img = document.createElement('img');
    img.src = p.file;
    img.alt = p.label;
    const span = document.createElement('span');
    span.textContent = p.label;
    b.append(img, span);
    b.addEventListener('click', () => {
      const next = JSON.parse(JSON.stringify(state));
      const s = next.slots[next.selectedSlot];
      const photo = PHOTOS.find((x) => x.id === p.id);
      s.photo = p.id;
      s.caption = { place: photo.place, time: photo.time, line: photo.line };
      s.px = 0.5; s.py = 0.5; s.zoom = 1;
      setState(next);
    });
    photosEl.appendChild(b);
  });
}

function bindControls() {
  $('strength').addEventListener('input', (e) => {
    state = { ...state, gradeStrength: Number(e.target.value) };
    render();
  });
  $('strength').addEventListener('change', () => setState({ ...state }, true));
  const text = (id, key) => $(id).addEventListener('input', (e) => {
    const next = { ...state, [key]: e.target.value };
    state = next;
    render();
  });
  text('title', 'title');
  text('subtitle', 'subtitle');
  text('ribbon', 'ribbon');
  text('strip', 'strip');
  $('title').addEventListener('change', () => history.push(state));
  $('subtitle').addEventListener('change', () => history.push(state));
  $('ribbon').addEventListener('change', () => history.push(state));
  $('strip').addEventListener('change', () => history.push(state));
  $('titlePos').addEventListener('change', (e) => setState({ ...state, titlePos: e.target.value }));
  $('stars').addEventListener('change', (e) => setState({ ...state, stars: Number(e.target.value) }));
  const toggle = (id, key) => $(id).addEventListener('change', (e) => setState({ ...state, [key]: e.target.checked }));
  toggle('halftone', 'halftone');
  toggle('grain', 'grain');
  toggle('vignette', 'vignette');
  toggle('sunburst', 'sunburst');
  $('halftoneDensity').addEventListener('input', (e) => { state = { ...state, halftoneDensity: Number(e.target.value) }; render(); });
  // caption of the selected slot
  const cap = (id, key) => $(id).addEventListener('input', (e) => {
    const next = JSON.parse(JSON.stringify(state));
    next.slots[next.selectedSlot].caption[key] = e.target.value;
    state = next;
    render();
  });
  cap('capPlace', 'place');
  cap('capTime', 'time');
  cap('capLine', 'line');
  $('capPlace').addEventListener('change', () => history.push(state));
  $('zoom').addEventListener('input', (e) => {
    const next = JSON.parse(JSON.stringify(state));
    next.slots[next.selectedSlot].zoom = Number(e.target.value);
    state = next;
    render();
  });
  $('zoom').addEventListener('change', () => history.push(state));
  $('shuffle').addEventListener('click', () => {
    const next = JSON.parse(JSON.stringify(state));
    const order = [...PHOTOS.map((p) => p.id)];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    next.slots = slotsForLayout(next.layout, order);
    setState(next);
    $('status').textContent = 'Photos shuffled';
  });
  // upload your own photo (local only, FileReader)
  $('upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(file);
    });
    const id = 'custom-' + Date.now();
    const img = await loadImage(url);
    images.set(id, img);
    PHOTOS.push({ id, file: url, label: file.name.slice(0, 14), place: 'YOUR PHOTO', time: 'NOW', line: 'MAKE IT YOURS' });
    const next = JSON.parse(JSON.stringify(state));
    const s = next.slots[next.selectedSlot];
    s.photo = id;
    s.caption = { place: 'YOUR PHOTO', time: 'NOW', line: 'MAKE IT YOURS' };
    setState(next);
    $('status').textContent = 'Your photo is in panel ' + (next.selectedSlot + 1);
  });
  // undo / redo
  $('undo').addEventListener('click', () => {
    const s = history.undo();
    if (s) { state = s; render(); updateUndoButtons(); }
  });
  $('redo').addEventListener('click', () => {
    const s = history.redo();
    if (s) { state = s; render(); updateUndoButtons(); }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      const s = history.undo();
      if (s) { state = s; render(); updateUndoButtons(); }
    } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
      e.preventDefault();
      const s = history.redo();
      if (s) { state = s; render(); updateUndoButtons(); }
    }
  });
  // export
  document.querySelectorAll('[data-export]').forEach((b) => {
    b.addEventListener('click', () => exportSize(Number(b.dataset.w), Number(b.dataset.h), b.dataset.label));
  });
  $('exportAll').addEventListener('click', exportAll);
}

function exportCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  renderCover(c.getContext('2d'), w, h, state, images);
  return c;
}

function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function exportSize(w, h, label) {
  const c = exportCanvas(w, h);
  c.toBlob((blob) => {
    download(blob, `${slugifyTitle(state.title)}-${label}.png`);
    $('status').textContent = `Saved ${slugifyTitle(state.title)}-${label}.png (${w}×${h})`;
  }, 'image/png');
}

async function exportAll() {
  const sizes = [
    [1080, 1080, 'square'], [1080, 1350, 'portrait'], [1920, 1080, 'landscape'], [1080, 1920, 'story'],
  ];
  const slug = slugifyTitle(state.title);
  try {
    const files = [];
    for (const [w, h, label] of sizes) {
      const c = exportCanvas(w, h);
      const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
      files.push({ name: `${slug}-${label}-${w}x${h}.png`, data: new Uint8Array(await blob.arrayBuffer()) });
    }
    download(createZip(files), `${slug}-all-sizes.zip`);
    $('status').textContent = 'Saved ' + slug + '-all-sizes.zip (4 PNGs)';
  } catch {
    // ZIP fallback: download one by one (some browsers only allow one at a time)
    for (const [w, h, label] of sizes) exportSize(w, h, label);
    $('status').textContent = 'ZIP failed — downloading the 4 PNGs one by one';
  }
}

// --- canvas interaction: click a panel to select it, drag to pan, wheel to zoom ---
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}
function hitSlot(p) {
  const slots = layoutSlots(state, canvas.width, canvas.height);
  for (let i = slots.length - 1; i >= 0; i--) {
    const s = slots[i];
    if (p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h) return i;
  }
  return -1;
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const i = hitSlot(p);
  if (i < 0) return;
  state.selectedSlot = i;
  history.checkpoint(); // pre-drag state, so undo restores it
  dragging = { i, x: p.x, y: p.y, moved: false };
  canvas.setPointerCapture(e.pointerId);
  render();
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const p = canvasPoint(e);
  const s = state.slots[dragging.i];
  const dx = (p.x - dragging.x) / canvas.width;
  const dy = (p.y - dragging.y) / canvas.height;
  if (Math.abs(dx) + Math.abs(dy) > 0.002) dragging.moved = true;
  s.px = Math.max(0.05, Math.min(0.95, s.px + dx));
  s.py = Math.max(0.05, Math.min(0.95, s.py + dy));
  dragging.x = p.x; dragging.y = p.y;
  render();
});
canvas.addEventListener('pointerup', () => {
  dragging = null; // pre-drag state was checkpointed on pointerdown
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const i = state.selectedSlot;
  const s = state.slots[i];
  if (!s) return;
  history.checkpoint();
  s.zoom = Math.max(1, Math.min(3, s.zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
  render();
}, { passive: false });

buildPanels();
bindControls();
updateUndoButtons();

const shot = new URLSearchParams(location.search).get('shot');
const app = {
  get state() { return state; },
  setState(next) { state = next; history.push(next); },
  loadAllPhotos,
  render,
};
window.__coverApp = app;
if (shot) {
  runShot(shot, new URLSearchParams(location.search), app);
} else {
  loadAllPhotos().then(async () => {
    await document.fonts.ready;
    render();
  });
}
