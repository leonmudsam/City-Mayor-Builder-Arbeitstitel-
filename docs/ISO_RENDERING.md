# Isometrisches Rendering (v0.27, Slice 1)

Der schrittweise Übergang von der 2D-Tile-Map zur isometrischen 2.5D-Ansicht.
Spiellogik, Datenmodell und Savegames bleiben **unverändert** — nur die
Darstellung im Renderer wechselt. `flat2d` bleibt als vollwertiger Fallback.

## Render-Modi (§3)

`RenderMode = 'flat2d' | 'isometric2d'` (später `hybrid3d` / `true3d`).

- **flat2d** — die ursprüngliche Top-down-Rasterkarte. Unverändert.
- **isometric2d** — 2:1-Isometrie mit extrudierten Gebäude-Platzhaltern bzw.
  isometrischen Sprites (Drop-in).

**Umschalten:** Einstellungen → „Kartenansicht" (Segmented Control). Der Modus
liegt in `useUiStore.renderMode` und wird in **localStorage** (`cmb.renderMode`)
persistiert — **nicht** im Savegame. Import/Export/Neustart bleiben unberührt.

Datenfluss: `SettingsPanel` → `useUiStore.setRenderMode` → `MapView`-Subscription
→ `MapRenderer.setRenderMode(mode)`. Der Renderer verwirft die gecachten Terrain-
Container, erzwingt einen Gebäude-Redraw und zentriert die Kamera neu.

## Projektion (§4)

Einzige Quelle der Wahrheit: `src/renderer/projection.ts`. Die Spiellogik rechnet
nur in Tile-Koordinaten; ausschließlich der Renderer (und der davon gesteuerte
Platzierungs-Ghost / das Hit-Testing) projiziert.

```
flat2d:      world = (tx*TILE, ty*TILE)                    TILE = 32
isometric2d: world = ((tx-ty)*isoW/2, (tx+ty)*isoH/2)      isoW=64, isoH=32
```

Konfigurierbar über `ISO` (`tileW`, `tileH`, `elevation`). Funktionen:

- `tileCenterWorld(mode, tx, ty)` — Weltpunkt (iso: Diamant-Mitte).
- `footprintCenterWorld(mode, x, y, w, h)` — für Kamera-Framing.
- `isoTileDiamond(tx, ty)` / `isoFootprintDiamond(x, y, w, h)` — Polygon-Ecken.
- `pickTile(mode, wx, wy)` — inverse Projektion (Klick → Tile).
- `isoDepth(x, y, w, h)` — Tiefensortier-Schlüssel.

**Kamera/Zoom/Pan** laufen über die Pixi-`world`-Container-Transform
(position + scale) und sind damit **modus-unabhängig** — die Projektion konvertiert
immer nur innerhalb des Weltraums. Zoom-zum-Cursor, Pan und Kamera-Fokus (§13)
funktionieren in beiden Modi.

**Hit-Testing / Platzierung** nutzen `pickTile` (iso: Diamant-Zugehörigkeit ⇒
`Math.round`). Footprint-Logik, Kollision und Snap bleiben in Tile-Koordinaten.

## Layer & Depth Sorting (§5)

Container-Reihenfolge (unten → oben): `terrainLayer` · `buildingLayer` ·
`fxLayer` · `overlayLayer` (Coverage, Ghost-Radius, Selection, Ghost). UI (React)
liegt als HTML-Overlay darüber.

In `isometric2d` ist `buildingLayer.sortableChildren = true`. Jeder Gebäude-
Container bekommt `zIndex = isoDepth(x, y, w, h) = (x+y)*8 + (w+h)` → Painter's-
Order von hinten nach vorne; großer/vorderer Footprint überdeckt korrekt. Terrain
liegt immer unter den Gebäuden. In `flat2d` bleibt der `zIndex` 0 (Zeichenreihen-
folge wie bisher).

## Gebäudedarstellung im Iso-Modus (§7, §12, §17)

Pro Gebäude, in dieser Fallback-Reihenfolge:

1. **Straßen:** flacher Asphalt-Diamant (Footprint).
2. **`isoSprite` vorhanden** (`src/assets/buildings/iso/<id>_iso.png`): Sprite wird
   async via `Assets.load` geladen, Anker unten-mittig am Footprint-Zentrum,
   skaliert auf die Footprint-Breite. Bis dahin (und bei Ladefehler) bleibt der
   Platzhalter sichtbar. Guard gegen zerstörte Container/Redraws.
3. **Platzhalter (Standard heute):** extrudierter Diamant-Block — Deckfläche
   (Kategorie-Farbe) + zwei schattierte Wände, Höhe aus `visual.heightClass` bzw.
   Kategorie und `upgradeLevel`; 2-Buchstaben-Code + Upgrade-Pips auf der
   Deckfläche.

Der Footprint bleibt logisch in Tiles; das Sprite darf visuell darüber hinausragen
(Anker unten-mittig). Höhe/Anker steuern `visual.heightClass`, `visual.anchor`,
`visual.footprintVisualOffset` (siehe `docs/UI_ASSETS.md`).

## Marker, Overlays & Ghost im Iso-Modus (§19)

Alles an **Weltkoordinaten** gekoppelt, nicht an alte 2D-Pixel:

- Status-/Upgrade-Marker: über dem projizierten Gebäude-Top.
- Stadtarbeit-Zielmarker: Boden-Ellipse am Footprint + Pfeil über dem Gebäude.
- Coverage-Overlay / Effekt-Radien: Chebyshev-Quadrate werden zu Iso-Diamanten
  (`isoFootprintDiamond` um den Radius erweitert); Verbraucher-Footprints als
  getönte Diamanten, Quelle als Diamant-Outline.
- Platzierungs-Ghost & Auswahl: Footprint-Diamant, grün/rot/gelb wie im Flat-Modus.

## Terrain (§6)

`buildSectorViewIso` zeichnet je Sektor eine Graphics aus farbigen Diamanten
(`TERRAIN_COLORS`), mit einfachem Relief-Hinweis (Wald-Dreieck, Gebirgs-Zacke,
Wasser-Glitzern). Gesperrte Sektoren: getönter Diamant + „+". Isometrische
Terrain-Sprites (`src/assets/terrain/*_iso.png`) sind über
`terrainIsoImage()` in der Registry vorbereitet und werden in einem Folge-Slice
je Tile eingebunden.

## Performance (§21)

- Terrain je Sektor in **einer** Graphics gebündelt; Sektor-Container werden bei
  Statuswechsel neu gebaut, nicht pro Frame.
- Gebäude werden nur bei `controller.version`-Änderung neu gezeichnet (nicht pro
  Frame). Map-Rendering ist vom React-UI entkoppelt (kein Re-Render der Karte bei
  UI-Updates).
- Flat-Modus cullt Sektoren am Viewport. Iso-Culling ist für die MVP-Weltgröße
  vereinfacht (alle gebauten Sektoren sichtbar) — ein tighteres Iso-Culling über
  projizierte Bounds ist als Folgeschritt vorgesehen.

## Spätere echte 3D-Modelle (§9, §26)

Die isometrischen Sprites sind **kein Wegwerf-Zwischenschritt**, sondern entweder
finaler 2.5D-Stil **oder** aus 3D-Modellen gerenderte Frames. Vorbereitet:

- Ordner `src/assets/models/{buildings,terrain,vehicles}/` (bevorzugt `.glb`).
- `BuildingDef.visual`: `cardArt`, `sheetArt`, `mapSprite2d`, `isoPreview`
  (bzw. `isoSprite`), `model3dRef`, `heightClass`, `anchor`,
  `footprintVisualOffset` — dieselbe Asset-Familie je Gebäude für Baumenü-
  Vorschau, Detail-Sheet, Kartensprite und spätere Iso-/3D-Variante.
- Ein späterer 3D-Renderer kann dieselben Weltkoordinaten/Marker-Anker nutzen; die
  Projektion würde um `hybrid3d`/`true3d` erweitert, ohne die Spiellogik zu ändern.

## Nächste Slices

- Slice 2: reale `isoSprite`-Gebäude aus der Pipeline (Assets ablegen).
- Slice 3: Iso-Terrain-Sprites, Fluss/Ufer/Brücke, Gebirge/Felsen-Props.
- Slice 4: Feinschliff Marker/Overlays, Bau-Grid im Iso-Platzierungsmodus.
- Slice 5: Fahrzeuge/Routen für aktive Stadtarbeit.
