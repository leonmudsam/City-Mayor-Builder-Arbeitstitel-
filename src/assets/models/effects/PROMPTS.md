# 3D-Prompts — Effekte

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Zielordner: `src/assets/models/effects/`. Jeder Block ist copy-paste-fertig (Stil-Prefix + Motiv) und trägt darunter die volle Spezifikation (Größenklasse/Budget, Höhe, Pivot, Front, Platzierung, Biom, Animationen). **Technik (Pflicht):** `.glb`, Texturen eingebettet, keine Lichter/Kameras, +Y oben, Front +Z, Pivot mittig an der Unterkante, 1 Tile = 1 Welt-Einheit. Stil-Details & Budgets: `docs/3D_WORLD_ASSETS.md`.

Feste Effekt-Meshes als `.glb` (vieles läuft bereits als Partikel/Shader). Halb-transparente, weiche Formen.

## Aktiv genutzt

### `smoke_chimney.glb` — klein

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small soft stylized smoke/steam puff mesh for a chimney, light grey, semi-transparent look
```

**Spec:** Größenklasse `effect` — Effekt-Mesh (< 300 Tris, ≤ 128², 1 Material, halbtransparent) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Effekt-Node/-Anschluss: `chimney (Ursprungspunkt am Gebäude)` · **live** (bereits verdrahtet)

## Geplant — feste Effekt-Meshes

### `upgrade_glow.glb` — klein

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a soft golden glow/sparkle burst mesh to play when a building is upgraded
```

**Spec:** Größenklasse `effect` — Effekt-Mesh (< 300 Tris, ≤ 128², 1 Material, halbtransparent) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · *geplant* (noch nicht verdrahtet)

### `building_complete_effect.glb` — klein

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small celebratory confetti/spark ring mesh for when construction completes
```

**Spec:** Größenklasse `effect` — Effekt-Mesh (< 300 Tris, ≤ 128², 1 Material, halbtransparent) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · *geplant* (noch nicht verdrahtet)

### `waterfall_mist.glb` — klein, am Wasserfallfuß

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a soft white mist/foam puff mesh to sit at the base of a waterfall
```

**Spec:** Größenklasse `effect` — Effekt-Mesh (< 300 Tris, ≤ 128², 1 Material, halbtransparent) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · *geplant* (noch nicht verdrahtet)

### `fire_response_effect.glb` — klein

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small flashing emergency-light effect mesh for an active fire response
```

**Spec:** Größenklasse `effect` — Effekt-Mesh (< 300 Tris, ≤ 128², 1 Material, halbtransparent) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · *geplant* (noch nicht verdrahtet)

### `police_patrol_effect.glb` — klein

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small flashing blue-light effect mesh for an active police patrol
```

**Spec:** Größenklasse `effect` — Effekt-Mesh (< 300 Tris, ≤ 128², 1 Material, halbtransparent) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · *geplant* (noch nicht verdrahtet)

### `trade_delivery_effect.glb` — klein

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small sparkle/coin effect mesh marking a completed trade delivery
```

**Spec:** Größenklasse `effect` — Effekt-Mesh (< 300 Tris, ≤ 128², 1 Material, halbtransparent) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · *geplant* (noch nicht verdrahtet)

## Geplant — lebendige Welt (bewusst KEIN `.glb`, Partikel/Shader)

World-Graphics-V2 §10: die Welt soll sich schon aus großer Entfernung bewegen. Diese Effekte sind als Renderer-Partikel/Shader sinnvoller als als Mesh — hier trotzdem vollständig dokumentiert, damit nichts fehlt.

### `bird_flock_effect.glb` — groß, am Himmel

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small flock of simple low-poly birds looping across the sky at distance
```

**Spec:** Größenklasse `effect` — Effekt-Mesh (< 300 Tris, ≤ 128², 1 Material, halbtransparent) · **Kein `.glb`** — als Partikel/Shader im Renderer umgesetzt, nicht als Modell · *geplant* (noch nicht verdrahtet)

### `butterfly_swarm_effect.glb` — klein, über Wiesen/Blumenbeeten

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a few simple low-poly butterflies drifting above meadows and flower patches
```

**Spec:** Größenklasse `effect` — Effekt-Mesh (< 300 Tris, ≤ 128², 1 Material, halbtransparent) · **Kein `.glb`** — als Partikel/Shader im Renderer umgesetzt, nicht als Modell · *geplant* (noch nicht verdrahtet)

### `tree_wind_sway_effect.glb` — n/a (Vertex-Shader auf Baum-/Buschmodellen)

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a gentle vertex-shader sway applied to tree and bush canopies to suggest wind
```

**Spec:** Größenklasse `effect` — Effekt-Mesh (< 300 Tris, ≤ 128², 1 Material, halbtransparent) · **Kein `.glb`** — als Partikel/Shader im Renderer umgesetzt, nicht als Modell · *geplant* (noch nicht verdrahtet)

### `water_surface_motion_effect.glb` — n/a (Shader auf Wasserflächen)

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a subtle animated ripple/wave shader for river, lake and ocean surfaces
```

**Spec:** Größenklasse `effect` — Effekt-Mesh (< 300 Tris, ≤ 128², 1 Material, halbtransparent) · **Kein `.glb`** — als Partikel/Shader im Renderer umgesetzt, nicht als Modell · *geplant* (noch nicht verdrahtet)

### `harbor_wave_effect.glb` — klein, an Küste/Pier

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — small breaking-wave foam particles along a rocky or sandy coastline
```

**Spec:** Größenklasse `effect` — Effekt-Mesh (< 300 Tris, ≤ 128², 1 Material, halbtransparent) · **Kein `.glb`** — als Partikel/Shader im Renderer umgesetzt, nicht als Modell · *geplant* (noch nicht verdrahtet)

### `cloud_shadow_effect.glb` — groß, über der Karte

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a soft moving cloud-shadow patch drifting slowly across the terrain
```

**Spec:** Größenklasse `effect` — Effekt-Mesh (< 300 Tris, ≤ 128², 1 Material, halbtransparent) · **Kein `.glb`** — als Partikel/Shader im Renderer umgesetzt, nicht als Modell · *geplant* (noch nicht verdrahtet)
