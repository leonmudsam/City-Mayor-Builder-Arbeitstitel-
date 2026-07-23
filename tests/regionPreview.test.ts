import { describe, expect, it } from 'vitest';
import { regionPreview } from '../src/game/regions/regionPreview.ts';
import { regionsConfig } from '../src/game/config/regions.config.ts';

// § C5: reine Regions-Vorschau (begünstigte Gebäude aus dem Charakter).
describe('regionPreview — begünstigte Gebäude (§ C5)', () => {
  it('gibt undefined für unbekannte Regionen', () => {
    expect(regionPreview(9999)).toBeUndefined();
  });

  it('empfiehlt das Sägewerk in einer Holz-Region', () => {
    // Nordwald (10) ist Wald mit wood ×1.45.
    const preview = regionPreview(10)!;
    const wood = preview.favouredBuildings.find((f) => f.defId === 'sawmill');
    expect(wood).toBeDefined();
    expect(wood!.resource).toBe('wood');
    expect(wood!.modifierPct).toBe(45);
  });

  it('empfiehlt den Bauernhof in einer fruchtbaren Region', () => {
    // Flussgarten (5) ist Flusstal mit food ×1.3.
    const preview = regionPreview(5)!;
    expect(preview.favouredBuildings.some((f) => f.defId === 'farm' && f.resource === 'food')).toBe(true);
  });

  it('bleibt leer für die neutrale Startregion (keine Modifikatoren)', () => {
    // Zentralland (13) ist die bewusst neutrale Startregion ohne Boni.
    const preview = regionPreview(13)!;
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
