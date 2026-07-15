// CameraInputController (v0.30) — all raw input for the 3D map lives here, so the
// renderer stays about rendering and the CameraController3D stays pure. It maps
// mouse, wheel, keyboard and (multi-)touch to camera intents + host callbacks,
// gates camera actions during build mode, and gives cursor feedback.
//
// Desktop:
//   LMB drag ................ pan ("grab the map")
//   CTRL+LMB drag / MMB drag  orbit (yaw) + tilt (pitch)
//   Wheel ................... zoom toward the cursor
//   RMB (click) ............. cancel / deselect (never pans)
//   WASD / arrows ........... pan     Q/E yaw   PageUp/PageDown tilt
//   +/- ..................... zoom    Space focus city   F focus selection
//   Shift ................... move faster
// Build mode: LMB is reserved for placing/painting — the camera never moves on
// LMB; pan via MMB drag or the keyboard, orbit via CTRL+LMB/MMB.
//
// Touch (prepared for mobile):
//   1 finger drag ........... pan          tap ......... select
//   2 finger pinch .......... zoom         2 finger twist .. orbit
//   2 finger vertical ....... tilt (pitch)

import type { CameraController3D } from './CameraController3D.ts';
import { getCameraSettings } from './cameraSettings.ts';

const DRAG_THRESHOLD = 5;

export interface CameraInputHost {
  isPlacing(): boolean;
  /** Roads/decoration paint on drag; other buildings place on click only. */
  placingPaints(): boolean;
  place(clientX: number, clientY: number): void;
  paint(clientX: number, clientY: number): void;
  selectAt(clientX: number, clientY: number): void;
  ghostMove(clientX: number, clientY: number): void;
  cancel(): void;
  focusCity(): void;
  focusSelected(): void;
  /** Ground point under the cursor, for cursor-focused wheel zoom. */
  groundAt(clientX: number, clientY: number): { x: number; z: number } | undefined;
}

type Mode = 'none' | 'pan' | 'orbit' | 'build' | 'cancel';

export class CameraInputController {
  private pointers = new Map<number, { x: number; y: number }>();
  private mode: Mode = 'none';
  private startX = 0;
  private startY = 0;
  private lastX = 0;
  private lastY = 0;
  private dragging = false;
  private held = new Set<string>();
  private hovering = false;
  private hoverX = 0;
  private hoverY = 0;
  // Pinch/twist reference for two-finger gestures.
  private pinchDist = 0;
  private twistAngle = 0;

  private readonly onKeyDown = (e: KeyboardEvent) => this.keyDown(e);
  private readonly onKeyUp = (e: KeyboardEvent) => this.keyUp(e);

  constructor(
    private el: HTMLElement,
    private cam: CameraController3D,
    private host: CameraInputHost,
  ) {}

  attach(): void {
    const el = this.el;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerup', this.onPointerUp);
    el.addEventListener('pointercancel', this.onPointerUp);
    el.addEventListener('pointerleave', () => (this.hovering = false));
    el.addEventListener('wheel', this.onWheel, { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.setCursor();
  }

  detach(): void {
    const el = this.el;
    el.removeEventListener('pointerdown', this.onPointerDown);
    el.removeEventListener('pointermove', this.onPointerMove);
    el.removeEventListener('pointerup', this.onPointerUp);
    el.removeEventListener('pointercancel', this.onPointerUp);
    el.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.pointers.clear();
    this.held.clear();
  }

  // ---- pointer --------------------------------------------------------------

  private onPointerDown = (e: PointerEvent) => {
    this.el.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size === 2) {
      this.beginTwoFinger();
      return;
    }
    this.startX = this.lastX = e.clientX;
    this.startY = this.lastY = e.clientY;
    this.dragging = false;
    if (this.host.isPlacing() && e.button === 0) {
      this.mode = 'build';
    } else if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      this.mode = 'orbit';
    } else if (e.button === 0) {
      this.mode = 'pan';
      this.cam.beginPan();
    } else if (e.button === 2) {
      this.mode = 'cancel';
    } else {
      this.mode = 'none';
    }
    this.setCursor();
  };

  private onPointerMove = (e: PointerEvent) => {
    const p = this.pointers.get(e.pointerId);
    if (p) {
      p.x = e.clientX;
      p.y = e.clientY;
    }
    if (this.pointers.size === 2) {
      this.updateTwoFinger();
      return;
    }
    if (this.pointers.size === 0) {
      this.hovering = true;
      this.hoverX = e.clientX;
      this.hoverY = e.clientY;
      if (this.host.isPlacing()) this.host.ghostMove(e.clientX, e.clientY);
      return;
    }
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    if (!this.dragging && Math.hypot(e.clientX - this.startX, e.clientY - this.startY) > DRAG_THRESHOLD) {
      this.dragging = true;
      this.setCursor();
    }
    if (!this.dragging) return;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    if (this.mode === 'pan') this.cam.panScreen(dx, dy);
    else if (this.mode === 'orbit') this.cam.orbit(dx, dy);
    else if (this.mode === 'build' && this.host.placingPaints()) this.host.paint(e.clientX, e.clientY);
  };

  private onPointerUp = (e: PointerEvent) => {
    const wasTwo = this.pointers.size === 2;
    this.pointers.delete(e.pointerId);
    try {
      this.el.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    if (wasTwo) {
      this.mode = 'none';
      this.setCursor();
      return;
    }
    if (this.mode === 'pan') this.cam.endPan();
    if (!this.dragging) {
      // A click (no drag).
      if (this.mode === 'build') this.host.place(e.clientX, e.clientY);
      else if (this.mode === 'cancel') this.host.cancel();
      else if (this.mode === 'pan') this.host.selectAt(e.clientX, e.clientY);
    }
    this.mode = 'none';
    this.dragging = false;
    this.setCursor();
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const s = getCameraSettings();
    const factor = Math.exp(e.deltaY * 0.0012 * s.zoomSpeed * (s.invertZoom ? -1 : 1));
    const g = this.host.groundAt(e.clientX, e.clientY);
    if (g) this.cam.zoomToward(factor, g.x, g.z);
    else this.cam.zoomBy(factor);
  };

  // ---- two-finger touch -----------------------------------------------------

  private twoPoints(): [{ x: number; y: number }, { x: number; y: number }] | undefined {
    const it = this.pointers.values();
    const a = it.next().value as { x: number; y: number } | undefined;
    const b = it.next().value as { x: number; y: number } | undefined;
    return a && b ? [a, b] : undefined;
  }

  private beginTwoFinger(): void {
    const pts = this.twoPoints();
    if (!pts) return;
    this.mode = 'orbit';
    this.pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    this.twistAngle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
    this.lastY = (pts[0].y + pts[1].y) / 2;
    this.setCursor();
  }

  private updateTwoFinger(): void {
    const pts = this.twoPoints();
    if (!pts) return;
    const s = getCameraSettings();
    const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    const angle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
    const midY = (pts[0].y + pts[1].y) / 2;
    if (this.pinchDist > 0) this.cam.zoomBy(Math.exp((this.pinchDist - dist) * 0.005 * s.zoomSpeed));
    let dAng = angle - this.twistAngle;
    if (dAng > Math.PI) dAng -= 2 * Math.PI;
    if (dAng < -Math.PI) dAng += 2 * Math.PI;
    this.cam.orbit(-dAng * (180 / Math.PI) * 3, (midY - this.lastY) * 0.6);
    this.pinchDist = dist;
    this.twistAngle = angle;
    this.lastY = midY;
  }

  // ---- keyboard -------------------------------------------------------------

  private static readonly TYPING = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

  private keyDown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement | null;
    if (target && (CameraInputController.TYPING.has(target.tagName) || target.isContentEditable)) return;
    // Don't hijack Space/F/Enter when a button or link is focused (keyboard a11y).
    const onControl = !!target?.closest?.('button, a, [role="button"]');
    const k = e.key.toLowerCase();
    if (k === ' ') {
      if (onControl) return;
      this.host.focusCity();
      e.preventDefault();
      return;
    }
    if (k === 'f') {
      if (onControl) return;
      this.host.focusSelected();
      return;
    }
    if (CONTINUOUS.has(k)) {
      this.held.add(k);
      e.preventDefault();
    }
  }

  private keyUp(e: KeyboardEvent): void {
    this.held.delete(e.key.toLowerCase());
  }

  // ---- per-frame ------------------------------------------------------------

  /** Called from the renderer's frame loop; applies held keys + edge scrolling. */
  update(dt: number): void {
    const h = this.held;
    let dirX = 0;
    let dirZ = 0;
    if (h.has('a') || h.has('arrowleft')) dirX -= 1;
    if (h.has('d') || h.has('arrowright')) dirX += 1;
    if (h.has('w') || h.has('arrowup')) dirZ += 1;
    if (h.has('s') || h.has('arrowdown')) dirZ -= 1;

    if (this.hovering && getCameraSettings().edgeScroll && this.pointers.size === 0) {
      const r = this.el.getBoundingClientRect();
      const m = 24;
      if (this.hoverX - r.left < m) dirX -= 1;
      if (r.right - this.hoverX < m) dirX += 1;
      if (this.hoverY - r.top < m) dirZ += 1;
      if (r.bottom - this.hoverY < m) dirZ -= 1;
    }

    const fast = h.has('shift');
    if (dirX !== 0 || dirZ !== 0) this.cam.keyPan(dirX, dirZ, dt, fast);
    if (h.has('q')) this.cam.keyYaw(1, dt);
    if (h.has('e')) this.cam.keyYaw(-1, dt);
    if (h.has('pageup')) this.cam.keyPitch(1, dt);
    if (h.has('pagedown')) this.cam.keyPitch(-1, dt);
    if (h.has('+') || h.has('=')) this.cam.keyZoom(1, dt);
    if (h.has('-')) this.cam.keyZoom(-1, dt);
  }

  private setCursor(): void {
    let c = 'grab';
    if (this.host.isPlacing()) c = 'crosshair';
    else if (this.mode === 'pan' && this.dragging) c = 'grabbing';
    else if (this.mode === 'orbit') c = 'move';
    this.el.style.cursor = c;
  }
}

const CONTINUOUS = new Set([
  'w', 'a', 's', 'd',
  'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
  'q', 'e', 'pageup', 'pagedown', '+', '=', '-', 'shift',
]);
