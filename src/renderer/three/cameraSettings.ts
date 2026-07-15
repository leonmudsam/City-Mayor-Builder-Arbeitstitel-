// Player-tunable 3D camera settings (v0.30). A tiny framework-agnostic store so
// BOTH the React settings UI and the (non-React) input controller read/write the
// same values without a dependency on Zustand or three. Persisted in
// localStorage; changes notify subscribers so open UI stays in sync.

export interface CameraSettings {
  /** Keyboard/edge pan speed multiplier (0.3–3). */
  panSpeed: number;
  /** Wheel/pinch zoom speed multiplier (0.3–3). */
  zoomSpeed: number;
  /** Orbit/rotate speed multiplier (0.3–3). */
  rotateSpeed: number;
  /** Invert horizontal orbit direction. */
  invertRotate: boolean;
  /** Invert wheel zoom direction. */
  invertZoom: boolean;
  /** Smooth easing + inertia on/off (off = fully direct, snappy). */
  smooth: boolean;
  /** Move the camera when the mouse touches a screen edge (desktop only). */
  edgeScroll: boolean;
}

export const DEFAULT_CAMERA_SETTINGS: CameraSettings = {
  panSpeed: 1,
  zoomSpeed: 1,
  rotateSpeed: 1,
  invertRotate: false,
  invertZoom: false,
  smooth: true,
  edgeScroll: false,
};

const KEY = 'cmb.cameraSettings';

function clampNum(v: unknown, lo: number, hi: number, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback;
}

function sanitize(raw: unknown): CameraSettings {
  const o = (raw ?? {}) as Partial<CameraSettings>;
  const d = DEFAULT_CAMERA_SETTINGS;
  return {
    panSpeed: clampNum(o.panSpeed, 0.3, 3, d.panSpeed),
    zoomSpeed: clampNum(o.zoomSpeed, 0.3, 3, d.zoomSpeed),
    rotateSpeed: clampNum(o.rotateSpeed, 0.3, 3, d.rotateSpeed),
    invertRotate: typeof o.invertRotate === 'boolean' ? o.invertRotate : d.invertRotate,
    invertZoom: typeof o.invertZoom === 'boolean' ? o.invertZoom : d.invertZoom,
    smooth: typeof o.smooth === 'boolean' ? o.smooth : d.smooth,
    edgeScroll: typeof o.edgeScroll === 'boolean' ? o.edgeScroll : d.edgeScroll,
  };
}

function load(): CameraSettings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? sanitize(JSON.parse(raw)) : { ...DEFAULT_CAMERA_SETTINGS };
  } catch {
    return { ...DEFAULT_CAMERA_SETTINGS };
  }
}

let current: CameraSettings = load();
const listeners = new Set<() => void>();

export function getCameraSettings(): CameraSettings {
  return current;
}

export function setCameraSettings(patch: Partial<CameraSettings>): void {
  current = sanitize({ ...current, ...patch });
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* ignore storage failures */
  }
  for (const l of listeners) l();
}

export function resetCameraSettings(): void {
  setCameraSettings({ ...DEFAULT_CAMERA_SETTINGS });
}

/** Subscribe to changes (returns an unsubscribe). Used by the React settings UI. */
export function subscribeCameraSettings(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
