import type { BuildingDef } from '../config/types.ts';
import type { GameState } from '../types.ts';

/**
 * Per-level build cap for a building type (§1). Returns the active cap at the
 * given city level, or `undefined` when the building has no cap (houses, roads,
 * decoration stay freely buildable, §13). Breakpoints are ascending; the last
 * one with `level` ≤ `cityLevel` wins.
 */
export function buildLimitAt(def: BuildingDef, cityLevel: number): number | undefined {
  if (!def.buildLimit || def.buildLimit.length === 0) return undefined;
  let cap: number | undefined;
  for (const bp of def.buildLimit) {
    if (bp.level <= cityLevel) cap = bp.max;
  }
  // Below the first breakpoint the building is not yet unlocked; treat as 0.
  return cap ?? 0;
}

/** The next level at which this building's cap increases, if any (for UI hints). */
export function nextLimitLevel(def: BuildingDef, cityLevel: number): number | undefined {
  if (!def.buildLimit) return undefined;
  const current = buildLimitAt(def, cityLevel) ?? 0;
  for (const bp of def.buildLimit) {
    if (bp.level > cityLevel && bp.max > current) return bp.level;
  }
  return undefined;
}

/** How many of a building type currently exist (built or under construction). */
export function countOf(state: GameState, defId: string): number {
  let n = 0;
  for (const b of Object.values(state.buildings)) if (b.defId === defId) n += 1;
  return n;
}
