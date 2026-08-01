import { describe, expect, it } from 'vitest';
import {
  marchingShoreSegments,
  smoothShoreChain,
  traceShoreChains,
} from '../src/renderer/three/shorelineGeometry.ts';

describe('weiche Küstengeometrie', () => {
  it('erzeugt eine geschlossene diagonalfähige Kontur um eine Landinsel', () => {
    const water = [
      [true, true, true, true],
      [true, false, false, true],
      [true, false, false, true],
      [true, true, true, true],
    ];
    const segments = marchingShoreSegments(4, 4, (x, y) => water[y]![x]!);
    const chains = traceShoreChains(segments);

    expect(segments.length).toBeGreaterThan(4);
    expect(chains).toHaveLength(1);
    expect(chains[0]!.closed).toBe(true);
    expect(chains[0]!.points[0]).toEqual(chains[0]!.points.at(-1));
  });

  it('glättet harte Konturknicke, ohne den Ring zu öffnen', () => {
    const chain = {
      closed: true,
      points: [
        { x: 0, z: 0 },
        { x: 2, z: 0 },
        { x: 2, z: 2 },
        { x: 0, z: 2 },
        { x: 0, z: 0 },
      ],
    };
    const smoothed = smoothShoreChain(chain, 2);

    expect(smoothed.closed).toBe(true);
    expect(smoothed.points.length).toBeGreaterThan(chain.points.length);
    expect(smoothed.points[0]).toEqual(smoothed.points.at(-1));
    expect(smoothed.points.some((point) => point.x > 0 && point.x < 2)).toBe(true);
  });

  it('lässt homogene Wasser- oder Landflächen ohne künstliche Kante', () => {
    expect(marchingShoreSegments(5, 5, () => true)).toEqual([]);
    expect(marchingShoreSegments(5, 5, () => false)).toEqual([]);
  });
});
