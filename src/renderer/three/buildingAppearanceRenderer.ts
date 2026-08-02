// Materialharmonisierung fuer geklonte Gebaeude-GLBs.
//
// GLTF-Texturen bleiben unveraendert und werden zwischen allen Gebaeuden
// geteilt. Lediglich die Materialhuelle jedes Meshs wird geklont, damit
// gebaeudespezifische PBR-Werte und Shader-Hooks niemals den Modellcache oder
// andere Modellkategorien veraendern.

import {
  Material,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Mesh,
  type Object3D,
  type WebGLProgramParametersWithUniforms,
  type WebGLRenderer,
} from 'three';
import type { BuildingDef } from '../../game/config/types.ts';
import {
  buildingMaterialProfile,
  type BuildingMaterialProfile,
} from './buildingAppearance.ts';

export type LinearRgb = readonly [red: number, green: number, blue: number];

const LUMA: LinearRgb = [0.2126, 0.7152, 0.0722];
const TINT_STRENGTH = 0.16;
const GRADE_STRENGTH = 0.82;
const DARK_START = 0.025;
const DARK_END = 0.14;
const BRIGHT_START = 0.78;
const BRIGHT_END = 1;
const BRIGHT_PRESERVATION = 0.7;
const COOL_START = 0.025;
const COOL_END = 0.15;
const COOL_LUMA_START = 0.18;
const COOL_LUMA_END = 0.46;
const COOL_PRESERVATION = 0.78;
const MAP_FRAGMENT = '#include <map_fragment>';
const APPEARANCE_SHADER_VERSION = 'cmb-building-appearance-v1';

interface GradeParameters {
  rows: readonly [LinearRgb, LinearRgb, LinearRgb];
  tint: LinearRgb;
  lightness: number;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function mix(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function dot(rgb: LinearRgb, row: LinearRgb): number {
  return rgb[0] * row[0] + rgb[1] * row[1] + rgb[2] * row[2];
}

function srgbChannelToLinear(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function tintMultiplier(tint: number): LinearRgb {
  const channel = (shift: number) => srgbChannelToLinear(((tint >>> shift) & 0xff) / 255);
  return [
    mix(1, channel(16), TINT_STRENGTH),
    mix(1, channel(8), TINT_STRENGTH),
    mix(1, channel(0), TINT_STRENGTH),
  ];
}

function gradeParameters(profile: BuildingMaterialProfile): GradeParameters {
  const saturation = Math.max(0, profile.saturation);
  const desaturation = 1 - saturation;
  return {
    rows: [
      [
        LUMA[0] * desaturation + saturation,
        LUMA[1] * desaturation,
        LUMA[2] * desaturation,
      ],
      [
        LUMA[0] * desaturation,
        LUMA[1] * desaturation + saturation,
        LUMA[2] * desaturation,
      ],
      [
        LUMA[0] * desaturation,
        LUMA[1] * desaturation,
        LUMA[2] * desaturation + saturation,
      ],
    ],
    tint: tintMultiplier(profile.tint),
    lightness: Math.max(0, profile.lightness),
  };
}

/**
 * Spiegelt die lineare Shader-Farbkorrektur ohne Three-/WebGL-Zustand.
 *
 * Der Eingabewert ist lineares RGB direkt nach `map_fragment`. Sehr dunkle,
 * sehr helle und kuehl-blaue Pixel werden zunehmend geschont, damit in einer
 * monolithischen GLB-Textur eingebrannte Fenster und Lichtflaechen nicht matt
 * oder milchig werden.
 */
export function gradeBuildingAlbedo(
  source: LinearRgb,
  profile: BuildingMaterialProfile,
): [number, number, number] {
  const parameters = gradeParameters(profile);
  const graded: [number, number, number] = [
    dot(source, parameters.rows[0]) * parameters.tint[0] * parameters.lightness,
    dot(source, parameters.rows[1]) * parameters.tint[1] * parameters.lightness,
    dot(source, parameters.rows[2]) * parameters.tint[2] * parameters.lightness,
  ];

  const luminance = dot(source, LUMA);
  const darkPreservation = 1 - smoothstep(DARK_START, DARK_END, luminance);
  const brightPreservation =
    smoothstep(BRIGHT_START, BRIGHT_END, luminance) * BRIGHT_PRESERVATION;
  const coolExcess = Math.max(0, source[2] - Math.max(source[0], source[1]));
  const coolPreservation =
    smoothstep(COOL_START, COOL_END, coolExcess) *
    (1 - smoothstep(COOL_LUMA_START, COOL_LUMA_END, luminance)) *
    COOL_PRESERVATION;
  const preservation = clamp01(
    Math.max(darkPreservation, brightPreservation, coolPreservation),
  );
  const amount = GRADE_STRENGTH * (1 - preservation);

  return [
    clamp01(mix(source[0], graded[0], amount)),
    clamp01(mix(source[1], graded[1], amount)),
    clamp01(mix(source[2], graded[2], amount)),
  ];
}

function glslFloat(value: number): string {
  const normalized = Math.abs(value) < 0.0000005 ? 0 : value;
  return normalized.toFixed(6);
}

function gradeShaderBlock(profile: BuildingMaterialProfile): string {
  const parameters = gradeParameters(profile);
  const rows = parameters.rows.map(
    (row) => `vec3(${row.map(glslFloat).join(', ')})`,
  );
  return `
  // ${APPEARANCE_SHADER_VERSION}: dezentes lineares Albedo-Grading.
  vec3 cmbBuildingSourceAlbedo = diffuseColor.rgb;
  vec3 cmbBuildingGradedAlbedo = vec3(
    dot(cmbBuildingSourceAlbedo, ${rows[0]}),
    dot(cmbBuildingSourceAlbedo, ${rows[1]}),
    dot(cmbBuildingSourceAlbedo, ${rows[2]})
  );
  cmbBuildingGradedAlbedo *= vec3(${parameters.tint.map(glslFloat).join(', ')});
  cmbBuildingGradedAlbedo *= ${glslFloat(parameters.lightness)};
  float cmbBuildingLuma = dot(cmbBuildingSourceAlbedo, vec3(${LUMA.map(glslFloat).join(', ')}));
  float cmbBuildingDarkPreserve = 1.0 - smoothstep(${glslFloat(DARK_START)}, ${glslFloat(DARK_END)}, cmbBuildingLuma);
  float cmbBuildingBrightPreserve = smoothstep(${glslFloat(BRIGHT_START)}, ${glslFloat(BRIGHT_END)}, cmbBuildingLuma) * ${glslFloat(BRIGHT_PRESERVATION)};
  float cmbBuildingCoolExcess = max(0.0, cmbBuildingSourceAlbedo.b - max(cmbBuildingSourceAlbedo.r, cmbBuildingSourceAlbedo.g));
  float cmbBuildingCoolPreserve = smoothstep(${glslFloat(COOL_START)}, ${glslFloat(COOL_END)}, cmbBuildingCoolExcess)
    * (1.0 - smoothstep(${glslFloat(COOL_LUMA_START)}, ${glslFloat(COOL_LUMA_END)}, cmbBuildingLuma))
    * ${glslFloat(COOL_PRESERVATION)};
  float cmbBuildingPreserve = clamp(max(cmbBuildingDarkPreserve, max(cmbBuildingBrightPreserve, cmbBuildingCoolPreserve)), 0.0, 1.0);
  float cmbBuildingGradeAmount = ${glslFloat(GRADE_STRENGTH)} * (1.0 - cmbBuildingPreserve);
  diffuseColor.rgb = clamp(mix(cmbBuildingSourceAlbedo, cmbBuildingGradedAlbedo, cmbBuildingGradeAmount), 0.0, 1.0);`;
}

function profileProgramKey(profile: BuildingMaterialProfile): string {
  return [
    profile.tint.toString(16).padStart(6, '0'),
    profile.saturation.toFixed(4),
    profile.lightness.toFixed(4),
    profile.roughnessMin.toFixed(4),
    profile.metalnessMax.toFixed(4),
    profile.normalStrength.toFixed(4),
  ].join(':');
}

function stableStringHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function protectedSurface(material: MeshStandardMaterial): boolean {
  const role = material.name.toLowerCase();
  const semanticSurface = [
    'glass',
    'window',
    'fenster',
    'water',
    'light',
    'lamp',
    'emiss',
    'glow',
    'neon',
  ].some((token) => role.includes(token));
  const emissiveSurface =
    material.emissiveMap !== null ||
    (material.emissiveIntensity > 0.001 &&
      Math.max(material.emissive.r, material.emissive.g, material.emissive.b) > 0.001);
  const transmissiveSurface =
    material instanceof MeshPhysicalMaterial && material.transmission > 0.001;
  return (
    semanticSurface ||
    emissiveSurface ||
    transmissiveSurface ||
    material.transparent ||
    material.opacity < 0.999 ||
    material.alphaTest > 0
  );
}

function restoreSourceShaderHook(source: Material, target: Material): string {
  const sourceHook = source.onBeforeCompile;
  const sourceProgramKey = source.customProgramCacheKey();
  target.onBeforeCompile = sourceHook;
  target.customProgramCacheKey = () => sourceProgramKey;
  return sourceProgramKey;
}

function harmonizedMaterial(source: Material, profile: BuildingMaterialProfile): Material {
  const material = source.clone();
  const sourceHook = source.onBeforeCompile;
  const sourceProgramKey = restoreSourceShaderHook(source, material);
  if (!(material instanceof MeshStandardMaterial) || protectedSurface(material)) {
    return material;
  }

  material.roughness = Math.max(material.roughness, profile.roughnessMin);
  material.metalness = Math.min(material.metalness, profile.metalnessMax);
  if (material.normalMap !== null) {
    material.normalScale.multiplyScalar(profile.normalStrength);
    // Der bisherige globale GLB-Stil setzte flatShading auch auf detaillierte
    // Normalmaps. Das erzeugt unruhige Facetten und wird hier gezielt korrigiert.
    material.flatShading = false;
  }

  const shaderBlock = gradeShaderBlock(profile);
  material.onBeforeCompile = (
    shader: WebGLProgramParametersWithUniforms,
    renderer: WebGLRenderer,
  ) => {
    sourceHook.call(material, shader, renderer);
    if (!shader.fragmentShader.includes(MAP_FRAGMENT)) return;
    shader.fragmentShader = shader.fragmentShader.replace(
      MAP_FRAGMENT,
      `${MAP_FRAGMENT}${shaderBlock}`,
    );
  };
  material.customProgramCacheKey = () =>
    `${APPEARANCE_SHADER_VERSION}:${profileProgramKey(profile)}:${stableStringHash(sourceProgramKey)}`;
  material.needsUpdate = true;
  return material;
}

/**
 * Harmonisiert einen bereits geklonten Gebaeude-Object3D in-place.
 *
 * Fuer jedes Mesh entsteht eine eigene Materialhuelle. Geometrien sowie alle
 * Texture-Maps bleiben Referenzen auf den GLB-Cache und werden nicht kopiert.
 * Der Rueckgabewert ist dasselbe Object3D und erlaubt direkte Verkettung beim
 * Anhaengen des geklonten Modells.
 */
export function harmonizeBuildingAppearance<T extends Object3D>(
  building: T,
  def: Pick<BuildingDef, 'id' | 'category'>,
): T {
  const profile = buildingMaterialProfile(def);
  building.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map((material) => harmonizedMaterial(material, profile))
      : harmonizedMaterial(mesh.material, profile);
  });
  return building;
}
