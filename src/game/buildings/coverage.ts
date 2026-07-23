import type { GameConfig } from '../config/index.ts';
import type { BuildingDef } from '../config/types.ts';
import type { GameState, NeedId } from '../types.ts';
import type { Derived } from '../simulation/derived.ts';
import { centerOf, chebyshev, effectiveEffects, isContributing } from './effects.ts';
import { buildingInfrastructureStatus, isInfrastructureOperational } from '../infrastructure/buildingInfrastructure.ts';

// A single, generic coverage-overlay system (§1). Any building that serves a
// radius — wells/pumps (water), parks (leisure), markets (food distribution),
// fire stations (protection), and every future service (police, health,
// education, transit, environment) — is described the same way here. The
// renderer only draws what this returns; no per-service special-casing.

export type CoverageState = 'source' | 'supplied' | 'partial' | 'redundant' | 'unsupplied';

/** Identifies a coverage type so all buildings of that type group together. */
export type CoverageGroup =
  | { kind: 'need'; need: NeedId }
  | { kind: 'hazard'; hazard: 'fire' };

export interface CoverageSourceView {
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
  /** The building the player clicked (highlighted differently). */
  selected: boolean;
}

export interface CoverageConsumerView {
  x: number;
  y: number;
  w: number;
  h: number;
  state: CoverageState;
}

export interface CoverageOverlay {
  group: CoverageGroup;
  /** i18n key naming the coverage type (need name or "Brandschutz"). */
  labelKey: string;
  /** Renderer palette key for the group's radius tint. */
  colorKey: string;
  sources: CoverageSourceView[];
  consumers: CoverageConsumerView[];
  /** City-wide supply < demand → in-range homes read as only "partial". */
  underCapacity: boolean;
  /**
   * For capacitated services (police/hospital): residents served vs. residents
   * in range, so the UI can show "Auslastung 12.000/8.000" and tell the player
   * whether reach or capacity is the bottleneck. Absent for uncapped coverage.
   */
  capacity?: { servable: number; used: number };
  /** Consumer tallies for the summary (§21): served / partial / unserved. */
  counts: { supplied: number; partial: number; unsupplied: number };
}

interface GroupMeta {
  labelKey: string;
  colorKey: string;
}

function groupMeta(group: CoverageGroup): GroupMeta {
  if (group.kind === 'hazard') return { labelKey: 'ui.coverage.fire', colorKey: 'protection' };
  const colorKey =
    group.need === 'water' || group.need === 'freshwater' ? 'water' : group.need === 'food' ? 'food' : 'leisure';
  return { labelKey: `need.${group.need}`, colorKey };
}

function sameGroup(a: CoverageGroup, b: CoverageGroup): boolean {
  return a.kind === 'hazard' && b.kind === 'hazard'
    ? a.hazard === b.hazard
    : a.kind === 'need' && b.kind === 'need' && a.need === b.need;
}

/** All radius sources a building projects, keyed by group. */
function sourcesOf(def: BuildingDef, upgradeLevel: number): { group: CoverageGroup; radius: number }[] {
  const out: { group: CoverageGroup; radius: number }[] = [];
  for (const eff of effectiveEffects(def, upgradeLevel)) {
    if (eff.type === 'capacity' && eff.radius !== undefined) out.push({ group: { kind: 'need', need: eff.need }, radius: eff.radius });
    else if (eff.type === 'coverage') out.push({ group: { kind: 'need', need: eff.need }, radius: eff.radius });
    else if (eff.type === 'distribution') out.push({ group: { kind: 'need', need: eff.need }, radius: eff.radius });
    else if (eff.type === 'protection') out.push({ group: { kind: 'hazard', hazard: eff.hazard }, radius: eff.radius });
  }
  return out;
}

/** Which buildings consume a coverage group (homes for needs, flammables for fire). */
function isConsumer(def: BuildingDef, group: CoverageGroup): boolean {
  if (group.kind === 'hazard') return def.category === 'production' || def.category === 'residential';
  return effectiveEffects(def, 0).some((e) => e.type === 'housing');
}

/**
 * Build the overlay for the coverage group the selected building belongs to.
 * Returns undefined when the building provides no radius coverage.
 */
export function coverageOverlay(state: GameState, config: GameConfig, derived: Derived, selectedId: string): CoverageOverlay | undefined {
  const selected = state.buildings[selectedId];
  const selDef = selected && config.buildings.get(selected.defId);
  if (!selected || !selDef) return undefined;
  const selSources = sourcesOf(selDef, selected.upgradeLevel);
  if (selSources.length === 0) return undefined;
  const group = selSources[0]!.group; // first coverage the building provides

  const meta = groupMeta(group);
  const sources: CoverageSourceView[] = [];
  const consumers: CoverageConsumerView[] = [];
  const sourceCenters: { cx: number; cy: number; radius: number }[] = [];

  for (const b of Object.values(state.buildings)) {
    // § C4/§16: Ein Gebäude im Upgrade versorgt weiter (Sim nutzt isContributing);
    // das Overlay muss dieselbe Quelle zeigen, sonst „Radius auf null" im Bild.
    if (!isContributing(b)) continue;
    const def = config.buildings.get(b.defId);
    if (!def) continue;
    if (!isInfrastructureOperational(buildingInfrastructureStatus(state, config, derived.roadNetwork, b))) continue;
    for (const s of sourcesOf(def, b.upgradeLevel)) {
      if (!sameGroup(s.group, group)) continue;
      const { cx, cy } = centerOf(def, b);
      sources.push({ x: b.x, y: b.y, w: def.size.w, h: def.size.h, radius: s.radius, selected: b.id === selectedId });
      sourceCenters.push({ cx, cy, radius: s.radius });
    }
  }

  // Under capacity compares aggregate supply against demand. Two flavours:
  //  - capacity needs (water/energy): derived.capacity is the supply pool.
  //  - coverage needs (police/hospital): coverageCapacity is the served-resident
  //    pool, compared against the residents currently in range.
  let underCapacity = false;
  let capacity: { servable: number; used: number } | undefined;
  if (group.kind === 'need') {
    const need = config.needs.find((n) => n.id === group.need);
    const ns = state.citizens.needs[group.need];
    if (need && ns) {
      if (need.kind === 'coverage' && derived.coverageCapacity[group.need] > 0) {
        const servable = derived.coverageCapacity[group.need];
        const used = Math.round(state.citizens.population * derived.needCoverage[group.need]);
        underCapacity = servable < used;
        capacity = { servable, used };
      } else if (need.kind !== 'coverage' && ns.demand > 0) {
        underCapacity = derived.capacity[group.need] < ns.demand;
      }
    }
  }

  for (const b of Object.values(state.buildings)) {
    if (!isContributing(b)) continue;
    const def = config.buildings.get(b.defId);
    if (!def || !isConsumer(def, group)) continue;
    if (!isInfrastructureOperational(buildingInfrastructureStatus(state, config, derived.roadNetwork, b))) continue;
    const { cx, cy } = centerOf(def, b);
    const hits = sourceCenters.reduce((n, s) => (chebyshev(cx, cy, s.cx, s.cy) <= s.radius ? n + 1 : n), 0);
    let cstate: CoverageState;
    if (hits === 0) cstate = 'unsupplied';
    else if (underCapacity) cstate = 'partial';
    else if (hits >= 2) cstate = 'redundant';
    else cstate = 'supplied';
    consumers.push({ x: b.x, y: b.y, w: def.size.w, h: def.size.h, state: cstate });
  }

  const counts = {
    supplied: consumers.filter((c) => c.state === 'supplied' || c.state === 'redundant').length,
    partial: consumers.filter((c) => c.state === 'partial').length,
    unsupplied: consumers.filter((c) => c.state === 'unsupplied').length,
  };

  return { group, labelKey: meta.labelKey, colorKey: meta.colorKey, sources, consumers, underCapacity, counts, ...(capacity ? { capacity } : {}) };
}
