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
> **[docs/agents/README.md](docs/agents/README.md)**

## Tech-Stack
React 18 · TypeScript (strict) · Vite 6 · three.js (3D-Karte) ·
Zustand · Zod · Vitest · **Tauri 2** (Desktop-Wrapper).

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
