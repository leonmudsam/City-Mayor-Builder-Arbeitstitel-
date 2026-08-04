import { describe, expect, it } from 'vitest';
import { flattenTerrain, nearTownHall, newController, paintTerrain, setLevel, T0 } from './helpers.ts';

const MIN = 60_000;

// Insel-Layout (v11): Rathaus 5×5, Startstraßen-Zeile bei y+5 (x..x+4).
// Tests platzieren relativ zum Rathaus: Erweiterungs-Straßen ab at(5,5) in der
// Zeile, Gebäude ab at(·,6) darunter.
const at = (dx: number, dy: number) => nearTownHall(dx, dy);

describe('simulation tick', () => {
  it('completes construction over time and awards XP', () => {
    const { controller } = newController();
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y); // 20s construction
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small');
    expect(house?.status).toBe('constructing');
    const xpBefore = controller.state.level.xp;
    controller.update(T0 + 21_000);
    expect(house?.status).toBe('active');
    expect(controller.state.level.xp).toBe(xpBefore + 5);
  });

  // § Active Operations 2.0 / A6+A7: Sägewerk, Steinbruch UND Farm erzeugen nichts
  // mehr passiv (eigene Aktiv-Tests in operations.test.ts / activeOperations.test.ts).
  // Der passive „nichts offline / Produktion nur live"-Vertrag wird deshalb an der
  // Bäckerei geprüft — dem verbliebenen dauerhaft passiven Produzenten.
  it('produces into storage only while playing live, never offline (§ no AFK)', () => {
    const { controller } = newController();
    setLevel(controller, 9);
    flattenTerrain(controller);
    controller.state.resources = { money: 500_000, wood: 400, stone: 400, food: 0, freshwater: 0, planks: 0, cut_stone: 0 };
    controller.placeBuilding('bakery', at(1, 6).x, at(1, 6).y); // 90 food/min, 2×2
    controller.update(T0 + 241_000, true); // construction (240s) done
    const foodAfterBuild = controller.state.resources.food;

    // Offline catch-up: build timers advance but NOTHING is produced (v0.21).
    controller.update(T0 + 241_000 + 5 * MIN, false);
    expect(controller.state.resources.food).toBe(foodAfterBuild);

    // Live play: production accrues into storage (2 min × 90/min = 180).
    const producedBefore = controller.state.stats.produced.food;
    controller.update(T0 + 241_000 + 7 * MIN, true);
    expect(controller.state.resources.food).toBeCloseTo(foodAfterBuild + 180, 0);
    expect(controller.state.stats.produced.food - producedBefore).toBeCloseTo(180, 0);
    // Storage still caps hoarding even when live (town hall: 400 food).
    controller.update(T0 + 8 * 60 * MIN, true);
    expect(controller.state.resources.food).toBe(400);
  });

  // § A6: Der Standort-Bonus ist nicht verschwunden — er wirkt jetzt auf die
  // Arbeitsschleife statt auf eine Passivrate. Ein Steinbruch am Fels arbeitet
  // messbar schneller als derselbe Steinbruch ohne Fels in Reichweite.
  it('applies the terrain location bonus to an active operation', () => {
    const throughputWith = (mountainTiles: boolean) => {
      const { controller } = newController();
      setLevel(controller, 4);
      flattenTerrain(controller);
      controller.state.resources = { money: 500_000, wood: 400, stone: 0, food: 100, freshwater: 0, planks: 0, cut_stone: 0 };
      // Abbaubarer Fels im Arbeitsgebiet — ohne ihn gäbe es gar keine Knoten.
      const pit: [number, number][] = [];
      for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 4; dx++) pit.push([at(8 + dx, 6 + dy).x, at(8 + dx, 6 + dy).y]);
      paintTerrain(controller, pit, 'mountain');
      // Zusätzlicher Fels DIREKT neben der Grundfläche (Radius 3) → Standort-Bonus.
      if (mountainTiles) {
        paintTerrain(
          controller,
          [[at(6, 6).x, at(6, 6).y], [at(6, 7).x, at(6, 7).y], [at(6, 8).x, at(6, 8).y], [at(6, 9).x, at(6, 9).y]],
          'mountain',
        );
      }
      expect(controller.placeBuilding('quarry', at(1, 6).x, at(1, 6).y)).toEqual({ ok: true });
      controller.update(T0 + 91_000, true);
      const quarry = Object.values(controller.state.buildings).find((b) => b.defId === 'quarry')!;
      expect(controller.startBuildingOperation(quarry.id)).toEqual({ ok: true });
      return controller.getOperationThroughput(quarry.id)!.perMinute;
    };
    const plain = throughputWith(false);
    const atRockFace = throughputWith(true);
    expect(plain).toBeGreaterThan(0);
    expect(atRockFace).toBeGreaterThan(plain);
  });

  it('only counts water supply for housing inside a well radius', () => {
    const { controller } = newController();
    setLevel(controller, 3);
    flattenTerrain(controller);
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
    controller.update(T0 + 30_000 + 5 * MIN, true); // citizens move in
    // Well far away (Chebyshev 9 vom Haus): capacity exists, coverage 0.
    expect(controller.placeBuilding('well', at(-5, -3).x, at(-5, -3).y)).toEqual({ ok: true });
    controller.update(T0 + 30_000 + 6 * MIN, true);
    expect(controller.state.citizens.needs.water.fulfillment).toBe(0);
    // A well next to the house covers it fully.
    expect(controller.placeBuilding('well', at(7, 6).x, at(7, 6).y)).toEqual({ ok: true });
    controller.update(T0 + 30_000 + 7 * MIN, true);
    expect(controller.state.citizens.needs.water.fulfillment).toBe(1);
  });

  it('refunds a share of the invested cost when demolishing', () => {
    const { controller } = newController();
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y); // cost: 12 000 money, 30 wood
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;
    const moneyBefore = controller.state.resources.money;
    const woodBefore = controller.state.resources.wood;
    // 25 % refund, floored per resource: 3 000 money, 7 wood (⌊30 × 0.25⌋).
    expect(controller.getDemolishRefund(house.id)).toEqual({ money: 3_000, wood: 7 });
    expect(controller.demolishBuilding(house.id)).toEqual({ ok: true });
    expect(controller.state.resources.money).toBe(moneyBefore + 3_000);
    expect(controller.state.resources.wood).toBe(woodBefore + 7);
  });

  it('raises happiness when residential quality improves (zoning)', () => {
    const { controller } = newController();
    setLevel(controller, 7);
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
    controller.update(T0 + 30_000 + 5 * MIN, true); // citizens settle in
    const before = controller.state.citizens.happiness;
    expect(controller.derived.avgAmbience).toBe(0);
    // A tree next to the house (ambience +1, radius 3) — a pure ambience source.
    // Small houses weigh their surroundings more (sensitivity 1.4, §7).
    expect(controller.placeBuilding('deco_tree', at(7, 7).x, at(7, 7).y)).toEqual({ ok: true });
    expect(controller.derived.avgAmbience).toBeCloseTo(1.4, 5);
    controller.update(T0 + 30_000 + 6 * MIN, true); // happiness recomputed with ambience
    expect(controller.state.citizens.happiness).toBeGreaterThan(before);
  });

  it('caps production buildings per level and lifts the cap with progress', () => {
    const { controller } = newController();
    setLevel(controller, 2); // sawmill cap 2 at level 2
    for (let dx = 5; dx <= 17; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    expect(controller.getBuildLimit('sawmill')).toEqual({ count: 0, max: 2, nextLevel: 5 });
    expect(controller.placeBuilding('sawmill', at(5, 6).x, at(5, 6).y)).toEqual({ ok: true });
    expect(controller.placeBuilding('sawmill', at(9, 6).x, at(9, 6).y)).toEqual({ ok: true });
    // Third sawmill exceeds the level-2 cap.
    expect(controller.placeBuilding('sawmill', at(13, 6).x, at(13, 6).y)).toEqual({ ok: false, error: 'limit_reached' });
    expect(controller.getBuildLimit('sawmill')).toEqual({ count: 2, max: 2, nextLevel: 5 });
    // Houses carry a per-level cap too (§ anti-spam): 10 at level 1–4, more from
    // level 5 — density comes from upgrades rather than spam (§ Gebäudesystem 2.0).
    expect(controller.getBuildLimit('house_small')).toEqual({ count: 0, max: 10, nextLevel: 5 });
    // Reaching level 5 raises the cap to 3.
    setLevel(controller, 5);
    expect(controller.placeBuilding('sawmill', at(13, 6).x, at(13, 6).y)).toEqual({ ok: true });
  });

  it('feeds only homes a market reaches (food distribution coverage)', () => {
    const { controller } = newController();
    setLevel(controller, 5);
    controller.state.resources = { money: 200_000, wood: 500, stone: 500, food: 100, freshwater: 0, planks: 0, cut_stone: 0 };
    for (let dx = 5; dx <= 10; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
    controller.update(T0 + 25_000); // house finishes construction
    expect(controller.derived.distributionCoverage.food).toBe(0); // no market yet
    controller.placeBuilding('market', at(7, 6).x, at(7, 6).y); // center within radius of the house
    controller.update(T0 + 25_000 + 95_000); // market finishes construction
    expect(controller.derived.distributionCoverage.food).toBe(1);
  });

  it('runs the drinking-water chain: riverside waterworks → supermarket → homes', () => {
    const { controller } = newController();
    setLevel(controller, 12);
    flattenTerrain(controller);
    controller.state.resources = { money: 2_000_000, wood: 2_000, stone: 2_000, food: 2_000, freshwater: 0, planks: 0, cut_stone: 0 };
    for (let dx = 5; dx <= 19; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    paintTerrain(controller, [[at(4, 8).x, at(4, 8).y]], 'river'); // a river tile beside the waterworks spot

    // A waterworks must border the river: away from it, placement is refused.
    expect(controller.placeBuilding('waterworks', at(11, 6).x, at(11, 6).y)).toEqual({ ok: false, error: 'needs_water' });
    // At the riverfront it builds and starts making the freshwater product.
    expect(controller.placeBuilding('waterworks', at(5, 6).x, at(5, 6).y)).toEqual({ ok: true });
    controller.placeBuilding('house_small', at(11, 6).x, at(11, 6).y);
    expect(controller.placeBuilding('supermarket', at(15, 6).x, at(15, 6).y)).toEqual({ ok: true }); // distributes freshwater

    controller.update(T0 + 30 * MIN, true); // build + produce + distribute
    expect(controller.derived.productionPerMin.freshwater).toBeGreaterThan(0); // waterworks producing
    expect(controller.state.resources.freshwater).toBeGreaterThan(0); // the product accumulates in storage
    expect(controller.derived.distributionCoverage.freshwater).toBe(1); // supermarket reaches the home
    expect(controller.state.citizens.needs.freshwater.fulfillment).toBeGreaterThan(0.5); // citizens supplied
  });

  it('grows population when housing exists and happiness is high', () => {
    const { controller } = newController();
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
    controller.update(T0 + 19_000, true); // house still under construction (20s)
    expect(controller.state.citizens.population).toBe(0);
    controller.update(T0 + 30_000 + 10 * MIN, true);
    // Small house = 1 unit × 5 residents × populationScale 20 → cap 100; growth
    // fills it then stops (§6/§9).
    expect(controller.state.citizens.population).toBe(100);
  });

  it('drops happiness when water is missing at level 3+', () => {
    const { controller } = newController();
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
    controller.update(T0 + 30_000 + 5 * MIN, true); // population moved in at level 1
    setLevel(controller, 3); // water need activates, no wells exist
    controller.update(T0 + 30_000 + 6 * MIN, true);
    expect(controller.state.citizens.needs.water.fulfillment).toBe(0);
    expect(controller.state.citizens.happiness).toBeLessThan(75);
  });

  it('keeps the simulation deterministic for the same inputs', () => {
    const run = () => {
      const { controller } = newController();
      controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
      controller.update(T0 + 60 * MIN);
      return JSON.stringify(controller.state);
    };
    expect(run()).toBe(run());
  });
});
