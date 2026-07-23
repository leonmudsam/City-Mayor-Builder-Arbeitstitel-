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
- **Startregion: 13** (grass) — 820 bebaubare Kacheln (Ziel 650–950)
- **Rathaus: (137,194)**, Gründungsmittelpunkt (139,196), ΔH=0.70
- Frühe Fläche mit den nächsten Nachbarn: 5.999 Kacheln (Ziel 1.800–9.500)
- Score: Gesamt 69.14 · Zentralität 0.782 · Flachheit 0.173 · Expansion 0.750 · Ressourcen 1.000 · Infrastruktur 0.979 · Wasser-/Klippenrisiko 0.000/0.000
- Küstenankunft: (222,218); vorbereitete Versorgungstrasse 102 Kacheln bis zur südlichen Rathausachse
- Startstraßen: 16 Kacheln auf zwei verlängerbaren Hauptachsen
- TODO(CLAUDE_LOGIC): Arrival tutorial and founding journey

### Top-10-Startflächen

| Rang | Region | Mittelpunkt | Direkt bebaubar | Früh gesamt | Zentral | Flach | Richtungen | Ressourcen | Infrastruktur | Wasser-Risiko | Klippen-Risiko | Gesamt |
| ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 13 | (139,196) | 820 | 5999 | 0.782 | 0.173 | 0.750 | 1.000 | 0.979 | 0.000 | 0.000 | 69.14 |
| 2 | 13 | (140,197) | 820 | 5999 | 0.790 | 0.167 | 0.750 | 1.000 | 0.958 | 0.000 | 0.000 | 69.03 |
| 3 | 13 | (141,198) | 820 | 5999 | 0.797 | 0.164 | 0.750 | 1.000 | 0.938 | 0.000 | 0.000 | 68.96 |
| 4 | 13 | (139,197) | 820 | 5999 | 0.786 | 0.164 | 0.750 | 1.000 | 0.969 | 0.000 | 0.000 | 68.95 |
| 5 | 13 | (140,198) | 820 | 5999 | 0.793 | 0.160 | 0.750 | 1.000 | 0.948 | 0.000 | 0.000 | 68.88 |
| 6 | 13 | (141,199) | 820 | 5999 | 0.801 | 0.160 | 0.750 | 1.000 | 0.927 | 0.000 | 0.000 | 68.88 |
| 7 | 13 | (141,200) | 820 | 5999 | 0.805 | 0.159 | 0.750 | 1.000 | 0.917 | 0.000 | 0.000 | 68.86 |
| 8 | 13 | (138,196) | 820 | 5999 | 0.779 | 0.169 | 0.750 | 1.000 | 0.969 | 0.000 | 0.000 | 68.81 |
| 9 | 13 | (139,198) | 820 | 5999 | 0.790 | 0.155 | 0.750 | 1.000 | 0.958 | 0.000 | 0.000 | 68.75 |
| 10 | 13 | (140,199) | 820 | 5999 | 0.797 | 0.154 | 0.750 | 1.000 | 0.938 | 0.000 | 0.000 | 68.75 |

## Regionen (Grundlage für regions.config.ts)

| Id | Dominant | Kacheln | Bebaubar | Küstenkante | Zentrum | Nachbarn |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | mountain | 16321 | 3833 | 715 | (311,202) |  |
| 2 | grass | 9955 | 3361 | 546 | (218,168) | 10 |
| 3 | grass | 6900 | 2955 | 337 | (148,314) | 7 |
| 4 | grass | 6835 | 4663 | 296 | (169,384) | 5 |
| 5 | grass | 6401 | 3889 | 210 | (281,389) | 4, 6, 12 |
| 6 | grass | 6390 | 4178 | 229 | (357,332) | 5, 11 |
| 7 | grass | 4535 | 2955 | 190 | (111,253) | 3, 10, 13 |
| 8 | grass | 3657 | 794 | 289 | (245,102) |  |
| 9 | grass | 3291 | 1098 | 225 | (386,221) |  |
| 10 | forest | 3117 | 2224 | 140 | (141,181) | 2, 7, 13 |
| 11 | forest | 2852 | 1636 | 202 | (403,280) | 6 |
| 12 | forest | 2796 | 1676 | 119 | (296,420) | 5 |
| 13 | grass | 821 | 820 | 0 | (141,201) | 7, 10 |
