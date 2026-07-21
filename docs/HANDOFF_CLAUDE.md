# Übergabe an Claude — Map Redesign 5.0 + Stadtarbeit 4.0 / v0.70

Stand: 21. Juli 2026

## Map Redesign 5.0 — zuerst lesen

Die vorhandene Inselgeometrie wurde **nicht** ersetzt. Die visuelle Welt liest
weiterhin dieselbe Inselmaske, dasselbe Höhenfeld, dieselben Straßen und dieselben
32 Gameplayregionen. Neu ist die reine Renderermatrix
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

Wichtig: Region 9 (Morgenküste) ist visuell rote Wüste, Region 29 (Westbucht)
visuell Sumpf. Das ist **keine** neue Spielregel. Mögliche Wasserknappheit,
Solar-/Nahrungseffekte, Feuchtgebietsboni oder Gesundheitsrisiken sind
`TODO(CLAUDE_LOGIC)` und dürfen nur über validierte Game-Config eingeführt
werden. Save-Schema bleibt v13.

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
