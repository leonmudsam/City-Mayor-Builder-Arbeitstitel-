// Welt-Zugriff (Schema v11, § MVP4 Welt-Neuaufbau · § Welt 2.0 Regionen / Slim-Save).
//
// Kacheln sind ABGELEITET, nicht gespeichert: Terrain kommt deterministisch aus
// dem gebackenen Insel-Grid (`terrainAt`) plus sparse `terrainOverrides`
// (Debug/Tests), die Region-Zugehörigkeit aus `regionIdAt`, die
// Gebäude-Belegung aus einem Laufzeit-Index über `state.buildings`. Saves
// enthalten dadurch nur Region-Stubs statt 147.456 Kachel-Objekten
// (docs/SAVE_MIGRATION.md). Mutationen der Belegung laufen ausschließlich über
// `occupyTiles`/`clearTiles`; der Index wird beim Laden einmal aus den
// Gebäuden aufgebaut (`rebuildOccupancyIndex`).

import {
  BAKED_REGIONS,
  WORLD_TILES,
  bakedSurfaceAt,
  regionBounds,
  regionIdAt,
  startRegionConfig,
  terrainAt,
} from '../config/startRegion.config.ts';
import type { GameConfig } from '../config/index.ts';
import type { GameState, RegionId, RegionState, ResourceId, TerrainType, TileState } from '../types.ts';

// ---- Belegungs-Index (Laufzeit, nie serialisiert) ---------------------------

// WeakMap statt Feld am GameState: JSON.stringify(state) bleibt schlank, der
// Index lebt und stirbt mit dem State-Objekt.
const occupancy = new WeakMap<GameState, Map<string, string>>();

function occupancyOf(state: GameState): Map<string, string> {
  let map = occupancy.get(state);
  if (!map) {
    map = new Map();
    occupancy.set(state, map);
  }
  return map;
}

/** Baut den Belegungs-Index komplett aus `state.buildings` neu auf (Load/Reset). */
export function rebuildOccupancyIndex(state: GameState, config: GameConfig): void {
  const map = new Map<string, string>();
  for (const b of Object.values(state.buildings)) {
    const def = config.buildings.get(b.defId);
    if (!def) continue;
    for (let dy = 0; dy < def.size.h; dy++) {
      for (let dx = 0; dx < def.size.w; dx++) map.set(`${b.x + dx},${b.y + dy}`, b.id);
    }
  }
  occupancy.set(state, map);
}

/** Markiert ein Footprint-Rechteck als von `buildingId` belegt. */
export function occupyTiles(state: GameState, x: number, y: number, w: number, h: number, buildingId: string): void {
  const map = occupancyOf(state);
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) map.set(`${x + dx},${y + dy}`, buildingId);
  }
}

/** Gibt ein Footprint-Rechteck frei (nur wenn es `buildingId` gehört). */
export function clearTiles(state: GameState, x: number, y: number, w: number, h: number, buildingId: string): void {
  const map = occupancyOf(state);
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const key = `${x + dx},${y + dy}`;
      if (map.get(key) === buildingId) map.delete(key);
    }
  }
}

// ---- Terrain & Kachel-Sicht -------------------------------------------------

/** Terrain einer Kachel inkl. sparse Overrides (Debug/Tests, § v10). */
export function worldTerrainAt(state: GameState, x: number, y: number): TerrainType {
  return state.world.terrainOverrides?.[`${x},${y}`] ?? terrainAt(x, y);
}

/** Setzt einen sparse Terrain-Override (Debug/Tests). */
export function overrideTerrain(state: GameState, x: number, y: number, terrain: TerrainType): void {
  (state.world.terrainOverrides ??= {})[`${x},${y}`] = terrain;
}

/**
 * Abgeleitete Kachel-Sicht (§ Slim-Save): Terrain aus dem Insel-Grid,
 * Belegung aus dem Laufzeit-Index. `undefined` außerhalb der Weltgrenzen —
 * Schreiben auf das Ergebnis hat KEINE Wirkung (occupyTiles/clearTiles nutzen).
 */
export function tileAt(state: GameState, x: number, y: number): TileState | undefined {
  if (x < 0 || y < 0 || x >= WORLD_TILES || y >= WORLD_TILES) return undefined;
  const buildingId = occupancyOf(state).get(`${x},${y}`);
  return buildingId !== undefined
    ? { terrain: worldTerrainAt(state, x, y), buildingId }
    : { terrain: worldTerrainAt(state, x, y) };
}

const UNBUILDABLE: ReadonlySet<string> = new Set(['river', 'water', 'mountain']);

/**
 * Sparse Terrain-Overrides sind ein expliziter Debug-/Testkanal. Ein bebaubarer
 * Override bildet deshalb eine ebene virtuelle Arbeitsfläche und entkoppelt
 * Gameplay-Tests von der jeweils neu gebackenen Inselgeometrie. Normales Spiel
 * und Saves ohne Overrides lesen weiterhin ausschließlich die Bake-Daten.
 */
function isFlatDebugSurface(state: GameState, x: number, y: number): boolean {
  const terrain = state.world.terrainOverrides?.[`${x},${y}`];
  return terrain !== undefined && !UNBUILDABLE.has(terrain);
}

function placementHeightAt(state: GameState, x: number, y: number): number {
  return isFlatDebugSurface(state, x, y) ? 0 : bakedSurfaceAt(x, y).height;
}

export function isTerrainBuildable(t: TileState): boolean {
  return !UNBUILDABLE.has(t.terrain);
}

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

/** Zentrale, rendererfreie Footprint-Abfrage für Bauvorschau und Commands. */
export interface PlacementSurfaceSample {
  minHeight: number;
  maxHeight: number;
  averageHeight: number;
  /** Größtes gebackenes Höhendelta zu einer orthogonalen Nachbarkachel. */
  slope: number;
  normal: Vector3Like;
  terrainType: TerrainType;
  /** Häufigste Region im Footprint; 0 bei Ozean/außerhalb. */
  regionId: RegionId;
  waterOverlap: number;
  cliffOverlap: number;
  waterfrontRatio: number;
  shoreTypes: ReadonlySet<string>;
  buildableRatio: number;
}

export function samplePlacementSurface(
  state: GameState,
  x: number,
  y: number,
  width: number,
  height: number,
): PlacementSurfaceSample {
  let minHeight = Infinity;
  let maxHeight = -Infinity;
  let heightSum = 0;
  let slope = 0;
  let water = 0;
  let cliff = 0;
  let buildable = 0;
  let waterfront = 0;
  let samples = 0;
  const terrainCounts = new Map<TerrainType, number>();
  const regionCounts = new Map<RegionId, number>();
  const shoreTypes = new Set<string>();

  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const tx = x + dx;
      const ty = y + dy;
      const surface = bakedSurfaceAt(tx, ty);
      const terrain = worldTerrainAt(state, tx, ty);
      const terrainBuildable = !UNBUILDABLE.has(terrain);
      const flatDebugSurface = isFlatDebugSurface(state, tx, ty);
      const regionId = flatDebugSurface ? startRegionConfig.startRegionId : regionIdAt(tx, ty);
      const sampleHeight = flatDebugSurface ? 0 : surface.height;
      minHeight = Math.min(minHeight, sampleHeight);
      maxHeight = Math.max(maxHeight, sampleHeight);
      heightSum += sampleHeight;
      slope = Math.max(slope, flatDebugSurface ? 0 : surface.slope);
      if ((!flatDebugSurface && surface.water) || terrain === 'water' || terrain === 'river') water++;
      if ((!flatDebugSurface && surface.cliff) || terrain === 'mountain') cliff++;
      if (!flatDebugSurface && surface.waterfront) waterfront++;
      if (!flatDebugSurface && surface.shoreType !== 'none') shoreTypes.add(surface.shoreType);
      if ((flatDebugSurface || surface.buildable) && terrainBuildable && regionId !== 0) buildable++;
      terrainCounts.set(terrain, (terrainCounts.get(terrain) ?? 0) + 1);
      regionCounts.set(regionId, (regionCounts.get(regionId) ?? 0) + 1);
      samples++;
    }
  }

  const dominantTerrain = [...terrainCounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? 'water';
  const dominantRegion = [...regionCounts].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? 0;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const dx = placementHeightAt(state, Math.floor(centerX + 1), Math.floor(centerY)) - placementHeightAt(state, Math.floor(centerX - 1), Math.floor(centerY));
  const dz = placementHeightAt(state, Math.floor(centerX), Math.floor(centerY + 1)) - placementHeightAt(state, Math.floor(centerX), Math.floor(centerY - 1));
  const length = Math.hypot(dx * 0.5, 1, dz * 0.5);

  return {
    minHeight: samples > 0 ? minHeight : -3,
    maxHeight: samples > 0 ? maxHeight : -3,
    averageHeight: samples > 0 ? heightSum / samples : -3,
    slope,
    normal: { x: (-dx * 0.5) / length, y: 1 / length, z: (-dz * 0.5) / length },
    terrainType: dominantTerrain,
    regionId: dominantRegion,
    waterOverlap: samples > 0 ? water / samples : 1,
    cliffOverlap: samples > 0 ? cliff / samples : 0,
    waterfrontRatio: samples > 0 ? waterfront / samples : 0,
    shoreTypes,
    buildableRatio: samples > 0 ? buildable / samples : 0,
  };
}

// ---- Regionen (§ Welt 2.0: Landschaften statt Quadrat-Sektoren) -------------

/** Alle gebackenen Region-Ids (1..REGION_COUNT). */
export function allRegionIds(): RegionId[] {
  return BAKED_REGIONS.map((r) => r.id);
}

/** Region-Stub (nur Fortschritt — Geometrie kommt aus dem Bake). */
export function createRegionStub(id: RegionId): RegionState {
  return { id, districtId: 'main', status: 'locked' };
}

/** Region-Fortschritt der Kachel (`undefined` auf Ozean/außerhalb). */
export function regionOfTile(state: GameState, x: number, y: number): RegionState | undefined {
  const id = isFlatDebugSurface(state, x, y) ? startRegionConfig.startRegionId : regionIdAt(x, y);
  return id === 0 ? undefined : state.world.regions[String(id)];
}

/** Gebackene Nachbarschaft: grenzt die Region an eine freigeschaltete an? */
export function isRegionAdjacentToUnlocked(state: GameState, id: RegionId): boolean {
  const baked = BAKED_REGIONS[id - 1];
  if (!baked) return false;
  return baked.adjacent.some((n) => state.world.regions[String(n)]?.status === 'unlocked');
}

/** Grenzt die Region über eine schmale Wasserstraße an eine freigeschaltete an? */
export function isRegionSeaAdjacentToUnlocked(state: GameState, id: RegionId): boolean {
  const baked = BAKED_REGIONS[id - 1];
  if (!baked) return false;
  return baked.seaAdjacent.some((n) => state.world.regions[String(n)]?.status === 'unlocked');
}

/** Gebäude-Ids, die als betriebsbereiter Hafen für eine Seeerschließung zählen. */
const HARBOR_DEF_IDS = new Set(['dock_small', 'river_port']);

/**
 * Besitzt die Stadt einen fertigen Hafen in einer freigeschalteten Region?
 * § Final World Compaction 8.1: Seeerschließungen verlangen echte
 * Hafeninfrastruktur — kein erfundener Fährdienst, sondern die vorhandenen
 * Gebäude `dock_small`/`river_port` im aktiven Zustand.
 */
export function hasOperationalHarbor(state: GameState): boolean {
  for (const building of Object.values(state.buildings)) {
    if (!HARBOR_DEF_IDS.has(building.defId) || building.status !== 'active') continue;
    const region = regionOfTile(state, building.x, building.y);
    if (region?.status === 'unlocked') return true;
  }
  return false;
}

/** Warum eine Region gerade nicht erschlossen werden kann (oder `undefined`). */
export type RegionUnlockBlocker = 'not_adjacent' | 'needs_harbor';

/**
 * Erschließbarkeit einer Region aus Geografie und Infrastruktur.
 *
 * Die final verdichtete Insel ist ein Archipel: Fünf Regionen hängen über Land
 * zusammen, alle übrigen nur über eine schmale Wasserstraße. Eine seeseitige
 * Nachbarschaft allein genügt deshalb nicht — die Stadt braucht zusätzlich einen
 * betriebsbereiten Hafen. Reine Leseprüfung ohne State-Mutation.
 */
export function regionUnlockBlocker(state: GameState, id: RegionId): RegionUnlockBlocker | undefined {
  if (isRegionAdjacentToUnlocked(state, id)) return undefined;
  if (!isRegionSeaAdjacentToUnlocked(state, id)) return 'not_adjacent';
  return hasOperationalHarbor(state) ? undefined : 'needs_harbor';
}

/** Freischaltkosten einer Region aus ihrer Definition (§ Welt 2.0). */
export function regionUnlockCost(config: GameConfig, id: RegionId): number {
  return config.regions.get(id)?.unlockCost ?? 0;
}

// Produzierte Ressource → Schlüssel in `productionModifiers` (§ Welt 2.0:
// Regionscharakter). `energy` ist eine Kapazität, keine produzierte Ressource,
// und hat daher keinen Produktions-Modifikator.
const RESOURCE_TO_MODIFIER: Partial<Record<ResourceId, 'wood' | 'stone' | 'food' | 'water'>> = {
  wood: 'wood',
  stone: 'stone',
  food: 'food',
  freshwater: 'water',
};

/**
 * Regionsabhängiger Produktions-Faktor an einer Kachel (§ Welt 2.0: Vor-/
 * Nachteile). 1 = neutral (Ozean/außerhalb/kein Modifikator). Z. B. Wald +40 %
 * Holz, Fruchtdelta +35 % Nahrung, Hochgebirge −40 % Nahrung.
 */
export function regionProductionFactorAt(
  config: GameConfig,
  x: number,
  y: number,
  resource: ResourceId,
): number {
  const id = regionIdAt(x, y);
  if (id === 0) return 1;
  const key = RESOURCE_TO_MODIFIER[resource];
  if (!key) return 1;
  return config.regions.get(id)?.productionModifiers?.[key] ?? 1;
}

/**
 * Straßenkosten-Faktor einer Region (§ Welt 2.0: teurere Straßen im Gebirge).
 * 1 = normal. Greift beim Bau von Straßen in der Region (placeBuilding).
 */
export function regionRoadCostFactorAt(config: GameConfig, x: number, y: number): number {
  const id = regionIdAt(x, y);
  if (id === 0) return 1;
  return config.regions.get(id)?.roadCostFactor ?? 1;
}

/**
 * True, wenn die Region laut Bake-Statistik Kacheln dieses Terrains enthält
 * (Biom-Erkennung, z. B. Fluss für die Distrikt-Gründung). Sparse
 * Terrain-Overrides (Debug) werden bewusst ignoriert.
 */
export function regionHasTerrain(id: RegionId, terrain: TerrainType): boolean {
  const baked = BAKED_REGIONS[id - 1];
  return baked !== undefined && baked.terrain[terrain] > 0;
}

/**
 * Find a buildable `size × size` block inside a region for a district centre,
 * preferring a spot on the riverfront (a river tile within Chebyshev size+1).
 * Returns the world-tile top-left corner, or undefined if the region has no
 * room. Used by the found-district project (§8).
 */
export function findDistrictCenterSpot(
  state: GameState,
  regionId: RegionId,
  size: number,
): { x: number; y: number } | undefined {
  const bounds = regionBounds(regionId);
  if (!bounds) return undefined;
  const inRegion = (x: number, y: number): boolean => regionIdAt(x, y) === regionId;
  const blockOk = (x: number, y: number): boolean => {
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        if (!inRegion(x + dx, y + dy)) return false;
        const t = tileAt(state, x + dx, y + dy);
        if (!t || !isTerrainBuildable(t) || t.buildingId !== undefined) return false;
      }
    }
    return true;
  };
  // Fluss-Kacheln der Region einmal einsammeln (statt O(n²) je Kandidat).
  const riverTiles: { x: number; y: number }[] = [];
  for (let y = bounds.minY; y <= bounds.maxY; y++) {
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      if (inRegion(x, y) && worldTerrainAt(state, x, y) === 'river') riverTiles.push({ x, y });
    }
  }
  const nearRiver = (x: number, y: number): boolean => {
    const cx = x + (size - 1) / 2;
    const cy = y + (size - 1) / 2;
    return riverTiles.some((r) => Math.max(Math.abs(r.x - cx), Math.abs(r.y - cy)) <= size + 1);
  };
  let fallback: { x: number; y: number } | undefined;
  for (let y = bounds.minY; y <= bounds.maxY - size + 1; y++) {
    for (let x = bounds.minX; x <= bounds.maxX - size + 1; x++) {
      if (!blockOk(x, y)) continue;
      const spot = { x, y };
      if (nearRiver(x, y)) return spot;
      fallback ??= spot;
    }
  }
  return fallback;
}

/**
 * Road connectivity: flood fill over road tiles, seeded by roads orthogonally
 * adjacent to the town hall (or a district center). Returns the set of
 * connected road tile keys "x,y".
 */
export function computeRoadNetwork(state: GameState, config: GameConfig): Set<string> {
  const roads = new Set<string>();
  const seeds: string[] = [];
  const centerFootprints: { x: number; y: number; w: number; h: number }[] = [];

  for (const district of Object.values(state.world.districts)) {
    const center = state.buildings[district.centerBuildingId];
    if (!center) continue;
    const def = config.buildings.get(center.defId);
    if (def) centerFootprints.push({ x: center.x, y: center.y, w: def.size.w, h: def.size.h });
  }

  for (const b of Object.values(state.buildings)) {
    if (config.buildings.get(b.defId)?.category !== 'roads') continue;
    const key = `${b.x},${b.y}`;
    roads.add(key);
    const nextToCenter = centerFootprints.some(
      (f) => b.x >= f.x - 1 && b.x <= f.x + f.w && b.y >= f.y - 1 && b.y <= f.y + f.h &&
        // orthogonal adjacency only: inside the expanded box but not a diagonal corner
        !((b.x === f.x - 1 || b.x === f.x + f.w) && (b.y === f.y - 1 || b.y === f.y + f.h)),
    );
    if (nextToCenter) seeds.push(key);
  }

  const connected = new Set<string>(seeds);
  const queue = [...seeds];
  while (queue.length > 0) {
    const key = queue.pop() as string;
    const [x, y] = key.split(',').map(Number) as [number, number];
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nKey = `${x + dx},${y + dy}`;
      if (roads.has(nKey) && !connected.has(nKey)) {
        connected.add(nKey);
        queue.push(nKey);
      }
    }
  }
  return connected;
}
