# § World Overhaul 12.0 — neue Insel, Terrain, Biome, Regionen

> Auftrag vom 29.07.2026 („DRINGENDER WORLD-OVERHAUL"). Umgesetzt in v1.12.
> Verbindliche Quelle für alle künftige Welt-/Regionsarbeit. Entscheid **D-041**.

## 0. Ergebnis in einem Satz

`reference/world/new island 3d model.glb` ist die **einzige** Weltgrundlage; die alte
`island 3d new.glb` wird von nichts mehr gelesen. Die Insel ist eine
zusammenhängende Landmasse mit 61.322 Landkacheln, 44.170 bebaubaren Kacheln,
13 Regionen (1 zentrale Startregion + 12 Freischaltungen) und einem flachen,
hafenfähigen Ufer. Save-Schema **v26** mit einmaligem Backup + Neustart.

## 1. Analyse der alten Map-Pipeline (Auftrag §1)

Alle Weltdaten entstehen **offline** in `tools/bakeWorld.mjs`. Zur Laufzeit wird
**keine** GLB geladen (die Quelle ist 45–47 MB). Konsumenten lesen ausschließlich
die committeten Gen-Dateien.

### Was ersetzt wurde (regeneriert aus der neuen GLB)

| Datei | Inhalt |
| --- | --- |
| `src/game/config/world/islandTerrain.gen.ts` | 512² Terrain-Typ-Grid, `BAKED_WORLD`, `BAKED_START` |
| `src/game/config/world/islandRegions.gen.ts` | 512² Region-Id-Grid, `BAKED_REGIONS` |
| `src/game/config/world/islandBuildability.gen.ts` | Höhe/Hang/Flags/Ufer/Wassertiefe je Kachel |
| `src/game/config/world/islandInfrastructure.gen.ts` | Brücken-/Viadukt-/Tunnel-/Hafen-/Wasserweg-Kandidaten |
| `src/renderer/three/worldHeight.gen.ts` | 1025² Höhen-Grid (Renderer) |
| `src/renderer/three/worldMasks.gen.ts` | Wasser-/Küstendistanz-/Tiefen-/Ufer-Masken |
| `src/assets/ui/map/new_island_overview.png` | Kartenbild (Bake-Ausgabe) |
| `src/assets/ui/minimap/new_island_minimap.png` | Minimap-Bild (Bake-Ausgabe) |
| `src/assets/ui/citywork/map/new_island_planning.png` | Planungskarte (Bake-Ausgabe) |
| `tools/bake-report.md`, `tools/bake-preview.png`, `tools/bake-regions.png` | Report + zwei Kontrollbilder |
| `tools/new-island-report.json` / `.md` | GLB-Audit (117 Teile, 989.147 Verts) |

### Was von Hand migriert wurde

| Datei | Änderung |
| --- | --- |
| `src/game/config/regions.config.ts` | 13 Regionen neu benannt/bepreist; **kein** `requiresHarbor` mehr |
| `src/i18n/de.json` | 13 Regionsnamen |
| `src/renderer/three/worldVisualProfiles.ts` | 13 visuelle Profile nach gemessener Biomverteilung |
| `src/game/newGame.ts` | `SCHEMA_VERSION` 25 → 26 |
| `src/game/storage/migrations.ts` | `migrateV25ToV26` (Weltaustausch) |
| `src/game/storage/localStorageAdapter.ts` | Backup-Key `cmb.save.backup.world-v25` |
| `src/renderer/three/ThreeMapRenderer.ts` | Regionslabel nur bei Hover (§10), Nebel über **alle** Regionsteile |
| `tools/bakeWorld.mjs` | siehe §2 |
| `tools/analyzeNewIsland.mjs` | Quelle umgestellt |

### Was NICHT angefasst werden musste (weil datengetrieben)

`startRegion.config.ts` (re-exportiert nur den Bake) · `CameraExplorationBoundary`
(arbeitet über eine `allowed(tileX,tileY)`-Callback auf `regionIdAt`) ·
`WorldMiniMap.tsx` (liest `regionIdAt`/`terrainAt`/`BAKED_REGIONS`) ·
`placement.ts`/`terrainFit.ts` (lesen `bakedSurfaceAt`) · `roadNetwork`/
`roadRouting`/`routeAnalysis` (lesen `validatePlacement`) · `waterNavigation`
(liest `islandInfrastructure.gen.ts`). **Das war die Absicht der bestehenden
Architektur und hat sich bestätigt.**

## 2. Änderungen am Bake (`tools/bakeWorld.mjs`)

### 2.1 Quelle (§2 des Auftrags)

`GLB_PATH` zeigt auf `reference/world/new island 3d model.glb`. `WORLD_GLB`
(Env) erlaubt Vergleichsbakes ohne Codeänderung. Alle Quellenangaben in
generierten Dateien und im Report kommen aus `SOURCE_LABEL`.

### 2.2 REIHENFOLGE UMGEDREHT — Terraforming VOR der Segmentierung (D-041)

Bis v1.11 lief das Einebnen als „§8a-flat" **nach** Regionen/Startwahl. Der Grund
war ausschließlich Rückwärtskompatibilität (D-040: Regions-Ids bitgleich halten).
Dieser Auftrag ersetzt die Welt vollständig — damit fällt der Grund weg, und die
alte Reihenfolge wird zum Fehler:

* Die Segmentierung sah Biome des **rohen** Geländes.
* Der Startregion-Ausschnitt zählte Bauflächen der **rohen** Maske und wuchs
  deshalb weit über sein Ziel (3.983 Kacheln für 1.348 „bebaubare").
* `BAKED_REGIONS[].buildable` — und damit die Regionskosten — beschrieben eine
  Welt, die es nach dem Einebnen nicht mehr gab.

Jetzt: **einebnen (§6b-flat), dann segmentieren (§7)**. Wer das wieder umdreht,
macht die Regionsstatistik erneut unehrlich.

### 2.3 Startregion mit echten Startressourcen (§4)

Der Ausschnitt prüft jetzt vier harte Bedingungen statt einer:

| Bedingung | Konstante | Wert |
| --- | --- | --- |
| Bauflächenbudget | `START_REGION_TARGET_BUILDABLE` / `MIN/MAX_START_BUILDABLE` | 1.400 / 1.200–1.750 |
| Wasser in Reichweite des Kerns | `START_CORE_MAX_WATER_DISTANCE` | 26 Kacheln |
| Ebener Rathausblock (7×7) | `START_CORE_MAX_FLAT_DELTA` | 0,85 |
| Expansionsrichtungen | `START_MIN_NEIGHBOUR_REGIONS` | 3 Nachbarregionen |
| Uferkacheln in der Region | `START_MIN_WATERFRONT` | 8 |

Kandidaten werden nach Zentralität, Umgebungs-Bauland, Wassernähe und Flachheit
sortiert und **der Reihe nach** probiert (`START_CORE_CANDIDATES = 96`). Erreicht
der kompakte Ausschnitt das Wasser nicht von selbst, zieht ein **schmaler
Korridor** (kürzester Weg innerhalb der Wirtsregion) plus ein Ufer-Vorplatz
(`START_SHORE_APRON_RADIUS = 6`) den Zugang heran — keine zweite Wachstumslogik,
nur ein zweites Abbruchkriterium.

### 2.4 Verwaistes Land einsammeln (§7c-bis)

Das kostenbasierte Wachstum läuft nur über Land. Kleine Inseln ohne eigenen Seed
und ohne Landverbindung blieben deshalb bei Region 0 („Ozean") — auf der neuen
Insel **3.217 Kacheln in zwei Nordinseln**: sichtbares Land, das der Spieler nie
betreten könnte. Jede verwaiste Komponente wandert jetzt komplett zur Region mit
dem kürzesten Wasserabstand.

Folgefehler im Renderer (mitbehoben): `regionContour` nahm nur den flächengrößten
Ring als Nebelkontur; abgesetzte Inselteile blieben sichtbar, obwohl die Region
gesperrt war. Jetzt liefert `regionContours` **alle** Außenränder ab
`MIN_FOG_CONTOUR_AREA = 24` Kacheln², und Decke wie Wolkenwand werden je Kontur
gebaut.

### 2.5 Regionsparameter für 60k Landkacheln

`REGION_TARGET_TILES` 6200 → **4600**, `REGION_MIN_TILES` 2400 → **1600**,
`REGION_MAX_SEEDS` 12 → **14** (der Merge in §7d dünnt wieder aus). Ergebnis:
genau 13 Regionen.

### 2.6 Tunnel-Reichweite

`TUNNEL_MAX_LENGTH_TILES` 28 → **52**. Das neue Massiv ist breiter als das alte;
mit 28 Kacheln fand die Suche keinen einzigen Durchstich mehr (0 Kandidaten).
Jetzt 2 Kandidaten. Reiner Geo-Hook, weiterhin ohne Gameplay.

## 3. Die neue Welt in Zahlen

```
Land            61.322 Kacheln     (alt: ~79.000 auf einer größeren Spannweite)
Bebaubar        44.170 Kacheln     (alt nach Flattening: 38.126)
3×3-Bauplätze   37.559             4×4: 34.596     5×5: 32.031
Wasser         204.759 Kacheln     (77,9 % des 512²-Rasters, Ozeanrand 99)
Gebirge          7.069 Kacheln     (2,7 % — ein zentrales Massiv als Highlight)
Uferkante        2.719 Kacheln     davon 90,9 % ≤ 1,5 Einheiten über Wasser
Ufertypen        Strand 1.219 · Flussufer 711 · Seeufer 107 · Steilküste 682
Infrastruktur    26 Brücken · 24 Viadukte · 2 Tunnel · 16 Häfen · 760 Wasserwegknoten
```

### Wasserhöhe (§6)

Der Auftrag verlangt „Wasseroberfläche ungefähr auf Höhe der Haupt-Bauflächen,
nicht wie eine tiefe Schlucht". Gemessen an der **Uferkante**: Median 0,26,
p75 0,71, p95 1,89 Welt-Einheiten über der Wasserlinie; 2.471 von 2.719
Uferkacheln liegen ≤ 1,5 darüber. Die Wasserlinie selbst musste dafür **nicht**
angehoben werden (das hätte nur Land geflutet) — es reicht das flache
Uferprofil (`FLAT_SHORE_*`). Bewusste Steilküste bleibt mit 682 Kacheln als
optisches Highlight (§6: „Nur einzelne Stellen").

## 4. Regionen (§8)

Startregion **13 „Gründerland"**: Zentrum (232,259) bei einem Inselschwerpunkt von
(259,260), 1.650 Kacheln, 1.456 bebaubar, 1.222 freie 4×4-Plätze, Rathaus
(237,256) mit ΔH 0,34, 13 Uferkacheln, 365 Waldkacheln, **vier** Landnachbarn.

| L | Id | Name | Charakter | Bebaubar | Kosten |
| --: | --: | --- | --- | --: | --: |
| 1 | 13 | Gründerland | Start, neutral | 1.456 | 0 |
| 3 | 8 | Nordwald | Holz (61,6 % Wald) | 3.110 | gratis (§6) |
| 5 | 12 | Mittelmark | Knoten, 6 Nachbarn | 1.569 | 120.000 |
| 6 | 7 | Ostterrassen | Holz + Nahrung | 3.247 | 215.000 |
| 8 | 10 | Kernmassiv | Stein (76 % Gebirge) | 474 | 240.000 |
| 10 | 2 | Nordfelder | größte Fläche, Nahrung | 7.757 | 845.000 |
| 12 | 3 | Südwestaue | große Ebene | 6.221 | 935.000 |
| 13 | 5 | Westweiden | fruchtbarster Boden | 5.444 | 1.550.000 |
| 15 | 6 | Ostebene | Nahrung + Holz | 4.789 | 1.675.000 |
| 16 | 1 | Lagunenküste | Wasser/Strand | 4.153 | 2.510.000 |
| 17 | 9 | Ostforst | Holz (46,7 % Wald) | 2.911 | 2.450.000 |
| 18 | 11 | Südhügel | Hügel + Stein | 1.690 | 2.575.000 |
| 20 | 4 | Südmassiv | Endgame, Stein-Krone | 1.349 | 5.695.000 |

Alle Preise sind der auf 5.000er gerundete Richtwert aus `regions/regionCost.ts`
(`tests/regionCost.test.ts` erzwingt ±12 %).

**Kein `requiresHarbor` mehr.** Die neue Insel ist EINE Landmasse; der
Land-Adjazenzgraph ist von Region 13 aus vollständig erreichbar. Die Hafensperre
in `regionUnlockBlocker` bleibt unverändert wirksam und greift geografisch — z. B.
grenzen die Nordfelder (2) nur über Wasser an den Start, ihr einziger Landnachbar
ist der Nordwald (8).

## 5. Regionslabels (§10)

Zwölf dauerhaft eingeblendete Regionsbanner verdeckten die Insel. Der Ruhezustand
ist jetzt ein kompaktes Schloss ohne Text (`makeLockedRegionIconTexture`); Name
und Freischaltlevel erscheinen bei **Hover** und **beim Freischalten**
(`setLockedRegionLabel`). Die Klickfläche zum Öffnen des Regionsdialogs bleibt
unverändert.

## 6. Bewusst NICHT umgesetzt (nicht vortäuschen)

* **Echte Bergplattformen als eigene Terrain-Klasse** (`MOUNTAIN_PLATFORM` aus
  §11). Die Gebirgsregionen sind mit 474 (Region 10) bzw. 1.349 (Region 4)
  bebaubaren Kacheln und 292 bzw. 770 freien 4×4-Plätzen **nicht** unbebaubar,
  und der Steinbruch baut über `buildsOnRock` auf flachen Felsschelfen. Eine
  zusätzliche Höhenquantisierung wurde in v1.11 (Phase B4) gemessen und
  verworfen, weil sie die Zahl ebener Footprints SENKT und die Insel steril macht.
  Wer das trotzdem will, braucht eine neue Terrain-Klasse oberhalb
  `MOUNTAIN_HEIGHT` samt Renderer-Behandlung — offener Punkt.
* **Mesh-Einebnen unter dem Footprint** und **Pfahl-/Steglogik für
  Wassergebäude** (bereits aus v1.11 offen).
* **Neue Vegetations-/Prop-Assets** (§12). Die vorhandene Vegetations-Pipeline
  (Instancing, Qualitätsstufen, Chunking) bedient die neue Insel unverändert;
  große Bäume/Landmarken bleiben Drop-in (`models/**`, Prompts existieren).
* **Wüsten-/Sumpfregion.** Die neue Insel hat keine — `worldVisualProfiles.ts`
  erfindet deshalb keine (Test erzwingt das).

## 7. Reproduzieren

```bash
node tools/analyzeNewIsland.mjs   # GLB-Audit (tools/new-island-report.*)
node tools/bakeWorld.mjs          # Welt backen (alle Gen-Dateien + Report + 2 PNGs)
WRITE_BUILDING_DOCS=1 npx vitest run tests/buildingDocs.test.ts   # docs/REGIONS.md
npx tsc -b --force && npx eslint src tests && npx vitest run && npm run build
```

Vergleichsbake gegen die alte Insel (nur Diagnose, nie committen):
`WORLD_GLB="reference/world/island 3d new.glb" node tools/bakeWorld.mjs`
