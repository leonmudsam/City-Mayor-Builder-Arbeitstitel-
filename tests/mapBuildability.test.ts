// § Map Flattening + Buildability Overhaul — Phase E (Auftrag 28.07.2026,
// `docs/agents/MAP_FLATTENING_AND_BUILDABILITY_PLAN.md`).
//
// Diese Suite läuft bewusst auf ECHTEM gebackenem Inselgelände: KEIN
// `flattenTerrain`, keine Terrain-Overrides. Die anderen Suiten glätten die
// Startregion, um Gameplay deterministisch zu testen — genau dadurch würden sie
// den Punkt dieses Auftrags verfehlen. Hier wird geprüft, ob die reale Karte
// bespielbar ist.
//
// Konkrete Kachelkoordinaten werden NICHT hartkodiert: die Suite sucht das
// jeweilige Gelände (Hang, Küste, Flussufer, Gebirgsrand, Plateau …) im Bake und
// prüft dort. Ein späterer Rebake verschiebt damit keine Tests, solange die
// Karte die geforderten Eigenschaften noch hat.

import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/game/config/index.ts';
import { createNewGame } from '../src/game/newGame.ts';
import { GameController } from '../src/game/commands/controller.ts';
import { recomputeDerived } from '../src/game/simulation/derived.ts';
import { validatePlacement } from '../src/game/buildings/placement.ts';
import {
  FOOTPRINT_HEIGHT_BUDGET_MAX,
  GROUND_ROAD_MAX_SLOPE,
  footprintHeightBudget,
  minimumBuildableRatio,
  plinthDepthFor,
} from '../src/game/buildings/terrainFit.ts';
import { samplePlacementSurface } from '../src/game/map/world.ts';
import { bakedSurfaceAt, regionIdAt, terrainAt, WORLD_TILES } from '../src/game/config/startRegion.config.ts';
import { BUILDABLE_BIT, buildabilityGrid } from '../src/game/config/world/islandBuildability.gen.ts';
import type { BuildingDef } from '../src/game/config/types.ts';
import type { GameState } from '../src/game/types.ts';

/** Controller auf ECHTEM Inselgelände mit allen Regionen freigeschaltet. */
function realWorldController() {
  const config = loadConfig();
  const state = createNewGame(config, 'Gelaendetest', 1_700_000_000_000);
  for (const region of Object.values(state.world.regions)) region.status = 'unlocked';
  state.level.current = 20;
  const controller = new GameController(config, state);
  controller.derived = recomputeDerived(state, config);
  return controller;
}

const surfaceAt = (x: number, y: number) => bakedSurfaceAt(x, y);

/** Die starre Höhendelta-Grenze, die bis v1.10 für JEDE Gebäudegröße galt. */
const OLD_FIXED_HEIGHT_LIMIT = 0.85;

/** Erste Kachel im Bake, die `match` erfüllt (deterministische Reihenfolge). */
function findTile(match: (x: number, y: number) => boolean): { x: number; y: number } | undefined {
  for (let y = 2; y < WORLD_TILES - 8; y++) {
    for (let x = 2; x < WORLD_TILES - 8; x++) {
      if (match(x, y)) return { x, y };
    }
  }
  return undefined;
}

/** Alle Kacheln, die `match` erfüllen (für Abdeckungs-Kennzahlen). */
function countTiles(match: (x: number, y: number) => boolean): number {
  let total = 0;
  for (let y = 2; y < WORLD_TILES - 8; y++) {
    for (let x = 2; x < WORLD_TILES - 8; x++) if (match(x, y)) total++;
  }
  return total;
}

/** Footprint liegt vollständig auf Land derselben freigeschalteten Region. */
function footprintOnLand(x: number, y: number, size: number): boolean {
  const region = regionIdAt(x, y);
  if (region === 0) return false;
  for (let dy = 0; dy < size; dy++) {
    for (let dx = 0; dx < size; dx++) {
      const terrain = terrainAt(x + dx, y + dy);
      if (terrain === 'water' || terrain === 'river' || terrain === 'mountain') return false;
      if (regionIdAt(x + dx, y + dy) !== region) return false;
    }
  }
  return true;
}

function def(controller: GameController, id: string): BuildingDef {
  const found = controller.config.buildings.get(id);
  if (!found) throw new Error(`Gebäude ${id} fehlt in der Config`);
  return found;
}

function place(controller: GameController, id: string, x: number, y: number) {
  return validatePlacement(controller.state, controller.config, controller.derived, def(controller, id), x, y);
}

/**
 * Erste Stelle im Bake, an der `id` gebaut werden kann UND das Gelände die
 * gesuchte Eigenschaft hat. Gibt Position + Oberflächenprobe zurück, damit der
 * Test die Eigenschaft mitprüfen kann (statt nur „irgendwo hat es geklappt").
 */
function findPlaceable(
  controller: GameController,
  id: string,
  terrainWanted: (x: number, y: number) => boolean,
) {
  const buildingDef = def(controller, id);
  const size = Math.max(buildingDef.size.w, buildingDef.size.h);
  const spot = findTile((x, y) =>
    footprintOnLand(x, y, size)
    && terrainWanted(x, y)
    && place(controller, id, x, y) === undefined);
  if (!spot) return undefined;
  return {
    ...spot,
    surface: samplePlacementSurface(controller.state, spot.x, spot.y, buildingDef.size.w, buildingDef.size.h),
  };
}

const maxSlopeIn = (x: number, y: number, size: number): number => {
  let slope = 0;
  for (let dy = 0; dy < size; dy++) {
    for (let dx = 0; dx < size; dx++) slope = Math.max(slope, surfaceAt(x + dx, y + dy).slope);
  }
  return slope;
};

const touchesMountain = (x: number, y: number, size: number): boolean => {
  for (let dy = -2; dy <= size + 1; dy++) {
    for (let dx = -2; dx <= size + 1; dx++) {
      if (terrainAt(x + dx, y + dy) === 'mountain') return true;
    }
  }
  return false;
};

const touchesTerrainNear = (x: number, y: number, size: number, wanted: string, reach = 2): boolean => {
  for (let dy = -reach; dy <= size + reach - 1; dy++) {
    for (let dx = -reach; dx <= size + reach - 1; dx++) {
      if (terrainAt(x + dx, y + dy) === wanted) return true;
    }
  }
  return false;
};

describe('Map Flattening — Geländeregeln (Phase C)', () => {
  it('staffelt das Höhenbudget nach Kantenlänge und deckelt es', () => {
    expect(footprintHeightBudget(1, 1)).toBeCloseTo(0.85, 5);
    expect(footprintHeightBudget(3, 3)).toBeGreaterThan(footprintHeightBudget(2, 2));
    expect(footprintHeightBudget(4, 4)).toBeGreaterThan(footprintHeightBudget(3, 3));
    // Gedeckelt: der Sockel darf nie zum Turm werden (§8 des Auftrags).
    expect(footprintHeightBudget(9, 9)).toBe(FOOTPRINT_HEIGHT_BUDGET_MAX);
    // Rechteckige Footprints richten sich nach der LÄNGEREN Kante.
    expect(footprintHeightBudget(1, 4)).toBe(footprintHeightBudget(4, 4));
  });

  it('verlangt bei einer Einzelkachel weiterhin volle Bebaubarkeit', () => {
    expect(minimumBuildableRatio(1, 1)).toBe(1);
    expect(minimumBuildableRatio(3, 3)).toBeLessThan(1);
    // Ein 3×3 darf höchstens zwei seiner neun Kacheln „danebenliegen" haben.
    expect(Math.floor(9 * (1 - minimumBuildableRatio(3, 3)))).toBe(2);
  });

  it('gibt einen Sockel zurück, der jedes zulässige Höhendelta abdeckt', () => {
    expect(plinthDepthFor(0)).toBeGreaterThan(0);
    expect(plinthDepthFor(FOOTPRINT_HEIGHT_BUDGET_MAX)).toBeGreaterThanOrEqual(FOOTPRINT_HEIGHT_BUDGET_MAX);
    // Monoton: mehr Höhenunterschied ⇒ nie ein flacherer Sockel.
    expect(plinthDepthFor(1.5)).toBeGreaterThan(plinthDepthFor(0.5));
  });
});

describe('Map Flattening — Gebäude auf echtem Inselgelände (Phase E §7)', () => {
  const controller = realWorldController();

  it('kleines Haus am leichten Hang', () => {
    const spot = findPlaceable(controller, 'house_small', (x, y) => {
      const size = Math.max(def(controller, 'house_small').size.w, def(controller, 'house_small').size.h);
      return maxSlopeIn(x, y, size) >= 0.35;
    });
    expect(spot).toBeDefined();
    expect(spot!.surface.maxHeight - spot!.surface.minHeight).toBeGreaterThan(0);
  });

  it('Sägewerk (4×4) am Waldrand mit Neigung', () => {
    const spot = findPlaceable(controller, 'sawmill', (x, y) =>
      touchesTerrainNear(x, y, 4, 'forest', 3) && maxSlopeIn(x, y, 4) >= 0.3);
    expect(spot).toBeDefined();
    const delta = spot!.surface.maxHeight - spot!.surface.minHeight;
    expect(delta).toBeLessThanOrEqual(footprintHeightBudget(4, 4));
  });

  it('baut große Footprints auf Hängen, die die alte Pauschalgrenze 0,85 verboten hat', () => {
    // Der Kern von §4.2: ein gleichmäßig geneigter, sonst einwandfreier
    // Bauplatz war früher allein wegen des starren Höhendeltas gesperrt.
    // Ohne das gestaffelte Budget (Phase C2) findet dieser Test nichts.
    for (const id of ['market', 'sawmill'] as const) {
      const size = Math.max(def(controller, id).size.w, def(controller, id).size.h);
      const spot = findPlaceable(controller, id, (x, y) => {
        const surface = samplePlacementSurface(controller.state, x, y, size, size);
        return surface.maxHeight - surface.minHeight > OLD_FIXED_HEIGHT_LIMIT;
      });
      expect(spot, `${id} auf geneigtem Bauplatz`).toBeDefined();
      expect(spot!.surface.maxHeight - spot!.surface.minHeight).toBeGreaterThan(OLD_FIXED_HEIGHT_LIMIT);
    }
  });

  it('toleriert einzelne nicht markierte Kacheln im Footprint', () => {
    // §4.2/C1: Das Bebaubar-Bit ist eine Kachel-Klassifikation mit erodiertem
    // Rand. Ein 3×3 mit genau EINER solchen Randkachel muss stehen dürfen.
    const spot = findPlaceable(controller, 'market', (x, y) => {
      let missing = 0;
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) if (!surfaceAt(x + dx, y + dy).buildable) missing++;
      }
      return missing >= 1;
    });
    expect(spot).toBeDefined();
    expect(spot!.surface.buildableRatio).toBeLessThan(1);
  });

  it('Gebäude am Gebirgsrand', () => {
    const spot = findPlaceable(controller, 'house_small', (x, y) =>
      touchesMountain(x, y, Math.max(def(controller, 'house_small').size.w, def(controller, 'house_small').size.h)));
    expect(spot).toBeDefined();
    // Das Gebäude steht NEBEN dem Fels, nicht darauf.
    expect(spot!.surface.cliffOverlap).toBe(0);
  });

  it('Markt (3×3) in Küstennähe', () => {
    const spot = findPlaceable(controller, 'market', (x, y) => touchesTerrainNear(x, y, 3, 'water', 3));
    expect(spot).toBeDefined();
    expect(spot!.surface.waterOverlap).toBe(0);
  });

  it('Gebäude am Strand', () => {
    const spot = findPlaceable(controller, 'house_small', (x, y) => terrainAt(x, y) === 'sand');
    expect(spot).toBeDefined();
  });

  it('Gebäude in der Küstenebene', () => {
    const spot = findPlaceable(controller, 'market', (x, y) =>
      touchesTerrainNear(x, y, 3, 'water', 6) && surfaceAt(x, y).height < 2.5);
    expect(spot).toBeDefined();
  });

  it('Gebäude am Flussufer', () => {
    const spot = findPlaceable(controller, 'house_small', (x, y) => touchesTerrainNear(x, y, 1, 'river', 2));
    expect(spot).toBeDefined();
  });

  it('Gebäude auf einem Plateau (erhöht und eben)', () => {
    const spot = findPlaceable(controller, 'market', (x, y) =>
      surfaceAt(x, y).height > 6 && maxSlopeIn(x, y, 3) <= 0.3);
    expect(spot).toBeDefined();
    expect(spot!.surface.minHeight).toBeGreaterThan(5);
  });

  it('Anleger am Wasser', () => {
    // `dock_small` hat einen Waterfront-Footprint: Landseite + geprüfte
    // Wassertiefe. Er muss an mindestens einer Uferstelle der Insel passen.
    const dockDef = def(controller, 'dock_small');
    const size = Math.max(dockDef.size.w, dockDef.size.h);
    const spot = findTile((x, y) => {
      if (!footprintOnLand(x, y, size)) return false;
      if (!surfaceAt(x, y).waterfront) return false;
      for (const rotation of [0, 90, 180, 270] as const) {
        const reason = validatePlacement(
          controller.state, controller.config, controller.derived, dockDef, x, y, { rotation },
        );
        if (reason === undefined || reason === 'needs_road') return true;
      }
      return false;
    });
    expect(spot).toBeDefined();
  });

  it('findet in jeder freigeschalteten Region mindestens einen 3×3-Bauplatz', () => {
    const perRegion = new Map<number, number>();
    for (let y = 2; y < WORLD_TILES - 8; y++) {
      for (let x = 2; x < WORLD_TILES - 8; x++) {
        const region = regionIdAt(x, y);
        if (region === 0 || perRegion.get(region) !== undefined) continue;
        if (place(controller, 'market', x, y) !== undefined) continue;
        perRegion.set(region, 1);
      }
    }
    const missing: number[] = [];
    for (const region of Object.keys(controller.state.world.regions).map(Number)) {
      if (!perRegion.has(region)) missing.push(region);
    }
    expect(missing).toEqual([]);
  });
});

describe('Map Flattening — Straßen auf echtem Gelände (Phase E §7)', () => {
  const controller = realWorldController();

  const roadFits = (x: number, y: number): boolean => {
    const reason = place(controller, 'road', x, y);
    return reason === undefined || reason === 'needs_road';
  };

  it('Bodenstraße nimmt denselben Hang wie ein Gebäude', () => {
    // Vor dem Auftrag lag die Straßengrenze (0,8) UNTER der Bebaubar-Schwelle:
    // es gab Kacheln, auf denen ein Haus stehen durfte, das keine Straße
    // erreichen konnte. Diese Lücke darf es nicht mehr geben.
    // Geprüft wird ausschließlich die GELÄNDE-Ablehnung: `occupied` (z. B. das
    // Rathaus) oder `needs_road` sind legitime, nicht geländebedingte Gründe.
    const orphan = findTile((x, y) =>
      (buildabilityGrid[y * WORLD_TILES + x]! & BUILDABLE_BIT) !== 0
      && terrainAt(x, y) !== 'water' && terrainAt(x, y) !== 'river' && terrainAt(x, y) !== 'mountain'
      && regionIdAt(x, y) !== 0
      && place(controller, 'road', x, y) === 'terrain');
    expect(orphan).toBeUndefined();
  });

  it('deckt mit GROUND_ROAD_MAX_SLOPE den gesamten bebaubaren Hangbereich ab', () => {
    // Der Bake deckelt die Bebaubar-Maske auf denselben Wert. Läuft einer der
    // beiden Werte weg, entstehen wieder Bauplätze ohne Anschlussmöglichkeit.
    let steepestBuildable = 0;
    for (let y = 0; y < WORLD_TILES; y++) {
      for (let x = 0; x < WORLD_TILES; x++) {
        const surface = surfaceAt(x, y);
        if (surface.buildable) steepestBuildable = Math.max(steepestBuildable, surface.slope);
      }
    }
    expect(steepestBuildable).toBeLessThanOrEqual(GROUND_ROAD_MAX_SLOPE);
  });

  it('Straße am Hang', () => {
    const spot = findTile((x, y) => surfaceAt(x, y).slope >= 0.6 && roadFits(x, y));
    expect(spot).toBeDefined();
  });

  it('Straße bis an die Küste', () => {
    const spot = findTile((x, y) => surfaceAt(x, y).shoreType === 'coast' && roadFits(x, y));
    expect(spot).toBeDefined();
  });

  it('Straße am Flussufer entlang', () => {
    const spot = findTile((x, y) => {
      if (surfaceAt(x, y).shoreType !== 'riverbank') return false;
      // „Entlang" heißt: zwei aufeinanderfolgende Uferkacheln tragen die Straße.
      return roadFits(x, y) && (roadFits(x + 1, y) || roadFits(x, y + 1));
    });
    expect(spot).toBeDefined();
  });

  it('Straße erreicht eine leicht erhöhte Terrasse', () => {
    const spot = findTile((x, y) =>
      surfaceAt(x, y).height > 4 && surfaceAt(x, y).slope >= 0.4 && roadFits(x, y));
    expect(spot).toBeDefined();
  });
});

describe('Map Flattening — Kennzahl-Regression (Phase E)', () => {
  // Diese Zahlen sind der eigentliche Schutz des Auftrags: sie halten den
  // gewonnenen Bauraum fest, damit eine spätere Änderung ihn nicht unbemerkt
  // wieder verliert. Die Ausgangswerte stehen im Audit (A.3 des Plans).
  const isLand = (x: number, y: number) => {
    const terrain = terrainAt(x, y);
    return terrain !== 'water' && terrain !== 'river';
  };

  it('markiert deutlich mehr Land als bebaubar als vor dem Auftrag', () => {
    const land = countTiles(isLand);
    const buildable = countTiles((x, y) => isLand(x, y) && surfaceAt(x, y).buildable);
    // Vorher: 45,2 % des Landes. Ziel: klare Mehrheit.
    expect(buildable / land).toBeGreaterThan(0.6);
  });

  it('hat die verstreuten Streu-Gebirgskacheln im Tiefland beseitigt', () => {
    // Vorher: 1.647 „Gebirgs"-Kacheln unter Höhe 4 — reine Hang-Artefakte, die
    // Gebäude und Bodenstraßen blockierten und mit dem Massiv nichts zu tun haben.
    const lowMountain = countTiles((x, y) => terrainAt(x, y) === 'mountain' && surfaceAt(x, y).height < 4);
    expect(lowMountain).toBeLessThan(200);
  });

  it('hält das zentrale Massiv als Highlight unangetastet', () => {
    // Vorher: 5.745 Kacheln in 13–25 und 1.236 über 25. Beides muss bleiben —
    // §8 verbietet ausdrücklich, das Gebirge kleinzumachen.
    const massif = countTiles((x, y) => surfaceAt(x, y).height >= 13);
    const highPeaks = countTiles((x, y) => surfaceAt(x, y).height >= 25);
    expect(massif).toBeGreaterThan(5_000);
    expect(highPeaks).toBeGreaterThan(1_000);
  });

  it('macht Küsten und Ufer flacher statt steiler', () => {
    const gentle = countTiles((x, y) => {
      const shore = surfaceAt(x, y).shoreType;
      return shore === 'coast' || shore === 'riverbank' || shore === 'lakeshore';
    });
    const cliff = countTiles((x, y) => surfaceAt(x, y).shoreType === 'cliff');
    // Vorher: 1.453 flach gegen 1.937 Steilküste — die Küste war mehrheitlich
    // Klippe. Jetzt muss das flache Ufer die klare Mehrheit sein.
    expect(gentle).toBeGreaterThan(cliff * 1.5);
  });

  it('lässt sichtbares Relief bestehen (nicht steril eingeebnet)', () => {
    // Gegenprobe zu §8: die Insel darf nicht flachgebügelt sein.
    const land = countTiles(isLand);
    const rolling = countTiles((x, y) => isLand(x, y) && surfaceAt(x, y).slope > 0.3);
    expect(rolling / land).toBeGreaterThan(0.25);
  });
});

describe('Map Flattening — Platzierung bleibt ehrlich', () => {
  const controller = realWorldController();
  const state: GameState = controller.state;

  it('lehnt Wasser, Fluss und Fels weiterhin ab', () => {
    const water = findTile((x, y) => terrainAt(x, y) === 'water');
    const river = findTile((x, y) => terrainAt(x, y) === 'river');
    const rock = findTile((x, y) => terrainAt(x, y) === 'mountain' && surfaceAt(x, y).height > 20);
    expect(place(controller, 'house_small', water!.x, water!.y)).toBeDefined();
    expect(place(controller, 'house_small', river!.x, river!.y)).toBeDefined();
    expect(place(controller, 'house_small', rock!.x, rock!.y)).toBeDefined();
  });

  it('lehnt einen Footprint ab, der das Höhenbudget wirklich sprengt', () => {
    const steep = findTile((x, y) => {
      if (!footprintOnLand(x, y, 3)) return false;
      const surface = samplePlacementSurface(state, x, y, 3, 3);
      return surface.maxHeight - surface.minHeight > footprintHeightBudget(3, 3) + 0.4;
    });
    expect(steep).toBeDefined();
    expect(place(controller, 'market', steep!.x, steep!.y)).toBe('terrain');
  });

  it('lehnt in gesperrter Region weiterhin ab', () => {
    const locked = createNewGame(controller.config, 'Gesperrt', 1_700_000_000_000);
    const lockedController = new GameController(controller.config, locked);
    lockedController.state.level.current = 20;
    lockedController.derived = recomputeDerived(locked, controller.config);
    // Gesucht ist eine Kachel, an der AUSSCHLIESSLICH die Region im Weg steht:
    // sonst würde der Test je nach Prüfreihenfolge auch auf 'terrain' anspringen.
    const outside = findTile((x, y) => {
      const region = regionIdAt(x, y);
      if (region === 0 || locked.world.regions[String(region)]?.status === 'unlocked') return false;
      return place(controller, 'house_small', x, y) === undefined;
    });
    expect(outside).toBeDefined();
    expect(validatePlacement(
      locked, controller.config, lockedController.derived,
      def(controller, 'house_small'), outside!.x, outside!.y,
    )).toBe('region_locked');
  });
});
