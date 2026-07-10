import type { GameConfig } from '../config/index.ts';
import type { GameState, NeedId, ResourceId } from '../types.ts';
import { centerOf, chebyshev, effectiveEffects } from '../buildings/effects.ts';
import { locationBonusPct } from '../buildings/location.ts';
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
  /**
   * 0..1 housing-weighted coverage per need with radius-based sources
   * (water via wells, leisure via parks). Needs without radius sources are 1.
   */
  needCoverage: Record<NeedId, number>;
  hasFoodDistribution: boolean;
  /** Buildings inside a fire-station radius. */
  fireProtected: Set<string>;
  roadNetwork: Set<string>;
  /** Location bonus percent per producing building (terrain-dependent). */
  productionBonus: Record<string, number>;
  /** Environment score per residential building (ambience auras; zoning). */
  ambience: Record<string, number>;
  /** Housing-weighted average ambience across the city (drives happiness). */
  avgAmbience: number;
  /** Gross production per minute per resource (active buildings, incl. bonus). */
  productionPerMin: Record<ResourceId, number>;
}

interface RadiusSource {
  cx: number;
  cy: number;
  radius: number;
}

export function recomputeDerived(state: GameState, config: GameConfig): Derived {
  const storageCaps: Record<ResourceId, number> = { money: Number.POSITIVE_INFINITY, wood: 0, stone: 0, food: 0 };
  const capacity: Record<NeedId, number> = { housing: 0, water: 0, food: 0, work: 0, leisure: 0 };
  const productionPerMin: Record<ResourceId, number> = { money: 0, wood: 0, stone: 0, food: 0 };
  const productionBonus: Record<string, number> = {};
  let hasFoodDistribution = false;

  const coverageSources: Partial<Record<NeedId, RadiusSource[]>> = {};
  const ambienceSources: { cx: number; cy: number; radius: number; amount: number }[] = [];
  const fireStations: RadiusSource[] = [];
  const residential: { id: string; cx: number; cy: number; housing: number }[] = [];

  const addCoverageSource = (need: NeedId, source: RadiusSource): void => {
    (coverageSources[need] ??= []).push(source);
  };

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
          if (eff.radius !== undefined) addCoverageSource(eff.need, { cx, cy, radius: eff.radius });
          break;
        case 'jobs':
          capacity.work += eff.amount;
          break;
        case 'coverage':
          addCoverageSource(eff.need, { cx, cy, radius: eff.radius });
          break;
        case 'distribution':
          if (eff.need === 'food') hasFoodDistribution = true;
          break;
        case 'protection':
          fireStations.push({ cx, cy, radius: eff.radius });
          break;
        case 'ambience':
          ambienceSources.push({ cx, cy, radius: eff.radius, amount: eff.amount });
          break;
        case 'produce': {
          const bonus = locationBonusPct(state, def, b.x, b.y);
          if (bonus > 0) productionBonus[b.id] = bonus;
          productionPerMin[eff.resource] += eff.perMinute * (1 + bonus / 100);
          break;
        }
      }
    }
    if (housingHere > 0) residential.push({ id: b.id, cx, cy, housing: housingHere });
  }

  // Housing-weighted coverage per radius-served need + ambience per home.
  // Coverage-kind needs always get an entry so "no parks yet" reads as 0.
  for (const need of config.needs) {
    if (need.kind === 'coverage') coverageSources[need.id] ??= [];
  }
  const needCoverage: Record<NeedId, number> = { housing: 1, water: 1, food: 1, work: 1, leisure: 1 };
  const totalHousing = residential.reduce((sum, r) => sum + r.housing, 0);
  const ambience: Record<string, number> = {};
  for (const [need, sources] of Object.entries(coverageSources) as [NeedId, RadiusSource[]][]) {
    let covered = 0;
    for (const r of residential) {
      if (sources.some((s) => chebyshev(r.cx, r.cy, s.cx, s.cy) <= s.radius)) covered += r.housing;
    }
    needCoverage[need] = totalHousing > 0 ? covered / totalHousing : 0;
  }
  let ambienceWeighted = 0;
  for (const r of residential) {
    ambience[r.id] = ambienceSources.reduce(
      (sum, s) => (chebyshev(r.cx, r.cy, s.cx, s.cy) <= s.radius ? sum + s.amount : sum),
      0,
    );
    ambienceWeighted += ambience[r.id]! * r.housing;
  }
  const avgAmbience = totalHousing > 0 ? ambienceWeighted / totalHousing : 0;

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
    needCoverage,
    hasFoodDistribution,
    fireProtected,
    roadNetwork: computeRoadNetwork(state, config),
    productionBonus,
    ambience,
    avgAmbience,
    productionPerMin,
  };
}
