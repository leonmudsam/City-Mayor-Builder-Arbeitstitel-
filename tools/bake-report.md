# Bake-Report — Terrain & World Scale Overhaul 6.1

> **Auto-generiert** von `tools/bakeWorld.mjs`. Nicht von Hand editieren.

## Eckdaten

- Quelle: `reference/world/island 3d new.glb` (1.849.632 Dreiecke gerastert)
- Source-SHA-256: `63cb339303f6694f51ead6d2bc91aaac9891faa261ad4d77270330181fd3c917`
- Welt: 512×512 Kacheln, 13 organische Regionen (+ Ozean)
- Horizontale Quellspannweite: 374 statt 420 Kacheln; Faktor 0.8905 (Fläche ≈ 0.7929)
- Ozeanrand: 69 Kacheln; separate Y-Skalierung: Gipfel ≈ 52 Welt-Einheiten
- Wasserlinie (normalisiert): 0.0065 → 0.0065; Höhenbereich Welt: [-2.40, 51.99]
- Bebaubare Kacheln: 44.755 → 34.082 (76.2 %, Änderung -23.8 %)
- Glättung bebaubaren Landes: 16 Iterationen, max. Schritt 0.25/Sample
- Regions-Parameter: Ziel ~6200 Kacheln, min. 2400 (sonst Merge), Kosten fremdes Biom +4 / Fluss +6 / Höhe ×4
- Infrastruktur-Hooks: 6 Brücken, 24 Viadukte, 17 Tunnel, 16 Häfen, 669 Wasserwegknoten

## Biomverteilung

- water: 182.167 (69.5 %)
- river: 818 (0.3 %)
- sand: 5.061 (1.9 %)
- fertile: 4.197 (1.6 %)
- grass: 35.697 (13.6 %)
- forest: 17.122 (6.5 %)
- mountain: 17.082 (6.5 %)

## Wasser und Ufer

- Flache Meeresküste: 938 Kacheln
- Sanftes Flussufer: 443 Kacheln
- Sanftes Seeufer: 5 Kacheln
- Bewusste Steilküste: 2.672 Kacheln
- Direkt wassernahe und bebaubare Uferkacheln: 815
- Garantierte 5×5-Uferplattformen: 16

## Zentraler Start (vom Bake gewählt und validiert)

- Mathematischer Bounding-Box-Mittelpunkt: (256,256)
- Flächenschwerpunkt der größten zusammenhängenden Landmasse: (167.65,225.84)
- **Startregion: 13** (grass) — 1.400 bebaubare Kacheln (Ziel 1200–1750)
- **Rathaus: (144,191)**, Gründungsmittelpunkt (146,193), ΔH=0.64
- Frühe Fläche mit den nächsten Nachbarn: 5.999 Kacheln (Ziel 2.600–11.000)
- Score: Gesamt 76.49 · Zentralität 0.793 · Flachheit 0.251 · Expansion 1.000 · Ressourcen 1.000 · Infrastruktur 1.000 · Wasser-/Klippenrisiko 0.000/0.000
- Küstenankunft: (222,218); vorbereitete Versorgungstrasse 98 Kacheln bis zur südlichen Rathausachse
- Startstraßen: 16 Kacheln auf zwei verlängerbaren Hauptachsen
- TODO(CLAUDE_LOGIC): Arrival tutorial and founding journey

### Top-10-Startflächen

| Rang | Region | Mittelpunkt | Direkt bebaubar | Früh gesamt | Zentral | Flach | Richtungen | Ressourcen | Infrastruktur | Wasser-Risiko | Klippen-Risiko | Gesamt |
| ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 13 | (146,193) | 1400 | 5999 | 0.793 | 0.251 | 1.000 | 1.000 | 1.000 | 0.000 | 0.000 | 76.49 |
| 2 | 13 | (145,192) | 1400 | 5999 | 0.786 | 0.248 | 1.000 | 1.000 | 1.000 | 0.000 | 0.000 | 76.17 |
| 3 | 13 | (145,193) | 1400 | 5999 | 0.790 | 0.236 | 1.000 | 1.000 | 1.000 | 0.000 | 0.000 | 76.05 |
| 4 | 13 | (144,191) | 1400 | 5999 | 0.778 | 0.242 | 1.000 | 1.000 | 1.000 | 0.000 | 0.000 | 75.79 |
| 5 | 13 | (144,192) | 1400 | 5999 | 0.783 | 0.232 | 1.000 | 1.000 | 1.000 | 0.000 | 0.000 | 75.71 |
| 6 | 13 | (144,193) | 1400 | 5999 | 0.787 | 0.221 | 1.000 | 1.000 | 1.000 | 0.000 | 0.000 | 75.62 |
| 7 | 13 | (143,192) | 1400 | 5999 | 0.780 | 0.218 | 1.000 | 1.000 | 1.000 | 0.000 | 0.000 | 75.29 |
| 8 | 13 | (143,193) | 1400 | 5999 | 0.784 | 0.209 | 1.000 | 1.000 | 1.000 | 0.000 | 0.000 | 75.25 |
| 9 | 13 | (142,192) | 1400 | 5999 | 0.777 | 0.207 | 1.000 | 1.000 | 1.000 | 0.000 | 0.000 | 74.96 |
| 10 | 13 | (142,193) | 1400 | 5999 | 0.781 | 0.200 | 1.000 | 1.000 | 1.000 | 0.000 | 0.000 | 74.95 |

## Regionen (Grundlage für regions.config.ts)

| Id | Dominant | Kacheln | Bebaubar | Küstenkante | Zentrum | Nachbarn |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | mountain | 16321 | 3833 | 715 | (311,202) |  |
| 2 | grass | 9955 | 3361 | 546 | (218,168) | 12 |
| 3 | grass | 6900 | 2955 | 337 | (148,314) | 7 |
| 4 | grass | 6835 | 4663 | 296 | (169,384) | 5 |
| 5 | grass | 6401 | 3889 | 210 | (281,389) | 4, 6, 11 |
| 6 | grass | 6390 | 4178 | 229 | (357,332) | 5, 10 |
| 7 | grass | 4535 | 2955 | 190 | (111,253) | 3, 12, 13 |
| 8 | grass | 3657 | 794 | 289 | (245,102) |  |
| 9 | grass | 3291 | 1098 | 225 | (386,221) |  |
| 10 | forest | 2852 | 1636 | 202 | (403,280) | 6 |
| 11 | forest | 2796 | 1676 | 119 | (296,420) | 5 |
| 12 | forest | 2482 | 1644 | 140 | (141,179) | 2, 7, 13 |
| 13 | grass | 1456 | 1400 | 0 | (141,197) | 7, 12 |
