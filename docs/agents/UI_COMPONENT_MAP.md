# UI-Komponentenkarte

| Mockup-Bereich | Komponente | Datenquelle / Command |
| --- | --- | --- |
| Level/Wappen/XP | `hud/GameHud.tsx` | Controller-Snapshot, `xpForNextLevel` |
| Ressourcenraten | `hud/ResourceCard.tsx` | `getIncome`, `derived.productionPerMin` |
| Ressourcen-Gesamtnetz | `operations/ResourceNetworkPanel.tsx` | `getInventoryNetworkOverview`, lokale Inventare/Transfers; Fokus über `MapApi` |
| Zeit/Tageslauf | `hud/CameraControls.tsx::DayNightControl` | `environmentSettings.ts` |
| Wetter-/Atmosphärenfenster | `panels/WeatherPanel.tsx` | lokales `environmentSettings.ts` → `SkyEnvironment` |
| Linke Hauptnavigation | `hud/QuickActionBar.tsx` | `useUiStore`, `MapApi` |
| Stadtstatus kompakt | `panels/CityStatusPanel.tsx` | Controller-Derivationen/Diagnosen |
| Stadtstatus Detail | `panels/CityStatusDetail.tsx` | Controller-Derivationen |
| Bürger-Inbox + Detail | `panels/CitizenRequestsPanel.tsx` | Quest-Snapshot, `claimQuest` |
| Live-Minimap | `hud/WorldMiniMap.tsx` | Welt-Bake, Gebäude, Diagnosen, `MapApi` |
| 3D-Info-Layer | `hud/InfoLayerControl.tsx` | UI-Store → `MapApi.setInfoLayer` |
| Infrastruktur-Layer | `hud/InfoLayerControl.tsx` | UI-Store → `MapApi.setInfrastructureLayer`; Renderer liest Controller-Graph/Diagnosen |
| Gebäudekatalog | `panels/BuildMenu.tsx` | Building-Config, Buildkosten, `startPlacing` |
| Gebäudeplatzierung / Fundament | `MapView.tsx::PlacementBanner`, `renderer/three/ThreeMapRenderer.ts` | `placementDiagnostics.foundation` → gleicher `FoundationPlan` für Hinweis, Zusatzkosten/-zeit, Ghost und fertige Geometrie; Bau über `placeBuilding` |
| Gebäudedetail / Aktiver Betrieb | `panels/FloatingBuildingSheet.tsx` | Gebäude-Snapshot, Diagnosen, Worker/Inventory/Operation, Config-Stufen |
| Arbeitsgebiet | `operations/WorkAreaPlanner.tsx` | WorkArea/Nodes/OperationPreview → Bestätigung per `startBuildingOperationWithNodes` |
| Betriebstransport | `logistics/TransportPlanner.tsx` | Transfer-Ziele/-Preview/Fahrzeug-Config → `createInventoryTransfer` |
| Smart Road Planning | `operations/SmartRoadPlannerHud.tsx`, `operations/adapters.ts` | UI-Kontrollpunkte → kanonisches `roadPathPreview` samt `RoadHeightProfile`/Varianten/Kosten → atomarer `buildRoadPath`-Bulk-Command |
| Hafen-Ghost/-HUD | `operations/WaterfrontPlacementHud.tsx`, `renderer/three/ThreeMapRenderer.ts` | `placementDiagnostics`, `getWaterfrontPlacementPreview`; GLB/Fallback, Plattform/Pfeiler/Anker |
| Schifffahrtsvorschau | `renderer/three/ThreeMapRenderer.ts` | `getShippingRoutePreview`; reine gestrichelte Graphprojektion |
| Dev-Reveal | `panels/DebugPanel.tsx` | UI-only `toggleRegionFog` getrennt von `debugUnlockAllRegions` |
| Region freischalten | `panels/RegionDialog.tsx` | Regions-Config, `unlockRegion` |
| Stadtarbeit-Board | `panels/ActivityPanel.tsx` | `getActivityBoard`, Aktivitäts-Commands |
| Stadtarbeit kompakt | `citywork/ActivityExecutionWidget.tsx` | aktive Activity, `MapApi.setMissionFollow`, Abbruch |
| Routenplanung | `panels/ActivityRoutePlanner.tsx` | Orchestrierung über Plan-/Analyse-/Start-Commands |
| Manuelle 2D-Karte | `citywork/ManualRouteMap.tsx` | Terrain-/Gebäude-Snapshot, `RouteRoadAnchors`, `ActivityRoutePreview` |
| Fahrzeug + Cargo | `citywork/VehicleSelector.tsx` | `ActivityPlanningContext.vehicles`, `CargoPlan`, `CargoRouteEvaluation`, `vehicleImage` |
| Live-Tour / Cargo-Timeline | `citywork/TourOverview.tsx` | `CargoRouteStop[]`, Gebäude-Snapshot/Config, echte Ladung vor/nach Stopp |
| Infrastrukturberater | `citywork/InfrastructureAdvisor.tsx` | `getActivityInfrastructureWarnings` |
| Routenkennzahlen | `citywork/RouteSummary.tsx` | `ActivityRoutePreview` |
| Kamera | `hud/CameraControls.tsx`, `MapView.tsx` | `IMapRenderer`/`MapApi` |
| UI-Komposition | `App.tsx` | Ein-Sheet-Regel aus `useUiStore` |
| Dev-Weltvergleich | `world/WorldCompactionPreview.tsx` | dokumentierte Bake-Kennzahlen, nur `DebugPanel` |
| Visuelles System | `styles.css`, `styles/{tokens,layout,components,animations,responsive,citywork,citywork-v4,active-operations,visual-overhaul,overhaul-core-ui,overhaul-build-ux,overhaul-shell}.css` | Legacy-Basis plus geordnete Tokens/Breakpoints; spätere Overhaul-Schichten besitzen die höhere CSS-Autorität |
| 3D-Welt | `renderer/three/ThreeMapRenderer.ts` | Controller-Snapshots, Asset-Registry |
| Himmel/Wetter | `renderer/three/SkyEnvironment.ts` | rein visuelle Environment-Settings |

## Wichtige Brücken

- `MapView.makeMapApi()` registriert nur kleine imperative Präsentationsbefehle
  für Kamera, Fahrmodus und Renderer-Overlays; kein Aufruf mutiert direkt den
  Simulationszustand.
- `WorldMiniMap` nutzt `getCameraView()` für den Rahmen und `focusGround()` für
  Klick-/Ziehfokus; sie rendert keine zweite 3D-Welt.
- `InfoLayerControl` hält nur Filterzustand. `ThreeMapRenderer` liest vorhandene
  Marker-/Effektdaten und verändert niemals Simulationswerte.
- Der Infrastruktur-Layer ist ebenfalls Präsentation. Wassererreichbarkeit,
  Gebäudeanschluss und Routenvorschau kommen ausschließlich aus Controller-
  Read-Helpern; React und Three.js mutieren keinen Gameplayzustand.
- Der Straßenplaner bietet spielerseitig nur `road` an; `road_elevated` bleibt
  eine ausgeblendete Legacy-Definition. `roadPathPreview` liefert pro Abschnitt
  Status, automatische Variante, Terrain-/Deckhöhe, Steigung, Freiraum und
  Kosten sowie ein gemeinsames `RoadHeightProfile`. HUD und
  `setRoadPlanOverlay` lesen diese Werte; bestätigt wird ausschließlich über
  `buildRoadPath`. Bearbeitbare Kontrollpunkt-Griffe, Alternativrouten und eine
  flüchtige Live-Endpunktvorschau sind weiterhin offen.
- Die Fundamentklassifikation liegt in `game/buildings/foundation.ts`, nicht im
  Renderer. `PlacementDiagnostics.foundation` speist Banner und Ghost;
  `placeBuilding` verwendet dieselben Zusatzkosten und dieselbe Bauzeit. Der
  Renderer erzeugt daraus Naturkranz, Hangstufen, Terrasse, Pfähle oder
  Klippen-Stützwand, entscheidet aber nie selbst über die Bebaubarkeit.
- `ActivityRoutePlanner` hält nur Fahrzeug, Filter und gezeichneten UI-Draft.
  Die Reihenfolge kommt aus `controller.getActivityRoutePreview(...)`; es gibt
  keine Drag-&-Drop-Reihenfolge und keine lokale Routenvorlage. Beim Start
  übergibt die UI Ziel-IDs plus validierten `{ vehicle, roadPath }`-Plan an
  dieselben Activity-Commands. Für die Ladungs-/Kapazitätsanzeige steht
  `controller.getActivityCargoPlan(defId, orderedTargetIds, vehicle?)` bereit:
  `CargoPlan` mit `loadsRequired`/`needsReload`, Bedarf je Ziel (`requirements`),
  Etappen (`legs`, pickup/delivery) und `oversizedTargetIds`. Reine Read-
  Projektion — nichts mutieren, Auszahlung bleibt am bestehenden Pfad.
- Für die laufende 3D-Ausführung/HUD steht `controller.getActivityExecutionSnapshot()`
  bereit (L3): `defId`, `targetsDone`/`targetsTotal`, die an der Quelle gehaltene
  `reserved`-Ladung und der rekonstruierte `CargoPlan`. Der sichtbare Halt an der
  Quelle und Nachlade-/Rückfahrt-Etappen (aus `getActivityCargoPlan.legs`) sind
  noch offene Renderer-Arbeit.
- Infrastruktur-Bewertung (L4, §19): `controller.getActivityInfrastructure(defId,
  targetIds, vehicle?, plan?)` → `emptyTravelRatio`, `reloadTrips`,
  `vehicleSuitability`, `warehousePlacementScore`, `routeDirectness`,
  `spoilageRisk`, `estimatedDurationMs` (inkl. Lade-/Entladezeit) und
  `warnings[]` (textfreie Codes → UI übersetzt). `getActivityInfrastructureWarnings`
  ist die schlanke Nur-Hinweise-Projektion. Für die bereits gezeichnete Kette gibt
  `getActivityCargoRoute(defId, targetIds, roadPath, vehicle?)` die konkrete
  `CargoRouteEvaluation` (echte Quell-/Nachladestopps, gemessene Leerfahrt). Alles
  reine Prognose/Anzeige — keine Auszahlung, kein Save.
- `ManualRouteMap` ist eine Canvas-Projektion und kein zweiter Renderer. Sie
  zeichnet ausschließlich Snapshots/Read-Modelle. Straßenzug zeichnet, freie
  Fläche/Mittel-/Rechtszug verschiebt; ein permanenter Werkzeugmodus existiert
  nicht.
- `registry.ts` lädt Bilder nach Dateinamen; `modelManifest.ts` hält
  Modell-IDs und generierte Ordnerdokumentation synchron.
