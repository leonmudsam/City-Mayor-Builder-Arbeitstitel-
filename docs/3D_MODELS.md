# Echte 3D-Modelle einbinden — Ordner, Aufbau, Anleitung (v0.29)

Ab v0.29 hat das Spiel eine **echte 3D-Karte** (three.js). In den Einstellungen →
Kartenansicht gibt es drei Modi: **2D-Raster**, **Isometrisch** und **3D**. Der
3D-Modus rendert Terrain, Gebäude, Bäume, Schatten, Straßenverkehr und
Schornsteinrauch in einer perspektivischen Szene.

**Wichtig:** Der 3D-Modus funktioniert **schon ohne ein einziges 3D-Modell.**
Fehlt für ein Gebäude eine `.glb`-Datei, rendert der Renderer automatisch einen
prozeduralen Block (Wände + Dach, Höhe nach Ausbaustufe). Du ersetzt diese Blöcke
Stück für Stück durch echte Modelle — **einfach die Datei mit dem richtigen Namen
in den richtigen Ordner legen, sonst nichts.** Der Spielstand und die Spiellogik
ändern sich dabei nie.

Steuerung im 3D-Modus: **Ziehen / Rechtsklick-Ziehen = schwenken**, **Mausrad =
zoomen**, **Umschalt + Ziehen = drehen/neigen**, **Klick auf Gebäude = auswählen**.

---

## 1. Die „wenige Dateien"-Strategie (bitte zuerst lesen)

Damit du **nicht Hunderte Dateien** brauchst, ist das System bewusst so gebaut:

1. **Ein Modell pro Gebäude reicht.** Dasselbe `.glb` wird automatisch skaliert
   und für jede Ausbaustufe verwendet. Du brauchst **kein** separates Modell pro
   Stufe (optional möglich, siehe §5).
2. **Ausbaustufen kosten standardmäßig 0 zusätzliche Dateien.** Der Renderer
   macht höhere Stufen automatisch größer/höher. Nur wenn ein Upgrade *anders
   aussehen* soll (z. B. Haus → Hochhaus), legst du eine zweite Datei an.
3. **UI teilt sich die Assets.** Baumenü-Karte und Detail-Sheet nutzen weiter die
   vorhandenen 2D-Bilder (`src/assets/buildings/<id>.png`). Du musst also **keine
   3D-Modelle für die UI** rendern. Wer will, kann das gerenderte Iso-Bild eines
   Modells auch als Karten-Bild ablegen — Pflicht ist es nicht.
4. **Terrain braucht nur ~7 Kacheln** (eine pro Terrain-Typ), nicht pro Feld.
5. **Fahrzeuge: eine Handvoll** (Auto, LKW …) für den kompletten Verkehr.

**Realistisches Minimalset für einen kompletten 3D-Look:**
≈ 30 Gebäude-Modelle + 7 Terrain-Kacheln + 3–5 Fahrzeuge ≈ **~40 Dateien.**
Und selbst davon ist **nichts Pflicht** — jedes fehlende Teil wird durch einen
Platzhalter ersetzt. Fang mit den 5 häufigsten Gebäuden an (Haus, Reihenhaus,
Rathaus, Farm, Sägewerk) — der Rest bleibt solange prozedural.

---

## 2. Exakte Ordnerstruktur — wo kommt was hin

Alle Modelle liegen unter `src/assets/models/`. Jede Datei im passenden Ordner
wird beim Build **automatisch** eingebunden (via `import.meta.glob`) — keine
Registrierung, kein Import, kein Code nötig.

| Zweck | Ordner (genau so) | Dateiname | Beispiel |
|---|---|---|---|
| **Gebäude** (alle Stufen) | `src/assets/models/buildings/` | `<id>.glb` | `house_small.glb` |
| Gebäude, Variante je Stufe (optional) | `src/assets/models/buildings/` | `<id>_stage<N>.glb` | `house_small_stage3.glb` |
| **Terrain**-Kachel | `src/assets/models/terrain/` | `<terrain>.glb` | `grass.glb`, `water.glb` |
| **Fahrzeug** | `src/assets/models/vehicles/` | `<name>.glb` | `car.glb`, `truck_food.glb` |

Der `<id>` ist **exakt die Gebäude-ID** aus `src/game/config/buildings.config.ts`
(dieselbe wie beim 2D-Bild `src/assets/buildings/<id>.png`). Die vollständige
Liste steht unten in §8.

Terrain-Namen (`<terrain>`): `grass`, `forest`, `fertile`, `river`, `water`,
`mountain`, `sand`.

> Merksatz: **Richtiger Ordner + richtiger Dateiname = fertig.** Falscher Name →
> Platzhalter (kein Fehler, kein Absturz).

---

## 3. Wie ein Gebäude-Modell aufgebaut sein muss

Technische Vorgaben, damit ein Modell ohne Nacharbeit korrekt in der Szene sitzt:

| Punkt | Vorgabe |
|---|---|
| **Format** | `.glb` (glTF binär, **Texturen eingebettet**) |
| **Maßstab** | **1 Kachel = 1 Einheit.** Ein 1×1-Gebäude ≈ 1×1 Einheiten Grundfläche, ein 2×2 ≈ 2×2, ein 3×3 (Rathaus) ≈ 3×3. Höhe frei (Türme dürfen hoch sein). |
| **Ursprung (Pivot)** | **Grundflächen-Mitte, unten.** Also X/Z zentriert, **Unterkante bei Y = 0.** (Der Renderer re-zentriert & stellt auf den Boden, aber sauberer Pivot = sauberes Ergebnis.) |
| **Achsen** | **+Y = oben**, Vorderseite nach **+Z** (Richtung Kamera-Süd). |
| **Polygone** | Low-Poly, sauber trianguliert. Richtwert: Klein 0,5–3k, Mittel 3–10k, Türme/Rathaus bis ~25k Tris. |
| **Material** | PBR (metalness/roughness), wenige Materialien. Backe weiche Schatten **nicht** ins Modell — Licht/Schatten macht die Szene. |
| **Texturen** | Eingebettet, ≤ 1024², wo möglich geteilt. Keine externen Dateien. |
| **Kein** | Keine Kameras, keine Lichter, keine Animations-Rigs im glb (außer benannte Nodes, §4). |
| **Ausrichtung** | Zentriert, keine willkürliche Rotation; Y-hoch, X/Z eben. |

Der Renderer skaliert das Modell automatisch so, dass die Grundfläche die
Footprint-Größe füllt (× 0,92 Luft), zentriert es in X/Z und setzt die Unterkante
auf Y = 0. Du musst den Maßstab also nicht pixelgenau treffen — 1 Tile = 1 Einheit
als Richtwert genügt.

## 4. Benannte Nodes für Live-Effekte (optional, aber empfohlen)

Der Renderer erkennt bestimmte **Node-Namen** im Modell und belebt sie:

| Node-Name | Wirkung |
|---|---|
| `rotor` | dreht sich dauerhaft (Windrad-Flügel, Mühle, Ventilator). |
| `chimney` | Ursprung für aufsteigenden **Rauch**, solange das Gebäude aktiv produziert. |

Benenne die entsprechende Mesh/Group im 3D-Tool exakt `rotor` bzw. `chimney`.
Fehlt der Node, passiert nichts Schlimmes — der Effekt entfällt einfach.
Geplant/reserviert für später: `door`, `crane`, `sign`, `light_window`.

## 5. Verschiedene Versionen & Upgrades

Ein Gebäude hat mehrere Ausbaustufen (`upgradeLevel` 0,1,2,3…). Es gibt **drei
Wege**, wie viel Aufwand du investierst:

1. **Nichts tun (Standard).** Ein einziges `<id>.glb` wird pro Stufe automatisch
   höher/größer skaliert. Reicht für „Haus wird größer".
2. **Eigene Datei je Stufe** — wenn eine Stufe wirklich anders aussehen soll
   (z. B. Reihenhaus → Mehrfamilienhaus → Hochhaus):
   `house_small.glb` (Stufe 0/1), `house_small_stage2.glb`, `house_small_stage3.glb`.
   Namensschema: `<id>_stage<upgradeLevel+1>.glb`. Fehlt eine Stufen-Datei, wird
   die Basis genutzt. (Registry: `buildingModel(id, stage)` sucht erst die
   Stufen-Datei, dann die Basis.)
3. **(Später) Stufen-Meshes in einem glb** — z. B. Nodes `stage0..stage3`; der
   Renderer blendet die passende Stufe ein. Vorgesehen als Folge-Slice.

Empfehlung: Weg 1 für die meisten Gebäude, Weg 2 gezielt für die Wohnkette
(Haus → Doppelhaus → Mehrfamilienhaus → Stadthaus → Hochhaus) und markante
Upgrades.

## 6. Terrain als 3D-Modelle

Standardmäßig ist der Boden aus farbigen, leicht reliefierten Kacheln (Berge
höher, Wasser tiefer) — sieht schon ordentlich aus. Für echten Terrain-Look:

- Lege `src/assets/models/terrain/<terrain>.glb` an (`grass`, `water`, …).
- Eine Kachel = **1×1 Einheit**, Oberkante bei Y = 0, **nahtlos kachelbar**
  (Ränder passen an Nachbarkacheln). Low-Poly.
- Der Renderer instanziiert dieselbe Kachel über alle Felder dieses Typs —
  darum reicht **eine Datei pro Terrain-Typ**.

## 7. Live-Ansichten (Bauarbeiten, Verkehr, …)

Was der 3D-Modus **heute** schon live zeigt:

- **Straßenverkehr:** Autos fahren automatisch über zusammenhängende Straßen
  (bis 10 Stück, prozedural). Lege `vehicles/car.glb` an → statt Würfel fahren
  echte Auto-Modelle. Weitere: `truck_food`, `truck_material`, `firetruck`,
  `police_car`, `service_van`.
- **Bauarbeiten:** Gebäude im Bau werden **transparent + gelber Gerüst-Käfig**
  gezeigt. (Geplant: Kran-Node `crane`, Bau-Fortschrittsanimation.)
- **Windräder:** `rotor`-Node dreht sich.
- **Schornsteinrauch:** aufsteigende Rauchpartikel über aktiven Produktions-/
  Energiegebäuden (`chimney`-Node bzw. automatisch beim prozeduralen Block).
- **Ausbaustufen:** höhere Stufe = höheres/größeres Gebäude.
- **Auswahl-Ring, Platzierungs-Ghost (grün/rot), Sektor-Freischaltung** wie in 2D.

Geplant/vorbereitet (Ordner & Hooks existieren): Feuerwehr-/Polizei-Einsätze,
Tag-/Nacht-Licht, nachts leuchtende Fenster (`light_window`), Bürger-Sprites,
Lieferfahrzeuge entlang echter Missions-Routen.

## 8. Modell-Liste mit Prompts (Text-zu-3D)

Für Tools wie **Meshy, Rodin, Tripo, Luma Genie, Alpha3D** o. Ä.: **Stil-Prefix +
Motiv** eingeben, als `.glb` exportieren, mit dem Dateinamen aus der Tabelle in
`src/assets/models/buildings/` ablegen.

**Stil-Prefix (vor JEDES Motiv setzen):**

> `Low-poly stylized 3D city-builder building, cartoon game asset, clean readable
> forms, vibrant colors, PBR materials, textures baked in, no baked shadows,
> square footprint, origin at the base center, +Y up, 1 tile = 1 unit, no camera,
> no lights, no text —`

| Datei (`…/buildings/`) | Motiv (an Prefix anhängen) |
|---|---|
| `town_hall.glb` | a grand town hall with a clock tower, columns, a flag, red roof (3×3) |
| `mayor_house.glb` | an elegant mayor's residence, blue roof, small garden |
| `district_center.glb` | an administrative hall with a golden dome |
| `house_small.glb` | a small cozy family house, red pitched roof, chimney (name it `chimney`), garden |
| `house_row.glb` | a row of 2–3 attached townhouses, mixed roof colors |
| `apartment.glb` | a four-story apartment building with balconies |
| `residential_tower.glb` | a tall modern residential tower, glass facade |
| `sawmill.glb` | a wooden sawmill with a log pile and a large saw blade |
| `quarry.glb` | a rocky stone quarry pit with boulders |
| `farm.glb` | a red barn with a silo and green crop fields |
| `well.glb` | a stone water well with a small wooden roof |
| `water_pump.glb` | a blue water pumping station with a tank |
| `waterworks.glb` | a water treatment plant with round tanks and pipes |
| `warehouse.glb` | a large storage warehouse with a big roller door |
| `depot.glb` | a logistics depot with a loading dock and a truck |
| `market.glb` | an open-air market stall with a striped awning |
| `supermarket.glb` | a modern supermarket with a big sign and carts |
| `bakery.glb` | a charming bakery shop with a bread sign |
| `shop_small.glb` | a small corner shop with a colorful awning |
| `office.glb` | a modern glass office building |
| `trading_post.glb` | a merchant trading post with crates and flags |
| `fire_station.glb` | a red fire station with garage doors and a fire truck |
| `police_station.glb` | a blue police station with a badge sign |
| `hospital.glb` | a white hospital with a red cross and an ambulance |
| `power_plant.glb` | a coal power plant with cooling towers and chimneys (name a `chimney`) |
| `wind_farm.glb` | a white wind turbine; model the blades as a node named `rotor` |
| `park.glb` | a small green park with trees, a path and a pond |
| `playground.glb` | a playground with a slide and swings |
| `deco_tree.glb` | a single lush round tree |
| `deco_flowerbed.glb` | a colorful round flower bed |
| `deco_fountain.glb` | an ornate stone fountain with water |
| `deco_bench.glb` | a wooden park bench next to a lamp post |

**Terrain** (`src/assets/models/terrain/`, 1×1 Einheit, kachelbar, Oberkante Y=0):

| Datei | Motiv |
|---|---|
| `grass.glb` | a flat green grass ground tile, tileable |
| `forest.glb` | a forest-floor tile with a couple of low-poly trees |
| `fertile.glb` | a ploughed farmland ground tile |
| `river.glb` | a flowing blue river water tile, tileable |
| `water.glb` | a calm blue lake/sea water tile |
| `mountain.glb` | a steep grey rocky mountain tile |
| `sand.glb` | a sandy beach ground tile |

**Fahrzeuge** (`src/assets/models/vehicles/`, ~0,5 Einheit lang, +Z = vorne):

| Datei | Motiv |
|---|---|
| `car.glb` | a small low-poly city car |
| `truck_food.glb` | a small delivery truck with food crates |
| `truck_material.glb` | a flatbed truck carrying wood and stone |
| `firetruck.glb` | a red fire truck |
| `police_car.glb` | a blue-and-white police car |
| `service_van.glb` | a white service/utility van |

## 9. Integration in 3 Schritten

1. Modell erzeugen/exportieren → als `.glb` mit exaktem Namen in den Ordner aus §2.
2. `npm run build` (oder `npm run dev`) — die Datei wird automatisch eingebunden.
3. Einstellungen → Kartenansicht → **3D**. Das Gebäude zeigt jetzt das Modell
   statt des Platzhalters. Feinschliff optional über `BuildingDef.visual`
   (`heightClass` für die Platzhalter-Höhe, `model3dRef`, `anchor`).

## 10. Checkliste vor dem Export

- [ ] Format `.glb`, Texturen eingebettet
- [ ] Pivot: X/Z zentriert, Unterkante auf Y = 0, +Y oben
- [ ] Maßstab ~ 1 Tile = 1 Einheit (Footprint passend zur `size` des Gebäudes)
- [ ] Low-Poly, wenige Materialien, keine gebackenen Schatten
- [ ] Keine Kameras/Lichter im glb
- [ ] Bei Windrad: Flügel-Node heißt `rotor`; bei Rauch: Node `chimney`
- [ ] Dateiname = exakte Gebäude-/Terrain-/Fahrzeug-ID
- [ ] Datei liegt im richtigen `src/assets/models/…`-Ordner

Fehlt etwas, greift der Platzhalter — das Spiel läuft immer weiter.
