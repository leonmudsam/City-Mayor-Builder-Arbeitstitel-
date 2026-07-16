# 3D-Prompts — Marker (schwebende Statusanzeigen)

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Zielordner: `src/assets/models/markers/`. Jeder Block ist copy-paste-fertig (Stil-Prefix + Motiv). **Technik (Pflicht):** `.glb`, Texturen eingebettet, keine Lichter/Kameras, +Y oben, Front +Z, Pivot mittig an der Unterkante, 1 Tile = 1 Welt-Einheit. Stil-Details & Budgets: `docs/3D_WORLD_ASSETS.md`.

Schweben über Gebäuden, kippen mit der Welt und rotieren. Klar von jeder Seite lesbar, kräftige Farbe.

## Aktiv genutzt

### `marker_task.glb` — ~1 tile hoch

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a floating quest/task marker: a rounded teal pin with a clean icon, readable from any angle
```

### `marker_construction.glb` — ~1 tile hoch

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a floating construction marker: a yellow pin with a wrench or hard-hat icon
```

### `marker_problem.glb` — ~1 tile hoch

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a floating problem marker: a red pin with a white exclamation mark
```

### `marker_upgrade.glb` — ~1 tile hoch

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a floating upgrade marker: a green pin with a white up-arrow
```

## Geplant (weitere Zustände & Sektoren)

### `marker_water.glb` — ~1 tile hoch

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a floating blue water marker: a droplet icon pin
```

### `marker_trade.glb` — ~1 tile hoch

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a floating orange trade marker: a coins/handshake icon pin
```

### `marker_resource.glb` — ~1 tile hoch

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a floating resource marker: a crate/ore icon pin
```

### `sector_marker_build.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a buildable-zone marker: a green dashed frame with a small tool icon on the ground
```
