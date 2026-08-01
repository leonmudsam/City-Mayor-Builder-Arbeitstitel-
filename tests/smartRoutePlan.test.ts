import { describe, expect, it } from 'vitest';
import type { CargoPlan, InfrastructureEvaluation } from '../src/game/activities/logistics.ts';
import type { RouteAnalysis, RouteSegment } from '../src/game/activities/routeAnalysis.ts';
import type { DriveVehicle } from '../src/game/config/types.ts';
import {
  buildSmartRoadPath,
  createSmartRouteSuggestion,
  type SmartRouteReader,
} from '../src/components/citywork/smartRoutePlan.ts';
import { flattenTerrain, nearTownHall, newController, setLevel, T0 } from './helpers.ts';

const positions: Record<string, number> = {
  a: 2,
  b: 4,
};

function analysisFor(ids: string[], connected = true): RouteAnalysis {
  const segments: RouteSegment[] = [];
  let fromId = 'source';
  let fromX = 0;
  for (const id of ids) {
    const toX = positions[id]!;
    const step = Math.sign(toX - fromX);
    const path = Array.from({ length: Math.abs(toX - fromX) + 1 }, (_, index) => ({
      x: fromX + step * index,
      y: 0,
    }));
    segments.push({
      fromId,
      toId: id,
      fromXY: { x: fromX, y: 0 },
      toXY: { x: toX, y: 0 },
      distanceTiles: Math.abs(toX - fromX),
      onRoad: connected,
      congestionScore: 0,
      load: 0,
      path,
    });
    fromId = id;
    fromX = toX;
  }
  return {
    orderedTargetIds: [...ids],
    segments,
    distanceTiles: segments.reduce((sum, segment) => sum + segment.distanceTiles, 0),
    estimatedDurationMs: 10_000,
    intersections: 0,
    roadCoverage: connected ? 1 : 0,
    congestionRisk: 'low',
    efficiencyScore: 100,
    expectedMedal: 'gold',
    rewardMultiplier: 1,
  };
}

function cargoFor(vehicle: DriveVehicle): CargoPlan {
  const compact = vehicle === 'van';
  return {
    resource: 'wood',
    capacity: compact ? 3 : 10,
    totalRequired: 6,
    loadsRequired: compact ? 2 : 1,
    requirements: [
      { targetId: 'a', resource: 'wood', amount: 3 },
      { targetId: 'b', resource: 'wood', amount: 3 },
    ],
    legs: compact
      ? [
          { index: 0, type: 'pickup', sourceId: 'source-building', targetIds: [], resource: 'wood', amount: 3 },
          { index: 1, type: 'delivery', targetIds: ['a'], resource: 'wood', amount: 3 },
          { index: 2, type: 'pickup', sourceId: 'source-building', targetIds: [], resource: 'wood', amount: 3 },
          { index: 3, type: 'delivery', targetIds: ['b'], resource: 'wood', amount: 3 },
        ]
      : [
          { index: 0, type: 'pickup', sourceId: 'source-building', targetIds: [], resource: 'wood', amount: 6 },
          { index: 1, type: 'delivery', targetIds: ['a', 'b'], resource: 'wood', amount: 6 },
        ],
    oversizedTargetIds: [],
    needsReload: compact,
  };
}

function infrastructureFor(vehicle: DriveVehicle): InfrastructureEvaluation {
  const reloadTrips = vehicle === 'van' ? 1 : 0;
  return {
    loadsRequired: reloadTrips + 1,
    reloadTrips,
    totalDistanceTiles: reloadTrips ? 8 : 4,
    loadedDistanceTiles: 4,
    emptyDistanceTiles: reloadTrips ? 2 : 0,
    emptyTravelRatio: reloadTrips ? 0.25 : 0,
    routeDirectness: 1,
    vehicleSuitability: 1,
    warehousePlacementScore: 1,
    congestionScore: 0,
    estimatedDurationMs: reloadTrips ? 20_000 : 12_000,
    drivingDurationMs: reloadTrips ? 18_000 : 10_000,
    handlingDurationMs: 2_000,
    spoilageRisk: 0,
    warnings: [],
  };
}

function reader(connected = true): SmartRouteReader {
  return {
    analyseActivityRoute: (_defId, ids) => analysisFor(ids, connected),
    getActivityCargoPlan: (_defId, _ids, vehicle) => cargoFor(vehicle ?? 'van'),
    getActivityInfrastructure: (_defId, _ids, vehicle) => infrastructureFor(vehicle ?? 'van'),
    getActivityRoutePreview: (_defId, _ids, roadPath) => ({
      complete: connected && roadPath.length > 1 && roadPath.at(-1)?.x === 4,
    }),
  };
}

describe('Smart-first Stadtarbeit', () => {
  it('wählt über bestehende Cargo-/Infrastrukturwerte das Fahrzeug ohne Nachladen', () => {
    const suggestion = createSmartRouteSuggestion(
      reader(),
      'log_transport',
      ['b', 'a'],
      [{ id: 'van' }, { id: 'large_truck' }],
    );

    expect(suggestion?.vehicle).toBe('large_truck');
    expect(suggestion?.orderedTargetIds).toEqual(['a', 'b']);
    expect(suggestion?.roadPath).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
    ]);
    expect(suggestion?.ready).toBe(true);
  });

  it('setzt notwendige Nachlade-Rückfahrten aus denselben Controller-Pfaden zusammen', () => {
    expect(buildSmartRoadPath(reader(), 'log_transport', ['a', 'b'], 'van')).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
    ]);
  });

  it('täuscht bei einem unverbundenen Straßennetz keinen fertigen Vorschlag vor', () => {
    expect(createSmartRouteSuggestion(
      reader(false),
      'log_transport',
      ['a', 'b'],
      [{ id: 'van' }],
    )).toBeUndefined();
  });

  it('erzeugt in einer echten Controller-Stadt einen direkt startbaren Vorschlag', () => {
    const { controller } = newController();
    setLevel(controller, 12);
    flattenTerrain(controller);
    controller.state.resources = {
      money: 500_000,
      wood: 500,
      stone: 500,
      food: 4_000,
      freshwater: 0,
    };
    for (let dx = 5; dx <= 23; dx += 1) {
      const point = nearTownHall(dx, 5);
      controller.placeBuilding('road', point.x, point.y);
    }
    for (const dx of [3, 6, 9, 12, 15]) {
      const point = nearTownHall(dx, 6);
      controller.placeBuilding('house_small', point.x, point.y);
    }
    const farm = nearTownHall(18, 6);
    controller.placeBuilding('farm', farm.x, farm.y);
    controller.update(T0 + 90_000, false);
    controller.selectActivity('food_delivery');
    const context = controller.getActivityPlanningContext('food_delivery')!;

    const suggestion = createSmartRouteSuggestion(
      controller,
      'food_delivery',
      context.targetBuildingIds,
      context.vehicles,
    );

    expect(suggestion).toBeDefined();
    expect(suggestion?.ready).toBe(true);
    expect(suggestion?.roadPath.length).toBeGreaterThan(1);
    expect(
      controller.getActivityRoutePreview(
        'food_delivery',
        context.targetBuildingIds,
        suggestion!.roadPath,
        suggestion!.vehicle,
      )?.complete,
    ).toBe(true);

    const vanPath = buildSmartRoadPath(
      controller,
      'food_delivery',
      suggestion!.orderedTargetIds,
      'van',
    );
    const vanPreview = controller.getActivityRoutePreview(
      'food_delivery',
      context.targetBuildingIds,
      vanPath,
      'van',
    );
    expect(vanPreview?.complete).toBe(true);
  });
});
