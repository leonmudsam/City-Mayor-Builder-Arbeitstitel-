# UI-Komponentenkarte

| Mockup-Bereich | Komponente | Datenquelle / Command |
| --- | --- | --- |
| Level/Wappen/XP | `hud/GameHud.tsx` | Controller-Snapshot, `xpForNextLevel` |
| Ressourcenraten | `hud/ResourceCard.tsx` | `getIncome`, `derived.productionPerMin` |
| Zeit/Tageslauf | `hud/CameraControls.tsx::DayNightControl` | `environmentSettings.ts` |
| Linke Hauptnavigation | `hud/QuickActionBar.tsx` | `useUiStore`, `MapApi` |
| Stadtstatus kompakt | `panels/CityStatusPanel.tsx` | Controller-Derivationen/Diagnosen |
| Stadtstatus Detail | `panels/CityStatusDetail.tsx` | Controller-Derivationen |
| Bürger-Inbox + Detail | `panels/CitizenRequestsPanel.tsx` | Quest-Snapshot, `claimQuest` |
| Live-Minimap | `hud/WorldMiniMap.tsx` | Welt-Bake, Gebäude, Diagnosen, `MapApi` |
| Gebäudekatalog | `panels/BuildMenu.tsx` | Building-Config, Buildkosten, `startPlacing` |
| Gebäudedetail | `panels/FloatingBuildingSheet.tsx` | Gebäude-Snapshot, Diagnosen, Commands |
| Region freischalten | `panels/RegionDialog.tsx` | Regions-Config, `unlockRegion` |
| Stadtarbeit-Board | `panels/ActivityPanel.tsx` | `getActivityBoard`, Aktivitäts-Commands |
| Stadtarbeit kompakt | `panels/CityWorkPanel.tsx` | weiterhin verfügbar, aktuell nicht permanent montiert |
| Routenplanung | `panels/ActivityRoutePlanner.tsx` | `getActivityRoutePlan`, Start-/Reroute-Commands |
| Kamera | `hud/CameraControls.tsx`, `MapView.tsx` | `IMapRenderer`/`MapApi` |
| UI-Komposition | `App.tsx` | Ein-Sheet-Regel aus `useUiStore` |
| Visuelles System | `styles.css` | zentrale Tokens/Breakpoints |
| 3D-Welt | `renderer/three/ThreeMapRenderer.ts` | Controller-Snapshots, Asset-Registry |

## Wichtige Brücken

- `MapView.makeMapApi()` registriert nur kleine imperative Kamera-/Fahrbefehle.
- `WorldMiniMap` nutzt `getCameraView()` für den Rahmen und `focusGround()` für
  Klickfokus; sie rendert keine zweite 3D-Welt.
- `ActivityRoutePlanner` übergibt nur Ziel-IDs an den Controller.
- `registry.ts` lädt Bilder nach Dateinamen; `modelManifest.ts` hält
  Modell-IDs und generierte Ordnerdokumentation synchron.
