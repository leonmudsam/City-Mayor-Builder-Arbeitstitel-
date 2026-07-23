# Hafensystem und Assetvertrag

Stand: 22. Juli 2026 · Overhaul 7.0

## Aktive Referenzgebäude

| Gebäude | Drop-in-Pfad | Land | Wasser | Freigabe | Fallback |
|---|---|---:|---:|---:|---|
| Kleiner Anleger `dock_small` | `src/assets/models/buildings/resources/dock_small.glb` | 2×2 | 2×2 | L6 | Holz-/Steinkai, Poller, Kisten, Wartehaus |
| Flusshafen `river_port` | `src/assets/models/buildings/resources/river_port.glb` | 4×3 innerhalb eines rotationsstabilen 4×4-Bauplots | 4×3 | L9 | Kai, Lagerhalle, Kisten, Poller, Kran |

Die Registry erkennt Gebäudemodelle rekursiv am Dateinamen. Fehlt das GLB,
zeichnet `ThreeMapRenderer` den prozeduralen Fallback. Frontkonvention: +Z ist
Landzugang, −Z Wasserzugang; `water_access` und `land_access` sind die
empfohlenen Anschlussknoten, beim Flusshafen zusätzlich `crane`.

## Platzierung

- Der normale Gebäude-Footprint muss vollständig auf freigeschaltetem,
  bebaubarem Land liegen und die Flachheitsgrenze erfüllen.
- Der separate Wasser-Footprint muss vollständig Wasser/Fluss sein und die
  Config-Mindesttiefe erreichen.
- Die Vorschau testet die gewählte Rotation zuerst und danach die übrigen
  Kardinalrichtungen. Manuelle Rotation bleibt möglich.
- Wasserzellen erscheinen blau/orange im Ghost; fehlende Straße ist eine
  Warnung, kein Platzierungsfehler.
- Wasser-Footprints kollidieren auch untereinander, obwohl Wasser nicht im
  normalen Gebäude-Occupancy-Index liegt.
- Ein platzierter Hafen snappt nur an einen erreichbaren, ausreichend tiefen
  Wassergraph-Knoten. Ohne Knoten meldet er `no_waterway`.

## Vorbereitete spätere Gebäude

| Datei | Land/Wasser | Rolle | Status |
|---|---|---|---|
| `trade_harbor.glb` | 6×4 / 6×4 | große Handelsrouten | TODO(CLAUDE_LOGIC): Config, Balance, Betrieb |
| `ferry_terminal.glb` | 3×3 / 3×2 | Bürgertransport | TODO(CLAUDE_LOGIC) |
| `fishing_harbor.glb` | 4×3 / 4×3 | Fischerei/Verarbeitung | TODO(CLAUDE_LOGIC) |
| `shipyard.glb` | 6×5 / 6×5 | Schiffbau/Trockendock | TODO(CLAUDE_LOGIC) |

Die Dateien gehören nach
`src/assets/models/buildings/resources/`. Vor einer Aktivierung müssen ihre
Definitionen datengetrieben in `buildings.config.ts` ergänzt werden.

## Vorbereitete Schiffsassets

Zielordner: `src/assets/models/vehicles/`. Technische Vorgaben und
Text-zu-3D-Prompts stehen generiert in
`src/assets/models/vehicles/PROMPTS.md`.

- Früh: `cargo_boat_small.glb`, `ferry_small.glb`, `service_boat.glb`
- Mitte: `cargo_barge.glb`, `river_freighter.glb`, `ferry_medium.glb`
- Spät: `cargo_ship.glb`, `passenger_ship.glb`, `construction_barge.glb`

Schiffe sind noch nicht laufzeitverdrahtet. Das Einlegen eines Modells erfindet
keine Route oder Kapazität; die spätere Simulation muss diese Assetnamen über
das zentrale Manifest konsumieren.
