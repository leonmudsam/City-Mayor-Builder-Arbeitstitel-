# 3D-Prompts — Straßen

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Zielordner: `src/assets/models/roads/`. Jeder Block ist copy-paste-fertig (Stil-Prefix + Motiv) und trägt darunter die volle Spezifikation (Größenklasse/Budget, Höhe, Pivot, Front, Platzierung, Biom, Animationen). **Technik (Pflicht):** `.glb`, Texturen eingebettet, keine Lichter/Kameras, +Y oben, Front +Z, Pivot mittig an der Unterkante, 1 Tile = 1 Welt-Einheit. Stil-Details & Budgets: `docs/3D_WORLD_ASSETS.md`.

Flache, kachelbare Segmente; der Renderer wählt & dreht sie nach Nachbar-Maske. Kanonik: gerade = N–S, Kurve = N+E.

## Aktiv genutzt (Wohnstraße)

### `road_straight.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a straight two-lane asphalt road segment running north–south, with kerbs; flat and tileable
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front n/a (Boden-Segment) · Instancing: ja · **live** (bereits verdrahtet)

### `road_curve.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a 90° road curve joining the north and east edges, asphalt with kerbs, flat
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front n/a · Instancing: ja · **live** (bereits verdrahtet)

### `road_t_intersection.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a T-junction road segment with three arms (north, east, south), open to the west, asphalt with kerbs
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front n/a · Instancing: ja · **live** (bereits verdrahtet)

### `road_cross_intersection.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a four-way crossroads road segment, asphalt with kerbs and lane markings
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front n/a · Instancing: ja · **live** (bereits verdrahtet)

### `road_end.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a dead-end road cap with a single arm to the north, asphalt with kerbs
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front n/a · Instancing: ja · **live** (bereits verdrahtet)

## Geplant — Hauptstraße, Gehwege, Gelände-Anpassung

Klassenvarianten `road_main_*` werden vom Renderer vor dem generischen Namen bevorzugt. `road_slope`/`road_bridge_entry` sorgen dafür, dass Straßen dem Gelände folgen statt zu schweben (World-Graphics-V2 §5).

### `road_main_straight.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a wider main-road straight segment with a centre line and sidewalks, running north–south, flat and tileable
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `road_main_cross_intersection.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a wide main-road four-way crossroads with markings and sidewalks
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `sidewalk_straight.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a straight paved sidewalk segment with a kerb, flat and tileable
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `road_slope.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a road ramp segment rising one height step, asphalt with kerbs, blends smoothly into flat road tiles at both ends
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge, Hügelland · platzierbar auf: Höhenstufe zwischen zwei Terrassen · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `road_bridge_entry.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a short road segment transitioning from ground level onto a raised bridge deck, with a low kerb ramp
```

**Spec:** Größenklasse `terrain_tile` — Terrain-/Straßen-Kachel (200–800 Tris, ≤ 512² (bevorzugt geteilt), 1 Material) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Fluss-/Schluchtrand · platzierbar auf: Übergang Straße → Brückendeck · Instancing: ja · *geplant* (noch nicht verdrahtet)
