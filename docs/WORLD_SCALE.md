# WORLD_SCALE — Verbindliche Maßstäbe der Insel-Welt (MVP4)

> Gültig ab Schema v10 / Patch v0.48. Quelle der Zahlen: Nutzer-Entscheidung
> (AskUserQuestion, 384×384/36 Sektoren) + `tools/bake-report.md` (Bake-Ergebnis).
> Änderungen hier erfordern einen Rebake (`node tools/bakeWorld.mjs`) und die
> Anpassung von `docs/WORLD_REBUILD.md`.

## Welt

| Größe | Wert |
| --- | --- |
| Kachel | 1 Welt-Einheit ≈ **4 m** (unverändert seit v0.39) |
| Welt | **384 × 384 Kacheln** ≈ 1,54 × 1,54 km |
| Sektoren | **6 × 6 = 36** à **64 × 64** Kacheln (`SECTOR_SIZE = 64`) |
| Ozeanrand | 12 Kacheln rings um die einbeschriebene Insel |
| Landanteil | ~59 % (≈ 87.000 Land-Kacheln, davon ~66.500 bebaubar) |

## Höhen

| Größe | Wert |
| --- | --- |
| Wasserlinie | y = 0 (Referenz); `WATER_LEVEL` (Renderer) leicht darunter |
| Höchster Gipfel | ≈ **20 Welt-Einheiten** (~80 m visuell; künstlerischer Faktor, nicht GLB-proportional — proportional wären ~88 Einheiten und unlesbar) |
| Ozeantiefe | Rampe bis −3,0; Seen −0,8 |
| Bebaubares Land | geglättet: max. ΔH ≈ 0,32/Kachel (Bake-Glättung, 8 Iterationen) — die Sim hat keine Hangprüfung, deshalb garantiert der **Bake** sanfte Bauflächen |
| Höhen-Grid | 769 × 769 Samples (2/Kachel + 1), Uint16-quantisiert |

## Gebäude & Objekte (unverändert)

| Größe | Wert |
| --- | --- |
| Gebäude-Footprints | 1×1 … 4×2 (Rathaus 3×3) — **unverändert** |
| Straßenbreite | 1 Kachel |
| Fahrzeuge/Bäume | bestehende Maßstäbe (fitObject-Normalisierung) |

## Start (vom Bake gewählt & validiert)

| Größe | Wert |
| --- | --- |
| Startsektor | **(2,3)** — 3.933 bebaubare Kacheln (Ziel: 2.500–4.000 ✓) |
| Rathaus | Kachel **(157,221)**, 3×3, flachster 5×5-Gras-Block nahe Sektormitte |
| Startstraßen | (156,223), (157,223), (158,223) |

## Kamera (ab P3)

| Größe | Wert |
| --- | --- |
| `maxDist` | 200 → **480** |
| Overview-Preset | ~420 |
| Far plane | 4000 (unverändert, reicht) |
| Schatten | Frustum folgt Kamera-Target (statt fix ±140) |

## Empfohlene Zoomstufen

- **Nah** (Dist ~25–60): Stadtdetail, Bau/Platzierung.
- **Stadt** (~60–150): Quartiersübersicht.
- **Region** (~150–300): Sektor-Entscheidungen, Nachbarbiome.
- **Insel** (~300–480): Gesamtüberblick, Expansion planen.
