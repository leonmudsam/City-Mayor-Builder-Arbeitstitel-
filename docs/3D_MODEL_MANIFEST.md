# 3D-Modell-Manifest — Namens-Index (v0.40 — World Graphics V2)

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
| Marker Upgrade | `markers/…` | `marker_upgrade` → `marker_bonus` → `marker_arrow` | |
| Effekt Rauch | `effects/…` | `smoke_chimney` → `smoke` → `steam` → `smoke_puff` | Schornstein aktiver Produktion |
| Baustelle (Bau **&** Upgrade) | `buildings/…` bzw. `props/construction/…` | `<id>_construction` → `construction_site` → `construction_crane` → `scaffold` → `crane` | pro Gebäude eigen möglich; sonst generisch; sonst Gerüst |
| Gebäude-Stufe (Upgrade) | `buildings/…` | `<id>_stage2` … `_stage<N>` | Stufe N ≙ Upgrade-Level N−1; sonst `<id>.glb` |
| Welt-UI Auswahlring | `ui/…` | `ui_selection_ring` → `selection_ring` | unter ausgewähltem Gebäude |
| Welt-UI Upgrade-Button | `ui/…` | `ui_upgrade_button` → `ui_button_upgrade` → `button_upgrade` | schwebt über ausgew. Gebäude, wenn Upgrade bereit |
| Welt-UI Aktions-Button | `ui/…` | `ui_build_button` → `ui_button_build` → `button_build` | schwebt über ausgew. Gebäude |
| Welt-UI Level-Badge | `ui/…` | `ui_level_badge` → `level_badge` → `ui_badge` | reserviert |

**Straßen & Brücken laden seit v0.44 kein `.glb` mehr** — sie sind texturbasiert
(§ Straßen als Textur), siehe `docs/ROAD_TEXTURES.md`. `src/assets/models/
roads/`/`.../bridges/` bleiben nur noch als historische Doku-Hülle.

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

### Verwaltung / Zentrum — `buildings/administration/`
| ID | Datei | Footprint | Ab Level | Stufen |
|---|---|---|---|---|
| town_hall | `town_hall.glb` | 3×3 | 1 | 4 (`_stage2.._stage4`) |
| mayor_house | `mayor_house.glb` | 2×2 | 3 | 1 |
| district_center | `district_center.glb` | 3×3 | 12 | 1 |

### Wohnen — `buildings/housing/`
| ID | Datei | Footprint | Ab Level | Stufen |
|---|---|---|---|---|
| house_small | `house_small.glb` | 2×2 | 1 | 6 (`_stage2.._stage6`) |
| house_row | `house_row.glb` | 2×2 | 6 | 3 (`_stage2,_stage3`) |
| apartment | `apartment.glb` | 2×3 | 10 | 3 |
| residential_tower | `residential_tower.glb` | 3×3 | 12 | 3 |

### Ressourcen / Produktion / Logistik — `buildings/resources/`
| ID | Datei | Footprint | Ab Level | Stufen | Hinweis |
|---|---|---|---|---|---|
| sawmill | `sawmill.glb` | 2×2 | 2 | 4 | Schornstein (`chimney`) für Rauch |
| quarry | `quarry.glb` | 3×3 | 4 | 4 | |
| farm | `farm.glb` | 3×3 | 4 | 4 | |
| warehouse | `warehouse.glb` | 2×2 | 6 | 2 | |
| depot | `depot.glb` | 3×3 | 7 | 1 | |
| waterworks | `waterworks.glb` | 3×2 | 11 | 1 | |

### Versorgung / Dienste — `buildings/services/`
| ID | Datei | Footprint | Ab Level | Stufen |
|---|---|---|---|---|
| well | `well.glb` | 1×1 | 3 | 2 |
| water_pump | `water_pump.glb` | 2×2 | 7 | 3 |
| market | `market.glb` | 2×2 | 5 | 2 |
| supermarket | `supermarket.glb` | 3×2 | 12 | 1 |
| bakery | `bakery.glb` | 2×2 | 9 | 1 |
| fire_station | `fire_station.glb` | 2×2 | 8 | 2 |
| police_station | `police_station.glb` | 2×2 | 13 | 2 |
| hospital | `hospital.glb` | 3×2 | 14 | 2 |

### Wirtschaft / Handel — `buildings/economy/`
| ID | Datei | Footprint | Ab Level | Stufen |
|---|---|---|---|---|
| trading_post | `trading_post.glb` | 2×2 | 5 | 3 |
| shop_small | `shop_small.glb` | 2×2 | 6 | 1 |
| office | `office.glb` | 4×2 | 8 | 3 |

### Energie — `buildings/energy/`
| ID | Datei | Footprint | Ab Level | Stufen | Hinweis |
|---|---|---|---|---|---|
| power_plant | `power_plant.glb` | 3×3 | 11 | 1 | Schornstein (`chimney`) |
| wind_farm | `wind_farm.glb` | 3×3 | 11 | 1 | Rotor-Node (`rotor`) dreht sich |

### Freizeit / Umwelt — `buildings/leisure/`
| ID | Datei | Footprint | Ab Level | Stufen |
|---|---|---|---|---|
| park | `park.glb` | 2×2 | 7 | 2 |
| playground | `playground.glb` | 2×2 | 7 | 1 |

### Dekoration (1×1-Props, als Gebäude platzierbar) — `buildings/leisure/`
| ID | Datei | Footprint | Ab Level |
|---|---|---|---|
| deco_tree | `deco_tree.glb` | 1×1 | 7 |
| deco_flowerbed | `deco_flowerbed.glb` | 1×1 | 7 |
| deco_fountain | `deco_fountain.glb` | 1×1 | 7 |
| deco_bench | `deco_bench.glb` | 1×1 | 7 |

### Straße (Sonderfall) — texturbasiert, kein `.glb`
Die Gebäude-ID **`road`** (1×1) nutzt **kein** `buildings/road.glb` und auch
kein `roads/`-Segmentmodell mehr: seit v0.44 ist das Straßen-/Brücken-System
texturbasiert (§ Straßen als Textur), siehe `docs/ROAD_TEXTURES.md`.

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
| Props (Natur, Stadt, Hafen, Farm, Infrastruktur) | `src/assets/models/props/README.md` | `src/assets/models/props/PROMPTS.md` |
| Fahrzeuge | `src/assets/models/vehicles/README.md` | `src/assets/models/vehicles/PROMPTS.md` |
| Marker (inkl. Sektor-Nebel & Bürgerhinweise) | `src/assets/models/markers/README.md` | `src/assets/models/markers/PROMPTS.md` |
| Effekte (inkl. lebendige Welt) | `src/assets/models/effects/README.md` | `src/assets/models/effects/PROMPTS.md` |
| Welt-UI | `src/assets/models/ui/README.md` | `src/assets/models/ui/PROMPTS.md` |

Beide Dateien je Ordner sind aus `src/assets/modelManifest.ts` generiert und
werden von `tests/modelReadmes.test.ts` gegen Drift geprüft — hier von Hand
nichts duplizieren.

**Straßen & Brücken stehen hier bewusst nicht mehr in der Tabelle** — seit v0.44
(§ Straßen als Textur) laden sie nie ein `.glb`, siehe `docs/ROAD_TEXTURES.md`
und `src/assets/roadTextureManifest.ts`. `src/assets/models/roads/README.md`/
`.../bridges/README.md` existieren nur noch als historischer Hinweis.
