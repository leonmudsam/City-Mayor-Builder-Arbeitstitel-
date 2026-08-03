// § Stadtarbeit-Overhaul — die EINE Fahrphysik, seit D-060 als Kreuzungsentscheidung.
//
// Die Tests prüfen bewusst die reine Funktion und nicht die Karte: `stepDrive`
// ist die Dynamik von 3D-Welt UND 2D-Logistikkarte (CLAUDE.md §2/§8). Was hier
// grün ist, gilt in beiden Ansichten — und was hier fehlt, kann in einer der
// beiden abweichen, ohne dass es jemand merkt.
//
// Der Abschnitt „Die gemerkte Absicht" prüft genau den Fehler, den der Spieler
// als „die Steuerung fühlt sich kaputt an" gemeldet hat: Früher wurde die
// Lenktaste im Bild des Grenzübertritts abgetastet. Wer zu früh drückte, verlor
// die Eingabe; wer hielt, bog überall ab. Beides wird hier verhindert.

import { describe, expect, it } from 'vitest';
import {
  DRIVE_DEFAULT_MAX_SPEED,
  DRIVE_KEYS,
  beginDrive,
  drivePose,
  nextJunction,
  nextTurn,
  reachedTarget,
  roadNeighbours,
  stepDrive,
  turnFromKey,
  turnOptionsAt,
  vehicleTileSpeed,
  type DriveInput,
  type DriveState,
  type RoadTileSet,
} from '../src/game/activities/driving.ts';

/** Eine gerade Ost-West-Straße auf y = 10, x = 0..20. */
const straightRoad: RoadTileSet = new Set(
  Array.from({ length: 21 }, (_, index) => `${index},10`),
);

/** Ein Winkel: nach Osten bis x = 10, dann nach Süden. */
const cornerRoad: RoadTileSet = new Set([
  ...Array.from({ length: 11 }, (_, index) => `${index},10`),
  ...Array.from({ length: 10 }, (_, index) => `10,${11 + index}`),
]);

/** Ein Kreuz mit Mittelpunkt (10,10). */
const crossRoad: RoadTileSet = new Set([
  ...Array.from({ length: 21 }, (_, index) => `${index},10`),
  ...Array.from({ length: 21 }, (_, index) => `10,${index}`),
]);

/**
 * Zwei Kreuzungen hintereinander: Abzweig nach Süden bei x = 5 (nur Süden) und
 * ein volles Kreuz bei x = 12. Damit lässt sich prüfen, dass eine Absicht, die
 * an der ersten Stelle nicht einlösbar ist, NICHT verloren geht.
 */
const twoJunctions: RoadTileSet = new Set([
  ...Array.from({ length: 21 }, (_, index) => `${index},10`),
  ...Array.from({ length: 5 }, (_, index) => `5,${11 + index}`),
  ...Array.from({ length: 5 }, (_, index) => `12,${11 + index}`),
  ...Array.from({ length: 5 }, (_, index) => `12,${5 + index}`),
]);

const at = (x: number, y: number, to: { x: number; y: number }, speed = 0): DriveState => ({
  from: { x, y },
  to,
  t: 0,
  speed,
});

const go: DriveInput = {};

function run(
  state: DriveState,
  roads: RoadTileSet,
  seconds: number,
  input: DriveInput = go,
  maxSpeed?: number,
): DriveState {
  let current = state;
  const dt = 1 / 60;
  for (let step = 0; step < Math.round(seconds * 60); step++) {
    // Nach dem ersten Schritt keine NEUE Absicht mehr — genau wie im Spiel,
    // wo ein Tastendruck einmal übergeben und dann vom Zustand geführt wird.
    current = stepDrive(current, step === 0 ? input : { stopped: input.stopped ?? false }, dt, roads, maxSpeed);
  }
  return current;
}

describe('Steuerung', () => {
  it('bildet jede Taste auf genau eine der vier Kreuzungsrichtungen ab', () => {
    expect(turnFromKey('w')).toBe('straight');
    expect(turnFromKey('a')).toBe('left');
    expect(turnFromKey('d')).toBe('right');
    expect(turnFromKey('s')).toBe('around');
  });

  it('behandelt WASD und Pfeiltasten gleich', () => {
    expect(turnFromKey('arrowup')).toBe(turnFromKey('w'));
    expect(turnFromKey('arrowdown')).toBe(turnFromKey('s'));
    expect(turnFromKey('arrowleft')).toBe(turnFromKey('a'));
    expect(turnFromKey('arrowright')).toBe(turnFromKey('d'));
  });

  it('kennt genau die acht Fahrtasten', () => {
    expect([...DRIVE_KEYS].sort()).toEqual(
      ['a', 'arrowdown', 'arrowleft', 'arrowright', 'arrowup', 'd', 's', 'w'].sort(),
    );
  });
});

describe('Einsteigen', () => {
  it('setzt das Fahrzeug auf die Straße und in die gewünschte Richtung', () => {
    const state = beginDrive(straightRoad, { x: 5, y: 10 }, { x: 9, y: 10 });
    expect(state).toBeDefined();
    expect(state!.from).toEqual({ x: 5, y: 10 });
    expect(state!.to).toEqual({ x: 6, y: 10 });
    expect(state!.speed).toBe(0);
  });

  it('findet die nächste Straße, wenn der Anker daneben liegt', () => {
    const state = beginDrive(straightRoad, { x: 5.5, y: 13 });
    expect(state?.from).toEqual({ x: 5, y: 10 });
  });

  it('verweigert die Fahrt auf einer einzelnen Kachel ohne Nachbarn', () => {
    // Wichtig: KEINE vorgetäuschte Fahrt. Eine Kachel allein ist kein Netz.
    expect(beginDrive(new Set(['3,3']), { x: 3, y: 3 })).toBeUndefined();
  });
});

describe('Längsdynamik', () => {
  it('fährt VON SELBST los — Gas ist der Normalzustand', () => {
    // § D-060: Ein Logistikmodus, in dem man W halten muss, beschäftigt den
    // Spieler, ohne ihn entscheiden zu lassen (D-039).
    const rolling = run(at(0, 10, { x: 1, y: 10 }), straightRoad, 0.5);
    expect(rolling.speed).toBeGreaterThan(0);
    const flatOut = run(at(0, 10, { x: 1, y: 10 }), straightRoad, 8);
    expect(flatOut.speed).toBeCloseTo(DRIVE_DEFAULT_MAX_SPEED, 5);
  });

  it('hält an und bleibt stehen, solange angehalten ist', () => {
    const moving = run(at(0, 10, { x: 1, y: 10 }), straightRoad, 2);
    const halted = run(moving, straightRoad, 2, { stopped: true });
    expect(halted.speed).toBe(0);
  });

  it('fährt nie rückwärts — Wenden ersetzt das Rangieren', () => {
    const state = run(at(5, 10, { x: 6, y: 10 }), straightRoad, 6, { intent: 'around' });
    expect(state.speed).toBeGreaterThanOrEqual(0);
  });

  it('rechnet die Fahrzeug-Höchstgeschwindigkeit aus der Config-Angabe', () => {
    // 80 km/h bei 4 m je Kachel = 5,55 Kacheln/s.
    expect(vehicleTileSpeed(80)).toBeCloseTo(5.555, 2);
    expect(vehicleTileSpeed(0)).toBe(DRIVE_DEFAULT_MAX_SPEED);
    const slow = run(at(0, 10, { x: 1, y: 10 }), straightRoad, 8, go, vehicleTileSpeed(22));
    expect(slow.speed).toBeCloseTo(vehicleTileSpeed(22), 5);
  });
});

describe('Straßenbindung', () => {
  it('bleibt IMMER auf der Straße — auch nach langer Fahrt', () => {
    let state = at(0, 10, { x: 1, y: 10 });
    for (let step = 0; step < 600; step++) {
      state = stepDrive(state, go, 1 / 60, cornerRoad);
      expect(cornerRoad.has(`${state.from.x},${state.from.y}`)).toBe(true);
      expect(cornerRoad.has(`${state.to.x},${state.to.y}`)).toBe(true);
    }
  });

  it('folgt der Kurve, ohne dass der Spieler lenkt', () => {
    const state = run(at(0, 10, { x: 1, y: 10 }), cornerRoad, 6);
    const pose = drivePose(state);
    expect(pose.y).toBeGreaterThan(11);
    expect(pose.x).toBeCloseTo(10.5, 1);
  });

  it('wendet an der Sackgasse, statt stecken zu bleiben', () => {
    const deadEnd: RoadTileSet = new Set(['0,10', '1,10', '2,10']);
    const state = run(at(0, 10, { x: 1, y: 10 }), deadEnd, 6);
    expect(deadEnd.has(`${state.from.x},${state.from.y}`)).toBe(true);
    expect(state.speed).toBeGreaterThan(0);
  });

  it('kommt auf einer geraden Straße wirklich voran', () => {
    const start = drivePose(at(0, 10, { x: 1, y: 10 }));
    const moved = drivePose(run(at(0, 10, { x: 1, y: 10 }), straightRoad, 2));
    expect(moved.x - start.x).toBeGreaterThan(2);
    expect(moved.y).toBeCloseTo(start.y, 5);
  });
});

describe('Kreuzungen', () => {
  it('zählt alle vier Richtungen einer Vollkreuzung auf', () => {
    // Nach Osten fahrend (+x): rechts = +y (Süden), links = −y (Norden).
    const options = turnOptionsAt(crossRoad, { x: 9, y: 10 }, { x: 10, y: 10 });
    expect(options.map((option) => option.turn).sort()).toEqual(['around', 'left', 'right', 'straight']);
    expect(options.find((option) => option.turn === 'right')?.tile).toEqual({ x: 10, y: 11 });
    expect(options.find((option) => option.turn === 'left')?.tile).toEqual({ x: 10, y: 9 });
  });

  it('bietet in der Kurve nur an, was es wirklich gibt', () => {
    const options = turnOptionsAt(cornerRoad, { x: 9, y: 10 }, { x: 10, y: 10 });
    expect(options.map((option) => option.turn).sort()).toEqual(['around', 'right']);
  });

  it('kündigt die nächste Richtungsänderung mit Entfernung an', () => {
    const hint = nextTurn(at(0, 10, { x: 1, y: 10 }), cornerRoad);
    expect(hint?.turn).toBe('right');
    // Von (0,10) bis zur Kurve bei (10,10) sind es zehn Kanten.
    expect(hint?.distanceTiles).toBeCloseTo(10, 5);
  });

  it('meldet die nächste ECHTE Kreuzung, nicht jede Kurve', () => {
    // Eine Kurve ist keine Entscheidung — sie anzukündigen wäre Lärm.
    expect(nextJunction(at(0, 10, { x: 1, y: 10 }), cornerRoad)).toBeUndefined();
    const junction = nextJunction(at(0, 10, { x: 1, y: 10 }), crossRoad);
    // Von der Kachelmitte (0,10) bis zur Kreuzungsmitte (10,10) sind es zehn.
    expect(junction?.distanceTiles).toBeCloseTo(10, 5);
    expect(junction?.options.map((option) => option.turn).sort()).toEqual([
      'around',
      'left',
      'right',
      'straight',
    ]);
  });

  it('zählt die befahrbaren Nachbarn einer Kreuzung', () => {
    expect(roadNeighbours(crossRoad, { x: 10, y: 10 })).toHaveLength(4);
    expect(roadNeighbours(straightRoad, { x: 10, y: 10 })).toHaveLength(2);
  });
});

describe('Die gemerkte Absicht (D-060)', () => {
  it('löst einen frühen Tastendruck an der ERSTEN passenden Kreuzung ein', () => {
    // Der Kern des Fehlers: Früher zählte nur, was im Bild des Grenzübertritts
    // gedrückt war. Hier wird neun Kacheln vorher gedrückt — und es wirkt.
    const state = run(at(0, 10, { x: 1, y: 10 }), crossRoad, 6, { intent: 'right' });
    const pose = drivePose(state);
    expect(pose.x).toBeCloseTo(10.5, 1);
    expect(pose.y).toBeGreaterThan(11);
  });

  it('behält die Absicht, wenn die Richtung an dieser Kreuzung fehlt', () => {
    // Bei x = 5 geht es nur nach Süden ab, „links" gibt es dort nicht. Die
    // Absicht darf NICHT stillschweigend verfallen — sonst hätte der Spieler
    // gedrückt und nichts wäre passiert.
    const early = stepDrive(at(0, 10, { x: 1, y: 10 }), { intent: 'left' }, 1 / 60, twoJunctions);
    const passed = run(early, twoJunctions, 3);
    const pose = drivePose(passed);
    expect(pose.x).toBeGreaterThan(6);
    // An der Vollkreuzung x = 12 wird sie eingelöst: links = Norden.
    const arrived = run(passed, twoJunctions, 6);
    expect(drivePose(arrived).y).toBeLessThan(10);
  });

  it('vergisst die Absicht, sobald sie eingelöst ist', () => {
    const turned = run(at(0, 10, { x: 1, y: 10 }), crossRoad, 6, { intent: 'right' });
    expect(turned.intent).toBeUndefined();
  });

  it('wendet auf freier Strecke, ohne Sackgasse und ohne Rückwärtsgang', () => {
    // Bewusst in der MITTE der Straße starten: Am westlichen Ende wendet das
    // Fahrzeug ohnehin von selbst (Sackgasse), der Test würde dann das Falsche
    // beweisen.
    const before = run(at(10, 10, { x: 11, y: 10 }), straightRoad, 2);
    const turning = run(before, straightRoad, 1, { intent: 'around' });
    // Nach dem Wenden zeigt die Kante nach Westen.
    expect(turning.to.x).toBeLessThan(turning.from.x);
    expect(turning.speed).toBeGreaterThan(0);
  });

  it('lässt eine neue Absicht die alte ersetzen', () => {
    const pending = stepDrive(at(0, 10, { x: 1, y: 10 }), { intent: 'right' }, 1 / 60, crossRoad);
    expect(pending.intent).toBe('right');
    const changed = stepDrive(pending, { intent: 'left' }, 1 / 60, crossRoad);
    expect(changed.intent).toBe('left');
  });
});

describe('Ankunft und Reinheit', () => {
  it('erkennt ein Ziel am Rand seines Footprints', () => {
    expect(reachedTarget({ x: 10, y: 10 }, { x: 9, y: 9 }, { w: 2, h: 2 })).toBe(true);
    expect(reachedTarget({ x: 18, y: 10 }, { x: 9, y: 9 }, { w: 2, h: 2 })).toBe(false);
  });

  it('verändert den übergebenen Zustand nicht', () => {
    const before = at(3, 10, { x: 4, y: 10 }, 2);
    const snapshot = JSON.parse(JSON.stringify(before));
    stepDrive(before, go, 0.4, straightRoad);
    expect(before).toEqual(snapshot);
  });

  it('ist deterministisch', () => {
    const a = run(at(0, 10, { x: 1, y: 10 }), crossRoad, 3, { intent: 'right' });
    const b = run(at(0, 10, { x: 1, y: 10 }), crossRoad, 3, { intent: 'right' });
    expect(a).toEqual(b);
  });

  it('leitet Position und Blickrichtung aus der Kante ab', () => {
    const pose = drivePose({ from: { x: 4, y: 7 }, to: { x: 5, y: 7 }, t: 0.5, speed: 0 });
    expect(pose.x).toBeCloseTo(5, 5);
    expect(pose.y).toBeCloseTo(7.5, 5);
    // heading = atan2(dx, dy); nach Osten (+x) sind das π/2.
    expect(pose.heading).toBeCloseTo(Math.PI / 2, 5);
  });
});
