> **Themen­sortierter Gesamtüberblick: [`BACKLOG.md`](BACKLOG.md)** — jeder offene
> Auftrag genau einmal, nach Thema (Straßen, Stadtarbeit, Betriebe, Bauen/Kamera,
> Welt/Grafik, Häfen …). Diese Datei hier bleibt die auftrags-/phasenbezogene Detailsicht.

# Offene Aufgaben nach v1.40

## Auftrag „Stadtarbeit 3.0 — Open-World-Aufträge" (v1.40, A1–A6 erledigt)

Ist-Zustand, Architektur, Messwerte: **`CITYWORK_OPEN_WORLD_OVERHAUL.md`**
(verbindlicher Einstieg vor jeder Arbeit an Stadtarbeit, Missionen oder Fahren).

Erledigt: A1 Einsatz erreichbar · A2 freie Reihenfolge in 3D (D-070) ·
A3 Einsatzkamera · A4 Kreuzungsanzeige · A5 Aktion am Ort · A6 Halte
(abgeleitet, keine Migration) · A7 Einsatz-HUD samt Zurücktreten des Stadt-HUD.

Offen:

* **A7, zweiter Teil — das Planer-Layout nach den Mockups.** Die Fahranteile
  sind raus (`ManualRouteMap` 1.764 → 1.290 Zeilen), das Layout steht aus.
* **A8 — weitere Missionstypen.** Der Auftrag verlangt mindestens acht; die
  Config kennt `delivery`/`inspection`/`decision`. Es fehlen Baustelle,
  Produktion, Lager-zu-Lager und der Hafen als Etappe.
* **A9 — kleine aktive Ereignisse** unterwegs.
* **A10 — gefahrene Route speichern und automatisieren.** Erst danach ist
  D-039 („aus manuellem Spiel wächst Automatisierung") wirklich eingelöst.
* **Häfen als Netzknoten der Stadtarbeit** — unverändert offen.
* **§5 Quicktime-Events** — bewusst zurückgestellt.


## Auftrag „Wirtschafts- und Lieferketten-Overhaul" (v1.39, ABGESCHLOSSEN)

Ist-Zustand, Architektur und Balancing:
**`SUPPLY_CHAIN_EXPANSION_PLAN.md`** (verbindlicher Einstieg).

Alle elf Punkte sind umgesetzt (§1 Steingrube · §2 Felder · §3 Bretter/Werkstein ·
§4 Werkstätten · §5 Lieferketten · §6 Level 5 · §7 Upgrades · §8 UI · §9 Assets ·
§10 Simulation · §11 Doku). Was bewusst offen bleibt:

* **Zwischenlager in der Lieferkette** (§5 „optional ein Zwischenlager"): Die
  Fahrt geht direkt von der gewählten Quelle zur Werkstatt. Ein Umweg über ein
  drittes Gebäude wäre echte Routenplanung — ein zweites System.
* **Intervall- und Ladungsregler** (§5): Die Automatik bestellt, wenn Platz ist,
  und lädt, was das Fahrzeug fasst. Ein Intervallregler wäre Bedienung ohne
  Entscheidung (D-039); die Frage „wie oft?" hat genau eine sinnvolle Antwort.
* **Arbeiterzuteilung an Werkstätten**: `workerSlots` ist eine Anzeige, der
  Durchsatz hängt allein an der Ausbaustufe. Echte Personalverteilung wäre ein
  eigenes System.
* **`field_farm_tile.glb`**: Prompt und Manifest stehen, das Modell ist nicht
  verdrahtet. Felder zeichnet `farmFieldMesh.ts` prozedural — nach D-044
  richtig (ein Natur-`.glb` wiegt ~29.000 Dreiecke, ein Feld ist Masse).
* **Feld-Balancing** (260 ⌀/Kachel, 1,4 ⌀/min) bleibt eine Setzung, keine
  Messung — unverändert seit D-059.
* **Bretter/Werkstein sind reine Baustoffe**: kein Bürgerbedarf, keine
  Handelsware. Wer sie zur Nachfrage macht, macht die Kette zur Pflicht — das
  ist eine Balancing-Entscheidung, keine technische.

## Auftrag „Stadtarbeit Overhaul — Logistik, Farm-Felder, visueller Umbau"

Vollständiger Ist-Zustand, Zielbild und Architektur:
**`CITYWORK_OVERHAUL_PLAN.md`** (verbindlicher Einstieg).

| Prio | Aufgabe | Stand |
| --- | --- | --- |
| P1 | Farm-Felder: kein Vorkommens-Riegel, „Felder verwalten", 3D-Felder | ✅ v1.37 (D-058/D-059) |
| P2 | Keine erzwungene Route/Reihenfolge/Quelle | ✅ war bereits erfüllt (D-052/D-054/D-057), gesichert durch `driveRecording.test.ts` |
| P3 | Selbstfahren als Kreuzungsentscheidung | ✅ v1.37 (D-060) |
| P4 | Stadtarbeitskarte aus der echten 3D-Szene (orthografische Aufnahme) | ✅ v1.38 (D-062) |
| P5 | Gebäude-Interaktion auf der Karte (Bestand, laden, Bedarf) | ✅ v1.38 |
| P6 | Route prüfen → Übergabe an die 3D-Welt | ✅ v1.38 (D-061) |
| P7 | UI-Layout nach den Mockups (§7) + immer Tag (§9) | ✅ v1.38 |
| §5 | Quicktime-/Aktiv-Events | bewusst zurückgestellt |

**Alle sieben Prioritäten sind umgesetzt.** Was am Auftrag offen bleibt, steht
hier — bewusst offen, nicht vergessen.

**Zu P4, damit es niemand zweimal misst:** Die Karte ist eine **orthografische
Aufnahme derselben Szene** (D-062), keine geneigte Kamera. Wer die Neigung will,
muss zuerst `toScreen`/`worldAt` durch die Kameramatrix führen — sonst zeigt die
Karte woandershin, als sie klickt (bei 0–48 m Gelände sind das mehrere Kacheln).

**Weiterhin offen aus dem Auftrag:**
* **§5 Quicktime-/Aktiv-Events** — bewusst zurückgestellt.
* **Häfen als Netzknoten der Stadtarbeit** (§4 „ob er einen Hafen einbindet"):
  Ein Hafen ist anklickbar und zeigt seine Daten, aber es gibt keine
  Schiffsetappe innerhalb eines Auftrags.
* **„Priorität" und „als Zwischenstopp hinzufügen"** (§6) sind bewusst NICHT
  gebaut: Seit D-054 gibt es keine Stoppliste, und `priority` ist ein Vertrag
  ohne Wirkung. Wer sie will, baut zuerst die Simulation dahinter.

**Nachzuholen:** Feld-Balancing (260 ⌾/Kachel, 1,4 ⌾/min Unterhalt) ist eine
Setzung, keine Messung. Und die Fahrzeug-Zulassung für Liefermissionen: Das
kleinste erlaubte Fahrzeug fasst 500, die ganze Tour wiegt 135–180 — die Traglast
aus D-057 bindet in der ausgelieferten Config praktisch nie.

# Frühere offene Aufgaben (Stand v1.34)

## 🔴 ZUERST: Entscheidung D-053 — 2D-Karte oder isometrische Weltkamera?

Der Folgeauftrag „Stadtarbeit Overhaul 2.0" verlangt (§2/§4/§14):
- die Stadtarbeitsansicht als **isometrische Kamera auf die echte 3D-Welt**,
  nicht als gezeichnete 2D-Karte,
- die Route als **Aufzeichnung der gefahrenen Strecke**, nicht als vorher
  gezeichneter Weg,
- die Ausführung anschließend **in der 3D-Welt**.

Das **kehrt D-050 und D-051 um** — beide fielen auf ausdrückliche Rückfrage
(„das selbstfahren findet … nur im stadtarbeit 2d modus … statt"). Deshalb ist
es vorgelegt und nicht still umgesetzt. `§11` des neuen Auftrags verlangt
weiterhin **keinen zweiten Renderer**; die Empfehlung ist ein Kamera-Modus des
bestehenden `ThreeMapRenderer`. **Vor Umsetzung D-050/D-051 ausdrücklich
zurücknehmen.**

Reihenfolge des Folgeauftrags (§14): 1 Automatik entfernen · 2 Weltkamera ·
3 freie Routenaufzeichnung · **4 lokale Lagerbestände (✅ v1.34)** ·
5 Fahrzeuge/Logistik · 6 3D-Ausführung · 7 UI nach Mockups.

## 🟢 Erledigt mit v1.34 (Save v32, D-052)

- ✅ **§8 Lagerbestände je Gebäude.** `economy/stockLedger.ts`, Invariante
  `resources === Σ Stadtlager`, kein drittes Lagermodell (derselbe
  `BuildingInventory`, dieselbe Map wie Betriebslager v17).
- ✅ **Ladeort als Entscheidung.** `getActivitySupplyOptions` (Bestand,
  Kapazität, Bedarf, „reicht das?"), `setActivitySource`, `SupplyPicker`.
  Entnahme/Rückgabe ortsgenau; zu wenig Vorrat ⇒ Mission startet nicht.
- ✅ **Beladung beeinflusst das Fahren.** `loadedTileSpeed` (volle Ladung = 72 %
  Tempo), dieselbe Funktion für alle Ansichten.
- ✅ Migration `v31→v32`; Alt-Saves behalten alles, Verortung beim ersten Abgleich.

**Ehrliche Grenze:** Farm, Sägewerk, Pumpwerk, Feuerwache haben **keine**
`storage`-Wirkung und damit keinen eigenen Bestand — dort bleibt die Ware die
Bilanz der Stadt. Wer das ändert, ändert `storageCaps` und damit Balancing.

## Offene Aufgaben nach v1.33

## 🟠 Stadtarbeit-Overhaul (Auftrag §§1–13, v1.33, Save v31 unverändert)

Verbindlich vor jeder Änderung an der Karte: `CITYWORK_MAP_PIPELINE.md` (D-051).
Vor jeder Änderung an der Fahrt: D-050 — es gibt **eine** Fahrphysik.

**Erledigt (v1.33):**
- ✅ **§3/§4 Karte aus der echten Welt:** Höhenrelief, Wassertiefe, Klippen-/
  Strandküste, Vegetation aus `collectRegionNature` — eine Leseinstanz
  (`renderer/worldProjection.ts`), testgesichert Instanz für Instanz.
- ✅ **§5 Infrastruktur hervorgehoben:** Marker für Lager, Logistikzentren,
  Häfen und aktive Betriebe (config-getrieben, keine Id-Listen); Brücken/
  Viadukte aus `roadEngineering.variant`; alternative Route blau gestrichelt;
  gefahrene Strecke als Spur.
- ✅ **§6 Fahren vereinfacht:** straßengebunden statt Arcade-Lenkung; W/S Gas
  und Bremse, A/D Abzweigung an der Kreuzung, Tempo aus `speedKph`.
- ✅ **§12 Leistung/LOD:** Weltbild als ein `drawImage`, Vegetation in Chunks,
  Naturgruppen nach Zoom gestaffelt, gedeckelte Straßenbreiten.
- ✅ **§13 Doku:** PROJECT_STATE, HANDOFF_LOG, PATCHNOTES, CLAUDE.md, D-051,
  neues Pipeline-Dokument.
- ✅ **Fahr-Status (Teil von §10):** Tempo, nächstes Ziel mit Entfernung,
  Abbiegeanweisung, erledigte Ziele.

**Offen — bewusst nicht vorgetäuscht:**
- ❌ **§8 Lagerbestände je Gebäude (= P4, NÄCHSTER SCHRITT).** Stadtarbeit
  rechnet mit einem globalen Pool. Das Nachlade-Panel des Mockups zeigt drei
  verschiedene Bestände — darauf gebaut wäre die Wahl des Lagers eine Attrappe.
  Lokale Inventare existieren im Betriebssystem (`operations/**`, Save v17+):
  **zusammenführen, kein drittes Lagermodell** (§2/§8). Braucht Migration v31→v32.
- ❌ **§9 Verkehrsrückkopplung.** Die vier Laststufen existieren, aber
  `congestionScore` kommt aus der Anrainerdichte, nicht aus gefahrenen Routen.
- ❌ **§7 Erweiterte Routenplanung.** Reihenfolge ändern, Zwischenlager
  hinzufügen, Nachladen planen; `TransportPriority` ist weiterhin deklarierter
  Vertrag **ohne Wirkung** (nicht persistiert, nicht in der UI).
- ❌ **§10 Gesamtlayout nach Mockup.** Nur der Fahr-Status ist umgesetzt; die
  Aufteilung LINKS/MITTE/RECHTS/UNTEN steht aus.
- ❌ **§5 Fähren/Häfen als Netzknoten.** Hafenmarker ja, Schiffsroute nein.
- ❌ **Echte Gebäudesilhouetten** in der Karte (heute Footprint + Kategorie).
- ❌ **„Ziel außerhalb Reichweite"** samt Richtungspfeil und Entfernung.

# Offene Aufgaben nach v1.32

## 🟡 World Visual Overhaul (v1.32, Save v31 unverändert)

Der Ausbau bleibt vollständig renderer-/assetseitig und führt weder ein neues
Weltsystem noch eine Save-Migration ein. Das persistierte Schema bleibt bei
**v31**.

**Erledigt:**
- ✅ **Terrain:** per-Chunk-Sampler, PBR-Detailauflösung und weiche Übergänge
  zwischen den bestehenden Terrain-/Biomprofilen.
- ✅ **Wasser:** analytische Wasseroberfläche mit blickwinkelabhängigem Fresnel.
- ✅ **Natur:** Nature-HLOD und Shader-Wind innerhalb des bestehenden
  Instancing-/Culling-Pfads.
- ✅ **Gebäudeintegration:** datengetriebene Building Appearance sowie
  Umgebungsinstancing und HLOD ohne zweites Gebäudesystem.
- ✅ **Postprocessing-Qualitätsprofile:** gestufter Direkt-/Composer-Pfad für
  Low bis Ultra mit AO, SMAA, HDR-selektivem Bloom und optionalem, sehr
  dezentem DOF.

**Weiter offen — bewusst nicht vorgetäuscht:**
- ❌ **Browser-3D-Screenshot-Smoke:** derzeit keine verfügbare Browserinstanz;
  die verbindliche visuelle Prüfung steht deshalb noch aus.
- ❌ **Shader-Visual-QA:** Terrain, Wasser, Wind, HLOD-Übergänge und
  Postprocessing müssen interaktiv auf Artefakte und Lesbarkeit geprüft werden.
- ❌ **GLB-Offlineoptimierung:** Draco/Meshopt, KTX2, Cache-Eviction und
  authored LODs sind noch nicht als belastbare Asset-Pipeline umgesetzt.
- ❌ **Echte Billboards/Crossfade:** HLOD reduziert Geometrie, besitzt aber noch
  keine authored Fern-Billboards mit weichem Crossfade.
- ❌ **Messbarkeit:** GPU-, Speicher- und LOD-Telemetrie sowie reproduzierbare
  Messungen auf benannter Windows-Zielhardware fehlen.
- ❌ **Globale Geometrie-LODs:** Straßenmesh und Terrain benötigen noch
  Chunk-/Fern-LOD statt globaler beziehungsweise gleich detaillierter Geometrie.
- ❌ **Terrain-Detail-Visual-QA:** Die neue kamerastabile World-Space-/
  triplanare Normal- und Rauheitsprojektion ist implementiert, benötigt aber
  noch interaktive Sichtprüfung und Feintuning auf realen Kamerawinkeln.

## ✅ ERLEDIGT: Straßen-, Höhen- und Terrain-Overhaul (v1.31, Save v31)

- **Eine sichtbare Straße:** `road` wählt automatisch Ebene, Hang, Pass,
  Stützung, Viadukt, Brücke oder Küste. `road_elevated` bleibt nur als interne
  Legacy-Definition für alte Saves; kein zweiter Straßengraph.
- **Kanonisches, persistiertes Profil:** Landanker, Länge, Höhendifferenz,
  Deckhöhe, Freistand und Maximal-/Durchschnittssteigung kommen aus
  `roadProfile.ts`. 8 % ist ein Baulimit; zu kurze Höhenwege werden durch
  deterministische Kehren verlängert oder ehrlich blockiert. Neue Abschnitte
  speichern `roadEngineering`; Migration `v30→v31` ist additiv.
- **Plan → Vorschau → Bestätigen → Command:** vollständiges Höhenprofil,
  Varianten und Ressourcen; einmalige Abbuchung und echter Bulk-Commit mit einer
  Zustandsbenachrichtigung.
- **Fundamente:** Ein `FoundationPlan` trägt Terrain-Kategorie, Konstruktion,
  Stütztiefe, Kosten und Bauzeit durch Diagnose, Command, Ghost und Renderer.
  Stützmauern, Terrassen, Pfähle und Klippenanker ersetzen den grauen Vollblock;
  das gebackene Terrain bleibt unverändert.
- **Darstellung:** gespeicherte Deckhöhe für Straße, Brücke, Stützen und
  Fahrzeuge; sieben aktive GLB-Nahdetailkits mit prozeduralem Fallback.

**Weiter offen:** Tunnel, manuelle Höhen-/Pfeiler-/Brückenwahl, frei ziehbare
Kurvengriffe, Schiffsdurchfahrt/Maximalspannweiten, Lane-/Kreuzungsbelegung und
Straßen-Chunking/Fern-LOD. Der Bodennetz-Mesh wird bei jeder Straßenänderung noch
global neu aufgebaut.

## ✅ ERLEDIGT: Map Flattening + Buildability Overhaul (v1.11, Save v25, D-040)

Auftrag vom 28.07.2026 („Die Insel soll weiterhin spektakulär aussehen, aber sich
endlich wie eine wirklich gut spielbare City-Builder-Map anfühlen"). Phasen A–E
vollständig; Kennzahlen und Begründungen in
[`MAP_FLATTENING_AND_BUILDABILITY_PLAN.md`](MAP_FLATTENING_AND_BUILDABILITY_PLAN.md).

**Daraus offen geblieben (bewusst, nicht vorgetäuscht):**
- **Echtes Einebnen des Terrain-Meshes unter dem Footprint** (§4.1). Umgesetzt ist
  seit v1.31 der kanonische Fundamentplan mit Stützmauer, Terrasse, Pfählen und
  Klippenankern. Eine echte Geländemutation bleibt gemäß D-043 bewusst aus; sie
  bräuchte eine gemeinsame Pad-Überlagerung plus Terrain-Chunk-Neuaufbau.
- **5×5-Footprints** bleiben mit 30,9 % der Ankerkacheln der schwierigste Fall.

> **Danach geht es mit den zurückgestellten Active-Simplicity-Phasen AS-3…AS-9
> weiter** ([`ACTIVE_SIMPLICITY_PLAN.md`](ACTIVE_SIMPLICITY_PLAN.md), D-039).

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

**Stand v1.31:** Höhen und Wasser blockieren die Expansion nicht mehr pauschal.
Die eine öffentliche Straße erzeugt Pass, Stützung, Viadukt oder Brücke
automatisch; I3–I5 bleiben davon unabhängig.

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
  - ✅ **v1.31 konsolidiert I1:** `road_elevated` ist nur noch Legacy; `road`
    wählt sieben Varianten automatisch. Persistierte Deckhöhe, profilhohe
    instanzierte Pfeiler bis zum tatsächlichen Boden, Wasser-Landanker,
    Variantenkosten, Rampenprofile und sieben aktive GLB-Kits ersetzen die feste
    Höhenstraße. Offen bleiben Tunnel, manuelle Höhe, Schiffsdurchfahrt und
    strukturelle Maximalspannweiten.
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
  - ✅ **v1.31 erweitert I2:** max. 8-%-Längsprofil, automatische Serpentinen,
    automatische Varianten, vollständige Profil-/Ressourcenvorschau und echter
    Bulk-Commit mit einer Zustandsbenachrichtigung. Der bestehende
    4-Nachbar-`roadNetwork` bleibt die einzige Navigation.
- 🟡 **I3 Küste/Ufer + Anleger als Netzknoten** (Straße↔Anleger↔Schiff):
  - ✅ **Netzknoten-Modell** (v0.96): `networkSegments.ts` zerlegt das **bestehende**
    `roadNetwork` in Teilnetze und benennt das Stadtnetz (`city`/`local`, deterministisch,
    in `computeDerived` statt pro Read); `harborNodes.ts` projiziert daraus je Anleger
    Landseite/Wasserseite/erreichbare Häfen und `linksToCityVia` (Eingabe für I4).
    Gebäudefenster zeigt die Landseite. Kein zweiter Graph, keine Save-Änderung.
    Kapazität/Reisezeit/Warenfluss bewusst offen (= I4). 8 Tests.
  - ❌ **R9 adaptive Uferplattform** (Renderer/Bake) — noch offen.
- 🟡 **I4 Schifffahrtsnetz + Stadtarbeit-Integration**:
  - ✅ **Persistente Schiffsrouten** (v0.97, **Save v22** + lineare Migration v21→v22):
    `infrastructure/shippingRoutes.ts` — zyklische Anleger↔Anleger-Route mit echter
    Kapazität, Fahrzeit aus der Wasserdistanz, Betriebskosten je Fahrt, Pause/Löschen,
    Warte-Zustand bei leerem Lager. Neues Fahrzeug `cargo_barge` (Config, §2).
    Wiederverwendet `waterNavigation` + `logistics` + `operations` und **dasselbe
    Phasenvokabular** wie der Transport — kein zweites System. Läuft im selben
    `dtMin`-Tickpfad. 10 Tests.
  - ❌ Offen (nicht vortäuschen): **3D-Schiffe** auf der Route, Routen-UI (→ I5),
    Zwischenlager an Häfen, Kraftstoff/Schiffszustand, mehrere Schiffe je Route,
    echte multimodale Legs (Landwege sind in Lade-/Entladezeit abstrahiert).
- 🟡 **I5 Bevölkerungs-Rebalancing + Infrastruktur-Netz-UI**:
  - ✅ **Infrastruktur-Netz-UI** (v0.98): Panel mit Reitern Straßen/Brücken/Anleger/
    Schiffe (Schnellleiste neben „Regionen"); Teilnetzliste, Anlegerzustände und
    **Bedienung der Schiffsrouten** (pausieren/fortsetzen/löschen). Übersicht um
    `groundRoadTiles`/`elevatedRoadTiles`/`harbors` erweitert. Nur echte Reads, keine
    erfundenen Kapazitäts-/Verkehrsdaten. Keine Save-/Sim-Änderung.
  - ❌ **Bevölkerungs-Rebalancing** (Haus 4–8 … Hochhaus 300+): **braucht eine
    Entscheidung.** Die Zielwerte sind mit **keinem einheitlichen Faktor** erreichbar
    (`populationScale: 20` × `units × maxResidentsPerUnit`; nötige Faktoren je Typ
    ~10–22). Also echte Neubalancierung statt Umrechnung: verschiebt Level-Schwellen,
    Questziele (inkl. `questText.test.ts`), Pro-Kopf-Wirtschaft und
    `coverageCapacity` — plus **lineare Migration** der persistierten Einwohnerzahl.
    Vorher mit dem Auftraggeber abstimmen (vgl. Audit 2.5 / G4).

**Nicht vortäuschen:** fehlende Schiffs-Legs/Kapazitäts-/Verkehrsdaten sind
`TODO(CLAUDE_LOGIC)`. Kein zweiter Straßengraph/Transport.

## ZURÜCKGESTELLT (nach Infrastruktur 2.0 fortsetzen): § 10.0 R2–R5, R9

> Bleiben P0 **nach** Infrastruktur 2.0. Master-Spec: `ACTIVE_RESOURCE_LOOPS_10_PLAN.md`.
> R1/R7/R8 sind erledigt (D-035, v0.83). **R6 ist mit I2 erledigt (v0.86).** R9 wird
> in Infrastruktur 2.0 (I3) miterledigt.

- ✅ **R2 Dauerbetrieb** (v0.99, **Save v23** + lineare Migration v22→v23): `workArea`
  (`circle`) + `continuous` am Auftrag, neuer Status `waiting`, Auto-Pause/Resume statt
  Auto-Delete; Wiederaufnahme über dasselbe `selectAreaNodeIds`. Read
  `getContinuousOperationStatus`. Gebiets-Start ist standardmäßig Dauerbetrieb, die
  Einzelbaum-Auswahl bleibt einmalig. 5 Tests (u. a. messbarer Ernte-Kontrast).
  ⏳ Offen: **Rechteck-/Polygon-Arbeitsgebiete** (brauchen erst einen UI-Entwurfsvertrag).
- ✅ **R2/§5** (v1.00): passive `produce`-Rate für Gebäude mit `operation` aus
  Gebäudefenster **und** Baumenü entfernt (sie war falsch — der Passivpfad ist dort
  abgeschaltet); neuer reiner Read `getOperationThroughput` löst den Platzhalter
  „Durchsatz: Nicht angebunden" ein: Projektion der echten Arbeitsschleife
  (Traglast / (Hinweg + Fällzeit + Rückweg)) mit den Tick-Formeln, plus ehrliche
  Leerlaufgründe. Keine Save-/Sim-Änderung. 2 Tests.
  ⏳ Offen: **gemessener** rollierender Durchsatz (braucht persistierte Historie).
- 🟡 **R3** Ressourcennetz: ✅ benannte Standorte (Region + Richtung) waren bereits echt;
  ✅ **Lagervergleich** (v1.01) — Belegung %, freier Platz, voll/fast-voll-Zähler,
  Engpass-Standort (`buildStorageComparison`, nur physische Lager; zentraler Pool
  bewusst ausgenommen, §7.2). ❌ offen: getrennte Rathaus-/Lagerhausanteile (braucht ein
  echtes Bestandsmodell je Gebäude statt des gemeinsamen Pools).
- 🟡 **R4** Frühtransport: ✅ Handkarren ist seit v0.91 real; der **hart kodierte
  Platzhalter** daneben („Nicht angebunden", Kapazität 0) ist mit v1.01 entfernt —
  Transportmethoden kommen nur noch aus `config.activities.vehicles`, jede genau einmal.
  ❌ offen: `InventoryTransferRule` (wiederkehrende Lagerregeln) + physisches
  Rathauslager.
- ✅ **R5** (v1.02): Ladungsprognose je Stopp (`cargoAfter`) war bereits echt; neu sind
  **Pflicht-/Optional-Marker** für Nachfüllstopps (`required`/`requiredForBuildingId`,
  additiv). Der Marker entsteht per Vorausschau auf dem echten Weg (Bedarf des nächsten
  offenen Ziels vs. Ladung vor dem Nachladen) — keine Heuristik. 2 Tests.
- 🟡 **R10**: ✅ **Migrationskette lueckenlos abgesichert** (v1.03): Test prueft jede
  ladbare Schema-Version bis zur aktuellen; erlaubt ist nur ein bewusster
  `LegacyWorldSaveError`, nie "Missing migration". Netz gegengeprueft (kuenstlicher
  Bump auf v24 laesst den Test fehlschlagen). ❌ **Balancing-Abschluss offen** — haengt
  an P-B2 (Dauern in Ingame-Minuten) und dem Bevoelkerungs-Rebalancing (I5 Teil 2).

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
- frei wählbare Alternativroute und Abrissdiagnose; atomarer Straßenpfad,
  Kontrollpunkte, Steigung und Viadukt sind seit v1.31 erledigt,
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
- ✅ **A6 Steinbruch + A7 Farm** (v1.25, Save v29, D-046): `operations/nodes.ts` ist
  auf `tree`/`rock`/`crop` verallgemeinert (ein `ResourceNodeProfile` je Typ);
  **Stein wächst nie nach**; Logistik-Zuschlag wirkt über `derived.logisticsBoost`
  auf Tempo statt Passivrate; Stufen auf die früheren Passivraten kalibriert
  (38/80/210 Stein, 260/500/1.100 Nahrung). Bedienung: `nodeVocabulary.ts` (ein
  Wortfeld je Knotentyp, total über die Union), sichtbare Endlichkeit
  (Restmenge + Umzugshinweis) nur bei nicht nachwachsenden Vorkommen,
  `OPERATION_IDLE_REASONS` als Liste (D-046). 22 Tests.
  ⏳ Offen: Rechteck-/Polygon-Arbeitsgebiete, Abbau-/Fällanimationen, echtes
  Knoten-Mesh-Raycast.
- **A8 Feuerwehr-Dispatch:** Einsatzsystem über dasselbe Framework — keine
  Parallel-Simulation.
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
3. ✅ **ERLEDIGT (v1.26, D-047) — Echter GLB-Ghost inkl. Anschlusspunkt.** GLB,
   Rotation, Sockel und Radius waren bereits vorhanden; offen waren
   Anschlusspunkt und `placementDiagnostics`. Neu: `connectedRoadTiles` in
   `placement.ts` ist die **einzige** Aufzählung der Anschlusskacheln
   (`isConnectedToRoad` leitet sich daraus ab), `PlacementDiagnostics` führt
   `roadTiles`/`requiresRoad`, der Ghost liest **eine** Diagnose statt drei
   Einzelabfragen und markiert die Anschlusskacheln im Gelände.
   **Kern des Befunds:** `requiresRoad` (23 von 34 Gebäuden) blockiert die
   Platzierung nicht — im Startzustand waren 3.652 von 3.721 geprüften Kacheln
   gültig UND ohne Anschluss, das Gebäude danach ohne Wirkung. Dafür gibt es
   jetzt eine eigene bernsteinfarbene Warnstufe in Ghost und Banner.
   7 Tests (`placementRoadLink.test.ts`). Keine Save-/Sim-Änderung.
4. ✅ **ERLEDIGT (v1.27, D-048) — Verschieben als Entwurf.** `setMoving()` war ein
   No-op mit Kommentar auf den entfernten 2D-/Iso-Modus; der „Versetzen"-Knopf von
   **14 der 34 Gebäude** (u. a. Sägewerk, Steinbruch, Farm — die laut A6/D-046
   umziehen MÜSSEN, weil Stein nie nachwächst) führte ins Leere: kein Ghost, keine
   Ursprungsmarkierung, `onMove` wurde nie aufgerufen, Ausweg nur ESC.
   Jetzt: `placementDraft()` beantwortet „was hängt am Cursor" für Bauen **und**
   Versetzen (eine Ghost-Strecke), `moveOriginGroup` markiert den Ursprung,
   der Bestätigungsklick löst genau einen Command aus.
   **D-048:** Der Prüfteil von `moveBuilding` ist als reine `evaluateMove`
   herausgezogen; `moveDiagnostics` ruft genau diese auf — sonst wäre der Ghost
   grün, wo der Command wegen `feature_disabled`/`insufficient` ablehnt. Der
   Umzug braucht zwingend `ignoreBuildingId` (sonst blockiert die eigene
   Grundfläche). 10 Tests (`movePreview.test.ts`). Keine Save-/Sim-Änderung.
   Offen: Ghost zeigt das Stufe-0-Modell, kein Drag-and-Drop, Knopf liegt zwei
   Klicks tief (gehört in einen Sheet-Pass).
5. ✅ **erledigt (v1.28, Save v29, D-049).** Terrainfolgend war es längst; falsch
   war die **Form**. Reichweite ist `chebyshev(...) <= radius` — ein Quadrat —,
   der Renderer bekam nur `radius`, riet euklidisch und zeichnete einen
   eingeschriebenen Kreis: **19–30 % der versorgten Kacheln blieben unsichtbar**
   (Brunnen r9: 108 von 361; Feuerwache r32: 868 von 4.096), einseitig zu wenig.
   **D-049:** Die Simulation liefert die Fläche mit (`CoverageSourceView.area`,
   `coverageArea`/`coverageAreaAround`/`coversTile`); der Renderer leitet nichts
   nach. Dazu neu: Radius **bei Hover** (Auswahl behält Vorrang, Ghost geht vor),
   gesucht mit derselben Abfrage wie beim Klick. Arbeitsgebiets-Overlay ebenfalls
   auf Quadrate. 4 Tests (`coverageArea.test.ts`). Keine Save-/Sim-Änderung.
   Offen: mehrere Radiusgruppen je Gebäude zeigen weiter nur die erste;
   `nodesInWorkArea` bietet 120–171 Kacheln an, die `previewOperation` verwirft
   (Sim-Frage, Balancing — bewusst nicht mit umgebaut).
6. ✅ **ERLEDIGT (v1.31, Save v31).** Ein sichtbares Straßenwerkzeug;
   `RoadPlanPreview` trägt das kanonische Höhenprofil, automatische Varianten
   und vollständige Ressourcen. Maximal 8 %, automatische Serpentinen oder
   ehrliche Blockade. `buildRoadPath` bucht einmal, persistiert das Engineering
   und schreibt den ganzen Pfad in einem Bulk-Commit mit genau einer
   Zustandsbenachrichtigung. 34 gezielte Straßen-/Fundament-/Assettests.
   Offen: manuelle Höhe/Kurvengriffe, Tunnel und globaler Mesh-Rebuild.

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
- ✅ Brücken und Viadukte sind seit v1.31 automatische Varianten mit Kosten,
  Rampenprofil, Pfeilern und gemeinsamer Navigation. Offen: Tunnel/Portale,
  manuelle Höhenwahl, Schiffsdurchfahrt und strukturelle Maximalspannweiten.
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

- ✅ Steigung/Höhenprofil ist seit v1.31 kanonisch und je neuer Straßenkachel
  persistiert. Offen ist die Nutzung in Stadtarbeit-, Zustand- und
  Verkehrsbewertung.
- Straßenqualität/-zustand, Sperrungen und dynamischer Verkehr.
- Fahrzeugzustand, Kraftstoff und Schäden als zusammenhängende Phase.
- `rewardMultiplier` erst nach Wirtschaftstest an Auszahlung koppeln.
- 3D-Ausführung um sichtbare Quellhalte/Nachlade-/Rückfahrt-Etappen erweitern;
  Planungsdaten liegen bereits in Cargo-Plan/-Route.

## P1/P2 — Welt und Systeme

- ✅ Echter GLB-Ghost für Platzieren (v1.26) **und Verschieben** (v1.27); beide
  lesen `placementDiagnostics`/`moveDiagnostics`. Rest: Ghost zeigt das
  Stufe-0-Modell statt der tatsächlichen Ausbaustufe.
- ✅ Wirkungsradien nutzen seit v1.28 `getCoverageOverlay` und die kanonische
  quadratische Fläche.
- ✅ Straßenbau ist seit v1.31 vollständig Planen → Vorschau → Bestätigen →
  Command, einschließlich Höhenprofil, Varianten und Bulk-Commit.
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
