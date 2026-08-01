import { describe, expect, it } from 'vitest';
import {
  BAKED_REGIONS,
  REGION_COUNT,
  startRegionConfig,
} from '../src/game/config/startRegion.config.ts';
import {
  blendedVisualSplat,
  blendedVisualTint,
  REGION_VISUAL_PROFILES,
  regionVisualProfile,
} from '../src/renderer/three/worldVisualProfiles.ts';

describe('visuelle Regionsprofile', () => {
  it('deckt jede aktive Bake-Region genau einmal ab', () => {
    const ids = REGION_VISUAL_PROFILES.map((entry) => entry.regionId);
    const bakedIds = BAKED_REGIONS.map((entry) => entry.id);
    expect(ids).toEqual(bakedIds);
    expect(ids).toHaveLength(REGION_COUNT);
    expect(new Set(ids).size).toBe(REGION_COUNT);
  });

  it('liest die Geografie der aktiven Insel statt historischer Profile', () => {
    // § Modelltreue 13.1: Die Profile folgen der gemessenen Biomverteilung des
    // modelltreuen Bakes. 5 ist das Massiv (83,4 % Gebirge), 7 das Holzrevier
    // (42,7 % Wald), 1 das Lagunenland (33,3 % Wasser), 6 die Kornkammer.
    expect(regionVisualProfile(5)).toMatchObject({ biome: 'gebirge', vegetation: 'alpin' });
    expect(regionVisualProfile(7)).toMatchObject({ biome: 'wald', vegetation: 'waldkern' });
    expect(regionVisualProfile(1)).toMatchObject({ biome: 'seenland', vegetation: 'ufer' });
    expect(regionVisualProfile(6)).toMatchObject({ biome: 'fruchttal', vegetation: 'agrar' });
    expect(regionVisualProfile(1)?.splat.coast).toBeGreaterThan(0.5);
    // 4 ist die Dünenküste — 1.945 Sand und 524 Küstenkanten.
    expect(regionVisualProfile(4)).toMatchObject({ biome: 'kueste', vegetation: 'ufer' });
    // Die neue Insel hat keine Wüsten- oder Sumpfregion — nichts wird erfunden.
    expect(REGION_VISUAL_PROFILES.some((entry) => entry.biome === 'wueste')).toBe(false);
    expect(REGION_VISUAL_PROFILES.some((entry) => entry.biome === 'sumpf')).toBe(false);
  });

  it('profiliert Zentralland als warmes, offenes Gründerland', () => {
    const start = regionVisualProfile(startRegionConfig.startRegionId);
    expect(start).toMatchObject({
      regionId: 9,
      biome: 'grasland',
      vegetation: 'offen',
      landmark: 'Rathauslichtung',
    });
    expect(start?.label).toContain('Gründerland');
    expect(start?.tint).toBe(0xefd987);
    expect(start?.splat.desert).toBe(0);
    expect(start?.splat.swamp).toBe(0);
  });

  it('mischt aktuelle Regionsgrenzen ohne Gewichte außerhalb 0..1', () => {
    const mixed = blendedVisualSplat([5, 1, 7, 9]);
    expect(mixed.alpine).toBeGreaterThan(0);
    for (const value of Object.values(mixed)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('mischt Grundtöne weich und gewichtet wiederholte räumliche Samples', () => {
    expect(blendedVisualTint([9])).toBe(0xefd987);
    expect(blendedVisualTint([9, 9, 5])).not.toBe(blendedVisualTint([9, 5, 5]));
  });

  it('liefert für Ozean und unbekannte Ids keinen erfundenen Wert', () => {
    expect(regionVisualProfile(0)).toBeUndefined();
    expect(regionVisualProfile(REGION_COUNT + 1)).toBeUndefined();
    expect(blendedVisualTint([0, REGION_COUNT + 1])).toBeUndefined();
    expect(blendedVisualSplat([0, REGION_COUNT + 1])).toEqual({
      desert: 0,
      swamp: 0,
      dry: 0,
      coast: 0,
      alpine: 0,
    });
  });
});
