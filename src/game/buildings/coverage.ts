import type { GameConfig } from '../config/index.ts';
import type { BuildingDef } from '../config/types.ts';
import type { GameState, NeedId } from '../types.ts';
import type { Derived } from '../simulation/derived.ts';
import { centerOf, chebyshev, effectiveEffects } from './effects.ts';

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
}

interface GroupMeta {
  labelKey: string;
  colorKey: string;
}

function groupMeta(group: CoverageGroup): GroupMeta {
  if (group.kind === 'hazard') return { labelKey: 'ui.coverage.fire', colorKey: 'protection' };
  const colorKey = group.need === 'water' ? 'water' : group.need === 'food' ? 'food' : 'leisure';
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
    if (b.status !== 'active') continue;
    const def = config.buildings.get(b.defId);
    if (!def) continue;
    for (const s of sourcesOf(def, b.upgradeLevel)) {
      if (!sameGroup(s.group, group)) continue;
      const { cx, cy } = centerOf(def, b);
      sources.push({ x: b.x, y: b.y, w: def.size.w, h: def.size.h, radius: s.radius, selected: b.id === selectedId });
      sourceCenters.push({ cx, cy, radius: s.radius });
    }
  }

  // Under capacity only makes sense for capacity needs (water): compare the
  // aggregate supply against current demand.
  let underCapacity = false;
  if (group.kind === 'need') {
    const ns = state.citizens.needs[group.need];
    if (ns && ns.demand > 0) underCapacity = derived.capacity[group.need] < ns.demand;
  }

  for (const b of Object.values(state.buildings)) {
    if (b.status !== 'active') continue;
    const def = config.buildings.get(b.defId);
    if (!def || !isConsumer(def, group)) continue;
    const { cx, cy } = centerOf(def, b);
    const hits = sourceCenters.reduce((n, s) => (chebyshev(cx, cy, s.cx, s.cy) <= s.radius ? n + 1 : n), 0);
    let cstate: CoverageState;
    if (hits === 0) cstate = 'unsupplied';
    else if (underCapacity) cstate = 'partial';
    else if (hits >= 2) cstate = 'redundant';
    else cstate = 'supplied';
    consumers.push({ x: b.x, y: b.y, w: def.size.w, h: def.size.h, state: cstate });
  }

  return { group, labelKey: meta.labelKey, colorKey: meta.colorKey, sources, consumers, underCapacity };
}
