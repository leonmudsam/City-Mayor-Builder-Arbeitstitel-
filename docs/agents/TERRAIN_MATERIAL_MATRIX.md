# Terrain-Material-Matrix 5.0

Stand: 21. Juli 2026

Die aktive Pipeline mischt Base-Color-Texturen und Vertexfarben im vorhandenen
Terrainmaterial. Berg-/Klippenflächen nutzen Weltkoordinaten-Triplanar. Eigene
Normal-, Roughness-, AO- und Height-Maps sind als nächste Drop-in-Stufe offen;
bis dahin liefert das bestehende `MeshStandardMaterial` robuste Standardwerte.

| Biom / Schicht | Aktive Base Color | Normal | Roughness | Sekundärmaterial | Höhen-/Hangregel |
|---|---|---|---|---|---|
| Grasland | `grass/grass_meadow.png` | offen | Materialstandard | Blumen-/Trockenvariation | flach bis sanft; Makrorauschen bricht Wiederholung |
| Wald | `forest/forest_floor.png` | offen | Materialstandard | Gras an Waldrändern | Terrain-ID plus Waldprofil; Vegetation erzeugt Lesbarkeit |
| Fruchtbares Tal | `farm/farm_soil.png` | offen | Materialstandard | Wiese | auf fruchtbaren Terrain-IDs; warme Regionsfärbung |
| Trockene Ebene | `grass/terrain_grass_dry.png` | offen | Materialstandard | Fels und Wiese | Profilgewicht auf vorhandenen Ebenen |
| Rote Wüste | `desert/desert_sand_red.png` | offen | Materialstandard | trockene Ebene, Küste | weiches Profil Region 9; Vegetation stark reduziert |
| Sumpf | `swamp/swamp_mud.png` | offen | Materialstandard | Waldboden, Ufer | weiches Profil Region 29; Schilf/Totholz bevorzugt |
| Sandküste | bestehende Sandtextur | offen | Materialstandard | Kiesküste | Küstenmaske und Regionsprofil |
| Kies-/Felsküste | `coast/coast_pebbles.png` | offen | Materialstandard | Sand, Stein | stärker an Kaps/Klippenprofilen |
| Stein | bestehende Steintextur | offen | Materialstandard | Klippe | Terrain-/Höhengewicht |
| Klippe | bestehende Klippentextur | offen | Materialstandard | Bergbasis | Weltkoordinaten-Triplanar bei steilen Normalen |
| Bergfels | `mountain/mountain_rock_base.png` | offen | Materialstandard | Klippe, Schnee | Triplanar; alpine Profile erhöhen den Anteil |
| Schnee | `mountain/mountain_snow.png` | offen | Materialstandard | Bergfels | Höhe/Alpinprofil und obere Hangzone |
| Fluss | bestehendes Wasser + Flow-Overlay | nicht zutreffend | Wassermaterial | Ufer/Kies | gebündelte animierte Fläche folgt Nachbarachse |
| See/Ozean | bestehendes Wassermaterial | shaderbasiert | shaderbasiert | Küstenschaum | drei Wellenrichtungen plus Makromodulation |

## Importregeln

- Ziel für neue Materialpakete: 2048×2048, nahtlos, ohne eingebrannte Schatten,
  Schrift, Rahmen oder Perspektive.
- Tatsächliche v0.70-KI-Quellen sind 1254×1254 und werden im
  `WORLD_ASSET_MANIFEST.md` exakt so ausgewiesen.
- Dateinamen und Kategorien stehen zentral in
  `src/assets/terrainTextureManifest.ts`; fehlende Dateien dürfen den Renderer
  nicht zum Absturz bringen.
- PBR-Begleitmaps erst aktivieren, wenn Shader, Registry, Dokumentation und
  Screenshot-Smoke gemeinsam angepasst wurden.

