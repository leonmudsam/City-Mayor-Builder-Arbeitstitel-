# 3D-Prompts — Gebäude

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.
> Gebäudeliste kommt aus `src/game/config/buildings.config.ts` — neue Gebäude/Stufen erscheinen automatisch.

Zielordner: `src/assets/models/buildings/<kategorie>/`, **Dateiname = Gebäude-ID** (Basis) bzw. `<id>_stage<N>.glb` (Stufe N ≙ Upgrade-Level N−1). **Ein Block je Stufe** — jede Stufe verdichtet den FIXEN Footprint sichtbar weiter. Jeder Block ist copy-paste-fertig (Stil-Prefix + Motiv) und trägt die volle Spezifikation. **Technik (Pflicht):** `.glb`, Texturen eingebettet, keine Lichter/Kameras, +Y oben, Front +Z, Pivot mittig an der Unterkante, 1 Tile = 1 Welt-Einheit. Stil-Details & Budgets: `docs/3D_WORLD_ASSETS.md`.

**Front/Eingang:** Vorderseite zeigt +Z zur Straße; der Renderer ergänzt automatisch Gehweg/Vorplatz. Volle Gameplay-Tabelle (Kosten, Effekte, Gates je Stufe): `docs/BUILDINGS.md`.

## Gebäude (aus buildings.config.ts)

### town_hall — 4 Stufen

#### `town_hall.glb` — Stufe 1/4

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a modest town hall with a small clock tower, a columned entrance, a flag and a red roof, a paved forecourt (fills a 5×5 civic plot)
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 5×5 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/4 — Basis `town_hall.glb`

#### `town_hall_stage2.glb` — Stufe 2/4

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — an expanded city administration: the town hall grown with side wings, more windows, a larger clock tower and a busier forecourt with lampposts (same 5×5 plot)
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 5×5 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/4 — `town_hall_stage2.glb`

#### `town_hall_stage3.glb` — Stufe 3/4

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a grand city palace: an ornate administrative palace with a dome, a colonnade, statues and a formal garden square (same 5×5 plot, clearly more prestigious)
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 5×5 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 3/4 — `town_hall_stage3.glb`

#### `town_hall_stage4.glb` — Stufe 4/4

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a monumental city hall: a towering civic landmark with a tall clock spire, grand staircase, fountains and flags dominating the plaza (same 5×5 plot, the city’s crown)
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 5×5 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 4/4 — `town_hall_stage4.glb`
> Baustelle (Bau *und* Upgrade): `town_hall_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### mayor_house — 1 Stufe

#### `mayor_house.glb` — Stufe 1/1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — an elegant mayor's residence, larger than a normal house, with a small portico, bay windows and a tidy front garden
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/1 — Basis `mayor_house.glb`
> Baustelle (Bau *und* Upgrade): `mayor_house_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### district_center — 1 Stufe

#### `district_center.glb` — Stufe 1/1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a modern district administration building, wide facade with a glass entrance, flags and a small forecourt
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 4×4 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/1 — Basis `district_center.glb`
> Baustelle (Bau *und* Upgrade): `district_center_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### house_small — 6 Stufen

#### `house_small.glb` — Stufe 1/6

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small cozy family house with a red pitched roof, a chimney, a tiny front garden and warm windows (fills a 3×3 plot with garden)
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/6 — Basis `house_small.glb`

#### `house_small_stage2.glb` — Stufe 2/6

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a detached single-family home: a slightly bigger house with a porch, a garage and a neat garden on the same 3×3 plot
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/6 — `house_small_stage2.glb`

#### `house_small_stage3.glb` — Stufe 3/6

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a semi-detached duplex: two joined homes with pitched roofs sharing the same 3×3 plot, two doorsteps and small gardens
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 3/6 — `house_small_stage3.glb`

#### `house_small_stage4.glb` — Stufe 4/6

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a multi-family house: a compact three-storey apartment house with balconies and a shared entrance filling the 3×3 plot
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 4/6 — `house_small_stage4.glb`

#### `house_small_stage5.glb` — Stufe 5/6

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — an apartment block: a five-storey residential building with rows of balconies, a flat roof and a small forecourt on the 3×3 plot
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 5/6 — `house_small_stage5.glb`

#### `house_small_stage6.glb` — Stufe 6/6

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a dense residential block: a tall filled-out apartment block covering the whole 3×3 plot, many balconies, roof units and a paved base — as many households as a whole street of starter houses
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 6/6 — `house_small_stage6.glb`
> Baustelle (Bau *und* Upgrade): `house_small_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### residential_tower — 3 Stufen

#### `residential_tower.glb` — Stufe 1/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a tall residential tower with many balconies, a flat roof and a modern colorful facade on a landscaped 5×5 plaza
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 5×5 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/3 — Basis `residential_tower.glb`

#### `residential_tower_stage2.glb` — Stufe 2/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a high-rise residential building: taller than the tower with a stepped silhouette, glass balconies and rooftop gardens (same 5×5 plaza)
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 5×5 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/3 — `residential_tower_stage2.glb`

#### `residential_tower_stage3.glb` — Stufe 3/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a skyscraper: a gleaming residential skyscraper piercing the skyline, glass-and-steel facade, sky terraces and a grand plaza base (same 5×5 plaza, metropolis endgame)
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 5×5 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 3/3 — `residential_tower_stage3.glb`
> Baustelle (Bau *und* Upgrade): `residential_tower_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### sawmill — 3 Stufen

#### `sawmill.glb` — Stufe 1/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a wooden sawmill with a pitched roof, log piles, a saw shed and a chimney (name the chimney node 'chimney'); fills a 4×4 works yard with a loading area
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 4×4 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Nodes: `chimney` (Rauch-Ursprung am Schornstein) · Stufe 1/3 — Basis `sawmill.glb`

#### `sawmill_stage2.glb` — Stufe 2/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a large sawmill: a bigger mill hall, more stacked logs, a conveyor and a second chimney on the 4×4 yard (name a chimney node 'chimney')
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 4×4 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Nodes: `chimney` (Rauch-Ursprung am Schornstein) · Stufe 2/3 — `sawmill_stage2.glb`

#### `sawmill_stage3.glb` — Stufe 3/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a timber combine: a full industrial wood-processing complex with multiple halls, cranes, huge log stockpiles and smoking chimneys filling the 4×4 yard (name a chimney node 'chimney')
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 4×4 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Nodes: `chimney` (Rauch-Ursprung am Schornstein) · Stufe 3/3 — `sawmill_stage3.glb`
> Baustelle (Bau *und* Upgrade): `sawmill_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### stone_pit_small — 1 Stufe

#### `stone_pit_small.glb` — Stufe 1/1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a tiny one-tile stone gathering spot: a shallow hand-dug scrape with a few loose surface rocks, a small sorted stone pile, a pickaxe leaning on a wooden post and a single wheelbarrow — humble, hand-worked, no machinery
```

**Spec:** Größenklasse `XS` — Deko/Kachel (< 600 Tris, ≤ 256², 1 Material) · Footprint 1×1 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/1 — Basis `stone_pit_small.glb`
> Baustelle (Bau *und* Upgrade): `stone_pit_small_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### stone_pit — 2 Stufen

#### `stone_pit.glb` — Stufe 1/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small open-air stone gathering pit on a 3×3 plot: a shallow scrape with loose surface rocks, a wheelbarrow, hand tools, sorted stone piles and a lean-to shelter
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/2 — Basis `stone_pit.glb`

#### `stone_pit_stage2.glb` — Stufe 2/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a stone collection yard on the same 3×3 plot: a sorting table, a simple hand crane, stacked pallets of dressed stone and a short cart track
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/2 — `stone_pit_stage2.glb`
> Baustelle (Bau *und* Upgrade): `stone_pit_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### quarry — 3 Stufen

#### `quarry.glb` — Stufe 1/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a stone quarry site with terraced rock, a small crane, gravel piles and a work shed on a 5×5 excavation plot
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 5×5 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/3 — Basis `quarry.glb`

#### `quarry_stage2.glb` — Stufe 2/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a deep quarry: a wider terraced pit with conveyor belts, dump trucks and larger spoil heaps on the 5×5 plot
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 5×5 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/3 — `quarry_stage2.glb`

#### `quarry_stage3.glb` — Stufe 3/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a mining complex: a full-scale rock-mining operation with heavy machinery, crushers, silos and rail carts filling the 5×5 plot
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 5×5 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 3/3 — `quarry_stage3.glb`
> Baustelle (Bau *und* Upgrade): `quarry_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### farm — 3 Stufen

#### `farm.glb` — Stufe 1/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a farm with a barn, a farmhouse, silos and fenced fields, warm rural look, filling a 6×6 farmstead plot
```

**Spec:** Größenklasse `XL` — Groß-Areal (5 000–9 000 Tris, ≤ 1024², 3–4 Materialien) · Footprint 6×6 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/3 — Basis `farm.glb`

#### `farm_stage2.glb` — Stufe 2/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a large farm: a bigger barn, more silos, extra outbuildings and expanded ploughed fields on the 6×6 plot
```

**Spec:** Größenklasse `XL` — Groß-Areal (5 000–9 000 Tris, ≤ 1024², 3–4 Materialien) · Footprint 6×6 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/3 — `farm_stage2.glb`

#### `farm_stage3.glb` — Stufe 3/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — an agricultural complex: an industrial-scale farm with greenhouses, tall grain silos, machinery sheds and dense fields filling the 6×6 plot
```

**Spec:** Größenklasse `XL` — Groß-Areal (5 000–9 000 Tris, ≤ 1024², 3–4 Materialien) · Footprint 6×6 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 3/3 — `farm_stage3.glb`
> Baustelle (Bau *und* Upgrade): `farm_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### wood_workshop — 3 Stufen

#### `wood_workshop.glb` — Stufe 1/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small timber joinery workshop on a 3×3 yard: a wooden hall with a wide door, a sawbench, stacked fresh planks under a lean-to and a delivery bay
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/3 — Basis `wood_workshop.glb`

#### `wood_workshop_stage2.glb` — Stufe 2/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a timber manufactory on the same 3×3 yard: a larger hall with a powered saw, a drying rack of boards, a small crane and a loaded handcart
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/3 — `wood_workshop_stage2.glb`

#### `wood_workshop_stage3.glb` — Stufe 3/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a timber works on the 3×3 yard: an industrial joinery with a tall hall, conveyor, dense plank stacks, a chimney and a busy loading bay
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 3/3 — `wood_workshop_stage3.glb`
> Baustelle (Bau *und* Upgrade): `wood_workshop_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### stone_workshop — 3 Stufen

#### `stone_workshop.glb` — Stufe 1/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small stonemason's workshop on a 3×3 yard: a stone-walled hall, a cutting frame, rough blocks on one side and dressed ashlar on the other
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/3 — Basis `stone_workshop.glb`

#### `stone_workshop_stage2.glb` — Stufe 2/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a stonemasonry on the same 3×3 yard: a bigger cutting hall with a hoist, several saw frames, pallets of dressed stone and a delivery bay
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/3 — `stone_workshop_stage2.glb`

#### `stone_workshop_stage3.glb` — Stufe 3/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a stone works on the 3×3 yard: an industrial stone-dressing plant with gantry, cutting bays, stacked ashlar blocks and a dust extractor
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 3/3 — `stone_workshop_stage3.glb`
> Baustelle (Bau *und* Upgrade): `stone_workshop_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### well — 2 Stufen

#### `well.glb` — Stufe 1/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small stone village well with a little wooden roof and a bucket (1×1)
```

**Spec:** Größenklasse `XS` — Deko/Kachel (< 600 Tris, ≤ 256², 1 Material) · Footprint 1×1 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/2 — Basis `well.glb`

#### `well_stage2.glb` — Stufe 2/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a deep well: a sturdier stone well with an iron pump mechanism and a raised base (1×1)
```

**Spec:** Größenklasse `XS` — Deko/Kachel (< 600 Tris, ≤ 256², 1 Material) · Footprint 1×1 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/2 — `well_stage2.glb`
> Baustelle (Bau *und* Upgrade): `well_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### water_pump — 2 Stufen

#### `water_pump.glb` — Stufe 1/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a compact water pumping station: a small building with pipes, valves and a tank on a 3×3 plot
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/2 — Basis `water_pump.glb`

#### `water_pump_stage2.glb` — Stufe 2/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a pumping works: a larger pump house with multiple tanks, a control room and a pipe manifold filling the 3×3 plot
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/2 — `water_pump_stage2.glb`
> Baustelle (Bau *und* Upgrade): `water_pump_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### warehouse — 2 Stufen

#### `warehouse.glb` — Stufe 1/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a rectangular storage warehouse with large roller doors, a flat roof and loading bays on a 4×4 yard
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 4×4 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/2 — Basis `warehouse.glb`

#### `warehouse_stage2.glb` — Stufe 2/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a high-bay warehouse: a taller automated storage building with tall racking visible through openings, more loading docks and parked trailers on the 4×4 yard
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 4×4 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/2 — `warehouse_stage2.glb`
> Baustelle (Bau *und* Upgrade): `warehouse_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### depot — 2 Stufen

#### `depot.glb` — Stufe 1/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a logistics depot: a large shed with loading docks, crates, a small yard and parked trailers on a 5×5 plot
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 5×5 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/2 — Basis `depot.glb`

#### `depot_stage2.glb` — Stufe 2/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a logistics hub: a bigger multi-dock distribution centre with a truck yard, container stacks and a control office filling the 5×5 plot
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 5×5 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/2 — `depot_stage2.glb`
> Baustelle (Bau *und* Upgrade): `depot_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### waterworks — 2 Stufen

#### `waterworks.glb` — Stufe 1/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a waterworks facility with round filtration tanks, pipes and a control building at the water’s edge on a 5×5 plot
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 5×5 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/2 — Basis `waterworks.glb`

#### `waterworks_stage2.glb` — Stufe 2/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a sewage/treatment works: additional large clarifier basins, aeration tanks and a bigger control building on the 5×5 plot
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 5×5 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/2 — `waterworks_stage2.glb`
> Baustelle (Bau *und* Upgrade): `waterworks_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### market — 2 Stufen

#### `market.glb` — Stufe 1/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small market with striped awnings, crates of produce and a paved front on a 3×3 square
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/2 — Basis `market.glb`

#### `market_stage2.glb` — Stufe 2/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a covered market hall: a larger roofed market building with arched openings, many stalls and a busy paved forecourt on the 3×3 square
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/2 — `market_stage2.glb`
> Baustelle (Bau *und* Upgrade): `market_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### supermarket — 2 Stufen

#### `supermarket.glb` — Stufe 1/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a modern supermarket: a wide flat building with a big storefront, a sign board and a small parking strip on a 4×4 plot
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 4×4 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/2 — Basis `supermarket.glb`

#### `supermarket_stage2.glb` — Stufe 2/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a shopping centre: a larger retail complex with a glass frontage, multiple storefronts and a bigger car park filling the 4×4 plot
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 4×4 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/2 — `supermarket_stage2.glb`
> Baustelle (Bau *und* Upgrade): `supermarket_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### bakery — 2 Stufen

#### `bakery.glb` — Stufe 1/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a charming corner bakery with a shop window, an awning and a chimney, warm inviting look (2×2)
```

**Spec:** Größenklasse `S` — kleines Gebäude (800–2 000 Tris, ≤ 512², 1–2 Materialien) · Footprint 2×2 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/2 — Basis `bakery.glb`

#### `bakery_stage2.glb` — Stufe 2/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a large bakery: a bigger bakery with a production annex, a delivery door and a taller chimney on the 2×2 plot
```

**Spec:** Größenklasse `S` — kleines Gebäude (800–2 000 Tris, ≤ 512², 1–2 Materialien) · Footprint 2×2 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/2 — `bakery_stage2.glb`
> Baustelle (Bau *und* Upgrade): `bakery_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### fire_station — 3 Stufen

#### `fire_station.glb` — Stufe 1/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small fire station with a red facade, a garage door, a short training tower and a flag on a 5×5 plot with a forecourt
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 5×5 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/3 — Basis `fire_station.glb`

#### `fire_station_stage2.glb` — Stufe 2/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a city fire station: a larger station with several garage bays, a taller drill tower, a vehicle yard and a green strip filling the 5×5 plot
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 5×5 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/3 — `fire_station_stage2.glb`

#### `fire_station_stage3.glb` — Stufe 3/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a fire response centre: a major headquarters with a long row of garage bays, a command tower, helipad markings and a busy apparatus yard filling the 5×5 plot
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 5×5 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 3/3 — `fire_station_stage3.glb`
> Baustelle (Bau *und* Upgrade): `fire_station_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### police_station — 3 Stufen

#### `police_station.glb` — Stufe 1/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a police station: a sturdy civic building with blue accents, an entrance porch and a flag on a 4×4 plot with a yard
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 4×4 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/3 — Basis `police_station.glb`

#### `police_station_stage2.glb` — Stufe 2/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a police precinct: a larger station with a parking yard for patrol cars, an extension wing and blue signage filling the 4×4 plot
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 4×4 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/3 — `police_station_stage2.glb`

#### `police_station_stage3.glb` — Stufe 3/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a police headquarters: an imposing presidium building with a secure courtyard, a communications mast and flags filling the 4×4 plot
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 4×4 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 3/3 — `police_station_stage3.glb`
> Baustelle (Bau *und* Upgrade): `police_station_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### hospital — 3 Stufen

#### `hospital.glb` — Stufe 1/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a clinic: a clean white medical building with a red cross sign, an ambulance bay and many windows on a 6×6 campus
```

**Spec:** Größenklasse `XL` — Groß-Areal (5 000–9 000 Tris, ≤ 1024², 3–4 Materialien) · Footprint 6×6 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/3 — Basis `hospital.glb`

#### `hospital_stage2.glb` — Stufe 2/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a hospital: a larger multi-wing hospital with a taller main block, a bigger ambulance bay and a helipad on the 6×6 campus
```

**Spec:** Größenklasse `XL` — Groß-Areal (5 000–9 000 Tris, ≤ 1024², 3–4 Materialien) · Footprint 6×6 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/3 — `hospital_stage2.glb`

#### `hospital_stage3.glb` — Stufe 3/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a university hospital: a sprawling medical campus with several connected wings, a research tower, a helipad and landscaped grounds filling the 6×6 campus
```

**Spec:** Größenklasse `XL` — Groß-Areal (5 000–9 000 Tris, ≤ 1024², 3–4 Materialien) · Footprint 6×6 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 3/3 — `hospital_stage3.glb`
> Baustelle (Bau *und* Upgrade): `hospital_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### trading_post — 3 Stufen

#### `trading_post.glb` — Stufe 1/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a trading post / merchant house with crates, barrels, an awning and a hanging sign on a 3×3 plot
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/3 — Basis `trading_post.glb`

#### `trading_post_stage2.glb` — Stufe 2/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a commodities exchange: a busier trading house with a weighing yard, more stacked goods and a signboard on the 3×3 plot
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/3 — `trading_post_stage2.glb`

#### `trading_post_stage3.glb` — Stufe 3/3

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — an export centre: a large trading complex with a loading yard, container stacks and an office wing filling the 3×3 plot
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 3/3 — `trading_post_stage3.glb`
> Baustelle (Bau *und* Upgrade): `trading_post_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### shop_small — 2 Stufen

#### `shop_small.glb` — Stufe 1/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small retail shop with a colorful storefront, an awning and a sign (2×2)
```

**Spec:** Größenklasse `S` — kleines Gebäude (800–2 000 Tris, ≤ 512², 1–2 Materialien) · Footprint 2×2 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/2 — Basis `shop_small.glb`

#### `shop_small_stage2.glb` — Stufe 2/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a retail parade: a row of two to three small joined shops with awnings and signs filling the 2×2 plot
```

**Spec:** Größenklasse `S` — kleines Gebäude (800–2 000 Tris, ≤ 512², 1–2 Materialien) · Footprint 2×2 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/2 — `shop_small_stage2.glb`
> Baustelle (Bau *und* Upgrade): `shop_small_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### office — 4 Stufen

#### `office.glb` — Stufe 1/4

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small office: a low-rise office building with a glass facade, clean modern lines and an entrance plaza on a 4×4 plot
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 4×4 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/4 — Basis `office.glb`

#### `office_stage2.glb` — Stufe 2/4

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — an office building: a taller mid-rise office block with a full glass curtain wall and a lobby entrance on the 4×4 plot
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 4×4 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/4 — `office_stage2.glb`

#### `office_stage3.glb` — Stufe 3/4

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a business center: a large corporate office complex with two connected towers, a plaza and flags filling the 4×4 plot
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 4×4 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 3/4 — `office_stage3.glb`

#### `office_stage4.glb` — Stufe 4/4

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — an office tower: a tall gleaming office skyscraper with a sleek glass-and-steel facade dominating the 4×4 plot
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 4×4 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 4/4 — `office_stage4.glb`
> Baustelle (Bau *und* Upgrade): `office_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### power_plant — 2 Stufen

#### `power_plant.glb` — Stufe 1/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a coal power plant: a large hall with tall smokestacks emitting steam, cooling towers and a coal yard filling an 8×8 industrial plot (name a smokestack node 'chimney')
```

**Spec:** Größenklasse `XXL` — Mega-Areal (8 000–12 000 Tris, ≤ 1024² (bevorzugt 2 Sets), 3–5 Materialien) · Footprint 8×8 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Nodes: `chimney` (Dampf/Rauch am Kühlturm/Schlot) · Stufe 1/2 — Basis `power_plant.glb`

#### `power_plant_stage2.glb` — Stufe 2/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a large power station: an expanded plant with more cooling towers, a bigger boiler house, a rail siding and towering smokestacks filling the 8×8 plot (name a smokestack node 'chimney')
```

**Spec:** Größenklasse `XXL` — Mega-Areal (8 000–12 000 Tris, ≤ 1024² (bevorzugt 2 Sets), 3–5 Materialien) · Footprint 8×8 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Nodes: `chimney` (Dampf/Rauch am Kühlturm/Schlot) · Stufe 2/2 — `power_plant_stage2.glb`
> Baustelle (Bau *und* Upgrade): `power_plant_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### wind_farm — 1 Stufe

#### `wind_farm.glb` — Stufe 1/1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a wind power station: a base building with a white wind turbine; put the rotor blades on a node named 'rotor' so they can spin
```

**Spec:** Größenklasse `XL` — Groß-Areal (5 000–9 000 Tris, ≤ 1024², 3–4 Materialien) · Footprint 7×7 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Nodes: `rotor` (drehende Rotorblätter je Turbine) · Stufe 1/1 — Basis `wind_farm.glb`
> Baustelle (Bau *und* Upgrade): `wind_farm_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### dock_small — 1 Stufe

#### `dock_small.glb` — Stufe 1/1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a compact wooden and stone quay with two mooring bollards, a short pier, stacked crates and a tiny harbor office; split footprint with water on the -Z side and land access on +Z
```

**Spec:** Größenklasse `S` — kleines Gebäude (800–2 000 Tris, ≤ 512², 1–2 Materialien) · Footprint Land 2×2 + Wasser 2×2, Rotation im 2×2-Bauplot, Mindesttiefe 0.55 m · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Nodes: `water_access` (Mitte der Wasserseite), `land_access` (Mitte der Landseite) · Stufe 1/1 — Basis `dock_small.glb`
> Baustelle (Bau *und* Upgrade): `dock_small_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### river_port — 1 Stufe

#### `river_port.glb` — Stufe 1/1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a substantial river and coastal cargo port with a broad stone quay, warehouse, gantry crane, loading apron, bollards, crates and a navigation light; split footprint with water on the -Z side and road access on +Z
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint Land 4×3 + Wasser 4×3, Rotation im 4×4-Bauplot, Mindesttiefe 0.7 m · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Nodes: `water_access` (Mitte der Kaikante), `land_access` (Tor zur Straßenseite), `crane` (optionaler Drehknoten) · Stufe 1/1 — Basis `river_port.glb`
> Baustelle (Bau *und* Upgrade): `river_port_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### park — 2 Stufen

#### `park.glb` — Stufe 1/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small green park with trees, paths, benches and a lawn, low and flat, on a 5×5 plot
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 5×5 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/2 — Basis `park.glb`

#### `park_stage2.glb` — Stufe 2/2

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a city park: a larger landscaped park with a pond, winding paths, tree clusters, flowerbeds and a bandstand filling the 5×5 plot
```

**Spec:** Größenklasse `L` — großes Gebäude (3 000–6 000 Tris, ≤ 1024², 2–3 Materialien) · Footprint 5×5 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 2/2 — `park_stage2.glb`
> Baustelle (Bau *und* Upgrade): `park_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### playground — 1 Stufe

#### `playground.glb` — Stufe 1/1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a children playground with a swing, a slide, a sandbox and colorful equipment on a soft ground
```

**Spec:** Größenklasse `M` — mittleres Gebäude (1 500–3 500 Tris, ≤ 512², 2 Materialien) · Footprint 3×3 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/1 — Basis `playground.glb`
> Baustelle (Bau *und* Upgrade): `playground_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### deco_tree — 1 Stufe

#### `deco_tree.glb` — Stufe 1/1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a single decorative ornamental tree on a small planter base
```

**Spec:** Größenklasse `XS` — Deko/Kachel (< 600 Tris, ≤ 256², 1 Material) · Footprint 1×1 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/1 — Basis `deco_tree.glb`
> Baustelle (Bau *und* Upgrade): `deco_tree_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### deco_flowerbed — 1 Stufe

#### `deco_flowerbed.glb` — Stufe 1/1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small decorative flowerbed with colorful flowers and a low border
```

**Spec:** Größenklasse `XS` — Deko/Kachel (< 600 Tris, ≤ 256², 1 Material) · Footprint 1×1 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/1 — Basis `deco_flowerbed.glb`
> Baustelle (Bau *und* Upgrade): `deco_flowerbed_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### deco_fountain — 1 Stufe

#### `deco_fountain.glb` — Stufe 1/1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small ornamental fountain with a round basin and a gentle water spout
```

**Spec:** Größenklasse `XS` — Deko/Kachel (< 600 Tris, ≤ 256², 1 Material) · Footprint 1×1 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/1 — Basis `deco_fountain.glb`
> Baustelle (Bau *und* Upgrade): `deco_fountain_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

### deco_bench — 1 Stufe

#### `deco_bench.glb` — Stufe 1/1

```text
Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z — a small park bench with a nearby lamp or planter on a paved patch
```

**Spec:** Größenklasse `XS` — Deko/Kachel (< 600 Tris, ≤ 256², 1 Material) · Footprint 1×1 (fix über alle Stufen) · Pivot unten-mittig (X/Z zentriert, Unterkante Y = 0) · Front +Z (Eingang zur Straße) · Stufe 1/1 — Basis `deco_bench.glb`
> Baustelle (Bau *und* Upgrade): `deco_bench_construction.glb`, sonst generisches Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.

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
