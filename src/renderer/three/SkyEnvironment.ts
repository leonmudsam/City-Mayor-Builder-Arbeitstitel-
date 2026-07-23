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
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  TextureLoader,
  Vector3,
  BufferGeometry,
  type Texture,
} from 'three';
import { grade, sunDirection, sunElevation, wrap01, type EnvGrade } from './environment.ts';
import { getEnvironmentSettings, subscribeEnvironmentSettings } from './environmentSettings.ts';
import { environmentImage } from '../../assets/registry.ts';

const DOME_RADIUS = 3000;
const BODY_DIST = 2600; // sun/moon distance from the camera
const STAR_RADIUS = 2800;
const RAIN_TINT = new Color(0x60778d);
const RAIN_TOP = new Color(0x263a50);
const FOG_TINT = new Color(0xc6d0d0);

export class SkyEnvironment {
  private dome: Mesh;
  private domeColors: Float32Array; // per-vertex colour buffer we repaint each grade
  private domeVFactor: Float32Array; // signed: ocean nadir (-1) → horizon (0) → sky top (+1)
  private sun: DirectionalLight;
  private hemi: HemisphereLight;
  private ambient: AmbientLight;
  private sunSprite: Sprite;
  private moonSprite: Sprite;
  private stars: Points;
  private starMat: PointsMaterial;
  private clouds: { sprite: Sprite; mat: SpriteMaterial; speed: number; phase: number }[] = [];
  private cloudMap: Texture;
  private cloudTime = 0;
  private fog: Fog;
  private group = new Group();
  private weatherGroup = new Group();
  private rain: LineSegments;
  private rainMat: LineBasicMaterial;
  private rainPositions: Float32Array;
  private weatherTop = new Color();
  private weatherHorizon = new Color();
  private weatherFog = new Color();
  private weatherWater = new Color();
  private weatherSun = new Color();

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
      this.domeVFactor[i] = Math.sign(y) * Math.sqrt(Math.abs(y));
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

    // AI-generated cloud-bank texture with a procedural alpha-mask fallback.
    // A handful of huge billboards gives the island overview atmospheric depth
    // at a fixed draw-call budget and never touches the simulation.
    this.cloudMap = makeCloudMaskTexture();
    for (let i = 0; i < 10; i++) {
      const phase = (i / 10) * Math.PI * 2 + Math.sin(i * 7.3) * 0.22;
      const mat = new SpriteMaterial({
        color: 0xe7eef2,
        alphaMap: this.cloudMap,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        fog: false,
      });
      const sprite = new Sprite(mat);
      const dist = 330 + ((i * 137) % 410);
      sprite.position.set(Math.cos(phase) * dist, 115 + ((i * 53) % 125), Math.sin(phase) * dist);
      const scale = 190 + ((i * 71) % 180);
      sprite.scale.set(scale, scale * (0.32 + (i % 3) * 0.05), 1);
      this.clouds.push({ sprite, mat, speed: 1.2 + (i % 4) * 0.35, phase });
      this.group.add(sprite);
    }
    const cloudUrl = environmentImage('cloud_bank');
    if (cloudUrl) {
      new TextureLoader().load(
        cloudUrl,
        (texture) => {
          const previous = this.cloudMap;
          this.cloudMap = texture;
          for (const cloud of this.clouds) {
            cloud.mat.alphaMap = texture;
            cloud.mat.needsUpdate = true;
          }
          previous.dispose();
        },
        undefined,
        () => undefined,
      );
    }

    this.scene.add(this.group);

    // One draw call for a broad curtain of stylised rain. The group follows the
    // camera on X/Z while every streak stays world-vertical. That keeps even the
    // island overview readable without hundreds of particle objects.
    const rainDrops = 420;
    this.rainPositions = new Float32Array(rainDrops * 2 * 3);
    for (let i = 0; i < rainDrops; i++) {
      const o = i * 6;
      const x = (Math.random() - 0.5) * 460;
      const y = Math.random() * 230 - 15;
      const z = (Math.random() - 0.5) * 460;
      const length = 3.5 + Math.random() * 5;
      this.rainPositions[o] = x;
      this.rainPositions[o + 1] = y;
      this.rainPositions[o + 2] = z;
      this.rainPositions[o + 3] = x + 0.9;
      this.rainPositions[o + 4] = y - length;
      this.rainPositions[o + 5] = z + 0.35;
    }
    const rainGeo = new BufferGeometry();
    rainGeo.setAttribute('position', new BufferAttribute(this.rainPositions, 3));
    this.rainMat = new LineBasicMaterial({
      color: 0xb9d9ee,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      fog: true,
    });
    this.rain = new LineSegments(rainGeo, this.rainMat);
    this.rain.frustumCulled = false;
    this.rain.visible = s.weather === 'rain';
    this.weatherGroup.add(this.rain);
    this.scene.add(this.weatherGroup);

    // --- lights (own the scene lighting the old static block used to set up).
    this.hemi = new HemisphereLight(0xffffff, 0x6b7a5a, 1.05);
    this.ambient = new AmbientLight(0xffffff, 0.25);
    this.sun = new DirectionalLight(0xfff2d8, 1.35);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    // Soft-shadow tuning (§ MVP3 Phase 2). `radius` widens the PCF blur kernel so
    // shadows read as gentle contact shadows, not hard stamps. `normalBias` pushes
    // the sample along the surface normal to kill the shadow acne the new terraced
    // mountain slopes would otherwise self-cast; `bias` trims the last shimmer
    // without introducing visible peter-panning at this frustum size.
    this.sun.shadow.radius = 3.5;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.6;
    const sc = this.sun.shadow.camera;
    sc.near = 1;
    sc.far = 400;
    sc.left = -140;
    sc.right = 140;
    sc.top = 140;
    sc.bottom = -140;
    // Das lokale ±140-Schatten-Fenster folgt auch auf der 512²-Welt dem
    // Kamera-Fokus (Sonne + Target werden je Frame mitgeführt) — vorher war es
    // fix am Ursprung verankert und die Stadt läge außerhalb.
    this.scene.add(this.hemi, this.ambient, this.sun, this.sun.target);

    // --- fog + background fallback (behind the dome, in case it is ever removed).
    // Distanzen auf die 512²-Welt skaliert — der Insel-Überblick
    // (Kameradistanz ~620) bleibt lesbar, nur der Horizont hinter dem Ozean
    // verläuft atmosphärisch (kein "milchiges" Gesamtbild mehr).
    this.fog = new Fog(0x9fd0ef, 520, 1600);
    this.scene.fog = this.fog;
    this.scene.background = new Color(0x9fd0ef);

    this.apply(grade(this.tod), s.weather);

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
    this.apply(grade(this.tod), s.weather);
    this.cloudTime += dt;
    for (const cloud of this.clouds) {
      cloud.sprite.position.x += cloud.speed * dt;
      cloud.sprite.position.z += Math.sin(this.cloudTime * 0.035 + cloud.phase) * dt * 0.3;
      if (cloud.sprite.position.x > 820) cloud.sprite.position.x = -820;
    }

    // Keep the dome/stars/bodies centred on the camera so the sky is infinite.
    const cp = this.camera.position;
    this.group.position.copy(cp);
    this.weatherGroup.position.set(cp.x, 0, cp.z);
    this.rain.visible = s.weather === 'rain';
    if (this.rain.visible) {
      for (let i = 0; i < this.rainPositions.length; i += 6) {
        const nextY = this.rainPositions[i + 1]! - dt * 58;
        const wrappedY = nextY < -18 ? nextY + 250 : nextY;
        const length = this.rainPositions[i + 1]! - this.rainPositions[i + 4]!;
        this.rainPositions[i + 1] = wrappedY;
        this.rainPositions[i + 4] = wrappedY - length;
      }
      (this.rain.geometry.getAttribute('position') as BufferAttribute).needsUpdate = true;
    }
    const sd = sunDirection(this.tod);
    this.sunSprite.position.set(sd.x * BODY_DIST, sd.y * BODY_DIST, sd.z * BODY_DIST);
    this.moonSprite.position.set(-sd.x * BODY_DIST, -sd.y * BODY_DIST, sd.z * BODY_DIST);
  }

  private apply(g: EnvGrade, weather: 'clear' | 'rain' | 'fog'): void {
    // The lower dome blends toward the water grade. A steep island overview
    // therefore still sees an infinite blue ocean beyond the finite heightfield
    // instead of the flat fog/background colour.
    this.weatherTop.copy(g.skyTop);
    this.weatherHorizon.copy(g.skyHorizon);
    this.weatherFog.copy(g.fog);
    this.weatherWater.copy(g.water);
    this.weatherSun.copy(g.sunColor);
    if (weather === 'rain') {
      this.weatherTop.lerp(RAIN_TOP, 0.72);
      this.weatherHorizon.lerp(RAIN_TINT, 0.58);
      this.weatherFog.lerp(RAIN_TINT, 0.62);
      this.weatherWater.lerp(RAIN_TINT, 0.44);
      this.weatherSun.lerp(FOG_TINT, 0.5);
      this.fog.near = 230;
      this.fog.far = 820;
    } else if (weather === 'fog') {
      this.weatherTop.lerp(FOG_TINT, 0.55);
      this.weatherHorizon.lerp(FOG_TINT, 0.82);
      this.weatherFog.lerp(FOG_TINT, 0.9);
      this.weatherWater.lerp(FOG_TINT, 0.34);
      this.weatherSun.lerp(FOG_TINT, 0.7);
      this.fog.near = 80;
      this.fog.far = 430;
    } else {
      this.fog.near = 520;
      this.fog.far = 1600;
    }

    const c = this.domeColors;
    const hr = this.weatherHorizon.r;
    const hg = this.weatherHorizon.g;
    const hb = this.weatherHorizon.b;
    const dr = this.weatherTop.r - hr;
    const dg = this.weatherTop.g - hg;
    const db = this.weatherTop.b - hb;
    for (let i = 0; i < this.domeVFactor.length; i++) {
      const f = this.domeVFactor[i]!;
      if (f >= 0) {
        c[i * 3] = hr + dr * f;
        c[i * 3 + 1] = hg + dg * f;
        c[i * 3 + 2] = hb + db * f;
      } else {
        const ocean = -f;
        c[i * 3] = hr + (this.weatherWater.r - hr) * ocean;
        c[i * 3 + 1] = hg + (this.weatherWater.g - hg) * ocean;
        c[i * 3 + 2] = hb + (this.weatherWater.b - hb) * ocean;
      }
    }
    ((this.dome.geometry as BufferGeometry).getAttribute('color') as BufferAttribute).needsUpdate = true;

    // Fog + background fallback follow the horizon.
    this.fog.color.copy(this.weatherFog);
    // If the dome is clipped on a very steep/far view, its fallback reads as
    // ocean rather than a finite grey board around the island.
    (this.scene.background as Color).copy(this.weatherWater);

    // Dominant directional light: the sun while it is up, else a cool dim moon
    // from the opposite side (grade already carries the moonlit intensity/colour).
    const elev = sunElevation(this.tod);
    const dir = elev >= 0 ? sunDirection(this.tod) : { x: -sunDirection(this.tod).x, y: -sunDirection(this.tod).y, z: sunDirection(this.tod).z };
    // Boden-Fokus der Kamera (§ MVP4 P3): Blickstrahl auf y=0 projiziert — Sonne
    // und Schatten-Target wandern mit, damit das Schatten-Fenster die Stadt trifft.
    const fwd = new Vector3();
    this.camera.getWorldDirection(fwd);
    const t = fwd.y < -0.05 ? this.camera.position.y / -fwd.y : 0;
    const fx = this.camera.position.x + fwd.x * t;
    const fz = this.camera.position.z + fwd.z * t;
    this.sun.position.set(fx + dir.x * 180, Math.max(20, dir.y * 180), fz + dir.z * 180);
    this.sun.target.position.set(fx, 0, fz);
    this.sun.color.copy(this.weatherSun);
    this.sun.intensity = g.sunIntensity * (weather === 'rain' ? 0.42 : weather === 'fog' ? 0.68 : 1);

    this.hemi.color.copy(g.hemiSky);
    this.hemi.groundColor.copy(g.hemiGround);
    this.hemi.intensity = g.hemiIntensity * (weather === 'rain' ? 0.7 : weather === 'fog' ? 0.82 : 1);
    this.ambient.intensity = g.ambient * (weather === 'rain' ? 0.78 : weather === 'fog' ? 0.9 : 1);

    // Sun/moon disc + star opacity.
    (this.sunSprite.material as SpriteMaterial).opacity = Math.max(0, Math.min(1, (elev + 0.08) * 4));
    (this.sunSprite.material as SpriteMaterial).color.copy(this.weatherSun);
    (this.moonSprite.material as SpriteMaterial).opacity = g.moon;
    this.starMat.opacity = g.stars;
    const daylight = Math.max(0.15, Math.min(1, g.sunIntensity / 1.2));
    for (const cloud of this.clouds) {
      cloud.mat.opacity =
        weather === 'rain' ? 0.54 : weather === 'fog' ? 0.38 : 0.11 + daylight * 0.17;
      cloud.mat.color
        .copy(this.weatherHorizon)
        .lerp(weather === 'rain' ? RAIN_TINT : FOG_TINT, weather === 'rain' ? 0.34 : 0.72);
    }

    this._water.copy(this.weatherWater);
  }

  dispose(): void {
    this.unsub();
    this.scene.remove(this.group, this.weatherGroup, this.hemi, this.ambient, this.sun, this.sun.target);
    this.dome.geometry.dispose();
    (this.dome.material as MeshBasicMaterial).dispose();
    this.stars.geometry.dispose();
    this.starMat.dispose();
    for (const cloud of this.clouds) cloud.mat.dispose();
    this.cloudMap.dispose();
    this.rain.geometry.dispose();
    this.rainMat.dispose();
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

/** Small fallback cloud alpha mask used until/if the drop-in image resolves. */
function makeCloudMaskTexture(): CanvasTexture {
  const size = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);
    const puffs = [
      [62, 132, 62],
      [105, 102, 74],
      [154, 124, 68],
      [196, 142, 48],
      [128, 158, 76],
    ] as const;
    for (const [x, y, r] of puffs) {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, 'rgba(255,255,255,.95)');
      gradient.addColorStop(0.48, 'rgba(225,225,225,.7)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
  return new CanvasTexture(cv);
}
