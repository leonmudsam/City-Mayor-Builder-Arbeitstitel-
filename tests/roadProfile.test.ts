import { describe, expect, it } from 'vitest';
import {
  buildRoadHeightProfileFromSamples,
  minimumRoadSegmentsForGrade,
  type RoadProfileSample,
} from '../src/game/roads/roadProfile.ts';
import { serpentineControlPoints } from '../src/game/roads/roadRouting.ts';

const sample = (
  x: number,
  y: number,
  terrainHeight: number,
  overrides: Partial<RoadProfileSample> = {},
): RoadProfileSample => ({
  x,
  y,
  terrain: 'grass',
  terrainHeight,
  terrainSlope: 0,
  coast: false,
  cliff: false,
  ...overrides,
});

describe('kanonisches Straßen-Höhenprofil', () => {
  it('hält eine ausreichend lange Rampe bei maximal 8 Prozent', () => {
    const samples = Array.from({ length: 14 }, (_, index) => sample(index, 0, index / 13));
    const profile = buildRoadHeightProfileFromSamples(samples);
    expect(profile.feasible).toBe(true);
    expect(profile.maxGradePercent).toBeLessThanOrEqual(8);
    expect(profile.lengthMeters).toBe(52);
    expect(profile.elevationDeltaMeters).toBeCloseTo(4);
  });

  it('weist eine physisch zu kurze Verbindung ehrlich als unbaubar aus', () => {
    const samples = Array.from({ length: 6 }, (_, index) => sample(index, 0, index / 5));
    const profile = buildRoadHeightProfileFromSamples(samples);
    expect(minimumRoadSegmentsForGrade(0, 1)).toBe(13);
    expect(profile.feasible).toBe(false);
    expect(profile.maxGradePercent).toBeGreaterThan(8);
  });

  it('hält gespeicherte Deckhöhen an bestehenden Kreuzungen exakt fest', () => {
    const samples = Array.from({ length: 27 }, (_, index) =>
      sample(index, 0, index / 13, index === 13 ? { fixedRoadHeight: 1 } : {}),
    );
    const profile = buildRoadHeightProfileFromSamples(samples);
    expect(profile.feasible).toBe(true);
    expect(profile.points[13]!.roadHeight).toBe(1);
    expect(profile.maxGradePercent).toBeLessThanOrEqual(8);
  });

  it('spannt Wasser zwischen Landankern und klassifiziert es als Brücke', () => {
    const profile = buildRoadHeightProfileFromSamples([
      sample(0, 0, 1),
      sample(1, 0, -2, { terrain: 'water' }),
      sample(2, 0, -2, { terrain: 'river' }),
      sample(3, 0, 1.1),
    ]);
    expect(profile.feasible).toBe(true);
    expect(profile.points.slice(1, 3).every((point) => point.variant === 'bridge')).toBe(true);
    expect(profile.points[1]!.roadHeight).toBeGreaterThan(0.9);
  });

  it('macht aus Gebirge eine Passstraße statt pauschal ein Viadukt', () => {
    const profile = buildRoadHeightProfileFromSamples([
      sample(0, 0, 0, { terrain: 'mountain', terrainSlope: 0.9 }),
      sample(1, 0, 0.04, { terrain: 'mountain', terrainSlope: 0.9 }),
      sample(1, 1, 0.08, { terrain: 'mountain', terrainSlope: 0.9 }),
      sample(0, 1, 0.12, { terrain: 'mountain', terrainSlope: 0.9 }),
      sample(0, 2, 0.16, { terrain: 'mountain', terrainSlope: 0.9 }),
    ]);
    expect(profile.turnCount).toBeGreaterThanOrEqual(2);
    expect(profile.points.some((point) => point.variant === 'pass')).toBe(true);
    expect(profile.points.every((point) => point.variant !== 'viaduct')).toBe(true);
  });

  it('erzeugt deterministische, abwechselnde Kehren-Kontrollpunkte', () => {
    const points = serpentineControlPoints({ x: 30, y: 30 }, { x: 30, y: 42 }, 70, 8);
    expect(points[0]).toEqual({ x: 30, y: 30 });
    expect(points.at(-1)).toEqual({ x: 30, y: 42 });
    const offsets = points.slice(1, -1).map((point) => Math.sign(point.x - 30));
    expect(offsets.length).toBeGreaterThanOrEqual(2);
    for (let index = 1; index < offsets.length; index++) expect(offsets[index]).toBe(-offsets[index - 1]!);
  });
});
