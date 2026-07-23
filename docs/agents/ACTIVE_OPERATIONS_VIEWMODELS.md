# Active Operations – Visual ViewModels

Quelle: `src/components/operations/viewModels.ts`

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
| `SmartRoadPlanView` | Anker, Segmente, Kosten, Brücke/Viadukt | Kontrollpunkte, Viadukt/Steigung |
| `WaterfrontPlacementVisualView` | Ghost-Zustand, Tiefe, Pfeiler | wirtschaftliche Pfeilerwerte |

## Callback-Verträge

- `WorkAreaPlannerActions`
- `TransportPlannerActions`
- `SmartRoadPlannerActions`

Sie beschreiben nur UI-Absichten. Der Container entscheidet, welcher vorhandene
Controller-Command verwendet wird.

## Adapterregeln

1. Keine direkte Mutation.
2. Fehlende Werte entfallen statt `0` vorzutäuschen.
3. Formatierte Texte bleiben überwiegend in Komponenten; IDs und Zahlen im
   ViewModel.
4. Warnungen besitzen Code, lesbaren Text und semantischen Ton.
5. Prozentwerte laufen über `clampPercent`; Kapazitätsfarben über
   `capacityTone`.

## Demo-Szenarien

`activeOperationsVisualScenarios` deckt leere/gültige/gesperrte Arbeitsgebiete,
Betriebsstatus, volle/reservierte/unterwegs befindliche Ressourcen,
Nachfüllzustände, Straße/Brücke/Viadukt/Region sowie fünf Wasserbauzustände ab.
Kein Produktionsmodul importiert diese Datei.
