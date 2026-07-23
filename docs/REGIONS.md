# Regionen — organische Landschaften (Welt 2.0)

> **Auto-generiert** aus der Spiel-Config (`buildings.config.ts` / `levels.config.ts` /
> `regions.config.ts`). Nicht von Hand editieren. Neu generieren:
> `WRITE_BUILDING_DOCS=1 npx vitest run tests/buildingDocs.test.ts`.
> Der Test schlägt fehl, sobald diese Datei von der Config abweicht.

13 gebackene Regionen ersetzen die alten Quadrat-Sektoren. Geometrie/Nachbarschaft kommen aus dem Bake (`src/game/config/world/islandRegions.gen.ts`, `tools/bake-report.md`); diese Tabelle gibt jeder Region Namen, Charakter, Vor-/Nachteile und Freischaltbedingungen.

**Startregion:** Zentralland (Region 13) — bewusst NEUTRAL (keine Modifikatoren) als Bezugspunkt.

| Id | Name | Biom | Freischaltung | Voraussetzungen | Bebaubare Kacheln | Produktion | Nachteil |
|---|---|---|---|---|---|---|---|
| 1 | Kronengebirge | Gebirge | L20 · 6.690.000 Geld | — | 3.833 | Stein ×1.9, Energie ×1.2, Nahrung ×0.7 | Straßen ×1.9 |
| 2 | Nordostküste | Küste | L7 · 315.000 Geld | — | 3.361 | Nahrung ×1.2, Stein ×1.2 | Straßen ×1.15 |
| 3 | Südterrassen | Hügelland | L6 · 215.000 Geld | — | 2.955 | Stein ×1.3, Nahrung ×1.15 | Straßen ×1.25 |
| 4 | Südplateau | Ebene | L9 · 400.000 Geld | — | 4.663 | Nahrung ×1.3 | — |
| 5 | Flussgarten | Flusstal | L10 · 655.000 Geld | — | 3.889 | Nahrung ×1.3, Wasser ×1.25 | — |
| 6 | Ostebene | Ebene | L12 · 810.000 Geld | — | 4.178 | Nahrung ×1.2, Energie ×1.15 | — |
| 7 | Westweiden | Ebene | L3 · 90.000 Geld | — | 2.955 | Nahrung ×1.25 | — |
| 8 | Nordinsel | Vorgelagerte Insel | L18 · 2.775.000 Geld | — | 794 | Stein ×1.4, Nahrung ×1.15 | Straßen ×1.4 |
| 9 | Sonneninsel | Küste | L16 · 1.495.000 Geld | — | 1.098 | Energie ×1.35, Nahrung ×1.1, Wasser ×0.85 | Straßen ×1.3 |
| 10 | Ostforst | Wald | L14 · 1.130.000 Geld | — | 1.636 | Holz ×1.6 | Straßen ×1.2 |
| 11 | Südforst | Wald | L11 · 545.000 Geld | — | 1.676 | Holz ×1.55 | Straßen ×1.2 |
| 12 | Nordwald | Wald | L3 · 90.000 Geld | — | 1.644 | Holz ×1.45 | — |
| 13 | Zentralland | Zentrum | L1 · 0 Geld | — | 1.400 | — | — |

**Produktion** = Multiplikatoren auf den Gebäude-Output in dieser Region (ab A4 wirksam). **Nachteil** = Malus (z. B. teurere Straßen im Gebirge). Neutral (Startregion) hat bewusst beides nicht.
