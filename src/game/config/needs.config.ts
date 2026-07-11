import type { NeedDef } from './types.ts';

// Weights are normalized across the needs that are active at the current
// level, so happiness is always on a 0–100 scale.
export const needsConfig: NeedDef[] = [
  { id: 'housing', nameKey: 'need.housing', unlockLevel: 1, weight: 20, kind: 'capacity', demandPerCapita: 1 },
  // Water demand is driven entirely by the homes themselves (their `demand`
  // effect), so it scales with house type & upgrade level rather than with a
  // flat per-head number (§3/§7). demandPerCapita 0 avoids double-counting.
  { id: 'water', nameKey: 'need.water', unlockLevel: 3, weight: 25, kind: 'capacity', demandPerCapita: 0 },
  // consumption: demandPerCapita is units per citizen per MINUTE.
  { id: 'food', nameKey: 'need.food', unlockLevel: 4, weight: 25, kind: 'consumption', demandPerCapita: 0.05 },
  { id: 'work', nameKey: 'need.work', unlockLevel: 6, weight: 15, kind: 'capacity', demandPerCapita: 0.5 },
  { id: 'leisure', nameKey: 'need.leisure', unlockLevel: 7, weight: 15, kind: 'coverage', demandPerCapita: 1 },
];
