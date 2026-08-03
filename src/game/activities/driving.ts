// § Stadtarbeit-Overhaul — DIE EINE FAHRPHYSIK (P2, in P3 auf Straßenführung umgestellt).
//
// Das manuelle Fahren gab es ursprünglich genau einmal: als private Methode im
// Three-Renderer. Damit es AUCH in der 2D-Stadtarbeitskarte stattfinden kann,
// ohne dass ein zweites Fahrmodell entsteht (CLAUDE.md §2/§8), liegt der
// Fahrschritt hier als reine Funktion — kein three, kein react, kein Canvas,
// keine Zeitquelle. Renderer und 2D-Karte rufen DIESELBE Funktion; wer die
// Dynamik ändert, ändert sie für beide Ansichten.
//
// § D-060 (Stadtarbeit-Overhaul) ERSETZT die Dauerlenkung durch eine
// KREUZUNGSENTSCHEIDUNG. Gemessener Anlass, wörtlich aus dem Auftrag: „Die
// Steuerung fühlt sich kaputt an. Man kann schlecht wenden."
//
// Beides hatte eine Ursache, und es war NICHT die Physik: Die Lenktaste wurde
// genau in dem Bild gelesen, in dem das Fahrzeug eine Kachelgrenze überquerte.
// Wer eine Zehntelsekunde zu früh losließ, fuhr geradeaus — und wer die Taste
// gedrückt hielt, bog an JEDER Gelegenheit ab, weil `chooseNext` bei
// `steer > 0` rechts auch mitten im Korridor nach vorn sortierte. Halten war
// also keine Lösung, sondern ein zweiter Fehler. Wenden wiederum gab es gar
// nicht: `back` war die letzte Option und nur in der Sackgasse erreichbar,
// weshalb der Spieler rückwärts rangieren musste.
//
// Jetzt ist ein Tastendruck eine ABSICHT, kein Signal. Sie bleibt stehen, bis
// eine Kreuzung sie einlösen kann. Damit ist es gleichgültig, WANN gedrückt
// wird — der häufigste Frustmoment entfällt strukturell statt durch ein
// größeres Zeitfenster. Zusätzlich: Gas ist der Normalzustand (ein
// Logistikmodus, in dem man W halten muss, beschäftigt ohne zu entscheiden,
// D-039), und Wenden ist eine eigene Taste.
//
// P3 hatte zuvor die Arcade-Lenkung ersetzt (freie Position, freier Winkel, weiche
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
  /** Tempo in Kacheln/s. Nie negativ — rückwärts wird nicht mehr gefahren. */
  speed: number;
  /**
   * § D-060: die GEMERKTE Absicht. Ein Tastendruck legt sie ab; eingelöst wird
   * sie an der nächsten Kreuzung, an der die Richtung wirklich existiert, und
   * erst dann gelöscht. Genau hier — im Zustand, nicht im Tastenereignis —
   * verschwindet der „Ich habe doch gedrückt"-Fehler.
   */
  intent?: TurnHint;
}

/** Was der Spieler will — nicht, was er in diesem Bild drückt. */
export interface DriveInput {
  /**
   * Neue Absicht für die nächste Kreuzung (`undefined` = keine Änderung, die
   * bisherige bleibt stehen).
   */
  intent?: TurnHint;
  /** Angehalten? Gas ist der Normalzustand, Halten die Ausnahme. */
  stopped?: boolean;
}

/** Position und Blickrichtung des Fahrzeugs in Weltkacheln. */
export interface DrivePose {
  x: number;
  y: number;
  heading: number;
}

/**
 * Eine Taste = eine der VIER Richtungen, die es an einer Kreuzung gibt. Das ist
 * die Abbildung aus dem Auftrag („links / geradeaus / rechts / wenden"), und
 * sie macht die Bedienung erklärbar, ohne dass irgendwo eine fünfte Bedeutung
 * dazukommt. Halten ist bewusst NICHT auf S — S ist wenden.
 */
export function turnFromKey(key: string): TurnHint | undefined {
  switch (key) {
    case 'a':
    case 'arrowleft':
      return 'left';
    case 'd':
    case 'arrowright':
      return 'right';
    case 'w':
    case 'arrowup':
      return 'straight';
    case 's':
    case 'arrowdown':
      return 'around';
    default:
      return undefined;
  }
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
 * § D-060, die drei Änderungen und ihr Grund:
 *
 * 1. **Gas ist der Normalzustand.** Ohne `stopped` beschleunigt das Fahrzeug auf
 *    `maxSpeed`. Ein Logistikmodus, in dem man W halten muss, beschäftigt den
 *    Spieler, ohne ihn entscheiden zu lassen (D-039).
 * 2. **Die Absicht wird gemerkt, nicht abgetastet.** Sie überlebt so viele
 *    Kacheln, wie es braucht, bis eine Kreuzung sie einlösen kann.
 * 3. **Kein Rückwärts mehr.** Wenden ist eine Richtung wie jede andere und
 *    braucht dafür keinen zweiten Bewegungsmodus. Damit entfällt die gesamte
 *    Rangiererei, die der Auftrag als „nerviges Zurücksetzen" benennt.
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
  // Eine neue Absicht ersetzt die alte; ohne neue bleibt die alte stehen.
  let intent = input.intent ?? state.intent;

  let speed = state.speed;
  if (input.stopped) speed = Math.max(0, speed - DRIVE_BRAKE * dt);
  else speed = Math.min(maxSpeed, speed + DRIVE_ACCEL * dt);
  if (speed < 0.02) speed = 0;

  let from = state.from;
  let to = state.to;
  // Eine Kante ist genau eine Kachel lang, deshalb ist der Fortschritt direkt
  // der zurückgelegte Weg.
  let t = state.t + speed * dt;

  // Der Zähler deckelt die Schleife: bei sehr großem `dt` (Tabwechsel) darf sie
  // nicht die halbe Insel durchlaufen.
  let guard = 0;
  while (t >= 1 && guard++ < 16) {
    const step = advanceAcrossTile(roads, from, to, intent);
    if (!step) {
      // Kann nur passieren, wenn die Kachel gar keinen Nachbarn mehr hat (die
      // Straße wurde unter dem Fahrzeug abgerissen). Stehenbleiben ist hier die
      // ehrliche Antwort — irgendwohin zu springen wäre es nicht.
      t = 1;
      speed = 0;
      break;
    }
    from = to;
    to = step.next;
    if (step.consumed) intent = undefined;
    t -= 1;
  }

  return {
    from,
    to,
    t: Math.max(0, Math.min(1, t)),
    speed,
    ...(intent ? { intent } : {}),
  };
}

/**
 * Der Übergang über EINE Kachelgrenze: wohin geht es weiter, und war das die
 * Einlösung der Absicht?
 *
 * Die Absicht wird nur verbraucht, wenn die gewünschte Richtung an dieser
 * Kachel wirklich existiert. Wer „rechts" drückt, während links eine Einfahrt
 * liegt, fährt weiter geradeaus und biegt an der nächsten echten Möglichkeit
 * ab — statt die Eingabe stillschweigend zu verlieren.
 */
function advanceAcrossTile(
  roads: RoadTileSet,
  from: Tile,
  to: Tile,
  intent: TurnHint | undefined,
): { next: Tile; consumed: boolean } | undefined {
  const options = turnOptionsAt(roads, from, to);
  if (options.length === 0) return undefined;
  if (intent) {
    const wanted = options.find((option) => option.turn === intent);
    if (wanted) return { next: wanted.tile, consumed: true };
  }
  // Ohne (einlösbare) Absicht folgt das Fahrzeug der Straße: geradeaus, solange
  // es geht; in der Kurve die einzige Fortsetzung; in der Sackgasse zurück.
  const straight = options.find((option) => option.turn === 'straight');
  if (straight) return { next: straight.tile, consumed: false };
  const forward = options.filter((option) => option.turn !== 'around');
  const pick = forward[0] ?? options[0]!;
  return { next: pick.tile, consumed: false };
}

/**
 * Alle Richtungen, die an der Kachel `to` offenstehen, wenn man aus `from`
 * kommt — in fester Reihenfolge (links, geradeaus, rechts, wenden).
 *
 * DAS ist die Liste, die die Oberfläche anzeigt und anklickbar macht (§3 des
 * Auftrags). Sie wird nicht nachgebaut: Anzeige und Fahrt lesen dieselbe
 * Funktion, sonst kündigt die Kreuzungsanzeige früher oder später etwas an,
 * das dann nicht passiert (Lehre D-042).
 */
export function turnOptionsAt(
  roads: RoadTileSet,
  from: Tile,
  to: Tile,
): { turn: TurnHint; tile: Tile }[] {
  const dir = { x: to.x - from.x, y: to.y - from.y };
  // Bildschirm-Konvention: +y zeigt nach Süden, deshalb ist (−dy, dx) rechts.
  const candidates: { turn: TurnHint; offset: Tile }[] = [
    { turn: 'left', offset: { x: dir.y, y: -dir.x } },
    { turn: 'straight', offset: dir },
    { turn: 'right', offset: { x: -dir.y, y: dir.x } },
    { turn: 'around', offset: { x: -dir.x, y: -dir.y } },
  ];
  const out: { turn: TurnHint; tile: Tile }[] = [];
  for (const candidate of candidates) {
    const tile = { x: to.x + candidate.offset.x, y: to.y + candidate.offset.y };
    if (roads.has(`${tile.x},${tile.y}`)) out.push({ turn: candidate.turn, tile });
  }
  return out;
}

/**
 * Die nächste Stelle, an der der Spieler wirklich etwas zu entscheiden hat, mit
 * Entfernung und den offenen Richtungen. Grundlage der Navi-Anzeige.
 *
 * „Etwas zu entscheiden" heißt: mehr als eine Fortsetzung außer Wenden. Eine
 * Kurve ist keine Kreuzung — sie anzukündigen wäre Lärm, weil es dort nichts zu
 * wählen gibt.
 */
export function nextJunction(
  state: DriveState,
  roads: RoadTileSet,
  lookaheadTiles = TURN_LOOKAHEAD_TILES,
): { distanceTiles: number; options: { turn: TurnHint; tile: Tile }[] } | undefined {
  let from = state.from;
  let to = state.to;
  let distance = 1 - state.t;
  for (let step = 0; step < lookaheadTiles; step++) {
    const options = turnOptionsAt(roads, from, to);
    if (options.filter((option) => option.turn !== 'around').length > 1) {
      return { distanceTiles: distance, options };
    }
    const next = advanceAcrossTile(roads, from, to, state.intent);
    if (!next) return undefined;
    from = to;
    to = next.next;
    distance += 1;
  }
  return undefined;
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
 * Vorausgeschaut wird mit DERSELBEN Regel, nach der das Fahrzeug gleich
 * tatsächlich fährt (`advanceAcrossTile`, inklusive der gemerkten Absicht). Ein
 * Hinweis aus einer zweiten Wegfindung würde früher oder später etwas anderes
 * ankündigen, als dann passiert.
 */
export function nextTurn(
  state: DriveState,
  roads: RoadTileSet,
): { turn: TurnHint; distanceTiles: number; junction: boolean } | undefined {
  let from = state.from;
  let to = state.to;
  let distance = 1 - state.t;
  for (let step = 0; step < TURN_LOOKAHEAD_TILES; step++) {
    const advance = advanceAcrossTile(roads, from, to, state.intent);
    if (!advance) return undefined;
    const next = advance.next;
    const turn = turnBetween(
      { x: to.x - from.x, y: to.y - from.y },
      { x: next.x - to.x, y: next.y - to.y },
    );
    if (turn !== 'straight') {
      return {
        turn,
        distanceTiles: distance,
        junction: turnOptionsAt(roads, from, to).filter((option) => option.turn !== 'around').length > 1,
      };
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

function turnBetween(before: Tile, after: Tile): TurnHint {
  if (before.x === after.x && before.y === after.y) return 'straight';
  if (before.x === -after.x && before.y === -after.y) return 'around';
  // Kreuzprodukt in der Bildschirmebene: positiv = nach rechts.
  return before.x * after.y - before.y * after.x > 0 ? 'right' : 'left';
}
