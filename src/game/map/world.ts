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
  regionBounds,
  regionIdAt,
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

export function isTerrainBuildable(t: TileState): boolean {
  return !UNBUILDABLE.has(t.terrain);
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
  const id = regionIdAt(x, y);
  return id === 0 ? undefined : state.world.regions[String(id)];
}

/** Gebackene Nachbarschaft: grenzt die Region an eine freigeschaltete an? */
export function isRegionAdjacentToUnlocked(state: GameState, id: RegionId): boolean {
  const baked = BAKED_REGIONS[id - 1];
  if (!baked) return false;
  return baked.adjacent.some((n) => state.world.regions[String(n)]?.status === 'unlocked');
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
