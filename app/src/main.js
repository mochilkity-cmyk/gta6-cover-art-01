// Neon Coast Cover Studio editor: state, controls, drag-to-pan cropping,
// undo/redo, and PNG export in the four post sizes. Photos are read on the
// user's own machine and never leave it.
import { drawCover, panelRects } from './cover.js';
import { GRADES } from './grades.js';
import { LAYOUTS } from './layouts.js';
import { runShot } from './shots.js';

export const SAMPLE_PHOTOS = [
  { id: 'convertible', label: 'Convertible', src: 'samples/convertible.jpg' },
  { id: 'rooftop', label: 'Rooftop', src: 'samples/rooftop.jpg' },
  { id: 'friends', label: 'Neon street', src: 'samples/friends.jpg' },
  { id: 'boulevard', label: 'Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'pier', label: 'Pier', src: 'samples/pier.jpg' },
];

export const EXPORT_SIZES = [
  { label: '1080x1080', w: 1080, h: 1080 },
  { label: '1080x1350', w: 1080, h: 1350 },
  { label: '1920x1080', w: 1920, h: 1080 },
  { label: '1080x1920', w: 1080, h: 1920 },
];

const canvas = document.getElementById('preview');
const status = document.getElementById('status');

export function blankPanels() {
  return Array.from({ length: 9 }, () => ({ photo: -1, zoom: 1, ox: 0, oy: 0 }));
}

export function defaultState() {
  return {
    layout: 'nine',
    grade: 'sunset',
    title: 'NEON COAST',
    subtitle: 'Vice City nights',
    badge: 'HOT ★ NEW',
    heat: 4,
    grain: true,
    vignette: true,
    selected: 0,
    panels: blankPanels(),
    photos: [],
  };
}

export const state = defaultState();

// ---- undo / redo -----------------------------------------------------------
const undoStack = [];
const redoStack = [];

function snapshot() {
  return JSON.stringify({
    layout: state.layout,
    grade: state.grade,
    title: state.title,
    subtitle: state.subtitle,
    badge: state.badge,
    heat: state.heat,
    grain: state.grain,
    vignette: state.vignette,
    panels: state.panels,
  });
}

function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack.length = 0;
}

function applySnapshot(json) {
  const s = JSON.parse(json);
  Object.assign(state, s);
  syncControls();
  render();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  applySnapshot(undoStack.pop());
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  applySnapshot(redoStack.pop());
}

// ---- rendering -------------------------------------------------------------
function previewSize() {
  // Keep the preview near the export aspect of the current layout's cover:
  // square for grid layouts, wide for bleed is still square in the editor.
  return { w: 1080, h: 1080 };
}

export function render() {
  const { w, h } = previewSize();
  drawCover(canvas, state, w, h);
  document.querySelectorAll('#thumbRow img').forEach((img, i) => {
    img.classList.toggle('active', state.panels[state.selected]?.photo === i);
  });
  const sel = state.panels[state.selected];
  const zoomInput = document.getElementById('zoomInput');
  if (sel) zoomInput.value = String(sel.zoom || 1);
  const photoSelect = document.getElementById('panelPhoto');
  if (sel) photoSelect.value = String(sel.photo);
}

// ---- images ----------------------------------------------------------------
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load ' + url));
    img.src = url;
  });
}

async function addPhoto(src, label) {
  const img = await loadImage(src);
  state.photos.push(img);
  const idx = state.photos.length - 1;
  const row = document.getElementById('thumbRow');
  const thumb = document.createElement('img');
  thumb.src = src;
  thumb.alt = label;
  thumb.title = label;
  thumb.addEventListener('click', () => assignPhotoToSelected(idx));
  row.appendChild(thumb);
  rebuildPhotoSelect();
  return idx;
}

function rebuildPhotoSelect() {
  const sel = document.getElementById('panelPhoto');
  sel.innerHTML = '';
  const none = document.createElement('option');
  none.value = '-1';
  none.textContent = '— empty —';
  sel.appendChild(none);
  state.photos.forEach((img, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = SAMPLE_PHOTOS[i]?.label || `Upload ${i + 1}`;
    sel.appendChild(opt);
  });
  sel.value = String(state.panels[state.selected]?.photo ?? -1);
}

function assignPhotoToSelected(photoIdx) {
  pushHistory();
  state.panels[state.selected].photo = photoIdx;
  state.panels[state.selected].zoom = 1;
  state.panels[state.selected].ox = 0;
  state.panels[state.selected].oy = 0;
  render();
}

// ---- export ----------------------------------------------------------------
export function exportCover(size) {
  return new Promise((resolve) => {
    const off = document.createElement('canvas');
    drawCover(off, state, size.w, size.h);
    off.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neon-coast-${size.label}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      status.textContent = `Saved neon-coast-${size.label}.png (${blob.size.toLocaleString()} bytes)`;
      resolve(blob);
    }, 'image/png');
  });
}

async function exportAll() {
  for (const size of EXPORT_SIZES) {
    // eslint-disable-next-line no-await-in-loop
    await exportCover(size);
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 250));
  }
  status.textContent = 'All four sizes exported.';
}

// ---- controls --------------------------------------------------------------
function buildButtons(rowId, items, current, onPick) {
  const row = document.getElementById(rowId);
  row.innerHTML = '';
  items.forEach((item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `${item.name}<br><small>${item.hint}</small>`;
    b.classList.toggle('active', item.id === current);
    b.addEventListener('click', () => {
      pushHistory();
      onPick(item.id);
      buildButtons(rowId, items, item.id, onPick);
      render();
    });
    row.appendChild(b);
  });
}

function syncControls() {
  document.getElementById('titleInput').value = state.title;
  document.getElementById('subtitleInput').value = state.subtitle;
  document.getElementById('badgeInput').value = state.badge;
  document.getElementById('heatInput').value = String(state.heat);
  document.getElementById('heatLabel').textContent = '★'.repeat(state.heat) + '☆'.repeat(5 - state.heat);
  document.getElementById('grainToggle').checked = state.grain;
  document.getElementById('vignetteToggle').checked = state.vignette;
  buildButtons('layoutRow', LAYOUTS, state.layout, (id) => { state.layout = id; });
  buildButtons('gradeRow', GRADES, state.grade, (id) => { state.grade = id; });
  rebuildPhotoSelect();
}

function wireControls() {
  document.getElementById('undoBtn').addEventListener('click', undo);
  document.getElementById('redoBtn').addEventListener('click', redo);
  document.getElementById('exportAllBtn').addEventListener('click', exportAll);
  document.querySelectorAll('[data-export]').forEach((b) => {
    b.addEventListener('click', () => {
      const [w, h] = b.dataset.export.split('x').map(Number);
      exportCover({ label: b.dataset.export, w, h });
    });
  });
  document.getElementById('titleInput').addEventListener('input', (e) => {
    state.title = e.target.value;
    render();
  });
  document.getElementById('subtitleInput').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    render();
  });
  document.getElementById('badgeInput').addEventListener('input', (e) => {
    state.badge = e.target.value;
    render();
  });
  document.getElementById('heatInput').addEventListener('input', (e) => {
    state.heat = Number(e.target.value);
    document.getElementById('heatLabel').textContent = '★'.repeat(state.heat) + '☆'.repeat(5 - state.heat);
    render();
  });
  document.getElementById('grainToggle').addEventListener('change', (e) => {
    state.grain = e.target.checked;
    render();
  });
  document.getElementById('vignetteToggle').addEventListener('change', (e) => {
    state.vignette = e.target.checked;
    render();
  });
  document.getElementById('zoomInput').addEventListener('input', (e) => {
    state.panels[state.selected].zoom = Number(e.target.value);
    render();
  });
  document.getElementById('panelPhoto').addEventListener('change', (e) => {
    pushHistory();
    state.panels[state.selected].photo = Number(e.target.value);
    render();
  });
  document.getElementById('fillAllBtn').addEventListener('click', () => {
    pushHistory();
    const photo = state.panels[state.selected].photo;
    state.panels.forEach((p) => { p.photo = photo; });
    render();
    status.textContent = photo >= 0 ? 'Every panel filled with the selected photo.' : 'Panels emptied.';
  });
  document.getElementById('fileInput').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    for (const file of files) {
      // eslint-disable-next-line no-await-in-loop
      await addPhoto(URL.createObjectURL(file), file.name);
    }
    if (files.length) {
      assignPhotoToSelected(state.photos.length - 1);
      status.textContent = `${files.length} photo(s) loaded from your machine.`;
    }
    e.target.value = '';
  });

  // Drag on the preview to pan the photo inside the panel under the pointer.
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rects = panelRects(state, 1, 1);
    const hit = rects.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
    if (hit < 0) return;
    pushHistory();
    state.selected = hit;
    drag = { panel: hit, lastX: e.clientX, lastY: e.clientY };
    canvas.setPointerCapture(e.pointerId);
    render();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    const panel = state.panels[drag.panel];
    panel.ox += (e.clientX - drag.lastX) / rect.width;
    panel.oy += (e.clientY - drag.lastY) / rect.height;
    panel.ox = Math.max(-1, Math.min(1, panel.ox));
    panel.oy = Math.max(-1, Math.min(1, panel.oy));
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;
    render();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
}

// ---- boot ------------------------------------------------------------------
async function boot() {
  wireControls();
  syncControls();
  for (const sample of SAMPLE_PHOTOS) {
    // eslint-disable-next-line no-await-in-loop
    await addPhoto(sample.src, sample.label);
  }
  // Default scene: the first photo fills every panel.
  state.panels.forEach((p) => { p.photo = 0; });
  render();

  const params = new URLSearchParams(location.search);
  if (params.get('shot')) {
    await runShot(params, state, { render, syncControls, assignPhotoToSelected, exportCover });
  }
}

boot().catch((err) => {
  status.textContent = 'Could not start: ' + err.message;
});
