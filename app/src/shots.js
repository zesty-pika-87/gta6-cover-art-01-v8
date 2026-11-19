// Fixed scenes for screenshots: ?shot=cover shows the finished poster alone,
// ?shot=editor the full editor with photos loaded, ?shot=grid the Nine Panel
// layout, ?shot=story the Story Stack portrait. window.__shotReady is set
// once fonts are loaded and the scene has painted twice.
import { applyPreset, PRESETS } from './state.js';

export async function runShot(shot, query, app) {
  const q = (k, d) => query.get(k) ?? d;
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    app.setState(applyPreset(app.state, PRESETS[0]));
    if (q('title')) app.state.title = q('title');
  } else if (shot === 'grid') {
    document.body.classList.add('shot-cover');
    app.setState(applyPreset(app.state, PRESETS[1]));
  } else if (shot === 'story') {
    document.body.classList.add('shot-cover', 'shot-story');
    const c = document.getElementById('cover');
    c.width = 1080; c.height = 1350; // portrait canvas, not a stretched square
    app.setState(applyPreset(app.state, PRESETS[2]));
    app.state.layout = 'story-stack';
  } else {
    // editor: default preset, editor UI visible
    app.setState(applyPreset(app.state, PRESETS[0]));
  }
  await app.loadAllPhotos();
  await document.fonts.ready;
  try {
    await Promise.all([document.fonts.load('80px Anton'), document.fonts.load('40px Pacifico')]);
  } catch { /* system fallback still renders */ }
  app.render();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
