# 3D-Prompts — Straßen

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Zielordner: `src/assets/models/roads/`. Jeder Block ist copy-paste-fertig (Stil-Prefix + Motiv) und trägt darunter die volle Spezifikation (Größenklasse/Budget, Höhe, Pivot, Front, Platzierung, Biom, Animationen). **Technik (Pflicht):** `.glb`, Texturen eingebettet, keine Lichter/Kameras, +Y oben, Front +Z, Pivot mittig an der Unterkante, 1 Tile = 1 Welt-Einheit. Stil-Details & Budgets: `docs/3D_WORLD_ASSETS.md`.

**Straßen laden seit v0.44 nie mehr ein `.glb`** (§ Straßen als Textur). Die Mask-getriebene Straßengeometrie (gerade/Kurve/T/Kreuzung/Ende, Kreisverkehr, Bergstraße, Steg/Brücke) ist jetzt texturbasiert — siehe `docs/ROAD_TEXTURES.md` und `src/assets/roadTextureManifest.ts` für die aktuelle Drop-in-Spezifikation (`src/assets/textures/roads/…`).

