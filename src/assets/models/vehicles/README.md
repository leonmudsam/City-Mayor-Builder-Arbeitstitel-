# 3D-Modelle — Fahrzeuge

> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.
> Neue Modelle dazunehmen: Namen dort ergänzen, dann
> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).
> Der Test schlägt fehl, sobald eine README veraltet ist.

Ordner: `src/assets/models/vehicles/`  ·  Loader: `vehicleModel()`  ·  Schlüssel = Dateiname (rekursiv).

Front zeigt +z (Fahrtrichtung). Verkehr und komplette Stadtarbeit-Flotte.

| Zweck | Akzeptierte Dateinamen (Priorität →) | Hinweis |
|---|---|---|
| Verkehrsauto | `car.glb` → `car_small.glb` → `car_sedan.glb` → `car_van.glb` |  |
| Liefer-Van (Stadtarbeit) | `service_van.glb` → `car_van.glb` → `van.glb` → `delivery_van.glb` → `truck_food.glb` |  |
| Mittlerer LKW (Stadtarbeit) | `medium_truck.glb` → `truck_delivery.glb` → `truck_food.glb` → `service_van.glb` |  |
| Großer LKW (Stadtarbeit) | `large_truck.glb` → `truck_heavy.glb` → `truck_delivery.glb` → `truck_food.glb` |  |
| Kühltransporter (Stadtarbeit) | `refrigerated_truck.glb` → `truck_refrigerated.glb` → `truck_food.glb` |  |
| Spezialtransporter (Stadtarbeit) | `heavy_transporter.glb` → `truck_heavy.glb` → `flatbed.glb` → `truck_material.glb` |  |
| Löschfahrzeug (Stadtarbeit) | `firetruck.glb` → `fire_truck.glb` → `truck_fire.glb` → `car.glb` → `car_small.glb` → `car_sedan.glb` → `car_van.glb` |  |
| Holztransporter (Stadtarbeit) | `logging_truck.glb` → `truck_logging.glb` → `truck_material.glb` → `car.glb` → `car_small.glb` → `car_sedan.glb` → `car_van.glb` |  |
| Streifenwagen (Stadtarbeit) | `police_car.glb` → `car_police.glb` → `car.glb` → `car_small.glb` → `car_sedan.glb` → `car_van.glb` |  |
| Pritschenwagen (Stadtarbeit) | `flatbed.glb` → `truck_material.glb` → `truck_flatbed.glb` → `car.glb` → `car_small.glb` → `car_sedan.glb` → `car_van.glb` |  |

Fehlt ein Modell, greift der prozedurale Fallback — das Spiel bricht nie. Die volle Spezifikation (Footprint, Höhe, Pivot, Platzierung, Biom, Budget) für diese UND alle geplanten Modelle dieses Ordners steht in `PROMPTS.md` daneben.
