// Dauerhafte, GEDROSSELTE FPS-Messung (§ P-E / §15.1–15.2). Ein einziger
// requestAnimationFrame-Zähler misst die reale Bildrate der Hauptschleife (die
// den 3D-Renderer einschließt) und veröffentlicht nur etwa alle 500 ms einen
// Snapshot. So kostet die Anzeige selbst praktisch nichts und löst KEIN React-
// Update pro Frame aus (React liest den gedrosselten Wert über useSyncExternalStore).
// Framework-agnostisch (kein three/React-Import), eigener Store wie environmentSettings.

const PUBLISH_INTERVAL_MS = 500;

export interface FpsSample {
  /** Gerundete Bilder pro Sekunde des letzten Fensters. */
  fps: number;
  /** Durchschnittliche Frame-Zeit in ms (1000/fps), für den Tooltip. */
  frameMs: number;
}

let sample: FpsSample = { fps: 0, frameMs: 0 };
const listeners = new Set<() => void>();

let rafId = 0;
let frames = 0;
let windowStart = 0;
let subscriberCount = 0;

function loop(now: number): void {
  frames += 1;
  const elapsed = now - windowStart;
  if (elapsed >= PUBLISH_INTERVAL_MS) {
    const fps = Math.round((frames * 1000) / elapsed);
    sample = { fps, frameMs: fps > 0 ? Math.round((1000 / fps) * 10) / 10 : 0 };
    frames = 0;
    windowStart = now;
    for (const listener of listeners) listener();
  }
  rafId = requestAnimationFrame(loop);
}

export function getFpsSample(): FpsSample {
  return sample;
}

/** Subscribe to throttled FPS updates (~2×/s). Starts the meter lazily. */
export function subscribeFps(cb: () => void): () => void {
  listeners.add(cb);
  if (subscriberCount === 0 && typeof requestAnimationFrame === 'function') {
    frames = 0;
    windowStart = performance.now();
    rafId = requestAnimationFrame(loop);
  }
  subscriberCount += 1;
  return () => {
    listeners.delete(cb);
    subscriberCount -= 1;
    if (subscriberCount <= 0) {
      subscriberCount = 0;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };
}
