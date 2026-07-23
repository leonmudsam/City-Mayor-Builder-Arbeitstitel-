// Region-Definitionen der final verdichteten Insel (§ Final World Compaction 8.1).
//
// Aus 40 kleinteiligen Landschaften sind EINE zentrale Startregion und ZWÖLF
// bedeutende Freischaltungen geworden. Geometrie, Bebaubarkeit sowie Land- und
// Seenachbarschaft stammen ausschließlich aus dem deterministischen Bake
// (`tools/bakeWorld.mjs`); diese Config benennt die Landschaften und definiert
// Progression, Kosten und Charakter.
//
// Die Quellinsel ist ein Archipel: Nur fünf Regionen hängen über Land zusammen.
// Die übrigen werden über eine schmale Wasserstraße erschlossen und verlangen
// dafür einen echten Hafen in einer bereits erschlossenen Region
// (`requiresHarbor`). Das ist kein neues System — es nutzt die vorhandenen
// Gebäude `dock_small`/`river_port` und die gebackene Seenachbarschaft.
//
// Freischaltreihenfolge (L = über Land, S = über See):
//   13 Zentralland (Start, 820 Bauflächen)
//   ├─ L3  10 Nordwald      (L)  ⟵ eine der beiden ist die KOSTENLOSE Erweiterung
//   ├─ L3   7 Westweiden    (L)  ⟵ die andere bleibt reguläre Kaufoption
//   ├─ L6   3 Südterrassen  (L über 7)
//   ├─ L7   2 Nordostküste  (L über 10)
//   ├─ L9   4 Südplateau    (S über 3)   — erster Hafen-Meilenstein
//   ├─ L10  5 Flussgarten   (L über 4)
//   ├─ L11 12 Südforst      (L über 5)   ⟵ Wahl
//   ├─ L12  6 Ostebene      (L über 5)   ⟵ Wahl
//   ├─ L14 11 Ostforst      (L über 6)
//   ├─ L16  9 Sonneninsel   (S)          ⟵ Wahl
//   ├─ L18  8 Nordinsel     (S)          ⟵ Wahl
//   └─ L20  1 Kronengebirge (S)          — Endgame
//
// Die Kosten folgen dem dokumentierten Faktormodell in `regionCost.ts`
// (§8 Regionswert) und werden dort gegen die Config getestet — es sind
// ausdrücklich keine frei gegriffenen Fantasiewerte.

import type { RegionDef } from './types.ts';

export const regionsConfig: RegionDef[] = [
  {
    id: 13,
    nameKey: 'region.r13',
    biome: 'zentrum',
    unlockable: true,
    unlockLevel: 1,
    unlockCost: 0,
    buildableTiles: 820,
  },
  {
    id: 10,
    nameKey: 'region.r10',
    biome: 'wald',
    unlockable: true,
    unlockLevel: 3,
    unlockCost: 95_000,
    buildableTiles: 2224,
    productionModifiers: { wood: 1.45 },
  },
  {
    id: 7,
    nameKey: 'region.r7',
    biome: 'ebene',
    unlockable: true,
    unlockLevel: 3,
    unlockCost: 90_000,
    buildableTiles: 2955,
    productionModifiers: { food: 1.25 },
  },
  {
    id: 3,
    nameKey: 'region.r3',
    biome: 'huegel',
    unlockable: true,
    unlockLevel: 6,
    unlockCost: 215_000,
    buildableTiles: 2955,
    productionModifiers: { stone: 1.3, food: 1.15 },
    roadCostFactor: 1.25,
  },
  {
    id: 2,
    nameKey: 'region.r2',
    biome: 'kueste',
    unlockable: true,
    unlockLevel: 7,
    unlockCost: 315_000,
    buildableTiles: 3361,
    productionModifiers: { food: 1.2, stone: 1.2 },
    roadCostFactor: 1.15,
  },
  {
    id: 4,
    nameKey: 'region.r4',
    biome: 'ebene',
    unlockable: true,
    unlockLevel: 9,
    unlockCost: 400_000,
    buildableTiles: 4663,
    productionModifiers: { food: 1.3 },
    requiresHarbor: true,
  },
  {
    id: 5,
    nameKey: 'region.r5',
    biome: 'flusstal',
    unlockable: true,
    unlockLevel: 10,
    unlockCost: 655_000,
    buildableTiles: 3889,
    productionModifiers: { food: 1.3, water: 1.25 },
  },
  {
    id: 12,
    nameKey: 'region.r12',
    biome: 'wald',
    unlockable: true,
    unlockLevel: 11,
    unlockCost: 545_000,
    buildableTiles: 1676,
    productionModifiers: { wood: 1.55 },
    roadCostFactor: 1.2,
  },
  {
    id: 6,
    nameKey: 'region.r6',
    biome: 'ebene',
    unlockable: true,
    unlockLevel: 12,
    unlockCost: 810_000,
    buildableTiles: 4178,
    productionModifiers: { food: 1.2, energy: 1.15 },
  },
  {
    id: 11,
    nameKey: 'region.r11',
    biome: 'wald',
    unlockable: true,
    unlockLevel: 14,
    unlockCost: 1_130_000,
    buildableTiles: 1636,
    productionModifiers: { wood: 1.6 },
    roadCostFactor: 1.2,
  },
  {
    id: 9,
    nameKey: 'region.r9',
    biome: 'kueste',
    unlockable: true,
    unlockLevel: 16,
    unlockCost: 1_495_000,
    buildableTiles: 1098,
    productionModifiers: { energy: 1.35, food: 1.1, water: 0.85 },
    roadCostFactor: 1.3,
    requiresHarbor: true,
  },
  {
    id: 8,
    nameKey: 'region.r8',
    biome: 'insel',
    unlockable: true,
    unlockLevel: 18,
    unlockCost: 2_775_000,
    buildableTiles: 794,
    productionModifiers: { stone: 1.4, food: 1.15 },
    roadCostFactor: 1.4,
    requiresHarbor: true,
  },
  {
    id: 1,
    nameKey: 'region.r1',
    biome: 'gebirge',
    unlockable: true,
    unlockLevel: 20,
    unlockCost: 6_690_000,
    buildableTiles: 3833,
    productionModifiers: { stone: 1.9, energy: 1.2, food: 0.7 },
    roadCostFactor: 1.9,
    requiresHarbor: true,
  },
];
