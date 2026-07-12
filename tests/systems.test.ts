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
    controller.state.resources = { money: 200_000, wood: 500, stone: 500, food: 100 };
    for (let x = 26; x <= 31; x++) controller.placeBuilding('road', x, 26);
    controller.placeBuilding('sawmill', 26, 27); // industrial 600
    controller.placeBuilding('shop_small', 28, 27); // commercial 4000
    controller.update(T0 + 200_000); // both finish construction
    expect(controller.derived.revenueBase).toEqual({ commercial: 4_000, industrial: 600 });
  });

  it('nets building running costs off gross income (money sink)', () => {
    const { controller } = newController();
    const upkeepBefore = controller.derived.upkeep.money;
    controller.placeBuilding('road', 26, 26); // upkeep 8 (active immediately)
    controller.placeBuilding('house_small', 26, 27); // upkeep 35 + residential tax
    controller.update(T0 + 30_000 + 5 * MIN); // house finishes + fills
    const income = controller.getIncome();
    // The two new buildings add exactly their configured upkeep on top of start.
    expect(controller.derived.upkeep.money - upkeepBefore).toBeCloseTo(8 + 35, 5);
    expect(income.upkeep).toBe(controller.derived.upkeep.money);
    expect(income.net).toBeCloseTo(income.total - income.upkeep, 5);
    expect(income.total).toBeGreaterThan(income.net); // upkeep genuinely bites
  });

  it('keeps the early game comfortably net-positive despite upkeep', () => {
    const { controller } = newController();
    setLevel(controller, 3);
    flattenTerrain(controller);
    for (let x = 26; x <= 30; x++) controller.placeBuilding('road', x, 26);
    controller.placeBuilding('house_small', 26, 27);
    controller.placeBuilding('house_small', 28, 27);
    controller.placeBuilding('well', 30, 27);
    controller.placeBuilding('sawmill', 26, 29);
    controller.update(T0 + 60_000 + 6 * MIN); // everything builds + fills
    // A starter town's tax + industry must clearly outrun its running costs,
    // or the upkeep sink would strangle the early game.
    expect(controller.getIncome().net).toBeGreaterThan(0);
  });
});

describe('logistics & workplaces', () => {
  it('a depot boosts the output of production buildings in range (§1 supply chain)', () => {
    const { controller } = newController();
    setLevel(controller, 7);
    flattenTerrain(controller); // isolate the logistics boost from terrain bonus
    controller.state.resources = { money: 500_000, wood: 1_000, stone: 1_000, food: 1_000 };
    for (let x = 26; x <= 31; x++) controller.placeBuilding('road', x, 26);
    expect(controller.placeBuilding('sawmill', 26, 27)).toEqual({ ok: true });
    const sawmill = Object.values(controller.state.buildings).find((b) => b.defId === 'sawmill')!;
    controller.update(T0 + 40_000); // sawmill active, no depot yet
    expect(controller.derived.productionBonus[sawmill.id] ?? 0).toBe(0);
    expect(controller.placeBuilding('depot', 28, 27)).toEqual({ ok: true }); // within radius 6
    controller.update(T0 + 300_000); // depot finishes
    expect(controller.derived.productionBonus[sawmill.id]).toBe(25); // +25 % throughput
    expect(controller.derived.productionPerMin.wood).toBeCloseTo(45 * 1.25, 5);
  });

  it('an office supplies a large block of jobs (§ Arbeitsversorgung)', () => {
    const { controller } = newController();
    setLevel(controller, 8);
    flattenTerrain(controller);
    controller.state.resources = { money: 500_000, wood: 1_000, stone: 1_000, food: 1_000 };
    for (let x = 26; x <= 31; x++) controller.placeBuilding('road', x, 26);
    const before = controller.derived.capacity.work;
    expect(controller.placeBuilding('office', 26, 27)).toEqual({ ok: true }); // 4×2, 400 jobs
    controller.update(T0 + 440_000); // office finishes
    expect(controller.derived.capacity.work - before).toBe(400);
  });
});

describe('energy grid (MVP 2)', () => {
  it('a power plant feeds the grid while buildings draw power', () => {
    const { controller } = newController();
    setLevel(controller, 11);
    flattenTerrain(controller);
    controller.state.resources = { money: 1_000_000, wood: 2_000, stone: 2_000, food: 1_000 };
    for (let x = 26; x <= 31; x++) controller.placeBuilding('road', x, 26);
    // A warehouse draws 4 energy; there is no supply until a plant is built.
    expect(controller.placeBuilding('warehouse', 29, 27)).toEqual({ ok: true });
    controller.update(T0 + 130_000); // warehouse finishes
    expect(controller.derived.extraDemand.energy).toBe(4);
    expect(controller.derived.capacity.energy).toBe(0);
    // The coal plant powers the whole city-wide grid (capacity need, no radius).
    expect(controller.placeBuilding('power_plant', 26, 27)).toEqual({ ok: true });
    controller.update(T0 + 130_000 + 400_000); // plant finishes
    expect(controller.derived.capacity.energy).toBe(250);
  });
});

describe('emergency services (MVP 2)', () => {
  it('a police station covers the homes within its safety radius', () => {
    const { controller } = newController();
    setLevel(controller, 13);
    flattenTerrain(controller);
    controller.state.resources = { money: 1_000_000, wood: 2_000, stone: 2_000, food: 1_000 };
    for (let x = 26; x <= 31; x++) controller.placeBuilding('road', x, 26);
    controller.placeBuilding('house_small', 26, 27);
    controller.update(T0 + 25_000); // house finishes
    expect(controller.derived.needCoverage.safety).toBe(0); // no station yet
    // A police station within radius 11 of the house covers it.
    expect(controller.placeBuilding('police_station', 29, 27)).toEqual({ ok: true });
    controller.update(T0 + 25_000 + 320_000); // station finishes
    expect(controller.derived.needCoverage.safety).toBe(1);
  });
});

describe('tax policy (MVP 2)', () => {
  it('scales residential income by the rate and clamps to the band', () => {
    const { controller } = newController();
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('house_small', 26, 27);
    controller.update(T0 + 30_000 + 5 * MIN); // citizens move in
    const base = controller.getIncome().residential;
    expect(base).toBeGreaterThan(0);
    // Raising the rate scales income directly (happiness penalty applies next tick).
    controller.setTaxRate('residential', 1.5);
    expect(controller.getIncome().residential).toBeCloseTo(base * 1.5, 5);
    // Out-of-band values clamp to the configured maximum.
    controller.setTaxRate('residential', 5);
    expect(controller.state.policy.residentialTaxRate).toBe(1.5);
  });

  it('lets a tax hike bite happiness over the following ticks', () => {
    const { controller } = newController();
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('house_small', 26, 27);
    controller.update(T0 + 30_000 + 5 * MIN);
    const before = controller.state.citizens.happiness;
    controller.setTaxRate('residential', 1.5); // +50 % → −12 happiness
    controller.update(T0 + 30_000 + 6 * MIN);
    expect(controller.state.citizens.happiness).toBeLessThan(before);
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
    controller.placeBuilding('house_row', 28, 27); // 6 units × 4 = 24
    controller.placeBuilding('apartment', 30, 27); // 24 units × 4 = 96
    controller.update(T0 + 400_000); // all finish
    expect(controller.derived.capacity.housing).toBe(5 + 24 + 96);
    expect(controller.derived.housingUnits).toBe(1 + 6 + 24);
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
