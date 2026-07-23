# Core Gameplay Overhaul 8.0 — Audit

Stand: 22. Juli 2026 · Basis: v0.74 (Save-Schema v15)

Dieser Audit nennt für jedes gemeldete Problem das **sichtbare Verhalten**, die
**tatsächliche technische Ursache** (mit Datei/Zeile), die **betroffenen
Dateien**, den **geplanten Fix** und die **Tests**. Er unterscheidet strikt
zwischen bereits behobenen Punkten (Phase G1/G8, dieser Durchgang) und
analysierten, aber noch offenen Punkten.

Alles, was hier als Ursache steht, wurde am Code verifiziert — es gibt keine
Vermutungen ohne Kennzeichnung. Offene Vermutungen sind ausdrücklich als
`unverifiziert` markiert.

---

## 1. Behoben in diesem Durchgang

### 1.1 Stadtarbeit zeigt „4/5 Stopps" (§3)

| | |
|---|---|
| **Sichtbares Verhalten** | Alle Lieferziele und die Nachfüllung wurden angefahren, die Tourübersicht zeigt trotzdem `4/5 Stopps`; die Mission lässt sich nicht starten („Route vervollständigen"). |
| **Technische Ursache** | `evaluateCargoRoute` markierte ein Ziel beim **ersten** Kontakt dauerhaft als erledigt (`encountered.add(...)` VOR der Mengenprüfung). Fuhr das Fahrzeug leer an einem Ziel vorbei, zur Quelle zurück, füllte nach und kam wieder, wurde der zweite — gültige — Kontakt ignoriert. Das Ziel landete in `invalidTargetIds`, `cargoValid` wurde `false`, `orderedTargetIds` enthielt nur 4 von 5 Zielen. |
| **Betroffene Dateien** | `src/game/activities/logistics.ts`, `src/game/commands/controller.ts`, `src/components/citywork/TourOverview.tsx`, `src/components/panels/ActivityRoutePlanner.tsx` |
| **Fix** | Ein Ziel bleibt offen, bis seine Menge wirklich übergeben wurde; jeder spätere Kontakt zählt erneut. Ein erfolgloser Kontakt wird als `status: 'skipped'`-Stopp sichtbar dokumentiert, statt die Route still zu entwerten. Neu: `ActivityStopStatus` und `ActivityProgress` (§3.2) — Lieferziele und Nachfüllstopps werden **nie** in einer Zahl vermischt. |
| **Tests** | `tests/logistics.test.ts`: „beliefert ein leer passiertes Ziel nach dem Nachfüllen beim zweiten Kontakt", „zählt Lieferziele und Nachfüllstopps getrennt (§3.2)", „meldet ein wirklich unbeliefertes Ziel weiterhin als ungültig" |

Die Anzeige lautet jetzt `Lieferziele 5/5` mit separater Zeile `Nachladen 1/1`.

### 1.2 Verkehrslast bleibt „Wird geprüft" (§9)

| | |
|---|---|
| **Sichtbares Verhalten** | Die Kennzahl „Verkehr" zeigt während der gesamten Planung `Wird geprüft`, nie einen Wert. |
| **Technische Ursache** | `RouteSummary` las `analysis.congestionRisk`. `getActivityRoutePreview` berechnet `analysis` aber nur, wenn `orderedTargetIds.length === candidateTargetIds.length` — also erst bei vollständig verbundener Zielkette. Solange ein Ziel fehlte (Normalfall während des Zeichnens), gab es gar keinen Wert. Verstärkt durch 1.1: bei aktivem 4/5-Bug wurde die Kette nie vollständig. |
| **Betroffene Dateien** | `src/game/activities/routeAnalysis.ts`, `src/game/commands/controller.ts`, `src/components/citywork/RouteSummary.tsx`, `src/i18n/de.json` |
| **Fix** | Neue reine Funktion `forecastRouteTraffic(path, roads, busyness, vehicle?)` bewertet **exakt den gezeichneten Weg** — unabhängig von der Zielkette, also ab der ersten Kachel. Sie liefert `RouteTrafficForecast` mit `totalLoad`, `congestionRisk`, `criticalSegments`, `averageSpeedFactor`, `expectedDelaySeconds` und vier Anzeigestufen (Niedrig/Mittel/Hoch/Kritisch, §9). Berücksichtigt Anrainerdichte, Kreuzungen/Abbiegevorgänge sowie Fahrzeuggröße und Handling in engen Straßen. |
| **Tests** | `tests/routeAnalysis.test.ts`: „liefert auch für einen Teilweg ein vollständiges Ergebnis", „erkennt stark belastete Kacheln als Problemabschnitte", „bestraft ein schwerfälliges, breites Fahrzeug in vollen Straßen stärker", Determinismus |

**Noch nicht enthalten (ehrlich offen):** bestehende Lieferketten, Tageszeit,
Baustellen, Steigung und Straßenzustand gehen nicht in die Prognose ein — diese
Daten existieren kanonisch noch nicht (siehe 2.6).

### 1.3 Abschluss-Popup zeigt „– %" (§3.3)

| | |
|---|---|
| **Sichtbares Verhalten** | Das Ergebnisfenster zeigt `Strecke –`, `Effizienz – %`, `Straßenanteil –`. |
| **Technische Ursache** | Die Kennzahlen kamen ausschließlich aus `analyseManualActivityRoute` und existierten nur, wenn `active.plannedRoadPath` gesetzt war UND die Analyse gelang. Eine Inspektion ohne Fahrt hat naturgemäß keine Strecke; `EventModal` rendert die Zellen aber unbedingt und fällt per `?? '–'` auf Platzhalter zurück. Zusätzlich verlangt `analyseManualRoute`, dass die Route am letzten Ziel **endet** (`pathIndex !== manualPath.length - 1 → undefined`) — eine Tour mit Rückfahrt lieferte deshalb gar keine Analyse. |
| **Betroffene Dateien** | `src/game/commands/controller.ts`, `src/App.tsx`, `src/components/common/EventModal.tsx` |
| **Fix** | Neuer Vertrag `ActivityRunResult` mit Gesamtzeit, Fahrzeit, Lade-/Entladezeit, Strecke, Leerfahrtanteil, Auslastung, Verkehrseinfluss, Qualitätsverlust, Nachfüllungen, gelieferten Zielen, Planungseffizienz und Straßenanteil — jeder Wert aus der echten Simulation (`buildActivityRunResult`). Fehlt ein Wert, weil es ihn für den Auftragstyp nicht gibt, entfällt die Zeile im Popup vollständig. Keine Platzhalter mehr. |
| **Tests** | über `tests/missions.test.ts` und `tests/activityReservation.test.ts` (bestehender Abschlusspfad) abgedeckt; die Feldbefüllung ist typgeprüft |

### 1.4 Props/Vegetation verschwinden beim Regions-Unlock (§16)

| | |
|---|---|
| **Sichtbares Verhalten** | Beim Freischalten einer Region verschwinden Bäume, Büsche und Felsen in bereits sichtbaren Regionen oder stehen plötzlich an anderen Stellen. |
| **Technische Ursache** | `placeModelInstances` deckelte über den **Arrayindex** der weltweiten Kachelliste: `tiles.filter((_, i) => i % Math.ceil(tiles.length / cap) === 0)`. Beim Unlock wuchs `tiles.length`, damit änderte sich die Schrittweite — und ein völlig anderer Teil der Kacheln überlebte. Die Kandidatenauswahl selbst war bereits deterministisch (`hash01` je Kachel); allein die Deckelung hing an Listenlänge und Renderreihenfolge, also genau an dem, was §16 verbietet. |
| **Betroffene Dateien** | `src/renderer/three/vegetationBudget.ts` (neu), `src/renderer/three/ThreeMapRenderer.ts` |
| **Fix** | Neues reines Modul `vegetationBudget.ts`. `selectPropTiles(salt, tiles, budget)` wählt über einen Positions-Hash statt über den Index. `rebuildVegetation` sammelt Kandidaten jetzt **pro Region** und vergibt je Region und Proptyp ein festes Budget (`REGION_PROP_BUDGET`). Das Ergebnis einer Region ist damit vollständig unabhängig davon, welche anderen Regionen sichtbar sind. Der Unlock verändert weiterhin nur Nebel, Interaktion, Baubarkeit und Regionsstatus. |
| **Tests** | `tests/vegetationBudget.test.ts`, insbesondere „ein Region-Unlock verändert die Vegetation bestehender Regionen nicht" sowie Determinismus und Reihenfolge-Unabhängigkeit |

**Messaufgabe (offen):** Die Gesamtinstanzzahl wächst jetzt mit der Zahl
freigeschalteter Regionen (rund 700 Instanzen je Region über elf
`InstancedMesh`-Gruppen; Draw-Calls bleiben konstant). Für den
Vollinsel-Reveal muss das auf Zielhardware vermessen werden — siehe
`OPEN_TASKS.md`.

### 1.5 Zeitsteuerung ohne Simulationswirkung (§26)

| | |
|---|---|
| **Sichtbares Verhalten** | „Das Spiel fühlt sich wie ein AFK-Wartesystem an." Die HUD-Knöpfe `▶ / 1× / 2× / 4×` scheinen die Geschwindigkeit zu ändern, tun aber nichts Spürbares. |
| **Technische Ursache** | **Es gab keine Simulationsgeschwindigkeit.** `DayNightControl` schrieb ausschließlich `environmentSettings.dayLengthMin` (16/8/4 Minuten je Spieltag) — eine rein visuelle Einstellung der Sonnenbahn. Der Play/Pause-Knopf schaltete `environmentSettings.cycle`, also nur den Sonnenlauf. Der Tick lief unverändert mit `controller.update(Date.now(), …)` in `App.tsx`: Wirtschaft, Wachstum und Bauzeit hingen fest an der Wanduhr. Pause pausierte nichts. |
| **Betroffene Dateien** | `src/game/commands/controller.ts`, `src/App.tsx`, `src/components/hud/CameraControls.tsx`, `src/renderer/three/ThreeMapRenderer.ts`, `src/i18n/de.json` |
| **Fix** | Neuer Kernvertrag `advanceByRealTime(realDeltaMs, live)`: **reale** verstrichene Zeit × `SimulationSpeed` (0/1/2/4) ergibt die Simulationszeit und geht durch denselben einen Tick-Pfad. Dadurch skalieren Einnahmen, Verbrauch, Produktion, Wachstum und Bauzeit zwangsläufig **gemeinsam** — es gibt strukturell keinen Weg, nur die Einnahmen zu beschleunigen. Bei Pause vergeht keine Simulationszeit, also passiert nichts. Im Renderer trennt `simDt = dt × speed` die Weltanimation (Tageszeit, Verkehr, Missionsfahrt, Tiere, Rauch, Windräder) von Kamera, Eingabe und Marker-Billboards, die bewusst in Echtzeit bleiben — UI und Planung sind auch in der Pause bedienbar. |
| **Tests** | `tests/simulationSpeed.test.ts`: Pause hält die Uhr an; 2×/4× skalieren; „4× skaliert Einnahmen UND Verbrauch gleichermaßen" (4 reale Minuten bei 1× ≡ 1 reale Minute bei 4×); „die Tickfrequenz verändert die Wirtschaft nicht" |

**Bewusste Entscheidung:** Die Geschwindigkeit ist eine Sitzungseinstellung und
**nicht** im Save — ein Spielstand wird nie pausiert geladen, das Schema bleibt
bei v15 und braucht keine Migration. Folge: Die Simulationsuhr
(`meta.lastSimTime`) ist absichtlich von der Echtzeit entkoppelt. Jedes
zeitabhängige System rechnet bereits gegen `lastSimTime` und bleibt konsistent.
Der Offline-Nachlauf beim Laden vergleicht weiterhin `lastSimTime` mit
`Date.now()`; wer viel pausiert, holt beim nächsten Laden entsprechend Bauzeit
nach (nur Bauzeit/Ablauf, keine Wirtschaft).

### 1.6 Questtext und Fortschrittswert widersprechen sich (§22)

| | |
|---|---|
| **Sichtbares Verhalten** | Anliegen „Lass deine Stadt auf **80** Einwohner wachsen" mit Fortschrittsbalken **1.600/1.600**. |
| **Technische Ursache** | Kein Logikfehler, sondern Textdrift: Die Bevölkerung wurde einmal ×20 skaliert (`balancing.config.ts`, `needs.config.ts`), die Zielwerte in `quests.config.ts` wurden mitgezogen, die **fest ausgeschriebenen Zahlen in `de.json` aber nicht**. Betroffen waren fünf Anliegen. |
| **Betroffene Dateien** | `src/i18n/de.json`, `tests/questText.test.ts` (neu) |
| **Fix** | Alle fünf Texte auf den echten Zielwert korrigiert: `q10_growth` 80→1.600, `q15_metropolis` 400→8.000, `q17_grid` 550→11.000, `q19_health` 700→14.000, `qe_neighbours` 30→600. Zusätzlich ein Test, der **jede Zahl** in **jeder** Quest-Beschreibung gegen die echten `objectiveTarget`-Werte prüft — neue Anliegen können nicht mehr mit erfundenen Zahlen einchecken. |
| **Tests** | `tests/questText.test.ts` (3 Tests, alle Quests) |

---

## 2. Analysiert, noch offen

### 2.1 Platzierung trifft nicht die Cursorposition (§10.4, §13) — **P0**

| | |
|---|---|
| **Sichtbares Verhalten** | Gebäude und Straßen erscheinen versetzt zur Maus; der Versatz wächst auf Hügeln, an Klippen und bei flachem Kamerawinkel. Auch „Zoom zum Cursor" zieht daneben. |
| **Technische Ursache** | **Verifiziert:** `ThreeMapRenderer.groundPointAt()` raycastet gegen `this.ground` — eine **unsichtbare flache Ebene bei y = 0** (`ThreeMapRenderer.ts:514–520`, `PlaneGeometry(4000, 4000)`). Die Welt ist aber ein echtes Höhenfeld (`terrainHeightAt`). Getroffen wird also der Punkt, an dem der Mausstrahl **Meereshöhe** kreuzt, nicht der sichtbare Bodenpunkt. Bei Höhe h und Kameraneigung θ beträgt der Fehler ungefähr `h / tan(θ)` — auf einem 20 m hohen Plateau bei 40° rund 24 m, also mehrere Kacheln. `ndc()` selbst ist korrekt (`getBoundingClientRect`, DPI-sicher) — die Kamera- und Canvas-Mathematik ist **nicht** die Ursache. Derselbe Fehler betrifft `CameraInputController.onWheel` über `host.groundAt`. |
| **Betroffene Dateien** | `src/renderer/three/ThreeMapRenderer.ts` (`ndc`, `groundPointAt`, `pickTileAt`, `updateGhostAt`), `src/renderer/three/CameraInputController.ts` (`onWheel`) |
| **Geplanter Fix** | `groundPointAt` gegen das **Höhenfeld** auflösen statt gegen die Ebene: grobe Schrittsuche entlang des Strahls bis zum Vorzeichenwechsel von `rayY − terrainHeightAt(x, z)`, danach binäre Verfeinerung (10–12 Iterationen genügen für Sub-Kachel-Genauigkeit). `terrainHeightAt` ist rein und die kanonische Höhenquelle — kein zweites Höhenmodell, keine Raycasts gegen 64 Chunk-Meshes. Die flache Ebene bleibt nur noch Rückfallebene für Strahlen, die die Insel verfehlen (offenes Meer). |
| **Tests** | Neue reine Tests für den Strahl/Höhenfeld-Schnitt: Treffer auf flachem Grund identisch zur Ebene; auf erhöhtem Gelände liegt der Treffer auf `terrainHeightAt`; Konvergenz und Determinismus; Meer-Fallback. |

### 2.2 Kamera im Baumodus kaum bedienbar (§10.3) — **P0**

| | |
|---|---|
| **Sichtbares Verhalten** | Während des Platzierens lässt sich die Karte praktisch nicht bewegen. |
| **Technische Ursache** | **Verifiziert** in `CameraInputController.onPointerDown` (Zeile 109–120): Beim Platzieren belegt die linke Maustaste den `build`-Modus (Straßen malen) — Panning per Linkszug entfällt. Die rechte Taste ist fest `cancel`, kann also nicht schwenken oder drehen. Damit bleibt nur die mittlere Taste (`orbit`) plus Mausrad. |
| **Betroffene Dateien** | `src/renderer/three/CameraInputController.ts` |
| **Geplanter Fix** | Gemäß §10.3: Mittlere Taste schwenkt (statt orbitiert), rechte Taste zieht = drehen und nur ein Rechts-**Klick** ohne Zug bricht ab, `Strg`+Zug dreht, WASD/Pfeiltasten und Randscrollen bleiben aktiv, Mausrad zoomt. Der Bauentwurf darf dabei nie verloren gehen. |
| **Tests** | Erweiterung von `tests/camera.test.ts` um die Modusableitung aus (Taste, Zugweite, Platzierungszustand). |

### 2.3 Ghost-Vorschau und Gebäudeverschieben (§13.1, §13.2) — **P1**

- **Ghost:** Bereits als offene Aufgabe geführt („Echter GLB-Ghost für
  Platzieren/Verschieben; `placementDiagnostics` nutzen",
  `OPEN_TASKS.md`). Aktuell ist der Ghost eine prozedurale Box; das echte
  Modell, Rotation, Sockel, Straßen-/Wasseranschlusspunkt und der Radius
  fehlen. **Wichtig:** Der wahrgenommene „Ghost aktualisiert sich nicht" ist zu
  einem großen Teil 2.1 — der Ghost folgt der Maus korrekt, sitzt aber auf der
  falschen Kachel.
- **Verschieben:** `moveBuilding` existiert als atomarer Command
  (`tests/move.test.ts`). Was fehlt, ist der Ablauf aus §13.2: Ghost an der
  Zielposition, Ursprungsmarkierung, Abbruch ohne Wirkung, genau ein Command bei
  Bestätigung. Auch hier verfälscht 2.1 heute die Zielkachel.

**Reihenfolge ist wichtig:** 2.1 zuerst — sonst wird ein korrekter Ghost auf
einer falschen Kachel gezeigt und der Fix wirkt wirkungslos.

### 2.4 Wassergebäude/Anleger nicht platzierbar (§14) — **P1**

Land-/Wasser-Footprints, Küstensnapping, Tiefenprüfung und Fallbackmodelle für
`dock_small`/`river_port` existieren bereits (v0.74, `HANDOFF_CLAUDE.md`,
`tests/waterInfrastructure.test.ts`). Die Ablehnung „Auf diesem Untergrund kann
nicht gebaut werden" im Screenshot ist deshalb **sehr wahrscheinlich eine Folge
von 2.1**: geprüft wird die Kachel am Meeresspiegel-Schnittpunkt, nicht die
sichtbare Uferkachel unter dem Cursor. `unverifiziert` — nach dem Picking-Fix
erneut prüfen, bevor an der Platzierungsvalidierung etwas geändert wird.

### 2.5 Bevölkerung, Wohnraum und Arbeitsplätze (§20, §21) — **P1**

| | |
|---|---|
| **Sichtbares Verhalten** | HUD zeigt 1.000 Einwohner, das kleine Haus zeigt „Wohnraum 2–5". Visuelle Gebäudegröße und Simulationswerte passen nicht zusammen. |
| **Technische Ursache** | Zwei verschiedene Einheiten in derselben Oberfläche. `FloatingBuildingSheet.tsx:466` zeigt `units × min/maxResidentsPerUnit` **roh** aus der Config (`house_small` Stufe 1: `units: 1, min 2, max 5`), das HUD zeigt die ×20-skalierte Gesamtbevölkerung. Es gibt keinen versteckten Laufzeit-Multiplikator: Die Skalierung steckt in den Config-Werten selbst (`balancing.config.ts`, `needs.config.ts` — dokumentiert als „×20"). Die Gebäudekapazitäten wurden dabei **nicht** mitskaliert, weshalb ein sichtbar kleines Haus rechnerisch 5 statt 100 Personen fasst. |
| **Geplanter Fix** | Phase G4: eine einzige absolute Einheit festlegen und alle Wohnkapazitäten anhand der sichtbaren Gebäudegröße neu setzen (§20.3-Richtwerte), Arbeitsplätze gegenprüfen (§20.4), Questziele und HUD-Formatierung darauf beziehen. Persistierte Bevölkerung erfordert eine **lineare Save-Migration** v15→v16, die die vorhandene Einwohnerzahl auf die neue Einheit umrechnet. |
| **Tests** | `tests/populationBalance.test.ts` erweitern: Wohnraum je Stufe plausibel zur Gebäudefläche, keine Einheitenmischung zwischen HUD/Detail/Quest, Levelziele erreichbar. |

Der Textteil dieses Problems (§22) ist bereits behoben — siehe 1.6.

### 2.6 Fehlende kanonische Simulationsdaten — **P1/P2**

Unverändert gültig aus `OPEN_TASKS.md`; die UI darf sie weiterhin **nicht**
vortäuschen:

- Steigung/Höhenprofil, Straßenzustand/-belag, Sperrungen, dynamischer Stau
- gebäudeeigener Lagerbestand und Ladeleistung (Bestand ist der globale Pool)
- `InfrastructureWarning.roadPoint`/`.segmentId` für exakten Kartenfokus
- persistente Lieferketten, Schiffsinstanzen, Hafenlager
- `rewardMultiplier` ist weiterhin Prognose und beeinflusst die Auszahlung nicht

### 2.7 Welt, Regionen, Nebel, Marker (§17, §18, §19, §23, §24, §25) — **P2**

Analysiert, aber bewusst nicht in diesem Durchgang angefasst, weil jeder Punkt
den Weltbake und damit eine Save-Migration berührt:

- **Weltgröße −20 % (§17):** Die Insel wurde in 6.1 bereits um 0,8898 je Achse
  verdichtet (44.757 Baukacheln, −20 %). Eine **erneute** Verkleinerung ist eine
  eigene Bake-Runde mit vollständiger Neuerzeugung aller abgeleiteten Daten.
  Vor der Umsetzung ist zu klären, ob die Meldung „Welt zu groß" nicht in
  Wahrheit die **Regionsanzahl** meint (§18).
- **Regionen 40 → 18–24 (§18):** rein gebackene Daten
  (`islandRegions.gen.ts`); Zusammenlegung erfordert neue Region-IDs,
  Levelzuordnung, Freischaltkosten und eine Migration bestehender Gebäude.
- **Erste Erweiterung kostenlos ab Level 3 (§19):** kleiner Eingriff in
  `regions.config.ts` + `levels.config.ts`, aber abhängig von 2.7/§18.
- **Nebel (§24) und Marker (§23):** rein visuell, ohne Save-Wirkung — gute
  Kandidaten für den nächsten Durchgang, sobald G2 steht.

---

## 3. Nicht reproduzierbare bzw. bereits gelöste Meldungen

- „Gebäude ohne Straße können nicht gebaut werden" — in v0.74 gelöst: Gebäude
  sind platzierbar und tragen den Betriebszustand „kein Infrastrukturzugang".
- „Ghost fehlt vollständig" — ein Ghost existiert (`updateGhostAt`); er ist
  prozedural und sitzt wegen 2.1 auf der falschen Kachel.

---

## 4. Verifikation dieses Durchgangs

| Prüfung | Ergebnis |
|---|---|
| `npx tsc -b --force` | ✅ ohne Fehler |
| `npx eslint src tests` | ✅ ohne Befund |
| `npx vitest run` | ✅ 296 Tests, 41 Dateien |
| `npm run build` | ✅ erfolgreich |
| Windows-Tauri-Build | nicht ausgeführt (keine Rust-Toolchain in dieser Umgebung) |
| 3D-Screenshot-Smoke | ✅ `vite preview` auf `/`, Chrome 1920×1080: Welt und Vegetation bauen auf, **null Konsolenfehler**, Pause/4× schalten sichtbar |

Der Screenshot-Smoke bestätigt zugleich zwei offene Punkte optisch: Die
Wolkenwand gesperrter Regionen zerfällt sichtbar in einzelne weiße Kapseln
(§24, Phase G3), und die Vegetation der Startregion ist nach dem Budget-Umbau
dichter als zuvor (§25, gewünscht).

Save-Schema bleibt **v15**; dieser Durchgang persistiert nichts Neues.
