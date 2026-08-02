# Stadtarbeit-Overhaul — Phase 1: Bestandsaufnahme

**Stand:** 1. August 2026 · **Auftrag:** „Stadtarbeit Overhaul / Manuelle Logistik
& Verkehrssystem" (Mockup beigefügt) · **Status:** Phase 1 abgeschlossen,
Phasen 2–7 offen.

Verbindlich vor jeder Stadtarbeit-Änderung. Dieses Dokument misst den **Ist**-Zustand
gegen die Akzeptanzkriterien des Auftrags — nicht, was die Aufgabenliste vermutet.
Das hat sich in diesem Projekt viermal in Folge (G2 ③/④/⑤) als der teure
Unterschied erwiesen.

---

## 0. Zwei Konflikte mit bestehenden Festlegungen

Beide betreffen Regeln, die der Auftraggeber selbst gesetzt hat. Sie sind hier
benannt, nicht entschieden.

### 0.1 Manuelles Fahren gegen Active Simplicity (D-039)

CLAUDE.md führt als **oberste Designregel**:

> Der Spieler entscheidet. Die Stadt arbeitet. … Jede Aktion, die der Spieler
> mehr als drei Mal hintereinander ausführen muss, wird automatisiert oder durch
> ein dauerhaftes Regelwerk ersetzt. … Automatisiert wird **Ausführung**, nie
> **Wahl**. Diese Regel schlägt im Konflikt jede frühere Feature-Planung — sie
> löst ausdrücklich A5/D-032 (manueller Transport) … als *Bedienkonzept* ab.

Der Auftrag verlangt das Gegenteil: WASD-Fahren ist wiederholte **Ausführung**.
Wird er umgesetzt, muss **D-039 ausdrücklich geändert** werden (etwa: „Ausführung
wird automatisiert, außer sie ist selbst das Spiel" — Fahren als freiwilliger,
belohnter Modus neben einer Automatik). Sonst widersprechen sich CLAUDE.md und
der Code, und der nächste Durchgang trifft die falsche Entscheidung.

**Empfehlung:** Fahren als **Wahl** modellieren, nicht als Pflicht — der Spieler
entscheidet je Auftrag „selbst fahren" (Bonus, Kontrolle) oder „fahren lassen"
(schneller, kein Bonus). Damit bleibt D-039 im Kern gültig und der Auftrag ist
erfüllt.

### 0.2 „2D ANSICHT" im Mockup

Der 2D-/Iso-Pixi-Renderer ist seit Ausbaustufe 2.0 **endgültig entfernt**
(CLAUDE.md: „kein Modus-Wähler wieder einführen", `archive/legacy-2d/` nicht
reaktivieren). Das Mockup wird deshalb als **Planungsansicht** gelesen:
Draufsicht-Kamera plus Karten-Overlay im bestehenden Three-Renderer — nicht als
zweiter Renderer.

---

## 1. Was bereits existiert (gemessen)

### 1.1 Das manuelle Fahren ist vollständig implementiert

`ThreeMapRenderer.enterDrive()/updateDrive()/exitDrive()` (~120 Zeilen):

- **WASD *und* Pfeiltasten**, Q/ESC beendet — `ui.drive.controls` sagt das auch so.
- Arcade-Längsdynamik: Gas, Ausrollen, Rückwärts halb so schnell,
  geschwindigkeitsabhängiges Lenken.
- **Straßenbindung ist da:** verlässt das Fahrzeug `roadSet`, wird es abgebremst
  (Faktor 0,86/Schritt) und zur nächsten Straßenkachel gezogen; auf der Straße
  zieht es sanft zur Fahrbahnmitte.
- Verfolgerkamera (`setChase`), Zielankunft über Reichweitenprüfung →
  `onDriveProgress`, `DriveHud` mit Restzeit und Zielzähler.

**Damit sind die Akzeptanzkriterien 1–3 („Spieler kann Fahrzeug selbst fahren",
„WASD/Pfeiltasten funktionieren", „Fahrzeug bleibt auf Straßen") bereits erfüllt.**
Das Problem ist nicht das Fehlen, sondern die **Erreichbarkeit**:

| | |
|---|---|
| Aktivitäten insgesamt | **28** |
| davon mit `drive: true` | **8** |
| Klicks bis zum Lenkrad | Auftrag → „Route" → Planer → Route speichern → Start → „Selbst fahren" |

### 1.2 Das „Excel"-Gefühl kommt aus dem Planer, nicht aus der Fahrt

| Datei | Zeilen |
|---|---|
| `citywork/ManualRouteMap.tsx` | 756 |
| `panels/ActivityRoutePlanner.tsx` | 590 |
| `citywork/TourOverview.tsx` | 191 |
| `citywork/VehicleSelector.tsx` | 167 |
| `citywork/RouteSummary.tsx` | 78 |
| `citywork/InfrastructureAdvisor.tsx` | 72 |
| `citywork/ActivityExecutionWidget.tsx` | 67 |
| `panels/CityWorkPanel.tsx` | 158 |
| `hud/DriveHud.tsx` | 46 |
| **Summe Stadtarbeit-UI** | **2.125** |

Davon sind **1.346 Zeilen (63 %) reine Planung** vor der ersten gefahrenen
Kachel. Die Fahrt selbst hat 46 Zeilen HUD.

### 1.3 Verkehr existiert bereits — aber als Standwert, nicht als Verkehr

`routeAnalysis.ts` liefert je Segment `congestionScore` (0..1) und `load: 0|1|2|3`
— **exakt die vier Stufen des Mockups** (grün/gelb/orange/rot). `estimatedDurationMs`
streckt die Fahrzeit mit `CONGESTION_TIME_FACTOR`, `congestionRisk` und
`efficiencyScore` fließen in Medaille und Belohnungsprognose.

**Aber:** `congestionScore` kommt aus der **Anrainerdichte** der Straßenkacheln —
wie viele Gebäude an der Straße stehen. Kein Fahrzeug beeinflusst ihn. Der Auftrag
verlangt („Die Route beeinflusst: Straßenbelastung, Verkehrsaufkommen") genau die
fehlende **Rückkopplung**. Das ist die eigentliche Lücke in Punkt 7, nicht die
Anzeige.

### 1.4 Der Straßengraph ist vorhanden und darf nicht verdoppelt werden

`roads/roadRouting.ts` (gewichtetes deterministisches Dijkstra, 252 Zeilen) +
`derived.roadNetwork` + `analyseRoadPath` sind die bestehende Verkehrsgrundlage
(I2/D-036). CLAUDE.md §8: **„Keine zweite Logistik-Simulation anlegen — Transport
(A5) wiederverwendet `activities/logistics.ts` + `routeAnalysis.ts`."** Ein
„Fahrgraph mit Kreuzungen als Knoten" (Auftrag Punkt 3) **existiert bereits**;
`intersections` wird daraus schon gezählt.

### 1.5 Fähren sind zur Hälfte vorbereitet

`cargo_barge` ist als Fahrzeug konfiguriert (L6, Kapazität 260, `operatingCost`
900, Stärke `vehicle.strength.water`) und ausdrücklich als „reines Routen-Fahrzeug"
markiert — keine Stadtarbeit-Mission listet ihn. Die persistenten Schiffsrouten
(I4) sind dokumentiert offen. Punkt 8 des Auftrags („Datenstruktur vorbereiten")
ist damit größtenteils bereits erledigt.

---

## 2. Die echte Lücke: es gibt keine Lagerbestände je Gebäude

Das ist der schwerwiegendste Befund, weil er **Simulation** ist, nicht UI.

`activities/logistics.ts` hält im Kopfkommentar fest:

> Es gibt **KEINE** gebäudeeigene Lagerhaltung — Ressourcen liegen im globalen
> Pool. `cargoModel` beschreibt die TRANSPORTIERTE Menge …; der tatsächliche
> Ressourcenverbrauch bleibt `costPerTarget`.

Das Mockup zeigt dagegen (Panel 4 „NACHLADEN – FLEXIBLE OPTIONEN"):

```
Rathaus Lager     600 / 1200
Lagerhaus Nord    800 / 1000
Lagerhaus Hafen   400 /  800
```

**Drei verschiedene Bestände.** Auf dem globalen Pool gebaut, zeigten alle drei
dieselbe Zahl — die Entscheidung „fahre ich zum näheren oder zum volleren Lager"
wäre eine Attrappe. Punkt 6 des Auftrags („Lager muss Ressource besitzen, freie
Kapazität haben, erreichbar sein" · grün/gelb/rot je Bestand) ist **ohne
Simulationsänderung nicht ehrlich umsetzbar**.

Gleichzeitig gilt: **es gibt bereits lokale Lager** — im Betriebssystem
(`operations/**`, Save v17+): Sägewerk, Steinbruch und Farm haben
`BuildingInventoryView` mit `storageCapacity` je Ausbaustufe, und
`operations/transport.ts` bringt Ladung von dort ins Zentrallager.

**Es existieren also schon zwei Lagermodelle nebeneinander** (globaler Pool für
Stadtarbeit, lokale Inventare für Betriebe). Der Overhaul muss sie
zusammenführen — nicht ein drittes anlegen (§2/§8).

---

## 3. Was der Auftrag tatsächlich verlangt (nach Abzug des Vorhandenen)

| # | Auftragspunkt | Ist | Zu tun |
|---|---|---|---|
| 2 | Manuelles Fahren WASD | **fertig** | erreichbar machen, für alle Auftragsarten öffnen |
| 3 | Straßenbasiertes Fahren | **fertig** | „Ziel außerhalb Reichweite" mit Pfeil + Entfernung fehlt |
| 5 | Stoppliste vereinfachen | Planer mit 1.346 Zeilen | Stopp = Typ + Name + Aktion; Aktionen `Laden/Entladen/Nachladen/Warten` |
| 6 | Flexibles Nachladen | globaler Pool | **Lagerbestände je Gebäude — Simulationsarbeit + Save-Migration** |
| 7 | Verkehr | 4 Stufen vorhanden, statisch | Rückkopplung Fahrten → Belastung |
| 8 | Fähren | `cargo_barge` + I4-Plan | Übergabe Hafen→Fähre→Hafen als Datenstruktur |
| 9 | Ein Transportauftrag für alles | 8 von 28 Aktivitäten fahrbar | `{start, cargo, vehicle, stops, targets, priority}` als gemeinsames Modell |
| 10 | Visuelles Redesign | — | nach Mockup |
| 11 | Performance | — | Route nur bei Änderung, Graph cachen |
| 11b | **Zeitsystem: immer Tag** | — | **erledigt, siehe unten** |

---

## 4. Erledigt in diesem Durchgang: `visualTimeMode`

GAME TIME und VISUAL TIME OF DAY sind getrennt.

- `EnvironmentSettings.visualTimeMode: 'day_only' | 'dynamic'`, Prototyp-Standard
  **`day_only`**; fester Sonnenstand `DAY_ONLY_TIME_OF_DAY = 0.36` (heller
  Vormittag — bewusst nicht der Zenit, dort stehen die Schatten senkrecht und das
  Relief verschwindet).
- Durchgesetzt wird der Modus in **`sanitize`**, also am Wert selbst, nicht bei
  den Lesern: `SkyEnvironment`, die Straßenlaternen-Glows und das Sonnen-Grading
  im Renderer lesen `timeOfDay` direkt. Ein Filter nur an der schreibenden Stelle
  hätte einen alten `localStorage`-Eintrag (oder einen künftigen zweiten
  Schreiber) die Welt weiter in der Nacht halten lassen. Zugleich erledigt das
  die Migration bestehender Einstellungen ohne eigenen Migrationspfad.
- Die Kopplung aus D-038 (`CameraControls`) läuft nur noch im Modus `dynamic`.
- **Die Uhr ist unberührt:** `gameTime.ts` bleibt die eine Simulationsuhr, Tag,
  Uhrzeit und Jahreszeit laufen im HUD weiter, alle zeitabhängigen Systeme (Bau,
  Betriebe, Transport, Missionen) ebenfalls. `tests/visualTimeMode.test.ts` prüft
  genau diese Trennung: die Uhr durchläuft die Mitternacht, die Darstellung nicht.
- Kein Save-Feld — `cmb.environment` ist eine eigene, nicht spielstandsgebundene
  Einstellung (CLAUDE.md §3 unberührt, Save bleibt **v29**).

Zurückschalten: `visualTimeMode: 'dynamic'`.

---

## 5. Vorgeschlagene Reihenfolge für Phase 2–7

Die Reihenfolge folgt der Abhängigkeit, nicht der Auftragsnummerierung.

1. **P2 — Ein Transportauftrag für alles** (Auftrag §9). Gemeinsames Modell
   `{start, cargo, vehicle, stops, targets, priority}`; `drive` von 8 auf alle
   Lieferarten öffnen. Zuerst, weil §5/§6/§10 darauf aufsetzen.
2. **P3 — Lagerbestände je Gebäude** (§6). Die einzige echte Simulationsarbeit:
   die lokalen Inventare der Betriebe auf Lagergebäude ausweiten, den globalen
   Pool als abgeleitete Summe führen. Save-Migration `v29→v30`. **Ohne diesen
   Schritt ist das Nachlade-Panel des Mockups eine Attrappe.**
3. **P4 — Stoppliste vereinfachen** (§5) + „Ziel außerhalb Reichweite" (§3).
4. **P5 — UI nach Mockup** (§4/§10): mehr Karte, weniger Panels.
5. **P6 — Verkehrsrückkopplung** (§7): gefahrene Routen erhöhen die Belastung.
6. **P7 — Fähren-Datenstruktur** (§8) — baut auf I4 auf.

Jede Phase ist ein testbarer Meilenstein; der Auftraggeber testet zwischen den
Phasen im Spiel.
