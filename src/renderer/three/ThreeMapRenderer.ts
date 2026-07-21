// ThreeMapRenderer (v0.29) — the real 3D map. A three.js scene that reads the
// SAME controller state as the 2D/iso Pixi renderer and reports through the same
// RendererCallbacks, so switching to "3D" in the settings changes only how the
// world is drawn — never the game logic or the savegame.
//
// Coordinate system: one logical tile = one world unit. Tile (tx,ty) maps to
// world (x = tx, z = ty), Y is up, the ground sits at y = 0. A building whose
// top-left footprint tile is (bx,by) with size (w,h) is centred at
// (bx + w/2, by + h/2) in XZ.
//
// Assets are drop-in: a building draws its `.glb` from src/assets/models/… when
// present (see registry `buildingModel`), otherwise a procedural block sized by
// footprint + height class + upgrade level. The scene therefore works with zero
// models and reaches the full look purely by adding files (docs/3D_MODEL_MANIFEST.md).

import {
  ACESFilmicToneMapping,
  Box3,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Clock,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshStandardMaterial,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  RepeatWrapping,
  Scene,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Material,
  type Object3D as TObject3D,
  type Texture,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SkyEnvironment } from './SkyEnvironment.ts';
import { SPLAT_BANDS, terrainHeightAt, WATER_LEVEL } from './terrainHeight.ts';
import { blendedVisualSplat, regionVisualProfile } from './worldVisualProfiles.ts';
import { CameraController3D } from './CameraController3D.ts';
import { CameraInputController, type CameraInputHost } from './CameraInputController.ts';
import { worldCameraBounds, type CameraPreset } from './CameraConfig.ts';
import { getCameraSettings } from './cameraSettings.ts';
import type { GameController } from '../../game/commands/controller.ts';
import type { BuildingDef } from '../../game/config/types.ts';
import type { BuildingInstance, TerrainType } from '../../game/types.ts';
import { regionOfTile, worldTerrainAt } from '../../game/map/world.ts';
import { BAKED_REGIONS, WORLD_TILES, regionBounds, regionIdAt } from '../../game/config/startRegion.config.ts';
import { validatePlacement } from '../../game/buildings/placement.ts';
import { locationBonusPct } from '../../game/buildings/location.ts';
import { effectiveEffects } from '../../game/buildings/effects.ts';
import {
  buildingModel,
  buildingConstructionModel,
  terrainModel,
  propModel,
  markerModel,
  effectModel,
  vehicleModel,
  uiModel,
  terrainTextureUrl,
  roadTextureUrl,
  environmentImage,
} from '../../assets/registry.ts';
import {
  TERRAIN_TILE_MODELS,
  MOUNTAIN_FEATURE_MODELS,
  PINE_TREE_MODELS,
  BROADLEAF_TREE_MODELS,
  LARGE_PINE_TREE_MODELS,
  BUSH_MODELS,
  ROCK_CLUSTER_MODELS,
  REED_MODELS,
  DEADWOOD_MODELS,
  SCENIC_PROP_MODELS,
  VEHICLE_CAR_MODELS,
  VAN_MODELS,
  ACTIVITY_VEHICLE_MODELS,
  SMOKE_EFFECT_MODELS,
  MARKER_MODELS,
  CONSTRUCTION_MODELS,
  UI_SELECTION_RING_MODELS,
  UI_UPGRADE_BUTTON_MODELS,
  UI_BUILD_BUTTON_MODELS,
} from '../../assets/modelManifest.ts';
import { CATEGORY_COLORS, TERRAIN_COLORS } from '../colors.ts';
import type { IMapRenderer, InfoLayerMode, RendererCallbacks } from '../IMapRenderer.ts';

const MAX_SMOKE = 40;
const MAX_CARS = 10;

/** Ambient-traffic route endpoints (§ Verkehr Haus→Straße→Ziel): cars drive from
 *  a residential building to a workplace/destination building, never the other
 *  way round and never a category that isn't a real building (roads/decoration). */
const RESIDENTIAL_CATEGORIES: ReadonlySet<string> = new Set(['residential']);
const TRAFFIC_DESTINATION_CATEGORIES: ReadonlySet<string> = new Set([
  'production',
  'services',
  'economy',
  'energy',
  'government',
  'leisure',
  'infrastructure',
  'special',
]);

/**
 * Default-Bauhöhe je Größenklasse (§ Gebäudesystem 2.0 / A3): die Silhouette
 * folgt der Bedeutung des Gebäudes, nicht seiner Kategorie — ein 8×8-Kraftwerk
 * ragt, ein 1×1-Brunnen duckt sich. `visual.heightClass` bleibt der Override
 * pro Def; Stufen erhöhen zusätzlich (gedeckelt, s. `stageHeightMul`).
 */
const SIZE_CLASS_HEIGHT: Record<string, number> = {
  XS: 0.3,
  S: 1,
  M: 1.4,
  L: 2.2,
  XL: 3,
  XXL: 4,
};

/** Stufen-Höhenfaktor, auf ×3 gedeckelt — Wolkenkratzer ja, Weltraumnadel nein. */
function stageHeightMul(upgradeLevel: number): number {
  return Math.min(3, 1 + upgradeLevel * 0.45);
}

/** Effektive Bauhöhe aus Größenklasse (oder Override) und Stufe. */
function buildingHeight(def: BuildingDef, upgradeLevel: number): number {
  const hc = def.visual?.heightClass ?? SIZE_CLASS_HEIGHT[def.sizeClass] ?? 1;
  return Math.max(0.12, hc * 0.95 * stageHeightMul(upgradeLevel));
}

const gltfLoader = new GLTFLoader();
/** URL → loaded scene, so a model is fetched at most once and cloned per use. */
const modelCache = new Map<string, Promise<TObject3D>>();
/** Geometries/materials owned by a cached model. `Object3D.clone(true)` SHARES
 *  these with the cache, so disposeGroup must never dispose them or later clones
 *  would render blank. Per-use resources we create ourselves are NOT registered
 *  here and are disposed normally. */
const cacheOwned = new WeakSet<object>();
function loadModel(url: string): Promise<TObject3D> {
  let p = modelCache.get(url);
  if (!p) {
    p = gltfLoader.loadAsync(url).then((g) => {
      g.scene.traverse((o) => {
        const m = o as Mesh;
        if (m.geometry) cacheOwned.add(m.geometry);
        const mat = (m as unknown as { material?: Material | Material[] }).material;
        if (Array.isArray(mat)) mat.forEach((x) => cacheOwned.add(x));
        else if (mat) cacheOwned.add(mat);
      });
      return g.scene;
    });
    modelCache.set(url, p);
  }
  return p;
}

// Terrain-Texturen splatmap ground shader (§ Terrain System V2): the ground stays
// the existing vertex-coloured heightfield (never a regression when no texture is
// dropped in) but blends real material photos on top wherever the drop-in registry
// has them. Only a small representative texture per category is sampled — adding
// stone/sand/etc. later just needs the file dropped in, see docs/TERRAIN_TEXTURES.md.
const textureLoader = new TextureLoader();
const textureCache = new Map<string, Promise<Texture> | undefined>();
/** Ground mesh quads per tile edge (§ MVP3 Phase 1 — Organisches Terrain-Mesh).
 *  1 = one vertex per tile corner (pre-v0.46 behaviour). 2 gives visibly smooth
 *  curvature at ~4x the vertex count of the max board (still one draw call) —
 *  kept as the default; 3 (~9x) is deliberately not used, only noted here as a
 *  possible future "high" graphics setting. */
const GROUND_SUBDIV = 2;
/** Boden-Chunk-Kante in Kacheln (§ MVP4 P3): 384/48 = 8×8 Chunks à ~9,4k Verts —
 *  Frustum-Culling pro Chunk, Sektor-Unlock baut nur betroffene Chunks neu. */
const GROUND_CHUNK = 48;

/** One world unit of ground = this many texture repeats, so a 1254px "nah"-detail
 *  photo reads as close-up ground rather than a stretched smear. */
const SPLAT_TILE_SCALE = 0.5;
// § A3 (Welt 2.0): Biom-gewichteter Splat. grass/stone/cliff/mountain/snow
// kommen aus Höhe & Hang, forest/farm/sand aus dem Biom-Vertex-Attribut (aus
// dem gebackenen Terrain-Grid). Jede Textur ist Drop-in — fehlt sie, blendet
// die Ebene sauber auf die stilisierte Vertex-Farbe zurück (nie kaputt).
const SPLAT_LAYERS = [
  { key: 'grass', texture: 'grass_meadow', triplanar: false },
  { key: 'forest', texture: 'terrain_forest_floor', triplanar: false },
  { key: 'farm', texture: 'terrain_farmland', triplanar: false },
  { key: 'dry', texture: 'terrain_grass_dry', triplanar: false },
  { key: 'desert', texture: 'desert_sand_red', triplanar: false },
  { key: 'swamp', texture: 'swamp_mud', triplanar: false },
  { key: 'sand', texture: 'terrain_sand_coast', triplanar: false },
  { key: 'coast', texture: 'coast_pebbles', triplanar: false },
  { key: 'stone', texture: 'terrain_rock', triplanar: false },
  { key: 'cliff', texture: 'terrain_cliff', triplanar: true },
  { key: 'mountain', texture: 'mountain_rock_base', triplanar: true },
  { key: 'snow', texture: 'mountain_snow', triplanar: false },
] as const;

/** Loads (and caches, by URL) any drop-in texture — shared by the terrain splat
 *  layers and the road/bridge surfaces below, so the same file is never fetched
 *  twice even if both systems reference it (e.g. `terrain_road_edge`). */
function loadTextureByUrl(url: string): Promise<Texture> {
  let p = textureCache.get(url);
  if (!p) {
    p = textureLoader.loadAsync(url).then((tex) => {
      tex.wrapS = RepeatWrapping;
      tex.wrapT = RepeatWrapping;
      tex.colorSpace = SRGBColorSpace;
      return tex;
    });
    textureCache.set(url, p);
  }
  return p;
}

/** Loads the drop-in PNG for one splat layer; `undefined` if the user hasn't
 *  added that texture yet — never a hard dependency. */
function loadSplatTexture(name: string): Promise<Texture> | undefined {
  const url = terrainTextureUrl(name);
  return url ? loadTextureByUrl(url) : undefined;
}

/** Loads the drop-in PNG for one road/bridge surface (§ Straßen als Textur);
 *  `undefined` if not supplied yet. */
function loadRoadTexture(name: string): Promise<Texture> | undefined {
  const url = roadTextureUrl(name);
  return url ? loadTextureByUrl(url) : undefined;
}

/** Optional generated atmosphere texture shared by region fog layers. */
function loadEnvironmentTexture(name: string): Promise<Texture> | undefined {
  const url = environmentImage(name);
  return url ? loadTextureByUrl(url) : undefined;
}

/** Small deterministic hash → 0..1, so per-building colour jitter is stable. */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

/** One shared, lazily-textured MeshStandardMaterial per road/bridge surface role
 *  (§ Straßen als Textur, v0.44) — every road tile reuses the SAME instance per
 *  role, so a dropped-in texture only has to load once and every tile picks it
 *  up together via `material.map` + `needsUpdate` (no per-tile shader work). */
interface RoadMaterials {
  asphalt: MeshStandardMaterial;
  mountain: MeshStandardMaterial;
  edge: MeshStandardMaterial;
  dash: MeshStandardMaterial;
  roundabout: MeshStandardMaterial;
  bridgeDeck: MeshStandardMaterial;
  boardwalk: MeshStandardMaterial;
  // § A5 Straßen-Redesign: heller Gehweg-Beton, Laternenmast + emissiver Kopf.
  sidewalk: MeshStandardMaterial;
  lampPost: MeshStandardMaterial;
  lampHead: MeshStandardMaterial;
}

interface BuildingNode {
  group: Group;
  sig: string; // defId|upgradeLevel|status — rebuild only when this changes
  rotor?: TObject3D; // wind-turbine blades to spin
  smoke?: Vector3; // chimney anchor (world) for active production
}

interface Car {
  mesh: Object3D;
  /** Road-tile route the car currently drives (§ Verkehr Haus→Straße→Ziel).
   *  Built from a real house → destination BFS path when possible, else a
   *  momentum-based random walk (never both empty while the car is alive). */
  path: { x: number; y: number }[];
  idx: number; // current path segment: path[idx] → path[idx+1]
  t: number; // 0..1 along that segment
  speed: number;
}

export class ThreeMapRenderer implements IMapRenderer {
  private scene = new Scene();
  private camera = new PerspectiveCamera(50, 1, 0.5, 4000);
  private renderer: WebGLRenderer | undefined;
  private host: HTMLElement | undefined;
  private clock = new Clock();
  private raycaster = new Raycaster();

  // Central camera + input (v0.30): the renderer only reads the pose each frame.
  private cam = new CameraController3D(worldCameraBounds(), getCameraSettings);
  private input: CameraInputController | undefined;

  // Living atmosphere (v0.37): day/night sky, sun/moon, stars, lights + fog.
  private env: SkyEnvironment | undefined;
  // Animated water surface: a shared time uniform fed into the wave shader, plus
  // the material of the current lake so it can be tinted by the sky each frame.
  private waterTime = { value: 0 };
  private waterMat: MeshStandardMaterial | undefined;
  // Shared road/bridge surface materials (§ Straßen als Textur), built once on
  // first use and textured in-place as drop-in files resolve (see getRoadMats).
  private roadMats: RoadMaterials | undefined;

  private buildingGroup = new Group();
  private terrainGroup = new Group();
  // Chunk-Boden (§ MVP4 P3): persistente Gruppe + Cache — bei Sektor-Unlock
  // werden nur die betroffenen Chunks neu gebaut, nie das ganze Inselmesh.
  private groundChunkGroup = new Group();
  private groundChunks = new Map<string, { mesh: Mesh; sig: string }>();
  private oceanBuilt = false;
  private oceanGroup = new Group();
  // Organischer Regions-Nebel (§ Welt 2.0 / A3): ein Volumen je gesperrter
  // Region (Randkontur + Silhouetten); Unlock startet die Aufdeck-Animation.
  private fogGroup = new Group();
  private fogVolumes = new Map<
    number,
    { group: Group; mats: { mat: MeshStandardMaterial; base: number }[]; fading: number }
  >();
  private vegetationGroup = new Group();
  private liveGroup = new Group();
  private overlayGroup = new Group();
  private markerGroup = new Group();
  private ground: Mesh | undefined; // invisible pick plane
  private ghost: Group | undefined;
  /** Cosmetic facing chosen for the building about to be placed (§ Gebäude-
   *  Rotation), mirrored from the UI store via setPlacingRotation(). */
  private placingRotation: 0 | 90 | 180 | 270 = 0;
  private markerTex = new Map<string, CanvasTexture>();
  /** One marker per building. `obj` is a camera-facing sprite billboard OR a
   *  dropped-in 3D marker model; `pulse`/`spin` drive the idle animation. */
  private markers: {
    obj: Object3D;
    baseY: number;
    baseScale: number;
    pulse: boolean;
    spin: boolean;
    kind: MarkerKind;
    x: number;
    z: number;
  }[] = [];
  /** Tiles covered by ANY building footprint (roads included) — vegetation &
   *  car pathing read this so nothing spawns on top of the city. */
  private occupied = new Set<string>();
  private vegKey = '';

  private nodes = new Map<string, BuildingNode>();
  private lastVersion = -1;
  private terrainKey = '';
  private regionStatus = new Map<number, string>();

  private placingDefId: string | undefined;
  private selectedId: string | undefined;
  private infoLayerMode: InfoLayerMode = 'problems';
  private lastHoverKey = '';

  private smoke: { obj: Object3D; mat: SpriteMaterial | undefined; vy: number; age: number; ttl: number }[] = [];
  private smokeTimer = 0;
  // Optional drop-in smoke effect model (§ Effekte). Loaded once; while absent the
  // procedural sprite puff is used. 'none'→not tried, then loading/ready/fail.
  private smokeSrc: TObject3D | undefined;
  private smokeSrcState: 'none' | 'loading' | 'ready' | 'fail' = 'none';
  private cars: Car[] = [];
  // § A7 Weidetiere: wandern gemächlich im Weide-Radius ihres Bauernhofs;
  // reseeded nur, wenn sich die Farmen (Position/Stufe) ändern (animalKey).
  private animals: {
    mesh: Object3D;
    homeX: number;
    homeZ: number;
    radius: number;
    x: number;
    z: number;
    heading: number;
    speed: number;
    turnT: number;
    bob: number;
  }[] = [];
  private animalKey = '';
  private roadTiles: { x: number; y: number }[] = [];
  private roadSet = new Set<string>();
  // Active Stadtarbeit (§6): a delivery van routes along roads to the mission's
  // target houses; the camera focuses the first target when a mission starts.
  private missionKey = '';
  private missionVan:
    | {
        mesh: Object3D;
        path: { x: number; y: number }[];
        pathKey: string;
        idx: number;
        t: number;
        speed: number;
      }
    | undefined;
  private missionFollow = false;

  // § A6 Fahrmodus: der Spieler steuert bei einer Fahr-Aktivität selbst ein
  // Fahrzeug (WASD/Pfeile), die Kamera zieht als Verfolger hinterher, erreichte
  // Ziele schließen sich automatisch über progressActivity ab. Rein additive
  // Interaktionsschicht — die Simulation bleibt dieselbe Aktivitäts-Logik.
  private drive:
    | {
        mesh: Object3D;
        arrow: Object3D;
        x: number;
        z: number;
        heading: number;
        speed: number;
        held: Set<string>;
      }
    | undefined;
  private readonly driveKeyDown = (e: KeyboardEvent): void => this.driveKey(e, true);
  private readonly driveKeyUp = (e: KeyboardEvent): void => this.driveKey(e, false);

  private destroyed = false;

  constructor(
    private controller: GameController,
    private callbacks: RendererCallbacks,
  ) {}

  async init(host: HTMLElement): Promise<void> {
    this.host = host;
    const renderer = new WebGLRenderer({ antialias: true, alpha: false });
    // Der native PC-HUD wird bis 4K geprüft. Eine adaptive Obergrenze hält die
    // 3D-Welt dort scharf, ohne viermal so viele Fragmente wie bei Full-HD zu
    // rendern; UI/Text bleiben als DOM ohnehin in voller Geräteauflösung.
    const viewportPixels = window.innerWidth * window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, viewportPixels > 2_000_000 ? 1.25 : 1.5));
    renderer.setSize(host.clientWidth || 800, host.clientHeight || 600);
    renderer.shadowMap.enabled = true;
    // Premium look (§ MVP3 Phase 2 — Atmosphäre & Licht): filmic ACES tone mapping
    // rolls bright sky/sun highlights off softly instead of clipping to flat white,
    // giving the warm, high-quality feel of Manor Lords / Foundation instead of the
    // hard "test render" look. Soft (PCF) shadows drop the jagged shadow edges the
    // new terraced terrain would otherwise show. Exposure is tuned in tandem with
    // the day/night grade in environment.ts.
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer = renderer;
    if (this.destroyed) {
      renderer.dispose();
      return;
    }
    host.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';

    // Living atmosphere (v0.37): the sky dome, sun/moon, stars, the three scene
    // lights and the fog are all owned + animated by SkyEnvironment, driven by a
    // day/night clock. Replaces the old static sky/light block.
    this.env = new SkyEnvironment(this.scene, this.camera);

    // Invisible ground plane for cursor→tile picking and empty-space clicks.
    const groundMat = new MeshLambertMaterial({ visible: false });
    const ground = new Mesh(new PlaneGeometry(4000, 4000), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, 0);
    this.scene.add(ground);
    this.ground = ground;

    this.scene.add(
      this.oceanGroup,
      this.terrainGroup,
      this.vegetationGroup,
      this.buildingGroup,
      this.liveGroup,
      this.overlayGroup,
      this.markerGroup,
    );

    this.cam.snap();
    this.writeCamera();
    this.input = new CameraInputController(renderer.domElement, this.cam, this.inputHost());
    this.input.attach();
    this.observeResize();
    renderer.setAnimationLoop(() => this.frame());
  }

  destroy(): void {
    this.destroyed = true;
    if (this.drive) this.exitDrive();
    this.resizeObs?.disconnect();
    this.input?.detach();
    const r = this.renderer;
    if (r) {
      r.setAnimationLoop(null);
      r.domElement.remove();
      r.dispose();
    }
    this.env?.dispose();
    this.disposeGroup(this.buildingGroup);
    this.disposeGroup(this.terrainGroup);
    this.disposeGroup(this.groundChunkGroup);
    this.disposeGroup(this.oceanGroup);
    this.groundChunks.clear();
    this.disposeGroup(this.vegetationGroup);
    this.disposeGroup(this.liveGroup);
    this.disposeGroup(this.overlayGroup);
    for (const m of this.markers) this.disposeGroup(m.obj);
    for (const t of this.markerTex.values()) t.dispose();
  }

  setPlacing(defId: string | undefined): void {
    if (this.placingDefId === defId) return;
    this.placingDefId = defId;
    if (!defId) this.clearGhost();
  }

  /** Mirrors the UI store's placingRotation (§ Gebäude-Rotation) so the ghost's
   *  front-facing indicator and the eventual placed building match what the
   *  player chose. Forces the ghost to redraw even if the hovered tile is unchanged. */
  setPlacingRotation(rotation: 0 | 90 | 180 | 270): void {
    if (this.placingRotation === rotation) return;
    this.placingRotation = rotation;
    this.lastHoverKey = ''; // force updateGhostAt to rebuild on the next move
  }

  setMoving(): void {
    // Moving buildings is a 2D-mode interaction (drag/hold); in 3D the player
    // switches to 2D/iso to relocate. No-op here (documented, docs/3D_MODEL_MANIFEST.md).
  }

  setSelected(id: string | undefined): void {
    this.selectedId = id;
    if (id) this.focusBuilding(id);
    this.lastVersion = -1; // refresh selection ring
  }

  setInfoLayer(mode: InfoLayerMode): void {
    if (mode === this.infoLayerMode) return;
    this.infoLayerMode = mode;
    this.rebuildMarkers();
  }

  /** MapApi "Karte zentrieren" / Zentrum-preset. */
  centerOnCity(): void {
    this.cam.applyPreset('center');
  }

  /** Camera-preset from the view controls (§ Presets). */
  applyPreset(preset: CameraPreset): void {
    this.cam.applyPreset(preset);
  }

  /** Focus the currently selected building (F / focus button). */
  focusSelected(): void {
    if (this.selectedId) this.focusBuilding(this.selectedId);
    else this.cam.focusCity();
  }

  /** Reset the compass to the default viewing direction. */
  resetNorth(): void {
    this.cam.resetNorth();
  }

  /** Stepwise zoom for the +/- HUD buttons (dir > 0 = zoom in). */
  zoomStep(dir: number): void {
    this.cam.zoomBy(dir > 0 ? 0.8 : 1.25);
  }

  /** Current yaw in radians — the compass reads this each frame. */
  getYaw(): number {
    return this.cam.getYaw();
  }

  getCameraView() {
    const pose = this.cam.pose();
    return {
      targetX: pose.targetX,
      targetZ: pose.targetZ,
      dist: this.cam.getDist(),
      yaw: this.cam.getYaw(),
      pitch: this.cam.getPitch(),
    };
  }

  focusGround(x: number, z: number, dist?: number): void {
    this.cam.focusGround(x, z, dist);
  }

  // ---- § A6 Fahrmodus (Stadtarbeit selbst fahren) ---------------------------

  /** Läuft gerade eine Fahr-Aktivität, die man selbst fahren kann? (UI-Button). */
  canDrive(): boolean {
    if (this.drive) return false;
    return this.activeDriveDef() !== undefined && this.roadTiles.length > 1;
  }

  /** Ist der Fahrmodus gerade aktiv? */
  isDriving(): boolean {
    return this.drive !== undefined;
  }

  /** Die laufende Aktivität, falls sie eine Fahrmission ist (drive:true). */
  private activeDriveDef(): { id: string; vehicle?: string } | undefined {
    const active = this.controller.state.activities.active;
    if (!active || active.targets.length === 0) return undefined;
    const def = this.controller.config.activities.activities.find((a) => a.id === active.defId);
    if (!def?.drive) return undefined;
    const vehicle = active.vehicle ?? def.vehicle;
    return { id: def.id, ...(vehicle ? { vehicle } : {}) };
  }

  /**
   * Steigt in das gesteuerte Fahrzeug ein: Kamera-Input aus, Verfolgerkamera an,
   * Fahrzeug am naheliegendsten Straßenpunkt (Quelle/erstes Ziel) spawnen, eigene
   * WASD-Listener registrieren. Gibt false zurück, wenn keine Fahrmission läuft.
   */
  enterDrive(): boolean {
    const def = this.activeDriveDef();
    if (this.drive || !def || this.roadTiles.length < 2) return false;
    const active = this.controller.state.activities.active!;
    const firstTarget = active.targets.find((t) => !t.done) ?? active.targets[0]!;
    const tb = this.controller.state.buildings[firstTarget.buildingId];
    const tdef = tb && this.controller.config.buildings.get(tb.defId);
    const spawn =
      this.deliverySourceTile() ??
      (tb && tdef ? this.roadTileAdjacent(tb.x, tb.y, tdef.size.w, tdef.size.h) : undefined) ??
      this.roadTiles[0]!;
    const mesh = makeMissionVehicle(def.vehicle);
    this.liveGroup.add(mesh);
    // Drop-in-Fahrzeug je Typ (§ Fahrzeuge): eigenes GLB ersetzt das Prozedurale.
    const modelList = ACTIVITY_VEHICLE_MODELS[def.vehicle ?? 'van'] ?? VAN_MODELS;
    const url = firstModel(vehicleModel, modelList);
    if (url) void this.swapInModel(url, mesh, { targetHeight: 0.5 });
    const arrow = makeDriveArrow();
    this.liveGroup.add(arrow);
    // Anfangsrichtung: zu einem Straßen-Nachbarn zeigen, damit es sofort losgeht.
    const nb = this.roadNeighbors(spawn)[0];
    const heading = nb ? Math.atan2(nb.x - spawn.x, nb.y - spawn.y) : 0;
    this.drive = { mesh, arrow, x: spawn.x + 0.5, z: spawn.y + 0.5, heading, speed: 0, held: new Set() };
    this.input?.detach(); // Kamera-Steuerung ruht, solange gefahren wird
    window.addEventListener('keydown', this.driveKeyDown);
    window.addEventListener('keyup', this.driveKeyUp);
    this.cam.setChase(this.drive.x, this.drive.z, heading, DRIVE_CAM_DIST, DRIVE_CAM_PITCH, true);
    this.callbacks.onDriveChange?.(true);
    return true;
  }

  /** Steigt aus: Fahrzeug/Arrow entfernen, Listener lösen, Kamera-Input zurück. */
  exitDrive(): void {
    const d = this.drive;
    if (!d) return;
    window.removeEventListener('keydown', this.driveKeyDown);
    window.removeEventListener('keyup', this.driveKeyUp);
    this.liveGroup.remove(d.mesh);
    this.disposeGroup(d.mesh);
    this.liveGroup.remove(d.arrow);
    this.disposeGroup(d.arrow);
    this.drive = undefined;
    if (!this.destroyed) this.input?.attach();
    this.callbacks.onDriveChange?.(false);
    this.missionKey = ''; // erzwingt frisches updateMission (Kamera-Fokus)
  }

  setMissionFollow(active: boolean): void {
    this.missionFollow = active;
    const position = this.missionVan?.mesh.position;
    if (active && position) this.cam.focusGround(position.x, position.z, Math.min(this.cam.getDist(), 34));
  }

  isMissionFollowing(): boolean {
    return this.missionFollow;
  }

  private driveKey(e: KeyboardEvent, down: boolean): void {
    if (!this.drive) return;
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
    const k = e.key.toLowerCase();
    if (down && (k === 'escape' || k === 'q')) {
      this.exitDrive();
      return;
    }
    if (DRIVE_KEYS.has(k)) {
      if (down) this.drive.held.add(k);
      else this.drive.held.delete(k);
      e.preventDefault();
    }
  }

  /**
   * Ein Fahr-Schritt (§ A6): Arcade-Physik (Gas/Bremse/Lenken) mit sanfter
   * Führung auf die Fahrbahn — verlässt das Fahrzeug die Straße, wird es
   * abgebremst und zur Mitte der nächsten Straßenkachel gezogen. Erreichte Ziele
   * lösen `progressActivity` aus; ist die Mission vorbei, endet der Fahrmodus.
   */
  private updateDrive(dt: number): void {
    const d = this.drive;
    if (!d) return;
    const def = this.activeDriveDef();
    if (!def) {
      this.exitDrive();
      return;
    }
    const h = d.held;
    const fwd = (h.has('w') || h.has('arrowup') ? 1 : 0) - (h.has('s') || h.has('arrowdown') ? 1 : 0);
    const steer = (h.has('d') || h.has('arrowright') ? 1 : 0) - (h.has('a') || h.has('arrowleft') ? 1 : 0);
    // Längsdynamik: Gas beschleunigt, sonst rollt es aus; Rückwärts halb so schnell.
    if (fwd > 0) d.speed += DRIVE_ACCEL * dt;
    else if (fwd < 0) d.speed -= DRIVE_ACCEL * dt;
    else d.speed *= Math.exp(-dt * 2.4);
    d.speed = MathUtils.clamp(d.speed, -DRIVE_MAX_SPEED * 0.5, DRIVE_MAX_SPEED);
    if (Math.abs(d.speed) < 0.02) d.speed = 0;
    // Lenken nur bei Bewegung; Vorzeichen dreht sich beim Rückwärtsfahren.
    if (steer !== 0 && Math.abs(d.speed) > 0.05) {
      d.heading += steer * DRIVE_STEER * dt * Math.sign(d.speed) * Math.min(1, Math.abs(d.speed) / 1.5 + 0.35);
    }
    // Vorwärtsvektor (Konvention rotation.y = atan2(hx,hz)): (sin,cos).
    let nx = d.x + Math.sin(d.heading) * d.speed * dt;
    let nz = d.z + Math.cos(d.heading) * d.speed * dt;
    // Fahrbahn-Führung: liegt das Ziel-Tile nicht auf einer Straße, abbremsen und
    // zur nächstgelegenen Straßenkachel-Mitte ziehen (sanft „auf die Straße").
    if (!this.roadSet.has(`${Math.floor(nx)},${Math.floor(nz)}`)) {
      const near = this.nearestRoadTile(nx, nz);
      if (near) {
        const cx = near.x + 0.5;
        const cz = near.y + 0.5;
        nx += (cx - nx) * Math.min(1, dt * 6);
        nz += (cz - nz) * Math.min(1, dt * 6);
      }
      d.speed *= 0.86; // Reibung abseits der Fahrbahn
    } else {
      // Auf der Straße: leicht zur Kachelmitte-Querachse ziehen (sauberes Fahren).
      const cx = Math.floor(nx) + 0.5;
      const cz = Math.floor(nz) + 0.5;
      const perpX = Math.cos(d.heading); // quer zur Fahrtrichtung
      const perpZ = -Math.sin(d.heading);
      const off = (nx - cx) * perpX + (nz - cz) * perpZ;
      nx -= perpX * off * Math.min(1, dt * 3);
      nz -= perpZ * off * Math.min(1, dt * 3);
    }
    d.x = nx;
    d.z = nz;
    const y = terrainHeightAt(d.x, d.z) + 0.32;
    d.mesh.position.set(d.x, y, d.z);
    d.mesh.rotation.y = d.heading;

    // Ziel erreicht? Nächstes offenes Ziel abschließen, wenn nah genug.
    const active = this.controller.state.activities.active;
    let nearestTarget: { cx: number; cz: number } | undefined;
    const nextStop = active?.targets.find((target) => !target.done);
    for (const t of nextStop ? [nextStop] : []) {
      const b = this.controller.state.buildings[t.buildingId];
      const bdef = b && this.controller.config.buildings.get(b.defId);
      if (!b || !bdef) continue;
      const cx = b.x + bdef.size.w / 2;
      const cz = b.y + bdef.size.h / 2;
      const reach = Math.max(bdef.size.w, bdef.size.h) / 2 + 1.4;
      const dist = Math.hypot(cx - d.x, cz - d.z);
      if (dist < reach) {
        this.callbacks.onDriveProgress?.(t.buildingId);
        return; // Version-Bump führt zu erneutem updateMission/rebuild
      }
      nearestTarget = { cx, cz };
    }
    // Zielpfeil über dem Fahrzeug in Richtung des nächsten offenen Ziels drehen.
    d.arrow.position.set(d.x, y + 1.5, d.z);
    if (nearestTarget) {
      d.arrow.visible = true;
      d.arrow.rotation.y = Math.atan2(nearestTarget.cx - d.x, nearestTarget.cz - d.z);
    } else {
      d.arrow.visible = false;
    }
    // Verfolgerkamera nachführen.
    this.cam.setChase(d.x, d.z, d.heading, DRIVE_CAM_DIST, DRIVE_CAM_PITCH);
  }

  /** Nächstgelegene Straßenkachel zu einem Weltpunkt (kleiner Suchradius). */
  private nearestRoadTile(x: number, z: number): { x: number; y: number } | undefined {
    const bx = Math.floor(x);
    const bz = Math.floor(z);
    let best: { x: number; y: number } | undefined;
    let bestD = Infinity;
    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -2; dx <= 2; dx++) {
        const tx = bx + dx;
        const tz = bz + dz;
        if (!this.roadSet.has(`${tx},${tz}`)) continue;
        const dd = Math.hypot(tx + 0.5 - x, tz + 0.5 - z);
        if (dd < bestD) {
          bestD = dd;
          best = { x: tx, y: tz };
        }
      }
    }
    return best;
  }

  private focusBuilding(id: string): void {
    const b = this.controller.state.buildings[id];
    const def = b && this.controller.config.buildings.get(b.defId);
    if (!b || !def) return;
    const dist = Math.min(this.cam.getDist(), 70);
    this.cam.focusGround(b.x + def.size.w / 2, b.y + def.size.h / 2, dist);
  }

  // ---- camera write-out -----------------------------------------------------

  /** Push the controller's pose into the three.js camera (called each frame). */
  private writeCamera(): void {
    const p = this.cam.pose();
    this.camera.position.set(p.posX, p.posY, p.posZ);
    this.camera.lookAt(p.targetX, p.targetY, p.targetZ);
  }

  /** The input controller talks to the renderer through this small surface. */
  private inputHost(): CameraInputHost {
    return {
      isPlacing: () => this.placingDefId !== undefined,
      placingPaints: () => {
        const def = this.placingDefId ? this.controller.config.buildings.get(this.placingDefId) : undefined;
        return def?.category === 'roads' || def?.category === 'decoration';
      },
      place: (cx, cy) => {
        const t = this.pickTileAt(cx, cy);
        if (t && this.placingDefId) this.callbacks.onPlace(this.placingDefId, t.x, t.y, this.placingRotation);
      },
      paint: (cx, cy) => {
        const t = this.pickTileAt(cx, cy);
        if (t && this.placingDefId) this.callbacks.onDragPlace(this.placingDefId, t.x, t.y);
      },
      selectAt: (cx, cy) => this.selectAt(cx, cy),
      ghostMove: (cx, cy) => this.updateGhostAt(cx, cy),
      cancel: () => this.callbacks.onCancelPlacement(),
      focusCity: () => this.cam.focusCity(),
      focusSelected: () => this.focusSelected(),
      groundAt: (cx, cy) => this.groundPointAt(cx, cy),
    };
  }

  private ndc(clientX: number, clientY: number): Vector2 | undefined {
    const el = this.renderer?.domElement;
    if (!el) return undefined;
    const rect = el.getBoundingClientRect();
    return new Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
  }

  /** Screen point → world ground point (x,z) via the invisible pick plane. */
  private groundPointAt(clientX: number, clientY: number): { x: number; z: number } | undefined {
    const ndc = this.ndc(clientX, clientY);
    if (!ndc || !this.ground) return undefined;
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = this.raycaster.intersectObject(this.ground, false)[0];
    return hit ? { x: hit.point.x, z: hit.point.z } : undefined;
  }

  /** Screen point → integer tile. */
  private pickTileAt(clientX: number, clientY: number): { x: number; y: number } | undefined {
    const g = this.groundPointAt(clientX, clientY);
    return g ? { x: Math.floor(g.x), y: Math.floor(g.z) } : undefined;
  }

  /** Screen point → building id via a raycast against the building meshes. */
  private pickBuildingAt(clientX: number, clientY: number): string | undefined {
    const ndc = this.ndc(clientX, clientY);
    if (!ndc) return undefined;
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(
      [...this.markerGroup.children, ...this.buildingGroup.children],
      true,
    );
    for (const h of hits) {
      let o: TObject3D | null = h.object;
      while (o) {
        const id = o.userData['buildingId'] as string | undefined;
        if (id) return id;
        o = o.parent;
      }
    }
    return undefined;
  }

  private selectAt(clientX: number, clientY: number): void {
    const id = this.pickBuildingAt(clientX, clientY);
    if (id) {
      this.callbacks.onSelectBuilding(id);
      return;
    }
    const t = this.pickTileAt(clientX, clientY);
    if (t) {
      const region = regionOfTile(this.controller.state, t.x, t.y);
      if (region && region.status === 'locked') {
        this.callbacks.onClickLockedRegion(region.id);
        return;
      }
    }
    this.callbacks.onSelectBuilding(undefined);
  }

  // ---- placement ghost ------------------------------------------------------

  private updateGhostAt(clientX: number, clientY: number): void {
    const defId = this.placingDefId;
    const def = defId ? this.controller.config.buildings.get(defId) : undefined;
    const t = this.pickTileAt(clientX, clientY);
    if (!def || !t) {
      this.clearGhost();
      return;
    }
    const { x, y } = t;
    const key = `${defId}|${x}|${y}`;
    if (key === this.lastHoverKey) return;
    this.lastHoverKey = key;

    const error = validatePlacement(
      this.controller.state,
      this.controller.config,
      this.controller.derived,
      def,
      x,
      y,
      {},
    );
    const bonusPct = error ? 0 : locationBonusPct(this.controller.state, def, x, y);
    this.callbacks.onHoverInfo({ defId: def.id, error, bonusPct });

    if (this.ghost) {
      this.overlayGroup.remove(this.ghost);
      this.disposeGroup(this.ghost);
    }
    const w = def.size.w;
    const h = def.size.h;
    const col = error ? 0xe5533b : bonusPct > 0 ? 0x58c470 : 0x49b7ff;
    const grp = new Group();
    grp.position.set(x + w / 2, terrainHeightAt(x + w / 2, y + h / 2), y + h / 2);
    // Footprint pad (clear green/red validity) sitting just above the ground.
    const pad = new Mesh(
      new BoxGeometry(w, 0.04, h),
      new MeshStandardMaterial({ color: col, transparent: true, opacity: 0.35, emissive: col, emissiveIntensity: 0.4 }),
    );
    pad.position.y = 0.27;
    grp.add(pad);
    // Bright footprint outline so the exact tiles are unmistakable.
    const outline = new LineSegments(
      new EdgesGeometry(new BoxGeometry(w, 0.5, h)),
      new LineBasicMaterial({ color: col }),
    );
    outline.position.y = 0.5;
    grp.add(outline);
    // A translucent massing box hinting at the building volume.
    const box = new Mesh(
      new BoxGeometry(w * 0.86, 0.9, h * 0.86),
      new MeshStandardMaterial({ color: col, transparent: true, opacity: 0.22 }),
    );
    box.position.y = 0.7;
    grp.add(box);
    // Front-facing indicator (§ Gebäude-Rotation): a small arrow at the edge the
    // player chose as the front, so the rotation choice is visible before
    // committing — roads auto-orient from their neighbour mask, so skip it there.
    if (def.category !== 'roads') {
      const rad = (this.placingRotation * Math.PI) / 180;
      const offset = h / 2 + 0.35;
      const arrowGeo = new ConeGeometry(0.22, 0.5, 3);
      arrowGeo.rotateX(Math.PI / 2); // tip points along local +Z at rotation 0
      const arrow = new Mesh(arrowGeo, new MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.5 }));
      arrow.position.set(Math.sin(rad) * offset, 0.5, Math.cos(rad) * offset);
      arrow.rotation.y = rad;
      grp.add(arrow);
    }
    this.overlayGroup.add(grp);
    this.ghost = grp;
  }

  private clearGhost(): void {
    if (this.ghost) {
      this.overlayGroup.remove(this.ghost);
      this.disposeGroup(this.ghost);
      this.ghost = undefined;
    }
    if (this.lastHoverKey !== '') {
      this.lastHoverKey = '';
      this.callbacks.onHoverInfo(undefined);
    }
  }

  // ---- terrain --------------------------------------------------------------

  private rebuildTerrainIfNeeded(): void {
    const regions = Object.values(this.controller.state.world.regions);
    const key = regions.map((r) => `${r.id}:${r.status}`).join(',');
    if (key === this.terrainKey) return;
    // Fire the "new area" popup for regions that just unlocked.
    for (const r of regions) {
      const prev = this.regionStatus.get(r.id);
      if (prev === 'locked' && r.status === 'unlocked') this.callbacks.onRegionUnlocked(r.id);
      this.regionStatus.set(r.id, r.status);
    }
    this.terrainKey = key;

    this.disposeGroup(this.terrainGroup);
    this.terrainGroup.clear();

    // Chunk-Boden (§ MVP4 P3): das 384²-Inselmesh ist in 8×8 Chunks à 48 Kacheln
    // zerlegt — nur Chunks, deren Sperr-Signatur sich geändert hat, werden neu
    // gebaut (Region-Unlock berührt wenige Chunks statt 600k Vertices). Gesperrte
    // Regionen werden PRO KACHEL gedimmt — die Grenze ist damit organisch
    // (§ Welt 2.0: keine Rechtecke); der hochwertige Nebel folgt in Phase A3.
    this.buildGroundChunks(regions);

    // Ein Ozean statt Kachelwasser (§ MVP4 P3): eine große Wellen-Ebene auf
    // WATER_LEVEL — Seen/Flüsse liegen im gebackenen Höhenfeld unter der
    // Wasserlinie und teilen dieselbe Fläche. Einmalig gebaut, bleibt stehen.
    this.buildOcean();

    // Organischer Nebel über gesperrten Landschaften (§ Welt 2.0 / A3).
    this.buildRegionFog(regions);

    // Drop-in terrain models (§ Gebirge/Map): nur für FREIGESCHALTETE Regionen
    // eingesammelt (147k-Kachel-Scans über die ganze Insel wären Verschwendung).
    const tiles: { x: number; y: number; terrain: TerrainType; locked: boolean }[] = [];
    for (const r of regions) {
      if (r.status !== 'unlocked') continue;
      const b = regionBounds(r.id);
      if (!b) continue;
      for (let y = b.minY; y <= b.maxY; y++) {
        for (let x = b.minX; x <= b.maxX; x++) {
          if (regionIdAt(x, y) !== r.id) continue;
          tiles.push({ x, y, terrain: worldTerrainAt(this.controller.state, x, y), locked: false });
        }
      }
    }
    void this.decorateTerrain(key, tiles);
    this.buildScenicLandmarks();
  }

  /**
   * Chunk-Boden der Insel (§ MVP4 P3): das 384²-Höhenfeld ist in
   * `GROUND_CHUNK`-Kachel-Chunks zerlegt (8×8 = 64 Meshes à ~9,4k Vertices bei
   * `GROUND_SUBDIV` 2). Vertex-Höhen kommen aus `terrainHeightAt` (gebackenes
   * Grid), Vertex-Farben aus den Terrain-Typen (gesperrte Sektoren gedimmt).
   * Frustum-Culling pro Chunk ist gratis (eigene Bounding-Sphären); bei einem
   * Sektor-Unlock werden nur Chunks mit geänderter Sperr-Signatur neu gebaut.
   */
  private buildGroundChunks(regions: { id: number; status: string }[]): void {
    if (!this.groundChunkGroup.parent) this.scene.add(this.groundChunkGroup);
    const status = new Map<number, string>();
    for (const r of regions) status.set(r.id, r.status);
    // Ozean (Region 0) gilt als "frei" — offenes Meer wird nie gedimmt.
    const lockedAt = (tx: number, ty: number): boolean => {
      const id = regionIdAt(tx, ty);
      return id !== 0 && status.get(id) !== 'unlocked';
    };

    const chunksPerAxis = Math.ceil(WORLD_TILES / GROUND_CHUNK);
    for (let cy = 0; cy < chunksPerAxis; cy++) {
      for (let cx = 0; cx < chunksPerAxis; cx++) {
        const key = `${cx},${cy}`;
        // Sperr-Signatur: Status aller Regionen, die diesen Chunk berühren
        // (organische Grenzen → per Kachel-Scan eingesammelt, ~2,3k Reads).
        const touching = new Set<number>();
        const x1 = Math.min(WORLD_TILES, cx * GROUND_CHUNK + GROUND_CHUNK);
        const y1 = Math.min(WORLD_TILES, cy * GROUND_CHUNK + GROUND_CHUNK);
        for (let ty = cy * GROUND_CHUNK; ty < y1; ty++) {
          for (let tx = cx * GROUND_CHUNK; tx < x1; tx++) touching.add(regionIdAt(tx, ty));
        }
        const sig = [...touching]
          .sort((a, b) => a - b)
          .map((id) => `${id}:${id === 0 ? 'u' : status.get(id) ?? '?'}`)
          .join(',');
        const cached = this.groundChunks.get(key);
        if (cached && cached.sig === sig) continue;
        if (cached) {
          this.groundChunkGroup.remove(cached.mesh);
          cached.mesh.geometry.dispose();
          (cached.mesh.material as Material).dispose();
        }
        const mesh = this.buildGroundChunk(cx * GROUND_CHUNK, cy * GROUND_CHUNK, lockedAt);
        this.groundChunkGroup.add(mesh);
        this.groundChunks.set(key, { mesh, sig });
      }
    }
  }

  /** Baut EIN Boden-Chunk-Mesh (`GROUND_CHUNK`² Kacheln ab (minX,minY)). */
  private buildGroundChunk(minX: number, minY: number, lockedAt: (tx: number, ty: number) => boolean): Mesh {
    const W = Math.min(GROUND_CHUNK, WORLD_TILES - minX);
    const H = Math.min(GROUND_CHUNK, WORLD_TILES - minY);
    const nx0 = W + 1;
    const ny0 = H + 1;
    const cornerColors = new Float32Array(nx0 * ny0 * 3);
    // Biom-Anteile je Eckpunkt (r=forest, g=fertile, b=sand) — das Splat-Shader
    // liest sie als Vertex-Attribut, damit Waldboden/Ackerland/Küstensand
    // genau dort erscheinen, wo das gebackene Grid sie hat (nicht nur höhenweise).
    const cornerBiome = new Float32Array(nx0 * ny0 * 3);
    // Rein visuelle Regionsprofile: r=Wüste, g=Sumpf, b=trockene Ebene,
    // a=Küste; alpine Gewichtung liegt separat. Mehrere Nachbarsamples machen
    // den Übergang organisch, ohne die technische Regionsgrenze zu verändern.
    const cornerVisual = new Float32Array(nx0 * ny0 * 4);
    const cornerAlpine = new Float32Array(nx0 * ny0);
    const tmp = new Color();
    const out = new Color();
    const mountainMoss = new Color(0x536b4f);
    const warmRock = new Color(0x8a887d);
    const sunlitRock = new Color(0xb1aaa0);
    const summitSnow = new Color(0xe7edf0);
    const desertTint = new Color(0xc96632);
    const swampTint = new Color(0x526140);
    const dryTint = new Color(0xbca363);
    const coastTint = new Color(0xaeb9aa);
    const alpineTint = new Color(0xc8cec9);
    const state = this.controller.state;

    for (let iy = 0; iy < ny0; iy++) {
      for (let ix = 0; ix < nx0; ix++) {
        const vx = minX + ix;
        const vy = minY + iy;
        const o = (iy * nx0 + ix) * 3;
        // Colour = mean of the 4 tiles meeting at this corner (Nachbar-Chunks
        // eingeschlossen — worldTerrainAt ist total); dimmed when mostly locked.
        let r = 0;
        let g = 0;
        let b = 0;
        let cnt = 0;
        let lock = 0;
        let forest = 0;
        let fertile = 0;
        let sand = 0;
        for (const [tx, ty] of [
          [vx - 1, vy - 1],
          [vx, vy - 1],
          [vx - 1, vy],
          [vx, vy],
        ] as const) {
          if (tx < 0 || ty < 0 || tx >= WORLD_TILES || ty >= WORLD_TILES) continue;
          const terrain = worldTerrainAt(state, tx, ty);
          tmp.set(TERRAIN_COLORS[terrain]);
          r += tmp.r;
          g += tmp.g;
          b += tmp.b;
          cnt++;
          if (terrain === 'forest') forest++;
          else if (terrain === 'fertile') fertile++;
          else if (terrain === 'sand') sand++;
          if (lockedAt(tx, ty)) lock++;
        }
        if (cnt === 0) {
          tmp.set(TERRAIN_COLORS.water);
          r = tmp.r;
          g = tmp.g;
          b = tmp.b;
          cnt = 1;
        }
        out.setRGB(r / cnt, g / cnt, b / cnt);
        const height = terrainHeightAt(vx, vy);
        const slope = Math.max(
          Math.abs(terrainHeightAt(vx + 0.7, vy) - terrainHeightAt(vx - 0.7, vy)),
          Math.abs(terrainHeightAt(vx, vy + 0.7) - terrainHeightAt(vx, vy - 0.7)),
        );
        // Helle alpine Staffelung statt einer dunklen, einfarbigen Bergmasse:
        // Moos an den Hängen, warmer Fels auf steilen Flächen und Schnee nur
        // an hohen Gipfeln. Rein visuell; das gebackene Höhenfeld bleibt Quelle.
        if (height > 3.5 || slope > 1.7) {
          out.lerp(mountainMoss, MathUtils.clamp((height - 3.5) / 5.5, 0, 0.32));
          out.lerp(warmRock, MathUtils.clamp((height - 4.5 + slope * 0.45) / 6.5, 0, 0.82));
          out.lerp(sunlitRock, MathUtils.clamp((height - 8.5) / 5.5, 0, 0.42));
          out.lerp(summitSnow, MathUtils.clamp((height - 12.5) / 4.2, 0, 0.9));
        }
        // A faint per-corner lightness jitter so large fields aren't a flat sheet.
        out.offsetHSL(0, 0, (hash01(`${vx},${vy}`) - 0.5) * 0.03);
        // Locked regions remain geographically readable in the island view.
        // The cloud layer communicates the lock state; crushing the terrain to
        // near-black made the overview look unfinished and hid future goals.
        if (lock / cnt > 0.5) out.multiplyScalar(0.64);
        cornerColors[o] = out.r;
        cornerColors[o + 1] = out.g;
        cornerColors[o + 2] = out.b;
        cornerBiome[o] = forest / cnt;
        cornerBiome[o + 1] = fertile / cnt;
        cornerBiome[o + 2] = sand / cnt;

        const sampleRegionIds = [
          regionIdAt(Math.round(vx), Math.round(vy)),
          regionIdAt(Math.round(vx - 2.5), Math.round(vy)),
          regionIdAt(Math.round(vx + 2.5), Math.round(vy)),
          regionIdAt(Math.round(vx), Math.round(vy - 2.5)),
          regionIdAt(Math.round(vx), Math.round(vy + 2.5)),
          regionIdAt(Math.round(vx - 1.75), Math.round(vy - 1.75)),
          regionIdAt(Math.round(vx + 1.75), Math.round(vy + 1.75)),
        ];
        const visual = blendedVisualSplat(sampleRegionIds);
        const vo = (iy * nx0 + ix) * 4;
        cornerVisual[vo] = visual.desert;
        cornerVisual[vo + 1] = visual.swamp;
        cornerVisual[vo + 2] = visual.dry;
        cornerVisual[vo + 3] = visual.coast;
        cornerAlpine[iy * nx0 + ix] = visual.alpine;

        // Die Vertexfarbe bleibt der robuste Fallback, falls einzelne Texturen
        // fehlen. Die gleichen weichen Profile geben auch dann Wüste, Moor,
        // Küste und Hochland eine klar erkennbare Makropalette.
        out.setRGB(cornerColors[o]!, cornerColors[o + 1]!, cornerColors[o + 2]!);
        out.lerp(desertTint, visual.desert * 0.48);
        out.lerp(swampTint, visual.swamp * 0.38);
        out.lerp(dryTint, visual.dry * 0.24);
        out.lerp(coastTint, visual.coast * 0.1);
        out.lerp(alpineTint, visual.alpine * MathUtils.clamp((height - 3.5) / 13, 0, 0.22));
        cornerColors[o] = out.r;
        cornerColors[o + 1] = out.g;
        cornerColors[o + 2] = out.b;
      }
    }

    const S = GROUND_SUBDIV;
    const nx = W * S + 1;
    const ny = H * S + 1;
    const positions = new Float32Array(nx * ny * 3);
    const colors = new Float32Array(nx * ny * 3);
    const biome = new Float32Array(nx * ny * 3);
    const visual = new Float32Array(nx * ny * 4);
    const alpine = new Float32Array(nx * ny);

    for (let iy = 0; iy < ny; iy++) {
      const cy0 = Math.min(Math.floor(iy / S), H - 1);
      const fy = iy / S - cy0;
      for (let ix = 0; ix < nx; ix++) {
        const cx0 = Math.min(Math.floor(ix / S), W - 1);
        const fx = ix / S - cx0;
        const vx = minX + ix / S;
        const vy = minY + iy / S;
        const o = (iy * nx + ix) * 3;
        positions[o] = vx;
        positions[o + 1] = terrainHeightAt(vx, vy);
        positions[o + 2] = vy;

        // Bilinear blend of the 4 surrounding tile-corner colours + biome mix.
        const c00 = (cy0 * nx0 + cx0) * 3;
        const c10 = (cy0 * nx0 + cx0 + 1) * 3;
        const c01 = ((cy0 + 1) * nx0 + cx0) * 3;
        const c11 = ((cy0 + 1) * nx0 + cx0 + 1) * 3;
        for (let ch = 0; ch < 3; ch++) {
          const top = cornerColors[c00 + ch]! + (cornerColors[c10 + ch]! - cornerColors[c00 + ch]!) * fx;
          const bot = cornerColors[c01 + ch]! + (cornerColors[c11 + ch]! - cornerColors[c01 + ch]!) * fx;
          colors[o + ch] = top + (bot - top) * fy;
          const btop = cornerBiome[c00 + ch]! + (cornerBiome[c10 + ch]! - cornerBiome[c00 + ch]!) * fx;
          const bbot = cornerBiome[c01 + ch]! + (cornerBiome[c11 + ch]! - cornerBiome[c01 + ch]!) * fx;
          biome[o + ch] = btop + (bbot - btop) * fy;
        }
        const vo = (iy * nx + ix) * 4;
        const v00 = (cy0 * nx0 + cx0) * 4;
        const v10 = (cy0 * nx0 + cx0 + 1) * 4;
        const v01 = ((cy0 + 1) * nx0 + cx0) * 4;
        const v11 = ((cy0 + 1) * nx0 + cx0 + 1) * 4;
        for (let ch = 0; ch < 4; ch++) {
          const top = cornerVisual[v00 + ch]! + (cornerVisual[v10 + ch]! - cornerVisual[v00 + ch]!) * fx;
          const bot = cornerVisual[v01 + ch]! + (cornerVisual[v11 + ch]! - cornerVisual[v01 + ch]!) * fx;
          visual[vo + ch] = top + (bot - top) * fy;
        }
        const a00 = cornerAlpine[cy0 * nx0 + cx0]!;
        const a10 = cornerAlpine[cy0 * nx0 + cx0 + 1]!;
        const a01 = cornerAlpine[(cy0 + 1) * nx0 + cx0]!;
        const a11 = cornerAlpine[(cy0 + 1) * nx0 + cx0 + 1]!;
        const atop = a00 + (a10 - a00) * fx;
        const abot = a01 + (a11 - a01) * fx;
        alpine[iy * nx + ix] = atop + (abot - atop) * fy;
      }
    }

    const indices: number[] = [];
    for (let iy = 0; iy < ny - 1; iy++) {
      for (let ix = 0; ix < nx - 1; ix++) {
        const a = iy * nx + ix;
        const b = a + 1;
        const c = a + nx;
        const d = c + 1;
        indices.push(a, c, b, b, c, d); // two up-facing triangles per cell
      }
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geo.setAttribute('aBiome', new Float32BufferAttribute(biome, 3));
    geo.setAttribute('aVisual', new Float32BufferAttribute(visual, 4));
    geo.setAttribute('aAlpine', new Float32BufferAttribute(alpine, 1));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mat = new MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
    const mesh = new Mesh(geo, mat);
    mesh.receiveShadow = true;
    void this.applyGroundSplat(mat, this.terrainKey);
    return mesh;
  }

  /**
   * Blends real drop-in ground textures (§ Terrain-Texturen, Terrain System V2)
   * on top of the vertex-coloured heightfield once they've loaded. Only the
   * categories the user has actually dropped a PNG for are sampled — with zero
   * textures present this is a no-op and the existing coloured look stands
   * exactly as before ("nie kaputt" per Drop-in-Assets rule). Height/slope pick
   * the blend weights per docs/TERRAIN_TEXTURES.md's Splatmap-Konzept; wherever
   * the dominant band's texture is still missing (e.g. only grass+earth exist so
   * far), coverage fades back toward the plain vertex colour instead of showing
   * a wrong material.
   */
  private async applyGroundSplat(mat: MeshStandardMaterial, key: string): Promise<void> {
    const resolved = await Promise.all(
      SPLAT_LAYERS.map(async (l) => {
        const p = loadSplatTexture(l.texture);
        if (!p) return undefined;
        try {
          return { key: l.key, tex: await p, triplanar: l.triplanar };
        } catch {
          return undefined;
        }
      }),
    );
    const active = resolved.filter(
      (x): x is { key: (typeof SPLAT_LAYERS)[number]['key']; tex: Texture; triplanar: boolean } => !!x,
    );
    // Stale (terrain rebuilt again meanwhile) or nothing dropped in yet.
    if (this.terrainKey !== key || active.length === 0 || this.destroyed) return;

    const cap = (s: string) => `w${s[0]!.toUpperCase()}${s.slice(1)}`;
    mat.customProgramCacheKey = () => `cmb-splat-${active.map((a) => a.key).sort().join('-')}`;
    mat.onBeforeCompile = (shader) => {
      for (const a of active) shader.uniforms[`uTex_${a.key}`] = { value: a.tex };
      shader.vertexShader =
        'attribute vec3 aBiome;\nattribute vec4 aVisual;\nattribute float aAlpine;\nvarying vec3 vBiome;\nvarying vec4 vVisual;\nvarying float vAlpine;\nvarying float vSplatH;\nvarying float vSplatSlope;\nvarying vec2 vSplatUv;\nvarying vec3 vSplatPos;\nvarying vec3 vSplatNormal;\n' +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           vBiome = aBiome;
           vVisual = aVisual;
           vAlpine = aAlpine;
           vSplatH = position.y;
           vSplatSlope = 1.0 - abs(normal.y);
           vSplatUv = position.xz * ${SPLAT_TILE_SCALE.toFixed(4)};
           vSplatPos = position.xyz * ${SPLAT_TILE_SCALE.toFixed(4)};
           vSplatNormal = normalize(normal);`,
        );

      const samplerDecls = active.map((a) => `uniform sampler2D uTex_${a.key};`).join('\n');
      const zeroInactive = SPLAT_LAYERS.filter((l) => !active.some((a) => a.key === l.key))
        .map((l) => `${cap(l.key)} = 0.0;`)
        .join('\n');
      const sumTerms = SPLAT_LAYERS.map((l) => cap(l.key)).join(' + ');
      // De-tiled sampling (§ MVP3 Phase 3 — "keine sichtbare Wiederholung"): each
      // material is read at two incommensurate scales and blended, so the texture
      // never repeats visibly across the board (the old single-scale repeat was
      // the tile grid the world showed at distance). See cmbDetile below.
      const sampleTerms = active
        .map((a) => `${a.triplanar ? 'cmbTriplanar' : 'cmbDetile'}(uTex_${a.key}, ${a.triplanar ? 'vSplatPos, vSplatNormal' : 'vSplatUv'}) * ${cap(a.key)}`)
        .join(' + ');
      // Value-noise + de-tile helpers, prepended at file scope (before main()).
      const helpers = `
        varying vec3 vBiome;
        varying vec4 vVisual;
        varying float vAlpine;
        varying float vSplatH;
        varying float vSplatSlope;
        varying vec2 vSplatUv;
        varying vec3 vSplatPos;
        varying vec3 vSplatNormal;
        ${samplerDecls}
        float cmbHash(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
        float cmbNoise(vec2 p){
          vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
          float a = cmbHash(i); float b = cmbHash(i + vec2(1.0, 0.0));
          float c = cmbHash(i + vec2(0.0, 1.0)); float d = cmbHash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }
        vec3 cmbDetile(sampler2D tex, vec2 uv){
          // Two reads at a non-harmonic ratio (1.0 : 0.37) break the periodicity.
          // The blend ratio itself is driven by a low-frequency noise so the two
          // repeat grids never line up into one consistent seam, and a macro
          // brightness noise dissolves what's left — result reads as one organic
          // field, no straight tile lines. Cheap: two samples + noise per layer.
          vec3 s1 = texture2D(tex, uv).rgb;
          vec3 s2 = texture2D(tex, uv * 0.37 + vec2(3.1, 1.7)).rgb;
          float blend = 0.3 + 0.4 * cmbNoise(uv * 0.5);
          float m = cmbNoise(uv * 0.13);
          return mix(s1, s2, blend) * (0.88 + 0.24 * m);
        }
        vec3 cmbTriplanar(sampler2D tex, vec3 p, vec3 n){
          // Weltkoordinaten statt Mesh-UVs verhindern gestreckte Felsbahnen an
          // steilen Flanken. Drei Achsen, scharf gewichtet; eine dezente
          // Makrovariation bricht Wiederholung ohne sechs weitere Samples.
          vec3 blend = pow(abs(n), vec3(4.0));
          blend /= max(blend.x + blend.y + blend.z, 0.0001);
          vec3 sx = texture2D(tex, p.zy + vec2(1.7, 3.1)).rgb;
          vec3 sy = texture2D(tex, p.xz).rgb;
          vec3 sz = texture2D(tex, p.xy + vec2(4.3, 0.9)).rgb;
          float macro = 0.9 + 0.2 * cmbNoise(p.xz * 0.13 + p.y * 0.07);
          return (sx * blend.x + sy * blend.y + sz * blend.z) * macro;
        }`;
      shader.fragmentShader =
        `${helpers}\n` +
        shader.fragmentShader.replace(
          '#include <map_fragment>',
          `#include <map_fragment>
           {
             // Höhen-/Hang-Bänder aus SPLAT_BANDS (terrainHeight.ts, § MVP4 P3):
             // ONE source, an die gebackenen Höhen kalibriert (Strand < ~0.9,
             // bebaubar ~0.05–3, Fels ab ~4.5, Gipfel bis 20). Biom-Anteile
             // (vBiome: r=Wald, g=fruchtbar, b=Sand) aus dem gebackenen Grid
             // wählen Waldboden/Ackerland/Küstensand ortsgenau (§ A3).
             float h = vSplatH;
             float slope = clamp(vSplatSlope, 0.0, 1.0);
             float wSlope = smoothstep(0.28, 0.55, slope);
             float bForest = clamp(vBiome.r, 0.0, 1.0);
             float bFertile = clamp(vBiome.g, 0.0, 1.0);
             float bSand = clamp(vBiome.b, 0.0, 1.0);
             float bDesert = clamp(vVisual.r, 0.0, 1.0);
             float bSwamp = clamp(vVisual.g, 0.0, 1.0);
             float bDry = clamp(vVisual.b, 0.0, 1.0);
             float bCoast = clamp(vVisual.a, 0.0, 1.0);
             float bAlpine = clamp(vAlpine, 0.0, 1.0);
             // Fels/Gipfel/Schnee rein höhenweise (Gebirge trägt kein Biom-Flag).
             float rock = smoothstep(${SPLAT_BANDS.stoneStart.toFixed(3)}, ${SPLAT_BANDS.stoneFull.toFixed(3)}, h);
             float wCliff = max(rock, wSlope);
             float wMountain = smoothstep(${SPLAT_BANDS.stoneFull.toFixed(3)}, ${(SPLAT_BANDS.stoneFull + 5).toFixed(3)}, h)
               * (0.76 + bAlpine * 0.34);
             float wSnow = smoothstep(12.8, 17.1, h) * (0.72 + bAlpine * 0.38);
             float wStone = wCliff * 0.5;
             // Auf bebaubarem Land (geringer Hang, unter der Felsgrenze) verteilen
             // sich die Biom-Layer; Gras füllt den Rest.
             float lowland = (1.0 - wCliff) * (1.0 - wSlope);
             float wSand = max(bSand + (1.0 - smoothstep(${SPLAT_BANDS.sandFadeStart.toFixed(3)}, ${SPLAT_BANDS.sandFadeEnd.toFixed(3)}, h)) * 0.5, 0.0) * lowland;
             float wForest = bForest * lowland * (1.0 - bDesert * 0.86);
             float wFarm = bFertile * lowland * (1.0 - max(bDesert, bSwamp) * 0.82);
             float wGrass = max(1.0 - bForest - bFertile - bSand, 0.0) * lowland
               * smoothstep(${SPLAT_BANDS.grassFadeStart.toFixed(3)}, ${SPLAT_BANDS.grassFadeEnd.toFixed(3)}, h);
             float wDesert = bDesert * lowland * (0.8 + 0.2 * cmbNoise(vSplatUv * 0.08));
             float wSwamp = bSwamp * lowland * (1.0 - smoothstep(1.8, 3.8, h));
             float wDry = bDry * lowland * (1.0 - bDesert * 0.55);
             float wCoast = bCoast * lowland
               * max(bSand, 1.0 - smoothstep(0.2, 1.45, h)) * 0.72;
             float regionalCover = clamp(wDesert + wSwamp + wDry * 0.7, 0.0, 0.95);
             wGrass *= 1.0 - regionalCover;
             wSand *= 1.0 - max(wDesert * 0.7, wCoast * 0.45);
             ${zeroInactive}
             float wTotal = ${sumTerms};
             if (wTotal > 0.0005) {
               vec3 splatColor = (${sampleTerms}) / wTotal;
               // Cap the blend: the clean, stylized vertex colour stays the base
               // (Tiny-Glade/Fabledom look) and the photo material is only a subtle
               // detail on top — never a full photographic replace.
               float coverage = clamp(wTotal, 0.0, 1.0) * 0.7;
               diffuseColor.rgb = mix(diffuseColor.rgb, splatColor, coverage);
             }
           }`,
        );
    };
    mat.needsUpdate = true;
  }

  /**
   * Animated water surface (v0.37): one InstancedMesh of subdivided planes over
   * every unlocked water/river tile, rippled in the vertex shader from the shared
   * `waterTime` uniform. It is a lit MeshStandardMaterial, so it naturally darkens
   * at night; the frame loop retints it to the current sky colour. Sits just above
   * the coloured lakebed tile. Rebuilt with the terrain (owns its own material).
   */
  /**
   * DER Ozean (§ MVP4 P3): eine große Wellen-Ebene auf `WATER_LEVEL`, die die
   * ganze Insel umgibt UND alle Seen/Flüsse füllt — deren Becken liegen im
   * gebackenen Höhenfeld unter der Wasserlinie, der farbige Grund unter der
   * halbtransparenten Fläche liefert die Tiefen-Tönung. Ersetzt das alte
   * Kachel-Instancing komplett; einmalig gebaut, vom Himmel pro Frame getönt.
   */
  private buildOcean(): void {
    if (this.oceanBuilt) return;
    this.oceanBuilt = true;

    const SIZE = 4096; // weit über die Weltränder hinaus — Meer bis zum Horizont
    const geo = new PlaneGeometry(SIZE, SIZE, 96, 96);
    geo.rotateX(-Math.PI / 2); // lay the plane flat (Y up)
    const mat = new MeshStandardMaterial({
      color: 0x247aa8,
      roughness: 0.24,
      metalness: 0.18,
      emissive: 0x06283d,
      emissiveIntensity: 0.32,
      fog: false,
      side: DoubleSide,
    });
    // A gentle two-wave ripple injected into the standard vertex shader; the
    // phase varies with the vertex' world position so the whole sea rolls.
    mat.customProgramCacheKey = () => 'cmb-ocean';
    mat.onBeforeCompile = (shader) => {
      shader.uniforms['uTime'] = this.waterTime;
      shader.vertexShader =
        'uniform float uTime;\nvarying vec2 vWaterPos;\n' +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           vWaterPos = position.xz;
           float ph = position.x * 0.35 + position.z * 0.27;
           float crossWave = position.x * -0.18 + position.z * 0.31;
           transformed.y += sin(uTime * 1.3 + ph) * 0.045
             + cos(uTime * 0.85 + position.x * 0.21) * 0.03
             + sin(uTime * 0.58 + crossWave) * 0.018;`,
        );
      shader.fragmentShader =
        'uniform float uTime;\nvarying vec2 vWaterPos;\n' +
        shader.fragmentShader.replace(
          '#include <color_fragment>',
          `#include <color_fragment>
           float broad = 0.5 + 0.5 * sin(vWaterPos.x * 0.035 + vWaterPos.y * 0.027 + uTime * 0.42);
           float cross = 0.5 + 0.5 * sin(vWaterPos.x * -0.071 + vWaterPos.y * 0.043 - uTime * 0.61);
           diffuseColor.rgb *= 0.9 + broad * 0.08 + cross * 0.04;`,
        );
    };

    const sea = new Mesh(geo, mat);
    sea.position.set(WORLD_TILES / 2, WATER_LEVEL, WORLD_TILES / 2);
    sea.receiveShadow = true;
    sea.frustumCulled = false;
    // Opaque water also hides the finite heightfield below it. With a
    // translucent surface, the 384×384 lakebed appeared as a hard square in
    // the far overview even though the ocean plane itself is much larger.
    sea.renderOrder = -1;
    this.oceanGroup.add(sea);
    this.waterMat = mat;

    this.buildCoastFoam();
    this.buildRiverFlowOverlay();
    this.buildDistantIslands();
  }

  /**
   * Ein gebatchtes, animiertes Stroemungsband fuer alle gebackenen Flusskacheln.
   * Die Nachbarschaft bestimmt die lokale Hauptachse; dadurch liest sich der
   * Fluss als verbindender Lauf statt als stehende blaue Flaeche. Ein Mesh, ein
   * Material, keine Simulation und keine per-Tile-Updates.
   */
  private buildRiverFlowOverlay(): void {
    const positions: number[] = [];
    const flowUv: number[] = [];
    const isRiver = (x: number, y: number): boolean => worldTerrainAt(this.controller.state, x, y) === 'river';
    const pushVertex = (x: number, z: number, u: number, v: number): void => {
      positions.push(x, WATER_LEVEL + 0.075, z);
      flowUv.push(u, v);
    };
    for (let y = 1; y < WORLD_TILES - 1; y++) {
      for (let x = 1; x < WORLD_TILES - 1; x++) {
        if (!isRiver(x, y)) continue;
        const eastWest = Number(isRiver(x - 1, y)) + Number(isRiver(x + 1, y));
        const northSouth = Number(isRiver(x, y - 1)) + Number(isRiver(x, y + 1));
        const vertical = northSouth >= eastWest;
        const x0 = x + (vertical ? 0.16 : 0.02);
        const x1 = x + (vertical ? 0.84 : 0.98);
        const z0 = y + (vertical ? 0.02 : 0.16);
        const z1 = y + (vertical ? 0.98 : 0.84);
        if (vertical) {
          pushVertex(x0, z0, 0, 0); pushVertex(x0, z1, 0, 1); pushVertex(x1, z0, 1, 0);
          pushVertex(x1, z0, 1, 0); pushVertex(x0, z1, 0, 1); pushVertex(x1, z1, 1, 1);
        } else {
          pushVertex(x0, z0, 0, 0); pushVertex(x0, z1, 1, 0); pushVertex(x1, z0, 0, 1);
          pushVertex(x1, z0, 0, 1); pushVertex(x0, z1, 1, 0); pushVertex(x1, z1, 1, 1);
        }
      }
    }
    if (positions.length === 0) return;
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('aRiverUv', new Float32BufferAttribute(flowUv, 2));
    const mat = new MeshBasicMaterial({
      color: 0x8ee7e4,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      side: DoubleSide,
    });
    mat.customProgramCacheKey = () => 'cmb-river-flow-v1';
    mat.onBeforeCompile = (shader) => {
      shader.uniforms['uRiverTime'] = this.waterTime;
      shader.vertexShader =
        'attribute vec2 aRiverUv;\nvarying vec2 vRiverUv;\n' +
        shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvRiverUv = aRiverUv;');
      shader.fragmentShader =
        'uniform float uRiverTime;\nvarying vec2 vRiverUv;\n' +
        shader.fragmentShader.replace(
          '#include <color_fragment>',
          `#include <color_fragment>
           float flow = 0.5 + 0.5 * sin((vRiverUv.y * 7.0 - uRiverTime * 1.35) * 6.28318);
           float bank = smoothstep(0.0, 0.24, vRiverUv.x) * (1.0 - smoothstep(0.76, 1.0, vRiverUv.x));
           diffuseColor.a *= bank * (0.28 + flow * 0.72);`,
        );
    };
    const flow = new Mesh(geo, mat);
    flow.renderOrder = 2;
    this.oceanGroup.add(flow);
  }

  /**
   * One batched shoreline ribbon over every land↔water edge. This adds the
   * bright coastal read from the mockups without spawning per-tile meshes.
   */
  private buildCoastFoam(): void {
    const foamPositions: number[] = [];
    const shoalPositions: number[] = [];
    const water = (x: number, y: number): boolean => {
      const terrain = worldTerrainAt(this.controller.state, x, y);
      return terrain === 'water' || terrain === 'river';
    };
    const pushQuad = (
      target: number[],
      ax: number,
      az: number,
      bx: number,
      bz: number,
      ix: number,
      iz: number,
      width: number,
      height: number,
    ): void => {
      target.push(
        ax, height, az,
        bx, height, bz,
        bx + ix * width, height, bz + iz * width,
        ax, height, az,
        bx + ix * width, height, bz + iz * width,
        ax + ix * width, height, az + iz * width,
      );
    };
    const addQuad = (
      ax: number,
      az: number,
      bx: number,
      bz: number,
      ix: number,
      iz: number,
    ): void => {
      pushQuad(shoalPositions, ax, az, bx, bz, ix, iz, 1.05, WATER_LEVEL + 0.025);
      pushQuad(foamPositions, ax, az, bx, bz, ix, iz, 0.34, WATER_LEVEL + 0.06);
    };

    for (let y = 1; y < WORLD_TILES - 1; y++) {
      for (let x = 1; x < WORLD_TILES - 1; x++) {
        if (!water(x, y)) continue;
        if (!water(x, y - 1)) addQuad(x, y, x + 1, y, 0, 1);
        if (!water(x + 1, y)) addQuad(x + 1, y, x + 1, y + 1, -1, 0);
        if (!water(x, y + 1)) addQuad(x + 1, y + 1, x, y + 1, 0, -1);
        if (!water(x - 1, y)) addQuad(x, y + 1, x, y, 1, 0);
      }
    }
    if (foamPositions.length === 0) return;
    const shoalGeo = new BufferGeometry();
    shoalGeo.setAttribute('position', new Float32BufferAttribute(shoalPositions, 3));
    const shoalMat = new MeshBasicMaterial({
      color: 0x4fc1c3,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      side: DoubleSide,
    });
    const shoal = new Mesh(shoalGeo, shoalMat);
    shoal.renderOrder = 1;
    shoal.frustumCulled = false;

    const foamGeo = new BufferGeometry();
    foamGeo.setAttribute('position', new Float32BufferAttribute(foamPositions, 3));
    const foamMat = new MeshBasicMaterial({
      color: 0xdaf5f2,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
      side: DoubleSide,
    });
    const foam = new Mesh(foamGeo, foamMat);
    foam.renderOrder = 2;
    foam.frustumCulled = false;
    this.oceanGroup.add(shoal, foam);
  }

  /**
   * § A7 — ferne Platzhalter-Inseln am Horizont: ein Ring niedriger, bewaldeter
   * Silhouetten weit außerhalb der Weltränder, damit der Ozean nicht ins Leere
   * läuft. Einmalig gebaut (mit dem Meer), rein kosmetisch, deterministisch
   * platziert. Ersetzbar durch echte Modelle über den späteren Landmarken-Pfad.
   */
  private buildDistantIslands(): void {
    const cx = WORLD_TILES / 2;
    const cz = WORLD_TILES / 2;
    const landMat = new MeshStandardMaterial({ color: 0x3f6b46, roughness: 1 });
    const beachMat = new MeshStandardMaterial({ color: 0xbfb08a, roughness: 1 });
    const peakMat = new MeshStandardMaterial({ color: 0x6f7378, roughness: 1 });
    const group = new Group();
    const COUNT = 9;
    for (let i = 0; i < COUNT; i++) {
      const h = hash01(`island${i}`);
      const ang = (i / COUNT) * Math.PI * 2 + (h - 0.5) * 0.4;
      const dist = WORLD_TILES * (0.85 + h * 0.5);
      const ix = cx + Math.cos(ang) * dist;
      const iz = cz + Math.sin(ang) * dist;
      const scale = 20 + h * 40;
      const isle = new Group();
      const beach = new Mesh(new CylinderGeometry(scale, scale * 1.15, 1.5, 10), beachMat);
      beach.position.y = WATER_LEVEL + 0.4;
      const land = new Mesh(new CylinderGeometry(scale * 0.7, scale * 0.95, scale * 0.35, 9), landMat);
      land.position.y = WATER_LEVEL + scale * 0.18;
      isle.add(beach, land);
      // Größere Inseln bekommen einen grauen Gipfel als Silhouette.
      if (h > 0.5) {
        const peak = new Mesh(new ConeGeometry(scale * 0.5, scale * 0.7, 8), peakMat);
        peak.position.y = WATER_LEVEL + scale * 0.5;
        isle.add(peak);
      }
      isle.position.set(ix, 0, iz);
      isle.rotation.y = h * Math.PI;
      group.add(isle);
    }
    this.oceanGroup.add(group);
  }

  /**
   * Sparse scenic landmarks for the overview silhouette. Positions are selected
   * deterministically from the real biome/coast data; dropped GLBs replace small
   * procedural stand-ins in place.
   */
  private buildScenicLandmarks(): void {
    type Kind = keyof typeof SCENIC_PROP_MODELS;
    const isWater = (x: number, y: number): boolean => {
      const terrain = worldTerrainAt(this.controller.state, x, y);
      return terrain === 'water' || terrain === 'river';
    };
    const nearWater = (x: number, y: number): boolean =>
      isWater(x + 1, y) || isWater(x - 1, y) || isWater(x, y + 1) || isWater(x, y - 1);
    const nearLand = (x: number, y: number): boolean =>
      !isWater(x + 1, y) || !isWater(x - 1, y) || !isWater(x, y + 1) || !isWater(x, y - 1);

    const pick = (
      kind: Kind,
      count: number,
      predicate: (x: number, y: number, terrain: TerrainType) => boolean,
      minSpacing: number,
    ): { x: number; y: number }[] => {
      const candidates: { x: number; y: number; score: number }[] = [];
      for (let y = 3; y < WORLD_TILES - 3; y += 2) {
        for (let x = 3; x < WORLD_TILES - 3; x += 2) {
          const terrain = worldTerrainAt(this.controller.state, x, y);
          if (!predicate(x, y, terrain)) continue;
          candidates.push({ x, y, score: hash01(`${kind}:${x},${y}`) });
        }
      }
      candidates.sort((a, b) => b.score - a.score);
      const result: { x: number; y: number }[] = [];
      for (const candidate of candidates) {
        if (result.every((other) => Math.hypot(other.x - candidate.x, other.y - candidate.y) >= minSpacing)) {
          result.push(candidate);
          if (result.length >= count) break;
        }
      }
      return result;
    };

    const placements: {
      kind: Kind;
      tile: { x: number; y: number };
      targetHeight?: number;
      footprint?: number;
      water?: boolean;
    }[] = [
      ...pick('boat', 5, (x, y, terrain) => terrain === 'water' && nearLand(x, y), 34).map((tile) => ({
        kind: 'boat' as const,
        tile,
        footprint: 2.2,
        water: true,
      })),
      ...pick('windmill', 3, (_x, _y, terrain) => terrain === 'fertile', 52).map((tile) => ({
        kind: 'windmill' as const,
        tile,
        targetHeight: 3.2,
      })),
      ...pick(
        'lighthouse',
        2,
        (x, y, terrain) => (terrain === 'sand' || terrain === 'grass') && nearWater(x, y),
        88,
      ).map((tile) => ({ kind: 'lighthouse' as const, tile, targetHeight: 6.4 })),
      ...pick(
        'waterfall',
        4,
        (x, y, terrain) => terrain === 'mountain' && nearWater(x, y),
        54,
      ).map((tile) => ({ kind: 'waterfall' as const, tile, targetHeight: 5.4 })),
      ...pick(
        'desertSpire',
        2,
        (x, y, terrain) =>
          regionVisualProfile(regionIdAt(x, y))?.biome === 'wueste' &&
          (terrain === 'mountain' || terrain === 'sand' || terrain === 'grass'),
        34,
      ).map((tile) => ({ kind: 'desertSpire' as const, tile, targetHeight: 6.2 })),
      ...pick(
        'swampTree',
        2,
        (x, y, terrain) =>
          regionVisualProfile(regionIdAt(x, y))?.biome === 'sumpf' &&
          (terrain === 'forest' || terrain === 'grass' || terrain === 'fertile'),
        28,
      ).map((tile) => ({ kind: 'swampTree' as const, tile, targetHeight: 4.8 })),
      ...pick(
        'rockArch',
        2,
        (x, y, terrain) =>
          (regionVisualProfile(regionIdAt(x, y))?.biome === 'kueste' ||
            regionVisualProfile(regionIdAt(x, y))?.biome === 'gebirge') &&
          (terrain === 'mountain' || terrain === 'sand'),
        92,
      ).map((tile) => ({ kind: 'rockArch' as const, tile, targetHeight: 5.2 })),
      ...pick(
        'oldTree',
        2,
        (x, y, terrain) =>
          (regionVisualProfile(regionIdAt(x, y))?.biome === 'grasland' ||
            regionVisualProfile(regionIdAt(x, y))?.biome === 'wald') &&
          (terrain === 'grass' || terrain === 'forest'),
        84,
      ).map((tile) => ({ kind: 'oldTree' as const, tile, targetHeight: 4.6 })),
      ...pick(
        'ruin',
        2,
        (_x, _y, terrain) => terrain === 'grass' || terrain === 'fertile',
        105,
      ).map((tile) => ({ kind: 'ruin' as const, tile, footprint: 3.2 })),
      ...pick(
        'lakeIslet',
        2,
        (x, y, terrain) =>
          terrain === 'water' && regionVisualProfile(regionIdAt(x, y))?.biome === 'seenland',
        42,
      ).map((tile) => ({ kind: 'lakeIslet' as const, tile, footprint: 3.4, water: true })),
    ];

    for (const placement of placements) {
      const holder = makeScenicFallback(placement.kind);
      const { x, y } = placement.tile;
      holder.position.set(
        x + 0.5,
        placement.water ? WATER_LEVEL + 0.06 : terrainHeightAt(x + 0.5, y + 0.5),
        y + 0.5,
      );
      holder.rotation.y = hash01(`rot:${placement.kind}:${x},${y}`) * Math.PI * 2;
      this.terrainGroup.add(holder);
      const url = firstModel(propModel, SCENIC_PROP_MODELS[placement.kind]);
      if (url) {
        void this.swapInModel(url, holder, {
          ...(placement.footprint !== undefined ? { footprint: placement.footprint } : {}),
          ...(placement.targetHeight !== undefined ? { targetHeight: placement.targetHeight } : {}),
          castShadow: true,
        });
      }
    }
  }

  // ---- Organischer Regions-Nebel (§ Welt 2.0 / A3) ---------------------------
  // Jede gesperrte Landschaft trägt ein Nebel-Volumen entlang ihrer ECHTEN
  // organischen Grenze: die Randkontur wird aus dem Region-Grid extrahiert
  // (gerichtete Randkanten → Loop-Verkettung, entspricht Marching Squares auf
  // Binärmasken), zweifach Chaikin-geglättet und zu einem halbtransparenten
  // Volumen extrudiert. Silhouetten des dominanten Bioms (Gipfel, Baumwipfel,
  // Hügel) ragen als Teaser aus dem Dunst (§6 Auftrag B: man ahnt, was dort
  // wartet). Ein Unlock startet die weiche Aufdeck-Animation (aufsteigender,
  // ausdünnender Nebel), danach wird das Volumen entsorgt.

  /** Größte geschlossene Randkontur einer Region (Kachel-Ecken, Uhrzeigersinn). */
  private regionContour(id: number): { x: number; y: number }[] | undefined {
    const b = regionBounds(id);
    if (!b) return undefined;
    // Gerichtete Randkanten mit Regions-Innenseite links einsammeln.
    const edges = new Map<string, { x: number; y: number }[]>();
    const pk = (x: number, y: number): string => `${x},${y}`;
    const addEdge = (x1: number, y1: number, x2: number, y2: number): void => {
      const list = edges.get(pk(x1, y1));
      if (list) list.push({ x: x2, y: y2 });
      else edges.set(pk(x1, y1), [{ x: x2, y: y2 }]);
    };
    for (let y = b.minY; y <= b.maxY; y++) {
      for (let x = b.minX; x <= b.maxX; x++) {
        if (regionIdAt(x, y) !== id) continue;
        if (regionIdAt(x, y - 1) !== id) addEdge(x, y, x + 1, y);
        if (regionIdAt(x + 1, y) !== id) addEdge(x + 1, y, x + 1, y + 1);
        if (regionIdAt(x, y + 1) !== id) addEdge(x + 1, y + 1, x, y + 1);
        if (regionIdAt(x - 1, y) !== id) addEdge(x, y + 1, x, y);
      }
    }
    // Kanten zu geschlossenen Loops verketten; die flächengrößte ist der
    // Außenrand (innere Loops sind Löcher — Seen etc. — und bleiben vernebelt).
    let best: { x: number; y: number }[] | undefined;
    let bestArea = 0;
    while (edges.size > 0) {
      const [startKey, startList] = edges.entries().next().value as [string, { x: number; y: number }[]];
      const [sx, sy] = startKey.split(',').map(Number) as [number, number];
      const loop: { x: number; y: number }[] = [{ x: sx, y: sy }];
      let cur = startList.pop()!;
      if (startList.length === 0) edges.delete(startKey);
      let guard = 200_000;
      while ((cur.x !== sx || cur.y !== sy) && guard-- > 0) {
        loop.push(cur);
        const key = pk(cur.x, cur.y);
        const list = edges.get(key);
        if (!list || list.length === 0) break; // offene Kette (sollte nicht passieren)
        const next = list.pop()!;
        if (list.length === 0) edges.delete(key);
        cur = next;
      }
      // Shoelace-Fläche des Loops.
      let area = 0;
      for (let i = 0; i < loop.length; i++) {
        const a = loop[i]!;
        const c = loop[(i + 1) % loop.length]!;
        area += a.x * c.y - c.x * a.y;
      }
      area = Math.abs(area) / 2;
      if (area > bestArea) {
        bestArea = area;
        best = loop;
      }
    }
    return best && best.length >= 8 ? best : undefined;
  }

  /** Chaikin-Eckenschnitt (geschlossen) — macht die Kachel-Treppen organisch. */
  private static chaikin(pts: { x: number; y: number }[], iterations: number): { x: number; y: number }[] {
    let cur = pts;
    for (let it = 0; it < iterations; it++) {
      const next: { x: number; y: number }[] = [];
      for (let i = 0; i < cur.length; i++) {
        const a = cur[i]!;
        const c = cur[(i + 1) % cur.length]!;
        next.push(
          { x: a.x * 0.75 + c.x * 0.25, y: a.y * 0.75 + c.y * 0.25 },
          { x: a.x * 0.25 + c.x * 0.75, y: a.y * 0.25 + c.y * 0.75 },
        );
      }
      cur = next;
    }
    return cur;
  }

  /** Baut Nebel-Volumen für gesperrte Regionen; startet Aufdecken bei Unlock. */
  private buildRegionFog(regions: { id: number; status: string }[]): void {
    if (!this.fogGroup.parent) this.scene.add(this.fogGroup);
    const locked = new Set(regions.filter((r) => r.status !== 'unlocked').map((r) => r.id));
    for (const id of locked) {
      if (!this.fogVolumes.has(id)) {
        const vol = this.createFogVolume(id);
        if (vol) this.fogVolumes.set(id, vol);
      }
    }
    for (const [id, vol] of this.fogVolumes) {
      if (!locked.has(id) && vol.fading < 0) vol.fading = 0; // Aufdeck-Animation starten
    }
  }

  private createFogVolume(
    id: number,
  ): { group: Group; mats: { mat: MeshStandardMaterial; base: number }[]; fading: number } | undefined {
    const contour = this.regionContour(id);
    const bounds = regionBounds(id);
    const baked = BAKED_REGIONS[id - 1];
    if (!contour || !bounds || !baked) return undefined;

    // Höhenspanne der Region (grob abgetastet) → Volumen von Tal bis über die Gipfel.
    let minH = Infinity;
    let maxH = -Infinity;
    for (let y = bounds.minY; y <= bounds.maxY; y += 3) {
      for (let x = bounds.minX; x <= bounds.maxX; x += 3) {
        if (regionIdAt(x, y) !== id) continue;
        const h = terrainHeightAt(x + 0.5, y + 0.5);
        if (h < minH) minH = h;
        if (h > maxH) maxH = h;
      }
    }
    if (!Number.isFinite(minH)) return undefined;
    // Eine flache, geschichtete Wolkendecke statt einer extrudierten Glaswand:
    // Niederungen verschwinden, Gipfel und Landmarken bleiben als Teaser sichtbar.
    const fogY = Math.min(maxH - 0.25, Math.max(WATER_LEVEL + 1.05, minH + 1.45));

    const group = new Group();
    const mats: { mat: MeshStandardMaterial; base: number }[] = [];

    // Geglättete Kontur → horizontale Shape-Ebenen. Keine Seitenflächen bedeutet
    // auch aus der Stadtperspektive keine senkrechte Nebelwand mehr.
    const smooth = ThreeMapRenderer.chaikin(contour, 2);
    const shape = new Shape();
    shape.moveTo(smooth[0]!.x, -smooth[0]!.y);
    for (let i = 1; i < smooth.length; i++) shape.lineTo(smooth[i]!.x, -smooth[i]!.y);
    shape.closePath();
    const cloudTexture = loadEnvironmentTexture('cloud_bank');
    const layers = [
      { y: -0.14, opacity: 0.23, color: 0x8ea2b3 },
      { y: 0.12, opacity: 0.38, color: 0xc5d2dc },
      { y: 0.58, opacity: 0.24, color: 0xb7c7d4 },
      { y: 1.02, opacity: 0.14, color: 0xe2e8ed },
    ];
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i]!;
      const geo = new ShapeGeometry(shape, 6);
      geo.rotateX(-Math.PI / 2);
      const fogMat = new MeshStandardMaterial({
        color: layer.color,
        transparent: true,
        opacity: layer.opacity,
        roughness: 1,
        metalness: 0,
        depthWrite: false,
        side: DoubleSide,
      });
      const fog = new Mesh(geo, fogMat);
      fog.position.set((i - 1) * 0.65, fogY + layer.y, (1 - i) * 0.5);
      fog.userData['driftPhase'] = id * 0.73 + i * 1.61;
      fog.userData['driftOriginX'] = fog.position.x;
      fog.userData['driftOriginZ'] = fog.position.z;
      fog.renderOrder = 3 + i;
      group.add(fog);
      mats.push({ mat: fogMat, base: fogMat.opacity });
      if (cloudTexture) {
        void cloudTexture
          .then((texture) => {
            if (this.destroyed || !fog.parent) return;
            fogMat.alphaMap = texture;
            fogMat.needsUpdate = true;
          })
          .catch(() => undefined);
      }
    }

    // Silhouetten-Teaser des dominanten Bioms — dunkle Formen im Dunst.
    const silMat = new MeshStandardMaterial({
      color: 0x3a4557,
      transparent: true,
      opacity: 0.5,
      roughness: 1,
      metalness: 0,
      depthWrite: false,
    });
    mats.push({ mat: silMat, base: silMat.opacity });
    const spreadX = (bounds.maxX - bounds.minX) * 0.32;
    const spreadY = (bounds.maxY - bounds.minY) * 0.32;
    const silhouettes: { geo: BufferGeometry; count: number; hMin: number; hMax: number }[] =
      baked.dominant === 'mountain'
        ? [{ geo: new ConeGeometry(1, 1, 6), count: 4, hMin: 5, hMax: 9 }]
        : baked.dominant === 'forest'
          ? [{ geo: new ConeGeometry(1, 1, 7), count: 9, hMin: 2.2, hMax: 3.6 }]
          : [{ geo: new SphereGeometry(1, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2), count: 4, hMin: 1.4, hMax: 2.6 }];
    for (const sil of silhouettes) {
      for (let i = 0; i < sil.count; i++) {
        const px = baked.centroid.x + (hash01(`${id}sx${i}`) - 0.5) * 2 * spreadX;
        const pz = baked.centroid.y + (hash01(`${id}sz${i}`) - 0.5) * 2 * spreadY;
        if (regionIdAt(Math.round(px), Math.round(pz)) !== id) continue;
        const h = sil.hMin + hash01(`${id}sh${i}`) * (sil.hMax - sil.hMin);
        const m = new Mesh(sil.geo, silMat);
        const groundY = terrainHeightAt(px, pz);
        m.scale.set(h * (baked.dominant === 'mountain' ? 0.9 : 0.45), h, h * (baked.dominant === 'mountain' ? 0.9 : 0.45));
        // Kegel: Ursprung in der Mitte → um h/2 anheben; Halbkugel sitzt am Boden.
        m.position.set(px, groundY + (sil.geo instanceof ConeGeometry ? h / 2 : 0.1), pz);
        m.renderOrder = 2;
        group.add(m);
      }
    }

    this.fogGroup.add(group);
    return { group, mats, fading: -1 };
  }

  /** Aufdeck-Animation: Nebel steigt und dünnt aus, dann wird er entsorgt. */
  private animateFog(dt: number): void {
    if (this.fogVolumes.size === 0) return;
    const DURATION = 1.8;
    const now = performance.now() / 1000;
    for (const [id, vol] of this.fogVolumes) {
      if (vol.fading < 0) {
        for (const child of vol.group.children) {
          const phase = child.userData['driftPhase'] as number | undefined;
          if (phase === undefined) continue;
          const originX = child.userData['driftOriginX'] as number;
          const originZ = child.userData['driftOriginZ'] as number;
          child.position.x = originX + Math.sin(now * 0.09 + phase) * 0.85;
          child.position.z = originZ + Math.cos(now * 0.075 + phase) * 0.65;
        }
        continue;
      }
      vol.fading += dt;
      const k = Math.min(1, vol.fading / DURATION);
      vol.group.position.y = k * 6; // Nebel hebt ab …
      for (const { mat, base } of vol.mats) mat.opacity = base * (1 - k) * (1 - k); // … und löst sich auf
      if (k >= 1) {
        this.fogGroup.remove(vol.group);
        this.disposeGroup(vol.group);
        this.fogVolumes.delete(id);
      }
    }
  }

  /** Terrain type → candidate model names (first match wins). Lets you drop in a
   *  precise `grass_tile.glb` OR just `grass.glb`; mountains additionally get a
   *  raised peak feature. Keep in sync with docs/3D_MODEL_MANIFEST.md §2. */
  private async decorateTerrain(
    key: string,
    tiles: { x: number; y: number; terrain: TerrainType; locked: boolean }[],
  ): Promise<void> {
    const stale = () => this.terrainKey !== key;
    // Group unlocked tiles by terrain type (locked stays a dimmed flat tile).
    const byType = new Map<TerrainType, { x: number; y: number }[]>();
    for (const t of tiles) {
      if (t.locked) continue;
      (byType.get(t.terrain) ?? byType.set(t.terrain, []).get(t.terrain)!).push({ x: t.x, y: t.y });
    }
    for (const [type, list] of byType) {
      // yBase is now a small offset ABOVE the sampled ground (placeModelInstances
      // rides the heightfield), so tile/peak models follow the organic terrain.
      const tileUrl = firstModel(terrainModel, TERRAIN_TILE_MODELS[type]);
      if (tileUrl) {
        await this.placeModelInstances(
          tileUrl,
          this.terrainGroup,
          list,
          { footprint: 1, jitterRot: false, castShadow: false, yBase: 0 },
          stale,
        );
        if (stale()) return;
      }
      // Mountains: scatter a raised peak/rock feature on a subset of tiles.
      if (type === 'mountain') {
        const peakUrl = firstModel(terrainModel, MOUNTAIN_FEATURE_MODELS);
        if (peakUrl) {
          const peaks = list.filter((t) => (t.x * 7 + t.y * 3) % 3 === 0);
          await this.placeModelInstances(
            peakUrl,
            this.terrainGroup,
            peaks,
            { footprint: 1.6, jitterRot: true, jitterScale: 0.5, yBase: 0 },
            stale,
          );
          if (stale()) return;
        }
      }
    }
  }

  /** Vegetation is a separate, culled pass (§7): trees/bushes only on FREE tiles
   *  (never on a building or road footprint), rebuilt when the city changes. */
  private rebuildVegetation(): void {
    const regions = Object.values(this.controller.state.world.regions).filter((r) => r.status === 'unlocked');
    // Only rebuild when the occupancy or region set actually changed.
    const key = `${regions.map((r) => r.id).join(',')}|${this.occupied.size}|${[...this.occupied].join(',')}`;
    if (key === this.vegKey) return;
    this.vegKey = key;
    this.disposeGroup(this.vegetationGroup);
    this.vegetationGroup.clear();

    const dummy = new Object3D();
    const pineTrees: { x: number; y: number }[] = [];
    const broadleafTrees: { x: number; y: number }[] = [];
    const largePines: { x: number; y: number }[] = [];
    const bushes: { x: number; y: number }[] = [];
    // § A7 Biom-Deko: Findlinge im Gebirge, Schilf am Wasser.
    const rocks: { x: number; y: number }[] = [];
    const reeds: { x: number; y: number }[] = [];
    const flowers: { x: number; y: number }[] = [];
    const fieldRows: { x: number; y: number }[] = [];
    const deadwood: { x: number; y: number }[] = [];
    const dryShrubs: { x: number; y: number }[] = [];
    const isWater = (tx: number, ty: number): boolean => {
      const tt = worldTerrainAt(this.controller.state, tx, ty);
      return tt === 'water' || tt === 'river';
    };
    for (const r of regions) {
      const visualProfile = regionVisualProfile(r.id);
      const b = regionBounds(r.id);
      if (!b) continue;
      for (let y = b.minY; y <= b.maxY; y++) {
        for (let x = b.minX; x <= b.maxX; x++) {
          if (regionIdAt(x, y) !== r.id) continue;
          if (this.occupied.has(`${x},${y}`)) continue; // never on the city
          const terrain = worldTerrainAt(this.controller.state, x, y); // § v10: aus dem Insel-Grid
          const h = hash01(`${x},${y}`);
          const cluster = hash01(`cluster:${Math.floor(x / 5)},${Math.floor(y / 5)}`);
          const isDesert = visualProfile?.biome === 'wueste';
          const isSwamp = visualProfile?.biome === 'sumpf';
          const isDry = visualProfile?.biome === 'trockene_ebene';
          const isAlpine = visualProfile?.vegetation === 'alpin';
          const groundY = terrainHeightAt(x + 0.5, y + 0.5);
          if (!isDesert && !isSwamp && (terrain === 'grass' || terrain === 'fertile') && hash01(`fl${x},${y}`) > 0.91) {
            flowers.push({ x, y });
          }
          if (!isDesert && !isSwamp && terrain === 'fertile' && hash01(`row${x},${y}`) > 0.78) fieldRows.push({ x, y });
          if ((terrain === 'forest' || isSwamp) && hash01(`log${x},${y}`) > (isSwamp ? 0.91 : 0.965)) deadwood.push({ x, y });
          if (terrain === 'forest' && h > (isDesert ? 0.91 : 0.2) && cluster > 0.12) {
            if (isAlpine && hash01(`alpine${x},${y}`) > 0.58) largePines.push({ x, y });
            else if (isSwamp || hash01(`leaf${x},${y}`) > 0.62) broadleafTrees.push({ x, y });
            else pineTrees.push({ x, y });
          } else if (terrain === 'grass' && !isDesert && !isSwamp && h > 0.965) {
            // Vereinzelte Solitaerbäume und Baumgruppen brechen offene Wiesen,
            // ohne die bebaubaren Lichtungen zuzustellen.
            broadleafTrees.push({ x, y });
          } else if (terrain === 'grass' && !isDesert && h > (isDry ? 0.94 : 0.88)) bushes.push({ x, y });
          else if ((terrain === 'mountain' || isDesert) && h > (isDesert ? 0.48 : 0.62)) rocks.push({ x, y });
          if ((isDesert || isDry) && terrain !== 'water' && terrain !== 'river' && hash01(`dry${x},${y}`) > 0.88) {
            dryShrubs.push({ x, y });
          }
          else if (
            (terrain === 'grass' || terrain === 'sand' || terrain === 'fertile') &&
            h > (isSwamp ? 0.28 : 0.55) &&
            ((isWater(x + 1, y) || isWater(x - 1, y) || isWater(x, y + 1) || isWater(x, y - 1)) ||
              (isSwamp && groundY < 1.35))
          ) {
            reeds.push({ x, y });
          }
        }
      }
    }

    // Drop-in props (§ Props): a `pine_tree.glb` / `bush_small.glb` (etc.) in
    // models/props/nature/ replaces the procedural cones. Fire-and-forget so a
    // slow model never blocks a frame; the staleness guard drops it if the city
    // changed meanwhile. Falls back to the instanced procedural greenery below.
    const stale = () => this.vegKey !== key;
    const pineUrl = firstModel(propModel, PINE_TREE_MODELS);
    const broadleafUrl = firstModel(propModel, BROADLEAF_TREE_MODELS);
    const largePineUrl = firstModel(propModel, LARGE_PINE_TREE_MODELS);
    const bushUrl = firstModel(propModel, BUSH_MODELS);
    const rockUrl = firstModel(propModel, ROCK_CLUSTER_MODELS);
    const reedUrl = firstModel(propModel, REED_MODELS);
    const deadwoodUrl = firstModel(propModel, DEADWOOD_MODELS);
    if (pineUrl && pineTrees.length) {
      // yBase 0: the model's base sits on the sampled ground (placeModelInstances
      // rides the heightfield). footprint keeps the model's own tall aspect ratio.
      void this.placeModelInstances(
        pineUrl,
        this.vegetationGroup,
        pineTrees,
        { footprint: 1.15, jitterRot: true, jitterScale: 0.54, jitterPosition: 0.52, cap: 430, yBase: 0 },
        stale,
      );
    }
    if (broadleafUrl && broadleafTrees.length) {
      void this.placeModelInstances(
        broadleafUrl,
        this.vegetationGroup,
        broadleafTrees,
        { footprint: 1.18, jitterRot: true, jitterScale: 0.5, jitterPosition: 0.48, cap: 300, yBase: 0 },
        stale,
      );
    }
    if (largePineUrl && largePines.length) {
      void this.placeModelInstances(
        largePineUrl,
        this.vegetationGroup,
        largePines,
        { footprint: 1.38, jitterRot: true, jitterScale: 0.42, jitterPosition: 0.38, cap: 150, yBase: 0 },
        stale,
      );
    }
    if (bushUrl && bushes.length) {
      void this.placeModelInstances(
        bushUrl,
        this.vegetationGroup,
        bushes,
        { footprint: 0.62, jitterRot: true, jitterScale: 0.45, jitterPosition: 0.38, cap: 340, yBase: 0 },
        stale,
      );
    }

    const fallbackTrees = [
      ...(pineUrl ? [] : pineTrees),
      ...(broadleafUrl ? [] : broadleafTrees),
      ...(largePineUrl ? [] : largePines),
    ];
    const nT = Math.min(fallbackTrees.length, 600);
    if (nT > 0) {
      const trunkG = new CylinderGeometry(0.06, 0.09, 0.5, 5);
      const crownG = new ConeGeometry(0.36, 1.0, 6);
      const trunkM = new MeshLambertMaterial({ color: 0x7a5230 });
      const crownM = new MeshLambertMaterial({ color: 0x2f6b34 });
      const trunks = new InstancedMesh(trunkG, trunkM, nT);
      const crowns = new InstancedMesh(crownG, crownM, nT);
      crowns.castShadow = true;
      for (let i = 0; i < nT; i++) {
        const t = fallbackTrees[i]!;
        const gy = terrainHeightAt(t.x + 0.5, t.y + 0.5);
        const jt = hash01(`${t.x}.${t.y}`);
        const sc = 0.8 + jt * 0.5;
        dummy.rotation.set(0, jt * Math.PI * 2, 0);
        dummy.position.set(t.x + 0.5, gy + 0.25 * sc, t.y + 0.5);
        dummy.scale.set(sc, sc, sc);
        dummy.updateMatrix();
        trunks.setMatrixAt(i, dummy.matrix);
        dummy.position.set(t.x + 0.5, gy + 0.75 * sc, t.y + 0.5);
        dummy.updateMatrix();
        crowns.setMatrixAt(i, dummy.matrix);
      }
      trunks.instanceMatrix.needsUpdate = true;
      crowns.instanceMatrix.needsUpdate = true;
      this.vegetationGroup.add(trunks, crowns);
    }

    const nB = bushUrl ? 0 : Math.min(bushes.length, 300);
    if (nB > 0) {
      const bG = new ConeGeometry(0.28, 0.42, 6);
      const bM = new MeshLambertMaterial({ color: 0x4f8f45 });
      const bush = new InstancedMesh(bG, bM, nB);
      for (let i = 0; i < nB; i++) {
        const b = bushes[i]!;
        dummy.rotation.set(0, hash01(`b${b.x},${b.y}`) * Math.PI, 0);
        dummy.position.set(b.x + 0.5, terrainHeightAt(b.x + 0.5, b.y + 0.5) + 0.2, b.y + 0.5);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        bush.setMatrixAt(i, dummy.matrix);
      }
      bush.instanceMatrix.needsUpdate = true;
      this.vegetationGroup.add(bush);
    }

    // § A7 Findlinge (Gebirge): graue Blöcke in zwei Größen, instanziert.
    if (rockUrl && rocks.length) {
      void this.placeModelInstances(
        rockUrl,
        this.vegetationGroup,
        rocks,
        { footprint: 0.72, jitterRot: true, jitterScale: 0.72, jitterPosition: 0.34, cap: 400, yBase: 0 },
        stale,
      );
    }
    const nR = rockUrl ? 0 : Math.min(rocks.length, 400);
    if (nR > 0) {
      const rockG = new BoxGeometry(0.5, 0.4, 0.55);
      const rockM = new MeshStandardMaterial({ color: 0x8b8d90, roughness: 1 });
      const rock = new InstancedMesh(rockG, rockM, nR);
      rock.castShadow = true;
      rock.receiveShadow = true;
      for (let i = 0; i < nR; i++) {
        const t = rocks[i]!;
        const jt = hash01(`r${t.x},${t.y}`);
        const sc = 0.5 + jt * 1.1;
        dummy.rotation.set(jt * 0.4, jt * Math.PI * 2, jt * 0.3);
        dummy.position.set(t.x + 0.5, terrainHeightAt(t.x + 0.5, t.y + 0.5) + 0.15 * sc, t.y + 0.5);
        dummy.scale.set(sc, sc * (0.7 + jt * 0.5), sc);
        dummy.updateMatrix();
        rock.setMatrixAt(i, dummy.matrix);
      }
      rock.instanceMatrix.needsUpdate = true;
      this.vegetationGroup.add(rock);
    }

    // § A7 Schilf (Wasserkante): schmale grüne Halme, instanziert.
    if (reedUrl && reeds.length) {
      void this.placeModelInstances(
        reedUrl,
        this.vegetationGroup,
        reeds,
        { footprint: 0.42, jitterRot: true, jitterScale: 0.52, jitterPosition: 0.34, cap: 420, yBase: 0 },
        stale,
      );
    }
    const nRe = reedUrl ? 0 : Math.min(reeds.length, 420);
    if (nRe > 0) {
      const reedG = new ConeGeometry(0.06, 0.6, 4);
      const reedM = new MeshLambertMaterial({ color: 0x5f7a37 });
      const reed = new InstancedMesh(reedG, reedM, nRe);
      for (let i = 0; i < nRe; i++) {
        const t = reeds[i]!;
        const jt = hash01(`re${t.x},${t.y}`);
        const sc = 0.7 + jt * 0.7;
        dummy.rotation.set(0, jt * Math.PI * 2, (jt - 0.5) * 0.3);
        dummy.position.set(t.x + 0.5, terrainHeightAt(t.x + 0.5, t.y + 0.5) + 0.3 * sc, t.y + 0.5);
        dummy.scale.set(1, sc, 1);
        dummy.updateMatrix();
        reed.setMatrixAt(i, dummy.matrix);
      }
      reed.instanceMatrix.needsUpdate = true;
      this.vegetationGroup.add(reed);
    }

    // Farbakzente und Nutzspuren brechen große Grünflächen auf, bleiben durch
    // Instancing aber auf drei zusätzliche Draw-Calls begrenzt.
    const nFl = Math.min(flowers.length, 180);
    if (nFl > 0) {
      const flowerG = new SphereGeometry(0.055, 5, 4);
      const flowerM = new MeshLambertMaterial({ color: 0xf2c84b });
      const flower = new InstancedMesh(flowerG, flowerM, nFl);
      for (let i = 0; i < nFl; i++) {
        const t = flowers[i]!;
        const jt = hash01(`flower${t.x},${t.y}`);
        dummy.rotation.set(0, 0, 0);
        dummy.position.set(
          t.x + 0.22 + jt * 0.56,
          terrainHeightAt(t.x + 0.5, t.y + 0.5) + 0.075,
          t.y + 0.2 + hash01(`flowerz${t.x},${t.y}`) * 0.6,
        );
        dummy.scale.setScalar(0.75 + jt * 0.65);
        dummy.updateMatrix();
        flower.setMatrixAt(i, dummy.matrix);
      }
      flower.instanceMatrix.needsUpdate = true;
      this.vegetationGroup.add(flower);
    }

    const nRows = Math.min(fieldRows.length, 220);
    if (nRows > 0) {
      const rowG = new BoxGeometry(0.72, 0.035, 0.11);
      const rowM = new MeshLambertMaterial({ color: 0xb8a348 });
      const rows = new InstancedMesh(rowG, rowM, nRows);
      for (let i = 0; i < nRows; i++) {
        const t = fieldRows[i]!;
        const jt = hash01(`field${t.x},${t.y}`);
        dummy.rotation.set(0, jt > 0.5 ? Math.PI / 2 : 0, 0);
        dummy.position.set(t.x + 0.5, terrainHeightAt(t.x + 0.5, t.y + 0.5) + 0.025, t.y + 0.5);
        dummy.scale.set(0.82 + jt * 0.28, 1, 1);
        dummy.updateMatrix();
        rows.setMatrixAt(i, dummy.matrix);
      }
      rows.instanceMatrix.needsUpdate = true;
      this.vegetationGroup.add(rows);
    }

    // Trockene Zonen erhalten wenige, klar gruppierte Bueschel statt eines
    // gleichmaessigen Noise-Teppichs. Ein Draw-Call deckt Wüste und Steppe ab.
    const nDry = Math.min(dryShrubs.length, 150);
    if (nDry > 0) {
      const dryG = new ConeGeometry(0.2, 0.34, 5);
      const dryM = new MeshLambertMaterial({ color: 0x9a7b42 });
      const dry = new InstancedMesh(dryG, dryM, nDry);
      for (let i = 0; i < nDry; i++) {
        const t = dryShrubs[i]!;
        const jt = hash01(`dryshrub${t.x},${t.y}`);
        dummy.rotation.set((jt - 0.5) * 0.16, jt * Math.PI * 2, (jt - 0.5) * 0.28);
        dummy.position.set(t.x + 0.5, terrainHeightAt(t.x + 0.5, t.y + 0.5) + 0.15, t.y + 0.5);
        dummy.scale.set(0.62 + jt * 0.62, 0.7 + jt * 0.5, 0.62 + jt * 0.62);
        dummy.updateMatrix();
        dry.setMatrixAt(i, dummy.matrix);
      }
      dry.instanceMatrix.needsUpdate = true;
      this.vegetationGroup.add(dry);
    }

    if (deadwoodUrl && deadwood.length) {
      void this.placeModelInstances(
        deadwoodUrl,
        this.vegetationGroup,
        deadwood,
        { footprint: 0.82, jitterRot: true, jitterScale: 0.46, jitterPosition: 0.28, cap: 110, yBase: 0 },
        stale,
      );
    }
    const nLogs = deadwoodUrl ? 0 : Math.min(deadwood.length, 110);
    if (nLogs > 0) {
      const logG = new CylinderGeometry(0.07, 0.09, 0.75, 6);
      const logM = new MeshLambertMaterial({ color: 0x725139 });
      const logs = new InstancedMesh(logG, logM, nLogs);
      for (let i = 0; i < nLogs; i++) {
        const t = deadwood[i]!;
        const jt = hash01(`deadwood${t.x},${t.y}`);
        dummy.rotation.set(Math.PI / 2, jt * Math.PI, 0);
        dummy.position.set(t.x + 0.5, terrainHeightAt(t.x + 0.5, t.y + 0.5) + 0.09, t.y + 0.5);
        dummy.scale.setScalar(0.75 + jt * 0.55);
        dummy.updateMatrix();
        logs.setMatrixAt(i, dummy.matrix);
      }
      logs.instanceMatrix.needsUpdate = true;
      this.vegetationGroup.add(logs);
    }
  }

  // ---- buildings ------------------------------------------------------------

  private rebuildBuildings(): void {
    const state = this.controller.state;
    const seen = new Set<string>();
    this.roadTiles = [];
    this.roadSet = new Set<string>();
    this.occupied = new Set<string>();

    // Pass 1: occupancy + road set (needed for road auto-tiling, car pathing and
    // vegetation culling before any mesh is built).
    for (const b of Object.values(state.buildings)) {
      const def = this.controller.config.buildings.get(b.defId);
      if (!def) continue;
      for (let dx = 0; dx < def.size.w; dx++) {
        for (let dy = 0; dy < def.size.h; dy++) this.occupied.add(`${b.x + dx},${b.y + dy}`);
      }
      if (def.category === 'roads') {
        this.roadTiles.push({ x: b.x, y: b.y });
        this.roadSet.add(`${b.x},${b.y}`);
      }
    }

    // Pass 2: build/update meshes. Road sigs carry the neighbour mask so a road
    // re-renders when an adjacent road is added/removed (junction shape changes).
    for (const b of Object.values(state.buildings)) {
      const def = this.controller.config.buildings.get(b.defId);
      if (!def) continue;
      seen.add(b.id);
      const roadMask = def.category === 'roads' ? this.roadNeighborMask(b.x, b.y) : -1;
      const sig = `${b.defId}|${b.upgradeLevel}|${b.status}|${b.id === this.selectedId ? 'sel' : ''}|${roadMask}|${b.rotation ?? 0}`;
      const existing = this.nodes.get(b.id);
      if (existing && existing.sig === sig) continue;
      if (existing) {
        this.buildingGroup.remove(existing.group);
        this.disposeGroup(existing.group);
      }
      const node = this.buildNode(def, b, sig, roadMask);
      this.buildingGroup.add(node.group);
      this.nodes.set(b.id, node);
    }
    // Remove demolished buildings.
    for (const [id, node] of this.nodes) {
      if (seen.has(id)) continue;
      this.buildingGroup.remove(node.group);
      this.disposeGroup(node.group);
      this.nodes.delete(id);
    }
    this.rebuildVegetation();
    this.seedCars();
    this.seedAnimals();
  }

  /**
   * § A7 Weidetiere: pro aktivem Bauernhof ein paar Tiere (mehr je Stufe) auf
   * einer Weide-Ecke des Grundstücks. Nur neu setzen, wenn sich die Farmen
   * geändert haben (Position/Stufe) — sonst bleiben die Tiere ruhig stehen.
   */
  private seedAnimals(): void {
    const farms = Object.values(this.controller.state.buildings).filter((b) => b.status === 'active' && b.defId === 'farm');
    const key = farms.map((f) => `${f.id}:${f.x},${f.y}:${f.upgradeLevel}`).sort().join('|');
    if (key === this.animalKey) return;
    this.animalKey = key;
    for (const a of this.animals) {
      this.liveGroup.remove(a.mesh);
      this.disposeGroup(a.mesh);
    }
    this.animals = [];
    const kinds = ['cow', 'sheep', 'chicken'] as const;
    let total = 0;
    for (const f of farms) {
      const def = this.controller.config.buildings.get(f.defId);
      if (!def) continue;
      // Weide-Kacheln: freier Ring rund um das Grundstück (nicht auf der Farm
      // selbst — sonst verdeckt das Gebäudemodell die Tiere). Nur unbebaute,
      // nicht-Wasser-Kacheln zählen.
      const paddock: { x: number; y: number }[] = [];
      for (let dy = -1; dy <= def.size.h; dy++) {
        for (let dx = -1; dx <= def.size.w; dx++) {
          const inFoot = dx >= 0 && dx < def.size.w && dy >= 0 && dy < def.size.h;
          if (inFoot) continue;
          const tx = f.x + dx;
          const ty = f.y + dy;
          if (this.occupied.has(`${tx},${ty}`)) continue;
          const tt = worldTerrainAt(this.controller.state, tx, ty);
          if (tt === 'water' || tt === 'river') continue;
          paddock.push({ x: tx, y: ty });
        }
      }
      if (paddock.length === 0) continue; // kein Platz für eine Weide
      const count = 3 + f.upgradeLevel;
      for (let i = 0; i < count && total < ANIMAL_CAP; i++, total++) {
        const kind = kinds[(f.x + f.y + i) % kinds.length]!;
        const mesh = makeAnimalMesh(kind);
        const tile = paddock[Math.floor(hash01(`${f.id}tile${i}`) * paddock.length)]!;
        const homeX = tile.x + 0.5;
        const homeZ = tile.y + 0.5;
        const x = homeX + (hash01(`${f.id}px${i}`) - 0.5) * 0.6;
        const z = homeZ + (hash01(`${f.id}pz${i}`) - 0.5) * 0.6;
        mesh.position.set(x, terrainHeightAt(x, z) + 0.02, z);
        this.liveGroup.add(mesh);
        this.animals.push({
          mesh,
          homeX,
          homeZ,
          radius: 0.5,
          x,
          z,
          heading: hash01(`${f.id}h${i}`) * Math.PI * 2,
          speed: 0.14 + hash01(`${f.id}s${i}`) * 0.16,
          turnT: hash01(`${f.id}t${i}`) * 3,
          bob: hash01(`${f.id}b${i}`) * Math.PI * 2,
        });
      }
    }
  }

  private animateAnimals(dt: number): void {
    for (const a of this.animals) {
      a.turnT -= dt;
      if (a.turnT <= 0) {
        // Gelegentlich die Richtung leicht ändern (gemächliches Grasen).
        a.heading += (Math.random() - 0.5) * 1.4;
        a.turnT = 1.5 + Math.random() * 3;
      }
      // Über den Weiderand hinaus? Zurück zur Mitte steuern.
      const dx = a.homeX - a.x;
      const dz = a.homeZ - a.z;
      if (Math.hypot(dx, dz) > a.radius) a.heading = Math.atan2(dx, dz);
      a.x += Math.sin(a.heading) * a.speed * dt;
      a.z += Math.cos(a.heading) * a.speed * dt;
      a.bob += dt * 6;
      a.mesh.position.set(a.x, terrainHeightAt(a.x, a.z) + 0.02 + Math.abs(Math.sin(a.bob)) * 0.015, a.z);
      a.mesh.rotation.y = a.heading;
    }
  }

  /** 4-bit road-neighbour mask: 1=N(-y) 2=E(+x) 4=S(+y) 8=W(-x). */
  private roadNeighborMask(x: number, y: number): number {
    let m = 0;
    if (this.roadSet.has(`${x},${y - 1}`)) m |= 1;
    if (this.roadSet.has(`${x + 1},${y}`)) m |= 2;
    if (this.roadSet.has(`${x},${y + 1}`)) m |= 4;
    if (this.roadSet.has(`${x - 1},${y}`)) m |= 8;
    return m;
  }

  private buildNode(def: BuildingDef, b: BuildingInstance, sig: string, roadMask: number): BuildingNode {
    const group = new Group();
    group.userData['buildingId'] = b.id;
    const cx = b.x + def.size.w / 2;
    const cz = b.y + def.size.h / 2;
    // Sit the whole building (and its children: model, roads, construction site,
    // selection ring, floating UI) on the organic ground at its centre (v0.39).
    group.position.set(cx, terrainHeightAt(cx, cz), cz);

    const constructing = b.status === 'constructing' && b.targetUpgradeLevel === undefined;
    const node: BuildingNode = { group, sig };

    // Roads/bridges have their own drop-in path (segment model by neighbour mask,
    // bridge model over water), so they never touch the building-model resolution
    // or the cosmetic facing below (their orientation comes from the road mask).
    if (def.category === 'roads') {
      this.buildRoad(group, def, b, roadMask);
      return node;
    }

    // Cosmetic facing chosen at placement time (§ Gebäude-Rotation): rotates the
    // whole node — model, construction site, selection ring, floating UI — around
    // the footprint centre. Footprint/placement are unaffected (already resolved).
    if (b.rotation) group.rotation.y = (b.rotation * Math.PI) / 180;

    // Selection highlight + floating world-UI for the selected building (§ Welt-UI).
    if (b.id === this.selectedId) {
      group.add(this.selectionRing(def.size.w, def.size.h));
      this.addSelectionUi(group, def, b);
    }

    // Model resolution (v0.32): explicit visual.model3d → id/stage lookup →
    // visual.fallbackModel → procedural block. Stage models (`<id>_stage<N>.glb`)
    // are chosen automatically by upgradeLevel via buildingModel(id, level).
    const v = def.visual;
    const url =
      (v?.model3d ? buildingModel(v.model3d) : undefined) ??
      buildingModel(def.id, b.upgradeLevel) ??
      (v?.fallbackModel ? buildingModel(v.fallbackModel) : undefined);
    if (url) {
      // Placeholder block until the model streams in (keeps the scene stable).
      const ph = this.proceduralBuilding(def, b, constructing, roadMask);
      group.add(ph.group);
      if (ph.rotor) node.rotor = ph.rotor;
      if (ph.smoke) node.smoke = ph.smoke;
      void this.attachModel(url, def, group, ph.group, node, b.status === 'active');
    } else {
      const p = this.proceduralBuilding(def, b, constructing, roadMask);
      group.add(p.group);
      if (p.rotor) node.rotor = p.rotor;
      if (p.smoke) node.smoke = p.smoke;
    }

    // Construction site during BOTH new build and upgrade (§ Baustelle): a
    // per-building `<id>_construction.glb`, else a generic construction prop, else
    // a procedural scaffold. Upgrades keep showing the current stage underneath.
    if (b.status === 'constructing') this.addConstructionSite(group, def, b);
    return node;
  }

  /** A bright glowing ground ring under the selection, swappable for a
   *  `ui_selection_ring.glb` drop-in (§ Welt-UI). */
  private selectionRing(w: number, h: number): Group {
    const holder = new Group();
    const ring = new Mesh(
      new BoxGeometry(w + 0.5, 0.06, h + 0.5),
      new MeshStandardMaterial({ color: 0xffffff, emissive: 0x8ad0ff, emissiveIntensity: 0.9, transparent: true, opacity: 0.9 }),
    );
    ring.position.y = 0.33;
    holder.add(ring);
    const url = firstModel(uiModel, UI_SELECTION_RING_MODELS);
    if (url) void this.swapInModel(url, holder, { footprint: Math.max(w, h) + 0.5, castShadow: false });
    return holder;
  }

  /** Floating 3D action button above the selected building (§ Welt-UI): shows the
   *  upgrade button when an upgrade is ready, otherwise a generic action button.
   *  Only rendered when the matching `ui_*.glb` is supplied (no procedural clutter). */
  private addSelectionUi(group: Group, def: BuildingDef, b: BuildingInstance): void {
    if (b.status !== 'active') return;
    const upgradeReady = this.controller.getBuildingMarker(b.id) === 'upgrade';
    const url = firstModel(uiModel, upgradeReady ? UI_UPGRADE_BUTTON_MODELS : UI_BUILD_BUTTON_MODELS);
    if (!url) return;
    const holder = new Group();
    holder.position.set(0, this.approxHeight(def, b.upgradeLevel) + 1.9, 0);
    group.add(holder);
    void this.swapInModel(url, holder, { targetHeight: 0.9, castShadow: false });
  }

  /** Add the construction stand-in (model or procedural scaffold) over a footprint. */
  private addConstructionSite(group: Group, def: BuildingDef, b: BuildingInstance): void {
    const holder = new Group();
    group.add(holder);
    const url =
      buildingConstructionModel(def.id) ?? firstModel(propModel, CONSTRUCTION_MODELS);
    if (url) {
      void this.swapInModel(url, holder, { footprint: Math.max(def.size.w, def.size.h) * 0.9 });
      return;
    }
    // Procedural scaffold cage sized by footprint + approx height.
    const w = def.size.w * 0.86;
    const d = def.size.h * 0.86;
    const height = this.approxHeight(def, b.targetUpgradeLevel ?? b.upgradeLevel);
    const cage = new LineSegments(
      new EdgesGeometry(new BoxGeometry(w + 0.1, height + 0.2, d + 0.1)),
      new LineBasicMaterial({ color: 0xffd54f }),
    );
    cage.position.y = (height + 0.2) / 2;
    holder.add(cage);
  }

  private async attachModel(
    url: string,
    def: BuildingDef,
    group: Group,
    placeholder: Group,
    node: BuildingNode,
    active: boolean,
  ): Promise<void> {
    try {
      const src = await loadModel(url);
      if (this.destroyed || !group.parent) return;
      const model = src.clone(true);
      // Scale so the model's footprint fills the tile footprint, base at y=0.
      const box = new Box3().setFromObject(model);
      const size = new Vector3();
      box.getSize(size);
      const span = Math.max(size.x, size.z) || 1;
      // Buildings fill their tile footprint; small decoration props instead keep a
      // real-world target height so a bench isn't scaled up to tree size (v0.39).
      const decoH = DECO_TARGET_HEIGHT[def.id];
      const scale =
        def.category === 'decoration' && decoH
          ? (decoH / (size.y || 1)) * (def.visual?.scale ?? 1)
          : ((Math.max(def.size.w, def.size.h) * 0.92) / span) * (def.visual?.scale ?? 1);
      model.scale.setScalar(scale);
      const box2 = new Box3().setFromObject(model);
      const c = new Vector3();
      box2.getCenter(c);
      model.position.x -= c.x;
      model.position.z -= c.z;
      model.position.y -= box2.min.y;
      // Optional per-model fine-tuning (§ world-asset pipeline).
      if (def.visual?.rotationOffset) model.rotation.y += def.visual.rotationOffset;
      const off = def.visual?.footprintVisualOffset;
      if (off) model.position.set(model.position.x + off.x, model.position.y + off.y, model.position.z + off.z);
      model.traverse((o) => {
        if ((o as Mesh).isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      group.remove(placeholder);
      this.disposeGroup(placeholder);
      group.add(model);
      group.updateWorldMatrix(true, true);

      // Honour the named-node conventions (docs/3D_MODEL_MANIFEST.md): a node called
      // `rotor` spins (wind turbines), a node called `chimney` emits smoke while
      // the building is active. Fall back to whatever the placeholder set.
      const rotor = model.getObjectByName('rotor') ?? model.getObjectByName('Rotor');
      if (rotor) node.rotor = rotor;
      if (active && (def.category === 'production' || def.category === 'energy')) {
        const chim = model.getObjectByName('chimney') ?? model.getObjectByName('Chimney');
        if (chim) {
          const wp = new Vector3();
          chim.getWorldPosition(wp);
          node.smoke = wp;
        }
      }
    } catch {
      // Model failed to load — the procedural placeholder stays. Never crash.
    }
  }

  /**
   * Generic drop-in swap for the non-building categories (terrain single tiles,
   * roads, bridges, vehicles, markers, effects). `holder` starts life holding the
   * procedural stand-in; when the `.glb` finishes loading its children are
   * replaced by the fitted model. If loading fails the procedural version stays,
   * so a missing/broken model never breaks the scene. See docs/3D_WORLD_ASSETS.md.
   */
  private async swapInModel(url: string, holder: Group, opts: FitOpts): Promise<void> {
    try {
      const src = await loadModel(url);
      if (this.destroyed || !holder.parent) return;
      const model = src.clone(true);
      fitObject(model, opts);
      model.traverse((o) => {
        if ((o as Mesh).isMesh) {
          o.castShadow = opts.castShadow ?? true;
          o.receiveShadow = true;
        }
      });
      // Replace the procedural stand-in with the real model.
      for (let i = holder.children.length - 1; i >= 0; i--) {
        const c = holder.children[i]!;
        holder.remove(c);
        this.disposeGroup(c);
      }
      holder.add(model);
    } catch {
      // Keep the procedural stand-in.
    }
  }

  /**
   * Place ONE shared model across many tiles (terrain tiles, mountains, trees,
   * bushes). The model is fetched once and either turned into a single
   * InstancedMesh (when it is a lone mesh — cheapest) or cloned per tile. Runs as
   * a fire-and-forget pass after the procedural base; `stale()` aborts if the
   * world changed while the model was still loading, so nothing leaks. Capped so a
   * huge map can't spawn thousands of clones.
   */
  private async placeModelInstances(
    url: string,
    group: Group,
    tiles: { x: number; y: number }[],
    opts: FitOpts & { cap?: number; jitterScale?: number; jitterRot?: boolean; jitterPosition?: number; yBase?: number },
    stale: () => boolean,
  ): Promise<void> {
    if (tiles.length === 0) return;
    let src: TObject3D;
    try {
      src = await loadModel(url);
    } catch {
      return; // procedural base already drawn — just skip the model layer.
    }
    if (this.destroyed || stale()) return;
    const cap = opts.cap ?? 400;
    const list = tiles.length > cap ? tiles.filter((_, i) => i % Math.ceil(tiles.length / cap) === 0) : tiles;
    const yBase = opts.yBase ?? 0;

    // Fast path: a single-mesh model → one InstancedMesh (one draw call).
    const meshes: Mesh[] = [];
    src.traverse((o) => {
      if ((o as Mesh).isMesh) meshes.push(o as Mesh);
    });
    const probe = src.clone(true);
    fitObject(probe, opts);
    const dummy = new Object3D();
    if (meshes.length === 1) {
      // Derive geometry/material from the fitted single mesh → one InstancedMesh.
      let gm: Mesh | undefined;
      probe.traverse((o) => {
        if ((o as Mesh).isMesh) gm = o as Mesh;
      });
      if (!gm) return;
      gm.updateWorldMatrix(true, false);
      const geo = gm.geometry.clone();
      geo.applyMatrix4(gm.matrixWorld); // bake the fit transform into the geometry
      const mat = gm.material as Material;
      const inst = new InstancedMesh(geo, mat, list.length);
      inst.castShadow = opts.castShadow ?? true;
      inst.receiveShadow = true;
      for (let i = 0; i < list.length; i++) {
        const t = list[i]!;
        const j = hash01(`${t.x}.${t.y}`);
        const jx = (hash01(`jx:${t.x}.${t.y}`) - 0.5) * (opts.jitterPosition ?? 0);
        const jz = (hash01(`jz:${t.x}.${t.y}`) - 0.5) * (opts.jitterPosition ?? 0);
        const sc = opts.jitterScale ? 1 - opts.jitterScale / 2 + j * opts.jitterScale : 1;
        dummy.position.set(
          t.x + 0.5 + jx,
          terrainHeightAt(t.x + 0.5 + jx, t.y + 0.5 + jz) + yBase,
          t.y + 0.5 + jz,
        );
        dummy.rotation.set(0, opts.jitterRot ? j * Math.PI * 2 : (opts.rotationY ?? 0), 0);
        dummy.scale.setScalar(sc);
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
      }
      inst.instanceMatrix.needsUpdate = true;
      if (this.destroyed || stale()) {
        geo.dispose();
        return;
      }
      group.add(inst);
      return;
    }

    // General path: clone the fitted model per tile.
    for (let i = 0; i < list.length; i++) {
      const t = list[i]!;
      const j = hash01(`${t.x}.${t.y}`);
      const jx = (hash01(`jx:${t.x}.${t.y}`) - 0.5) * (opts.jitterPosition ?? 0);
      const jz = (hash01(`jz:${t.x}.${t.y}`) - 0.5) * (opts.jitterPosition ?? 0);
      const clone = probe.clone(true);
      const sc = opts.jitterScale ? 1 - opts.jitterScale / 2 + j * opts.jitterScale : 1;
      clone.position.set(
        t.x + 0.5 + jx,
        terrainHeightAt(t.x + 0.5 + jx, t.y + 0.5 + jz) + yBase,
        t.y + 0.5 + jz,
      );
      clone.rotation.y = opts.jitterRot ? j * Math.PI * 2 : (opts.rotationY ?? 0);
      clone.scale.multiplyScalar(sc);
      clone.traverse((o) => {
        if ((o as Mesh).isMesh) {
          o.castShadow = opts.castShadow ?? true;
          o.receiveShadow = true;
        }
      });
      group.add(clone);
    }
    if (this.destroyed || stale()) this.disposeGroup(group);
  }

  /**
   * A road/bridge tile (§ Straßen als Textur, v0.44): flat, texture-based
   * geometry, never a `.glb`. Over water/river it becomes a boardwalk (single-
   * tile hop) or bridge (wider crossing); otherwise the auto-tiled road skeleton,
   * tilted+skirted onto the local ground so it never floats.
   */
  private buildRoad(group: Group, def: BuildingDef, b: BuildingInstance, mask: number): void {
    const holder = new Group();
    group.add(holder);
    const cls = roadClassFor(def.id);
    const terrain = worldTerrainAt(this.controller.state, b.x, b.y);
    const overWater = terrain === 'water' || terrain === 'river';

    if (overWater) {
      const rot = mask & 2 || mask & 8 ? (mask & 1 || mask & 4 ? 0 : Math.PI / 2) : 0;
      this.buildBridgeDeck(holder, rot, this.waterSpanAt(b.x, b.y));
      return;
    }

    this.buildRoadTile(holder, mask, cls, terrain, b.x, b.y);
    // Straßen dürfen niemals schweben (§ Gelände-Anpassung): tilt the tile to the
    // local ground gradient and skirt its edges, so neighbouring segments on
    // sloped land (forest/grass) never show a floating gap or step.
    this.fitRoadToTerrain(holder, b.x + 0.5, b.y + 0.5);
  }

  /** Contiguous water/river run through (x,y), whichever axis is longer — sizes
   *  a crossing as a single-tile boardwalk ("Steg") vs. a wider bridge. */
  private waterSpanAt(x: number, y: number): number {
    const isWater = (tx: number, ty: number) => {
      const t = worldTerrainAt(this.controller.state, tx, ty);
      return t === 'water' || t === 'river';
    };
    let ew = 1;
    for (let d = 1; isWater(x + d, y); d++) ew++;
    for (let d = 1; isWater(x - d, y); d++) ew++;
    let ns = 1;
    for (let d = 1; isWater(x, y + d); d++) ns++;
    for (let d = 1; isWater(x, y - d); d++) ns++;
    return Math.max(ew, ns);
  }

  /**
   * Tilts a road holder to the terrain's local slope (finite-difference gradient
   * of `terrainHeightAt`, clamped to a believable ramp angle) and adds a short
   * skirt around the tile's perimeter that reaches below the lowest plausible
   * neighbour height. The group itself already sits at the tile-centre height
   * (buildNode); this only orients/aprons it so it reads as sitting IN the
   * ground rather than floating a flat plate above it. The road surface itself
   * now sits close to y=0 (see buildRoadTile), so the skirt only needs to hide a
   * small gap, not a full raised-plate step.
   */
  private fitRoadToTerrain(holder: Group, cx: number, cz: number): void {
    const MAX_TILT = 0.35; // ≈20°, keeps steep noise spikes from flipping the deck
    const dHdx = terrainHeightAt(cx + 0.5, cz) - terrainHeightAt(cx - 0.5, cz);
    const dHdz = terrainHeightAt(cx, cz + 0.5) - terrainHeightAt(cx, cz - 0.5);
    holder.rotation.z = MathUtils.clamp(Math.atan(dHdx), -MAX_TILT, MAX_TILT);
    holder.rotation.x = MathUtils.clamp(-Math.atan(dHdz), -MAX_TILT, MAX_TILT);

    const skirtMat = new MeshStandardMaterial({ color: 0x5b4a3a, roughness: 1 });
    const skirtDepth = 0.22;
    const skirt = new Mesh(new BoxGeometry(1.02, skirtDepth, 1.02), skirtMat);
    skirt.position.y = -skirtDepth / 2;
    skirt.receiveShadow = true;
    holder.add(skirt);
  }

  /**
   * A raised deck over water (§ Straßen als Textur): a narrow, pier-less wooden
   * boardwalk for a single-tile hop (`span<=1`, "Steg"), or a sturdier deck with
   * rails/piles for a wider crossing (span>1, "Brücke") — textured via the
   * shared road materials (`road_boardwalk`/`road_bridge_deck`), flat-colour
   * fallback until dropped in.
   */
  private buildBridgeDeck(g: Group, rotationY: number, span: number): void {
    const mats = this.getRoadMats();
    const isBoardwalk = span <= 1;
    const deck = new Group();
    deck.rotation.y = rotationY;
    const yTop = isBoardwalk ? 0.12 : 0.5;
    const road = new Mesh(new BoxGeometry(isBoardwalk ? 0.42 : 0.7, 0.08, 1.02), isBoardwalk ? mats.boardwalk : mats.bridgeDeck);
    road.position.y = yTop;
    road.castShadow = true;
    road.receiveShadow = true;
    deck.add(road);
    const railMat = new MeshStandardMaterial({ color: isBoardwalk ? 0x8a6a45 : 0x9aa1ab, roughness: 0.9 });
    const railInset = isBoardwalk ? 0.19 : 0.36;
    for (const sx of [-railInset, railInset]) {
      const rail = new Mesh(new BoxGeometry(0.05, isBoardwalk ? 0.1 : 0.16, 1.02), railMat);
      rail.position.set(sx, yTop + (isBoardwalk ? 0.08 : 0.12), 0);
      deck.add(rail);
    }
    if (!isBoardwalk) {
      const pileMat = new MeshStandardMaterial({ color: 0x6d747d, roughness: 1 });
      for (const sz of [-0.32, 0.32]) {
        const pile = new Mesh(new BoxGeometry(0.6, 0.5, 0.1), pileMat);
        pile.position.set(0, 0.25, sz);
        deck.add(pile);
      }
    }
    g.add(deck);
  }

  /** Lazily builds the shared road/bridge materials (once) and kicks off their
   *  texture loads — every road tile reuses these SAME instances, so a dropped-
   *  in file lights up everywhere at once instead of per-tile. Flat colour until
   *  then, exactly the drop-in fallback used everywhere else in the project. */
  private getRoadMats(): RoadMaterials {
    if (this.roadMats) return this.roadMats;
    const mats: RoadMaterials = {
      // § A5: Asphalt spürbar aufgehellt (vorher 0x474d57 „zu schwarz"). Da die
      // Drop-in-Textur `road_asphalt` die Farbe nur MULTIPLIZIERT (also nie
      // aufhellen kann), hebt ein dezenter Emissiv-Term die Schwärze — Fahrbahn
      // bleibt gut lesbar, auch nachts (leichte Eigenhelligkeit ist erwünscht).
      asphalt: new MeshStandardMaterial({ color: 0x7a808a, roughness: 0.92, emissive: 0x2b2e34, emissiveIntensity: 1 }),
      mountain: new MeshStandardMaterial({ color: 0x8a8074, roughness: 1, emissive: 0x2e2a24, emissiveIntensity: 1 }),
      edge: new MeshStandardMaterial({ color: 0x9aa2ac, roughness: 1 }),
      dash: new MeshStandardMaterial({ color: 0xf0e6a0, roughness: 1, transparent: true }),
      roundabout: new MeshStandardMaterial({ color: 0x5f656f, roughness: 0.9 }),
      bridgeDeck: new MeshStandardMaterial({ color: 0x6a7079, roughness: 0.95 }),
      boardwalk: new MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.9 }),
      sidewalk: new MeshStandardMaterial({ color: 0xb7bcc4, roughness: 1 }),
      lampPost: new MeshStandardMaterial({ color: 0x3a3f47, roughness: 0.8, metalness: 0.3 }),
      lampHead: new MeshStandardMaterial({ color: 0xffe9a8, emissive: 0xffcf6b, emissiveIntensity: 0.9 }),
    };
    this.roadMats = mats;
    this.applyRoadTex(loadRoadTexture('road_asphalt'), mats.asphalt);
    this.applyRoadTex(loadRoadTexture('road_mountain'), mats.mountain);
    // Reuses the already-documented terrain edge texture (docs/TERRAIN_TEXTURES.md
    // "Wege") instead of a duplicate road-specific edge asset.
    this.applyRoadTex(loadSplatTexture('terrain_road_edge'), mats.edge);
    this.applyRoadTex(loadRoadTexture('road_marking_dash'), mats.dash);
    this.applyRoadTex(loadRoadTexture('road_roundabout'), mats.roundabout);
    this.applyRoadTex(loadRoadTexture('road_bridge_deck'), mats.bridgeDeck);
    this.applyRoadTex(loadRoadTexture('road_boardwalk'), mats.boardwalk);
    return mats;
  }

  /** Assigns a drop-in texture to a shared road material once it resolves;
   *  no-op while the file is still missing. */
  private applyRoadTex(promise: Promise<Texture> | undefined, mat: MeshStandardMaterial): void {
    if (!promise) return;
    void promise.then((tex) => {
      if (this.destroyed) return;
      mat.map = tex;
      mat.needsUpdate = true;
    });
  }

  /**
   * Auto-tiled, texture-based road (§ Straßen als Textur, v0.44): a flat
   * asphalt core/arm skeleton connecting to road neighbours (mask), edge-blend
   * strips on the open edges, and a dashed centreline for the bigger road
   * classes — so straight/curve/T/cross/end all read correctly. A 4-way
   * crossing (`mask===15`) renders as a round roundabout deck instead of a
   * square junction — same mask data, just a different shape choice, no new
   * road type. Mountain-terrain tiles get the rougher `road_mountain` surface
   * instead of asphalt — covers "Bergstraße"/"Pass" as a pure texture swap.
   */
  private buildRoadTile(
    g: Group,
    mask: number,
    cls: RoadClass,
    terrainType: TerrainType | undefined,
    gx = 0,
    gz = 0,
  ): void {
    const spec = ROAD_SPECS[cls];
    const mats = this.getRoadMats();
    const yAsph = 0.03;
    const yKerb = 0.035;
    const yMark = 0.045;
    const surfaceMat = terrainType === 'mountain' ? mats.mountain : mats.asphalt;
    const half = spec.half;
    const isRoundabout = mask === 15;

    // Central junction pad — round for a 4-way roundabout, square otherwise.
    if (isRoundabout) {
      const core = new Mesh(new CylinderGeometry(half * 1.15, half * 1.15, 0.06, 24), mats.roundabout);
      core.position.y = yAsph;
      core.receiveShadow = true;
      g.add(core);
    } else {
      const core = new Mesh(new BoxGeometry(half * 2, 0.06, half * 2), surfaceMat);
      core.position.y = yAsph;
      core.receiveShadow = true;
      g.add(core);
    }

    const dirs = [
      { bit: 1, dx: 0, dz: -1 },
      { bit: 2, dx: 1, dz: 0 },
      { bit: 4, dx: 0, dz: 1 },
      { bit: 8, dx: -1, dz: 0 },
    ];
    for (const { bit, dx, dz } of dirs) {
      if (mask & bit) {
        // Asphalt/mountain arm reaching to the tile edge in that direction.
        const arm = new Mesh(
          new BoxGeometry(dx !== 0 ? 0.5 : half * 2, 0.06, dz !== 0 ? 0.5 : half * 2),
          surfaceMat,
        );
        arm.position.set(dx * 0.25, yAsph, dz * 0.25);
        arm.receiveShadow = true;
        g.add(arm);
        // Dashed centreline for bigger classes (not residential/back streets;
        // skipped on the roundabout deck itself).
        if (spec.centerline && !isRoundabout) {
          const mark = new Mesh(new BoxGeometry(dx !== 0 ? 0.34 : 0.05, 0.02, dz !== 0 ? 0.34 : 0.05), mats.dash);
          mark.position.set(dx * 0.28, yMark, dz * 0.28);
          g.add(mark);
        }
      } else {
        // § A5 Straßen-Redesign: offene Kante = Gehweg statt nackter Erdkante.
        // Ein heller Beton-Streifen (leicht erhöht) mit dünnem Bordstein davor —
        // liest sich als Bürgersteig, nicht als schwebende Platte.
        const sidewalk = new Mesh(
          new BoxGeometry(dx !== 0 ? 0.16 : 0.98, 0.08, dz !== 0 ? 0.16 : 0.98),
          mats.sidewalk,
        );
        sidewalk.position.set(dx * 0.42, yKerb + 0.02, dz * 0.42);
        sidewalk.receiveShadow = true;
        g.add(sidewalk);
        const kerb = new Mesh(new BoxGeometry(dx !== 0 ? 0.05 : 0.98, 0.1, dz !== 0 ? 0.05 : 0.98), mats.edge);
        kerb.position.set(dx * 0.33, yKerb, dz * 0.33);
        kerb.receiveShadow = true;
        g.add(kerb);
      }
    }

    // § A5: Straßenlaternen — sparsam (deterministisch ~ jede 4. Kachel) an einer
    // offenen Kante, damit Straßenzüge belebt wirken ohne die Draw-Calls zu
    // sprengen. Nachts leuchtet der emissive Kopf (Material ist immer emissiv).
    const openDirs = dirs.filter((d) => !(mask & d.bit));
    if (openDirs.length > 0 && hash01(`${gx},${gz}lamp`) < 0.28) {
      const spot = openDirs[Math.floor(hash01(`${gx},${gz}spot`) * openDirs.length)]!;
      const lamp = new Group();
      const post = new Mesh(new CylinderGeometry(0.03, 0.04, 0.9, 6), mats.lampPost);
      post.position.y = 0.45;
      post.castShadow = true;
      lamp.add(post);
      const arm = new Mesh(new BoxGeometry(0.18, 0.04, 0.04), mats.lampPost);
      arm.position.set(0.09, 0.88, 0);
      lamp.add(arm);
      const head = new Mesh(new SphereGeometry(0.07, 8, 6), mats.lampHead);
      head.position.set(0.18, 0.86, 0);
      lamp.add(head);
      // An die offene Kante stellen, Arm zeigt zur Fahrbahn.
      lamp.position.set(spot.dx * 0.46, 0, spot.dz * 0.46);
      lamp.rotation.y = Math.atan2(-spot.dx, -spot.dz);
      g.add(lamp);
    }
  }

  /** Procedural block: body + roof (+ rotor/scaffold), sized by footprint & stage. */
  private proceduralBuilding(
    def: BuildingDef,
    b: BuildingInstance,
    constructing: boolean,
    roadMask: number,
  ): { group: Group; rotor?: TObject3D; smoke?: Vector3 } {
    const g = new Group();
    const w = def.size.w * 0.86;
    const d = def.size.h * 0.86;
    const height = buildingHeight(def, b.upgradeLevel);
    const baseColor = new Color(CATEGORY_COLORS[def.category] ?? 0x999999);
    const jitter = (hash01(b.id) - 0.5) * 0.18;
    baseColor.offsetHSL(0, 0, jitter);

    let rotor: TObject3D | undefined;
    let smoke: Vector3 | undefined;

    if (def.category === 'roads') {
      this.buildRoadTile(g, roadMask, roadClassFor(def.id), worldTerrainAt(this.controller.state, b.x, b.y), b.x, b.y);
      return { group: g };
    }

    if (def.category === 'decoration') {
      // Correctly-proportioned procedural prop per id (a bench is NOT tree-sized).
      g.add(...decorationProc(def.id));
      return { group: g };
    }

    // § A7: Die Farm ist kein Würfel, sondern ein Areal — Felder/Zaun/Scheune/
    // Silos, die mit der Stufe wachsen. (Ein Drop-in `farm.glb` ersetzt das
    // ohnehin über den Modell-Pfad; dies ist der lebendige Fallback.)
    if (def.id === 'farm' && !constructing) {
      g.add(...farmProc(def, b.upgradeLevel));
      return { group: g };
    }

    // Body.
    const bodyMat = new MeshStandardMaterial({
      color: constructing ? new Color(0xb8a24a) : baseColor,
      transparent: constructing,
      opacity: constructing ? 0.55 : 1,
      roughness: 0.85,
      metalness: def.category === 'services' || def.category === 'economy' ? 0.15 : 0,
    });

    // § A3 (Gebäudesystem 2.0): Große Klassen (L/XL/XXL, Spannweite ≥ 4) füllen
    // ihr Grundstück als ENSEMBLE — Hofplatte + Hauptgebäude + Nebenflügel —
    // statt als ein einziger Riesen-Würfel. Windpark bleibt bewusst offen
    // (Turbinen statt Halle). Kleine Klassen behalten den kompakten Block.
    const span = Math.max(def.size.w, def.size.h);
    const ensemble = span >= 4 && def.id !== 'wind_farm';
    // Maße/Lage des Hauptbaukörpers — Dach/Kamin richten sich danach.
    let bw = w;
    let bd = d;
    let bx = 0;
    let bz = 0;
    if (ensemble) {
      const yardColor =
        def.category === 'production' || def.category === 'energy'
          ? 0x5d6066 // Werkshof-Asphalt
          : def.category === 'leisure'
            ? 0x7da05e // Parkwiese
            : 0x8f8a80; // heller Vorplatz
      const lot = new Mesh(
        new BoxGeometry(def.size.w * 0.96, 0.07, def.size.h * 0.96),
        new MeshStandardMaterial({ color: yardColor, roughness: 0.96 }),
      );
      lot.position.y = 0.035;
      lot.receiveShadow = true;
      g.add(lot);

      bw = w * 0.62;
      bd = d * 0.55;
      bx = -w * 0.09;
      bz = -d * 0.17;
      const wing = new Mesh(new BoxGeometry(w * 0.34, height * 0.55, d * 0.42), bodyMat);
      wing.position.set(w * 0.28, height * 0.275, d * 0.2);
      wing.castShadow = true;
      wing.receiveShadow = true;
      g.add(wing);
      const wingCap = new Mesh(
        new BoxGeometry(w * 0.34 * 0.94, 0.1, d * 0.42 * 0.94),
        new MeshStandardMaterial({ color: 0x3a414c }),
      );
      wingCap.position.set(w * 0.28, height * 0.55 + 0.05, d * 0.2);
      g.add(wingCap);
      if (span >= 7) {
        // XXL: dritter Baukörper — das Areal liest sich als Komplex.
        const annex = new Mesh(new BoxGeometry(w * 0.24, height * 0.4, d * 0.3), bodyMat);
        annex.position.set(-w * 0.3, height * 0.2, d * 0.3);
        annex.castShadow = true;
        annex.receiveShadow = true;
        g.add(annex);
      }
    }

    const body = new Mesh(new BoxGeometry(bw, height, bd), bodyMat);
    body.position.set(bx, height / 2, bz);
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    // Crisp dark edges for readability.
    const edges = new LineSegments(
      new EdgesGeometry(body.geometry),
      new LineBasicMaterial({ color: 0x1c222b, transparent: true, opacity: 0.25 }),
    );
    edges.position.copy(body.position);
    g.add(edges);

    // Roof: pitched pyramid for short buildings, flat cap for tall towers.
    const roofColor = new Color(0xb5462f).offsetHSL(hash01(b.id + 'r') * 0.08 - 0.04, 0, 0);
    if (height < 2.6 && def.category !== 'production') {
      const roof = new Mesh(
        new ConeGeometry(Math.max(bw, bd) * 0.72, 0.5 + height * 0.18, 4),
        new MeshStandardMaterial({ color: roofColor, roughness: 0.9 }),
      );
      roof.rotation.y = Math.PI / 4;
      roof.position.set(bx, height + (0.5 + height * 0.18) / 2 - 0.02, bz);
      roof.castShadow = true;
      g.add(roof);
    } else {
      const cap = new Mesh(new BoxGeometry(bw * 0.9, 0.16, bd * 0.9), new MeshStandardMaterial({ color: 0x333a44 }));
      cap.position.set(bx, height + 0.08, bz);
      g.add(cap);
    }

    // Windpark (7×7): mehrere Turbinen verteilt über das Areal — die erste
    // trägt den animierten Rotor-Knoten, die übrigen stehen versetzt.
    if (def.id === 'wind_farm') {
      const mastMat = new MeshStandardMaterial({ color: 0xf2f2f2 });
      const bladeMat = new MeshStandardMaterial({ color: 0xffffff });
      const spots: [number, number, number][] = [
        [0, 0, 1], // x-Anteil, z-Anteil, Größenfaktor
        [-w * 0.3, d * 0.28, 0.8],
        [w * 0.3, -d * 0.26, 0.85],
      ];
      for (const [tx, tz, s] of spots) {
        const mastH = height * 1.4 * s;
        const mast = new Mesh(new CylinderGeometry(0.09 * s, 0.13 * s, mastH), mastMat);
        mast.position.set(tx, mastH / 2, tz);
        mast.castShadow = true;
        g.add(mast);
        const r = new Group();
        r.position.set(tx, mastH, tz + 0.12 * s);
        for (let i = 0; i < 3; i++) {
          const blade = new Mesh(new BoxGeometry(0.06 * s, 1.5 * s, 0.16 * s), bladeMat);
          blade.position.y = 0.75 * s;
          const holder = new Group();
          holder.rotation.z = (i * Math.PI * 2) / 3 + (rotor ? hash01(b.id + tx) * 2 : 0);
          holder.add(blade);
          r.add(holder);
        }
        g.add(r);
        rotor ??= r; // nur die erste Turbine wird aktiv gedreht
      }
    }

    // Chimney + smoke anchor for active production / energy buildings.
    if ((def.category === 'production' || def.category === 'energy') && def.id !== 'wind_farm' && b.status === 'active') {
      const chim = new Mesh(new BoxGeometry(0.22, 0.6, 0.22), new MeshStandardMaterial({ color: 0x6c6f77 }));
      const chx = bx + bw * 0.33;
      const chz = bz - bd * 0.33;
      chim.position.set(chx, height + 0.3, chz);
      g.add(chim);
      const px = this.pxFromGroup(def, b, chx);
      const pz = this.pzFromGroup(def, b, chz);
      // World-space anchor: add the building's ground height (v0.39).
      smoke = new Vector3(px, terrainHeightAt(px, pz) + height + 0.7, pz);
    }

    // (Construction scaffold is added centrally by addConstructionSite so it also
    // covers upgrades — see buildNode.)

    return { group: g, ...(rotor ? { rotor } : {}), ...(smoke ? { smoke } : {}) };
  }

  private pxFromGroup(def: BuildingDef, b: BuildingInstance, local: number): number {
    return b.x + def.size.w / 2 + local;
  }
  private pzFromGroup(def: BuildingDef, b: BuildingInstance, local: number): number {
    return b.y + def.size.h / 2 + local;
  }

  // ---- live effects: smoke + cars ------------------------------------------

  /** Lazily fetch the drop-in smoke effect model (once). No-op if none supplied. */
  private ensureSmokeSrc(): void {
    if (this.smokeSrcState !== 'none') return;
    const url = firstModel(effectModel, SMOKE_EFFECT_MODELS);
    if (!url) {
      this.smokeSrcState = 'fail';
      return;
    }
    this.smokeSrcState = 'loading';
    loadModel(url)
      .then((src) => {
        this.smokeSrc = src;
        this.smokeSrcState = 'ready';
      })
      .catch(() => {
        this.smokeSrcState = 'fail';
      });
  }

  private animateSmoke(dt: number): void {
    const sources: Vector3[] = [];
    for (const node of this.nodes.values()) if (node.smoke) sources.push(node.smoke);
    if (sources.length > 0) this.ensureSmokeSrc();
    this.smokeTimer -= dt;
    if (this.smokeTimer <= 0 && sources.length > 0 && this.smoke.length < MAX_SMOKE) {
      this.smokeTimer = 0.5;
      const src = sources[Math.floor(Math.random() * sources.length)]!;
      if (this.smokeSrcState === 'ready' && this.smokeSrc) {
        // Model puff: clone, small, rises + grows (opaque models simply pop out).
        const puff = this.smokeSrc.clone(true);
        fitObject(puff, { targetHeight: 0.5 });
        puff.position.set(src.x, src.y, src.z);
        this.liveGroup.add(puff);
        this.smoke.push({ obj: puff, mat: undefined, vy: 0.6 + Math.random() * 0.4, age: 0, ttl: 2.6 });
      } else {
        const mat = new SpriteMaterial({ color: 0xdadada, transparent: true, opacity: 0.5, depthWrite: false });
        const s = new Sprite(mat);
        s.position.copy(src);
        s.scale.setScalar(0.6);
        this.liveGroup.add(s);
        this.smoke.push({ obj: s, mat, vy: 0.6 + Math.random() * 0.4, age: 0, ttl: 2.6 });
      }
    }
    for (let i = this.smoke.length - 1; i >= 0; i--) {
      const p = this.smoke[i]!;
      p.age += dt;
      p.obj.position.y += p.vy * dt;
      p.obj.position.x += dt * 0.2;
      const k = p.age / p.ttl;
      if (p.mat) {
        p.obj.scale.setScalar(0.6 + k * 1.1);
        p.mat.opacity = 0.5 * (1 - k);
      } else {
        // Model puff: grow then shrink away near the end of its life.
        p.obj.scale.setScalar((0.8 + k * 0.8) * (k > 0.7 ? (1 - k) / 0.3 : 1));
      }
      if (p.age >= p.ttl) {
        this.liveGroup.remove(p.obj);
        this.disposeGroup(p.obj);
        this.smoke.splice(i, 1);
      }
    }
  }

  private seedCars(): void {
    // Drop cars whose current road tile is gone; top up to a modest cap so the
    // traffic reads as "believable", not "massive" (§4).
    for (let i = this.cars.length - 1; i >= 0; i--) {
      const car = this.cars[i]!;
      const at = car.path[car.idx];
      if (!at || !this.roadSet.has(`${at.x},${at.y}`)) {
        this.liveGroup.remove(car.mesh);
        this.disposeGroup(car.mesh);
        this.cars.splice(i, 1);
      }
    }
    const cap = Math.min(MAX_CARS, Math.floor(this.roadTiles.length / 6));
    let guard = 40;
    while (this.cars.length < cap && this.roadTiles.length > 1 && guard-- > 0) {
      const path = this.buildCarPath();
      if (!path) continue;
      const mesh = makeCarMesh();
      const car: Car = { mesh, path, idx: 0, t: 0, speed: 0.85 + Math.random() * 0.5 };
      this.liveGroup.add(mesh);
      this.cars.push(car);
      // Drop-in vehicle model (§ Fahrzeuge): a `car.glb` in models/vehicles/
      // replaces the procedural car. Author facing +z. Fallback stays otherwise.
      const carUrl = firstModel(vehicleModel, VEHICLE_CAR_MODELS);
      if (carUrl) void this.swapInModel(carUrl, mesh, { targetHeight: 0.34 });
    }
  }

  private roadNeighbors(tile: { x: number; y: number }): { x: number; y: number }[] {
    return [
      { x: tile.x + 1, y: tile.y },
      { x: tile.x - 1, y: tile.y },
      { x: tile.x, y: tile.y + 1 },
      { x: tile.x, y: tile.y - 1 },
    ].filter((n) => this.roadSet.has(`${n.x},${n.y}`));
  }

  /** Momentum-based next tile: prefer going straight through, turn at junctions,
   *  never U-turn unless it's a dead end (§4 — no chaotic direction changes).
   *  Used only to extend a fallback random-walk route (see buildCarPath) — real
   *  routes drive a proper BFS path instead. */
  private nextRoadTile(from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number } {
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    const cands = this.roadNeighbors(to).filter((n) => !(n.x === from.x && n.y === from.y));
    if (cands.length === 0) return { ...from }; // dead end → turn around
    const straight = cands.find((n) => n.x - to.x === dx && n.y - to.y === dy);
    if (straight && (cands.length === 1 || Math.random() < 0.7)) return straight;
    return cands[Math.floor(Math.random() * cands.length)]!;
  }

  /** A road tile next to a random ACTIVE building whose category matches, or
   *  undefined if none exist yet. Reuses roadTileAdjacent (§ mission van). */
  private roadTileNearRandomBuilding(categories: ReadonlySet<string>): { x: number; y: number } | undefined {
    const candidates = Object.values(this.controller.state.buildings).filter((b) => {
      if (b.status !== 'active') return false;
      const def = this.controller.config.buildings.get(b.defId);
      return def !== undefined && categories.has(def.category);
    });
    if (candidates.length === 0) return undefined;
    // Try a handful of random picks (not every candidate) — cheap and avoids
    // biasing hard toward whichever building happens to be first when several
    // of the sample have no adjacent road yet.
    for (let i = 0; i < Math.min(5, candidates.length); i++) {
      const b = candidates[Math.floor(Math.random() * candidates.length)]!;
      const def = this.controller.config.buildings.get(b.defId)!;
      const tile = this.roadTileAdjacent(b.x, b.y, def.size.w, def.size.h);
      if (tile) return tile;
    }
    return undefined;
  }

  /** A short momentum-based route from a random road tile (§4 fallback) — used
   *  before the first house/destination exists, or when no path connects them. */
  private randomWalkPath(steps: number): { x: number; y: number }[] | undefined {
    const start = this.roadTiles[Math.floor(Math.random() * this.roadTiles.length)];
    if (!start) return undefined;
    const nbs = this.roadNeighbors(start);
    if (nbs.length === 0) return undefined;
    const path = [start, nbs[Math.floor(Math.random() * nbs.length)]!];
    for (let i = 0; i < steps; i++) {
      const from = path[path.length - 2]!;
      const to = path[path.length - 1]!;
      path.push(this.nextRoadTile(from, to));
    }
    return path;
  }

  /**
   * A believable route for ambient traffic (§ Verkehr Haus→Straße→Ziel): a road
   * tile next to a random house to a road tile next to a random workplace/
   * destination, via the same BFS the mission van uses (roadPath) — no more
   * "pick a random neighbour at every junction" wandering. Falls back to a
   * short random walk while the city has no house/destination pair yet (or
   * none are reachable from each other), so traffic never disappears entirely.
   */
  private buildCarPath(): { x: number; y: number }[] | undefined {
    const origin = this.roadTileNearRandomBuilding(RESIDENTIAL_CATEGORIES);
    const dest = origin && this.roadTileNearRandomBuilding(TRAFFIC_DESTINATION_CATEGORIES);
    if (origin && dest) {
      const path = this.roadPath(origin, dest);
      if (path.length >= 2) return path;
    }
    return this.randomWalkPath(8);
  }

  private animateCars(dt: number): void {
    for (const car of this.cars) {
      if (car.path.length < 2) continue;
      car.t += dt * car.speed;
      while (car.t >= 1 && car.idx < car.path.length - 2) {
        car.t -= 1;
        car.idx++;
      }
      // Reached the last segment's end: arrived at the destination — pick a new
      // house → destination route (or wait one tick if none exists yet).
      if (car.idx >= car.path.length - 2 && car.t >= 1) {
        const next = this.buildCarPath();
        if (next) {
          car.path = next;
          car.idx = 0;
          car.t = 0;
        } else {
          car.t = 1;
        }
      }
      const from = car.path[car.idx]!;
      const to = car.path[Math.min(car.idx + 1, car.path.length - 1)]!;
      const tt = car.idx >= car.path.length - 1 ? 1 : Math.min(car.t, 1);
      const cx = MathUtils.lerp(from.x + 0.5, to.x + 0.5, tt);
      const cz = MathUtils.lerp(from.y + 0.5, to.y + 0.5, tt);
      // Drive on the right: offset perpendicular to travel direction.
      const hx = to.x - from.x;
      const hz = to.y - from.y;
      const rx = hz * 0.16;
      const rz = -hx * 0.16;
      car.mesh.position.set(cx + rx, terrainHeightAt(cx, cz) + 0.3, cz + rz);
      if (hx !== 0 || hz !== 0) car.mesh.rotation.y = Math.atan2(hx, hz);
    }
  }

  // ---- active Stadtarbeit: mission van + camera focus (§6) -------------------

  private updateMission(): void {
    // Im Fahrmodus fährt der Spieler selbst — kein ambienter Missionsvan, keine
    // automatische Kamerafokussierung (die Verfolgerkamera hat Vorrang).
    if (this.drive) {
      this.clearMissionVan();
      return;
    }
    const active = this.controller.state.activities.active;
    if (!active || active.targets.length === 0) {
      this.clearMissionVan();
      this.missionKey = '';
      return;
    }
    const def = this.controller.config.activities.activities.find((a) => a.id === active.defId);
    const key = `${active.defId}|${active.startedAt}|${active.vehicle ?? def?.vehicle ?? 'van'}`;
    if (key !== this.missionKey) {
      this.missionKey = key;
      // Focus the camera on the first target so the mission location is obvious.
      const first = active.targets[0];
      const b0 = first && this.controller.state.buildings[first.buildingId];
      const def0 = b0 && this.controller.config.buildings.get(b0.defId);
      if (b0 && def0) this.cam.focusGround(b0.x + def0.size.w / 2, b0.y + def0.size.h / 2, Math.min(this.cam.getDist(), 58));
    }
    // A visible delivery van only for delivery-type runs (others just focus).
    if (def?.type !== 'delivery') {
      this.clearMissionVan();
      return;
    }
    this.retargetVan(active);
  }

  private retargetVan(active: NonNullable<GameController['state']['activities']['active']>): void {
    const targets = active.targets;
    const nextStop = targets.find((target) => !target.done);
    if (!nextStop) {
      this.clearMissionVan();
      return;
    }
    const selectedVehicle = active.vehicle ?? this.activeDriveDef()?.vehicle ?? 'van';
    const planned = active.plannedRoadPath;
    if (planned && planned.length >= 2) {
      const pathKey = planned.map((point) => `${point.x},${point.y}`).join('|');
      if (!this.missionVan || this.missionVan.pathKey !== pathKey) {
        this.clearMissionVan();
        this.missionVan = this.createMissionVehicle(selectedVehicle, planned, pathKey);
      }
      return;
    }

    const start = this.missionVan ? this.vanTile() : this.deliverySourceTile() ?? this.roadTiles[0];
    if (!start) return;
    const b = this.controller.state.buildings[nextStop.buildingId];
    const def = b && this.controller.config.buildings.get(b.defId);
    const goal = b && def ? this.roadTileAdjacent(b.x, b.y, def.size.w, def.size.h) : undefined;
    const path = goal ? this.roadPath(start, goal) : [];
    if (path.length === 0) {
      this.clearMissionVan();
      return;
    }
    if (!this.missionVan) this.missionVan = this.createMissionVehicle(selectedVehicle, path, '');
    this.missionVan.path = path;
    this.missionVan.pathKey = '';
    this.missionVan.idx = 0;
    this.missionVan.t = 0;
  }

  private createMissionVehicle(
    vehicle: string,
    path: readonly { x: number; y: number }[],
    pathKey: string,
  ): NonNullable<ThreeMapRenderer['missionVan']> {
    const mesh = makeMissionVehicle(vehicle);
    this.liveGroup.add(mesh);
    const modelList = ACTIVITY_VEHICLE_MODELS[vehicle] ?? VAN_MODELS;
    const modelUrl = firstModel(vehicleModel, modelList);
    if (modelUrl) void this.swapInModel(modelUrl, mesh, { targetHeight: 0.5 });
    const vehicleDef = this.controller.config.activities.vehicles.find((candidate) => candidate.id === vehicle);
    return {
      mesh,
      path: path.map((point) => ({ ...point })),
      pathKey,
      idx: 0,
      t: 0,
      speed: MathUtils.clamp((vehicleDef?.speedKph ?? 60) / 48, 0.8, 2.1),
    };
  }

  private vanTile(): { x: number; y: number } | undefined {
    const p = this.missionVan?.mesh.position;
    return p ? { x: Math.floor(p.x), y: Math.floor(p.z) } : undefined;
  }

  private clearMissionVan(): void {
    if (this.missionVan) {
      this.liveGroup.remove(this.missionVan.mesh);
      this.disposeGroup(this.missionVan.mesh);
      this.missionVan = undefined;
    }
  }

  /** A road tile orthogonally adjacent to a footprint (the van's drop-off spot). */
  private roadTileAdjacent(x: number, y: number, w: number, h: number): { x: number; y: number } | undefined {
    for (let dx = 0; dx < w; dx++) {
      for (const t of [{ x: x + dx, y: y - 1 }, { x: x + dx, y: y + h }]) {
        if (this.roadSet.has(`${t.x},${t.y}`)) return t;
      }
    }
    for (let dy = 0; dy < h; dy++) {
      for (const t of [{ x: x - 1, y: y + dy }, { x: x + w, y: y + dy }]) {
        if (this.roadSet.has(`${t.x},${t.y}`)) return t;
      }
    }
    return undefined;
  }

  private deliverySourceTile(): { x: number; y: number } | undefined {
    const sources = new Set(['farm', 'market', 'supermarket', 'warehouse', 'depot', 'bakery', 'trading_post']);
    for (const b of Object.values(this.controller.state.buildings)) {
      const def = this.controller.config.buildings.get(b.defId);
      if (!def || !sources.has(b.defId)) continue;
      const t = this.roadTileAdjacent(b.x, b.y, def.size.w, def.size.h);
      if (t) return t;
    }
    return undefined;
  }

  /** BFS over the road network for a tile path from → to (empty if unreachable). */
  private roadPath(from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number }[] {
    const key = (t: { x: number; y: number }) => `${t.x},${t.y}`;
    if (key(from) === key(to)) return [from];
    const prev = new Map<string, { x: number; y: number }>();
    const seen = new Set<string>([key(from)]);
    let frontier = [from];
    let guard = 4000;
    while (frontier.length > 0 && guard-- > 0) {
      const nextFrontier: { x: number; y: number }[] = [];
      for (const t of frontier) {
        for (const n of this.roadNeighbors(t)) {
          const nk = key(n);
          if (seen.has(nk)) continue;
          seen.add(nk);
          prev.set(nk, t);
          if (nk === key(to)) {
            const path = [to];
            let cur: { x: number; y: number } | undefined = t;
            while (cur) {
              path.push(cur);
              cur = prev.get(key(cur));
            }
            return path.reverse();
          }
          nextFrontier.push(n);
        }
      }
      frontier = nextFrontier;
    }
    return [];
  }

  private animateMission(dt: number): void {
    const v = this.missionVan;
    if (!v || v.path.length < 2) return;
    v.t += dt * v.speed;
    while (v.t >= 1 && v.idx < v.path.length - 2) {
      v.t -= 1;
      v.idx++;
    }
    const a = v.path[v.idx]!;
    const b = v.path[Math.min(v.idx + 1, v.path.length - 1)]!;
    const tt = v.idx >= v.path.length - 1 ? 1 : Math.min(1, v.t);
    const hx = b.x - a.x;
    const hz = b.y - a.y;
    const vanX = MathUtils.lerp(a.x + 0.5, b.x + 0.5, tt) + hz * 0.16;
    const vanZ = MathUtils.lerp(a.y + 0.5, b.y + 0.5, tt) - hx * 0.16;
    v.mesh.position.set(vanX, terrainHeightAt(vanX, vanZ) + 0.32, vanZ);
    if (hx !== 0 || hz !== 0) v.mesh.rotation.y = Math.atan2(hx, hz);
    if (this.missionFollow) this.cam.focusGround(vanX, vanZ, Math.min(this.cam.getDist(), 34));

    const active = this.controller.state.activities.active;
    const nextStop = active?.targets.find((target) => !target.done);
    const nextStopIndex = nextStop && active ? active.targets.findIndex((target) => target.buildingId === nextStop.buildingId) : -1;
    const plannedAnchor =
      active?.plannedRoadPath && nextStopIndex >= 0
        ? this.controller
            .getActivityRouteAnchors(
              active.defId,
              active.targets.map((target) => target.buildingId),
            )
            ?.targets[nextStopIndex]
        : undefined;
    const building = nextStop && this.controller.state.buildings[nextStop.buildingId];
    const buildingDef = building && this.controller.config.buildings.get(building.defId);
    const goal =
      plannedAnchor ??
      (building && buildingDef
        ? this.roadTileAdjacent(building.x, building.y, buildingDef.size.w, buildingDef.size.h)
        : undefined);
    if (nextStop && goal && Math.hypot(vanX - (goal.x + 0.5), vanZ - (goal.y + 0.5)) < 0.38) {
      this.callbacks.onDriveProgress?.(nextStop.buildingId);
    }
  }

  // ---- markers (camera-facing billboards, §15) ------------------------------

  /** Approximate a building's top height (for anchoring markers/smoke). */
  private approxHeight(def: BuildingDef, upgradeLevel: number): number {
    return Math.max(0.4, buildingHeight(def, upgradeLevel));
  }

  private markerTexture(kind: MarkerKind): CanvasTexture {
    let tex = this.markerTex.get(kind);
    if (!tex) {
      tex = makeMarkerTexture(kind);
      this.markerTex.set(kind, tex);
    }
    return tex;
  }

  /**
   * ONE priority billboard per building. Mission/construction signals remain
   * available, while the presentation-only info-layer decides whether problems,
   * needs, upgrades or production are shown. Categories, effects and shared
   * diagnostics are only read here; no gameplay value is calculated.
   */
  private rebuildMarkers(): void {
    for (const m of this.markers) {
      this.markerGroup.remove(m.obj);
      this.disposeGroup(m.obj);
    }
    this.markers = [];
    const targets = new Set(this.controller.getActivityTargets().filter((tg) => !tg.done).map((tg) => tg.buildingId));

    for (const b of Object.values(this.controller.state.buildings)) {
      const def = this.controller.config.buildings.get(b.defId);
      if (!def || def.category === 'roads' || def.category === 'decoration') continue;
      let kind: MarkerKind | undefined;
      if (targets.has(b.id)) kind = 'activity';
      else if (b.status === 'constructing') kind = 'construction';
      else if (this.infoLayerMode !== 'off') {
        const marker = this.controller.getBuildingMarker(b.id);
        const effects = effectiveEffects(def, b.upgradeLevel);
        const isNeedSource = effects.some(
          (effect) =>
            effect.type === 'coverage' ||
            effect.type === 'distribution' ||
            (effect.type === 'capacity' && effect.need !== 'housing'),
        );
        const isProducer =
          def.category === 'production' ||
          def.category === 'economy' ||
          effects.some((effect) => effect.type === 'produce' || effect.type === 'revenue');

        if (
          marker === 'problem' &&
          (this.infoLayerMode === 'problems' ||
            this.infoLayerMode === 'needs' ||
            this.infoLayerMode === 'production' ||
            this.infoLayerMode === 'all')
        ) {
          kind = 'problem';
        } else if (
          marker === 'upgrade' &&
          (this.infoLayerMode === 'upgrades' || this.infoLayerMode === 'all')
        ) {
          kind = 'upgrade';
        } else if (isNeedSource && (this.infoLayerMode === 'needs' || this.infoLayerMode === 'all')) {
          kind = 'need';
        } else if (isProducer && (this.infoLayerMode === 'production' || this.infoLayerMode === 'all')) {
          kind = 'production';
        }
      }
      if (!kind) continue;
      const big = kind === 'activity';
      const cx = b.x + def.size.w / 2;
      const cz = b.y + def.size.h / 2;
      // Anchor above the building, which itself sits on the organic ground (v0.39).
      const baseY = terrainHeightAt(cx, cz) + this.approxHeight(def, b.upgradeLevel) + (big ? 1.4 : 1.0);

      // Drop-in 3D marker (§ Marker): a `marker_problem.glb` etc. in
      // models/markers/ replaces the flat billboard with a floating model that
      // bobs and spins. Falls back to the camera-facing canvas sprite.
      const modelUrl = firstModel(markerModel, MARKER_MODELS[kind]);
      if (modelUrl) {
        const holder = new Group();
        holder.position.set(cx, baseY, cz);
        holder.userData['buildingId'] = b.id;
        this.markerGroup.add(holder);
        void this.swapInModel(modelUrl, holder, { targetHeight: big ? 1.0 : 0.75 });
        this.markers.push({
          obj: holder,
          baseY,
          baseScale: big ? 1.7 : 1.15,
          pulse: big,
          spin: true,
          kind,
          x: cx,
          z: cz,
        });
        continue;
      }

      const s = new Sprite(new SpriteMaterial({ map: this.markerTexture(kind), transparent: true, depthTest: false }));
      s.position.set(cx, baseY, cz);
      const baseScale = big ? 1.7 : 1.12;
      s.scale.setScalar(baseScale);
      s.userData['buildingId'] = b.id;
      s.renderOrder = 10;
      this.markerGroup.add(s);
      this.markers.push({ obj: s, baseY, baseScale, pulse: big, spin: false, kind, x: cx, z: cz });
    }
    const priority: Record<MarkerKind, number> = {
      activity: 0,
      problem: 1,
      construction: 2,
      upgrade: 3,
      need: 4,
      production: 5,
    };
    this.markers.sort((a, b) => priority[a.kind] - priority[b.kind]);
  }

  private animateMarkers(): void {
    if (this.markers.length === 0) return;
    const t = performance.now() / 1000;
    const viewDist = this.cam.getDist();
    const overview = viewDist > 150;
    const clustered = new Set<string>();
    for (const m of this.markers) {
      const clusterKey = `${Math.floor(m.x / 26)},${Math.floor(m.z / 26)}`;
      const essential = m.kind === 'activity' || m.kind === 'problem';
      const tooFar = this.camera.position.distanceTo(m.obj.position) > (essential ? 620 : 330);
      const duplicate = overview && clustered.has(clusterKey);
      m.obj.visible = !tooFar && !duplicate;
      if (!m.obj.visible) continue;
      if (overview) clustered.add(clusterKey);

      const distanceScale = MathUtils.clamp(viewDist / 95, 0.82, essential ? 1.45 : 1.22);
      m.obj.scale.setScalar(m.baseScale * distanceScale);
      if (m.pulse) {
        m.obj.position.y = m.baseY + Math.sin(t * 3) * 0.18;
        if (!m.spin) m.obj.scale.multiplyScalar(1 + Math.sin(t * 3) * 0.055);
      }
      if (m.spin) m.obj.rotation.y = t * 1.2;
    }
  }

  // ---- frame ----------------------------------------------------------------

  private frame(): void {
    if (this.destroyed || !this.renderer) return;
    const dt = Math.min(this.clock.getDelta(), 0.1);

    if (this.controller.version !== this.lastVersion) {
      this.lastVersion = this.controller.version;
      this.rebuildTerrainIfNeeded();
      this.rebuildBuildings();
      this.rebuildMarkers();
      this.updateMission();
    }

    // Advance camera: im Fahrmodus steuert das Fahrzeug die Verfolgerkamera,
    // sonst die normale Kamera-Eingabe (Tasten/Edge-Scroll).
    if (this.drive) this.updateDrive(dt);
    else this.input?.update(dt);
    this.cam.update(dt);
    this.writeCamera();

    // Living atmosphere: advance the day/night clock + ripple the water, and let
    // the lake pick up the current sky tint. Runs after the camera write so the
    // sky dome/sun follow the freshly-updated camera pose.
    this.env?.update(dt);
    this.waterTime.value += dt;
    if (this.waterMat && this.env) this.waterMat.color.copy(this.env.waterColor);

    for (const node of this.nodes.values()) {
      if (node.rotor) node.rotor.rotation.z += dt * 1.6;
    }
    this.animateSmoke(dt);
    this.animateCars(dt);
    this.animateAnimals(dt);
    this.animateMission(dt);
    this.animateMarkers();
    this.animateFog(dt);

    this.renderer.render(this.scene, this.camera);
  }

  // ---- housekeeping ---------------------------------------------------------

  private resizeObs: ResizeObserver | undefined;
  private observeResize(): void {
    const host = this.host;
    const r = this.renderer;
    if (!host || !r) return;
    const apply = () => {
      const w = host.clientWidth || 800;
      const h = host.clientHeight || 600;
      r.setSize(w, h);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    };
    apply();
    this.resizeObs = new ResizeObserver(apply);
    this.resizeObs.observe(host);
  }

  private disposeGroup(obj: TObject3D): void {
    obj.traverse((o) => {
      const mesh = o as Mesh;
      // Never dispose geometry/materials owned by a cached model — they are
      // shared with the cache and every future clone (see cacheOwned/loadModel).
      if (mesh.geometry && !cacheOwned.has(mesh.geometry)) mesh.geometry.dispose();
      const mat = (mesh as unknown as { material?: Material | Material[] }).material;
      if (Array.isArray(mat)) mat.forEach((m) => !cacheOwned.has(m) && m.dispose());
      else if (mat && !cacheOwned.has(mat)) mat.dispose();
    });
  }
}

/** How a dropped-in model is fitted into the world before use. Either scale so
 *  the footprint (max of x/z extent) spans `footprint` world units, or scale to a
 *  fixed `targetHeight`. The model is then centred on XZ with its base at y=0. */
interface FitOpts {
  footprint?: number;
  targetHeight?: number;
  scaleMul?: number;
  rotationY?: number;
  castShadow?: boolean;
}

/** Scale + centre a loaded model per FitOpts (mutates it). Rotation is applied
 *  before centring so 90°-rotated road/tile pieces still sit dead-centre. */
function fitObject(model: TObject3D, opts: FitOpts): void {
  const box = new Box3().setFromObject(model);
  const size = new Vector3();
  box.getSize(size);
  const mul = opts.scaleMul ?? 1;
  let scale = mul;
  if (opts.targetHeight) scale = (opts.targetHeight / (size.y || 1)) * mul;
  else if (opts.footprint) scale = (opts.footprint / (Math.max(size.x, size.z) || 1)) * mul;
  model.scale.setScalar(scale);
  if (opts.rotationY !== undefined) model.rotation.y = opts.rotationY;
  const box2 = new Box3().setFromObject(model);
  const c = new Vector3();
  box2.getCenter(c);
  model.position.x -= c.x;
  model.position.z -= c.z;
  model.position.y -= box2.min.y;
}

/** Return the first candidate name that resolves to a model URL, else undefined.
 *  Lets a category accept both a precise name and a short alias (drop-in ease). */
function firstModel(loader: (name: string) => string | undefined, names: readonly string[]): string | undefined {
  for (const n of names) {
    const url = loader(n);
    if (url) return url;
  }
  return undefined;
}

/** Lightweight procedural safety net for the three hand-placed scenic props. */
function makeScenicFallback(kind: keyof typeof SCENIC_PROP_MODELS): Group {
  const group = new Group();
  if (kind === 'boat') {
    const hull = new Mesh(
      new CylinderGeometry(0.28, 0.44, 1.35, 7),
      new MeshStandardMaterial({ color: 0x7d4b2c, roughness: 0.86 }),
    );
    hull.rotation.x = Math.PI / 2;
    hull.position.y = 0.22;
    const mast = new Mesh(
      new CylinderGeometry(0.025, 0.03, 1.05, 6),
      new MeshStandardMaterial({ color: 0x4d321e, roughness: 1 }),
    );
    mast.position.y = 0.77;
    const sail = new Mesh(
      new PlaneGeometry(0.55, 0.7),
      new MeshBasicMaterial({ color: 0xf0dfb3, side: DoubleSide }),
    );
    sail.position.set(0.28, 0.86, 0);
    group.add(hull, mast, sail);
  } else if (kind === 'windmill') {
    const tower = new Mesh(
      new CylinderGeometry(0.38, 0.58, 1.65, 9),
      new MeshStandardMaterial({ color: 0xb9aa8d, roughness: 1 }),
    );
    tower.position.y = 0.825;
    const roof = new Mesh(
      new ConeGeometry(0.56, 0.5, 9),
      new MeshStandardMaterial({ color: 0xa84832, roughness: 0.9 }),
    );
    roof.position.y = 1.9;
    const rotor = new Group();
    rotor.name = 'rotor';
    rotor.position.set(0, 1.52, 0.45);
    const bladeMat = new MeshStandardMaterial({ color: 0xe7d3a8, roughness: 0.9 });
    for (let i = 0; i < 4; i++) {
      const blade = new Mesh(new BoxGeometry(0.12, 1.12, 0.04), bladeMat);
      blade.position.y = 0.55;
      const arm = new Group();
      arm.rotation.z = (i * Math.PI) / 2;
      arm.add(blade);
      rotor.add(arm);
    }
    group.add(tower, roof, rotor);
  } else if (kind === 'lighthouse') {
    const tower = new Mesh(
      new CylinderGeometry(0.34, 0.58, 3.2, 12),
      new MeshStandardMaterial({ color: 0xe6ddcb, roughness: 0.88 }),
    );
    tower.position.y = 1.6;
    const stripe = new Mesh(
      new CylinderGeometry(0.46, 0.49, 0.42, 12),
      new MeshStandardMaterial({ color: 0xb63e34, roughness: 0.82 }),
    );
    stripe.position.y = 2.05;
    const lantern = new Mesh(
      new CylinderGeometry(0.34, 0.34, 0.42, 10),
      new MeshStandardMaterial({ color: 0x9eddf0, emissive: 0xffce66, emissiveIntensity: 0.45 }),
    );
    lantern.position.y = 3.46;
    const roof = new Mesh(
      new ConeGeometry(0.46, 0.42, 10),
      new MeshStandardMaterial({ color: 0x9e382f, roughness: 0.8 }),
    );
    roof.position.y = 3.88;
    group.add(tower, stripe, lantern, roof);
  } else if (kind === 'waterfall') {
    const rockMat = new MeshStandardMaterial({ color: 0x59636a, roughness: 1 });
    const waterMat = new MeshBasicMaterial({
      color: 0x72d7e3,
      transparent: true,
      opacity: 0.76,
      side: DoubleSide,
      depthWrite: false,
    });
    const rock = new Mesh(new BoxGeometry(1.65, 3.9, 0.72), rockMat);
    rock.position.set(0, 1.95, 0.28);
    rock.rotation.z = -0.08;
    const fall = new Mesh(new PlaneGeometry(0.72, 3.7, 2, 7), waterMat);
    fall.position.set(0.08, 2.02, -0.11);
    fall.rotation.z = 0.035;
    const pool = new Mesh(
      new CylinderGeometry(0.78, 0.92, 0.07, 18),
      new MeshStandardMaterial({
        color: 0x7ce0e8,
        emissive: 0x2a8b9a,
        emissiveIntensity: 0.16,
        transparent: true,
        opacity: 0.8,
      }),
    );
    pool.position.set(0.08, 0.04, -0.24);
    const mistMat = new MeshBasicMaterial({
      color: 0xe9fbff,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    });
    const mistA = new Mesh(new SphereGeometry(0.42, 8, 6), mistMat);
    const mistB = new Mesh(new SphereGeometry(0.3, 8, 6), mistMat);
    mistA.position.set(-0.18, 0.28, -0.3);
    mistB.position.set(0.4, 0.22, -0.25);
    group.add(rock, fall, pool, mistA, mistB);
  } else if (kind === 'desertSpire') {
    const sandstone = new MeshStandardMaterial({ color: 0xb95027, roughness: 1 });
    const base = new Mesh(new CylinderGeometry(1.1, 1.55, 1.4, 7), sandstone);
    base.position.y = 0.7;
    const middle = new Mesh(new CylinderGeometry(0.58, 0.92, 2.8, 6), sandstone);
    middle.position.set(0.12, 2.6, -0.08);
    middle.rotation.z = -0.08;
    const tip = new Mesh(new ConeGeometry(0.54, 2.2, 6), sandstone);
    tip.position.set(0.02, 5.0, -0.04);
    tip.rotation.z = 0.06;
    group.add(base, middle, tip);
  } else if (kind === 'swampTree' || kind === 'oldTree') {
    const wet = kind === 'swampTree';
    const wood = new MeshStandardMaterial({ color: wet ? 0x493d2d : 0x68482f, roughness: 1 });
    const crownMat = new MeshStandardMaterial({ color: wet ? 0x46543b : 0x567f42, roughness: 1 });
    const trunk = new Mesh(new CylinderGeometry(0.28, 0.52, wet ? 3.7 : 3.4, 7), wood);
    trunk.position.y = wet ? 1.85 : 1.7;
    trunk.rotation.z = wet ? 0.12 : -0.05;
    group.add(trunk);
    for (let i = 0; i < 5; i++) {
      const branch = new Mesh(new CylinderGeometry(0.08, 0.16, 1.6 + i * 0.12, 6), wood);
      branch.position.set((i - 2) * 0.13, 3.1 + (i % 2) * 0.24, 0);
      branch.rotation.z = (i - 2) * 0.29;
      group.add(branch);
      if (!wet || i % 2 === 0) {
        const crown = new Mesh(new SphereGeometry(0.72 + (i % 2) * 0.2, 8, 6), crownMat);
        crown.scale.y = 0.68;
        crown.position.set(branch.position.x + Math.sin(branch.rotation.z) * 0.8, 4.05 + (i % 2) * 0.35, 0);
        group.add(crown);
      }
    }
  } else if (kind === 'rockArch') {
    const stone = new MeshStandardMaterial({ color: 0x8f8b7d, roughness: 1 });
    const left = new Mesh(new BoxGeometry(0.9, 3.8, 1.25), stone);
    const right = new Mesh(new BoxGeometry(0.9, 3.4, 1.2), stone);
    const crown = new Mesh(new BoxGeometry(3.1, 0.95, 1.2), stone);
    left.position.set(-1.05, 1.9, 0);
    left.rotation.z = -0.09;
    right.position.set(1.05, 1.7, 0);
    right.rotation.z = 0.12;
    crown.position.set(0, 3.65, 0);
    crown.rotation.z = -0.05;
    group.add(left, right, crown);
  } else if (kind === 'ruin') {
    const stone = new MeshStandardMaterial({ color: 0x9b927c, roughness: 1 });
    const moss = new MeshStandardMaterial({ color: 0x61754a, roughness: 1 });
    for (let i = 0; i < 5; i++) {
      const h = 0.7 + hash01(`ruin${i}`) * 1.45;
      const wall = new Mesh(new BoxGeometry(0.32 + (i % 2) * 0.8, h, 0.28), stone);
      wall.position.set((i - 2) * 0.58, h / 2, (i % 2) * 0.45);
      wall.rotation.y = (i % 2) * Math.PI * 0.48;
      group.add(wall);
    }
    const overgrowth = new Mesh(new SphereGeometry(0.5, 7, 5), moss);
    overgrowth.scale.set(1.4, 0.28, 0.72);
    overgrowth.position.set(0.55, 0.18, 0.15);
    group.add(overgrowth);
  } else {
    const stone = new MeshStandardMaterial({ color: 0x78816f, roughness: 1 });
    const grass = new MeshStandardMaterial({ color: 0x4f7847, roughness: 1 });
    const base = new Mesh(new CylinderGeometry(1.45, 1.8, 0.62, 9), stone);
    base.position.y = 0.27;
    const mound = new Mesh(new CylinderGeometry(1.15, 1.46, 0.52, 9), grass);
    mound.position.y = 0.72;
    const tree = new Mesh(new ConeGeometry(0.48, 1.7, 7), grass);
    tree.position.y = 1.7;
    group.add(base, mound, tree);
  }
  group.traverse((object) => {
    if ((object as Mesh).isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  return group;
}

/** Real-world target heights (world units; 1 tile ≈ 4 m) for small decoration
 *  props. A dropped-in `.glb` for these ids is scaled to this height instead of
 *  being stretched to fill its tile — so a park bench stays bench-sized and a
 *  tree stays tree-sized. Extend when adding decoration ids. */
const DECO_TARGET_HEIGHT: Record<string, number> = {
  deco_tree: 1.7, // ~6–7 m tree
  deco_bench: 0.42, // ~1.7 m bench
  deco_flowerbed: 0.3, // low bed
  deco_fountain: 0.9, // ~3.5 m fountain
};

/** Correctly-proportioned procedural decoration per id (used when no model is
 *  dropped in). Sizes are in world units so nothing is tree-sized by accident. */
function decorationProc(id: string): Object3D[] {
  if (id === 'deco_bench') {
    const wood = new MeshStandardMaterial({ color: 0xa9713f, roughness: 0.8 });
    const legMat = new MeshStandardMaterial({ color: 0x5a4a3a });
    const seat = new Mesh(new BoxGeometry(0.7, 0.05, 0.26), wood);
    seat.position.y = 0.22;
    seat.castShadow = true;
    const back = new Mesh(new BoxGeometry(0.7, 0.22, 0.05), wood);
    back.position.set(0, 0.33, -0.1);
    const parts: Object3D[] = [seat, back];
    for (const sx of [-0.3, 0.3]) {
      const leg = new Mesh(new BoxGeometry(0.05, 0.22, 0.24), legMat);
      leg.position.set(sx, 0.11, 0);
      parts.push(leg);
    }
    return parts;
  }
  if (id === 'deco_flowerbed') {
    const soil = new Mesh(new CylinderGeometry(0.42, 0.42, 0.14, 12), new MeshStandardMaterial({ color: 0x7a4a25 }));
    soil.position.y = 0.07;
    const parts: Object3D[] = [soil];
    const cols = [0xe0503a, 0xffcf57, 0xc86bd6, 0x4a8fd6];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const f = new Mesh(new ConeGeometry(0.07, 0.16, 6), new MeshStandardMaterial({ color: cols[i % cols.length]! }));
      f.position.set(Math.cos(a) * 0.24, 0.22, Math.sin(a) * 0.24);
      parts.push(f);
    }
    return parts;
  }
  if (id === 'deco_fountain') {
    const basin = new Mesh(new CylinderGeometry(0.5, 0.55, 0.2, 16), new MeshStandardMaterial({ color: 0xb7bcc4, roughness: 0.9 }));
    basin.position.y = 0.1;
    basin.castShadow = true;
    const water = new Mesh(new CylinderGeometry(0.4, 0.4, 0.06, 16), new MeshStandardMaterial({ color: 0x3f9be0, roughness: 0.2, metalness: 0.3 }));
    water.position.y = 0.19;
    const stem = new Mesh(new CylinderGeometry(0.06, 0.08, 0.5, 8), new MeshStandardMaterial({ color: 0xaab3bf }));
    stem.position.y = 0.42;
    const top = new Mesh(new CylinderGeometry(0.18, 0.02, 0.08, 12), new MeshStandardMaterial({ color: 0x9aa3af }));
    top.position.y = 0.68;
    return [basin, water, stem, top];
  }
  // deco_tree / default: a small tree (trunk + layered crown), tree-proportioned.
  const trunk = new Mesh(new CylinderGeometry(0.08, 0.11, 0.6, 6), new MeshStandardMaterial({ color: 0x7a5230 }));
  trunk.position.y = 0.3;
  const crown = new Mesh(new ConeGeometry(0.5, 1.1, 8), new MeshStandardMaterial({ color: 0x3f8f45 }));
  crown.position.y = 1.05;
  crown.castShadow = true;
  const crown2 = new Mesh(new ConeGeometry(0.38, 0.8, 8), new MeshStandardMaterial({ color: 0x4c9a4e }));
  crown2.position.y = 1.45;
  crown2.castShadow = true;
  return [trunk, crown, crown2];
}

/**
 * § A7 — Bauernhof/Farm als lebendiges Areal: das Grundstück füllt sich mit
 * Feldern (Furchen), Zaun, Scheune und Silos, die mit der Ausbaustufe wachsen
 * (Bauernhof → Großfarm → Agrarkomplex). Ersetzt für die Farm das generische
 * Ensemble. Zentriert auf (0,0), Grundfläche = def.size (Weltkacheln).
 */
function farmProc(def: BuildingDef, upgradeLevel: number): Object3D[] {
  const W = def.size.w;
  const D = def.size.h;
  const stage = upgradeLevel; // 0 Bauernhof · 1 Großfarm · 2 Agrarkomplex
  const parts: Object3D[] = [];

  // Ackerboden als Basisplatte.
  const soil = new Mesh(new BoxGeometry(W * 0.96, 0.06, D * 0.96), new MeshStandardMaterial({ color: 0x6f5133, roughness: 1 }));
  soil.position.y = 0.03;
  soil.receiveShadow = true;
  parts.push(soil);

  // Felder als parallele Furchen (füllen die Fläche außer der Scheunen-Ecke).
  const cropCols = [0x7fae3f, 0x6b9a34, 0xa9b24a];
  const rows = Math.min(9, Math.round(D * 1.2));
  for (let i = 0; i < rows; i++) {
    const z = -D * 0.42 + (i / Math.max(1, rows - 1)) * D * 0.84;
    const furrow = new Mesh(
      new BoxGeometry(W * 0.82, 0.12 + (i % 2) * 0.05, D * 0.5 / rows),
      new MeshStandardMaterial({ color: cropCols[i % cropCols.length]!, roughness: 0.95 }),
    );
    furrow.position.set(-W * 0.05, 0.11, z);
    furrow.castShadow = false;
    parts.push(furrow);
  }

  // Scheune (rot, Satteldach) in der Ecke +x/−z.
  const barnH = 0.9 + stage * 0.35;
  const barnW = W * 0.3;
  const barnD = D * 0.3;
  const barnX = W * 0.3;
  const barnZ = -D * 0.3;
  const barn = new Mesh(new BoxGeometry(barnW, barnH, barnD), new MeshStandardMaterial({ color: 0xb23b2e, roughness: 0.7 }));
  barn.position.set(barnX, 0.06 + barnH / 2, barnZ);
  barn.castShadow = true;
  barn.receiveShadow = true;
  parts.push(barn);
  const roof = new Mesh(new ConeGeometry(barnW * 0.78, barnH * 0.6, 4), new MeshStandardMaterial({ color: 0x6b2b22, roughness: 0.8 }));
  roof.rotation.y = Math.PI / 4;
  roof.position.set(barnX, 0.06 + barnH + barnH * 0.28, barnZ);
  roof.castShadow = true;
  parts.push(roof);

  // Silos (metallisch, Kegeldach) — Anzahl/Höhe wachsen mit der Stufe.
  const siloCount = 1 + stage;
  const siloMat = new MeshStandardMaterial({ color: 0xb9c0c8, roughness: 0.45, metalness: 0.35 });
  const siloTopMat = new MeshStandardMaterial({ color: 0x8b939c, roughness: 0.5, metalness: 0.3 });
  for (let i = 0; i < siloCount; i++) {
    const sh = 1.2 + stage * 0.35;
    const r = 0.26;
    const sx = W * 0.06 - i * (r * 2.4);
    const sz = -D * 0.34;
    const silo = new Mesh(new CylinderGeometry(r, r, sh, 12), siloMat);
    silo.position.set(sx, 0.06 + sh / 2, sz);
    silo.castShadow = true;
    parts.push(silo);
    const cap = new Mesh(new ConeGeometry(r * 1.05, r * 0.9, 12), siloTopMat);
    cap.position.set(sx, 0.06 + sh + r * 0.4, sz);
    parts.push(cap);
  }

  // Zaun ringsum: dünne Pfosten + Riegel entlang der vier Kanten.
  const fenceMat = new MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.85 });
  const half = { x: W * 0.47, z: D * 0.47 };
  const railY = 0.22;
  const addRail = (len: number, x: number, z: number, horizontal: boolean): void => {
    const rail = new Mesh(new BoxGeometry(horizontal ? len : 0.05, 0.05, horizontal ? 0.05 : len), fenceMat);
    rail.position.set(x, railY, z);
    parts.push(rail);
  };
  addRail(W * 0.94, 0, -half.z, true);
  addRail(W * 0.94, 0, half.z, true);
  addRail(D * 0.94, -half.x, 0, false);
  addRail(D * 0.94, half.x, 0, false);
  const posts = Math.max(3, Math.round(W / 1.4));
  for (let i = 0; i <= posts; i++) {
    const fx = -half.x + (i / posts) * W * 0.94;
    for (const fz of [-half.z, half.z]) {
      const post = new Mesh(new BoxGeometry(0.07, 0.4, 0.07), fenceMat);
      post.position.set(fx, 0.2, fz);
      parts.push(post);
    }
  }
  return parts;
}

/** § A7 — einfaches Weidetier (Kuh/Schaf/Huhn) als Fallback-Mesh. Front +z. */
function makeAnimalMesh(kind: 'cow' | 'sheep' | 'chicken'): Group {
  const g = new Group();
  const mk = (color: number, rough = 0.85): MeshStandardMaterial => new MeshStandardMaterial({ color, roughness: rough });
  if (kind === 'chicken') {
    const body = new Mesh(new BoxGeometry(0.12, 0.12, 0.16), mk(0xf2ede4));
    body.position.y = 0.1;
    body.castShadow = true;
    const head = new Mesh(new BoxGeometry(0.08, 0.09, 0.08), mk(0xf2ede4));
    head.position.set(0, 0.19, 0.08);
    const comb = new Mesh(new BoxGeometry(0.03, 0.04, 0.05), mk(0xd23b2e));
    comb.position.set(0, 0.25, 0.08);
    g.add(body, head, comb);
    return g;
  }
  const bodyColor = kind === 'cow' ? 0x4a3a30 : 0xe8e4dc;
  const body = new Mesh(new BoxGeometry(0.2, 0.16, 0.34), mk(bodyColor));
  body.position.y = 0.2;
  body.castShadow = true;
  const head = new Mesh(new BoxGeometry(0.13, 0.12, 0.13), mk(bodyColor));
  head.position.set(0, 0.24, 0.2);
  g.add(body, head);
  if (kind === 'cow') {
    // ein paar helle Flecken
    const patch = new Mesh(new BoxGeometry(0.205, 0.02, 0.14), mk(0xe9e2d6));
    patch.position.set(0, 0.28, -0.02);
    g.add(patch);
  }
  const legMat = mk(kind === 'cow' ? 0x2f2620 : 0xcfc7ba);
  for (const lx of [-0.07, 0.07]) {
    for (const lz of [-0.11, 0.11]) {
      const leg = new Mesh(new BoxGeometry(0.04, 0.14, 0.04), legMat);
      leg.position.set(lx, 0.07, lz);
      g.add(leg);
    }
  }
  return g;
}

const CAR_COLORS = [0xd94f4f, 0x4f7fd9, 0xe0b03a, 0xf2f2f2, 0x5fb35f, 0x333a44];

/** A small shaped car (body + cabin + tinted windows) — clearer than a bare box.
 *  A real `vehicles/car.glb` can replace this later via vehicleModel(). */
function makeCarMesh(): Group {
  const g = new Group();
  const color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)]!;
  const body = new Mesh(new BoxGeometry(0.32, 0.16, 0.52), new MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.2 }));
  body.position.y = 0.08;
  body.castShadow = true;
  const cabin = new Mesh(new BoxGeometry(0.28, 0.14, 0.28), new MeshStandardMaterial({ color: 0x223042, roughness: 0.3 }));
  cabin.position.set(0, 0.2, -0.02);
  g.add(body, cabin);
  return g;
}

// ---- § A6 Fahrmodus: Konstanten + Fahrzeug/Zielpfeil-Fallbacks --------------

const ANIMAL_CAP = 48; // § A7: Obergrenze aller Weidetiere (Draw-Call-Budget)
const DRIVE_KEYS: ReadonlySet<string> = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);
const DRIVE_ACCEL = 6.5; // Welt-Einheiten/s² (Tiles/s²)
const DRIVE_MAX_SPEED = 5.5; // Tiles/s
const DRIVE_STEER = 2.6; // rad/s bei voller Fahrt
const DRIVE_CAM_DIST = 8.5;
const DRIVE_CAM_PITCH = 0.64; // rad über der Horizontalen (Verfolgerblick von schräg oben)

/** Prozedurales, deutlich unterscheidbares Missionsfahrzeug je Typ (Fallback,
 *  bis ein GLB eingelegt wird). Front zeigt nach +z (wie alle Fahrzeuge hier). */
function makeMissionVehicle(vehicle: string | undefined): Group {
  const g = new Group();
  const paint = (color: number, rough = 0.5): MeshStandardMaterial => new MeshStandardMaterial({ color, roughness: rough, metalness: 0.15 });
  const addBox = (w: number, hgt: number, l: number, x: number, y: number, z: number, mat: MeshStandardMaterial): Mesh => {
    const m = new Mesh(new BoxGeometry(w, hgt, l), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    g.add(m);
    return m;
  };
  const beacon = (color: number, emissive: number): void => {
    const bar = addBox(0.34, 0.07, 0.14, 0, 0.4, 0.06, new MeshStandardMaterial({ color, emissive, emissiveIntensity: 1.1, roughness: 0.4 }));
    bar.castShadow = false;
  };
  switch (vehicle) {
    case 'medium_truck': {
      addBox(0.48, 0.34, 0.72, 0, 0.22, -0.12, paint(0x245c9b));
      addBox(0.46, 0.3, 0.3, 0, 0.2, 0.39, paint(0x3176bd));
      addBox(0.5, 0.06, 0.58, 0, 0.2, -0.12, paint(0xd8a331));
      break;
    }
    case 'large_truck': {
      addBox(0.54, 0.42, 0.92, 0, 0.26, -0.16, paint(0xa92e25));
      addBox(0.52, 0.36, 0.34, 0, 0.23, 0.48, paint(0xd44535));
      addBox(0.56, 0.07, 0.72, 0, 0.23, -0.14, paint(0x303840));
      break;
    }
    case 'refrigerated_truck': {
      addBox(0.48, 0.38, 0.78, 0, 0.24, -0.12, paint(0xf2f5f5, 0.35));
      addBox(0.46, 0.3, 0.3, 0, 0.2, 0.41, paint(0xe8eeee, 0.35));
      addBox(0.34, 0.12, 0.13, 0, 0.47, 0.12, paint(0x7fd6e7));
      addBox(0.5, 0.055, 0.6, 0, 0.22, -0.13, paint(0x42b9ce));
      break;
    }
    case 'heavy_transporter': {
      addBox(0.54, 0.36, 0.34, 0, 0.22, 0.46, paint(0xd87916));
      addBox(0.58, 0.1, 0.98, 0, 0.1, -0.2, paint(0x343a40));
      addBox(0.44, 0.34, 0.46, 0, 0.3, -0.25, paint(0xc9a76c));
      beacon(0xffb52a, 0xef8e00);
      break;
    }
    case 'fire_truck': {
      addBox(0.46, 0.32, 0.9, 0, 0.2, -0.05, paint(0xc62828)); // roter Aufbau
      addBox(0.46, 0.26, 0.28, 0, 0.17, 0.38, paint(0x8e1f1f)); // Kabine
      addBox(0.5, 0.05, 0.5, 0, 0.24, -0.1, paint(0xf2f2f2)); // weißer Streifen
      beacon(0xff5252, 0xff2a2a);
      break;
    }
    case 'police_car': {
      addBox(0.4, 0.2, 0.78, 0, 0.13, 0, paint(0xf4f4f4)); // weiße Karosse
      addBox(0.36, 0.16, 0.3, 0, 0.26, -0.02, paint(0x1f2c46)); // Dach/Kabine
      addBox(0.42, 0.06, 0.42, 0, 0.13, 0, paint(0x1c3f7a)); // blauer Seitenstreifen
      beacon(0x2f6bff, 0x1e4fd0);
      break;
    }
    case 'logging_truck': {
      addBox(0.42, 0.28, 0.3, 0, 0.18, 0.34, paint(0x2f6d3a)); // grüne Zugmaschine
      addBox(0.44, 0.14, 0.62, 0, 0.12, -0.18, paint(0x3a2a1c)); // Ladefläche
      addBox(0.14, 0.16, 0.56, -0.12, 0.26, -0.18, paint(0x6b4a2a)); // Stamm
      addBox(0.14, 0.16, 0.56, 0.12, 0.26, -0.18, paint(0x7a5632)); // Stamm
      break;
    }
    case 'flatbed': {
      addBox(0.42, 0.28, 0.3, 0, 0.18, 0.34, paint(0xcf8b2a)); // orange Zugmaschine
      addBox(0.46, 0.1, 0.66, 0, 0.1, -0.16, paint(0x4a4f57)); // Pritsche
      addBox(0.34, 0.22, 0.34, 0, 0.24, -0.16, paint(0xb0793a)); // Materialkiste
      break;
    }
    default: {
      // van: weißer Kastenwagen (wie die ambiente Lieferung, etwas größer).
      addBox(0.44, 0.34, 0.72, 0, 0.2, -0.03, paint(0xf2f2f2));
      addBox(0.44, 0.24, 0.22, 0, 0.16, 0.34, paint(0xe0a03a));
      addBox(0.46, 0.06, 0.44, 0, 0.24, -0.06, paint(0xe0a03a));
    }
  }
  return g;
}

/** Schwebender Richtungspfeil über dem Fahrzeug (zeigt nach +z, Gruppe wird
 *  per rotation.y aufs nächste Ziel gedreht). Bright + emissiv, gut sichtbar. */
function makeDriveArrow(): Group {
  const g = new Group();
  const mat = new MeshStandardMaterial({ color: 0xffd23f, emissive: 0xffb300, emissiveIntensity: 0.9, roughness: 0.4 });
  const cone = new Mesh(new ConeGeometry(0.22, 0.5, 4), mat);
  cone.rotation.x = Math.PI / 2; // Spitze zeigt nach +z
  g.add(cone);
  return g;
}

/** Road-type hierarchy (§3, prepared): the current `road` maps to a residential
 *  street; future ids (road_main, road_wide, …) slot in here without renderer
 *  changes. `half` = asphalt half-width; surface colour/texture is shared
 *  (getRoadMats) rather than per-class since only `residential` is placeable
 *  today (see docs/ROAD_TEXTURES.md). */
export type RoadClass = 'residential' | 'main' | 'wide' | 'industrial' | 'boulevard';
const ROAD_SPECS: Record<RoadClass, { half: number; centerline: boolean }> = {
  residential: { half: 0.3, centerline: false },
  main: { half: 0.37, centerline: true },
  wide: { half: 0.43, centerline: true },
  industrial: { half: 0.4, centerline: false },
  boulevard: { half: 0.45, centerline: true },
};
function roadClassFor(defId: string): RoadClass {
  if (defId.includes('boulevard') || defId.includes('allee')) return 'boulevard';
  if (defId.includes('wide') || defId.includes('breit')) return 'wide';
  if (defId.includes('main') || defId.includes('haupt')) return 'main';
  if (defId.includes('industrial') || defId.includes('zufahrt')) return 'industrial';
  return 'residential';
}

type MarkerKind = 'activity' | 'construction' | 'problem' | 'upgrade' | 'need' | 'production';


const MARKER_STYLE: Record<
  MarkerKind,
  { color: string; glyph: 'exclaim' | 'up' | 'wrench' | 'box' | 'heart' | 'factory' }
> = {
  activity: { color: '#2fd4d4', glyph: 'box' },
  construction: { color: '#f2c14e', glyph: 'wrench' },
  problem: { color: '#e5533b', glyph: 'exclaim' },
  upgrade: { color: '#e7ab36', glyph: 'up' },
  need: { color: '#43a5d4', glyph: 'heart' },
  production: { color: '#5fbf62', glyph: 'factory' },
};

/** A compact colour-coded speech bubble with a dark civic outline. */
function makeMarkerTexture(kind: MarkerKind): CanvasTexture {
  const size = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const st = MARKER_STYLE[kind];
  if (ctx) {
    ctx.translate(size / 2, size / 2);
    // Rounded civic bubble + short tail; the dark outline avoids the old field
    // of bright white arrows while retaining contrast over the landscape.
    ctx.fillStyle = st.color;
    ctx.strokeStyle = '#071824';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.roundRect(-43, -43, 86, 66, 24);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-11, 20);
    ctx.lineTo(12, 20);
    ctx.lineTo(0, 39);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Glyph.
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    if (st.glyph === 'exclaim') {
      ctx.fillRect(-5, -34, 10, 26);
      ctx.beginPath();
      ctx.arc(0, -0, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (st.glyph === 'up') {
      ctx.beginPath();
      ctx.moveTo(0, -36);
      ctx.lineTo(18, -12);
      ctx.lineTo(-18, -12);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-6, -14, 12, 16);
    } else if (st.glyph === 'wrench') {
      ctx.beginPath();
      ctx.moveTo(-16, -30);
      ctx.lineTo(12, -2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-16, -30, 8, 0, Math.PI * 2);
      ctx.stroke();
    } else if (st.glyph === 'box') {
      // box / delivery target
      ctx.strokeRect(-16, -32, 32, 26);
      ctx.beginPath();
      ctx.moveTo(-16, -22);
      ctx.lineTo(16, -22);
      ctx.stroke();
    } else if (st.glyph === 'heart') {
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.bezierCurveTo(-28, -14, -22, -38, 0, -25);
      ctx.bezierCurveTo(22, -38, 28, -14, 0, 2);
      ctx.fill();
    } else {
      ctx.fillRect(-24, -7, 48, 12);
      ctx.fillRect(-19, -26, 10, 19);
      ctx.fillRect(-3, -34, 10, 27);
      ctx.fillRect(13, -22, 10, 15);
    }
  }
  return new CanvasTexture(cv);
}

