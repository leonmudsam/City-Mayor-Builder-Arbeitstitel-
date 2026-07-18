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
  it('has the binding dimensions (384×384 tiles, organische Regionen)', () => {
    expect(WORLD_TILES).toBe(384);
    expect(terrainGrid.length).toBe(WORLD_TILES * WORLD_TILES);
    expect(regionGrid.length).toBe(WORLD_TILES * WORLD_TILES);
    // Zielkorridor des Auftrags: ~24–32 benannte Landschaften.
    expect(REGION_COUNT).toBeGreaterThanOrEqual(24);
    expect(REGION_COUNT).toBeLessThanOrEqual(40);
    expect(BAKED_REGIONS.length).toBe(REGION_COUNT);
  });

  it('contains only valid terrain ids and every biome exists on the island', () => {
    const seen = new Set<number>();
    for (const id of terrainGrid) {
      expect(id).toBeLessThan(TERRAIN_IDS.length);
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
    for (let i = 0; i < regionGrid.length; i++) {
      const rid = regionGrid[i]!;
      expect(rid).toBeLessThanOrEqual(REGION_COUNT);
      const terrain = TERRAIN_IDS[terrainGrid[i]!];
      if (rid === 0 && terrain !== 'water' && terrain !== 'river') strayLand++;
    }
    expect(strayLand).toBeLessThan(400);
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

  it('guarantees the start: ≥2500 buildable tiles, 7×7 grass town-hall block and 5 roads', () => {
    expect(startRegionConfig.startRegionId).toBe(BAKED_START.regionId);
    const startBaked = BAKED_REGIONS[BAKED_START.regionId - 1]!;
    expect(startBaked.buildable).toBeGreaterThanOrEqual(2500);
    // Rathaus-5×5 inkl. 1 Kachel Rand und die Startstraßen liegen auf Gras.
    const th = startRegionConfig.townHall;
    for (let dy = -1; dy <= 5; dy++) {
      for (let dx = -1; dx <= 5; dx++) {
        expect(terrainAt(th.x + dx, th.y + dy)).toBe('grass');
        expect(regionIdAt(th.x + dx, th.y + dy)).toBe(BAKED_START.regionId);
      }
    }
    for (const r of startRegionConfig.startRoads) expect(terrainAt(r.x, r.y)).toBe('grass');
  });

  it('keeps regions.config aligned with the bake (alle Ids, Start frei, Teaser-Insel gesperrt)', () => {
    const config = loadConfig(); // wirft bei Config↔Bake-Abweichungen (Ids, Prereq-Adjazenz)
    expect(config.regionList.length).toBe(REGION_COUNT);
    const start = config.regions.get(BAKED_START.regionId)!;
    expect(start.biome).toBe('zentrum');
    expect(start.unlockCost).toBe(0);
    // Regionen ohne Bake-Nachbarn (vorgelagerte Inseln) sind nie freischaltbar.
    for (const baked of BAKED_REGIONS) {
      if (baked.adjacent.length === 0) expect(config.regions.get(baked.id)!.unlockable).toBe(false);
    }
  });
});
