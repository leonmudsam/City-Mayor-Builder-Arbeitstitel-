import type { SaveAdapter } from './saveAdapter.ts';
import type { SaveGame } from '../types.ts';
import {
  consumeMigrationNotice,
  LegacyWorldSaveError,
  migrateAndValidate,
  type MigrationNotice,
} from './migrations.ts';

const PREFIX = 'cmb.save.';
const BACKUP_SUFFIX = '.backup';
/** Sicherung eines Vor-Insel-Saves (≤ v9, § MVP4): nie überschrieben, nie geladen. */
const LEGACY_BACKUP_KEY = 'cmb.save.backup.v9';

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
          if (localStorage.getItem(LEGACY_BACKUP_KEY) === null) {
            localStorage.setItem(LEGACY_BACKUP_KEY, raw);
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
      if (key?.startsWith(PREFIX) && !key.endsWith(BACKUP_SUFFIX) && key !== LEGACY_BACKUP_KEY) {
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
