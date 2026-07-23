// Renderer-Performance-Telemetrie für das Dev-Panel (§ Säule B).
//
// Der (nicht-React-)Renderer schreibt hier gedrosselt seine Live-Kennzahlen
// hinein; die React-HUD liest sie ohne three-/Zustand-Kopplung. Gleiches
// framework-agnostisches Muster wie environmentSettings.ts. KEIN Save-Bezug,
// keine Simulationswirkung — reine Anzeige, damit „Optimierung nach Gefühl"
// durch messbare Werte ersetzt wird (Auftrag: kein subjektiver Eindruck).

export interface PerfStats {
  /** Geglättete Bilder pro Sekunde. */
  fps: number;
  /** Draw-Calls des letzten Frames (`renderer.info.render.calls`). */
  drawCalls: number;
  /** Gerenderte Dreiecke des letzten Frames. */
  triangles: number;
  /** Aktuell in der Szene gehaltene Vegetations-Instanzen. */
  vegInstances: number;
  /** Sichtbare Vegetations-Draw-Calls (InstancedMesh-Gruppen). */
  vegGroups: number;
  /** Aktive Grafik-Qualitätsstufe (Id). */
  quality: string;
}

const EMPTY: PerfStats = {
  fps: 0,
  drawCalls: 0,
  triangles: 0,
  vegInstances: 0,
  vegGroups: 0,
  quality: 'high',
};

let current: PerfStats = { ...EMPTY };
const listeners = new Set<() => void>();

export function getPerfStats(): PerfStats {
  return current;
}

export function setPerfStats(stats: PerfStats): void {
  current = stats;
  for (const l of listeners) l();
}

export function subscribePerfStats(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
