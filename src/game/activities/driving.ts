// § Stadtarbeit-Overhaul — DIE EINE FAHRPHYSIK (P2, in P3 auf Straßenführung umgestellt).
//
// Das manuelle Fahren gab es ursprünglich genau einmal: als private Methode im
// Three-Renderer. Damit es AUCH in der 2D-Stadtarbeitskarte stattfinden kann,
// ohne dass ein zweites Fahrmodell entsteht (CLAUDE.md §2/§8), liegt der
// Fahrschritt hier als reine Funktion — kein three, kein react, kein Canvas,
// keine Zeitquelle. Renderer und 2D-Karte rufen DIESELBE Funktion; wer die
// Dynamik ändert, ändert sie für beide Ansichten.
//
// P3 ERSETZT die frühere Arcade-Lenkung (freie Position, freier Winkel, weiche
// Rückführung auf die Fahrbahn) durch **Führung auf dem Straßengraphen**.
// Begründung steht wörtlich im Auftrag: „Das aktuelle WASD-System ist zu
// kompliziert … Das Fahrzeug fährt automatisch auf dem Straßennetz. Der Spieler
// steuert NICHT pixelgenau … Nicht: Freies Fahren überall. Sondern:
// Straßen-Navigation wie ein vereinfachtes Strategiespiel."
//
// Der entscheidende Unterschied ist nicht die Bedienung, sondern der Zustand:
// Das Fahrzeug ist nicht mehr ein Punkt mit einem Winkel, sondern sitzt IMMER
// auf einer Kante zwischen zwei Straßenkacheln. Damit kann es die Straße gar
// nicht verlassen — die alte Reibungs-/Rückzieh-Mechanik entfällt ersatzlos,
// und die Frage „hart blockieren oder weich zurückziehen?" stellt sich nicht
// mehr. W gibt Gas, A/D wählen an der Kreuzung die Abzweigung, S bremst und
// fährt rückwärts.
//
// Koordinaten sind Weltkacheln (wie überall in der Simulation). `heading` folgt
// der Renderer-Konvention `atan2(dx, dy)`: 0 zeigt in +y, π/2 in +x. Die
// Vorwärtsrichtung ist damit `(sin h, cos h)`.

import { ROAD_TILE_METERS } from '../roads/roadProfile.ts';

/** Tasten, die das Fahrzeug steuern (WASD + Pfeiltasten). */
export const DRIVE_KEYS: ReadonlySet<string> = new Set([
  'w',
  'a',
  's',
  'd',
  'arrowup',
  'arrowdown',
  'arrowleft',
  'arrowright',
]);

/** Beschleunigung in Kacheln/s². */
export const DRIVE_ACCEL = 5.2;
/** Bremsverzögerung in Kacheln/s² — spürbar stärker als das Gas. */
export const DRIVE_BRAKE = 8.5;
/** Anteil der Höchstgeschwindigkeit, der rückwärts erreicht wird. */
export const DRIVE_REVERSE_FACTOR = 0.4;
/** Höchstgeschwindigkeit in Kacheln/s, wenn kein Fahrzeug angegeben ist. */
export const DRIVE_DEFAULT_MAX_SPEED = 4.6;
/** Suchradius (Kacheln) für die nächste Straße beim Einsteigen. */
const NEAREST_ROAD_RADIUS = 6;
/** Wie weit der Abbiegehinweis vorausschaut (Kacheln). */
const TURN_LOOKAHEAD_TILES = 24;

/** Straßenkacheln als Menge `"x,y"` — dieselbe Form, die beide Ansichten führen. */
export type RoadTileSet = ReadonlySet<string>;

export interface Tile {
  x: number;
  y: number;
}

/**
 * Zustand des gesteuerten Fahrzeugs. Nur Zahlen — nichts zum Rendern.
 *
 * Das Fahrzeug sitzt auf der Kante `from → to` (zwei benachbarte Straßenkacheln)
 * an Position `t ∈ [0,1]`. Bildschirmkoordinaten und Blickwinkel werden daraus
 * ABGELEITET (`drivePose`) und nie getrennt gehalten — sonst könnten Position
 * und Straßenbindung auseinanderlaufen.
 */
export interface DriveState {
  from: Tile;
  to: Tile;
  t: number;
  /** Tempo in Kacheln/s; negativ = rückwärts. */
  speed: number;
}

/** Was der Spieler gerade drückt. */
export interface DriveInput {
  /** −1 bremsen/rückwärts, 0 ausrollen, +1 Gas. */
  forward: number;
  /** −1 an der Kreuzung links, +1 rechts, 0 geradeaus. */
  steer: number;
}

/** Position und Blickrichtung des Fahrzeugs in Weltkacheln. */
export interface DrivePose {
  x: number;
  y: number;
  heading: number;
}

/** Leitet aus gedrückten Tasten die Achsen ab (eine Auswertung für beide Ansichten). */
export function driveInputFromKeys(held: ReadonlySet<string>): DriveInput {
  const forward = (held.has('w') || held.has('arrowup') ? 1 : 0) - (held.has('s') || held.has('arrowdown') ? 1 : 0);
  const steer = (held.has('d') || held.has('arrowright') ? 1 : 0) - (held.has('a') || held.has('arrowleft') ? 1 : 0);
  return { forward, steer };
}

/**
 * Höchstgeschwindigkeit eines Fahrzeugs in Kacheln/s aus seiner Config-Angabe.
 * Damit wirkt die Fahrzeugwahl beim Selbstfahren genauso wie in der Rechnung
 * der automatischen Tour — es gibt keine zweite Tempotabelle.
 */
export function vehicleTileSpeed(speedKph: number): number {
  if (!Number.isFinite(speedKph) || speedKph <= 0) return DRIVE_DEFAULT_MAX_SPEED;
  return (speedKph * 1000) / 3600 / ROAD_TILE_METERS;
}

/**
 * § P4 („BELADUNG UND FAHRVERHALTEN"): Anteil der Höchstgeschwindigkeit, den ein
 * beladenes Fahrzeug noch erreicht. Ein volles Fahrzeug fährt spürbar langsamer
 * als ein leeres — genau das macht die Frage „direkt losfahren oder erst leer zum
 * Zwischenlager?" zu einer Entscheidung statt zu einer Geschmacksfrage.
 *
 * Bewusst LINEAR und flach gedeckelt: das Tempo soll fühlbar sein, ohne eine
 * volle Ladung zur Strafe zu machen. `loadRatio` 0 = leer, 1 = randvoll.
 */
export const DRIVE_FULL_LOAD_SPEED_FACTOR = 0.72;

export function loadedTileSpeed(maxSpeed: number, loadRatio: number): number {
  const ratio = Number.isFinite(loadRatio) ? Math.max(0, Math.min(1, loadRatio)) : 0;
  return maxSpeed * (1 - (1 - DRIVE_FULL_LOAD_SPEED_FACTOR) * ratio);
}

/** Nächstgelegene Straßenkachel zu einem Weltpunkt. */
export function nearestRoadTile(roads: RoadTileSet, x: number, y: number): Tile | undefined {
  const bx = Math.floor(x);
  const by = Math.floor(y);
  let best: Tile | undefined;
  let bestDistance = Infinity;
  for (let dy = -NEAREST_ROAD_RADIUS; dy <= NEAREST_ROAD_RADIUS; dy++) {
    for (let dx = -NEAREST_ROAD_RADIUS; dx <= NEAREST_ROAD_RADIUS; dx++) {
      const tx = bx + dx;
      const ty = by + dy;
      if (!roads.has(`${tx},${ty}`)) continue;
      const distance = Math.hypot(tx + 0.5 - x, ty + 0.5 - y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { x: tx, y: ty };
      }
    }
  }
  return best;
}

/**
 * Setzt das Fahrzeug auf die Straße. `at` ist der Wunschpunkt (Quellanker der
 * Route), `towards` die gewünschte Fahrtrichtung (nächster Wegpunkt).
 *
 * Gibt `undefined` zurück, wenn dort keine befahrbare Kante existiert — eine
 * einzelne Straßenkachel ohne Nachbarn ist kein Netz. Der Aufrufer sagt das
 * dann und täuscht keine Fahrt vor.
 */
export function beginDrive(roads: RoadTileSet, at: Tile, towards?: Tile): DriveState | undefined {
  const start = roads.has(`${Math.floor(at.x)},${Math.floor(at.y)}`)
    ? { x: Math.floor(at.x), y: Math.floor(at.y) }
    : nearestRoadTile(roads, at.x, at.y);
  if (!start) return undefined;
  const neighbours = roadNeighbours(roads, start);
  if (neighbours.length === 0) return undefined;
  const preferred = towards
    ? [...neighbours].sort(
        (a, b) =>
          Math.hypot(a.x - towards.x, a.y - towards.y) - Math.hypot(b.x - towards.x, b.y - towards.y),
      )[0]!
    : neighbours[0]!;
  return { from: start, to: preferred, t: 0, speed: 0 };
}

/**
 * Ein Fahrschritt auf dem Straßengraphen. Rein: verändert `state` nicht, sondern
 * gibt den neuen Zustand zurück; bei gleichem Eingang immer dasselbe Ergebnis —
 * deshalb ohne Renderer testbar.
 *
 * `maxSpeed` kommt aus dem gewählten Fahrzeug (`vehicleTileSpeed`).
 */
export function stepDrive(
  state: DriveState,
  input: DriveInput,
  dt: number,
  roads: RoadTileSet,
  maxSpeed: number = DRIVE_DEFAULT_MAX_SPEED,
): DriveState {
  let speed = state.speed;
  if (input.forward > 0) speed += DRIVE_ACCEL * dt;
  else if (input.forward < 0) speed -= DRIVE_BRAKE * dt;
  else speed *= Math.exp(-dt * 2.2);
  speed = Math.min(maxSpeed, Math.max(-maxSpeed * DRIVE_REVERSE_FACTOR, speed));
  if (Math.abs(speed) < 0.02) speed = 0;

  let from = state.from;
  let to = state.to;
  // Eine Kante ist genau eine Kachel lang, deshalb ist der Fortschritt direkt
  // der zurückgelegte Weg.
  let t = state.t + speed * dt;

  // Der Zähler deckelt beides zusammen: bei sehr großem `dt` (Tabwechsel) darf
  // die Schleife nicht die halbe Insel durchlaufen.
  let guard = 0;
  while (t >= 1 && guard++ < 16) {
    const next = chooseNext(roads, from, to, input.steer);
    if (!next) {
      t = 1;
      speed = 0;
      break;
    }
    from = to;
    to = next;
    t -= 1;
  }
  while (t < 0 && guard++ < 16) {
    // Rückwärts über `from` hinaus: die Kachel HINTER `from` wird zum neuen
    // Anfang. Das Lenkzeichen dreht sich wie beim echten Rückwärtsfahren.
    const behind = chooseNext(roads, to, from, -input.steer);
    if (!behind) {
      t = 0;
      speed = 0;
      break;
    }
    to = from;
    from = behind;
    t += 1;
  }

  return { from, to, t: Math.max(0, Math.min(1, t)), speed };
}

/** Position und Blickrichtung — ABGELEITET, nie getrennt gespeichert. */
export function drivePose(state: DriveState): DrivePose {
  const dx = state.to.x - state.from.x;
  const dy = state.to.y - state.from.y;
  return {
    x: state.from.x + 0.5 + dx * state.t,
    y: state.from.y + 0.5 + dy * state.t,
    heading: Math.atan2(dx, dy),
  };
}

export type TurnHint = 'straight' | 'left' | 'right' | 'around';

/**
 * Wohin die Straße als Nächstes abbiegt und wie weit es bis dahin ist —
 * die Grundlage des Abbiegehinweises („In 120 m rechts abbiegen").
 *
 * Vorausgeschaut wird mit DERSELBEN `chooseNext`-Regel, nach der das Fahrzeug
 * gleich tatsächlich fährt. Ein Hinweis aus einer zweiten Wegfindung würde
 * früher oder später etwas anderes ankündigen, als dann passiert.
 */
export function nextTurn(
  state: DriveState,
  roads: RoadTileSet,
  steer = 0,
): { turn: TurnHint; distanceTiles: number; junction: boolean } | undefined {
  let from = state.from;
  let to = state.to;
  let distance = 1 - state.t;
  for (let step = 0; step < TURN_LOOKAHEAD_TILES; step++) {
    const next = chooseNext(roads, from, to, steer);
    if (!next) return undefined;
    const turn = turnBetween(
      { x: to.x - from.x, y: to.y - from.y },
      { x: next.x - to.x, y: next.y - to.y },
    );
    if (turn !== 'straight') {
      return { turn, distanceTiles: distance, junction: roadNeighbours(roads, to).length > 2 };
    }
    from = to;
    to = next;
    distance += 1;
  }
  return undefined;
}

/**
 * Ist ein Ziel erreicht? Dieselbe Reichweitenregel für beide Ansichten — sonst
 * gilt ein Ziel in der 2D-Karte als angefahren und in der 3D-Welt nicht.
 * `size` ist der Footprint des Zielgebäudes.
 */
export function reachedTarget(
  pose: { x: number; y: number },
  building: { x: number; y: number },
  size: { w: number; h: number },
): boolean {
  const cx = building.x + size.w / 2;
  const cy = building.y + size.h / 2;
  const reach = Math.max(size.w, size.h) / 2 + 1.4;
  return Math.hypot(cx - pose.x, cy - pose.y) < reach;
}

/** Befahrbare Nachbarkacheln in fester Reihenfolge (Ost, Süd, West, Nord). */
export function roadNeighbours(roads: RoadTileSet, tile: Tile): Tile[] {
  const result: Tile[] = [];
  for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]] as const) {
    const next = { x: tile.x + dx, y: tile.y + dy };
    if (roads.has(`${next.x},${next.y}`)) result.push(next);
  }
  return result;
}

/**
 * Die Abzweigung nach `to`, wenn man aus Richtung `from` kommt.
 *
 * Ohne gedrückte Lenktaste fährt das Fahrzeug GERADEAUS weiter, solange es
 * kann — im Korridor folgt es dadurch der Straße von selbst, an der Kreuzung
 * bleibt die Wahl beim Spieler. Gibt es keine Fortsetzung, wendet es. Die
 * Reihenfolge ist fest und damit deterministisch: gleiche Straßen, gleiche
 * Taste, gleicher Weg.
 */
export function chooseNext(roads: RoadTileSet, from: Tile, to: Tile, steer: number): Tile | undefined {
  const dir = { x: to.x - from.x, y: to.y - from.y };
  // Bildschirm-Konvention: +y zeigt nach Süden, deshalb ist (−dy, dx) rechts.
  const right = { x: -dir.y, y: dir.x };
  const left = { x: dir.y, y: -dir.x };
  const back = { x: -dir.x, y: -dir.y };
  const order = steer > 0
    ? [right, dir, left, back]
    : steer < 0
    ? [left, dir, right, back]
    : [dir, right, left, back];
  for (const option of order) {
    const candidate = { x: to.x + option.x, y: to.y + option.y };
    if (roads.has(`${candidate.x},${candidate.y}`)) return candidate;
  }
  return undefined;
}

function turnBetween(before: Tile, after: Tile): TurnHint {
  if (before.x === after.x && before.y === after.y) return 'straight';
  if (before.x === -after.x && before.y === -after.y) return 'around';
  // Kreuzprodukt in der Bildschirmebene: positiv = nach rechts.
  return before.x * after.y - before.y * after.x > 0 ? 'right' : 'left';
}
