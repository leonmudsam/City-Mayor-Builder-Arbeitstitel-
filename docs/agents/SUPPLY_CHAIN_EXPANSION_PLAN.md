# Wirtschafts- und Lieferketten-Overhaul

Verbindlich vor jeder Arbeit an Steingruben, Farm-Feldern, Bretter/Werkstein,
Werkstätten oder Nachschub. Setzt `CITYWORK_OVERHAUL_PLAN.md` (Stadtarbeit) und
`ACTIVE_OPERATIONS_PLAN.md` (Betriebe) fort, ersetzt sie nicht.

---

## 1. Ist-Zustand vor dem Auftrag — gemessen, nicht vermutet

Der Auftrag nennt vier Probleme. Zwei davon waren zum Zeitpunkt der Messung
anders gelagert als beschrieben; das ist wichtig, weil sonst ein Riegel gesucht
worden wäre, den es nicht mehr gibt.

| Auftragspunkt | Gemessener Ist-Zustand |
| --- | --- |
| „Stein blockiert früh" | **Teilweise falsch.** Der Deadlock „Stein braucht Stein" ist seit D-055 weg: `stone_pit` öffnet auf L2, der erste Bau ist gratis (`firstBuildDiscount: 1`) und kostet **keinen** Stein. Die erste Steinkosten-Stelle ist das Wohnhaus-Upgrade auf **L3** (25 Stein). |
| „Steinbruch zu unflexibel" | **Bestätigt, und der Grund ist die Form, nicht die Kette.** `stone_pit` ist 3×3, braucht Straße und kostet **60 Holz** — exakt den gesamten Startvorrat. `quarry` (5×5, L4) hängt zusätzlich an Bergterrain; die Startregion hat davon **46 Kacheln gegen 1.039 Gras**. |
| „Farm zu starr / terrainabhängig" | **Bereits gelöst (D-058/D-059), aber unvollständig.** Felder gibt es, Fruchtbarkeit ist kein Gate mehr. Es fehlten: modulare 1×1-Kacheln, eine sichtbare Zuordnung zur Farm, Bodenqualität als Faktor und eine Ertragszahl. |
| „keine zweite Verarbeitungsstufe" | **Bestätigt.** Alle Produktionsgebäude erzeugen Rohstoffe; `produce.inputsPerMinute` existiert als Haken seit MVP 2, wird aber von **keinem** Gebäude benutzt. |

**Startvorrat, zum Nachrechnen:** 45.000 ⌾ · 60 Holz · **0 Stein** · 40 Nahrung.

---

## 2. Zielbild

> Rohstoffe kommen aus der Landschaft. **Produkte kommen aus einer Kette.**
> Wo ein Gebäude steht, entscheidet beim Rohstoff über den Ertrag — bei der
> Werkstatt über die **Lieferwege**.

Und für den Einstieg:

> Das erste Gebäude einer Ressource darf an **keiner** Bedingung scheitern.
> Ein Einstieg mit Voraussetzung ist kein Einstieg.

---

## 3. Architektur — die verbindlichen Entscheidungen

### D-063: Ein Umwandlungsbetrieb ist kein `operation` und kein `produce`

`BuildingDef.conversion` ist ein **drittes** Produktionsmuster neben passivem
`produce` und aktivem `operation` — und das ist begründet, nicht bequem:

* **Nicht `operation`:** Das setzt einen `nodeType` voraus, also ein Terrain,
  ein Arbeitsgebiet und laufende Arbeiter. Eine Werkstatt hat nichts davon; sie
  steht, wo der Spieler sie hinstellt.
* **Nicht `produce` mit `inputsPerMinute`:** Der vorhandene Haken zieht seinen
  Eingang aus `state.resources` — seit D-052 ist das die **Bilanzsumme der
  ganzen Stadt**. Eine Werkstatt am anderen Inselende produzierte damit ohne
  eine einzige Fahrt, und §8 des Vorauftrags („Keine globale magische
  Ressource") wäre für die interessanteste Ware wieder aufgehoben.

Die Werkstatt hat deshalb ein **eigenes Lager** — dasselbe `BuildingInventory`
und dieselbe `operations.inventories`-Map wie das Sägewerk seit Save v17. Kein
drittes Lagermodell (§2/§8). Die Teilung in Eingangs- und Ausgangsplatz macht
`conversionStage`, nicht ein neues Save-Feld.

**Eine Durchsatzrechnung, zwei Leser.** `workshopThroughput` liefert Zahlen und
Stillstandsgrund; der Tick verarbeitet damit, die UI zeigt damit an (D-048).
Eine Werkstatt kann deshalb nicht „läuft" melden und stillstehen.

### D-064: Der Nachschub ist ein Sog, kein zweiter Transport

Vor diesem Auftrag lief jeder Transport in eine Richtung: aus dem Lager eines
Betriebs in ein Stadtlager. Die Werkstatt ist das erste Gebäude, das Ware
**empfängt**. Damit daraus kein zweites Transportsystem wird:

* `canSupplyResource` / `canReceiveResource` beantworten die Frage **einmal**
  für alle Fälle; `createInventoryTransfer` und die Automatik lesen dieselben.
* `advanceWorkshopSupply` **erteilt nur Aufträge** an denselben
  `createInventoryTransfer`. Route, Fahrzeug, Ladezeit und Betriebskosten
  bleiben unverändert.
* `transferTargets` bleibt **bewusst lagerbeschränkt.** Stünde die Werkstatt
  dort, lüde ein Sägewerk sein Holz automatisch bei ihr ab, und der Stadt
  fehlte Baumaterial, ohne dass der Spieler es entschieden hätte. Abtransport
  (schieben) und Lieferkette (ziehen) sind zwei Richtungen, kein zweites System.

**Gefunden beim Bauen:** Wird an einem **Stadtlager** geladen, muss auch die
Bilanzsumme sinken (`withdrawStock`). Ohne das hätte `reconcileStock` beim
nächsten `notify` den Bestand aus dem unveränderten Pool sofort wieder
aufgefüllt — das Fahrzeug führe mit einer **Kopie** los. Wer Ware aus einem
Ledger-Lager nimmt, nimmt sie aus der Stadt.

### D-065: `priority` wirkt hier wirklich

Die Stadtarbeit trägt seit D-050 ein `priority`-Feld **ohne Wirkung** — es ist
bis heute nicht gebaut, weil dahinter keine Simulation steht. Hier steht eine:
`workshopSupplyDemand` sortiert die Nachfrage, und bei knappem Rohstoff bekommt
die vordere Werkstatt die Ladung, die hintere geht leer aus. Ein
Prioritätsregler ohne diese Konsequenz gehört nicht in die UI.

### D-066: Der Verarbeitungsanteil ist EINE Zahl in zwei Lesarten

Der Auftrag nennt zwei Bedienmodelle („30 % lagern / 70 % verarbeiten" **oder**
„Mindestbestand + Überschuss verarbeiten"). Umgesetzt ist **ein** Wert:

```
reserve = (1 − processRatio) × inputCapacity
```

Die Werkstatt verarbeitet nur, was über der Reserve liegt. Die UI zeigt beide
Lesarten gleichzeitig („Verarbeiten 80 % · 20 % lagern, mind. 48 Holz"). Zwei
getrennte Einstellungen wären zwei Wahrheiten über dieselbe Grenze — und die
Frage „was gilt, wenn sie sich widersprechen?" hat keine gute Antwort.

### D-067: Bodenqualität kommt aus dem Bake, nicht aus dem Feld

Ein angelegtes Feld **setzt** `fertile` als Terrain-Override (D-059). Wer die
Bodengüte über `worldTerrainAt` liest, gibt damit jeder gekauften Kachel
automatisch Bestnote: Der Bonus wäre geschenkt und die Landschaft bedeutungslos.
`nodeSoilFactor` liest deshalb `terrainAt` — den Bake. Der Bonus (+30 %) wirkt
über die **Ergiebigkeit der Kachel**, nicht über eine zweite Effizienzformel;
Entfernung bleibt allein `fieldEfficiency` (D-059).

---

## 4. Umsetzungsstand

| # | Schritt | Zustand |
| --- | --- | --- |
| §1 | Kleine Steingrube (`stone_pit_small`, 1×1, L1, ohne Straße/Material) | **umgesetzt** |
| §2 | Felder ab 1×1, Bodenqualität, Farm-Zuordnung, Ertragszahl | **umgesetzt** |
| §3 | Bretter + Werkstein (Pool, Register, Lager, HUD, Save v33) | **umgesetzt** |
| §4 | Holzwerkstatt + Steinwerkstatt (`BuildingDef.conversion`) | **umgesetzt** |
| §5 | Lieferkette: Sog, Quelle, Priorität, Verarbeitungsanteil | **umgesetzt** |
| §6 | Level-5-Freischaltung, veredelte Waren gedimmt davor | **umgesetzt** |
| §7 | Upgrade-Kosten ab L6, zehn Stellen gestaffelt | **umgesetzt** |
| §8 | HUD-Reihenfolge + Werkstatt-Fenster | **umgesetzt** |
| §9 | Assets + Tripo-Prompts (4 Dateien) | **umgesetzt** (Modelle fehlen, Fallback greift) |
| §10 | Simulation Level 1–8 als Testsuite | **umgesetzt** |
| §11 | Dieses Dokument + Patch Notes + Projektstand | **umgesetzt** |

---

## 5. Balancing Level 1–8 — die Zahlen und ihre Begründung

| Stelle | Wert | Warum |
| --- | --- | --- |
| `stone_pit_small` | 1×1, L1, 1.800 ⌾ (erster gratis), 4 Stein/min, max. 3 | Der Einstieg. Ein Zehntel des Steinbruchs (38/min); drei Gruben ersetzen nicht einmal die alte Steingrube. |
| erste Steinkosten | Wohnhaus↑2 auf L3, 25 Stein | ≈ 6 Minuten einer einzigen Grube. |
| `wood_workshop` | L5, 14 Bretter/min, 2 Holz je Brett | Verbraucht 28 Holz/min gegen 45 eines Sägewerks: eine Werkstatt lebt von einem Betrieb, zwei brauchen ein zweites. Testgesichert in beide Richtungen. |
| `stone_workshop` | L5, 9 Werkstein/min, 2,5 Stein je Werkstein | Stein wächst nie nach (D-046), Werkstein ist deshalb bewusst teurer als das Brett. |
| Reserve (Vorgabe) | 20 % des Eingangslagers | Damit die Werkstatt beim nächsten Lieferengpass nicht sofort trockenläuft. |
| Nachbestellung | unter 50 % Eingangslager | Die Fahrt dauert bei dieser Inselgröße Minuten; wer bei 20 % bestellt, steht während der Fahrt. |
| Feldkachel | 260 ⌾, 1,4 ⌾/min Unterhalt, 12 Kacheln je Arbeiter | Unverändert aus D-059 — **eine Setzung, keine Messung** (siehe §6). |
| Boden natürlich fruchtbar | +30 % Ergiebigkeit | Spürbar, aber nie notwendig: „Bonus, keine Bedingung". |
| erste Bretter-Kosten | Wohnhaus↑2 und Rathaus↑2 auf **L6** | Ein volles Level nach der Werkstatt — Zeit, die Kette überhaupt aufzubauen. |

---

## 6. Offene Punkte — ehrlich benannt

* **Feld-Balancing bleibt eine Setzung.** 260 ⌾/Kachel und 1,4 ⌾/min sind
  gewählt, nicht aus einer Kurve abgeleitet. Das galt schon für D-059 und gilt
  weiter; erst ein Spieltest über mehrere Level kann das entscheiden.
* **Die Werkstatt hat keine Standortwirkung.** Kein `locationBonus`, keine
  Terrainbindung — das ist Absicht (§4 des Auftrags: „kein eigenes
  Arbeitsgebiet"), heißt aber auch: Der einzige Standortfaktor ist die
  Entfernung zum Lager, und die wirkt nur über die Fahrzeit. Wer die Werkstatt
  strategischer machen will, müsste die Fahrzeit spürbarer machen — nicht der
  Werkstatt einen Bonus geben.
* **Arbeiter sind Arbeitsplätze, kein zweiter Regler.** `workerSlots` in
  `BuildingConversionStage` ist eine Anzeige; der Durchsatz hängt allein an der
  Stufe. Eine echte Personalzuteilung wäre ein eigenes System.
* **`field_farm_tile.glb` ist geplant, nicht verdrahtet.** Felder zeichnet
  `farmFieldMesh.ts` prozedural (12 Dreiecke je Instanz). Nach D-044 ist das
  richtig: Ein Natur-`.glb` wiegt rund 29.000 Dreiecke, und ein Feld ist Masse.
  Ein Drop-in ist nur als Low-Poly-Variante sinnvoll; der Prompt schreibt
  „UNDER 200 TRIANGLES" ausdrücklich vor.
* **Keine Zwischenlager-Regel.** Der Auftrag nennt „optional ein Zwischenlager"
  in der Lieferkette. Nicht gebaut: Die Fahrt geht direkt von der gewählten
  Quelle zur Werkstatt. Ein Umweg über ein drittes Gebäude wäre eine echte
  Routenplanung und damit ein zweites System.
* **Kein Intervall, keine Ladungsgrenze in der UI.** Beides steht im Auftrag,
  beides ist bewusst nicht als Regler gebaut: Die Automatik bestellt, wenn
  Platz da ist, und lädt so viel, wie das Fahrzeug fasst. Ein Intervallregler
  wäre Bedienung ohne Entscheidung (D-039) — die Frage „wie oft?" hat genau
  eine sinnvolle Antwort.
* **Bretter und Werkstein sind reine Baustoffe.** Sie sind kein Bürgerbedarf
  und keine Handelsware. Wer sie zu einer Nachfrage machen will, muss
  `needs.config.ts` erweitern — und dann ist die Kette Pflicht statt Wahl.
