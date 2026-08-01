# Neue Insel – GLB-Audit

Automatisch erzeugt mit `node tools/analyzeNewIsland.mjs`. Die Source-Namen sind Debug-Metadaten; `stableId`, Materialprofil und Runtime-Gruppe sind die eigene, reproduzierbare Zuordnung.

## Kurzbefund

- Quelle: `reference/world/new island 3d model.glb`
- SHA-256: `b52c0cfbf590f9e5fb09e1702c43bfe544e6ce88ebfc66a50fe52d58b44374b0`
- GLB: 44.65 MiB, Asset-Version 2.0
- Szenenknoten: 118; Mesh-Ressourcen: 117; ausgewertete Mesh-Instanzen: 117
- Primitive: 117; Vertices: 989.147; Dreiecke: 1.914.065
- Original-Bounds: X 0.973536, Y 0.257583, Z 0.979186
- Oberfläche: 1.5188; projizierte XZ-Fläche: 1.1386
- Topologie: 120 verbundene Komponenten, 64.233 offene und 0 nicht-manifold Kanten
- Attribute: Normalen vollständig, UV0 unvollständig
- Regionskandidaten aus Segmentzentren: 45 (noch keine Gameplayregionen)

## Einordnung

Die Segmentklassifikation nutzt transformierte Geometrie, relative Höhe, Flächenneigung und Lage. Überlappungen sind AABB-Kandidaten und müssen beim Bake geometrisch aufgelöst werden. Offene Ränder markieren potentielle Küsten-/Wasserlochgrenzen, sind aber allein kein Beweis für ein Gewässer. Seen, Flüsse, echte Bauflächen und organische Regionsgrenzen werden deshalb erst aus dem gemeinsamen Höhen-/Wasserraster abgeleitet.

## Source-Part-Map (117 Teile)

| Quelle | stabile ID | Bounds X×Y×Z | proj. Fläche | Höhe | mittlere Neigung | möglicher Typ | Regionskandidat |
|---|---|---:|---:|---:|---:|---|---:|
| meshes[0] | mid_central_grass_03 | 0.776×0.133×0.738 | 0.1807 | 0.1333 | 17.5° | Ebene/Hügelland | 27 |
| meshes[1] | mid_east_grass_01 | 0.454×0.056×0.378 | 0.0796 | 0.0557 | 28.0° | Ebene/Hügelland | 24 |
| meshes[2] | north_east_grass_02 | 0.331×0.037×0.193 | 0.0327 | 0.0373 | 28.3° | Ebene/Hügelland | 19 |
| meshes[3] | south_east_grass_01 | 0.283×0.057×0.521 | 0.0724 | 0.0568 | 21.3° | Ebene/Hügelland | 29 |
| meshes[4] | north_central_coast_01 | 0.216×0.055×0.140 | 0.0184 | 0.0551 | 35.0° | Küstenplateau | 3 |
| meshes[5] | south_west_cliff_03 | 0.102×0.051×0.054 | 0.0023 | 0.0509 | 70.2° | Steilhang/Klippe | 30 |
| meshes[6] | south_central_cliff_06 | 0.146×0.050×0.075 | 0.0026 | 0.0496 | 72.8° | Steilhang/Klippe | 44 |
| meshes[7] | south_central_cliff_03 | 0.043×0.047×0.292 | 0.0027 | 0.0472 | 74.4° | Steilhang/Klippe | 34 |
| meshes[8] | north_central_grass_02 | 0.318×0.053×0.354 | 0.0531 | 0.0525 | 17.8° | Ebene/Hügelland | 14 |
| meshes[9] | south_east_cliff_03 | 0.174×0.053×0.113 | 0.0087 | 0.0525 | 57.7° | Steilhang/Klippe | 31 |
| meshes[10] | south_central_grass_02 | 0.389×0.051×0.342 | 0.0822 | 0.0513 | 11.1° | Ebene/Hügelland | 41 |
| meshes[11] | south_central_cliff_01 | 0.086×0.035×0.175 | 0.0027 | 0.0347 | 66.9° | Steilhang/Klippe | 27 |
| meshes[12] | mid_west_coast_03 | 0.198×0.056×0.252 | 0.0260 | 0.0562 | 22.8° | Küstenplateau | 26 |
| meshes[13] | mid_central_grass_02 | 0.365×0.056×0.304 | 0.0645 | 0.0557 | 8.2° | Ebene/Hügelland | 27 |
| meshes[14] | north_east_cliff_03 | 0.124×0.032×0.048 | 0.0025 | 0.0317 | 59.3° | Steilhang/Klippe | 6 |
| meshes[15] | south_central_mountain_04 | 0.044×0.155×0.165 | 0.0039 | 0.1555 | 73.6° | Bergkette/Gipfel | 39 |
| meshes[16] | north_east_coast_03 | 0.131×0.033×0.150 | 0.0219 | 0.0325 | 15.2° | Küstenplateau | 6 |
| meshes[17] | south_central_mountain_05 | 0.058×0.087×0.123 | 0.0033 | 0.0866 | 72.5° | Bergkette/Gipfel | 38 |
| meshes[18] | north_east_cliff_11 | 0.084×0.032×0.074 | 0.0029 | 0.0321 | 54.9° | Steilhang/Klippe | 13 |
| meshes[19] | mid_central_grass_01 | 0.528×0.026×0.377 | 0.0316 | 0.0265 | 11.8° | Ebene/Hügelland | 27 |
| meshes[20] | north_central_coast_02 | 0.150×0.044×0.192 | 0.0110 | 0.0439 | 24.4° | Küstenplateau | 8 |
| meshes[21] | mid_west_coast_01 | 0.194×0.032×0.253 | 0.0281 | 0.0324 | 2.5° | Küstenplateau | 21 |
| meshes[22] | north_east_grass_01 | 0.057×0.036×0.074 | 0.0040 | 0.0363 | 37.8° | Ebene/Hügelland | 7 |
| meshes[23] | south_central_mountain_11 | 0.022×0.071×0.057 | 0.0008 | 0.0709 | 72.2° | Bergkette/Gipfel | 41 |
| meshes[24] | mid_west_coast_02 | 0.193×0.030×0.484 | 0.0526 | 0.0301 | 8.1° | Küstenplateau | 21 |
| meshes[25] | north_west_grass_03 | 0.228×0.035×0.536 | 0.0397 | 0.0347 | 9.2° | Ebene/Hügelland | 16 |
| meshes[26] | south_west_grass_01 | 0.154×0.060×0.245 | 0.0246 | 0.0600 | 26.0° | Ebene/Hügelland | 28 |
| meshes[27] | north_central_grass_01 | 0.239×0.037×0.211 | 0.0337 | 0.0366 | 11.5° | Ebene/Hügelland | 8 |
| meshes[28] | north_west_grass_04 | 0.153×0.030×0.136 | 0.0138 | 0.0303 | 22.2° | Ebene/Hügelland | 15 |
| meshes[29] | north_east_coast_04 | 0.123×0.036×0.228 | 0.0297 | 0.0361 | 6.8° | Küstenplateau | 18 |
| meshes[30] | north_central_grass_04 | 0.174×0.018×0.311 | 0.0214 | 0.0178 | 12.0° | Ebene/Hügelland | 20 |
| meshes[31] | south_central_cliff_08 | 0.143×0.053×0.080 | 0.0045 | 0.0527 | 55.6° | Steilhang/Klippe | 45 |
| meshes[32] | mid_west_grass_01 | 0.145×0.051×0.165 | 0.0165 | 0.0505 | 17.0° | Ebene/Hügelland | 20 |
| meshes[33] | mid_west_cliff_02 | 0.075×0.033×0.129 | 0.0026 | 0.0333 | 66.7° | Steilhang/Klippe | 21 |
| meshes[34] | mid_west_cliff_01 | 0.065×0.033×0.187 | 0.0034 | 0.0332 | 61.7° | Steilhang/Klippe | 21 |
| meshes[35] | south_east_grass_03 | 0.048×0.045×0.153 | 0.0050 | 0.0447 | 50.1° | Ebene/Hügelland | 29 |
| meshes[36] | mid_east_cliff_01 | 0.152×0.056×0.059 | 0.0019 | 0.0565 | 69.6° | Steilhang/Klippe | 23 |
| meshes[37] | south_central_mountain_03 | 0.031×0.078×0.078 | 0.0012 | 0.0784 | 76.5° | Bergkette/Gipfel | 39 |
| meshes[38] | north_west_coast_02 | 0.138×0.024×0.169 | 0.0145 | 0.0237 | 11.7° | Küstenplateau | 9 |
| meshes[39] | mid_west_cliff_03 | 0.059×0.035×0.171 | 0.0012 | 0.0355 | 76.8° | Steilhang/Klippe | 22 |
| meshes[40] | mid_east_cliff_02 | 0.052×0.049×0.052 | 0.0016 | 0.0489 | 68.6° | Steilhang/Klippe | 24 |
| meshes[41] | mid_central_cliff_04 | 0.145×0.033×0.113 | 0.0020 | 0.0330 | 66.3° | Steilhang/Klippe | 27 |
| meshes[42] | north_west_coast_03 | 0.057×0.028×0.078 | 0.0046 | 0.0279 | 38.5° | Küstenplateau | 15 |
| meshes[43] | north_central_grass_03 | 0.096×0.050×0.099 | 0.0049 | 0.0503 | 38.1° | Ebene/Hügelland | 14 |
| meshes[44] | north_central_cliff_01 | 0.086×0.041×0.111 | 0.0011 | 0.0413 | 75.1° | Steilhang/Klippe | 11 |
| meshes[45] | south_east_cliff_01 | 0.018×0.046×0.119 | 0.0011 | 0.0464 | 74.6° | Steilhang/Klippe | 31 |
| meshes[46] | south_west_grass_03 | 0.162×0.046×0.129 | 0.0096 | 0.0459 | 18.4° | Ebene/Hügelland | 36 |
| meshes[47] | south_central_cliff_10 | 0.052×0.044×0.070 | 0.0022 | 0.0440 | 59.1° | Steilhang/Klippe | 44 |
| meshes[48] | south_east_cliff_05 | 0.030×0.048×0.091 | 0.0012 | 0.0483 | 75.9° | Steilhang/Klippe | 43 |
| meshes[49] | north_west_cliff_05 | 0.109×0.030×0.037 | 0.0018 | 0.0297 | 61.3° | Steilhang/Klippe | 9 |
| meshes[50] | south_central_mountain_01 | 0.046×0.075×0.044 | 0.0010 | 0.0754 | 74.0° | Bergkette/Gipfel | 33 |
| meshes[51] | south_west_cliff_06 | 0.080×0.055×0.056 | 0.0012 | 0.0548 | 73.5° | Steilhang/Klippe | 36 |
| meshes[52] | north_east_cliff_14 | 0.059×0.033×0.095 | 0.0020 | 0.0327 | 57.9° | Steilhang/Klippe | 18 |
| meshes[53] | south_central_cliff_05 | 0.024×0.038×0.114 | 0.0009 | 0.0384 | 75.6° | Steilhang/Klippe | 40 |
| meshes[54] | north_west_cliff_07 | 0.018×0.029×0.136 | 0.0009 | 0.0291 | 75.2° | Steilhang/Klippe | 16 |
| meshes[55] | south_east_cliff_04 | 0.033×0.044×0.065 | 0.0020 | 0.0440 | 55.0° | Steilhang/Klippe | 43 |
| meshes[56] | south_west_cliff_05 | 0.052×0.055×0.071 | 0.0015 | 0.0547 | 67.7° | Steilhang/Klippe | 37 |
| meshes[57] | south_west_cliff_08 | 0.014×0.033×0.135 | 0.0007 | 0.0328 | 77.2° | Steilhang/Klippe | 41 |
| meshes[58] | south_west_cliff_01 | 0.055×0.037×0.111 | 0.0011 | 0.0372 | 71.5° | Steilhang/Klippe | 26 |
| meshes[59] | north_west_coast_01 | 0.099×0.027×0.093 | 0.0072 | 0.0271 | 16.3° | Küstenplateau | 2 |
| meshes[60] | mid_west_grass_02 | 0.047×0.026×0.092 | 0.0034 | 0.0257 | 36.2° | Ebene/Hügelland | 22 |
| meshes[61] | north_east_cliff_10 | 0.062×0.040×0.031 | 0.0013 | 0.0405 | 63.2° | Steilhang/Klippe | 8 |
| meshes[62] | north_east_cliff_13 | 0.034×0.033×0.092 | 0.0015 | 0.0333 | 60.7° | Steilhang/Klippe | 13 |
| meshes[63] | north_east_cliff_07 | 0.060×0.036×0.043 | 0.0014 | 0.0364 | 59.0° | Steilhang/Klippe | 7 |
| meshes[64] | south_central_cliff_07 | 0.062×0.044×0.012 | 0.0007 | 0.0444 | 75.2° | Steilhang/Klippe | 44 |
| meshes[65] | north_west_cliff_01 | 0.042×0.029×0.071 | 0.0014 | 0.0286 | 57.8° | Steilhang/Klippe | 2 |
| meshes[66] | north_west_grass_02 | 0.049×0.028×0.069 | 0.0032 | 0.0280 | 34.1° | Ebene/Hügelland | 9 |
| meshes[67] | north_east_coast_01 | 0.073×0.036×0.053 | 0.0030 | 0.0358 | 34.1° | Küstenplateau | 1 |
| meshes[68] | mid_central_cliff_03 | 0.058×0.054×0.029 | 0.0009 | 0.0543 | 72.0° | Steilhang/Klippe | 20 |
| meshes[69] | south_central_mountain_14 | 0.041×0.040×0.033 | 0.0008 | 0.0403 | 68.5° | Bergkette/Gipfel | 42 |
| meshes[70] | north_west_cliff_06 | 0.076×0.027×0.035 | 0.0012 | 0.0270 | 60.4° | Steilhang/Klippe | 15 |
| meshes[71] | north_east_cliff_15 | 0.055×0.052×0.047 | 0.0006 | 0.0518 | 76.5° | Steilhang/Klippe | 19 |
| meshes[72] | mid_central_cliff_02 | 0.051×0.051×0.018 | 0.0007 | 0.0508 | 73.0° | Steilhang/Klippe | 20 |
| meshes[73] | north_west_cliff_04 | 0.068×0.029×0.037 | 0.0012 | 0.0286 | 57.1° | Steilhang/Klippe | 9 |
| meshes[74] | north_east_cliff_06 | 0.047×0.031×0.042 | 0.0010 | 0.0313 | 61.4° | Steilhang/Klippe | 5 |
| meshes[75] | north_east_cliff_12 | 0.050×0.031×0.038 | 0.0009 | 0.0315 | 68.9° | Steilhang/Klippe | 12 |
| meshes[76] | mid_east_cliff_06 | 0.051×0.045×0.029 | 0.0006 | 0.0455 | 75.7° | Steilhang/Klippe | 24 |
| meshes[77] | south_central_mountain_07 | 0.020×0.098×0.042 | 0.0005 | 0.0976 | 78.4° | Bergkette/Gipfel | 39 |
| meshes[78] | mid_east_cliff_04 | 0.037×0.047×0.043 | 0.0008 | 0.0471 | 68.2° | Steilhang/Klippe | 23 |
| meshes[79] | south_east_cliff_02 | 0.015×0.043×0.051 | 0.0005 | 0.0427 | 77.5° | Steilhang/Klippe | 31 |
| meshes[80] | south_central_mountain_13 | 0.028×0.068×0.032 | 0.0006 | 0.0675 | 74.9° | Bergkette/Gipfel | 42 |
| meshes[81] | north_east_cliff_01 | 0.052×0.038×0.029 | 0.0011 | 0.0381 | 57.3° | Steilhang/Klippe | 1 |
| meshes[82] | north_west_grass_01 | 0.129×0.031×0.090 | 0.0087 | 0.0314 | 7.8° | Ebene/Hügelland | 9 |
| meshes[83] | south_central_cliff_09 | 0.019×0.042×0.059 | 0.0008 | 0.0422 | 70.5° | Steilhang/Klippe | 44 |
| meshes[84] | south_central_mountain_08 | 0.026×0.091×0.047 | 0.0006 | 0.0908 | 74.4° | Bergkette/Gipfel | 41 |
| meshes[85] | south_west_grass_02 | 0.038×0.049×0.065 | 0.0013 | 0.0487 | 48.5° | Ebene/Hügelland | 30 |
| meshes[86] | south_central_mountain_06 | 0.023×0.061×0.037 | 0.0005 | 0.0606 | 74.5° | Bergkette/Gipfel | 38 |
| meshes[87] | north_east_cliff_08 | 0.033×0.031×0.051 | 0.0009 | 0.0307 | 57.4° | Steilhang/Klippe | 10 |
| meshes[88] | south_central_mountain_02 | 0.028×0.065×0.039 | 0.0006 | 0.0648 | 72.6° | Bergkette/Gipfel | 38 |
| meshes[89] | mid_west_grass_03 | 0.072×0.020×0.071 | 0.0035 | 0.0205 | 21.4° | Ebene/Hügelland | 25 |
| meshes[90] | south_central_mountain_10 | 0.026×0.077×0.036 | 0.0004 | 0.0772 | 77.2° | Bergkette/Gipfel | 42 |
| meshes[91] | south_west_cliff_07 | 0.020×0.042×0.050 | 0.0004 | 0.0422 | 76.6° | Steilhang/Klippe | 36 |
| meshes[92] | south_central_cliff_04 | 0.032×0.046×0.038 | 0.0005 | 0.0456 | 73.7° | Steilhang/Klippe | 35 |
| meshes[93] | south_west_cliff_02 | 0.010×0.048×0.036 | 0.0004 | 0.0479 | 75.0° | Steilhang/Klippe | 30 |
| meshes[94] | mid_east_cliff_05 | 0.010×0.044×0.038 | 0.0003 | 0.0440 | 76.9° | Steilhang/Klippe | 23 |
| meshes[95] | mid_west_cliff_04 | 0.021×0.030×0.047 | 0.0005 | 0.0299 | 69.4° | Steilhang/Klippe | 26 |
| meshes[96] | south_east_grass_02 | 0.106×0.016×0.107 | 0.0014 | 0.0163 | 38.4° | Ebene/Hügelland | 29 |
| meshes[97] | north_central_cliff_03 | 0.091×0.024×0.031 | 0.0009 | 0.0238 | 56.1° | Steilhang/Klippe | 14 |
| meshes[98] | south_central_mountain_12 | 0.022×0.050×0.033 | 0.0005 | 0.0500 | 73.9° | Bergkette/Gipfel | 42 |
| meshes[99] | north_east_cliff_09 | 0.042×0.031×0.032 | 0.0008 | 0.0308 | 55.1° | Steilhang/Klippe | 10 |
| meshes[100] | south_central_mountain_09 | 0.022×0.030×0.035 | 0.0004 | 0.0296 | 69.2° | Bergkette/Gipfel | 40 |
| meshes[101] | north_west_cliff_02 | 0.013×0.028×0.055 | 0.0005 | 0.0280 | 66.6° | Steilhang/Klippe | 4 |
| meshes[102] | north_east_cliff_04 | 0.019×0.035×0.040 | 0.0004 | 0.0352 | 71.7° | Steilhang/Klippe | 1 |
| meshes[103] | north_west_cliff_03 | 0.014×0.030×0.045 | 0.0005 | 0.0303 | 68.6° | Steilhang/Klippe | 4 |
| meshes[104] | north_east_cliff_02 | 0.038×0.041×0.029 | 0.0006 | 0.0409 | 66.6° | Steilhang/Klippe | 1 |
| meshes[105] | north_central_cliff_02 | 0.013×0.033×0.039 | 0.0002 | 0.0328 | 76.0° | Steilhang/Klippe | 11 |
| meshes[106] | north_west_cliff_09 | 0.011×0.026×0.044 | 0.0004 | 0.0261 | 71.6° | Steilhang/Klippe | 17 |
| meshes[107] | north_east_coast_02 | 0.136×0.004×0.145 | 0.0129 | 0.0038 | 0.2° | Küstenplateau | 7 |
| meshes[108] | north_west_cliff_08 | 0.015×0.027×0.054 | 0.0004 | 0.0273 | 72.7° | Steilhang/Klippe | 15 |
| meshes[109] | south_central_grass_01 | 0.116×0.007×0.258 | 0.0138 | 0.0075 | 0.3° | Ebene/Hügelland | 31 |
| meshes[110] | north_east_cliff_05 | 0.020×0.031×0.034 | 0.0005 | 0.0311 | 59.3° | Steilhang/Klippe | 5 |
| meshes[111] | mid_central_cliff_01 | 0.027×0.055×0.022 | 0.0004 | 0.0550 | 69.1° | Steilhang/Klippe | 20 |
| meshes[112] | mid_east_cliff_03 | 0.014×0.040×0.021 | 0.0002 | 0.0405 | 74.7° | Steilhang/Klippe | 23 |
| meshes[113] | south_west_cliff_04 | 0.010×0.040×0.036 | 0.0003 | 0.0401 | 77.8° | Steilhang/Klippe | 37 |
| meshes[114] | south_central_cliff_02 | 0.031×0.028×0.030 | 0.0003 | 0.0283 | 67.0° | Steilhang/Klippe | 32 |
| meshes[115] | south_east_grass_04 | 0.084×0.008×0.061 | 0.0026 | 0.0079 | 3.6° | Ebene/Hügelland | 43 |
| meshes[116] | north_central_cliff_04 | 0.030×0.037×0.014 | 0.0002 | 0.0373 | 74.2° | Steilhang/Klippe | 11 |

## Materialien und Texturen

| ID | Material | Alpha | referenzierte Texturen |
|---:|---|---|---|
| 0 | material | OPAQUE | – |

## Verbindliche Folgerungen für den Bake

1. Die Authoring-GLB darf wegen 1.914.065 Dreiecken nicht als unverändertes Runtime-Mesh geladen werden.
2. Die 117 Source-Teile werden nicht 1:1 zu Regionen; die Audit-Gruppierung liefert nur 45 Kandidaten.
3. Runtime-Höhen, Wasser, Bauflächen und Regionen müssen aus einer gemeinsamen deterministischen Bake-Quelle entstehen.
4. Die endgültige Ost-Startfläche wird anhand zusammenhängender flacher Kacheln gewählt, nicht anhand eines Mesh-Namens.
5. Offene bzw. überlappende Geometrie wird im Höhenraster über Top-down-Max-Y konsolidiert; Wasserlöcher werden anschließend per Flood-Fill geprüft.
