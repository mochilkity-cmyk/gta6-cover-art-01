// Sunset / neon colour grades for Neon Coast Cover Studio.
// Each grade pairs a canvas filter (applied when the photo is drawn) with a
// coloured wash drawn over the panel, so every photo gets the same
// Vice City sunset treatment no matter where it came from.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Vice Sunset',
    hint: 'orange · pink',
    filter: 'saturate(1.35) contrast(1.08) brightness(1.03)',
    // top colour -> bottom colour, drawn as a vertical wash over the photo
    wash: ['rgba(255,122,24,0.16)', 'rgba(255,46,136,0.22)'],
    blend: 'overlay',
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    hint: 'pink · teal',
    filter: 'saturate(1.65) contrast(1.12) hue-rotate(-12deg)',
    wash: ['rgba(255,46,136,0.26)', 'rgba(0,229,255,0.20)'],
    blend: 'overlay',
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    hint: 'honey · amber',
    filter: 'saturate(1.25) contrast(1.05) sepia(0.22) brightness(1.05)',
    wash: ['rgba(255,190,60,0.20)', 'rgba(255,110,20,0.14)'],
    blend: 'soft-light',
  },
  {
    id: 'dusk',
    name: 'Magenta Dusk',
    hint: 'violet · magenta',
    filter: 'saturate(1.5) contrast(1.1) hue-rotate(18deg) brightness(0.97)',
    wash: ['rgba(150,40,255,0.24)', 'rgba(255,46,136,0.20)'],
    blend: 'overlay',
  },
  {
    id: 'noir',
    name: 'Mono Noir',
    hint: 'black · white',
    filter: 'grayscale(1) contrast(1.25) brightness(1.04)',
    wash: ['rgba(255,255,255,0.06)', 'rgba(0,0,0,0.18)'],
    blend: 'soft-light',
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}
