# Entscheidungen

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
