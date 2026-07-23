# UI-/Welt-Asset-Manifest v0.62

## World Rebuild 6.0 — gebackene Karten

| Datei | Größe | Verwendung | Quelle/Fallback |
|---|---:|---|---|
| `src/assets/ui/map/new_island_overview.png` | 512×512 | Inselübersicht/Regionskontext | `tools/bakeWorld.mjs`; dynamische Welt bleibt funktional |
| `src/assets/ui/minimap/new_island_minimap.png` | 512×512 | Minimap-Basis/Referenz | gleicher Bake; Live-Minimap zeichnet Terrain und Nebel aus Daten |
| `src/assets/ui/citywork/map/new_island_planning.png` | 512×512 | topografische Stadtarbeitsbasis | gleicher Bake; Straßen/Gebäude/Ziele bleiben dynamisch |

Alle drei Bilder stammen aus exakt demselben Höhen-, Terrain- und Wasserstand.
Sie enthalten keine dynamischen Gebäude oder Freischaltungen. Regionsvorschauen
nutzen reale Rendereransichten beziehungsweise die dokumentierten generischen
Heroes, bis ein automatischer Kamera-Batchrenderer ergänzt wird.

Alle Assets sind Drop-in-Dateien. Fehlt eine Datei, muss der vorhandene
Code-/Three-Fallback ohne Absturz übernehmen.

| Asset | Format / Größe | Einsatz | Fallback |
| --- | --- | --- | --- |
| `ui/brand/mayor_crest.png` | 256×256, ca. 87 kB | Level-/Bürgermeisterwappen | bestehendes Level-Badge |
| `environment/cloud_bank.webp` | 1024×1024, ca. 53 kB | Himmel und horizontaler Regionsnebel | prozedurale Canvas-Wolke |
| `ui/events/region_unlock_hero.webp` | 1280×720, ca. 171 kB | Hero der Regionsfreischaltung | CSS-Landschaftsgradient |
| `models/props/nature/boat_small.glb` | ca. 14 kB | Küsten-/Wasserlandmarke | prozedurales Boot |
| `models/props/nature/windmill_small.glb` | ca. 26 kB | fruchtbare Regionen | prozedurale Windmühle |
| `models/props/nature/lighthouse.glb` | ca. 24 kB | Küstenlandmarke | prozeduraler Leuchtturm |
| `portraits/merchants/merchant_1.png` | 512×512, ca. 609 kB | männliche Handelsrolle | `merchant.png`/Bürger-SVG |
| `portraits/merchants/merchant_2.png` | 512×512, ca. 532 kB | weibliche Handelsrolle | `merchant.png`/Bürger-SVG |
| `portraits/workers/buildingDept_1.png` | 512×512, ca. 579 kB | Bauamtsrolle | `buildingDept.png`/Bürger-SVG |
| `portraits/emergency/fire_1.png` | 512×512, ca. 561 kB | Feuerwehrrolle | `fire.png`/Bürger-SVG |
| `ui/regions/region_unlock_highland.jpg` | 1024×683, ca. 139 kB | Gebirge-/Hügelland-Hero | allgemeiner Regions-Hero/CSS |
| `ui/regions/region_unlock_fertile.jpg` | 1280×720, ca. 249 kB | Ebene-/Flusstal-/Fruchtland-Hero | allgemeiner Regions-Hero/CSS |
| `ui/regions/region_unlock_coast.jpg` | 1280×720, ca. 249 kB | Küste-/See-/Insel-Hero | allgemeiner Regions-Hero/CSS |
| `ui/weather/weather_cycle_premium.jpg` | 1800×600, ca. 309 kB | Sonne/Regen/Nebel im Atmosphärenfenster | CSS-Farbfläche plus prozedurale 3D-Atmosphäre |

## Bildgenerierung

Modus: integriertes Bildgenerierungswerkzeug.

### Bürgermeisterwappen

Promptkern: „HUD level crest; ornate civic mayor crest, stylized golden
compass-and-city emblem in a heraldic shield, crown/laurel, readable at 48–80
px, polished 3D game UI, no text.“ Das zunächst einfarbige Keying wurde lokal
transparent aufbereitet.

### Wolkenbank

Promptkern: „Reusable grayscale cloud alpha texture; painterly island-map
clouds and coastal mist, black background, white/light gray only, square, no
scenery, no text.“ Das Ergebnis wurde als kompaktes WebP eingebunden.

### Regions-Hero

Finaler Prompt:

> Stylized-concept, wide region-unlock hero for a premium city-builder:
> newly unlocked fertile island region with green meadows, winding river,
> pine woodland, distant mountains, small rustic settlement rooftops and
> coastline; painterly polished 3D render; warm late-morning light; maritime
> blue, forest green and restrained amber; landscape only, no UI, no text,
> no logo, no watermark.

Das zuletzt übermittelte Master-Mockup diente nur als Stil-/Farb-/Qualitätsreferenz.

### Rollenporträts v0.61

Gemeinsamer Promptkern:

> Square 512×512 premium stylized City Mayor Builder character portrait,
> head and shoulders, three-quarter view, polished painterly PC strategy-game
> illustration, warm rim light, dark navy-to-teal studio background with faint
> civic role motif, amber and maritime teal palette, centered with margin, no
> text, no letters, no logo, no watermark, no frame.

Rollenspezifische Ergänzungen:

- `merchant_1`: freundlicher männlicher Händler, Ende 30, dunkles welliges Haar,
  gepflegter Bart, ockerfarbener Mantel über tiefblaugrünem Hemd.
- `merchant_2`: kompetente Handelsvertreterin, Anfang 30, kupferfarbenes Haar,
  waldgrüne Jacke mit Amberbesatz.
- `buildingDept_1`: Bauamtsleiterin um 40, mitteldunkle Haut, Dutt,
  orangefarbene Arbeitsjacke, Bauplan und Zimmermannsbleistift.
- `fire_1`: erfahrener Feuerwehrleiter um 50, Schnurrbart,
  dunkelblauer Einsatzmantel und klassischer Helm.

### Hochland-Hero v0.61

Finaler Prompt:

> Cinematic 3:2 landscape hero for a premium PC city-building strategy game:
> newly discovered alpine highland at sunrise, broad fertile valley, bright
> layered gray mountains with snowlit summits, winding turquoise river, pine
> clearings, distant settlement and windmill, thin atmospheric cloud banks,
> optimistic painterly realistic-isometric concept art, maritime teal, forest
> green and warm amber, darker lower strip for overlay copy, no UI, people,
> text, logo or watermark.

Das Ergebnis wurde lokal auf 1024×683 skaliert und als JPEG mit Qualitätsstufe
86 gespeichert. Die Originale im Codex-Generierungsordner bleiben unverändert.

### Regionsvarianten v0.62

`region_unlock_fertile.jpg`:

> Premium cinematic region-unlock key art for a high-end PC city-builder UI:
> broad fertile alpine river valley, green and golden farmland, braided
> turquoise river, oak forest, gentle hills, distant European market town,
> roads, stone bridges, mountains, late-afternoon sun shafts, painterly
> realistic 3D strategy-game art, teal/emerald/gold, no text, logo or UI,
> 16:9.

`region_unlock_coast.jpg`:

> Premium cinematic region-unlock key art for a high-end PC city-builder UI:
> rugged alpine-island coast, sapphire sea, turquoise coves, rocky headlands,
> white surf, pine forest, winding road, tiny fishing harbor and lighthouse,
> dramatic mountain backdrop, painterly realistic 3D strategy-game art,
> teal/emerald/gold, no text, logo or UI, 16:9.

Beide Originale wurden auf 1280×720 skaliert und als JPEG mit Qualitätsstufe
88 eingebunden.

### Wetter-Panorama v0.62

Finaler Prompt:

> Premium cinematic three-panel panorama for a high-end PC city-builder UI,
> the exact same alpine island valley and European-style city from the same
> elevated isometric camera: bright sunny late morning, dramatic summer rain,
> cool silver morning fog; painterly realistic 3D key art, detailed miniature
> city, mountains, rivers, roads and farms, teal/emerald/gold, no people,
> text, logo, borders or UI, wide 3:1.

Das Original wurde auf 1800×600 skaliert und als JPEG mit Qualitätsstufe 88
eingebunden. Die drei Drittel bleiben bewusst in einer Datei, damit Geografie,
Kamera und Farbdramaturgie zusammengehören.

## 3D-Erzeugung

Die drei vorhandenen GLBs wurden aus textuellen Asset-Spezifikationen mit einem lokalen
generativen/prozeduralen Erzeugungsskript gebaut und anschließend über
`SCENIC_PROP_MODELS` registriert. Die vollständigen Text-zu-3D-Prompts stehen in
`src/assets/models/props/PROMPTS.md`.

v0.62 registriert zusätzlich `waterfall_cliff.glb`/`waterfall_small.glb`.
Solange keine Datei eingeworfen wurde, zeichnet der Renderer einen gedeckelten
prozeduralen Wasserfall aus Fels, Fall, Becken und Gischt. Das ist ein
Renderer-Fallback, kein behauptetes neues GLB.

Nach Modelländerungen:

`WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`

## Stadtarbeit-Fahrzeuge v0.65

Gemeinsamer Produktionsrahmen:

> Premium city-builder vehicle selection card cutout; one complete European
> logistics vehicle, three-quarter front-left view; polished stylized 3D game
> render, realistic proportions with slightly softened strategy-game shapes,
> warm studio key light and subtle cool rim light; centered with generous
> padding; perfectly flat solid #ff00ff chroma-key background; no floor,
> shadow, reflection, text, logo or watermark; do not use magenta on vehicle.

Varianten:

- `medium_truck.png`: mittlerer blauer zweiachsiger Cab-over-Liefer-LKW mit
  kompaktem geschlossenem Koffer.
- `large_truck.png`: großer roter dreiachsiger Cab-over-Schwerlast-LKW mit
  hohem geschlossenem Koffer.
- `refrigerated_truck.png`: weißer mittlerer Kühl-LKW mit deutlich lesbarem
  Dachkühlaggregat und zurückhaltenden eisblauen Akzenten.
- `heavy_transporter.png`: orange Schwerlastzugmaschine mit kurzem Tieflader und
  sauber verzurrter Industriekiste.

Werkzeugweg: eingebautes Bildwerkzeug. Freistellung lokal über den installierten
Imagegen-Helfer mit Border-Autokey, Soft Matte, Schwellen `12/220` und Despill.
Alle vier Projektdateien sind 1254×1254 RGBA mit transparenten Ecken; der
Renderer skaliert sie in den Fahrzeugkarten verlustfrei herunter.

## Stadtarbeit Redesign 4.0 — v0.69

20 freigestellte PNGs unter `src/assets/ui/citywork/`:

- Marker (512 px): `marker_source`, `marker_delivery`, `marker_resupply`,
  `marker_warehouse`, `marker_depot`, `marker_return_cargo`, `marker_optional`,
  `marker_blocked`.
- Cargo (512 px): `cargo_food`, `cargo_wood`, `cargo_stone`, `cargo_water`,
  `cargo_materials`.
- Berater (768 px): `advisor_logistics`, `advisor_traffic`.
- Missionen (768 px): `mission_food_route`, `mission_construction_route`,
  `mission_emergency_route`, `mission_trade_route`, `mission_return_cargo`.

Alle Motive wurden mit dem eingebauten Bildwerkzeug im Modus
`stylized-concept` auf flachem `#ff00ff`-Grund generiert und anschließend mit
Border-Autokey, Soft Matte (12/220) und Despill in RGBA überführt. Alpha wurde
für jede Datei geprüft. Vollständige Prompts, Rollen, Fallbacks und Drop-in-
Regeln stehen in den READMEs der sieben Stadtarbeit-Unterordner.

Die Laufzeit sucht rekursiv über `uiImage(Dateiname)`. Aktuell verwenden Karte,
Cargo, Berater und Auftragskarten diese Dateien. Marker für Depot, Rückware,
Option und Blockade sind vorbereitete Bilder, keine behauptete Gameplaylogik.
