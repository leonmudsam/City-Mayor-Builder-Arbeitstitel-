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
import {
  buildRoadHeightProfile,
  type RoadHeightProfile,
  type RoadVariant,
} from './roadProfile.ts';

export type RoadTileStatus = 'ok' | 'bridge' | 'exists' | 'blocked';

export interface RoadPlanTile {
  x: number;
  y: number;
  terrain: TerrainType;
  regionId: number;
  status: RoadTileStatus;
  /** Automatisch aus Gelände und Längsprofil gewählte Bauart. */
  variant: RoadVariant;
  terrainHeight: number;
  roadHeight: number;
  gradePercent: number;
  clearance: number;
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
  /** Höhen-, Steigungs- und Variantenprofil derselben gerasterten Trasse. */
  profile: RoadHeightProfile;
  /** Warum ein geometrisch lückenloser Pfad konstruktiv noch nicht baubar ist. */
  profileError?: 'insufficient_length' | 'invalid_anchor';
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
  tileCost: (x: number, y: number, variant: RoadVariant) => Partial<Record<ResourceId, number>>,
  roadDefId: string = 'road',
): RoadPlanPreview {
  const roadDef = config.buildings.get(roadDefId);
  const tiles: RoadPlanTile[] = [];
  const totalCost: Partial<Record<ResourceId, number>> = {};
  let buildTiles = 0;
  let blocked = 0;

  // Genau dieselbe normalisierte Reihenfolge treibt Profil UND Kachelprüfung.
  // So kann eine UI-Kurve nie andere Höhen nennen als die farbigen Segmente.
  const normalizedPath: { x: number; y: number }[] = [];
  const normalizedSeen = new Set<string>();
  for (const point of path) {
    const x = Math.round(point.x);
    const y = Math.round(point.y);
    const normalizedKey = key(x, y);
    if (normalizedSeen.has(normalizedKey)) continue;
    normalizedSeen.add(normalizedKey);
    normalizedPath.push({ x, y });
  }
  const profile = buildRoadHeightProfile(state, normalizedPath);

  // Netz + bereits akzeptierte Pfadkacheln bilden die wachsende Anschlussbasis.
  const connected = new Set<string>(derived.roadNetwork);
  const seen = new Set<string>();

  for (let pathIndex = 0; pathIndex < normalizedPath.length; pathIndex++) {
    const p = normalizedPath[pathIndex]!;
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    const k = key(x, y);
    if (seen.has(k)) continue; // defensiver Schutz; normalisiert ist bereits eindeutig
    seen.add(k);

    const profilePoint = profile.points[pathIndex]!;
    const profileFields = {
      variant: profilePoint.variant,
      terrainHeight: profilePoint.terrainHeight,
      roadHeight: profilePoint.roadHeight,
      gradePercent: profilePoint.gradePercent,
      clearance: profilePoint.clearance,
    };

    const terrain = worldTerrainAt(state, x, y);
    const regionId = regionIdAt(x, y);

    // Bereits eine Straße hier → vorhanden, kostenlos, verbindet weiter.
    if (derived.roadNetwork.has(k)) {
      tiles.push({ x, y, terrain, regionId, status: 'exists', cost: {}, ...profileFields });
      connected.add(k);
      continue;
    }

    if (!roadDef) {
      tiles.push({ x, y, terrain, regionId, status: 'blocked', cost: {}, ...profileFields });
      blocked += 1;
      continue;
    }

    // Harte Regeln (Terrain/Belegung/Region) über die EINE Placement-Quelle.
    // Der Anschluss-Grund `needs_road` wird pfad-bewusst separat entschieden.
    const reason = validatePlacement(state, config, derived, roadDef, x, y);
    const endpoint = pathIndex === 0 || pathIndex === normalizedPath.length - 1;
    const invalidAutomaticAnchor = roadDefId === 'road' && endpoint &&
      (terrain === 'water' || terrain === 'river' || profilePoint.cliff);
    const hardBlock = invalidAutomaticAnchor || (reason !== undefined && reason !== 'needs_road');

    const touchesConnected = DIRS.some(([dx, dy]) => connected.has(key(x + dx, y + dy)));

    if (hardBlock) {
      const blockedReason = invalidAutomaticAnchor ? 'terrain' : reason;
      tiles.push({
        x,
        y,
        terrain,
        regionId,
        status: 'blocked',
        ...(blockedReason ? { reason: blockedReason } : {}),
        cost: {},
        ...profileFields,
      });
      blocked += 1;
      continue;
    }
    if (!touchesConnected) {
      tiles.push({ x, y, terrain, regionId, status: 'blocked', reason: 'needs_road', cost: {}, ...profileFields });
      blocked += 1;
      continue;
    }

    const cost = tileCost(x, y, profilePoint.variant);
    // Eine Kachel ist eine Brücke/ein Viadukt, wenn die Bauklasse sie überspannt
    // (Wasser/Fluss bzw. Klippe). Bei der Bodenstraße kommt es hierher nie, weil
    // solche Kacheln oben hart geblockt werden — der `'bridge'`-Status wird erst
    // mit einer querenden Bauklasse real (§ Infrastruktur 2.0 / I1).
    const rc = roadDef.road;
    const spanned =
      profilePoint.variant === 'bridge' ||
      profilePoint.variant === 'viaduct' ||
      (rc?.crossesWater === true && (terrain === 'water' || terrain === 'river')) ||
      (rc?.crossesCliff === true && terrain === 'mountain');
    tiles.push({ x, y, terrain, regionId, status: spanned ? 'bridge' : 'ok', cost, ...profileFields });
    addCost(totalCost, cost);
    buildTiles += 1;
    connected.add(k); // spätere Kacheln dürfen hieran anschließen
  }

  // Nur die neue automatische Straße erzwingt das gemeinsame 8-%-/Landanker-
  // Profil. `road_elevated` bleibt als intern ladbare Legacy-Klasse tolerant.
  const profileError = roadDefId === 'road'
    ? (normalizedPath.length < 2
        ? 'insufficient_length'
        : (!profile.feasible ? 'invalid_anchor' : undefined))
    : undefined;
  return {
    tiles,
    buildTiles,
    totalCost,
    blocked,
    valid: blocked === 0 && profileError === undefined,
    profile,
    ...(profileError ? { profileError } : {}),
  };
}
