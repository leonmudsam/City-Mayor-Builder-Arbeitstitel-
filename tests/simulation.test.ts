import { describe, expect, it } from 'vitest';
import { flattenTerrain, newController, paintTerrain, setLevel, T0 } from './helpers.ts';

const MIN = 60_000;

describe('simulation tick', () => {
  it('completes construction over time and awards XP', () => {
    const { controller } = newController();
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('house_small', 26, 27); // 20s construction
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small');
    expect(house?.status).toBe('constructing');
    const xpBefore = controller.state.level.xp;
    controller.update(T0 + 21_000);
    expect(house?.status).toBe('active');
    expect(controller.state.level.xp).toBe(xpBefore + 10);
  });

  it('produces directly into storage and stops at the storage cap (offline catch-up)', () => {
    const { controller } = newController();
    setLevel(controller, 2);
    flattenTerrain(controller); // no location bonus in this test
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('sawmill', 26, 27); // 14 wood/min
    const woodAfterBuild = controller.state.resources.wood;
    controller.update(T0 + 31_000); // construction (30s) done
    controller.update(T0 + 31_000 + 5 * MIN);
    expect(controller.state.resources.wood).toBeCloseTo(woodAfterBuild + 70, 0);
    expect(controller.state.stats.produced.wood).toBeCloseTo(70, 0);
    // 8 hours offline → storage cap (town hall: 300 wood), not 4000+.
    controller.update(T0 + 8 * 60 * MIN);
    expect(controller.state.resources.wood).toBe(300);
  });

  it('applies the terrain location bonus to production', () => {
    const { controller } = newController();
    setLevel(controller, 2);
    flattenTerrain(controller);
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('sawmill', 26, 27);
    // 4 forest tiles in radius 3 → +20 % (5 %/tile).
    paintTerrain(controller, [[30, 27], [30, 28], [23, 29], [24, 30]], 'forest');
    const sawmill = Object.values(controller.state.buildings).find((b) => b.defId === 'sawmill');
    const woodAfterBuild = controller.state.resources.wood;
    controller.update(T0 + 31_000); // construction done → bonus becomes active
    expect(controller.derived.productionBonus[sawmill!.id]).toBe(20);
    controller.update(T0 + 31_000 + 5 * MIN); // 14/min × 1.2 × 5 min = 84
    expect(controller.state.resources.wood).toBeCloseTo(woodAfterBuild + 84, 0);
  });

  it('only counts water supply for housing inside a well radius', () => {
    const { controller } = newController();
    setLevel(controller, 3);
    flattenTerrain(controller);
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('house_small', 26, 27);
    controller.update(T0 + 30_000 + 5 * MIN); // citizens move in
    // Well far away (>7 Chebyshev from the house center): capacity exists, coverage 0.
    expect(controller.placeBuilding('well', 18, 18)).toEqual({ ok: true });
    controller.update(T0 + 30_000 + 6 * MIN);
    expect(controller.state.citizens.needs.water.fulfillment).toBe(0);
    // A well next to the house covers it fully.
    expect(controller.placeBuilding('well', 28, 26)).toEqual({ ok: true });
    controller.update(T0 + 30_000 + 7 * MIN);
    expect(controller.state.citizens.needs.water.fulfillment).toBe(1);
  });

  it('refunds a share of the invested cost when demolishing', () => {
    const { controller } = newController();
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('house_small', 26, 27); // cost: 6 000 money, 15 wood
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;
    const moneyBefore = controller.state.resources.money;
    const woodBefore = controller.state.resources.wood;
    // 25 % refund, floored per resource: 1 500 money, 3 wood.
    expect(controller.getDemolishRefund(house.id)).toEqual({ money: 1_500, wood: 3 });
    expect(controller.demolishBuilding(house.id)).toEqual({ ok: true });
    expect(controller.state.resources.money).toBe(moneyBefore + 1_500);
    expect(controller.state.resources.wood).toBe(woodBefore + 3);
  });

  it('raises happiness when residential quality improves (zoning)', () => {
    const { controller } = newController();
    setLevel(controller, 7);
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('house_small', 26, 27);
    controller.update(T0 + 30_000 + 5 * MIN); // citizens settle in
    const before = controller.state.citizens.happiness;
    expect(controller.derived.avgAmbience).toBe(0);
    // A tree next to the house (ambience +1, radius 3) — a pure ambience source.
    // Small houses weigh their surroundings more (sensitivity 1.4, §7).
    expect(controller.placeBuilding('deco_tree', 28, 27)).toEqual({ ok: true });
    expect(controller.derived.avgAmbience).toBeCloseTo(1.4, 5);
    controller.update(T0 + 30_000 + 6 * MIN); // happiness recomputed with ambience
    expect(controller.state.citizens.happiness).toBeGreaterThan(before);
  });

  it('caps production buildings per level and lifts the cap with progress', () => {
    const { controller } = newController();
    setLevel(controller, 2); // sawmill cap 2 at level 2
    for (let x = 26; x <= 31; x++) controller.placeBuilding('road', x, 26);
    expect(controller.getBuildLimit('sawmill')).toEqual({ count: 0, max: 2, nextLevel: 5 });
    expect(controller.placeBuilding('sawmill', 26, 27)).toEqual({ ok: true });
    expect(controller.placeBuilding('sawmill', 28, 27)).toEqual({ ok: true });
    // Third sawmill exceeds the level-2 cap.
    expect(controller.placeBuilding('sawmill', 30, 27)).toEqual({ ok: false, error: 'limit_reached' });
    expect(controller.getBuildLimit('sawmill')).toEqual({ count: 2, max: 2, nextLevel: 5 });
    // Houses are never capped (§13).
    expect(controller.getBuildLimit('house_small')).toBeUndefined();
    // Reaching level 5 raises the cap to 3.
    setLevel(controller, 5);
    expect(controller.placeBuilding('sawmill', 30, 27)).toEqual({ ok: true });
  });

  it('feeds only homes a market reaches (food distribution coverage)', () => {
    const { controller } = newController();
    setLevel(controller, 5);
    for (let x = 26; x <= 31; x++) controller.placeBuilding('road', x, 26);
    controller.placeBuilding('house_small', 26, 27);
    controller.update(T0 + 25_000); // house finishes construction
    expect(controller.derived.distributionCoverage.food).toBe(0); // no market yet
    controller.placeBuilding('market', 30, 27); // center within radius 9 of the house
    controller.update(T0 + 25_000 + 95_000); // market finishes construction
    expect(controller.derived.distributionCoverage.food).toBe(1);
  });

  it('grows population when housing exists and happiness is high', () => {
    const { controller } = newController();
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('house_small', 26, 27);
    controller.update(T0 + 19_000); // house still under construction (20s)
    expect(controller.state.citizens.population).toBe(0);
    controller.update(T0 + 30_000 + 10 * MIN);
    // Small house = 1 unit × 5 residents → cap 5; growth fills then stops (§6).
    expect(controller.state.citizens.population).toBe(5);
  });

  it('drops happiness when water is missing at level 3+', () => {
    const { controller } = newController();
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('house_small', 26, 27);
    controller.update(T0 + 30_000 + 5 * MIN); // population moved in at level 1
    setLevel(controller, 3); // water need activates, no wells exist
    controller.update(T0 + 30_000 + 6 * MIN);
    expect(controller.state.citizens.needs.water.fulfillment).toBe(0);
    expect(controller.state.citizens.happiness).toBeLessThan(75);
  });

  it('keeps the simulation deterministic for the same inputs', () => {
    const run = () => {
      const { controller } = newController();
      controller.placeBuilding('road', 26, 26);
      controller.placeBuilding('house_small', 26, 27);
      controller.update(T0 + 60 * MIN);
      return JSON.stringify(controller.state);
    };
    expect(run()).toBe(run());
  });
});
