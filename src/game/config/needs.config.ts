import type { NeedDef } from './types.ts';

// Weights are normalized across the needs that are active at the current
// level, so happiness is always on a 0–100 scale.
export const needsConfig: NeedDef[] = [
  { id: 'housing', nameKey: 'need.housing', unlockLevel: 1, weight: 20, kind: 'capacity', demandPerCapita: 1 },
  // Water demand is driven entirely by the homes themselves (their `demand`
  // effect), so it scales with house type & upgrade level rather than with a
  // flat per-head number (§3/§7). demandPerCapita 0 avoids double-counting.
  { id: 'water', nameKey: 'need.water', unlockLevel: 3, weight: 25, kind: 'capacity', demandPerCapita: 0 },
  // consumption: demandPerCapita is units per citizen per MINUTE. Raised (§11) so
  // food is a real — but fair — bottleneck: a growing city genuinely needs more
  // farms (or farm upgrades) and a good fertile-land spot, rather than one farm
  // quietly feeding the whole map. Still gentle in absolute terms early on, so it
  // only starts to bite once the population climbs.
  // Per-capita, per-minute. Divided by the ×20 population scale (§9) and then
  // held ~40 % tighter than a neutral rescale (0.05/20 = 0.0025 → 0.0035) so
  // food stays a real — but fair — bottleneck: a growing city genuinely needs
  // more farms, farm upgrades and a fertile-land spot (§8/§11).
  { id: 'food', nameKey: 'need.food', unlockLevel: 4, weight: 25, kind: 'consumption', demandPerCapita: 0.0035, consumesResource: 'food' },
  { id: 'work', nameKey: 'need.work', unlockLevel: 6, weight: 15, kind: 'capacity', demandPerCapita: 0.025 },
  { id: 'leisure', nameKey: 'need.leisure', unlockLevel: 7, weight: 15, kind: 'coverage', demandPerCapita: 1 },
  // Energy (MVP 2): a city-wide capacity need with no radius — power plants feed
  // the whole grid. Demand comes entirely from the buildings themselves (their
  // `demand` effect: industry, services, dense housing draw power), so it scales
  // with what you build, not with raw population. Activating at L11 is the new
  // "level-up problem" motor (§4): the grid suddenly needs a plant.
  { id: 'energy', nameKey: 'need.energy', unlockLevel: 11, weight: 12, kind: 'capacity', demandPerCapita: 0 },
  // Emergency services (MVP 2): radius-based coverage needs, exactly like leisure
  // — a police station / hospital covers the homes in its range. Reuses the fire
  // station's coverage machinery, no special-case code (§ "Feuerwehr-Muster auf
  // Polizei/Krankenhaus übertragen").
  { id: 'safety', nameKey: 'need.safety', unlockLevel: 13, weight: 12, kind: 'coverage', demandPerCapita: 1 },
  { id: 'health', nameKey: 'need.health', unlockLevel: 14, weight: 12, kind: 'coverage', demandPerCapita: 1 },
  // Drinking water (MVP 2 supply chain): a consumption need like food, fed from
  // the `freshwater` product a riverside waterworks makes and a supermarket
  // distributes. Same generic consumption path — no bespoke code.
  { id: 'freshwater', nameKey: 'need.freshwater', unlockLevel: 12, weight: 12, kind: 'consumption', demandPerCapita: 0.0028, consumesResource: 'freshwater' },
];
