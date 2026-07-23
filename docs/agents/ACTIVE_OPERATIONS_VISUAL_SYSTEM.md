# Active Operations – visuelles System

Stand: 23. Juli 2026 · rein visuelle Ausbaustufe · Save unverändert v19

## Leitidee

Das Referenz-Mockup ist in getrennte Spielzustände zerlegt. Gleichzeitig sichtbar
sind höchstens eine Hauptinteraktion, ein Detailpanel und eine kleine
Kontextanzeige. React hält nur Entwürfe; Simulation wird ausschließlich über den
`GameController` gelesen und verändert.

## Komponenten- und Zustandsmatrix

| Zustand | Hauptinteraktion | Detail / Kontext | Produktive Daten | Mutation |
| --- | --- | --- | --- | --- |
| Arbeitsgebiet | `operations/WorkAreaPlanner.tsx` + terrainfolgender Three-Layer | feste Legende + Cursor-Tooltip | `getBuildingWorkArea`, `getResourceNodesNear`, `getBuildingOperationPreview` | `startBuildingOperationWithNodes` erst bei Bestätigung |
| Betriebsdetails | `FloatingBuildingSheet::BuildingOperationSection` | Tabs Übersicht/Lager/Aufträge/Upgrades | Info, Worker, Inventory, Operation, Config-Stufen | bestehende Start/Pause/Fortsetzen/Stop-Commands |
| Ressourcennetz | `operations/ResourceNetworkPanel.tsx` | Standortkarten | `getInventoryNetworkOverview`, lokale Inventare, Transfers | keine; Fokus/Details nur UI |
| Transport | `logistics/TransportPlanner.tsx` | Quelle→Methode→Ziel | Ziel-, Fahrzeug- und Preview-Read-Helper | `createInventoryTransfer` |
| Stadtarbeit | `citywork/TourOverview.tsx` | Cargo-Timeline | `CargoRouteEvaluation.stops` | keine |
| Straße | `operations/SmartRoadPlannerHud.tsx` + Three-Layer | Kosten/Konflikte | `roadPathPreview` | einzelne bestehende `placeBuilding`-Commands erst bei Bestätigung |
| Wasserbau | `operations/WaterfrontPlacementHud.tsx` + Ghost | Footprint/Tiefe/Fundament | `placementDiagnostics`, `getWaterfrontPlacementPreview` | vorhandenes `placeBuilding` |
| Regionen | bestehender `RegionDialog.tsx` | Fortschritt, Level, Kosten, Verbindungen | Regions-Config und Unlock-Read-Helper | vorhandenes `unlockRegion` |
| Performance | bestehender `DebugPanel.tsx` | FPS/Draw-Calls/Instanzen | `perfStats.ts` | nur visuelle Settings |

## Arbeitsgebiet

- UI-State: Gebäude-ID, Modus, Radius, ausgewählte Node-IDs, Hover-ID.
- Modi `Einzel`, `Kreis` und `Ausnehmen` sind bedienbar.
- `Rechteck` und `Polygon` sind sichtbar gesperrt und erklären den fehlenden
  Pointer-Flächenentwurf; sie werden nicht als fertig ausgegeben.
- `setWorkAreaOverlay` baut eine terrainfolgende Kachelfläche, effizienten und
  maximalen Ring, instanzierte Knoten, einen Mittelpunkt sowie Wegsegmente.
- Node-Klicks ändern nur `workAreaSelectedNodeIds`. `Enter` bestätigt nur einen
  gültigen Entwurf; `Esc` verwirft ihn.
- Knotenfarben werden zusätzlich durch Text/Legende erklärt. Der Cursor-Tooltip
  weicht am rechten/unteren Rand aus.

## Betriebsfenster

Die vorhandene Gebäudeseite wurde erweitert, nicht ersetzt. Die vier Tabs wechseln
lokal ohne Seitenwechsel. Der Durchsatz zeigt bewusst „Nicht angebunden“, weil
keine rollierende Zeitreihe existiert. Upgrade-Karten verwenden vorhandene
`BuildingArt`-Fallbacks und echte `BuildingOperationStage`-Werte.

## Gemeinsame Gestaltung

`styles/active-operations.css` definiert die semantischen `--ui-*`-Tokens, Panel,
Metriken, Status-Chips und Kapazitätsbalken. Kleine Funktionsicons stammen aus
Lucide (SVG); Gebäude-/Fahrzeugbilder laufen über die vorhandene Registry und
behalten prozedurale Fallbacks.

## Performance

- Arbeitsfläche: ein Mesh; Knoten: ein `InstancedMesh`; Wege: ein
  `LineSegments`-Draw-Call.
- Der Overlay-Key verhindert einen Neuaufbau bei identischen Daten.
- Straßenvorschau: ein `InstancedMesh` plus eine Linie.
- Kein Welt-Rebuild, kein Save-Feld, keine zweite Simulation.

## Ehrliche Grenzen

- keine echte Durchsatzhistorie,
- keine Fäll-/Trag-Animationsclips,
- Rechteck-/Polygon-Auswahl gesperrt,
- Terrain-Picking trifft weiterhin die bekannte flache Pick-Ebene; die separate
  G2-Korrektur bleibt erforderlich.

Details: `ACTIVE_OPERATIONS_VIEWMODELS.md` und
`ACTIVE_OPERATIONS_VISUAL_HANDOFF.md`.
