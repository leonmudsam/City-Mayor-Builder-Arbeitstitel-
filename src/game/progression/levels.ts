import type { GameConfig } from '../config/index.ts';
import type { GameState } from '../types.ts';
import { grantGold, grantResources } from '../economy/economyService.ts';
import type { Derived } from '../simulation/derived.ts';
import { newId } from '../engine/rng.ts';
import { isRegionAdjacentToUnlocked } from '../map/world.ts';
import { BAKED_REGIONS, startRegionConfig } from '../config/startRegion.config.ts';

/**
 * § Final World Compaction 8.1 §6: Ab diesem Level ist die erste Erweiterung
 * nach der Startregion kostenlos. In der Progressions-Schicht definiert (kein
 * Renderer-/State-Bezug), damit sowohl der Level-Hinweis als auch der Controller
 * dieselbe Wahrheit nutzen.
 *
 * § 12.2 (Spieltest): von 3 auf **2** gezogen. Der Auftrag verlangt, dass die
 * direkt angrenzenden Ostterrassen ab Level 2 erschließbar sind; die Gratisstufe
 * muss dann dieselbe Stufe sein, sonst wäre die erste erreichbare Region
 * ausgerechnet die einzige, die der Spieler bezahlen müsste.
 */
export const FREE_EXPANSION_LEVEL = 2;

/** Kurzcharakter einer Region als Bürger-Hinweis-Schlüssel (§4 Auftrag B). */
function regionBoonKey(mods: Partial<Record<string, number>> | undefined, roadCostFactor: number | undefined, buildable: number): string {
  // Stärksten Vorteil hervorheben; sonst „viel Platz" oder — bei teurem
  // Gelände ohne klaren Bonus — eine ehrliche Warnung.
  let bestKey: string | undefined;
  let bestFactor = 1;
  for (const [key, factor] of Object.entries(mods ?? {})) {
    if (factor !== undefined && factor > bestFactor) {
      bestFactor = factor;
      bestKey = key;
    }
  }
  if (bestKey) return `ui.region.boon.${bestKey}`;
  if ((roadCostFactor ?? 1) > 1.3) return 'ui.region.boon.tough';
  if (buildable >= 3000) return 'ui.region.boon.space';
  return 'ui.region.boon.space';
}

/** Himmelsrichtung der Region relativ zum Rathaus (grobe Dominanzachse). */
function regionDirectionKey(centroid: { x: number; y: number }): string {
  const dx = centroid.x - startRegionConfig.townHall.x;
  const dy = centroid.y - startRegionConfig.townHall.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'ui.dir.east' : 'ui.dir.west';
  return dy >= 0 ? 'ui.dir.south' : 'ui.dir.north';
}

/**
 * Bürger-Hinweise auf Landschaften, die gerade (mit diesem Level) erschließbar
 * geworden sind und an bereits erschlossenes Land grenzen (§4 Auftrag B:
 * Führung über Bürger, nicht Menüs). Ein Hinweis je neu freigeschalteter,
 * angrenzender Region.
 */
function hintNewlyReachableRegions(state: GameState, config: GameConfig): void {
  for (const def of config.regionList) {
    if (!def.unlockable || def.unlockLevel !== state.level.current) continue;
    if (state.world.regions[String(def.id)]?.status === 'unlocked') continue;
    if (!isRegionAdjacentToUnlocked(state, def.id)) continue;
    const baked = BAKED_REGIONS[def.id - 1];
    if (!baked) continue;
    state.mayor.messages.unshift({
      id: newId(state, 'msg'),
      textKey: 'message.region_hint',
      params: {
        direction: regionDirectionKey(baked.centroid),
        name: def.nameKey,
        boon: regionBoonKey(def.productionModifiers, def.roadCostFactor, def.buildableTiles),
      },
      kind: 'info',
      createdAt: state.meta.lastSimTime,
    });
  }
  // § Final World Compaction 8.1 §6: Genau beim Erreichen der Gratis-Stufe (L3)
  // und solange noch keine Erweiterung erfolgt ist, ein einmaliger Tutorial-
  // Hinweis, dass die erste Nachbarlandschaft kostenlos gewählt werden darf.
  if (state.level.current === FREE_EXPANSION_LEVEL && state.stats.regionsUnlocked === 0) {
    state.mayor.messages.unshift({
      id: newId(state, 'msg'),
      textKey: 'message.free_expansion_hint',
      kind: 'info',
      createdAt: state.meta.lastSimTime,
    });
  }
}

export function levelForXp(config: GameConfig, xp: number): number {
  let level = 1;
  for (const def of config.levels) {
    if (xp >= def.xpRequired) level = def.level;
  }
  return level;
}

export function xpForNextLevel(config: GameConfig, currentLevel: number): number | undefined {
  return config.levels.find((l) => l.level === currentLevel + 1)?.xpRequired;
}

/** Adds XP, applies level-ups (rewards + message). Returns levels gained. */
export function addXp(state: GameState, config: GameConfig, derived: Derived, amount: number): number {
  state.level.xp += amount;
  const newLevel = levelForXp(config, state.level.xp);
  let gained = 0;
  while (state.level.current < newLevel) {
    state.level.current += 1;
    gained += 1;
    const def = config.levels.find((l) => l.level === state.level.current);
    if (def) {
      if (def.rewards.money) grantResources(state, { money: def.rewards.money }, derived.storageCaps, 'level_up_reward');
      if (def.rewards.gold) grantGold(state, def.rewards.gold, 'level_up_reward');
    }
    state.mayor.messages.unshift({
      id: newId(state, 'msg'),
      textKey: 'message.level_up',
      params: { level: state.level.current },
      kind: 'info',
      createdAt: state.meta.lastSimTime,
    });
    state.mayor.reputation += 2;
    // Bürger weisen den Weg zu neu erreichbaren Landschaften (§4 Auftrag B).
    hintNewlyReachableRegions(state, config);
  }
  return gained;
}

export function unlockedBuildings(config: GameConfig, level: number): Set<string> {
  const ids = new Set<string>();
  for (const l of config.levels) {
    if (l.level <= level) for (const id of l.unlocks) ids.add(id);
  }
  // Pre-placed/unique non-buildables are never in unlock lists.
  return ids;
}
