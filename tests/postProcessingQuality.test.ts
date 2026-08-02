import { describe, expect, it } from 'vitest';
import { GRAPHICS_QUALITY_LEVELS } from '../src/renderer/three/graphicsQuality.ts';
import {
  POST_PROCESSING_PROFILES,
  postProcessingPassPlan,
  postProcessingProfile,
} from '../src/renderer/three/postProcessingQuality.ts';

describe('World-Postprocessing', () => {
  it('besitzt genau ein Profil je bestehender Grafikstufe', () => {
    expect(Object.keys(POST_PROCESSING_PROFILES)).toEqual([...GRAPHICS_QUALITY_LEVELS]);
    for (const level of GRAPHICS_QUALITY_LEVELS) {
      expect(postProcessingProfile(level)).toBe(POST_PROCESSING_PROFILES[level]);
    }
  });

  it('staffelt Effekte und Kosten nachvollziehbar', () => {
    expect(postProcessingProfile('low').enabled).toBe(false);
    expect(postProcessingProfile('medium').ssao).toBe(true);
    expect(postProcessingProfile('medium').aoKernelSize).toBe(8);
    expect(postProcessingProfile('high').bloom).toBe(true);
    expect(postProcessingProfile('ultra').depthOfField).toBe(true);
    expect(postProcessingProfile('high').bloomStrength).toBeLessThan(0.2);
    expect(postProcessingProfile('ultra').maxBlur).toBeLessThanOrEqual(0.002);
  });

  it('laesst Low ohne Composer direkt rendern', () => {
    expect(postProcessingPassPlan('low')).toEqual({
      mode: 'direct',
      passes: ['render'],
    });
  });

  it('ordnet Medium als guenstige AO-SMAA-Kette mit genau einem Output', () => {
    expect(postProcessingPassPlan('medium')).toEqual({
      mode: 'composer',
      passes: ['render', 'ssao', 'smaa', 'output'],
    });
  });

  it('laesst auf High ausschliesslich HDR-Highlights aufbluehen', () => {
    const profile = postProcessingProfile('high');
    expect(profile.bloomThreshold).toBeGreaterThan(1);
    expect(postProcessingPassPlan('high')).toEqual({
      mode: 'composer',
      passes: ['render', 'ssao', 'bloom', 'smaa', 'output'],
    });
  });

  it('schaltet Ultra-DOF im Plan dynamisch zwischen Bloom und SMAA', () => {
    expect(postProcessingPassPlan('ultra', true).passes).toEqual([
      'render',
      'ssao',
      'bloom',
      'depthOfField',
      'smaa',
      'output',
    ]);
    expect(postProcessingPassPlan('ultra', false).passes).toEqual([
      'render',
      'ssao',
      'bloom',
      'smaa',
      'output',
    ]);
  });

  it('wendet ACES/Output in jeder Composer-Kette genau einmal und zuletzt an', () => {
    for (const level of GRAPHICS_QUALITY_LEVELS) {
      const plan = postProcessingPassPlan(level);
      const outputCount = plan.passes.filter((pass) => pass === 'output').length;
      expect(outputCount).toBe(plan.mode === 'composer' ? 1 : 0);
      if (plan.mode === 'composer') expect(plan.passes.at(-1)).toBe('output');
    }
  });
});
