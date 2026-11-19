# Cover Coast — GTA 6 Cover Art Studio

[![make.fun bounty](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/zesty-pika-87/gta6-cover-art-01-v8/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/zesty-pika-87/gta6-cover-art-01-v8/reward.svg)](https://make.fun/c/gta6-cover-art-01)

Make a GTA 6-style cover poster in your browser — no account, no upload, no
network. Pick a collage layout, drop in photos, grade them, set giant
lettering, and export a print-ready PNG.

## What it does

- **9 layouts** — Full Bleed, Four Panel, Hero + Three, Hero + Four (hero
  photo left, four panels right), Nine Panel, Mosaic, Tilted Snapshots,
  Story Stack, Poster Strip. Default on open: **Hero + Four** with the
  boulevard photo as hero, so the first screen already looks like a cover.
- **6 photos** — 2 kit photos (boulevard, pier) + 4 textured procedural
  photos generated for this entry (sunset skyline, neon street, ocean
  speedboat, palm road). Click a photo, then a panel, to place it. Drag a
  panel to pan, scroll to zoom, shuffle, or upload your own photo (local
  only, never leaves your browser).
- **7 colour grades, pixel-mapped** — Vice Sunset, Neon Nights, Palm Dusk,
  Magenta Heat, Teal Noir, Golden Hour, Ink Poster (posterize + heavy
  halftone). Each grade is a per-channel shadow-lift / highlight-gain map,
  so it stays visible even on dark photos, with a strength slider.
  Skin-safe: midtone skin is protected from going orange.
- **Lettering** — giant Anton title with gradient fill, thick black outline
  and offset shadow; Pacifico script subtitle overlapping the title edge;
  tilted ribbon badge, 5-star meter, per-panel caption chips
  (place + time + tagline, all editable), bottom tagline strip, and a
  title position switch (over / top / bottom) with a dark scrim behind the
  title so it never fights a face.
- **Deterministic effects** — seeded film grain, vignette, halftone dots
  (on by default, in the sky), soft sunburst rays. Preview and export use
  the same renderer, so the PNG is exactly what you saw.
- **5 one-click presets** — Vice Sunset Hero, Neon Nights Nine,
  Palm Dusk Strip, Ink Heatwave, Golden Getaway.
- **Export PNG in 4 sizes** — Square 1080×1080, Portrait 1080×1350,
  Landscape 1920×1080, Story 1080×1920 — one by one, or all four in one
  ZIP (with a one-by-one fallback). File names come from your title.
- **Undo / redo** — 60 steps, buttons + Ctrl+Z / Ctrl+Y.
- **Offline** — Anton + Pacifico are vendored under `app/fonts/`
  (SIL OFL, see `OFL-Anton.txt` / `OFL-Pacifico.txt`). The app makes no
  network request at all.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## Submit locally (what the grader runs)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# writes out/app/, out/screenshots/ and out/dossier.json
```

## Screenshots

`shots.json` lists the four scenes (`?shot=cover`, `?shot=editor`,
`?shot=grid`, `?shot=story`). `screenshots/1-cover.jpg` is the cover.

## License

SPDX-License-Identifier: MIT — see `LICENSE`.
