// § D-058/D-059 — FELDER SIND SICHTBARE FLÄCHE, KEINE EINGEFÄRBTE KACHEL.
//
// Ein Feld ist in der Simulation eine `terrainOverrides`-Kachel (`fertile`).
// Ohne eigene Geometrie wäre es im Spiel nur ein Farbwechsel im Boden — der
// Spieler bezahlt 260 ⌾ je Kachel und sieht praktisch nichts. Hier entsteht
// daraus das, was der Auftrag verlangt: „Low-poly cartoon style … Felder sollen
// zur Welt passen und nicht wie flache Platzhalter wirken."
//
// D-044 gilt unverändert: Die Masse ist **stilisierte Low-Poly-Geometrie**, kein
// `.glb` (die Natur-Modelle wiegen je rund 29.000 Dreiecke). Ein Feld kostet
// hier zwei Instanzen je Kachel — Ackerscholle und Fruchtreihen — bei 12
// Dreiecken je Instanz. Vielfalt kommt aus Transformation und `setColorAt`,
// nicht aus zusätzlicher Geometrie.
//
// Der Reifegrad kommt aus DEMSELBEN Knoten, den der Arbeiter gleich aberntet
// (`GameController.getFarmFields`) — das Bild kann deshalb nicht behaupten, ein
// Feld stünde voll, während die Simulation es als abgeerntet führt.

import {
  BoxGeometry,
  type BufferGeometry,
  Color,
  Group,
  InstancedMesh,
  type Material,
  MeshLambertMaterial,
  Object3D,
} from 'three';
import type { FarmFieldView } from '../../game/operations/farmFields.ts';

/** Reihen je Feldkachel. Vier lesen sich als Acker, ohne die Instanzzahl zu treiben. */
const ROWS_PER_TILE = 4;

/** Farbe der gepflügten Scholle. */
const SOIL_COLOR = new Color(0x6b4a2f);
/** Frisch gesät (Reifegrad 0) und erntereif (1) — dazwischen wird gemischt. */
const SPROUT_COLOR = new Color(0x7fae4a);
const RIPE_COLOR = new Color(0xd8b143);

/**
 * Deterministische Streuung je Kachel: gleiche Kachel ⇒ gleiche Reihenrichtung
 * und gleicher Farbton, auch nach einem Neuaufbau. Ein `Math.random()` hier
 * würde die Felder bei jedem Bauklick neu würfeln.
 */
function tileHash(x: number, y: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

export interface FarmFieldMeshOptions {
  /** Bodenhöhe einer Kachelmitte — dieselbe Quelle wie überall im Renderer. */
  heightAt(x: number, y: number): number;
  /**
   * DROP-IN (CLAUDE.md §5): Geometrie und Material aus `field_crop_rows.glb`,
   * bereits auf eine Kachel normiert. Ist sie da, ersetzt sie die vier
   * prozeduralen Balken — **als eine einzige `InstancedMesh`**, also weiterhin
   * EIN Draw-Call für das ganze Ackerland (D-044: die Masse bleibt billig).
   * Fehlt sie, bleibt alles wie bisher; der Fallback ist kein Sonderfall.
   *
   * Der Reifegrad wirkt weiter über `setColorAt` — er multipliziert die
   * Modellfarbe bzw. -textur, ein reifes Feld wird also auch mit Drop-in gelb.
   */
  cropModel?: { geometry: BufferGeometry; material: Material } | undefined;
  /**
   * Wird auf beide Materialien angewendet, bevor sie zum ersten Mal compiliert
   * werden. § D-056 (REIHENFOLGE IST PFLICHT): Der Sperr-Patch muss NACH jeder
   * anderen `onBeforeCompile`-Zuweisung laufen, sonst verschwindet er still.
   */
  patchMaterial?(material: MeshLambertMaterial): void;
}

/**
 * Baut die sichtbaren Felder. Gibt `undefined` zurück, wenn es keine gibt —
 * eine leere Gruppe mit zwei leeren `InstancedMesh` wäre reine Verschwendung.
 */
export function buildFarmFieldMesh(
  fields: readonly FarmFieldView[],
  options: FarmFieldMeshOptions,
): Group | undefined {
  if (fields.length === 0) return undefined;

  const group = new Group();
  group.name = 'farmFields';

  // FELDER WAREN SCHWARZ — und der Grund ist eine Zeile, die richtig aussieht.
  //
  // `vertexColors: true` heißt in three.js: „lies das **Geometrie**-Attribut
  // `color`". `BoxGeometry` hat keines. Der Shader bekommt dann den
  // Standardwert eines ungebundenen Attributs — (0,0,0) — und multipliziert
  // alles damit: reines Schwarz, unabhängig von Licht, Textur und Instanzfarbe.
  //
  // Die Instanzfarbe aus `setColorAt` braucht das Flag NICHT: Sie kommt über
  // `USE_INSTANCING_COLOR` und wird von three ohnehin auf die Materialfarbe
  // multipliziert. Genau deshalb steht in `buildingEnvironmentRenderer`
  // ausdrücklich `vertexColors: false` bei weißer Grundfarbe — dieselbe
  // Kombination, die hier fehlte.
  //
  // Warum es die Vegetation nicht traf, obwohl sie `vertexColors: true` nutzt:
  // Sie färbt über ein echtes Geometrie-Attribut, nicht über `setColorAt`.
  // Zwei Wege, dieselbe Absicht — und nur einer verträgt das Flag.
  const soilMaterial = new MeshLambertMaterial({ color: 0xffffff, vertexColors: false });
  const cropMaterial = new MeshLambertMaterial({ color: 0xffffff, vertexColors: false });
  options.patchMaterial?.(soilMaterial);
  options.patchMaterial?.(cropMaterial);

  // Ein Drop-in ersetzt die vier Balken durch EIN Modell je Kachel — dieselbe
  // Instanzzahl-Ordnung, ein Draw-Call.
  const drop = options.cropModel;
  const rowsPerTile = drop ? 1 : ROWS_PER_TILE;
  const soil = new InstancedMesh(new BoxGeometry(0.98, 0.09, 0.98), soilMaterial, fields.length);
  const rows = new InstancedMesh(
    drop ? drop.geometry : new BoxGeometry(0.16, 0.2, 0.86),
    drop ? drop.material : cropMaterial,
    fields.length * rowsPerTile,
  );
  soil.receiveShadow = true;
  rows.castShadow = false; // Das knappe Schattenbudget gehört der Stadt (D-045).
  rows.receiveShadow = true;

  const dummy = new Object3D();
  const color = new Color();
  let rowIndex = 0;

  fields.forEach((field, index) => {
    const hash = tileHash(field.x, field.y);
    const ground = options.heightAt(field.x, field.y);

    dummy.position.set(field.x + 0.5, ground + 0.045, field.y + 0.5);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    soil.setMatrixAt(index, dummy.matrix);
    // Feuchte Scholle etwas dunkler, trockene heller — reine Transformation.
    soil.setColorAt(index, color.copy(SOIL_COLOR).multiplyScalar(0.86 + hash * 0.28));

    // Reihenrichtung wechselt blockweise, damit benachbarte Felder nicht wie
    // eine einzige gestreifte Fläche wirken.
    const quarterTurn = tileHash(Math.floor(field.x / 4), Math.floor(field.y / 4)) > 0.5;
    // Reifegrad steuert Höhe UND Farbe: ein abgeerntetes Feld ist sichtbar
    // Stoppelacker, kein grünes Versprechen.
    const height = 0.25 + field.growth * 0.9;
    color.copy(SPROUT_COLOR).lerp(RIPE_COLOR, field.growth);
    color.multiplyScalar(0.9 + hash * 0.2);

    if (drop) {
      // Ein Modell füllt die ganze Kachel. Der Reifegrad wirkt nur noch über
      // Farbe und eine leichte Höhenstreckung — ein Drop-in soll nicht
      // auseinandergezogen aussehen.
      dummy.position.set(field.x + 0.5, ground + 0.05, field.y + 0.5);
      dummy.rotation.set(0, quarterTurn ? Math.PI / 2 : 0, 0);
      dummy.scale.set(1, 0.75 + field.growth * 0.45, 1);
      dummy.updateMatrix();
      rows.setMatrixAt(rowIndex, dummy.matrix);
      rows.setColorAt(rowIndex, color);
      rowIndex += 1;
    } else {
      for (let row = 0; row < ROWS_PER_TILE; row++) {
        const offset = (row + 0.5) / ROWS_PER_TILE - 0.5;
        dummy.position.set(
          field.x + 0.5 + (quarterTurn ? 0 : offset),
          ground + 0.06 + height * 0.1,
          field.y + 0.5 + (quarterTurn ? offset : 0),
        );
        dummy.rotation.set(0, quarterTurn ? Math.PI / 2 : 0, 0);
        dummy.scale.set(1, height, 1);
        dummy.updateMatrix();
        rows.setMatrixAt(rowIndex, dummy.matrix);
        rows.setColorAt(rowIndex, color);
        rowIndex += 1;
      }
    }
  });

  soil.instanceMatrix.needsUpdate = true;
  rows.instanceMatrix.needsUpdate = true;
  if (soil.instanceColor) soil.instanceColor.needsUpdate = true;
  if (rows.instanceColor) rows.instanceColor.needsUpdate = true;

  group.add(soil, rows);
  return group;
}
