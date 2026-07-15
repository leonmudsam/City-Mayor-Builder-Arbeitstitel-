# 3D-Welt-Assets — Zielbild, Struktur, Modelllisten, Prompts (v0.32)

Diese Datei ist die **verbindliche Bauanleitung** für die 3D-Welt in Richtung des
Referenzbildes: eine hochwertige, stilisierte Küsten-/Insel-City-Builder-Welt mit
Gebirge, Wald, Fluss, See, Küste, Meer, Stadtzentrum, Wohnvierteln, Feldern,
Straßen, Brücken, Ressourcenorten und Landmarken.

**Kernprinzip (Drop-in):** Du legst ein korrekt benanntes `.glb` in den passenden
Ordner unter `src/assets/models/…` → das Spiel nutzt es **automatisch** (rekursive
Erkennung, v0.32). Fehlt ein Modell, greift ein **prozeduraler Platzhalter** — das
Spiel bricht nie. **Kein Code-Change pro Modell.**

Ergänzt `docs/3D_MODELS.md` (Grundlagen Gebäude/Stufen/Live-Effekte) und
`docs/ISO_ASSETS.md`. Gameplay-Grid und Savegames bleiben unberührt.

---

## 1. Referenzbild — Analyse & Zonen

Das Bild zeigt eine zusammenhängende Landzunge/Insel mit klaren Zonen:

- **West / Links:** massives Gebirge mit steilen Felswänden, Tälern/Durchgängen,
  **Minen-/Tunneleingängen**, **Wasserfällen**, Flussquelle, dichtem Wald,
  Steinbruch/Ressourcenensemble (Hero-Gebirge).
- **Mitte:** **Stadtzentrum** mit Rathaus/Monument (Uhrturm) als Fokus, dichter
  werdende Wohnviertel (rote Dächer), **Marktbereich** (Markt-Marker), öffentliche
  Gebäude (Museum/Verwaltung), **Straßenraster mit Haupt- und Nebenachsen**,
  Plätze/Grünflächen, **freie Build-Zonen mit grün gestrichelten Rahmen + Werkzeug-
  Marker**.
- **Nord / Oben:** fruchtbare **Felder/Farmregion** (Weizen-Marker), Flusslauf mit
  **Brücke**, Waldübergänge.
- **Ost / Rechts:** felsige **Küste** und **Meer**, **Leuchtturm** auf Klippe,
  **Hafen/Schiff**, Küstenstraße, Strand-/Uferzonen.
- **Süd / Unten:** großer **See/Baggersee** (Wasser-Marker) mit Ufer/Strand, Wald,
  weitere Bauflächen, kleines Dock.
- **Gameplay-Symbole:** grüne Bau-/Werkzeugmarker auf freien Sektoren, blauer
  Wasser-Marker am See, oranger Handels-/Marktmarker, Verwaltungs-Marker.

**Ableitung — was ist was:**

| Kategorie | Aus dem Bild |
|---|---|
| **Terrain** | Gras/Wiese, fruchtbarer Boden, Wald-Boden, Fels, Gebirge, Sand/Ufer, Fluss, See, Meer, Klippen, Höhenstufen |
| **Hero-Terrain** | Gebirgsmassiv West, Wasserfall-Cluster, Flusstal, Seebecken, Küstenklippe, Hafenbucht |
| **Gebäude** | Rathaus, Wohnhäuser (mehrere Stufen), Markt, Museum/Verwaltung, Farm/Felder, Sägewerk, Steinbruch/Mine, Lager |
| **Landmarken** | Leuchtturm, Hafen, Schiff, Brücke, Monument, Mineneingang |
| **Props** | Bäume (Nadel/Laub), Büsche, Felsen, Zäune, Marktstände, Straßenlampen, Docks, Boote, Heuballen |
| **Roads/Bridges** | Haupt-/Wohnstraßen, Kreuzungen, Kurven, Brücken über Fluss/Straße |
| **Vehicles** | (impliziert) Autos/Lieferverkehr auf den Straßen, Schiff an der Küste |
| **Markers** | Build-/Werkzeug-, Wasser-, Handels-, Verwaltungs-Marker |
| **Effects** | Wasserfall-Gischt, Schornsteinrauch, bewegtes Wasser/Wellen |

**Sofort nötig (Prio 1):** Terrain-Grundkacheln (Gras/Fels/Sand/Wasser),
Straßensegmente, Häuser (klein/Reihe), Rathaus, Farm, Sägewerk, Steinbruch,
Bäume/Felsen, Basis-Marker. **Später sinnvoll (Prio 2):** Hero-Gebirge, Wasserfall,
Hafen, Leuchtturm, Brücken, Damm, große Plätze, Fahrzeuge, Ambient-Effekte.

**Prozedural vs. eigenes `.glb`:** Terrain-Kacheln, Straßen, einfache Marker,
Bäume/Büsche und Ambient-Effekte kann der Renderer prozedural/als Instanzen
ersetzen (tut er schon). **Als `.glb` lohnen sich** alle markanten Silhouetten:
Gebäude, Landmarken, Hero-Terrain, Brücken, Schiffe, große Props.

---

## 2. Einheitlicher Modellstandard

**Stil:** Low-Poly / stylized City-Builder, cartoonartig, farbenfroh, saubere
Silhouetten, weiche Kanten, warme Lichtwirkung — konsistent mit UI/Gebäudegrafik
und dem Referenzbild. Keine realistische, dunkle Simulation, keine High-Poly-Details.

**Technik (Pflicht):**
- Format **`.glb`**, Texturen **eingebettet**, keine externen Dateien.
- **Keine** Kameras, **keine** Lichter im Modell.
- **+Y = oben**, Vorderseite **+Z**.
- **Pivot mittig an der Unterkante** (X/Z zentriert, Unterkante Y = 0).
- **1 Tile = 1 Welt-Einheit**; Modell auf seinen Footprint skalierbar.
- Saubere Bounding-Box, keine großen Offsets, Ursprung korrekt.
- Dateiname **exakt** wie in dieser Doku (Kleinbuchstaben, `_`), **eindeutig**
  (der Dateiname ist der Key, auch über Unterordner hinweg).

**Größenrichtwerte (Footprint in Tiles):**
- 1×1 kleines Modell / Prop · 2×2 Wohnhaus · 3×3 Rathaus/Markt · 4×4 Marktplatz
- Mine 3×3 (am Gebirge) · Brücke variabel/modular · Hafen 6×6 oder modular
- Bergmodule 4×4 / 8×8 · **Hero-Gebirge 8×8–12×12** / gestufter Cluster ·
  Wasserfall-Cluster 4×4–8×8 · Farmfeld 3×3 oder modular 1×1.

**Poly-/Textur-Budget (Richtwerte, §22):**
| Typ | Tris | Textur |
|---|---|---|
| kleine Props | < 500 | ≤ 256² |
| kleine Gebäude | 500–2 000 | ≤ 512² |
| große Gebäude | 2 000–6 000 | ≤ 1024² |
| Landmarken | 6 000–12 000 | ≤ 1024² |
| Hero-Modelle | so niedrig wie möglich, ggf. **modular** | ≤ 1024², geteilt |
| Terrain-Chunks | größenabhängig, LOD bevorzugt | ≤ 1024² |

**LOD/Instancing:** Für Bäume/Felsen/kleine Props nutzt der Renderer **Instancing**
(bereits umgesetzt). Große Modelle bitte mit optionaler `model3dLod`-Variante
(Low-Poly) liefern; Culling außerhalb der Kamera ist vorbereitet. Varianten sparsam.

---

## 3. Ordnerstruktur (existiert, Drop-in-fähig)

```
src/assets/models/
  buildings/{housing,administration,economy,services,resources,energy,leisure,landmarks}/
  terrain/{tiles,cliffs,mountains,water,coast,biome,hero}/
  roads/
  bridges/
  props/{nature,city,construction,harbor,farm}/
  vehicles/
  markers/
  effects/
```

Die Erkennung ist **rekursiv**: eine `.glb` in *irgendeinem* Unterordner der
Kategorie wird gefunden (Key = Dateiname). Unterordner sind zur Ordnung da, nicht
für den Key. → Dateinamen projektweit **eindeutig** halten.

**Registry-Funktionen (schon vorhanden):** `buildingModel(id, stage)`,
`terrainModel(name)`, `roadModel(name)`, `bridgeModel(name)`, `propModel(name)`,
`vehicleModel(name)`, `markerModel(name)`, `effectModel(name)`.

---

## 4. Modell-Registry pro Asset (`BuildingDef.visual`)

Jedes Gebäude kann mehrere Visual-Varianten referenzieren (alle optional):

```ts
visual: {
  cardArt?: string;        // Baumenü-Bild (2D)
  sheetArt?: string;       // Detail-Sheet-Bild (2D)
  mapSprite2d?: string;    // 2D-Karten-Sprite
  isoPreview?: string;     // Iso-Sprite
  model3d?: string;        // explizite .glb (überschreibt id-Lookup)
  model3dLod?: string;     // Low-Poly-LOD
  fallbackModel?: string;  // Ersatzmodell, falls Hauptmodell fehlt
  scale?: number;          // Feinskalierung nach Auto-Fit
  rotationOffset?: number; // Y-Rotation (rad), Front-Korrektur
  footprintVisualOffset?: { x: number; y: number; z: number };
  sizeClass?: 'flat'|'low'|'medium'|'high'|'landmark'|'hero';
  heightClass?: number;    // Platzhalter-Höhe (prozedural)
  stages?: BuildingVisual[]; // je Ausbaustufe
}
```

**Auflösungsreihenfolge (Karte, 3D):** `visual.model3d` → `buildings/<id>.glb`
(bzw. `<id>_stage<N>.glb`) → `visual.fallbackModel` → **prozeduraler Block**.
`scale`/`rotationOffset`/`footprintVisualOffset` werden vom Renderer angewandt.

**Für Terrain/Props (geplantes `worldVisual`, dokumentiert):**

```ts
worldVisual: {
  model3d?: string; fallbackModel?: string;
  biome?: string; variant?: string;
  scale?: number; randomRotation?: boolean; randomScale?: boolean;
  clusterType?: 'single' | 'patch' | 'strip' | 'hero';
}
```

Heute erzeugt der Renderer Terrain/Vegetation prozedural mit Instancing +
Zufallsrotation/-skalierung; `worldVisual` ist die dokumentierte Erweiterung, um
diese durch `.glb` zu ersetzen (Folge-Slice, kein Migrationsbedarf).

---

## 5. Fallback-Regeln

| Typ | Fallback, wenn Modell fehlt |
|---|---|
| Gebäude | prozeduraler Block (Wände + Dach, Kategorie-Farbe, Stufenhöhe) |
| Terrain | farbige, leicht reliefierte Kachel (Instancing) |
| Wasser | blaue, tiefergelegte Kachel |
| Straße | prozedurales Auto-Tiling (Fahrbahn + Bordstein + Markierung) |
| Brücke | Straßensegment über der Wasserkachel |
| Prop (Baum/Busch/Fels) | Low-Poly-Instanz (Kegel/Zylinder) |
| Fahrzeug | geformtes Auto/Van-Mesh |
| Marker | farbcodiertes Billboard (Canvas-Textur) |
| Hero-Asset | Cluster kleinerer prozeduraler Teile / mehrere Standardkacheln |

Fallbacks bleiben **spielbar**, wirken aber klar als Platzhalter.

---

## 6. Stil-Prefix für alle Prompts

> `Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean
> shapes, soft bevels, hand-painted feel, optimized for realtime rendering,
> embedded textures, no lights, no cameras, centered object, pivot at bottom
> center, +Y up, front facing +Z —`

Für Text-zu-3D-Tools (Meshy, Rodin, Tripo, Luma, Alpha3D): Prefix + Motiv, als
`.glb` exportieren, Dateiname exakt wie unten, in den Zielordner legen.

---

## 7. Terrain-Kacheln → `terrain/tiles/`

| Datei | Footprint | Motiv |
|---|---|---|
| `grass_tile.glb` | 1×1 | flache grüne Wiesenkachel, leichte Mikrostruktur, kachelbar |
| `grass_tile_variant_01.glb` | 1×1 | Gras mit Grasbüscheln/kleinen Steinen |
| `grass_tile_variant_02.glb` | 1×1 | Gras mit Blumen/Unebenheit |
| `fertile_ground_tile.glb` | 1×1 | gepflügter fruchtbarer Ackerboden |
| `forest_ground_tile.glb` | 1×1 | Waldboden mit Moos/Wurzeln |
| `rock_ground_tile.glb` | 1×1 | steiniger grauer Boden |
| `mountain_ground_tile.glb` | 1×1 | steiler Felsboden |
| `sand_tile.glb` | 1×1 | Sand/Strand |
| `shore_tile.glb` | 1×1 | Ufer: Gras trifft Wasser |
| `locked_sector_tile.glb` | 1×1 | vernebelte/eingezäunte gesperrte Fläche |
| `buildable_sector_tile.glb` | 1×1 | grün markierte Baufläche |
| `city_center_ground_tile.glb` | 1×1 | gepflasterter Platz-/Stadtboden |

Ziel: Variation pro Terrain, klare Biome, saubere Übergänge Natur↔Stadt.

## 8. Wasser → `terrain/water/`

`river_straight`, `river_curve`, `river_fork`, `river_source`, `river_mouth`,
`lake_center`, `lake_edge`, `ocean_tile`, `coast_rocky`, `coast_sandy`,
`waterfall_small`, `waterfall_large` (je `.glb`, 1×1 bzw. Cluster). Motive: fließend
blaues Flusswasser (kachelbar), ruhige Seefläche, Meer mit leichter Welle, felsige/
sandige Küste mit Übergang, Wasserfall mit Gischt-Anschluss (Effekt separat).

## 9. Gebirge & Felsen → `terrain/mountains/` + `terrain/cliffs/`

`mountain_peak_large/medium`, `mountain_cluster_large/medium`,
`mountain_wall_straight/corner`, `mountain_valley_pass`, `mountain_tunnel_entrance`,
`cliff_edge`, `cliff_corner`, `rock_spire`, `rock_small/medium/large`. Ziel: echtes
Gebirge mit Tälern/Durchgängen und Ressourcenorten — **nicht** flache graue Blöcke.

## 10. Hero-Terrain → `terrain/hero/`

`hero_mountain_range_west` (8×8–12×12), `hero_waterfall_cluster` (4×4–8×8),
`hero_river_valley`, `hero_lake_basin`, `hero_coastal_cliff`, `hero_harbor_bay`,
`hero_forest_ridge`, `hero_fertile_valley`, `hero_dam_site`. Große, prägende
Weltformen, die die Map gliedern und Orientierung geben (modular bevorzugt).

## 11. Natur-Props → `props/nature/`

`pine_tree`, `pine_tree_large`, `tree_deciduous`, `tree_deciduous_large`,
`forest_cluster_small/medium`, `bush_small/medium`, `grass_patch`, `flower_patch`,
`fallen_log`. Random Rotation/Scale, Instancing, **nie unter Gebäude/Straße**
(Culling aktiv). Waldränder organisch (`clusterType: patch/strip`).

## 12. Straßen → `roads/` · Brücken → `bridges/`

Roads: `road_straight`, `road_curve`, `road_t_intersection`,
`road_cross_intersection`, `road_end`, `road_slope`, `road_bridge_entry`,
`road_main_straight`, `road_main_curve`, `road_main_cross`, `sidewalk_straight`,
`sidewalk_corner`, `driveway_small`. Bridges: `bridge_small_stone`,
`bridge_small_wood`, `bridge_medium_road`, `bridge_large_road`, `bridge_rail_future`.
Der Renderer wählt das Segment automatisch aus der Nachbar-Maske (Fallback:
prozedurales Auto-Tiling); Haupt-/Wohnstraße über die vorbereitete `RoadClass`.

## 13. Gebäude (aus BuildingDefs)

**Wohnen** `buildings/housing/`: `house_small`, `house_small_level_2`,
`duplex_house`, `row_house`, `row_house_level_2`, `apartment_house`,
`apartment_house_level_2`, `residential_block`, `residential_tower`,
`skyscraper_residential`.
**Verwaltung** `buildings/administration/`: `town_hall`, `town_hall_level_2`,
`citizen_house`, `mayor_house`, `market_square`, `city_center_plaza`.
**Wirtschaft** `buildings/economy/`: `market`, `supermarket`, `trade_office`,
`office_small`, `office_medium`, `office_tower`, `commercial_block`.
**Ressourcen** `buildings/resources/`: `farm`, `farm_level_2`, `farm_field_wheat`,
`farm_field_vegetables`, `sawmill`, `sawmill_level_2`, `quarry`, `quarry_level_2`,
`warehouse`, `warehouse_large`, `mine_entrance`.
**Versorgung** `buildings/services/`: `well`, `water_pump`, `water_treatment`,
`fire_station`, `police_station`, `clinic`, `hospital`, `school`.
**Energie** `buildings/energy/`: `wind_park`, `wind_turbine`, `coal_power_plant`,
`solar_field`, `substation`, `hydro_plant`, `dam`.
**Freizeit** `buildings/leisure/`: `playground`, `park_small`, `park_medium`,
`central_park_piece`, `fountain`, `sports_field`, `campground`, `beach_activity`,
`river_kayak_station`.
**Landmarken** `buildings/landmarks/`: `lighthouse`, `harbor_small`, `harbor_pier`,
`ship_sailing`, `monument_city`, `museum`, `stadium`, `observation_tower`,
`mountain_tunnel_landmark`.
**Hero-Bauten** `buildings/landmarks/`: `hero_city_hall_plaza`,
`hero_market_district`, `hero_harbor_complex`, `hero_lighthouse_cliff`,
`hero_grand_bridge`, `hero_mine_complex`, `hero_dam_complex`, `hero_central_park`,
`hero_waterfront_district`.

> Der **Dateiname muss zur Gebäude-ID passen** (`buildings.config.ts`), damit die
> Karte das Modell automatisch zieht. Weicht die Wunschdatei ab, per
> `visual.model3d` verknüpfen. Ausbaustufen: `<id>_stage<N>.glb` **oder** Auto-Skalierung.

## 14. City-/Hafen-/Farm-Props

`props/city/`: `street_lamp`, `bench`, `trash_bin`, `mailbox`, `fence_wood`,
`fence_stone`, `road_sign`, `traffic_light`, `construction_crane`,
`construction_barrier`, `market_stall`, `flower_bed`, `small_fountain`.
`props/harbor/`: `pier_wood`, `boat_small`, `boat_sail`, `dock_crate`, `dock_barrel`.
`props/farm/`: `hay_bale`, `tractor_small`, `farm_fence`, `crop_row`, `water_trough`.
`props/construction/`: Kran/Gerüst/Absperrung für Baustellen. Zweck: Zonen
definieren, leere Flächen brechen — visuelle Weltstruktur, nicht nur Deko.

## 15. Fahrzeuge → `vehicles/`

`car_small`, `car_van`, `truck_food`, `truck_material`, `service_van`, `firetruck`,
`police_car`, `ambulance`, `bus_small`. Klein, lesbar, performant; Pivot mittig
unten, Front +Z. Fahren später echte Routen (Verkehr/Missionen bereits vorhanden).

## 16. Marker → `markers/` (3D) — Alternativen erklärt

`marker_buildable`, `marker_locked`, `marker_water`, `marker_trade`,
`marker_government`, `marker_problem`, `marker_task`, `marker_bonus`,
`marker_resource`. **Drei Marker-Arten unterscheiden:**
- **3D-Marker** (`.glb` in `markers/`) — schweben in der Welt, kippen mit ihr.
- **Billboard-Marker** (Standard heute, Canvas-Textur) — immer zur Kamera gerichtet,
  farbcodiert, rotationssicher. Empfohlen für Gebäude-Zustände.
- **UI-Marker** (HUD/Panels, React/SVG) — bildschirmfixiert.
Fallback ist immer das Billboard.

## 17. Effekte & Weltleben → `effects/` (+ Partikel-Hinweise)

`smoke_chimney`, `waterfall_mist`, `construction_spark`, `upgrade_glow`,
`building_complete_effect`, `fire_response_effect`, `police_patrol_effect`,
`trade_delivery_effect`, `tree_wind_sway_effect`, `water_surface_motion_effect`,
`bird_flock_effect`, `harbor_wave_effect`. Vieles ist als **Partikel/Shader**
sinnvoller als `.glb`:
- **Heute im Renderer:** Schornsteinrauch (Partikel), drehende Windräder, fahrender
  Verkehr, Missions-Lieferwagen, pulsierende Marker.
- **Geplant (Partikel/Shader, kein `.glb`):** leicht bewegte Wasseroberfläche,
  Wasserfall-Gischt, Küstenwellen, Wind-Sway in Bäumen, Vogelschwärme, nachts
  leuchtende Fenster. `.glb` nur für feste Effekt-Meshes.

## 18. Sektor-/Build-Zonen-Assets → `markers/` bzw. `terrain/`

`sector_border_unlocked.glb`, `sector_border_locked.glb`, `sector_marker_build.glb`,
`sector_marker_resource.glb`. Sektorstatus: `locked` (markiert, nicht nur dunkel),
`unlockable`, `unlocked`, `buildable`, `special biome`. Bei Freischaltung:
Highlight/Animation + Kamerafokus (Fokus-Hook vorhanden). Build-Zonen visuell
attraktiv mit gestricheltem Rahmen (wie im Referenzbild).

## 19. Welt nicht-statisch / Features in der Map (§3, §16, §18)

Damit die Map nicht wie ein Kachelbrett wirkt, gehören **Features zwischen die
Bauplätze**: kleine Waldlichtungen, Felder mit Wegen, Bachläufe/Nebengewässer,
Felsgruppen, Aussichtspunkte, Küstenpfade, Brückenansätze, Platz-/Parksegmente,
Marktstände, Deko-Inseln, Stadteingänge, Wegkreuze, Geländebrüche, kleine Docks,
gebirgsnahe Engstellen, Minenzufahrten, kleine Landmarken außerhalb der Stadt.

**Terrain-Daten (dokumentierte Erweiterung, kein Migrationszwang):**
```ts
terrain: { type: TerrainType; biome: BiomeType; height: number;
  slope?: SlopeType; waterDepth?: number; variant?: string; }
```
Das **Gameplay-Grid bleibt** — die Optik darf organischer sein als die Logik
(Höhenstufen, Klippen, tieferer Fluss, Küstenübergänge, Felsen), solange
Platzierung weiter auf validen Tiles passiert. Die Zonen (West/Mitte/Nord/Ost/Süd)
sollen **handdesignt oder halb-handdesignt** definierbar sein, nicht rein random.

## 20. Visuelle Konsistenz (§23)

`cardArt` (Baumenü) · `sheetArt` (Detail) · `model3d` (Karte) · `stages`/
`<id>_stage<N>` (Upgrade-Optik) gehören je Gebäude zusammen: gleiche Form, Farben,
Silhouette — der Spieler erkennt sein Gebäude in UI und Welt wieder, Upgrades zeigen
sichtbare Entwicklung.

## 21. Beispiel-Prompts (Auszug)

```
Datei: src/assets/models/buildings/housing/house_small.glb  (Footprint 2×2)
<Stil-Prefix> small cozy family house with a red pitched roof, chimney, tiny
front garden, warm windows, readable from an isometric camera.

Datei: src/assets/models/buildings/administration/town_hall.glb  (3×3)
<Stil-Prefix> a grand town hall with a clock tower, columns, a flag and a red
roof, small plaza in front.

Datei: src/assets/models/terrain/hero/hero_mountain_range_west.glb  (8×8+, modular)
<Stil-Prefix> a large stylized rocky mountain range with steep cliffs, a valley
pass and a tunnel/mine entrance, layered peaks, snow-free, low-poly.

Datei: src/assets/models/terrain/water/waterfall_large.glb  (4×4–8×8)
<Stil-Prefix> a tall cascading waterfall over rocky cliffs into a pool, stylized
foam at the base, low-poly.

Datei: src/assets/models/terrain/hero/hero_harbor_bay.glb  (6×6, modular)
<Stil-Prefix> a coastal harbor bay with wooden piers, small docks and calm water,
rocky shoreline, low-poly.

Datei: src/assets/models/buildings/landmarks/lighthouse.glb  (2×2)
<Stil-Prefix> a red-and-white striped lighthouse on a rocky base with a lantern room.

Datei: src/assets/models/bridges/bridge_medium_road.glb  (modular)
<Stil-Prefix> a stylized stone road bridge with arches, sidewalks and railings.

Datei: src/assets/models/buildings/administration/market_square.glb  (3×3–4×4)
<Stil-Prefix> a lively market square with striped stalls, crates, a fountain and
paved ground.

Datei: src/assets/models/buildings/energy/dam.glb  (4×4+)
<Stil-Prefix> a concrete hydro dam across a river valley with spillways and a small
control building.

Datei: src/assets/models/props/nature/pine_tree.glb  (1×1)
<Stil-Prefix> a single stylized low-poly pine tree, slightly irregular.
```

Analog für alle Modelle aus §7–§18: Motiv + gewünschte Größe/Footprint an den
Prefix hängen. Varianten (`_variant_01`, `_large`, `_level_2`) mit klarer Abwandlung.

## 22. Workflow — nur Modelle ablegen

1. Modell als `.glb` erzeugen (Standard aus §2 einhalten).
2. In den dokumentierten Ordner legen, **Dateiname exakt** wie hier.
3. `npm run build` (oder `npm run dev`).
4. Das Spiel nutzt das Modell automatisch (rekursive Erkennung).
5. Fehlt es, greift der Platzhalter. **Kein Code-Change nötig.**

## 23. Empfohlene Startreihenfolge

1. `house_small`, `house_row` (row_house), `town_hall`, `farm`, `sawmill`,
   `quarry` — die häufigsten Gebäude.
2. `grass_tile` (+1–2 Varianten), `road_straight`/`road_cross`, `pine_tree`,
   `rock_medium` — Grundwelt.
3. Hero: `hero_mountain_range_west`, `waterfall_large`, `lighthouse`,
   `harbor_small`, `bridge_medium_road` — Landmarken/Weltcharakter.
4. Danach schrittweise Rest je Zone (West→Mitte→Nord→Ost→Süd).
