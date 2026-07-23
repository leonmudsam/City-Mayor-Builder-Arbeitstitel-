// Nachvollziehbarer Regionspreis (§ Final World Compaction 8.1 / §8).
//
// Der Auftrag verlangt ausdrücklich, dass Freischaltkosten NICHT als feste
// Fantasiewerte in der Config stehen, sondern aus dem tatsächlichen Wert einer
// Region folgen. Dieses Modul macht genau das nachvollziehbar: Es leitet aus den
// gebackenen Geodaten und der Regionsdefinition sechs benannte Faktoren und
// daraus einen Richtpreis ab. `tests/regionCost.test.ts` prüft, dass jeder in
// `regions.config.ts` eingetragene Preis innerhalb der Toleranz um diesen
// Richtwert liegt — die Config bleibt damit die eine Wahrheit, ist aber gegen
// willkürliche Zahlen abgesichert.
//
// Reine Domain-Logik: keine Renderer-, React- oder Zustandsabhängigkeit.

import type { RegionDef } from '../config/types.ts';
import { BAKED_REGIONS } from '../config/startRegion.config.ts';

/** Die sechs Preisfaktoren aus §8 des Auftrags. */
export interface RegionCostFactors {
  /** Nutzbare Baufläche gegenüber einer Durchschnittsregion. */
  buildableAreaFactor: number;
  /** Wert der Produktionsboni (Holz/Stein/Nahrung/Wasser/Energie). */
  resourceValueFactor: number;
  /** Erschließungsaufwand: Straßenkosten, Gebirge, Hafenpflicht. */
  infrastructureDifficultyFactor: number;
  /** Strategischer Zugang: Küste, Hafenpotenzial, Verkehrskorridor. */
  strategicAccessFactor: number;
  /** Seltenheit des Bioms in der Gesamtwelt. */
  biomeRarityFactor: number;
  /** Progressionsstufe — späte Regionen kosten überproportional. */
  progressionTierFactor: number;
}

/** Referenz-Baufläche einer „durchschnittlichen" Region der final verdichteten Insel. */
const AVERAGE_BUILDABLE = 2_600;
/** Grundpreis, auf den alle Faktoren multiplikativ wirken. */
const BASE_COST = 78_000;
/** Küstenkacheln, ab denen eine Region als vollwertiger Hafenstandort gilt. */
const STRATEGIC_COAST_TILES = 300;
/** Preiswachstum je Level oberhalb der ersten Erweiterung (§7.3-Korridor). */
const PROGRESSION_PER_LEVEL = 1.255;

/**
 * Bewertet den Produktionsvorteil einer Region. Ein Bonus über 1 erhöht den
 * Preis, ein bewusster Malus (Gebirge: wenig Nahrung) senkt ihn wieder — die
 * Region ist dann zwar stark, aber einseitig.
 */
function resourceValue(def: RegionDef): number {
  const modifiers = def.productionModifiers ?? {};
  let value = 1;
  for (const factor of Object.values(modifiers)) {
    if (factor === undefined) continue;
    value += (factor - 1) * 0.45;
  }
  return Math.max(0.6, value);
}

/**
 * Seltene Biome sind wertvoller als „noch eine Wiese". Die Werte spiegeln die
 * tatsächliche Verteilung der 13 Regionen wider.
 */
const BIOME_RARITY: Record<RegionDef['biome'], number> = {
  zentrum: 1,
  ebene: 0.95,
  wald: 1,
  huegel: 1.05,
  kueste: 1.1,
  flusstal: 1.15,
  see: 1.15,
  fruchtbar: 1.2,
  insel: 1.25,
  gebirge: 1.3,
};

/** Leitet die sechs Faktoren einer Region aus Bake-Daten und Definition ab. */
export function regionCostFactors(def: RegionDef): RegionCostFactors {
  const baked = BAKED_REGIONS[def.id - 1];
  const buildable = def.buildableTiles;
  const coastTiles = baked?.coastTiles ?? 0;

  // Baufläche wirkt gedämpft: Eine doppelt so große Region ist wertvoll, aber
  // nicht doppelt so teuer — sonst wären große Ebenen unbezahlbar.
  const buildableAreaFactor = 0.55 + 0.45 * Math.sqrt(Math.max(0, buildable) / AVERAGE_BUILDABLE);

  const resourceValueFactor = resourceValue(def);

  // Teure Erschließung senkt den KAUFPREIS (der Aufwand kommt später on top).
  const roadPenalty = (def.roadCostFactor ?? 1) - 1;
  const harborPenalty = def.requiresHarbor ? 0.12 : 0;
  const infrastructureDifficultyFactor = Math.max(0.7, 1 - roadPenalty * 0.22 - harborPenalty);

  // Küste und Seezugang sind strategisch wertvoll (Handel, Schifffahrt).
  const strategicAccessFactor =
    1 + Math.min(0.25, coastTiles / STRATEGIC_COAST_TILES * 0.12) + (def.requiresHarbor ? 0.08 : 0);

  const biomeRarityFactor = BIOME_RARITY[def.biome];

  // Progressionsstufe: Der Preis muss mit der Wirtschaft mitwachsen, sonst ist
  // eine späte Region trivial. Der Faktor wächst geometrisch ab Level 3 und ist
  // so kalibriert, dass die Endgame-Region über 17 Level im Auftragskorridor
  // §7.3 (5,5–8 Mio.) landet, ohne die mittleren Stufen unbezahlbar zu machen.
  const progressionTierFactor = Math.pow(PROGRESSION_PER_LEVEL, Math.max(0, def.unlockLevel - 3));

  return {
    buildableAreaFactor,
    resourceValueFactor,
    infrastructureDifficultyFactor,
    strategicAccessFactor,
    biomeRarityFactor,
    progressionTierFactor,
  };
}

/**
 * Richtpreis einer Region aus ihren Faktoren. Die Startregion (unlockLevel 1)
 * ist per Definition kostenlos.
 */
export function derivedRegionCost(def: RegionDef): number {
  if (def.unlockLevel <= 1) return 0;
  const f = regionCostFactors(def);
  const raw =
    BASE_COST *
    f.buildableAreaFactor *
    f.resourceValueFactor *
    f.infrastructureDifficultyFactor *
    f.strategicAccessFactor *
    f.biomeRarityFactor *
    f.progressionTierFactor;
  // Auf 5.000er runden — Preise sollen lesbar bleiben.
  return Math.round(raw / 5_000) * 5_000;
}
