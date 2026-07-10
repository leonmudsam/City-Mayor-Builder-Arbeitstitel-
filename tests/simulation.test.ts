import { describe, expect, it } from 'vitest';
import { newController, setLevel, T0 } from './helpers.ts';

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

  it('fills production buffers up to the cap (offline catch-up)', () => {
    const { controller } = newController();
    setLevel(controller, 2);
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('sawmill', 26, 27); // 6 wood/min, cap 60
    controller.update(T0 + 31_000); // construction (30s) done
    controller.update(T0 + 31_000 + 5 * MIN);
    const sawmill = Object.values(controller.state.buildings).find((b) => b.defId === 'sawmill');
    expect(sawmill?.buffer).toBeCloseTo(30, 0);
    // 8 hours offline → buffer caps at 60, not 2880.
    controller.update(T0 + 8 * 60 * MIN);
    expect(sawmill?.buffer).toBe(60);
  });

  it('collects yield into storage and tracks stats', () => {
    const { controller } = newController();
    setLevel(controller, 2);
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('sawmill', 26, 27);
    controller.update(T0 + 31_000 + 10 * MIN);
    const sawmill = Object.values(controller.state.buildings).find((b) => b.defId === 'sawmill');
    const woodBefore = controller.state.resources.wood;
    expect(controller.collectYield(sawmill!.id)).toEqual({ ok: true });
    expect(controller.state.resources.wood).toBe(woodBefore + 60);
    expect(controller.state.stats.collected.wood).toBe(60);
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
