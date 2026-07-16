# 3D-Prompts — Props & Vegetation

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Zielordner: `src/assets/models/props/`. Jeder Block ist copy-paste-fertig (Stil-Prefix + Motiv). **Technik (Pflicht):** `.glb`, Texturen eingebettet, keine Lichter/Kameras, +Y oben, Front +Z, Pivot mittig an der Unterkante, 1 Tile = 1 Welt-Einheit. Stil-Details & Budgets: `docs/3D_WORLD_ASSETS.md`.

Kleine Welt-Objekte. Vegetation wird instanziert & gegen die Stadt gecullt; Baustellen-Props liegen über Bau/Upgrade. **Proportionen einhalten** — eine Parkbank darf NICHT so groß wie ein Baum sein. Maßstab 1 Kachel ≈ 4 m · Pivot unten-mittig, nichts schwebt · Höhen-Richtwerte: Baum ≈ 1.4–1.8, Strauch ≈ 0.5, Bank ≈ 0.4, Laterne ≈ 0.9, Fels ≈ 0.4–1.0, Brunnen ≈ 0.9 (Kacheln).

## Aktiv genutzt

### `pine_tree.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a single stylized low-poly pine tree, slightly irregular
```

### `bush_small.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small round low-poly bush
```

### `construction_site.glb` — 1–3 tiles

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a construction site prop: scaffolding, a small crane and barriers with warning stripes, to sit over a building under construction
```

## Geplant (Natur, Stadt, Hafen, Farm)

Siehe docs/3D_WORLD_ASSETS.md §11/§14.

### `tree_deciduous.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a single stylized low-poly broadleaf/deciduous tree with a round crown, about 1.5 tiles tall
```

### `tree_pine_large.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a tall stylized pine tree, about 1.8 tiles tall, slim conical crown
```

### `hedge.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a low trimmed green hedge segment, about 0.5 tiles tall, tileable side to side
```

### `reeds_water.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a cluster of tall water reeds/cattails for lake and river shores, low-poly
```

### `rock_small.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small stylized grey rock / few stones on the ground, about 0.4 tiles tall, low-poly
```

### `rock_large.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a large stylized grey boulder, about 1 tile tall, layered stone, low-poly
```

### `rock_medium.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a medium stylized grey boulder / rock cluster, low-poly
```

### `street_lamp.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a stylized street lamp post with a glowing lamp head
```

### `bench.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a simple park bench, low-poly
```

### `market_stall.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a market stall with a striped awning and crates of goods
```

### `boat_small.glb` — 1×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small rowing/fishing boat, front facing +Z, low-poly
```

### `hay_bale.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a round hay bale, low-poly
```

### `tractor_small.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small farm tractor, front facing +Z, low-poly
```
