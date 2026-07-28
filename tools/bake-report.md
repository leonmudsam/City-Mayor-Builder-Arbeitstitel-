# Bake-Report — § 10.0 R7/R8 World Compaction 3.0 (weiches Uferprofil)

> **Auto-generiert** von `tools/bakeWorld.mjs`. Nicht von Hand editieren.

## Eckdaten

- Quelle: `reference/world/island 3d new.glb` (1.849.632 Dreiecke gerastert)
- Source-SHA-256: `63cb339303f6694f51ead6d2bc91aaac9891faa261ad4d77270330181fd3c917`
- Welt: 512×512 Kacheln, 13 organische Regionen (+ Ozean)
- Horizontale Quellspannweite: 314 statt 420 Kacheln; Faktor 0.7476 (Fläche ≈ 0.5589)
- Ozeanrand: 99 Kacheln; separate Y-Skalierung: Gipfel ≈ 52 Welt-Einheiten
- Wasserlinie (normalisiert): 0.0065 → 0.0075; Höhenbereich Welt: [-2.40, 51.98]
- Bebaubare Kacheln: 44.755 → 25.092 (56.1 %, Änderung -43.9 %)
- Terraforming (§ Map Flattening B1): 4 Runden × 8 Iterationen, Hang-Tor 1.5, Massiv > 13 ausgenommen
- Glättung bebaubaren Landes: 20 Iterationen, max. Schritt 0.25/Sample, Bebaubar-Hang ≤ 0.86
- Gebirge: ab Höhe 13, ODER Hang ≥ 1.8 oberhalb Höhe -Infinity
- Regions-Parameter: Ziel ~6200 Kacheln, min. 2400 (sonst Merge), Kosten fremdes Biom +4 / Fluss +6 / Höhe ×4
- Infrastruktur-Hooks: 48 Brücken, 24 Viadukte, 9 Tunnel, 16 Häfen, 759 Wasserwegknoten

## Biomverteilung

- water: 205.782 (78.5 %)
- river: 713 (0.3 %)
- sand: 11.866 (4.5 %)
- fertile: 5.701 (2.2 %)
- grass: 21.181 (8.1 %)
- forest: 7.993 (3.0 %)
- mountain: 8.908 (3.4 %)

## Wasser und Ufer

- Flache Meeresküste: 1.578 Kacheln
- Sanftes Flussufer: 884 Kacheln
- Sanftes Seeufer: 23 Kacheln
- Bewusste Steilküste: 905 Kacheln
- Direkt wassernahe und bebaubare Uferkacheln: 2.242
- Garantierte 5×5-Uferplattformen: 44

## Zentraler Start (vom Bake gewählt und validiert)

- Mathematischer Bounding-Box-Mittelpunkt: (256,256)
- Flächenschwerpunkt der größten zusammenhängenden Landmasse: (181.89,230.52)
- **Startregion: 9** (grass) — 1.668 bebaubare Kacheln (Ziel 1200–1750)
- **Rathaus: (127,250)**, Gründungsmittelpunkt (129,252), ΔH=0.36
- Frühe Fläche mit den nächsten Nachbarn: 5.008 Kacheln (Ziel 2.600–11.000)
- Score: Gesamt 71.70 · Zentralität 0.700 · Flachheit 0.575 · Expansion 0.750 · Ressourcen 1.000 · Infrastruktur 0.771 · Wasser-/Klippenrisiko 0.000/0.054
- Küstenankunft: (160,242); vorbereitete Versorgungstrasse 44 Kacheln bis zur südlichen Rathausachse
- Startstraßen: 16 Kacheln auf zwei verlängerbaren Hauptachsen
- TODO(CLAUDE_LOGIC): Arrival tutorial and founding journey

### Top-10-Startflächen

| Rang | Region | Mittelpunkt | Direkt bebaubar | Früh gesamt | Zentral | Flach | Richtungen | Ressourcen | Infrastruktur | Wasser-Risiko | Klippen-Risiko | Gesamt |
| ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 9 | (129,252) | 1668 | 5008 | 0.700 | 0.575 | 0.750 | 1.000 | 0.771 | 0.000 | 0.054 | 71.70 |
| 2 | 9 | (130,252) | 1668 | 5008 | 0.704 | 0.562 | 0.750 | 1.000 | 0.771 | 0.000 | 0.059 | 71.51 |
| 3 | 9 | (128,252) | 1668 | 5008 | 0.695 | 0.565 | 0.750 | 1.000 | 0.771 | 0.000 | 0.051 | 71.38 |
| 4 | 9 | (129,253) | 1668 | 5008 | 0.698 | 0.529 | 0.750 | 1.000 | 0.781 | 0.000 | 0.038 | 71.05 |
| 5 | 9 | (130,253) | 1668 | 5008 | 0.702 | 0.520 | 0.750 | 1.000 | 0.781 | 0.000 | 0.043 | 70.91 |
| 6 | 9 | (132,252) | 1668 | 5008 | 0.714 | 0.506 | 0.750 | 1.000 | 0.792 | 0.000 | 0.069 | 70.67 |
| 7 | 9 | (128,253) | 1668 | 5008 | 0.693 | 0.517 | 0.750 | 1.000 | 0.781 | 0.000 | 0.035 | 70.67 |
| 8 | 9 | (131,253) | 1668 | 5008 | 0.707 | 0.495 | 0.750 | 1.000 | 0.792 | 0.000 | 0.048 | 70.57 |
| 9 | 9 | (133,252) | 1668 | 5008 | 0.719 | 0.481 | 0.750 | 1.000 | 0.813 | 0.000 | 0.074 | 70.45 |
| 10 | 9 | (129,254) | 1668 | 5008 | 0.695 | 0.482 | 0.750 | 1.000 | 0.792 | 0.000 | 0.027 | 70.26 |

## Regionen (Grundlage für regions.config.ts)

| Id | Dominant | Kacheln | Bebaubar | Küstenkante | Zentrum | Nachbarn |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | mountain | 11487 | 2476 | 598 | (302,211) |  |
| 2 | grass | 9985 | 6077 | 499 | (230,372) | 5 |
| 3 | grass | 4904 | 2266 | 281 | (165,304) | 9 |
| 4 | grass | 4052 | 2244 | 246 | (368,305) | 5 |
| 5 | forest | 3729 | 2497 | 140 | (321,324) | 2, 4 |
| 6 | grass | 3446 | 2179 | 285 | (255,312) |  |
| 7 | mountain | 3383 | 561 | 196 | (249,170) | 11 |
| 8 | grass | 2975 | 1074 | 219 | (164,183) | 9, 11, 13 |
| 9 | grass | 2561 | 1668 | 136 | (133,259) | 3, 8 |
| 10 | grass | 2559 | 407 | 243 | (247,127) |  |
| 11 | forest | 2506 | 1413 | 182 | (211,211) | 7, 8, 13 |
| 12 | grass | 2319 | 830 | 186 | (365,226) |  |
| 13 | grass | 1485 | 1400 | 0 | (156,203) | 8, 11 |
