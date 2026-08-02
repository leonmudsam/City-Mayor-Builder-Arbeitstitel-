// Aufbau der Natur-Instanzen im Three-Renderer (§ Natur-Overhaul 14.0).
//
// Trennung der Zuständigkeiten:
//   `natureZones.ts`        — WELCHE Regel gilt wo (rein, testbar).
//   `natureDistribution.ts` — WO steht was (rein, testbar).
//   dieses Modul            — WIE es zu Geometrie wird (three, nicht testbar).
//
// Der Renderer selbst trifft damit keine Verteilungsentscheidung mehr; er reicht
// eine fertige Platzierung herein und bekommt fertige `InstancedMesh`-Gruppen
// zurück. Das hielt `ThreeMapRenderer.ts` davon ab, um weitere 400 Zeilen
// Verteilungslogik zu wachsen.
//
// PERFORMANCE-ZUSICHERUNGEN (§8 des Auftrags, CLAUDE.md §6):
//   · Je Prop-Art existiert GENAU EINE Geometrie und EIN Material — beide
//     werden zwischen allen Regionen und allen Neuaufbauten geteilt.
//   · Gezeichnet wird ausschließlich über `InstancedMesh`, aufgeteilt in
//     räumliche Chunks, damit Frustum- und Distance-Culling greifen können.
//   · Variation entsteht pro Instanz aus Skalierung, Drehung, Neigung und
//     Instanzfarbe — nie aus zusätzlicher Geometrie.

import {
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Material,
  MeshLambertMaterial,
  Object3D,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { spatialPropChunks } from './vegetationBudget.ts';
import { patchLockedRegionTint } from './lockedRegionMask.ts';
import type { NatureInstance, NaturePlacement } from './natureDistribution.ts';
import type { NatureKind } from './natureZones.ts';
import { terrainHeightAt, terrainMinHeightAround } from './terrainHeight.ts';
import {
  makeBroadleafGeometry,
  makeBushGeometry,
  makeCliffRockGeometry,
  makeConiferGeometry,
  makeDeadwoodGeometry,
  makeDryShrubGeometry,
  makeFieldRowGeometry,
  makeFlowerPatchGeometry,
  makeGrassTuftGeometry,
  makeReedGeometry,
  makeRockGeometry,
  makeSaplingGeometry,
  makeScreeGeometry,
  makeShoreRockGeometry,
  makeStumpGeometry,
} from './naturePropGeometry.ts';

/**
 * Räumliche Chunk-Kantenlänge der Massenvegetation in Kacheln.
 *
 * Kleiner = feineres Culling, aber mehr Draw-Calls; größer = weniger
 * Draw-Calls, aber gröberes Culling. 72 hält die Zahl der Instanzgruppen je
 * Prop-Art im niedrigen zweistelligen Bereich und die Chunk-Kante trotzdem
 * deutlich unter der Sichtweite des mittleren Qualitätsprofils.
 */
export const NATURE_CHUNK_TILES = 72;

/**
 * Baumarten, deren volle Silhouette im HLOD-Betrieb an der mittleren Grenze
 * endet. Jungbaeume werden dort ebenfalls ausgeblendet, speisen aber bewusst
 * keinen Fernwald: ein vergroesserter Jungbaum-Cluster waere als Kleinstprop
 * aus der Distanz staerker sichtbar als in der Naehe.
 */
const TREE_KINDS = new Set<NatureKind>([
  'pine',
  'largePine',
  'broadleaf',
  'meadowTree',
  'sapling',
]);
const HLOD_SOURCE_KINDS: readonly NatureKind[] = [
  'pine',
  'largePine',
  'broadleaf',
  'meadowTree',
];

/** Eine Fernwald-Instanz fasst mehrere nahe Bauminstanzen zusammen. */
interface ForestHlodInstance {
  x: number;
  z: number;
  scale: number;
  sourceCount: number;
}

/** Kantenlaenge der feineren Sammelzellen innerhalb eines Render-Chunks. */
const FOREST_HLOD_CELL_TILES = 12;
/**
 * Umschalt-Batches bleiben ein kleines, ganzzahliges Vielfaches der HLOD-Zelle.
 * So wird keine 12er-Waldzelle zwischen zwei Proxies geteilt, zugleich entsteht
 * an der LOD-Grenze kein mehr als 100 Kacheln breites Doppelzeichnungsband.
 */
const FOREST_HLOD_RENDER_CHUNK_TILES = FOREST_HLOD_CELL_TILES * 2;

/** Wie eine Art in Geometrie übersetzt wird. */
interface RenderSpec {
  /** Wird einmal gebaut und danach für alle Instanzen geteilt. */
  geometry: () => BufferGeometry;
  /** Grundgröße in Kacheln (die Instanzskalierung multipliziert darauf). */
  size: number;
  /** Erdung auf dem tiefsten Punkt der eigenen Grundfläche statt auf der Mitte. */
  groundRadius?: number;
  /** Zusätzliches Eingraben in den Hang, skaliert mit der Instanz. */
  sink?: number;
  /** Maximale Neigung in Radiant (Felsen kippen, Bäume kaum). */
  tilt: number;
  /** Streuung innerhalb der Kachel (0..1 Kachelbreite). */
  jitter: number;
  /** Stärke der Farbstreuung je Instanz (0 = aus). */
  colorJitter: number;
  /** Kleine Props verschwinden früh (`smallPropCullDistance`). */
  small?: boolean;
  /** Darf die Art überhaupt Schatten werfen? */
  shadow?: boolean;
}

/**
 * Die Formzuordnung. `giantTree` und `boulder` fehlen bewusst: sie bleiben
 * echte `.glb`-Hero-Props und werden vom Renderer über den Modellpfad gesetzt.
 */
const RENDER_SPECS: Partial<Record<NatureKind, RenderSpec>> = {
  pine: { geometry: makeConiferGeometry, size: 1.15, tilt: 0.05, jitter: 0.5, colorJitter: 0.13, shadow: true },
  largePine: { geometry: makeConiferGeometry, size: 1.5, tilt: 0.04, jitter: 0.42, colorJitter: 0.11, shadow: true },
  broadleaf: { geometry: makeBroadleafGeometry, size: 1.2, tilt: 0.06, jitter: 0.5, colorJitter: 0.14, shadow: true },
  meadowTree: { geometry: makeBroadleafGeometry, size: 1.45, tilt: 0.05, jitter: 0.4, colorJitter: 0.13, shadow: true },
  sapling: { geometry: makeSaplingGeometry, size: 0.9, tilt: 0.09, jitter: 0.55, colorJitter: 0.15 },
  bush: { geometry: makeBushGeometry, size: 0.85, tilt: 0.07, jitter: 0.55, colorJitter: 0.16 },
  dryShrub: { geometry: makeDryShrubGeometry, size: 0.8, tilt: 0.08, jitter: 0.55, colorJitter: 0.14 },
  rock: { geometry: makeRockGeometry, size: 0.9, groundRadius: 0.34, sink: 0.12, tilt: 0.22, jitter: 0.5, colorJitter: 0.12, shadow: true },
  shoreRock: { geometry: makeShoreRockGeometry, size: 0.95, groundRadius: 0.36, sink: 0.16, tilt: 0.18, jitter: 0.55, colorJitter: 0.13 },
  scree: { geometry: makeScreeGeometry, size: 0.8, groundRadius: 0.3, sink: 0.08, tilt: 0.26, jitter: 0.6, colorJitter: 0.12, small: true },
  cliffRock: { geometry: makeCliffRockGeometry, size: 1.7, groundRadius: 0.5, sink: 0.28, tilt: 0.12, jitter: 0.35, colorJitter: 0.1, shadow: true },
  reed: { geometry: makeReedGeometry, size: 0.7, tilt: 0.1, jitter: 0.6, colorJitter: 0.14, small: true },
  deadwood: { geometry: makeDeadwoodGeometry, size: 0.85, groundRadius: 0.28, sink: 0.04, tilt: 0.12, jitter: 0.5, colorJitter: 0.1, small: true },
  stump: { geometry: makeStumpGeometry, size: 0.8, groundRadius: 0.24, sink: 0.05, tilt: 0.06, jitter: 0.5, colorJitter: 0.1, small: true },
  flower: { geometry: makeFlowerPatchGeometry, size: 0.75, tilt: 0.05, jitter: 0.65, colorJitter: 0.2, small: true },
  microGrass: { geometry: makeGrassTuftGeometry, size: 0.8, tilt: 0.07, jitter: 0.7, colorJitter: 0.18, small: true },
  fieldRow: { geometry: makeFieldRowGeometry, size: 1, tilt: 0.02, jitter: 0.2, colorJitter: 0.09, small: true },
};

/**
 * Gibt es für diese Art eine stilisierte Form? Der Renderer fragt das, bevor er
 * Kacheln aus einem fehlenden Drop-in-Modell in die Masse zurückfallen lässt —
 * `giantTree` und `boulder` haben bewusst keine (§5: ohne Modell lieber nichts
 * als eine Ersatzform, die in dieser Größe sofort auffiele).
 */
export function hasNatureGeometry(kind: NatureKind): boolean {
  return kind in RENDER_SPECS;
}

/** Geteilte Geometrie je Art — einmal gebaut, nie pro Region neu. */
const geometryCache = new Map<NatureKind, BufferGeometry>();
/** Geteilte Fernwald-Geometrie; sie entsteht erst, wenn HLOD aktiv ist. */
let sharedForestHlodGeometry: BufferGeometry | undefined;
/** Statisches Material für Felsen, Bodenprops und Unterholz. */
let sharedStaticMaterial: MeshLambertMaterial | undefined;
/** Ein einziges Windmaterial für alle vollen Bäume und Fernwald-Cluster. */
let sharedWindMaterial: MeshLambertMaterial | undefined;

/**
 * Alle Windmeshes teilen exakt dasselbe Uniform-Objekt. Eine Aktualisierung
 * kostet dadurch O(1), unabhängig von Instanz- und Chunkzahl.
 */
const sharedNatureWindTime = { value: 0 };

function geometryFor(kind: NatureKind, spec: RenderSpec): BufferGeometry {
  let geometry = geometryCache.get(kind);
  if (!geometry) {
    geometry = spec.geometry();
    // Die Formen sind auf Höhe ~1 gebaut; `size` bringt sie auf Kachelmaß.
    geometry.scale(spec.size, spec.size, spec.size);
    geometry.computeBoundingSphere();
    geometryCache.set(kind, geometry);
  }
  return geometry;
}

function createNatureMaterial(): MeshLambertMaterial {
  return new MeshLambertMaterial({
    vertexColors: true,
    // Kegel und Ballen sind offene Formen; beidseitig zeichnen kostet hier
    // nichts und verhindert Löcher an gekippten Instanzen.
    side: DoubleSide,
  });
}

function addShaderWind(material: MeshLambertMaterial): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.cmbNatureWindTime = sharedNatureWindTime;
    shader.vertexShader = `uniform float cmbNatureWindTime;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      vec3 cmbNatureAnchor = modelMatrix[3].xyz;
      #ifdef USE_INSTANCING
        cmbNatureAnchor = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      #endif
      float cmbNatureWindMask = smoothstep(0.16, 1.18, position.y);
      float cmbNatureWindPhase = dot(cmbNatureAnchor.xz, vec2(0.173, 0.219));
      float cmbNatureWindPrimary = sin(cmbNatureWindTime * 1.31 + cmbNatureWindPhase);
      float cmbNatureWindSecondary = cos(cmbNatureWindTime * 0.83 + cmbNatureWindPhase * 1.37);
      transformed.x += cmbNatureWindPrimary * cmbNatureWindMask * 0.038;
      transformed.z += cmbNatureWindSecondary * cmbNatureWindMask * 0.024;`,
    );
  };
  material.customProgramCacheKey = () => 'city-mayor-nature-wind-v1';
}

// § D-056: Die Sperrmaske hängt am ORT, nicht am Material — deshalb reicht
// EIN gepatchtes Material für freigeschaltetes UND gesperrtes Land. Die zwei
// Vegetationsaufbauten aus D-045 bleiben davon unberührt; sie existieren wegen
// der Neuaufbau-Kosten, nicht wegen der Farbe.
//
// Reihenfolge ist Pflicht: `addShaderWind` SETZT `onBeforeCompile`, der
// Sperr-Patch KETTET sich daran. Andersherum überschriebe der Wind die Sperre
// und gesperrte Bäume blieben bunt — genau der Fehlertyp, der v1.35 nicht
// aufgefallen ist.
function materialFor(wind: boolean): MeshLambertMaterial {
  if (!wind) {
    if (!sharedStaticMaterial) {
      sharedStaticMaterial = createNatureMaterial();
      patchLockedRegionTint(sharedStaticMaterial, { cacheKey: 'nature-static' });
    }
    return sharedStaticMaterial;
  }
  if (!sharedWindMaterial) {
    sharedWindMaterial = createNatureMaterial();
    addShaderWind(sharedWindMaterial);
    patchLockedRegionTint(sharedWindMaterial, { cacheKey: 'nature-wind' });
  }
  return sharedWindMaterial;
}

function forestHlodGeometry(): BufferGeometry {
  if (sharedForestHlodGeometry) return sharedForestHlodGeometry;

  // Vier versetzte Low-Poly-Silhouetten bilden einen Wald-Fleck. Eine Instanz
  // davon ersetzt in der Ferne mehrere Einzelbäume.
  const pieces = [
    { geometry: makeConiferGeometry(), x: -0.42, z: 0.18, scale: 0.92 },
    { geometry: makeConiferGeometry(), x: 0.38, z: 0.3, scale: 0.72 },
    { geometry: makeBroadleafGeometry(), x: -0.08, z: -0.32, scale: 0.78 },
    { geometry: makeConiferGeometry(), x: 0.55, z: -0.2, scale: 0.58 },
  ];
  for (const piece of pieces) {
    piece.geometry.scale(piece.scale, piece.scale, piece.scale);
    piece.geometry.translate(piece.x, 0, piece.z);
  }
  const merged = mergeGeometries(pieces.map((piece) => piece.geometry), false);
  for (const piece of pieces) piece.geometry.dispose();
  if (!merged) throw new Error('Fernwald-Geometrie konnte nicht gebündelt werden.');
  merged.computeBoundingSphere();
  sharedForestHlodGeometry = merged;
  return merged;
}

/**
 * Registriert Geometrie und Material als geteilten Besitz, damit
 * `ThreeMapRenderer.disposeGroup` sie beim Neuaufbau NICHT freigibt. Ohne das
 * wäre die zweite Vegetationsrunde leer.
 */
export function natureSharedResources(): readonly object[] {
  return [
    ...geometryCache.values(),
    ...(sharedForestHlodGeometry ? [sharedForestHlodGeometry] : []),
    materialFor(false),
    materialFor(true),
  ];
}

/**
 * Setzt die visuelle Windzeit in Sekunden. Alle Vegetations-Shader beobachten
 * dieses geteilte Uniform; es gibt absichtlich keine JS-Schleife über Meshes
 * oder Instanzen.
 */
export function updateNatureWind(elapsedSeconds: number): void {
  sharedNatureWindTime.value = Number.isFinite(elapsedSeconds)
    ? Math.max(0, elapsedSeconds)
    : 0;
}

/** Stabiler 0..1-Hash — identisch zur Renderer- und Budget-Variante. */
function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

/** Dezente Multiplikatoren halten dieselbe Prop-Geometrie je Naturraum lesbar. */
function zoneTint(zone: NatureInstance['zone']): readonly [number, number, number] {
  switch (zone) {
    case 'forest_core': return [0.88, 0.98, 0.86];
    case 'forest_edge': return [0.94, 1, 0.9];
    case 'meadow': return [1.04, 1.03, 0.92];
    case 'rocky_highland': return [0.97, 0.98, 0.94];
    case 'coast_flat': return [1.02, 1.04, 1.01];
    case 'coast_rocky': return [0.96, 0.99, 1.02];
    case 'wetland': return [0.89, 1.01, 0.96];
    case 'small_island': return [1, 1.03, 0.92];
  }
}

export interface NatureMassOptions {
  /** Sichtweite großer Vegetation (aus dem Grafikprofil). */
  viewDistance: number;
  /** Sichtweite kleiner Bodenprops. */
  smallPropDistance: number;
  /**
   * Nah-, Mittel- und Ferngrenze des Vegetationsprofils. Die mittlere Grenze
   * trennt volle Baumgeometrie vom Fernwald; die Ferngrenze bleibt informativ,
   * denn das HLOD endet verbindlich an `viewDistance`.
   */
  lodDistances?: readonly [near: number, middle: number, far: number];
  /** Aktiviert die instanzierten Wald-Cluster hinter der mittleren Grenze. */
  impostorsEnabled?: boolean;
  /**
   * Gibt zurück, ob eine Gruppe dieser Größe noch Schatten werfen darf, und
   * verbucht sie im Schattenbudget des Profils.
   */
  claimShadow: (count: number) => boolean;
}

export interface NatureLodEntry {
  object: Object3D;
  centerX: number;
  centerZ: number;
  /** Untere Sichtgrenze; optional für bestehende Nicht-Natur-Aufrufer. */
  minDistance?: number;
  /** Räumlicher Radius der Gruppe; verhindert vorzeitiges Culling am Rand. */
  paddingRadius?: number;
  maxDistance: number;
}

export interface NatureMassResult {
  /** Fertige Gruppe zum Einhängen in die Vegetationsgruppe. */
  group: Group;
  /** Distanzabhängig ein-/auszublendende Instanzgruppen. */
  lod: NatureLodEntry[];
  /** Anzahl erzeugter Instanzen (Diagnose/Performance-Panel). */
  instances: number;
  /** Anzahl erzeugter Draw-Calls (Diagnose/Performance-Panel). */
  drawCalls: number;
}

/**
 * Verdichtet die Baumdaten eines großen Render-Chunks in kleine, stabile
 * Waldzellen. Zellen mit weniger als drei Bäumen bekommen keinen Fernproxy:
 * einzelne Solitärbäume sollen nicht als ganzer Wald-Fleck erscheinen.
 */
function forestHlodInstances(source: readonly NatureInstance[]): ForestHlodInstance[] {
  const cells = new Map<string, {
    x: number;
    z: number;
    scale: number;
    count: number;
  }>();
  for (const tree of source) {
    const cellX = Math.floor(tree.x / FOREST_HLOD_CELL_TILES);
    const cellZ = Math.floor(tree.y / FOREST_HLOD_CELL_TILES);
    const key = `${cellX},${cellZ}`;
    const cell = cells.get(key);
    if (cell) {
      cell.x += tree.x + 0.5;
      cell.z += tree.y + 0.5;
      cell.scale += tree.scale;
      cell.count++;
    } else {
      cells.set(key, {
        x: tree.x + 0.5,
        z: tree.y + 0.5,
        scale: tree.scale,
        count: 1,
      });
    }
  }

  return [...cells.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([, cell]) => {
      if (cell.count < 3) return [];
      const averageScale = cell.scale / cell.count;
      const densityScale = Math.min(2.35, 0.75 + Math.sqrt(cell.count) * 0.3);
      return [{
        x: cell.x / cell.count,
        z: cell.z / cell.count,
        scale: averageScale * densityScale,
        sourceCount: cell.count,
      }];
    });
}

function forestHlodCellKey(tree: Pick<NatureInstance, 'x' | 'y'>): string {
  return `${Math.floor(tree.x / FOREST_HLOD_CELL_TILES)},${Math.floor(tree.y / FOREST_HLOD_CELL_TILES)}`;
}

interface HorizontalLodBounds {
  centerX: number;
  centerZ: number;
  paddingRadius: number;
}

/**
 * Kleinster einfacher Kreis um die horizontalen Instanz-Bounds eines Batches.
 * Der fruehere feste Radius der maximalen 72er-Chunkdiagonale hielt selbst eine
 * einzelne Blume noch 51 Kacheln ueber ihre eigentliche Sichtweite hinaus aktiv.
 */
function horizontalLodBounds<T>(
  source: readonly T[],
  xAt: (entry: T) => number,
  zAt: (entry: T) => number,
  radiusAt: (entry: T) => number,
): HorizontalLodBounds {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const entry of source) {
    const radius = Math.max(0, radiusAt(entry));
    const x = xAt(entry);
    const z = zAt(entry);
    minX = Math.min(minX, x - radius);
    maxX = Math.max(maxX, x + radius);
    minZ = Math.min(minZ, z - radius);
    maxZ = Math.max(maxZ, z + radius);
  }
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;
  let paddingRadius = 0;
  for (const entry of source) {
    paddingRadius = Math.max(
      paddingRadius,
      Math.hypot(xAt(entry) - centerX, zAt(entry) - centerZ) + Math.max(0, radiusAt(entry)),
    );
  }
  return { centerX, centerZ, paddingRadius };
}

/** Kugel um die lokale Geometrie inklusive eines eventuell versetzten Zentrums. */
function geometryRadiusFromAnchor(geometry: BufferGeometry): number {
  geometry.computeBoundingSphere();
  const bounds = geometry.boundingSphere;
  return bounds ? bounds.center.length() + bounds.radius : 1;
}

/**
 * Baut die gesamte stilisierte Massenvegetation einer Platzierung.
 *
 * Alles, was Vielfalt erzeugt, passiert hier pro Instanz und kostet keine
 * zusätzliche Geometrie: Größe aus der Zonenregel, freie Drehung um Y, leichte
 * Neigung, Versatz innerhalb der Kachel und eine Farbstreuung über
 * `setColorAt`. Das ist die Antwort auf „dieselben Modelle, aber intelligent
 * variiert".
 */
export function buildNatureMass(
  placement: NaturePlacement,
  options: NatureMassOptions,
): NatureMassResult {
  const group = new Group();
  const lod: NatureLodEntry[] = [];
  const dummy = new Object3D();
  const color = new Color();
  let instances = 0;
  let drawCalls = 0;
  const viewDistance = Math.max(0, options.viewDistance);
  const middleDistance = Math.min(
    viewDistance,
    Math.max(0, options.lodDistances?.[1] ?? viewDistance),
  );
  const useForestHlod = options.impostorsEnabled === true
    && middleDistance < viewDistance;
  const sourceTrees = HLOD_SOURCE_KINDS.flatMap((kind) => placement[kind] ?? []);
  const forestCellCounts = new Map<string, number>();
  if (useForestHlod) {
    for (const tree of sourceTrees) {
      const key = forestHlodCellKey(tree);
      forestCellCounts.set(key, (forestCellCounts.get(key) ?? 0) + 1);
    }
  }
  const denseForestCells = new Set(
    [...forestCellCounts].filter(([, count]) => count >= 3).map(([key]) => key),
  );

  for (const [kind, spec] of Object.entries(RENDER_SPECS) as [NatureKind, RenderSpec][]) {
    const list = placement[kind];
    if (!list || list.length === 0) continue;
    const geometry = geometryFor(kind, spec);
    const isTree = TREE_KINDS.has(kind);
    const material = materialFor(isTree);
    const defaultCullDistance = spec.small
      ? options.smallPropDistance
      : useForestHlod && isTree
        ? middleDistance
        : viewDistance;
    const renderBatches = useForestHlod && HLOD_SOURCE_KINDS.includes(kind)
      ? [
          {
            list: list.filter((tree) => denseForestCells.has(forestHlodCellKey(tree))),
            cullDistance: middleDistance,
            chunkTiles: FOREST_HLOD_RENDER_CHUNK_TILES,
          },
          {
            list: list.filter((tree) => !denseForestCells.has(forestHlodCellKey(tree))),
            cullDistance: viewDistance,
            chunkTiles: NATURE_CHUNK_TILES,
          },
        ]
      : [{ list, cullDistance: defaultCullDistance, chunkTiles: NATURE_CHUNK_TILES }];
    const geometryRadius = geometryRadiusFromAnchor(geometry);

    for (const batch of renderBatches) {
      for (const chunk of spatialPropChunks(batch.list, batch.chunkTiles)) {
      const mesh = new InstancedMesh(geometry, material as Material, chunk.length);
      mesh.castShadow = Boolean(spec.shadow) && options.claimShadow(chunk.length);
      mesh.receiveShadow = true;
      mesh.userData.natureKind = kind;
      mesh.userData.natureHlod = false;
      // Ohne das rechnet three die Bounds aus der Basisgeometrie und cullt
      // ganze Gruppen weg, sobald die Kamera seitlich steht.
      mesh.frustumCulled = true;
      for (let index = 0; index < chunk.length; index++) {
        const instance = chunk[index] as NatureInstance;
        const seed = `${kind}:${instance.x},${instance.y}`;
        const rotation = hash01(`rot:${seed}`);
        const offsetX = (hash01(`ox:${seed}`) - 0.5) * spec.jitter;
        const offsetZ = (hash01(`oz:${seed}`) - 0.5) * spec.jitter;
        const px = instance.x + 0.5 + offsetX;
        const pz = instance.y + 0.5 + offsetZ;
        const scale = instance.scale;
        const ground = spec.groundRadius
          ? terrainMinHeightAround(px, pz, spec.groundRadius * spec.size * scale)
          : terrainHeightAt(px, pz);
        dummy.position.set(px, ground - (spec.sink ?? 0) * spec.size * scale, pz);
        dummy.rotation.set(
          (hash01(`tx:${seed}`) - 0.5) * spec.tilt * 2,
          rotation * Math.PI * 2,
          (hash01(`tz:${seed}`) - 0.5) * spec.tilt * 2,
        );
        // Leicht ungleichmäßige Skalierung: derselbe Fels wird mal gedrungen,
        // mal schlank — bei Bäumen bewusst schwächer, sonst wirken sie krank.
        const squash = 1 + (hash01(`sq:${seed}`) - 0.5) * (spec.shadow ? 0.16 : 0.3);
        dummy.scale.set(scale, scale * squash, scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
        if (spec.colorJitter > 0) {
          const warm = (hash01(`cr:${seed}`) - 0.5) * spec.colorJitter;
          const light = 1 + (hash01(`cl:${seed}`) - 0.5) * spec.colorJitter;
          const tint = zoneTint(instance.zone);
          color.setRGB(
            Math.max(0, (light + warm) * tint[0]),
            Math.max(0, light * tint[1]),
            Math.max(0, (light - warm * 0.8) * tint[2]),
          );
          mesh.setColorAt(index, color);
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
      group.add(mesh);
      instances += chunk.length;
      drawCalls++;
      const lodBounds = horizontalLodBounds(
        chunk as NatureInstance[],
        (instance) => instance.x + 0.5,
        (instance) => instance.y + 0.5,
        (instance) =>
          geometryRadius * instance.scale * 1.08 +
          spec.jitter * Math.SQRT2 / 2 +
          (isTree ? 0.06 : 0),
      );
      lod.push({
        object: mesh,
        centerX: lodBounds.centerX,
        centerZ: lodBounds.centerZ,
        minDistance: 0,
        paddingRadius: lodBounds.paddingRadius,
        maxDistance: batch.cullDistance,
      });
      }
    }
  }

  if (useForestHlod) {
    for (const sourceChunk of spatialPropChunks(sourceTrees, FOREST_HLOD_RENDER_CHUNK_TILES)) {
      const proxies = forestHlodInstances(sourceChunk as NatureInstance[]);
      if (proxies.length === 0) continue;
      const geometry = forestHlodGeometry();
      const mesh = new InstancedMesh(
        geometry,
        materialFor(true) as Material,
        proxies.length,
      );
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      mesh.frustumCulled = true;
      mesh.userData.natureHlod = true;
      mesh.userData.natureKind = 'forestHlod';
      mesh.userData.sourceInstances = proxies.reduce(
        (sum, proxy) => sum + proxy.sourceCount,
        0,
      );

      for (let index = 0; index < proxies.length; index++) {
        const proxy = proxies[index]!;
        const seed = `forest-hlod:${proxy.x.toFixed(2)},${proxy.z.toFixed(2)}`;
        const ground = terrainMinHeightAround(
          proxy.x,
          proxy.z,
          Math.min(2.4, proxy.scale * 0.8),
        );
        dummy.position.set(proxy.x, ground, proxy.z);
        dummy.rotation.set(0, hash01(`rot:${seed}`) * Math.PI * 2, 0);
        dummy.scale.setScalar(proxy.scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);

        const warm = (hash01(`warm:${seed}`) - 0.5) * 0.08;
        const light = 0.92 + hash01(`light:${seed}`) * 0.13;
        color.setRGB(light + warm, light, light - warm * 0.6);
        mesh.setColorAt(index, color);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
      group.add(mesh);
      instances += proxies.length;
      drawCalls++;
      const geometryRadius = geometryRadiusFromAnchor(geometry);
      const lodBounds = horizontalLodBounds(
        proxies,
        (proxy) => proxy.x,
        (proxy) => proxy.z,
        (proxy) => geometryRadius * proxy.scale * 1.08 + 0.06,
      );
      lod.push({
        object: mesh,
        centerX: lodBounds.centerX,
        centerZ: lodBounds.centerZ,
        minDistance: middleDistance,
        paddingRadius: lodBounds.paddingRadius,
        maxDistance: viewDistance,
      });
    }
  }

  return { group, lod, instances, drawCalls };
}
