# Handoff-Log

## 2026-07-21 — Codex — Map Redesign 5.0 (v0.70)

### Umsetzung

- Bestehende Inselbake, Höhenquelle, Chunks, Regionstopologie, Wasser,
  Vegetation, Assets und Atmosphäre auditiert; kein paralleles Weltsystem
  angelegt.
- `worldVisualProfiles.ts` mit zwölf visuellen Profilen und vollständiger
  Zuordnung aller 32 Regions-IDs ergänzt. Region 9/29 sind ausschließlich
  visuell Wüste/Sumpf; Gameplay bleibt `TODO(CLAUDE_LOGIC)`.
- Terrain auf zwölf Splat-Layer erweitert. Berg/Klippe verwenden
  Weltkoordinaten-Triplanar; Nachbarschaftssamples verhindern harte sichtbare
  Regionskanten.
- Sechs KI-generierte Base-Color-PNGs für Bergfels, Schnee, Wiese, rote Wüste,
  Sumpf und Küstenkies erstellt, visuell geprüft, manifestiert und in den
  Produktionsbuild übernommen. Tatsächliche Auflösung: je 1254×1254.
- Vorhandene KI-/Drop-in-Bäume werden als Nadel-, Laub- und Großkieferfamilie
  differenziert. Fels, Schilf und Totholz besitzen neue Manifestnamen,
  Instancing und prozedurale Fallbacks.
- Ozeanwellen erweitert und eine gebündelte animierte Flussströmungsgeometrie
  ergänzt. Felsbogen, alter Baum, Ruine, Wüstenfelsnadel, Sumpfbaum und Seeinsel
  als deterministische neutrale Landmarken verdrahtet.
- Modellprompts/READMEs neu generiert und die vollständige Audit-, Plan-,
  Regions-, Material-, Asset-, Patchnote-, Projektstand- und Claude-Übergabe auf
  v0.70 aktualisiert.

### Architektur / Save

- Visuelle Profile liegen ausschließlich unter `src/renderer/three/`; keine
  Simulation importiert Three/React/UI-State.
- Inselkontur, Höhenbake, Gameplayregionen, Baufelder und Balancing unverändert.
- Drop-in-Namen bleiben zentral in `modelManifest.ts`; fehlende Assets crashen
  nie. Texturen bleiben zentral in `terrainTextureManifest.ts`.
- Kein neuer persistierter Zustand; Save-Schema bleibt **v13**.

### Prüfung

- `npx tsc -b --force`: grün.
- `npx eslint src tests`: grün.
- `npx vitest run`: grün, **35 Testdateien / 259 Tests**.
- `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`: grün,
  **22 Tests**; generierte Dokumente synchron.
- `npm run build`: grün; nur bekannte Rollup-Warnung zum großen Hauptchunk.
- Vite-Preview unter `http://127.0.0.1:4173/`: HTTP 200, Basis-URL `/` gültig.
- Screenshot-Smoke: **Infrastruktur blockiert**. Die vorgeschriebene integrierte
  Browserlaufzeit wurde verbunden, das Troubleshooting gelesen und die
  Verfügbarkeit einmal geprüft; `agent.browsers.list()` lieferte `[]`. Daher
  keine erfundene Screenshotfreigabe und kein fremder Browser-Fallback.
- Sechs neue Terrainbilder einzeln visuell inspiziert; alle als valide
  1254×1254-PNGs geprüft.
- `npm run tauri:build`: blockiert vor Kompilierung durch fehlendes lokales
  `cargo` (`cargo metadata: program not found`).

### Sichere Fortsetzung

Zuerst `MAP_REDESIGN_AUDIT.md`, `MAP_REDESIGN_PLAN.md`,
`REGION_VISUAL_REDESIGN.md`, `TERRAIN_MATERIAL_MATRIX.md` und
`WORLD_ASSET_MANIFEST.md` lesen. Danach den Screenshot-Smoke auf einem System
mit verfügbarer Browserinstanz nachholen. PBR-Begleitmaps und neue GLBs nur über
die bestehende Registry/Manifeste ergänzen; Wüsten-/Sumpflogik ausschließlich
als validierte Config- und Balancing-Änderung.

## 2026-07-21 — Codex — Stadtarbeit UI/UX Redesign 4.0 (v0.69)

### Umsetzung

- `ActivityRoutePlanner` vollständig neu hierarchisiert: Missionen links,
  dominante Karte mittig, Fahrzeug/Cargo, Live-Tour und Bestätigung rechts.
- Planname, „Letzte Route“, lokales Speichern/Laden, Drag-&-Drop-Zielreihenfolge
  und getrennte Pan-/Zeichenwerkzeuge entfernt.
- Einheitliche Kartensteuerung, automatischer Fit, Zoom 0,55–7,
  Marker-Doppelklick, Leertaste/F/R/Esc und Rechtsklick-Rückbau umgesetzt.
- Canvas visuell aufgewertet: echte Terrain-/Region-/Straßen-/Gebäudedaten,
  Schatten, Verkehr, animierter Glow, Pfeile, Etappenfarben und KI-Marker.
- Neue reine Projektionen: `targetOrderOnPath`, `evaluateCargoRoute`,
  `ActivityPlanningContext`, `ActivityRoutePreview` sowie die geforderten
  Controller-Read-Helper. Keine automatische Wegergänzung.
- Neue Komponenten `TourOverview` und `InfrastructureAdvisor`; Fahrzeug/Cargo
  sowie kompakte Analyse auf v4 umgebaut.
- Acht Fahrmissionen insgesamt; neu per Config: Trinkwasser, Marktnachschub und
  Grünflächenversorgung. `material_delivery`/`log_transport` besitzen explizite
  physische Cargo-Modelle.
- 20 neue transparente KI-PNGs: 8 Marker, 5 Cargo, 2 Berater, 5 Missionen.
  Sieben Stadtarbeit-Assetordner mit Prompts/Fallbacks dokumentiert.
- Deutsche Patch Notes, Architektur, Save-Migration, Projektstand,
  Entscheidungen, UI-Komponentenkarte, Assetmanifest und Claude-Handoff auf
  v0.69/v13 aktualisiert.

### Architektur / Save

- UI liest ausschließlich Controller-Snapshots/Read-Modelle und sendet den
  validierten Plan über bestehende Activity-Commands.
- Neue Missionen erweitern nur `activities.config.ts`; kein neues System.
- Kein neuer persistierter Zustand; Save bleibt **v13**.
- Exakte offene `TODO(CLAUDE_LOGIC)`-Daten: Quellenwahl, freie Plan-Legs
  (Zwischenlager/Depot/Rückwaren/Fahrzeugwechsel), Warnungs-Segmentfokus,
  Lagerbestand/-ladeleistung und echte Straßenzustands-/Ereignisdaten.

### Prüfung

- `npx tsc -b --force`: grün.
- `npx eslint src tests`: grün.
- `npx vitest run`: grün, **34 Testdateien / 255 Tests**.
- `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`: grün,
  **22 Tests**; generierte Modell-Dokumentation synchron.
- `npm run build`: grün; nur die bekannte Rollup-Warnung zum großen
  Haupt-Chunk.
- 20 Stadtarbeit-PNGs erscheinen in der Vite-Assetausgabe; Alpha/Abmessungen
  wurden nach der Generierung geprüft, repräsentative Motive visuell inspiziert.
- Screenshot-Smoke 1280×720 / 1920×1080: **Infrastruktur blockiert**. Die
  vorgeschriebene integrierte Browserlaufzeit wurde verbunden und nach deren
  Troubleshooting einmal abgefragt; `agent.browsers.list()` lieferte `[]`.
  Deshalb keine erfundene Bildfreigabe und kein externer Browser-Fallback.
- `npm run tauri:build`: blockiert vor Kompilierung durch fehlendes lokales
  `cargo` (`cargo metadata: program not found`), kein gemeldeter Frontendfehler.

### Sichere Fortsetzung

Zuerst `docs/HANDOFF_CLAUDE.md`, dann `PROJECT_STATE.md` und `OPEN_TASKS.md`.
Der frühere L4-Hinweis weiter unten, die parallele UI sei nicht typrein, ist mit
diesem gemeinsamen grünen Gate erledigt.

## 2026-07-21 — Claude — Stadtarbeit-Logik 2.0, Phase L4 (Logistik-Bewertung & Leerfahrtanteil)

### Claude — Stadtarbeit-Logik 2.0 (L4)

- **Reine Bewertung** in `activities/logistics.ts`:
  - `evaluateInfrastructure(input)` → `InfrastructureEvaluation`: `emptyTravelRatio`
    (§19, aus den Nachlade-Rückfahrten der Cargo-Etappen), `reloadTrips`,
    `loaded/empty/totalDistanceTiles`, `routeDirectness`, `vehicleSuitability`
    (Kapazität vs. Bedarf × Handling in engen/vollen Straßen),
    `warehousePlacementScore`, `congestionScore`, `estimatedDurationMs` inkl.
    `handlingDurationMs` (Lade-/Entladezeit) + `drivingDurationMs`, `spoilageRisk`
    (§12) und textfreie `warnings[]` (Codes: `oversized_target`, `many_reloads`,
    `high_empty_travel`, `low_vehicle_suitability`, `oversized_vehicle`,
    `perishable_no_cooling`, `incomplete_road`, `narrow_streets`).
  - `evaluateCargoRoute(plan, source, targets, roadPath)` → `CargoRouteEvaluation`:
    Ist-Auswertung eines gezeichneten Pfades (echte Quell-/Nachladestopps,
    gemessene Leerfahrtkacheln). Zuvor ungenutztes Gerüst, jetzt verdrahtet.
- **Neue Config (optional, kein Save):** `ActivityVehicleDef.loadTimeSec`,
  `unloadTimeSecPerTarget`, `narrowStreetPenalty`, `cooling` — Zod-validiert,
  konkrete Werte je Fahrzeug (große Fahrzeuge laden langsamer / enge Straßen
  schwerer; `refrigerated_truck` kühlt).
- **Read-Helper:** `controller.getActivityInfrastructure(defId, targetIds,
  vehicle?, plan?)`, `getActivityInfrastructureWarnings(...)`,
  `getActivityCargoRoute(defId, targetIds, roadPath, vehicle?)`. Reine Prognose/
  Anzeige — **kein Save-Bump, keine Auszahlungskopplung** (D-013/D-017).
- **Tests:** `tests/logistics.test.ts` von 12 auf **22** erweitert (Leerfahrt bei
  einer/zwei Ladungen, Lade-/Entladezeit, Determinismus, `evaluateCargoRoute`
  Nachlade-Erkennung + Leerfahrtmessung, Controller-Helfer mit echter Stadt:
  Van↔LKW-Trade-off, Verderb mit/ohne Kühlung, Wiring).

### ⚠️ Build-Status bei L4-Abschluss (an Codex)
- Die Claude-Logikschicht (`game/`, `config/`, `tests/`) ist typrein; `vitest`
  **34 Dateien / 252 Tests** grün; `eslint src tests` grün.
- `tsc -b`/`npm run build` waren **nicht** grün, weil die Codex-Stadtarbeit-UI
  parallel umgebaut wurde: `components/citywork/ManualRouteMap.tsx` (`resources`
  ist keine `BuildingCategory`), `RouteSummary.tsx` (`tone` exactOptional / fehlender
  Export `reachedTargets`), `panels/ActivityRoutePlanner.tsx` (fehlendes `visitOrder`-
  Prop, `analysis` vs. `preview`). Diese Fehler liegen in **Codex-Dateien**, nicht in
  der L4-Logik. Codex integriert dort gerade `CargoRouteStop`/`getActivityCargoRoute`;
  der gemeinsame Gate wird mit der UI-Landung grün. Claude hat diese UI **nicht**
  angefasst (Ownership).

### Offene Codex-Ansichten (L4)
- Leerfahrtanteil, Fahrzeugeignung, Quellenlage und Hinweiscodes im Planer/
  Route-Summary anzeigen (Zahlen/Codes liegen bereit; Textbausteine in der UI).

## 2026-07-21 — Claude — Stadtarbeit-Logik 2.0, Phase L3 (Reservierung an der Quelle, Save v13)

### Claude — Stadtarbeit-Logik 2.0 (L3)

- **Neue Daten:** `ActiveActivity.reserved?: Partial<Record<ResourceId, number>>`
  — an der Quelle reservierte, physisch bereits aus dem globalen Pool entnommene
  Ladung. Zod-validiert (`schemas.ts`).
- **Ablauf:** `startActivity` entnimmt bei Ladungsmissionen (`costPerTarget`)
  `costPerTarget × Ziele` **upfront** aus dem Pool und hält sie als `reserved`.
  Reicht der Vorrat nicht → Mission startet nicht (`insufficient`, §18).
  `progressActivity` zieht jede Auslieferung aus `reserved` statt aus dem Pool
  (Alt-Save ohne `reserved` → bisheriger Pool-Pfad). `abandonActivity` gibt die
  restliche Reserve zurück (§5), gedeckelt durch die Lagerkapazität.
- **Netto identisch:** Gesamtverbrauch bleibt `costPerTarget × Ziele` wie bisher —
  nur der Zeitpunkt (upfront statt pro Ziel) ändert sich; keine Balancingänderung.
- **Neuer Read-Helper:** `controller.getActivityExecutionSnapshot()` →
  `ActivityExecutionSnapshot` (Zielfortschritt, gehaltene `reserved`,
  rekonstruierter `CargoPlan`). Reine Read-Projektion für 3D-Ausführung/HUD.
- **Save-/Migration:** Schema **v13**, lineare Migration `12→13` (Normaliser —
  laufende v12-Missionen ohne `reserved` bleiben gültig, es wird nichts erfunden).
- **Tests:** `tests/activityReservation.test.ts` (8): Upfront-Entnahme,
  Zug-aus-Reserve, Netto-Gleichheit, Abbruch-Rückgabe, Start-Sperre bei zu wenig
  Vorrat, Snapshot, Save-Roundtrip v13, v12→v13-Migration. Quartett grün: tsc ·
  eslint · vitest **34 Dateien / 242 Tests** · build.

### Offene Codex-Ansichten (L3)
- 3D-Ausführung/HUD kann `getActivityExecutionSnapshot()` anzeigen (Reserve,
  Zielfortschritt, „X Beladungen").
- **Noch nicht** umgesetzt: sichtbarer Halt an der Quelle / Nachlade-Etappen
  während der Fahrt und echte Rückfahrt-Etappen. Die Ladungs-/Etappenplanung
  liegt bereit (`getActivityCargoPlan.legs`); der Renderer-Halt an Quellen ist
  Codex-Arbeit. Bis dahin ist die Reservierung logisch korrekt, aber visuell noch
  eine reine Delivery-Fahrt.

### Offene Balancingpunkte / nächste Claude-Phasen
- L4 Bewertung (Leerfahrtanteil, Lade-/Entladezeit, Fahrzeugeignung).
- L5 adaptive Mengen (§13) + `cargoModel`/Ökonomie vereinheitlichen.
- L6 Zwischenlager, L7 Bahn/Flug-Typgerüst.

## 2026-07-21 — Claude — Stadtarbeit-Logik 2.0, Phase L1+L2 (Ladung & Kapazität)

Auftrag „STADTARBEIT-LOGIK 2.0". Plan verbindlich:
`docs/agents/CITYWORK_LOGIC_2_PLAN.md`.

### Claude — Stadtarbeit-Logik 2.0

- **Neue Daten:** `ActivityDef.cargoModel?` (transportiertes Volumen: `resource`,
  `perTarget`, `scaleByResidents?`, `perishable?`) — getrennt vom Ökonomie-Sink
  `costPerTarget`. Zod-validiert (`schemas.ts`). `food_delivery` erhält
  `{food, perTarget 60, scaleByResidents, perishable}`.
- **Neue Read-Helper:** `controller.getActivityCargoPlan(defId, orderedTargetIds,
  vehicle?)` → `CargoPlan` (Transportbedarf je Ziel, `loadsRequired`,
  `needsReload`, Etappen `legs[]` pickup/delivery, `oversizedTargetIds`). Reine
  Read-Projektion, ändert weder State noch Auszahlung.
- **Ladungsmodell / Etappenmodell:** neues reines Modul
  `src/game/activities/logistics.ts` (`resolveCargoModel`, `cargoRequirements`,
  `planCargoLegs`, `cargoPlanFor`). Greedy-Packer: übersteigt der Restbedarf die
  Restladung → Pickup-Etappe (Nachladen, §2). Übergroßes Einzelziel wird über
  volle Ladungen gesplittet und markiert.
- **Fahrzeugwerte:** `capacity` aus dem bestehenden Katalog wird jetzt real
  ausgewertet (Van 250 < 5×60 → 2 Beladungen; großer LKW 1000 → 1).
- **Reservierungen / reale Entnahme:** noch NICHT im Ausführungspfad — L2 ist
  Planungs-/Prognoseschicht. `progressActivity` bleibt unverändert (Verbrauch über
  `costPerTarget`). Pool-Reservierung + Etappen-Ausführung folgen in L3 zusammen
  mit dem Renderer-Halt an Quellen und dem Save-Bump.
- **Bewertung:** unverändert (Leerfahrtanteil kommt in L4).
- **Save-/Migration:** KEINE. Schema bleibt **v12**; nur optionale Config-Felder,
  nichts Neues persistiert.
- **Tests:** `tests/logistics.test.ts` (12): Überladeschutz, Nachladen,
  Teilentladung, Pickup-vor-Delivery, übergroßes Ziel, Determinismus, Config-Plan
  Van↔LKW. Quartett grün: tsc · eslint · vitest **33 Dateien / 234 Tests** · build.

### Offene Codex-Ansichten
- Planer kann `getActivityCargoPlan` anzeigen: „X Beladungen nötig", Bedarf je
  Ziel, Pickup-Stopps, Warnung bei übergroßem Ziel/zu kleinem Fahrzeug.

### Offene Balancingpunkte / nächste Claude-Phasen
- L3 Etappen-Ausführung (Reservierung, reale Entnahme an Quellen, Rückfahrt) →
  Save **v13** + Migration `12→13`.
- L4 Bewertung (Leerfahrtanteil, Lade-/Entladezeit, Fahrzeugeignung).
- L5 adaptive Mengen (§13) — dann `cargoModel` und Ökonomie vereinheitlichen,
  `activeplay` neu abstimmen.

## 2026-07-20 — Codex — Stadtarbeit 2D / Fahrzeuge / 3D-Ausführung (v0.65)

### Umgesetzt

- Alter Auto-Optimierungsdialog entfernt; neue dreispaltige Planungswerkbank
  nach den drei Stadtarbeit-Mockups.
- Manuelles Straßenzeichnen per Klick/Ziehen, Rechtsklick-Undo, Zoom/Pan/Fokus,
  Esc/R/F, Verkehrs-/Gebäudeebene und Bounding-Box-Fokus.
- Drag-&-Drop-Zielreihenfolge; jede Änderung verwirft die alte Route.
- Kanonische `analyseManualRoute`: keine automatische Lückenfüllung, exakte
  Graph-/Anker-/Reihenfolge-/Endprüfung.
- Fahrzeugkatalog in Config: Kapazität, Tempo, Handling, Kosten, Verbrauch,
  Stärken/Schwächen, Level und Activity-Kompatibilität.
- Auswahl wird mit Route gespeichert und vom Three-Renderer automatisch
  abgefahren. Folge-/Freikamera, Fortschrittswidget, Abbruch, 2D-Rücksprung.
- Ergebnis-Event um Zeit, Strecke, Effizienz, Straßenanteil und Fahrzeug
  erweitert; Auszahlung bleibt am vorhandenen Activity-Pfad.

### Save

- **v12**, lineare Migration `11→12`.
- Neue optionale Felder: `ActiveActivity.vehicle`, `plannedRoadPath`.
- Alte laufende Missionen bleiben unverändert; keine Route wird erfunden.

### KI-Assets

- `medium_truck.png`, `large_truck.png`, `refrigerated_truck.png`,
  `heavy_transporter.png`.
- Eingebautes Bildwerkzeug, flacher `#ff00ff`-Hintergrund, lokale Soft-Matte-/
  Despill-Freistellung; RGBA geprüft.
- Modellnamen zentral in `ACTIVITY_VEHICLE_MODELS`; generierte Fahrzeug-README/
  PROMPTS synchron.

### Bewusst offen

- Keine erfundenen Werte für Steigung, Straßenzustand, Schäden, Kraftstoff,
  dynamische Ereignisse oder Parkplätze.
- Güterzug/Frachtflugzeug nur sichtbare Zukunftsvorschau.
- `rewardMultiplier` bleibt Prognose.

### Prüfung

- `npx tsc -b --force`: grün.
- `npx eslint src tests`: grün.
- `npx vitest run`: **32 Testdateien / 222 Tests** grün.
- Modell-Doku-Test: **22 Tests** grün; README/PROMPTS synchron.
- `npm run build`: grün; nur bekannte Rollup-Warnung zum großen Haupt-Chunk.
- `npm run tauri:build`: vor dem Kompilieren blockiert,
  `cargo metadata: program not found`; lokale Toolchain-Sperre, kein gemeldeter
  TypeScript-/Tauri-Codefehler.
- Browser-Screenshot-Smoke blockiert: keine Browserinstanz verfügbar
  (`agent.browsers.list() = []`). Breakpoints nicht als visuell freigegeben
  markieren.

## 2026-07-20 — Claude Code — C3–C7: Anliegen-Fokus, Platzierung/Upgrade, Regionsvorschau, Straßenplan, Balancing (v0.64)

### Analysiert
- Restliche zwei kanonischen `TODO(CLAUDE_LOGIC)` (Anliegen-Kartenfokus,
  Regionsvorschau) sowie §16 (Upgrade-Werte) und §25/§26 (Balancing/Aktivspiel).

### Logik umgesetzt
- **C3 Anliegen-Kartenfokus:** reine Projektion `questFocus` (Gebäude eines
  gebäudebezogenen Ziels → sonst nächste gesperrte, freischaltbare Region →
  sonst Stadtzentrum). „Auf Karte zeigen" aktiviert (`getMapApi().focusGround`).
- **C4 Platzierung/Verschieben/Upgrade:** Read-Helper `placementDiagnostics`
  (valid/reason/terrain/region/roadAccess/locationBonus/cost); Verschieben-
  Invarianten geprüft (Zustand/Belegung erhalten). **§16-Fix:** das
  Coverage-Overlay nutzte `status==='active'` und zeigte einen Radius im Upgrade
  fälschlich als 0 — jetzt `isContributing` wie die Simulation.
- **C5 Regionsvorschau:** `regionPreview` leitet begünstigte Gebäude aus den
  `productionModifiers` der Region ab (Config-Projektion). Skeleton in
  `RegionDialog.tsx` durch echte Liste ersetzt.
- **C6 Straßenplanung:** `roadPathPreview` validiert einen gezeichneten Pfad
  pfad-bewusst (Anschluss an Netz/frühere Pfadkacheln), liefert pro Kachel
  Status/Grund/Kosten + Summe. Reine Vorschau — kein Sofortbau, keine Abbuchung.
- **C7 Balancing:** Konvergenz-Regressionstest (zufriedene Metropole erreicht
  ~Kapazität, §25) und Aktivspiel-Test (Produktion nur im Live-Tick, §26).

### Bestehende Codex-Arbeit weiterverwendet
- Nur minimale Anbindungen in `CitizenRequestsPanel.tsx` (Button aktiviert) und
  `RegionDialog.tsx` (Liste statt Skeleton); kein Layout-/Style-Umbau.

### Neue Controller-Read-Helper
- `questFocus`, `placementDiagnostics`, `regionPreview`, `roadPathPreview`.
  Keine neuen mutierenden Commands; Command-Grenzen unverändert.

### Config-/Save-Auswirkung
- Keine Config-Änderung. Alle Helfer sind live berechnet — **Save bleibt v11**.

### Codex muss visuell noch ergänzen
- Straßen-Planungs-/Bestätigen-UI kann `roadPathPreview` nutzen (Farbe je
  Kachel-Status, Kosten/Länge), Bau weiterhin über bestehende Platzierung.
- „Auf Karte zeigen" schließt aktuell das Detail; optional Kamerafahrt/Highlight.

### Tests
- Neu: `questFocus` (5), `placementUpgrade` (5), `regionPreview` (5),
  `roadPlanning` (4), `populationBalance` (3). Gesamt grün: `tsc` · `eslint` ·
  `vitest` (32 Dateien / 218 Tests) · `build`. Browser-Smoke steht aus (Interface
  extern blockiert).

## 2026-07-20 — Claude Code — C1/C2: Audit + kanonische Routenanalyse (v0.63)

### Analysiert
- Repo-Stand nach Codex-Visualphase (v0.60–v0.62) gegen „Overhaul 3.0" geprüft;
  `docs/agents/CLAUDE_AUDIT.md` erstellt (was umgesetzt / visuell-aber-logiklos /
  offen / überholt, je Bereich + Zuständigkeit).
- Drei kanonische `TODO(CLAUDE_LOGIC)`-Stellen lokalisiert: Routenlast
  (`ActivityRoutePlanner.tsx`), `CitizenRequest.focusPosition/regionId`,
  `RegionPreview.futureBuildings/unlockProject`.

### Logik umgesetzt (C2 — höchste offene Logikpriorität)
- Neues reines Domain-Modul `src/game/activities/routeAnalysis.ts`: kanonische,
  DETERMINISTISCHE Routenbewertung auf dem ECHTEN Straßengraphen
  (`derived.roadNetwork`) — BFS-Wegfindung, Andocken der Gebäude an die Fahrbahn,
  Anrainerdichte-basierte Verkehrslast, Fahrzeit, Kreuzungen, Effizienz,
  Medaillen-Prognose und gedeckelter `rewardMultiplier`. Kein three/react/zustand.
- Roadless-Fallback (frühe Stadt) auf bestrafte Luftlinie — nie ein Crash.

### Bestehende Codex-Arbeit weiterverwendet
- `ActivityRoutePlanner.tsx` (Codex-UI) NICHT ersetzt, nur minimal angebunden:
  Kennzahlen und Segment-Verkehrsfarben kommen jetzt aus dem Controller-Helper;
  Rendering, Layout und Interaktion bleiben unverändert. Die alte Schätzung
  bleibt ausschließlich als Fallback ohne Straßenverbindung erhalten.

### Neue Controller-Commands / Read-Helper
- `GameController.analyseActivityRoute(defId, orderedTargetIds): RouteAnalysis | undefined`
  (reine Read-Projektion; Quelle = Quellgebäude der Aktivität, sonst Rathaus).
- Command-Grenze `startActivity`/`setActiveActivityRoute` unverändert.

### Config-Änderungen
- Keine.

### Save-/Migrationsauswirkung
- Keine. Analyse wird live berechnet, nichts persistiert. Save-Schema bleibt **v11**.

### Codex muss visuell noch ergänzen
- Optional: geplante Route auf der 2D-Karte am echten Straßenpfad
  (`RouteSegment.path`) statt der synthetischen L-Polyline zeichnen. Daten liegen
  jetzt in `analysis.segments[].path` bereit.

### Tests
- `tests/routeAnalysis.test.ts` (9): Determinismus, echter Straßenpfad vs.
  Luftlinien-Fallback, schlechtere Stoppreihenfolge → geringere Effizienz,
  Verkehrslast/Fahrzeit, gedeckelter `rewardMultiplier`, Controller-Integration.
- Gesamt grün: `tsc` · `eslint` · `vitest` (27 Dateien / 196 Tests) · `build`.
  Browser-Smoke des Planers steht aus (Screenshot-Schnittstelle extern blockiert,
  wie in `PROJECT_STATE.md` vermerkt).

## 2026-07-19 — Codex — Premium-Fidelity-Pass v0.62

### Änderung

- Zwei neue Referenz-Mockups gegen v0.61 vermessen und die größten
  Desktop-Abweichungen behoben.
- Bau-Shop ab 1680×860 als vollhohes rechtes 4-Spalten-Dock umgesetzt; bei
  kleineren Ansichten bleibt das untere Layout.
- Gebäude-Art um `stage` erweitert und Stufenstreifen in Katalogvorschau und
  Gebäude-Sheet ergänzt. Vorschau bleibt UI-only.
- Wetter-/Tageszeit-Sheet mit KI-Panorama sowie klaren Sonne-, Regen- und
  Nebel-Presets eingebaut.
- `SkyEnvironment` um visuelle Wettergradings und einen Ein-Draw-Call-
  Regenvorhang erweitert.
- Fruchtland- und Küsten-Heros generiert; Regionsdialog wählt nun nach Biomgruppe.
- Kompakten Stadtstatus auf fünf stabile Zeilen gebracht; gesperrte Bedarfe
  zeigen echte Level-Gates.
- `waterfall_cliff`/`waterfall_small` zentral registriert und einen auf vier
  Exemplare gedeckelten prozeduralen Fallback gebaut.

### Architektur

- Keine Änderung unter `src/game/**`; Save-Schema bleibt v11.
- Wetter liegt in `cmb.environment` und ist nur Renderer-Präsentation.
- `BuildingArt(stage)` verwendet `buildingModel(id, stage)` und damit dieselbe
  Drop-in-Kette wie die Welt.
- Modell-READMEs/PROMPTS wurden aus `modelManifest.ts` regeneriert.
- Fehlende KI-Bilder/GLBs bleiben vollständig fallbackfähig.

### Live-Abnahme

- Echte Browser-Innenfläche: 1920×1080.
- Top-HUD: 1920×70; Hauptbereich: 1920×1010.
- Wetter-Sheet: 650×990, Hero 622×252; keine Boot-Fehler.
- Interaktion „Sommerregen“ aktualisiert Panel und HUD korrekt auf „Regen“.
- Bau-Shop: 820×990, Inhaltsfläche 796×861, vier Spalten,
  Vorschau 796×270; Anliegen-Dock korrekt ausgeblendet.
- Stadtstatus: 276×398 mit fünf stabilen Zeilen.
- Screenshot-Capture: derselbe externe Timeout wie v0.61; daher keine
  erfundene visuelle Screenshot-Freigabe.

### Finale Prüfung

- `npx tsc -b --force`: grün.
- `npx eslint src tests`: grün.
- Modell-Doku-Synchronisation: 22/22 Tests grün.
- Vitest: 26/26 Testdateien, **187/187 Tests** grün.
- Produktions-Build: grün; nur bekannte Rollup-Warnung zum großen Haupt-Chunk.
- Tauri-Build: vor dem Rust-Schritt blockiert,
  `cargo metadata: program not found`; kein TypeScript-/Tauri-Codefehler
  gemeldet.

### Übergabe

Claude beginnt mit `CODEX_VISUAL_AUDIT.md` und `PROJECT_STATE.md`. Visuelles
Wetter ist fertig; es darf nicht als Gameplay-Wetter interpretiert werden.
Kanonisch offen bleiben ausschließlich die in `OPEN_TASKS.md` markierten
Gameplay-Datenquellen und die optionale Live-Modell-Vorschau.

## 2026-07-19 — Codex — Verbindlicher Mockup-Pass v0.61

### Änderung

- Bau-Shop, Gebäudedetail, Stadtstatus und Bürgeranliegen an den jüngsten
  verbindlichen Mockups ausgerichtet.
- Präsentations-Info-Layer mit sechs Filtern bis in die Three-Renderer-Brücke
  integriert; Marker priorisiert, geclustert und distanzbegrenzt.
- Minimap per Klick/Ziehen bedienbar gemacht und um echte Regionsangaben ergänzt.
- Welt um helle Bergstaffelung, Flachwasser, driftenden Nebel und instanzierte
  Biomdetails erweitert.
- Vier neue Rollenporträts und einen Hochland-Regionshero generiert, verkleinert,
  registriert und mit Fallbacks dokumentiert.
- Neues CSS-System in fünf geordnete Dateien aufgeteilt; bestehendes CSS bleibt
  als kompatible Basis erhalten.

### Architektur

- Keine Änderung unter `src/game/**`; Save-Schema bleibt v11.
- `infoLayerMode` ist lokaler UI-Zustand und wird nur über `MapApi` an den
  Renderer gereicht.
- Empfehlungen, Marker und Standorttexte lesen ausschließlich Config,
  Snapshot, Diagnosen und bestehende Controller-Ableitungen.
- Noch fehlende kanonische Karten-/Regionsdaten sind mit
  `TODO(CLAUDE_LOGIC)` markiert und nicht vorgetäuscht.

### Prüfung

- TypeScript: grün.
- ESLint: grün.
- Browser-DOM-Smoke 1280×720: keine Dokument-Scrollfläche, keine Hauptfläche
  offscreen, Bau-Shop/Inbox/Status vollständig im Viewport.
- Info-Layer-Interaktion: „Bedürfnisse“ setzt `aria-pressed=true`.
- Browser-Konsole: keine Fehler oder Warnungen.
- Screenshot-Capture des eingebauten Browsers: Infrastrukturfehler auch auf
  leerer Seite; deshalb keine erfundene Bildfreigabe.
- Vitest: 26 Testdateien / 185 Tests grün.
- Produktions-Build: grün; nur bekannte Rollup-Warnung zum großen Haupt-Chunk.
- Tauri-Build: Frontend nicht erneut erreicht, weil auf diesem Windows-System
  `cargo` nicht installiert/im PATH ist (`cargo metadata: program not found`).
  Das ist eine lokale Toolchain-Sperre, kein gemeldeter TypeScript-/Tauri-Codefehler.

### Übergabe

Claude liest zuerst `CODEX_VISUAL_AUDIT.md`, danach `OPEN_TASKS.md`. Die beiden
markierten Datenlücken sind die einzigen Stellen, an denen neue Gameplay-Daten
benötigt werden; UI und Renderer sollen nicht nochmals parallel aufgebaut werden.

## 2026-07-19 — Codex — UI-/Welt-Overhaul v0.60

### Änderung

- Vier Mockup-Referenzen in eine gemeinsame UI-Architektur übertragen.
- Top-HUD, linke Navigation, Live-Minimap, Bürgerdetail, Regions-Hero,
  Gebäudefenster und Stadtarbeit-Routenplaner umgesetzt.
- Welt visuell mit Ozean-/Küstenpolish, Wolkennebel, Vegetationsclustern und
  Landmarken aufgewertet.
- KI-/generative Assets integriert und Drop-in-Fallbacks dokumentiert.
- Controller um RNG-neutrale Routenvorschau und validierte Zielreihenfolge
  erweitert; Save-Struktur unverändert.

### Architektur

- Keine UI-/Renderer-Imports in `src/game/**`.
- UI mutiert keinen GameState.
- Save-Schema bleibt v11.
- `TODO(CLAUDE_LOGIC)` markiert die noch geschätzten Verkehrsdaten.

### Prüfung

- TypeScript: grün.
- ESLint: grün.
- Vitest: 26 Testdateien / 185 Tests grün.
- Produktions-Build: grün; erwartete Chunk-Größenwarnung.
- Browser-Smoke 1280×720 und 1920×1080 grün.
- Ein-Sheet-Test: Bürgerdetail schließt beim Öffnen des Gebäudekatalogs.
- Browser-Konsole: keine Fehler oder Warnungen.

### Übergabe

Claude beginnt mit `PROJECT_STATE.md`, `OWNERSHIP.md` und `OPEN_TASKS.md`.
Keine Verkehrs- oder Zeitlogik aus den UI-Schätzwerten ableiten; zuerst eine
reine, getestete Datenquelle hinter dem Controller definieren.
