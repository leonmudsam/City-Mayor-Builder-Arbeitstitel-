# 3D-Prompts — Welt-UI (3D-Anzeigen über Gebäuden)

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Zielordner: `src/assets/models/ui/`. Jeder Block ist copy-paste-fertig (Stil-Prefix + Motiv) und trägt darunter die volle Spezifikation (Größenklasse/Budget, Höhe, Pivot, Front, Platzierung, Biom, Animationen). **Technik (Pflicht):** `.glb`, Texturen eingebettet, keine Lichter/Kameras, +Y oben, Front +Z, Pivot mittig an der Unterkante, 1 Tile = 1 Welt-Einheit. Stil-Details & Budgets: `docs/3D_WORLD_ASSETS.md`.

Schwebende 3D-UI über dem gewählten/betroffenen Gebäude. Klar, kräftig, gut lesbar; ohne Modell zeichnet der Renderer die prozedurale Variante.

## Welt-UI-Modelle

### `ui_selection_ring.glb` — Footprint des Gebäudes

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a thin glowing flat selection ring that lies on the ground around a building, emissive, no top surface
```

**Spec:** Größenklasse `marker` — Marker / Welt-UI (< 200 Tris, ≤ 128² (oder Canvas), 1 Material, emissiv) · Pivot liegt flach auf dem Boden unter dem Gebäude · Front +Z · **live** (bereits verdrahtet)

### `ui_upgrade_button.glb` — klein

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a floating 3D upgrade button: an up-arrow inside a rounded chip, bright and readable, hovers above a building
```

**Spec:** Größenklasse `marker` — Marker / Welt-UI (< 200 Tris, ≤ 128² (oder Canvas), 1 Material, emissiv) · Pivot schwebt über dem Gebäude · Front +Z · *geplant* (noch nicht verdrahtet)

### `ui_build_button.glb` — klein

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a floating 3D action button: a hammer or plus inside a rounded chip
```

**Spec:** Größenklasse `marker` — Marker / Welt-UI (< 200 Tris, ≤ 128² (oder Canvas), 1 Material, emissiv) · Pivot schwebt über dem Gebäude · Front +Z · *geplant* (noch nicht verdrahtet)

### `ui_level_badge.glb` — klein

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small floating level badge chip that displays a building level number
```

**Spec:** Größenklasse `marker` — Marker / Welt-UI (< 200 Tris, ≤ 128² (oder Canvas), 1 Material, emissiv) · Pivot schwebt über dem Gebäude · Front +Z · *geplant* (noch nicht verdrahtet)
