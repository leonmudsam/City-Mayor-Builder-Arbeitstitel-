import type { GameState } from '../types.ts';

// § Spielbarkeit 9.1 / P-B — EINE verbindliche Ingame-Zeit (D-038).
//
// Es gibt genau eine Simulationsuhr: `state.meta.lastSimTime` (ms). Sie wird im
// Controller ausschließlich über `advanceByRealTime(realMs, live)` vorgeschoben,
// dort mit der gewählten Geschwindigkeit multipliziert. Dadurch fließen ALLE
// zeitabhängigen Systeme (Bau, Upgrades, Betriebe, Transport, Wirtschaft, Uhr)
// durch denselben Zeittakt — Pause hält alles an, 2×/4× beschleunigen alles
// gemeinsam. Dieses Modul ist die **reine Projektion** dieser einen Uhr auf die
// sichtbare Ingame-Zeit (Tag/Stunde/Minute/Jahreszeit). Kein RNG, kein State,
// keine Renderer-/React-Importe (CLAUDE.md §1).

/**
 * Simulationszeit (ms), die einer **Ingame-Minute bei 1×** entspricht: 4 s.
 * Da `lastSimTime` bei 1× in Echtzeit läuft, vergeht so bei 1× eine Ingame-Minute
 * je 4 Echtzeitsekunden (15 Ingame-Minuten je Echtzeitminute); 2× → 2 s, 4× → 1 s.
 * Ein voller Ingame-Tag (1440 Min) dauert damit bei 1× 96 Echtzeitminuten, bei 4×
 * 24 — lebendig genug, um die an die Uhr **gekoppelte** Sonne sichtbar wandern zu
 * lassen (Nutzerentscheid 24.07.2026: schnellere Uhr + gekoppelte Sonne, D-038).
 * Zentrale Zahl — kein anderes System darf einen eigenen Zeitfaktor führen.
 */
export const SIM_MS_PER_GAME_MINUTE = 4_000;

export const GAME_MINUTES_PER_HOUR = 60;
export const GAME_MINUTES_PER_DAY = 24 * 60;
/** Länge einer Jahreszeit in Ingame-Tagen (rein für die Anzeige). */
export const GAME_DAYS_PER_SEASON = 28;

/** Startzeit des ersten Tages (08:00) — neue Städte beginnen am Morgen. */
export const START_MINUTE_OF_DAY = 8 * 60;

export const SEASON_KEYS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type SeasonKey = (typeof SEASON_KEYS)[number];

/** Multiplikatoren realer→simulierter Zeit (0 = Pause). Spiegelt `SimulationSpeed`. */
export const GAME_SPEED_MULTIPLIERS = { paused: 0, normal: 1, fast: 2, veryFast: 4 } as const;

export interface GameClock {
  /** Ingame-Minuten seit Gründung inkl. Startoffset (ganzzahlig). */
  totalMinutes: number;
  /** 1-basierter Ingame-Tag. */
  day: number;
  hour: number;
  minute: number;
  /** Minute innerhalb des Tages (0..1439). */
  minuteOfDay: number;
  /** 0 = Mitternacht, 0.5 = Mittag. */
  timeOfDay: number;
  seasonKey: SeasonKey;
  seasonIndex: number;
}

/** Vergangene Ingame-Minuten (Fließkomma) zwischen Gründung und Simulationszeit. */
export function gameMinutesElapsed(createdAt: number, simTime: number): number {
  return Math.max(0, (simTime - createdAt) / SIM_MS_PER_GAME_MINUTE);
}

/** Reine Projektion der einen Simulationsuhr auf die sichtbare Ingame-Zeit. */
export function gameClockAt(createdAt: number, simTime: number): GameClock {
  const totalMinutes = Math.floor(gameMinutesElapsed(createdAt, simTime)) + START_MINUTE_OF_DAY;
  const day = Math.floor(totalMinutes / GAME_MINUTES_PER_DAY) + 1;
  const minuteOfDay = ((totalMinutes % GAME_MINUTES_PER_DAY) + GAME_MINUTES_PER_DAY) % GAME_MINUTES_PER_DAY;
  const seasonIndex = Math.floor((day - 1) / GAME_DAYS_PER_SEASON) % SEASON_KEYS.length;
  return {
    totalMinutes,
    day,
    hour: Math.floor(minuteOfDay / GAME_MINUTES_PER_HOUR),
    minute: minuteOfDay % GAME_MINUTES_PER_HOUR,
    minuteOfDay,
    timeOfDay: minuteOfDay / GAME_MINUTES_PER_DAY,
    seasonKey: SEASON_KEYS[seasonIndex]!,
    seasonIndex,
  };
}

export function gameClock(state: Pick<GameState, 'meta'>): GameClock {
  return gameClockAt(state.meta.createdAt, state.meta.lastSimTime);
}

/** HH:MM aus einer Uhr (Anzeige). */
export function formatClockTime(clock: Pick<GameClock, 'hour' | 'minute'>): string {
  return `${String(clock.hour).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')}`;
}

/** Ingame-Minuten → Simulations-Millisekunden (für Dauern; P-B2). */
export function gameMinutesToSimMs(minutes: number): number {
  return minutes * SIM_MS_PER_GAME_MINUTE;
}

/** Simulations-Millisekunden → Ingame-Minuten (Dauer-Anzeige). */
export function simMsToGameMinutes(ms: number): number {
  return ms / SIM_MS_PER_GAME_MINUTE;
}
