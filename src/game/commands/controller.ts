import type { GameConfig } from '../config/index.ts';
import type { ActivityDef, ActivityRewardTier, BuildingUpgradeDef } from '../config/types.ts';
import { currentTradeContracts, pickTargets, rewardTierFor, type TradeContractOffer } from '../simulation/activities.ts';
import type { GameState, ResourceId, SectorId } from '../types.ts';
import { parseSectorId, sectorId } from '../types.ts';
import { recomputeDerived, type Derived } from '../simulation/derived.ts';
import { advance, moveInPerMin } from '../simulation/tick.ts';
import { updateQuests, objectiveTarget } from '../simulation/quests.ts';
import { validatePlacement, type PlacementError } from '../buildings/placement.ts';
import { demolishRefund, effectiveBuildCost, isFirstBuildDiscounted } from '../buildings/effects.ts';
import { buildLimitAt, countOf, nextLimitLevel } from '../buildings/limits.ts';
import { coverageOverlay, type CoverageOverlay } from '../buildings/coverage.ts';
import { buildingDiagnostics, primaryMarker, type Diagnosis } from '../buildings/diagnostics.ts';
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

export type GameEvent =
  | { type: 'levelUp'; level: number }
  | { type: 'questClaimable' }
  | { type: 'activityCompleted'; defId: string; money: number; xp: number }
  | { type: 'change' };

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

  /**
   * Replace the entire game state in place (§ robust restart / import). The
   * controller *instance* stays the same, so every UI subscriber keeps working
   * — we just swap the state, rebuild derived values and quests, and notify.
   * This is what makes "start over" and "import save" work without a page
   * reload (a reload re-triggers the autosave and clobbers the change).
   */
  resetTo(state: GameState): void {
    this.state = state;
    this.derived = recomputeDerived(state, this.config);
    updateQuests(state, this.config);
    this.notify({ type: 'change' });
  }

  private notify(event: GameEvent): void {
    this.version += 1;
    for (const listener of this.listeners) listener(event);
  }

  /**
   * Drive the simulation to `now`. `live` is `true` only for real foreground
   * ticks while the tab is visible — the entire economy (production, income,
   * growth) runs exclusively then. Offline/hidden catch-up passes `false` and
   * only advances construction timers, buff expiry and cooldown clocks.
   */
  update(now: number, live = false): void {
    if (now <= this.state.meta.lastSimTime) return;
    const result = advance(this.state, this.config, this.derived, now, live);
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
    // Critical upgrade fix (§2): DON'T advance upgradeLevel yet — record the
    // target and go under construction. The building keeps every effect of its
    // current (completed) stage for the whole build time; the tick promotes it
    // to `targetUpgradeLevel` only on completion. No residents evicted, no
    // production/coverage/storage dropping to zero mid-upgrade.
    b.targetUpgradeLevel = b.upgradeLevel + 1;
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
    // Material rewards (§16) respect storage caps like any other grant.
    if (quest.rewards.resources) grantResources(this.state, quest.rewards.resources, this.derived.storageCaps, `quest_${questId}`);
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

  // ---- Trading (§7 Handelskontor) -----------------------------------------

  /**
   * The best trade tier the city currently has: the highest completed stage of
   * any active trading post (0 = none). Manual trading requires a trading post;
   * a higher-stage one improves the sell rate (§7 "better rates by upgrade").
   */
  private bestTradeStage(): number {
    let best = -1;
    for (const b of Object.values(this.state.buildings)) {
      if (b.status !== 'active') continue;
      const def = this.config.buildings.get(b.defId);
      if (def?.tradePost) best = Math.max(best, b.upgradeLevel);
    }
    return best; // -1 = no trading post
  }

  hasTradePost(): boolean {
    return this.bestTradeStage() >= 0;
  }

  /** Per-unit sell/buy price for a resource at the current best trade tier (§7). */
  getTradeQuote(resource: ResourceId): { sell: number; buy: number } {
    const bal = this.config.balancing;
    const base = bal.exportRates[resource] ?? 0;
    const stage = this.bestTradeStage();
    const sell = stage < 0 ? 0 : base * (1 + stage * bal.tradeSellBonusPerLevel);
    // Buying is deliberately expensive (markup on the *base* rate, no tier
    // discount) so production stays the real source and trade can't be farmed.
    const buy = base * bal.tradeBuyMarkup;
    return { sell: Math.round(sell * 100) / 100, buy: Math.round(buy * 100) / 100 };
  }

  /** Sell stored resources for money at the current tier (§7). */
  sellResource(resource: ResourceId, amount: number): CommandResult {
    if (resource === 'money' || !Number.isFinite(amount) || amount <= 0) return fail('invalid');
    if (!this.hasTradePost()) return fail('locked');
    const have = this.state.resources[resource];
    const qty = Math.min(amount, have);
    if (qty <= 0) return fail('insufficient');
    const { sell } = this.getTradeQuote(resource);
    if (sell <= 0) return fail('invalid');
    this.state.resources[resource] -= qty;
    this.state.resources.money += qty * sell;
    this.state.stats.tradeEarnings += qty * sell;
    updateQuests(this.state, this.config);
    this.notify({ type: 'change' });
    return ok;
  }

  /** Buy resources for money at the (marked-up) tier price, respecting storage (§7). */
  buyResource(resource: ResourceId, amount: number): CommandResult {
    if (resource === 'money' || !Number.isFinite(amount) || amount <= 0) return fail('invalid');
    if (!this.hasTradePost()) return fail('locked');
    const cap = this.derived.storageCaps[resource] ?? 0;
    const room = Math.max(0, cap - this.state.resources[resource]);
    const qty = Math.min(amount, room);
    if (qty <= 0) return fail('invalid'); // no storage room for it
    const { buy } = this.getTradeQuote(resource);
    const cost = qty * buy;
    if (this.state.resources.money < cost) return fail('insufficient');
    this.state.resources.money -= cost;
    this.state.resources[resource] += qty;
    this.notify({ type: 'change' });
    return ok;
  }

  // ---- Stadtarbeit (v0.21, § aktives Stadtmanagement) ----------------------
  // Short hands-on activities: deliveries and inspections put clickable targets
  // on the map, decisions open a trade-off popup, trade contracts rotate at the
  // trading post. Every reward flows through a command here, so activity income
  // is inherently active — nothing pays out offline.

  /** Activity definitions unlocked at the current level (UI list). */
  getActivityDefs(): ActivityDef[] {
    return this.config.activities.activities.filter((a) => a.unlockLevel <= this.state.level.current);
  }

  /** Cooldown readyAt timestamp for an activity (0 = ready). */
  activityReadyAt(defId: string): number {
    return this.state.activities.cooldowns[defId] ?? 0;
  }

  /** Open/done targets of the running activity — the renderer's map markers. */
  getActivityTargets(): { buildingId: string; done: boolean }[] {
    return this.state.activities.active?.targets ?? [];
  }

  /** Start a delivery/inspection run: picks targets and puts them on the map. */
  startActivity(defId: string): CommandResult {
    const def = this.config.activities.activities.find((a) => a.id === defId);
    if (!def || def.type === 'decision') return fail('not_found');
    if (def.unlockLevel > this.state.level.current) return fail('locked');
    if (this.state.activities.active) return fail('invalid');
    const now = this.state.meta.lastSimTime;
    if (now < this.activityReadyAt(defId)) return fail('cooldown');
    const candidates = this.activityCandidates(def);
    if (candidates.length < 2) return fail('invalid'); // not enough of a city yet
    const { min, max } = def.targetCount ?? { min: 3, max: 4 };
    const targets = pickTargets(this.state, candidates, min, max).map((buildingId) => ({ buildingId, done: false }));
    this.state.activities.active = {
      defId,
      startedAt: now,
      expiresAt: def.timeLimitSec !== undefined ? now + def.timeLimitSec * 1000 : undefined,
      targets,
    };
    this.notify({ type: 'change' });
    return ok;
  }

  /**
   * One map-target click of the running activity (deliver to / inspect this
   * building). Deliveries consume their per-stop cost; the final target
   * completes the run and pays out.
   */
  progressActivity(buildingId: string): CommandResult {
    const active = this.state.activities.active;
    if (!active) return fail('invalid');
    const def = this.config.activities.activities.find((a) => a.id === active.defId);
    if (!def) return fail('not_found');
    const target = active.targets.find((t) => t.buildingId === buildingId && !t.done);
    if (!target) return fail('invalid');
    if (def.costPerTarget) {
      const spent = spendCost(this.state, def.costPerTarget, `activity_${def.id}`);
      if (!spent.ok) return fail('insufficient');
    }
    target.done = true;
    if (active.targets.every((t) => t.done)) {
      // Speed bonus: finishing inside the (optional) time limit pays extra.
      // Missing it never fails the run — relaxed by design.
      const now = this.state.meta.lastSimTime;
      const tier = rewardTierFor(def, this.state.level.current);
      const onTime = active.expiresAt === undefined || now <= active.expiresAt;
      const factor = onTime ? (def.speedBonusFactor ?? 1) : 1;
      this.state.activities.active = undefined;
      this.payoutActivity(def, Math.round(tier.money * factor), Math.round(tier.xp * factor), tier);
    } else {
      this.notify({ type: 'change' });
    }
    return ok;
  }

  /** Cancel the running activity. No payout, no cooldown — just tidy up. */
  abandonActivity(): CommandResult {
    if (!this.state.activities.active) return fail('invalid');
    this.state.activities.active = undefined;
    this.notify({ type: 'change' });
    return ok;
  }

  /** Resolve a mayor decision (§ Entscheidungen): pay the cost, take the effect. */
  chooseDecision(defId: string, optionId: string): CommandResult {
    const def = this.config.activities.activities.find((a) => a.id === defId);
    if (!def || def.type !== 'decision') return fail('not_found');
    if (def.unlockLevel > this.state.level.current) return fail('locked');
    const now = this.state.meta.lastSimTime;
    if (now < this.activityReadyAt(defId)) return fail('cooldown');
    const option = def.options?.find((o) => o.id === optionId);
    if (!option) return fail('invalid');
    if (option.cost) {
      const spent = spendCost(this.state, option.cost, `activity_${def.id}_${option.id}`);
      if (!spent.ok) return fail('insufficient');
    }
    if (option.buff) this.pushBuff(option.buff);
    const tier = rewardTierFor(def, this.state.level.current);
    const money = (option.reward?.money ?? 0) + tier.money;
    const xp = (option.reward?.xp ?? 0) + tier.xp;
    this.payoutActivity(def, money, xp, tier);
    return ok;
  }

  /**
   * The rotating trade contracts (§ Handelsaufträge), with fulfillment and
   * affordability flags for the UI. Empty without an active trading post.
   */
  getTradeContracts(): (TradeContractOffer & { fulfilled: boolean; affordable: boolean })[] {
    if (!this.hasTradePost()) return [];
    const offers = currentTradeContracts(this.state, this.config.activities, this.state.meta.lastSimTime);
    return offers.map((offer) => ({
      ...offer,
      fulfilled: this.state.activities.fulfilledContracts.includes(offer.id),
      affordable: canAfford(this.state, offer.template.demands),
    }));
  }

  /** Deliver a contract's demanded goods and collect the payout. Once per rotation. */
  fulfillTradeContract(offerId: string): CommandResult {
    if (!this.hasTradePost()) return fail('locked');
    const offers = currentTradeContracts(this.state, this.config.activities, this.state.meta.lastSimTime);
    const offer = offers.find((o) => o.id === offerId);
    if (!offer) return fail('not_found'); // unknown or from an expired rotation
    if (this.state.activities.fulfilledContracts.includes(offerId)) return fail('invalid');
    const spent = spendCost(this.state, offer.template.demands, `trade_contract_${offer.template.id}`);
    if (!spent.ok) return fail('insufficient');
    // Keep only this rotation's ids so the list can't grow unbounded.
    const currentIds = new Set(offers.map((o) => o.id));
    this.state.activities.fulfilledContracts = this.state.activities.fulfilledContracts.filter((id) => currentIds.has(id));
    this.state.activities.fulfilledContracts.push(offerId);
    this.state.stats.tradeEarnings += offer.template.rewardMoney;
    if (offer.template.rewardGold) grantGold(this.state, offer.template.rewardGold, `trade_contract_${offer.template.id}`);
    this.payoutActivity(
      { id: offer.template.id, cooldownSec: 0 } as ActivityDef,
      offer.template.rewardMoney,
      offer.template.rewardXp,
      undefined,
      /* setCooldown */ false,
    );
    return ok;
  }

  /** Candidate buildings for a delivery (homes) or inspection (flagged, then any). */
  private activityCandidates(def: ActivityDef): string[] {
    const homes: string[] = [];
    const flagged: string[] = [];
    const others: string[] = [];
    for (const b of Object.values(this.state.buildings)) {
      if (b.status !== 'active') continue;
      const d = this.config.buildings.get(b.defId);
      if (!d || d.category === 'roads' || d.category === 'decoration') continue;
      if (d.category === 'residential') homes.push(b.id);
      if (def.type === 'inspection') {
        if (this.getBuildingMarker(b.id) === 'problem') flagged.push(b.id);
        else others.push(b.id);
      }
    }
    if (def.type === 'delivery') return homes;
    // Inspection prefers real problems and pads with spot checks.
    return flagged.length >= (def.targetCount?.min ?? 3) ? flagged : [...flagged, ...others];
  }

  /** Shared payout path: money/xp/extras, stats, cooldown, notifications. */
  private payoutActivity(
    def: Pick<ActivityDef, 'id' | 'cooldownSec'>,
    money: number,
    xp: number,
    tier?: ActivityRewardTier,
    setCooldown = true,
  ): void {
    const now = this.state.meta.lastSimTime;
    if (money > 0) grantResources(this.state, { money }, this.derived.storageCaps, `activity_${def.id}`);
    if (tier?.resources) grantResources(this.state, tier.resources, this.derived.storageCaps, `activity_${def.id}`);
    if (tier?.gold) grantGold(this.state, tier.gold, `activity_${def.id}`);
    if (tier?.buff) this.pushBuff(tier.buff);
    const levelUps = xp > 0 ? addXp(this.state, this.config, this.derived, xp) : 0;
    this.state.stats.activitiesCompleted += 1;
    if (setCooldown && def.cooldownSec > 0) this.state.activities.cooldowns[def.id] = now + def.cooldownSec * 1000;
    updateQuests(this.state, this.config);
    if (levelUps > 0) this.notify({ type: 'levelUp', level: this.state.level.current });
    this.notify({ type: 'activityCompleted', defId: def.id, money, xp });
    this.notify({ type: 'change' });
  }

  private pushBuff(buff: { kind: 'happiness' | 'tax' | 'production' | 'foodDistribution'; amount: number; durationSec: number }): void {
    this.state.buffs.push({
      id: newId(this.state, 'buff'),
      kind: buff.kind,
      amount: buff.amount,
      endsAt: this.state.meta.lastSimTime + buff.durationSec * 1000,
    });
  }

  // ---- Prototype cheats (§10, gated behind the debugTools flag) ------------

  /** Grant money for balancing tests. Debug only. */
  debugGrantMoney(amount: number): CommandResult {
    if (!this.config.features.debugTools) return fail('feature_disabled');
    grantResources(this.state, { money: amount }, this.derived.storageCaps, 'debug_money_grant');
    this.notify({ type: 'change' });
    return ok;
  }

  /** Fill every storable resource to its cap. Debug only. */
  debugFillResources(): CommandResult {
    if (!this.config.features.debugTools) return fail('feature_disabled');
    for (const res of ['wood', 'stone', 'food', 'freshwater'] as const) {
      const cap = this.derived.storageCaps[res] ?? 0;
      if (cap > 0 && cap !== Number.POSITIVE_INFINITY) this.state.resources[res] = cap;
    }
    this.notify({ type: 'change' });
    return ok;
  }

  /**
   * Instantly complete in-progress construction. `kind` picks fresh builds,
   * upgrades, or both (§10) — an upgrade is identified by its `targetUpgradeLevel`.
   * Reuses the normal completion path (tick), so effects/XP apply exactly as if
   * the timer had elapsed. Debug only.
   */
  debugFinishConstruction(kind: 'all' | 'build' | 'upgrade' = 'all'): CommandResult {
    if (!this.config.features.debugTools) return fail('feature_disabled');
    const now = this.state.meta.lastSimTime;
    let touched = false;
    for (const b of Object.values(this.state.buildings)) {
      if (b.status !== 'constructing' || b.constructionEndsAt === undefined) continue;
      const isUpgrade = b.targetUpgradeLevel !== undefined;
      if (kind === 'build' && isUpgrade) continue;
      if (kind === 'upgrade' && !isUpgrade) continue;
      b.constructionEndsAt = now;
      touched = true;
    }
    if (touched) this.update(now + 1);
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

  /**
   * Whether a building was just unlocked at the current level and hasn't been
   * built yet — drives the "Neu" badge (§7). No persisted "seen" flag needed: the
   * badge naturally clears when the player builds one or the city levels up.
   */
  isNewBuilding(defId: string): boolean {
    const def = this.config.buildings.get(defId);
    if (!def) return false;
    return def.unlockLevel === this.state.level.current && (this.state.stats.built[defId] ?? 0) === 0;
  }

  /** Building def-ids unlocked at a given level (for the level-up announcement). */
  unlocksAtLevel(level: number): string[] {
    return this.config.levels.find((l) => l.level === level)?.unlocks ?? [];
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
   * Income without temporary boosts (§20): the reliable per-minute figure a
   * project's payback should be judged against, so a fleeting festival buff
   * doesn't make an unaffordable project look reachable. `hasIncomeBuffs` tells
   * the UI whether the two figures currently differ (show the "with boosts" line).
   */
  getStableIncome(): IncomeBreakdown {
    return computeIncome(this.state, this.config, this.derived, false);
  }

  hasIncomeBuffs(): boolean {
    return this.state.buffs.some((b) => b.kind === 'tax');
  }

  /**
   * Generic coverage overlay for a selected supply building (§1) — undefined if
   * the building projects no radius coverage.
   */
  getCoverageOverlay(buildingId: string): CoverageOverlay | undefined {
    return coverageOverlay(this.state, this.config, this.derived, buildingId);
  }

  /** Problems & benefits for a building (§2/§4/§12) — sheet + map markers. */
  getBuildingDiagnostics(buildingId: string): Diagnosis[] {
    const b = this.state.buildings[buildingId];
    if (!b) return [];
    return buildingDiagnostics(this.state, this.config, this.derived, b);
  }

  /** The single marker (if any) to float above a building on the map (§4). */
  getBuildingMarker(buildingId: string): 'problem' | 'upgrade' | undefined {
    return primaryMarker(this.getBuildingDiagnostics(buildingId));
  }
}
