# Codex – Visual Active Operations

Stand: 23. Juli 2026

## Erstellte Komponenten

- `operations/WorkAreaPlanner.tsx`
- `operations/ResourceNetworkPanel.tsx`
- `operations/SmartRoadPlannerHud.tsx`
- `operations/WaterfrontPlacementHud.tsx`
- `logistics/TransportPlanner.tsx`
- `common/GamePanel.tsx`
- Erweiterungen in `FloatingBuildingSheet`, `TourOverview`, `ResourceDetailPopover`

## Erstellte Assets

Keine neuen Binärassets. Kleine Funktionsicons sind Lucide-SVGs.
Gebäude-/Fahrzeugvorschauen verwenden Registry, `BuildingArt` und vorhandene
prozedurale Fallbacks. Der Handkarren besitzt absichtlich nur einen
SVG-Fallback, bis ein echter Config-/Controller-Vertrag existiert.

## Neue Design-Tokens

`styles/active-operations.css`: alle verlangten `--ui-*`-Rollen für Hintergründe,
Konturen, Gold/Grün/Cyan/Orange/Rot, Text und Overlay-Zustände.

## Neue ViewModels

`src/components/operations/viewModels.ts`; vollständige Zuordnung in
`ACTIVE_OPERATIONS_VIEWMODELS.md`.

## Verwendete Mockdaten

`src/dev/activeOperationsMockData.ts`, ausschließlich Dev-/Screenshotpfad.
Produktiv nicht importiert.

## Bereits angebundene Read-Helper

- Betrieb: WorkArea, Nodes, Preview, Info, Inventory, Workers, Operation.
- Logistik: verfügbare Menge, Ziele, Preview, Transfers, Netzwerkübersicht.
- Straße: `roadPathPreview`.
- Wasser: `getWaterfrontPlacementPreview`, `placementDiagnostics`.
- Stadtarbeit: `ActivityRoutePreview`, `CargoRouteEvaluation`.

## Noch fehlende Read-Helper

- rollierende Betriebsdurchsatzhistorie,
- physische Aufteilung des zentralen Pools je Lager,
- Zielbestand/-kapazität pro Logistikziel,
- Handkarrenwerte und Arbeiterbindung,
- optionale Nachfüllquellen mit Umweg/Ladezeit,
- Straßenalternativen, Kontrollpunkte, Steigung, Viadukt, Abriss,
- Pfeilerkosten/-höhe und Rampenwerte.

## Erwartete Commands

Bereits genutzt: `startBuildingOperationWithNodes`,
`pause/resume/cancelBuildingOperation`, `create/cancelInventoryTransfer`,
`placeBuilding`, Activity-Commands.

Sinnvoll später: atomarer `placeRoadPath`; ansonsten keine neuen Commands allein
für die Darstellung.

## Callbacks

Stabile Verträge: `WorkAreaPlannerActions`, `TransportPlannerActions`,
`SmartRoadPlannerActions`. Aktuelle Container übersetzen dieselben Absichten in
UI-Store und Controller.

## Renderer-Overlays

- `setWorkAreaOverlay`: Fläche, Ringe, Instanced Nodes, Wege, Mittelpunkt.
- `setRoadPlanOverlay`: Instanced Tiles plus Route.
- Waterfront-GLB-Ghost mit geklonten Materialien, Pfeilern und Wasserankern.

## Noch nicht implementierte Logik

Rechteck/Polygon, echte Baum-Mesh-Raycast-Selektion, Fällanimationen, Handkarren,
Zwischenlager-Puffer, optionale Nachfüllquellen, Routenvorschlagsalgorithmus,
Viadukte und wirtschaftliche Pfeilerregeln. Alle sind sichtbar als gesperrt,
optional oder nicht angebunden.

## Integrationsreihenfolge

1. Durchsatz-ReadModel ergänzen.
2. Handkarren als datengetriebene Transportmethode integrieren.
3. Physische Zwischenlager und Zielkapazitäten liefern.
4. Optionales Resupply-ReadModel befüllen.
5. Atomaren Straßenpfad-Command und Segmentdiagnosen ergänzen.
6. Waterfront-Pfeiler/Rampenwerte ergänzen.
7. Rechteck/Polygon erst danach freischalten.

## Tests

`tests/activeOperationsViewModels.test.ts` prüft reale Controller-Projektionen,
fehlende optionale Werte, Handkarren-Sperre und mutationsfreie Straßenvorschau.
`tests/activeOperationsComponents.test.ts` prüft gemeinsame Panel-/Leerzustände,
Extremwerte, Kapazitätsdarstellung, Tokens/Responsive-Regeln und die Exklusivität
großer Oberflächen.
Gesamtverifikation siehe Patchnotes.
