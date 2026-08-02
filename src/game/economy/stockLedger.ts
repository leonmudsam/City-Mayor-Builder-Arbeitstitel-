// Bestandsregister der Stadt (§ Stadtarbeit P4, §8 „Keine globale magische
// Ressource. Jedes Lager hat eigene Bestände").
//
// AUSGANGSLAGE, gemessen: 34 Gebäudetypen — 3 aktive Betriebe (Sägewerk,
// Steinbruch, Farm) mit lokalem Lager, 7 Lagergebäude (Rathaus, Distriktzentrum,
// Lagerhaus, Wasserwerk, Markt, Anleger, Flusshafen) und KEINE Überschneidung.
// Genau diese Trennung macht das Register möglich, ohne ein drittes Lagermodell
// anzulegen (CLAUDE.md §2/§8):
//
//   • Betriebslager (`operation`)  — Ware ist LOKAL gebunden, zählt NICHT zum Pool.
//     Unverändert seit Save v17; `operations/transport.ts` bringt sie in die Stadt.
//   • Stadtlager (`storage`-Effekt) — Ware IST der Pool, nur eben an einem Ort.
//
// INVARIANTE:  state.resources[r] === Σ Stadtlager-Bestand[r]   (r ≠ money)
//
// `state.resources` bleibt damit die Bilanzsumme, die die gesamte Wirtschaft
// weiterhin liest (Baukosten, Verbrauch, Quests, Balancing) — dieses Modul sagt
// zusätzlich, WO die Ware liegt. Ohne diese Trennung wäre jede Wahl eines Lagers
// in der Stadtarbeit eine Attrappe: der Spieler führe zu einem Gebäude, das gar
// keinen eigenen Bestand hat.
//
// Geld ist bewusst ausgenommen — es liegt in keinem Lagerhaus.
//
// Reines Sim-Modul: kein three/react/zustand/Renderer (CLAUDE.md §1).

import type { GameConfig } from '../config/index.ts';
import type { BuildingInventory, GameState, ResourceId } from '../types.ts';
import type { Derived, StorageSite } from '../simulation/derived.ts';
import { effectiveEffects } from '../buildings/effects.ts';

/** Ressourcen, die physisch in Lagern liegen (Geld liegt in keinem Lagerhaus). */
export const LEDGER_RESOURCES: readonly ResourceId[] = ['wood', 'stone', 'food', 'freshwater'];

export function isLedgerResource(resource: ResourceId): boolean {
  return LEDGER_RESOURCES.includes(resource);
}

/** Bestand eines Stadtlagers für eine Ressource (mit Kapazität und Restplatz). */
export interface StockShare {
  site: StorageSite;
  stored: number;
  capacity: number;
  free: number;
}

/**
 * Ist dieses Gebäude ein STADTLAGER (Bestand gehört zum Pool)? Abgeleitet aus der
 * Config, nicht aus dem State — dieselbe Bedingung, aus der `derived.storageSites`
 * entsteht. Aktive Betriebe sind es nie (ihr Lager ist lokal gebunden).
 */
export function isCityStorageBuilding(state: GameState, config: GameConfig, buildingId: string): boolean {
  const b = state.buildings[buildingId];
  if (!b) return false;
  const def = config.buildings.get(b.defId);
  if (!def || def.operation) return false;
  return effectiveEffects(def, b.upgradeLevel).some((eff) => eff.type === 'storage');
}

function ensureOps(state: GameState): NonNullable<GameState['operations']> {
  state.operations ??= { inventories: {}, workers: {}, active: {}, nodeDeltas: {} };
  return state.operations;
}

/** Lagereintrag eines Stadtlagers, angelegt/aktualisiert auf die Gesamtkapazität. */
function ensureLedgerInventory(state: GameState, site: StorageSite): BuildingInventory {
  const ops = ensureOps(state);
  const capacity = Object.values(site.caps).reduce((sum, v) => sum + (v ?? 0), 0);
  let inv = ops.inventories[site.buildingId];
  if (!inv) {
    inv = { capacity, items: {}, reserved: {} };
    ops.inventories[site.buildingId] = inv;
  } else if (inv.capacity !== capacity) {
    inv.capacity = capacity;
  }
  return inv;
}

/** Bestand einer Ressource an einem Gebäude (0, wenn kein Lager vorhanden). */
export function stockAt(state: GameState, buildingId: string, resource: ResourceId): number {
  return state.operations?.inventories[buildingId]?.items[resource] ?? 0;
}

/**
 * Alle Stadtlager mit Bestand/Kapazität für eine Ressource, deterministisch nach
 * Gebäude-Id (die Ordnung von `derived.storageSites`). Lager ohne Fassungsvermögen
 * für diese Ressource tauchen nicht auf — ein Wasserwerk ist kein Holzlager.
 */
export function stockShares(state: GameState, derived: Derived, resource: ResourceId): StockShare[] {
  const shares: StockShare[] = [];
  for (const site of derived.storageSites) {
    const capacity = site.caps[resource] ?? 0;
    if (capacity <= 0) continue;
    const stored = stockAt(state, site.buildingId, resource);
    shares.push({ site, stored, capacity, free: Math.max(0, capacity - stored) });
  }
  return shares;
}

/** Summe des verorteten Bestands (muss `state.resources[resource]` entsprechen). */
export function totalStored(state: GameState, derived: Derived, resource: ResourceId): number {
  let sum = 0;
  for (const site of derived.storageSites) sum += stockAt(state, site.buildingId, resource);
  return sum;
}

/** Rundet auf 1e-6 — hält Fließkomma-Drift aus der Invariante heraus. */
function tidy(value: number): number {
  return Math.abs(value) < 1e-6 ? 0 : Math.round(value * 1e6) / 1e6;
}

function setStored(inv: BuildingInventory, resource: ResourceId, value: number): void {
  const v = tidy(Math.max(0, value));
  if (v === 0) delete inv.items[resource];
  else inv.items[resource] = v;
}

/**
 * Ergebnis eines Abgleichs. `unassigned` ist die Menge, die im Pool steht, aber
 * in KEIN Lager passt (mehr Ware als Fassungsvermögen). Im regulären Spiel ist
 * sie 0, weil `grantResources` schon gegen `storageCaps` deckelt; sie wird
 * gemeldet statt still verrechnet, damit ein echter Fehler nicht als
 * „Ressourcen verschwinden" auftritt.
 */
export interface StockReconciliation {
  unassigned: Partial<Record<ResourceId, number>>;
}

/**
 * Stellt die Invariante wieder her: was der Pool ausweist, liegt danach in echten
 * Lagern. Zuwächse (Produktion, Belohnungen, Anlieferungen) füllen die Lager mit
 * dem meisten freien Platz, Abflüsse (Verbrauch, Baukosten) ziehen anteilig aus
 * den vollsten — beides deterministisch in der Ordnung von `derived.storageSites`.
 *
 * WARUM ein Abgleich statt Buchung an jeder Stelle: `state.resources` wird an 31
 * Stellen in 8 Modulen verändert. Ein Register, das an jeder einzelnen mitgepflegt
 * werden muss, driftet beim ersten vergessenen Aufruf. Der Abgleich läuft an EINER
 * Stelle (`GameController.notify`) und kann deshalb nicht übersehen werden.
 * Gezielte Vorgänge (an DIESEM Lager laden) gehen über `withdrawStock`/
 * `depositStock` und bleiben dadurch trotzdem ortsgenau.
 */
export function reconcileStock(state: GameState, config: GameConfig, derived: Derived): StockReconciliation {
  const unassigned: Partial<Record<ResourceId, number>> = {};
  const siteIds = new Set(derived.storageSites.map((s) => s.buildingId));

  // Verwaiste Registereinträge: ein Stadtlager, das abgerissen wurde oder seinen
  // Straßenanschluss verloren hat, ist kein Lagerort mehr. Seine Ware bleibt in
  // der Bilanz (der Pool ist die Wahrheit) und wird unten neu verteilt — hier
  // wird nur der tote Eintrag entfernt, damit er nicht später doppelt zählt.
  const ops = state.operations;
  if (ops) {
    for (const buildingId of Object.keys(ops.inventories)) {
      if (siteIds.has(buildingId)) continue;
      // Abgerissen: der Lagerplatz existiert nicht mehr — das gilt für Stadtlager
      // wie für Betriebslager. Ein zurückgelassener Eintrag zählte später doppelt.
      const gone = state.buildings[buildingId] === undefined;
      // Noch vorhanden, aber kein Lagerort mehr (Straßenanschluss verloren,
      // pausiert): auch dann verwaltet das Register seinen Bestand nicht mehr.
      // Betriebslager bleiben unangetastet — ihre Ware gehört nie zum Pool.
      if (!gone && !isCityStorageBuilding(state, config, buildingId)) continue;
      delete ops.inventories[buildingId];
    }
  }

  for (const resource of LEDGER_RESOURCES) {
    const shares = stockShares(state, derived, resource);
    if (shares.length === 0) {
      const pool = state.resources[resource];
      if (pool > 0) unassigned[resource] = tidy(pool);
      continue;
    }

    // Überzählige Bestände kappen (Abstufung/Umbau verkleinert ein Lager).
    let total = 0;
    for (const share of shares) {
      const capped = Math.min(share.stored, share.capacity);
      if (capped !== share.stored) {
        setStored(ensureLedgerInventory(state, share.site), resource, capped);
        share.stored = capped;
        share.free = share.capacity - capped;
      }
      total += capped;
    }

    let delta = tidy(state.resources[resource] - total);
    if (delta > 0) {
      // Auffüllen nach freiem Platz: die Ware landet dort, wo Platz ist.
      let freeTotal = shares.reduce((sum, s) => sum + s.free, 0);
      for (const share of shares) {
        if (delta <= 0 || freeTotal <= 0) break;
        const take = Math.min(share.free, (share.free / freeTotal) * delta);
        if (take <= 0) continue;
        setStored(ensureLedgerInventory(state, share.site), resource, share.stored + take);
        share.stored += take;
        share.free -= take;
        delta = tidy(delta - take);
        freeTotal -= take;
      }
      // Rundungsrest deterministisch an das erste Lager mit Platz.
      for (const share of shares) {
        if (delta <= 0) break;
        const take = Math.min(share.free, delta);
        if (take <= 0) continue;
        setStored(ensureLedgerInventory(state, share.site), resource, share.stored + take);
        share.stored += take;
        share.free -= take;
        delta = tidy(delta - take);
      }
      if (delta > 0) unassigned[resource] = delta;
    } else if (delta < 0) {
      // Abziehen anteilig zum Bestand — kein Lager wird bevorzugt leergeräumt.
      let need = -delta;
      let storedTotal = shares.reduce((sum, s) => sum + s.stored, 0);
      for (const share of shares) {
        if (need <= 0 || storedTotal <= 0) break;
        const take = Math.min(share.stored, (share.stored / storedTotal) * need);
        if (take <= 0) continue;
        setStored(ensureLedgerInventory(state, share.site), resource, share.stored - take);
        storedTotal -= take;
        share.stored -= take;
        need = tidy(need - take);
      }
      for (const share of shares) {
        if (need <= 0) break;
        const take = Math.min(share.stored, need);
        if (take <= 0) continue;
        setStored(ensureLedgerInventory(state, share.site), resource, share.stored - take);
        share.stored -= take;
        need = tidy(need - take);
      }
    }
  }

  return { unassigned };
}

/**
 * Entnimmt an EINEM bestimmten Lager. Zieht Bestand und Bilanzsumme gemeinsam ab
 * — die Ware liegt danach auf dem Fahrzeug, nicht mehr in der Stadt (genau wie
 * `ActiveActivity.reserved` es seit Logistik 2.0/L3 beschreibt). Gibt die
 * tatsächlich entnommene Menge zurück; mehr als vorhanden geht nicht.
 */
export function withdrawStock(
  state: GameState,
  derived: Derived,
  buildingId: string,
  resource: ResourceId,
  amount: number,
): number {
  if (amount <= 0 || !isLedgerResource(resource)) return 0;
  const site = derived.storageSites.find((s) => s.buildingId === buildingId);
  if (!site) return 0;
  const inv = state.operations?.inventories[buildingId];
  if (!inv) return 0;
  const taken = tidy(Math.min(amount, inv.items[resource] ?? 0));
  if (taken <= 0) return 0;
  setStored(inv, resource, (inv.items[resource] ?? 0) - taken);
  state.resources[resource] = tidy(Math.max(0, state.resources[resource] - taken));
  return taken;
}

/**
 * Lagert an EINEM bestimmten Lager ein (Rückgabe abgebrochener Ladung,
 * Anlieferung). Gedeckelt durch die Kapazität dieses Lagers für diese Ressource;
 * gibt die eingelagerte Menge zurück. Der Rest bleibt beim Aufrufer — er wird
 * nicht still in den Pool gebucht, sonst läge Ware nirgends.
 */
export function depositStock(
  state: GameState,
  derived: Derived,
  buildingId: string,
  resource: ResourceId,
  amount: number,
): number {
  if (amount <= 0 || !isLedgerResource(resource)) return 0;
  const site = derived.storageSites.find((s) => s.buildingId === buildingId);
  if (!site) return 0;
  const capacity = site.caps[resource] ?? 0;
  if (capacity <= 0) return 0;
  const inv = ensureLedgerInventory(state, site);
  const stored = inv.items[resource] ?? 0;
  const put = tidy(Math.min(amount, Math.max(0, capacity - stored)));
  if (put <= 0) return 0;
  setStored(inv, resource, stored + put);
  state.resources[resource] = tidy(state.resources[resource] + put);
  return put;
}

/**
 * Lagerorte, an denen eine Ressource wirklich abholbereit liegt — absteigend nach
 * Bestand, bei Gleichstand in Registerordnung. Das ist die Liste, aus der die
 * Stadtarbeit ihre Quelle wählen lässt (§8: „Ich fahre zuerst zum großen Lager
 * im Norden").
 */
export function stockSources(state: GameState, derived: Derived, resource: ResourceId): StockShare[] {
  return stockShares(state, derived, resource)
    .filter((share) => share.stored > 0)
    .sort((a, b) => b.stored - a.stored || (a.site.buildingId < b.site.buildingId ? -1 : 1));
}
