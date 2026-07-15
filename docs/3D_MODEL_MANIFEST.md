# 3D-Modell-Manifest — vollständige Namensliste (v0.32)

**Die eine, verbindliche Liste aller 3D-Modelle mit exakten Dateinamen.** Ein Modell
hier eintragen → das korrekt benannte `.glb` in den Ordner legen → das Spiel nutzt es
automatisch (rekursive Erkennung, Key = Dateiname). Fehlt es, greift ein
**prozeduraler Platzhalter** — das Spiel bricht nie.

- **Gebäude-Sektion** ist aus `src/game/config/buildings.config.ts` abgeleitet und
  muss synchron bleiben. Ein Test (`tests/manifest.test.ts`) schlägt fehl, wenn ein
  Gebäude in der Config fehlt/hinzukommt, ohne dass es hier steht — so bleibt die
  Liste aktuell.
- Stil-/Technik-Standard, Größen, Prompts, Hero-/Welt-Modelle: siehe
  **`docs/3D_WORLD_ASSETS.md`**. Gebäude-Grundlagen/Stufen: `docs/3D_MODELS.md`.

**Stand:** Noch keine `.glb` abgelegt → überall Platzhalter aktiv. Die
Renderer-Anbindung ist **live** (v0.33): sobald eine korrekt benannte Datei im
Ordner liegt, nutzt der 3D-Renderer sie automatisch. Welche Namen der Renderer
aktuell akzeptiert, steht in **§0**.

---

## 0. Renderer-Anbindung — was JETZT automatisch geladen wird (v0.33)

Der 3D-Renderer liest diese Kategorien direkt aus der Drop-in-Pipeline. **Erster
passender Name gewinnt** (Präzis vor Alias). Alles ohne Modell bleibt prozedural.

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
| Straße gerade | `roads/…` | `road_<klasse>_straight` → `road_straight` | **kanonisch N–S**, wird 90°-weise gedreht |
| Straße Kurve | `roads/…` | `road_<klasse>_curve` → `road_curve` | **kanonisch N+E** |
| Straße T-Kreuzung | `roads/…` | `road_<klasse>_t_intersection` → `road_t_intersection` | kanonisch offen nach W |
| Straße Kreuzung | `roads/…` | `road_<klasse>_cross_intersection` → `road_cross_intersection` | symmetrisch |
| Straße Ende/Stich | `roads/…` | `road_<klasse>_end` → `road_end` | Arm nach N |
| Brücke (über Wasser) | `bridges/…` | `bridge_medium_road` → `bridge_small_stone` → `bridge_small_wood` → `bridge_large_road` → `bridge_road` → `bridge` | entlang Straßenachse gedreht |
| Baum | `props/nature/…` | `pine_tree` → `tree_pine` → `tree` → `tree_deciduous` | gecullt, nie auf Stadt/Straße |
| Busch | `props/nature/…` | `bush_small` → `bush` → `bush_medium` | gecullt |
| Verkehrsauto | `vehicles/…` | `car` → `car_small` → `car_sedan` → `car_van` | **Front +z** |
| Liefer-Van (Stadtarbeit) | `vehicles/…` | `service_van` → `car_van` → `van` → `delivery_van` → `truck_food` | **Front +z** |
| Marker Aufgabe/Ziel | `markers/…` | `marker_task` → `marker_activity` → `marker_target` | schwebt + rotiert |
| Marker Bau | `markers/…` | `marker_construction` → `marker_build` | |
| Marker Problem | `markers/…` | `marker_problem` → `marker_alert` | |
| Marker Upgrade | `markers/…` | `marker_upgrade` → `marker_bonus` → `marker_arrow` | |
| Effekt Rauch | `effects/…` | `smoke_chimney` → `smoke` → `steam` → `smoke_puff` | Schornstein aktiver Produktion |

`<klasse>` ist die Straßenklasse (`main`, `wide`, `industrial`, `boulevard`) —
für die Standard-Wohnstraße (`residential`) gibt es keinen Klassen-Präfix, nur der
generische Name greift. **Gebäude** siehe §1 (`buildingModel`, Dateiname = ID).
Modelle werden gecacht & instanziert; ein fehlendes/defektes Modell = Fallback.

**Legende**
- **Datei** = exakter Dateiname (ohne Ordner ist der Name der Schlüssel).
- **Footprint** = Grundfläche in Tiles (1 Tile = 1 Welt-Einheit).
- **Stufen** = Ausbaustufen. `<id>.glb` deckt alle ab (Auto-Skalierung); optionale
  eigene Stufen-Modelle heißen `<id>_stage2.glb … _stage<N+1>.glb`.
- **Fallback** (immer): prozeduraler Block/Prop, klar als Platzhalter erkennbar.

---

## Aktualisieren — Checkliste

Wenn du in `buildings.config.ts` ein **neues Gebäude** hinzufügst:
1. Zeile in der passenden Gebäude-Tabelle unten ergänzen (ID, Datei, Footprint,
   Level, Stufen, Ordner).
2. Optional das Modell `src/assets/models/buildings/<ordner>/<id>.glb` ablegen.
3. `npm test` — `manifest.test.ts` prüft, dass jede Config-ID hier steht.

Bei neuem **Terrain/Straße/Prop/Fahrzeug/Marker/Effekt**: in der jeweiligen Tabelle
unten ergänzen; die Ordner sind fix.

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

### Straße (Sonderfall) — Modelle in `src/assets/models/roads/`
Die Gebäude-ID **`road`** (1×1) nutzt **kein** `buildings/road.glb`, sondern das
Straßen-Segment-System (Auto-Tiling, `roadModel()`). Siehe §3.

### Landmarken / Hero-Bauten (geplant) — `buildings/landmarks/`
Noch keine BuildingDefs, aber vorgesehen (siehe `docs/3D_WORLD_ASSETS.md` §13):
`lighthouse`, `harbor_small`, `harbor_pier`, `ship_sailing`, `monument_city`,
`museum`, `stadium`, `observation_tower`, `mountain_tunnel_landmark`,
`hero_city_hall_plaza`, `hero_market_district`, `hero_harbor_complex`,
`hero_lighthouse_cliff`, `hero_grand_bridge`, `hero_mine_complex`,
`hero_dam_complex`, `hero_central_park`, `hero_waterfront_district`.

---

## 2. Terrain → `src/assets/models/terrain/…`

**Kacheln** `terrain/tiles/` (1×1): `grass_tile`, `grass_tile_variant_01`,
`grass_tile_variant_02`, `fertile_ground_tile`, `forest_ground_tile`,
`rock_ground_tile`, `mountain_ground_tile`, `sand_tile`, `shore_tile`,
`locked_sector_tile`, `buildable_sector_tile`, `city_center_ground_tile`.

**Wasser** `terrain/water/`: `river_straight`, `river_curve`, `river_fork`,
`river_source`, `river_mouth`, `lake_center`, `lake_edge`, `ocean_tile`,
`coast_rocky`, `coast_sandy`, `waterfall_small`, `waterfall_large`.

**Gebirge** `terrain/mountains/`: `mountain_peak_large`, `mountain_peak_medium`,
`mountain_cluster_large`, `mountain_cluster_medium`, `mountain_wall_straight`,
`mountain_wall_corner`, `mountain_valley_pass`, `mountain_tunnel_entrance`,
`rock_spire`, `rock_small`, `rock_medium`, `rock_large`.

**Klippen** `terrain/cliffs/`: `cliff_edge`, `cliff_corner`.

**Hero-Terrain** `terrain/hero/`: `hero_mountain_range_west`,
`hero_waterfall_cluster`, `hero_river_valley`, `hero_lake_basin`,
`hero_coastal_cliff`, `hero_harbor_bay`, `hero_forest_ridge`,
`hero_fertile_valley`, `hero_dam_site`.

(Alle `.glb`; Footprints/Prompts in `docs/3D_WORLD_ASSETS.md` §7–§10.)

---

## 3. Straßen → `roads/` · Brücken → `bridges/`

**Roads** (`roadModel()`, Auto-Tiling-Fallback): `road_straight`, `road_curve`,
`road_t_intersection`, `road_cross_intersection`, `road_end`, `road_slope`,
`road_bridge_entry`, `road_main_straight`, `road_main_curve`, `road_main_cross`,
`sidewalk_straight`, `sidewalk_corner`, `driveway_small`.

**Bridges** (`bridgeModel()`): `bridge_small_stone`, `bridge_small_wood`,
`bridge_medium_road`, `bridge_large_road`, `bridge_rail_future`.

---

## 4. Props → `src/assets/models/props/…` (`propModel()`)

**Natur** `props/nature/`: `pine_tree`, `pine_tree_large`, `tree_deciduous`,
`tree_deciduous_large`, `forest_cluster_small`, `forest_cluster_medium`,
`bush_small`, `bush_medium`, `grass_patch`, `flower_patch`, `fallen_log`.

**Stadt** `props/city/`: `street_lamp`, `bench`, `trash_bin`, `mailbox`,
`fence_wood`, `fence_stone`, `road_sign`, `traffic_light`, `construction_crane`,
`construction_barrier`, `market_stall`, `flower_bed`, `small_fountain`.

**Hafen** `props/harbor/`: `pier_wood`, `boat_small`, `boat_sail`, `dock_crate`,
`dock_barrel`.

**Farm** `props/farm/`: `hay_bale`, `tractor_small`, `farm_fence`, `crop_row`,
`water_trough`.

**Baustelle** `props/construction/`: (Kran/Gerüst/Absperrung nach Bedarf).

---

## 5. Fahrzeuge → `src/assets/models/vehicles/` (`vehicleModel()`)

`car_small`, `car_van`, `truck_food`, `truck_material`, `service_van`,
`firetruck`, `police_car`, `ambulance`, `bus_small`.
(Der aktuelle Verkehr sucht `car` bzw. formt Autos prozedural; Lieferwagen der
Stadtarbeit prozedural — echte Modelle ersetzen sie per Dateiname.)

---

## 6. Marker → `src/assets/models/markers/` (`markerModel()`)

`marker_buildable`, `marker_locked`, `marker_water`, `marker_trade`,
`marker_government`, `marker_problem`, `marker_task`, `marker_bonus`,
`marker_resource`, `sector_border_unlocked`, `sector_border_locked`,
`sector_marker_build`, `sector_marker_resource`.
(Fallback: farbcodierte Billboard-Marker — immer zur Kamera gerichtet.)

---

## 7. Effekte → `src/assets/models/effects/` (`effectModel()`)

`smoke_chimney`, `waterfall_mist`, `construction_spark`, `upgrade_glow`,
`building_complete_effect`, `fire_response_effect`, `police_patrol_effect`,
`trade_delivery_effect`, `tree_wind_sway_effect`, `water_surface_motion_effect`,
`bird_flock_effect`, `harbor_wave_effect`.
(Vieles ist als Partikel/Shader sinnvoller als `.glb` — siehe
`docs/3D_WORLD_ASSETS.md` §17. Rauch, Windrad-Rotor, Verkehr laufen bereits.)
