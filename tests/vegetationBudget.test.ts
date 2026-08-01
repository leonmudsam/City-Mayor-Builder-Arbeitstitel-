import { describe, expect, it } from 'vitest';
import {
  REGION_DETAIL_PROP_BUDGET,
  REGION_PROP_BUDGET,
  propClusterWeight,
  regionPropBudget,
  propHash,
  selectPropTiles,
  spatialPropChunks,
  starterNatureFrame,
} from '../src/renderer/three/vegetationBudget.ts';

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

describe('propClusterWeight — bewusst gruppierte Natur', () => {
  it('ist stabil, begrenzt und ändert sich zwischen Regionen', () => {
    const value = propClusterWeight(42, 71, 24);
    expect(value).toBe(propClusterWeight(42, 71, 24));
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(1);
    expect(propClusterWeight(42, 71, 25)).not.toBe(value);
  });

  it('variiert zwischen Nachbarkacheln ruhiger als über große Distanz', () => {
    let near = 0;
    let far = 0;
    let samples = 0;
    for (let y = 8; y < 48; y += 4) {
      for (let x = 8; x < 48; x += 4) {
        const base = propClusterWeight(x, y, 24);
        near += Math.abs(base - propClusterWeight(x + 1, y, 24));
        far += Math.abs(base - propClusterWeight(x + 15, y + 11, 24));
        samples++;
      }
    }
    expect(near / samples).toBeLessThan(far / samples);
  });
});

describe('starterNatureFrame — klare Mitte, gerahmter Rand', () => {
  it('hält den Rathausring frei und erreicht außen weich die volle Dichte', () => {
    // § 12.2: Der Rahmen wurde deutlich enger gezogen — vorher lag die ganze
    // Startregion (rund 40 Kacheln breit) INNERHALB der Lichtung und trug
    // messbar 2 Kiefern. Jetzt bleibt nur der unmittelbare Bauplatz frei.
    expect(starterNatureFrame(3)).toBe(0);
    expect(starterNatureFrame(5)).toBe(0);
    expect(starterNatureFrame(10.5)).toBeGreaterThan(0.45);
    expect(starterNatureFrame(10.5)).toBeLessThan(0.55);
    expect(starterNatureFrame(16)).toBe(1);
    expect(starterNatureFrame(60)).toBe(1);
  });
});

describe('REGION_PROP_BUDGET', () => {
  it('vergibt für jeden Proptyp ein positives, endliches Budget', () => {
    for (const [kind, budget] of Object.entries(REGION_PROP_BUDGET)) {
      expect(budget, kind).toBeGreaterThan(0);
      expect(Number.isFinite(budget), kind).toBe(true);
    }
  });

  it('deckt hochpolygone Detailmodelle deutlich unter dem sichtbaren Prop-Budget', () => {
    // § 12.2: `giantTree` und `boulder` nehmen am Detail-Auswahlpfad NICHT teil
    // (Detailbudget 0) — sie werden direkt als Modell gesetzt. Für sie ist
    // `REGION_PROP_BUDGET` selbst der Deckel; die Zusicherung darunter hält ihn
    // klein, weil die vorhandenen Naturmodelle ~29k Dreiecke je Instanz haben.
    //
    // § 14.0: Ein Detailbudget von 0 heißt seitdem NICHT mehr automatisch
    // „direktes Modell". Jungwuchs, Geröll, Küstensteine, Stümpfe und
    // Felsgruppen sind reine Massenformen aus `naturePropGeometry.ts` und haben
    // deshalb ebenfalls 0 — für sie gilt der Deckel unten bewusst nicht.
    const modelOnly = new Set(['giantTree', 'boulder']);
    for (const kind of Object.keys(REGION_PROP_BUDGET) as (keyof typeof REGION_PROP_BUDGET)[]) {
      expect(REGION_DETAIL_PROP_BUDGET[kind], kind).toBeGreaterThanOrEqual(0);
      if (modelOnly.has(kind)) {
        expect(REGION_DETAIL_PROP_BUDGET[kind], kind).toBe(0);
        // Auch in der größten Region (Faktor 3,5) bleibt die Zahl echter
        // Modellinstanzen je Art zweistellig.
        expect(regionPropBudget(kind, 999_999), kind).toBeLessThanOrEqual(80);
        continue;
      }
      expect(REGION_DETAIL_PROP_BUDGET[kind], kind).toBeLessThan(REGION_PROP_BUDGET[kind]);
    }
  });
});

describe('spatialPropChunks', () => {
  it('bildet stabile, räumlich begrenzte Culling-Gruppen', () => {
    const input = [{ x: 2, y: 3 }, { x: 47, y: 47 }, { x: 48, y: 2 }, { x: 99, y: 97 }];
    const chunks = spatialPropChunks(input, 48);
    expect(chunks).toHaveLength(3);
    expect(chunks.flat()).toHaveLength(input.length);
    for (const chunk of chunks) {
      expect(Math.max(...chunk.map((tile) => tile.x)) - Math.min(...chunk.map((tile) => tile.x))).toBeLessThan(48);
      expect(Math.max(...chunk.map((tile) => tile.y)) - Math.min(...chunk.map((tile) => tile.y))).toBeLessThan(48);
    }
  });
});

describe('§ 12.1 §8 — Vegetationsbudget folgt der Fläche, nicht der Regionsanzahl', () => {
  it('gibt großen Regionen mehr Props als kleinen', () => {
    // Vorher war das Budget FLACH je Region: eine 12.644-Kachel-Landschaft bekam
    // genauso viele Bäume wie eine mit 2.122 — große Gebiete wirkten kahl.
    const big = regionPropBudget('pine', 12_644);
    const small = regionPropBudget('pine', 2_122);
    expect(big).toBeGreaterThan(small * 2);
  });

  it('deckelt nach oben und unten, damit Performance und Bewuchs beide halten', () => {
    // Untere Schranke: auch eine Kleinregion bleibt bewachsen (§8).
    expect(regionPropBudget('pine', 1)).toBeGreaterThan(0);
    expect(regionPropBudget('pine', 1)).toBe(Math.round(REGION_PROP_BUDGET.pine * 0.85));
    // Obere Schranke: eine Riesenregion frisst das Frame-Budget nicht auf (§13).
    // § 12.2: Deckel von 3 auf 3,5 gelockert — der Spieltest meldete „viel zu
    // wenig Props und Bäume", und gemessen war bei acht von neun Regionen das
    // BUDGET der Engpass, nicht die Landschaft.
    expect(regionPropBudget('pine', 999_999)).toBe(REGION_PROP_BUDGET.pine * 3.5);
  });

  it('koppelt die Weltmenge an die Landfläche statt an die Zahl der Regionen', () => {
    // Genau das war der Fehler: Die Konsolidierung von 13 auf 8 Regionen (§1)
    // hätte die Welt um rund ein Drittel entlaubt, ohne dass ein Baum entfernt
    // worden wäre. Gleiche Landfläche muss vergleichbar viel Bewuchs ergeben.
    const land = 61_322;
    const asThirteen = Array.from({ length: 13 }, () => land / 13)
      .reduce((sum, tiles) => sum + regionPropBudget('pine', tiles), 0);
    const asEight = Array.from({ length: 8 }, () => land / 8)
      .reduce((sum, tiles) => sum + regionPropBudget('pine', tiles), 0);
    expect(Math.abs(asEight - asThirteen) / asThirteen).toBeLessThan(0.12);
  });
});
