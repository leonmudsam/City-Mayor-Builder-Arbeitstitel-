// Stilisierte Low-Poly-Naturgeometrie (§ Natur-Overhaul 14.0).
//
// DER BEFUND, DER DIESES MODUL NÖTIG MACHT. Jedes vorhandene Natur-`.glb` hat
// rund **29.000 Dreiecke** — für einen einzelnen Baum. Deshalb war das
// Detailbudget auf zwölf echte Modelle je Region gedeckelt und die restlichen
// ~96 % der Welt bestanden aus einem Kegel auf einem Zylinder. Genau das kam im
// Spieltest als „zu leer, zu technisch, zu steril" an: nicht die Menge war das
// Problem, sondern die Ersatzform.
//
// Zusätzlich ist der Katalog kleiner, als die Dateinamen suggerieren:
// `pine_tree`, `forest_cluster_small` und `forest_cluster_medium` sind
// BYTEGLEICH, ebenso alle fünf Steinmodelle. Real gibt es fünf Formen, nicht
// zwölf. Vielfalt muss deshalb aus Transformation kommen — genau wie im Auftrag
// vorgesehen („dieselben Grundbaum-Modelle mehrfach verwenden, aber intelligent
// variiert").
//
// DIE LÖSUNG. Hier entstehen bewusst gestaltete Silhouetten mit 40–200
// Dreiecken, die auf Spieldistanz wie das Mockup lesen und dabei zwei
// Größenordnungen billiger sind. Jede Form wird EINMAL gebaut, trägt ihre Farben
// als Vertexfarben und wird danach über `InstancedMesh` beliebig oft gezeichnet;
// die Instanz variiert Größe, Rotation, Neigung und Farbton.
//
// Die echten `.glb`-Modelle verschwinden nicht — sie bleiben die seltenen
// Hero-Props (§5 Drop-in bleibt gültig): Riesenbäume, Findlinge, Felsgruppen.
//
// KONVENTION: Jede Form steht mit ihrer Unterkante auf y = 0 und ist auf etwa
// eine Kachel Grundfläche ausgelegt. Der Renderer skaliert von dort aus.

import {
  BoxGeometry,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
  TetrahedronGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Farbpalette, an das Mockup angelehnt: warme Wiesen, tiefe Nadelwälder,
 *  sandige Küsten und ein leicht warmer Grauton für Fels. */
export const NATURE_PALETTE = {
  coniferDark: 0x2f5d3a,
  coniferMid: 0x3d7245,
  coniferLight: 0x4d8a4c,
  broadleafDark: 0x4a7c38,
  broadleafMid: 0x5e9440,
  broadleafLight: 0x77a94b,
  bark: 0x6b4b32,
  barkLight: 0x8a6743,
  deadwood: 0x7d6248,
  bush: 0x4f8a45,
  bushLight: 0x66a052,
  grass: 0x6f9f42,
  grassDry: 0x9fae57,
  flowerWhite: 0xf2efe0,
  flowerYellow: 0xf0c94a,
  flowerRose: 0xd77f92,
  rock: 0x9a9083,
  rockLight: 0xb3aa9c,
  rockDark: 0x7c7469,
  reed: 0x6a8a3e,
  field: 0xb8a348,
  dry: 0x9a7b42,
} as const;

interface Part {
  geometry: BufferGeometry;
  color: number;
}

/**
 * Legt die Teilfarbe als Vertexfarbe ab — so trägt EINE Geometrie mehrere
 * Farben und braucht trotzdem nur ein Material und einen Draw-Call.
 *
 * Vorher wird die Geometrie ENTINDIZIERT. `mergeGeometries` verlangt, dass alle
 * Teile entweder indiziert sind oder keines — und die Basisformen von three
 * sind gemischt: Kegel, Zylinder und Box bringen einen Index mit, die
 * Polyeder (Ikosaeder, Dodekaeder, Tetraeder) nicht. Ohne diesen Schritt bricht
 * das Bündeln beim ersten gemischten Prop ab. Nebeneffekt ist erwünscht: harte
 * Facettenkanten statt weich verrundeter Normalen — genau der Low-Poly-Look.
 */
function tint({ geometry, color }: Part): BufferGeometry {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry;
  const count = flat.attributes.position!.count;
  const rgb = new Color(color);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    colors[i * 3] = rgb.r;
    colors[i * 3 + 1] = rgb.g;
    colors[i * 3 + 2] = rgb.b;
  }
  flat.setAttribute('color', new Float32BufferAttribute(colors, 3));
  // Die Formen sind ungetextur — vorhandene UVs würden nur Speicher kosten.
  flat.deleteAttribute('uv');
  flat.deleteAttribute('normal');
  return flat;
}

/** Bündelt die Teile zu EINER Geometrie. */
function build(parts: Part[]): BufferGeometry {
  const merged = mergeGeometries(parts.map(tint), false);
  if (!merged) throw new Error('Naturprop konnte nicht gebündelt werden.');
  merged.computeVertexNormals();
  merged.computeBoundingSphere();
  return merged;
}

/** Kleiner Helfer: Teil setzen (Verschiebung/Drehung direkt auf der Geometrie). */
function at(
  geometry: BufferGeometry,
  color: number,
  x: number,
  y: number,
  z: number,
  rotX = 0,
  rotZ = 0,
): Part {
  if (rotX) geometry.rotateX(rotX);
  if (rotZ) geometry.rotateZ(rotZ);
  geometry.translate(x, y, z);
  return { geometry, color };
}

/**
 * Nadelbaum: Stamm + drei gestapelte, nach oben schmaler werdende Kronen.
 * Die drei Stufen sind der ganze Trick — eine einzelne Kegelform liest sich als
 * Verkehrshütchen, drei gestufte als Fichte. ~78 Dreiecke.
 */
export function makeConiferGeometry(): BufferGeometry {
  return build([
    at(new CylinderGeometry(0.045, 0.075, 0.5, 5), NATURE_PALETTE.bark, 0, 0.25, 0),
    at(new ConeGeometry(0.34, 0.62, 7), NATURE_PALETTE.coniferDark, 0, 0.62, 0),
    at(new ConeGeometry(0.26, 0.54, 7), NATURE_PALETTE.coniferMid, 0, 0.95, 0),
    at(new ConeGeometry(0.16, 0.46, 7), NATURE_PALETTE.coniferLight, 0, 1.28, 0),
  ]);
}

/**
 * Jungbaum/Randbaum: dieselbe Sprache, zwei Stufen, deutlich kleiner. ~48 Dreiecke.
 */
export function makeSaplingGeometry(): BufferGeometry {
  return build([
    at(new CylinderGeometry(0.03, 0.045, 0.26, 4), NATURE_PALETTE.bark, 0, 0.13, 0),
    at(new ConeGeometry(0.19, 0.38, 6), NATURE_PALETTE.coniferMid, 0, 0.36, 0),
    at(new ConeGeometry(0.12, 0.3, 6), NATURE_PALETTE.coniferLight, 0, 0.6, 0),
  ]);
}

/**
 * Laubbaum: Stamm + drei versetzte Kronenballen. Der Versatz erzeugt eine
 * unregelmäßige Silhouette, die sich klar vom Nadelbaum unterscheidet — genau
 * die Ablesbarkeit, die §2 des Auftrags für Mischwälder verlangt. ~92 Dreiecke.
 */
export function makeBroadleafGeometry(): BufferGeometry {
  return build([
    at(new CylinderGeometry(0.05, 0.08, 0.46, 5), NATURE_PALETTE.bark, 0, 0.23, 0),
    at(new IcosahedronGeometry(0.32, 0), NATURE_PALETTE.broadleafMid, 0, 0.74, 0),
    at(new IcosahedronGeometry(0.24, 0), NATURE_PALETTE.broadleafLight, 0.19, 0.62, 0.11),
    at(new IcosahedronGeometry(0.21, 0), NATURE_PALETTE.broadleafDark, -0.17, 0.66, -0.14),
  ]);
}

/** Busch: zwei bis drei flache Ballen ohne Stamm. ~60 Dreiecke. */
export function makeBushGeometry(): BufferGeometry {
  const a = new IcosahedronGeometry(0.22, 0);
  a.scale(1, 0.72, 1);
  const b = new IcosahedronGeometry(0.16, 0);
  b.scale(1, 0.7, 1);
  const c = new IcosahedronGeometry(0.13, 0);
  c.scale(1, 0.68, 1);
  return build([
    at(a, NATURE_PALETTE.bush, 0, 0.15, 0),
    at(b, NATURE_PALETTE.bushLight, 0.16, 0.11, 0.08),
    at(c, NATURE_PALETTE.bush, -0.13, 0.1, -0.11),
  ]);
}

/** Trockenbusch für karge Zonen: dieselbe Form, sparriger und braun. */
export function makeDryShrubGeometry(): BufferGeometry {
  const a = new IcosahedronGeometry(0.18, 0);
  a.scale(1, 0.6, 1);
  const b = new IcosahedronGeometry(0.12, 0);
  b.scale(1, 0.58, 1);
  return build([
    at(a, NATURE_PALETTE.dry, 0, 0.11, 0),
    at(b, NATURE_PALETTE.grassDry, 0.13, 0.08, -0.07),
  ]);
}

/**
 * Fels: ein gestauchtes Dodekaeder mit aufgesetztem kleineren Block. Die
 * Instanz variiert später Drehung und ungleichmäßige Skalierung, sodass aus
 * einer Form sichtbar verschiedene Steine werden. ~50 Dreiecke.
 */
export function makeRockGeometry(): BufferGeometry {
  const main = new DodecahedronGeometry(0.3, 0);
  main.scale(1.15, 0.72, 0.95);
  const chip = new DodecahedronGeometry(0.15, 0);
  chip.scale(1, 0.8, 1);
  return build([
    at(main, NATURE_PALETTE.rock, 0, 0.19, 0),
    at(chip, NATURE_PALETTE.rockLight, 0.21, 0.11, 0.14),
  ]);
}

/** Flacher Küstenstein: breiter und niedriger, damit er am Ufer liegt statt steht. */
export function makeShoreRockGeometry(): BufferGeometry {
  const main = new DodecahedronGeometry(0.28, 0);
  main.scale(1.35, 0.46, 1.2);
  const chip = new DodecahedronGeometry(0.14, 0);
  chip.scale(1.2, 0.5, 1.1);
  return build([
    at(main, NATURE_PALETTE.rockDark, 0, 0.1, 0),
    at(chip, NATURE_PALETTE.rock, -0.24, 0.06, 0.16),
  ]);
}

/** Geröllfeld: vier kleine Bruchstücke als eine Gruppe. ~40 Dreiecke. */
export function makeScreeGeometry(): BufferGeometry {
  const shard = (size: number): BufferGeometry => {
    const g = new TetrahedronGeometry(size, 0);
    g.scale(1.2, 0.7, 1.1);
    return g;
  };
  return build([
    at(shard(0.13), NATURE_PALETTE.rock, 0, 0.05, 0, 0.3, 0.2),
    at(shard(0.1), NATURE_PALETTE.rockLight, 0.22, 0.04, 0.14, 0.7, 0.4),
    at(shard(0.09), NATURE_PALETTE.rockDark, -0.19, 0.035, 0.18, 1.1, 0.9),
    at(shard(0.08), NATURE_PALETTE.rock, 0.06, 0.03, -0.24, 0.5, 1.4),
  ]);
}

/**
 * Markante Felsgruppe/Felsnadel für Klippen und Gebirgskanten: zwei geneigte
 * Schollen und ein aufragender Zacken. Bewusst kantig — das ist die Form, die
 * dem Gebirge im Mockup seine Lesbarkeit gibt. ~64 Dreiecke.
 */
export function makeCliffRockGeometry(): BufferGeometry {
  const slab = new BoxGeometry(0.42, 0.5, 0.34);
  const slab2 = new BoxGeometry(0.3, 0.34, 0.26);
  const spire = new ConeGeometry(0.2, 0.86, 5);
  return build([
    at(slab, NATURE_PALETTE.rockDark, -0.1, 0.25, 0.04, 0, 0.16),
    at(slab2, NATURE_PALETTE.rock, 0.24, 0.17, -0.14, 0, -0.2),
    at(spire, NATURE_PALETTE.rockLight, 0.02, 0.5, 0, 0, 0.06),
  ]);
}

/** Grasbüschel: drei schmale, leicht gefächerte Halme. ~30 Dreiecke. */
export function makeGrassTuftGeometry(): BufferGeometry {
  const blade = (h: number): BufferGeometry => new ConeGeometry(0.045, h, 3);
  return build([
    at(blade(0.34), NATURE_PALETTE.grass, 0, 0.17, 0, 0, 0.1),
    at(blade(0.26), NATURE_PALETTE.grassDry, 0.07, 0.13, 0.05, 0, -0.22),
    at(blade(0.29), NATURE_PALETTE.grass, -0.06, 0.145, -0.05, 0.18, 0.18),
  ]);
}

/** Blumenfleck: ein Grasnest mit drei farbigen Köpfchen. ~44 Dreiecke. */
export function makeFlowerPatchGeometry(): BufferGeometry {
  const head = (): BufferGeometry => new IcosahedronGeometry(0.05, 0);
  return build([
    at(new ConeGeometry(0.05, 0.16, 3), NATURE_PALETTE.grass, 0, 0.08, 0),
    at(head(), NATURE_PALETTE.flowerYellow, 0, 0.19, 0),
    at(head(), NATURE_PALETTE.flowerWhite, 0.13, 0.14, 0.09),
    at(head(), NATURE_PALETTE.flowerRose, -0.11, 0.13, -0.1),
  ]);
}

/** Schilf: vier schlanke, unterschiedlich hohe Halme. ~32 Dreiecke. */
export function makeReedGeometry(): BufferGeometry {
  const stalk = (h: number): BufferGeometry => new ConeGeometry(0.028, h, 3);
  return build([
    at(stalk(0.62), NATURE_PALETTE.reed, 0, 0.31, 0, 0, 0.07),
    at(stalk(0.5), NATURE_PALETTE.reed, 0.09, 0.25, 0.06, 0, -0.12),
    at(stalk(0.56), NATURE_PALETTE.grassDry, -0.08, 0.28, 0.05, 0.1, 0.14),
    at(stalk(0.44), NATURE_PALETTE.reed, 0.02, 0.22, -0.1, -0.09, -0.06),
  ]);
}

/** Totholz: liegender Stamm mit abgebrochenem Ast. ~40 Dreiecke. */
export function makeDeadwoodGeometry(): BufferGeometry {
  const trunk = new CylinderGeometry(0.075, 0.09, 0.8, 6);
  trunk.rotateZ(Math.PI / 2);
  const branch = new CylinderGeometry(0.035, 0.045, 0.3, 4);
  branch.rotateZ(Math.PI / 2.6);
  return build([
    at(trunk, NATURE_PALETTE.deadwood, 0, 0.09, 0),
    at(branch, NATURE_PALETTE.bark, 0.22, 0.16, 0.1),
  ]);
}

/** Baumstumpf: kurzer breiter Rest mit hellerer Schnittfläche. ~36 Dreiecke. */
export function makeStumpGeometry(): BufferGeometry {
  return build([
    at(new CylinderGeometry(0.13, 0.16, 0.22, 7), NATURE_PALETTE.bark, 0, 0.11, 0),
    at(new CylinderGeometry(0.115, 0.115, 0.03, 7), NATURE_PALETTE.barkLight, 0, 0.23, 0),
  ]);
}

/** Ackerspur: zwei niedrige Erdwälle. ~24 Dreiecke. */
export function makeFieldRowGeometry(): BufferGeometry {
  return build([
    at(new BoxGeometry(0.78, 0.045, 0.12), NATURE_PALETTE.field, 0, 0.022, -0.14),
    at(new BoxGeometry(0.78, 0.04, 0.1), NATURE_PALETTE.dry, 0, 0.02, 0.14),
  ]);
}
