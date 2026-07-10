import type { BuildingDef, BuildingEffect } from '../config/types.ts';
import type { BuildingInstance } from '../types.ts';

/** Effects at the building's current upgrade level. */
export function effectiveEffects(def: BuildingDef, upgradeLevel: number): BuildingEffect[] {
  if (upgradeLevel <= 0 || !def.upgrades) return def.effects;
  const upgrade = def.upgrades[Math.min(upgradeLevel, def.upgrades.length) - 1];
  return upgrade ? upgrade.effects : def.effects;
}

export function centerOf(def: BuildingDef, b: BuildingInstance): { cx: number; cy: number } {
  return { cx: b.x + (def.size.w - 1) / 2, cy: b.y + (def.size.h - 1) / 2 };
}

export function chebyshev(ax: number, ay: number, bx: number, by: number): number {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}
