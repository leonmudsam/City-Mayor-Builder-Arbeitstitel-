# LOGISTICS INTEGRATION — Transport & Lieferketten (§ Active Operations 2.0, Phase A5)

> Status: **A5 umgesetzt (v0.79)** — der manuelle Lagertransport bringt lokal
> geerntete Ware ins Zentrallager. Wiederkehrende/automatische Lieferketten (A10)
> und weitere Betriebe (A6–A8) bauen darauf auf. Reine Simulation:
> `src/game/operations/transport.ts` (kein Renderer/React, CLAUDE.md §1).

## Kein doppeltes Logistiksystem (§8)

Der Transport vom lokalen Betriebslager ins Zentrallager verwendet die
vorhandenen Kernmodelle wieder — es entsteht **kein** zweites System:

- `src/game/activities/routeAnalysis.ts` — `analyseActivityRouteFrom` liefert
  Straßengraph-Route, Distanz, Verkehr und geschätzte Fahrzeit. Daraus entsteht
  `travelMs` (× Fahrzeugtempo) und die Straßen-Polyline für die 3D-Fahrt.
- `src/game/activities/logistics.ts` — `vehicleCapacity` (Fahrzeugladung) und die
  benannten Lade-/Entladezeit-Standards.
- Ein manueller Lagertransport ist damit eine **vereinfachte Transportoperation
  innerhalb desselben Systems**, kein neues.

## Umgesetzte Commands/Helper (A5)

```ts
// Command
createInventoryTransfer({ sourceBuildingId, targetBuildingId, resource, amount, vehicleId })
cancelInventoryTransfer(transferId)            // nur während 'loading'
// Read-Helper
getInventoryTransferTargets(sourceId, resource)  // Lagergebäude in Reichweite
getInventoryTransferPreview(input)               // Distanz/Dauer/Warnungen
getAvailableForTransfer(buildingId, resource)    // frei = items − reserved
getBuildingTransfers(buildingId) / getAllTransfers()
getInventoryNetworkOverview()                    // §7.2 (siehe unten)
getTransferRenderStates()                        // interpolierte 3D-Fahrt
```

Ablauf (§8): Betriebslager füllt sich → Spieler wählt „Transport" → Ziel +
Fahrzeug → **Ladung wird im Quell-Lager reserviert** → Fahrzeug lädt (`loading`,
Ware bleibt physisch da) → beim Übergang `in_transit` wird sie aus `items`
entnommen → fährt (`travelMs` aus Straßenklasse/Distanz/Verkehr × Fahrzeugtempo)
→ `unloading` → **Einlagerung in den globalen Pool** (`state.resources`,
gedeckelt durch `derived.storageCaps`). Erst dann ist die Ware global nutzbar.

## Zustandsmaschine (rein, zeitfaktor-korrekt)

```
loading → in_transit → unloading → (delivered<amount ? returning → loading : delivered(entfernt))
```

`advanceTransfers(state, config, derived, dtMin)` läuft in `advanceLiveEconomy`
(nur live, nie offline — §14/§26.23). Weil derselbe `dtMin`-Pfad benutzt wird,
skalieren Pause/1×/2×/4× automatisch korrekt. `stats.produced` wird **nicht**
erneut erhöht (die Ware wurde beim Fällen gezählt — kein Doppelzählen).

**Mehrfachladung:** Ein Transport reserviert die gesamte Menge (auch >
Fahrzeugkapazität). Das Fahrzeug fährt ladungsweise; nach dem Entladen kehrt es
bei Restmenge leer zurück (`returning`) und lädt nach. Jede tatsächlich gefahrene
Ladung kostet die Fahrzeug-Betriebskosten (`operatingCost`, Geldsenke §15,
gefloort auf 0). `onboard`/`delivered` verfolgen die Teilmengen.

**Rückruf:** `cancelInventoryTransfer` funktioniert in jedem Zustand (außer
`delivered`): die unverladene Reservierung wird gelöst, die auf dem Fahrzeug
befindliche Ladung kehrt — soweit Platz ist — ins Quell-Lager zurück; bereits
eingelagerte Teilmengen bleiben global.

## Netzwerk-Übersicht (§7.2)

`inventoryNetworkOverview(state)` schlüsselt jede Ressource ehrlich auf:

- **global** — zentral verfügbar (das, was die obere HUD-Leiste zeigt).
- **localBound** — in Betriebslagern, frei (noch nicht für Transport gebunden).
- **reserved** — in Betriebslagern für einen Transport reserviert.
- **inTransit** — auf Fahrzeugen unterwegs (aus dem Lager entnommen).

Das macht sichtbar, dass lokal geerntete Ware **erst nach dem Transport** global
nutzbar ist (§7.2: „Nicht jede lokal vorhandene Ressource darf automatisch
überall für Bauprojekte verwendet werden"). Nichts wird vorgetäuscht.

## Renderer

Laufende Transporte erscheinen als gepoolte Fahrzeuge (`updateVehicles`) an ihrer
aus der Simulation interpolierten Position entlang der Straßen-Polyline (additiv,
konstante Draw-Calls). Die Polyline wird deterministisch aus dem Straßengraph
rekonstruiert und **nicht** persistiert (Slim-Save).

## Save (v18, additiv)

`operations.transfers` (Key = transferId) persistiert nur Skalare
(Quelle/Ziel/Ressource/Menge/Fahrzeug/Status/Fortschritt/`travelMs`/Distanz).
Migration `v17→v18` ergänzt ein leeres `transfers`. Alte Saves bleiben ladbar.

## Umgesetzt (A5-Reste, v0.79)

- **Mehrere Ladungen / Nachfüllfahrten** in einem Auftrag (Fahrzeug pendelt).
- **Rückruf jederzeit** (auch während der Fahrt; verladene Ladung kehrt zurück).
- **Betriebskosten** je gefahrener Ladung (`operatingCost`, Geldsenke).

## Noch offen (bewusst NICHT vorgetäuscht)

- **A10 Automatisierung:** Regeln wie „Wenn Sägewerklager > 70 %: transportiere
  Holz zum Zentrallager" bauen auf `createInventoryTransfer` auf und verbrauchen
  weiter Fahrzeuge, Zeit und Betriebskosten.
- **Zwischenlager-Lagerhäuser** als eigene lokale Puffer (aktuell ist das Ziel der
  globale Pool über ein beliebiges Lagergebäude als Anlieferpunkt).
- **Kraftstoff/Fahrzeugzustand** als zusammenhängende Phase (Fahrzeugdaten liegen
  vor; noch keine Verbrauchssimulation).
