import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BAKED_START,
  BAKED_WORLD,
  WORLD_SOURCE_SHA256,
  WORLD_TILES,
  terrainGrid,
} from '../src/game/config/world/islandTerrain.gen.ts';
import {
  BUILDABLE_BIT,
  WATERFRONT_BIT,
  buildabilityGrid,
  shoreTypeGrid,
  surfaceHeightGrid,
  surfaceSlopeGrid,
  waterDepthGrid,
} from '../src/game/config/world/islandBuildability.gen.ts';
import {
  bridgeCandidates,
  elevatedRoadCandidates,
  harborCandidates,
  tunnelCandidates,
  waterRouteEdges,
  waterRouteNodes,
} from '../src/game/config/world/islandInfrastructure.gen.ts';
import { HEIGHT_GRID, heightGrid } from '../src/renderer/three/worldHeight.gen.ts';
import { coastDistanceGrid, oceanDepthGrid, shoreTypeGrid as rendererShoreTypeGrid, waterMaskGrid } from '../src/renderer/three/worldMasks.gen.ts';

describe('Terrain & World Scale Overhaul 6.1 bake', () => {
  it('binds all generated data to the audited 78-part source GLB', () => {
    const source = readFileSync('reference/world/island 3d new.glb');
    expect(createHash('sha256').update(source).digest('hex')).toBe(WORLD_SOURCE_SHA256);
    const report = JSON.parse(readFileSync('tools/new-island-report.json', 'utf8')) as {
      source: { sha256: string };
      counts: { parts: number; vertices: number; triangles: number };
    };
    expect(report.source.sha256).toBe(WORLD_SOURCE_SHA256);
    expect(report.counts).toMatchObject({ parts: 78, vertices: 945_473, triangles: 1_849_632 });
  });

  it('keeps terrain, surface, water and height grids dimensionally synchronized', () => {
    const tileCount = WORLD_TILES * WORLD_TILES;
    expect(WORLD_TILES).toBe(512);
    expect(HEIGHT_GRID).toBe(WORLD_TILES * 2 + 1);
    expect(terrainGrid).toHaveLength(tileCount);
    expect(buildabilityGrid).toHaveLength(tileCount);
    expect(surfaceHeightGrid).toHaveLength(tileCount);
    expect(surfaceSlopeGrid).toHaveLength(tileCount);
    expect(waterDepthGrid).toHaveLength(tileCount);
    expect(waterMaskGrid).toHaveLength(tileCount);
    expect(coastDistanceGrid).toHaveLength(tileCount);
    expect(oceanDepthGrid).toHaveLength(tileCount);
    expect(shoreTypeGrid).toHaveLength(tileCount);
    expect(rendererShoreTypeGrid).toEqual(shoreTypeGrid);
    expect(heightGrid).toHaveLength(HEIGHT_GRID * HEIGHT_GRID);
  });

  it('never turns top-down-degenerate coast walls into isolated heightfield cones', () => {
    expect(BAKED_WORLD.coastGeometry.projectedDegenerateTrianglesSkipped).toBeGreaterThan(100);
    expect(BAKED_WORLD.coastGeometry.isolatedPeaksRepaired).toBeGreaterThanOrEqual(0);
    expect(BAKED_WORLD.coastGeometry.isolatedPeakCount).toBe(0);
    expect(BAKED_WORLD.coastGeometry.maxNeighborStep).toBeLessThan(30);
  });

  it('places the founding point centrally on real buildable land', () => {
    expect(Math.hypot(
      BAKED_START.centralFoundingPoint.x - BAKED_WORLD.islandCenter.x,
      BAKED_START.centralFoundingPoint.y - BAKED_WORLD.islandCenter.y,
    )).toBeLessThan(65);
    let min = Infinity;
    let max = -Infinity;
    for (let dy = -1; dy <= 5; dy++) {
      for (let dx = -1; dx <= 5; dx++) {
        const x = BAKED_START.townHall.x + dx;
        const y = BAKED_START.townHall.y + dy;
        const offset = y * WORLD_TILES + x;
        expect(buildabilityGrid[offset]! & BUILDABLE_BIT).toBe(BUILDABLE_BIT);
        min = Math.min(min, surfaceHeightGrid[offset]!);
        max = Math.max(max, surfaceHeightGrid[offset]!);
      }
    }
    expect((max - min) / 100).toBeLessThan(0.85);
    // § Final World Compaction 8.1 §3.1: kompakter, ausgeschnittener Startkern.
    expect(BAKED_START.score.buildableTiles).toBeGreaterThanOrEqual(650);
    expect(BAKED_START.score.buildableTiles).toBeLessThanOrEqual(950);
    expect(BAKED_START.score.expansionDirectionScore).toBeGreaterThanOrEqual(0.75);
    expect(BAKED_START.score.resourceAccessScore).toBe(1);
    expect(BAKED_START.score.waterRisk).toBe(0);
    expect(BAKED_START.score.cliffRisk).toBe(0);
    expect(BAKED_START.initialSupplyRoute.at(0)).toEqual(BAKED_START.coastalArrivalPoint);
    expect(BAKED_START.initialSupplyRoute.at(-1)).toEqual({ x: BAKED_START.centralFoundingPoint.x, y: BAKED_START.centralFoundingPoint.y + 3 });
  });

  it('shrinks horizontal land area by about 20% and exposes usable shore zones', () => {
    // § Final World Compaction 8.1 §2: eine ZWEITE horizontale Verdichtung mit
    // linearem Faktor 0,87–0,91 (hier 0,8905), Fläche ≈ Faktor². `horizontalScale
    // FromV60` misst diesen Schritt gegen den vorigen Bake (Spannweite 420 → 374).
    expect(BAKED_WORLD.horizontalScaleFromV60).toBeGreaterThan(0.87);
    expect(BAKED_WORLD.horizontalScaleFromV60).toBeLessThan(0.91);
    const areaFactor = BAKED_WORLD.horizontalScaleFromV60 ** 2;
    expect(areaFactor).toBeGreaterThanOrEqual(0.78);
    expect(areaFactor).toBeLessThanOrEqual(0.81);
    // Kumulativ (beide Verdichtungen) bleibt die Baufläche bei ~66 % der
    // V60-Referenz (55.941 bebaubare Kacheln) — die Insel schrumpft spürbar,
    // ohne die Bebaubarkeit zu kollabieren.
    const buildable = [...buildabilityGrid].filter((flags) => (flags & BUILDABLE_BIT) !== 0).length;
    expect(buildable / 55_941).toBeGreaterThanOrEqual(0.62);
    expect(buildable / 55_941).toBeLessThanOrEqual(0.70);
    const waterfront = [...buildabilityGrid].filter((flags) => (flags & WATERFRONT_BIT) !== 0).length;
    expect(waterfront).toBeGreaterThan(400);
    // Die zweite Verdichtung verkürzt den Küstenverlauf; die nutzbaren
    // Strand-/Klippen-/Felsufer (Typ 1–3) bleiben mit > 1.200 Kacheln ausreichend
    // präsent, die Flachufer (Typ 4) unverändert reichlich.
    expect([...shoreTypeGrid].filter((type) => type >= 1 && type <= 3).length).toBeGreaterThan(1200);
    expect([...shoreTypeGrid].filter((type) => type === 4).length).toBeGreaterThan(1000);

    let fiveByFiveWaterfront = false;
    for (let y = 1; y < WORLD_TILES - 6 && !fiveByFiveWaterfront; y++) {
      for (let x = 1; x < WORLD_TILES - 6 && !fiveByFiveWaterfront; x++) {
        let allBuildable = true;
        let hasWaterfrontTile = false;
        for (let dy = 0; dy < 5; dy++) {
          for (let dx = 0; dx < 5; dx++) {
            const flags = buildabilityGrid[(y + dy) * WORLD_TILES + x + dx]!;
            allBuildable &&= (flags & BUILDABLE_BIT) !== 0;
            hasWaterfrontTile ||= (flags & WATERFRONT_BIT) !== 0;
          }
        }
        if (!allBuildable || !hasWaterfrontTile) continue;
        for (let ring = -1; ring <= 5 && !fiveByFiveWaterfront; ring++) {
          fiveByFiveWaterfront ||= waterMaskGrid[(y - 1) * WORLD_TILES + x + ring]! > 0;
          fiveByFiveWaterfront ||= waterMaskGrid[(y + 5) * WORLD_TILES + x + ring]! > 0;
          fiveByFiveWaterfront ||= waterMaskGrid[(y + ring) * WORLD_TILES + x - 1]! > 0;
          fiveByFiveWaterfront ||= waterMaskGrid[(y + ring) * WORLD_TILES + x + 5]! > 0;
        }
      }
    }
    expect(fiveByFiveWaterfront).toBe(true);
  });

  it('bakes non-empty, bounded infrastructure hooks without enabling gameplay', () => {
    expect(bridgeCandidates.length).toBeGreaterThan(0);
    expect(elevatedRoadCandidates.length).toBeGreaterThan(0);
    expect(tunnelCandidates.length).toBeGreaterThan(0);
    expect(harborCandidates.length).toBeGreaterThan(0);
    expect(waterRouteNodes.length).toBeGreaterThan(100);
    expect(waterRouteEdges.length).toBeGreaterThan(waterRouteNodes.length);
    expect(harborCandidates.every((harbor) => harbor.regionId > 0)).toBe(true);
    for (const bridge of bridgeCandidates) {
      expect(bridge.span).toBeGreaterThanOrEqual(2);
      expect(bridge.start.x).toBeGreaterThanOrEqual(0);
      expect(bridge.end.x).toBeLessThan(WORLD_TILES);
    }
  });

  it('keeps every baked navigation edge on water', () => {
    const nodes = new Map(waterRouteNodes.map((node) => [node.id, node]));
    for (const edge of waterRouteEdges) {
      const from = nodes.get(edge.from);
      const to = nodes.get(edge.to);
      expect(from, edge.id).toBeDefined();
      expect(to, edge.id).toBeDefined();
      const samples = Math.max(2, Math.ceil(edge.length * 2));
      for (let sample = 0; sample <= samples; sample++) {
        const t = sample / samples;
        const x = Math.floor(from!.position.x + (to!.position.x - from!.position.x) * t);
        const y = Math.floor(from!.position.z + (to!.position.z - from!.position.z) * t);
        expect(waterMaskGrid[y * WORLD_TILES + x], `${edge.id} überquert Land bei ${x},${y}`).toBeGreaterThan(0);
      }
    }
  });
});
