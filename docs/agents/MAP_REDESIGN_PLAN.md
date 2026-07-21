# Map Redesign 5.0 — Umsetzungsplan

Stand: 21. Juli 2026 · v0.70 Referenzpass

| Meilenstein | Inhalt | Status v0.70 | Abnahme |
|---|---|---|---|
| M1 Audit | Bake, Höhenquelle, Chunks, Shader, Wasser, Vegetation, Regionen und Registry prüfen | abgeschlossen | `MAP_REDESIGN_AUDIT.md` benennt Bestand, Defizite und Risiken |
| M2 Materialkern | 12 Splat-Layer, neue Biomtexturen, weiche Regionsübergänge, Triplanar-Fels | abgeschlossen | keine harte technische Regionskante; Steilfels bleibt maßstäblich |
| M3 Gebirgsreferenz | Vorland/Fels/Schnee, alpine Tönung, Felsprops und Gipfel-Landmarken | Referenzpass abgeschlossen | Gebirge liest sich aus Nah- und Fernsicht klarer; keine Höhen-Neubake |
| M4 Gras & Wald | offene Wiese, Agrarprofil, Mischwald, große Kiefer, Solitärbaum | Referenzpass abgeschlossen | drei Baumfamilien und regionsabhängige Dichte |
| M5 Wasser & Küste | Kies-/Sandküste, Ozean-Makrowellen, animierte Flussströmung, Seenprofil | Kern abgeschlossen | Ozean, Fluss und Seen besitzen unterschiedliche Lesbarkeit |
| M6 Spezialbiome | rote Wüste und Sumpf auf vorhandenen Regionen | visuell abgeschlossen | Region 9/29 klar erkennbar; keine erfundenen Boni |
| M7 Landmarken & Atmosphäre | neutrale Orientierungspunkte, Nebel-/Lichtintegration, Fallbacks | Referenzpass abgeschlossen | pro Region deterministische, nicht spielmechanische Motive |
| M8 Produktionsabnahme | vollständige Matrix, Build, Screenshot-Smoke, GPU-Profiling | Build/Test abgeschlossen; Preview HTTP 200; Browserinstanz in dieser Sitzung nicht verfügbar | Referenzbilder und FPS/Draw-Calls auf Windows-Zielsystem dokumentieren |

## Nächste Qualitätsstufe

1. Für Berg, Wüste, Sumpf und Küste passende Normal-, Roughness- und optional
   AO-/Height-Maps erzeugen und den bestehenden Terrain-Shader erweitern.
2. Die in `WORLD_ASSET_MANIFEST.md` aufgeführten Hero- und Vegetationsmodelle als
   optimierte GLBs einlegen; die vorhandenen Fallbacks bleiben bestehen.
3. Screenshot-Smokes dauerhaft für Gebirge, Gras/Wald, Küste/Wasser,
   Wüste/Sumpf sowie Morgen/Nebel/Nacht archivieren und vergleichen.
4. Erst nach separater Designentscheidung biomeigene Gameplay-Effekte in der
   Config ergänzen. Rendererprofile sind dafür keine Datenquelle.

## Nicht Bestandteil dieses Passes

- keine Änderung der Inselkontur, Höhenbake, Regionspolygone oder Baufelder;
- keine zweite Map- oder Renderpipeline;
- keine neuen Ressourcen, Boni oder Platzierungsregeln;
- keine Save-Änderung; Schema bleibt v13;
- keine Behauptung, dass offene GLB- oder PBR-Drop-ins bereits vorhanden seien.
