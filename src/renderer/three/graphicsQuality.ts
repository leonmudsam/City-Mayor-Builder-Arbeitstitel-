// Grafik-Qualitätsstufen & Vegetations-Render-Profile
// (§ Final World Compaction 8.1 — Säule B: Vegetations-Performance).
//
// KERNREGEL des Auftrags: Die logische und visuelle Vegetationsdichte bleibt
// hoch — nur ihre TECHNISCHE Repräsentation wird mit zunehmender Entfernung
// vereinfacht (LOD, Impostor, Culling). Dieses Modul definiert dafür vier
// nachvollziehbare Qualitätsstufen mit KONKRETEN Zahlen (Dichte, Sichtweiten,
// LOD-Grenzen, Schattenbudget, Tierbudget), damit weder Renderer noch UI mit
// gefühlten Werten hantieren.
//
// Bewusst OHNE three/react-Import: rein und damit testbar. Der Renderer liest die
// Profile, die Settings-UI wählt die Stufe (persistiert außerhalb des Saves).

/** Die vier Stufen. Ids englisch (stabil), Anzeigenamen kommen aus i18n. */
export type GraphicsQualityLevel = 'low' | 'medium' | 'high' | 'ultra';

export const GRAPHICS_QUALITY_LEVELS: readonly GraphicsQualityLevel[] = [
  'low',
  'medium',
  'high',
  'ultra',
] as const;

/** Vier LOD-Stufen je Proptyp (§ Auftrag ≥ 4 LOD-Stufen). */
export type VegetationLodTier =
  | 0 // volle Geometrie (nah)
  | 1 // reduzierte Geometrie
  | 2 // Impostor/Billboard (fern)
  | 3; // gecullt (unsichtbar)

export interface GraphicsProfile {
  level: GraphicsQualityLevel;
  /**
   * Multiplikator auf die Pro-Region-Prop-Budgets. Bewusst nie unter 0,5: Auch
   * „Niedrig" bleibt sichtbar dicht bewachsen — es fallen ferne Instanzen weg,
   * nicht der Wald selbst.
   */
  densityMultiplier: number;
  /** Kamera-Distanz (Welteinheiten), ab der ferne Vegetation ganz entfällt. */
  vegetationViewDistance: number;
  /** Distanz, bis zu der Nah-Detail (Grashalme, Kleinkram) gezeigt wird. */
  nearDetailDistance: number;
  /** LOD-Umschaltdistanzen: [LOD0→1, LOD1→2 (Impostor), LOD2→3 (cull)]. */
  lodDistances: readonly [number, number, number];
  /** Werfen Vegetationsinstanzen überhaupt Schatten? */
  vegetationShadows: boolean;
  /** Obergrenze schattenwerfender Vegetationsinstanzen (nur die nächsten). */
  shadowInstanceBudget: number;
  /** Kleine Props (Blumen, Grashalme, Schilf) ab dieser Distanz früh ausblenden. */
  smallPropCullDistance: number;
  /** Obergrenze gleichzeitig animierter Tiere. */
  animalBudget: number;
  /** Deckel für `devicePixelRatio`. */
  pixelRatioCap: number;
  /** Weit entfernte Cluster als Impostor-Billboards zusammenfassen? */
  impostorsEnabled: boolean;
}

/**
 * Die vier Profile. Die Zahlen sind bewusst monoton über die Stufen und decken
 * die Auftrags-Zielwerte ab (Stadt 60 FPS, Region 50–60, volle Insel 40–60):
 * „Niedrig" hält selbst schwache Hardware flüssig, „Ultra" nutzt Reserven ohne
 * die Kernszene zu verändern.
 */
export const GRAPHICS_PROFILES: Record<GraphicsQualityLevel, GraphicsProfile> = {
  low: {
    level: 'low',
    densityMultiplier: 0.5,
    vegetationViewDistance: 95,
    nearDetailDistance: 60,
    lodDistances: [40, 75, 95],
    vegetationShadows: false,
    shadowInstanceBudget: 0,
    smallPropCullDistance: 45,
    animalBudget: 4,
    pixelRatioCap: 1,
    impostorsEnabled: true,
  },
  medium: {
    level: 'medium',
    densityMultiplier: 0.75,
    vegetationViewDistance: 135,
    nearDetailDistance: 90,
    lodDistances: [55, 105, 135],
    vegetationShadows: true,
    shadowInstanceBudget: 260,
    smallPropCullDistance: 70,
    animalBudget: 8,
    pixelRatioCap: 1.25,
    impostorsEnabled: true,
  },
  high: {
    level: 'high',
    densityMultiplier: 1,
    vegetationViewDistance: 185,
    nearDetailDistance: 120,
    lodDistances: [75, 140, 185],
    vegetationShadows: true,
    shadowInstanceBudget: 620,
    smallPropCullDistance: 100,
    animalBudget: 14,
    pixelRatioCap: 1.5,
    impostorsEnabled: true,
  },
  ultra: {
    level: 'ultra',
    densityMultiplier: 1.3,
    vegetationViewDistance: 260,
    nearDetailDistance: 165,
    lodDistances: [100, 190, 260],
    vegetationShadows: true,
    shadowInstanceBudget: 1200,
    smallPropCullDistance: 150,
    animalBudget: 20,
    pixelRatioCap: 2,
    impostorsEnabled: false, // Ultra zeigt echte Geometrie bis zur Sichtgrenze.
  },
};

/** Default-Stufe für neue Spieler: „Hoch" (volle Kernszene, faire Sichtweiten). */
export const DEFAULT_GRAPHICS_QUALITY: GraphicsQualityLevel = 'high';

export function graphicsProfile(level: GraphicsQualityLevel): GraphicsProfile {
  return GRAPHICS_PROFILES[level];
}

/**
 * LOD-Stufe eines Props/Clusters aus seiner Kamera-Distanz und dem Profil.
 * Deterministisch, monoton: näher = detaillierter. Über der Sichtgrenze wird
 * gecullt (Tier 3). Impostor-lose Profile (Ultra) überspringen Tier 2.
 */
export function vegetationLodTier(distance: number, profile: GraphicsProfile): VegetationLodTier {
  const [near, mid, far] = profile.lodDistances;
  if (distance > far) return 3;
  if (distance <= near) return 0;
  if (distance <= mid) return 1;
  // Jenseits von `mid`: Impostor, sofern das Profil ihn nutzt — sonst reduzierte
  // Geometrie bis zur Sichtgrenze.
  return profile.impostorsEnabled ? 2 : 1;
}

/**
 * Skaliert ein Pro-Region-Budget mit der Dichte des Profils. Immer ganzzahlig,
 * nie negativ. Ein positives Basisbudget behält mindestens eine Instanz, damit
 * ein Proptyp durch Runden nicht komplett verschwindet.
 */
export function scaledBudget(base: number, profile: GraphicsProfile): number {
  if (base <= 0) return 0;
  return Math.max(1, Math.round(base * profile.densityMultiplier));
}

/** Nächsthöhere/-niedrigere Stufe (für einfache +/−-Bedienung). */
export function stepQuality(level: GraphicsQualityLevel, delta: 1 | -1): GraphicsQualityLevel {
  const idx = GRAPHICS_QUALITY_LEVELS.indexOf(level);
  const next = Math.min(GRAPHICS_QUALITY_LEVELS.length - 1, Math.max(0, idx + delta));
  return GRAPHICS_QUALITY_LEVELS[next]!;
}
