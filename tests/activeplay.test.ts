import { describe, expect, it } from 'vitest';
import { nearTownHall, newController, setLevel, flattenTerrain, T0 } from './helpers.ts';
import { LegacyWorldSaveError, migrateAndValidate } from '../src/game/storage/migrations.ts';
import { exportSave } from '../src/game/storage/exportImport.ts';

const MIN = 60_000;

// Insel-Layout (v11): Rathaus 5×5, Startstraßen-Zeile bei y+5 (x..x+4);
// Erweiterungs-Straßen ab at(5,5), Gebäude ab at(·,6).
const at = (dx: number, dy: number) => nearTownHall(dx, dy);

// v0.21 "Aktive Stadt": the whole economy runs only while the game is open and
// visible; offline advances only build/upgrade timers and cooldowns.
describe('no AFK farming (§1/§16)', () => {
  it('does not produce, earn or grow offline — only build timers advance', () => {
    const { controller } = newController();
    setLevel(controller, 2);
    flattenTerrain(controller);
    for (let dx = 5; dx <= 10; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
    expect(controller.placeBuilding('sawmill', at(6, 6).x, at(6, 6).y)).toEqual({ ok: true });
    controller.update(T0 + 40_000, true); // buildings finish, live

    const wood = controller.state.resources.wood;
    const money = controller.state.resources.money;
    const pop = controller.state.citizens.population;

    // A long offline gap: nothing accrues.
    controller.update(T0 + 40_000 + 8 * 60 * MIN, false);
    expect(controller.state.resources.wood).toBe(wood);
    expect(controller.state.resources.money).toBe(money);
    expect(controller.state.citizens.population).toBe(pop);

    // The same span live DOES accrue.
    controller.update(T0 + 40_000 + 8 * 60 * MIN + 5 * MIN, true);
    expect(controller.state.resources.wood).toBeGreaterThan(wood);
  });

  it('finishes a build offline (and grants its XP), because timers do run', () => {
    const { controller } = newController();
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y); // 20s
    const xp0 = controller.state.level.xp;
    controller.update(T0 + 60_000, false); // offline, past the 20s build
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;
    expect(house.status).toBe('active');
    expect(controller.state.level.xp).toBe(xp0 + 5);
  });
});

// Stadtarbeit activity system (§2/§15/§3): active tasks that pay only through
// commands, plus manual food distribution.

/** A level-6 city with homes AND a farm (a food source for deliveries). */
function deliveryCity() {
  const bundle = newController();
  const { controller } = bundle;
  setLevel(controller, 6);
  flattenTerrain(controller);
  controller.state.resources = { money: 100_000, wood: 500, stone: 500, food: 1_000, freshwater: 0 };
  for (let dx = 5; dx <= 23; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
  for (const dx of [3, 6, 9, 12, 15]) controller.placeBuilding('house_small', at(dx, 6).x, at(dx, 6).y);
  controller.placeBuilding('farm', at(18, 6).x, at(18, 6).y); // the food source (requiresAnyBuilding, 6×6)
  controller.update(T0 + 90_000, false); // finish construction without economy noise
  return bundle;
}

describe('Stadtarbeit activities', () => {
  it('runs a delivery: pick targets, deliver each, get paid + counted', () => {
    const { controller } = deliveryCity();
    const money0 = controller.state.resources.money;
    expect(controller.startActivity('food_delivery')).toEqual({ ok: true });
    const targets = controller.getActivityTargets();
    expect(targets.length).toBeGreaterThanOrEqual(3);
    for (const tg of targets) controller.progressActivity(tg.buildingId);
    // Completed: no active run, money & count went up.
    expect(controller.state.activities.active).toBeUndefined();
    expect(controller.state.resources.money).toBeGreaterThan(money0);
    expect(controller.state.stats.activitiesCompleted).toBe(1);
  });

  it('has NO fixed cooldown for deliveries — can be started again at once (§2)', () => {
    const { controller } = deliveryCity();
    expect(controller.startActivity('food_delivery')).toEqual({ ok: true });
    for (const tg of controller.getActivityTargets()) controller.progressActivity(tg.buildingId);
    // Ready-at is not pushed into the future — a new run starts immediately.
    expect(controller.activityReadyAt('food_delivery')).toBe(0);
    expect(controller.startActivity('food_delivery')).toEqual({ ok: true });
  });

  it('needs a food source building to be available (§10 requiresAnyBuilding)', () => {
    const { controller } = newController();
    setLevel(controller, 6);
    flattenTerrain(controller);
    controller.state.resources = { money: 100_000, wood: 500, stone: 500, food: 1_000, freshwater: 0 };
    for (let dx = 5; dx <= 16; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    for (const dx of [3, 6, 9, 12, 15]) controller.placeBuilding('house_small', at(dx, 6).x, at(dx, 6).y);
    controller.update(T0 + 40_000, true); // homes active, but no farm/market yet
    // No source building → cannot start, and the board flags why.
    expect(controller.startActivity('food_delivery')).toEqual({ ok: false, error: 'locked' });
    const entry = controller.getActivityBoard().find((e) => e.def.id === 'food_delivery')!;
    expect(entry.available).toBe(false);
    expect(entry.reason).toBe('missing_building');
  });

  it('grades a delivery Gold when finished fast, Bronze when slow (§6)', () => {
    const { controller } = deliveryCity();
    // Finish instantly (well inside 60 % of the 75s limit) → gold multiplier.
    expect(controller.startActivity('food_delivery')).toEqual({ ok: true });
    const goldMoney0 = controller.state.resources.money;
    for (const tg of controller.getActivityTargets()) controller.progressActivity(tg.buildingId);
    const goldGain = controller.state.resources.money - goldMoney0;

    // A second run, but let the clock pass the time limit → bronze multiplier.
    controller.state.resources.food = 1_000;
    expect(controller.startActivity('food_delivery')).toEqual({ ok: true });
    const start = controller.state.meta.lastSimTime;
    controller.state.activities.active!.startedAt = start - 200_000; // 200s ago, past 75s
    const bronzeMoney0 = controller.state.resources.money;
    for (const tg of controller.getActivityTargets()) controller.progressActivity(tg.buildingId);
    const bronzeGain = controller.state.resources.money - bronzeMoney0;

    expect(goldGain).toBeGreaterThan(bronzeGain);
  });

  it('applies a decision with multiple simultaneous effects (§12)', () => {
    const { controller } = newController();
    setLevel(controller, 6);
    controller.state.resources = { money: 100_000, wood: 100, stone: 100, food: 100, freshwater: 0 };
    const money0 = controller.state.resources.money;
    // The "big" option carries two buffs at once: production + happiness.
    expect(controller.chooseDecision('decision_farm_subsidy', 'big')).toEqual({ ok: true });
    expect(controller.state.resources.money).toBe(money0 - 40_000);
    expect(controller.state.buffs.some((b) => b.kind === 'production')).toBe(true);
    expect(controller.state.buffs.some((b) => b.kind === 'happiness')).toBe(true);
  });

  it('locks a decision option behind a required building (§12)', () => {
    const { controller } = newController();
    setLevel(controller, 6);
    controller.state.resources = { money: 100_000, wood: 100, stone: 100, food: 100, freshwater: 0 };
    // The "contract" option needs a trading_post the city doesn't have.
    expect(controller.chooseDecision('decision_farm_subsidy', 'contract')).toEqual({ ok: false, error: 'locked' });
  });

  it('offers rotating trade contracts and pays out on fulfilment', () => {
    const { controller } = newController();
    setLevel(controller, 8);
    controller.state.resources.money = 100_000;
    controller.state.resources.wood = 200; // Kontor kostet 65 Holz (> Startvorrat)
    expect(controller.placeBuilding('trading_post', at(3, 6).x, at(3, 6).y)).toEqual({ ok: true });
    controller.update(T0 + 100_000, true); // trading post active
    const offers = controller.getTradeContracts();
    expect(offers.length).toBeGreaterThan(0);
    // Give enough of everything to fulfil the first offer.
    controller.state.resources = { money: 0, wood: 10_000, stone: 10_000, food: 10_000, freshwater: 0 };
    const offer = controller.getTradeContracts()[0]!;
    expect(controller.fulfillTradeContract(offer.id)).toEqual({ ok: true });
    expect(controller.state.resources.money).toBe(offer.template.rewardMoney);
    expect(controller.state.stats.tradeEarnings).toBe(offer.template.rewardMoney);
    // Same offer can't be fulfilled twice in the same rotation.
    expect(controller.fulfillTradeContract(offer.id)).toEqual({ ok: false, error: 'invalid' });
  });
});

// § MVP4 (v10): Die Vor-Insel-Migrationskette (v1..v9) existiert nicht mehr —
// ein v8-Save ist ein Legacy-Weltstand und wird gesichert statt migriert
// (docs/SAVE_MIGRATION.md). Der alte v8→v9-Test ist damit obsolet.
describe('pre-island saves (≤ v9)', () => {
  it('are rejected as legacy world instead of being migrated', () => {
    const { controller } = newController();
    /* eslint-disable @typescript-eslint/no-explicit-any -- crafting a v8 raw save */
    const raw = JSON.parse(exportSave(controller.state)) as Record<string, any>;
    raw.schemaVersion = 8;
    /* eslint-enable @typescript-eslint/no-explicit-any */
    expect(() => migrateAndValidate(raw)).toThrow(LegacyWorldSaveError);
  });
});

// §13 progression invariant: no residential upgrade unlocks in the same level a
// NEW residential building unlocks, so each level has a clear identity.
describe('housing progression is spread out (§13)', () => {
  it('never unlocks a residential upgrade in a new-residential-building level', () => {
    // Ausnahme (§ Gebäudesystem 2.0, fixierte Entscheidung): Level 15 ist das
    // Metropol-Band — der Wohnblock (house_small Endstufe) und der neue
    // Wohnturm schalten bewusst gemeinsam frei.
    const METROPOLIS_BAND = 15;
    const { config } = newController();
    const residential = config.buildingList.filter((b) => b.category === 'residential');
    const newBuildingLevels = new Set(residential.map((b) => b.unlockLevel));
    for (const b of residential) {
      for (const up of b.upgrades ?? []) {
        if (up.unlockLevel !== undefined && up.unlockLevel !== METROPOLIS_BAND) {
          expect(newBuildingLevels.has(up.unlockLevel)).toBe(false);
        }
      }
    }
  });
});
