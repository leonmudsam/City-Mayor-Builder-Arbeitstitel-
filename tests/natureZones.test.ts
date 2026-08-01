// Naturzonen, Spawn-Regeln und die daraus entstehende Weltverteilung
// (§ Natur-Overhaul 14.0).
//
// Diese Tests messen über die ECHTEN Module — `collectRegionNature` ist dieselbe
// Funktion, die der Renderer aufruft. Ein Nachbau würde früher oder später etwas
// anderes messen als das Spiel zeigt (D-042).
import { describe, expect, it } from 'vitest';
import {
  BAKED_REGIONS,
  WORLD_TILES,
  regionBounds,
  regionIdAt,
  startRegionConfig,
} from '../src/game/config/startRegion.config.ts';
import { terrainGrid } from '../src/game/config/world/islandTerrain.gen.ts';
import type { TerrainType } from '../src/game/types.ts';
import { terrainHeightAt } from '../src/renderer/three/terrainHeight.ts';
import {
  NATURE_KINDS,
  NATURE_SPAWN_RULES,
  NATURE_ZONES,
  NATURE_ZONE_THRESHOLDS,
  classifyNatureZone,
  highlandVegetationFalloff,
  natureGroupOf,
  shouldSpawn,
  spawnScale,
  type NatureZone,
  type NatureZoneInput,
} from '../src/renderer/three/natureZones.ts';
import {
  collectRegionNature,
  natureZoneAt,
} from '../src/renderer/three/natureDistribution.ts';
import {
  SMALL_ISLAND_MAX_TILES,
  cliffDistanceAt,
  forestDensityAt,
  landMassSizeAt,
} from '../src/renderer/three/worldSurfaceMasks.ts';
import { starterNatureFrame } from '../src/renderer/three/vegetationBudget.ts';

const TERRAIN_IDS = ['water', 'river', 'sand', 'fertile', 'grass', 'forest', 'mountain'] as const;
const terrainAt = (x: number, y: number): TerrainType => {
  if (x < 0 || y < 0 || x >= WORLD_TILES || y >= WORLD_TILES) return 'water';
  return (TERRAIN_IDS[terrainGrid[y * WORLD_TILES + x] ?? 0] ?? 'water') as TerrainType;
};
const heightAt = (x: number, y: number): number => terrainHeightAt(x + 0.5, y + 0.5);

const baseInput = (over: Partial<NatureZoneInput> = {}): NatureZoneInput => ({
  terrain: 'grass',
  height: 6,
  slope: 0.2,
  forestDensity: 0,
  coastDistance: 40,
  cliffDistance: 40,
  shoreType: 0,
  landMassSize: 50_000,
  freshwaterAdjacent: false,
  smallIsland: false,
  ...over,
});

describe('classifyNatureZone — die Landschaft entscheidet, nicht der Terraintyp', () => {
  it('trennt Waldkern und Waldrand über die UMGEBUNG, nicht über die Kachel', () => {
    // Beide Kacheln sind Wald. Nur der Bestand ringsum unterscheidet sie —
    // genau das konnte die alte Terraintyp-Kaskade nicht sehen.
    expect(classifyNatureZone(baseInput({ terrain: 'forest', forestDensity: 0.95 }))).toBe('forest_core');
    expect(classifyNatureZone(baseInput({ terrain: 'forest', forestDensity: 0.2 }))).toBe('forest_edge');
  });

  it('zieht den Waldrand auch über Nicht-Waldkacheln neben dem Bestand', () => {
    expect(classifyNatureZone(baseInput({ terrain: 'grass', forestDensity: 0.4 }))).toBe('forest_edge');
    expect(classifyNatureZone(baseInput({ terrain: 'grass', forestDensity: 0.02 }))).toBe('meadow');
  });

  it('macht aus Steigung und Höhe Felshochland — unabhängig vom Terraintyp', () => {
    expect(classifyNatureZone(baseInput({ terrain: 'mountain' }))).toBe('rocky_highland');
    expect(classifyNatureZone(baseInput({ slope: NATURE_ZONE_THRESHOLDS.rockySlope + 0.1 }))).toBe('rocky_highland');
    expect(classifyNatureZone(baseInput({ height: NATURE_ZONE_THRESHOLDS.rockyHeight + 1 }))).toBe('rocky_highland');
  });

  it('unterscheidet flache und felsige Küste', () => {
    expect(classifyNatureZone(baseInput({ coastDistance: 2, shoreType: 1 }))).toBe('coast_flat');
    expect(classifyNatureZone(baseInput({ coastDistance: 2, shoreType: 4 }))).toBe('coast_rocky');
    // Auch ohne eigene Steilküste: liegt eine in Reichweite, ist die Bucht felsig.
    expect(classifyNatureZone(baseInput({ coastDistance: 2, shoreType: 1, cliffDistance: 2 }))).toBe('coast_rocky');
  });

  it('gibt kleinen Inseln einen eigenen Landschaftstyp — vor allem anderen', () => {
    // Selbst als Gebirgskachel bleibt ein Eiland ein Eiland.
    expect(classifyNatureZone(baseInput({ smallIsland: true, terrain: 'mountain' }))).toBe('small_island');
  });
});

describe('shouldSpawn — Dichte, Cluster und Terrainbindung', () => {
  const query = (over: Record<string, unknown> = {}) => ({
    kind: 'pine' as const,
    zone: 'forest_core' as NatureZone,
    terrain: 'forest' as TerrainType,
    x: 120,
    y: 240,
    cluster: 0.5,
    height: 5,
    regionSalt: 7,
    ...over,
  });

  it('ist deterministisch — gleiche Frage, gleiche Antwort', () => {
    const a = shouldSpawn(query());
    for (let i = 0; i < 5; i++) expect(shouldSpawn(query())).toBe(a);
  });

  it('setzt nichts, wofür die Zone keine Regel hat', () => {
    // In der Wiese wächst kein Waldkern-Totholz.
    expect(shouldSpawn(query({ kind: 'deadwood', zone: 'meadow', terrain: 'grass' }))).toBe(false);
  });

  it('achtet die Terrainbindung einer Regel', () => {
    // Ackerspuren gehören auf fruchtbaren Boden, nicht auf jede Weide.
    let onGrass = 0;
    let onFertile = 0;
    for (let x = 0; x < 400; x++) {
      if (shouldSpawn(query({ kind: 'fieldRow', zone: 'meadow', terrain: 'grass', x, cluster: 0.9 }))) onGrass++;
      if (shouldSpawn(query({ kind: 'fieldRow', zone: 'meadow', terrain: 'fertile', x, cluster: 0.9 }))) onFertile++;
    }
    expect(onGrass).toBe(0);
    expect(onFertile).toBeGreaterThan(20);
  });

  it('verdichtet in Clustern und lichtet dazwischen auf', () => {
    const count = (cluster: number): number => {
      let hits = 0;
      for (let x = 0; x < 500; x++) if (shouldSpawn(query({ x, cluster }))) hits++;
      return hits;
    };
    const dense = count(0.95);
    const sparse = count(0.05);
    expect(dense).toBeGreaterThan(sparse * 2);
    // Echte Lichtungen sind erwünscht — sonst gibt es keine lesbaren Kanten.
    expect(sparse).toBeLessThan(120);
  });

  it('lässt Grün zur Höhe hin abnehmen, Fels aber nicht', () => {
    expect(highlandVegetationFalloff(5)).toBe(1);
    expect(highlandVegetationFalloff(40)).toBeLessThan(0.2);
    const green = (height: number): number => {
      let hits = 0;
      for (let x = 0; x < 600; x++) {
        if (shouldSpawn(query({ kind: 'pine', zone: 'rocky_highland', terrain: 'mountain', x, height, cluster: 0.9 }))) hits++;
      }
      return hits;
    };
    const rock = (height: number): number => {
      let hits = 0;
      for (let x = 0; x < 600; x++) {
        if (shouldSpawn(query({ kind: 'rock', zone: 'rocky_highland', terrain: 'mountain', x, height, cluster: 0.9 }))) hits++;
      }
      return hits;
    };
    expect(green(45)).toBeLessThan(green(10));
    expect(rock(45)).toBe(rock(10));
  });

  it('gibt jeder Art genau eine Wirkgruppe', () => {
    for (const kind of NATURE_KINDS) {
      expect(['tree', 'rock', 'coast', 'ground'], kind).toContain(natureGroupOf(kind));
    }
  });
});

describe('spawnScale — Größenstreuung trägt den Charakter der Zone', () => {
  it('bleibt im Band der Regel', () => {
    for (const zone of NATURE_ZONES) {
      for (const [kind, spawnRule] of Object.entries(NATURE_SPAWN_RULES[zone])) {
        const [min, max] = spawnRule.scale;
        for (let x = 0; x < 40; x++) {
          const scale = spawnScale(kind as never, zone, x, x * 3);
          expect(scale, `${zone}/${kind}`).toBeGreaterThanOrEqual(min);
          expect(scale, `${zone}/${kind}`).toBeLessThanOrEqual(max);
        }
      }
    }
  });

  it('setzt Jungwuchs kleiner und Akzentbäume größer als den Normalbestand', () => {
    const normal = NATURE_SPAWN_RULES.forest_core.pine!.scale;
    const young = NATURE_SPAWN_RULES.forest_edge.sapling!.scale;
    const accent = NATURE_SPAWN_RULES.meadow.meadowTree!.scale;
    expect(young[1]).toBeLessThanOrEqual(normal[0]);
    expect(accent[1]).toBeGreaterThan(normal[1]);
  });
});

describe('worldSurfaceMasks — abgeleitete Auskünfte über die gebackene Welt', () => {
  it('findet die Hauptlandmasse und echte kleine Inseln', () => {
    const townHall = startRegionConfig.townHall;
    expect(landMassSizeAt(townHall.x, townHall.y)).toBeGreaterThan(20_000);
    let smallIslandTiles = 0;
    for (let y = 0; y < WORLD_TILES; y += 2) {
      for (let x = 0; x < WORLD_TILES; x += 2) {
        const size = landMassSizeAt(x, y);
        if (size > 0 && size <= SMALL_ISLAND_MAX_TILES) smallIslandTiles++;
      }
    }
    // Die modelltreue Insel hat vorgelagerte Eilande — ohne sie wäre die Zone
    // `small_island` toter Code.
    expect(smallIslandTiles).toBeGreaterThan(20);
  });

  it('liefert Waldanteil und Klippendistanz in gültigen Bereichen', () => {
    for (let i = 0; i < 200; i++) {
      const x = (i * 37) % WORLD_TILES;
      const y = (i * 91) % WORLD_TILES;
      expect(forestDensityAt(x, y)).toBeGreaterThanOrEqual(0);
      expect(forestDensityAt(x, y)).toBeLessThanOrEqual(1);
      expect(cliffDistanceAt(x, y)).toBeGreaterThanOrEqual(0);
      expect(cliffDistanceAt(x, y)).toBeLessThanOrEqual(255);
    }
  });
});

describe('Weltverteilung — was am Ende auf der Insel steht', () => {
  const world = (() => {
    const perKind = new Map<string, number>();
    const perZone = new Map<NatureZone, number>();
    const zoneTiles = new Map<NatureZone, number>();
    let uncappedTotal = 0;
    let total = 0;
    for (const baked of BAKED_REGIONS) {
      const clearing = baked.id === startRegionConfig.startRegionId
        ? (x: number, y: number) => starterNatureFrame(Math.hypot(
          x + 0.5 - (startRegionConfig.townHall.x + 2.5),
          y + 0.5 - (startRegionConfig.townHall.y + 2.5),
        ))
        : undefined;
      const bounds = regionBounds(baked.id);
      if (bounds) {
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
          for (let x = bounds.minX; x <= bounds.maxX; x++) {
            if (regionIdAt(x, y) !== baked.id) continue;
            const terrain = terrainAt(x, y);
            if (terrain === 'water' || terrain === 'river') continue;
            const zone = natureZoneAt(x, y, terrain, heightAt(x, y), terrainAt);
            zoneTiles.set(zone, (zoneTiles.get(zone) ?? 0) + 1);
          }
        }
      }
      const placement = collectRegionNature(baked.id, { terrainAt, heightAt, clearing });
      for (const kind of NATURE_KINDS) {
        perKind.set(kind, (perKind.get(kind) ?? 0) + placement[kind].length);
        total += placement[kind].length;
        for (const instance of placement[kind]) {
          perZone.set(instance.zone, (perZone.get(instance.zone) ?? 0) + 1);
        }
      }
      // Ohne Budgetdeckel — zeigt, ob die Landschaft oder die Zahl regiert.
      const uncapped = collectRegionNature(baked.id, {
        terrainAt,
        heightAt,
        clearing,
        scaleBudget: () => Number.MAX_SAFE_INTEGER,
      });
      for (const kind of NATURE_KINDS) uncappedTotal += uncapped[kind].length;
    }
    return { perKind, perZone, zoneTiles, total, uncappedTotal };
  })();

  it('bepflanzt die Insel deutlich dichter als vor dem Overhaul', () => {
    // Ausgangslage der Messung vor § 14.0: 14.038 Props weltweit.
    expect(world.total).toBeGreaterThan(35_000);
  });

  it('lässt jede Zone tatsächlich vorkommen — keine tote Regel', () => {
    for (const zone of NATURE_ZONES) {
      expect(world.zoneTiles.get(zone) ?? 0, `Kacheln in ${zone}`).toBeGreaterThan(0);
      expect(world.perZone.get(zone) ?? 0, `Props in ${zone}`).toBeGreaterThan(0);
    }
  });

  it('setzt jede Prop-Art irgendwo ein', () => {
    for (const kind of NATURE_KINDS) {
      expect(world.perKind.get(kind) ?? 0, kind).toBeGreaterThan(0);
    }
  });

  it('lässt die LANDSCHAFT über die Dichte entscheiden, nicht das Budget', () => {
    // § 12.1/12.2 mussten mehrfach nachbessern, weil das Budget der Engpass war
    // und nicht die Welt. Der Deckel darf greifen — aber nicht das Bild machen.
    expect(world.total).toBeGreaterThan(world.uncappedTotal * 0.9);
  });

  it('hält offene Bauflächen lesbar: Wiese trägt ein Vielfaches weniger Bäume als Waldkern', () => {
    // §7 des Auftrags. Gemessen wird die Baumdichte JE KACHEL, nicht absolut —
    // die Wiese ist die mit Abstand größte Zone der Insel.
    const treeDensity = (zone: NatureZone): number => {
      const rules = NATURE_SPAWN_RULES[zone];
      return (['pine', 'broadleaf', 'largePine', 'meadowTree'] as const)
        .reduce((sum, kind) => sum + (rules[kind]?.density ?? 0), 0);
    };
    expect(treeDensity('forest_core')).toBeGreaterThan(treeDensity('meadow') * 8);
  });

  it('bepflanzt kleine Inseln kompakt statt kahl', () => {
    const tiles = world.zoneTiles.get('small_island') ?? 0;
    const props = world.perZone.get('small_island') ?? 0;
    expect(props / Math.max(1, tiles)).toBeGreaterThan(1);
  });

  it('hält den Gründungsplatz frei, ohne die Startregion zu entlauben', () => {
    const start = collectRegionNature(startRegionConfig.startRegionId, {
      terrainAt,
      heightAt,
      clearing: (x, y) => starterNatureFrame(Math.hypot(
        x + 0.5 - (startRegionConfig.townHall.x + 2.5),
        y + 0.5 - (startRegionConfig.townHall.y + 2.5),
      )),
    });
    const all = NATURE_KINDS.flatMap((kind) => start[kind]);
    expect(all.length).toBeGreaterThan(600);
    const nearTownHall = all.filter((instance) => Math.hypot(
      instance.x + 0.5 - (startRegionConfig.townHall.x + 2.5),
      instance.y + 0.5 - (startRegionConfig.townHall.y + 2.5),
    ) < 5);
    expect(nearTownHall).toHaveLength(0);
  });

  it('ist unabhängig davon, welche anderen Regionen sichtbar sind (§16)', () => {
    const first = collectRegionNature(2, { terrainAt, heightAt });
    // Eine andere Region dazwischen einsammeln darf nichts verändern.
    collectRegionNature(5, { terrainAt, heightAt });
    const second = collectRegionNature(2, { terrainAt, heightAt });
    expect(second.pine).toEqual(first.pine);
    expect(second.rock).toEqual(first.rock);
  });
});
