import type { BuildingDef, BuildingEffect } from '../config/types.ts';
import type { BuildingInstance, ResourceId } from '../types.ts';

/** Effects at the building's current upgrade level. */
export function effectiveEffects(def: BuildingDef, upgradeLevel: number): BuildingEffect[] {
  if (upgradeLevel <= 0 || !def.upgrades) return def.effects;
  const upgrade = def.upgrades[Math.min(upgradeLevel, def.upgrades.length) - 1];
  return upgrade ? upgrade.effects : def.effects;
}

/** Everything paid into a building: its build cost plus every applied upgrade. */
export function investedCost(def: BuildingDef, upgradeLevel: number): Partial<Record<ResourceId, number>> {
  const total: Partial<Record<ResourceId, number>> = {};
  const add = (cost: Partial<Record<ResourceId, number>>) => {
    for (const [res, amount] of Object.entries(cost)) {
      total[res as ResourceId] = (total[res as ResourceId] ?? 0) + (amount ?? 0);
    }
  };
  add(def.cost);
  for (let i = 0; i < upgradeLevel && def.upgrades && i < def.upgrades.length; i++) {
    add(def.upgrades[i]!.cost);
  }
  return total;
}

/**
 * Effective build cost of the *next* copy of a building (§7 anti-spam). With
 * `costScaling` set, each already-built copy multiplies the whole cost by that
 * factor: `baseCost × factor^existingCount`, rounded per resource. Without it,
 * the flat `def.cost` is returned. This is the single source of truth used by
 * both the placement command and the build-menu display, so the price shown is
 * exactly the price charged. The escalation premium is intentionally not
 * refunded on demolition (refund stays on the base cost).
 */
export function effectiveBuildCost(def: BuildingDef, existingCount: number): Partial<Record<ResourceId, number>> {
  if (!def.costScaling || def.costScaling <= 1 || existingCount <= 0) return def.cost;
  const mult = Math.pow(def.costScaling, existingCount);
  const scaled: Partial<Record<ResourceId, number>> = {};
  for (const [res, amount] of Object.entries(def.cost)) {
    scaled[res as ResourceId] = Math.round((amount ?? 0) * mult);
  }
  return scaled;
}

/** Resources returned when demolishing, floored per resource. */
export function demolishRefund(
  def: BuildingDef,
  upgradeLevel: number,
  factor: number,
): Partial<Record<ResourceId, number>> {
  const refund: Partial<Record<ResourceId, number>> = {};
  for (const [res, amount] of Object.entries(investedCost(def, upgradeLevel))) {
    const value = Math.floor((amount ?? 0) * factor);
    if (value > 0) refund[res as ResourceId] = value;
  }
  return refund;
}

export function centerOf(def: BuildingDef, b: BuildingInstance): { cx: number; cy: number } {
  return { cx: b.x + (def.size.w - 1) / 2, cy: b.y + (def.size.h - 1) / 2 };
}

export function chebyshev(ax: number, ay: number, bx: number, by: number): number {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}
