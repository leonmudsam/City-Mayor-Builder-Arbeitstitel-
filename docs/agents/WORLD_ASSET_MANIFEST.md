# World Asset Manifest — Map Redesign 5.0

Stand: 21. Juli 2026

## Neu generierte und aktive Texturen

Alle sechs Bilder wurden mit dem integrierten Bildgenerator im Modus
`generate` als quadratische, nahtlos gedachte Base-Color-Vorlage erzeugt. Die
tatsächliche Quelldatei hat jeweils **1254×1254 px**; sie wird hier bewusst nicht
als 2048er-PBR-Paket ausgegeben.

| Asset | Pfad | Prompt-Kern | Status |
|---|---|---|---|
| Bergfels | `src/assets/textures/terrain/mountain/mountain_rock_base.png` | stilisierter heller Alpenfels, kantige Schichtung, dezente Moosspuren, orthografisch, kachelbar, ohne Schatten/Text | live |
| Bergschnee | `src/assets/textures/terrain/mountain/mountain_snow.png` | kompakter alpiner Schnee mit sanfter kristalliner Variation, kachelbar, ohne Beleuchtung | live |
| Roter Wüstensand | `src/assets/textures/terrain/desert/desert_sand_red.png` | Terrakotta-Sand und flache Sandsteinplatten, kachelbar, neutral beleuchtet | live |
| Sumpfboden | `src/assets/textures/terrain/swamp/swamp_mud.png` | dunkler Torf, olivfarbener Schlamm, Moos und feuchte Fugen, kachelbar | live |
| Wiese | `src/assets/textures/terrain/grass/grass_meadow.png` | natürliche mittlere Grünwiese mit offenen Grasclustern, kachelbar | live |
| Küstenkies | `src/assets/textures/terrain/coast/coast_pebbles.png` | abgerundete Küstensteine und Schotter, kachelbar, orthografisch | live |

Gemeinsame Negativvorgaben: keine Schrift, keine Icons, kein Rahmen, keine
Perspektive, kein Objektfokus, keine harten Schatten, keine gespiegelte Symmetrie.

## Vorhandene KI-/Drop-in-Modelle, jetzt stärker genutzt

| Familie | akzeptierte Namen | Nutzung | Fallback |
|---|---|---|---|
| Nadelbaum | `pine_tree`, `tree_pine_large`, `pine_tree_large` | Waldkern, Gebirgsrand | instanzierter prozeduraler Baum |
| Laubbaum | `tree_deciduous`, `broadleaf_tree_medium`, `broadleaf_tree_large` | Grasland, Mischwald, Solitär | instanzierter prozeduraler Baum |
| Busch | `bush_small` | Wald-/Wiesenunterwuchs | instanzierter Busch |
| Boot | `boat_small` und Manifest-Aliasse | Küste/See | prozedurales Boot |
| Windmühle | `windmill_small` und Aliasse | Fruchttal | prozedurale Windmühle |
| Leuchtturm | `lighthouse` und Aliasse | Kap/Küste | prozeduraler Leuchtturm |
| Wasserfall | `waterfall_cliff` und Aliasse | Gebirge/Flusstal | prozeduraler Wasserfall |

## Neue Drop-in-Slots mit aktivem Fallback

| Motiv | Primärname | Modellprompt | Status v0.70 |
|---|---|---|---|
| Felsbogen | `landmark_rock_arch.glb` | stilisierter natürlicher Felsbogen aus hellem geschichtetem Küstengestein, asymmetrisch, 3×2 Kacheln, Pivot mittig unten, wenige Materialien | Fallback live, GLB offen |
| Alter Solitärbaum | `landmark_old_tree.glb` | großer knorriger Laubbaum mit breiter unregelmäßiger Krone und sichtbaren Wurzeln, 2×2 Kacheln, Pivot unten | Fallback live, GLB offen |
| Kleine Ruine | `landmark_ruin_small.glb` | verwitterte kleine Steinruine mit gebrochenem Bogen, bewachsen, 2×2 Kacheln, ohne moderne Requisiten | Fallback live, GLB offen |
| Rote Felsnadel | `landmark_desert_spire.glb` | hohe asymmetrische Terrakotta-Felsnadel mit horizontaler Schichtung, 2×2 Kacheln, optimierte Silhouette | Fallback live, GLB offen |
| Sumpfurbaum | `landmark_swamp_tree.glb` | alter kahler Moorbaum mit weit sichtbaren Ästen und Wurzelknien, 2×2 Kacheln, keine Blätter | Fallback live, GLB offen |
| Seeinsel | `landmark_lake_islet.glb` | kleine felsige Seeinsel mit drei gemischten Bäumen und Schilfkante, 3×3 Kacheln | Fallback live, GLB offen |
| Felscluster | `rock_cluster_small.glb`, `mountain_boulder.glb` | unregelmäßige helle Felsgruppe, niedrige Polygonzahl, zufällig rotierbar, 1×1 Kachel | prozedurale Instanz live, GLB offen |
| Schilf | `swamp_reed_cluster.glb`, `reeds_water.glb` | lockerer Schilf-/Rohrkolbencluster, dünne Silhouette, 1×1 Kachel | prozedurale Instanz live, GLB offen |
| Totholz | `dead_branch.glb`, `swamp_log.glb` | dunkler verwitterter Ast beziehungsweise liegender Moorstamm, 1×1 Kachel | prozedurale Instanz live, GLB offen |

## Technische Modellvorgaben

- GLB/glTF 2.0, Y oben, Vorderseite +Z falls relevant, Pivot mittig am Boden.
- Maßstab gemäß `modelManifest.ts`; Landmarken maximal wenige Materialien und
  gebackene Texturen, Vegetation instancing-tauglich.
- LOD-freundliche Silhouette, keine unnötigen Innenflächen, keine externen
  Texturpfade. Dateiname allein aktiviert das Modell über die Registry.
- Neue Namen zuerst im zentralen Manifest ergänzen und anschließend
  `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` ausführen.

