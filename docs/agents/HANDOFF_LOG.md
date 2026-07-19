# Handoff-Log

## 2026-07-19 — Codex — UI-/Welt-Overhaul v0.60

### Änderung

- Vier Mockup-Referenzen in eine gemeinsame UI-Architektur übertragen.
- Top-HUD, linke Navigation, Live-Minimap, Bürgerdetail, Regions-Hero,
  Gebäudefenster und Stadtarbeit-Routenplaner umgesetzt.
- Welt visuell mit Ozean-/Küstenpolish, Wolkennebel, Vegetationsclustern und
  Landmarken aufgewertet.
- KI-/generative Assets integriert und Drop-in-Fallbacks dokumentiert.
- Controller um RNG-neutrale Routenvorschau und validierte Zielreihenfolge
  erweitert; Save-Struktur unverändert.

### Architektur

- Keine UI-/Renderer-Imports in `src/game/**`.
- UI mutiert keinen GameState.
- Save-Schema bleibt v11.
- `TODO(CLAUDE_LOGIC)` markiert die noch geschätzten Verkehrsdaten.

### Prüfung

- TypeScript: grün.
- ESLint: grün.
- Vitest: 26 Testdateien / 185 Tests grün.
- Produktions-Build: grün; erwartete Chunk-Größenwarnung.
- Browser-Smoke 1280×720 und 1920×1080 grün.
- Ein-Sheet-Test: Bürgerdetail schließt beim Öffnen des Gebäudekatalogs.
- Browser-Konsole: keine Fehler oder Warnungen.

### Übergabe

Claude beginnt mit `PROJECT_STATE.md`, `OWNERSHIP.md` und `OPEN_TASKS.md`.
Keine Verkehrs- oder Zeitlogik aus den UI-Schätzwerten ableiten; zuerst eine
reine, getestete Datenquelle hinter dem Controller definieren.
