# Neue Insel — Infrastrukturvorbereitung 6.1

`islandInfrastructure.gen.ts` enthält rein geografische, deterministische
Kandidaten. Sie sind keine gebauten Objekte und keine zweite Simulation.

| Typ | Anzahl | Inhalt |
|---|---:|---|
| Brücken | 2 | Achse, Spannweite, Wassertyp, Ufertypen, Rampensteigung, Straßenklassen |
| Viadukte | 24 | Deckhöhen, Pfeilerhöhe, Spannweite, Bodenfreiheit |
| Tunnel | 24 | Portale, Länge, Bergtiefe, Mindestlevelvorschlag |
| Häfen | 16 | Landkachel, Wasserzugang, Region, Tiefe, Ufertyp, Bauapron |
| Wasserwegknoten | 585 | Meer/Fluss/See/Hafen, Tiefe und Clearance |

Die zwei Brückenkorridore verbinden flache, gegenüberliegende Ufer bei
`(204,220)→(204,230)` und `(246,264)→(246,277)`. Ihre Rampensteigung ist
gebacken; eine Gameplayfreigabe existiert noch nicht.

Die historische Ankunft liegt bei `(222,206)` in Region 8. Der zugehörige
`futureHarborCandidateId` zeigt auf einen echten Hafenanker mit bebaubarer
Uferzone. Die 115 Kacheln lange `initialSupplyRoute` endet an der südlichen
Achse des Rathauses in Region 24. Diese Daten sind Story-/Logistikhooks, keine
automatisch gestartete Mission.

## Offene Gameplayarbeit

- `TODO(CLAUDE_LOGIC)`: Brückenbau, Pfeiler/Deck, Kosten und Freigaben in das
  bestehende Straßensystem integrieren.
- `TODO(CLAUDE_LOGIC)`: Tunnelportale, Kollisions-/Sichtlogik und Navigation.
- `TODO(CLAUDE_LOGIC)`: Hafen-/Schifffahrtsgraph als Verbraucher der
  bestehenden Aktivitäts- und Fahrzeugpfade.
- `TODO(CLAUDE_LOGIC)`: Ankunftstutorial und Gründungsreise über vorhandene
  Quest-/Command-Systeme entwerfen.

Keine Aufgabe rechtfertigt eine zweite Verkehrs- oder Missions-State-Machine.
