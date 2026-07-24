# Infrastruktur 2.0 — Höhenstraßen, Brücken & Schifffahrtsnetz (AKTIVER AUFTRAG, P0)

> **Herkunft:** Nutzer-Vision-Dokument „City Mayor Builder – Infrastruktur 2.0"
> (mit Referenz-Mockup `stadtaufbau_mit_höhenstrassen_und_schiffrouten.png`),
> erteilt am 24. Juli 2026. **Ausdrückliche Priorisierung des Nutzers:**
> „Schiebe R2 und Rest erstmal nach hinten … beginne mit dem neuen Auftrag
> Infrastruktur 2.0 … das ist ein entscheidender Punkt, sodass ich das Spiel
> weiter testen kann, sonst komme ich auf der Spielwelt nicht weiter."
>
> Die 10.0-Phasen **R2, R3, R4, R5, R6, R9** sind damit **zurückgestellt** (nicht
> gestrichen) — sie bleiben in [`BACKLOG.md`](BACKLOG.md) §0 und
> [`OPEN_TASKS.md`](OPEN_TASKS.md) erfasst und werden nach Infrastruktur 2.0
> fortgesetzt. R1/R7/R8 sind erledigt (D-035, v0.83).

## Warum das der entscheidende Punkt ist

Nach der dritten Weltverdichtung (D-035) ist die Insel kompakter und **steiler**,
mit mehr Wasser zwischen den bebaubaren Zonen. Das aktuelle Straßensystem kann
**nur ebenes Land** bebauen: [`placement.ts`](../../src/game/buildings/placement.ts)
sperrt Straßen hart auf Wasser/Fluss/Klippe/Steilhang, deshalb greift der bereits
vorhandene `'bridge'`-Status in
[`roadPlanning.ts`](../../src/game/roads/roadPlanning.ts) **nie**. Folge: Stadtteile
lassen sich nicht über Höhen/Wasser verbinden → der Spieler „kommt nicht weiter".

**Ziel:** Die Stadt wächst durch **Infrastruktur**, nicht nur durch Regions-Unlocks
— Straßen, Brücken, Häfen und Handelswege wachsen logisch mit Gelände und Wasser.

## Leitplanken (verbindlich, aus CLAUDE.md)

- **§2 Erweitern statt neu bauen.** Kein zweites Straßen-/Verkehrs-/Logistiksystem.
  Höhenstraßen/Brücken sind **Straßen-Bauklassen** über denselben `roadNetwork`,
  dieselbe `validatePlacement`, dieselbe `analyseRoadPath`. Schifffahrt nutzt die
  vorhandenen `waterRouteNodes/Edges` + `buildingInfrastructure.ts` +
  `operations/transport.ts` (siehe auch [`LOGISTICS_INTEGRATION`](LOGISTICS_INTEGRATION.md),
  [`WATER_INFRASTRUCTURE_PLAN`](WATER_INFRASTRUCTURE_PLAN.md),
  [`HARBOR_SYSTEM_PLAN`](HARBOR_SYSTEM_PLAN.md)).
- **§1 Sim ≠ Rendering.** Bauklassen/Kosten sind Sim; Pfeiler/Deck/Rampen sind
  Renderer-Darstellung. Keine `three`-Imports unter `src/game/**`.
- **§3 Saves brechen nie.** Neue persistierte Felder ⇒ `SCHEMA_VERSION` + lineare
  Migration. Straßen sind Gebäude-Instanzen — neue Straßentypen sind **additiv**
  (kein Save-Bump), solange keine neuen State-Felder entstehen.
- **§5 Drop-in-Assets.** Brücken-/Pfeiler-/Deck-GLBs über die Registry; prozedurale
  Fallbacks dürfen nie crashen (`models/bridges/` existiert bereits).
- **§6 Performance.** Pfeiler/Deck über Instancing, LOD, Culling.
- **Nichts vortäuschen.** Fehlende Legs/Daten sind `TODO(CLAUDE_LOGIC)` und dürfen
  in der UI nicht als real dargestellt werden.

---

## Phasen (Reihenfolge = Umsetzungsreihenfolge)

### Phase I1 — Höhenstraßen & automatische Brücken `[P0, IN ARBEIT]`
**Das ist der Unblocker.** Neuer Straßentyp `road_elevated` (Höhenstraße), der
Höhenunterschiede und Wasser/Fluss überwindet.

- **Config:** `BuildingDef.road?: RoadClassDef` (`crossesWater`, `crossesCliff`,
  `maxSlope`, `bridgeCostPerTile`). Fehlt das Feld → Bodenstraße mit den bisherigen
  Regeln. Zod-validiert. Neue Def `road_elevated`: teurer, kostet Geld + Stein +
  Holz, höherer Unterhalt, kann Wasser/Klippe/Steilhang queren.
- **Sim:** `validatePlacement` Straßen-Zweig liest die Bauklasse (Wasser/Klippe/
  Steigung erlaubt; Region-Ausnahme nur für die tatsächlich überbrückte Wasser-/
  Klippenkachel — Landkacheln bleiben regionspflichtig). `analyseRoadPath` +
  `roadPathPreview` werden je Straßentyp parametrisiert (Def-Id statt hartem
  `'road'`), sodass der `'bridge'`-Status endlich real wird.
- **UI:** `MapView`/`SmartRoadPlannerHud` von `defId === 'road'` auf
  `category === 'roads'` + aktiven Straßentyp verallgemeinern. Kostenaufstellung
  zeigt Länge, Höhenunterschied, Pfeilerzahl, Kosten (Gold/Stein/Holz).
- **Renderer:** Über Wasser/Klippe wird die Höhenstraßen-Kachel als Brückendeck +
  Pfeiler dargestellt (`buildBridgeDeck` existiert bereits im Manifest); nie crashen.
- **Automatische Brückenlogik:** ebene Fläche → Straße · kleiner Höhenunterschied →
  Rampe · großer Höhenunterschied/Wasser → Brücke mit Pfeilern. Entscheidung fällt
  **automatisch pro Kachel** aus dem Terrain, der Spieler wählt nur den Straßentyp.

### Phase I2 — Saubere Straßenstruktur (Snap/Kurven/Verbindung) `[P0]`
Zacken/auseinanderbrechende Segmente beheben. Der Straßenentwurf verbindet Start→Ziel
lückenlos (Snap-Points, saubere Übergänge). Vorschau: grün=möglich, gelb=teuer,
rot=blockiert. **Überlappt 10.0-R6** (terrainbasierter A→B-Vorschlag, Kontrollpunkte,
atomarer Command) — R6 wird hier miterledigt.

### Phase I3 — Küste & Ufer + Anleger als Netzknoten `[P0]`
Flache Küstenzone (aus D-035 bereits verbreitert) für Anleger/Häfen/Küstenstraßen
nutzbar machen. **Anleger sind keine Einzelobjekte mehr, sondern Netzknoten**:
Straße → Anleger → Schiff → Anleger → Straße. Jeder Anleger zeigt Status (Netz
verbunden), Kapazität, aktive Routen, transportierte Waren. **Überlappt 10.0-R9**
(adaptive Uferplattform) — R9 wird hier miterledigt. Baut auf
`buildingInfrastructure.ts` (`nearestNavigableWaterNode`, `water_only`-Status).

### Phase I4 — Schifffahrtsnetz + Stadtarbeit-Integration `[P0]`
Persistente Schiffsrouten (Anleger→Anleger) als echter Netz-Bestandteil: Kapazität,
Reisezeit, Betriebskosten, Warenfluss, Pause/Löschen. Transport Sägewerk →
Transportwagen → Anleger → Schiff → Anleger → Lager. **Strategische Wahl:** kurzer
Landweg (billig, langsam) vs. Schiffsweg (teurer Aufbau, später schneller, hohe
Kapazität). Stadtarbeit bewertet beide Wege. **Reuse:** `operations/transport.ts` +
`activities/logistics.ts` + `routeAnalysis.ts` — keine zweite Missions-/
Transport-State-Machine. Neue persistierte Routen ⇒ **lineare Save-Migration**.
Verweise: [`WATER_INFRASTRUCTURE_PLAN`](WATER_INFRASTRUCTURE_PLAN.md),
[`HARBOR_SYSTEM_PLAN`](HARBOR_SYSTEM_PLAN.md), „Waterways 7.0" in OPEN_TASKS.

### Phase I5 — Bevölkerungs-Rebalancing + Infrastruktur-UI `[P1]`
- **Einwohner-Skalierung** realistischer, damit die Bevölkerung optisch zur
  Stadtgröße passt: kleines Haus 4–8, Reihenhaus 15–30, Apartment 80–150,
  Hochhaus 300+. Über `BalancingConfig.populationScale` + Housing-Effekte;
  Balancing-Tests anpassen. Bei persistenzwirksamen Änderungen lineare Migration.
- **Infrastruktur-Netz-UI** nach Mockup: Reiter Straßen/Brücken/Anleger/Schiffe;
  Panel „Infrastruktur" (Straßen km, Brücken, Anleger, aktive Schiffsrouten,
  Transportkapazität/min). Nutzt `infrastructureNetworkOverview` (bereits vorhanden).

---

## Datenmodell (geplant, additiv)

```ts
// config/types.ts
export interface RoadClassDef {
  crossesWater?: boolean;   // Brücke über Wasser/Fluss
  crossesCliff?: boolean;   // Viadukt über Klippe/Steilhang
  maxSlope?: number;        // default 0.8 (Bodenstraße)
  bridgeCostPerTile?: Partial<Record<ResourceId, number>>; // Pfeiler/Deck-Aufschlag
}
// BuildingDef.road?: RoadClassDef  (nur für category 'roads')
```

## Verworfen / bewusst NICHT

- Kein zweiter Straßengraph, keine zweite Verkehrs-/Missions-/Transport-Simulation.
- Keine manuell platzierten Brückenmodelle — Deck/Pfeiler/Rampen entstehen
  automatisch aus dem Terrain.
- Keine erfundenen Kapazitäts-/Verkehrs-/Routendaten in der UI.
- `water_only` versorgt keine Region automatisch (Häfen-Regel bleibt).

## Status

- **I1 Höhenstraßen/Brücken** — in Arbeit (v0.84).
- I2–I5 — offen, Reihenfolge oben.

Detail-/Phasenpflege: diese Datei + [`OPEN_TASKS.md`](OPEN_TASKS.md).
Themenüberblick: [`BACKLOG.md`](BACKLOG.md) §1. Architekturentscheid: **D-036**.
