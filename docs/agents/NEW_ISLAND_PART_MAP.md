# New Island Part Map

## Verbindliche Zuordnung

```text
Source-Mesh
  → stabile Audit-ID (Lage + Geometrietyp + laufende Nummer)
  → Audit-Regionskandidat (nur Analyse)
  → gemeinsamer Höhen-/Terrain-Bake
  → echte Region aus islandRegions.gen.ts
  → RegionVisualProfile / gemeinsames Splatmaterial
  → 64×64-Runtime-Chunk
```

Die vollständige Tabelle aller 78 Teile steht generiert in
`tools/new-island-report.md`; die maschinenlesbare Quelle ist
`tools/new-island-report.json`. Originalnamen bleiben nur Debug-Metadaten.
Eine direkte 1:1-Beziehung zwischen Source-Teil und Gameplayregion wäre falsch,
weil sich Source-Teile überlappen und Regionen über mehrere Teile verlaufen.

| Beispielquelle | Stabile ID | Audittyp | Materialprofil | Runtimegruppe |
|---|---|---|---|---|
| `meshes[0]` | `mid_west_grass_01` | Ebene/Hügelland | Gras/Makrovariation | Terrain-Chunk nach Weltkoordinate |
| `meshes[1]` | `north_east_mountain_01` | Bergkette/Gipfel | heller Triplanar-Fels/Schnee | Terrain-Chunk nach Weltkoordinate |
| `meshes[3]` | `mid_east_cliff_01` | Steilhang/Klippe | Schichtfels/Geröll | Terrain-Chunk nach Weltkoordinate |
| `meshes[9]` | `north_central_coast_02` | Küstenplateau | Gras/Kies/nasser Rand | Terrain-Chunk nach Weltkoordinate |
| `meshes[45]` | `north_east_coast_01` | Küstenplateau | Küstenprofil | Terrain-Chunk nach Weltkoordinate |

## Stabilitätsregel

Die stabile ID wird ausschließlich aus transformierter Lage, dominanter Form
und deterministischer Reihenfolge erzeugt. Ein Re-Export darf Source-Namen
ändern; Änderungen an Geometrie, Bounds oder Source-Hash erzwingen dagegen
einen neuen Audit und Bake. Gameplay referenziert niemals diese IDs.

