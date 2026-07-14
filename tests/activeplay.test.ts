import { describe, expect, it } from 'vitest';
import { newController, setLevel, flattenTerrain, T0 } from './helpers.ts';
import { migrateAndValidate } from '../src/game/storage/migrations.ts';
import { exportSave } from '../src/game/storage/exportImport.ts';

const MIN = 60_000;

// v0.21 "Aktive Stadt": the whole economy runs only while the game is open and
// visible; offline advances only build/upgrade timers and cooldowns.
describe('no AFK farming (§1/§16)', () => {
  it('does not produce, earn or grow offline — only build timers advance', () => {
    const { controller } = newController();
    setLevel(controller, 2);
    flattenTerrain(controller);
    for (let x = 24; x <= 31; x++) controller.placeBuilding('road', x, 26);
    controller.placeBuilding('house_small', 24, 27);
    expect(controller.placeBuilding('sawmill', 28, 27)).toEqual({ ok: true });
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
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('house_small', 26, 27); // 20s
    const xp0 = controller.state.level.xp;
    controller.update(T0 + 60_000, false); // offline, past the 20s build
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;
    expect(house.status).toBe('active');
    expect(controller.state.level.xp).toBe(xp0 + 5);
  });
});

// Stadtarbeit activity system (§2/§15/§3): active tasks that pay only through
// commands, plus manual food distribution.
describe('Stadtarbeit activities', () => {
  it('runs a delivery: pick targets, deliver each, get paid + counted', () => {
    const { controller } = newController();
    setLevel(controller, 6);
    flattenTerrain(controller);
    controller.state.resources = { money: 100_000, wood: 500, stone: 500, food: 1_000, freshwater: 0 };
    for (let x = 22; x <= 33; x++) controller.placeBuilding('road', x, 26);
    for (let x = 22; x <= 30; x += 2) controller.placeBuilding('house_small', x, 27);
    controller.update(T0 + 40_000, true); // homes active

    const money0 = controller.state.resources.money;
    expect(controller.startActivity('food_delivery')).toEqual({ ok: true });
    const targets = controller.getActivityTargets();
    expect(targets.length).toBeGreaterThanOrEqual(3);
    for (const tg of targets) controller.progressActivity(tg.buildingId);
    // Completed: no active run, money & count went up, cooldown set.
    expect(controller.state.activities.active).toBeUndefined();
    expect(controller.state.resources.money).toBeGreaterThan(money0);
    expect(controller.state.stats.activitiesCompleted).toBe(1);
    expect(controller.activityReadyAt('food_delivery')).toBeGreaterThan(controller.state.meta.lastSimTime);
  });

  it('applies a decision option: books cost and adds a buff', () => {
    const { controller } = newController();
    setLevel(controller, 6);
    controller.state.resources = { money: 100_000, wood: 100, stone: 100, food: 100, freshwater: 0 };
    const money0 = controller.state.resources.money;
    expect(controller.chooseDecision('decision_farm_subsidy', 'fund')).toEqual({ ok: true });
    expect(controller.state.resources.money).toBe(money0 - 20_000);
    expect(controller.state.buffs.some((b) => b.kind === 'production')).toBe(true);
  });

  it('offers rotating trade contracts and pays out on fulfilment', () => {
    const { controller } = newController();
    setLevel(controller, 8);
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('trading_post', 26, 27);
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

// Migration to the v0.21 schema.
describe('v8 → v9 migration', () => {
  it('seeds activities/stats, drops the start sector from the count, scales pop', () => {
    const { controller } = newController();
    /* eslint-disable @typescript-eslint/no-explicit-any -- crafting a v8 raw save */
    const raw = JSON.parse(exportSave(controller.state)) as Record<string, any>;
    raw.schemaVersion = 8;
    raw.citizens.population = 300;
    raw.stats.sectorsUnlocked = 3; // v8 counted the start sector, so this = 2 real
    delete raw.activities;
    delete raw.stats.upgradesCompleted;
    delete raw.stats.upgraded;
    delete raw.stats.tradeEarnings;
    delete raw.stats.activitiesCompleted;
    /* eslint-enable @typescript-eslint/no-explicit-any */
    const migrated = migrateAndValidate(raw);
    expect(migrated.schemaVersion).toBe(9);
    expect(migrated.activities).toEqual({ cooldowns: {}, fulfilledContracts: [] });
    expect(migrated.stats.sectorsUnlocked).toBe(2); // start sector no longer counts
    expect(migrated.citizens.population).toBe(6_000); // ×20 scale
    expect(migrated.stats.upgradesCompleted).toBe(0);
    expect(migrated.stats.tradeEarnings).toBe(0);
  });
});

// §13 progression invariant: no residential upgrade unlocks in the same level a
// NEW residential building unlocks, so each level has a clear identity.
describe('housing progression is spread out (§13)', () => {
  it('never unlocks a residential upgrade in a new-residential-building level', () => {
    const { config } = newController();
    const residential = config.buildingList.filter((b) => b.category === 'residential');
    const newBuildingLevels = new Set(residential.map((b) => b.unlockLevel));
    for (const b of residential) {
      for (const up of b.upgrades ?? []) {
        if (up.unlockLevel !== undefined) {
          expect(newBuildingLevels.has(up.unlockLevel)).toBe(false);
        }
      }
    }
  });
});
