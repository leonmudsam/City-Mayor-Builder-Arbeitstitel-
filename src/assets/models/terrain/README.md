# 3D-Modelle — Terrain & Gebirge

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Ordner: `src/assets/models/terrain/`  ·  Loader: `terrainModel()`  ·  Schlüssel = Dateiname (rekursiv).

Bodenkacheln je Terraintyp (ersetzen die farbige Basis-Kachel) und gestreute Gebirgs-Features. Unterordner (tiles/water/mountains/…) sind reine Organisation — erkannt wird rekursiv per Dateiname.

| Zweck | Akzeptierte Dateinamen (Priorität →) | Hinweis |
|---|---|---|
| Kachel Gras | `grass_tile.glb` → `grass.glb` |  |
| Kachel Wald | `forest_ground_tile.glb` → `forest.glb` |  |
| Kachel Meer | `ocean_tile.glb` → `water.glb` |  |
| Kachel Fluss | `river_straight.glb` → `river.glb` → `water.glb` |  |
| Kachel Gebirge | `mountain_ground_tile.glb` → `rock_ground_tile.glb` → `mountain.glb` |  |
| Kachel Sand/Küste | `sand_tile.glb` → `shore_tile.glb` → `sand.glb` |  |
| Kachel fruchtbar | `fertile_ground_tile.glb` → `fertile.glb` |  |
| Gebirgs-Feature (gestreut) | `mountain_peak_medium.glb` → `mountain_peak_large.glb` → `rock_large.glb` → `mountain_peak.glb` | auf ~⅓ der Gebirgs-Kacheln |

Fehlt ein Modell, greift der prozedurale Fallback — das Spiel bricht nie. Die volle Spezifikation (Footprint, Höhe, Pivot, Platzierung, Biom, Budget) für diese UND alle geplanten Modelle dieses Ordners steht in `PROMPTS.md` daneben.
