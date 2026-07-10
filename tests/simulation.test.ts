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
    controller.placeBuilding('sawmill', 26, 27); // 9 wood/min
    const woodAfterBuild = controller.state.resources.wood;
    controller.update(T0 + 31_000); // construction (30s) done
    controller.update(T0 + 31_000 + 5 * MIN);
    expect(controller.state.resources.wood).toBeCloseTo(woodAfterBuild + 45, 0);
    expect(controller.state.stats.produced.wood).toBeCloseTo(45, 0);
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
    controller.update(T0 + 31_000 + 5 * MIN); // 9/min × 1.2 × 5 min = 54
    expect(controller.state.resources.wood).toBeCloseTo(woodAfterBuild + 54, 0);
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

  it('grows population when housing exists and happiness is high', () => {
    const { controller } = newController();
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('house_small', 26, 27);
    controller.update(T0 + 19_000); // house still under construction (20s)
    expect(controller.state.citizens.population).toBe(0);
    controller.update(T0 + 30_000 + 10 * MIN);
    // Housing cap 6, growth 2/min → capped at 6.
    expect(controller.state.citizens.population).toBe(6);
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
