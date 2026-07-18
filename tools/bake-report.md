# Bake-Report — Insel-Welt (MVP4 + Welt 2.0 Regionen)

> **Auto-generiert** von `tools/bakeWorld.mjs`. Nicht von Hand editieren.

## Eckdaten

- Quelle: `reference/stylized island map 3d model.glb` (1.875.966 Dreiecke gerastert)
- Welt: 384×384 Kacheln, 32 organische Regionen (+ Ozean)
- Ozeanrand: 12 Kacheln; Höhenfaktor: Gipfel ≈ 20 Welt-Einheiten
- Wasserlinie (normalisiert): 0.006; Höhenbereich Welt: [-3.00, 20.00]
- Glättung bebaubaren Landes: 10 Iterationen, max. Schritt 0.07/Sample
- Regions-Parameter: Ziel ~3800 Kacheln, min. 1000 (sonst Merge), Kosten fremdes Biom +4 / Fluss +6 / Höhe ×4

## Biomverteilung

- water: 60.365 (40.9 %)
- river: 549 (0.4 %)
- sand: 3.753 (2.5 %)
- fertile: 3.475 (2.4 %)
- grass: 41.342 (28.0 %)
- forest: 17.926 (12.2 %)
- mountain: 20.046 (13.6 %)

## Start (vom Bake gewählt & validiert)

- **Startregion: 2** (forest) — 5.993 bebaubare Kacheln (Ziel ≥ 2500)
- **Rathaus: (183,189)** (5×5, Anker links-oben; flachster 7×7-Gras-Block nahe Regionsmitte, ΔH=0.23)
- Startstraßen: (183,194), (184,194), (185,194), (186,194), (187,194)

## Regionen (Grundlage für regions.config.ts)

| Id | Dominant | Kacheln | Bebaubar | Zentrum | Nachbarn |
| --- | --- | --- | --- | --- | --- |
| 1 | mountain | 7889 | 346 | (119,115) | 2, 7, 12, 13, 15, 16, 20, 24, 25 |
| 2 | forest | 6113 | 5993 | (200,176) | 1, 4, 7, 10, 12, 27 |
| 3 | water | 5134 | 1324 | (153,287) | 4, 14, 17, 19, 22 |
| 4 | grass | 5063 | 4738 | (217,291) | 2, 3, 11, 12, 14, 17, 27 |
| 5 | grass | 4703 | 4544 | (315,99) | 6, 7, 8, 21 |
| 6 | grass | 4437 | 3366 | (323,176) | 5, 7, 10 |
| 7 | grass | 4298 | 4057 | (239,118) | 1, 2, 5, 6, 8, 10, 13, 21, 23 |
| 8 | grass | 3677 | 3511 | (252,46) | 5, 7, 13, 21, 23 |
| 9 | grass | 3580 | 3403 | (301,303) | 11, 26 |
| 10 | grass | 3543 | 3452 | (251,190) | 2, 6, 7, 11, 26, 27 |
| 11 | forest | 3531 | 3222 | (277,277) | 4, 9, 10, 26, 27 |
| 12 | grass | 3293 | 3225 | (146,198) | 1, 2, 4, 17, 20 |
| 13 | grass | 3154 | 3039 | (172,65) | 1, 7, 8, 23, 24 |
| 14 | grass | 3030 | 2889 | (155,339) | 3, 4, 22 |
| 15 | grass | 2637 | 2042 | (46,103) | 1, 16, 25, 28 |
| 16 | grass | 2286 | 1617 | (82,52) | 1, 15, 24 |
| 17 | forest | 2113 | 1942 | (134,230) | 3, 4, 12, 18, 19, 20 |
| 18 | mountain | 2063 | 339 | (78,236) | 17, 19, 20, 28, 29, 30, 31 |
| 19 | grass | 1936 | 1678 | (101,268) | 3, 17, 18, 22, 31 |
| 20 | grass | 1868 | 1389 | (101,181) | 1, 12, 17, 18, 25, 28 |
| 21 | water | 1801 | 923 | (261,91) | 5, 7, 8 |
| 22 | forest | 1801 | 1588 | (99,324) | 3, 14, 19, 31 |
| 23 | mountain | 1786 | 1095 | (209,65) | 7, 8, 13 |
| 24 | mountain | 1777 | 356 | (142,58) | 1, 13, 16 |
| 25 | mountain | 1735 | 173 | (71,156) | 1, 15, 20, 28 |
| 26 | forest | 1462 | 1415 | (270,207) | 9, 10, 11 |
| 27 | mountain | 1282 | 624 | (225,252) | 2, 4, 10, 11 |
| 28 | forest | 1185 | 1143 | (49,182) | 15, 18, 20, 25, 30 |
| 29 | grass | 1082 | 949 | (53,281) | 18, 31 |
| 30 | grass | 984 | 748 | (45,206) | 18, 28 |
| 31 | mountain | 984 | 503 | (68,298) | 18, 19, 22, 29 |
| 32 | grass | 732 | 705 | (35,250) |  |
