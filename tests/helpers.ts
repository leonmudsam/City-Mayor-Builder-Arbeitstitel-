import { loadConfig, type GameConfig } from '../src/game/config/index.ts';
import { startRegionConfig, WORLD_TILES } from '../src/game/config/startRegion.config.ts';
import { createNewGame } from '../src/game/newGame.ts';
import { GameController } from '../src/game/commands/controller.ts';
import { recomputeDerived } from '../src/game/simulation/derived.ts';
import { overrideTerrain, tileAt } from '../src/game/map/world.ts';
import { isNodeTile, RESOURCE_NODE_PROFILES } from '../src/game/operations/nodes.ts';
import type { GameState, ResourceNodeType, TerrainType } from '../src/game/types.ts';

export const T0 = 1_700_000_000_000;

/** Rathaus-Position der Insel (vom Bake gewählt) — Tests platzieren relativ dazu. */
export const TOWN_HALL = startRegionConfig.townHall;
/** Startregion-Id (vom Bake gewählt, § Welt 2.0 organische Regionen). */
export const START_REGION = startRegionConfig.startRegionId;

/** Welt-Kachel relativ zum Rathaus (ersetzt die alten absoluten Test-Koordinaten). */
export function nearTownHall(dx: number, dy: number): { x: number; y: number } {
  return { x: TOWN_HALL.x + dx, y: TOWN_HALL.y + dy };
}

/**
 * Test-Controller auf der Insel-Welt. `flatten` (Default AN) glättet die
 * Startregion per Overrides auf Gras — die Alt-Suiten wurden gegen einen
 * grasigen Start geschrieben; der Insel-Start hat Wald-/Wasser-Flecken, die
 * sonst Platzierungen und Location-Boni nichtdeterministisch beeinflussen.
 * Tests, die ECHTES Insel-Terrain brauchen (Save-Größe, Biome), opten aus.
 */
export function newController(
  now = T0,
  opts: { flatten?: boolean; found?: boolean } = {},
): { controller: GameController; config: GameConfig } {
  const config = loadConfig();
  const state = createNewGame(config, 'Teststadt', now);
  const controller = new GameController(config, state);
  if (opts.flatten !== false) flattenTerrain(controller);
  // § Welt-Feinschliff 12.2: Ein neues Spiel startet OHNE Rathaus — der Spieler
  // gründet selbst (`foundCity`). Fast alle Suiten beschreiben aber eine bereits
  // bestehende Stadt, deshalb gründet die Standard-Fixture auf dem vom Bake
  // geprüften Anker. Das ist exakt der frühere Startzustand. Tests, die die
  // Gründung selbst prüfen, setzen `found: false`.
  if (opts.found !== false) {
    const founded = controller.foundCity(TOWN_HALL.x, TOWN_HALL.y);
    if (!founded.ok) throw new Error(`Test-Fixture: Gründung fehlgeschlagen (${founded.error})`);
  }
  return { controller, config };
}

/**
 * Das Rathaus der Test-Fixture. Seit § 12.2 gründet der Spieler selbst, deshalb
 * vergibt `foundCity` eine laufende Id (`newId`) statt der früher fest
 * verdrahteten `b_townhall` — Tests fragen das Gebäude über seine Rolle ab.
 */
export function townHallOf(controller: GameController): GameState['buildings'][string] {
  const building = Object.values(controller.state.buildings).find((b) => b.defId === 'town_hall');
  if (!building) throw new Error('Test: kein Rathaus vorhanden (Fixture mit found:false?)');
  return building;
}

/** Cheat helper for tests: jump to a level without playing through it. */
export function setLevel(controller: GameController, level: number): void {
  const def = controller.config.levels.find((l) => l.level === level);
  controller.state.level.current = level;
  controller.state.level.xp = def?.xpRequired ?? 0;
}

/**
 * Flache Test-Arbeitsfläche um das Rathaus (§ v10/v11: via sparse Overrides —
 * Terrain ist nicht mehr im Save). Die Fläche ist bewusst nicht an die Form
 * einer gebackenen Region gekoppelt: Tests beschreiben Gameplay-Abstände relativ
 * zum Rathaus und sollen bei einem reinen Welt-Rebake nicht neu angeordnet werden.
 */
export function flattenTerrain(controller: GameController): void {
  const minX = Math.max(0, TOWN_HALL.x - 32);
  const maxX = Math.min(WORLD_TILES - 1, TOWN_HALL.x + 56);
  const minY = Math.max(0, TOWN_HALL.y - 32);
  const maxY = Math.min(WORLD_TILES - 1, TOWN_HALL.y + 56);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      overrideTerrain(controller.state, x, y, 'grass');
    }
  }
  refreshDerived(controller);
}

export function paintTerrain(controller: GameController, tiles: [number, number][], terrain: TerrainType): void {
  for (const [x, y] of tiles) overrideTerrain(controller.state, x, y, terrain);
  refreshDerived(controller);
}

/**
 * Malt genau `count` Kacheln, die auch WIRKLICH einen Ressourcenknoten tragen.
 *
 * Ein Knoten existiert nur, wenn zusätzlich zum Terrain der Positions-Hash unter
 * der Knotendichte liegt (`isNodeTile`). Wer einfach zwei Waldkacheln malt,
 * bekommt deshalb je Kachel nur mit Wahrscheinlichkeit `density` einen Baum —
 * und das Ergebnis hängt an den ABSOLUTEN Weltkoordinaten. Genau daran sind die
 * Betriebstests beim Weltaustausch (§ World Overhaul 12.0) gescheitert: dieselbe
 * Position relativ zum Rathaus lag auf der neuen Insel auf Kacheln ohne Knoten.
 *
 * Dieser Helfer sucht stattdessen in Ringen um `anchor` nach passenden Kacheln
 * und ist damit unabhängig davon, wo das Rathaus in der Welt liegt.
 */
export function paintResourceNodes(
  controller: GameController,
  type: ResourceNodeType,
  anchor: { x: number; y: number },
  count: number,
  maxRadius = 6,
): { x: number; y: number }[] {
  const profile = RESOURCE_NODE_PROFILES[type];
  if (!profile) throw new Error(`Unbekannter Knotentyp ${type}`);
  const painted: { x: number; y: number }[] = [];
  for (let radius = 0; radius <= maxRadius && painted.length < count; radius++) {
    for (let dy = -radius; dy <= radius && painted.length < count; dy++) {
      for (let dx = -radius; dx <= radius && painted.length < count; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue; // nur der Ring
        const x = anchor.x + dx;
        const y = anchor.y + dy;
        if (x < 0 || y < 0 || x >= WORLD_TILES || y >= WORLD_TILES) continue;
        if (tileAt(controller.state, x, y)?.buildingId) continue;
        overrideTerrain(controller.state, x, y, profile.terrain as TerrainType);
        if (!isNodeTile(controller.state, type, x, y)) {
          overrideTerrain(controller.state, x, y, 'grass'); // kein Knoten → zurück
          continue;
        }
        painted.push({ x, y });
      }
    }
  }
  refreshDerived(controller);
  if (painted.length < count) {
    throw new Error(`Nur ${painted.length} von ${count} ${type}-Knoten im Radius ${maxRadius} um (${anchor.x},${anchor.y}) gefunden`);
  }
  return painted;
}

/** Recompute derived values after direct state edits in tests. */
export function refreshDerived(controller: GameController): void {
  controller.derived = recomputeDerived(controller.state, controller.config);
}
