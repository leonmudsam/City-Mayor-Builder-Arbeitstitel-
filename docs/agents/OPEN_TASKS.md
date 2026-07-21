# Offene Aufgaben nach v0.70

## Map Redesign 5.0 — nächster Produktionspass

### P0 — visuelle Zielhardware-Abnahme

- Referenz-Screenshots für Gebirge, Gras/Wald, Küste/Wasser, Wüste/Sumpf sowie
  Morgen, Nebel und Nacht bei 1920×1080 archivieren und mit den Mockups prüfen.
- Auf Windows-Zielhardware FPS, Draw-Calls, Dreiecke und Texturspeicher in
  Stadt- und Vollinselansicht messen; Landmark-Caps nur datenbasiert verändern.

### P1 — Materialien und Drop-ins

- Passende Normal-/Roughness- und optional AO-/Height-Maps für Berg, Schnee,
  Wüste, Sumpf, Wiese und Küstenkies ergänzen; Shader und Registry gemeinsam
  erweitern. Aktuell sind die neuen Quellen ehrliche Base-Color-Texturen.
- Optimierte GLBs aus `WORLD_ASSET_MANIFEST.md` einlegen: Felsbogen, Urbaum,
  Ruine, Wüstenfelsnadel, Sumpfbaum, Seeinsel, Schilf, Totholz, Felscluster.
- Küstenspray, Caustics und eigene ruhige Seevariation nur im bestehenden
  Wasserpfad ergänzen, nicht als zweite Wasserpipeline.

### P1 — TODO(CLAUDE_LOGIC)

- Entscheiden, ob Morgenküste und Westbucht spielmechanisch Wüste/Sumpf werden.
  Erst dann Biome/Modifikatoren in validierter Config ändern, Balancing testen
  und bei persistierten Feldern die lineare Save-Migration ergänzen.
- Keine visuellen Profilwerte als Gameplay-Daten auslesen.

## Stadtarbeit Redesign 4.0 — erledigt

- ✅ gemeinsames Zeichnen/Pan/Zoom ohne Werkzeugmodus
- ✅ automatischer Fit und großer Zoomumfang
- ✅ „Letzte Route“, Planname und lokale Routenvorlage entfernt
- ✅ Reihenfolge aus dem exakten Weg statt Drag-&-Drop-Liste
- ✅ Live-Tour, Cargo, Nachfüllstopps, Leerfahrt und Infrastrukturberater
- ✅ kompakte Fahrzeugkarten und Missionen mit Bildern/Tags/Filtern
- ✅ 20 transparente KI-Assets plus Drop-in-Dokumentation
- ✅ neue Controller-Read-Modelle, reine Route-/Cargo-Helfer und Tests
- ✅ Save bleibt v13

## P1 — TODO(CLAUDE_LOGIC): nächste kanonische Logistikdaten

1. Quellenwahl: `sourceBuildingId` als validierter Planparameter/Command; heute
   ist die erste echte Quelle deterministischer Start.
2. Plan-Legs für Zwischenlager, Depot-Rückkehr, Rückwaren, optionale Ziele,
   Fahrzeugwechsel und mehrere Fahrzeuge. Benötigt werden Typ, Gebäude-ID,
   Pflichtstatus, Ladungsdelta und validierter Teilpfad.
3. `InfrastructureWarning.roadPoint` oder `.segmentId` für exakten
   Berater-Kartenfokus.
4. Gebäudeeigener Quellbestand und Ladeleistung nur als vollständiges
   Lager-/Warenflussmodell; nicht aus dem globalen Pool ableiten.
5. Adaptive Mengen (L5), Zwischenlager (L6), Bahn/Flug (L7) gemäß
   `CITYWORK_LOGIC_2_PLAN.md`.

## P1 — weitere echte Simulationsdaten

- Steigung/Höhenprofil aus Terrain-/Straßenprojektion.
- Straßenqualität/-zustand, Sperrungen und dynamischer Verkehr.
- Fahrzeugzustand, Kraftstoff und Schäden als zusammenhängende Phase.
- `rewardMultiplier` erst nach Wirtschaftstest an Auszahlung koppeln.
- 3D-Ausführung um sichtbare Quellhalte/Nachlade-/Rückfahrt-Etappen erweitern;
  Planungsdaten liegen bereits in Cargo-Plan/-Route.

## P1/P2 — Welt und Systeme

- Echter GLB-Ghost für Platzieren/Verschieben; `placementDiagnostics` nutzen.
- Wirkungsradien auf Gelände projizieren; `getCoverageOverlay` nutzen.
- Straßenbau vollständig als Planen → Vorschau → Bestätigen → Command.
- Lane-/Kreuzungsbelegung und Kollisionsvermeidung.
- Spielerisches Wetter nur mit klarer Simulationsentscheidung; v0.62-Presets
  bleiben rein visuell.
- Ausbauflächen erst mit Datenmodell, Bake und linearer Migration.

## Nicht tun

- Keine zweite Karte, Verkehrs- oder Aktivitätssimulation.
- Keine automatische Wegergänzung zwischen manuellen Routenklicks.
- Keine direkte State-Mutation aus React.
- Keine erfundenen Lager-, Straßen-, Wetter- oder Routendaten in der UI.
- Keine neuen Modellnamen außerhalb des Manifests.
- Keine Save-Änderung ohne lineare Migration.

Offen bleibt außerdem der native Tauri-Build, falls lokal keine Rust-/Cargo-
Toolchain vorhanden ist. Screenshotstatus und genaue Prüfergebnisse stehen im
jüngsten `HANDOFF_LOG.md`.
