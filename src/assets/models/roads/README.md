# 3D-Modelle — Straßen

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Ordner: `src/assets/models/roads/`  ·  Loader: `roadModel()`  ·  Schlüssel = Dateiname (rekursiv).

Die prozedurale, durchgehende Fahrbahn bleibt nahtloser Fallback. Diese Modelle ergänzen automatisch gewählte Varianten als instanzierte Near-LOD-Kits.

| Zweck | Akzeptierte Dateinamen (Priorität →) | Hinweis |
|---|---|---|
| Ebene Straße | `road_flat.glb` | instanziertes Detailkit |
| Hangstraße | `road_slope.glb` | instanziertes Detailkit |
| Stützstraße | `road_support.glb` | Stützmauer/Bankett |
| Viadukt | `road_viaduct.glb` | Deck-/Bogendetail; Pfeiler bleiben profilgesteuert |
| Haarnadelkurve | `road_hairpin_curve.glb` | nur an automatisch ermittelten Passkehren |
| Küstenstraße | `road_coast.glb` | Seemauer-/Uferdetail |

Fehlt ein Modell, greift der prozedurale Fallback — das Spiel bricht nie. Die volle Spezifikation (Footprint, Höhe, Pivot, Platzierung, Biom, Budget) für diese UND alle geplanten Modelle dieses Ordners steht in `PROMPTS.md` daneben.
