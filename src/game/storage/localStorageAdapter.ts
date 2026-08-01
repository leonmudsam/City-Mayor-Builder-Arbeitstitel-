import type { SaveAdapter } from './saveAdapter.ts';
import type { SaveGame } from '../types.ts';
import {
  consumeMigrationNotice,
  LegacyWorldSaveError,
  migrateAndValidate,
  type MigrationNotice,
  WorldRebuildSaveError,
} from './migrations.ts';

const PREFIX = 'cmb.save.';
const BACKUP_SUFFIX = '.backup';
/** Sicherung eines Vor-Insel-Saves (≤ v9, § MVP4): nie überschrieben, nie geladen. */
const LEGACY_BACKUP_KEY = 'cmb.save.backup.v9';
/** Einmalige Sicherung der vollständig ersetzten Inselwelt v10–v13. */
const WORLD_REBUILD_BACKUP_KEY = 'cmb.save.backup.world-v13';
/** Sicherung der 6.0-Welt vor der kompakteren 6.1-Geografie. */
const TERRAIN_OVERHAUL_BACKUP_KEY = 'cmb.save.backup.world-v14';
/** Sicherung der 6.1-Welt vor der final verdichteten 13-Regionen-Insel (8.1). */
const FINAL_COMPACTION_BACKUP_KEY = 'cmb.save.backup.world-v15';
/** Sicherung vor dem größeren zentralen Start (§ Change 9.0, v18→v19). */
const CENTRAL_START_BACKUP_KEY = 'cmb.save.backup.world-v18';
/** Sicherung vor der dritten Verdichtung (§ 10.0 R7/R8, v19→v20). */
const THIRD_COMPACTION_BACKUP_KEY = 'cmb.save.backup.world-v19';
/** Sicherung vor dem vollständigen Weltaustausch (§ World Overhaul 12.0, v25→v26). */
const WORLD_OVERHAUL_BACKUP_KEY = 'cmb.save.backup.world-v25';
/** Sicherung vor neuer Segmentierung + freier Rathauswahl (§ 12.2, v26→v27). */
const FOUNDING_CHOICE_BACKUP_KEY = 'cmb.save.backup.world-v26';
/** Sicherung vor dem modelltreuen Gelände (§ Modelltreue 13.0, v27→v28). */
const MODEL_FIDELITY_BACKUP_KEY = 'cmb.save.backup.world-v27';
/** Sicherung vor dem höheren Meeresspiegel (§ Modelltreue 13.1, v28→v29). */
const SEA_LEVEL_BACKUP_KEY = 'cmb.save.backup.world-v28';

/**
 * MVP-1 storage: localStorage with a one-generation backup slot. A corrupt
 * primary save falls back to the backup instead of silently resetting (§15).
 *
 * Seit v10 (§ MVP4 Welt-Neuaufbau): Ein Save aus der Vor-Insel-Welt (≤ v9) ist
 * nicht migrierbar — er wird EINMALIG unter `cmb.save.backup.v9` gesichert
 * (niemals überschrieben), die aktiven Slots werden geräumt und das Spiel
 * startet frisch. `legacyBackupCreated` signalisiert der UI die einmalige
 * Meldung („Neue Welt — alter Stand gesichert"). docs/SAVE_MIGRATION.md.
 */
export class LocalStorageSaveAdapter implements SaveAdapter {
  /** True, wenn beim letzten `load` ein Vor-Insel-Save gesichert wurde. */
  legacyBackupCreated = false;

  /**
   * Zusammenfassung, wenn beim letzten `load` ein Save migriert wurde
   * (z. B. v10→v11: erstattete Gebäude) — die UI zeigt daraus einmalig
   * einen Hinweis, danach bleibt das Feld gesetzt, wird aber nicht erneut
   * befüllt (Muster `legacyBackupCreated`).
   */
  migrationNotice: MigrationNotice | undefined;

  async save(slot: string, data: SaveGame): Promise<void> {
    const key = PREFIX + slot;
    const previous = localStorage.getItem(key);
    if (previous !== null) localStorage.setItem(key + BACKUP_SUFFIX, previous);
    localStorage.setItem(key, JSON.stringify(data));
  }

  async load(slot: string): Promise<SaveGame | undefined> {
    const key = PREFIX + slot;
    for (const candidate of [key, key + BACKUP_SUFFIX]) {
      const raw = localStorage.getItem(candidate);
      if (raw === null) continue;
      try {
        const loaded = migrateAndValidate(JSON.parse(raw));
        this.migrationNotice = consumeMigrationNotice();
        return loaded;
      } catch (error) {
        if (error instanceof LegacyWorldSaveError) {
          // Alten Weltstand einmalig sichern (nie überschreiben) und den
          // aktiven Slot räumen, damit künftige Loads sauber frisch starten.
          const backupKey = error instanceof WorldRebuildSaveError
            ? error.version >= 28
              ? SEA_LEVEL_BACKUP_KEY
              : error.version >= 27
              ? MODEL_FIDELITY_BACKUP_KEY
              : error.version >= 26
              ? FOUNDING_CHOICE_BACKUP_KEY
              : error.version >= 25
              ? WORLD_OVERHAUL_BACKUP_KEY
              : error.version >= 19
                ? THIRD_COMPACTION_BACKUP_KEY
                : error.version >= 18
                  ? CENTRAL_START_BACKUP_KEY
                  : error.version >= 15
                    ? FINAL_COMPACTION_BACKUP_KEY
                    : error.version >= 14
                      ? TERRAIN_OVERHAUL_BACKUP_KEY
                      : WORLD_REBUILD_BACKUP_KEY
            : LEGACY_BACKUP_KEY;
          if (localStorage.getItem(backupKey) === null) {
            localStorage.setItem(backupKey, raw);
          }
          localStorage.removeItem(candidate);
          this.legacyBackupCreated = true;
          continue;
        }
        // Structurally broken → fall through to backup candidate.
      }
    }
    return undefined;
  }

  async list(): Promise<string[]> {
    const slots: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key?.startsWith(PREFIX) &&
        !key.endsWith(BACKUP_SUFFIX) &&
        key !== LEGACY_BACKUP_KEY &&
        key !== WORLD_REBUILD_BACKUP_KEY &&
        key !== TERRAIN_OVERHAUL_BACKUP_KEY &&
        key !== FINAL_COMPACTION_BACKUP_KEY &&
        key !== CENTRAL_START_BACKUP_KEY &&
        key !== THIRD_COMPACTION_BACKUP_KEY
      ) {
        slots.push(key.slice(PREFIX.length));
      }
    }
    return slots;
  }

  async delete(slot: string): Promise<void> {
    localStorage.removeItem(PREFIX + slot);
    localStorage.removeItem(PREFIX + slot + BACKUP_SUFFIX);
  }
}
