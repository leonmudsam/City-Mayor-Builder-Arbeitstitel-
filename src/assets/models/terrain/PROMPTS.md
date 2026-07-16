# 3D-Prompts — Terrain & Gebirge

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Zielordner: `src/assets/models/terrain/`. Jeder Block ist copy-paste-fertig (Stil-Prefix + Motiv). **Technik (Pflicht):** `.glb`, Texturen eingebettet, keine Lichter/Kameras, +Y oben, Front +Z, Pivot mittig an der Unterkante, 1 Tile = 1 Welt-Einheit. Stil-Details & Budgets: `docs/3D_WORLD_ASSETS.md`.

Bodenkacheln (1×1, kachelbar) und Gebirgs-/Hero-Formen. **Der Boden ist ein organisches Höhenfeld** — Hügel/Gebirge sind geneigt, Wasser abgesenkt; Kachel-/Fels-/Gipfel-Modelle werden automatisch auf die Bodenhöhe gesetzt. Deshalb **Pivot unten-mittig, flache Unterseite, nichts schwebt**; Gebirge groß & sauber (klare Felsflächen, keine losen Teile). Maßstab 1 Kachel ≈ 4 m · Pivot unten-mittig, nichts schwebt · Höhen-Richtwerte: Baum ≈ 1.4–1.8, Strauch ≈ 0.5, Bank ≈ 0.4, Laterne ≈ 0.9, Fels ≈ 0.4–1.0, Brunnen ≈ 0.9 (Kacheln).

## Aktiv genutzt (Kacheln je Terraintyp)

### `grass_tile.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a flat green grass meadow tile, subtle micro-detail, tileable edges
```

### `forest_ground_tile.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a forest floor tile with moss, roots and a few leaves, tileable
```

### `ocean_tile.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a calm sea water tile with a gentle stylized wave, deep blue, tileable
```

### `river_straight.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a straight flowing blue river water tile, gentle current, tileable along its axis
```

### `mountain_ground_tile.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a steep grey rocky mountain ground tile, tileable
```

### `sand_tile.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a light sandy beach tile, tileable
```

### `fertile_ground_tile.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a ploughed fertile farmland soil tile with brown furrows, tileable
```

### `mountain_peak_medium.glb` — 1–2 tiles

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a stylized rocky mountain peak / large boulder cluster, layered rock, no snow
```

## Geplant (Wasser, Gebirge, Klippen, Hero)

Noch nicht verdrahtet, aber vom Weltbild vorgesehen (siehe docs/3D_WORLD_ASSETS.md §7–§10).

### `grass_tile_variant_01.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a grass tile variant with tufts and small stones, tileable
```

### `shore_tile.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a shoreline tile where grass meets water, tileable
```

### `river_curve.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a curved river water tile connecting two adjacent edges, tileable
```

### `lake_center.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a calm lake water tile, still deep-blue surface, tileable
```

### `coast_rocky.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a rocky coastline tile where land meets sea, tileable
```

### `waterfall_large.glb` — 4×4–8×8

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a tall cascading waterfall over rocky cliffs into a pool, stylized foam at the base
```

### `mountain_wall_straight.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a straight steep mountain wall segment, layered rock, tileable side to side
```

### `mountain_valley_pass.glb` — 3×3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a mountain valley pass: two rock walls with a passable corridor between them
```

### `cliff_edge.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a cliff edge tile: flat top dropping to a rocky face, tileable
```

### `hill_small.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small rounded grassy hill mound with a gentle slope, blends into flat ground at its base
```

### `boulder_cluster.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a cluster of stylized grey boulders of varied size sitting on the ground, low-poly
```

### `rock_outcrop.glb` — 1–2 tiles

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a rocky outcrop rising from the ground, layered stone, flat base
```

### `mountain_peak_large.glb` — 3×3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a large stylized rocky mountain peak with steep faces and a broad flat base, no snow
```

### `hero_mountain_range_west.glb` — 8×8–12×12, modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a large stylized rocky mountain range with steep cliffs, a valley pass and a tunnel entrance, layered peaks, no snow
```

### `hero_harbor_bay.glb` — 6×6, modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a coastal harbor bay with wooden piers, small docks and calm water, rocky shoreline
```
