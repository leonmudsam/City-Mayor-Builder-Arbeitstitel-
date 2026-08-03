// § Stadtarbeit-Overhaul P4 — die Aufnahme der Welt von oben.
//
// Eine orthografische Kamera über dem Ausschnitt, ein Renderdurchgang in ein
// Renderziel, ein Rückweg in eine 2D-Leinwand. Mehr ist es nicht — und mehr
// darf es auch nicht sein: Es entsteht KEIN zweiter Renderer, keine zweite
// Szene, kein zweites Material. Aufgenommen wird exakt die Szene, die der
// Spieler ohnehin sieht (CLAUDE.md §2, §11 des Auftrags).
//
// Nebengewinn dieser Bauart: Alles, was die Welt kann, kann die Karte
// automatisch mit. Die Entsättigung gesperrter Regionen (D-056) steckt im
// Fragment-Shader des Bodens — sie erscheint auf der Karte, ohne dass hier
// jemand eine Zeile dafür schreibt. Genau das war der Fehler der alten Karte:
// Sie hat jede Weltinformation ein zweites Mal nachgebaut.

import {
  LinearFilter,
  OrthographicCamera,
  SRGBColorSpace,
  WebGLRenderTarget,
  type Object3D,
  type Scene,
  type WebGLRenderer,
} from 'three';
import type { WorldSnapshot, WorldSnapshotArea } from '../worldSnapshot.ts';

/**
 * Höhe der Aufnahmekamera über dem Meeresspiegel.
 *
 * Zwei Bedingungen, die zusammen wenig Spielraum lassen: hoch genug über dem
 * höchsten Gipfel (48 m) samt Aufbauten — und tief genug, dass der lineare
 * Weltnebel (`Fog(…, 520, 1600)` in `SkyEnvironment`) nicht greift. Bei einer
 * orthografischen Kamera ist die Nebeltiefe die Sichttiefe, also der
 * Höhenabstand; 240 liegt weit unter 520, die Karte bleibt klar, ohne dass
 * hier am Nebel gedreht werden muss (ein Wechsel von `scene.fog` würde alle
 * Materialien neu übersetzen — ein Ruckler, der niemandem nützt).
 */
const CAMERA_HEIGHT = 240;
const NEAR = 1;
const FAR = 600;

export interface TopDownCaptureOptions {
  /** Objekte, die auf der Karte nichts zu suchen haben (Marker, Overlays, Ghost). */
  hidden?: readonly (Object3D | undefined)[];
  /** Wird nach dem Setzen der Kamera und vor dem Rendern aufgerufen (LOD-Wahl). */
  beforeRender?(center: { x: number; z: number }): void;
  afterRender?(): void;
}

/**
 * Nimmt `area` (in Weltkacheln) von oben auf. Weltkoordinaten sind Kacheln:
 * Kachel (x, y) liegt bei (x, y) in X/Z — dieselbe Rechnung wie überall im
 * Renderer, deshalb steht hier keine Umrechnung.
 */
export function captureTopDown(
  renderer: WebGLRenderer,
  scene: Scene,
  area: WorldSnapshotArea,
  pixelsPerTile: number,
  options: TopDownCaptureOptions = {},
): WorldSnapshot | undefined {
  const width = Math.max(1, Math.round(area.w * pixelsPerTile));
  const height = Math.max(1, Math.round(area.h * pixelsPerTile));
  const centerX = area.x + area.w / 2;
  const centerZ = area.y + area.h / 2;

  const camera = new OrthographicCamera(-area.w / 2, area.w / 2, area.h / 2, -area.h / 2, NEAR, FAR);
  // Bildschirm-oben soll Welt-Norden (−Z) sein, damit die Aufnahme dieselbe
  // Ausrichtung hat wie die gezeichneten Ebenen: +X nach rechts, +Z nach unten.
  camera.up.set(0, 0, -1);
  camera.position.set(centerX, CAMERA_HEIGHT, centerZ);
  camera.lookAt(centerX, 0, centerZ);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);

  const target = new WebGLRenderTarget(width, height, {
    depthBuffer: true,
    stencilBuffer: false,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
  });
  // Ohne das bliebe das Bild im linearen Farbraum und damit sichtbar zu dunkel:
  // Der Renderer wandelt nur um, wenn das ZIEL sagt, dass es sRGB erwartet.
  target.texture.colorSpace = SRGBColorSpace;

  const restore: (() => void)[] = [];
  for (const object of options.hidden ?? []) {
    if (!object) continue;
    const previous = object.visible;
    object.visible = false;
    restore.push(() => {
      object.visible = previous;
    });
  }

  const previousTarget = renderer.getRenderTarget();
  const previousAlpha = renderer.getClearAlpha();
  try {
    options.beforeRender?.({ x: centerX, z: centerZ });
    // Durchsichtig löschen: Wo nichts steht (offenes Meer jenseits der
    // Wasserfläche), soll der Kartenhintergrund durchscheinen statt eines
    // Kastens in Himmelsfarbe.
    renderer.setClearAlpha(0);
    renderer.setRenderTarget(target);
    renderer.clear(true, true, false);
    renderer.render(scene, camera);

    const pixels = new Uint8Array(width * height * 4);
    renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const image = ctx.createImageData(width, height);
    // Der Grafikspeicher liefert von unten nach oben; die Leinwand erwartet es
    // andersherum. Zeilenweise kopieren ist der günstigste Weg dahin.
    const stride = width * 4;
    for (let row = 0; row < height; row += 1) {
      const from = (height - 1 - row) * stride;
      image.data.set(pixels.subarray(from, from + stride), row * stride);
    }
    ctx.putImageData(image, 0, 0);
    const probe = window as unknown as Record<string, unknown>;
    if (probe['__cmbProbe']) probe['__cmbSnapshot'] = canvas.toDataURL();
    return { canvas, area, pixelsPerTile };
  } catch {
    // Ein fehlgeschlagener Rückweg (verlorener Kontext, Speicher) darf die
    // Stadtarbeit nicht beenden — die Karte zeichnet dann ihre eigenen Ebenen.
    return undefined;
  } finally {
    renderer.setRenderTarget(previousTarget);
    renderer.setClearAlpha(previousAlpha);
    options.afterRender?.();
    for (const undo of restore) undo();
    target.dispose();
  }
}
