# Terrain Material Matrix 6.1

Alle Farbtexturen sind 2048×2048, kachelbar und über
`terrainTextureUrl()` drop-in-fähig. Fehlt eine Datei, bleibt die
Vertexfarbpalette aktiv. Zusatzmaps werden im linearen Farbraum geladen.

| Zone | Aktive Basis | Übergänge/Varianten | Projektion | Zusatzmaps |
|---|---|---|---|---|
| Frische Wiese | `grass_meadow_fresh` | `grass_meadow_dark`, `grass_meadow_dry`, `grass_soft_ground`, `grass_wildflowers`, `grass_trampled`, `grass_wet` | World-space De-Tile | Normal, Roughness, AO |
| Wald | `forest_floor_moss` | `forest_floor_needles`, `forest_floor_leaves`, `forest_floor_dark_soil`, `forest_floor_roots`, `forest_edge_grass` | World-space De-Tile | AO; Normal/Roughness vorhanden |
| Fruchtbares Tal | `fertile_valley_ground` | `coast_mud_fertile` | World-space De-Tile | über Materialbibliothek vorbereitet |
| Trockene Ebene | `dry_steppe` | `grass_meadow_dry` | World-space De-Tile | über Materialbibliothek vorbereitet |
| Moor | `swamp_mud` | `moor_heather_ground`, `grass_mossy` | World-space De-Tile | vorhandenes visuelles Profil, kein Gameplayeffekt |
| Flaches Ufer | `coast_shore_accessible` | `coast_sand_wet`, `coast_gravel_stylized`, `coast_mud_fertile` | World-space, Ufermaske | Normal, Roughness, AO |
| Gebirgsfuß | `mountain_granite_base` | `mountain_scree`, `mountain_moss` | triplanar | Normal, Roughness, AO |
| Steilflanke | `mountain_cliff_faceted` | `mountain_granite_dark`, `mountain_wet_rock` | triplanar, hanggewichtet | Normal, Roughness, AO |
| Grat | `mountain_strata` | `mountain_granite_light` | triplanar, Höhe + Macro-Noise | Basis-PBR vorhanden |
| Gipfel | `mountain_snow` | Fels bleibt an steilen Stellen sichtbar | World-space | vorhandene Materialbibliothek |

## Shaderregeln

- Küste: direkte `shoreTypeGrid`-/`waterfrontBuildableGrid`-Daten überstimmen
  die großräumige Regionsfärbung.
- Gebirge: Steigung blendet zuerst facettierte Klippe, danach Höhe Granit,
  Schichten und erst auf den höchsten Flächen Schnee.
- Wald: Waldboden folgt dem gebackenen Waldanteil; die AO-Map verstärkt nur
  dezent die Tiefe, damit dunkle Flächen nicht zulaufen.
- Distanz: Farbmuster bleiben mittel-/fernsichtbar. Normaldetail ist auf die
  Nahsicht begrenzt; instanziertes Mikrogras endet bei Distanz 105.
- Wetter: Regen setzt `uGroundWetness`, dunkelt um etwa 5–9 Prozent ab und
  reduziert Roughness kontrolliert.

Die vollständige, testgesicherte Dateiliste und die Bildprompts stehen in
`docs/TERRAIN_TEXTURES.md`.
