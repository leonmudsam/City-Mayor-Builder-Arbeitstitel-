# Architektur

Wie das Projekt aufgebaut ist und **warum** es die Strategie
(`docs/PROJECT_STRATEGY.md`) technisch trägt. Die zentrale Eigenschaft: **die
Spielsimulation ist vollständig von der Darstellung getrennt** — dieselbe Simulation
läuft im Browser (Dev/Test) und in der nativen Tauri-App, später auf Mobile.

## 1. Laufmodi
- **Browser (Dev/Test):** `npm run dev` → Vite-Dev-Server auf `http://localhost:5173`
  (fester Port, `strictPort`, damit Tauri ihn erwartet). `base: '/'` in
  `vite.config.ts` — Root-Origin in allen Modi.
- **Desktop (Tauri 2):** `npm run tauri:dev`/`tauri:build`. Der Rust-Wrapper in
  `src-tauri/` öffnet ein Fenster und lädt dieselbe Frontend-Build (`../dist`) bzw.
  im Dev die `devUrl`. Es gibt **keinen** eigenen Spielcode in Rust — der Wrapper
  ist bewusst dünn.

## 2. Ordnerkarte (`src/`)
| Ordner | Inhalt |
|---|---|
| `src/game/` | **Reine Simulation.** `config/`, `simulation/` (Tick), `commands/` (Controller), `economy/`, `buildings/`, `map/`, `progression/`, `storage/` (Saves+Migration), `engine/` (RNG), `types.ts`, `newGame.ts`. Keine Rendering-/React-Imports. |
| `src/renderer/` | Rendering-Engines: `three/ThreeMapRenderer.ts` (3D), `MapRenderer.ts` (Pixi 2D/Iso), Kontrakt `IMapRenderer.ts`, `projection.ts`, `colors.ts`. Atmosphäre (rein visuell): `three/environment.ts` (Tag/Nacht-Grading, testbar), `three/SkyEnvironment.ts` (Himmel/Sonne/Mond/Sterne/Lichter/Fog), `three/environmentSettings.ts` (persistenter Store, nicht im Save). |
| `src/components/` | React-UI: `MapView.tsx` + `hud/`, `panels/`, `common/`, `art/`. |
| `src/state/` | Zustand-Store + Controller-/Map-Bridges (`store.ts`). Der React↔Sim-Seam. |
| `src/assets/` | Statische Kunst + `models/` (3D-`.glb`-Baum, Drop-in), `registry.ts`, `modelManifest.ts`. |
| `src/i18n/`, `src/services/` | Lokalisierung, Querschnittsdienste. |

## 3. Der Seam: Simulation ↔ UI/Rendering
**Regel:** Die React-/Renderer-Seite mutiert **niemals** direkt den Spielzustand.
Sie liest Snapshots und schickt Commands.

- **`GameController`** (`src/game/commands/controller.ts`): die einzige Command-API.
  Hält `config`, `state`, `derived` und einen `version`-Zähler. `subscribe(listener)`
  + internes `notify()` erhöhen `version` bei jeder Änderung. Commands (mutierend,
  Rückgabe `CommandResult`): `placeBuilding`, `upgradeBuilding`, `moveBuilding`,
  `unlockSector`, `setTaxRate`, Handel (`sellResource`/`fulfillTradeContract`),
  Stadtarbeit (`startActivity`/`progressActivity`/`chooseDecision`) usw. Lese-Helfer
  ohne Mutation: `getIncome`, `getBuildingDiagnostics`, `getCoverageOverlay`,
  `getActivityBoard`, … `update(now, live)` treibt die Simulation via `advance()`.
- **Zustand-Store** (`src/state/store.ts`): `gameController`-Bridge +
  `useGame()` (via `useSyncExternalStore` an `controller.subscribe` und
  `() => controller.version`). Daneben reiner **UI-State** (`useUiStore`: offenes
  Panel, Auswahl, Platzierung, `renderMode`, Kamera-Preset) — berührt nie den Save.
  `MapApi`-Bridge = kleine imperative Kamera-Oberfläche für die HUD.
- **Engine-Abstraktion** (`src/renderer/IMapRenderer.ts`): `init/destroy/setPlacing/
  setSelected/centerOnCity` + optionale 3D-Kamera-Methoden. Implementiert von der
  three.js- und der Pixi-Engine. `MapView.tsx` erzeugt/zerstört die Engine nur beim
  Wechsel über die 2D↔3D-Grenze (`engineFor(mode)`); beide bekommen denselben
  `controller` und ein gemeinsames `RendererCallbacks`-Objekt, das Karten-Interaktion
  in Controller-Commands übersetzt. Der Save wird dabei nie angefasst.

**Konsequenz:** Die Simulation ist server-/plattformfähig. Commands bilden 1:1 auf
eine spätere Server-/Netzwerk-API ab; das Rendering ist austauschbar.

## 4. Datengetriebene Systeme (erweitern statt neu schreiben)
`loadConfig()` (`src/game/config/index.ts`) validiert **alle** statische Config beim
Start mit Zod (`config/schemas.ts`, fail-fast) inkl. Querverweis-Checks (jedes
Level-Unlock/Quest-Ziel muss ein echtes Gebäude sein). Config-Dateien in
`src/game/config/`: `buildings`, `activities`, `quests`, `levels`, `needs`,
`resources`, `balancing` (+ `featuresConfig` Feature-Flags), `startRegion`,
`mayorActions`, `biomes`. → Neues Gebäude/Mission/Quest = Config-Eintrag, kein neues
System.

## 5. Drop-in-Assets
`src/assets/registry.ts` entdeckt Bilder und `.glb`-Modelle per
`import.meta.glob('…', { eager, query: '?url' })`, verschlüsselt nach Dateiname
(rekursiv). Diese URLs erben die Vite-`base` automatisch — deshalb genügte für den
Desktop-Pivot ein einziger `base`-Wechsel, kein Pfad-Refactor. `src/assets/
modelManifest.ts` ist die **einzige** Namensquelle: der Renderer importiert daraus,
und die `README.md` je Modellordner wird daraus generiert (Test:
`tests/modelReadmes.test.ts`). Fehlt ein Modell → prozeduraler Fallback.

## 6. Speicherstände & Migration (dürfen nie brechen)
`SCHEMA_VERSION` in `src/game/newGame.ts` (aktuell 9). Migrationen in
`src/game/storage/migrations.ts` als lineare Kette (`migrations[n]`: v`n`→v`n+1`).
`migrateAndValidate()` wendet die Kette an und validiert am Ende mit
`saveGameSchema` (Zod). Persistenz heute: `localStorage` (`cmb.save.*`) — funktioniert
in der Tauri-WebView unverändert (nur anderer Origin; Übertragung via Export/Import in
`SettingsPanel.tsx`). Native Datei-Saves sind eine spätere, additive Erweiterung.

## 7. Was der Desktop-Pivot NICHT verändert hat
Simulation, Rendering-Logik, Savegames, Config und Tests blieben unberührt. Der Pivot
war reine Infrastruktur: `vite.config.ts` (`base: '/'` + fester Port), `src-tauri/`
(Wrapper), CI ohne Pages, Doku. Genau weil der Seam schon sauber war.
