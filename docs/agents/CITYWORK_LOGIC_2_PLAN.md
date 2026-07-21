# Stadtarbeit-Logik 2.0 — Technischer Plan (Claude)

Stand: 20. Juli 2026 · Auftrag „STADTARBEIT-LOGIK 2.0, ECHTE LOGISTIK &
LANGZEIT-KOMPLEXITÄT". Verbindlicher Einstieg vor jeder Code-Änderung
(CLAUDE.md: „Beginne nicht mit unkoordinierten Einzeländerungen"). Codex besitzt
UI/Renderer der Stadtarbeit; Claude liefert **nur** Simulations-, Gameplay- und
Balancinglogik plus stabile Read-Helper/Commands.

---

## 1. L1-Audit — Ist-Stand (verifiziert)

### Datenmodell heute
- `ActiveActivity` (`src/game/types.ts:186`): `defId`, `startedAt`, `expiresAt?`,
  `vehicle?`, `plannedRoadPath?`, `targets: {buildingId, done}[]`. Genau **eine**
  Aktivität gleichzeitig (`ActivitiesState.active`, `types.ts:198`).
- `ActivityDef` (`config/types.ts:431`): `type` ∈ delivery|inspection|decision,
  `targetCount`, `drive`, `vehicle`, `vehicleOptions`, `timeLimitSec`,
  `speedBonusFactor`, **`costPerTarget`** (Ressourcen je Ziel), `rewardTiers`.
- `ActivityVehicleDef` (`config/types.ts:404`): `capacity`, `speedKph`,
  `handling`, `operatingCost`, `consumption`, `future`. **`capacity` wird von der
  Logik heute NICHT ausgewertet** — nichts erzwingt Nachladen.
- Fahrzeugkatalog + Missionen: `config/activities.config.ts`. Referenzmission
  `food_delivery` (van, `costPerTarget: {food: 40}`, 3–5 Ziele).

### Ausführung heute (`commands/controller.ts`)
- `startActivity` / `setActiveActivityRoute` (Zeile 761/789): validiert Fahrzeug
  (`validActivityVehicle`, 749) + manuelle Straßenkette
  (`analyseManualActivityRoute`, 728), speichert Ziele/Fahrzeug/`plannedRoadPath`.
- `progressActivity` (847): ein Ziel-Klick → `spendCost(costPerTarget)` aus dem
  **globalen Pool**; letztes Ziel → `payoutActivity(tier×quality)` und löscht
  `active`. **Kein Cargo, keine Reservierung, keine Etappen, keine Rückfahrt,
  keine Leerfahrtbewertung.**
- `abandonActivity` (907): löscht `active`, keine Erstattung/Rückgabe.

### Routenanalyse (wiederverwenden, NICHT duplizieren)
- `src/game/activities/routeAnalysis.ts`: reiner, deterministischer
  Straßengraph-Analyser auf `derived.roadNetwork` (BFS, Snap-to-Road,
  Verkehrslast, Effizienz, `RouteSegment[]`, `estimatedDurationMs`). Read-Helper
  `analyseActivityRoute` / `analyseManualActivityRoute` (controller 711/728).

### Entscheidende Randbedingung
> **Es gibt KEINE gebäudeeigene Lagerhaltung.** `BuildingInstance` hat kein
> `inventory`; alle Ressourcen liegen in **einem globalen Pool**
> (`GameState.resources`). Produktion fließt global ein.

Folge für §4/§5 (Quellen/Reservierungen): Eine „Quelle" ist ein **räumlicher
Routenanker** (Farm/Markt/Lager), aus dem physisch geladen wird — der Bestand
selbst bleibt der globale Pool. Reservierung heißt: die geplante Menge im
globalen Pool sperren, bis sie beim Pickup entnommen oder beim Abbruch
freigegeben wird. Da nur **eine** Aktivität aktiv ist, kann nichts doppelt
reserviert werden; die Reservierung schützt gegen paralleles Ausgeben durch
Handel/andere Commands **während** eines laufenden Auftrags.

---

## 2. Kernproblem & Zielbild

Heute lädt ein Fahrzeug implizit „unendlich" (jeder Ziel-Klick zieht einfach aus
dem Pool). Ziel (§2/§29): **Fahrzeugkapazität wird real** → große Aufträge
brauchen mehrere Beladungen → der Spieler plant Pickup-Etappen, Quellen,
Rückwege und Fahrzeugklasse. Die manuelle Planung bleibt zentral (§20); Claude
liefert nur Validierung/Prognose/Bewertung, nie die automatisch „perfekte" Route.

---

## 3. Architekturentscheidungen (fix)

- **A1 — Globaler Pool bleibt Wahrheit.** Kein neues `inventory` je Gebäude.
  Cargo/Reservierung wirken auf `GameState.resources`. Quelle = Ankergebäude.
- **A2 — Etappen deterministisch aus dem Plan ableitbar.** Der Plan besteht aus
  (Zielreihenfolge, gewähltes Fahrzeug, gewählte Quelle je Etappe,
  `plannedRoadPath`). Daraus berechnet ein **reiner** Planer die Etappen
  (`ActivityLeg[]`: pickup/delivery/return), Cargo-Bedarf und Nachladepunkte.
  Damit bleibt der Save schlank; die Etappen sind Projektion, kein Rohzustand.
- **A3 — Cargo & Fortschritt sind Runtime während der 3D-Fahrt.** Persistiert
  wird nur, was §23/§26 verlangt: der **Plan** und der **Etappen-Checkpoint**
  (Index der zuletzt abgeschlossenen Etappe) — genug, um Save/Load an derselben
  Stelle fortzusetzen. Kein Offlinefortschritt (§26): Entnahme/Auszahlung
  passieren ausschließlich in Commands während Live-Play.
- **A4 — Erweitern, nicht neu bauen.** `routeAnalysis.ts` bleibt der Graph-Kern;
  die Cargo-/Etappen-/Bewertungslogik kommt als neues reines Modul
  `src/game/activities/logistics.ts` daneben und ruft den Analyser auf. Keine
  zweite Karten- oder Aktivitätssimulation (OPEN_TASKS „Nicht tun").
- **A5 — Bedarf skaliert mit der Stadt (§13).** Statt pauschalem `costPerTarget`
  erhält jede Delivery-Def einen `cargoModel` (Ressource + Bedarf je Ziel,
  optional aus Zielgröße/Einwohnern abgeleitet). Der Gesamtbedarf übersteigt
  bewusst die Kapazität kleiner Fahrzeuge → Nachladen wird nötig (§2).
- **A6 — Fahrzeug-Eignung datengetrieben.** Lade-/Entladezeit, enge-Straßen-
  Malus, Kühlung/Verderb kommen als Config-Felder an `ActivityVehicleDef`; keine
  Werte aus UI/CSS erfinden (§20, OPEN_TASKS „Nicht tun").
- **A7 — Rückwärtskompatibel.** Alle neuen Config-/State-Felder sind **optional**.
  Missionen ohne `cargoModel` verhalten sich exakt wie heute (Fallback auf
  `costPerTarget`). Schema-Bump nur, wenn wirklich neue Felder persistiert werden
  (siehe §7).

---

## 4. Datenmodell (Definition — §30.4)

Neues reines Modul `src/game/activities/logistics.ts`:

```ts
// Cargo-Bedarf je Ziel (aus cargoModel + Zielgröße/Einwohner abgeleitet).
interface CargoRequirement { resource: ResourceId; amount: number; }

// Fahrzeugladung als echter Runtime-Zustand während der Fahrt.
interface VehicleCargo {
  capacity: number;
  used: number;
  items: { resource: ResourceId; amount: number; sourceId: string; loadedAtMs: number }[];
}

// Reservierung im globalen Pool für die Dauer eines Auftrags.
interface ResourceReservation {
  resource: ResourceId; amount: number; collected: number;
  status: 'reserved' | 'collected' | 'released';
}

type ActivityLegType = 'pickup' | 'delivery' | 'return';
interface ActivityLeg {
  id: string;
  type: ActivityLegType;
  sourceId?: string;            // pickup/return: Ankergebäude
  targetIds: string[];          // delivery: belieferte Ziele dieser Etappe
  resource?: ResourceId;
  amount: number;               // geladene bzw. gelieferte Menge
  status: 'pending' | 'active' | 'done';
}

// Reiner Planer: erzeugt Etappen aus Plan + Kapazität (Nachladen automatisch).
function planActivityLegs(input: LegPlanInput): ActivityPlanResult;
// Bewertung nach Abschluss inkl. Leerfahrtanteil (§19).
function evaluateInfrastructure(...): InfrastructureEvaluation;
```

`ActivityDef.cargoModel?` (neu, optional, Zod-validiert):
```ts
cargoModel?: {
  resource: ResourceId;
  perTarget: number;            // Basisbedarf je Ziel
  scaleByResidents?: boolean;   // §13: großes Wohnziel braucht mehr
  perishable?: boolean;         // §12: verderblich (Kühlfahrzeug hilft)
}
```

`ActivityVehicleDef` (neu, optional): `loadTimeSec`, `unloadTimeSecPerTarget`,
`narrowStreetPenalty` (0..1), `cooling?` (reduziert Verderb).

`ActiveActivity` (neu, optional, persistiert — siehe §7):
`sources?: Record<targetId, sourceBuildingId>`, `completedLegs?: number`.
Cargo/Reservierung sind Runtime und werden **nicht** roh persistiert (aus Plan +
`completedLegs` deterministisch rekonstruierbar, A2/A3).

---

## 5. Read-Helper & Commands (Vertrag für Codex)

Der Auftrag (§21/§22) nennt viele Helfer; wo möglich **bestehende erweitern**
statt neue Namen. Mapping:

| Auftrag §21/§22 | Umsetzung |
| --- | --- |
| `getActivityPlanningContext` | neuer Read-Helper, bündelt Bedarf/Quellen/Ziele/Fahrzeuge |
| `getActivitySupplySources` | neu: mögliche Ankergebäude je Ressource (`requiresAnyBuilding`-Klassen) + Distanz/Anbindung |
| `getActivityCargoRequirements` | neu: aus `cargoModel` + Zielen |
| `getActivityRoutePreview` | **bestehend** `analyseManualActivityRoute` erweitern (Etappen/Cargo) |
| `getActivityInfrastructureWarnings` | neu: Leerfahrt/Fahrzeugeignung/enge Straßen |
| `getActivityResult` | Ergebnisobjekt aus `progressActivity`-Payout erweitern |
| `selectActivityVehicle` | **bestehend** `setActiveActivityRoute(plan.vehicle)` |
| `setActivitySupplySource` | neu: Quelle je Ziel setzen (validiert) |
| `setActivityTargetOrder` | **bestehend** `setActiveActivityRoute(targetIds)` |
| `confirmActivityPlan` / `startActivityExecution` | **bestehend** `startActivity` |
| `cancelActivity` | **bestehend** `abandonActivity` (+ Reservierung freigeben) |

Keine direkte State-Mutation aus der UI (CLAUDE.md §1).

---

## 6. Bewertung (§19) — Leerfahrtanteil

`InfrastructureEvaluation`: `routeDirectness`, `emptyTravelRatio` (Strecke ohne
Ladung ÷ Gesamtstrecke), `vehicleSuitability` (Kapazität vs. Bedarf, enge Straßen
vs. Klasse), `loadingAccessScore`, `congestionScore` (aus `routeAnalysis`),
`warehousePlacementScore` (Distanz Quelle↔Ziele). Textbausteine liefert die UI
(Codex); Claude liefert nur Zahlen. Reine Prognose — Kopplung an die Auszahlung
erst nach Balancingtest (siehe DECISIONS D-013, bleibt zunächst Anzeige).

---

## 7. Save / Migration

Persistiert werden nur `sources?` + `completedLegs?` an `ActiveActivity` (beide
optional). Das ist eine Schema-Änderung → **v12 → v13** mit linearer Migration
`12→13` in `migrations.ts`:
- Migration ist ein **Normaliser**: lässt ein bestehendes `active` gültig; setzt
  keine erfundenen Etappen. Fehlt `sources`/`completedLegs`, bleibt die Mission
  eine gültige Legacy-Delivery (Fallback-Pfad, wie heute).
- Alte v12-Saves ohne laufende Mission sind unverändert ladbar.
- `SCHEMA_VERSION` in `newGame.ts` auf 13; `schemas.ts` um die optionalen Felder
  erweitern; Fixtures in `storage.test.ts`.

Nur **falls** L2 ohne persistierte Etappen auskommt (Plan vollständig aus
`plannedRoadPath` + `sources` rekonstruierbar), kann der Bump auf L3 verschoben
werden — Entscheidung beim Übergang L2→L3 dokumentieren.

---

## 8. Phasen (jede endet grün: `tsc -b --force` · `eslint src tests` ·
`vitest run` · `npm run build`; Patch Note je Phase)

- **L2 — Ladung & Kapazität (Referenz: `food_delivery`).** `logistics.ts` mit
  `CargoRequirement`/`VehicleCargo`/`planActivityLegs`; `cargoModel` an
  food_delivery; `progressActivity` prüft Kapazität und erzwingt Pickup-Etappen;
  Reservierung im Pool; Read-Helper `getActivityCargoRequirements`,
  `getActivitySupplySources`. Tests: Überladeschutz, mehrere Beladungen, reale
  Entnahme, Reservierung/Abbruch.
- **L3 — Reservierung an der Quelle. ✅ (v0.67)** `ActiveActivity.reserved`:
  Ladung wird beim Start upfront aus dem Pool entnommen, pro Ziel abgebaut, bei
  Abbruch zurückgegeben; Start-Sperre bei zu wenig Vorrat. Verbrauch netto
  identisch (nur Zeitpunkt). Read-Helper `getActivityExecutionSnapshot`. **Save
  v13 + Migration `12→13`.** Offen (Codex-Renderer): sichtbarer Quell-Halt +
  Nachlade-/Rückfahrt-Etappen während der 3D-Fahrt (Daten in
  `getActivityCargoPlan.legs`); mehrere Quellen/Rundtouren als spätere L-Stufe.
- **L4 — Bewertung. ✅ (v0.68)** Reines `evaluateInfrastructure` (Leerfahrtanteil
  §19, Fahrzeugeignung, Quellenlage, Geradheit, Lade-/Entladezeiten in
  `estimatedDurationMs`, Verderbrisiko, textfreie Hinweiscodes) + konkrete
  pfadbasierte `evaluateCargoRoute` (echte Quell-/Nachladekontakte, gemessene
  Leerfahrtkacheln). Fahrzeugeignungs-Config (`loadTimeSec`,
  `unloadTimeSecPerTarget`, `narrowStreetPenalty`, `cooling`) — alle optional,
  **kein Save-Bump**. Read-Helper `getActivityInfrastructure`,
  `getActivityInfrastructureWarnings`, `getActivityCargoRoute`. Bleibt Anzeige
  (DECISIONS D-013), keine Auszahlungskopplung.
- **L5 — Adaptive Aufträge.** Bedarf/Ziele/Mengen aus Stadtzustand (§13/§17);
  Level-Staffel L1–20 (§14); Übertragung auf `material_delivery`, `log_transport`.
- **L6 — Zwischenlager.** Lager/Depot als Logistikknoten (Hub-and-Spoke-Prognose,
  „ein Lager im Süden spart …").
- **L7 — Spätere Verkehrsträger.** `TransportMode`/`TransportLeg`-Typen als
  erweiterbares Gerüst (§24); Bahn/Flug bleiben `future`, nicht auswählbar.

## 9. Akzeptanz (§29) — Kurzcheck je Phase
Kapazität real · Nachladen möglich/nötig · Entnahme an realen Quellen ·
Reservierung korrekt · Rundtouren · Leerfahrtbewertung · Lade-/Entladezeit ·
Fahrzeug-Trade-offs · Verderb möglich · Offline kein Fortschritt · Bahn/Flug
architektonisch offen · stabile Codex-Verträge · keine Parallelsimulation ·
Saves migriert · tsc/eslint/vitest/build grün.
