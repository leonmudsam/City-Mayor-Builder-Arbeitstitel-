# Stadtarbeit 3.0 — Open-World-Aufträge statt Routen-Minispiel

Verbindlich vor jeder Arbeit an Stadtarbeit, Missionen oder Fahren.
Löst `CITYWORK_OVERHAUL_PLAN.md` als Einstieg ab (dessen Befunde bleiben gültig).

---

## 1. Ist-Zustand — gemessen, nicht vermutet

| Auftragspunkt | Gemessener Ist-Zustand |
| --- | --- |
| „fühlt sich wie Routenplaner an" | **Bestätigt, und die Zahlen sind eindeutig.** `ActivityRoutePlanner.tsx` = 928 Zeilen, `ManualRouteMap.tsx` = 1.764 Zeilen. Zusammen 2.692 Zeilen Planungsoberfläche gegen 86 Zeilen `ActivityExecutionWidget`. |
| „echte Welt statt 2D-Karte" | **Halb erfüllt, halb nicht.** Seit D-062 ist die Karte eine orthografische **Aufnahme derselben 3D-Szene** — sie zeigt also echte Gebäude. Aber sie ist eine **Aufnahme**: Gefahren, geklickt und geladen wird auf einem Canvas daneben, nicht in der Welt. |
| „Selbstfahren ist nicht gut genug" | **Der 3D-Fahrmodus ist gar nicht erreichbar.** `ThreeMapRenderer.enterDrive()` existiert vollständig (Straßenbindung, Kreuzungsabsicht D-060, Verfolgerkamera, Fahrzeugmodell) und ist über `mapApi` exponiert — **kein einziger Aufrufer** in `src/components/**`. Auch `DriveHud.tsx` ist gemountet, wird aber nie sichtbar. Gefahren wird ausschließlich in der 2D-Karte (D-050). |
| „keine feste Reihenfolge" | **In der 2D-Karte erfüllt, in der 3D-Welt nicht.** `progressActivity` akzeptiert seit D-054 *jedes* offene Ziel; `ThreeMapRenderer.updateDrive` prüft aber nur `targets.find(!done)` — den **ersten**. Im 3D-Modus wäre die Reihenfolge damit doch erzwungen. |
| „Gebäude sollen interaktiv sein" | **Nur in der 2D-Karte** (`MapBuildingCard`, seit v1.38). In der 3D-Welt gibt es während einer Mission keine Gebäudeaktion. |
| „mehrere Missionstypen" | Config kennt `delivery`/`inspection`/`decision` und 9 Aufträge. Es fehlen: Baustelle, Produktion, Lager-zu-Lager, Hafen als Etappe. |
| „Bewertung/Qualität" | **Vorhanden** (`RouteReview`, Zeit/Distanz/Leerfahrt/Ladungseffizienz, Modus-Aufschlag D-061). |

**Kurz:** Es fehlt nicht die Fahrphysik und nicht die Weltdarstellung. Es fehlt,
dass der Einsatz **in der Welt** stattfindet — und dass der vorhandene
3D-Fahrmodus überhaupt aufgerufen wird.

---

## 2. Zielbild

> Stadtarbeit ist kein Planer mit angehängter Ausführung, sondern ein
> **Einsatz in der gebauten Stadt**. Der Auftrag nennt das Problem, die Welt
> ist das Spielfeld, und der Spieler entscheidet unterwegs.

---

## 3. Architektur — die verbindlichen Entscheidungen

### D-068: Der Einsatz findet in der 3D-Welt statt (kehrt D-050/D-051 um)

D-050 hat festgelegt: „gefahren wird in der bestehenden 2D-Stadtarbeitskarte,
**nicht** in der 3D-Welt". D-051/D-062 haben diese Karte dann so weit
verbessert, dass sie eine Aufnahme derselben Szene ist.

**Dieser Auftrag kehrt das um** — ausdrücklich und auf Nutzerwunsch: „echte
Weltansicht statt flacher Karte", „Die Stadtarbeit soll wie ein hochwertiger
Spielmodus in der echten Welt aussehen", und das Mockup zeigt das Fahrzeug in
der 3D-Stadt mit Kreuzungsanzeige.

Das ist **kein zweiter Renderer** (CLAUDE.md §2): Der Einsatz läuft im
vorhandenen `ThreeMapRenderer` mit einer eigenen **Einsatzkamera**. Und es ist
**keine zweite Fahrphysik**: `game/activities/driving.ts` bleibt die eine
Funktion, die schon heute von 2D-Karte und 3D-Renderer gemeinsam benutzt wird.

Die 2D-Karte verschwindet nicht, sie **wechselt die Rolle**: von der
Spielfläche zur *Übersicht* (wo liegen Ziele, Lager, Quellen). Der Grund, warum
sie überhaupt bleiben darf: Sie ist seit D-062 kein zweites Weltbild, sondern
eine Aufnahme derselben Szene — sie kann also nicht auseinanderlaufen.

### D-069: Die Mission wird ERWEITERT, nicht neu gebaut

Der Auftrag schlägt `CityWorkMission`/`CityWorkRun`/`CityWorkStop` vor. Die
Prüfung zeigt: `ActivityDef` und `ActiveActivity` tragen davon bereits das
meiste — Fahrzeug, erlaubte Fahrzeuge, Ladung, Reservierung, Quelle (D-052),
Ziele, gefahrene Strecke (D-054), Ausführungsart (D-050/D-061), Belohnung,
Qualitätsregeln.

Ein paralleles `CityWorkRun` wäre ein **zweites Missionssystem im selben Save**
— genau das, was CLAUDE.md §2 verbietet, und der Weg zu zwei Wahrheiten über
„läuft gerade ein Auftrag?".

Ergänzt wird deshalb nur das wirklich Fehlende: **`ActiveActivity.stops`** — die
Liste der anfahrbaren Orte mit ihrer ROLLE (`source` / `target` / `storage` /
`optional`), Ware und Menge. Damit wird aus „Ziele abarbeiten" ein Einsatz mit
Quellen, Zwischenstationen und Wahlmöglichkeiten, ohne dass ein zweites Modell
entsteht.

### D-070: Freie Reihenfolge heißt: jeder Halt zählt, überall

Die Regel steht seit D-054 in der Simulation (`progressActivity` nimmt *jedes*
offene Ziel). Sie muss an **jeder** Ausführungsstelle gelten — die 3D-Fahrt
prüfte bisher nur das erste offene Ziel und hätte die Reihenfolge dadurch
wieder erzwungen, obwohl die Simulation sie längst freigegeben hatte.

**Merksatz:** Eine Freiheit, die nur eine von zwei Ansichten gewährt, ist keine.

---

## 4. Umsetzungsschritte

| # | Schritt | Zustand |
| --- | --- | --- |
| A1 | Einsatzmodus in der 3D-Welt erreichbar machen (Board → Einsatz starten) | **erledigt** (v1.40) |
| A2 | Freie Zielreihenfolge auch im 3D-Fahren (D-070) | **erledigt** |
| A3 | Einsatzkamera („leicht von oben", taktisch) statt tiefer Verfolgerkamera | **erledigt** — Abstand 14, Neigung 0,92 |
| A4 | Kreuzungsanzeige in der 3D-Welt (aus `nextJunction`, wie die Karte) | **erledigt** |
| A5 | Gebäudeaktion am aktuellen Ort (laden/entladen/prüfen) | **erledigt** |
| A6 | Haltestellen-Modell (D-069, **abgeleitet** statt persistiert) | **erledigt** — keine Migration, Save v33 |
| A7 | Einsatz-HUD nach Mockup; Stadt-HUD tritt im Einsatz zurück | **teils** — HUD steht, Planer-Aufräumen offen |
| A8 | Weitere Missionstypen (Baustelle, Produktion, Lager-zu-Lager) | **offen** |
| A9 | Kleine aktive Ereignisse | **offen** |
| A10 | Route speichern → automatisieren | **offen** |

### Was A1 wirklich gekostet hat

Der Einstieg über den Planer war schnell verdrahtet. Der **Wiedereinstieg** war
die eigentliche Arbeit: „Selbst fahren" im Auftrags-Widget öffnete den Planer
(der alte D-050-Weg), also führte jedes Q ins Panel statt zurück ans Steuer. Ein
Einstieg, der nur einmal funktioniert, ist keiner. Jetzt gibt es genau eine
Funktion dafür (`enterMission`), und drei Stellen rufen sie: Auftrag annehmen,
Weiterfahren, Zwischenbilanz.

### Was beim Abräumen der 2D-Fahrschleife mitging

`ManualRouteMap` verlor 1.764 → 1.290 Zeilen: Fahrschleife, `DriveState`-Refs,
Spur, Fahrzeugzeichnung, Tastenbelegung, `DriveReadout`. `ActivityRoutePlanner`
verlor `JunctionChoice`, `DriveHud`, die Fahr-Seitenleiste und den
„Hier nachladen"-Knopf; `src/components/hud/DriveHud.tsx` ist gelöscht.
**Mitgehen musste** `recordActivityDrive` (siehe D-068) und die Zwischenbilanz
(`MissionReview`, D-061) — beide hingen an der Karte, gehören aber zum Fahren.

### Gefunden, weil der Einsatz in die Welt zog

**D-071: Das Fahrzeug fuhr unter der Insel.** Gemessen im laufenden Spiel:
Fahrzeughöhe 0,07 bei einem Boden von 6,47. 91 von 96 Straßen des Testspielstands
trugen ein gespeichertes `roadEngineering.roadHeight: 0` aus einer früheren
Welt. Das traf nicht nur den Wagen — die **Fahrbahnen selbst** lagen im Boden;
in der Stadtansicht sah das schlicht nach „hier ist keine Straße" aus. Behoben,
indem flache Straßen ihre Höhe wieder aus `terrainHeightAt` ableiten (D-043).

### Im laufenden Spiel gemessen (Playwright, 0 Konsolenfehler)

* „Selbst fahren" → Einsatz-HUD sichtbar, **Planer bleibt zu**
* fährt ohne gedrückte Taste, HUD „80 km/h · offene Ziele 2 von 3 · gefahren 0,05 km"
* Kreuzungsanzeige „Nächste Kreuzung in 88 m — links A · rechts D · wenden S"
* Halte „LAGER Rathaus 280 · 41 m | ZIEL Kleines Haus 40 · 61 m | ZIEL … 90 m"
* Q → Zwischenbilanz in der Welt; „Weiterfahren" führt zurück ans Steuer

## 5. Offene Risiken — ehrlich benannt

* **D-068 kehrt eine ausdrückliche Nutzerentscheidung um.** Wer später wieder
  in der 2D-Karte fahren will, muss D-068 zurücknehmen — nicht beides parallel
  betreiben. Zwei Fahrflächen sind zwei Bedienkonzepte.
* **Die Einsatzkamera ist eine Abwägung.** „Leicht von oben" ist lesbarer, macht
  aber Höhenunterschiede undeutlicher. Die Kachelzuordnung bleibt korrekt, weil
  Ziele und Klicks über den Straßengraphen laufen und nicht über den
  Bildschirmpunkt.
* **Performance:** Der Einsatz läuft in der vollen Welt. Marker müssen
  gebündelt, Overlays dürfen nicht pro Frame neu aufgebaut werden.
