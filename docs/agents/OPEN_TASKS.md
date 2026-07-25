> **Themen­sortierter Gesamtüberblick: [`BACKLOG.md`](BACKLOG.md)** — jeder offene
> Auftrag genau einmal, nach Thema (Straßen, Stadtarbeit, Betriebe, Bauen/Kamera,
> Welt/Grafik, Häfen …). Diese Datei hier bleibt die auftrags-/phasenbezogene Detailsicht.

# Offene Aufgaben nach v0.82

## AKTIVER AUFTRAG: § Spielbarkeit 9.1 — Stadtarbeit/Zeit/Frühlogistik/Anlegernetz/Perf (P0)

> **Vorgezogen auf ausdrücklichen Nutzerwunsch (24.07.2026):** „Ich teste im Moment
> das Spielerlebnis, deshalb folgende Sachen vorziehen, sodass das Game und
> Fortschritt spielbarer wird." Entscheid **D-037**. Steht **vor** Infrastruktur-2.0
> I3–I5 — die Anlegernetz-Arbeit I3/I4 („voll ausgebaut") ist jetzt **Phase P-D**.

**Phasen (Reihenfolge = Umsetzung, jede ein testbarer Meilenstein):**
- ✅ **P-A Stadtarbeit-Stabilität** (v0.87, Save v21): eingefrorener, deterministischer
  Planungssnapshot `activities.selection`. Ursache war das Neuwürfeln der Ziele aus der
  pro Tick weiterlaufenden Sim-RNG. Fix: `pickTargetsSeeded`/`activitySelectionSeed`
  (stabiler Seed, nie `rngSeed`); Commands `selectActivity`/`refreshActivitySelection`/
  `clearActivitySelection`; Read `getActivitySelectionStatus`; **keine** Auto-
  Zielersetzung, `stale`-Hinweis stattdessen. 10 Tests (`activityStability.test.ts`).
  Audit: `ACTIVITY_STABILITY_AUDIT.md`.
- 🟡 **P-B Zentrale Ingame-Zeit** — teilweise:
  - ✅ **P-B1** (v0.88): kanonisches `src/game/time/gameTime.ts`
    (`SIM_MS_PER_GAME_MINUTE = 10_000`) + Read `getGameClock()`; HUD-Uhr ist reine
    Projektion der Simulationszeit (Tag N · HH:MM · Jahreszeit · Pausiert), kein
    `setInterval` in React; 1×/2×/4× + Pause konsistent (Simulation war schon
    korrekt — nur die Anzeige war entkoppelt). 7 Tests (`gameTime.test.ts`). Doku:
    `INGAME_TIME_SYSTEM.md`, **D-038**. Sonne/Himmel bleibt vorerst kosmetisch
    getrennt (dokumentiert offen, „slaven" auf Wunsch).
  - ❌ **P-B2**: Bau-/Upgrade-/Arbeits-/Transport-/Missionsdauern in **Ingame-Minuten**
    ausdrücken (über `gameMinutesToSimMs`) + Countdown-Anzeigen in Ingame-Zeit, dann
    **neu balancieren** (§9). Balancing-Tests anpassen. Doku: `TIMED_PROCESS_MIGRATION.md`.
- ✅ **P-C Frühlogistik + Lagerübersicht** (v0.91): **Handkarren** (`handcart`,
  unlockLevel 2) im bestehenden Fahrzeugkatalog schließt die Lücke Sägewerk→Rathaus vor
  dem Lieferwagen (L4); Kapazität 40, 0 Betriebskosten. Bestand nach Standort direkt im
  Ressourcen-Popover (verfügbar/in Betrieben/unterwegs/reserviert); volle Standortliste
  bleibt im `ResourceNetworkPanel`. Additiv, keine Save-Änderung. 4 Tests
  (`earlyLogistics.test.ts`). Doku: `EARLY_LOGISTICS.md`. Offen: echtes Handkarren-
  Modell, weitere Frühstufen, §9-Feintuning.
- 🟡 **P-D Anleger-zu-Anleger-Netz (= Infrastruktur 2.0 I3/I4, voll ausgebaut)**:
  - ✅ **Straßenstart am isolierten Anleger** (v0.92, §11.2): `waterfront`-Gebäude sind
    Saatpunkte desselben Straßengraphen (`roadWouldConnect` + `computeRoadNetwork`) →
    lokales, erweiterbares Straßennetz hinter Wasser; kein zweiter Graph; keine
    Save-Änderung. 3 Tests (`harborNetwork.test.ts`).
  - ❌ **I4 „voll ausgebaut"**: persistente Schiffsrouten Anleger↔Anleger (Kapazität,
    Reisezeit, Betriebskosten, Warenfluss, Pause/Löschen) mit **linearer Save-Migration**;
    Anleger-Netzknoten-Panel; multimodale Stadtarbeit. Bausteine vorhanden
    (`waterNavigation.ts`, `buildingInfrastructure.ts`, `operations/transport.ts`). Eigener
    Meilenstein. Doku: `HARBOR_INFRASTRUCTURE_GRAPH.md`.
- 🟡 **P-E Performance-Pass + FPS-Anzeige**:
  - ✅ **FPS-Anzeige** (v0.90): dauerhaft neben der Uhr, gedrosselt (~alle 500 ms via
    `fpsMeter` + `useSyncExternalStore`), farbcodiert; kein React-Update pro Frame.
  - ✅ **Report + Analyse** (v0.93, `PERFORMANCE_PASS_REPORT.md`): Infrastrukturgraph ist
    **bereits** event-getrieben (nicht pro Render — §15.5 erfüllt); Activity-Regen durch
    P-A beseitigt; Hotspot-Analyse + Mess-Protokoll (im Spiel mit der FPS-Anzeige zu
    füllen — kein Browser-Profiler in der Cloud, keine erfundenen Zahlen).
  - ❌ **Live-Profiling** (im Spiel) + daraus gezielte Optimierungen; Feinschliff einzelner
    Planer-Reads (Memoisierung); optional Draw-Calls im FPS-Tooltip.

**Nicht vortäuschen:** fehlende Schiffs-Legs/Kapazitäts-/Verkehrs-/Netzlastdaten sind
`TODO(CLAUDE_LOGIC)`. Keine zweite Zeit-, Verkehrs- oder Missionssimulation.

## Infrastruktur 2.0 — Höhenstraßen, Brücken, Schifffahrt (P0, I3–I5 pausiert für Spielbarkeit)

> **Vorgezogen auf ausdrücklichen Nutzerwunsch (24.07.2026):** „Schiebe R2 und Rest
> erstmal nach hinten … beginne mit dem neuen Auftrag Infrastruktur 2.0 … das ist
> ein entscheidender Punkt, sodass ich das Spiel weiter testen kann, sonst komme ich
> auf der Spielwelt nicht weiter." Master-Spec: `INFRASTRUCTURE_2_PLAN.md`.
> Architekturentscheid: **D-036**.

**Warum P0:** Nach der dritten Verdichtung (D-035) blockieren Höhen/Wasser die
Expansion — Straßen können heute nur ebenes Land bebauen. Höhenstraßen/Brücken sind
der Unblocker.

**Phasen (Reihenfolge = Umsetzung):**
- ✅ **I1 Höhenstraßen & automatische Brücken** (v0.84): Straßen-Bauklasse
  `RoadClassDef` (Wasser/Klippe/Steigung queren), Def `road_elevated`,
  `validatePlacement`/`analyseRoadPath`/`roadPathPreview` je Straßentyp, Brückendeck+
  Pfeiler im Renderer. Additiv (kein Save-Bump).
  - ✅ **I1-Testfixes (v0.85):** Planer-Kosten zeigen **alle** Materialien inkl. Holz +
    konkreten Fehlbetrag (nicht nur „Stadtbudget", §18.3); isoliertes Ein-Kachel-
    „Braucht Anschluss…"-Banner beim Straßenplanen unterdrückt (Planer = alleinige
    Instanz). Zusätzlich **Steinbruch auf Fels bebaubar** (additiv
    `BuildingDef.buildsOnRock?: { maxSlope? }`, flache Felsschelfe; kein neues
    Platzierungssystem). Tests: `tests/quarryRock.test.ts`.
  - ⏳ Offen (I1-Verfeinerung, nicht vortäuschen): steinerne Prachtbrücken, echte
    Pfeilertiefe bis zum Wasserboden, Rampenlängen.
- ✅ **I2 Saubere Straßenstruktur** (v0.86): terrainbewusster Router
  `src/game/roads/roadRouting.ts` (gewichtetes deterministisches Dijkstra) verbindet
  **Kontrollpunkte** lückenlos über bebaubares Gelände (Bodenstraße meidet Wasser/
  Klippen, Höhenstraße überbrückt sie). Passierbarkeit = `validatePlacement`
  (`needs_road` passierbar), `analyseRoadPath` bleibt Wahrheit — **kein zweiter Graph
  (§2/§8)**. Vorschau grün/gelb/rot + Legende; **atomarer** `buildRoadPath`
  (alles-oder-nichts); `pushRoadPoint` statt `extendRoadDraft`. **Erledigt zugleich
  10.0-R6.** 6 neue Tests (`roadRouting.test.ts`). Save v20 additiv.
  - ⏳ Offen (I2-Verfeinerung, nicht vortäuschen): frei ziehbare Kontrollpunkt-Griffe,
    Live-Vorschau vom letzten Punkt zum Mauszeiger als Renderer-Layer, Kurven-/
    Diagonal-Snapping.
- 🟡 **I3 Küste/Ufer + Anleger als Netzknoten** (Straße↔Anleger↔Schiff):
  - ✅ **Netzknoten-Modell** (v0.96): `networkSegments.ts` zerlegt das **bestehende**
    `roadNetwork` in Teilnetze und benennt das Stadtnetz (`city`/`local`, deterministisch,
    in `computeDerived` statt pro Read); `harborNodes.ts` projiziert daraus je Anleger
    Landseite/Wasserseite/erreichbare Häfen und `linksToCityVia` (Eingabe für I4).
    Gebäudefenster zeigt die Landseite. Kein zweiter Graph, keine Save-Änderung.
    Kapazität/Reisezeit/Warenfluss bewusst offen (= I4). 8 Tests.
  - ❌ **R9 adaptive Uferplattform** (Renderer/Bake) — noch offen.
- ❌ **I4 Schifffahrtsnetz + Stadtarbeit-Integration** (persistente Routen: Kapazität,
  Reisezeit, Betriebskosten, Warenfluss, Pause/Löschen; multimodale Legs). Reuse
  `operations/transport.ts` + `logistics.ts` + `routeAnalysis.ts`. **Lineare Migration**
  bei neuen Save-Feldern. Verweise: `WATER_INFRASTRUCTURE_PLAN.md`, „Waterways 7.0".
- ❌ **I5 Bevölkerungs-Rebalancing + Infrastruktur-Netz-UI** (Haus 4–8 … Hochhaus 300+;
  Reiter Straßen/Brücken/Anleger/Schiffe + Kapazitäts-Panel via
  `infrastructureNetworkOverview`).

**Nicht vortäuschen:** fehlende Schiffs-Legs/Kapazitäts-/Verkehrsdaten sind
`TODO(CLAUDE_LOGIC)`. Kein zweiter Straßengraph/Transport.

## ZURÜCKGESTELLT (nach Infrastruktur 2.0 fortsetzen): § 10.0 R2–R5, R9

> Bleiben P0 **nach** Infrastruktur 2.0. Master-Spec: `ACTIVE_RESOURCE_LOOPS_10_PLAN.md`.
> R1/R7/R8 sind erledigt (D-035, v0.83). **R6 ist mit I2 erledigt (v0.86).** R9 wird
> in Infrastruktur 2.0 (I3) miterledigt.

- ❌ **R2** Dauerbetrieb: persistentes `workArea` (circle/rect/polygon) +
  `ContinuousOperationStatus`, Auto-Pause/Resume statt Auto-Delete (Save v20→v21 additiv).
- ❌ **R2/§5** passive `Holz/min` + `Produktion/min` aus der UI entfernen, Durchsatz-Diagnose.
- ❌ **R3** volle `ResourceNetworkSummary` + benannte Standorte + Lagervergleich.
- ❌ **R4** Handkarren/Handtragen als Frühtransport + Rathauslager + `InventoryTransferRule`.
- ❌ **R5** Stadtarbeit-Ladungsprognose je Stopp + Pflicht/Optional-Nachfüllmarker.
- ❌ **R10** Migration + Balancing-Abschluss.

## Visual Active Operations – verbleibende Daten-/Logikbindungen

**Erledigt (v0.82, visuell):** fokussierter Arbeitsgebietsmodus mit
terrainfolgendem Overlay und Einzelklick, Betriebs-Tabs, ehrliches lokales Lager,
Ressourcen-Netzwerkdrawer, Transportplanner, Cargo-Timeline, bestätigungspflichtiger
Straßenentwurf, adaptiver Waterfront-Ghost, zentrale `--ui-*`-Tokens, ViewModels,
Dev-Szenarien und vollständiger Handoff. Save bleibt v19.

**Offen – nicht in React lösen:**

- rollierender Betriebsdurchsatz als ReadModel (z. B. 10 Spielminuten),
- Handkarren als datengetriebene, Controller-validierte Transportmethode,
- physische Zwischenlager/Bestände und freie Zielkapazität je Gebäude,
- optionale Nachfüllquellen samt Umweg/Ladezeit,
- atomarer Straßenpfad-Command, Alternativroute, Kontrollpunkte, Steigung,
  Viadukt und Abrissdiagnose,
- wirtschaftliche Pfeilerhöhe/-kosten und Rampenlänge für Waterfront,
- Rechteck-/Polygon-Auswahl erst nach passendem UI-Entwurfsvertrag,
- Fäll-/Trag-Animationsclips und echtes Baum-Mesh-Raycast.

Verbindlicher Einstieg: `ACTIVE_OPERATIONS_VISUAL_HANDOFF.md`.

## § Change 9.0 — Central Start, Fog, Living World, Active Work (P0, in Arbeit)

Vorab-Audits (verbindlich): `CENTRAL_START_REGION_AUDIT.md`, `FOG_OF_WAR_AUDIT.md`,
`WORLD_RENDERING_PERFORMANCE_AUDIT.md`, `ACTIVE_RESOURCE_WORK_PLAN.md`.

**Erledigt (v0.80):** S1 zentraler Start (Bake-Ziel 820→1.400, neu gebacken),
S2 Regionsbalancing (Forst-Ids rotiert, L3-Wahl {7,12}, Save v19-Weltumbau). D-033.

**Erledigt (v0.81):** S3 Fog of War — globale absolute Nebelhöhe (`worldFogTopY`),
weiche zusammenhängende Front via `alphaHash` statt Kapseln, **Kamera-Clamping**
(neu: `CameraExplorationBoundary` + `clampTarget`), getrennter Dev-Cheat
`cameraBoundsDisabled`, Unlock-Retract verifiziert (Fog-Fade nie neu erzeugt).
346 Tests, 3D-Smoke grün. D-034.

**Startregion-Check (Mockup 10, verifiziert):** Zentralland trägt **409 Waldkacheln**
(nächster Wald 5 Kacheln vom Rathaus, 194 in einem Sägewerk-Radius) → Sägewerk ab
L2 ohne Expansion nutzbar; Berg/Wasser/Fruchtland im Umkreis; Unlock-Ring {7,12}
(L3-Gratis) → coastal → Hafen. „Ausreichend props/ressourcen/sektoren" erfüllt.

**Offen (Reihenfolge §24):**
- **S4 Vegetations-Performance** — Kachel-Chunking, LOD-Anwendung pro Chunk, HLOD-
  Waldcluster, Impostoren, Shader-Wind, Waldboden-Schattenmaske, Panel erweitern.
  **Enthält den inkrementellen Deko-/Vegetations-Neuaufbau bei Unlock (aus S3d).**
- **S5 lebendige Welt** — Waldstruktur, Mammutbäume (`giant_pine_*`/`ancient_tree_*`
  drop-in), Unterholz, Tierhabitate.
- **S6 Sägewerk-Arbeitsmodus:** Visual/UI v0.82 erledigt (terrainfolgende Fläche,
  Kreisradius, Einzelknoten-Klick, Effizienz/Tooltip, Bestätigung). Offen bleiben
  echtes Baum-Mesh-Raycast, Rechteck/Polygon und Fäll-/Trag-Animationen.
- **S7 Steinbruch/Farm** — Knoten-Generalisierung tree→rock→crop, Feld-Lebenszyklus.
- **S8 Feuerwehr/Wasser/Bauhof/Lagerhaus** — gemeinsames Operation-Framework.

---

# Offene Aufgaben nach v0.78 (Active Operations 2.0)

## Active Operations 2.0 — Weiterbau nach dem Sägewerk-Referenzschnitt (P0)

Verbindlicher Einstieg: `ACTIVE_OPERATIONS_PLAN.md` (+ RESOURCE_NODE_/
LOCAL_INVENTORY_/WORKER_OPERATION_/LOGISTICS_INTEGRATION-Docs).

**Erledigt (v0.78, Referenzschnitt Sägewerk):** lokale Betriebslager,
Ressourcenknoten (Bäume, deterministisch + Deltas), Arbeiter-Zustandsmaschine
(laufen/fällen/tragen/einlagern), Voll-Stopp, Regeneration, Commands + Read-Helper,
Save v17, Gebäudefenster-Betriebsbereich, additive Renderer-Arbeiter, 9 Tests.

**Erledigt (v0.79, Phase A5 Transport):** manueller Lagertransport ins
Zentrallager (`createInventoryTransfer`/`cancelInventoryTransfer`), Ziel-/
Vorschau-/Netzwerk-Read-Helper (`getInventoryNetworkOverview` = global/lokal/
reserviert/unterwegs, §7.2), Zustandsmaschine `loading→in_transit→unloading→
delivered` im Live-Tick, Reservierung + globale Einlagerung (gedeckelt, kein
Doppelzählen), Save v18 + Migration `v17→v18`, Transport-UI im Gebäudefenster,
additive gepoolte 3D-Fahrzeuge, 8 Tests. Wiederverwendet `routeAnalysis.ts` +
`logistics.ts` (kein zweites System, §8).

**Erledigt (v0.79, A5-Reste):** Mehrfachladungen/Nachfüllfahrten (Fahrzeug
pendelt), Rückruf jederzeit (verladene Ladung kehrt zurück),
Transport-Betriebskosten je Fahrt (Geldsenke). +4 Tests.

**Offen — bewusst NICHT vorgetäuscht in der UI:**

- **A5-Reste (Rest):** Zwischenlager-Lagerhäuser als eigene lokale Puffer
  (aktuell globaler Pool über ein Lagergebäude als Anlieferpunkt),
  Kraftstoff/Fahrzeugzustand.
- **A6 Steinbruch** (nächster großer Schritt): braucht die Generalisierung von
  `operations/nodes.ts` (aktuell nur `tree`/Holz) auf `rock`/Stein und eine
  **Migration der Passiv-Produktionstests** (simulation/systems/upgrade) auf einen
  dauerhaft passiven Produzenten — der Steinbruch ist heute deren Baseline, und
  der „Standort-Bonus"-Test ist steinspezifisch (Stein +Bonus auf Gebirge).
- **A7 Farm / A8 Feuerwehr-Dispatch:** weitere `operation`-Profile
  bzw. Einsatzsystem über dasselbe Framework — keine Parallel-Simulation.
- **A9 Regeneration-Ausbau:** Aufforstung/Setzlinge, `RegenerationProfile`,
  geologische neue Vorkommen statt fester Nachwachszeit.
- **A10 Automatisierung:** Vorarbeiter, wiederholbare Arbeitszonen, Lagerregeln,
  wiederkehrende Transporte (verbrauchen weiter Fahrzeuge/Arbeiter/Zeit).
- **Renderer-Reste:** echtes Baum-Mesh-Raycast und Fäll-/Trag-Animationen.
  Tilegenaue Einzelknoten-Auswahl sowie Hervorhebung verfügbar/reserviert/
  ungültig sind seit v0.82 vorhanden; Arbeiter bleiben gepoolte Figuren.

## Vegetations-Performance — Ausbaustufe 2 (P0)

Vollständige Beschreibung + Statusabgrenzung: `WORLD_PERFORMANCE_AUDIT.md`.
**Kernregel:** Die logische und visuelle Vegetationsdichte bleibt hoch — nur die
technische Repräsentation wird mit zunehmender Entfernung vereinfacht. Keine
Optimierung allein aus subjektivem Eindruck; über das Dev-Performance-Panel messen.

**Erledigt (v0.77):** Instancing je Proptyp, Pro-Region-Budgets, vier
Qualitätsstufen + Dichteskalierung, striktes Schattenbudget, Nahdetail-/
Auflösungs-/Tierbudget je Stufe, Dev-Performance-Panel, kein Weltneuaufbau bei
Qualitätswechsel, Nebel-Cheat erzwingt keine Maximalqualität, reine
`vegetationLodTier`-Funktion (4 Stufen).

**Noch offen (nur auf Zielhardware seriös messbar):**

1. **HLOD-Waldcluster**: ferne Regionen zu einem Cluster-Mesh je Biom verschmelzen.
2. **Impostor-Billboards** jenseits von `lodDistances[1]` (Profile mit `impostorsEnabled`).
3. **Chunk-Streaming** je Kachel-Chunk mit Distanz-Cull über `vegetationViewDistance`.
4. **Shader-Wind** statt CPU-Animation; **Material-/Textur-Atlas-Merging**.
5. **Waldboden-Schattenmaske** statt Einzelschatten in dichten Beständen.
6. Zielwerte an echter Hardware verifizieren: Stadt 60 FPS, Region 50–60, volle
   Insel 40–60.

## Core Gameplay Overhaul 8.0 — nächste Phase (P1)

Vollständige Beschreibung: `CORE_GAMEPLAY_OVERHAUL_PLAN.md`. Ursachen und
Dateistellen: `CORE_GAMEPLAY_OVERHAUL_AUDIT.md`.

### G2 — Bauen, Verschieben, Kamera. Reihenfolge ist zwingend.

1. ✅ **ERLEDIGT (v0.94) — Terrain-Picking gegen das Höhenfeld (Audit §2.1).**
   `groundPointAt` marschiert den Cursor-Strahl jetzt per reinem, unit-getestetem
   Helfer `src/renderer/three/terrainPicking.ts` (`raycastHeightfield`,
   Bracketing + binäre Verfeinerung) gegen `terrainHeightAt` (einzige Bodenhöhen-
   quelle) statt gegen die y=0-Ebene; Suchband aus `TERRAIN_MIN_Y`/`TERRAIN_MAX_Y`.
   Korrigiert in einem Zug `pickTileAt`, `updateGhostAt`, `paint`, `selectAt` und
   den Cursor-Zoom (`CameraInputController.onWheel` → `groundAt`); Ebenen-Fallback
   für Himmel-/Horizontklicks. 6 Tests (`terrainPicking.test.ts`). Keine Save-Änderung.
2. ✅ **ERLEDIGT (v0.95) — Kamera im Baumodus (Audit §2.2).** Belegung §10.3 über
   eine reine, unit-getestete Stelle `src/renderer/three/cameraInputMapping.ts`
   (`deriveDragMode`/`deriveClickAction`): Mitteltaste schwenkt, Rechts-Zug dreht,
   Rechts-Klick bricht ab, `Strg`+Linkszug dreht (auch beim Platzieren) — der
   Bauentwurf überlebt jede Kamerabewegung (Zug ↔ Klick strikt getrennt). Der
   `CameraInputController` nutzt nur noch diese Funktionen; kein neues Eingabesystem,
   keine Save-Änderung. 6 Tests (`camera.test.ts`).
3. Echter GLB-Ghost inkl. Rotation, Sockel, Anschlusspunkt und Radius;
   `placementDiagnostics` nutzen.
4. Verschieben als Entwurf: Ghost an der Zielposition, Ursprung markiert,
   Abbruch ohne Wirkung, Bestätigung = genau ein Command.
5. Wirkungsradien terrainfolgend projizieren (`getCoverageOverlay`).
6. Straßenbau als Planen → Vorschau → Bestätigen → Command.

**Nach Schritt 1 erneut prüfen:** Die abgelehnten Anleger-Plätze (§14) sind
sehr wahrscheinlich eine Folge des Picking-Fehlers — Land-/Wasser-Footprint,
Küstensnapping und Tiefenprüfung existieren bereits. Erst wenn die Ablehnung
mit korrektem Picking bestehen bleibt, an der Validierung ansetzen.

### G1-Reste

- `RouteTrafficForecast.criticalSegments` auf der Planungskarte markieren
  (`ManualRouteMap.tsx`) — die Daten liegen bereits an.
- Instanzzahl, Draw-Calls und VRAM der neuen regionsweisen Prop-Budgets beim
  Vollinsel-Reveal auf Zielhardware messen; `REGION_PROP_BUDGET` nur anhand
  dieser Messung ändern.
- Wolkenwand gesperrter Regionen zerfällt im 1920×1080-Screenshot sichtbar in
  einzelne weiße Kapseln (§24). Rein visuell, keine Save-Wirkung — guter
  Einstieg für Phase G3.

### Später (G3–G8)

Weltmaßstab und Regionszahl (§17/§18) erst nach Klärung, ob „zu groß" die
Fläche oder die Regionsanzahl meint — die Insel wurde in 6.1 bereits um 20 %
verdichtet. Bevölkerungsmodell (§20/§21) braucht eine lineare Migration
v15→v16. Lieferketten (§7) und aktive Minispiele (§8) folgen danach.

## Waterways, Harbors & Infrastructure 7.0 — TODO(CLAUDE_LOGIC)

- Persistente Schifffahrtsrouten mit Commands, Schiffszuteilung, Kapazität,
  Reisezeit, Betriebskosten, Warenfluss und Pausen-/Löschlogik an die bestehende
  Simulation anbinden. Bei neuen Save-Feldern v15 linear migrieren.
- Hafenbetrieb um Arbeitskräfte, Energie, lokales Lager, Umschlag sowie
  Straßen-Vor- und Nachlauf erweitern. `water_only` darf nicht automatisch eine
  Region versorgen.
- Remote Construction über zwei Häfen, reservierte Baumaterialien und
  Lieferleistung als kanonischen Ökonomiepfad modellieren.
- Brückenprofile mit Durchfahrtshöhe, Kanalbreite und Schiffsklassen ergänzen;
  Brückenentwürfe gegen bestehende Wassergraph-Kanten prüfen und warnen.
- Multimodale Stadtarbeits-Legs (`road → harbor → water → harbor → road`) in
  die vorhandene Aktivität integrieren, keine zweite Missions-State-Machine.
- `trade_harbor`, `ferry_terminal`, `fishing_harbor` und `shipyard` erst nach
  Config-/Balancingentscheidung aktivieren. Die Assetverträge sind bereits in
  `HARBOR_SYSTEM_PLAN.md` dokumentiert.
- Zielhardware-Abnahme für radialen Ozean, Ferninseln, Vollinsel-Reveal,
  Wassergraph-Overlay und Hafenfallbacks; Draw-Calls und VRAM messen.

## Terrain & World Scale 6.1 — bewusst offen

- Alte Source `reference/stylized island map 3d model.glb` erst nach einem
  sauberen Git-Sicherungspunkt nach `reference/legacy-world/` archivieren oder
  entfernen. Sie wird bereits von keinem aktiven Pfad gelesen.
- Automatisierten Regionsbild-Batchrenderer mit festen 3D-Kamerapresets
  ergänzen. Aktuell bleiben reale Weltansichten/generische Heroes der ehrliche
  Fallback; keine erfundenen Landschaftsbilder.
- Getrennte Landmassen erst durch echte Fähren-/Schifffahrtsprogression
  erschließen. Hafen- und Wasserwegkandidaten sind vorhanden;
  `TODO(CLAUDE_LOGIC)`.
- Brücken, Viadukte und Tunnel als Erweiterung des bestehenden Straßensystems
  implementieren: Kosten, Freigaben, Rampen, Pfeiler, Portale und Navigation.
- Weitere PBR-Kanäle nur nach Texturspeicher-/Zielhardwaremessung aktivieren;
  die 6.1-Kernsets für Granit, Wiese, Wald und Ufer sind vorhanden.
- Auf Windows-Zielhardware Vollinsel-FPS, Draw-Calls, Texturspeicher und den
  Reveal-All-Test messen; Qualitätscaps nur anhand dieser Messung ändern.

## Map Redesign 5.0 — nächster Produktionspass

### P0 — visuelle Zielhardware-Abnahme

- Referenz-Screenshots für Gebirge, Gras/Wald, Küste/Wasser, Wüste/Sumpf sowie
  Morgen, Nebel und Nacht bei 1920×1080 archivieren und mit den Mockups prüfen.
- Die v0.71-Wolkenwand in Vollinsel-, Schräg- und Nahansicht sowie die
  Schloss-/Level-Marker auf Welt und Minimap gegen das Nebel-Mockup abnehmen.
- Auf Windows-Zielhardware FPS, Draw-Calls, Dreiecke und Texturspeicher in
  Stadt- und Vollinselansicht messen; dabei die maximal 168 Wolkeninstanzen und
  Canvas-Texturen je gesperrter Region separat prüfen. Caps nur datenbasiert
  verändern.

### P1 — Drop-ins und Zielhardware

- Weitere Schnee-/Wüsten-/Moor-PBR-Sets erst ergänzen, wenn die derzeit
  selektiv geladenen Normal-/Roughness-/AO-Maps auf Zielhardware vermessen sind.
- Optimierte GLBs aus `WORLD_ASSET_MANIFEST.md` einlegen: Felsbogen, Urbaum,
  Ruine, Wüstenfelsnadel, Sumpfbaum, Seeinsel, Schilf, Totholz, Felscluster.
- Küstenspray, Caustics und eigene ruhige Seevariation nur im bestehenden
  Wasserpfad ergänzen, nicht als zweite Wasserpipeline.

### P1 — TODO(CLAUDE_LOGIC)

- Entscheiden, ob Morgenküste und Westbucht spielmechanisch Wüste/Sumpf werden.
  Erst dann Biome/Modifikatoren in validierter Config ändern, Balancing testen
  und bei persistierten Feldern die lineare Save-Migration ergänzen.
- Keine visuellen Profilwerte als Gameplay-Daten auslesen.

## Stadtarbeit Redesign 4.0 — erledigt

- ✅ gemeinsames Zeichnen/Pan/Zoom ohne Werkzeugmodus
- ✅ automatischer Fit und großer Zoomumfang
- ✅ „Letzte Route“, Planname und lokale Routenvorlage entfernt
- ✅ Reihenfolge aus dem exakten Weg statt Drag-&-Drop-Liste
- ✅ Live-Tour, Cargo, Nachfüllstopps, Leerfahrt und Infrastrukturberater
- ✅ kompakte Fahrzeugkarten und Missionen mit Bildern/Tags/Filtern
- ✅ 20 transparente KI-Assets plus Drop-in-Dokumentation
- ✅ neue Controller-Read-Modelle, reine Route-/Cargo-Helfer und Tests
- ✅ Save bleibt v13

## P1 — TODO(CLAUDE_LOGIC): nächste kanonische Logistikdaten

1. Quellenwahl: `sourceBuildingId` als validierter Planparameter/Command; heute
   ist die erste echte Quelle deterministischer Start.
2. Plan-Legs für Zwischenlager, Depot-Rückkehr, Rückwaren, optionale Ziele,
   Fahrzeugwechsel und mehrere Fahrzeuge. Benötigt werden Typ, Gebäude-ID,
   Pflichtstatus, Ladungsdelta und validierter Teilpfad.
3. `InfrastructureWarning.roadPoint` oder `.segmentId` für exakten
   Berater-Kartenfokus.
4. Gebäudeeigener Quellbestand und Ladeleistung nur als vollständiges
   Lager-/Warenflussmodell; nicht aus dem globalen Pool ableiten.
5. Adaptive Mengen (L5), Zwischenlager (L6), Bahn/Flug (L7) gemäß
   `CITYWORK_LOGIC_2_PLAN.md`.

## P1 — weitere echte Simulationsdaten

- Steigung/Höhenprofil aus Terrain-/Straßenprojektion.
- Straßenqualität/-zustand, Sperrungen und dynamischer Verkehr.
- Fahrzeugzustand, Kraftstoff und Schäden als zusammenhängende Phase.
- `rewardMultiplier` erst nach Wirtschaftstest an Auszahlung koppeln.
- 3D-Ausführung um sichtbare Quellhalte/Nachlade-/Rückfahrt-Etappen erweitern;
  Planungsdaten liegen bereits in Cargo-Plan/-Route.

## P1/P2 — Welt und Systeme

- Echter GLB-Ghost für Platzieren/Verschieben; `placementDiagnostics` nutzen.
- Wirkungsradien auf Gelände projizieren; `getCoverageOverlay` nutzen.
- Straßenbau vollständig als Planen → Vorschau → Bestätigen → Command.
- Lane-/Kreuzungsbelegung und Kollisionsvermeidung.
- Spielerisches Wetter nur mit klarer Simulationsentscheidung; v0.62-Presets
  bleiben rein visuell.
- Ausbauflächen erst mit Datenmodell, Bake und linearer Migration.

## Nicht tun

- Keine zweite Karte, Verkehrs- oder Aktivitätssimulation.
- Keine automatische Wegergänzung zwischen manuellen Routenklicks.
- Keine direkte State-Mutation aus React.
- Keine erfundenen Lager-, Straßen-, Wetter- oder Routendaten in der UI.
- Keine neuen Modellnamen außerhalb des Manifests.
- Keine Save-Änderung ohne lineare Migration.

Offen bleibt außerdem der native Tauri-Build, falls lokal keine Rust-/Cargo-
Toolchain vorhanden ist. Screenshotstatus und genaue Prüfergebnisse stehen im
jüngsten `HANDOFF_LOG.md`.
