# 3D-Modelle — Props & Vegetation

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Ordner: `src/assets/models/props/`  ·  Loader: `propModel()`  ·  Schlüssel = Dateiname (rekursiv).

Vegetation wird gegen die Stadt gecullt (nie auf Gebäude/Straße). Baustellen-Modelle (construction/) werden während Bau & Upgrade genutzt. Unterordner (nature/city/harbor/farm/construction/infrastructure) sind reine Organisation.

| Zweck | Akzeptierte Dateinamen (Priorität →) | Hinweis |
|---|---|---|
| Baum | `pine_tree.glb` → `tree_pine.glb` → `tree.glb` → `tree_deciduous.glb` | gecullt, instanziert |
| Busch | `bush_small.glb` → `bush.glb` → `bush_medium.glb` | gecullt, instanziert |
| Baustelle (Bau & Upgrade) | `construction_site.glb` → `construction_crane.glb` → `scaffold.glb` → `crane.glb` | generisch; pro Gebäude: <id>_construction.glb |

Fehlt ein Modell, greift der prozedurale Fallback — das Spiel bricht nie. Die volle Spezifikation (Footprint, Höhe, Pivot, Platzierung, Biom, Budget) für diese UND alle geplanten Modelle dieses Ordners steht in `PROMPTS.md` daneben.
