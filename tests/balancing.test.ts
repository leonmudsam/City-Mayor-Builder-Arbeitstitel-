import { describe, expect, it } from 'vitest';
import { newController, setLevel, flattenTerrain, T0 } from './helpers.ts';

const MIN = 60_000;

// Long-term progression pass (v0.15). These lock in the coherent cost/XP/limit
// curve so a later "isolated number tweak" that breaks the intent gets caught.
describe('long-term balancing (v0.15)', () => {
  it('keeps the early game affordable from the starting budget (L1–3)', () => {
    const { controller } = newController();
    // A fresh mayor can immediately afford the first road + house + sawmill.
    expect(controller.canAffordCost(controller.getBuildCost('road'))).toBe(true);
    expect(controller.canAffordCost(controller.getBuildCost('house_small'))).toBe(true);
    setLevel(controller, 2);
    expect(controller.canAffordCost(controller.getBuildCost('sawmill'))).toBe(true);
  });

  it('does not let residential spam carry level progression (§4)', () => {
    const { controller } = newController();
    // Plenty of resources, still level 1 — isolate XP from the housing spam.
    controller.state.resources = { money: 500_000, wood: 500, stone: 100, food: 40, freshwater: 0 };
    for (let x = 22; x <= 31; x++) controller.placeBuilding('road', x, 26);
    // A street of small houses (2×2 footprints, spaced) beside the town-hall
    // road strip — lots of housing capacity…
    let built = 0;
    for (let x = 22; x <= 30; x += 2) if (controller.placeBuilding('house_small', x, 27).ok) built += 1;
    controller.update(T0 + 30_000 + 2 * MIN); // all finish
    expect(built).toBeGreaterThanOrEqual(5);
    expect(controller.derived.capacity.housing).toBeGreaterThanOrEqual(25);
    // …but houses give little XP, so the wall of homes alone stays low-level.
    expect(controller.state.level.current).toBeLessThanOrEqual(2);
  });

  it('makes each extra warehouse pricier — storage is an investment (§7)', () => {
    const { controller } = newController();
    setLevel(controller, 10);
    controller.state.resources = { money: 5_000_000, wood: 5_000, stone: 5_000, food: 1_000, freshwater: 0 };
    for (let x = 24; x <= 33; x++) controller.placeBuilding('road', x, 26);
    const base = controller.getBuildCost('warehouse').money!;
    expect(controller.placeBuilding('warehouse', 24, 27)).toEqual({ ok: true });
    const next = controller.getBuildCost('warehouse').money!;
    // costScaling 1.4: the second warehouse costs 40 % more than the first.
    expect(next).toBe(Math.round(base * 1.4));
    expect(next).toBeGreaterThan(base);
  });

  it('flags big public buildings as Großprojekte with an income guideline (§11)', () => {
    const { controller } = newController();
    // A single house is never a major project; the hospital always is.
    expect(controller.isMajorProject('house_small')).toBe(false);
    expect(controller.isMajorProject('hospital')).toBe(true);
    expect(controller.isMajorProject('office')).toBe(true);
    // Recommended steady income = money cost ÷ payback window (2.2 Mio ÷ 20).
    expect(controller.recommendedIncomeFor('hospital')).toBe(110_000);
  });

  it('gives far more XP for a milestone building than for a house (quality > quantity)', () => {
    const { controller } = newController();
    const office = controller.config.buildings.get('office')!;
    const house = controller.config.buildings.get('house_small')!;
    expect(office.xpReward).toBeGreaterThan(house.xpReward * 20);
  });
});

// Big-city scaling (v0.16): services gate by radius AND capacity, and dense
// housing carries realistic populations.
describe('big-city scaling (v0.16)', () => {
  it('limits a service by capacity, not just radius, in a metropolis (§2)', () => {
    const { controller } = newController();
    setLevel(controller, 14);
    flattenTerrain(controller);
    controller.state.resources = { money: 5_000_000, wood: 5_000, stone: 5_000, food: 5_000, freshwater: 0 };
    for (let x = 26; x <= 33; x++) controller.placeBuilding('road', x, 26);
    controller.placeBuilding('house_small', 26, 27);
    expect(controller.placeBuilding('police_station', 29, 27)).toEqual({ ok: true });
    controller.update(T0 + 25_000 + 380_000); // house + station finish
    expect(controller.derived.coverageCapacity.safety).toBe(8_000);
    // A small population sits well inside the served capacity → fully covered.
    expect(controller.state.citizens.needs.safety.fulfillment).toBeGreaterThan(0.9);
    // Simulate a metropolis: far more residents than one station can serve.
    controller.state.citizens.population = 20_000;
    controller.update(T0 + 25_000 + 380_000 + 1_000);
    // Radius still reaches every home, but capacity (8 000) can't serve 20 000,
    // so safety is only partially fulfilled — reach isn't the bottleneck, capacity is.
    const fulfillment = controller.state.citizens.needs.safety.fulfillment;
    expect(fulfillment).toBeGreaterThan(0.3);
    expect(fulfillment).toBeLessThan(0.6);
  });

  it('houses realistic populations from dense buildings (§3/§4)', () => {
    const { controller } = newController();
    setLevel(controller, 12);
    flattenTerrain(controller);
    controller.state.resources = { money: 5_000_000, wood: 5_000, stone: 5_000, food: 5_000, freshwater: 0 };
    for (let x = 22; x <= 33; x++) controller.placeBuilding('road', x, 26);
    // One apartment now houses hundreds; one tower, ~1 800 — a real city scale.
    expect(controller.placeBuilding('apartment', 22, 27)).toEqual({ ok: true });
    expect(controller.placeBuilding('residential_tower', 26, 27)).toEqual({ ok: true });
    controller.update(T0 + 20 * MIN); // both finish
    expect(controller.derived.capacity.housing).toBeGreaterThanOrEqual(2_000);
  });
});
