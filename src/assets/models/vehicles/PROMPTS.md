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

## Geplant — Flotte

Verkehr fährt künftig Haus → Straße → Ziel statt Zufallslauf (World-Graphics-V2 §11) — betrifft nur die Pathing-Logik, nicht die Modelle hier.

### `truck_food.glb` — ≈0.5×0.9

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small food delivery truck with a box body, front facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · *geplant* (noch nicht verdrahtet)

### `firetruck.glb` — ≈0.5×0.9

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a red fire truck with a ladder, front facing +Z, low-poly
```

**Spec:** Größenklasse `vehicle` — Fahrzeug (500–1 200 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · *geplant* (noch nicht verdrahtet)

### `police_car.glb` — ≈0.3×0.5

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a police car with blue livery and a light bar, front facing +Z, low-poly
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
