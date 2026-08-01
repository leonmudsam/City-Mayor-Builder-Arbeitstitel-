# WORLD_REBUILD — Weltgrundlage und Bake-Pipeline

> **Aktuell: § World Overhaul 12.0 (v1.17, D-041).** Die Weltgrundlage ist
> `reference/world/new island 3d model.glb` (117 Meshes, 1.914.065 Dreiecke,
> SHA-256 `b52c0cfb…4374b0`). Die frühere `island 3d new.glb` wird von nichts
> mehr gelesen. **Wichtig:** Seit D-041 läuft das Terraforming im Bake **VOR** der
> Regionssegmentierung (`§6b-flat`) — Regionen, Startregion, Rathaus und
> Regionsstatistik beschreiben das fertige, bespielbare Gelände. Details und
> Kennzahlen: [`agents/WORLD_OVERHAUL_12_PLAN.md`](agents/WORLD_OVERHAUL_12_PLAN.md).

## Historie: Terrain & World Scale Overhaul 6.1

## Ergebnis

`reference/world/new island 3d model.glb` ist die einzige geometrische Quelle der
aktiven Welt. Das vollständige Modell dient ausschließlich als Offline-
Authoringquelle. Simulation, Renderer, Minimap und Stadtarbeit verwenden die
gleichen deterministisch gebackenen Daten; es gibt kein zweites Weltsystem und
keinen Runtime-Import der Source-GLB.

```text
new island 3d model.glb
  → tools/analyzeNewIsland.mjs
  → tools/bakeWorld.mjs
  ├─ Simulation: Terrain, Regionen, Bebaubarkeit, Infrastruktur
  ├─ Renderer: Höhe, Wasser-/Küstenmasken, 64 Terrain-Chunks
  └─ UI: Übersicht, Minimap und Stadtarbeitskarte
```

## Autoritative Ausgaben

| Datei | Verantwortung |
|---|---|
| `islandTerrain.gen.ts` | 512² Terrainraster, Skalierung, Source-Hash, Zentralstart und Ankunftshooks |
| `islandRegions.gen.ts` | 13 organische Regionen und Nachbarschaften (Land + See) |
| `islandBuildability.gen.ts` | Höhe, Neigung, Wasser-/Kliff-/Ufer-/Waterfront-/Bauflags |
| `islandInfrastructure.gen.ts` | Brücken-, Viadukt-, Tunnel-, Hafen- und Wasserwegkandidaten |
| `worldHeight.gen.ts` | 1025²-Höhenraster für den Renderer |
| `worldMasks.gen.ts` | Wasser, Küstenabstand, Ozeantiefe, Ufertyp und Waterfront-Maske |
| `new_island_*.png` | gemeinsame topografische Basis für Welt-UI |

Generierte Dateien werden nie von Hand editiert. `node tools/bakeWorld.mjs`
überschreibt sie gemeinsam und verhindert dadurch Drift zwischen Simulation,
3D-Welt und Karten.

## Terrain und Darstellung

- Die Hauptsilhouette und alle großen Gebirge stammen vollständig aus dem
  neuen Height-Bake; zusätzliche Gipfelmodule wurden aus dem Renderer entfernt.
- Ein triplanarer World-Space-Splat mischt Gras, Wald, fruchtbaren Boden,
  Küstenmaterial, hellen Schichtfels, Geröll und Schnee nach Höhe, Hang und
  Regionsprofil. 6.1 aktiviert die neuen 2048er Granit-, Wiesen-, Wald- und
  Ufermaterialien sowie ausgewählte Normal-/Roughness-/AO-Maps. Nahdetail
  blendet kamerabasiert aus; Regen steuert Wetness.
- Wasser nutzt eine höher aufgelöste, segmentierte Ozeanfläche mit gebackener Tiefenfarbe:
  Türkis in Küstennähe, tiefes Blau außerhalb. Der vorhandene sparsame Wellen-
  und Schaumshader bleibt aktiv. Fluss-/Seenmasken stammen aus demselben Bake.
- Wälder werden als deterministische Cluster über bestehende Drop-in-Bäume und
  prozedurale Instancing-Fallbacks aufgebaut. Besetzte Flächen werden weiterhin
  von Vegetation freigehalten.

## Simulation und Platzierung

`samplePlacementSurface()` ist die zentrale synchrone Simulationsabfrage für
einen Footprint. Sie liefert minimale, maximale und mittlere Höhe, Neigung,
Normale, Terrain, Region, Ufertyp sowie Wasser-, Waterfront-, Kliff- und
Bauanteile. Gebäude bleiben
waagerecht, erhalten bei kleinen Differenzen einen gemeinsamen Steinsockel und
werden bei Wasser, Klippe oder zu großem Höhenunterschied abgelehnt. Straßen
nutzen dieselbe Maske mit einer eigenen, toleranteren Hanggrenze.

## Regionen und Progression

Der Bake erzeugt 40 nicht-rechteckige Landschaften aus Topografie, Wasser,
Biomkanten und Geometrieclustern. Region 24 „Herzland“ ist der neutrale,
zentrale Start; Regionen 4 und 25 bleiben nicht freischaltbare Zukunftsteaser.
Wüste (Region 16)
und Sumpf (Region 40) sind vorerst rein visuelle Profile:
`TODO(CLAUDE_LOGIC)` für spätere Gameplaywerte.

## Entwicklung und Sichtprüfung

Der Dev-Schalter „Gesamte Insel anzeigen“ entfernt nur visuell Regionswolken,
lädt die Geländedekoration aller Regionen und deckt die Minimap auf. Er ändert
weder Freischaltungen noch den Save und wird außerhalb von `import.meta.env.DEV`
nicht angezeigt.

## Bewusst vorbereitete, nicht vorgetäuschte Systeme

Der Bake liefert Kandidaten für Brücken, Viadukte, Tunnel, Häfen und Wasserwege.
Es existiert weiterhin keine zweite Verkehrs-, Tunnel- oder Schifffahrts-
simulation. Gameplay, Baukosten, Portale, Pfeiler, Freigaben und Navigation
bleiben `TODO(CLAUDE_LOGIC)` und erweitern später die bestehenden Straßen- und
Aktivitätssysteme.

## Altwelt-Sicherheit

Die alte Source-GLB wird von keinem aktiven Pfad mehr gelesen. Sie bleibt bis zu
einem sauberen Git-Sicherungspunkt erhalten, weil der Arbeitsbaum bereits
Nutzeränderungen enthält. Erst danach darf sie nach `reference/legacy-world/`
verschoben oder entfernt werden. Die Runtime enthält keinen Parallelpfad.
