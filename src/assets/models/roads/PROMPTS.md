# 3D-Prompts — Straßen

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Zielordner: `src/assets/models/roads/`. Jeder Block ist copy-paste-fertig (Stil-Prefix + Motiv) und trägt darunter die volle Spezifikation (Größenklasse/Budget, Höhe, Pivot, Front, Platzierung, Biom, Animationen). **Technik (Pflicht):** `.glb`, Texturen eingebettet, keine Lichter/Kameras, +Y oben, Front +Z, Pivot mittig an der Unterkante, 1 Tile = 1 Welt-Einheit. Stil-Details & Budgets: `docs/3D_WORLD_ASSETS.md`.

Modulare Details für das automatische Straßensystem. Die Modelle überlagern die nahtlose prozedurale Fahrbahn und müssen deshalb kachelbar, flach und aus einem Mesh bestehen.

## Aktiv genutzt

Near-LOD, pro Variante instanziert; Pivot unten-mittig, Front +Z.

### `road_flat.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a seamless flat stylized road detail tile with warm asphalt and stone shoulders
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · platzierbar auf: ebene Straße · Instancing: ja · **live** (bereits verdrahtet)

### `road_slope.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a sloped road detail tile with compacted embankment edges
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · platzierbar auf: sanfter Hang · Instancing: ja · **live** (bereits verdrahtet)

### `road_support.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a road edge kit with a warm stone retaining wall and buttresses
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · platzierbar auf: Hang/Stützung · Instancing: ja · **live** (bereits verdrahtet)

### `road_viaduct.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a modular stone viaduct deck detail with a shallow arch silhouette
```

**Spec:** Größenklasse `bridge` — Brücke (1 500–4 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · platzierbar auf: Schlucht/Klippe · Instancing: ja · **live** (bereits verdrahtet)

### `road_hairpin_curve.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a compact U-shaped mountain hairpin road detail with inner retaining wall
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · platzierbar auf: Pass-Kehre · Instancing: ja · **live** (bereits verdrahtet)

### `road_coast.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a coastal road detail tile with a low seawall and drainage edge
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · platzierbar auf: Küste/Ufer · Instancing: ja · **live** (bereits verdrahtet)
