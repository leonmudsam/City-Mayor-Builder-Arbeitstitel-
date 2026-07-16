# 3D-Modelle — Straßen

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Ordner: `src/assets/models/roads/`  ·  Loader: `roadModel()`  ·  Schlüssel = Dateiname (rekursiv).

Straßensegmente werden nach 4-Bit-Nachbarmaske gewählt und 90°-weise gedreht. Kanonik: gerade = N–S, Kurve = N+E, T = offen nach W, Ende = Arm nach N. Klassenvarianten (`road_main_*`) werden vor dem generischen Namen bevorzugt.

| Zweck | Akzeptierte Dateinamen (Priorität →) | Hinweis |
|---|---|---|
| Gerade | `road_main_straight.glb` → `road_straight.glb` | kanonisch N–S |
| Kurve | `road_main_curve.glb` → `road_curve.glb` | kanonisch N+E |
| T-Kreuzung | `road_main_t_intersection.glb` → `road_t_intersection.glb` |  |
| Kreuzung | `road_main_cross_intersection.glb` → `road_cross_intersection.glb` |  |
| Ende/Stich | `road_main_end.glb` → `road_end.glb` |  |

Fehlt ein Modell, greift der prozedurale Fallback — das Spiel bricht nie. Die volle Spezifikation (Footprint, Höhe, Pivot, Platzierung, Biom, Budget) für diese UND alle geplanten Modelle dieses Ordners steht in `PROMPTS.md` daneben.
