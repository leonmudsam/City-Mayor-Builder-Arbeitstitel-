// Welt-Konfiguration der Insel (§ MVP4 Welt-Neuaufbau · § Welt 2.0 Regionen).
//
// Die Weltform kommt aus dem Offline-Bake der verbindlichen Referenz-GLB
// (`reference/world/island 3d new.glb` → `tools/bakeWorld.mjs`):
// Terrain aus `world/islandTerrain.gen.ts`, die organischen Regionen aus
// `world/islandRegions.gen.ts`. Seit Welt 2.0 gibt es KEINE Quadrat-Sektoren
// mehr — der Spieler erschließt Landschaften; `regionIdAt` ist die einzige
// Zugehörigkeits-Quelle. Maßstäbe: docs/WORLD_SCALE.md.

import type { RegionId, TerrainType } from '../types.ts';
import { BAKED_START, BAKED_WORLD, TERRAIN_IDS, WORLD_TILES, terrainGrid } from './world/islandTerrain.gen.ts';
import { BAKED_REGIONS, REGION_COUNT, regionGrid } from './world/islandRegions.gen.ts';
import {
  BUILDABILITY_WORLD_TILES,
  BUILDABLE_BIT,
  CLIFF_BIT,
  COAST_BIT,
  SHORE_TYPES,
  SURFACE_HEIGHT_SCALE,
  SURFACE_SLOPE_SCALE,
  WATER_BIT,
  WATERFRONT_BIT,
  buildabilityGrid,
  shoreTypeGrid,
  surfaceHeightGrid,
  surfaceSlopeGrid,
} from './world/islandBuildability.gen.ts';

if (BUILDABILITY_WORLD_TILES !== WORLD_TILES) throw new Error('Bake: Terrain- und Bauflächenraster sind nicht synchron.');

/** Weltbreite/-tiefe in Kacheln (re-export aus dem Bake für Konsumenten). */
export { WORLD_TILES };

/** Anzahl organischer Regionen (Ozean = Id 0 zählt nicht). */
export { REGION_COUNT };

/** Gebackene Region-Statistik (Kacheln, Bebaubarkeit, Nachbarn, Zentrum). */
export { BAKED_REGIONS };

export const startRegionConfig = {
  /** Vom Bake gewählte zentrale Startregion (Ziel 900–1.400 bebaubare Kacheln). */
  startRegionId: BAKED_START.regionId as RegionId,
  /** Rathaus (5×5, Anker links-oben): flachster 7×7-Gras-Block nahe der Regionsmitte. */
  townHall: { x: BAKED_START.townHall.x, y: BAKED_START.townHall.y },
  /** Vorplatzierte Tutorial-Straßen entlang der Rathaus-Südkante. */
  startRoads: BAKED_START.startRoads.map((r) => ({ x: r.x, y: r.y })),
};

/** Rein geografische Hooks für eine spätere Ankunftserzählung. Kein Tutorial-
 * oder Missionszustand wird hier eingeführt; Simulationen können diese Punkte
 * über Commands/Config nutzen, sobald die dazugehörige Spiellogik existiert. */
export const worldOnboardingConfig = {
  centralFoundingPoint: { ...BAKED_START.centralFoundingPoint },
  coastalArrivalPoint: { ...BAKED_START.coastalArrivalPoint },
  initialSupplyRoute: BAKED_START.initialSupplyRoute.map((point) => ({ ...point })),
  futureHarborCandidate: {
    position: { ...BAKED_START.futureHarborCandidate.position },
    waterAccess: { ...BAKED_START.futureHarborCandidate.waterAccess },
    regionId: BAKED_START.futureHarborCandidate.regionId as RegionId,
  },
  score: { ...BAKED_START.score },
} as const;

/** Schwerpunkt der realen Hauptlandmasse für Kartenübersicht und Minimap. */
export const worldOverviewCenter = { ...BAKED_WORLD.islandCenter } as const;

/**
 * Terrain jeder Welt-Kachel — die EINE Quelle des Kacheltyps, aus dem
 * gebackenen Insel-Grid. Außerhalb der Welt: offener Ozean (`water`), damit
 * alle Abfragen total bleiben.
 */
export function terrainAt(x: number, y: number): TerrainType {
  if (x < 0 || y < 0 || x >= WORLD_TILES || y >= WORLD_TILES) return 'water';
  return TERRAIN_IDS[terrainGrid[y * WORLD_TILES + x]!] as TerrainType;
}

/**
 * Region-Zugehörigkeit jeder Welt-Kachel (§ Welt 2.0): 1..REGION_COUNT, 0 für
 * Ozean und alles außerhalb der Welt.
 */
export function regionIdAt(x: number, y: number): RegionId {
  if (x < 0 || y < 0 || x >= WORLD_TILES || y >= WORLD_TILES) return 0;
  return regionGrid[y * WORLD_TILES + x]!;
}

/** Synchron ladbare, deterministische Oberfläche derselben Bake-Quelle. */
export interface BakedSurfaceCell {
  height: number;
  slope: number;
  buildable: boolean;
  water: boolean;
  cliff: boolean;
  coast: boolean;
  waterfront: boolean;
  shoreType: (typeof SHORE_TYPES)[number];
}

export function bakedSurfaceAt(x: number, y: number): BakedSurfaceCell {
  if (x < 0 || y < 0 || x >= WORLD_TILES || y >= WORLD_TILES) {
    return {
      height: -3,
      slope: 0,
      buildable: false,
      water: true,
      cliff: false,
      coast: false,
      waterfront: false,
      shoreType: 'none',
    };
  }
  const offset = y * WORLD_TILES + x;
  const flags = buildabilityGrid[offset]!;
  return {
    height: surfaceHeightGrid[offset]! / SURFACE_HEIGHT_SCALE,
    slope: surfaceSlopeGrid[offset]! / SURFACE_SLOPE_SCALE,
    buildable: (flags & BUILDABLE_BIT) !== 0,
    water: (flags & WATER_BIT) !== 0,
    cliff: (flags & CLIFF_BIT) !== 0,
    coast: (flags & COAST_BIT) !== 0,
    waterfront: (flags & WATERFRONT_BIT) !== 0,
    shoreType: SHORE_TYPES[shoreTypeGrid[offset] ?? 0] ?? 'none',
  };
}

// Lazy berechnete Bounding-Boxen je Region (ein Scan über das Grid, danach
// gecacht) — für Suchen innerhalb einer Region (z. B. Distrikt-Zentrum) ohne
// die Kachellisten im Bundle zu verdoppeln.
let regionBoundsCache: Map<RegionId, { minX: number; minY: number; maxX: number; maxY: number }> | undefined;

export function regionBounds(id: RegionId): { minX: number; minY: number; maxX: number; maxY: number } | undefined {
  if (!regionBoundsCache) {
    regionBoundsCache = new Map();
    for (let y = 0; y < WORLD_TILES; y++) {
      for (let x = 0; x < WORLD_TILES; x++) {
        const r = regionGrid[y * WORLD_TILES + x]!;
        if (r === 0) continue;
        const b = regionBoundsCache.get(r);
        if (!b) regionBoundsCache.set(r, { minX: x, minY: y, maxX: x, maxY: y });
        else {
          if (x < b.minX) b.minX = x;
          if (x > b.maxX) b.maxX = x;
          if (y < b.minY) b.minY = y;
          if (y > b.maxY) b.maxY = y;
        }
      }
    }
  }
  return regionBoundsCache.get(id);
}
