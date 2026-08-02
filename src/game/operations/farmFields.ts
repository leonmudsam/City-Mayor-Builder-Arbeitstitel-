// § Frühspiel-Audit / D-055 — FELDER STATT FRUCHTBARKEITS-GATE.
//
// Der gemessene Anlass: Die Startregion hat **null** `fertile`-Kacheln. Eine
// dort gebaute Farm ist gültig platziert, zahlt Unterhalt und arbeitet nie,
// weil ihr Betrieb `crop`-Knoten erntet und die ausschließlich auf `fertile`
// liegen. Der Nutzerauftrag: „Kein Fruchtbarkeitsblocker — Farm = Gebäude,
// Felder = Produktionsfläche."
//
// ENTSCHEIDEND für den Entwurf, und der Grund, warum ein Feld KEIN Gebäude ist:
// `isNodeTile` schließt Kacheln unter Gebäuden aus (§26.15). Ein Feldgebäude
// könnte also niemals selbst der Knoten sein. Ein Feld ist deshalb eine
// **bezahlte Geländeänderung**: der Command schreibt `fertile` in die bereits
// vorhandenen, bereits persistierten `world.terrainOverrides`. Ab da liefern
// `isNodeTile`/`deriveNodesInArea` ganz normal `crop`-Knoten — Betrieb,
// Arbeiter, Radius, Lager und Save bleiben unverändert.
//
// Das ist Erweitern statt Neubauen (§2): kein zweites Produktionssystem, kein
// zweiter Knotentyp, kein Schemabruch. Die Effizienz nach Entfernung liefert
// ebenfalls die vorhandene Mechanik — `efficientRadius` gegen `maxRadius` im
// `BuildingOperationProfile`.

import type { GameConfig } from '../config/index.ts';
import type { GameState, TerrainType } from '../types.ts';
import { bakedSurfaceAt, WORLD_TILES } from '../config/startRegion.config.ts';
import { tileAt, worldTerrainAt } from '../map/world.ts';

/** Terrain, das ein Feld tragen darf. Wald wird nicht gerodet, Fels nicht gesprengt. */
const FIELD_BASE_TERRAIN: readonly TerrainType[] = ['grass', 'fertile'];

/** Geldkosten je angelegter Feldkachel. */
export const FIELD_COST_PER_TILE = 260;

export type FieldTileBlocker =
  | 'out_of_world'
  | 'occupied'
  | 'not_buildable'
  | 'wrong_terrain'
  | 'already_field'
  | 'no_farm_in_range';

export interface FieldTilePlan {
  x: number;
  y: number;
  /** `undefined` = anlegbar. */
  blocker?: FieldTileBlocker;
}

export interface FieldPlan {
  tiles: FieldTilePlan[];
  /** Kacheln, die wirklich angelegt werden. */
  plantable: number;
  cost: number;
}

/**
 * Liegt die Kachel im Arbeitsgebiet mindestens einer Farm? Ein Feld ohne Farm
 * wäre eine hübsche Wiese ohne Wirkung — das wird gesagt, nicht gebaut. Der
 * Radius kommt aus derselben `operation.maxRadius`, aus der der Betrieb später
 * seine Arbeiter schickt; eine zweite Reichweitenzahl entsteht nicht.
 */
export function farmInRange(state: GameState, config: GameConfig, x: number, y: number): string | undefined {
  for (const building of Object.values(state.buildings)) {
    const def = config.buildings.get(building.defId);
    if (!def?.operation || def.operation.nodeType !== 'crop') continue;
    const radius = def.operation.maxRadius;
    const minX = building.x - radius;
    const minY = building.y - radius;
    const maxX = building.x + def.size.w - 1 + radius;
    const maxY = building.y + def.size.h - 1 + radius;
    if (x >= minX && x <= maxX && y >= minY && y <= maxY) return building.id;
  }
  return undefined;
}

/** Trägt diese Kachel bereits ein Feld? */
export function isFieldTile(state: GameState, x: number, y: number): boolean {
  return state.world.terrainOverrides?.[`${x},${y}`] === 'fertile';
}

/**
 * Prüft ein Rechteck Kachel für Kachel. Reine Projektion — die Vorschau und der
 * Command lesen dieselbe Funktion, damit die Vorschau nicht grün zeigen kann,
 * was der Command ablehnt (D-048).
 */
export function planFarmField(
  state: GameState,
  config: GameConfig,
  area: { x: number; y: number; w: number; h: number },
): FieldPlan {
  const tiles: FieldTilePlan[] = [];
  let plantable = 0;
  for (let dy = 0; dy < Math.max(0, area.h); dy++) {
    for (let dx = 0; dx < Math.max(0, area.w); dx++) {
      const x = area.x + dx;
      const y = area.y + dy;
      const blocker = fieldBlockerAt(state, config, x, y);
      tiles.push(blocker ? { x, y, blocker } : { x, y });
      if (!blocker) plantable += 1;
    }
  }
  return { tiles, plantable, cost: plantable * FIELD_COST_PER_TILE };
}

function fieldBlockerAt(state: GameState, config: GameConfig, x: number, y: number): FieldTileBlocker | undefined {
  if (x < 0 || y < 0 || x >= WORLD_TILES || y >= WORLD_TILES) return 'out_of_world';
  if (isFieldTile(state, x, y)) return 'already_field';
  if (tileAt(state, x, y)?.buildingId) return 'occupied';
  if (!bakedSurfaceAt(x, y).buildable) return 'not_buildable';
  if (!FIELD_BASE_TERRAIN.includes(worldTerrainAt(state, x, y))) return 'wrong_terrain';
  if (!farmInRange(state, config, x, y)) return 'no_farm_in_range';
  return undefined;
}

/**
 * Legt die geplanten Kacheln an. Gibt die Zahl der geänderten Kacheln zurück;
 * bezahlt wird außerhalb (der Controller hält die Geldbuchung an einer Stelle).
 */
export function applyFarmField(state: GameState, plan: FieldPlan): number {
  const overrides = (state.world.terrainOverrides ??= {});
  let changed = 0;
  for (const tile of plan.tiles) {
    if (tile.blocker) continue;
    overrides[`${tile.x},${tile.y}`] = 'fertile';
    changed += 1;
  }
  return changed;
}

/**
 * Nimmt Feldkacheln zurück. Entfernt wird NUR ein Override, den ein Feld
 * gesetzt hat (`fertile`) — ein Debug-Override auf anderes Terrain bleibt
 * unangetastet, sonst räumte der Rückbau fremde Zustände mit weg.
 */
export function clearFarmField(state: GameState, area: { x: number; y: number; w: number; h: number }): number {
  const overrides = state.world.terrainOverrides;
  if (!overrides) return 0;
  let cleared = 0;
  for (let dy = 0; dy < Math.max(0, area.h); dy++) {
    for (let dx = 0; dx < Math.max(0, area.w); dx++) {
      const key = `${area.x + dx},${area.y + dy}`;
      if (overrides[key] !== 'fertile') continue;
      delete overrides[key];
      cleared += 1;
    }
  }
  return cleared;
}

/** Alle Feldkacheln der Stadt — für Übersicht und Renderer. */
export function farmFieldTiles(state: GameState): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (const [key, terrain] of Object.entries(state.world.terrainOverrides ?? {})) {
    if (terrain !== 'fertile') continue;
    const comma = key.indexOf(',');
    const x = Number.parseInt(key.slice(0, comma), 10);
    const y = Number.parseInt(key.slice(comma + 1), 10);
    if (Number.isInteger(x) && Number.isInteger(y)) out.push({ x, y });
  }
  return out.sort((a, b) => a.y - b.y || a.x - b.x);
}
