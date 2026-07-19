# Offene Aufgaben

## Abschluss dieser Phase

TypeScript, ESLint, 185 Tests, Produktions-Build und Screenshot-Smokes bei
1280×720/1920×1080 sind grün. Für v0.60 besteht kein offener P0-Punkt.

## P1 — Sichere visuelle Fortsetzung

- Echter GLB-Ghost für Platzieren/Verschieben; Abbruch erhält Ursprung.
- Wirkungsradien auf das Gelände projizieren und gegen Coverage-Werte testen.
- Größen-/Upgrade-Audit für kleine Büros und mehrstufige Gebäude.
- Gebäudedetail um echtes Renderer-Preview erweitern.

## P1 — Claude-Logik für Stadtarbeit

- `TODO(CLAUDE_LOGIC)` durch echte RouteAnalysis ersetzen.
- Kanonischen Straßengraphen aus vorhandenen Straßen ableiten.
- Segmentlast/`congestionScore` deterministisch berechnen.
- `estimatedDurationMs` aus Graph und Last liefern.
- Routenalternativen und `rewardMultiplier` definieren und balancieren.
- Tests für Determinismus, falsche Stoppreihenfolge und Save-Kompatibilität.
- Nur bei neuen persistierten Feldern: Schema v12 + Migration v11→v12.

## P2 — Gameplay-Phasen

- O6 Straßenplanung: Zeichnen → Vorschau → Bestätigen → Command.
- O9 Verkehr: Lane-/Kreuzungsbelegung und Kollisionsvermeidung.
- O11 Wetter/Zeit: echte Spielzeit nur mit klarer Simulationsentscheidung.
- O4 Ausbauflächen: erst mit Datenmodell, Bake und Migration.

## Nicht tun

- Keine zweite Karte oder zweite Aktivitätssimulation.
- Keine direkte State-Mutation aus React.
- Keine Wetter-/Verkehrsbelohnung allein aus UI-Heuristiken.
- Keine neuen Modellnamen außerhalb von `modelManifest.ts`.
- Keine Save-Änderung ohne lineare Migration.
