import { describe, expect, it } from 'vitest';
import { newController, setLevel, flattenTerrain, T0 } from './helpers.ts';

const MIN = 60_000;

describe('income breakdown (§5)', () => {
  it('earns residential tax from population, scaled by happiness', () => {
    const { controller } = newController();
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('house_small', 26, 27);
    controller.update(T0 + 30_000 + 5 * MIN); // citizens move in
    const income = controller.getIncome();
    expect(controller.state.citizens.population).toBeGreaterThan(0);
    expect(income.residential).toBeGreaterThan(0);
    expect(income.total).toBeGreaterThanOrEqual(income.residential);
  });

  it('aggregates commercial and industrial revenue bases from buildings', () => {
    const { controller } = newController();
    setLevel(controller, 6);
    flattenTerrain(controller);
    for (let x = 26; x <= 31; x++) controller.placeBuilding('road', x, 26);
    controller.placeBuilding('sawmill', 26, 27); // industrial 600
    controller.placeBuilding('shop_small', 28, 27); // commercial 4000
    controller.update(T0 + 200_000); // both finish construction
    expect(controller.derived.revenueBase).toEqual({ commercial: 4_000, industrial: 600 });
  });
});

describe('housing model (§6)', () => {
  it('derives resident capacity from units × max residents per unit', () => {
    const { controller } = newController();
    setLevel(controller, 9);
    flattenTerrain(controller);
    controller.state.resources = { money: 500_000, wood: 1_000, stone: 1_000, food: 1_000 };
    for (let x = 26; x <= 33; x++) controller.placeBuilding('road', x, 26);
    controller.placeBuilding('house_small', 26, 27); // 1 unit × 5
    controller.placeBuilding('house_row', 28, 27); // 5 units × 4 = 20
    controller.placeBuilding('apartment', 30, 27); // 16 units × 3 = 48
    controller.update(T0 + 400_000); // all finish
    expect(controller.derived.capacity.housing).toBe(5 + 20 + 48);
    expect(controller.derived.housingUnits).toBe(1 + 5 + 16);
  });
});

describe('generic coverage overlay (§1)', () => {
  it('tags homes as supplied, redundant or unsupplied around water sources', () => {
    const { controller } = newController();
    setLevel(controller, 3);
    flattenTerrain(controller);
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('house_small', 26, 27);
    controller.update(T0 + 25_000); // house finishes

    // A well far from the house: it doesn't reach → the home is unsupplied.
    controller.placeBuilding('well', 17, 17);
    controller.update(T0 + 45_000);
    const far = Object.values(controller.state.buildings).find((b) => b.defId === 'well')!;
    const overlayFar = controller.getCoverageOverlay(far.id)!;
    expect(overlayFar.group).toEqual({ kind: 'need', need: 'water' });
    expect(overlayFar.consumers).toHaveLength(1);
    expect(overlayFar.consumers[0]!.state).toBe('unsupplied');

    // A well next to the house covers it → supplied; both wells show as sources.
    controller.placeBuilding('well', 28, 26);
    controller.update(T0 + 65_000);
    const near = Object.values(controller.state.buildings).filter((b) => b.defId === 'well')
      .find((b) => b.x === 28)!;
    const overlayNear = controller.getCoverageOverlay(near.id)!;
    expect(overlayNear.sources).toHaveLength(2);
    expect(overlayNear.consumers[0]!.state).toBe('supplied');
    expect(overlayNear.sources.some((s) => s.selected)).toBe(true);
  });
});
