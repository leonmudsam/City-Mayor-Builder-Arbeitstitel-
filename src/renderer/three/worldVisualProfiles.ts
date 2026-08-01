/**
 * Rein visuelle Regionsprofile für den aktiven 9-Regionen-Insel-Bake.
 *
 * Die gebackenen Terrain-IDs und die Gameplay-Biome bleiben unverändert. Diese
 * Tabelle beantwortet nur, wie eine bestehende Region im Three-Renderer gelesen
 * wird (Palette, Splat-Gewichte, Vegetationscharakter und neutrale Landmarke).
 * Die Zuordnung folgt `islandRegions.gen.ts` und `regions.config.ts`; sie
 * erfindet weder zusätzliche Regionen noch spielmechanische Biomwirkungen.
 */

export type WorldVisualBiome =
  | 'grasland'
  | 'wald'
  | 'fruchttal'
  | 'gebirge'
  | 'wueste'
  | 'sumpf'
  | 'trockene_ebene'
  | 'kueste'
  | 'seenland'
  | 'huegelland'
  | 'flusstal'
  | 'hochland';

export interface VisualSplatWeights {
  desert: number;
  swamp: number;
  dry: number;
  coast: number;
  alpine: number;
}

export interface RegionVisualProfile {
  regionId: number;
  biome: WorldVisualBiome;
  label: string;
  /** Sanfter Grundton für die vorhandene Terrainfarbe. */
  tint: number;
  splat: VisualSplatWeights;
  vegetation: 'offen' | 'waldkern' | 'agrar' | 'alpin' | 'trocken' | 'feucht' | 'ufer';
  landmark: string;
  /** Bewusst nur als Handoff; der Renderer wertet diesen Text nie aus. */
  gameplayHandoff?: string;
}

const NONE: VisualSplatWeights = { desert: 0, swamp: 0, dry: 0, coast: 0, alpine: 0 };

function profile(
  regionId: number,
  biome: WorldVisualBiome,
  label: string,
  tint: number,
  vegetation: RegionVisualProfile['vegetation'],
  landmark: string,
  splat: Partial<VisualSplatWeights> = {},
  gameplayHandoff?: string,
): RegionVisualProfile {
  return {
    regionId,
    biome,
    label,
    tint,
    vegetation,
    landmark,
    splat: { ...NONE, ...splat },
    ...(gameplayHandoff ? { gameplayHandoff } : {}),
  };
}

/**
 * Alle 9 gebackenen Regionen der modelltreuen Insel (§ Modelltreue 13.0/13.1, §7).
 * Die Reihenfolge folgt der kanonischen Bake-ID, nicht der Freischaltreihenfolge
 * aus `regions.config.ts`.
 *
 * §7 des Auftrags verlangt sichtbar unterschiedliche Landschaften statt „flacher
 * grüner Flächen": Wald bekommt dunkleren Boden und Waldkern-Vegetation, die
 * Gebirge werden alpin und hell, die Ackerregionen warm und agrarisch, die
 * Lagune erhält Küsten-/Strandcharakter. Die Zuordnung spiegelt die gemessene
 * Biomzusammensetzung des Bakes (Waldanteil, fruchtbarer Boden, Gebirgsanteil,
 * Strandkacheln) — sie erfindet keine Regionen und keine Gameplaywirkung.
 */
export const REGION_VISUAL_PROFILES: readonly RegionVisualProfile[] = [
  // 1 — (W) Lagunenland: 33,3 % Wasser auf der größten Region der Insel, dazu
  //     3.310 Waldkacheln. Ufer- und Seencharakter.
  profile(1, 'seenland', 'Stilles Lagunenland', 0xbcd4c2, 'ufer', 'Lagunenriff', {
    coast: 1,
    swamp: 0.18,
  }),
  // 2 — Westmark: 66,9 % Gras, sechs Nachbarn — das offene grüne Scharnier.
  profile(2, 'grasland', 'Weite Westmark', 0xc9d79b, 'offen', 'Wegkreuz-Eiche', {
    coast: 0.32,
    alpine: 0.1,
  }),
  // 3 — Ostterrassen: 909 fruchtbar, 1.370 Sand und ein Binnengewässer.
  profile(3, 'flusstal', 'Grüne Ostterrassen', 0xa8bd88, 'agrar', 'Obsthain', {
    coast: 0.5,
  }),
  // 4 — (F) Dünenküste: 1.945 Sand, 524 Küstenkanten, größte Baufläche.
  profile(4, 'kueste', 'Helle Dünenküste', 0xe8dcae, 'ufer', 'Dünengras-Kamm', {
    coast: 0.9,
  }),
  // 5 — (St) Das Massiv aus dem Modell: 83,4 % Gebirge, das Highlight der Insel.
  //
  // § Natur-Overhaul 14.0 (§4 „Gebirge lesbarer machen"): Der Grundton war mit
  // 0xe7e4d8 ein warmes Cremeweiß. Auf der großen flachen Gipfelterrasse las
  // sich das als SAND, nicht als Fels — die Steinregion sah aus wie eine Wüste.
  // Ein kühler, leicht blaustichiger Grauton trennt sie eindeutig vom
  // Dünensand der Küstenregionen, ohne die Textur selbst anzufassen.
  profile(5, 'gebirge', 'Monumentales Südmassiv', 0xc9cfd0, 'alpin', 'Kronengipfel', {
    coast: 0.06,
    alpine: 1,
  }),
  // 6 — (F) Nordküste: 935 fruchtbar, 1.265 Sand, 429 Küstenkanten.
  profile(6, 'fruchttal', 'Fruchtbare Nordküste', 0xded59b, 'agrar', 'Kornspeicher', {
    coast: 0.72,
  }),
  // 7 — (H) Das Holzrevier: 42,7 % Wald, dichtester Bestand der Insel.
  profile(7, 'wald', 'Dichter Nordwald', 0x7d9a6f, 'waldkern', 'Moosiger Urbaum', {
    coast: 0.2,
  }),
  // 8 — Südhügel: 18,1 % Gebirge — gestuftes Hügelland unter dem Massiv.
  profile(8, 'huegelland', 'Gestufte Südhügel', 0xc3cf94, 'offen', 'Terrassenhang', {
    coast: 0.3,
    alpine: 0.5,
  }),
  // 9 — Die Startregion: warmes, offenes Gründerland (65,5 % Gras).
  profile(9, 'grasland', 'Warmes offenes Gründerland', 0xefd987, 'offen', 'Rathauslichtung', {
    coast: 0.1,
  }),
] as const;

const PROFILE_BY_REGION = new Map(REGION_VISUAL_PROFILES.map((entry) => [entry.regionId, entry]));

export function regionVisualProfile(regionId: number): RegionVisualProfile | undefined {
  return PROFILE_BY_REGION.get(regionId);
}

/**
 * Mittelwert der sanften Regionsgrundtöne. Wiederholte IDs sind absichtlich
 * gewichtet: Der Terrain-Builder übergibt mehrere räumliche Samples, wodurch
 * ein Profil im Regionsinneren stärker wirkt und an Grenzen weich ausläuft.
 */
export function blendedVisualTint(regionIds: readonly number[]): number | undefined {
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;
  for (const regionId of regionIds) {
    const entry = regionVisualProfile(regionId);
    if (!entry) continue;
    red += (entry.tint >> 16) & 0xff;
    green += (entry.tint >> 8) & 0xff;
    blue += entry.tint & 0xff;
    count++;
  }
  if (count === 0) return undefined;
  return (
    (Math.round(red / count) << 16)
    | (Math.round(green / count) << 8)
    | Math.round(blue / count)
  );
}

/**
 * Mittelwert mehrerer Region-Samples. Der Terrain-Builder tastet Nachbarpunkte
 * ab, wodurch die visuellen Biome weich ueber die technischen Polygongrenzen
 * laufen, waehrend die Gameplayregion exakt unveraendert bleibt.
 */
export function blendedVisualSplat(regionIds: readonly number[]): VisualSplatWeights {
  const result: VisualSplatWeights = { ...NONE };
  let count = 0;
  for (const regionId of regionIds) {
    const entry = regionVisualProfile(regionId);
    if (!entry) continue;
    result.desert += entry.splat.desert;
    result.swamp += entry.splat.swamp;
    result.dry += entry.splat.dry;
    result.coast += entry.splat.coast;
    result.alpine += entry.splat.alpine;
    count++;
  }
  if (count > 0) {
    result.desert /= count;
    result.swamp /= count;
    result.dry /= count;
    result.coast /= count;
    result.alpine /= count;
  }
  return result;
}
