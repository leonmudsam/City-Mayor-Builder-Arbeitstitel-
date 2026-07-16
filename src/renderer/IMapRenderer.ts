// The contract MapView drives, satisfied by both the 2D Pixi `MapRenderer` and
// the 3D three.js `ThreeMapRenderer` (v0.29). MapView swaps engines when the
// render mode crosses the 2D↔3D boundary (see `engineFor`) and otherwise just
// calls `setRenderMode`. Both engines read the same controller state and report
// back through the same `RendererCallbacks`, so nothing else in the app changes.

import type { RenderMode } from './projection.ts';
import type { RendererCallbacks } from './MapRenderer.ts';
import type { CameraPreset } from './three/CameraConfig.ts';

export interface IMapRenderer {
  init(host: HTMLElement): Promise<void>;
  destroy(): void;
  setRenderMode(mode: RenderMode): void;
  setPlacing(defId: string | undefined): void;
  /** Cosmetic facing for the ghost/placed building (§ Gebäude-Rotation). Optional —
   *  only the 3D engine previews/applies it; 2D/iso ignore rotation entirely. */
  setPlacingRotation?(rotation: 0 | 90 | 180 | 270): void;
  setMoving(id: string | undefined): void;
  setSelected(id: string | undefined): void;
  centerOnCity(): void;
  // 3D-only camera controls (§ camera). Optional so the 2D/iso debug renderer
  // needn't implement them; the MapApi wiring guards for their absence.
  applyPreset?(preset: CameraPreset): void;
  focusSelected?(): void;
  resetNorth?(): void;
  zoomStep?(dir: number): void;
  getYaw?(): number;
}

export type { RendererCallbacks };
export type { CameraPreset };
