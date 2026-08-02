# 3D-Modell-Manifest — Namens-Index (v0.40 — World Graphics V2)

> **Statuskorrektur v0.74:** Es gibt ausschließlich die 3D-Karte und bereits
> mehrere aktive GLBs, unter anderem Baum-, Boot-, Windmühlen- und
> Leuchtturmassets. Die unten stehenden historischen Aussagen zu drei Kartenmodi
> oder „keinen GLBs“ sind überholt. Aktive und geplante Namen werden aus
> `src/assets/modelManifest.ts` in die Ordner-READMEs/PROMPTS generiert; neue
> Map-5.0-Slots und Fallbackstatus stehen in
> `docs/agents/WORLD_ASSET_MANIFEST.md`.

**Die kurze, testgeprüfte Namens-Autorität.** Ein Gebäude hier eintragen → das
korrekt benannte `.glb` in den Ordner legen → das Spiel nutzt es automatisch
(rekursive Erkennung, Key = Dateiname). Fehlt es, greift ein **prozeduraler
Platzhalter** — das Spiel bricht nie.

- **Gebäude-Sektion (§1)** ist aus `src/game/config/buildings.config.ts`
  abgeleitet und muss synchron bleiben. `tests/manifest.test.ts` schlägt fehl,
  wenn ein Gebäude in der Config fehlt/hinzukommt, ohne dass es hier steht.
- **Die vollständige Spezifikation** (Footprint, Höhe, Pivot, Front,
  Größenklasse/Budget, Platzierung, Biom, Animationen, Live-/Geplant-Status) für
  **jedes** Modell — aktuell verdrahtet *und* geplant, inkl. Gebirge, Flüsse,
  Küste, Hero-Landmarken, Straßen-Geländeanpassung, Sektor-Nebel/Bürgerhinweise —
  steht **generiert** in `src/assets/models/<ordner>/PROMPTS.md`. Diese Datei
  hier ist **nur der Namens-Index**, keine Zweitquelle. Stilstandard,
  Zielbild und Konzepte für noch ausstehende Phasen: `docs/3D_WORLD_ASSETS.md`.

**Drei Kartenmodi** (Einstellungen → Kartenansicht): **2D-Raster**, **Isometrisch**
und **3D**. Der 3D-Modus rendert Terrain, Gebäude, Bäume, Schatten,
Straßenverkehr und Schornsteinrauch in einer perspektivischen Szene und
funktioniert **schon ohne ein einziges 3D-Modell** — fehlende Gebäude erscheinen
als prozeduraler Block (Wände + Dach, Höhe nach Ausbaustufe). Steuerung:
**Ziehen/Rechtsklick-Ziehen = schwenken**, **Mausrad = zoomen**, **Umschalt +
Ziehen = drehen/neigen**, **Klick auf Gebäude = auswählen** (ausführlich:
`docs/3D_CAMERA_CONTROLS.md`).

**Benannte Nodes für Live-Effekte** (optional, aber empfohlen): benenne die
entsprechende Mesh/Group im 3D-Tool exakt so, damit der Renderer sie belebt —
`rotor` dreht sich dauerhaft (Windrad, Mühle, Ventilator), `chimney` ist der
Ursprung für aufsteigenden Rauch, solange das Gebäude aktiv produziert. Fehlt der
Node, passiert nichts Schlimmes — der Effekt entfällt einfach. Reserviert für
später: `door`, `crane`, `sign`, `light_window`.

**Stand:** Noch keine `.glb` abgelegt → überall Platzhalter aktiv. Die
Renderer-Anbindung ist **live**: sobald eine korrekt benannte Datei im Ordner
liegt, nutzt der 3D-Renderer sie automatisch. Welche Namen der Renderer aktuell
akzeptiert, steht in **§0**.

---

## 0. Renderer-Anbindung — was JETZT automatisch geladen wird

Der 3D-Renderer liest diese Kategorien direkt aus der Drop-in-Pipeline. **Erster
passender Name gewinnt** (Präzis vor Alias). Alles ohne Modell bleibt prozedural.

> **Pro Ordner gibt es zusätzlich zwei auto-generierte Dateien** direkt neben den
> Modellen: **`README.md`** (die aktuell akzeptierten Namen für diesen Ordner)
> und **`PROMPTS.md`** (die **vollständige Spezifikation** + copy-paste-fertige
> Text-zu-3D-Prompts — aktuelle *und* geplante Modelle, bei Gebäuden ein Eintrag
> pro Config-Gebäude). Quelle ist `src/assets/modelManifest.ts`
> (+ `buildings.config.ts`); `tests/modelReadmes.test.ts` hält beide synchron.
> Neue Namen/Motive/Spezifikation dort ergänzen →
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`.

| Kategorie | Ordner | Akzeptierte Dateinamen (Priorität → ) | Ausrichtung / Hinweis |
|---|---|---|---|
| Terrain-Kachel Gras | `terrain/…` | `grass_tile` → `grass` | 1×1, ersetzt farbige Kachel |
| Terrain-Kachel Wald | `terrain/…` | `forest_ground_tile` → `forest` | 1×1 |
| Terrain-Kachel Meer | `terrain/…` | `ocean_tile` → `water` | 1×1 |
| Terrain-Kachel Fluss | `terrain/…` | `river_straight` → `river` → `water` | 1×1 |
| Terrain-Kachel Gebirge | `terrain/…` | `mountain_ground_tile` → `rock_ground_tile` → `mountain` | 1×1 |
| Terrain-Kachel Sand | `terrain/…` | `sand_tile` → `shore_tile` → `sand` | 1×1 |
| Terrain-Kachel fruchtbar | `terrain/…` | `fertile_ground_tile` → `fertile` | 1×1 |
| Gebirgs-Feature | `terrain/…` | `mountain_peak_medium` → `mountain_peak_large` → `rock_large` → `mountain_peak` | auf ~⅓ der Gebirgs-Kacheln gestreut |
| Baum | `props/nature/…` | `pine_tree` → `tree_pine` → `tree` → `tree_deciduous` | gecullt, nie auf Stadt/Straße |
| Busch | `props/nature/…` | `bush_small` → `bush` → `bush_medium` | gecullt |
| Verkehrsauto | `vehicles/…` | `car` → `car_small` → `car_sedan` → `car_van` | **Front +z** |
| Liefer-Van (Stadtarbeit) | `vehicles/…` | `service_van` → `car_van` → `van` → `delivery_van` → `truck_food` | **Front +z** |
| Marker Aufgabe/Ziel | `markers/…` | `marker_task` → `marker_activity` → `marker_target` | schwebt + rotiert |
| Marker Bau | `markers/…` | `marker_construction` → `marker_build` | |
| Marker Problem | `markers/…` | `marker_problem` → `marker_alert` | |
| Marker Straßenproblem | `markers/…` | `marker_problem_road` → `marker_problem` | rotes Straßensymbol |
| Marker Wasserproblem | `markers/…` | `marker_problem_water` → `marker_problem` | blaues Ankersymbol |
| Marker Teilnetz | `markers/…` | `marker_problem_network` → `marker_problem` | gelbes Netzsymbol |
| Marker Upgrade | `markers/…` | `marker_upgrade` → `marker_bonus` → `marker_arrow` | |
| Effekt Rauch | `effects/…` | `smoke_chimney` → `smoke` → `steam` → `smoke_puff` | Schornstein aktiver Produktion |
| Baustelle (Bau **&** Upgrade) | `buildings/…` bzw. `props/construction/…` | `<id>_construction` → `construction_site` → `construction_crane` → `scaffold` → `crane` | pro Gebäude eigen möglich; sonst generisch; sonst Gerüst |
| Gebäude-Stufe (Upgrade) | `buildings/…` | `<id>_stage2` … `_stage<N>` | Stufe N ≙ Upgrade-Level N−1; sonst `<id>.glb` |
| Welt-UI Auswahlring | `ui/…` | `ui_selection_ring` → `selection_ring` | unter ausgewähltem Gebäude |
| Welt-UI Upgrade-Button | `ui/…` | `ui_upgrade_button` → `ui_button_upgrade` → `button_upgrade` | schwebt über ausgew. Gebäude, wenn Upgrade bereit |
| Welt-UI Aktions-Button | `ui/…` | `ui_build_button` → `ui_button_build` → `button_build` | schwebt über ausgew. Gebäude |
| Welt-UI Level-Badge | `ui/…` | `ui_level_badge` → `level_badge` → `ui_badge` | reserviert |
| Straßen-Nahdetails | `roads/…` | `road_flat` · `road_slope` · `road_support` · `road_viaduct` · `road_hairpin_curve` · `road_coast` | automatisch gewählte Variante, instanziertes Near-LOD |
| Brücken-Nahdetail | `bridges/…` | `road_bridge` | automatisch über Wasser, instanziertes Near-LOD |

**Straßen & Brücken nutzen eine hybride Drop-in-Pipeline.** Die prozedurale,
durchgehende Fahrbahn- und Brückengeometrie bleibt die kanonische Autorität und
der vollständige Fallback; die Texturen aus `docs/ROAD_TEXTURES.md` bleiben ihre
Materialbasis. Optional ergänzen die sieben oben benannten GLBs die automatisch
ermittelte Variante als instanzierte Nahdetails. Die Registry erkennt Dateien
rekursiv unter `src/assets/models/roads/` und `src/assets/models/bridges/` über
`roadModel()`. `ROAD_VARIANT_MODELS` in `src/assets/modelManifest.ts` definiert
die Priorität je Variante (erster vorhandener Name gewinnt): `flat` →
`road_flat`; `slope` → `road_slope`, `road_flat`; `pass` →
`road_hairpin_curve`, `road_slope`; `support` → `road_support`; `viaduct` →
`road_viaduct`, `road_support`; `bridge` → `road_bridge`, `road_viaduct`; `coast`
→ `road_coast`, `road_support`. Fehlt ein Kit oder ist es defekt, bleibt die
prozedurale Geometrie vollständig sichtbar.

**Gebäude** siehe §1 (`buildingModel`, Dateiname = ID). Modelle werden gecacht &
instanziert; ein fehlendes/defektes Modell = Fallback.

**Legende**
- **Datei** = exakter Dateiname (ohne Ordner ist der Name der Schlüssel).
- **Footprint** = Grundfläche in Tiles (1 Tile ≈ 4 m).
- **Stufen** = Ausbaustufen. `<id>.glb` deckt alle ab (Auto-Skalierung); optionale
  eigene Stufen-Modelle heißen `<id>_stage2.glb … _stage<N+1>.glb`.
- **Fallback** (immer): prozeduraler Block/Prop, klar als Platzhalter erkennbar.

---

## Aktualisieren — Checkliste

Wenn du in `buildings.config.ts` ein **neues Gebäude** hinzufügst:
1. Zeile in der passenden Gebäude-Tabelle unten ergänzen (ID, Datei, Footprint,
   Level, Stufen, Ordner).
2. Optional das Modell `src/assets/models/buildings/<ordner>/<id>.glb` ablegen.
3. Prompt in `BUILDING_PROMPTS` (`src/assets/modelManifest.ts`) ergänzen —
   `npm test` (`modelReadmes.test.ts`) erzwingt das für jede Gebäude-ID.
4. `npm test` — `manifest.test.ts` prüft, dass jede Config-ID hier steht.

Bei neuem **Terrain/Straße/Prop/Fahrzeug/Marker/Effekt/Welt-UI** (aktuell
verdrahtet oder erst geplant): Eintrag in der passenden Array/Gruppe in
`src/assets/modelManifest.ts` ergänzen, dann
`WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` — die Ordner sind
fix (§3 in `docs/3D_WORLD_ASSETS.md`).

---

## 1. Gebäude → `src/assets/models/buildings/…`

> Der **Dateiname muss der Gebäude-ID entsprechen** (`buildingModel()` sucht danach).
> Der Unterordner ist nur Organisation — erkannt wird rekursiv per Dateiname.
> Weicht die Wunschdatei ab, per `BuildingDef.visual.model3d` verknüpfen.

> **Verbindliche Gameplay-Tabelle je Gebäude** (Größenklasse, Footprint, Stufen
> mit Namen/Gates/Kosten/Kern-Wirkung, benötigte GLBs, Nodes) steht **generiert**
> in `docs/BUILDINGS.md`, die 3D-Prompts je Stufe in
> `src/assets/models/buildings/PROMPTS.md`, die Ordner-Übersicht in
> `src/assets/models/buildings/README.md` — alle drei aus der Config abgeleitet
> und testgeprüft synchron. Die kompakten Tabellen unten sind der schnelle
> Namens-Index (Gebäudesystem 2.0: XS 1×1 · S 2×2 · M 3×3 · L 4×4–5×5 ·
> XL 6×6–7×7 · XXL 8×8; Footprints fix über alle Stufen).

### Verwaltung / Zentrum — `buildings/administration/`
| ID | Datei | Klasse | Footprint | Ab Level | Stufen |
|---|---|---|---|---|---|
| town_hall | `town_hall.glb` | L | 5×5 | 1 | 4 (`_stage2.._stage4`) |
| mayor_house | `mayor_house.glb` | M | 3×3 | 3 | 1 |
| district_center | `district_center.glb` | L | 4×4 | 12 | 1 |

### Wohnen — `buildings/housing/`
| ID | Datei | Klasse | Footprint | Ab Level | Stufen |
|---|---|---|---|---|---|
| house_small | `house_small.glb` | M | 3×3 | 1 | 6 (`_stage2.._stage6`) |
| residential_tower | `residential_tower.glb` | L | 5×5 | 15 | 3 (`_stage2,_stage3`) |

### Ressourcen / Produktion / Logistik — `buildings/resources/`
| ID | Datei | Klasse | Footprint | Ab Level | Stufen | Hinweis |
|---|---|---|---|---|---|---|
| sawmill | `sawmill.glb` | L | 4×4 | 2 | 3 | Schornstein (`chimney`) für Rauch |
| stone_pit | `stone_pit.glb` | M | 3×3 | 2 | 2 | Einstiegsquelle für Stein |
| quarry | `quarry.glb` | L | 5×5 | 4 | 3 | |
| farm | `farm.glb` | XL | 6×6 | 4 | 3 | Weidetiere/Felder rundum (A7) |
| warehouse | `warehouse.glb` | L | 4×4 | 6 | 2 | |
| depot | `depot.glb` | L | 5×5 | 7 | 2 | |
| waterworks | `waterworks.glb` | L | 5×5 | 11 | 2 | grenzt an Fluss |
| dock_small | `dock_small.glb` | S | Land 2×2 + Wasser 2×2 | 6 | 1 | `water_access`, `land_access` |
| river_port | `river_port.glb` | L | Land 4×3 + Wasser 4×3 | 9 | 1 | rotationsstabiler 4×4-Bauplot; `water_access`, `land_access`, `crane` |

### Versorgung / Dienste — `buildings/services/`
| ID | Datei | Klasse | Footprint | Ab Level | Stufen |
|---|---|---|---|---|---|
| well | `well.glb` | XS | 1×1 | 3 | 2 |
| water_pump | `water_pump.glb` | M | 3×3 | 7 | 2 |
| market | `market.glb` | M | 3×3 | 5 | 2 |
| supermarket | `supermarket.glb` | L | 4×4 | 12 | 2 |
| bakery | `bakery.glb` | S | 2×2 | 9 | 2 |
| fire_station | `fire_station.glb` | L | 5×5 | 8 | 3 |
| police_station | `police_station.glb` | L | 4×4 | 13 | 3 |
| hospital | `hospital.glb` | XL | 6×6 | 14 | 3 |

### Wirtschaft / Handel — `buildings/economy/`
| ID | Datei | Klasse | Footprint | Ab Level | Stufen |
|---|---|---|---|---|---|
| trading_post | `trading_post.glb` | M | 3×3 | 5 | 3 |
| shop_small | `shop_small.glb` | S | 2×2 | 6 | 2 |
| office | `office.glb` | L | 4×4 | 8 | 4 |

### Energie — `buildings/energy/`
| ID | Datei | Klasse | Footprint | Ab Level | Stufen | Hinweis |
|---|---|---|---|---|---|---|
| power_plant | `power_plant.glb` | XXL | 8×8 | 11 | 2 | Schornstein (`chimney`) |
| wind_farm | `wind_farm.glb` | XL | 7×7 | 11 | 1 | Rotor-Node (`rotor`) dreht sich |

### Freizeit / Umwelt — `buildings/leisure/`
| ID | Datei | Klasse | Footprint | Ab Level | Stufen |
|---|---|---|---|---|---|
| park | `park.glb` | L | 5×5 | 7 | 2 |
| playground | `playground.glb` | M | 3×3 | 7 | 1 |

### Dekoration (1×1-Props, als Gebäude platzierbar) — `buildings/leisure/`
| ID | Datei | Klasse | Footprint | Ab Level |
|---|---|---|---|---|
| deco_tree | `deco_tree.glb` | XS | 1×1 | 7 |
| deco_flowerbed | `deco_flowerbed.glb` | XS | 1×1 | 7 |
| deco_fountain | `deco_fountain.glb` | XS | 1×1 | 7 |
| deco_bench | `deco_bench.glb` | XS | 1×1 | 7 |

### Straßen (Sonderfall) — prozedurale Autorität + GLB-Near-LOD
Die Gebäude-IDs **`road`** und **`road_elevated`** (Höhenstraße/Brücke, 1×1,
§ Infrastruktur 2.0 / I1) nutzen weiterhin kein `buildings/*.glb`. Fahrbahn,
Höhenprofil, Deck, Geländer und Stützen entstehen aus der kanonischen
prozeduralen Straßengeometrie und bleiben auch ohne Assets vollständig sichtbar.
Für automatisch ermittelte Varianten lädt `roadModel()` optional die sechs Kits
aus `src/assets/models/roads/` sowie `road_bridge.glb` aus
`src/assets/models/bridges/`; Single-Mesh-Kits werden als Near-LOD instanziert.
Die Zuordnung und Fallbackreihenfolge kommt ausschließlich aus
`ROAD_VARIANT_MODELS` in `src/assets/modelManifest.ts`, nicht aus einer manuellen
Modellauswahl.

### Landmarken / Hero-Bauten (geplant) — `buildings/landmarks/`
Noch keine BuildingDefs, aber vollständig spezifiziert (Footprint, Größenklasse,
Biom, Motiv-Prompt) in `src/assets/models/buildings/PROMPTS.md` §„Landmarken &
Hero-Bauten": `lighthouse`, `harbor_small`, `harbor_pier`, `ship_sailing`,
`monument_city`, `museum`, `stadium`, `observation_tower`,
`mountain_tunnel_landmark`, `hero_city_hall_plaza`, `hero_market_district`,
`hero_harbor_complex`, `hero_lighthouse_cliff`, `hero_grand_bridge`,
`hero_mine_complex`, `hero_dam_complex`, `hero_central_park`,
`hero_waterfront_district`, `castle_hilltop`, `hero_grand_observatory`.

---

## 2. Terrain, Straßen, Brücken, Props, Fahrzeuge, Marker, Effekte, Welt-UI

Alle Namen (aktuell verdrahtet **und** geplant) mit vollständiger Spezifikation
stehen generiert in der jeweiligen `PROMPTS.md`, die reine Namensliste (nur das,
was der Renderer heute lädt) in der jeweiligen `README.md`:

| Ordner | Namensliste (live) | Volle Spezifikation (live + geplant) |
|---|---|---|
| Terrain, Gebirge, Flüsse, Küste, Hero-Weltformen | `src/assets/models/terrain/README.md` | `src/assets/models/terrain/PROMPTS.md` |
| Straßen-Near-LOD | `src/assets/models/roads/README.md` | `src/assets/models/roads/PROMPTS.md` |
| Brücken-Near-LOD | `src/assets/models/bridges/README.md` | `src/assets/models/bridges/PROMPTS.md` |
| Props (Natur, Stadt, Hafen, Farm, Infrastruktur) | `src/assets/models/props/README.md` | `src/assets/models/props/PROMPTS.md` |
| Weidetiere (Landwirtschaft, A7 — nur geplant) | — (prozedural) | `src/assets/models/animals/PROMPTS.md` |
| Fahrzeuge (inkl. Stadtarbeit-Fahrzeuge A6) | `src/assets/models/vehicles/README.md` | `src/assets/models/vehicles/PROMPTS.md` |
| Marker (inkl. Sektor-Nebel & Bürgerhinweise) | `src/assets/models/markers/README.md` | `src/assets/models/markers/PROMPTS.md` |
| Effekte (inkl. lebendige Welt) | `src/assets/models/effects/README.md` | `src/assets/models/effects/PROMPTS.md` |
| Welt-UI | `src/assets/models/ui/README.md` | `src/assets/models/ui/PROMPTS.md` |

Beide Dateien je Ordner sind aus `src/assets/modelManifest.ts` generiert und
werden von `tests/modelReadmes.test.ts` gegen Drift geprüft — hier von Hand
nichts duplizieren.

**Straßen & Brücken sind wieder aktive Drop-in-Kategorien.** Ihre GLBs ersetzen
nicht die prozedurale Geometrie, sondern ergänzen sie als instanzierte
Nahdetails. Die sieben aktiven Namen und ihre Variantenpriorität stehen in
`ROAD_VARIANT_MODELS`; `roadModel()` durchsucht beide Ordner rekursiv. Die
generierten READMEs/PROMPTS sind deshalb wieder verbindliche Live-Dokumentation,
während `src/assets/roadTextureManifest.ts` weiterhin die Materialtexturen der
kanonischen Oberfläche beschreibt.
