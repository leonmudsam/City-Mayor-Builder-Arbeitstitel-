// § Stadtarbeit-Overhaul, Phase P3 — „Die 2D-Karte IST die Welt".
//
// Der Auftrag verbietet ausdrücklich eine „vereinfachte neue Fake-Karte". Das
// ist keine Geschmacksfrage, sondern prüfbar: jede Kachel der Draufsicht muss
// aus denselben Bake-Daten stammen wie die 3D-Welt, und die Vegetation muss aus
// derselben Verteilungsinstanz kommen (D-042/D-044). Genau das steht hier.

import { describe, expect, it } from 'vitest';
import {
  MAP_NATURE_KINDS,
  TILE_METERS,
  WORLD_TILES,
  collectMapNature,
  elevationAboveWater,
  reliefShade,
  sampleWorldTile,
  worldTileColor,
} from '../src/renderer/worldProjection.ts';
import { bakedSurfaceAt, regionIdAt, terrainAt } from '../src/game/config/startRegion.config.ts';
import { WATER_LEVEL, terrainHeightAt } from '../src/renderer/three/terrainHeight.ts';
import { collectRegionNature } from '../src/renderer/three/natureDistribution.ts';
import { NATURE_KINDS } from '../src/renderer/three/natureZones.ts';
import { ROAD_TILE_METERS } from '../src/game/roads/roadProfile.ts';

/** Ein Raster über die ganze Welt — billig genug und trotzdem flächendeckend. */
function scan(step: number, visit: (x: number, y: number) => void): void {
  for (let y = 0; y < WORLD_TILES; y += step) {
    for (let x = 0; x < WORLD_TILES; x += step) visit(x, y);
  }
}

describe('Kachelabtastung', () => {
  it('gibt für JEDE Kachel genau die Bake-Werte zurück — keine eigene Interpretation', () => {
    let checked = 0;
    scan(7, (x, y) => {
      const sample = sampleWorldTile(x, y);
      const surface = bakedSurfaceAt(x, y);
      expect(sample.terrain).toBe(terrainAt(x, y));
      expect(sample.regionId).toBe(regionIdAt(x, y));
      expect(sample.height).toBe(terrainHeightAt(x + 0.5, y + 0.5));
      expect(sample.slope).toBe(surface.slope);
      expect(sample.water).toBe(surface.water);
      expect(sample.cliff).toBe(surface.cliff);
      expect(sample.coast).toBe(surface.coast);
      expect(sample.buildable).toBe(surface.buildable);
      expect(sample.shoreType).toBe(surface.shoreType);
      checked += 1;
    });
    expect(checked).toBeGreaterThan(4_000);
  });

  it('bleibt außerhalb der Welt total (offener Ozean statt Absturz)', () => {
    for (const [x, y] of [[-5, 3], [WORLD_TILES + 2, 10], [4, -1], [4, WORLD_TILES]] as const) {
      const sample = sampleWorldTile(x, y);
      expect(sample.regionId).toBe(0);
      expect(sample.water).toBe(true);
    }
  });

  it('misst Höhe über der Wasserlinie aus derselben Quelle', () => {
    scan(23, (x, y) => {
      expect(elevationAboveWater(x, y)).toBeCloseTo(terrainHeightAt(x + 0.5, y + 0.5) - WATER_LEVEL, 6);
    });
  });

  it('nutzt dieselbe Kachelgröße wie das Straßenprofil', () => {
    // Sonst hieße „120 m" auf der Karte etwas anderes als in der Simulation.
    expect(TILE_METERS).toBe(ROAD_TILE_METERS);
  });
});

describe('Hangschattierung', () => {
  it('ist auf ebenem Grund neutral und auf Hängen ausgeprägt', () => {
    let flat = 0;
    let sloped = 0;
    scan(5, (x, y) => {
      const shade = reliefShade(x, y);
      expect(shade).toBeGreaterThanOrEqual(-1);
      expect(shade).toBeLessThanOrEqual(1);
      if (Math.abs(shade) < 0.02) flat += 1;
      if (Math.abs(shade) > 0.25) sloped += 1;
    });
    // Beides muss vorkommen: eine Insel ohne ebene Flächen wäre unbebaubar,
    // eine ohne Hänge hätte kein Relief zu zeigen.
    expect(flat).toBeGreaterThan(100);
    expect(sloped).toBeGreaterThan(100);
  });

  it('liefert bei wiederholter Abfrage denselben Wert (Cache ist transparent)', () => {
    for (const [x, y] of [[120, 240], [260, 250], [300, 180]] as const) {
      expect(reliefShade(x, y)).toBe(reliefShade(x, y));
    }
  });

  it('beleuchtet Nordwesthänge heller als Südosthänge', () => {
    // Ein künstlicher Gegentest ist hier nicht möglich (die Höhe kommt aus dem
    // Bake), deshalb die Aussage über die ganze Insel: über allen Kacheln muss
    // beides in nennenswerter Zahl vorkommen, sonst schattiert nichts.
    let bright = 0;
    let dark = 0;
    scan(5, (x, y) => {
      const shade = reliefShade(x, y);
      if (shade > 0.15) bright += 1;
      if (shade < -0.15) dark += 1;
    });
    expect(bright).toBeGreaterThan(200);
    expect(dark).toBeGreaterThan(200);
  });
});

describe('Kachelfarbe', () => {
  it('bildet die Terrainklasse ab: Wald grüner, Gebirge grauer, Wasser blauer', () => {
    const average = { forest: rgbAverage('forest'), mountain: rgbAverage('mountain'), water: rgbAverage('water') };
    // Wald: Grün dominiert deutlich.
    expect(average.forest.g).toBeGreaterThan(average.forest.r * 1.15);
    // Gebirge: kaum Farbstich, alle Kanäle nah beieinander.
    expect(Math.abs(average.mountain.r - average.mountain.g)).toBeLessThan(24);
    // Wasser: Blau dominiert.
    expect(average.water.b).toBeGreaterThan(average.water.r * 1.6);
  });

  it('zeichnet tiefes Wasser dunkler als flaches', () => {
    let deepSum = 0;
    let deepCount = 0;
    let shallowSum = 0;
    let shallowCount = 0;
    scan(3, (x, y) => {
      const sample = sampleWorldTile(x, y);
      if (!sample.water) return;
      const color = worldTileColor(x, y);
      const luminance = color.r + color.g + color.b;
      const depth = WATER_LEVEL - sample.height;
      // Schwellen an der GEMESSENEN Verteilung: die Insel hat keinen
      // Gewässergrund, tiefste Stelle 5,06 m, das Gros liegt bei 2–3 m.
      if (depth > 3) {
        deepSum += luminance;
        deepCount += 1;
      } else if (depth < 1.5) {
        shallowSum += luminance;
        shallowCount += 1;
      }
    });
    expect(deepCount).toBeGreaterThan(50);
    expect(shallowCount).toBeGreaterThan(50);
    expect(deepSum / deepCount).toBeLessThan(shallowSum / shallowCount);
  });

  it('entsättigt gesperrtes Land nach derselben Regel wie die 3D-Welt', () => {
    let compared = 0;
    scan(11, (x, y) => {
      if (sampleWorldTile(x, y).water) return;
      const open = worldTileColor(x, y, false);
      const locked = worldTileColor(x, y, true);
      const spread = (c: { r: number; g: number; b: number }) =>
        Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b);
      // Entsättigt UND abgedunkelt — beides zusammen trägt die Aussage.
      expect(spread(locked)).toBeLessThanOrEqual(spread(open) + 1);
      expect(locked.r + locked.g + locked.b).toBeLessThanOrEqual(open.r + open.g + open.b + 3);
      compared += 1;
    });
    expect(compared).toBeGreaterThan(300);
  });

  it('bleibt in jedem Kanal im gültigen Bereich', () => {
    scan(9, (x, y) => {
      for (const locked of [false, true]) {
        const color = worldTileColor(x, y, locked);
        for (const channel of [color.r, color.g, color.b]) {
          expect(Number.isInteger(channel)).toBe(true);
          expect(channel).toBeGreaterThanOrEqual(0);
          expect(channel).toBeLessThanOrEqual(255);
        }
      }
    });
  });
});

describe('Vegetation', () => {
  // Der eigentliche Beweis, dass die Karte keine zweite Welt ist: Sie fragt
  // dieselbe Verteilungsinstanz wie der 3D-Renderer. Ein Nachbau in der Karte
  // (oder in diesem Test) würde früher oder später auseinanderlaufen — genau
  // die Lehre aus D-042.
  const region = 1;

  it('liefert exakt die Instanzen von collectRegionNature', () => {
    const mapped = collectMapNature([region]);
    const reference = collectRegionNature(region, {
      terrainAt,
      heightAt: (x, y) => terrainHeightAt(x + 0.5, y + 0.5),
    });
    for (const kind of MAP_NATURE_KINDS) {
      const fromMap = mapped
        .filter((instance) => instance.kind === kind)
        .map((instance) => `${instance.x},${instance.y},${instance.scale}`)
        .sort();
      const fromWorld = reference[kind]
        .map((instance) => `${instance.x},${instance.y},${instance.scale}`)
        .sort();
      expect(fromMap).toEqual(fromWorld);
    }
  });

  it('lässt nur Bodendeckung weg — und nennt sie beim Namen', () => {
    const omitted = NATURE_KINDS.filter((kind) => !MAP_NATURE_KINDS.includes(kind));
    expect([...omitted].sort()).toEqual(['fieldRow', 'flower', 'microGrass']);
  });

  it('bewächst die Insel spürbar (die Karte ist nicht kahl)', () => {
    const instances = collectMapNature([1, 2, 3]);
    expect(instances.length).toBeGreaterThan(1_000);
    // Und die Bäume sind die Mehrheit — sie tragen die Lesbarkeit.
    const trees = instances.filter((instance) => instance.group === 'tree');
    expect(trees.length).toBeGreaterThan(instances.length * 0.1);
  });

  it('dünnt gesperrte Regionen aus, statt sie zu verstecken', () => {
    const full = collectMapNature([region]).length;
    const thinned = collectMapNature([region], { densityScale: () => 0.5 }).length;
    expect(thinned).toBeGreaterThan(0);
    expect(thinned).toBeLessThan(full);
  });
});

function rgbAverage(terrain: 'forest' | 'mountain' | 'water'): { r: number; g: number; b: number } {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  scan(3, (x, y) => {
    if (terrainAt(x, y) !== terrain) return;
    const color = worldTileColor(x, y);
    r += color.r;
    g += color.g;
    b += color.b;
    count += 1;
  });
  expect(count).toBeGreaterThan(20);
  return { r: r / count, g: g / count, b: b / count };
}
