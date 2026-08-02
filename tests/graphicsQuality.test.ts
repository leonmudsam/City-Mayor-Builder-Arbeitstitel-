import { describe, expect, it } from 'vitest';
import {
  GRAPHICS_PROFILES,
  GRAPHICS_QUALITY_LEVELS,
  graphicsProfile,
  scaledBudget,
  stepQuality,
  vegetationLodTier,
  type GraphicsProfile,
} from '../src/renderer/three/graphicsQuality.ts';
import { REGION_PROP_BUDGET } from '../src/renderer/three/vegetationBudget.ts';

// § Säule B: Die Qualitätsstufen dürfen keine gefühlten Werte sein. Die Profile
// müssen monoton, in sich stimmig und mit den Auftrags-Zielwerten vereinbar sein
// — dieser Test hält das gegen Regressionen fest.

describe('Grafik-Qualitätsprofile (§ Säule B)', () => {
  it('kennt genau vier Stufen in aufsteigender Ordnung', () => {
    expect(GRAPHICS_QUALITY_LEVELS).toEqual(['low', 'medium', 'high', 'ultra']);
    for (const level of GRAPHICS_QUALITY_LEVELS) {
      expect(graphicsProfile(level).level).toBe(level);
    }
  });

  it('steigert jede Budget-relevante Kennzahl monoton von Niedrig bis Ultra', () => {
    const p = GRAPHICS_QUALITY_LEVELS.map((l) => graphicsProfile(l));
    const monotonic = (pick: (x: GraphicsProfile) => number) => {
      for (let i = 1; i < p.length; i++) {
        expect(pick(p[i]!), `${p[i]!.level} ≥ ${p[i - 1]!.level}`).toBeGreaterThanOrEqual(pick(p[i - 1]!));
      }
    };
    monotonic((x) => x.densityMultiplier);
    monotonic((x) => x.vegetationViewDistance);
    monotonic((x) => x.nearDetailDistance);
    monotonic((x) => x.shadowInstanceBudget);
    monotonic((x) => x.smallPropCullDistance);
    monotonic((x) => x.animalBudget);
    monotonic((x) => x.pixelRatioCap);
    monotonic((x) => x.lodDistances[0]);
    monotonic((x) => x.lodDistances[2]);
  });

  it('hält selbst „Niedrig" sichtbar dicht bewachsen (§ Dichte bleibt hoch)', () => {
    // Der Auftrag verbietet ein Ausdünnen der Kernvegetation. Die niedrigste
    // Stufe darf die Dichte höchstens halbieren, nie kollabieren lassen.
    expect(graphicsProfile('low').densityMultiplier).toBeGreaterThanOrEqual(0.5);
    // Ein positives Basisbudget behält auch skaliert mindestens eine Instanz.
    for (const level of GRAPHICS_QUALITY_LEVELS) {
      const profile = graphicsProfile(level);
      for (const base of Object.values(REGION_PROP_BUDGET)) {
        expect(scaledBudget(base, profile)).toBeGreaterThanOrEqual(1);
      }
    }
    expect(scaledBudget(0, graphicsProfile('ultra'))).toBe(0);
  });

  it('ordnet LOD-Stufen streng nach Distanz (nah = detailliert, fern = gecullt)', () => {
    const high = graphicsProfile('high');
    const [near, mid, far] = high.lodDistances;
    expect(vegetationLodTier(near - 1, high)).toBe(0);
    expect(vegetationLodTier(near + 1, high)).toBe(1);
    expect(vegetationLodTier(mid + 1, high)).toBe(2); // Impostor
    expect(vegetationLodTier(far + 1, high)).toBe(3); // gecullt
    // Nie in eine Distanz überspringen: monoton nicht fallend über die Distanz.
    let prev = -1;
    for (let d = 0; d <= far + 20; d += 5) {
      const tier = vegetationLodTier(d, high);
      expect(tier).toBeGreaterThanOrEqual(prev);
      prev = tier;
    }
  });

  it('nutzt auch auf Ultra Fernwald-HLOD für die vollständige Inselansicht', () => {
    const ultra = graphicsProfile('ultra');
    expect(ultra.impostorsEnabled).toBe(true);
    const [, mid] = ultra.lodDistances;
    expect(vegetationLodTier(mid + 5, ultra)).toBe(2);
    expect(ultra.vegetationViewDistance).toBeGreaterThanOrEqual(600);
  });

  it('schaltet Vegetationsschatten erst ab Mittel ein und deckelt sie', () => {
    expect(graphicsProfile('low').vegetationShadows).toBe(false);
    expect(graphicsProfile('low').shadowInstanceBudget).toBe(0);
    expect(graphicsProfile('medium').vegetationShadows).toBe(true);
    expect(graphicsProfile('ultra').shadowInstanceBudget).toBeGreaterThan(
      graphicsProfile('high').shadowInstanceBudget,
    );
  });

  it('stepQuality bewegt sich in den Grenzen', () => {
    expect(stepQuality('low', -1)).toBe('low');
    expect(stepQuality('low', 1)).toBe('medium');
    expect(stepQuality('ultra', 1)).toBe('ultra');
    expect(stepQuality('high', -1)).toBe('medium');
  });

  it('deckt sich mit den Profil-Konstanten (kein Drift im Record)', () => {
    for (const level of GRAPHICS_QUALITY_LEVELS) {
      expect(GRAPHICS_PROFILES[level]).toBe(graphicsProfile(level));
    }
  });
});
