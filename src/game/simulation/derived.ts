import type { GameConfig } from '../config/index.ts';
import type { GameState, NeedId, ResourceId } from '../types.ts';
import { centerOf, chebyshev, effectiveEffects, isContributing } from '../buildings/effects.ts';
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
  /**
   * Servable residents summed across a coverage need's capacitated sources
   * (police/hospital). 0 = the need's sources are uncapped (parks) — coverage is
   * limited by radius alone. Lets a coverage need be gated by both reach *and*
   * capacity without any per-service special-casing (§ radius vs. capacity).
   */
  coverageCapacity: Record<NeedId, number>;
  /** Extra demand per need from buildings themselves (homes' water, §3/§4). */
  extraDemand: Record<NeedId, number>;
  /**
   * 0..1 housing-weighted share of homes reached by a distribution service
   * (market → food). Uncovered homes fall back to the no-distribution cap (§8).
   */
  distributionCoverage: Record<NeedId, number>;
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
  /** Total households across all active homes (§6). */
  housingUnits: number;
  /**
   * Base revenue per minute by source, before happiness & staffing factors
   * (§5). Residential income is per-capita (see income.ts), so it isn't here.
   */
  revenueBase: { commercial: number; industrial: number };
  /** Ongoing running cost per minute per resource from active buildings. */
  upkeep: Record<ResourceId, number>;
}

interface RadiusSource {
  cx: number;
  cy: number;
  radius: number;
}

export function recomputeDerived(state: GameState, config: GameConfig): Derived {
  const storageCaps: Record<ResourceId, number> = { money: Number.POSITIVE_INFINITY, wood: 0, stone: 0, food: 0, freshwater: 0 };
  const capacity: Record<NeedId, number> = { housing: 0, water: 0, food: 0, work: 0, leisure: 0, energy: 0, safety: 0, health: 0, freshwater: 0 };
  const productionPerMin: Record<ResourceId, number> = { money: 0, wood: 0, stone: 0, food: 0, freshwater: 0 };
  const productionBonus: Record<string, number> = {};
  const extraDemand: Record<NeedId, number> = { housing: 0, water: 0, food: 0, work: 0, leisure: 0, energy: 0, safety: 0, health: 0, freshwater: 0 };
  const coverageCapacity: Record<NeedId, number> = { housing: 0, water: 0, food: 0, work: 0, leisure: 0, energy: 0, safety: 0, health: 0, freshwater: 0 };
  const revenueBase = { commercial: 0, industrial: 0 };
  const upkeep: Record<ResourceId, number> = { money: 0, wood: 0, stone: 0, food: 0, freshwater: 0 };
  let housingUnits = 0;

  const coverageSources: Partial<Record<NeedId, RadiusSource[]>> = {};
  const distributionSources: Partial<Record<NeedId, RadiusSource[]>> = {};
  const ambienceSources: { cx: number; cy: number; radius: number; amount: number }[] = [];
  const fireStations: RadiusSource[] = [];
  const residential: { id: string; cx: number; cy: number; housing: number; sensitivity: number }[] = [];
  // Producers are resolved in a second pass so logistics hubs boost them
  // regardless of iteration order (the depot may sit anywhere in the map).
  const logisticsSources: { cx: number; cy: number; radius: number; boostPct: number }[] = [];
  const producers: { id: string; resource: ResourceId; perMinute: number; cx: number; cy: number; terrainBonus: number }[] = [];

  const addCoverageSource = (need: NeedId, source: RadiusSource): void => {
    (coverageSources[need] ??= []).push(source);
  };

  for (const b of Object.values(state.buildings)) {
    // Active buildings AND those mid-upgrade contribute their *current* stage's
    // effects — an upgrade never zeroes a building out (§2). effectiveEffects
    // reads `upgradeLevel` (the completed stage), so the old effects stay live
    // until the upgrade actually finishes.
    if (!isContributing(b)) continue;
    const def = config.buildings.get(b.defId);
    if (!def) continue;
    const { cx, cy } = centerOf(def, b);
    let housingHere = 0;
    let sensitivityHere = 1;
    for (const eff of effectiveEffects(def, b.upgradeLevel)) {
      switch (eff.type) {
        case 'storage':
          storageCaps[eff.resource] += eff.amount;
          break;
        case 'capacity':
          capacity[eff.need] += eff.amount;
          if (eff.radius !== undefined) addCoverageSource(eff.need, { cx, cy, radius: eff.radius });
          break;
        case 'housing': {
          // Population scale (§9): each stated household holds populationScale×
          // its per-unit size, so a Level-11 city reaches ~100k residents while
          // the config keeps small, readable household numbers. Per-capita
          // demands/taxes are divided by the same scale (balancing.config) so
          // the economy stays balanced at the larger head count.
          const cap = eff.units * eff.maxResidentsPerUnit * config.balancing.populationScale;
          capacity.housing += cap;
          housingHere += cap;
          housingUnits += eff.units;
          sensitivityHere = eff.ambienceSensitivity ?? 1;
          break;
        }
        case 'revenue':
          revenueBase[eff.category] += eff.perMinute;
          break;
        case 'upkeep':
          upkeep[eff.resource] += eff.perMinute;
          break;
        case 'logistics':
          logisticsSources.push({ cx, cy, radius: eff.radius, boostPct: eff.boostPct });
          break;
        case 'jobs':
          capacity.work += eff.amount;
          break;
        case 'coverage':
          addCoverageSource(eff.need, { cx, cy, radius: eff.radius });
          // Served residents scale with the population scale (§9) so a station's
          // reach keeps pace with the larger head count it now faces.
          if (eff.capacity) coverageCapacity[eff.need] += eff.capacity * config.balancing.populationScale;
          break;
        case 'demand':
          extraDemand[eff.need] += eff.amount;
          break;
        case 'distribution':
          (distributionSources[eff.need] ??= []).push({ cx, cy, radius: eff.radius });
          break;
        case 'protection':
          fireStations.push({ cx, cy, radius: eff.radius });
          break;
        case 'ambience':
          ambienceSources.push({ cx, cy, radius: eff.radius, amount: eff.amount });
          break;
        case 'produce':
          producers.push({ id: b.id, resource: eff.resource, perMinute: eff.perMinute, cx, cy, terrainBonus: locationBonusPct(state, def, b.x, b.y) });
          break;
      }
    }
    if (housingHere > 0) residential.push({ id: b.id, cx, cy, housing: housingHere, sensitivity: sensitivityHere });
  }

  // Second pass: production output = base × (terrain bonus + logistics boost).
  // A depot in range lifts every producer it reaches; the tick reads the same
  // productionBonus per building, so no tick change is needed.
  for (const p of producers) {
    let bonus = p.terrainBonus;
    for (const s of logisticsSources) {
      if (chebyshev(p.cx, p.cy, s.cx, s.cy) <= s.radius) bonus += s.boostPct;
    }
    if (bonus > 0) productionBonus[p.id] = bonus;
    productionPerMin[p.resource] += p.perMinute * (1 + bonus / 100);
  }

  // Housing-weighted coverage per radius-served need + ambience per home.
  // Coverage-kind needs always get an entry so "no parks yet" reads as 0.
  for (const need of config.needs) {
    if (need.kind === 'coverage') coverageSources[need.id] ??= [];
  }
  const needCoverage: Record<NeedId, number> = { housing: 1, water: 1, food: 1, work: 1, leisure: 1, energy: 1, safety: 1, health: 1, freshwater: 1 };
  const distributionCoverage: Record<NeedId, number> = { housing: 0, water: 0, food: 0, work: 0, leisure: 0, energy: 0, safety: 0, health: 0, freshwater: 0 };
  const totalHousing = residential.reduce((sum, r) => sum + r.housing, 0);
  const ambience: Record<string, number> = {};
  // Housing-weighted share of homes reached by any of a need's radius sources.
  const coveredShare = (sources: RadiusSource[]): number => {
    if (totalHousing <= 0) return 0;
    let covered = 0;
    for (const r of residential) {
      if (sources.some((s) => chebyshev(r.cx, r.cy, s.cx, s.cy) <= s.radius)) covered += r.housing;
    }
    return covered / totalHousing;
  };
  for (const [need, sources] of Object.entries(coverageSources) as [NeedId, RadiusSource[]][]) {
    needCoverage[need] = coveredShare(sources);
  }
  for (const [need, sources] of Object.entries(distributionSources) as [NeedId, RadiusSource[]][]) {
    distributionCoverage[need] = coveredShare(sources);
  }
  let ambienceWeighted = 0;
  for (const r of residential) {
    // Raw environmental score (integer) — shown as-is in the building sheet.
    const raw = ambienceSources.reduce(
      (sum, s) => (chebyshev(r.cx, r.cy, s.cx, s.cy) <= s.radius ? sum + s.amount : sum),
      0,
    );
    ambience[r.id] = raw;
    // Suburbs weigh their surroundings more heavily than dense blocks (§7).
    ambienceWeighted += raw * r.sensitivity * r.housing;
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
    coverageCapacity,
    extraDemand,
    distributionCoverage,
    fireProtected,
    roadNetwork: computeRoadNetwork(state, config),
    productionBonus,
    ambience,
    avgAmbience,
    productionPerMin,
    housingUnits,
    revenueBase,
    upkeep,
  };
}
