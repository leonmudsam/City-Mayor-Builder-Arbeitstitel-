import { describe, expect, it } from 'vitest';
import { foundationPlanForSurface } from '../src/game/buildings/foundation.ts';
import type { PlacementSurfaceSample } from '../src/game/map/world.ts';
import { WORLD_TILES } from '../src/game/config/startRegion.config.ts';
import { newController } from './helpers.ts';

const surface = (overrides: Partial<PlacementSurfaceSample> = {}): PlacementSurfaceSample => ({
  minHeight: 0,
  maxHeight: 0.05,
  averageHeight: 0.025,
  slope: 0.08,
  normal: { x: 0, y: 1, z: 0 },
  terrainType: 'grass',
  regionId: 1,
  waterOverlap: 0,
  cliffOverlap: 0,
  waterfrontRatio: 0,
  shoreTypes: new Set<string>(),
  buildableRatio: 1,
  ...overrides,
});

describe('kanonischer Fundamentplan', () => {
  it.each([
    ['BUILDABLE_FLAT', 'natural', surface()],
    ['BUILDABLE_SLOPE', 'stepped', surface({ maxHeight: 0.55, slope: 0.6 })],
    ['BUILDABLE_TERRACE', 'terrace', surface({ maxHeight: 1.35, slope: 1.1 })],
    ['WATER_EDGE', 'piles', surface({ waterOverlap: 0.2, waterfrontRatio: 0.5 })],
    ['CLIFF', 'cliff_wall', surface({ cliffOverlap: 0.2, maxHeight: 0.8 })],
  ] as const)('klassifiziert %s als %s', (category, kind, input) => {
    const plan = foundationPlanForSurface(input, 3, 3);
    expect(plan.category).toBe(category);
    expect(plan.kind).toBe(kind);
  });

  it('berechnet nur für konstruktive Fundamente Material und Bauzeit', () => {
    const flat = foundationPlanForSurface(surface(), 3, 3);
    const terrace = foundationPlanForSurface(surface({ maxHeight: 1.4, slope: 1.2 }), 3, 3);
    expect(flat.extraCost).toEqual({});
    expect(flat.extraConstructionSec).toBe(0);
    expect(terrace.extraCost.money).toBeGreaterThan(0);
    expect(terrace.extraCost.stone).toBeGreaterThan(0);
    expect(terrace.extraConstructionSec).toBeGreaterThan(0);
    expect(terrace.tiers).toBeGreaterThanOrEqual(2);
  });

  it('zeigt und berechnet am echten Hang exakt dieselben Mehrkosten und dieselbe Bauzeit', () => {
    const { controller } = newController(undefined, { flatten: false });
    for (const region of Object.values(controller.state.world.regions)) region.status = 'unlocked';
    controller.state.resources = { money: 5_000_000, wood: 10_000, stone: 10_000, food: 1_000, freshwater: 0, planks: 0, cut_stone: 0 };
    let candidate: {
      x: number;
      y: number;
      diagnostics: NonNullable<ReturnType<typeof controller.placementDiagnostics>>;
    } | undefined;
    // Eine echte Inselposition statt eines künstlichen Renderer-Hangs. Die Suche
    // endet am ersten gültigen 2×2-Standort mit konstruktivem Fundament.
    outer: for (let y = 1; y < WORLD_TILES - 2; y++) {
      for (let x = 1; x < WORLD_TILES - 2; x++) {
        const diagnostics = controller.placementDiagnostics('house_small', x, y);
        if (diagnostics?.valid && diagnostics.foundation.kind !== 'natural') {
          candidate = { x, y, diagnostics };
          break outer;
        }
      }
    }
    expect(candidate).toBeDefined();
    const chosen = candidate!;
    const before = { ...controller.state.resources };
    const result = controller.placeBuilding('house_small', chosen.x, chosen.y);
    expect(result.ok).toBe(true);
    for (const [resource, amount] of Object.entries(chosen.diagnostics.buildCost)) {
      expect(controller.state.resources[resource as keyof typeof before]).toBe(
        before[resource as keyof typeof before] - (amount ?? 0),
      );
    }
    const building = Object.values(controller.state.buildings).find(
      (entry) => entry.defId === 'house_small' && entry.x === chosen.x && entry.y === chosen.y,
    );
    const baseSeconds = controller.config.buildings.get('house_small')!.constructionSec;
    expect(building?.constructionEndsAt).toBe(
      controller.state.meta.lastSimTime + (baseSeconds + chosen.diagnostics.foundation.extraConstructionSec) * 1000,
    );
  });
});
