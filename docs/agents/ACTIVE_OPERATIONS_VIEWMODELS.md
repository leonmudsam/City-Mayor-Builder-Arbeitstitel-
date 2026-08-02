# Active Operations – Visual ViewModels

Quelle: `src/components/operations/viewModels.ts`

Stand: 1. August 2026

## Zweck

Die Verträge enthalten ausschließlich darstellbare Werte und Callback-Signaturen.
Sie importieren weder `GameState` noch Three.js. Produktive Adapter liegen in
`operations/adapters.ts`; isolierte Kompositionsdaten ausschließlich in
`src/dev/activeOperationsMockData.ts`.

## Verträge

| Vertrag | Aufgabe | Optionale, bewusst fehlende Felder |
| --- | --- | --- |
| `WorkAreaPlannerView` | Fläche, Nodes, Ertrag, Dauer, Lager | keine Rechteck-/Polygon-Geometrie im produktiven Adapter |
| `BuildingOperationView` | Status, Worker, Lager, Queue, Durchsatz | `throughputPerMinute`, `throughputWindowMinutes` |
| `ResourceNetworkView` | Gesamtsumme und Standorte | `inWarehouses`, `inTownHall` |
| `TransportPlannerView` | Methode, Ziel, Preview | Preview-Kennzahlen ohne gültige Route/Methode |
| `ResupplyTimelineView` | späterer stabiler Vertrag für Quellenkarten | Produktiv nutzt derzeit direkt `CargoRouteEvaluation` |
| `SmartRoadPlanView` | Start/Ziel, Segmentstatus und automatische Variante, Terrain-/Deckhöhe, Steigung, Freiraum, Meter/Höhendifferenz, Höhenprofil-Kennzahlen, Variantenanzahl und vollständige Kosten | bearbeitbare Kontrollpunkt-Griffe und Alternativrouten |
| `WaterfrontPlacementVisualView` | Ghost-Zustand, Tiefe, Pfeiler | wirtschaftliche Pfeilerwerte |

## Kanonische angrenzende Verträge

`SmartRoadPlanView` klassifiziert selbst nichts. Der Adapter projiziert
`GameController.roadPathPreview(...)` und damit genau ein `RoadPlanPreview` aus
`src/game/roads/roadPlanning.ts`. Dessen `RoadHeightProfile` ist die gemeinsame
Quelle für Länge, Höhendifferenz, maximale/mittlere Steigung, Deckpunkte,
Kehren, Varianten und `feasible`. Eine vorberechnete Vorschau kann dem Adapter
übergeben werden; damit verwendet das HUD dieselbe Projektion für Kennzahlen,
Kosten und Warnungen.

Gebäudeplatzierung nutzt keinen zweiten Visual-ViewModel-Typ: Der Controller
liefert in `PlacementDiagnostics.foundation` direkt den reinen `FoundationPlan`
aus `src/game/buildings/foundation.ts`. Er enthält Terrain-Kategorie,
Fundamentart, Stütztiefe, Stufen, Zusatzkosten und zusätzliche Bauzeit. Banner,
Ghost, Command und fertige Geometrie lesen diesen Vertrag. Ob der Standort
zulässig ist, entscheidet weiterhin ausschließlich `validatePlacement`.

## Callback-Verträge

- `WorkAreaPlannerActions`
- `TransportPlannerActions`
- `SmartRoadPlannerActions`

Sie beschreiben nur UI-Absichten. Der Container entscheidet, welcher vorhandene
Controller-Command verwendet wird. Der produktive Straßencontainer bestätigt
über den atomaren `buildRoadPath`-Bulk-Command. `onControlPointMove`,
`onAddControlPoint` und `onRequestAlternative` bleiben vorbereitete Absichten;
der aktuelle Container bietet noch keine Griffe oder Alternativroute an.

## Adapterregeln

1. Keine direkte Mutation.
2. Fehlende Werte entfallen statt `0` vorzutäuschen.
3. Formatierte Texte bleiben überwiegend in Komponenten; IDs und Zahlen im
   ViewModel.
4. Warnungen besitzen Code, lesbaren Text und semantischen Ton.
5. Prozentwerte laufen über `clampPercent`; Kapazitätsfarben über
   `capacityTone`.
6. Straßenlänge, Höhe, Steigung, Variante und Kosten werden nie in React erneut
   berechnet; sie kommen aus `RoadPlanPreview`.
7. Fundamentkosten oder -bauzeit werden nie aus dem Label abgeleitet; maßgeblich
   ist `PlacementDiagnostics.foundation`.

## Demo-Szenarien

`activeOperationsVisualScenarios` deckt leere/gültige/gesperrte Arbeitsgebiete,
Betriebsstatus, volle/reservierte/unterwegs befindliche Ressourcen,
Nachfüllzustände, Straße/Brücke/Viadukt/Region sowie fünf Wasserbauzustände ab.
Kein Produktionsmodul importiert diese Datei. Die Szenarien sind keine Quelle
für produktive Straßen- oder Fundamentwerte.

## Regressionsschutz

- `tests/activeOperationsViewModels.test.ts`: mutationsfreie Adapterprojektion.
- `tests/roadProfile.test.ts`: Höhen-/Variantenprofil und 8-%-Grenze.
- `tests/roadRouting.test.ts`: lückenlose Route, automatische Brücke und
  Serpentine.
- `tests/roadOverhaul.test.ts`: Kostenparität, Bulk-Commit und persistiertes
  `roadEngineering`.
- `tests/foundation.test.ts`: Kategorien, Zuschläge und Bauzeitparität.
