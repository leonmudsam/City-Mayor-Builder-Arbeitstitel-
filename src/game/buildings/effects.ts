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
 * Effective build cost of the *next* copy of a building. Two generic modifiers,
 * both config-only and both feeding the single price path used by the placement
 * command and the build-menu display (shown price == charged price):
 *
 *  - `firstBuildDiscount` (§ faster early game): if this is the first-EVER copy
 *    (`lifetimeCount === 0`), take that fraction off the cost — 1 = free. Keyed
 *    on lifetime built, never the current count, so demolish/rebuild can't farm it.
 *  - `costScaling` (§7 anti-spam): otherwise, each already-built copy multiplies
 *    the whole cost by that factor (`baseCost × factor^existingCount`).
 *
 * The two never overlap (discount only at count 0, scaling only above 0). The
 * escalation premium is intentionally not refunded on demolition.
 */
export function effectiveBuildCost(
  def: BuildingDef,
  existingCount: number,
  lifetimeCount: number = existingCount,
): Partial<Record<ResourceId, number>> {
  if (lifetimeCount <= 0 && def.firstBuildDiscount && def.firstBuildDiscount > 0) {
    const keep = Math.max(0, 1 - def.firstBuildDiscount);
    const discounted: Partial<Record<ResourceId, number>> = {};
    for (const [res, amount] of Object.entries(def.cost)) {
      const value = Math.round((amount ?? 0) * keep);
      // Drop zero costs so a fully-free first build shows no price chips at all.
      if (value > 0) discounted[res as ResourceId] = value;
    }
    return discounted;
  }
  if (!def.costScaling || def.costScaling <= 1 || existingCount <= 0) return def.cost;
  const mult = Math.pow(def.costScaling, existingCount);
  const scaled: Partial<Record<ResourceId, number>> = {};
  for (const [res, amount] of Object.entries(def.cost)) {
    scaled[res as ResourceId] = Math.round((amount ?? 0) * mult);
  }
  return scaled;
}

/** Whether the first-build discount currently applies to a building (UI hint). */
export function isFirstBuildDiscounted(def: BuildingDef, lifetimeCount: number): boolean {
  return lifetimeCount <= 0 && (def.firstBuildDiscount ?? 0) > 0;
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
