import { beforeEach, describe, expect, it } from 'vitest';
import {
  DAY_ONLY_TIME_OF_DAY,
  getEnvironmentSettings,
  resetEnvironmentSettings,
  setEnvironmentSettings,
} from '../src/renderer/three/environmentSettings.ts';
import { gameClockAt, SIM_MS_PER_GAME_MINUTE } from '../src/game/time/gameTime.ts';

// § Prototyp-Zeitsystem — GAME TIME und VISUAL TIME OF DAY sind getrennt.
//
// Die Welt bleibt im Prototyp dauerhaft hell, die Spieluhr läuft normal weiter.
// Genau diese Trennung wird hier geprüft: Ein Test, der nur den Schalter setzt,
// würde übersehen, dass die Uhr (und mit ihr Bau-, Betriebs- und Missionszeiten)
// mit hängen bleibt.
//
// Durchgesetzt wird der Modus in `sanitize` — also beim Wert selbst, nicht bei
// den Lesern: `SkyEnvironment`, Straßenlaternen und das Sonnen-Grading lesen
// `timeOfDay` direkt.

describe('visualTimeMode: day_only', () => {
  beforeEach(() => {
    resetEnvironmentSettings();
  });

  it('ist der Prototyp-Standard', () => {
    expect(getEnvironmentSettings().visualTimeMode).toBe('day_only');
    expect(getEnvironmentSettings().timeOfDay).toBe(DAY_ONLY_TIME_OF_DAY);
  });

  it('lässt keinen Nachtwert durch — egal wer schreibt', () => {
    setEnvironmentSettings({ timeOfDay: 0.95, cycle: true });
    const env = getEnvironmentSettings();
    expect(env.timeOfDay).toBe(DAY_ONLY_TIME_OF_DAY);
    expect(env.cycle).toBe(false);
  });

  it('bleibt über jede Tageszeit der Uhr hell', () => {
    for (const minuteOfDay of [0, 180, 360, 720, 1080, 1380]) {
      setEnvironmentSettings({ timeOfDay: minuteOfDay / 1440 });
      expect(getEnvironmentSettings().timeOfDay).toBe(DAY_ONLY_TIME_OF_DAY);
    }
  });

  it('gibt die Kopplung im Modus `dynamic` wieder frei', () => {
    setEnvironmentSettings({ visualTimeMode: 'dynamic', timeOfDay: 0.95 });
    expect(getEnvironmentSettings().timeOfDay).toBeCloseTo(0.95, 5);
    // …und zurück: der Schaltvorgang selbst stellt den Tag wieder her.
    setEnvironmentSettings({ visualTimeMode: 'day_only' });
    expect(getEnvironmentSettings().timeOfDay).toBe(DAY_ONLY_TIME_OF_DAY);
  });
});

describe('die Spieluhr bleibt davon unberührt', () => {
  it('läuft über Tage weiter, während die Darstellung steht', () => {
    const createdAt = 0;
    // Zwei volle Ingame-Tage in Ingame-Minuten → Simulationszeit.
    const twoDays = 2 * 24 * 60 * SIM_MS_PER_GAME_MINUTE;
    const start = gameClockAt(createdAt, 0);
    const later = gameClockAt(createdAt, twoDays);

    expect(later.day).toBe(start.day + 2);
    expect(later.hour).toBe(start.hour);
    // Die Uhr durchläuft dabei sehr wohl die Nacht …
    const midnight = gameClockAt(createdAt, 16 * 60 * SIM_MS_PER_GAME_MINUTE);
    expect(midnight.timeOfDay).toBeCloseTo(0, 5);
    // … die Darstellung nicht.
    resetEnvironmentSettings();
    setEnvironmentSettings({ timeOfDay: midnight.timeOfDay });
    expect(getEnvironmentSettings().timeOfDay).toBe(DAY_ONLY_TIME_OF_DAY);
  });
});
