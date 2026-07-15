# 3D-Modelle — Fahrzeuge

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Ordner: `src/assets/models/vehicles/`  ·  Loader: `vehicleModel()`  ·  Schlüssel = Dateiname (rekursiv).

Front zeigt +z (Fahrtrichtung). Verkehr und Stadtarbeit-Van.

| Zweck | Akzeptierte Dateinamen (Priorität →) | Hinweis |
|---|---|---|
| Verkehrsauto | `car.glb` → `car_small.glb` → `car_sedan.glb` → `car_van.glb` |  |
| Liefer-Van (Stadtarbeit) | `service_van.glb` → `car_van.glb` → `van.glb` → `delivery_van.glb` → `truck_food.glb` |  |

Fehlt ein Modell, greift der prozedurale Fallback — das Spiel bricht nie.
