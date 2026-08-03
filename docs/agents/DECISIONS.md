# Entscheidungen

## D-058 — Ein Betrieb, dessen Knoten der Spieler selbst anlegt, darf leer starten

**Kontext.** Eine Farm in der Startregion konnte nie in Betrieb gehen.
`crop`-Knoten liegen nur auf `fertile`, `fertile` entsteht nur durch Felder,
Felder verlangen eine Farm in Reichweite — und die Startregion hat null
natürliche fruchtbare Kacheln. Der Riegel war eine Zeile in
`startBuildingOperation`: `if (nodeIds.length === 0) return fail('invalid')`.

**Entscheidung.** Der Riegel gehört nicht in den Command, sondern in die
**Datenlage**: `ResourceNodeProfile.playerCreatable` (Pflichtfeld). Ein
Dauerbetrieb auf einem solchen Knotentyp darf mit leerem Gebiet starten und
fällt auf `waiting`; `resumeWaitingOperation` nimmt die Arbeit von selbst auf.
`startOperation` setzt bei leerer Zielliste **sofort** `waiting` — „aktiv mit
null Zielen" wäre nicht nur eine Anzeigelüge, es würde den Wiederanlauf ganz
verhindern, weil er nur für `waiting` läuft.

**Warum nicht „replenishable".** Die erste Fassung fragte „wächst nach?" und war
falsch; `tests/operations.test.ts` hat sie sofort widerlegt. Wald wächst nach —
aber nur auf Waldkacheln. Steht in Reichweite jetzt kein Baum, entsteht dort auch
keiner; „0 Knoten" heißt beim Sägewerk wirklich „falsch gebaut". Die tragfähige
Frage ist enger: **Kann der SPIELER die Knoten erzeugen?**

**Konsequenz für die Weiterarbeit.** Wer einen Knotentyp ergänzt, muss die Frage
beantworten (ohne Flag compiliert das Profil nicht). Und: Eine Bedingung, die von
Weltzustand *und* Zukunft abhängt, gehört dorthin, wo beides bekannt ist — nicht
in die Command-Zeile, die nur das Jetzt sieht.

## D-059 — Was aus Feldern folgt, wird abgeleitet, nicht gespeichert

**Kontext.** Der Auftrag verlangt: größeres Feld ⇒ mehr Kosten, mehr Unterhalt,
mehr Produktion, mehr Arbeiterbedarf; Entfernung zur Farm senkt die Effizienz.

**Entscheidung.** Keine dieser Zahlen bekommt ein Save-Feld.
* **Entfernungseffizienz** ist die vorhandene `efficientRadius`/`maxRadius`-
  Mechanik des `BuildingOperationProfile` — dieselbe Reichweite, nach der der
  Arbeiter läuft. Keine zweite Distanzrechnung für Felder.
* **Unterhalt und Arbeiterbedarf** entstehen aus der **gezählten** Feldzahl
  (`countFarmFieldTiles`) in `derived.upkeep`, an der einen Stelle, an der
  Unterhalt ohnehin entsteht.
* Felder selbst sind `terrainOverrides` — seit v10 im Save, jederzeit zählbar.

**Warum.** Eine gespeicherte Feldliste neben den `terrainOverrides` wäre ein
zweites Modell derselben Sache und könnte auseinanderlaufen; ein gespeicherter
Unterhalt könnte den Feldern widersprechen. Fortsetzung von D-042/D-049: Wer eine
Zahl aus einer Menge ableiten kann, leitet sie ab.

**Zusatz.** Wo der Spieler die Knoten selbst setzt, ist das Arbeitsgebiet
standardmäßig der **volle** Radius. Er hat mit dem Feld bereits entschieden, wo
gearbeitet wird; ein zusätzlicher Radiusregler wäre die Doppelarbeit, die D-039
verbietet.

## D-060 — Die Kreuzung ist die Entscheidung, nicht der Tastendruck

**Kontext.** „Die Steuerung fühlt sich kaputt an. Man kann schlecht wenden."

**Befund — es war nicht die Physik.** `stepDrive` las `input.steer` genau in dem
Bild, in dem das Fahrzeug eine Kachelgrenze überquerte. Drei Folgen:
1. Eine Zehntelsekunde zu früh losgelassen ⇒ Eingabe verloren.
2. Gedrückt gehalten ⇒ `chooseNext` sortierte rechts auch **mitten im Korridor**
   nach vorn, das Fahrzeug bog an jeder Gelegenheit ab. Halten war also keine
   Abhilfe für (1), sondern ein zweiter Fehler.
3. Wenden war die letzte Option in `chooseNext` und nur in der Sackgasse
   erreichbar ⇒ der Spieler rangierte rückwärts.

**Entscheidung.**
* Ein Tastendruck setzt eine **Absicht** (`DriveState.intent`), kein Signal. Sie
  wird erst verbraucht, wenn die gewünschte Richtung an einer Kachel wirklich
  existiert. Damit ist gleichgültig, *wann* gedrückt wird.
* **Gas ist der Normalzustand**, die Leertaste hält an (D-039: keine Bedienung
  ohne Entscheidung).
* **Rückwärts entfällt ersatzlos.** Wenden ist eine Richtung wie jede andere.
* Belegung = Struktur: **A links · W geradeaus · D rechts · S wenden**.
* `turnOptionsAt`/`nextJunction` sind die **einzige** Aufzählung der offenen
  Richtungen; Anzeige und Fahrt lesen dieselbe Funktion (Lehre D-042). Eine Kurve
  ist keine Kreuzung — sie anzukündigen wäre Lärm.

**Darstellung.** Das Fahrzeug ist ein Lieferwagen, keine Pfeilspitze: Eine
Pfeilspitze liest sich als Marker/Cursor, also als etwas, das man *zieht*.

**Konsequenz.** Wer die Fahrbedienung erweitert, erweitert die Absicht — nicht
den Abtastzeitpunkt. Ein größeres Zeitfenster hätte den Fehler verkleinert, aber
nicht beseitigt.

## D-056 — Gesperrtes Land ist vollständig, nur farblos (schärft D-045)

**Kontext.** Nutzerauftrag 02.08.2026 mit Mockup: „Alles sichtbar, nur
ausgegraut." Ausdrücklich verboten: Nebel, Wolkenwand, vereinfachte Silhouette,
versteckte Props. D-045 hatte das bereits im Grundsatz umgesetzt, wich aber an
zwei messbaren Stellen ab.

**Entscheidung.**
1. **`LOCKED_VEGETATION_DENSITY` = 1** (vorher 0,5). Halbe Vegetation erzeugte
   einen sichtbar kahlen Streifen genau an der Regionsgrenze — also exakt den
   „unvollständigen" Eindruck, den der Auftrag ausschließt. Bezahlbar bleibt es,
   weil gesperrte Vegetation an einem EIGENEN Schlüssel hängt (D-045) und keine
   Schatten wirft: neu gebaut wird nur beim Freischalten, nie beim Bauklick.
2. **`LOCKED_DESATURATION` = 0,85** (vorher 0,7) — „klar ausgegraut" im Sinne
   des Mockups, in dem gesperrte Sektoren nahezu grau sind.
3. **Der Schlossmarker trägt Name, Level, KOSTEN und BONUS.** Vorher standen
   dort nur Name und Level; Kosten und Nutzen erfuhr man erst im Dialog. Beide
   Werte kommen aus `regions.config` — derselben Quelle, aus der der
   Unlock-Command bezahlt. Der Bonus wird aus den echten `productionModifiers`
   abgeleitet und bleibt **leer**, wenn die Region keinen hat.

**Warum keine Regel, sondern nur Darstellung.** Sichtbarkeit ist keine Mechanik:
`regionUnlockBlocker`, Baubarkeit und Kosten sind unverändert. Wer wieder
ausdünnen will, dünnt die Qualitätsstufe aus, nicht eine einzelne Region.

---

## D-055 — Jede Ressource braucht einen Einstieg, der sie nicht voraussetzt

**Kontext.** Der Nutzer meldete einen „Steinbruch-Deadlock". Die Messung
widerlegt die Ursache und bestätigt das Problem: `quarry` kostet **keinen**
Stein — der Riegel ist das **Terrain**. Der Steinbruch war die einzige
Steinquelle und braucht `rock`-Knoten auf `mountain`; die Startregion hat davon
46 Kacheln ≈ 18 Knoten ≈ **3.312 Stein, einmalig** (Fels wächst nie nach).
Startvorrat Stein: **0**. Erste Steinkosten: Lagerhaus auf **L6**.

**Entscheidung.** Jede Ressource hat eine **Einstiegsquelle**, die
(a) verfügbar ist, bevor die erste Baukostenstufe sie verlangt,
(b) **sich selbst nicht voraussetzt**, und
(c) **schwächer** ist als der echte Betrieb, damit die Erschließung eines
Reviers ihren Wert behält.

Erster Fall: **`stone_pit`** (L2, 3×3, `{money 9.000, wood 60}`, 13 Stein/min,
Ausbau 26). Kein Terrain, keine Knoten — oberirdisches Lesegestein.

**Durchgesetzt, nicht nur beschrieben:** `tests/earlyGameProgression.test.ts`
prüft (a)–(c) über die **gesamte** Config bis L8 und hält zusätzlich fest,
welche Betriebe in der Startregion arbeitsunfähig sind (aktuell exakt
`farm@L4:fertile`). Ein Config-Ausbau, der eine neue Sackgasse erzeugt, fällt
dort auf.

**Folge für die Farm (offen).** Die Farm bleibt ein Betrieb ohne Vorkommen: die
Startregion hat **null** fruchtbare Kacheln. Bis das Feldsystem existiert, sagt
sie es wenigstens — neue Diagnose `no_resource_nodes`, dieselbe Warnstufe wie
D-047: **Warnung, keine Bauregel**, sonst verbietet man das Vorbauen. Entwurf
in `docs/agents/EARLY_GAME_AUDIT.md` §5.

---

## D-054 — Die Route wird gefahren, nicht geplant (löst D-050/D-051 teilweise ab)

**Kontext.** Auftrag „Stadtarbeit Overhaul 2.0" mit Mockups: „Die Route wird
NICHT gezeichnet. Die Route wird gefahren." Zuvor erzeugte
`createSmartRouteSuggestion` Zielreihenfolge, Fahrzeug und vollständigen Weg;
der Spieler bestätigte eine fertige Lösung.

**Entscheidung.**
1. **Der Planer schlägt nichts mehr vor.** Kein Vorschlagsweg, kein
   „Neu optimieren", kein Zeichenwerkzeug. Der Startknopf nimmt den **Auftrag**
   an, nicht eine Lösung.
2. **Die Reihenfolge gehört dem Spieler.** `progressActivity` akzeptiert für
   Fahrmissionen **jedes offene Ziel**. Vorher galt ausschließlich
   `targets.find(!done)` — wer als Zweites das nähere Haus ansteuerte, bekam
   `invalid`. `active.targets` wird beim Abschluss umsortiert und **protokolliert
   damit die tatsächlich gefahrene Reihenfolge**; Abschlussbericht, Tourübersicht
   und Karte lesen weiterhin dasselbe Feld.
3. **Die gefahrene Strecke IST die Route.** Neuer Command
   `recordActivityDrive(tiles)` schreibt sie in `plannedRoadPath` — dasselbe
   Feld, das der Abschlussbericht ohnehin auswertet. **Kein zweites Streckenfeld,
   keine Schemaänderung.** Aufgezeichnet wird nur, was `derived.roadNetwork`
   hergibt; eine diagonal geschnittene Kurve ergänzt deterministisch die
   dazwischenliegende Straßenkachel, größere Sprünge werden **verworfen statt
   interpoliert**.
4. **Ohne `notify`.** Die Aufzeichnung läuft mit der Bildrate; ein
   Versionssprung je Kachel zöge die gesamte Oberfläche mit (CLAUDE.md §6).
   Sichtbar wird die Strecke beim nächsten regulären Command.

**Was D-039 (Active Simplicity) rettet.** Automatisiert wird weiterhin die
**Ausführung**: „Fahren lassen" bleibt, und weil die UI keine Route mehr
mitschickt, beschreibt der Abschlussbericht dort jetzt den Weg, den die Stadt
tatsächlich nimmt (`analyseActivityRoute`) statt gar keinen. Gestrichen ist nur
die Automatisierung der **Wahl**.

**Status von D-050/D-051.** Der Auftrag verlangt zusätzlich eine isometrische
Kamera auf die 3D-Welt statt der 2D-Karte (D-053). Dieser Teil ist **noch nicht
gebaut**; bis dahin bleibt die 2D-Karte die Fahransicht, D-050/D-051 gelten dort
unverändert weiter.

---


## D-052 — Jede Ware liegt an einem Ort (Bestandsregister)

**Datum:** 01.08.2026 · **Status:** aktiv · **Version:** v1.34 (**Save v32**)
**Erfüllt:** Auftrag „Stadtarbeit Overhaul" §8 („Keine globale magische Ressource.
Jedes Lager hat eigene Bestände") = **Phase 4** des Folgeauftrags.

**Entscheidung.** `state.resources` bleibt die **Bilanzsumme** der Stadt, die die
gesamte Wirtschaft liest (Baukosten, Verbrauch, Quests, Balancing). Zusätzlich
gilt ab jetzt die Invariante

    state.resources[r] === Σ Bestand aller Stadtlager[r]        (r ≠ money)

Das Register liegt in `src/game/economy/stockLedger.ts` und benutzt **denselben**
`BuildingInventory`-Typ und **dieselbe** Map (`operations.inventories`) wie die
lokalen Betriebslager aus Save v17 — es gibt **kein drittes Lagermodell** (§2/§8).

**Was die Messung erlaubt hat.** 34 Gebäudetypen: **3 aktive Betriebe** mit
lokalem Lager (Sägewerk, Steinbruch, Farm), **7 Stadtlager** mit `storage`-Wirkung
(Rathaus, Distriktzentrum, Lagerhaus, Wasserwerk, Markt, Anleger, Flusshafen) und
**keine Überschneidung**. Genau diese Trennung macht eine Map für beides eindeutig;
ein Gebäude mit beidem hielte zwei Bedeutungen im selben Eintrag.
`tests/stockLedger.test.ts` prüft die Überschneidungsfreiheit zuerst — kippt sie,
kippt das Modell.

**Zwei Regeln, die daraus folgen.**
1. **Die Ableitung gibt die ORTE heraus, nicht nur die Summe.**
   `Derived.storageSites` entsteht in **derselben Schleife** über denselben
   `case 'storage'`, aus der `storageCaps` entsteht. Eine getrennt gepflegte
   Ortsliste könnte vom Deckel abweichen; ein Test hält beide zusammen
   (Fortsetzung D-042/D-049).
2. **Der Abgleich läuft an EINER Stelle.** `state.resources` wird an 31 Stellen in
   8 Modulen verändert. Ein Register, das jede davon selbst mitpflegen müsste,
   driftet beim ersten vergessenen Aufruf — deshalb gleicht `GameController.notify`
   ab (und der Konstruktor beim Laden). Ortsgenaue Vorgänge gehen über
   `withdrawStock`/`depositStock` und bleiben trotzdem exakt.

**Was das im Spiel ändert.** Der Ladeort eines Auftrags ist eine **Wahl mit
Folgen**: entnommen wird an genau diesem Lager, ein Abbruch gibt die Ladung genau
dorthin zurück, und reicht der Vorrat nicht, startet die Mission nicht. Vorher
entschied stumm die alphabetische Gebäude-Id, und die Ware kam aus dem Stadtkonto
— „ich lade im großen Lager im Norden" war folgenlos.

**Ehrliche Grenze (nicht vortäuschen).** Nur ein Gebäude mit `storage`-Wirkung hat
einen eigenen Bestand. **Farm, Sägewerk, Pumpwerk und Feuerwache sind Abholpunkte
OHNE Lager** — dort bleibt die Ware die Bilanz der Stadt, und die UI zeigt für sie
keine Bestandswahl. Wer das ändern will, gibt diesen Gebäuden eine `storage`-Wirkung
in der Config; das verändert `storageCaps` und damit das Balancing — eine bewusste
Entscheidung, kein Nebeneffekt.

---

## D-053 — Widerspruch angezeigt: 2D-Karte gegen isometrische Weltkamera

**Datum:** 01.08.2026 · **Status:** **offen — Entscheidung des Nutzers nötig**

**Sachverhalt.** Der Folgeauftrag „Stadtarbeit Overhaul 2.0" verlangt in §2/§14
ausdrücklich: *„Nicht: eigene 2D Karte zeichnen. Sondern: 3D Welt →
orthografische/isometrische Stadtarbeit-Kamera → spezielle Overlays"*, und §4:
*„Die Route wird NICHT gezeichnet. Die Route wird gefahren."*

Das **kehrt zwei dokumentierte Nutzerentscheidungen um**:
- **D-050:** „das selbstfahren findet nicht in der echten welt statt, sondern nur
  im stadtarbeit 2d modus und auch nur 2d!"
- **D-051:** die 2D-Karte als Projektion derselben Weltdaten (`worldProjection.ts`).

**Warum das nicht still umgesetzt wird.** Beide Entscheidungen fielen auf
ausdrückliche Rückfrage und sind der Grund für die heutige Architektur (eine
Fahrphysik, eine Leseinstanz, kein zweiter Renderer). Der neue Auftrag verlangt
weiterhin **keinen zweiten Renderer** (§11) — eine isometrische Kamera auf den
vorhandenen Three-Renderer ist damit vereinbar. Umzukehren sind zwei andere Dinge:
der **Ort** des Fahrens (2D-Canvas → 3D-Weltkamera) und der **Zeitpunkt** der
Routenentstehung (vorher zeichnen → beim Fahren aufzeichnen).

**Empfehlung.** Als Kamera-Modus des bestehenden `ThreeMapRenderer` umsetzen (kein
neuer Renderer, §11 bleibt gewahrt); `worldProjection.ts` bleibt für Minimap und
Overlays bestehen. Vor Beginn ist D-050/D-051 ausdrücklich zurückzunehmen — sonst
widersprechen Code und Entscheidungslage einander.

---

## D-051 — Die Logistikkarte IST die Welt, nur anders dargestellt

**Datum:** 01.08.2026 · **Status:** aktiv · **Version:** v1.33 (Save v31 unverändert)
**Setzt fort:** D-042 (eine Instanz), D-044 (Naturverteilung), D-045 (gesperrtes Land),
D-050 (eine Fahrphysik).

**Entscheidung.** Die 2D-Stadtarbeitskarte hat **keine eigenen Weltdaten**. Jede
Kachel, jede Höhe, jede Küstenlinie und jeder Baum stammt aus derselben Quelle,
aus der auch der 3D-Renderer seine Welt baut. Die Leseinstanz dafür ist
`src/renderer/worldProjection.ts` — ein Modul ohne `three`, ohne `react`, ohne
Canvas, das nur Zahlen und Farben liefert. Wer die Draufsicht um eine
Weltinformation erweitert, ergänzt sie **dort** und liest nicht direkt aus einem
Grid nach.

**Warum das eine Regel und keine Stilfrage ist.** Der Auftrag verbot
ausdrücklich eine „vereinfachte neue Fake-Karte". Das ist prüfbar formulierbar,
und genau so ist es getestet: `tests/worldProjection.test.ts` vergleicht die
Kachelabtastung über ein Weltraster gegen `bakedSurfaceAt`/`terrainAt`/
`terrainHeightAt` und die Vegetation **Instanz für Instanz** gegen
`collectRegionNature`. Eine Karte, die ihre eigene Verteilung nachbaut, läuft
irgendwann auseinander — der Spieler sieht dann in der Planung einen Wald, wo in
der Welt keiner steht. Auch die Regel für gesperrtes Land (Entsättigung,
Abdunklung, halbe Vegetationsdichte) liegt jetzt **einmal** in der Projektion
statt zweimal.

**Was daraus folgt.**
- **Gezeichnet wird abgeleitet, nicht erfunden.** Straßenklasse kommt aus
  `roadEngineering.variant`, Infrastruktur-Marker aus den Config-Wirkungen
  (`storage`/`logistics`/`waterfront`/`operation`) — keine Id-Listen, die beim
  nächsten neuen Gebäude veralten. Eine Straßen**hierarchie** (Haupt-/Nebenstraße)
  existiert im Spiel nicht und wird deshalb auch nicht vorgetäuscht; die
  Strichstärke folgt der echten Verkehrslast.
- **Teure Ebenen hängen am Freischaltzustand, nie an der Belegung.** Weltbild und
  Vegetation werden einmal gebacken. Hingen sie an den Gebäuden, würde jeder
  Bauklick die halbe Insel neu berechnen (D-045). Props unter Gebäuden werden
  beim Zeichnen verdeckt statt aus der Verteilung entfernt — sichtbar identisch,
  aber zwischenspeicherbar.
- **Konstanten gehören gemessen, nicht geschätzt.** Die Wassertiefen-Rampe stand
  zuerst bei 7 m. Die Insel hat gar keinen Gewässergrund: tiefste Stelle
  **5,06 m**, 94 % aller Wasserkacheln zwischen 2 und 3 m. Mit dem geschätzten
  Wert wäre das Meer eine einzige Fläche ohne Uferbank gewesen.

## D-050 — Die Ausführungsart ist eine WAHL, und die Fahrt gehört der 2D-Karte

**Datum:** 01.08.2026 · **Status:** aktiv · **Version:** v1.30 (Save v30)
**Ergänzt** D-039 (Active Simplicity), hebt sie **nicht** auf — Nutzerentscheid.

**Entscheidung.** Ein Transportauftrag trägt eine `TransportMode`:
`auto` (die Stadt fährt die Strecke selbst ab, bequem, reguläre Prämie) oder
`manual` (der Spieler steuert, Kontrolle, konfigurierter Aufschlag). Genau **ein**
Modus ist wirksam, die Wahl fällt beim Start und ist danach unveränderlich.
**Das manuelle Fahren findet in der 2D-Stadtarbeitskarte statt** — derselben
Karte, in der die Route mit der Maus gezeichnet wird. Kein zweiter Renderer,
keine Rückkehr zu einem alten 2D-Spielmodus, kein Fahren in der 3D-Welt.

**Warum D-039 dabei gültig bleibt.** D-039 automatisiert **Ausführung**, nie
**Wahl**. Fahren als Pflicht wäre wiederholte Ausführung und stünde im
Widerspruch dazu. Fahren als *Angebot* ist das Gegenteil: Der Spieler entscheidet
je Auftrag, ob er die Ausführung abgibt. Die Automatik bleibt vollständig
erhalten und ist der Standard (`DEFAULT_TRANSPORT_MODE = 'auto'`).

**Warum eine gemeinsame Fahrphysik.** Das Fahren existierte als private Methode
im Three-Renderer. Es in der 2D-Karte nachzubauen hätte ein **zweites
Fahrmodell** ergeben (§2/§8) — zwei Reichweitenregeln, zwei Straßenbindungen,
zwei Balancings. Der Fahrschritt liegt deshalb als reine Funktion in
`game/activities/driving.ts`; beide Ansichten rufen `stepDrive`/`reachedTarget`.

**Folgen.**
- `activities/transportOrder.ts` ist das **eine** Auftragsmodell
  (`{start, cargo, vehicle, stops, targets, priority, mode}`) und eine reine
  **Projektion** der bestehenden `CargoRouteEvaluation` — es rechnet keine Menge
  und keinen Weg selbst nach.
- `priority` ist deklarierter Vertrag **ohne Wirkung**: nicht persistiert, nicht
  in der UI. Wirksam wird sie erst mit P4. Nichts vortäuschen.
- Wer die Fahrdynamik ändert, ändert sie für **beide** Ansichten. Ein Test, der
  nur eine Ansicht prüft, misst das Falsche (Fortsetzung D-042).
- Der angezeigte Prämienwert stammt aus **derselben** Funktion, die ihn auszahlt
  (`modeRewardFactor`) — gezeigter = gezahlter Bonus (Fortsetzung D-048).

## D-049 — Die Simulation liefert die FORM mit, nicht nur den Parameter

**Datum:** 01.08.2026 · **Status:** aktiv · **Version:** v1.28 (Save v29)

**Entscheidung.** Wo eine Regel über eine **Fläche** entscheidet, gibt die
Simulation die Fläche selbst heraus — nicht bloß die Zahl, aus der sie folgt.
Erster Fall: `CoverageSourceView.area` (`CoverageArea` aus
`buildings/coverage.ts`); der Renderer zeichnet, was dort steht, und leitet
nichts nach.

**Warum.** Die Reichweite ist `chebyshev(...) <= radius` — ein achsenparalleles
**Quadrat**. Übergeben wurde bisher nur `radius`, und der Renderer musste die
Metrik raten: er nahm die euklidische an und zeichnete einen eingeschriebenen
Kreis. Gemessen über alle Radiusgebäude blieben damit **19–30 % der wirklich
versorgten Kacheln unsichtbar** (Brunnen r9: 108 von 361; Feuerwache r32: 868 von
4.096). Der Fehler war einseitig — nie zu viel versprochen, immer zu wenig
gezeigt —, also unsichtbar für jeden, der nur „stimmt der Radius?" prüft. Ein
Parameter ohne seine Metrik ist keine gemeinsame Quelle, sondern eine Einladung
zum zweiten Modell (Fortsetzung von D-042/D-047/D-048).

**Folgen.**
- `coverageArea`/`coverageAreaAround`/`coversTile` sind die einzige Ausdehnungs-
  quelle; Ghost, Auswahl-Overlay und Arbeitsgebiet rufen dieselbe Funktion.
- Testpflicht ist die **Deckungsgleichheit über ein volles Kachelfenster**
  (`coversTile(area, …) === (chebyshev(…) <= radius)` für jede Kachel), nicht ein
  Stichprobenvergleich. Zusätzlich wird der alte Kreis als Gegenprobe geführt:
  er darf nie mehr zeigen als die Regel deckt.
- Gilt für jede künftige Flächenregel: Arbeitsgebiete, Logistik-Zuschlag,
  Ambiente, `locationBonus`. Wer einen neuen Radius einführt, exportiert seine
  Fläche mit.

## D-048 — Vorschau und Command teilen sich die Prüfung, nicht nur die Regel

**Datum:** 01.08.2026 · **Status:** aktiv · **Version:** v1.27 (Save v29)

**Entscheidung.** Wo ein Command **zusätzliche** Bedingungen kennt, die über die
gemeinsame Regel hinausgehen, wird der Prüfteil des Commands als eigene reine
Funktion herausgezogen, und die Vorschau ruft **genau diese** auf. Erster Fall:
`GameController.evaluateMove` trägt `moveBuilding` **und** `moveDiagnostics`.

**Warum.** D-042/D-047 verlangen, dass Anzeige und Prüfung dieselbe Quelle
benutzen. Beim Versetzen reicht das nicht: `validatePlacement` ist zwar dieselbe
Instanz für Bauen und Umziehen, kennt aber weder `canRelocate` noch die
`relocationCost` noch das Budget. Eine Vorschau, die nur `validatePlacement`
befragt, zeigt genau dort Grün, wo `moveBuilding` mit `feature_disabled` oder
`insufficient` ablehnt — der Spieler klickt in einen Fehler-Toast. Der Umzug
braucht außerdem zwingend `ignoreBuildingId`: ohne ihn meldet die eigene
Grundfläche `occupied`, und ein Umzug um eine Kachel sähe verboten aus.

**Folgen.**
- `MoveBlocker` ist die deklarierte Obermenge von `PlacementError`
  (`+ feature_disabled | insufficient`); `HoverInfo.error` führt sie, damit das
  Banner beide Welten mit demselben Text-Mechanismus beschriften kann.
- `moveDiagnostics` baut auf `placementDiagnostics` auf (Untergrund,
  Anschlusskacheln, Standortbonus sind beim Versetzen dieselben) und
  **überschreibt allein das Urteil**. Kein zweiter Diagnosepfad.
- Testpflicht: Die Suite prüft die Deckungsgleichheit über einen Kachelstreifen —
  `result.ok === preview.valid` und `result.error === preview.reason` —, nicht
  einzelne Fälle. Ein Streifen, der nur einen Ausgang enthält, gilt als Fehler.
- Gilt für jeden künftigen Command mit Vorbedingungen (Abriss, Ausbau,
  Freischaltung): erst den Prüfteil trennen, dann eine Vorschau anbieten.

## D-047 — Die Vorschau zeigt auch, was erlaubt ist, aber nicht funktioniert

**Datum:** 01.08.2026 · **Status:** aktiv · **Version:** v1.26 (Save v29)

**Entscheidung.** Die Platzierungsvorschau meldet nicht nur „darf hier gebaut
werden?", sondern auch „wird das hier arbeiten?". Ein gültiger Platz, an dem das
Gebäude wirkungslos bliebe, bekommt eine **eigene Stufe** zwischen gültig und
ungültig — bernsteinfarbener Ghost, benanntes Banner. Und: Wo eine Bedingung an
konkreten Kacheln hängt, **zeigt** die Vorschau diese Kacheln, statt ein Ja/Nein
zu behaupten (erster Fall: der Straßenanschluss über `connectedRoadTiles`).

**Warum.** `requiresRoad` blockiert die Platzierung nicht — `needs_road` gilt nur
für Straßen selbst. 23 von 34 Gebäuden tragen das Flag, und ein unverbundenes
Gebäude liefert laut `isInfrastructureOperational` weder Produktion noch
Kapazität noch Versorgung. Im Startzustand waren **3.652 von 3.721** geprüften
Kacheln gültig **und** ohne Anschluss (die Startstadt hat fünf Straßenkacheln).
Die Vorschau war dort grün und sagte nichts; der Fehler fiel erst Minuten später
am stillen Gebäude auf. Das Regelwerk zu verschärfen wäre falsch gewesen: erst
bauen, dann anschließen ist ein legitimer Spielzug.

**Folgen.**
- Anzeige und Prüfung teilen sich **eine** Aufzählung (`connectedRoadTiles`;
  `isConnectedToRoad` leitet sich daraus ab) — ein Marker kann nie auf eine
  Kachel zeigen, die die Prüfung nicht zählt. Fortsetzung von D-042.
- Der Ghost liest **eine** `placementDiagnostics`-Projektion statt drei
  Einzelabfragen; Ghost, Banner und Wasserfront-HUD können dieselbe Kachel nicht
  mehr unterschiedlich beschreiben.
- Wer eine weitere „erlaubt, aber wirkungslos"-Bedingung findet (Wasserzugang,
  Energie, Arbeitskräfte), ergänzt sie als Warnstufe — nicht als Platzierungsregel.
- Bei der Stadtgründung ist die Warnung unterdrückt: dort gibt es planmäßig noch
  keine Straße.

## D-046 — Zustände, die die UI beschriftet, werden als Liste exportiert

**Datum:** 01.08.2026 · **Status:** aktiv · **Version:** v1.25 (Save v29)

**Entscheidung.** Jede Zustandsmenge der Simulation, für die die Oberfläche einen
Text braucht, wird als `as const`-**Liste** exportiert und der Union-Typ daraus
abgeleitet — nicht umgekehrt. Erster Fall: `OPERATION_IDLE_REASONS` in
`src/game/operations/operations.ts`.

**Warum.** `OperationThroughput.idleReason` bekam mit A6 den neuen Grund
`deposit_exhausted`. Der Union-Typ war vollständig, die Übersetzung fehlte, und
`t()` gibt bei fehlendem Eintrag den Schlüssel zurück — im Gebäudefenster hätte
wörtlich `ui.operation.idle.deposit_exhausted` gestanden. TypeScript kann das
nicht fangen: ein i18n-Schlüssel ist für den Compiler eine Zeichenkette. Ein Test
kann es fangen, aber nur, wenn er die Zustände **aufzählen** kann.

**Folgen.**
- Ein neuer Zustand ohne Text lässt `tests/operationVocabulary.test.ts`
  fehlschlagen, statt erst im Spiel aufzufallen.
- Der Test iteriert die Liste aus der Simulation und baut sie nicht nach —
  dieselbe Disziplin wie D-042.
- Gilt sinngemäß für Warn-, Fehler- und Statuscodes, die die UI übersetzt.


## D-045 — Gesperrtes Land wird gezeigt, nicht verborgen (löst D-034 ab)

**Datum:** 01.08.2026 · **Status:** aktiv · **Version:** v1.24 (Save v29)

**Entscheidung.** Die gesamte Insel wird von Beginn an gebaut und dargestellt.
Gesperrte Regionen werden **entsättigt und leicht abgedunkelt** und tragen einen
Schloss-Marker; sie erhalten Gelände, Deko und Vegetation (halbe Dichte, keine
Schatten). Die Nebelwand aus D-034 und die Kamera-Explorationsgrenze entfallen
ersatzlos.

**Warum.** Ausdrücklicher Nutzerauftrag samt Rückfrage-Entscheid. Inhaltlich
trägt er: Die Wolkenwand versteckte genau das, was die Kaufentscheidung einer
Region motiviert — Gebirge, Küste, Waldanteil. Und seit dem Natur-Overhaul 14.0
gibt es dort etwas zu sehen. Sichtbarkeit ist außerdem keine Spielmechanik:
`regionUnlockBlocker`, Baubarkeit und Kosten bleiben unverändert, der Spieler
sieht mehr und kann nichts Zusätzliches.

**Folgen.**
- **Zwei Vegetationsaufbauten mit getrennten Schlüsseln sind Pflicht, kein
  Feinschliff.** Der Vegetationsschlüssel enthält die Belegungsmenge; mit einem
  gemeinsamen Schlüssel hätte jeder Bauklick die ganze Insel (26.851 Instanzen,
  51.057 Kacheln) neu aufgebaut. Wer die Gruppen wieder zusammenlegt, baut den
  Ruckler zurück.
- Jede Messung über die Vegetation (Perf-Panel, Tests) muss **beide** Gruppen
  erfassen, sonst misst sie einen Bruchteil (Konsequenz aus D-042).
- Die Minimap muss der 3D-Ansicht folgen. Ihre Wolkendecke war die 2D-Fassung
  der Nebelwand.

**Verhältnis zu D-034.** Abgelöst. D-034 hat den Nebel zu **einer** weichen Front
vereinheitlicht — das war die richtige Lösung für die damalige Anforderung
„gesperrt = unsichtbar". Diese Anforderung gilt nicht mehr.


## D-044 — Die Naturmasse ist stilisierte Geometrie; `.glb` sind seltene Blickfänger

**Datum:** 31.07.2026 · **Status:** aktiv · **Version:** v1.23 (Save v29)

**Entscheidung.** Die Masse der Vegetation und Props wird aus bewusst
gestalteten Low-Poly-Formen erzeugt (`naturePropGeometry.ts`, 24–200 Dreiecke).
Die vorhandenen Natur-`.glb` bleiben seltene Hero-Props auf ihrem bisherigen
zahlenmäßigen Niveau. Die Verteilung entsteht ausschließlich in
`natureDistribution.ts` aus der Zonentabelle in `natureZones.ts`; der Renderer
trifft keine Verteilungsentscheidung mehr.

**Warum.** Zwei Messungen. Erstens wiegt **jedes** vorhandene Natur-`.glb` rund
**29.000 Dreiecke** — für einen Baum. Deshalb konnte die Welt nur **502** echte
Modelle tragen, und die restlichen 96 % waren ein Kegel auf einem Zylinder;
genau das wurde als „zu leer, zu technisch, zu steril" gemeldet. Nicht die
Menge war das Problem, sondern die Ersatzform. Zweitens sind mehrere Modelle
**bytegleich** (`pine_tree` = `forest_cluster_small` = `forest_cluster_medium`;
alle fünf Steine identisch) — der Katalog umfasst real fünf Formen. Vielfalt
kann also nur aus Transformation kommen: Größe, Drehung, Neigung, ungleichmäßige
Skalierung und Instanzfarbe.

**Folgen.**
- Dichte ist wieder eine Gestaltungsfrage. 14.038 → 48.838 Props, ohne dass ein
  Region-Budget noch die Landschaft überschreibt (testgesichert).
- Wer die Welt nachjustiert, ändert `NATURE_TUNING`/`NATURE_SPAWN_RULES` — nicht
  den Renderer.
- Ein eingelegtes neues `.glb` wird weiterhin sofort genutzt (§5), aber es
  ersetzt die Masse nicht, sondern akzentuiert sie.

**Verhältnis zu D-042.** Renderer und Tests teilen sich zwingend
`collectRegionNature`. Eine Messung, die den Aufbau nachbaut statt ihn zu
benutzen, misst früher oder später etwas anderes als das Spiel zeigt.

**Verhältnis zu D-043.** Unberührt. Der Overhaul leitet ausschließlich ab und
schreibt kein Höhenfeld; die Inselgeometrie ist bitgleich.


## D-043 — Die Quell-GLB ist die Welt; Ableitungen lesen das Gelände, sie schreiben es nicht

**Datum:** 31.07.2026 · **Status:** aktiv · **Version:** v1.21 (Save v28)

**Entscheidung.** `tools/bakeWorld.mjs` übernimmt die Geometrie der Welt-GLB
**unverändert** (`RAW_TERRAIN_FIDELITY`, Standardpfad). Wasser, Ufertypen,
Biome, Bebaubarkeit, Regionen und Texturen werden **aus** diesem Gelände
abgeleitet — keine dieser Stufen darf `HW` noch schreiben.

**Warum.** Der Nutzer hat mit einem Viewer-Screenshot der rohen GLB belegt, dass
das Modell bereits klare Klippen, ebene Plateaus und saubere Uferkanten hat, und
dass die Abweichung in der Implementierung entsteht. Die Messung bestätigt es
eindeutig: der alte Pfad veränderte **157.749 von 233.287 Landknoten (67,6 %)**
und drückte die mittlere Landhöhe von 8,46 auf 6,45 m. Was im Spiel ankam, war
nicht das Modell mit Fehlern, sondern eine andere Landschaft.

*Verhältnis zu D-040/D-041:* Beide regelten die REIHENFOLGE von Terraforming und
Segmentierung. D-043 hebt die Frage auf, indem das Terraforming entfällt. D-041s
Kern bleibt gültig und wird strenger: Regionen, Startregion und Statistik sehen
das endgültige Gelände — jetzt trivialerweise, weil es sich nie ändert.

**Was der Auftrag kostet, und warum das richtig ist.** Die Quell-GLB ist eine
Klippeninsel. Sichtbare Folgen, alle gemessen und keine davon versteckt:

- Bebaubare Kacheln 47.806 → **37.891** (3×3-Bauplätze weiterhin > 28.000).
- Steilküste dominiert: 2.244 gegen 475 flache Uferkacheln — genau umgekehrt zu
  vorher.
- Bebaubare Uferkacheln 900+ → **150**; Häfen sind selten und gezielt zu suchen.
- **Null** Brückenkandidaten: eine Brücke braucht auf beiden Ufern
  straßenfähiges Gelände. Gequert wird über die Höhenstraße (I1), die genau
  dafür existiert (24 Viadukte).
- Die Insel ist ein **Archipel**: Region 10 hat keinen Landnachbarn und ist über
  `requiresHarbor` erreichbar.

**Wo weiterhin justiert werden darf — und wo nicht.** Nicht am Gelände. Wohl
aber an allem, was der Auftrag ausdrücklich NACH dem Modell erlaubt: Die
Wassertiefenrampe ist reine Bake-Entscheidung (die GLB modelliert keinen
Gewässergrund) und wurde angehoben, weil Wassergebäude an ihr scheiterten.
Ebenso sind Schwellen der Ableitung (Hangtoleranz, `shorelineTolerance`) legitime
Stellschrauben — sie beschreiben, was auf dem Gelände gebaut werden darf, nicht
wie das Gelände aussieht.

**Nachtrag 13.1 (v1.22, Save v29) — der Meeresspiegel ist ein Wasserparameter.**
Der Spieltest verlangte, dass das Wasser bündig mit der Unterkante der flachen
Ebenen abschließt. Gemessen lagen zwischen 0 und 3 m nur 331 flache Kacheln (die
Klippenwand), bei 4–5 m dagegen 14.073 — die unterste Terrasse. Das Wasser steigt
deshalb um **4 m**; ein Sweep belegt den Punkt (Anlegerplätze 20 → 344, Baufläche
unverändert; bei 5 m säuft die Terrasse selbst ab, −10.000 Landkacheln).

Wichtig dabei: `HEIGHT_SCALE` leitete sich bis dahin aus der Wasserlinie ab,
damit der Gipfel exakt `PEAK_WORLD_HEIGHT` erreicht. Ein höherer Wasserstand
hätte das Gelände dadurch um 8 % **gestreckt** — Geländeänderung durch die
Hintertür. Die Skala hängt jetzt an `SCALE_REFERENCE_N` und ist fix: das Gelände
steht still, das Wasser steigt, der Gipfel liegt ehrlich niedriger (52 → 48 m).
Die Treue-Kennzahl bleibt bei 0 veränderten Landknoten.

**Konsequenz für künftige Arbeit.** Wer eine Anforderung nicht erfüllt sieht,
ändert die Ableitung oder die Anforderung — nicht die Geometrie. Ein Test, der
faktisch nur durch Terraforming erfüllbar ist, misst das Falsche und ist
umzuschreiben (so geschehen bei „Küsten flacher statt steiler" und der
5×5-Uferplattform).

## D-042 — Der Spieler gründet selbst; Zackenabwehr misst, was sie repariert

**Datum:** 30.07.2026 · **Status:** aktiv · **Version:** v1.19 (Save v27)

**Entscheidung 1 — freie Gründung.** Ein neues Spiel startet ohne Rathaus,
ohne Distrikt und ohne Startstraßen. Der Spieler setzt das Rathaus selbst
(`GameController.foundCity`); der vom Bake validierte Anker bleibt ein
Vorschlag, kein Zwang.

*Warum kein Sonderpfad in `placeBuilding`:* `town_hall` ist `buildable: false`
und `unique` — beides ist richtig, denn im Baumenü darf das Rathaus nie
auftauchen. Ein eigener, einmaliger Command hält den Baupfad sauber (§2).
Die Platzierung selbst benutzt unverändert `placingDefId`, denselben Ghost und
dieselbe `validatePlacement`-Instanz; `getFoundingBlocker` teilt die Prüfung mit
der Vorschau, damit Ghost und Ergebnis nie auseinanderlaufen.

*Warum kein Save-Feld:* „Stadt gegründet?" ist abgeleitet (existiert ein
`town_hall`?). Ein Zustand, der nicht gespeichert wird, kann nicht mit der Welt
auseinanderlaufen.

**Entscheidung 2 — eine Kennzahl darf nur messen, was der Riegel repariert.**
Die Küstenzacken waren vier Versionen lang sichtbar, während
`isolatedPeakCount` auf „fast 0" stand: Der Riegel verlangte „> 6 m Überhöhung
UND ≤ 1 stützender Nachbar" und traf 1 von 487 realen Nadeln. Reparatur und
Messung teilen sich deshalb jetzt zwingend dieselbe Bedingung
(`isTerrainNeedle`). Wer die Erkennung ändert, ändert automatisch die Kennzahl.

**Folge für den Bake:** Alle Höhenänderungen (Uferprofil, Terraforming, Kappung,
Nadelreparatur, Klippen-Plateaus) laufen VOR der verbindlichen Ableitung von
Ufer, Biom und Bebaubarkeit. Ein Zwischenstand hatte es umgekehrt und lieferte
eine Bebaubar-Maske, die ein nicht mehr existierendes Gelände beschrieb.
D-041 (Terraforming vor Segmentierung) bleibt unverändert gültig.

## D-041 — Neue Insel als einzige Weltgrundlage; Terraforming VOR der Segmentierung

**Entscheidung (World Overhaul 12.0, 29.07.2026):** `reference/world/new island 3d
model.glb` ersetzt `island 3d new.glb` vollständig als Weltgrundlage — kein
Parallelbetrieb, keine Übergangslösung. Und: das Terraforming läuft im Bake
**vor** der Regionssegmentierung (`tools/bakeWorld.mjs` §6b-flat), also genau
umgekehrt zu D-040.

**Warum das D-040 nicht widerspricht:** D-040 hat die Reihenfolge
„Segmentierung zuerst" **ausschließlich** damit begründet, Regions-Ids,
Startregion und Rathaus bitgleich zu halten, weil `regions.config.ts`, das
Balancing und bestehende Spielstände daran hingen. Dieser Auftrag ersetzt die Welt
ausdrücklich vollständig (neue Insel, neue Regionen, Save-Neustart) — damit fällt
D-040s einziger Grund weg. Was bleibt, sind die Nachteile der alten Reihenfolge:

* Die Segmentierung sah Biome des **rohen**, ungeglätteten Geländes.
* Der Startregion-Ausschnitt zählte Bauflächen der **rohen** Maske und wuchs
  deshalb weit über sein Ziel: 3.983 Kacheln für 1.348 „bebaubare" — nach dem
  Einebnen waren es faktisch viel mehr.
* `BAKED_REGIONS[].buildable` und damit die Regionskosten beschrieben eine Welt,
  die es nach dem Einebnen nicht mehr gab.

**Konsequenz:** Regionen, Startregion, Rathaus, Regionsstatistik und alle
Ausgaben beschreiben ausschließlich das FERTIGE, bespielbare Gelände. Wer die
Reihenfolge wieder umdreht, macht die Regionsstatistik erneut unehrlich. D-040
bleibt als historische Begründung gültig; seine Reihenfolge-Vorgabe ist mit
diesem Entscheid abgelöst.

**Ebenfalls entschieden:**
- **Startressourcen sind Bedingungen, keine Wünsche.** Der Bake erzwingt für die
  Startregion Bauflächenbudget (1.200–1.750), Wasserzugang (≥ 8 Uferkacheln),
  einen ebenen 7×7-Rathausblock (ΔH ≤ 0,85) und **≥ 3 Nachbarregionen**. Der erste
  Bake der neuen Insel lieferte eine binnenländische Startregion ohne Wasser und
  ohne fruchtbaren Boden — genau dagegen richten sich die Prüfungen.
- **Verwaistes Land gehört einer Region.** Kleine Inseln ohne Landverbindung
  blieben bei „Region 0" (3.217 Kacheln): sichtbares, nie betretbares Land. Sie
  wandern zur Region mit dem kürzesten Wasserabstand. Keine erfundene Landbrücke,
  keine neue Region.
- **Kein `requiresHarbor` mehr.** Nicht als entferntes Feature, sondern als Folge
  der Geografie: die neue Insel ist EINE Landmasse, von der Startregion aus über
  Land vollständig erreichbar. `regionUnlockBlocker` bleibt unverändert und greift
  weiter geografisch (Nordfelder hängen nur über Wasser am Start).
- **Regionsnamen nur bei Hover/Freischaltung** (Auftrag §10). Zwölf dauerhafte
  Banner verdeckten die Insel; der Ruhezustand ist ein kompaktes Schloss.
- **Bergplattformen als eigene Terrain-Klasse bleiben offen.** Die Gebirge sind
  mit 474/1.349 bebaubaren Kacheln nicht unbebaubar, und `buildsOnRock` deckt
  Steinbruchflächen ab. Eine Höhenquantisierung wurde in v1.11 (B4) gemessen und
  verworfen. Wer echte Plattformen will, braucht eine Terrain-Klasse oberhalb
  `MOUNTAIN_HEIGHT` samt Renderer-Behandlung — nicht vortäuschen.

**Save:** **v26**, Weltumbau mit einmaligem Backup unter
`cmb.save.backup.world-v25` (Muster wie v14/v16/v19/v20). Eine
Koordinatenprojektion wäre sinnlos, nicht nur unscharf.

Details: `docs/agents/WORLD_OVERHAUL_12_PLAN.md`.

## D-040 — Die Karte wird bespielbar gemacht, die Weltstruktur bleibt unangetastet

**Entscheidung (Map Flattening + Buildability Overhaul, 28.07.2026):** Das
Gelände außerhalb des zentralen Massivs wird eingeebnet und die Platzierung
toleranter — aber **Regionen, Startregion und Rathaus bleiben bitgleich**. Im
Bake läuft das Terraforming deshalb bewusst **nach** der Regionssegmentierung
(`tools/bakeWorld.mjs` §8a-flat), nicht davor.

**Befund:** Die Regionssegmentierung wächst kostenbasiert über Höhendeltas und
Biome. Der erste Umsetzungsversuch ebnete das Gelände vor der Segmentierung ein —
Ergebnis: **11 statt 13 Regionen** und ein Rathaus an (156,205) statt (127,250).
Das hätte `regions.config.ts` (13 handgeschriebene Regionen mit Progression,
Kosten, Hafenabhängigkeit), das Balancing, die Quest-Ziele und **jeden
bestehenden Spielstand** entwertet — für einen Auftrag, der von Weltstruktur
überhaupt nicht spricht.

**Konsequenz:** `islandRegions.gen.ts` ist nach dem Rebake unverändert
(per `git diff` verifiziert). Save **v25** ist eine reine Weltmarkierung ohne
Strukturänderung; ein Neustart wie beim v19-Weltumbau ist ausdrücklich **nicht**
nötig (0 Landkacheln wurden zu Wasser, gemessen).

**Ebenfalls entschieden:**
- **Kein zweites Platzierungssystem (§2).** Die Toleranzen (Höhenbudget nach
  Footprint-Größe, Bebaubar-Toleranz, Straßen-Steilheit, Sockelhöhe) liegen in
  einem reinen Sim-Modul `src/game/buildings/terrainFit.ts`; `validatePlacement`
  bleibt die einzige Instanz und der Renderer liest dieselben Werte.
- **Terrassen (B4) verworfen.** Zweimal gebaut und gemessen (pro Knoten und pro
  Kachel): die Zahl ebener Bauplätze **sank** (11.370 → 10.563). Mit §8
  („nichts steril/künstlich") ein klares Nein — die Terrassenwirkung entsteht
  stattdessen sichtbar am Gebäudesockel.
- **Kein Bauplatz ohne mögliche Anbindung.** Der Bake deckelt die Bebaubar-Maske
  auf dieselbe Steilheit, die eine Bodenstraße schafft. Vorher lag die
  Straßengrenze (0,8) unter der Bebaubar-Schwelle — es entstanden Bauplätze, die
  nie ans Netz kommen konnten, ausgerechnet an den Uferkacheln für Anleger.

## D-038 — EINE verbindliche Ingame-Zeit; sichtbare Uhr als reine Projektion der Simulationszeit

**Entscheidung (P-B des Spielbarkeits-Auftrags):** Es gibt genau **eine** Zeit —
die Simulationsuhr `state.meta.lastSimTime`. Die sichtbare HUD-Uhr wird zur **reinen
Projektion** dieser einen Uhr (`src/game/time/gameTime.ts`, `getGameClock()`), statt
wie bisher die kosmetische Renderer-Tageszeit + statische „Tag 1"/„Frühling"-Texte zu
zeigen. Zentrale Zahl `SIM_MS_PER_GAME_MINUTE = 10_000` (1× → 1 Ingame-Minute je 10
Echtzeitsekunden, §7). Kein System führt einen eigenen Zeitfaktor.

**Befund:** Die Simulation war **bereits** konsistent — `advanceByRealTime(realMs,
live)` multipliziert die reale Zeit mit der Geschwindigkeit und treibt darüber alle
Systeme (Bau/Upgrade/Betriebe/Transport/Wirtschaft/Cooldowns/Missionen) durch
denselben Takt; Pause hält alles an. Kaputt war nur die **entkoppelte Anzeige**.

**Architektur:** Reines Zeitmodul (keine three/React-Importe, §1); HUD liest nur
`getGameClock()` und re-rendert über `useGame()`/`version` — **kein `setInterval` in
React** (§7.4). Der manuelle Tageszeit-Regler und der Speed-`dayLengthMin`-Hack
(zweite, widersprüchliche Zeit) sind entfernt. **Keine Save-Änderung** (v21) — die Uhr
projiziert nur `createdAt`/`lastSimTime`.

**Feinschliff nach Nutzertest (v0.89):** Der Nutzer wählte eine **schnellere Uhr**
und eine **an die Uhr gekoppelte Sonne**. Umsetzung: `SIM_MS_PER_GAME_MINUTE = 4000`
(1× → 1 Ingame-Min je 4 Echtzeit-Sek; voller Tag = 96 Echtzeitminuten bei 1×, 24 bei
4×) und die Sonne folgt der Uhr — der HUD treibt `environmentSettings.timeOfDay` aus
`getGameClock().timeOfDay` (cycle aus); bei Pause steht die Uhr → steht die Sonne. Der
manuelle Tageszeit-Regler ist auch aus dem Wetter-Panel entfernt (die Uhr besitzt die
Zeit); dort bleibt nur die reine Wetter-Atmosphäre.

**P-B2** stellt Bau-/Upgrade-/Arbeits-/Transportdauern auf Ingame-Minuten um und
balanciert sie neu (§9), auf Basis der bestätigten 4-Sekunden-Ratio.

**Verworfen:** ein Echtzeit-Timer in React; Dauern in P-B1 schon umzurechnen (bewusst
nach P-B2 verschoben, damit die Tests grün bleiben und der Nutzer die Uhr-Feel zuerst
testet).

## D-037 — Spielbarkeits-Auftrag vorgezogen; Stadtarbeit über einen eingefrorenen Planungssnapshot stabilisiert

**Entscheidung:** Auf ausdrücklichen Nutzerwunsch (24.07.2026, „ich teste im Moment
das Spielerlebnis, deshalb folgende Sachen vorziehen, sodass das Game und Fortschritt
spielbarer wird") wird ein **Spielbarkeits-Auftrag** vor die restlichen
Infrastruktur-2.0-Phasen (I3–I5) gezogen: Stadtarbeit-Stabilität, **eine** zentrale
Ingame-Zeit, Frühlogistik (Handkarren L2 + Lagerübersicht), Anleger-zu-Anleger-Netz
und ein Performance-Pass mit dauerhafter FPS-Anzeige. Umsetzung in Phasen
**P-A … P-E** (Reihenfolge = Umsetzung), jede als testbarer Meilenstein. I3/I4
(Anlegernetz, „voll ausgebaut") sind Teil von **P-D**.

**Phase P-A (dieser Stand):** Die Ursache der „während der Planung wechselnden
Aufträge" ist eindeutig: `getActivityRoutePlan` würfelte die Zielmenge bei **jeder**
UI-Abfrage neu aus der **laufenden Simulations-RNG** (`pickTargets`, `state.rngSeed`),
die **pro Tick** weiterläuft — bei laufender Uhr also jeden Controller-`version`-Bump
neu gemischt. Fix (§2 Erweitern statt neu bauen): ein **einmalig eingefrorener,
deterministischer Planungssnapshot** `activities.selection` pro offenem Auftrag.
Zielwahl über `pickTargetsSeeded`/`activitySelectionSeed` aus einem **stabilen** Seed
(Stadt-`createdAt` + Auftrag + Epoch), **nie** aus der Sim-RNG. Kein zweites System —
ein zusätzliches State-Feld an der bestehenden `ActivitiesState`.

**Architektur:** Lebenszyklus als Commands — `selectActivity` (idempotent, aus
UI-Effekt), `refreshActivitySelection` (Epoch+1, bewusste neue Ziele),
`clearActivitySelection`, plus `startActivity` räumt den Snapshot (planning→executing).
**Keine automatische Zielersetzung** (§2.4): ein abgerissenes Ziel meldet
`getActivitySelectionStatus = 'stale'` und die UI zeigt Aktualisieren/Abbrechen. Der
Snapshot ist **persistiert** (überlebt Save/Load, UI-Wechsel, Geschwindigkeit).

**Konsequenzen:** **Save v21**, rein additiv (Migration `v20→v21` nur Versionsstempel;
Alt-Saves ohne `selection` bleiben ladbar). Gilt datengetrieben für alle
Lieferauftragstypen. Detail-Audit:
[`ACTIVITY_STABILITY_AUDIT.md`](ACTIVITY_STABILITY_AUDIT.md).

**Verworfen:** stiller Zieltausch bei Invalidierung; ein separater Echtzeit-Timer in
React; die Live-RNG als Vorschauquelle beizubehalten und nur zu cachen (der Seed muss
tickunabhängig sein).

## D-036 — Infrastruktur 2.0 vorgezogen; Höhenstraßen/Brücken als Straßen-Bauklasse

**Entscheidung:** Auf ausdrücklichen Nutzerwunsch werden die zurückgestellten
10.0-Phasen (R2, R3, R4, R5, R6, R9) **nach hinten geschoben** und der neue Auftrag
**Infrastruktur 2.0** (Höhenstraßen, Brücken, Küste/Anleger, Schifffahrtsnetz,
Bevölkerungs-Rebalancing) vorgezogen. Begründung des Nutzers: entscheidender Punkt
zum Weiterspielen — die verdichtete Welt (D-035) blockiert die Expansion über
Höhen/Wasser. Master-Spec: [`INFRASTRUCTURE_2_PLAN.md`](INFRASTRUCTURE_2_PLAN.md).

**Architektur (§2 Erweitern statt neu bauen):** Höhenstraßen/Brücken sind **keine**
zweite Verkehrslogik, sondern eine **Straßen-Bauklasse** `BuildingDef.road?:
RoadClassDef` (`crossesWater`, `crossesCliff`, `maxSlope`, `bridgeCostPerTile`) über
denselben `roadNetwork`, dieselbe `validatePlacement` und dieselbe `analyseRoadPath`.
Fehlt das Feld, gilt die bisherige Bodenstraße (Wasser/Klippe/Steilhang gesperrt).
`analyseRoadPath`/`roadPathPreview` werden je Straßentyp parametrisiert (Def-Id statt
hartem `'road'`), sodass der seit jeher vorhandene, aber tote `'bridge'`-Status real
wird. Region-Ausnahme greift **nur** für die tatsächlich überbrückte Wasser-/
Klippenkachel (Region 0/undefined) — Landkacheln einer Höhenstraße bleiben
regionspflichtig. Pfeiler/Deck/Rampen sind reine Renderer-Darstellung (§1).

**Konsequenzen:** Neue Straßentypen sind **additiv** (Gebäude-Instanzen, kein
Save-Bump). Erst persistente Schiffsrouten (Phase I4) und ggf. Bevölkerungs-
Rebalancing (I5) brauchen eine lineare Migration. Schifffahrt/Anleger nutzen die
vorhandenen `waterRouteNodes/Edges`, `buildingInfrastructure.ts` und
`operations/transport.ts` wieder (kein drittes Logistiksystem). R6 (Straßen A→B) und
R9 (adaptive Uferplattform) werden innerhalb von Infrastruktur 2.0 (I2 bzw. I3)
miterledigt.

**Verworfen:** ein separater Brücken-/Wasser-Baugraph; manuell platzierte
Brückenmodelle; das Streichen (statt Zurückstellen) von R2–R9.

## D-035 — § 10.0 R7/R8: Dritte Weltverdichtung (X/Z 0,84) + flacher Uferübergang, Save v20

**Entscheidung:** Die Insel wird ein drittes Mal horizontal verdichtet — X/Z-Faktor
**0,84 zusätzlich** zum 8.1-Stand (0,7476 gegen die Ur-Insel, Fläche ≈ 0,559, ~−44 %,
`OCEAN_MARGIN_TILES` 69→99). Y bleibt getrennt bei Gipfelhöhe 52 (Gebirge nicht
flachgedrückt). Zusätzlich wird auf ausdrücklichen Nutzerwunsch das **Uferprofil
weicher** gebacken (Wasserlinie 0,0065→0,0075, Strand-Blend 6→9, Anstieg 0,42→0,28,
Klippenschwelle 7,2→9,0, Sandband breiter). Die aggressive Variante war eine bewusste
Nutzerentscheidung trotz −53 %/−26 % Bauflächenverlust; das weiche Ufer fängt einen
Teil ab und **verdoppelt die bebaubaren Uferkacheln (636→1.210)** für Häfen/Wasserbau.

**Konsequenzen:** Der Bake wählt weiter automatisch den zentralen Start (Region 9,
Rathaus (127,250), 1.668 bebaubar, echter Küstenzugang, Ressourcen-Score 1,0). Aus dem
weicheren Ufer entstehen **13 statt 12 Regionen** (mehr Land ⇒ ein zusätzlicher Seed);
`regions.config.ts` + i18n wurden vollständig aufs neue Layout neu abgeleitet
(Startkomponente {9,3,8,11,7,13} über Land, {2,5,4}/{1,6,10,12} über See). Kosten
folgen weiter dem Faktormodell. **Save v20** ist ein Weltumbau (wie v14/v16/v19):
`migrateV19ToV20` wirft `WorldRebuildSaveError`, sichert einmalig unter
`cmb.save.backup.world-v19` und startet neu — keine verlustbehaftete Projektion.

**Bewusst offen / Trade-offs (nicht geschönt):** Baugelände ist durch die Stauchung
etwas steiler; einzelne Test-Toleranzen (Bau-Ebenheit, Start-Bauflächen-Obergrenze
1.750, isolierte Küstenspitzen ≤3, Klippenrisiko <0,1) wurden an die verdichtete
Bake-Realität angepasst statt an eine geschönte Zielzahl. Gebirgs-/Inselregionen sind
bauflächenlean (Wert = Rohstoff/Strategie, Untergrenze 380). Feinschliff des
Uferprofils und stärkere Bau-Glättung bleiben mögliche Folgeschritte (R9).

## D-034 — Fog of War: eine globale Wolkenfront + distanzbasierte Kamera-Grenze (§ Change 9.0 / S3)

**Entscheidung:** Der frühere Pro-Region-Nebel (je gesperrter Region ein
Ellipsoid-`InstancedMesh` mit eigener Höhe) wird zu **einer zusammenhängenden,
weichen Front** vereinheitlicht: (1) EINE globale, absolute Nebeloberkante
(`worldFogTopY`, 86. Perzentil aller Landhöhen, gecacht) statt Pro-Region-Höhe;
(2) **Alpha-Hash-Dithering** + geringere Deckkraft + dichtere, kleinere Ballen,
damit die Silhouetten zu einer fluffigen Masse verschmelzen (kein Kapsel-Look,
keine Sortierfehler). Aufdeck-Fade, Marker und prozedurale Fallbacks bleiben.

Zusätzlich wird ein **Kamera-Clamping** neu eingeführt (existierte nicht):
`CameraExplorationBoundary` ist ein reines, three-freies Nearest-Feature-Distanzfeld
über der `regionIdAt`-Freischaltmaske. `CameraController3D.clampTarget` führt das
Blickziel auf die freigeschaltete Union + weiches Randband (soft 10 / hard 18
Kacheln) zurück und bremst die Pan-Inertia im Randband. Der Dev-Cheat
„Kamera-Grenzen aus" (`cameraBoundsDisabled`) ist **getrennt** vom Nebel-Cheat
(§7.3) und nicht persistiert.

**Grund:** §6/§7 verlangen eine ruhige, geschlossene Wolkensee ums Startgebiet und
verbieten das freie Einsehen gesperrter Landschaften. Die Wiederverwendung der
bestehenden Ballen + `regionIdAt`-Maske vermeidet ein zweites Nebel-/Regionssystem.

**Konsequenz:** Rein visuell/navigatorisch — **keine Simulation, keine
Save-Änderung** (Schema bleibt v19). Der Nebel-Retract beim Unlock läuft weiter über
die persistente `fogVolumes`-Fade-Animation (nie neu erzeugt). Der noch
verschwenderische Voll-Neuaufbau von Terrain-Deko/Vegetation beim Unlock ist
**deterministisch** (kein sichtbarer Prop-Sprung) und wird in **S4** inkrementell —
nicht in S3 vorgetäuscht. Details: `FOG_OF_WAR_AUDIT.md`.

## D-033 — Zentraler Start via Bake-Zielvorgabe (1.400), Forst-Id-Rotation, Weltumbau v19

**Entscheidung:** Die zu kleine 820-Kachel-Startregion (§ Change 9.0 §0) wird
NICHT durch manuelles Verschieben des Rathauses behoben (§3.2 verbietet das),
sondern über die **Zielvorgabe des vorhandenen Bake-Startscorings**:
`START_REGION_TARGET_BUILDABLE` 820 → **1.400**, Korridor `MIN/MAX_START_BUILDABLE`
1.200–1.750. Der Bake bewertet die zentralen Kandidaten selbst weiter. Der
größere Carve rotiert drei Wald-Regions-Ids (Nordwald 10→12, Südforst 12→11,
Ostforst 11→10); `regions.config.ts`, i18n und Freischaltbaum werden nachgezogen.
Weil sich Rathausanker und Region-Zuschnitte ändern, ist das ein echter Weltumbau
→ Save **v19** mit Backup/Neustart (`cmb.save.backup.world-v18`), Präzedenz v14/v16.

**Grund:** §3.3 verlangt 1.200–1.600 zusammenhängend bebaubare Kacheln als
langfristiges Stadtzentrum. Das reversiert bewusst die 8.1-Entscheidung „kleine
Pocket, früher Platzmangel". Die Bake-Route hält die Wahl deterministisch und
datengetrieben statt hartkodiert.

**Interpretation „≥3 Expansionsrichtungen" (§22/§23):** Der Auftrag nennt in §5.2
zugleich „eine von ZWEI angrenzenden Regionen" als Erstwahl. Aufgelöst als:
*Expansionsrichtungen* = bebaubare Himmelsrichtungen (Bake-`expansionDirectionScore`
= **1.0**, alle vier) — die Stadt ist keine Sackgasse; *Nachbarregionen* = 2
(§5.2-konform: {7,12}). Beide Kriterien sind erfüllt, ohne die 2-Regionen-Erstwahl
zu brechen.

**Konsequenz:** Regionen 1–9 bleiben physisch unverändert; nur die drei Forste und
Region 13 ändern sich. Alte Stände (v10–v18) werden gesichert und neu gestartet
(kein stiller Verlust). Nebel-/Kamera-/Vegetations-/Arbeitsmodus-Arbeit (S3–S8) ist
davon getrennt. Details: `CENTRAL_START_REGION_AUDIT.md`.

## D-032 — Lagertransport (A5) als vereinfachte Operation im bestehenden Logistiksystem

**Entscheidung:** Der manuelle Transport vom lokalen Betriebslager ins
Zentrallager ist eine eigene, additive Datenstruktur (`operations.transfers`,
Save v18) mit der Zustandsmaschine `loading → in_transit → unloading →
delivered`, gefahren von `advanceTransfers` im Live-Tick. Route/Distanz/Verkehr/
Fahrzeit kommen aus `activities/routeAnalysis.ts`, die Fahrzeugkapazität aus
`activities/logistics.ts` — **kein zweites Logistiksystem** (§8). Ziel ist ein
beliebiges Lagergebäude (Rathaus/Lagerhaus) als physischer Anlieferpunkt; die
Einlagerung schreibt in den **globalen Pool** (`state.resources`), gedeckelt
durch `derived.storageCaps`.

**Grund:** §7.2/§8 verlangen, dass lokal geerntete Ware erst über echten
Transport global nutzbar wird und dass dafür die vorhandenen Modelle
wiederverwendet werden. Ein eigener, schlanker Transfer-Datensatz (nur Skalare
persistiert; Polyline deterministisch rekonstruiert) hält den Save winzig und
alte Saves ladbar. Die globale Pool-Einlagerung statt eines separaten
Lagerhaus-Puffers ist der kürzeste ehrliche Weg, den Loop zu schließen, ohne die
bestehende Ökonomie umzubauen.

**Konsequenz:** `stats.produced` wird beim Transport **nicht** erneut erhöht (die
Ware wurde beim Fällen gezählt — kein Doppelzählen). Ein Transport bewegt genau
eine Fahrzeugladung; ist das Lager größer, warnt die UI und der Spieler wiederholt
den Transport (Mehrfachladungen/Nachfüllfahrten sind A10). Rückruf nur während
`loading`. Zwischenlager-Lagerhäuser als eigene lokale Puffer bleiben offen.
Details: `docs/agents/LOGISTICS_INTEGRATION.md`.

## D-031 — Aktive Betriebe: Passiv→Aktiv config-gated, Sägewerk zuerst, Holz bleibt lokal

**Entscheidung:** Ein Gebäude mit `BuildingDef.operation` ist ein aktiver Betrieb;
sein passiver `produce`-Pfad wird in Tick **und** Derived übersprungen, die
Produktion entsteht über Arbeiter + Ressourcenknoten und landet im **lokalen
Betriebslager**. Vorerst erhält **nur das Sägewerk** dieses Profil; geerntetes Holz
wird **nicht** automatisch global gutgeschrieben — der Transport ins Zentrallager
ist Phase A5. Ressourcenknoten (Bäume) sind deterministisch aus Wald-Kacheln
abgeleitet, nur Deltas werden persistiert (Save v17, additiv). Betroffene
Passiv-Produktionstests wurden auf den weiterhin passiven Steinbruch umgestellt.

**Grund:** Der Auftrag verlangt einen aktiven Loop und schreibt ausdrücklich vor,
„ausschließlich mit dem Sägewerk als vertikalem Referenzschnitt" zu beginnen (§27)
und lokal gebundene Ware nicht magisch überall verfügbar zu machen (§7.2/§8). Die
Config-Gate-Lösung lokalisiert die Verhaltensänderung exakt auf das Sägewerk und
hält die Gesamtbalance + die grüne Testsuite stabil. Der additive Save + die
deterministische Knoten-Ableitung folgen der bestehenden Slim-Save-Philosophie
(alte Saves bleiben ladbar, globale Ressourcen bleiben Zentral-/Übergangsbestand).

**Konsequenz:** Sägewerkholz ist bis A5 lokal gebunden (gewollte Logistik-Reibung).
`stats.produced.wood` wächst beim Einlagern (Quests bleiben stimmig). Der Transport
(A5) muss `activities/logistics.ts` + `routeAnalysis.ts` wiederverwenden — kein
zweites Logistiksystem (§8). Details: `docs/agents/ACTIVE_OPERATIONS_PLAN.md`.

## D-030 — Vegetations-Performance über einstellbare Qualitätsprofile, Dichte bleibt hoch

**Entscheidung:** Die Vegetations-Performance wird über vier persistierte
Qualitätsstufen (`graphicsQuality.ts`) gesteuert, die Dichte, Sichtweiten,
LOD-Grenzen, Schatten- und Tierbudget als konkrete Zahlen definieren. Der Renderer
liest das aktive Profil; ein Wechsel baut nur die Vegetationsgruppe neu auf.

**Grund:** Der Auftrag verlangt hohe Vegetationsdichte bei vereinfachter
FERN-Repräsentation und verbietet „Optimierung nach Gefühl". Konkrete,
getestete Profile + ein Dev-Performance-Panel machen jede Änderung messbar.

**Folge:** „Niedrig" halbiert die Dichte höchstens (Kernvegetation bleibt),
Schatten sind dort ganz aus. Die reine LOD-Funktion `vegetationLodTier` liegt für
HLOD/Impostor/Chunk-Streaming bereit; deren GPU-seitige Umsetzung ist bewusst
zurückgestellt (nur auf Zielhardware seriös messbar). Der Nebel-Cheat erzwingt
keine Maximalqualität.

## D-027 — Zweite Verdichtung getrennt in X/Z und Y, Baueinheiten fix

**Entscheidung:** Die zweite Verkleinerung skaliert nur die horizontale
Quellspannweite (420 → 374, Faktor 0,8905) und hebt die Gipfelhöhe getrennt sogar
leicht an (50 → 52). Gebäude, Straßen und Fahrzeuge werden **nicht** mitskaliert.

**Grund:** Der Auftrag verbietet ausdrücklich X=0,8·Z=0,8 (−36 %) und ein erneutes
proportionales Abflachen der Gebirge. 1 Kachel = 1 Welteinheit muss fix bleiben,
sonst bräuchten alle Footprints, Radien und Fahrzeugmaße neue Kalibrierung.

**Folge:** Fläche −20,7 % bei erhaltener Gebirgsdominanz. Voller Offline-Rebake;
die GLB bleibt Laufzeit-fern.

## D-028 — 13 bedeutende Regionen statt §3.1-Bauflächenkorridor

**Entscheidung:** Bei einem echten Konflikt zwischen §3.1 (1 800–2 800 Kacheln
nach zwei Erweiterungen) und §4 (nur zwölf Regionen) hat die **Regionsstruktur**
Vorrang. Ø 2 622 bebaubare Kacheln je Region; Start + 2 Erweiterungen ≈ 6 400.

**Grund:** 34 082 bebaubare Kacheln auf 12 Regionen ergeben rechnerisch ~2 772 je
Region; der 1 800–2 800-Korridor bräuchte 35–40 Kleinregionen — genau die
Zersplitterung, die §4 abschafft.

**Folge:** Startregion bewusst als kompakter 820-Kachel-Kern ausgeschnitten, damit
die erste echte Erweiterung trotzdem groß wirkt. Dokumentiert in
`WORLD_COMPACTION_REPORT.md`.

## D-029 — Archipel-Erschließung über echten Hafen, kein Fährsystem

**Entscheidung:** Regionen ohne Landanschluss werden über die gebackene
`seaAdjacent`-Nachbarschaft plus einen aktiven Hafen (`dock_small`/`river_port`)
in einer erschlossenen Region freigeschaltet (`regionUnlockBlocker`).

**Grund:** Die verdichtete Quellinsel ist ein Archipel; ohne Seeregel wären 8 der
12 Freischaltungen dauerhaft unerreichbar. Ein neues Fähr-/Schifffahrtssystem
verstößt gegen „erweitern statt neu bauen" — die Hafengebäude existieren bereits.

**Folge:** Der Regionsdialog benennt `needs_harbor`/`not_adjacent` ehrlich. Die
erste Erweiterung ab L3 ist gratis und ohne XP/Bürgeranliegen (reine
Progressionsgeste).

## D-023 — Ein Lieferziel gilt erst als erledigt, wenn es beliefert wurde

**Entscheidung:** `evaluateCargoRoute` merkt sich ausschließlich **erledigte**
Ziele. Ein Kontakt mit zu wenig Ladung schließt ein Ziel nicht ab, sondern wird
als `skipped`-Stopp dokumentiert; jeder spätere Kontakt zählt erneut.

**Grund:** Die frühere „erster Kontakt gewinnt"-Regel machte eine korrekt
gefahrene Tour unabschließbar, sobald der Spieler leer an einem Ziel
vorbeifuhr, nachfüllte und zurückkam — der gemeldete „4/5 Stopps"-Fehler.

**Folge:** Lieferziele, Nachfüllstopps und eine spätere Rückkehr werden über
`ActivityProgress` **getrennt** gezählt und nie in einer Zahl vermischt.
`returnRequired` ist heute ehrlich immer `false`, weil das Missionsmodell keine
Pflichtrückkehr kennt.

## D-024 — Fehlende Kennzahlen werden weggelassen, nicht als „–" gezeigt

**Entscheidung:** Der Abschlussbericht `ActivityRunResult` führt jede Kennzahl
optional. Fehlt sie, weil es sie für den Auftragstyp nicht gibt (eine Inspektion
hat keine Strecke), entfällt die Zeile im Popup vollständig.

**Grund:** Ein Platzhalter wie „– %" sieht aus wie ein Fehler und lässt offen,
ob der Wert fehlt oder null ist. Weglassen ist die ehrlichere Aussage.

## D-025 — Simulationsgeschwindigkeit ist ein Zeitfaktor, keine Ertragsschraube

**Entscheidung:** `advanceByRealTime(realDeltaMs, live)` rechnet reale Zeit ×
`SimulationSpeed` (0/1/2/4) in Simulationszeit um und schickt sie durch denselben
einen Tick-Pfad. Pause bedeutet: es vergeht keine Simulationszeit.

**Grund:** Nur so können Einnahmen, Verbrauch, Produktion, Wachstum und Bauzeit
strukturell nicht auseinanderlaufen. Ein System, das nur die Einnahmen
beschleunigt, ist damit gar nicht erst baubar.

**Folge:** Die Geschwindigkeit ist eine Sitzungseinstellung und bewusst **nicht**
im Save (kein Schema-Bump). `meta.lastSimTime` ist dadurch absichtlich von der
Wanduhr entkoppelt; jedes zeitabhängige System rechnet ohnehin gegen diese Uhr.
Im Renderer trennt `simDt = dt × speed` die Weltanimation von Kamera und
Eingabe, damit die Oberfläche in der Pause bedienbar bleibt.

## D-026 — Vegetationsbudgets gelten pro Region, nie über die ganze Welt

**Entscheidung:** Prop-Deckelung erfolgt je Region und Proptyp über einen
Positions-Hash (`selectPropTiles`), nicht über den Arrayindex einer weltweiten
Kachelliste.

**Grund:** Die indexbasierte Deckelung koppelte die Auswahl an die Listenlänge.
Ein Region-Unlock verschob die Schrittweite und ließ Bäume in längst sichtbaren
Regionen verschwinden — genau das verbietet der Auftrag (§16: Auswahl nur aus
Seed, Region, Terrain, Position, Biomprofil).

**Folge:** Die Gesamtinstanzzahl wächst mit der Zahl freigeschalteter Regionen.
Draw-Calls bleiben konstant (`InstancedMesh` je Proptyp); der Vollinsel-Reveal
muss auf Zielhardware vermessen werden, bevor `REGION_PROP_BUDGET` steigt.

## D-020 — Infrastrukturanschluss ist Betriebszustand, keine Platzierungssperre

**Entscheidung:** Gültige Gebäude dürfen ohne Straße existieren. Anschluss wird
aus dem bestehenden Straßen- und Wassergraphen abgeleitet; nur `connected`
trägt volle Simulationswirkung. Häfen können `water_only` beziehungsweise
`road_only` sein.

**Grund:** Der Spieler soll neue Siedlungskerne vorbereiten und Netze danach
heranführen können. Eine UI-Sonderregel oder zweite Simulation würde denselben
Zustand doppelt führen.

## D-021 — Wassergraph und Routenvorschau bleiben abgeleitet

**Entscheidung:** Der Bake exportiert ausschließlich nachweislich wassergebundene
Kanten. `ShippingRoutePreview` ist ein Controller-Read-Modell und wird nicht
persistiert.

**Folge:** Das Overlay kann keine Linie durch Land erfinden. Aktive Routen,
Schiffe, Kosten und Kapazitäten erfordern später ein kanonisches Game-/Save-
Modell mit Migration.

## D-022 — Visuelle Weltaufdeckung ist kein Unlock

**Entscheidung:** `fogDisabled`/`revealLockedRegionsVisually` liegen im UI-/
Rendererpfad. Nur `debugUnlockAllRegions` mutiert die Regionstates und lässt
nicht erschließbare Teaserregionen gesperrt.

**Folge:** Vegetation und Props können für Visual Audits sichtbar sein, ohne
Progression, Save oder Interaktion zu verändern.

## D-001 — Ein Renderer

**Entscheidung:** Three.js bleibt der einzige aktive Renderer.  
**Folge:** Minimap und Routenplaner sind leichte Canvas-Projektionen, keine
alternativen Spielrenderer.

## D-002 — Ein primäres Sheet

**Entscheidung:** Panel, Gebäudedetail, Regionsdialog und Routenplaner schließen
einander. Das Bürgerdetail folgt derselben Regel.  
**Grund:** Mockup-Hierarchie, Spielwelt bleibt sichtbar, keine Überlappung.

## D-003 — Vertikale Hauptnavigation

**Entscheidung:** Die Hauptziele stehen links als kompakte vertikale Leiste.  
**Grund:** Das zuletzt übermittelte Master-Mockup ist die jüngste verbindliche
Referenz und zeigt die Welt freier als die frühere untere Navigation.

## D-004 — 12 px Mindestschrift

**Entscheidung:** Keine UI-Schrift unter 12 px.  
**Folge:** Bei Platzmangel werden sekundäre Inhalte ausgeblendet oder Fenster
scrollen; Text wird nicht weiter verkleinert.

## D-005 — Tagesgeschwindigkeit ist visuell

**Entscheidung:** Pause/1x/2x/4x steuern nur den Tageslichtzyklus.  
**Grund:** Es existiert noch keine autorisierte Simulationsgeschwindigkeit.

## D-006 — Stadtarbeit erweitert bestehende Aktivität

**Entscheidung:** Planung liefert Zielreihenfolge an denselben
Aktivitäts-Command und denselben Fortschritt.  
**Verworfen:** paralleles Routenquest-/Belohnungssystem.

## D-007 — Verkehrswerte bleiben als Schätzung gekennzeichnet

**Entscheidung:** Aktuelle Farben/Prognosen sind reine UI-Schätzung mit
`TODO(CLAUDE_LOGIC)`.  
**Folge:** Keine Belohnung oder Save-Entscheidung darf sie als Wahrheit nutzen.

## D-008 — KI-Assets nur mit Fallback

**Entscheidung:** Wappen, Wolken, Regions-Hero und Landmarken werden über die
Drop-in-Registries geladen.  
**Folge:** Löschen oder Fehlen einer Datei darf weder Boot noch Gameplay brechen.

## D-009 — Info-Layer ist Präsentation

**Entscheidung:** Probleme, Bedürfnisse, Upgrades und Produktion werden im
UI-Store gefiltert und aus vorhandenen Renderer-/Controller-Daten dargestellt.
**Folge:** Ein Layer darf niemals Produktion, Bedarf, Questfortschritt oder Save
beeinflussen.

## D-010 — Mockup ist keine Regelspezifikation

**Entscheidung:** Visuelle Elemente aus Mockups werden nur mit kanonischen Daten
aktiv. Fehlende Kartenpositionen und Regionsvorschauen bleiben deaktiviert bzw.
als Skeleton/TODO gekennzeichnet.
**Verworfen:** erfundene Prioritäten, Radien, Gebäude-Freischaltungen oder
Verkehrswerte, nur damit ein Mockup vollständig aussieht.

## D-011 — Wetter-Presets sind Renderer-Präsentation

**Entscheidung:** Sonne, Regen und Nebel werden in `environmentSettings`
gespeichert und ausschließlich von `SkyEnvironment` dargestellt.
**Folge:** Keine Wirtschafts-, Bedarfs-, Quest-, Verkehrs- oder Save-Wirkung.
Spielerisches Wetter braucht später eine eigene Regelentscheidung und Tests.

## D-013 — Routenanalyse ist kanonische Prognose, keine Auszahlung

**Entscheidung:** `analyseActivityRoute` liefert die Verkehrs-/Effizienzwerte des
Planers aus dem echten Straßengraphen. Die tatsächliche Belohnung entscheidet
weiterhin die Ausführungsqualität (Fahrzeit gegen Zeitlimit).
**Grund:** Reihenfolge-/Netzgüte soll sichtbar wirken, ohne die Balance aus der
Planungs-UI heraus zu verschieben. Ersetzt D-007 (Schätzung) für die
Anzeigewerte.
**Verworfen:** `rewardMultiplier` sofort an die Auszahlung koppeln — das ist eine
spätere Balancing-Entscheidung (Phase C7) mit Gesamt-Simulation.

## D-014 — Handroute ist persistierter Teil derselben Aktivität

**Entscheidung:** Eine Fahrmission speichert optional `vehicle` und
`plannedRoadPath` in `ActiveActivity`. Der Pfad besteht aus orthogonal
zusammenhängenden Straßenkacheln und wird am Controller-Rand vollständig
validiert.

**Grund:** Die neuen Mockups verlangen echte manuelle Planung und automatische
3D-Ausführung. Ein rein lokaler UI-Pfad würde beim Schließen/Neuladen verloren
gehen; ein zweites Missionssystem würde D-006 verletzen.

**Folge:** Save v12 mit linearer `11→12`-Migration. Alte Missionen besitzen die
optionalen Felder nicht und verwenden unverändert die frühere Wegfindung.

**Verworfen:** automatische Lückenfüllung zwischen Klicks, UI-erfundene
Steigungs-/Straßenzustandswerte und eine parallele Routenbelohnung.

## D-015 — Ladung ist Transportvolumen, Quelle ist ein räumlicher Anker

**Entscheidung:** Stadtarbeit-Logik 2.0 führt `cargoModel` als transportiertes
Volumen ein (füllt das Fahrzeug, erzwingt Nachladen), getrennt vom
Ökonomie-Verbrauch `costPerTarget`. Da es keine gebäudeeigene Lagerhaltung gibt,
ist eine „Quelle" nur ein räumlicher Anker (Farm/Markt/Lager); der Bestand bleibt
der globale Pool.

**Grund:** §2 des Auftrags verlangt, dass Kapazität wirkt, ohne eine komplette
Gebäude-Inventar-Schicht (großes Datenmodell + Save-Risiko) einzuführen. Der
globale Pool ist die bestehende Wahrheit; ein Anker genügt für Route und Etappen.

**Folge:** L2 ist reine Planungs-/Prognoseschicht (`activities/logistics.ts`,
`getActivityCargoPlan`) ohne Save-/Auszahlungs-/Ökonomieänderung (Schema v12).
Pool-Reservierung und reale Entnahme an der Quelle folgen in L3 (Save v13).

**Verworfen:** ein `inventory` je `BuildingInstance`; sofortige Kopplung von
`cargoModel` an den Live-Verbrauch (verschöbe die `activeplay`-Balance vor dem
Balancingtest in L5).

## D-016 — Ladung wird upfront an der Quelle reserviert, Verbrauch bleibt netto gleich

**Entscheidung:** Eine Ladungsmission (`costPerTarget`) entnimmt beim Start die
volle Menge `costPerTarget × Ziele` aus dem globalen Pool und hält sie in
`ActiveActivity.reserved`. Auslieferungen ziehen daraus; Abbruch gibt den Rest
zurück (gedeckelt durch die Lagerkapazität). Reicht der Vorrat nicht, startet die
Mission nicht.

**Grund:** §4/§5 verlangen reale Entnahme an der Quelle und Schutz vor
Doppelnutzung. Weil die Ware sofort den Pool verlässt, sehen Handel/Bau sie nicht
mehr — Reservierung ohne einen ökonomieweiten Umbau von `canAfford`.

**Folge:** Verbrauch **netto identisch** zum alten Pfad (nur Zeitpunkt: Start
statt pro Ziel) → kein Balancing-Eingriff. Save v13 mit Migration `12→13`;
Alt-Missionen ohne `reserved` nutzen den bisherigen Pool-Pfad.

**Verworfen:** eine „weiche" Reservierung, die den Pool erst bei Auslieferung
belastet (schützt nicht vor Doppelnutzung); Verbrauch nach `cargoModel`-Volumen
statt `costPerTarget` (verschöbe die Balance vor dem L5-Test).

## D-017 — Logistik-Bewertung ist zweischichtig: Prognose + konkrete Fahrt

**Entscheidung:** L4 liefert zwei reine, deterministische Read-Bewertungen.
`evaluateInfrastructure` ist die **planungsseitige Prognose** (vor/ohne
gezeichneten Pfad): Leerfahrtanteil aus den Nachlade-Rückfahrten der Cargo-
Etappen, Fahrzeugeignung (Kapazität vs. Bedarf, Handling in engen/vollen
Straßen), Quellenlage, Geradheit, Lade-/Entladezeiten in der Gesamtdauer,
Verderbrisiko und textfreie Hinweiscodes. `evaluateCargoRoute` ist die
**konkrete Auswertung eines bereits gezeichneten Pfades**: sie erkennt echte
Quell-/Nachladekontakte entlang der Kette und misst die tatsächlich leer
gefahrenen Kacheln.

**Grund:** §19 verlangt den Leerfahrtanteil als Kernbewertung. Die Planungs-UI
braucht ihn schon **vor** dem Zeichnen (Prognose), die Ausführungs-/Kontroll-UI
**nach** dem Zeichnen (Ist-Wert). Beide teilen dieselben Cargo-/Routendaten,
bleiben aber getrennt, damit keine erfundene Geometrie in die Prognose fließt.

**Folge:** Fahrzeugeignung kommt als **optionale** Config an
`ActivityVehicleDef` (`loadTimeSec`, `unloadTimeSecPerTarget`,
`narrowStreetPenalty`, `cooling`) — nur Bewertung liest sie, **kein Save-Bump**.
Read-Helper `getActivityInfrastructure`, `getActivityInfrastructureWarnings`,
`getActivityCargoRoute`.

**Verworfen:** Kopplung des Leerfahrtanteils/der Eignung an die Auszahlung
(bleibt Anzeige, D-013); eine einzige Bewertung, die aus dem gezeichneten Pfad
auch die Prognose ableitet (verwischt Soll/Ist und erzwingt einen Pfad, bevor
der Spieler plant).

## D-018 — Spontane Stadtarbeit speichert keine Standardroute

**Entscheidung:** Der unbestätigte Plan bleibt lokaler UI-Draft. Planname,
`localStorage`-Speichern/Laden und „Letzte Route“ sind entfernt. Erst der
bestätigte `{vehicle, roadPath}`-Plan wird über den bestehenden Command in der
laufenden Aktivität persistiert.

**Grund:** Ziele, Quelle, Warenmenge, Fahrzeug, Verkehr und Nachfüllbedarf ändern
sich pro Auftrag. Eine wiederverwendete ideale Strecke würde die eigentliche
Planungsentscheidung umgehen. Dauerhafte Handelslinien wären ein separates,
bewusstes Gameplay-System.

**Folge:** Kein neuer Save-State und kein Schema-Bump (v13 bleibt). Öffnen oder
Wechseln einer Mission startet einen auftragsbezogenen frischen Draft.

**Verworfen:** automatische Wiederverwendung einer früheren Route; separates
persistiertes Planarchiv innerhalb spontaner Stadtarbeit.

## D-019 — Reihenfolge entsteht aus der Straße, nicht aus einer UI-Liste

**Entscheidung:** `targetOrderOnPath` leitet die Reihenfolge deterministisch aus
der ersten tatsächlichen Berührung jedes Straßenankers ab. `ActivityRoutePreview`
ist die gebündelte Wahrheit für Reihenfolge, Cargo-Stopps, Analyse und Abschluss.

**Grund:** Die Route ist die spielerische Entscheidung. Eine zusätzliche
Drag-&-Drop-Liste erzeugt zwei konkurrierende Wahrheiten und technischen
Bedienaufwand.

**Folge:** React hält keine Zielsortierung. Eine Route kann nur bestätigt werden,
wenn der Controller alle Pflichtziele lückenlos und cargo-gültig erkennt.

**Verworfen:** Zielnummern vor dem Zeichnen; stilles Auto-Routing; lokale
Reihenfolgeheuristik im Canvas.

## D-012 — Großer Baushop ist ein Breakpoint, kein zweites UI-System

**Entscheidung:** Ab 1680×860 dockt dieselbe `BuildMenu`-Komponente vollhoch
rechts; darunter bleibt sie als Bodenleiste.
**Grund:** Die Premium-Mockups nutzen PC-Fläche, ohne doppelte Logik oder
abweichende Datenquellen einzuführen.
