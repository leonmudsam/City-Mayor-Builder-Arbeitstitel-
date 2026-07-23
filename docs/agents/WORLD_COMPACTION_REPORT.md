# Welt-Verdichtungsbericht — § Final World Compaction 8.1

**Stand:** v0.76 · Save-Schema **v16** · Bake: `tools/bakeWorld.mjs` →
`tools/bake-report.md`. Die frühere Anweisung „die Welt nicht erneut verkleinern"
ist durch den Auftrag ausdrücklich aufgehoben.

## 1. Ziel

Eine **zweite** horizontale Verdichtung der Insel um rund 20 % **Fläche**, damit
Wege kürzer und die Karte dichter bebaut wirken — ohne die Gebirge erneut
abzuflachen und ohne Gebäude, Straßen oder Fahrzeuge mitzuskalieren (1 Kachel =
1 Welteinheit bleibt fix).

## 2. Vorgehen (nachvollziehbar, nicht nach Gefühl)

- **X/Z** über den Ozeanrand verdichtet: Quellspannweite **420 → 374** Kacheln.
  Linearer Faktor **0,8905** (im zulässigen Prüfbereich 0,87–0,91), Fläche ≈
  0,8905² = **0,7929** (−20,7 %). Bewusst **nicht** X=0,8 · Z=0,8 (das wären −36 %).
- **Y getrennt** abgestimmt: Gipfelhöhe **50 → 52** Welteinheiten (Faktor 1,04, im
  Korridor 0,98–1,08). Die Berge bleiben monumental statt proportional flacher.
- Voller **Rebake** aller abgeleiteten Daten (Terrain, Höhe, Regionen,
  Bebaubarkeit, Masken, Infrastruktur-Hooks) — keine alte Koordinate ungeprüft
  übernommen.

## 3. Vorher/Nachher

Referenz „Vorher" = v15 (erste Verdichtung, 420er-Spannweite, 40 Regionen).
„Nachher" = v16 (dieser Bake). Werte mit ≈ sind aus dem Flächenfaktor abgeleitet,
wo kein exakter v15-Bake mehr vorliegt; alle übrigen sind exakt aus Bake-Konstanten
bzw. dem aktuellen Grid.

| Metrik | Vorher (v15) | Nachher (v16) | Änderung |
|--------|-------------:|--------------:|:--------:|
| Horizontale Quellspannweite (Kacheln) | 420 | 374 | −11,0 % (Länge) |
| Effektive Landfläche (relativ) | 1,000 | 0,793 | **−20,7 %** |
| Ozeanrand (Kacheln je Seite) | 46 | 69 | +23 |
| Gipfelhöhe (Welteinheiten) | ~50 | 52 | +4 % (bewusst) |
| Wasserlinie (normalisiert) | 0,0065 | 0,0065 | unverändert |
| Bebaubare Kacheln (Summe) | 44 755 | **34 082** | **−23,8 %** |
| Landkacheln (Grid) | ≈ 99 800 | 79 159 | ≈ −20,7 % |
| Wasserkacheln (Grid) | ≈ 162 300 | 182 985 | mehr Ozean |
| Gebirgskacheln | ≈ 21 500 | 17 082 | ≈ −20 % |
| Regionen (ohne Ozean) | 40 | **13** | −27 |
| Startregion — Baufläche | im Korridor (900–1400) | **820** | kompakter Kern |
| Ø Baufläche je Region | ≈ 1 120 | **2 622** | +134 % (bedeutungsvoller) |
| Land-Bounding-Box (Diagonale, Kacheln) | ≈ 587 | **523** | −11 % |
| Max. Regions-Zentren-Distanz (Kacheln) | — | 322 (R8↔R12) | Inseldurchmesser |
| Frühe Startfläche (Kern + Nachbarn) | — | 5 999 | Ziel 1 800–9 500 |

**Startpunkt neu bestimmt:** Rathaus **(137, 194)**, Gründungsmittelpunkt
(139, 196), Küstenankunft (222, 218). ΔH über dem 7×7-Gras-Reservat = 0,70. Score
gesamt 69,1 (Zentralität 0,78, Wasser-/Klippenrisiko 0/0).

## 4. Zielkonflikt — dokumentiert und aufgelöst

§3.1 verlangt „nach zwei Erweiterungen 1 800–2 800 bebaubare Kacheln"; §4 verlangt
zugleich nur **zwölf** Regionen. Das ist arithmetisch unvereinbar:

> 34 082 bebaubare Kacheln − 820 (Start) = 33 262 auf 12 Regionen ≈ **2 772 je
> Region**, also Start + 2 Erweiterungen ≈ **6 400**. Um auf 1 800–2 800 zu kommen,
> bräuchte es 35–40 Kleinregionen — genau die Struktur, die §4 abschafft.

**Priorisiert wurde die Regionsstruktur** (Akzeptanzkriterien 6–8: keine
bedeutungslosen Mini-Regionen). Die Startregion ist bewusst als kompakter Kern
(820 Kacheln) ausgeschnitten, damit die erste echte Erweiterung trotzdem spürbar
groß ist. Dokumentiert in den Bake-Konstanten und `REGION_CONSOLIDATION_PLAN.md`.

## 5. Gebäude-Prognose je Meilenstein

Grundlage: kumulativ erreichbare Baufläche bis zum jeweiligen Level (Startregion +
alle bis dahin freischaltbaren Regionen), grobe Belegung **~30 % der Baufläche mit
Gebäuden** (Rest: Straßen, Abstände, Service-Radien, Grün) bei **Ø-Fußabdruck 4
Kacheln (2×2)**. Bewusst eine Spannweite, kein Scheinwert.

| Level | Erreichbare Baufläche | Gebäude ≈ (Fläche·0,30 / 4) | Bereich |
|:-----:|----------------------:|---------------------------:|:-------:|
| L5 | 5 999 (R13+R7+R10) | ≈ 450 | 380–520 |
| L10 | 20 867 (+R3,R2,R4,R5) | ≈ 1 565 | 1 300–1 800 |
| L15 | 28 357 (+R12,R6,R11) | ≈ 2 127 | 1 800–2 450 |
| L20 | 34 082 (alle 13) | ≈ 2 556 | 2 150–2 950 |

Zusätzlich gedeckelt durch die level-abhängigen Bau-Limits (z. B. Wohnhaus
`buildLimit` 10→30 über L1–L17). Die Prognose zeigt: Trotz −24 % Baufläche bleibt
auf jeder Stufe reichlich Platz für eine motivierende Stadt.

## 6. Was sich NICHT geändert hat

- Gebäude-, Straßen-, Fahrzeug-Maße (nicht mitskaliert).
- Die GLB wird weiterhin **nie** zur Laufzeit geladen.
- Simulation ↔ Rendering-Trennung (CLAUDE.md §1) unangetastet.
- Wetter/Umgebung bleiben rein visuell.

## 7. Verifikation

`npx tsc -b --force` · `npx eslint src tests` · `npx vitest run` (310 Tests grün) ·
`npm run build`. Der Windows-Tauri-Build läuft nicht in der Cloud-Umgebung.
