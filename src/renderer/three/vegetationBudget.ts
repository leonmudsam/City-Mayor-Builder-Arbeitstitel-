// Deterministische Vegetations-/Prop-Budgets (§ Overhaul 8.0 / §16).
//
// PROBLEM, das dieses Modul löst: Die Prop-Auswahl wurde früher über einen
// Index-Schritt auf der GESAMTEN, weltweiten Kachelliste gedeckelt
// (`tiles.filter((_, i) => i % ceil(len / cap) === 0)`). Wuchs die Liste beim
// Freischalten einer Region, änderte sich die Schrittweite — und damit
// verschwanden Bäume, Felsen und Büsche in längst sichtbaren Regionen oder
// sprangen an andere Kacheln. Genau das ist das gemeldete
// „Props verschwinden beim Regions-Unlock".
//
// LÖSUNG (§16 verbindlich): Die Auswahl entsteht ausschließlich aus
// Weltseed + Region + Kachelposition — nie aus Unlock-Status, Renderreihenfolge
// oder Laufzeit-Arrayindex. Jede Region erhält ihr EIGENES Budget; welche
// Kacheln es füllen, entscheidet ein stabiler Positions-Hash. Dadurch ist die
// Vegetation einer Region unabhängig davon, welche anderen Regionen gerade
// sichtbar sind.
//
// Bewusst kein three/react-Import: das Modul ist rein und damit testbar.

/** Stabiler 0..1-Hash (FNV-1a). Identisch zur Renderer-Variante. */
export function propHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

export interface PropTile {
  x: number;
  y: number;
}

const smoothStep = (value: number): number => value * value * (3 - 2 * value);

/**
 * Visueller Naturrahmen der Startregion: am Rathaus bleibt eine klare
 * Bau-Lichtung, ab dem mittleren Ring wachsen Cluster weich auf volle Dichte.
 *
 * § 12.2 (Spieltest: „Die Welt hat immer noch viel zu wenig Props und Bäume"):
 * Der Rahmen war zu groß für die Startregion. Gemessen standen in der ganzen
 * Startregion **2 Kiefern, 1 Laubbaum und 2 Büsche** — die Lichtung begann erst
 * bei Radius 15 und erreichte volle Dichte bei 32, während die Region insgesamt
 * nur rund 40 Kacheln misst. Die „Lichtung" war also die ganze Region. Jetzt
 * bleibt der unmittelbare Bauplatz frei (Radius 5) und die Natur schließt bis
 * Radius 16 auf: 183 Bäume/Büsche statt 11, ohne den Gründungsplatz zuzustellen.
 */
export function starterNatureFrame(distanceFromTownHall: number): number {
  const t = Math.max(0, Math.min(1, (distanceFromTownHall - 5) / 11));
  return smoothStep(t);
}

/**
 * Kohärentes 0..1-Feld für bewusst lesbare Wald- und Propgruppen.
 *
 * Ein Positionshash je Kachel wirkt wie gleichmäßiges Konfetti. Hier werden
 * dagegen vier stabile Grobzellen weich interpoliert. Benachbarte Kacheln
 * erhalten ähnliche Werte, ohne RNG- oder Unlock-Abhängigkeit; hohe Bereiche
 * bilden Naturcluster, niedrige bleiben als klare Bau-/Wiesenräume offen.
 */
export function propClusterWeight(x: number, y: number, regionId: number, cellSize = 8): number {
  const gx = x / cellSize;
  const gy = y / cellSize;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const fx = smoothStep(gx - x0);
  const fy = smoothStep(gy - y0);
  const sample = (sx: number, sy: number): number => propHash(`cluster:${regionId}:${sx},${sy}`);
  const top = sample(x0, y0) + (sample(x0 + 1, y0) - sample(x0, y0)) * fx;
  const bottom = sample(x0, y0 + 1) + (sample(x0 + 1, y0 + 1) - sample(x0, y0 + 1)) * fx;
  const local = top + (bottom - top) * fy;

  // Eine zweite, gröbere Frequenz verhindert schachbrettartige 8er-Inseln und
  // verbindet mehrere lokale Gruppen zu einem lesbaren Waldrand.
  const macroSize = cellSize * 2.75;
  const mx = x / macroSize;
  const my = y / macroSize;
  const mx0 = Math.floor(mx);
  const my0 = Math.floor(my);
  const mfx = smoothStep(mx - mx0);
  const mfy = smoothStep(my - my0);
  const macroSample = (sx: number, sy: number): number => propHash(`macro:${regionId}:${sx},${sy}`);
  const macroTop = macroSample(mx0, my0) + (macroSample(mx0 + 1, my0) - macroSample(mx0, my0)) * mfx;
  const macroBottom = macroSample(mx0, my0 + 1) + (macroSample(mx0 + 1, my0 + 1) - macroSample(mx0, my0 + 1)) * mfx;
  const macro = macroTop + (macroBottom - macroTop) * mfy;
  return local * 0.72 + macro * 0.28;
}

/**
 * Wählt aus einer Kandidatenliste höchstens `budget` Kacheln aus. Die Auswahl
 * entsteht ausschließlich aus `salt` (Proptyp + Region) und der Kachelposition —
 * NICHT aus der Eingabereihenfolge und nicht aus der Listenlänge-modulo-Rechnung,
 * die den Unlock-Bug verursacht hat.
 *
 * Aufgerufen wird der Helfer pro Region mit den Kacheln genau dieser Region;
 * dadurch ist das Ergebnis einer Region vollständig unabhängig davon, welche
 * anderen Regionen gerade sichtbar sind.
 */
export function selectPropTiles(salt: string, tiles: readonly PropTile[], budget: number): PropTile[] {
  if (budget <= 0) return [];
  if (tiles.length <= budget) return [...tiles];
  return [...tiles]
    .map((tile) => ({ tile, rank: propHash(`${salt}:${tile.x},${tile.y}`) }))
    .sort((a, b) =>
      // Gleichstand stabil über die Position auflösen — kein RNG, keine
      // Abhängigkeit von der Eingabereihenfolge.
      a.rank - b.rank || a.tile.y - b.tile.y || a.tile.x - b.tile.x,
    )
    .slice(0, budget)
    .map((entry) => entry.tile);
}

/** Räumliche Gruppen halten InstancedMesh-Bounds klein genug für echtes Culling. */
export function spatialPropChunks(
  tiles: readonly PropTile[],
  chunkSize = 48,
): PropTile[][] {
  const size = Math.max(1, Math.floor(chunkSize));
  const chunks = new Map<string, PropTile[]>();
  for (const tile of tiles) {
    const cx = Math.floor(tile.x / size);
    const cy = Math.floor(tile.y / size);
    const key = `${cx},${cy}`;
    const chunk = chunks.get(key);
    if (chunk) chunk.push(tile);
    else chunks.set(key, [tile]);
  }
  return [...chunks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, chunk]) => chunk);
}

/**
 * Budget je Region und Proptyp. Die Werte sind bewusst PRO REGION definiert:
 * Ein Unlock erhöht nur die Gesamtzahl, verändert aber niemals die Auswahl
 * bereits sichtbarer Regionen.
 *
 * § 12.2 (Spieltest): rund verdoppelt. Gemessen standen weltweit **6.891**
 * Props auf 61.322 Landkacheln — und in acht von neun Regionen war bei Blumen
 * und Feldspuren das BUDGET der Engpass, nicht die Landschaft.
 *
 * § 14.0 (NATUR-OVERHAUL): noch einmal deutlich angehoben, weil sich die
 * KOSTENGRUNDLAGE geändert hat. Bis hierher bestand die Masse der Welt aus
 * Kegeln, weil jedes Natur-`.glb` rund 29.000 Dreiecke wiegt und deshalb nur
 * ~500-mal weltweit gesetzt werden konnte. Seit `naturePropGeometry.ts` trägt
 * die Masse bewusst gestaltete Formen mit 30–200 Dreiecken — die gleiche
 * Instanzzahl kostet damit rund zwei Größenordnungen weniger Geometrie, und
 * Dichte ist wieder eine Gestaltungsfrage statt einer Budgetfrage.
 *
 * Es bleibt ein Deckel: Instancing, räumliche Chunks und Distance-Culling
 * tragen das (§13), aber eine einzelne Riesenregion darf das Frame-Budget nicht
 * allein aufessen.
 */
export const REGION_PROP_BUDGET = {
  pine: 1250,
  broadleaf: 480,
  meadowTree: 150,
  largePine: 200,
  /** § 12.2: Seltene, stark hochskalierte Altbäume als Silhouetten-Anker. */
  giantTree: 18,
  /** § 14.0: Jungwuchs — trägt den weichen Waldrand. */
  sapling: 520,
  bush: 900,
  rock: 950,
  /** § 12.2: Wenige, deutlich größere Findlinge — Maßstab statt Kies. */
  boulder: 22,
  /** § 14.0: Markante Felsgruppen an Klippen und Gebirgskanten. */
  cliffRock: 40,
  /** § 14.0: Geröllfelder im Felshochland. */
  scree: 720,
  /** § 14.0: Küstensteine am Ufersaum. */
  shoreRock: 620,
  reed: 300,
  flower: 700,
  fieldRow: 260,
  deadwood: 150,
  /** § 14.0: Baumstümpfe als Spur von Wald, der einmal dichter stand. */
  stump: 140,
  dryShrub: 190,
  microGrass: 1100,
} as const;

export type PropKind = keyof typeof REGION_PROP_BUDGET;

/**
 * Bezugsgröße einer „normalen" Region in Kacheln. Das Budget oben gilt für genau
 * diese Größe; größere Regionen bekommen proportional mehr, kleinere weniger.
 */
export const PROP_BUDGET_REFERENCE_TILES = 4000;
/**
 * Untere/obere Schranke des Skalierungsfaktors (gegen Kahlschlag und Explosion).
 *
 * § 12.1: Die Untergrenze liegt bewusst HOCH (0,85 statt 0,5). Die Startregion ist
 * mit 1.656 Kacheln die kleinste der Welt — mit einer reinen Flächenskalierung
 * bekäme genau der Ort, an dem der Spieler die meiste Zeit verbringt, das
 * dünnste Grün. Der Regionsrahmen `starterNatureFrame` hält die Bau-Lichtung am
 * Rathaus ohnehin frei; das Budget darf sie deshalb ruhig gut ausstatten.
 */
const PROP_BUDGET_MIN_FACTOR = 0.85;
const PROP_BUDGET_MAX_FACTOR = 3.5;

/**
 * § 12.1 §8 — VEGETATIONSBUDGET FOLGT DER REGIONSGRÖSSE.
 *
 * `REGION_PROP_BUDGET` war ein FLACHES Budget je Region. Zwei Folgen, die im
 * Spieltest als „die Welt wirkt leer und generisch" ankamen:
 *
 *  1. Eine Region mit 12.644 Kacheln bekam genauso viele Bäume wie eine mit
 *     2.122 — die großen Landschaften waren zwangsläufig kahl.
 *  2. Die Gesamtmenge hing an der ANZAHL der Regionen, nicht an der Landfläche.
 *     Die Konsolidierung von 13 auf 8 Regionen (§1) hätte die Welt damit
 *     zusätzlich um rund ein Drittel entlaubt, ohne dass ein Baum „weggenommen"
 *     worden wäre.
 *
 * Jetzt skaliert das Budget mit der Fläche. Die Deckel bleiben: Instancing,
 * Chunking und Distance-Culling tragen das (§13), aber eine einzelne Riesenregion
 * darf das Frame-Budget nicht allein aufessen.
 */
export function regionPropBudget(kind: PropKind, regionTiles: number): number {
  const factor = Math.max(
    PROP_BUDGET_MIN_FACTOR,
    Math.min(PROP_BUDGET_MAX_FACTOR, regionTiles / PROP_BUDGET_REFERENCE_TILES),
  );
  return Math.round(REGION_PROP_BUDGET[kind] * factor);
}

/**
 * Nur diese kleine, positionsstabile Teilmenge erhält echte Drop-in-GLBs.
 * Der restliche Wald bleibt als günstige stilisierte Instanzgeometrie sichtbar.
 */
export const REGION_DETAIL_PROP_BUDGET: Record<PropKind, number> = {
  pine: 14,
  broadleaf: 12,
  meadowTree: 4,
  largePine: 6,
  // § 14.0: Jungwuchs, Geröll, Küstensteine und Stümpfe sind reine
  // Massenformen — für sie existiert kein passendes Modell, und ein
  // hochskaliertes Fremdmodell wäre schlechter als die stilisierte Form.
  sapling: 0,
  scree: 0,
  shoreRock: 0,
  stump: 0,
  // § 14.0: Felsgruppen an Klippen sind Blickfänger und werden — wie
  // Riesenbäume und Findlinge — DIREKT als Modell gesetzt (Deckel ist
  // `REGION_PROP_BUDGET` selbst), nicht über den Detail-Auswahlpfad.
  cliffRock: 0,
  // § 12.2: Riesenbäume und Findlinge nehmen am Detail-AUSWAHLPFAD nicht teil.
  // Sie werden direkt als Modell gesetzt (ohne stilisierte Ersatzgeometrie),
  // weil eine Ersatzform in dieser Größe sofort auffiele. Ihr Deckel ist
  // deshalb `REGION_PROP_BUDGET` selbst — bewusst klein gehalten, denn die
  // vorhandenen Naturmodelle liegen bei ~29k Dreiecken je Instanz.
  giantTree: 0,
  bush: 8,
  rock: 8,
  boulder: 0,
  reed: 10,
  flower: 0,
  fieldRow: 0,
  deadwood: 6,
  dryShrub: 0,
  microGrass: 0,
};
