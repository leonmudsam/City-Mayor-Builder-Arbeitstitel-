# 3D-Modelle — Brücken

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Ordner: `src/assets/models/bridges/`  ·  Loader: `bridgeModel()`  ·  Schlüssel = Dateiname (rekursiv).

Wird verwendet, wenn eine Straße auf Wasser/Fluss liegt. Entlang der Straßenachse gedreht.

| Zweck | Akzeptierte Dateinamen (Priorität →) | Hinweis |
|---|---|---|
| Brücke über Wasser | `bridge_medium_road.glb` → `bridge_small_stone.glb` → `bridge_small_wood.glb` → `bridge_large_road.glb` → `bridge_road.glb` → `bridge.glb` |  |

Fehlt ein Modell, greift der prozedurale Fallback — das Spiel bricht nie. Die volle Spezifikation (Footprint, Höhe, Pivot, Platzierung, Biom, Budget) für diese UND alle geplanten Modelle dieses Ordners steht in `PROMPTS.md` daneben.
