# Projektstand — v0.80

Stand: 23. Juli 2026

## § Change 9.0 — Zentraler Start & Regionsbalancing S1/S2 (v0.80)

- **S1:** Startregion neu gebacken — 820→**1.400** bebaubare Kacheln (echtes
  Zentrum, §3.3), über die Bake-Zielvorgabe statt manuellem Verschieben (§3.2).
  Rathaus (144,191), Expansion 1.0, Zentralität 0.79.
- **S2:** Forst-Ids rotiert (Nordwald→12, Südforst→11, Ostforst→10),
  L3-Erstwahl {7,12} (§5.2), Namen/Level/Kosten angeglichen.
- **Save v19** (Weltumbau, Backup/Neustart `cmb.save.backup.world-v18`).
  **340 Tests grün**, tsc/eslint/build/3D-Smoke ok. D-033.
- **Offen:** S3 Fog/Kamera-Clamping, S4 Vegetations-Performance, S5 lebendige Welt,
  S6 Sägewerk-Arbeitsmodus, S7 Steinbruch/Farm, S8 weitere Betriebe.

## Active Operations 2.0 — Lagertransport A5 (v0.79)

- **Transport-Loop geschlossen:** Ein manueller Transport bringt lokal geerntetes
  Holz über Fahrzeug + Straßenroute ins **Zentrallager** (globaler Pool über ein
  Lagergebäude als Anlieferpunkt). Erst dann ist es global nutzbar (§7.2).
- Reine Sim `src/game/operations/transport.ts`, Zustandsmaschine
  `loading→in_transit→unloading→delivered` (nur live), Reservierung im
  Quell-Lager, gedeckelte Einlagerung (kein Doppelzählen). **Verwendet
  `routeAnalysis.ts` + `logistics.ts` wieder — kein zweites System (§8).**
- Transport-UI im Gebäudefenster (Ziel/Fahrzeug/Vorschau/Rückruf, laufende
  Transporte mit Fortschritt). Additive gepoolte 3D-Fahrzeuge.
  `getInventoryNetworkOverview` = global/lokal/reserviert/unterwegs.
- **A5-Reste** ebenfalls umgesetzt: Mehrfachladungen/Nachfüllfahrten (Fahrzeug
  pendelt), Rückruf jederzeit (Ladung kehrt zurück), Betriebskosten je Fahrt.
- **Save v18** (additiv `operations.transfers`, Migration `v17→v18`, alte Saves
  bleiben ladbar). **339 Tests grün** (12 Transporttests). Offen:
  Zwischenlager-Puffer, Kraftstoff, A6–A10.

## Active Operations 2.0 — Sägewerk-Referenzschnitt (v0.78)

- Das Sägewerk erzeugt kein passives Holz mehr: Arbeitsauftrag → Arbeiter fällen
  markierte Bäume → tragen Holz ins **lokale Betriebslager**; volles Lager stoppt.
- **Ressourcenknoten (Bäume)** = echte Sim-Objekte, stabile Id `"x,y"`,
  deterministisch aus Wald abgeleitet, nur Deltas persistiert; Regeneration nur
  auf gültigem Terrain.
- Neuer **Betriebsbereich** im Gebäudefenster (Aktionsbutton, Arbeiter, Auftrag,
  lokales Lager, Vorschau/Warnungen). Renderer zeichnet Arbeiter additiv.
- Reines Sim-Modul `src/game/operations/**`; passiver `produce`-Pfad für
  `operation`-Gebäude in Tick+Derived abgeschaltet. **Save v17** (additiv,
  Migration `v16→v17`, alte Saves bleiben ladbar).
- **327 Tests grün** (9 neu). Sägewerkholz bis Phase A5 (Transport) bewusst lokal
  gebunden. Verbindlicher Einstieg: `ACTIVE_OPERATIONS_PLAN.md`.

## Final World Compaction — Säule B: Vegetations-Performance (v0.77)

- Vier Grafik-Qualitätsstufen (Niedrig/Mittel/Hoch/Ultra) in den Einstellungen;
  reine, getestete Schicht `graphicsQuality.ts`/`graphicsSettings.ts`.
- Vegetationsdichte skaliert je Stufe (Kernvegetation bleibt), striktes
  Schattenbudget, Nahdetail-/Auflösungs-/Tierbudget je Stufe.
- Dev-Performance-Panel (FPS/Draw-Calls/Dreiecke/Vegetations-Instanzen).
- Bereits vorhanden genutzt: InstancedMesh je Proptyp, Pro-Region-Budgets,
  Frustum-Culling. Deep-LOD (HLOD/Impostor/Chunk-Streaming) mit bereitliegender
  `vegetationLodTier`-Funktion zurückgestellt (nur auf Zielhardware messbar).
- Kein Save-Bump. 318 Tests grün, Build + 3D-Smoke über alle Stufen fehlerfrei.

## Final World Compaction & 12-Regionen-Progression — Säule A (v0.76)

- Insel ein zweites Mal horizontal verdichtet (Spannweite 420 → 374, Fläche
  −20,7 %); Gipfelhöhe getrennt 50 → 52. Gebäude/Straßen/Fahrzeuge unskaliert.
- 40 Regionen → **1 zentrale Startregion + 12 bedeutende Freischaltungen**
  (Ø 2 622 bebaubare Kacheln). Preise aus dem Faktormodell `regionCost.ts`,
  gegen `regions.config.ts` getestet.
- Erste Erweiterung ab Level 3 gratis (ohne Geld/XP/Bürgeranliegen);
  Archipel-Regionen verlangen einen aktiven Hafen. Regionsdialog zeigt Gratis-
  und Hafen-/Nachbarschaftszustand.
- Neuer Startpunkt Rathaus (137, 194), kompakter 820-Kachel-Kern.
- **Save-Schema v16**; `v15 → v16` sichert unter `cmb.save.backup.world-v15` und
  startet transparent neu. 310 Tests grün.
- Verbindliche Berichte: `WORLD_COMPACTION_REPORT.md`,
  `REGION_CONSOLIDATION_PLAN.md`.

**Säule B (Vegetations-Performance) ist noch offen** — siehe `OPEN_TASKS.md` und
`WORLD_PERFORMANCE_AUDIT.md`.

## Core Gameplay Overhaul 8.0 — Phase G1 + Zeitvertrag (v0.75)

- Stadtarbeit zählt abgeschlossene Ziele korrekt. Ein leer passiertes Ziel
  bleibt offen und wird nach dem Nachfüllen beim zweiten Kontakt beliefert;
  Lieferziele und Nachfüllstopps werden getrennt ausgewiesen.
- Die Verkehrslast entsteht ab der ersten gezeichneten Kachel aus dem echten
  Straßengraph (`forecastRouteTraffic`), in vier Stufen und mit Zeitverlust.
- Der Abschlussbericht (`ActivityRunResult`) besteht ausschließlich aus echten
  Simulationswerten; nicht zutreffende Kennzahlen entfallen statt „– %".
- Vegetation und Props sind pro Region budgetiert und positionsstabil — ein
  Region-Unlock verändert bestehende Regionen nicht mehr.
- Pause/1×/2×/4× steuern die echte Simulation über `advanceByRealTime`.
  Einnahmen, Verbrauch, Produktion, Wachstum und Bauzeit skalieren zwingend
  gemeinsam; UI, Kamera und Planung bleiben in der Pause bedienbar.
- Fünf Bürgeranliegen nannten pre-×20-Einwohnerzahlen; Texte korrigiert und per
  `tests/questText.test.ts` gegen Rückfall gesichert.
- Save-Schema unverändert **v15**, keine Migration.

Verbindlicher Einstieg für die Weiterarbeit:
`CORE_GAMEPLAY_OVERHAUL_AUDIT.md` → `CORE_GAMEPLAY_OVERHAUL_PLAN.md`.
Phase G2 beginnt zwingend mit dem Terrain-Picking (Audit §2.1).

## Technische Basis

- Natives PC-Spiel mit Tauri, Windows zuerst; Browser nur Entwicklung/Test.
- Einziger Welt-Renderer: Three.js unter `src/renderer/three/`.
- Reine Simulation/Config unter `src/game/`; UI kommuniziert über
  `GameController`-Snapshots, Read-Modelle und Commands.
- Save-Schema **v15**; v14 wird wegen Maßstab, Wasserlinie und neuen
  Koordinaten einmalig unter `cmb.save.backup.world-v14` gesichert. Neustarts
  beginnen im zentralen Herzland.
- Designsystem: maritime Navy/Gold-Tokens plus geordnete CSS-Schichten; das
  Stadtarbeit-Redesign liegt isoliert in `styles/citywork-v4.css`.

## Abgeschlossen

- Waterways, Harbors & Infrastructure 7.0: Küstenkegel an der Bake-Ursache
  entfernt und mit Diagnosedaten abgesichert; radialer Fern-Ozean,
  atmosphärischer Abschluss und organische Ferninseln ersetzen die erkennbare
  Weltplatte.
- Regionsnebel und Gameplay-Freischaltung sind getrennt. Der visuelle Dev-Reveal
  zeigt Terrain, Vegetation, Props und Landmarken ohne Save-Mutation; der
  separate Controller-Cheat schaltet nur regulär erschließbare Regionen frei.
- Gebäude sind ohne Straße platzierbar, bleiben aber bis zum Anschluss ohne
  reguläre Simulationswirkung und tragen differenzierte Straßen-/Wasser-/
  Teilnetzmarker.
- Kleiner Anleger und Flusshafen nutzen getrennte Land-/Wasser-Footprints,
  automatische Küstenausrichtung, Tiefenprüfung, prozedurale Fallbacks und
  Drop-in-GLBs.
- 569 Wasser-Nodes und 1.775 landfreie Kanten bilden die geometrische
  Routengrundlage. Controller-Read-Helper, gestrichelte Hafen-Vorschau und das
  optionale Infrastruktur-Overlay projizieren dieselben Daten.
- Keine persistente Schifffahrt und keine Save-Änderung; Schema bleibt **v15**.

- Terrain & World Scale 6.1: Quellinsel pro X/Z-Achse auf 0,8898 verdichtet,
  44.757 Baukacheln (−20 %), Wasserlinie angehoben, 16 garantierte
  5×5-Uferplattformen, zentraler Start in Region 24 und vorbereitete
  Küstenankunft/Versorgungstrasse.
- 2048er Terrainbibliothek mit world-space/triplanarem Splat, ausgewählten
  PBR-Zusatzmaps, Regen-Wetness und nahsichtbegrenztem Mikrogras.
- Zentrale Surface-Abfrage, waagerechte Gebäude mit Fundament, 64 cullbare
  Terrain-Chunks, Tiefenwasser und rein visueller Dev-Reveal.

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

## Regions-Wolkenwand (v0.71)

- Gesperrte Regionen werden oberhalb ihres höchsten Terrainpunkts vollständig
  verdeckt; Gipfel, Landmarken und Biomfarben bleiben bis zur Freischaltung
  verborgen.
- Eine verbreiterte Kontur, drei texturierte Wolkenlagen und ein gedeckeltes
  `InstancedMesh` bilden Decke, Tiefe und atmosphärischen Rand ohne einzelne
  Draw-Calls je Wolke.
- Weltmarker zeigen Schloss, kanonischen Regionsnamen und echtes
  Freischaltlevel. Klicks öffnen den vorhandenen Regionsdialog.
- Die Minimap ersetzt gesperrtes Terrain durch eine Wolkenmaske und zeichnet
  Schloss-/Level-Marker an den gebackenen Regionszentren.
- Historisch rein visuelle Renderer-/HUD-Änderung; der aktuelle Weltbake und
  Schema v15 stammen aus 6.1.

## Map Redesign 5.0 (v0.70)

- Unveränderte Inselkontur, Höhenbake, Regionspolygone und Baufelder; der Umbau
  erweitert ausschließlich den vorhandenen Three-Renderer.
- Zwölf visuelle Biomprofile, in 6.1 auf alle 40 Regionen übertragen, mit weichen
  Nachbarschaftsübergängen und klaren Wüsten-/Sumpfreferenzzonen.
- Zwölf Terrain-Splat-Layer, triplanares Berg-/Klippenmaterial und sechs neue
  KI-generierte Base-Color-Texturen.
- Differenzierte Nadel-/Laubbaumverteilung, trockene und feuchte Props sowie
  neutrale Landmark-Slots mit prozeduralen Fallbacks.
- Bewegteres Ozeanmaterial und eine gebündelte animierte Flussströmungsfläche.
- Keine eigene Biom-Spiellogik; Schemaänderungen stammen ausschließlich aus den
  späteren Weltkoordinatenwechseln.

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
