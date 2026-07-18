import { describe, expect, it } from 'vitest';
import { nearTownHall, newController, T0 } from './helpers.ts';
import {
  REGION_COUNT,
  regionIdAt,
  startRegionConfig,
  terrainAt,
} from '../src/game/config/startRegion.config.ts';
import { exportSave, importSave } from '../src/game/storage/exportImport.ts';
import {
  consumeMigrationNotice,
  LegacyWorldSaveError,
  migrateAndValidate,
  SaveValidationError,
} from '../src/game/storage/migrations.ts';

// Schema v11 (§ Welt 2.0 + Gebäudesystem 2.0): Regionen sind schlanke Stubs,
// Terrain wird nie persistiert. Saves ≤ v9 stammen aus der Vor-Insel-Welt und
// sind bewusst NICHT migrierbar (LegacyWorldSaveError → Backup + Neustart im
// Adapter, docs/SAVE_MIGRATION.md); v10 wird per echter Migration übernommen
// (Sektoren→Regionen, Rathaus-Umzug, 100 %-Erstattung zu ALTEN Preisen).

describe('save/load (v11 Insel-Welt, Regionen)', () => {
  it('round-trips a live game through export/import', () => {
    const { controller } = newController();
    const r = nearTownHall(5, 5);
    const h = nearTownHall(3, 6);
    expect(controller.placeBuilding('road', r.x, r.y).ok).toBe(true);
    controller.placeBuilding('house_small', h.x, h.y);
    controller.update(T0 + 5 * 60_000);
    const json = exportSave(controller.state);
    const restored = importSave(json);
    expect(restored).toEqual(JSON.parse(JSON.stringify(controller.state)));
  });

  it('keeps saves slim: no tile arrays, region stubs only', () => {
    // flatten:false — die Test-Glättung schreibt sonst tausende Overrides in den Save.
    const { controller } = newController(undefined, { flatten: false });
    const raw = JSON.parse(exportSave(controller.state)) as {
      world: { regions: Record<string, { tiles?: unknown }> };
    };
    const regions = Object.values(raw.world.regions);
    expect(regions.length).toBe(REGION_COUNT);
    expect(regions.every((s) => s.tiles === undefined)).toBe(true);
    // Der gesamte Save bleibt klein (früher: >500 KB Kachel-Arrays).
    expect(exportSave(controller.state).length).toBeLessThan(50_000);
  });

  it('persists sparse terrain overrides (debug/tests) through save/load', () => {
    const { controller } = newController();
    const p = nearTownHall(5, 5);
    controller.state.world.terrainOverrides = { [`${p.x},${p.y}`]: 'river' };
    const restored = importSave(exportSave(controller.state));
    expect(restored.world.terrainOverrides?.[`${p.x},${p.y}`]).toBe('river');
  });

  it('rejects corrupt saves instead of silently resetting', () => {
    expect(() => importSave('{"schemaVersion": 10, "meta": "broken"}')).toThrow(SaveValidationError);
    expect(() => migrateAndValidate(null)).toThrow(SaveValidationError);
    expect(() => migrateAndValidate({ schemaVersion: 99 })).toThrow(SaveValidationError);
  });

  it('flags pre-island saves (≤ v9) as legacy world instead of migrating', () => {
    // Jede Vor-Insel-Version wirft den spezifischen Legacy-Fehler, den der
    // Storage-Adapter in Backup + Neustart übersetzt.
    for (const version of [1, 5, 9]) {
      let caught: unknown;
      try {
        migrateAndValidate({ schemaVersion: version });
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(LegacyWorldSaveError);
      expect((caught as LegacyWorldSaveError).version).toBe(version);
    }
  });
});

// ---- v10 → v11 (§ Ausbaustufe 2.0, docs/SAVE_MIGRATION.md) -----------------

/* eslint-disable @typescript-eslint/no-explicit-any -- v10-Rohsaves haben kein v11-Typmodell */

/** Alte v10-Startlage (Sektor (2,3) der 6×6-Welt, Rathaus 3×3 @ (157,221)). */
const V10_TOWN_HALL = { x: 157, y: 221 };

/**
 * Baut einen strukturell vollständigen v10-Rohsave aus einem frischen
 * v11-Spielstand: Regionen → 36 Quadrat-Sektoren zurückverwandelt, Rathaus an
 * den alten Platz, Startstraßen entfernt (kein Störfaktor für exakte
 * Erstattungs-Prüfungen).
 */
function makeV10Save(mutate?: (raw: any) => void): any {
  const { controller } = newController(undefined, { flatten: false });
  const raw = JSON.parse(exportSave(controller.state)) as any;
  raw.schemaVersion = 10;
  delete raw.world.regions;
  const sectors: Record<string, unknown> = {};
  for (let sy = 0; sy < 6; sy++) {
    for (let sx = 0; sx < 6; sx++) {
      const id = `s${sx}_${sy}`;
      sectors[id] = { id, sx, sy, districtId: 'main', status: sx === 2 && sy === 3 ? 'unlocked' : 'locked' };
    }
  }
  raw.world.sectors = sectors;
  raw.stats.sectorsUnlocked = 0;
  delete raw.stats.regionsUnlocked;
  raw.buildings['b_townhall'].x = V10_TOWN_HALL.x;
  raw.buildings['b_townhall'].y = V10_TOWN_HALL.y;
  for (const id of Object.keys(raw.buildings)) {
    if (id.startsWith('b_startroad_')) delete raw.buildings[id];
  }
  mutate?.(raw);
  return raw;
}

/** Erste rein-grasige Fläche in der Startregion südlich des Rathaus-Blocks. */
function findGrassArea(w: number, h: number, fromY = startRegionConfig.townHall.y + 9): { x: number; y: number } {
  const th = startRegionConfig.townHall;
  for (let y = fromY; y < fromY + 80; y++) {
    for (let x = th.x - 40; x < th.x + 40; x++) {
      let ok = true;
      for (let dy = 0; dy < h && ok; dy++) {
        for (let dx = 0; dx < w && ok; dx++) {
          if (regionIdAt(x + dx, y + dy) !== startRegionConfig.startRegionId || terrainAt(x + dx, y + dy) !== 'grass') {
            ok = false;
          }
        }
      }
      if (ok) return { x, y };
    }
  }
  throw new Error(`kein ${w}×${h}-Gras-Testareal gefunden`);
}

describe('migration v10 → v11 (Ausbaustufe 2.0)', () => {
  it('moves the town hall to the new bake start and replaces sectors with regions', () => {
    const save = migrateAndValidate(makeV10Save());
    const th = save.buildings['b_townhall']!;
    expect({ x: th.x, y: th.y }).toEqual(startRegionConfig.townHall);
    expect(Object.keys(save.world.regions).length).toBe(REGION_COUNT);
    expect((save.world as any).sectors).toBeUndefined();
    expect(save.world.regions[String(startRegionConfig.startRegionId)]?.status).toBe('unlocked');
    // Die 5 gebackenen Startstraßen wurden als Gratis-Vorplatz ergänzt.
    const roads = Object.values(save.buildings).filter((b) => b.defId === 'road');
    expect(roads.length).toBe(startRegionConfig.startRoads.length);
    // Buchhaltung: Zähler passt zu den tatsächlich freigeschalteten Regionen.
    const unlocked = Object.values(save.world.regions).filter((r) => r.status === 'unlocked').length;
    expect(save.stats.regionsUnlocked).toBe(unlocked - 1); // Startregion zählt nicht
    const notice = consumeMigrationNotice();
    expect(notice?.fromVersion).toBe(10);
    expect(notice?.removedBuildings).toBe(0);
    expect(consumeMigrationNotice()).toBeUndefined(); // einmalig
  });

  it('refunds removed defs (house_row/apartment) at 100 % of the OLD prices', () => {
    const raw = makeV10Save((r) => {
      r.buildings['b_row'] = { id: 'b_row', defId: 'house_row', x: 150, y: 220, upgradeLevel: 1, status: 'active' };
      r.buildings['b_apt'] = { id: 'b_apt', defId: 'apartment', x: 140, y: 210, upgradeLevel: 0, status: 'active' };
    });
    const moneyBefore = raw.resources.money as number;
    const save = migrateAndValidate(raw);
    expect(save.buildings['b_row']).toBeUndefined();
    expect(save.buildings['b_apt']).toBeUndefined();
    // house_row: 60k + Stufe 1 180k · apartment: 280k — alles alte v10-Preise.
    expect(save.resources.money).toBe(moneyBefore + 60_000 + 180_000 + 280_000);
    expect(consumeMigrationNotice()?.removedBuildings).toBe(2);
  });

  it('demolishes footprint collisions with full refund (2×2 → 3×3 houses)', () => {
    const spot = findGrassArea(5, 3);
    const raw = makeV10Save((r) => {
      // In v10 (2×2) standen beide Häuser konfliktfrei nebeneinander — mit den
      // neuen 3×3-Footprints überlappen sie; das später geprüfte weicht.
      r.buildings['b_h1'] = { id: 'b_h1', defId: 'house_small', x: spot.x, y: spot.y, upgradeLevel: 0, status: 'active' };
      r.buildings['b_h2'] = { id: 'b_h2', defId: 'house_small', x: spot.x + 2, y: spot.y, upgradeLevel: 0, status: 'active' };
    });
    const moneyBefore = raw.resources.money as number;
    const save = migrateAndValidate(raw);
    const houses = Object.values(save.buildings).filter((b) => b.defId === 'house_small');
    expect(houses.length).toBe(1);
    expect(houses[0]!.id).toBe('b_h1'); // Id-Reihenfolge entscheidet deterministisch
    expect(save.resources.money).toBe(moneyBefore + 9_000); // alter Hauspreis
    expect(consumeMigrationNotice()?.removedBuildings).toBe(1);
  });

  it('clamps upgrade stages to the new maximum and refunds the old late stages', () => {
    const sawSpot = findGrassArea(4, 4);
    const pumpSpot = findGrassArea(3, 3, sawSpot.y + 6);
    const raw = makeV10Save((r) => {
      // Sägewerk hatte in v10 drei Stufen (neu: 2), Wasserpumpe zwei (neu: 1).
      r.buildings['b_saw'] = { id: 'b_saw', defId: 'sawmill', x: sawSpot.x, y: sawSpot.y, upgradeLevel: 3, status: 'active' };
      r.buildings['b_pump'] = { id: 'b_pump', defId: 'water_pump', x: pumpSpot.x, y: pumpSpot.y, upgradeLevel: 2, status: 'active' };
    });
    const moneyBefore = raw.resources.money as number;
    const save = migrateAndValidate(raw);
    expect(save.buildings['b_saw']?.upgradeLevel).toBe(2);
    expect(save.buildings['b_pump']?.upgradeLevel).toBe(1);
    // Erstattet: alte Sägewerk-Stufe 3 (2,2 M) + alte Pumpen-Stufe 2 (560k).
    expect(save.resources.money).toBe(moneyBefore + 2_200_000 + 560_000);
    expect(consumeMigrationNotice()?.removedBuildings).toBe(0);
  });

  it('unlocks regions by sector majority; teaser regions stay locked', () => {
    const raw = makeV10Save((r) => {
      for (const sector of Object.values(r.world.sectors) as { status: string }[]) sector.status = 'unlocked';
    });
    const save = migrateAndValidate(raw);
    for (const region of Object.values(save.world.regions)) {
      // Region 32 (Nebelinsel) ist als Teaser nie freischaltbar — auch nicht
      // durch die Migration; alle anderen waren vollständig in Spielerbesitz.
      expect(region.status).toBe(region.id === 32 ? 'locked' : 'unlocked');
    }
    expect(save.stats.regionsUnlocked).toBe(REGION_COUNT - 2); // ohne Start + Teaser
  });
});

/* eslint-enable @typescript-eslint/no-explicit-any */
