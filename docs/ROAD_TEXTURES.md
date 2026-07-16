# Straßen-Texturen — Textur statt 3D-Modell (v0.44)

> **Auto-generiert** aus `src/assets/roadTextureManifest.ts`. Nicht von Hand editieren.
> Neue Texturen dazunehmen: Eintrag dort ergänzen, dann
> `WRITE_ROAD_DOCS=1 npx vitest run tests/roadTextures.test.ts` (schreibt diese Datei neu).
> Der Test schlägt fehl, sobald die Doku veraltet ist.

Ersetzt die 3D-Straßen-/Brücken-Modelle durch texturierte, flach ins Terrain integrierte Fahrbahnflächen. **Drop-in:** `.png`/`.webp`/`.jpg` in den unten angegebenen Ordner unter `src/assets/textures/roads/…` legen, Dateiname exakt wie hier — greift automatisch, kein weiterer Code nötig.

## Fahrbahn-Oberflächen

### `road_asphalt.png`

```text
Seamless tileable stylized road-surface texture for a premium low-poly city-builder game. Soft painterly look, natural subtle wear, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges along the tiling axis, PBR-ready — dark blue-grey asphalt road surface, subtle tire wear streaks, fine grain texture, no lane markings
```

**Spec:** Ordner `textures/roads/surface/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, leicht verwittert · Palette: dunkles Blaugrau · Einsatz: Standard-Fahrbahnbelag für Kern + Arme jeder Straßenkachel · Material: matt, feinkörnig, leichte Fahrspuren · Verwendung: ersetzt die Flächenfarbe (0x474d57) auf Kern/Arm-Boxen aus buildRoadTile; kachelt entlang der Straßenachse · Maps: Normal ✓ · Roughness ✓ · AO – · Height – · Detailstufe: nah · Priorität: **Pflicht**

### `road_mountain.png`

```text
Seamless tileable stylized road-surface texture for a premium low-poly city-builder game. Soft painterly look, natural subtle wear, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges along the tiling axis, PBR-ready — rough unpaved mountain road surface, dusty grey-brown gravel, small loose rocks, packed dirt ruts
```

**Spec:** Ordner `textures/roads/surface/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, grob · Palette: staubiges Grau-Braun · Einsatz: Bergstraßen/Pässe — Kacheln, deren Untergrund terrainAt==="mountain" ist · Material: körnig, unbefestigt, kleine Geröllsteine · Verwendung: ersetzt road_asphalt auf Kern/Arm-Boxen, sobald die Straßenkachel auf Gebirgsterrain liegt · Maps: Normal ✓ · Roughness ✓ · AO – · Height – · Detailstufe: nah · Priorität: **Empfohlen**

## Markierungen

### `road_marking_dash.png`

```text
Seamless tileable stylized road-surface texture for a premium low-poly city-builder game. Soft painterly look, natural subtle wear, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges along the tiling axis, PBR-ready — single dashed lane-marking stripe on transparent background, pale yellow-white paint, crisp edges, repeatable along one axis
```

**Spec:** Ordner `textures/roads/markings/` · 512×512 · nahtlos kachelbar · mit Alphakanal · Stil: painterly, klar · Palette: blasses Gelb-Weiß auf transparentem Grund · Einsatz: Mittellinie für Straßenklassen mit centerline:true · Material: flach, matt, scharfe Kante · Verwendung: ersetzt die Flächenfarbe (0xe4d98f) der Mittellinien-Box; PNG mit Alpha-Lücken zwischen den Strichen, längs der Achse wiederholt (map.repeat) · Maps: Normal – · Roughness – · AO – · Height – · Detailstufe: nah · Priorität: **Empfohlen**

### `road_roundabout.png`

```text
Seamless tileable stylized road-surface texture for a premium low-poly city-builder game. Soft painterly look, natural subtle wear, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges along the tiling axis, PBR-ready — circular roundabout junction surface seen from directly above, asphalt with a pale outer ring marking, radial subtle texture, centred composition
```

**Spec:** Ordner `textures/roads/markings/` · 512×512 · nahtlos kachelbar · Stil: painterly, radial · Palette: Asphalt-Blaugrau mit hellem Ring · Einsatz: Kreisverkehr-Deckel bei 4-Wege-Kreuzungen (alle 4 Nachbarbits gesetzt) · Material: matt, radiales Muster · Verwendung: ersetzt den quadratischen Kern durch eine texturierte CylinderGeometry-Scheibe bei mask === 15 · Maps: Normal – · Roughness – · AO – · Height – · Detailstufe: nah · Priorität: **Empfohlen**

## Wasserüberquerungen

### `road_bridge_deck.png`

```text
Seamless tileable stylized road-surface texture for a premium low-poly city-builder game. Soft painterly look, natural subtle wear, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges along the tiling axis, PBR-ready — sturdy stone bridge deck surface with subtle wood-plank accents, weathered grey tones, top-down view
```

**Spec:** Ordner `textures/roads/crossings/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, massiv · Palette: Stein-Grau mit Holzbohlen-Akzent · Einsatz: Brücken-Fahrbahnbelag für Wasserüberquerungen mit Spannweite > 1 Kachel · Material: fest, leicht verwittert · Verwendung: ersetzt die Flächenfarbe (0x4a5058) der Brücken-Deck-Box in buildBridgeDeck (breite Variante, mit Geländer/Pfeilern) · Maps: Normal ✓ · Roughness ✓ · AO – · Height – · Detailstufe: nah · Priorität: **Empfohlen**

### `road_boardwalk.png`

```text
Seamless tileable stylized road-surface texture for a premium low-poly city-builder game. Soft painterly look, natural subtle wear, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges along the tiling axis, PBR-ready — rustic wooden boardwalk planks seen from above, warm brown wood grain, visible plank seams, weathered
```

**Spec:** Ordner `textures/roads/crossings/` · 1024×1024 · nahtlos kachelbar · Stil: painterly, rustikal · Palette: warmes Holzbraun · Einsatz: Steg für Wasserüberquerungen mit Spannweite = 1 Kachel (schmal, ohne Pfeiler) · Material: organisch, sichtbare Bohlenfugen · Verwendung: ersetzt die Flächenfarbe der schmalen Steg-Deck-Box in buildBridgeDeck (Steg-Variante, ohne Pfeiler) · Maps: Normal ✓ · Roughness ✓ · AO – · Height – · Detailstufe: nah · Priorität: **Empfohlen**

## Konzept: Textur statt 3D-Modell

Straßen laden nie mehr ein `.glb` (der alte Drop-in-Pfad über `roadModel`/`bridgeModel` wurde aus `ThreeMapRenderer.ts` entfernt). Stattdessen bleibt die vorhandene, Mask-getriebene Geometrie aus `buildRoadTile`/`buildBridgeDeck` (Kern + Arme + Randstreifen, flach nahe `y≈0` ins Höhenfeld integriert) bestehen — sie bekommt nur echte Texturen statt Flächenfarben, sobald eine Datei hier abgelegt wird:

- **Form** ergibt sich direkt aus den gesetzten Nachbar-Mask-Bits (ein Box-Arm pro Bit in `buildRoadTile`) — kein separates Shape-Lookup mehr nötig.
- **Kreisverkehr** ist keine neue Instanz, sondern dieselbe 4-Wege-Form (`mask === 15`) mit einer runden statt eckigen Kern-Geometrie + `road_roundabout`.
- **Bergstraße/Pass** ist eine reine Textur-Umschaltung, sobald die Kachel auf `terrainAt==="mountain"` liegt — kein eigener Straßentyp.
- **Brücke vs. Steg** unterscheidet sich an der gemessenen Wasser-Spannweite (1 Kachel → Steg, mehrere → Brücke) — ebenfalls keine neue Sim-Instanz.
- **Randübergang** zu Gras/Erde nutzt die bereits dokumentierte `terrain_road_edge.png` (siehe `docs/TERRAIN_TEXTURES.md`, Kategorie „Wege") — hier bewusst nicht dupliziert.
