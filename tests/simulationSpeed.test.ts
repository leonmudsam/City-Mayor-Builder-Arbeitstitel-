import { describe, expect, it } from 'vitest';
import { newController, T0 } from './helpers.ts';

// § Overhaul 8.0 / §26 — Pause und Zeitfaktoren steuern die ECHTE Simulation.
// Vorher änderten die HUD-Knöpfe „▶ / 1× / 2× / 4×" ausschließlich die visuelle
// Tageslänge (`environmentSettings.dayLengthMin`); Einnahmen, Verbrauch,
// Produktion und Bauzeit liefen unverändert weiter. Diese Suite hält den neuen
// Vertrag fest: reale Zeit × Geschwindigkeit = Simulationszeit, ein einziger
// Tick-Pfad für alles.

const ONE_MINUTE = 60_000;

describe('GameController — Simulationsgeschwindigkeit (§26)', () => {
  it('startet bei 1×', () => {
    const { controller } = newController();
    expect(controller.getSpeed()).toBe(1);
  });

  it('Pause hält die Simulationsuhr vollständig an', () => {
    const { controller } = newController();
    controller.setSpeed(0);
    const before = controller.state.meta.lastSimTime;
    const playTime = controller.state.meta.playTimeSec;
    const money = controller.state.resources.money;
    controller.advanceByRealTime(10 * ONE_MINUTE, true);
    expect(controller.state.meta.lastSimTime).toBe(before);
    expect(controller.state.meta.playTimeSec).toBe(playTime);
    expect(controller.state.resources.money).toBe(money);
  });

  it('1× übersetzt reale Zeit eins zu eins in Simulationszeit', () => {
    const { controller } = newController();
    const before = controller.state.meta.lastSimTime;
    controller.advanceByRealTime(ONE_MINUTE, true);
    expect(controller.state.meta.lastSimTime).toBe(before + ONE_MINUTE);
  });

  it('2× und 4× verdoppeln bzw. vervierfachen die vergangene Simulationszeit', () => {
    const double = newController().controller;
    double.setSpeed(2);
    const doubleStart = double.state.meta.lastSimTime;
    double.advanceByRealTime(ONE_MINUTE, true);
    expect(double.state.meta.lastSimTime - doubleStart).toBe(2 * ONE_MINUTE);

    const quad = newController().controller;
    quad.setSpeed(4);
    const quadStart = quad.state.meta.lastSimTime;
    quad.advanceByRealTime(ONE_MINUTE, true);
    expect(quad.state.meta.lastSimTime - quadStart).toBe(4 * ONE_MINUTE);
  });

  it('4× skaliert Einnahmen UND Verbrauch gleichermaßen — nicht nur das Geld', () => {
    // Zwei identische Städte: eine läuft 4 reale Minuten bei 1×, die andere
    // 1 reale Minute bei 4×. Beide erleben exakt 4 Simulationsminuten und
    // müssen deshalb im selben Zustand landen.
    const slow = newController(T0).controller;
    const fast = newController(T0).controller;
    fast.setSpeed(4);

    slow.advanceByRealTime(4 * ONE_MINUTE, true);
    fast.advanceByRealTime(ONE_MINUTE, true);

    expect(fast.state.meta.lastSimTime).toBe(slow.state.meta.lastSimTime);
    expect(fast.state.meta.playTimeSec).toBeCloseTo(slow.state.meta.playTimeSec, 6);
    expect(fast.state.resources.money).toBeCloseTo(slow.state.resources.money, 6);
    expect(fast.state.resources.food).toBeCloseTo(slow.state.resources.food, 6);
    expect(fast.state.resources.wood).toBeCloseTo(slow.state.resources.wood, 6);
    expect(fast.state.citizens.population).toBeCloseTo(slow.state.citizens.population, 6);
    expect(fast.state.citizens.happiness).toBeCloseTo(slow.state.citizens.happiness, 6);
  });

  it('die Tickfrequenz verändert die Wirtschaft nicht (keine FPS-Abhängigkeit)', () => {
    // Dieselbe Simulationszeit, einmal in einem Schritt und einmal in 60
    // kleinen Schritten: Render-/Tickrate darf die Ökonomie nicht beeinflussen.
    const coarse = newController(T0).controller;
    const fine = newController(T0).controller;
    coarse.advanceByRealTime(ONE_MINUTE, true);
    for (let i = 0; i < 60; i++) fine.advanceByRealTime(1_000, true);

    expect(fine.state.meta.lastSimTime).toBe(coarse.state.meta.lastSimTime);
    expect(fine.state.resources.money).toBeCloseTo(coarse.state.resources.money, 3);
    expect(fine.state.citizens.population).toBeCloseTo(coarse.state.citizens.population, 3);
  });

  it('nach dem Fortsetzen läuft die Simulation normal weiter', () => {
    const { controller } = newController();
    controller.setSpeed(0);
    controller.advanceByRealTime(5 * ONE_MINUTE, true);
    const paused = controller.state.meta.lastSimTime;
    controller.setSpeed(1);
    controller.advanceByRealTime(ONE_MINUTE, true);
    expect(controller.state.meta.lastSimTime).toBe(paused + ONE_MINUTE);
  });

  it('meldet eine Änderung der Geschwindigkeit an die UI', () => {
    const { controller } = newController();
    const version = controller.version;
    controller.setSpeed(2);
    expect(controller.version).toBeGreaterThan(version);
    // Dieselbe Stufe erneut zu setzen erzeugt kein überflüssiges Re-Render.
    const settled = controller.version;
    controller.setSpeed(2);
    expect(controller.version).toBe(settled);
  });
});
