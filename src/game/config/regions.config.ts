// Region-Definitionen der Insel (§ Modelltreue 13.0/13.1).
//
// Quelle ist ausschließlich der deterministische Bake der Welt-GLB
// (`reference/world/new island 3d model.glb` → `tools/bakeWorld.mjs` →
// `world/islandRegions.gen.ts`). Geometrie, Bebaubarkeit, Land- und
// Seenachbarschaft kommen von dort; diese Config benennt die Landschaften und
// legt Progression, Kosten und Charakter fest.
//
// § MODELLTREUE 13.0 — WARUM ALLE IDS NEU SIND. Der Bake verändert das Gelände
// nicht mehr (0 von 233.287 Landknoten abweichend, vorher 67,6 %). Die Insel ist
// damit eine andere Landschaft als in 12.x: Küsten sind Klippen mit Terrassen
// statt planierter Strand, und die Biom-Cluster liegen anders. Die Segmentierung
// folgt dem Gelände — nicht umgekehrt.
//
// § MODELLTREUE 13.1 — DER MEERESSPIEGEL LIEGT AN DER TERRASSENKANTE. Das Wasser
// steht 4 m höher und schließt damit bündig mit der untersten flachen Ebene ab
// (gemessen: zwischen 0 und 3 m gab es nur 331 flache Kacheln — das ist die
// Klippenwand; bei 4–5 m liegen 14.073). Wirkung: 2×2-Anlegerplätze 20 → **344**,
// bebaubare Uferkacheln 129 → **759**, bei praktisch unveränderter Baufläche.
//
// NEUN Regionen, alle über Land erreichbar (die 13.0-Zwischenstufe hatte eine
// vorgelagerte Insel; der höhere Wasserstand schneidet die Landmasse anders).
// `requiresHarbor` ist deshalb nirgends gesetzt — das Flag beschreibt Regionen
// ganz ohne Landanschluss, und die gibt es nicht mehr.
//
// Die Rollen sind gemessen, nicht erfunden (Biomanteile aus dem Bake):
//
//   9  Gründerland  Start · 1.400 bebaubar · zentral · VIER Landnachbarn
//   7  Nordwald     (H)  · 42,7 % Wald — das dichteste Holzrevier der Insel
//   2  Westmark          · 6.496 bebaubar · SECHS Nachbarn — das Scharnier
//   1  Lagunenland  (W)  · 33,3 % Wasser · 3.310 Wald — Fischerei und Holz
//   4  Dünenküste   (F)  · 6.359 bebaubar · 524 Küstenkanten · 28,0 % Sand
//   6  Nordküste    (F)  · 5.137 bebaubar · 429 Küstenkanten · 935 fruchtbar
//   3  Ostterrassen (F)  · 5.750 bebaubar · 909 fruchtbar · Binnengewässer
//   8  Südhügel     (St) · 18,1 % Gebirge · Stein ohne die Härte des Massivs
//   5  Südmassiv    (St) · 83,4 % Gebirge · Endgame, Stein-Krone
//
// § 12.2 §2 bleibt gültig — DIE ERSTE ERWEITERUNG KOMMT AUF LEVEL 2. Der
// ausdrückliche Nutzerwunsch war „das direkt angrenzende Gebiet ab Level 2".
// Direkte Landnachbarn der Startregion sind 1, 2, 5 und 7. Der Nordwald (7) ist
// die ehrliche Wahl: kompakt genug für ein Geschenk (3.617 Bauflächen) und mit
// 42,7 % Wald genau der Engpass der Frühphase (Sägewerk, Active Operations).
// Zusammen mit `FREE_EXPANSION_LEVEL = 2` bekommt der Spieler ihn geschenkt.
//
// PROGRESSION FOLGT DEM RESSOURCENBEDARF: Nach dem Holzrevier öffnet die
// Westmark (L4) mit sechs Nachbarn die halbe Insel, das Lagunenland (L6) bringt
// Wasser und noch mehr Holz. Die Dünenküste (L8) ist die größte Baufläche der
// Insel UND ihr bester Hafenstandort (524 Küstenkanten). Danach folgen
// Nordküste, Ostterrassen, Südhügel und das Massiv als Stein-Krone.
//
// Die Kosten folgen dem dokumentierten Faktormodell in `regions/regionCost.ts`
// (§8 Regionswert) und werden dort gegen die Config getestet — es sind
// ausdrücklich keine frei gegriffenen Fantasiewerte, sondern der auf 5.000er
// gerundete Richtwert je Region.

import type { RegionDef } from './types.ts';

export const regionsConfig: RegionDef[] = [
  {
    // Startregion (Bake wählt & validiert sie): 1.400 Bauflächen, ΔH 0,12 über
    // dem Rathausblock, 20 Kacheln vom Inselschwerpunkt, vier Landnachbarn.
    id: 9,
    nameKey: 'region.r9',
    biome: 'zentrum',
    unlockable: true,
    unlockLevel: 1,
    unlockCost: 0,
    buildableTiles: 1400,
  },
  {
    // DIE ERSTE ERWEITERUNG, AB LEVEL 2 — und über `FREE_EXPANSION_LEVEL` die
    // kostenlose Erstwahl. Direkter Nordnachbar, 1.837 von 4.302 Kacheln Wald
    // (42,7 %): das dichteste Holzrevier und genau der Frühphasen-Engpass.
    id: 7,
    nameKey: 'region.r7',
    biome: 'wald',
    unlockable: true,
    unlockLevel: 2,
    unlockCost: 105_000,
    buildableTiles: 3617,
    productionModifiers: { wood: 1.45, food: 0.95 },
  },
  {
    // Das Scharnier der Insel: SECHS Landnachbarn (1/3/4/5/7/9) und 6.496
    // Bauflächen auf 66,9 % Gras. Wer sie hat, hat die Wahl.
    id: 2,
    nameKey: 'region.r2',
    biome: 'ebene',
    unlockable: true,
    unlockLevel: 4,
    unlockCost: 160_000,
    buildableTiles: 6496,
    productionModifiers: { food: 1.2, wood: 1.1, stone: 1.1 },
  },
  {
    // Lagunenland: 3.852 von 11.569 Kacheln Wasser (33,3 %) — die größte Region
    // der Insel, dazu 3.310 Waldkacheln. Wasser und Holz in einem Zug.
    id: 1,
    nameKey: 'region.r1',
    biome: 'see',
    unlockable: true,
    unlockLevel: 6,
    unlockCost: 310_000,
    buildableTiles: 6148,
    productionModifiers: { water: 1.45, wood: 1.2, food: 1.1 },
    roadCostFactor: 1.15,
  },
  {
    // Dünenküste: 6.359 Bauflächen — die größte nutzbare Fläche der Insel — mit
    // 524 Küstenkanten und 1.945 Sandkacheln. Der Hafenstandort schlechthin.
    // Über Land hängt sie allein an der Westmark (2).
    id: 4,
    nameKey: 'region.r4',
    biome: 'kueste',
    unlockable: true,
    unlockLevel: 8,
    unlockCost: 505_000,
    buildableTiles: 6359,
    productionModifiers: { food: 1.3, water: 1.25 },
  },
  {
    // Nordküste: 429 Küstenkanten, 935 fruchtbare und 1.265 Sandkacheln auf
    // 5.137 Bauflächen. Über Land nur über den Nordwald (7) erreichbar.
    id: 6,
    nameKey: 'region.r6',
    biome: 'fruchtbar',
    unlockable: true,
    unlockLevel: 11,
    unlockCost: 995_000,
    buildableTiles: 5137,
    productionModifiers: { food: 1.4, water: 1.15 },
  },
  {
    // Ostterrassen: 909 fruchtbare Kacheln, 1.370 Sand und ein eigenes
    // Binnengewässer (583 Wasser) auf 5.750 Bauflächen.
    id: 3,
    nameKey: 'region.r3',
    biome: 'flusstal',
    unlockable: true,
    unlockLevel: 14,
    unlockCost: 1_900_000,
    buildableTiles: 5750,
    productionModifiers: { food: 1.35, water: 1.3, wood: 0.95 },
  },
  {
    // Südhügel: 618 Gebirgskacheln (18,1 %) auf 3.406 Kacheln — Stein ohne die
    // Härte des Massivs. Über Lagunenland (1) oder Massiv (5) erreichbar.
    id: 8,
    nameKey: 'region.r8',
    biome: 'huegel',
    unlockable: true,
    unlockLevel: 17,
    unlockCost: 2_220_000,
    buildableTiles: 2108,
    productionModifiers: { stone: 1.35, wood: 1.1, food: 0.9 },
    roadCostFactor: 1.2,
  },
  {
    // Das Südmassiv: 5.648 von 6.771 Kacheln Gebirge (83,4 %) — der Berg aus dem
    // Modell. Nur 783 Bauflächen, dafür die Stein-Krone der Insel.
    id: 5,
    nameKey: 'region.r5',
    biome: 'gebirge',
    unlockable: true,
    unlockLevel: 20,
    unlockCost: 4_450_000,
    buildableTiles: 783,
    productionModifiers: { stone: 1.7, energy: 1.25, food: 0.7 },
    roadCostFactor: 1.5,
  },
];
