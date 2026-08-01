# Bake-Report — § World Overhaul 12.0 (neue Insel)

> **Auto-generiert** von `tools/bakeWorld.mjs`. Nicht von Hand editieren.

## Eckdaten

- Quelle: `reference/world/new island 3d model.glb` (1.914.065 Dreiecke gerastert)
- Source-SHA-256: `b52c0cfbf590f9e5fb09e1702c43bfe544e6ce88ebfc66a50fe52d58b44374b0`
- Welt: 512×512 Kacheln, 9 organische Regionen (+ Ozean)
- Horizontale Quellspannweite: 314 statt 420 Kacheln; Faktor 0.7476 (Fläche ≈ 0.5589)
- Ozeanrand: 99 Kacheln; separate Y-Skalierung: Gipfel ≈ 52 Welt-Einheiten
- Wasserlinie (normalisiert): 0.0065 → 0.02676923076923077; Höhenbereich Welt: [-5.12, 47.97]
- Bebaubare Kacheln: 44.755 → 37.798 (84.5 %, Änderung -15.5 %)
- Geländebearbeitung: **keine** (§ Modelltreue 13.0 — die GLB IST das Gelände)
- **Modelltreue: 0 von 233.287 Landknoten verändert** (0.0 %), Ø |Δ| 0 m, max 0 m; Ø Landhöhe Modell 4.448 m → Welt 4.448 m
- Bebaubar-Hang ≤ 1, mindestens 3 orthogonale Nachbarn
- Gebirge: ab Höhe 13, ODER Hang ≥ 1.8 oberhalb Höhe -Infinity
- Regions-Parameter: Ziel ~7000 Kacheln, min. 3300 (sonst Merge), Kosten fremdes Biom +4 / Fluss +6 / Höhe ×4
- Infrastruktur-Hooks: 3 Brücken, 19 Viadukte, 2 Tunnel, 16 Häfen, 778 Wasserwegknoten

## Biomverteilung

- water: 210.500 (80.3 %)
- river: 587 (0.2 %)
- sand: 6.473 (2.5 %)
- fertile: 4.208 (1.6 %)
- grass: 24.044 (9.2 %)
- forest: 9.768 (3.7 %)
- mountain: 6.564 (2.5 %)

## Wasser und Ufer

- Flache Meeresküste: 557 Kacheln
- Sanftes Flussufer: 400 Kacheln
- Sanftes Seeufer: 51 Kacheln
- Bewusste Steilküste: 1.635 Kacheln
- Inselweit mögliche 2×2-Anlegerplätze: 344
- Direkt wassernahe und bebaubare Uferkacheln: 759
- Garantierte 5×5-Uferplattformen: 44
- § 12.2 Geländenadeln („Klippen-Zacken") entfernt: 0; verbleibend: **0**
- § 12.2 Klippen-Plateaus: 0 Abschnitte, 0 Kacheln eingeebnet
- § 12.2 Steilküste nur mit echtem Relief: Hinterland ≥ 5 m im Umkreis 7

## Zentraler Start (vom Bake gewählt und validiert)

- Mathematischer Bounding-Box-Mittelpunkt: (256,256)
- Flächenschwerpunkt der größten zusammenhängenden Landmasse: (259.09,262.74)
- **Startregion: 9** (grass) — 1.400 bebaubare Kacheln (Ziel 1200–1750)
- **Rathaus: (241,251)**, Gründungsmittelpunkt (243,253), ΔH=0.12
- Frühe Fläche mit den nächsten Nachbarn: 7.548 Kacheln (Ziel 2.600–11.000)
- Score: Gesamt 90.75 · Zentralität 0.901 · Flachheit 0.857 · Expansion 1.000 · Ressourcen 1.000 · Infrastruktur 0.771 · Wasser-/Klippenrisiko 0.000/0.000
- Küstenankunft: (178,250); vorbereitete Versorgungstrasse 73 Kacheln bis zur südlichen Rathausachse
- Startstraßen: 16 Kacheln auf zwei verlängerbaren Hauptachsen
- TODO(CLAUDE_LOGIC): Arrival tutorial and founding journey

### Top-10-Startflächen

| Rang | Region | Mittelpunkt | Direkt bebaubar | Früh gesamt | Zentral | Flach | Richtungen | Ressourcen | Infrastruktur | Wasser-Risiko | Klippen-Risiko | Gesamt |
| ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 9 | (243,253) | 1400 | 7548 | 0.901 | 0.857 | 1.000 | 1.000 | 0.771 | 0.000 | 0.000 | 90.75 |
| 2 | 9 | (242,254) | 1400 | 7548 | 0.899 | 0.852 | 1.000 | 1.000 | 0.781 | 0.000 | 0.000 | 90.69 |
| 3 | 9 | (244,253) | 1400 | 7548 | 0.905 | 0.838 | 1.000 | 1.000 | 0.760 | 0.000 | 0.000 | 90.34 |
| 4 | 9 | (243,254) | 1400 | 7548 | 0.904 | 0.834 | 1.000 | 1.000 | 0.771 | 0.000 | 0.000 | 90.32 |
| 5 | 9 | (243,252) | 1400 | 7548 | 0.898 | 0.835 | 1.000 | 1.000 | 0.771 | 0.000 | 0.000 | 90.15 |
| 6 | 9 | (256,250) | 1400 | 7548 | 0.931 | 0.808 | 1.000 | 1.000 | 0.729 | 0.000 | 0.006 | 90.06 |
| 7 | 9 | (244,252) | 1400 | 7548 | 0.903 | 0.819 | 1.000 | 1.000 | 0.760 | 0.000 | 0.000 | 89.84 |
| 8 | 9 | (244,254) | 1400 | 7548 | 0.908 | 0.808 | 1.000 | 1.000 | 0.760 | 0.000 | 0.000 | 89.78 |
| 9 | 9 | (245,253) | 1400 | 7548 | 0.910 | 0.812 | 1.000 | 1.000 | 0.750 | 0.000 | 0.002 | 89.76 |
| 10 | 9 | (245,252) | 1400 | 7548 | 0.907 | 0.802 | 1.000 | 1.000 | 0.750 | 0.000 | 0.002 | 89.44 |

## Regionen (Grundlage für regions.config.ts)

| Id | Dominant | Kacheln | Bebaubar | Küstenkante | Zentrum | Nachbarn |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | water | 11569 | 6148 | 236 | (347,297) | 2, 3, 5, 8, 9 |
| 2 | grass | 8033 | 6496 | 398 | (192,305) | 1, 3, 4, 5, 7, 9 |
| 3 | grass | 7230 | 5750 | 308 | (344,212) | 1, 2 |
| 4 | grass | 6948 | 6359 | 524 | (140,215) | 2 |
| 5 | mountain | 6771 | 783 | 17 | (250,332) | 1, 2, 8, 9 |
| 6 | grass | 5748 | 5137 | 429 | (283,134) | 7 |
| 7 | forest | 4302 | 3617 | 169 | (224,193) | 2, 6, 9 |
| 8 | grass | 3406 | 2108 | 165 | (288,354) | 1, 5 |
| 9 | grass | 1587 | 1400 | 13 | (250,258) | 1, 2, 5, 7 |
