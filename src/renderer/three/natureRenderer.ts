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
import { spatialPropChunks } from './vegetationBudget.ts';
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
/** EIN Material für alle Naturprops: die Farbe steckt in Vertex- und Instanzfarbe. */
let sharedMaterial: MeshLambertMaterial | undefined;

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

function materialFor(): MeshLambertMaterial {
  sharedMaterial ??= new MeshLambertMaterial({
    vertexColors: true,
    // Kegel und Ballen sind offene Formen; beidseitig zeichnen kostet hier
    // nichts und verhindert Löcher an gekippten Instanzen.
    side: DoubleSide,
  });
  return sharedMaterial;
}

/**
 * Registriert Geometrie und Material als geteilten Besitz, damit
 * `ThreeMapRenderer.disposeGroup` sie beim Neuaufbau NICHT freigibt. Ohne das
 * wäre die zweite Vegetationsrunde leer.
 */
export function natureSharedResources(): readonly object[] {
  return [...geometryCache.values(), materialFor()];
}

/** Stabiler 0..1-Hash — identisch zur Renderer- und Budget-Variante. */
function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

export interface NatureMassOptions {
  /** Sichtweite großer Vegetation (aus dem Grafikprofil). */
  viewDistance: number;
  /** Sichtweite kleiner Bodenprops. */
  smallPropDistance: number;
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

  for (const [kind, spec] of Object.entries(RENDER_SPECS) as [NatureKind, RenderSpec][]) {
    const list = placement[kind];
    if (!list || list.length === 0) continue;
    const geometry = geometryFor(kind, spec);
    const material = materialFor();
    const cullDistance = spec.small ? options.smallPropDistance : options.viewDistance;

    for (const chunk of spatialPropChunks(list, NATURE_CHUNK_TILES)) {
      const mesh = new InstancedMesh(geometry, material as Material, chunk.length);
      mesh.castShadow = Boolean(spec.shadow) && options.claimShadow(chunk.length);
      mesh.receiveShadow = true;
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
          color.setRGB(
            Math.max(0, light + warm),
            Math.max(0, light),
            Math.max(0, light - warm * 0.8),
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
      lod.push({
        object: mesh,
        centerX: chunk.reduce((sum, tile) => sum + tile.x + 0.5, 0) / chunk.length,
        centerZ: chunk.reduce((sum, tile) => sum + tile.y + 0.5, 0) / chunk.length,
        maxDistance: cullDistance,
      });
    }
  }

  return { group, lod, instances, drawCalls };
}
