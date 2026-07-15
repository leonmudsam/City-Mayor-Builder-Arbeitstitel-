# 3D-Modelle — Marker (schwebende Statusanzeigen)

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Ordner: `src/assets/models/markers/`  ·  Loader: `markerModel()`  ·  Schlüssel = Dateiname (rekursiv).

Ein Marker pro Gebäude (Priorität: Aufgabe > Bau > Problem > Upgrade). Schwebt und rotiert.

| Zweck | Akzeptierte Dateinamen (Priorität →) | Hinweis |
|---|---|---|
| Aufgabe / Kartenziel | `marker_task.glb` → `marker_activity.glb` → `marker_target.glb` |  |
| Im Bau | `marker_construction.glb` → `marker_build.glb` |  |
| Problem | `marker_problem.glb` → `marker_alert.glb` |  |
| Upgrade verfügbar | `marker_upgrade.glb` → `marker_bonus.glb` → `marker_arrow.glb` |  |

Fehlt ein Modell, greift der prozedurale Fallback — das Spiel bricht nie.
