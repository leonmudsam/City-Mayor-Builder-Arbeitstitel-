# 3D-Modelle — Brücken

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Ordner: `src/assets/models/bridges/` (historisch — kein aktiver Drop-in-Ziel mehr)

**Brücken laden seit v0.44 nie mehr ein `.glb`** (§ Straßen als Textur). Eine Straße über Wasser wird jetzt als texturierter Steg (schmale Spannweite) oder Brücke (breite Spannweite) gerendert — siehe `docs/ROAD_TEXTURES.md` und `src/assets/roadTextureManifest.ts`.
