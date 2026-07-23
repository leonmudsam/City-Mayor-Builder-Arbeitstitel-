# Offene Aufgaben nach v0.80

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
- **S6 Sägewerk-Arbeitsmodus** — 3D-Kreiswerkzeug, Einzelbaum-Raycast, Effizienz-
  Overlay (§17), Bedienung (§18), Fäll-/Trag-Animationen (baut auf A1–A5 auf).
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
- **Renderer:** 3D-Einzelbaum-Raycast im Arbeitsmodus (einzelne Bäume anklicken),
  Fäll-/Trag-Animationen, Hervorhebung reservierter/erschöpfter Knoten. Aktuell:
  Arbeitsgebiet-Auswahl über das Gebäudefenster; Arbeiter als gepoolte Figuren.

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

1. **Terrain-Picking zuerst (Audit §2.1).** `groundPointAt` raycastet gegen eine
   unsichtbare flache Ebene bei y = 0 (`ThreeMapRenderer.ts:514–520`) statt
   gegen das Höhenfeld. Auf erhöhtem Gelände liegt die getroffene Kachel um
   ungefähr `Höhe / tan(Kamerawinkel)` daneben. Fix: Schrittsuche entlang des
   Strahls gegen `terrainHeightAt` plus binäre Verfeinerung — `terrainHeightAt`
   bleibt die einzige Bodenhöhenquelle. Betrifft auch `pickTileAt`,
   `updateGhostAt`, `paint` und `CameraInputController.onWheel`.
2. **Kamera im Baumodus (Audit §2.2).** In `CameraInputController.onPointerDown`
   belegt LMB beim Platzieren den `build`-Modus und RMB ist fest `cancel` —
   Schwenken und Drehen sind praktisch unmöglich. Belegung gemäß §10.3 neu
   ordnen, ohne den Bauentwurf zu verlieren.
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
