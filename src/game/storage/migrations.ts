// Save-Migrationen (§ CLAUDE.md 3: Insel-Saves brechen nie).
//
// Mit v10 wurde die Welt vollständig ersetzt (Insel aus dem GLB-Bake statt der
// alten Testkarte) UND das Save-Format verschlankt (Sektoren ohne Kachel-Arrays).
// Saves ≤ v9 beschreiben eine Geografie, die es nicht mehr gibt — eine
// Koordinaten-Migration wäre Unsinn (Gebäude lägen im Ozean). Sie werfen deshalb
// `LegacyWorldSaveError`; der Storage-Adapter sichert den alten Stand unter
// einem Backup-Key und startet frisch (docs/SAVE_MIGRATION.md; vom Auftrag §22
// sanktionierte Ausnahme von CLAUDE.md §3, einmalig für die Prototyp-Phase).
//
// Ab v10 gilt wieder der alte Vertrag: jede Schema-Änderung ergänzt GENAU EINE
// Migration n→n+1 in `migrations`. Die erste ist v10→v11 (§ Ausbaustufe 2.0):
// organische Regionen statt Quadrat-Sektoren, neue Gebäude-Footprints — nicht
// mehr passende Gebäude werden zu 100 % zum ALTEN Preis erstattet
// (`legacyCosts.ts`), nichts geht stillschweigend verloren.

import { SCHEMA_VERSION } from '../newGame.ts';
import { saveGameSchema } from '../config/schemas.ts';
import { buildingsConfig } from '../config/buildings.config.ts';
import { levelsConfig } from '../config/levels.config.ts';
import { questsConfig } from '../config/quests.config.ts';
import { regionsConfig } from '../config/regions.config.ts';
import { regionIdAt, startRegionConfig, WORLD_TILES, terrainAt } from '../config/startRegion.config.ts';
import type { ResourceId, SaveGame } from '../types.ts';
import { addCost, legacyInvestedCost, legacyStageCost } from './legacyCosts.ts';

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

/** Erste Version der neuen Insel-Welt; ältere Saves sind nicht migrierbar. */
export const ISLAND_BASE_VERSION = 10;

/** Sektor-Kantenlänge der v10-Welt (historische Konstante, nur für die Migration). */
const V10_SECTOR_SIZE = 64;

/**
 * Ergebnis-Zusammenfassung der letzten v10→v11-Migration — die UI zeigt daraus
 * einmalig einen Hinweis (Muster `legacyBackupCreated`). Modul-lokal statt im
 * Save, weil das validierte Schema keine Transienten kennt.
 */
export interface MigrationNotice {
  fromVersion: number;
  /** Entfernte (voll erstattete) Gebäude. */
  removedBuildings: number;
  /** Gesamterstattung (alte Preise, § legacyCosts). */
  refunded: Partial<Record<ResourceId, number>>;
}

let pendingNotice: MigrationNotice | undefined;

/** Holt die letzte Migrations-Zusammenfassung ab (einmalig, danach geleert). */
export function consumeMigrationNotice(): MigrationNotice | undefined {
  const notice = pendingNotice;
  pendingNotice = undefined;
  return notice;
}

// ---- v10 → v11 (§ Ausbaustufe 2.0: Regionen + Gebäudesystem 2.0) -----------

// Lose Sichten auf den unvalidierten v10-Rohsave — nur die Felder, die die
// Migration wirklich liest. Alles andere wird unverändert durchgereicht und am
// Ende von `saveGameSchema` validiert.
interface RawBuilding {
  id: string;
  defId: string;
  x: number;
  y: number;
  upgradeLevel: number;
  status: 'constructing' | 'active' | 'paused';
  targetUpgradeLevel?: number;
  constructionEndsAt?: number;
}

interface RawV10Sector {
  sx: number;
  sy: number;
  status: string;
}

const UNBUILDABLE_TERRAIN = new Set(['river', 'water', 'mountain']);

const migrateV10ToV11: Migration = (raw) => {
  const world = (raw.world ?? {}) as Record<string, unknown>;
  const newBuildingDefs = new Map(buildingsConfig.map((d) => [d.id, d]));
  const refunded: Partial<Record<ResourceId, number>> = {};
  let removedBuildings = 0;

  // 1) Sektor-Freischaltungen → Regionen: Eine Region gilt als freigeschaltet,
  //    wenn die Mehrheit ihrer Kacheln in zuvor freigeschalteten Sektoren lag.
  //    Die Startregion ist immer frei.
  const unlockedSectors = new Set<string>();
  for (const sector of Object.values((world.sectors ?? {}) as Record<string, RawV10Sector>)) {
    if (sector && sector.status === 'unlocked') unlockedSectors.add(`${sector.sx},${sector.sy}`);
  }
  const totalTiles = new Map<number, number>();
  const unlockedTiles = new Map<number, number>();
  for (let y = 0; y < WORLD_TILES; y++) {
    for (let x = 0; x < WORLD_TILES; x++) {
      const id = regionIdAt(x, y);
      if (id === 0) continue;
      totalTiles.set(id, (totalTiles.get(id) ?? 0) + 1);
      if (unlockedSectors.has(`${Math.floor(x / V10_SECTOR_SIZE)},${Math.floor(y / V10_SECTOR_SIZE)}`)) {
        unlockedTiles.set(id, (unlockedTiles.get(id) ?? 0) + 1);
      }
    }
  }
  const regionDefs = new Map(regionsConfig.map((r) => [r.id, r]));
  const regions: Record<string, { id: number; districtId: string; status: 'locked' | 'unlocked' }> = {};
  let regionsUnlockedCount = 0;
  for (const [id, total] of totalTiles) {
    const isStart = id === startRegionConfig.startRegionId;
    // Nie freischaltbare Teaser-Regionen bleiben gesperrt, egal welche
    // Sektoren der Spieler in v10 besaß.
    const unlockable = regionDefs.get(id)?.unlockable !== false;
    const unlocked = isStart || (unlockable && (unlockedTiles.get(id) ?? 0) * 2 > total);
    if (unlocked && !isStart) regionsUnlockedCount += 1;
    regions[String(id)] = { id, districtId: 'main', status: unlocked ? 'unlocked' : 'locked' };
  }

  // 2) Gebäude prüfen — Rathaus zuerst (deterministisch auf den neuen
  //    Bake-Start verschoben), dann Distrikt-Zentren, dann alle übrigen in
  //    Id-Reihenfolge. Inkrementelle Belegung + Terrain + Regions-Status; wer
  //    nicht mehr passt (größerer Footprint, entfallene Def, gesperrte
  //    Region), wird abgerissen und zu 100 % zum alten Preis erstattet.
  const buildings = (raw.buildings ?? {}) as Record<string, RawBuilding>;
  raw.buildings = buildings;
  const removedIds = new Set<string>();
  const occupied = new Set<string>();

  const rank = (b: RawBuilding): number => (b.defId === 'town_hall' ? 0 : b.defId === 'district_center' ? 1 : 2);
  const ordered = Object.values(buildings).sort((a, b) => rank(a) - rank(b) || a.id.localeCompare(b.id));

  const removeWithRefund = (b: RawBuilding): void => {
    addCost(refunded, legacyInvestedCost(b.defId, b.upgradeLevel));
    // Eine laufende Stufen-Erweiterung war bereits bezahlt — auch erstatten.
    if (b.targetUpgradeLevel !== undefined && b.targetUpgradeLevel > b.upgradeLevel) {
      addCost(refunded, legacyStageCost(b.defId, b.targetUpgradeLevel));
    }
    removedIds.add(b.id);
    removedBuildings += 1;
    delete buildings[b.id];
  };

  for (const b of ordered) {
    const def = newBuildingDefs.get(b.defId);
    if (!def) {
      removeWithRefund(b); // entfallene Defs (house_row, apartment)
      continue;
    }
    if (b.defId === 'town_hall') {
      b.x = startRegionConfig.townHall.x;
      b.y = startRegionConfig.townHall.y;
    }
    // Passt der (ggf. gewachsene) Footprint noch? Straßenanschluss wird bewusst
    // NICHT geprüft — fehlende Straßen sind ein Diagnose-Hinweis, kein Abriss.
    let fits = true;
    for (let dy = 0; dy < def.size.h && fits; dy++) {
      for (let dx = 0; dx < def.size.w && fits; dx++) {
        const tx = b.x + dx;
        const ty = b.y + dy;
        if (tx < 0 || ty < 0 || tx >= WORLD_TILES || ty >= WORLD_TILES) fits = false;
        else if (occupied.has(`${tx},${ty}`)) fits = false;
        else if (b.defId !== 'town_hall') {
          // Der Bake garantiert den Rathaus-Block; alle anderen brauchen
          // bebaubares Terrain in einer freigeschalteten Region.
          if (UNBUILDABLE_TERRAIN.has(terrainAt(tx, ty))) fits = false;
          else if (regions[String(regionIdAt(tx, ty))]?.status !== 'unlocked') fits = false;
        }
      }
    }
    if (!fits) {
      removeWithRefund(b);
      continue;
    }
    for (let dy = 0; dy < def.size.h; dy++) {
      for (let dx = 0; dx < def.size.w; dx++) occupied.add(`${b.x + dx},${b.y + dy}`);
    }
    // Stufen auf das neue Maximum clampen; überzählige (alte) Stufen erstatten.
    const maxStage = def.upgrades?.length ?? 0;
    if (b.upgradeLevel > maxStage) {
      for (let stage = maxStage + 1; stage <= b.upgradeLevel; stage++) {
        addCost(refunded, legacyStageCost(b.defId, stage));
      }
      b.upgradeLevel = maxStage;
    }
    if (b.targetUpgradeLevel !== undefined && b.targetUpgradeLevel > maxStage) {
      addCost(refunded, legacyStageCost(b.defId, b.targetUpgradeLevel));
      delete b.targetUpgradeLevel;
      delete b.constructionEndsAt;
      b.status = 'active';
    }
  }

  // Die 5 gebackenen Startstraßen an der neuen Rathaus-Südkante ergänzen
  // (Gratis-Vorplatz wie im Neustart), sofern die Kacheln frei sind.
  let nextId = typeof raw.nextId === 'number' ? raw.nextId : 0;
  for (const pos of startRegionConfig.startRoads) {
    if (occupied.has(`${pos.x},${pos.y}`)) continue;
    const id = `b_${nextId++}_migroad`;
    buildings[id] = { id, defId: 'road', x: pos.x, y: pos.y, upgradeLevel: 0, status: 'active' };
    occupied.add(`${pos.x},${pos.y}`);
  }
  raw.nextId = nextId;

  // 3) Distrikte: Zentren, die den Umbau nicht überlebt haben, lösen ihren
  //    Distrikt auf; jede Region mit überlebendem Zentrum gehört dessen Distrikt.
  const districts = (world.districts ?? {}) as Record<string, { id: string; centerBuildingId: string }>;
  for (const [key, district] of Object.entries(districts)) {
    const center = district ? buildings[district.centerBuildingId] : undefined;
    if (!center) {
      if (key !== 'main') delete districts[key];
      continue;
    }
    const regionId = regionIdAt(center.x, center.y);
    const region = regions[String(regionId)];
    if (region) region.districtId = district.id;
  }

  // 4) Welt/Statistiken/Level auf v11-Form bringen.
  world.regions = regions;
  delete world.sectors;
  raw.world = world;

  const stats = (raw.stats ?? {}) as Record<string, unknown>;
  stats.regionsUnlocked = regionsUnlockedCount;
  delete stats.sectorsUnlocked;
  for (const key of ['built', 'upgraded'] as const) {
    const record = stats[key] as Record<string, number> | undefined;
    if (!record) continue;
    for (const defId of Object.keys(record)) {
      if (!newBuildingDefs.has(defId)) delete record[defId];
    }
  }
  raw.stats = stats;

  // Erstattung gutschreiben (alte Preise, 100 %).
  const resources = (raw.resources ?? {}) as Partial<Record<ResourceId, number>>;
  for (const [res, amount] of Object.entries(refunded)) {
    resources[res as ResourceId] = (resources[res as ResourceId] ?? 0) + (amount ?? 0);
  }
  raw.resources = resources;

  // Level aus XP mit der neuen 20er-Kurve re-derivieren (XP bleibt erhalten).
  const level = (raw.level ?? {}) as { current?: number; xp?: number };
  const xp = typeof level.xp === 'number' ? level.xp : 0;
  let current = 1;
  for (const def of levelsConfig) if (xp >= def.xpRequired && def.level > current) current = def.level;
  level.current = current;
  raw.level = level;

  // 5) Verweise auf entfernte Gebäude bereinigen: Brände löschen, eine
  //    laufende Aktivität mit verlorenem Ziel abbrechen, aktive Quests auf die
  //    neue Zielstruktur normalisieren (Fortschritt wird im nächsten Tick neu
  //    berechnet).
  if (Array.isArray(raw.events)) {
    raw.events = (raw.events as { buildingId?: string }[]).filter(
      (e) => !e.buildingId || !removedIds.has(e.buildingId),
    );
  }
  const activities = (raw.activities ?? {}) as {
    active?: { targets?: { buildingId: string }[] };
  };
  if (activities.active?.targets?.some((t) => removedIds.has(t.buildingId))) {
    delete activities.active;
  }
  const quests = (raw.quests ?? {}) as {
    active?: { questId: string; progress: number[]; claimable: boolean }[];
  };
  if (Array.isArray(quests.active)) {
    const questDefs = new Map(questsConfig.map((q) => [q.id, q]));
    quests.active = quests.active
      .filter((a) => questDefs.has(a.questId))
      .map((a) => {
        const objectives = questDefs.get(a.questId)!.objectives.length;
        const progress = Array.from({ length: objectives }, (_, i) => a.progress[i] ?? 0);
        return { ...a, progress, claimable: false };
      });
  }

  raw.schemaVersion = 11;
  pendingNotice = { fromVersion: 10, removedBuildings, refunded };
  return raw;
};

/**
 * Migration chain: migrations[n] upgrades a save from schemaVersion n to n+1.
 * Beginnt bei v10 (Insel-Basis).
 */
const migrations: Record<number, Migration> = {
  10: migrateV10ToV11,
};

export class SaveValidationError extends Error {}

/**
 * Ein strukturell gültiger, aber vor-Insel-Save (≤ v9): nicht ladbar, aber
 * wertvoll genug für ein Backup statt stillen Verlusts.
 */
export class LegacyWorldSaveError extends Error {
  constructor(public readonly version: number) {
    super(`Save schemaVersion ${version} stammt aus der Vor-Insel-Welt (< v${ISLAND_BASE_VERSION})`);
  }
}

export function migrateAndValidate(rawInput: unknown): SaveGame {
  if (typeof rawInput !== 'object' || rawInput === null) {
    throw new SaveValidationError('Save is not an object');
  }
  let raw = rawInput as Record<string, unknown>;
  // Nie eine Notice aus einem früheren (ggf. gescheiterten) Lauf durchsickern lassen.
  pendingNotice = undefined;
  let version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;
  if (version >= 1 && version < ISLAND_BASE_VERSION) {
    throw new LegacyWorldSaveError(version);
  }
  if (version < ISLAND_BASE_VERSION || version > SCHEMA_VERSION) {
    throw new SaveValidationError(`Unsupported save schemaVersion ${version}`);
  }
  while (version < SCHEMA_VERSION) {
    const migrate = migrations[version];
    if (!migrate) throw new SaveValidationError(`Missing migration from v${version}`);
    try {
      raw = migrate(raw);
    } catch (error) {
      // A migration crashing means the save is structurally broken.
      throw new SaveValidationError(`Migration from v${version} failed: ${String(error)}`);
    }
    version = raw.schemaVersion as number;
  }
  const parsed = saveGameSchema.safeParse(raw);
  if (!parsed.success) {
    pendingNotice = undefined; // halbmigrierter Stand → keine Erfolgs-Meldung
    throw new SaveValidationError(`Save validation failed: ${parsed.error.issues[0]?.message ?? 'unknown'}`);
  }
  return parsed.data as SaveGame;
}
