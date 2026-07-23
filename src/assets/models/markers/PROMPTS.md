# 3D-Prompts — Marker (schwebende Statusanzeigen)

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Zielordner: `src/assets/models/markers/`. Jeder Block ist copy-paste-fertig (Stil-Prefix + Motiv) und trägt darunter die volle Spezifikation (Größenklasse/Budget, Höhe, Pivot, Front, Platzierung, Biom, Animationen). **Technik (Pflicht):** `.glb`, Texturen eingebettet, keine Lichter/Kameras, +Y oben, Front +Z, Pivot mittig an der Unterkante, 1 Tile = 1 Welt-Einheit. Stil-Details & Budgets: `docs/3D_WORLD_ASSETS.md`.

Schweben über Gebäuden, kippen mit der Welt und rotieren. Klar von jeder Seite lesbar, kräftige Farbe.

## Aktiv genutzt

### `marker_task.glb` — ~1 Kachel hoch

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a floating quest/task marker: a rounded teal pin with a clean icon, readable from any angle
```

**Spec:** Größenklasse `marker` — Marker / Welt-UI (< 200 Tris, ≤ 128² (oder Canvas), 1 Material, emissiv) · Pivot zentriert, schwebt über dem Gebäude · Front n/a, immer zur Kamera (Billboard-Fallback) · **live** (bereits verdrahtet)

### `marker_construction.glb` — ~1 Kachel hoch

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a floating construction marker: a yellow pin with a wrench or hard-hat icon
```

**Spec:** Größenklasse `marker` — Marker / Welt-UI (< 200 Tris, ≤ 128² (oder Canvas), 1 Material, emissiv) · Pivot zentriert, schwebt · Front +Z · **live** (bereits verdrahtet)

### `marker_problem.glb` — ~1 Kachel hoch

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a floating problem marker: a red pin with a white exclamation mark
```

**Spec:** Größenklasse `marker` — Marker / Welt-UI (< 200 Tris, ≤ 128² (oder Canvas), 1 Material, emissiv) · Pivot zentriert, schwebt · Front +Z · **live** (bereits verdrahtet)

### `marker_problem_road.glb` — ~1 Kachel hoch

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a floating red road-connection problem marker: a broken road icon in a rounded pin
```

**Spec:** Größenklasse `marker` — Marker / Welt-UI (< 200 Tris, ≤ 128² (oder Canvas), 1 Material, emissiv) · Pivot zentriert, schwebt · Front +Z · **live** (bereits verdrahtet)

### `marker_problem_water.glb` — ~1 Kachel hoch

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a floating blue waterway problem marker: a blocked anchor icon in a rounded pin
```

**Spec:** Größenklasse `marker` — Marker / Welt-UI (< 200 Tris, ≤ 128² (oder Canvas), 1 Material, emissiv) · Pivot zentriert, schwebt · Front +Z · **live** (bereits verdrahtet)

### `marker_problem_network.glb` — ~1 Kachel hoch

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a floating amber partial-network marker: two disconnected link nodes in a rounded pin
```

**Spec:** Größenklasse `marker` — Marker / Welt-UI (< 200 Tris, ≤ 128² (oder Canvas), 1 Material, emissiv) · Pivot zentriert, schwebt · Front +Z · **live** (bereits verdrahtet)

### `marker_upgrade.glb` — ~1 Kachel hoch

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a floating upgrade marker: a green pin with a white up-arrow
```

**Spec:** Größenklasse `marker` — Marker / Welt-UI (< 200 Tris, ≤ 128² (oder Canvas), 1 Material, emissiv) · Pivot zentriert, schwebt · Front +Z · **live** (bereits verdrahtet)

## Geplant — weitere Zustände & Sektoren

### `marker_water.glb` — ~1 Kachel hoch

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a floating blue water marker: a droplet icon pin
```

**Spec:** Größenklasse `marker` — Marker / Welt-UI (< 200 Tris, ≤ 128² (oder Canvas), 1 Material, emissiv) · Pivot zentriert, schwebt · Front +Z · *geplant* (noch nicht verdrahtet)

### `marker_trade.glb` — ~1 Kachel hoch

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a floating orange trade marker: a coins/handshake icon pin
```

**Spec:** Größenklasse `marker` — Marker / Welt-UI (< 200 Tris, ≤ 128² (oder Canvas), 1 Material, emissiv) · Pivot zentriert, schwebt · Front +Z · *geplant* (noch nicht verdrahtet)

### `marker_resource.glb` — ~1 Kachel hoch

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a floating resource marker: a crate/ore icon pin
```

**Spec:** Größenklasse `marker` — Marker / Welt-UI (< 200 Tris, ≤ 128² (oder Canvas), 1 Material, emissiv) · Pivot zentriert, schwebt · Front +Z · *geplant* (noch nicht verdrahtet)

### `sector_border_locked.glb` — entlang Sektorgrenze

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a low glowing fence/border line marking a locked sector boundary, semi-transparent
```

**Spec:** Größenklasse `marker` — Marker / Welt-UI (< 200 Tris, ≤ 128² (oder Canvas), 1 Material, emissiv) · Pivot liegt auf dem Boden · Front +Z · *geplant* (noch nicht verdrahtet)

### `sector_border_unlocked.glb` — entlang Sektorgrenze

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a subtle low border line marking a freshly unlocked sector boundary
```

**Spec:** Größenklasse `marker` — Marker / Welt-UI (< 200 Tris, ≤ 128² (oder Canvas), 1 Material, emissiv) · Pivot liegt auf dem Boden · Front +Z · *geplant* (noch nicht verdrahtet)

### `sector_marker_build.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a buildable-zone marker: a green dashed frame with a small tool icon on the ground
```

**Spec:** Größenklasse `marker` — Marker / Welt-UI (< 200 Tris, ≤ 128² (oder Canvas), 1 Material, emissiv) · Pivot liegt auf dem Boden · Front +Z · *geplant* (noch nicht verdrahtet)

### `sector_marker_resource.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a resource-hint zone marker: a faint dashed frame with a subtle ore/wood icon on the ground
```

**Spec:** Größenklasse `marker` — Marker / Welt-UI (< 200 Tris, ≤ 128² (oder Canvas), 1 Material, emissiv) · Pivot liegt auf dem Boden · Front +Z · *geplant* (noch nicht verdrahtet)

## Geplant — Sektor-Nebel & Bürgerhinweise

Gesperrte Sektoren zeigen keine vollständige Sicht: dichter Nebel, Silhouetten, gelegentliche Bürgerhinweise als Sprechblase (World-Graphics-V2 §9). Reiner Hinweis-/Mystery-Zweck, keine Gameplay-Information.

### `locked_sector_fog_veil.glb` — deckt einen ganzen Sektor ab

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a dense, softly animated fog veil mesh covering an unrevealed map sector, semi-transparent, obscuring detail beneath
```

**Spec:** Größenklasse `terrain_feature` — Terrain-Feature (800–3 000 Tris, ≤ 512², 1–2 Materialien) · Pivot flache Ebene über dem Sektor, halbtransparent · Front n/a · Biom: gesperrter Sektor · Instancing: nein · Effekt-Node/-Anschluss: `leichte Partikel-Nebelbewegung` · *geplant* (noch nicht verdrahtet)

### `landmark_silhouette_hint.glb` — grob wie das verborgene Hero-Objekt

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a low-detail dark silhouette shape hinting at a large landmark hidden behind fog, barely readable, no surface detail
```

**Spec:** Größenklasse `terrain_feature` — Terrain-Feature (800–3 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: gesperrter Sektor · Instancing: nein · Spawn: nur wenn ein Hero-/Landmarken-Objekt im Sektor liegt · *geplant* (noch nicht verdrahtet)

### `marker_citizen_hint.glb` — ~1 Kachel hoch

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a floating speech-bubble marker mesh with a small dashed outline, used for a citizen hint about an unrevealed sector (text content is UI/i18n, not part of the mesh)
```

**Spec:** Größenklasse `marker` — Marker / Welt-UI (< 200 Tris, ≤ 128² (oder Canvas), 1 Material, emissiv) · Pivot schwebt über einem Bürger/Gebäude · Front +Z · Biom: überall, temporär · *geplant* (noch nicht verdrahtet)
