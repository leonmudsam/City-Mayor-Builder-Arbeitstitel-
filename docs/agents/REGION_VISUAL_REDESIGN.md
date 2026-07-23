# Region Visual Redesign 6.1

Die 40 gebackenen Landschaften bleiben das bestehende Regionssystem. 6.1 fügt
keine zweite Karte und keine zweite Biomlogik hinzu. `regions.config.ts` enthält
Progression und Produktionsmodifikatoren; `worldVisualProfiles.ts` beschreibt
nur Palette, Materialanteile, Vegetation und Landmark-Fallback.

## Profilfamilien

Zwölf visuelle Familien decken die Insel ab: Grasland, Wald, Fruchttal,
Gebirge, Wüste, Sumpf, trockene Ebene, Küste, Seenland, Hügelland, Flusstal und
Hochland. Jede Region kombiniert eine Familie mit eigenem Ton, Vegetationstyp,
Uferanteil, Alpine-Anteil und Landmarke. Übergänge werden aus sieben
Nachbarsamples weich gemittelt; die harte Gameplaygrenze bleibt unverändert.

## Neue räumliche Lesart

- Region 24 „Herzland“ ist das zentrale, neutrale Gründerland. Sie besitzt
  1.290 Baukacheln und liegt am Schwerpunkt der zusammenhängenden Hauptinsel.
- Regionen 1 und 3 bilden die ersten westlichen/nordwestlichen
  Expansionsrichtungen. Zusammen mit Herzland stehen früh 4.418 Baukacheln zur
  Verfügung.
- Region 8 „Ankunftsforst“ verbindet die vorbereitete Küstenankunft bei
  `(222,206)` mit dem Herzland; die 115 Kacheln lange Trasse ist Geografie, noch
  keine Mission.
- Region 7 ist das monumentale Kronengebirge; 13, 28, 31 und 39 ergänzen Pässe,
  Klippen und Zinnen mit abgestuften Alpine-Gewichten.
- Region 16 bleibt die visuelle rote Trocken-/Wüstenzone, Region 40 das visuelle
  Schilfdelta. Beide behalten `TODO(CLAUDE_LOGIC)` statt vorgetäuschter Boni.
- Abgelegene Inselregionen 4 und 25 bleiben gesperrte Zukunftsteaser, bis ein
  bestehender Verkehrs-/Distriktpfad ihre Erschließung ehrlich abbildet.

## Material- und Vegetationsregeln

- Offene Profile: Wiesenmakrostruktur, Solitärbäume, seltene Blütencluster.
- Waldkern: dichter gruppierte Nadel-/Laubbäume, Moosboden, Totholz und
  Unterwuchs; keine gleichmäßige Baumtapete.
- Alpin: Fels-/Schichtmaterial, Geröll und wenige große Nadelbäume; kein
  Mikrogras auf steilen Flächen.
- Ufer: Ufertyp aus dem Bake, Schilf und breite türkisfarbene Seichtzone nur an
  zugänglichen Küsten; Steilküsten erhalten schmale Brandung.
- Agrar: fruchtbarer Grundton und sparsame Feldspuren, ohne unbebaute Flächen
  bereits als fertige Landwirtschaft darzustellen.

Die verbindlichen IDs, Zentren, Nachbarn und Baukachelzahlen stammen aus
`tools/bake-report.md`; Namen und Profiltexte dürfen diese Geografie nicht
überschreiben.
