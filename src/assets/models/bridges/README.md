# 3D-Modelle — Brücken

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Ordner: `src/assets/models/bridges/`  ·  Loader: `roadModel()`  ·  Schlüssel = Dateiname (rekursiv).

Modulares Brückendetail über dem kanonischen Deck. Fehlt das Modell, baut der Renderer Deck, Geländer und tiefenabhängige Pfeiler vollständig prozedural.

| Zweck | Akzeptierte Dateinamen (Priorität →) | Hinweis |
|---|---|---|
| Automatische Wasserbrücke | `road_bridge.glb` | instanziertes Near-LOD-Kit |

Fehlt ein Modell, greift der prozedurale Fallback — das Spiel bricht nie. Die volle Spezifikation (Footprint, Höhe, Pivot, Platzierung, Biom, Budget) für diese UND alle geplanten Modelle dieses Ordners steht in `PROMPTS.md` daneben.
