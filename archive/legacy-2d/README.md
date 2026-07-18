# Archiv — Legacy 2D/Iso-Renderer (Ausbaustufe 2.0, A10)

Diese Dateien gehören zum **entfernten 2D-/Iso-Pixi-Renderer** und zu Gebäuden,
die es nicht mehr gibt. Sie sind hier archiviert (nicht gelöscht), damit die
Historie/Referenz erhalten bleibt, ohne das aktive Projekt zu belasten.

- `buildings/house_row.png`, `buildings/apartment.png` — 2D-Artwork der in der
  Save-v11-Migration entfallenen Wohn-Gebäude `house_row` und `apartment`
  (Hybrid-Wohnkette: `house_small` 6 Stufen + `residential_tower` 3 Stufen
  ersetzen sie).
- `docs/ISO_ASSETS.md`, `docs/ISO_RENDERING.md` — Doku des isometrischen
  Pixi-Renderers. Der aktive 3D-Renderer ist in `docs/3D_MODEL_MANIFEST.md` /
  `docs/3D_WORLD_ASSETS.md` beschrieben.

Der 2D-/Iso-Renderer-Code selbst wurde bereits in A1 entfernt (nur noch der
`three`-Renderer, `src/renderer/three/`). Siehe `docs/PATCHNOTES.md` (v0.50,
v0.59).
