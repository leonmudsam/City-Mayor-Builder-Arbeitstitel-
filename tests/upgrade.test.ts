import { describe, expect, it } from 'vitest';
import { nearTownHall, newController, setLevel, flattenTerrain, T0 , townHallOf } from './helpers.ts';

// Insel-Layout (v11): Startstrassen-Zeile bei Rathaus-y+5, Gebaeude ab y+6.
const at = (dx: number, dy: number) => nearTownHall(dx, dy);

// §2 critical upgrade fix: a building keeps its CURRENT stage's effects for the
// whole upgrade — it never drops to zero mid-upgrade. The new stage only becomes
// live when the build finishes.
describe('upgrade keeps old effects until it completes (§2)', () => {
  it('town hall keeps its storage while the prestige upgrade is running', () => {
    const { controller } = newController();
    const th = townHallOf(controller);
    setLevel(controller, 6); // Stadtverwaltung-Gate (§ Gebaeudesystem 2.0)
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

  // § Active Operations 2.0 / A6+A7: Upgrade-Kontinuität an der Bäckerei geprüft —
  // Sägewerk, Steinbruch und Farm produzieren nicht mehr passiv (kein
  // productionPerMin-Eintrag). Die Bäckerei ist der verbliebene Passivproduzent.
  it('a bakery keeps producing at its old rate throughout the upgrade', () => {
    const { controller } = newController();
    setLevel(controller, 12);
    flattenTerrain(controller); // zero terrain bonus → exact rates
    controller.state.resources = { money: 900_000, wood: 500, stone: 500, food: 0, freshwater: 0 };
    controller.placeBuilding('bakery', at(1, 6).x, at(1, 6).y); // 2×2 unter den Startstrassen
    controller.update(T0 + 245_000); // bakery finishes (240s)
    const bakery = Object.values(controller.state.buildings).find((b) => b.defId === 'bakery')!;
    expect(controller.derived.productionPerMin.food).toBe(90); // base stage

    expect(controller.upgradeBuilding(bakery.id)).toEqual({ ok: true });
    // Mid-upgrade: still producing the OLD 90/min, not 0 (no production blackout).
    expect(controller.derived.productionPerMin.food).toBe(90);

    controller.update(T0 + 245_000 + 320_000); // 300s upgrade completes
    expect(bakery.upgradeLevel).toBe(1);
    expect(controller.derived.productionPerMin.food).toBe(180); // Großbäckerei-Stufe
  });
});

// §7 Handelskontor: manual sell/buy, gated on a trading post, with a buy markup.
// Since v0.21 the trading post is the ONLY way surplus becomes money (the passive
// overflow export is gone) and sell rates were raised sharply.
describe('trading post (§7)', () => {
  it('sells stored resources and buys them back at a markup', () => {
    const { controller } = newController();
    setLevel(controller, 5);
    controller.state.resources.money = 100_000;
    controller.state.resources.wood = 200; // Kontor kostet 65 Holz (> Startvorrat)
    expect(controller.placeBuilding('trading_post', at(3, 6).x, at(3, 6).y)).toEqual({ ok: true });
    controller.update(T0 + 100_000); // trading post active
    expect(controller.hasTradePost()).toBe(true);

    const quote = controller.getTradeQuote('wood');
    expect(quote.sell).toBe(10); // base rate, stage 0
    expect(quote.buy).toBe(40); // 10 × markup 4

    controller.state.resources.wood = 100;
    const money0 = controller.state.resources.money;
    expect(controller.sellResource('wood', 50)).toEqual({ ok: true });
    expect(controller.state.resources.wood).toBe(50);
    expect(controller.state.resources.money).toBe(money0 + 500); // 50 × 10
    expect(controller.state.stats.tradeEarnings).toBe(500); // active earnings tracked

    const money1 = controller.state.resources.money;
    expect(controller.buyResource('wood', 10)).toEqual({ ok: true });
    expect(controller.state.resources.wood).toBe(60);
    expect(controller.state.resources.money).toBe(money1 - 400); // 10 × 40
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
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
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
