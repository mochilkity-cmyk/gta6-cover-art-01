# Neon Coast Cover Studio

![make.fun bounty](https://make.fun/badge/gta6-cover-art-01.svg)
![rank](https://make.fun/badge/gta6-cover-art-01/mochilkity-cmyk/gta6-cover-art-01/rank.svg)
![reward](https://make.fun/badge/gta6-cover-art-01/mochilkity-cmyk/gta6-cover-art-01/reward.svg)

Turn your own photos into GTA-style multi-panel poster cover art — in the
browser, offline, in a few clicks. Upload one photo or several, crop and
position each panel by dragging, pick a layout and a Vice City sunset grade,
write your caption, and export a PNG ready to post.

## What it does

- **6 layouts** — nine-panel grid, hero + three, full bleed, four-panel grid,
  six-panel strip, tilted snapshots.
- **5 grades** — Vice Sunset, Neon Nights, Golden Hour, Magenta Dusk, Mono Noir
  (gradient-map sunset/neon colour grades applied on canvas).
- **Caption editing** — big title in sunset-gradient lettering (Anton), neon
  script subtitle (Pacifico), badge ribbon, 5-star heat meter, halftone
  title block.
- **Any photo** — upload photos from your machine (they never leave it), or
  use the five included sample photos. Per-panel crop: drag to pan, zoom
  slider, fill every panel with one photo or mix several.
- **Fast export** — one-click PNG in 1080×1080, 1080×1350, 1920×1080 and
  1080×1920 (story), or export all four at once.
- **Polish** — film grain + vignette toggles, undo/redo, live preview.

## How to run

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: every script, font and sample photo is a file
under `app/`. Fonts are Anton and Pacifico under the SIL Open Font License
(see `app/fonts/`). All artwork and lettering is original — no Rockstar
logos, artwork or fonts.

## Entry

`main.ts` copies `app/` and `screenshots/` to `/output` and writes
`/output/dossier.json` (see `MAKEFUN_OUTPUT_DIR=out node main.ts`).
