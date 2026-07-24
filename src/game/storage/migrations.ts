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

// ---- v11 → v12 (§ Stadtarbeit 2D: Fahrzeug + manuelle Straßenkette) ---------
// Beide neuen Felder einer laufenden Aktivität sind optional. Alte Missionen
// laufen deshalb mit ihrem Config-Standardfahrzeug und der bisherigen
// Renderer-Wegfindung weiter; es muss nichts erfunden oder verworfen werden.
const migrateV11ToV12: Migration = (raw) => {
  raw.schemaVersion = 12;
  return raw;
};

// ---- v12 → v13 (§ Stadtarbeit-Logik 2.0: reservierte Ladung) ----------------
// Neu ist das optionale Feld `ActiveActivity.reserved` (upfront an der Quelle
// reservierte Ware). Alte laufende Missionen besitzen es nicht — sie ziehen die
// Lieferkosten wie bisher pro Ziel aus dem Pool (Fallback-Pfad im Controller).
// Es wird nichts erfunden und keine Ware nachträglich reserviert.
const migrateV12ToV13: Migration = (raw) => {
  raw.schemaVersion = 13;
  return raw;
};

/**
 * v13 → v14 ist absichtlich kein Koordinaten-Raten: Küste, Gebirge, 40 Regionen
 * und Startpunkt wurden vollständig ersetzt. Der Adapter sichert den Rohsave
 * einmalig und startet anschließend eine saubere v14-Welt.
 */
const migrateV13ToV14: Migration = (raw) => {
  throw new WorldRebuildSaveError(typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 13);
};

/** v14 → v15: die Inselgeometrie bleibt wiedererkennbar, ihre gesamte X/Z-
 * Projektion, Startregion und Wasserlinie ändern sich jedoch. Gebäude einzeln
 * zu projizieren wäre bei Küsten, Brücken und Bezirken nicht verlustfrei. */
const migrateV14ToV15: Migration = (raw) => {
  throw new WorldRebuildSaveError(typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 14);
};

/**
 * v15 → v16: § Final World Compaction 8.1. Die Insel wurde ein zweites Mal
 * horizontal verdichtet (Spannweite 420 → 374 Kacheln) und die Regionsstruktur
 * von 40 Landschaften auf eine zentrale Startregion plus zwölf Freischaltungen
 * konsolidiert. Damit ändern sich GLEICHZEITIG:
 *
 *   - jede Weltkoordinate (anderer Ozeanrand, andere Projektion),
 *   - jede Region-Id und ihr Zuschnitt,
 *   - Terrain, Wasserlinie, Bebaubarkeit und Küstenverlauf,
 *   - Rathausanker und Startstraßen.
 *
 * Eine Koordinatenprojektion wäre zwar rechenbar, aber nicht verlustfrei: Unter
 * einem projizierten Gebäude liegt in der neuen Welt regelmäßig Wasser, Gebirge
 * oder eine noch gesperrte Region. Der Auftrag lässt für genau diesen Fall
 * ausdrücklich den transparenten Weltneustart zu (§13). Der alte Stand wird
 * deshalb EINMALIG unter `cmb.save.backup.world-v15` gesichert und der Slot
 * geräumt — kein stiller Verlust, keine erfundene Projektion.
 */
const migrateV15ToV16: Migration = (raw) => {
  throw new WorldRebuildSaveError(typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 15);
};

/**
 * v16 → v17: § Active Operations 2.0. Rein additiv — ein leeres
 * `operations`-Objekt (lokale Betriebslager, Arbeiter, aktive Aufträge,
 * Ressourcenknoten-Deltas). Bestehende globale Ressourcen bleiben unangetastet
 * und dienen weiter als Zentral-/Übergangsbestand (§21); Betriebe legen ihr
 * lokales Lager beim ersten Auftrag an. Der Sägewerk-Passivpfad entfällt ab
 * dieser Version durch den Tick-Guard, nicht durch eine Save-Änderung. Kein
 * Weltneustart, keine Datenverluste.
 */
const migrateV16ToV17: Migration = (raw) => {
  if (typeof raw.operations !== 'object' || raw.operations === null) {
    raw.operations = { inventories: {}, workers: {}, active: {}, nodeDeltas: {} };
  }
  raw.schemaVersion = 17;
  return raw;
};

/**
 * v17 → v18: § Active Operations 2.0, Phase A5 (Transport). Rein additiv — ein
 * leerer `operations.transfers`-Katalog laufender Lagertransporte. Bestehende
 * Betriebslager, Reservierungen und globale Ressourcen bleiben unangetastet;
 * keine Weltänderung, kein Datenverlust.
 */
const migrateV17ToV18: Migration = (raw) => {
  const ops = raw.operations;
  if (typeof ops === 'object' && ops !== null) {
    const opsRecord = ops as Record<string, unknown>;
    if (typeof opsRecord.transfers !== 'object' || opsRecord.transfers === null) {
      opsRecord.transfers = {};
    }
  }
  raw.schemaVersion = 18;
  return raw;
};

/**
 * v18 → v19: § Change 9.0, Phase S1/S2 — zentraler Start neu gebacken. Die
 * Startregion wurde von 820 auf 1.400 bebaubare Kacheln vergrößert; dabei ändern
 * sich der Rathausanker, die Region-Zuschnitte und drei rotierte Forst-Ids. Wie
 * bei jedem echten Weltumbau (v13→v14, v15→v16) ist eine Koordinaten-/
 * Regionsprojektion nicht verlustfrei: Ein Gebäude aus dem alten kleinen Start
 * kann in der neuen Region-Segmentierung liegen, und „Region 10 erschlossen"
 * bedeutet geografisch etwas anderes. Der Auftrag lässt für genau das den
 * transparenten Weltneustart zu — alter Stand wird EINMALIG unter
 * `cmb.save.backup.world-v18` gesichert, kein stiller Verlust.
 */
const migrateV18ToV19: Migration = (raw) => {
  throw new WorldRebuildSaveError(typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 18);
};

/**
 * v19 → v20: § Active Resource Loops 10.0, R7/R8 — dritte horizontale Verdichtung
 * (X/Z 0,84 zusätzlich, ~−45 % Fläche). 13 → 12 Regionen, jede Koordinate,
 * Region-Id und der Startanker (jetzt Region 9, Rathaus (127,250)) ändern sich
 * gleichzeitig. Wie bei jedem echten Weltumbau (v13→v14, v15→v16, v18→v19) ist
 * eine Koordinaten-/Regionsprojektion nicht verlustfrei — der alte Stand wird
 * EINMALIG unter `cmb.save.backup.world-v19` gesichert und das Spiel startet neu.
 */
const migrateV19ToV20: Migration = (raw) => {
  throw new WorldRebuildSaveError(typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 19);
};

/**
 * v20 → v21: § Stadtarbeit-Stabilität 9.1 (D-037). Rein additiv — der neue,
 * eingefrorene Planungssnapshot `activities.selection` ist optional. Alte Saves
 * besitzen ihn nicht und laufen unverändert weiter (der Controller friert beim
 * nächsten Öffnen des Planers frisch ein). Kein Weltumbau, kein Datenverlust.
 */
const migrateV20ToV21: Migration = (raw) => {
  raw.schemaVersion = 21;
  return raw;
};

/**
 * Migration chain: migrations[n] upgrades a save from schemaVersion n to n+1.
 * Beginnt bei v10 (Insel-Basis).
 */
const migrations: Record<number, Migration> = {
  10: migrateV10ToV11,
  11: migrateV11ToV12,
  12: migrateV12ToV13,
  13: migrateV13ToV14,
  14: migrateV14ToV15,
  15: migrateV15ToV16,
  16: migrateV16ToV17,
  17: migrateV17ToV18,
  18: migrateV18ToV19,
  19: migrateV19ToV20,
  20: migrateV20ToV21,
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

/** Gültiger Save der ersetzten v10–v13-Insel: Backup + transparenter Neustart. */
export class WorldRebuildSaveError extends LegacyWorldSaveError {}

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
      if (error instanceof LegacyWorldSaveError) throw error;
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
