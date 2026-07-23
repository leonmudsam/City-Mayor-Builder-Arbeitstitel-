# Entscheidungen

## D-032 — Lagertransport (A5) als vereinfachte Operation im bestehenden Logistiksystem

**Entscheidung:** Der manuelle Transport vom lokalen Betriebslager ins
Zentrallager ist eine eigene, additive Datenstruktur (`operations.transfers`,
Save v18) mit der Zustandsmaschine `loading → in_transit → unloading →
delivered`, gefahren von `advanceTransfers` im Live-Tick. Route/Distanz/Verkehr/
Fahrzeit kommen aus `activities/routeAnalysis.ts`, die Fahrzeugkapazität aus
`activities/logistics.ts` — **kein zweites Logistiksystem** (§8). Ziel ist ein
beliebiges Lagergebäude (Rathaus/Lagerhaus) als physischer Anlieferpunkt; die
Einlagerung schreibt in den **globalen Pool** (`state.resources`), gedeckelt
durch `derived.storageCaps`.

**Grund:** §7.2/§8 verlangen, dass lokal geerntete Ware erst über echten
Transport global nutzbar wird und dass dafür die vorhandenen Modelle
wiederverwendet werden. Ein eigener, schlanker Transfer-Datensatz (nur Skalare
persistiert; Polyline deterministisch rekonstruiert) hält den Save winzig und
alte Saves ladbar. Die globale Pool-Einlagerung statt eines separaten
Lagerhaus-Puffers ist der kürzeste ehrliche Weg, den Loop zu schließen, ohne die
bestehende Ökonomie umzubauen.

**Konsequenz:** `stats.produced` wird beim Transport **nicht** erneut erhöht (die
Ware wurde beim Fällen gezählt — kein Doppelzählen). Ein Transport bewegt genau
eine Fahrzeugladung; ist das Lager größer, warnt die UI und der Spieler wiederholt
den Transport (Mehrfachladungen/Nachfüllfahrten sind A10). Rückruf nur während
`loading`. Zwischenlager-Lagerhäuser als eigene lokale Puffer bleiben offen.
Details: `docs/agents/LOGISTICS_INTEGRATION.md`.

## D-031 — Aktive Betriebe: Passiv→Aktiv config-gated, Sägewerk zuerst, Holz bleibt lokal

**Entscheidung:** Ein Gebäude mit `BuildingDef.operation` ist ein aktiver Betrieb;
sein passiver `produce`-Pfad wird in Tick **und** Derived übersprungen, die
Produktion entsteht über Arbeiter + Ressourcenknoten und landet im **lokalen
Betriebslager**. Vorerst erhält **nur das Sägewerk** dieses Profil; geerntetes Holz
wird **nicht** automatisch global gutgeschrieben — der Transport ins Zentrallager
ist Phase A5. Ressourcenknoten (Bäume) sind deterministisch aus Wald-Kacheln
abgeleitet, nur Deltas werden persistiert (Save v17, additiv). Betroffene
Passiv-Produktionstests wurden auf den weiterhin passiven Steinbruch umgestellt.

**Grund:** Der Auftrag verlangt einen aktiven Loop und schreibt ausdrücklich vor,
„ausschließlich mit dem Sägewerk als vertikalem Referenzschnitt" zu beginnen (§27)
und lokal gebundene Ware nicht magisch überall verfügbar zu machen (§7.2/§8). Die
Config-Gate-Lösung lokalisiert die Verhaltensänderung exakt auf das Sägewerk und
hält die Gesamtbalance + die grüne Testsuite stabil. Der additive Save + die
deterministische Knoten-Ableitung folgen der bestehenden Slim-Save-Philosophie
(alte Saves bleiben ladbar, globale Ressourcen bleiben Zentral-/Übergangsbestand).

**Konsequenz:** Sägewerkholz ist bis A5 lokal gebunden (gewollte Logistik-Reibung).
`stats.produced.wood` wächst beim Einlagern (Quests bleiben stimmig). Der Transport
(A5) muss `activities/logistics.ts` + `routeAnalysis.ts` wiederverwenden — kein
zweites Logistiksystem (§8). Details: `docs/agents/ACTIVE_OPERATIONS_PLAN.md`.

## D-030 — Vegetations-Performance über einstellbare Qualitätsprofile, Dichte bleibt hoch

**Entscheidung:** Die Vegetations-Performance wird über vier persistierte
Qualitätsstufen (`graphicsQuality.ts`) gesteuert, die Dichte, Sichtweiten,
LOD-Grenzen, Schatten- und Tierbudget als konkrete Zahlen definieren. Der Renderer
liest das aktive Profil; ein Wechsel baut nur die Vegetationsgruppe neu auf.

**Grund:** Der Auftrag verlangt hohe Vegetationsdichte bei vereinfachter
FERN-Repräsentation und verbietet „Optimierung nach Gefühl". Konkrete,
getestete Profile + ein Dev-Performance-Panel machen jede Änderung messbar.

**Folge:** „Niedrig" halbiert die Dichte höchstens (Kernvegetation bleibt),
Schatten sind dort ganz aus. Die reine LOD-Funktion `vegetationLodTier` liegt für
HLOD/Impostor/Chunk-Streaming bereit; deren GPU-seitige Umsetzung ist bewusst
zurückgestellt (nur auf Zielhardware seriös messbar). Der Nebel-Cheat erzwingt
keine Maximalqualität.

## D-027 — Zweite Verdichtung getrennt in X/Z und Y, Baueinheiten fix

**Entscheidung:** Die zweite Verkleinerung skaliert nur die horizontale
Quellspannweite (420 → 374, Faktor 0,8905) und hebt die Gipfelhöhe getrennt sogar
leicht an (50 → 52). Gebäude, Straßen und Fahrzeuge werden **nicht** mitskaliert.

**Grund:** Der Auftrag verbietet ausdrücklich X=0,8·Z=0,8 (−36 %) und ein erneutes
proportionales Abflachen der Gebirge. 1 Kachel = 1 Welteinheit muss fix bleiben,
sonst bräuchten alle Footprints, Radien und Fahrzeugmaße neue Kalibrierung.

**Folge:** Fläche −20,7 % bei erhaltener Gebirgsdominanz. Voller Offline-Rebake;
die GLB bleibt Laufzeit-fern.

## D-028 — 13 bedeutende Regionen statt §3.1-Bauflächenkorridor

**Entscheidung:** Bei einem echten Konflikt zwischen §3.1 (1 800–2 800 Kacheln
nach zwei Erweiterungen) und §4 (nur zwölf Regionen) hat die **Regionsstruktur**
Vorrang. Ø 2 622 bebaubare Kacheln je Region; Start + 2 Erweiterungen ≈ 6 400.

**Grund:** 34 082 bebaubare Kacheln auf 12 Regionen ergeben rechnerisch ~2 772 je
Region; der 1 800–2 800-Korridor bräuchte 35–40 Kleinregionen — genau die
Zersplitterung, die §4 abschafft.

**Folge:** Startregion bewusst als kompakter 820-Kachel-Kern ausgeschnitten, damit
die erste echte Erweiterung trotzdem groß wirkt. Dokumentiert in
`WORLD_COMPACTION_REPORT.md`.

## D-029 — Archipel-Erschließung über echten Hafen, kein Fährsystem

**Entscheidung:** Regionen ohne Landanschluss werden über die gebackene
`seaAdjacent`-Nachbarschaft plus einen aktiven Hafen (`dock_small`/`river_port`)
in einer erschlossenen Region freigeschaltet (`regionUnlockBlocker`).

**Grund:** Die verdichtete Quellinsel ist ein Archipel; ohne Seeregel wären 8 der
12 Freischaltungen dauerhaft unerreichbar. Ein neues Fähr-/Schifffahrtssystem
verstößt gegen „erweitern statt neu bauen" — die Hafengebäude existieren bereits.

**Folge:** Der Regionsdialog benennt `needs_harbor`/`not_adjacent` ehrlich. Die
erste Erweiterung ab L3 ist gratis und ohne XP/Bürgeranliegen (reine
Progressionsgeste).

## D-023 — Ein Lieferziel gilt erst als erledigt, wenn es beliefert wurde

**Entscheidung:** `evaluateCargoRoute` merkt sich ausschließlich **erledigte**
Ziele. Ein Kontakt mit zu wenig Ladung schließt ein Ziel nicht ab, sondern wird
als `skipped`-Stopp dokumentiert; jeder spätere Kontakt zählt erneut.

**Grund:** Die frühere „erster Kontakt gewinnt"-Regel machte eine korrekt
gefahrene Tour unabschließbar, sobald der Spieler leer an einem Ziel
vorbeifuhr, nachfüllte und zurückkam — der gemeldete „4/5 Stopps"-Fehler.

**Folge:** Lieferziele, Nachfüllstopps und eine spätere Rückkehr werden über
`ActivityProgress` **getrennt** gezählt und nie in einer Zahl vermischt.
`returnRequired` ist heute ehrlich immer `false`, weil das Missionsmodell keine
Pflichtrückkehr kennt.

## D-024 — Fehlende Kennzahlen werden weggelassen, nicht als „–" gezeigt

**Entscheidung:** Der Abschlussbericht `ActivityRunResult` führt jede Kennzahl
optional. Fehlt sie, weil es sie für den Auftragstyp nicht gibt (eine Inspektion
hat keine Strecke), entfällt die Zeile im Popup vollständig.

**Grund:** Ein Platzhalter wie „– %" sieht aus wie ein Fehler und lässt offen,
ob der Wert fehlt oder null ist. Weglassen ist die ehrlichere Aussage.

## D-025 — Simulationsgeschwindigkeit ist ein Zeitfaktor, keine Ertragsschraube

**Entscheidung:** `advanceByRealTime(realDeltaMs, live)` rechnet reale Zeit ×
`SimulationSpeed` (0/1/2/4) in Simulationszeit um und schickt sie durch denselben
einen Tick-Pfad. Pause bedeutet: es vergeht keine Simulationszeit.

**Grund:** Nur so können Einnahmen, Verbrauch, Produktion, Wachstum und Bauzeit
strukturell nicht auseinanderlaufen. Ein System, das nur die Einnahmen
beschleunigt, ist damit gar nicht erst baubar.

**Folge:** Die Geschwindigkeit ist eine Sitzungseinstellung und bewusst **nicht**
im Save (kein Schema-Bump). `meta.lastSimTime` ist dadurch absichtlich von der
Wanduhr entkoppelt; jedes zeitabhängige System rechnet ohnehin gegen diese Uhr.
Im Renderer trennt `simDt = dt × speed` die Weltanimation von Kamera und
Eingabe, damit die Oberfläche in der Pause bedienbar bleibt.

## D-026 — Vegetationsbudgets gelten pro Region, nie über die ganze Welt

**Entscheidung:** Prop-Deckelung erfolgt je Region und Proptyp über einen
Positions-Hash (`selectPropTiles`), nicht über den Arrayindex einer weltweiten
Kachelliste.

**Grund:** Die indexbasierte Deckelung koppelte die Auswahl an die Listenlänge.
Ein Region-Unlock verschob die Schrittweite und ließ Bäume in längst sichtbaren
Regionen verschwinden — genau das verbietet der Auftrag (§16: Auswahl nur aus
Seed, Region, Terrain, Position, Biomprofil).

**Folge:** Die Gesamtinstanzzahl wächst mit der Zahl freigeschalteter Regionen.
Draw-Calls bleiben konstant (`InstancedMesh` je Proptyp); der Vollinsel-Reveal
muss auf Zielhardware vermessen werden, bevor `REGION_PROP_BUDGET` steigt.

## D-020 — Infrastrukturanschluss ist Betriebszustand, keine Platzierungssperre

**Entscheidung:** Gültige Gebäude dürfen ohne Straße existieren. Anschluss wird
aus dem bestehenden Straßen- und Wassergraphen abgeleitet; nur `connected`
trägt volle Simulationswirkung. Häfen können `water_only` beziehungsweise
`road_only` sein.

**Grund:** Der Spieler soll neue Siedlungskerne vorbereiten und Netze danach
heranführen können. Eine UI-Sonderregel oder zweite Simulation würde denselben
Zustand doppelt führen.

## D-021 — Wassergraph und Routenvorschau bleiben abgeleitet

**Entscheidung:** Der Bake exportiert ausschließlich nachweislich wassergebundene
Kanten. `ShippingRoutePreview` ist ein Controller-Read-Modell und wird nicht
persistiert.

**Folge:** Das Overlay kann keine Linie durch Land erfinden. Aktive Routen,
Schiffe, Kosten und Kapazitäten erfordern später ein kanonisches Game-/Save-
Modell mit Migration.

## D-022 — Visuelle Weltaufdeckung ist kein Unlock

**Entscheidung:** `fogDisabled`/`revealLockedRegionsVisually` liegen im UI-/
Rendererpfad. Nur `debugUnlockAllRegions` mutiert die Regionstates und lässt
nicht erschließbare Teaserregionen gesperrt.

**Folge:** Vegetation und Props können für Visual Audits sichtbar sein, ohne
Progression, Save oder Interaktion zu verändern.

## D-001 — Ein Renderer

**Entscheidung:** Three.js bleibt der einzige aktive Renderer.  
**Folge:** Minimap und Routenplaner sind leichte Canvas-Projektionen, keine
alternativen Spielrenderer.

## D-002 — Ein primäres Sheet

**Entscheidung:** Panel, Gebäudedetail, Regionsdialog und Routenplaner schließen
einander. Das Bürgerdetail folgt derselben Regel.  
**Grund:** Mockup-Hierarchie, Spielwelt bleibt sichtbar, keine Überlappung.

## D-003 — Vertikale Hauptnavigation

**Entscheidung:** Die Hauptziele stehen links als kompakte vertikale Leiste.  
**Grund:** Das zuletzt übermittelte Master-Mockup ist die jüngste verbindliche
Referenz und zeigt die Welt freier als die frühere untere Navigation.

## D-004 — 12 px Mindestschrift

**Entscheidung:** Keine UI-Schrift unter 12 px.  
**Folge:** Bei Platzmangel werden sekundäre Inhalte ausgeblendet oder Fenster
scrollen; Text wird nicht weiter verkleinert.

## D-005 — Tagesgeschwindigkeit ist visuell

**Entscheidung:** Pause/1x/2x/4x steuern nur den Tageslichtzyklus.  
**Grund:** Es existiert noch keine autorisierte Simulationsgeschwindigkeit.

## D-006 — Stadtarbeit erweitert bestehende Aktivität

**Entscheidung:** Planung liefert Zielreihenfolge an denselben
Aktivitäts-Command und denselben Fortschritt.  
**Verworfen:** paralleles Routenquest-/Belohnungssystem.

## D-007 — Verkehrswerte bleiben als Schätzung gekennzeichnet

**Entscheidung:** Aktuelle Farben/Prognosen sind reine UI-Schätzung mit
`TODO(CLAUDE_LOGIC)`.  
**Folge:** Keine Belohnung oder Save-Entscheidung darf sie als Wahrheit nutzen.

## D-008 — KI-Assets nur mit Fallback

**Entscheidung:** Wappen, Wolken, Regions-Hero und Landmarken werden über die
Drop-in-Registries geladen.  
**Folge:** Löschen oder Fehlen einer Datei darf weder Boot noch Gameplay brechen.

## D-009 — Info-Layer ist Präsentation

**Entscheidung:** Probleme, Bedürfnisse, Upgrades und Produktion werden im
UI-Store gefiltert und aus vorhandenen Renderer-/Controller-Daten dargestellt.
**Folge:** Ein Layer darf niemals Produktion, Bedarf, Questfortschritt oder Save
beeinflussen.

## D-010 — Mockup ist keine Regelspezifikation

**Entscheidung:** Visuelle Elemente aus Mockups werden nur mit kanonischen Daten
aktiv. Fehlende Kartenpositionen und Regionsvorschauen bleiben deaktiviert bzw.
als Skeleton/TODO gekennzeichnet.
**Verworfen:** erfundene Prioritäten, Radien, Gebäude-Freischaltungen oder
Verkehrswerte, nur damit ein Mockup vollständig aussieht.

## D-011 — Wetter-Presets sind Renderer-Präsentation

**Entscheidung:** Sonne, Regen und Nebel werden in `environmentSettings`
gespeichert und ausschließlich von `SkyEnvironment` dargestellt.
**Folge:** Keine Wirtschafts-, Bedarfs-, Quest-, Verkehrs- oder Save-Wirkung.
Spielerisches Wetter braucht später eine eigene Regelentscheidung und Tests.

## D-013 — Routenanalyse ist kanonische Prognose, keine Auszahlung

**Entscheidung:** `analyseActivityRoute` liefert die Verkehrs-/Effizienzwerte des
Planers aus dem echten Straßengraphen. Die tatsächliche Belohnung entscheidet
weiterhin die Ausführungsqualität (Fahrzeit gegen Zeitlimit).
**Grund:** Reihenfolge-/Netzgüte soll sichtbar wirken, ohne die Balance aus der
Planungs-UI heraus zu verschieben. Ersetzt D-007 (Schätzung) für die
Anzeigewerte.
**Verworfen:** `rewardMultiplier` sofort an die Auszahlung koppeln — das ist eine
spätere Balancing-Entscheidung (Phase C7) mit Gesamt-Simulation.

## D-014 — Handroute ist persistierter Teil derselben Aktivität

**Entscheidung:** Eine Fahrmission speichert optional `vehicle` und
`plannedRoadPath` in `ActiveActivity`. Der Pfad besteht aus orthogonal
zusammenhängenden Straßenkacheln und wird am Controller-Rand vollständig
validiert.

**Grund:** Die neuen Mockups verlangen echte manuelle Planung und automatische
3D-Ausführung. Ein rein lokaler UI-Pfad würde beim Schließen/Neuladen verloren
gehen; ein zweites Missionssystem würde D-006 verletzen.

**Folge:** Save v12 mit linearer `11→12`-Migration. Alte Missionen besitzen die
optionalen Felder nicht und verwenden unverändert die frühere Wegfindung.

**Verworfen:** automatische Lückenfüllung zwischen Klicks, UI-erfundene
Steigungs-/Straßenzustandswerte und eine parallele Routenbelohnung.

## D-015 — Ladung ist Transportvolumen, Quelle ist ein räumlicher Anker

**Entscheidung:** Stadtarbeit-Logik 2.0 führt `cargoModel` als transportiertes
Volumen ein (füllt das Fahrzeug, erzwingt Nachladen), getrennt vom
Ökonomie-Verbrauch `costPerTarget`. Da es keine gebäudeeigene Lagerhaltung gibt,
ist eine „Quelle" nur ein räumlicher Anker (Farm/Markt/Lager); der Bestand bleibt
der globale Pool.

**Grund:** §2 des Auftrags verlangt, dass Kapazität wirkt, ohne eine komplette
Gebäude-Inventar-Schicht (großes Datenmodell + Save-Risiko) einzuführen. Der
globale Pool ist die bestehende Wahrheit; ein Anker genügt für Route und Etappen.

**Folge:** L2 ist reine Planungs-/Prognoseschicht (`activities/logistics.ts`,
`getActivityCargoPlan`) ohne Save-/Auszahlungs-/Ökonomieänderung (Schema v12).
Pool-Reservierung und reale Entnahme an der Quelle folgen in L3 (Save v13).

**Verworfen:** ein `inventory` je `BuildingInstance`; sofortige Kopplung von
`cargoModel` an den Live-Verbrauch (verschöbe die `activeplay`-Balance vor dem
Balancingtest in L5).

## D-016 — Ladung wird upfront an der Quelle reserviert, Verbrauch bleibt netto gleich

**Entscheidung:** Eine Ladungsmission (`costPerTarget`) entnimmt beim Start die
volle Menge `costPerTarget × Ziele` aus dem globalen Pool und hält sie in
`ActiveActivity.reserved`. Auslieferungen ziehen daraus; Abbruch gibt den Rest
zurück (gedeckelt durch die Lagerkapazität). Reicht der Vorrat nicht, startet die
Mission nicht.

**Grund:** §4/§5 verlangen reale Entnahme an der Quelle und Schutz vor
Doppelnutzung. Weil die Ware sofort den Pool verlässt, sehen Handel/Bau sie nicht
mehr — Reservierung ohne einen ökonomieweiten Umbau von `canAfford`.

**Folge:** Verbrauch **netto identisch** zum alten Pfad (nur Zeitpunkt: Start
statt pro Ziel) → kein Balancing-Eingriff. Save v13 mit Migration `12→13`;
Alt-Missionen ohne `reserved` nutzen den bisherigen Pool-Pfad.

**Verworfen:** eine „weiche" Reservierung, die den Pool erst bei Auslieferung
belastet (schützt nicht vor Doppelnutzung); Verbrauch nach `cargoModel`-Volumen
statt `costPerTarget` (verschöbe die Balance vor dem L5-Test).

## D-017 — Logistik-Bewertung ist zweischichtig: Prognose + konkrete Fahrt

**Entscheidung:** L4 liefert zwei reine, deterministische Read-Bewertungen.
`evaluateInfrastructure` ist die **planungsseitige Prognose** (vor/ohne
gezeichneten Pfad): Leerfahrtanteil aus den Nachlade-Rückfahrten der Cargo-
Etappen, Fahrzeugeignung (Kapazität vs. Bedarf, Handling in engen/vollen
Straßen), Quellenlage, Geradheit, Lade-/Entladezeiten in der Gesamtdauer,
Verderbrisiko und textfreie Hinweiscodes. `evaluateCargoRoute` ist die
**konkrete Auswertung eines bereits gezeichneten Pfades**: sie erkennt echte
Quell-/Nachladekontakte entlang der Kette und misst die tatsächlich leer
gefahrenen Kacheln.

**Grund:** §19 verlangt den Leerfahrtanteil als Kernbewertung. Die Planungs-UI
braucht ihn schon **vor** dem Zeichnen (Prognose), die Ausführungs-/Kontroll-UI
**nach** dem Zeichnen (Ist-Wert). Beide teilen dieselben Cargo-/Routendaten,
bleiben aber getrennt, damit keine erfundene Geometrie in die Prognose fließt.

**Folge:** Fahrzeugeignung kommt als **optionale** Config an
`ActivityVehicleDef` (`loadTimeSec`, `unloadTimeSecPerTarget`,
`narrowStreetPenalty`, `cooling`) — nur Bewertung liest sie, **kein Save-Bump**.
Read-Helper `getActivityInfrastructure`, `getActivityInfrastructureWarnings`,
`getActivityCargoRoute`.

**Verworfen:** Kopplung des Leerfahrtanteils/der Eignung an die Auszahlung
(bleibt Anzeige, D-013); eine einzige Bewertung, die aus dem gezeichneten Pfad
auch die Prognose ableitet (verwischt Soll/Ist und erzwingt einen Pfad, bevor
der Spieler plant).

## D-018 — Spontane Stadtarbeit speichert keine Standardroute

**Entscheidung:** Der unbestätigte Plan bleibt lokaler UI-Draft. Planname,
`localStorage`-Speichern/Laden und „Letzte Route“ sind entfernt. Erst der
bestätigte `{vehicle, roadPath}`-Plan wird über den bestehenden Command in der
laufenden Aktivität persistiert.

**Grund:** Ziele, Quelle, Warenmenge, Fahrzeug, Verkehr und Nachfüllbedarf ändern
sich pro Auftrag. Eine wiederverwendete ideale Strecke würde die eigentliche
Planungsentscheidung umgehen. Dauerhafte Handelslinien wären ein separates,
bewusstes Gameplay-System.

**Folge:** Kein neuer Save-State und kein Schema-Bump (v13 bleibt). Öffnen oder
Wechseln einer Mission startet einen auftragsbezogenen frischen Draft.

**Verworfen:** automatische Wiederverwendung einer früheren Route; separates
persistiertes Planarchiv innerhalb spontaner Stadtarbeit.

## D-019 — Reihenfolge entsteht aus der Straße, nicht aus einer UI-Liste

**Entscheidung:** `targetOrderOnPath` leitet die Reihenfolge deterministisch aus
der ersten tatsächlichen Berührung jedes Straßenankers ab. `ActivityRoutePreview`
ist die gebündelte Wahrheit für Reihenfolge, Cargo-Stopps, Analyse und Abschluss.

**Grund:** Die Route ist die spielerische Entscheidung. Eine zusätzliche
Drag-&-Drop-Liste erzeugt zwei konkurrierende Wahrheiten und technischen
Bedienaufwand.

**Folge:** React hält keine Zielsortierung. Eine Route kann nur bestätigt werden,
wenn der Controller alle Pflichtziele lückenlos und cargo-gültig erkennt.

**Verworfen:** Zielnummern vor dem Zeichnen; stilles Auto-Routing; lokale
Reihenfolgeheuristik im Canvas.

## D-012 — Großer Baushop ist ein Breakpoint, kein zweites UI-System

**Entscheidung:** Ab 1680×860 dockt dieselbe `BuildMenu`-Komponente vollhoch
rechts; darunter bleibt sie als Bodenleiste.
**Grund:** Die Premium-Mockups nutzen PC-Fläche, ohne doppelte Logik oder
abweichende Datenquellen einzuführen.
