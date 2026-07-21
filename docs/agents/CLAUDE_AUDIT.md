# CLAUDE_AUDIT — Overhaul 3.0 gegen den Repo-Stand v0.62

> Erstellt in Phase **C1** (Multi-Agent-Handoff). Zweck: den Auftrag „WORLD, UI &
> INTERACTION OVERHAUL 3.0" gegen den **tatsächlichen** Repo-Stand nach der
> Codex-Visualphase (v0.60–v0.62) prüfen, damit Claude **Logik** ergänzt statt
> vorhandene Codex-UI zu duplizieren. Quellen: `docs/agents/PROJECT_STATE.md`,
> `OWNERSHIP.md`, `OPEN_TASKS.md`, `DECISIONS.md`, `docs/PATCHNOTES.md` sowie der
> Code (`controller.ts`, `ActivityRoutePlanner.tsx`, `activities.config.ts`).
>
> **Rollen (verbindlich):** Claude = Simulation/Gameplay/Balancing/Commands/
> Read-Helper/Save. Codex = UI/Renderer/Assets/Präsentation. Claude baut **keine**
> zweite UI, Codex **keine** zweite Simulation. Save-Schema steht bei **v11**.

## Fortschritt (v0.63–v0.64)

**C2–C7 abgeschlossen.** Alle drei UI-`TODO(CLAUDE_LOGIC)` sind geschlossen
(Routenanalyse, Anliegen-Kartenfokus, Regionsvorschau); dazu `placementDiagnostics`,
§16-Coverage-Fix, `roadPathPreview` und Balancing-Regressionstests. Neue
Read-Helper: `analyseActivityRoute`, `questFocus`, `placementDiagnostics`,
`regionPreview`, `roadPathPreview`. Save bleibt **v11**. Details:
`HANDOFF_LOG.md` (2026-07-20), `PATCHNOTES.md` (v0.63/v0.64).

Bewusst offen (größere eigene Phasen): Erschließungsstufen/`unlockProject`,
Highway (L14), Parkplätze (L7), Farmzäune, **spielerisches** Wetter,
Routenalternativen + `rewardMultiplier`→Auszahlung — jeweils erst mit
Datenmodell/Migration/Balancing.

## Statuslegende
- ✅ **umgesetzt** — funktionsfähig, keine offene Logik.
- 🎨 **visuell da, Logik fehlt** — Codex-UI/Renderer vorhanden, Claude muss die
  kanonische Datenschicht liefern.
- 🟡 **teilweise** — Grundsystem existiert, klare Lücke.
- ⬜ **offen** — noch nicht begonnen.
- ♻️ **überholt** — im Auftrag beschrieben, aber durch aktuelle Architektur ersetzt.

## Audit-Tabelle

| Bereich | Status | Aktuelle Dateien | Lücke / Claude-Aufgabe | Zuständig |
| --- | --- | --- | --- | --- |
| UI-Grundsystem (Glas/Gold, Nav, Ein-Sheet) | ✅ | `styles/**`, `hud/**`, `App.tsx` | — (Codex-Eigentum) | Codex |
| Ressourcenleiste / Top-HUD | ✅ | `hud/GameHud.tsx` | — | Codex |
| Minimap | ✅ | `hud/WorldMiniMap.tsx` | Read-Helper `getMinimapSnapshot()` nur falls Codex es anfordert (aktuell liest UI Snapshot direkt) | Codex |
| Bürgeranliegen (Darstellung) | ✅ | `panels/CitizenRequestsPanel.tsx` | — | Codex |
| Bürgeranliegen (Kartenbezug) | 🎨 | `CitizenRequestsPanel.tsx:350` | `TODO(CLAUDE_LOGIC)`: `CitizenRequest.focusPosition/regionId` als reine Controller-Projektion → „Auf Karte zeigen" aktivierbar | Claude |
| Stadtstatus (Darstellung) | ✅ | `panels/CityStatusDetail.tsx`, `CityStatusPanel.tsx` | — | Codex |
| Stadtstatus-Diagnostik | 🟡 | `simulation/derived.ts`, `buildings/coverage.ts` | Read-Helper vertiefen: Ursachen/betroffene Gebäude/Trend/Empfehlung je Statuswert | Claude |
| Regionsdarstellung (Hero/Nebel) | ✅ | `panels/RegionDialog.tsx`, Renderer | — | Codex |
| Regionslogik (Boni/Kosten/Gates) | ✅ | `config/regions.config.ts`, `derived.ts` | Basis steht (32 organische Regionen) | Claude |
| Regionsvorschau (zukünftige Gebäude) | 🎨 | `RegionDialog.tsx:128` | `TODO(CLAUDE_LOGIC)`: `futureBuildings/unlockProject` aus Config/Progression ableiten + Test | Claude |
| Regions-Erschließungsstufen | ⬜ | — | Konzept „RegionDevelopment" (Erschließungsstufen **statt** Quadratsektoren), erst Datenmodell/Nutzen prüfen | Claude |
| Stadtarbeit-Grundsystem | ✅ | `config/activities.config.ts`, `simulation/activities.ts`, `controller.ts` | 7 Aktivitäten, Fahrmodus, Zielreihenfolge, Belohnung/Qualität | Claude |
| Stadtarbeit-Routenplaner (UI) | ✅ | `panels/ActivityRoutePlanner.tsx` | Vollbild-Planer, Optimierung, Speichern/Start | Codex |
| **Stadtarbeit-Routenanalyse (Logik)** | ✅ (v0.63/C2) | `game/activities/routeAnalysis.ts`, `controller.analyseActivityRoute`, `tests/routeAnalysis.test.ts` | Kanonische `RouteAnalysis` auf `derived.roadNetwork` ersetzt die Schätzung. Rest: Routenalternativen + `rewardMultiplier`→Auszahlung (C7) | **Claude** |
| Fahrmissionen | 🟡 | `activities.config.ts` (`drive:true`) | Phasenstruktur (briefing→planning→execution→decision→return→result), Interaktionspunkte, Entscheidungs-Missionen (Inspektion/Bürgermeister) datengetrieben ergänzen | Claude |
| Straßenplanung (Zeichnen→Bestätigen) | ⬜ | `MapView.tsx:104` (Sofortbau) | O6: `placeRoadPath(path)` + Segment-Validierung; Kosten erst bei Commit | Claude+Codex |
| Verkehr | 🟡 | Renderer Ambient-Verkehr | Kanonischer Straßengraph (auch für C2 nötig); Kollisions-/Lane-Logik später (O9) | Claude |
| 2D-Routenplanung (Ansicht) | ✅ | `ActivityRoutePlanner.tsx` (Canvas-Projektion) | Ansicht steht; nur Datenschicht (= C2) fehlt | Codex+Claude |
| Wetter (Darstellung) | ✅ | `SkyEnvironment.ts`, `panels/WeatherPanel.tsx`, `environmentSettings.ts` | rein visuell (D-011) | Codex |
| Wetter (Gameplay) | ⬜ | — | O11: nur mit eigener Regelentscheidung + Feature-Flag + Tests; **nicht** vorschnell an Save/Wirtschaft koppeln | Claude |
| Gebäudeplatzierung (Ghost/Vorschau) | 🟡 | Renderer `setPlacing`, `MapView.tsx` | Voller GLB-Ghost/Radien = Codex-Renderer; Claude: `PlacementDiagnostics`-Read-Helper (valid/reasons/roadAccess/Boni/Prognose) | Claude+Codex |
| Gebäude verschieben (3D) | 🟡 | `controller.ts` move-Pfad, `store.ts` | Simulationsseite prüfen: Belegung frei/neu, Rotation/Upgrade/Bewohner/Jobs erhalten, Standortbonus neu; Tests | Claude |
| Gebäudeupgrades (Werte während Bau) | 🟡 | `buildings/effects.ts`, `controller.ts` | **Verbindlich prüfen:** alte Werte bleiben während Upgrade aktiv (Bewohner/Produktion/Radius ≠ 0); Tests je Typ | Claude |
| Gebäudestufen ↔ Modell/Config | ✅ | `buildings.config.ts`, `modelManifest.ts`, `buildingModel(id,stage)` | Sync per Test (config.test/balancing.test) gesichert | Claude |
| Weltgrafik (Wasser/Nebel/Vegetation/Landmarken) | ✅ | `ThreeMapRenderer.ts`, `SkyEnvironment.ts` | Codex-Polish v0.62 (Küstenflachwasser, Wasserfälle etc.) | Codex |
| Balancing (Bevölkerung/Zuzug) | 🟡 | `simulation/tick.ts` (`moveInPerMin`), `balancing.config.ts` | C7: prüfen, dass Vollausbau nicht dauerhaft weit unter Wohnkapazität bleibt; Gesamt-Sim statt Einzelwert-Multiplikation | Claude |
| Aktives Spiel (kein Offline-Verdienst) | 🟡 | `App.tsx` tick (`document.visibilityState`), `controller.update(live)` | Prüfen, dass nur Bau-/Upgradezeiten offline laufen, Wirtschaft nicht; Test ergänzen | Claude |
| Handel | 🟡 | `panels/TradePanel.tsx`, Economy | Ein Kontor genügt; aktiver Handel/Verträge prüfen | Claude |
| Parkplätze (L7) | ⬜ | — | Erst Konzept/Config-Vorschlag/Tests (Kap. 20), nicht ins Balancing drücken | Claude |
| Highway (L14) | ⬜ | — | Erst Datenmodell/Graphgewichtung dokumentieren (Kap. 21) | Claude |
| Farmzäune/Produktionsflächen | ⬜ | — | Erst belastbares Konzept + Exploit-Schutz + Migrationsplan (Kap. 22) | Claude |
| Save/Migration | ✅ | `storage/migrations.ts` (v10→v11) | v11 stabil; neue persistierte Felder erst mit v12-Migration | Claude |

## Kanonische Handoff-Grenzen (aus OWNERSHIP.md/DECISIONS.md)
- Command-Grenze Stadtarbeit: `startActivity` / `setActiveActivityRoute` / `getActivityRoutePlan`.
- `infoLayerMode`, `EnvironmentSettings.weather`, Tagesgeschwindigkeit = **reine Präsentation** (D-005/D-009/D-011) — nie Simulationswahrheit.
- Mockup ist keine Regelspezifikation (D-010): fehlende kanonische Daten bleiben deaktiviert/Skeleton, bis Claude sie echt liefert.
- Nicht gleichzeitig mit Codex an `styles.css`, `styles/**`, `controller.ts`, `PATCHNOTES.md` arbeiten → mergen, dann prüfen.

## „Überholt" gegenüber dem Original-Overhaul
- ♻️ **Untere zentrale Hauptnavigation** → durch **vertikale linke Nav** ersetzt (D-003). Nicht zurückbauen.
- ♻️ **Regionen in „Westanger 1–4" umbenennen** → **nicht** als Quadrat-/Nummern-Sektoren umsetzen; stattdessen Erschließungsstufen **innerhalb** der 32 organischen Regionen (Kap. 13). 
- ♻️ **Eigener 2D-Kartenrenderer** → nur leichte Canvas-Projektion desselben Snapshots (D-001), kein zweiter Renderer.

## Priorisierter Umsetzungsplan (Claude)
1. **C2 — Stadtarbeit-Routenanalyse (Prio 1).** Reines `routeAnalysis`-Modul in
   `src/game/` + Controller-Read-Helper; ersetzt `TODO(CLAUDE_LOGIC)` in
   `ActivityRoutePlanner.tsx`. Kein Save-Bump (Analyse wird live berechnet), außer
   ein persistierter `rewardMultiplier`/Routenzustand erweist sich als nötig.
2. **C3 — Bürgeranliegen-/Statusdiagnostik.** `focusPosition/regionId` als reine
   Controller-Projektion; Status-Read-Helper vertiefen (Ursachen/betroffene Gebäude).
3. **C4 — Platzierung/Verschieben/Upgrade-Werte.** `PlacementDiagnostics`;
   Verschieben-Invarianten; alte Werte während Upgrade aktiv (Tests je Typ).
4. **C5 — Regionsvertiefung.** `futureBuildings/unlockProject` aus Config;
   Erschließungsstufen nur, wenn sauber ins bestehende Regionssystem passend.
5. **C6 — Verkehr/Straßenplanung-Logik.** Kanonischen Graphen (aus C2) für Road-Plan-
   Validierung nutzen; `placeRoadPath` + Segment-Validierung.
6. **C7 — Balancing.** Bevölkerung/Zuzug/aktives Spiel per Gesamt-Simulation.

## Verifikation je Phase
`npx tsc -b --force` · `npx eslint src tests` · `npx vitest run` · `npm run build`;
bei UI/Renderer zusätzlich Browser-Smoke 1280×720 & 1920×1080. Handoff-Log nach
jeder Phase fortschreiben (`docs/agents/HANDOFF_LOG.md`).
