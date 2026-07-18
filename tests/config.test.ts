import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/game/config/index.ts';
import type { BuildingCategory } from '../src/game/types.ts';

describe('config', () => {
  it('loads and validates all static configs', () => {
    const config = loadConfig();
    expect(config.buildingList.length).toBeGreaterThanOrEqual(18);
    // § Gebäudesystem 2.0: 20 Level (Metropol-Bänder 15–20 gaten die Top-Stufen).
    expect(config.levels.length).toBe(20);
    expect(config.questList.length).toBeGreaterThanOrEqual(15);
    expect(config.mayorActions.length).toBe(3);
  });

  it('has a strictly increasing XP curve', () => {
    const config = loadConfig();
    for (let i = 1; i < config.levels.length; i++) {
      expect(config.levels[i]!.xpRequired).toBeGreaterThan(config.levels[i - 1]!.xpRequired);
    }
  });

  // ---- § Gebäudesystem 2.0: Größenklassen & Stufenregeln (Auftrag A §4/§7) ----

  it('assigns every building a size class that matches its footprint', () => {
    const config = loadConfig();
    const span: Record<string, [number, number]> = {
      XS: [1, 1], S: [2, 2], M: [3, 3], L: [4, 5], XL: [6, 7], XXL: [8, 12],
    };
    for (const def of config.buildingList) {
      const [min, max] = span[def.sizeClass]!;
      const m = Math.max(def.size.w, def.size.h);
      expect(m, `${def.id}: ${def.sizeClass} vs ${def.size.w}×${def.size.h}`).toBeGreaterThanOrEqual(min);
      expect(m, `${def.id}: ${def.sizeClass} vs ${def.size.w}×${def.size.h}`).toBeLessThanOrEqual(max);
      // Footprints sind quadratisch (Rotation bleibt rein visuell).
      expect(def.size.w, `${def.id}: Footprint muss quadratisch sein`).toBe(def.size.h);
    }
  });

  it('keeps upgrade chains within the per-category stage rules (§7)', () => {
    const config = loadConfig();
    // Max. GESAMT-Stufen (Basis + Upgrades) je Kategorie.
    const maxStages: Partial<Record<BuildingCategory, number>> = {
      decoration: 1,
      roads: 1,
      economy: 4, // Büro-Kette (Kleines Büro → Büroturm)
      services: 3,
      production: 3,
      energy: 2,
      leisure: 2,
      residential: 6, // house_small-Kette
      government: 4, // Rathaus-Kette
    };
    for (const def of config.buildingList) {
      const stages = 1 + (def.upgrades?.length ?? 0);
      const cap = maxStages[def.category];
      if (cap !== undefined) expect(stages, `${def.id}: ${stages} Stufen`).toBeLessThanOrEqual(cap);
    }
  });

  it('gates every top stage in the metropolis bands (Meilenstein-Gefühl, §5)', () => {
    const config = loadConfig();
    // Die letzten Stufen der langen Ketten liegen in L15–L20.
    const finalGates: Record<string, number> = {
      residential_tower: 20, // Wolkenkratzer
      office: 18, // Büroturm
      hospital: 19, // Universitätsklinikum
      police_station: 17,
      fire_station: 16,
      town_hall: 16,
      power_plant: 16,
      house_small: 15, // Wohnblock
    };
    for (const [id, level] of Object.entries(finalGates)) {
      const def = config.buildings.get(id)!;
      const last = def.upgrades![def.upgrades!.length - 1]!;
      expect(last.unlockLevel, `${id}: letzte Stufe`).toBe(level);
    }
  });
});
