# Isometrie-Assets — Anleitung & Prompt-Liste (v0.27)

Drop-in-Assets für den isometrischen Kartenmodus. Wie bei `docs/ASSETS.md` /
`docs/UI_ASSETS.md`: Datei mit exaktem Namen in den passenden Ordner legen → der
Renderer nutzt sie automatisch im Modus **Isometrisch**. Fehlt eine Datei, greift
ein Platzhalter (extrudierter Diamant-Block bzw. farbiger Terrain-Diamant) — das
Spiel crasht nie.

## Pipeline & Ordner

| Kategorie | Ordner | Dateiname | Registry |
|---|---|---|---|
| Iso-Gebäude | `src/assets/buildings/iso/` | `<id>_iso.png` | `buildingIsoImage(id)` |
| Iso-Terrain | `src/assets/terrain/` | `<name>_iso.png` | `terrainIsoImage(name)` |
| Props | `src/assets/props/` | `<name>_iso.png` | (Folge-Slice) |
| Fahrzeuge | `src/assets/vehicles/` | `<name>_iso.png` | `vehicleImage(name)` |
| 3D-Modelle | `src/assets/models/{buildings,terrain,vehicles}/` | `<id>.glb` | (später) |

`buildingIsoImage(id)` sucht zuerst `<id>_iso`, dann `<id>` — beide Namen sind
erlaubt.

## Technische Vorgaben

- **Isometrische Perspektive**, konsistente Lichtquelle **oben-links**.
- Transparentes PNG, Motiv **zentriert**, Basis (Grundfläche) unten-mittig.
- Gebäude: **512×512** (klein/mittel) bzw. **1024×1024** (Großprojekte/Türme).
- Terrain-Tiles: **256×256**, 2:1-Diamant (Breite:Höhe ≈ 2:1), nahtlos kachelbar.
- Einheitlicher, cartoonartiger City-Builder-Stil über **alle** Iso-Assets.
- Sprite darf höher als das Tile sein (Türme); Anker/Grundfläche bleibt am Footprint.

## Stil-Prefix (vor JEDEN Prompt setzen)

> `Isometric cartoon city-builder game asset, clean stylized 3D look, vibrant
> colors, soft shadows, consistent top-left lighting, transparent background, no
> text, no UI, centered object, high detail but readable at small size —`

Beispiel-Vollprompt (`house_small_iso.png`):
`Isometric cartoon city-builder game asset, … no UI, centered object — small
cozy family house with a red pitched roof, small front garden, chimney, warm
colors.`

---

## 1. Gebäude → `src/assets/buildings/iso/` (Dateiname `<id>_iso.png`)

Abgeleitet aus den vorhandenen `BuildingDef`-IDs und `docs/ASSETS.md`.

| Datei | Motiv-Prompt (an Stil-Prefix anhängen) |
|---|---|
| `town_hall_iso.png` | a grand city hall with a clock tower, columns, a flag, red roof |
| `mayor_house_iso.png` | an elegant mayor's residence, blue roof, small garden |
| `district_center_iso.png` | an administrative district hall with a golden dome |
| `road_iso.png` | a single isometric paved asphalt road tile, lane markings |
| `house_small_iso.png` | a small cozy family house, red pitched roof, chimney, garden |
| `house_row_iso.png` | a row of two–three attached townhouses, mixed roof colors |
| `apartment_iso.png` | a four-story apartment building with balconies, many windows |
| `residential_tower_iso.png` | a tall modern residential skyscraper, glass facade (1024) |
| `sawmill_iso.png` | a wooden sawmill with a log pile and a large saw blade |
| `quarry_iso.png` | a rocky stone quarry pit with boulders and grey rubble |
| `farm_iso.png` | a red barn with a silo and green crop fields |
| `well_iso.png` | an old stone water well with a small wooden roof and bucket |
| `water_pump_iso.png` | a blue water pumping station with a water tank |
| `waterworks_iso.png` | a water treatment plant with round tanks and blue pipes |
| `warehouse_iso.png` | a large storage warehouse with a big orange roller door |
| `depot_iso.png` | a logistics depot with a loading dock and a small truck |
| `market_iso.png` | an open-air market stall with a red-striped awning, produce |
| `supermarket_iso.png` | a modern supermarket with a big sign and shopping carts |
| `bakery_iso.png` | a charming bakery shop with a bread sign and warm awning |
| `shop_small_iso.png` | a small corner shop with a colorful awning, display window |
| `office_iso.png` | a modern glass office building, business district style |
| `trading_post_iso.png` | a merchant trading post with crates, barrels and flags |
| `fire_station_iso.png` | a red fire station with garage doors and a fire truck |
| `police_station_iso.png` | a blue police station with a badge sign |
| `hospital_iso.png` | a white hospital with a red cross and an ambulance |
| `power_plant_iso.png` | a coal power plant with cooling towers, light steam (1024) |
| `wind_farm_iso.png` | a white wind turbine on a small green hill |
| `park_iso.png` | a small green city park with trees, a path, a pond and benches |
| `playground_iso.png` | a children's playground with a slide and swings on grass |
| `deco_tree_iso.png` | a single lush round cartoon tree |
| `deco_flowerbed_iso.png` | a colorful round flower bed |
| `deco_fountain_iso.png` | an ornate stone fountain with splashing water |
| `deco_bench_iso.png` | a wooden park bench next to a lamp post on grass |

## 2. Terrain → `src/assets/terrain/` (256×256, 2:1-Diamant)

| Datei | Motiv-Prompt |
|---|---|
| `grass_iso.png` | an isometric grass ground diamond tile, soft green |
| `forest_ground_iso.png` | an isometric forest-floor tile with moss and roots |
| `fertile_ground_iso.png` | an isometric ploughed fertile farmland diamond tile |
| `rock_ground_iso.png` | an isometric rocky ground diamond tile, grey stone |
| `mountain_ground_iso.png` | an isometric mountain slope diamond tile, steep rock |
| `hill_ground_iso.png` | an isometric grassy hill diamond tile with a gentle slope |
| `water_river_iso.png` | an isometric river water diamond tile, flowing blue |
| `water_lake_iso.png` | an isometric calm lake water diamond tile |
| `shore_iso.png` | an isometric shoreline tile, grass meeting water |
| `sand_iso.png` | an isometric sandy beach diamond tile |
| `road_straight_iso.png` | an isometric straight asphalt road tile |
| `road_curve_iso.png` | an isometric curved asphalt road tile |
| `road_crossing_iso.png` | an isometric 4-way road crossing tile |
| `road_t_iso.png` | an isometric T-junction road tile |
| `locked_sector_iso.png` | an isometric fenced-off / fog-covered locked area tile |
| `buildable_highlight_iso.png` | an isometric green highlighted buildable tile |

## 3. Props → `src/assets/props/`

| Datei | Motiv-Prompt |
|---|---|
| `rock_large_iso.png` | a large isometric grey boulder |
| `rock_small_iso.png` | a small isometric rock |
| `mountain_cluster_iso.png` | an isometric cluster of tall mountain peaks (1024) |
| `pine_tree_iso.png` | a single isometric pine tree |
| `forest_cluster_iso.png` | an isometric cluster of mixed trees |
| `bush_iso.png` | a small isometric green bush |
| `lamp_post_iso.png` | an isometric street lamp post |
| `fountain_iso.png` | an isometric small decorative fountain |
| `market_stall_iso.png` | an isometric colorful market stall |
| `fence_iso.png` | a short isometric wooden fence segment |
| `crate_iso.png` | an isometric stack of delivery crates |

## 4. Fahrzeuge → `src/assets/vehicles/` (§20)

| Datei | Motiv-Prompt |
|---|---|
| `truck_food_iso.png` | an isometric small delivery truck with food crates |
| `truck_material_iso.png` | an isometric flatbed truck carrying wood and stone |
| `firetruck_iso.png` | an isometric red fire truck |
| `police_car_iso.png` | an isometric blue-and-white police car |
| `service_van_iso.png` | an isometric white service/utility van |

## 5. Straßen-Varianten (§13)

Die aktuelle Straßenlogik bestimmt den Typ automatisch aus den Nachbarn. Iso-
Straßen-Sprites (gerade/Kurve/Kreuzung/T/Ende/Brücke/Kreisverkehr) werden in
einem Folge-Slice an diese Auto-Tiling-Logik gehängt; Fallback ist der flache
Asphalt-Diamant. Empfohlene Dateien in `src/assets/terrain/`:
`road_straight_iso.png`, `road_curve_iso.png`, `road_crossing_iso.png`,
`road_t_iso.png`, `road_end_iso.png`, `bridge_iso.png`, `roundabout_iso.png`.

## 6. Spätere echte 3D-Modelle → `src/assets/models/`

Bevorzugt `.glb`. Beispiele: `buildings/house_small.glb`,
`buildings/town_hall.glb`, `buildings/residential_tower.glb`,
`buildings/farm.glb`, `buildings/market.glb`, `terrain/mountain.glb`,
`vehicles/truck_food.glb`. Ein 3D-Modell kann für die echte 3D-Ansicht, gerenderte
Iso-Sprite-Frames, die Baumenü-Vorschau und das Gebäude-Sheet dienen — dieselbe
Asset-Familie je Gebäude (siehe `BuildingDef.visual`, `docs/ISO_RENDERING.md`).

## Verifikation

```
npm run build   # bindet neue Assets automatisch ein
npm run dev     # Einstellungen → Kartenansicht → Isometrisch
```
Fehlt eine Datei, erscheint der eingebaute Platzhalter — kein Fehler.
