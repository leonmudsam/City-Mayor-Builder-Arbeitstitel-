# reference/ — Referenz-Assets (nie zur Laufzeit geladen)

Dieser Ordner enthält **Quell-/Referenzdateien**, die niemals im Client-Bundle
landen und von keiner Runtime importiert werden. Vite bundelt nur unter `src/`
importierte Assets — Dateien hier sind rein für Werkzeuge und Menschen.

| Datei | Zweck |
| --- | --- |
| `stylized island map 3d model.glb` | **Verbindliche Weltgrundlage (MVP4).** 44 Meshes, 952k Verts, reine Geometrie (keine Texturen/Farben). Wird von `tools/bakeWorld.mjs` offline in die committeten Gen-Dateien gebacken (`src/game/config/world/islandTerrain.gen.ts`, `src/renderer/three/worldHeight.gen.ts`). Siehe `docs/WORLD_REBUILD.md`. |
| `MCB map 3d model.glb` | Ältere Referenz-Insel (Vorgänger-Iteration, ein Monolith-Mesh mit Textur-Atlas). Historisch aufbewahrt; nicht mehr Grundlage. |

**Regeln**
- Kein `import` aus diesem Ordner — weder in `src/` noch in Tests.
- Änderungen an der Welt-GLB erfordern einen erneuten Bake:
  `node tools/bakeWorld.mjs` (schreibt die Gen-Dateien + `tools/bake-report.md` neu).
