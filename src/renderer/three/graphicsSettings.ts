// Spieler-Grafikeinstellung (§ Säule B). Gleiches framework-agnostisches Muster
// wie environmentSettings.ts: ein winziger Store, den SOWOHL die React-HUD als
// auch der (nicht-React-)Renderer lesen/schreiben, ohne Zustand oder three zu
// importieren. Persistiert in localStorage unter eigenem Schlüssel — NICHT Teil
// des Savegames, also kein Schema-Bump (CLAUDE.md §3).

import {
  DEFAULT_GRAPHICS_QUALITY,
  GRAPHICS_QUALITY_LEVELS,
  graphicsProfile,
  type GraphicsProfile,
  type GraphicsQualityLevel,
} from './graphicsQuality.ts';

export interface GraphicsSettings {
  quality: GraphicsQualityLevel;
}

export const DEFAULT_GRAPHICS_SETTINGS: GraphicsSettings = {
  quality: DEFAULT_GRAPHICS_QUALITY,
};

const KEY = 'cmb.graphics';

function sanitize(raw: unknown): GraphicsSettings {
  const o = (raw ?? {}) as Partial<GraphicsSettings>;
  const quality = GRAPHICS_QUALITY_LEVELS.includes(o.quality as GraphicsQualityLevel)
    ? (o.quality as GraphicsQualityLevel)
    : DEFAULT_GRAPHICS_SETTINGS.quality;
  return { quality };
}

function load(): GraphicsSettings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? sanitize(JSON.parse(raw)) : { ...DEFAULT_GRAPHICS_SETTINGS };
  } catch {
    return { ...DEFAULT_GRAPHICS_SETTINGS };
  }
}

let current: GraphicsSettings = load();
const listeners = new Set<() => void>();

export function getGraphicsSettings(): GraphicsSettings {
  return current;
}

/** Aktives Render-Profil (aufgelöste Zahlen der gewählten Stufe). */
export function getGraphicsProfile(): GraphicsProfile {
  return graphicsProfile(current.quality);
}

export function setGraphicsQuality(quality: GraphicsQualityLevel): void {
  current = sanitize({ quality });
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* ignore storage failures */
  }
  for (const l of listeners) l();
}

/** Ändern (Renderer baut Vegetation neu, HUD aktualisiert die Auswahl). */
export function subscribeGraphicsSettings(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
