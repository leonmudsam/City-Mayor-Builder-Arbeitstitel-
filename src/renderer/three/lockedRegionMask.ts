// § Gesperrte Regionen (D-056, schärft D-045) — DIE SPERRE IST EIN ORT, KEIN OBJEKT.
//
// Der gemessene Anlass: Die Entsättigung gesperrten Landes steckte ausschließlich
// in der VERTEXFARBE des Bodens. Zwei Dinge haben sie danach wieder aufgehoben —
// der Splat-Shader mischt volle Fototexturen darüber (`coverage` bis 0,44) und
// hebt anschließend die Sättigung um den Faktor 1,1 an. Alles andere, was in
// einer gesperrten Region steht, wurde nie behandelt: Vegetationsmasse,
// Hero-`.glb`, Landmarken, Wasser. Ergebnis im Spiel: bunte Sperrgebiete.
//
// ENTSCHEIDEND und der Grund, warum das hier ein eigenes Modul ist: Wer die
// Grauschaltung pro Objektgruppe einbaut, muss sie bei JEDER neuen Objektgruppe
// erneut einbauen — und wird sie vergessen. Deshalb hängt sie nicht mehr am
// Objekt, sondern am **Ort**: zwei winzige Texturen beschreiben die Welt, und
// jedes Material, das über `patchLockedRegionTint` läuft, liest sie im Shader.
// Ein neuer Prop-Typ ist damit automatisch korrekt, sobald er ein gepatchtes
// Material benutzt.
//
// Aufbau (bewusst zwei Texturen statt einer):
//   1. `regionIdTexture` — 512², R8, NEAREST. Enthält die Regions-Id je Kachel.
//      Sie ist aus dem Bake abgeleitet und ändert sich **nie**; einmal gebaut.
//   2. `lockAmountTexture` — 64×1, R8, NEAREST. Enthält je Regions-Id, wie stark
//      sie gesperrt wirkt (1 = voll grau, 0 = eigenes Land).
//
// Dadurch kostet ein Freischalten das Hochladen von **64 Byte** statt eines
// Weltrasters, und die weiche Aufblende (D-045) ist eine Zahl je Region statt
// eines Neuaufbaus der halben Insel.

import { DataTexture, NearestFilter, RedFormat, UnsignedByteType, type Material, type Shader } from 'three';
import { WORLD_TILES, regionIdAt } from '../../game/config/startRegion.config.ts';
import { LOCKED_DARKENING, LOCKED_DESATURATION } from '../worldProjection.ts';

/**
 * Größe der Nachschlagetabelle. Muss jede vorkommende Regions-Id fassen; die
 * Insel hat aktuell 13, historische Bakes hatten 40. 64 ist der nächste
 * bequeme Wert und kostet 64 Byte.
 */
const LOCK_LUT_SIZE = 64;

/** Dauer der weichen Aufblende beim Freischalten (Sekunden). */
export const LOCK_FADE_SECONDS = 1.4;

let regionIdTexture: DataTexture | undefined;
const lockAmountData = new Uint8Array(LOCK_LUT_SIZE);
const lockAmountTexture = new DataTexture(lockAmountData, LOCK_LUT_SIZE, 1, RedFormat, UnsignedByteType);
lockAmountTexture.minFilter = NearestFilter;
lockAmountTexture.magFilter = NearestFilter;
lockAmountTexture.generateMipmaps = false;
lockAmountTexture.needsUpdate = true;

/** Ziel- und Istwert je Region — die Differenz ist die laufende Aufblende. */
const lockTarget = new Float32Array(LOCK_LUT_SIZE);
const lockCurrent = new Float32Array(LOCK_LUT_SIZE);

/**
 * Geteilte Uniform-Objekte. Jedes gepatchte Material referenziert **dasselbe**
 * Objekt; ein Update erreicht damit alle Shader gleichzeitig, ohne dass dieses
 * Modul eine Liste der Materialien führen müsste.
 */
const regionIdUniform = { value: null as DataTexture | null };
const lockAmountUniform = { value: lockAmountTexture };

function ensureRegionIdTexture(): DataTexture {
  if (regionIdTexture) return regionIdTexture;
  const data = new Uint8Array(WORLD_TILES * WORLD_TILES);
  for (let y = 0; y < WORLD_TILES; y++) {
    for (let x = 0; x < WORLD_TILES; x++) {
      // Ids jenseits der Tabelle würden in die falsche Zelle greifen — lieber
      // als „nicht gesperrt" (0) lesen als eine fremde Region grau schalten.
      const id = regionIdAt(x, y);
      data[y * WORLD_TILES + x] = id >= 0 && id < LOCK_LUT_SIZE ? id : 0;
    }
  }
  const texture = new DataTexture(data, WORLD_TILES, WORLD_TILES, RedFormat, UnsignedByteType);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  regionIdTexture = texture;
  regionIdUniform.value = texture;
  return texture;
}

/**
 * Setzt, welche Regionen gesperrt sind. Idempotent und billig — beim Unlock
 * läuft der Wert weich auf 0 (siehe `advanceLockedRegionFade`).
 *
 * `instant` überspringt die Blende; das ist der Fall beim allerersten Frame und
 * beim Dev-Cheat, wo eine 1,4-Sekunden-Animation nur stören würde.
 */
export function setLockedRegions(lockedIds: Iterable<number>, instant = false): void {
  ensureRegionIdTexture();
  lockTarget.fill(0);
  for (const id of lockedIds) {
    if (id > 0 && id < LOCK_LUT_SIZE) lockTarget[id] = 1;
  }
  if (instant) {
    lockCurrent.set(lockTarget);
    writeLockTexture();
    return;
  }
  // Eine Region, die NEU gesperrt erscheint (Laden eines anderen Spielstands),
  // wird sofort grau — nur das Freischalten ist eine Feier und blendet weich.
  let changed = false;
  for (let id = 0; id < LOCK_LUT_SIZE; id++) {
    if (lockTarget[id]! > lockCurrent[id]!) {
      lockCurrent[id] = lockTarget[id]!;
      changed = true;
    }
  }
  if (changed) writeLockTexture();
}

/**
 * Führt die weiche Aufblende einen Frame weiter. Gibt `true` zurück, solange
 * sich noch etwas bewegt — der Aufrufer muss nichts weiter tun, die Textur ist
 * bereits aktualisiert.
 */
export function advanceLockedRegionFade(deltaSeconds: number): boolean {
  const step = LOCK_FADE_SECONDS > 0 ? Math.max(0, deltaSeconds) / LOCK_FADE_SECONDS : 1;
  let moving = false;
  for (let id = 0; id < LOCK_LUT_SIZE; id++) {
    const current = lockCurrent[id]!;
    const target = lockTarget[id]!;
    if (current === target) continue;
    const next = current > target ? Math.max(target, current - step) : Math.min(target, current + step);
    lockCurrent[id] = next;
    moving = true;
  }
  if (moving) writeLockTexture();
  return moving;
}

function writeLockTexture(): void {
  for (let id = 0; id < LOCK_LUT_SIZE; id++) {
    lockAmountData[id] = Math.round(Math.min(1, Math.max(0, lockCurrent[id]!)) * 255);
  }
  lockAmountTexture.needsUpdate = true;
}

/** Nur für Tests/Diagnose: aktueller Grauwert einer Region (0..1). */
export function lockedRegionAmount(id: number): number {
  return id > 0 && id < LOCK_LUT_SIZE ? lockCurrent[id]! : 0;
}

/**
 * GLSL-Nachschlag: liefert `cmbLockAmountAt(vec3 worldPos)` in 0..1.
 *
 * Zwei Stufen, weil die Regions-Id NEAREST gelesen werden muss (Ids darf man
 * nicht interpolieren — zwischen 3 und 5 läge sonst 4). Die Weichheit an der
 * Regionsgrenze entsteht deshalb erst NACH dem Nachschlagen, über mehrere
 * Proben (`taps`), nicht über Texturfilterung.
 */
function lockLookupGlsl(taps: number): string {
  const single = `
    float cmbLockSample(vec2 worldXZ) {
      vec2 uv = worldXZ / ${WORLD_TILES.toFixed(1)};
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
      float id = texture2D(uCmbRegionId, uv).r * 255.0;
      return texture2D(uCmbLockAmount, vec2((id + 0.5) / ${LOCK_LUT_SIZE.toFixed(1)}, 0.5)).r;
    }`;
  if (taps <= 1) {
    return `${single}
    float cmbLockAmountAt(vec3 worldPos) { return cmbLockSample(worldPos.xz); }`;
  }
  // Vier versetzte Proben über gut zwei Kacheln: die Grenze folgt danach der
  // organischen Regionskontur statt einer Kachelkante — dieselbe Eigenschaft,
  // die schon die alte Vertexfarben-Dimmung hatte.
  return `${single}
    float cmbLockAmountAt(vec3 worldPos) {
      float a = cmbLockSample(worldPos.xz + vec2(-1.3, -1.3));
      float b = cmbLockSample(worldPos.xz + vec2( 1.3, -1.3));
      float c = cmbLockSample(worldPos.xz + vec2(-1.3,  1.3));
      float d = cmbLockSample(worldPos.xz + vec2( 1.3,  1.3));
      return (a + b + c + d) * 0.25;
    }`;
}

/**
 * Die eigentliche Grauschaltung. Läuft **ganz am Ende** des Fragment-Shaders —
 * nach Splat-Texturen, nach Tonemapping, nach jeder Sättigungsanhebung. Genau
 * das war der Fehler der alten Fassung: Sie lief am Anfang und wurde danach
 * wieder überschrieben.
 *
 * Die Zahlen sind dieselben Konstanten, die `worldProjection.ts` für die
 * 2D-Karte benutzt (D-051) — eine Quelle, zwei Ansichten.
 */
const LOCK_GRADE_GLSL = `
  float cmbLock = cmbLockAmountAt(vCmbLockWorld);
  if (cmbLock > 0.001) {
    float cmbLum = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
    gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(cmbLum), ${LOCKED_DESATURATION.toFixed(3)} * cmbLock);
    gl_FragColor.rgb *= 1.0 - ${LOCKED_DARKENING.toFixed(3)} * cmbLock;
    gl_FragColor.b = min(1.0, gl_FragColor.b * (1.0 + 0.05 * cmbLock));
  }`;

/**
 * Hängt die ortsbasierte Grauschaltung an ein Material.
 *
 * Wichtig für den Aufrufer: Das Material darf **geteilt** sein. Weil die Maske
 * am Ort hängt, rendert dasselbe Material in freigeschaltetem Land bunt und in
 * gesperrtem grau — es braucht also KEINE zweite Materialvariante und keinen
 * zweiten Vegetationsaufbau (D-045 bleibt davon unberührt: die zwei Aufbauten
 * existieren wegen der Neuaufbau-Kosten, nicht wegen der Farbe).
 */
export function patchLockedRegionTint(
  material: Material & { onBeforeCompile?: (shader: Shader) => void; customProgramCacheKey?: () => string },
  options: { taps?: number; cacheKey: string } = { cacheKey: 'default' },
): void {
  // Modell-Materialien sind GETEILT (der Modellcache gibt dieselbe Instanz an
  // jede Platzierung). Ohne diese Sperre stapelte jeder weitere Aufruf eine
  // zweite `onBeforeCompile`-Kette übereinander und der Shader bekäme die
  // Varying-Deklaration doppelt — ein Compilerfehler, der erst im Spiel auffällt.
  if (material.userData['cmbLockPatched'] === true) return;
  material.userData['cmbLockPatched'] = true;
  ensureRegionIdTexture();
  const taps = options.taps ?? 1;
  const previous = material.onBeforeCompile?.bind(material);
  const previousKey = material.customProgramCacheKey?.bind(material);
  material.onBeforeCompile = (shader) => {
    previous?.(shader);
    shader.uniforms['uCmbRegionId'] = regionIdUniform;
    shader.uniforms['uCmbLockAmount'] = lockAmountUniform;
    shader.vertexShader = `varying vec3 vCmbLockWorld;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       {
         vec4 cmbLockPos = vec4(transformed, 1.0);
         #ifdef USE_INSTANCING
           cmbLockPos = instanceMatrix * cmbLockPos;
         #endif
         vCmbLockWorld = (modelMatrix * cmbLockPos).xyz;
       }`,
    );
    shader.fragmentShader =
      `varying vec3 vCmbLockWorld;\nuniform sampler2D uCmbRegionId;\nuniform sampler2D uCmbLockAmount;\n${lockLookupGlsl(taps)}\n` +
      shader.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>\n${LOCK_GRADE_GLSL}`);
  };
  material.customProgramCacheKey = () => `${previousKey?.() ?? ''}|cmb-lock-1-${options.cacheKey}-${taps}`;
  material.needsUpdate = true;
}
