// Player-tunable day/night settings (v0.37). Same framework-agnostic pattern as
// cameraSettings.ts: a tiny store that BOTH the React HUD and the (non-React)
// SkyEnvironment read/write without depending on Zustand or three. Persisted in
// localStorage under its own key — NOT part of the savegame, so no schema bump
// and old saves keep loading unchanged (CLAUDE.md §3).

export type WeatherMode = 'clear' | 'rain' | 'fog';

/**
 * Wie die **Darstellung** mit der Ingame-Uhr umgeht (§ Prototyp-Zeitsystem).
 *
 * `day_only` — die Welt bleibt dauerhaft im Tageszustand. `dynamic` — die Sonne
 * folgt der Uhr (D-038, Verhalten seit v0.89).
 *
 * **Die Spieluhr ist davon nicht betroffen.** `gameTime.ts` bleibt die eine
 * Simulationsuhr; Tag, Uhrzeit und Jahreszeit laufen im HUD unverändert weiter.
 * Getrennt wird ausschließlich GAME TIME (Simulation) von VISUAL TIME OF DAY
 * (Beleuchtung) — deshalb liegt der Schalter hier bei den rein visuellen
 * Einstellungen und nicht in `gameTime.ts`.
 */
export type VisualTimeMode = 'day_only' | 'dynamic';

/**
 * Fester Sonnenstand im `day_only`-Modus: heller Vormittag. Bewusst nicht
 * 0.5 (Zenit) — dort stehen die Schatten senkrecht und das Relief verschwindet.
 */
export const DAY_ONLY_TIME_OF_DAY = 0.36;

export interface EnvironmentSettings {
  /** Auto-advance the time of day (the sun keeps moving). */
  cycle: boolean;
  /** Fixed/base time of day in [0,1): 0 = midnight, 0.25 = sunrise, 0.5 = noon. */
  timeOfDay: number;
  /** Real minutes for one full in-game day when the cycle runs (1–30). */
  dayLengthMin: number;
  /** Purely visual atmosphere preset. Never affects the simulation or saves. */
  weather: WeatherMode;
  /** Tag/Nacht-Darstellung. Prototyp-Standard: immer Tag. */
  visualTimeMode: VisualTimeMode;
}

export const DEFAULT_ENVIRONMENT_SETTINGS: EnvironmentSettings = {
  // Default OFF at a pleasant mid-morning so nothing changes disruptively until
  // the player enables the cycle from the HUD.
  cycle: false,
  timeOfDay: DAY_ONLY_TIME_OF_DAY,
  dayLengthMin: 8,
  weather: 'clear',
  visualTimeMode: 'day_only',
};

const KEY = 'cmb.environment';

function clampNum(v: unknown, lo: number, hi: number, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback;
}

function sanitize(raw: unknown): EnvironmentSettings {
  const o = (raw ?? {}) as Partial<EnvironmentSettings>;
  const d = DEFAULT_ENVIRONMENT_SETTINGS;
  const visualTimeMode: VisualTimeMode = o.visualTimeMode === 'dynamic' ? 'dynamic' : d.visualTimeMode;
  // `day_only` wird HIER durchgesetzt, nicht bei jedem Leser: `SkyEnvironment`
  // und der Renderer lesen `timeOfDay`/`cycle` direkt. Würde der Modus nur die
  // schreibende Stelle filtern, hielte ein alter localStorage-Eintrag (oder ein
  // künftiger zweiter Schreiber) die Welt weiter in der Nacht.
  const dayOnly = visualTimeMode === 'day_only';
  return {
    cycle: dayOnly ? false : typeof o.cycle === 'boolean' ? o.cycle : d.cycle,
    // timeOfDay wraps, but clamp defensively into [0,1) for storage.
    timeOfDay: dayOnly ? DAY_ONLY_TIME_OF_DAY : clampNum(o.timeOfDay, 0, 0.9999, d.timeOfDay),
    dayLengthMin: clampNum(o.dayLengthMin, 1, 30, d.dayLengthMin),
    weather: o.weather === 'rain' || o.weather === 'fog' || o.weather === 'clear' ? o.weather : d.weather,
    visualTimeMode,
  };
}

function load(): EnvironmentSettings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? sanitize(JSON.parse(raw)) : { ...DEFAULT_ENVIRONMENT_SETTINGS };
  } catch {
    return { ...DEFAULT_ENVIRONMENT_SETTINGS };
  }
}

let current: EnvironmentSettings = load();
const listeners = new Set<() => void>();

export function getEnvironmentSettings(): EnvironmentSettings {
  return current;
}

export function setEnvironmentSettings(patch: Partial<EnvironmentSettings>): void {
  current = sanitize({ ...current, ...patch });
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* ignore storage failures */
  }
  for (const l of listeners) l();
}

export function resetEnvironmentSettings(): void {
  setEnvironmentSettings({ ...DEFAULT_ENVIRONMENT_SETTINGS });
}

/** Subscribe to changes (returns an unsubscribe). Used by the React HUD and the
 *  SkyEnvironment so a slider drag applies live. */
export function subscribeEnvironmentSettings(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
