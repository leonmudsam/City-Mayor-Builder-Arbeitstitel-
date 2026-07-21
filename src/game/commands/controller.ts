import type { GameConfig } from '../config/index.ts';
import type {
  ActivityDef,
  ActivityQuality,
  ActivityRewardTier,
  ActivityVehicleDef,
  BuildingUpgradeDef,
  DriveVehicle,
} from '../config/types.ts';
import {
  currentTradeContracts,
  pickTargets,
  QUALITY_SCALE,
  resolveQuality,
  rewardTierFor,
  type TradeContractOffer,
} from '../simulation/activities.ts';
import type { GameState, RegionId, ResourceId, TerrainType } from '../types.ts';
import { recomputeDerived, type Derived } from '../simulation/derived.ts';
import { advance, moveInPerMin } from '../simulation/tick.ts';
import { updateQuests, objectiveTarget, questFocus, type QuestFocus } from '../simulation/quests.ts';
import { validatePlacement, isConnectedToRoad, type PlacementError } from '../buildings/placement.ts';
import { locationBonusPct } from '../buildings/location.ts';
import { demolishRefund, effectiveBuildCost, isFirstBuildDiscounted } from '../buildings/effects.ts';
import { buildLimitAt, countOf, nextLimitLevel } from '../buildings/limits.ts';
import { coverageOverlay, type CoverageOverlay } from '../buildings/coverage.ts';
import { buildingDiagnostics, primaryMarker, type Diagnosis } from '../buildings/diagnostics.ts';
import { canAfford, grantGold, grantResources, spendCost, spendGold } from '../economy/economyService.ts';
import { computeIncome, type IncomeBreakdown } from '../economy/income.ts';
import { addXp } from '../progression/levels.ts';
import {
  clearTiles,
  findDistrictCenterSpot,
  isRegionAdjacentToUnlocked,
  occupyTiles,
  rebuildOccupancyIndex,
  regionHasTerrain,
  regionRoadCostFactorAt,
  regionUnlockCost,
  worldTerrainAt,
} from '../map/world.ts';
import { BAKED_REGIONS, regionIdAt, startRegionConfig } from '../config/startRegion.config.ts';
import {
  analyseActivityRouteFrom,
  analyseManualActivityRouteFrom,
  activityRouteRoadAnchorsFrom,
  buildingCenter,
  targetOrderOnPath,
  type RouteAnalysis,
  type RoutePointInput,
  type RouteRoadAnchors,
} from '../activities/routeAnalysis.ts';
import { regionPreview, type RegionPreview } from '../regions/regionPreview.ts';
import { analyseRoadPath, type RoadPlanPreview } from '../roads/roadPlanning.ts';
import {
  cargoPlanFor,
  evaluateCargoRoute,
  resolveCargoModel,
  evaluateInfrastructure,
  type CargoPlan,
  type CargoRouteEvaluation,
  type InfrastructureEvaluation,
  type InfrastructureWarning,
} from '../activities/logistics.ts';
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
  | {
      type: 'activityCompleted';
      defId: string;
      money: number;
      xp: number;
      quality?: ActivityQuality;
      result?: {
        elapsedMs: number;
        distanceTiles?: number;
        efficiencyScore?: number;
        roadCoverage?: number;
        vehicle?: DriveVehicle;
      };
    }
  | { type: 'change' };

/** Why a mission can't be started right now (§16.1 board state). */
export type ActivityUnavailableReason = 'cooldown' | 'missing_building' | 'no_targets' | 'busy';

/** One row of the Stadtarbeit mission board: a def plus its live availability. */
export interface ActivityBoardEntry {
  def: ActivityDef;
  available: boolean;
  reason?: ActivityUnavailableReason;
  /** Cooldown readyAt timestamp (only meaningful when reason === 'cooldown'). */
  readyAt: number;
  /** Level-scaled base reward preview (before quality scaling). */
  reward: { money: number; xp: number };
}

/** Platzierungs-/Verschiebe-Diagnose für die UI-Vorschau (§ Overhaul 3.0 / C4). */
export interface PlacementDiagnostics {
  /** Gesamturteil: darf hier gebaut/verschoben werden? */
  valid: boolean;
  /** Grund, falls ungültig (gleiche Codes wie `validatePlacement`). */
  reason?: PlacementError;
  terrain: TerrainType;
  regionId: number;
  /** Orthogonaler Anschluss an das verbundene Straßennetz. */
  roadAccess: boolean;
  /** Standort-/Regionsbonus in Prozentpunkten auf die Produktion (kann negativ sein). */
  locationBonusPct: number;
  buildCost: Partial<Record<ResourceId, number>>;
}

/** Read-only route-planning snapshot for the UI. No RNG or save mutation. */
export interface ActivityRoutePlan {
  defId: string;
  sourceBuildingId?: string;
  targetBuildingIds: string[];
}

/** Optionaler, vollständig validierter Plan für eine Fahrmission. */
export interface ActivityStartPlan {
  vehicle?: DriveVehicle;
  roadPath?: { x: number; y: number }[];
}

/** Gebündeltes, RNG-neutrales Read-Model für die Planungsoberfläche. */
export interface ActivityPlanningContext {
  def: ActivityDef;
  sourceBuildingIds: string[];
  targetBuildingIds: string[];
  vehicles: ActivityVehicleDef[];
  reward: { money: number; xp: number };
}

/** Live-Projektion der gezeichneten Route; keine automatisch ergänzten Wege. */
export interface ActivityRoutePreview {
  anchors: RouteRoadAnchors;
  reachedTargetIds: string[];
  orderedTargetIds: string[];
  analysis?: RouteAnalysis;
  cargoPlan?: CargoPlan;
  cargoRoute?: CargoRouteEvaluation;
  infrastructure?: InfrastructureEvaluation;
  complete: boolean;
}

/**
 * Ausführungs-Momentaufnahme der laufenden Fahrmission (§ Stadtarbeit-Logik 2.0,
 * L3). Reine Read-Projektion für die 3D-/HUD-Ansicht: Zielfortschritt, noch an
 * der Quelle gehaltene Reserve und die rekonstruierte Kapazitäts-/Beladungsplanung.
 */
export interface ActivityExecutionSnapshot {
  defId: string;
  vehicle?: DriveVehicle;
  targetsTotal: number;
  targetsDone: number;
  reserved?: Partial<Record<ResourceId, number>>;
  cargo?: CargoPlan;
}

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
    // § v10 Slim-Save: Kachel-Belegung ist nicht mehr persistiert — den
    // Laufzeit-Index einmal aus den Gebäude-Footprints aufbauen.
    rebuildOccupancyIndex(state, config);
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
    rebuildOccupancyIndex(state, this.config);
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

  placeBuilding(defId: string, x: number, y: number, rotation?: 0 | 90 | 180 | 270): CommandResult {
    const def = this.config.buildings.get(defId);
    if (!def) return fail('not_found');
    const placementError = validatePlacement(this.state, this.config, this.derived, def, x, y);
    if (placementError) return fail(placementError);
    // Escalating cost for anti-spam utilities (warehouses, §7) or a first-build
    // discount for core economy buildings (§ faster early game). Lifetime count
    // gates the discount so demolish/rebuild can't farm it. Straßen kosten in
    // manchen Regionen mehr (§ Welt 2.0: Gebirge) — der Faktor greift genau hier.
    const cost = this.getBuildCost(defId, x, y);
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
      // Cosmetic facing only (§ Gebäude-Rotation) — omit entirely for 0° so saves
      // stay minimal; footprint/placement were already validated above unrotated.
      ...(rotation ? { rotation } : {}),
    };
    occupyTiles(this.state, x, y, def.size.w, def.size.h, id);
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
    clearTiles(this.state, b.x, b.y, def.size.w, def.size.h, buildingId);
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
    clearTiles(this.state, b.x, b.y, def.size.w, def.size.h, buildingId);
    b.x = x;
    b.y = y;
    occupyTiles(this.state, x, y, def.size.w, def.size.h, buildingId);
    this.afterStructuralChange();
    return ok;
  }

  /**
   * Regions-Vorschau (§ C5): welche Gebäude der Regionscharakter begünstigt.
   * Reine Config-Projektion (kein State/RNG/Save) für den Regionsdialog.
   */
  regionPreview(id: RegionId): RegionPreview | undefined {
    return regionPreview(id);
  }

  unlockRegion(id: RegionId): CommandResult {
    const region = this.state.world.regions[String(id)];
    if (!region || region.status === 'unlocked') return fail('invalid');
    // § Welt 2.0: jede Freischaltung ist eine strategische Entscheidung aus der
    // RegionDefinition — Teaser-Inseln nie, Level-Gate und Voraussetzungs-
    // Regionen (z. B. Hochgebirgskern nur über die Randgebirge).
    const def = this.config.regions.get(id);
    if (!def || !def.unlockable) return fail('invalid');
    if (this.state.level.current < def.unlockLevel) return fail('locked');
    for (const prereq of def.prerequisiteRegionIds ?? []) {
      if (this.state.world.regions[String(prereq)]?.status !== 'unlocked') return fail('locked');
    }
    if (!isRegionAdjacentToUnlocked(this.state, id)) return fail('invalid');
    const cost = regionUnlockCost(this.config, id);
    const spend = spendCost(this.state, { money: cost }, 'unlock_region');
    if (!spend.ok) return fail('insufficient');
    region.status = 'unlocked';
    // Join the district of an adjacent unlocked region, so a far quarter (the
    // river district) grows coherently instead of everything reading as 'main'.
    const baked = BAKED_REGIONS[id - 1];
    for (const n of baked?.adjacent ?? []) {
      const nr = this.state.world.regions[String(n)];
      if (nr?.status === 'unlocked' && nr.districtId !== 'main') { region.districtId = nr.districtId; break; }
    }
    this.state.stats.regionsUnlocked += 1;
    addXp(this.state, this.config, this.derived, 30);
    this.afterStructuralChange();
    return ok;
  }

  /**
   * Found the river district — the first far expansion (§8). A one-off project
   * that plants a district centre in a locked river landscape: it unlocks the
   * region as a new district and seeds a fresh road network there, so the river
   * quarter is a self-contained build area, not a 40-tile road from downtown.
   */
  foundDistrict(id: RegionId): CommandResult {
    const bal = this.config.balancing;
    if (this.state.level.current < bal.districtUnlockLevel) return fail('locked');
    const region = this.state.world.regions[String(id)];
    if (!region || region.status === 'unlocked') return fail('invalid');
    if (this.config.regions.get(id)?.unlockable === false) return fail('invalid'); // keine Teaser-Insel
    if (!regionHasTerrain(id, 'river')) return fail('invalid'); // must be a river landscape
    if (Object.values(this.state.world.districts).some((d) => d.id === 'river')) return fail('invalid'); // one for now
    const centerDef = this.config.buildings.get('district_center');
    if (!centerDef) return fail('not_found');
    const spot = findDistrictCenterSpot(this.state, id, centerDef.size.w);
    if (!spot) return fail('terrain');
    const spend = spendCost(this.state, bal.districtFoundCost, 'found_district');
    if (!spend.ok) return fail('insufficient');

    region.status = 'unlocked';
    region.districtId = 'river';
    this.state.stats.regionsUnlocked += 1;
    // Plant the centre active at once, so it stores goods and seeds roads now.
    const centerId = newId(this.state, 'b');
    this.state.buildings[centerId] = { id: centerId, defId: 'district_center', x: spot.x, y: spot.y, upgradeLevel: 0, status: 'active' };
    occupyTiles(this.state, spot.x, spot.y, centerDef.size.w, centerDef.size.h, centerId);
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

  /**
   * Kartenfokus eines Bürgeranliegens (§ C3). Reine Read-Projektion — kein RNG,
   * keine Mutation, kein Save. Ermöglicht „Auf Karte zeigen" ohne erfundene Daten.
   */
  questFocus(questId: string): QuestFocus | undefined {
    return questFocus(this.state, this.config, questId);
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

  /**
   * The full mission board (§16.1): every unlocked activity with its level-
   * scaled reward preview and whether it can be started right now. Deliveries/
   * inspections need a source building and enough map targets and a free slot;
   * decisions gate on their own cooldown. No fixed cooldown blocks deliveries
   * or inspections anymore (§2) — availability is driven by the real city.
   */
  getActivityBoard(): ActivityBoardEntry[] {
    const now = this.state.meta.lastSimTime;
    const busy = this.state.activities.active !== undefined;
    return this.getActivityDefs().map((def) => {
      const tier = rewardTierFor(def, this.state.level.current);
      const readyAt = this.activityReadyAt(def.id);
      let available = true;
      let reason: ActivityUnavailableReason | undefined;
      if (def.cooldownSec && now < readyAt) {
        available = false;
        reason = 'cooldown';
      } else if (def.requiresAnyBuilding && !this.hasAnyBuilding(def.requiresAnyBuilding)) {
        available = false;
        reason = 'missing_building';
      } else if (def.type !== 'decision') {
        if (busy) {
          available = false;
          reason = 'busy';
        } else if (this.activityCandidates(def).length < 2) {
          available = false;
          reason = 'no_targets';
        }
      }
      return { def, available, ...(reason ? { reason } : {}), readyAt, reward: { money: tier.money, xp: tier.xp } };
    });
  }

  /** Cooldown readyAt timestamp for an activity (0 = ready). */
  activityReadyAt(defId: string): number {
    return this.state.activities.cooldowns[defId] ?? 0;
  }

  /** UI helper: does the city have any active building of these defIds? (§12 gated options.) */
  hasBuildingOfType(defIds: string[]): boolean {
    return this.hasAnyBuilding(defIds);
  }

  /** Open/done targets of the running activity — the renderer's map markers. */
  getActivityTargets(): { buildingId: string; done: boolean }[] {
    return this.state.activities.active?.targets ?? [];
  }

  /**
   * Preview the exact target set a route planner may reorder. A shallow state
   * clone gives `pickTargets` its own RNG seed, so opening/optimising the planner
   * can never reroll simulation state or affect a save.
   */
  getActivityRoutePlan(defId: string): ActivityRoutePlan | undefined {
    const def = this.config.activities.activities.find((activity) => activity.id === defId);
    if (!def || def.type === 'decision' || def.unlockLevel > this.state.level.current) return undefined;
    if (def.requiresAnyBuilding && !this.hasAnyBuilding(def.requiresAnyBuilding)) return undefined;
    const candidates = this.activityCandidates(def);
    if (candidates.length < 2) return undefined;
    const { min, max } = def.targetCount ?? { min: 3, max: 4 };
    const previewState = { ...this.state };
    const targetBuildingIds = pickTargets(previewState, candidates, min, max);
    const sourceBuildingId = def.requiresAnyBuilding
      ? Object.values(this.state.buildings)
          .filter((building) => building.status === 'active' && def.requiresAnyBuilding!.includes(building.defId))
          .sort((a, b) => a.id.localeCompare(b.id))[0]?.id
      : undefined;
    return {
      defId,
      ...(sourceBuildingId ? { sourceBuildingId } : {}),
      targetBuildingIds,
    };
  }

  private activityRouteSource(defId: string): RoutePointInput | undefined {
    const def = this.config.activities.activities.find((activity) => activity.id === defId);
    if (!def) return undefined;
    const sourceId = def.requiresAnyBuilding
      ? Object.values(this.state.buildings)
          .filter((building) => building.status === 'active' && def.requiresAnyBuilding!.includes(building.defId))
          .sort((a, b) => a.id.localeCompare(b.id))[0]?.id
      : undefined;
    const sourceCenter = sourceId ? buildingCenter(this.state, this.config, sourceId) : undefined;
    if (sourceCenter) return { id: 'source', ...sourceCenter };
    const townHall = Object.values(this.state.buildings).find((building) => building.defId === 'town_hall');
    const townHallCenter = townHall ? buildingCenter(this.state, this.config, townHall.id) : undefined;
    return townHallCenter
      ? { id: 'source', ...townHallCenter }
      : { id: 'source', x: startRegionConfig.townHall.x + 2.5, y: startRegionConfig.townHall.y + 2.5 };
  }

  /**
   * Kanonische Routenbewertung für den Stadtarbeit-Planer (§ Overhaul 3.0 / C2).
   * Reine Read-Projektion auf dem ECHTEN Straßengraphen (`derived.roadNetwork`)
   * — kein RNG, keine Mutation, kein Save. Ersetzt die frühere UI-Schätzung
   * (`TODO(CLAUDE_LOGIC)`). `orderedTargetIds` ist die vom Spieler gewählte
   * Zielreihenfolge; die Quelle ist das Quellgebäude der Aktivität, sonst das
   * Rathaus. Ergebnis ist eine Prognose (Belohnung entscheidet weiter die
   * Ausführungsqualität), damit die Balance nicht aus der UI verschoben wird.
   */
  analyseActivityRoute(defId: string, orderedTargetIds: string[]): RouteAnalysis | undefined {
    const def = this.config.activities.activities.find((a) => a.id === defId);
    if (!def) return undefined;
    const source = this.activityRouteSource(defId);
    if (!source) return undefined;
    return analyseActivityRouteFrom(this.state, this.config, this.derived, source, orderedTargetIds);
  }

  /**
   * Quell-Ankergebäude einer Aktivität (Farm/Markt/Lager …) — dieselbe Wahl wie
   * `activityRouteSource`, aber als Gebäude-Id. `'town_hall'` als Fallback-Label.
   */
  private activitySourceBuildingId(def: ActivityDef): string {
    if (def.requiresAnyBuilding) {
      const source = Object.values(this.state.buildings)
        .filter((building) => building.status === 'active' && def.requiresAnyBuilding!.includes(building.defId))
        .sort((a, b) => a.id.localeCompare(b.id))[0];
      if (source) return source.id;
    }
    const townHall = Object.values(this.state.buildings).find((building) => building.defId === 'town_hall');
    return townHall?.id ?? 'town_hall';
  }

  /**
   * Ladungsplanung (§ Stadtarbeit-Logik 2.0, L2): Transportbedarf je Ziel und die
   * daraus nötigen Beladungen für die gewählte Fahrzeugklasse. Reine
   * Read-Projektion — zeigt, wann die Fahrzeugkapazität greift (Nachladen). Ändert
   * weder State noch die Auszahlung. `undefined` bei Aktivitäten ohne Ladung.
   */
  getActivityCargoPlan(defId: string, orderedTargetIds: string[], vehicle?: DriveVehicle): CargoPlan | undefined {
    const def = this.config.activities.activities.find((a) => a.id === defId);
    if (!def) return undefined;
    const selected = vehicle ?? this.state.activities.active?.vehicle ?? def.vehicle;
    const sourceId = this.activitySourceBuildingId(def);
    return cargoPlanFor(this.state, this.config, def, selected, sourceId, orderedTargetIds);
  }

  /** Alle realen Quellgebäude des Auftrags; die erste Id ist der Startanker. */
  getActivitySupplySources(defId: string): string[] {
    const def = this.config.activities.activities.find((activity) => activity.id === defId);
    if (!def) return [];
    const allowed = new Set(def.requiresAnyBuilding ?? ['town_hall']);
    return Object.values(this.state.buildings)
      .filter((building) => building.status === 'active' && allowed.has(building.defId))
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((building) => building.id);
  }

  /** Pflichtziele der laufenden Mission oder der RNG-neutralen Vorschau. */
  getActivityDeliveryTargets(defId: string): string[] {
    const active = this.state.activities.active;
    if (active?.defId === defId) return active.targets.map((target) => target.buildingId);
    return this.getActivityRoutePlan(defId)?.targetBuildingIds ?? [];
  }

  /** Für diesen Auftrag aktuell freigeschaltete, wählbare Config-Fahrzeuge. */
  getAvailableActivityVehicles(defId: string): ActivityVehicleDef[] {
    const def = this.config.activities.activities.find((activity) => activity.id === defId);
    if (!def) return [];
    const allowed = new Set(def.vehicleOptions ?? (def.vehicle ? [def.vehicle] : []));
    return this.config.activities.vehicles.filter(
      (vehicle) =>
        allowed.has(vehicle.id) &&
        !vehicle.future &&
        vehicle.unlockLevel <= this.state.level.current,
    );
  }

  /**
   * Zentraler Planungskontext für Codex/UI (§ Redesign 4.0). Er bündelt nur
   * vorhandene Controller-/Config-Daten und mutiert weder RNG noch Save.
   */
  getActivityPlanningContext(defId: string): ActivityPlanningContext | undefined {
    const board = this.getActivityBoard().find((entry) => entry.def.id === defId);
    if (!board || board.def.type === 'decision') return undefined;
    const targetBuildingIds = this.getActivityDeliveryTargets(defId);
    if (targetBuildingIds.length === 0) return undefined;
    return {
      def: board.def,
      sourceBuildingIds: this.getActivitySupplySources(defId),
      targetBuildingIds,
      vehicles: this.getAvailableActivityVehicles(defId),
      reward: board.reward,
    };
  }

  /**
   * Route/Cargo-Vorschau des Redesigns 4.0. Die Stoppreihenfolge entsteht aus
   * den tatsächlich berührten Straßenankern. Nachfüllungen zählen nur, wenn der
   * Weg den echten Quellanker erneut erreicht. Es wird keine Lücke ergänzt.
   */
  getActivityRoutePreview(
    defId: string,
    candidateTargetIds: string[],
    roadPath: readonly { x: number; y: number }[],
    vehicle?: DriveVehicle,
  ): ActivityRoutePreview | undefined {
    const anchors = this.getActivityRouteAnchors(defId, candidateTargetIds);
    if (!anchors) return undefined;
    const reachedTargetIds = targetOrderOnPath(anchors, candidateTargetIds, roadPath);
    const planningOrder = [
      ...reachedTargetIds,
      ...candidateTargetIds.filter((id) => !reachedTargetIds.includes(id)),
    ];
    const cargoPlan = this.getActivityCargoPlan(defId, planningOrder, vehicle);
    const def = this.config.activities.activities.find((activity) => activity.id === defId);
    const sourceBuildingId = def ? this.activitySourceBuildingId(def) : 'town_hall';
    const cargoRoute = cargoPlan
      ? evaluateCargoRoute(
          cargoPlan,
          { buildingId: sourceBuildingId, ...anchors.source },
          anchors.targets.map((anchor, index) => ({
            buildingId: candidateTargetIds[index]!,
            ...anchor,
          })),
          roadPath,
        )
      : undefined;
    const orderedTargetIds = cargoRoute?.orderedTargetIds ?? reachedTargetIds;
    const analysis =
      orderedTargetIds.length === candidateTargetIds.length
        ? this.analyseManualActivityRoute(defId, orderedTargetIds, roadPath, vehicle)
        : undefined;
    const infrastructure = analysis
      ? this.getActivityInfrastructure(defId, orderedTargetIds, vehicle, {
          ...(vehicle ? { vehicle } : {}),
          roadPath: roadPath.map((point) => ({ ...point })),
        })
      : undefined;
    return {
      anchors,
      reachedTargetIds,
      orderedTargetIds,
      ...(analysis ? { analysis } : {}),
      ...(cargoPlan ? { cargoPlan } : {}),
      ...(cargoRoute ? { cargoRoute } : {}),
      ...(infrastructure ? { infrastructure } : {}),
      complete: analysis !== undefined && (cargoRoute?.cargoValid ?? true),
    };
  }

  /**
   * Momentaufnahme der laufenden Fahrmission (§ Stadtarbeit-Logik 2.0, L3): reine
   * Read-Projektion für 3D-Ausführung/HUD. `undefined`, wenn keine Mission läuft.
   */
  getActivityExecutionSnapshot(): ActivityExecutionSnapshot | undefined {
    const active = this.state.activities.active;
    if (!active) return undefined;
    const cargo = this.getActivityCargoPlan(
      active.defId,
      active.targets.map((t) => t.buildingId),
      active.vehicle,
    );
    return {
      defId: active.defId,
      ...(active.vehicle ? { vehicle: active.vehicle } : {}),
      targetsTotal: active.targets.length,
      targetsDone: active.targets.filter((t) => t.done).length,
      ...(active.reserved ? { reserved: { ...active.reserved } } : {}),
      ...(cargo ? { cargo } : {}),
    };
  }

  /**
   * Infrastruktur-Bewertung einer geplanten Route (§ Stadtarbeit-Logik 2.0, L4 /
   * §19). Reine Read-Projektion: Leerfahrtanteil, Fahrzeugeignung, Quellenlage,
   * Lade-/Entladezeiten und textfreie Hinweiscodes — kein State, keine Auszahlung
   * (bleibt Anzeige, DECISIONS D-013). Optionaler `plan.roadPath` bewertet die
   * konkret gezeichnete Kette, sonst die automatische Reihenfolge-Analyse.
   * `undefined`, wenn Quelle/Ziele nicht auflösbar sind.
   */
  getActivityInfrastructure(
    defId: string,
    orderedTargetIds: string[],
    vehicle?: DriveVehicle,
    plan?: ActivityStartPlan,
  ): InfrastructureEvaluation | undefined {
    const def = this.config.activities.activities.find((a) => a.id === defId);
    if (!def) return undefined;
    const source = this.activityRouteSource(defId);
    if (!source) return undefined;
    const route =
      (plan?.roadPath
        ? analyseManualActivityRouteFrom(this.state, this.config, this.derived, source, orderedTargetIds, plan.roadPath)
        : undefined) ?? analyseActivityRouteFrom(this.state, this.config, this.derived, source, orderedTargetIds);
    if (!route) return undefined;
    const targets: { id: string; x: number; y: number }[] = [];
    for (const id of orderedTargetIds) {
      const center = buildingCenter(this.state, this.config, id);
      if (!center) return undefined;
      targets.push({ id, ...center });
    }
    const selected = vehicle ?? plan?.vehicle ?? this.state.activities.active?.vehicle ?? def.vehicle;
    const vehicleDef = selected ? this.config.activities.vehicles.find((v) => v.id === selected) : undefined;
    const cargo = cargoPlanFor(this.state, this.config, def, selected, this.activitySourceBuildingId(def), orderedTargetIds);
    const perishable = resolveCargoModel(def)?.perishable ?? false;
    return evaluateInfrastructure({
      source: { x: source.x, y: source.y },
      targets,
      route,
      ...(cargo ? { cargo } : {}),
      ...(vehicleDef ? { vehicle: vehicleDef } : {}),
      perishable,
    });
  }

  /**
   * Nur die textfreien Infrastruktur-Hinweise (§21 `getActivityInfrastructureWarnings`).
   * Dünne Projektion über `getActivityInfrastructure`; leeres Array, wenn nichts
   * auflösbar ist.
   */
  getActivityInfrastructureWarnings(
    defId: string,
    orderedTargetIds: string[],
    vehicle?: DriveVehicle,
    plan?: ActivityStartPlan,
  ): InfrastructureWarning[] {
    return this.getActivityInfrastructure(defId, orderedTargetIds, vehicle, plan)?.warnings ?? [];
  }

  /**
   * Konkrete Cargo-Simulation auf einer bereits gezeichneten Straßenkette (§
   * Stadtarbeit-Logik 2.0). Erkennt echte Quell-/Nachladekontakte und
   * Auslieferungen entlang des Pfades und misst die Leerfahrt aus den tatsächlich
   * leer gefahrenen Kacheln — die exakte Ergänzung zur planungsseitigen
   * `getActivityInfrastructure`. Reine Read-Projektion; `undefined`, wenn Anker/
   * Ladung nicht auflösbar sind.
   */
  getActivityCargoRoute(
    defId: string,
    orderedTargetIds: string[],
    roadPath: readonly { x: number; y: number }[],
    vehicle?: DriveVehicle,
  ): CargoRouteEvaluation | undefined {
    const def = this.config.activities.activities.find((a) => a.id === defId);
    if (!def) return undefined;
    const source = this.activityRouteSource(defId);
    if (!source) return undefined;
    const anchors = activityRouteRoadAnchorsFrom(this.state, this.config, this.derived, source, orderedTargetIds);
    if (!anchors) return undefined;
    // Reale Reihenfolge, in der der Pfad die Ziele berührt (statt der Klickreihenfolge).
    const pathOrder = targetOrderOnPath(anchors, orderedTargetIds, roadPath);
    const selected = vehicle ?? this.state.activities.active?.vehicle ?? def.vehicle;
    const plan = cargoPlanFor(this.state, this.config, def, selected, this.activitySourceBuildingId(def), pathOrder);
    if (!plan) return undefined;
    const anchorById = new Map(anchors.targets.map((a) => [a.id, a] as const));
    const targetAnchors = pathOrder
      .map((id) => {
        const anchor = anchorById.get(id);
        return anchor ? { buildingId: id, x: anchor.x, y: anchor.y } : undefined;
      })
      .filter((a): a is { buildingId: string; x: number; y: number } => a !== undefined);
    return evaluateCargoRoute(
      plan,
      { buildingId: this.activitySourceBuildingId(def), x: anchors.source.x, y: anchors.source.y },
      targetAnchors,
      roadPath,
    );
  }

  /** Straßenanker für die manuelle 2D-Planung; reine Read-Projektion. */
  getActivityRouteAnchors(defId: string, orderedTargetIds: string[]): RouteRoadAnchors | undefined {
    const source = this.activityRouteSource(defId);
    return source
      ? activityRouteRoadAnchorsFrom(this.state, this.config, this.derived, source, orderedTargetIds)
      : undefined;
  }

  /** Kanonische Analyse einer lückenlos vom Spieler gezeichneten Straßenkette. */
  analyseManualActivityRoute(
    defId: string,
    orderedTargetIds: string[],
    roadPath: readonly { x: number; y: number }[],
    vehicle?: DriveVehicle,
  ): RouteAnalysis | undefined {
    const source = this.activityRouteSource(defId);
    const analysis = source
      ? analyseManualActivityRouteFrom(this.state, this.config, this.derived, source, orderedTargetIds, roadPath)
      : undefined;
    if (!analysis || !vehicle) return analysis;
    const vehicleDef = this.config.activities.vehicles.find((candidate) => candidate.id === vehicle);
    if (!vehicleDef) return analysis;
    const speedFactor = 60 / vehicleDef.speedKph;
    const handlingFactor = 1 + Math.max(0, 4 - vehicleDef.handling) * 0.04;
    return {
      ...analysis,
      estimatedDurationMs: Math.round(analysis.estimatedDurationMs * speedFactor * handlingFactor),
    };
  }

  private validActivityVehicle(def: ActivityDef, vehicle: DriveVehicle): boolean {
    const allowed = def.vehicleOptions ?? (def.vehicle ? [def.vehicle] : []);
    const vehicleDef = this.config.activities.vehicles.find((candidate) => candidate.id === vehicle);
    return (
      allowed.includes(vehicle) &&
      vehicleDef !== undefined &&
      !vehicleDef.future &&
      vehicleDef.unlockLevel <= this.state.level.current
    );
  }

  /** Reorder the stops of an already running drive mission through a command. */
  setActiveActivityRoute(plannedTargetIds: string[], plan?: ActivityStartPlan): CommandResult {
    const active = this.state.activities.active;
    if (!active) return fail('invalid');
    const def = this.config.activities.activities.find((activity) => activity.id === active.defId);
    if (!def?.drive) return fail('invalid');
    const current = new Map(active.targets.map((target) => [target.buildingId, target]));
    if (
      plannedTargetIds.length !== active.targets.length ||
      new Set(plannedTargetIds).size !== plannedTargetIds.length ||
      plannedTargetIds.some((id) => !current.has(id))
    ) {
      return fail('invalid');
    }
    const selectedVehicle = plan?.vehicle ?? active.vehicle ?? def.vehicle;
    if (selectedVehicle && !this.validActivityVehicle(def, selectedVehicle)) return fail('locked');
    if (plan?.roadPath && !this.analyseManualActivityRoute(def.id, plannedTargetIds, plan.roadPath)) return fail('invalid');
    active.targets = plannedTargetIds.map((id) => current.get(id)!);
    if (selectedVehicle) active.vehicle = selectedVehicle;
    if (plan?.roadPath) active.plannedRoadPath = plan.roadPath.map((point) => ({ ...point }));
    this.notify({ type: 'change' });
    return ok;
  }

  /**
   * Start a delivery/inspection run. The optional planned order is validated
   * against the same live candidates and lets the route-planning UI feed its
   * optimised stop order back through the normal command boundary.
   */
  startActivity(defId: string, plannedTargetIds?: string[], plan?: ActivityStartPlan): CommandResult {
    const def = this.config.activities.activities.find((a) => a.id === defId);
    if (!def || def.type === 'decision') return fail('not_found');
    if (def.unlockLevel > this.state.level.current) return fail('locked');
    if (this.state.activities.active) return fail('invalid');
    const now = this.state.meta.lastSimTime;
    // No fixed cooldown gate for deliveries/inspections (§2) — only defs that
    // still carry a cooldownSec (none by default) are time-gated here.
    if (def.cooldownSec && now < this.activityReadyAt(defId)) return fail('cooldown');
    if (def.requiresAnyBuilding && !this.hasAnyBuilding(def.requiresAnyBuilding)) return fail('locked');
    const selectedVehicle = plan?.vehicle ?? def.vehicle;
    if (def.drive && selectedVehicle && !this.validActivityVehicle(def, selectedVehicle)) return fail('locked');
    const candidates = this.activityCandidates(def);
    if (candidates.length < 2) return fail('invalid'); // not enough of a city yet
    const { min, max } = def.targetCount ?? { min: 3, max: 4 };
    let selected: string[];
    if (plannedTargetIds) {
      const allowed = new Set(candidates);
      const unique = new Set(plannedTargetIds);
      if (
        plannedTargetIds.length < min ||
        plannedTargetIds.length > Math.min(max, candidates.length) ||
        unique.size !== plannedTargetIds.length ||
        plannedTargetIds.some((id) => !allowed.has(id))
      ) {
        return fail('invalid');
      }
      if (plan?.roadPath && !this.analyseManualActivityRoute(defId, plannedTargetIds, plan.roadPath)) {
        return fail('invalid');
      }
      // Keep RNG progression compatible with an ordinary start even though the
      // player-defined ordering is used for the actual targets.
      pickTargets(this.state, candidates, min, max);
      selected = [...plannedTargetIds];
    } else {
      selected = pickTargets(this.state, candidates, min, max);
    }
    if (!plannedTargetIds && plan?.roadPath && !this.analyseManualActivityRoute(defId, selected, plan.roadPath)) {
      return fail('invalid');
    }
    const targets = selected.map((buildingId) => ({ buildingId, done: false }));
    // §-Stadtarbeit-Logik 2.0 (L3): Ladungsaufträge reservieren ihre Ware upfront
    // an der Quelle — die volle `costPerTarget × Ziele` wird sofort aus dem Pool
    // entnommen und gehalten. Reicht der Vorrat nicht, startet die Mission gar
    // nicht (fair statt Abbruch auf halber Strecke, §18). Jede Auslieferung zieht
    // später aus dieser Reserve; ein Abbruch gibt den Rest zurück.
    const reserved = this.activityReservation(def, targets.length);
    if (reserved) {
      const spent = spendCost(this.state, reserved, `activity_reserve_${def.id}`);
      if (!spent.ok) return fail('insufficient');
    }
    this.state.activities.active = {
      defId,
      startedAt: now,
      targets,
      ...(reserved ? { reserved } : {}),
      ...(selectedVehicle ? { vehicle: selectedVehicle } : {}),
      ...(plan?.roadPath ? { plannedRoadPath: plan.roadPath.map((point) => ({ ...point })) } : {}),
      ...(def.timeLimitSec !== undefined ? { expiresAt: now + def.timeLimitSec * 1000 } : {}),
    };
    this.notify({ type: 'change' });
    return ok;
  }

  /**
   * Upfront an der Quelle zu reservierende Ladung (§ Stadtarbeit-Logik 2.0, L3):
   * `costPerTarget × Zielanzahl` je Ressource. `undefined`, wenn die Aktivität
   * nichts verbraucht (Feuerwehr/Polizei/Inspektion).
   */
  private activityReservation(def: ActivityDef, targetCount: number): Partial<Record<ResourceId, number>> | undefined {
    if (!def.costPerTarget) return undefined;
    const reserved: Partial<Record<ResourceId, number>> = {};
    for (const [res, amount] of Object.entries(def.costPerTarget)) {
      if ((amount ?? 0) > 0) reserved[res as ResourceId] = (amount ?? 0) * targetCount;
    }
    return Object.keys(reserved).length > 0 ? reserved : undefined;
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
    // Drive missions follow their planned, numbered stop order. Inspections
    // remain free-form so the established click-any-marker interaction stays.
    const target = def.drive
      ? active.targets.find((candidate) => !candidate.done)
      : active.targets.find((candidate) => candidate.buildingId === buildingId && !candidate.done);
    if (target?.buildingId !== buildingId) return fail('invalid');
    if (def.costPerTarget) {
      if (active.reserved) {
        // §-Stadtarbeit-Logik 2.0 (L3): Ware wurde upfront an der Quelle
        // reserviert — die Auslieferung zieht aus dieser Reserve, nicht aus dem
        // Pool. Die Reserve deckt jede Auslieferung exakt (bei Start gesichert).
        for (const [res, amount] of Object.entries(def.costPerTarget)) {
          const id = res as ResourceId;
          active.reserved[id] = Math.max(0, (active.reserved[id] ?? 0) - (amount ?? 0));
        }
      } else {
        // Alt-Save/Legacy-Pfad ohne Reservierung: wie bisher direkt aus dem Pool.
        const spent = spendCost(this.state, def.costPerTarget, `activity_${def.id}`);
        if (!spent.ok) return fail('insufficient');
      }
    }
    target.done = true;
    if (active.targets.every((t) => t.done)) {
      // Quality grade (§6): deliveries are scored Bronze/Silber/Gold on speed
      // against their time limit, inspections settle at silver. Missing the
      // limit never fails the run — it just drops the grade to bronze.
      const now = this.state.meta.lastSimTime;
      const tier = rewardTierFor(def, this.state.level.current);
      const quality = resolveQuality(def, active.startedAt, now);
      const scale = QUALITY_SCALE[quality];
      const routeAnalysis = active.plannedRoadPath
        ? this.analyseManualActivityRoute(
            def.id,
            active.targets.map((candidate) => candidate.buildingId),
            active.plannedRoadPath,
            active.vehicle,
          )
        : undefined;
      const result = {
        elapsedMs: Math.max(0, now - active.startedAt),
        ...(routeAnalysis
          ? {
              distanceTiles: routeAnalysis.distanceTiles,
              efficiencyScore: routeAnalysis.efficiencyScore,
              roadCoverage: routeAnalysis.roadCoverage,
            }
          : {}),
        ...(active.vehicle ? { vehicle: active.vehicle } : {}),
      };
      delete this.state.activities.active;
      this.payoutActivity(
        def,
        Math.round(tier.money * scale.money),
        Math.round(tier.xp * scale.xp),
        tier,
        true,
        quality,
        result,
      );
    } else {
      this.notify({ type: 'change' });
    }
    return ok;
  }

  /**
   * Cancel the running activity. No payout, no cooldown — just tidy up. Noch nicht
   * ausgelieferte, an der Quelle reservierte Ladung (§ Stadtarbeit-Logik 2.0, L3)
   * wandert in den Pool zurück (§5: Abbruch gibt Reservierungen frei), gedeckelt
   * durch die Lagerkapazität wie jede andere Gutschrift.
   */
  abandonActivity(): CommandResult {
    const active = this.state.activities.active;
    if (!active) return fail('invalid');
    if (active.reserved) {
      grantResources(this.state, active.reserved, this.derived.storageCaps, `activity_refund_${active.defId}`);
    }
    delete this.state.activities.active;
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
    if (option.requiresAnyBuilding && !this.hasAnyBuilding(option.requiresAnyBuilding)) return fail('locked');
    if (option.cost) {
      const spent = spendCost(this.state, option.cost, `activity_${def.id}_${option.id}`);
      if (!spent.ok) return fail('insufficient');
    }
    // A decision can carry several simultaneous effects (§12): a single legacy
    // `buff` and/or a `buffs[]` list of trade-off effects. Apply them all.
    if (option.buff) this.pushBuff(option.buff);
    if (option.buffs) for (const buff of option.buffs) this.pushBuff(buff);
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

  /** True if the city has at least one active building of any of these defIds. */
  private hasAnyBuilding(defIds: string[]): boolean {
    const wanted = new Set(defIds);
    return Object.values(this.state.buildings).some((b) => b.status === 'active' && wanted.has(b.defId));
  }

  /** Candidate buildings for a delivery (homes) or inspection (flagged, then any). */
  private activityCandidates(def: ActivityDef): string[] {
    // Explicit target selectors (§ A6 Fahr-Minispiele): a drive mission may aim
    // at specific def ids (log haul → Lager) or categories (fire → Wohn-/Gewerbe).
    const wantDefIds = def.targetDefIds ? new Set(def.targetDefIds) : undefined;
    const wantCats = def.targetCategories ? new Set(def.targetCategories) : undefined;
    const homes: string[] = [];
    const flagged: string[] = [];
    const others: string[] = [];
    const selected: string[] = [];
    for (const b of Object.values(this.state.buildings)) {
      if (b.status !== 'active') continue;
      const d = this.config.buildings.get(b.defId);
      if (!d || d.category === 'roads' || d.category === 'decoration') continue;
      if (d.category === 'residential') homes.push(b.id);
      if (wantDefIds?.has(b.defId) || wantCats?.has(d.category)) selected.push(b.id);
      if (def.type === 'inspection') {
        if (this.getBuildingMarker(b.id) === 'problem') flagged.push(b.id);
        else others.push(b.id);
      }
    }
    if (wantDefIds || wantCats) return selected;
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
    quality?: ActivityQuality,
    result?: {
      elapsedMs: number;
      distanceTiles?: number;
      efficiencyScore?: number;
      roadCoverage?: number;
      vehicle?: DriveVehicle;
    },
  ): void {
    const now = this.state.meta.lastSimTime;
    if (money > 0) grantResources(this.state, { money }, this.derived.storageCaps, `activity_${def.id}`);
    if (tier?.resources) grantResources(this.state, tier.resources, this.derived.storageCaps, `activity_${def.id}`);
    if (tier?.gold) grantGold(this.state, tier.gold, `activity_${def.id}`);
    if (tier?.buff) this.pushBuff(tier.buff);
    const levelUps = xp > 0 ? addXp(this.state, this.config, this.derived, xp) : 0;
    this.state.stats.activitiesCompleted += 1;
    if (setCooldown && (def.cooldownSec ?? 0) > 0) this.state.activities.cooldowns[def.id] = now + (def.cooldownSec ?? 0) * 1000;
    updateQuests(this.state, this.config);
    if (levelUps > 0) this.notify({ type: 'levelUp', level: this.state.level.current });
    this.notify({
      type: 'activityCompleted',
      defId: def.id,
      money,
      xp,
      ...(quality ? { quality } : {}),
      ...(result ? { result } : {}),
    });
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
  /**
   * Platzierungs-/Verschiebe-Diagnose (§ C4). Reine Read-Projektion für die
   * UI-Ghost-Vorschau: Gültigkeit + Grund, Terrain, Region, Straßenanschluss,
   * Standortbonus und Baukosten an (x,y). Bündelt vorhandene Prüfungen, dupliziert
   * keine Regeln. `ignoreBuildingId` blendet ein zu verschiebendes Gebäude aus.
   */
  placementDiagnostics(defId: string, x: number, y: number, ignoreBuildingId?: string): PlacementDiagnostics | undefined {
    const def = this.config.buildings.get(defId);
    if (!def) return undefined;
    const reason = validatePlacement(
      this.state,
      this.config,
      this.derived,
      def,
      x,
      y,
      ignoreBuildingId ? { ignoreBuildingId } : undefined,
    );
    return {
      valid: reason === undefined,
      ...(reason ? { reason } : {}),
      terrain: worldTerrainAt(this.state, x, y),
      regionId: regionIdAt(x, y),
      roadAccess: isConnectedToRoad(this.derived, def, x, y),
      locationBonusPct: Math.round(locationBonusPct(this.state, def, x, y)),
      buildCost: this.getBuildCost(defId, x, y),
    };
  }

  /**
   * Straßenplan-Vorschau (§ C6/§18). Reine Read-Projektion eines gezeichneten
   * Straßenpfads: pro Kachel Status/Grund/Kosten + Gesamtsumme, damit die UI vor
   * dem Bau „Länge/Kosten/Konflikte" zeigen kann. Keine Mutation, keine
   * Abbuchung — gebaut wird erst über die bestehenden Platzierungs-Commands.
   */
  roadPathPreview(path: { x: number; y: number }[]): RoadPlanPreview {
    return analyseRoadPath(this.state, this.config, this.derived, path, (x, y) => this.getBuildCost('road', x, y));
  }

  getBuildCost(defId: string, x?: number, y?: number): Partial<Record<ResourceId, number>> {
    const def = this.config.buildings.get(defId);
    if (!def) return {};
    const cost = effectiveBuildCost(def, countOf(this.state, defId), this.state.stats.built[defId] ?? 0);
    // Regions-Straßenkosten-Faktor (§ Welt 2.0): nur für Straßen und nur, wenn
    // eine Zielkachel bekannt ist (Menü ohne Ort zeigt den Basispreis). Der Ghost
    // reicht die Hover-Kachel durch, damit der gezeigte Preis dem gezahlten gleicht.
    if (def.category === 'roads' && x !== undefined && y !== undefined) {
      const factor = regionRoadCostFactorAt(this.config, x, y);
      if (factor !== 1 && cost.money !== undefined) {
        return { ...cost, money: Math.round(cost.money * factor) };
      }
    }
    return cost;
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

  getRegionCost(id: RegionId): number {
    return regionUnlockCost(this.config, id);
  }

  /**
   * Whether a locked region can be turned into the river district (§8), plus the
   * project cost — drives the "found district" option in the region dialog.
   */
  canFoundDistrict(id: RegionId): { eligible: boolean; cost: Partial<Record<ResourceId, number>> } {
    const bal = this.config.balancing;
    const region = this.state.world.regions[String(id)];
    const def = this.config.buildings.get('district_center');
    const hasRiverDistrict = Object.values(this.state.world.districts).some((d) => d.id === 'river');
    const eligible =
      this.state.level.current >= bal.districtUnlockLevel &&
      !!region && region.status === 'locked' && !!def &&
      this.config.regions.get(id)?.unlockable !== false &&
      regionHasTerrain(id, 'river') && !hasRiverDistrict &&
      findDistrictCenterSpot(this.state, id, def.size.w) !== undefined;
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
