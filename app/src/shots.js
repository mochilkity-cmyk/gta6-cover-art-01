// Fixed scenes for screenshots: ?shot=editor shows the studio with a sample
// photo loaded; ?shot=cover shows the exported cover alone, drawn by the
// app itself at the window size; ?shot=export runs a real PNG export through
// canvas.toBlob and reports its byte size. window.__shotReady is set once
// the scene is painted, after the fonts have loaded.
import { drawCover } from './cover.js';
import { SAMPLE_PHOTOS } from './main.js';

function photoIndex(id) {
  const i = SAMPLE_PHOTOS.findIndex((p) => p.id === id);
  return i < 0 ? 0 : i;
}

function applyParams(params, state) {
  if (params.get('layout')) state.layout = params.get('layout');
  if (params.get('grade')) state.grade = params.get('grade');
  if (params.get('title')) state.title = params.get('title');
  if (params.get('subtitle')) state.subtitle = params.get('subtitle');
  if (params.get('badge')) state.badge = params.get('badge');
  if (params.get('heat')) state.heat = Number(params.get('heat'));
  if (params.get('grain')) state.grain = params.get('grain') !== '0';
  if (params.get('vignette')) state.vignette = params.get('vignette') !== '0';
  const photos = (params.get('photos') || params.get('photo') || 'convertible')
    .split(',').map((s) => photoIndex(s.trim()));
  state.panels.forEach((p, i) => {
    p.photo = photos[i % photos.length];
    p.zoom = 1;
    p.ox = 0;
    p.oy = 0;
  });
  // A little per-panel variety so the grid reads as several photos.
  if (photos.length > 1) {
    state.panels.forEach((p, i) => { p.zoom = 1 + (i % 3) * 0.12; });
  }
}

async function waitForPaint() {
  try {
    await document.fonts.load('40px Anton');
    await document.fonts.load('24px Pacifico');
    await document.fonts.ready;
  } catch (err) {
    // Fonts are local files; if one fails, the scene still paints with fallback.
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

export async function runShot(params, state, api) {
  const shot = params.get('shot');
  applyParams(params, state);
  api.syncControls();

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const canvas = document.getElementById('preview');
    drawCover(canvas, state, window.innerWidth, window.innerHeight);
    await waitForPaint();
    drawCover(canvas, state, window.innerWidth, window.innerHeight);
    window.__shotReady = true;
    return;
  }

  if (shot === 'export') {
    const blob = await api.exportCover({ label: '1920x1080', w: 1920, h: 1080 });
    window.__exportBytes = blob.size;
    window.__exportType = blob.type;
    window.__shotReady = true;
    return;
  }

  // Default: the editor, with the photo loaded and panels visible.
  api.render();
  await waitForPaint();
  api.render();
  window.__shotReady = true;
}
