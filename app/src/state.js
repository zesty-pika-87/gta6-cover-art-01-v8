// Cover Coast v8 — state, presets, undo/redo. Pure data, no DOM.
import { PHOTOS } from './render.js';

function slotFor(photoId, over = {}) {
  const p = PHOTOS.find((x) => x.id === photoId) ?? PHOTOS[0];
  return { photo: p.id, px: p.fx ?? 0.5, py: p.fy ?? 0.5, zoom: 1, caption: { place: p.place, time: p.time, line: p.line }, ...over };
}

export function defaultState() {
  return {
    layout: 'hero-four',
    grade: 'vice-sunset',
    gradeStrength: 0.85,
    title: 'SUNSET HEIST',
    subtitle: 'Neon Tide Nights',
    ribbon: 'VICE BLOOM',
    strip: 'ONE COAST  •  NO RULES  •  COMING SOON',
    stars: 5,
    titlePos: 'over',
    halftone: true,
    halftoneDensity: 0.55,
    grain: true,
    vignette: true,
    sunburst: true,
    seed: 7,
    selectedSlot: 0,
    slots: [
      slotFor('boulevard'),
      slotFor('pier'),
      slotFor('skyline'),
      slotFor('neon'),
      slotFor('speedboat'),
      slotFor('palmroad'),
    ],
  };
}

/** Fill slots for a layout from a photo order (cycles if fewer photos). */
export function slotsForLayout(layout, photoOrder) {
  const counts = {
    'full-bleed': 1, 'four-panel': 4, 'hero-three': 4, 'hero-four': 5,
    'nine-panel': 9, mosaic: 7, tilted: 3, 'story-stack': 3, 'poster-strip': 5,
  };
  const n = counts[layout] ?? 5;
  const out = [];
  for (let i = 0; i < n; i++) out.push(slotFor(photoOrder[i % photoOrder.length]));
  return out;
}

export const PRESETS = [
  {
    name: 'Vice Sunset Hero', layout: 'hero-four', grade: 'vice-sunset', gradeStrength: 0.9,
    title: 'SUNSET HEIST', subtitle: 'Neon Tide Nights', ribbon: 'VICE BLOOM',
    strip: 'ONE COAST  •  NO RULES  •  COMING SOON',
    photos: ['boulevard', 'pier', 'skyline', 'neon', 'speedboat'],
  },
  {
    name: 'Neon Nights Nine', layout: 'nine-panel', grade: 'neon-nights', gradeStrength: 0.9,
    title: 'NEON COAST', subtitle: 'Six nights in paradise', ribbon: 'EST. 2026',
    strip: 'MARINA DEL SOL  •  7:40 PM  •  NO WITNESSES',
    photos: ['neon', 'boulevard', 'skyline', 'pier', 'speedboat', 'palmroad', 'neon', 'boulevard', 'skyline'],
  },
  {
    name: 'Palm Dusk Strip', layout: 'poster-strip', grade: 'palm-dusk', gradeStrength: 0.85,
    title: 'PALM HEAT', subtitle: 'Boardwalk Nights', ribbon: 'COAST EDITION',
    strip: 'EVERY SUMMER HAS A STORY  •  COMING SOON',
    photos: ['palmroad', 'boulevard', 'pier', 'speedboat', 'skyline'],
  },
  {
    name: 'Ink Heatwave', layout: 'hero-three', grade: 'ink-poster', gradeStrength: 1.0,
    title: 'HEATWAVE', subtitle: 'Coastline Nights', ribbon: 'NEW SUMMER 2026',
    strip: 'IN STORES SOMEWHERE SOON  •  VOL. 06',
    photos: ['boulevard', 'skyline', 'neon', 'pier'],
  },
  {
    name: 'Golden Getaway', layout: 'four-panel', grade: 'golden-hour', gradeStrength: 0.85,
    title: 'COASTLINE', subtitle: 'One last summer', ribbon: 'VOL. 01',
    strip: 'ONE COAST  •  NO WAY BACK  •  COMING SOON',
    photos: ['speedboat', 'boulevard', 'palmroad', 'pier'],
  },
];

export function applyPreset(state, preset) {
  const next = { ...state };
  next.layout = preset.layout;
  next.grade = preset.grade;
  next.gradeStrength = preset.gradeStrength;
  next.title = preset.title;
  next.subtitle = preset.subtitle;
  next.ribbon = preset.ribbon;
  next.strip = preset.strip;
  next.slots = slotsForLayout(preset.layout, preset.photos);
  next.selectedSlot = 0;
  return next;
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

/** Undo/redo history, 60 steps. */
export function createHistory(initial) {
  const past = [];
  const future = [];
  let current = cloneState(initial);
  return {
    get() { return current; },
    /** Record the current state in the past WITHOUT changing it, so a
     * drag/slider that mutates the live object still undoes correctly. */
    checkpoint() {
      past.push(cloneState(current));
      if (past.length > 60) past.shift();
      future.length = 0;
    },
    push(next) {
      past.push(cloneState(current));
      if (past.length > 60) past.shift();
      future.length = 0;
      current = cloneState(next);
    },
    undo() {
      if (!past.length) return null;
      future.push(cloneState(current));
      current = past.pop();
      return cloneState(current);
    },
    redo() {
      if (!future.length) return null;
      past.push(cloneState(current));
      current = future.pop();
      return cloneState(current);
    },
    canUndo() { return past.length > 0; },
    canRedo() { return future.length > 0; },
  };
}

export function slugifyTitle(title) {
  return (title || 'cover').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'cover';
}
