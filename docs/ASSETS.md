# Grafik-Assets — Anleitung & Prompt-Liste

Dieses Dokument ist die **Einkaufsliste** für den Mockup-Look. Sobald du die hier
gelisteten Bilder generierst und mit dem angegebenen Dateinamen in den passenden
Ordner legst, zeigt die UI sie **automatisch** an — kein Code-Eingriff nötig.
Solange ein Bild fehlt, rendert die eingebaute SVG-Grafik als Platzhalter weiter.

## So funktioniert die Pipeline

- Ablageorte (im Projekt):
  - `src/assets/resources/<id>.png` — Ressourcen
  - `src/assets/buildings/<id>.png` — Gebäude
  - `src/assets/portraits/<name>.png` — Bürger/Berater
- Der Dateiname **muss exakt** der ID unten entsprechen (klein, mit Unterstrich),
  z. B. `house_small.png`, `power_plant.png`, `freshwater.png`.
- Beim nächsten Build (`npm run build` / `npm run dev`) werden neue Dateien via
  `import.meta.glob` automatisch erkannt und eingebunden.
- Erlaubte Formate: `.png` (empfohlen, mit Transparenz), `.webp`, `.jpg`.

## Technische Vorgaben (für ALLE Assets)

- **Quadratisch**, empfohlen **512×512 px** (Ressourcen/Porträts) bzw.
  **512×512 px** (Gebäude). Wird in der UI klein skaliert → lieber zu groß.
- **Transparenter Hintergrund** (PNG) bei Gebäuden und Ressourcen. Porträts
  dürfen einen farbigen runden/quadratischen Hintergrund haben.
- Motiv **zentriert**, mit etwas Rand (nicht randlos beschnitten).
- Einheitlicher Stil über alle Assets (siehe Stil-Prefix), damit es zusammenpasst.

## Stil-Prefix (vor JEDEN Prompt setzen)

> **Prefix:** `friendly cartoon mobile city-builder game asset, warm painted style,
> vibrant saturated colors, soft cel shading, clean rounded shapes, subtle drop
> shadow, isometric 3/4 top-down view, centered, transparent background, high
> quality, no text, no watermark —`

Für Porträts stattdessen:

> **Porträt-Prefix:** `friendly cartoon character avatar for a mobile
> city-builder game, warm painted style, soft shading, head and shoulders,
> looking at camera, gentle smile, colored circular background, centered, high
> quality, no text —`

Beispiel-Vollprompt: `friendly cartoon mobile city-builder game asset, … no text — small cozy single-family cottage with a red pitched roof, chimney, little front garden`

---

## 1. Ressourcen → `src/assets/resources/`

| Datei | Motiv-Prompt (an Stil-Prefix anhängen) |
|---|---|
| `money.png` | a neat stack of shiny gold coins with a few paper banknotes |
| `gold.png` | a stack of shiny gold bars, premium currency, sparkling |
| `wood.png` | a tied bundle of freshly cut wooden logs, visible tree rings |
| `stone.png` | a small pile of grey cut stone blocks and a rounded boulder |
| `food.png` | a wooden crate full of fresh produce: red apple, bread loaf, vegetables |
| `freshwater.png` | a glossy blue water droplet / a clear water container with fresh water |
| `population.png` | a small friendly group of three diverse cartoon citizens |
| `happiness.png` | a glowing golden smiley medal / happy emblem badge with a friendly face |

## 2. Gebäude → `src/assets/buildings/`

| Datei | Motiv-Prompt (an Stil-Prefix anhängen) |
|---|---|
| `town_hall.png` | a grand city hall with a clock tower, columns, a flag and a red roof |
| `mayor_house.png` | an elegant mayor's residence with a blue roof and a small garden |
| `district_center.png` | an administrative district hall with a golden dome |
| `road.png` | a single isometric paved asphalt road tile with white lane markings |
| `house_small.png` | a small cozy single-family cottage, red pitched roof, chimney, front garden |
| `house_row.png` | a row of two to three attached townhouses with mixed roof colors |
| `apartment.png` | a four-story apartment building with balconies and many windows |
| `residential_tower.png` | a tall modern residential skyscraper with a glass facade |
| `sawmill.png` | a wooden sawmill with a log pile and a large circular saw blade |
| `quarry.png` | a rocky stone quarry pit with boulders and grey rubble |
| `farm.png` | a red barn with a silo and green crop fields |
| `well.png` | an old stone water well with a small wooden roof and a bucket |
| `water_pump.png` | a blue water pumping station with a water tank |
| `waterworks.png` | a water treatment plant with round tanks and blue pipes |
| `warehouse.png` | a large storage warehouse with a big orange roller door |
| `depot.png` | a logistics depot with a loading dock and a small truck |
| `market.png` | an open-air market stall with a red-striped awning and produce baskets |
| `supermarket.png` | a modern supermarket building with a big sign and shopping carts |
| `bakery.png` | a charming bakery shop with a bread sign and a warm awning |
| `fire_station.png` | a red fire station with garage doors and a fire truck |
| `police_station.png` | a blue police station with a badge sign |
| `hospital.png` | a white hospital building with a red cross and an ambulance |
| `trading_post.png` | a merchant trading post with wooden crates, barrels and flags |
| `shop_small.png` | a small corner shop with a colorful awning and a display window |
| `office.png` | a modern glass office building, business district style |
| `power_plant.png` | a coal power plant with cooling towers and smokestacks emitting light steam |
| `wind_farm.png` | a white wind turbine on a small green hill |
| `park.png` | a small green city park with trees, a path, a pond and benches |
| `playground.png` | a children's playground with a slide and swings on green grass |
| `deco_tree.png` | a single lush round cartoon tree |
| `deco_flowerbed.png` | a colorful round flower bed with red, yellow and purple flowers |
| `deco_fountain.png` | an ornate stone water fountain with splashing water |
| `deco_bench.png` | a wooden park bench next to a lamp post on grass |

## 3. Bürger & Berater → `src/assets/portraits/` (Porträt-Prefix nutzen)

Offizielle Rollen (feste Dateinamen — genau so benennen):

| Datei | Motiv-Prompt (an Porträt-Prefix anhängen) |
|---|---|
| `mayor.png` | a distinguished friendly mayor wearing a suit and a ceremonial sash |
| `merchant.png` | a friendly merchant / shopkeeper wearing an apron |
| `fire.png` | a friendly firefighter wearing a red fire helmet |
| `buildingDept.png` | a friendly construction worker wearing a yellow hard hat and hi-vis vest |

Normale Bürger (mehrere für Abwechslung — `citizen_1` … `citizen_6`, beliebig
viele; das Spiel wählt automatisch pro Anliegen eine Figur):

| Datei | Motiv-Prompt (an Porträt-Prefix anhängen) |
|---|---|
| `citizen_1.png` | a friendly young woman citizen with brown hair, casual clothes |
| `citizen_2.png` | a friendly middle-aged man citizen with a beard, casual shirt |
| `citizen_3.png` | a friendly elderly woman citizen with grey hair and glasses |
| `citizen_4.png` | a friendly young man citizen with short black hair, hoodie |
| `citizen_5.png` | a friendly woman citizen with blonde hair, colorful jacket |
| `citizen_6.png` | a friendly older man citizen with a cap, warm coat |

## 4. Optional / später

Diese Flächen sind noch nicht an die Asset-Pipeline angebunden (aktuell weiter
Prototyp-Grafik). Wenn du willst, ziehe ich sie in einem Folgeschritt nach:

- **Kartengebäude** im 2D-Renderer (die Kacheln auf der Karte selbst).
- **Karten-Marker** (Problem-/Service-/Ziel-Marker) und Service-Overlay-Symbole.
- **Aktivitäts-/Event-Illustrationen** als eigene große Bildkarten.

## Verifikation

Nach dem Ablegen der Bilder:

```
npm run build   # bindet neue Assets automatisch ein
npm run dev     # lokal ansehen
```

Fehlt eine Datei oder ist sie falsch benannt, erscheint an ihrer Stelle die
eingebaute SVG-Grafik — kein Fehler, nur der Platzhalter.
