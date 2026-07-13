import type { GameConfig } from '../config/index.ts';
import type { BuildingUpgradeDef } from '../config/types.ts';
import type { GameState, ResourceId, SectorId } from '../types.ts';
import { parseSectorId, sectorId } from '../types.ts';
import { recomputeDerived, type Derived } from '../simulation/derived.ts';
import { advance, moveInPerMin } from '../simulation/tick.ts';
import { updateQuests, objectiveTarget } from '../simulation/quests.ts';
import { validatePlacement, type PlacementError } from '../buildings/placement.ts';
import { demolishRefund, effectiveBuildCost, isFirstBuildDiscounted } from '../buildings/effects.ts';
import { buildLimitAt, countOf, nextLimitLevel } from '../buildings/limits.ts';
import { coverageOverlay, type CoverageOverlay } from '../buildings/coverage.ts';
import { canAfford, grantGold, grantResources, spendCost, spendGold } from '../economy/economyService.ts';
import { computeIncome, type IncomeBreakdown } from '../economy/income.ts';
import { addXp } from '../progression/levels.ts';
import {
  findDistrictCenterSpot,
  isSectorAdjacentToUnlocked,
  isSectorInBounds,
  materializeNeighbors,
  materializeSector,
  sectorHasTerrain,
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
    // Escalating cost for anti-spam utilities (warehouses, §7) or a first-build
    // discount for core economy buildings (§ faster early game). Lifetime count
    // gates the discount so demolish/rebuild can't farm it.
    const cost = effectiveBuildCost(def, countOf(this.state, defId), this.state.stats.built[defId] ?? 0);
    const spend = spendCost(this.state, cost, `build_${defId}`);
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
    // Level-coupled densification (§ upgrades tied to level): a building only
    // climbs to the tier its city has earned.
    if (next.unlockLevel && this.state.level.current < next.unlockLevel) return fail('locked');
    const spend = spendCost(this.state, next.cost, `upgrade_${b.defId}`);
    if (!spend.ok) return fail('insufficient');
    b.upgradeLevel += 1;
    b.status = 'constructing';
    b.constructionEndsAt = this.state.meta.lastSimTime + next.constructionSec * 1000;
    this.afterStructuralChange();
    return ok;
  }

  /**
   * The next upgrade stage of a building and why it is (not) available — the
   * single source the sheet uses so the "why can't I upgrade" messaging matches
   * the command exactly (§ helpful UI). `lockedUntilLevel` is set when the stage
   * exists but the city is too low a level; `affordable` reflects current funds.
   */
  getUpgradeInfo(buildingId: string): {
    next?: BuildingUpgradeDef;
    stage: number;
    maxStage: number;
    lockedUntilLevel?: number;
    affordable: boolean;
  } {
    const b = this.state.buildings[buildingId];
    const def = b && this.config.buildings.get(b.defId);
    if (!b || !def) return { stage: 0, maxStage: 0, affordable: false };
    const maxStage = def.upgrades?.length ?? 0;
    const next = def.upgrades?.[b.upgradeLevel];
    if (!next) return { stage: b.upgradeLevel, maxStage, affordable: false };
    const locked = next.unlockLevel && this.state.level.current < next.unlockLevel;
    return {
      next,
      stage: b.upgradeLevel,
      maxStage,
      ...(locked ? { lockedUntilLevel: next.unlockLevel } : {}),
      affordable: canAfford(this.state, next.cost),
    };
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
    if (!isSectorInBounds(sx, sy)) return fail('invalid'); // no unlocking past the world edge
    const sector = this.state.world.sectors[id] ?? materializeSector(this.state, sx, sy);
    if (sector.status === 'unlocked') return fail('invalid');
    if (!isSectorAdjacentToUnlocked(this.state, sx, sy)) return fail('invalid');
    const cost = sectorUnlockCost(this.state, this.config, sx, sy);
    const spend = spendCost(this.state, { money: cost }, 'unlock_sector');
    if (!spend.ok) return fail('insufficient');
    sector.status = 'unlocked';
    // Join the district of an adjacent unlocked sector, so a far quarter (the
    // river district) grows coherently instead of everything reading as 'main'.
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const n = this.state.world.sectors[sectorId(sx + dx, sy + dy)];
      if (n?.status === 'unlocked' && n.districtId !== 'main') { sector.districtId = n.districtId; break; }
    }
    this.state.stats.sectorsUnlocked += 1;
    materializeNeighbors(this.state, sx, sy);
    addXp(this.state, this.config, this.derived, 30);
    this.afterStructuralChange();
    return ok;
  }

  /**
   * Found the river district — the first far expansion (§8). A one-off project
   * that plants a district centre in a locked river-biome sector: it unlocks the
   * sector as a new district and seeds a fresh road network there, so the river
   * quarter is a self-contained build area, not a 40-tile road from downtown.
   */
  foundDistrict(id: SectorId): CommandResult {
    const bal = this.config.balancing;
    if (this.state.level.current < bal.districtUnlockLevel) return fail('locked');
    const { sx, sy } = parseSectorId(id);
    if (!isSectorInBounds(sx, sy)) return fail('invalid'); // no district past the world edge
    const sector = this.state.world.sectors[id] ?? materializeSector(this.state, sx, sy);
    if (sector.status === 'unlocked') return fail('invalid');
    if (!sectorHasTerrain(sector, 'river')) return fail('invalid'); // must be the river biome
    if (Object.values(this.state.world.districts).some((d) => d.id === 'river')) return fail('invalid'); // one for now
    const centerDef = this.config.buildings.get('district_center');
    if (!centerDef) return fail('not_found');
    const spot = findDistrictCenterSpot(sector, centerDef.size.w);
    if (!spot) return fail('terrain');
    const spend = spendCost(this.state, bal.districtFoundCost, 'found_district');
    if (!spend.ok) return fail('insufficient');

    sector.status = 'unlocked';
    sector.districtId = 'river';
    this.state.stats.sectorsUnlocked += 1;
    materializeNeighbors(this.state, sx, sy);
    // Plant the centre active at once, so it stores goods and seeds roads now.
    const centerId = newId(this.state, 'b');
    this.state.buildings[centerId] = { id: centerId, defId: 'district_center', x: spot.x, y: spot.y, upgradeLevel: 0, status: 'active' };
    for (let dy = 0; dy < centerDef.size.h; dy++) {
      for (let dx = 0; dx < centerDef.size.w; dx++) {
        const tile = tileAt(this.state, spot.x + dx, spot.y + dy);
        if (tile) tile.buildingId = centerId;
      }
    }
    this.state.world.districts['river'] = { id: 'river', nameKey: 'district.river', centerBuildingId: centerId };
    addXp(this.state, this.config, this.derived, 120);
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

  /**
   * Set a mayor tax rate (§ tax sliders). Clamped to the configured band; the
   * value only affects income and the happiness penalty (both per-tick), so no
   * derived recompute is needed — a plain notify refreshes the UI.
   */
  setTaxRate(kind: 'residential' | 'commercial', rate: number): CommandResult {
    if (!Number.isFinite(rate)) return fail('invalid');
    const { taxRateMin, taxRateMax } = this.config.balancing;
    const clamped = Math.max(taxRateMin, Math.min(taxRateMax, rate));
    if (kind === 'residential') this.state.policy.residentialTaxRate = clamped;
    else this.state.policy.commercialTaxRate = clamped;
    this.notify({ type: 'change' });
    return ok;
  }

  // ---- Read helpers for the UI (no mutation) ------------------------------

  canAffordCost(cost: Partial<Record<ResourceId, number>>): boolean {
    return canAfford(this.state, cost);
  }

  /**
   * The money+material cost the next copy of a building would actually charge
   * right now, accounting for escalating `costScaling` (§7). The build menu uses
   * this so the shown price matches the charged price.
   */
  getBuildCost(defId: string): Partial<Record<ResourceId, number>> {
    const def = this.config.buildings.get(defId);
    if (!def) return {};
    return effectiveBuildCost(def, countOf(this.state, defId), this.state.stats.built[defId] ?? 0);
  }

  /** Whether the next copy is the free/discounted first build (build-menu badge). */
  isFirstBuildDiscount(defId: string): boolean {
    const def = this.config.buildings.get(defId);
    if (!def) return false;
    return isFirstBuildDiscounted(def, this.state.stats.built[defId] ?? 0);
  }

  /**
   * Why the population is (not) growing — the single source the UI uses to
   * explain move-in (§ "why isn't my city filling up"). `growing` when happy
   * citizens are actively arriving; otherwise `reason` says what blocks them.
   */
  getGrowthStatus(): {
    growing: boolean;
    reason?: 'no_housing' | 'housing_full' | 'unhappy';
    population: number;
    capacity: number;
    freeHousing: number;
    ratePerMin: number;
  } {
    const bal = this.config.balancing;
    const pop = this.state.citizens.population;
    const capacity = this.derived.capacity.housing;
    const freeHousing = Math.max(0, capacity - pop);
    const happiness = this.state.citizens.happiness;
    const base = { population: pop, capacity, freeHousing, ratePerMin: 0 };
    if (capacity <= 0) return { growing: false, reason: 'no_housing', ...base };
    if (freeHousing <= 0) return { growing: false, reason: 'housing_full', ...base };
    if (happiness < bal.growthHappinessThreshold) return { growing: false, reason: 'unhappy', ...base };
    return { growing: true, ...base, ratePerMin: Math.round(moveInPerMin(bal, freeHousing, happiness)) };
  }

  /**
   * Whether a building reads as a "Großprojekt" (major project) — a big money
   * investment that the UI frames specially and, when unaffordable, explains
   * with an income hint rather than a bare shortfall (§ realistic prices).
   */
  isMajorProject(defId: string): boolean {
    const cost = this.getBuildCost(defId);
    return (cost.money ?? 0) >= this.config.balancing.majorProjectMoneyThreshold;
  }

  /** Recommended steady net income for a major project (cost ÷ payback window). */
  recommendedIncomeFor(defId: string): number {
    const money = this.getBuildCost(defId).money ?? 0;
    return Math.round(money / this.config.balancing.majorProjectPaybackMinutes);
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

  /**
   * Whether a locked sector can be turned into the river district (§8), plus the
   * project cost — drives the "found district" option in the sector dialog.
   */
  canFoundDistrict(id: SectorId): { eligible: boolean; cost: Partial<Record<ResourceId, number>> } {
    const bal = this.config.balancing;
    const sector = this.state.world.sectors[id];
    const def = this.config.buildings.get('district_center');
    const hasRiverDistrict = Object.values(this.state.world.districts).some((d) => d.id === 'river');
    const eligible =
      this.state.level.current >= bal.districtUnlockLevel &&
      !!sector && sector.status === 'locked' && !!def &&
      sectorHasTerrain(sector, 'river') && !hasRiverDistrict &&
      findDistrictCenterSpot(sector, def.size.w) !== undefined;
    return { eligible, cost: bal.districtFoundCost };
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
