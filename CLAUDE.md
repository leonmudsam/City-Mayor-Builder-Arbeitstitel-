# CLAUDE.md — Arbeitsregeln (verbindlich)

City Mayor Builder wird als **natives PC-Spiel** (Tauri, Windows zuerst) aus **einer**
Codebasis entwickelt; der Browser ist nur Dev/Test. Vollständige Begründung:
`docs/PROJECT_STRATEGY.md`. Architektur: `docs/ARCHITECTURE.md`.

## Harte Regeln
1. **Simulation ≠ Rendering.** Nichts unter `src/game/**` darf `three`, `pixi.js`,
   `react`, `zustand`, `../renderer`, `../components` oder `../state` importieren. UI
   liest Snapshots über den `GameController` (`version`/`subscribe`) und schickt
   Commands — mutiert nie direkt den State.
2. **Erweitern statt neu bauen.** Neues Gebäude/Mission/Quest/Ressource = Eintrag in
   der passenden `src/game/config/*.ts` (Zod-validiert), kein neues System. Vor einem
   neuen System prüfen, ob ein bestehendes erweitert werden kann.
3. **Saves brechen nie.** Schema-Änderung → `SCHEMA_VERSION` in `src/game/newGame.ts`
   erhöhen **und** eine Migration `n→n+1` in `src/game/storage/migrations.ts`
   ergänzen. Alte Spielstände müssen ladbar bleiben.
4. **Beide Modi müssen laufen.** Browser (`npm run dev`) **und** Desktop
   (`npm run tauri:dev`/`tauri:build`). Keine Annahmen über einen absoluten
   Basis-Pfad; `base: '/'`. Assets nur über die Drop-in-Registry laden.
5. **Drop-in-Assets.** `.glb`/Bild mit korrektem Namen einlegen → automatisch genutzt,
   sonst prozeduraler Fallback (nie crashen). Namen zentral in
   `src/assets/modelManifest.ts`; der Renderer importiert von dort, die Ordner-READMEs
   werden generiert (`tests/modelReadmes.test.ts` hält sie synchron:
   `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`).
6. **Performance by default.** Instancing, LOD, Culling, wenige Draw-Calls, keine
   unnötigen Re-Renders. Nicht „später optimieren".
7. **Gameplay vor Grafik.** Features sollen langfristig motivieren und strategische
   Tiefe schaffen, nicht nur hübsch sein.

## Verifikation vor jedem Commit
`npx tsc -b --force` · `npx eslint src tests` · `npx vitest run` · `npm run build`.
Bei Rendering-Änderungen zusätzlich ein 3D-Screenshot-Smoke (Playwright im
Scratchpad, `vite preview`, Basis-URL `/`). Der **Windows-Tauri-Build läuft nicht in
der Cloud-Umgebung** (kein Rust/Windows) — dort nur den Browser-Pfad verifizieren.

## Konventionen
- Commits, Patch Notes und In-Game-Texte auf **Deutsch**. Patch Notes ausführlich
  (Was/Warum/Architektur/Auswirkung/Zukunft/Dateien/Assets) in `docs/PATCHNOTES.md`.
- Modell-Identifier (`claude-*`) niemals in Commits/Code/PRs.
- Commit-Trailer:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01N5jzudvxboYPYLvPCVhDw9`
- Entwicklungsbranch: `claude/city-builder-concept-w2f70y`.

## Nicht anfassen ohne Grund
`src-tauri/target`, `src-tauri/gen`, `dist/`, `node_modules/`, `scratchpad/`
(gitignored). GitHub Pages ist abgeschaltet — kein Deploy-Workflow wieder einführen.
`archive/legacy-2d/` = archivierte 2D-/Iso-Reste (nicht reaktivieren).

## Status: Ausbaustufe 2.0 abgeschlossen (v0.50–v0.59)
Gebäudesystem 2.0 + Welt 2.0 sind vollständig (A1–A10). **Nur noch der
3D-Renderer** existiert (`src/renderer/three/`); der 2D-/Iso-Pixi-Renderer,
`house_row`/`apartment` und `pixi.js` sind endgültig entfernt (kein Modus-Wähler
wieder einführen). Gebäude-/Regions-/Prompt-Doku ist **generiert & testgeprüft**
(`docs/BUILDINGS.md`, `docs/REGIONS.md`, `models/**/PROMPTS.md` — Regel §5 gilt
weiter). Save-Schema steht bei **v13** (manuelle Routen + reservierte Ladung). Balancing/Progression sind über
20 Level × 32 Regionen ausbalanciert und durch `config.test.ts`/`balancing.test.ts`
gegen Regressionen gesichert. Bewusst offen (drop-in-fähig, Prompts existieren):
der erweiterte Biom-Prop-Katalog (Wasserfälle/Windmühlen/Boote/Landmarken) —
prozedurale Fallbacks decken den Kern, echte `.glb` einfach einlegen.

## Status: Overhaul 3.0 — verbindlicher Mockup-Pass (v0.60–v0.70)
Die visuelle Mockup-Grundlage ist umgesetzt: maritimes Glas-HUD, vertikale linke
Hauptnavigation, Live-Inselkarte, Bürger-Kompakt-/Detailansicht,
KI-Regions-Hero, Ein-Sheet-Regel, organischere Vegetation, Küstenschaum,
Wolken-/Regionsnebel sowie Drop-in-Boote, -Windmühlen und -Leuchttürme. Einstieg:
`docs/agents/README.md`; Designregeln: `docs/agents/UI_SYSTEM.md`; Restphasen:
`docs/OVERHAUL_3_PLAN.md`.

v0.61 ergänzt den großen Bau-Shop, Standort-/Radius-Gebäudedetails, eine
filterbare Anliegen-Inbox, den rein visuellen Info-Layer, Minimap-Panning,
Rollenporträts und hellere Berg-/Küsten-/Nebel-/Biomdarstellung. CSS ist unter
`src/styles/` nach Tokens/Layout/Komponenten/Animation/Responsive getrennt.
Der damalige `CODEX_VISUAL_AUDIT.md` bleibt als historische Grundlage erhalten.

v0.62 ergänzt den vollhohen rechten PC-Baushop ab 1680×860,
Gebäude-Stufenvorschauen, biomabhängige Regions-Heros, ein visuelles
Sonne-/Regen-/Nebel-Fenster samt Live-Renderer-Grading und gedeckelte
Wasserfall-Landmarken. Wetter bleibt reine Darstellung in
`environmentSettings`/`SkyEnvironment` und hat keinerlei Simulations- oder
Save-Wirkung.

v0.63–v0.65 ersetzen den alten Stadtarbeit-Prototyp durch eine echte, manuelle
Straßengraph-Planung innerhalb des bestehenden Aktivitätssystems. Der Spieler
zeichnet die Route selbst, ordnet Ziele, wählt ein datengetriebenes Fahrzeug und
verfolgt anschließend dessen automatische 3D-Fahrt. Die Abschlussansicht bewertet
Zeit, Distanz, Effizienz und Straßenabdeckung. `ActiveActivity.vehicle` und
`plannedRoadPath` sind optional persistiert; Save-Schema ist deshalb **v12** mit
Migration `v11→v12`. Alte v11-Spielstände bleiben gültig und erhalten keine
erfundene Route.

v0.66–v0.68 ergänzen Cargo/Kapazität, reservierte Ladung und reine
Infrastruktur-/Leerfahrtbewertung. Save-Schema ist **v13** mit linearer
Migration `v12→v13`. v0.69 überträgt Redesign 4.0: keine gespeicherte
Standardroute, keine Drag-&-Drop-Zielreihenfolge und kein Werkzeugmodus;
Reihenfolge, Tour, Cargo und Nachfüllen entstehen live aus dem exakten Weg.

v0.70 überträgt die Insel-/Biom-Mockups auf den bestehenden Three-Renderer:
zwölf visuelle Regionsprofile, zwölf Terrain-Splat-Layer, triplanares Gebirge,
differenzierte Vegetation, animierte Flüsse und neutrale Landmark-Fallbacks.
Inselbake, Gameplayregionen und Save v13 bleiben unverändert. Vor Weltarbeit
zuerst `docs/agents/MAP_REDESIGN_AUDIT.md`, danach
`MAP_REDESIGN_PLAN.md` und `WORLD_ASSET_MANIFEST.md` lesen. Region 9/29 sind nur
visuell Wüste/Sumpf; jede Gameplaywirkung ist `TODO(CLAUDE_LOGIC)`.

Verbindlicher Einstieg für die Weiterarbeit:
`docs/HANDOFF_CLAUDE.md` → `docs/agents/PROJECT_STATE.md` →
`docs/agents/OPEN_TASKS.md`. Keine zweite Verkehrs- oder Missionssimulation
anlegen. Noch fehlende echte Daten für Steigung, Straßenzustand und dynamische
Ereignisse sind dort ausdrücklich dokumentiert und dürfen in der UI nicht
vorgetäuscht werden.
