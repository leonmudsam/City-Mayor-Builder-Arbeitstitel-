// Straßenplanung (§ Overhaul 3.0 / C6, §18): reine Vorschau-/Validierungslogik für
// einen gezeichneten Straßenpfad, BEVOR gebaut wird. Kein Sofortbau, keine
// Mutation, keine Abbuchung — die UI (Codex) zeichnet den Pfad, dieses Modul
// liefert pro Kachel Status/Grund/Kosten und die Gesamtsumme, sodass „Kosten erst
// beim Bestätigen" (§18.3) möglich wird. Baut auf denselben Regeln wie
// `validatePlacement` auf (keine zweite Straßenlogik), erweitert sie nur um die
// pfad-bewusste Anschlussprüfung: eine Kachel gilt als verbunden, wenn sie an das
// bestehende Netz ODER an eine frühere, bereits verbundene Pfadkachel grenzt.

import type { GameConfig } from '../config/index.ts';
import type { GameState, ResourceId, TerrainType } from '../types.ts';
import type { Derived } from '../simulation/derived.ts';
import { validatePlacement, type PlacementError } from '../buildings/placement.ts';
import { worldTerrainAt } from '../map/world.ts';
import { regionIdAt } from '../config/startRegion.config.ts';

export type RoadTileStatus = 'ok' | 'bridge' | 'exists' | 'blocked';

export interface RoadPlanTile {
  x: number;
  y: number;
  terrain: TerrainType;
  regionId: number;
  status: RoadTileStatus;
  reason?: PlacementError;
  cost: Partial<Record<ResourceId, number>>;
}

export interface RoadPlanPreview {
  tiles: RoadPlanTile[];
  /** Anzahl NEU zu bauender Kacheln (ohne bereits vorhandene Straßen). */
  buildTiles: number;
  /** Gesamtkosten aller neuen Kacheln. */
  totalCost: Partial<Record<ResourceId, number>>;
  /** Anzahl blockierter Kacheln (ungültiges Terrain/Belegung/kein Anschluss). */
  blocked: number;
  /** true, wenn kein Segment blockiert ist (der Pfad wäre komplett baubar). */
  valid: boolean;
}

const key = (x: number, y: number): string => `${x},${y}`;
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

function addCost(
  into: Partial<Record<ResourceId, number>>,
  from: Partial<Record<ResourceId, number>>,
): void {
  for (const [res, amount] of Object.entries(from)) {
    into[res as ResourceId] = (into[res as ResourceId] ?? 0) + (amount ?? 0);
  }
}

/**
 * Analysiert einen Straßenpfad (schon gerasterte Kachelfolge) rein lesend.
 * `tileCost(x,y)` liefert die Baukosten einer einzelnen Straßenkachel (inkl.
 * Regions-Straßenkostenfaktor) — injiziert, damit dieses Modul die
 * Kostenberechnung des Controllers nutzt statt sie zu duplizieren.
 */
export function analyseRoadPath(
  state: GameState,
  config: GameConfig,
  derived: Derived,
  path: { x: number; y: number }[],
  tileCost: (x: number, y: number) => Partial<Record<ResourceId, number>>,
): RoadPlanPreview {
  const roadDef = config.buildings.get('road');
  const tiles: RoadPlanTile[] = [];
  const totalCost: Partial<Record<ResourceId, number>> = {};
  let buildTiles = 0;
  let blocked = 0;

  // Netz + bereits akzeptierte Pfadkacheln bilden die wachsende Anschlussbasis.
  const connected = new Set<string>(derived.roadNetwork);
  const seen = new Set<string>();

  for (const p of path) {
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    const k = key(x, y);
    if (seen.has(k)) continue; // Duplikate im gezeichneten Pfad überspringen
    seen.add(k);

    const terrain = worldTerrainAt(state, x, y);
    const regionId = regionIdAt(x, y);

    // Bereits eine Straße hier → vorhanden, kostenlos, verbindet weiter.
    if (derived.roadNetwork.has(k)) {
      tiles.push({ x, y, terrain, regionId, status: 'exists', cost: {} });
      connected.add(k);
      continue;
    }

    if (!roadDef) {
      tiles.push({ x, y, terrain, regionId, status: 'blocked', cost: {} });
      blocked += 1;
      continue;
    }

    // Harte Regeln (Terrain/Belegung/Region) über die EINE Placement-Quelle.
    // Der Anschluss-Grund `needs_road` wird pfad-bewusst separat entschieden.
    const reason = validatePlacement(state, config, derived, roadDef, x, y);
    const hardBlock = reason !== undefined && reason !== 'needs_road';

    const touchesConnected = DIRS.some(([dx, dy]) => connected.has(key(x + dx, y + dy)));

    if (hardBlock) {
      tiles.push({ x, y, terrain, regionId, status: 'blocked', reason, cost: {} });
      blocked += 1;
      continue;
    }
    if (!touchesConnected) {
      tiles.push({ x, y, terrain, regionId, status: 'blocked', reason: 'needs_road', cost: {} });
      blocked += 1;
      continue;
    }

    const cost = tileCost(x, y);
    const overWater = terrain === 'water' || terrain === 'river';
    tiles.push({ x, y, terrain, regionId, status: overWater ? 'bridge' : 'ok', cost });
    addCost(totalCost, cost);
    buildTiles += 1;
    connected.add(k); // spätere Kacheln dürfen hieran anschließen
  }

  return { tiles, buildTiles, totalCost, blocked, valid: blocked === 0 };
}
