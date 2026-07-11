import type { GameConfig } from '../config/index.ts';
import type { GameState, ResourceId, SectorId } from '../types.ts';
import { parseSectorId } from '../types.ts';
import { recomputeDerived, type Derived } from '../simulation/derived.ts';
import { advance } from '../simulation/tick.ts';
import { updateQuests, objectiveTarget } from '../simulation/quests.ts';
import { validatePlacement, type PlacementError } from '../buildings/placement.ts';
import { demolishRefund } from '../buildings/effects.ts';
import { buildLimitAt, countOf, nextLimitLevel } from '../buildings/limits.ts';
import { coverageOverlay, type CoverageOverlay } from '../buildings/coverage.ts';
import { canAfford, grantGold, grantResources, spendCost, spendGold } from '../economy/economyService.ts';
import { computeIncome, type IncomeBreakdown } from '../economy/income.ts';
import { addXp } from '../progression/levels.ts';
import {
  isSectorAdjacentToUnlocked,
  materializeNeighbors,
  materializeSector,
  sectorUnlockCost,
  tileAt,
} from '../map/world.ts';
import { newId } from '../engine/rng.ts';

export type CommandError =
  | PlacementError
  | 'insufficient'
  | 'not_found'
  | 'invalid'
  | 'cooldown'
  | 'locked'
  | 'feature_disabled';

export type CommandResult = { ok: true } | { ok: false; error: CommandError };

const ok: CommandResult = { ok: true };
const fail = (error: CommandError): CommandResult => ({ ok: false, error });

export type GameEvent = { type: 'levelUp'; level: number } | { type: 'questClaimable' } | { type: 'change' };

/**
 * The command API between UI and simulation. The UI never touches simulation
 * internals: it calls named commands and subscribes to change notifications.
 * Commands map 1:1 to later server API requests (§12).
 */
export class GameController {
  readonly config: GameConfig;
  state: GameState;
  derived: Derived;
  /** Bumped on every state change; UI subscribes via this version. */
  version = 0;

  private listeners = new Set<(event: GameEvent) => void>();

  constructor(config: GameConfig, state: GameState) {
    this.config = config;
    this.state = state;
    this.derived = recomputeDerived(state, config);
    updateQuests(state, config);
  }

  subscribe(listener: (event: GameEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(event: GameEvent): void {
    this.version += 1;
    for (const listener of this.listeners) listener(event);
  }

  /** Drive the simulation to `now` (called by the UI loop and after load). */
  update(now: number): void {
    if (now <= this.state.meta.lastSimTime) return;
    const result = advance(this.state, this.config, this.derived, now);
    this.derived = result.derived;
    if (result.levelUps > 0) this.notify({ type: 'levelUp', level: this.state.level.current });
    this.notify({ type: 'change' });
  }

  private afterStructuralChange(): void {
    this.derived = recomputeDerived(this.state, this.config);
    updateQuests(this.state, this.config);
    this.notify({ type: 'change' });
  }

  // ---- Commands -----------------------------------------------------------

  placeBuilding(defId: string, x: number, y: number): CommandResult {
    const def = this.config.buildings.get(defId);
    if (!def) return fail('not_found');
    const placementError = validatePlacement(this.state, this.config, this.derived, def, x, y);
    if (placementError) return fail(placementError);
    const spend = spendCost(this.state, def.cost, `build_${defId}`);
    if (!spend.ok) return fail('insufficient');

    const id = newId(this.state, 'b');
    const now = this.state.meta.lastSimTime;
    const instant = def.constructionSec <= 0;
    this.state.buildings[id] = {
      id,
      defId,
      x,
      y,
      upgradeLevel: 0,
      status: instant ? 'active' : 'constructing',
      ...(instant ? {} : { constructionEndsAt: now + def.constructionSec * 1000 }),
    };
    for (let dy = 0; dy < def.size.h; dy++) {
      for (let dx = 0; dx < def.size.w; dx++) {
        const tile = tileAt(this.state, x + dx, y + dy);
        if (tile) tile.buildingId = id;
      }
    }
    this.state.stats.built[defId] = (this.state.stats.built[defId] ?? 0) + 1;
    if (instant) {
      addXp(this.state, this.config, this.derived, def.xpReward);
      if (defId === 'mayor_house') this.state.mayor.houseLevel = Math.max(this.state.mayor.houseLevel, 1);
    }
    this.afterStructuralChange();
    return ok;
  }

  demolishBuilding(buildingId: string): CommandResult {
    const b = this.state.buildings[buildingId];
    if (!b) return fail('not_found');
    const def = this.config.buildings.get(b.defId);
    // Central buildings can't be torn down (canDemolish:false) — they relocate
    // instead (§2). `unique` implies the same protection.
    if (!def || def.canDemolish === false || def.unique) return fail('invalid');
    for (let dy = 0; dy < def.size.h; dy++) {
      for (let dx = 0; dx < def.size.w; dx++) {
        const tile = tileAt(this.state, b.x + dx, b.y + dy);
        if (tile && tile.buildingId === buildingId) delete tile.buildingId;
      }
    }
    delete this.state.buildings[buildingId];
    this.state.events = this.state.events.filter((e) => e.buildingId !== buildingId);
    // Refund a share of the invested materials so tearing down is a plannable
    // refactor, not a total loss. Money is uncapped; materials respect storage.
    const refund = demolishRefund(def, b.upgradeLevel, this.config.balancing.demolishRefundFactor);
    grantResources(this.state, refund, this.derived.storageCaps, `demolish_${b.defId}`);
    this.afterStructuralChange();
    return ok;
  }

  /** What a demolition would return right now (for the confirmation UI). */
  getDemolishRefund(buildingId: string): Partial<Record<ResourceId, number>> {
    const b = this.state.buildings[buildingId];
    const def = b && this.config.buildings.get(b.defId);
    if (!b || !def || def.canDemolish === false || def.unique) return {};
    return demolishRefund(def, b.upgradeLevel, this.config.balancing.demolishRefundFactor);
  }

  upgradeBuilding(buildingId: string): CommandResult {
    const b = this.state.buildings[buildingId];
    if (!b) return fail('not_found');
    const def = this.config.buildings.get(b.defId);
    if (!def?.upgrades || b.status !== 'active') return fail('invalid');
    const next = def.upgrades[b.upgradeLevel];
    if (!next) return fail('invalid');
    const spend = spendCost(this.state, next.cost, `upgrade_${b.defId}`);
    if (!spend.ok) return fail('insufficient');
    b.upgradeLevel += 1;
    b.status = 'constructing';
    b.constructionEndsAt = this.state.meta.lastSimTime + next.constructionSec * 1000;
    this.afterStructuralChange();
    return ok;
  }

  /**
   * Relocate an existing building. Two paths lead here (§2/§5):
   *  - the global `moveBuildings` dev flag (off in MVP 1), which lets *anything*
   *    move for free, and
   *  - a per-building `canRelocate` flag (town hall, mayor house), which lets a
   *    non-demolishable special be repositioned via its sheet, charging the
   *    optional `relocationCost`.
   * Placement rules are always re-validated against the target.
   */
  moveBuilding(buildingId: string, x: number, y: number): CommandResult {
    const b = this.state.buildings[buildingId];
    if (!b) return fail('not_found');
    const def = this.config.buildings.get(b.defId);
    if (!def) return fail('not_found');
    const viaFeature = this.config.features.moveBuildings;
    if (!viaFeature && def.canRelocate !== true) return fail('feature_disabled');
    if (b.x === x && b.y === y) return ok;
    const placementError = validatePlacement(this.state, this.config, this.derived, def, x, y, {
      ignoreBuildingId: buildingId,
    });
    if (placementError) return fail(placementError);
    // Relocation fee (only on the canRelocate path — the dev flag stays free).
    if (!viaFeature && def.relocationCost) {
      const spend = spendCost(this.state, def.relocationCost, `relocate_${def.id}`);
      if (!spend.ok) return fail('insufficient');
    }
    for (let dy = 0; dy < def.size.h; dy++) {
      for (let dx = 0; dx < def.size.w; dx++) {
        const tile = tileAt(this.state, b.x + dx, b.y + dy);
        if (tile && tile.buildingId === buildingId) delete tile.buildingId;
      }
    }
    b.x = x;
    b.y = y;
    for (let dy = 0; dy < def.size.h; dy++) {
      for (let dx = 0; dx < def.size.w; dx++) {
        const tile = tileAt(this.state, x + dx, y + dy);
        if (tile) tile.buildingId = buildingId;
      }
    }
    this.afterStructuralChange();
    return ok;
  }

  unlockSector(id: SectorId): CommandResult {
    if (this.state.level.current < 5) return fail('locked'); // expansion unlocks at level 5 (§7)
    const { sx, sy } = parseSectorId(id);
    const sector = this.state.world.sectors[id] ?? materializeSector(this.state, sx, sy);
    if (sector.status === 'unlocked') return fail('invalid');
    if (!isSectorAdjacentToUnlocked(this.state, sx, sy)) return fail('invalid');
    const cost = sectorUnlockCost(this.state, this.config, sx, sy);
    const spend = spendCost(this.state, { money: cost }, 'unlock_sector');
    if (!spend.ok) return fail('insufficient');
    sector.status = 'unlocked';
    this.state.stats.sectorsUnlocked += 1;
    materializeNeighbors(this.state, sx, sy);
    addXp(this.state, this.config, this.derived, 30);
    this.afterStructuralChange();
    return ok;
  }

  performMayorAction(actionId: string): CommandResult {
    const action = this.config.mayorActions.find((a) => a.id === actionId);
    if (!action) return fail('not_found');
    if (action.unlockLevel > this.state.level.current) return fail('locked');
    if (this.state.mayor.houseLevel < 1) return fail('locked'); // requires the mayor house
    const now = this.state.meta.lastSimTime;
    const readyAt = this.state.mayor.actionCooldowns[actionId] ?? 0;
    if (now < readyAt) return fail('cooldown');

    const effect = action.effect;
    if (effect.type === 'buff') {
      this.state.buffs.push({
        id: newId(this.state, 'buff'),
        kind: effect.kind,
        amount: effect.amount,
        endsAt: now + effect.durationSec * 1000,
      });
    } else {
      const eventType = effect.eventType;
      for (const event of this.state.events) {
        if (event.type === eventType) {
          const b = this.state.buildings[event.buildingId];
          if (b && b.status === 'paused') b.status = 'active';
        }
      }
      this.state.events = this.state.events.filter((e) => e.type !== eventType);
    }
    this.state.mayor.actionCooldowns[actionId] = now + action.cooldownSec * 1000;
    this.state.stats.mayorActions[actionId] = (this.state.stats.mayorActions[actionId] ?? 0) + 1;
    this.state.mayor.reputation += 1;
    this.state.mayor.messages.unshift({
      id: newId(this.state, 'msg'),
      textKey: `message.mayor.${actionId}`,
      kind: 'info',
      createdAt: now,
    });
    this.afterStructuralChange();
    return ok;
  }

  claimQuest(questId: string): CommandResult {
    const index = this.state.quests.active.findIndex((a) => a.questId === questId);
    const active = this.state.quests.active[index];
    if (!active) return fail('not_found');
    const quest = this.config.quests.get(questId);
    if (!quest || !active.claimable) return fail('invalid');
    // Double-check objectives server-side style before paying out.
    updateQuests(this.state, this.config);
    if (!active.claimable || !quest.objectives.every((o, i) => (active.progress[i] ?? 0) >= objectiveTarget(o))) {
      return fail('invalid');
    }
    this.state.quests.active.splice(index, 1);
    this.state.quests.completed.push(questId);
    if (quest.rewards.money) grantResources(this.state, { money: quest.rewards.money }, this.derived.storageCaps, `quest_${questId}`);
    if (quest.rewards.gold) grantGold(this.state, quest.rewards.gold, 'quest_reward');
    if (quest.rewards.xp) addXp(this.state, this.config, this.derived, quest.rewards.xp);
    updateQuests(this.state, this.config);
    this.notify({ type: 'change' });
    return ok;
  }

  /** Gold speed-up — gated behind the goldSystem feature flag (§14). */
  speedUpConstruction(buildingId: string): CommandResult {
    if (!this.config.features.goldSystem) return fail('feature_disabled');
    const b = this.state.buildings[buildingId];
    if (!b || b.status !== 'constructing' || b.constructionEndsAt === undefined) return fail('invalid');
    const remainingMin = Math.max(0, (b.constructionEndsAt - this.state.meta.lastSimTime) / 60000);
    const cost = Math.max(1, Math.ceil(remainingMin / this.config.balancing.speedupMinutesPerGold));
    const spend = spendGold(this.state, cost, 'building_speedup');
    if (!spend.ok) return fail('insufficient');
    b.constructionEndsAt = this.state.meta.lastSimTime;
    this.update(this.state.meta.lastSimTime + 1);
    return ok;
  }

  renameCity(name: string): CommandResult {
    const trimmed = name.trim().slice(0, 40);
    if (!trimmed) return fail('invalid');
    this.state.meta.cityName = trimmed;
    this.notify({ type: 'change' });
    return ok;
  }

  // ---- Read helpers for the UI (no mutation) ------------------------------

  canAffordCost(cost: Partial<Record<ResourceId, number>>): boolean {
    return canAfford(this.state, cost);
  }

  /**
   * Build-limit status for a building type (undefined = no limit). `count` is
   * how many exist, `max` the current cap, `nextLevel` the level that raises it.
   */
  getBuildLimit(defId: string): { count: number; max: number; nextLevel: number | undefined } | undefined {
    const def = this.config.buildings.get(defId);
    if (!def) return undefined;
    const max = buildLimitAt(def, this.state.level.current);
    if (max === undefined) return undefined;
    return { count: countOf(this.state, defId), max, nextLevel: nextLimitLevel(def, this.state.level.current) };
  }

  getSectorCost(id: SectorId): number {
    const { sx, sy } = parseSectorId(id);
    return sectorUnlockCost(this.state, this.config, sx, sy);
  }

  /** Current per-minute income split by source, for the finance UI (§5). */
  getIncome(): IncomeBreakdown {
    return computeIncome(this.state, this.config, this.derived);
  }

  /**
   * Generic coverage overlay for a selected supply building (§1) — undefined if
   * the building projects no radius coverage.
   */
  getCoverageOverlay(buildingId: string): CoverageOverlay | undefined {
    return coverageOverlay(this.state, this.config, this.derived, buildingId);
  }
}
