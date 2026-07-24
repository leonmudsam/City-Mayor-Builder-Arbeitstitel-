# Stadtarbeit-Stabilität — Audit & Fix (P-A, D-037, Save v21)

> Teil des Spielbarkeits-Auftrags (Nutzer, 24.07.2026). Ziel: „Stadtarbeit muss
> während der gesamten Planung stabil bleiben." Dieses Dokument hält die exakte
> Ursache, den Fix und den Lebenszyklus des eingefrorenen Planungssnapshots fest.

## 1. Symptom

Beim Planen eines Lieferauftrags (z. B. „Essen verteilen") schienen **Zielgebäude,
Zielreihenfolge, Quelle und Liefermengen sich selbstständig zu ändern** — besonders
auffällig in höheren Leveln (mehr Kandidatengebäude → dramatischeres Neu-Mischen) und
bei **laufender Uhr** (2×/4× verstärkten es). Die eingezeichnete Route passte danach
nicht mehr zum Auftrag.

## 2. Exakte Ursache (reproduziert)

Der Planer liest sein Read-Model bei **jedem** Controller-`version`-Bump neu:

```
ActivityRoutePlanner  → game.getActivityPlanningContext(defId)   (useMemo auf game.version)
  → getActivityDeliveryTargets(defId)
    → getActivityRoutePlan(defId)
      → pickTargets(previewState, candidates, min, max)   // ⚠️ RNG-Wurf
```

- `pickTargets` würfelt über `nextRandom(state)`, das **`state.rngSeed`** vorschiebt.
- `rngSeed` ist ein **primitiver** Wert; der frühere `previewState = { ...this.state }`
  schützte zwar den **Save** (die Kopie bekam ihren eigenen `rngSeed`), aber der
  **Startwert** war jedes Mal der **aktuelle** `rngSeed`.
- Die **Simulation schiebt `rngSeed` pro Tick weiter** (Ereignisse, Bürger …). Damit
  lieferte `pickTargets` bei jeder Abfrage einen **anderen** Shuffle → bei laufender
  Uhr **jeden Tick eine andere Zielmenge**.

Kurz: Die Vorschau war an die **tickabhängige Sim-RNG** gekoppelt statt an einen
stabilen Snapshot. Das ist die gesamte Ursache — kein React-Referenzproblem, keine
Auftrags-Neugenerierung im Tick.

## 3. Fix — eingefrorener, deterministischer Planungssnapshot

### 3.1 Zustand (persistiert, additiv → Save v21)

```ts
// src/game/types.ts
export interface ActivityPlanningSelection {
  defId: string;
  createdAt: number;             // Sim-Zeit des Einfrierens
  epoch: number;                 // +1 pro bewusster Aktualisierung → neue Ziele
  sourceBuildingId?: string;     // eingefrorener Quellanker (sonst Rathaus-Fallback)
  targetBuildingIds: string[];   // der eingefrorene Kern
}
// ActivitiesState.selection?: ActivityPlanningSelection  (genau EINER = ein Planer)
```

### 3.2 Deterministische Zielwahl (nie aus der Sim-RNG)

```ts
// src/game/simulation/activities.ts  (rein, state-frei)
pickTargetsSeeded(candidates, min, max, seed)        // mulberry32 aus lokalem seed
activitySelectionSeed(defId, createdAt, epoch)       // stabil pro Stadt+Auftrag+Epoch
```

`getActivityRoutePlan` liefert bei vorhandenem Snapshot dessen Ziele; sonst dieselbe
deterministische Ableitung (Epoch 0). Dadurch ist die Vorschau **vor** und **nach**
dem Einfrieren identisch (kein Flackern). `pickTargets` (Live-RNG) bleibt
ausschließlich für den **tatsächlichen Missionsstart** (`startActivity`), wo der
RNG-Konsum die bewusste, replaybare Handlung ist.

### 3.3 Lebenszyklus (Commands + ein Read)

| Übergang | Command / Read | Wirkung |
|---|---|---|
| Auftrag öffnen | `selectActivity(defId)` | friert **idempotent** ein (sicher aus UI-Effekt; kein Reroll/version-Bump bei erneutem Aufruf) |
| Ziel abgerissen | `getActivitySelectionStatus(defId) → 'stale'` | UI zeigt Aktualisieren/Abbrechen — **kein** stiller Tausch (§2.4) |
| bewusst neue Ziele | `refreshActivitySelection(defId)` | Epoch+1 → genuin neuer Satz |
| verwerfen | `clearActivitySelection()` | Snapshot entfernen |
| Mission starten | `startActivity(...)` | übernimmt Ziele, **räumt** den Snapshot (planning→executing) |

`getActivitySelectionStatus` = `none | ok | stale`. `stale`, sobald ein eingefrorenes
Ziel kein aktives Kandidatengebäude mehr ist.

### 3.4 UI (`ActivityRoutePlanner.tsx`)

- `useEffect([game, defId]) → game.selectActivity(defId)` friert beim Öffnen ein.
- `selectionStatus === 'stale'` rendert den klaren Hinweis („Ein Lieferziel wurde
  abgerissen") mit **Auftrag aktualisieren** / **Abbrechen** statt des generischen
  Leerzustands. Keine parallele Zeit, keine Auftragsgenerierung im Render.

## 4. Save-Migration

`SCHEMA_VERSION = 21`; Migration `v20→v21` ist rein additiv (nur Versionsstempel).
Alt-Saves ohne `activities.selection` bleiben ladbar und frieren beim nächsten Öffnen
frisch ein. Zod-Schema um das optionale Feld erweitert.

## 5. Tests (`tests/activityStability.test.ts`, 10 Fälle)

- Ziele bleiben über 100 RNG-Vorschübe **und** 30 echte Ticks identisch.
- Mehrfaches Öffnen/Schließen (erneutes `selectActivity`) ändert nichts.
- Vorschau vor dem Einfrieren == eingefrorener Satz.
- Abriss eines Ziels → `stale`, **kein** Auto-Tausch; `refresh` → neuer gültiger Satz.
- Missionsstart übernimmt die Ziele und räumt den Snapshot.
- Save/Load erhält den Snapshot; Alt-Save ohne Feld lädt (v20→v21).
- Seed reproduzierbar und epoch-/auftragsabhängig.

## 6. Reichweite & offene Punkte

- Gilt **datengetrieben für alle** Lieferauftragstypen (gemeinsamer
  `getActivityRoutePlan`-Pfad) — keine Sonderlösung pro Auftrag.
- Bewusst offen (nicht vorgetäuscht): mehrere gleichzeitige Snapshots (aktuell genau
  einer); feinere Invalidierung, wenn ein Ziel gesperrt/umgezogen statt abgerissen
  wird; die Marker-Neuberechnung pro Tick (Korrektheit stabil, Feinschliff im späteren
  Performance-Pass P-E).

Nächste Phasen des Auftrags: **P-B** zentrale Ingame-Zeit · **P-C** Frühlogistik ·
**P-D** Anleger-zu-Anleger-Netz · **P-E** Performance-Pass + FPS. Siehe
[`OPEN_TASKS.md`](OPEN_TASKS.md) und DECISIONS **D-037**.
