// The contract MapView drives, satisfied by both the 2D Pixi `MapRenderer` and
// the 3D three.js `ThreeMapRenderer` (v0.29). MapView swaps engines when the
// render mode crosses the 2D↔3D boundary (see `engineFor`) and otherwise just
// calls `setRenderMode`. Both engines read the same controller state and report
// back through the same `RendererCallbacks`, so nothing else in the app changes.

import type { RenderMode } from './projection.ts';
import type { RendererCallbacks } from './MapRenderer.ts';

export interface IMapRenderer {
  init(host: HTMLElement): Promise<void>;
  destroy(): void;
  setRenderMode(mode: RenderMode): void;
  setPlacing(defId: string | undefined): void;
  setMoving(id: string | undefined): void;
  setSelected(id: string | undefined): void;
  centerOnCity(): void;
}

export type { RendererCallbacks };
