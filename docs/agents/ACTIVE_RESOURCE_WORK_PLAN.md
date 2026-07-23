# ACTIVE RESOURCE WORK PLAN — § Change 9.0, Phasen S6–S8

> Plan vor Implementierung (Auftrag §2/§12–§20/§24.11-12). Baut **auf dem
> vorhandenen aktiven Betriebssystem auf** (Active Operations 2.0, A1–A5) —
> `src/game/operations/{nodes,operations,transport}.ts`. Kein zweites System (§1).

## 1. Ist-Zustand (was schon steht — A1–A5)

- **Ressourcenknoten:** `operations/nodes.ts` — Bäume deterministisch aus Wald +
  Hash, stabile Id `"x,y"`, nur Deltas persistiert, Regeneration. **Aktuell nur
  `type: 'tree'`/Holz** hart verdrahtet.
- **Operationen:** `operations/operations.ts` — `advanceOperations` (Live-Tick):
  Arbeiter laufen/fällen/tragen/lagern, Reservierung, Voll-Stopp, Zeitfaktor.
  Zustände `ResourceNodeRuntimeState`: available/reserved/being_worked/depleted/
  regrowing.
- **Lokales Lager + Transport:** `BuildingInventory` (items/reserved), A5-Transport
  ins Zentrallager (Mehrfachladung/Rückruf/Kosten). „Unterwegs" existiert.
- **Commands:** `startBuildingOperation(buildingId, radius?, maxCount?)`,
  `startBuildingOperationWithNodes(ids)`, cancel/pause/resume, + Read-Helper
  (`getBuildingOperationInfo/Preview`, `getResourceNodesNear`, `getBuildingWorkArea`,
  `getWorkerRenderStates`).
- **UI:** `FloatingBuildingSheet` → `BuildingOperationSection` (Aktionsbutton,
  Arbeiter/Auftrag/lokales Lager, Ertrags-/Dauervorschau, Warnungen) + Transport.
- **Renderer:** `updateWorkers` zeichnet Arbeiter als **gepoolte Figuren** an ihrer
  Sim-Tile-Position. **Keine** Fäll-/Trag-Animation, **kein** 3D-Auswahlwerkzeug.

## 2. Kernlücke gegenüber 9.0

Der Arbeitsauftrag entsteht heute über einen **Radius-Zahlenwert im
Gebäudefenster** (`startBuildingOperation(radius)`), nicht über ein **sichtbares
Arbeitsgebiet auf der 3D-Karte**. Es fehlen: der Forst-/Arbeitsmodus mit
Kreiswerkzeug (§12.2), Einzelbaum-Raycast, das Terrain-folgende Overlay mit
Effizienz-Farben (§17), die Bedienung (§18) und sichtbare Arbeitsanimationen
(§13). Steinbruch/Farm nutzen das Framework noch nicht (§14/§15).

## 3. Phase S6 — Sägewerk-Arbeitsmodus (Referenzschnitt, §12/§13/§17/§18/§19)

**3a. Arbeitsmodus-State (UI).** Neuer UI-Zustand „work mode" (Quelle: Gebäude +
Aktion „Arbeitsgebiet festlegen"). Öffnet **kein** Auto-Fill (§12.1), sondern den
Planungsmodus. Reihenfolge exakt §12.2: Sägewerk wählen → „Aktiv Holz gewinnen" →
Karte in Forstmodus → Kreiswerkzeug (Mittelpunkt+Radius) → geeignete Bäume
hervorgehoben → Vorschau (§12.3) → Einzelbäume abwählbar → bestätigen → Arbeiter
sichtbar.

**3b. Kreis-/Auswahl-Helper (rein, Controller).** Neuer Read-Helper
`getWorkNodesInCircle(buildingId, centerTile, radius)` bzw.
`previewWorkArea(...)` liefert valide/invalide Knoten + die §12.3-Vorschau
(Arbeitsgebiet-Felder, geeignete/reservierte Bäume, Ertrag, Laufdistanz, Dauer,
Arbeiter, Lagerplatz danach, Warnungen). Baut auf `previewOperation`/
`selectAreaNodeIds` auf. Bestätigen → bestehendes `startBuildingOperationWithNodes`.

**3c. Renderer-Overlay (§17).** Terrain-folgendes Overlay (keine flache Scheibe):
effizienter Kernradius, Maximalreichweite, gewähltes Gebiet, valide (grün) /
weit/eingeschränkt (gelb) / unerreichbar (rot) / reserviert (blau) / nicht gewählt
(weiß) Knoten, Laufwege. Nutzt `getBuildingWorkArea` + neue Node-Zustandsfarben.

**3d. Einzelbaum-Raycast (§12.2/§18).** Im Arbeitsmodus werden **nur relevante
Chunks/Bäume** im Arbeitsbereich auf auswählbares Nah-LOD gebracht (§20 — nicht
die ganze Insel), Bäume per Instanz-Raycast anklickbar (instanceId → NodeId).
Bedienung §18: LMB Einzelziel, Shift+LMB add/remove, LMB-Drag Kreisradius, R
Werkzeugwechsel, ESC Abbruch, Enter Bestätigen; Kamera bleibt voll bedienbar,
**kein** versehentliches Auswählen beim Kamera-Drag.

**3e. Arbeitsanimationen (§13).** Renderer erweitert `updateWorkers` um Posen
(laufen/fällen/zerlegen/tragen/einlagern). `TreeWorkState` (§13) verfeinert die
Node-Zustände um `being_cut`/`felled`/`processed` (heute nur `being_worked`).
Ressource weiter **erst bei Einlagerung** gutgeschrieben (schon erfüllt).

## 4. Phase S7 — Steinbruch (§14) + Farm (§15)

**Steinbruch:** `operations/nodes.ts` von `tree` auf einen **parametrisierten
Knotentyp** generalisieren (`rock`/Stein auf Gebirge/Felsclustern), Quarry
`operation`-Profil in `buildings.config.ts`. **Blocker:** Der Steinbruch ist heute
die Baseline der Passiv-Produktionstests (simulation/systems/upgrade) und der
„Standort-Bonus"-Test ist steinspezifisch → diese Tests müssen zuerst auf einen
dauerhaft passiven Produzenten migriert werden (siehe `OPEN_TASKS.md`).

**Farm:** **kein** „Tiere abbauen". Eigener Feld-/Weide-Lebenszyklus
(vorbereiten→aussäen→pflegen→bewässern→ernten, §15.1) und Tierpflege
(füttern/umtreiben/einsammeln, §15.2). Das ist mehr als ein Knotentyp — es
braucht ein Feldzustands-Modell (additiv, Save-Migration). Erst **nach** dem
Sägewerk-Referenzschnitt (§24.12).

## 5. Phase S8 — weitere Betriebe (§16)

Feuerwehr (Einsatzfahrzeug→Brandziel, sichtbare Fahrt — nutzt A5-Transport-/
Route-Infrastruktur), Wasserwerk (Wartung/Pumpe/Notversorgung), Bauhof
(Material/Arbeiter→Baustelle), Lagerhaus (lokale Bestände/Umladung/wiederkehrende
Transportregel = A10). **Gemeinsames** `operation`-Framework, kein isoliertes
System je Gebäude.

## 6. Problem-/Fix-/Test-Matrix (§2)

| Problem | Ursache | Betroffene Dateien | Geplanter Fix | Tests |
|---|---|---|---|---|
| Kein 3D-Arbeitsgebiet, nur Radiuszahl | Auftrag über Gebäudefenster-Radius | neuer Work-Mode-State (`src/state`), `components/`, `commands/controller.ts` | Forstmodus + Kreiswerkzeug + Raycast | `operations.test.ts`: Circle→NodeIds |
| Kein Overlay | Renderer zeigt nur Arbeiter | `ThreeMapRenderer.ts` | Terrain-folgendes Effizienz-Overlay (§17-Farben) | Smoke-Screenshot |
| Keine Arbeitsanimation | `updateWorkers` nur Position | `ThreeMapRenderer.ts`, `operations.ts` (Zustände) | Posen + `TreeWorkState` verfeinern | Unit: Zustandsfolge |
| Kein Einzelbaum-Klick | kein Raycast/Chunk-Fokus | Renderer, `operations/nodes.ts` | Instanz-Raycast instanceId→NodeId, nur relevante Chunks in Nah-LOD | Test: instanceId-Mapping |
| Steinbruch passiv | `nodes.ts` nur `tree` | `nodes.ts`, `buildings.config.ts`, Passiv-Tests | Knotentyp generalisieren (`rock`) + Testbaseline migrieren | neue quarry-Operationstests |
| Farm „baut Tiere ab" | kein Feldmodell | neue `operations/fields.ts`, config, Save | Feld-/Weide-Lebenszyklus (additiv, Migration) | `fields.test.ts` |
| Arbeitsmodus killt Kamera / Fehlauswahl | Input-Konflikt LMB | `CameraInputController.ts` | Werkzeugmodus sauber von Kamera trennen (§18) | `camera.test.ts` |
| LOD bricht Auswählbarkeit | globales LOD-Umschalten | Renderer | nur Arbeitsbereich-Chunks auf Nah-LOD (§20) | Test: kein globaler LOD-Wechsel |

## 7. Reihenfolge & Leitplanken

§24.11-12: **zuerst** Sägewerk-Arbeitsmodus (S6) vollständig, **erst danach**
Steinbruch/Farm (S7). Ressourcen entstehen nie durch einen Button-Autofill (§12.1)
— immer über konkrete Knoten + Arbeiter + Auftrag (§1). Simulation kennt jeden
Knoten unabhängig vom LOD; Renderer nah = einzelne auswählbare Instanzen, fern =
Cluster/HLOD (§20, siehe `WORLD_RENDERING_PERFORMANCE_AUDIT.md`).
