/**
 * Rein visuelle Regionsprofile fuer den Insel-Pass 5.0.
 *
 * Die gebackenen Terrain-IDs und die Gameplay-Biome bleiben unveraendert. Diese
 * Tabelle beantwortet nur, wie eine bestehende Region im Three-Renderer gelesen
 * wird (Palette, Splat-Gewichte, Vegetationscharakter und neutrale Landmarke).
 * Damit bekommen Wuesten- und Sumpfzone eine klare Identitaet, ohne Boni,
 * Platzierungsregeln oder Saves im Renderer vorzutäuschen.
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
  /** Multiplikativer Grundton fuer die vorhandene Terrainfarbe. */
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
 * Alle 32 gebackenen Regionen, in derselben Id-Reihenfolge wie
 * `regions.config.ts`. Wuesten-/Sumpfprofile sind bewusst visuell; ihre
 * zukuenftigen Auswirkungen bleiben als TODO(CLAUDE_LOGIC) dokumentiert.
 */
export const REGION_VISUAL_PROFILES: readonly RegionVisualProfile[] = [
  profile(1, 'gebirge', 'Alpiner Hochgebirgskern', 0xf0f2ee, 'alpin', 'Markanter Gipfel', { alpine: 1 }),
  profile(2, 'grasland', 'Bewaldetes Lichtungsland', 0xd8edcf, 'offen', 'Grosse Lichtung'),
  profile(3, 'seenland', 'Suedliches Seenbecken', 0xc7e2d0, 'ufer', 'Seeinsel', { coast: 0.32 }),
  profile(4, 'fruchttal', 'Fruchtbares Flussdelta', 0xe1d49a, 'agrar', 'Flussdelta'),
  profile(5, 'trockene_ebene', 'Sonnenwarme Ostebene', 0xd6bd77, 'trocken', 'Felsgruppe', { dry: 0.72 }),
  profile(6, 'kueste', 'Felsiges Ostkap', 0xc8d7c4, 'ufer', 'Leuchtturmkap', { coast: 0.78 }),
  profile(7, 'grasland', 'Nordfelder und Weiden', 0xd9e7a3, 'agrar', 'Heckenfeld'),
  profile(8, 'kueste', 'Heller Nordstrand', 0xe3d6a3, 'ufer', 'Sandbucht', { coast: 0.92 }),
  profile(
    9,
    'wueste',
    'Rote Suedostkueste',
    0xe08345,
    'trocken',
    'Rote Felsnadel',
    { desert: 1, dry: 0.42, coast: 0.18 },
    'TODO(CLAUDE_LOGIC): Wasserknappheit, Solarbonus und Nahrungsmalus datengetrieben pruefen.',
  ),
  profile(10, 'grasland', 'Offenes Mittelland', 0xd4e8ab, 'offen', 'Alter Solitaerbaum'),
  profile(11, 'wald', 'Dichter Suedostwald', 0xa8c59a, 'waldkern', 'Waldlichtung'),
  profile(12, 'grasland', 'Weiter Westanger', 0xd1e3a2, 'offen', 'Blumenhang'),
  profile(13, 'huegelland', 'Steinige Hochweiden', 0xc8d3a5, 'offen', 'Felsruecken', { dry: 0.2, alpine: 0.12 }),
  profile(14, 'kueste', 'Weiche Suedkueste', 0xd9d2a5, 'ufer', 'Flussmuendung', { coast: 0.82 }),
  profile(15, 'kueste', 'Westliche Klippenkueste', 0xc5ccc2, 'alpin', 'Felsbogen', { coast: 0.68, alpine: 0.34 }),
  profile(16, 'kueste', 'Nebelkap', 0xb9cbc4, 'ufer', 'Nebelklippe', { coast: 0.72 }),
  profile(17, 'wald', 'Spiegelwald', 0x9dbc91, 'waldkern', 'Spiegelteich'),
  profile(18, 'gebirge', 'Westgrat', 0xd9ddd7, 'alpin', 'Gratspitze', { alpine: 0.9 }),
  profile(19, 'flusstal', 'Muehlental', 0xc4d9a0, 'agrar', 'Wasserfallstufe', { coast: 0.16 }),
  profile(20, 'hochland', 'Westliches Hochland', 0xc2cda0, 'alpin', 'Hochplateau', { dry: 0.15, alpine: 0.34 }),
  profile(21, 'seenland', 'Spiegelsee-Landschaft', 0xbad9c6, 'ufer', 'Insel im See', { coast: 0.38 }),
  profile(22, 'wald', 'Feuchter Suedwestwald', 0x91ad80, 'waldkern', 'Moosiger Urbaum', { swamp: 0.16 }),
  profile(23, 'hochland', 'Nordkamm', 0xc9d4c4, 'alpin', 'Passhoehe', { alpine: 0.56 }),
  profile(24, 'gebirge', 'Graue Zinnen', 0xe0e2dc, 'alpin', 'Zwillingsgipfel', { alpine: 0.92 }),
  profile(25, 'gebirge', 'Sturmspitzen', 0xe7e9e5, 'alpin', 'Schneekamm', { alpine: 1 }),
  profile(26, 'wald', 'Ostwald', 0xa5c092, 'waldkern', 'Farnlichtung'),
  profile(27, 'hochland', 'Wachtberge', 0xcbd2bd, 'alpin', 'Wachtfelsen', { alpine: 0.58 }),
  profile(28, 'wald', 'Kliffwald', 0x9fb29a, 'waldkern', 'Baumklippe', { coast: 0.26 }),
  profile(
    29,
    'sumpf',
    'Moorige Westbucht',
    0x788563,
    'feucht',
    'Moorsee',
    { swamp: 1, coast: 0.24 },
    'TODO(CLAUDE_LOGIC): Feuchtgebietsboni, Bautempo und Gesundheitsrisiken nur ueber Config einfuehren.',
  ),
  profile(30, 'kueste', 'Schmugglerbucht', 0xb7c5b0, 'ufer', 'Versteckte Felsbucht', { coast: 0.72 }),
  profile(31, 'gebirge', 'Trockener Suedgrat', 0xc5ad88, 'alpin', 'Trockene Felszinnen', { dry: 0.36, alpine: 0.64 }),
  profile(32, 'kueste', 'Vorgelagerte Nebelinsel', 0xaabeb5, 'ufer', 'Kleine Inselkette', { coast: 0.84 }),
] as const;

const PROFILE_BY_REGION = new Map(REGION_VISUAL_PROFILES.map((entry) => [entry.regionId, entry]));

export function regionVisualProfile(regionId: number): RegionVisualProfile | undefined {
  return PROFILE_BY_REGION.get(regionId);
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

