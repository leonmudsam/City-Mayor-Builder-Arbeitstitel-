# Smart Road Planning – kanonisches Vorschau- und Profilsystem

Stand: 1. August 2026

## Produktiver Ablauf

Der Spieler wählt im Baushop genau ein Werkzeug: `road`. Die historische
Definition `road_elevated` bleibt für alte Saves und bestehende API-Tests ladbar,
ist aber kein auswählbarer Straßentyp mehr.

Klicks und Drag-Punkte sammeln ausschließlich `roadPlanPath` im UI-Store. Sie
schreiben weder Gebäude noch Kosten in den Spielzustand. Der Controller verbindet
diese Kontrollpunkte über `routeRoadWaypoints` zu einem lückenlosen,
terrainbewussten Pfad und liefert über `roadPathPreview` die vollständige
Vorschau. Erst der Primärbutton oder `Enter` ruft `buildRoadPath` auf.

## Kanonischer Preview-Vertrag

`RoadPlanPreview` aus `src/game/roads/roadPlanning.ts` ist die gemeinsame
Datenquelle für HUD, 3D-Vorschau und Bestätigung. Jede `RoadPlanTile` enthält:

- Position, Terrain und Region,
- Status `ok`/`bridge`/`exists`/`blocked` samt echtem Platzierungsgrund,
- automatisch gewählte Variante `flat`/`slope`/`pass`/`support`/`viaduct`/
  `bridge`/`coast`,
- Terrainhöhe, geplante Fahrbahnhöhe, Steigung und Freiraum,
- die tatsächlich beim Bau fälligen Geld- und Materialkosten.

Die Route enthält zusätzlich genau ein `RoadHeightProfile`:

- Länge in Metern (`1 Kachel = 4 m`),
- vorzeichenbehaftete Höhendifferenz,
- maximale und mittlere Steigung,
- minimale/maximale Deckhöhe,
- Variantenanzahl, dominante Variante und Anzahl der Kehren,
- `feasible` für tragfähige Landanker und höchstens 8 % Längsneigung.

Ein zu kurzer Pfad oder ungeeignete Anker erscheinen über `profileError` als
unbaubar. UI und Renderer klassifizieren weder Varianten noch Höhen erneut.

## Automatische Trasse

Das Routing gewichtet vorhandene Straßen, Land, Steigung und konstruktive
Querungen. Reicht die direkte Weglänge für den Höhenunterschied nicht aus,
erzeugt es deterministisch abwechselnde Kehren-Kontrollpunkte und prüft die
resultierende Trasse erneut gegen dasselbe Höhenprofil. Findet es keinen
zulässigen Korridor, bleibt die direkte Trasse als rote, ehrliche Vorschau
sichtbar; es wird keine Straße über 8 % heimlich gebaut.

Wasser wird zwischen Landankern als Brücke gespannt. Klippe oder großer Freiraum
erzeugen ein Viadukt, kleinere Freiräume eine Stützstraße; Küste, Hang und
Passkehren erhalten ihre eigenen Varianten. Die Zuschläge stehen
datengetrieben in `BuildingDef.road.variantCostPerTile`.

## HUD und Renderer

`SmartRoadPlannerHud` zeigt Start/Ziel, das gemeinsame Gelände-/Fahrbahnprofil,
Länge, Höhendifferenz, maximale und mittlere Steigung, vorkommende Varianten und
alle benötigten Ressourcen. Der Adapter kann eine bereits berechnete Vorschau
übernehmen, damit das HUD dieselbe teure Projektion nicht doppelt ausführt.

`setRoadPlanOverlay` erhält pro Segment dieselben Höhen- und Variantendaten. Die
instanzierten Vorschaukacheln liegen auf `roadHeight`, folgen dem Profilwinkel und
nutzen Variantenfarben; die weiße Mittellinie liest dieselben Deckpunkte.

## Atomare Command-Grenze

`GameController.buildRoadPath` ist ein echter Bulk-Command:

1. mindestens zwei Kontrollpunkte und mindestens zwei geroutete Kacheln,
2. vollständige Preview-/Anker-/Profilprüfung,
3. einmalige Prüfung und Abbuchung von `preview.totalCost`,
4. Anlage aller neuen Abschnitte ohne Zwischen-Recompute,
5. genau eine abgeleitete Neuberechnung und Zustandsbenachrichtigung.

Bereits vorhandene Straßen werden kostenlos übersprungen. Jeder neue Abschnitt
speichert seit Schema v31 sein `roadEngineering` mit Variante, Terrain-/Deckhöhe,
Steigung, Freiraum, gemeinsamer `routeId` und Reihenfolge. Dadurch bleiben
Fahrbahn, Stützen und Fahrzeuge nach dem Speichern stabil; alte Straßen ohne das
optionale Feld nutzen den kompatiblen Terrain-Fallback.

## Angrenzender Fundamentvertrag

Gebäudeplatzierung nutzt parallel `foundationPlanForSurface` aus
`src/game/buildings/foundation.ts`. Der reine `FoundationPlan` klassifiziert
`BUILDABLE_FLAT`, `BUILDABLE_SLOPE`, `BUILDABLE_TERRACE`, `WATER_EDGE` und
`CLIFF` und liefert Fundamentart, Stütztiefe, Stufen, Zusatzkosten und Bauzeit.
`placementDiagnostics`, `placeBuilding`, Ghost und fertiger Renderer lesen
dieselbe Projektion. Die Klassifikation ersetzt nicht `validatePlacement`:
gesperrte, belegte oder konstruktiv unzulässige Flächen bleiben unbaubar.

## Bewusst noch offen

- frei ziehbare Kontrollpunkt-Griffe; `SmartRoadPlanView.controlPoints` bleibt
  derzeit leer,
- flüchtige Live-Endpunktvorschau statt der heute gesammelten Drag-Punkte,
- echte Alternativrouten und manuelle Höhenvorgaben,
- Abrissbedarf, Tunnel/Portale, Straßenzustand, Sperrungen und dynamischer Verkehr,
- spielmechanische Durchfahrtshöhen und Schiffsklassen.

Diese Werte dürfen weder im HUD noch im Renderer erfunden werden.

## Regressionsschutz

- `tests/roadProfile.test.ts`: 8-%-Grenze, ehrliche Unbaubarkeit, Wasserprofil,
  Passklassifikation und deterministische Kehren.
- `tests/roadRouting.test.ts`: lückenloses Routing, automatische Brücke,
  Serpentinen und Vorschau-/Kostenparität.
- `tests/roadOverhaul.test.ts`: ein Bulk-Commit, eine Benachrichtigung,
  persistiertes Engineering und Ein-Punkt-Ablehnung.
- `tests/foundation.test.ts`: alle Fundamentklassen sowie identische
  Vorschau-/Command-Kosten und Bauzeit auf echtem Inselterrain.
