# 3D-Modelle — Gebäude

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.
> Die Gebäudeliste kommt zusätzlich aus `src/game/config/buildings.config.ts` — neue Gebäude erscheinen automatisch.

Ordner: `src/assets/models/buildings/`  ·  Loader: `buildingModel(id, stage)`  ·  **Dateiname = Gebäude-ID** (rekursiv, Unterordner nur zur Organisation).

**Stufen/Upgrades:** `<id>.glb` deckt alle Stufen ab (Auto-Skalierung). Optionale eigene Stufen-Modelle heißen `<id>_stage2.glb` … `_stage<N>` (Stufe N ≙ Upgrade-Level N−1). **Baustelle:** während Bau *und* Upgrade zeigt der Renderer `<id>_construction.glb`, sonst ein generisches Baustellen-Prop (`construction_site.glb`), sonst prozedurales Gerüst.

| ID | Datei | Unterordner | Footprint | Ab Level | Stufen | Stufen-Dateien | Baustelle |
|---|---|---|---|---|---|---|---|
| town_hall | `town_hall.glb` | administration/ | 5×5 | 1 | 4 | `town_hall_stage2`…`town_hall_stage4` | `town_hall_construction.glb` |
| mayor_house | `mayor_house.glb` | administration/ | 3×3 | 3 | 1 | — | `mayor_house_construction.glb` |
| district_center | `district_center.glb` | administration/ | 4×4 | 12 | 1 | — | `district_center_construction.glb` |
| house_small | `house_small.glb` | housing/ | 3×3 | 1 | 6 | `house_small_stage2`…`house_small_stage6` | `house_small_construction.glb` |
| residential_tower | `residential_tower.glb` | housing/ | 5×5 | 15 | 3 | `residential_tower_stage2`…`residential_tower_stage3` | `residential_tower_construction.glb` |
| sawmill | `sawmill.glb` | resources/ | 4×4 | 2 | 3 | `sawmill_stage2`…`sawmill_stage3` | `sawmill_construction.glb` |
| quarry | `quarry.glb` | resources/ | 5×5 | 4 | 3 | `quarry_stage2`…`quarry_stage3` | `quarry_construction.glb` |
| farm | `farm.glb` | resources/ | 6×6 | 4 | 3 | `farm_stage2`…`farm_stage3` | `farm_construction.glb` |
| well | `well.glb` | services/ | 1×1 | 3 | 2 | `well_stage2` | `well_construction.glb` |
| water_pump | `water_pump.glb` | services/ | 3×3 | 7 | 2 | `water_pump_stage2` | `water_pump_construction.glb` |
| warehouse | `warehouse.glb` | resources/ | 4×4 | 6 | 2 | `warehouse_stage2` | `warehouse_construction.glb` |
| depot | `depot.glb` | resources/ | 5×5 | 7 | 2 | `depot_stage2` | `depot_construction.glb` |
| waterworks | `waterworks.glb` | resources/ | 5×5 | 11 | 2 | `waterworks_stage2` | `waterworks_construction.glb` |
| market | `market.glb` | services/ | 3×3 | 5 | 2 | `market_stage2` | `market_construction.glb` |
| supermarket | `supermarket.glb` | services/ | 4×4 | 12 | 2 | `supermarket_stage2` | `supermarket_construction.glb` |
| bakery | `bakery.glb` | services/ | 2×2 | 9 | 2 | `bakery_stage2` | `bakery_construction.glb` |
| fire_station | `fire_station.glb` | services/ | 5×5 | 8 | 3 | `fire_station_stage2`…`fire_station_stage3` | `fire_station_construction.glb` |
| police_station | `police_station.glb` | services/ | 4×4 | 13 | 3 | `police_station_stage2`…`police_station_stage3` | `police_station_construction.glb` |
| hospital | `hospital.glb` | services/ | 6×6 | 14 | 3 | `hospital_stage2`…`hospital_stage3` | `hospital_construction.glb` |
| trading_post | `trading_post.glb` | economy/ | 3×3 | 5 | 3 | `trading_post_stage2`…`trading_post_stage3` | `trading_post_construction.glb` |
| shop_small | `shop_small.glb` | economy/ | 2×2 | 6 | 2 | `shop_small_stage2` | `shop_small_construction.glb` |
| office | `office.glb` | economy/ | 4×4 | 8 | 4 | `office_stage2`…`office_stage4` | `office_construction.glb` |
| power_plant | `power_plant.glb` | energy/ | 8×8 | 11 | 2 | `power_plant_stage2` | `power_plant_construction.glb` |
| wind_farm | `wind_farm.glb` | energy/ | 7×7 | 11 | 1 | — | `wind_farm_construction.glb` |
| park | `park.glb` | leisure/ | 5×5 | 7 | 2 | `park_stage2` | `park_construction.glb` |
| playground | `playground.glb` | leisure/ | 3×3 | 7 | 1 | — | `playground_construction.glb` |
| deco_tree | `deco_tree.glb` | leisure/ | 1×1 | 7 | 1 | — | `deco_tree_construction.glb` |
| deco_flowerbed | `deco_flowerbed.glb` | leisure/ | 1×1 | 7 | 1 | — | `deco_flowerbed_construction.glb` |
| deco_fountain | `deco_fountain.glb` | leisure/ | 1×1 | 7 | 1 | — | `deco_fountain_construction.glb` |
| deco_bench | `deco_bench.glb` | leisure/ | 1×1 | 7 | 1 | — | `deco_bench_construction.glb` |

Die Straßen-ID `road` nutzt kein `buildings/road.glb`, sondern das Straßen-Segment-System (`src/assets/models/roads/`). Volle Spezifikation je Gebäude (Größenklasse, Budget, Front/Eingang, Baustil): `PROMPTS.md` daneben.
