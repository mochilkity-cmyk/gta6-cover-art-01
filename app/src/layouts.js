// Multi-panel cover layouts for Neon Coast Cover Studio.
// Every layout returns panel rectangles in unit space (0..1 across the
// cover), plus where the title block sits. The renderer scales them to the
// export size, so one layout works for square, portrait and wide covers.

function gridRects(cols, rows, top, gap) {
  const rects = [];
  const cw = (1 - gap * (cols + 1)) / cols;
  const ch = (top - gap * (rows + 1)) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rects.push({
        x: gap + c * (cw + gap),
        y: gap + r * (ch + gap),
        w: cw,
        h: ch,
        rot: 0,
      });
    }
  }
  return rects;
}

export const LAYOUTS = [
  {
    id: 'nine',
    name: 'Nine-Panel Grid',
    hint: '3 × 3 poster grid',
    titleTop: 0.78,
    panels(w, h) {
      return gridRects(3, 3, 0.78, 0.012);
    },
  },
  {
    id: 'hero',
    name: 'Hero + Three',
    hint: 'big hero, 3 stacked',
    titleTop: 0.78,
    panels(w, h) {
      const g = 0.012;
      const top = 0.78;
      return [
        { x: g, y: g, w: 0.62 - g * 1.5, h: top - g * 2, rot: 0 },
        { x: 0.62, y: g, w: 0.38 - g, h: (top - g * 4) / 3, rot: 0 },
        { x: 0.62, y: g * 2 + (top - g * 4) / 3, w: 0.38 - g, h: (top - g * 4) / 3, rot: 0 },
        { x: 0.62, y: g * 3 + 2 * (top - g * 4) / 3, w: 0.38 - g, h: (top - g * 4) / 3, rot: 0 },
      ];
    },
  },
  {
    id: 'bleed',
    name: 'Full Bleed',
    hint: 'one photo, edge to edge',
    titleTop: 0.72,
    panels(w, h) {
      return [{ x: 0, y: 0, w: 1, h: 1, rot: 0 }];
    },
  },
  {
    id: 'four',
    name: 'Four-Panel Grid',
    hint: '2 × 2 comic grid',
    titleTop: 0.78,
    panels(w, h) {
      return gridRects(2, 2, 0.78, 0.012);
    },
  },
  {
    id: 'six',
    name: 'Six-Panel Strip',
    hint: '3 × 2 film strip',
    titleTop: 0.78,
    panels(w, h) {
      return gridRects(3, 2, 0.78, 0.012);
    },
  },
  {
    id: 'tilted',
    name: 'Tilted Snapshots',
    hint: 'polaroid pile, rotated',
    titleTop: 0.74,
    panels(w, h) {
      return [
        { x: 0.05, y: 0.04, w: 0.42, h: 0.62, rot: -0.07 },
        { x: 0.50, y: 0.02, w: 0.44, h: 0.58, rot: 0.06 },
        { x: 0.27, y: 0.34, w: 0.46, h: 0.40, rot: -0.02 },
      ];
    },
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}
