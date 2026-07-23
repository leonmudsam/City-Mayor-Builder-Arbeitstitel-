# WORKER & OPERATION SYSTEM — Arbeiter und Betriebsaufträge (§ Active Operations 2.0)

Code: `src/game/operations/operations.ts`. Typen: `BuildingWorkerState`,
`ActiveBuildingOperation`, `BuildingOperationProfile` (Config).

## Config: Operationsprofil (config-driven, kein neues System)

Ein Gebäude wird durch `BuildingDef.operation` zum aktiven Betrieb. Werte je
Ausbaustufe (Index = `upgradeLevel`):

```ts
operation: {
  resource: 'wood', nodeType: 'tree', nodeTerrain: 'forest',
  efficientRadius: 8, maxRadius: 14,
  stages: [
    { workerSlots: 2, movementSpeed: 7, workSpeed: 30, carryCapacity: 12, storageCapacity: 120 },
    { workerSlots: 4, movementSpeed: 8, workSpeed: 40, carryCapacity: 18, storageCapacity: 260 },
    { workerSlots: 7, movementSpeed: 9, workSpeed: 55, carryCapacity: 26, storageCapacity: 600 },
  ],
}
```

Höhere Stufen verbessern damit **nicht** pauschal „+X/min", sondern Arbeiter,
Tempo, Traglast und Lager (§5) — genau wie im Auftrag gefordert.

## Tick: Arbeiter-Zustandsmaschine

`advanceOperations(state, config, dtMin, now)` läuft in `advanceLiveEconomy`
(nur live). Pro Arbeiter:

```
idle/waiting → (Auftrag + freier Knoten, Lager nicht voll) → walking_to_target
   → working (fällt bis Traglast oder Baum leer) → returning
   → Einlagern ins lokale Lager → idle    | Lager voll → blocked
```

- **Bewegung**: Tile-Distanz Betrieb↔Knoten ÷ `movementSpeed`, `worker.x/y` wird
  linear interpoliert (für die additive Renderer-Darstellung).
- **Wegeffizienz** (§6): volle Leistung im `efficientRadius`, linear reduziert bis
  `MIN_RANGE_EFFICIENCY` (0.55) am `maxRadius`.
- **Standortgüte** (§6): Terrain-/Regionsbonus (Wald) als sanfter Tempo-Faktor.
- **Reservierung**: ein Knoten wird per `reservedBy = "buildingId#workerId"` belegt,
  zwei Arbeiter fällen nie denselben Baum. Erschöpfung setzt `regenerationAt`.
- **Gutschrift erst bei Einlagerung** (§23). Volles Lager ⇒ `blocked` (§26.8).
- **Zeitfaktor**: `dtMin` ist bereits skaliert ⇒ Pause/2×/4× wirken automatisch
  (§26.22), offline läuft nichts (§26.23).

Auftrag = `ActiveBuildingOperation` mit `targetNodeIds` (bestätigte Auswahl /
Arbeitsgebiet, Reihenfolge = Bearbeitungsreihenfolge). Sind keine bearbeitbaren
Knoten mehr da und kein Arbeiter mehr unterwegs, schließt der Auftrag automatisch
ab (§16: keine Einzelklickpflicht — der Betrieb arbeitet ein Gebiet selbstständig
ab und stoppt bei vollem Lager / erschöpfter Zone).

## Commands & Read-Helper (GameController)

`startBuildingOperation(id, radius?, maxCount?)` (Arbeitsgebiet),
`startBuildingOperationWithNodes(id, nodeIds)` (Einzelbäume),
`cancelBuildingOperation`, `pauseBuildingOperation`, `resumeBuildingOperation`.
Read: `getBuildingOperationInfo`, `getBuildingOperationPreview`,
`getBuildingWorkers`, `getResourceNodesNear`, `getBuildingWorkArea`,
`getWorkerRenderStates` (Renderer).

## Offen (nächste Phasen)

- Warteschlange mehrerer Aufträge, Prioritätszonen (§2/§16), Vorarbeiter-
  Automatisierung (A10).
- Steinbruch/Farm/Feuerwehr als weitere `operation`-Profile bzw. Einsatz-Dispatch
  (A6–A8) — dasselbe Framework, keine Parallel-Simulation.
- 3D-Arbeitsanimationen (Fällen/Tragen) und Einzelbaum-Auswahl per Raycast.
