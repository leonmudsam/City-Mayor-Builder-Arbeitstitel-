# 3D-Modelle — Effekte

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Ordner: `src/assets/models/effects/`  ·  Loader: `effectModel()`  ·  Schlüssel = Dateiname (rekursiv).

Partikel-/Look-Effekte. Rauch am Schornstein aktiver Produktion.

| Zweck | Akzeptierte Dateinamen (Priorität →) | Hinweis |
|---|---|---|
| Schornstein-Rauch | `smoke_chimney.glb` → `smoke.glb` → `steam.glb` → `smoke_puff.glb` |  |

Fehlt ein Modell, greift der prozedurale Fallback — das Spiel bricht nie.
