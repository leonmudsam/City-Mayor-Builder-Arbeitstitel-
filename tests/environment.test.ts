import { describe, it, expect } from 'vitest';
import { dawnReadability, grade, sunDirection, sunElevation, moonDirection, wrap01 } from '../src/renderer/three/environment.ts';
import {
  getEnvironmentSettings,
  resetEnvironmentSettings,
  setEnvironmentSettings,
  subscribeEnvironmentSettings,
} from '../src/renderer/three/environmentSettings.ts';

// The atmosphere grading is pure maths (three.js Color only, no WebGL), so it is
// safe to exercise in node. These guard the day/night curve: physically sensible
// sun motion, a lit noon vs. a dark-but-not-black midnight, stars that only come
// out at night, and a curve that wraps cleanly across midnight.

describe('sun geometry', () => {
  it('is highest at noon and below the horizon at midnight', () => {
    expect(sunElevation(0.5)).toBeCloseTo(1, 5); // noon = zenith
    expect(sunElevation(0.0)).toBeCloseTo(-1, 5); // midnight = deep below
    expect(sunElevation(0.25)).toBeCloseTo(0, 5); // sunrise = horizon
    expect(sunElevation(0.75)).toBeCloseTo(0, 5); // sunset = horizon
  });

  it('rises in the east (+x) and sets in the west (-x)', () => {
    expect(sunDirection(0.25).x).toBeGreaterThan(0.5); // sunrise east
    expect(sunDirection(0.75).x).toBeLessThan(-0.5); // sunset west
    expect(sunDirection(0.5).y).toBeGreaterThan(0.8); // noon overhead
  });

  it('returns unit-length directions', () => {
    for (const t of [0, 0.13, 0.25, 0.5, 0.66, 0.75, 0.9]) {
      const d = sunDirection(t);
      expect(Math.hypot(d.x, d.y, d.z)).toBeCloseTo(1, 6);
    }
  });

  it('places the moon opposite the sun (overhead at midnight)', () => {
    expect(moonDirection(0.0).y).toBeGreaterThan(0.8);
    expect(moonDirection(0.5).y).toBeLessThan(-0.8);
  });
});

describe('wrap01', () => {
  it('wraps any real number into [0,1)', () => {
    expect(wrap01(1.25)).toBeCloseTo(0.25, 6);
    expect(wrap01(-0.25)).toBeCloseTo(0.75, 6);
    expect(wrap01(2)).toBeCloseTo(0, 6);
  });
});

describe('atmosphere grade', () => {
  it('macht die Welt um 05:42 lesbar, ohne Mitternacht aufzuhellen', () => {
    const dawn = 5.7 / 24;
    expect(dawnReadability(dawn)).toBeGreaterThan(0.9);
    expect(dawnReadability(0)).toBe(0);
    expect(dawnReadability(0.5)).toBe(0);
    expect(grade(dawn).hemiIntensity).toBeGreaterThan(0.7);
    expect(grade(dawn).ambient).toBeGreaterThan(0.2);
  });

  it('produces finite colours and intensities everywhere', () => {
    for (let i = 0; i < 50; i++) {
      const g = grade(i / 50);
      for (const c of [g.skyTop, g.skyHorizon, g.fog, g.water, g.sunColor, g.hemiSky, g.hemiGround]) {
        expect(Number.isFinite(c.r + c.g + c.b)).toBe(true);
      }
      for (const n of [g.sunIntensity, g.ambient, g.hemiIntensity, g.stars, g.moon]) {
        expect(Number.isFinite(n)).toBe(true);
        expect(n).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('is much brighter at noon than at midnight, but midnight is never black', () => {
    const noon = grade(0.5);
    const midnight = grade(0.0);
    expect(noon.sunIntensity).toBeGreaterThan(midnight.sunIntensity + 0.8);
    expect(noon.hemiIntensity).toBeGreaterThan(midnight.hemiIntensity);
    expect(midnight.ambient).toBeGreaterThan(0.05); // city stays readable at night
  });

  it('only shows stars/moon at night', () => {
    expect(grade(0.5).stars).toBeCloseTo(0, 5);
    expect(grade(0.5).moon).toBeCloseTo(0, 5);
    expect(grade(0.0).stars).toBeGreaterThan(0.8);
    expect(grade(0.0).moon).toBeGreaterThan(0.8);
  });

  it('wraps continuously across midnight (grade(1) ≈ grade(0))', () => {
    const a = grade(0.0);
    const b = grade(0.9999);
    expect(Math.abs(a.sunIntensity - b.sunIntensity)).toBeLessThan(0.05);
    expect(Math.abs(a.stars - b.stars)).toBeLessThan(0.05);
  });
});

describe('visual weather settings', () => {
  it('switches clear, rain and fog without touching save state', () => {
    resetEnvironmentSettings();
    for (const weather of ['clear', 'rain', 'fog'] as const) {
      setEnvironmentSettings({ weather });
      expect(getEnvironmentSettings().weather).toBe(weather);
    }
    resetEnvironmentSettings();
  });

  it('sanitizes unknown presets and notifies renderer subscribers', () => {
    resetEnvironmentSettings();
    let calls = 0;
    const unsubscribe = subscribeEnvironmentSettings(() => {
      calls += 1;
    });
    setEnvironmentSettings({ weather: 'storm' as 'clear' });
    expect(getEnvironmentSettings().weather).toBe('clear');
    expect(calls).toBe(1);
    unsubscribe();
    resetEnvironmentSettings();
  });
});
