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

/**
 * Budget je Region und Proptyp. Die Werte sind bewusst PRO REGION definiert:
 * Ein Unlock erhöht nur die Gesamtzahl, verändert aber niemals die Auswahl
 * bereits sichtbarer Regionen. Insgesamt sind es rund 700 Instanzen je Region,
 * verteilt auf elf `InstancedMesh`-Gruppen (also konstante Draw-Calls).
 */
export const REGION_PROP_BUDGET = {
  pine: 120,
  broadleaf: 90,
  largePine: 45,
  bush: 95,
  rock: 110,
  reed: 95,
  flower: 70,
  fieldRow: 60,
  deadwood: 35,
  dryShrub: 60,
  microGrass: 90,
} as const;

export type PropKind = keyof typeof REGION_PROP_BUDGET;
