# Natur-/Prop-Overhaul 14.0 — Zonen, Regeln, Stellschrauben

**Version:** v1.24 · **Save:** v29 (unverändert — reine Darstellung) ·
**Entscheid:** D-044, ergänzt durch D-045 · **Stand:** 01.08.2026

Verbindliches Einstiegsdokument vor jeder Arbeit an Vegetation, Props oder
Naturverteilung. Wer die Welt „voller" oder „leerer" machen soll, ändert die
Werte in `src/renderer/three/natureZones.ts` — **nicht** den Renderer.

## Nachtrag v1.24 — die Vegetation wird ZWEIMAL gebaut (D-045)

Seit die ganze Insel geladen wird (kein Nebel mehr, gesperrtes Land wird
entsättigt gezeigt), gibt es **zwei** Vegetationsaufbauten mit **getrennten
Schlüsseln** — beide über dieselbe Funktion `buildVegetationFor(...)` und
dieselbe Verteilungsinstanz `collectRegionNature`:

| | freigeschaltet | gesperrt |
|---|---|---|
| Schlüssel | Regionsliste + **Belegung** + Qualität | Regionsliste + Qualität |
| Dichte | 1,0 | `LOCKED_VEGETATION_DENSITY` = 0,5 |
| Schatten | Schattenbudget | keine |
| Neuaufbau bei | jedem Bauklick | Freischaltung / Qualitätswechsel |

**Der Grund ist Performance, nicht Optik.** Sichtbares gesperrtes Land ist
bewachsenes Land: 1.422 → **26.851** Instanzen. Mit einem gemeinsamen Schlüssel
hätte jedes gesetzte Gebäude 51.057 Kacheln neu bewertet. Gesperrte Regionen
hängen aber nicht an der Belegung — dort baut niemand.

**Konsequenz für Messungen:** Jede Zählung über die Vegetation (Perf-Panel,
Screenshots, Tests) muss **beide** Gruppen erfassen, sonst misst sie einen
Bruchteil der Insel. Das ist dieselbe Falle wie D-042.

---

## 1. Auftrag und Ausgangslage

Der Auftrag lautete: die Welt wirkt „zu leer, zu technisch, zu steril und zu
gleichförmig"; Vorbild ist ein Mockup mit dichteren Wäldern, komponierter
Verteilung, sauberen Küsten und regional unterscheidbaren Landschaften. Die
Inselgeometrie darf **nicht** angefasst werden (D-043 bleibt gültig).

Zwei Messungen erklären den Zustand vollständig:

**Befund 1 — die Masse bestand aus Kegeln.** Weltweit standen **14.038 Props auf
51.057 Landkacheln, davon nur 502 echte Modelle (3,6 %)**. Der Rest war ein Kegel
auf einem Zylinder. Die Ursache ist kein Versäumnis, sondern Arithmetik: **jedes
Natur-`.glb` wiegt rund 29.000 Dreiecke** — für einen einzelnen Baum. Bei diesem
Preis sind 500 Instanzen weltweit bereits ~14 Mio. Dreiecke; ein dichter Wald
daraus ist unmöglich. Das Detailbudget von zwölf Modellen je Region war die
richtige Antwort auf die falsche Grundlage.

**Befund 2 — der Katalog ist kleiner als seine Dateinamen.** `pine_tree.glb`,
`forest_cluster_small.glb` und `forest_cluster_medium.glb` sind **bytegleich**
(md5 `dc76679c…`); ebenso alle fünf Steinmodelle (`e16827ce…`). Real existieren
**fünf** Formen, nicht zwölf. Vielfalt kann also nicht aus dem Asset-Ordner
kommen — genau wie im Auftrag vorweggenommen („dieselben Grundbaum-Modelle
mehrfach verwenden, aber intelligent variiert").

---

## 2. Architektur

Vier Module, klar getrennt; die ersten drei sind frei von `three` und deshalb
testbar.

| Modul | Verantwortung |
|---|---|
| `worldSurfaceMasks.ts` | Abgeleitete Auskünfte: Waldanteil im 5×5-Fenster, Distanz zur Steilküste, Größe der Landmasse, Steigung, Bebaubarkeit. Memoisiert, einmal je Sitzung. |
| `natureZones.ts` | **Die Regeln.** Zonenklassifikation, Zonentabelle, Stellschrauben, Regionscharakter. |
| `natureDistribution.ts` | **Die einzige Verteilungsinstanz.** Liefert je Region Listen von Instanzen (Position, Zone, Größe). Renderer *und* Tests rufen genau diese Funktion (D-042). |
| `natureRenderer.ts` | Übersetzt eine Platzierung in `InstancedMesh`-Gruppen. |
| `naturePropGeometry.ts` | Stilisierte Low-Poly-Formen, 24–200 Dreiecke statt 29.000. |

`ThreeMapRenderer.rebuildVegetation` schrumpfte dabei von **605 auf 152 Zeilen**
und trifft keine Verteilungsentscheidung mehr.

---

## 3. Die acht Naturzonen

Jede Landkachel bekommt genau eine Zone. Die Reihenfolge ist hierarchisch: was
die Landschaft am stärksten prägt, gewinnt.

| # | Zone | Bedingung |
|---|---|---|
| 1 | `small_island` | Landmasse ≤ 900 Kacheln |
| 2 | `rocky_highland` | Gebirge **oder** Steigung ≥ 1,5 **oder** Höhe ≥ 17 |
| 3 | `coast_rocky` | Küstenband (≤ 4 Kacheln zum Ozean) + Steilküste in ≤ 5 Kacheln |
| 4 | `coast_flat` | Küstenband, sonst |
| 5 | `wetland` | Fluss-/Seeufer, Höhe ≤ 7,5 |
| 6 | `forest_core` | Wald **und** Waldanteil ≥ 0,595 im 5×5-Fenster |
| 7 | `forest_edge` | Wald mit weniger Bestand **oder** Nicht-Wald mit ≥ 0,16 Anteil |
| 8 | `meadow` | alles Übrige |

**Der entscheidende Punkt ist Zone 6 gegen 7.** Der Terraintyp allein kennt keine
Kante: Er weiß, dass eine Kachel Wald ist, aber nicht, ob sie *mitten im*
Bestand liegt. Deshalb hatte jeder Wald bisher innen dieselbe Dichte wie außen —
und wirkte gestreut statt gewachsen.

Gemessene Verteilung auf der aktuellen Insel:

| Zone | Kacheln | Props |
|---|---:|---:|
| meadow | 21.342 | 17.884 |
| rocky_highland | 9.909 | 7.589 |
| forest_core | 8.311 | 10.970 |
| coast_rocky | 5.116 | 4.520 |
| forest_edge | 4.299 | 4.881 |
| coast_flat | 1.086 | 1.067 |
| small_island | 896 | 1.847 |
| wetland | 98 | 80 |

`wetland` ist bewusst winzig: Die modelltreue Insel hat kaum Binnengewässer.
Die Zone bleibt, weil sie Schilf und Ufergrün eine Heimat gibt, wo es sie gibt.

---

## 4. Die Zonentabelle

`NATURE_SPAWN_RULES` beantwortet je Zone und Art drei Fragen:

```ts
pine: rule(0.62, 0.55, [0.85, 1.25])
//          │     │      └─ Größenband der Instanz
//          │     └─ Clusterbindung (0 = gleichmäßig, 1 = Gruppen mit Lücken)
//          └─ Grundwahrscheinlichkeit je Kachel
```

Optional kommt eine **Terrainbindung** dazu (`rule(…, ['fertile'])`): Die Zone
ist gröber als das Terrain — die Wiese umfasst Gras *und* fruchtbaren Boden, aber
Ackerspuren gehören nur auf den fruchtbaren Teil.

Die endgültige Wahrscheinlichkeit ist

```
Dichte × Wirkgruppen-Stellschraube × Regionscharakter
      × max(0, 1 + Clusterbindung × (Cluster·2 − 1) × 1,7)
      × Höhenabnahme (nur Grün)
```

gewürfelt mit einem **stabilen Positions-Hash** — nie mit einer Laufzeit-RNG und
nie abhängig vom Unlock-Zustand (§16 gilt unverändert).

### Größenbänder (Vorgabe aus dem Auftrag)

| Rolle | Band |
|---|---|
| Normalbestand | 0,85 – 1,25 |
| Akzent-/Wiesenbäume | 1,0 – 1,5 |
| Riesenbäume, Felsgruppen | 1,25 – 2,4 |
| Jungwuchs / Randbäume | 0,65 – 0,85 |

---

## 5. Zwei getrennte Clusterfelder

Bäume und Steine folgen **verschiedenen** Feldern (`regionId` gegen
`regionId·977+13`). Sonst läge jeder Findling im Waldstück, weil beide dieselbe
Rauschfunktion abtasten — Gruppen ohne Zufall wirken sofort wie ein Muster.

---

## 6. Regionale Identität

`REGION_CHARACTER_DENSITY` verschiebt die Dichte je Wirkgruppe nach dem
visuellen Regionsprofil (`worldVisualProfiles.ts`). Ohne diesen Schritt sähen
zwei Waldkerne identisch aus, egal ob im Holzrevier oder in einer Ackerregion.

| Charakter | Baum | Fels | Küste | Boden |
|---|---:|---:|---:|---:|
| `waldkern` | 1,40 | 0,90 | — | 0,85 |
| `offen` | 0,72 | — | — | 1,25 |
| `agrar` | 0,75 | — | — | 1,40 |
| `alpin` | 0,70 | 1,35 | — | 0,80 |
| `ufer` | 0,85 | — | 1,40 | 1,10 |
| `feucht` | 1,05 | — | 1,30 | — |
| `trocken` | 0,50 | 1,20 | — | 0,75 |

---

## 7. Neue Prop-Arten

Fünf Arten schließen die Lücken, die als „zu leer" gemeldet wurden:
`sapling` (Jungwuchs am Waldrand), `stump` (Baumstümpfe), `shoreRock`
(Küstensteine), `scree` (Geröllfelder), `cliffRock` (markante Felsgruppen).

---

## 8. Performance

- **Eine** Geometrie und **ein** Material je Art, geteilt über alle Regionen und
  alle Neuaufbauten (registriert in `cacheOwned`, damit `disposeGroup` sie nicht
  freigibt — sonst wäre die zweite Vegetationsrunde leer).
- Ausschließlich `InstancedMesh`, aufgeteilt in räumliche Chunks von 72 Kacheln;
  Frustum- und Distance-Culling greifen dadurch pro Gruppe.
- Variation kostet **keine** zusätzliche Geometrie: Größe, Y-Drehung, Neigung,
  ungleichmäßige Skalierung und Instanzfarbe (`setColorAt`).
- Kleine Props (Gras, Blumen, Geröll, Schilf, Totholz) werden früh gecullt.
- Die Hero-`.glb` bleiben auf ihrem bisherigen Niveau gedeckelt — sie sind mit
  29.000 Dreiecken je Instanz die teuerste Ressource der Szene.

**Dreieckskosten der stilisierten Formen:** Nadelbaum 78 · Laubbaum 92 · Fels 50
· Busch 60 · Grasbüschel 30 · Blumenfleck 44 · Schilf 32 · Geröll 40.

---

## 9. Stellschrauben

Alles in `NATURE_TUNING` (`natureZones.ts`):

```
treeDensity · rockDensity · groundCoverDensity · coastPropDensity
smallIslandDensity · clusterSize · forestEdgeSoftness · heroTreeProbability
```

Dazu `NATURE_ZONE_THRESHOLDS` für die Zonengrenzen und `REGION_PROP_BUDGET`
für die Obergrenzen je Region.

---

## 10. Ergebnis und offene Punkte

**14.038 → 48.838 Props** (Landkacheln unverändert 51.057), davon weiterhin nur
rund 500 echte `.glb`. **Kein Budget begrenzt mehr eine Region** — die
Landschaft entscheidet, testgesichert in `tests/natureZones.test.ts`.

Bewusst offen, **nicht** vortäuschen:
- Echte LOD-Stufen für die stilisierten Formen (aktuell nur Distance-Culling);
  bei 24–200 Dreiecken je Instanz ist das bisher kein Engpass.
- Impostor-Billboards für sehr ferne Vegetation (`impostorsEnabled` ist als
  Profil-Flag vorhanden, wird von der Massenvegetation aber nicht genutzt).
- Shader-Wind. Die Vegetation steht still.
- Neue Prop-Assets: Der Katalog hat real fünf Formen. Jedes zusätzliche
  Drop-in-`.glb` (Findling, Farn, Palme, Uferschilf) wird sofort genutzt (§5).
- Bergplattformen als eigene Terrain-Klasse (aus 12.x offen).
