# Regionen — organische Landschaften (Welt 2.0)

> **Auto-generiert** aus der Spiel-Config (`buildings.config.ts` / `levels.config.ts` /
> `regions.config.ts`). Nicht von Hand editieren. Neu generieren:
> `WRITE_BUILDING_DOCS=1 npx vitest run tests/buildingDocs.test.ts`.
> Der Test schlägt fehl, sobald diese Datei von der Config abweicht.

13 gebackene Regionen ersetzen die alten Quadrat-Sektoren. Geometrie/Nachbarschaft kommen aus dem Bake (`src/game/config/world/islandRegions.gen.ts`, `tools/bake-report.md`); diese Tabelle gibt jeder Region Namen, Charakter, Vor-/Nachteile und Freischaltbedingungen.

**Startregion:** Zentralland (Region 9) — bewusst NEUTRAL (keine Modifikatoren) als Bezugspunkt.

| Id | Name | Biom | Freischaltung | Voraussetzungen | Bebaubare Kacheln | Produktion | Nachteil |
|---|---|---|---|---|---|---|---|
| 1 | Kronengebirge | Gebirge | L20 · 5.980.000 Geld | — | 2.476 | Stein ×1.9, Energie ×1.2, Nahrung ×0.7 | Straßen ×1.9 |
| 2 | Südaue | Küste | L12 · 1.050.000 Geld | — | 6.077 | Nahrung ×1.3 | — |
| 3 | Südterrassen | Hügelland | L3 · 100.000 Geld | — | 2.266 | Stein ×1.3, Nahrung ×1.15 | Straßen ×1.25 |
| 4 | Ostfelder | Ebene | L16 · 1.710.000 Geld | — | 2.244 | Nahrung ×1.3 | — |
| 5 | Südforst | Wald | L14 · 1.190.000 Geld | — | 2.497 | Holz ×1.5 | Straßen ×1.1 |
| 6 | Mittelau | Ebene | L10 · 415.000 Geld | — | 2.179 | Nahrung ×1.3 | — |
| 7 | Nordgrat | Gebirge | L9 · 340.000 Geld | — | 561 | Stein ×1.5, Energie ×1.1, Nahrung ×0.8 | Straßen ×1.5 |
| 8 | Westweiden | Ebene | L5 · 120.000 Geld | — | 1.074 | Nahrung ×1.25 | — |
| 9 | Zentralland | Zentrum | L1 · 0 Geld | — | 1.668 | — | — |
| 10 | Nordkap | Vorgelagerte Insel | L11 · 455.000 Geld | — | 407 | Energie ×1.3, Nahrung ×1.05, Wasser ×0.85 | Straßen ×1.3 |
| 11 | Zentralwald | Wald | L7 · 215.000 Geld | — | 1.413 | Holz ×1.45 | Straßen ×1.1 |
| 12 | Sonneninsel | Vorgelagerte Insel | L17 · 2.010.000 Geld | — | 830 | Energie ×1.35, Nahrung ×1.1, Wasser ×0.85 | Straßen ×1.3 |
| 13 | Binnenau | Ebene | L6 · 140.000 Geld | — | 1.400 | Holz ×1.2 | — |

**Produktion** = Multiplikatoren auf den Gebäude-Output in dieser Region (ab A4 wirksam). **Nachteil** = Malus (z. B. teurere Straßen im Gebirge). Neutral (Startregion) hat bewusst beides nicht.
