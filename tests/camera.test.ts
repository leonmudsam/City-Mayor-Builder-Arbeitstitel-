import { describe, it, expect } from 'vitest';
import { CameraController3D } from '../src/renderer/three/CameraController3D.ts';
import { CAMERA_LIMITS, worldCameraBounds } from '../src/renderer/three/CameraConfig.ts';
import { DEFAULT_CAMERA_SETTINGS, type CameraSettings } from '../src/renderer/three/cameraSettings.ts';

const settings = (over: Partial<CameraSettings> = {}) => () => ({ ...DEFAULT_CAMERA_SETTINGS, ...over });

describe('CameraController3D bounds', () => {
  it('clamps pan target to the world bounds', () => {
    const cam = new CameraController3D(worldCameraBounds(), settings());
    for (let i = 0; i < 400; i++) cam.panScreen(-500, -500); // shove far up-left
    const g = cam.goals();
    const b = worldCameraBounds();
    expect(g.targetX).toBeGreaterThanOrEqual(b.minX - 1e-6);
    expect(g.targetX).toBeLessThanOrEqual(b.maxX + 1e-6);
    expect(g.targetZ).toBeGreaterThanOrEqual(b.minZ - 1e-6);
    expect(g.targetZ).toBeLessThanOrEqual(b.maxZ + 1e-6);
  });

  it('clamps zoom between min and max distance', () => {
    const cam = new CameraController3D(worldCameraBounds(), settings());
    for (let i = 0; i < 200; i++) cam.zoomBy(0.5);
    expect(cam.goals().dist).toBeCloseTo(CAMERA_LIMITS.minDist, 5);
    for (let i = 0; i < 200; i++) cam.zoomBy(2);
    expect(cam.goals().dist).toBeCloseTo(CAMERA_LIMITS.maxDist, 5);
  });

  it('clamps pitch between min and max', () => {
    const cam = new CameraController3D(worldCameraBounds(), settings());
    for (let i = 0; i < 400; i++) cam.orbit(0, 100);
    expect(cam.goals().pitch).toBeLessThanOrEqual(CAMERA_LIMITS.maxPitch + 1e-9);
    for (let i = 0; i < 400; i++) cam.orbit(0, -100);
    expect(cam.goals().pitch).toBeGreaterThanOrEqual(CAMERA_LIMITS.minPitch - 1e-9);
  });
});

describe('CameraController3D presets & focus', () => {
  it('build preset is steeper and closer than city preset', () => {
    const city = new CameraController3D(worldCameraBounds(), settings());
    city.applyPreset('city');
    const build = new CameraController3D(worldCameraBounds(), settings());
    build.applyPreset('build');
    expect(build.goals().pitch).toBeGreaterThan(city.goals().pitch);
    expect(build.goals().dist).toBeLessThan(city.goals().dist);
    expect(build.goals().pitch).toBeLessThanOrEqual(CAMERA_LIMITS.maxPitch);
  });

  it('overview zooms further out than city', () => {
    const cam = new CameraController3D(worldCameraBounds(), settings());
    cam.focusGround(12, 18);
    cam.applyPreset('overview');
    const overview = cam.goals();
    const dist = overview.dist;
    const bounds = worldCameraBounds();
    expect(overview.targetX).toBeCloseTo((bounds.minX + bounds.maxX) / 2, 5);
    expect(overview.targetZ).toBeCloseTo((bounds.minZ + bounds.maxZ) / 2, 5);
    cam.applyPreset('city');
    expect(dist).toBeGreaterThan(cam.goals().dist);
  });

  it('focusGround stays within bounds and produces a valid pose', () => {
    const cam = new CameraController3D(worldCameraBounds(), settings({ smooth: false }));
    cam.focusGround(9999, 9999, 50);
    cam.update(1);
    const b = worldCameraBounds();
    const p = cam.pose();
    expect(p.targetX).toBeLessThanOrEqual(b.maxX + 1e-6);
    expect(p.targetZ).toBeLessThanOrEqual(b.maxZ + 1e-6);
    expect(p.posY).toBeGreaterThan(0); // camera above the ground
    expect(Number.isFinite(p.posX) && Number.isFinite(p.posZ)).toBe(true);
  });
});

describe('CameraController3D chase (§ A6 Fahrmodus)', () => {
  it('places the camera behind the vehicle, looking at it', () => {
    const cam = new CameraController3D(worldCameraBounds(), settings({ smooth: false }));
    // Fahrtrichtung heading=0 → Vorwärts = +z; die Kamera muss dahinter (−z) sitzen.
    cam.setChase(100, 100, 0, 7.5, 0.5, true);
    cam.update(0.1);
    const p = cam.pose();
    expect(p.targetX).toBeCloseTo(100, 5);
    expect(p.targetZ).toBeCloseTo(100, 5);
    expect(p.posZ).toBeLessThan(100); // hinter dem Fahrzeug
    expect(p.posX).toBeCloseTo(100, 4); // seitlich zentriert
    expect(p.posY).toBeGreaterThan(0); // über dem Boden
  });

  it('takes the shortest yaw path when the heading flips', () => {
    const cam = new CameraController3D(worldCameraBounds(), settings({ smooth: true }));
    cam.setChase(100, 100, 0, 7.5, 0.5, true);
    const before = cam.goals();
    // Kleine Richtungsänderung darf nicht zu einem fast vollen Umlauf führen.
    cam.setChase(100, 100, 0.2, 7.5, 0.5);
    const after = cam.goals();
    expect(Math.abs(after.yaw - before.yaw)).toBeLessThan(0.5);
  });
});

describe('CameraController3D smoothing', () => {
  it('snaps immediately when smooth is off', () => {
    const cam = new CameraController3D(worldCameraBounds(), settings({ smooth: false }));
    cam.keyPan(1, 0, 1, false); // move right for 1s
    const gx = cam.goals().targetX;
    cam.update(0.016);
    expect(cam.pose().targetX).toBeCloseTo(gx, 6);
  });

  it('eases toward the goal over several frames when smooth is on', () => {
    const cam = new CameraController3D(worldCameraBounds(), settings({ smooth: true }));
    cam.applyPreset('overview'); // large dist goal
    const goal = cam.goals().dist;
    cam.update(0.016);
    const afterOne = cam.getDist();
    expect(afterOne).toBeGreaterThan(62); // moved toward goal
    expect(afterOne).toBeLessThan(goal); // but not all the way in one frame
    for (let i = 0; i < 240; i++) cam.update(0.016);
    expect(cam.getDist()).toBeCloseTo(goal, 1);
  });

  it('pan inertia coasts after release, then stops', () => {
    const cam = new CameraController3D(worldCameraBounds(), settings({ smooth: true }));
    cam.beginPan();
    cam.panScreen(-40, 0); // flick right
    cam.endPan();
    const before = cam.goals().targetX;
    cam.update(0.05);
    const after = cam.goals().targetX;
    expect(after).not.toBeCloseTo(before, 6); // coasted
    for (let i = 0; i < 200; i++) cam.update(0.05);
    const settled = cam.goals().targetX;
    cam.update(0.05);
    expect(cam.goals().targetX).toBeCloseTo(settled, 6); // came to rest
  });
});
