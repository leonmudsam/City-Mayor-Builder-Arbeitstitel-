# 3D-Prompts — Effekte

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Zielordner: `src/assets/models/effects/`. Jeder Block ist copy-paste-fertig (Stil-Prefix + Motiv). **Technik (Pflicht):** `.glb`, Texturen eingebettet, keine Lichter/Kameras, +Y oben, Front +Z, Pivot mittig an der Unterkante, 1 Tile = 1 Welt-Einheit. Stil-Details & Budgets: `docs/3D_WORLD_ASSETS.md`.

Feste Effekt-Meshes als `.glb` (vieles läuft bereits als Partikel/Shader). Halb-transparente, weiche Formen.

## Aktiv genutzt

### `smoke_chimney.glb` — klein

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small soft stylized smoke/steam puff mesh for a chimney, light grey, semi-transparent look
```

## Geplant

Bewegtes Wasser, Gischt, Wind-Sway etc. sind als Partikel/Shader sinnvoller als `.glb` (siehe 3D_WORLD_ASSETS §17).

### `upgrade_glow.glb` — klein

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a soft golden glow/sparkle burst mesh to play when a building is upgraded
```

### `building_complete_effect.glb` — klein

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small celebratory confetti/spark ring mesh for when construction completes
```
