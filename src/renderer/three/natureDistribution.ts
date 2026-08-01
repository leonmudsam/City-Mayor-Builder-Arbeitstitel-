// Verteilung der Naturprops über eine Region (§ Natur-Overhaul 14.0).
//
// DIES IST DIE EINZIGE INSTANZ, die entscheidet, wo etwas wächst. Renderer und
// Tests rufen dieselbe Funktion — eine Messung, die den Aufbau nachbaut statt
// ihn zu benutzen, misst früher oder später etwas anderes als das Spiel zeigt
// (die Lehre aus D-042, dort für Bake-Reparatur und Bake-Kennzahl).
//
// Das Modul ist bewusst frei von `three`/`react`: es liefert nur Listen von
// Kachelpositionen samt Zone und Größe. Wie daraus Geometrie wird, ist Sache des
// Renderers.

import type { TerrainType } from '../../game/types.ts';
import { BAKED_REGIONS, regionBounds, regionIdAt } from '../../game/config/startRegion.config.ts';
import {
  PROP_BUDGET_REFERENCE_TILES,
  propClusterWeight,
  regionPropBudget,
  selectPropTiles,
  type PropKind,
} from './vegetationBudget.ts';
import {
  NATURE_KINDS,
  NATURE_TUNING,
  classifyNatureZone,
  shouldSpawn,
  spawnScale,
  type NatureKind,
  type NatureZone,
} from './natureZones.ts';
import {
  SMALL_ISLAND_MAX_TILES,
  cliffDistanceAt,
  forestDensityAt,
  landMassSizeAt,
  shoreTypeAt,
  surfaceSlopeAt,
} from './worldSurfaceMasks.ts';
import { coastDistanceGrid } from './worldMasks.gen.ts';
import { regionVisualProfile } from './worldVisualProfiles.ts';
import { WORLD_TILES } from '../../game/config/world/islandTerrain.gen.ts';

/** Eine gesetzte Naturinstanz. */
export interface NatureInstance {
  x: number;
  y: number;
  zone: NatureZone;
  /** Größe aus dem Zonenband — der Hebel gegen „alles gleich groß". */
  scale: number;
}

export type NaturePlacement = Record<NatureKind, NatureInstance[]>;

export function emptyPlacement(): NaturePlacement {
  const result = {} as NaturePlacement;
  for (const kind of NATURE_KINDS) result[kind] = [];
  return result;
}

export interface NatureDistributionOptions {
  /** Terrain der Kachel (der Renderer reicht die State-Sicht inkl. Overrides durch). */
  terrainAt: (x: number, y: number) => TerrainType;
  /** Bodenhöhe der Kachelmitte. */
  heightAt: (x: number, y: number) => number;
  /** Ist die Kachel von Stadt/Straße belegt? Dort wächst nie etwas. */
  isOccupied?: ((x: number, y: number) => boolean) | undefined;
  /**
   * Dichtefaktor 0..1 für die Gründungslichtung der Startregion. Der Renderer
   * reicht `starterNatureFrame` durch; Tests dürfen ihn weglassen.
   */
  clearing?: ((x: number, y: number) => number) | undefined;
  /** Budgetskalierung der Grafikstufe (`scaledBudget` des aktiven Profils). */
  scaleBudget?: ((base: number) => number) | undefined;
  /**
   * Dichtefaktor der ganzen Region (1 = voll). Gesperrte Regionen werden damit
   * ausgedünnt gezeigt statt verdeckt.
   */
  densityScale?: number | undefined;
}

const isWaterTerrain = (terrain: TerrainType): boolean => terrain === 'water' || terrain === 'river';

/** Arten, die dem Steincluster folgen statt dem Waldcluster. */
const ROCK_KINDS = new Set<NatureKind>(['rock', 'boulder', 'cliffRock', 'scree', 'shoreRock']);

/**
 * Zone einer einzelnen Kachel. Öffentlich, weil sowohl der Renderer (für die
 * Bodenwirkung) als auch die Tests sie einzeln abfragen.
 */
export function natureZoneAt(
  x: number,
  y: number,
  terrain: TerrainType,
  height: number,
  terrainAt: (tx: number, ty: number) => TerrainType,
): NatureZone {
  const freshwaterAdjacent =
    terrainAt(x + 1, y) === 'river' || terrainAt(x - 1, y) === 'river'
    || terrainAt(x, y + 1) === 'river' || terrainAt(x, y - 1) === 'river'
    || terrainAt(x + 1, y) === 'water' || terrainAt(x - 1, y) === 'water'
    || terrainAt(x, y + 1) === 'water' || terrainAt(x, y - 1) === 'water';
  const landMassSize = landMassSizeAt(x, y);
  return classifyNatureZone({
    terrain,
    height,
    slope: surfaceSlopeAt(x, y),
    forestDensity: forestDensityAt(x, y),
    coastDistance: coastDistanceGrid[y * WORLD_TILES + x] ?? 255,
    cliffDistance: cliffDistanceAt(x, y),
    shoreType: shoreTypeAt(x, y),
    landMassSize,
    freshwaterAdjacent,
    smallIsland: landMassSize > 0 && landMassSize <= SMALL_ISLAND_MAX_TILES,
  });
}

/**
 * Sammelt alle Naturinstanzen einer Region und deckelt sie je Art auf das
 * Regionsbudget. Die Auswahl hängt ausschließlich an Art, Region und
 * Kachelposition — nie am Unlock-Zustand oder an einer Laufzeitreihenfolge
 * (§16 gilt unverändert weiter).
 */
export function collectRegionNature(
  regionId: number,
  options: NatureDistributionOptions,
): NaturePlacement {
  const result = emptyPlacement();
  const bounds = regionBounds(regionId);
  if (!bounds) return result;
  const scaleBudget = options.scaleBudget ?? ((base: number) => base);
  // Steine sollen NICHT dieselben Gruppen bilden wie Bäume — sonst liegt jeder
  // Findling im Waldstück. Ein zweites Clusterfeld mit eigenem Salz trennt sie.
  const rockSalt = regionId * 977 + 13;
  // §6: Der visuelle Regionscharakter kommt DIREKT aus der kanonischen Tabelle,
  // nicht über die Aufrufer — sonst könnten Renderer und Test unterschiedliche
  // Landschaften beschreiben.
  const character = regionVisualProfile(regionId)?.vegetation;

  for (let y = bounds.minY; y <= bounds.maxY; y++) {
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      if (regionIdAt(x, y) !== regionId) continue;
      if (options.isOccupied?.(x, y)) continue;
      const terrain = options.terrainAt(x, y);
      if (isWaterTerrain(terrain)) continue;
      const clearing = options.clearing?.(x, y) ?? 1;
      // Der unmittelbare Gründungsplatz bleibt frei — dort baut der Spieler.
      if (clearing <= 0.03) continue;
      const height = options.heightAt(x, y);
      const zone = natureZoneAt(x, y, terrain, height, options.terrainAt);
      const treeCluster = propClusterWeight(x, y, regionId, NATURE_TUNING.clusterSize);
      const rockCluster = propClusterWeight(x, y, rockSalt, NATURE_TUNING.clusterSize);
      for (const kind of NATURE_KINDS) {
        const cluster = ROCK_KINDS.has(kind) ? rockCluster : treeCluster;
        // Die Lichtung wirkt als Dichtefaktor auf das Clusterfeld: außen volle
        // Natur, innen ein ruhiger, aber nicht toter Bauplatz.
        const damped = clearing >= 1 ? cluster : cluster * clearing;
        if (!shouldSpawn({
          kind, zone, terrain, x, y, cluster: damped, height,
          regionSalt: regionId, character, densityScale: options.densityScale,
        })) continue;
        result[kind].push({ x, y, zone, scale: spawnScale(kind, zone, x, y) });
      }
    }
  }

  const regionTiles = BAKED_REGIONS[regionId - 1]?.tiles ?? PROP_BUDGET_REFERENCE_TILES;
  for (const kind of NATURE_KINDS) {
    const budget = scaleBudget(regionPropBudget(kind as PropKind, regionTiles));
    const list = result[kind];
    if (list.length <= budget) continue;
    const keep = new Set(
      selectPropTiles(`${kind}:${regionId}`, list, budget).map((tile) => `${tile.x},${tile.y}`),
    );
    result[kind] = list.filter((instance) => keep.has(`${instance.x},${instance.y}`));
  }
  return result;
}
