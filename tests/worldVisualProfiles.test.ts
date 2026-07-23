import { describe, expect, it } from 'vitest';
import {
  blendedVisualSplat,
  REGION_VISUAL_PROFILES,
  regionVisualProfile,
} from '../src/renderer/three/worldVisualProfiles.ts';

describe('visuelle Regionsprofile', () => {
  it('deckt jede der 40 gebackenen Regionen genau einmal ab', () => {
    const ids = REGION_VISUAL_PROFILES.map((entry) => entry.regionId);
    expect(ids).toEqual(Array.from({ length: 40 }, (_, index) => index + 1));
    expect(new Set(ids).size).toBe(40);
  });

  it('weist Wüste und Sumpf klar vorhandenen Regionen zu', () => {
    expect(regionVisualProfile(16)?.biome).toBe('wueste');
    expect(regionVisualProfile(16)?.splat.desert).toBe(1);
    expect(regionVisualProfile(40)?.biome).toBe('sumpf');
    expect(regionVisualProfile(40)?.splat.swamp).toBe(1);
  });

  it('mischt technische Regionsgrenzen ohne Gewichte ausserhalb 0..1', () => {
    const mixed = blendedVisualSplat([15, 16, 16, 17]);
    expect(mixed.desert).toBeCloseTo(0.5, 6);
    for (const value of Object.values(mixed)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('liefert fuer Ozean und unbekannte Ids keinen erfundenen Wert', () => {
    expect(regionVisualProfile(0)).toBeUndefined();
    expect(blendedVisualSplat([0, 99])).toEqual({ desert: 0, swamp: 0, dry: 0, coast: 0, alpine: 0 });
  });
});
