import { describe, expect, it } from 'vitest';
import { regionPreview } from '../src/game/regions/regionPreview.ts';
import { regionsConfig } from '../src/game/config/regions.config.ts';

// § C5: reine Regions-Vorschau (begünstigte Gebäude aus dem Charakter).
describe('regionPreview — begünstigte Gebäude (§ C5)', () => {
  it('gibt undefined für unbekannte Regionen', () => {
    expect(regionPreview(9999)).toBeUndefined();
  });

  it('empfiehlt das Sägewerk in einer Holz-Region', () => {
    // Region 17 ist Wald mit wood ×1.5.
    const preview = regionPreview(17)!;
    const wood = preview.favouredBuildings.find((f) => f.defId === 'sawmill');
    expect(wood).toBeDefined();
    expect(wood!.resource).toBe('wood');
    expect(wood!.modifierPct).toBe(50);
  });

  it('empfiehlt den Bauernhof in einer fruchtbaren Region', () => {
    // Region 4 ist fruchtbar mit food ×1.35.
    const preview = regionPreview(4)!;
    expect(preview.favouredBuildings.some((f) => f.defId === 'farm' && f.resource === 'food')).toBe(true);
  });

  it('bleibt leer für die neutrale Startregion (keine Modifikatoren)', () => {
    const preview = regionPreview(2)!;
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
