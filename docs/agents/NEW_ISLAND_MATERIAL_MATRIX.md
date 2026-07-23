# Neue Insel — Materialmatrix

Die Low-Poly-Referenzbilder geben die visuelle Richtung vor: sattes, leicht
variiertes Grün; helle, klar geschichtete Felsen; markante Plateauabbrüche;
türkise Küsten und sparsame Schneekappen. Das bestehende Splat-/Triplanarsystem
wird erweitert, nicht ersetzt.

| Terrain | Base/Profil | Normal/Rauheit | Höhe | Hang | Regionsprofil |
|---|---|---|---:|---:|---|
| Gras/Wiese | `grass_meadow.png`, weiche Makrovariation | vorhandener Shaderdetailpfad | 0–16 | flach | Ebene, Zentrum, Küste |
| Waldgrund | dunkles Grün/Moos, Clustervariation | rau, wenig Glanz | 1–20 | flach–mittel | Wald |
| Fruchtbar | dunklere Erde/Grünmischung | rau | 0–10 | flach | Flusstal, fruchtbar |
| Küste | `coast_pebbles.png`, Sand/Fels | nasser Rand glänzender | 0–4 | flach–steil | Küste, Insel |
| Plateau | Grasoberseite + Felskante + Geröllfuß | triplanar an Kante | 5–24 | Übergang | Hügelland/Hochplateau |
| Gebirge | `mountain_rock_base.png`, helle Schichtung | World-Space/triplanar | 16–44 | mittel–steil | Gebirge |
| Gipfelschnee | `mountain_snow.png` | matte, helle Kappe | 36–48 | bevorzugt flacher | höchste Gipfel |
| Trockenland | `desert_sand_red.png` als Splatprofil | rau | regionsgeführt | flach–mittel | Region 16, nur visuell |
| Sumpf | `swamp_mud.png`, oliv/dunkel | feuchter Glanz | niedrig | flach | Region 40, nur visuell |
| Wasser | Türkis→Tiefblau aus `oceanDepthGrid` | Wellen/Schaumshader | −3–0 | — | Meer/Seen/Flüsse |

Noch nicht vorhandene PBR-Sätze aus dem Wunschkatalog sind Drop-in-Ausbau,
nicht Voraussetzung des aktiven Fallbacks. Fehlende Normal-/Roughness-/AO-
Dateien dürfen nie crashen. Große Gipfelmodelle sind ausdrücklich nicht Teil
des Material- oder Prop-Systems.

