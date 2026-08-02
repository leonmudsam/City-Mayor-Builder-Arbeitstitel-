// Qualitätsabhängige Post-Processing-Profile für die 3D-Welt.
//
// Das Modul ist absichtlich frei von Three.js und DOM-Abhängigkeiten: Tests,
// Settings-UI und Renderer lesen dieselben Zahlen, ohne einen zweiten
// Qualitätsbegriff einzuführen. Die Effekte bleiben subtil und werden auf
// schwächeren Stufen gezielt ausgelassen, statt die Weltgeometrie auszudünnen.

import type { GraphicsQualityLevel } from './graphicsQuality.ts';

export interface PostProcessingProfile {
  enabled: boolean;
  ssao: boolean;
  bloom: boolean;
  depthOfField: boolean;
  smaa: boolean;
  /** Bildschirmraum-Radius der Kontaktverschattung. */
  aoRadius: number;
  /** Anzahl der SSAO-Kernelsamples; Medium bleibt bewusst guenstig. */
  aoKernelSize: number;
  /** Stärke des sehr dezenten Highlight-Blooms. */
  bloomStrength: number;
  /** Nur echte HDR-Lichter oberhalb dieses linearen Werts duerfen leuchten. */
  bloomThreshold: number;
  /** Ausbreitung des Highlight-Blooms ueber seine Mip-Stufen. */
  bloomRadius: number;
  /** Maximale Unschärfe außerhalb der Fokusebene. */
  maxBlur: number;
}

export type PostProcessingPassName =
  | 'render'
  | 'ssao'
  | 'bloom'
  | 'depthOfField'
  | 'smaa'
  | 'output';

export interface PostProcessingPassPlan {
  mode: 'direct' | 'composer';
  passes: readonly PostProcessingPassName[];
}

export const POST_PROCESSING_PROFILES: Record<GraphicsQualityLevel, PostProcessingProfile> = {
  low: {
    enabled: false,
    ssao: false,
    bloom: false,
    depthOfField: false,
    smaa: false,
    aoRadius: 0,
    aoKernelSize: 0,
    bloomStrength: 0,
    bloomThreshold: 0,
    bloomRadius: 0,
    maxBlur: 0,
  },
  medium: {
    enabled: true,
    ssao: true,
    bloom: false,
    depthOfField: false,
    smaa: true,
    aoRadius: 4,
    aoKernelSize: 8,
    bloomStrength: 0,
    bloomThreshold: 0,
    bloomRadius: 0,
    maxBlur: 0,
  },
  high: {
    enabled: true,
    ssao: true,
    bloom: true,
    depthOfField: false,
    smaa: true,
    aoRadius: 6,
    aoKernelSize: 16,
    bloomStrength: 0.08,
    bloomThreshold: 1.05,
    bloomRadius: 0.18,
    maxBlur: 0,
  },
  ultra: {
    enabled: true,
    ssao: true,
    bloom: true,
    depthOfField: true,
    smaa: true,
    aoRadius: 8,
    aoKernelSize: 24,
    bloomStrength: 0.1,
    bloomThreshold: 1.05,
    bloomRadius: 0.2,
    maxBlur: 0.0015,
  },
};

export function postProcessingProfile(level: GraphicsQualityLevel): PostProcessingProfile {
  return POST_PROCESSING_PROFILES[level];
}

/**
 * Liefert die sichtbare Passreihenfolge ohne Three-/DOM-Abhaengigkeiten.
 *
 * `OutputPass` bleibt absichtlich letzter Pass: Three rendert Composer-Ziele
 * linear und wendet dort kein Renderer-Tonemapping an. Erst Output uebernimmt
 * daher ACES und die Ausgabefarbraum-Konvertierung. Die offizielle
 * Three-r171-SMAA-Kette ordnet aus demselben Grund SMAA vor Output ein.
 */
export function postProcessingPassPlan(
  level: GraphicsQualityLevel,
  allowDepthOfField = true,
): PostProcessingPassPlan {
  const profile = postProcessingProfile(level);
  if (!profile.enabled) return { mode: 'direct', passes: ['render'] };

  const passes: PostProcessingPassName[] = ['render'];
  if (profile.ssao) passes.push('ssao');
  if (profile.bloom) passes.push('bloom');
  if (profile.depthOfField && allowDepthOfField) passes.push('depthOfField');
  if (profile.smaa) passes.push('smaa');
  passes.push('output');
  return { mode: 'composer', passes };
}
