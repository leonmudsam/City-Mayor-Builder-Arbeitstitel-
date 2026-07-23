# Neue Insel — Audit N1/N2

Stand: 22. Juli 2026

## Quelle und Sicherung

- Eingangsasset: `island 3d new.glb` im Projektwurzelverzeichnis.
- Aktive, unveränderte Arbeitskopie: `reference/world/island 3d new.glb`.
- Beide Dateien: 44.957.328 Bytes.
- SHA-256: `63cb339303f6694f51ead6d2bc91aaac9891faa261ad4d77270330181fd3c917`.
- Die Source liegt außerhalb von `src/assets` und kann daher nicht durch die
  rekursive Drop-in-Registry zur Laufzeit geladen werden.

## Vollständiger GLB-Befund

| Merkmal | Ergebnis |
|---|---:|
| Szenenknoten | 79 |
| Mesh-Ressourcen / Instanzen / Primitive | 78 / 78 / 78 |
| Vertices | 945.473 |
| Dreiecke | 1.849.632 |
| Bounds X/Y/Z | 0,974698 / 0,251935 / 0,964616 |
| Oberfläche | 1,6980 |
| projizierte XZ-Fläche | 1,1107 |
| verbundene Komponenten | 78 |
| offene Kanten | 41.196 |
| nicht-manifold Kanten | 0 |
| Normalen | vollständig |
| UV0 | unvollständig |
| Audit-Regionskandidaten | 34 |

Die 78 Teile sind voneinander getrennte, offenrandige Landschaftssegmente. Die
Namen tragen keine belastbare Semantik. AABB-Überlappungen und offene Ränder
werden daher nicht als Regionen oder Gewässer interpretiert; erst der gemeinsame
Top-down-Bake löst Überdeckung, Wasser und Zusammenhang deterministisch auf.

## Werkzeuge und Artefakte

- `tools/analyzeNewIsland.mjs`: dependency-freier GLB-Parser und Geometrieaudit.
- `tools/new-island-report.json`: maschinenlesbare Detaildaten aller Teile.
- `tools/new-island-report.md`: vollständige 78-Zeilen-Tabelle mit Bounds,
  Fläche, Höhe, Neigung, Typ und Kandidat.
- `tools/bakeWorld.mjs`: einzige aktive Offline-Weltpipeline.
- `tools/bake-preview.png` und `tools/bake-report.md`: technische Vorschau und
  deterministische Bake-Bilanz.

## Altwelt-Verbraucher

Die bisherige Runtime las `islandTerrain.gen.ts`, `islandRegions.gen.ts` und
`worldHeight.gen.ts`; diese stabilen Dateinamen wurden bewusst weiterverwendet
und gemeinsam neu erzeugt. Dadurch existiert kein paralleler Weltpfad. Die alte
Source-GLB `reference/stylized island map 3d model.glb` hat keinen Runtime-
Verbraucher mehr, bleibt aber bis zum sauberen Git-Sicherungspunkt erhalten.

## Risiken und Entscheidungen

- Runtime-GLB mit 1,85 Mio. Dreiecken: verworfen; Offline-Bake ist verbindlich.
- 78 Source-Teile = 78 Regionen: verworfen; 40 organische Gameplayregionen.
- UV-basierte Volltexturierung: ungeeignet, weil UV0 lückenhaft; World-Space-
  und triplanares Mapping bleibt der robuste Pfad.
- Alte Koordinatenmigration: unzuverlässig; Save-v14-Neustart mit einmaligem
  Backup ist dokumentiert in `docs/SAVE_MIGRATION.md`.

