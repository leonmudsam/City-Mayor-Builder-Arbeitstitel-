import type { GameConfig } from '../config/index.ts';
import type { Derived } from '../simulation/derived.ts';
import type { BuildingInstance, GameState } from '../types.ts';
import { canAfford } from '../economy/economyService.ts';
import { effectiveEffects } from './effects.ts';
import { locationBonusPct } from './location.ts';
import { buildingInfrastructureStatus } from '../infrastructure/buildingInfrastructure.ts';

/**
 * A single legible statement about a building's current situation — the shared
 * source of truth for the on-map markers AND the "what's good / what's missing"
 * section of the building sheet (§2/§4/§12). Pure display logic over existing
 * derived data: no gameplay is changed here, we only *read* the simulation and
 * name what it means so the UI (bubbles, badges, sheet lines) and the game stay
 * in lockstep.
 */
export type DiagnosisCode =
  // Problems (red bubble / warning line):
  | 'no_road'
  | 'no_waterway'
  | 'partial_infrastructure'
  | 'paused'
  | 'storage_full'
  | 'no_movein'
  // Benefits (green/amber badge / positive line):
  | 'upgrade_ready'
  | 'location_bonus'
  | 'road_ok'
  | 'water_ok';

export interface Diagnosis {
  code: DiagnosisCode;
  kind: 'problem' | 'benefit';
  /** Interpolation params for the i18n string (e.g. the bonus percent). */
  params?: Record<string, string | number>;
}

/**
 * All problems and benefits for a building, most-important first within each
 * group. Cheap to compute (O(effects)); the renderer calls it per building only
 * on structural changes, never per frame.
 */
export function buildingDiagnostics(
  state: GameState,
  config: GameConfig,
  derived: Derived,
  b: BuildingInstance,
): Diagnosis[] {
  const def = config.buildings.get(b.defId);
  if (!def) return [];
  const out: Diagnosis[] = [];
  const problem = (code: DiagnosisCode, params?: Record<string, string | number>): void => {
    out.push(params ? { code, kind: 'problem', params } : { code, kind: 'problem' });
  };
  const benefit = (code: DiagnosisCode, params?: Record<string, string | number>): void => {
    out.push(params ? { code, kind: 'benefit', params } : { code, kind: 'benefit' });
  };

  // --- Problems ---------------------------------------------------------------
  if (b.status === 'paused') problem('paused');
  const infrastructure = buildingInfrastructureStatus(state, config, derived.roadNetwork, b);
  const roadConnected = infrastructure.modes.road;
  if (infrastructure.problems.includes('no_road')) problem('no_road');
  if (infrastructure.problems.includes('no_waterway')) problem('no_waterway');
  if (infrastructure.status === 'water_only' || infrastructure.status === 'road_only') {
    problem('partial_infrastructure');
  }

  // A producer whose output resource is at storage cap is wasting production.
  for (const eff of effectiveEffects(def, b.upgradeLevel)) {
    if (eff.type !== 'produce') continue;
    const cap = derived.storageCaps[eff.resource] ?? Number.POSITIVE_INFINITY;
    if (cap > 0 && cap !== Number.POSITIVE_INFINITY && state.resources[eff.resource] >= cap) {
      problem('storage_full', { resource: eff.resource });
      break;
    }
  }

  // Residential: mirror the city-wide move-in block at the home the player
  // clicked (population is a city-wide figure, so this is the honest signal).
  const housesPeople = effectiveEffects(def, b.upgradeLevel).some((e) => e.type === 'housing');
  if (housesPeople && b.status === 'active') {
    const bal = config.balancing;
    const free = derived.capacity.housing - state.citizens.population;
    if (free > 0 && state.citizens.happiness < bal.growthHappinessThreshold) problem('no_movein');
  }

  // --- Benefits ---------------------------------------------------------------
  if (b.status === 'active') {
    const nextStage = def.upgrades?.[b.upgradeLevel];
    if (nextStage) {
      const levelOk = !nextStage.unlockLevel || state.level.current >= nextStage.unlockLevel;
      if (levelOk && canAfford(state, nextStage.cost)) benefit('upgrade_ready');
    }
    const bonus = derived.productionBonus[b.id] ?? locationBonusPct(state, def, b.x, b.y);
    if (bonus > 0) benefit('location_bonus', { pct: Math.round(bonus) });
    if (def.requiresRoad && roadConnected) benefit('road_ok');
    if (def.waterfront && infrastructure.modes.water) benefit('water_ok');
  }

  return out;
}

/**
 * The one marker to float above a building on the map (§4: "nicht zu viele
 * gleichzeitig"). A problem always wins over a benefit; a ready upgrade is the
 * only benefit worth a bubble (location bonus already has its own corner badge).
 */
export function primaryMarker(
  diagnoses: Diagnosis[],
): 'problem' | 'road_problem' | 'water_problem' | 'partial_problem' | 'upgrade' | undefined {
  if (diagnoses.some((d) => d.code === 'no_waterway')) return 'water_problem';
  if (diagnoses.some((d) => d.code === 'no_road')) return 'road_problem';
  if (diagnoses.some((d) => d.code === 'partial_infrastructure')) return 'partial_problem';
  if (diagnoses.some((d) => d.kind === 'problem')) return 'problem';
  if (diagnoses.some((d) => d.code === 'upgrade_ready')) return 'upgrade';
  return undefined;
}
