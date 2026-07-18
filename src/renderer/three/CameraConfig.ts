// Static 3D-camera configuration (v0.30): hard limits and view presets. Pure
// data + math — no three.js — so the CameraController and its tests can import it
// freely. World pan-bounds are derived from the bounded island world, so the
// camera can never fly off the finite board.

import { WORLD_TILES } from '../../game/config/startRegion.config.ts';

const DEG = Math.PI / 180;

export interface CameraBounds {
  minDist: number;
  maxDist: number;
  minPitch: number; // radians — flattest (most oblique) angle
  maxPitch: number; // radians — steepest (near top-down) angle
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** A named viewpoint. Undefined fields keep the camera's current value. */
export interface CameraPresetDef {
  pitch?: number; // radians
  dist?: number;
  yaw?: number; // radians; usually kept, so undefined
  /** Recentre the target on the town hall (Zentrum). */
  focusCity?: boolean;
}

export type CameraPreset = 'city' | 'build' | 'overview' | 'center';

/** Pitch/zoom limits. Pitch stays below 90° so picking & billboards stay sane.
 *  maxDist 480 (§ MVP4 P3, docs/WORLD_SCALE.md): die 384er-Insel braucht einen
 *  echten Insel-Überblick — 200 zeigte nur noch einen Ausschnitt. */
export const CAMERA_LIMITS = {
  minDist: 10,
  maxDist: 480,
  minPitch: 28 * DEG,
  maxPitch: 84 * DEG, // near top-down, but never fully overhead
} as const;

/**
 * Player-facing view presets — these replace the old 2D/iso/3D mode switch.
 * All are the SAME 3D scene, only the camera angle/zoom/target differ.
 *   city     — pleasant oblique "look at my city" angle
 *   build    — steep, near top-down: precise roads & placement
 *   overview — zoomed out, whole city + biomes
 *   center   — recentre on the town hall at a comfortable angle
 */
export const CAMERA_PRESETS: Record<CameraPreset, CameraPresetDef> = {
  city: { pitch: 52 * DEG, dist: 62 },
  build: { pitch: 78 * DEG, dist: 46 },
  // Insel-Überblick (§ MVP4 P3): weit genug für die ganze 384er-Insel.
  overview: { pitch: 56 * DEG, dist: 420 },
  center: { pitch: 52 * DEG, dist: 70, focusCity: true },
};

/** Default camera state values on first load / reset. */
export const CAMERA_DEFAULTS = {
  dist: 62,
  yaw: 45 * DEG,
  pitch: 52 * DEG,
} as const;

/** Pan-bounds from the finite island world plus a little padding. */
export function worldCameraBounds(padding = 8): CameraBounds {
  const minX = -padding;
  const maxX = WORLD_TILES + padding;
  const minZ = -padding;
  const maxZ = WORLD_TILES + padding;
  return {
    minDist: CAMERA_LIMITS.minDist,
    maxDist: CAMERA_LIMITS.maxDist,
    minPitch: CAMERA_LIMITS.minPitch,
    maxPitch: CAMERA_LIMITS.maxPitch,
    minX,
    maxX,
    minZ,
    maxZ,
  };
}
