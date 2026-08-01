# Regionen — organische Landschaften (Welt 2.0)

> **Auto-generiert** aus der Spiel-Config (`buildings.config.ts` / `levels.config.ts` /
> `regions.config.ts`). Nicht von Hand editieren. Neu generieren:
> `WRITE_BUILDING_DOCS=1 npx vitest run tests/buildingDocs.test.ts`.
> Der Test schlägt fehl, sobald diese Datei von der Config abweicht.

9 gebackene Regionen ersetzen die alten Quadrat-Sektoren. Geometrie/Nachbarschaft kommen aus dem Bake (`src/game/config/world/islandRegions.gen.ts`, `tools/bake-report.md`); diese Tabelle gibt jeder Region Namen, Charakter, Vor-/Nachteile und Freischaltbedingungen.

**Startregion:** Gründerland (Region 9) — bewusst NEUTRAL (keine Modifikatoren) als Bezugspunkt.

| Id | Name | Biom | Freischaltung | Voraussetzungen | Bebaubare Kacheln | Produktion | Nachteil |
|---|---|---|---|---|---|---|---|
| 1 | Lagunenland | Seenland | L6 · 310.000 Geld | — | 6.148 | Wasser ×1.45, Holz ×1.2, Nahrung ×1.1 | Straßen ×1.15 |
| 2 | Westmark | Ebene | L4 · 160.000 Geld | — | 6.496 | Nahrung ×1.2, Holz ×1.1, Stein ×1.1 | — |
| 3 | Ostterrassen | Flusstal | L14 · 1.900.000 Geld | — | 5.750 | Nahrung ×1.35, Wasser ×1.3, Holz ×0.95 | — |
| 4 | Dünenküste | Küste | L8 · 505.000 Geld | — | 6.359 | Nahrung ×1.3, Wasser ×1.25 | — |
| 5 | Südmassiv | Gebirge | L20 · 4.450.000 Geld | — | 783 | Stein ×1.7, Energie ×1.25, Nahrung ×0.7 | Straßen ×1.5 |
| 6 | Nordküste | Fruchtbares Land | L11 · 995.000 Geld | — | 5.137 | Nahrung ×1.4, Wasser ×1.15 | — |
| 7 | Nordwald | Wald | L2 · 105.000 Geld | — | 3.617 | Holz ×1.45, Nahrung ×0.95 | — |
| 8 | Südhügel | Hügelland | L17 · 2.220.000 Geld | — | 2.108 | Stein ×1.35, Holz ×1.1, Nahrung ×0.9 | Straßen ×1.2 |
| 9 | Gründerland | Zentrum | L1 · 0 Geld | — | 1.400 | — | — |

**Produktion** = Multiplikatoren auf den Gebäude-Output in dieser Region (ab A4 wirksam). **Nachteil** = Malus (z. B. teurere Straßen im Gebirge). Neutral (Startregion) hat bewusst beides nicht.
