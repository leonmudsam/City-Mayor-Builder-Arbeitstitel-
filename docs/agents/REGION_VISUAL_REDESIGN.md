# Region Visual Redesign 5.0

Stand: 21. Juli 2026

Diese Matrix beschreibt ausschließlich die Darstellung. Die kanonischen
Regionen, Biome, Freischaltungen und Produktionsmodifikatoren in
`regions.config.ts` bleiben unverändert.

| ID / Region | Visuelles Profil | Leitmaterial | Vegetation / Motiv | neutrale Landmarke | Logik-Handoff |
|---|---|---|---|---|---|
| 1 Hochgebirgskern | Gebirge | heller Fels + Schnee | alpin, felsig | markanter Gipfel | — |
| 2 Lichtungsland | Grasland | Wiese | offen, gemischt | große Lichtung | — |
| 3 Südsee-Becken | Seenland | Wiese + Ufer | Schilf/Ufer | Seeinsel | — |
| 4 Fruchtdelta | Fruchttal | Farmboden + Wiese | Agrarränder | Flussdelta | — |
| 5 Ostweiden | Trockene Ebene | trockenes Gras | Fels/Trockengebüsch | Felsgruppe | — |
| 6 Ostkap | Küste | Kies + Fels | Ufervegetation | Leuchtturmkap | — |
| 7 Nordfelder | Grasland | Wiese/Farm | Agrar | Heckenfeld | — |
| 8 Nordstrand | Küste | Sand + Kies | lichte Uferzone | Sandbucht | — |
| 9 Morgenküste | Wüste | roter Sandstein | spärlich/trocken | rote Felsnadel | `TODO(CLAUDE_LOGIC)`: Wasser/Solar/Nahrung nur per Config |
| 10 Mittelland | Grasland | Wiese | offen | alter Solitärbaum | — |
| 11 Südostwald | Wald | Waldboden | dichter Kernwald | Waldlichtung | — |
| 12 Westanger | Grasland | Wiese | offen/blütenreich | Blumenhang | — |
| 13 Hochweiden | Hügelland | Wiese + Stein | offene Hochweide | Felsrücken | — |
| 14 Südküste | Küste | Sand/Kies | Ufer | Flussmündung | — |
| 15 Westklippen | Küste | Klippe + Kies | alpin/karg | Felsbogen | — |
| 16 Nebelkap | Küste | Kies/Fels | feuchte Uferzone | Nebelklippe | — |
| 17 Spiegelwald | Wald | Waldboden | dichter Mischwald | Spiegelteich | — |
| 18 Westgrat | Gebirge | Fels + Schnee | alpin | Gratspitze | — |
| 19 Mühlental | Flusstal | Wiese + Ufer | Agrar/Ufer | Wasserfallstufe | — |
| 20 Hügelland | Hochland | Stein + trockenes Gras | lichte Hochlage | Hochplateau | — |
| 21 Spiegelsee | Seenland | Ufer/Wiese | Schilf/Ufer | Insel im See | — |
| 22 Südwestwald | Wald | feuchter Waldboden | moosiger Kernwald | moosiger Urbaum | — |
| 23 Nordkamm | Hochland | Bergfels | alpin | Passhöhe | — |
| 24 Graue Zinnen | Gebirge | heller Fels + Schnee | alpin/karg | Zwillingsgipfel | — |
| 25 Sturmspitzen | Gebirge | Schnee + Fels | hochalpin | Schneekamm | — |
| 26 Ostwald | Wald | Waldboden | Farn/Mischwald | Farnlichtung | — |
| 27 Wachtberge | Hochland | Bergfels/Wiese | alpin | Wachtfelsen | — |
| 28 Kliffwald | Wald | Waldboden + Küste | windiger Wald | Baumklippe | — |
| 29 Westbucht | Sumpf | Torf/Schlamm | Schilf/Totholz | Moorsee | `TODO(CLAUDE_LOGIC)`: Boni/Risiken nur per Config |
| 30 Schmugglerbucht | Küste | Fels/Kies | verborgenes Ufer | versteckte Felsbucht | — |
| 31 Südgrat | Gebirge | trockener Fels | karg/alpin | trockene Felszinnen | — |
| 32 Nebelinsel | Küste | Kies/Fels | feucht/karg | kleine Inselkette | — |

## Übergangsregel

Pro Terrainvertex werden die Region am Punkt und mehrere nahe Nachbarpunkte
abgetastet. Nur die visuellen Splat-Gewichte werden gemittelt. Dadurch laufen
Wüste, Sumpf, Küste und alpine Zonen organisch über technische Polygongrenzen,
während Freischaltung, Besitz und Gameplay weiterhin exakt auf der ursprünglichen
Region liegen.

