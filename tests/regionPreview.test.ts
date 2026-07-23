import { describe, expect, it } from 'vitest';
import { regionPreview } from '../src/game/regions/regionPreview.ts';
import { regionsConfig } from '../src/game/config/regions.config.ts';

// § C5: reine Regions-Vorschau (begünstigte Gebäude aus dem Charakter).
describe('regionPreview — begünstigte Gebäude (§ C5)', () => {
  it('gibt undefined für unbekannte Regionen', () => {
    expect(regionPreview(9999)).toBeUndefined();
  });

  it('empfiehlt das Sägewerk in einer Holz-Region', () => {
    // § 10.0 R8: Zentralwald (11) ist Wald mit wood ×1.45.
    const preview = regionPreview(11)!;
    const wood = preview.favouredBuildings.find((f) => f.defId === 'sawmill');
    expect(wood).toBeDefined();
    expect(wood!.resource).toBe('wood');
    expect(wood!.modifierPct).toBe(45);
  });

  it('empfiehlt den Bauernhof in einer fruchtbaren Region', () => {
    // § 10.0 R8: Ostfelder (4) ist Ebene mit food ×1.3.
    const preview = regionPreview(4)!;
    expect(preview.favouredBuildings.some((f) => f.defId === 'farm' && f.resource === 'food')).toBe(true);
  });

  it('bleibt leer für die neutrale Startregion (keine Modifikatoren)', () => {
    // § 10.0 R8: Zentralland (9) ist die bewusst neutrale Startregion ohne Boni.
    const preview = regionPreview(9)!;
    expect(preview.favouredBuildings).toEqual([]);
  });

  it('führt kein Gebäude doppelt und ist deterministisch', () => {
    for (const r of regionsConfig) {
      const p = regionPreview(r.id)!;
      const ids = p.favouredBuildings.map((f) => f.defId);
      expect(new Set(ids).size).toBe(ids.length);
      expect(regionPreview(r.id)).toEqual(p);
    }
  });
});
