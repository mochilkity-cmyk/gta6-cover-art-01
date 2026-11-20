// Cover renderer for Neon Coast Cover Studio.
// drawCover paints a whole GTA-style poster cover onto any canvas at any
// size: photo panels with the chosen grade, gutters, a halftone title block
// with sunset-gradient lettering, a neon script subtitle, a badge ribbon and
// a star heat meter, then grain and vignette. Deterministic: the grain uses
// a fixed-seed generator, so the same state always paints the same pixels.

import { gradeById } from './grades.js';
import { layoutById } from './layouts.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function panelRects(state, w, h) {
  const layout = layoutById(state.layout);
  return layout.panels(w, h).map((p) => ({
    x: p.x * w,
    y: p.y * h,
    w: p.w * w,
    h: p.h * h,
    rot: p.rot || 0,
  }));
}

function drawPhotoCover(ctx, img, rect, panel) {
  const zoom = panel.zoom || 1;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (panel.ox || 0) * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + (panel.oy || 0) * rect.h;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function paintPanel(ctx, img, rect, panel, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (img) {
    ctx.filter = grade.filter;
    drawPhotoCover(ctx, img, rect, panel);
    ctx.filter = 'none';
    const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    wash.addColorStop(0, grade.wash[0]);
    wash.addColorStop(1, grade.wash[1]);
    ctx.globalCompositeOperation = grade.blend;
    ctx.fillStyle = wash;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalCompositeOperation = 'source-over';
  } else {
    const bg = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    bg.addColorStop(0, '#3d0f4d');
    bg.addColorStop(1, '#ff2e88');
    ctx.fillStyle = bg;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `700 ${Math.max(14, rect.h * 0.09)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
  }
  ctx.restore();
}

function drawHalftone(ctx, x, y, w, h, dot, color) {
  ctx.save();
  ctx.fillStyle = color;
  const step = dot * 2.4;
  for (let yy = y + step / 2; yy < y + h; yy += step) {
    for (let xx = x + step / 2; xx < x + w; xx += step) {
      ctx.beginPath();
      ctx.arc(xx, yy, dot, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawTitleBlock(ctx, state, w, h) {
  const layout = layoutById(state.layout);
  const top = layout.titleTop * h;
  const bandH = h - top;

  // Title band: deep violet with a halftone strip along its top edge.
  const band = ctx.createLinearGradient(0, top, 0, h);
  band.addColorStop(0, '#1b0b2e');
  band.addColorStop(1, '#0a0414');
  ctx.fillStyle = band;
  ctx.fillRect(0, top, w, bandH);
  drawHalftone(ctx, 0, top, w, Math.min(bandH * 0.22, h * 0.05), Math.max(1.5, w * 0.0022), 'rgba(255,211,25,0.5)');

  const pad = w * 0.03;
  const cx = w / 2;

  // Badge ribbon, tilted, top-right of the band.
  if (state.badge) {
    ctx.save();
    ctx.translate(w - pad - w * 0.085, top + bandH * 0.30);
    ctx.rotate(-0.12);
    ctx.font = `${Math.max(12, bandH * 0.13)}px Anton, system-ui, sans-serif`;
    const bw = Math.min(w * 0.19, ctx.measureText(state.badge.toUpperCase()).width + w * 0.05);
    ctx.fillStyle = '#ff2e88';
    ctx.fillRect(-bw / 2, -bandH * 0.13, bw, bandH * 0.26);
    ctx.strokeStyle = '#ffd319';
    ctx.lineWidth = Math.max(2, w * 0.002);
    ctx.strokeRect(-bw / 2, -bandH * 0.13, bw, bandH * 0.26);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.badge.toUpperCase(), 0, bandH * 0.005);
    ctx.restore();
  }

  // Star heat meter, left of the band.
  const starSize = Math.max(12, bandH * 0.14);
  const stars = '★'.repeat(state.heat) + '☆'.repeat(5 - state.heat);
  ctx.font = `${starSize}px system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd319';
  ctx.fillText(stars, pad, top + bandH * 0.30);

  // Big title with a sunset gradient fill and a dark outline.
  const title = (state.title || 'NEON COAST').toUpperCase();
  const titleSize = Math.min(w * 0.115, bandH * 0.52);
  ctx.font = `${titleSize}px Anton, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const grad = ctx.createLinearGradient(0, top + bandH * 0.30, 0, top + bandH * 0.82);
  grad.addColorStop(0, '#ffd319');
  grad.addColorStop(0.5, '#ff7a18');
  grad.addColorStop(1, '#ff2e88');
  ctx.lineWidth = Math.max(3, titleSize * 0.09);
  ctx.strokeStyle = '#1b0b2e';
  ctx.strokeText(title, cx, top + bandH * 0.56);
  ctx.fillStyle = grad;
  ctx.fillText(title, cx, top + bandH * 0.56);

  // Neon script subtitle underneath, glowing pink.
  if (state.subtitle) {
    ctx.font = `${Math.max(14, bandH * 0.20)}px Pacifico, cursive`;
    ctx.fillStyle = '#7df9ff';
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = Math.max(8, w * 0.012);
    ctx.fillText(state.subtitle, cx, top + bandH * 0.86);
    ctx.shadowBlur = 0;
  }
}

function drawGrain(ctx, w, h) {
  const rand = mulberry32(20261120);
  ctx.save();
  ctx.globalAlpha = 0.035;
  const step = Math.max(4, Math.round(w / 200));
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const v = rand() > 0.5 ? 255 : 0;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, step, step);
    }
  }
  ctx.restore();
}

function drawVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(10,4,20,0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export function drawCover(canvas, state, width, height) {
  const w = width || canvas.width;
  const h = height || canvas.height;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const grade = gradeById(state.grade);
  const layout = layoutById(state.layout);

  // Sunset sky backdrop behind the gutters.
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#2b0a4a');
  sky.addColorStop(0.55, '#ff7a18');
  sky.addColorStop(1, '#ff2e88');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const rects = panelRects(state, w, h);
  rects.forEach((rect, i) => {
    const panel = (state.panels && state.panels[i]) || { photo: -1, zoom: 1, ox: 0, oy: 0 };
    const img = panel.photo >= 0 ? state.photos[panel.photo] : null;
    if (rect.rot) {
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      paintPanel(ctx, img, { x: 0, y: 0, w: rect.w, h: rect.h }, panel, grade);
      ctx.restore();
      // White polaroid border around a tilted snapshot.
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = Math.max(3, w * 0.006);
      ctx.strokeRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
      ctx.restore();
    } else {
      paintPanel(ctx, img, rect, panel, grade);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = Math.max(2, w * 0.004);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
  });

  // Full-bleed covers keep the title over the photo, with a dark scrim.
  if (layout.id === 'bleed') {
    const scrim = ctx.createLinearGradient(0, layout.titleTop * h, 0, h);
    scrim.addColorStop(0, 'rgba(10,4,20,0)');
    scrim.addColorStop(1, 'rgba(10,4,20,0.82)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, layout.titleTop * h, w, h - layout.titleTop * h);
  }
  drawTitleBlock(ctx, state, w, h);

  if (state.grain) drawGrain(ctx, w, h);
  if (state.vignette) drawVignette(ctx, w, h);
  return canvas;
}
