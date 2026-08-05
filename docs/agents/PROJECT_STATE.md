# Projektstand — v1.40

Stand: 5. August 2026

## Stadtarbeit 3.0 — DER EINSATZ FINDET IN DER STADT STATT (v1.40, Save v33, D-068…D-071) — AKTUELL

Auftrag „Open-World-Aufträge statt Routen-Minispiel". Umgesetzt: **A1–A6** und
der HUD-Teil von A7. Verbindlicher Einstieg:
**`CITYWORK_OPEN_WORLD_OVERHAUL.md`**.

**Der Befund, der den Auftrag verschoben hat.** Der 3D-Fahrmodus existierte
vollständig — Straßenbindung, Kreuzungsabsicht (D-060), Verfolgerkamera,
Fahrzeugmodell — und hatte **keinen einzigen Aufrufer**. Gefehlt hat nicht die
Fahrphysik, sondern der Weg dorthin.

**D-068 kehrt D-050/D-051 um:** Gefahren wird in der Welt, nicht in der Karte.
Die 2D-Fahrschleife ist **entfernt**, nicht danebengestellt — zwei Fahrflächen
wären zwei Bedienkonzepte. Die Karte bleibt als **Übersicht**, weil sie seit
D-062 kein zweites Weltbild ist. Mit umziehen musste die **Aufzeichnung der
gefahrenen Strecke** (D-054) und die **Zwischenbilanz** (D-061); beide hingen
an der Karte, gehören aber zum Fahren.

**A6 ohne Migration (D-069 korrigiert).** Die Halte (`missionStops.ts`,
`getMissionStops`) sind **abgeleitet**: Quelle, Ziele und Lager stehen bereits
im Save, nur an drei verschiedenen Stellen. Eine persistierte Kopie wäre eine
zweite Wahrheit — ein abgerissenes Lager bliebe darin stehen. **Save bleibt v33.**

**Zwei Fehler, die erst der Umzug sichtbar gemacht hat.** Die freie
Zielreihenfolge galt nur in 2D (D-070). Und das Fahrzeug fuhr **unter der
Insel**: Höhe 0,07 bei einem Boden von 6,47, weil 91 von 96 Straßen ein
gespeichertes `roadHeight: 0` aus einer früheren Welt trugen (D-071). Betroffen
waren auch die Fahrbahnen selbst — aus der Stadtkamera sah das nach „hier ist
keine Straße" aus.

**Offen, nicht vortäuschen:** A8 weitere Missionstypen · A9 Ereignisse · A10
Route automatisieren · das Layout des Planers nach den Mockups · Häfen als
Netzknoten.


## Wirtschafts- und Lieferketten-Overhaul (v1.39, Save v33, D-063…D-067) — AKTUELL

Alle elf Punkte des Auftrags sind umgesetzt. Verbindlicher Einstieg:
**`SUPPLY_CHAIN_EXPANSION_PLAN.md`**.

**Zwei der vier gemeldeten Probleme lagen anders — deshalb zuerst messen.**
„Stein blockiert" ist seit D-055 nicht mehr wahr: `stone_pit` öffnet auf L2, der
erste Bau ist gratis und kostet **keinen** Stein; die erste Steinkosten-Stelle
ist L3 (25). Blockiert hat die **Form** — 3×3, Straßenzwang, 60 Holz = der
gesamte Startvorrat. „Farm zu starr" war seit D-058/D-059 gelöst. Bestätigt
hat sich nur der vierte Punkt: Es gab **keine** zweite Verarbeitungsstufe.

**Die vier neuen Bausteine.**
* `stone_pit_small` — 1×1, ab **Level 1**, ohne Straße, ohne Material, erster
  Bau gratis. Ein Einstieg mit Bedingung ist kein Einstieg; der Preis ist die
  Rate (4 Stein/min, Baugrenze 3, keine Ausbaustufe).
* **Felder ab 1×1** mit Bodenqualität aus dem **Bake** (+30 % auf natürlich
  fruchtbarem Grund) und einem abgeleiteten Ertrag.
* **Bretter und Werkstein** — veredelte Waren, die nie aus der Welt kommen; im
  HUD direkt hinter ihrem Rohstoff, im Bestandsregister wie jede andere Ware.
* **Holz- und Steinwerkstatt** (`BuildingDef.conversion`) — die ersten Gebäude,
  deren Ertrag nicht am Standort hängt.

**Architektur, die man nicht umgehen darf.**
1. Eine Werkstatt ist **weder** `operation` (setzt Terrain voraus) **noch**
   `produce.inputsPerMinute` (zieht aus der Bilanzsumme und hübe D-052 auf).
   Sie hat ein eigenes Lager — aber dasselbe `BuildingInventory` wie das
   Sägewerk seit v17. **Kein drittes Lagermodell** (D-063).
2. `workshopThroughput` ist die **eine** Durchsatzrechnung; Tick und Anzeige
   lesen sie (D-048).
3. Der Nachschub ist ein **Sog**: `advanceWorkshopSupply` erteilt nur Aufträge
   an denselben `createInventoryTransfer`. `transferTargets` bleibt bewusst
   lagerbeschränkt, sonst lüde ein Sägewerk sein Holz automatisch bei der
   Werkstatt ab und der Stadt fehlte Baumaterial (D-064).
4. Beim Laden an einem **Stadtlager** muss die Bilanz über `withdrawStock`
   sinken — sonst füllt `reconcileStock` sie sofort wieder auf und das Fahrzeug
   fährt mit einer **Kopie** los.
5. Bodengüte liest den **Bake**, nicht `worldTerrainAt`: Ein Feld setzt
   `fertile`, über den Override gelesen hätte jede gekaufte Kachel Bestnote
   (D-067).

**Save v33** (Migration `v32→v33`, additiv): `resources.planks`/`cut_stone`,
ihre `stats.produced`-Zähler und `operations.supplyRules`.

**Im laufenden Spiel gemessen** (0 Konsolenfehler): „Holz 1.524 · Bretter 96 ·
Stein 1.088 · Werkstein 92" ohne einen Klick; Werkstatt-Fenster „Eingang
182/240 · 2:1 · Ausgang 71/160 · 14/min von 14/min möglich".

**Offen, nicht vortäuschen:** kein Zwischenlager in der Lieferkette · kein
Intervall-/Ladungsregler (D-039) · Arbeiter sind Arbeitsplätze, kein Regler ·
`field_farm_tile.glb` geplant, nicht verdrahtet · Feld-Balancing bleibt eine
Setzung · Bretter/Werkstein sind reine Baustoffe.

---

## Frühere Stände

## Stadtarbeit P4 — Jedes Lager hat seinen eigenen Bestand (v1.34, Save v32, D-052) — AKTUELL

§8 des Auftrags („Keine globale magische Ressource. Jedes Lager hat eigene
Bestände") ist umgesetzt — zugleich **Phase 4** des Folgeauftrags
„Stadtarbeit Overhaul 2.0".

**Invariante:** `state.resources[r] === Σ Bestand aller Stadtlager[r]` (Geld
ausgenommen). `state.resources` bleibt die Bilanzsumme, die Baukosten, Verbrauch,
Quests und Balancing unverändert lesen; `src/game/economy/stockLedger.ts` sagt
zusätzlich, **wo** die Ware liegt.

**Kein drittes Lagermodell (§2/§8).** Das Register benutzt denselben
`BuildingInventory`-Typ und dieselbe Map wie die lokalen Betriebslager aus Save
v17. Möglich durch eine Messung: von 34 Gebäudetypen haben **3** ein
Betriebslager (Sägewerk, Steinbruch, Farm), **7** eine `storage`-Wirkung
(Rathaus, Distriktzentrum, Lagerhaus, Wasserwerk, Markt, Anleger, Flusshafen) —
und **keines beides**. `tests/stockLedger.test.ts` prüft das zuerst.

**Zwei Regeln (D-052).** (1) Die Ableitung gibt die **Orte** heraus, nicht nur
die Summe: `Derived.storageSites` entsteht in derselben Schleife wie
`storageCaps` (Fortsetzung D-042/D-049). (2) Der Abgleich läuft an **einer**
Stelle — `state.resources` wird an 31 Stellen in 8 Modulen verändert, deshalb
reconciliert `GameController.notify` (und der Konstruktor beim Laden), statt 31
Buchungsstellen zu pflegen.

**Spielbar geworden:** Der Ladeort ist eine Wahl mit Folgen — entnommen wird an
genau diesem Lager, ein Abbruch gibt die Ladung dorthin zurück, und reicht der
Vorrat nicht, startet die Mission nicht. Vorher entschied stumm die alphabetische
Gebäude-Id. `SupplyPicker` zeigt Bestand, Kapazität, Entfernung und „reicht das?".
Ein volles Fahrzeug fährt noch 72 % seines Tempos (`loadedTileSpeed`).

**Ehrliche Grenze (nicht vortäuschen):** Nur Gebäude mit `storage`-Wirkung haben
einen eigenen Bestand. **Farm, Sägewerk, Pumpwerk und Feuerwache sind
Abholpunkte ohne Lager** — dort bleibt die Ware die Bilanz der Stadt, und die UI
zeigt für sie keine Bestandswahl.

**Offen zur Entscheidung (D-053):** Der Folgeauftrag verlangt eine
**isometrische Weltkamera statt der 2D-Karte** und die Route als **Aufzeichnung
der gefahrenen Strecke**. Das kehrt D-050/D-051 um und ist deshalb vorgelegt,
nicht still umgesetzt.

## Stadtarbeit-Overhaul P3 — Karte aus der Welt, Fahren auf der Straße (v1.33, Save v31)

Die 2D-Stadtarbeitskarte zeigt die **echte Insel**: Höhenrelief aus denselben
Höhen wie der 3D-Renderer, dieselbe Vegetation aus derselben Verteilungsinstanz,
Wassertiefe, Klippen- und Strandküste, Brücken und Viadukte, Marker für Lager,
Logistikzentren, Häfen und aktive Betriebe. **Kein zweiter Renderer** — es gibt
genau eine Leseinstanz für Draufsicht-Weltdaten (`src/renderer/worldProjection.ts`,
frei von `three`/`react`/Canvas), und `tests/worldProjection.test.ts` vergleicht
ihre Ausgabe gegen die Bake-Grids und die Vegetation Instanz für Instanz gegen
`collectRegionNature`. Entscheid **D-051**, Pipeline:
`docs/agents/CITYWORK_MAP_PIPELINE.md`.

**Fahren ist straßengebunden.** Die frühere Arcade-Lenkung ist ersetzt: Das
Fahrzeug sitzt immer auf einer Kante zwischen zwei Straßenkacheln; W gibt Gas,
S bremst und fährt rückwärts, A/D wählen an der Kreuzung die Abzweigung,
dazwischen folgt es der Straße von selbst. Die Höchstgeschwindigkeit kommt aus
`speedKph` des gewählten Fahrzeugs. D-050 gilt unverändert —
`game/activities/driving.ts` bleibt die **einzige** Fahrphysik für beide
Ansichten. Ein Fahr-Status unten in der Karte zeigt Tempo, nächstes Ziel mit
Entfernung, die nächste Abbiegeanweisung und die erledigten Ziele; die gefahrene
Strecke bleibt als Spur sichtbar.

Keine Save-, Simulations- oder Balancing-Änderung (**v31**).

**Offen aus dem Auftrag — in der UI nicht vorgetäuscht:** Lagerbestände je
Gebäude (§8, nächster Schritt P4, braucht Migration), Verkehrsrückkopplung aus
gefahrenen Routen (§9), Fähren/Häfen als Netzknoten, erweiterte Routenplanung
(§7), Gesamtlayout nach Mockup (§10), echte Gebäudesilhouetten in der Karte.

## World Visual Overhaul (v1.32, Save weiterhin v31)

Die gebackene Insel, ihre 40 Gameplayregionen und sämtliche Simulationsdaten
bleiben unverändert. Der bestehende Three-Renderer erzeugt nun aus denselben
Höhen-, Biom-, Küsten- und Regionsmasken eine deutlich stärker gegliederte,
malerische Welt: Terrain-Chunks binden nur noch die tatsächlich benötigten
Splat-Layer, teilen Klippen- und Bergtexturen und verwenden selektiv Normal-,
Rauheits- und AO-Details. Gewichtete 5×5-Nachbarschaften verbreitern Biom- und
Küstenübergänge, ohne das Inselbake oder die Baubarkeit anzufassen.

**Natur und Wasser:** Die bestehenden Instanzen bleiben die Nahdarstellung.
Entfernter Wald wird pro Chunk als instanzierte Cluster-HLOD zusammengefasst;
Baumwind läuft über ein gemeinsames Shader-Uniform statt über Objektupdates.
Zonenfarben unterscheiden Wald, Wiese, Hochland, Küste und Feuchtgebiet, und
zufällige Wiesenfelsen wurden entfernt. Das Ozeanmaterial verbindet
Tiefenfarben, drei Wellen, Fluss-/Strömungsdetails, Uferschaum und analytisches
Fresnel. Transparenz gilt nur im flachen Uferband und wird in der Tiefe wieder
blickdicht, damit der endliche Meeresboden verborgen bleibt. Es gibt dafür
keinen zweiten Reflection-Render.

**Gebäude:** Alle 54 vorhandenen Gebäude-GLBs wurden separat technisch geprüft.
Der Renderer färbt nun geklonte Materialhüllen rollenabhängig, ohne gemeinsame
Cache-Quellen zu mutieren oder Normalmaps durch pauschales Flat Shading zu
entwerten. Rathaus, Sägewerk, Landwirtschaft, Lager/Depot, Steinbruch,
Wasserwerk und Energie-/Produktionsbauten erhalten deterministische, rotierte
und nach Prop-Art räumlich instanzierte Umgebungsdetails. In der Fernsicht
ersetzen räumlich gechunkte, rollenbasierte HLOD-Silhouetten die teuren
Vollmodelle; Auswahl und Nahsicht bleiben detailliert. HLOD-Picking,
GPU-Buffer-Freigabe und Instanzfarben sind dabei explizit abgesichert. Fehlende
Drop-ins fallen weiterhin prozedural zurück.

**Bild und Kamera:** Qualitätsprofile schalten eine geordnete Post-Kette aus
SSAO, optional sehr zurückhaltendem HDR-Bloom, SMAA, optionalem subtilen DOF und
genau einem Output-/ACES-Schritt. Niedrige Qualität rendert direkt; Schatten,
Wolken und Passkosten skalieren mit dem Profil. Die Kamera verfolgt jetzt die
echte Zielhöhe von Terrain, Wasser und Fahrbahn und fokussiert ausgewählte
Gebäude näher, ohne die dynamische Stadtübersicht zu verlieren. Der
Schattenfokus folgt demselben Kameraziel. HUD und Simulation bleiben außerhalb
der Post-Kette beziehungsweise des Renderers.

**Performance und ehrliche Grenzen:** Terrain-/Natur-/Hero-Chunking, Frustum-
Culling, Instancing, Natur-HLOD, Gebäude-HLOD und profilierte Posteffekte sind
aktiv. Noch offen sind echte Billboard-/Crossfade-LODs, offline optimierte
Gebäude-Assets (Draco/Meshopt/KTX2, Cache-Eviction und authored LODs), ein
GPU-/Speicher-/LOD-Telemetriepanel, Zielhardwaremessungen, Terrain-Geometrie-LOD
und das Chunking des global neu aufgebauten Straßenmeshs. Die neuen
kamerastabilen World-Space-/triplanaren Terrain-Details benötigen außerdem noch
interaktive visuelle Prüfung und Feintuning.

Verifikation: `npx tsc -b --force`, `npx eslint src tests` (0 Fehler, keine
Warnungen), die vollständige Vitest-Suite (**86 Dateien / 697 Tests**) und
`npm run build` sind grün. Der
Produktions-Preview antwortet mit HTTP 200. Der verbindliche interaktive
3D-Screenshot-Smoke bleibt mangels bereitgestellter Browserinstanz technisch
blockiert (`agent.browsers.list() = []`); insbesondere wird keine Shader- oder
Look-Freigabe behauptet. Der native Windows-Tauri-Build kann ohne installiertes
`rustc`/`cargo` nicht gestartet werden. Das Save-Schema bleibt **v31**.

## Straßen-, Höhen- und Terrain-Overhaul (v1.31, Save v31) — VORHERIGER STAND

Spielerseitig existiert jetzt **genau eine Straße**. `road_elevated` bleibt als
interne Legacy-Definition erhalten, damit bestehende Spielstände, API-Aufrufe
und alte Gebäudeinstanzen weiter laden und rendern; im Baukatalog ist sie
explizit ausgefiltert. Config und Stufe-2-Unlock bleiben ausschließlich für
Save-/API-Kompatibilität bestehen. Die öffentliche
`road` entscheidet aus Gelände und Längsprofil automatisch zwischen `flat`,
`slope`, `pass`, `support`, `viaduct`, `bridge` und `coast`. Alle Varianten
bleiben Kacheln desselben `roadNetwork` — kein zweiter Straßen- oder
Verkehrsgraph (D-036).

**Ein kanonisches Höhenprofil:** `src/game/roads/roadProfile.ts` liest dieselbe
`samplePlacementSurface` wie die Platzierung und liefert Länge in Metern,
Höhendifferenz, maximale und mittlere Steigung, Fahrbahnhöhe, Freistand und
Variante je Kachel. Eine Kachel entspricht ungefähr vier Metern. Landanker und
ein Profil mit höchstens **8 %** sind Teil der Baubarkeit, nicht bloß Anzeige.
Ist die direkte Trasse zu kurz, erzeugt `roadRouting.ts` deterministisch
abwechselnde Kehren und routet sie durch tragfähige Korridore; findet es keine
zulässige Serpentine, bleibt die Vorschau ehrlich rot, statt eine zu steile
Straße zu bauen. Bereits gebaute Anschlüsse frieren ihre Deckhöhe ein.

**Vorschau = Command:** Der große Straßenplaner zeigt Start/Ziel, das echte
Höhenprofil, Länge, Höhendifferenz, Maximal-/Durchschnittssteigung, dominante
Variante und die vollständigen Geld-/Holz-/Steinkosten. Die Variantenaufschläge
liegen in `RoadClassDef.variantCostPerTile`. `roadPathPreview` und
`buildRoadPath` verwenden dasselbe `RoadPlanPreview`; der Command bucht einmal
ab, schreibt den ganzen Pfad als Bulk-Commit und löst genau eine
Derived-/Quest-Neuberechnung und eine Zustandsbenachrichtigung aus.

**Save v31:** Jede neu gebaute Straßenkachel speichert optional
`RoadEngineeringState { variant, terrainHeight, roadHeight, gradePercent,
clearance, routeId, routeIndex }`. Das ist nötig, weil sich das ursprüngliche
Längsprofil aus einem später verzweigten Netz nicht eindeutig rekonstruieren
lässt. Migration `v30→v31` ist linear und verlustfrei: alte Straßen bleiben ohne
Feld gültig und nutzen den deterministischen Legacy-Fallback. Welt, Regionen
und Koordinaten ändern sich nicht. Die parallelen Stadtarbeit-Felder aus v1.30
bleiben unverändert.

**Gebäude folgen demselben Grundsatz:** `buildings/foundation.ts` klassifiziert
den geprüften Footprint als `BUILDABLE_FLAT`, `BUILDABLE_SLOPE`,
`BUILDABLE_TERRACE`, `WATER_EDGE` oder `CLIFF` und liefert einen
`FoundationPlan` mit Bauart, Stütztiefe, Stufen, Mehrkosten und zusätzlicher
Bauzeit. Diagnose, Kosten, Command, Ghost und fertiges Gebäude lesen diesen
Plan. Flaches Gelände erhält nur einen dünnen Natursteinkranz; Hänge erhalten
talwärtige Stützmauern oder Terrassen, Wasserränder Pfähle und Klippen
befestigte Wände mit Strebepfeilern. Der alte sichtbare graue Vollblock ist
entfernt. Das Insel-Höhenfeld bleibt gemäß D-043 unverändert; die Konstruktionen
werden daraus abgeleitet, es gibt kein verstecktes Terraforming.

**Renderer und Assets:** Die gespeicherte Deckhöhe treibt Vorschau,
durchgehendes Fahrbahnband, Brückendeck, profilhohe instanzierte Stützen und
alle Straßenfahrzeuge über denselben `roadSurfaceHeightAt`-Sampler. Sieben
aktive GLB-Kits (`road_flat`, `road_slope`, `road_support`, `road_viaduct`,
`road_bridge`, `road_hairpin_curve`, `road_coast`) ergänzen die nahtlose
prozedurale Fahrbahn als instanzierte Nahdetails; fehlende Dateien fallen ohne
Crash auf die prozedurale Darstellung zurück.

**Bewusst offen, nicht vortäuschen:** Es gibt noch keinen Tunnel, keine manuelle
Höhen-/Pfeiler-/Brückenwahl und keine frei ziehbaren Kurvengriffe. Schiffsdurchfahrt,
strukturelle Maximalspannweiten sowie Lane-/Kreuzungsbelegung sind nicht Teil
dieser Phase. Das durchgehende Bodennetz besteht zwar nur aus zwei gebündelten
Meshes und die Stützen/GLB-Details sind instanziert beziehungsweise
distanzgecullt, aber jede Netzänderung baut den **globalen Straßenmesh** neu;
Straßen-Chunking und ein echtes Fern-LOD bleiben offen. Das Fundament verändert
das Terrain nicht und erweitert die bestehenden Footprint-Toleranzen nur dort,
wo der gemeinsame Plan eine tragfähige Konstruktion ausweist.

Verifikation: `npx tsc -b --force`, `npx eslint src tests`, die vollständige
Vitest-Suite (**78 Dateien / 638 Tests**) und `npm run build` sind grün. Der
Produktions-Preview antwortet mit HTTP 200. Der verbindliche interaktive
3D-Screenshot-Smoke bleibt mangels bereitgestellter Browserinstanz technisch
blockiert (`agent.browsers.list() = []`); eine visuelle Freigabe wird nicht
behauptet. Der native Windows-Tauri-Build kann auf diesem Rechner ohne
installiertes `rustc`/`cargo` nicht gestartet werden.

## G2 ⑤ — Der Wirkungsradius ist ein Quadrat (v1.28, Save v29, D-049)

Terrainfolgend war das Overlay längst; falsch war die **Form**. Die Reichweite
ist `chebyshev(...) <= radius` — ein achsenparalleles **Quadrat**. Übergeben
wurde nur `radius`, also musste der Renderer die Metrik raten: er nahm die
euklidische an und zeichnete den eingeschriebenen **Kreis**. Gemessen über alle
Radiusgebäude blieben **19–30 % der wirklich versorgten Kacheln unsichtbar**
(Brunnen r9: 108 von 361 · Markt r14: 168 von 784 · Krankenhaus r18: 360 von
1.369 · Feuerwache Stufe 3 r32: 868 von 4.096). Der Fehler war **einseitig** —
nie zu viel versprochen, immer zu wenig gezeigt —, deshalb unauffällig für
jeden, der nur „stimmt der Radius?" prüft.

**Zwingend (D-049): Wo eine Regel über eine Fläche entscheidet, gibt die
Simulation die FLÄCHE heraus, nicht bloß die Zahl, aus der sie folgt.**
`CoverageSourceView.area` trägt sie (`coverageArea`/`coverageAreaAround`/
`coversTile` in `buildings/coverage.ts`), und `addTerrainCoverageVisual` nimmt
eine `CoverageArea` statt Mitte + Radius — die Signatur macht das erneute Raten
unmöglich. Testpflicht ist die Deckungsgleichheit über ein **volles
Kachelfenster**, plus der alte Kreis als Gegenprobe (er darf nie mehr zeigen als
die Regel deckt).

Zweiter Teil: **der Radius erscheint beim Überfahren** — vorher nur nach einem
Klick, und ein Klick öffnet das Gebäudefenster. Die Auswahl behält Vorrang
(sonst wischte jeder Mausweg über die Stadt die geöffnete Ansicht weg), während
einer Platzierung gehört die Fläche dem Ghost. Gesucht wird mit **derselben**
Abfrage wie beim Klick (`pickBuildingAt`, ergänzt um die Kachelbelegung für
flache Bauten wie den Brunnen) — ein eigener Suchweg hieße: Überfahren zeigt ein
anderes Gebäude an, als der Klick auswählt. Das Arbeitsgebiets-Overlay der
Betriebe ist aus demselben Grund ebenfalls quadratisch geworden.

Keine Save-/Sim-/Balancing-Änderung, **v29**. Offen (nicht vortäuschen): ein
Gebäude mit mehreren Radiusgruppen (Supermarkt: Nahrung *und* Frischwasser)
zeigt weiter nur die erste. **Gefunden, nicht behoben (Sim, nicht Render):**
`nodesInWorkArea` bietet Knoten aus `workAreaBounds` an, `previewOperation`
verwirft aber alles jenseits von `chebyshev(mitte, …) > maxRadius` — 120 Kacheln
beim Sägewerk, 128 beim Steinbruch, 171 bei der Farm. Der damals nächste Punkt
⑥ Straßenbau als Plan→Vorschau→Bestätigen ist mit v1.31 erledigt (siehe oben).

## G2 ④ — Verschieben ist ein Entwurf (v1.27, Save v29, D-048)

`ThreeMapRenderer.setMoving()` war ein **No-op**, dessen Kommentar auf den
2D-/Iso-Modus verwies — den es seit Ausbaustufe 2.0 nicht mehr gibt. Dahinter
stand kein Schönheitsfehler: **14 der 34 Gebäude tragen `canRelocate`** und
zeigen einen „Versetzen"-Knopf (Rathaus ab Minute eins, dazu Sägewerk,
Steinbruch, Farm, Wasserwerk, Krankenhaus …). Der Knopf setzte `movingBuildingId`,
das Banner erschien — und danach passierte nichts: kein Ghost, keine
Ursprungsmarkierung, `RendererCallbacks.onMove` wurde vom 3D-Renderer **nie**
aufgerufen, der einzige Ausweg war ESC. Besonders schwer wiegt das seit
A6/D-046: **Stein wächst nie nach**, der Steinbruch läuft planmäßig leer und
**muss** umziehen — genau diese Bewegung war nicht ausführbar.

Jetzt bleibt das Gebäude logisch und sichtbar an seinem Platz, nur der Ghost
wandert; der Ursprung ist markiert (`moveOriginGroup`: Umriss + schlanke Säule),
Abbruch wirkt sich auf nichts aus, und der Bestätigungsklick löst **genau einen**
Command aus — Id, Ausbaustufe und laufender Betrieb bleiben erhalten.

**Eine Ghost-Strecke für beides:** `placementDraft()` beantwortet „was hängt am
Cursor" für Bauen und Versetzen, danach läuft alles durch dieselbe
`updateGhostAt`. Auch `isPlacing()` im Eingabepfad heißt jetzt „es hängt ein
Entwurf am Cursor".

**Zwingend (D-048):** Wo ein Command **zusätzliche** Bedingungen kennt, wird sein
Prüfteil als reine Funktion herausgezogen und die Vorschau ruft genau diese auf.
`evaluateMove` trägt `moveBuilding` **und** `moveDiagnostics`. Sonst wäre der
Ghost grün, wo der Command mit `feature_disabled` oder `insufficient` ablehnt —
`validatePlacement` kennt weder `canRelocate` noch die Gebühr noch das Budget.
Der Umzug braucht außerdem zwingend `ignoreBuildingId`: ohne ihn meldet die
eigene Grundfläche `occupied`, und ein Umzug um eine Kachel sähe verboten aus.
`MoveBlocker` ist die deklarierte Obermenge von `PlacementError`. Testpflicht ist
die **Deckungsgleichheit über einen Kachelstreifen** (`result.ok === preview.valid`,
`result.error === preview.reason`), nicht der Einzelfall.

Die Warnstufe aus D-047 gilt unverändert weiter: wer ein `requiresRoad`-Gebäude
vom Netz wegzieht, sieht den bernsteinfarbenen Ghost. Keine Save-/Sim-Änderung,
**v29**.

Offen (nicht vortäuschen): Der Ghost zeigt das **Stufe-0-Modell**, kein
Drag-and-Drop, und der „Versetzen"-Knopf liegt zwei Klicks tief (Gebäudefenster →
„Mehr Details") — das gehört in einen Sheet-Pass, nicht hierher. Danach in G2:
⑤ Radien-Overlays, ⑥ Straßenbau als Plan→Vorschau→Bestätigen.

## G2 ③ — der Ghost zeigt den Anschlusspunkt (v1.26, Save v29, D-047)

Die Platzierungsvorschau beantwortet jetzt zwei Fragen statt einer: „darf hier
gebaut werden?" **und** „wird das hier arbeiten?".

Von den fünf Punkten, die OPEN_TASKS für ③ auflistete, waren vier längst
umgesetzt (GLB-Ghost, Rotation, Sockel, Radius). Der offene fünfte war kein
Schönheitsfehler: **`requiresRoad` tragen 23 von 34 Gebäuden, aber `needs_road`
blockiert ausschließlich Straßen selbst.** Ein unverbundenes Wohnhaus ist legal
platzierbar und liefert danach laut `isInfrastructureOperational` weder
Produktion noch Kapazität noch Versorgung. Im Startzustand waren **3.652 von
3.721** geprüften Kacheln gültig UND ohne Anschluss — die Startstadt hat fünf
Straßenkacheln. Der Ghost war grün, das Gebäude danach still.

**Zwingend (D-047):** `connectedRoadTiles` in `placement.ts` ist die **einzige**
Aufzählung der Anschlusskacheln; `isConnectedToRoad` leitet sein Ja/Nein daraus
ab. Ein Marker kann damit nie auf eine Kachel zeigen, die die Prüfung nicht
zählt (Fortsetzung von D-042). Der Ghost liest außerdem **eine**
`placementDiagnostics`-Projektion statt drei Einzelabfragen — Ghost, Banner und
Wasserfront-HUD können dieselbe Kachel nicht mehr unterschiedlich beschreiben.

Sichtbar: Marker auf den Anschlusskacheln, bernsteinfarbener Ghost + Banner
„Baubar — aber ohne Straßenanschluss bleibt der Betrieb ohne Wirkung" (bei der
Stadtgründung unterdrückt, dort gibt es planmäßig noch keine Straße). Wer eine
weitere „erlaubt, aber wirkungslos"-Bedingung findet, ergänzt sie als **Warnstufe**,
nicht als Platzierungsregel. Keine Save-/Sim-Änderung, **v29**.

Der damals als Nächstes vermerkte Punkt — **G2 ④ Verschieben** — ist mit v1.27
erledigt (siehe oben).

## A6 Steinbruch + A7 Farm (v1.25, Save v29, D-046)

Das Sägewerk ist nicht mehr der einzige aktive Betrieb. Steinbruch und Farm
laufen über **dieselbe** Knoten-, Arbeiter- und Lagerschleife: Ressourcenknoten
sind auf `tree`/`rock`/`crop` verallgemeinert, **Stein wächst nie nach**, und der
Logistik-Zuschlag eines Depots wirkt bei aktiven Betrieben auf Arbeits- und
Laufgeschwindigkeit statt auf eine Passivrate.

Der Sim-Teil lag bereits im Arbeitsbaum; fertig wurde die **Bedienung**, und die
war messbar falsch: `deposit_exhausted` hatte keinen Text (die UI hätte den rohen
i18n-Schlüssel gezeigt), `renewable`/`remainingInArea` wurden berechnet und von
keiner Komponente gelesen, und das gesamte Wortfeld sprach vom Referenzschnitt
(„Bäume in Reichweite" über einem Steinbruch, Axt-Symbol inklusive).

Jetzt liefert `src/components/operations/nodeVocabulary.ts` **ein** Wortfeld je
Knotentyp (total über die Union — der Compiler fordert neue Typen ein), und die
Endlichkeit ist sichtbar: Restmenge im Arbeitsgebiet plus Umzugshinweis, aber
**nur** bei nicht nachwachsenden Vorkommen.

**Für den Spieltest wichtig:** Bestehende Steinbrüche und Farmen produzieren
nicht mehr passiv, bis einmal „Betrieb starten" geklickt wurde — das
Gebäudefenster weist von selbst darauf hin. Kein Schemabruch, Save bleibt v29.

## Welt lädt vollständig (v1.24, Save v29, D-045)

Die **ganze Insel** wird ab dem ersten Frame gebaut und gezeigt — Gelände,
Küsten, Deko und Vegetation, auch für gesperrte Regionen. Die blickdichte
Wolkenwand aus D-034 ist ersatzlos entfernt, ebenso `fogSurfaceGeometry.ts`, die
Regionskonturen, `worldFogTopY`, die `CameraExplorationBoundary` und der
Dev-Cheat `cameraBoundsDisabled`.

Gesperrt heißt jetzt **entsättigt**: pro Bodenknoten 70 % Richtung eigener
Luminanz, 16 % dunkler, minimal kühler (`LOCKED_DESATURATION`/
`LOCKED_DARKENING`) — plus dem schwebenden Schloss-Marker. Die Minimap zeigt
dasselbe entsättigte Terrain statt ihrer prozeduralen Wolkendecke.

**Zwei Vegetationsaufbauten sind Pflicht, kein Feinschliff.** Sichtbares
gesperrtes Land ist bewachsen: 1.422 → **26.851** Instanzen. Der
Vegetationsschlüssel enthält die Belegungsmenge, also hätte ein gemeinsamer
Schlüssel bei **jedem Bauklick** die ganze Insel neu aufgebaut. Gesperrte
Regionen hängen aber nicht an der Belegung — sie bekommen einen eigenen
Schlüssel (Regionsliste + Qualitätsstufe), halbe Dichte und keine Schatten.
Gemeinsame Implementierung: `buildVegetationFor(...)`.

Sichtbarkeit ist keine Mechanik: `regionUnlockBlocker`, Baubarkeit und Kosten
sind unverändert. Keine Simulations- oder Save-Änderung (v29).

## Natur-/Prop-Overhaul 14.0 (v1.23, Save v29, D-044)

Die Insel ist bewachsen: **14.038 → 48.838 Props** bei unveränderten 51.057
Landkacheln. Vorher waren davon nur **502 echte Modelle (3,6 %)** — der Rest ein
Kegel auf einem Zylinder, weil **jedes Natur-`.glb` rund 29.000 Dreiecke** wiegt.
Der Katalog ist zudem kleiner als seine Dateinamen: mehrere Modelle sind
bytegleich, real existieren **fünf** Formen. Vielfalt kommt deshalb aus
Transformation (Größe, Drehung, Neigung, Instanzfarbe), nicht aus Assets.

Die Verteilung folgt jetzt **acht Naturzonen** (`forest_core`, `forest_edge`,
`meadow`, `rocky_highland`, `coast_flat`, `coast_rocky`, `wetland`,
`small_island`). Waldkern und Waldrand trennt der **Waldanteil im 5×5-Fenster** —
der Terraintyp allein kennt keine Kante, deshalb wirkte jeder Wald bisher innen
wie außen. Fünf neue Arten (`sapling`, `stump`, `shoreRock`, `scree`,
`cliffRock`) schließen die gemeldeten Lücken.

**Kein Regionsbudget begrenzt mehr die Dichte** — die Landschaft entscheidet
(testgesichert). `rebuildVegetation` schrumpfte von 605 auf 152 Zeilen; die
einzige Verteilungsinstanz ist `natureDistribution.ts`, die Renderer *und* Tests
gemeinsam aufrufen (D-042). Keine Geometrie-, Save- oder Simulationsänderung.

Verbindlich vor Vegetations-/Proparbeit: `docs/agents/NATURE_OVERHAUL_14_PLAN.md`.

## Modelltreue 13.1 (v1.22, Save v29, D-043)

Das Wasser liegt jetzt an der Unterkante der untersten Terrasse: es steht 4 m
höher als in 13.0. Gemessen lagen zwischen 0 und 3 m nur 331 flache Kacheln (die
Klippenwand), bei 4–5 m dagegen 14.073. Wirkung: 2×2-Anlegerplätze **20 → 344**,
bebaubare Uferkacheln **129 → 759**, Baufläche praktisch unverändert.

`HEIGHT_SCALE` hängt dafür an `SCALE_REFERENCE_N` statt an der Wasserlinie —
sonst hätte der höhere Wasserstand das Gelände um 8 % gestreckt. Das Gelände
steht still, das Wasser steigt; der Gipfel liegt ehrlich niedriger (52 → 48 m).
Modelltreue unverändert **0 veränderte Landknoten**.

**Neun Regionen**, alle über Land erreichbar (`requiresHarbor` nirgends gesetzt).
Startregion **9 „Gründerland"** (Rathaus 241,251 · 1.400 bebaubar · ΔH 0,12 ·
20 Kacheln vom Schwerpunkt · **vier** Landnachbarn), erste Erweiterung auf **L2 =
Nordwald**. Weil vier Nachbarn erreicht werden, gilt `START_MIN_NEIGHBOUR_REGIONS
= 3` wieder wie ursprünglich. Save **v29**, Backup `cmb.save.backup.world-v28`.

## Modelltreue 13.0 (v1.21, Save v28, D-043)

Die Quell-GLB ist die Welt. `tools/bakeWorld.mjs` übernimmt ihre Geometrie
**unverändert** (0 von 233.287 Landknoten abweichend; vorher 67,6 %) und leitet
Wasser, Ufer, Biome, Bebaubarkeit und Regionen daraus ab — keine Stufe schreibt
das Höhenfeld mehr. Verbindliche Kennzahl: `BAKED_WORLD.modelFidelity`.

Die Insel ist damit das, was sie im Viewer ist: eine **Klippeninsel mit
Plateaus** und ein **Archipel**. Elf Regionen, Startregion **11 „Gründerland"**
(Rathaus 239,251 · 1.400 bebaubar · ΔH 0,10 · 22 Kacheln vom Schwerpunkt ·
Nachbarn 1 und 8), erste Erweiterung auf **L2 = Nordwald** (55,5 % Wald).
Region **10** hat keinen Landnachbarn und ist `requiresHarbor`.

Preis der Treue, gemessen und nicht versteckt: bebaubar 47.806 → **37.891**,
bebaubare Uferkacheln 900+ → **150**, Steilküste 2.244 gegen 475 flach, **0**
Brückenkandidaten (gequert wird über die Höhenstraße, 24 Viadukte). Häfen sind
selten — in der Startregion existiert keiner; `dock_small` öffnet erst L6, bis
dahin sind Nordwald (L2) und Herzland (L4) erschlossen.

Wasser bleibt der erlaubte Hebel (die GLB modelliert keinen Gewässergrund):
Tiefenrampe angehoben, `shorelineTolerance` 0 → 0,34 — sonst wäre `river_port`
an null Stellen baubar. Save **v28**, Backup `cmb.save.backup.world-v27`.


## Welt-Feinschliff 12.3 (v1.20, Save v27) — AKTUELL

Korrektur zu v1.19. Der zweite Spieltest meldete die Küstenzacken erneut, obwohl
der Bake nachweislich **0 Geländenadeln** liefert. Beides stimmte: die Zacken
sind **keine Geometrie**, sondern die prozeduralen Landmarken-Platzhalter.

- **Nachgewiesen über eine Szenen-Probe im laufenden Spiel** (temporärer Handle
  auf die Three-Szene; alle Meshes nach Höhe, Schlankheit, Farbe und Position
  ausgewertet, inzwischen wieder entfernt): Das Bodenmesh überschreitet an
  keiner Stelle das gebackene Höhenfeld. Weltweit existieren genau **12** hohe,
  schlanke Objekte — `rockArch` (zwei aufrechte graue Kästen 0,9 × 3,8) und
  `waterfall` (Kasten 1,65 × 3,9 × 0,72). `SCENIC_PROP_MODELS` listete für sie
  ausschließlich Wunschnamen, also griff immer die Notgeometrie.
- **Behoben:** Die Modell-Listen enden jetzt mit vorhandenen Dateien
  (`rock_large`, `tree_deciduous` …); die Notgeometrie ist außerdem repariert
  (Felstor breiter als hoch, Wasserfallwand als Wand statt Platte).
- **Hochskalierte Props (Nutzerwunsch):** neue Arten `giantTree` (Footprint 3,1
  und 4,4) und `boulder` (1,9 und 3,2) aus VORHANDENEN Modellen, mit kräftiger
  Größenstreuung — der Größenunterschied ist der Effekt, nicht die Menge.
- **Klippen-Garantie:** Steilküste entsteht jetzt immer, wo echtes Gebirge ans
  Wasser reicht (Relief ≥ 18 im Umkreis 7). Plateaus 136 → **254** Kacheln.
  Ganz ohne Zonen-Lotterie wurde die gesamte Küste steil und der Bake fand keine
  gültige Startregion mehr — deshalb die Kombination.
- **Ids 4 und 5 haben getauscht** (4 = Nordfelder, 5 = Weite Westaue);
  `REGION_MIN_TILES` 3.000 → 3.300 hält die Regionszahl bei 9.

**Lehre (D-042 erweitert):** Eine Messung beweist nur, was sie misst.
Widerspricht ein Spieltest einer grünen Messung, ist als Nächstes der
GEGENSTAND der Messung zu prüfen, nicht ihre Schwelle.

## Welt-Feinschliff 12.2 (v1.19, Save v27)

Zweiter Spieltest-Nachlauf. Fünf gemeldete Punkte, jeder vorher gemessen:

- **Küstenzacken entfernt.** Kein Renderfehler, sondern Geometrie: schmale
  Felsnadeln der Quell-GLB werden vom Max-Y-Rasterizer zu 1–2 Knoten breiten
  Nadeln verdichtet. Der alte Riegel verlangte „> 6 m Überhöhung UND ≤ 1 Stütze"
  und traf genau **1** Knoten — real waren **487** ≥ 1,5 m überhöht (321 auf der
  Land/Wasser-Grenze). Die Kennzahl maß das Falsche. Neue Bedingung: Hochpunkt in
  **≥ 3 von 4 Achsen** (Klippenkanten/Grate sind das entlang der Kante nie).
  **208 entfernt, 0 übrig**, hart getestet.
- **Echte Klippen statt Pseudo-Steilküste.** Die „bewusste Steilküste" kam allein
  aus einem Zonen-Hash; 223 Kacheln hatten Höhenmedian **0,2–1,3 m**. Jetzt
  braucht Steilküste zusätzlich echtes Relief (≥ 5 m im Umkreis 7) → **124**
  echte Kacheln, und zusammenhängende Abschnitte bekommen einen **ebenen Kopf auf
  Hinterlandniveau** (2 Abschnitte, 136 Kacheln) — Wand zum Wasser, nutzbare
  Fläche oben, bündig ans Land.
- **Welt nicht mehr leer.** Gemessen **6.891** Props auf 61.322 Landkacheln; in
  8 von 9 Regionen war das BUDGET der Engpass. Startregion: **2 Kiefern, 1
  Laubbaum, 2 Büsche** — der Naturrahmen begann bei Radius 15 und war damit
  größer als die ganze Region. Rahmen 5→16, Zielschwellen wie überall, Budgets
  verdoppelt: **15.334 Props weltweit, 183 Bäume/Büsche in der Startregion.**
- **Ostterrassen ab Level 2** (Nutzerwunsch), Leiter komplett neu gestaffelt:
  L2 Ostterrassen · L4 Nordwald · L6 Mittelmark · L8 Nordfelder ·
  L11 Lagunenküste · L14 Dünenküste (nur per Hafen) · L17 Weite Westaue ·
  L20 Südmassiv. `FREE_EXPANSION_LEVEL` 3 → **2**.
- **Freie Gründung:** Neues Spiel ohne Rathaus, ohne Distrikt, ohne Straßen. Der
  Spieler setzt das Rathaus selbst (`foundCity`); der Bake-Anker bleibt als
  Vorschlag. Kein neues Platzierungssystem — derselbe Ghost, dieselbe
  `validatePlacement`-Instanz. „Gegründet?" ist abgeleitet, kein Save-Feld.

**Neun Regionen** (Median unverändert 7.983 Kacheln), Startregion **9
„Gründerland"** (1.576 bebaubar, Bake-Vorschlag (228,261), 17 Hafenflächen, drei
Landnachbarn 3/7/8). Save **v27** (Backup `cmb.save.backup.world-v26`).

**Bake-Reihenfolge (wichtig):** Alle Höhenänderungen — Uferprofil, Terraforming,
Kappung, Nadelreparatur, Klippen-Plateaus — laufen VOR der verbindlichen
Ableitung von Ufer/Biom/Bebaubarkeit. Ein Zwischenstand hatte Kappung und
Nadelreparatur danach; `tests/mapBuildability.test.ts` fand prompt eine als
bebaubar markierte Kachel mit Hang 1,35 über `GROUND_ROAD_MAX_SLOPE` (1,25) —
ein Bauplatz ohne mögliche Straßenanbindung. D-041 (Terraforming vor
Segmentierung) bleibt unverändert gültig.

Offen (nicht vortäuschen): Bergplattformen als eigene Terrain-Klasse, neue
Vegetations-/Prop-Assets (Mammutbäume, Tiere, Landmarken), Mesh-Einebnen unter
dem Footprint, Pfahl-/Steglogik für Wassergebäude.

## Welt-Feinschliff 12.1 (v1.18, Save v26)

Nachlauf zum Spieltest der neuen Insel. Ursachen statt Symptome, jede Änderung gemessen:

- **Acht statt dreizehn Regionen** (Median 3.649 → 7.983 Kacheln), jede mit
  gemessener Rolle: Nordwald 55,4 % Wald · Südmassiv 59,3 % Gebirge · Weite
  Westaue 11.856 Bauflächen · Lagunenküste · zwei Mischregionen · Mittelmark
  als Scharnier (fünf Nachbarn) · Startregion 8 „Gründerland".
- **Progression an Ressourcen gekoppelt:** Die kostenlose Erstwahl ab L3 IST
  die Waldregion (direkter Startnachbar) — Antwort auf das erste Sägewerk.
  Die größte Baufläche der Insel (Westaue) ist seenachbar zum Start: früher
  Zugang nur per Hafen. `regionUnlockBlocker` unverändert.
- **Ufer begehbar:** Das Uferprofil lief VOR der Schlussglättung, die es wieder
  hochzog. Jetzt läuft es zuletzt. Seeufer 73,9 → **97,7 %** flach, Flussufer
  64,8 → **98,1 %**, bebaubare Uferkacheln 67 → **88 %**, Uferzacken 3 → **0**,
  Baufläche 44.170 → **47.806**.
- **Häfen nachweisbar baubar:** Der Bake spiegelt jetzt `waterfrontWaterCells`
  (2×2-Wasserrechteck bündig) statt nur Uferkacheln zu zählen — vorher 0
  baubare Anleger in der Startregion trotz „23 Hafenflächen". Jetzt 17 im Bake,
  **18 im Spiel**.
- **Sägewerk kalibriert:** Stufe 1 13,5 → **52,7 Holz/min** (frühere Passivrate
  45); Stufen liefern 52,7 / 134 / 246. Radius-Ausbau ergänzt (fehlte als
  einzigem Betrieb). Test erzwingt: jede Stufe verbessert ALLE Achsen.
- **Vegetationsbudget folgt der Fläche**, nicht der Regionsanzahl
  (`regionPropBudget`, Untergrenze 0,85, Deckel 3×) — sonst hätte die
  Regionskonsolidierung die Insel um ein Drittel entlaubt.
- **Rathaus garantiert eben:** harte Flachheitsschwelle in §8 (vorher nur
  Bewertung; der Bake wählte ΔH 3,48). Jetzt ΔH **0,53**.
- 534 Tests grün · tsc/eslint/build clean · Screenshot-Smoke ohne Konsolenfehler.

## World Overhaul 12.0: neue Insel als Weltgrundlage (v1.17, Save v26, D-041)

- **Die Welt ist ausgetauscht, nicht überarbeitet.** `reference/world/new island 3d
  model.glb` (117 Meshes, SHA `b52c0cfb…`) ist die **einzige** Weltgrundlage; die
  alte `island 3d new.glb` wird von nichts mehr gelesen. Die GLB wird wie bisher
  **nie** zur Laufzeit geladen — sie ist reine Eingabe für `tools/bakeWorld.mjs`.
- **Kennzahlen:** 61.322 Landkacheln, **44.170 bebaubar** (alte Insel nach dem
  Flattening: 38.126), freie Footprints 37.559 (3×3) / 34.596 (4×4) / 32.031 (5×5),
  Gebirge 7.069 Kacheln als ein zentrales Massiv, Uferkante 2.719 Kacheln davon
  90,9 % ≤ 1,5 über der Wasserlinie (Median 0,26).
- **Reihenfolge im Bake umgedreht (D-041):** Terraforming läuft jetzt **vor** der
  Regionssegmentierung (`§6b-flat`). D-040 hatte die umgekehrte Reihenfolge
  ausschließlich zum Schutz alter Regions-Ids/Spielstände gewählt; da die Welt
  vollständig ersetzt wird, entfällt der Grund — und Regionen, Startregion,
  Rathaus und `BAKED_REGIONS[].buildable` beschreiben endlich das FERTIGE Gelände.
- **Startregion 13 „Gründerland":** Zentrum (232,259) bei Inselschwerpunkt
  (259,260), 1.456 bebaubar, 1.222 freie 4×4-Plätze, Rathaus (237,256) ΔH 0,34,
  365 Waldkacheln, 13 Uferkacheln, **vier** Landnachbarn (Holz/Mischland/Stein).
  Der Bake erzwingt Budget, Wasserzugang, Flachheit und ≥ 3 Nachbarregionen hart.
- **13 Regionen mit klarem Profil:** zwei Holzreviere (8, 9), zwei Gebirge (10, 4),
  Kornkammer (2, größte Fläche 7.757), fruchtbarste Region (5), zwei große Ebenen
  (3, 6), Mischregionen (7, 12, 11) und die Binnenlagune (1). Preise weiterhin
  aus dem Faktormodell (`regions/regionCost.ts`, ±12 % getestet).
- **Kein `requiresHarbor` mehr** — Folge der Geografie, kein entferntes Feature:
  die Insel ist EINE Landmasse, von der Startregion aus über Land vollständig
  erreichbar. `regionUnlockBlocker` ist unverändert und greift weiter geografisch.
- **Kein totes Land:** 3.217 verwaiste Kacheln (zwei Nordinseln) gehören jetzt zur
  nächstgelegenen Region; der Nebel deckt **alle** Teile einer gesperrten Region.
- **Regionsnamen nur bei Hover/Freischaltung** (Auftrag §10) — Ruhezustand ist ein
  kompaktes Schloss ohne Text.
- **Save v26** mit einmaligem Backup `cmb.save.backup.world-v25` und Neustart.
- Verbindlich vor Welt-/Regionsarbeit:
  [`WORLD_OVERHAUL_12_PLAN.md`](WORLD_OVERHAUL_12_PLAN.md).

## Full Overhaul: aktive Einfachheit und komponierte Cartoon-Welt (v1.16, Save v25)

- **Ein Standardbild, eine nächste Entscheidung:** Die Topbar zeigt nur
  Stadt, Geld, Kernressourcen, Bevölkerung, Zufriedenheit und Zeit. Kennzahlen
  öffnen kompakte controllergestützte Details. Der redundante Menüknopf ist
  entfernt; konkurrierende passive HUD-Flächen weichen aktiven Sheets.
- **Proportionen aus dem echten Laufzeitbild korrigiert:** Stadtblock 260 Pixel,
  Ressourcenkapsel maximal 650 Pixel, kompaktere Status-/Anliegenflächen,
  Stadtarbeit 410 Pixel, eingeklappter Info-Layer 244 Pixel und Minimap
  214 Pixel. Der Stadtname bleibt innerhalb seines Blocks robust lesbar.
- **Kern-UX reduziert:** Stadtstatus zeigt Zufriedenheit, höchstens drei
  schwächste Werte und einen nächsten Schritt. Im Weltbild erscheinen maximal
  zwei priorisierte Bürgeranliegen. Bau-Shop, Gebäudedetails, Wirtschaft und
  Stadtverwaltung beginnen mit einer kurzen Entscheidungsansicht; Vertiefungen
  bleiben einklappbar.
- **Panel-Verhalten vereinheitlicht:** Popover schließen vor Navigation und
  bleiben im Viewport. Große Sheets unterstützen `Escape`; responsive Regeln
  halten die Kerninformationen auch bei 1024 Pixeln lesbar.
- **Stadtarbeit ist smart-first:** Auftrag und Fahrzeug erzeugen eine
  vorgeschlagene Route. Die dominante Karte zeigt Ziele und Weg; Ladung,
  Fahrzeit, Nachladen und Bestätigung bleiben sichtbar. Manuelle Planung ist
  optional und erweitert ausschließlich den vorhandenen
  `ActiveActivity`-/Cargo-/Straßenanalyse-Flow.
- **Komponierte Cartoon-Welt:** Wiese, Waldgrund, Sand, Fels und Wege verwenden
  ruhige handgemalte Drop-in-Albedos ohne fotografisches Mikrodetail.
  Vegetation bildet deterministische Gruppen und offene Bauflächen; detaillierte
  Modelle werden pro Region budgetiert, räumlich gechunkt und per Distanz/Frustum
  gecullt.
- **Aktive Inselprofile statt historischer Zuordnung:** Die Visualtabelle deckt
  exakt die 13 gebackenen IDs ab. Kronengebirge und Nordgrat sind alpin,
  Süd-/Zentralwald bleiben Waldkerne und Zentralland wird als warmes, offenes
  Gründerland komponiert. Die weich gemittelte Tönung bleibt rein im Renderer.
- **Küste und Straße sind zusammenhängende Formen:** Marching Squares,
  Konturketten und Chaikin-Glättung erzeugen ruhige Ufer mit lokal variierenden
  Flachwasser-/Schaumbändern. Straßen besitzen korrekt gewickelte,
  terrainfolgende Bänder, verbundene Knoten und sichtbare Anschlüsse an
  Brücken-/Hochstraßen. Gameplaygraph und Land-/Wassermasken bleiben Wahrheit.
- **Fahrzeuge sind gebündelte Cartoon-Fallbacks:** Autos, Betriebslogistik und
  Missionsfahrzeuge besitzen klare Typ-Silhouetten, Fenster, Räder und
  Fahrgestell statt frei schwebender Boxen. Jede Fallback-Variante bleibt ein
  Draw-Call und wird weiterhin automatisch durch passende Drop-in-GLBs ersetzt.
- **Kamera und Weltmaßstab:** Die City-Ansicht rahmt den real bebauten Kern
  dynamisch mit Distanz 34–48; der Standard liegt bei 38/48°/225°. Die
  Weltübersicht bleibt ein expliziter 540er Modus. Minimap-Klicks verwenden
  Distanz 42 statt des fehlerhaften 92er Fernzooms.
- **Straßen und Startkomposition:** Wohnstraßen sind 0,68 Kacheln breit,
  besitzen ein stärkeres Bankett und lokal gerundete Ecken ohne
  Spline-Überschwingen. Radius 15 um das Rathaus bleibt frei, der Ring bis 32
  erhält weich zunehmende Naturcluster.
- **Sperrregion, Gebirge und 05:42-Licht:** Gewellte, texturierte Wolkenflächen
  ersetzen graue Platten und geglättete Konturen ersetzen Randzacken. Ein
  gezielter Dawn-Fill hält Straßen und Gebäude am frühen Morgen lesbar;
  Mitternacht bleibt dunkel. Schnee beginnt erst ab Höhe 36, warme Felsfarben
  und organische Findlinge reduzieren den grauen Blockeindruck des Plateaus.
- **Wirkungsbereiche:** Derselbe Controller-Coverage-Zustand speist
  terrainfolgende Radien, Funktionsfarben und Verbraucherzustände in Welt,
  Platzierung und Gebäudekontext. Kein zweites Radius- oder
  Platzierungssystem.
- **Inselstruktur bewusst stabil:** Offline-Bake, 13 Gameplayregionen,
  Startregion, Rathauskoordinate und Weltmasken bleiben unverändert. v1.11 hatte
  die 3×3-/4×4-Bebaubarkeit bereits ungefähr verdoppelt und flache Ufer
  erweitert; v1.16 macht diese Grundlage durch Komposition, Materialien,
  Küsten, Kamera und Vegetation lesbarer. Ein echter Remap benötigt einen
  eigenen Bake-, Migrations- und Messpass.
- **Architektur:** Simulation bleibt von React/Three getrennt, UI und Renderer
  lesen `GameController`-Snapshots/ReadModels und senden Commands. Reine
  Helfer kapseln Straßen-, Küsten- und Smart-Route-Ableitungen; Manifeste
  sichern Drop-in-Fallbacks. Schema **v25**, keine Migration, kein Neustart.
- **Assets:** `road_path_cartoon.png`, `grass_meadow_cartoon.png`,
  `forest_floor_cartoon.png`, `coast_sand_cartoon.png` und
  `mountain_cliff_cartoon.png`; Registrierung in den bestehenden Straßen- und
  Terrainmanifesten, Dokumentation generiert.
- **Verifikation:** TypeScript, vollständiger ESLint, **68 Testdateien mit
  519/519 Tests**, Produktionsbuild, Diff-Check und Preview-HTTP-200 sind
  erfolgreich. Der interaktive Browser-Screenshot-Smoke ist mangels verbundener
  Browserinstanz blockiert. Ein nativer Tauri-Build ist in dieser Umgebung ohne
  Rust-/Cargo-Toolchain nicht möglich.
- Details: `docs/PATCHNOTES.md`.

---

# Projektstand — v1.15 (historisch)

Stand: 29. Juli 2026

## Cartoon-Welt und verbindliches Mockup-HUD (v1.15, Save v25)

- Das globale Straßennetz verwendet eigene warme, UV-unabhängige
  Miniaturwelt-Materialien für Fahrbahn und Bankett. Die schwarze
  Asphalt-Schlange ist damit an ihrer Ursache behoben; Routing, Commands,
  Platzierung und Pick-Flächen bleiben unverändert.
- Neue generierte Drop-in-Texturen für Wiese, facettierten Fels und Küstensand
  sind im Terrainmanifest registriert und werden vom World-Space-/Triplanar-
  Shader verwendet. Breite Farbformen dominieren wieder über Foto-Mikrorauschen.
- Drop-in-Gebäudematerialien erhalten einmalig ein helles, mattes,
  facettiertes Cartoon-Finish. Meer, Flüsse, Flachwasser und Küstenschaum sind
  türkis-blau, animiert und stärker lesbar.
- Die Abendwelt besitzt höhere Licht-Mindestwerte. Laternenreflexe verwenden
  kleine additive Scheiben und erzeugen keine dunklen Kreise mehr.
- Jede obere Kennzahl ist anklickbar. Ressourcen öffnen Bestand, Produktion,
  Lager und Netz; Bevölkerung, Zufriedenheit und Wasserabdeckung zeigen echte
  controllergestützte Detaildaten.
- Popover werden per Viewport-Portal positioniert und nicht mehr von der
  Ressourcenkapsel abgeschnitten. Außenklick, Escape, Scroll und Resize werden
  unterstützt.
- HUD, Navigation, Status, Anliegen, Minimap, Bau-Shop, Detail-Sheets,
  Straßenplanung und Stadtarbeit besitzen ein gemeinsames Navy-/Gold-Raster.
  Der Bau-Shop verwendet zwei stabile Katalogspalten plus Vorschau; Stadtarbeit
  bleibt eine Drei-Spalten-Arbeitsfläche mit dominanter Karte.
- Rein präsentational: Schema **v25**, keine Migration, kein Neustart und kein
  zweites Terrain-, Straßen- oder Aktivitätssystem.
- TypeScript, gezielter Lint, Terrain-Dokumentation und Produktionsbuild sind
  grün. **486/487 Tests** laufen; offen bleibt ausschließlich der parallel
  bearbeitete Baum-Regenerationstest. Der Gesamt-Lint wird nur von drei
  `no-explicit-any`-Fehlern der fremden `tests/__probe.test.ts` blockiert.
  Interaktiver 3D-Screenshot-Smoke bleibt mangels verbundener Browserinstanz
  technisch blockiert. Der Tauri-Build kann ohne lokal installierte
  Rust-/Cargo-Toolchain nicht starten; TypeScript-/Vite-Produktion ist grün.
- Details: `docs/PATCHNOTES.md`.

---

# Projektstand — v1.14 (historisch)

Stand: 29. Juli 2026

## Sichtbare Straßen und lesbare Abendwelt (v1.14, Save v25)

- Der konkrete Straßenfehler aus dem Laufzeit-Screenshot ist behoben:
  Fahrbahnbänder und Knotenflächen waren rückwärts gewickelt und wurden von
  WebGL vollständig weggecullt. Alle Normalen zeigen jetzt zu `+Y`;
  `DoubleSide` schützt zusätzlich gegen Totalverlust.
- Eine neue reine Geometriefunktion und ein Regressionstest prüfen jede
  erzeugte Dreiecksnormalenrichtung für gerade, gebogene und runde Flächen.
- Straßenmaterialien sind heller und dämmerungsfest. ACES-Exposure,
  Hemisphärenlicht und Ambient-Fill halten die Übersicht am Abend lesbar.
- Ein eigener Wiesenbaum-Pool, größere Baum-/Busch-Silhouetten, zurückhaltendere
  Küstenbänder und ruhigere Regionswolken verdichten und beruhigen die Welt.
- Lange deutsche Navigationsbezeichnungen werden nicht mehr mitten im Wort
  getrennt.
- Rein visuell: Schema **v25**, keine Migration und kein Neustart.
- TypeScript, Produktionsbuild und Preview-HTTP-200 sind grün.
  **486/487 Tests** laufen; offen bleibt nur der parallel bearbeitete
  Baum-Regenerationstest. Der Gesamt-Lint wird ausschließlich durch drei
  `no-explicit-any`-Fehler in der fremden Probe-Datei blockiert.
  Browser-Screenshot-Smoke bleibt mangels verbundener Browserinstanz blockiert.
- Details: `docs/PATCHNOTES.md`.

---

# Projektstand — v1.13 (historisch)

Stand: 29. Juli 2026

## Visual-Overhaul-Korrekturpass (v1.13, Save v25)

- **Schwebende Leuchtflächen sind entfernt.** Die modellfremden
  Fassadenfenster-Quader existieren nicht mehr; Nachtlesbarkeit verwendet
  wenige instanzierte Laternen exakt am vorhandenen Straßennetz.
- Normale Bodenstraßen werden als **zusammenhängende, geglättete,
  terrainfolgende Bänder** gerendert. Der bestehende kachelgenaue Straßengraph
  bleibt Wahrheit für Routing, Auswahl und Commands; transparente Pick-Flächen
  bewahren die Bedienung.
- Die Kugelwolken gesperrter Regionen wurden durch eine zusammenhängende
  texturierte Konturfront ersetzt. Küstenschaum ist schmaler und dezenter.
- Vegetation steigt deterministisch von rund 700 auf rund 1.300 instanzierte
  Props pro Region. Terrain erhält weiche Makrovariation sowie hellere,
  differenzierte Bergfarben; Offline-Bake, Regionen und Baubarkeit bleiben
  unverändert.
- HUD, Navigation, Status, Anliegen und Minimap sind größer und näher an den
  verbindlichen Mockup-Proportionen. Der Bau-Shop besitzt ein festes
  Drei-Spalten-Raster plus Detailvorschau; große Sheets teilen eine rechte
  Arbeitsfläche. Solange ein Sheet geöffnet ist, werden konkurrierende passive
  HUD-Flächen nicht gerendert.
- Reiner UI-/Renderer-Ausbau: **keine Config-, Balancing- oder Save-Änderung**,
  Schema bleibt **v25**, keine Migration und kein Neustart.
- Verifiziert: TypeScript und Produktionsbuild erfolgreich, Preview HTTP 200.
  **484/485 Tests grün**; der offene Fehler in
  `tests/operations.test.ts:125` gehört zu gleichzeitig bearbeiteten Active
  Operations. Der exakte ESLint-Gesamtaufruf wird weiterhin nur durch drei
  `no-explicit-any`-Fehler im fremden `tests/__probe.test.ts` blockiert.
- Integrierter 3D-Screenshot-Smoke weiter nicht ausführbar, weil die verbundene
  Browserumgebung keine Browserinstanz bereitstellt.
- Details: `docs/PATCHNOTES.md`.

---

# Projektstand — v1.12 (historisch)

Stand: 28. Juli 2026

## Maritimer Visual Overhaul (v1.12, Save v25)

- Historische Grundlage des dunkelmaritimen Presentation-Layers, des
  Coverage-Readmodels und der Hochstraßen. Die in echten Spielszenen sichtbaren
  Licht-, Straßen-, Wolken- und Layoutfehler wurden in v1.13 korrigiert.

---

# Projektstand — v1.11 (historisch)

Stand: 28. Juli 2026

## Map Flattening + Buildability Overhaul (v1.11, Save v25) — AKTUELL

- Die Insel ist **außerhalb des zentralen Massivs eingeebnet**. Bauplätze für
  3×3- und 4×4-Gebäude haben sich ungefähr **verdoppelt** (32,2 % → 60,7 % bzw.
  26,0 % → 50,3 % der Ankerkacheln); Bebaubar-Maske 25.161 → 38.126 Kacheln.
- **Das Massiv ist unangetastet** (Gipfelhöhe 52, Kacheln ≥ 13 und ≥ 25
  unverändert). Entfernt wurden 1.647 Streu-„Gebirgs"-Kacheln **unter Höhe 4** —
  Steilheits-Artefakte im Tiefland, die Gebäude und Straßen blockierten.
- **Küste gekippt:** flaches Ufer 1.453 → 2.485 gegen Steilküste 1.937 → 905;
  wassernah bebaubar 1.210 → 2.242; garantierte 5×5-Uferplattformen 16 → 44.
- **Weltstruktur bitgleich** (D-040): Terraforming läuft im Bake **nach** der
  Regionssegmentierung, deshalb sind `islandRegions.gen.ts`, Startregion 9 und
  Rathaus (127,250) unverändert. `regions.config.ts` und das Balancing gelten
  weiter; **bestehende Spielstände bleiben gültig, kein Neustart**.
- **Platzierung:** neues reines Sim-Modul `src/game/buildings/terrainFit.ts` —
  Höhenbudget wächst mit der Footprint-Kantenlänge (statt pauschal 0,85),
  einzelne Randkacheln kippen einen Bauplatz nicht mehr, `GROUND_ROAD_MAX_SLOPE`
  deckt den gesamten bebaubaren Hangbereich ab. `validatePlacement` bleibt die
  **einzige** Instanz; der Renderer liest dieselben Werte für den Sockel.
- **Renderer:** Fundament ist eine abgetreppte Stützmauer bis unter das
  umliegende Gelände — nichts schwebt, nichts klafft an der Talseite.
- Verifiziert: TypeScript, ESLint, **473/473 Tests**, Produktionsbuild,
  3D-Screenshot-Smoke ohne Konsolenfehler.
- Offen (dokumentiert, nicht vorgetäuscht): echtes Einebnen des Terrain-Meshes
  unter dem Footprint, Pfahl-/Steglogik für Wassergebäude, 5×5 bleibt mit
  30,9 % der Ankerkacheln der schwierigste Fall.
- Details: `MAP_FLATTENING_AND_BUILDABILITY_PLAN.md`, **D-040**, `PATCHNOTES.md`.

---

# Projektstand — v0.82 (historisch)

Stand: 23. Juli 2026

## Visual Active Operations, Ressourcennetz & Infrastruktur (v0.82)

- Das Referenz-Dashboard ist in getrennte Zustände zerlegt: Arbeitsgebiet,
  Betriebs-Tabs, Ressourcennetz, Transport, Cargo-Timeline, Straßenentwurf,
  Wasserbau-Ghost sowie bestehende Regions-/Performanceflächen. Die
  Ein-Hauptfläche-Regel bleibt erhalten.
- **Arbeitsgebiet produktiv:** UI-only Node-Entwurf; terrainfolgende Fläche,
  Reichweitenringe, instanzierte Knoten und Wege. Bestätigung ausschließlich via
  `startBuildingOperationWithNodes`.
- **Betrieb/Netz/Transport:** echte Worker-/Inventory-/Preview-Daten. Fehlende
  Durchsatzhistorie, zentrale Lageraufteilung und Handkarrenlogik werden sichtbar
  nicht vorgetäuscht.
- **Straße:** Klick/Drag erzeugt erstmals einen Preview-Entwurf statt Sofortbau;
  Kosten/Blockaden aus `roadPathPreview`, Bau erst nach Bestätigung. Wasserbau
  nutzt optionales transparentes GLB plus Plattform, Pfeiler und Anker.
- **Stadtarbeit:** Ladung vor/nach jedem echten `CargoRouteStop` sichtbar.
  Dev-Panel zeigt zusätzlich den dokumentarischen Weltverdichtungsvergleich.
- Stabile Visual-ViewModels/Actions, getrennte Dev-Szenarien und sieben
  System-/Handoff-Dokumente. **Keine Simulation, kein Balancing, keine
  Save-Änderung (v19).**
- Verifiziert: TypeScript, ESLint, 354/354 Tests und Produktionsbuild. Preview
  liefert HTTP 200; Runtime-Screenshot mangels verfügbarer integrierter
  Browserinstanz und nativer Tauri-Build mangels Cargo-Toolchain offen.
- Offen: echte Durchsatzhistorie, Handkarren, physische Zwischenlager,
  optionale Nachfüllquellen, atomarer Straßenpfad/Alternativen/Viadukte,
  wirtschaftliche Waterfront-Pfeilerwerte und Rechteck/Polygon.

## § Change 9.0 — Fog of War & Kamera-Grenzen S3 (v0.81)

- **S3a Fog:** eine globale absolute Nebeloberkante (`worldFogTopY`, 86. Perzentil
  aller Landhöhen) + `alphaHash`-Dithering → EINE weiche, zusammenhängende
  Wolkenfront statt Pro-Region-Kapseln; Gipfel ragen bewusst heraus (§6.4).
- **S3b Kamera-Clamping (neu):** `CameraExplorationBoundary` hält das Blickziel über
  der freigeschalteten Union (weiches Randband, Inertia-Bremse); wächst mit jedem
  Unlock mit. **S3c:** getrennter Dev-Cheat `cameraBoundsDisabled`.
- **S3d:** Unlock zieht nur den Nebel zurück (Fade, nie neu erzeugt); Terrain/
  Vegetation deterministisch — inkrementeller Neuaufbau ist S4.
- Rein visuell/navigatorisch, **keine Save-Änderung** (v19). **346 Tests grün**,
  tsc/eslint/build/3D-Smoke ok. D-034.
- **Offen:** S4 Vegetations-Performance (inkl. inkrementellem Unlock-Rebuild), S5
  lebendige Welt, S6 Sägewerk-Arbeitsmodus, S7 Steinbruch/Farm, S8 weitere Betriebe.

## § Change 9.0 — Zentraler Start & Regionsbalancing S1/S2 (v0.80)

- **S1:** Startregion neu gebacken — 820→**1.400** bebaubare Kacheln (echtes
  Zentrum, §3.3), über die Bake-Zielvorgabe statt manuellem Verschieben (§3.2).
  Rathaus (144,191), Expansion 1.0, Zentralität 0.79.
- **S2:** Forst-Ids rotiert (Nordwald→12, Südforst→11, Ostforst→10),
  L3-Erstwahl {7,12} (§5.2), Namen/Level/Kosten angeglichen.
- **Save v19** (Weltumbau, Backup/Neustart `cmb.save.backup.world-v18`).
  **340 Tests grün**, tsc/eslint/build/3D-Smoke ok. D-033.
- **Offen:** S3 Fog/Kamera-Clamping, S4 Vegetations-Performance, S5 lebendige Welt,
  S6 Sägewerk-Arbeitsmodus, S7 Steinbruch/Farm, S8 weitere Betriebe.

## Active Operations 2.0 — Lagertransport A5 (v0.79)

- **Transport-Loop geschlossen:** Ein manueller Transport bringt lokal geerntetes
  Holz über Fahrzeug + Straßenroute ins **Zentrallager** (globaler Pool über ein
  Lagergebäude als Anlieferpunkt). Erst dann ist es global nutzbar (§7.2).
- Reine Sim `src/game/operations/transport.ts`, Zustandsmaschine
  `loading→in_transit→unloading→delivered` (nur live), Reservierung im
  Quell-Lager, gedeckelte Einlagerung (kein Doppelzählen). **Verwendet
  `routeAnalysis.ts` + `logistics.ts` wieder — kein zweites System (§8).**
- Transport-UI im Gebäudefenster (Ziel/Fahrzeug/Vorschau/Rückruf, laufende
  Transporte mit Fortschritt). Additive gepoolte 3D-Fahrzeuge.
  `getInventoryNetworkOverview` = global/lokal/reserviert/unterwegs.
- **A5-Reste** ebenfalls umgesetzt: Mehrfachladungen/Nachfüllfahrten (Fahrzeug
  pendelt), Rückruf jederzeit (Ladung kehrt zurück), Betriebskosten je Fahrt.
- **Save v18** (additiv `operations.transfers`, Migration `v17→v18`, alte Saves
  bleiben ladbar). **339 Tests grün** (12 Transporttests). Offen:
  Zwischenlager-Puffer, Kraftstoff, A6–A10.

## Active Operations 2.0 — Sägewerk-Referenzschnitt (v0.78)

- Das Sägewerk erzeugt kein passives Holz mehr: Arbeitsauftrag → Arbeiter fällen
  markierte Bäume → tragen Holz ins **lokale Betriebslager**; volles Lager stoppt.
- **Ressourcenknoten (Bäume)** = echte Sim-Objekte, stabile Id `"x,y"`,
  deterministisch aus Wald abgeleitet, nur Deltas persistiert; Regeneration nur
  auf gültigem Terrain.
- Neuer **Betriebsbereich** im Gebäudefenster (Aktionsbutton, Arbeiter, Auftrag,
  lokales Lager, Vorschau/Warnungen). Renderer zeichnet Arbeiter additiv.
- Reines Sim-Modul `src/game/operations/**`; passiver `produce`-Pfad für
  `operation`-Gebäude in Tick+Derived abgeschaltet. **Save v17** (additiv,
  Migration `v16→v17`, alte Saves bleiben ladbar).
- **327 Tests grün** (9 neu). Sägewerkholz bis Phase A5 (Transport) bewusst lokal
  gebunden. Verbindlicher Einstieg: `ACTIVE_OPERATIONS_PLAN.md`.

## Final World Compaction — Säule B: Vegetations-Performance (v0.77)

- Vier Grafik-Qualitätsstufen (Niedrig/Mittel/Hoch/Ultra) in den Einstellungen;
  reine, getestete Schicht `graphicsQuality.ts`/`graphicsSettings.ts`.
- Vegetationsdichte skaliert je Stufe (Kernvegetation bleibt), striktes
  Schattenbudget, Nahdetail-/Auflösungs-/Tierbudget je Stufe.
- Dev-Performance-Panel (FPS/Draw-Calls/Dreiecke/Vegetations-Instanzen).
- Bereits vorhanden genutzt: InstancedMesh je Proptyp, Pro-Region-Budgets,
  Frustum-Culling. Deep-LOD (HLOD/Impostor/Chunk-Streaming) mit bereitliegender
  `vegetationLodTier`-Funktion zurückgestellt (nur auf Zielhardware messbar).
- Kein Save-Bump. 318 Tests grün, Build + 3D-Smoke über alle Stufen fehlerfrei.

## Final World Compaction & 12-Regionen-Progression — Säule A (v0.76)

- Insel ein zweites Mal horizontal verdichtet (Spannweite 420 → 374, Fläche
  −20,7 %); Gipfelhöhe getrennt 50 → 52. Gebäude/Straßen/Fahrzeuge unskaliert.
- 40 Regionen → **1 zentrale Startregion + 12 bedeutende Freischaltungen**
  (Ø 2 622 bebaubare Kacheln). Preise aus dem Faktormodell `regionCost.ts`,
  gegen `regions.config.ts` getestet.
- Erste Erweiterung ab Level 3 gratis (ohne Geld/XP/Bürgeranliegen);
  Archipel-Regionen verlangen einen aktiven Hafen. Regionsdialog zeigt Gratis-
  und Hafen-/Nachbarschaftszustand.
- Neuer Startpunkt Rathaus (137, 194), kompakter 820-Kachel-Kern.
- **Save-Schema v16**; `v15 → v16` sichert unter `cmb.save.backup.world-v15` und
  startet transparent neu. 310 Tests grün.
- Verbindliche Berichte: `WORLD_COMPACTION_REPORT.md`,
  `REGION_CONSOLIDATION_PLAN.md`.

**Säule B (Vegetations-Performance) ist noch offen** — siehe `OPEN_TASKS.md` und
`WORLD_PERFORMANCE_AUDIT.md`.

## Core Gameplay Overhaul 8.0 — Phase G1 + Zeitvertrag (v0.75)

- Stadtarbeit zählt abgeschlossene Ziele korrekt. Ein leer passiertes Ziel
  bleibt offen und wird nach dem Nachfüllen beim zweiten Kontakt beliefert;
  Lieferziele und Nachfüllstopps werden getrennt ausgewiesen.
- Die Verkehrslast entsteht ab der ersten gezeichneten Kachel aus dem echten
  Straßengraph (`forecastRouteTraffic`), in vier Stufen und mit Zeitverlust.
- Der Abschlussbericht (`ActivityRunResult`) besteht ausschließlich aus echten
  Simulationswerten; nicht zutreffende Kennzahlen entfallen statt „– %".
- Vegetation und Props sind pro Region budgetiert und positionsstabil — ein
  Region-Unlock verändert bestehende Regionen nicht mehr.
- Pause/1×/2×/4× steuern die echte Simulation über `advanceByRealTime`.
  Einnahmen, Verbrauch, Produktion, Wachstum und Bauzeit skalieren zwingend
  gemeinsam; UI, Kamera und Planung bleiben in der Pause bedienbar.
- Fünf Bürgeranliegen nannten pre-×20-Einwohnerzahlen; Texte korrigiert und per
  `tests/questText.test.ts` gegen Rückfall gesichert.
- Save-Schema unverändert **v15**, keine Migration.

Verbindlicher Einstieg für die Weiterarbeit:
`CORE_GAMEPLAY_OVERHAUL_AUDIT.md` → `CORE_GAMEPLAY_OVERHAUL_PLAN.md`.
Phase G2 beginnt zwingend mit dem Terrain-Picking (Audit §2.1).

## Technische Basis

- Natives PC-Spiel mit Tauri, Windows zuerst; Browser nur Entwicklung/Test.
- Einziger Welt-Renderer: Three.js unter `src/renderer/three/`.
- Reine Simulation/Config unter `src/game/`; UI kommuniziert über
  `GameController`-Snapshots, Read-Modelle und Commands.
- Save-Schema **v31**; `v30→v31` ergänzt optional das eingefrorene
  Straßen-Engineering. Alte Straßen bleiben ohne Metadaten gültig. Die früheren
  Welt-Backup-/Neustartgrenzen der linearen Migrationskette bleiben erhalten.
- Designsystem: maritime Navy/Gold-Tokens plus geordnete CSS-Schichten; das
  Stadtarbeit-Redesign liegt isoliert in `styles/citywork-v4.css`.

## Abgeschlossen

- Waterways, Harbors & Infrastructure 7.0: Küstenkegel an der Bake-Ursache
  entfernt und mit Diagnosedaten abgesichert; radialer Fern-Ozean,
  atmosphärischer Abschluss und organische Ferninseln ersetzen die erkennbare
  Weltplatte.
- Regionsnebel und Gameplay-Freischaltung sind getrennt. Der visuelle Dev-Reveal
  zeigt Terrain, Vegetation, Props und Landmarken ohne Save-Mutation; der
  separate Controller-Cheat schaltet nur regulär erschließbare Regionen frei.
- Gebäude sind ohne Straße platzierbar, bleiben aber bis zum Anschluss ohne
  reguläre Simulationswirkung und tragen differenzierte Straßen-/Wasser-/
  Teilnetzmarker.
- Kleiner Anleger und Flusshafen nutzen getrennte Land-/Wasser-Footprints,
  automatische Küstenausrichtung, Tiefenprüfung, prozedurale Fallbacks und
  Drop-in-GLBs.
- 569 Wasser-Nodes und 1.775 landfreie Kanten bilden die geometrische
  Routengrundlage. Controller-Read-Helper, gestrichelte Hafen-Vorschau und das
  optionale Infrastruktur-Overlay projizieren dieselben Daten.
- Keine persistente Schifffahrt und keine Save-Änderung; Schema bleibt **v15**.

- Terrain & World Scale 6.1: Quellinsel pro X/Z-Achse auf 0,8898 verdichtet,
  44.757 Baukacheln (−20 %), Wasserlinie angehoben, 16 garantierte
  5×5-Uferplattformen, zentraler Start in Region 24 und vorbereitete
  Küstenankunft/Versorgungstrasse.
- 2048er Terrainbibliothek mit world-space/triplanarem Splat, ausgewählten
  PBR-Zusatzmaps, Regen-Wetness und nahsichtbegrenztem Mikrogras.
- Zentrale Surface-Abfrage, waagerechte Gebäude mit Fundament, 64 cullbare
  Terrain-Chunks, Tiefenwasser und rein visueller Dev-Reveal.

- Mockup-HUD mit Ressourcen, Stadtstatus, Hauptnavigation, Minimap,
  Bürgeranliegen, Bau-Shop, Gebäudedetail, Regionen, visuellem Wetter und
  Info-Layern.
- 3D-Inselwelt mit Küste/Wasser, Vegetationsclustern, Landmarken, Nebel,
  Wetter-Grading und prozeduralen Fallbacks für fehlende Drop-in-Modelle.
- Kanonische Anliegen-, Gebäudeplatzierungs-, Regions-, Straßenplan- und
  Balancing-Read-Modelle (C2–C7).
- Stadtarbeit: exakte manuelle Straßenkette, Config-Fahrzeuge, automatische
  3D-Ausführung, Ergebniswertung, Cargo/Kapazität, Reservierung, Nachfüllen,
  Leerfahrt und Infrastruktur-Hinweiscodes.

## Regions-Wolkenwand (v0.71)

- Gesperrte Regionen werden oberhalb ihres höchsten Terrainpunkts vollständig
  verdeckt; Gipfel, Landmarken und Biomfarben bleiben bis zur Freischaltung
  verborgen.
- Eine verbreiterte Kontur, drei texturierte Wolkenlagen und ein gedeckeltes
  `InstancedMesh` bilden Decke, Tiefe und atmosphärischen Rand ohne einzelne
  Draw-Calls je Wolke.
- Weltmarker zeigen Schloss, kanonischen Regionsnamen und echtes
  Freischaltlevel. Klicks öffnen den vorhandenen Regionsdialog.
- Die Minimap ersetzt gesperrtes Terrain durch eine Wolkenmaske und zeichnet
  Schloss-/Level-Marker an den gebackenen Regionszentren.
- Historisch rein visuelle Renderer-/HUD-Änderung; der aktuelle Weltbake und
  Schema v15 stammen aus 6.1.

## Map Redesign 5.0 (v0.70)

- Unveränderte Inselkontur, Höhenbake, Regionspolygone und Baufelder; der Umbau
  erweitert ausschließlich den vorhandenen Three-Renderer.
- Zwölf visuelle Biomprofile, in 6.1 auf alle 40 Regionen übertragen, mit weichen
  Nachbarschaftsübergängen und klaren Wüsten-/Sumpfreferenzzonen.
- Zwölf Terrain-Splat-Layer, triplanares Berg-/Klippenmaterial und sechs neue
  KI-generierte Base-Color-Texturen.
- Differenzierte Nadel-/Laubbaumverteilung, trockene und feuchte Props sowie
  neutrale Landmark-Slots mit prozeduralen Fallbacks.
- Bewegteres Ozeanmaterial und eine gebündelte animierte Flussströmungsfläche.
- Keine eigene Biom-Spiellogik; Schemaänderungen stammen ausschließlich aus den
  späteren Weltkoordinatenwechseln.

## Stadtarbeit Redesign 4.0 (v0.69)

- Drei klare Zonen: kompakte/filterbare Missionen, dominante Canvas-Karte,
  Fahrzeug/Cargo + Live-Tour + Bestätigung.
- Kein Werkzeugmodus: Straße zeichnet, freie Fläche/Mittel-/Rechtszug
  verschiebt, Mausrad und +/− zoomen; Leertaste/F/R/Esc und Marker-Doppelklick.
- Kein Planname, kein lokales Speichern/Laden und keine „Letzte Route“.
- Keine starre Zielreihenfolge. `targetOrderOnPath` leitet sie aus der ersten
  tatsächlichen Berührung der Zielanker ab.
- `getActivityRoutePreview` bündelt Route, Reihenfolge, Cargo-Stopps,
  Infrastruktur und Abschlussstatus. `evaluateCargoRoute` erkennt echte
  Quellrückkehr/Nachfüllung und Leerfahrt.
- Stilisierte Top-down-Karte mit echten Terrain-/Gebäude-/Straßendaten,
  Verkehr, Regionsgrenzen, Schatten, Routenglow, Pfeilen und Etappenfarben.
- Portrait-Berater für vorhandene Warncodes; keine erfundene Detailposition.
- Acht Fahrmissionen; v0.69 ergänzt Trinkwasser, Marktnachschub und
  Grünflächenversorgung als reine Config-Einträge.
- 20 generierte transparente UI-PNGs für Marker, Ladung, Berater und
  Missionsdioramen; sieben Drop-in-Ordner sind dokumentiert.
- Responsive Regeln für 1280×720 und 1920×1080: lokale Scroller, kompakte
  720p-Darstellung, erweiterte 1080p-Hierarchie, mindestens 12 px Schrift.

## Kanonische Stadtarbeit-Verträge

- Planung: `getActivityPlanningContext`, `getActivitySupplySources`,
  `getActivityDeliveryTargets`, `getAvailableActivityVehicles`,
  `getActivityRoutePreview`, `getActivityInfrastructureWarnings`.
- Start: `startActivity` / `setActiveActivityRoute` mit `{vehicle, roadPath}`.
- Laufzeit: `getActivityExecutionSnapshot`, `progressActivity`,
  `cancelActivity`.
- Persistiert: `ActiveActivity.vehicle`, `plannedRoadPath`, `reserved`.
- Prognose bleibt Prognose: `rewardMultiplier` beeinflusst die Auszahlung nicht.

## Bewusst nicht vorgetäuscht

- Mehrere auswählbare Quellen, Zwischenlager, Rückwaren, Depot-Rückkehr,
  optionale Stopps, Fahrzeugwechsel und mehrere Fahrzeuge brauchen kanonische
  Plan-Legs und Commands.
- Quellbestand ist global; es gibt keine erfundene gebäudeeigene Lagerhaltung
  oder Ladegeschwindigkeit.
- `InfrastructureWarning` besitzt keine `roadPoint`/`segmentId`; der Berater
  fokussiert deshalb die gesamte Tour.
- Straßensteigung und Fahrbahnhöhe sind seit v1.31 kanonische, persistierte
  Game-Daten; Stadtarbeit und Verkehrswertung lesen sie noch nicht. Straßenbelag/
  -zustand, Sperrungen, dynamischer Stau, Kraftstoff, Fahrzeugschaden und
  spielerisches Wetter fehlen weiterhin als Game-Daten.
- Zug/Flug bleiben `future:true`, bis Schiene/Flughafen vollständiges Gameplay
  und ggf. Migration besitzen.

## Prüfung und Einstieg

Die finale Matrix des aktuellen Arbeitsstands steht im jüngsten Abschnitt von
`HANDOFF_LOG.md`. Danach lesen: `docs/HANDOFF_CLAUDE.md`, `OPEN_TASKS.md`,
`UI_COMPONENT_MAP.md` und `UI_ASSET_MANIFEST.md`.

Wichtige Einstiegspunkte: `src/App.tsx`, `src/components/panels/`,
`src/components/citywork/`, `src/styles/`, `src/game/commands/controller.ts`,
`src/game/activities/`, `src/renderer/three/ThreeMapRenderer.ts` und
`src/assets/registry.ts`.
