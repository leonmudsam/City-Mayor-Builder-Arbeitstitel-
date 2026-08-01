# ACTIVE OPERATIONS PLAN — Aktive Betriebs-, Lager- und Logistik-Ökonomie 2.0

> Status: **Phase A1–A7 umgesetzt** — Sägewerk-Referenzschnitt + Lagertransport
> ins Zentrallager (v0.79), **Steinbruch + Farm (v1.25, D-046)**; A8–A10 geplant.
> Die Aussage weiter unten „Nur das Sägewerk erhält vorerst dieses Profil" gilt
> seit v1.25 **nicht mehr**: drei Betriebe teilen sich dieselbe Schleife, Stein
> wächst dabei nie nach. Verbindlicher Einstieg für die
> Weiterarbeit an diesem System. Ergänzt: `RESOURCE_NODE_SYSTEM.md`,
> `LOCAL_INVENTORY_SYSTEM.md`, `WORKER_OPERATION_SYSTEM.md`,
> `LOGISTICS_INTEGRATION.md` (A5-Details).

## 0. Zielbild

Ersetze die passive „Gebäude existiert → Ressource pro Minute → globales Lager"-
Logik durch ein **aktives, physisch nachvollziehbares** System: Der Spieler erteilt
Arbeitsaufträge, Arbeiter laufen sichtbar zu Ressourcenknoten, bearbeiten sie,
tragen die Ware zurück ins **lokale Betriebslager**; ein volles Lager stoppt die
Arbeit nachvollziehbar. Der Transport ins spielbare Gesamtlager ist eine spätere
Phase (A5) — **bis dahin ist Sägewerkholz bewusst lokal gebunden** (§7.2 des
Auftrags: „Nicht jede lokal vorhandene Ressource darf automatisch überall für
Bauprojekte verwendet werden").

Das Sägewerk ist der **vertikale Referenzschnitt** (Auftrag §27). Steinbruch, Farm,
Feuerwehr und Automatisierung übernehmen dasselbe Framework erst nach erfolgreichem
Referenzschnitt (§27.15).

## 1. Audit — wo passive Produktion heute entsteht (Auftrag §27.1–2)

| Ort | Verhalten |
|---|---|
| `src/game/simulation/tick.ts` → `advanceLiveEconomy`, **Schritt 2** (Z. 154–181) | Für jedes beitragende Gebäude werden `produce`-Effekte als `perMinute × bonus × efficiency × dtMin` **direkt** in `state.resources[resource]` (globales Stadtlager) gebucht, gedeckelt durch `derived.storageCaps`. Auch `stats.produced[resource]` wächst hier. |
| `src/game/simulation/derived.ts` → `recomputeDerived` (Z. 154–188) | `produce`-Effekte werden zu `productionPerMin` und `productionBonus` (Terrain-/Regions-/Logistik-Bonus) aggregiert — die Zahl, die die UI als „+X/min" zeigt. |
| `src/game/buildings/effects.ts` → `effectiveEffects` | Liefert die Effekte der **aktuellen** Ausbaustufe (`upgradeLevel`). |
| `src/game/config/buildings.config.ts` → `sawmill` | `effects: [{ type:'produce', resource:'wood', perMinute:45 }, …]`, Stufen 100/260. |

**Konsequenz:** Wood entstand allein durch Zeit. Genau dieser Pfad wird für Gebäude
mit `operation`-Profil abgeschaltet.

## 2. Kernentscheidung (D-031): Passiv → Aktiv, config-gated und lokalisiert

- Ein Gebäude mit `BuildingDef.operation` ist ein **aktiver Betrieb**. Für solche
  Gebäude wird der passive `produce`-Pfad **übersprungen** — sowohl im Tick
  (keine automatische Gutschrift) als auch in `derived` (keine Passiv-`+X/min`).
- **Nur das Sägewerk** erhält vorerst dieses Profil. Steinbruch/Farm/Werk laufen
  bis zu ihrer Phase unverändert passiv weiter — so bleibt die Gesamtbalance und
  die grüne Testsuite stabil, und die Verhaltensänderung ist exakt lokalisiert
  (Auftrag §27: „Beginne ausschließlich mit dem Sägewerk").
- Geerntetes Holz landet **ausschließlich im lokalen Sägewerklager**
  (`BuildingInventory`). Ein volles Lager pausiert die Aufträge (§26.8).
  `state.resources.wood` wächst durch das Sägewerk **nicht** mehr automatisch
  (§26.9). Der spielbare Transport ins Zentrallager ist **Phase A5**.

Das ist die ehrliche, nicht-magische Umsetzung des Referenzschnitts: Der aktive
Loop (Auftrag → laufen → arbeiten → tragen → lokal einlagern → Voll-Stopp) ist
vollständig und getestet; die Verknüpfung ins Gesamtlager folgt mit echtem
Transport (Fahrzeug/Route/Straßenqualität) in A5 — sie wird **nicht** vorgetäuscht.

## 3. Datenmodelle (persistiert, additiv, Save v17)

Ein neues, **optionales** Top-Level-Feld `GameState.operations` bündelt alles; alte
Saves ohne das Feld bleiben gültig (Migration `v16→v17` reicht durch, initialisiert
lazily). Siehe `LOCAL_INVENTORY_SYSTEM.md`, `WORKER_OPERATION_SYSTEM.md`,
`RESOURCE_NODE_SYSTEM.md` für Details.

```ts
interface OperationsState {
  inventories: Record<BuildingId, BuildingInventory>;   // lokales Lager je Betrieb
  workers:     Record<BuildingId, BuildingWorkerState[]>;// Arbeiterzustände
  active:      Record<BuildingId, ActiveBuildingOperation>; // ein aktiver Auftrag je Betrieb
  nodeDeltas:  Record<NodeId, ResourceNodeDelta>;        // NUR Abweichungen (reserviert/erschöpft/nachwachsend)
}
```

- **Ressourcenknoten** sind — wie das Terrain — **deterministisch aus der Welt
  abgeleitet** (Wald-Kachel + Positions-Hash ⇒ Baumknoten), persistiert werden nur
  die **Deltas** (reserviert/erschöpft/Regenerationszeit). NodeId = `"x,y"`. Das
  hält den Save winzig (dieselbe Slim-Save-Philosophie wie Terrain/Belegung) und
  gibt jedem Baum eine **stabile Id** (§3.1). Renderer-Instanz → NodeId → Knoten.
- **Arbeiter** speichern nur Logik-Zustand (Status, Zielknoten, Fortschritt,
  getragene Menge), **nicht** Animationsposen (§4, §21). Die exakte Laufanimation
  ist Rendererzustand; die Tile-Position des Arbeiters kommt aus der Sim, der
  Renderer zeichnet sie additiv.

## 4. Tick-Logik (rein, zeitfaktor-korrekt)

`advanceOperations(state, config, derived, dtMin)` läuft in `advanceLiveEconomy`
(nur live, nie offline — §14/§26.23). Weil derselbe `dtMin`-Pfad benutzt wird,
skalieren Pause/1×/2×/4× **automatisch** korrekt (§26.22). Arbeiter-Zustandsmaschine:

```
idle → (Auftrag+freier Knoten) → walking_to_target → working → carrying → returning → deposit → idle
```

- `walking`/`returning`: Tile-Distanz ÷ `movementSpeed` (Tiles/min).
- `working`: `node.remainingAmount` sinkt mit `workSpeed`; Knoten wird bei Start
  **reserviert**, bei 0 **depleted** + `regenerationAt` gesetzt.
- `carrying`: bis `carryCapacity`; Gutschrift ins lokale Lager **erst bei
  Einlagerung** (§23). Volles Lager ⇒ Arbeiter `blocked`, Auftrag pausiert.
- Regeneration: depletierte Knoten werden nach Ablauf wieder `available` (nur auf
  gültigem Terrain, das ist durch die Ableitung garantiert — §26.14/15).

## 5. Commands & Read-Helper (GameController)

Commands: `startBuildingOperation`, `setBuildingOperationArea`, `cancelBuildingOperation`,
`pauseBuildingOperation`, `resumeBuildingOperation`. Read-Helper:
`getBuildingInventory`, `getBuildingWorkers`, `getBuildingOperation`,
`getBuildingOperationPreview`, `getResourceNodesNear`, `getBuildingWorkArea`,
`getWorkerRenderStates`. Keine direkte Mutation aus React/Three (CLAUDE.md §1).

## 6. Bewusst offen / nächste Phasen

- **A5 Transport/Logistik — UMGESETZT (v0.79):** `createInventoryTransfer` mit
  Fahrzeug + Route (Straßenqualität/Distanz/Verkehr → Fahrzeit) und Einlagerung
  ins Zentrallager (globaler Pool über ein Lagergebäude). Verwendet
  `activities/logistics.ts` + `routeAnalysis.ts` wieder (kein zweites System).
  Netzwerk-Übersicht global/lokal/reserviert/unterwegs (§7.2). Reine Sim:
  `src/game/operations/transport.ts`. Reste (Mehrfachladung, Rückruf während der
  Fahrt, Betriebskosten, Zwischenlager) siehe `LOGISTICS_INTEGRATION.md`.
- **A6 Steinbruch, A7 Farm, A8 Feuerwehr-Dispatch, A9 Regeneration-Ausbau
  (Aufforstung/neue Vorkommen), A10 Automatisierung (Vorarbeiter/Zonen/Regeln).**
- **Renderer:** 3D-Einzelbaum-Raycast im Arbeitsmodus + Arbeitsanimationen
  (Fäll-/Trag-Posen). Aktuell zeichnet der Renderer Arbeiter als einfache Agenten
  an ihrer Sim-Tile-Position (additiv, performant). Der Arbeitsmodus wählt die
  Fläche vorerst über das Gebäudefenster (Radius/Anzahl), nicht per 3D-Klick.

Diese offenen Punkte stehen in `OPEN_TASKS.md` und dürfen in der UI **nicht**
vorgetäuscht werden (CLAUDE.md).
