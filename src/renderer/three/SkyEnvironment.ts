// SkyEnvironment (v0.37) — the living atmosphere of the 3D world. Owns the sky
// dome, sun/moon, stars, the three scene lights and the fog, and drives them all
// from a single normalised time-of-day using the pure grading in environment.ts.
// It reads the shared environmentSettings store (persisted, not in the savegame),
// so a HUD slider or the auto-cycle toggle applies live. Purely presentational:
// nothing here touches the simulation (CLAUDE.md §1).

import {
  AmbientLight,
  BackSide,
  BufferAttribute,
  CanvasTexture,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  type BufferGeometry,
} from 'three';
import { grade, sunDirection, sunElevation, wrap01, type EnvGrade } from './environment.ts';
import { getEnvironmentSettings, subscribeEnvironmentSettings } from './environmentSettings.ts';

const DOME_RADIUS = 3000;
const BODY_DIST = 2600; // sun/moon distance from the camera
const STAR_RADIUS = 2800;

export class SkyEnvironment {
  private dome: Mesh;
  private domeColors: Float32Array; // per-vertex colour buffer we repaint each grade
  private domeVFactor: Float32Array; // per-vertex horizon→top factor (baked once)
  private sun: DirectionalLight;
  private hemi: HemisphereLight;
  private ambient: AmbientLight;
  private sunSprite: Sprite;
  private moonSprite: Sprite;
  private stars: Points;
  private starMat: PointsMaterial;
  private fog: Fog;
  private group = new Group();

  private tod: number;
  private _water = new Color(0x2a6a94);
  private unsub: () => void;

  constructor(
    private scene: Scene,
    private camera: PerspectiveCamera,
  ) {
    const s = getEnvironmentSettings();
    this.tod = s.timeOfDay;

    // --- sky dome: a big inverted sphere, vertex-coloured for a smooth gradient.
    const geo = new SphereGeometry(DOME_RADIUS, 24, 16);
    const pos = geo.getAttribute('position') as BufferAttribute;
    const n = pos.count;
    this.domeColors = new Float32Array(n * 3);
    this.domeVFactor = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const y = pos.getY(i) / DOME_RADIUS; // -1 (nadir) .. 1 (zenith)
      this.domeVFactor[i] = Math.pow(Math.max(0, y), 0.5); // horizon=0, top=1
    }
    geo.setAttribute('color', new BufferAttribute(this.domeColors, 3));
    const domeMat = new MeshBasicMaterial({ vertexColors: true, side: BackSide, fog: false, depthWrite: false });
    this.dome = new Mesh(geo, domeMat);
    this.dome.renderOrder = -2;
    this.group.add(this.dome);

    // --- stars: points on the upper hemisphere, faded in only at night.
    const starGeo = new SphereGeometry(STAR_RADIUS, 1, 1);
    const starPositions = makeStarPositions(600);
    starGeo.setAttribute('position', new BufferAttribute(starPositions, 3));
    this.starMat = new PointsMaterial({ color: 0xffffff, size: 8, sizeAttenuation: true, transparent: true, opacity: 0, fog: false, depthWrite: false });
    this.stars = new Points(starGeo, this.starMat);
    this.stars.renderOrder = -1;
    this.group.add(this.stars);

    // --- sun & moon billboards.
    this.sunSprite = new Sprite(new SpriteMaterial({ map: makeDiscTexture('#fff7e0', '#ffd27a'), transparent: true, depthWrite: false, fog: false }));
    this.sunSprite.scale.setScalar(220);
    this.moonSprite = new Sprite(new SpriteMaterial({ map: makeDiscTexture('#eef2ff', '#aab6d8'), transparent: true, depthWrite: false, fog: false }));
    this.moonSprite.scale.setScalar(150);
    this.group.add(this.sunSprite, this.moonSprite);

    this.scene.add(this.group);

    // --- lights (own the scene lighting the old static block used to set up).
    this.hemi = new HemisphereLight(0xffffff, 0x6b7a5a, 1.05);
    this.ambient = new AmbientLight(0xffffff, 0.25);
    this.sun = new DirectionalLight(0xfff2d8, 1.35);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.near = 1;
    sc.far = 400;
    sc.left = -140;
    sc.right = 140;
    sc.top = 140;
    sc.bottom = -140;
    this.scene.add(this.hemi, this.ambient, this.sun);

    // --- fog + background fallback (behind the dome, in case it is ever removed).
    this.fog = new Fog(0x9fd0ef, 180, 520);
    this.scene.fog = this.fog;
    this.scene.background = new Color(0x9fd0ef);

    this.apply(grade(this.tod));

    // Live-apply HUD changes: when the cycle is off, follow the slider exactly.
    this.unsub = subscribeEnvironmentSettings(() => {
      const cur = getEnvironmentSettings();
      if (!cur.cycle) this.tod = cur.timeOfDay;
    });
  }

  /** Current water tint (renderer reads this to colour the animated lake). */
  get waterColor(): Color {
    return this._water;
  }

  /** Advance the clock (if cycling) and repaint the sky/lights for this frame. */
  update(dt: number): void {
    const s = getEnvironmentSettings();
    if (s.cycle) this.tod = wrap01(this.tod + dt / (s.dayLengthMin * 60));
    this.apply(grade(this.tod));

    // Keep the dome/stars/bodies centred on the camera so the sky is infinite.
    const cp = this.camera.position;
    this.group.position.copy(cp);
    const sd = sunDirection(this.tod);
    this.sunSprite.position.set(sd.x * BODY_DIST, sd.y * BODY_DIST, sd.z * BODY_DIST);
    this.moonSprite.position.set(-sd.x * BODY_DIST, -sd.y * BODY_DIST, sd.z * BODY_DIST);
  }

  private apply(g: EnvGrade): void {
    // Sky dome vertex colours (horizon → top).
    const c = this.domeColors;
    const hr = g.skyHorizon.r;
    const hg = g.skyHorizon.g;
    const hb = g.skyHorizon.b;
    const dr = g.skyTop.r - hr;
    const dg = g.skyTop.g - hg;
    const db = g.skyTop.b - hb;
    for (let i = 0; i < this.domeVFactor.length; i++) {
      const f = this.domeVFactor[i]!;
      c[i * 3] = hr + dr * f;
      c[i * 3 + 1] = hg + dg * f;
      c[i * 3 + 2] = hb + db * f;
    }
    ((this.dome.geometry as BufferGeometry).getAttribute('color') as BufferAttribute).needsUpdate = true;

    // Fog + background fallback follow the horizon.
    this.fog.color.copy(g.fog);
    (this.scene.background as Color).copy(g.fog);

    // Dominant directional light: the sun while it is up, else a cool dim moon
    // from the opposite side (grade already carries the moonlit intensity/colour).
    const elev = sunElevation(this.tod);
    const dir = elev >= 0 ? sunDirection(this.tod) : { x: -sunDirection(this.tod).x, y: -sunDirection(this.tod).y, z: sunDirection(this.tod).z };
    this.sun.position.set(dir.x * 180, Math.max(20, dir.y * 180), dir.z * 180);
    this.sun.color.copy(g.sunColor);
    this.sun.intensity = g.sunIntensity;

    this.hemi.color.copy(g.hemiSky);
    this.hemi.groundColor.copy(g.hemiGround);
    this.hemi.intensity = g.hemiIntensity;
    this.ambient.intensity = g.ambient;

    // Sun/moon disc + star opacity.
    (this.sunSprite.material as SpriteMaterial).opacity = Math.max(0, Math.min(1, (elev + 0.08) * 4));
    (this.sunSprite.material as SpriteMaterial).color.copy(g.sunColor);
    (this.moonSprite.material as SpriteMaterial).opacity = g.moon;
    this.starMat.opacity = g.stars;

    this._water.copy(g.water);
  }

  dispose(): void {
    this.unsub();
    this.scene.remove(this.group, this.hemi, this.ambient, this.sun);
    this.dome.geometry.dispose();
    (this.dome.material as MeshBasicMaterial).dispose();
    this.stars.geometry.dispose();
    this.starMat.dispose();
    for (const s of [this.sunSprite, this.moonSprite]) {
      const m = s.material as SpriteMaterial;
      m.map?.dispose();
      m.dispose();
    }
  }
}

/** Random star positions on the upper hemisphere of a sphere (y biased up). */
function makeStarPositions(count: number): Float32Array {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * 0.85 + 0.1; // keep them above the horizon
    const y = v;
    const r = Math.sqrt(1 - y * y);
    arr[i * 3] = Math.cos(u) * r * STAR_RADIUS;
    arr[i * 3 + 1] = y * STAR_RADIUS;
    arr[i * 3 + 2] = Math.sin(u) * r * STAR_RADIUS;
  }
  return arr;
}

/** A soft radial disc texture (bright core → transparent edge) for sun/moon. */
function makeDiscTexture(inner: string, outer: string): CanvasTexture {
  const size = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  if (ctx) {
    const grd = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grd.addColorStop(0, inner);
    grd.addColorStop(0.45, outer);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);
  }
  return new CanvasTexture(cv);
}
