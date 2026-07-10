import type { GameConfig } from '../config/index.ts';
import type { GameState, NeedId, ResourceId } from '../types.ts';
import { centerOf, chebyshev, effectiveEffects } from '../buildings/effects.ts';
import { computeRoadNetwork } from '../map/world.ts';

/**
 * Values derived from the set of active buildings. Recomputed only on
 * structural changes (place/complete/demolish/upgrade/pause), never per tick —
 * this keeps the tick O(production buildings) even for huge cities (§8).
 */
export interface Derived {
  storageCaps: Record<ResourceId, number>;
  /** Static supply per capacity-need (housing, water, work→jobs). */
  capacity: Record<NeedId, number>;
  /** 0..1 share of housing capacity covered by leisure buildings. */
  leisureCoverage: number;
  hasFoodDistribution: boolean;
  /** Buildings inside a fire-station radius. */
  fireProtected: Set<string>;
  roadNetwork: Set<string>;
}

export function recomputeDerived(state: GameState, config: GameConfig): Derived {
  const storageCaps: Record<ResourceId, number> = { money: Number.POSITIVE_INFINITY, wood: 0, stone: 0, food: 0 };
  const capacity: Record<NeedId, number> = { housing: 0, water: 0, food: 0, work: 0, leisure: 0 };
  let hasFoodDistribution = false;

  const leisureSources: { cx: number; cy: number; radius: number }[] = [];
  const fireStations: { cx: number; cy: number; radius: number }[] = [];
  const residential: { id: string; cx: number; cy: number; housing: number }[] = [];

  for (const b of Object.values(state.buildings)) {
    if (b.status !== 'active') continue;
    const def = config.buildings.get(b.defId);
    if (!def) continue;
    const { cx, cy } = centerOf(def, b);
    let housingHere = 0;
    for (const eff of effectiveEffects(def, b.upgradeLevel)) {
      switch (eff.type) {
        case 'storage':
          storageCaps[eff.resource] += eff.amount;
          break;
        case 'capacity':
          capacity[eff.need] += eff.amount;
          if (eff.need === 'housing') housingHere += eff.amount;
          break;
        case 'jobs':
          capacity.work += eff.amount;
          break;
        case 'coverage':
          if (eff.need === 'leisure') leisureSources.push({ cx, cy, radius: eff.radius });
          break;
        case 'distribution':
          if (eff.need === 'food') hasFoodDistribution = true;
          break;
        case 'protection':
          fireStations.push({ cx, cy, radius: eff.radius });
          break;
        case 'produce':
          break;
      }
    }
    if (housingHere > 0) residential.push({ id: b.id, cx, cy, housing: housingHere });
  }

  let coveredHousing = 0;
  let totalHousing = 0;
  for (const r of residential) {
    totalHousing += r.housing;
    if (leisureSources.some((s) => chebyshev(r.cx, r.cy, s.cx, s.cy) <= s.radius)) coveredHousing += r.housing;
  }

  const fireProtected = new Set<string>();
  for (const b of Object.values(state.buildings)) {
    const def = config.buildings.get(b.defId);
    if (!def) continue;
    const { cx, cy } = centerOf(def, b);
    if (fireStations.some((s) => chebyshev(cx, cy, s.cx, s.cy) <= s.radius)) fireProtected.add(b.id);
  }

  return {
    storageCaps,
    capacity,
    leisureCoverage: totalHousing > 0 ? coveredHousing / totalHousing : 0,
    hasFoodDistribution,
    fireProtected,
    roadNetwork: computeRoadNetwork(state, config),
  };
}
