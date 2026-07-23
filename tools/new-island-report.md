# Neue Insel – GLB-Audit

Automatisch erzeugt mit `node tools/analyzeNewIsland.mjs`. Die Source-Namen sind Debug-Metadaten; `stableId`, Materialprofil und Runtime-Gruppe sind die eigene, reproduzierbare Zuordnung.

## Kurzbefund

- Quelle: `reference/world/island 3d new.glb`
- SHA-256: `63cb339303f6694f51ead6d2bc91aaac9891faa261ad4d77270330181fd3c917`
- GLB: 42.87 MiB, Asset-Version 2.0
- Szenenknoten: 79; Mesh-Ressourcen: 78; ausgewertete Mesh-Instanzen: 78
- Primitive: 78; Vertices: 945.473; Dreiecke: 1.849.632
- Original-Bounds: X 0.974698, Y 0.251935, Z 0.964616
- Oberfläche: 1.6980; projizierte XZ-Fläche: 1.1107
- Topologie: 78 verbundene Komponenten, 41.196 offene und 0 nicht-manifold Kanten
- Attribute: Normalen vollständig, UV0 unvollständig
- Regionskandidaten aus Segmentzentren: 34 (noch keine Gameplayregionen)

## Einordnung

Die Segmentklassifikation nutzt transformierte Geometrie, relative Höhe, Flächenneigung und Lage. Überlappungen sind AABB-Kandidaten und müssen beim Bake geometrisch aufgelöst werden. Offene Ränder markieren potentielle Küsten-/Wasserlochgrenzen, sind aber allein kein Beweis für ein Gewässer. Seen, Flüsse, echte Bauflächen und organische Regionsgrenzen werden deshalb erst aus dem gemeinsamen Höhen-/Wasserraster abgeleitet.

## Source-Part-Map (78 Teile)

| Quelle | stabile ID | Bounds X×Y×Z | proj. Fläche | Höhe | mittlere Neigung | möglicher Typ | Regionskandidat |
|---|---|---:|---:|---:|---:|---|---:|
| meshes[0] | mid_west_grass_01 | 0.429×0.048×0.585 | 0.1362 | 0.0477 | 14.7° | Ebene/Hügelland | 16 |
| meshes[1] | north_east_mountain_01 | 0.185×0.248×0.130 | 0.0148 | 0.2478 | 73.8° | Bergkette/Gipfel | 9 |
| meshes[2] | north_east_mountain_03 | 0.224×0.161×0.135 | 0.0080 | 0.1613 | 70.2° | Bergkette/Gipfel | 13 |
| meshes[3] | mid_east_cliff_01 | 0.158×0.099×0.186 | 0.0223 | 0.0988 | 54.8° | Steilhang/Klippe | 13 |
| meshes[4] | south_central_grass_03 | 0.330×0.044×0.223 | 0.0579 | 0.0437 | 29.4° | Ebene/Hügelland | 25 |
| meshes[5] | mid_central_cliff_04 | 0.215×0.118×0.233 | 0.0209 | 0.1181 | 56.2° | Steilhang/Klippe | 19 |
| meshes[6] | north_central_cliff_04 | 0.128×0.127×0.133 | 0.0103 | 0.1271 | 70.6° | Steilhang/Klippe | 8 |
| meshes[7] | mid_east_grass_01 | 0.164×0.114×0.138 | 0.0306 | 0.1140 | 41.1° | Ebene/Hügelland | 14 |
| meshes[8] | north_central_grass_02 | 0.299×0.059×0.212 | 0.0439 | 0.0588 | 33.0° | Ebene/Hügelland | 8 |
| meshes[9] | north_central_coast_02 | 0.297×0.057×0.164 | 0.0429 | 0.0572 | 36.3° | Küstenplateau | 3 |
| meshes[10] | south_east_cliff_01 | 0.138×0.093×0.202 | 0.0128 | 0.0930 | 61.9° | Steilhang/Klippe | 27 |
| meshes[11] | north_east_grass_03 | 0.316×0.041×0.431 | 0.0799 | 0.0412 | 15.9° | Ebene/Hügelland | 13 |
| meshes[12] | north_central_cliff_02 | 0.142×0.087×0.082 | 0.0071 | 0.0865 | 65.4° | Steilhang/Klippe | 3 |
| meshes[13] | south_east_grass_03 | 0.268×0.062×0.308 | 0.0486 | 0.0623 | 31.8° | Ebene/Hügelland | 30 |
| meshes[14] | mid_west_cliff_01 | 0.193×0.063×0.471 | 0.0126 | 0.0633 | 65.8° | Steilhang/Klippe | 15 |
| meshes[15] | north_east_cliff_05 | 0.170×0.121×0.110 | 0.0083 | 0.1213 | 64.5° | Steilhang/Klippe | 7 |
| meshes[16] | south_central_grass_05 | 0.282×0.043×0.248 | 0.0454 | 0.0427 | 23.9° | Ebene/Hügelland | 34 |
| meshes[17] | north_east_cliff_02 | 0.074×0.074×0.060 | 0.0037 | 0.0741 | 67.4° | Steilhang/Klippe | 2 |
| meshes[18] | north_west_cliff_04 | 0.093×0.093×0.109 | 0.0063 | 0.0933 | 66.2° | Steilhang/Klippe | 10 |
| meshes[19] | north_central_cliff_03 | 0.087×0.088×0.067 | 0.0041 | 0.0885 | 72.8° | Steilhang/Klippe | 5 |
| meshes[20] | mid_west_grass_03 | 0.180×0.053×0.155 | 0.0173 | 0.0530 | 49.7° | Ebene/Hügelland | 23 |
| meshes[21] | south_west_grass_01 | 0.373×0.049×0.371 | 0.0482 | 0.0491 | 28.3° | Ebene/Hügelland | 23 |
| meshes[22] | mid_east_grass_02 | 0.252×0.047×0.202 | 0.0255 | 0.0473 | 35.4° | Ebene/Hügelland | 21 |
| meshes[23] | mid_central_mountain_01 | 0.099×0.128×0.054 | 0.0030 | 0.1281 | 74.6° | Bergkette/Gipfel | 13 |
| meshes[24] | south_east_grass_02 | 0.271×0.031×0.169 | 0.0248 | 0.0306 | 17.2° | Ebene/Hügelland | 26 |
| meshes[25] | north_east_cliff_10 | 0.073×0.054×0.108 | 0.0046 | 0.0540 | 57.0° | Steilhang/Klippe | 14 |
| meshes[26] | south_central_cliff_02 | 0.079×0.047×0.089 | 0.0040 | 0.0469 | 58.2° | Steilhang/Klippe | 32 |
| meshes[27] | north_west_grass_02 | 0.333×0.058×0.307 | 0.0388 | 0.0584 | 16.0° | Ebene/Hügelland | 12 |
| meshes[28] | north_west_cliff_02 | 0.068×0.065×0.088 | 0.0031 | 0.0650 | 65.1° | Steilhang/Klippe | 6 |
| meshes[29] | south_east_coast_01 | 0.186×0.042×0.204 | 0.0217 | 0.0419 | 30.5° | Küstenplateau | 30 |
| meshes[30] | south_central_cliff_01 | 0.112×0.032×0.093 | 0.0020 | 0.0320 | 75.4° | Steilhang/Klippe | 24 |
| meshes[31] | south_west_grass_03 | 0.316×0.058×0.246 | 0.0694 | 0.0578 | 30.3° | Ebene/Hügelland | 31 |
| meshes[32] | north_east_cliff_04 | 0.149×0.119×0.092 | 0.0075 | 0.1193 | 66.9° | Steilhang/Klippe | 4 |
| meshes[33] | north_east_mountain_04 | 0.167×0.173×0.058 | 0.0054 | 0.1731 | 73.3° | Bergkette/Gipfel | 13 |
| meshes[34] | south_west_coast_01 | 0.114×0.031×0.158 | 0.0157 | 0.0311 | 30.9° | Küstenplateau | 28 |
| meshes[35] | south_east_grass_01 | 0.188×0.048×0.280 | 0.0339 | 0.0481 | 13.3° | Ebene/Hügelland | 26 |
| meshes[36] | mid_central_grass_01 | 0.197×0.016×0.230 | 0.0236 | 0.0157 | 18.9° | Ebene/Hügelland | 19 |
| meshes[37] | north_east_coast_02 | 0.097×0.033×0.137 | 0.0108 | 0.0331 | 33.0° | Küstenplateau | 14 |
| meshes[38] | north_central_cliff_01 | 0.083×0.051×0.070 | 0.0037 | 0.0508 | 62.1° | Steilhang/Klippe | 1 |
| meshes[39] | mid_west_grass_02 | 0.199×0.032×0.161 | 0.0072 | 0.0320 | 44.9° | Ebene/Hügelland | 18 |
| meshes[40] | north_east_grass_02 | 0.117×0.039×0.117 | 0.0093 | 0.0388 | 33.5° | Ebene/Hügelland | 7 |
| meshes[41] | south_west_grass_04 | 0.161×0.034×0.189 | 0.0206 | 0.0343 | 11.9° | Ebene/Hügelland | 31 |
| meshes[42] | north_east_mountain_02 | 0.090×0.117×0.029 | 0.0017 | 0.1173 | 73.7° | Bergkette/Gipfel | 13 |
| meshes[43] | south_west_grass_02 | 0.123×0.042×0.189 | 0.0076 | 0.0420 | 32.7° | Ebene/Hügelland | 31 |
| meshes[44] | north_east_cliff_06 | 0.067×0.047×0.075 | 0.0022 | 0.0471 | 58.5° | Steilhang/Klippe | 7 |
| meshes[45] | north_east_coast_01 | 0.103×0.019×0.070 | 0.0059 | 0.0194 | 27.0° | Küstenplateau | 2 |
| meshes[46] | south_central_coast_01 | 0.188×0.024×0.143 | 0.0166 | 0.0236 | 9.2° | Küstenplateau | 34 |
| meshes[47] | north_east_cliff_07 | 0.039×0.103×0.059 | 0.0012 | 0.1035 | 75.2° | Steilhang/Klippe | 9 |
| meshes[48] | north_east_cliff_09 | 0.045×0.038×0.045 | 0.0014 | 0.0382 | 64.7° | Steilhang/Klippe | 11 |
| meshes[49] | south_central_cliff_04 | 0.048×0.029×0.052 | 0.0017 | 0.0288 | 59.1° | Steilhang/Klippe | 32 |
| meshes[50] | mid_central_cliff_06 | 0.045×0.033×0.046 | 0.0014 | 0.0331 | 64.0° | Steilhang/Klippe | 22 |
| meshes[51] | mid_west_cliff_03 | 0.049×0.030×0.055 | 0.0020 | 0.0297 | 58.1° | Steilhang/Klippe | 18 |
| meshes[52] | north_east_grass_01 | 0.103×0.028×0.117 | 0.0073 | 0.0283 | 12.4° | Ebene/Hügelland | 7 |
| meshes[53] | mid_east_grass_03 | 0.219×0.016×0.114 | 0.0129 | 0.0161 | 11.1° | Ebene/Hügelland | 21 |
| meshes[54] | mid_central_cliff_03 | 0.041×0.029×0.047 | 0.0013 | 0.0293 | 60.0° | Steilhang/Klippe | 17 |
| meshes[55] | north_east_cliff_03 | 0.057×0.036×0.056 | 0.0013 | 0.0358 | 60.3° | Steilhang/Klippe | 4 |
| meshes[56] | mid_west_cliff_02 | 0.086×0.056×0.068 | 0.0012 | 0.0563 | 68.0° | Steilhang/Klippe | 16 |
| meshes[57] | mid_central_cliff_05 | 0.054×0.036×0.044 | 0.0010 | 0.0356 | 61.5° | Steilhang/Klippe | 19 |
| meshes[58] | north_central_grass_01 | 0.080×0.045×0.069 | 0.0015 | 0.0454 | 49.1° | Ebene/Hügelland | 8 |
| meshes[59] | north_central_coast_01 | 0.042×0.013×0.040 | 0.0019 | 0.0130 | 35.5° | Küstenplateau | 1 |
| meshes[60] | south_east_cliff_02 | 0.075×0.036×0.033 | 0.0010 | 0.0364 | 67.7° | Steilhang/Klippe | 26 |
| meshes[61] | south_central_cliff_03 | 0.027×0.039×0.080 | 0.0013 | 0.0392 | 57.5° | Steilhang/Klippe | 33 |
| meshes[62] | north_west_cliff_01 | 0.056×0.040×0.106 | 0.0018 | 0.0395 | 57.0° | Steilhang/Klippe | 6 |
| meshes[63] | mid_east_coast_01 | 0.068×0.024×0.099 | 0.0035 | 0.0242 | 32.6° | Küstenplateau | 20 |
| meshes[64] | south_west_cliff_01 | 0.041×0.024×0.048 | 0.0015 | 0.0238 | 53.9° | Steilhang/Klippe | 31 |
| meshes[65] | north_west_grass_01 | 0.049×0.026×0.048 | 0.0013 | 0.0258 | 50.9° | Ebene/Hügelland | 6 |
| meshes[66] | north_east_cliff_01 | 0.045×0.035×0.053 | 0.0013 | 0.0354 | 63.2° | Steilhang/Klippe | 2 |
| meshes[67] | south_central_grass_01 | 0.097×0.004×0.079 | 0.0048 | 0.0044 | 11.0° | Ebene/Hügelland | 24 |
| meshes[68] | north_west_cliff_03 | 0.034×0.023×0.041 | 0.0010 | 0.0227 | 54.6° | Steilhang/Klippe | 12 |
| meshes[69] | north_central_grass_03 | 0.041×0.042×0.041 | 0.0009 | 0.0424 | 47.0° | Ebene/Hügelland | 8 |
| meshes[70] | mid_east_cliff_02 | 0.035×0.029×0.053 | 0.0006 | 0.0291 | 71.2° | Steilhang/Klippe | 20 |
| meshes[71] | mid_central_cliff_02 | 0.021×0.034×0.030 | 0.0004 | 0.0341 | 72.8° | Steilhang/Klippe | 17 |
| meshes[72] | south_central_grass_04 | 0.045×0.011×0.045 | 0.0014 | 0.0107 | 29.7° | Ebene/Hügelland | 29 |
| meshes[73] | north_west_cliff_05 | 0.029×0.018×0.033 | 0.0007 | 0.0176 | 53.2° | Steilhang/Klippe | 12 |
| meshes[74] | south_central_grass_02 | 0.042×0.015×0.033 | 0.0010 | 0.0147 | 43.1° | Ebene/Hügelland | 22 |
| meshes[75] | north_east_cliff_08 | 0.030×0.023×0.028 | 0.0006 | 0.0228 | 58.3° | Steilhang/Klippe | 11 |
| meshes[76] | mid_central_cliff_01 | 0.027×0.019×0.032 | 0.0006 | 0.0186 | 55.1° | Steilhang/Klippe | 17 |
| meshes[77] | mid_west_cliff_04 | 0.030×0.024×0.032 | 0.0006 | 0.0239 | 58.0° | Steilhang/Klippe | 16 |

## Materialien und Texturen

| ID | Material | Alpha | referenzierte Texturen |
|---:|---|---|---|
| 0 | material | OPAQUE | – |

## Verbindliche Folgerungen für den Bake

1. Die Authoring-GLB darf wegen 1.849.632 Dreiecken nicht als unverändertes Runtime-Mesh geladen werden.
2. Die 78 Source-Teile werden nicht 1:1 zu Regionen; die Audit-Gruppierung liefert nur 34 Kandidaten.
3. Runtime-Höhen, Wasser, Bauflächen und Regionen müssen aus einer gemeinsamen deterministischen Bake-Quelle entstehen.
4. Die endgültige Ost-Startfläche wird anhand zusammenhängender flacher Kacheln gewählt, nicht anhand eines Mesh-Namens.
5. Offene bzw. überlappende Geometrie wird im Höhenraster über Top-down-Max-Y konsolidiert; Wasserlöcher werden anschließend per Flood-Fill geprüft.
