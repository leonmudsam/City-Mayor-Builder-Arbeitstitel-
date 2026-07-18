# 3D-Prompts — Weidetiere (Landwirtschaft)

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Zielordner: `src/assets/models/animals/`. Jeder Block ist copy-paste-fertig (Stil-Prefix + Motiv) und trägt darunter die volle Spezifikation (Größenklasse/Budget, Höhe, Pivot, Front, Platzierung, Biom, Animationen). **Technik (Pflicht):** `.glb`, Texturen eingebettet, keine Lichter/Kameras, +Y oben, Front +Z, Pivot mittig an der Unterkante, 1 Tile = 1 Welt-Einheit. Stil-Details & Budgets: `docs/3D_WORLD_ASSETS.md`.

Tiere für die lebendigen Höfe (A7). Der Renderer streut sie instanziert auf freie Weidekacheln rund um aktive Bauernhöfe und lässt sie gemächlich grasen/wandern; bis zum Drop-in sind es prozedurale Platzhalter. **Klein halten** (ein Rind ≈ 0.5 Kacheln hoch), Pivot unten-mittig, Front +Z, wenige Tris (werden vielfach instanziert). Maßstab 1 Kachel ≈ 4 m · Pivot unten-mittig, nichts schwebt · Höhen-Richtwerte: Baum ≈ 1.4–1.8, Strauch ≈ 0.5, Bank ≈ 0.4, Laterne ≈ 0.9, Fels ≈ 0.4–1.0, Brunnen ≈ 0.9 (Kacheln).

## Geplant — Nutztiere (instanziert, Weide-Wander-Animation im Renderer)

Ein ruhiges Idle/Graze genügt; die Bewegung über die Weide macht der Renderer (kein Skelett-Animationszwang). Mehr Tiere je Farmstufe, global gedeckelt.

### `cow.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small stylized cow standing on grass, black-and-white patches, front facing +Z, low-poly
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Höhe ≈0.5 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Farm, Weide, Fruchtbares Land · platzierbar auf: freie Weidekacheln um die Farm · Zufallsrotation, leichte Skalierung, Fell-Farbvariante · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `sheep.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small fluffy white sheep grazing on grass, front facing +Z, low-poly
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Höhe ≈0.4 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Farm, Weide · platzierbar auf: freie Weidekacheln · Zufallsrotation, leichte Skalierung · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `chicken.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a tiny stylized chicken pecking the ground, front facing +Z, low-poly
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Höhe ≈0.25 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Farm · platzierbar auf: freie Kacheln nahe der Scheune · Zufallsrotation · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `horse.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small stylized horse standing on grass, brown coat, front facing +Z, low-poly
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Höhe ≈0.6 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Farm, Weide · platzierbar auf: freie Weidekacheln · Zufallsrotation, Fell-Farbvariante · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `pig.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small pink pig standing on soil, front facing +Z, low-poly
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Höhe ≈0.35 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Farm · platzierbar auf: freie Kacheln nahe der Scheune · Zufallsrotation · Instancing: ja · *geplant* (noch nicht verdrahtet)

### `goat.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small stylized goat grazing on grass, front facing +Z, low-poly
```

**Spec:** Größenklasse `prop` — kleines Prop (< 500 Tris, ≤ 256², 1 Material) · Höhe ≈0.4 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Farm, Weide, Hügelland · platzierbar auf: freie Weidekacheln · Zufallsrotation · Instancing: ja · *geplant* (noch nicht verdrahtet)
