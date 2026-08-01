# 3D-Modelle — Props & Vegetation

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Ordner: `src/assets/models/props/`  ·  Loader: `propModel()`  ·  Schlüssel = Dateiname (rekursiv).

Vegetation wird gegen die Stadt gecullt (nie auf Gebäude/Straße). Baustellen-Modelle (construction/) werden während Bau & Upgrade genutzt. Unterordner (nature/city/harbor/farm/construction/infrastructure) sind reine Organisation.

| Zweck | Akzeptierte Dateinamen (Priorität →) | Hinweis |
|---|---|---|
| Nadelbaum | `pine_tree.glb` → `tree_pine.glb` → `tree.glb` | gecullt, instanziert |
| Laubbaum | `tree_deciduous.glb` → `broadleaf_tree_medium.glb` → `broadleaf_tree_large.glb` | gecullt, instanziert |
| Grosser Bergbaum | `tree_pine_large.glb` → `pine_tree_large.glb` → `pine_tree.glb` → `tree_pine.glb` → `tree.glb` | gecullt, instanziert |
| Busch | `bush_small.glb` → `bush.glb` → `bush_medium.glb` | gecullt, instanziert |
| Felscluster | `rock_cluster_small.glb` → `mountain_boulder.glb` → `rock_medium.glb` → `rock_small.glb` | Gebirge/Kueste/Wueste, instanziert |
| Schilfcluster | `swamp_reed_cluster.glb` → `reeds_water.glb` → `reed_cluster.glb` | Sumpf und Ufer, instanziert |
| Totholz | `fallen_log.glb` → `dead_branch.glb` → `swamp_log.glb` | Wald/Sumpf/Kueste, instanziert |
| Szenisches Boot | `boat_small.glb` → `ship_sailing.glb` | handplatziert auf Küstenwasser |
| Szenische Windmühle | `windmill_small.glb` | handplatziert im fruchtbaren Land |
| Küsten-Leuchtturm | `lighthouse.glb` | handplatziert auf einer Landzunge |
| Szenischer Wasserfall | `waterfall_cliff.glb` → `waterfall_small.glb` | handplatziert an wassernahem Gebirge |
| Landmarke Felsbogen | `landmark_rock_arch.glb` → `rock_arch.glb` → `rock_large.glb` → `mountain_boulder.glb` | Klippen und trockene Felszone |
| Landmarke alter Baum | `landmark_old_tree.glb` → `old_tree_large.glb` → `tree_deciduous.glb` → `tree_pine_large.glb` | Grasland/Waldlichtung |
| Landmarke kleine Ruine | `landmark_ruin_small.glb` → `ruin_small.glb` | neutral, ohne Gameplayfunktion |
| Landmarke Wuesten-Felsnadel | `landmark_desert_spire.glb` → `desert_rock_spire.glb` → `rock_large.glb` | visuelle Suedost-Wueste |
| Landmarke Sumpfbaum | `landmark_swamp_tree.glb` → `swamp_dead_tree.glb` → `tree_deciduous.glb` | visuelle Westbucht |
| Landmarke Seeinsel | `landmark_lake_islet.glb` → `small_coastal_islet.glb` → `rock_large.glb` | Seenland und Buchten |
| Baustelle (Bau & Upgrade) | `construction_site.glb` → `construction_crane.glb` → `scaffold.glb` → `crane.glb` | generisch; pro Gebäude: <id>_construction.glb |

Fehlt ein Modell, greift der prozedurale Fallback — das Spiel bricht nie. Die volle Spezifikation (Footprint, Höhe, Pivot, Platzierung, Biom, Budget) für diese UND alle geplanten Modelle dieses Ordners steht in `PROMPTS.md` daneben.
