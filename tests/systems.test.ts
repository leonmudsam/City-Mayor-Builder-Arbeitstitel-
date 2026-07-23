import { describe, expect, it } from 'vitest';
import { nearTownHall, newController, setLevel, flattenTerrain, T0 } from './helpers.ts';

const MIN = 60_000;

// Insel-Layout (v11): Rathaus 5×5, Startstraßen-Zeile bei y+5 (x..x+4);
// Erweiterungs-Straßen ab at(5,5), Gebäude ab at(·,6).
const at = (dx: number, dy: number) => nearTownHall(dx, dy);

describe('income breakdown (§5)', () => {
  it('earns residential tax from population, scaled by happiness', () => {
    const { controller } = newController();
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
    controller.update(T0 + 30_000 + 5 * MIN, true); // citizens move in
    const income = controller.getIncome();
    expect(controller.state.citizens.population).toBeGreaterThan(0);
    expect(income.residential).toBeGreaterThan(0);
    expect(income.total).toBeGreaterThanOrEqual(income.residential);
  });

  it('aggregates commercial and industrial revenue bases from buildings', () => {
    const { controller } = newController();
    setLevel(controller, 6);
    flattenTerrain(controller);
    controller.state.resources = { money: 200_000, wood: 500, stone: 500, food: 100, freshwater: 0 };
    controller.placeBuilding('road', at(5, 5).x, at(5, 5).y);
    controller.placeBuilding('road', at(6, 5).x, at(6, 5).y);
    controller.placeBuilding('sawmill', at(1, 6).x, at(1, 6).y); // industrial 600 (4×4)
    controller.placeBuilding('shop_small', at(5, 6).x, at(5, 6).y); // commercial 4000 (2×2)
    controller.update(T0 + 200_000); // both finish construction
    expect(controller.derived.revenueBase).toEqual({ commercial: 4_000, industrial: 600 });
  });

  it('nets building running costs off gross income (money sink)', () => {
    const { controller } = newController();
    const upkeepBefore = controller.derived.upkeep.money;
    controller.placeBuilding('road', at(5, 5).x, at(5, 5).y); // upkeep 8 (active immediately)
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y); // upkeep 40 + residential tax
    controller.update(T0 + 30_000 + 5 * MIN); // house finishes + fills
    const income = controller.getIncome();
    // The two new buildings add exactly their configured upkeep on top of start.
    expect(controller.derived.upkeep.money - upkeepBefore).toBeCloseTo(8 + 40, 5);
    expect(income.upkeep).toBe(controller.derived.upkeep.money);
    expect(income.net).toBeCloseTo(income.total - income.upkeep, 5);
    expect(income.total).toBeGreaterThan(income.net); // upkeep genuinely bites
  });

  it('keeps the early game comfortably net-positive despite upkeep', () => {
    const { controller } = newController();
    setLevel(controller, 3);
    flattenTerrain(controller);
    for (let dx = 5; dx <= 12; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
    controller.placeBuilding('house_small', at(6, 6).x, at(6, 6).y);
    controller.placeBuilding('well', at(9, 6).x, at(9, 6).y);
    controller.placeBuilding('sawmill', at(9, 7).x, at(9, 7).y);
    controller.update(T0 + 60_000 + 6 * MIN, true); // everything builds + fills
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
    controller.state.resources = { money: 500_000, wood: 1_000, stone: 1_000, food: 1_000, freshwater: 0 };
    for (let dx = 5; dx <= 13; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    // § Active Operations 2.0: Logistik-Boost am passiven Steinbruch geprüft (das
    // Sägewerk produziert nicht mehr passiv und taucht in productionPerMin nicht auf).
    expect(controller.placeBuilding('quarry', at(1, 6).x, at(1, 6).y)).toEqual({ ok: true });
    const quarry = Object.values(controller.state.buildings).find((b) => b.defId === 'quarry')!;
    controller.update(T0 + 95_000); // quarry active, no depot yet
    expect(controller.derived.productionBonus[quarry.id] ?? 0).toBe(0);
    expect(controller.placeBuilding('depot', at(6, 6).x, at(6, 6).y)).toEqual({ ok: true }); // within radius 6
    controller.update(T0 + 400_000); // depot finishes
    expect(controller.derived.productionBonus[quarry.id]).toBe(25); // +25 % throughput
    expect(controller.derived.productionPerMin.stone).toBeCloseTo(38 * 1.25, 5);
  });

  it('an office supplies a large block of jobs (§ Arbeitsversorgung)', () => {
    const { controller } = newController();
    setLevel(controller, 8);
    flattenTerrain(controller);
    controller.state.resources = { money: 1_200_000, wood: 1_000, stone: 1_000, food: 1_000, freshwater: 0 };
    for (let dx = 5; dx <= 8; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    const before = controller.derived.capacity.work;
    expect(controller.placeBuilding('office', at(5, 6).x, at(5, 6).y)).toEqual({ ok: true }); // 4×4, 2000 jobs
    controller.update(T0 + 560_000); // office finishes (540s construction)
    expect(controller.derived.capacity.work - before).toBe(2_000);
  });
});

describe('energy grid (MVP 2)', () => {
  it('a power plant feeds the grid while buildings draw power', () => {
    const { controller } = newController();
    setLevel(controller, 11);
    flattenTerrain(controller);
    controller.state.resources = { money: 1_500_000, wood: 2_000, stone: 2_000, food: 1_000, freshwater: 0 };
    for (let dx = 5; dx <= 17; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    // A warehouse draws 5 energy; there is no supply until a plant is built.
    expect(controller.placeBuilding('warehouse', at(5, 6).x, at(5, 6).y)).toEqual({ ok: true });
    controller.update(T0 + 130_000); // warehouse finishes
    expect(controller.derived.extraDemand.energy).toBe(5);
    expect(controller.derived.capacity.energy).toBe(0);
    // The coal plant powers the whole city-wide grid (capacity need, no radius) —
    // ein 8×8-XXL-Areal (§ Gebäudesystem 2.0).
    expect(controller.placeBuilding('power_plant', at(10, 6).x, at(10, 6).y)).toEqual({ ok: true });
    controller.update(T0 + 130_000 + 500_000); // plant finishes (480s construction)
    expect(controller.derived.capacity.energy).toBe(5_000);
  });
});

describe('emergency services (MVP 2)', () => {
  it('a police station covers the homes within its safety radius', () => {
    const { controller } = newController();
    setLevel(controller, 13);
    flattenTerrain(controller);
    controller.state.resources = { money: 1_000_000, wood: 2_000, stone: 2_000, food: 1_000, freshwater: 0 };
    for (let dx = 5; dx <= 10; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
    controller.update(T0 + 25_000); // house finishes
    expect(controller.derived.needCoverage.safety).toBe(0); // no station yet
    // A police station (4×4) within its radius of the house covers it.
    expect(controller.placeBuilding('police_station', at(7, 6).x, at(7, 6).y)).toEqual({ ok: true });
    controller.update(T0 + 25_000 + 380_000); // station finishes (360s construction)
    expect(controller.derived.needCoverage.safety).toBe(1);
  });
});

describe('tax policy (MVP 2)', () => {
  it('scales residential income by the rate and clamps to the band', () => {
    const { controller } = newController();
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
    controller.update(T0 + 30_000 + 5 * MIN, true); // citizens move in
    const base = controller.getIncome().residential;
    expect(base).toBeGreaterThan(0);
    // Raising the rate scales income directly (happiness penalty applies next tick).
    controller.setTaxRate('residential', 1.5);
    expect(controller.getIncome().residential).toBeCloseTo(base * 1.5, 5);
    // The band now reaches a punishing 500 % (§9): 5.0 is in-band and sticks…
    controller.setTaxRate('residential', 5);
    expect(controller.state.policy.residentialTaxRate).toBe(5);
    // …but anything beyond clamps to the configured maximum.
    controller.setTaxRate('residential', 9);
    expect(controller.state.policy.residentialTaxRate).toBe(5);
  });

  it('lets a tax hike bite happiness over the following ticks', () => {
    const { controller } = newController();
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
    controller.update(T0 + 30_000 + 5 * MIN, true);
    const before = controller.state.citizens.happiness;
    controller.setTaxRate('residential', 1.5); // +50 % → −12 happiness
    controller.update(T0 + 30_000 + 6 * MIN, true);
    expect(controller.state.citizens.happiness).toBeLessThan(before);
  });
});

describe('housing model (§6)', () => {
  it('derives resident capacity from units × max residents per unit', () => {
    const { controller } = newController();
    setLevel(controller, 15); // residential tower unlocks at L15 (§ Gebäudesystem 2.0)
    flattenTerrain(controller);
    controller.state.resources = { money: 5_000_000, wood: 3_000, stone: 3_000, food: 1_000, freshwater: 0 };
    for (let dx = 5; dx <= 11; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y); // 1 unit × 5 = 5
    controller.placeBuilding('residential_tower', at(7, 6).x, at(7, 6).y); // 900 units × 5 = 4500
    controller.update(T0 + 700_000); // all finish
    // Capacity is scaled ×20 by populationScale (§9); household units are not.
    expect(controller.derived.capacity.housing).toBe((5 + 4_500) * 20);
    expect(controller.derived.housingUnits).toBe(1 + 900);
  });
});

describe('building upgrades (v0.17)', () => {
  it('gates densification upgrades behind city level and grows capacity on the same tile', () => {
    const { controller } = newController();
    flattenTerrain(controller);
    controller.state.resources = { money: 3_000_000, wood: 3_000, stone: 3_000, food: 1_000, freshwater: 0 };
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
    controller.update(T0 + 25_000); // house finishes (20s)
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;
    expect(controller.derived.capacity.housing).toBe(5 * 20); // 1 unit × 5 × scale

    // Stage 1 (Einfamilienhaus) needs level 3 — at level 1 visible but locked.
    const info1 = controller.getUpgradeInfo(house.id);
    expect(info1.lockedUntilLevel).toBe(3);
    expect(controller.upgradeBuilding(house.id)).toEqual({ ok: false, error: 'locked' });

    // Reach the level → the upgrade opens and adds households without a new tile.
    setLevel(controller, 3);
    expect(controller.getUpgradeInfo(house.id).lockedUntilLevel).toBeUndefined();
    expect(controller.upgradeBuilding(house.id)).toEqual({ ok: true });
    controller.update(T0 + 25_000 + 100_000); // upgrade construction (90s)
    expect(controller.derived.capacity.housing).toBe(15 * 20); // 3 units × 5, same footprint
  });

  it('lets the town hall be upgraded into a prestige centre (bigger central store)', () => {
    const { controller } = newController();
    const townHall = controller.state.buildings['b_townhall']!;
    const before = controller.derived.storageCaps.wood;
    setLevel(controller, 6); // Stadtverwaltung-Stufe (§ Gebäudesystem 2.0: Gate L6)
    controller.state.resources.money = 500_000;
    controller.state.resources.wood = 500;
    controller.state.resources.stone = 500;
    expect(controller.upgradeBuilding(townHall.id)).toEqual({ ok: true });
    controller.update(T0 + 200_000); // prestige rebuild (180s)
    expect(controller.derived.storageCaps.wood).toBeGreaterThan(before); // 400 → 700
  });
});

describe('generic coverage overlay (§1)', () => {
  it('tags homes as supplied, redundant or unsupplied around water sources', () => {
    const { controller } = newController();
    setLevel(controller, 3);
    flattenTerrain(controller);
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
    controller.update(T0 + 25_000); // house finishes

    // A well far from the house (Chebyshev 9): it doesn't reach → unsupplied.
    controller.placeBuilding('well', at(-5, -3).x, at(-5, -3).y);
    controller.update(T0 + 45_000);
    const far = Object.values(controller.state.buildings).find((b) => b.defId === 'well')!;
    const overlayFar = controller.getCoverageOverlay(far.id)!;
    expect(overlayFar.group).toEqual({ kind: 'need', need: 'water' });
    expect(overlayFar.consumers).toHaveLength(1);
    expect(overlayFar.consumers[0]!.state).toBe('unsupplied');

    // A well next to the house covers it → supplied; both wells show as sources.
    controller.placeBuilding('well', at(7, 6).x, at(7, 6).y);
    controller.update(T0 + 65_000);
    const near = Object.values(controller.state.buildings).filter((b) => b.defId === 'well')
      .find((b) => b.x === at(7, 6).x)!;
    const overlayNear = controller.getCoverageOverlay(near.id)!;
    expect(overlayNear.sources).toHaveLength(2);
    expect(overlayNear.consumers[0]!.state).toBe('supplied');
    expect(overlayNear.sources.some((s) => s.selected)).toBe(true);
  });
});
