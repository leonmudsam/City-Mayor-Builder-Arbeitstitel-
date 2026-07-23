# LOCAL INVENTORY SYSTEM — Lokale Betriebslager (§ Active Operations 2.0)

Typen: `BuildingInventory` in `src/game/types.ts`. Zugriff/Logik:
`src/game/operations/operations.ts`. UI-Sicht: `GameController.getBuildingInventory`.

## Prinzip

Jeder aktive Betrieb besitzt ein **lokales Lager** (`state.operations.inventories[buildingId]`):

```ts
interface BuildingInventory {
  capacity: number;                         // Stufenabhängig (Sägewerk: 120/260/600)
  items:    Partial<Record<ResourceId, number>>;
  reserved: Partial<Record<ResourceId, number>>; // für spätere Transporte gebunden
}
```

Geerntetes Holz landet **ausschließlich hier** (§7.1/§26.7). Das globale
`state.resources.wood` wächst durch das Sägewerk **nicht** mehr automatisch
(§26.9). Ein **volles Lager stoppt die Arbeit** (§26.8): Arbeiter mit Ladung werden
`blocked`, idle Arbeiter `waiting`, bis wieder Platz ist.

## Verhältnis zum globalen Stadtlager (Übergang)

Für diesen Referenzschnitt bleibt das globale `resources`-Objekt der spielbare
Zentral-/Übergangsbestand (§21): Startvorräte, Quest-/Handelserträge und die noch
passiven Produzenten (Steinbruch, Farm, Wasserwerk) fließen weiter dorthin. Der
**Transport vom lokalen Sägewerklager ins Zentrallager ist Phase A5** — bis dahin
ist Sägewerkholz bewusst lokal gebunden (das ist die vom Auftrag gewollte
Logistik-Reibung, §7.2/§8; sie wird nicht durch eine magische Sofortgutschrift
umgangen).

`stats.produced.wood` wird beim Einlagern erhöht — das Holz **wurde** real
produziert, es liegt nur lokal. So bleiben `produce`-Quests stimmig.

## Read-Helper (UI)

`getBuildingInventory(id)` → `{ capacity, used, free, items, reserved }`.
`getBuildingOperationInfo(id).inventory` bündelt dasselbe fürs Gebäudefenster,
plus `storageFull`.

## Offen (A5+)

- `createInventoryTransfer(source, target, resource, amount, vehicle?)` und
  `assignWarehouseToBuilding` — Transport mit Fahrzeug/Route/Straßenqualität; nutzt
  `activities/logistics.ts` + `routeAnalysis.ts` (kein zweites Logistiksystem, §8).
- Netzwerksicht `getInventoryNetworkOverview` (gesamt/erreichbar/lokal/reserviert/
  unterwegs, §7.2) für das globale HUD.
- `incoming`/`outgoing` am Inventar (für laufende Transfers).
