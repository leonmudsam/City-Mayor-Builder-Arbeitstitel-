import { describe, it, expect } from 'vitest';
import { CameraController3D } from '../src/renderer/three/CameraController3D.ts';
import { CameraExplorationBoundary } from '../src/renderer/three/CameraExplorationBoundary.ts';
import { worldOverviewCenter } from '../src/game/config/startRegion.config.ts';
import { CAMERA_LIMITS, worldCameraBounds } from '../src/renderer/three/CameraConfig.ts';
import { DEFAULT_CAMERA_SETTINGS, type CameraSettings } from '../src/renderer/three/cameraSettings.ts';
import { deriveClickAction, deriveDragMode } from '../src/renderer/three/cameraInputMapping.ts';

const LMB = 0;
const MMB = 1;
const RMB = 2;

describe('cameraInputMapping — Belegung §10.3 (G2.2)', () => {
  it('free roam: LMB zieht = schwenken, LMB-Klick = auswaehlen', () => {
    expect(deriveDragMode({ button: LMB, ctrlKey: false, isPlacing: false })).toBe('pan');
    expect(deriveClickAction({ button: LMB, ctrlKey: false, isPlacing: false })).toBe('select');
  });

  it('beim Platzieren: LMB zieht = malen/bauen, LMB-Klick = setzen', () => {
    expect(deriveDragMode({ button: LMB, ctrlKey: false, isPlacing: true })).toBe('build');
    expect(deriveClickAction({ button: LMB, ctrlKey: false, isPlacing: true })).toBe('place');
  });

  it('Mitteltaste schwenkt in beiden Modi und tut beim Klick nichts', () => {
    for (const isPlacing of [false, true]) {
      expect(deriveDragMode({ button: MMB, ctrlKey: false, isPlacing })).toBe('pan');
      expect(deriveClickAction({ button: MMB, ctrlKey: false, isPlacing })).toBe('none');
    }
  });

  it('Rechts-Zug dreht in beiden Modi; nur der Rechts-Klick bricht ab', () => {
    for (const isPlacing of [false, true]) {
      expect(deriveDragMode({ button: RMB, ctrlKey: false, isPlacing })).toBe('orbit');
      expect(deriveClickAction({ button: RMB, ctrlKey: false, isPlacing })).toBe('cancel');
    }
  });

  it('Strg+Links dreht auch waehrend des Platzierens; der Strg-Klick tut nichts', () => {
    expect(deriveDragMode({ button: LMB, ctrlKey: true, isPlacing: true })).toBe('orbit');
    expect(deriveDragMode({ button: LMB, ctrlKey: true, isPlacing: false })).toBe('orbit');
    expect(deriveClickAction({ button: LMB, ctrlKey: true, isPlacing: true })).toBe('none');
  });

  it('der Bauentwurf ueberlebt jede Kamerabewegung: kein Zug verwirft ihn', () => {
    // Ein Zug (dragged) fuehrt nie zu einer Klickaktion; die einzige verwerfende
    // Klickaktion ist der Rechts-Klick — also nie waehrend einer Kamera-Drehung/-Schwenk.
    for (const button of [LMB, MMB, RMB]) {
      for (const ctrlKey of [false, true]) {
        const drag = deriveDragMode({ button, ctrlKey, isPlacing: true });
        // Kein Zug-Modus ist selbst „abbrechen"; Abbruch entsteht nur aus einem Klick.
        expect(drag === 'pan' || drag === 'orbit' || drag === 'build').toBe(true);
      }
    }
    // Waehrend des Bauens dreht Rechts-Zug (kein Abbruch); nur der Rechts-Klick bricht ab.
    expect(deriveDragMode({ button: RMB, ctrlKey: false, isPlacing: true })).toBe('orbit');
    expect(deriveClickAction({ button: RMB, ctrlKey: false, isPlacing: true })).toBe('cancel');
  });
});

const settings = (over: Partial<CameraSettings> = {}) => () => ({ ...DEFAULT_CAMERA_SETTINGS, ...over });

/** Erlaubtes Rechteck [60..90]×[60..90] als Mini-„freigeschaltete Union". */
const rectBoundary = (soft = 6, hard = 10) =>
  new CameraExplorationBoundary({
    worldTiles: 128,
    allowed: (x, y) => x >= 60 && x <= 90 && y >= 60 && y <= 90,
    softDistance: soft,
    hardDistance: hard,
    step: 2,
  });

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

describe('CameraExplorationBoundary (§ Change 9.0 / S3b)', () => {
  it('leaves targets deep inside the unlocked union untouched at full speed', () => {
    const b = rectBoundary();
    const c = b.constrain(75, 75); // Mitte des erlaubten Rechtecks
    expect(c.x).toBeCloseTo(75, 5);
    expect(c.z).toBeCloseTo(75, 5);
    expect(c.slow).toBe(1);
  });

  it('pulls a target far outside back onto the hard ring', () => {
    const hard = 10;
    const b = rectBoundary(6, hard);
    const c = b.constrain(300, 300); // weit außerhalb
    // Zurückgeführt in die Nähe der nächsten erlaubten Ecke (~90,90) + hartes Band.
    expect(c.x).toBeLessThan(90 + hard + 4);
    expect(c.z).toBeLessThan(90 + hard + 4);
    expect(c.slow).toBe(0);
  });

  it('slows down within the soft band before the hard limit', () => {
    const b = rectBoundary(6, 12);
    const near = b.constrain(96, 75); // ~6 Kacheln jenseits der rechten Kante
    expect(near.slow).toBeGreaterThan(0);
    expect(near.slow).toBeLessThan(1);
  });

  it('never constrains when nothing is unlocked (empty union = no boundary)', () => {
    const b = new CameraExplorationBoundary({ worldTiles: 128, allowed: () => false, step: 2 });
    const c = b.constrain(10, 200);
    expect(c.x).toBe(10);
    expect(c.z).toBe(200);
    expect(c.slow).toBe(1);
  });
});

describe('CameraController3D exploration boundary', () => {
  it('keeps the pan/focus target inside the unlocked union', () => {
    const cam = new CameraController3D(worldCameraBounds(), settings({ smooth: false }));
    cam.setExplorationBoundary(rectBoundary(6, 10));
    cam.focusGround(400, 400); // versuche, in gesperrtes Gebiet zu zielen
    const g = cam.goals();
    expect(g.targetX).toBeLessThan(90 + 10 + 4);
    expect(g.targetZ).toBeLessThan(90 + 10 + 4);
  });

  it('lets the camera roam freely again once the boundary is cleared (dev cheat)', () => {
    const cam = new CameraController3D(worldCameraBounds(), settings({ smooth: false }));
    cam.setExplorationBoundary(rectBoundary(6, 10));
    cam.setExplorationBoundary(undefined); // Cheat „Kamera-Grenzen aus"
    cam.focusGround(300, 300);
    const g = cam.goals();
    // Nur noch die Welt-Rechteckgrenze begrenzt (padding 8 → maxX = 512+8).
    expect(g.targetX).toBeCloseTo(300, 5);
    expect(g.targetZ).toBeCloseTo(300, 5);
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
    expect(overview.targetX).toBeCloseTo(worldOverviewCenter.x, 5);
    expect(overview.targetZ).toBeCloseTo(worldOverviewCenter.y, 5);
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
