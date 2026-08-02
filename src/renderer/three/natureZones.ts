// Naturzonen und Spawn-Regeln der Insel (§ Natur-Overhaul 14.0).
//
// DAS PROBLEM, DAS DIESES MODUL LÖST. Die Vegetation entstand bisher aus einer
// gewachsenen if/else-Kaskade direkt im Renderer: „ist die Kachel Wald UND ist
// Hashwert A groß genug UND ist Clusterwert B groß genug → Kiefer". Jede neue
// Anforderung hängte eine weitere Bedingung an. Drei Folgen waren im Spieltest
// sichtbar:
//
//   1. Die Verteilung war nicht komponiert, sondern gestreut. Ein Wald hatte
//      innen dieselbe Dichte wie außen, weil der Terraintyp keine Kante kennt.
//   2. Ganze Landschaftstypen hatten überhaupt keine Regel — Küstenstreifen,
//      Klippenfüße, Geröllhänge und kleine Inseln fielen durch das Raster und
//      blieben leer.
//   3. Die Werte waren nicht auffindbar. Wer die Walddichte ändern wollte,
//      musste eine 600-Zeilen-Methode im Renderer lesen.
//
// DIE LÖSUNG. Jede Landkachel bekommt zuerst eine ZONE (Waldkern, Waldrand,
// Wiese, Felshochland, flache Küste, felsige Küste, Feuchtzone, kleine Insel).
// Danach entscheidet EINE Tabelle je Zone, welche Props dort mit welcher Dichte
// und welcher Größenstreuung wachsen. Der Renderer wertet die Tabelle nur noch
// aus — er trifft keine Verteilungsentscheidung mehr.
//
// Bewusst ohne `three`/`react`-Import: die Regeln sind rein und damit testbar.
// Die Zone ist eine reine ABLEITUNG aus gebackenen Daten (§ D-043) — dieses
// Modul verändert keine Geometrie und kein Gelände.

import type { TerrainType } from '../../game/types.ts';
import { propHash, type PropKind } from './vegetationBudget.ts';

/** Die acht Naturräume. Reihenfolge = Auswertungsreihenfolge in `classifyNatureZone`. */
export type NatureZone =
  | 'small_island'
  | 'rocky_highland'
  | 'coast_rocky'
  | 'coast_flat'
  | 'wetland'
  | 'forest_core'
  | 'forest_edge'
  | 'meadow';

export const NATURE_ZONES: readonly NatureZone[] = [
  'small_island',
  'rocky_highland',
  'coast_rocky',
  'coast_flat',
  'wetland',
  'forest_core',
  'forest_edge',
  'meadow',
] as const;

/**
 * Alle Prop-Arten der Welt. Die ersten vierzehn existierten bereits; `sapling`,
 * `stump`, `shoreRock`, `scree` und `cliffRock` kommen mit diesem Overhaul dazu
 * und schließen genau die Lücken, die als „zu leer, zu technisch" gemeldet
 * wurden: Jungbäume am Waldrand, Baumstümpfe, Küstensteine, Geröllfelder und
 * markante Felsgruppen an Klippen.
 *
 * Der Typ ist BEWUSST der Budget-Schlüssel aus `vegetationBudget.ts` und keine
 * zweite Aufzählung: Eine Art ohne Budget wäre unsichtbar, ein Budget ohne Art
 * toter Code. Der Compiler hält beides zusammen.
 */
export type NatureKind = PropKind;

export const NATURE_KINDS: readonly NatureKind[] = [
  'pine', 'broadleaf', 'meadowTree', 'largePine', 'giantTree', 'sapling',
  'bush', 'rock', 'boulder', 'cliffRock', 'scree', 'shoreRock',
  'reed', 'flower', 'fieldRow', 'deadwood', 'stump', 'dryShrub', 'microGrass',
] as const;

/**
 * ZENTRALE STELLSCHRAUBEN. Wer die Welt nachjustieren will, ändert diese Werte —
 * nicht den Renderer. Alle sind Multiplikatoren auf die Zonentabelle unten,
 * `1` heißt „wie kalibriert".
 */
export const NATURE_TUNING = {
  /** Globale Baumdichte (Nadel-, Laub-, Wiesen- und Jungbäume). */
  treeDensity: 1,
  /** Globale Dichte aller Stein-, Geröll- und Felsprops. */
  rockDensity: 1,
  /** Globale Dichte der Bodendeckung (Gras, Blumen, Ackerspuren). */
  groundCoverDensity: 1,
  /** Globale Dichte der Küsten- und Uferprops. */
  coastPropDensity: 1,
  /** Dichteaufschlag auf kleinen Inseln — sie sollen kompakt wirken, nicht kahl. */
  smallIslandDensity: 1.25,
  /** Kantenlänge einer Clusterzelle in Kacheln (kleiner = kleinteiligere Gruppen). */
  clusterSize: 9,
  /**
   * Wie weich der Waldrand ausläuft. 0 = harte Kante zwischen Kern und Rand,
   * 1 = sehr breiter Übergang. Wirkt auf die Waldanteils-Schwelle unten.
   */
  forestEdgeSoftness: 0.3,
  /** Grundwahrscheinlichkeit eines Riesenbaums auf einer geeigneten Waldkachel. */
  heroTreeProbability: 0.022,
} as const;

/** Zonenschwellen — ebenfalls bewusst zentral und benannt statt inline. */
export const NATURE_ZONE_THRESHOLDS = {
  /** Ab diesem Waldanteil im 5×5-Fenster gilt eine Waldkachel als Kern. */
  forestCoreDensity: 0.52,
  /** Ab diesem Waldanteil zählt auch eine Nicht-Waldkachel noch als Waldrand. */
  forestEdgeDensity: 0.16,
  /** Ab dieser Steigung (Welt-Einheiten je Kachel) gilt Gelände als Fels. */
  rockySlope: 1.5,
  /** Ab dieser Höhe gilt Gelände unabhängig von der Steigung als Hochland. */
  rockyHeight: 17,
  /** Breite des Küstenbands in Kacheln (Distanz zum Ozean). */
  coastBand: 4,
  /** Innerhalb dieser Distanz zu einer Steilküste gilt Küste als felsig. */
  cliffInfluence: 5,
  /**
   * Unterhalb dieser Höhe zählt Wassernähe als Feuchtzone.
   *
   * § 14.0 Nachkalibrierung: mit 3,2 traf die Zone genau **98 Kacheln** der
   * ganzen Insel — Schilf und Ufergrün hatten damit faktisch keinen Ort. Die
   * Binnengewässer der modelltreuen Insel liegen auf Terrassenniveau, nicht auf
   * Meereshöhe; 7,5 trifft sie.
   */
  wetlandHeight: 7.5,
} as const;

export interface NatureZoneInput {
  terrain: TerrainType;
  /** Welt-Y der Kachelmitte. */
  height: number;
  /** Steigung in Welt-Einheiten je Kachel. */
  slope: number;
  /** Waldanteil im 5×5-Fenster (0..1). */
  forestDensity: number;
  /** Kacheldistanz zum Ozean. */
  coastDistance: number;
  /** Kacheldistanz zur nächsten Steilküste. */
  cliffDistance: number;
  /** Ufertyp: 0 keine, 1 Meer, 2 Fluss, 3 See, 4 Steilküste. */
  shoreType: number;
  /** Kachelzahl der zusammenhängenden Landmasse. */
  landMassSize: number;
  /** Grenzt die Kachel an Fluss oder See? */
  freshwaterAdjacent: boolean;
  /** Gilt die Landmasse als kleine Insel? */
  smallIsland: boolean;
}

/**
 * Ordnet einer Landkachel ihren Naturraum zu. Die Reihenfolge ist bewusst
 * hierarchisch: Was die Landschaft am stärksten prägt, gewinnt. Eine Klippe am
 * Meer ist zuerst felsige Küste und erst danach „irgendwie auch Hügel".
 */
export function classifyNatureZone(input: NatureZoneInput): NatureZone {
  const t = NATURE_ZONE_THRESHOLDS;
  // Kleine Inseln sind ihr eigener Landschaftstyp — sonst erben sie das Profil
  // des nächstgelegenen Hauptlandzuschnitts und wirken wie abgeschnittene Küste.
  if (input.smallIsland) return 'small_island';
  if (input.terrain === 'mountain' || input.slope >= t.rockySlope || input.height >= t.rockyHeight) {
    return 'rocky_highland';
  }
  if (input.coastDistance <= t.coastBand) {
    return input.shoreType === 4 || input.cliffDistance <= t.cliffInfluence ? 'coast_rocky' : 'coast_flat';
  }
  // Fluss- und Seeufer (`shoreType` 2/3) sind selbst dann Feuchtzone, wenn die
  // Kachel nicht direkt ans Wasser grenzt — sonst wäre die Zone genau eine
  // Kachel breit und Schilf stünde als Linie statt als Saum.
  const freshwaterShore = input.shoreType === 2 || input.shoreType === 3;
  if ((input.freshwaterAdjacent || freshwaterShore) && input.height <= t.wetlandHeight) return 'wetland';
  // `forestEdgeSoftness` verschiebt die Kernschwelle: weicher Rand = der Kern
  // beginnt später, der Saum wird breiter.
  const coreThreshold = t.forestCoreDensity + NATURE_TUNING.forestEdgeSoftness * 0.25;
  if (input.terrain === 'forest') {
    return input.forestDensity >= coreThreshold ? 'forest_core' : 'forest_edge';
  }
  if (input.forestDensity >= t.forestEdgeDensity) return 'forest_edge';
  return 'meadow';
}

/** Eine Spawn-Regel: Dichte, Clusterbindung und Größenband. */
export interface SpawnRule {
  /** Grundwahrscheinlichkeit je Kachel (vor Cluster und Stellschrauben). */
  density: number;
  /**
   * Wie stark das kohärente Clusterfeld die Dichte moduliert (0 = gleichmäßig
   * verteilt, 1 = ausgeprägte Gruppen mit echten Lücken dazwischen).
   */
  clustering: number;
  /** Skalierungsband der Instanz [min, max]. */
  scale: readonly [number, number];
  /**
   * Optionale Terrainbindung. Eine Zone ist gröber als das Terrain: Die Wiese
   * umfasst Gras UND fruchtbaren Boden, aber Ackerspuren gehören nur auf den
   * fruchtbaren Teil — sonst zieht das Spiel Furchen durch unbestellte Weide.
   */
  terrain?: readonly TerrainType[];
}

type ZoneRules = Partial<Record<NatureKind, SpawnRule>>;

const rule = (
  density: number,
  clustering: number,
  scale: readonly [number, number],
  terrain?: readonly TerrainType[],
): SpawnRule => (terrain ? { density, clustering, scale, terrain } : { density, clustering, scale });

/**
 * DIE ZONENTABELLE — das Herz des Overhauls.
 *
 * Gelesen wird sie so: „In einem Waldkern trägt jede Kachel mit 62 % eine
 * Kiefer, stark gruppiert, in 0,85–1,25facher Größe." Die Größenbänder folgen
 * der Vorgabe aus dem Auftrag (normal 0,85–1,25 · Akzent 1,25–1,6 · Jungwuchs
 * 0,65–0,85) und sind der eigentliche Hebel gegen den „alles gleich groß"-
 * Eindruck: eine Fläche aus 500 identischen Bäumen liest sich flach, egal wie
 * viele es sind.
 *
 * Leere Felder sind Absicht: In der Wiese wächst kein Waldkern-Unterholz, auf
 * der Steilküste kein Ackerstreifen.
 */
export const NATURE_SPAWN_RULES: Record<NatureZone, ZoneRules> = {
  // Dichte, geschlossene Waldmasse. Hier darf es voll werden — das ist der
  // Ort, an dem die Insel „Holzregion" erzählt.
  forest_core: {
    pine: rule(0.62, 0.55, [0.85, 1.25]),
    broadleaf: rule(0.16, 0.6, [0.85, 1.25]),
    largePine: rule(0.08, 0.5, [1.25, 1.6]),
    giantTree: rule(NATURE_TUNING.heroTreeProbability, 0.7, [1.25, 1.6]),
    sapling: rule(0.14, 0.4, [0.65, 0.85]),
    bush: rule(0.16, 0.45, [0.8, 1.3]),
    deadwood: rule(0.055, 0.3, [0.8, 1.3]),
    stump: rule(0.045, 0.3, [0.8, 1.2]),
    rock: rule(0.035, 0.5, [0.7, 1.2]),
    microGrass: rule(0.1, 0.2, [0.8, 1.3]),
  },
  // Lockerer Saum: viel Jungwuchs, Büsche und Licht. Der Übergang ist das,
  // was einen Wald von einem grünen Rechteck unterscheidet.
  forest_edge: {
    pine: rule(0.17, 0.7, [0.85, 1.25]),
    broadleaf: rule(0.16, 0.65, [0.85, 1.25]),
    meadowTree: rule(0.05, 0.6, [1.0, 1.45]),
    sapling: rule(0.2, 0.45, [0.65, 0.85]),
    bush: rule(0.24, 0.4, [0.8, 1.3]),
    stump: rule(0.03, 0.3, [0.8, 1.2]),
    deadwood: rule(0.025, 0.3, [0.8, 1.3]),
    rock: rule(0.03, 0.5, [0.7, 1.2]),
    flower: rule(0.07, 0.35, [0.8, 1.4]),
    microGrass: rule(0.17, 0.2, [0.8, 1.3]),
  },
  // Offene Fläche. BEWUSST BAUMARM (§7 des Auftrags): Hier soll der Spieler
  // später bauen, also trägt der Boden die Wirkung, nicht der Bestand.
  meadow: {
    meadowTree: rule(0.026, 0.75, [1.0, 1.5]),
    // § 14.0 Spieltest-Kalibrierung: Gras und Blumen sind auf Spielzoom
    // UNSICHTBAR (sie werden bewusst nah gecullt, siehe `natureRenderer.ts`).
    // „Offene Flächen wirken leer" ließ sich deshalb nicht mit mehr Bodendeckung
    // beheben, sondern nur mit Bewuchs, der auf mittlerer Distanz noch liest:
    // Büsche und Jungwuchs. Der Wiesencharakter bleibt trotzdem eindeutig —
    // ein Waldkern trägt mit 0,62 Kiefern das Zwölffache.
    sapling: rule(0.03, 0.6, [0.65, 0.85]),
    bush: rule(0.115, 0.5, [0.8, 1.3]),
    // Offene Bauwiesen bleiben frei von zufälligen Felsen. Stein sitzt in den
    // eigenen Waldsaum-, Küsten- und Hochlandzonen, wo er Landschaft erklärt.
    flower: rule(0.19, 0.4, [0.8, 1.4]),
    fieldRow: rule(0.22, 0.6, [0.85, 1.2], ['fertile']),
    microGrass: rule(0.32, 0.25, [0.8, 1.3]),
  },
  // Karge Steinzone. Vegetation nimmt zur Höhe hin ab (§4 des Auftrags) —
  // das erledigt zusätzlich `highlandVegetationFalloff` weiter unten.
  rocky_highland: {
    largePine: rule(0.07, 0.6, [0.9, 1.3]),
    pine: rule(0.05, 0.6, [0.85, 1.2]),
    rock: rule(0.36, 0.45, [0.7, 1.35]),
    scree: rule(0.28, 0.55, [0.6, 1.15]),
    boulder: rule(0.05, 0.5, [1.2, 1.9]),
    cliffRock: rule(0.022, 0.6, [1.4, 2.3]),
    dryShrub: rule(0.06, 0.4, [0.8, 1.2]),
    microGrass: rule(0.05, 0.25, [0.7, 1.1]),
  },
  // Ruhiger Strand: Ufersteine, Schilf, Gräser, vereinzelt ein Laubbaum.
  coast_flat: {
    shoreRock: rule(0.22, 0.5, [0.7, 1.3]),
    reed: rule(0.22, 0.45, [0.8, 1.3]),
    bush: rule(0.1, 0.45, [0.8, 1.2]),
    broadleaf: rule(0.035, 0.6, [0.85, 1.2]),
    sapling: rule(0.02, 0.5, [0.65, 0.85]),
    flower: rule(0.09, 0.35, [0.8, 1.3]),
    microGrass: rule(0.22, 0.25, [0.8, 1.3]),
  },
  // Felsige Bucht/Klippenfuß: Steine bestimmen das Bild, Grün ist die Ausnahme.
  coast_rocky: {
    shoreRock: rule(0.3, 0.45, [0.75, 1.45]),
    rock: rule(0.2, 0.5, [0.7, 1.3]),
    scree: rule(0.12, 0.5, [0.6, 1.1]),
    cliffRock: rule(0.045, 0.6, [1.4, 2.4]),
    boulder: rule(0.035, 0.5, [1.2, 1.9]),
    dryShrub: rule(0.05, 0.4, [0.8, 1.2]),
    pine: rule(0.03, 0.65, [0.8, 1.15]),
    microGrass: rule(0.07, 0.25, [0.7, 1.2]),
  },
  // Fluss-/Seeufer im Binnenland.
  wetland: {
    reed: rule(0.3, 0.4, [0.8, 1.35]),
    broadleaf: rule(0.07, 0.6, [0.85, 1.25]),
    bush: rule(0.12, 0.45, [0.8, 1.3]),
    deadwood: rule(0.05, 0.3, [0.8, 1.3]),
    flower: rule(0.06, 0.35, [0.8, 1.3]),
    microGrass: rule(0.16, 0.25, [0.8, 1.3]),
  },
  // Kleine vorgelagerte Eilande: kompakt, aber vollständig ausgearbeitet —
  // ein Eiland mit drei Bäumen sieht aus wie ein Fehler, nicht wie eine Insel.
  small_island: {
    pine: rule(0.2, 0.5, [0.85, 1.25]),
    broadleaf: rule(0.13, 0.5, [0.85, 1.25]),
    giantTree: rule(0.012, 0.6, [1.25, 1.6]),
    sapling: rule(0.1, 0.4, [0.65, 0.85]),
    bush: rule(0.24, 0.4, [0.8, 1.3]),
    rock: rule(0.16, 0.5, [0.7, 1.3]),
    shoreRock: rule(0.22, 0.45, [0.75, 1.35]),
    boulder: rule(0.03, 0.5, [1.2, 1.8]),
    reed: rule(0.07, 0.4, [0.8, 1.2]),
    flower: rule(0.09, 0.35, [0.8, 1.3]),
    microGrass: rule(0.2, 0.25, [0.8, 1.3]),
  },
};

/** Vier Wirkgruppen — Stellschrauben und Regionscharakter greifen daran an. */
export type NatureGroup = 'tree' | 'rock' | 'coast' | 'ground';

export function natureGroupOf(kind: NatureKind): NatureGroup {
  switch (kind) {
    case 'pine':
    case 'broadleaf':
    case 'meadowTree':
    case 'largePine':
    case 'giantTree':
    case 'sapling':
      return 'tree';
    case 'rock':
    case 'boulder':
    case 'cliffRock':
    case 'scree':
      return 'rock';
    case 'shoreRock':
    case 'reed':
      return 'coast';
    default:
      return 'ground';
  }
}

const GROUP_TUNING: Record<NatureGroup, () => number> = {
  tree: () => NATURE_TUNING.treeDensity,
  rock: () => NATURE_TUNING.rockDensity,
  coast: () => NATURE_TUNING.coastPropDensity,
  ground: () => NATURE_TUNING.groundCoverDensity,
};

/**
 * REGIONALE IDENTITÄT (§6 des Auftrags: „auch ohne UI soll man erkennen, dass
 * die Insel aus unterschiedlichen Nutzungsräumen besteht").
 *
 * Die Zone beschreibt das Gelände, nicht die Landschaft: Zwei Waldkerne sehen
 * ohne diesen Schritt identisch aus, egal ob sie im Holzrevier oder in einer
 * offenen Ackerregion liegen. Der visuelle Regionscharakter aus
 * `worldVisualProfiles.ts` verschiebt deshalb die Gruppendichten — dasselbe
 * Gelände liest sich im Nordwald geschlossener als in der Westmark.
 *
 * Die Werte sind bewusst moderat: Sie sollen den Charakter betonen, nicht die
 * Geografie überschreiben.
 */
export const REGION_CHARACTER_DENSITY: Record<string, Partial<Record<NatureGroup, number>>> = {
  /** Holzregion: geschlossene, tiefe Waldmasse. */
  waldkern: { tree: 1.4, ground: 0.85, rock: 0.9 },
  /** Offene Landschaft: Wiese trägt, Wald bleibt Saum. */
  offen: { tree: 0.72, ground: 1.25 },
  /** Ackerland: viel Bodenwirkung, wenig geschlossener Bestand. */
  agrar: { tree: 0.75, ground: 1.4 },
  /** Gebirge: Stein bestimmt, Grün ist Gast. */
  alpin: { tree: 0.7, rock: 1.35, ground: 0.8 },
  /** Küstenregion: Ufersteine und Schilf treten hervor. */
  ufer: { tree: 0.85, coast: 1.4, ground: 1.1 },
  /** Feuchte Senken. */
  feucht: { tree: 1.05, coast: 1.3 },
  /** Trockenzone: karg in jeder Hinsicht außer Fels. */
  trocken: { tree: 0.5, rock: 1.2, ground: 0.75 },
};

/** Welche Stellschraube gilt für welche Art. */
function tuningFor(kind: NatureKind, character: string | undefined): number {
  const group = natureGroupOf(kind);
  const base = GROUP_TUNING[group]();
  const modifier = character ? REGION_CHARACTER_DENSITY[character]?.[group] : undefined;
  return base * (modifier ?? 1);
}

/**
 * Vegetation nimmt zur Höhe hin ab (§4: „kaum Vegetation in der steinigen
 * Kernzone"). Fels und Geröll bleiben davon unberührt — nur Grün wird dünner.
 */
export function highlandVegetationFalloff(height: number): number {
  const start = NATURE_ZONE_THRESHOLDS.rockyHeight;
  const end = start + 16;
  if (height <= start) return 1;
  if (height >= end) return 0.06;
  const t = (height - start) / (end - start);
  return 1 - t * t * 0.94;
}

const GREEN_KINDS = new Set<NatureKind>([
  'pine', 'broadleaf', 'meadowTree', 'largePine', 'giantTree', 'sapling',
  'bush', 'reed', 'flower', 'fieldRow', 'microGrass',
]);

/**
 * Entscheidet, ob auf (x,y) ein Prop der Art `kind` steht.
 *
 * Die Wahrscheinlichkeit ist das Produkt aus Zonendichte, Clusterfeld,
 * Stellschraube und Höhenabnahme; gewürfelt wird mit einem STABILEN
 * Positions-Hash — nie mit einer Laufzeit-RNG und nie abhängig davon, welche
 * Regionen gerade sichtbar sind (§16 bleibt gültig).
 */
export interface SpawnQuery {
  kind: NatureKind;
  zone: NatureZone;
  terrain: TerrainType;
  x: number;
  y: number;
  /** Kohärentes Clusterfeld 0..1 an dieser Stelle. */
  cluster: number;
  height: number;
  /** Stabiles Salz je Region — hält die Auswahl regionslokal (§16). */
  regionSalt: number;
  /** Visueller Regionscharakter (`RegionVisualProfile.vegetation`). */
  character?: string | undefined;
  /**
   * Dichtefaktor der ganzen Region (1 = voll). Gesperrte Gebiete werden damit
   * ausgedünnt statt verdeckt: Die Landschaft bleibt sichtbar und lesbar, kostet
   * aber nur einen Bruchteil der Instanzen. Beim Freischalten füllt sie sich auf
   * — die bereits stehenden Props behalten dabei Position und Größe, es kommen
   * nur welche dazu (kein Umspringen).
   */
  densityScale?: number | undefined;
}

export function shouldSpawn(query: SpawnQuery): boolean {
  const { kind, zone, terrain, x, y, cluster, height, regionSalt } = query;
  const spawnRule = NATURE_SPAWN_RULES[zone][kind];
  if (!spawnRule) return false;
  if (spawnRule.terrain && !spawnRule.terrain.includes(terrain)) return false;
  let chance = spawnRule.density * tuningFor(kind, query.character) * (query.densityScale ?? 1);
  // Clusterbindung: Werte über 0,5 verdichten, darunter lichten sie auf. Der
  // Faktor bleibt bei 0 gedeckelt, damit echte Lichtungen entstehen dürfen.
  chance *= Math.max(0, 1 + spawnRule.clustering * (cluster * 2 - 1) * 1.7);
  if (zone === 'small_island') chance *= NATURE_TUNING.smallIslandDensity;
  if (GREEN_KINDS.has(kind)) chance *= highlandVegetationFalloff(height);
  if (chance <= 0) return false;
  return propHash(`${kind}:${regionSalt}:${x},${y}`) < chance;
}

/**
 * Deterministische Instanzgröße innerhalb des Zonenbands. Rotation und Position
 * streut der Renderer; die GRÖSSE gehört zur Regel, weil sie den Charakter der
 * Zone trägt (Jungwuchs am Rand, Akzentbäume auf der Wiese).
 */
export function spawnScale(kind: NatureKind, zone: NatureZone, x: number, y: number): number {
  const spawnRule = NATURE_SPAWN_RULES[zone][kind];
  if (!spawnRule) return 1;
  const [min, max] = spawnRule.scale;
  return min + propHash(`scale:${kind}:${x},${y}`) * (max - min);
}
