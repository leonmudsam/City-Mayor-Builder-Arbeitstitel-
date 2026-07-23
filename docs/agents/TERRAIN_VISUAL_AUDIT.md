# Terrain Visual Audit — Overhaul 6.1

Stand: v0.73. Verbindliche Referenzen sind die vier vom Auftrag bereitgestellten
Screenshots sowie die stilisierten Insel- und Gebirgsbeispiele. Das Ziel ist ein
moderner, klar lesbarer Low-Poly-/Painterly-Look; keine fotografische
Mikrotextur und kein flaches Prototyp-Grün.

## Befund vor 6.1

- Das Gebirge wirkte aus der Nähe weich, grau und fast materiallos. Große
  Flanken hatten keine lesbaren Schichten, Grate oder Geröllfüße.
- Die Texturkachelung war mit `SPLAT_TILE_SCALE = 0.5` zu kleinteilig. Im
  Überblick entstand unruhiges Rauschen, ohne dass aus der Nähe echte Tiefe
  sichtbar wurde.
- Wiesen bestanden primär aus einer gleichförmigen Grundfarbe. Waldränder,
  Unterholz und benutzte/feuchte Flächen waren kaum unterscheidbar.
- Einzelne Felsen wirkten am Hang schwebend, weil ihre prozeduralen Fallbacks
  nur am Mittelpunkt geerdet wurden.
- Die Küsten waren überwiegend senkrechte Wände. Dadurch lagen Wasser und
  Bauland optisch weit auseinander; große Wassergebäude hatten keine
  glaubwürdigen 5×5-Zonen.
- Die vollständige Insel war im Verhältnis zum Stadtmaßstab zu breit. Leere
  Flächen und lange Wege dominierten stärker als Regionen und Entscheidungen.

## Verbindliche Lösung

1. Die Quellinsel nutzt horizontal nur noch 420 statt 472 Kacheln Spannweite
   (`0,8898` pro Achse, rund `0,7918` Fläche). Die Y-Skalierung bleibt separat;
   Gipfel erreichen rund 50 Welteinheiten.
2. Der Wasserlinien-Schwellwert steigt von `0,004` auf `0,0065`, die sichtbare
   Oberfläche von `-0,12` auf `-0,04`. 16 garantierte 5×5-Uferplattformen,
   569 direkt bebaubare Uferkacheln und differenzierte Klippen erhalten die
   Küstensilhouette.
3. Der Ground-Shader mischt 2048er Makrotexturen in Weltkoordinaten. Fels nutzt
   triplanare Projektion; Ebenen nutzen zwei nicht harmonische Skalen plus
   Makro-Noise. Detail-Normalen verblassen zwischen 85 und 175
   Kameradistanz-Einheiten.
4. Höhe, Hang, Biomprofil und Ufertyp bestimmen dieselben Gewichte. Direkte
   Uferdaten kommen aus dem Bake und werden nicht aus Regionsnamen geraten.
5. Regen senkt die Roughness und dunkelt Boden dezent ab. Instanziertes
   Mikrogras erscheint nur unter Distanz 105; Bäume, Sträucher und Felsen
   bleiben gebatcht/instanziert.
6. Fallback-Felsen werden auf dem niedrigsten Boden ihrer Grundfläche verankert
   und leicht eingegraben.

## Abnahmepunkte

- Nahsicht: Gras- und Felsnormalen erkennbar, aber keine Pixel-/Fotokörnung.
- Mitteldistanz: Bergschichten, Waldränder und Ufer bleiben klar lesbar.
- Übersicht: keine dominante Wiederholung, vollständige Insel im Preset bei
  Distanz 540, Fokus auf dem Schwerpunkt der realen Hauptlandmasse.
- Regen: nasser, nicht spiegelnder Kunststoffboden.
- Performance: ein Terrainmaterial pro Chunk, 11 Farbsampler plus selektive
  Zusatzmaps; Mikrogras ein InstancedMesh und distanzgeschaltet.

## Bewusst offen

- `TODO(CLAUDE_LOGIC)`: Wüste, Moor, Hafenfreischaltung und Ankunftserzählung
  erhalten erst dann Gameplayeffekte, wenn sie datengetrieben in bestehenden
  Config-/Command-Pfaden entworfen sind.
- Echte Wasserfall-, Hafen- und Landmark-GLBs bleiben Drop-in-Assets. Die
  vorhandenen Fallbacks täuschen keine fertige Simulation vor.
