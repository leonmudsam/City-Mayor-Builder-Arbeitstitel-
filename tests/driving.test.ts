// § Stadtarbeit-Overhaul — die EINE Fahrphysik, seit P3 straßengebunden.
//
// Die Tests prüfen bewusst die reine Funktion und nicht die Karte: `stepDrive`
// ist die Dynamik von 3D-Welt UND 2D-Logistikkarte (CLAUDE.md §2/§8). Was hier
// grün ist, gilt in beiden Ansichten — und was hier fehlt, kann in einer der
// beiden abweichen, ohne dass es jemand merkt.

import { describe, expect, it } from 'vitest';
import {
  DRIVE_DEFAULT_MAX_SPEED,
  DRIVE_KEYS,
  DRIVE_REVERSE_FACTOR,
  beginDrive,
  chooseNext,
  driveInputFromKeys,
  drivePose,
  nextTurn,
  reachedTarget,
  roadNeighbours,
  stepDrive,
  vehicleTileSpeed,
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

const at = (x: number, y: number, to: { x: number; y: number }, speed = 0): DriveState => ({
  from: { x, y },
  to,
  t: 0,
  speed,
});

const gas = { forward: 1, steer: 0 };
const coast = { forward: 0, steer: 0 };

function run(state: DriveState, roads: RoadTileSet, seconds: number, input = gas, maxSpeed?: number): DriveState {
  let current = state;
  const dt = 1 / 60;
  for (let step = 0; step < Math.round(seconds * 60); step++) {
    current = stepDrive(current, input, dt, roads, maxSpeed);
  }
  return current;
}

describe('Steuerung', () => {
  it('WASD und Pfeiltasten sind gleichwertig', () => {
    expect(driveInputFromKeys(new Set(['w']))).toEqual(driveInputFromKeys(new Set(['arrowup'])));
    expect(driveInputFromKeys(new Set(['s']))).toEqual(driveInputFromKeys(new Set(['arrowdown'])));
    expect(driveInputFromKeys(new Set(['a']))).toEqual(driveInputFromKeys(new Set(['arrowleft'])));
    expect(driveInputFromKeys(new Set(['d']))).toEqual(driveInputFromKeys(new Set(['arrowright'])));
  });

  it('kennt genau die acht Fahrtasten', () => {
    expect([...DRIVE_KEYS].sort()).toEqual(
      ['a', 'arrowdown', 'arrowleft', 'arrowright', 'arrowup', 'd', 's', 'w'].sort(),
    );
  });

  it('gegenläufige Tasten heben sich auf', () => {
    expect(driveInputFromKeys(new Set(['w', 's']))).toEqual({ forward: 0, steer: 0 });
    expect(driveInputFromKeys(new Set(['a', 'd']))).toEqual({ forward: 0, steer: 0 });
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
  it('beschleunigt unter Gas und deckelt auf die Fahrzeug-Höchstgeschwindigkeit', () => {
    const rolling = run(at(0, 10, { x: 1, y: 10 }), straightRoad, 0.5);
    expect(rolling.speed).toBeGreaterThan(0);
    const flatOut = run(at(0, 10, { x: 1, y: 10 }), straightRoad, 8);
    expect(flatOut.speed).toBeCloseTo(DRIVE_DEFAULT_MAX_SPEED, 5);
  });

  it('rollt ohne Eingabe aus, statt sofort zu stehen', () => {
    const moving = run(at(0, 10, { x: 1, y: 10 }), straightRoad, 2);
    const coasted = stepDrive(moving, coast, 0.2, straightRoad);
    expect(coasted.speed).toBeLessThan(moving.speed);
    expect(coasted.speed).toBeGreaterThan(0);
  });

  it('fährt rückwärts deutlich langsamer als vorwärts', () => {
    const reversing = run(at(5, 10, { x: 6, y: 10 }), straightRoad, 6, { forward: -1, steer: 0 });
    expect(reversing.speed).toBeLessThan(0);
    expect(Math.abs(reversing.speed)).toBeCloseTo(DRIVE_DEFAULT_MAX_SPEED * DRIVE_REVERSE_FACTOR, 5);
  });

  it('rechnet die Fahrzeug-Höchstgeschwindigkeit aus der Config-Angabe', () => {
    // 80 km/h bei 4 m je Kachel = 5,55 Kacheln/s.
    expect(vehicleTileSpeed(80)).toBeCloseTo(5.555, 2);
    expect(vehicleTileSpeed(0)).toBe(DRIVE_DEFAULT_MAX_SPEED);
    const slow = run(at(0, 10, { x: 1, y: 10 }), straightRoad, 8, gas, vehicleTileSpeed(22));
    expect(slow.speed).toBeCloseTo(vehicleTileSpeed(22), 5);
  });
});

describe('Straßenbindung', () => {
  it('bleibt IMMER auf der Straße — auch nach langer Fahrt', () => {
    let state = at(0, 10, { x: 1, y: 10 });
    for (let step = 0; step < 600; step++) {
      state = stepDrive(state, gas, 1 / 60, cornerRoad);
      expect(cornerRoad.has(`${state.from.x},${state.from.y}`)).toBe(true);
      expect(cornerRoad.has(`${state.to.x},${state.to.y}`)).toBe(true);
    }
  });

  it('folgt der Kurve, ohne dass der Spieler lenkt', () => {
    // Genau das ist der Kern von §6: „Das Fahrzeug fährt automatisch auf dem
    // Straßennetz. Der Spieler steuert NICHT pixelgenau."
    const state = run(at(0, 10, { x: 1, y: 10 }), cornerRoad, 6);
    const pose = drivePose(state);
    expect(pose.y).toBeGreaterThan(11);
    expect(pose.x).toBeCloseTo(10.5, 1);
  });

  it('wendet an der Sackgasse, statt stecken zu bleiben', () => {
    const deadEnd: RoadTileSet = new Set(['0,10', '1,10', '2,10']);
    const state = run(at(0, 10, { x: 1, y: 10 }), deadEnd, 6);
    expect(deadEnd.has(`${state.from.x},${state.from.y}`)).toBe(true);
    expect(Math.abs(state.speed)).toBeGreaterThan(0);
  });

  it('kommt auf einer geraden Straße wirklich voran', () => {
    const start = drivePose(at(0, 10, { x: 1, y: 10 }));
    const moved = drivePose(run(at(0, 10, { x: 1, y: 10 }), straightRoad, 2));
    expect(moved.x - start.x).toBeGreaterThan(2);
    expect(moved.y).toBeCloseTo(start.y, 5);
  });
});

describe('Kreuzungen', () => {
  it('fährt ohne Lenktaste geradeaus durch', () => {
    expect(chooseNext(crossRoad, { x: 9, y: 10 }, { x: 10, y: 10 }, 0)).toEqual({ x: 11, y: 10 });
  });

  it('biegt mit A nach links und mit D nach rechts ab', () => {
    // Nach Osten fahrend (+x): rechts = +y (Süden), links = −y (Norden).
    expect(chooseNext(crossRoad, { x: 9, y: 10 }, { x: 10, y: 10 }, 1)).toEqual({ x: 10, y: 11 });
    expect(chooseNext(crossRoad, { x: 9, y: 10 }, { x: 10, y: 10 }, -1)).toEqual({ x: 10, y: 9 });
  });

  it('nimmt die einzige Abzweigung, wenn es nicht geradeaus weitergeht', () => {
    expect(chooseNext(cornerRoad, { x: 9, y: 10 }, { x: 10, y: 10 }, 0)).toEqual({ x: 10, y: 11 });
  });

  it('kündigt die nächste Richtungsänderung mit Entfernung an', () => {
    const hint = nextTurn(at(0, 10, { x: 1, y: 10 }), cornerRoad);
    expect(hint?.turn).toBe('right');
    // Von (0,10) bis zur Kurve bei (10,10) sind es zehn Kanten.
    expect(hint?.distanceTiles).toBeCloseTo(10, 5);
  });

  it('zählt die befahrbaren Nachbarn einer Kreuzung', () => {
    expect(roadNeighbours(crossRoad, { x: 10, y: 10 })).toHaveLength(4);
    expect(roadNeighbours(straightRoad, { x: 10, y: 10 })).toHaveLength(2);
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
    stepDrive(before, gas, 0.4, straightRoad);
    expect(before).toEqual(snapshot);
  });

  it('ist deterministisch', () => {
    const a = run(at(0, 10, { x: 1, y: 10 }), crossRoad, 3, { forward: 1, steer: 1 });
    const b = run(at(0, 10, { x: 1, y: 10 }), crossRoad, 3, { forward: 1, steer: 1 });
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
