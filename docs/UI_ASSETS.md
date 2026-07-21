# UI-Grafik-Assets — Anleitung & Prompt-Liste (v0.69)

Ergänzung zu `docs/ASSETS.md`. Dieses Dokument listet die **UI-/Chrome-Grafiken**
(Buttons, Kategorien, Marker, Aktivitäten, Events, Belohnungen, Fahrzeuge,
Overlays). Wie bei den Gebäude-/Ressourcen-Assets gilt: Datei mit exaktem Namen in
den passenden Ordner legen → die UI zeigt sie **automatisch** (Drop-in via
`import.meta.glob`). Fehlt eine Datei, rendert ein eingebauter Fallback (Lucide-
Glyph in getönter Kachel oder vorhandene Vektorgrafik) — das Spiel crasht nie.

## Pipeline & Ordner

| Kategorie | Ordner | Registry-Funktion |
|---|---|---|
| Ressourcen | `src/assets/resources/` | `resourceImage(id)` |
| Gebäude | `src/assets/buildings/` | `buildingImage(id)` |
| Porträts | `src/assets/portraits/**/` | `portraitImage(role, seed)` |
| Buttons | `src/assets/ui/buttons/` | `buttonImage(id)` |
| Kategorien | `src/assets/ui/categories/` | `categoryImage(id)` |
| Marker | `src/assets/ui/markers/` | `markerImage(id)` |
| Aktivitäten | `src/assets/ui/activities/` | `activityImage(id)` |
| Events | `src/assets/ui/events/` | `eventImage(id)` |
| Belohnungen | `src/assets/ui/rewards/` | `rewardImage(id)` |
| Fahrzeuge | `src/assets/vehicles/` | `vehicleImage(id)` |
| Overlays | `src/assets/overlays/` | `overlayImage(id)` |
| HUD-Marke/Wappen | `src/assets/ui/brand/` | `brandImage(id)` |
| Umgebungs-Texturen | `src/assets/environment/` | `environmentImage(id)` |
| Kontextbilder | `src/assets/ui/{requests,regions,buildings,missions,weather,status,navigation}/` | `uiImage(id)` |
| Stadtarbeit | `src/assets/ui/citywork/**/` | `uiImage(id)` |

Seit v0.60 sind drei Referenz-Assets bereits eingebunden:

- `ui/brand/mayor_crest.png` — KI-generiertes Bürgermeisterwappen im Levelblock.
- `environment/cloud_bank.webp` — KI-generierte Graustufen-Alpha-Textur für
  Himmelswolken und horizontalen Regionsnebel. Fehlt sie, bleibt ein
  prozeduraler Canvas-Fallback aktiv.
- `ui/events/region_unlock_hero.webp` — KI-generiertes 16:9-Inselpanorama für
  den großen Regionsdialog. Fehlt es, bleibt der CSS-Landschaftsfallback aktiv.

Seit v0.61 ergänzen:

- `portraits/merchants/merchant_1.png`, `merchant_2.png`
- `portraits/workers/buildingDept_1.png`
- `portraits/emergency/fire_1.png`
- `ui/regions/region_unlock_highland.jpg` — Hero für Gebirge/Hügelland;
  Fallback bleibt `ui/events/region_unlock_hero.webp`.

Seit v0.62 ergänzen:

- `ui/regions/region_unlock_fertile.jpg` — Hero für Ebene, Flusstal und
  fruchtbares Land.
- `ui/regions/region_unlock_coast.jpg` — Hero für Küste, See und Insel.
- `ui/weather/weather_cycle_premium.jpg` — zusammenhängendes 3:1-Panorama für
  Sonne, Regen und Nebel im Wetter-/Tageszeitfenster.

Die drei v0.62-Bilder sind reine Präsentations-Assets. Sonne/Regen/Nebel werden
vom Renderer aus `environmentSettings` umgesetzt; daraus entstehen weder
Simulationswerte noch Save-Felder.

Seit v0.65 ergänzen vier KI-generierte RGBA-Fahrzeugkarten:

- `vehicles/medium_truck.png`
- `vehicles/large_truck.png`
- `vehicles/refrigerated_truck.png`
- `vehicles/heavy_transporter.png`

Die Originale wurden mit dem eingebauten Bildwerkzeug auf einem gleichmäßigen
`#ff00ff`-Hintergrund erzeugt und anschließend mit
`remove_chroma_key.py --auto-key border --soft-matte --despill` freigestellt.
Die UI lädt sie über `vehicleImage(imageKey)`. Löschen einer Datei aktiviert den
Lucide-Fallback; die 3D-Welt fällt unabhängig davon über
`ACTIVITY_VEHICLE_MODELS` auf GLB bzw. prozedurale Geometrie zurück.

Seit v0.69 ergänzen 20 transparente Stadtarbeit-Bilder unter
`ui/citywork/{markers,cargo,advisors,missions}`: acht Funktionsmarker, fünf
Ladungsgrafiken, zwei Beraterporträts und fünf Missionsdioramen. Sie laden
rekursiv per Dateiname über `uiImage`. `map`, `vehicles` und `tutorial` sind
dokumentierte Drop-in-Slots. Exakte Liste, Generierungsprompts,
Chroma-Freistellung und gegenwärtige/zukünftige Nutzung stehen in den lokalen
Ordner-READMEs und `docs/agents/UI_ASSET_MANIFEST.md`.

Kontextordner werden rekursiv über `uiImage(id)` geladen. Dateinamen müssen
projektweit unter `src/assets/ui/**` eindeutig bleiben.

## Technische Vorgaben (für ALLE UI-Assets)

- **Quadratisch, 512×512 px**, transparenter Hintergrund (PNG).
- Motiv **zentriert**, mit etwas Rand.
- Einheitlicher, cartoonartiger Spielstil (siehe Stil-Prefix in `docs/ASSETS.md`).
- Wird in der UI klein skaliert → lieber zu groß liefern.
- Erlaubte Formate: `.png` (empfohlen), `.webp`, `.jpg`.

**Stil-Prefix** (vor jeden Prompt setzen — identisch mit `docs/ASSETS.md`):

> `friendly cartoon mobile city-builder game asset, warm painted style, vibrant
> saturated colors, soft cel shading, clean rounded shapes, subtle drop shadow,
> centered, transparent background, high quality, no text, no watermark —`

---

## D. Buttons → `src/assets/ui/buttons/`

Verwendung: Quick-Action-Leiste unten rechts, Menü, Modals. Wenn vorhanden, ersetzt
das Bild das Lucide-Glyph im Button-Kachel.

| Datei | Motiv-Prompt |
|---|---|
| `btn_build.png` | a golden hammer and wrench crossed, build icon |
| `btn_trade.png` | a merchant market stall / trade handshake with coins |
| `btn_mayor.png` | a mayor's golden badge / ceremonial sash emblem |
| `btn_activities.png` | a clipboard with a checklist, city-work tasks |
| `btn_overlay.png` | stacked translucent map layers icon |
| `btn_statistics.png` | a rising bar chart with a coin |
| `btn_settings.png` | a cog / gear wheel |
| `btn_menu.png` | three stacked horizontal bars, menu |
| `btn_close.png` | a soft rounded X close symbol |
| `btn_back.png` | a rounded left arrow |
| `btn_confirm.png` | a green rounded check mark |

## E. Kategorien → `src/assets/ui/categories/`

Verwendung: Baumenü-Tabs (`CategoryArt`). Dateiname = Kategorie-Datei unten.

| Datei | Baukategorie | Motiv-Prompt |
|---|---|---|
| `cat_housing.png` | residential | a small cozy house, housing category tile |
| `cat_roads.png` | roads | a piece of paved road with lane markings |
| `cat_resources.png` | production | logs, stone blocks and a wheat sheaf grouped |
| `cat_services.png` | services | a shopping basket with a red cross and shield |
| `cat_energy.png` | energy | a glowing lightning bolt / power symbol |
| `cat_economy.png` | economy | a market shop with a coin |
| `cat_leisure.png` | leisure | a green tree with a park bench |
| `cat_administration.png` | government/special | a classical town-hall building with columns |
| `cat_decoration.png` | decoration | a colorful flower bed |

## F. Marker → `src/assets/ui/markers/`

Verwendung: Status-/Kartenmarker (`MarkerArt`).

| Datei | Motiv-Prompt |
|---|---|
| `marker_problem.png` | a red round warning pin with an exclamation mark |
| `marker_warning.png` | an amber caution triangle pin |
| `marker_benefit.png` | a green round pin with a plus / check |
| `marker_water.png` | a blue water-drop map pin |
| `marker_food.png` | a green food / apple map pin |
| `marker_safety.png` | a blue shield map pin |
| `marker_energy.png` | a yellow lightning map pin |
| `marker_new.png` | a sparkling "new" star pin |
| `marker_task.png` | a clipboard task map pin |

## G. Aktivitäten / Stadtarbeit → `src/assets/ui/activities/`

Verwendung: Stadtarbeit-Karten & Featured-Widget (`ActivityArt`).

| Datei | Motiv-Prompt |
|---|---|
| `activity_food_delivery.png` | a delivery box full of fresh food being carried |
| `activity_material_delivery.png` | a pallet of wooden planks and stone blocks |
| `activity_inspection.png` | a clipboard with a magnifying glass over a building |
| `activity_trade.png` | a trade contract scroll with coins and crates |
| `activity_decision.png` | a balance scale weighing two choices, decision |
| `activity_fire_response.png` | a firefighter responding to a small building fire |
| `activity_environment.png` | a green leaf and a recycling / clean-air motif |

## H. Events / Entscheidungen → `src/assets/ui/events/`

Verwendung: Event-/Entscheidungs-Modal-Hero (`EventArt`).

| Datei | Motiv-Prompt |
|---|---|
| `event_farmer_support.png` | a friendly farmer beside a barn asking for support |
| `event_trade_offer.png` | a merchant presenting a lucrative trade offer |
| `event_city_festival.png` | a cheerful city street festival with bunting |
| `event_energy_issue.png` | a power plant with a warning spark, energy issue |
| `event_citizen_conflict.png` | two citizens in a friendly dispute at a table |

## I. Belohnungen → `src/assets/ui/rewards/`

Verwendung: Belohnungszeilen in Quests/Stadtarbeit/Level-Up (`RewardArt`).
`reward_money`/`reward_gold` nutzen ansonsten die Ressourcen-Grafik.

| Datei | Motiv-Prompt |
|---|---|
| `reward_money.png` | a glowing stack of gold coins reward |
| `reward_xp.png` | a glowing blue XP star / level orb |
| `reward_gold.png` | a shiny premium gold bar reward |
| `reward_happiness.png` | a golden smiley medal, happiness reward |
| `reward_resource.png` | a wooden crate of mixed resources reward |

## J. Fahrzeuge → `src/assets/vehicles/`

Verwendung: vorbereitet für animierte Lieferfahrzeuge/Routen (§4, Folgephase).

| Datei | Motiv-Prompt |
|---|---|
| `truck_food.png` | a small cartoon delivery truck with food crates, side view |
| `truck_material.png` | a small flatbed truck carrying wood and stone, side view |
| `firetruck.png` | a red cartoon fire truck, side view |
| `police_car.png` | a blue-and-white cartoon police car, side view |
| `service_van.png` | a white service/utility van, side view |

## K. Overlay-Symbole → `src/assets/overlays/`

Verwendung: Service-Overlay-Legende/Kartensymbole (`overlayImage`).

| Datei | Motiv-Prompt |
|---|---|
| `overlay_water.png` | a blue water coverage symbol |
| `overlay_food.png` | a green food supply symbol |
| `overlay_fire.png` | a red fire protection symbol |
| `overlay_police.png` | a blue safety / police symbol |
| `overlay_energy.png` | a yellow energy coverage symbol |

---

## 3D-Konsistenz (§14)

`BuildingDef` besitzt jetzt ein optionales `art`-Feld für eine konsistente visuelle
Identität über alle Darstellungen hinweg:

```ts
art?: {
  cardArt?: string;    // Baushop-Vorschau (Standard: buildings/<id>.png)
  sheetArt?: string;   // großes Gebäude-Detail-Sheet
  model3dRef?: string; // Referenz auf ein 3D-Modell
}
```

Der aktive Three.js-Renderer und die Modell-Thumbnail-Pipeline sorgen dafür, dass
Baushop-Vorschau, Detail-Sheet und Welt **dieselbe Asset-Familie** je Gebäudetyp
nutzen. Fehlen Modelle oder Bilder, greifen prozedurale bzw. SVG-Fallbacks.

## Verifikation

```
npm run build   # bindet neue Assets automatisch ein
npm run dev     # lokal ansehen
```

Fehlt eine Datei oder ist sie falsch benannt, erscheint der eingebaute Fallback —
kein Fehler, nur der Platzhalter.
