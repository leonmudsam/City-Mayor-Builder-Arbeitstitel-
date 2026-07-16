# 3D-Prompts — Gebäude

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.
> Gebäudeliste kommt aus `src/game/config/buildings.config.ts` — neue Gebäude erscheinen automatisch.

Zielordner: `src/assets/models/buildings/<kategorie>/`, **Dateiname = Gebäude-ID**. Jeder Block ist copy-paste-fertig (Stil-Prefix + Motiv) und trägt die volle Spezifikation. **Technik (Pflicht):** `.glb`, Texturen eingebettet, keine Lichter/Kameras, +Y oben, Front +Z, Pivot mittig an der Unterkante, 1 Tile = 1 Welt-Einheit. Stil-Details & Budgets: `docs/3D_WORLD_ASSETS.md`.

**Front/Eingang (Konzept, siehe docs/3D_WORLD_ASSETS.md „Gebäude-Front & Straßenanschluss"):** Vorderseite zeigt standardmäßig +Z zur Straße; der Renderer ergänzt künftig automatisch einen Gehweg/Vorplatz zwischen Gebäude und Straße. Noch nicht implementiert — betrifft nur die Platzierung, nicht das Modell selbst.

## Gebäude (aus buildings.config.ts)

### `town_hall.glb` — 3×3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a grand town hall with a clock tower, columns, a flag and a red roof, a small plaza in front
```

**Spec:** Größenklasse `building_large` — großes Gebäude (2 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Stufen: `town_hall_stage2`…`town_hall_stage4` (sichtbar weiterentwickelt) · Baustelle: `town_hall_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `mayor_house.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — an elegant mayor's residence, larger than a normal house, with a small portico, bay windows and a tidy front garden
```

**Spec:** Größenklasse `building_small` — kleines Gebäude (500–2 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Baustelle optional: `mayor_house_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `district_center.glb` — 3×3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a modern district administration building, wide facade with a glass entrance, flags and a small forecourt
```

**Spec:** Größenklasse `building_large` — großes Gebäude (2 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Baustelle optional: `district_center_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `house_small.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small cozy family house with a red pitched roof, a chimney, a tiny front garden and warm windows
```

**Spec:** Größenklasse `building_small` — kleines Gebäude (500–2 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Stufen: `house_small_stage2`…`house_small_stage6` (sichtbar weiterentwickelt) · Baustelle: `house_small_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `house_row.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a short terraced row house of two to three joined units with pitched roofs and small doorsteps
```

**Spec:** Größenklasse `building_small` — kleines Gebäude (500–2 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Stufen: `house_row_stage2`…`house_row_stage3` (sichtbar weiterentwickelt) · Baustelle: `house_row_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `apartment.glb` — 2×3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a mid-rise apartment building, three to four floors, balconies, a low roof and a tidy entrance
```

**Spec:** Größenklasse `building_large` — großes Gebäude (2 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Stufen: `apartment_stage2`…`apartment_stage3` (sichtbar weiterentwickelt) · Baustelle: `apartment_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `residential_tower.glb` — 3×3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a tall residential tower with many balconies, a flat roof and a modern colorful facade
```

**Spec:** Größenklasse `building_large` — großes Gebäude (2 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Stufen: `residential_tower_stage2`…`residential_tower_stage3` (sichtbar weiterentwickelt) · Baustelle: `residential_tower_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `sawmill.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a wooden sawmill with a pitched roof, log piles, a saw shed and a chimney (name the chimney node 'chimney')
```

**Spec:** Größenklasse `building_small` — kleines Gebäude (500–2 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Stufen: `sawmill_stage2`…`sawmill_stage4` (sichtbar weiterentwickelt) · Baustelle: `sawmill_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `quarry.glb` — 3×3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a stone quarry site with terraced rock, a small crane, gravel piles and a work shed
```

**Spec:** Größenklasse `building_large` — großes Gebäude (2 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Stufen: `quarry_stage2`…`quarry_stage4` (sichtbar weiterentwickelt) · Baustelle: `quarry_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `farm.glb` — 3×3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a farm with a barn, a farmhouse, silos and fenced fields, warm rural look
```

**Spec:** Größenklasse `building_large` — großes Gebäude (2 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Stufen: `farm_stage2`…`farm_stage4` (sichtbar weiterentwickelt) · Baustelle: `farm_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `well.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small stone village well with a little wooden roof and a bucket
```

**Spec:** Größenklasse `building_small` — kleines Gebäude (500–2 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Stufen: `well_stage2`…`well_stage2` (sichtbar weiterentwickelt) · Baustelle: `well_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `water_pump.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a compact water pumping station: a small building with pipes, valves and a tank
```

**Spec:** Größenklasse `building_small` — kleines Gebäude (500–2 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Stufen: `water_pump_stage2`…`water_pump_stage3` (sichtbar weiterentwickelt) · Baustelle: `water_pump_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `warehouse.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a rectangular storage warehouse with large roller doors, a flat roof and loading bays
```

**Spec:** Größenklasse `building_small` — kleines Gebäude (500–2 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Stufen: `warehouse_stage2`…`warehouse_stage2` (sichtbar weiterentwickelt) · Baustelle: `warehouse_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `depot.glb` — 3×3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a logistics depot: a large shed with loading docks, crates, a small yard and parked trailers
```

**Spec:** Größenklasse `building_large` — großes Gebäude (2 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Baustelle optional: `depot_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `waterworks.glb` — 3×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a waterworks facility with round filtration tanks, pipes and a control building
```

**Spec:** Größenklasse `building_large` — großes Gebäude (2 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Baustelle optional: `waterworks_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `market.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small market hall with striped awnings, crates of produce and a paved front
```

**Spec:** Größenklasse `building_small` — kleines Gebäude (500–2 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Stufen: `market_stage2`…`market_stage2` (sichtbar weiterentwickelt) · Baustelle: `market_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `supermarket.glb` — 3×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a modern supermarket: a wide flat building with a big storefront, a sign board and a small parking strip
```

**Spec:** Größenklasse `building_large` — großes Gebäude (2 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Baustelle optional: `supermarket_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `bakery.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a charming corner bakery with a shop window, an awning and a chimney, warm inviting look
```

**Spec:** Größenklasse `building_small` — kleines Gebäude (500–2 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Baustelle optional: `bakery_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `fire_station.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a fire station with a red facade, large garage doors, a small tower and a flag
```

**Spec:** Größenklasse `building_small` — kleines Gebäude (500–2 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Stufen: `fire_station_stage2`…`fire_station_stage2` (sichtbar weiterentwickelt) · Baustelle: `fire_station_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `police_station.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a police station: a sturdy civic building with blue accents, an entrance porch and a flag
```

**Spec:** Größenklasse `building_small` — kleines Gebäude (500–2 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Stufen: `police_station_stage2`…`police_station_stage2` (sichtbar weiterentwickelt) · Baustelle: `police_station_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `hospital.glb` — 3×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a hospital with a clean white facade, a red cross sign, an ambulance bay and many windows
```

**Spec:** Größenklasse `building_large` — großes Gebäude (2 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Stufen: `hospital_stage2`…`hospital_stage2` (sichtbar weiterentwickelt) · Baustelle: `hospital_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `trading_post.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a trading post / merchant house with crates, barrels, an awning and a hanging sign
```

**Spec:** Größenklasse `building_small` — kleines Gebäude (500–2 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Stufen: `trading_post_stage2`…`trading_post_stage3` (sichtbar weiterentwickelt) · Baustelle: `trading_post_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `shop_small.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small retail shop with a colorful storefront, an awning and a sign
```

**Spec:** Größenklasse `building_small` — kleines Gebäude (500–2 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Baustelle optional: `shop_small_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `office.glb` — 4×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a wide low-rise office building with a glass facade, clean modern lines and an entrance plaza
```

**Spec:** Größenklasse `building_large` — großes Gebäude (2 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Stufen: `office_stage2`…`office_stage3` (sichtbar weiterentwickelt) · Baustelle: `office_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `power_plant.glb` — 3×3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a coal power plant: a large hall with tall smokestacks emitting steam (name a smokestack node 'chimney')
```

**Spec:** Größenklasse `building_large` — großes Gebäude (2 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Baustelle optional: `power_plant_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `wind_farm.glb` — 3×3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a wind power station: a base building with a white wind turbine; put the rotor blades on a node named 'rotor' so they can spin
```

**Spec:** Größenklasse `building_large` — großes Gebäude (2 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Baustelle optional: `wind_farm_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `park.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small green park with trees, paths, benches and a lawn, low and flat
```

**Spec:** Größenklasse `building_small` — kleines Gebäude (500–2 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Stufen: `park_stage2`…`park_stage2` (sichtbar weiterentwickelt) · Baustelle: `park_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `playground.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a children playground with a swing, a slide, a sandbox and colorful equipment on a soft ground
```

**Spec:** Größenklasse `building_small` — kleines Gebäude (500–2 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Baustelle optional: `playground_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `deco_tree.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a single decorative ornamental tree on a small planter base
```

**Spec:** Größenklasse `building_small` — kleines Gebäude (500–2 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Baustelle optional: `deco_tree_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `deco_flowerbed.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small decorative flowerbed with colorful flowers and a low border
```

**Spec:** Größenklasse `building_small` — kleines Gebäude (500–2 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Baustelle optional: `deco_flowerbed_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `deco_fountain.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small ornamental fountain with a round basin and a gentle water spout
```

**Spec:** Größenklasse `building_small` — kleines Gebäude (500–2 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Baustelle optional: `deco_fountain_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

### `deco_bench.glb` — 1×1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small park bench with a nearby lamp or planter on a paved patch
```

**Spec:** Größenklasse `building_small` — kleines Gebäude (500–2 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · **live** (bereits verdrahtet)
> Baustelle optional: `deco_bench_construction.glb` · Eingang zeigt zur Straße, Gehweg wird automatisch ergänzt.

## Landmarken & Hero-Bauten (geplant)

Noch keine Config-IDs; per `visual.model3d` verknüpfbar (siehe docs/3D_WORLD_ASSETS.md §13).

### `lighthouse.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a red-and-white striped lighthouse on a rocky base with a lantern room
```

**Spec:** Größenklasse `landmark` — Landmarke (6 000–12 000 Tris, ≤ 1024², 2–4 Materialien) · Höhe ≈4–6 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Küste · platzierbar auf: Küstenklippe/Landzunge, Wasserzugang · *geplant* (noch nicht verdrahtet)

### `harbor_small.glb` — 4×4 / modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small harbor with wooden piers, bollards, crates and a calm water edge
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Küste, Bucht · platzierbar auf: Küste, Wasserzugang auf mind. 2 Seiten · *geplant* (noch nicht verdrahtet)

### `harbor_pier.glb` — modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a wooden harbor pier segment with planks and posts, extends over water
```

**Spec:** Größenklasse `terrain_feature` — Terrain-Feature (800–3 000 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Küste, See · platzierbar auf: ragt über Wasser · *geplant* (noch nicht verdrahtet)

### `ship_sailing.glb` — 2×4

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small stylized sailing ship / cargo boat, front facing +Z, readable silhouette
```

**Spec:** Größenklasse `prop_large` — großes Prop / Setpiece (500–1 500 Tris, ≤ 512², 1–2 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z, fährt entlang Wasserfläche · Biom: Meer, See · *geplant* (noch nicht verdrahtet)

### `monument_city.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a city monument: a stone obelisk or statue on a stepped base with a small plaza
```

**Spec:** Größenklasse `landmark` — Landmarke (6 000–12 000 Tris, ≤ 1024², 2–4 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Stadtzentrum, Platz · *geplant* (noch nicht verdrahtet)

### `museum.glb` — 3×3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a classical museum with columns, a wide staircase, a pediment and a flag
```

**Spec:** Größenklasse `landmark` — Landmarke (6 000–12 000 Tris, ≤ 1024², 2–4 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Stadtzentrum · *geplant* (noch nicht verdrahtet)

### `stadium.glb` — 4×4

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small sports stadium with tiered stands, a pitch and floodlights
```

**Spec:** Größenklasse `landmark` — Landmarke (6 000–12 000 Tris, ≤ 1024², 2–4 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Stadtrand · *geplant* (noch nicht verdrahtet)

### `observation_tower.glb` — 2×2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a tall slim observation tower with a viewing platform at the top
```

**Spec:** Größenklasse `landmark` — Landmarke (6 000–12 000 Tris, ≤ 1024², 2–4 Materialien) · Höhe ≈6–9 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Hochplateau, Stadtrand · *geplant* (noch nicht verdrahtet)

### `mountain_tunnel_landmark.glb` — 3×3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a mountain tunnel / mine entrance carved into rock, with a portal, rails and props
```

**Spec:** Größenklasse `landmark` — Landmarke (6 000–12 000 Tris, ≤ 1024², 2–4 Materialien) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge · platzierbar auf: Gebirgswand, an Straße/Gebirgspass · *geplant* (noch nicht verdrahtet)

### `hero_city_hall_plaza.glb` — 6×6, modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a hero city-hall plaza: the town hall with a grand paved square, fountains and greenery
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Stadtzentrum · Spawn: ein Exemplar, handplatziert im Stadtkern · *geplant* (noch nicht verdrahtet)

### `hero_market_district.glb` — 6×6, modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a hero market district: a bustling square with market stalls, awnings, crates and paved streets
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Stadtzentrum · Spawn: ein Exemplar, handplatziert nahe Marktachse · *geplant* (noch nicht verdrahtet)

### `hero_harbor_complex.glb` — 6×6, modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a hero harbor complex: piers, cranes, warehouses, moored boats and a promenade
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Küste, Bucht · Spawn: ein Exemplar, handplatziert an der Küstenzone · *geplant* (noch nicht verdrahtet)

### `hero_lighthouse_cliff.glb` — 6×6, modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a hero coastal cliff with a lighthouse on top, rocky shore and crashing waves
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Küste, Klippe · Spawn: ein Exemplar, handplatziert an prägnanter Klippe · *geplant* (noch nicht verdrahtet)

### `hero_grand_bridge.glb` — modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a hero grand stone-and-steel bridge spanning a wide river valley with towers
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Fluss/Schlucht · platzierbar auf: spannt Fluss oder Schlucht · *geplant* (noch nicht verdrahtet)

### `hero_mine_complex.glb` — 6×6, modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a hero mining complex: a mountain mine entrance with rail tracks, ore carts, a headframe and stockpiles
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Gebirge · Spawn: ein Exemplar, handplatziert am Gebirgsfuß · *geplant* (noch nicht verdrahtet)

### `hero_dam_complex.glb` — 8×4, modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a hero hydro dam complex: a concrete dam wall across a valley with spillways and a small control building
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Fluss/Tal · platzierbar auf: spannt Flusstal · *geplant* (noch nicht verdrahtet)

### `hero_central_park.glb` — 6×6, modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a hero central park: lawns, tree clusters, ponds, paths, a bandstand and benches
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Stadtzentrum, Grünfläche · *geplant* (noch nicht verdrahtet)

### `hero_waterfront_district.glb` — 6×6, modular

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a hero waterfront district: a scenic promenade with cafés, small piers and moored boats along the water
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Küste, Seeufer · *geplant* (noch nicht verdrahtet)

### `castle_hilltop.glb` — 4×4

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small stylized hilltop castle with a keep, walls and a flag, evoking a distant-future endgame prestige building
```

**Spec:** Größenklasse `landmark` — Landmarke (6 000–12 000 Tris, ≤ 1024², 2–4 Materialien) · Höhe ≈8–12 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Hochplateau, Gebirgsrand · *geplant* (noch nicht verdrahtet)

### `hero_grand_observatory.glb` — 4×4

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a hero endgame grand observatory: a domed tower on a rocky summit with a telescope, reachable by a winding path
```

**Spec:** Größenklasse `hero` — Hero-/Weltform (modular bevorzugt) (so niedrig wie möglich, modular, ≤ 1024², geteilt, 2–6 Materialien je Modul) · Höhe ≈10–14 Kacheln · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z · Biom: Hochplateau, Gebirgsgipfel · *geplant* (noch nicht verdrahtet)
