# Stadtarbeit — Kartenpipeline 3D-Welt → 2D-Logistikansicht

**Stand:** 1. August 2026 · **Version:** v1.33 · **Save:** v31 (unverändert)
**Verbindlich vor jeder Änderung an der Stadtarbeitskarte.** Entscheid: **D-051**.

Dieses Dokument beschreibt, woher jedes Pixel der 2D-Stadtarbeitskarte kommt.
Es ist kein Renderer-Handbuch, sondern eine Herkunftsliste: Wer hier etwas
ergänzt, muss sagen können, aus welcher Weltquelle es stammt.

---

## 1. Die Regel

> Die 2D-Karte hat **keine eigenen Weltdaten**. Sie ist eine zweite Darstellung
> derselben Welt.

Es gibt genau eine Leseinstanz: **`src/renderer/worldProjection.ts`**.
Sie ist frei von `three`, `react` und Canvas — sie liefert Zahlen und Farben.
Wie daraus Dreiecke werden (3D) oder Pixel (2D), ist Sache des Aufrufers.
Deshalb entsteht **kein zweiter Renderer**.

Wer die Draufsicht um eine Weltinformation erweitert (Bodenschätze, Bezirke,
Wasserwege …), ergänzt sie **dort** und liest nicht direkt aus einem Grid nach.
Eine zweite Leseinstanz ist der erste Schritt zu einer zweiten Welt (D-042).

---

## 2. Herkunft je Ebene

| Ebene der Karte | Funktion | Quelle |
|---|---|---|
| Terrainklasse | `sampleWorldTile().terrain` | `terrainAt` (Bake-Grid) |
| Region | `sampleWorldTile().regionId` | `regionIdAt` (Bake-Grid) |
| Bodenhöhe | `sampleWorldTile().height` | `terrainHeightAt` (kanonische Höhe) |
| Hangneigung, Wasser, Klippe, Küste, Bebaubarkeit, Ufertyp | `sampleWorldTile()` | `bakedSurfaceAt` |
| Hangschattierung (Relief) | `reliefShade()` | abgeleitet aus `terrainHeightAt` |
| Kachelfarbe | `worldTileColor()` | abgeleitet aus allem darüber |
| Vegetation | `collectMapNature()` | **`collectRegionNature`** — dieselbe Instanz wie die 3D-Welt |
| Gesperrtes Land | `LOCKED_*`-Konstanten | einmal definiert, von 3D **und** 2D gelesen |
| Straßen | Kachelbelegung + `roadEngineering.variant` | Spielstand |
| Verkehrslast | `RouteAnalysis.segments[].load` | Simulationsanalyse |
| Gebäude | Footprint, Kategorie | Spielstand + Gebäude-Config |
| Infrastruktur-Marker | `infraKindOf(def)` | Config-**Wirkungen**, nicht Id-Listen |
| Route, Nachladehalte | `CargoRouteEvaluation` | Simulationsvorschau |
| Fahrzeug | `drivePose(DriveState)` | gemeinsame Fahrphysik (D-050) |

**Nicht abgeleitet, sondern bewusst weggelassen:** Bodendeckung (`microGrass`,
`flower`, `fieldRow`). Aus 300 m Höhe liegt sie unter einer Kachel. Sie wird
gar nicht erst gesammelt, statt später verworfen (`MAP_NATURE_KINDS`).

**Nicht vorhanden und deshalb nicht gezeichnet:** eine Straßen**hierarchie**.
Das Spiel kennt Bodenstraße und Höhenstraße, keine Haupt-/Nebenstraßen. Die
Strichstärke folgt stattdessen der echten Verkehrslast.

---

## 3. Was zwischengespeichert wird — und woran es hängen darf

Zwei Aufbauten sind teuer und werden gebacken (`worldMapLayers.ts`):

- **Weltbild** — ein Pixel je Weltkachel (512²), Farbe aus `worldTileColor`.
  Wird als ein einziger `drawImage` skaliert geblittet.
- **Vegetation** — alle Naturinstanzen der Insel, in 24-Kachel-Chunks sortiert
  (Sichtbarkeitsprüfung ohne Durchlauf über zehntausende Props).

**Beide hängen ausschließlich am Freischaltzustand der Regionen.**
Hingen sie an der Gebäudebelegung, würde **jeder Bauklick** die halbe Insel neu
berechnen — genau die Falle aus D-045. Props unter Gebäuden werden deshalb beim
**Zeichnen** verdeckt, nicht aus der Verteilung entfernt: sichtbar identisch,
aber zwischenspeicherbar.

Alles andere (Straßen, Gebäude, Route, Marker, Fahrzeug) wird pro Bild neu
gezeichnet.

**Gemessen:** Das Weltbild kostet einmalig rund **0,26 s** für 262.144 Kacheln
(Node, kalter Reliefcache; der zweite Durchlauf 0,17 s). Es wird pro Sitzung
einmal gebacken und überlebt das Schließen des Planers. Eine Verdopplung der
Auflösung auf 2 px/Kachel würde die Küstenlinien schärfen, aber rund eine Sekunde
blockieren — deshalb bleibt es bei einem Pixel je Kachel plus Glättung.

Bei dieser Größenordnung entscheidet die Abfrage *pro Kachel*: `isLocked` prüfte
zunächst eine Zeichenkette (`split()` je Kachel) und kostete damit mehr als die
gesamte Farbberechnung. Es ist jetzt eine `Set`-Abfrage. Wer hier etwas ergänzt,
rechnet es einmal aus und reicht es hinein.

### LOD (§12 des Auftrags)

`MAP_NATURE_MIN_SCALE` legt je Naturgruppe fest, ab welcher Kachelgröße in
Pixeln sie gezeichnet wird: aus großer Höhe verschwinden erst Bodenprops, dann
Küstensteine, dann Steine; Bäume bleiben am längsten, weil sie die Landschaft
lesbar machen. Gebäudedetails und Fahrbahnmarkierungen ab `DETAIL_SCALE`.
Straßenbreiten sind **nach oben gedeckelt** — beim Heranzoomen darf die Fahrbahn
nicht zur Landebahn werden.

---

## 4. Die Fahrt in der Karte

Physik und Reichweite kommen aus `src/game/activities/driving.ts` — derselben
reinen Funktion, aus der auch der 3D-Renderer fährt (D-050). Seit v1.33 ist die
Fahrt **straßengebunden**: Das Fahrzeug sitzt immer auf einer Kante zwischen
zwei Straßenkacheln (`from`/`to`/`t`), Position und Blickwinkel werden daraus
abgeleitet (`drivePose`). Es kann die Straße damit nicht verlassen.

- **W** Gas · **S** Bremse und Rückwärts · **A/D** Abzweigung an der Kreuzung
- ohne Lenktaste fährt es geradeaus weiter, im Korridor folgt es der Straße
- an der Sackgasse wendet es, statt stecken zu bleiben
- Höchstgeschwindigkeit aus `speedKph` des gewählten Fahrzeugs

Die Schleife läuft über `requestAnimationFrame` **an React vorbei** (CLAUDE.md
§6). Alles, was bei jedem Command seine Identität wechselt — Straßen,
Zeichenfunktion, Anker, Rückrufe — kommt über `liveRef`. Das Abhängigkeitsarray
enthält nur `driving` und den Startpunkt **als Wert** (`spawnKey`).

> **Gefunden im Spieltest, nicht im Test:** Stand `anchors` als Objekt im
> Abhängigkeitsarray, setzte schon ein erreichter Stopp die Schleife neu auf —
> das Fahrzeug sprang an den Start zurück. Ein Test ohne Ankunft sieht das nie.

---

## 5. Was noch fehlt (nicht vortäuschen)

- **Lagerbestände je Gebäude** — Stadtarbeit rechnet weiter mit einem globalen
  Pool. Das Nachlade-Panel des Mockups zeigt drei verschiedene Bestände; solange
  P4 fehlt, wäre die Wahl des Lagers eine Attrappe. Lokale Inventare existieren
  bereits im Betriebssystem (`operations/**`) — **zusammenführen, kein drittes
  Lagermodell** (§2/§8). Braucht eine Save-Migration.
- **Verkehrsrückkopplung** — `congestionScore` kommt aus der Anrainerdichte,
  nicht aus gefahrenen Routen.
- **Fähren/Häfen als Netzknoten** — Hafenmarker werden gezeigt, eine
  Schiffsroute gibt es nicht.
- **Zwischenstopps und Reichweitenanzeige** — Stoppliste und „Ziel außerhalb
  Reichweite" sind offen.
- **Echte Gebäudesilhouetten** — die Karte zeichnet Footprint und Kategorie, kein
  Abbild des jeweiligen `.glb`.
