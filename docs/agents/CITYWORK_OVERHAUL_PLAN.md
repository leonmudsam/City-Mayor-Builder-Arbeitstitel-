# Stadtarbeit-Overhaul — aktive Logistik, Farm-Felder, visueller Umbau

Verbindlich vor jeder Arbeit an Stadtarbeit, Fahren oder Farm.
Vorgänger: `CITYWORK_OVERHAUL_AUDIT.md` (Phase 1), `CITYWORK_MAP_PIPELINE.md` (D-051).
Dieses Dokument ersetzt sie nicht, es setzt sie fort.

---

## 1. Ist-Zustand — was wirklich im Build steht

Erst der Arbeitsbaum, dann die Aufgabenliste. Drei der elf beklagten Punkte
waren bereits erledigt, vier waren schlimmer als gemeldet.

| Auftragspunkt | Gemessener Ist-Zustand |
| --- | --- |
| „Route ist vorgegeben" | **Teilweise falsch.** Seit D-054 zählt in `progressActivity` *jedes* offene Ziel; `active.targets` protokolliert die gefahrene Reihenfolge. Eine Zielreihenfolge wird nirgends erzwungen. |
| „Quelle ist vorgegeben" | **Falsch seit D-052.** `SupplyPicker` wählt den Ladeort, `withdrawStock` bucht dort ab. |
| „Nachladen fehlt" | **Erledigt in D-057.** Traglast ist bindend, „Hier nachladen" ist ein Vorgang am konkreten Lager. |
| „Fahren fühlt sich kaputt an" | **Bestätigt, Ursache gefunden** → §2.1 |
| „Pfeil als Fahrzeug" | Bestätigt: `ManualRouteMap` zeichnet eine Dreiecksspitze. |
| „Karte wirkt abstrakt" | Bestätigt, aber **nicht** weil die Daten falsch wären (D-051: Terrain, Straßen, Gebäude, Vegetation kommen aus der echten Welt) — sondern weil die Darstellung eine **Draufsicht mit Rechtecken** ist. |
| „Icons nicht interaktiv" | Bestätigt: Marker sind Zeichenaufrufe ohne Trefferfläche. |
| „Farm blockiert" | **Bestätigt, und es ist ein harter Riegel** → §2.2 |
| „Felder fehlen" | **Halb falsch:** Die Simulation existiert vollständig (`operations/farmFields.ts`, vier Controller-Commands, `tests/farmFields.test.ts`). Es gibt **keine Bedienung** — kein Menü, kein Werkzeug, keine Darstellung. Ein System ohne Zugang ist im Spiel nicht vorhanden. |

### 2.1 Warum sich das Fahren falsch anfühlt

Nicht die Physik ist das Problem — `activities/driving.ts` bindet das Fahrzeug
seit D-050/D-051 auf eine Kante zwischen zwei Straßenkacheln, es *kann* die
Straße nicht verlassen. Falsch ist die **Bedienung an der Kreuzung**:

1. **Die Lenkung wird nur im Moment des Überfahrens gelesen.** `stepDrive`
   wertet `input.steer` genau in dem Bild aus, in dem `t >= 1` wird. Wer eine
   Zehntelsekunde zu früh loslässt, fährt geradeaus. Das ist der „Ich habe doch
   gedrückt"-Effekt.
2. **Gedrückt gehaltenes A/D biegt bei *jeder* Gelegenheit ab.** `chooseNext`
   sortiert bei `steer > 0` rechts nach vorn — auch mitten im Korridor. Halten
   ist also keine Lösung für Punkt 1, sondern erzeugt zufällige Abbiegungen.
3. **Wenden gibt es nicht als Aktion.** `back` ist die *letzte* Option in
   `chooseNext`, erreichbar nur in einer Sackgasse. Der Spieler wendet deshalb
   über Rückwärtsfahren — genau das „nervige Zurücksetzen" aus dem Auftrag.
4. **Es gibt keine Ankündigung.** `nextTurn` liefert einen Hinweis, aber nicht
   die *Menge der Möglichkeiten*. Der Spieler sieht nie, was ihn erwartet.
5. **W muss dauerhaft gehalten werden.** Ohne Gas rollt der Wagen aus. Für einen
   Logistikmodus ist das Beschäftigung ohne Entscheidung (D-039).

### 2.2 Warum die Farm blockiert

`GameController.startBuildingOperation` bricht ab, sobald das Arbeitsgebiet
leer ist:

```ts
const nodeIds = selectAreaNodeIds(...);
if (nodeIds.length === 0) return fail('invalid');
```

Für Sägewerk und Steinbruch ist das richtig — Wald und Fels sind da oder nicht.
Für die Farm ist es ein **Deadlock**: `crop`-Knoten entstehen erst auf
`fertile`-Kacheln, `fertile`-Kacheln entstehen erst durch Felder, und Felder
verlangen `farmInRange` — also eine Farm, die den Betrieb aufnehmen darf. Die
Startregion hat **null** natürliche `fertile`-Kacheln (gemessen in
`EARLY_GAME_AUDIT.md`). Die Farm ist dort gültig platzierbar, zahlt Unterhalt
und kann *prinzipiell nie* anlaufen.

Der Ausweg steht schon im Code: `startOperation(..., { workArea })` erzeugt
einen **Dauerbetrieb**, der bei leerem Gebiet auf `waiting` fällt und über
`resumeWaitingOperation` von selbst wieder anläuft, sobald Knoten auftauchen.
Genau dieser Zustand fehlt beim *Start*.

---

## 3. Zielbild

> Die Stadtarbeit ist ein **Logistikmodus**, kein Routenplaner. Der Auftrag
> nennt das Problem; Weg, Ladeort und Reihenfolge entstehen beim Fahren.

Und für die Farm:

> Eine Farm ist ein **Gebäude mit Feldern**, kein Vorkommens-Sammler. Sie darf
> den Spieler nie blockieren. Fruchtbares Land ist ein **Bonus**, nie eine
> Bedingung.

---

## 4. Architektur — die verbindlichen Entscheidungen

### D-058: Ein Betrieb, dessen Knoten der Spieler selbst anlegt, darf leer starten

Nicht „die Farm ist eine Ausnahme", sondern eine Eigenschaft des **Knotentyps**:
`ResourceNodeProfile.playerCreatable`.

Die erste Fassung dieses Flags hieß `replenishable` („wächst nach") — und war
falsch. `tests/operations.test.ts` hat sie sofort widerlegt: Ein Sägewerk ohne
Bäume in Reichweite startete plötzlich und wartete für immer. Denn Wald wächst
zwar nach, aber **nur auf Waldkacheln**; steht dort jetzt kein Baum, entsteht
dort auch keiner. „0 Knoten" heißt beim Sägewerk wirklich „falsch gebaut".

Die tragfähige Frage ist deshalb enger: **Kann der Spieler diese Knoten selbst
erzeugen?** Feld = ja (eine bezahlte Geländeänderung), Baum = nein, Fels = nein
(D-046). Wer einen neuen Knotentyp einträgt, muss die Frage beantworten; ohne
Flag compiliert das Profil nicht. Der Riegel wandert damit von einer
Command-Zeile in die **Datenlage** — die Stelle, an der er entscheidbar ist.

### D-059: Der Feldertrag hängt an der Entfernung, nicht an einer zweiten Zahl

Die Effizienz nach Entfernung liefert die vorhandene Mechanik
(`efficientRadius` gegen `maxRadius` im `BuildingOperationProfile`). Es entsteht
**keine** zweite Distanzrechnung für Felder. Damit gilt automatisch, was der
Auftrag verlangt (100 % nah, weniger fern), und die Zahl im Farm-Menü ist
dieselbe, nach der der Arbeiter läuft.

Unterhalt und Arbeiterbedarf werden **abgeleitet**, nicht gespeichert: Felder
sind `terrainOverrides`, also jederzeit zählbar. Kein Save-Feld, keine
Migration, keine Möglichkeit, dass Feldliste und Unterhalt auseinanderlaufen.

### D-060: Die Kreuzung ist die Entscheidung, nicht der Tastendruck

Der Lenkbefehl wird **gepuffert**, nicht abgetastet: Ein Druck auf A/D setzt
eine *Absicht*, die an der nächsten Kreuzung eingelöst und danach gelöscht
wird. Damit ist es gleichgültig, wann der Spieler drückt — der Grund für
Punkt 1 und 2 aus §2.1 entfällt zusammen. Zusätzlich:

* **Gas ist der Normalzustand.** Der Wagen fährt; S bremst.
* **Wenden ist eine eigene Taste** (`Q`), keine Sackgassen-Notlösung.
* **Der Korridor gehört der Straße.** Eine Absicht wirkt nur dort, wo es
  wirklich eine Wahl gibt (`roadNeighbours(...).length > 2`).
* Die Optionen der nächsten Kreuzung sind eine **abgeleitete Liste**
  (`junctionOptions`) — die Anzeige rät nichts, sie liest dieselbe Funktion,
  nach der gleich gefahren wird.

---

## 5. Umsetzungsschritte (Reihenfolge = Auftrag §11)

| # | Schritt | Zustand |
| --- | --- | --- |
| P1 | Farm-Felder: Riegel weg (D-058), „Felder verwalten", Rechteck-Werkzeug, 3D-Darstellung | **umgesetzt** |
| P2 | Keine erzwungene Route | **war bereits erfüllt** (D-052/D-054/D-057), belegt in §1 |
| P3 | Kreuzungs-Fahren (D-060), Fahrzeugsymbol statt Pfeilspitze | **umgesetzt** |
| P4 | Stadtarbeitskarte aus der echten Welt (orthografische Aufnahme, D-062) | **umgesetzt** |
| P5 | Gebäude-Interaktion auf der Karte | **umgesetzt** |
| P6 | Route prüfen → Übergabe an die 3D-Welt (D-061) | **umgesetzt** |
| P7 | UI nach den Mockups (§7) + immer Tag (§9) | **umgesetzt** |

---

## 6. Offene Risiken — ehrlich benannt

* **P4 ist erledigt, aber nicht gekippt.** Die Karte ist eine orthografische
  Aufnahme derselben Szene (D-062). Eine geneigte Kamera ist bewusst *nicht*
  umgesetzt: Bei Neigung verschiebt sich jedes Objekt um seine Höhe gegen den
  Boden, und alle Overlays (Marker, Route, Fahrzeug, Klickziele) rechnen eben.
  Wer die Neigung will, muss vorher `toScreen`/`worldAt` durch die
  Kameramatrix führen — sonst zeigt die Karte woandershin, als sie klickt.
* **Die Aufnahme darf fehlschlagen.** Ohne WebGL oder laufende Welt gibt es
  kein Bild; die Karte zeichnet dann ihre eigenen Ebenen. Wer eine Ebene
  entfernt, weil „die Aufnahme sie ja mitbringt", nimmt dem Rückfallpfad ein
  Stück Welt.
* **Quicktime-Events (§5 des Auftrags) sind bewusst zurückgestellt.** Sie sind
  im Auftrag als Überlegung formuliert („Überlege, ob…"), und sie auf ein
  Fahrgefühl zu setzen, das gerade erst umgebaut wurde, würde beides
  gleichzeitig unbewertbar machen. Erst P4–P7, dann die Frage neu stellen.
* **Feld-Balancing ist eine Setzung, keine Messung.** 260 ⌾/Kachel und
  Unterhalt je Kachel sind gewählt, nicht aus einer Kurve abgeleitet. Sobald
  Felder im Spiel getestet sind, gehört das nachgerechnet.
* **`crop`-Dichte war 0,6.** Ein bezahltes Feld hätte zu 40 % unbebaute Kacheln
  gehabt. Auf 1,0 gesetzt — wer bezahlt, bekommt die Fläche. Das erhöht
  in Altspielständen mit natürlichem fruchtbarem Land die Knotenzahl; das ist
  eine Verbesserung, kein Bruch (Restmengen bleiben persistiert).
