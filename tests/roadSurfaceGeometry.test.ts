import { describe, expect, it } from 'vitest';
import {
  appendRoadDiscTriangles,
  appendRoadRibbonTriangles,
  appendVariableRibbonTriangles,
  roadTileEdgeConnector,
  roundedRoadPolyline,
} from '../src/renderer/three/roadSurfaceGeometry.ts';

function triangleNormalY(positions: readonly number[], offset: number): number {
  const ax = positions[offset]!;
  const az = positions[offset + 2]!;
  const bx = positions[offset + 3]!;
  const bz = positions[offset + 5]!;
  const cx = positions[offset + 6]!;
  const cz = positions[offset + 8]!;
  const ux = bx - ax;
  const uz = bz - az;
  const vx = cx - ax;
  const vz = cz - az;
  return uz * vx - ux * vz;
}

function expectEveryTriangleFacesUp(positions: readonly number[]): void {
  expect(positions.length % 9).toBe(0);
  for (let offset = 0; offset < positions.length; offset += 9) {
    expect(triangleNormalY(positions, offset)).toBeGreaterThan(0);
  }
}

describe('ruhige Straßenlinien', () => {
  it('hält Geraden ruhig und rundet nur den eigentlichen Rasterknick', () => {
    const straight = roundedRoadPolyline([
      { x: 0, z: 0 },
      { x: 1, z: 0 },
      { x: 2, z: 0 },
    ]);
    expect(straight).toEqual([
      { x: 0, z: 0 },
      { x: 1, z: 0 },
      { x: 2, z: 0 },
    ]);

    const corner = roundedRoadPolyline([
      { x: 0, z: 0 },
      { x: 1, z: 0 },
      { x: 1, z: 1 },
    ], 0.28, 4);
    expect(corner.length).toBeGreaterThan(3);
    expect(corner.every((point) => point.x >= 0 && point.x <= 1 && point.z >= 0 && point.z <= 1)).toBe(true);
    expect(corner.some((point) => point.x < 1 && point.z > 0)).toBe(true);
  });
});

describe('Straßenoberflächen-Geometrie', () => {
  it('schließt einen Bodenweg bis über die Kante zur Brücken- oder Höhenkachel', () => {
    const [start, end] = roadTileEdgeConnector({ x: 8.5, z: 4.5 }, 1, 0);
    expect(start).toEqual({ x: 8.5, z: 4.5 });
    expect(end.x).toBeGreaterThan(9);
    expect(end.z).toBe(4.5);
  });

  it('wickelt gerade und gebogene Fahrbahnbänder mit Normalen nach oben', () => {
    const positions: number[] = [];
    appendRoadRibbonTriangles(
      positions,
      [{ x: 0, z: 0 }, { x: 1, z: 0 }, { x: 2, z: 0.6 }],
      0.32,
      0.06,
      (x, z) => x * 0.04 + z * 0.02,
    );
    expectEveryTriangleFacesUp(positions);
  });

  it('unterstützt lokal wechselnde Breiten für Strand- und Klippenabschnitte', () => {
    const positions: number[] = [];
    appendVariableRibbonTriangles(
      positions,
      [{ x: 0, z: 0 }, { x: 1, z: 0 }, { x: 2, z: 0 }],
      [0.55, 0.24, 0.08],
      0.03,
      () => 0,
    );
    expectEveryTriangleFacesUp(positions);
    const zValues = positions.filter((_, index) => index % 3 === 2);
    expect(Math.max(...zValues)).toBeCloseTo(0.55, 5);
    expect(Math.min(...zValues)).toBeCloseTo(-0.55, 5);
  });

  it('wickelt Knotenflächen mit Normalen nach oben', () => {
    const positions: number[] = [];
    appendRoadDiscTriangles(positions, { x: 5, z: 8 }, 0.38, 0.06, () => 0, 18);
    expectEveryTriangleFacesUp(positions);
  });
});
