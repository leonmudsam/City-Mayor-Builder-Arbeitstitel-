// § Stadtarbeit-Overhaul, Phase P3 — DIE EINE WELT, ZWEITE DARSTELLUNG.
//
// Der Auftrag verlangt ausdrücklich: „Die 2D-Stadtarbeit-Ansicht ist nur eine
// andere Darstellung derselben Welt. NICHT: eine vereinfachte neue Fake-Karte."
// Dieses Modul ist die Stelle, an der das durchgesetzt wird — jede Kachel, jede
// Höhe, jeder Baum der Draufsicht stammt hier aus **denselben** Quellen, aus
// denen der 3D-Renderer seine Welt baut:
//
//   Terrain/Region/Oberfläche → `game/config/startRegion.config.ts` (Bake)
//   Bodenhöhe                 → `three/terrainHeight.ts` (`terrainHeightAt`)
//   Vegetation                → `three/natureDistribution.ts` (`collectRegionNature`)
//
// Es ist bewusst frei von `three`, `react` und Canvas: es liefert Zahlen, keine
// Bilder. Wer daraus Dreiecke macht (3D) oder Pixel (2D-Karte), ist Sache des
// Aufrufers — genau deshalb entsteht KEIN zweiter Renderer.
//
// Regel für die Weiterarbeit: Wer die Draufsicht um eine Weltinformation
// erweitert, ergänzt sie HIER und liest sie nicht direkt aus einem Grid nach.
// Eine zweite Leseinstanz ist der erste Schritt zu einer zweiten Welt (D-042).

import type { RegionId, TerrainType } from '../game/types.ts';
import { WORLD_TILES, bakedSurfaceAt, regionIdAt, terrainAt } from '../game/config/startRegion.config.ts';
import { WATER_LEVEL, terrainHeightAt } from './three/terrainHeight.ts';
import { collectRegionNature, type NatureDistributionOptions } from './three/natureDistribution.ts';
import { NATURE_KINDS, natureGroupOf, type NatureGroup, type NatureKind } from './three/natureZones.ts';

export { WORLD_TILES, WATER_LEVEL };

/** Kantenlänge einer Weltkachel in Metern — dieselbe Umrechnung wie im Straßenprofil. */
export const TILE_METERS = 4;

/**
 * Alles, was die Draufsicht über eine Kachel wissen muss, in EINER Abfrage.
 * Zusammengesetzt aus dem Bake (`bakedSurfaceAt`), dem Terrain-Grid und der
 * kanonischen Bodenhöhe — keine eigene Interpretation, keine eigenen Schwellen.
 */
export interface WorldTileSample {
  terrain: TerrainType;
  regionId: RegionId;
  /** Bodenhöhe der Kachelmitte in Metern (`terrainHeightAt`). */
  height: number;
  slope: number;
  water: boolean;
  cliff: boolean;
  coast: boolean;
  buildable: boolean;
  shoreType: ReturnType<typeof bakedSurfaceAt>['shoreType'];
}

export function sampleWorldTile(x: number, y: number): WorldTileSample {
  const surface = bakedSurfaceAt(x, y);
  return {
    terrain: terrainAt(x, y),
    regionId: regionIdAt(x, y),
    height: terrainHeightAt(x + 0.5, y + 0.5),
    slope: surface.slope,
    water: surface.water,
    cliff: surface.cliff,
    coast: surface.coast,
    buildable: surface.buildable,
    shoreType: surface.shoreType,
  };
}

/**
 * Lichtrichtung der Hangschattierung (Nordwest, leicht von oben) — dieselbe
 * Leserichtung wie klassische Reliefkarten. Bewusst KEINE Kopplung an die
 * Tageszeit: die Karte ist eine Logistikansicht und muss zu jeder Uhrzeit
 * gleich lesbar sein.
 */
const RELIEF_LIGHT = normalise(-0.58, -0.58, 0.57);
/** Überhöhung des Reliefs. Ohne sie verschwindet der Höhenunterschied im Rauschen. */
const RELIEF_EXAGGERATION = 2.6;

/**
 * Hangschattierung einer Kachel aus den ECHTEN Höhen: −1 (Schattenhang) bis +1
 * (Sonnenhang), 0 = eben. Das ist der eine Grund, warum die Draufsicht Gebirge,
 * Täler und Klippen zeigt, statt farbige Kacheln aneinanderzureihen.
 *
 * Ergebnisse werden zwischengespeichert: die Höhe einer Kachel ändert sich nie
 * (sie kommt aus dem Bake), und eine Fahrt über die Karte würde sonst pro Bild
 * einige Tausend Interpolationen wiederholen.
 */
export function reliefShade(x: number, y: number): number {
  if (x < 0 || y < 0 || x >= WORLD_TILES || y >= WORLD_TILES) return 0;
  const offset = y * WORLD_TILES + x;
  const cached = reliefCache[offset];
  if (cached !== undefined && !Number.isNaN(cached)) return cached;
  const dzdx = (terrainHeightAt(x + 1.5, y + 0.5) - terrainHeightAt(x - 0.5, y + 0.5)) / (2 * TILE_METERS);
  const dzdy = (terrainHeightAt(x + 0.5, y + 1.5) - terrainHeightAt(x + 0.5, y - 0.5)) / (2 * TILE_METERS);
  const normal = normalise(-dzdx * RELIEF_EXAGGERATION, -dzdy * RELIEF_EXAGGERATION, 1);
  const light = normal.x * RELIEF_LIGHT.x + normal.y * RELIEF_LIGHT.y + normal.z * RELIEF_LIGHT.z;
  // Ebener Boden ergibt genau `RELIEF_LIGHT.z`; darauf wird normiert, damit die
  // flache Insel neutral bleibt und nur echte Hänge Kontrast bekommen.
  const flat = RELIEF_LIGHT.z;
  const shade = Math.max(-1, Math.min(1, (light - flat) / (1 - flat)));
  reliefCache[offset] = shade;
  return shade;
}

const reliefCache = new Float32Array(WORLD_TILES * WORLD_TILES).fill(Number.NaN);

/** Höhe über der Wasserlinie in Metern — für Höhenbänder der Karte. */
export function elevationAboveWater(x: number, y: number): number {
  return terrainHeightAt(x + 0.5, y + 0.5) - WATER_LEVEL;
}

/** Eine Naturinstanz in der Draufsicht. Position und Größe kommen 1:1 aus der Verteilung. */
export interface MapNatureInstance {
  x: number;
  y: number;
  kind: NatureKind;
  group: NatureGroup;
  scale: number;
}

/**
 * Welche Arten in der Draufsicht überhaupt sichtbar wären. Der Auftrag sagt es
 * deutlich: „Nicht: Jeden kleinen Stein einzeln darstellen." Bodendeckung
 * (Gras, Blumen, Ackerspuren) verschwindet aus 300 m Höhe ohnehin unter einer
 * Kachel — sie wird deshalb gar nicht erst gesammelt, statt später verworfen.
 */
export const MAP_NATURE_KINDS: readonly NatureKind[] = NATURE_KINDS.filter(
  (kind) => kind !== 'microGrass' && kind !== 'flower' && kind !== 'fieldRow',
);

/**
 * Ab welcher Kachelgröße (Pixel) eine Gruppe gezeichnet wird — das LOD der
 * Karte (§12 des Auftrags). Fern: nur Wald als Fläche, keine Einzelprops.
 */
export const MAP_NATURE_MIN_SCALE: Record<NatureGroup, number> = {
  tree: 4.5,
  rock: 9,
  coast: 11,
  ground: 16,
};

export interface MapNatureOptions {
  /** Terrain-Sicht des Spielstands (inkl. Overrides) — wie im 3D-Renderer. */
  terrainAt?: ((x: number, y: number) => TerrainType) | undefined;
  /** Höhenquelle; Standard ist die kanonische `terrainHeightAt`. */
  heightAt?: ((x: number, y: number) => number) | undefined;
  /** Dichtefaktor je Region (gesperrte Regionen werden ausgedünnt gezeigt). */
  densityScale?: ((regionId: number) => number) | undefined;
}

/**
 * Vegetation einer Regionsmenge für die Draufsicht.
 *
 * ENTSCHEIDEND: Das hier ruft `collectRegionNature` — dieselbe und einzige
 * Verteilungsinstanz, aus der auch die 3D-Welt wächst (D-042/D-044). Die Karte
 * erfindet keinen einzigen Baum und lässt keinen weg; ein Test kann deshalb
 * Kachel für Kachel vergleichen.
 *
 * Bewusst OHNE `isOccupied`: die Belegung wechselt bei jedem Bauklick, und ein
 * Ergebnis, das daran hängt, müsste bei jedem Klick über die halbe Insel neu
 * berechnet werden (genau die Falle aus D-045). Props unter Gebäuden werden
 * stattdessen beim Zeichnen verdeckt — sichtbar identisch, aber zwischenspeicherbar.
 */
export function collectMapNature(
  regionIds: readonly number[],
  options: MapNatureOptions = {},
): MapNatureInstance[] {
  const base: NatureDistributionOptions = {
    terrainAt: options.terrainAt ?? terrainAt,
    heightAt: options.heightAt ?? ((x, y) => terrainHeightAt(x + 0.5, y + 0.5)),
  };
  const result: MapNatureInstance[] = [];
  for (const regionId of regionIds) {
    const densityScale = options.densityScale?.(regionId);
    const placement = collectRegionNature(
      regionId,
      densityScale === undefined ? base : { ...base, densityScale },
    );
    for (const kind of MAP_NATURE_KINDS) {
      const group = natureGroupOf(kind);
      for (const instance of placement[kind]) {
        result.push({ x: instance.x, y: instance.y, kind, group, scale: instance.scale });
      }
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Farbe einer Kachel in der Draufsicht
// ---------------------------------------------------------------------------
//
// Der Auftrag will „vereinfachte Texturen, klare Farben, bessere Lesbarkeit" —
// aber aus der echten Welt abgeleitet, nicht erfunden. Deshalb steht die Regel
// hier als reine Funktion neben den Weltdaten und nicht im Zeichencode: So kann
// ein Test behaupten und prüfen, dass Gebirge grau, Wald dunkelgrün, tiefes
// Wasser dunkler als flaches und ein Schatthang dunkler als sein Sonnenhang ist.

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Grundfarbe je Terrainklasse — die Legende der Karte. */
const TERRAIN_BASE: Record<TerrainType, Rgb> = {
  water: { r: 24, g: 78, b: 104 },
  river: { r: 46, g: 132, b: 156 },
  sand: { r: 205, g: 184, b: 128 },
  fertile: { r: 150, g: 172, b: 96 },
  grass: { r: 111, g: 152, b: 92 },
  forest: { r: 62, g: 111, b: 74 },
  mountain: { r: 140, g: 138, b: 130 },
};
/** Fels an Klippen und Steilhängen. */
const ROCK_TINT: Rgb = { r: 120, g: 114, b: 104 };
/** Hochlandton — hohe Lagen werden karger, nicht einfach heller. */
const HIGHLAND_TINT: Rgb = { r: 168, g: 164, b: 148 };
/** Flachwasser über der Uferbank. */
const SHALLOW_WATER: Rgb = { r: 66, g: 156, b: 168 };
/** Ab dieser Höhe über dem Wasser beginnt der Hochlandton. */
const HIGHLAND_START_M = 22;
/** Bei dieser Höhe ist er voll ausgeprägt. */
const HIGHLAND_FULL_M = 46;
/**
 * Tiefe (Meter unter der Wasserlinie), ab der Wasser voll ausgedunkelt ist.
 *
 * GEMESSEN, nicht geschätzt: Das Weltmodell hat gar keinen Gewässergrund — die
 * tiefste Stelle der ganzen Insel liegt bei **5,06 m**, und 94 % aller
 * Wasserkacheln liegen zwischen 2 und 3 m. Mit einem größeren Wert (der erste
 * Ansatz stand bei 7 m) erreicht die Rampe ihr dunkles Ende nirgends, und das
 * Meer wird eine einzige Fläche ohne Uferbank.
 */
const DEEP_WATER_M = 4;

// § D-045: EINE Definition, wie gesperrtes Land aussieht — für die 3D-Welt und
// für die Karte. Lägen die Werte zweimal vor, könnte dieselbe Region in der
// Übersicht gesperrt und in der Welt frei wirken.
/** Anteil, um den gesperrtes Land in Richtung Graustufe gezogen wird. */
export const LOCKED_DESATURATION = 0.85;
/** Zusätzliche Abdunklung gesperrten Landes. */
export const LOCKED_DARKENING = 0.16;
/**
 * Vegetationsdichte gesperrter Regionen.
 *
 * **1 = volle Dichte** (Nutzerauftrag 02.08.2026): „keine Props ausblenden,
 * keine Bäume ausblenden, keine Steine ausblenden … alles sichtbar, nur
 * ausgegraut." Der frühere Wert 0,5 halbierte die Vegetation gesperrten Landes
 * — sichtbar als kahler Streifen genau an der Regionsgrenze, und damit als
 * „unvollständige Welt", die der Auftrag ausdrücklich ausschließt.
 *
 * Der Preis ist gemessen bezahlbar, weil gesperrte Vegetation an einem EIGENEN
 * Schlüssel hängt (D-045) und **keine Schatten** wirft: sie wird nur beim
 * Freischalten neu gebaut, nicht bei jedem Bauklick. Wer hier wieder ausdünnen
 * will, dünnt zuerst die Qualitätsstufe aus — nicht eine einzelne Region.
 */
export const LOCKED_VEGETATION_DENSITY = 1;

/**
 * Farbe einer Kachel in der Draufsicht — abgeleitet aus Terrain, echter Höhe,
 * Hangschattierung, Klippen- und Küstenmaske. `locked` entsättigt sie nach
 * derselben Regel wie das gesperrte Gelände in der 3D-Welt.
 */
export function worldTileColor(x: number, y: number, locked = false): Rgb {
  const sample = sampleWorldTile(x, y);
  let color: Rgb;
  if (sample.water || sample.terrain === 'water' || sample.terrain === 'river') {
    // Wassertiefe aus der echten Höhe: die Uferbank hebt sich vom offenen Meer ab.
    const depth = Math.max(0, WATER_LEVEL - sample.height);
    const t = Math.min(1, depth / DEEP_WATER_M);
    color = mix(SHALLOW_WATER, TERRAIN_BASE[sample.terrain === 'river' ? 'river' : 'water'], t);
  } else {
    color = { ...TERRAIN_BASE[sample.terrain] };
    // Steile Hänge und Klippen zeigen Fels, egal was darauf wachsen würde.
    const rockiness = Math.max(sample.cliff ? 0.62 : 0, Math.min(1, sample.slope / 2.4));
    color = mix(color, ROCK_TINT, rockiness * 0.75);
    // Hochland wird karger.
    const elevation = sample.height - WATER_LEVEL;
    const highland = clamp01((elevation - HIGHLAND_START_M) / (HIGHLAND_FULL_M - HIGHLAND_START_M));
    color = mix(color, HIGHLAND_TINT, highland * 0.55);
    // Strandsaum: Uferkacheln bekommen einen Sandstich.
    if (sample.coast) color = mix(color, TERRAIN_BASE.sand, 0.28);
    // Und erst ganz zum Schluss das Relief — es moduliert alles darüber.
    const shade = reliefShade(x, y);
    const factor = 1 + shade * (shade > 0 ? 0.34 : 0.42);
    color = { r: color.r * factor, g: color.g * factor, b: color.b * factor };
  }

  if (locked) {
    const luminance = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
    color = mix(color, { r: luminance, g: luminance, b: luminance }, LOCKED_DESATURATION);
    const dim = 1 - LOCKED_DARKENING;
    color = { r: color.r * dim, g: color.g * dim, b: color.b * dim };
  }
  return {
    r: Math.max(0, Math.min(255, Math.round(color.r))),
    g: Math.max(0, Math.min(255, Math.round(color.g))),
    b: Math.max(0, Math.min(255, Math.round(color.b))),
  };
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const f = clamp01(t);
  return { r: a.r + (b.r - a.r) * f, g: a.g + (b.g - a.g) * f, b: a.b + (b.b - a.b) * f };
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function normalise(x: number, y: number, z: number): { x: number; y: number; z: number } {
  const length = Math.hypot(x, y, z) || 1;
  return { x: x / length, y: y / length, z: z / length };
}
