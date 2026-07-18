# WORLD_REBUILD — Der Insel-Neuaufbau (MVP4)

> Verbindliche Zielarchitektur des Welt-Neuaufbaus. Status je Phase wird hier
> gepflegt. Maßstäbe: `docs/WORLD_SCALE.md` · Bake-Statistik: `tools/bake-report.md`
> · Save-Strategie: `docs/SAVE_MIGRATION.md` (ab P2).

## Auftrag & Entscheidungen

Die handdesignte Testkarte (128×80, `terrainAt`-Fallunterscheidungen) wird
**vollständig ersetzt** durch eine Insel, deren Form 1:1 aus der Referenz-GLB
`reference/stylized island map 3d model.glb` gebacken wird. Kein Parallelbetrieb,
Legacy wird bereinigt. Vom Nutzer fixiert:

1. **384×384 Kacheln, 36 Groß-Sektoren** (SECTOR_SIZE 16→64).
2. **Alte Saves (≤v9): harter Neustart + Backup** — bewusste, sanktionierte
   Ausnahme von CLAUDE.md §3 (Prototyp-Phase, Auftrag §22).
3. **2D-/Iso-Renderer wird entfernt** (keine parallelen Renderwege).

## Architektur: GLB → Bake → zwei Gen-Dateien

Die GLB (45 MB, 44 Meshes, reine Geometrie ohne Farben) wird **nie zur Laufzeit
geladen**. `tools/bakeWorld.mjs` rastert sie offline und committet:

| Datei | Konsument | Inhalt |
| --- | --- | --- |
| `src/game/config/world/islandTerrain.gen.ts` | **Sim** (`terrainAt`) | 384×384 Terrain-IDs (base64-Uint8, ~200 KB), `BAKED_START` (Sektor/Rathaus/Straßen) |
| `src/renderer/three/worldHeight.gen.ts` | **Renderer** (`terrainHeightAt`) | 769×769 Höhen (base64-Uint16, ~1,6 MB) |

Beide sind synchron dekodierbar (node + Browser, `atob`) → vitest-tauglich, keine
Async-Ladepfade, CLAUDE.md §1 (Sim importiert kein three/react) bleibt gewahrt.

### Klassifizierungsregeln (im Bake, deterministisch)

1. **Rastern:** alle 1,87 M Dreiecke top-down, baryzentrisch, Max-Y je Knoten.
2. **Wasser:** unbedeckte Knoten (die GLB modelliert keinen Meeresboden) oder
   Höhe < Wasserlinie (0.006 normalisiert). Flood-Fill vom Rand = **Ozean**;
   eingeschlossene Blobs ≥ 24 Kacheln = **See** (`water`); schmale Rinnen
   (5×5-Breiten-Heuristik) = **`river`**.
3. **Höhen:** Welt-Höhe = (h − Wasserlinie) · Faktor (Gipfel ≈ 20). Ozean:
   Tiefenrampe (BFS-Distanz zur Küste) bis −3; Seen −0,8.
4. **Land-Biome** (Reihenfolge): `mountain` (Höhe > 5,5 ∨ Hang > 1,1) →
   `sand` (Höhe < 1,0 ∧ ≤ 2 Kacheln vom Wasser) → `fertile` (tief, flach,
   ≤ 7 Kacheln von Süßwasser, Noise-Gate) → `forest` (mittleres Band,
   fbm-Patches) → `grass`.
5. **Glättung:** bebaubares Land (grass/fertile/sand/forest) wird relaxiert und
   auf max. ΔH ≈ 0,32/Kachel gekappt — die Sim prüft keine Hänge, also
   garantiert der Bake saubere Bauflächen. Gebirge/Küsten/Wasser unangetastet.
6. **Start-Wahl + Validierung:** bester zentrumsnaher Sektor nach
   Bebaubarkeits-Score; Abbruch, wenn < 2.500 bebaubare Kacheln; Rathaus =
   flachster 5×5-Gras-Block nahe Sektormitte.

## Phasenstatus

| Phase | Inhalt | Status |
| --- | --- | --- |
| **P1** | reference/, Bake-Pipeline, Gen-Dateien, WORLD_SCALE/WORLD_REBUILD | ✅ |
| **P2** | Sim-Welt-Tausch: SECTOR_SIZE 64, `terrainAt` → Gen-Grid, Slim-Save v10, Alt-Save-Backup, `sectors.config.ts` (36 SectorDefinitions), Tests (155 grün) | ✅ |
| **P3** | Renderer: Höhen aus Gen-Grid, Chunk-Boden (8×8×~9,4k Verts, Unlock baut nur betroffene Chunks), Ozeanebene statt Kachelwasser, Kamera 480 + Insel-Overview, Schatten-Frustum folgt Kamera, Fog auf Inselmaß (520–1600), SPLAT_BANDS als eine Quelle | ✅ |
| **P4** | Splat-Ausbau: forest_floor/farmland/sand_coast/mountain/cliff/snow, Bänder aus SPLAT_BANDS | → **A3** |
| **P5** | Sektor-Gameplay: productionModifiers in Wirtschaft, restrictions in Platzierung, SectorDialog-Boni | → **A4** |
| **P6** | Wald-Cluster, Landmarken, Placeholder-Inseln am Horizont, Nebel-Polish, Bürgerhinweise | → **A7** |
| **P7** | Balancing, Tutorial-/Quest-Texte | → **A10** |
| **P8** | Bereinigung (Legacy-Dateien, Doku-Konsolidierung, §28.11-Abschlussliste) + Perf-Pass | → **A10** (2D-Engine bereits in A1 entfernt) |

> **Programm „Ausbaustufe 2.0" (ab v0.50):** Die offenen Phasen P4–P8 sind vom
> kombinierten Programm **Gebäudesystem 2.0 + Welt 2.0** absorbiert (Phasen
> A1–A10, siehe `docs/PATCHNOTES.md` ab v0.50). **A1 ✅** hat die 36
> Quadrat-Sektoren durch **32 organische Regionen** ersetzt
> (Bake-Segmentierung → `islandRegions.gen.ts`, `regions.config.ts` statt
> `sectors.config.ts`, Schema v11), alle Gebäude-Footprints/Stufenketten neu
> aufgesetzt (sizeClass XS–XXL, 20 Level) und den 2D-Pixi-Renderer entfernt.
> Sektor-Bezüge in den Abschnitten oben sind historisch (P1–P3).

## Bewusst später (nicht Teil dieses Umbaus)

Tunnel/Serpentinen/Böschungs-Geometrie · lokale Footprint-Einebnung + Sockel ·
Grundstücks-Deko je Gebäudetyp · Wasser-Gameplay-Gebäude · interaktive
Freischalt-Projekte (Datenmodell-Voraussetzungen kommen in P2) · Minimap ·
betretbare Zusatzinseln (Placeholder-Silhouetten kommen in P6).
