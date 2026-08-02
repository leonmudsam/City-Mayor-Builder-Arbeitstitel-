# CLAUDE.md — Arbeitsregeln (verbindlich)

City Mayor Builder wird als **natives PC-Spiel** (Tauri, Windows zuerst) aus **einer**
Codebasis entwickelt; der Browser ist nur Dev/Test. Vollständige Begründung:
`docs/PROJECT_STRATEGY.md`. Architektur: `docs/ARCHITECTURE.md`.

## Oberste Designregel: Active Simplicity (D-039, 25.07.2026)
> **Der Spieler entscheidet. Die Stadt arbeitet.** Nicht andersherum.
>
> **Jede Aktion, die der Spieler mehr als drei Mal hintereinander ausführen muss,
> wird automatisiert oder durch ein dauerhaftes Regelwerk ersetzt.**
>
> Vereinfacht wird die **Bedienung**, nicht die Simulation — Tiefe im Hintergrund,
> Ruhe im Vordergrund. Automatisiert wird **Ausführung**, nie **Wahl** (wo
> expandieren, was bauen, welche Steuern, welche Bürgerwünsche bleibt Spieler).
> Diese Regel schlägt im Konflikt jede frühere Feature-Planung — sie löst
> ausdrücklich A5/D-032 (manueller Transport), R4 (Lager-/Fahrzeugwahl) und R5
> (manuelle Nachfüllplanung) als *Bedienkonzept* ab; die Systeme dahinter bleiben.
> Verbindlich: `docs/agents/ACTIVE_SIMPLICITY_PLAN.md`.

## Harte Regeln
1. **Simulation ≠ Rendering.** Nichts unter `src/game/**` darf `three`, `pixi.js`,
   `react`, `zustand`, `../renderer`, `../components` oder `../state` importieren. UI
   liest Snapshots über den `GameController` (`version`/`subscribe`) und schickt
   Commands — mutiert nie direkt den State.
2. **Erweitern statt neu bauen.** Neues Gebäude/Mission/Quest/Ressource = Eintrag in
   der passenden `src/game/config/*.ts` (Zod-validiert), kein neues System. Vor einem
   neuen System prüfen, ob ein bestehendes erweitert werden kann.
3. **Saves brechen nie.** Schema-Änderung → `SCHEMA_VERSION` in `src/game/newGame.ts`
   erhöhen **und** eine Migration `n→n+1` in `src/game/storage/migrations.ts`
   ergänzen. Alte Spielstände müssen ladbar bleiben.
4. **Beide Modi müssen laufen.** Browser (`npm run dev`) **und** Desktop
   (`npm run tauri:dev`/`tauri:build`). Keine Annahmen über einen absoluten
   Basis-Pfad; `base: '/'`. Assets nur über die Drop-in-Registry laden.
5. **Drop-in-Assets.** `.glb`/Bild mit korrektem Namen einlegen → automatisch genutzt,
   sonst prozeduraler Fallback (nie crashen). Namen zentral in
   `src/assets/modelManifest.ts`; der Renderer importiert von dort, die Ordner-READMEs
   werden generiert (`tests/modelReadmes.test.ts` hält sie synchron:
   `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`).
6. **Performance by default.** Instancing, LOD, Culling, wenige Draw-Calls, keine
   unnötigen Re-Renders. Nicht „später optimieren".
7. **Gameplay vor Grafik.** Features sollen langfristig motivieren und strategische
   Tiefe schaffen, nicht nur hübsch sein.

## Verifikation vor jedem Commit
`npx tsc -b --force` · `npx eslint src tests` · `npx vitest run` · `npm run build`.
Bei Rendering-Änderungen zusätzlich ein 3D-Screenshot-Smoke (Playwright im
Scratchpad, `vite preview`, Basis-URL `/`). Der **Windows-Tauri-Build läuft nicht in
der Cloud-Umgebung** (kein Rust/Windows) — dort nur den Browser-Pfad verifizieren.

## Konventionen
- Commits, Patch Notes und In-Game-Texte auf **Deutsch**. Patch Notes ausführlich
  (Was/Warum/Architektur/Auswirkung/Zukunft/Dateien/Assets) in `docs/PATCHNOTES.md`.
- Modell-Identifier (`claude-*`) niemals in Commits/Code/PRs.
- Commit-Trailer:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01N5jzudvxboYPYLvPCVhDw9`
- Entwicklungsbranch: `claude/city-builder-concept-w2f70y`.

## Nicht anfassen ohne Grund
`src-tauri/target`, `src-tauri/gen`, `dist/`, `node_modules/`, `scratchpad/`
(gitignored). GitHub Pages ist abgeschaltet — kein Deploy-Workflow wieder einführen.
`archive/legacy-2d/` = archivierte 2D-/Iso-Reste (nicht reaktivieren).

## Status: v1.36 — DIE SPERRE IST EIN ORT (Save v32, D-056 verschärft) — AKTUELL
Spieltestbefund: „Props in nicht freigeschalteten Sektoren sind immer noch voll
Farbe." Zu Recht — die Entsättigung stand **nur in der Vertexfarbe des Bodens**,
und der Splat-Shader mischte danach Fototexturen (bis 44 %) darüber und hob die
Sättigung um Faktor 1,1 wieder an; Vegetation, Modelle, Landmarken, Flussband,
Küstenschaum und Wasser wurden **nie** behandelt.
**Zwingend: Die Sperre hängt am ORT, nicht am Objekt.**
`src/renderer/three/lockedRegionMask.ts` hält zwei winzige Texturen — eine
512²-Regionskarte (aus dem Bake, ändert sich nie) und eine 64×1-Tabelle „wie
stark ist Region N gesperrt". `patchLockedRegionTint(material)` lässt jedes
Material die Maske im Fragment-Shader lesen und **ganz am Ende** graden (nach
Splat, nach Tonemapping). Wer die Grauschaltung pro Objektgruppe einbaut, muss
sie bei jeder neuen Gruppe erneut einbauen — und wird sie vergessen; genau das
ist zwischen v1.24 und v1.35 passiert. Weil die Maske positionsbasiert ist,
genügt **ein geteiltes Material** für freies und gesperrtes Land.
**REIHENFOLGE IST PFLICHT:** `material.onBeforeCompile = …` **ersetzt** den Hook.
Der Sperr-Patch läuft deshalb NACH dem Splat-Shader (Boden) und NACH
`addShaderWind` (Vegetation) — davor verschwindet er still, der Code steht da und
das Bild bleibt bunt. Nebengewinn: Freischalten baut den Boden nicht mehr neu,
die weiche Aufblende kostet 64 Byte je Frame (Echtzeit, friert bei Pause nicht
ein). Gemessen im Spiel: Chroma frei **49** gegen gesperrt **8/21**. Keine Save-,
Sim- oder Balancing-Änderung, **v32**.

## Status: v1.35 — DIE ROUTE WIRD GEFAHREN + STEIN-EINSTIEG (Save v32)
Drei Aufträge, keine Schemaänderung. **(1) Stadtarbeit 2.0 Phasen 1+3 (D-054):**
Der Planer schlägt nichts mehr vor — keine Zielreihenfolge, kein Weg, kein
„Optimieren", kein Zeichenwerkzeug; der Knopf nimmt den **Auftrag** an. Der echte
Riegel saß tiefer als die UI: `progressActivity` akzeptierte für Fahrmissionen
ausschließlich `targets.find(!done)` — wer als Zweites das nähere Haus ansteuerte,
bekam `invalid`. Jetzt zählt **jedes offene Ziel**, und `active.targets` wird beim
Abschluss umsortiert, **protokolliert also die gefahrene Reihenfolge** (eine Liste,
nicht zwei). Die Strecke schreibt `recordActivityDrive(tiles)` in **dasselbe**
`plannedRoadPath`, das der Abschlussbericht ohnehin auswertet — kein zweites
Streckenfeld, keine Migration; gelesen wird `derived.roadNetwork` (kein zweiter
Verkehrsgraph), Diagonalen ergänzen deterministisch die Eckkachel, **größere
Sprünge werden verworfen statt interpoliert**, und die Aufzeichnung läuft
**ohne `notify`** (Bildrate). „Fahren lassen" bleibt — automatisiert wird die
Ausführung, nie die Wahl (D-039). **Offen (D-053, nicht vortäuschen):**
isometrische Weltkamera statt 2D-Karte, Gebäude-Interaktion auf der Karte,
Nachladen unterwegs, 3D-Ausführung, UI nach den Mockups.
**(2) Frühspiel-Einstieg (D-055):** Gemessen — die Startregion hat 46 Bergkacheln
≈ 18 Felsknoten ≈ **3.312 Stein einmalig** (Fels wächst nie nach), Startvorrat
Stein **0**, erste Steinkosten L6. Die vermutete Schleife „Stein für den
Steinbruch" gibt es **nicht** (`quarry` kostet Geld+Holz) — der Riegel ist das
**Terrain**. Neu: **`stone_pit`** (L2, `{9.000, Holz 60}`, 13 Stein/min, Ausbau 26)
ohne Terrainbindung, bewusst ein Drittel des Steinbruchs.
`tests/earlyGameProgression.test.ts` erzwingt die Regel über die **ganze** Config:
jede Baukosten-Ressource bis L8 hat eine Quelle, die sie nicht selbst voraussetzt.
**Die Farm bleibt der offene Punkt** — die Startregion hat **null** fruchtbare
Kacheln, die Farm ist gültig platzierbar und arbeitet nie; bis das Feldsystem
existiert, sagt die Diagnose `no_resource_nodes` es wenigstens (Warnstufe wie
D-047, **keine** Bauregel). **Die Feld-Simulation steht**
(`operations/farmFields.ts`): ein Feld ist **kein Gebäude**, sondern eine bezahlte
`terrainOverrides`-Änderung — `isNodeTile` schließt Kacheln unter Gebäuden aus, ein
Feldgebäude könnte also nie selbst der Knoten sein; ab da liefert die **normale**
Knotenableitung `crop`-Knoten (kein zweites Produktionssystem, kein Schemabruch).
**Offen und nicht vortäuschen: die Bedienung** („Felder verwalten" im Farm-Sheet,
Rechteck + Vorschau) und die Darstellung im Renderer — ohne sie ist das System im
Spiel nicht erreichbar. Details: `docs/agents/EARLY_GAME_AUDIT.md`.
**(3) Gesperrte Regionen (D-056, schärft D-045):** volle Prop-Dichte
(`LOCKED_VEGETATION_DENSITY` 0,5 → **1** — halbe Dichte erzeugte einen kahlen
Streifen an der Regionsgrenze), Entsättigung 0,7 → **0,85**, und der Schlossmarker
trägt **Name, Level, Kosten, Bonus** aus `regions.config` (Bonus bleibt leer, wenn
die Region keinen hat). Rein visuell; `regionUnlockBlocker` unverändert.

## Status: Ausbaustufe 2.0 abgeschlossen (v0.50–v0.59)
Gebäudesystem 2.0 + Welt 2.0 sind vollständig (A1–A10). **Nur noch der
3D-Renderer** existiert (`src/renderer/three/`); der 2D-/Iso-Pixi-Renderer,
`house_row`/`apartment` und `pixi.js` sind endgültig entfernt (kein Modus-Wähler
wieder einführen). Gebäude-/Regions-/Prompt-Doku ist **generiert & testgeprüft**
(`docs/BUILDINGS.md`, `docs/REGIONS.md`, `models/**/PROMPTS.md` — Regel §5 gilt
weiter). Save-Schema steht bei **v14** (neue Welt; v10–v13 werden einmalig gesichert). Balancing/Progression sind über
20 Level × 40 Regionen abgesichert und durch `config.test.ts`/`balancing.test.ts`
gegen Regressionen gesichert. Bewusst offen (drop-in-fähig, Prompts existieren):
der erweiterte Biom-Prop-Katalog (Wasserfälle/Windmühlen/Boote/Landmarken) —
prozedurale Fallbacks decken den Kern, echte `.glb` einfach einlegen.

## Status: World Rebuild 6.0 — verbindlicher Stand (v0.60–v0.72)
Die visuelle Mockup-Grundlage ist umgesetzt: maritimes Glas-HUD, vertikale linke
Hauptnavigation, Live-Inselkarte, Bürger-Kompakt-/Detailansicht,
KI-Regions-Hero, Ein-Sheet-Regel, organischere Vegetation, Küstenschaum,
Wolken-/Regionsnebel sowie Drop-in-Boote, -Windmühlen und -Leuchttürme. Einstieg:
`docs/agents/README.md`; Designregeln: `docs/agents/UI_SYSTEM.md`; Restphasen:
`docs/OVERHAUL_3_PLAN.md`.

v0.61 ergänzt den großen Bau-Shop, Standort-/Radius-Gebäudedetails, eine
filterbare Anliegen-Inbox, den rein visuellen Info-Layer, Minimap-Panning,
Rollenporträts und hellere Berg-/Küsten-/Nebel-/Biomdarstellung. CSS ist unter
`src/styles/` nach Tokens/Layout/Komponenten/Animation/Responsive getrennt.
Der damalige `CODEX_VISUAL_AUDIT.md` bleibt als historische Grundlage erhalten.

v0.62 ergänzt den vollhohen rechten PC-Baushop ab 1680×860,
Gebäude-Stufenvorschauen, biomabhängige Regions-Heros, ein visuelles
Sonne-/Regen-/Nebel-Fenster samt Live-Renderer-Grading und gedeckelte
Wasserfall-Landmarken. Wetter bleibt reine Darstellung in
`environmentSettings`/`SkyEnvironment` und hat keinerlei Simulations- oder
Save-Wirkung.

v0.63–v0.65 ersetzen den alten Stadtarbeit-Prototyp durch eine echte, manuelle
Straßengraph-Planung innerhalb des bestehenden Aktivitätssystems. Der Spieler
zeichnet die Route selbst, ordnet Ziele, wählt ein datengetriebenes Fahrzeug und
verfolgt anschließend dessen automatische 3D-Fahrt. Die Abschlussansicht bewertet
Zeit, Distanz, Effizienz und Straßenabdeckung. `ActiveActivity.vehicle` und
`plannedRoadPath` sind optional persistiert; Save-Schema ist deshalb **v12** mit
Migration `v11→v12`. Alte v11-Spielstände bleiben gültig und erhalten keine
erfundene Route.

v0.66–v0.68 ergänzen Cargo/Kapazität, reservierte Ladung und reine
Infrastruktur-/Leerfahrtbewertung. Save-Schema ist **v13** mit linearer
Migration `v12→v13`. v0.69 überträgt Redesign 4.0: keine gespeicherte
Standardroute, keine Drag-&-Drop-Zielreihenfolge und kein Werkzeugmodus;
Reihenfolge, Tour, Cargo und Nachfüllen entstehen live aus dem exakten Weg.

v0.70 überträgt die Insel-/Biom-Mockups auf den bestehenden Three-Renderer:
zwölf visuelle Regionsprofile, zwölf Terrain-Splat-Layer, triplanares Gebirge,
differenzierte Vegetation, animierte Flüsse und neutrale Landmark-Fallbacks.
Inselbake, Gameplayregionen und Save v13 bleiben unverändert. Vor Weltarbeit
zuerst `docs/agents/MAP_REDESIGN_AUDIT.md`, danach
`MAP_REDESIGN_PLAN.md` und `WORLD_ASSET_MANIFEST.md` lesen. Region 9/29 sind nur
visuell Wüste/Sumpf; jede Gameplaywirkung ist `TODO(CLAUDE_LOGIC)`.

v0.71 ersetzt den niedrigen Teasernebel gesperrter Regionen durch eine
blickdichte Wolkenwand oberhalb des höchsten Terrainpunkts. Ein gedeckeltes
Wolken-`InstancedMesh`, drei Alpha-Lagen und die vorhandene Unlock-Animation
bleiben Teil desselben Three-Renderer-Pfads. Welt und Minimap zeigen Schloss,
Regionsname beziehungsweise echtes Level aus kanonischer Config. Keine
Simulation und keine Save-Änderung; Schema bleibt v13.

v0.72 ersetzt die frühere 384²-Geometrie durch den Offline-Bake aus
`reference/world/island 3d new.glb`: 512² Terrain, 1025² Höhe, 40 Regionen,
Oststart, Surface-/Wasser-/Infrastrukturmasken und Save v14 mit einmaligem
Backup-/Neustart für v10–v13. Die GLB wird nie zur Laufzeit geladen. Verbindliche
Einstiegsdokumente: `docs/agents/NEW_ISLAND_AUDIT.md` und
`NEW_ISLAND_REBUILD_PLAN.md`.

v0.76/0.77 (Final World Compaction 8.1) verdichten die Insel ein zweites Mal
(13 Regionen, Save v16) und führen Vegetations-Qualitätsstufen + Dev-Performance-
Panel ein (Säule B). Details: `PATCHNOTES.md`, `WORLD_COMPACTION_REPORT.md`,
`WORLD_PERFORMANCE_AUDIT.md`.

v0.78 startet **Active Operations 2.0**: das Sägewerk erzeugt kein passives Holz
mehr, sondern über Arbeiter + Ressourcenknoten (Bäume) + lokales Betriebslager
(Save **v17**, additiv). Nur Gebäude mit `BuildingDef.operation` sind aktive
Betriebe; ihr `produce`-Pfad ist in Tick+Derived abgeschaltet. Reines Sim-Modul
`src/game/operations/**` (kein Renderer/React). Sägewerkholz bleibt bis Phase A5
(Transport) bewusst lokal gebunden — Transport/Steinbruch/Farm/Feuerwehr/
Automatisierung sind Folgephasen und dürfen in der UI nicht vorgetäuscht werden.
Verbindlicher Einstieg vor Betriebsarbeit: `docs/agents/ACTIVE_OPERATIONS_PLAN.md`.
Keine zweite Logistik-Simulation anlegen — Transport (A5) wiederverwendet
`activities/logistics.ts` + `routeAnalysis.ts`.

v0.79 setzt **Phase A5 (Transport)** um: ein manueller Lagertransport bringt
lokal geerntetes Holz über Fahrzeug + Straßenroute ins **Zentrallager** (globaler
Pool über ein Lagergebäude als Anlieferpunkt). Reine Sim
`src/game/operations/transport.ts` mit Zustandsmaschine `loading→in_transit→
unloading→delivered` (nur live), Reservierung im Quell-Lager, gedeckelter
Einlagerung (kein Doppelzählen in `stats.produced`) und Netzwerk-Übersicht
global/lokal/reserviert/unterwegs (§7.2). **Verwendet `routeAnalysis.ts` +
`logistics.ts` wieder — kein zweites System (§8).** Save **v18** additiv
(`operations.transfers`) mit Migration `v17→v18`. Additive gepoolte 3D-Fahrzeuge.
Offen (nicht vortäuschen): Mehrfachladung/Nachfüllfahrten, Rückruf während der
Fahrt, Transport-Betriebskosten, Zwischenlager-Puffer. Details:
`docs/agents/LOGISTICS_INTEGRATION.md`, D-032.

## Status: § Change 9.0 — Central Start / Fog / Living World / Active Work (v0.80+)
Großauftrag in Phasen S1–S8. Verbindliche Vorab-Audits:
`docs/agents/CENTRAL_START_REGION_AUDIT.md`, `FOG_OF_WAR_AUDIT.md`,
`WORLD_RENDERING_PERFORMANCE_AUDIT.md`, `ACTIVE_RESOURCE_WORK_PLAN.md`.
**v0.80 = S1+S2 erledigt:** zentraler Start über die **Bake-Zielvorgabe** (820→
**1.400** bebaubare Kacheln, kein manuelles Rathaus-Verschieben — §3.2) neu
gebacken; Regionsbalancing mit rotierten Forst-Ids (Nordwald→12, Südforst→11,
Ostforst→10) und L3-Erstwahl {7,12}. **Save v19** (Weltumbau, Backup/Neustart
`cmb.save.backup.world-v18`). Entscheidung **D-033**.
**v0.81 = S3 erledigt (D-034) — seit v1.24 durch D-045 ABGELÖST (kein Nebel mehr,
gesperrtes Land wird entsättigt gezeigt; der folgende Absatz ist Historie):**
Fog of War als EINE weiche, zusammenhängende
Wolkenfront statt Pro-Region-Kapseln — globale absolute Nebelhöhe (`worldFogTopY`)
+ `alphaHash`-Dithering; **Kamera-Clamping neu** (`CameraExplorationBoundary` hält
das Blickziel über der freigeschalteten Union, weiches Randband) mit getrenntem
Dev-Cheat `cameraBoundsDisabled`; Unlock zieht nur den Nebel zurück (Fade nie neu
erzeugt). Rein visuell/navigatorisch, **keine Save-Änderung** (v19). Offen:
**S4** Vegetations-Performance (Chunking/HLOD/Shader-Wind — enthält den
inkrementellen Deko-/Vegetations-Neuaufbau bei Unlock) · **S5** lebendige Welt
(Mammutbäume/Tiere) · **S6** Sägewerk-Arbeitsmodus (3D-Kreiswerkzeug/Raycast/
Overlay, baut auf A1–A5) · **S7** Steinbruch/Farm · **S8** weitere Betriebe.
Reihenfolge zwingend (§24). Nichts Fehlendes in der UI vortäuschen.

## Status: Infrastruktur 2.0 — Höhenstraßen/Brücken/Schifffahrt (v0.84+, AKTIV)
Auf ausdrücklichen Nutzerwunsch **vorgezogen**; die 10.0-Phasen R2–R6/R9 sind
**zurückgestellt** (nicht gestrichen). Master-Spec:
`docs/agents/INFRASTRUCTURE_2_PLAN.md`, Entscheid **D-036**. **v0.84 = I1 erledigt:**
Höhenstraße `road_elevated` (ab L2) überwindet Wasser (Brücke) und Klippen (Viadukt)
als **Straßen-Bauklasse** (`BuildingDef.road?: RoadClassDef`) über denselben
`roadNetwork`/`validatePlacement`/`analyseRoadPath` — **kein zweites Verkehrssystem
(§2)**. Automatische Brückenlogik pro Kachel; Deck/Pfeiler prozedural
(`buildBridgeDeck`); Kosten holzbasiert + Pfeiler-Aufschlag (gezeigter = gezahlter
Preis). **Save v20 unverändert (additiv)** — Höhenstraßen sind Gebäude-Instanzen.
**v0.85 = Testbefund-Fixes (Save v20):** Höhenstraßen-Kosten zeigen jetzt **alle**
Materialien inkl. Holz + konkreten Fehlbetrag (§18.3, nicht nur „Stadtbudget");
das isolierte Ein-Kachel-„Braucht Anschluss…"-Banner erscheint beim Straßenplanen
nicht mehr (Planer ist alleinige Instanz). Zusätzlich: **Steinbruch baubar auf Fels**
via additivem `BuildingDef.buildsOnRock?: { maxSlope? }` — flache Felsschelfe (echte
Steilheitsgrenze), Wasser/senkrechte Wand/gesperrte Region bleiben tabu; kein neues
Platzierungssystem (§2).
**v0.86 = I2 erledigt (= R6, Save v20):** terrainbewusster Straßen-Router
`src/game/roads/roadRouting.ts` (gewichtetes deterministisches Dijkstra) verbindet
**Kontrollpunkte** lückenlos über bebaubares Gelände — Bodenstraße meidet Wasser/
Klippen, Höhenstraße überbrückt sie. **Passierbarkeit = `validatePlacement`**
(`needs_road` passierbar), `analyseRoadPath` bleibt die Wahrheit — **kein zweiter
Verkehrsgraph (§2/§8)**. Vorschau grün/gelb/rot; neuer **atomarer** Command
`buildRoadPath` (alles-oder-nichts, kein halber Stummel); `roadPathPreview` routet
vor der Prüfung (benachbarte Punkte idempotent → Bestandstests unverändert). UI:
`pushRoadPoint` statt `extendRoadDraft`.
Offen: **I3** Küste/Anleger als Netzknoten (= R9) · **I4** Schifffahrtsnetz
(persistente Routen, lineare Migration) · **I5** Bevölkerungs-Rebalancing +
Infrastruktur-Netz-UI. Reihenfolge = Umsetzung. Nichts Fehlendes vortäuschen;
Kontrollpunkt-Griffe, Live-Mauszeiger-Vorschau und Kurven-Snapping sind
dokumentiert offen.

## Status: § Spielbarkeit 9.1 — Stadtarbeit/Zeit/Frühlogistik/Anlegernetz/Perf (v0.87+, AKTIV)
Auf ausdrücklichen Nutzerwunsch **vorgezogen** vor Infrastruktur-2.0 I3–I5 (die
Anlegernetz-Arbeit I3/I4 „voll ausgebaut" ist jetzt **Phase P-D**). Entscheid
**D-037**; Phasen P-A…P-E, Reihenfolge = Umsetzung, jede ein testbarer Meilenstein.
**v0.87 = P-A erledigt (Save v21):** Lieferaufträge springen während der Planung
nicht mehr. Ursache war eindeutig: `getActivityRoutePlan` würfelte die Ziele bei
**jeder** UI-Abfrage neu aus der **pro Tick weiterlaufenden Sim-RNG**. Fix: **ein
einmalig eingefrorener, deterministischer Planungssnapshot** `activities.selection`
(`pickTargetsSeeded`/`activitySelectionSeed` aus stabilem Seed, **nie** `rngSeed`) —
kein zweites System, nur ein State-Feld. Lebenszyklus als Commands
(`selectActivity` idempotent, `refreshActivitySelection` Epoch+1,
`clearActivitySelection`; `startActivity` räumt ihn). **Keine automatische
Zielersetzung** — ein Abriss meldet `getActivitySelectionStatus='stale'`, die UI
zeigt Aktualisieren/Abbrechen. **Save v21 additiv** (Migration v20→v21). Audit:
`docs/agents/ACTIVITY_STABILITY_AUDIT.md`.
**v0.88 = P-B1 erledigt (Save v21):** EINE verbindliche Ingame-Zeit. Befund: die
Simulation war schon konsistent (`advanceByRealTime × Geschwindigkeit` treibt alle
Systeme durch einen Takt) — nur die **Anzeige** war entkoppelt (kosmetische
Renderer-Tageszeit + statische „Tag 1"/„Frühling"). Fix: kanonisches Zeitmodul
`src/game/time/gameTime.ts` (`SIM_MS_PER_GAME_MINUTE`; 1× → 1 Ingame-Min je
**4 Echtzeit-Sek**, voller Tag = 96 Echtzeitmin bei 1×) + Read `getGameClock()`; HUD
zeigt Tag N · HH:MM · Jahreszeit · Pausiert als **reine Projektion** (kein
`setInterval` in React). Fake-Zeitregler + `dayLengthMin`-Hack entfernt. **Sonne an
die Uhr gekoppelt** (v0.89, Nutzerentscheid): `timeOfDay` folgt der Uhr, Pause hält
die Sonne an; Wetter-Panel nur noch Atmosphäre. Doku:
`docs/agents/INGAME_TIME_SYSTEM.md`, **D-038**.
Offen (Reihenfolge): **P-B2** Dauern in Ingame-Minuten + Rebalancing (§9) ·
**P-C** Frühlogistik (Handkarren ab L2: Holz Sägewerk→Rathauslager) +
Rathaus-/Lagerübersicht · **P-D** Anleger-zu-Anleger-Netz (Straßenstart am isolierten
Landanker, gemeinsamer Infrastrukturgraph, Schiffsrouten; = I3/I4) · **P-E**
Performance-Pass + dauerhafte gedrosselte FPS-Anzeige. Nichts Fehlendes vortäuschen.

## Status: Map Flattening + Buildability Overhaul erledigt (v1.11, Save v25, D-040)
Die Insel ist **außerhalb des zentralen Massivs eingeebnet**; Bauplätze für 3×3/4×4
haben sich ungefähr **verdoppelt** (Bebaubar-Maske 25.161 → 38.126). Das Massiv ist
unangetastet — entfernt wurden 1.647 Streu-„Gebirgs"-Kacheln **unter Höhe 4**
(Steilheits-Artefakte im Tiefland). Küste gekippt: flaches Ufer 1.453 → 2.485 gegen
Steilküste 1.937 → 905. **Entscheidend (D-040): Das Terraforming läuft im Bake NACH
der Regionssegmentierung** (`tools/bakeWorld.mjs` §8a-flat) — deshalb sind
`islandRegions.gen.ts`, Startregion 9 und Rathaus (127,250) **bitgleich** und
`regions.config.ts`/Balancing/Spielstände bleiben gültig (Save v25 = reine
Weltmarkierung, **kein Neustart**). Wer am Bake arbeitet, muss diese Reihenfolge
erhalten. Toleranzen liegen im reinen Sim-Modul `src/game/buildings/terrainFit.ts`
(Höhenbudget nach Footprint-Kantenlänge, Bebaubar-Toleranz, `GROUND_ROAD_MAX_SLOPE`,
Sockelhöhe); `validatePlacement` bleibt die **einzige** Platzierungsinstanz (§2), der
Renderer liest dieselben Werte. Verbindlich vor Gelände-/Platzierungsarbeit:
`docs/agents/MAP_FLATTENING_AND_BUILDABILITY_PLAN.md`. Offen (nicht vortäuschen):
echtes Mesh-Einebnen unter dem Footprint, Pfahl-/Steglogik für Wassergebäude.

## Status: STADTARBEIT P4 — JEDE WARE LIEGT AN EINEM ORT (v1.34, Save v32, D-052) — AKTUELL
§8 des Auftrags („Keine globale magische Ressource. Jedes Lager hat eigene
Bestände") ist umgesetzt; zugleich **Phase 4** des Folgeauftrags „Stadtarbeit
Overhaul 2.0". **Invariante:** `state.resources[r] === Σ Bestand aller
Stadtlager[r]` (Geld ausgenommen). `state.resources` bleibt die **Bilanzsumme**,
die Baukosten/Verbrauch/Quests/Balancing unverändert lesen —
`src/game/economy/stockLedger.ts` sagt zusätzlich, **wo** die Ware liegt.
**Kein drittes Lagermodell (§2/§8):** dasselbe `BuildingInventory`, dieselbe Map
wie die Betriebslager aus Save v17. Möglich durch eine Messung: von 34
Gebäudetypen haben **3** ein Betriebslager (Sägewerk/Steinbruch/Farm), **7** eine
`storage`-Wirkung (Rathaus, Distriktzentrum, Lagerhaus, Wasserwerk, Markt,
Anleger, Flusshafen) — und **keines beides**; `tests/stockLedger.test.ts` prüft
das zuerst.
**Zwingend (D-052).** (1) **Die Ableitung gibt die ORTE heraus, nicht nur die
Summe** — `Derived.storageSites` entsteht in derselben Schleife über denselben
`case 'storage'` wie `storageCaps` (Fortsetzung D-042/D-049). (2) **Der Abgleich
läuft an EINER Stelle**: `state.resources` wird an 31 Stellen in 8 Modulen
verändert, deshalb reconciliert `GameController.notify` (und der Konstruktor beim
Laden) — ortsgenaue Vorgänge gehen über `withdrawStock`/`depositStock`.
**Spielbar:** Der Ladeort ist eine Wahl mit Folgen (Entnahme und Rückgabe treffen
genau dieses Lager; zu wenig Vorrat ⇒ kein Start). Vorher entschied stumm die
alphabetische Gebäude-Id. Volle Ladung = 72 % Tempo (`loadedTileSpeed`).
**Ehrliche Grenze (nicht vortäuschen):** Nur `storage`-Gebäude haben einen
eigenen Bestand — **Farm, Sägewerk, Pumpwerk, Feuerwache sind Abholpunkte ohne
Lager**; dort bleibt die Ware die Bilanz der Stadt. Save **v32** (Migration
`v31→v32`, Alt-Saves behalten alles).
**ZUERST ENTSCHEIDEN — D-053:** Der Folgeauftrag verlangt eine **isometrische
Weltkamera statt der 2D-Karte** und die Route als **Aufzeichnung der gefahrenen
Strecke**. Das **kehrt D-050/D-051 um** (beide fielen auf ausdrückliche
Rückfrage) und ist deshalb vorgelegt, nicht still umgesetzt. §11 des neuen
Auftrags verlangt weiterhin keinen zweiten Renderer — Empfehlung: Kamera-Modus
des bestehenden `ThreeMapRenderer`. Offen und nicht vortäuschen:
Gebäude-Interaktion auf der Karte, Nachladen unterwegs, freie Stoppreihenfolge,
Verkehrsrückkopplung, Häfen als Netzknoten.

## Status: STADTARBEIT P3 — DIE LOGISTIKKARTE IST DIE WELT (v1.33, Save v31, D-051)
Auftrag „Stadtarbeit Overhaul — aktives Logistiksystem + 2D-Kartenansicht aus der
3D-Welt" (§§1–13, vier Mockups). **Umgesetzt: §3/§4 (Karte aus der echten Welt),
§5 (Infrastruktur), §6 (einfacheres Fahren), §12 (LOD/Leistung), §13 (Doku) und
der Fahr-Status aus §10. §7/§8/§9/§10-Layout sind offen und dürfen in der UI
nicht vorgetäuscht werden.** Verbindlich vor Kartenarbeit:
`docs/agents/CITYWORK_MAP_PIPELINE.md`.
**Befund, der den Auftrag präzisiert:** Die 2D-Ansicht war **nie** eine
Fake-Karte — Terrain, Regionen, Straßen und Gebäude kamen schon vorher aus dem
echten Spielstand. Gefehlt hat alles, woran man eine Landschaft **erkennt**:
Höhe, Bewuchs, Küstenform. Erst den Arbeitsbaum prüfen, dann die Aufgabenliste.
**Zwingend (D-051): Die Draufsicht hat KEINE eigenen Weltdaten.** Genau eine
Leseinstanz — `src/renderer/worldProjection.ts`, frei von `three`/`react`/Canvas
— liefert Kachelabtastung, Hangschattierung, Kachelfarbe, die Regel für
gesperrtes Land und die Vegetation über **`collectRegionNature`**, dieselbe
Funktion, aus der die 3D-Welt wächst (D-042/D-044). `tests/worldProjection.test.ts`
vergleicht das über ein Weltraster und Instanz für Instanz. Wer die Karte um eine
Weltinformation erweitert, ergänzt sie **dort**; ein zweites Grid-Lesen ist der
erste Schritt zu einer zweiten Welt. Abgeleitet statt erfunden gilt auch für die
Beschriftung: Straßenklasse aus `roadEngineering.variant`, Infrastruktur-Marker
aus den Config-Wirkungen (`storage`/`logistics`/`waterfront`/`operation`) — eine
Straßen**hierarchie** existiert im Spiel nicht und wird nicht vorgetäuscht.
**Teure Ebenen hängen am Freischaltzustand, nie an der Belegung** (D-045): Props
unter Gebäuden werden beim Zeichnen verdeckt, nicht aus der Verteilung entfernt.
**Fahren ersetzt, nicht ergänzt (D-050 gilt weiter):** Das Fahrzeug sitzt immer
auf einer Kante zwischen zwei Straßenkacheln (`{from, to, t, speed}`), Pose wird
**abgeleitet** (`drivePose`); W Gas, S Bremse/Rückwärts, A/D Abzweigung, sonst
folgt es der Straße. Die frühere Frage „hart blockieren oder weich zurückziehen?"
entfällt ersatzlos. Tempo aus `speedKph` des Fahrzeugs.
**Zwei Messbefunde:** (1) Die Insel hat **keinen Gewässergrund** — tiefste Stelle
5,06 m, 94 % der Wasserkacheln bei 2–3 m; die geschätzte 7-m-Tiefenrampe hätte
das Meer flächig gemacht. (2) `anchors` im Abhängigkeitsarray der Fahrschleife
(ein `useMemo` über `game.version`) warf das Fahrzeug bei **jedem** erreichten
Stopp an den Start zurück — dort steht jetzt der Startpunkt als **Wert**.
Gefunden hat das der Smoke im laufenden Spiel, kein Test.
Keine Save-/Sim-/Balancing-Änderung, **v31**. Nächster Schritt: **P4
Lagerbestände je Gebäude** (die einzige echte Simulationsarbeit; lokale Inventare
gibt es schon in `operations/**` — zusammenführen, kein drittes Lagermodell,
Migration v31→v32).

## Status: STADTARBEIT P2 — SELBST FAHREN IN DER 2D-KARTE (v1.30, Save v30, D-050)
Nutzerentscheid zum D-039-Konflikt: **D-039 bleibt bestehen**, die Automatik
bleibt der Standard — Fahren wird eine **Variante**. Und: gefahren wird in der
**bestehenden 2D-Stadtarbeitskarte** (dort, wo die Route mit der Maus gezogen
wird), **nicht in der 3D-Welt**; kein zweiter Renderer, keine Rückkehr zu einem
alten 2D-Spielmodus. `TransportMode = 'auto' | 'manual'` liegt auf
`ActiveActivity` (**Save v30**, additiv, `v29→v30`); die Wahl fällt beim Start
und ist danach **unveränderlich** (`setActiveActivityRoute` rührt sie nicht an —
sonst wäre der Aufschlag nach der bequemen Hälfte nachkaufbar). Bei `manual`
steht der Missionswagen still, statt die Tour selbst zu Ende zu fahren.
Aufschlag +20 % aus `activitiesConfig.manualDriveBonusFactor`; der **angezeigte**
Wert kommt aus derselben `modeRewardFactor`, die auszahlt (D-048).
**Zwingend (D-050): EIN Auftragsmodell und EINE Fahrphysik.**
`activities/transportOrder.ts` hält `{start, cargo, vehicle, stops, targets,
priority, mode}` und ist eine reine **Projektion** der bestehenden
`CargoRouteEvaluation` — es rechnet keine Menge und keinen Weg nach (§2/§8).
`activities/driving.ts` trägt den Fahrschritt als reine Funktion; **3D-Renderer
und 2D-Karte rufen dieselbe** `stepDrive`/`reachedTarget` — hätte die Karte ihre
eigene Physik bekommen, gäbe es zwei Reichweitenregeln und zwei Balancings. Die
Fahrt läuft im vorhandenen Canvas über eine rAF-Schleife an React vorbei (§6);
Straßen/Zeichenfunktion/Rückrufe kommen über `liveRef`, weil sie bei **jedem**
Command die Identität wechseln — im Abhängigkeitsarray würde ein erreichter Stopp
die Fahrt an den Start zurückwerfen.
**Befund:** `enterDrive` war im laufenden Spiel **gar nicht erreichbar** (einziger
Aufrufer: das nirgends gemountete `CityWorkPanel`). Der 3D-Fahrmodus ist jetzt
nicht mehr verdrahtet; sein Code bleibt vorerst stehen und teilt die neue Physik.
Offen (nicht vortäuschen): `priority` ist deklarierter Vertrag **ohne Wirkung**
(nicht persistiert, nicht in der UI) · **P3** Lagerbestände je Gebäude (einzige
echte Simulationsarbeit, mit Migration — ohne sie ist das Nachlade-Panel eine
Attrappe) · **P4** Stoppliste + „Ziel außerhalb Reichweite" · **P5** UI nach
Mockup · **P6** Verkehrsrückkopplung · **P7** Fähren.

## Status: Stadtarbeit-Overhaul Phase 1 + „immer Tag" (v1.29, Save v29)
Auftrag „Stadtarbeit Overhaul / Manuelle Logistik & Verkehrssystem" mit Mockup,
Phasenplan 1–7. **Umgesetzt: Phase 1 (Bestandsaufnahme) + Punkt 11 (Zeitsystem).
Phasen 2–7 sind offen und dürfen in der UI nicht vorgetäuscht werden.**
Verbindlich vor jeder Stadtarbeit-Änderung: `docs/agents/CITYWORK_OVERHAUL_AUDIT.md`.
**Immer Tag:** `EnvironmentSettings.visualTimeMode: 'day_only' | 'dynamic'`
(Standard `day_only`, `DAY_ONLY_TIME_OF_DAY = 0.36`). **Durchgesetzt in
`sanitize`, also am Wert selbst** — `SkyEnvironment`, Laternen-Glows und
Sonnen-Grading lesen `timeOfDay` direkt; ein Filter nur beim Schreiber hätte
einen alten `localStorage`-Eintrag die Welt in der Nacht gehalten (erledigt
zugleich die Migration). Die Sonnenkopplung aus D-038 läuft nur noch bei
`dynamic`. **Die Uhr ist unberührt** — `gameTime.ts` bleibt die eine
Simulationsuhr, Tag/Uhrzeit/Jahreszeit und alle zeitabhängigen Systeme laufen
weiter; `tests/visualTimeMode.test.ts` prüft genau diese Trennung. Kein Save-Feld
(`cmb.environment` ist eigenständig), **v29**.
**Messung, die den Auftrag verschiebt:** Das manuelle **WASD-Fahren existiert
bereits vollständig** (`enterDrive`/`updateDrive`: Arcade-Dynamik, Pfeiltasten,
Q/ESC, Verfolgerkamera, Straßenbindung) — Akzeptanzkriterien 1–3 sind erfüllt,
das Problem ist die Erreichbarkeit (**8 von 28** Aktivitäten tragen `drive`, fünf
Schritte bis zum Lenkrad). Das „Excel"-Gefühl kommt aus dem Planer: 2.125 Zeilen
Stadtarbeit-UI, davon **1.346 (63 %) reine Planung** gegen 46 Zeilen Fahr-HUD.
Verkehr existiert mit den vier Mockup-Stufen, aber `congestionScore` kommt aus
der **Anrainerdichte**, nicht aus Fahrzeugen (fehlt: die Rückkopplung).
**Schwerster Befund — Simulation, nicht UI:** Stadtarbeit kennt **keine
Lagerbestände je Gebäude** (globaler Pool), das Nachlade-Panel des Mockups zeigt
aber drei verschiedene Bestände; darauf gebaut wäre die Wahl des Lagers eine
Attrappe. Lokale Inventare existieren bereits im Betriebssystem — zusammenführen,
**kein drittes Lagermodell** (§2/§8).
**Zwei benannte Konflikte:** (1) Manuelles Fahren widerspricht **D-039 Active
Simplicity** („automatisiert wird Ausführung, nie Wahl"; löst A5/D-032 als
Bedienkonzept ab). Wird der Auftrag umgesetzt, **muss D-039 ausdrücklich geändert
werden** — Vorschlag: Fahren als *Wahl* (selbst fahren mit Bonus oder fahren
lassen). (2) Das Mockup zeigt „2D ANSICHT"; der 2D-/Iso-Renderer bleibt entfernt,
gemeint ist eine **Planungsansicht** im Three-Renderer.

## Status: G2 ⑤ — DER WIRKUNGSRADIUS IST EIN QUADRAT (v1.28, Save v29, D-049)
Terrainfolgend war das Overlay längst — falsch war die **Form**. Die Reichweite
ist `chebyshev(...) <= radius`, also ein achsenparalleles **Quadrat**; übergeben
wurde nur `radius`, der Renderer riet euklidisch und zeichnete den
eingeschriebenen **Kreis**. Gemessen über alle Radiusgebäude blieben **19–30 %
der wirklich versorgten Kacheln unsichtbar** (Brunnen r9: 108 von 361 · Markt
r14: 168 von 784 · Krankenhaus r18: 360 von 1.369 · Feuerwache Stufe 3 r32: 868
von 4.096). Der Fehler war **einseitig** — nie zu viel versprochen, immer zu
wenig gezeigt —, deshalb unauffällig für jeden, der nur „stimmt der Radius?"
prüft: wer seine Wohnhäuser an der gezeichneten Kante ausrichtet, verschenkt ein
Fünftel bis knapp ein Drittel jeder Versorgungsanlage.
**Zwingend (D-049): Wo eine Regel über eine Fläche entscheidet, gibt die
Simulation die FLÄCHE heraus, nicht bloß die Zahl, aus der sie folgt.**
`CoverageSourceView.area` trägt sie (`coverageArea`/`coverageAreaAround`/
`coversTile`), und `addTerrainCoverageVisual` nimmt eine `CoverageArea` statt
Mitte + Radius — die Signatur macht das erneute Raten unmöglich. Ein Parameter
ohne seine Metrik ist keine gemeinsame Quelle, sondern eine Einladung zum
zweiten Modell (Fortsetzung D-042/D-047/D-048). Testpflicht ist die
Deckungsgleichheit über ein **volles Kachelfenster**, plus der alte Kreis als
Gegenprobe. Zweiter Teil: **der Radius erscheint beim Überfahren** (vorher nur
nach einem Klick, und ein Klick öffnet das Gebäudefenster); die Auswahl behält
Vorrang, während einer Platzierung gehört die Fläche dem Ghost, und gesucht wird
mit **derselben** Abfrage wie beim Klick (`pickBuildingAt` + Kachelbelegung für
flache Bauten). Das Arbeitsgebiets-Overlay der Betriebe ist aus demselben Grund
ebenfalls quadratisch. Keine Save-/Sim-/Balancing-Änderung, **v29**. Offen (nicht
vortäuschen): mehrere Radiusgruppen je Gebäude zeigen weiter nur die erste;
**gefunden, nicht behoben (Sim, nicht Render):** `nodesInWorkArea` bietet Knoten
aus `workAreaBounds` an, `previewOperation` verwirft aber alles jenseits von
`chebyshev(mitte, …) > maxRadius` — 120 Kacheln beim Sägewerk, 128 beim
Steinbruch, 171 bei der Farm. Danach ⑥ Straßenbau als Plan→Vorschau→Bestätigen.

## Status: G2 ④ — VERSCHIEBEN IST EIN ENTWURF (v1.27, Save v29, D-048)
`ThreeMapRenderer.setMoving()` war ein **No-op** mit einem Kommentar auf den seit
Ausbaustufe 2.0 entfernten 2D-/Iso-Modus. Dahinter stand kein Schönheitsfehler:
**14 von 34 Gebäuden tragen `canRelocate`** und zeigen einen „Versetzen"-Knopf
(Rathaus ab Minute eins, dazu Sägewerk, Steinbruch, Farm, Wasserwerk,
Krankenhaus …) — der Knopf setzte `movingBuildingId`, das Banner erschien, und
danach passierte **nichts**: kein Ghost, keine Ursprungsmarkierung,
`RendererCallbacks.onMove` wurde vom 3D-Renderer **nie** gerufen, Ausweg nur ESC.
Seit A6/D-046 wiegt das doppelt — **Stein wächst nie nach**, der Steinbruch läuft
planmäßig leer und **muss** umziehen; genau diese Bewegung war unausführbar.
Jetzt bleibt das Gebäude logisch und sichtbar stehen, nur der Ghost wandert; der
Ursprung ist markiert (`moveOriginGroup`), Abbruch wirkt auf nichts, und der
Bestätigungsklick ist **genau ein** Command (Id/Stufe/Betrieb bleiben — kein
Abriss + Neubau). **Eine** Ghost-Strecke für beides: `placementDraft()`
beantwortet „was hängt am Cursor", `isPlacing()` heißt jetzt „es hängt ein
Entwurf am Cursor".
**Zwingend (D-048): Wo ein Command zusätzliche Bedingungen kennt, wird sein
Prüfteil als reine Funktion herausgezogen und die Vorschau ruft GENAU DIESE auf.**
`evaluateMove` trägt `moveBuilding` **und** `moveDiagnostics` — sonst ist der
Ghost grün, wo der Command mit `feature_disabled`/`insufficient` ablehnt
(`validatePlacement` kennt weder `canRelocate` noch Gebühr noch Budget). Der Umzug
braucht zwingend `ignoreBuildingId`, sonst meldet die eigene Grundfläche
`occupied`. `MoveBlocker` = deklarierte Obermenge von `PlacementError`; Testpflicht
ist die Deckungsgleichheit über einen **Kachelstreifen**, nicht der Einzelfall.
Die Warnstufe aus D-047 gilt weiter (Umzug vom Netz weg → bernstein). Keine Save-/
Sim-Änderung, **v29**. Offen (nicht vortäuschen): Ghost zeigt das **Stufe-0-Modell**,
kein Drag-and-Drop, „Versetzen" liegt zwei Klicks tief (Sheet-Pass, nicht G2).
⑤ Radien-Overlays ist mit v1.28 erledigt (siehe oben); danach ⑥ Straßenbau als
Plan→Vorschau→Bestätigen.

## Status: G2 ③ — DER GHOST ZEIGT DEN ANSCHLUSSPUNKT (v1.26, Save v29, D-047)
Die Platzierungsvorschau beantwortet zwei Fragen statt einer: „darf hier gebaut
werden?" **und** „wird das hier arbeiten?". Von den fünf Punkten, die OPEN_TASKS für
③ nannte, waren vier längst umgesetzt (GLB-Ghost, Rotation, Sockel, Radius) — wieder
gilt: **erst den Code prüfen, dann die Aufgabenliste.** Der offene fünfte war kein
Schönheitsfehler: **`requiresRoad` tragen 23 von 34 Gebäuden, aber `needs_road`
blockiert ausschließlich Straßen selbst.** Ein unverbundenes Wohnhaus ist legal
platzierbar und liefert danach laut `isInfrastructureOperational` weder Produktion
noch Kapazität noch Versorgung; im Startzustand waren **3.652 von 3.721** geprüften
Kacheln gültig UND ohne Anschluss (die Startstadt hat fünf Straßenkacheln).
**Zwingend (D-047): `connectedRoadTiles` in `placement.ts` ist die EINZIGE Aufzählung
der Anschlusskacheln** — `isConnectedToRoad` leitet sein Ja/Nein daraus ab, sonst
könnte ein Marker auf eine Kachel zeigen, die die Prüfung nicht zählt (Fortsetzung
D-042). Der Ghost liest außerdem **eine** `placementDiagnostics`-Projektion statt drei
Einzelabfragen (`validatePlacement` + `getWaterfrontPlacementPreview` +
`locationBonusPct`); Ghost, Banner und Wasserfront-HUD können dieselbe Kachel damit
nicht mehr unterschiedlich beschreiben. Sichtbar: Marker auf den Anschlusskacheln
sowie eine eigene **Warnstufe zwischen gültig und ungültig** — bernsteinfarbener
Ghost + Banner „Baubar — aber ohne Straßenanschluss bleibt der Betrieb ohne Wirkung"
(bei der Stadtgründung unterdrückt, dort gibt es planmäßig noch keine Straße). Wer
eine weitere „erlaubt, aber wirkungslos"-Bedingung findet (Energie, Arbeitskräfte,
Wasserzugang), ergänzt sie als **Warnstufe, nie als Platzierungsregel**. Keine Save-/
Sim-Änderung, **v29**. Der hier als Nächstes vermerkte Punkt **G2 ④ Verschieben**
ist mit v1.27 erledigt (siehe oben).

## Status: A6 Steinbruch + A7 Farm — DREI AKTIVE BETRIEBE (v1.25, Save v29, D-046)
Das Sägewerk ist nicht mehr der einzige aktive Betrieb. Steinbruch und Farm nutzen
**dieselbe** Knoten-/Arbeiter-/Lagerschleife (§2, kein zweites System):
Ressourcenknoten sind auf `tree`/`rock`/`crop` verallgemeinert
(`RESOURCE_NODE_PROFILES` in `operations/nodes.ts` = EIN Profil je Knotentyp),
**Stein wächst nie nach** (`regenerationMs: undefined` → der Bruch läuft leer und
muss umziehen), der Logistik-Zuschlag eines Depots wirkt bei aktiven Betrieben über
`derived.logisticsBoost` auf Arbeits-/Laufgeschwindigkeit statt auf eine Passivrate.
Stufen sind auf die früheren Passivraten kalibriert (38/80/210 Stein, 260/500/1.100
Nahrung je Minute) — testgesichert, die Progression kippt nicht.
**Bedienung (der eigentliche v1.25-Anteil):** `src/components/operations/
nodeVocabulary.ts` hält **ein** Wortfeld je Knotentyp (total über die
Knoten-Union → der Compiler fordert neue Typen ein); Endlichkeit ist sichtbar
(Restmenge im Arbeitsgebiet + Umzugshinweis) — aber **nur** bei nicht
nachwachsenden Vorkommen, sonst wäre die Zahl irreführend. **D-046: Zustandsmengen,
die die UI beschriftet, werden als `as const`-Liste exportiert** (erster Fall
`OPERATION_IDLE_REASONS`) — `t()` gibt bei fehlendem Eintrag den Schlüssel zurück,
TypeScript kann das nicht fangen, ein aufzählender Test schon.
**Achtung bei Bestandsspielständen:** Gebäude mit `operation` überspringen den
passiven `produce`-Pfad — vorhandene Steinbrüche/Farmen liefern erst wieder nach
einmaligem „Betrieb starten" (das Gebäudefenster weist darauf hin). **Kein
Schemabruch, Save bleibt v29.** Offen (nicht vortäuschen): A8 Feuerwehr-Dispatch,
A9 Regeneration-Ausbau, A10 Automatisierung, Rechteck-/Polygon-Arbeitsgebiete,
Abbau-/Fällanimationen, echtes Knoten-Mesh-Raycast.

## Status: Welt lädt vollständig — ENTSÄTTIGUNG STATT NEBEL (v1.24, Save v29, D-045)
Nutzerauftrag: „Ich will dass die welt trotz nicht freigeschalteten biomen schon
lädt, also etwas anderes als nebel"; Rückfrage entschieden auf **entsättigt +
Schloss-Marker** und **freie Kamerasicht auf die ganze Insel**. Die **ganze Insel**
wird jetzt ab dem ersten Frame gebaut — Gelände, Küsten, Deko, Vegetation, auch
gesperrt. **Entfernt:** die blickdichte Wolkenwand aus D-034,
`fogSurfaceGeometry.ts` (+ Test), `regionContours`, `worldFogTopY`, die
`CameraExplorationBoundary` und die gesamte `cameraBoundsDisabled`-Verkabelung.
Gesperrt = **entsättigt** (70 % Richtung eigener Luminanz, 16 % dunkler, minimal
kühler: `LOCKED_DESATURATION`/`LOCKED_DARKENING`) plus schwebender Schloss-Marker;
die Minimap zeigt dasselbe entsättigte Terrain statt ihrer Wolkendecke.
**Zwingend (D-045): zwei Vegetationsaufbauten mit getrennten Schlüsseln.**
Sichtbares gesperrtes Land ist bewachsen (1.422 → **26.851** Instanzen), und der
Vegetationsschlüssel enthält die **Belegungsmenge** — ein gemeinsamer Schlüssel
hätte bei **jedem Bauklick** die ganze Insel neu aufgebaut. Gesperrte Regionen
hängen nicht an der Belegung: eigener Schlüssel (Regionsliste + Qualitätsstufe),
halbe Dichte (`LOCKED_VEGETATION_DENSITY`), keine Schatten (das knappe
Schattenbudget gehört der Stadt). Gemeinsame Implementierung `buildVegetationFor`;
Verteilung bleibt `collectRegionNature` (D-042/D-044 unberührt). Jede Messung über
die Vegetation muss **beide** Gruppen erfassen. Sichtbarkeit ist keine Mechanik —
`regionUnlockBlocker`, Baubarkeit und Kosten sind unverändert, **Save bleibt v29**.
Offen (nicht vortäuschen): deutlichere Regionsgrenzen in der Welt, Hover-/
Auswahl-Hervorhebung gesperrter Regionen, echte LOD-Stufen für die größere Masse.

## Status: Natur-/Prop-Overhaul 14.0 — DIE INSEL IST BEWACHSEN (v1.23, Save v29, D-044)
Auftrag mit Mockup: die Welt wirkt „zu leer, zu technisch, zu steril und zu
gleichförmig"; Geometrie ausdrücklich unangetastet lassen. **Zwei Messungen
erklären den Zustand vollständig:** weltweit standen **14.038 Props auf 51.057
Landkacheln, davon nur 502 echte Modelle (3,6 %)** — der Rest ein Kegel auf einem
Zylinder, weil **jedes Natur-`.glb` rund 29.000 Dreiecke** wiegt; und der Katalog
ist kleiner als seine Dateinamen (`pine_tree` = `forest_cluster_small` =
`forest_cluster_medium`, alle fünf Steine bytegleich → real **fünf** Formen).
**Deshalb D-044: die Masse ist stilisierte Low-Poly-Geometrie (24–200 Dreiecke),
die `.glb` bleiben seltene Blickfänger.** Vielfalt entsteht aus Transformation
(Größe/Drehung/Neigung/`setColorAt`), nie aus zusätzlicher Geometrie.
Die Verteilung folgt **acht Naturzonen** (`forest_core`/`forest_edge`/`meadow`/
`rocky_highland`/`coast_flat`/`coast_rocky`/`wetland`/`small_island`); Waldkern
gegen Waldrand trennt der **Waldanteil im 5×5-Fenster** (der Terraintyp kennt
keine Kante). **Eine** Tabelle (`NATURE_SPAWN_RULES` in `natureZones.ts`) hält
Dichte, Clusterbindung, Größenband und Terrainbindung; Stellschrauben in
`NATURE_TUNING`. Fünf neue Arten: `sapling`, `stump`, `shoreRock`, `scree`,
`cliffRock`. Regionale Identität über `REGION_CHARACTER_DENSITY`.
**`natureDistribution.ts` ist die EINZIGE Verteilungsinstanz — Renderer und Tests
rufen dieselbe Funktion (D-042); kein Nachbau in Tests.** `rebuildVegetation`
schrumpfte 605 → 152 Zeilen und entscheidet nichts mehr über Verteilung.
Ergebnis **14.038 → 48.838 Props**, **kein Regionsbudget begrenzt mehr die
Dichte** (testgesichert). Keine Geometrie-, Save- oder Simulationsänderung
(Save bleibt v29); D-043 unberührt. Verbindlich vor Vegetations-/Proparbeit:
`docs/agents/NATURE_OVERHAUL_14_PLAN.md`. Offen (nicht vortäuschen): echte
LOD-Stufen und Impostoren für die stilisierte Masse, Shader-Wind, neue
Prop-Assets, Bergplattformen als Terrain-Klasse.

## Status: Modelltreue 13.1 — WASSER AN DER TERRASSENKANTE (v1.22, Save v29)
Spieltest-Nachlauf: „Das Wasser so anpassen, dass es exakt mit der unteren Kante
der flacheren Ebenen abschließt, sodass man dort perfekt Hafen etc. platzieren
kann." Histogramm der flachen Landkacheln über der alten Wasserlinie: **0–3 m =
331** (die Klippenwand), **4–5 m = 14.073** (die unterste Terrasse). Das Wasser
steigt deshalb um **4 m**. Sweep 0/3/4/5 m belegt den Punkt: 2×2-Anlegerplätze
**20 → 344**, bebaubare Uferkacheln **129 → 759**, Baufläche praktisch unverändert
(37.841 → 37.798); bei 5 m säuft die Terrasse selbst ab (−10.000 Landkacheln).
**Entscheidend: `HEIGHT_SCALE` hängt jetzt an `SCALE_REFERENCE_N`, nicht an der
Wasserlinie.** Sonst hätte jeder Meeresspiegel-Wechsel das Gelände vertikal
gestreckt — Geländeänderung durch die Hintertür. Das Gelände steht still, das
Wasser steigt; der Gipfel liegt ehrlich niedriger über dem Wasser (52 → 48 m).
Modelltreue unverändert **0 veränderte Landknoten**.
**Neun Regionen**, alle über Land erreichbar — `requiresHarbor` ist nirgends mehr
gesetzt (die vorgelagerte Insel aus 13.0 gibt es bei diesem Wasserstand nicht).
Startregion **9 „Gründerland"** (Rathaus (241,251), 1.400 bebaubar, ΔH 0,12,
20 Kacheln vom Schwerpunkt, **vier** Landnachbarn 1/2/5/7), erste Erweiterung
**L2 = Nordwald** (42,7 % Wald). Weil vier Nachbarn erreicht werden, gilt
`START_MIN_NEIGHBOUR_REGIONS = 3` wieder wie ursprünglich. Save **v29** (Backup
`cmb.save.backup.world-v28`).
Offen (nicht vortäuschen): Pfahl-/Steglogik für Anleger an echten Klippen,
Bergplattformen als Terrain-Klasse, Mesh-Einebnen unter dem Footprint, neue
Vegetations-/Prop-Assets.

## Status: Modelltreue 13.0 — DIE GLB IST DIE WELT (v1.21, Save v28, D-043)
Nutzerauftrag mit Beleg (Viewer-Screenshot der rohen GLB): „Das 3D-Modell ist
nicht das Problem, sondern die Implementierung … übernimm das Modell so, wie es
ist, und füge erst danach Wasser, Texturen usw. hinzu." Die Messung gibt ihm
recht: der Bake veränderte **157.749 von 233.287 Landknoten (67,6 %)** und drückte
die mittlere Landhöhe von **8,46 auf 6,45 m**. Ufer-Blend, Terraforming,
Schlussglättung und die Ersatz-Landschaft aus Nadelreparatur/Klippen-Plateaus
haben zusammen eine andere Insel erzeugt.
**Jetzt gilt: `RAW_TERRAIN_FIDELITY` ist der Standardpfad — die Geometrie wird
exakt gerastert (0 veränderte Knoten), danach werden Wasser, Ufer, Biome,
Bebaubarkeit und Regionen daraus ABGELEITET. Keine Ableitung schreibt `HW`.**
Der alte Pfad bleibt über `TERRAIN_MODE=flatten` messbar, ist aber nicht die
Welt. Verbindliche Kennzahl `BAKED_WORLD.modelFidelity`, testgesichert
(`changedNodes === 0`).
Die Insel ist damit das, was sie im Viewer ist: **Klippeninsel mit Plateaus** und
**Archipel**. **Elf Regionen**, Startregion **11 „Gründerland"** (Rathaus
(239,251), 1.400 bebaubar, ΔH 0,10, 22 Kacheln vom Schwerpunkt, Nachbarn 1/8),
erste Erweiterung **L2 = Nordwald** (55,5 % Wald — Holz ist der Frühengpass).
Region **10** hat `adjacent: []` und ist über `requiresHarbor` erreichbar.
**Preis der Treue, gemessen:** bebaubar 47.806 → 37.891 · bebaubare Uferkacheln
900+ → 150 · Steilküste 2.244 gegen 475 flach · **0 Brückenkandidaten** (gequert
wird über die Höhenstraße I1, 24 Viadukte). Häfen sind selten und gezielt zu
suchen; in der Startregion existiert **keiner** (`dock_small` öffnet erst L6).
**Wasser bleibt der erlaubte Hebel** — die GLB modelliert keinen Gewässergrund:
Tiefenrampe angehoben, `shorelineTolerance` 0 → 0,34, sonst wäre `river_port` an
NULL Stellen baubar. Save **v28** (Backup `cmb.save.backup.world-v27`).
**Regel für die Weiterarbeit (D-043): Wer eine Anforderung nicht erfüllt sieht,
ändert die Ableitung oder die Anforderung — nie die Geometrie.** Ein Test, der
faktisch nur durch Terraforming erfüllbar ist, misst das Falsche.
Offen (nicht vortäuschen): Pfahl-/Steglogik für Anleger an Klippen,
Bergplattformen als Terrain-Klasse, Mesh-Einebnen unter dem Footprint, neue
Vegetations-/Prop-Assets.

## Status: Welt-Feinschliff 12.3 (v1.20, Save v27) — AKTUELL
Korrektur zu v1.19. **Die gemeldeten „Küstenzacken" sind KEIN Gelände**, sondern
die prozeduralen Landmarken-Platzhalter: `SCENIC_PROP_MODELS` listete für
`rockArch`/`waterfall`/`oldTree` nur Wunschnamen, also griff immer die
Notgeometrie — beim Felstor zwei aufrecht stehende graue Kästen (0,9 × 3,8).
Nachgewiesen über eine Szenen-Probe im laufenden Spiel (inzwischen entfernt):
das Bodenmesh überschreitet nirgends das gebackene Höhenfeld, und weltweit
existieren genau 12 hohe schlanke Objekte. **Die Modell-Listen enden jetzt mit
vorhandenen Dateien** (`rock_large`, `tree_deciduous` …), die Notgeometrie ist
repariert. **Neue Prop-Arten `giantTree`/`boulder`** skalieren vorhandene
Modelle hoch (Footprint 3,1/4,4 bzw. 1,9/3,2) mit kräftiger Größenstreuung —
der Größenunterschied ist der Effekt, nicht die Menge. **Klippen-Garantie:**
Steilküste entsteht immer, wo echtes Gebirge ans Wasser reicht (Relief ≥ 18 im
Umkreis 7); Plateaus 136 → 254 Kacheln. Ganz ohne Zonen-Lotterie wurde die
gesamte Küste steil und der Bake fand keine gültige Startregion mehr.
**Regions-Ids 4 und 5 haben getauscht** (4 = Nordfelder, 5 = Weite Westaue);
`REGION_MIN_TILES` 3.000 → 3.300 hält die Zahl bei 9. **Lehre (D-042 erweitert):
Eine Messung beweist nur, was sie misst — widerspricht ein Spieltest einer
grünen Messung, ist der GEGENSTAND der Messung zu prüfen, nicht ihre Schwelle.**

## Status: Welt-Feinschliff 12.2 (v1.19, Save v27, D-042)
Zweiter Spieltest-Nachlauf; fünf gemeldete Punkte, jeder gemessen behoben.
**Küstenzacken sind Geometrie, kein Renderfehler:** schmale Felsnadeln der GLB
werden zu 1–2-Knoten-Nadeln verdichtet. Der alte Riegel (`> 6 m` Überhöhung UND
`≤ 1` Stütze) traf **1 von 487** realen Nadeln — die Kennzahl maß das Falsche.
Neue Bedingung: Hochpunkt in **≥ 3 von 4 Achsen** (Klippenkanten/Grate sind das
entlang der Kante nie); Reparatur und Messung teilen sich zwingend
`isTerrainNeedle` (D-042). **208 entfernt, 0 übrig.** **Steilküste braucht jetzt
echtes Relief** (≥ 5 m im Umkreis 7) statt nur einen Zonen-Hash — vorher hatten
223 „Steilküsten"-Kacheln einen Höhenmedian von 0,2–1,3 m; jetzt 124 echte, und
zusammenhängende Abschnitte bekommen über `buildCliffPlateaus` einen **ebenen
Kopf auf Hinterlandniveau**. **Vegetation:** weltweit 6.891 → **15.334** Props,
Startregion **11 → 183** Bäume/Büsche (`starterNatureFrame` reichte mit Radius
15→32 über die ganze ~40-Kachel-Region). **Progression:** Ostterrassen ab **L2**
(Nutzerwunsch), Leiter komplett neu, `FREE_EXPANSION_LEVEL` 3 → **2**.
**Freie Gründung:** neues Spiel ohne Rathaus/Distrikt/Straßen; `foundCity` ist
ein eigener einmaliger Command (Rathaus ist bewusst `buildable:false`+`unique`),
nutzt aber denselben Ghost und dieselbe `validatePlacement`-Instanz — **kein
zweites Platzierungssystem (§2)**. „Gegründet?" ist abgeleitet, kein Save-Feld.
**9 Regionen**, Startregion **9**, Save **v27** (Backup
`cmb.save.backup.world-v26`). **Bake-Reihenfolge zwingend:** ALLE
Höhenänderungen zuerst, danach die verbindliche Ableitung von Ufer/Biom/
Bebaubarkeit — sonst beschreibt die Bebaubar-Maske ein Gelände, das es nicht
mehr gibt (gefunden von `tests/mapBuildability.test.ts`). D-041 gilt weiter.
Offen (nicht vortäuschen): Bergplattformen als Terrain-Klasse, neue Vegetations-/
Prop-Assets, Mesh-Einebnen unter dem Footprint, Pfahl-/Steglogik, benannte
Terrain-Klassen samt Radius-Overlays, Straßen-Feinschliff.

## Status: Welt-Feinschliff 12.1 (v1.18, Save v26)
Nachlauf zum Spieltest der neuen Insel. **8 statt 13 Regionen** (Median 3.649 →
7.983 Kacheln), jede mit gemessener Rolle: Nordwald 55,4 % Wald (Holz) · Südmassiv
59,3 % Gebirge (Stein, Endgame L20) · Weite Westaue 11.856 Bauflächen (Kornkammer)
· Lagunenküste (Wasser) · zwei Mischregionen (H+F) · Mittelmark als Scharnier ·
Startregion **8 „Gründerland"** (1.576 bebaubar, Rathaus (228,261), ΔH 0,53).
**Progression folgt dem Ressourcenbedarf:** die kostenlose Erstwahl ab L3 IST die
Waldregion (direkter Startnachbar). Die größte Baufläche der Insel ist seenachbar
zum Start — früher Zugang nur per Hafen (`regionUnlockBlocker` unverändert).
**Uferbefund (wichtig für künftige Bake-Arbeit): das Uferprofil MUSS zuletzt**
**laufen** — vorher lief es vor `flattenBuildableLand`, und die Glättung zog jeden
Uferknoten wieder zum höheren Hinterland. Wirkung: Seeufer 73,9 → 97,7 % flach,
Flussufer 64,8 → 98,1 %, bebaubare Uferkacheln 67 → 88 %, Uferzacken 3 → 0,
Baufläche 44.170 → 47.806. **Hafenprüfung spiegelt die Laufzeitregel** aus
`waterfrontWaterCells` (2×2-Wasserrechteck bündig) — reines Uferkachel-Zählen
hatte eine unbrauchbare 1-Kachel-Bucht durchgelassen (0 baubare Anleger).
**Sägewerk kalibriert** (Stufe 1 13,5 → 52,7 Holz/min; Radius-Ausbau ergänzt);
Upgrades verbessern Arbeiter/Tempo/Werkzeug/Traglast/Lager/Radius, nie „+X/min".
**Vegetationsbudget folgt der Fläche** (`regionPropBudget`), nicht der
Regionsanzahl — sonst entlaubt jede Regionskonsolidierung die Welt.
Offen (nicht vortäuschen): Bergplattformen als eigene Terrain-Klasse, neue
Vegetations-/Prop-Assets, Mesh-Einebnen unter dem Footprint, Pfahl-/Steglogik.

## Status: World Overhaul 12.0 — NEUE INSEL ist die Welt (v1.17, Save v26, D-041)
Die Weltgrundlage ist **ausgetauscht**: `reference/world/new island 3d model.glb`
(117 Meshes) ist die **einzige** Bake-Quelle; die alte `island 3d new.glb` wird von
nichts mehr gelesen (kein Parallelbetrieb). Wie bisher wird **keine** GLB zur
Laufzeit geladen — `tools/bakeWorld.mjs` ist der einzige Konsument, die Laufzeit
liest committete Gen-Dateien. Kennzahlen: 61.322 Landkacheln, **44.170 bebaubar**
(vorher 38.126), freie Footprints 37.559/34.596/32.031 (3×3/4×4/5×5), ein zentrales
Massiv (7.069 Kacheln), Uferkante 90,9 % ≤ 1,5 über der Wasserlinie.
**Entscheidend (D-041): Das Terraforming läuft im Bake jetzt VOR der
Regionssegmentierung** (`§6b-flat`) — genau umgekehrt zu D-040. D-040 hat diese
Reihenfolge ausschließlich gewählt, um alte Regions-Ids und Spielstände zu
schützen; bei vollständigem Weltaustausch entfällt der Grund, und die alte
Reihenfolge machte Regionsstatistik und Startregion-Zuschnitt unehrlich. Wer sie
zurückdreht, bricht das erneut.
13 Regionen: Startregion **13 „Gründerland"** (zentral, 1.456 bebaubar, Rathaus
(237,256), ΔH 0,34, 13 Uferkacheln, **vier** Landnachbarn) + 12 Freischaltungen mit
klarem Ressourcenprofil. **Kein `requiresHarbor` mehr** — nicht entfernt, sondern
Folge der Geografie (eine zusammenhängende Landmasse); `regionUnlockBlocker` ist
unverändert und greift weiter geografisch. Regionsnamen erscheinen nur bei Hover
und Freischaltung (§10). Save **v26** = Weltumbau mit einmaligem Backup
`cmb.save.backup.world-v25`. Verbindlich vor Welt-/Regionsarbeit:
`docs/agents/WORLD_OVERHAUL_12_PLAN.md`. Offen (nicht vortäuschen): echte
Bergplattformen als eigene Terrain-Klasse, neue Vegetations-/Prop-Assets,
Mesh-Einebnen unter dem Footprint, Pfahl-/Steglogik für Wassergebäude.

Verbindlicher Einstieg für die Weiterarbeit:
`docs/HANDOFF_CLAUDE.md` → `docs/agents/PROJECT_STATE.md` →
`docs/agents/OPEN_TASKS.md`. Keine zweite Verkehrs- oder Missionssimulation
anlegen. Noch fehlende echte Daten für Steigung, Straßenzustand und dynamische
Ereignisse sind dort ausdrücklich dokumentiert und dürfen in der UI nicht
vorgetäuscht werden.
