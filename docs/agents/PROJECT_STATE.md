# Projektstand — v0.70

Stand: 21. Juli 2026

## Technische Basis

- Natives PC-Spiel mit Tauri, Windows zuerst; Browser nur Entwicklung/Test.
- Einziger Welt-Renderer: Three.js unter `src/renderer/three/`.
- Reine Simulation/Config unter `src/game/`; UI kommuniziert über
  `GameController`-Snapshots, Read-Modelle und Commands.
- Save-Schema **v13** mit linearer Kette `10→11→12→13`.
- Designsystem: maritime Navy/Gold-Tokens plus geordnete CSS-Schichten; das
  Stadtarbeit-Redesign liegt isoliert in `styles/citywork-v4.css`.

## Abgeschlossen

- Mockup-HUD mit Ressourcen, Stadtstatus, Hauptnavigation, Minimap,
  Bürgeranliegen, Bau-Shop, Gebäudedetail, Regionen, visuellem Wetter und
  Info-Layern.
- 3D-Inselwelt mit Küste/Wasser, Vegetationsclustern, Landmarken, Nebel,
  Wetter-Grading und prozeduralen Fallbacks für fehlende Drop-in-Modelle.
- Kanonische Anliegen-, Gebäudeplatzierungs-, Regions-, Straßenplan- und
  Balancing-Read-Modelle (C2–C7).
- Stadtarbeit: exakte manuelle Straßenkette, Config-Fahrzeuge, automatische
  3D-Ausführung, Ergebniswertung, Cargo/Kapazität, Reservierung, Nachfüllen,
  Leerfahrt und Infrastruktur-Hinweiscodes.

## Map Redesign 5.0 (v0.70)

- Unveränderte Inselkontur, Höhenbake, Regionspolygone und Baufelder; der Umbau
  erweitert ausschließlich den vorhandenen Three-Renderer.
- Zwölf visuelle Biomprofile für alle 32 Regionen mit weichen
  Nachbarschaftsübergängen und klaren Wüsten-/Sumpfreferenzzonen.
- Zwölf Terrain-Splat-Layer, triplanares Berg-/Klippenmaterial und sechs neue
  KI-generierte Base-Color-Texturen.
- Differenzierte Nadel-/Laubbaumverteilung, trockene und feuchte Props sowie
  neutrale Landmark-Slots mit prozeduralen Fallbacks.
- Bewegteres Ozeanmaterial und eine gebündelte animierte Flussströmungsfläche.
- Keine neue Spiellogik und keine Save-Änderung; Schema bleibt v13.

## Stadtarbeit Redesign 4.0 (v0.69)

- Drei klare Zonen: kompakte/filterbare Missionen, dominante Canvas-Karte,
  Fahrzeug/Cargo + Live-Tour + Bestätigung.
- Kein Werkzeugmodus: Straße zeichnet, freie Fläche/Mittel-/Rechtszug
  verschiebt, Mausrad und +/− zoomen; Leertaste/F/R/Esc und Marker-Doppelklick.
- Kein Planname, kein lokales Speichern/Laden und keine „Letzte Route“.
- Keine starre Zielreihenfolge. `targetOrderOnPath` leitet sie aus der ersten
  tatsächlichen Berührung der Zielanker ab.
- `getActivityRoutePreview` bündelt Route, Reihenfolge, Cargo-Stopps,
  Infrastruktur und Abschlussstatus. `evaluateCargoRoute` erkennt echte
  Quellrückkehr/Nachfüllung und Leerfahrt.
- Stilisierte Top-down-Karte mit echten Terrain-/Gebäude-/Straßendaten,
  Verkehr, Regionsgrenzen, Schatten, Routenglow, Pfeilen und Etappenfarben.
- Portrait-Berater für vorhandene Warncodes; keine erfundene Detailposition.
- Acht Fahrmissionen; v0.69 ergänzt Trinkwasser, Marktnachschub und
  Grünflächenversorgung als reine Config-Einträge.
- 20 generierte transparente UI-PNGs für Marker, Ladung, Berater und
  Missionsdioramen; sieben Drop-in-Ordner sind dokumentiert.
- Responsive Regeln für 1280×720 und 1920×1080: lokale Scroller, kompakte
  720p-Darstellung, erweiterte 1080p-Hierarchie, mindestens 12 px Schrift.

## Kanonische Stadtarbeit-Verträge

- Planung: `getActivityPlanningContext`, `getActivitySupplySources`,
  `getActivityDeliveryTargets`, `getAvailableActivityVehicles`,
  `getActivityRoutePreview`, `getActivityInfrastructureWarnings`.
- Start: `startActivity` / `setActiveActivityRoute` mit `{vehicle, roadPath}`.
- Laufzeit: `getActivityExecutionSnapshot`, `progressActivity`,
  `cancelActivity`.
- Persistiert: `ActiveActivity.vehicle`, `plannedRoadPath`, `reserved`.
- Prognose bleibt Prognose: `rewardMultiplier` beeinflusst die Auszahlung nicht.

## Bewusst nicht vorgetäuscht

- Mehrere auswählbare Quellen, Zwischenlager, Rückwaren, Depot-Rückkehr,
  optionale Stopps, Fahrzeugwechsel und mehrere Fahrzeuge brauchen kanonische
  Plan-Legs und Commands.
- Quellbestand ist global; es gibt keine erfundene gebäudeeigene Lagerhaltung
  oder Ladegeschwindigkeit.
- `InfrastructureWarning` besitzt keine `roadPoint`/`segmentId`; der Berater
  fokussiert deshalb die gesamte Tour.
- Steigung, Straßenbelag/-zustand, Sperrungen, dynamischer Stau, Kraftstoff,
  Fahrzeugschaden und spielerisches Wetter fehlen weiterhin als Game-Daten.
- Zug/Flug bleiben `future:true`, bis Schiene/Flughafen vollständiges Gameplay
  und ggf. Migration besitzen.

## Prüfung und Einstieg

Die finale Matrix des aktuellen Arbeitsstands steht im jüngsten Abschnitt von
`HANDOFF_LOG.md`. Danach lesen: `docs/HANDOFF_CLAUDE.md`, `OPEN_TASKS.md`,
`UI_COMPONENT_MAP.md` und `UI_ASSET_MANIFEST.md`.

Wichtige Einstiegspunkte: `src/App.tsx`, `src/components/panels/`,
`src/components/citywork/`, `src/styles/`, `src/game/commands/controller.ts`,
`src/game/activities/`, `src/renderer/three/ThreeMapRenderer.ts` und
`src/assets/registry.ts`.
