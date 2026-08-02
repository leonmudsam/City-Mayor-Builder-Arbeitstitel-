# 3D-Prompts — Brücken

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Zielordner: `src/assets/models/bridges/`. Jeder Block ist copy-paste-fertig (Stil-Prefix + Motiv) und trägt darunter die volle Spezifikation (Größenklasse/Budget, Höhe, Pivot, Front, Platzierung, Biom, Animationen). **Technik (Pflicht):** `.glb`, Texturen eingebettet, keine Lichter/Kameras, +Y oben, Front +Z, Pivot mittig an der Unterkante, 1 Tile = 1 Welt-Einheit. Stil-Details & Budgets: `docs/3D_WORLD_ASSETS.md`.

Modulares Near-LOD über der profilgesteuerten Brückengeometrie; Pfeilerhöhe kommt immer aus dem Spiel.

## Aktiv genutzt

Ein Mesh, instanzierbar; keine festen Pfeiler bis zum Boden einmodellieren.

### `road_bridge.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a modular stylized bridge deck detail with stone parapets and warm road surface, no fixed ground-height piers
```

**Spec:** Größenklasse `bridge` — Brücke (1 500–4 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · platzierbar auf: Wasser/Fluss · Instancing: ja · **live** (bereits verdrahtet)
