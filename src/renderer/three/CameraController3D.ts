// CameraController3D (v0.30) — the single source of truth for the 3D camera.
// Framework-agnostic and three.js-free: it owns a small state machine
// (target on the ground + orbit distance/yaw/pitch), applies pan/orbit/zoom/
// keyboard intents, eases toward goals with optional inertia, and always clamps
// to the world & limits. The renderer only reads `position()` / `lookAt()` each
// frame and writes them into the three.js camera. Being pure makes the whole of
// the navigation logic unit-testable (see tests/camera.test.ts).

import { startRegionConfig, worldOverviewCenter } from '../../game/config/startRegion.config.ts';
import {
  CAMERA_DEFAULTS,
  CAMERA_PRESETS,
  worldCameraBounds,
  type CameraBounds,
  type CameraPreset,
} from './CameraConfig.ts';
import { DEFAULT_CAMERA_SETTINGS, type CameraSettings } from './cameraSettings.ts';

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

/** A plain camera pose the renderer can consume without any three types. */
export interface CameraPose {
  posX: number;
  posY: number;
  posZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
}

export class CameraController3D {
  readonly bounds: CameraBounds;
  private settings: () => CameraSettings;

  // Current (rendered) state.
  private targetX: number;
  private targetZ: number;
  private dist: number;
  private yaw: number;
  private pitch: number;

  // Goal state — the current state eases toward these each frame.
  private gTargetX: number;
  private gTargetZ: number;
  private gDist: number;
  private gYaw: number;
  private gPitch: number;

  // Pan inertia (world units / second) — only coasts after a drag is released.
  private velX = 0;
  private velZ = 0;
  private panning = false;

  constructor(bounds: CameraBounds = worldCameraBounds(), settings: () => CameraSettings = () => DEFAULT_CAMERA_SETTINGS) {
    this.bounds = bounds;
    this.settings = settings;
    const th = startRegionConfig.townHall;
    this.targetX = this.gTargetX = th.x + 2.5;
    this.targetZ = this.gTargetZ = th.y + 2.5;
    this.dist = this.gDist = CAMERA_DEFAULTS.dist;
    this.yaw = this.gYaw = CAMERA_DEFAULTS.yaw;
    this.pitch = this.gPitch = CAMERA_DEFAULTS.pitch;
  }

  // ---- intents --------------------------------------------------------------

  /** "Grab the map" drag. `dx/dy` in screen pixels; movement is 1:1 with the
   *  ground regardless of the pan-speed setting (that only scales keyboard/edge). */
  panScreen(dx: number, dy: number): void {
    const k = this.gDist * 0.0016;
    // right = (cos yaw, -sin yaw); forward(screen-up) = (-sin yaw, -cos yaw)
    const rx = Math.cos(this.yaw);
    const rz = -Math.sin(this.yaw);
    const fx = -Math.sin(this.yaw);
    const fz = -Math.cos(this.yaw);
    // "Grab the map": dragging down moves the world down (target += forward), so
    // the vertical term is +dy (horizontal stays -dx). Fixes inverted up/down pan.
    const wx = -dx * k * rx + dy * k * fx;
    const wz = -dx * k * rz + dy * k * fz;
    this.gTargetX += wx;
    this.gTargetZ += wz;
    this.velX = wx * 55;
    this.velZ = wz * 55;
    this.clampTarget();
  }

  beginPan(): void {
    this.panning = true;
    this.velX = this.velZ = 0;
  }
  endPan(): void {
    this.panning = false;
  }

  /** Orbit (yaw) + tilt (pitch) from a drag in pixels. */
  orbit(dx: number, dy: number): void {
    const s = this.settings();
    const rot = 0.005 * s.rotateSpeed;
    this.gYaw -= dx * rot * (s.invertRotate ? -1 : 1);
    this.gPitch = clamp(this.gPitch + dy * rot, this.bounds.minPitch, this.bounds.maxPitch);
  }

  /** Multiply the orbit distance (zoom). `factor < 1` zooms in. */
  zoomBy(factor: number): void {
    this.gDist = clamp(this.gDist * factor, this.bounds.minDist, this.bounds.maxDist);
  }

  /** Zoom toward a ground pivot (cursor-focused wheel zoom). */
  zoomToward(factor: number, pivotX: number, pivotZ: number): void {
    const before = this.gDist;
    this.gDist = clamp(this.gDist * factor, this.bounds.minDist, this.bounds.maxDist);
    const applied = this.gDist / before; // effective factor after clamping
    const t = (1 - applied) * 0.6; // ease target toward the pivot when zooming in
    this.gTargetX += (pivotX - this.gTargetX) * t;
    this.gTargetZ += (pivotZ - this.gTargetZ) * t;
    this.clampTarget();
  }

  /** Continuous keyboard pan. `dirX/dirZ` in {-1,0,1} (screen right / up). */
  keyPan(dirX: number, dirZ: number, dt: number, fast: boolean): void {
    if (dirX === 0 && dirZ === 0) return;
    const speed = 26 * this.settings().panSpeed * (fast ? 2.4 : 1) * (this.gDist / 62);
    const rx = Math.cos(this.yaw);
    const rz = -Math.sin(this.yaw);
    const fx = -Math.sin(this.yaw);
    const fz = -Math.cos(this.yaw);
    this.gTargetX += (dirX * rx + dirZ * fx) * speed * dt;
    this.gTargetZ += (dirX * rz + dirZ * fz) * speed * dt;
    this.clampTarget();
  }

  keyYaw(dir: number, dt: number): void {
    this.gYaw += dir * 1.6 * this.settings().rotateSpeed * dt;
  }
  keyPitch(dir: number, dt: number): void {
    this.gPitch = clamp(this.gPitch + dir * 1.2 * dt, this.bounds.minPitch, this.bounds.maxPitch);
  }
  keyZoom(dir: number, dt: number): void {
    // dir > 0 zooms in.
    this.zoomBy(Math.exp(-dir * 1.6 * dt * this.settings().zoomSpeed));
  }

  // ---- focus / presets ------------------------------------------------------

  focusGround(x: number, z: number, dist?: number): void {
    this.gTargetX = x;
    this.gTargetZ = z;
    if (dist !== undefined) this.gDist = clamp(dist, this.bounds.minDist, this.bounds.maxDist);
    this.clampTarget();
  }

  focusCity(): void {
    const th = startRegionConfig.townHall;
    this.focusGround(th.x + 2.5, th.y + 2.5);
  }

  applyPreset(preset: CameraPreset): void {
    const p = CAMERA_PRESETS[preset];
    if (p.focusCity) this.focusCity();
    if (p.focusWorld) this.focusGround(worldOverviewCenter.x, worldOverviewCenter.y);
    if (p.pitch !== undefined) this.gPitch = clamp(p.pitch, this.bounds.minPitch, this.bounds.maxPitch);
    if (p.dist !== undefined) this.gDist = clamp(p.dist, this.bounds.minDist, this.bounds.maxDist);
    if (p.yaw !== undefined) this.gYaw = p.yaw;
  }

  /** Reset the compass to the default viewing yaw. */
  resetNorth(): void {
    this.gYaw = CAMERA_DEFAULTS.yaw;
  }

  /**
   * Chase-Kamera (§ A6 Fahrmodus): setzt alle Ziel-Werte direkt, damit die
   * Kamera hinter dem gesteuerten Fahrzeug herzieht und es anschaut. `yaw` ist
   * die Fahrtrichtung; die Kamera sitzt dahinter (yaw+π) und blickt nach vorn.
   * `snapYaw` überspringt das Yaw-Easing für hartes Andocken beim Einsteigen.
   */
  setChase(targetX: number, targetZ: number, heading: number, dist: number, pitch: number, snapYaw = false): void {
    this.gTargetX = targetX;
    this.gTargetZ = targetZ;
    this.gDist = clamp(dist, this.bounds.minDist, this.bounds.maxDist);
    this.gPitch = clamp(pitch, this.bounds.minPitch, this.bounds.maxPitch);
    // Kamera hinter das Fahrzeug: pose() setzt sie bei target + (sin yaw, cos yaw);
    // für „dahinter" (−Fahrtrichtung) ist yaw = heading + π. Kürzesten Weg wählen,
    // damit die Kamera bei Richtungswechsel nicht einmal ganz herumschwenkt.
    const want = heading + Math.PI;
    let d = want - this.gYaw;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    this.gYaw += d;
    this.clampTarget();
    if (snapYaw) {
      this.yaw = this.gYaw;
      this.pitch = this.gPitch;
      this.dist = this.gDist;
    }
  }

  // ---- per-frame update -----------------------------------------------------

  update(dt: number): void {
    // Inertia coasts the goal after a drag is released (smooth mode only).
    if (!this.panning && this.settings().smooth && (this.velX !== 0 || this.velZ !== 0)) {
      this.gTargetX += this.velX * dt;
      this.gTargetZ += this.velZ * dt;
      const decay = Math.exp(-dt * 6);
      this.velX *= decay;
      this.velZ *= decay;
      if (Math.abs(this.velX) < 0.02 && Math.abs(this.velZ) < 0.02) this.velX = this.velZ = 0;
      this.clampTarget();
    }

    if (!this.settings().smooth) {
      this.targetX = this.gTargetX;
      this.targetZ = this.gTargetZ;
      this.dist = this.gDist;
      this.yaw = this.gYaw;
      this.pitch = this.gPitch;
      return;
    }
    const eTarget = 1 - Math.exp(-dt * 16);
    const eOrbit = 1 - Math.exp(-dt * 13);
    this.targetX += (this.gTargetX - this.targetX) * eTarget;
    this.targetZ += (this.gTargetZ - this.targetZ) * eTarget;
    this.dist += (this.gDist - this.dist) * eOrbit;
    this.yaw += (this.gYaw - this.yaw) * eOrbit;
    this.pitch += (this.gPitch - this.pitch) * eOrbit;
  }

  /** Snap current state to goals (used once on init). */
  snap(): void {
    this.targetX = this.gTargetX;
    this.targetZ = this.gTargetZ;
    this.dist = this.gDist;
    this.yaw = this.gYaw;
    this.pitch = this.gPitch;
    this.velX = this.velZ = 0;
  }

  // ---- read-out -------------------------------------------------------------

  pose(): CameraPose {
    const horiz = Math.cos(this.pitch) * this.dist;
    const height = Math.sin(this.pitch) * this.dist;
    return {
      posX: this.targetX + Math.sin(this.yaw) * horiz,
      posY: height,
      posZ: this.targetZ + Math.cos(this.yaw) * horiz,
      targetX: this.targetX,
      targetY: 0,
      targetZ: this.targetZ,
    };
  }

  getYaw(): number {
    return this.yaw;
  }
  getPitch(): number {
    return this.pitch;
  }
  getDist(): number {
    return this.dist;
  }
  /** Goal snapshot — handy for tests/telemetry. */
  goals(): { targetX: number; targetZ: number; dist: number; yaw: number; pitch: number } {
    return { targetX: this.gTargetX, targetZ: this.gTargetZ, dist: this.gDist, yaw: this.gYaw, pitch: this.gPitch };
  }

  // § D-045: Seit die ganze Insel geladen und gezeigt wird, gibt es keine
  // Erkundungsgrenze mehr — nur noch das Weltrechteck.
  private clampTarget(): void {
    this.gTargetX = clamp(this.gTargetX, this.bounds.minX, this.bounds.maxX);
    this.gTargetZ = clamp(this.gTargetZ, this.bounds.minZ, this.bounds.maxZ);
  }
}
