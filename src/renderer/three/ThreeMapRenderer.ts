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
// models and reaches the full look purely by adding files (docs/3D_MODELS.md).

import {
  Box3,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Clock,
  Color,
  ConeGeometry,
  CylinderGeometry,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  Sprite,
  SpriteMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Material,
  type Object3D as TObject3D,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SkyEnvironment } from './SkyEnvironment.ts';
import { terrainHeightAt, WATER_LEVEL } from './terrainHeight.ts';
import { CameraController3D } from './CameraController3D.ts';
import { CameraInputController, type CameraInputHost } from './CameraInputController.ts';
import { worldCameraBounds, type CameraPreset } from './CameraConfig.ts';
import { getCameraSettings } from './cameraSettings.ts';
import type { GameController } from '../../game/commands/controller.ts';
import type { BuildingDef } from '../../game/config/types.ts';
import type { BuildingInstance, TerrainType } from '../../game/types.ts';
import { SECTOR_SIZE } from '../../game/map/world.ts';
import { validatePlacement } from '../../game/buildings/placement.ts';
import { locationBonusPct } from '../../game/buildings/location.ts';
import {
  buildingModel,
  buildingConstructionModel,
  terrainModel,
  roadModel,
  bridgeModel,
  propModel,
  markerModel,
  effectModel,
  vehicleModel,
  uiModel,
} from '../../assets/registry.ts';
import {
  TERRAIN_TILE_MODELS,
  MOUNTAIN_FEATURE_MODELS,
  TREE_MODELS,
  BUSH_MODELS,
  VEHICLE_CAR_MODELS,
  VAN_MODELS,
  SMOKE_EFFECT_MODELS,
  BRIDGE_MODELS,
  MARKER_MODELS,
  CONSTRUCTION_MODELS,
  UI_SELECTION_RING_MODELS,
  UI_UPGRADE_BUTTON_MODELS,
  UI_BUILD_BUTTON_MODELS,
} from '../../assets/modelManifest.ts';
import { CATEGORY_COLORS, TERRAIN_COLORS } from '../colors.ts';
import type { IMapRenderer, RendererCallbacks } from '../IMapRenderer.ts';

const MAX_SMOKE = 40;
const MAX_CARS = 10;

/** Default relative height per category when a def has no `visual.heightClass`. */
const CATEGORY_HEIGHT: Record<string, number> = {
  roads: 0.02,
  residential: 1.4,
  production: 1.2,
  services: 1.3,
  energy: 1.7,
  economy: 1.4,
  leisure: 0.5,
  government: 2.0,
  infrastructure: 1.0,
  decoration: 0.35,
  special: 1.7,
};

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

/** Small deterministic hash → 0..1, so per-building colour jitter is stable. */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

interface BuildingNode {
  group: Group;
  sig: string; // defId|upgradeLevel|status — rebuild only when this changes
  rotor?: TObject3D; // wind-turbine blades to spin
  smoke?: Vector3; // chimney anchor (world) for active production
}

interface Car {
  mesh: Object3D;
  tile: { x: number; y: number };
  next: { x: number; y: number };
  t: number; // 0..1 along tile→next
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

  private buildingGroup = new Group();
  private terrainGroup = new Group();
  private vegetationGroup = new Group();
  private liveGroup = new Group();
  private overlayGroup = new Group();
  private markerGroup = new Group();
  private ground: Mesh | undefined; // invisible pick plane
  private ghost: Group | undefined;
  private markerTex = new Map<string, CanvasTexture>();
  /** One marker per building. `obj` is a camera-facing sprite billboard OR a
   *  dropped-in 3D marker model; `pulse`/`spin` drive the idle animation. */
  private markers: { obj: Object3D; baseY: number; pulse: boolean; spin: boolean }[] = [];
  /** Tiles covered by ANY building footprint (roads included) — vegetation &
   *  car pathing read this so nothing spawns on top of the city. */
  private occupied = new Set<string>();
  private vegKey = '';

  private nodes = new Map<string, BuildingNode>();
  private lastVersion = -1;
  private terrainKey = '';
  private sectorStatus = new Map<string, string>();
  /** Terrain type per tile "x,y" — lets roads detect water (→ bridge) and lets
   *  the mountain/feature pass know where to drop hero terrain models. */
  private terrainAt = new Map<string, TerrainType>();

  private placingDefId: string | undefined;
  private selectedId: string | undefined;
  private lastHoverKey = '';

  private smoke: { obj: Object3D; mat: SpriteMaterial | undefined; vy: number; age: number; ttl: number }[] = [];
  private smokeTimer = 0;
  // Optional drop-in smoke effect model (§ Effekte). Loaded once; while absent the
  // procedural sprite puff is used. 'none'→not tried, then loading/ready/fail.
  private smokeSrc: TObject3D | undefined;
  private smokeSrcState: 'none' | 'loading' | 'ready' | 'fail' = 'none';
  private cars: Car[] = [];
  private roadTiles: { x: number; y: number }[] = [];
  private roadSet = new Set<string>();
  // Active Stadtarbeit (§6): a delivery van routes along roads to the mission's
  // target houses; the camera focuses the first target when a mission starts.
  private missionKey = '';
  private missionVan: { mesh: Object3D; path: { x: number; y: number }[]; idx: number; t: number } | undefined;

  private destroyed = false;

  constructor(
    private controller: GameController,
    private callbacks: RendererCallbacks,
  ) {}

  async init(host: HTMLElement): Promise<void> {
    this.host = host;
    const renderer = new WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth || 800, host.clientHeight || 600);
    renderer.shadowMap.enabled = true;
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
    this.disposeGroup(this.vegetationGroup);
    this.disposeGroup(this.liveGroup);
    this.disposeGroup(this.overlayGroup);
    for (const m of this.markers) this.disposeGroup(m.obj);
    for (const t of this.markerTex.values()) t.dispose();
  }

  setRenderMode(): void {
    // A ThreeMapRenderer only ever renders true3d; MapView rebuilds the engine
    // when the mode leaves 3D, so there is nothing to switch here.
  }

  setPlacing(defId: string | undefined): void {
    if (this.placingDefId === defId) return;
    this.placingDefId = defId;
    if (!defId) this.clearGhost();
  }

  setMoving(): void {
    // Moving buildings is a 2D-mode interaction (drag/hold); in 3D the player
    // switches to 2D/iso to relocate. No-op here (documented, docs/3D_MODELS.md).
  }

  setSelected(id: string | undefined): void {
    this.selectedId = id;
    if (id) this.focusBuilding(id);
    this.lastVersion = -1; // refresh selection ring
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
        if (t && this.placingDefId) this.callbacks.onPlace(this.placingDefId, t.x, t.y);
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
    const hits = this.raycaster.intersectObjects(this.buildingGroup.children, true);
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
      const sx = Math.floor(t.x / SECTOR_SIZE);
      const sy = Math.floor(t.y / SECTOR_SIZE);
      const sector = this.controller.state.world.sectors[`${sx}:${sy}`];
      if (sector && sector.status === 'locked') {
        this.callbacks.onClickLockedSector(sector.id);
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
    const sectors = Object.values(this.controller.state.world.sectors);
    const key = sectors.map((s) => `${s.id}:${s.status}`).join(',');
    if (key === this.terrainKey) return;
    // Fire the "new area" popup for sectors that just unlocked.
    for (const s of sectors) {
      const prev = this.sectorStatus.get(s.id);
      if (prev === 'locked' && s.status === 'unlocked') this.callbacks.onSectorUnlocked(s.id);
      this.sectorStatus.set(s.id, s.status);
    }
    this.terrainKey = key;

    this.disposeGroup(this.terrainGroup);
    this.terrainGroup.clear();
    this.terrainAt.clear();

    const tiles: { x: number; y: number; terrain: TerrainType; locked: boolean }[] = [];
    for (const s of sectors) {
      const ox = s.sx * SECTOR_SIZE;
      const oy = s.sy * SECTOR_SIZE;
      for (let ly = 0; ly < SECTOR_SIZE; ly++) {
        for (let lx = 0; lx < SECTOR_SIZE; lx++) {
          const tile = s.tiles[ly * SECTOR_SIZE + lx];
          if (!tile) continue;
          const x = ox + lx;
          const y = oy + ly;
          tiles.push({ x, y, terrain: tile.terrain, locked: s.status === 'locked' });
          this.terrainAt.set(`${x},${y}`, tile.terrain);
        }
      }
    }

    // Organic heightfield ground (v0.39): one continuous, vertex-coloured, lit
    // mesh whose vertices ride the terrain-height field, so hills slope, mountains
    // tower and water dips — no blocky tiles. Everything else reads the SAME field
    // (terrainHeightAt) so buildings/roads/props sit exactly on the ground.
    this.buildGroundMesh(tiles);

    // Rippling water surface over every unlocked water/river tile (v0.37).
    this.buildWater(tiles);

    // Drop-in terrain models on top of the coloured base (§ Gebirge/Map): any
    // `.glb` in models/terrain/… replaces the flat tile for its type. Runs async
    // so a slow model never blocks the frame; aborts if the world changed.
    void this.decorateTerrain(key, tiles);
  }

  /**
   * The organic ground (v0.39): a single vertex-coloured, lit heightfield mesh
   * spanning the whole materialized board. Each grid vertex sits at
   * `terrainHeightAt`, so the surface slopes and mountains rise smoothly; vertex
   * colours blend the terrain types of the meeting tiles (locked sectors dimmed).
   * `computeVertexNormals` gives the slopes real shading. One draw call.
   */
<<<<<<< Updated upstream
  private buildGroundMesh(tiles: { x: number; y: number; terrain: TerrainType; locked: boolean }[]): void {
    if (tiles.length === 0) return;
    const info = new Map<string, { terrain: TerrainType; locked: boolean }>();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const t of tiles) {
      info.set(`${t.x},${t.y}`, t);
      if (t.x < minX) minX = t.x;
      if (t.y < minY) minY = t.y;
      if (t.x > maxX) maxX = t.x;
      if (t.y > maxY) maxY = t.y;
    }
    const W = maxX - minX + 1;
    const H = maxY - minY + 1;
    const nx = W + 1;
    const ny = H + 1;
    const positions = new Float32Array(nx * ny * 3);
    const colors = new Float32Array(nx * ny * 3);
=======
  private buildGroundChunks(regions: { id: number; status: string }[]): void {
    if (!this.groundChunkGroup.parent) this.scene.add(this.groundChunkGroup);
    // § D-056: Die Sperre steckt seit v1.36 in der Weltmaske, nicht mehr in der
    // Vertexfarbe. Das hat zwei Folgen, die hier sichtbar werden: Der Boden
    // wird beim Freischalten NICHT mehr neu gebaut (die Geometrie kennt den
    // Sperrzustand gar nicht), und die weiche Aufblende kostet 64 Byte statt
    // eines halben Inselneuaufbaus.
    setLockedRegions(
      this.worldReveal.revealLockedRegionsVisually
        ? []
        : regions.filter((r) => r.status !== 'unlocked').map((r) => r.id),
    );

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
        const sig = `geo-v1:${[...touching].sort((a, b) => a - b).join(',')}`;
        const cached = this.groundChunks.get(key);
        if (cached && cached.sig === sig) continue;
        if (cached) {
          this.groundChunkGroup.remove(cached.mesh);
          cached.mesh.geometry.dispose();
          (cached.mesh.material as Material).dispose();
        }
        const mesh = this.buildGroundChunk(cx * GROUND_CHUNK, cy * GROUND_CHUNK);
        this.groundChunkGroup.add(mesh);
        this.groundChunks.set(key, { mesh, sig });
      }
    }
  }

  /** Baut EIN Boden-Chunk-Mesh (`GROUND_CHUNK`² Kacheln ab (minX,minY)). */
  private buildGroundChunk(minX: number, minY: number): Mesh {
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
>>>>>>> Stashed changes
    const tmp = new Color();
    const out = new Color();

    for (let iy = 0; iy < ny; iy++) {
      for (let ix = 0; ix < nx; ix++) {
        const vx = minX + ix;
        const vy = minY + iy;
        const o = (iy * nx + ix) * 3;
        positions[o] = vx;
        positions[o + 1] = terrainHeightAt(vx, vy);
        positions[o + 2] = vy;
        // Colour = mean of the (up to 4) tiles meeting at this corner; a dimmed
        // tint when the majority of them are still locked (fog of war).
        let r = 0;
        let g = 0;
        let b = 0;
        let cnt = 0;
        let lock = 0;
        for (const [tx, ty] of [
          [vx - 1, vy - 1],
          [vx, vy - 1],
          [vx - 1, vy],
          [vx, vy],
        ] as const) {
          const ti = info.get(`${tx},${ty}`);
          if (!ti) continue;
          tmp.set(TERRAIN_COLORS[ti.terrain]);
          r += tmp.r;
          g += tmp.g;
          b += tmp.b;
          cnt++;
          if (ti.locked) lock++;
        }
        if (cnt === 0) {
          tmp.set(TERRAIN_COLORS.grass);
          r = tmp.r;
          g = tmp.g;
          b = tmp.b;
          cnt = 1;
        }
        out.setRGB(r / cnt, g / cnt, b / cnt);
        // A touch of per-vertex lightness jitter so large fields aren't a flat sheet.
        out.offsetHSL(0, 0, (hash01(`${vx},${vy}`) - 0.5) * 0.05);
        if (lock / cnt > 0.5) out.multiplyScalar(0.42);
        colors[o] = out.r;
        colors[o + 1] = out.g;
        colors[o + 2] = out.b;
      }
    }

    const indices: number[] = [];
    for (let iy = 0; iy < H; iy++) {
      for (let ix = 0; ix < W; ix++) {
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
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mat = new MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
    const mesh = new Mesh(geo, mat);
    mesh.receiveShadow = true;
    this.terrainGroup.add(mesh);
  }

  /**
   * Animated water surface (v0.37): one InstancedMesh of subdivided planes over
   * every unlocked water/river tile, rippled in the vertex shader from the shared
   * `waterTime` uniform. It is a lit MeshStandardMaterial, so it naturally darkens
   * at night; the frame loop retints it to the current sky colour. Sits just above
   * the coloured lakebed tile. Rebuilt with the terrain (owns its own material).
   */
  private buildWater(tiles: { x: number; y: number; terrain: TerrainType; locked: boolean }[]): void {
    this.waterMat = undefined;
    const water = tiles.filter((t) => !t.locked && (t.terrain === 'water' || t.terrain === 'river'));
    if (water.length === 0) return;

    const geo = new PlaneGeometry(1, 1, 6, 6);
    geo.rotateX(-Math.PI / 2); // lay the plane flat (Y up)
    const mat = new MeshStandardMaterial({
      color: 0x2a6a94,
      roughness: 0.22,
      metalness: 0.4,
      transparent: true,
      opacity: 0.86,
    });
    // A gentle two-wave ripple injected into the standard vertex shader; the phase
    // varies per tile via the instance translation so the whole lake rolls.
    mat.customProgramCacheKey = () => 'cmb-water';
    mat.onBeforeCompile = (shader) => {
      shader.uniforms['uTime'] = this.waterTime;
      shader.vertexShader =
        'uniform float uTime;\n' +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           vec2 wp = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
           float ph = wp.x * 1.7 + wp.y * 1.3;
           transformed.y += sin(uTime * 1.3 + ph) * 0.045 + cos(uTime * 0.85 + wp.x * 2.1) * 0.03;`,
        );
    };

    const inst = new InstancedMesh(geo, mat, water.length);
    inst.receiveShadow = true;
    const dummy = new Object3D();
    for (let i = 0; i < water.length; i++) {
      const t = water[i]!;
      dummy.position.set(t.x + 0.5, WATER_LEVEL, t.y + 0.5);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
    this.terrainGroup.add(inst);
    this.waterMat = mat;
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
    const sectors = Object.values(this.controller.state.world.sectors).filter((s) => s.status === 'unlocked');
    // Only rebuild when the occupancy or sector set actually changed.
    const key = `${sectors.map((s) => s.id).join(',')}|${this.occupied.size}|${[...this.occupied].join(',')}`;
    if (key === this.vegKey) return;
    this.vegKey = key;
    this.disposeGroup(this.vegetationGroup);
    this.vegetationGroup.clear();

    const dummy = new Object3D();
    const trees: { x: number; y: number }[] = [];
    const bushes: { x: number; y: number }[] = [];
    for (const s of sectors) {
      const ox = s.sx * SECTOR_SIZE;
      const oy = s.sy * SECTOR_SIZE;
      for (let ly = 0; ly < SECTOR_SIZE; ly++) {
        for (let lx = 0; lx < SECTOR_SIZE; lx++) {
          const tile = s.tiles[ly * SECTOR_SIZE + lx];
          if (!tile) continue;
          const x = ox + lx;
          const y = oy + ly;
          if (this.occupied.has(`${x},${y}`)) continue; // never on the city
          const h = hash01(`${x},${y}`);
          if (tile.terrain === 'forest' && (lx + ly) % 2 === 0) trees.push({ x, y });
          else if (tile.terrain === 'grass' && h > 0.86) bushes.push({ x, y });
        }
      }
    }

    // Drop-in props (§ Props): a `pine_tree.glb` / `bush_small.glb` (etc.) in
    // models/props/nature/ replaces the procedural cones. Fire-and-forget so a
    // slow model never blocks a frame; the staleness guard drops it if the city
    // changed meanwhile. Falls back to the instanced procedural greenery below.
    const stale = () => this.vegKey !== key;
    const treeUrl = firstModel(propModel, TREE_MODELS);
    const bushUrl = firstModel(propModel, BUSH_MODELS);
    if (treeUrl && trees.length) {
      // yBase 0: the model's base sits on the sampled ground (placeModelInstances
      // rides the heightfield). footprint keeps the model's own tall aspect ratio.
      void this.placeModelInstances(
        treeUrl,
        this.vegetationGroup,
        trees,
        { footprint: 0.9, jitterRot: true, jitterScale: 0.5, cap: 500, yBase: 0 },
        stale,
      );
    }
    if (bushUrl && bushes.length) {
      void this.placeModelInstances(
        bushUrl,
        this.vegetationGroup,
        bushes,
        { footprint: 0.55, jitterRot: true, jitterScale: 0.4, cap: 300, yBase: 0 },
        stale,
      );
    }

    const nT = treeUrl ? 0 : Math.min(trees.length, 600);
    if (nT > 0) {
      const trunkG = new CylinderGeometry(0.06, 0.09, 0.5, 5);
      const crownG = new ConeGeometry(0.36, 1.0, 6);
      const trunkM = new MeshLambertMaterial({ color: 0x7a5230 });
      const crownM = new MeshLambertMaterial({ color: 0x2f6b34 });
      const trunks = new InstancedMesh(trunkG, trunkM, nT);
      const crowns = new InstancedMesh(crownG, crownM, nT);
      crowns.castShadow = true;
      for (let i = 0; i < nT; i++) {
        const t = trees[i]!;
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
      const sig = `${b.defId}|${b.upgradeLevel}|${b.status}|${b.id === this.selectedId ? 'sel' : ''}|${roadMask}`;
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
    // bridge model over water), so they never touch the building-model resolution.
    if (def.category === 'roads') {
      this.buildRoad(group, def, b, roadMask);
      return node;
    }

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

      // Honour the named-node conventions (docs/3D_MODELS.md): a node called
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
    opts: FitOpts & { cap?: number; jitterScale?: number; jitterRot?: boolean; yBase?: number },
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
        const sc = opts.jitterScale ? 1 - opts.jitterScale / 2 + j * opts.jitterScale : 1;
        dummy.position.set(t.x + 0.5, terrainHeightAt(t.x + 0.5, t.y + 0.5) + yBase, t.y + 0.5);
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
      const clone = probe.clone(true);
      const sc = opts.jitterScale ? 1 - opts.jitterScale / 2 + j * opts.jitterScale : 1;
      clone.position.set(t.x + 0.5, terrainHeightAt(t.x + 0.5, t.y + 0.5) + yBase, t.y + 0.5);
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
   * A road/bridge tile (§ Straßen/Brücken drop-in). The procedural auto-tiled
   * asphalt (or a raised deck over water) is drawn immediately into a holder; if a
   * matching `.glb` exists it replaces it: a road segment picked by the neighbour
   * mask (straight/curve/T/cross/end + rotation), or a bridge model over
   * water/river. See docs/3D_MODEL_MANIFEST.md §3.
   */
  private buildRoad(group: Group, def: BuildingDef, b: BuildingInstance, mask: number): void {
    const holder = new Group();
    group.add(holder);
    const cls = roadClassFor(def.id);
    const terrain = this.terrainAt.get(`${b.x},${b.y}`);
    const overWater = terrain === 'water' || terrain === 'river';

    if (overWater) {
      // Bridge: procedural deck now, swap a bridge model in when present.
      const rot = mask & 2 || mask & 8 ? (mask & 1 || mask & 4 ? 0 : Math.PI / 2) : 0;
      this.buildBridgeDeck(holder, rot);
      const url = firstModel(bridgeModel, BRIDGE_MODELS);
      if (url) void this.swapInModel(url, holder, { footprint: 1, rotationY: rot });
      return;
    }

    // Regular road: procedural auto-tile now, swap a segment model in when present.
    this.buildRoadTile(holder, mask, cls);
    const seg = roadSegment(mask);
    const url = firstModel(roadModel, roadSegmentNames(seg.base, cls));
    if (url) void this.swapInModel(url, holder, { footprint: 1, rotationY: seg.rotationY, castShadow: false });
  }

  /** A simple raised bridge deck (fallback when no bridge model is supplied). */
  private buildBridgeDeck(g: Group, rotationY: number): void {
    const deck = new Group();
    deck.rotation.y = rotationY;
    const yTop = 0.5;
    const road = new Mesh(
      new BoxGeometry(0.7, 0.1, 1.02),
      new MeshStandardMaterial({ color: 0x4a5058, roughness: 0.95 }),
    );
    road.position.y = yTop;
    road.castShadow = true;
    road.receiveShadow = true;
    deck.add(road);
    const railMat = new MeshStandardMaterial({ color: 0x9aa1ab, roughness: 0.9 });
    for (const sx of [-0.36, 0.36]) {
      const rail = new Mesh(new BoxGeometry(0.06, 0.16, 1.02), railMat);
      rail.position.set(sx, yTop + 0.12, 0);
      deck.add(rail);
    }
    const pileMat = new MeshStandardMaterial({ color: 0x6d747d, roughness: 1 });
    for (const sz of [-0.32, 0.32]) {
      const pile = new Mesh(new BoxGeometry(0.6, 0.5, 0.1), pileMat);
      pile.position.set(0, 0.25, sz);
      deck.add(pile);
    }
    g.add(deck);
  }

  /**
   * Auto-tiled procedural road (§3): a dark asphalt cross/strip connecting to
   * road neighbours (mask), light kerb/sidewalk strips on the open edges, and a
   * subtle centreline for the bigger road classes — so straight/curve/T/cross/end
   * all read correctly and it no longer looks like a dark plate with dots. When a
   * real `road_*.glb` exists it can replace this later (roadModel(), fallback here).
   */
  private buildRoadTile(g: Group, mask: number, cls: RoadClass): void {
    const spec = ROAD_SPECS[cls];
    const yAsph = 0.24;
    const yKerb = 0.25;
    const yMark = 0.262;
    const asphMat = new MeshStandardMaterial({ color: spec.color, roughness: 0.95 });
    const kerbMat = new MeshStandardMaterial({ color: spec.kerb, roughness: 1 });
    const half = spec.half;

    // Central junction pad.
    const core = new Mesh(new BoxGeometry(half * 2, 0.06, half * 2), asphMat);
    core.position.y = yAsph;
    core.receiveShadow = true;
    g.add(core);

    const dirs = [
      { bit: 1, dx: 0, dz: -1 },
      { bit: 2, dx: 1, dz: 0 },
      { bit: 4, dx: 0, dz: 1 },
      { bit: 8, dx: -1, dz: 0 },
    ];
    for (const { bit, dx, dz } of dirs) {
      if (mask & bit) {
        // Asphalt arm reaching to the tile edge in that direction.
        const arm = new Mesh(
          new BoxGeometry(dx !== 0 ? 0.5 : half * 2, 0.06, dz !== 0 ? 0.5 : half * 2),
          asphMat,
        );
        arm.position.set(dx * 0.25, yAsph, dz * 0.25);
        arm.receiveShadow = true;
        g.add(arm);
        // Centreline dash for bigger classes (not residential/back streets).
        if (spec.centerline) {
          const mark = new Mesh(
            new BoxGeometry(dx !== 0 ? 0.34 : 0.05, 0.02, dz !== 0 ? 0.34 : 0.05),
            new MeshStandardMaterial({ color: 0xe4d98f, roughness: 1 }),
          );
          mark.position.set(dx * 0.28, yMark, dz * 0.28);
          g.add(mark);
        }
      } else {
        // Open edge → raised kerb / sidewalk strip.
        const kerb = new Mesh(
          new BoxGeometry(dx !== 0 ? 0.1 : 0.98, 0.1, dz !== 0 ? 0.1 : 0.98),
          kerbMat,
        );
        kerb.position.set(dx * 0.45, yKerb, dz * 0.45);
        kerb.receiveShadow = true;
        g.add(kerb);
      }
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
    const hc = def.visual?.heightClass ?? CATEGORY_HEIGHT[def.category] ?? 1;
    const height = Math.max(0.12, hc * 0.95 * (1 + b.upgradeLevel * 0.5));
    const baseColor = new Color(CATEGORY_COLORS[def.category] ?? 0x999999);
    const jitter = (hash01(b.id) - 0.5) * 0.18;
    baseColor.offsetHSL(0, 0, jitter);

    let rotor: TObject3D | undefined;
    let smoke: Vector3 | undefined;

    if (def.category === 'roads') {
      this.buildRoadTile(g, roadMask, roadClassFor(def.id));
      return { group: g };
    }

    if (def.category === 'decoration') {
      // Correctly-proportioned procedural prop per id (a bench is NOT tree-sized).
      g.add(...decorationProc(def.id));
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
    const body = new Mesh(new BoxGeometry(w, height, d), bodyMat);
    body.position.y = height / 2;
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
        new ConeGeometry(Math.max(w, d) * 0.72, 0.5 + height * 0.18, 4),
        new MeshStandardMaterial({ color: roofColor, roughness: 0.9 }),
      );
      roof.rotation.y = Math.PI / 4;
      roof.position.y = height + (0.5 + height * 0.18) / 2 - 0.02;
      roof.castShadow = true;
      g.add(roof);
    } else {
      const cap = new Mesh(new BoxGeometry(w * 0.9, 0.16, d * 0.9), new MeshStandardMaterial({ color: 0x333a44 }));
      cap.position.y = height + 0.08;
      g.add(cap);
    }

    // Wind turbine: a spinnable rotor node.
    if (def.id === 'wind_farm') {
      const mast = new Mesh(new CylinderGeometry(0.09, 0.13, height * 1.4), new MeshStandardMaterial({ color: 0xf2f2f2 }));
      mast.position.y = height * 0.7;
      g.add(mast);
      const r = new Group();
      r.position.set(0, height * 1.4, d * 0.12);
      for (let i = 0; i < 3; i++) {
        const blade = new Mesh(new BoxGeometry(0.06, 1.5, 0.16), new MeshStandardMaterial({ color: 0xffffff }));
        blade.position.y = 0.75;
        const holder = new Group();
        holder.rotation.z = (i * Math.PI * 2) / 3;
        holder.add(blade);
        r.add(holder);
      }
      g.add(r);
      rotor = r;
    }

    // Chimney + smoke anchor for active production / energy buildings.
    if ((def.category === 'production' || def.category === 'energy') && b.status === 'active') {
      const chim = new Mesh(new BoxGeometry(0.22, 0.6, 0.22), new MeshStandardMaterial({ color: 0x6c6f77 }));
      const chx = w * 0.28;
      const chz = -d * 0.28;
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
      if (!this.roadSet.has(`${car.tile.x},${car.tile.y}`)) {
        this.liveGroup.remove(car.mesh);
        this.disposeGroup(car.mesh);
        this.cars.splice(i, 1);
      }
    }
    const cap = Math.min(MAX_CARS, Math.floor(this.roadTiles.length / 6));
    let guard = 40;
    while (this.cars.length < cap && this.roadTiles.length > 1 && guard-- > 0) {
      const start = this.roadTiles[Math.floor(Math.random() * this.roadTiles.length)]!;
      const nbs = this.roadNeighbors(start);
      if (nbs.length === 0) continue;
      const next = nbs[Math.floor(Math.random() * nbs.length)]!;
      const mesh = makeCarMesh();
      const car: Car = { mesh, tile: { ...start }, next, t: 0, speed: 0.85 + Math.random() * 0.5 };
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
   *  never U-turn unless it's a dead end (§4 — no chaotic direction changes). */
  private nextRoadTile(from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number } {
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    const cands = this.roadNeighbors(to).filter((n) => !(n.x === from.x && n.y === from.y));
    if (cands.length === 0) return { ...from }; // dead end → turn around
    const straight = cands.find((n) => n.x - to.x === dx && n.y - to.y === dy);
    if (straight && (cands.length === 1 || Math.random() < 0.7)) return straight;
    return cands[Math.floor(Math.random() * cands.length)]!;
  }

  private animateCars(dt: number): void {
    for (const car of this.cars) {
      car.t += dt * car.speed;
      const from = car.tile;
      const to = car.next;
      while (car.t >= 1) {
        car.t -= 1;
        car.tile = { ...car.next };
        car.next = this.nextRoadTile(from, car.tile);
      }
      const cx = MathUtils.lerp(from.x + 0.5, to.x + 0.5, car.t);
      const cz = MathUtils.lerp(from.y + 0.5, to.y + 0.5, car.t);
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
    const active = this.controller.state.activities.active;
    if (!active || active.targets.length === 0) {
      this.clearMissionVan();
      this.missionKey = '';
      return;
    }
    const def = this.controller.config.activities.activities.find((a) => a.id === active.defId);
    const key = `${active.defId}|${active.startedAt}`;
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
    this.retargetVan(active.targets);
  }

  private retargetVan(targets: { buildingId: string; done: boolean }[]): void {
    const undone = targets.filter((t) => !t.done);
    if (undone.length === 0) {
      this.clearMissionVan();
      return;
    }
    const start = this.missionVan ? this.vanTile() : this.deliverySourceTile() ?? this.roadTiles[0];
    if (!start) return;
    let bestPath: { x: number; y: number }[] | undefined;
    for (const t of undone) {
      const b = this.controller.state.buildings[t.buildingId];
      const def = b && this.controller.config.buildings.get(b.defId);
      if (!b || !def) continue;
      const goal = this.roadTileAdjacent(b.x, b.y, def.size.w, def.size.h);
      if (!goal) continue;
      const path = this.roadPath(start, goal);
      if (path.length > 0 && (!bestPath || path.length < bestPath.length)) bestPath = path;
    }
    if (!bestPath) {
      this.clearMissionVan();
      return;
    }
    if (!this.missionVan) {
      const mesh = makeVanMesh();
      this.liveGroup.add(mesh);
      this.missionVan = { mesh, path: [], idx: 0, t: 0 };
      // Drop-in delivery-van model (§ Fahrzeuge). Author facing +z.
      const vanUrl = firstModel(vehicleModel, VAN_MODELS);
      if (vanUrl) void this.swapInModel(vanUrl, mesh, { targetHeight: 0.42 });
    }
    this.missionVan.path = bestPath;
    this.missionVan.idx = 0;
    this.missionVan.t = 0;
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
    v.t += dt * 1.25;
    while (v.t >= 1 && v.idx < v.path.length - 2) {
      v.t -= 1;
      v.idx++;
    }
    const a = v.path[v.idx]!;
    const b = v.path[Math.min(v.idx + 1, v.path.length - 1)]!;
    const tt = v.idx >= v.path.length - 1 ? 1 : v.t;
    const hx = b.x - a.x;
    const hz = b.y - a.y;
    const vanX = MathUtils.lerp(a.x + 0.5, b.x + 0.5, tt) + hz * 0.16;
    const vanZ = MathUtils.lerp(a.y + 0.5, b.y + 0.5, tt) - hx * 0.16;
    v.mesh.position.set(vanX, terrainHeightAt(vanX, vanZ) + 0.32, vanZ);
    if (hx !== 0 || hz !== 0) v.mesh.rotation.y = Math.atan2(hx, hz);
  }

  // ---- markers (camera-facing billboards, §15) ------------------------------

  /** Approximate a building's top height (for anchoring markers/smoke). */
  private approxHeight(def: BuildingDef, upgradeLevel: number): number {
    const hc = def.visual?.heightClass ?? CATEGORY_HEIGHT[def.category] ?? 1;
    return Math.max(0.4, hc * 0.95 * (1 + upgradeLevel * 0.5));
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
   * ONE priority billboard per building (§5): activity target > construction >
   * problem > upgrade-ready. Colour-coded, camera-facing sprites that float above
   * the building — clearer than the old translucent boxes and never stacked.
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
      else {
        const marker = this.controller.getBuildingMarker(b.id);
        if (marker === 'problem') kind = 'problem';
        else if (marker === 'upgrade') kind = 'upgrade';
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
        this.markerGroup.add(holder);
        void this.swapInModel(modelUrl, holder, { targetHeight: big ? 1.0 : 0.75 });
        this.markers.push({ obj: holder, baseY, pulse: big, spin: true });
        continue;
      }

      const s = new Sprite(new SpriteMaterial({ map: this.markerTexture(kind), transparent: true, depthTest: false }));
      s.position.set(cx, baseY, cz);
      s.scale.setScalar(big ? 1.7 : 1.25);
      s.renderOrder = 10;
      this.markerGroup.add(s);
      this.markers.push({ obj: s, baseY, pulse: big, spin: false });
    }
  }

  private animateMarkers(): void {
    if (this.markers.length === 0) return;
    const t = performance.now() / 1000;
    for (const m of this.markers) {
      if (m.pulse) {
        m.obj.position.y = m.baseY + Math.sin(t * 3) * 0.18;
        if (!m.spin) m.obj.scale.setScalar(1.6 + Math.sin(t * 3) * 0.18);
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

    // Advance camera: apply held keys/edge-scroll, ease toward goals, write pose.
    this.input?.update(dt);
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
    this.animateMission(dt);
    this.animateMarkers();

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

/** A delivery van for the active "Essen verteilen" mission (white box + cab). */
function makeVanMesh(): Group {
  const g = new Group();
  const body = new Mesh(new BoxGeometry(0.4, 0.3, 0.66), new MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.5 }));
  body.position.y = 0.18;
  body.castShadow = true;
  const cab = new Mesh(new BoxGeometry(0.4, 0.22, 0.2), new MeshStandardMaterial({ color: 0xe0a03a, roughness: 0.5 }));
  cab.position.set(0, 0.14, 0.3);
  const stripe = new Mesh(new BoxGeometry(0.42, 0.06, 0.4), new MeshStandardMaterial({ color: 0xe0a03a }));
  stripe.position.set(0, 0.2, -0.05);
  g.add(body, cab, stripe);
  return g;
}

/** Road-type hierarchy (§3, prepared): the current `road` maps to a residential
 *  street; future ids (road_main, road_wide, …) slot in here without renderer
 *  changes. `half` = asphalt half-width; kerb = sidewalk colour. */
export type RoadClass = 'residential' | 'main' | 'wide' | 'industrial' | 'boulevard';
const ROAD_SPECS: Record<RoadClass, { half: number; color: number; kerb: number; centerline: boolean }> = {
  residential: { half: 0.3, color: 0x474d57, kerb: 0x929aa4, centerline: false },
  main: { half: 0.37, color: 0x3c424b, kerb: 0x9aa1ab, centerline: true },
  wide: { half: 0.43, color: 0x3a4049, kerb: 0x9aa1ab, centerline: true },
  industrial: { half: 0.4, color: 0x41464f, kerb: 0x7d838d, centerline: false },
  boulevard: { half: 0.45, color: 0x393f48, kerb: 0xa7aeb8, centerline: true },
};
function roadClassFor(defId: string): RoadClass {
  if (defId.includes('boulevard') || defId.includes('allee')) return 'boulevard';
  if (defId.includes('wide') || defId.includes('breit')) return 'wide';
  if (defId.includes('main') || defId.includes('haupt')) return 'main';
  if (defId.includes('industrial') || defId.includes('zufahrt')) return 'industrial';
  return 'residential';
}

/** Rotate a 4-bit neighbour mask one step clockwise (N→E→S→W). One step equals a
 *  +90° yaw of the tile piece (see fitObject/three.js Y-rotation). */
function rotMask(m: number): number {
  return ((m << 1) | (m >> 3)) & 15;
}
/** Steps (0..3) to rotate `canonical` onto `actual`; ×90° gives the yaw. */
function rotSteps(canonical: number, actual: number): number {
  let m = canonical;
  for (let k = 0; k < 4; k++) {
    if (m === actual) return k;
    m = rotMask(m);
  }
  return 0;
}

type RoadSegment = 'straight' | 'curve' | 't_intersection' | 'cross_intersection' | 'end';

/** Neighbour mask → segment shape + yaw (canonical: straight=N-S, curve=N+E,
 *  T=absent-W, end=arm-to-N). Matches the road model names in the manifest. */
function roadSegment(mask: number): { base: RoadSegment; rotationY: number } {
  const bits = (mask & 1) + ((mask >> 1) & 1) + ((mask >> 2) & 1) + ((mask >> 3) & 1);
  const q = Math.PI / 2;
  if (bits >= 4) return { base: 'cross_intersection', rotationY: 0 };
  if (bits === 3) return { base: 't_intersection', rotationY: rotSteps(7, mask) * q };
  if (bits === 2) {
    if (mask === 5 || mask === 10) return { base: 'straight', rotationY: rotSteps(5, mask) * q };
    return { base: 'curve', rotationY: rotSteps(3, mask) * q };
  }
  if (bits === 1) return { base: 'end', rotationY: rotSteps(1, mask) * q };
  return { base: 'end', rotationY: 0 };
}

/** Candidate road model names for a segment + class: class-specific first
 *  (`road_main_straight`), then the generic (`road_straight`). */
function roadSegmentNames(base: RoadSegment, cls: RoadClass): string[] {
  const generic = `road_${base}`;
  if (cls === 'residential') return [generic];
  return [`road_${cls}_${base}`, generic];
}

type MarkerKind = 'activity' | 'construction' | 'problem' | 'upgrade';


const MARKER_STYLE: Record<MarkerKind, { color: string; glyph: 'exclaim' | 'up' | 'wrench' | 'box' }> = {
  activity: { color: '#2fd4d4', glyph: 'box' },
  construction: { color: '#f2c14e', glyph: 'wrench' },
  problem: { color: '#e5533b', glyph: 'exclaim' },
  upgrade: { color: '#5fbf62', glyph: 'up' },
};

/** A colour-coded rounded pin with a downward tail + glyph, drawn to a texture. */
function makeMarkerTexture(kind: MarkerKind): CanvasTexture {
  const size = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const st = MARKER_STYLE[kind];
  if (ctx) {
    ctx.translate(size / 2, size / 2);
    // Pin body: filled circle + downward tail, white outline for contrast.
    ctx.fillStyle = st.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, -16, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-16, 12);
    ctx.lineTo(16, 12);
    ctx.lineTo(0, 46);
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
    } else {
      // box / delivery target
      ctx.strokeRect(-16, -32, 32, 26);
      ctx.beginPath();
      ctx.moveTo(-16, -22);
      ctx.lineTo(16, -22);
      ctx.stroke();
    }
  }
  return new CanvasTexture(cv);
}

