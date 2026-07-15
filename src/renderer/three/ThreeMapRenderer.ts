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
  AmbientLight,
  Box3,
  BoxGeometry,
  CanvasTexture,
  Clock,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  EdgesGeometry,
  Fog,
  Group,
  HemisphereLight,
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
import { buildingModel } from '../../assets/registry.ts';
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
function loadModel(url: string): Promise<TObject3D> {
  let p = modelCache.get(url);
  if (!p) {
    p = gltfLoader.loadAsync(url).then((g) => g.scene);
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

  private buildingGroup = new Group();
  private terrainGroup = new Group();
  private liveGroup = new Group();
  private overlayGroup = new Group();
  private markerGroup = new Group();
  private ground: Mesh | undefined; // invisible pick plane
  private ghost: Group | undefined;
  private markerTex: CanvasTexture | undefined;
  private markers: { s: Sprite; baseY: number }[] = [];

  private nodes = new Map<string, BuildingNode>();
  private lastVersion = -1;
  private terrainKey = '';
  private sectorStatus = new Map<string, string>();

  private placingDefId: string | undefined;
  private selectedId: string | undefined;
  private lastHoverKey = '';

  private smoke: { s: Sprite; vy: number; age: number; ttl: number }[] = [];
  private smokeTimer = 0;
  private cars: Car[] = [];
  private roadTiles: { x: number; y: number }[] = [];
  private roadSet = new Set<string>();

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

    this.scene.background = new Color(0x9fd0ef);
    this.scene.fog = new Fog(0x9fd0ef, 180, 520);

    const hemi = new HemisphereLight(0xffffff, 0x6b7a5a, 1.05);
    this.scene.add(hemi);
    this.scene.add(new AmbientLight(0xffffff, 0.25));
    const sun = new DirectionalLight(0xfff2d8, 1.35);
    sun.position.set(-60, 90, -40); // top-left, consistent with the asset spec
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.near = 1;
    sc.far = 400;
    sc.left = -140;
    sc.right = 140;
    sc.top = 140;
    sc.bottom = -140;
    this.scene.add(sun);

    // Invisible ground plane for cursor→tile picking and empty-space clicks.
    const groundMat = new MeshLambertMaterial({ visible: false });
    const ground = new Mesh(new PlaneGeometry(4000, 4000), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, 0);
    this.scene.add(ground);
    this.ground = ground;

    this.scene.add(this.terrainGroup, this.buildingGroup, this.liveGroup, this.overlayGroup, this.markerGroup);
    this.markerTex = makeMarkerTexture();

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
    this.disposeGroup(this.buildingGroup);
    this.disposeGroup(this.terrainGroup);
    this.disposeGroup(this.liveGroup);
    this.disposeGroup(this.overlayGroup);
    for (const m of this.markers) m.s.material.dispose();
    this.markerTex?.dispose();
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

    if (this.ghost) this.overlayGroup.remove(this.ghost);
    const w = def.size.w;
    const h = def.size.h;
    const col = error ? 0xe53935 : bonusPct > 0 ? 0x58c470 : 0x4caf50;
    const geo = new BoxGeometry(w * 0.94, 0.4, h * 0.94);
    const mat = new MeshStandardMaterial({ color: col, transparent: true, opacity: 0.5 });
    const box = new Mesh(geo, mat);
    box.position.set(x + w / 2, 0.2, y + h / 2);
    const ring = new Mesh(new BoxGeometry(w, 0.02, h), new MeshStandardMaterial({ color: col }));
    ring.position.set(x + w / 2, 0.02, y + h / 2);
    const grp = new Group();
    grp.add(box, ring);
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

    const dummy = new Object3D();
    const tiles: { x: number; y: number; terrain: TerrainType; locked: boolean }[] = [];
    const treeTiles: { x: number; y: number }[] = [];
    for (const s of sectors) {
      const ox = s.sx * SECTOR_SIZE;
      const oy = s.sy * SECTOR_SIZE;
      for (let ly = 0; ly < SECTOR_SIZE; ly++) {
        for (let lx = 0; lx < SECTOR_SIZE; lx++) {
          const tile = s.tiles[ly * SECTOR_SIZE + lx];
          if (!tile) continue;
          tiles.push({ x: ox + lx, y: oy + ly, terrain: tile.terrain, locked: s.status === 'locked' });
          if (tile.terrain === 'forest' && s.status === 'unlocked' && ((lx + ly) % 2 === 0)) {
            treeTiles.push({ x: ox + lx, y: oy + ly });
          }
        }
      }
    }

    const geo = new BoxGeometry(1, 1, 1);
    const mat = new MeshLambertMaterial();
    const inst = new InstancedMesh(geo, mat, tiles.length);
    inst.receiveShadow = true;
    const c = new Color();
    for (let i = 0; i < tiles.length; i++) {
      const tl = tiles[i]!;
      const relief = terrainRelief(tl.terrain);
      dummy.position.set(tl.x + 0.5, relief.y, tl.y + 0.5);
      dummy.scale.set(1, relief.h, 1);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      c.set(TERRAIN_COLORS[tl.terrain]);
      if (tl.locked) c.multiplyScalar(0.4);
      inst.setColorAt(i, c);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    this.terrainGroup.add(inst);

    // Forest trees as a second instanced mesh (cones), capped.
    const n = Math.min(treeTiles.length, 500);
    if (n > 0) {
      const tGeo = new ConeGeometry(0.34, 1.1, 6);
      const tMat = new MeshLambertMaterial({ color: 0x2f6b34 });
      const trees = new InstancedMesh(tGeo, tMat, n);
      trees.castShadow = true;
      for (let i = 0; i < n; i++) {
        const tt = treeTiles[i]!;
        dummy.position.set(tt.x + 0.5, 0.62, tt.y + 0.5);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, hash01(`${tt.x},${tt.y}`) * Math.PI, 0);
        dummy.updateMatrix();
        trees.setMatrixAt(i, dummy.matrix);
      }
      dummy.rotation.set(0, 0, 0);
      trees.instanceMatrix.needsUpdate = true;
      this.terrainGroup.add(trees);
    }
  }

  // ---- buildings ------------------------------------------------------------

  private rebuildBuildings(): void {
    const state = this.controller.state;
    const seen = new Set<string>();
    this.roadTiles = [];
    this.roadSet = new Set<string>();

    for (const b of Object.values(state.buildings)) {
      const def = this.controller.config.buildings.get(b.defId);
      if (!def) continue;
      seen.add(b.id);
      if (def.category === 'roads') {
        this.roadTiles.push({ x: b.x, y: b.y });
        this.roadSet.add(`${b.x},${b.y}`);
      }
      const sig = `${b.defId}|${b.upgradeLevel}|${b.status}|${b.id === this.selectedId ? 'sel' : ''}`;
      const existing = this.nodes.get(b.id);
      if (existing && existing.sig === sig) continue;
      if (existing) {
        this.buildingGroup.remove(existing.group);
        this.disposeGroup(existing.group);
      }
      const node = this.buildNode(def, b);
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
    this.seedCars();
  }

  private buildNode(def: BuildingDef, b: BuildingInstance): BuildingNode {
    const group = new Group();
    group.userData['buildingId'] = b.id;
    const cx = b.x + def.size.w / 2;
    const cz = b.y + def.size.h / 2;
    group.position.set(cx, 0, cz);

    const constructing = b.status === 'constructing' && b.targetUpgradeLevel === undefined;
    const node: BuildingNode = { group, sig: `${def.id}|${b.upgradeLevel}|${b.status}|${b.id === this.selectedId ? 'sel' : ''}` };

    // Selection ring on the ground.
    if (b.id === this.selectedId) {
      const ringGeo = new BoxGeometry(def.size.w + 0.4, 0.05, def.size.h + 0.4);
      const ring = new Mesh(ringGeo, new MeshStandardMaterial({ color: 0xffffff, emissive: 0x88ccff, emissiveIntensity: 0.6 }));
      ring.position.y = 0.03;
      group.add(ring);
    }

    const url = buildingModel(def.id, b.upgradeLevel);
    if (url) {
      // Placeholder block until the model streams in (keeps the scene stable).
      const ph = this.proceduralBuilding(def, b, constructing);
      group.add(ph.group);
      if (ph.rotor) node.rotor = ph.rotor;
      if (ph.smoke) node.smoke = ph.smoke;
      void this.attachModel(url, def, group, ph.group, node, b.status === 'active');
    } else {
      const p = this.proceduralBuilding(def, b, constructing);
      group.add(p.group);
      if (p.rotor) node.rotor = p.rotor;
      if (p.smoke) node.smoke = p.smoke;
    }
    return node;
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
      const scale = (Math.max(def.size.w, def.size.h) * 0.92) / span;
      model.scale.setScalar(scale);
      const box2 = new Box3().setFromObject(model);
      const c = new Vector3();
      box2.getCenter(c);
      model.position.x -= c.x;
      model.position.z -= c.z;
      model.position.y -= box2.min.y;
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

  /** Procedural block: body + roof (+ rotor/scaffold), sized by footprint & stage. */
  private proceduralBuilding(
    def: BuildingDef,
    b: BuildingInstance,
    constructing: boolean,
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
      // Terrain tiles rise to y≈0.20, so the road must sit ON TOP of them
      // (bottom flush at 0.20) — otherwise it's buried and looks "missing".
      const road = new Mesh(
        new BoxGeometry(0.98, 0.08, 0.98),
        new MeshStandardMaterial({ color: 0x444a54, roughness: 0.95 }),
      );
      road.position.y = 0.24;
      road.receiveShadow = true;
      g.add(road);
      // Faint centre marking so roads read clearly from above.
      const line = new Mesh(
        new BoxGeometry(0.12, 0.02, 0.12),
        new MeshStandardMaterial({ color: 0xd9cf9e, roughness: 1 }),
      );
      line.position.y = 0.29;
      g.add(line);
      return { group: g };
    }

    if (def.category === 'decoration') {
      // Small green prop (tree/bush) instead of a block.
      const trunk = new Mesh(new CylinderGeometry(0.08, 0.1, 0.4), new MeshStandardMaterial({ color: 0x7a5230 }));
      trunk.position.y = 0.2;
      const crown = new Mesh(new ConeGeometry(0.4, 0.9, 7), new MeshStandardMaterial({ color: 0x3f8f45 }));
      crown.position.y = 0.85;
      crown.castShadow = true;
      g.add(trunk, crown);
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
      smoke = new Vector3(this.pxFromGroup(def, b, chx), height + 0.7, this.pzFromGroup(def, b, chz));
    }

    // Construction scaffold (wireframe cage) while building.
    if (constructing) {
      const cage = new LineSegments(
        new EdgesGeometry(new BoxGeometry(w + 0.1, height + 0.2, d + 0.1)),
        new LineBasicMaterial({ color: 0xffd54f }),
      );
      cage.position.y = (height + 0.2) / 2;
      g.add(cage);
    }

    return { group: g, ...(rotor ? { rotor } : {}), ...(smoke ? { smoke } : {}) };
  }

  private pxFromGroup(def: BuildingDef, b: BuildingInstance, local: number): number {
    return b.x + def.size.w / 2 + local;
  }
  private pzFromGroup(def: BuildingDef, b: BuildingInstance, local: number): number {
    return b.y + def.size.h / 2 + local;
  }

  // ---- live effects: smoke + cars ------------------------------------------

  private animateSmoke(dt: number): void {
    const sources: Vector3[] = [];
    for (const node of this.nodes.values()) if (node.smoke) sources.push(node.smoke);
    this.smokeTimer -= dt;
    if (this.smokeTimer <= 0 && sources.length > 0 && this.smoke.length < MAX_SMOKE) {
      this.smokeTimer = 0.5;
      const src = sources[Math.floor(Math.random() * sources.length)]!;
      const mat = new SpriteMaterial({ color: 0xdadada, transparent: true, opacity: 0.5, depthWrite: false });
      const s = new Sprite(mat);
      s.position.copy(src);
      s.scale.setScalar(0.6);
      this.liveGroup.add(s);
      this.smoke.push({ s, vy: 0.6 + Math.random() * 0.4, age: 0, ttl: 2.6 });
    }
    for (let i = this.smoke.length - 1; i >= 0; i--) {
      const p = this.smoke[i]!;
      p.age += dt;
      p.s.position.y += p.vy * dt;
      p.s.position.x += dt * 0.2;
      const k = p.age / p.ttl;
      p.s.scale.setScalar(0.6 + k * 1.1);
      (p.s.material as SpriteMaterial).opacity = 0.5 * (1 - k);
      if (p.age >= p.ttl) {
        this.liveGroup.remove(p.s);
        p.s.material.dispose();
        this.smoke.splice(i, 1);
      }
    }
  }

  private seedCars(): void {
    // Drop cars from roads that no longer exist; top up to the cap.
    for (let i = this.cars.length - 1; i >= 0; i--) {
      const car = this.cars[i]!;
      if (!this.roadSet.has(`${car.tile.x},${car.tile.y}`)) {
        this.liveGroup.remove(car.mesh);
        this.disposeGroup(car.mesh);
        this.cars.splice(i, 1);
      }
    }
    while (this.cars.length < Math.min(MAX_CARS, Math.floor(this.roadTiles.length / 4)) && this.roadTiles.length > 1) {
      const start = this.roadTiles[Math.floor(Math.random() * this.roadTiles.length)]!;
      const next = this.roadNeighbor(start, start);
      if (!next) break;
      const body = new Mesh(
        new BoxGeometry(0.34, 0.18, 0.5),
        new MeshStandardMaterial({ color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)]! }),
      );
      body.position.y = 0.28;
      body.castShadow = true;
      const car: Car = { mesh: body, tile: { ...start }, next, t: 0, speed: 0.7 + Math.random() * 0.6 };
      this.liveGroup.add(body);
      this.cars.push(car);
    }
  }

  private roadNeighbor(tile: { x: number; y: number }, avoid: { x: number; y: number }): { x: number; y: number } | undefined {
    const dirs = [
      { x: tile.x + 1, y: tile.y },
      { x: tile.x - 1, y: tile.y },
      { x: tile.x, y: tile.y + 1 },
      { x: tile.x, y: tile.y - 1 },
    ].filter((n) => this.roadSet.has(`${n.x},${n.y}`));
    const fwd = dirs.filter((n) => !(n.x === avoid.x && n.y === avoid.y));
    const pool = fwd.length > 0 ? fwd : dirs;
    if (pool.length === 0) return undefined;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private animateCars(dt: number): void {
    for (const car of this.cars) {
      car.t += dt * car.speed;
      const from = car.tile;
      const to = car.next;
      while (car.t >= 1) {
        car.t -= 1;
        car.tile = { ...car.next };
        const nb = this.roadNeighbor(car.tile, from);
        car.next = nb ?? { ...car.tile };
      }
      const x = MathUtils.lerp(from.x + 0.5, to.x + 0.5, car.t);
      const z = MathUtils.lerp(from.y + 0.5, to.y + 0.5, car.t);
      car.mesh.position.set(x, 0.28, z);
      if (to.x !== from.x || to.y !== from.y) {
        car.mesh.rotation.y = Math.atan2(to.x - from.x, to.y - from.y);
      }
    }
  }

  // ---- markers (camera-facing billboards, §15) ------------------------------

  /** Approximate a building's top height (for anchoring markers/smoke). */
  private approxHeight(def: BuildingDef, upgradeLevel: number): number {
    const hc = def.visual?.heightClass ?? CATEGORY_HEIGHT[def.category] ?? 1;
    return Math.max(0.4, hc * 0.95 * (1 + upgradeLevel * 0.5));
  }

  /** Pulsing markers over active Stadtarbeit targets. Sprites always face the
   *  camera, so they stay readable under any rotation/tilt. */
  private rebuildMarkers(): void {
    for (const m of this.markers) {
      this.markerGroup.remove(m.s);
      m.s.material.dispose();
    }
    this.markers = [];
    if (!this.markerTex) return;
    const targets = this.controller.getActivityTargets().filter((tg) => !tg.done);
    for (const tg of targets) {
      const b = this.controller.state.buildings[tg.buildingId];
      const def = b && this.controller.config.buildings.get(b.defId);
      if (!b || !def) continue;
      const s = new Sprite(new SpriteMaterial({ map: this.markerTex, transparent: true, depthTest: false }));
      const baseY = this.approxHeight(def, b.upgradeLevel) + 1.5;
      s.position.set(b.x + def.size.w / 2, baseY, b.y + def.size.h / 2);
      s.scale.setScalar(1.7);
      s.renderOrder = 10;
      this.markerGroup.add(s);
      this.markers.push({ s, baseY });
    }
  }

  private animateMarkers(): void {
    if (this.markers.length === 0) return;
    const t = performance.now() / 1000;
    const bob = Math.sin(t * 3) * 0.18;
    const scale = 1.6 + Math.sin(t * 3) * 0.18;
    for (const m of this.markers) {
      m.s.position.y = m.baseY + bob;
      m.s.scale.setScalar(scale);
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
    }

    // Advance camera: apply held keys/edge-scroll, ease toward goals, write pose.
    this.input?.update(dt);
    this.cam.update(dt);
    this.writeCamera();

    for (const node of this.nodes.values()) {
      if (node.rotor) node.rotor.rotation.z += dt * 1.6;
    }
    this.animateSmoke(dt);
    this.animateCars(dt);
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
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = (mesh as unknown as { material?: Material | Material[] }).material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) mat.dispose();
    });
  }
}

const CAR_COLORS = [0xd94f4f, 0x4f7fd9, 0xe0b03a, 0xf2f2f2, 0x5fb35f, 0x333a44];

/** A cyan target pin (ring + downward arrow) drawn once to a canvas texture. */
function makeMarkerTexture(): CanvasTexture {
  const size = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  if (ctx) {
    ctx.translate(size / 2, size / 2);
    ctx.strokeStyle = '#2fd4d4';
    ctx.fillStyle = 'rgba(47,212,212,0.28)';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(0, -14, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2fd4d4';
    ctx.beginPath();
    ctx.moveTo(-16, 24);
    ctx.lineTo(16, 24);
    ctx.lineTo(0, 52);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new CanvasTexture(cv);
  return tex;
}

/** Slight per-terrain relief so the ground isn't a flat sheet. Returns the box
 *  centre Y and Y-scale for a 1×1×1 unit box (default thin tile at y≈0). */
function terrainRelief(terrain: TerrainType): { y: number; h: number } {
  switch (terrain) {
    case 'mountain':
      return { y: 0.9, h: 2.4 };
    case 'forest':
      return { y: 0.15, h: 0.5 };
    case 'water':
    case 'river':
      return { y: -0.12, h: 0.3 };
    case 'fertile':
      return { y: 0.06, h: 0.26 };
    default:
      return { y: 0.05, h: 0.3 };
  }
}
