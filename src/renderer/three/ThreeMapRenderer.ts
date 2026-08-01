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
  AdditiveBlending,
  Box3,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Clock,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshStandardMaterial,
  MirroredRepeatWrapping,
  NoColorSpace,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  RepeatWrapping,
  Scene,
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
import {
  SPLAT_BANDS,
  terrainHeightAt,
  terrainMinHeightAround,
  TERRAIN_MAX_Y,
  TERRAIN_MIN_Y,
  WATER_LEVEL,
} from './terrainHeight.ts';
import { raycastHeightfield } from './terrainPicking.ts';
import { blendedVisualSplat, blendedVisualTint, regionVisualProfile } from './worldVisualProfiles.ts';
import {
  REGION_DETAIL_PROP_BUDGET,
  selectPropTiles,
  spatialPropChunks,
  starterNatureFrame,
} from './vegetationBudget.ts';
import {
  collectRegionNature,
  emptyPlacement,
  type NatureInstance,
} from './natureDistribution.ts';
import { NATURE_KINDS, type NatureKind } from './natureZones.ts';
import {
  buildNatureMass,
  hasNatureGeometry,
  natureSharedResources,
  type NatureLodEntry,
} from './natureRenderer.ts';
import {
  appendRoadDiscTriangles,
  appendRoadRibbonTriangles,
  appendVariableRibbonTriangles,
  roadTileEdgeConnector,
  roundedRoadPolyline,
} from './roadSurfaceGeometry.ts';
import {
  marchingShoreSegments,
  smoothShoreChain,
  traceShoreChains,
} from './shorelineGeometry.ts';
import { CameraController3D } from './CameraController3D.ts';
import { deriveCityFrame } from './cityFraming.ts';
import { CameraInputController, type CameraInputHost } from './CameraInputController.ts';
import { worldCameraBounds, type CameraPreset } from './CameraConfig.ts';
import {
  createStylizedVehicleFallback,
  createStylizedVehicleGeometry,
  createStylizedVehicleMaterial,
} from './vehicleFallback.ts';
import { getCameraSettings } from './cameraSettings.ts';
import { getEnvironmentSettings } from './environmentSettings.ts';
import { sunElevation } from './environment.ts';
import { getGraphicsProfile, subscribeGraphicsSettings } from './graphicsSettings.ts';
import { scaledBudget, type GraphicsProfile } from './graphicsQuality.ts';
import { setPerfStats } from './perfStats.ts';
import type { GameController } from '../../game/commands/controller.ts';
import type { BuildingDef } from '../../game/config/types.ts';
import type { BuildingInstance, TerrainType } from '../../game/types.ts';
import { regionOfTile, samplePlacementSurface, worldTerrainAt } from '../../game/map/world.ts';
import {
  BAKED_REGIONS,
  WORLD_TILES,
  regionBounds,
  regionIdAt,
  startRegionConfig,
} from '../../game/config/startRegion.config.ts';
import { oceanDepthGrid, shoreTypeGrid, waterfrontBuildableGrid } from './worldMasks.gen.ts';
import { validatePlacement } from '../../game/buildings/placement.ts';
import { plinthDepthFor } from '../../game/buildings/terrainFit.ts';
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

} from '../../assets/registry.ts';
import {
  TERRAIN_TILE_MODELS,
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
import type {
  IMapRenderer,
  InfoLayerMode,
  InfrastructureLayerMode,
  RendererCallbacks,
  RoadPlanOverlayTile,
  WorkAreaOverlay,
  WorldRevealState,
} from '../IMapRenderer.ts';
import { t } from '../../i18n/index.ts';

const MAX_SMOKE = 40;
const MAX_CARS = 10;
/** Straßendecke liegt knapp über dem Terrain; Fahrzeuge stehen mit ihrem
 * integrierten Kontaktschatten darauf statt wie zuvor 0,3 Kacheln zu schweben. */
const VEHICLE_ROAD_CLEARANCE = 0.065;

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
const FOUNDATION_MATERIAL = new MeshStandardMaterial({ color: 0x756b58, roughness: 0.96, metalness: 0 });
cacheOwned.add(FOUNDATION_MATERIAL);

/**
 * Einheitliches Cartoon-Finish für Drop-in-Modelle. Die Geometrie und Texturen
 * bleiben unangetastet; nur die gemeinsamen PBR-Materialparameter werden einmal
 * beim Laden auf die helle, matte Miniaturwelt-Art-Direction kalibriert.
 */
function stylizeModelMaterial(material: Material): void {
  if (!(material instanceof MeshStandardMaterial)) return;
  const role = material.name.toLowerCase();
  const preserveSurface =
    material.transparent ||
    role.includes('glass') ||
    role.includes('window') ||
    role.includes('water') ||
    role.includes('light') ||
    role.includes('emiss');

  if (!preserveSurface) {
    const hsl = { h: 0, s: 0, l: 0 };
    material.color.getHSL(hsl);
    material.color.setHSL(
      hsl.h,
      MathUtils.clamp(hsl.s * 1.12 + 0.035, 0, 0.9),
      MathUtils.clamp(hsl.l * 1.08 + 0.035, 0.08, 0.92),
    );
    material.roughness = Math.max(material.roughness, 0.72);
    material.metalness = Math.min(material.metalness, 0.16);
    material.flatShading = true;
  }
  material.needsUpdate = true;
}

function loadModel(url: string): Promise<TObject3D> {
  let p = modelCache.get(url);
  if (!p) {
    p = gltfLoader.loadAsync(url).then((g) => {
      g.scene.traverse((o) => {
        const m = o as Mesh;
        if (m.geometry) cacheOwned.add(m.geometry);
        const mat = (m as unknown as { material?: Material | Material[] }).material;
        if (Array.isArray(mat)) {
          mat.forEach((x) => {
            stylizeModelMaterial(x);
            cacheOwned.add(x);
          });
        } else if (mat) {
          stylizeModelMaterial(mat);
          cacheOwned.add(mat);
        }
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
/** 512/64 = 8×8 cullbare Terrain-Chunks; Regions-Unlock baut nur betroffene
 * Chunks neu. */
const GROUND_CHUNK = 64;

// § Welt lädt vollständig (v1.24) — KENNZEICHNUNG GESPERRTER GEBIETE.
//
// Bis v1.23 verdeckte eine blickdichte Wolkenwand jede gesperrte Region. Damit
// war die halbe Insel unsichtbar: Der Spieler konnte weder sehen, wohin er
// expandieren würde, noch die Landschaft genießen, für die die Welt gebaut ist.
// Jetzt lädt und zeigt die Welt vollständig; gesperrtes Land wird stattdessen
// ENTSÄTTIGT und trägt weiterhin seinen Schloss-Marker mit Name und Level.
//
// Die Werte sind bewusst getrennt: Entsättigung trägt die Aussage, die
// Abdunklung setzt sie nur leicht ab. Zu viel Abdunklung ließ die Übersicht
// wieder unfertig wirken — genau das Problem, das die frühere Dimmung hatte.
/** Anteil, um den gesperrtes Land in Richtung Graustufe gezogen wird. */
const LOCKED_DESATURATION = 0.7;
/** Zusätzliche Abdunklung gesperrten Landes. */
const LOCKED_DARKENING = 0.16;
/**
 * Vegetationsdichte gesperrter Regionen. Ausdünnen statt verstecken: die
 * Landschaft bleibt lesbar, kostet aber nur einen Bruchteil der Instanzen —
 * ohne das würde ein frisches Spiel statt ~1.400 sofort ~48.800 Props aufbauen.
 * Beim Freischalten füllt sich die Region auf; bereits stehende Props behalten
 * dabei Position und Größe (der Auswahl-Hash ist positionsstabil, §16).
 */
const LOCKED_VEGETATION_DENSITY = 0.5;

/** One world unit of ground = this many texture repeats, so a 1254px "nah"-detail
 *  photo reads as close-up ground rather than a stretched smear. */
const SPLAT_TILE_SCALE = 0.065;
// § A3 (Welt 2.0): Biom-gewichteter Splat. grass/stone/cliff/mountain/snow
// kommen aus Höhe & Hang, forest/farm/sand aus dem Biom-Vertex-Attribut (aus
// dem gebackenen Terrain-Grid). Jede Textur ist Drop-in — fehlt sie, blendet
// die Ebene sauber auf die stilisierte Vertex-Farbe zurück (nie kaputt).
const SPLAT_LAYERS = [
  { key: 'grass', texture: 'grass_meadow_cartoon', triplanar: false },
  { key: 'forest', texture: 'forest_floor_cartoon', triplanar: false },
  { key: 'farm', texture: 'fertile_valley_ground', triplanar: false },
  { key: 'dry', texture: 'dry_steppe', triplanar: false },
  { key: 'desert', texture: 'desert_sand_red', triplanar: false },
  { key: 'swamp', texture: 'swamp_mud', triplanar: false },
  { key: 'coast', texture: 'coast_sand_cartoon', triplanar: false },
  { key: 'cliff', texture: 'mountain_cliff_cartoon', triplanar: true },
  { key: 'mountain', texture: 'mountain_cliff_cartoon', triplanar: true },
  { key: 'ridge', texture: 'mountain_strata', triplanar: true },
  { key: 'snow', texture: 'mountain_snow', triplanar: false },
] as const;

// Die aktive Cartoon-Art-Direction lebt von breiten Albedo-/Vertexformen.
// Foto-Normalen und altes Wald-AO legten erneut feines Rauschen und doppelte
// Lichtführung darüber; Detailmaps bleiben deshalb als Drop-in-System
// vorbereitet, im verbindlichen Cartoon-Profil aber bewusst leer.
const SPLAT_DETAILS: Record<string, string> = {};

/** Loads (and caches, by URL) any drop-in texture — shared by the terrain splat
 *  layers and the road/bridge surfaces below, so the same file is never fetched
 *  twice even if both systems reference it (e.g. `terrain_road_edge`). */
function loadTextureByUrl(url: string, srgb = true): Promise<Texture> {
  let p = textureCache.get(url);
  if (!p) {
    p = textureLoader.loadAsync(url).then((tex) => {
      // Gespiegelte Wiederholung hält die breiten gemalten Cartoon-Flächen an
      // jeder Kachelgrenze stetig, selbst wenn ein Drop-in-Bild nicht pixelgenau
      // an seiner gegenüberliegenden Kante endet.
      const mirroredCartoon = /(?:grass_meadow_cartoon|forest_floor_cartoon|mountain_cliff_cartoon|coast_sand_cartoon|road_path_cartoon)/.test(url);
      tex.wrapS = mirroredCartoon ? MirroredRepeatWrapping : RepeatWrapping;
      tex.wrapT = mirroredCartoon ? MirroredRepeatWrapping : RepeatWrapping;
      tex.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
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
  /** Helle prozedurale Hauptstraße ohne unpassende Foto-UVs. */
  groundPath: MeshStandardMaterial;
  /** Breiter heller Rand/Bankett, damit die Straße sich vom Terrain absetzt. */
  groundShoulder: MeshStandardMaterial;
  asphalt: MeshStandardMaterial;
  mountain: MeshStandardMaterial;
  edge: MeshStandardMaterial;
  dash: MeshStandardMaterial;
  roundabout: MeshStandardMaterial;
  bridgeDeck: MeshStandardMaterial;
  boardwalk: MeshStandardMaterial;
  // § A5 Straßen-Redesign: heller Gehweg-Beton.
  sidewalk: MeshStandardMaterial;
}

function loadSplatDataTexture(name: string): Promise<Texture> | undefined {
  const url = terrainTextureUrl(name);
  return url ? loadTextureByUrl(url, false) : undefined;
}

/** Ruhezustand des Regionsmarkers: kompaktes Schloss ohne Text (§10). */
const LOCKED_REGION_ICON_SCALE: [number, number, number] = [3.2, 3.2, 1];
/** Hover-/Freischaltzustand: volles Banner mit Name und Level (§10). */
const LOCKED_REGION_LABEL_SCALE: [number, number, number] = [10, 3.75, 1];

interface LockedRegionMarker {
  group: Group;
  mats: { mat: MeshStandardMaterial | SpriteMaterial; base: number }[];
  marker: Sprite;
  /** Voller Marker mit Name + Level — nur bei Hover/Freischaltung (§10). */
  markerTexture: CanvasTexture;
  /** Kompaktes Schloss ohne Text — der Ruhezustand (§10). */
  iconTexture: CanvasTexture;
  /** Zeigt der Marker aktuell den vollen Namen? */
  labelled: boolean;
  fading: number;
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
  private groundWetness = { value: 0 };
  private waterMat: MeshStandardMaterial | undefined;
  // Shared road/bridge surface materials (§ Straßen als Textur), built once on
  // first use and textured in-place as drop-in files resolve (see getRoadMats).
  private roadMats: RoadMaterials | undefined;

  private buildingGroup = new Group();
  /** Zusammenhängende, geglättete Darstellung des bestehenden Kachel-
   * Straßennetzes. Die Simulation bleibt unverändert rasterbasiert; nur die
   * sichtbare Fahrbahn wird aus denselben belegten Kacheln als zwei gebündelte
   * Meshes (Bankett + Asphalt) aufgebaut. */
  private roadSurfaceGroup = new Group();
  private roadSurfaceKey = '';
  /** Rein visuelle Stützen der vorhandenen Höhenstraße. Die Straße bleibt ein
   * normales Building/Command; diese Gruppe bündelt nur Pfeiler und Querträger
   * in zwei InstancedMeshes, statt pro Kachel neue Draw-Calls zu erzeugen. */
  private roadSupportGroup = new Group();
  private roadSupportKey = '';
  /** Straßenmöblierung als gebündelter Nachtlicht-Pass. Lichtköpfe und kleine
   * Bodenreflexe sitzen an derselben, terrainabgetasteten Mastposition. Es gibt
   * bewusst keine frei geschätzten Fassadenfenster mehr. */
  private cityLightGroup = new Group();
  private streetLampHeadMesh: InstancedMesh | undefined;
  private streetGlowMesh: InstancedMesh | undefined;
  private cityLightKey = '';
  private terrainGroup = new Group();
  // Chunk-Boden (§ MVP4 P3): persistente Gruppe + Cache — bei Sektor-Unlock
  // werden nur die betroffenen Chunks neu gebaut, nie das ganze Inselmesh.
  private groundChunkGroup = new Group();
  private groundChunks = new Map<string, { mesh: Mesh; sig: string }>();
  private oceanBuilt = false;
  private oceanGroup = new Group();
  // Blickdichte Regions-Wolkenwand (§ Welt 2.0 / A3): ein instanziertes Volumen
  // plus Schloss-/Level-Marker je gesperrter Region; Unlock startet die
  // bestehende Aufdeck-Animation.
  private lockedMarkerGroup = new Group();
  private lockedMarkers = new Map<number, LockedRegionMarker>();
  private worldReveal: WorldRevealState = {
    fogDisabled: false,
    revealLockedRegionsVisually: false,
    unlockAllRegionsGameplay: false,
  };
  private vegetationGroup = new Group();
  /** Vegetation gesperrter Regionen — eigener Aufbau, eigener Schlüssel. */
  private lockedVegetationGroup = new Group();
  private lockedVegetationLod: NatureLodEntry[] = [];
  private lockedVegKey = '';
  private nearVegetation: Object3D[] = [];
  private vegetationDistanceLod: {
    object: Object3D;
    centerX: number;
    centerZ: number;
    maxDistance: number;
  }[] = [];
  /** § Säule B: beim letzten Vegetationsaufbau verwendetes Qualitätsprofil —
   *  steuert Sichtweiten/Nahdetail im Frame und speist das Dev-Performance-Panel. */
  private activeVegProfile: GraphicsProfile = getGraphicsProfile();
  private unsubGraphics: (() => void) | undefined;
  private liveGroup = new Group();
  // § Active Operations 2.0: additive, gepoolte Betriebsarbeiter. Positionen
  // stammen aus der Simulation (getWorkerRenderStates); der Renderer besitzt
  // KEINE Logik — er zeichnet nur die Sim-Tile-Positionen (CLAUDE.md §1).
  private workerGroup = new Group();
  private workerPool: Group[] = [];
  private workerAssets?: {
    body: CylinderGeometry;
    head: SphereGeometry;
    matWork: MeshStandardMaterial;
    matCarry: MeshStandardMaterial;
  };
  // § Active Operations 2.0, A5: additive, gepoolte Transportfahrzeuge. Position
  // kommt aus der Simulation (getTransferRenderStates); der Renderer besitzt
  // keine Logik — er interpoliert nur die Sim-Position entlang der Route (§1).
  private vehicleGroup = new Group();
  private vehiclePool: Group[] = [];
  private vehicleAssets?: {
    geometry: BufferGeometry;
    mat: MeshStandardMaterial;
  };
  private vehicleLastPos = new Map<string, { x: number; z: number }>();
  private overlayGroup = new Group();
  /** Planungslayer bleiben getrennt vom Ghost und können ohne Welt-Rebuild
   * aktualisiert/entsorgt werden. Je Layer entstehen nur wenige Draw-Calls. */
  private workAreaOverlayGroup = new Group();
  private roadPlanOverlayGroup = new Group();
  private infrastructureOverlayGroup = new Group();
  /** Generisches, terrainfolgendes Versorgungsradius-Overlay. Die Daten kommen
   * ausschließlich aus GameController.getCoverageOverlay(). */
  private coverageOverlayGroup = new Group();
  private coverageOverlayKey = '';
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
  private infrastructureLayerMode: InfrastructureLayerMode = 'off';
  private lastHoverKey = '';
  private workAreaOverlay: WorkAreaOverlay | undefined;
  private workAreaOverlayKey = '';
  private workAreaHoverNodeId: string | undefined;

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
    // § Säule B: die Qualitätsstufe deckelt die Renderauflösung zusätzlich zur
    // adaptiven 4K-Grenze — „Niedrig" rendert bei 1× auch auf HiDPI-Displays.
    const viewportPixels = window.innerWidth * window.innerHeight;
    const adaptiveCap = viewportPixels > 2_000_000 ? 1.25 : 1.5;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, adaptiveCap, getGraphicsProfile().pixelRatioCap));
    renderer.setSize(host.clientWidth || 800, host.clientHeight || 600);
    renderer.shadowMap.enabled = true;
    // Premium look (§ MVP3 Phase 2 — Atmosphäre & Licht): filmic ACES tone mapping
    // rolls bright sky/sun highlights off softly instead of clipping to flat white,
    // giving the warm, high-quality feel of Manor Lords / Foundation instead of the
    // hard "test render" look. Soft (PCF) shadows drop the jagged shadow edges the
    // new terraced terrain would otherwise show. Exposure is tuned in tandem with
    // the day/night grade in environment.ts.
    renderer.toneMapping = ACESFilmicToneMapping;
    // Die isometrische Übersicht zeigt wesentlich mehr schattige Nordhänge als
    // eine bodennahe Kamera. 1.28 hält Abend und Bewölkung lesbar, ohne die
    // Mittagslichter des ACES-Mappings ausbrennen zu lassen.
    renderer.toneMappingExposure = 1.28;
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
      this.roadSurfaceGroup,
      this.roadSupportGroup,
      this.buildingGroup,
      this.cityLightGroup,
      this.liveGroup,
      this.infrastructureOverlayGroup,
      this.coverageOverlayGroup,
      this.workAreaOverlayGroup,
      this.roadPlanOverlayGroup,
      this.overlayGroup,
      this.markerGroup,
    );

    this.cam.snap();
    this.writeCamera();
    this.input = new CameraInputController(renderer.domElement, this.cam, this.inputHost());
    this.input.attach();
    this.observeResize();
    // § Säule B: Eine geänderte Qualitätsstufe passt die Renderauflösung an und
    // baut die Vegetation mit neuen Budgets/Schatten neu auf — kein voller
    // Weltneuaufbau, nur die Vegetationsgruppe.
    this.unsubGraphics = subscribeGraphicsSettings(() => {
      const r = this.renderer;
      if (!r || this.destroyed) return;
      r.setPixelRatio(Math.min(window.devicePixelRatio, adaptiveCap, getGraphicsProfile().pixelRatioCap));
      this.vegKey = ''; // erzwingt Neuaufbau der Vegetation im nächsten Frame
      this.rebuildVegetation();
    });
    renderer.setAnimationLoop(() => this.frame());
  }

  destroy(): void {
    this.destroyed = true;
    this.unsubGraphics?.();
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
    for (const volume of this.lockedMarkers.values()) {
      volume.markerTexture.dispose();
      volume.iconTexture.dispose();
    }
    this.disposeGroup(this.lockedMarkerGroup);
    this.lockedMarkers.clear();
    this.disposeGroup(this.vegetationGroup);
    this.disposeGroup(this.lockedVegetationGroup);
    this.disposeGroup(this.roadSurfaceGroup);
    this.disposeGroup(this.roadSupportGroup);
    this.disposeGroup(this.cityLightGroup);
    this.streetLampHeadMesh = undefined;
    this.streetGlowMesh = undefined;
    this.disposeGroup(this.liveGroup);
    // § Active Operations 2.0: gepoolte Arbeiter + ihre geteilten Assets.
    this.disposeGroup(this.workerGroup);
    this.workerPool.length = 0;
    if (this.workerAssets) {
      this.workerAssets.body.dispose();
      this.workerAssets.head.dispose();
      this.workerAssets.matWork.dispose();
      this.workerAssets.matCarry.dispose();
      delete this.workerAssets;
    }
    // § A5: gepoolte Transportfahrzeuge + geteilte Assets.
    this.vehicleGroup.clear();
    this.vehiclePool.length = 0;
    this.vehicleLastPos.clear();
    if (this.vehicleAssets) {
      this.vehicleAssets.geometry.dispose();
      this.vehicleAssets.mat.dispose();
      delete this.vehicleAssets;
    }
    this.disposeGroup(this.overlayGroup);
    this.disposeGroup(this.workAreaOverlayGroup);
    this.disposeGroup(this.roadPlanOverlayGroup);
    this.disposeGroup(this.infrastructureOverlayGroup);
    this.disposeGroup(this.coverageOverlayGroup);
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
    this.rebuildInfrastructureOverlay();
    this.rebuildCoverageOverlay();
  }

  setInfoLayer(mode: InfoLayerMode): void {
    if (mode === this.infoLayerMode) return;
    this.infoLayerMode = mode;
    this.rebuildMarkers();
  }

  setWorkAreaOverlay(overlay: WorkAreaOverlay | undefined): void {
    const key = overlay
      ? `${overlay.center.x},${overlay.center.y}|${overlay.radius}|${overlay.efficientRadius}|${overlay.maximumRadius}|${overlay.nodes.map((node) => `${node.id}:${node.state}`).join(',')}`
      : '';
    if (key === this.workAreaOverlayKey) return;
    this.workAreaOverlayKey = key;
    this.workAreaOverlay = overlay;
    this.workAreaHoverNodeId = undefined;
    this.clearOwnedGroup(this.workAreaOverlayGroup);
    if (!overlay) {
      this.callbacks.onWorkAreaNodeHover?.(undefined);
      return;
    }

    // Eine zusammenhängende, leicht transparente Oberfläche aus exakt den
    // Kacheln des aktuellen Radius. Jede Ecke liest terrainHeightAt, wodurch
    // der Layer auch auf Hängen weder schwebt noch im Boden verschwindet.
    const positions: number[] = [];
    const r = Math.max(1, Math.ceil(overlay.radius));
    for (let z = Math.floor(overlay.center.y - r); z <= Math.ceil(overlay.center.y + r); z++) {
      for (let x = Math.floor(overlay.center.x - r); x <= Math.ceil(overlay.center.x + r); x++) {
        const dx = x + 0.5 - overlay.center.x;
        const dz = z + 0.5 - overlay.center.y;
        if (dx * dx + dz * dz > overlay.radius * overlay.radius) continue;
        const y00 = terrainHeightAt(x, z) + 0.055;
        const y10 = terrainHeightAt(x + 1, z) + 0.055;
        const y11 = terrainHeightAt(x + 1, z + 1) + 0.055;
        const y01 = terrainHeightAt(x, z + 1) + 0.055;
        positions.push(
          x, y00, z,
          x + 1, y10, z,
          x + 1, y11, z + 1,
          x, y00, z,
          x + 1, y11, z + 1,
          x, y01, z + 1,
        );
      }
    }
    const areaGeo = new BufferGeometry();
    areaGeo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    areaGeo.computeVertexNormals();
    const area = new Mesh(
      areaGeo,
      new MeshBasicMaterial({
        color: 0x1da9c9,
        transparent: true,
        opacity: 0.11,
        depthWrite: false,
        side: DoubleSide,
      }),
    );
    area.renderOrder = 14;
    this.workAreaOverlayGroup.add(area);

    const addRing = (radius: number, color: number, dashed = false): void => {
      const ringPoints: Vector3[] = [];
      const steps = 96;
      for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        const x = overlay.center.x + Math.cos(angle) * radius;
        const z = overlay.center.y + Math.sin(angle) * radius;
        ringPoints.push(new Vector3(x, terrainHeightAt(x, z) + 0.13, z));
      }
      const geometry = new BufferGeometry().setFromPoints(ringPoints);
      const material = dashed
        ? new LineDashedMaterial({ color, dashSize: 0.7, gapSize: 0.4, transparent: true, opacity: 0.95 })
        : new LineBasicMaterial({ color, transparent: true, opacity: 0.95 });
      const line = new Line(geometry, material);
      if (dashed) line.computeLineDistances();
      line.renderOrder = 16;
      this.workAreaOverlayGroup.add(line);
    };
    addRing(overlay.radius, 0x51d6ed);
    addRing(overlay.efficientRadius, 0x57d98c, true);
    if (overlay.maximumRadius > overlay.radius) addRing(overlay.maximumRadius, 0xf1a43c, true);

    if (overlay.nodes.length > 0) {
      const geometry = new CylinderGeometry(0.23, 0.23, 0.09, 12);
      const material = new MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.94 });
      const nodes = new InstancedMesh(geometry, material, overlay.nodes.length);
      const dummy = new Object3D();
      const colors: Record<WorkAreaOverlay['nodes'][number]['state'], number> = {
        available: 0x45c97c,
        selected: 0x64e6ff,
        reserved: 0xf0a23b,
        excluded: 0x7f8b96,
        invalid: 0xe45647,
      };
      overlay.nodes.forEach((node, index) => {
        dummy.position.set(node.x + 0.5, terrainHeightAt(node.x + 0.5, node.y + 0.5) + 0.14, node.y + 0.5);
        dummy.updateMatrix();
        nodes.setMatrixAt(index, dummy.matrix);
        nodes.setColorAt(index, new Color(colors[node.state]));
      });
      nodes.instanceMatrix.needsUpdate = true;
      if (nodes.instanceColor) nodes.instanceColor.needsUpdate = true;
      nodes.renderOrder = 18;
      this.workAreaOverlayGroup.add(nodes);
    }

    // Wege aller ausgewählten Knoten werden in einem LineSegments-Draw-Call
    // gerendert und entlang der Oberfläche in Ein-Kachel-Schritten abgetastet.
    const pathPositions: number[] = [];
    for (const node of overlay.nodes) {
      if (node.state !== 'selected') continue;
      const dx = node.x + 0.5 - overlay.center.x;
      const dz = node.y + 0.5 - overlay.center.y;
      const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz)));
      for (let i = 0; i < steps; i++) {
        const a = i / steps;
        const b = (i + 1) / steps;
        const ax = overlay.center.x + dx * a;
        const az = overlay.center.y + dz * a;
        const bx = overlay.center.x + dx * b;
        const bz = overlay.center.y + dz * b;
        pathPositions.push(
          ax, terrainHeightAt(ax, az) + 0.1, az,
          bx, terrainHeightAt(bx, bz) + 0.1, bz,
        );
      }
    }
    if (pathPositions.length > 0) {
      const pathGeo = new BufferGeometry();
      pathGeo.setAttribute('position', new Float32BufferAttribute(pathPositions, 3));
      const paths = new LineSegments(
        pathGeo,
        new LineDashedMaterial({ color: 0x8feaff, dashSize: 0.28, gapSize: 0.18, transparent: true, opacity: 0.65 }),
      );
      paths.computeLineDistances();
      paths.renderOrder = 15;
      this.workAreaOverlayGroup.add(paths);
    }

    const center = new Mesh(
      new CylinderGeometry(0.45, 0.58, 0.16, 16),
      new MeshBasicMaterial({ color: 0xf0b641, transparent: true, opacity: 0.95 }),
    );
    center.position.set(
      overlay.center.x,
      terrainHeightAt(overlay.center.x, overlay.center.y) + 0.16,
      overlay.center.y,
    );
    center.renderOrder = 19;
    this.workAreaOverlayGroup.add(center);
  }

  setRoadPlanOverlay(tiles: RoadPlanOverlayTile[]): void {
    this.clearOwnedGroup(this.roadPlanOverlayGroup);
    if (tiles.length === 0) return;
    const geometry = new BoxGeometry(0.86, 0.045, 0.86);
    const material = new MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.82 });
    const mesh = new InstancedMesh(geometry, material, tiles.length);
    const dummy = new Object3D();
    // § Infrastruktur 2.0 / I2: grün = baubar, gelb/amber = teuer (Brücke),
    // rot = blockiert. Start/Ziel behalten eigene Ankerfarben, Viadukt-Landkacheln
    // bleiben violett (informativ), bestehende Straße grau.
    const colors: Record<RoadPlanOverlayTile['status'], number> = {
      start: 0x4ed17c,
      end: 0xf0a13a,
      ok: 0x5fd88a,
      bridge: 0xf0b23a,
      elevated: 0xc69cff,
      exists: 0x758b96,
      blocked: 0xe65345,
    };
    tiles.forEach((tile, index) => {
      dummy.position.set(tile.x + 0.5, terrainHeightAt(tile.x + 0.5, tile.y + 0.5) + 0.12, tile.y + 0.5);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, new Color(colors[tile.status]));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.renderOrder = 18;
    this.roadPlanOverlayGroup.add(mesh);

    const points = tiles.map(
      (tile) => new Vector3(tile.x + 0.5, terrainHeightAt(tile.x + 0.5, tile.y + 0.5) + 0.16, tile.y + 0.5),
    );
    if (points.length > 1) {
      const route = new Line(
        new BufferGeometry().setFromPoints(points),
        new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.72 }),
      );
      route.renderOrder = 19;
      this.roadPlanOverlayGroup.add(route);
    }
  }

  /** MapApi "Karte zentrieren" / Zentrum-preset. */
  centerOnCity(): void {
    this.cam.applyPreset('center');
    this.focusCityFrame();
  }

  /** Camera-preset from the view controls (§ Presets). */
  applyPreset(preset: CameraPreset): void {
    this.cam.applyPreset(preset);
    if (preset === 'city') this.focusCityFrame();
  }

  /**
   * Zentriert die normale Ansicht auf den tatsächlich bebauten Stadtkern.
   * Entfernte Rohstoff-Außenposten und Straßen ziehen die Kamera nicht wieder
   * zur Regionsübersicht auf; die Simulation bleibt vollständig unangetastet.
   */
  private focusCityFrame(): void {
    const townHallX = startRegionConfig.townHall.x + 2.5;
    const townHallZ = startRegionConfig.townHall.y + 2.5;
    const footprints = Object.values(this.controller.state.buildings).flatMap((building) => {
      const def = this.controller.config.buildings.get(building.defId);
      if (!def || def.category === 'roads') return [];
      const centerX = building.x + def.size.w / 2;
      const centerZ = building.y + def.size.h / 2;
      if (Math.hypot(centerX - townHallX, centerZ - townHallZ) > 44) return [];
      return [{ x: building.x, y: building.y, w: def.size.w, h: def.size.h }];
    });
    const frame = deriveCityFrame(footprints, townHallX, townHallZ);
    this.cam.focusGround(frame.x, frame.z, frame.dist);
  }

  /** Focus the currently selected building (F / focus button). */
  focusSelected(): void {
    if (this.selectedId) this.focusBuilding(this.selectedId);
    else this.focusCityFrame();
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
    const y = terrainHeightAt(d.x, d.z) + VEHICLE_ROAD_CLEARANCE;
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
      hoverAt: (cx, cy) => this.hoverWorkAreaAt(cx, cy),
      cancel: () => this.callbacks.onCancelPlacement(),
      focusCity: () => this.focusCityFrame(),
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

  /**
   * Screen point → world ground point (x,z). Marschiert den Cursor-Strahl gegen
   * das gebackene Höhenfeld (`terrainHeightAt`), damit die getroffene Kachel auch
   * auf Hängen/Bergen exakt unter dem Cursor liegt (G2 ①). Zeigt der Strahl in
   * den Himmel/über den Horizont, fällt er auf die unsichtbare y=0-Ebene zurück,
   * damit Leerraum-Klicks (Kamera-Fokus/Zoom) weiter funktionieren.
   */
  private groundPointAt(clientX: number, clientY: number): { x: number; z: number } | undefined {
    const ndc = this.ndc(clientX, clientY);
    if (!ndc) return undefined;
    this.raycaster.setFromCamera(ndc, this.camera);
    const o = this.raycaster.ray.origin;
    const d = this.raycaster.ray.direction;
    const terrain = raycastHeightfield(
      { ox: o.x, oy: o.y, oz: o.z, dx: d.x, dy: d.y, dz: d.z },
      terrainHeightAt,
      { minY: TERRAIN_MIN_Y, maxY: TERRAIN_MAX_Y },
    );
    if (terrain) return terrain;
    // Fallback: flache Pick-Ebene (Klick in den Himmel / über den Horizont).
    if (!this.ground) return undefined;
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

  setInfrastructureLayer(mode: InfrastructureLayerMode): void {
    if (mode === this.infrastructureLayerMode) return;
    this.infrastructureLayerMode = mode;
    this.rebuildInfrastructureOverlay();
  }

  setWorldReveal(state: WorldRevealState): void {
    if (
      state.fogDisabled === this.worldReveal.fogDisabled &&
      state.revealLockedRegionsVisually === this.worldReveal.revealLockedRegionsVisually &&
      state.unlockAllRegionsGameplay === this.worldReveal.unlockAllRegionsGameplay
    ) return;
    const visualChanged = state.fogDisabled !== this.worldReveal.fogDisabled
      || state.revealLockedRegionsVisually !== this.worldReveal.revealLockedRegionsVisually;
    this.worldReveal = { ...state };
    if (state.fogDisabled) {
      // Testmodus bedeutet wirklich frei sichtbare Insel: keine 1,8-s-Unlock-
      // Animation und keine unsichtbar weiterlaufenden Marker/Canvas-Texturen.
      for (const volume of this.lockedMarkers.values()) {
        this.lockedMarkerGroup.remove(volume.group);
        this.disposeGroup(volume.group);
        volume.markerTexture.dispose();
        volume.iconTexture.dispose();
      }
      this.lockedMarkers.clear();
    }
    if (visualChanged) {
      // Terrain-Deko, Vegetation und Landmarken werden mit der visuellen
      // Aufdeckung neu aufgebaut. Der logische Regionsstatus bleibt unberührt.
      this.terrainKey = '';
      this.vegKey = '';
    }
  }

  /** Schloss-Billboard → kanonische Regions-ID. Nur die wenigen sichtbaren
   *  Marker werden geraycastet, nicht die vielen Wolkeninstanzen. */
  private pickLockedRegionMarkerAt(clientX: number, clientY: number): number | undefined {
    const ndc = this.ndc(clientX, clientY);
    if (!ndc || this.lockedMarkers.size === 0) return undefined;
    this.raycaster.setFromCamera(ndc, this.camera);
    const markers = [...this.lockedMarkers.values()].map((volume) => volume.marker);
    const hit = this.raycaster.intersectObjects(markers, false)[0];
    return hit?.object.userData['regionId'] as number | undefined;
  }

  private selectAt(clientX: number, clientY: number): void {
    if (this.workAreaOverlay) {
      const tile = this.pickTileAt(clientX, clientY);
      const node = tile
        ? this.workAreaOverlay.nodes.find((candidate) => candidate.x === tile.x && candidate.y === tile.y)
        : undefined;
      if (node) this.callbacks.onWorkAreaNodeClick?.(node.id);
      return;
    }
    const id = this.pickBuildingAt(clientX, clientY);
    if (id) {
      this.callbacks.onSelectBuilding(id);
      return;
    }
    const markerRegionId = this.pickLockedRegionMarkerAt(clientX, clientY);
    if (markerRegionId !== undefined) {
      this.callbacks.onClickLockedRegion(markerRegionId);
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

  private hoverWorkAreaAt(clientX: number, clientY: number): void {
    // § World Overhaul 12.0 §10: Der Regionsname erscheint nur unter dem Zeiger.
    this.setLockedRegionLabel(this.pickLockedRegionMarkerAt(clientX, clientY));
    if (!this.workAreaOverlay) return;
    const tile = this.pickTileAt(clientX, clientY);
    const node = tile
      ? this.workAreaOverlay.nodes.find((candidate) => candidate.x === tile.x && candidate.y === tile.y)
      : undefined;
    const next = node?.id;
    if (next === this.workAreaHoverNodeId) return;
    this.workAreaHoverNodeId = next;
    this.callbacks.onWorkAreaNodeHover?.(next, clientX, clientY);
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
    const waterfront = this.controller.getWaterfrontPlacementPreview(def.id, { x, y }, this.placingRotation);
    const displayRotation = waterfront?.valid ? waterfront.suggestedRotation : this.placingRotation;
    const key = `${defId}|${x}|${y}|${displayRotation}`;
    if (key === this.lastHoverKey) return;
    this.lastHoverKey = key;

    // § 12.2 Gründung: Das Rathaus ist `buildable:false` und `unique` — die
    // normale Prüfung würde den Ghost dauerhaft rot färben. Solange die Stadt
    // nicht gegründet ist, entscheidet deshalb dieselbe Instanz, die auch der
    // Command benutzt (`getFoundingBlocker`), damit Vorschau und Ergebnis nie
    // auseinanderlaufen.
    const founding = def.id === 'town_hall' && !this.controller.isCityFounded();
    const error = founding
      ? this.controller.getFoundingBlocker(x, y)
      : waterfront
        ? waterfront.reason
        : validatePlacement(
            this.controller.state,
            this.controller.config,
            this.controller.derived,
            def,
            x,
            y,
            {},
          );
    const bonusPct = error ? 0 : locationBonusPct(this.controller.state, def, x, y);
    this.callbacks.onHoverInfo({
      defId: def.id,
      error,
      bonusPct,
      x,
      y,
      ...(waterfront ? { rotation: displayRotation, waterfront } : {}),
    });

    if (this.ghost) {
      this.overlayGroup.remove(this.ghost);
      this.disposeGroup(this.ghost);
    }
    const w = def.size.w;
    const h = def.size.h;
    const col = error ? 0xe5533b : bonusPct > 0 ? 0x58c470 : 0x49b7ff;
    const grp = new Group();
    const surface = samplePlacementSurface(this.controller.state, x, y, w, h);
    const ghostBase = def.category === 'roads'
      ? terrainHeightAt(x + w / 2, y + h / 2)
      : surface.maxHeight + 0.04;
    grp.position.set(x + w / 2, ghostBase, y + h / 2);
    if (def.category !== 'roads' && surface.maxHeight - surface.minHeight > 0.08) {
      const foundationDepth = Math.max(0.12, ghostBase - surface.minHeight + 0.06);
      const foundation = new Mesh(
        new BoxGeometry(w * 0.94, foundationDepth, h * 0.94),
        new MeshStandardMaterial({ color: col, transparent: true, opacity: 0.3, roughness: 1 }),
      );
      foundation.position.y = -foundationDepth / 2;
      grp.add(foundation);
    }
    // Footprint pad (clear green/red validity) sitting just above the ground.
    const pad = new Mesh(
      new BoxGeometry(w, 0.04, h),
      new MeshStandardMaterial({ color: col, transparent: true, opacity: 0.35, emissive: col, emissiveIntensity: 0.4 }),
    );
    pad.position.y = 0.27;
    grp.add(pad);
    // Der Versorgungsradius gehört zur Platzierungsentscheidung und muss daher
    // VOR dem Bau sichtbar sein. Dieselbe generische Effect-Auswertung versorgt
    // Wasser, Nahrung, Freizeit, Schutz und spätere Radiusdienste.
    const placementCoverage = this.placementCoverage(def);
    if (placementCoverage) {
      this.addTerrainCoverageVisual(
        grp,
        x + w / 2,
        y + h / 2,
        placementCoverage.radius,
        error ? 0xe5533b : placementCoverage.color,
        { x: x + w / 2, y: ghostBase, z: y + h / 2 },
        true,
      );
    }
    if (waterfront) {
      const waterColor = waterfront.valid ? 0x2ab7d6 : 0xf09a39;
      const waterMaterial = new MeshStandardMaterial({
        color: waterColor,
        transparent: true,
        opacity: 0.44,
        emissive: waterColor,
        emissiveIntensity: 0.45,
      });
      for (const cell of waterfront.waterCells) {
        const waterPad = new Mesh(new BoxGeometry(0.94, 0.035, 0.94), waterMaterial);
        waterPad.position.set(cell.x + 0.5 - (x + w / 2), WATER_LEVEL - ghostBase + 0.08, cell.y + 0.5 - (y + h / 2));
        grp.add(waterPad);
      }
    }
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
    box.userData['ghostMassing'] = true;
    grp.add(box);
    if (waterfront) {
      // Weiße Gründungspunkte machen den automatischen Höhenausgleich lesbar,
      // ohne eine neue Platzierungsregel einzuführen.
      const pileMaterial = new MeshStandardMaterial({
        color: 0xf4fbff,
        emissive: 0xa9dded,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.78,
        roughness: 0.72,
      });
      const corners = [
        [-w * 0.38, -h * 0.38],
        [w * 0.38, -h * 0.38],
        [-w * 0.38, h * 0.38],
        [w * 0.38, h * 0.38],
      ] as const;
      for (const [px, pz] of corners) {
        const worldX = x + w / 2 + px;
        const worldZ = y + h / 2 + pz;
        const ground = terrainHeightAt(worldX, worldZ);
        const pileHeight = Math.max(0.16, ghostBase - ground + 0.24);
        const pile = new Mesh(new CylinderGeometry(0.09, 0.12, pileHeight, 10), pileMaterial);
        pile.position.set(px, -pileHeight / 2 + 0.2, pz);
        grp.add(pile);
      }
      const anchorMaterial = new MeshBasicMaterial({ color: 0x75e5ff, transparent: true, opacity: 0.9 });
      for (const cell of waterfront.waterCells.filter((_, index) => index % Math.max(1, Math.ceil(waterfront.waterCells.length / 6)) === 0)) {
        const anchor = new Mesh(new CylinderGeometry(0.13, 0.13, 0.07, 16), anchorMaterial);
        anchor.position.set(
          cell.x + 0.5 - (x + w / 2),
          WATER_LEVEL - ghostBase + 0.13,
          cell.y + 0.5 - (y + h / 2),
        );
        grp.add(anchor);
      }
    }
    // Front-facing indicator (§ Gebäude-Rotation): a small arrow at the edge the
    // player chose as the front, so the rotation choice is visible before
    // committing — roads auto-orient from their neighbour mask, so skip it there.
    if (def.category !== 'roads') {
      const rad = (displayRotation * Math.PI) / 180;
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

    // Wenn ein Drop-in-GLB existiert, erscheint es als echte transparente
    // Gebäudevorschau. Materialkopien verhindern, dass der Cache oder bereits
    // gebaute Instanzen durch die Ghost-Transparenz verändert werden.
    const modelUrl = buildingModel(def.id, 0);
    if (modelUrl && def.category !== 'roads') {
      void loadModel(modelUrl)
        .then((source) => {
          if (this.destroyed || this.ghost !== grp) return;
          const model = source.clone(true);
          model.traverse((object) => {
            const mesh = object as Mesh;
            if (!mesh.isMesh) return;
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            const ghostMaterials = materials.map((material) => {
              const clone = material.clone();
              clone.transparent = true;
              clone.opacity = error ? 0.34 : 0.52;
              clone.depthWrite = false;
              return clone;
            });
            mesh.material = Array.isArray(mesh.material) ? ghostMaterials : ghostMaterials[0]!;
            mesh.castShadow = false;
            mesh.receiveShadow = false;
          });
          fitObject(model, {
            footprint: Math.max(w, h) * 0.88,
            rotationY: (displayRotation * Math.PI) / 180,
            castShadow: false,
          });
          const massing = grp.children.find((child) => child.userData['ghostMassing']);
          if (massing) {
            grp.remove(massing);
            this.disposeGroup(massing);
          }
          model.position.y += 0.29;
          grp.add(model);
        })
        .catch(() => {
          // Prozedurale Massing-Box bleibt der garantierte Fallback.
        });
    }
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
    const key = `${regions.map((r) => `${r.id}:${r.status}`).join(',')}|reveal:${this.worldReveal.revealLockedRegionsVisually ? 1 : 0}|fog:${this.worldReveal.fogDisabled ? 1 : 0}`;
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

    // Chunk-Boden: das 512²-Inselmesh ist in 8×8 Chunks à 64 Kacheln
    // zerlegt — nur Chunks, deren Sperr-Signatur sich geändert hat, werden neu
    // gebaut (Region-Unlock berührt wenige Chunks statt 600k Vertices). Gesperrte
    // Regionen werden PRO KACHEL gedimmt — die Grenze ist damit organisch
    // (§ Welt 2.0: keine Rechtecke); der hochwertige Nebel folgt in Phase A3.
    this.buildGroundChunks(regions);

    // Ein Ozean statt Kachelwasser (§ MVP4 P3): eine große Wellen-Ebene auf
    // WATER_LEVEL — Seen/Flüsse liegen im gebackenen Höhenfeld unter der
    // Wasserlinie und teilen dieselbe Fläche. Einmalig gebaut, bleibt stehen.
    this.buildOcean();

    // Schloss-Marker gesperrter Regionen (die Welt selbst bleibt sichtbar).
    this.updateLockedRegionMarkers(regions);

    // Drop-in terrain models (§ Gebirge/Map). § v1.24: für ALLE Regionen —
    // die Welt lädt vollständig, gesperrte Gebiete sind entsättigt, nicht leer.
    const tiles: { x: number; y: number; terrain: TerrainType; locked: boolean }[] = [];
    for (const r of regions) {
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
   * Chunk-Boden der Insel: das 512²-Höhenfeld ist in
   * `GROUND_CHUNK`-Kachel-Chunks zerlegt (8×8 = 64 Meshes bei
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
      return !this.worldReveal.revealLockedRegionsVisually && id !== 0 && status.get(id) !== 'unlocked';
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
    const mountainMoss = new Color(0x667b5c);
    const warmRock = new Color(0xa89278);
    const sunlitRock = new Color(0xc7b394);
    const summitSnow = new Color(0xf0f3ef);
    const desertTint = new Color(0xc96632);
    const swampTint = new Color(0x526140);
    const dryTint = new Color(0xbca363);
    const coastTint = new Color(0xaeb9aa);
    const alpineTint = new Color(0xc8cec9);
    const lockedGrey = new Color();
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
        if (height > 3 || slope > 1.45) {
          out.lerp(mountainMoss, MathUtils.clamp((height - 4.5) / 10, 0, 0.38));
          out.lerp(warmRock, MathUtils.clamp((height - 3.4 + slope * 0.58) / 5.6, 0, 0.86));
          out.lerp(sunlitRock, MathUtils.clamp((height - 11) / 11, 0, 0.46));
          // Das nahe Startplateau liegt nur bei ~16 und darf nicht bereits wie
          // ein riesiger grauer Schneeblock aussehen. Schnee folgt demselben
          // Hochgebirgsband wie der Splat-Shader.
          out.lerp(
            summitSnow,
            MathUtils.clamp(
              (height - SPLAT_BANDS.snowStart) / (SPLAT_BANDS.snowFull - SPLAT_BANDS.snowStart),
              0,
              0.9,
            ),
          );
        }
        // Breite, weiche Farbinseln brechen große Grünflächen auf, ohne ein
        // technisches Kachelmuster sichtbar zu machen. Der feine Hash nimmt
        // anschließend nur die letzte digitale Gleichförmigkeit heraus.
        const macroVariation =
          Math.sin(vx * 0.087 + vy * 0.051) * 0.018 +
          Math.cos(vx * 0.034 - vy * 0.073) * 0.014;
        out.offsetHSL(
          Math.sin((vx + vy) * 0.031) * 0.006,
          Math.cos(vx * 0.043 + vy * 0.029) * 0.018,
          macroVariation + (hash01(`${vx},${vy}`) - 0.5) * 0.024,
        );
        // § Welt lädt vollständig (v1.24): Gesperrtes Land wird ENTSÄTTIGT,
        // nicht mehr verdeckt. Die frühere Wolkenwand hat die halbe Insel
        // unsichtbar gemacht; jetzt bleibt die Geografie vollständig lesbar und
        // signalisiert allein über die Farbe „gehört dir noch nicht".
        //
        // Bewusst weich über `lock / cnt` (vier Kachelproben je Ecke): die
        // Grenze folgt damit der organischen Regionskontur statt einer
        // Kachelkante — dieselbe Eigenschaft, die schon die alte Dimmung hatte.
        const lockAmount = lock / cnt;
        if (lockAmount > 0) {
          const luminance = out.r * 0.299 + out.g * 0.587 + out.b * 0.114;
          lockedGrey.setRGB(luminance, luminance, luminance);
          out.lerp(lockedGrey, LOCKED_DESATURATION * lockAmount);
          // Ein Hauch kühler und dunkler trennt es zusätzlich vom eigenen Land,
          // ohne die Höhenstaffelung oder die Biome zu verschlucken.
          out.multiplyScalar(1 - LOCKED_DARKENING * lockAmount);
          out.b = Math.min(1, out.b * (1 + 0.05 * lockAmount));
        }
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
        const regionTint = blendedVisualTint(sampleRegionIds);
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
        if (regionTint !== undefined) {
          tmp.set(regionTint);
          out.lerp(tmp, 0.1);
        }
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
    const shore = new Float32Array(nx * ny);

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
        const sx = MathUtils.clamp(Math.floor(vx), 0, WORLD_TILES - 1);
        const sy = MathUtils.clamp(Math.floor(vy), 0, WORLD_TILES - 1);
        const si = sy * WORLD_TILES + sx;
        const st = shoreTypeGrid[si] ?? 0;
        shore[iy * nx + ix] = waterfrontBuildableGrid[si]
          ? 1
          : st === 1
            ? 0.92
            : st === 2
              ? 0.82
              : st === 3
                ? 0.72
                : st === 4
                  ? 0.24
                  : 0;
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
    geo.setAttribute('aShore', new Float32BufferAttribute(shore, 1));
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
    const [resolved, detailEntries] = await Promise.all([
      Promise.all(SPLAT_LAYERS.map(async (l) => {
        const p = loadSplatTexture(l.texture);
        if (!p) return undefined;
        try {
          return { key: l.key, tex: await p, triplanar: l.triplanar };
        } catch {
          return undefined;
        }
      })),
      Promise.all(Object.entries(SPLAT_DETAILS).map(async ([detailKey, name]) => {
        const p = loadSplatDataTexture(name);
        if (!p) return undefined;
        try {
          return [detailKey, await p] as const;
        } catch {
          return undefined;
        }
      })),
    ]);
    const active = resolved.filter(
      (x): x is { key: (typeof SPLAT_LAYERS)[number]['key']; tex: Texture; triplanar: boolean } => !!x,
    );
    // Stale (terrain rebuilt again meanwhile) or nothing dropped in yet.
    if (this.terrainKey !== key || active.length === 0 || this.destroyed) return;

    const cap = (s: string) => `w${s[0]!.toUpperCase()}${s.slice(1)}`;
    const details = new Map(detailEntries.filter((x): x is readonly [string, Texture] => !!x));
    mat.customProgramCacheKey = () =>
      `cmb-splat-61-${active.map((a) => a.key).sort().join('-')}-${[...details.keys()].sort().join('-')}`;
    mat.onBeforeCompile = (shader) => {
      for (const a of active) shader.uniforms[`uTex_${a.key}`] = { value: a.tex };
      for (const [detailKey, tex] of details) shader.uniforms[`uDetail_${detailKey}`] = { value: tex };
      shader.uniforms['uGroundWetness'] = this.groundWetness;
      shader.vertexShader =
        'attribute vec3 aBiome;\nattribute vec4 aVisual;\nattribute float aAlpine;\nattribute float aShore;\nvarying vec3 vBiome;\nvarying vec4 vVisual;\nvarying float vAlpine;\nvarying float vShore;\nvarying float vSplatH;\nvarying float vSplatSlope;\nvarying vec2 vSplatUv;\nvarying vec3 vSplatPos;\nvarying vec3 vSplatNormal;\n' +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           vBiome = aBiome;
           vVisual = aVisual;
           vAlpine = aAlpine;
           vShore = aShore;
           vSplatH = position.y;
           vSplatSlope = 1.0 - abs(normal.y);
           vSplatUv = position.xz * ${SPLAT_TILE_SCALE.toFixed(4)};
           vSplatPos = position.xyz * ${SPLAT_TILE_SCALE.toFixed(4)};
           vSplatNormal = normalize(normal);`,
        );

      const samplerDecls = [
        ...active.map((a) => `uniform sampler2D uTex_${a.key};`),
        ...[...details.keys()].map((detailKey) => `uniform sampler2D uDetail_${detailKey};`),
        'uniform float uGroundWetness;',
      ].join('\n');
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
        varying float vShore;
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
             // ONE source, an die neue gebackene Höhe kalibriert (Strand < ~0.9,
             // Fels ab ~9, Schnee nur auf höchsten Gipfeln bis 48). Biom-Anteile
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
             float bShore = clamp(vShore, 0.0, 1.0);
             float bAlpine = clamp(vAlpine, 0.0, 1.0);
             // Fels/Gipfel/Schnee rein höhenweise (Gebirge trägt kein Biom-Flag).
             float rock = smoothstep(${SPLAT_BANDS.stoneStart.toFixed(3)}, ${SPLAT_BANDS.stoneFull.toFixed(3)}, h);
             float wCliff = max(rock, wSlope);
             float wMountain = smoothstep(${SPLAT_BANDS.stoneFull.toFixed(3)}, ${SPLAT_BANDS.mountainFull.toFixed(3)}, h)
               * (0.76 + bAlpine * 0.34);
             float ridgeNoise = cmbNoise(vSplatPos.xz * 0.19 + vec2(vSplatPos.y * 0.13, -vSplatPos.y * 0.09));
             float wRidge = wMountain * smoothstep(0.48, 0.78, ridgeNoise) * (0.45 + slope);
             float wSnow = smoothstep(${SPLAT_BANDS.snowStart.toFixed(3)}, ${SPLAT_BANDS.snowFull.toFixed(3)}, h)
               * (0.72 + bAlpine * 0.38);
             float wStone = wCliff * 0.5;
             // Auf bebaubarem Land (geringer Hang, unter der Felsgrenze) verteilen
             // sich die Biom-Layer; Gras füllt den Rest.
             float lowland = (1.0 - wCliff) * (1.0 - wSlope);
             float wSand = max(bSand + bShore * 0.72 + (1.0 - smoothstep(${SPLAT_BANDS.sandFadeStart.toFixed(3)}, ${SPLAT_BANDS.sandFadeEnd.toFixed(3)}, h)) * 0.5, 0.0) * lowland;
             float wForest = bForest * lowland * (1.0 - bDesert * 0.86);
             float wFarm = bFertile * lowland * (1.0 - max(bDesert, bSwamp) * 0.82);
             float wGrass = max(1.0 - bForest - bFertile - bSand, 0.0) * lowland
               * smoothstep(${SPLAT_BANDS.grassFadeStart.toFixed(3)}, ${SPLAT_BANDS.grassFadeEnd.toFixed(3)}, h);
             float wDesert = bDesert * lowland * (0.8 + 0.2 * cmbNoise(vSplatUv * 0.08));
             float wSwamp = bSwamp * lowland * (1.0 - smoothstep(1.8, 3.8, h));
             float wDry = bDry * lowland * (1.0 - bDesert * 0.55);
             float wCoast = max(bCoast * 0.35, bShore) * lowland
               * max(max(bSand, bShore), 1.0 - smoothstep(0.2, 1.55, h)) * 0.92;
             float regionalCover = clamp(wDesert + wSwamp + wDry * 0.7, 0.0, 0.95);
             wGrass *= 1.0 - regionalCover;
             wSand *= 1.0 - max(wDesert * 0.7, wCoast * 0.45);
             ${zeroInactive}
             float wTotal = ${sumTerms};
             if (wTotal > 0.0005) {
               vec3 splatColor = (${sampleTerms}) / wTotal;
               // Fototexturen dürfen das Massiv nicht wieder zu einem dunklen
               // Block zusammendrücken. Helle Gesteinsflächen behalten einen
               // Teil der stilisierten Vertex-Staffelung und bekommen auf
               // Gipfeln etwas mehr Lichtreserve.
               float mountainShare = clamp((wStone + wMountain + wRidge + wSnow) / wTotal, 0.0, 1.0);
               splatColor *= 1.0 + mountainShare * 0.12;
               // Die helle, stilisierte Vertex-Farbe bleibt klar lesbar. Die
               // Materialbibliothek liefert Makrostruktur, ersetzt aber nicht
               // mehr die komplette Farbwelt durch dunkle Fototexturen.
               float coverage = clamp(wTotal, 0.0, 1.0) * 0.44;
               float forestAo = 1.0;
               ${details.has('forestAo') ? "forestAo = mix(1.0, texture2D(uDetail_forestAo, vSplatUv * 1.7).r, clamp(wForest / wTotal, 0.0, 1.0) * 0.3);" : ''}
               diffuseColor.rgb = mix(diffuseColor.rgb, splatColor * forestAo, coverage);
               // Sanfte Cartoon-Farbverdichtung statt harter Cel-Shading-Kanten:
               // leicht mehr Sättigung, wenige breite Helligkeitsstufen und
               // genügend Lichtreserve für lesbare Morgen-/Abendszenen.
               float cmbLum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
               vec3 cmbSat = mix(vec3(cmbLum), diffuseColor.rgb, 1.1);
               float cmbBandedLum = floor(cmbLum * 11.0 + 0.5) / 11.0;
               vec3 cmbBanded = cmbSat * (cmbBandedLum / max(cmbLum, 0.045));
               diffuseColor.rgb = min(mix(cmbSat, cmbBanded, 0.16) * 1.045, vec3(1.0));
               float rainDarken = uGroundWetness * (0.055 + bShore * 0.035);
               diffuseColor.rgb *= 1.0 - rainDarken;
             }
           }`,
        );

      const normalDetail = details.has('grassNormal') || details.has('rockNormal')
        ? `
          float cmbNearDetail = 1.0 - smoothstep(85.0, 175.0, length(vViewPosition));
          float cmbRockMix = clamp(smoothstep(${SPLAT_BANDS.stoneStart.toFixed(2)}, ${SPLAT_BANDS.stoneFull.toFixed(2)}, vSplatH) + vSplatSlope, 0.0, 1.0);
          vec3 cmbDetailN = vec3(0.5, 0.5, 1.0);
          ${details.has('grassNormal') ? 'cmbDetailN = texture2D(uDetail_grassNormal, vSplatUv * 1.55).xyz;' : ''}
          ${details.has('rockNormal') ? 'cmbDetailN = mix(cmbDetailN, texture2D(uDetail_rockNormal, vSplatUv * 1.12).xyz, cmbRockMix);' : ''}
          vec2 cmbPerturb = (cmbDetailN.xy * 2.0 - 1.0) * mix(0.04, 0.11, cmbRockMix) * cmbNearDetail;
          normal = normalize(normal + vec3(cmbPerturb.x, cmbPerturb.y, 0.0));`
        : '';
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>${normalDetail}`,
      );
      if (details.has('rockRoughness')) {
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <roughnessmap_fragment>',
          `#include <roughnessmap_fragment>
           {
             float cmbRockR = smoothstep(${SPLAT_BANDS.stoneStart.toFixed(2)}, ${SPLAT_BANDS.stoneFull.toFixed(2)}, vSplatH);
             float cmbRoughTex = texture2D(uDetail_rockRoughness, vSplatUv * 1.12).r;
             roughnessFactor = mix(roughnessFactor, mix(0.72, 1.0, cmbRoughTex), cmbRockR * 0.55);
             roughnessFactor = mix(roughnessFactor, 0.48, uGroundWetness * (0.18 + vShore * 0.18));
           }`,
        );
      }
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

    // Radiales Mesh statt quadratischer Platte: konzentrische Ringe liefern
    // genügend Wellen-Vertices. Der runde Außenrand liegt hinter dem
    // atmosphärischen Fog-Far und ist aus keiner normalen Kamera erkennbar.
    const OCEAN_RADIUS = 1_720;
    const OCEAN_RINGS = 96;
    const OCEAN_SEGMENTS = 192;
    const oceanPositions: number[] = [0, 0, 0];
    const oceanIndices: number[] = [];
    for (let ring = 1; ring <= OCEAN_RINGS; ring++) {
      const radius = (ring / OCEAN_RINGS) * OCEAN_RADIUS;
      for (let segment = 0; segment < OCEAN_SEGMENTS; segment++) {
        const angle = (segment / OCEAN_SEGMENTS) * Math.PI * 2;
        oceanPositions.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      }
    }
    for (let segment = 0; segment < OCEAN_SEGMENTS; segment++) {
      oceanIndices.push(0, 1 + segment, 1 + ((segment + 1) % OCEAN_SEGMENTS));
    }
    for (let ring = 1; ring < OCEAN_RINGS; ring++) {
      const inner = 1 + (ring - 1) * OCEAN_SEGMENTS;
      const outer = 1 + ring * OCEAN_SEGMENTS;
      for (let segment = 0; segment < OCEAN_SEGMENTS; segment++) {
        const next = (segment + 1) % OCEAN_SEGMENTS;
        oceanIndices.push(
          inner + segment, outer + segment, inner + next,
          inner + next, outer + segment, outer + next,
        );
      }
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(oceanPositions, 3));
    geo.setIndex(oceanIndices);
    geo.computeVertexNormals();
    const positions = geo.getAttribute('position');
    const waterColors = new Float32Array(positions.count * 3);
    const shallowWater = new Color(0x62ddd0);
    const deepWater = new Color(0x12659a);
    const waterColor = new Color();
    for (let i = 0; i < positions.count; i++) {
      const worldX = positions.getX(i) + WORLD_TILES / 2;
      const worldZ = positions.getZ(i) + WORLD_TILES / 2;
      const tx = Math.floor(worldX), ty = Math.floor(worldZ);
      const depth = tx >= 0 && ty >= 0 && tx < WORLD_TILES && ty < WORLD_TILES
        ? oceanDepthGrid[ty * WORLD_TILES + tx]!
        : 255;
      waterColor.copy(shallowWater).lerp(deepWater, MathUtils.clamp((depth - 1) / 18, 0, 1));
      if (tx >= 2 && ty >= 2 && tx < WORLD_TILES - 2 && ty < WORLD_TILES - 2) {
        let accessibleShore = false;
        for (let oy = -2; oy <= 2 && !accessibleShore; oy++) {
          for (let ox = -2; ox <= 2; ox++) {
            const st = shoreTypeGrid[(ty + oy) * WORLD_TILES + tx + ox] ?? 0;
            if (st >= 1 && st <= 3) {
              accessibleShore = true;
              break;
            }
          }
        }
        if (accessibleShore) waterColor.lerp(shallowWater, 0.34);
      }
      waterColors[i * 3] = waterColor.r;
      waterColors[i * 3 + 1] = waterColor.g;
      waterColors[i * 3 + 2] = waterColor.b;
    }
    geo.setAttribute('color', new Float32BufferAttribute(waterColors, 3));
    const mat = new MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.38,
      metalness: 0.06,
      emissive: 0x0b4a63,
      emissiveIntensity: 0.24,
      fog: true,
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
           diffuseColor.rgb *= 0.93 + broad * 0.08 + cross * 0.045;
           float crest = smoothstep(0.87, 1.0, broad) * 0.12 + smoothstep(0.93, 1.0, cross) * 0.08;
           diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.72, 0.98, 0.98), crest);`,
        );
    };

    const sea = new Mesh(geo, mat);
    sea.position.set(WORLD_TILES / 2, WATER_LEVEL, WORLD_TILES / 2);
    sea.receiveShadow = true;
    sea.frustumCulled = false;
    // Opaque water also hides the finite heightfield below it. With a
    // translucent surface, the 512×512 lakebed appeared as a hard square in
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
      color: 0xa3f3ec,
      transparent: true,
      opacity: 0.44,
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
   * Ein gebündelter, geglätteter Küstensaum aus derselben gebackenen
   * Wasser-/Landmaske. Marching Squares ersetzt die sichtbare Treppenkante
   * durch diagonalfähige Konturen; eine Chaikin-Runde beruhigt die Silhouette.
   * Es bleiben genau zwei Meshes (Seichtwasser + Schaum), unabhängig von der
   * Küstenlänge.
   */
  private buildCoastFoam(): void {
    const foamPositions: number[] = [];
    const shoalPositions: number[] = [];
    const water = (x: number, y: number): boolean => {
      const terrain = worldTerrainAt(this.controller.state, x, y);
      return terrain === 'water' || terrain === 'river';
    };
    const segments = marchingShoreSegments(WORLD_TILES, WORLD_TILES, water);
    const chains = traceShoreChains(segments);
    const flatShoreAt = (x: number, z: number): boolean => {
      // Die Marching-Squares-Linie liegt zwischen Land und Wasser. Deshalb
      // prüfen wir mehrere nahe Landproben, statt zufällig die Wasserkachel
      // unter `floor()` als „keine flache Küste“ zu werten.
      for (const [dx, dz] of [[0, 0], [0.55, 0], [-0.55, 0], [0, 0.55], [0, -0.55]] as const) {
        const tx = MathUtils.clamp(Math.floor(x + dx), 0, WORLD_TILES - 1);
        const ty = MathUtils.clamp(Math.floor(z + dz), 0, WORLD_TILES - 1);
        const shoreType = shoreTypeGrid[ty * WORLD_TILES + tx] ?? 0;
        if (shoreType >= 1 && shoreType <= 3) return true;
      }
      return false;
    };
    for (const raw of chains) {
      const chain = smoothShoreChain(raw, 1);
      if (chain.points.length < 2) continue;
      const flat = chain.points.map((point) => flatShoreAt(point.x, point.z));
      appendVariableRibbonTriangles(
        shoalPositions,
        chain.points,
        flat.map((isFlat) => isFlat ? 0.54 : 0.24),
        0.026,
        () => WATER_LEVEL,
      );
      appendVariableRibbonTriangles(
        foamPositions,
        chain.points,
        flat.map((isFlat) => isFlat ? 0.105 : 0.065),
        0.055,
        () => WATER_LEVEL,
      );
    }
    if (foamPositions.length === 0) return;
    const shoalGeo = new BufferGeometry();
    shoalGeo.setAttribute('position', new Float32BufferAttribute(shoalPositions, 3));
    const shoalMat = new MeshBasicMaterial({
      color: 0x7de5dc,
      transparent: true,
      opacity: 0.17,
      depthWrite: false,
      side: DoubleSide,
    });
    const shoal = new Mesh(shoalGeo, shoalMat);
    shoal.renderOrder = 1;

    const foamGeo = new BufferGeometry();
    foamGeo.setAttribute('position', new Float32BufferAttribute(foamPositions, 3));
    const foamMat = new MeshBasicMaterial({
      color: 0xf3ffff,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      side: DoubleSide,
    });
    const foam = new Mesh(foamGeo, foamMat);
    foam.renderOrder = 2;
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
    const islandMat = new MeshStandardMaterial({ vertexColors: true, roughness: 1, fog: true });
    const group = new Group();
    const COUNT = 7;
    for (let i = 0; i < COUNT; i++) {
      const h = hash01(`island${i}`);
      const ang = (i / COUNT) * Math.PI * 2 + (h - 0.5) * 0.4;
      const dist = WORLD_TILES * (1.18 + h * 0.58);
      const ix = cx + Math.cos(ang) * dist;
      const iz = cz + Math.sin(ang) * dist;
      const scale = 18 + h * 28;
      const segments = 14;
      const positions: number[] = [];
      const colors: number[] = [];
      const indices: number[] = [];
      const ringColors = [new Color(0x9b9b7b), new Color(0x47624c), new Color(0x58605e)];
      for (let ring = 0; ring < 3; ring++) {
        for (let segment = 0; segment < segments; segment++) {
          const angle = (segment / segments) * Math.PI * 2;
          const irregularity = 0.78 + hash01(`far-island:${i}:${ring}:${segment}`) * 0.42;
          const radius = scale * [1.08, 0.76, 0.34][ring]! * irregularity;
          const elevation = ring === 0
            ? WATER_LEVEL + 0.12
            : WATER_LEVEL + scale * (ring === 1
              ? 0.055 + hash01(`far-low:${i}:${segment}`) * 0.045
              : 0.18 + hash01(`far-ridge:${i}:${segment}`) * 0.16);
          positions.push(Math.cos(angle) * radius, elevation, Math.sin(angle) * radius);
          const color = ringColors[ring]!;
          colors.push(color.r, color.g, color.b);
        }
      }
      positions.push(0, WATER_LEVEL + scale * (0.3 + h * 0.18), 0);
      const summitColor = new Color(0x676c6b);
      colors.push(summitColor.r, summitColor.g, summitColor.b);
      for (let ring = 0; ring < 2; ring++) {
        const aStart = ring * segments;
        const bStart = (ring + 1) * segments;
        for (let segment = 0; segment < segments; segment++) {
          const next = (segment + 1) % segments;
          indices.push(
            aStart + segment, bStart + segment, aStart + next,
            aStart + next, bStart + segment, bStart + next,
          );
        }
      }
      const summit = segments * 3;
      for (let segment = 0; segment < segments; segment++) {
        indices.push(segments * 2 + segment, summit, segments * 2 + ((segment + 1) % segments));
      }
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      const isle = new Mesh(geometry, islandMat);
      // Größere Inseln bekommen einen grauen Gipfel als Silhouette.
      isle.position.set(ix, 0, iz);
      isle.rotation.y = h * Math.PI * 2;
      isle.castShadow = false;
      isle.receiveShadow = false;
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

  /**
   * Hält die Schloss-Marker gesperrter Regionen aktuell und startet beim Unlock
   * die Aufdeck-Animation. Verdeckt wird seit v1.24 nichts mehr — die Welt ist
   * vollständig geladen und sichtbar (siehe `LOCKED_DESATURATION`).
   */
  private updateLockedRegionMarkers(regions: { id: number; status: string }[]): void {
    if (!this.lockedMarkerGroup.parent) this.scene.add(this.lockedMarkerGroup);
    const locked = new Set(
      this.worldReveal.fogDisabled ? [] : regions.filter((r) => r.status !== 'unlocked').map((r) => r.id),
    );
    for (const id of locked) {
      if (!this.lockedMarkers.has(id)) {
        const vol = this.createLockedRegionMarker(id);
        if (vol) this.lockedMarkers.set(id, vol);
      }
    }
    for (const [id, vol] of this.lockedMarkers) {
      if (!locked.has(id) && vol.fading < 0) {
        vol.fading = 0; // Aufdeck-Animation starten
        // §10: „beim Freischalten" ist einer der drei erlaubten Momente für den
        // vollen Namen — der Marker beschriftet sich für die Aufdeck-Animation.
        this.setLockedRegionLabel(id);
      }
    }
  }



  /**
   * Baut den Schloss-Marker einer gesperrten Region.
   *
   * § Welt lädt vollständig (v1.24): Früher entstand hier ein komplettes
   * Nebel-VOLUMEN — geglättete Regionskontur, blickdichte Grunddecke, drei
   * Alpha-Lagen und eine geschlossene Wolkenwand bis zum Boden. Es hat die
   * Region vollständig verdeckt. Übrig bleibt bewusst nur der Marker: Die
   * Sperrung liest sich jetzt am entsättigten Gelände (`LOCKED_DESATURATION`),
   * und der Marker liefert die Auskunft, die der Nebel nie geben konnte —
   * WELCHE Region das ist und ab welchem Level sie öffnet.
   */
  private createLockedRegionMarker(id: number): LockedRegionMarker | undefined {
    const baked = BAKED_REGIONS[id - 1];
    const def = this.controller.config.regions.get(id);
    if (!baked || !def) return undefined;

    const group = new Group();
    group.userData['regionId'] = id;
    const mats: { mat: MeshStandardMaterial | SpriteMaterial; base: number }[] = [];

    // Weltmarker: Schloss bleibt unabhängig von Wetter und Tageszeit lesbar und
    // öffnet per Klick den Regionsdialog. § World Overhaul 12.0 §10: Der
    // Regionsname wird NICHT dauerhaft eingeblendet — Ruhezustand ist das
    // kompakte Schloss, der volle Marker erscheint bei Hover und Freischaltung.
    const levelLabel = def.unlockable
      ? t('ui.region.marker_level', { level: def.unlockLevel })
      : t('ui.region.marker_future');
    const markerTexture = makeLockedRegionMarkerTexture(t(def.nameKey), levelLabel);
    const iconTexture = makeLockedRegionIconTexture();
    const markerMat = new SpriteMaterial({
      map: iconTexture,
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false,
      fog: false,
    });
    const marker = new Sprite(markerMat);
    // Ohne Wolkendecke gibt es keine globale Oberkante mehr, an der der Marker
    // hängen könnte. Er schwebt jetzt über dem EIGENEN Gelände der Region —
    // dadurch folgt er dem Relief statt über einem Berg zu versinken.
    const centroidY = terrainHeightAt(baked.centroid.x + 0.5, baked.centroid.y + 0.5);
    marker.position.set(baked.centroid.x, centroidY + 11, baked.centroid.y);
    marker.scale.set(...LOCKED_REGION_ICON_SCALE);
    marker.userData['regionId'] = id;
    marker.userData['markerBaseY'] = marker.position.y;
    marker.userData['markerPhase'] = id * 0.67;
    marker.renderOrder = 100;
    group.add(marker);
    mats.push({ mat: markerMat, base: markerMat.opacity });

    this.lockedMarkerGroup.add(group);
    return { group, mats, marker, markerTexture, iconTexture, labelled: false, fading: -1 };
  }


  /**
   * § World Overhaul 12.0 §10 — Regionsname nur bei Bedarf einblenden.
   * `regionId === undefined` blendet alle Namen wieder aus. Fadende Volumen
   * (gerade freigeschaltete Regionen) behalten ihren vollen Marker.
   */
  private setLockedRegionLabel(regionId: number | undefined): void {
    for (const [id, volume] of this.lockedMarkers) {
      const wanted = id === regionId || volume.fading >= 0;
      if (volume.labelled === wanted) continue;
      volume.labelled = wanted;
      const mat = volume.marker.material as SpriteMaterial;
      mat.map = wanted ? volume.markerTexture : volume.iconTexture;
      mat.needsUpdate = true;
      volume.marker.scale.set(...(wanted ? LOCKED_REGION_LABEL_SCALE : LOCKED_REGION_ICON_SCALE));
    }
  }

  /** Aufdeck-Animation: Nebel steigt und dünnt aus, dann wird er entsorgt. */
  private animateLockedRegionMarkers(dt: number): void {
    if (this.lockedMarkers.size === 0) return;
    const DURATION = 1.8;
    const now = performance.now() / 1000;
    for (const [id, vol] of this.lockedMarkers) {
      if (vol.fading < 0) {
        const markerBaseY = vol.marker.userData['markerBaseY'] as number;
        const markerPhase = vol.marker.userData['markerPhase'] as number;
        vol.marker.position.y = markerBaseY + Math.sin(now * 0.9 + markerPhase) * 0.22;
        // Regionsmarker sind Orientierung, kein dauerhaftes Hauptpanel.
        // Nah klein und diskret, in der Inselübersicht gerade groß genug
        // zum Anklicken; der Text verdrängt die Stadt nicht mehr.
        const markerWidth = MathUtils.clamp(this.cam.getDist() * 0.04, 5.5, 18);
        vol.marker.scale.set(markerWidth, markerWidth * 0.375, 1);
        continue;
      }
      // Freischalt-Animation: Der Marker steigt auf und löst sich auf. Früher
      // hob sich hier die ganze Wolkendecke — die gibt es nicht mehr, die
      // Region war ja bereits sichtbar. Was sich ändert, ist ihre Sättigung
      // (durch den Terrain-Neuaufbau) und dass das Schloss verschwindet.
      vol.fading += dt;
      const k = Math.min(1, vol.fading / DURATION);
      vol.group.position.y = k * 6;
      for (const { mat, base } of vol.mats) mat.opacity = base * (1 - k) * (1 - k);
      if (k >= 1) {
        this.lockedMarkerGroup.remove(vol.group);
        this.disposeGroup(vol.group);
        vol.markerTexture.dispose();
        vol.iconTexture.dispose();
        this.lockedMarkers.delete(id);
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
          // Drop-in-Kachelmodelle bleiben hart gedeckelt (Perf-Schutz), die
          // Auswahl ist über `selectPropTiles` aber positionsstabil.
          { footprint: 1, jitterRot: false, castShadow: false, yBase: 0, cap: 400 },
          stale,
        );
        if (stale()) return;
      }
      // Die Hauptsilhouette einschließlich aller Gipfel stammt vollständig aus
      // dem neuen Höhenbake. Zusätzliche große Bergmodule würden die modellierte
      // Geografie doppeln; kleine Felsen/Geröll bleiben Vegetationsdetails.
    }
  }

  /**
   * Vegetation ist ein eigener, gecullter Durchlauf (§7): Natur wächst nur auf
   * FREIEN Kacheln — nie auf einem Gebäude- oder Straßen-Footprint — und wird
   * neu aufgebaut, wenn sich Stadt oder sichtbare Regionen ändern.
   *
   * § NATUR-OVERHAUL 14.0: Diese Methode entscheidet NICHT mehr, wo etwas
   * wächst. Die Verteilung liegt in `natureDistribution.ts` (rein und testbar,
   * Regeln in `natureZones.ts`), die Massengeometrie in `natureRenderer.ts`.
   * Hier bleibt nur noch die Zusammenführung: Verteilung holen, seltene
   * Hero-`.glb` abzweigen, Rest als stilisierte Instanzen aufbauen.
   *
   * Warum überhaupt eine Abzweigung? Jedes vorhandene Natur-`.glb` wiegt rund
   * 29.000 Dreiecke. Als Masse ist das unbezahlbar (deshalb bestand die Welt
   * früher aus Kegeln), als seltener Blickfang ist es genau richtig.
   */
  private rebuildVegetation(): void {
    const profile = getGraphicsProfile();
    this.activeVegProfile = profile;
    const regions = Object.values(this.controller.state.world.regions);
    const unlocked = regions.filter((r) => r.status === 'unlocked');
    const locked = regions.filter((r) => r.status !== 'unlocked');

    // § Welt lädt vollständig (v1.24) — ZWEI GETRENNTE AUFBAUTEN.
    //
    // Seit gesperrte Regionen mitgebaut werden, umfasst die Vegetation der Insel
    // rund 27.000 Instanzen statt 1.400. Hinge das an EINEM Schlüssel, müsste
    // jedes gesetzte Gebäude die ganze Insel neu aufbauen — 51.000 Kacheln
    // scannen für eine 3×3-Änderung.
    //
    // Gesperrte Regionen hängen aber gar nicht an der Belegung: Dort baut
    // niemand. Ihr Bestand ändert sich nur beim Freischalten oder bei einem
    // Wechsel der Qualitätsstufe. Deshalb zwei Gruppen mit eigenen Schlüsseln —
    // der teure Teil steht still, während der Spieler baut.
    const lockedKey = `${locked.map((r) => r.id).join(',')}|${profile.level}`;
    if (lockedKey !== this.lockedVegKey) {
      this.lockedVegKey = lockedKey;
      this.disposeGroup(this.lockedVegetationGroup);
      this.lockedVegetationGroup.clear();
      this.lockedVegetationLod = [];
      if (!this.lockedVegetationGroup.parent) this.scene.add(this.lockedVegetationGroup);
      this.buildVegetationFor(
        locked,
        LOCKED_VEGETATION_DENSITY,
        this.lockedVegetationGroup,
        this.lockedVegetationLod,
        // Gesperrtes Land ist Kulisse: keine Schatten. Das Schattenbudget ist
        // mit wenigen hundert Instanzen ohnehin knapp und gehört der Stadt.
        () => false,
        () => this.lockedVegKey !== lockedKey,
        profile,
      );
    }

    const key = `${unlocked.map((r) => r.id).join(',')}|${this.occupied.size}|${[...this.occupied].join(',')}|${profile.level}`;
    if (key === this.vegKey) return;
    this.vegKey = key;
    this.disposeGroup(this.vegetationGroup);
    this.vegetationGroup.clear();
    this.nearVegetation = [];
    this.vegetationDistanceLod = [];

    // § Säule B: striktes Schattenbudget für die schattenwerfenden Groß-Props.
    // Ist es aufgebraucht, wirft nichts weiteres Schatten.
    let shadowBudget = profile.vegetationShadows ? profile.shadowInstanceBudget : 0;
    const vegShadow = (count: number): boolean => {
      if (shadowBudget < count) return false;
      shadowBudget -= count;
      return true;
    };
    this.buildVegetationFor(
      unlocked,
      1,
      this.vegetationGroup,
      this.vegetationDistanceLod,
      vegShadow,
      () => this.vegKey !== key,
      profile,
    );
  }

  /**
   * Baut die Vegetation einer Regionsmenge in eine Zielgruppe.
   *
   * Die Verteilung kommt aus `collectRegionNature` — genau derselben Funktion,
   * die auch die Tests messen (D-042: Messung und Gegenstand teilen sich
   * zwingend den Code). Hier passiert nur noch die Aufteilung in seltene
   * Hero-`.glb` und stilisierte Masse.
   */
  private buildVegetationFor(
    regions: { id: number; status: string }[],
    densityScale: number,
    target: Group,
    lod: NatureLodEntry[],
    claimShadow: (count: number) => boolean,
    stale: () => boolean,
    profile: GraphicsProfile,
  ): void {
    if (regions.length === 0) return;
    const mass = emptyPlacement();
    const detailed = emptyPlacement();
    const townHallX = startRegionConfig.townHall.x + 2.5;
    const townHallZ = startRegionConfig.townHall.y + 2.5;
    for (const r of regions) {
      const placement = collectRegionNature(r.id, {
        terrainAt: (x, y) => worldTerrainAt(this.controller.state, x, y),
        heightAt: (x, y) => terrainHeightAt(x + 0.5, y + 0.5),
        isOccupied: (x, y) => this.occupied.has(`${x},${y}`),
        scaleBudget: (base) => scaledBudget(base, profile),
        densityScale,
        clearing: r.id === startRegionConfig.startRegionId
          ? (x, y) => starterNatureFrame(Math.hypot(x + 0.5 - townHallX, y + 0.5 - townHallZ))
          : undefined,
      });
      for (const kind of NATURE_KINDS) {
        const list = placement[kind];
        if (list.length === 0) continue;
        const detailBudget = scaledBudget(REGION_DETAIL_PROP_BUDGET[kind], profile);
        if (detailBudget <= 0) {
          mass[kind].push(...list);
          continue;
        }
        // Eine kleine, positionsstabile Teilmenge bekommt das echte Modell.
        const picked = new Set(
          selectPropTiles(`detail:${kind}:${r.id}`, list, detailBudget)
            .map((tile) => `${tile.x},${tile.y}`),
        );
        for (const instance of list) {
          (picked.has(`${instance.x},${instance.y}`) ? detailed : mass)[kind].push(instance);
        }
      }
    }

    // ---- Seltene Hero-Modelle (echte `.glb`) -------------------------------
    const heroModel = (
      kind: NatureKind,
      names: readonly string[],
      tiles: NatureInstance[],
      footprint: number,
      extra: { groundRadius?: number; sink?: number; cullFactor?: number; jitterScale?: number } = {},
    ): void => {
      if (tiles.length === 0) return;
      const url = firstModel(propModel, names);
      if (!url) {
        // Kein Modell vorhanden → die Kacheln fallen in die stilisierte Masse
        // zurück, statt ersatzlos zu verschwinden (§5 Drop-in, nie crashen).
        if (hasNatureGeometry(kind)) mass[kind].push(...tiles);
        return;
      }
      void this.placeModelInstances(
        url,
        target,
        tiles,
        {
          footprint,
          jitterRot: true,
          jitterScale: extra.jitterScale ?? 0.5,
          jitterPosition: 0.44,
          yBase: 0,
          ...(extra.groundRadius === undefined ? {} : { groundRadius: extra.groundRadius }),
          ...(extra.sink === undefined ? {} : { sink: extra.sink }),
          castShadow: claimShadow(tiles.length),
          cullDistance: profile.vegetationViewDistance * (extra.cullFactor ?? 1),
        },
        stale,
      );
    };

    heroModel('pine', PINE_TREE_MODELS, detailed.pine, 1.34);
    heroModel('broadleaf', BROADLEAF_TREE_MODELS, [...detailed.broadleaf, ...detailed.meadowTree], 1.38, { jitterScale: 0.48 });
    heroModel('largePine', LARGE_PINE_TREE_MODELS, detailed.largePine, 1.62, { jitterScale: 0.38 });
    heroModel('bush', BUSH_MODELS, detailed.bush, 0.72, { jitterScale: 0.42 });
    heroModel('rock', ROCK_CLUSTER_MODELS, detailed.rock, 0.72, { jitterScale: 0.72, groundRadius: 0.36, sink: 0.12 });
    heroModel('reed', REED_MODELS, detailed.reed, 0.42, { jitterScale: 0.52 });
    heroModel('deadwood', DEADWOOD_MODELS, detailed.deadwood, 0.82, { jitterScale: 0.46 });

    // § 12.2 — HOCHSKALIERTE ALTBÄUME UND FINDLINGE bleiben der Maßstabsanker
    // der Welt: dieselben vorhandenen Modelle, aber in zwei Staffeln deutlich
    // vergrößert. Der Größenunterschied IST der Effekt.
    const giantTreeNames = [...LARGE_PINE_TREE_MODELS, ...BROADLEAF_TREE_MODELS];
    const tierOf = (tiles: NatureInstance[], salt: string, cut: number) => ({
      low: tiles.filter((tile) => hash01(`${salt}:${tile.x},${tile.y}`) <= cut),
      high: tiles.filter((tile) => hash01(`${salt}:${tile.x},${tile.y}`) > cut),
    });
    const giants = tierOf(mass.giantTree, 'giant-tier', 0.62);
    mass.giantTree = [];
    heroModel('giantTree', giantTreeNames, giants.low, 3.1, { jitterScale: 0.85, cullFactor: 1.6 });
    heroModel('giantTree', giantTreeNames, giants.high, 4.4, { jitterScale: 0.85, cullFactor: 1.6 });
    const bouldersByTier = tierOf(mass.boulder, 'boulder-tier', 0.7);
    mass.boulder = [];
    heroModel('boulder', ROCK_CLUSTER_MODELS, bouldersByTier.low, 1.9, { jitterScale: 0.9, groundRadius: 0.5, sink: 0.22, cullFactor: 1.4 });
    heroModel('boulder', ROCK_CLUSTER_MODELS, bouldersByTier.high, 3.2, { jitterScale: 0.9, groundRadius: 0.5, sink: 0.22, cullFactor: 1.4 });

    // ---- Stilisierte Masse -------------------------------------------------
    const built = buildNatureMass(mass, {
      viewDistance: profile.vegetationViewDistance,
      smallPropDistance: profile.smallPropCullDistance,
      claimShadow,
    });
    target.add(built.group);
    lod.push(...built.lod);
    // Geteilte Geometrie/Material dürfen beim nächsten Neuaufbau NICHT
    // freigegeben werden — sonst stünde die zweite Runde ohne Formen da.
    for (const resource of natureSharedResources()) cacheOwned.add(resource);
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
    this.rebuildRoadNetworkSurface();
    this.rebuildRoadSupports();
    this.rebuildCityLights();
    this.rebuildCoverageOverlay();
    this.rebuildVegetation();
    this.seedCars();
    this.seedAnimals();
  }

  /**
   * Baut das vorhandene Raster-Straßennetz als durchgehende, abgerundete
   * Oberfläche. Kachelmittelpunkte bleiben die einzige Datenquelle; Catmull-
   * Kurven glätten ausschließlich die sichtbare Verbindung zwischen ihnen.
   * Zwei Meshes für das gesamte Bodennetz ersetzen die vielen schwarzen
   * Einzelplatten und hohen weißen Kachel-Bordsteine.
   */
  private rebuildRoadNetworkSurface(): void {
    type RoadNode = { key: string; x: number; z: number; half: number };
    const nodes = new Map<string, RoadNode>();
    const allRoads = new Map<string, RoadNode>();
    for (const building of Object.values(this.controller.state.buildings)) {
      const def = this.controller.config.buildings.get(building.defId);
      if (!def || def.category !== 'roads') continue;
      const key = `${building.x},${building.y}`;
      const node = {
        key,
        x: building.x + 0.5,
        z: building.y + 0.5,
        half: ROAD_SPECS[roadClassFor(def.id)].half,
      };
      allRoads.set(key, node);
      const terrain = worldTerrainAt(this.controller.state, building.x, building.y);
      if (def.id === 'road_elevated' || terrain === 'water' || terrain === 'river') continue;
      nodes.set(key, node);
    }
    const key = [...nodes.values()]
      .map((node) => `${node.key}:${node.half}`)
      .sort()
      .join('|');
    if (key === this.roadSurfaceKey) return;
    this.roadSurfaceKey = key;
    this.clearOwnedGroup(this.roadSurfaceGroup);
    if (nodes.size === 0) return;

    const offsets = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ] as const;
    const neighbours = (node: RoadNode): RoadNode[] =>
      offsets
        .map(([dx, dz]) => nodes.get(`${node.x - 0.5 + dx},${node.z - 0.5 + dz}`))
        .filter((candidate): candidate is RoadNode => candidate !== undefined);
    const edgeKey = (a: RoadNode, b: RoadNode): string =>
      a.key < b.key ? `${a.key}>${b.key}` : `${b.key}>${a.key}`;
    const visited = new Set<string>();
    const chains: RoadNode[][] = [];
    const walk = (start: RoadNode, first: RoadNode): RoadNode[] => {
      const chain = [start];
      let previous = start;
      let current = first;
      let guard = nodes.size + 4;
      visited.add(edgeKey(start, first));
      while (guard-- > 0) {
        chain.push(current);
        const nextOptions = neighbours(current).filter(
          (candidate) => candidate.key !== previous.key && !visited.has(edgeKey(current, candidate)),
        );
        if (neighbours(current).length !== 2 || nextOptions.length === 0) break;
        const next = nextOptions[0]!;
        visited.add(edgeKey(current, next));
        previous = current;
        current = next;
      }
      return chain;
    };

    // Erst echte Enden/Kreuzungen, danach geschlossene Ringe ohne Endpunkt.
    for (const node of nodes.values()) {
      if (neighbours(node).length === 2) continue;
      for (const next of neighbours(node)) {
        if (!visited.has(edgeKey(node, next))) chains.push(walk(node, next));
      }
    }
    for (const node of nodes.values()) {
      for (const next of neighbours(node)) {
        if (!visited.has(edgeKey(node, next))) chains.push(walk(node, next));
      }
    }

    const shoulderPositions: number[] = [];
    const asphaltPositions: number[] = [];
    for (const chain of chains) {
      if (chain.length < 2) continue;
      const points = roundedRoadPolyline(chain, 0.27, 4);
      const half = Math.max(...chain.map((node) => node.half));
      appendRoadRibbonTriangles(shoulderPositions, points, half + 0.13, 0.052, terrainHeightAt);
      appendRoadRibbonTriangles(asphaltPositions, points, half, 0.068, terrainHeightAt);
    }
    // Übergänge zu Brücken- und Höhenstraßen reichen bis an deren Deck. Die
    // Rundscheibe des letzten Bodenknotens allein endet deutlich vorher.
    for (const node of nodes.values()) {
      for (const [dx, dz] of offsets) {
        const neighbour = allRoads.get(`${node.x - 0.5 + dx},${node.z - 0.5 + dz}`);
        if (!neighbour || nodes.has(neighbour.key)) continue;
        const connector = roadTileEdgeConnector(node, dx, dz);
        const half = Math.max(node.half, neighbour.half);
        appendRoadRibbonTriangles(shoulderPositions, connector, half + 0.13, 0.052, terrainHeightAt);
        appendRoadRibbonTriangles(asphaltPositions, connector, half, 0.068, terrainHeightAt);
      }
    }
    for (const node of nodes.values()) {
      appendRoadDiscTriangles(shoulderPositions, node, node.half + 0.13, 0.052, terrainHeightAt);
      appendRoadDiscTriangles(asphaltPositions, node, node.half, 0.068, terrainHeightAt);
    }

    const makeSurface = (positions: number[], material: MeshStandardMaterial, order: number): Mesh => {
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
      // Die geglättete Netzgeometrie besitzt keine Kachel-UVs. Eine stabile
      // World-Space-Projektion macht die neue richtungsneutrale Wegtextur auf
      // Kurven und Kreuzungen trotzdem nahtlos nutzbar.
      const uv = new Float32Array((positions.length / 3) * 2);
      for (let positionIndex = 0, uvIndex = 0; positionIndex < positions.length; positionIndex += 3, uvIndex += 2) {
        uv[uvIndex] = positions[positionIndex]! * 0.24;
        uv[uvIndex + 1] = positions[positionIndex + 2]! * 0.24;
      }
      geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
      geometry.computeVertexNormals();
      const mesh = new Mesh(geometry, material);
      mesh.receiveShadow = true;
      mesh.renderOrder = order;
      // Sicherheitsnetz für extreme Geländegradienten und alte Grafiktreiber:
      // Die korrekte Oberseite bleibt FrontSide, die schmale Unterseite darf
      // dennoch sichtbar bleiben, statt ein ganzes Netz verschwinden zu lassen.
      material.side = DoubleSide;
      return mesh;
    };
    const mats = this.getRoadMats();
    this.roadSurfaceGroup.add(
      makeSurface(shoulderPositions, mats.groundShoulder, 3),
      makeSurface(asphaltPositions, mats.groundPath, 4),
    );
  }

  /**
   * Höhenstraßen-Stützen als zwei globale InstancedMeshes. Das erhöht die
   * visuelle Glaubwürdigkeit, ohne die Kosten mit der Straßenlänge in Draw-Calls
   * wachsen zu lassen. Wasserquerungen verwenden weiterhin buildBridgeDeck().
   */
  private rebuildRoadSupports(): void {
    const elevated = Object.values(this.controller.state.buildings).filter((building) => {
      if (building.defId !== 'road_elevated') return false;
      const terrain = worldTerrainAt(this.controller.state, building.x, building.y);
      return terrain !== 'water' && terrain !== 'river';
    });
    const key = elevated
      .map((building) => `${building.id}:${building.x},${building.y}:${this.roadNeighborMask(building.x, building.y)}`)
      .sort()
      .join('|');
    if (key === this.roadSupportKey) return;
    this.roadSupportKey = key;
    this.clearOwnedGroup(this.roadSupportGroup);
    if (elevated.length === 0) return;

    const columnGeometry = new CylinderGeometry(0.075, 0.11, 0.64, 8);
    const columnMaterial = new MeshStandardMaterial({ color: 0x9a927f, roughness: 0.92, metalness: 0.04 });
    const columns = new InstancedMesh(columnGeometry, columnMaterial, elevated.length * 2);
    const beamGeometry = new BoxGeometry(0.78, 0.11, 0.12);
    const beamMaterial = new MeshStandardMaterial({ color: 0x79766e, roughness: 0.94, metalness: 0.06 });
    const beams = new InstancedMesh(beamGeometry, beamMaterial, elevated.length);
    const dummy = new Object3D();
    let columnIndex = 0;

    elevated.forEach((building, index) => {
      const x = building.x + 0.5;
      const z = building.y + 0.5;
      const ground = terrainHeightAt(x, z);
      const mask = this.roadNeighborMask(building.x, building.y);
      const horizontal = Boolean(mask & (2 | 8)) && !(mask & (1 | 4));
      for (const side of [-1, 1]) {
        dummy.position.set(
          x + (horizontal ? 0 : side * 0.27),
          ground + 0.32,
          z + (horizontal ? side * 0.27 : 0),
        );
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        columns.setMatrixAt(columnIndex++, dummy.matrix);
      }
      dummy.position.set(x, ground + 0.59, z);
      dummy.rotation.set(0, horizontal ? Math.PI / 2 : 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      beams.setMatrixAt(index, dummy.matrix);
    });
    columns.instanceMatrix.needsUpdate = true;
    beams.instanceMatrix.needsUpdate = true;
    columns.castShadow = true;
    columns.receiveShadow = true;
    beams.castShadow = true;
    beams.receiveShadow = true;
    this.roadSupportGroup.add(columns, beams);
  }

  /**
   * Baut physisch verankerte Straßenlaternen. Die frühere Fenster-Heuristik
   * legte leuchtende Rechtecke anhand theoretischer Footprint-Abmessungen in die
   * Luft; echte GLBs besitzen dort nicht zwingend eine Fassade. Deshalb gibt es
   * Licht nur noch an einem sichtbaren Mast und der Bodenreflex teilt exakt
   * dessen terrainabgetastete Position.
   */
  private rebuildCityLights(): void {
    const roads = Object.values(this.controller.state.buildings).filter((building) => {
      const def = this.controller.config.buildings.get(building.defId);
      if (!def || def.category !== 'roads' || def.id === 'road_elevated') return false;
      const terrain = worldTerrainAt(this.controller.state, building.x, building.y);
      return terrain !== 'water' && terrain !== 'river';
    });
    const key = roads
      .map((building) => `${building.id}:${building.x},${building.y}:${this.roadNeighborMask(building.x, building.y)}`)
      .sort()
      .join('|');
    if (key === this.cityLightKey) return;
    this.cityLightKey = key;
    this.clearOwnedGroup(this.cityLightGroup);
    this.streetLampHeadMesh = undefined;
    this.streetGlowMesh = undefined;

    const directions = [
      { bit: 1, dx: 0, dz: -1 },
      { bit: 2, dx: 1, dz: 0 },
      { bit: 4, dx: 0, dz: 1 },
      { bit: 8, dx: -1, dz: 0 },
    ] as const;
    const lamps = roads.flatMap((road) => {
      const mask = this.roadNeighborMask(road.x, road.y);
      const open = directions.filter((direction) => !(mask & direction.bit));
      if (open.length === 0 || hash01(`${road.x},${road.y}:lamp`) >= 0.13) return [];
      const side = open[Math.floor(hash01(`${road.x},${road.y}:side`) * open.length)]!;
      const x = road.x + 0.5 + side.dx * 0.43;
      const z = road.y + 0.5 + side.dz * 0.43;
      return [{ x, z, y: terrainHeightAt(x, z) + 0.075 }];
    });
    if (lamps.length > 0) {
      const dummy = new Object3D();
      const post = new InstancedMesh(
        new CylinderGeometry(0.022, 0.032, 0.72, 7),
        new MeshStandardMaterial({ color: 0x34383c, roughness: 0.78, metalness: 0.34 }),
        lamps.length,
      );
      const headMaterial = new MeshStandardMaterial({
        color: 0x7c6a45,
        emissive: 0xffb84f,
        emissiveIntensity: 0.08,
        roughness: 0.46,
      });
      const heads = new InstancedMesh(new SphereGeometry(0.045, 8, 6), headMaterial, lamps.length);
      const glowMaterial = new MeshBasicMaterial({
        color: 0xffbd55,
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        side: DoubleSide,
        toneMapped: false,
      });
      const glows = new InstancedMesh(new CircleGeometry(0.27, 18), glowMaterial, lamps.length);
      lamps.forEach((lamp, index) => {
        dummy.position.set(lamp.x, lamp.y + 0.36, lamp.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        post.setMatrixAt(index, dummy.matrix);
        dummy.position.set(lamp.x, lamp.y + 0.735, lamp.z);
        dummy.updateMatrix();
        heads.setMatrixAt(index, dummy.matrix);
        dummy.position.set(lamp.x, lamp.y + 0.008, lamp.z);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.updateMatrix();
        glows.setMatrixAt(index, dummy.matrix);
      });
      post.instanceMatrix.needsUpdate = true;
      heads.instanceMatrix.needsUpdate = true;
      glows.instanceMatrix.needsUpdate = true;
      post.castShadow = true;
      heads.renderOrder = 5;
      glows.renderOrder = 3;
      this.streetLampHeadMesh = heads;
      this.streetGlowMesh = glows;
      this.cityLightGroup.add(post, heads, glows);
    }
    this.updateNightLighting();
  }

  /** Ein Material-Update pro Frame statt hunderter dynamischer Lichter. */
  private updateNightLighting(): void {
    // SkyEnvironment führt bei aktivem Zyklus eine eigene fortgeschriebene Zeit.
    // Lampen und Straßen müssen exakt dieselbe Uhr lesen wie Sonne und Himmel.
    const elevation = sunElevation(this.env?.timeOfDay ?? getEnvironmentSettings().timeOfDay);
    const night = 1 - MathUtils.smoothstep(elevation, -0.14, 0.2);
    if (this.streetLampHeadMesh) {
      const material = this.streetLampHeadMesh.material as MeshStandardMaterial;
      material.emissiveIntensity = 0.08 + night * 1.55;
    }
    if (this.streetGlowMesh) {
      const material = this.streetGlowMesh.material as MeshBasicMaterial;
      material.opacity = night * 0.06;
      this.streetGlowMesh.visible = night > 0.025;
    }
    if (this.roadMats) {
      this.roadMats.asphalt.emissiveIntensity = 0.06 + night * 0.14;
      this.roadMats.mountain.emissiveIntensity = 0.04 + night * 0.1;
      this.roadMats.groundPath.emissiveIntensity = 0.035 + night * 0.08;
      this.roadMats.groundShoulder.emissiveIntensity = 0.025 + night * 0.055;
    }
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
      // § Säule B: Tierbudget folgt der Qualitätsstufe (gedeckelt durch die harte
      // Draw-Call-Grenze ANIMAL_CAP). Reine Darstellung — keine Simulationswirkung.
      const animalBudget = Math.min(ANIMAL_CAP, getGraphicsProfile().animalBudget);
      for (let i = 0; i < count && total < animalBudget; i++, total++) {
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
    const surface = samplePlacementSurface(this.controller.state, b.x, b.y, def.size.w, def.size.h);
    // Gebäude bleiben waagerecht. Kleine Footprint-Unterschiede gleicht ein
    // sichtbarer Sockel bis zur tiefsten Stelle aus; Straßen folgen weiterhin
    // ihrer eigenen geglätteten Längskurve.
    // Höhenstraßen-Brücken (§ Infrastruktur 2.0 / I1): über Wasser/Fluss liegt der
    // Deckansatz auf der Wasseroberfläche (`WATER_LEVEL`), nicht auf dem tiefen
    // Wasserboden — sonst versänke das Brückendeck. `buildRoad` erkennt dieselbe
    // Wasserlage und baut Deck + Geländer + Pfeiler.
    const roadTerrain = def.category === 'roads' ? worldTerrainAt(this.controller.state, b.x, b.y) : undefined;
    const roadOverWater = roadTerrain === 'water' || roadTerrain === 'river';
    const baseY = def.category === 'roads'
      ? (roadOverWater ? WATER_LEVEL : terrainHeightAt(cx, cz))
      : surface.maxHeight + 0.04;
    group.position.set(cx, baseY, cz);

    const constructing = b.status === 'constructing' && b.targetUpgradeLevel === undefined;
    const node: BuildingNode = { group, sig };

    // Roads/bridges have their own drop-in path (segment model by neighbour mask,
    // bridge model over water), so they never touch the building-model resolution
    // or the cosmetic facing below (their orientation comes from the road mask).
    if (def.category === 'roads') {
      this.buildRoad(group, def, b, roadMask);
      return node;
    }

    // § Map Flattening C3 — Sockel als Stützmauer. Seit Phase C darf ein
    // Footprint deutlich mehr Höhenunterschied überspannen (`footprintHeightBudget`).
    // Ein einzelner, exakt bis `minHeight` reichender Kasten sähe dabei an der
    // Talseite abgeschnitten aus, weil das Gelände AUSSERHALB des Footprints noch
    // weiter abfällt. Deshalb reicht das Fundament bis unter den tiefsten Punkt
    // eines Rings um das Gebäude — nichts schwebt, nichts klafft (§4.1/§8) —
    // und wird ab einer sichtbaren Höhe als abgetreppte Mauer gebaut statt als
    // glatter Block (§4.3 „terrassierte Platzierung/Stützmauern").
    const skirtRadius = Math.max(def.size.w, def.size.h) / 2 + 0.7;
    const groundLow = Math.min(surface.minHeight, terrainMinHeightAround(cx, cz, skirtRadius));
    const foundationDepth = plinthDepthFor(baseY - groundLow);
    const steps = foundationDepth > 0.9 ? 3 : foundationDepth > 0.5 ? 2 : 1;
    for (let step = 0; step < steps; step++) {
      const stepDepth = foundationDepth / steps;
      // Jede tiefere Stufe steht etwas weiter vor: das liest sich als Sockel mit
      // Mauerfuß statt als Kiste, und die unterste Stufe deckt den Übergang zum
      // umliegenden Gelände sicher ab.
      const spread = 0.94 + step * 0.05;
      const tier = new Mesh(
        new BoxGeometry(def.size.w * spread, stepDepth, def.size.h * spread),
        FOUNDATION_MATERIAL,
      );
      tier.position.y = -stepDepth * (step + 0.5);
      tier.receiveShadow = true;
      group.add(tier);
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
    opts: FitOpts & {
      cap?: number;
      jitterScale?: number;
      jitterRot?: boolean;
      jitterPosition?: number;
      yBase?: number;
      /** Erdet auf dem tiefsten Boden im Umkreis (Kacheln) statt auf dem Mittelpunkt. */
      groundRadius?: number;
      /** Zusätzliches Eingraben in den Hang (Kacheln), skaliert mit der Instanz. */
      sink?: number;
      /** Sichtweite echter Detailmodelle; aktiviert räumliche Instanz-Chunks. */
      cullDistance?: number;
    },
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
    // § Overhaul 8.0 / §16: Die Deckelung darf NIE vom Arrayindex abhängen —
    // eine wachsende Liste (Region-Unlock) veränderte sonst die Schrittweite und
    // damit sämtliche überlebenden Kacheln. `selectPropTiles` wählt stabil über
    // den Positions-Hash. Vegetation ist zusätzlich bereits PRO REGION
    // budgetiert und übergibt deshalb `cap: undefined`.
    const cap = opts.cap;
    const list = cap !== undefined && tiles.length > cap ? selectPropTiles(url, tiles, cap) : tiles;
    const yBase = opts.yBase ?? 0;
    // Erdung: `groundRadius` erdet auf dem TIEFSTEN Boden unter der eigenen
    // Grundfläche. Ohne das sitzt ein starres Modell auf der Höhe seines
    // Mittelpunkts und schwebt am Hang mit der bergab liegenden Kante frei.
    const groundRadius = opts.groundRadius ?? 0;
    const sink = opts.sink ?? 0;
    const groundAt = (gx: number, gz: number, sc: number): number =>
      (groundRadius > 0 ? terrainMinHeightAround(gx, gz, groundRadius * sc) : terrainHeightAt(gx, gz)) +
      yBase -
      sink * sc;
    const chunks = opts.cullDistance ? spatialPropChunks(list) : [list];
    const registerDistanceLod = (object: Object3D, chunk: readonly { x: number; y: number }[]): void => {
      if (!opts.cullDistance || chunk.length === 0) return;
      this.vegetationDistanceLod.push({
        object,
        centerX: chunk.reduce((sum, tile) => sum + tile.x + 0.5, 0) / chunk.length,
        centerZ: chunk.reduce((sum, tile) => sum + tile.y + 0.5, 0) / chunk.length,
        maxDistance: opts.cullDistance,
      });
    };

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
      if (this.destroyed || stale()) {
        geo.dispose();
        return;
      }
      for (const chunk of chunks) {
        const inst = new InstancedMesh(geo, mat, chunk.length);
        inst.castShadow = opts.castShadow ?? true;
        inst.receiveShadow = true;
        for (let i = 0; i < chunk.length; i++) {
          const t = chunk[i]!;
          const j = hash01(`${t.x}.${t.y}`);
          const jx = (hash01(`jx:${t.x}.${t.y}`) - 0.5) * (opts.jitterPosition ?? 0);
          const jz = (hash01(`jz:${t.x}.${t.y}`) - 0.5) * (opts.jitterPosition ?? 0);
          const sc = opts.jitterScale ? 1 - opts.jitterScale / 2 + j * opts.jitterScale : 1;
          dummy.position.set(t.x + 0.5 + jx, groundAt(t.x + 0.5 + jx, t.y + 0.5 + jz, sc), t.y + 0.5 + jz);
          dummy.rotation.set(0, opts.jitterRot ? j * Math.PI * 2 : (opts.rotationY ?? 0), 0);
          dummy.scale.setScalar(sc);
          dummy.updateMatrix();
          inst.setMatrixAt(i, dummy.matrix);
        }
        inst.instanceMatrix.needsUpdate = true;
        inst.computeBoundingSphere();
        group.add(inst);
        registerDistanceLod(inst, chunk);
      }
      return;
    }

    // General path: clone the fitted model per tile.
    for (const chunk of chunks) {
      const chunkGroup = opts.cullDistance ? new Group() : group;
      if (chunkGroup !== group) group.add(chunkGroup);
      for (const t of chunk) {
        const j = hash01(`${t.x}.${t.y}`);
        const jx = (hash01(`jx:${t.x}.${t.y}`) - 0.5) * (opts.jitterPosition ?? 0);
        const jz = (hash01(`jz:${t.x}.${t.y}`) - 0.5) * (opts.jitterPosition ?? 0);
        const clone = probe.clone(true);
        const sc = opts.jitterScale ? 1 - opts.jitterScale / 2 + j * opts.jitterScale : 1;
        clone.position.set(t.x + 0.5 + jx, groundAt(t.x + 0.5 + jx, t.y + 0.5 + jz, sc), t.y + 0.5 + jz);
        clone.rotation.y = opts.jitterRot ? j * Math.PI * 2 : (opts.rotationY ?? 0);
        clone.scale.multiplyScalar(sc);
        clone.traverse((o) => {
          if ((o as Mesh).isMesh) {
            o.castShadow = opts.castShadow ?? true;
            o.receiveShadow = true;
          }
        });
        chunkGroup.add(clone);
      }
      registerDistanceLod(chunkGroup, chunk);
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
    const elevated = def.id === 'road_elevated';

    if (overWater) {
      const rot = mask & 2 || mask & 8 ? (mask & 1 || mask & 4 ? 0 : Math.PI / 2) : 0;
      this.buildBridgeDeck(holder, rot, this.waterSpanAt(b.x, b.y));
      return;
    }

    if (!elevated) {
      // Die sichtbare Bodenstraße wird netzweit in
      // rebuildRoadNetworkSurface() geglättet. Dieses transparente Pad bewahrt
      // Auswahl/Raycast pro Simulationskachel, ohne wieder schwarze Platten oder
      // hohe Bordsteinblöcke einzuführen.
      const pickPad = new Mesh(
        new BoxGeometry(0.96, 0.025, 0.96),
        new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
      );
      pickPad.position.y = 0.055;
      holder.add(pickPad);
      this.fitRoadToTerrain(holder, b.x + 0.5, b.y + 0.5, false);
      return;
    }

    this.buildRoadTile(holder, mask, cls, terrain, b.x, b.y);
    // Die bestehende Höhenstraße erhält endlich eine eindeutige, glaubwürdige
    // Silhouette: Deck anheben, lokale Neigung beibehalten, Stützen separat und
    // instanziert in rebuildRoadSupports(). Gameplay/Route bleiben unverändert.
    if (elevated) holder.position.y = 0.62;
    // Straßen dürfen niemals schweben (§ Gelände-Anpassung): tilt the tile to the
    // local ground gradient and skirt its edges, so neighbouring segments on
    // sloped land (forest/grass) never show a floating gap or step.
    this.fitRoadToTerrain(holder, b.x + 0.5, b.y + 0.5, !elevated);
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
  private fitRoadToTerrain(holder: Group, cx: number, cz: number, addSkirt = true): void {
    const MAX_TILT = 0.35; // ≈20°, keeps steep noise spikes from flipping the deck
    const dHdx = terrainHeightAt(cx + 0.5, cz) - terrainHeightAt(cx - 0.5, cz);
    const dHdz = terrainHeightAt(cx, cz + 0.5) - terrainHeightAt(cx, cz - 0.5);
    holder.rotation.z = MathUtils.clamp(Math.atan(dHdx), -MAX_TILT, MAX_TILT);
    holder.rotation.x = MathUtils.clamp(-Math.atan(dHdz), -MAX_TILT, MAX_TILT);

    if (addSkirt) {
      const skirtMat = new MeshStandardMaterial({ color: 0x5b4a3a, roughness: 1 });
      const skirtDepth = 0.22;
      const skirt = new Mesh(new BoxGeometry(1.02, skirtDepth, 1.02), skirtMat);
      skirt.position.y = -skirtDepth / 2;
      skirt.receiveShadow = true;
      holder.add(skirt);
    }
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
      // Das gebündelte Straßennetz besitzt keine kachelweisen UVs. Deshalb
      // erhält es eigene, warme Miniaturwelt-Materialien statt einer dunklen,
      // auf undefinierte UVs gemappten Asphaltfotografie.
      groundPath: new MeshStandardMaterial({
        color: 0xf1d8b4,
        roughness: 0.98,
        metalness: 0,
        emissive: 0x4a321c,
        emissiveIntensity: 0.05,
      }),
      groundShoulder: new MeshStandardMaterial({
        color: 0xcdb78f,
        roughness: 1,
        metalness: 0,
        emissive: 0x40331f,
        emissiveIntensity: 0.035,
      }),
      // § A5: Asphalt spürbar aufgehellt (vorher 0x474d57 „zu schwarz"). Da die
      // Drop-in-Textur `road_asphalt` die Farbe nur MULTIPLIZIERT (also nie
      // aufhellen kann), hebt ein dezenter Emissiv-Term die Schwärze — Fahrbahn
      // bleibt gut lesbar, auch nachts (leichte Eigenhelligkeit ist erwünscht).
      asphalt: new MeshStandardMaterial({ color: 0x999a96, roughness: 0.94, emissive: 0x282a2a, emissiveIntensity: 0.06 }),
      mountain: new MeshStandardMaterial({ color: 0x9b8c76, roughness: 0.99, emissive: 0x29231d, emissiveIntensity: 0.04 }),
      edge: new MeshStandardMaterial({ color: 0xa2947e, roughness: 1 }),
      dash: new MeshStandardMaterial({ color: 0xe7d7a7, roughness: 0.95, transparent: true }),
      roundabout: new MeshStandardMaterial({ color: 0x666b70, roughness: 0.94 }),
      bridgeDeck: new MeshStandardMaterial({ color: 0x777a7a, roughness: 0.9, metalness: 0.08 }),
      boardwalk: new MeshStandardMaterial({ color: 0x8a6540, roughness: 0.86 }),
      sidewalk: new MeshStandardMaterial({ color: 0x9d9484, roughness: 0.98 }),
    };
    // Diese Materialien werden von allen Straßenkacheln und vom gebündelten
    // Netzmesh geteilt. Einzelne Building-Rebuilds dürfen sie nicht entsorgen.
    Object.values(mats).forEach((material) => cacheOwned.add(material));
    this.roadMats = mats;
    this.applyRoadTex(loadRoadTexture('road_path_cartoon'), mats.groundPath);
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

    // Laternen werden netzweit in rebuildCityLights() an exakt derselben
    // terrainabgetasteten Position instanziert. Pro-Kachel-Lampen würden auf
    // geneigten/angehobenen Holdern erneut doppelte oder schwebende Köpfe erzeugen.
    void gx;
    void gz;
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

    if (def.waterfront && !constructing) {
      g.add(...waterfrontBuildingProc(def));
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
      const start = path[0]!;
      const end = path[path.length - 1]!;
      const mesh = makeCarMesh(`${start.x},${start.y}:${end.x},${end.y}:${this.cars.length}`);
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
      car.mesh.position.set(cx + rx, terrainHeightAt(cx, cz) + VEHICLE_ROAD_CLEARANCE, cz + rz);
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
    v.mesh.position.set(vanX, terrainHeightAt(vanX, vanZ) + VEHICLE_ROAD_CLEARANCE, vanZ);
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

  /** Erstes radiusfähiges Effect-Profil für die Bauvorschau. */
  private placementCoverage(def: BuildingDef): { radius: number; color: number } | undefined {
    const colorForNeed = (need: string): number => {
      if (need === 'water' || need === 'freshwater') return 0x55cbed;
      if (need === 'food') return 0xf1b24a;
      if (need === 'leisure') return 0x68da8d;
      if (need === 'safety' || need === 'health') return 0xff7662;
      return 0xb18cff;
    };
    for (const effect of effectiveEffects(def, 0)) {
      if (effect.type === 'coverage' || effect.type === 'distribution') {
        return { radius: effect.radius, color: colorForNeed(effect.need) };
      }
      if (effect.type === 'capacity' && effect.radius !== undefined) {
        return { radius: effect.radius, color: colorForNeed(effect.need) };
      }
      if (effect.type === 'protection') return { radius: effect.radius, color: 0xff7662 };
    }
    return undefined;
  }

  /**
   * Terrainfolgende, weiche Kreisfläche mit präzisem Außenring. Mehrere
   * Radialstufen verhindern, dass die Fläche auf Hügeln als flache Scheibe durch
   * den Boden schneidet. `origin` erlaubt dieselbe Geometrie im absoluten
   * Coverage-Layer und relativ im Platzierungs-Ghost.
   */
  private addTerrainCoverageVisual(
    target: Group,
    cx: number,
    cz: number,
    radius: number,
    color: number,
    origin: { x: number; y: number; z: number },
    selected: boolean,
  ): void {
    const radialSteps = Math.max(4, Math.min(12, Math.ceil(radius / 2.4)));
    const segments = Math.max(64, Math.min(128, Math.ceil(radius * 8)));
    const positions: number[] = [];
    const addVertex = (r: number, angle: number): void => {
      const worldX = cx + Math.cos(angle) * r;
      const worldZ = cz + Math.sin(angle) * r;
      positions.push(
        worldX - origin.x,
        terrainHeightAt(worldX, worldZ) + 0.09 - origin.y,
        worldZ - origin.z,
      );
    };
    for (let radial = 0; radial < radialSteps; radial++) {
      const inner = (radial / radialSteps) * radius;
      const outer = ((radial + 1) / radialSteps) * radius;
      for (let segment = 0; segment < segments; segment++) {
        const a0 = (segment / segments) * Math.PI * 2;
        const a1 = ((segment + 1) / segments) * Math.PI * 2;
        addVertex(inner, a0);
        addVertex(outer, a0);
        addVertex(outer, a1);
        addVertex(inner, a0);
        addVertex(outer, a1);
        addVertex(inner, a1);
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    const fill = new Mesh(
      geometry,
      new MeshBasicMaterial({
        color,
        transparent: true,
        opacity: selected ? 0.115 : 0.065,
        depthWrite: false,
        side: DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    );
    fill.renderOrder = 11;
    target.add(fill);

    const ringPoints: Vector3[] = [];
    for (let segment = 0; segment <= segments; segment++) {
      const angle = (segment / segments) * Math.PI * 2;
      const worldX = cx + Math.cos(angle) * radius;
      const worldZ = cz + Math.sin(angle) * radius;
      ringPoints.push(
        new Vector3(
          worldX - origin.x,
          terrainHeightAt(worldX, worldZ) + 0.14 - origin.y,
          worldZ - origin.z,
        ),
      );
    }
    const ringGeometry = new BufferGeometry().setFromPoints(ringPoints);
    const ringMaterial = selected
      ? new LineBasicMaterial({ color, transparent: true, opacity: 0.98, depthTest: false })
      : new LineDashedMaterial({
          color,
          transparent: true,
          opacity: 0.62,
          dashSize: 0.75,
          gapSize: 0.42,
          depthTest: false,
        });
    const ring = new Line(ringGeometry, ringMaterial);
    if (!selected) ring.computeLineDistances();
    ring.renderOrder = 13;
    target.add(ring);
  }

  /**
   * Ein Radius-System für sämtliche Dienste. Die Simulation liefert Quellen,
   * Verbraucherzustände, Kapazität und Zählwerte; der Renderer projiziert nur.
   */
  private rebuildCoverageOverlay(): void {
    const overlay = this.selectedId ? this.controller.getCoverageOverlay(this.selectedId) : undefined;
    const key = overlay
      ? [
          this.selectedId,
          overlay.colorKey,
          overlay.underCapacity ? 1 : 0,
          overlay.capacity ? `${overlay.capacity.used}/${overlay.capacity.servable}` : '',
          overlay.sources.map((source) => `${source.x},${source.y}:${source.radius}:${source.selected ? 1 : 0}`).join(';'),
          overlay.consumers.map((consumer) => `${consumer.x},${consumer.y}:${consumer.state}`).join(';'),
        ].join('|')
      : '';
    if (key === this.coverageOverlayKey) return;
    this.coverageOverlayKey = key;
    this.clearOwnedGroup(this.coverageOverlayGroup);
    if (!overlay) {
      this.callbacks.onCoverageInfo(undefined);
      return;
    }

    const palette: Record<string, number> = {
      water: 0x55cbed,
      food: 0xf1b24a,
      leisure: 0x68da8d,
      protection: 0xff7662,
    };
    const color = palette[overlay.colorKey] ?? 0xb18cff;
    for (const source of overlay.sources) {
      this.addTerrainCoverageVisual(
        this.coverageOverlayGroup,
        source.x + source.w / 2,
        source.y + source.h / 2,
        source.radius,
        color,
        { x: 0, y: 0, z: 0 },
        source.selected,
      );
    }

    if (overlay.consumers.length > 0) {
      const geometry = new BoxGeometry(1, 0.07, 1);
      const material = new MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.52,
        depthWrite: false,
        depthTest: false,
      });
      const consumers = new InstancedMesh(geometry, material, overlay.consumers.length);
      const consumerColors = {
        source: 0xffffff,
        supplied: 0x55d98a,
        redundant: 0x5ea9f3,
        partial: 0xf0bd4f,
        unsupplied: 0xed625d,
      } as const;
      const dummy = new Object3D();
      overlay.consumers.forEach((consumer, index) => {
        const cx = consumer.x + consumer.w / 2;
        const cz = consumer.y + consumer.h / 2;
        const base = samplePlacementSurface(
          this.controller.state,
          consumer.x,
          consumer.y,
          consumer.w,
          consumer.h,
        ).maxHeight;
        dummy.position.set(cx, base + 0.13, cz);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(consumer.w + 0.24, 1, consumer.h + 0.24);
        dummy.updateMatrix();
        consumers.setMatrixAt(index, dummy.matrix);
        consumers.setColorAt(index, new Color(consumerColors[consumer.state]));
      });
      consumers.instanceMatrix.needsUpdate = true;
      if (consumers.instanceColor) consumers.instanceColor.needsUpdate = true;
      consumers.renderOrder = 14;
      this.coverageOverlayGroup.add(consumers);
    }

    this.callbacks.onCoverageInfo({
      label: t(overlay.labelKey),
      underCapacity: overlay.underCapacity,
      counts: overlay.counts,
      ...(overlay.capacity ? { capacity: overlay.capacity } : {}),
    });
  }

  /** Rendererprojektion des Controller-Netzes; keinerlei Routenlogik hier. */
  private rebuildInfrastructureOverlay(): void {
    this.disposeGroup(this.infrastructureOverlayGroup);
    this.infrastructureOverlayGroup.clear();
    const mode = this.infrastructureLayerMode;
    if (mode === 'off' || mode === 'problems') return;

    if (mode === 'all' || mode === 'roads' || mode === 'supply') {
      const roadTiles = [...this.controller.derived.roadNetwork].map((key) => key.split(',').map(Number) as [number, number]);
      if (roadTiles.length > 0) {
        const geometry = new BoxGeometry(0.82, 0.035, 0.82);
        const material = new MeshBasicMaterial({ color: 0xf0c45c, transparent: true, opacity: 0.56, depthWrite: false });
        const mesh = new InstancedMesh(geometry, material, roadTiles.length);
        const dummy = new Object3D();
        roadTiles.forEach(([x, y], index) => {
          dummy.position.set(x + 0.5, terrainHeightAt(x + 0.5, y + 0.5) + 0.1, y + 0.5);
          dummy.updateMatrix();
          mesh.setMatrixAt(index, dummy.matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
        mesh.renderOrder = 7;
        this.infrastructureOverlayGroup.add(mesh);
      }
    }

    const graph = this.controller.getWaterNavigationGraph();
    const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
    const showWater = mode === 'all' || mode === 'waterways' || mode === 'trade' || mode === 'supply';
    if (showWater) {
      const positions: number[] = [];
      for (const edge of graph.edges) {
        const from = nodeById.get(edge.from);
        const to = nodeById.get(edge.to);
        if (!from || !to) continue;
        const fromVisible = from.regionId === 0 || this.controller.state.world.regions[String(from.regionId)]?.status === 'unlocked';
        const toVisible = to.regionId === 0 || this.controller.state.world.regions[String(to.regionId)]?.status === 'unlocked';
        if (!fromVisible || !toVisible) continue;
        positions.push(
          from.position.x, WATER_LEVEL + 0.13, from.position.z,
          to.position.x, WATER_LEVEL + 0.13, to.position.z,
        );
      }
      if (positions.length > 0) {
        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
        const lines = new LineSegments(
          geometry,
          new LineBasicMaterial({ color: 0x45d7df, transparent: true, opacity: 0.24, depthWrite: false }),
        );
        lines.renderOrder = 6;
        this.infrastructureOverlayGroup.add(lines);
      }
    }

    const harbors = Object.values(this.controller.state.buildings).filter((building) =>
      this.controller.config.buildings.get(building.defId)?.waterfront !== undefined,
    );
    if (harbors.length > 0 && (mode === 'all' || mode === 'harbors' || mode === 'trade' || mode === 'supply')) {
      const ringGeometry = new CylinderGeometry(0.68, 0.68, 0.06, 24, 1, true);
      const ringMaterial = new MeshBasicMaterial({ color: 0x70ecf0, transparent: true, opacity: 0.82, depthWrite: false });
      const markers = new InstancedMesh(ringGeometry, ringMaterial, harbors.length);
      const dummy = new Object3D();
      harbors.forEach((harbor, index) => {
        const def = this.controller.config.buildings.get(harbor.defId)!;
        const x = harbor.x + def.size.w / 2;
        const z = harbor.y + def.size.h / 2;
        dummy.position.set(x, terrainHeightAt(x, z) + 0.16, z);
        dummy.updateMatrix();
        markers.setMatrixAt(index, dummy.matrix);
      });
      markers.instanceMatrix.needsUpdate = true;
      markers.renderOrder = 8;
      this.infrastructureOverlayGroup.add(markers);
    }

    if (harbors.length < 2 || !(mode === 'all' || mode === 'waterways' || mode === 'harbors' || mode === 'trade' || mode === 'supply')) return;
    const selectedHarbor = this.selectedId && harbors.some((harbor) => harbor.id === this.selectedId)
      ? this.selectedId
      : harbors[0]!.id;
    const connections = this.controller.getAvailableHarborConnections(selectedHarbor);
    const connection = connections.find((candidate) => candidate.status === 'planned') ?? connections[0];
    if (!connection) return;
    const preview = this.controller.getShippingRoutePreview(selectedHarbor, connection.harborId);
    if (!preview || preview.points.length < 2) return;
    const routeGeometry = new BufferGeometry().setFromPoints(
      preview.points.map((point) => new Vector3(point.x, WATER_LEVEL + 0.32, point.z)),
    );
    const routeMaterial = new LineDashedMaterial({
      color: preview.status === 'planned' ? 0x61eef1 : 0xf06b3d,
      transparent: true,
      opacity: 0.9,
      dashSize: 2.4,
      gapSize: 1.25,
      depthWrite: false,
    });
    const route = new Line(routeGeometry, routeMaterial);
    route.computeLineDistances();
    route.renderOrder = 9;
    this.infrastructureOverlayGroup.add(route);

    const arrowMaterial = new MeshBasicMaterial({ color: preview.status === 'planned' ? 0xa8ffff : 0xffa078 });
    for (let index = 4; index < preview.points.length; index += 5) {
      const previous = preview.points[index - 1]!;
      const point = preview.points[index]!;
      const arrow = new Mesh(new ConeGeometry(0.28, 0.72, 3), arrowMaterial);
      arrow.rotation.x = Math.PI / 2;
      arrow.rotation.z = -Math.atan2(point.z - previous.z, point.x - previous.x) - Math.PI / 2;
      arrow.position.set(point.x, WATER_LEVEL + 0.36, point.z);
      arrow.renderOrder = 10;
      this.infrastructureOverlayGroup.add(arrow);
    }
  }

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
          (marker === 'problem' || marker === 'road_problem' || marker === 'water_problem' || marker === 'partial_problem') &&
          (this.infoLayerMode === 'problems' ||
            this.infoLayerMode === 'needs' ||
            this.infoLayerMode === 'production' ||
            this.infoLayerMode === 'all')
        ) {
          kind = marker;
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
      road_problem: 1,
      water_problem: 1,
      partial_problem: 1,
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
      const essential = m.kind === 'activity' || m.kind === 'problem' || m.kind.endsWith('_problem');
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
      this.rebuildInfrastructureOverlay();
      this.updateMission();
    }

    // Advance camera: im Fahrmodus steuert das Fahrzeug die Verfolgerkamera,
    // sonst die normale Kamera-Eingabe (Tasten/Edge-Scroll).
    if (this.drive) this.updateDrive(dt);
    else this.input?.update(dt);
    this.cam.update(dt);
    this.writeCamera();
    // Beide Vegetationsaufbauten (freigeschaltet + gesperrt) teilen sich dieselbe
    // Distanzregel — sie liegen nur deshalb in getrennten Listen, weil sie zu
    // unterschiedlichen Zeitpunkten neu gebaut werden.
    for (const lodList of [this.vegetationDistanceLod, this.lockedVegetationLod]) {
      for (const lod of lodList) {
        const distance = Math.hypot(
          this.camera.position.x - lod.centerX,
          this.camera.position.z - lod.centerZ,
        );
        // Halbe Chunk-Diagonale verhindert sichtbares Aufpoppen an der Grenze.
        lod.object.visible = distance <= lod.maxDistance + 34;
      }
    }

    // § Overhaul 8.0 / §26: Alles, was die WELT zeigt (Tageszeit, Verkehr,
    // Missionsfahrt, Tiere, Rauch, Windräder), läuft in Simulationszeit — bei
    // Pause steht es still, bei 2×/4× läuft es passend schneller. Kamera,
    // Eingabe, Marker-Billboards und Wasserkräuseln bleiben bewusst in Echtzeit,
    // damit sich die Oberfläche auch in der Pause flüssig bedienen lässt.
    const simDt = dt * this.controller.getSpeed();

    // Living atmosphere: advance the day/night clock + ripple the water, and let
    // the lake pick up the current sky tint. Runs after the camera write so the
    // sky dome/sun follow the freshly-updated camera pose.
    this.env?.update(simDt);
    this.updateNightLighting();
    this.waterTime.value += dt;
    if (this.waterMat && this.env) this.waterMat.color.copy(this.env.waterColor);
    this.groundWetness.value = getEnvironmentSettings().weather === 'rain' ? 1 : 0;
    // § Säule B: Nahdetail (Grashalme) folgt der Qualitätsstufe statt einer festen
    // Distanz. Ferne Vegetation bleibt über Frustum-Culling der InstancedMeshes
    // günstig; die Kern-Dichte bleibt erhalten (nur die Repräsentation vereinfacht).
    const showNearVegetation = this.cam.getDist() < this.activeVegProfile.nearDetailDistance;
    for (const detail of this.nearVegetation) detail.visible = showNearVegetation;

    for (const node of this.nodes.values()) {
      if (node.rotor) node.rotor.rotation.z += simDt * 1.6;
    }
    this.animateSmoke(simDt);
    this.animateCars(simDt);
    this.animateAnimals(simDt);
    this.animateMission(simDt);
    this.updateWorkers();
    this.updateVehicles();
    this.animateMarkers();
    this.animateLockedRegionMarkers(dt);

    this.renderer.render(this.scene, this.camera);
    this.samplePerf(dt);
  }

  /** Gemeinsame Geometrie/Material der Betriebsarbeiter (einmalig, gepoolt). */
  private ensureWorkerAssets(): NonNullable<ThreeMapRenderer['workerAssets']> {
    if (!this.workerAssets) {
      this.workerAssets = {
        body: new CylinderGeometry(0.16, 0.2, 0.5, 6),
        head: new SphereGeometry(0.14, 8, 6),
        matWork: new MeshStandardMaterial({ color: 0xd9932f, roughness: 0.85, metalness: 0 }),
        matCarry: new MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.9, metalness: 0 }),
      };
    }
    return this.workerAssets;
  }

  /**
   * § Active Operations 2.0: zeichnet die Betriebsarbeiter an ihrer Sim-Tile-
   * Position (gepoolt, konstante Draw-Calls). Tile-Index → Weltmitte (+0.5, wie
   * die Gebäude). Zwischen den Sim-Ticks stehen die Figuren; die Bewegung kommt
   * aus der Simulation. Rein additiv — beeinflusst keine bestehende Darstellung.
   */
  private updateWorkers(): void {
    const states = this.controller.getWorkerRenderStates();
    if (states.length === 0 && this.workerPool.length === 0) return;
    const assets = this.ensureWorkerAssets();
    if (!this.workerGroup.parent) this.scene.add(this.workerGroup);
    while (this.workerPool.length < states.length) {
      const g = new Group();
      const body = new Mesh(assets.body, assets.matWork);
      body.position.y = 0.28;
      const head = new Mesh(assets.head, assets.matWork);
      head.position.y = 0.62;
      g.add(body, head);
      this.workerGroup.add(g);
      this.workerPool.push(g);
    }
    for (let i = 0; i < this.workerPool.length; i++) {
      const g = this.workerPool[i]!;
      const s = states[i];
      if (!s) { g.visible = false; continue; }
      const wx = s.x + 0.5;
      const wz = s.y + 0.5;
      g.position.set(wx, terrainHeightAt(wx, wz), wz);
      const carrying = s.status === 'returning' || s.status === 'blocked';
      (g.children[0] as Mesh).material = carrying ? assets.matCarry : assets.matWork;
      g.visible = true;
    }
  }

  private ensureVehicleAssets(): NonNullable<ThreeMapRenderer['vehicleAssets']> {
    if (!this.vehicleAssets) {
      this.vehicleAssets = {
        geometry: createStylizedVehicleGeometry('van', 'betriebslogistik'),
        mat: createStylizedVehicleMaterial(),
      };
    }
    return this.vehicleAssets;
  }

  /**
   * § A5 Transport: zeichnet laufende Lagertransporte als gepoolte Fahrzeuge an
   * ihrer interpolierten Sim-Position (getTransferRenderStates). Die Ausrichtung
   * folgt der Bewegungsrichtung zwischen zwei Frames. Rein additiv, konstante
   * Draw-Calls; keine Logik im Renderer (CLAUDE.md §1).
   */
  private updateVehicles(): void {
    const states = this.controller.getTransferRenderStates();
    if (states.length === 0 && this.vehiclePool.length === 0) return;
    const assets = this.ensureVehicleAssets();
    if (!this.vehicleGroup.parent) this.scene.add(this.vehicleGroup);
    while (this.vehiclePool.length < states.length) {
      const g = new Group();
      const vehicle = new Mesh(assets.geometry, assets.mat);
      vehicle.castShadow = true;
      vehicle.receiveShadow = true;
      g.add(vehicle);
      this.vehicleGroup.add(g);
      this.vehiclePool.push(g);
    }
    const seen = new Set<string>();
    for (let i = 0; i < this.vehiclePool.length; i++) {
      const g = this.vehiclePool[i]!;
      const s = states[i];
      if (!s) { g.visible = false; continue; }
      seen.add(s.id);
      const wx = s.x + 0.5;
      const wz = s.y + 0.5;
      g.position.set(wx, terrainHeightAt(wx, wz) + VEHICLE_ROAD_CLEARANCE, wz);
      const prev = this.vehicleLastPos.get(s.id);
      if (prev && (prev.x !== wx || prev.z !== wz)) g.rotation.y = Math.atan2(wx - prev.x, wz - prev.z);
      this.vehicleLastPos.set(s.id, { x: wx, z: wz });
      g.visible = true;
    }
    for (const id of this.vehicleLastPos.keys()) if (!seen.has(id)) this.vehicleLastPos.delete(id);
  }

  // § Säule B: gedrosselte Performance-Telemetrie fürs Dev-Panel (4 Hz). Liest
  // die Draw-Call-/Dreieckszahlen NACH dem Render (three füllt `info.render`
  // während `render()`). Reine Anzeige.
  private perfAccumTime = 0;
  private perfAccumFrames = 0;
  private perfEmitTimer = 0;
  private samplePerf(dt: number): void {
    this.perfAccumTime += dt;
    this.perfAccumFrames += 1;
    this.perfEmitTimer += dt;
    if (this.perfEmitTimer < 0.25) return;
    const r = this.renderer;
    if (!r) return;
    const fps = this.perfAccumFrames / Math.max(1e-3, this.perfAccumTime);
    let vegInstances = 0;
    let vegGroups = 0;
    // Beide Aufbauten zählen: freigeschaltete Stadt UND gesperrte Kulisse.
    // Sonst meldete das Panel nach v1.24 nur noch einen Bruchteil der Insel.
    for (const group of [this.vegetationGroup, this.lockedVegetationGroup]) {
      group.traverse((o) => {
        const inst = o as unknown as { isInstancedMesh?: boolean; count?: number };
        if (inst.isInstancedMesh) {
          vegGroups += 1;
          vegInstances += inst.count ?? 0;
        }
      });
    }
    setPerfStats({
      fps: Math.round(fps),
      drawCalls: r.info.render.calls,
      triangles: r.info.render.triangles,
      vegInstances,
      vegGroups,
      quality: this.activeVegProfile.level,
    });
    this.perfAccumTime = 0;
    this.perfAccumFrames = 0;
    this.perfEmitTimer = 0;
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

  /** Entsorgt nur die aktuell erzeugten Kinder, die persistente Szenengruppe
   * selbst bleibt registriert und kann im nächsten UI-Frame neu befüllt werden. */
  private clearOwnedGroup(group: Group): void {
    for (let index = group.children.length - 1; index >= 0; index--) {
      const child = group.children[index]!;
      group.remove(child);
      this.disposeGroup(child);
    }
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
    // § 12.2: Die Felswand war ein 1,65 × 3,9 × 0,72 großer Kasten — hochkant,
    // schmal, grau. Genau so las sie sich im Spiel: als Zacke. Eine Wand ist
    // breiter als hoch und hat eine Schulter; zwei versetzte Blöcke reichen
    // dafür und bleiben zwei Draw-Calls.
    const rock = new Mesh(new BoxGeometry(3.4, 2.5, 1.5), rockMat);
    rock.position.set(0, 1.25, 0.42);
    rock.rotation.z = -0.03;
    const shoulder = new Mesh(new BoxGeometry(2.2, 1.1, 1.15), rockMat);
    shoulder.position.set(-0.5, 2.35, 0.3);
    shoulder.rotation.z = 0.05;
    const fall = new Mesh(new PlaneGeometry(0.86, 2.4, 2, 7), waterMat);
    fall.position.set(0.08, 1.3, -0.36);
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
    group.add(rock, shoulder, fall, pool, mistA, mistB);
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
    // § 12.2: Vorher zwei aufrecht stehende Kästen (0,9 × 3,8) plus Deckel —
    // aus der Distanz zwei graue Zacken, und genau das hat der Spieltest
    // gemeldet. Ein Felstor ist BREITER als hoch; die Pfeiler sind gedrungen
    // und angeschrägt, der Bogen trägt sichtbar auf. Wird ohnehin ersetzt,
    // sobald ein echtes Modell (oder `rock_large`) geladen ist.
    const stone = new MeshStandardMaterial({ color: 0x8f8b7d, roughness: 1, flatShading: true });
    const left = new Mesh(new CylinderGeometry(1.15, 1.55, 1.95, 7), stone);
    const right = new Mesh(new CylinderGeometry(1.05, 1.45, 1.7, 7), stone);
    const crown = new Mesh(new BoxGeometry(4.6, 0.85, 1.7), stone);
    left.position.set(-1.55, 0.98, 0);
    left.rotation.z = -0.05;
    right.position.set(1.6, 0.85, 0.1);
    right.rotation.z = 0.06;
    crown.position.set(0, 2.15, 0.05);
    crown.rotation.z = -0.03;
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
/**
 * Drop-in-Fallback für die beiden Referenzhäfen. Front/Land liegt auf +Z,
 * Steg/Kai ragt nach −Z ins Wasser; ein gleichnamiges GLB ersetzt die Gruppe.
 */
function waterfrontBuildingProc(def: BuildingDef): Object3D[] {
  const parts: Object3D[] = [];
  const wood = new MeshStandardMaterial({ color: 0x79583a, roughness: 0.9 });
  const darkWood = new MeshStandardMaterial({ color: 0x4f3828, roughness: 1 });
  const stone = new MeshStandardMaterial({ color: 0x777b78, roughness: 0.95 });
  const roof = new MeshStandardMaterial({ color: 0x3d5960, roughness: 0.82 });
  const metal = new MeshStandardMaterial({ color: 0x474d52, roughness: 0.55, metalness: 0.35 });
  const waterDepth = def.waterfront?.waterDepth ?? 2;
  const deckWidth = (def.waterfront?.waterWidth ?? def.size.w) * 0.82;
  const quay = new Mesh(
    new BoxGeometry(deckWidth, 0.16, waterDepth + 0.7),
    def.id === 'river_port' ? stone : wood,
  );
  quay.position.set(0, 0.15, -def.size.h / 2 - waterDepth / 2 + 0.15);
  quay.castShadow = true;
  quay.receiveShadow = true;
  parts.push(quay);

  const buildingWidth = def.id === 'river_port' ? def.size.w * 0.54 : 1.1;
  const buildingDepth = def.id === 'river_port' ? def.size.h * 0.46 : 0.82;
  const buildingHeight = def.id === 'river_port' ? 1.85 : 0.9;
  const building = new Mesh(
    new BoxGeometry(buildingWidth, buildingHeight, buildingDepth),
    new MeshStandardMaterial({ color: def.id === 'river_port' ? 0xb99868 : 0x9c6b3d, roughness: 0.88 }),
  );
  building.position.set(-def.size.w * 0.12, buildingHeight / 2, def.size.h * 0.2);
  building.castShadow = true;
  parts.push(building);
  const cap = new Mesh(new ConeGeometry(buildingWidth * 0.62, 0.45, 4), roof);
  cap.rotation.y = Math.PI / 4;
  cap.position.set(building.position.x, buildingHeight + 0.2, building.position.z);
  cap.castShadow = true;
  parts.push(cap);

  const bollardCount = Math.max(2, Math.floor(deckWidth));
  for (let i = 0; i < bollardCount; i++) {
    const x = bollardCount === 1 ? 0 : -deckWidth * 0.4 + (i / (bollardCount - 1)) * deckWidth * 0.8;
    const bollard = new Mesh(new CylinderGeometry(0.06, 0.08, 0.28, 8), metal);
    bollard.position.set(x, 0.32, -def.size.h / 2 - waterDepth + 0.3);
    parts.push(bollard);
  }
  for (let i = 0; i < (def.id === 'river_port' ? 6 : 3); i++) {
    const crate = new Mesh(new BoxGeometry(0.32, 0.28, 0.32), darkWood);
    crate.position.set(
      (i % 3 - 1) * 0.38,
      0.14 + (i >= 3 ? 0.28 : 0),
      def.size.h * 0.34 - Math.floor(i / 3) * 0.34,
    );
    crate.castShadow = true;
    parts.push(crate);
  }

  if (def.id === 'river_port') {
    const mast = new Mesh(new CylinderGeometry(0.07, 0.09, 2.8, 8), metal);
    mast.position.set(def.size.w * 0.32, 1.4, -0.1);
    const arm = new Mesh(new BoxGeometry(1.25, 0.1, 0.1), metal);
    arm.position.set(def.size.w * 0.18, 2.72, -0.1);
    arm.rotation.z = -0.18;
    const hook = new Mesh(new CylinderGeometry(0.025, 0.025, 1.0, 6), metal);
    hook.position.set(-0.25, 2.2, -0.1);
    parts.push(mast, arm, hook);
  }

  return parts;
}

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

/** Gebündelter Cartoon-Kleinwagen mit stabiler Farbwahl, Fenstern, Rädern und
 * Fahrgestell. Ein reales `vehicles/car.glb` ersetzt ihn weiterhin per Drop-in. */
function makeCarMesh(seed: string): Group {
  return createStylizedVehicleFallback('car', seed);
}

// ---- § A6 Fahrmodus: Konstanten + Fahrzeug/Zielpfeil-Fallbacks --------------

const ANIMAL_CAP = 48; // § A7: Obergrenze aller Weidetiere (Draw-Call-Budget)
const DRIVE_KEYS: ReadonlySet<string> = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);
const DRIVE_ACCEL = 6.5; // Welt-Einheiten/s² (Tiles/s²)
const DRIVE_MAX_SPEED = 5.5; // Tiles/s
const DRIVE_STEER = 2.6; // rad/s bei voller Fahrt
const DRIVE_CAM_DIST = 8.5;
const DRIVE_CAM_PITCH = 0.64; // rad über der Horizontalen (Verfolgerblick von schräg oben)

/** Gebündeltes, typabhängig lesbares Missionsfahrzeug. Jede Variante bleibt ein
 * Draw-Call; ein passendes Drop-in-GLB ersetzt sie weiterhin automatisch. */
function makeMissionVehicle(vehicle: string | undefined): Group {
  return createStylizedVehicleFallback(vehicle, vehicle ?? 'van');
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
  residential: { half: 0.34, centerline: false },
  main: { half: 0.4, centerline: true },
  wide: { half: 0.45, centerline: true },
  industrial: { half: 0.42, centerline: false },
  boulevard: { half: 0.47, centerline: true },
};
function roadClassFor(defId: string): RoadClass {
  if (defId.includes('boulevard') || defId.includes('allee')) return 'boulevard';
  if (defId.includes('wide') || defId.includes('breit')) return 'wide';
  if (defId.includes('main') || defId.includes('haupt')) return 'main';
  if (defId.includes('industrial') || defId.includes('zufahrt')) return 'industrial';
  return 'residential';
}

type MarkerKind =
  | 'activity'
  | 'construction'
  | 'problem'
  | 'road_problem'
  | 'water_problem'
  | 'partial_problem'
  | 'upgrade'
  | 'need'
  | 'production';


const MARKER_STYLE: Record<
  MarkerKind,
  { color: string; glyph: 'exclaim' | 'road' | 'anchor' | 'network' | 'up' | 'wrench' | 'box' | 'heart' | 'factory' }
> = {
  activity: { color: '#2fd4d4', glyph: 'box' },
  construction: { color: '#f2c14e', glyph: 'wrench' },
  problem: { color: '#e5533b', glyph: 'exclaim' },
  road_problem: { color: '#dc4f43', glyph: 'road' },
  water_problem: { color: '#258fc2', glyph: 'anchor' },
  partial_problem: { color: '#e1a93a', glyph: 'network' },
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
    } else if (st.glyph === 'road') {
      ctx.strokeRect(-18, -36, 36, 38);
      ctx.setLineDash([8, 7]);
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.lineTo(0, 0);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (st.glyph === 'anchor') {
      ctx.beginPath();
      ctx.arc(0, -28, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(0, -2);
      ctx.moveTo(-18, -12);
      ctx.quadraticCurveTo(0, 8, 18, -12);
      ctx.moveTo(-18, -12);
      ctx.lineTo(-10, -12);
      ctx.moveTo(18, -12);
      ctx.lineTo(10, -12);
      ctx.stroke();
    } else if (st.glyph === 'network') {
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-17, -27);
      ctx.lineTo(17, -27);
      ctx.lineTo(0, -3);
      ctx.closePath();
      ctx.stroke();
      for (const [x, y] of [[-17, -27], [17, -27], [0, -3]] as const) {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
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

/** Große Navy/Gold-Tafel für eine noch gesperrte Weltregion. Sie bleibt als
 * Canvas-Fallback immer verfügbar; die Wolkendecke selbst darf kein UI-Asset
 * voraussetzen. */
/**
 * § World Overhaul 12.0 §10: Kompakter Marker OHNE Text — das ist der
 * Ruhezustand. Zwölf dauerhaft eingeblendete Regionsnamen haben den Blick auf die
 * Insel verdeckt; der Auftrag verlangt Namen nur „beim Hover, beim Öffnen der
 * Regionenkarte, beim Freischalten". Das Schloss bleibt sichtbar, damit die
 * Klickfläche und die Bedeutung („hier ist noch zu"), erhalten bleiben.
 */
function makeLockedRegionIconTexture(): CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 192;
  cv.height = 192;
  const ctx = cv.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.shadowColor = 'rgba(0,0,0,.55)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = 'rgba(6,22,33,.92)';
    ctx.strokeStyle = '#d89b27';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.roundRect(22, 14, 148, 164, 26);
    ctx.fill();
    ctx.stroke();
    ctx.shadowColor = 'transparent';
    // Schlossbügel + Korpus (identische Formensprache wie im vollen Marker).
    ctx.strokeStyle = '#f5e2ad';
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.arc(96, 78, 32, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#f5e2ad';
    ctx.beginPath();
    ctx.roundRect(57, 76, 78, 66, 11);
    ctx.fill();
    ctx.fillStyle = '#172b37';
    ctx.beginPath();
    ctx.arc(96, 101, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(91, 105, 10, 20);
  }
  const texture = new CanvasTexture(cv);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function makeLockedRegionMarkerTexture(regionName: string, levelLabel: string): CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 768;
  cv.height = 288;
  const ctx = cv.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.shadowColor = 'rgba(0,0,0,.58)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = 'rgba(6,22,33,.94)';
    ctx.strokeStyle = '#d89b27';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(22, 32, 724, 214, 28);
    ctx.fill();
    ctx.stroke();
    ctx.shadowColor = 'transparent';

    // Linkes Schloss-Wappen.
    ctx.fillStyle = 'rgba(16,38,51,.98)';
    ctx.strokeStyle = '#f0b53d';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(48, 55, 150, 168, 24);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#f5e2ad';
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.arc(123, 121, 34, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#f5e2ad';
    ctx.beginPath();
    ctx.roundRect(82, 119, 82, 68, 11);
    ctx.fill();
    ctx.fillStyle = '#172b37';
    ctx.beginPath();
    ctx.arc(123, 145, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(118, 149, 10, 20);

    const label = regionName.toLocaleUpperCase('de-DE');
    let nameSize = 50;
    ctx.font = `800 ${nameSize}px Inter, Arial, sans-serif`;
    while (nameSize > 30 && ctx.measureText(label).width > 500) {
      nameSize -= 2;
      ctx.font = `800 ${nameSize}px Inter, Arial, sans-serif`;
    }
    ctx.fillStyle = '#f8f3df';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 228, 112);
    ctx.font = '700 35px Inter, Arial, sans-serif';
    ctx.fillStyle = '#f2b43b';
    ctx.fillText(levelLabel.toLocaleUpperCase('de-DE'), 228, 169);

    // Goldene Statuslinie mit kleinem Diamant als visuelle Freischaltachse.
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.fillRect(228, 205, 472, 8);
    ctx.fillStyle = '#d89b27';
    ctx.fillRect(228, 205, 168, 8);
    ctx.save();
    ctx.translate(396, 209);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-8, -8, 16, 16);
    ctx.restore();
  }
  const texture = new CanvasTexture(cv);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

