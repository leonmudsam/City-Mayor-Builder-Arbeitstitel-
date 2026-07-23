import { describe, expect, it } from 'vitest';
import { REGION_PROP_BUDGET, propHash, selectPropTiles } from '../src/renderer/three/vegetationBudget.ts';

// § Overhaul 8.0 / §16 — Vegetation und Props dürfen beim Freischalten einer
// Region NICHT verschwinden oder springen. Vorher deckelte der Renderer die
// weltweite Kachelliste über den Arrayindex (`i % ceil(len / cap)`): wuchs die
// Liste, änderte sich die Schrittweite und damit die überlebenden Kacheln in
// bereits sichtbaren Regionen. Diese Suite hält die Determinismus-Zusage fest.

const tiles = (count: number, offset = 0): { x: number; y: number }[] =>
  Array.from({ length: count }, (_, index) => ({ x: (index + offset) % 64, y: Math.floor((index + offset) / 64) }));

describe('selectPropTiles — deterministische Auswahl (§16)', () => {
  it('gibt alle Kacheln zurück, solange das Budget reicht', () => {
    const input = tiles(20);
    expect(selectPropTiles('pine:7', input, 50)).toEqual(input);
  });

  it('respektiert das Budget', () => {
    expect(selectPropTiles('pine:7', tiles(500), 120)).toHaveLength(120);
  });

  it('liefert bei gleicher Eingabe immer dasselbe Ergebnis', () => {
    const input = tiles(500);
    expect(selectPropTiles('pine:7', input, 120)).toEqual(selectPropTiles('pine:7', input, 120));
  });

  it('ist unabhängig von der Reihenfolge der Eingabe', () => {
    const input = tiles(500);
    const shuffled = [...input].reverse();
    expect(selectPropTiles('pine:7', shuffled, 120)).toEqual(selectPropTiles('pine:7', input, 120));
  });

  it('wählt je Proptyp und Region unterschiedliche Kacheln', () => {
    const input = tiles(500);
    const pine = selectPropTiles('pine:7', input, 60);
    expect(selectPropTiles('bush:7', input, 60)).not.toEqual(pine);
    expect(selectPropTiles('pine:8', input, 60)).not.toEqual(pine);
  });

  // Der eigentliche Regressionstest: Das Freischalten einer weiteren Region
  // ändert die Auswahl der bereits sichtbaren Region kein bisschen, weil jede
  // Region ihr eigenes Budget über ihre eigenen Kacheln vergibt.
  it('ein Region-Unlock verändert die Vegetation bestehender Regionen nicht', () => {
    const regionA = tiles(400);
    const regionB = tiles(400, 5_000);
    const before = selectPropTiles('pine:24', regionA, REGION_PROP_BUDGET.pine);
    // Zweite Region wird freigeschaltet und ebenfalls bestückt …
    selectPropTiles('pine:25', regionB, REGION_PROP_BUDGET.pine);
    // … Region A bleibt exakt gleich.
    expect(selectPropTiles('pine:24', regionA, REGION_PROP_BUDGET.pine)).toEqual(before);
  });

  it('hash ist stabil und liegt in [0,1)', () => {
    expect(propHash('pine:24:10,10')).toBe(propHash('pine:24:10,10'));
    for (const seed of ['a', 'pine:1:0,0', 'rock:40:511,511']) {
      const value = propHash(seed);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('REGION_PROP_BUDGET', () => {
  it('vergibt für jeden Proptyp ein positives, endliches Budget', () => {
    for (const [kind, budget] of Object.entries(REGION_PROP_BUDGET)) {
      expect(budget, kind).toBeGreaterThan(0);
      expect(Number.isFinite(budget), kind).toBe(true);
    }
  });
});
