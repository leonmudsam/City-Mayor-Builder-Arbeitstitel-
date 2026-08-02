import type { GameConfig } from './config/index.ts';
import { startRegionConfig } from './config/startRegion.config.ts';
import type { GameState } from './types.ts';
import { allRegionIds, createRegionStub } from './map/world.ts';

/**
 * v31 (Straßen-, Höhen- und Terrain-Overhaul): additive, eingefrorene
 * `BuildingInstance.roadEngineering`-Metadaten für automatisch gewählte
 * Straßenvarianten und Deckhöhen. Alte Straßen bleiben ohne Feld gültig und
 * werden zur Laufzeit kompatibel projiziert; Migration v30→v31 ist verlustfrei.
 * v30 (§ Stadtarbeit-Overhaul P2, D-050): additive Ausführungsart
 * `ActiveActivity.mode` (`auto` = die Stadt fährt, `manual` = der Spieler fährt).
 * Alte Saves bleiben ladbar; ein v29-Stand ohne das Feld verhält sich exakt wie
 * bisher (`auto`). Keine Welt-, Balancing- oder Koordinatenänderung —
 * Migration `v29→v30` ändert nur die Versionsnummer.
 * v27 (§ Welt-Feinschliff 12.2, Spieltest 30.07.2026): FREIE GRÜNDUNG + NEUE
 * SEGMENTIERUNG. Ein neues Spiel startet OHNE Rathaus, ohne Distrikt und ohne
 * Startstraßen — der Spieler wählt den Gründungsplatz selbst (`foundCity`).
 * Gleichzeitig verschiebt das relief-gesteuerte Uferprofil die Region-Cluster:
 * neun statt acht Regionen, Startregion jetzt Id 9, jede Id beschreibt eine
 * andere Landschaft. Weltumbau wie v25→v26: alte Stände werden einmalig unter
 * `cmb.save.backup.world-v26` gesichert und neu gestartet (Migration `v26→v27`).
 * v26 (§ World Overhaul 12.0, D-041): VOLLSTÄNDIGER WELTAUSTAUSCH. Neue
 * Weltgrundlage `reference/world/new island 3d model.glb`; jede Höhe, jedes
 * Terrain, alle 13 Region-Zuschnitte, die Startregion (jetzt Id 13
 * „Gründerland") und der Rathausanker (237,256) sind neu. Zusätzlich läuft das
 * Terraforming jetzt VOR der Regionssegmentierung, damit Regionen und Statistik
 * das fertige, bespielbare Gelände beschreiben. Weltumbau wie v14/v16/v19/v20:
 * alte Stände werden einmalig unter `cmb.save.backup.world-v25` gesichert und
 * neu gestartet (Migration `v25→v26`).
 * v21 (§ Stadtarbeit-Stabilität 9.1, D-037): additiver, eingefrorener
 * Planungssnapshot `activities.selection` eines noch nicht gestarteten Auftrags.
 * Alte Saves bleiben ladbar (Migration v20→v21 lässt das Feld schlicht weg);
 * keine Welt- oder Balancing-Änderung.
 * v20 (§ Active Resource Loops 10.0, R7/R8 — dritte horizontale Verdichtung):
 * X/Z 0,84 ZUSÄTZLICH (~−45 % Gesamtfläche ggü. Ur-Insel), 12 statt 13 Regionen,
 * neuer zentraler Start (Region 9, Rathaus (127,250), 1.596 bebaubar, endlich mit
 * Küstenzugang). Jede Koordinate, Region-Id und der Startanker ändern sich —
 * Weltumbau wie v14/v16/v19. Alte Stände werden einmalig unter
 * `cmb.save.backup.world-v19` gesichert und neu gestartet (Migration `v19→v20`).
 * v19 (§ Change 9.0, zentraler Start): Startregion von 820 auf 1.400 bebaubare
 * Kacheln vergrößert (neuer Bake) — neuer Rathausanker, neue Region-Zuschnitte,
 * drei rotierte Forst-Ids. Weltumbau: alte Stände werden einmalig unter
 * `cmb.save.backup.world-v18` gesichert und neu gestartet (Migration `v18→v19`).
 * v18 (Active Operations 2.0, A5 Transport): additiver `operations.transfers`-
 * Katalog laufender Lagertransporte. Alte Saves bleiben ladbar (Migration
 * v17→v18 ergänzt ein leeres `transfers`); keine Weltänderung.
 * v17 (Active Operations 2.0): additive lokale Betriebslager, Arbeiterzustände,
 * aktive Aufträge und Ressourcenknoten-Deltas (`GameState.operations`). Alte
 * Saves bleiben ladbar (Migration v16→v17 ergänzt ein leeres `operations`).
 * v16 (Final World Compaction 8.1): zweite horizontale Verdichtung, 13-Regionen-
 * Struktur, Save-Neustart aus v10–v15.
 * v15 (Terrain & World Scale Overhaul 6.1): kompaktere Insel, zentraler Start,
 * angehobene Wasserlinie und neue Ufer-/Regionskoordinaten. v14 wird vor dem
 * kontrollierten Weltneustart einmalig gesichert.
 * v14 (World Rebuild 6.0): neue 512er-Insel, neue Regions- und Weltkoordinaten.
 * v13-Saves werden vor einem sanktionierten Weltneustart einmalig gesichert;
 * eine Koordinatenprojektion wäre nicht zuverlässig genug.
 * v13 (§ Stadtarbeit-Logik 2.0): eine laufende Fahrmission kann die an der
 * Quelle reservierte Ladung (`ActiveActivity.reserved`) speichern. v12-Saves
 * bleiben gültig; ihre Missionen ziehen die Lieferkosten wie bisher pro Ziel.
 * v12 (§ Stadtarbeit 2D): laufende Fahrmissionen speichern Fahrzeugklasse und
 * manuell gezeichnete Straßenkette.
 */
export const SCHEMA_VERSION = 32;

export function createNewGame(config: GameConfig, cityName: string, now: number): GameState {
  const state: GameState = {
    schemaVersion: SCHEMA_VERSION,
    meta: { cityName, createdAt: now, lastSimTime: now, playTimeSec: 0 },
    rngSeed: (now % 2147483647) | 1,
    level: { current: 1, xp: 0 },
    resources: { ...config.balancing.startResources },
    gold: { balance: config.balancing.startGold },
    goldTransactions: [],
    policy: { residentialTaxRate: 1, commercialTaxRate: 1 },
    world: { regions: {}, districts: {} },
    buildings: {},
    citizens: {
      population: 0,
      happiness: 75,
      needs: {
        housing: { supply: 0, demand: 0, fulfillment: 1 },
        water: { supply: 0, demand: 0, fulfillment: 1 },
        food: { supply: 0, demand: 0, fulfillment: 1 },
        work: { supply: 0, demand: 0, fulfillment: 1 },
        leisure: { supply: 0, demand: 0, fulfillment: 1 },
        energy: { supply: 0, demand: 0, fulfillment: 1 },
        safety: { supply: 0, demand: 0, fulfillment: 1 },
        health: { supply: 0, demand: 0, fulfillment: 1 },
        freshwater: { supply: 0, demand: 0, fulfillment: 1 },
      },
    },
    mayor: { houseLevel: 0, reputation: 50, actionCooldowns: {}, messages: [] },
    quests: { completed: [], active: [] },
    buffs: [],
    events: [],
    activities: { cooldowns: {}, fulfilledContracts: [] },
    // § Active Operations 2.0: leeres Betriebssystem; Betriebslager/Arbeiter/
    // Knoten-Deltas entstehen erst mit dem ersten Arbeitsauftrag.
    operations: { inventories: {}, workers: {}, active: {}, nodeDeltas: {}, transfers: {} },
    stats: {
      built: {},
      produced: { money: 0, wood: 0, stone: 0, food: 0, freshwater: 0 },
      mayorActions: {},
      // Counts only regions the player actively unlocks — the start region is
      // free and does not count towards expansion quests (§5).
      regionsUnlocked: 0,
      upgradesCompleted: 0,
      upgraded: {},
      tradeEarnings: 0,
      activitiesCompleted: 0,
    },
    nextId: 0,
  };

  // Alle organischen Regionen als Stubs anlegen (§ Welt 2.0 / Slim-Save):
  // sichtbar ab der ersten Minute (gesperrt/vernebelt), Geometrie und Terrain
  // kommen live aus dem Insel-Bake. Nur die vom Bake gewählte Startregion ist frei.
  for (const id of allRegionIds()) {
    const stub = createRegionStub(id);
    state.world.regions[String(id)] = stub;
  }
  const startRegion = state.world.regions[String(startRegionConfig.startRegionId)];
  if (startRegion) startRegion.status = 'unlocked';

  // § 12.2 (Nutzerwunsch): DAS RATHAUS WIRD NICHT MEHR VORPLATZIERT.
  //
  // „Das Rathaus soll man am Anfang selbst entscheiden können wo man es
  // platziert." Ein neues Spiel startet deshalb ohne Gebäude, ohne Distrikt und
  // ohne Startstraßen; die Gründung ist der erste Zug des Spielers
  // (`GameController.foundCity`). Der vom Bake validierte Anker bleibt als
  // VORSCHLAG erhalten (`startRegionConfig.townHall`) — die Kamera startet dort
  // und die UI markiert ihn, aber nichts erzwingt ihn.
  //
  // Damit ist „Stadt gegründet?" keine zusätzliche Save-Variable, sondern
  // schlicht: existiert ein `town_hall`-Gebäude? Ein Zustand, der nicht
  // gespeichert wird, kann auch nicht mit der Welt auseinanderlaufen.
  return state;
}
