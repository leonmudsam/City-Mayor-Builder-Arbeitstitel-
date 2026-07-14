import { describe, expect, it } from 'vitest';
import { newController, setLevel, flattenTerrain, T0 } from './helpers.ts';
import { overflowExportValue } from '../src/game/simulation/tick.ts';

// §2 critical upgrade fix: a building keeps its CURRENT stage's effects for the
// whole upgrade — it never drops to zero mid-upgrade. The new stage only becomes
// live when the build finishes.
describe('upgrade keeps old effects until it completes (§2)', () => {
  it('town hall keeps its storage while the prestige upgrade is running', () => {
    const { controller } = newController();
    const th = controller.state.buildings['b_townhall']!;
    setLevel(controller, 5);
    controller.state.resources.money = 500_000;
    controller.state.resources.wood = 500;
    controller.state.resources.stone = 500;
    // Base town-hall wood store (the only storage source at the start).
    expect(controller.derived.storageCaps.wood).toBe(400);

    expect(controller.upgradeBuilding(th.id)).toEqual({ ok: true });
    // Upgrade in progress: level NOT advanced yet, a target recorded instead.
    expect(th.status).toBe('constructing');
    expect(th.upgradeLevel).toBe(0);
    expect(th.targetUpgradeLevel).toBe(1);
    // Critical: storage is STILL the old stage's 400, not 0 — effects stay live.
    expect(controller.derived.storageCaps.wood).toBe(400);

    controller.update(T0 + 200_000); // 180s upgrade completes
    // Now — and only now — the new stage is live.
    expect(th.upgradeLevel).toBe(1);
    expect(th.targetUpgradeLevel).toBeUndefined();
    expect(th.status).toBe('active');
    expect(controller.derived.storageCaps.wood).toBe(700);
  });

  it('a sawmill keeps producing at its old rate throughout the upgrade', () => {
    const { controller } = newController();
    setLevel(controller, 7);
    flattenTerrain(controller); // zero terrain bonus → exact rates
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('sawmill', 26, 27);
    controller.update(T0 + 40_000); // sawmill finishes (30s)
    const saw = Object.values(controller.state.buildings).find((b) => b.defId === 'sawmill')!;
    expect(controller.derived.productionPerMin.wood).toBe(45); // base stage

    controller.state.resources.money = 500_000;
    controller.state.resources.wood = 500;
    controller.state.resources.stone = 500;
    expect(controller.upgradeBuilding(saw.id)).toEqual({ ok: true });
    // Mid-upgrade: still producing the OLD 45/min, not 0 (no production blackout).
    expect(controller.derived.productionPerMin.wood).toBe(45);

    controller.update(T0 + 40_000 + 260_000); // 240s upgrade completes
    expect(saw.upgradeLevel).toBe(1);
    expect(controller.derived.productionPerMin.wood).toBe(95); // improved stage
  });
});

// §6 active overflow export: overflow becomes money only during live ticks.
describe('active overflow export (§6)', () => {
  it('prices overflow at the resource export rate', () => {
    const { config } = newController();
    expect(overflowExportValue(config.balancing, 'wood', 10)).toBe(20); // rate 2
    expect(overflowExportValue(config.balancing, 'stone', 10)).toBe(40); // rate 4
    expect(overflowExportValue(config.balancing, 'wood', 0)).toBe(0);
  });

  it('earns money from a full store live, but nothing offline', () => {
    const { controller } = newController();
    setLevel(controller, 7);
    flattenTerrain(controller);
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('sawmill', 26, 27);
    controller.update(T0 + 40_000); // sawmill active
    const cap = controller.derived.storageCaps.wood;

    // Full store + live tick → overflow is exported.
    controller.state.resources.wood = cap;
    controller.update(T0 + 40_000 + 60_000, true);
    expect(controller.lastOverflowExport).toBeGreaterThan(0);

    // Full store + offline catch-up → no export money (no AFK printer).
    controller.state.resources.wood = cap;
    controller.update(T0 + 40_000 + 120_000, false);
    expect(controller.lastOverflowExport).toBe(0);
  });
});

// §7 Handelskontor: manual sell/buy, gated on a trading post, with a buy markup.
describe('trading post (§7)', () => {
  it('sells stored resources and buys them back at a markup', () => {
    const { controller } = newController();
    setLevel(controller, 5);
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('trading_post', 26, 27);
    controller.update(T0 + 100_000); // trading post active
    expect(controller.hasTradePost()).toBe(true);

    const quote = controller.getTradeQuote('wood');
    expect(quote.sell).toBe(2); // base rate, stage 0
    expect(quote.buy).toBe(8); // 2 × markup 4

    controller.state.resources.wood = 100;
    const money0 = controller.state.resources.money;
    expect(controller.sellResource('wood', 50)).toEqual({ ok: true });
    expect(controller.state.resources.wood).toBe(50);
    expect(controller.state.resources.money).toBe(money0 + 100); // 50 × 2

    const money1 = controller.state.resources.money;
    expect(controller.buyResource('wood', 10)).toEqual({ ok: true });
    expect(controller.state.resources.wood).toBe(60);
    expect(controller.state.resources.money).toBe(money1 - 80); // 10 × 8
  });

  it('refuses trading without a trading post', () => {
    const { controller } = newController();
    controller.state.resources.wood = 100;
    expect(controller.hasTradePost()).toBe(false);
    expect(controller.sellResource('wood', 10)).toEqual({ ok: false, error: 'locked' });
  });
});

// §10 prototype cheats (debugTools flag is on in this config).
describe('prototype cheats (§10)', () => {
  it('grants money, fills stores, and finishes construction & upgrades', () => {
    const { controller } = newController();
    setLevel(controller, 7);
    const money0 = controller.state.resources.money;
    expect(controller.debugGrantMoney(100_000)).toEqual({ ok: true });
    expect(controller.state.resources.money).toBe(money0 + 100_000);

    controller.debugFillResources();
    expect(controller.state.resources.wood).toBe(controller.derived.storageCaps.wood);
    expect(controller.state.resources.food).toBe(controller.derived.storageCaps.food);

    // Finish a fresh build instantly.
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('house_small', 26, 27);
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;
    expect(house.status).toBe('constructing');
    controller.debugFinishConstruction('build');
    expect(house.status).toBe('active');

    // Finish an upgrade instantly.
    controller.state.resources.money = 500_000;
    controller.state.resources.wood = 500;
    controller.state.resources.stone = 500;
    controller.upgradeBuilding(house.id);
    expect(house.status).toBe('constructing');
    controller.debugFinishConstruction('upgrade');
    expect(house.status).toBe('active');
    expect(house.upgradeLevel).toBe(1);
  });
});
