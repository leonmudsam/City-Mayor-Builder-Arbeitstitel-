# Codex – Visual Active Operations

Stand: 1. August 2026

## Erstellte Komponenten

- `operations/WorkAreaPlanner.tsx`
- `operations/ResourceNetworkPanel.tsx`
- `operations/SmartRoadPlannerHud.tsx`
- `operations/WaterfrontPlacementHud.tsx`
- `logistics/TransportPlanner.tsx`
- `common/GamePanel.tsx`
- Erweiterungen in `FloatingBuildingSheet`, `TourOverview`, `ResourceDetailPopover`

## Erstellte Assets

Die ursprünglichen Active-Operations-Komponenten benötigen keine festen
Binärassets. Kleine Funktionsicons sind Lucide-SVGs; Gebäude und Fahrzeuge
verwenden weiterhin Registry und prozedurale Fallbacks. Der Handkarren ist
inzwischen eine echte datengetriebene Katalogmethode. Automatische
Straßenvarianten besitzen aktive, optionale Drop-in-Kits; fehlt eine Datei,
bleibt die vollständige prozedurale Straße sichtbar.

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
- Straße: `roadPathPreview` mit Kachelstatus, Variante, Terrain-/Deckhöhe,
  Steigung, Freiraum, Kosten und gemeinsamem `RoadHeightProfile`.
- Wasser/Gebäude: `getWaterfrontPlacementPreview`, `placementDiagnostics` samt
  kanonischem `FoundationPlan`.
- Stadtarbeit: `ActivityRoutePreview`, `CargoRouteEvaluation`.

## Noch fehlende Read-Helper

- rollierende Betriebsdurchsatzhistorie,
- physische Aufteilung des zentralen Pools je Lager,
- Zielbestand/-kapazität pro Logistikziel,
- optionale Nachfüllquellen mit Umweg/Ladezeit,
- frei bearbeitbare Straßen-Kontrollpunkt-Griffe, Alternativrouten und Abriss,
- Straßenzustand, Sperrungen, Tunnel und dynamischer Verkehr.

## Erwartete Commands

Bereits genutzt: `startBuildingOperationWithNodes`,
`pause/resume/cancelBuildingOperation`, `create/cancelInventoryTransfer`,
`placeBuilding`, der atomare Bulk-Command `buildRoadPath` und Activity-Commands.
Darstellungswünsche allein rechtfertigen weiterhin keine neuen Commands.

## Callbacks

Stabile Verträge: `WorkAreaPlannerActions`, `TransportPlannerActions`,
`SmartRoadPlannerActions`. Aktuelle Container übersetzen dieselben Absichten in
UI-Store und Controller.

## Renderer-Overlays

- `setWorkAreaOverlay`: Fläche, Ringe, Instanced Nodes, Wege, Mittelpunkt.
- `setRoadPlanOverlay`: instanzierte Segmente und Route auf der kanonischen
  Fahrbahnhöhe, geneigt und nach automatischer Variante eingefärbt.
- Gebäude-/Waterfront-Ghost und fertiges Gebäude verwenden denselben
  `FoundationPlan` für Naturkranz, Hangstufen, Terrasse, Pfähle oder
  Klippen-Stützwand; Wasseranker bleiben Teil des Waterfront-HUDs.

## Noch nicht implementierte Logik

Rechteck/Polygon, echte Baum-Mesh-Raycast-Selektion, Fällanimationen,
Zwischenlager-Puffer und optionale Nachfüllquellen. Im Straßensystem fehlen noch
bearbeitbare Kontrollpunkt-Griffe, Alternativrouten, Abriss, Tunnel,
Straßenzustand und dynamischer Verkehr. Automatische Viadukte, Variantenkosten,
Höhenprofil und Fundamentzuschläge sind dagegen produktiv und dürfen nicht mehr
als offen geführt werden.

## Integrationsreihenfolge

1. Durchsatz-ReadModel ergänzen.
2. Physische Zwischenlager und Zielkapazitäten liefern.
3. Optionales Resupply-ReadModel befüllen.
4. Straßen-Kontrollpunkt-Griffe und echte Alternativroute auf dem bestehenden
   Preview-Vertrag ergänzen.
5. Straßenzustand/Abriss erst nach einem echten Simulationsvertrag anzeigen.
6. Rechteck/Polygon erst danach freischalten.

## Tests

`tests/activeOperationsViewModels.test.ts` prüft reale Controller-Projektionen,
fehlende optionale Werte, Katalogfahrzeuge und mutationsfreie Straßenvorschau.
`tests/activeOperationsComponents.test.ts` prüft gemeinsame Panel-/Leerzustände,
Extremwerte, Kapazitätsdarstellung, Tokens/Responsive-Regeln und die Exklusivität
großer Oberflächen.
`tests/roadProfile.test.ts`, `roadRouting.test.ts` und `roadOverhaul.test.ts`
sichern Höhenprofil, automatische Varianten/Serpentinen, Kostenparität und den
Bulk-Command. `tests/foundation.test.ts` sichert Fundamentklassen, Mehrkosten und
Bauzeit gegen den echten Command.
Gesamtverifikation siehe Patchnotes.
