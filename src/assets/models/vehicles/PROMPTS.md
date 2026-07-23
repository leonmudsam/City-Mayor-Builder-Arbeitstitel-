# 3D-Prompts — Fahrzeuge

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Zielordner: `src/assets/models/vehicles/`. Jeder Block ist copy-paste-fertig (Stil-Prefix + Motiv) und trägt darunter die volle Spezifikation (Größenklasse/Budget, Höhe, Pivot, Front, Platzierung, Biom, Animationen). **Technik (Pflicht):** `.glb`, Texturen eingebettet, keine Lichter/Kameras, +Y oben, Front +Z, Pivot mittig an der Unterkante, 1 Tile = 1 Welt-Einheit. Stil-Details & Budgets: `docs/3D_WORLD_ASSETS.md`.

Klein, lesbar, Pivot mittig unten, **Front zeigt +Z** (Fahrtrichtung).

## Aktiv genutzt

### `car.glb` — ≈0.3×0.5

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small stylized car, readable from an isometric camera, front facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)

### `service_van.glb` — ≈0.4×0.7

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small white delivery / service van, front facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)

### `medium_truck.glb` — ≈0.5×0.9

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a medium blue cab-over delivery truck with a closed cargo box, front facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)

### `large_truck.glb` — ≈0.6×1.1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a large red three-axle cargo truck with a tall box body, front facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)

### `refrigerated_truck.glb` — ≈0.5×0.9

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a white refrigerated delivery truck with a visible roof cooling unit, front facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)

### `heavy_transporter.glb` — ≈0.7×1.4

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — an orange heavy-haul tractor and low-loader with a secured industrial crate, front facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)

### `firetruck.glb` — ≈0.5×0.9

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a red fire truck with a ladder, front facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)

### `police_car.glb` — ≈0.3×0.5

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a police car with blue livery and a light bar, front facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)

### `logging_truck.glb` — ≈0.5×1.1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a logging truck carrying stacked tree logs on a long flatbed trailer, front facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)

### `flatbed.glb` — ≈0.5×1.0

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a flatbed construction-material truck loaded with pallets of bricks and planks, front facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)

## Geplant — Flotte

Verkehr fährt künftig Haus → Straße → Ziel statt Zufallslauf (World-Graphics-V2 §11) — betrifft nur die Pathing-Logik, nicht die Modelle hier.

### `truck_food.glb` — ≈0.5×0.9

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small food delivery truck with a box body, front facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · *geplant* (noch nicht verdrahtet)

### `ambulance.glb` — ≈0.4×0.7

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a white ambulance with a red cross and a light bar, front facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · *geplant* (noch nicht verdrahtet)

### `bus_small.glb` — ≈0.4×1.0

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small city bus, front facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · *geplant* (noch nicht verdrahtet)

### `service_boat.glb` — ≈0.7×1.6

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a compact municipal service boat with a small wheelhouse, rubber fenders and an open utility deck, bow facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot mittig auf der Wasserlinie · Front +Z · *geplant* (noch nicht verdrahtet)

### `cargo_boat_small.glb` — ≈0.8×2.0

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small cargo boat with a stern wheelhouse and an open hold for crates, bow facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot mittig auf der Wasserlinie · Front +Z · *geplant* (noch nicht verdrahtet)

### `ferry_small.glb` — ≈0.9×2.2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a compact passenger ferry with broad windows and a clear bow ramp, bow facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot mittig auf der Wasserlinie · Front +Z · *geplant* (noch nicht verdrahtet)

### `cargo_barge.glb` — ≈1.1×3.2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a low river cargo barge with a broad open deck carrying crates and pallets, bow facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot mittig auf der Wasserlinie · Front +Z · *geplant* (noch nicht verdrahtet)

### `river_freighter.glb` — ≈1.1×3.4

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a compact self-propelled river freighter with a stern wheelhouse, covered hold and navigation lights, bow facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot mittig auf der Wasserlinie · Front +Z · *geplant* (noch nicht verdrahtet)

### `ferry_medium.glb` — ≈1.2×3.3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a medium two-deck passenger ferry with broad windows and boarding gates, bow facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot mittig auf der Wasserlinie · Front +Z · *geplant* (noch nicht verdrahtet)

### `cargo_ship.glb` — ≈1.5×4.5

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a coastal cargo ship with a stern superstructure, two deck cranes and several cargo hatches, bow facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot mittig auf der Wasserlinie · Front +Z · *geplant* (noch nicht verdrahtet)

### `passenger_ship.glb` — ≈1.5×4.2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small coastal passenger ship with three readable decks, broad windows and a clean silhouette, bow facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot mittig auf der Wasserlinie · Front +Z · *geplant* (noch nicht verdrahtet)

### `construction_barge.glb` — ≈1.5×4.0

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a construction barge with a lattice crane, material pallets and safety rails, bow facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot mittig auf der Wasserlinie · Front +Z · *geplant* (noch nicht verdrahtet)
