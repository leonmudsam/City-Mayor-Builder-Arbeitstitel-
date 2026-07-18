import { describe, expect, it } from 'vitest';
import { nearTownHall, newController, setLevel, T0 } from './helpers.ts';

// Building diagnostics feed both the map markers and the sheet's problem/benefit
// section (§2/§4). They only read the simulation, so these lock the mapping from
// state → shown marker. Layout: Straßenzeile bei Rathaus-y+5, Anbauten ab y+6.
const at = (dx: number, dy: number) => nearTownHall(dx, dy);

describe('building diagnostics (v0.19)', () => {
  it('flags a ready upgrade as a benefit + upgrade marker', () => {
    const { controller } = newController();
    setLevel(controller, 6);
    controller.state.resources = { money: 5_000_000, wood: 5_000, stone: 5_000, food: 1_000, freshwater: 0 };
    for (let dx = 5; dx <= 11; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    controller.placeBuilding('house_small', at(5, 6).x, at(5, 6).y);
    controller.update(T0 + 30_000); // construction (20s) finishes → active
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;
    const diag = controller.getBuildingDiagnostics(house.id);
    expect(diag.some((d) => d.code === 'upgrade_ready')).toBe(true);
    expect(controller.getBuildingMarker(house.id)).toBe('upgrade');
  });

  it('flags full storage as a production problem + problem marker', () => {
    const { controller } = newController();
    setLevel(controller, 2);
    for (let dx = 5; dx <= 11; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    controller.placeBuilding('sawmill', at(5, 6).x, at(5, 6).y);
    controller.update(T0 + 40_000); // finishes
    const mill = Object.values(controller.state.buildings).find((b) => b.defId === 'sawmill')!;
    // Fill the wood store to its cap so production has nowhere to go.
    controller.state.resources.wood = controller.derived.storageCaps.wood;
    const diag = controller.getBuildingDiagnostics(mill.id);
    expect(diag.some((d) => d.code === 'storage_full')).toBe(true);
    expect(controller.getBuildingMarker(mill.id)).toBe('problem');
  });

  it('reports no problems for a healthy, road-connected building', () => {
    const { controller } = newController();
    setLevel(controller, 2);
    for (let dx = 5; dx <= 11; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    controller.placeBuilding('house_small', at(5, 6).x, at(5, 6).y);
    controller.update(T0 + 30_000);
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;
    const diag = controller.getBuildingDiagnostics(house.id);
    // Connected to the road network shows as a benefit, and there's no problem.
    expect(diag.some((d) => d.code === 'road_ok')).toBe(true);
    expect(diag.some((d) => d.kind === 'problem')).toBe(false);
  });
});
