import { afterEach, describe, expect, it, vi } from 'vitest';
import { nearTownHall, newController, T0 } from './helpers.ts';
import { REGION_COUNT, startRegionConfig } from '../src/game/config/startRegion.config.ts';
import { exportSave, importSave } from '../src/game/storage/exportImport.ts';
import { SCHEMA_VERSION } from '../src/game/newGame.ts';
import {
  ISLAND_BASE_VERSION,
  LegacyWorldSaveError,
  migrateAndValidate,
  SaveValidationError,
  WorldRebuildSaveError,
} from '../src/game/storage/migrations.ts';
import { LocalStorageSaveAdapter } from '../src/game/storage/localStorageAdapter.ts';

describe('save/load (v17 aktive Betriebe)', () => {
  it('round-trips a live v17 game through export/import', () => {
    const { controller } = newController();
    const road = nearTownHall(5, 5);
    expect(controller.placeBuilding('road', road.x, road.y).ok).toBe(true);
    controller.update(T0 + 5 * 60_000);
    const restored = importSave(exportSave(controller.state));
    expect(restored).toEqual(JSON.parse(JSON.stringify(controller.state)));
    expect(restored.schemaVersion).toBe(SCHEMA_VERSION);
  });

  // § R10 Migrations-Abschluss: Die Kette darf KEINE Lücke haben. Ohne diesen Test
  // fällt ein `SCHEMA_VERSION`-Bump ohne zugehörige Migration erst beim Spieler auf,
  // der einen alten Stand lädt — genau das verbietet CLAUDE.md §3. Erlaubt ist nur
  // ein *bewusster* Weltumbau-Abbruch (LegacyWorldSaveError), nie „Missing migration".
  it('hat für jede ladbare Schema-Version eine Migration (keine Lücke in der Kette)', () => {
    const { controller } = newController();
    const template = JSON.parse(exportSave(controller.state)) as Record<string, unknown>;
    for (let version = ISLAND_BASE_VERSION; version < SCHEMA_VERSION; version++) {
      const raw = { ...template, schemaVersion: version };
      try {
        const migrated = migrateAndValidate(raw);
        expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);
      } catch (error) {
        // Bewusst abgebrochene Alt-Welten sind in Ordnung — fehlende Migrationen nicht.
        expect(error).toBeInstanceOf(LegacyWorldSaveError);
        expect(String(error)).not.toContain('Missing migration');
      }
    }
  });

  // Die Migrationen v21→v22 (Schiffsrouten) und v22→v23 (Dauerbetrieb) sind rein
  // additiv — ein v21-Save ohne die neuen Felder muss über die ganze Kette ladbar
  // bleiben (Regel §3: Saves brechen nie).
  it('lehnt einen v21-Save über den Weltaustausch v25→v26 ab (Backup + Neustart)', () => {
    // § World Overhaul 12.0: Die Migrationskette läuft v21 → … → v25 durch und
    // bricht dann bewusst ab — die Welt ist eine andere Insel, jede Koordinate und
    // jede Region-Id bedeutet etwas anderes. Statt still falscher Daten gibt es
    // ein einmaliges Backup und einen ehrlichen Neustart.
    const { controller } = newController();
    const raw = JSON.parse(exportSave(controller.state)) as Record<string, unknown>;
    delete raw.shipping; // v21 kannte das Feld nicht
    raw.schemaVersion = 21;
    expect(() => migrateAndValidate(raw)).toThrow(WorldRebuildSaveError);
  });

  it('migriert additive Felder verlustfrei innerhalb DERSELBEN Welt', () => {
    // Regressionsschutz für die additiven Migrationen: ein Save der aktuellen Welt
    // ohne optionale Felder muss vollständig und unverändert ankommen.
    const { controller } = newController();
    const raw = JSON.parse(exportSave(controller.state)) as Record<string, unknown>;
    delete raw.shipping;
    const migrated = migrateAndValidate(raw);
    expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);
    expect(migrated.buildings).toEqual(controller.state.buildings);
    // Keine erfundenen Daten: ohne Schifffahrt bleibt das Feld leer.
    expect(migrated.shipping).toBeUndefined();
  });

  it('keeps saves slim: no tile arrays, region stubs only', () => {
    const { controller } = newController(undefined, { flatten: false });
    const raw = JSON.parse(exportSave(controller.state)) as { world: { regions: Record<string, { tiles?: unknown }> } };
    const regions = Object.values(raw.world.regions);
    expect(regions.length).toBe(REGION_COUNT);
    expect(regions.every((region) => region.tiles === undefined)).toBe(true);
    expect(exportSave(controller.state).length).toBeLessThan(50_000);
  });

  it('persists sparse terrain overrides through a current save', () => {
    const { controller } = newController();
    const point = nearTownHall(5, 5);
    controller.state.world.terrainOverrides = { [`${point.x},${point.y}`]: 'river' };
    const restored = importSave(exportSave(controller.state));
    expect(restored.world.terrainOverrides?.[`${point.x},${point.y}`]).toBe('river');
  });

  it('rejects corrupt and unsupported saves', () => {
    expect(() => importSave(`{"schemaVersion": ${SCHEMA_VERSION}, "meta": "broken"}`)).toThrow(SaveValidationError);
    expect(() => migrateAndValidate(null)).toThrow(SaveValidationError);
    expect(() => migrateAndValidate({ schemaVersion: 99 })).toThrow(SaveValidationError);
  });

  it('keeps pre-v10 saves distinguishable from the replaced v10–v13 island', () => {
    expect(() => migrateAndValidate({ schemaVersion: 9 })).toThrow(LegacyWorldSaveError);
    const { controller } = newController(undefined, { flatten: false });
    const oldIsland = JSON.parse(exportSave(controller.state));
    oldIsland.schemaVersion = 13;
    expect(() => migrateAndValidate(oldIsland)).toThrow(WorldRebuildSaveError);
  });

  it('starts new games unfounded on the central baked start with all region stubs', () => {
    const { controller } = newController(undefined, { flatten: false, found: false });
    expect(controller.state.schemaVersion).toBe(SCHEMA_VERSION);
    // § 12.2: kein vorplatziertes Rathaus mehr — nur der geprüfte Vorschlag.
    expect(controller.isCityFounded()).toBe(false);
    expect(controller.getFoundingBlocker(startRegionConfig.townHall.x, startRegionConfig.townHall.y)).toBeUndefined();
    expect(Object.keys(controller.state.world.regions)).toHaveLength(REGION_COUNT);
    expect(controller.state.world.regions[String(startRegionConfig.startRegionId)]?.status).toBe('unlocked');
  });

  it('rejects v25 coordinates through the explicit 25→26 world-overhaul migration', () => {
    // § World Overhaul 12.0: neue Insel-GLB ⇒ neue Höhen, Regionen, Startregion.
    const { controller } = newController(undefined, { flatten: false });
    const v25 = JSON.parse(exportSave(controller.state));
    v25.schemaVersion = 25;
    expect(() => migrateAndValidate(v25)).toThrow(WorldRebuildSaveError);
  });

  it('rejects v14 coordinates through the explicit 14→15 migration', () => {
    const { controller } = newController(undefined, { flatten: false });
    const v14 = JSON.parse(exportSave(controller.state));
    v14.schemaVersion = 14;
    expect(() => migrateAndValidate(v14)).toThrow(WorldRebuildSaveError);
  });

  it('rejects v15 coordinates through the explicit 15→16 compaction migration', () => {
    // § Final World Compaction 8.1: die zweite Verdichtung ändert jede Koordinate,
    // Region-Id, Wasserlinie und den Startanker gleichzeitig — Backup + Neustart.
    const { controller } = newController(undefined, { flatten: false });
    const v15 = JSON.parse(exportSave(controller.state));
    v15.schemaVersion = 15;
    expect(() => migrateAndValidate(v15)).toThrow(WorldRebuildSaveError);
  });

  it('rejects v19 coordinates through the explicit 19→20 third-compaction migration', () => {
    // § 10.0 R7/R8: die dritte Verdichtung (X/Z 0,84 zusätzlich) ändert jede
    // Koordinate, Region-Id und den Startanker (jetzt Region 9) — Backup + Neustart.
    const { controller } = newController(undefined, { flatten: false });
    const v19 = JSON.parse(exportSave(controller.state));
    v19.schemaVersion = 19;
    expect(() => migrateAndValidate(v19)).toThrow(WorldRebuildSaveError);
  });
});

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

describe('sanktionierter Weltneustart mit Backup', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('backs up a v13 slot once and clears the active copy', async () => {
    const storage = new MemoryStorage();
    vi.stubGlobal('localStorage', storage);
    const { controller } = newController(undefined, { flatten: false });
    const oldIsland = JSON.parse(exportSave(controller.state));
    oldIsland.schemaVersion = 13;
    const raw = JSON.stringify(oldIsland);
    storage.setItem('cmb.save.hauptstadt', raw);

    const adapter = new LocalStorageSaveAdapter();
    await expect(adapter.load('hauptstadt')).resolves.toBeUndefined();
    expect(adapter.legacyBackupCreated).toBe(true);
    expect(storage.getItem('cmb.save.hauptstadt')).toBeNull();
    expect(storage.getItem('cmb.save.backup.world-v13')).toBe(raw);

    storage.setItem('cmb.save.hauptstadt', raw.replace('hauptstadt', 'zweiter-versuch'));
    await adapter.load('hauptstadt');
    expect(storage.getItem('cmb.save.backup.world-v13')).toBe(raw);
  });

  it('backs up a v14 terrain-overhaul slot under its own key', async () => {
    const storage = new MemoryStorage();
    vi.stubGlobal('localStorage', storage);
    const { controller } = newController(undefined, { flatten: false });
    const oldWorld = JSON.parse(exportSave(controller.state));
    oldWorld.schemaVersion = 14;
    const raw = JSON.stringify(oldWorld);
    storage.setItem('cmb.save.hauptstadt', raw);

    const adapter = new LocalStorageSaveAdapter();
    await expect(adapter.load('hauptstadt')).resolves.toBeUndefined();
    expect(storage.getItem('cmb.save.backup.world-v14')).toBe(raw);
  });

  // § Change 9.0: der größere zentrale Start ist ein Weltumbau — v16/v17/v18-Stände
  // laufen additiv bis v18 und werden dann einmalig gesichert + neu gestartet.
  it('backs up a pre-9.0 slot under the central-start key and restarts', async () => {
    const storage = new MemoryStorage();
    vi.stubGlobal('localStorage', storage);
    const { controller } = newController(undefined, { flatten: false });
    const old = JSON.parse(exportSave(controller.state));
    old.schemaVersion = 16; // v16/v17/v18 migrieren additiv bis v18, dann Rebuild
    const raw = JSON.stringify(old);
    storage.setItem('cmb.save.hauptstadt', raw);

    const adapter = new LocalStorageSaveAdapter();
    await expect(adapter.load('hauptstadt')).resolves.toBeUndefined();
    expect(adapter.legacyBackupCreated).toBe(true);
    expect(storage.getItem('cmb.save.hauptstadt')).toBeNull();
    expect(storage.getItem('cmb.save.backup.world-v18')).toBe(raw);
    // Der Sicherungsslot taucht nicht als spielbarer Speicherstand auf.
    await expect(adapter.list()).resolves.not.toContain('backup.world-v18');
  });

  // § 10.0 R7/R8: die dritte Verdichtung ist ein Weltumbau — ein v19-Stand wird
  // einmalig unter world-v19 gesichert und neu gestartet.
  it('backs up a v19 slot under the third-compaction key and restarts', async () => {
    const storage = new MemoryStorage();
    vi.stubGlobal('localStorage', storage);
    const { controller } = newController(undefined, { flatten: false });
    const old = JSON.parse(exportSave(controller.state));
    old.schemaVersion = 19;
    const raw = JSON.stringify(old);
    storage.setItem('cmb.save.hauptstadt', raw);

    const adapter = new LocalStorageSaveAdapter();
    await expect(adapter.load('hauptstadt')).resolves.toBeUndefined();
    expect(adapter.legacyBackupCreated).toBe(true);
    expect(storage.getItem('cmb.save.hauptstadt')).toBeNull();
    expect(storage.getItem('cmb.save.backup.world-v19')).toBe(raw);
    await expect(adapter.list()).resolves.not.toContain('backup.world-v19');
  });
});
