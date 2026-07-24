# Gebäude — verbindliche Tabelle (Gebäudesystem 2.0)

> **Auto-generiert** aus der Spiel-Config (`buildings.config.ts` / `levels.config.ts` /
> `regions.config.ts`). Nicht von Hand editieren. Neu generieren:
> `WRITE_BUILDING_DOCS=1 npx vitest run tests/buildingDocs.test.ts`.
> Der Test schlägt fehl, sobald diese Datei von der Config abweicht.

Bauplots sind **fix über alle Stufen** und grundsätzlich quadratisch; Waterfront-Gebäude deklarieren darin zusätzlich einen rechteckigen Land- und Wasser-Footprint für kardinale Rotation — eine Stufe verdichtet dasselbe Grundstück sichtbar, ändert aber nie die Fläche. Die 3D-Prompts je Stufe stehen generiert in `src/assets/models/buildings/PROMPTS.md`.

## Größenklassen & Asset-Budgets

| Klasse | Footprint | Tris | Textur | Material |
|---|---|---|---|---|
| **XS** | 1×1 | < 600 Tris | ≤ 256² | 1 Material |
| **S** | 2×2 | 800–2 000 Tris | ≤ 512² | 1–2 Materialien |
| **M** | 3×3 | 1 500–3 500 Tris | ≤ 512² | 2 Materialien |
| **L** | 4×4–5×5 | 3 000–6 000 Tris | ≤ 1024² | 2–3 Materialien |
| **XL** | 6×6–7×7 | 5 000–9 000 Tris | ≤ 1024² | 3–4 Materialien |
| **XXL** | 8×8 | 8 000–12 000 Tris | ≤ 1024² (bevorzugt 2 Sets) | 3–5 Materialien |

## Übersicht

| Gebäude | ID | Kategorie | Klasse | Footprint | ab Level | Stufen |
|---|---|---|---|---|---|---|
| Rathaus | `town_hall` | Verwaltung | L | 5×5 | L1 | 4 |
| Bürgermeisterhaus | `mayor_house` | Verwaltung | M | 3×3 | L3 | 1 |
| Distrikt-Zentrum | `district_center` | Verwaltung | L | 4×4 | L12 | 1 |
| Kleines Haus | `house_small` | Wohnen | M | 3×3 | L1 | 6 |
| Wohnturm | `residential_tower` | Wohnen | L | 5×5 | L15 | 3 |
| Sägewerk | `sawmill` | Produktion & Ressourcen | L | 4×4 | L2 | 3 |
| Steinbruch | `quarry` | Produktion & Ressourcen | L | 5×5 | L4 | 3 |
| Bauernhof | `farm` | Produktion & Ressourcen | XL | 6×6 | L4 | 3 |
| Brunnen | `well` | Versorgung & Dienste | XS | 1×1 | L3 | 2 |
| Wasserpumpe | `water_pump` | Versorgung & Dienste | M | 3×3 | L7 | 2 |
| Lagerhaus | `warehouse` | Produktion & Ressourcen | L | 4×4 | L6 | 2 |
| Logistikzentrum | `depot` | Produktion & Ressourcen | L | 5×5 | L7 | 2 |
| Wasseraufbereitung | `waterworks` | Produktion & Ressourcen | L | 5×5 | L11 | 2 |
| Markt | `market` | Versorgung & Dienste | M | 3×3 | L5 | 2 |
| Supermarkt | `supermarket` | Versorgung & Dienste | L | 4×4 | L12 | 2 |
| Bäckerei | `bakery` | Versorgung & Dienste | S | 2×2 | L9 | 2 |
| Feuerwache | `fire_station` | Versorgung & Dienste | L | 5×5 | L8 | 3 |
| Polizeiwache | `police_station` | Versorgung & Dienste | L | 4×4 | L13 | 3 |
| Klinik | `hospital` | Versorgung & Dienste | XL | 6×6 | L14 | 3 |
| Handelskontor | `trading_post` | Wirtschaft | M | 3×3 | L5 | 3 |
| Kleiner Laden | `shop_small` | Wirtschaft | S | 2×2 | L6 | 2 |
| Kleines Büro | `office` | Wirtschaft | L | 4×4 | L8 | 4 |
| Kohlekraftwerk | `power_plant` | Energie | XXL | 8×8 | L11 | 2 |
| Windpark | `wind_farm` | Energie | XL | 7×7 | L11 | 1 |
| Kleiner Anleger | `dock_small` | Infrastruktur | S | Land 2×2 + Wasser 2×2 | L6 | 1 |
| Flusshafen | `river_port` | Infrastruktur | L | Land 4×3 + Wasser 4×3 | L9 | 1 |
| Park | `park` | Freizeit | L | 5×5 | L7 | 2 |
| Spielplatz | `playground` | Freizeit | M | 3×3 | L7 | 1 |
| Baum | `deco_tree` | Dekoration | XS | 1×1 | L7 | 1 |
| Blumenbeet | `deco_flowerbed` | Dekoration | XS | 1×1 | L7 | 1 |
| Zierbrunnen | `deco_fountain` | Dekoration | XS | 1×1 | L7 | 1 |
| Parkbank | `deco_bench` | Dekoration | XS | 1×1 | L7 | 1 |

## Verwaltung

### Rathaus — `town_hall`

- **Größenklasse:** L (4×4–5×5) · **Footprint:** 5×5 (fix über alle Stufen)
- **Asset-Budget:** 3 000–6 000 Tris, ≤ 1024², 2–3 Materialien
- **Ab Level:** 1 · **Stufen:** 4 · **Kategorie:** Verwaltung
- **Benötigte GLBs:** `town_hall.glb` · `town_hall_stage2`…`town_hall_stage4.glb` · `town_hall_construction.glb`
- **Besonderheiten:** einzigartig · nicht frei baubar (Projekt-/Startgebäude) · kein Straßenanschluss nötig · versetzbar · nicht abreißbar

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Rathaus | L1 | kostenlos | Lager +400 Holz · Lager +400 Stein · Lager +400 Nahrung |
| 2 | Stadtverwaltung | L6 | 150.000 Geld · 140 Holz · 140 Stein | Lager +700 Holz · Lager +700 Stein · Lager +700 Nahrung |
| 3 | Stadtpalais | L11 | 600.000 Geld · 300 Holz · 380 Stein | Lager +1.100 Holz · Lager +1.100 Stein · Lager +1.100 Nahrung |
| 4 | Monumentalrathaus | L16 | 2.000.000 Geld · 600 Holz · 850 Stein | Lager +1.700 Holz · Lager +1.700 Stein · Lager +1.700 Nahrung |

### Bürgermeisterhaus — `mayor_house`

- **Größenklasse:** M (3×3) · **Footprint:** 3×3 (fix über alle Stufen)
- **Asset-Budget:** 1 500–3 500 Tris, ≤ 512², 2 Materialien
- **Ab Level:** 3 · **Stufen:** 1 · **Kategorie:** Verwaltung
- **Benötigte GLBs:** `mayor_house.glb` · `mayor_house_construction.glb`
- **Besonderheiten:** einzigartig · versetzbar · nicht abreißbar

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Bürgermeisterhaus | L3 | 30.000 Geld · 50 Holz | — |

### Distrikt-Zentrum — `district_center`

- **Größenklasse:** L (4×4–5×5) · **Footprint:** 4×4 (fix über alle Stufen)
- **Asset-Budget:** 3 000–6 000 Tris, ≤ 1024², 2–3 Materialien
- **Ab Level:** 12 · **Stufen:** 1 · **Kategorie:** Verwaltung
- **Benötigte GLBs:** `district_center.glb` · `district_center_construction.glb`
- **Besonderheiten:** nicht frei baubar (Projekt-/Startgebäude) · kein Straßenanschluss nötig · nicht abreißbar

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Distrikt-Zentrum | L12 | kostenlos | Lager +300 Holz · Lager +300 Stein · Lager +300 Nahrung |

## Wohnen

### Kleines Haus — `house_small`

- **Größenklasse:** M (3×3) · **Footprint:** 3×3 (fix über alle Stufen)
- **Asset-Budget:** 1 500–3 500 Tris, ≤ 512², 2 Materialien
- **Ab Level:** 1 · **Stufen:** 6 · **Kategorie:** Wohnen
- **Benötigte GLBs:** `house_small.glb` · `house_small_stage2`…`house_small_stage6.glb` · `house_small_construction.glb`
- **Besonderheiten:** Baugrenze bis 30 (ab L17)

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Kleines Haus | L1 | 12.000 Geld · 30 Holz | 1 Wohneinheiten |
| 2 | Einfamilienhaus | L3 | 34.000 Geld · 60 Holz · 25 Stein | 3 Wohneinheiten |
| 3 | Doppelhaus | L6 | 160.000 Geld · 150 Holz · 100 Stein | 6 Wohneinheiten |
| 4 | Mehrfamilienhaus | L9 | 380.000 Geld · 260 Holz · 220 Stein | 14 Wohneinheiten |
| 5 | Apartmenthaus | L12 | 950.000 Geld · 420 Holz · 440 Stein | 40 Wohneinheiten |
| 6 | Wohnblock | L15 | 2.100.000 Geld · 680 Holz · 720 Stein | 90 Wohneinheiten |

### Wohnturm — `residential_tower`

- **Größenklasse:** L (4×4–5×5) · **Footprint:** 5×5 (fix über alle Stufen)
- **Asset-Budget:** 3 000–6 000 Tris, ≤ 1024², 2–3 Materialien
- **Ab Level:** 15 · **Stufen:** 3 · **Kategorie:** Wohnen
- **Benötigte GLBs:** `residential_tower.glb` · `residential_tower_stage2`…`residential_tower_stage3.glb` · `residential_tower_construction.glb`
- **Besonderheiten:** Baugrenze bis 16 (ab L19)

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Wohnturm | L15 | 2.800.000 Geld · 600 Holz · 1.200 Stein | 900 Wohneinheiten |
| 2 | Hochhaus | L17 | 6.000.000 Geld · 900 Holz · 2.000 Stein | 1.400 Wohneinheiten |
| 3 | Wolkenkratzer | L20 | 12.000.000 Geld · 1.400 Holz · 3.200 Stein | 2.200 Wohneinheiten |

## Produktion & Ressourcen

### Sägewerk — `sawmill`

- **Größenklasse:** L (4×4–5×5) · **Footprint:** 4×4 (fix über alle Stufen)
- **Asset-Budget:** 3 000–6 000 Tris, ≤ 1024², 2–3 Materialien
- **Ab Level:** 2 · **Stufen:** 3 · **Kategorie:** Produktion & Ressourcen
- **Benötigte GLBs:** `sawmill.glb` · `sawmill_stage2`…`sawmill_stage3.glb` · `sawmill_construction.glb`
- **Modell-Nodes:** `chimney` (Rauch-Ursprung am Schornstein)
- **Besonderheiten:** Standortbonus: `forest` in r=3 (+5%/Kachel, max +50%) · Baugrenze bis 5 (ab L8) · versetzbar

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Sägewerk | L2 | 11.000 Geld | +45 Holz/min · +600 Industrie/min · 4 Jobs |
| 2 | Großsägewerk | L7 | 220.000 Geld · 160 Holz · 130 Stein | +100 Holz/min · +1.200 Industrie/min · 7 Jobs |
| 3 | Holzkombinat | L12 | 1.800.000 Geld · 500 Holz · 450 Stein | +260 Holz/min · +2.900 Industrie/min · 13 Jobs |

### Steinbruch — `quarry`

- **Größenklasse:** L (4×4–5×5) · **Footprint:** 5×5 (fix über alle Stufen)
- **Asset-Budget:** 3 000–6 000 Tris, ≤ 1024², 2–3 Materialien
- **Ab Level:** 4 · **Stufen:** 3 · **Kategorie:** Produktion & Ressourcen
- **Benötigte GLBs:** `quarry.glb` · `quarry_stage2`…`quarry_stage3.glb` · `quarry_construction.glb`
- **Besonderheiten:** Standortbonus: `mountain` in r=3 (+10%/Kachel, max +70%) · Baugrenze bis 4 (ab L10) · versetzbar

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Steinbruch | L4 | 45.000 Geld · 120 Holz | +38 Stein/min · +1.000 Industrie/min · 6 Jobs |
| 2 | Tiefbruch | L8 | 300.000 Geld · 120 Holz · 140 Stein | +80 Stein/min · +1.800 Industrie/min · 9 Jobs |
| 3 | Bergbaukomplex | L13 | 2.600.000 Geld · 550 Holz · 650 Stein | +210 Stein/min · +4.400 Industrie/min · 17 Jobs |

### Bauernhof — `farm`

- **Größenklasse:** XL (6×6–7×7) · **Footprint:** 6×6 (fix über alle Stufen)
- **Asset-Budget:** 5 000–9 000 Tris, ≤ 1024², 3–4 Materialien
- **Ab Level:** 4 · **Stufen:** 3 · **Kategorie:** Produktion & Ressourcen
- **Benötigte GLBs:** `farm.glb` · `farm_stage2`…`farm_stage3.glb` · `farm_construction.glb`
- **Besonderheiten:** Standortbonus: `fertile` in r=2 (+6%/Kachel, max +50%) · Baugrenze bis 8 (ab L12) · versetzbar

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Bauernhof | L4 | 28.000 Geld · 80 Holz | +260 Nahrung/min · +800 Industrie/min · 14 Jobs |
| 2 | Großfarm | L8 | 320.000 Geld · 150 Holz · 130 Stein | +500 Nahrung/min · +1.300 Industrie/min · 18 Jobs |
| 3 | Agrarkomplex | L13 | 2.400.000 Geld · 480 Holz · 480 Stein | +1.100 Nahrung/min · +2.900 Industrie/min · 28 Jobs |

### Lagerhaus — `warehouse`

- **Größenklasse:** L (4×4–5×5) · **Footprint:** 4×4 (fix über alle Stufen)
- **Asset-Budget:** 3 000–6 000 Tris, ≤ 1024², 2–3 Materialien
- **Ab Level:** 6 · **Stufen:** 2 · **Kategorie:** Produktion & Ressourcen
- **Benötigte GLBs:** `warehouse.glb` · `warehouse_stage2.glb` · `warehouse_construction.glb`
- **Besonderheiten:** Baugrenze bis 10 (ab L10)

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Lagerhaus | L6 | 95.000 Geld · 160 Holz · 100 Stein | Lager +1.000 Holz · Lager +1.000 Stein · Lager +4.000 Nahrung · Lager +4.000 Wasser · 3 Jobs |
| 2 | Hochregallager | L10 | 260.000 Geld · 200 Holz · 150 Stein | Lager +1.800 Holz · Lager +1.800 Stein · Lager +7.000 Nahrung · Lager +7.000 Wasser · 5 Jobs |

### Logistikzentrum — `depot`

- **Größenklasse:** L (4×4–5×5) · **Footprint:** 5×5 (fix über alle Stufen)
- **Asset-Budget:** 3 000–6 000 Tris, ≤ 1024², 2–3 Materialien
- **Ab Level:** 7 · **Stufen:** 2 · **Kategorie:** Produktion & Ressourcen
- **Benötigte GLBs:** `depot.glb` · `depot_stage2.glb` · `depot_construction.glb`
- **Besonderheiten:** Baugrenze bis 3 (ab L10)

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Logistikzentrum | L7 | 210.000 Geld · 150 Holz · 200 Stein | Logistik +25% r=6 · 9 Jobs |
| 2 | Logistikhub | L14 | 900.000 Geld · 400 Stein | Logistik +35% r=9 · 14 Jobs |

### Wasseraufbereitung — `waterworks`

- **Größenklasse:** L (4×4–5×5) · **Footprint:** 5×5 (fix über alle Stufen)
- **Asset-Budget:** 3 000–6 000 Tris, ≤ 1024², 2–3 Materialien
- **Ab Level:** 11 · **Stufen:** 2 · **Kategorie:** Produktion & Ressourcen
- **Benötigte GLBs:** `waterworks.glb` · `waterworks_stage2.glb` · `waterworks_construction.glb`
- **Besonderheiten:** muss an `river` grenzen · Baugrenze bis 5 (ab L15) · versetzbar

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Wasseraufbereitung | L11 | 280.000 Geld · 90 Holz · 220 Stein | +400 Wasser/min · +900 Industrie/min · Lager +6.000 Wasser |
| 2 | Klärwerk | L14 | 800.000 Geld · 450 Stein | +700 Wasser/min · +1.500 Industrie/min · Lager +10.000 Wasser |

## Versorgung & Dienste

### Brunnen — `well`

- **Größenklasse:** XS (1×1) · **Footprint:** 1×1 (fix über alle Stufen)
- **Asset-Budget:** < 600 Tris, ≤ 256², 1 Material
- **Ab Level:** 3 · **Stufen:** 2 · **Kategorie:** Versorgung & Dienste
- **Benötigte GLBs:** `well.glb` · `well_stage2.glb` · `well_construction.glb`
- **Besonderheiten:** kein Straßenanschluss nötig · versetzbar

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Brunnen | L3 | 6.500 Geld · 10 Holz | +120 Wasser (r=9) |
| 2 | Tiefbrunnen | L6 | 22.000 Geld · 30 Holz · 20 Stein | +220 Wasser (r=11) |

### Wasserpumpe — `water_pump`

- **Größenklasse:** M (3×3) · **Footprint:** 3×3 (fix über alle Stufen)
- **Asset-Budget:** 1 500–3 500 Tris, ≤ 512², 2 Materialien
- **Ab Level:** 7 · **Stufen:** 2 · **Kategorie:** Versorgung & Dienste
- **Benötigte GLBs:** `water_pump.glb` · `water_pump_stage2.glb` · `water_pump_construction.glb`
- **Besonderheiten:** Baugrenze bis 8 (ab L13) · versetzbar

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Wasserpumpe | L7 | 130.000 Geld · 150 Stein | +1.800 Wasser (r=18) · 6 Jobs |
| 2 | Pumpwerk | L11 | 420.000 Geld · 420 Stein | +3.800 Wasser (r=21) · 12 Jobs |

### Markt — `market`

- **Größenklasse:** M (3×3) · **Footprint:** 3×3 (fix über alle Stufen)
- **Asset-Budget:** 1 500–3 500 Tris, ≤ 512², 2 Materialien
- **Ab Level:** 5 · **Stufen:** 2 · **Kategorie:** Versorgung & Dienste
- **Benötigte GLBs:** `market.glb` · `market_stage2.glb` · `market_construction.glb`
- **Besonderheiten:** Baugrenze bis 4 (ab L10) · versetzbar

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Markt | L5 | 55.000 Geld · 90 Holz | Verteilung food r=14 · +2.000 Gewerbe/min · 20 Jobs |
| 2 | Markthalle | L9 | 160.000 Geld · 150 Holz · 90 Stein | Verteilung food r=18 · +3.400 Gewerbe/min · 34 Jobs |

### Supermarkt — `supermarket`

- **Größenklasse:** L (4×4–5×5) · **Footprint:** 4×4 (fix über alle Stufen)
- **Asset-Budget:** 3 000–6 000 Tris, ≤ 1024², 2–3 Materialien
- **Ab Level:** 12 · **Stufen:** 2 · **Kategorie:** Versorgung & Dienste
- **Benötigte GLBs:** `supermarket.glb` · `supermarket_stage2.glb` · `supermarket_construction.glb`
- **Besonderheiten:** Baugrenze bis 4 (ab L14) · versetzbar

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Supermarkt | L12 | 380.000 Geld · 140 Holz · 200 Stein | Verteilung food r=16 · Verteilung freshwater r=16 · +3.500 Gewerbe/min |
| 2 | Einkaufszentrum | L15 | 950.000 Geld · 180 Holz · 320 Stein | Verteilung food r=20 · Verteilung freshwater r=20 · +6.500 Gewerbe/min |

### Bäckerei — `bakery`

- **Größenklasse:** S (2×2) · **Footprint:** 2×2 (fix über alle Stufen)
- **Asset-Budget:** 800–2 000 Tris, ≤ 512², 1–2 Materialien
- **Ab Level:** 9 · **Stufen:** 2 · **Kategorie:** Versorgung & Dienste
- **Benötigte GLBs:** `bakery.glb` · `bakery_stage2.glb` · `bakery_construction.glb`
- **Besonderheiten:** Baugrenze bis 4 (ab L12)

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Bäckerei | L9 | 130.000 Geld · 110 Holz · 90 Stein | +90 Nahrung/min · +1.200 Industrie/min · 12 Jobs |
| 2 | Großbäckerei | L12 | 320.000 Geld · 150 Holz · 120 Stein | +180 Nahrung/min · +2.200 Industrie/min · 20 Jobs |

### Feuerwache — `fire_station`

- **Größenklasse:** L (4×4–5×5) · **Footprint:** 5×5 (fix über alle Stufen)
- **Asset-Budget:** 3 000–6 000 Tris, ≤ 1024², 2–3 Materialien
- **Ab Level:** 8 · **Stufen:** 3 · **Kategorie:** Versorgung & Dienste
- **Benötigte GLBs:** `fire_station.glb` · `fire_station_stage2`…`fire_station_stage3.glb` · `fire_station_construction.glb`
- **Besonderheiten:** Baugrenze bis 5 (ab L13) · versetzbar

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Feuerwache | L8 | 280.000 Geld · 160 Holz · 220 Stein | Brandschutz r=18 · 16 Jobs |
| 2 | Stadtfeuerwehr | L11 | 340.000 Geld · 180 Holz · 260 Stein | Brandschutz r=24 · 28 Jobs |
| 3 | Einsatzzentrum | L16 | 1.400.000 Geld · 600 Stein | Brandschutz r=32 · 44 Jobs |

### Polizeiwache — `police_station`

- **Größenklasse:** L (4×4–5×5) · **Footprint:** 4×4 (fix über alle Stufen)
- **Asset-Budget:** 3 000–6 000 Tris, ≤ 1024², 2–3 Materialien
- **Ab Level:** 13 · **Stufen:** 3 · **Kategorie:** Versorgung & Dienste
- **Benötigte GLBs:** `police_station.glb` · `police_station_stage2`…`police_station_stage3.glb` · `police_station_construction.glb`
- **Besonderheiten:** Baugrenze bis 4 (ab L15) · versetzbar

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Polizeiwache | L13 | 560.000 Geld · 120 Holz · 300 Stein | Sicherheit r=16, Kap. 8.000 · 30 Jobs |
| 2 | Revier | L14 | 900.000 Geld · 420 Stein | Sicherheit r=18, Kap. 14.000 · 46 Jobs |
| 3 | Polizeipräsidium | L17 | 2.400.000 Geld · 700 Stein | Sicherheit r=22, Kap. 26.000 · 70 Jobs |

### Klinik — `hospital`

- **Größenklasse:** XL (6×6–7×7) · **Footprint:** 6×6 (fix über alle Stufen)
- **Asset-Budget:** 5 000–9 000 Tris, ≤ 1024², 3–4 Materialien
- **Ab Level:** 14 · **Stufen:** 3 · **Kategorie:** Versorgung & Dienste
- **Benötigte GLBs:** `hospital.glb` · `hospital_stage2`…`hospital_stage3.glb` · `hospital_construction.glb`
- **Besonderheiten:** Baugrenze bis 3 (ab L16) · versetzbar

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Klinik | L14 | 2.200.000 Geld · 240 Holz · 560 Stein | Gesundheit r=18, Kap. 15.000 · 80 Jobs |
| 2 | Krankenhaus | L16 | 4.500.000 Geld · 320 Holz · 850 Stein | Gesundheit r=20, Kap. 26.000 · 130 Jobs |
| 3 | Universitätsklinikum | L19 | 9.000.000 Geld · 500 Holz · 1.400 Stein | Gesundheit r=24, Kap. 45.000 · 220 Jobs |

## Wirtschaft

### Handelskontor — `trading_post`

- **Größenklasse:** M (3×3) · **Footprint:** 3×3 (fix über alle Stufen)
- **Asset-Budget:** 1 500–3 500 Tris, ≤ 512², 2 Materialien
- **Ab Level:** 5 · **Stufen:** 3 · **Kategorie:** Wirtschaft
- **Benötigte GLBs:** `trading_post.glb` · `trading_post_stage2`…`trading_post_stage3.glb` · `trading_post_construction.glb`
- **Besonderheiten:** Baugrenze bis 3 (ab L13) · versetzbar

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Handelskontor | L5 | 42.000 Geld · 65 Holz | +800 Gewerbe/min · 8 Jobs |
| 2 | Rohstoffbörse | L9 | 180.000 Geld · 120 Holz · 100 Stein | +1.600 Gewerbe/min · 16 Jobs |
| 3 | Exportzentrum | L13 | 520.000 Geld · 260 Stein | +3.000 Gewerbe/min · 28 Jobs |

### Kleiner Laden — `shop_small`

- **Größenklasse:** S (2×2) · **Footprint:** 2×2 (fix über alle Stufen)
- **Asset-Budget:** 800–2 000 Tris, ≤ 512², 1–2 Materialien
- **Ab Level:** 6 · **Stufen:** 2 · **Kategorie:** Wirtschaft
- **Benötigte GLBs:** `shop_small.glb` · `shop_small_stage2.glb` · `shop_small_construction.glb`
- **Besonderheiten:** Baugrenze bis 8 (ab L12)

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Kleiner Laden | L6 | 85.000 Geld · 90 Holz | +4.000 Gewerbe/min · 40 Jobs |
| 2 | Ladenzeile | L10 | 260.000 Geld · 140 Holz | +7.500 Gewerbe/min · 70 Jobs |

### Kleines Büro — `office`

- **Größenklasse:** L (4×4–5×5) · **Footprint:** 4×4 (fix über alle Stufen)
- **Asset-Budget:** 3 000–6 000 Tris, ≤ 1024², 2–3 Materialien
- **Ab Level:** 8 · **Stufen:** 4 · **Kategorie:** Wirtschaft
- **Benötigte GLBs:** `office.glb` · `office_stage2`…`office_stage4.glb` · `office_construction.glb`
- **Besonderheiten:** Baugrenze bis 7 (ab L14)

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Kleines Büro | L8 | 850.000 Geld · 260 Holz · 480 Stein | +18.000 Gewerbe/min · 2.000 Jobs |
| 2 | Bürogebäude | L12 | 1.400.000 Geld · 360 Holz · 700 Stein | +30.000 Gewerbe/min · 3.200 Jobs |
| 3 | Business Center | L15 | 3.000.000 Geld · 520 Holz · 1.100 Stein | +44.000 Gewerbe/min · 4.600 Jobs |
| 4 | Büroturm | L18 | 6.500.000 Geld · 700 Holz · 1.800 Stein | +62.000 Gewerbe/min · 6.500 Jobs |

## Energie

### Kohlekraftwerk — `power_plant`

- **Größenklasse:** XXL (8×8) · **Footprint:** 8×8 (fix über alle Stufen)
- **Asset-Budget:** 8 000–12 000 Tris, ≤ 1024² (bevorzugt 2 Sets), 3–5 Materialien
- **Ab Level:** 11 · **Stufen:** 2 · **Kategorie:** Energie
- **Benötigte GLBs:** `power_plant.glb` · `power_plant_stage2.glb` · `power_plant_construction.glb`
- **Modell-Nodes:** `chimney` (Dampf/Rauch am Kühlturm/Schlot)
- **Besonderheiten:** Baugrenze bis 3 (ab L16)

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Kohlekraftwerk | L11 | 700.000 Geld · 150 Holz · 450 Stein | +5.000 Energie · 30 Jobs · Ambiente -4 r=8 |
| 2 | Großkraftwerk | L16 | 2.800.000 Geld · 900 Stein | +9.000 Energie · 50 Jobs · Ambiente -5 r=9 |

### Windpark — `wind_farm`

- **Größenklasse:** XL (6×6–7×7) · **Footprint:** 7×7 (fix über alle Stufen)
- **Asset-Budget:** 5 000–9 000 Tris, ≤ 1024², 3–4 Materialien
- **Ab Level:** 11 · **Stufen:** 1 · **Kategorie:** Energie
- **Benötigte GLBs:** `wind_farm.glb` · `wind_farm_construction.glb`
- **Modell-Nodes:** `rotor` (drehende Rotorblätter je Turbine)
- **Besonderheiten:** Baugrenze bis 9 (ab L17)

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Windpark | L11 | 450.000 Geld · 100 Holz · 260 Stein | +2.200 Energie · 8 Jobs · Ambiente +1 r=5 |

## Freizeit

### Park — `park`

- **Größenklasse:** L (4×4–5×5) · **Footprint:** 5×5 (fix über alle Stufen)
- **Asset-Budget:** 3 000–6 000 Tris, ≤ 1024², 2–3 Materialien
- **Ab Level:** 7 · **Stufen:** 2 · **Kategorie:** Freizeit
- **Benötigte GLBs:** `park.glb` · `park_stage2.glb` · `park_construction.glb`
- **Besonderheiten:** kein Straßenanschluss nötig

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Park | L7 | 60.000 Geld · 90 Holz | Freizeit r=14 · Ambiente +3 r=8 |
| 2 | Stadtpark | L12 | 200.000 Geld · 220 Holz | Freizeit r=18 · Ambiente +4 r=10 |

### Spielplatz — `playground`

- **Größenklasse:** M (3×3) · **Footprint:** 3×3 (fix über alle Stufen)
- **Asset-Budget:** 1 500–3 500 Tris, ≤ 512², 2 Materialien
- **Ab Level:** 7 · **Stufen:** 1 · **Kategorie:** Freizeit
- **Benötigte GLBs:** `playground.glb` · `playground_construction.glb`
- **Besonderheiten:** kein Straßenanschluss nötig

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Spielplatz | L7 | 30.000 Geld · 60 Holz | Freizeit r=8 · Ambiente +1 r=5 |

## Dekoration

### Baum — `deco_tree`

- **Größenklasse:** XS (1×1) · **Footprint:** 1×1 (fix über alle Stufen)
- **Asset-Budget:** < 600 Tris, ≤ 256², 1 Material
- **Ab Level:** 7 · **Stufen:** 1 · **Kategorie:** Dekoration
- **Benötigte GLBs:** `deco_tree.glb` · `deco_tree_construction.glb`
- **Besonderheiten:** —

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Baum | L7 | 1.500 Geld | Ambiente +1 r=3 |

### Blumenbeet — `deco_flowerbed`

- **Größenklasse:** XS (1×1) · **Footprint:** 1×1 (fix über alle Stufen)
- **Asset-Budget:** < 600 Tris, ≤ 256², 1 Material
- **Ab Level:** 7 · **Stufen:** 1 · **Kategorie:** Dekoration
- **Benötigte GLBs:** `deco_flowerbed.glb` · `deco_flowerbed_construction.glb`
- **Besonderheiten:** —

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Blumenbeet | L7 | 2.400 Geld | Ambiente +1 r=3 |

### Zierbrunnen — `deco_fountain`

- **Größenklasse:** XS (1×1) · **Footprint:** 1×1 (fix über alle Stufen)
- **Asset-Budget:** < 600 Tris, ≤ 256², 1 Material
- **Ab Level:** 7 · **Stufen:** 1 · **Kategorie:** Dekoration
- **Benötigte GLBs:** `deco_fountain.glb` · `deco_fountain_construction.glb`
- **Besonderheiten:** —

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Zierbrunnen | L7 | 12.000 Geld · 15 Stein | Ambiente +2 r=4 |

### Parkbank — `deco_bench`

- **Größenklasse:** XS (1×1) · **Footprint:** 1×1 (fix über alle Stufen)
- **Asset-Budget:** < 600 Tris, ≤ 256², 1 Material
- **Ab Level:** 7 · **Stufen:** 1 · **Kategorie:** Dekoration
- **Benötigte GLBs:** `deco_bench.glb` · `deco_bench_construction.glb`
- **Besonderheiten:** —

| Stufe | Name | ab Level | Kosten | Kern-Wirkung |
|---|---|---|---|---|
| 1 | Parkbank | L7 | 3.000 Geld · 8 Holz | Ambiente +1 r=2 |

## Levelkurve (20 Level)

L15–L20 schalten kaum neue Gebäude frei, sondern gaten die Top-Stufen der Ketten (Meilenstein-Gefühl).

| Level | XP (kumuliert) | Schaltet frei | Belohnung |
|---|---|---|---|
| 1 | 0 | Straße, Kleines Haus | — |
| 2 | 36 | Sägewerk, Höhenstraße | 13.000 Geld |
| 3 | 130 | Brunnen, Bürgermeisterhaus | 20.000 Geld · 10 Gold |
| 4 | 310 | Bauernhof, Steinbruch | 30.000 Geld |
| 5 | 620 | Markt, Handelskontor | 47.000 Geld · 15 Gold |
| 6 | 1.120 | Kleiner Laden, Lagerhaus, Kleiner Anleger | 85.000 Geld |
| 7 | 1.780 | Park, Spielplatz, Wasserpumpe, Logistikzentrum, Baum, Blumenbeet, Zierbrunnen, Parkbank | 130.000 Geld · 20 Gold |
| 8 | 2.680 | Feuerwache, Kleines Büro | 200.000 Geld |
| 9 | 3.950 | Bäckerei, Flusshafen | 300.000 Geld · 25 Gold |
| 10 | 5.700 | — | 500.000 Geld · 50 Gold |
| 11 | 8.200 | Kohlekraftwerk, Windpark, Wasseraufbereitung | 700.000 Geld · 30 Gold |
| 12 | 11.500 | Supermarkt | 950.000 Geld |
| 13 | 15.800 | Polizeiwache | 1.300.000 Geld · 30 Gold |
| 14 | 21.400 | Klinik | 1.800.000 Geld |
| 15 | 28.600 | Wohnturm | 2.400.000 Geld · 40 Gold |
| 16 | 37.500 | — | 3.200.000 Geld |
| 17 | 48.500 | — | 4.200.000 Geld · 50 Gold |
| 18 | 62.000 | — | 5.500.000 Geld |
| 19 | 79.000 | — | 7.000.000 Geld · 60 Gold |
| 20 | 100.000 | — | 9.000.000 Geld · 100 Gold |
