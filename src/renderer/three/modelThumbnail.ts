// Model thumbnails (v0.38): render a building's `.glb` to a small preview image
// so the build menu / sheet / level-up cards no longer need a hand-drawn `.png`.
// Drop in a `.glb` and its preview is generated from the model automatically.
//
// One shared offscreen WebGL renderer draws each model once into a transparent
// 256² canvas and the PNG data URL is cached per URL. Purely presentational — no
// simulation state involved (CLAUDE.md §1). If WebGL is unavailable (e.g. tests),
// the promise rejects and the caller falls back to the PNG/SVG preview.

import {
  AmbientLight,
  Box3,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
  type Material,
  type Object3D,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const SIZE = 256; // render resolution; CSS scales it down in the cards
const FOV = 30;

const loader = new GLTFLoader();
const cache = new Map<string, Promise<string>>();

let renderer: WebGLRenderer | undefined;
let rendererFailed = false;

function getRenderer(): WebGLRenderer | undefined {
  if (renderer) return renderer;
  if (rendererFailed) return undefined;
  try {
    const r = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1);
    r.setSize(SIZE, SIZE);
    r.setClearColor(0x000000, 0);
    renderer = r;
    return r;
  } catch {
    rendererFailed = true;
    return undefined;
  }
}

/** A 3-point-ish light rig matching the world look (warm key from top-left). */
function makeScene(): Scene {
  const scene = new Scene();
  scene.add(new HemisphereLight(0xffffff, 0x6b7a5a, 1.0));
  scene.add(new AmbientLight(0xffffff, 0.4));
  const key = new DirectionalLight(0xfff2d8, 1.5);
  key.position.set(-3, 5, 4);
  scene.add(key);
  const fill = new DirectionalLight(0xbcd8f0, 0.5);
  fill.position.set(4, 2, 2);
  scene.add(fill);
  return scene;
}

/** Dispose everything we created for one render (never the renderer itself). */
function disposeObject(obj: Object3D): void {
  obj.traverse((o) => {
    const m = o as Mesh;
    m.geometry?.dispose();
    const mat = (m as unknown as { material?: Material | Material[] }).material;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else mat?.dispose();
  });
}

async function render(url: string): Promise<string> {
  const r = getRenderer();
  if (!r) throw new Error('no-webgl');
  const gltf = await loader.loadAsync(url);
  const model: Group = gltf.scene;

  // Center the model on the origin and frame it in a 3/4 view.
  const box = new Box3().setFromObject(model);
  const size = new Vector3();
  const center = new Vector3();
  box.getSize(size);
  box.getCenter(center);
  model.position.sub(center);
  const scene = makeScene();
  scene.add(model);

  const radius = Math.max(size.length() / 2, 0.001);
  const dist = (radius / Math.sin((FOV * Math.PI) / 360)) * 1.12;
  const camera = new PerspectiveCamera(FOV, 1, 0.01, dist * 10);
  const dir = new Vector3(1, 0.82, 1).normalize();
  camera.position.copy(dir.multiplyScalar(dist));
  // Look slightly above centre so tall buildings feel grounded, not floating.
  camera.lookAt(0, size.y * 0.08, 0);

  r.render(scene, camera);
  const data = r.domElement.toDataURL('image/png');

  scene.remove(model);
  disposeObject(model);
  return data;
}

/**
 * PNG data URL of a rendered `.glb`, generated once and cached. Rejects if WebGL
 * is unavailable or the model fails to load — callers should fall back to their
 * existing PNG/SVG preview.
 */
export function modelThumbnail(url: string): Promise<string> {
  let p = cache.get(url);
  if (!p) {
    p = render(url).catch((e) => {
      cache.delete(url); // allow a later retry (e.g. transient load failure)
      throw e;
    });
    cache.set(url, p);
  }
  return p;
}
