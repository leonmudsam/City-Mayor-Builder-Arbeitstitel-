import { describe, expect, it } from 'vitest';
import { BAKED_START, TERRAIN_IDS, WORLD_TILES, terrainGrid } from '../src/game/config/world/islandTerrain.gen.ts';
import { BAKED_REGIONS, REGION_COUNT, regionIdAt, startRegionConfig, terrainAt } from '../src/game/config/startRegion.config.ts';
import { regionGrid } from '../src/game/config/world/islandRegions.gen.ts';
import { loadConfig } from '../src/game/config/index.ts';

// Integrität der gebackenen Insel-Welt (§ MVP4 + § Welt 2.0 Regionen): die
// Gen-Grids sind die EINE Quelle für Terrain und Region-Zugehörigkeit — diese
// Tests halten Bake, Config und Sim-Annahmen synchron. Bricht hier etwas nach
// einem Rebake, zuerst tools/bake-report.md prüfen.

describe('baked island world', () => {
  it('has the binding dimensions (512×512 tiles, konsolidierte Regionen)', () => {
    expect(WORLD_TILES).toBe(512);
    expect(terrainGrid.length).toBe(WORLD_TILES * WORLD_TILES);
    expect(regionGrid.length).toBe(WORLD_TILES * WORLD_TILES);
    // § Final World Compaction 8.1: aus 40 kleinteiligen Landschaften wurden
    // EINE zentrale Startregion und ZWÖLF bedeutende Freischaltungen.
    expect(REGION_COUNT).toBe(13);
    expect(BAKED_REGIONS.length).toBe(REGION_COUNT);
  });

  it('contains only valid terrain ids and every biome exists on the island', () => {
    const seen = new Set<number>();
    for (const id of terrainGrid) {
      if (id >= TERRAIN_IDS.length) {
        throw new Error(`Ungültige Terrain-ID ${id} im 512²-Bake`);
      }
      seen.add(id);
    }
    // Alle 7 Terrain-Typen kommen vor (water/river/sand/fertile/grass/forest/mountain).
    expect(seen.size).toBe(TERRAIN_IDS.length);
  });

  it('assigns every land tile to a region and keeps the ocean region-free', () => {
    // Region 0 = offener Ozean. Erlaubte Ausnahmen: ozean-verbundene
    // Fluss-Mündungen und winzige, vom Festland abgeschnittene Küsten-Splitter
    // (Sandbänke) — die sind nie erschließbar und damit nie bebaubar.
    let strayLand = 0;
    let maxRegionId = 0;
    for (let i = 0; i < regionGrid.length; i++) {
      const rid = regionGrid[i]!;
      maxRegionId = Math.max(maxRegionId, rid);
      const terrain = TERRAIN_IDS[terrainGrid[i]!];
      if (rid === 0 && terrain !== 'water' && terrain !== 'river') strayLand++;
    }
    expect(maxRegionId).toBeLessThanOrEqual(REGION_COUNT);
    // § Final World Compaction 8.1: Die Quellinsel ist ein Archipel. Die 13
    // Gameplayregionen decken alle erschließbaren Landmassen ab; übrig bleiben
    // nur kleine, vom Regionsnetz abgeschnittene Küsten-/Insel-Splitter, die nie
    // bebaubar sind. Der relative Grenzwert bleibt bei Rebakes skalierbar.
    expect(strayLand / regionGrid.length).toBeLessThan(0.03);
    // Die Weltgrenze ist reiner Ozean ohne Region (Insel-Garantie).
    for (let i = 0; i < WORLD_TILES; i += 3) {
      expect(terrainAt(i, 0)).toBe('water');
      expect(regionIdAt(i, 0)).toBe(0);
      expect(terrainAt(0, i)).toBe('water');
      expect(regionIdAt(WORLD_TILES - 1, i)).toBe(0);
    }
    // Außerhalb der Welt ist immer Ozean/Region 0 (totale Abfrage).
    expect(terrainAt(-1, 5)).toBe('water');
    expect(regionIdAt(-1, 5)).toBe(0);
    expect(regionIdAt(WORLD_TILES, 5)).toBe(0);
  });

  it('bakes a consistent adjacency graph (symmetric, no self-loops)', () => {
    for (const r of BAKED_REGIONS) {
      for (const n of r.adjacent) {
        expect(n).not.toBe(r.id);
        expect(BAKED_REGIONS[n - 1]!.adjacent).toContain(r.id);
      }
    }
  });

  it('guarantees the central 1200–1600 start, 7×7 grass reserve and two road axes', () => {
    expect(startRegionConfig.startRegionId).toBe(BAKED_START.regionId);
    const startBaked = BAKED_REGIONS[BAKED_START.regionId - 1]!;
    // § Change 9.0 §3.3: die Startregion ist das langfristige Zentrum — 1.200–1.600
    // direkt bebaubare Kacheln (echte Anfangsstadt), nicht mehr die 820er-Pocket.
    expect(startBaked.buildable).toBeGreaterThanOrEqual(1200);
    expect(startBaked.buildable).toBeLessThanOrEqual(1600);
    expect(BAKED_START.score.earlyBuildableTiles).toBeGreaterThanOrEqual(4000);
    expect(BAKED_START.score.earlyBuildableTiles).toBeLessThanOrEqual(9500);
    // Rathaus-5×5 inkl. 1 Kachel Rand und die Startstraßen liegen auf Gras.
    const th = startRegionConfig.townHall;
    for (let dy = -1; dy <= 5; dy++) {
      for (let dx = -1; dx <= 5; dx++) {
        expect(terrainAt(th.x + dx, th.y + dy)).toBe('grass');
        expect(regionIdAt(th.x + dx, th.y + dy)).toBe(BAKED_START.regionId);
      }
    }
    for (const r of startRegionConfig.startRoads) expect(terrainAt(r.x, r.y)).toBe('grass');
    expect(startRegionConfig.startRoads).toHaveLength(16);
    expect(new Set(startRegionConfig.startRoads.map((r) => r.x)).size).toBeGreaterThan(1);
    expect(new Set(startRegionConfig.startRoads.map((r) => r.y)).size).toBeGreaterThan(1);
  });

  it('keeps regions.config aligned with the bake (alle Ids, Start frei, jede Region erreichbar)', () => {
    const config = loadConfig(); // wirft bei Config↔Bake-Abweichungen (Ids, Prereq-Adjazenz)
    expect(config.regionList.length).toBe(REGION_COUNT);
    const start = config.regions.get(BAKED_START.regionId)!;
    expect(start.biome).toBe('zentrum');
    expect(start.unlockCost).toBe(0);
    // § Final World Compaction 8.1 §4: keine bedeutungslosen Mini-Regionen und
    // keine dauerhaften Teaser mehr — jede der 13 Regionen ist erreichbar (1
    // Start + 12 Freischaltungen). Die Archipel-Erreichbarkeit über See wird
    // durch `requiresHarbor` + `seaAdjacent` sichergestellt.
    expect(config.regionList.every((region) => region.unlockable)).toBe(true);
    expect(config.regionList.filter((region) => region.unlockLevel <= 1)).toHaveLength(1);
    expect(config.regionList.filter((region) => region.unlockable && region.unlockLevel > 1)).toHaveLength(12);
  });
});
