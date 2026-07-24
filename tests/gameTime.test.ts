import { describe, expect, it } from 'vitest';
import { nearTownHall, newController, T0 } from './helpers.ts';
import { exportSave } from '../src/game/storage/exportImport.ts';
import { migrateAndValidate } from '../src/game/storage/migrations.ts';
import { GameController } from '../src/game/commands/controller.ts';
import {
  gameClockAt,
  SIM_MS_PER_GAME_MINUTE,
  START_MINUTE_OF_DAY,
  GAME_MINUTES_PER_DAY,
} from '../src/game/time/gameTime.ts';

// § Spielbarkeit 9.1 / P-B — EINE verbindliche Ingame-Zeit. Belegt §17 „Zeit" +
// „Zeitabhängige Systeme": Uhr ist reine Projektion der Simulationszeit, 1×/2×/4×
// skalieren ALLES gemeinsam, Pause friert alles ein, Save/Load erhält die Uhr.

const at = (dx: number, dy: number) => nearTownHall(dx, dy);

/** Ein frisch platziertes, noch bauendes Haus (für Bauzeit-Tests). */
function constructingCity() {
  const bundle = newController();
  const { controller } = bundle;
  controller.state.resources = { money: 100_000, wood: 500, stone: 500, food: 500, freshwater: 0 };
  for (let dx = 3; dx <= 12; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
  const placed = controller.placeBuilding('house_small', at(6, 6).x, at(6, 6).y);
  if (!placed.ok) throw new Error(`house_small placement failed: ${JSON.stringify(placed)}`);
  return bundle;
}

describe('P-B Ingame-Zeit — Uhr ist reine Projektion der Simulationszeit', () => {
  it('startet am Morgen (Tag 1, 08:00) und rechnet Minuten korrekt', () => {
    const clock = gameClockAt(T0, T0);
    expect(clock.day).toBe(1);
    expect(clock.hour).toBe(8);
    expect(clock.minute).toBe(0);
    expect(clock.minuteOfDay).toBe(START_MINUTE_OF_DAY);
    // Eine Ingame-Minute vergeht je SIM_MS_PER_GAME_MINUTE Simulationszeit.
    const oneMin = gameClockAt(T0, T0 + SIM_MS_PER_GAME_MINUTE);
    expect(oneMin.minute).toBe(1);
    const oneHour = gameClockAt(T0, T0 + 60 * SIM_MS_PER_GAME_MINUTE);
    expect(oneHour.hour).toBe(9);
  });

  it('rollt Tag und Jahreszeit über (Tag 2 nach 24 Ingame-Stunden)', () => {
    const nextDay = gameClockAt(T0, T0 + GAME_MINUTES_PER_DAY * SIM_MS_PER_GAME_MINUTE);
    expect(nextDay.day).toBe(2);
    expect(nextDay.hour).toBe(8); // gleicher Startoffset
    const start = gameClockAt(T0, T0);
    expect(start.seasonKey).toBe('spring');
  });

  it('1× lässt die Uhr in Echtzeit laufen (1 Ingame-Min je SIM_MS_PER_GAME_MINUTE)', () => {
    const { controller } = newController();
    controller.setSpeed(1);
    controller.advanceByRealTime(SIM_MS_PER_GAME_MINUTE, false);
    expect(controller.getGameClock().minute).toBe(1);
  });

  it('2× und 4× beschleunigen die Uhr exakt proportional', () => {
    const base = newController().controller;
    const fast = newController().controller;
    const faster = newController().controller;
    base.setSpeed(1);
    fast.setSpeed(2);
    faster.setSpeed(4);
    const real = 30 * SIM_MS_PER_GAME_MINUTE;
    base.advanceByRealTime(real, false);
    fast.advanceByRealTime(real, false);
    faster.advanceByRealTime(real, false);
    const b = base.state.meta.lastSimTime - T0;
    expect(fast.state.meta.lastSimTime - T0).toBe(b * 2);
    expect(faster.state.meta.lastSimTime - T0).toBe(b * 4);
    // …und damit auch die Uhr (dieselbe Projektion).
    expect(fast.getGameClock().totalMinutes - START_MINUTE_OF_DAY).toBe(
      (base.getGameClock().totalMinutes - START_MINUTE_OF_DAY) * 2,
    );
  });

  it('Pause friert die Simulationszeit und alle zeitabhängigen Systeme ein', () => {
    const { controller } = constructingCity();
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;
    expect(house.status).toBe('constructing');
    const simBefore = controller.state.meta.lastSimTime;
    const endsBefore = house.constructionEndsAt;
    const clockBefore = controller.getGameClock().totalMinutes;
    controller.setSpeed(0);
    controller.advanceByRealTime(10 * 60_000, true); // 10 Minuten real
    expect(controller.state.meta.lastSimTime).toBe(simBefore); // keine Sim-Zeit vergangen
    expect(house.status).toBe('constructing'); // Bau steht still
    expect(house.constructionEndsAt).toBe(endsBefore);
    expect(controller.getGameClock().totalMinutes).toBe(clockBefore); // Uhr steht still
  });

  it('Bauzeit skaliert mit der Geschwindigkeit (2× baut in halber Echtzeit)', () => {
    const slow = constructingCity().controller;
    const quick = constructingCity().controller;
    const houseSlow = Object.values(slow.state.buildings).find((b) => b.defId === 'house_small')!;
    const buildMs = houseSlow.constructionEndsAt! - slow.state.meta.lastSimTime;
    expect(buildMs).toBeGreaterThan(0);
    slow.setSpeed(1);
    quick.setSpeed(2);
    // Halbe reale Bauzeit: bei 1× noch nicht fertig, bei 2× fertig.
    slow.advanceByRealTime(buildMs / 2, false);
    quick.advanceByRealTime(buildMs / 2, false);
    expect(slow.state.buildings[houseSlow.id]!.status).toBe('constructing');
    expect(Object.values(quick.state.buildings).find((b) => b.defId === 'house_small')!.status).toBe('active');
  });

  it('Save/Load erhält die Uhr (createdAt + lastSimTime)', () => {
    const { controller, config } = newController();
    controller.setSpeed(4);
    controller.advanceByRealTime(123 * SIM_MS_PER_GAME_MINUTE, false);
    const before = controller.getGameClock();
    const restored = migrateAndValidate(JSON.parse(exportSave(controller.state)));
    const reloaded = new GameController(config, restored);
    expect(reloaded.getGameClock()).toEqual(before);
  });
});
