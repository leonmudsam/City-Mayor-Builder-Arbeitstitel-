# 3D-Modelle — Welt-UI (3D-Anzeigen über Gebäuden)

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Ordner: `src/assets/models/ui/`  ·  Loader: `uiModel()`  ·  Schlüssel = Dateiname (rekursiv).

Schwebende 3D-UI: Auswahlring, Upgrade-/Bau-Buttons und Level-Badge über dem ausgewählten bzw. betroffenen Gebäude. Ohne Modell zeichnet der Renderer die prozedurale Variante (z. B. den leuchtenden Auswahlring).

| Zweck | Akzeptierte Dateinamen (Priorität →) | Hinweis |
|---|---|---|
| Auswahlring | `ui_selection_ring.glb` → `selection_ring.glb` | unter dem ausgewählten Gebäude |
| Upgrade-Button (schwebend, klickbar) | `ui_upgrade_button.glb` → `ui_button_upgrade.glb` → `button_upgrade.glb` |  |
| Bau-/Aktions-Button (schwebend) | `ui_build_button.glb` → `ui_button_build.glb` → `button_build.glb` |  |
| Level-Badge | `ui_level_badge.glb` → `level_badge.glb` → `ui_badge.glb` |  |

Fehlt ein Modell, greift der prozedurale Fallback — das Spiel bricht nie. Die volle Spezifikation (Footprint, Höhe, Pivot, Platzierung, Biom, Budget) für diese UND alle geplanten Modelle dieses Ordners steht in `PROMPTS.md` daneben.
