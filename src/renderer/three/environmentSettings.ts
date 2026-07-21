// Player-tunable day/night settings (v0.37). Same framework-agnostic pattern as
// cameraSettings.ts: a tiny store that BOTH the React HUD and the (non-React)
// SkyEnvironment read/write without depending on Zustand or three. Persisted in
// localStorage under its own key — NOT part of the savegame, so no schema bump
// and old saves keep loading unchanged (CLAUDE.md §3).

export type WeatherMode = 'clear' | 'rain' | 'fog';

export interface EnvironmentSettings {
  /** Auto-advance the time of day (the sun keeps moving). */
  cycle: boolean;
  /** Fixed/base time of day in [0,1): 0 = midnight, 0.25 = sunrise, 0.5 = noon. */
  timeOfDay: number;
  /** Real minutes for one full in-game day when the cycle runs (1–30). */
  dayLengthMin: number;
  /** Purely visual atmosphere preset. Never affects the simulation or saves. */
  weather: WeatherMode;
}

export const DEFAULT_ENVIRONMENT_SETTINGS: EnvironmentSettings = {
  // Default OFF at a pleasant mid-morning so nothing changes disruptively until
  // the player enables the cycle from the HUD.
  cycle: false,
  timeOfDay: 0.34,
  dayLengthMin: 8,
  weather: 'clear',
};

const KEY = 'cmb.environment';

function clampNum(v: unknown, lo: number, hi: number, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback;
}

function sanitize(raw: unknown): EnvironmentSettings {
  const o = (raw ?? {}) as Partial<EnvironmentSettings>;
  const d = DEFAULT_ENVIRONMENT_SETTINGS;
  return {
    cycle: typeof o.cycle === 'boolean' ? o.cycle : d.cycle,
    // timeOfDay wraps, but clamp defensively into [0,1) for storage.
    timeOfDay: clampNum(o.timeOfDay, 0, 0.9999, d.timeOfDay),
    dayLengthMin: clampNum(o.dayLengthMin, 1, 30, d.dayLengthMin),
    weather: o.weather === 'rain' || o.weather === 'fog' || o.weather === 'clear' ? o.weather : d.weather,
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
