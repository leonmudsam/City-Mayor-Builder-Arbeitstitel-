# World Asset Manifest — Terrain 6.1 / Infrastruktur 7.0

Stand: 22. Juli 2026

## Wasser-, Hafen- und Horizontassets 7.0

| Asset | Drop-in-Pfad | Status | Fallback |
|---|---|---|---|
| Kleiner Anleger | `src/assets/models/buildings/resources/dock_small.glb` | Laufzeit verdrahtet | prozeduraler Holz-/Steinkai |
| Flusshafen | `src/assets/models/buildings/resources/river_port.glb` | Laufzeit verdrahtet | prozeduraler Kai, Lager, Kran |
| Straßenproblem | `src/assets/models/markers/marker_problem_road.glb` | optional verdrahtet | Canvas-Straßensymbol |
| Wasserproblem | `src/assets/models/markers/marker_problem_water.glb` | optional verdrahtet | Canvas-Ankersymbol |
| Teilnetzproblem | `src/assets/models/markers/marker_problem_network.glb` | optional verdrahtet | Canvas-Netzsymbol |
| Schiffsflotte | `src/assets/models/vehicles/{cargo_boat_small,ferry_small,service_boat,cargo_barge,river_freighter,ferry_medium,cargo_ship,passenger_ship,construction_barge}.glb` | vollständig spezifiziert, noch nicht simuliert | keine vorgetäuschte Fahrt |
| Fern-Ozean | prozedurales radiales Mesh | live | kein Pflichtasset |
| Ferninseln | prozedurale unregelmäßige Ringmeshes | live, rein kosmetisch | starker Distanznebel |

Gebäudepfade werden rekursiv per ID erkannt. Die Wasserfahrzeuge werden erst mit
einem kanonischen Schiffs-/Routenmodell laufzeitverdrahtet; ihr heutiger Eintrag
ist ein verbindlicher Authoringvertrag, keine versteckte Simulation. Vollständige
Footprints und Anschlusskonventionen: `HARBOR_SYSTEM_PLAN.md`.

## Terrain & World Scale 6.1 — aktive Weltquelle

| Asset | Pfad | Status | Laufzeit |
|---|---|---|---|
| Neue Insel-Source | `reference/world/island 3d new.glb` | verbindliche Authoring-/Bakequelle, SHA-256 `63cb…c917` | wird nie geladen |
| Alte Insel-Source | `reference/stylized island map 3d model.glb` | kein Verbraucher; Archivierung erst nach Git-Sicherung | wird nie geladen |
| Höhen-/Terrainbake | `src/game/config/world/island*.gen.ts`, `src/renderer/three/world*.gen.ts` | aktiv, gemeinsam generiert | synchron/performant |
| Große Gipfelmodule | frühere `MOUNTAIN_FEATURE_MODELS` | für Hauptsilhouette entfernt | kleine Felsdetails bleiben erlaubt |

Die neue Source ist absichtlich nicht im rekursiv erkannten `src/assets`-Baum.
`tools/bakeWorld.mjs` ist der einzige Verbraucher. Ein abweichender Source-Hash
muss Audit, Bake, Tests und Kartenassets gemeinsam aktualisieren.

## Neue 2048er Terrainbibliothek

Vier Stilvorlagen wurden im Modus `generate` aus den Nutzer-Screenshots als
Referenz erzeugt: facettierter Granit, frische Low-Poly-Wiese, dunkler
Mischwaldboden und zugängliches Ufer. `tools/processTerrainTextures.ps1`
skaliert/variiert diese Vorlagen deterministisch und erzeugt ausgewählte
Normal-, Roughness- und AO-Maps.

| Familie | Farbtexturen | Zusatzmaps | Aktiv im Shader |
|---|---:|---:|---|
| Gebirge | 9 | Normal/Roughness/AO für Granit und Klippe | Granit, Klippe, Schichten, Schnee |
| Gras | 8 | Normal/Roughness/AO für Frischwiese | Frischwiese; Varianten in Manifest |
| Wald | 6 | Normal/Roughness/AO für Moosboden | Moosboden + AO |
| Ufer | 4 | Normal/Roughness/AO für zugängliches Ufer | zugängliches Ufer |
| Regionale Ergänzungen | 3 | über Basismaterial vorbereitet | Steppe, Fruchttal; Moorprofil |

Die vollständigen Dateinamen, Ordner und Prompts stehen testgesichert in
`docs/TERRAIN_TEXTURES.md`. Die älteren 1254er 5.0-Quellen bleiben als
kompatible Drop-ins erhalten, sind aber nicht mehr der Standardlayer.

## Atmosphäre und Regionsnebel (v0.71)

| Asset | Pfad | Nutzung | Fallback |
|---|---|---|---|
| Wolkenbank | `src/assets/environment/cloud_bank.webp` | Alpha-Maske für drei driftende Decklagen über gesperrten Regionen; zusätzlich vorhandene Himmelsnutzung | blickdichte Materialdecke und instanzierte Wolkenellipsoide bleiben ohne Bild aktiv |

Die Schloss-/Level-Tafel ist bewusst kein separates Bitmap: Der Renderer erzeugt
sie aus lokalisiertem Regionsnamen und Config-Level als Canvas-Textur. Auch die
Minimap-Wolkenmaske ist deterministisch prozedural. Dadurch gibt es keine neue
Pflichtdatei und keinen Parallelpfad zur Drop-in-Registry.

## Historische 5.0-Texturen

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

| Motiv | Primärname | Modellprompt | Status v0.71 |
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
