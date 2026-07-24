import type { GameConfig } from '../config/index.ts';
import type { BuildingDef } from '../config/types.ts';
import type { GameState } from '../types.ts';
import type { Derived } from '../simulation/derived.ts';
import { isTerrainBuildable, regionOfTile, samplePlacementSurface, tileAt } from '../map/world.ts';
import { unlockedBuildings } from '../progression/levels.ts';
import { buildLimitAt, countOf } from './limits.ts';
import {
  BUILDABILITY_WORLD_TILES,
  WATER_DEPTH_SCALE,
  waterDepthGrid,
} from '../config/world/islandBuildability.gen.ts';

export type BuildingRotation = 0 | 90 | 180 | 270;

export interface WaterfrontPlacementPreview {
  valid: boolean;
  suggestedRotation: BuildingRotation;
  waterCells: { x: number; y: number }[];
  minimumDepth: number;
  roadAccess: boolean;
  reason?: PlacementError;
}

export type PlacementError =
  | 'locked_building'
  | 'unique_exists'
  | 'limit_reached'
  | 'out_of_bounds'
  | 'region_locked'
  | 'terrain'
  | 'occupied'
  | 'needs_road'
  | 'needs_water';

export interface PlacementOptions {
  /** Set when relocating an existing building: its own tiles don't block,
   *  and unlock/unique checks are skipped (it already exists). */
  ignoreBuildingId?: string;
  /** Für Wasser-Footprints ist die Ausrichtung Teil der Validierung. */
  rotation?: BuildingRotation;
}

export function validatePlacement(
  state: GameState,
  config: GameConfig,
  derived: Derived,
  def: BuildingDef,
  x: number,
  y: number,
  options?: PlacementOptions,
): PlacementError | undefined {
  const moving = options?.ignoreBuildingId;
  if (!moving) {
    if (def.buildable === false) return 'locked_building';
    if (def.unlockLevel > state.level.current || (def.unlockLevel > 1 && !unlockedBuildings(config, state.level.current).has(def.id))) {
      return 'locked_building';
    }
    if (def.unique && Object.values(state.buildings).some((b) => b.defId === def.id)) return 'unique_exists';
    const cap = buildLimitAt(def, state.level.current);
    if (cap !== undefined && countOf(state, def.id) >= cap) return 'limit_reached';
  }

  const surface = samplePlacementSurface(state, x, y, def.size.w, def.size.h);
  const heightDelta = surface.maxHeight - surface.minHeight;
  if (def.category === 'roads') {
    // Straßen-Bauklasse (§ Infrastruktur 2.0 / I1, D-036): eine Bodenstraße
    // (`def.road` fehlt) darf sanfte Hänge nutzen, aber weder Wasser noch
    // Klippen; eine Höhenstraße/Brücke (`def.road.crossesWater`/`crossesCliff`,
    // höheres `maxSlope`) überwindet genau diese Hindernisse. Deck/Pfeiler sind
    // reine Renderer-Darstellung — hier zählt nur, ob das Terrain überbaubar ist.
    const rc = def.road;
    const maxSlope = rc?.maxSlope ?? 0.8;
    const waterBlocked = surface.waterOverlap > 0 && rc?.crossesWater !== true;
    const cliffBlocked = surface.cliffOverlap > 0 && rc?.crossesCliff !== true;
    if (waterBlocked || cliffBlocked || surface.slope > maxSlope) return 'terrain';
  } else if (
    surface.buildableRatio < 1 ||
    surface.waterOverlap > 0 ||
    surface.cliffOverlap > 0 ||
    heightDelta > 0.85
  ) {
    return 'terrain';
  }

  const roadClass = def.category === 'roads' ? def.road : undefined;
  for (let dy = 0; dy < def.size.h; dy++) {
    for (let dx = 0; dx < def.size.w; dx++) {
      const tile = tileAt(state, x + dx, y + dy);
      if (!tile) return 'out_of_bounds';
      // Eine Brücke/ein Viadukt überspannt die eigentliche Wasser-/Klippenkachel.
      // Solche Kacheln gehören keiner freischaltbaren Region an (Wasser = Region 0)
      // und sind nicht „bebaubar" — für die überbrückte Kachel entfallen deshalb
      // Regions- und Bebaubarkeitsprüfung. Land unter einer Höhenstraße bleibt
      // regionspflichtig, sodass man nicht in gesperrtes Gebiet hineinbaut.
      const bridgesWater =
        roadClass?.crossesWater === true && (tile.terrain === 'water' || tile.terrain === 'river');
      const bridgesCliff = roadClass?.crossesCliff === true && tile.terrain === 'mountain';
      const spanned = bridgesWater || bridgesCliff;
      if (!spanned) {
        const region = regionOfTile(state, x + dx, y + dy);
        if (!region || region.status !== 'unlocked') return 'region_locked';
        if (!isTerrainBuildable(tile)) return 'terrain';
      }
      if (tile.buildingId && tile.buildingId !== moving) return 'occupied';
    }
  }

  if (def.category === 'roads' && !roadWouldConnect(state, config, derived, x, y)) return 'needs_road';
  if (def.adjacentTerrain && !touchesTerrain(state, def, x, y, def.adjacentTerrain)) return 'needs_water';
  if (def.waterfront) {
    const waterError = validateWaterfrontFootprint(
      state,
      config,
      def,
      x,
      y,
      options?.rotation ?? 0,
      moving,
    );
    if (waterError) return waterError;
  }
  return undefined;
}

/** Wasserrechteck vor dem Kai. Bei 0° liegt Wasser auf −Z, Landzugang auf +Z. */
export function waterfrontWaterCells(
  def: BuildingDef,
  x: number,
  y: number,
  rotation: BuildingRotation,
): { x: number; y: number }[] {
  const footprint = def.waterfront;
  if (!footprint) return [];
  const cells: { x: number; y: number }[] = [];
  const offsetX = Math.floor((def.size.w - footprint.waterWidth) / 2);
  const offsetY = Math.floor((def.size.h - footprint.waterWidth) / 2);
  for (let depth = 1; depth <= footprint.waterDepth; depth++) {
    for (let width = 0; width < footprint.waterWidth; width++) {
      if (rotation === 0) cells.push({ x: x + offsetX + width, y: y - depth });
      else if (rotation === 180) cells.push({ x: x + offsetX + width, y: y + def.size.h - 1 + depth });
      // Front/Land dreht bei 90° nach +X; die Wasserseite liegt gegenüber auf
      // −X. Bei 270° entsprechend Front −X, Wasser +X.
      else if (rotation === 90) cells.push({ x: x - depth, y: y + offsetY + width });
      else cells.push({ x: x + def.size.w - 1 + depth, y: y + offsetY + width });
    }
  }
  return cells;
}

function validateWaterfrontFootprint(
  state: GameState,
  config: GameConfig,
  def: BuildingDef,
  x: number,
  y: number,
  rotation: BuildingRotation,
  ignoreBuildingId?: string,
): PlacementError | undefined {
  const footprint = def.waterfront;
  if (!footprint) return undefined;
  const waterCells = waterfrontWaterCells(def, x, y, rotation);
  let invalidWaterCells = 0;
  for (const cell of waterCells) {
    const tile = tileAt(state, cell.x, cell.y);
    if (!tile) return 'out_of_bounds';
    if (tile.terrain !== 'water' && tile.terrain !== 'river') {
      invalidWaterCells++;
      continue;
    }
    const offset = cell.y * BUILDABILITY_WORLD_TILES + cell.x;
    if ((waterDepthGrid[offset] ?? 0) / WATER_DEPTH_SCALE < footprint.minimumWaterDepth) return 'needs_water';
  }
  const tolerated = Math.floor(waterCells.length * footprint.shorelineTolerance);
  if (invalidWaterCells > tolerated) return 'needs_water';

  // Wasserflächen sind nicht Teil des normalen Occupancy-Index. Deshalb werden
  // ausschließlich die wenigen vorhandenen Waterfront-Gebäude gegengeprüft.
  const wanted = new Set(waterCells.map((cell) => `${cell.x},${cell.y}`));
  for (const building of Object.values(state.buildings)) {
    if (building.id === ignoreBuildingId) continue;
    const otherDef = config.buildings.get(building.defId);
    if (!otherDef?.waterfront) continue;
    const otherCells = waterfrontWaterCells(otherDef, building.x, building.y, building.rotation ?? 0);
    if (otherCells.some((cell) => wanted.has(`${cell.x},${cell.y}`))) return 'occupied';
  }
  return undefined;
}

/**
 * Reine Vorschau mit Küstensnapping: bevorzugte Ausrichtung zuerst, danach die
 * übrigen Himmelsrichtungen. Keine State-Mutation; Controller und Ghost nutzen
 * denselben Vertrag.
 */
export function waterfrontPlacementPreview(
  state: GameState,
  config: GameConfig,
  derived: Derived,
  def: BuildingDef,
  x: number,
  y: number,
  preferredRotation: BuildingRotation = 0,
  ignoreBuildingId?: string,
): WaterfrontPlacementPreview | undefined {
  if (!def.waterfront) return undefined;
  const rotations = [preferredRotation, 0, 90, 180, 270]
    .filter((rotation, index, values) => values.indexOf(rotation) === index) as BuildingRotation[];
  let fallbackReason: PlacementError | undefined;
  for (const rotation of rotations) {
    const reason = validatePlacement(state, config, derived, def, x, y, { rotation, ...(ignoreBuildingId ? { ignoreBuildingId } : {}) });
    fallbackReason ??= reason;
    if (reason) continue;
    const cells = waterfrontWaterCells(def, x, y, rotation);
    const minimumDepth = cells.reduce((minimum, cell) => {
      return Math.min(
        minimum,
        (waterDepthGrid[cell.y * BUILDABILITY_WORLD_TILES + cell.x] ?? 0) / WATER_DEPTH_SCALE,
      );
    }, Number.POSITIVE_INFINITY);
    return {
      valid: true,
      suggestedRotation: rotation,
      waterCells: cells,
      minimumDepth,
      roadAccess: isConnectedToRoad(derived, def, x, y),
    };
  }
  return {
    valid: false,
    suggestedRotation: preferredRotation,
    waterCells: waterfrontWaterCells(def, x, y, preferredRotation),
    minimumDepth: 0,
    roadAccess: isConnectedToRoad(derived, def, x, y),
    ...(fallbackReason ? { reason: fallbackReason } : {}),
  };
}

/** A tile of `terrain` borders the footprint (riverfront/coast rule). */
function touchesTerrain(state: GameState, def: BuildingDef, x: number, y: number, terrain: string): boolean {
  for (let dy = -1; dy <= def.size.h; dy++) {
    for (let dx = -1; dx <= def.size.w; dx++) {
      if (dx >= 0 && dx < def.size.w && dy >= 0 && dy < def.size.h) continue; // skip footprint interior
      if (tileAt(state, x + dx, y + dy)?.terrain === terrain) return true;
    }
  }
  return false;
}

/**
 * Whether a placed building of this footprint at (x,y) borders the connected
 * road network. Exported so the diagnostics layer can flag a building that lost
 * (or never had) road access the same way placement validates it — one source
 * of truth, no parallel check.
 */
export function isConnectedToRoad(derived: Pick<Derived, 'roadNetwork'>, def: BuildingDef, x: number, y: number): boolean {
  return touchesConnectedRoad(derived, def, x, y);
}

/** Any tile orthogonally adjacent to the footprint is a connected road. */
function touchesConnectedRoad(derived: Pick<Derived, 'roadNetwork'>, def: BuildingDef, x: number, y: number): boolean {
  for (let dx = 0; dx < def.size.w; dx++) {
    if (derived.roadNetwork.has(`${x + dx},${y - 1}`) || derived.roadNetwork.has(`${x + dx},${y + def.size.h}`)) return true;
  }
  for (let dy = 0; dy < def.size.h; dy++) {
    if (derived.roadNetwork.has(`${x - 1},${y + dy}`) || derived.roadNetwork.has(`${x + def.size.w},${y + dy}`)) return true;
  }
  return false;
}

/** New road tiles must attach to the network or to a district center. */
function roadWouldConnect(state: GameState, config: GameConfig, derived: Derived, x: number, y: number): boolean {
  const deltas = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;
  if (deltas.some(([dx, dy]) => derived.roadNetwork.has(`${x + dx},${y + dy}`))) return true;
  // Adjacent to a district center footprint (seeds the network)?
  for (const district of Object.values(state.world.districts)) {
    const center = state.buildings[district.centerBuildingId];
    if (!center) continue;
    const def = config.buildings.get(center.defId);
    if (!def) continue;
    const inX = x >= center.x - 1 && x <= center.x + def.size.w;
    const inY = y >= center.y - 1 && y <= center.y + def.size.h;
    const corner = (x === center.x - 1 || x === center.x + def.size.w) && (y === center.y - 1 || y === center.y + def.size.h);
    if (inX && inY && !corner) return true;
  }
  return false;
}
