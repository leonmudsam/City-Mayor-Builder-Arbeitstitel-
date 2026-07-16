# 3D-Prompts — Terrain & Gebirge

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Zielordner: `src/assets/models/terrain/`. Jeder Block ist copy-paste-fertig (Stil-Prefix + Motiv) und trägt darunter die volle Spezifikation (Größenklasse/Budget, Höhe, Pivot, Front, Platzierung, Biom, Animationen). **Technik (Pflicht):** `.glb`, Texturen eingebettet, keine Lichter/Kameras, +Y oben, Front +Z, Pivot mittig an der Unterkante, 1 Tile = 1 Welt-Einheit. Stil-Details & Budgets: `docs/3D_WORLD_ASSETS.md`.

Bodenkacheln (1×1, kachelbar) und Gebirgs-/Hero-Formen. **Der Boden ist ein organisches Höhenfeld** — Hügel/Gebirge sind geneigt, Wasser abgesenkt; Kachel-/Fels-/Gipfel-Modelle werden automatisch auf die Bodenhöhe gesetzt (reiten das Höhenfeld). Deshalb **Pivot unten-mittig, flache Unterseite, nichts schwebt**; Gebirge groß & sauber (klare Felsflächen, keine losen Teile). Maßstab 1 Kachel ≈ 4 m · Pivot unten-mittig, nichts schwebt · Höhen-Richtwerte: Baum ≈ 1.4–1.8, Strauch ≈ 0.5, Bank ≈ 0.4, Laterne ≈ 0.9, Fels ≈ 0.4–1.0, Brunnen ≈ 0.9 (Kacheln).

## Aktiv genutzt (Kacheln je Terraintyp)

### `grass_tile.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a flat green grass meadow tile, subtle micro-detail, tileable edges
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Grasland · platzierbar auf: grass · Instancing: ja · **live** (bereits verdrahtet)

### `forest_ground_tile.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a forest floor tile with moss, roots and a few leaves, tileable
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Mischwald · platzierbar auf: forest · Instancing: ja · **live** (bereits verdrahtet)

### `ocean_tile.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a calm sea water tile with a gentle stylized wave, deep blue, tileable
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Meer · platzierbar auf: water · Instancing: ja · **live** (bereits verdrahtet)

### `river_straight.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a straight flowing blue river water tile, gentle current, tileable along its axis
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Fluss · platzierbar auf: river · Instancing: ja · **live** (bereits verdrahtet)

### `mountain_ground_tile.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a steep grey rocky mountain ground tile, tileable
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge · platzierbar auf: mountain · Instancing: ja · **live** (bereits verdrahtet)

### `sand_tile.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a light sandy beach tile, tileable
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Strand/Küste · platzierbar auf: sand · Instancing: ja · **live** (bereits verdrahtet)

### `fertile_ground_tile.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a ploughed fertile farmland soil tile with brown furrows, tileable
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Fruchtbares Land · platzierbar auf: fertile · Instancing: ja · **live** (bereits verdrahtet)

### `mountain_peak_medium.glb` — 1–2 Kacheln

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a stylized rocky mountain peak / large boulder cluster, layered rock, no snow
```

**Spec:** Größenklasse `terrain_feature` — Terrain-Feature (800–3 000 Tris, ≤ 512², 1–2 Materialien) · Höhe ≈2–3 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge · platzierbar auf: mountain · Zufallsrotation + leichte Zufallsskalierung · Instancing: ja · Spawn: ~⅓ der Gebirgs-Kacheln, zufällig gestreut · **live** (bereits verdrahtet)

## Geplant — Gebirge (schroffe Felsen statt runder Blöcke)

Bilden zusammen ein zerklüftetes Gebirge mit Tälern/Pässen statt flacher grauer Blöcke (siehe World-Graphics-V2 §2).

### `mountain_wall_straight.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a straight steep mountain wall segment, layered rock, tileable side to side
```

**Spec:** Größenklasse `terrain_feature` — Terrain-Feature (800–3 000 Tris, ≤ 512², 1–2 Materialien) · Höhe ≈3–5 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge · platzierbar auf: mountain, Gebirgsrand · nie auf: Straße, Bauplatz · Instancing: nein · *geplant* (noch nicht verdrahtet)

### `mountain_wall_corner.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a 90° corner mountain wall segment, layered rock, connects two straight wall pieces
```

**Spec:** Größenklasse `terrain_feature` — Terrain-Feature (800–3 000 Tris, ≤ 512², 1–2 Materialien) · Höhe ≈3–5 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge · platzierbar auf: Gebirgsrand-Ecke · Instancing: nein · *geplant* (noch nicht verdrahtet)

### `mountain_valley_pass.glb` — 3×3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a mountain valley pass: two rock walls with a passable corridor between them
```

**Spec:** Größenklasse `terrain_feature` — Terrain-Feature (800–3 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge · platzierbar auf: zwischen zwei Gebirgswänden, an Straße/Serpentine · Instancing: nein · *geplant* (noch nicht verdrahtet)

### `mountain_tunnel_entrance.glb` — 2×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a mountain tunnel entrance carved into rock, with a portal frame and rail-free road opening
```

**Spec:** Größenklasse `terrain_feature` — Terrain-Feature (800–3 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge · platzierbar auf: Gebirgswand, an Straße · Instancing: nein · Animations-Node: `reserved: light_window (Tunnellicht)` · *geplant* (noch nicht verdrahtet)

### `rock_spire.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a tall narrow stylized rock spire / pinnacle rising from rugged mountain terrain
```

**Spec:** Größenklasse `terrain_feature` — Terrain-Feature (800–3 000 Tris, ≤ 512², 1–2 Materialien) · Höhe ≈2.5–4 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge · platzierbar auf: mountain · nie auf: Straße, Bauplatz · Zufallsrotation · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `mountain_peak_large.glb` — 3×3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a large stylized rocky mountain peak with steep faces and a broad flat base, no snow
```

**Spec:** Größenklasse `terrain_feature` — Terrain-Feature (800–3 000 Tris, ≤ 512², 1–2 Materialien) · Höhe ≈4–6 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge · platzierbar auf: mountain, zentral im Gebirgscluster · Instancing: nein · *geplant* (noch nicht verdrahtet)

## Geplant — Gebirgsflüsse (Quelle → Schlucht → Mündung)

Flüsse entspringen im Gebirge, graben sich ein und münden ins Meer/den See (World-Graphics-V2 §3).

### `river_source.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small mountain spring where a river originates from rock, trickling water, mossy stones
```

**Spec:** Größenklasse `terrain_feature` — Terrain-Feature (800–3 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge/Fluss-Ursprung · platzierbar auf: am Fuß einer Gebirgswand, Anfang eines Flusslaufs · Instancing: nein · Effekt-Node/-Anschluss: `water_surface_motion_effect (Partikel)` · *geplant* (noch nicht verdrahtet)

### `river_curve.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a curved river water tile connecting two adjacent edges, tileable
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Fluss · platzierbar auf: river (Kurven-Nachbarmaske) · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `river_fork.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a river fork/confluence water tile where two branches join, tileable
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Fluss · platzierbar auf: river (Verzweigung/Zusammenfluss) · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `river_mouth.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a river mouth tile where fresh water widens and meets the sea, sandbanks, tileable edges
```

**Spec:** Größenklasse `terrain_feature` — Terrain-Feature (800–3 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Flussmündung/Küste · platzierbar auf: Übergang Fluss → Meer/See · Instancing: nein · *geplant* (noch nicht verdrahtet)

### `waterfall_small.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small waterfall cascading over a short rocky drop into a stream, light foam at the base
```

**Spec:** Größenklasse `terrain_feature` — Terrain-Feature (800–3 000 Tris, ≤ 512², 1–2 Materialien) · Höhe ≈2–3 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirgsfluss · platzierbar auf: Geländestufe zwischen zwei Flusshöhen · Instancing: nein · Effekt-Node/-Anschluss: `waterfall_mist (Gischt-Partikel)` · *geplant* (noch nicht verdrahtet)

### `waterfall_large.glb` — 4×4–8×8

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a tall cascading waterfall over rocky cliffs into a pool, stylized foam at the base
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge · platzierbar auf: große Geländestufe im Hero-Gebirge · Instancing: nein · Effekt-Node/-Anschluss: `waterfall_mist (Gischt-Partikel)` · Spawn: ein bis zwei Exemplare, handplatziert · *geplant* (noch nicht verdrahtet)

### `lake_center.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a calm lake water tile, still deep-blue surface, tileable
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: See · platzierbar auf: in einer Geländesenke · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `lake_edge.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a lake shoreline tile blending calm water into a sandy or grassy edge, tileable
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: See-Ufer · platzierbar auf: Übergang See → Ufer · Instancing: ja · *geplant* (noch nicht verdrahtet)

## Geplant — Küste & Klippen

Meer wird Küstenlinie statt Fläche: Strand, Klippen, Brandung (World-Graphics-V2 §4).

### `grass_tile_variant_01.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a grass tile variant with tufts and small stones, tileable
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Grasland · platzierbar auf: grass · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `shore_tile.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a shoreline tile where grass meets water, tileable
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Ufer · platzierbar auf: Übergang Gras → Wasser · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `coast_rocky.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a rocky coastline tile where land meets sea, tileable
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Felsküste · platzierbar auf: Übergang Land → Meer an Klippen · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `coast_sandy.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a sandy coastline tile with light surf foam where the beach meets the sea, tileable
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Sandküste · platzierbar auf: Übergang Land → Meer am Strand · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `cliff_edge.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a cliff edge tile: flat top dropping to a rocky face, tileable
```

**Spec:** Größenklasse `terrain_feature` — Terrain-Feature (800–3 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Küstenklippe, Hochplateau · platzierbar auf: Geländestufe/Kante · Instancing: nein · *geplant* (noch nicht verdrahtet)

### `cliff_corner.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a cliff corner tile turning the cliff edge 90°, tileable with cliff_edge
```

**Spec:** Größenklasse `terrain_feature` — Terrain-Feature (800–3 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Küstenklippe, Hochplateau · platzierbar auf: Ecke einer Klippenkante · Instancing: nein · *geplant* (noch nicht verdrahtet)

### `hero_coastal_cliff.glb` — 6×6, modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a hero coastal cliff formation with crashing waves, seabirds and a narrow cliffside path
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Küste · Spawn: ein Exemplar, handplatziert an der Küstenzone · *geplant* (noch nicht verdrahtet)

### `hero_harbor_bay.glb` — 6×6, modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a coastal harbor bay with wooden piers, small docks and calm water, rocky shoreline
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Küste, Bucht · Spawn: ein Exemplar, handplatziert · *geplant* (noch nicht verdrahtet)

## Geplant — Hügel, Ebenen & weitere Hero-Weltformen

Große, prägende Weltformen für Orientierung; handplatziert pro Zone, nicht zufallsgestreut.

### `hill_small.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small rounded grassy hill mound with a gentle slope, blends into flat ground at its base
```

**Spec:** Größenklasse `terrain_feature` — Terrain-Feature (800–3 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Grasland-Hügelland · platzierbar auf: Übergangszone Ebene → Gebirge · Instancing: nein · *geplant* (noch nicht verdrahtet)

### `boulder_cluster.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a cluster of stylized grey boulders of varied size sitting on the ground, low-poly
```

**Spec:** Größenklasse `prop_large` — großes Prop / Setpiece (500–1 500 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge, Fels, Küste · platzierbar auf: mountain, sand, Felsrand · nie auf: Straße, Gebäude · Zufallsrotation + Zufallsskalierung · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `rock_outcrop.glb` — 1–2 Kacheln

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a rocky outcrop rising from the ground, layered stone, flat base
```

**Spec:** Größenklasse `terrain_feature` — Terrain-Feature (800–3 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge, Grasland-Übergang · platzierbar auf: mountain-nahe Kacheln · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `hero_mountain_range_west.glb` — 8×8–12×12, modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a large stylized rocky mountain range with steep cliffs, a valley pass and a tunnel entrance, layered peaks, no snow
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge · Spawn: ein Exemplar, bildet den Gebirgszug einer Kartenseite · *geplant* (noch nicht verdrahtet)

### `hero_river_valley.glb` — 6×6, modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a hero river valley: a carved river gorge with a stream, footbridge and terraced banks
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Fluss/Tal · Spawn: ein Exemplar, entlang des Hauptflusslaufs · *geplant* (noch nicht verdrahtet)

### `hero_lake_basin.glb` — 6×6, modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a hero lake basin: a calm lake surrounded by reeds, rocks and a small shoreline path
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: See · Spawn: ein Exemplar, in einer Geländesenke · *geplant* (noch nicht verdrahtet)

### `hero_forest_ridge.glb` — 6×6, modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a hero forest ridge: a densely wooded hilltop ridge with a scenic overlook clearing
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Mischwald · Spawn: ein Exemplar, auf einem Höhenzug · *geplant* (noch nicht verdrahtet)

### `hero_fertile_valley.glb` — 6×6, modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a hero fertile valley: patchwork farm fields with hedgerows, a windmill and a dirt path
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Fruchtbares Land · Spawn: ein Exemplar, in der Farmregion · *geplant* (noch nicht verdrahtet)

### `hero_dam_site.glb` — 8×4, modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a hero dam site: a concrete dam across a narrow valley with a reservoir and a spillway
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Fluss/Tal · platzierbar auf: spannt Flusstal · *geplant* (noch nicht verdrahtet)

### `hero_ruins_ancient.glb` — 4×4, modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a hero ancient ruin: crumbling stone walls, broken columns and overgrown vines on a grassy mound
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Grasland, Wald · Spawn: ein Exemplar, versteckt abseits der Stadt · *geplant* (noch nicht verdrahtet)

### `hero_cave_system.glb` — 4×4, modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a hero cave system entrance: a large dark cave mouth in a rock face with stalactite details and a path leading in
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge · platzierbar auf: Gebirgswand · *geplant* (noch nicht verdrahtet)

### `hero_island_offshore.glb` — 4×4, modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a hero small offshore island with a few trees, rocks and a sandy beach, surrounded by sea
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Meer · platzierbar auf: im Meer, sichtbar vom Festland · *geplant* (noch nicht verdrahtet)
