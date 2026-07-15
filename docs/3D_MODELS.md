# Echte 3D-Modelle einbinden — Wo, Wie, Prompts

Anleitung, um von den jetzigen isometrischen 2.5D-Platzhaltern zu **echten
3D-Modellen** zu kommen — schrittweise, ohne Spiellogik oder Savegames zu ändern.

## Der empfohlene Weg (zwei Stufen)

**Stufe A — 3D-Modell → gerendertes Iso-Sprite (jetzt nutzbar).**
Der aktuelle Renderer ist ein 2D-Pixi-Canvas. Der schnellste Qualitätssprung:
das 3D-Modell **einmalig** aus der Iso-Kamera zu einem transparenten PNG rendern
und als `isoSprite` ablegen. Kein 3D im Browser nötig, sofort sichtbar über die
bestehende Drop-in-Pipeline. Dieselbe Asset-Familie liefert auch Baumenü-Vorschau
und Detail-Sheet.

**Stufe B — echtes 3D im Browser (später, optionaler RenderMode).**
Ein neuer `RenderMode` (`hybrid3d`/`true3d`) lädt `.glb`-Modelle (three.js oder
Babylon.js) und rendert die Map dreidimensional. Die Projektion, Weltkoordinaten
und Marker-Anker sind dafür schon vorbereitet (siehe `docs/ISO_RENDERING.md`).
Erst sinnvoll, wenn genügend Modelle vorliegen.

> Wichtig: Die jetzigen Iso-Sprites sind **kein Wegwerf-Schritt**. Sie sind
> entweder der finale 2.5D-Look **oder** die aus 3D gerenderten Frames.

## Wo die Dateien hinkommen

| Zweck | Ordner | Dateiname | Wird genutzt von |
|---|---|---|---|
| Gerendertes Iso-Sprite (Stufe A) | `src/assets/buildings/iso/` | `<id>_iso.png` | Kartenrenderer (iso) |
| 3D-Modell (Stufe B) | `src/assets/models/buildings/` | `<id>.glb` | späterer 3D-Renderer |
| 3D-Terrain | `src/assets/models/terrain/` | `<name>.glb` | späterer 3D-Renderer |
| 3D-Fahrzeuge | `src/assets/models/vehicles/` | `<name>.glb` | Live-Effekte (später) |

Verknüpfung pro Gebäude über `BuildingDef.visual` (optional, ohne Migration):

```ts
visual: {
  cardArt: 'house_small',          // Baumenü-Vorschau (Standard: buildings/<id>.png)
  isoSprite: 'house_small_iso',    // Karten-Sprite im Iso-Modus
  model3dRef: 'house_small',       // models/buildings/house_small.glb (Stufe B)
  heightClass: 1.4,                // Extrusions-/Höhenklasse (Fallback-Block)
  anchor: { x: 0.5, y: 1 },        // Sprite-Basis unten-mittig
}
```

Fehlt ein Feld/Asset, greift die Fallback-Kette: `isoSprite` → `buildings/<id>.png`
→ eingebauter extrudierter Block. Nichts crasht.

## Technische Vorgaben

**Gerenderte Iso-Sprites (Stufe A):**
- Kamera **isometrisch**, Winkel konstant über ALLE Assets (z. B. 30° Elevation,
  45° Azimut), **orthografische** Projektion.
- Lichtquelle konstant **oben-links**, weiche Schatten.
- Transparenter Hintergrund, Motiv zentriert, Basis unten-mittig.
- 512×512 (klein/mittel), 1024×1024 (Türme/Großprojekte).
- Gleicher Maßstab: ein 1×1-Gebäude füllt ~1 Iso-Tile-Breite.

**3D-Modelle (Stufe B):**
- Format **`.glb`** (glTF binär, PBR-Material, eingebettete Texturen).
- Low-Poly, sauber trianguliert, Ursprung an der **Grundflächenmitte**, +Y = oben.
- Reale Kachelgröße: 1 Tile = 1 Einheit; ein 2×2-Gebäude ~2×2 Einheiten Grundfläche.
- Optional benannte Nodes/Marker: `chimney`, `door`, `roof` (für Live-Effekte).
- Optional getrennte Meshes je Ausbaustufe (`stage0..stage3`) für Upgrade-Visuals.

## Stil-Prefix (vor JEDEN 3D-/Render-Prompt setzen)

> `Low-poly stylized 3D city-builder building, cartoon game asset, clean readable
> forms, vibrant colors, soft baked shadows, PBR materials, neutral studio
> lighting from top-left, isometric orthographic camera (30° elevation, 45°
> azimuth), transparent background, centered, base at origin, no text, no UI —`

Für Text-zu-3D-Tools (z. B. Meshy, Rodin, Tripo, Luma Genie) den Prefix + das
Motiv unten verwenden und als `.glb` exportieren. Für Bild-zu-3D zuerst ein
Referenz-Iso-Sprite aus `docs/ISO_ASSETS.md` erzeugen und daraus das Modell.

## Modell-/Sprite-Liste mit Prompts (aus den vorhandenen BuildingDefs)

| id / Datei | Motiv-Prompt (an Stil-Prefix anhängen) |
|---|---|
| `town_hall` | a grand town hall with a clock tower, columns, flag, red roof |
| `mayor_house` | an elegant mayor's residence, blue roof, small garden |
| `district_center` | an administrative hall with a golden dome |
| `house_small` | a small cozy family house, red pitched roof, chimney, garden |
| `house_row` | a row of 2–3 attached townhouses, mixed roof colors |
| `apartment` | a four-story apartment building with balconies |
| `residential_tower` | a tall modern residential tower, glass facade (1024) |
| `sawmill` | a wooden sawmill with a log pile and a large saw blade |
| `quarry` | a rocky stone quarry pit with boulders |
| `farm` | a red barn with a silo and green crop fields |
| `well` | a stone water well with a small wooden roof |
| `water_pump` | a blue water pumping station with a tank |
| `waterworks` | a water treatment plant with round tanks and pipes |
| `warehouse` | a large storage warehouse with a big roller door |
| `depot` | a logistics depot with a loading dock and a truck |
| `market` | an open-air market stall with a striped awning |
| `supermarket` | a modern supermarket with a big sign and carts |
| `bakery` | a charming bakery shop with a bread sign |
| `shop_small` | a small corner shop with a colorful awning |
| `office` | a modern glass office building |
| `trading_post` | a merchant trading post with crates and flags |
| `fire_station` | a red fire station with garage doors and a fire truck |
| `police_station` | a blue police station with a badge sign |
| `hospital` | a white hospital with a red cross and an ambulance |
| `power_plant` | a coal power plant with cooling towers and chimneys (1024) |
| `wind_farm` | a white wind turbine on a small hill (rotor as separate node) |
| `park` | a small green park with trees, a path and a pond |
| `playground` | a playground with a slide and swings |
| `deco_tree` | a single lush round tree |
| `deco_flowerbed` | a colorful round flower bed |
| `deco_fountain` | an ornate stone fountain with water |
| `deco_bench` | a wooden park bench next to a lamp post |

Fahrzeuge (`src/assets/models/vehicles/`, für Live-Routen): `truck_food`,
`truck_material`, `firetruck`, `police_car`, `service_van` — Motive siehe
`docs/ISO_ASSETS.md` §4.

## Ausbaustufen (verschiedene Gebäude-Level)

`upgradeLevel` steuert die Darstellung bereits: der eingebaute Iso-Block wächst
mit Höhe + zusätzlichen Dach-Etagen. Für Assets gibt es zwei Wege:

1. **Ein Modell, mehrere Stufen-Meshes** (`stage0..stage3` im `.glb`) — der
   Renderer blendet die zur `upgradeLevel` passende Stufe ein.
2. **Ein Sprite je Stufe:** `house_small_iso.png`, `house_small_iso_2.png`, … —
   Namensschema `<id>_iso[_<stage>]`. (Registry-Erweiterung geplant.)

So sehen Haus → Doppelhaus → Mehrfamilienhaus → Hochhaus je Stufe anders aus.

## Live-Effekte (jetzt & geplant)

- **Jetzt:** Schornsteinrauch über aktiven Produktions-/Energiegebäuden
  (`animateLive`, gepoolt & gecappt), Bau-/Upgrade-Fortschrittsbalken,
  Aktivitäts-Zielringe. Ausbaustufen sichtbar (Höhe + Dach-Etagen).
- **Geplant:** fahrende Fahrzeuge entlang der Straßen für Liefermissionen
  (Route über bestehende Straßenlogik, `vehicles/*_iso.png`), Feuerwehr-/
  Polizei-Einsätze, Bau-Animation (Kran/Gerüst), Tag-/Nacht-Licht, Fenster leuchten
  nachts, Bürger-Sprites. Der `liveLayer`-Container und die Fahrzeug-Ordner/
  Registry (`vehicleImage`) sind dafür bereits vorhanden.

## Integrationsschritte (Kurzfassung)

1. Iso-Sprite je Gebäude rendern/generieren → `src/assets/buildings/iso/<id>_iso.png`.
2. `npm run build` → Map zeigt die Sprites automatisch im Iso-Modus.
3. Optional `BuildingDef.visual.isoSprite`/`heightClass`/`anchor` feinjustieren.
4. Für Stufe B: `.glb` nach `src/assets/models/…`, `model3dRef` setzen; ein
   `true3d`-RenderMode mit three.js/Babylon ergänzen (eigener Slice).
