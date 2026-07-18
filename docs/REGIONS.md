# Regionen — organische Landschaften (Welt 2.0)

> **Auto-generiert** aus der Spiel-Config (`buildings.config.ts` / `levels.config.ts` /
> `regions.config.ts`). Nicht von Hand editieren. Neu generieren:
> `WRITE_BUILDING_DOCS=1 npx vitest run tests/buildingDocs.test.ts`.
> Der Test schlägt fehl, sobald diese Datei von der Config abweicht.

32 gebackene Regionen ersetzen die alten Quadrat-Sektoren. Geometrie/Nachbarschaft kommen aus dem Bake (`src/game/config/world/islandRegions.gen.ts`, `tools/bake-report.md`); diese Tabelle gibt jeder Region Namen, Charakter, Vor-/Nachteile und Freischaltbedingungen.

**Startregion:** Lichtungsland (Region 2) — bewusst NEUTRAL (keine Modifikatoren) als Bezugspunkt.

**Nie freischaltbar (Teaser):** Nebelinsel (32) — am Horizont sichtbares Versprechen für spätere Inhalte.

| Id | Name | Biom | Freischaltung | Voraussetzungen | Bebaubare Kacheln | Produktion | Nachteil |
|---|---|---|---|---|---|---|---|
| 1 | Hochgebirgskern | Gebirge | L18 · 1.800.000 Geld | 24, 25 | 346 | Stein ×1.8, Nahrung ×0.6 | Straßen ×2 |
| 2 | Lichtungsland | Zentrum | L1 · 0 Geld | — | 5.993 | — | — |
| 3 | Südsee-Becken | Seenland | L11 · 850.000 Geld | — | 1.324 | Wasser ×1.4, Nahrung ×1.1 | — |
| 4 | Fruchtdelta | Fruchtbares Land | L5 · 320.000 Geld | — | 4.738 | Nahrung ×1.35, Wasser ×1.1 | — |
| 5 | Ostweiden | Ebene | L10 · 750.000 Geld | — | 4.544 | Nahrung ×1.2 | — |
| 6 | Ostkap | Küste | L12 · 950.000 Geld | — | 3.366 | Nahrung ×1.15 | — |
| 7 | Nordfelder | Ebene | L6 · 380.000 Geld | — | 4.057 | Nahrung ×1.1 | — |
| 8 | Nordstrand | Küste | L13 · 1.050.000 Geld | — | 3.511 | Nahrung ×1.2 | — |
| 9 | Morgenküste | Küste | L14 · 1.150.000 Geld | — | 3.403 | Nahrung ×1.2 | — |
| 10 | Mittelland | Ebene | L7 · 420.000 Geld | — | 3.452 | Nahrung ×1.1 | — |
| 11 | Südostwald | Wald | L9 · 600.000 Geld | — | 3.222 | Holz ×1.5 | — |
| 12 | Westanger | Ebene | L8 · 480.000 Geld | — | 3.225 | Nahrung ×1.1, Holz ×1.1 | — |
| 13 | Hochweiden | Hügelland | L10 · 700.000 Geld | — | 3.039 | Stein ×1.2, Energie ×1.15 | — |
| 14 | Südküste | Küste | L12 · 900.000 Geld | — | 2.889 | Nahrung ×1.2 | — |
| 15 | Westklippen | Küste | L15 · 1.250.000 Geld | — | 2.042 | Nahrung ×1.15, Wasser ×1.1 | — |
| 16 | Nebelkap | Küste | L16 · 1.350.000 Geld | — | 1.617 | Nahrung ×1.15 | — |
| 17 | Spiegelwald | Wald | L8 · 520.000 Geld | — | 1.942 | Holz ×1.5 | — |
| 18 | Westgrat | Gebirge | L14 · 1.200.000 Geld | — | 339 | Stein ×1.6, Nahrung ×0.7 | Straßen ×1.8 |
| 19 | Mühlental | Flusstal | L12 · 850.000 Geld | — | 1.678 | Nahrung ×1.3, Wasser ×1.2 | — |
| 20 | Hügelland | Hügelland | L11 · 800.000 Geld | — | 1.389 | Stein ×1.25, Energie ×1.15 | — |
| 21 | Spiegelsee | Seenland | L11 · 800.000 Geld | — | 923 | Wasser ×1.3, Holz ×1.1 | — |
| 22 | Südwestwald | Wald | L13 · 1.000.000 Geld | — | 1.588 | Holz ×1.5 | — |
| 23 | Nordkamm | Gebirge | L12 · 900.000 Geld | — | 1.095 | Stein ×1.5 | Straßen ×1.5 |
| 24 | Graue Zinnen | Gebirge | L13 · 1.000.000 Geld | — | 356 | Stein ×1.5, Nahrung ×0.7 | Straßen ×1.7 |
| 25 | Sturmspitzen | Gebirge | L14 · 1.100.000 Geld | 20 | 173 | Stein ×1.7, Nahrung ×0.6 | Straßen ×2 |
| 26 | Ostwald | Wald | L10 · 700.000 Geld | — | 1.415 | Holz ×1.4 | — |
| 27 | Wachtberge | Gebirge | L9 · 650.000 Geld | — | 624 | Stein ×1.5, Nahrung ×0.7 | Straßen ×1.6 |
| 28 | Kliffwald | Wald | L15 · 1.200.000 Geld | — | 1.143 | Holz ×1.4 | — |
| 29 | Westbucht | Küste | L15 · 1.250.000 Geld | — | 949 | Nahrung ×1.2 | — |
| 30 | Schmugglerbucht | Küste | L16 · 1.300.000 Geld | — | 748 | Nahrung ×1.15 | — |
| 31 | Südgrat | Gebirge | L16 · 1.400.000 Geld | — | 503 | Stein ×1.6 | Straßen ×1.8 |
| 32 | Nebelinsel | Vorgelagerte Insel | nie | — | 705 | — | — |

**Produktion** = Multiplikatoren auf den Gebäude-Output in dieser Region (ab A4 wirksam). **Nachteil** = Malus (z. B. teurere Straßen im Gebirge). Neutral (Startregion) hat bewusst beides nicht.
