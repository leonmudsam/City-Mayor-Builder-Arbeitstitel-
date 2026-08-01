# reference/ — Referenz-Assets (nie zur Laufzeit geladen)

Dieser Ordner enthält **Quell-/Referenzdateien**, die niemals im Client-Bundle
landen und von keiner Runtime importiert werden. Vite bundelt nur unter `src/`
importierte Assets — Dateien hier sind rein für Werkzeuge und Menschen.

| Datei | Zweck |
| --- | --- |
| `world/new island 3d model.glb` | **Verbindliche Weltgrundlage (§ World Overhaul 12.0, v1.17).** 117 Meshes, 989k Verts, 1.914.065 Dreiecke, reine Geometrie (POSITION/NORMAL, keine Texturen). SHA-256 `b52c0cfb…4374b0`. Einziger Konsument: `tools/bakeWorld.mjs`. Siehe `docs/WORLD_REBUILD.md` und `docs/agents/WORLD_OVERHAUL_12_PLAN.md`. |
| `world/island 3d new.glb` | Vorherige Weltgrundlage (78 Meshes, v0.72–v1.16). **Historisch aufbewahrt, wird von nichts mehr gelesen.** Nur für Vergleichsbakes: `WORLD_GLB="reference/world/island 3d new.glb" node tools/bakeWorld.mjs` (Diagnose, Ergebnis nie committen). |
| `stylized island map 3d model.glb` | Ältere Referenz-Insel (MVP4, 44 Meshes). Historisch aufbewahrt; nicht mehr Grundlage. |
| `MCB map 3d model.glb` | Ältere Referenz-Insel (Vorgänger-Iteration, ein Monolith-Mesh mit Textur-Atlas). Historisch aufbewahrt; nicht mehr Grundlage. |

**Regeln**
- Kein `import` aus diesem Ordner — weder in `src/` noch in Tests.
- Änderungen an der Welt-GLB erfordern einen erneuten Bake:
  `node tools/bakeWorld.mjs` (schreibt die Gen-Dateien, `tools/bake-report.md`,
  `tools/bake-preview.png` und `tools/bake-regions.png` neu).
- Ein Welt-Rebake, der Koordinaten oder Regionen verändert, braucht **immer** eine
  Save-Migration mit Backup/Neustart (§3 in `CLAUDE.md`; Muster: v25→v26).
