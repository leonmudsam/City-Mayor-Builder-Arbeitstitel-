// Region-Definitionen der dritt-verdichteten Insel mit weichem Uferprofil
// (§ Active Resource Loops 10.0 §22, R7/R8 — Final World Compaction + flacher
// Uferübergang).
//
// Die dritte horizontale Verdichtung (X/Z 0,84 zusätzlich, ~−44 % Fläche) plus die
// angehobene Wasserlinie und der breitere, flachere Strandsaum (Nutzerwunsch:
// Hafen-/Wassergebäude-tauglicher Uferübergang) ergeben EINE zentrale Startregion
// und ZWÖLF Freischaltungen. Geometrie, Bebaubarkeit sowie Land- und
// Seenachbarschaft stammen ausschließlich aus dem deterministischen Bake
// (`tools/bakeWorld.mjs` → `world/islandRegions.gen.ts`); diese Config benennt die
// Landschaften und definiert Progression, Kosten und Charakter.
//
// Die Insel ist ein ausgeprägter Archipel: Nur {9,3,8,11,7,13} hängen über Land
// zusammen (Startkomponente). Die Südkomponente {2,5,4} und die Einzelinseln
// {1,6,10,12} werden über eine schmale Wasserstraße erschlossen und verlangen dafür
// einen betriebsbereiten Hafen in einer bereits erschlossenen Region
// (`requiresHarbor`). Das ist kein neues System — es nutzt die vorhandenen
// Hafengebäude und die gebackene Seenachbarschaft. Der Unlock wird rein
// geografisch in `regionUnlockBlocker` erzwungen; `requiresHarbor` ist das ehrliche
// Anzeige-Flag dazu (`isRegionHarborDependent`).
//
// § 10.0-Startregion: 9 „Zentralland" (1.668 Bauflächen, echter Küstenzugang, sehr
// flach). Direkte Landnachbarn sind Südterrassen (3) und Westweiden (8). Ab Level 3
// ist die erste Erweiterung gratis (§6) — angeboten wird der L3-Nachbar 3.
// Freischaltreihenfolge (L = über Land, S = über See):
//   9  Zentralland    (Start, 1.668 Bauflächen)
//   ├─ L3  3  Südterrassen  (L)  ⟵ kostenlose Erstwahl (§6)
//   ├─ L5  8  Westweiden    (L)  — Land-Knoten (drei Landnachbarn 9/11/13)
//   ├─ L6  13 Binnenau      (L über 8) — küstenlose Gründungs-Pocket
//   ├─ L7  11 Zentralwald   (L über 8) — Holz
//   ├─ L9  7  Nordgrat      (L über 11) — Gebirge/Stein, bauflächenarm
//   ├─ L10 6  Mittelau      (S)          — Hafen-Meilenstein, große Ebene
//   ├─ L11 10 Nordkap       (S)          — kleine Nordinsel
//   ├─ L12 2  Südaue        (S)          — größte Region (6.077), öffnet {2,5,4}
//   ├─ L14 5  Südforst      (L über 2)   — Holz
//   ├─ L16 4  Ostfelder     (L über 5)
//   ├─ L17 12 Sonneninsel   (S)          — Einzelinsel im Osten
//   └─ L20 1  Kronengebirge (S)          — Endgame (Gebirge/Stein-Krone)
//
// Die Kosten folgen dem dokumentierten Faktormodell in `regions/regionCost.ts`
// (§8 Regionswert) und werden dort gegen die Config getestet — es sind
// ausdrücklich keine frei gegriffenen Fantasiewerte, sondern der auf 5.000er
// gerundete Richtwert je Region.

import type { RegionDef } from './types.ts';

export const regionsConfig: RegionDef[] = [
  {
    // § 10.0 Startregion (Bake wählt & validiert sie): zentral, sehr flach
    // (ΔH 0,36), 1.668 Bauflächen, 136 Küstenkanten (echter Wasserzugang).
    id: 9,
    nameKey: 'region.r9',
    biome: 'zentrum',
    unlockable: true,
    unlockLevel: 1,
    unlockCost: 0,
    buildableTiles: 1668,
  },
  {
    // Kostenlose Erstwahl ab L3 (§6): direkter Landnachbar der Startregion.
    // Hügeliges Südland mit Stein- und etwas Nahrungscharakter.
    id: 3,
    nameKey: 'region.r3',
    biome: 'huegel',
    unlockable: true,
    unlockLevel: 3,
    unlockCost: 100_000,
    buildableTiles: 2266,
    productionModifiers: { stone: 1.3, food: 1.15 },
    roadCostFactor: 1.25,
  },
  {
    // Zweiter Startnachbar und zentraler Land-Knoten (drei Landnachbarn 9/11/13).
    id: 8,
    nameKey: 'region.r8',
    biome: 'ebene',
    unlockable: true,
    unlockLevel: 5,
    unlockCost: 120_000,
    buildableTiles: 1074,
    productionModifiers: { food: 1.25 },
  },
  {
    // Küstenlose Gründungs-Pocket (0 Küstenkanten) über Westweiden (8).
    id: 13,
    nameKey: 'region.r13',
    biome: 'ebene',
    unlockable: true,
    unlockLevel: 6,
    unlockCost: 140_000,
    buildableTiles: 1400,
    productionModifiers: { wood: 1.2 },
  },
  {
    // Zentraler Wald über Westweiden (8): die erste über Land erreichbare
    // Holzregion (+45 % Holz). Wichtig für den Sägewerk-Nachschub.
    id: 11,
    nameKey: 'region.r11',
    biome: 'wald',
    unlockable: true,
    unlockLevel: 7,
    unlockCost: 215_000,
    buildableTiles: 1413,
    productionModifiers: { wood: 1.45 },
    roadCostFactor: 1.1,
  },
  {
    // Nördlicher Gebirgsgrat über Zentralwald (11): bauflächenarm (561), aber
    // Stein/Energie. § 10.0: aggressive Verdichtung macht Gebirge bauflächenlean —
    // ihr Wert liegt in Rohstoff und Strategie.
    id: 7,
    nameKey: 'region.r7',
    biome: 'gebirge',
    unlockable: true,
    unlockLevel: 9,
    unlockCost: 340_000,
    buildableTiles: 561,
    productionModifiers: { stone: 1.5, energy: 1.1, food: 0.8 },
    roadCostFactor: 1.5,
  },
  {
    // Erster See-Meilenstein: große zentrale Ebene, nur über See erreichbar.
    id: 6,
    nameKey: 'region.r6',
    biome: 'ebene',
    unlockable: true,
    unlockLevel: 10,
    unlockCost: 415_000,
    buildableTiles: 2179,
    productionModifiers: { food: 1.3 },
    requiresHarbor: true,
  },
  {
    // Kleine Nordinsel (kein Landnachbar) — nur über See, zwingend hafenpflichtig.
    id: 10,
    nameKey: 'region.r10',
    biome: 'insel',
    unlockable: true,
    unlockLevel: 11,
    unlockCost: 455_000,
    buildableTiles: 407,
    productionModifiers: { energy: 1.3, food: 1.05, water: 0.85 },
    roadCostFactor: 1.3,
    requiresHarbor: true,
  },
  {
    // Größte Region der Insel (6.077 Bauflächen, 499 Küstenkanten): die südliche
    // Kornküste. Öffnet über See die Südkomponente {2,5,4}. Hafenpflichtig.
    id: 2,
    nameKey: 'region.r2',
    biome: 'kueste',
    unlockable: true,
    unlockLevel: 12,
    unlockCost: 1_050_000,
    buildableTiles: 6077,
    productionModifiers: { food: 1.3 },
    requiresHarbor: true,
  },
  {
    // Waldregion über Südaue (2): +50 % Holz. Zweite große Holzquelle im Spätspiel.
    id: 5,
    nameKey: 'region.r5',
    biome: 'wald',
    unlockable: true,
    unlockLevel: 14,
    unlockCost: 1_190_000,
    buildableTiles: 2497,
    productionModifiers: { wood: 1.5 },
    roadCostFactor: 1.1,
  },
  {
    // Weite Ostfelder über Südforst (5): fruchtbare Ebene (+30 % Nahrung).
    id: 4,
    nameKey: 'region.r4',
    biome: 'ebene',
    unlockable: true,
    unlockLevel: 16,
    unlockCost: 1_710_000,
    buildableTiles: 2244,
    productionModifiers: { food: 1.3 },
  },
  {
    // Abgelegene Einzelinsel im Osten (kein Landnachbar) — nur über See,
    // zwingend hafenpflichtig. Energie/Sonne, wenig Wasser.
    id: 12,
    nameKey: 'region.r12',
    biome: 'insel',
    unlockable: true,
    unlockLevel: 17,
    unlockCost: 2_010_000,
    buildableTiles: 830,
    productionModifiers: { energy: 1.35, food: 1.1, water: 0.85 },
    roadCostFactor: 1.3,
    requiresHarbor: true,
  },
  {
    // Endgame-Region (§7.3): das große Massiv — Stein-Krone (+90 % Stein), teure
    // Straßen, karge Nahrung. Kein Landnachbar, nur über See erreichbar.
    id: 1,
    nameKey: 'region.r1',
    biome: 'gebirge',
    unlockable: true,
    unlockLevel: 20,
    unlockCost: 5_980_000,
    buildableTiles: 2476,
    productionModifiers: { stone: 1.9, energy: 1.2, food: 0.7 },
    roadCostFactor: 1.9,
    requiresHarbor: true,
  },
];
