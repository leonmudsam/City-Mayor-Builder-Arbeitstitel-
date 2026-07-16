# 3D-Prompts — Props & Vegetation

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Zielordner: `src/assets/models/props/`. Jeder Block ist copy-paste-fertig (Stil-Prefix + Motiv) und trägt darunter die volle Spezifikation (Größenklasse/Budget, Höhe, Pivot, Front, Platzierung, Biom, Animationen). **Technik (Pflicht):** `.glb`, Texturen eingebettet, keine Lichter/Kameras, +Y oben, Front +Z, Pivot mittig an der Unterkante, 1 Tile = 1 Welt-Einheit. Stil-Details & Budgets: `docs/3D_WORLD_ASSETS.md`.

Kleine Welt-Objekte. Vegetation wird instanziert & gegen die Stadt gecullt; Baustellen-Props liegen über Bau/Upgrade. **Proportionen einhalten** — eine Parkbank darf NICHT so groß wie ein Baum sein. Maßstab 1 Kachel ≈ 4 m · Pivot unten-mittig, nichts schwebt · Höhen-Richtwerte: Baum ≈ 1.4–1.8, Strauch ≈ 0.5, Bank ≈ 0.4, Laterne ≈ 0.9, Fels ≈ 0.4–1.0, Brunnen ≈ 0.9 (Kacheln).

## Aktiv genutzt

### `pine_tree.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a single stylized low-poly pine tree, slightly irregular
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Höhe ≈1.4–1.8 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Wald, Grasland, fruchtbares Land · platzierbar auf: grass, forest, fertile · nie auf: Straße, Gebäude-Footprint, Bauplatz, Wasser, Gebirge · Mindestabstand 0.3–0.5 Kacheln · Zufallsrotation + Zufallsskalierung (±15%) · Instancing: ja · **live** (bereits verdrahtet)

### `bush_small.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small round low-poly bush
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Höhe ≈0.5 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Wald, Grasland · platzierbar auf: grass, forest, fertile · nie auf: Straße, Gebäude-Footprint, Wasser · Instancing: ja · **live** (bereits verdrahtet)

### `construction_site.glb` — 1–3 Kacheln

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a construction site prop: scaffolding, a small crane and barriers with warning stripes, to sit over a building under construction
```

**Spec:** Größenklasse `prop_large` — großes Prop / Setpiece (500–1 500 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: überall (temporär) · platzierbar auf: Gebäude im Bau/Upgrade · Instancing: nein · **live** (bereits verdrahtet)

## Geplant — Natur, Stadt, Hafen, Farm

Siehe docs/3D_WORLD_ASSETS.md §11/§14.

### `tree_deciduous.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a single stylized low-poly broadleaf/deciduous tree with a round crown, about 1.5 tiles tall
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Höhe ≈1.5 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Mischwald, Grasland · platzierbar auf: grass, forest, fertile · nie auf: Straße, Gebäude, Wasser, Gebirge · Mindestabstand 0.3–0.5 Kacheln · Zufallsrotation + Zufallsskalierung · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `tree_pine_large.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a tall stylized pine tree, about 1.8 tiles tall, slim conical crown
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Höhe ≈1.8 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Wald, Gebirgsrand · platzierbar auf: forest, mountain-nahe grass · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `forest_cluster_small.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small cluster of 3–4 mixed trees and undergrowth, forming a natural forest-edge patch
```

**Spec:** Größenklasse `prop_large` — großes Prop / Setpiece (500–1 500 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Waldrand · platzierbar auf: forest-Kante · Instancing: nein · Spawn: am Waldrand für organische Übergänge statt harter Kante · *geplant* (noch nicht verdrahtet)

### `forest_cluster_medium.glb` — 3×3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a medium cluster of 6–8 mixed trees, bushes and fallen logs, forming a natural forest-edge patch
```

**Spec:** Größenklasse `prop_large` — großes Prop / Setpiece (500–1 500 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Waldrand · platzierbar auf: forest-Kante · Instancing: nein · Spawn: am Waldrand für organische Übergänge statt harter Kante · *geplant* (noch nicht verdrahtet)

### `fallen_log.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a fallen mossy tree log lying on the forest floor, low-poly
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Wald · platzierbar auf: forest · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `grass_patch.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small patch of taller grass tufts, low-poly, sits flush on grass tiles
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Höhe ≈0.2 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Grasland · platzierbar auf: grass · Zufallsrotation · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `flower_patch.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small patch of colorful wildflowers among short grass, low-poly
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Höhe ≈0.2 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Grasland, fruchtbares Land · platzierbar auf: grass, fertile · Zufallsrotation + Zufallsfarbe (falls Vertex-Color) · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `hedge.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a low trimmed green hedge segment, about 0.5 tiles tall, tileable side to side
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Höhe ≈0.5 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Stadtrand, Park · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `reeds_water.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a cluster of tall water reeds/cattails for lake and river shores, low-poly
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: See-/Flussufer · platzierbar auf: shore_tile, lake_edge · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `rock_small.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small stylized grey rock / few stones on the ground, about 0.4 tiles tall, low-poly
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Höhe ≈0.4 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge, Grasland · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `rock_medium.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a medium stylized grey boulder / rock cluster, low-poly
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge, Küste · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `rock_large.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a large stylized grey boulder, about 1 tile tall, layered stone, low-poly
```

**Spec:** Größenklasse `prop_large` — großes Prop / Setpiece (500–1 500 Tris, ≤ 512², 1–2 Materialien) · Höhe ≈1.0 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `street_lamp.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a stylized street lamp post with a glowing lamp head
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Höhe ≈0.9 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Stadt · platzierbar auf: entlang Gehweg/Straße · Instancing: ja · Animations-Node: `reserved: light_window/glow bei Nacht` · *geplant* (noch nicht verdrahtet)

### `bench.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a simple park bench, low-poly
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Höhe ≈0.4 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Stadt, Park · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `market_stall.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a market stall with a striped awning and crates of goods
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Stadtzentrum, Markt · Instancing: nein · *geplant* (noch nicht verdrahtet)

### `boat_small.glb` — 1×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small rowing/fishing boat, front facing +Z, low-poly
```

**Spec:** Größenklasse `prop_large` — großes Prop / Setpiece (500–1 500 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Küste, See · platzierbar auf: an Pier/Ufer, im Wasser · Instancing: nein · *geplant* (noch nicht verdrahtet)

### `hay_bale.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a round hay bale, low-poly
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Fruchtbares Land · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `tractor_small.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small farm tractor, front facing +Z, low-poly
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Fruchtbares Land · Instancing: nein · *geplant* (noch nicht verdrahtet)

## Geplant — Gelände-Anpassung für Straßen (props/infrastructure/)

Straßen dürfen niemals schweben: bei Steigungen entstehen Böschungen/Stützmauern statt schwebender Kanten (World-Graphics-V2 §5).

### `retaining_wall.glb` — 1×1, modular entlang Kante

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a stone retaining wall segment holding back a slope, tileable side to side
```

**Spec:** Größenklasse `terrain_feature` — Terrain-Feature (800–3 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge, Hügelland · platzierbar auf: entlang einer Straßen-/Bauplatzkante mit Höhenversatz · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `embankment_slope.glb` — 1×1, modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a grassy earth embankment slope segment smoothing a height step next to a road, tileable
```

**Spec:** Größenklasse `terrain_feature` — Terrain-Feature (800–3 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge, Hügelland · platzierbar auf: natürliche Böschung statt Stützmauer, weicher Höhenübergang · Instancing: ja · *geplant* (noch nicht verdrahtet)

## Geplant — Wegkreuze, Wanderwege, Naturdenkmäler, ländliche Umgebung

Kleine Weltobjekte AUSSERHALB der Stadt, die die Karte lebendig statt leer wirken lassen (World-Graphics-V2 Erweiterung).

### `wayside_cross.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small stone or wooden wayside cross/shrine beside a country path, weathered and rustic
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Höhe ≈1.0 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Grasland, Feldweg · Instancing: nein · *geplant* (noch nicht verdrahtet)

### `hiking_trail_marker.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small wooden hiking trail signpost with a directional arrow, rustic style
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Höhe ≈0.6 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge, Wald, Hügelland · platzierbar auf: entlang eines Wanderwegs · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `natural_monument_stone.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a striking single natural monument boulder, distinct shape, marked as a scenic point of interest
```

**Spec:** Größenklasse `prop_large` — großes Prop / Setpiece (500–1 500 Tris, ≤ 512², 1–2 Materialien) · Höhe ≈1.2 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge, Grasland · Instancing: nein · *geplant* (noch nicht verdrahtet)

### `viewpoint_bench.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a scenic viewpoint bench with a small wooden railing, facing outward over a vista
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Hochplateau, Klippe · platzierbar auf: an Aussichtspunkten · Instancing: nein · *geplant* (noch nicht verdrahtet)

### `cave_entrance_small.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small dark cave entrance opening in a rocky mountainside, low-poly
```

**Spec:** Größenklasse `prop_large` — großes Prop / Setpiece (500–1 500 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge · platzierbar auf: mountain-Wandfuß · Instancing: nein · *geplant* (noch nicht verdrahtet)

### `mine_entrance_small.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small abandoned mine entrance with wooden support beams set into a rocky slope
```

**Spec:** Größenklasse `prop_large` — großes Prop / Setpiece (500–1 500 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge · platzierbar auf: mountain-Wandfuß, außerhalb der Stadt · Instancing: nein · *geplant* (noch nicht verdrahtet)

### `farmstead_ruin.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small rustic farmstead outside the city: a weathered barn, a fence and a dirt yard
```

**Spec:** Größenklasse `prop_large` — großes Prop / Setpiece (500–1 500 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Fruchtbares Land, Grasland · Instancing: nein · *geplant* (noch nicht verdrahtet)

### `village_cluster_small.glb` — 3×3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a tiny rural village cluster of 3–4 small cottages with a shared dirt path, outside the main city
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Grasland, Hügelland · Instancing: nein · Spawn: ein bis zwei Exemplare, abseits der Stadt · *geplant* (noch nicht verdrahtet)

## Geplant — saisonale Deko

Optionale Überlagerung auf bestehenden Props/Terrain, keine neue Kategorie in der Spiellogik.

### `seasonal_wreath_winter.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small festive winter wreath decoration with a red ribbon, to hang on a building facade
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Stadt (saisonal) · Instancing: nein · *geplant* (noch nicht verdrahtet)

### `seasonal_pumpkin_pile.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small autumn pile of decorative pumpkins beside a path
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Stadt, Farm (saisonal) · Instancing: ja · *geplant* (noch nicht verdrahtet)
