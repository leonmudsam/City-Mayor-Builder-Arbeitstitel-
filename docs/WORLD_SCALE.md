# WORLD_SCALE — Verbindliche Maße der Insel 6.1

> Gültig ab Schema v15. Autoritative Quellen: `tools/bakeWorld.mjs`,
> `tools/bake-report.md` und die gemeinsam generierten Weltdateien.

## Welt und Quelle

| Größe | Verbindlicher Wert |
|---|---:|
| Authoring-Quelle | `reference/world/island 3d new.glb` |
| Source-SHA-256 | `63cb339303f6694f51ead6d2bc91aaac9891faa261ad4d77270330181fd3c917` |
| Kachelmaß | 1 Kachel = 1 Welt-Einheit ≈ 4 m |
| Logisches Raster | 512 × 512 Kacheln |
| Quellspannweite X/Z | 420 statt 472 Kacheln |
| Horizontalfaktor | 0,8898 je Achse; Flächenfaktor 0,7918 |
| Höhenraster | 1025 × 1025 Samples |
| Ozeanrand | 46 Kacheln |
| Wasserlinie | y = 0; Source-Schwelle 0,0065; sichtbare Fläche y = −0,04 |
| Höhenbereich | −2,40 bis 49,98 Welt-Einheiten |
| Höchster Gipfel | ≈ 50 Einheiten ≈ 200 m |

X/Z und Y sind absichtlich getrennt. Die Spiel-/Gebäudegröße bleibt
unverändert; nur die Landschaft rückt dichter zusammen. Die Quell-GLB mit rund
1,85 Millionen Dreiecken wird niemals zur Laufzeit geladen.

## Flächenbilanz

| Klasse | Kacheln | Anteil |
|---|---:|---:|
| Wasser | 161.481 | 61,6 % |
| Fluss | 927 | 0,4 % |
| Sand | 6.446 | 2,5 % |
| Fruchtbar | 5.752 | 2,2 % |
| Gras | 47.849 | 18,3 % |
| Wald | 20.911 | 8,0 % |
| Gebirge | 18.778 | 7,2 % |

Die Baufläche sinkt von der 6.0-Baseline 55.941 auf 44.757 Kacheln, also
exakt um rund 20 %. Wasser, Klippen, starke Hänge und Sicherheitskanten bleiben
ausgeschlossen. 569 direkte Uferkacheln und 16 gebackene 5×5-Plattformen sind
bewusst wasserbaunah.

## Zentraler Start

| Größe | Wert |
|---|---:|
| Startregion | Region 24 „Herzland“ |
| Bebaubare Kacheln | 1.290 |
| Rathausanker | (125, 193), Footprint 5 × 5 |
| Gründungsmittelpunkt | (127, 195) |
| Hauptland-Schwerpunkt | (156,93; 222,11) |
| Frühe Fläche | 4.418 Kacheln |
| Startstraßen | 16 Kacheln auf zwei Achsen |
| Küstenankunft | (222, 206) |
| Versorgungstrasse | 115 Kacheln |

Der Start wird aus real bebaubaren Landschaften bewertet: Flachheit,
Zentralität, Expansion in vier Richtungen, Ressourcen, Infrastruktur sowie
Wasser-/Klippenrisiko. Der mathematische Rastermittelpunkt `(256,256)` ist
nicht die Mitte der Hauptlandmasse und wird deshalb nicht als Start gewählt.

## Kamera und Laufzeit

| Ansicht | Richtwert |
|---|---:|
| Nah | Distanz 25–70 |
| Stadt | 70–180 |
| Region | 180–340 |
| Insel | 340–540 |
| Maximale Distanz | 600 |
| Terrain-Chunks | 8 × 8 Chunks à 64 × 64 Kacheln |

Das Übersichtspreset fokussiert den echten Hauptland-Schwerpunkt. Culling,
gemeinsame Materialien, Instancing und distanzabhängiges Nahdetail gelten in
Browser und Tauri identisch.
