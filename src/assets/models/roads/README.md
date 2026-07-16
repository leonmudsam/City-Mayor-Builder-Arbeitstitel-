# 3D-Modelle — Straßen

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Ordner: `src/assets/models/roads/` (historisch — kein aktiver Drop-in-Ziel mehr)

**Straßen laden seit v0.44 nie mehr ein `.glb`** (§ Straßen als Textur). Die Mask-getriebene Straßengeometrie (gerade/Kurve/T/Kreuzung/Ende, Kreisverkehr, Bergstraße, Steg/Brücke) ist jetzt texturbasiert — siehe `docs/ROAD_TEXTURES.md` und `src/assets/roadTextureManifest.ts` für die aktuelle Drop-in-Spezifikation (`src/assets/textures/roads/…`).
