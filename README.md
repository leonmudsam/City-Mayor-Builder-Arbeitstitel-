# City Mayor Builder (Arbeitstitel)

Ein City-Builder mit aktivem Stadtmanagement: Gebäude, Bürger, Wirtschaft, Verkehr,
Missionen (Stadtarbeit) und eine lebendige 3D-Welt. **Zielplattform ist ein natives
PC-Spiel** (Windows zuerst, später Steam/macOS/Linux, danach Mobile) aus **einer**
Codebasis. Der Browser bleibt Entwicklungs- und Test-Umgebung.

> Verbindliche Richtung: **[docs/PROJECT_STRATEGY.md](docs/PROJECT_STRATEGY.md)** ·
> Architektur: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** ·
> Änderungen: **[docs/PATCHNOTES.md](docs/PATCHNOTES.md)** · Konzept:
> **[docs/CONCEPT.md](docs/CONCEPT.md)** · UI:
> **[docs/UI_DESIGN_SYSTEM.md](docs/UI_DESIGN_SYSTEM.md)** · Übergabe:
> **[docs/HANDOFF_CLAUDE.md](docs/HANDOFF_CLAUDE.md)** · Agenten-Einstieg:
> **[docs/agents/README.md](docs/agents/README.md)** · Aktueller Projektstand:
> **[docs/agents/PROJECT_STATE.md](docs/agents/PROJECT_STATE.md)**

## Tech-Stack
React 18 · TypeScript (strict) · Vite 6 · three.js (3D-Karte) ·
Zustand · Zod · Vitest · **Tauri 2** (Desktop-Wrapper).

## Aktueller visueller Stand — v0.72

World Rebuild 6.0 nutzt die neue 3D-Insel als Offline-Authoringquelle für eine
512×512-Kachelwelt mit 40 organischen Regionen, monumentalem Höhenfeld,
Ostküsten-Start, Tiefenwasser, dichter Vegetation und synchronen Karten für
Minimap und Stadtarbeit. Das 1,85-Millionen-Dreiecke-Modell wird nicht zur
Laufzeit geladen; 64 cullbare Terrain-Chunks verwenden die gebackenen Daten.

Die verbindlichen Mockups sind als maritimes Premium-PC-HUD umgesetzt:
Live-Inselkarte, linker Stadtstatus, Bürgeranliegen, manuelle 2D-Stadtarbeit,
rechter 4-Spalten-Baushop auf großen Ansichten, Gebäude-Stufenvorschau sowie
biomabhängige Regions-Heros. Sonne, Regen und Nebel lassen sich als rein
visuelle 3D-Atmosphäre steuern; sie verändern keine Simulation oder Saves.
Stadtarbeit besitzt das Redesign-4.0-Layout mit dominanter stilisierter Karte,
direktem Zeichnen/Pan/Zoom ohne Werkzeugmodus, aus dem Weg abgeleiteter
Stoppreihenfolge, Live-Cargo/Nachfüllungen, kompakter Fahrzeugwahl,
Tourübersicht, Infrastrukturberater und validierter Startfreigabe. Spontane
Aufträge speichern bewusst keine ideale Standardroute; die automatische
3D-Ausführung mit Verfolgerkamera und Ergebniswertung bleibt erhalten.
Gesperrte Regionen liegen vollständig unter einer dichten, animierten
Wolkenwand. Große Schloss-/Level-Tafeln in der Welt und entsprechende Marker
auf der Minimap machen Freischaltstatus und Voraussetzung sofort lesbar.
Details und offene Datenquellen:
[docs/agents/PROJECT_STATE.md](docs/agents/PROJECT_STATE.md).

## Zwei Laufmodi

### Entwicklung (Browser)
```bash
npm install
npm run dev        # http://localhost:5173  (Hot Reload)
```
Weitere Skripte: `npm run build`, `npm run preview`, `npm run lint`,
`npm run typecheck`, `npm test`.

### Desktop (Tauri, das echte Spiel)
```bash
npm run tauri:dev     # startet Vite + öffnet das native Fenster
npm run tauri:build   # baut die Windows-App (Installer unter src-tauri/target/…)
```

**Voraussetzungen für den Desktop-Build (einmalig, lokal):**
1. **Rust** (stabil) — https://rustup.rs
2. **WebView2** (auf Windows 11 vorinstalliert; sonst „Evergreen"-Runtime installieren)
3. Icons erzeugen: `npx tauri icon pfad/zu/quelle-1024.png`
   (siehe [`src-tauri/icons/README.md`](src-tauri/icons/README.md))
4. `npm install && npm run tauri:build`

Der Windows-Build läuft nur auf einem Windows-Host (bzw. der passenden CI). Der
Browser-Pfad (`npm run dev`/`build`) funktioniert plattformunabhängig.

## Projektstruktur (Kurzfassung)
- `src/game/` — **reine Simulation** (Config, Tick, Commands, Wirtschaft, Karte,
  Speicherstände). Keine Rendering-/React-Imports.
- `src/renderer/` — der Three.js-3D-Renderer hinter `IMapRenderer`.
- `src/components/` — React-UI. `src/state/` — Zustand-Store + Controller-Bridge.
- `src/assets/models/` — **Drop-in-3D-Modelle** (`.glb` mit korrektem Namen → wird
  automatisch genutzt; pro Ordner eine `README.md`).
- `src-tauri/` — nativer Desktop-Wrapper (Rust/Tauri).

Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## GitHub
GitHub dient nur noch Versionsverwaltung, Backup und Zusammenarbeit — **nicht** mehr
zum Spielen (kein GitHub-Pages-Deploy mehr). CI (`.github/workflows/ci.yml`) prüft
Lint/Typecheck/Tests/Build.
