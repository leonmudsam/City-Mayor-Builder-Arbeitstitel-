# Übergabe an Claude — v0.79

Stand: 23. Juli 2026

## AKTUELLER STAND: Active Operations 2.0 (v0.78–v0.79)

Die laufende Arbeitsfront ist das **aktive Betriebssystem** (kein Passiv-Timer
mehr). Reihenfolge zum Einlesen: `agents/ACTIVE_OPERATIONS_PLAN.md` →
`agents/PROJECT_STATE.md` → `agents/OPEN_TASKS.md`. Ergänzend
`agents/LOGISTICS_INTEGRATION.md`, `agents/DECISIONS.md` (D-031/D-032),
`PATCHNOTES.md` (v0.78/v0.79).

**Erledigt:**
- **A1–A4 (v0.78):** Sägewerk aktiv — Arbeitsauftrag → Arbeiter fällen Bäume →
  lokales Betriebslager; Voll-Stopp, Regeneration, Ressourcenknoten (`tree`),
  Save **v17**. Reines Sim-Modul `src/game/operations/{nodes,operations}.ts`.
- **A5 + A5-Reste (v0.79):** manueller **Lagertransport** ins Zentrallager über
  Fahrzeug + Straßenroute (reine Sim `src/game/operations/transport.ts`,
  verwendet `routeAnalysis.ts` + `logistics.ts` wieder — kein zweites System).
  Mehrfachladungen/Nachfüllfahrten, Rückruf jederzeit, Betriebskosten je Fahrt,
  Netzwerk-Übersicht global/lokal/reserviert/unterwegs. Save **v18** (additiv
  `operations.transfers`, Migration `v17→v18`). **339 Tests grün.**

**Offen (nicht vortäuschen, Details in `OPEN_TASKS.md`):**
- **A6 Steinbruch** (nächster großer Schritt): `operations/nodes.ts` von `tree`
  auf `rock`/Stein generalisieren **und** die Passiv-Produktionstests
  (simulation/systems/upgrade) auf einen dauerhaft passiven Produzenten
  migrieren — der Steinbruch ist heute deren Baseline, der „Standort-Bonus"-Test
  ist steinspezifisch.
- **A7 Farm, A8 Feuerwehr-Dispatch, A9 Aufforstung, A10 Automatisierung**
  (wiederkehrende Transporte auf `createInventoryTransfer`), 3D-Fäll-/Trag-
  Animationen + Einzelbaum-Raycast. A5-Rest: Zwischenlager-Puffer, Kraftstoff.

Save-Schema steht bei **v18**. Verifikation (tsc/eslint/vitest/build/3D-Smoke)
im obersten Abschnitt von `agents/HANDOFF_LOG.md`. Die folgenden Abschnitte
(Wasserwege 7.0, neue Insel, Map Redesign, Stadtarbeit 4.0) sind **historische
Grundlage**, nicht die aktuelle Front.

## Historisch: Wasserwege 7.0

Vor weiterer Welt-/Infrastrukturarbeit lesen:

1. `agents/COAST_GEOMETRY_AUDIT.md`
2. `agents/WATER_INFRASTRUCTURE_PLAN.md`
3. `agents/HARBOR_SYSTEM_PLAN.md`
4. `agents/SHIPPING_ROUTE_UI.md`
5. `agents/OPEN_TASKS.md`

Codex hat die sichtbaren Küstenkegel an ihrer Bake-Ursache behoben, den
visuellen Reveal von echter Regionsprogression getrennt, den Ozeanabschluss
radial/atmosphärisch gestaltet und straßenlose Gebäude als diagnostizierbaren
Betriebszustand eingeführt. `dock_small` und `river_port` besitzen Land-/
Wasser-Footprints, Tiefenprüfung, Küstensnapping, Fallbackmodelle und
Config-Freigaben. Der abgeleitete Wassergraph umfasst 569 Nodes und 1.775
landfreie Kanten; UI und Renderer lesen nur Controller-Projektionen.

**Nicht vortäuschen:** Es gibt noch keine persistente `ShippingRoute`, keine
Schiffsinstanzen, Warenkapazität, Hafenlager, Remote-Construction-Versorgung
oder Brückendurchfahrtslogik. Diese Punkte sind `TODO(CLAUDE_LOGIC)` und müssen
die bestehende Simulation/Aktivität erweitern. Save bleibt v15.

## Zuerst lesen: neue Insel ist verbindlich

`reference/world/island 3d new.glb` ersetzt die bisherige Geometrie vollständig.
Die Source wird offline in 512² Terrain, 1025² Höhe, 40 Regionen sowie Bau-,
Wasser- und Infrastrukturmasken gebacken und niemals zur Laufzeit geladen.
Start ist Region 24 „Herzland“ nahe dem realen Landschwerpunkt bei
Rathausanker (125,193). Küstenankunft `(222,206)`, Versorgungstrasse und
Hafenkandidat sind nur geografische Hooks.

Vor Weltarbeit in dieser Reihenfolge lesen:

1. `agents/TERRAIN_VISUAL_AUDIT.md`
2. `agents/TERRAIN_MATERIAL_MATRIX.md`
3. `WORLD_REBUILD.md` und `WORLD_SCALE.md`
4. `agents/REGION_VISUAL_REDESIGN.md` und `agents/NEW_ISLAND_REGION_PLAN.md`
5. `SAVE_MIGRATION.md` und `agents/OPEN_TASKS.md`

Save-Schema ist v15. v14 wird bewusst einmalig unter
`cmb.save.backup.world-v14` gesichert und neu gestartet; keine
Koordinatenprojektion vortäuschen. Die alte Source hat keinen
Verbraucher, darf wegen der bestehenden Nutzeränderungen aber erst nach einem
sauberen Git-Sicherungspunkt archiviert werden. Die folgenden v0.71-/v0.70-
Abschnitte sind historische Renderergrundlage, nicht mehr Weltgeometriequelle.

## Regions-Wolkenwand v0.71 — historische Renderergrundlage

Gesperrte Regionen werden nicht mehr als niedrige Teaserfläche gerendert. Der
bestehende `ThreeMapRenderer` setzt seine Decke oberhalb des höchsten
Regionspunkts und kombiniert eine blickdichte Shape-Fläche, drei driftende
`cloud_bank.webp`-Lagen sowie ein auf 168 Ellipsoide gedeckeltes
`InstancedMesh`. Die alte Biom-/Gipfel-Silhouette im Nebel ist entfernt.

Pro Region erzeugt der Renderer genau ein Canvas-Sprite mit Schloss,
lokalisiertem Regionsnamen und dem echten `unlockLevel`. Der Marker bleibt vor
Wetter und Wolken lesbar und öffnet per Raycast den bestehenden Regionsdialog.
`WorldMiniMap` verdeckt dieselben gesperrten Regions-IDs vollständig und nutzt
`BAKED_REGIONS` plus Regions-Config für kleine Schloss-/Level-Marker. Diese
Darstellung ist rein visuell: keine zweite Regionslogik, keine neue Config und
keine damalige Save-Migration; der heutige Weltstand ist Schema v15.

Relevante Dateien: `src/renderer/three/ThreeMapRenderer.ts`,
`src/components/hud/WorldMiniMap.tsx`, `src/i18n/de.json`. Bei weiterer Arbeit
die vorhandene Unlock-Fade-Animation, Klickweiterleitung und prozeduralen
Fallbacks erhalten.

## Map Redesign 5.0 — historische Renderergrundlage

Die vorhandene Inselgeometrie wurde **nicht** ersetzt. Die visuelle Welt liest
weiterhin die damalige Inselmaske, dasselbe Höhenfeld und damals 32
Gameplayregionen. Die fortgeführte Renderermatrix
`src/renderer/three/worldVisualProfiles.ts`: Sie ordnet jeder Region Palette,
Splat-Gewichte, Vegetationscharakter und eine neutrale Landmarke zu.

`ThreeMapRenderer` mischt zwölf Bodenschichten, verwendet Triplanar-Sampling für
Klippen/Bergfels, verteilt vorhandene Nadel-/Laubbaum-GLBs differenzierter und
bündelt die neue Flussströmung in einer animierten Geometrie. Sechs neue
KI-generierte Base-Color-Texturen sind aktiv. Neue Landmark-/Schilf-/Felsnamen
werden über `modelManifest.ts` geladen und besitzen Fallbacks.

Verbindliche Map-Dokumente:

- `docs/agents/MAP_REDESIGN_AUDIT.md`
- `docs/agents/MAP_REDESIGN_PLAN.md`
- `docs/agents/REGION_VISUAL_REDESIGN.md`
- `docs/agents/TERRAIN_MATERIAL_MATRIX.md`
- `docs/agents/WORLD_ASSET_MANIFEST.md`

Aktuell ist Region 16 „Sonnenkliff“ visuell rote Wüste, Region 40
„Schilfdelta“ visuell Sumpf. Das ist **keine** neue Spielregel. Mögliche Wasserknappheit,
Solar-/Nahrungseffekte, Feuchtgebietsboni oder Gesundheitsrisiken sind
`TODO(CLAUDE_LOGIC)` und dürfen nur über validierte Game-Config eingeführt
werden. Der aktuelle Weltstand nutzt Schema v15.

## Stadtarbeit Redesign 4.0 — weiterhin kanonisch

### Ergebnis

Das verbindliche Redesign-4.0-Mockup ist auf die vorhandene
Stadtarbeit-Architektur übertragen. Die Karte dominiert, Aufträge sind links
kompakt filterbar und Fahrzeug/Cargo, Live-Tour und Startfreigabe stehen rechts.
„Letzte Route“, Planname, lokales Speichern/Laden, getrennte Pan-/Zeichenmodi
und die starre Drag-&-Drop-Zielliste existieren nicht mehr.

Die Reihenfolge entsteht aus der wirklich gezeichneten Straße. Wiederberührt die
Route die echte Quelle nach einer Entladung, erkennt die Cargo-Projektion einen
Nachfüllstopp. Cargo, Leerfahrt, Handlingzeiten, Verkehr und Qualität reagieren
live. Erst eine lückenlose, cargo-gültige Kette kann gestartet werden.

### Kanonische Read-Verträge

- `getActivityPlanningContext(defId)` bündelt Definition, echte Quellen-IDs,
  RNG-neutrale Pflichtziele, aktuell freigeschaltete Fahrzeuge und Basislohn.
- `getActivitySupplySources(defId)` liefert alle realen Quellgebäude; Redesign
  4.0 verwendet bis zu einer kanonischen Quellenwahl die erste ID als Startanker.
- `getActivityDeliveryTargets(defId)` liefert aktive oder RNG-neutrale Ziele.
- `getAvailableActivityVehicles(defId)` filtert Config-Fahrzeuge nach Mission,
  Level und `future`.
- `getActivityRoutePreview(defId, targetIds, roadPath, vehicle?)` ist die einzige
  Live-Projektion für Route, Reihenfolge, Cargo, Infrastruktur und `complete`.
- `getActivityInfrastructureWarnings(...)` liefert textfreie Codes; die UI
  besitzt nur deutsche Darstellungstexte.

Reine Domain-Helfer:

- `targetOrderOnPath(...)`: erste tatsächliche Berührung jedes Zielankers.
- `evaluateCargoRoute(...)`: Quelle/Lieferung/Nachfüllen, Ladestand,
  Leerfahrtkacheln und Cargo-Gültigkeit auf genau dem übergebenen Weg.
- `analyseManualRoute(...)`: akzeptiert nur ganzzahlige, orthogonal
  zusammenhängende Kacheln im echten Straßennetz; ergänzt keinen Weg.

### Commands und Save

Die UI startet weiterhin über die atomaren vorhandenen Commands:

```ts
startActivity(defId, orderedTargetIds, { vehicle, roadPath })
setActiveActivityRoute(orderedTargetIds, { vehicle, roadPath })
```

Die im Auftrag vorgeschlagenen kleinteiligen Commands wie
`selectActivityVehicle`/`addActivityLeg`/`updateActivityLegRoute` sind nicht
nötig, solange der Plan vor Start nur UI-Draft ist. Es gibt keinen zweiten
Plan-State und keine direkte React-Mutation.

Save-Schema ist **v13**:

- v12: optional `ActiveActivity.vehicle` und `plannedRoadPath`.
- v13: optional `ActiveActivity.reserved`; Reservierung erfolgt beim Start und
  wird bei Abbruch korrekt zurückgegeben.
- v0.69 persistiert nichts Neues; keine Migration.

### Datengetriebene Missionen

Es gibt acht Fahrmissionen. Neu in v0.69:

- `water_delivery`: Wasseranlage → Wohngebiete, skaliertes Frischwasservolumen.
- `market_restock`: Lager → Märkte, verderbliche Ware/Kühlfahrzeug-Trade-off.
- `park_supply`: Lager/Bauhof → Parks, sperrige Grünflächenlieferung.

Sie sind normale `ActivityDef`-Einträge. Kein neues System, keine parallele
Belohnung und keine neue Resource. `material_delivery.cargoModel` verwendet Holz
als repräsentatives Mischvolumen; `costPerTarget` bleibt Holz + Stein.

### UI-Komponenten

- Orchestrierung: `components/panels/ActivityRoutePlanner.tsx`
- Karte/Interaktion: `components/citywork/ManualRouteMap.tsx`
- Fahrzeug/Cargo: `components/citywork/VehicleSelector.tsx`
- Live-Tour: `components/citywork/TourOverview.tsx`
- Kennzahlen: `components/citywork/RouteSummary.tsx`
- Berater: `components/citywork/InfrastructureAdvisor.tsx`
- Ausführung: `components/citywork/ActivityExecutionWidget.tsx`
- Redesign-Stile: `styles/citywork-v4.css` (nach `citywork.css` importiert)

Die Canvas-Karte ist nur eine Snapshot-Projektion, kein zweiter Renderer. Sie
zeichnet Terrain, Regionen, Straßen, Gebäude, Verkehr, Marker und Route in einem
Canvas; die 3D-Welt bleibt ausschließlich `renderer/three/`.

## Asset-Vertrag

20 neue transparente KI-PNGs liegen unter
`src/assets/ui/citywork/{markers,cargo,advisors,missions}`. Registry-Auflösung:
`uiImage(<Dateiname ohne Endung>)`. `map`, `vehicles` und `tutorial` sind
dokumentierte Drop-in-Slots. Prompts, Maße und Semantik stehen in den lokalen
READMEs sowie `docs/agents/UI_ASSET_MANIFEST.md`.

## TODO(CLAUDE_LOGIC) — exakt fehlende Daten

1. **Quellenwahl / mehrere Quellen:** Plan-Read-Model braucht eine gewählte
   `sourceBuildingId` und einen Command-/Planparameter. Heute ist die erste echte
   Quelle deterministischer Start; weitere Quellen werden nicht als auswählbar
   vorgetäuscht.
2. **Freie Legs:** Zwischenlager, Rückwaren, optionale Ziele, Depot-Rückkehr,
   Fahrzeugwechsel und mehrere Fahrzeuge benötigen kanonische `ActivityLeg`s
   mit Typ, Gebäude-ID, Ladungsdelta, Pflichtstatus und validiertem Teilpfad.
3. **Exakter Beraterfokus:** `InfrastructureWarning` braucht optional
   `roadPoint` oder `segmentId`. Bis dahin passt „Route zeigen“ die ganze Tour
   ein.
4. **Quellbestand/-ladeleistung:** Bestand ist weiterhin der globale Pool. Für
   mehrere Lager mit eigener Verfügbarkeit/Ladegeschwindigkeit wäre zuerst ein
   Game-Datenmodell nötig; die UI erfindet keine Lagerbestände.
5. **Straßendetails:** Zustand/Belag, Steigung, Sperrung, Parkplätze, Wetter,
   dynamischer Stau, Kraftstoff und Schaden fehlen kanonisch.
6. **Auszahlung:** `rewardMultiplier` bleibt Prognose. Erst nach Balancingtest
   an die tatsächliche Belohnung koppeln.

## Verifikation

Die aktuelle, vollständige Prüfmatrix einschließlich Screenshot-Status steht im
neuesten Abschnitt von `docs/agents/HANDOFF_LOG.md`. Vor Weiterarbeit außerdem
`docs/agents/PROJECT_STATE.md` und `docs/agents/OPEN_TASKS.md` lesen.
