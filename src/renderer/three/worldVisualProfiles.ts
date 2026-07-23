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
 * Alle 40 gebackenen Regionen der neuen Insel, in derselben Id-Reihenfolge wie
 * `regions.config.ts`. Wuesten-/Sumpfprofile sind bewusst visuell; ihre
 * zukuenftigen Auswirkungen bleiben als TODO(CLAUDE_LOGIC) dokumentiert.
 */
export const REGION_VISUAL_PROFILES: readonly RegionVisualProfile[] = [
  profile(1, 'wald', 'Westforst am Gruenderland', 0x96b887, 'waldkern', 'Alte Waldlichtung', { coast: 0.12 }),
  profile(2, 'grasland', 'Weite Suedostweiden', 0xd9e6ac, 'offen', 'Windweide', { coast: 0.28 }),
  profile(3, 'grasland', 'Offene Westweiden', 0xd4e3a1, 'offen', 'Weite Lichtung', { coast: 0.24 }),
  profile(4, 'hochland', 'Abgelegene Ostplateauinsel', 0xcbd4aa, 'offen', 'Plateaukante', { coast: 0.7, alpine: 0.16 }),
  profile(5, 'flusstal', 'Oestliche Strom-Aue', 0xdfd39b, 'agrar', 'Flussdelta', { coast: 0.28 }),
  profile(6, 'hochland', 'Norduferhoehe', 0xc7d2a0, 'alpin', 'Hochplateau', { dry: 0.16, alpine: 0.3 }),
  profile(7, 'gebirge', 'Monumentales Kronengebirge', 0xf0f1ed, 'alpin', 'Kronengipfel', { alpine: 1 }),
  profile(8, 'wald', 'Ankunftsforst zwischen Kueste und Herzland', 0x9dbb88, 'waldkern', 'Historischer Versorgungsweg', { coast: 0.32 }),
  profile(9, 'grasland', 'Suedstromland', 0xd7e5a3, 'agrar', 'Heckenfeld', { coast: 0.16 }),
  profile(10, 'kueste', 'Suedwestkap', 0xd8d0a7, 'ufer', 'Breite Sandbucht', { coast: 0.82 }),
  profile(11, 'wald', 'Spiegelwald im Suedwesten', 0x98b889, 'waldkern', 'Alter Solitaerbaum'),
  profile(12, 'grasland', 'Suedostebene', 0xd5e2a4, 'offen', 'Blumenhang', { coast: 0.18 }),
  profile(13, 'gebirge', 'Westlicher Klippenkamm', 0xdfe2db, 'alpin', 'Gratspitze', { coast: 0.2, alpine: 0.88 }),
  profile(14, 'wald', 'Alter Silberforst', 0x97b889, 'waldkern', 'Farnlichtung'),
  profile(15, 'kueste', 'Mittlere Durchgangskueste', 0xdccf9e, 'ufer', 'Flache Brueckenbucht', { coast: 0.74 }),
  profile(
    16,
    'wueste',
    'Trockenes Sonnenkliff',
    0xdf9250,
    'trocken',
    'Rote Felsnadel',
    { desert: 1, dry: 0.5, coast: 0.2 },
    'TODO(CLAUDE_LOGIC): Wasserknappheit, Solarbonus und Nahrungsmalus datengetrieben pruefen.',
  ),
  profile(17, 'hochland', 'Windige Nordostinseln', 0xc9d3a8, 'offen', 'Inselkamm', { coast: 0.68, dry: 0.12 }),
  profile(18, 'huegelland', 'Nordostweiden', 0xd4e4a6, 'offen', 'Grosse Lichtung', { coast: 0.28, alpine: 0.16 }),
  profile(19, 'flusstal', 'Muehlental', 0xc1d89d, 'agrar', 'Wasserfallstufe', { coast: 0.16 }),
  profile(20, 'wald', 'Morgenwald', 0x9ebc8b, 'waldkern', 'Farnlichtung'),
  profile(21, 'wald', 'Ostwald an der Aussenkueste', 0x9eb58a, 'waldkern', 'Waldpforte', { coast: 0.26 }),
  profile(22, 'kueste', 'Raue Nordinsel', 0xcbd8ae, 'ufer', 'Versteckte Felsbucht', { coast: 0.78 }),
  profile(23, 'flusstal', 'Suedfluss-Aue', 0xd8d09b, 'agrar', 'Flussbogen', { coast: 0.28 }),
  profile(24, 'grasland', 'Zentrales Herzland und Gruendungspunkt', 0xdbe8a7, 'offen', 'Rathauslichtung', { coast: 0.08 }),
  profile(25, 'kueste', 'Fernes Ostkap', 0xcbd6bb, 'ufer', 'Leuchtturmkap', { coast: 0.9 }),
  profile(26, 'wald', 'Suedforst', 0x99b78a, 'waldkern', 'Spiegelteich'),
  profile(27, 'kueste', 'Westkap', 0xd8d3a8, 'ufer', 'Breite Kuestenwiese', { coast: 0.82 }),
  profile(28, 'gebirge', 'Kronenpass im Norden', 0xdfe2dc, 'alpin', 'Passhoehe', { alpine: 0.82 }),
  profile(29, 'wald', 'Felsenforst', 0x9db18c, 'waldkern', 'Moosiger Wachtfelsen', { alpine: 0.22 }),
  profile(30, 'wald', 'Feuchter Bruchwald', 0x8fa77e, 'feucht', 'Moorlichtung', { swamp: 0.28, coast: 0.2 }),
  profile(31, 'gebirge', 'Steinruecken', 0xdfe2dc, 'alpin', 'Wachtfelsen', { alpine: 0.9 }),
  profile(32, 'wald', 'Nordforst', 0x96b585, 'waldkern', 'Moosiger Urbaum', { coast: 0.34 }),
  profile(33, 'kueste', 'Windinsel', 0xcbd8ae, 'ufer', 'Felsbogen', { coast: 0.88 }),
  profile(34, 'huegelland', 'Gipfelwiesen', 0xc7d2a3, 'offen', 'Aussichtshang', { coast: 0.38, alpine: 0.3 }),
  profile(35, 'hochland', 'Passwiesen', 0xc7d2a3, 'offen', 'Serpentinenhang', { alpine: 0.34 }),
  profile(36, 'kueste', 'Kleines Suedkap', 0xd7d0a4, 'ufer', 'Kleiner Anleger', { coast: 0.86 }),
  profile(37, 'fruchttal', 'Flussgarten', 0xe0d49a, 'agrar', 'Obsthain', { coast: 0.18 }),
  profile(38, 'seenland', 'Seenwinkel', 0xb6d5bf, 'ufer', 'Insel im See', { coast: 0.42 }),
  profile(39, 'gebirge', 'Graue Zinnen', 0xe7e9e5, 'alpin', 'Zwillingsgipfel', { alpine: 1 }),
  profile(
    40,
    'sumpf',
    'Schilfdelta',
    0x788a67,
    'feucht',
    'Schilfmoor',
    { swamp: 1, coast: 0.34 },
    'TODO(CLAUDE_LOGIC): Feuchtgebietsboni, Bautempo und Gesundheitsrisiken nur ueber Config einfuehren.',
  ),
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
