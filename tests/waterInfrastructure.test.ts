import { describe, expect, it } from 'vitest';
import { WATER_DEPTH_SCALE, waterDepthGrid } from '../src/game/config/world/islandBuildability.gen.ts';
import { harborCandidates } from '../src/game/config/world/islandInfrastructure.gen.ts';
import { bakedSurfaceAt, WORLD_TILES } from '../src/game/config/startRegion.config.ts';
import { waterfrontWaterCells } from '../src/game/buildings/placement.ts';
import { newController, refreshDerived, setLevel } from './helpers.ts';

function prepareWholeIsland() {
  const { controller } = newController(undefined, { flatten: false });
  setLevel(controller, 20);
  for (const region of Object.values(controller.state.world.regions)) region.status = 'unlocked';
  controller.state.resources.money = 20_000_000;
  controller.state.resources.wood = 20_000;
  controller.state.resources.stone = 20_000;
  refreshDerived(controller);
  return controller;
}

function candidatePlacements(controller: ReturnType<typeof prepareWholeIsland>, defId: 'dock_small' | 'river_port') {
  const result: { x: number; y: number; rotation: 0 | 90 | 180 | 270 }[] = [];
  for (const candidate of harborCandidates) {
    for (let dy = -8; dy <= 8; dy++) {
      for (let dx = -8; dx <= 8; dx++) {
        const x = candidate.position.x + dx;
        const y = candidate.position.y + dy;
        const preview = controller.getWaterfrontPlacementPreview(defId, { x, y });
        if (!preview?.valid) continue;
        if (result.some((placed) => Math.hypot(placed.x - x, placed.y - y) < 20)) continue;
        result.push({ x, y, rotation: preview.suggestedRotation });
        break;
      }
      if (result.at(-1)?.y === candidate.position.y + dy) break;
    }
  }
  return result;
}

describe('Wasser-Infrastruktur 7.0', () => {
  it('keeps the water footprint opposite the +Z land-facing side for every rotation', () => {
    const controller = prepareWholeIsland();
    const def = controller.config.buildings.get('dock_small')!;
    const x = 100;
    const y = 100;
    expect(waterfrontWaterCells(def, x, y, 0).every((cell) => cell.y < y)).toBe(true);
    expect(waterfrontWaterCells(def, x, y, 90).every((cell) => cell.x < x)).toBe(true);
    expect(waterfrontWaterCells(def, x, y, 180).every((cell) => cell.y >= y + def.size.h)).toBe(true);
    expect(waterfrontWaterCells(def, x, y, 270).every((cell) => cell.x >= x + def.size.w)).toBe(true);
  });

  it('snaps a split land/water footprint to a deep, navigable shoreline', () => {
    const controller = prepareWholeIsland();
    const position = candidatePlacements(controller, 'dock_small')[0];
    expect(position).toBeDefined();
    const preview = controller.getWaterfrontPlacementPreview('dock_small', position!);
    expect(preview).toMatchObject({ valid: true, suggestedRotation: position!.rotation });
    expect(preview!.minimumDepth).toBeGreaterThanOrEqual(0.55);
    expect(controller.placeBuilding('dock_small', position!.x, position!.y)).toEqual({ ok: true });

    const dock = Object.values(controller.state.buildings).find((building) => building.defId === 'dock_small')!;
    expect(dock.rotation ?? 0).toBe(position!.rotation);
    const def = controller.config.buildings.get('dock_small')!;
    for (const cell of waterfrontWaterCells(def, dock.x, dock.y, dock.rotation ?? 0)) {
      expect(bakedSurfaceAt(cell.x, cell.y).water).toBe(true);
      expect(waterDepthGrid[cell.y * WORLD_TILES + cell.x]! / WATER_DEPTH_SCALE).toBeGreaterThanOrEqual(0.55);
    }
    expect(controller.getBuildingInfrastructureStatus(dock.id)).toMatchObject({ status: 'water_only' });
  });

  it('finds a graph route between two placed harbors without persisting a shipping simulation', () => {
    const controller = prepareWholeIsland();
    const placements = candidatePlacements(controller, 'dock_small');
    expect(placements.length).toBeGreaterThan(2);
    const harborIds: string[] = [];
    for (const position of placements.slice(0, 10)) {
      if (!controller.placeBuilding('dock_small', position.x, position.y).ok) continue;
      harborIds.push(Object.values(controller.state.buildings).at(-1)!.id);
    }
    expect(harborIds.length).toBeGreaterThan(1);

    const previews = harborIds.flatMap((origin, index) => harborIds.slice(index + 1)
      .map((destination) => controller.getShippingRoutePreview(origin, destination))
      .filter((preview) => preview?.status === 'planned'));
    expect(previews.length).toBeGreaterThan(0);
    expect(previews[0]!.points.length).toBeGreaterThan(1);
    expect(previews[0]!.distance).toBeGreaterThan(0);
    expect('shippingRoutes' in controller.state).toBe(false);
  });
});
