# Terrain-Texturen — Splatmap-Materialsystem (v0.73, Terrain 6.1)

> **Auto-generiert** aus `src/assets/terrainTextureManifest.ts`. Nicht von Hand editieren.
> Neue Texturen dazunehmen: Eintrag dort ergänzen, dann
> `WRITE_TERRAIN_DOCS=1 npx vitest run tests/terrainTextures.test.ts` (schreibt diese Datei neu).
> Der Test schlägt fehl, sobald die Doku veraltet ist.

Ersetzt einzelne kleine 3D-Modelle (Gras, kleine Felsen, Erde) durch ein **Terrain-Materialsystem**: die Bodenoberfläche besteht aus nahtlos kachelbaren, weich ineinander überblendeten Texturen statt aneinandergereihten Objekten. 3D-Modelle bleiben für große, prägende Elemente reserviert (Bäume, Landmarken, große Felsen, Gebäude, Brücken — siehe `docs/3D_WORLD_ASSETS.md`).

**Drop-in:** `.png`/`.webp`/`.jpg` in den unten angegebenen Ordner unter `src/assets/textures/terrain/…` legen, Dateiname exakt wie hier. Erkennung ist zentral über `terrainTextureUrl()`; fehlende Dateien fallen auf die gebackene Vertexpalette zurück, ohne die Welt zu blockieren.

## Gras

### `terrain_grass_01.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — lush green meadow grass, subtle blade detail, small clover patches, gentle color variation, no dirt patches
```

**Spec:** Ordner `textures/terrain/grass/` · 2048×2048 · nahtlos kachelbar · Stil: painterly, weich, leicht handgemalt · Palette: sattes Mittelgrün mit helleren/dunkleren Flecken · Einsatz: Standard-Bauland- und Grasland-Basis · Material: organisch, matt, leicht rau · Mischverhalten: Basis-Layer der Ebene (+0.3 bis +1.5); blendet mit terrain_earth_light/terrain_grass_dry an Rändern · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Grasland

### `terrain_grass_dark.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — shaded dark green forest-edge grass, cooler undertone, subtle moss speckles, no dirt patches
```

**Spec:** Ordner `textures/terrain/grass/` · 2048×2048 · nahtlos kachelbar · Stil: painterly, schattig · Palette: dunkles Waldgrün, kühler Unterton · Einsatz: Waldrand, Nordhänge, beschattete Flächen · Material: organisch, matt · Mischverhalten: blendet in terrain_moss/terrain_forest_floor am Waldrand · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Empfohlen** · Biome: Mischwald

### `terrain_grass_dry.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — dry sun-bleached grass, straw-yellow to olive tones, sparse patchy coverage, subtle wind-swept strokes
```

**Spec:** Ordner `textures/terrain/grass/` · 2048×2048 · nahtlos kachelbar · Stil: painterly, warm · Palette: gelbgrün bis strohfarben · Einsatz: trockene Hügel, sonnige Hänge, Sommerlook · Material: organisch, matt, leicht struppig · Mischverhalten: blendet mit terrain_grass_01 bei Übergängen, dominiert auf steileren sonnigen Hängen · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Empfohlen** · Biome: Grasland

### `terrain_meadow.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — wildflower meadow, small scattered white/yellow/red flowers over green grass, natural clustering
```

**Spec:** Ordner `textures/terrain/grass/` · 2048×2048 · nahtlos kachelbar · Stil: painterly, verspielt · Palette: Grün mit bunten Blütentupfern (Weiß/Gelb/Rot) · Einsatz: Wiesen, Parks, dekorative Grünflächen · Material: organisch, matt · Mischverhalten: Detail-Overlay auf terrain_grass_01, kein eigener Höhenbereich · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Empfohlen** · Biome: Grasland

### `terrain_moss.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — soft dense moss patch, deep green, slightly damp look, small texture bumps
```

**Spec:** Ordner `textures/terrain/grass/` · 2048×2048 · nahtlos kachelbar · Stil: painterly, feucht · Palette: dunkles Moosgrün · Einsatz: feuchte Waldstellen, Felsfüße, Schatten · Material: organisch, weich, leicht glänzend · Mischverhalten: blendet zwischen terrain_grass_dark und terrain_forest_floor/terrain_rock · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Optional** · Biome: Mischwald

### `grass_meadow.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — natural medium-green meadow grass with broad painterly variation, sparse tiny wildflower flecks and open breathing areas
```

**Spec:** Ordner `textures/terrain/grass/` · 2048×2048 · nahtlos kachelbar · Stil: painterly stylized realism, weich und natuerlich · Palette: Mittelgruen, Oliv und Moos mit sehr kleinen cremefarbenen und blauen Bluetentupfern · Einsatz: hochwertige Graslandbasis und offene Lichtungen · Material: kurzes Wiesengras, organische Cluster, geringe Mikrounruhe · Mischverhalten: Basis-Layer der Ebene; trockenes Gras, Waldboden und fruchtbare Erde ueberblenden regional · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Grasland, Hügelland

### `grass_meadow_cartoon.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — helle malerische cartoon-wiesenbasis für bauland und täler, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/grass/` · 1024×1024 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: Smaragd, Moosgrün, Gelbgrün und kleine Ockertupfer · Einsatz: Helle malerische Cartoon-Wiesenbasis für Bauland und Täler · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Grasland

### `grass_meadow_fresh.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — frische wiesenbasis und bauland, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/grass/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: sattes Mittelgrün · Einsatz: Frische Wiesenbasis und Bauland · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Grasland

### `grass_meadow_dark.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — beschattete wiesen und waldsäume, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/grass/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: dunkles Waldgrün · Einsatz: Beschattete Wiesen und Waldsäume · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Grasland, Mischwald

### `grass_meadow_dry.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — trockene sonnige wiesen, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/grass/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: Gelbgrün und Stroh · Einsatz: Trockene sonnige Wiesen · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Trockene Ebene

### `grass_soft_ground.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — weicher übergangsboden in mulden, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/grass/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: gedecktes Grünbraun · Einsatz: Weicher Übergangsboden in Mulden · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Grasland

### `grass_mossy.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — feuchte moosige lichtungen, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/grass/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: Moosgrün · Einsatz: Feuchte moosige Lichtungen · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Mischwald, Sumpf

### `grass_wildflowers.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — seltene blütencluster in nahsicht, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/grass/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: Grün mit kleinen Farbtupfern · Einsatz: Seltene Blütencluster in Nahsicht · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Grasland

### `grass_trampled.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — genutzte flächen und wegränder, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/grass/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: Oliv und Erdbraun · Einsatz: Genutzte Flächen und Wegränder · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Grasland

### `grass_wet.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — regennasse uferwiesen, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/grass/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: tiefes nasses Grün · Einsatz: Regennasse Uferwiesen · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Küste, Flusstal

### `forest_edge_grass.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — weicher wald-wiesen-übergang, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/grass/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: Waldgrün zu Wiesengrün · Einsatz: Weicher Wald-Wiesen-Übergang · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Mischwald, Grasland

### `dry_steppe.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — warme trockene regionalbasis, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/grass/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: Oliv, Ocker und Stroh · Einsatz: Warme trockene Regionalbasis · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Trockene Ebene

## Erde

### `terrain_earth_light.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — light dry beige-brown earth, fine grain, small pebbles, natural patchy texture
```

**Spec:** Ordner `textures/terrain/earth/` · 2048×2048 · nahtlos kachelbar · Stil: painterly, trocken · Palette: helles Beige-Braun · Einsatz: Wegränder, trockene Übergangsflächen, Bauplatz-Erdaushub · Material: körnig, matt · Mischverhalten: Übergang zwischen terrain_grass_01 und terrain_sand/terrain_path · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Pflicht** · Biome: Grasland

### `terrain_earth_dark.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — rich dark fertile soil, fine grain, subtle organic clumps, no plants
```

**Spec:** Ordner `textures/terrain/earth/` · 2048×2048 · nahtlos kachelbar · Stil: painterly, fruchtbar · Palette: dunkles Schokoladenbraun · Einsatz: fruchtbares Land, Beete, Übergang zu Feldern · Material: körnig, leicht feucht wirkend · Mischverhalten: Basis für die Feld-Texturen (terrain_field_*), blendet mit terrain_grass_01 · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Pflicht** · Biome: Fruchtbares Land

### `terrain_earth_wet.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — wet muddy dark soil, small puddle highlights, subtle sheen, natural uneven surface
```

**Spec:** Ordner `textures/terrain/earth/` · 2048×2048 · nahtlos kachelbar · Stil: painterly, feucht/matschig · Palette: dunkles Braun mit leichtem Glanz · Einsatz: Uferzonen, Flussnähe, Regenpfützen-Look · Material: glänzend-matt, leicht reflektierend · Mischverhalten: Splatmap-Feuchtigkeitsregel: ersetzt trockene Erde direkt an Fluss/See/Meer · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Empfohlen** · Biome: Fluss/See/Meer

### `terrain_forest_floor.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — forest floor with pine needles, scattered leaves, small roots and twigs, earthy brown base
```

**Spec:** Ordner `textures/terrain/earth/` · 2048×2048 · nahtlos kachelbar · Stil: painterly, natürlich · Palette: braun mit grünen/roten Laubtupfern · Einsatz: Waldboden unter Baumkronen · Material: organisch, körnig · Mischverhalten: blendet mit terrain_moss/terrain_grass_dark am Waldrand · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Pflicht** · Biome: Mischwald

### `terrain_farmland.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — even brown farmland soil base, ready for crops, subtle texture, no furrows yet
```

**Spec:** Ordner `textures/terrain/earth/` · 2048×2048 · nahtlos kachelbar · Stil: painterly, rural · Palette: mittelbraun, gleichmäßig · Einsatz: Acker-Basisboden vor der Bepflanzung · Material: körnig, matt · Mischverhalten: Basis unter terrain_field_plowed/terrain_field_wheat/terrain_field_harvest · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Pflicht** · Biome: Fruchtbares Land

### `forest_floor_cartoon.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — ruhige helle cartoon-waldbodenbasis mit breiten moos- und laubformen, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/forest/` · 1024×1024 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: Moosgrün, warmes Oliv, Erdbraun und kleine Goldakzente · Einsatz: Ruhige helle Cartoon-Waldbodenbasis mit breiten Moos- und Laubformen · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Pflicht** · Biome: Mischwald

### `forest_floor_needles.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — nadelwaldboden, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/earth/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: Braun und dunkles Grün · Einsatz: Nadelwaldboden · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Pflicht** · Biome: Mischwald

### `forest_floor_moss.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — moosiger waldboden-basislayer, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/earth/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: Moosgrün und Torfbraun · Einsatz: Moosiger Waldboden-Basislayer · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Pflicht** · Biome: Mischwald

### `forest_floor_leaves.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — laubwaldboden, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/earth/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: Rotbraun und Oliv · Einsatz: Laubwaldboden · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Pflicht** · Biome: Mischwald

### `forest_floor_dark_soil.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — dunkle feuchte walderde, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/earth/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: Schokoladenbraun · Einsatz: Dunkle feuchte Walderde · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Pflicht** · Biome: Mischwald, Sumpf

### `forest_floor_roots.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — wurzelreiche waldränder, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/earth/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: Erdbraun und Grau · Einsatz: Wurzelreiche Waldränder · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Pflicht** · Biome: Mischwald

### `fertile_valley_ground.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — fruchtbare tal- und ackerbasis, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/earth/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: sattes Grün und dunkle Erde · Einsatz: Fruchtbare Tal- und Ackerbasis · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Pflicht** · Biome: Fruchtbares Land

## Stein

### `terrain_rock.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — small stylized grey rocky ground patch, cracked texture, warm highlight tones, low-poly friendly
```

**Spec:** Ordner `textures/terrain/stone/` · 2048×2048 · nahtlos kachelbar · Stil: painterly, low-poly-freundlich · Palette: mittelgrau mit warmen Flecken · Einsatz: kleine Felsflächen, Gebirgsrand, Wegsteine · Material: hart, matt, leicht rau · Mischverhalten: Übergangstextur zwischen Gras/Erde und terrain_mountain in Hügel-/Gebirgsfuß-Zone · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Pflicht** · Biome: Gebirge, Küste

### `terrain_stone.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — flat grey paving stone tiles, clean joints, subtle weathering, orthographic top-down
```

**Spec:** Ordner `textures/terrain/stone/` · 2048×2048 · nahtlos kachelbar · Stil: painterly, bearbeitet · Palette: helles Grau · Einsatz: Steinplatten, Plätze, befestigte Wege · Material: hart, glatt-matt, geometrisches Fugenmuster · Mischverhalten: eigenständige Kachel (Platz/Weg), kein Splatmap-Blend nötig · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Empfohlen** · Biome: Straßen/Wege

### `terrain_mountain.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — large rugged mountain rock face, deep cracks and ridges, dark grey-brown, layered stone strata
```

**Spec:** Ordner `textures/terrain/stone/` · 2048×2048 · nahtlos kachelbar · Stil: painterly, massiv · Palette: dunkles Grau-Braun mit Rissen · Einsatz: großflächiger Gebirgsfels (Hochgebirge) · Material: hart, sehr rau, stark strukturiert · Mischverhalten: dominant über +2.5 Kacheln, blendet mit terrain_rock/terrain_cliff · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Pflicht** · Biome: Gebirge

### `terrain_cliff.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — steep layered slate cliff face, horizontal rock strata bands, weathered grey tones
```

**Spec:** Ordner `textures/terrain/stone/` · 2048×2048 · nahtlos kachelbar · Stil: painterly, geschichtet · Palette: Schiefergrau mit horizontalen Bändern · Einsatz: steile Klippen, Küstenfelsen, Schluchtwände · Material: hart, geschichtet, rau · Mischverhalten: Splatmap-Neigungsregel: dominant bei Steilheit > 35° · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Pflicht** · Biome: Gebirge, Küste

### `terrain_rock_granite.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — coarse-grained pinkish-grey granite rock surface, speckled mineral texture, weathered
```

**Spec:** Ordner `textures/terrain/stone/` · 2048×2048 · nahtlos kachelbar · Stil: painterly, grobkörnig · Palette: rötlich-graues Granit · Einsatz: Gebirgsvariante für Abwechslung/Steinbrüche · Material: hart, grobkörnig gesprenkelt · Mischverhalten: Variante zu terrain_mountain, gleicher Höhenbereich · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Optional** · Biome: Gebirge

### `terrain_gravel.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — loose gravel and scree, mixed grey-brown stone chips, natural random scatter, top-down
```

**Spec:** Ordner `textures/terrain/stone/` · 2048×2048 · nahtlos kachelbar · Stil: painterly, klein-teilig · Palette: graubraun, gemischte Korngröße · Einsatz: Schotter/Geröll, Wegbeläge, Straßenränder · Material: körnig, unregelmäßig · Mischverhalten: blendet mit terrain_path/terrain_road_edge und am Gebirgsfuß mit terrain_rock · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Empfohlen** · Biome: Gebirge, Straßen/Wege

## Gebirge 5.0

### `mountain_rock_base.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — light warm-grey alpine bedrock with broad angular strata, restrained moss traces and no mirrored pattern
```

**Spec:** Ordner `textures/terrain/mountain/` · 2048×2048 · nahtlos kachelbar · Stil: painterly stylized realism, helle alpine Makroformen · Palette: warmes Hellgrau, Steinbeige und dezente moosgruene Fugen · Einsatz: triplanare Felsbasis fuer Mittel- und Hochgebirge · Material: breite Schichtungen, kantige Platten, geringe Mikrokörnung · Mischverhalten: hoehen- und hangabhaengig; triplanar mit cliff, Geröll und Schnee · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Gebirge, Hochland

### `mountain_snow.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — clean compact wind-swept alpine snow with broad soft drifts and restrained pale-blue mineral seams
```

**Spec:** Ordner `textures/terrain/mountain/` · 2048×2048 · nahtlos kachelbar · Stil: painterly stylized realism, kompakt und windgeformt · Palette: warmes Off-White mit sehr hellem Blaugrau · Einsatz: Gipfelzone oberhalb der Felsbaender · Material: weiche breite Verwehungen, dezente Eiskrusten · Mischverhalten: nur in grosser Hoehe; Alpine-Profil verstaerkt, Hang reduziert · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Gebirge

### `mountain_cliff_cartoon.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — helle malerische cartoon-felsbasis für berge und klippen, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/mountain/` · 1024×1024 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: warmes Hellgrau, Beige und Moosgrün · Einsatz: Helle malerische Cartoon-Felsbasis für Berge und Klippen · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Gebirge, Küste

### `mountain_granite_base.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — triplanare alpine felsbasis, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/mountain/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: warmes Granitgrau und Beige · Einsatz: Triplanare alpine Felsbasis · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Gebirge

### `mountain_granite_light.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — sonnenflächen und helle grate, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/mountain/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: helles Steingrau · Einsatz: Sonnenflächen und helle Grate · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Gebirge

### `mountain_granite_dark.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — nordflanken und tiefe fugen, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/mountain/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: Anthrazit und kühles Grau · Einsatz: Nordflanken und tiefe Fugen · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Gebirge

### `mountain_cliff_faceted.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — steile kantige klippenflächen, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/mountain/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: Schiefergrau mit warmen Kanten · Einsatz: Steile kantige Klippenflächen · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Gebirge, Küste

### `mountain_strata.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — breite geologische schichtbänder, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/mountain/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: Grau, Beige und Ocker · Einsatz: Breite geologische Schichtbänder · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Gebirge

### `mountain_scree.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — geröllfächer am gebirgsfuß, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/mountain/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: gemischtes Steingrau · Einsatz: Geröllfächer am Gebirgsfuß · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Gebirge

### `mountain_moss.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — moosige untere felshänge, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/mountain/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: Moosgrün und Graubraun · Einsatz: Moosige untere Felshänge · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Gebirge, Mischwald

### `mountain_wet_rock.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — nasse felsen an wasserfällen und küsten, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/mountain/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: dunkles Graphitgrau · Einsatz: Nasse Felsen an Wasserfällen und Küsten · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Gebirge, Küste

## Wüste 5.0

### `desert_sand_red.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — burnt-sienna desert ground with compact sand, eroded sandstone plates and shallow cracked-earth seams
```

**Spec:** Ordner `textures/terrain/desert/` · 2048×2048 · nahtlos kachelbar · Stil: painterly stylized realism, warm und erosionsgepraegt · Palette: Terrakotta, Rostorange, Ocker und dunkles Rotbraun · Einsatz: visuelle Wueste der roten Suedostkueste · Material: kompakter Sand, breite Sandsteinplatten, flache Trockenrisse · Mischverhalten: organisch mit trockenem Gras, Kuestensand und Fels; keine Gameplaywirkung · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–fern · Priorität: **Pflicht** · Biome: Wüste, Trockene Ebene

## Sumpf 5.0

### `swamp_mud.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — dark wet peat and olive-brown mud with broad mossy patches and shallow water-darkened seams
```

**Spec:** Ordner `textures/terrain/swamp/` · 2048×2048 · nahtlos kachelbar · Stil: painterly stylized realism, feucht und moosig · Palette: Torfbraun, gedämpftes Oliv, Moosgruen und nasses Anthrazit · Einsatz: Moorboden der westlichen Sumpfbucht · Material: gesaettigter Schlamm, Torf, Moosinseln und flache feuchte Adern · Mischverhalten: niedrige Lagen; weich mit Waldboden, Feuchterde und Schilfufer · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Pflicht** · Biome: Sumpf

### `moor_heather_ground.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — moor- und heideboden, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/swamp/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: Torfbraun, Violett und Oliv · Einsatz: Moor- und Heideboden · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Pflicht** · Biome: Sumpf

## Küste 5.0

### `coast_pebbles.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — rounded slate and granite coastal pebbles mixed with muted damp sand and natural size variation
```

**Spec:** Ordner `textures/terrain/coast/` · 2048×2048 · nahtlos kachelbar · Stil: painterly stylized realism, rund gewaschene Kuestensteine · Palette: Blaugrau, warmes Steingrau, Beige und dezentes Seegruen · Einsatz: Kiesbuchten, Felskuesten und Flussmuendungen · Material: runde Kiesel, feuchter Schotter und wenig Sand · Mischverhalten: niedrige Kuestenlagen; mischt Sand, Fels und den tuerkisen Flachwassersaum · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Pflicht** · Biome: Küste, Flusstal

### `coast_sand_cartoon.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — helle malerische cartoon-basis für strände und flache bauufer, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/coast/` · 1024×1024 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: Elfenbein, Honigbeige, Hellgold und Türkisgrau · Einsatz: Helle malerische Cartoon-Basis für Strände und flache Bauufer · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Pflicht** · Biome: Küste, Flusstal

### `coast_shore_accessible.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — baubare flache uferzone, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/coast/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: Nassgrün, Sand und Kies · Einsatz: Baubare flache Uferzone · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Pflicht** · Biome: Küste, Flusstal

### `coast_sand_wet.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — nasser sand direkt am wassersaum, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/coast/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: Beige und dunkles Ocker · Einsatz: Nasser Sand direkt am Wassersaum · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Pflicht** · Biome: Küste

### `coast_gravel_stylized.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — stilisierter uferkies, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/coast/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: Blaugrau und Beige · Einsatz: Stilisierter Uferkies · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Pflicht** · Biome: Küste, Flusstal

### `coast_mud_fertile.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — fruchtbarer schlamm an flussauen, broad painterly low-poly shapes, restrained micro detail
```

**Spec:** Ordner `textures/terrain/coast/` · 2048×2048 · nahtlos kachelbar · Stil: stilisiert, low-poly-kompatibel, malerische Makroformen · Palette: dunkles Braun und Oliv · Einsatz: Fruchtbarer Schlamm an Flussauen · Material: matt bis natürlich feucht, breite Formen statt Foto-Mikrorauschen · Mischverhalten: weltkoordinatenbasiert nach Biom, Höhe, Neigung und Wassernähe; Nahdetail per LOD · Maps: Normal ✓ · Roughness ✓ · AO ✓ · Height ✓ · Detailstufe: nah–mittel · Priorität: **Pflicht** · Biome: Flusstal, Sumpf

## Sand

### `terrain_sand.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — fine light beige sand, subtle grain texture, soft natural ripples
```

**Spec:** Ordner `textures/terrain/sand/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, fein · Palette: helles Beige · Einsatz: allgemeine Sandflächen, Basis-Sand · Material: fein, matt, leicht körnig · Mischverhalten: Basis für terrain_sand_coast/terrain_sand_river/terrain_sand_dune · Maps: Normal ✓ · Roughness ✓ · AO – · Height ✓ · Detailstufe: nah · Priorität: **Pflicht** · Biome: Küste

### `terrain_sand_coast.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — sandy beach with a darker wet tideline edge, fine grain, gentle foam residue
```

**Spec:** Ordner `textures/terrain/sand/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, feucht am Saum · Palette: helles Beige mit dunklerem Nasssaum · Einsatz: Strand direkt am Meer · Material: fein, teils feucht-glänzend · Mischverhalten: Splatmap-Feuchtigkeitsregel direkt an terrain_deep_water/terrain_shallow_water · Maps: Normal ✓ · Roughness ✓ · AO – · Height ✓ · Detailstufe: nah · Priorität: **Pflicht** · Biome: Küste

### `terrain_sand_river.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — coarse riverbank sand with small pebbles, greyish-beige tone, natural scattered texture
```

**Spec:** Ordner `textures/terrain/sand/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, grobkörniger · Palette: graubeige · Einsatz: Flussufer-Sandbänke · Material: grobkörniger als Küstensand, leicht kiesig · Mischverhalten: schmaler Saum entlang terrain_riverbed/terrain_shallow_water · Maps: Normal ✓ · Roughness ✓ · AO – · Height ✓ · Detailstufe: nah · Priorität: **Empfohlen** · Biome: Fluss/See/Meer

### `terrain_sand_dune.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — wind-rippled dune sand, warm golden-beige tone, soft wave-like ripple pattern
```

**Spec:** Ordner `textures/terrain/sand/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, wellig · Palette: warmes Beige-Gold · Einsatz: Dünen, trockene Küstenhügel · Material: fein, mit sichtbarem Windrippel-Muster · Mischverhalten: Höhenvariante von terrain_sand, weiter von der Wasserlinie entfernt · Maps: Normal ✓ · Roughness ✓ · AO – · Height ✓ · Detailstufe: nah · Priorität: **Optional** · Biome: Küste

## Schnee (optional — kein aktueller Terrain-Typ)

### `terrain_snow.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — fresh soft snow, subtle blue-tinted shadows, gentle sparkle, smooth drifts
```

**Spec:** Ordner `textures/terrain/snow/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, weich · Palette: reines Weiß mit leicht blauem Schatten · Einsatz: Hochgebirge (zukünftig, kein aktueller Terrain-Typ) · Material: weich, matt, leicht glitzernd · Mischverhalten: ersetzt Fels-Anteil über +4 Kacheln, sobald ein Schnee-Biom existiert · Maps: Normal ✓ · Roughness ✓ · AO – · Height ✓ · Detailstufe: nah · Priorität: **Optional** · Biome: Gebirge

### `terrain_ice.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — frozen ice surface, pale blue-grey, subtle cracks, semi-translucent look
```

**Spec:** Ordner `textures/terrain/snow/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, glatt · Palette: helles Blaugrau, halbtransparent wirkend · Einsatz: zugefrorene Gewässer (zukünftig) · Material: glatt, glänzend, leicht durchscheinend · Mischverhalten: Ersatz-Textur für terrain_deep_water in kalten Zonen (zukünftig) · Maps: Normal ✓ · Roughness ✓ · AO – · Height ✓ · Detailstufe: nah · Priorität: **Optional** · Biome: Fluss/See/Meer

### `terrain_snow_rock.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — rocky mountain surface partially covered in snow patches, grey stone with white accents
```

**Spec:** Ordner `textures/terrain/snow/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, vereist · Palette: Grau mit weißen Schneeflecken · Einsatz: vereiste Felsen im Hochgebirge (zukünftig) · Material: hart, teilweise weich (Schneeauflage) · Mischverhalten: Mischtextur terrain_mountain + terrain_snow, oberste Höhenstufe · Maps: Normal ✓ · Roughness ✓ · AO – · Height ✓ · Detailstufe: nah · Priorität: **Optional** · Biome: Gebirge

### `terrain_snow_drift.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — wind-sculpted snow drift, soft undulating ridges, gentle grey shadow accents
```

**Spec:** Ordner `textures/terrain/snow/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, windgeformt · Palette: Weiß mit sanften Grauschatten · Einsatz: Schneeverwehungen an Kämmen (zukünftig) · Material: weich, mit sichtbarem Windrippel-Muster · Mischverhalten: Detail-Overlay auf terrain_snow an windexponierten Kämmen · Maps: Normal ✓ · Roughness ✓ · AO – · Height ✓ · Detailstufe: nah · Priorität: **Optional** · Biome: Gebirge

## Wasser

### `terrain_riverbed.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — visible riverbed under shallow water, smooth pebbles and light sand, seen through clear water
```

**Spec:** Ordner `textures/terrain/water/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, sichtbar durchs Wasser · Palette: graubraun mit Kieseln · Einsatz: sichtbarer Flussgrund an seichten Stellen · Material: körnig, unter der Wasseroberfläche liegend · Mischverhalten: liegt unter dem animierten Wasser-Shader (v0.37), an seichten Stellen sichtbar · Maps: Normal ✓ · Roughness – · AO – · Height – · Detailstufe: mittel · Priorität: **Empfohlen** · Biome: Fluss/See/Meer

### `terrain_shallow_water.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — clear shallow turquoise water, sandy bottom visible, soft light caustics
```

**Spec:** Ordner `textures/terrain/water/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, klar · Palette: helles Türkis-Blau · Einsatz: seichte Stellen an Ufern, Flussrändern · Material: transparent wirkend, leicht changierend · Mischverhalten: Übergang zwischen terrain_sand_coast/terrain_riverbed und terrain_deep_water · Maps: Normal ✓ · Roughness – · AO – · Height – · Detailstufe: mittel · Priorität: **Pflicht** · Biome: Fluss/See/Meer

### `terrain_deep_water.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — deep calm blue sea/lake water, subtle gentle wave pattern, rich saturated tone
```

**Spec:** Ordner `textures/terrain/water/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, tief · Palette: sattes Dunkelblau · Einsatz: See-/Meeresfläche · Material: gleichmäßig, leicht glänzend · Mischverhalten: Basis der Wasserfläche, blendet zu terrain_shallow_water am Ufer · Maps: Normal ✓ · Roughness – · AO – · Height – · Detailstufe: mittel · Priorität: **Pflicht** · Biome: Fluss/See/Meer

### `terrain_coast.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — gentle surf foam line where beach meets sea, soft white foam over turquoise water edge
```

**Spec:** Ordner `textures/terrain/water/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, Brandung · Palette: Weiß-Schaum auf Türkis/Beige · Einsatz: Strand-Wasser-Übergang mit Brandungssaum · Material: schaumig, bewegt wirkend · Mischverhalten: schmaler Saum zwischen terrain_sand_coast und terrain_shallow_water · Maps: Normal ✓ · Roughness – · AO – · Height – · Detailstufe: mittel · Priorität: **Empfohlen** · Biome: Küste

### `terrain_swamp.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — murky dark olive-brown swamp water, scattered algae patches, still surface
```

**Spec:** Ordner `textures/terrain/water/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, trüb · Palette: dunkles Oliv-Braun · Einsatz: Sumpf/Moor, stehendes Wasser · Material: trüb, mit organischen Flecken · Mischverhalten: eigene Übergangszone zwischen terrain_earth_wet und terrain_deep_water · Maps: Normal ✓ · Roughness – · AO – · Height – · Detailstufe: mittel · Priorität: **Optional** · Biome: Fluss/See/Meer

### `terrain_river_delta.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — braided river delta with sandbanks and shallow water channels, top-down aerial look
```

**Spec:** Ordner `textures/terrain/water/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, verzweigt · Palette: Sandbeige mit Wasseradern · Einsatz: Flussmündung mit Sandbänken · Material: gemischt Sand/Wasser, kleinteilig verzweigt · Mischverhalten: Übergangszone an der Flussmündung, mischt terrain_sand_river und terrain_shallow_water · Maps: Normal ✓ · Roughness – · AO – · Height – · Detailstufe: mittel · Priorität: **Optional** · Biome: Fluss/See/Meer

## Felder

### `terrain_field_plowed.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — freshly plowed farmland with parallel furrow lines, rich dark brown soil, subtle shading in the grooves
```

**Spec:** Ordner `textures/terrain/field/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, gefurcht · Palette: dunkles Braun mit parallelen Furchen · Einsatz: frisch gepflügter Acker · Material: strukturiert, gleichmäßige Furchenlinien · Mischverhalten: ersetzt terrain_farmland auf bestellten Feld-Kacheln · Maps: Normal ✓ · Roughness ✓ · AO – · Height ✓ · Detailstufe: nah · Priorität: **Pflicht** · Biome: Fruchtbares Land

### `terrain_field_wheat.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — golden ripe wheat field, dense rows of wheat ears, gentle wind-swept pattern, top-down
```

**Spec:** Ordner `textures/terrain/field/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, reif · Palette: goldgelb · Einsatz: reifes Getreidefeld · Material: organisch, mit Ährenstruktur · Mischverhalten: saisonale/Produktionsstufen-Variante von terrain_field_plowed · Maps: Normal ✓ · Roughness ✓ · AO – · Height ✓ · Detailstufe: nah · Priorität: **Empfohlen** · Biome: Fruchtbares Land

### `terrain_field_harvest.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — harvested stubble field, short pale straw-colored rows, evenly cut, top-down
```

**Spec:** Ordner `textures/terrain/field/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, abgeerntet · Palette: blasses Strohgelb-Braun · Einsatz: abgeerntetes Stoppelfeld · Material: strukturiert, kurze Stoppelreihen · Mischverhalten: Folgestufe nach terrain_field_wheat im Produktionszyklus · Maps: Normal ✓ · Roughness ✓ · AO – · Height ✓ · Detailstufe: nah · Priorität: **Empfohlen** · Biome: Fruchtbares Land

## Wege & Straßenränder

### `terrain_path.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — worn dirt footpath, packed light brown earth, thin grass fringe along the edges
```

**Spec:** Ordner `textures/terrain/path/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, ausgetreten · Palette: helles Erdbraun · Einsatz: Trampelpfad, Feldweg · Material: verdichtet, mit vereinzelten Grasresten am Rand · Mischverhalten: schmales Band, blendet beidseitig in Gras/Erde · Maps: Normal ✓ · Roughness ✓ · AO – · Height ✓ · Detailstufe: nah · Priorität: **Empfohlen** · Biome: Straßen/Wege

### `terrain_road_edge.png`

```text
Seamless tileable stylized terrain texture for a premium low-poly city-builder game. Soft painterly look, natural color variation, subtle height variation, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges, PBR-ready — soft gradient road-edge transition, asphalt grey fading into dirt and grass, small gravel scatter
```

**Spec:** Ordner `textures/terrain/path/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, Übergang · Palette: Asphaltgrau in Erdbraun/Gras auslaufend · Einsatz: weicher Übergang Straße → Gelände (§ Straßen im Terrain) · Material: strukturiert, Verlaufsgradient · Mischverhalten: Pflicht-Übergangstextur an jeder Straßenkante, verhindert harte Kanten · Maps: Normal ✓ · Roughness ✓ · AO – · Height ✓ · Detailstufe: nah · Priorität: **Pflicht** · Biome: Straßen/Wege

## Biome-Materialsets

Welche Texturen pro Biom im Splatmap-Mix zur Auswahl stehen; die Höhen-/Neigungs-/Feuchtigkeitsregeln (unten) gewichten innerhalb dieses Sets.

| Biom | Texturen |
|---|---|
| Grasland | `grass_meadow_cartoon`, `grass_meadow_fresh`, `grass_meadow_dark`, `grass_wildflowers`, `grass_trampled`, `grass_wet` |
| Mischwald | `forest_floor_cartoon`, `forest_floor_moss`, `forest_floor_needles`, `forest_floor_leaves`, `forest_floor_roots`, `forest_edge_grass` |
| Fruchtbares Land | `fertile_valley_ground`, `coast_mud_fertile`, `terrain_field_plowed`, `terrain_field_wheat`, `terrain_field_harvest` |
| Gebirge | `mountain_cliff_cartoon`, `mountain_granite_base`, `mountain_cliff_faceted`, `mountain_strata`, `mountain_scree`, `mountain_moss`, `mountain_snow`, `mountain_wet_rock` |
| Wüste | `desert_sand_red`, `terrain_sand_dune`, `terrain_earth_light`, `terrain_rock_granite` |
| Sumpf | `moor_heather_ground`, `swamp_mud`, `forest_floor_dark_soil`, `grass_mossy` |
| Küste | `coast_sand_cartoon`, `coast_shore_accessible`, `coast_sand_wet`, `coast_gravel_stylized`, `coast_mud_fertile` |
| Fluss/See/Meer | `terrain_deep_water`, `terrain_shallow_water`, `terrain_riverbed`, `terrain_river_delta`, `terrain_swamp`, `terrain_ice` |
| Straßen/Wege | `terrain_path`, `terrain_road_edge`, `terrain_gravel`, `terrain_stone` |

## Splatmap-Konzept

Jede Terrainfläche trägt künftig **Materialgewichte statt eines einzelnen Typs** (z. B. 70 % Gras, 20 % Erde, 10 % Stein) — daraus mischt der Ground-Shader weich, ohne harte Kacheloder Quadrat-Kanten. Die Gewichte leiten sich aus drei Regeln ab, die zusammen ausgewertet werden (Höhe zuerst, dann Neigung, dann Feuchtigkeit):

### Höhe (§ "Höhe steuert Material")

| Bedingung | Material-Gewichtung |
|---|---|
| Wasserlinie bis +0.3 (Ufer) | 60 % feuchte Erde/Sand, 30 % Gras, 10 % Kies |
| +0.3 bis +1.5 (Ebene/Bauland) | 80 % Gras, 15 % Erde, 5 % Stein |
| +1.5 bis +2.5 (Hügel) | 55 % Gras, 25 % Erde, 20 % Stein — steigt mit der Neigung |
| +2.5 bis +4 (Gebirgsfuß) | 20 % Gras in Mulden, 80 % Fels/Geröll |
| über +4 (Hochgebirge) | 90 % Fels, 10 % Schnee (optional, kein aktueller Terrain-Typ) |

### Neigung (§ "Je steiler → mehr Felsen")

| Bedingung | Material-Gewichtung |
|---|---|
| flach (< 15°) | Basis-Material der Höhenstufe unverändert |
| geneigt (15°–35°) | +20 % Stein/Geröll, Gras/Erde-Anteil sinkt entsprechend |
| steil (> 35°) | Fels/Klippen-Textur dominant (`terrain_cliff`/`terrain_mountain`), kaum Vegetation |

### Feuchtigkeit / Wassernähe

| Bedingung | Material-Gewichtung |
|---|---|
| direkt angrenzend an Fluss/See/Meer | `terrain_earth_wet`/`terrain_sand_coast` statt trockener Basis |
| 1–2 Kacheln entfernt | leichte Beimischung von `terrain_earth_dark`/`terrain_moss`, abklingend |
| weiter entfernt | keine Feuchtigkeits-Beimischung, reine Höhen-/Neigungs-Regel |

**Umsetzungsstand:** Der Three-Renderer wertet diese Regeln aktiv aus: world-space De-Tiling für Ebenen, triplanare Projektion für Fels, ausgewählte Normal-/Roughness-/AO-Maps, Regen-Wetness sowie kameraabhängiges Nahdetail. Vertexfarben bleiben der sichere Fallback.
