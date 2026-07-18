// Region-Definitionen der Insel (§ Welt 2.0 — organische Landschaften).
//
// Der Spieler schaltet keine Quadrate frei, sondern Landschaften: jede der 32
// gebackenen Regionen (tools/bake-report.md) bekommt hier Namen, Charakter,
// Vorteile (productionModifiers), Nachteile (roadCostFactor, Malus-Modifier)
// und Freischaltbedingungen. Die Geometrie/Nachbarschaft kommt aus
// `world/islandRegions.gen.ts` — `prerequisiteRegionIds` müssen eine Teilmenge
// der gebackenen Nachbarschaft sein (loadConfig erzwingt das).
//
// Kosten-Leitplanken: Nachbarn des Starts ~320–650k (L5–L9), zweiter Ring
// ~700k–1,2 M (L10–L14), Randküsten ~1,2–1,4 M (L14–L16), Hochgebirgskern
// 1,8 M (L18, nur über die Randgebirge) — Expansion ist eine strategische
// Entscheidung, kein Nebenbei-Klick. Boni/Mali ab Phase A4 wirtschaftswirksam.

import type { RegionDef } from './types.ts';

export const regionsConfig: RegionDef[] = [
  // ---- Das große Nordwest-Massiv --------------------------------------------
  // Kaum Baufläche, aber der wertvollste Stein-Standort der Insel. Bewusst das
  // Endgame-Ziel: teuer, spät, und nur wer die Randgebirge (Graue Zinnen +
  // Sturmspitzen) erschlossen hat, kommt hinein.
  { id: 1, nameKey: 'region.r1', biome: 'gebirge', unlockable: true, unlockLevel: 18, unlockCost: 1_800_000, prerequisiteRegionIds: [24, 25], buildableTiles: 346, productionModifiers: { stone: 1.8, food: 0.6 }, roadCostFactor: 2 },

  // ---- Startregion -----------------------------------------------------------
  // Lichtungen im zentralen Wald: bewusst NEUTRAL (keine Modifikatoren) — die
  // Heimatregion ist der ausgewogene Bezugspunkt, an dem sich die Boni/Mali der
  // Expansions-Landschaften messen (Wälder +40 % Holz, Fruchtdelta +35 %
  // Nahrung, Gebirge teure Straßen …). So lohnt sich Erschließung wirklich.
  { id: 2, nameKey: 'region.r2', biome: 'zentrum', unlockable: true, unlockLevel: 1, unlockCost: 0, buildableTiles: 5993 },

  // ---- Seenlandschaften ------------------------------------------------------
  { id: 3, nameKey: 'region.r3', biome: 'see', unlockable: true, unlockLevel: 11, unlockCost: 850_000, buildableTiles: 1324, productionModifiers: { water: 1.4, food: 1.1 } },
  { id: 21, nameKey: 'region.r21', biome: 'see', unlockable: true, unlockLevel: 11, unlockCost: 800_000, buildableTiles: 923, productionModifiers: { water: 1.3, wood: 1.1 } },

  // ---- Erster Ring um den Start ---------------------------------------------
  // Fruchtdelta: Tiefebene am Südsee — das Ackerland der Insel.
  { id: 4, nameKey: 'region.r4', biome: 'fruchtbar', unlockable: true, unlockLevel: 5, unlockCost: 320_000, buildableTiles: 4738, productionModifiers: { food: 1.35, water: 1.1 } },
  { id: 7, nameKey: 'region.r7', biome: 'ebene', unlockable: true, unlockLevel: 6, unlockCost: 380_000, buildableTiles: 4057, productionModifiers: { food: 1.1 } },
  { id: 10, nameKey: 'region.r10', biome: 'ebene', unlockable: true, unlockLevel: 7, unlockCost: 420_000, buildableTiles: 3452, productionModifiers: { food: 1.1 } },
  { id: 12, nameKey: 'region.r12', biome: 'ebene', unlockable: true, unlockLevel: 8, unlockCost: 480_000, buildableTiles: 3225, productionModifiers: { food: 1.1, wood: 1.1 } },
  { id: 27, nameKey: 'region.r27', biome: 'gebirge', unlockable: true, unlockLevel: 9, unlockCost: 650_000, buildableTiles: 624, productionModifiers: { stone: 1.5, food: 0.7 }, roadCostFactor: 1.6 },

  // ---- Wälder ----------------------------------------------------------------
  { id: 17, nameKey: 'region.r17', biome: 'wald', unlockable: true, unlockLevel: 8, unlockCost: 520_000, buildableTiles: 1942, productionModifiers: { wood: 1.5 } },
  { id: 11, nameKey: 'region.r11', biome: 'wald', unlockable: true, unlockLevel: 9, unlockCost: 600_000, buildableTiles: 3222, productionModifiers: { wood: 1.5 } },
  { id: 26, nameKey: 'region.r26', biome: 'wald', unlockable: true, unlockLevel: 10, unlockCost: 700_000, buildableTiles: 1415, productionModifiers: { wood: 1.4 } },
  { id: 22, nameKey: 'region.r22', biome: 'wald', unlockable: true, unlockLevel: 13, unlockCost: 1_000_000, buildableTiles: 1588, productionModifiers: { wood: 1.5 } },
  { id: 28, nameKey: 'region.r28', biome: 'wald', unlockable: true, unlockLevel: 15, unlockCost: 1_200_000, buildableTiles: 1143, productionModifiers: { wood: 1.4 } },

  // ---- Ebenen & Hügel des Ostens/Nordens ------------------------------------
  { id: 5, nameKey: 'region.r5', biome: 'ebene', unlockable: true, unlockLevel: 10, unlockCost: 750_000, buildableTiles: 4544, productionModifiers: { food: 1.2 } },
  { id: 13, nameKey: 'region.r13', biome: 'huegel', unlockable: true, unlockLevel: 10, unlockCost: 700_000, buildableTiles: 3039, productionModifiers: { stone: 1.2, energy: 1.15 } },
  { id: 20, nameKey: 'region.r20', biome: 'huegel', unlockable: true, unlockLevel: 11, unlockCost: 800_000, buildableTiles: 1389, productionModifiers: { stone: 1.25, energy: 1.15 } },
  { id: 19, nameKey: 'region.r19', biome: 'flusstal', unlockable: true, unlockLevel: 12, unlockCost: 850_000, buildableTiles: 1678, productionModifiers: { food: 1.3, water: 1.2 } },

  // ---- Küsten ----------------------------------------------------------------
  { id: 6, nameKey: 'region.r6', biome: 'kueste', unlockable: true, unlockLevel: 12, unlockCost: 950_000, buildableTiles: 3366, productionModifiers: { food: 1.15 } },
  { id: 14, nameKey: 'region.r14', biome: 'kueste', unlockable: true, unlockLevel: 12, unlockCost: 900_000, buildableTiles: 2889, productionModifiers: { food: 1.2 } },
  { id: 8, nameKey: 'region.r8', biome: 'kueste', unlockable: true, unlockLevel: 13, unlockCost: 1_050_000, buildableTiles: 3511, productionModifiers: { food: 1.2 } },
  { id: 9, nameKey: 'region.r9', biome: 'kueste', unlockable: true, unlockLevel: 14, unlockCost: 1_150_000, buildableTiles: 3403, productionModifiers: { food: 1.2 } },
  { id: 15, nameKey: 'region.r15', biome: 'kueste', unlockable: true, unlockLevel: 15, unlockCost: 1_250_000, buildableTiles: 2042, productionModifiers: { food: 1.15, water: 1.1 } },
  { id: 29, nameKey: 'region.r29', biome: 'kueste', unlockable: true, unlockLevel: 15, unlockCost: 1_250_000, buildableTiles: 949, productionModifiers: { food: 1.2 } },
  { id: 16, nameKey: 'region.r16', biome: 'kueste', unlockable: true, unlockLevel: 16, unlockCost: 1_350_000, buildableTiles: 1617, productionModifiers: { food: 1.15 } },
  { id: 30, nameKey: 'region.r30', biome: 'kueste', unlockable: true, unlockLevel: 16, unlockCost: 1_300_000, buildableTiles: 748, productionModifiers: { food: 1.15 } },

  // ---- Gebirgsränder ---------------------------------------------------------
  { id: 23, nameKey: 'region.r23', biome: 'gebirge', unlockable: true, unlockLevel: 12, unlockCost: 900_000, buildableTiles: 1095, productionModifiers: { stone: 1.5 }, roadCostFactor: 1.5 },
  { id: 24, nameKey: 'region.r24', biome: 'gebirge', unlockable: true, unlockLevel: 13, unlockCost: 1_000_000, buildableTiles: 356, productionModifiers: { stone: 1.5, food: 0.7 }, roadCostFactor: 1.7 },
  { id: 25, nameKey: 'region.r25', biome: 'gebirge', unlockable: true, unlockLevel: 14, unlockCost: 1_100_000, prerequisiteRegionIds: [20], buildableTiles: 173, productionModifiers: { stone: 1.7, food: 0.6 }, roadCostFactor: 2 },
  { id: 18, nameKey: 'region.r18', biome: 'gebirge', unlockable: true, unlockLevel: 14, unlockCost: 1_200_000, buildableTiles: 339, productionModifiers: { stone: 1.6, food: 0.7 }, roadCostFactor: 1.8 },
  { id: 31, nameKey: 'region.r31', biome: 'gebirge', unlockable: true, unlockLevel: 16, unlockCost: 1_400_000, buildableTiles: 503, productionModifiers: { stone: 1.6 }, roadCostFactor: 1.8 },

  // ---- Vorgelagerte Insel (Teaser) -------------------------------------------
  // Ohne Landverbindung — bewusst nie freischaltbar; am Horizont sichtbar als
  // Versprechen für spätere Inhalte (Hafen/Schiffe).
  { id: 32, nameKey: 'region.r32', biome: 'insel', unlockable: false, unlockLevel: 99, unlockCost: 0, buildableTiles: 705 },
];
