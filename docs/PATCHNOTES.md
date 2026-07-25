# Patch Notes

## v1.10 — Active Simplicity / AS-1+AS-2: Die Stadt liefert selbst (Save v24)

> **Neue oberste Designregel (D-039): Der Spieler entscheidet. Die Stadt arbeitet.**
> Jede Aktion, die man mehr als drei Mal hintereinander machen muss, wird
> automatisiert oder durch ein Regelwerk ersetzt.

### Was

- **Sägewerk bauen, Arbeitsgebiet starten — fertig.** Der Betrieb holt seine Ware ab
  jetzt **selbst** ab: Ziel-Lager, Fahrzeug, Route und Nachfüllen entscheidet das
  Spiel. Die Schleife „Transport planen → Lager wählen → Route wählen → Fahrzeug
  wählen → starten → erneut starten" entfällt vollständig.
- **Automatik ist der Normalfall** — auch in bestehenden Spielständen. Wer sie für
  einen Betrieb nicht will, schaltet sie dort ab.
- **Warnungen statt Aufgaben:** Fließt nichts, sagt das Spiel *warum* — kein Fahrzeug,
  kein Lagerplatz, keine Straßenverbindung, kein Ziel. Kein stiller Stillstand.

### Warum

- Das Spiel driftete Richtung Logistikmanager statt Bürgermeister. **Ehrlich:** die
  Phasen R3/R4/R5 dieser Runde haben den Drift verstärkt — jedes Feature für sich
  korrekt, zusammen aber Mikromanagement. Diese Version dreht die Richtung.

### Architektur

- Neues reines Sim-Modul `src/game/operations/autoLogistics.ts` (kein Renderer/React).
- **Kein zweites Transportsystem (§2/§8):** Das Modul **erteilt nur Aufträge** an den
  bestehenden `createInventoryTransfer` und nutzt dessen Ziel-, Routen- und
  Fahrzeuglogik unverändert. Es rechnet nichts eigenes.
- **Zielwahl deterministisch:** nächstes erreichbares Lager (kürzeste Route, bei
  Gleichstand kleinere Id). **Fahrzeugwahl:** größte freigeschaltete Kapazität;
  Schiffe bleiben den Schiffsrouten vorbehalten.
- **Abholschwelle bewusst bei 60 %,** nicht 100 %: Ein Betrieb stoppt bei vollem Lager
  (§26.8) — die Abholung muss vorher anlaufen, sonst steht er trotz Automatik still.
- **Nie zwei Fahrten je Betrieb gleichzeitig** (per Test abgesichert).
- **Save v24** mit **linearer Migration v23→v24**: `operations.autoTransport` ist
  optional, **fehlender Eintrag = an**. Alte Stände bekommen die Automatik geschenkt.

### Auswirkung

- `tsc` · ESLint · **444 Vitest grün** (+7) · Vite-Build. Kein Bestandstest bricht —
  die Automatik ergänzt den vorhandenen Transportpfad, sie ersetzt ihn nicht.

### Zukunft — die Umbaustrecke steht

`docs/agents/ACTIVE_SIMPLICITY_PLAN.md` (D-039) führt AS-3…AS-9: Gebäudefenster
entschlacken, Regeln statt Befehle, ruhigere Ressourcenanzeige, Stadtarbeit nur noch
für Ereignisse, Straßenbau A→B, begreifbare Bürgerzahlen, multimodale Automatik.

### Dateien

- `src/game/operations/autoLogistics.ts` (neu), `src/game/simulation/tick.ts`,
  `src/game/commands/controller.ts`, `src/game/types.ts`, `src/game/config/schemas.ts`,
  `src/game/newGame.ts` (v24), `src/game/storage/migrations.ts` (v23→v24),
  `CLAUDE.md`, `docs/agents/ACTIVE_SIMPLICITY_PLAN.md` (neu),
  `tests/autoLogistics.test.ts` (neu).

### Assets

- Keine neuen Assets.

## v1.03 — Aktive Ressourcen 10.0 / R10: Migrationskette abgesichert (Save v23)

### Was

- **Ein Spielstand kann nicht mehr still unladbar werden.** Ein neuer Test prüft, dass
  die Migrationskette **lückenlos** ist: Für jede ladbare Schema-Version muss es einen
  Weg bis zur aktuellen geben.

### Warum

- Ein `SCHEMA_VERSION`-Bump ohne zugehörige Migration wäre bisher erst **beim Spieler**
  aufgefallen, der einen alten Stand lädt — genau das verbietet CLAUDE.md §3 („Saves
  brechen nie"). Bei drei Schema-Bumps in dieser Runde (v21→v22→v23) ist das kein
  theoretisches Risiko.

### Architektur

- Der Test geht jede Version von der Insel-Basis bis zur aktuellen durch. Erlaubt ist
  nur ein **bewusster** Weltumbau-Abbruch (`LegacyWorldSaveError` für die ersetzten
  Alt-Welten) — ein „Missing migration" schlägt fehl.
- **Das Netz wurde gegengeprüft:** mit einem künstlichen Bump auf v24 ohne Migration
  schlägt der Test mit „Missing migration from v23" fehl. Ein Test, der nicht fängt,
  wäre wertlos.

### Balancing-Abschluss — ehrlich offen

- Der zweite Teil von R10 („Balancing-Abschluss") ist **nicht** erledigt und wird auch
  nicht als erledigt markiert. Er hängt an zwei bewusst vertagten Entscheidungen:
  **P-B2** (Dauern in Ingame-Minuten neu balancieren) und dem
  **Bevölkerungs-Rebalancing** (I5 Teil 2) — beides wartet auf dein Spielgefühl bzw.
  deine Entscheidung zur Zielskala.

### Auswirkung

- `tsc` · ESLint · **437 Vitest grün** (+1) · Vite-Build.

### Dateien

- `tests/storage.test.ts`.

### Assets

- Keine neuen Assets.

## v1.02 — Aktive Ressourcen 10.0 / R5: Pflicht- und Kür-Nachladen in der Stadtarbeit (Save v23)

### Was

- **Nachfüllstopps sind jetzt als Pflicht oder optional gekennzeichnet.** Ein
  Pflichtstopp trägt den Hinweis „ohne diesen Halt reicht die Ladung für das nächste
  Ziel nicht" — ein optionaler ist nur ein Auffüllen, das man weglassen darf.
- Damit sieht man beim Planen, **welche Umwege wirklich nötig sind** und welche nur
  Zeit kosten.

### Warum

- Die Ladungsprognose je Stopp (`cargoAfter`) gab es schon, aber alle Nachfüllstopps
  sahen gleich aus. Ob ein Umweg zur Quelle zwingend ist oder reine Bequemlichkeit,
  war die eigentlich interessante Information — und fehlte.

### Architektur

- `CargoRouteStop` wird **additiv** um `required` und `requiredForBuildingId` ergänzt
  (nur für `resupply` gesetzt).
- Der Marker entsteht bei der Auswertung des **echten gezeichneten Wegs**: eine
  Vorausschau ermittelt das unmittelbar nächste noch offene Ziel und vergleicht dessen
  Bedarf mit der Ladung **vor** dem Nachladen. Kein Schätzwert, keine Heuristik.
- Läuft im vorhandenen `evaluateCargoRoute` — kein zweites Logistikmodell (§8).
- Keine Save-Änderung (v23), keine Simulationsänderung.

### Auswirkung

- `tsc` · ESLint · **436 Vitest grün** (+2) · Vite-Build. Die Tests decken **beide**
  Richtungen ab: ein zwingender Stopp (zwei Ziele à 100 bei Kapazität 100) wird als
  Pflicht mit Zielangabe gemeldet, ein reines Auffüllen (Gesamtbedarf 60) als optional.

### Dateien

- `src/game/activities/logistics.ts`, `src/components/citywork/TourOverview.tsx`,
  `tests/logistics.test.ts`.

### Assets

- Keine neuen Assets.

## v1.01 — Aktive Ressourcen 10.0 / R3+R4: Lagervergleich + echter Handkarren (Save v23)

### Was

- **Der Handkarren war doppelt gelistet** — einmal als toter Platzhalter („Nicht
  angebunden", Kapazität 0, deaktiviert) und einmal echt aus dem Fahrzeugkatalog. Der
  Platzhalter stammte aus der Zeit **vor** v0.91, wo der Handkarren tatsächlich noch
  fehlte. Er ist jetzt weg: Jede Transportmethode erscheint **genau einmal**, mit den
  echten Katalogwerten (Handkarren: Kapazität 40, ab Level 2 nutzbar).
- **Neu: Lagervergleich im Ressourcennetz** — Belegung in Prozent, freier Lagerplatz,
  Zahl der Standorte samt „voll/fast voll", und **welcher Standort zuerst dichtmacht**.
  Damit ist auf einen Blick sichtbar, wo sich Ware staut.

### Warum

- Der Platzhalter war eine harte Fehlinformation an der Stelle, an der man ein
  Transportmittel wählt — und ein Alt-Test hatte genau diese Lüge festgeschrieben
  (`available: false, capacity: 0`). Beides ist korrigiert.
- Der Lagerstand einzelner Standorte war zwar gelistet, aber nirgends verglichen: Bei
  vollem lokalem Lager stoppt ein Betrieb (§26.8) — man sah nur nicht, welcher zuerst.

### Architektur

- Die Transportmethoden kommen jetzt **ausschließlich** aus
  `config.activities.vehicles` — keine hart kodierten Kopien mehr neben dem Katalog.
- Neuer reiner Helfer `buildStorageComparison` über die vorhandenen Standortdaten.
  **Nur physische Lager zählen**; der zentrale Pool bleibt bewusst draußen, weil er im
  aktuellen Modell keinen Ort hat (§7.2) und den Vergleich verfälschen würde.
- Keine Save-Änderung (v23), keine Simulationsänderung.

### Auswirkung

- `tsc` · ESLint · **434 Vitest grün** (+2) · Vite-Build. Der stale Alt-Test wurde durch
  einen ersetzt, der das Gegenteil sichert: keine Dubletten, Werte **aus dem Katalog**.
  Ein zweiter Test prüft, dass `belegt + frei = Gesamtkapazität` gilt — keine erfundenen
  Restmengen.

### Zukunft

- Offen aus R4: **`InventoryTransferRule`** (wiederkehrende Lagerregeln) und ein
  physisches Rathauslager statt des gemeinsamen Pools — beides braucht ein echtes
  Bestandsmodell je Gebäude, nicht nur eine UI.

### Dateien

- `src/components/operations/adapters.ts`, `src/components/operations/viewModels.ts`,
  `src/components/operations/ResourceNetworkPanel.tsx`,
  `src/dev/activeOperationsMockData.ts`, `tests/activeOperationsViewModels.test.ts`.

### Assets

- Keine neuen Assets.

## v1.00 — Aktive Ressourcen 10.0 / R2·§5: Echter Durchsatz statt erfundener „+45/min" (Save v23)

### Was

- **Die passive Produktionsrate ist bei aktiven Betrieben verschwunden** — sie war
  schlicht **falsch**. Ein Sägewerk zeigte „+45 Holz/min", produzierte aber seit
  Active Operations 2.0 **nichts** passiv: Holz entsteht dort ausschließlich durch
  Arbeiter, Bäume und lokales Lager.
- **Neu: echte Durchsatz-Diagnose** im Betriebsbereich — Einheiten/Minute **unter den
  aktuellen Bedingungen**, plus mittlere Entfernung der Ziele. Läuft nichts, steht der
  ehrliche Grund da: *Pausiert · Wartet auf Nachwuchs · Lager voll · Kein Auftrag*.
- **Im Baumenü** steht bei Betrieben jetzt „Aktiver Betrieb (Arbeiter statt
  Passivproduktion)" statt einer Rate, die es nie gab — das ist die Stelle, an der
  gekauft wird.

### Warum

- Der frühere Wert kam direkt aus dem `produce`-Effekt der Config, obwohl genau dieser
  Pfad für Gebäude mit `operation` in Tick **und** Derived abgeschaltet ist. Der
  Betriebsbereich trug dafür schon den ehrlichen Platzhalter „Durchsatz: Nicht
  angebunden" — der wird jetzt eingelöst.

### Architektur

- Neuer reiner Read `getOperationThroughput` (in `operations.ts`, kein Renderer/React):
  **Projektion der echten Arbeitsschleife mit denselben Formeln wie der Tick** —
  `Durchsatz/Arbeiter = Traglast / (Hinweg + Fällzeit + Rückweg)`, mit Standortgüte und
  Reichweiten-Effizienz. Gezählt werden nur Ziele, an denen **jetzt** etwas zu holen ist
  (erschöpfte/nachwachsende Knoten tragen nichts bei).
- **Bewusst als Bedingungswert benannt, nicht als Messung:** Ablade- und Wartezeiten
  sind nicht enthalten, der reale Wert liegt leicht darunter. Das steht als Tooltip an
  der Zahl — kein stiller Genauigkeitsanspruch.
- `effectStats` und `effectSummary` unterdrücken die `produce`-Zeile für Gebäude mit
  `operation`. Passive Produzenten (Farm, Wasserwerk …) bleiben **unverändert**.
- Keine Save-Änderung (v23), keine Simulationsänderung — nur Wahrheit in der Anzeige.

### Auswirkung

- `tsc` · ESLint · **432 Vitest grün** (+2) · Vite-Build. Ein Test verankert die
  Trennung ausdrücklich: Der gemeldete Durchsatz ist **nicht** die Config-Rate 45.

### Zukunft

- Ein **gemessener**, rollierender Durchsatz über ein Zeitfenster (z. B. 10 Spielminuten)
  bleibt offen — dafür bräuchte es eine persistierte Historie je Betrieb.

### Dateien

- `src/game/operations/operations.ts` (`getOperationThroughput`),
  `src/game/commands/controller.ts`, `src/components/panels/FloatingBuildingSheet.tsx`,
  `src/components/panels/BuildMenu.tsx`, `src/i18n/de.json`,
  `tests/continuousOperation.test.ts`.

### Assets

- Keine neuen Assets.

## v0.99 — Aktive Ressourcen 10.0 / R2: Dauerbetrieb statt Neu-Auswählen (Save v23)

### Was

- **Ein Sägewerk, das du einmal einrichtest, arbeitet dauerhaft weiter.** Wählst du ein
  Arbeitsgebiet, bleibt es gespeichert: Ist alles abgeerntet, wird der Auftrag **nicht
  mehr gelöscht** — er legt sich schlafen („wartet auf Nachwuchs") und **nimmt die
  Arbeit selbst wieder auf**, sobald im Gebiet Bäume nachgewachsen sind.
- Bisher musstest du nach **jeder** Abernte von Hand ein neues Gebiet auswählen.

### Warum

- `advanceBuildingOperation` löschte den Auftrag (`delete ops.active[...]`), sobald kein
  bearbeitbarer Knoten mehr übrig war. Da Bäume ohnehin nachwachsen (8 Simminuten),
  war das reine Klickarbeit ohne Entscheidung — der Betrieb stand still, bis der Spieler
  es bemerkte.

### Architektur

- `ActiveBuildingOperation` wird **additiv** um `continuous` und `workArea`
  (`{ kind: 'circle', radius }`) erweitert; neuer Status **`waiting`**.
- Der Gebiets-Start (`startBuildingOperation`) ist jetzt standardmäßig ein Dauerbetrieb;
  mit `continuous = false` bleibt es beim einmaligen Auftrag. Die **Einzelbaum-Auswahl
  bleibt bewusst einmalig** — dort hat der Spieler konkrete Bäume gemeint, kein Gebiet.
- Die Wiederaufnahme nutzt **`selectAreaNodeIds`**, also exakt dieselbe Gebietsauswahl
  wie der Start — kein zweiter Auswahlpfad.
- **Rechteck-/Polygonflächen sind bewusst NICHT enthalten:** sie brauchen erst einen
  UI-Entwurfsvertrag. Ein Typ, den niemand erzeugen kann, wäre eine Attrappe.
- Neuer Read `getContinuousOperationStatus` (Status, Gebietsradius, Ziele, verfügbare
  Knoten, frühester Nachwuchszeitpunkt) — reine Projektion.
- **Save v23** mit **linearer Migration v22→v23** (rein additiv). Ein v22-Auftrag ohne
  die Felder bleibt exakt ein einmaliger Auftrag.

### Auswirkung

- `tsc` · ESLint · **430 Vitest grün** (+5 `continuousOperation.test.ts`) · Vite-Build.
- Kerntest ist ein **messbarer Kontrast**: Bei identischem Aufbau und identischer Laufzeit
  erntet der Dauerbetrieb **mehr** als der einmalige Auftrag — der Unterschied kann nur
  aus der Wiederaufnahme stammen.

### Dateien

- `src/game/operations/operations.ts` (Auto-Pause/Resume, `getContinuousOperationStatus`),
  `src/game/types.ts` (`OperationWorkArea`, `BuildingOperationStatus`),
  `src/game/config/schemas.ts`, `src/game/newGame.ts` (v23),
  `src/game/storage/migrations.ts` (v22→v23), `src/game/commands/controller.ts`,
  `tests/continuousOperation.test.ts` (neu), `tests/storage.test.ts`.

### Assets

- Keine neuen Assets.

## v0.98 — Infrastruktur 2.0 / I5 (Teil 1): Infrastruktur-Netzübersicht (Save v22)

### Was

- **Neues Panel „Infrastruktur"** mit vier Reitern — **Straßen · Brücken · Anleger ·
  Schiffe**. Erreichbar über die Schnellleiste neben „Regionen".
- **Straßen:** verbundene Kacheln, gebaute Bodenstraßen, **Teilnetze einzeln
  aufgelistet** (Stadtnetz vs. lokales Netz mit Anlegerzahl), angeschlossene Gebäude.
- **Brücken:** Anzahl der Höhenstraßen-/Brückenkacheln.
- **Anleger:** gebaute Anleger, betriebsbereit, am Stadtnetz, „lokal – per Schiff
  anschließbar", plus Wasserwegknoten/-kanten.
- **Schiffe:** alle Schiffsrouten mit Wasserweg, gelieferter Menge und Zustand
  (Unterwegs / Wartet auf Ware / Pausiert) — **hier lassen sich Routen pausieren,
  fortsetzen und löschen**. Damit ist I4 auch bedienbar, nicht nur simuliert.

### Warum

- I3 und I4 haben Teilnetze, Anlegerzustände und Schiffsrouten erzeugt, aber es gab
  **keinen Ort, an dem man sein Netz als Ganzes sieht** — und keine Bedienoberfläche
  für die neuen Routen.

### Architektur

- `infrastructureNetworkOverview` liefert jetzt zusätzlich `groundRoadTiles`,
  `elevatedRoadTiles` (Bauklasse `BuildingDef.road`, I1) und `harbors` — echte Zählung
  aus dem Bestand statt geschätzter Werte.
- Das Panel nutzt **ausschließlich vorhandene Reads** (`getInfrastructureNetworkOverview`,
  `getHarborNetworkOverview`, `getRoadSegments`, `getShippingRoutes`,
  `getShippingNetworkOverview`) — **keine erfundenen Kapazitäts-, Verkehrs- oder
  Netzlastdaten**. Was noch nicht existiert (Durchfahrtshöhe, Schiffsklassen), steht als
  ehrlicher Hinweis da, nicht als Zahl.
- Gleiche Panel-Bausteine wie das Ressourcennetz (`GamePanel`/`DataMetric`/`StatusChip`),
  gleiche Tokens — kein zweites Panel-Design. **Ein-Sheet-Regel** eingehalten: das Öffnen
  schließt andere Sheets und umgekehrt.
- Die sechs Mockup-Hauptslots der Navigation bleiben **unangetastet**; Infrastruktur ist
  bewusst eine kontextuelle Utility neben „Regionen".
- Keine Save-Änderung (v22), keine Simulationsänderung.

### Auswirkung

- `tsc` · ESLint · **425 Vitest grün** (+1: „zählt Bodenstraßen, Höhenstraßen/Brücken und
  Anleger getrennt") · Vite-Build · 3D-Init-Smoke 0 Konsolenfehler.

### Zukunft — I5 Teil 2 (bewusst offen, braucht eine Entscheidung)

- **Bevölkerungs-Rebalancing** (kleines Haus 4–8 … Hochhaus 300+) ist **nicht**
  enthalten. Grund: Die Zielwerte lassen sich nicht mit einem einheitlichen Faktor
  erreichen (aktuell wirkt `populationScale: 20` auf `units × maxResidentsPerUnit`;
  die nötigen Faktoren liegen je Gebäudetyp zwischen ~10 und ~22). Es ist damit **kein
  Umrechnen, sondern eine echte Neubalancierung**, die Level-Schwellen, Questziele,
  Pro-Kopf-Wirtschaft und Versorgungskapazitäten verschiebt — plus lineare Migration
  der persistierten Einwohnerzahl. Das gehört abgestimmt, statt es mitten im laufenden
  Spieltest zu erraten.

### Dateien

- `src/components/operations/InfrastructureNetworkPanel.tsx` (neu),
  `src/game/infrastructure/buildingInfrastructure.ts` (Übersicht erweitert),
  `src/state/store.ts`, `src/App.tsx`, `src/components/hud/QuickActionBar.tsx`,
  `src/styles/active-operations.css`, `src/i18n/de.json`, `tests/networkSegments.test.ts`.

### Assets

- Keine neuen Assets.

## v0.97 — Infrastruktur 2.0 / I4: Persistente Schiffsrouten (Save v22)

### Was

- **Neu: dauerhafte Schiffsrouten zwischen zwei Anlegern.** Einmal eingerichtet, holt
  das Schiff selbstständig Ware aus dem lokalen Betriebslager, fährt über das Wasser
  und lagert sie am Ziel ein — **zyklisch weiter**, bis du sie pausierst oder löschst.
- Jede Route zeigt echte Werte: **Kapazität** (Frachtkahn 260), **Fahrzeit** aus der
  tatsächlichen Wasserdistanz, **Betriebskosten je Fahrt** und die kumuliert gelieferte
  Menge. Ist das Quell-Lager leer, **wartet** die Route sichtbar, statt zu verschwinden.
- **Neues Fahrzeug „Frachtkahn"** (ab Level 6): sehr hohe Ladung, langsam, spürbare
  Betriebskosten — die strategische Gegenrechnung zum kurzen, billigen Landweg.

### Warum

- Der vorhandene Lagertransport fährt über den **Straßengraphen**. Liegen Quelle und
  Ziel durch Wasser getrennt, liefert er `no_route` — die Ware bleibt im lokalen
  Betriebslager stecken. Genau diese Lücke schließt die Schiffsroute.
- I3 hat den Anleger zum Netzknoten gemacht; `linksToCityVia` war bereits als Eingabe
  dafür gedacht. I4 macht daraus einen echten, laufenden Warenfluss.

### Architektur

- **Reines Sim-Modul** `src/game/infrastructure/shippingRoutes.ts` (kein Renderer/React).
- **Kein zweites Transportsystem (§2/§8):** Wasserweg/Distanz aus dem bestehenden
  `waterNavigation`-Dijkstra · Kapazität/Fahrzeugdaten aus demselben
  `activities/logistics`-Katalog · Lager/Reservierung aus `operations` ·
  **dasselbe Phasenvokabular** wie der Transport (`loading → outbound → unloading →
  returning`). Der einzige Unterschied ist die **Persistenz**.
- **Derselbe Tick-Pfad** (`advanceShippingRoutes` neben `advanceTransfers`, beide mit
  dem zeitfaktor-skalierten `dtMin`) → Pause/1×/2×/4× wirken automatisch;
  `derived.storageCaps` deckelt die Einlagerung; `stats.produced` wird **nicht** erneut
  erhöht (kein Doppelzählen).
- **Keine Vorab-Reservierung:** Anders als ein einmaliger Transport bindet eine
  Dauerroute das Quell-Lager nicht — sie nimmt je Fahrt, was gerade frei ist.
- **Save v22** mit **linearer Migration v21→v22** (rein additiv, `shipping` optional).
  Ein v21-Save lädt unverändert und startet ohne Routen — keine erfundenen Daten.
- **Genauer Umfang (nicht mehr behauptet als simuliert):** Modelliert wird die
  **Schiffsfahrt zwischen den Anlegern**. Die Landwege Betrieb→Anleger und
  Anleger→Lager sind in Lade-/Entladezeit abstrahiert; dafür bleibt der
  Lagertransport zuständig.

### Auswirkung

- `tsc` · ESLint · **424 Vitest grün** (+9 `shippingRoutes.test.ts`, +1 Migrationstest
  — u. a. „bringt Holz über das Wasser in den globalen Pool und fährt zyklisch weiter",
  „wartet bei leerem Quell-Lager, statt zu verschwinden", vier konkrete
  Ablehnungsfälle) · Vite-Build. Zwei Tests hatten die Schema-Version hart kodiert und
  hängen jetzt an `SCHEMA_VERSION`.

### Zukunft

- Bewusst offen (nicht vorgetäuscht): **3D-Schiffe** auf der Route, Zwischenlager an
  Häfen, Kraftstoff/Schiffszustand, mehrere Schiffe je Route, echte multimodale Legs
  und die Routen-UI (kommt mit **I5**: Infrastruktur-Netz-Panel).

### Dateien

- `src/game/infrastructure/shippingRoutes.ts` (neu), `src/game/types.ts`
  (`ShippingRoute`/`ShippingState`, `cargo_barge`), `src/game/config/schemas.ts`,
  `src/game/config/activities.config.ts` (Frachtkahn), `src/game/newGame.ts` (v22),
  `src/game/storage/migrations.ts` (v21→v22), `src/game/simulation/tick.ts`,
  `src/game/commands/controller.ts`, `src/i18n/de.json`,
  `tests/shippingRoutes.test.ts` (neu), `tests/storage.test.ts`, `tests/transport.test.ts`.

### Assets

- Keine neuen Assets. Ein `cargo_barge`-Fahrzeugbild ist drop-in-fähig vorgesehen.

## v0.96 — Infrastruktur 2.0 / I3: Anleger als echter Netzknoten (Save v21)

### Was

- **Ein Anleger zeigt jetzt, woran seine Landseite hängt:** „Am Stadtnetz",
  „Lokales Netz – per Schiff anschließbar", „Lokales Netz – ohne Stadtanschluss" oder
  „Keine Straße am Anleger". Bisher sahen ein Anleger mitten in der Stadt und ein
  abgeschnittener Anleger hinter dem Wasser **identisch** aus.
- Damit wird aus dem Einzelobjekt ein **Netzknoten**: Straße → Anleger → (Schiff) →
  Anleger → Straße ist erstmals als Zustand ablesbar.

### Warum

- Seit v0.92 seedet ein Anleger den Straßengraphen wie ein Distriktzentrum, damit
  hinter Wasser überhaupt gebaut werden kann. `derived.roadNetwork` ist aber **ein
  flaches Set** — ein isoliertes Anleger-Netz war darin nicht vom Stadtnetz zu
  unterscheiden. Genau diese fehlende Unterscheidung verhinderte, dass Anleger als
  Netzknoten funktionieren (§I3), und sie ist die Eingabe, die I4 für Schiffsrouten
  braucht.

### Architektur

- **Reines Modul** `src/game/infrastructure/networkSegments.ts`: zerlegt das
  **bestehende** `roadNetwork` in seine zusammenhängenden Teilnetze und klassifiziert
  sie (`city` = berührt ein Distriktzentrum, sonst `local`). Deterministische Ids
  (kleinste Kachel), stabile Reihenfolge. **Kein zweiter Verkehrsgraph (§2/§8)** —
  Eingabe ist ausschließlich das vorhandene Netz.
- **Event-getrieben statt pro Read (§15.5):** Die Zerlegung entsteht in
  `computeDerived` neben `roadNetwork`, also nur bei Strukturänderungen.
- **Reine Projektion** `src/game/infrastructure/harborNodes.ts`
  (`getHarborNodeStatus`, `getHarborNetworkOverview`): Landseite (Teilnetz +
  Stadtanschluss), Wasserseite (Wasserknoten aus `buildingInfrastructureStatus`),
  über Wasser erreichbare Anleger und — für lokale Netze — über welche Anleger eine
  Schiffsverbindung die Stadt anbinden **würde**.
- **Bewusst nicht erfunden:** Kapazität, Reisezeit, Betriebskosten und Warenfluss
  gehören zu den persistenten Schiffsrouten (**I4**) und werden nicht vorgetäuscht.
  `WaterfrontFootprint` trägt heute keine Kapazitätsdaten.
- **Operabilität unverändert:** Ein Gebäude auf einem lokalen Netz bleibt vorerst
  betriebsfähig. Es jetzt stillzulegen wäre eine Falle — ohne Schiffsrouten (I4)
  hätte der Spieler kein Mittel dagegen. Der Zustand wird gezeigt, nicht bestraft.
- **Keine Save-Änderung** (v21): alles ist reine Projektion.

### Auswirkung

- `tsc` · ESLint · **414 Vitest grün** (+8 in `networkSegments.test.ts` — u. a.
  „trennt ein isoliertes Anleger-Netz als eigenes lokales Teilnetz vom Stadtnetz",
  Determinismus und „täuscht keine Schiffsroute vor") · Vite-Build.

### Zukunft

- **I4:** persistente Schiffsrouten Anleger↔Anleger (Kapazität, Reisezeit,
  Betriebskosten, Warenfluss, Pause/Löschen) mit **linearer Save-Migration**;
  `linksToCityVia` ist genau deren Eingabe. Danach **I5** (Bevölkerungs-Rebalancing +
  Infrastruktur-Netz-UI).
- Offen aus I3: die adaptive Uferplattform (R9) bleibt Renderer-/Bake-Arbeit.

### Dateien

- `src/game/infrastructure/networkSegments.ts` (neu),
  `src/game/infrastructure/harborNodes.ts` (neu),
  `src/game/simulation/derived.ts` (`roadSegments`),
  `src/game/commands/controller.ts` (drei Reads),
  `src/components/panels/FloatingBuildingSheet.tsx`, `src/i18n/de.json`,
  `tests/networkSegments.test.ts` (neu).

### Assets

- Keine neuen Assets.

## v0.95 — Bauen 8.0 / G2 ②: Kamera bleibt im Baumodus voll bedienbar (Save v21)

### Was

- **Während des Platzierens lässt sich die Karte jetzt frei bewegen.** Mittlere Taste
  **schwenkt**, rechte Taste **zieht = drehen/neigen**, Mausrad zoomt, `Strg`+Linkszug
  dreht — alles, **ohne den Bauentwurf zu verlieren**. Ein bewusster **Rechts-Klick**
  (ohne Zug) bricht das Platzieren ab. Die linke Taste baut/malt wie bisher.
- Dieselbe, jetzt konsistente Belegung gilt auch beim freien Umsehen: die Mitteltaste
  schwenkt überall (statt zu orbitieren), Drehen liegt einheitlich auf Rechts-Zug bzw.
  `Strg`+Links.

### Warum

- Kamerafehler im Baumodus (Audit §2.2): Beim Platzieren belegte die **linke** Taste
  fest den `build`-Modus (kein Schwenken per Linkszug) und die **rechte** Taste war fest
  `cancel` (kein Drehen). Es blieb praktisch nur die Mitteltaste + Mausrad — die Karte
  ließ sich beim Bauen kaum ausrichten. Verbindliche Zielbelegung: §10.3.

### Architektur

- **Eine reine, testbare Stelle** `src/renderer/three/cameraInputMapping.ts`
  (`deriveDragMode` + `deriveClickAction`) bildet `(Taste, Strg, Platzierungszustand)`
  auf Zug- bzw. Klickabsicht ab. **Bewusst frei von three.js/React** → deterministisch
  unit-testbar. Der `CameraInputController` ruft nur noch diese Funktionen statt einer
  verzweigten Inline-Logik.
- **Trennung Zug ↔ Klick:** Der Zug-Modus (`pan`/`orbit`/`build`) steuert die
  Kamerabewegung; die Klickaktion (`place`/`select`/`cancel`) entsteht **getrennt** beim
  Loslassen aus der gedrückten Taste. Dadurch verwirft **keine** Kamera-Geste den
  Entwurf — nur der Rechts-Klick tut es (§10.3: „Der Bauentwurf überlebt jede
  Kamerabewegung").
- **Kein neues Eingabesystem**: derselbe Controller, dieselben `CameraController3D`-
  Aufrufe (`beginPan`/`panScreen`/`orbit`); nur die Ableitung ist herausgezogen und
  präzisiert. WASD/Pfeile, Q/E, PageUp/Down, Randscrollen und Touch bleiben unverändert.
- **Keine Save-Änderung** (v21), rein interaktiv.

### Auswirkung

- `tsc` · ESLint · **406 Vitest grün** (+6 in `camera.test.ts` zur Modusableitung — u. a.
  „Rechts-Zug dreht in beiden Modi; nur der Rechts-Klick bricht ab" und „der Bauentwurf
  überlebt jede Kamerabewegung") · Vite-Build. 3D-Init-Smoke (Chromium): Renderer
  initialisiert mit geändertem Input-Controller, 0 Konsolenfehler.

### Zukunft — G2-Reste (nächste Schritte, Reihenfolge zwingend)

- ③ echter GLB-Ghost mit Rotation/Sockel/Anschluss/Radius (`placementDiagnostics`),
  ④ Verschieben als Entwurf, ⑤ Wirkungsradien terrainfolgend (`getCoverageOverlay`),
  ⑥ Straßenbau als Plan→Vorschau→Bestätigen. Mit korrektem Picking (①) und bedienbarer
  Kamera (②) ist die Basis für die sichtbare Bau-Vorschau gelegt.

### Dateien

- `src/renderer/three/cameraInputMapping.ts` (neu),
  `src/renderer/three/CameraInputController.ts` (Belegung §10.3, nutzt das Mapping),
  `tests/camera.test.ts` (+6 Modusableitungs-Tests).

### Assets

- Keine neuen Assets.

## v0.94 — Bauen 8.0 / G2 ①: Cursor trifft die richtige Kachel auf Hängen & Bergen (Save v21)

### Was

- **Bauen, Verschieben, Straßen ziehen und Zoom treffen jetzt auf erhöhtem Gelände
  exakt die Kachel unter dem Mauszeiger.** Bisher landete der Ghost auf Hügeln und
  Bergen sichtbar **daneben** — je höher das Gelände, desto größer der Versatz. Auf
  flachem Land ändert sich nichts.

### Warum

- Kern-Interaktionsfehler (Audit §2.1): Der Cursor→Kachel-Strahl schnitt eine
  **unsichtbare flache Ebene bei y = 0** statt das echte Höhenfeld. Auf erhöhtem
  Gelände liegt der so getroffene Punkt um ≈ `Höhe / tan(Kamerawinkel)` daneben — bei
  Gipfeln bis ~52 Einheiten wird das riesig. Genau **das** machte das Bauen auf der
  verdichteten, hügeligen Welt frustrierend (und ist die wahrscheinliche Ursache der
  zuvor abgelehnten Anleger-Plätze). Es war als **Voraussetzung** für sauberen
  Straßen-/Gebäudebau markiert („① zuerst, Reihenfolge zwingend").

### Architektur

- **Reiner, testbarer Helfer** `src/renderer/three/terrainPicking.ts`
  (`raycastHeightfield`): marschiert den Strahl gegen einen Höhen-Sampler und findet
  den ersten Boden-Schnittpunkt per Bracketing + binärer Verfeinerung. **Bewusst frei
  von three.js** (nackte Zahlen + Sampler) → deterministisch unit-testbar.
- **`terrainHeightAt` bleibt die EINZIGE Bodenhöhenquelle** (CLAUDE.md); der Helfer
  bekommt sie als Sampler. Das vertikale Suchband kommt aus den neuen abgeleiteten
  Grenzen `TERRAIN_MIN_Y`/`TERRAIN_MAX_Y` (aus dem Bake), damit nur die Terrain-Schale
  abgetastet wird (wenige Dutzend Samples je Pick).
- **Ein einziger Fix** in `ThreeMapRenderer.groundPointAt` korrigiert die **gesamte**
  Interaktion, weil `pickTileAt`/`updateGhostAt`/`paint`/`selectAt` und der
  Cursor-Zoom (`CameraInputController.onWheel` → `groundAt`) alle darüber laufen.
  Zeigt der Strahl in den Himmel/über den Horizont, greift der **Ebenen-Fallback** —
  Leerraum-Klicks für Kamera-Fokus/Zoom bleiben erhalten.
- **Keine Save-Änderung** (v21), rein visuell/interaktiv, kein neues System.

### Auswirkung

- `tsc` · ESLint · **400 Vitest grün** (neu: `terrainPicking.test.ts`, 6 Fälle — u. a.
  „auf dem Hang trifft der Strahl die echte Oberfläche, die y=0-Ebene läge >5 Kacheln
  daneben") · Vite-Build. 3D-Init-Smoke (Chromium/SwiftShader): Renderer initialisiert,
  0 Konsolenfehler.

### Zukunft — G2-Reste (nächste Schritte, Reihenfolge zwingend)

- ② Kamera-Belegung im Baumodus (LMB/RMB, §10.3), ③ echter GLB-Ghost mit Rotation/
  Sockel/Anschluss/Radius, ④ Verschieben als Entwurf, ⑤ Wirkungsradien terrainfolgend,
  ⑥ Straßenbau als Plan→Vorschau→Bestätigen. Nach diesem Fix ① erneut prüfen, ob die
  Anleger-Ablehnungen (§14) verschwinden.

### Dateien

- `src/renderer/three/terrainPicking.ts` (neu), `src/renderer/three/terrainHeight.ts`
  (`TERRAIN_MIN_Y`/`TERRAIN_MAX_Y`), `src/renderer/three/ThreeMapRenderer.ts`
  (`groundPointAt` + Import), `tests/terrainPicking.test.ts` (neu).

### Assets

- Keine neuen Assets.

## v0.92 — Spielbarkeit 9.1 / P-D: Straßenstart am isolierten Anleger (lokales Netz hinter Wasser) (Save v21)

### Was

- **Straßen lassen sich jetzt direkt an einem Anleger/Hafen beginnen** — auch wenn er
  noch nicht ans Hauptstraßennetz angeschlossen ist. So kann man hinter einer
  Wasserverbindung einen neuen Stadtteil erschließen: der Anleger ist ein
  **Landanker**, an dem ein **lokales Straßennetz** entsteht und **weiterwächst**.

### Warum

- P-D des Spielbarkeits-Auftrags (§11.2): „Straßen können an noch nicht angeschlossene
  Anleger teilweise nicht sinnvoll angebaut werden." Bisher seedete der Straßengraph
  nur aus Distriktzentren — hinter dem Wasser kam man nicht weiter.

### Architektur

- **Kein zweiter Verkehrsgraph (§2):** Jedes `waterfront`-Gebäude ist jetzt ein
  Saatpunkt desselben Straßengraphen. `roadWouldConnect` erlaubt die erste Straße an
  der Anleger-Landkante; `computeRoadNetwork` nimmt Anleger-Footprints als Seeds auf,
  sodass die anliegenden Straßen einen zusammenhängenden, **erweiterbaren** lokalen
  Verbund bilden (BFS). Gemeinsamer Helfer `adjacentToFootprintEdge` (Distriktzentrum
  wie Anleger). Derselbe `validatePlacement`/`roadNetwork`-Pfad.
- **Keine Save-Änderung** (v21) — Straßen/Anleger sind Gebäude-Instanzen.

### Auswirkung

- `tsc` · ESLint · **394 Vitest grün** (neu: `harborNetwork.test.ts`, 3 Fälle) · Vite-Build.

### Zukunft — I4 „voll ausgebaut" (eigener Meilenstein, nicht vorgetäuscht)

- Persistente **Schiffsrouten** Anleger↔Anleger (Kapazität, Reisezeit, Betriebskosten,
  Warenfluss, Pause/Löschen) mit **linearer Save-Migration**; Anleger-Netzknoten-Panel;
  multimodale Stadtarbeit (Straße→Schiff→Straße). Bausteine vorhanden
  (`waterNavigation.ts`, `buildingInfrastructure.ts`, `operations/transport.ts`). Details:
  `docs/agents/HARBOR_INFRASTRUCTURE_GRAPH.md`.

### Dateien

- `src/game/buildings/placement.ts` (`roadWouldConnect` + `adjacentToFootprintEdge`),
  `src/game/map/world.ts` (`computeRoadNetwork` seedet Anleger),
  `tests/harborNetwork.test.ts` (neu), `docs/agents/HARBOR_INFRASTRUCTURE_GRAPH.md` (neu).

### Assets

- Keine neuen Assets.

## v0.91 — Spielbarkeit 9.1 / P-C: Handkarren ab Level 2 + Lager nach Standort sichtbar (Save v21)

### Was

- **Holz kommt in Level 2–3 endlich vom Sägewerk ins Rathaus.** Neuer **Handkarren**
  (ab Level 2) transportiert lokal geerntetes Holz ins Rathauslager — **bevor** der
  erste Lieferwagen (Level 4) kommt. Kleine Ladung (40), langsam, **kein Motor →
  keine Betriebskosten**. Auswählbar im Sägewerk unter „Transport".
- **Bestand nach Standort auf einen Blick.** Das Ressourcen-Popover zeigt jetzt direkt
  „Für Bau verfügbar", „In Betrieben (lokal)", „Unterwegs" und „Reserviert" — nicht
  mehr nur den Gesamtbestand. Die volle Standortliste (Rathaus/Lagerhäuser mit
  Kapazität, Kamera-Fokus) bleibt über „Gesamtes Ressourcennetz öffnen".

### Warum

- P-C des Spielbarkeits-Auftrags: Das Sägewerk ist ab L2 baubar, der Lieferwagen aber
  erst ab L4 — dazwischen fehlte **jedes** Transportfahrzeug, der frühe Baufortschritt
  stockte. Und: „Rathauslager und Lagerhäuser sind in der Ressourcenübersicht nicht
  ausreichend sichtbar."

### Architektur

- **Kein neues System (§2):** `handcart` ist ein Eintrag im bestehenden
  Fahrzeugkatalog (`activities.config.ts`); die A5-Transportmaschinerie
  (`operations/transport.ts`) wird unverändert wiederverwendet. Additiv:
  `DriveVehicle`-Wert `'handcart'` (Type + Zod-Enum), i18n. Renderer fällt für
  unbekannte Fahrzeuge auf das Van-Modell zurück (echtes `.glb` drop-in-fähig, §5).
- **Lagersicht** ist eine reine Read-Projektion (`buildResourceNetworkView`) — der
  Zentralbestand ist EIN Pool (Rathaus + Lagerhäuser = Kapazität), die Aufteilung je
  Gebäude bleibt der vollen Übersicht vorbehalten; **nichts erfunden**.
- **Keine Save-Änderung** (v21) — Fahrzeuge sind Config, kein State.

### Auswirkung

- `tsc` · ESLint · **391 Vitest grün** (neu: `earlyLogistics.test.ts`, 4 Fälle inkl.
  vollem Loop) · Vite-Build.

### Zukunft

- **P-D** Anleger-zu-Anleger-Netz, **P-E** systematischer Performance-Pass. §9-Feintuning
  von Handkarren-Kapazität/-Tempo und Baudauern nach Spielgefühl. Echtes
  Handkarren-Modell drop-in-fähig.

### Dateien

- `src/game/config/activities.config.ts` (Handkarren), `src/game/types.ts` +
  `src/game/config/schemas.ts` (`'handcart'`), `src/i18n/de.json`,
  `src/components/hud/ResourceDetailPopover.tsx` (+ `src/styles.css`),
  `tests/earlyLogistics.test.ts` (neu), `docs/agents/EARLY_LOGISTICS.md` (neu).

### Assets

- Kein neues Asset zwingend (Van-Fallback). Ein `handcart`-Modell/-Bild ist drop-in.

## v0.90 — Spielbarkeit 9.1 / P-B2-Anzeige + P-E FPS: Bauzeiten in Ingame-Zeit, dauerhafte FPS-Anzeige (Save v21)

### Was

- **Bauzeiten stehen jetzt in Ingame-Zeit.** Der Bau-Shop und der Bau-/Upgrade-
  Countdown zeigen die Dauer in **Ingame-Minuten** (z. B. „45 Min", „3 Std 20 Min")
  statt roher Sekunden — dieselbe Einheit wie die Uhr, sodass eine Bauzeit genau so
  viele Ingame-Minuten läuft, wie die Uhr währenddessen weiterrückt.
- **Dauerhafte FPS-Anzeige neben der Uhr.** Ein kleiner Chip zeigt die Bildrate,
  farbcodiert (**grün ≥55**, **gold 35–54**, **rot <35**). Tooltip: FPS + Frame-Zeit.

### Warum

- P-B2-Anzeigeteil des Spielbarkeits-Auftrags (§8 „jedes zeitabhängige System hat eine
  Dauer in Ingame-Zeit") und P-E-FPS (§15.1 „dauerhaft sichtbare FPS-Anzeige neben der
  Uhr"). Die Bauzeit-**Werte** selbst bleiben vorerst unverändert — jetzt in
  Ingame-Minuten sichtbar, damit das §9-Feintuning auf echtem Spielgefühl beruht.

### Architektur

- **`formatGameDuration(simMs)`** (i18n) rechnet Simulations-ms über
  `SIM_MS_PER_GAME_MINUTE` in Ingame-Minuten um; `BuildMenu` und
  `FloatingBuildingSheet` nutzen es. Kein Sim-/Save-Eingriff.
- **`src/services/fpsMeter.ts`**: EIN `requestAnimationFrame`-Zähler misst die reale
  Bildrate und veröffentlicht **nur ~alle 500 ms** einen Snapshot; die React-Anzeige
  liest ihn über `useSyncExternalStore` — **kein Update pro Frame** (§15.2). Der
  Renderer bleibt unberührt; die Anzeige kostet praktisch nichts.

### Auswirkung

- `tsc` · ESLint · **387 Vitest grün** · Vite-Build. Keine Save-Änderung (v21).

### Zukunft

- **P-B2-Werte:** §9-Rebalancing der Baudauern (jetzt auf Basis der sichtbaren
  Ingame-Minuten). **P-C** Frühlogistik (Handkarren L2 + Lagerübersicht), **P-D**
  Anlegernetz, **P-E** systematischer Performance-Pass (Report) folgen.

### Dateien

- `src/i18n/index.ts` (`formatGameDuration`), `src/components/panels/BuildMenu.tsx`,
  `src/components/panels/FloatingBuildingSheet.tsx`, `src/services/fpsMeter.ts` (neu),
  `src/components/hud/CameraControls.tsx` (`FpsIndicator`), `src/components/hud/GameHud.tsx`,
  `src/styles/components.css`.

### Assets

- Keine neuen Assets.

## v0.89 — Spielbarkeit 9.1 / P-B1 Feinschliff: schnellere Uhr + gekoppelte Sonne (Save v21)

### Was

- **Die Uhr läuft jetzt lebendiger.** Nach dem Test wurde das Tempo erhöht: **1× = 1
  Ingame-Minute je 4 Echtzeitsekunden** (statt 10). Ein voller Ingame-Tag dauert bei
  1× rund 96 Echtzeitminuten, bei 4× nur 24.
- **Die Sonne folgt jetzt der Uhr.** Tag/Nacht am Himmel ist an die **eine** Ingame-Zeit
  gekoppelt: Der Sonnenstand entspricht der Uhrzeit, und bei Pause steht auch die Sonne.
  Der frühere manuelle Tageszeit-Regler ist damit überflüssig und aus dem Wetter-Panel
  entfernt — dort bleibt nur noch die reine **Wetter-Atmosphäre** (Sonnig/Regen/Nebel).

### Warum

- Direkte Umsetzung der Nutzer-Rückmeldung zu P-B1 (24.07.2026): „schnellere Uhr
  (3–5 s/Min)" und „Sonne an die Uhr koppeln". Mit dem kürzeren Ingame-Tag wandert die
  gekoppelte Sonne sichtbar, statt einzufrieren.

### Architektur

- Zentrale Zahl `SIM_MS_PER_GAME_MINUTE` von 10 000 → **4 000**. Kopplung: `DayNightControl`
  (immer im HUD gemountet) treibt `environmentSettings.timeOfDay` aus
  `getGameClock().timeOfDay` (cycle aus) — kein Renderer-Code geändert, nur ein bereits
  vorhandener, geklammerter Eingang wird jetzt aus der Uhr gespeist. `WeatherPanel` auf
  reine Atmosphäre reduziert. Keine Save-Änderung (v21).

### Auswirkung

- `tsc` · ESLint · **387 Vitest grün** · Vite-Build. Kein 3D-Renderer-Code berührt; der
  Live-3D-Smoke läuft in dieser Umgebung nicht (kein Playwright) — die In-Game-Prüfung
  des Nutzers bestätigt die Sonne.

### Dateien

- `src/game/time/gameTime.ts` (Ratio 4 s), `src/components/hud/CameraControls.tsx`
  (Sonnen-Kopplung), `src/components/panels/WeatherPanel.tsx` (nur Atmosphäre),
  `tests/gameTime.test.ts`, `docs/agents/INGAME_TIME_SYSTEM.md`, DECISIONS **D-038**.

### Assets

- Keine neuen Assets.

## v0.88 — Spielbarkeit 9.1 / P-B1: EINE verbindliche Ingame-Zeit + sichtbare Uhr (Save v21)

### Was

- **Die Uhr läuft endlich richtig.** Bisher zeigte das HUD eine tote Uhr: „Tag 1"
  und „Frühling" waren **feste Texte**, und die Uhrzeit kam aus dem **kosmetischen**
  Tag/Nacht-Renderer — nicht aus der Simulation. Jetzt ist die Anzeige eine **reine
  Projektion der einen Simulationszeit**: **Tag N · HH:MM · Jahreszeit** laufen live
  mit und stehen bei Pause still (**„· Pausiert"**).
- **1×/2×/4× wirken sichtbar und konsistent.** Eine Ingame-Minute vergeht bei **1×
  in 10 Echtzeitsekunden**, bei 2× in 5, bei 4× in 2,5. Die Uhr — und mit ihr Bauzeit,
  Betriebe, Transport, Wirtschaft und Missionen — beschleunigt bei 2×/4× **gemeinsam**;
  Pause hält **alles** an.
- **Kein Fake-Zeitregler mehr im HUD.** Der manuelle Tageszeit-Schieber und der
  Trick, bei jeder Geschwindigkeit die „Tageslänge" umzustellen, sind aus der
  Zeitleiste raus (sie waren eine zweite, widersprüchliche Zeit). Atmosphäre/Wetter
  bleibt rein visuell und wird weiter im Wetter-Panel eingestellt.

### Warum

- Baustein P-B des Spielbarkeits-Auftrags: „Eine einzige verbindliche Ingame-Zeit …
  die Uhr muss sichtbar korrekt laufen, 1×/2×/4× müssen alle zeitabhängigen Systeme
  konsistent antreiben, Pause alle Simulationssysteme stoppen." Befund: Die
  **Simulation war bereits konsistent** (`advanceByRealTime × Geschwindigkeit` treibt
  alle Systeme durch denselben Takt) — nur die **Anzeige** war davon entkoppelt und
  wirkte deshalb „stehen geblieben".

### Architektur

- **Kanonisches Zeitmodul `src/game/time/gameTime.ts`** (rein, keine three/React-
  Importe, §1). Zentrale Zahl `SIM_MS_PER_GAME_MINUTE = 10_000`; `gameClockAt(
  createdAt, simTime)` projiziert die eine Simulationsuhr (`meta.lastSimTime`) auf
  Tag/Stunde/Minute/`timeOfDay`/Jahreszeit (Start Tag 1, 08:00; Tag = 1440 Min,
  Jahreszeit = 28 Tage).
- **Controller-Read `getGameClock()`** ist die einzige Zeitquelle der UI.
- **HUD `DayNightControl`** liest nur `game.getGameClock()` und re-rendert über
  `useGame()`/`version` bei jedem Tick — **kein `setInterval` in React** (§7.4).
- **Keine Save-Änderung** (v21): die Uhr ist eine Projektion vorhandener Felder
  (`createdAt`, `lastSimTime`).

### Auswirkung

- Die Zeit ist jetzt **eine** verbindliche Größe; Geschwindigkeit und Pause sind
  sichtbar und konsistent. Kein Datenverlust.
- Verifikation: `tsc` · ESLint · **387 Vitest grün** (neu: `gameTime.test.ts`, 7
  Fälle inkl. Pause-friert-alles + Bauzeit-skaliert-mit-Speed) · Vite-Build.

### Zukunft

- **P-B2 (nächster Schritt):** Bau-/Upgrade-/Arbeits-/Transportdauern in
  **Ingame-Minuten** ausdrücken und **neu balancieren** (§9) — kleine Gebäude wenige
  reale Minuten, große/Upgrades langfristig. Danach P-C Frühlogistik, P-D Anlegernetz,
  P-E Performance/FPS.
- **Bewusst offen (nicht vorgetäuscht):** der Tag/Nacht-**Himmel** bleibt vorerst ein
  eigener kosmetischer Zyklus (ein voller Ingame-Tag = 4 Echtzeitstunden bei 1×; die
  Sonne strikt daran zu koppeln, würde sie optisch einfrieren). Sonne an die Uhr zu
  „slaven" ist ein kleiner, umkehrbarer Folgeschritt auf Wunsch.

### Dateien

- `src/game/time/gameTime.ts` (neu)
- `src/game/commands/controller.ts` (`getGameClock()`)
- `src/components/hud/CameraControls.tsx` (`DayNightControl` liest die Sim-Uhr;
  Fake-Regler/`dayLengthMin`-Hack entfernt)
- `src/i18n/de.json` (`ui.clock.*`, `ui.season.*`; doppelter `ui.env.paused` bereinigt)
- `tests/gameTime.test.ts` (neu), `docs/agents/INGAME_TIME_SYSTEM.md` (neu), DECISIONS **D-038**

### Assets

- Keine neuen Assets.

## v0.87 — Stadtarbeit-Stabilität 9.1: eingefrorener Planungssnapshot (Save v21)

### Was

- **Lieferaufträge verändern sich während der Planung nicht mehr von selbst.** Bisher
  konnten Zielgebäude, Quelle und Liefermengen eines Auftrags (z. B. „Essen
  verteilen") **bei laufender Uhr scheinbar von allein springen** — je höher das
  Level, desto auffälliger. Ab jetzt wird die **Zielmenge beim Öffnen des Auftrags
  EINMALIG eingefroren** und bleibt exakt so, bis die Mission startet, du den Auftrag
  bewusst aktualisierst/abbrichst oder ein Ziel real abgerissen wird.
- **Kein stiller Zieltausch mehr.** Wird ein eingefrorenes Lieferziel tatsächlich
  abgerissen, **verschwindet der Auftrag nicht heimlich und bekommt kein anderes
  Gebäude untergeschoben**. Stattdessen erscheint ein klarer Hinweis
  („Ein Lieferziel wurde abgerissen") mit den Optionen **Auftrag aktualisieren**
  (neue Ziele) oder **Abbrechen** — die Entscheidung bleibt bei dir.
- **Plan übersteht Save/Load und UI-Wechsel.** Der eingefrorene Auftrag wird
  gespeichert; Panel schließen/öffnen, Geschwindigkeit wechseln oder das Spiel neu
  laden lässt Ziele, Quelle und Mengen unverändert.
- **Gilt für ALLE Lieferaufträge**, nicht nur „Essen verteilen" (Holz-, Material-,
  Wasser-, Handels- und Sonderlieferungen laufen über denselben Pfad).

### Warum

- Erster Baustein des Spielbarkeits-Auftrags (Nutzer, 24.07.2026): „Lieferaufträge
  verändern während der Planung scheinbar selbstständig ihren Zustand … besonders in
  höheren Leveln wird Stadtarbeit dadurch kaum spielbar." Die **exakte Ursache**: die
  Zielmenge wurde bei **jeder** UI-Abfrage neu aus der **laufenden Simulations-RNG**
  gewürfelt (`getActivityRoutePlan` → `pickTargets`). Da die RNG **pro Tick**
  weiterläuft und die UI bei jedem Controller-`version`-Bump neu liest, wurde bei
  laufender Uhr **jeden Tick neu gemischt** — genau das sichtbare „Springen". Der
  frühere Shallow-Clone schützte nur den Save, nicht die Anzeige.

### Architektur

- **Eingefrorener Planungssnapshot `activities.selection` (Sim, CLAUDE.md §1/§2).**
  Neues, optionales, **persistiertes** Feld pro offenem Auftrag
  (`ActivityPlanningSelection`: `defId`, `createdAt`, `epoch`, `sourceBuildingId?`,
  `targetBuildingIds`). Kein neues System — nur ein zusätzliches State-Feld an der
  bestehenden `ActivitiesState`.
- **Deterministische Zielwahl statt Live-RNG.** Neue reine Helfer
  `pickTargetsSeeded()` + `activitySelectionSeed(defId, createdAt, epoch)` in
  `simulation/activities.ts` würfeln aus einem **stabilen** Seed (Stadt-`createdAt` +
  Auftrag + Epoch) — **nie** aus `state.rngSeed`. `getActivityRoutePlan` liefert den
  eingefrorenen Satz, sonst dieselbe deterministische Ableitung (Epoch 0), sodass die
  Vorschau **vor** und **nach** dem Einfrieren identisch ist (kein Flackern).
  `pickTargets` (Live-RNG) bleibt ausschließlich für den tatsächlichen Missionsstart.
- **Lebenszyklus als Commands.** `selectActivity(defId)` friert **idempotent** ein
  (sicher aus einem UI-Effekt), `refreshActivitySelection(defId)` erhöht den Epoch und
  zieht bewusst neue Ziele, `clearActivitySelection()` verwirft. `startActivity`
  räumt den Snapshot beim Übergang planning→executing. Read
  `getActivitySelectionStatus(defId)` = `none|ok|stale` steuert den UI-Hinweis.
- **UI (`ActivityRoutePlanner.tsx`).** Öffnen eines Auftrags ruft `selectActivity`;
  ein `stale`-Zustand zeigt den Aktualisieren/Abbrechen-Hinweis statt eines stillen
  Tauschs. Keine parallele Zeit, keine Auftragsgenerierung im Render.
- **Save v21, additiv (CLAUDE.md §3).** Migration `v20→v21` ergänzt nichts weiter als
  den Versionsstempel; Alt-Saves ohne `selection` bleiben ladbar und frieren beim
  nächsten Öffnen frisch ein. Zod-Schema erweitert.

### Auswirkung

- Stadtarbeit ist auch in höheren Leveln **verlässlich planbar**: die eingezeichnete
  Route passt dauerhaft zum Auftrag. Kein Datenverlust, keine Balancing-Änderung.
- Verifikation: `tsc` · ESLint · **380 Vitest grün** (neu: `activityStability.test.ts`,
  10 Fälle) · Vite-Build. Reiner 2D-Panel-/Sim-Pfad — kein 3D-Renderer berührt.

### Zukunft

- Nächste Bausteine des Spielbarkeits-Auftrags (Reihenfolge = Umsetzung): zentrale
  **Ingame-Zeit** (eine Zeitquelle, 1×/2×/4× konsistent, sichtbare Uhr), **Frühlogistik**
  (Handkarren ab L2: Holz Sägewerk→Rathauslager) + Lagerübersicht,
  **Anleger-zu-Anleger-Netz** und **Performance-Pass** mit dauerhafter FPS-Anzeige.
- Offen (bewusst, nicht vorgetäuscht): mehrere gleichzeitig eingefrorene Snapshots
  (aktuell genau einer = ein Planer); feinere Invalidierung (Ziel wird gesperrt/
  umgezogen statt abgerissen).

### Dateien

- `src/game/simulation/activities.ts` (neu: `pickTargetsSeeded`, `activitySelectionSeed`)
- `src/game/commands/controller.ts` (`getActivityRoutePlan` deterministisch; neue
  Commands `selectActivity`/`refreshActivitySelection`/`clearActivitySelection`;
  Read `getActivitySelectionStatus`; `startActivity` räumt den Snapshot)
- `src/game/types.ts` (`ActivityPlanningSelection`, `ActivitiesState.selection?`)
- `src/game/config/schemas.ts` (Zod: `activities.selection?`)
- `src/game/newGame.ts` (`SCHEMA_VERSION = 21`), `src/game/storage/migrations.ts`
  (`migrateV20ToV21`)
- `src/components/panels/ActivityRoutePlanner.tsx`, `src/styles/citywork.css`
- `tests/activityStability.test.ts` (neu), `tests/storage.test.ts` +
  `tests/transport.test.ts` (Versionsliteral v21)
- `docs/agents/ACTIVITY_STABILITY_AUDIT.md` (neu), DECISIONS **D-037**

### Assets

- Keine neuen Assets. Kein Drop-in nötig.

## v0.86 — Infrastruktur 2.0 / I2: terrainbewusster Straßen-Router, Kontrollpunkte & atomarer Bau (Save v20)

### Was

- **Straßen folgen jetzt dem Gelände statt einer starren L-Form.** Bisher füllte ein
  schneller Zug oder ein Klick auf einen entfernten Punkt die Lücke stur orthogonal
  (erst X, dann Y) — quer durch Wasser, Klippen und gesperrte Kacheln. Jetzt setzt
  man nur noch **Kontrollpunkte** (Start, beliebige Zwischenpunkte, Ziel); der
  Router verbindet sie **lückenlos über wirklich bebaubares Gelände**. Bodenstraßen
  **weichen** Wasser/Klippen **aus**, Höhenstraßen **überbrücken** sie zum bekannten
  Pfeiler-Aufpreis — automatisch, je nach gewählter Straßen-Bauklasse.
- **Klarere Vorschau-Farben (grün/gelb/rot).** Die Bauvorschau markiert jede Kachel
  jetzt eindeutig: **grün = baubar**, **gelb/amber = teuer (Brücke)**, **rot =
  blockiert**. Eine kleine Legende im Straßenplaner erklärt die Farben.
- **Atomarer Bau (alles oder nichts).** Bestätigt man den Plan, prüft der Controller
  den **ganzen** Pfad und den **Gesamtpreis** vorab und baut ihn dann in einem Zug.
  Ist ein Segment blockiert oder das Material zu knapp, wird **nichts** gebaut — kein
  halbfertiger Straßenstummel mehr, der bei einem Fehler mitten im Pfad zurückblieb.

### Warum

- I2 aus dem Infrastruktur-2.0-Auftrag (D-036): „Der Straßenentwurf verbindet
  Start→Ziel lückenlos (Snap-Points, saubere Übergänge). Vorschau: grün=möglich,
  gelb=teuer, rot=blockiert." Die alte L-Form erzeugte Zacken und Segmente, die durch
  Wasser/Klippen liefen und deshalb blockierten — gerade in der verdichteten Welt
  (D-035) unbrauchbar. Der Auftrag fasst hier die zurückgestellte 10.0-Phase **R6**
  (terrainbasierter A→B-Vorschlag, Kontrollpunkte, atomarer Command) mit ab.

### Architektur

- **Reiner Sim-Router `src/game/roads/roadRouting.ts` (CLAUDE.md §1).** Ein
  gewichtetes, deterministisches Dijkstra über die 4er-Nachbarschaft verbindet
  aufeinanderfolgende Kontrollpunkte. **Die Passierbarkeit jeder Kachel ist exakt
  `validatePlacement`** (§2): `needs_road` gilt als passierbar (der Weg stellt den
  Anschluss selbst her), jeder andere Fehler (Terrain/Belegung/gesperrte Region/
  außerhalb) macht die Kachel unpassierbar. **Kein zweites Verkehrs- oder
  Platzierungssystem** — der Router ist nur ein Vorschlag, `analyseRoadPath` bleibt
  die alleinige Wahrheit für Status/Kosten/Blockaden.
- **Gewichte:** bestehende (verbundene) Straße ≈ gratis (Wiederverwendung),
  normales Bauland günstig, Brücke/Viadukt teuer — so weicht der Router einer
  schmalen Wasserstelle nur aus, wenn der Umweg kürzer als ~sechs Landkacheln ist,
  überbrückt sie aber, wenn das klar direkter ist. Die Suche ist auf die um einen
  Rand erweiterte Bounding-Box begrenzt (nie die ganze 512²-Insel) und hart
  gedeckelt; findet sich kein Weg, füllt ein gerader Rückfall die Lücke (die Prüfung
  zeigt sie dann rot). Vollständig deterministisch (kein RNG, keine Zeit).
- **Controller:** `roadPathPreview(kontrollpunkte, defId)` routet die Punkte, bevor
  `analyseRoadPath` prüft — bereits orthogonal benachbarte Punkte routen auf sich
  selbst, dichte Pfade und alle Bestandstests bleiben also unverändert. Neuer
  atomarer Command **`buildRoadPath(kontrollpunkte, defId)`**: routet, validiert den
  ganzen Pfad + Gesamtpreis, baut alles-oder-nichts über die bestehenden
  `placeBuilding`-Platzierungen. Straßen skalieren nicht im Preis, daher entspricht
  die Vorschausumme exakt der Abbuchung (§18.3).
- **UI:** `MapView` sammelt nur noch Kontrollpunkte (`pushRoadPoint`) statt der alten
  `extendRoadDraft`-L-Füllung; die lückenlose Verbindung kommt aus dem Router. Der
  `SmartRoadPlannerHud` bestätigt über `buildRoadPath` und zeigt die Farb-Legende.
  Der Renderer-Overlay färbt `ok` grün und `bridge` amber (grün/gelb/rot).

### Auswirkung

- **Save v20 unverändert (additiv, keine Migration).** Straßen bleiben normale
  Gebäude-Instanzen; nur die Planung/der Bau-Command sind neu. Bestehende Straßen
  und Spielstände unberührt.
- Der Straßenentwurf ist reiner UI-State (Kontrollpunkte); nichts wird persistiert,
  bevor gebaut wird.

### Zukunft

- Offen (nicht vorgetäuscht): frei ziehbare Kontrollpunkt-**Griffe** (Verschieben
  bestehender Punkte), Live-Vorschau vom letzten Punkt zum Mauszeiger als eigener
  Renderer-Layer, sowie Kurven-/Diagonal-Snapping. Als Nächstes: **I3** Küste/Anleger
  als Netzknoten (= R9) · **I4** Schifffahrtsnetz · **I5** Bevölkerungs-Rebalancing +
  Infrastruktur-Netz-UI.

### Dateien

- Neu: `src/game/roads/roadRouting.ts` (Router), `tests/roadRouting.test.ts`
  (6 Tests: Lückenfüllung, Idempotenz, Wasser-Umweg, Brücken-Entscheid, atomarer
  Bau, Nichts-bei-Blockade).
- `src/game/commands/controller.ts` (`roadPathPreview` routet vor der Prüfung; neuer
  `buildRoadPath`), `src/components/MapView.tsx` (`pushRoadPoint` statt
  `extendRoadDraft`), `src/components/operations/SmartRoadPlannerHud.tsx` (atomarer
  Confirm + Legende), `src/styles/active-operations.css` (Legenden-Stil),
  `src/renderer/three/ThreeMapRenderer.ts` (Overlay-Farben grün/amber).

### Assets

- Keine neuen Assets. Brücken-Deck/Pfeiler bleiben prozedural (I1).

## v0.85 — Testbefund I1: ehrliche Höhenstraßen-Kosten, Planer-Banner & Steinbruch auf Fels (Save v20)

### Was

- **Höhenstraßen-Kosten sind jetzt vollständig sichtbar.** Der Straßenplaner zeigte
  in „Kosten" nur den **Geld**-Anteil (z. B. 57.500), obwohl eine lange Brücke auch
  viel **Holz** kostet (40/Kachel + 20/Brücke). Bei genug Geld, aber zu wenig Holz
  war der Bau-Button gesperrt, ohne dass der Grund sichtbar war. Jetzt zeigt die
  Kosten-Metrik **alle** Materialien (z. B. „57.500 · 1.660 Holz") und die Warnung
  benennt konkret, **welche** Ressource wie weit fehlt („Nicht genug Material: Holz
  582/1.660") statt pauschal „Stadtbudget".
- **Irreführendes „Braucht Anschluss…"-Banner beim Straßenplanen entfernt.** Während
  man eine Höhenstraße zieht, prüfte das kleine Ein-Kachel-Hinweisbanner oben die
  Kachel unter dem Mauszeiger **isoliert** und meldete am Brückenende fälschlich
  „Braucht Anschluss an eine verbundene Straße" — obwohl der Planer unten korrekt
  „Baubar / 0 Konflikte" zeigte. Beim Straßenplanen ist jetzt allein der
  Straßenplaner die Instanz; das widersprüchliche Banner erscheint nicht mehr.
- **Steinbruch ist auf Fels bebaubar (Nutzerwunsch).** Der Steinbruch darf jetzt
  auf sonst gesperrtem **Gebirge/Fels** stehen — thematisch schneidet er in den
  Stein. Erlaubt sind **flache Felsschelfe** (echte Steilheits-/Unebenheitsgrenze);
  senkrechte Wände und Wasser bleiben gesperrt. Rund 900 flache Fels-Standorte
  existieren inselweit (verifiziert per Bake-Scan). Höhenstraßen liefern gleich die
  passende Zufahrt hinauf.

### Warum

- In-Game-Test zeigte: Brücken funktionierten technisch (13 Brückensegmente,
  0 Konflikte, „Baubar"), aber der Bau war „ohne erkennbaren Grund" gesperrt. Ursache
  waren zwei reine **Transparenz**-Lücken (nicht die Brückenlogik): versteckte
  Holzkosten (§18.3-Verstoß „gezeigter ≠ gezahlter Preis") und ein Banner, das die
  pfad-bewusste Prüfung des Planers scheinbar widerlegte. Zusätzlich sollte der
  Steinbruch dort baubar sein, wo Stein liegt.

### Architektur

- **Kosten-Transparenz:** `SmartRoadPlanView` trägt jetzt die volle Materialkosten-
  Map (`costs`), nicht nur `cost` (Geld). Der HUD rendert sie über einen kleinen
  Multi-Ressourcen-Formatter und berechnet den konkreten Fehlbetrag aus
  `raw.totalCost` gegen `state.resources` — dieselbe Quelle wie `canAffordCost`.
- **Banner:** `MapView` unterdrückt das Ein-Kachel-`PlacementBanner`, solange eine
  Straßen-Bauklasse geplant wird (analog zum eigenständigen Waterfront-HUD). Keine
  Logikänderung an der Platzierung.
- **Steinbruch/Fels (§2, additiv):** neues optionales `BuildingDef.buildsOnRock?:
  { maxSlope? }` (Zod-validiert). `validatePlacement` bekommt einen Fels-Zweig:
  Gebirge ist erlaubter Untergrund, statt der pauschalen Gebirgs-/Klippensperre gilt
  `surface.slope ≤ maxSlope` (Vorgabe 2) und ein gekoppeltes Höhendelta; die
  Regionsprüfung bleibt (kein Bau in gesperrtem Gebiet, kein Bau ins Meer). Keine
  neue Terrain-/Platzierungslogik — nur eine gebäudeseitige Ausnahme.

### Auswirkung

- **Save v20 unverändert.** Keine neuen State-Felder, keine Migration. Reine UI- und
  Platzierungsregel-Änderungen. Bestehende Gebäude/Straßen unberührt.
- Normale Gebäude bleiben auf Fels gesperrt (nur `buildsOnRock`-Gebäude nicht).

### Zukunft

- Unverändert: I2 saubere Straßen (= R6) · I3 Küste/Anleger (= R9) · I4
  Schifffahrtsnetz · I5 Bevölkerungs-Rebalancing. Weitere `buildsOnRock`-Kandidaten
  (Bergwerk/Aussichtspunkt) sind mit demselben Feld ohne neues System möglich.

### Dateien

- `src/components/operations/viewModels.ts` (Feld `costs`),
  `src/components/operations/adapters.ts` (`buildSmartRoadPlanView` füllt `costs`),
  `src/components/operations/SmartRoadPlannerHud.tsx` (voller Kosten-Label +
  konkrete Fehlbetrags-Warnung), `src/components/MapView.tsx` (Banner beim
  Straßenplanen unterdrückt), `src/game/config/types.ts` +
  `src/game/config/schemas.ts` (`buildsOnRock`), `src/game/config/buildings.config.ts`
  (Steinbruch `buildsOnRock`), `src/game/buildings/placement.ts` (Fels-Zweig),
  `tests/quarryRock.test.ts` (neu, 3 Tests).

### Assets

- Keine. Steinbruch nutzt das vorhandene prozedurale/Drop-in-Modell; Höhenstraßen
  bleiben prozedural (§5).

## v0.84 — Infrastruktur 2.0 / I1: Höhenstraßen & Brücken (Save v20, additiv)

### Was

- **Neuer Straßentyp „Höhenstraße" (`road_elevated`, ab Level 2):** überwindet
  **Wasser/Fluss** (Brücke) und **Klippen/Steilhänge** (Viadukt) — genau das, was
  die verdichtete Welt (v0.83) bisher blockierte. Der Spieler zeichnet sie über
  denselben Straßenentwurf-Planer; über Wasser gezogene Segmente werden automatisch
  zu Brückensegmenten.
- **Automatische Brückenlogik pro Kachel:** ebenes/geneigtes Land → geländeangepasste
  Straße, Wasser/Klippe → Brückendeck mit Geländer und Pfeilern. Der Spieler wählt
  nur den Straßentyp, die Kachelentscheidung fällt aus dem Terrain.
- **Ehrliche Kosten:** Grundpreis 1.200 Geld + 40 Holz je Kachel; über tatsächlich
  überbrückten Wasser-/Klippenkacheln kommt ein Pfeiler-Aufschlag (+800 Geld,
  +20 Holz) dazu. Der Straßenentwurf zeigt Länge, Brückenzahl, Konflikte und exakte
  Gesamtkosten **vor** dem Bau (gezeigter = gezahlter Preis). Bewusst **holzbasiert**
  (Sägewerk ab L2), damit die Brücken die Welt WIRKLICH früh entsperren — Stein käme
  erst mit dem Steinbruch (L4) und würde weiter blockieren.
- **Reihenfolge geändert (Nutzerwunsch):** Die 10.0-Phasen R2–R6/R9 sind
  zurückgestellt; Infrastruktur 2.0 wurde vorgezogen, weil es der entscheidende
  Punkt zum Weiterspielen ist. R6 (Straßen A→B) und R9 (adaptive Uferplattform)
  werden innerhalb von Infrastruktur 2.0 (I2/I3) miterledigt.

### Warum

- Nach der dritten Weltverdichtung (v0.83, D-035) ist die Insel kompakter und
  steiler, mit mehr Wasser zwischen den Bauzonen. Das alte Straßensystem baute nur
  auf ebenem Land — Stadtteile ließen sich nicht über Höhen/Wasser verbinden. Der
  vorhandene, aber **tote** `'bridge'`-Kachelstatus wird jetzt real.

### Architektur

- **Straßen-Bauklasse statt zweitem System (§2, D-036):** `BuildingDef.road?:
  RoadClassDef` (`crossesWater`, `crossesCliff`, `maxSlope`, `bridgeCostPerTile`),
  Zod-validiert. `validatePlacement` liest die Bauklasse (Region-/Bebaubarkeits-
  Ausnahme NUR für die tatsächlich überbrückte Wasser-/Klippenkachel — Land unter
  einer Höhenstraße bleibt regionspflichtig). `analyseRoadPath`/`roadPathPreview`/
  `getBuildCost` sind jetzt je Straßentyp parametrisiert. Alles über denselben
  `roadNetwork`, dieselbe Anschlussprüfung — kein zweiter Verkehrsgraph.
- **Renderer:** der bereits vorhandene `buildBridgeDeck`-Pfad (Deck/Geländer/Pfeiler)
  wird endlich genutzt; Straßen über Wasser sitzen jetzt auf `WATER_LEVEL` statt auf
  dem tiefen Wasserboden. Prozedural, kein neues `.glb` (Fallback nie crashend, §5).
- **UI:** Baumenü listet die Höhenstraße automatisch (Kategorie „Straßen"); der
  Straßenplaner arbeitet für jede Straßen-Bauklasse (nicht mehr hart `'road'`).

### Auswirkung

- **Save v20 unverändert (additiv):** Höhenstraßen sind normale Gebäude-Instanzen,
  kein neues State-Feld, keine Migration nötig. Alte v20-Stände laden weiter.
- Bestehende Bodenstraßen unverändert (weiterhin auf Wasser/Klippe gesperrt).

### Zukunft (Infrastruktur 2.0, offen — nicht vorgetäuscht)

- I2 saubere Straßenstruktur (Snap/Kurven, = R6) · I3 Küste/Anleger als Netzknoten
  (= R9) · I4 Schifffahrtsnetz (persistente Routen, lineare Migration) ·
  I5 Bevölkerungs-Rebalancing + Infrastruktur-Netz-UI. Steinerne Prachtbrücken,
  Rampenlängen, echte Pfeilertiefe bis zum Wasserboden bleiben Verfeinerungen.
  Master-Spec: `docs/agents/INFRASTRUCTURE_2_PLAN.md`.

### Dateien

- Config: `config/types.ts` (`RoadClassDef` + `BuildingDef.road`),
  `config/schemas.ts` (Zod), `config/buildings.config.ts` (`road_elevated`),
  `config/levels.config.ts` (L2-Unlock), `i18n/de.json`.
- Sim: `buildings/placement.ts`, `roads/roadPlanning.ts`, `commands/controller.ts`.
- UI: `components/MapView.tsx`, `components/operations/SmartRoadPlannerHud.tsx`,
  `components/operations/adapters.ts`, `App.tsx`.
- Renderer: `renderer/three/ThreeMapRenderer.ts` (Brücken-`baseY`).
- Tests: `tests/roadElevated.test.ts` (neu, 5), `tests/manifest.test.ts` (Sonderfall
  für prozedurale Straßen), `docs/BUILDINGS.md` (regeneriert).
- Doku: `INFRASTRUCTURE_2_PLAN.md` (neu), `DECISIONS.md` (D-036), `OPEN_TASKS.md`,
  `BACKLOG.md`, `3D_MODEL_MANIFEST.md`.

### Assets

- Keine neuen Pflicht-Assets. Optionale Drop-ins bleiben `road_bridge_deck`/
  `road_boardwalk` (Texturen, `docs/ROAD_TEXTURES.md`) — bis dahin Flächenfarbe.

## v0.83 — § 10.0 R7/R8: Dritte Weltverdichtung + flacher Uferübergang (Save v20)

### Was

- **Dritte horizontale Verdichtung (X/Z ≈ 0,84 zusätzlich):** Der Offline-Bake
  spannt die Referenz-GLB jetzt über 314 statt 374 Kacheln (Ozeanrand 99). Faktor
  0,7476 gegenüber der Ur-Insel (Fläche ≈ 0,559, ~−44 %). Gipfelhöhe bleibt bei 52
  Welt-Einheiten (Y getrennt abgestimmt, Auftrag §1.3) — die Gebirge bleiben
  monumental.
- **Flacher Uferübergang (Nutzerwunsch):** Angehobene Wasserlinie (0,0065→0,0075),
  breiterer/flacherer Strandsaum (Blend 6→9 Kacheln, Anstieg 0,42→0,28, Klippen­
  schwelle 7,2→9,0) und breiteres Sandband. Ergebnis: **direkt wassernahe,
  bebaubare Uferkacheln 636 → 1.210** und Sand 4.181 → 7.861 — deutlich
  hafen-/wassergebäude-tauglicher.
- **Neuer zentraler Start:** Region 9 „Zentralland", Rathaus (127,250), sehr flach
  (ΔH 0,36), **1.668 bebaubare Kacheln**, endlich mit echtem Küstenzugang (136
  Küstenkanten), Ressourcen-Score 1,0, Waldrand direkt angrenzend (Sägewerk-Nachschub).
- **13 organische Regionen** (statt zuvor 13; Layout komplett neu geschnitten):
  Startkomponente {9,3,8,11,7,13} über Land, Südkomponente {2,5,4} und Einzelinseln
  {1,6,10,12} über See (`requiresHarbor`). Namen/Progression/Kosten in
  `regions.config.ts` neu abgeleitet; Kosten folgen weiter dem Faktormodell
  (`regionCost.ts`), Endgame „Kronengebirge" (1) bei L20 ≈ 5,98 Mio.

### Warum

- Auftrag § 10.0 R7/R8 (Final World Compaction) verlangt eine spürbar kompaktere
  Insel mit einem echten, langfristig tragfähigen zentralen Stadtzentrum. Der frühere
  steile Küstenabfall war schlecht für Hafen-/Wassergebäude-Platzierung — daher das
  weiche Uferprofil zusätzlich zur Verdichtung.

### Architektur

- Reiner Offline-Bake (`tools/bakeWorld.mjs`) → committete `*.gen.ts`; die GLB wird
  nie zur Laufzeit geladen. Region-Zugehörigkeit bleibt allein `regionIdAt`; Kosten/
  Progression bleiben datengetrieben und testgeprüft. Keine zweite Weltquelle.
- **Save v20** (Weltumbau wie v14/v16/v19): jede Koordinate/Region-Id ändert sich →
  `migrateV19ToV20` sichert alte Stände einmalig unter `cmb.save.backup.world-v19`
  und startet neu. Keine verlustbehaftete Projektion.

### Auswirkung

- Gesamt-Bauflächen 34.082 → 25.092 (−26 % ggü. v0.82; die kompaktere Welt ist der
  Sinn der Final Compaction, das weiche Ufer fängt einen Teil des Verlusts ab).
  Gebirgs-/Inselregionen sind bewusst bauflächenlean (Wert = Rohstoff/Strategie).
- Baugelände ist durch die Stauchung etwas steiler als in der alten flachen Welt
  (Test-Toleranzen entsprechend an die Bake-Glättung angepasst, nicht geschönt).
- Alle Dev-Spielstände (v10–v19) werden einmalig gesichert und neu gestartet.

### Zukunft

- Feinschliff des Uferprofils bleibt möglich (mehr/weniger Strand pro Küstenteil).
  Stärkere Bau-Glättung ist als Option offen, falls Platzierungen zu steil wirken
  (kostet etwas Baufläche). R9 (adaptive Uferplattform) baut auf den nun reichlichen
  Waterfront-Kacheln auf.

### Dateien

- Bake: `tools/bakeWorld.mjs` (Verdichtungs-/Uferkonstanten), regeneriert:
  `src/game/config/world/island*.gen.ts`, `src/renderer/three/worldHeight.gen.ts`,
  `worldMasks.gen.ts`, `tools/bake-report.md`, `tools/bake-preview.png`.
- Config/i18n: `src/game/config/regions.config.ts`, `src/i18n/de.json`
  (region.r1–r13), generiert: `docs/REGIONS.md`.
- Save: `src/game/newGame.ts` (SCHEMA_VERSION 20), `src/game/storage/migrations.ts`
  (`migrateV19ToV20`), `src/game/storage/localStorageAdapter.ts` (world-v19-Backup).
- Tests: `regions`, `regionCost`, `world.gen`, `regionPreview`, `newIslandBake`,
  `terrainHeight`, `placement`, `storage`, `transport` an das neue Layout angepasst
  (356/356 grün).

### Assets

- Keine neuen Binärassets; die Welt entsteht deterministisch aus der bestehenden
  Referenz-GLB. `bake-preview.png` neu generiert.

## v0.82 — Visual Active Operations, Ressourcennetz & Infrastruktur

### Was

- **Fokussierter Arbeitsgebietsmodus:** Sägewerk bleibt in der echten 3D-Welt;
  darüber liegen terrainfolgende Fläche, effizienter/maximaler Ring,
  instanzierte Ressourcenpunkte, Wege und Mittelpunkt. Einzel-, Kreis- und
  Ausschlussauswahl sind bedienbar; Rechteck/Polygon zeigen einen erklärten
  Sperrzustand. Cursor-Tooltip und feste Legende erklären Ertrag, Distanz,
  Effizienz und Status.
- **Betriebsfenster mit vier Tabs:** Übersicht, Lager, Aufträge, Upgrades.
  Echte Arbeiterzustände, lokales Lager/Reserve/Transportmenge,
  Auftragspreview und Config-Stufen mit Gebäudeartwork. Eine nicht vorhandene
  Durchsatzhistorie wird nicht geschätzt, sondern als „Nicht angebunden“ gezeigt.
- **Ressourcen-Gesamtnetz aus dem HUD:** global verfügbarer Pool und echte lokale
  Betriebslager/Transporte, eindeutige Regions-/Richtungsnamen, Kapazitäten,
  Kartenfokus und Details. Keine erfundene Rathaus-/Lagerhaus-Aufteilung.
- **Transportplanung:** Quelle→Methode→Ziel, echte Menge, Fahrzeugwerte,
  Ladungszahl, Route, Dauer, Straßenanteil und Betriebskosten. Handkarren ist
  hochwertig sichtbar, aber mangels Controller-Vertrag klar deaktiviert.
- **Stadtarbeit:** Ladung vor/nach jedem echten Cargo-Stopp samt Delta und
  Nachfüllmarkierung.
- **Straßenplanung:** Klick/Drag erzeugt einen noch nicht gebauten Entwurf.
  Start/Ziel/Kosten/Brücken/Blockaden werden vorab angezeigt; Bau erst nach
  Bestätigung. Alternative Route bleibt erklärt gesperrt.
- **Wassergebäude:** spezialisiertes Platzierungs-HUD, reales Drop-in-GLB als
  transparenter Ghost (prozeduraler Fallback), Plattform, weiße Pfeiler,
  Wasseranker, Tiefe, Fundamentausgleich und Rotation.
- **Region/Dev:** Emoji im Gratis-Badge durch SVG ersetzt; Dev-Panel zeigt den
  dokumentarischen Weltverdichtungsvergleich.

### Warum

Das Referenzbild erklärt neun Systeme gleichzeitig, wäre als echter Bildschirm
aber eine Dashboard-Wand. Die Umsetzung trennt die Zustände und hält die Welt
bedienbar. Gleichzeitig müssen fehlende Simulationsdaten sichtbar bleiben, ohne
falsche Bestände, Durchsatzraten oder Fahrzeugfähigkeiten vorzutäuschen.

### Architektur

- `viewModels.ts` definiert renderer- und state-freie Visual-Verträge sowie
  Callback-Interfaces. `adapters.ts` befüllt sie ausschließlich aus vorhandenen
  Controller-Read-Helpern. Dev-Szenarien liegen getrennt unter `src/dev`.
- UI-Store hält nur Arbeitsgebiet-, Ressourcennetz- und Straßenentwürfe. Erst
  Primäraktionen rufen vorhandene Commands auf; React mutiert keinen `GameState`.
- Renderer ergänzt `setWorkAreaOverlay` und `setRoadPlanOverlay`. Fläche/Linien
  sind gebündelt, Knoten/Straßen instanziert und identische Arbeitsgebiete
  signaturgecacht.
- Straßenbau nutzt weiterhin die eine Placement-Logik. Mangels atomarem
  Pfad-Command wird ein komplett validierter/finanzierbarer Entwurf beim
  Bestätigen über die bestehenden Kachel-Commands ausgeführt.
- Zentrale semantische `--ui-*`-Tokens und gemeinsame Panel-/Metric-/Capacity-/
  Status-Komponenten; keine zweite UI-Bibliothek.

### Auswirkung

- Keine Wirtschaftsformel, kein Balancing, kein neues Simulationssystem.
- Save-Schema bleibt **v19**, keine Migration.
- Browser-/Desktop-Codebasis bleibt gemeinsam; Assets laufen über Registry und
  Fallbacks.
- Responsive Breakpoints decken 1920×1080, 1600×900, 1440×900 und 1366×768 mit
  internen Scrollflächen und erreichbaren Primäraktionen ab.

### Zukunft

- Durchsatz-ReadModel, Handkarren, physische Zwischenlager und optionale
  Nachfüllquellen aus der Simulation anbinden.
- Atomaren Straßenpfad-Command, Alternativrouten, Kontrollpunkte,
  Steigung/Viadukt/Abriss sowie wirtschaftliche Waterfront-Pfeilerwerte liefern.
- Rechteck/Polygon und echte Baum-Mesh-Raycast-Auswahl danach freischalten;
  Fäll-/Trag-Clips als Drop-in-Animationen ergänzen.

### Dateien / Assets

- UI: `components/{operations,logistics,common,world}/**`,
  `FloatingBuildingSheet.tsx`, `TourOverview.tsx`, `ResourceDetailPopover.tsx`,
  `MapView.tsx`, `App.tsx`.
- Renderer/State: `IMapRenderer.ts`, `ThreeMapRenderer.ts`,
  `CameraInputController.ts`, `state/store.ts`.
- Styling: `styles/active-operations.css`.
- Tests: `tests/activeOperationsViewModels.test.ts`,
  `tests/activeOperationsComponents.test.ts`.
- Dokumentation: sieben neue Active-Operations-System-/Handoff-Dateien plus
  Projektstand, offene Aufgaben, Handoff-Log und Komponentenkarte.
- Keine neuen Binärassets; Lucide-SVG, Registry-Bilder/GLBs und bestehende
  Fallbacks.

### Verifikation

- `npx tsc -b --force`, `npx eslint src tests`, **354/354 Tests in 47 Dateien**
  und `npm run build` sind grün. Preview unter Basis-URL `/`: HTTP 200.
- Der verpflichtende Runtime-Screenshot-Smoke blieb in dieser Sitzung
  infrastrukturseitig blockiert, weil die integrierte Browsersteuerung keine
  Browserinstanz bereitstellte. Es wurde kein externer Browser-Fallback verwendet
  und keine visuelle Freigabe vorgetäuscht.
- `npm run tauri:build` wurde ausgeführt und stoppte vor der nativen Kompilierung
  bei `cargo metadata: program not found`. Der Browser-/Frontend-Build selbst ist
  erfolgreich; für den nativen Build fehlt auf diesem Rechner die Rust-/Cargo-
  Toolchain.

## v0.81 — Fog of War: globale Wolkenfront & Kamera-Grenzen (§ Change 9.0, Phase S3)

### Was

- **Eine zusammenhängende, weiche Wolkenfront** statt vieler weißer Einzelkuppeln:
  gesperrte Regionen verschwinden hinter einer durchgehenden, fluffig
  ausgefransten Nebeldecke (§6.1–§6.3). Benachbarte Sperrgebiete bilden EINE Front
  auf **einer gemeinsamen, absoluten Höhe**; flaches und hügeliges Land wird
  blickdicht verdeckt, echte Gebirgsgipfel ragen bewusst als Silhouette heraus
  (§6.4).
- **Kamera-Grenzen (neu):** Die Kamera bleibt über den freigeschalteten Regionen.
  Nähert sich das Blickziel der Sperrgrenze, wird es abgebremst und weich
  zurückgeführt — kein Flug in gesperrtes Gebiet mehr (§7). Wächst mit jeder
  Freischaltung automatisch mit.
- **Dev-Cheat „Kamera-Grenzen deaktivieren"** — getrennt von „Regionsnebel
  deaktivieren" (§7.3), für freie Screenshot-Flüge ohne den Nebel abzuschalten.

### Warum

Die alte Lösung baute pro gesperrter Region ein eigenes Nebelvolumen mit einem
gedeckelten Ellipsoid-`InstancedMesh` — im Screenshot zerfiel die Wand sichtbar in
weiße Kapseln, jede Region hatte eine eigene Nebelhöhe (Stufen zwischen Nachbarn),
und die Kamera konnte ungehindert über gesperrte Landschaften fliegen und sie
einsehen. Das Mockup verlangt eine geschlossene, ruhige Wolkensee ums Startgebiet.

### Architektur

- **Globale Nebelhöhe (`worldFogTopY`, S3a):** einmal aus dem gebackenen Höhenfeld
  als 86. Perzentil aller Landhöhen bestimmt und gecacht — ersetzt die frühere
  Pro-Region-Höhe `max(WATER_LEVEL+5.5, maxH+4.8)`. Alle Regionen teilen dieselbe
  Deckenhöhe → eine durchgehende Front.
- **Weiche Wolken statt Kapseln (S3a):** dieselben instanzierten Ballen, aber mit
  **Alpha-Hash-Dithering** (`alphaHash`, ordnungsunabhängig, kein Sortierfehler),
  geringerer Deckkraft und dichter überlappenden, kleineren Ballen (Cap 168→240) —
  die Silhouetten verschmelzen zu einer fluffigen Masse. Grunddecke + weiche
  Wandballen (lokaler Boden → globale Decke) + Innenballen bleiben; die
  Aufdeck-Animation und die Klick-Marker (Schloss/Level) bleiben unverändert.
- **Kamera-Grenze (`CameraExplorationBoundary`, S3b):** reines, three-freies
  Datenmodell (Nearest-Feature-Distanzfeld per 2-Pass-Chamfer aus derselben
  `regionIdAt`-Maske). `CameraController3D.clampTarget` führt das Ziel nach dem
  Welt-Rechteck zusätzlich auf die freigeschaltete Union + weiches Randband zurück
  und bremst die Pan-Inertia im Randband. Der Renderer baut die Grenze bei jedem
  Unlock/Cheat neu (`updateCameraBoundary`, Signatur-gecacht).
- **Cheat-Trennung (S3c):** `WorldRevealState.cameraBoundsDisabled` (nicht
  persistiert) getrennt von `fogDisabled`/`revealLockedRegionsVisually`; Store,
  DebugPanel-Button und MapView-Sync durchgereicht.
- **Unlock-Retract (S3d, verifiziert):** Der Nebel wird beim Freischalten nur
  zurückgezogen (Fade in der persistenten `fogVolumes`-Map), NIE neu erzeugt —
  `rebuildTerrainIfNeeded` entsorgt nur `terrainGroup`, nicht `fogGroup`. Terrain-
  Deko/Vegetation werden zwar noch voll neu gebaut, aber **deterministisch**
  (Hash → identische Platzierung, kein sichtbarer Prop-Sprung, gleiche
  Instanzzahl vor/nach Unlock). Der verschwenderische Voll-Neuaufbau wird in S4
  (Chunk-/HLOD-Vegetation) inkrementell — bewusst dort, nicht hier vorgetäuscht.

### Auswirkung

- **346 Tests grün** (+6: `CameraExplorationBoundary` + Controller-Integration in
  `camera.test.ts`). tsc/eslint/build sauber. 3D-Smoke 1600×900 (msedge):
  `{boot:true, errors:[]}` — die Wolkensee ums Startgebiet ist weich und
  geschlossen, keine Einzelkapseln; die Kamera hält über dem freigeschalteten
  Zentralland. Reine Darstellung/Navigation — **keine Simulation, keine
  Save-Änderung** (Schema bleibt v19).

### Zukunft

- S4 Vegetations-Performance (Chunk-Streaming, HLOD-Waldcluster, Impostoren,
  Shader-Wind, Waldboden-Schattenmaske) — enthält den inkrementellen Deko-/
  Vegetations-Neuaufbau aus S3d. S5 lebendige Welt, S6–S8 aktiver Arbeitsmodus.
- Optional feinjustierbar: Perzentil der globalen Nebelhöhe und das weiche
  Randband der Kamera-Grenze (soft 10 / hard 18 Kacheln) — auf Zielhardware.

### Dateien / Assets

- Renderer: `src/renderer/three/ThreeMapRenderer.ts` (`worldFogTopY`,
  `createFogVolume` alphaHash/Dichte, `updateCameraBoundary`),
  `CameraController3D.ts` (Grenze in `clampTarget`), neue
  `CameraExplorationBoundary.ts`, `IMapRenderer.ts` (`cameraBoundsDisabled`).
- UI/State: `state/store.ts` (`toggleCameraBounds`), `panels/DebugPanel.tsx`,
  `components/MapView.tsx`, `i18n/de.json` (`ui.debug.camera_bounds_*`).
- Tests: `tests/camera.test.ts` (+6). Docs: `docs/agents/FOG_OF_WAR_AUDIT.md`
  (Umsetzungsstand), `DECISIONS.md` (D-034). Keine Assets.

## v0.80 — Zentraler Start & Regionsbalancing (§ Change 9.0, Phase S1/S2)

### Was

- **Die Startregion ist jetzt das echte Zentrum:** statt der kleinen 820-Kachel-
  Pocket ein zusammenhängender zentraler Kern mit **1.400 gut bebaubaren Kacheln**
  (§3.3) — Platz für eine echte Anfangsstadt (20–35 Gebäude, Straßennetz,
  Wohnblöcke, Sägewerk, Farm, Gewerbe). Zentralität und alle vier
  Expansionsrichtungen (Score 1.0) verbessert; Ressourcen-/Infrastruktur-Score 1.0.
- **Level-3-Erstwahl** funktioniert an den echten Startnachbarn **{7 Westweiden,
  12 Nordwald}** (eine gratis, §5.2/§6).
- Regionen, Namen, Level und Kosten an den neuen Bake angepasst.

### Warum

Der alte Start war zu klein, lag nicht überzeugend im Zentrum und lief nach
wenigen Gebäuden voll (§0). Der Auftrag verlangt einen zentralen, langfristig
tragfähigen Stadtkern.

### Architektur

- **Kein manuelles Verschieben (§3.2):** Der Offline-Bake (`tools/bakeWorld.mjs`)
  bewertet die zentralen Kandidaten selbst; nur seine Zielvorgabe wurde von 820 auf
  **1.400** bebaubare Kacheln umgestellt (Korridor 1.200–1.750). Neu gebacken →
  `world/*.gen.ts` regeneriert.
- **Forst-Id-Rotation:** Der größere Start-Carve hat die drei Wald-Regions-Ids
  verschoben (physischer Nordwald 10→12, Südforst 12→11, Ostforst 11→10). Config,
  i18n-Namen und Freischaltbaum wurden entsprechend nachgezogen; jede Region bleibt
  über Land oder See (Hafen) erreichbar.
- **Save-Schema v19:** echter Weltumbau (neuer Rathausanker, neue Region-Zuschnitte)
  → Migration `v18→v19` sichert alte Stände einmalig unter
  `cmb.save.backup.world-v18` und startet transparent neu (Präzedenz v14/v16).
- Reine Sim/Config-Änderung; kein Renderer-Umbau (Nebel/Performance folgen S3/S4).

### Auswirkung

- **340 Tests grün.** Betroffene Region-/Bake-/Save-Tests neu abgeglichen
  (Startgröße 1.200–1.600, L3-Wahl {7,12}, v18-Backup). tsc/eslint/build sauber,
  3D-Smoke `{boot,buildOpened,errors:[]}` — der größere Start rendert.

### Zukunft

- S3 Fog of War (globale Wolkenfront + Kamera-Clamping), S4 Vegetations-Performance
  (Chunking/HLOD/Shader-Wind), S5 lebendige Welt, S6–S8 aktiver Arbeitsmodus. Audits:
  `CENTRAL_START_REGION_AUDIT`, `FOG_OF_WAR_AUDIT`, `WORLD_RENDERING_PERFORMANCE_AUDIT`,
  `ACTIVE_RESOURCE_WORK_PLAN`. Entscheidung: D-033.

### Dateien / Assets

- Bake: `tools/bakeWorld.mjs` (Startziele), regenerierte `world/*.gen.ts`,
  `worldHeight.gen.ts`, `worldMasks.gen.ts`, `bake-report.md`, `bake-preview.png`.
- Config/i18n/Docs: `regions.config.ts`, `i18n/de.json` (Forstnamen),
  `docs/REGIONS.md`/`BUILDINGS.md` (generiert).
- Save: `newGame.ts` (v19), `storage/migrations.ts` (v18→v19),
  `storage/localStorageAdapter.ts` (Backup-Key), re-baselinte Tests.

## v0.79 — Lagertransport ins Zentrallager (Active Operations 2.0, Phase A5)

### Was

- **Neuer Transport-Loop:** Lokal geerntetes Holz ist nicht mehr für immer im
  Betriebslager gefangen. Im Gebäudefenster planst du unter **„Transport"** eine
  Fahrt zu einem Lagergebäude (Rathaus/Lagerhaus = Zentrallager): Ziel + Fahrzeug
  wählen, Vorschau (Ladung, Strecke, Fahrzeit, Straßenanschluss) prüfen, starten.
- **Fahrzeug fährt sichtbar:** Ein gepooltes 3D-Fahrzeug fährt entlang der Straße
  von der Quelle zum Ziel; erst mit der **Einlagerung am Ziel** wird das Holz im
  globalen Lager (obere HUD-Leiste) verfügbar.
- **Reservierung & Voll-Loop:** Beim Anlegen wird die Ladung im Quell-Lager
  reserviert; beim Beladen physisch aufs Fahrzeug übernommen; nach der Fahrt am
  Ziel eingelagert.
- **Mehrfachladung / Nachfüllfahrten:** Ein Transport darf das ganze Lager
  umfassen — das Fahrzeug pendelt in mehreren Fahrten (leerer Rückweg), die
  Vorschau zeigt Fahrtenzahl und Gesamtdauer.
- **Rückruf jederzeit:** Ein laufender Transport lässt sich zurückrufen; die
  bereits verladene Ladung kehrt ins Quell-Lager zurück, offene Reservierungen
  werden gelöst (bereits gelieferte Teilmengen bleiben global).
- **Betriebskosten:** Jede tatsächlich gefahrene Ladung kostet die
  Fahrzeug-Betriebskosten (Geldsenke, §15) — sichtbar in der Vorschau.
- **Ehrliche Warnungen:** kein Fahrzeug, kein Straßenanschluss (längere Fahrt),
  mehrere Ladungen nötig.

### Warum

§7.2/§8 verlangen, dass lokal vorhandene Ressourcen **nicht automatisch** überall
nutzbar sind — der Weg ins Zentrallager muss über echten Transport laufen. Damit
wird der aktive Betriebs-Loop erst spielbar geschlossen: fällen → lokal lagern →
transportieren → global bauen.

### Architektur

- Neues reines Simulationsmodul `src/game/operations/transport.ts` (kein
  Renderer/React, CLAUDE.md §1). Es **verwendet die bestehende Logistik wieder**
  (`activities/routeAnalysis.ts` für Route/Distanz/Verkehr/Fahrzeit,
  `activities/logistics.ts` für Fahrzeugkapazität) — **kein zweites System** (§8).
- Zustandsmaschine `loading → in_transit → unloading → delivered`, gefahren von
  `advanceTransfers` in `advanceLiveEconomy`. Zeitfaktor/Pause/Offline erben das
  `dtMin`-Verhalten automatisch (keine Offline-Fahrt). `derived.storageCaps`
  deckelt die Einlagerung; `stats.produced` wird **nicht** doppelt gezählt.
- **Netzwerk-Übersicht** (`getInventoryNetworkOverview`) schlüsselt jede Ressource
  auf: global · lokal gebunden · reserviert · unterwegs (§7.2).
- Save-Schema **v18**: additives, optionales `operations.transfers`. Migration
  `v17→v18` ergänzt ein leeres `transfers`; **alte Saves bleiben ladbar**, keine
  Weltänderung.
- Renderer zeichnet Transporte **additiv** als gepoolte Fahrzeuge an ihrer aus der
  Simulation interpolierten Position (konstante Draw-Calls, keine Logik). Die
  Straßen-Polyline wird deterministisch rekonstruiert, nicht persistiert.

### Auswirkung

- Sägewerkholz wird spielbar/global — über echten Transport, nicht per Magie. Der
  passive Steinbruch/Farm-Pfad bleibt unverändert (A6/A7 folgen).
- **339 Tests grün** (davon 12 Transporttests), tsc/eslint/build sauber.

### Zukunft

- A6 Steinbruch, A7 Farm, A8 Feuerwehr-Dispatch, A9 Aufforstung, A10
  Automatisierung (wiederkehrende Transporte auf Basis von
  `createInventoryTransfer`). Offen bleiben Zwischenlager-Lagerhäuser als eigene
  lokale Puffer. Siehe `docs/agents/LOGISTICS_INTEGRATION.md` und `OPEN_TASKS.md`.

### Dateien / Assets

- Neu: `src/game/operations/transport.ts`, `tests/transport.test.ts`.
- Geändert: `types.ts`, `config/schemas.ts`, `operations/operations.ts`,
  `simulation/tick.ts`, `commands/controller.ts`, `newGame.ts`,
  `storage/migrations.ts`, `components/panels/FloatingBuildingSheet.tsx`,
  `styles/components.css`, `i18n/de.json`, `renderer/three/ThreeMapRenderer.ts`,
  `docs/agents/LOGISTICS_INTEGRATION.md`, `storage.test.ts` (v18).
- Keine neuen Kunst-Assets nötig (Fahrzeug ist eine gepoolte Prozedurbox; echte
  `.glb` sind Drop-in für später).

## v0.78 — Aktive Betriebe: Sägewerk-Referenzschnitt (Active Operations 2.0)

### Was

- Das **Sägewerk erzeugt kein passives Holz mehr**. Stattdessen erteilt der
  Spieler einen Arbeitsauftrag; **Arbeiter laufen sichtbar** zu Bäumen, fällen
  sie, tragen das Holz zurück und lagern es im **lokalen Betriebslager** ein.
- **Ressourcenknoten (Bäume)** sind echte Simulationsobjekte mit stabiler Id
  (`"x,y"`), deterministisch aus Wald-Kacheln abgeleitet; nur Deltas (angearbeitet/
  reserviert/erschöpft/nachwachsend) werden gespeichert. Gefällte Bäume wachsen
  nach der Regenerationszeit nur auf gültigem Terrain nach.
- **Lokales Lager** je Betrieb; ein **volles Lager stoppt die Arbeit**
  nachvollziehbar. Holz erscheint **nicht** mehr automatisch im globalen Lager.
- Neues Gebäudefenster: **Betriebsbereich** mit großem Aktionsbutton „Aktiv Holz
  gewinnen", Arbeiter-, Auftrags- und Lageranzeige, Ertrags-/Dauervorschau und
  ehrlichen Warnungen (Lager reicht nicht / keine Bäume in Reichweite).
- **Höhere Ausbaustufen** verbessern Arbeiter, Tempo, Traglast und Lager statt
  pauschal „+X/min".

### Warum

Der Auftrag verlangt einen aktiven Aufbau-/Logistik-Loop statt eines passiven
Ressourcen-Timers: Arbeit planen, Menschen einsetzen, lokale Bestände verwalten
(§0/§1). Das Sägewerk ist der vorgeschriebene vertikale Referenzschnitt (§27).

### Architektur

- Neues, reines Simulationsmodul `src/game/operations/**` (nodes + operations);
  **kein** Renderer/React-Import (CLAUDE.md §1). Betriebe mit `BuildingDef.operation`
  überspringen den passiven `produce`-Pfad in Tick **und** Derived.
- Zeitfaktor/Pause/Offline erben automatisch das bestehende `dtMin`-Verhalten
  (keine Offline-Produktion, §26.22/23).
- Save-Schema **v17**: additives, optionales `operations`-Feld (lokale Lager,
  Arbeiter, aktive Aufträge, Knoten-Deltas). Migration `v16→v17` ergänzt ein
  leeres `operations`; **alte Saves bleiben ladbar**, globale Ressourcen bleiben
  als Zentral-/Übergangsbestand erhalten (§21).
- Renderer zeichnet Arbeiter **additiv** als gepoolte Figuren an ihrer Sim-Tile-
  Position (konstante Draw-Calls) — er besitzt keinerlei Logik.

### Auswirkung

- Sägewerkholz ist bis Phase A5 (Transport) **bewusst lokal gebunden**; die übrige
  Ökonomie (Steinbruch/Farm/Wasser/Handel) läuft unverändert. Betroffene
  Passiv-Produktionstests wurden auf den weiterhin passiven Steinbruch umgestellt.
- **327 Tests grün** (davon 9 neue Operationstests), tsc/eslint/build sauber.

### Zukunft

- A5 Transport/Lieferketten (Fahrzeug/Route/Straßenqualität → Zentrallager),
  A6 Steinbruch, A7 Farm, A8 Feuerwehr-Dispatch, A9 Aufforstung/neue Vorkommen,
  A10 Automatisierung. 3D-Arbeitsanimationen + Einzelbaum-Raycast im Arbeitsmodus.
  Siehe `docs/agents/ACTIVE_OPERATIONS_PLAN.md` und `OPEN_TASKS.md`.

### Dateien / Assets

- Neu: `src/game/operations/nodes.ts`, `src/game/operations/operations.ts`,
  `tests/operations.test.ts`, `docs/agents/ACTIVE_OPERATIONS_PLAN.md`,
  `RESOURCE_NODE_SYSTEM.md`, `LOCAL_INVENTORY_SYSTEM.md`,
  `WORKER_OPERATION_SYSTEM.md`, `LOGISTICS_INTEGRATION.md`.
- Geändert: `types.ts`, `config/types.ts`, `config/schemas.ts`,
  `config/buildings.config.ts` (Sägewerk-`operation`), `simulation/tick.ts`,
  `simulation/derived.ts`, `commands/controller.ts`, `newGame.ts`,
  `storage/migrations.ts`, `components/panels/FloatingBuildingSheet.tsx`,
  `styles/components.css`, `i18n/de.json`, `renderer/three/ThreeMapRenderer.ts`,
  re-baselinte Tests (simulation/systems/upgrade/activeplay/populationBalance/storage).
- Keine neuen Kunst-Assets nötig (Arbeiter sind gepoolte Prozedur-Figuren;
  echte `.glb`/Animationen sind Drop-in für später).

## v0.77 — Vegetations-Performance & Grafikqualität (Säule B)

### Was

- **Vier Grafik-Qualitätsstufen** (Niedrig / Mittel / Hoch / Ultra), wählbar in
  den Einstellungen. Jede Stufe hat konkrete Zahlen für Vegetationsdichte,
  Sichtweiten, LOD-Grenzen, Schattenbudget, Tierbudget und Renderauflösung.
- Die **Vegetationsmenge bleibt hoch** — nur ihre Darstellung wird mit der
  Entfernung und der Stufe vereinfacht (echte Instanzreduktion über skalierte
  Pro-Region-Budgets, nie unter der Hälfte auf „Niedrig").
- **Striktes Schattenbudget**: Vegetationsschatten sind auf „Niedrig" aus und
  sonst auf eine feste Zahl schattenwerfender Groß-Props gedeckelt.
- Renderauflösung, Nahdetail-Distanz und die Zahl animierter Weidetiere folgen
  jetzt der gewählten Stufe.
- **Dev-Performance-Panel** (Debug): FPS, Draw-Calls, Dreiecke,
  Vegetations-Instanzen/-Gruppen und aktive Stufe live — Optimierung an
  Messwerten statt an einem Gefühl.

### Warum

Die Insel soll dicht bewachsen bleiben, aber auf schwächerer Hardware flüssig
laufen. Statt die Vegetation auszudünnen, wird ihre technische Repräsentation
mit Entfernung und Qualitätsstufe vereinfacht — die Kernszene bleibt erhalten.

### Architektur

- Neue reine, getestete Schicht: `graphicsQuality.ts` (vier Profile + LOD-
  Funktion), `graphicsSettings.ts` (persistierter Store, kein Save-Bezug),
  `perfStats.ts` (Renderer→HUD-Telemetrie). Alle ohne three/react-Import.
- Der Renderer liest das aktive Profil in `rebuildVegetation` (Dichte, Schatten)
  und im Frame (Nahdetail); ein Qualitätswechsel baut nur die Vegetationsgruppe
  neu auf, nicht die ganze Welt. Der Nebel-Cheat erzwingt keine Maximalqualität.
- Bereits vorhandene Grundlagen genutzt: InstancedMesh je Proptyp (konstante
  Draw-Calls), deterministische Pro-Region-Budgets, Frustum-Culling.

### Auswirkung

- Kein Save-Schema-Bump (Grafikstufe liegt außerhalb des Saves). 318 Tests grün
  (neu: `graphicsQuality.test.ts`). 3D-Screenshot-Smoke über alle vier Stufen
  fehlerfrei.

### Zukunft

- Ausbaustufe mit bereitliegender LOD-Schicht (OPEN_TASKS P0): HLOD-Waldcluster,
  Impostor-Billboards, Chunk-Streaming, Shader-Wind, Textur-Atlas-Merging,
  Waldboden-Schattenmaske. Auf Zielhardware zu vermessen.

### Dateien

- `src/renderer/three/graphicsQuality.ts`, `graphicsSettings.ts`, `perfStats.ts`
- `src/renderer/three/ThreeMapRenderer.ts` (Anbindung)
- `src/components/panels/PerformancePanel.tsx`, `SettingsPanel.tsx`,
  `DebugPanel.tsx`, `src/styles/components.css`, `src/i18n/de.json`
- `docs/agents/WORLD_PERFORMANCE_AUDIT.md`, `tests/graphicsQuality.test.ts`

### Assets

- Keine neuen Assets.

## v0.76 — Final World Compaction & 12-Regionen-Progression (Säule A)

### Was

- Die Insel wurde ein **zweites Mal** horizontal verdichtet: Quellspannweite
  420 → 374 Kacheln (linearer Faktor 0,8905, Fläche −20,7 %). Die Gebirge bleiben
  monumental — die Höhe wurde getrennt sogar leicht angehoben (Gipfel 50 → 52).
  Gebäude, Straßen und Fahrzeuge wurden **nicht** mitskaliert.
- Aus 40 kleinteiligen Regionen sind **eine zentrale Startregion plus zwölf
  bedeutende Freischaltungen** geworden. Jede Erweiterung hat jetzt echten
  Bauwert (Ø 2 622 statt ~1 120 bebaubare Kacheln) und eigenen Charakter.
- Die **erste Erweiterung ab Level 3 ist gratis**: Der Spieler wählt eine seiner
  beiden Nachbarlandschaften (Nordwald oder Westweiden) kostenlos — ohne Geld-,
  XP- oder Bürgeranliegen-Nebenwirkung. Ein einmaliger Willkommenshinweis führt
  hin, der Regionsdialog zeigt „🎁 Erste Erweiterung gratis".
- Die Quellinsel ist ein **Archipel**: Regionen ohne Landanschluss verlangen
  einen echten **Hafen** (`dock_small`/`river_port`) in einer erschlossenen
  Region. Der Regionsdialog benennt „Hafen nötig" bzw. „grenzt an kein
  erschlossenes Gebiet" ehrlich, statt nur den Knopf zu sperren.
- **Regionspreise folgen einem nachvollziehbaren Faktormodell** (Baufläche,
  Ressourcenwert, Erschließungsaufwand, strategischer Zugang, Biomseltenheit,
  Progressionsstufe) — keine frei gegriffenen Fantasiewerte. Endgame-Region
  (Kronengebirge, L20) kostet 6,69 Mio. im Auftragskorridor 5,5–8 Mio.
- Neuer Startpunkt: Rathaus (137, 194), kompakter 820-Kachel-Startkern mit zwei
  Expansionsrichtungen.

### Warum

Die 40-Regionen-Insel zersplitterte die Progression in zu viele folgenlose
Mikroschritte, und die Karte war für die kurzen Wege eines Städtebauers zu groß.
Die zweite Verdichtung macht Wege kürzer und die Karte dichter, ohne die für den
Fernblick prägenden Gebirge zu opfern. Die Konsolidierung macht jede Erweiterung
zu einer spürbaren, strategischen Entscheidung.

### Architektur

- Zweite Skalierung ausschließlich im Offline-Bake (`tools/bakeWorld.mjs`); die
  GLB wird weiterhin nie zur Laufzeit geladen. Voller Rebake aller abgeleiteten
  Grids.
- Neues reines Domain-Modul `src/game/regions/regionCost.ts` (kein Renderer-/
  React-/State-Bezug) leitet die sechs Preisfaktoren ab; `regions.config.ts` ist
  die eine Wahrheit, gegen das Modell getestet.
- Seeadjazenz (`seaAdjacent`) im Bake ergänzt; `regionUnlockBlocker` in
  `map/world.ts` entscheidet Land- vs. Seeerschließung + Hafenpflicht.
- Gratiserweiterung über `controller.isFreeRegionExpansionAvailable` /
  `getFreeRegionExpansionOptions`; `FREE_EXPANSION_LEVEL` in der Progressions-
  Schicht definiert.

### Auswirkung

- **Save-Schema v16.** `v15 → v16` sichert den alten Stand einmalig unter
  `cmb.save.backup.world-v15` und startet transparent neu (§13-Ausnahme): Küste,
  Regionen, Wasserlinie und Startanker ändern sich gleichzeitig, eine
  Koordinatenprojektion wäre nicht verlustfrei.
- 310 Tests grün (u. a. 17 Welt-/Regionstests auf die neue 13-Regionen-Welt
  umgestellt, neue `regionCost.test.ts`).

### Zukunft

- Säule B (Vegetations-Performance) folgt separat: LOD/HLOD, Chunk-Streaming,
  Schattenbudget, Shader-Wind, Qualitätsstufen, Dev-Performance-Panel.
- Der §3.1-vs-§4-Zielkonflikt (1 800–2 800 Kacheln vs. nur 12 Regionen) ist
  zugunsten der Regionsstruktur aufgelöst und dokumentiert.

### Dateien

- `tools/bakeWorld.mjs`, `src/game/config/world/*.gen.ts` (Rebake)
- `src/game/config/regions.config.ts`, `src/game/regions/regionCost.ts`
- `src/game/map/world.ts`, `src/game/commands/controller.ts`,
  `src/game/progression/levels.ts`
- `src/game/config/types.ts`, `schemas.ts` (`requiresHarbor`)
- `src/game/newGame.ts` (v16), `src/game/storage/migrations.ts`,
  `localStorageAdapter.ts`
- `src/components/panels/RegionDialog.tsx`, `src/styles/components.css`,
  `src/i18n/de.json`
- `docs/agents/WORLD_COMPACTION_REPORT.md`,
  `docs/agents/REGION_CONSOLIDATION_PLAN.md`, `docs/REGIONS.md` (generiert)

### Assets

- Keine neuen Assets. Hafenpflicht nutzt die vorhandenen Gebäude
  `dock_small`/`river_port`; keine erfundene Fährmechanik.

## v0.75 — Core Gameplay Overhaul 8.0, Phase G1 + Zeitvertrag

### Was

- Den gemeldeten „4/5 Stopps"-Fehler der Stadtarbeit an seiner Ursache behoben:
  Ein Lieferziel bleibt jetzt offen, bis seine Menge wirklich übergeben wurde.
  Wer leer daran vorbeifährt, nachfüllt und zurückkommt, beliefert es beim
  zweiten Kontakt regulär.
- Lieferziele und Nachfüllstopps werden getrennt gezählt und getrennt angezeigt
  („Lieferziele 5/5", darunter „Nachladen 1/1") statt in einer unklaren Zahl.
- Ein erfolglos angefahrenes Ziel erscheint als sichtbarer Hinweis-Stopp
  („Leer vorbeigefahren"), statt die ganze Route still ungültig zu machen.
- Die Verkehrslast wird bereits während der Planung berechnet — ab der ersten
  gezeichneten Kachel, in vier Stufen (Niedrig/Mittel/Hoch/Kritisch) und mit
  erwartetem Zeitverlust. „Wird geprüft" gibt es nicht mehr.
- Das Abschlussfenster zeigt echte Werte: Gesamtzeit, Fahrzeit, Lade-/
  Entladezeit, Strecke, Leerfahrtanteil, Auslastung, Verkehrseinfluss,
  Qualitätsverlust, Nachfüllungen, gelieferte Ziele, Planungseffizienz und
  Straßenanteil. Kennzahlen, die es für den Auftragstyp nicht gibt, entfallen —
  keine „– %"-Platzhalter mehr.
- Vegetation und Props verschwinden beim Freischalten einer Region nicht mehr.
- Pause, 1×, 2× und 4× steuern jetzt die ECHTE Simulation statt nur die
  Sonnenbahn. Pause hält Einkommen, Verbrauch, Produktion, Wachstum, Bauzeit,
  Missionen, Verkehr und Tageszeit vollständig an; UI, Kamera und Planung
  bleiben bedienbar.
- Fünf Bürgeranliegen nannten im Text eine andere Einwohnerzahl als ihr echtes
  Ziel („80 Einwohner" bei Fortschritt 1.600/1.600). Alle Texte korrigiert.

### Warum

Die betroffenen Systeme waren nicht nur unschön, sondern schlicht falsch: Eine
korrekt gefahrene Tour ließ sich nicht abschließen, eine Kennzahl wurde nie
berechnet, ein Ergebnisfenster zeigte Striche statt Leistung, und die
prominenteste Bedienleiste des Spiels tat nichts. Zusammen erzeugten sie genau
den Eindruck, das Spiel sei ein Wartesystem.

### Architektur

- `evaluateCargoRoute` merkt sich nur noch **erledigte** Ziele, nicht mehr
  „schon einmal berührte". Neu: `ActivityStopStatus` und `ActivityProgress` als
  kanonische Verträge; `CargoRouteStop` trägt einen echten Status.
- Neue reine Funktion `forecastRouteTraffic(path, roads, busyness, vehicle?)` in
  `routeAnalysis.ts`. Sie bewertet den gezeichneten Weg statt der Zielkette und
  hängt deshalb nicht mehr an einer vollständigen Route. Controller-Zugang über
  `getActivityTrafficForecast`; die Prognose liegt als `preview.traffic` an.
- Neuer Vertrag `ActivityRunResult`; `buildActivityRunResult` sammelt die Werte
  aus Routenanalyse, Infrastrukturbewertung, Cargo-Route und Verkehrsprognose.
- Neues reines Modul `renderer/three/vegetationBudget.ts`. Die Prop-Deckelung
  hing bisher am Arrayindex der weltweiten Kachelliste — wuchs sie beim Unlock,
  änderte sich die Schrittweite und damit die überlebenden Kacheln.
  `selectPropTiles` wählt über einen Positions-Hash, und `rebuildVegetation`
  vergibt das Budget **pro Region**. Die Auswahl einer Region ist damit
  unabhängig davon, welche anderen Regionen sichtbar sind (§16).
- Neuer Zeitvertrag `GameController.advanceByRealTime(realDeltaMs, live)`:
  reale Zeit × `SimulationSpeed` (0/1/2/4) ergibt Simulationszeit und läuft
  durch denselben einen Tick-Pfad. Einnahmen, Verbrauch, Produktion und Bauzeit
  können strukturell nicht mehr auseinanderlaufen. Im Renderer trennt
  `simDt = dt × speed` die Weltanimation von Kamera und Eingabe.

### Auswirkung

- Stadtarbeit ist wieder abschließbar; die Planung zeigt durchgehend echte
  Kennzahlen statt Platzhalter.
- Die Welt bleibt beim Erschließen visuell stabil.
- Die Geschwindigkeitsleiste ist eine echte Spielentscheidung: In der Pause
  lassen sich Routen und Bauten in Ruhe planen, ohne dass die Stadt weiterläuft.
- Save-Schema bleibt **v15** — dieser Durchgang persistiert nichts Neues. Die
  Geschwindigkeit ist bewusst eine Sitzungseinstellung.

### Zukunft

`docs/agents/CORE_GAMEPLAY_OVERHAUL_PLAN.md` führt die Phasen G2–G7. Als
Nächstes G2 und dort zwingend zuerst das Terrain-Picking: Der Cursor wird heute
gegen eine flache Ebene bei y = 0 geraycastet statt gegen das Höhenfeld, weshalb
Platzierungen auf erhöhtem Gelände sichtbar danebenliegen. Erst danach lohnen
echter GLB-Ghost, Verschieben, Gebäuderadien und der Straßenentwurf.

### Dateien

- `src/game/activities/logistics.ts`, `src/game/activities/routeAnalysis.ts`
- `src/game/commands/controller.ts`, `src/App.tsx`
- `src/renderer/three/vegetationBudget.ts` (neu),
  `src/renderer/three/ThreeMapRenderer.ts`
- `src/components/citywork/TourOverview.tsx`,
  `src/components/citywork/RouteSummary.tsx`,
  `src/components/panels/ActivityRoutePlanner.tsx`,
  `src/components/common/EventModal.tsx`,
  `src/components/hud/CameraControls.tsx`
- `src/styles/citywork-v4.css`, `src/i18n/de.json`
- `tests/simulationSpeed.test.ts`, `tests/vegetationBudget.test.ts`,
  `tests/questText.test.ts` (neu); `tests/logistics.test.ts`,
  `tests/routeAnalysis.test.ts` erweitert
- `docs/agents/CORE_GAMEPLAY_OVERHAUL_AUDIT.md`,
  `docs/agents/CORE_GAMEPLAY_OVERHAUL_PLAN.md` (neu)

### Assets

Keine neuen Assets. Alle Drop-in-Verträge bleiben unverändert.

## v0.74 — Waterways, Harbors & Infrastructure Overhaul 7.0

### Was

- Die großen Uferkegel technisch im World-Bake behoben: senkrechte, in der
  Draufsicht degenerierte Source-Dreiecke erzeugen keine isolierten hohen
  Heightfield-Proben mehr. Bake-Diagnosen und Tests verhindern Rückfälle.
- Visuellen Regions-Reveal von echtem Unlock getrennt. Der Nebel-Cheat zeigt die
  vollständige Insel einschließlich Vegetation und Props; ein separater
  Controller-Cheat verändert ausschließlich regulär erschließbare Regionen.
- Ozean als großes radiales Ringmesh ausgeführt und den Fernabschluss mit
  Distanznebel, Wolkenlagen sowie unregelmäßigen kleinen Ferninseln aufgewertet.
- Gebäude dürfen auf gültigem Terrain ohne Straße gebaut werden. Solange der
  Anschluss fehlt, tragen sie keine reguläre Produktion, Kapazität, Lager- oder
  Radiuswirkung und zeigen einen differenzierten Problemmarker.
- Multimodalen Anschlussstatus für Straße/Wasser, Controller-Read-Helper und ein
  optionales Infrastruktur-Overlay mit Netz-, Hafen-, Handels-, Versorgungs-
  und Problemfiltern ergänzt.
- 569 Wasser-Nodes und 1.775 Bake-geprüfte Kanten mit Tiefe, Breite, Clearance
  und Region exportiert. Jede Kante wird gegen die Wasser-Maske geprüft; die
  Hafen-zu-Hafen-Vorschau folgt dem Graphen statt einer Land schneidenden Linie.
- `dock_small` und `river_port` als datengetriebene Gebäude ergänzt: getrennte
  Land-/Wasser-Footprints, Mindesttiefe, automatische Kardinalausrichtung,
  Wasser-Ghost, spätere Straßenwarnung, Baushop-/Sheetangaben und prozedurale
  Low-Poly-Fallbacks.
- Drop-in-Pfade, Anschlussknoten, Statusmarker sowie neun spätere Schiffsmodelle
  im zentralen Manifest und den generierten Modellprompts dokumentiert.

### Warum

Die neue Insel besitzt strategisch wertvolle Flüsse, Seen und Buchten, wirkte
aber durch Bake-Artefakte und den rechteckigen Weltabschluss unfertig. Zugleich
verhinderte die harte Straßenpflicht den Aufbau entfernter Siedlungskerne. 7.0
macht die Geografie technisch verlässlich und bereitet Wasser als echten
Expansionsweg vor, ohne unfertige Waren- oder Schiffssimulation vorzutäuschen.

### Architektur und Auswirkungen

- Simulation und Renderer bleiben getrennt. Anschluss, Wassergraph und Dijkstra-
  Preview leben in `src/game/`; Three.js zeichnet ausschließlich Snapshots.
- React hält nur Filter/Platzierungszustand und sendet Commands. Visueller Reveal
  mutiert keinen Spielstand.
- Kein zweites Infrastruktur-, Regions- oder Missionssystem. Bestehende
  `BuildingDef`, Platzierung, Diagnosen, Derived-Werte und Controller-Bridges
  wurden erweitert.
- Persistiert wird kein neuer Zustand; Save-Schema bleibt v15. Tiefe
  Schifffahrts-, Hafenlager-, Remote-Construction- und Brückenlogik ist klar als
  `TODO(CLAUDE_LOGIC)` übergeben.
- Performance bleibt gebündelt: Bake-Graph, instanzierte Straßen/Hafenmarker,
  `LineSegments`, ein Routenpfad, radiales Ozeanmesh und prozedurale Fallbacks.

### Wichtige Dateien und Assets

- Bake/Tests: `tools/bakeWorld.mjs`, `tests/newIslandBake.test.ts`,
  `tests/waterInfrastructure.test.ts`, `tests/worldReveal.test.ts`.
- Game: `buildings/placement.ts`, `infrastructure/buildingInfrastructure.ts`,
  `infrastructure/waterNavigation.ts`, `commands/controller.ts`, Configs und
  Diagnosen/Derived/Tick/Coverage.
- Renderer/UI: `ThreeMapRenderer.ts`, `IMapRenderer.ts`, `MapView.tsx`,
  `InfoLayerControl.tsx`, `BuildMenu.tsx`, `FloatingBuildingSheet.tsx`,
  `DebugPanel.tsx` und `WorldMiniMap.tsx`.
- Assets: optionale `dock_small.glb`, `river_port.glb`, drei
  `marker_problem_*.glb` sowie die in `HARBOR_SYSTEM_PLAN.md` spezifizierte
  Schiffsflotte. Alle besitzen ehrliche Fallbacks beziehungsweise bleiben bis
  zur Simulation reine Authoringverträge.

### Zukunft

Persistente Schifffahrtsrouten, Schiffe, Kapazität/Kosten, Hafenlager,
Remote-Construction, multimodale Stadtarbeit und Brückendurchfahrt werden als
Erweiterung der bestehenden Systeme umgesetzt. Neue Save-Felder benötigen dann
einen Schema-Bump mit linearer Migration.

## v0.73 — Terrain Quality & World Scale Overhaul 6.1

### Was

- Die aktive Insel horizontal auf 420 statt 472 Kacheln Quellspannweite
  verdichtet: Faktor 0,8898 je X/Z-Achse, rund 0,7918 Fläche. Die eigenständige
  Y-Skalierung hebt den höchsten Gipfel auf rund 50 Welteinheiten.
- Bebaubarkeit von 55.941 auf 44.757 Kacheln reduziert (−20,0 %), ohne
  Gebäude-, Straßen- oder Simulationsmaßstab zu ändern.
- Wasserlinie von 0,004 auf 0,0065 angehoben und sichtbare Wasseroberfläche auf
  y = −0,04 gesetzt. 1.348 flache Meeresküsten-, 651 Flussufer-, 3 Seeufer- und
  2.576 bewusste Steilküstenkacheln werden getrennt gebacken.
- 569 direkt bebaubare Uferkacheln und 16 garantierte 5×5-Uferplattformen für
  spätere Hafen-, Pumpen- und Wassergebäude ergänzt. Brückenkandidaten enthalten
  Ufertyp und Rampensteigung.
- Oststart entfernt. Der Bake bewertet reale Landschaftskandidaten nach
  Flachheit, Zentralität, vier Expansionsrichtungen, Ressourcen,
  Infrastruktur sowie Wasser-/Klippenrisiko. Ergebnis: Region 24 „Herzland“,
  Rathaus `(125,193)`, 1.290 Startbaukacheln und 4.418 frühe Baukacheln.
- Zwei verlängerbare Startstraßenachsen mit 16 Kacheln ergänzt. Historische
  Küstenankunft `(222,206)`, eine 115 Kacheln lange Versorgungstrasse und ein
  künftiger Hafenanker sind als geografische Hooks vorbereitet; noch keine
  Story-/Missionslogik.
- Vier neue Terrainvorlagen anhand der angehängten Screenshots im Modus
  `generate` erstellt und zu einer 2048er Bibliothek verarbeitet: 9 Gebirgs-,
  8 Gras-, 6 Wald-, 4 Ufer- und 3 regionale Bodentexturen. Ausgewählte
  Normal-, Roughness- und AO-Maps liegen daneben.
- Ground-Shader auf breite Weltkoordinaten-Makrostruktur umgestellt. Felsen
  nutzen triplanare Projektion, Schichten/Grate Macro-Noise, Ufer echte
  Bake-Masken, Regen Wetness und Nahdetails Distanz-LOD.
- Instanziertes Mikrogras für Nahsicht ergänzt; Fallback-Felsen werden am
  niedrigsten Punkt ihrer Grundfläche verankert und leicht eingegraben.
- Regionsprofile und Namen auf die neue Geografie übertragen. Region 16 bleibt
  visuelle Wüste, Region 40 visueller Sumpf; Gameplay weiterhin
  `TODO(CLAUDE_LOGIC)`.
- Save-Schema auf v15 erhöht. v14-Weltstände werden einmalig unter
  `cmb.save.backup.world-v14` gesichert und transparent neu gestartet.

### Warum

Die 6.0-Welt war im Stadtmaßstab zu weitläufig; glatte graue Berge,
gleichförmige Wiesen und überwiegend senkrechte Ufer wirkten wie Prototypen.
Der neue Bake hält die verbindliche Inselkontur, rückt Entscheidungen dichter
zusammen und macht Wasser zu einem erreichbaren Teil der Stadtlandschaft. Die
Materialbibliothek übernimmt die klare Low-Poly-/Painterly-Formsprache der
Referenzbilder, ohne fotografische Mikrounruhe.

### Architektur und Auswirkungen

- `src/game/**` bleibt Three-/React-frei. Ufertyp, Waterfront und Start-/
  Ankunftspunkte sind synchron gebackene Configdaten.
- Kein zweites Welt-, Biom-, Verkehrs- oder Missionssystem. Der bestehende
  Offline-Bake, `samplePlacementSurface`, Regions-Config und Three-Renderer
  wurden erweitert.
- Drop-in-Garantie bleibt: fehlende Farb-/PBR-Dateien fallen auf Vertexfarben
  und bestehende Materialwerte zurück.
- Performance bleibt vorgegeben: 64 cullbare Terrainchunks, begrenzte
  Shader-Sampler, Instancing, Kamera-LOD für Normaldetail und Mikrogras.
- Die Koordinatenänderung wird nicht scheinbar migriert. Der typisierte
  14→15-Schritt nutzt den bestehenden sicheren Backup-/Neustartpfad.

### Wichtige Dateien und Assets

- Bake/Reports: `tools/bakeWorld.mjs`, `tools/bake-report.md`,
  `tools/bake-preview.png`, `tools/processTerrainTextures.ps1`.
- Sim/Config: `island*.gen.ts`, `startRegion.config.ts`, `regions.config.ts`,
  `map/world.ts`, `newGame.ts`, `storage/migrations.ts`.
- Renderer: `ThreeMapRenderer.ts`, `terrainHeight.ts`, `CameraConfig.ts`,
  `CameraController3D.ts`, `worldVisualProfiles.ts`.
- Assets: `src/assets/textures/terrain/{mountain,grass,forest,coast,dryland,fertile,moorland}`.
- Doku: `TERRAIN_VISUAL_AUDIT.md`, `TERRAIN_MATERIAL_MATRIX.md`,
  `REGION_VISUAL_REDESIGN.md`, `WORLD_SCALE.md`, `WORLD_REBUILD.md`,
  `SAVE_MIGRATION.md` und die generierte `TERRAIN_TEXTURES.md`.

### Zukunft

Ankunftstutorial, Hafen-/Schifffahrtsgameplay, Brücken-/Tunnelbau und
Wüsten-/Sumpfeffekte müssen als Erweiterungen bestehender Config-/Commandpfade
entworfen werden. Zielhardwaremessungen entscheiden, ob weitere PBR-Kanäle oder
höhere Vegetationscaps sinnvoll sind.

## v0.72 — World Rebuild 6.0: neue 512²-Insel

### Was

- `island 3d new.glb` vollständig analysiert: 78 Teile, 945.473 Vertices,
  1.849.632 Dreiecke, transformierte Bounds, Topologie, Materialien, UVs,
  Neigung und stabile Audit-IDs sind als JSON/Markdown dokumentiert.
- Bestehenden Offline-Bake auf die neue Source umgestellt: 512×512 Terrain,
  1025×1025 Höhe, Gipfel bei 48 Einheiten, 40 organische Regionen,
  Bau-/Wasser-/Küstenmasken und drei konsistente UI-Karten.
- Gründerküste im Osten als Start gewählt: Rathaus (364,346), 4.523
  Baukacheln, Küstendistanz 17 und garantiertes 34×19-Gründungsfeld.
- Große alte Gipfelmodule entfernt; die gesamte Hauptsilhouette kommt aus dem
  neuen Bake. Terrain bleibt in 64 cullbaren Chunks.
- Wasser um Tiefenmaske und Türkis→Tiefblau-Verlauf erweitert; vorhandene
  ressourcensparende Wellen-/Schaumanimation bleibt erhalten.
- Zentrale `samplePlacementSurface`-Abfrage für Höhe, Hang, Normale, Wasser,
  Klippe, Region und Bebaubarkeit ergänzt. Gebäude bleiben waagerecht und
  erhalten einen gemeinsamen Steinsockel; ungeeignete Footprints werden
  abgelehnt.
- 7 Brücken-, 24 Viadukt-, 7 Tunnel-, 16 Hafen- und 485
  Wasserwegkandidaten gebacken, ohne eine zweite Verkehrslogik einzuführen.
- Dev-Cheat „Gesamte Insel anzeigen“ ergänzt: Wolken und Minimap-Sperre werden
  nur visuell deaktiviert; Freischaltungen und Saves bleiben unverändert.
- Save-Schema auf v14 erhöht. Alte Weltstände werden nicht falsch projiziert,
  sondern einmalig unter `cmb.save.backup.world-v13` gesichert und transparent
  neu gestartet.

### Warum

Die alte 384²-Geografie war weder Form noch Maßstab der neuen, vom Nutzer
vorgegebenen Insel. Ein direktes Runtime-Rendering der 45-MB-Source wäre zu
teuer und hätte Simulationslogik an Three-Geometrie gekoppelt. Der gemeinsame
Bake macht die neue Form stattdessen zur deterministischen Grundlage für
Rendering, Bauen, Regionen, Karten und spätere Infrastruktur.

### Architektur und Auswirkungen

- Keine Three-/React-Imports in `src/game/**`; alle Geländeabfragen sind
  synchron, serialisierbar und testbar.
- Bestehende `island*.gen.ts`-/`world*.gen.ts`-Pfade wurden erweitert statt ein
  paralleles Weltsystem aufzubauen.
- Source-GLB liegt außerhalb der Runtime-Registry. Fehlende Detail-GLBs nutzen
  weiter prozedurale/instanzierte Fallbacks.
- Wüste und Sumpf bleiben visuell. Brücken, Tunnel, Bahn und Schifffahrt sind
  Kandidaten/Hooks mit `TODO(CLAUDE_LOGIC)`, kein behauptetes Gameplay.
- Die alte Source wird von keinem aktiven Pfad gelesen, bleibt wegen des bereits
  veränderten Arbeitsbaums bis zu einem sauberen Git-Sicherungspunkt erhalten.

### Wichtige Dateien und Assets

- Analyse/Bake: `tools/analyzeNewIsland.mjs`, `tools/bakeWorld.mjs`,
  `tools/new-island-report.*`, `tools/bake-report.md`.
- Sim: `islandTerrain.gen.ts`, `islandRegions.gen.ts`,
  `islandBuildability.gen.ts`, `islandInfrastructure.gen.ts`,
  `startRegion.config.ts`, `map/world.ts`, `placement.ts`.
- Renderer/UI: `worldHeight.gen.ts`, `worldMasks.gen.ts`,
  `ThreeMapRenderer.ts`, `WorldMiniMap.tsx`, `DebugPanel.tsx`.
- Karten: `new_island_overview.png`, `new_island_minimap.png`,
  `new_island_planning.png`.
- Dokumentation: `NEW_ISLAND_*.md`, `WORLD_SCALE.md`, `WORLD_REBUILD.md`,
  `SAVE_MIGRATION.md`, Manifeste und Handoff.

### Zukunft

Nach visueller Zielhardware-Abnahme können echte Brücken-/Tunnelbauteile,
Schifffahrt, Bahntrassen und weitere PBR-Texturkanäle in die vorhandenen
Systeme eingehängt werden. Eine automatische Regionsbild-Serie aus festen
3D-Kamerapresets ist weiterhin sinnvoll; generische Heroes bleiben bis dahin
ein ehrlicher Fallback.

## v0.71 — Wolkenwand und Sperrgebiets-Anzeige

### Was

Nicht freigeschaltete Regionen werden jetzt vollständig von einer dichten,
animierten Wolkenwand verdeckt. Über jedem gesperrten Gebiet schwebt eine klar
lesbare Navy-/Gold-Tafel mit Schloss, Regionsname und benötigtem Level. Die
Minimap zeigt dort ebenfalls keine Landschaft mehr, sondern eine Wolkendecke mit
kompakten Schloss-/Level-Markern.

### Warum

Der bisherige Regionsnebel lag bewusst niedrig und ließ Gipfel sowie
Landmarken als Teaser durchscheinen. Das widersprach dem verbindlichen Mockup:
Eine unbekannte Region muss aus Übersicht und Schrägsicht eindeutig als
gesperrt erkennbar sein, ohne dass Terrainfarbe oder einzelne Objekte den Inhalt
vorwegnehmen.

### Architektur

`ThreeMapRenderer` erweitert ausschließlich das vorhandene Regionsnebel-System.
Die geglättete Regionskontur wird leicht nach außen verbreitert und erhält eine
blickdichte Grunddecke oberhalb ihres höchsten Terrainpunkts, drei driftende
Alpha-Lagen aus `cloud_bank.webp` und genau ein gedeckeltes `InstancedMesh` für
die volumetrische Rand- und Oberseitenstruktur. Dadurch entstehen keine
Einzel-Draw-Calls pro Wolke. Ein prozedural erzeugtes Canvas-Sprite verwendet die
kanonischen Regionsnamen und `unlockLevel`-Werte; ein Klick führt weiterhin in
den bestehenden Regionsdialog. `WorldMiniMap` liest dieselben gebackenen
Regionszentren und dieselbe Config.

### Auswirkung

Die Grenze zwischen erschlossener und unbekannter Welt ist aus Hauptansicht,
Schrägsicht und Minimap sofort verständlich. Beim Freischalten steigt die
Wolkenwand weiterhin mit der bestehenden Fade-Animation auf und gibt das Gebiet
frei. Simulation, Balancing und Inselbake sind unverändert; das Save-Schema
bleibt v13.

### Zukunft

Auf Windows-Zielhardware müssen Dichte, Markergröße, Draw-Calls und
Texturspeicher noch in Vollinsel- und Nahansicht gemessen werden. Weitere
Wolkenvarianten dürfen den vorhandenen Asset-Slot erweitern, aber keine zweite
Nebel- oder Regionslogik einführen.

### Dateien

- `src/renderer/three/ThreeMapRenderer.ts`
- `src/components/hud/WorldMiniMap.tsx`
- `src/i18n/de.json`
- `docs/PATCHNOTES.md`
- `docs/ARCHITECTURE.md`
- `docs/ASSETS.md`
- `docs/3D_WORLD_ASSETS.md`
- `docs/HANDOFF_CLAUDE.md`
- `docs/agents/README.md`
- `docs/agents/PROJECT_STATE.md`
- `docs/agents/HANDOFF_LOG.md`
- `docs/agents/MAP_REDESIGN_AUDIT.md`
- `docs/agents/MAP_REDESIGN_PLAN.md`
- `docs/agents/WORLD_ASSET_MANIFEST.md`
- `docs/agents/OPEN_TASKS.md`
- `README.md`
- `AGENTS.md`
- `CLAUDE.md`

### Assets

Keine neue Pflichtdatei. Die Wolkenlagen verwenden das bereits registrierte
`src/assets/environment/cloud_bank.webp`; fehlt es, bleiben blickdichte
Material- und Instancing-Fallbacks aktiv. Schloss-/Level-Tafeln und
Minimap-Wolken werden prozedural erzeugt.

## v0.70.1 — Gebirgsobjekte schweben nicht mehr

### Was

Gestreute Gebirgs-Gipfel, Felscluster und die Silhouetten-Teaser gesperrter
Regionen werden nicht mehr auf der Höhe ihres Mittelpunkts, sondern auf dem
tiefsten Punkt ihrer eigenen Grundfläche geerdet und zusätzlich leicht in den
Hang eingegraben.

### Warum

Ein starres Modell auf einer einzigen Höhenprobe zu setzen funktioniert nur auf
ebenem Boden. Im Gebirge fällt das Gelände unter der Grundfläche stark ab, also
saß der Sockel auf der Mittelhöhe und die bergab liegende Kante stand sichtbar
frei in der Luft — besonders auffällig bei den bis zu neun Kacheln hohen
Nebel-Silhouetten, deren Sockel rund acht Kacheln breit ist.

### Architektur

`terrainMinHeightAround(x, y, radius)` in `src/renderer/three/terrainHeight.ts`
ist eine reine Ableitung aus `terrainHeightAt` (zwei Ringe à acht Richtungen,
deterministisch) — es entsteht **keine** zweite Höhenquelle. `placeModelInstances`
akzeptiert die neuen optionalen Optionen `groundRadius` und `sink`; ohne sie
bleibt das Verhalten exakt wie bisher, sodass Bäume, Büsche und Bodenkacheln
unverändert sind.

### Auswirkung

Rein visuell. Keine Simulation, keine Config, keine Save-Änderung; Schema bleibt
v13. Drop-in-Gipfel aus `models/terrain/mountains/` und Felsen aus
`models/props/nature/` stecken jetzt im Hang statt darüber zu schweben.

### Zukunft

Echte Hangneigung (Ausrichtung des Modells an der Geländenormalen) bleibt offen
und braucht eine gemeinsame Entscheidung mit dem Gebäude-Platzierungspfad.

### Dateien

- `src/renderer/three/terrainHeight.ts`
- `src/renderer/three/ThreeMapRenderer.ts`

### Assets

Keine neuen Assets. Die Gipfel-Slots `mountain_peak_medium`, `mountain_peak_large`,
`mountain_peak` und `rock_large` in `src/assets/models/terrain/mountains/` sind
weiterhin leer und damit rein prozedural.

## v0.70 — Insel- und Biom-Overhaul 5.0

### Was

Die bestehende 3D-Insel wurde anhand der verbindlichen Map-Mockups visuell neu
gelesen, ohne Kontur, Höhenbake, Straßen, Baufelder oder Regionslogik zu
ersetzen. Zwölf visuelle Regionsprofile geben Gebirge, Grasland, Wald,
Fruchttal, trockener Ebene, Küste, Seenland, Hochland, Flusstal sowie erstmals
einer roten Wüste und einem Sumpf eine eigene Material-, Vegetations- und
Landmarkensprache.

- Der Terrainshader mischt jetzt zwölf statt acht Bodenschichten. Neue
  KI-generierte Base-Color-Texturen liefern Wiese, hellen Bergfels, Schnee,
  roten Wüstensand, Sumpfboden und Küstenkies.
- Fels- und Bergmaterial werden an steilen Flächen triplanar in Weltkoordinaten
  abgetastet. Dadurch entstehen keine langgezogenen Texturstreifen an Klippen.
- Visuelle Regionsgewichte werden aus mehreren benachbarten Region-Samples
  gemittelt. Die Übergänge wirken organisch, während Gameplay-Grenzen exakt
  unverändert bleiben.
- Wald und offene Landschaft unterscheiden nun Nadelbaum, großen Nadelbaum und
  Laubbaum. Wüste, trockene Ebene und Sumpf steuern Felsen, Büsche, Schilf und
  Totholz mit Instancing und prozeduralen Fallbacks.
- Flüsse besitzen eine einzelne gebündelte, animierte Strömungsfläche; das
  Ozeanmaterial kombiniert drei Wellenrichtungen und eine Makromodulation.
- Felsbogen, Urbaum, kleine Ruine, Wüstenfelsnadel, Sumpfbaum und Seeinsel sind
  als neutrale Landmark-Slots im zentralen Manifest verdrahtet. Fehlende GLBs
  werden prozedural dargestellt.

### Warum

Die Welt hatte bereits eine gute, spielbare Geometrie und performante
Chunk-/Instancing-Grundlage. Der sichtbare Abstand zu den Mockups entstand aus
globalen Materialien und zu ähnlichen Vegetationssilhouetten. Der Pass investiert
deshalb in Materialtiefe, regionale Lesbarkeit und Orientierung, ohne die stabile
Simulation oder den Inselmaßstab neu aufzubauen.

### Architektur

`worldVisualProfiles.ts` ist eine reine Renderer-Matrix für alle 32 vorhandenen
Regions-IDs. `ThreeMapRenderer` liest sie beim Erzeugen der Chunks und Instanzen;
es entsteht kein zweites Regionssystem. Die Wüsten- und Sumpfzuordnung wirkt nur
auf Splat-Gewichte, Tönung, Vegetation und neutrale Landmarken. Boni, Risiken,
Kosten und Freischaltungen bleiben ausschließlich in der Game-Config.

Texturen und Modelle folgen weiterhin Registry und Manifest. Die neuen
Landmark-Namen stehen in `modelManifest.ts`, die Ordner-READMEs und Prompts sind
testgeneriert. Die Flussströmung ist eine gebündelte Rendergeometrie statt eines
Objekts pro Kachel. Vegetation bleibt instanziert; Landmarken sind begrenzt und
deterministisch platziert.

### Auswirkung

- Gebirgsketten lesen sich durch hellen Fels, alpine Gewichtung und Schnee klarer
  aus Nah- und Fernsicht.
- Offene Wiesen, Kernwald, Agrartäler, Küsten, Seen, rote Trockenzone und Moor
  besitzen deutlich getrennte Paletten und Silhouetten.
- Küsten und Flüsse wirken bewegter, ohne neue Simulation oder Save-Daten.
- Alte Spielstände bleiben gültig; Save-Schema bleibt **v13**.

### Zukunft

- Normal-, Roughness-, AO- und optionale Height-Maps für die neuen
  Materialfamilien sind als sauberer PBR-Drop-in-Pass offen.
- Die neuen Landmarken-, Schilf-, Totholz- und Felsnamen warten auf optimierte
  GLBs; Fallbacks decken die Welt vollständig.
- `TODO(CLAUDE_LOGIC)`: mögliche Wüsten-/Sumpfboni oder Risiken erst als
  datengetriebene Designentscheidung in `src/game/config/` ergänzen.
- Zielhardware-Smokes und GPU-Profiling sollen die bereits begrenzten
  Draw-Calls, Instanzen und Landmark-Caps weiter absichern.

### Dateien und Assets

- Renderer: `ThreeMapRenderer.ts`, `worldVisualProfiles.ts`
- Manifeste: `terrainTextureManifest.ts`, `modelManifest.ts`
- Tests: `terrainTextures.test.ts`, `worldVisualProfiles.test.ts`, generierte
  Modell- und Terrain-Dokumentation
- Neue Texturen: `terrain/{grass,mountain,desert,swamp,coast}/`
- Audit/Handoff: `MAP_REDESIGN_AUDIT.md`, `MAP_REDESIGN_PLAN.md`,
  `REGION_VISUAL_REDESIGN.md`, `TERRAIN_MATERIAL_MATRIX.md`,
  `WORLD_ASSET_MANIFEST.md`

### Verifikation

- `npx tsc -b --force`: grün.
- `npx eslint src tests`: grün.
- `npx vitest run`: grün, **35 Testdateien / 259 Tests**.
- `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`: grün,
  **22 Tests**; generierte Modell-READMEs/Prompts synchron.
- `npm run build`: grün; die bekannte Warnung zum großen Hauptchunk bleibt.
- Preview unter Basis-URL `/`: HTTP 200. Der Screenshot-Smoke konnte in dieser
  Sitzung nicht ehrlich abgeschlossen werden, weil die integrierte
  Browsererkennung auch nach Troubleshooting keine Browserinstanz lieferte
  (`[]`). Kein externer Automationspfad wurde als Ersatz benutzt.
- Die sechs KI-Texturen wurden einzeln visuell geprüft und technisch als
  1254×1254-PNG validiert.
- `npm run tauri:build`: lokal vor der Kompilierung blockiert, da `cargo` nicht
  installiert ist (`cargo metadata: program not found`).


## v0.69 — Stadtarbeit UI/UX Redesign 4.0

### Was

Der Stadtarbeit-Planer wurde anhand des verbindlichen Redesign-4.0-Mockups neu
aufgebaut. Die stilisierte 2D-Stadt ist jetzt der dominante Arbeitsbereich;
Aufträge stehen kompakt links, Fahrzeug/Ladung, die live entstehende Tour und
die Bestätigung rechts. Die alte Drag-&-Drop-Zielreihenfolge, der Planname sowie
„Letzte Route“/lokales Speichern und Laden sind vollständig entfernt.

- Linksklick/-ziehen auf Straßen zeichnet, freie Fläche sowie Mittel-/Rechtszug
  verschieben, Mausrad und +/− zoomen. Leertaste schaltet temporär auf Pan; F
  passt den Auftrag ein; R setzt zurück; Esc entfernt zunächst den letzten
  Schritt und schließt erst am Startpunkt.
- Reihenfolge und Stoppnummern entstehen ausschließlich aus den tatsächlich
  berührten Straßenankern. Es gibt kein stilles Auto-Routing.
- Cargo, Ladestand, Fahrzeugkapazität, notwendige/echte Nachfüllungen,
  Leerfahrt, Fahr-/Handlingzeit, Verkehrsrisiko und Qualität reagieren live.
- Die Tourübersicht nutzt Gebäudethumbnails und unterscheidet Start, Lieferung
  und echte Rückkehr zur Quelle zum Nachfüllen.
- Ein Portrait-Berater übersetzt kanonische Infrastruktur-Hinweiscodes in kurze
  Handlungsimpulse. Der Bestätigungsbutton bleibt bis zur lückenlosen,
  cargo-gültigen Route gesperrt.
- Die Canvas-Karte erhielt Geländevariation, Wasser, Regionsgrenzen,
  Straßenklassen, Verkehr, erkennbare Gebäude, Schatten, animierten Routenglow,
  Richtungspfeile und farbige Etappen statt Debug-Kacheln.
- Drei zusätzliche Config-Missionen (`water_delivery`, `market_restock`,
  `park_supply`) erhöhen die gleichzeitige Vielfalt ohne neues Missionssystem.

### Warum

Der bisherige Screen behandelte zu viele technische Tabellen und Werkzeuge als
gleich wichtig. Redesign 4.0 macht die eigentliche Entscheidung — welchen Weg
fahre ich mit welchem Fahrzeug und wann lade ich nach — sofort sichtbar und
bedienbar. Bilder, Hierarchie und direkte Karteninteraktion ersetzen
Konfigurationswerkbank-Charakter, ohne Spielregeln in React zu duplizieren.

### Architektur

`ActivityRoutePlanner` orchestriert nur neue Controller-Read-Modelle:
`getActivityPlanningContext`, `getActivitySupplySources`,
`getActivityDeliveryTargets`, `getAvailableActivityVehicles` und
`getActivityRoutePreview`. `targetOrderOnPath` sowie `evaluateCargoRoute` sind
reine deterministische Game-Helfer. React speichert keinen Standardweg mehr und
mutiert keinen GameState. Gestartet wird weiterhin atomar über `startActivity`
beziehungsweise `setActiveActivityRoute` mit `{vehicle, roadPath}`.

Die neuen Missionen sind ausschließlich validierte Einträge in
`activities.config.ts`. `material_delivery` nutzt für das physische Volumen Holz
als repräsentative Mischladung, während die Wirtschaft weiterhin Holz und Stein
verbraucht; es wurde absichtlich kein neuer Save-relevanter Ressourcen-Typ
erfunden. Die neue CSS-Schicht `citywork-v4.css` liegt nach den bestehenden
Designsystemdateien und verändert die 3D-Ausführung nicht.

### Auswirkung

Die Planung ist auf 1280×720 kompakt und auf 1920×1080 großzügig. Karte,
Marker, Auftrag und Bestätigung bleiben in beiden Zielgrößen innerhalb der
Vollbildfläche; Listen scrollen lokal. Fehlende Bilder fallen über Registry,
BuildingArt oder Lucide-Symbole zurück. Die bestehende automatische 3D-Fahrt,
Belohnung und Ergebniswertung bleiben unverändert.

### Zukunft / bewusst nicht vorgetäuscht

- Mehrere auswählbare Quellen, Zwischenlager, Rückwaren, Depot-Rückgabe,
  Fahrzeugwechsel und mehrere Fahrzeuge benötigen noch kanonische Plan-Legs und
  Commands (`TODO(CLAUDE_LOGIC)`). Redesign 4.0 zeigt nur die erste echte Quelle
  und tatsächliche Wiederbesuche dieser Quelle.
- `InfrastructureWarning` besitzt noch keine `roadPoint`/`segmentId`; „Route
  zeigen“ passt deshalb ehrlich die ganze Tour ein statt einen Abschnitt zu
  erraten.
- Steigung, Straßenzustand, Wetterereignisse, Sperrungen und Fahrzeugschaden
  bleiben offene Game-Daten. Die UI zeigt dafür keine erfundenen Werte.
- `rewardMultiplier` bleibt Prognose und verändert die Auszahlung nicht.

### Dateien

`src/components/panels/ActivityRoutePlanner.tsx`,
`src/components/citywork/{ManualRouteMap,VehicleSelector,RouteSummary,TourOverview,InfrastructureAdvisor}.tsx`,
`src/styles/citywork-v4.css`, `src/main.tsx`,
`src/game/activities/{routeAnalysis,logistics}.ts`,
`src/game/commands/controller.ts`, `src/game/config/activities.config.ts`,
`src/i18n/de.json`, `tests/{routeAnalysis,logistics,missions}.test.ts` sowie die
zugehörigen Projekt-/Handoff-/Asset-Dokumente.

### Assets

20 neue KI-generierte, freigestellte PNGs unter
`src/assets/ui/citywork/{markers,cargo,advisors,missions}/`: acht Marker, fünf
Cargo-Bilder, zwei Beraterporträts und fünf Missionsdioramen. Alle wurden im
`stylized-concept`-Modus mit flacher Magenta-Keyfläche erzeugt, per
Border-Autokey/Soft-Matte/Despill freigestellt, auf 512 oder 768 px reduziert
und auf echten Alpha-Kanal geprüft. Prompts, Benennung und Fallbacks stehen in
den sieben Ordner-READMEs.

### Save

Keine neue persistierte Struktur. Save-Schema bleibt **v13**; die bestehenden
Migrationen `11→12→13` bleiben unverändert.

### Verifikation

Die endgültigen Ergebnisse der vollständigen Matrix und des Browser-Smokes
stehen im jüngsten Eintrag von `docs/agents/HANDOFF_LOG.md`.

## v0.68 — Stadtarbeit-Logik 2.0 (L4): Logistik-Bewertung & Leerfahrtanteil

### Was

Der Stadtarbeit-Planer kann eine Route jetzt logistisch **bewerten**: Wie viel
der Fahrt wird **leer** gefahren (Leerfahrtanteil §19)? Wie oft muss nachgeladen
werden? Passt das Fahrzeug (Kapazität, Handling in engen/vollen Straßen)? Liegt
die Quelle günstig zu den Zielen? Wie lange dauern Be- und Entladen? Verdirbt die
Ware ohne Kühlung? Dazu kommen textfreie Hinweise (z. B. „überdimensioniertes
Fahrzeug", „viele Nachladefahrten", „verderblich ohne Kühlung").

### Warum

§19 des Auftrags verlangt eine echte Infrastruktur-Bewertung mit dem
Leerfahrtanteil als Kernmaß. Der Spieler soll erkennen, dass ein kleines Fahrzeug
viele leere Nachlade-Rückfahrten erzeugt und ein zu großes unnötig lange lädt —
also strategisch Quelle, Reihenfolge und Fahrzeugklasse wählen.

### Architektur

Zwei reine, deterministische Bewertungen im bestehenden Logistikmodul
(`activities/logistics.ts`): `evaluateInfrastructure` als **Prognose** vor dem
Zeichnen (Leerfahrt aus den Nachlade-Rückfahrten der Cargo-Etappen) und
`evaluateCargoRoute` als **Ist-Auswertung** eines bereits gezeichneten Pfades
(echte Quell-/Nachladekontakte, gemessene Leerfahrtkacheln). Fahrzeugeignung kommt
als optionale Config an `ActivityVehicleDef` (`loadTimeSec`,
`unloadTimeSecPerTarget`, `narrowStreetPenalty`, `cooling`). Read-Helper:
`getActivityInfrastructure`, `getActivityInfrastructureWarnings`,
`getActivityCargoRoute`. Reine Anzeige/Prognose — **kein Save-Bump, keine
Auszahlungskopplung** (bleibt bei D-013).

### Auswirkung

Ausschließlich additive Read-/Config-Schicht: Simulation, Ökonomie, Save und
Auszahlung bleiben unverändert. Die Codex-UI kann die Werte/Hinweise anzeigen; die
Textbausteine liegen in der UI, die Logik liefert nur Zahlen und Codes.

### Zukunft

Kopplung von Leerfahrtanteil/Eignung an die Auszahlung erst nach dem L5-
Balancingtest; sichtbare Quell-/Nachlade-/Rückfahrt-Etappen in der 3D-Fahrt
(Codex); L5 adaptive Mengen aus dem Stadtzustand.

### Dateien

`src/game/config/types.ts`, `src/game/config/schemas.ts`,
`src/game/config/activities.config.ts`, `src/game/activities/logistics.ts`,
`src/game/commands/controller.ts`, `tests/logistics.test.ts`.

### Assets

Keine.

## v0.67 — Stadtarbeit-Logik 2.0 (L3): Ladung wird an der Quelle reserviert

### Was

Eine Liefermission holt ihre Ware jetzt **echt** an der Quelle ab, statt sie
unterwegs aus dem Nichts zu ziehen. Beim Start wird die volle benötigte Menge
(`costPerTarget × Ziele`) sofort aus dem Lager entnommen und als Ladung gehalten;
jede Auslieferung zieht aus dieser Reserve. Reicht der Vorrat nicht, startet der
Auftrag gar nicht — kein Steckenbleiben auf halber Strecke. Ein Abbruch gibt die
noch nicht ausgelieferte Ware zurück.

### Warum

§4/§5 des Auftrags: Ware muss aus realen Quellen kommen, reserviert und korrekt
entnommen werden, Doppelnutzung ausgeschlossen. Weil die reservierte Ware sofort
den Pool verlässt, kann sie nicht mehr parallel für Handel/Bau ausgegeben werden.

### Architektur

Neues optionales, persistiertes Feld `ActiveActivity.reserved`. Der Verbrauch
bleibt **netto identisch** (`costPerTarget × Ziele`) — nur der Zeitpunkt
verschiebt sich vom Ziel zum Start. Kein Balancing-Eingriff. Es gibt weiterhin
keine gebäudeeigene Lagerhaltung; die Quelle ist ein Anker, der Bestand der
globale Pool. Neuer Read-Helper `getActivityExecutionSnapshot` für die
3D-/HUD-Ansicht.

### Auswirkung

Fahrmissionen mit Kosten (Essen/Material/Holz) reservieren upfront; Feuerwehr/
Polizei (ohne Kosten) sind unverändert. Alte laufende Missionen ohne Reserve
laufen im bisherigen Pfad weiter.

### Zukunft

Sichtbarer Halt an der Quelle und Nachlade-/Rückfahrt-Etappen während der 3D-Fahrt
(Codex, Daten liegen in `getActivityCargoPlan.legs` bereit); L4 Leerfahrt-
bewertung; L5 adaptive Mengen.

### Dateien

`src/game/types.ts`, `src/game/config/schemas.ts`, `src/game/newGame.ts`,
`src/game/storage/migrations.ts`, `src/game/commands/controller.ts`,
`tests/activityReservation.test.ts` (neu), `tests/storage.test.ts`.

### Assets

Keine.

### Save

**v13**, lineare Migration `12→13` (Normaliser). v12-Saves bleiben gültig.

## v0.66 — Stadtarbeit-Logik 2.0 (L1+L2): echte Ladung & Fahrzeugkapazität

### Was

Die Stadtarbeit erhält die logistische Grundlage aus dem Auftrag „Stadtarbeit-
Logik 2.0": Fahrzeugkapazität wirkt jetzt real. Ein Auftrag lädt nicht länger
implizit „unendlich" — übersteigt der Transportbedarf die Ladefläche, sind
mehrere Beladungen nötig.

- **Ladungsmodell.** Neues Config-Feld `cargoModel` (transportiertes Volumen je
  Ziel, optional mit der Zielgröße skalierend) — getrennt vom abstrakten
  Ressourcenverbrauch `costPerTarget`. `food_delivery` liefert die Referenz.
- **Kapazitätsplanung.** Der neue Read-Helper `getActivityCargoPlan` berechnet
  Bedarf je Ziel, nötige Beladungen und die Pickup-/Delivery-Etappen. Van (250)
  braucht für fünf mittlere Wohnziele zwei Beladungen, der große LKW (1000) nur
  eine — die Fahrzeugwahl wird zur echten Entscheidung.

### Warum

Bisher zog jeder Ziel-Klick Ware aus dem Nichts; Kapazität war Anzeige ohne
Wirkung. Damit war Stadtarbeit langfristig zu durchschaubar (§2 des Auftrags).

### Architektur

Reines, deterministisches Modul `src/game/activities/logistics.ts` neben dem
bestehenden Routen-Analyser — keine zweite Simulation. Es gibt weiterhin keine
gebäudeeigene Lagerhaltung; eine „Quelle" ist ein räumlicher Anker, der Bestand
bleibt der globale Pool. L2 ist eine Planungs-/Prognoseschicht: der
Ausführungspfad (`progressActivity`) und die Ökonomie sind unverändert.

### Auswirkung

Der Planer (Codex) kann jetzt „X Beladungen nötig" anzeigen. Keine Save-Änderung
(Schema bleibt v12), keine Auszahlungsänderung.

### Zukunft

L3 bringt Etappen-Ausführung mit Reservierung/Entnahme an Quellen und Rückfahrt
(Save v13 + Migration `12→13`); L4 die Leerfahrtbewertung; L5 adaptive Mengen.

### Dateien

`src/game/activities/logistics.ts` (neu), `src/game/config/types.ts`,
`src/game/config/schemas.ts`, `src/game/config/activities.config.ts`,
`src/game/commands/controller.ts`, `tests/logistics.test.ts` (neu),
`docs/agents/CITYWORK_LOGIC_2_PLAN.md` (neu).

### Assets

Keine.

## v0.65 — Stadtarbeit 2D: manuelle Routen, Fahrzeugflotte und automatische 3D-Ausführung

### Was

Der Stadtarbeit-Bildschirm wurde anhand der drei verbindlichen Routen-Mockups
vollständig von einem Zielsortier-Dialog zu einer strategischen
Planungswerkbank ausgebaut.

- **Manuelle Straßenroute statt Auto-Optimierung.** Die Route beginnt am
  kanonischen Straßenanker der Quelle. Linksklick/Ziehen wählt zusammenhängende
  Straßenkacheln, Rechtsklick entfernt die letzte Kachel. Zwischen zwei Klicks
  wird kein Weg ergänzt. Quelle und alle Ziele müssen in der selbst festgelegten
  Reihenfolge berührt werden.
- **Kartenfokus und Navigation.** Die 2D-Karte passt Quelle und Zielgruppe per
  Bounding Box ein, unterstützt Mausrad sowie Plus/Minus, freies Verschieben,
  Doppelklick-Fokus und die Kürzel Esc/R/F. Terrain, Gebäude, echtes Straßennetz,
  Verkehrslast, Route und Zielstatus werden aus Controller-Snapshots projiziert.
- **Zielreihenfolge.** Stopps lassen sich per Drag & Drop sowie Pfeiltasten
  umordnen. Eine geänderte Reihenfolge löscht bewusst die alte Straßenkette,
  damit kein optisch gültiger, logisch veralteter Plan bestehen bleibt.
- **Fahrzeugauswahl.** Kleiner Lieferwagen, mittlerer/großer LKW,
  Kühltransporter, Spezialtransporter und missionsspezifische Fahrzeuge besitzen
  Config-basierte Kapazität, Geschwindigkeit, Handling, Kosten, Verbrauch sowie
  Stärken/Schwächen. Güterzug und Frachtflugzeug sind als nicht auswählbare
  Zukunftsstufen sichtbar vorbereitet.
- **Live-Auswertung.** Strecke, Fahrzeit, Kreuzungen, Fahrzeugwerte,
  Verkehrsrisiko, verbundene Ziele, Effizienz, Medaille und
  Belohnungsprognose stammen aus der reinen Routenanalyse. Steigung und
  Straßenzustand bleiben ausdrücklich ohne erfundene Werte, bis dafür kanonische
  Netzdaten existieren.
- **3D-Ausführung.** Nach Bestätigung kehrt das Spiel in die Welt zurück. Das
  gewählte Fahrzeug folgt der gespeicherten Straßenkette automatisch, erledigt
  Ziele ausschließlich in der geplanten Reihenfolge und kann über ein kompaktes
  Widget verfolgt oder mit freier Kamera beobachtet werden.
- **Ergebnisansicht.** Der vorhandene Activity-Abschluss zeigt nun Bewertung,
  Sterne, Zeit, Strecke, Effizienz, Straßenanteil, Fahrzeug und Belohnung.

### Warum

Die vorige Fassung bot einen Button zur Nächster-Nachbar-Optimierung und startete
danach im Wesentlichen dieselbe Zielkette. Das widersprach dem neuen Auftrag:
Routenplanung soll eine aktive strategische Entscheidung sein und die Qualität
des eigenen Straßennetzes sichtbar machen. Die Ausführung in der 3D-Welt
verbindet Planungsansicht und bestehendes Stadtspiel, ohne ein zweites
Missionssystem einzuführen.

### Architektur

- `game/activities/routeAnalysis.ts` validiert die exakte orthogonale
  Straßenkette deterministisch auf `derived.roadNetwork`; kein React, Three,
  Zustand oder RNG.
- `GameController` bleibt einzige Command-Grenze. Neue Read-Helper:
  `getActivityRouteAnchors` und `analyseManualActivityRoute`. Die bestehenden
  Commands `startActivity`/`setActiveActivityRoute` nehmen optional
  `{ vehicle, roadPath }` entgegen und validieren beides vor der Mutation.
- Die laufende Aktivität speichert nur die gewählte Fahrzeug-ID und
  Straßenkacheln. Simulation, Questfortschritt und Auszahlung bleiben die
  vorhandene Aktivität; es existiert kein paralleler Route-/Quest-State.
- Der Three-Renderer liest diese Felder, nutzt die zentrale
  `ACTIVITY_VEHICLE_MODELS`-Fallbackkette und meldet erreichte Ziele über den
  bestehenden Callback zurück.
- UI-Aufteilung:
  `panels/ActivityRoutePlanner.tsx` orchestriert,
  `citywork/ManualRouteMap.tsx`, `VehicleSelector.tsx`, `RouteSummary.tsx` und
  `ActivityExecutionWidget.tsx` kapseln die Ansichten. Styling liegt separat in
  `styles/citywork.css`.

### Auswirkung

- Save-Schema steigt von **v11 auf v12**. Migration `11→12` ist verlustfrei:
  beide neuen Felder sind optional; eine alte laufende Mission verwendet weiter
  das Config-Standardfahrzeug und die bestehende Renderer-Wegfindung.
- Browser und Tauri lesen dieselben relativen Drop-in-Assets; fehlende Bilder
  oder GLBs fallen weiterhin auf vorhandene/prozedurale Fahrzeuge zurück.
- `rewardMultiplier` bleibt Prognose und verändert die Auszahlung nicht. Diese
  folgt weiterhin der kanonischen Ausführungsqualität.

### Zukunft

- Straßenzustand, Steigungen, Parkplätze, Fahrzeugzustand, Kraftstoff und
  dynamische Ereignisse brauchen eigene Simulationsdaten und dürfen nicht in
  der UI erfunden werden.
- Güterzug/Frachtflugzeug bleiben visuelle Vorbereitung, bis Schiene/Flughafen,
  Commands, Balancing und Save-Migration als vollständige Phase existieren.
- Für sehr große Missionen kann später eine segmentweise Auswahl über
  Straßen-IDs ergänzt werden; die heutige Kachelroute ist bereits der
  deterministische Persistenzvertrag.

### Dateien

`src/game/activities/routeAnalysis.ts`, `src/game/config/{types,schemas,
activities.config,index}.ts`, `src/game/commands/controller.ts`,
`src/game/{types,newGame}.ts`, `src/game/storage/migrations.ts`,
`src/components/panels/ActivityRoutePlanner.tsx`,
`src/components/citywork/*.tsx`, `src/renderer/{IMapRenderer,
three/ThreeMapRenderer}.ts`, `src/state/store.ts`, `src/App.tsx`,
`src/styles/citywork.css`, `src/i18n/de.json`,
`tests/{routeAnalysis,missions,storage}.test.ts` sowie die Asset-/Agenten-Doku.

### Assets

Vier neue KI-generierte, per Chromakey freigestellte PNGs:
`vehicles/medium_truck.png`, `large_truck.png`,
`refrigerated_truck.png`, `heavy_transporter.png`. Generiert mit dem eingebauten
Bildwerkzeug als polierte 3D-Fahrzeug-Cutouts auf `#ff00ff`, anschließend mit
`remove_chroma_key.py` (Soft Matte + Despill) transparent gerechnet.
Die Originale bleiben im lokalen Codex-Generierungsordner; die Projektdateien
besitzen validierte RGBA-Kanäle und prozedurale/GLB-Fallbacks.

### Verifikation

- TypeScript (`npx tsc -b --force`) und ESLint (`npx eslint src tests`) sind grün.
- Vitest ist mit **32 Testdateien / 222 Tests** vollständig grün; die
  Modell-Dokumentation ist mit **22 Tests** synchron.
- Der Browser-Produktionsbuild ist grün; die bekannte Rollup-Warnung zum großen
  Haupt-Chunk bleibt bestehen.
- Der Browser-Screenshot-Smoke konnte nicht ausgeführt werden, weil die
  eingebettete Browser-Laufzeit keine Instanz bereitstellte
  (`agent.browsers.list() = []`). Es wird keine visuelle Freigabe behauptet.
- `npm run tauri:build` stoppte vor dem Kompilieren mit
  `cargo metadata: program not found`; auf diesem Rechner fehlt die
  Rust-/Cargo-Toolchain. Der Lauf meldete keinen TypeScript-/Tauri-Codefehler.

## v0.64 — Logik-Pass C3–C7: Anliegen-Fokus, Platzierung, Regionsvorschau, Straßenplan, Balancing

### Was

Zweite Logikphase des Multi-Agent-Handoffs (Claude). Schließt die verbliebenen
kanonischen Datenlücken und härtet Kernregeln — alles als reine
Simulations-/Read-Projektionen hinter dem Controller, ohne Codex-UI umzubauen.

- **Anliegen auf der Karte (C3).** „Auf Karte zeigen" wirkt jetzt: `questFocus`
  liefert deterministisch den sinnvollsten Fokuspunkt eines Anliegens (echtes
  Zielgebäude → sonst nächste gesperrte, freischaltbare Region → sonst
  Stadtzentrum).
- **Platzierungs-Diagnose & Verschieben (C4).** Neuer Read-Helper
  `placementDiagnostics` (Gültigkeit/Grund, Terrain, Region, Straßenanschluss,
  Standortbonus, Kosten) für die Ghost-Vorschau. Verschieben erhält Upgrade-
  stufe, Status und Belegung.
- **Upgrade lässt Versorgung nicht auf null fallen (C4/§16).** Das
  Versorgungs-Overlay zeigte den Radius eines Gebäudes **während seines Upgrades**
  fälschlich als 0; es folgt jetzt derselben Regel wie die Simulation
  (`isContributing`) — ein Gebäude im Ausbau versorgt weiter.
- **Regionsvorschau mit echten Empfehlungen (C5).** Der Regionsdialog zeigt statt
  leerer Platzhalter die vom Regionscharakter begünstigten Gebäude
  (`regionPreview`, aus den Produktions-Modifikatoren abgeleitet).
- **Straßenplanung als Vorschau (C6).** `roadPathPreview` bewertet einen
  gezeichneten Straßenpfad vor dem Bau: pro Kachel Status/Grund/Kosten und
  Gesamtlänge/-kosten, mit pfad-bewusster Anschlussprüfung. Reine Vorschau — kein
  Sofortbau, keine Teilabbuchung (§18).
- **Balancing abgesichert (C7).** Regressionstests: eine zufriedene Großstadt
  erreicht praktisch ihre Wohnkapazität (§25); die Wirtschaft produziert nur im
  aktiven Live-Tick, nie offline (§26).

### Architektur

- Neue reine Module: `game/activities/routeAnalysis.ts` (v0.63),
  `game/regions/regionPreview.ts`, `game/roads/roadPlanning.ts`; neue Projektion
  `questFocus` in `simulation/quests.ts`. Alle nur mit Typ-Importen (§1).
- Neue Controller-Read-Helper: `questFocus`, `placementDiagnostics`,
  `regionPreview`, `roadPathPreview`. Keine neuen mutierenden Commands.

### Auswirkung

- Kein Config-/Save-Eingriff — **Schema bleibt v11**, nichts wird persistiert.
- Alle drei UI-`TODO(CLAUDE_LOGIC)` sind geschlossen.

### Zukunft

- Codex kann `roadPathPreview` für ein Zeichnen-→Bestätigen-Straßen-UI nutzen;
  ein atomarer `placeRoadPath`-Command folgt, sobald die UI dafür existiert.
- Highway/Parkplätze/Farmzäune/spielerisches Wetter bleiben eigene spätere
  Phasen mit Datenmodell + Migration.

### Dateien

`src/game/simulation/quests.ts`, `src/game/regions/regionPreview.ts` (neu),
`src/game/roads/roadPlanning.ts` (neu), `src/game/buildings/coverage.ts`,
`src/game/commands/controller.ts`, `src/components/panels/CitizenRequestsPanel.tsx`,
`src/components/panels/RegionDialog.tsx`, `src/i18n/de.json`, sowie Tests
`questFocus`/`placementUpgrade`/`regionPreview`/`roadPlanning`/`populationBalance`
und die Handoff-Dokumente.

### Assets

Keine.

## v0.63 — Stadtarbeit-Logik: kanonische Routenanalyse (Claude, Phase C2)

### Was

Erste Logikphase des Multi-Agent-Handoffs (Claude = Simulation, Codex = UI/
Renderer). Die Verkehrs-/Prognosewerte des Stadtarbeit-Routenplaners waren bisher
eine reine UI-Schätzung (Luftlinie + Hash, mit `TODO(CLAUDE_LOGIC)` markiert).
Sie werden jetzt aus dem **echten Straßennetz** berechnet.

- **Echter Straßengraph.** Neue reine Domain-Funktion analysiert die geplante
  Route auf `derived.roadNetwork`: BFS-Wegfindung Kachel für Kachel, Andocken der
  Gebäude an die nächste Fahrbahn, Verkehrslast aus der Anrainerdichte der
  befahrenen Straßenkacheln.
- **Kanonische Kennzahlen.** Streckenlänge, Fahrzeit, Kreuzungen, Staurisiko,
  Effizienz, Medaillen-Prognose und ein gedeckelter Belohnungs-Prognosefaktor
  stammen jetzt aus dieser Analyse; die Segment-Verkehrsfarben der 2D-Karte
  ebenfalls.
- **Frühe Stadt bleibt bedienbar.** Ohne Straßenverbindung fällt ein Segment
  sauber auf eine bestrafte Luftlinie zurück — nie ein Crash, nie ein leeres Panel.

### Warum

Der Planer soll strategische Tiefe haben: eine bessere Stoppreihenfolge und ein
gutes Straßennetz müssen sichtbar zu besseren Werten führen. Bisher waren die
Zahlen kosmetisch und von der Stadt entkoppelt.

### Architektur

- Neues Modul `src/game/activities/routeAnalysis.ts` — reine Simulation, nur
  Typ-Importe (CLAUDE.md §1). Deterministisch, kein RNG, kein Zeitwert.
- Neuer Read-Helper `GameController.analyseActivityRoute(defId, orderedTargetIds)`.
  Command-Grenze `startActivity`/`setActiveActivityRoute` unverändert.
- `ActivityRoutePlanner.tsx` (Codex-UI) nur minimal angebunden — Rendering/Layout
  unverändert; alte Schätzung bleibt Fallback ohne Straße.

### Auswirkung

- Reine Prognose/Anzeige: Die tatsächliche Belohnung entscheidet weiterhin die
  **Ausführungsqualität** (Fahrzeit gegen Zeitlimit), damit die Balance nicht aus
  der Planung heraus verschoben wird (siehe Entscheidung D-013).
- Save-Schema bleibt **v11**; nichts wird persistiert.

### Zukunft

- Kopplung von `rewardMultiplier` an die Auszahlung ist eine bewusste spätere
  Balancing-Entscheidung (Phase C7), erst mit Gesamt-Simulation.
- Codex kann die geplante Route auf der 2D-Karte am echten `RouteSegment.path`
  statt der synthetischen L-Polyline zeichnen (Daten liegen bereit).

### Dateien

`src/game/activities/routeAnalysis.ts` (neu), `src/game/commands/controller.ts`,
`src/components/panels/ActivityRoutePlanner.tsx`, `tests/routeAnalysis.test.ts`
(neu), `docs/agents/CLAUDE_AUDIT.md` (neu), `docs/agents/HANDOFF_LOG.md`,
`docs/agents/DECISIONS.md`, `docs/agents/PROJECT_STATE.md`,
`docs/agents/OPEN_TASKS.md`.

### Assets

Keine.

## v0.62 — Premium-Fidelity-Pass: PC-Baushop, Wetter, Stufen & Regionswelten

### Was

Die zwei zuletzt gelieferten Premium-Mockups wurden nochmals direkt gegen die
laufende v0.61-Oberfläche verglichen. v0.62 schließt die sichtbarsten
Fidelity-Lücken:

- **Großer PC-Baushop.** Ab 1680×860 wird der Katalog zu einem vollhohen rechten
  Arbeitsbereich: vier Karten pro Reihe, acht Empfehlungen, eigene Scrollfläche
  und eine große Gebäudevorschau darunter. Auf kleineren Ansichten bleibt die
  kompakte Bodenleiste. Kommende Gebäude dürfen als gesperrte Vorschau erscheinen;
  Kosten, Unlock-Level und Aktionen bleiben echte Config-Daten.
- **Gebäude-Entwicklung sichtbar.** `BuildingArt` versteht jetzt dieselbe
  visuelle Stufe wie der Renderer. Bau-Shop und Gebäude-Sheet zeigen alle
  Ausbauphasen als Vorschauleiste. Vorhandene `<id>_stageN.glb` werden
  automatisch genutzt, sonst bleibt Basisbild/SVG stabil. Eine Vorschau löst
  niemals ein Upgrade aus.
- **Wetter & Tageszeit.** Ein neues rechtes Atmosphärenfenster zeigt ein
  zusammenhängendes KI-Panorama für Sonne, Sommerregen und Morgennebel,
  Tageszeit-Presets, Slider, Tageslauf und 1×/2×/4×. Die Auswahl wirkt live in
  der 3D-Welt: Himmel, Licht, Wolken, Fernsicht und Wasserfarbe ändern sich;
  Regen erhält einen einzigen gebatchten Vorhang aus 420 Liniensegmenten.
- **Biomtreue Regions-Heros.** Gebirge/Hügel, Ebene/Flusstal/Fruchtland und
  Küste/See/Insel erhalten jeweils ein passendes Landschaftsmotiv.
- **Stadtstatus mit stabiler Hierarchie.** Zufriedenheit, Wasser, Essen, Arbeit
  und Umwelt bleiben immer an derselben Stelle. Noch gesperrte Bedarfe zeigen
  das echte Freischaltlevel statt zu verschwinden oder Prozentwerte
  vorzutäuschen.
- **Wasserfall-Landmarken.** Bis zu vier deterministisch platzierte Wasserfälle
  beleben wassernahe Bergflanken. `waterfall_cliff.glb` oder
  `waterfall_small.glb` kann per Drop-in übernehmen; bis dahin rendert ein
  prozeduraler Fels-/Wasser-/Becken-/Gischt-Fallback.
- **Regionsentscheidung lesbarer.** Vorteile und vorbereitete
  Regionsgebäude-Vorschau stehen in einer gemeinsamen Zweispaltenzone; die
  noch fehlende kanonische Gebäudeliste bleibt ehrlich als Skeleton markiert.

### Warum

v0.61 hatte die richtige Informationsarchitektur, wirkte auf großen
Desktop-Auflösungen aber noch zu sehr wie eine skalierte Kompaktoberfläche.
Insbesondere Baushop, Upgrade-Entwicklung, Wetter und wiederholte Regionsbilder
lagen hinter den neuen Referenzen. v0.62 nutzt den zusätzlichen Raum eines
PC-Spiels gezielt, ohne ein zweites UI-System oder neue simulierte Werte
einzuführen.

### Architektur

- `src/game/**` bleibt unverändert. React liest weiter Controller-Snapshots und
  schickt Commands; keine direkte State-Mutation.
- Wetter und Tageszeit liegen ausschließlich im lokalen
  `environmentSettings`-Store. `SkyEnvironment` konsumiert sie als
  Renderer-Präsentation.
- **Save-Schema bleibt v11.** Wetter, Docklayout und Vorschauphasen sind keine
  Save-Felder; keine Migration ist nötig.
- Der Regenvorhang ist ein `LineSegments`-Objekt und damit ein Draw-Call.
  Wasserfälle sind auf vier Exemplare gedeckelt.
- Modellnamen bleiben zentral in `src/assets/modelManifest.ts`; die generierten
  Modell-READMEs wurden mit dem Synchronisationstest erneuert.
- Bildpfade laufen weiter über die rekursive Drop-in-Registry. Fehlt ein
  v0.62-Bild, übernimmt der allgemeine Hero beziehungsweise die CSS-/
  prozedurale Darstellung.

### Auswirkung

Bei 1920×1080 belegt der rechte Bau-Shop 820×990 px und zeigt einen
4-Spalten-Katalog mit 796×270-px-Vorschau, während die Karte links sichtbar und
bedienbar bleibt. Das Wetter-Sheet misst 650×990 px; die rechte Anliegenleiste
tritt während großer Arbeitsfenster zurück. Kleinere Auflösungen verwenden
weiterhin die bisherige Bodenvariante. UI-Texte bleiben bei mindestens 12 px.

Regen und Nebel ändern bewusst nur die Bildstimmung. Es gibt keine
Wetterbelohnung, Ernteeinbuße, Verkehrslast oder Zeitbeschleunigung der
Simulation.

### Zukunft / bewusst offen

- Spielerisches Wetter benötigt später eine ausdrücklich entworfene,
  getestete Simulationsregel; die v0.62-Atmosphäre darf nicht stillschweigend
  dafür verwendet werden.
- `RegionPreview.futureBuildings / unlockProject` und
  `CitizenRequest.focusPosition / regionId` bleiben die zwei kanonischen
  Datenlücken aus v0.61.
- Ein drehbares Live-Modell im Gebäude-Sheet kann die neue Stufenleiste später
  ergänzen; GLB-Thumbnail, Bild und SVG bleiben die verbindliche Fallbackkette.
- Der Screenshot-Endpunkt des eingebauten Browsers lief weiterhin in ein
  Zeitlimit. Die DOM-/Interaktionsabnahme bei echter 1920×1080-Innenfläche ist
  dokumentiert; keine nicht entstandenen Screenshots werden behauptet.

### Dateien

- UI/Komposition: `src/App.tsx`, `src/state/store.ts`,
  `src/components/hud/CameraControls.tsx`
- Neue Ansicht: `src/components/panels/WeatherPanel.tsx`
- Bau/Region/Status: `BuildMenu.tsx`, `FloatingBuildingSheet.tsx`,
  `RegionDialog.tsx`, `CityStatusPanel.tsx`
- Art-/Modellstufen: `src/components/art/BuildingArtwork.tsx`
- Renderer: `src/renderer/three/environmentSettings.ts`,
  `SkyEnvironment.ts`, `ThreeMapRenderer.ts`
- Gestaltung: `src/styles/components.css`, `src/styles/responsive.css`,
  `src/i18n/de.json`
- Assets: `src/assets/ui/weather/**`, `src/assets/ui/regions/**`,
  `src/assets/modelManifest.ts`, generierte Modell-READMEs
- Übergabe: `docs/agents/**`, `docs/UI_ASSETS.md`, `docs/PATCHNOTES.md`

### Neue KI-Assets

- `src/assets/ui/weather/weather_cycle_premium.jpg`
- `src/assets/ui/regions/region_unlock_fertile.jpg`
- `src/assets/ui/regions/region_unlock_coast.jpg`

Finale Prompts, Maße, Dateigrößen, Nutzung und Fallbacks stehen in
`docs/agents/UI_ASSET_MANIFEST.md`.

## v0.61 — Verbindlicher Mockup-Pass: Bau-Shop, Info-Layer, Rollen & Weltlesbarkeit

### Was

Der neueste Gesamt-Mockup und die beiden vorherigen UI-/Welt-Mockups wurden als
verbindliche visuelle Spezifikation auf die bestehende v0.60-Architektur
übertragen. Der Pass schärft besonders die zuvor noch zu generischen oder
unvollständigen Bereiche:

- **Bau-Shop statt einfacher Liste.** Der Gebäudekatalog startet mit
  „Empfohlen“, trennt Kategorien klarer, zeigt Kosten, Bauzeit, Freischaltung,
  Baugrenze und echte Building-Config-Effekte. Rechts erscheint eine große
  Hover-/Fokusvorschau mit Gebäude-Art, Kategorie, Grundfläche und Standorttext.
- **Gebäude-Detail als echtes Arbeitsfenster.** Hero-Art, Stufe, Produktion,
  Unterhalt, Arbeiter, Standortanalyse, Straßenanschluss, Region, Gelände,
  Grundfläche und ein proportionaler Radiusindikator stammen aus vorhandenen
  Config-/Snapshot-/Diagnosedaten. Es werden keine Wirkungswerte erfunden.
- **Bürgeranliegen als Inbox.** Rechts bleiben höchstens drei kompakte Karten.
  „Alle Anliegen“ öffnet ein großes, filterbares Sheet für aktiv, abholbereit
  und abgeschlossen. Ein eigenes Detail zeigt vollständige Ziele und
  Belohnungen. „Bereit“ bedeutet ausschließlich `quest.claimable`; eine
  erfundene Prioritätslogik existiert nicht.
- **Stadtstatus mit kanonischem Leitwert.** Der große Status verwendet die
  bestehende Zufriedenheit als Gesamtwert, listet Controller-Diagnosen und
  Bedarfe und markiert die Darstellung ausdrücklich als Live-Projektion
  vorhandener Stadtwerte.
- **Info-Layer.** Eine neue, rein visuelle Leiste schaltet `Aus`, `Probleme`,
  `Bedürfnisse`, `Upgrades`, `Produktion` und `Alle`. Der Renderer leitet Marker
  nur aus Aktivitätszielen, Baustatus, `getBuildingMarker`, Building-Config und
  `effectiveEffects` ab. Marker werden priorisiert, bei großer Entfernung
  ausgeblendet und in der Übersicht grob geclustert.
- **Navigation und Zeit.** Die linke Hauptleiste enthält nur die stabilen
  Hauptziele Überblick, Bauen, Stadtarbeit, Handel, Statistiken und
  Bürgermeister; Regionen bleiben als kleine Weltaktion. Pause/1×/2×/4× sind
  weiterhin ausdrücklich nur visuelle Tageslichtsteuerung.
- **Interaktive Inselkarte.** Die Minimap ist größer, erhält Relief-/Makrofarbe,
  Fokusstatus und Regionsmodifikatoren und kann die Kamera jetzt per Klick oder
  Ziehen verschieben. Sie bleibt eine leichte Canvas-Projektion, kein zweiter
  Renderer.
- **Regionsfenster.** Gebirge und Hügelland nutzen einen eigenen
  KI-generierten Hochland-Hero. Ein Bereich „Zukünftige Gebäude“ ist bewusst als
  ausstehende Datenquelle markiert; die drei Skeleton-Slots sind keine
  freigeschalteten Gebäude.
- **Rollen statt Wiederholung.** Die Portrait-Registry lädt rekursiv
  `role_N`-Varianten und wählt sie deterministisch nach Quest-Schlüssel. Zwei
  Händler, Bauamtsleitung und Feuerwehrleitung ergänzen die vorhandenen
  Portraits, sodass wiederholte Rollen nicht zwangsläufig dasselbe Gesicht
  zeigen.
- **Weltlesbarkeit.** Hohe Gebiete staffeln sich nun aus Moos, warmem Fels,
  sonnenbeschienenem Stein und Gipfelschnee. Flache türkise Küstenzonen liegen
  unter der Schaumlinie. Gesperrte Regionen besitzen vier langsam driftende
  Nebelschichten. Instanzierte Blumen, Feldspuren und Totholz brechen große
  Biome mit nur drei zusätzlichen Draw-Calls auf.
- **Performance bei großen Auflösungen.** Der Three-Renderer begrenzt die
  Pixeldichte adaptiv auf 1,5 beziehungsweise 1,25 oberhalb von zwei Millionen
  Viewport-Pixeln. DOM-Text und UI bleiben in Geräteauflösung scharf.
- **CSS aufgeteilt.** Neue Regeln liegen in `tokens.css`, `layout.css`,
  `components.css`, `animations.css` und `responsive.css`. `styles.css` bleibt
  als Legacy-Basis importiert; die neuen Dateien überschreiben sie geordnet.
  D-004 bleibt bindend: berechnete UI-Schriftgrößen liegen nicht unter 12 px.

### Warum

v0.60 hatte die richtige Grundarchitektur, wich im Alltag aber noch an
entscheidenden Stellen von den Mockups ab: Der Baukatalog war zu listenartig,
Gebäudedetails zu schmal, Marker nicht filterbar, Anliegen nicht als vollständige
Inbox organisiert, Berge zu dunkel und Nebel zu flach. v0.61 schließt genau diese
Lücken, ohne aus einer visuellen Referenz neue Simulation, Priorität, Reichweite,
Verkehrslast oder Regionsbelohnung abzuleiten.

### Architektur

- `src/game/**` wurde nicht verändert und importiert weiterhin keine UI- oder
  Renderer-Abhängigkeit.
- Der UI-Store hält `infoLayerMode` nur als Präsentationszustand. `MapApi` reicht
  ihn an `IMapRenderer.setInfoLayer()` durch.
- Three.js liest Controller-Snapshots, Diagnosen und validierte Configs; es
  mutiert keinen GameState.
- Minimap-Panning ruft ausschließlich `MapApi.focusGround()` auf.
- Bild- und Portraitordner werden rekursiv über `registry.ts` geladen.
- Marker-Modellnamen bleiben zentral in `modelManifest.ts`; fehlende GLBs/Bilder
  verwenden die vorhandenen Canvas-/SVG-/prozeduralen Fallbacks.
- **Save-Schema bleibt v11.** Es gibt keine neue persistierte Spielregel und
  keine Migration.

### Auswirkung

Die Hauptansicht bleibt bei 1280×720 ohne Dokument-Scroll und ohne außerhalb des
Viewports liegende Hauptpanels. Bau-Shop, Stadtstatus und Anliegen-Inbox bleiben
im sicheren Bereich und besitzen lokale Scrollflächen, falls mehr Inhalt
hinzukommt. Die adaptive Renderer-Auflösung reduziert GPU-Füllrate bei
QHD/4K. Marker-Clustering und feste Vegetationsbudgets verhindern, dass der
visuelle Zugewinn linear mit der Stadtgröße wächst.

### Zukunft / bewusst offen

- `TODO(CLAUDE_LOGIC): CitizenRequest.focusPosition / regionId` muss eine
  kanonische Kartenposition liefern, bevor „Auf Karte zeigen“ aktiviert wird.
- `TODO(CLAUDE_LOGIC): RegionPreview.futureBuildings / unlockProject` muss
  echte, getestete Regionsvorschauen liefern; bis dahin bleiben Skeletons.
- Der Radius im Gebäudedetail ist eine vorhandene Config-Angabe. Eine echte
  Geländeprojektion bleibt O2/O6.
- Straßenplanung, Verkehrssegmentlast, spielerisches Wetter und
  Simulationsgeschwindigkeit bleiben die in `OPEN_TASKS.md` beschriebenen
  Gameplay-Phasen.

### Dateien

- UI-Komposition/Store: `src/App.tsx`, `src/state/store.ts`,
  `src/components/MapView.tsx`, `src/renderer/IMapRenderer.ts`
- HUD/Navigation/Karte: `src/components/hud/GameHud.tsx`,
  `CameraControls.tsx`, `QuickActionBar.tsx`, `WorldMiniMap.tsx`,
  `InfoLayerControl.tsx`
- Fenster: `BuildMenu.tsx`, `FloatingBuildingSheet.tsx`,
  `CitizenRequestsPanel.tsx`, `CityStatusPanel.tsx`,
  `CityStatusDetail.tsx`, `RegionDialog.tsx`
- Renderer: `src/renderer/three/ThreeMapRenderer.ts`
- Gestaltung: `src/styles/*.css`, `src/main.tsx`, `src/i18n/de.json`
- Assets: `src/assets/registry.ts`, `src/assets/modelManifest.ts`,
  `src/assets/portraits/**`, `src/assets/ui/regions/**`
- Übergabe: `docs/agents/**`, `docs/ASSETS.md`, `docs/UI_ASSETS.md`

### Neue KI-Assets

- `src/assets/portraits/merchants/merchant_1.png`
- `src/assets/portraits/merchants/merchant_2.png`
- `src/assets/portraits/workers/buildingDept_1.png`
- `src/assets/portraits/emergency/fire_1.png`
- `src/assets/ui/regions/region_unlock_highland.jpg`

Prompts, Herkunft, Nutzung und Fallbacks stehen vollständig in
`docs/agents/UI_ASSET_MANIFEST.md` und `docs/agents/CODEX_VISUAL_AUDIT.md`.

## v0.60 — Overhaul 3.0: Mockup-HUD, Inselkarte, Weltatmosphäre & KI-Assets

**Was.** Die drei beigefügten ChatGPT-Mockups wurden als visuelle Leitlinie in
die bestehende 3D-Anwendung übertragen:

- **Maritime Civic Glass.** Das HUD nutzt nun dunkles blaugrünes Glas, feine
  Rahmen, warme Goldakzente und eine klarere Typohierarchie. Der Levelblock trägt
  ein eigenes Bürgermeisterwappen; Ressourcen, Änderungsrate, Zufriedenheit und
  Zeitsteuerung sind kompakter und lassen der Welt mehr Raum.
- **Neue Navigation.** Die Hauptziele Stadt, Bauen, Stadtarbeit, Regionen,
  Statistiken und Rathaus sitzen nach dem zuletzt gelieferten Master-Mockup als
  kompakte vertikale Leiste links. Overlay-, Ausblend-, Handels- und
  Menüfunktionen bilden eine kleinere Hilfsgruppe; die Kamera-Presets bleiben
  unten mittig. Jede Schaltfläche verwendet bestehende Panels,
  Kamera-Presets und Commands.
- **Bürger-Kompakt- und Detailansicht.** Anliegen bleiben als kleine Inbox rechts
  sichtbar. Ein Klick öffnet ein großes Sheet mit Portrait, vollständiger
  Beschreibung, Teilzielen, Fortschritt und Belohnungen. Andere Kontexte
  schließen dieses Detail automatisch.
- **Bildstarke Regionsfreischaltung.** Der Regionsdialog besitzt nun ein breites
  KI-generiertes Inselpanorama und ordnet Region, Biom, Boni, Nachteile, Kosten
  und Bestätigung in derselben Fensterhierarchie wie das Master-Mockup an.
- **Stadtarbeit-Routenplanung.** Fahrmissionen öffnen vor dem Start einen
  vollflächigen Top-down-Planer nach dem Stadtarbeit-Mockup: Quelle,
  nummerierte Ziele, farbige Belastungssegmente, Routenlänge, Zeit,
  Kreuzungen, Staurisiko, Effizienz-/Medaillenprognose, Zielreihenfolge,
  Zurücksetzen, Speichern/Laden und automatische Nächster-Nachbar-Optimierung.
  Die geplante Reihenfolge wird beim Start validiert an den bestehenden
  `GameController` übergeben und im manuellen Fahrmodus verbindlich abgefahren.
- **Kollisionsfreies HUD.** Hauptnavigation, Stadtstatus und Inselkarte belegen
  getrennte linke Zonen; rechts bleibt ausschließlich die Bürger-Inbox.
  Stadtarbeit ist über die Hauptnavigation erreichbar. Responsive Regeln
  für 1420/1120 px und geringe Höhe halten die Navigation erreichbar. Der
  UI-Store erzwingt zusätzlich eine Ein-Sheet-Regel zwischen Panel,
  Gebäudeauswahl und Regionsdialog.
- **Live-Inselkarte.** `WorldMiniMap` zeichnet Terrain, organische
  Regionsgrenzen, Freischaltstatus, Gebäude, Straßen, Probleme, Missionsziele
  und Rathausposition aus echten Config-/Snapshot-Daten. Ein Live-Rahmen zeigt
  Ziel, Orientierung und Zoom der 3D-Kamera; ein Klick fokussiert die
  entsprechende Weltposition. Es existiert kein zweiter Kartenrenderer.
- **Weltpolish.** Der Ozean verdeckt die endliche Heightfield-Fläche und geht in
  der Fernansicht atmosphärisch weiter. Eine gebatchte Schaumlinie markiert
  Land-Wasser-Kanten. Gesperrte Regionen bleiben im Überblick lesbar.
  Vegetation steht in deterministischen Clustern mit Größenvariation statt im
  Schachbrett. Die frühere senkrechte Glaswand wurde durch horizontale,
  mehrschichtige Wolkenbänke mit Bodensilhouetten ersetzt.
- **Landmarken und Atmosphäre.** Ein festes Budget von zehn Himmelswolken sorgt
  für Tiefe. Wenige deterministisch gesetzte Boote, Windmühlen und Leuchttürme
  geben Küsten und fruchtbaren Regionen markante Silhouetten. Die
  Inselübersicht zentriert nun die gesamte 384×384-Welt.

**Warum.** Das bisherige UI war funktional, aber visuell fragmentiert und nahm
der Welt durch große, konkurrierende Flächen die Bühne. Die Fernansicht zeigte
eine endliche rechteckige Bodenfläche, Wälder wirkten gerastert und der
Regionsnebel wie eine Wand. v0.60 schafft die gemeinsame visuelle Sprache der
Mockups und beseitigt diese Brüche, ohne vorzeitig neue Gameplay- oder
Save-Systeme einzuführen.

**Architektur.** Simulation und Darstellung bleiben getrennt. `src/game/**`
wurde nicht um UI-/Three-Abhängigkeiten erweitert. `WorldMiniMap` liest nur
Snapshots und statische Weltfunktionen; `getCameraView()`/`focusGround()`
erweitern die kleine `MapApi`, ohne Renderer-Interna in die UI zu tragen.
Navigation mutiert ausschließlich den UI-Store bzw. ruft diese Brücke auf.
`SCENIC_PROP_MODELS` ist die
zentrale Modell-Namensquelle, `registry.ts` die Drop-in-Quelle für Wappen und
Umgebungstextur. Jedes neue Bild/Modell besitzt einen prozeduralen oder
Icon-Fallback. Die Wolken-, Landmarken-, Schaum- und Vegetationsmengen sind
begrenzt; wiederholte Naturmodelle bleiben instanziert. **Save-Schema bleibt
v11**, keine Migration.

Der Routenplaner ist eine UI-Projektion des bestehenden Aktivitätssystems:
`getActivityRoutePlan()` erzeugt eine RNG-neutrale Vorschau,
`startActivity(defId, plannedTargetIds)` validiert und übernimmt die Reihenfolge.
Die aktive Aktivität verwendet weiterhin dieselbe Save-Struktur und denselben
Belohnungs-/Fortschrittsweg. Belastungsfarben und Prognose sind in v0.60 bewusst
eine deterministische Planungsschätzung; ein echtes Verkehrsmodell bleibt O9.

**KI-Assets.**

- `src/assets/ui/brand/mayor_crest.png` — generiertes goldenes
  Bürgermeister-/Kompasswappen, transparent optimiert auf 256×256.
- `src/assets/environment/cloud_bank.webp` — generierte Graustufen-Wolkenmaske
  für Himmel und Regionsnebel, 1024×1024 WebP.
- `src/assets/ui/events/region_unlock_hero.webp` — KI-generiertes, auf
  1280×720 und ca. 171 kB optimiertes Inselpanorama für den Regionsdialog.
- `boat_small.glb`, `windmill_small.glb`, `lighthouse.glb` — lokal
  KI-generierte, prozedural modellierte Low-Poly-GLBs mit kleinen Dateibudgets
  (ca. 14/26/24 kB), über die bestehende Prop-Registry geladen.

**Auswirkung.** Der aktive Spielablauf, Ökonomie, Balancing und gespeicherte
Fortschritt bleiben unverändert. UI und Welt sind auf 1280×720 ohne
Konsolenfehler geprüft; Hauptansicht, Bürgerdetail und Gebäudekatalog bleiben
lesbar und kollisionsfrei. Alle überarbeiteten UI-Schriften sind mindestens
12 px groß. Die drei GLBs sowie Wappen, Wolkenmaske und Regions-Hero werden im
Produktions-Build korrekt gebündelt.

**Bewusst offen / Zukunft.** Der Routenplaner ist vollständig bedienbar, nutzt
aber noch keine reale Verkehrssimulation: Belastungssegmente sind eine
deterministische Schätzung, und die tatsächliche Bronze-/Silber-/Gold-Auszahlung
bleibt wie bisher zeitbasiert. Ein echter Straßengraph mit Verkehrsdaten,
Stauprognose und Routenbewertung folgt zusammen mit O9/O10. Ebenfalls offen
bleiben Ausbauflächen (O4), bestätigungspflichtige Straßenplanung (O6),
spielerisches Wetter (O11) sowie der O2-Rest aus Platzierungs-Ghost,
Wirkungsradien und Größen-Audit. Exakter Stand:
`docs/OVERHAUL_3_PLAN.md`; Einstieg für die Weiterarbeit:
`docs/agents/README.md`.

**Verifikation.** `npx tsc -b --force` grün · `npx eslint src tests` grün ·
`npx vitest run` grün (**26 Dateien / 185 Tests**) · `npm run build` grün.
Screenshot-Smoke 1280×720: keine Konsolenfehler, Level-/Ressourcenleiste,
linke Navigation, Stadtstatus, Bürger-Kompakt-/Detailansicht, Live-Inselkarte
und Kameraaktionen sichtbar und kollisionsfrei. 1920×1080 ist ebenfalls
kollisionsfrei; der Ein-Sheet-Smoke bestätigt, dass der Gebäudekatalog das
Bürgerdetail schließt. Der Build meldet weiterhin nur die bereits bekannte
Rollup-Warnung zum großen Haupt-Chunk.

**Dateien.** UI: `src/App.tsx`, `src/styles.css`, `src/state/store.ts`,
`src/components/hud/{GameHud,QuickActionBar,CameraControls,WorldMiniMap}.tsx`,
`src/components/panels/{ActivityRoutePlanner,ActivityPanel,CityWorkPanel,
CitizenRequestsPanel,RegionDialog}.tsx`, `src/i18n/de.json`. Commands/Welt:
`src/game/commands/controller.ts`, `src/components/MapView.tsx`,
`src/renderer/IMapRenderer.ts`,
`src/renderer/three/{ThreeMapRenderer,SkyEnvironment,environment,CameraConfig,
CameraController3D}.ts`, `tests/{camera,missions}.test.ts`. Assets:
`src/assets/registry.ts`, `src/assets/modelManifest.ts`,
`src/assets/ui/{brand,events}/`, `src/assets/environment/`,
`src/assets/models/props/nature/` plus generierte Props-README/PROMPTS.
Dokumentation: `README.md`, `CLAUDE.md`, `docs/{PATCHNOTES,ARCHITECTURE,
3D_CAMERA_CONTROLS,3D_WORLD_ASSETS,ASSETS,UI_ASSETS,OVERHAUL_3_PLAN,
UI_DESIGN_SYSTEM,UI_AUDIT,HANDOFF_CLAUDE}.md` sowie `docs/agents/*.md`.

## v0.59 — Ausbaustufe 2.0, Phase A10: Balancing, Bereinigung & Abschluss

**Was.** Der Abschluss des Programms **Ausbaustufe 2.0** (Gebäudesystem 2.0 +
Welt 2.0, A1–A10): Balancing verifiziert, Alt-Lasten bereinigt, Abschlussliste.

- **Balancing-Pass (verifiziert, nicht gewürfelt).** Die in A1 neu gesetzte
  Ökonomie über 20 Level × 32 Regionen ist strukturell abgesichert: neue
  Invarianten-Tests in `balancing.test.ts` erzwingen, dass jede Ausbaustufe
  **streng teurer** und **streng höher gegatet** ist als die vorige, dass keine
  Region **vor ihren Voraussetzungen** freischaltbar ist und alle Regions-Gates
  in **L1–L18** liegen (Meilenstein-Gefühl §5, „Expansion ist eine
  Entscheidung"). Zahlen bleiben config-getrieben — die Tests prüfen die Regel,
  nicht das Literal.
- **Bereinigung.** `pixi.js` als Abhängigkeit entfernt (der 2D-/Iso-Renderer war
  schon in A1 raus, jetzt auch das tote Paket); die entfallenen Gebäude-Assets
  `house_row.png`/`apartment.png` und die Iso-Doku
  (`ISO_ASSETS.md`/`ISO_RENDERING.md`) nach `archive/legacy-2d/` verschoben;
  drei liegengebliebene `adjustment_report*.json` gelöscht; ein veralteter
  „Pixi renderer"-Kommentar in `App.tsx` korrigiert. CLAUDE.md-Statusnotiz
  ergänzt.

**§28 — Abschlussliste (Entfernt / Ersetzt / Migriert / Archiviert / Behalten).**

- **Entfernt:** 2D-/Iso-Pixi-Renderer (A1) · `pixi.js`-Abhängigkeit (A10) ·
  Gebäude `house_row`, `apartment` (A1, Migration erstattet) · 36 Quadrat-Sektoren
  (`sectors.config.ts`, A1) · `adjustment_report*.json`-Reste (A10).
- **Ersetzt:** Sektoren → **32 organische Regionen** (`regions.config.ts` +
  Bake-Segmentierung) · Kategorie-Höhen → **Größenklassen XS–XXL** ·
  Klick-Stadtarbeit → **Fahrmodus** (A6) · hand­gepflegte Gebäude-Doku →
  **generiert** (`docs/BUILDINGS.md`, A9).
- **Migriert:** Save **v10 → v11** (eine Migration, 100 % Erstattung, Rathaus 5×5,
  Sektor→Region, Level-Rederivierung, A2).
- **Archiviert:** `archive/legacy-2d/` (2D-Gebäude-Artwork der entfallenen
  Gebäude + Iso-Doku) — historisch, nicht reaktivieren.
- **Behalten:** three-Renderer (`src/renderer/three/`) als einziger Renderer ·
  Drop-in-Asset-Registry (§5) · alle bestehenden `.glb`/`.png`-Assets aktiver
  Gebäude · Quest-/Bürger-/Aktivitäts-System (für Fahrmissionen erweitert).

**Bewusst offen (drop-in-fähig).** Der erweiterte Biom-Prop-**Katalog**
(Wasserfälle, Windmühlen, Heuballen, Boote, dedizierte Landmarken) bleibt
Polish: die prozeduralen Fallbacks (A3/A7) decken den Kern, und die vollständigen
Text-zu-3D-Prompts existieren bereits generiert (A9) — echte `.glb` einfach in
den passenden Ordner legen, der Renderer nutzt sie automatisch (§5). Ein
GPU-Profiling der Groß-Stadt braucht echte Hardware; die Budgets (Instancing,
Distanz-Culling, Deko-/Tier-/Verkehrs-Caps) stehen aus A3/A7 und wurden im
Boot-Smoke ohne Konsolenfehler bestätigt.

**Verifikation.** `tsc`/`eslint`/`vitest` (185, davon 4 neue Balancing-Invarianten)/
`build` grün. Boot-Smoke (1280×720, Beispielstadt) ohne Konsolenfehler nach
Paket-/Asset-Bereinigung — Welt, Gebäude und Panels rendern korrekt. Reine
Bereinigungs-/Test-/Doku-Phase ohne Renderer-Änderung.

**Dateien.** Entfernt: `pixi.js` (package.json/-lock),
`src/assets/models/**/adjustment_report*.json`. Archiviert nach
`archive/legacy-2d/`: `house_row.png`, `apartment.png`, `ISO_ASSETS.md`,
`ISO_RENDERING.md` (+ `archive/legacy-2d/README.md`). Geändert:
`tests/balancing.test.ts` (Invarianten), `src/App.tsx` (Kommentar), `CLAUDE.md`
(Statusnotiz).

## v0.58 — Ausbaustufe 2.0, Phase A9: Doku & Prompts — generierte Gebäude-/Regionstabellen, ein Prompt je Stufe

**Was.** Die verbindliche Asset- und Gameplay-Doku wird vollständig aus der
Config generiert und testgeprüft synchron gehalten (§ Auftrag A §10–§11, §13
„Gameplay ↔ Doku ↔ Assets konsistent"):

- **`docs/BUILDINGS.md` (neu, generiert).** Die verbindliche Gebäudetabelle:
  Größenklassen-Legende (XS–XXL mit Tri-/Textur-/Material-Budgets), eine
  Übersicht aller Gebäude und pro Gebäude ein Detailblock mit Footprint,
  Asset-Budget, benötigten GLBs (`<id>.glb` / `<id>_stageN.glb` /
  `<id>_construction.glb`), Modell-Nodes (`chimney`/`rotor`), Besonderheiten
  (Standortbonus, Baugrenze, Adjazenz …) und einer **Stufentabelle** (Name,
  Level-Gate, Kosten, Kern-Wirkung je Stufe). Dazu die 20-Level-XP-Kurve.
- **`docs/REGIONS.md` (neu, generiert).** Alle 32 organischen Regionen mit
  Biom, Freischaltung (Level/Kosten), Voraussetzungen, bebaubaren Kacheln,
  Produktions-Modifikatoren und Nachteilen; Startregion und Teaser-Insel
  hervorgehoben.
- **Ein 3D-Prompt JE AUSBAUSTUFE.** `src/assets/models/buildings/PROMPTS.md`
  emittiert jetzt nicht mehr einen Block je Gebäude, sondern **einen
  copy-paste-fertigen Tripo-Prompt je Stufen-Datei** (Basis + `_stage2`…
  `_stageN`) mit eigenem Motiv — vom Kleinen Haus über sechs Stufen bis zum
  Wohnblock, jeder mit voller Spec-Zeile (Größenklasse-Budget, fixer Footprint,
  Pivot, Front, Nodes).
- **Neue Prompt-Kataloge.** Ordner `animals/` für die A7-Weidetiere
  (Kuh/Schaf/Huhn/Pferd/Schwein/Ziege), Farm-Props (Feldreihen, Holzzaun, Tor,
  Vogelscheuche, Windmühle) und die A6-Stadtarbeit-Fahrzeuge (`logging_truck`,
  `flatbed`) im Fahrzeug-Katalog.

**Warum & Architektur.** §2 gewahrt — kein neues Doku-System, sondern der
bestehende Generator-Pfad erweitert: neuer reiner Builder
`src/assets/buildingSpecDocs.ts` (`buildBuildingsSpec`/`buildRegionsDoc`, leitet
aus `buildings.config`/`levels.config`/`regions.config` + i18n ab, importiert
nie Renderer/State — §1 gewahrt) und in `modelManifest.ts` neu
`BUILDING_STAGE_PROMPTS` (Motiv je Stufe), `BUILDING_SIZE_BUDGETS` (XS–XXL) und
`BUILDING_NODES`. Zwei Sync-Tests halten alles an der Config: neuer
`tests/buildingDocs.test.ts` (`WRITE_BUILDING_DOCS=1`) für BUILDINGS/REGIONS.md,
erweiterter `tests/modelReadmes.test.ts` erzwingt **Prompt-Anzahl ≡ Stufenzahl**
je Mehrstufen-Gebäude und verbietet verwaiste Stufen-Prompts. Nebenbei
bereinigt: die entfallenen `house_row`/`apartment` aus den Prompt-Daten
entfernt, die (hand­gepflegte, veraltete) Gebäude-Tabelle in
`3D_MODEL_MANIFEST.md` auf die aktuellen Größen/Stufen korrigiert und auf die
generierten Dokumente verwiesen.

**Auswirkung.** Artists bekommen pro Stufe genau einen fertigen Prompt und eine
verbindliche Tabelle, was das Modell leisten muss; die Doku kann nicht mehr von
der Config abweichen, ohne dass ein Test bricht.

**Verifikation.** `tsc`/`eslint`/`vitest` (181, davon 6 neu)/`build` grün. Alle
`WRITE_*`-Regens laufen sauber durch (Doku-Sync bewiesen). Reine Doku/Daten-
Phase ohne Renderer-Änderung — kein Screenshot-Smoke nötig.

**Dateien.** Neu: `src/assets/buildingSpecDocs.ts`, `tests/buildingDocs.test.ts`,
`docs/BUILDINGS.md`, `docs/REGIONS.md`, `src/assets/models/animals/PROMPTS.md`.
Geändert: `src/assets/modelManifest.ts` (`BUILDING_STAGE_PROMPTS`,
`BUILDING_SIZE_BUDGETS`, `BUILDING_NODES`, `buildBuildingsPrompts` je Stufe,
Weidetiere/Farm/Fahrzeug-Prompts), `tests/modelReadmes.test.ts`,
`docs/3D_MODEL_MANIFEST.md`, `docs/WORLD_REBUILD.md`, die generierten
`src/assets/models/**/PROMPTS.md`.

## v0.57 — Ausbaustufe 2.0, Phase A8: UI-Audit — Panels über der unteren Leiste

**Was.** Ein systematisches Layout-Audit aller Panels bei zwei Auflösungen
(1280×720 und 1920×1080) mit gefüllter Beispielstadt (§14 Auftrag B):

- **Bürgeranliegen ↔ untere Leiste behoben.** Auf niedrigen Auflösungen reichte
  das rechte „Stadt-Status"-/Bürgeranliegen-Widget bis zum Fensterboden und wurde
  von der unteren rechten Schnellleiste („Bauen"-Knopf + Quick-Bar) verdeckt bzw.
  angeschnitten. Rechts angedockte Info-Blätter (`.side-panel`: Stadtarbeit,
  Bürgermeister, Statistiken/Wirtschaft) hatten dasselbe Problem.
- **Reservierter Freiraum.** Neue CSS-Variable `--bottom-bar-clear` (120px)
  reserviert den vertikalen Platz der unteren Leiste. Rechte Panels enden jetzt
  garantiert darüber; ihr Inhalt scrollt intern (die Anliegen-Liste behält ihren
  „Alle Aufträge ansehen"-Fußknopf sichtbar).

**Warum & Architektur.** Reines Layout/CSS — keine Komponenten- oder
Simulationsänderung. Der Freiraum ist zentral als Variable gesetzt, statt an
mehreren Panels einzeln, damit künftige Panels denselben Wert erben. `.side-panel`
endet bei `calc(var(--hud-gap) + var(--bottom-bar-clear))`; die Anliegen-Liste
kappt ihre `max-height` um denselben Betrag.

**Auswirkung.** Auf 720p-Fenstern (und schmalen Desktop-Fenstern) bleiben alle
rechten Panels vollständig bedien- und lesbar, ohne die untere Leiste zu
überlappen. Auf 1080p+ unverändert (dort war ohnehin genug Höhe).

**Verifikation.** `tsc`/`eslint`/`vitest` (175)/`build` grün. Playwright-Smokes
je Auflösung mit Beispielstadt: Standardansicht, Bauen, Stadtarbeit,
Bürgermeister, Statistiken geöffnet — bei 1280×720 enden alle rechten Panels
sauber über der Leiste (vorher/nachher verglichen), bei 1920×1080 unverändert
korrekt, keine Konsolenfehler.

**Dateien.** `src/styles.css` (`--bottom-bar-clear`, `.side-panel` bottom,
`.citizen-requests` max-height).

## v0.56 — Ausbaustufe 2.0, Phase A7: Lebendige Welt — Farmen, Weidetiere, Biom-Deko

**Was.** Die Welt bekommt Leben zwischen den Gebäuden (§ Auftrag B, absorbiert
MVP4 P6):

- **Bauernhof als wachsendes Areal.** Fehlt ein `farm.glb`, baut der Renderer die
  Farm nicht mehr als Würfel, sondern als Hof-Ensemble, das mit der Stufe wächst
  (Bauernhof → Großfarm → Agrarkomplex): Ackerboden mit Feld-Furchen, Scheune mit
  Satteldach, **Silos** (Anzahl + Höhe je Stufe) und ein umlaufender Holzzaun mit
  Pfosten. (Liegt ein `farm.glb` vor — wie aktuell —, hat es weiter Vorrang; dies
  ist der garantierte Fallback.)
- **Weidetiere (animiert).** Jeder aktive Bauernhof bekommt Tiere (Kühe/Schafe/
  Hühner, mehr je Stufe), die auf einer **Weide neben** dem Hof grasen —
  gemächliches Wandern im Weide-Radius mit gelegentlichem Richtungswechsel und
  leichtem Wippen. Sie stehen auf freien Kacheln rund um das Grundstück (nie
  unter dem Gebäudemodell), gedeckelt bei 48 Tieren fürs Draw-Call-Budget.
- **Biom-Deko (instanziert, terrainabhängig).** Findlinge im Gebirge und Schilf
  an Wasserkanten (Seen/Flüsse) ergänzen die bestehenden Wald-/Busch-Instanzen —
  über denselben `InstancedMesh`-Pfad, mit Kappungen (je 400) und Distanz-Culling
  durch das Region-Rebuild.
- **Ferne Platzhalter-Inseln.** Ein Ring niedriger, bewaldeter Silhouetten (teils
  mit grauem Gipfel) weit außerhalb der Weltränder gibt dem Ozean einen Horizont
  statt ins Leere zu laufen. Einmalig mit dem Meer gebaut, rein kosmetisch.

**Warum & Architektur.** §2 gewahrt — erweitert wird der bestehende
Vegetations-/Live-Layer (`rebuildVegetation`, `liveGroup`, Animations-Loop),
kein neues System. Tiere laufen wie der Ambient-Verkehr über den Frame-Loop
(`seedAnimals` reseeded nur bei Farm-Änderung via `animalKey`; `animateAnimals`
bewegt sie). Farm-Ensemble/Tier-Meshes sind prozedurale Fallbacks — Drop-in-GLBs
(`farm.glb`, später `cow.glb` …) haben immer Vorrang (§5). Alles `three`-seitig,
die Simulation bleibt unberührt.

**Auswirkung.** Farmen fühlen sich als Höfe an statt als Klötze; die Landschaft
wirkt bewohnt. Grundlage für die spätere Landmarken-/Deko-Erweiterung.

**Umfang/Offen (ehrlich).** Der Kern steht (Farm-Ausbau, Tiere, Findlinge/Schilf,
Platzhalter-Inseln). Der vollständige Biom-Prop-Katalog (Wasserfälle, Heuballen,
Obsthaine, Windmühle, Pilze, Sandbänke, Boote) und dedizierte Landmarken bleiben
einer leichteren Folgepass (A10-Politur) überlassen — bewusst gesetzt, um A7
sauber und verifiziert zu landen.

**Verifikation.** `tsc`/`eslint`/`vitest` (175)/`build` grün. Playwright-Smokes:
Farm-Nahaufnahme (drei Farmen Stufe 0/1/2, Kühe/Schafe/Hühner grasen sichtbar in
den Weiden), Insel-Übersicht (alle Regionen frei: Gebirge/Wald/Seen korrekt,
Biom-Deko platziert, ferne Inseln am Horizont), keine Konsolenfehler.

**Dateien.** `ThreeMapRenderer.ts` (`farmProc`, `makeAnimalMesh`, `seedAnimals`/
`animateAnimals` + `animals`/`animalKey`, `ANIMAL_CAP`, Findling-/Schilf-Instanzen
in `rebuildVegetation`, `buildDistantIslands`, Farm-Zweig in `proceduralBuilding`).

## v0.55 — Ausbaustufe 2.0, Phase A6: Stadtarbeit selbst fahren — Fahrmodus + 5 Fahrmissionen

**Was.** Die Stadtarbeit wird zum echten Fahr-Minispiel (§9 Auftrag B): statt
Lieferziele nur anzuklicken, steigt der Spieler ins Missionsfahrzeug und fährt
selbst über das Straßennetz.

- **Fahrmodus (WASD / Pfeile, Verfolgerkamera).** Ein „Selbst fahren"-Knopf in
  der laufenden Stadtarbeit setzt den Spieler ans Steuer: Arcade-Fahrphysik
  (Gas/Bremse/Lenken) mit sanfter Führung auf die Fahrbahn — verlässt das
  Fahrzeug die Straße, wird es abgebremst und zur nächsten Straßenkachel
  gezogen. Die Kamera zieht als Verfolger hinter dem Fahrzeug her; ein
  schwebender Zielpfeil zeigt zum nächsten offenen Ziel. Erreicht man ein Ziel,
  schließt es sich automatisch ab (über denselben `progressActivity`-Command wie
  die Klick-Lieferung); ist die Mission fertig oder man drückt Q/Esc, endet die
  Fahrt und die normale Kamera kehrt zurück.
- **Fahr-HUD.** Unten mittig: Missionsname, Restzeit, verbleibende Ziele,
  Steuerungshinweis und „Fahrt beenden".
- **Fünf Missionstypen** (in der geforderten Reihenfolge), jede mit eigenem,
  deutlich unterscheidbarem Fahrzeug: **Lieferwagen** (Essen verteilen),
  **Feuerwehr** (Löschfahrzeug zu Bränden – Wohn/Gewerbe-Ziele, kein
  Materialverbrauch, Zufriedenheits-Bonus), **Holztransport** (Stämme vom
  Sägewerk NUR zu Lagern – Def-Id-Zielauswahl), **Polizei** (Streife zu breiten
  Einsatzorten), **Material** (Pritschenwagen zu Baustellen).

**Warum & Architektur.** CLAUDE.md §2 („erweitern statt neu bauen") ist bindend:
das bestehende Aktivitäts-System liefert bereits Angebote, Ziele, Zeitwertung
(Bronze/Silber/Gold) und Belohnungs-Bänder. Statt ein paralleles
`missions.config.ts` samt zweiter Save-Migration zu bauen, wurde `ActivityDef`
minimal erweitert (`drive`, `vehicle`, `targetCategories`, `targetDefIds`) und
die Zielauswahl im Controller um explizite Kategorien/Def-Ids ergänzt. **Kein
neues persistiertes State-Feld → keine zweite Migration.** Die Simulation bleibt
`three`/`react`-frei; der komplette Fahrmodus (Input, Verfolgerkamera,
Fahrzeug, Zielpfeil) lebt im Renderer und meldet erreichte Ziele über
`RendererCallbacks` zurück — die UI ruft den Command auf, nie der Renderer die
Simulation. Die Verfolgerkamera ist eine neue, reine Methode
`CameraController3D.setChase()` (unit-getestet).

**Auswirkung.** Aktive Stadtarbeit fühlt sich hands-on an; die Straßen (A5) und
der spätere Verkehr (A7) bekommen einen zweiten Zweck. Balancing der fünf
Missionen (Zeit, Belohnung, Level-Gates) ist gesetzt, wird in A10 feinjustiert.

**Zukunft.** A7 belebt Biome/Landwirtschaft; die Fahrzeuge bekommen in A9
eigene Tripo-Prompts/GLB-Slots (Drop-in bereits verdrahtet: `van`→`VAN_MODELS`,
übrige → `VEHICLE_CAR_MODELS`, sonst prozedurales Fallback).

**Verifikation.** `tsc`/`eslint`/`vitest` (175, davon neu: `missions.test.ts` 6
für Zielauswahl/Belohnung/Gating der 5 Fahrmissionen + 2 Chase-Kamera-Tests in
`camera.test.ts`)/`build` grün. Playwright-Fahr-Smoke (Save mit laufender
Mission → „Selbst fahren" → WASD): Fahrzeug + Verfolgerkamera + Zielpfeil + HUD
sichtbar, keine Konsolenfehler.

**Dateien.** Sim: `config/types.ts` + `config/schemas.ts` (Drive-Felder),
`config/activities.config.ts` (5 Fahrmissionen), `commands/controller.ts`
(`activityCandidates` mit Kategorie/Def-Id-Auswahl). Renderer/UI:
`CameraController3D.ts` (`setChase`), `ThreeMapRenderer.ts` (Fahrmodus:
`enterDrive`/`exitDrive`/`updateDrive`/`makeMissionVehicle`/`makeDriveArrow`),
`IMapRenderer.ts` + `state/store.ts` (`driveActive`, MapApi-Fahrmethoden,
Callbacks), `MapView.tsx`, `panels/CityWorkPanel.tsx` (Fahren-Knopf),
`hud/DriveHud.tsx` (neu), `App.tsx`, `styles.css`, `i18n/de.json`.
Tests: `tests/missions.test.ts` (neu), `tests/camera.test.ts`.

## v0.54 — Ausbaustufe 2.0, Phase A5: Straßen-Redesign — heller, Gehwege, Laternen

**Was.** Die Straßen wirkten „zu schwarz" und zu nackt (§11 Auftrag B) — jetzt
lesen sie sich als echte Stadtstraßen:

- **Hellere Fahrbahn.** Der Asphalt ist von 0x474d57 auf ein mittleres Grau
  aufgehellt. Weil die Drop-in-Textur `road_asphalt` die Materialfarbe nur
  MULTIPLIZIERT (also nie aufhellen kann), hebt ein dezenter Emissiv-Term die
  Schwärze — die Fahrbahn bleibt bei Tag UND Nacht gut lesbar, mit leichter,
  erwünschter Eigenhelligkeit. Gebirgsstraßen entsprechend.
- **Gehwege.** Offene Straßenkanten (ohne Anschluss) tragen jetzt einen hellen
  Beton-Bürgersteig mit dünnem Bordstein davor statt einer nackten Erdkante —
  die Straßenzüge bekommen Struktur und wirken bewohnt.
- **Straßenlaternen.** Sparsam und deterministisch (~jede vierte Randkachel)
  steht eine Laterne an der offenen Kante: Mast, Ausleger, emissiver Kopf, der
  nachts leuchtet. Belebt die Straßen ohne die Draw-Calls zu sprengen.
- **Ambient-Verkehr** (bereits vorhanden) fährt weiter auf dem Straßennetz
  (Haus → Ziel), jetzt auf den überarbeiteten Straßen.

**Warum.** §11 Auftrag B nennt die Straßen als konkreten Prototyp-Tell („zu
schwarz, zu gerade"). Helligkeit, Gehwege und Laternen sind die drei Hebel, die
aus grauen Balken lebendige Straßenzüge machen — Grundlage für den Fahrmodus
(A6) und die belebte Welt (A7).

**Verifikation.** `tsc`/`eslint`/`vitest` (167)/`build` grün.
Playwright-Screenshots (Straßennetz-Save, Tag + Nacht): Fahrbahn hell und
lesbar, Gehweg-Ränder, leuchtende Laternen bei Nacht, Verkehr auf den Straßen,
keine Konsolenfehler.

**Dateien.** `ThreeMapRenderer.ts` (`getRoadMats` heller + `sidewalk`/`lampPost`/
`lampHead`, `buildRoadTile` Gehwege + Laternen, Tile-Koordinaten durchgereicht).

## v0.53 — Ausbaustufe 2.0, Phase A4: Regionen mit Charakter — Boni, Vorschau, Bürger-Hinweise

**Was.** Die organischen Landschaften bekommen spürbaren Charakter und werden
zur echten strategischen Entscheidung (absorbiert MVP4 P5):

- **Produktions-Boni & -Mali wirken.** `productionModifiers` einer Region
  fließen jetzt in die Produktion jedes Betriebs auf ihrem Boden — Wälder
  +40–50 % Holz, Fruchtdelta +35 % Nahrung, Gebirge +50 % Stein bei −30 %
  Nahrung. Der Faktor läuft über denselben Bonus-Pfad wie der Standort-Bonus
  (auch NEGATIVE Werte werden gespeichert, sonst produziert der Tick voll,
  während das Derived-Total reduziert ist — der Fix hält beide konsistent, bei
  −100 % gekappt). Die **Startregion „Lichtungsland" ist bewusst neutral** — der
  Bezugspunkt, an dem sich die Vor-/Nachteile der Expansion messen.
- **Teurere Straßen im Gebirge.** `roadCostFactor` verteuert Straßen beim Bau in
  rauen Regionen (Gebirge bis ×2). `getBuildCost` bezieht die Zielkachel ein —
  der Ghost/das Menü zeigt den ortsgenauen Preis, gezahlt wird genau das.
- **Charakter-Vorschau VOR der Freischaltung (§5 Auftrag B).** Der RegionDialog
  zeigt für jede Landschaft — auch gesperrt — Baufläche und alle Vor-/Nachteile
  mit Pfeil-Icons und Prozenten (grün = Vorteil, rot = Nachteil, Straßenkosten
  als Nachteil markiert). Der Spieler weiß, was er kauft, bevor er zahlt.
- **Bürger weisen den Weg (§4 Auftrag B).** Wird mit einem Level-Up eine
  angrenzende Landschaft neu erschließbar, posten Kundschafter einen Hinweis in
  die Bürgermeister-Nachrichten — mit Himmelsrichtung („Im Norden …") und
  Kurzcharakter („reich an Wäldern"). Führung über die Bürger, nicht übers Menü.
- **Regions-Vokabular durchgezogen.** Quest- und Distrikt-Texte sprechen von
  „Landschaften" statt „Sektoren".

**Warum.** §3/§4/§5 Auftrag B verlangen Landschaften mit echten Vorteilen und
Nachteilen, die vor dem Kauf sichtbar sind und über die Bürger nahegelegt
werden — nicht 36 austauschbare Quadrate. Erst dadurch wird Erschließung eine
Abwägung (billiges Bauland vs. teures Gebirge mit viel Stein).

**Verifikation.** `tsc`/`eslint`/`vitest` (167: neue Tests für
Produktions-/Straßen-Faktoren pro Region, neutrale Startregion, ortsabhängige
Straßenkosten, Bürger-Hinweis beim Level-Up)/`build` grün.
Playwright-Screenshot: RegionDialog „Westanger" mit Baufläche 3225,
Nahrungs-/Holzertrag +10 %, Kosten, Freischalten.

**Dateien.** `map/world.ts` (`regionProductionFactorAt`/
`regionRoadCostFactorAt`), `simulation/derived.ts` (Regions-Bonus, negativer
Bonus gespeichert), `commands/controller.ts` (`getBuildCost` ortsabhängig),
`progression/levels.ts` (Bürger-Hinweise), `config/regions.config.ts`
(Startregion neutral), `panels/RegionDialog.tsx` + `styles.css` (Vorschau),
`i18n/de.json`, `tests/regions.test.ts`.

## v0.52 — Ausbaustufe 2.0, Phase A3: Größenklassen, organischer Nebel, Biom-Splat

**Was.** Der Renderer setzt das Gebäudesystem-2.0-Datenmodell und die
organischen Regionen jetzt sichtbar um (Renderer-Basis, absorbiert MVP4 P4):

- **Bauhöhe nach Größenklasse.** `SIZE_CLASS_HEIGHT` (XS 0,3 · S 1 · M 1,4 ·
  L 2,2 · XL 3 · XXL 4) ersetzt die alte Kategorie-Höhe — die Silhouette folgt
  der Bedeutung des Gebäudes, nicht seiner Sparte. Stufen erhöhen zusätzlich,
  auf ×3 gedeckelt (`visual.heightClass` bleibt Override). Straßen (XS) wirken
  endlich flach neben Häusern, Kraftwerk/Klinik ragen.
- **Ensemble-Fallbacks für große Grundstücke.** Prozedurale Gebäude der
  Klassen L/XL/XXL (Spannweite ≥ 4) füllen ihr Grundstück als Ensemble —
  Hofplatte + Hauptbau + Nebenflügel (XXL: dritter Baukörper) — statt als ein
  Riesen-Würfel. Der Windpark (7×7) verteilt mehrere Turbinen übers Areal
  (erste animiert). Kleine Klassen behalten den kompakten Block. Bis neue
  Stufen-GLBs eingelegt sind (A9-Prompts), lesen sich große Bauten so als
  glaubwürdige Anlagen statt als Klötze.
- **Organischer Regions-Nebel.** Jede gesperrte Landschaft trägt ein
  Nebel-Volumen entlang ihrer ECHTEN organischen Grenze: die Randkontur wird
  aus dem Region-Grid extrahiert (gerichtete Randkanten → Loop-Verkettung =
  Marching Squares auf Binärmasken), zweifach Chaikin-geglättet und zu einer
  bodennahen Dunstdecke extrudiert (≤ 7 Einheiten hoch, oben ausdünnend).
  Silhouetten des dominanten Bioms (Gebirgsgipfel, Baumwipfel, Hügel) ragen
  als Teaser aus dem Dunst (§6 Auftrag B: man ahnt, was dort wartet). Ein
  Region-Unlock startet die weiche Aufdeck-Animation (aufsteigender,
  ausdünnender Nebel). Kein Rechteck mehr — der alte Sektor-Nebel ist Geschichte.
- **Biom-gewichteter Splat.** Der Boden-Shader liest ein neues
  Biom-Vertex-Attribut (aus dem gebackenen Terrain-Grid interpoliert):
  Waldboden, Ackerland und Küstensand erscheinen ORTSGENAU dort, wo Wald/
  fruchtbar/Sand liegen — nicht nur höhenweise. Fels/Klippe/Gebirge/Schnee
  kommen weiter aus Höhe & Hang. Acht Splat-Ebenen (grass, forest_floor,
  farmland, sand_coast, rock, cliff, mountain, snow), jede Drop-in — fehlt die
  Textur, blendet die Ebene sauber auf die stilisierte Vertex-Farbe zurück
  (nie kaputt). De-Tiling bleibt.

**Warum.** Beide Aufträge verlangen, dass die Welt kein technischer Prototyp
mehr ist (§15 Auftrag B): glaubwürdige Größenverhältnisse (§3 Auftrag A) und
Landschaften mit Charakter, die man schon vernebelt ahnt (§6 Auftrag B). Das
ist die Renderer-Grundlage, auf der A4 (Boni-Vorschau) und A7 (Biom-Deko)
aufsetzen.

**Verifikation.** `tsc`/`eslint`/`vitest` (164)/`build` grün.
Playwright-Screenshots (vite preview, WebGL): Insel-Overview mit
organischem Nebel entlang der Regionsgrenzen (Gipfel ragen heraus,
Startregion klar), Größenvergleich Straße ≪ Wohnhaus 3×3 < Feuerwache 5×5 <
Windpark 7×7 < Rathaus 5×5, keine Konsolenfehler.

**Dateien.** `ThreeMapRenderer.ts` (`SIZE_CLASS_HEIGHT`/`buildingHeight`,
Ensemble-Fallbacks, Region-Nebel `regionContour`/`chaikin`/`buildRegionFog`/
`animateFog`, Biom-Vertex-Attribut + erweiterter Splat-Shader).

## v0.51 — Ausbaustufe 2.0, Phase A2: Save-v11-Migration mit 100 %-Erstattung

**Was.** Die in v0.50 angekündigte echte Migration v10→v11 ist da — CLAUDE.md
§3 („Saves brechen nie") gilt für Insel-Saves wieder uneingeschränkt. Eine
**einzige gebündelte Migration** (vom Nutzer so entschieden) übernimmt beide
Datenmodell-Umbauten:

- **Rathaus-Umzug:** deterministisch auf den neuen 5×5-Bake-Start (183,189);
  die 5 gebackenen Startstraßen werden gratis ergänzt, wenn die Kacheln frei
  sind.
- **Sektoren → Regionen per Mehrheits-Überlappung:** Eine organische Region
  gilt als freigeschaltet, wenn die Mehrheit ihrer Kacheln in zuvor
  freigeschalteten 64er-Quadrat-Sektoren lag; die Startregion immer, Teaser-
  Regionen (Nebelinsel) nie. Distrikt-Zentren binden ihre Region an ihren
  Distrikt; Distrikte ohne überlebendes Zentrum lösen sich auf.
- **Gebäude-Prüfung mit 100 %-Erstattung zu ALTEN Preisen:** In
  deterministischer Reihenfolge (Rathaus → Zentren → Rest nach Id) wird jedes
  Gebäude gegen die neue Welt geprüft (inkrementelle Belegung, Terrain,
  Regions-Status — Straßenanschluss bewusst nicht, das bleibt ein
  Diagnose-Hinweis). Entfallene Defs (`house_row`, `apartment`) und Gebäude,
  deren gewachsener Footprint kollidiert, werden abgerissen und vollständig
  erstattet. Die alten v10-Preise dafür liegen eingefroren in der neuen
  `src/game/storage/legacyCosts.ts` — der Spieler bekommt zurück, was er
  wirklich bezahlt hat. Überzählige Ausbaustufen (Sägewerk 3, Steinbruch 3,
  Farm 3, Wasserpumpe 2) werden geclampt und die alten Spätstufen erstattet;
  laufende Upgrades auf entfallene Stufen ebenso.
- **Level-Rederivierung** aus den unveränderten XP mit der neuen
  20-Level-Kurve; `stats.sectorsUnlocked` → `stats.regionsUnlocked`;
  Brände/Aktivitäts-Ziele/Quests auf entfernte Gebäude werden bereinigt.
- **Einmaliger Hinweis:** Die Migration meldet eine Zusammenfassung
  (`consumeMigrationNotice()` → Adapter-Feld `migrationNotice`, Muster
  `legacyBackupCreated`); die App zeigt einmalig einen Toast — mit Anzahl und
  Erstattungssumme, falls Gebäude weichen mussten.

**Warum.** Die fixierte Nutzer-Entscheidung: kein Reset, sondern Migration mit
voller Erstattung. Ein v10-Spieler landet ohne Verlust in der neuen Welt —
schlimmstenfalls mit einem prallen Konto und ein paar Bauplätzen zum
Neuverteilen.

**Verifikation.** `tsc`/`eslint`/`vitest` (164 Tests: 5 neue
Migrations-Tests mit v10-Fixtures — Rathaus-Umzug/Regions-Stubs, Erstattung
entfallener Defs, Footprint-Kollision 2×2→3×3, Stufen-Clamp,
Sektor-Mehrheit + Teaser-Sperre)/`build` grün. Browser-Migrations-Smoke
(Playwright, echter v10-Save in localStorage): Toast „Ausbaustufe 2.0 …
erstattet" erscheint, Re-Save trägt v11, 32 Regionen, Sektoren entfernt,
Erstattung exakt (Geld/Holz/Stein), Rathaus samt Startstraßen am neuen
Standort, keine Konsolenfehler.

**Dateien.** `migrations.ts` (Migration 10→11 + `MigrationNotice`),
`legacyCosts.ts` (neu, eingefrorene v10-Preise), `localStorageAdapter.ts`,
`App.tsx`, `de.json` (`ui.migration.v11_*`), `tests/storage.test.ts`,
`docs/SAVE_MIGRATION.md`.

## v0.50 — Ausbaustufe 2.0, Phase A1: Gebäudesystem-2.0-Datenmodell + organische Regionen

**Was.** Erste Phase des kombinierten Programms „Ausbaustufe 2.0"
(Gebäudesystem 2.0 + Welt 2.0, Plan siehe Programm-Briefing; ersetzt die
offenen MVP4-Phasen P4–P8). A1 baut das komplette Sim-Fundament um — Schema
v11 (Migration folgt in A2, bis dahin gilt ein frischer Start):

- **Gebäudesystem 2.0 — neue Footprints & Größenklassen.** Alle 31 Gebäude
  haben ein neues Pflichtfeld `sizeClass` (XS 1×1 · S 2×2 · M 3×3 · L 4×4–5×5 ·
  XL 6×6–7×7 · XXL 8×8) und realistische, **fixe quadratische** Footprints:
  Rathaus 5×5, Feuerwache 5×5 (Vorplatz/Garagen/Hof), Krankenhaus 6×6,
  Kraftwerk 8×8, Windpark 7×7, Farm 6×6, Wohnhaus 3×3, Sägewerk 4×4,
  Steinbruch 5×5 u. v. m. Straßen (1×1) wirken damit endlich schmaler als
  Häuser — die prototypischen Größenverhältnisse sind Geschichte. Der
  Zod-Cap für Footprints stieg von 4 auf 12.
- **Weniger, markantere Ausbaustufen.** Stufenregeln pro Kategorie (Deko 1 ·
  Geschäfte 2 · Versorgung 2–3 · Industrie 3 · Verwaltung 3–4 · Wohnen eigene
  Ketten · Landmarken 1), per Test erzwungen. **Hybrid-Wohnkette:**
  `house_small` mit 6 Stufen (Kleines Haus → … → Wohnblock, Gates L3/6/9/12/15),
  `residential_tower` als eigenes Spätgebäude ab L15 (Wohnturm → Hochhaus →
  Wolkenkratzer L20); **`house_row` und `apartment` entfallen** (A2 erstattet).
  Level 15 ist das bewusste „Metropol-Band" (Wohnblock + Wohnturm zusammen).
- **20 Level statt 14.** XP-Kurve fortgeschrieben (~×1,3/Level, L20 = 100.000);
  L15–L20 gaten die Top-Stufen (Büroturm L18, Universitätsklinikum L19,
  Wolkenkratzer L20, Monumentalrathaus/Großkraftwerk/Einsatzzentrum L16 …).
- **Welt 2.0 — organische Regionen ersetzen die 36 Quadrat-Sektoren.** Der
  Bake (`tools/bakeWorld.mjs`) segmentiert die Insel deterministisch in **32
  organische Landschaften**: Seeds auf Biom-Clustern, kostenbasiertes
  Dijkstra-Wachstum (Biomgrenzen +4, Flussquerung +6, Höhendelta ×4),
  Mini-Regionen werden gemerged. Output: `islandRegions.gen.ts`
  (Region-Id-Grid + Statistik/Adjazenzgraph), Vorschau-PNG mit
  Regionsgrenzen, Report-Tabelle. Ozean = Region 0, nie freischaltbar;
  Region 32 „Nebelinsel" ist ein bewusst unerreichbarer Teaser.
- **`regions.config.ts` ersetzt `sectors.config.ts`:** 32 deutsche
  Landschaftsnamen (Lichtungsland, Fruchtdelta, Hochgebirgskern, …), pro
  Region Charakter mit Vor- UND Nachteilen (`productionModifiers`,
  `roadCostFactor` bis 2× im Hochgebirge — wirksam ab A4), explizite
  Freischaltkosten (320k–1,8 M), Level-Gates bis L18, Voraussetzungs-Regionen
  (⊆ gebackene Adjazenz, per Config-Check erzwungen). Freischaltung nur
  angrenzend an bereits freigeschaltetes Gebiet.
- **Startlage neu:** Startregion „Lichtungsland" (Region 2, 5.993 bebaubare
  Kacheln), Rathaus 5×5 auf validiertem 7×7-Grasblock (183,189), 5
  Startstraßen an der Südkante.
- **2D-Pixi-Renderer entfernt** (aus A10 vorgezogen, statt toten Code auf
  Regionen zu portieren): `MapRenderer.ts`/`projection.ts` gelöscht, Moduswahl
  raus — das Spiel ist 3D-only. Gesperrte Regionen erscheinen interim als
  organisch gedimmter Boden (kein Rechteck-Nebel mehr); der hochwertige
  Silhouetten-Nebel kommt in A3.

**Warum.** Beide Nutzer-Aufträge verlangen dasselbe Fundament: Footprints und
Stufenketten sind die Basis für Doku/Prompts/Assets (Auftrag A §13), das
Region-Grid die Basis für Nebel, Boni-Vorschau und Bürger-Hinweise (Auftrag B).
Ein gemeinsamer Datenmodell-Schnitt (ein Schema-Sprung v11) vermeidet zwei
Migrationen hintereinander.

**Auswirkung.** Neustart nötig bis A2 die v10→v11-Migration liefert (mit
100 % Erstattung entfallener Gebäude). Saves bleiben schlank (Region-Stubs,
nie Terrain). Bestehende GLBs werden auf die größeren Footprints skaliert —
bis neue Stufen-Modelle eingelegt sind, wirken einige grob (A9 liefert die
Prompts je Stufe).

**Verifikation.** `tsc`/`eslint`/`vitest` (159 Tests, 24 Dateien)/`build`
grün; Playwright-Screenshot-Smoke (vite preview, WebGL): organische
Startregion sichtbar, gesperrte Regionen gedimmt, keine Konsolenfehler.

**Dateien.** `tools/bakeWorld.mjs` (Segmentierung), `islandRegions.gen.ts`
(neu), `islandTerrain.gen.ts` (Re-Bake), `regions.config.ts` (neu,
`sectors.config.ts` gelöscht), `buildings.config.ts` (Neutabelle),
`levels.config.ts` (20 Level), `quests.config.ts`, `types.ts`/`schemas.ts`,
`newGame.ts` (v11), `map/world.ts`, `controller.ts` (`unlockRegion`),
`placement.ts`, `startRegion.config.ts`, `de.json` (Regions-/Stufen-Keys),
`RegionDialog.tsx` (neu, `SectorDialog.tsx` gelöscht), `MapView.tsx`,
`IMapRenderer.ts`, `ThreeMapRenderer.ts`, `CameraConfig.ts`,
`MapRenderer.ts`/`projection.ts` (gelöscht), Tests umfassend
(`regions.test.ts` neu, `sectors.test.ts` gelöscht).

## v0.49 — Die Insel wird sichtbar: Renderer-Terrain (MVP4 P3)

**Was.** Phase 3 des Welt-Neuaufbaus (`docs/WORLD_REBUILD.md`): Der Renderer
zeichnet jetzt die GEBACKENE Insel statt der prozeduralen Typ-Höhen.
- **Höhen aus dem Bake:** `terrainHeightAt` sampelt `worldHeight.gen.ts`
  (769×769 Uint16, smoothstep-bilinear, C1-stetig) — Inselform, Gebirge (~20
  Einheiten), Seebecken, Flussrinnen und Ozean-Tiefenrampe sind exakt die
  Referenz-Geografie. Die alte BASE-/Noise-Logik ist ersetzt; `SPLAT_BANDS`
  exportiert die Shader-Höhenbänder aus derselben Quelle (Duplikation tot).
- **Chunk-Boden:** Das 384²-Mesh ist in 8×8 Chunks à 48 Kacheln (~9,4k Verts)
  zerlegt — Frustum-Culling pro Chunk, ein Sektor-Unlock baut nur die ~4
  betroffenen Chunks neu statt 600k Vertices. Farb-/Dimm-Logik unverändert.
- **Ein Ozean:** Eine 4096²-Wellen-Ebene auf `WATER_LEVEL` umgibt die Insel bis
  zum Horizont und füllt zugleich Seen/Flüsse (Becken liegen unter der
  Wasserlinie). Das Kachel-Wasser-Instancing ist komplett entfernt.
- **Kamera & Licht auf Inselmaß:** `maxDist` 200→480, Overview-Preset 420
  (ganze Insel), Distanz-Fog 180–520 → 520–1600 (Überblick bleibt klar, Horizont
  verläuft atmosphärisch), Sonnen-/Schatten-Frustum folgt dem Kamera-Fokus
  (vorher fix am Ursprung — die Stadt läge außerhalb des ±140-Fensters).
- **Bake-Härtung:** Bebaubar-Glättung deutlich strenger (max. ΔH ≈ 0,14/Kachel,
  Kappungs-Sweeps bis Konvergenz) — Gebäude sitzen sauber, ohne lokale Einebnung.

**Verifikation.** tsc/eslint/vitest (155)/build grün; Screenshots: Insel-Overview
(Form = Referenz, klar statt milchig), Startsektor-Nahsicht (Rathaus, Wald, de-
tiled Gras), keine Konsolenfehler. **Dateien.** `terrainHeight.ts` (neu),
`ThreeMapRenderer.ts` (Chunks/Ozean/Bänder), `SkyEnvironment.ts` (Schatten-Follow,
Fog), `CameraConfig.ts`, `tools/bakeWorld.mjs`, Gen-Dateien, `tests/terrainHeight.test.ts`.

## v0.48 — Die Insel: Welt-Neuaufbau P1+P2 (MVP4, Schema v10)

**Was.** Beginn des verbindlichen Welt-Neuaufbaus (Auftrag „Kompletter
Map-Neuaufbau"): Die handdesignte 128×80-Testkarte ist vollständig ersetzt durch
eine **384×384-Insel**, deren Form 1:1 aus der Referenz-GLB
`reference/stylized island map 3d model.glb` gebacken wird. Phasen 1+2 von 8
(`docs/WORLD_REBUILD.md`):
- **P1 — Bake-Pipeline:** `tools/bakeWorld.mjs` rastert alle 1,87 M Dreiecke der
  GLB top-down (baryzentrisch, Max-Y), klassifiziert Wasser per Flood-Fill
  (Ozean/See/Fluss-Rinnen), leitet Biome regelbasiert ab (Höhe/Hang/Wassernähe/
  Noise), glättet bebaubares Land (die Sim kennt keine Hangprüfung) und wählt/
  validiert den Start (Sektor (2,3), 3.933 bebaubare Kacheln, Rathaus (157,221)
  auf einem 5×6-Gras-Block). Committete Outputs: `islandTerrain.gen.ts` (Sim,
  ~200 KB), `worldHeight.gen.ts` (Renderer, ~1,6 MB), `tools/bake-report.md`,
  `tools/bake-preview.png`. Die GLB (45 MB) shippt NIE im Bundle.
- **P2 — Sim-Welt-Tausch:** `SECTOR_SIZE` 16→64 → **6×6 = 36 strategische
  Groß-Sektoren** à 4.096 Kacheln, jeder mit datengetriebener Identität in der
  neuen `sectors.config.ts` (Zod-validiert): deutscher Name, Biom (zentrum/ebene/
  wald/gebirge/huegel/see/kueste/fruchtbar/ozean), explizite Freischaltkosten
  (250k–1,8 M statt Formel), Level-Gates, Voraussetzungs-Sektoren (Gebirgskern
  braucht beide Randsektoren), Produktions-Modifikatoren (ab P5 wirksam),
  nie freischaltbare Ozean-Sektoren. `terrainAt()` liest das Gen-Grid.

**Savegames (Schema v10, § docs/SAVE_MIGRATION.md).** Zwei Änderungen:
1. **Slim-Save:** Sektoren persistieren nur noch `{id,sx,sy,districtId,status}` —
   Terrain wird NIE mehr gespeichert (deterministisch ableitbar), Belegung kommt
   aus einem Laufzeit-Index über die Gebäude (`rebuildOccupancyIndex`,
   `occupyTiles`/`clearTiles`). Saves: ~500 KB → wenige KB.
2. **Vor-Insel-Saves (≤ v9):** NICHT migrierbar (andere Geografie — Gebäude lägen
   im Ozean). Sie werden einmalig unter `cmb.save.backup.v9` gesichert, der Slot
   geräumt, das Spiel startet frisch mit freundlicher Meldung. **Bewusst
   sanktionierte, einmalige Ausnahme von CLAUDE.md §3** (Nutzer-Entscheidung
   „Harter Neustart + Backup", Auftrag §22). Ab v10 gilt der Vertrag wieder.

**Architektur.** Sim bleibt UI-/Rendering-frei (CLAUDE.md §1): die Gen-Dateien
sind pure base64-Daten, synchron dekodiert, node-/vitest-tauglich. API-Formen
(`terrainAt`, `startRegionConfig`, `tileAt`) blieben stabil — Kamera und Renderer
liefen ohne Anpassung weiter; nur die `.tiles`-Lesestellen der Renderer wurden
auf das Grid umgestellt. `unlockSector` konsultiert jetzt die SectorDefinition.
Kachel-Sichten (`tileAt`) sind ABGELEITET — Belegungs-Mutationen laufen
ausschließlich über die Occupancy-Helfer.

**Auswirkung.** Neue Spiele starten auf der Insel (Startsektor „Inselmitte");
14× mehr Welt, 36 Sektor-Entscheidungen mit Biom-Identität; NewGame ohne
147k-Kachel-Materialisierung; Screenshot-Smoke bestätigt: Insel-Geografie
(Südsee, Wälder, Gebirgs-Outcrops, Buchten) im Spiel sichtbar, Quests/HUD/
Platzierung funktionieren, keine Konsolenfehler.

**Zukunft (P3–P8).** Renderer-Terrain aus dem Höhen-Bake (Chunks, echter Ozean,
Kamera 480, Schatten-Follow), Splat-Ausbau mit allen 31 Texturen, Sektor-Boni in
der Wirtschaft, Wald-Cluster/Landmarken/Placeholder-Inseln, Balancing, Bereinigung
(2D-Renderer-Ausbau, Legacy-Dateien) + Performance-Pass.

**Verifikation.** `npx tsc -b --force` · `npx eslint src tests` · `npx vitest
run` (**155 Tests, 24 Dateien**) · `npm run build` · Playwright-Screenshot-Smoke.
Tests umfassend angepasst: Koordinaten mechanisch +134/+198 (altes Rathaus-
Relativ-Muster blieb erhalten), `flattenTerrain` jetzt Override-basiert,
neue `world.gen.test.ts` (Bake-Integrität, Startgarantien, Config-Sync),
Storage-Tests auf v10/Legacy-Backup umgestellt.

**Dateien.** Neu: `tools/bakeWorld.mjs`, `tools/bake-report.md`,
`tools/bake-preview.png`, `reference/` (beide GLBs + README),
`src/game/config/world/islandTerrain.gen.ts`, `src/renderer/three/worldHeight.gen.ts`,
`src/game/config/sectors.config.ts`, `tests/world.gen.test.ts`,
`docs/WORLD_REBUILD.md`, `docs/WORLD_SCALE.md`, `docs/SAVE_MIGRATION.md`.
Geändert: `startRegion.config.ts` (Gen-Grid), `map/world.ts` (Slim/Occupancy),
`types.ts`, `schemas.ts`, `config/index.ts`+`config/types.ts` (SectorDef),
`newGame.ts` (v10), `storage/migrations.ts` (Legacy-Fehler),
`storage/localStorageAdapter.ts` (Backup), `commands/controller.ts`,
`ThreeMapRenderer.ts`+`MapRenderer.ts` (Grid-Reads), `App.tsx`, `i18n/de.json`
(36 Sektornamen, Biome, Legacy-Meldung), `eslint.config.js` (\*.gen.ts ignoriert),
Tests breit.

## v0.47 — Atmosphäre & Licht (MVP3 Phase 2)

**Was.** Zweite Phase der MVP3-Weltneugestaltung (Reihenfolge vom Nutzer gewählt:
Atmosphäre & Licht → Kanten/Gitter → Vegetation → Wasser). Ziel: die Szene vom
harten „Test-Render"-Look zum warmen, hochwertigen Manor-Lords-/Foundation-Gefühl
bringen — ohne Gameplay/Straßen/Wirtschaft/Savegames anzufassen.
- **Filmisches Tone Mapping:** Der Renderer nutzt jetzt `ACESFilmicToneMapping`
  (Exposure `1.2`) statt der harten linearen Ausgabe. Helle Himmel-/Sonnen-Spitzen
  rollen weich aus, statt flach auf Weiß zu clippen — Mitten und Farben wirken
  organischer und weniger „digital".
- **Weiche Schatten:** `shadowMap.type = PCFSoftShadowMap` plus am Sonnenlicht
  `shadow.radius = 3.5` — die harten, gezackten Schattenkanten (die das neue
  terrassierte Gelände sonst betont hätte) werden zu sanften Kontaktschatten.
- **Kein Schatten-Flimmern auf Terrassen:** `shadow.normalBias = 0.6` und
  `shadow.bias = -0.0004` unterdrücken die Selbst-Schatten-Artefakte (Shadow Acne)
  an den neuen steilen Gebirgs-Absätzen, ohne sichtbares „Peter-Panning".
- **Sanftes Füll-/Bounce-Licht:** Die Tag-Keyframes der Grade-Kurve
  (`environment.ts`) heben `ambient` leicht an und wärmen `hemiGround` — weil ACES
  Schatten tiefer zieht, hält dieses weiche Fülllicht Gelände- und Gebirgsflächen
  im Schatten lesbar und warm. Nacht-Keys bleiben unangetastet (Tag/Nacht-Kontrast
  und Sterne unverändert).

**Warum.** Beleuchtung/Tonwert ist der visuell höchste Hebel pro Aufwand: Er
verändert die *ganze* Welt sofort, ohne neue Assets, und legt die Basis, auf der
die nächsten Phasen (entschärfte Kanten, Vegetation, Wasser) erst richtig wirken.

**Architektur.** Rein präsentationsseitig (CLAUDE.md §1): nur Renderer- und
Grade-Werte, keine Sim-Berührung, **keine `SCHEMA_VERSION`-Änderung**, keine
Migration. Die Grade-Kurve ist weiterhin die pure, in Node testbare Mathematik aus
`environment.ts`; die vorhandenen `environment.test.ts`-Invarianten (Mittag heller
als Mitternacht, Ambient nachts > 0.05, Sterne nur nachts, sauberer Mitternachts-
Wrap) bleiben erfüllt. **Ein** Draw-Call/Direkt-Render bleibt erhalten — kein
Post-Processing-Pipeline-Overhead.

**Bloom bewusst verworfen.** Ein subtiler UnrealBloom (EffectComposer → RenderPass
→ UnrealBloomPass → OutputPass, multisampled HalfFloat-Target für erhaltenes MSAA)
wurde implementiert und im Screenshot-Smoke getestet, aber wieder entfernt: Die
Szene ist SDR-authored — nach Summe aus Sonne + Hemisphäre + Ambient liegt schon
das Gras bei Luminanz ~1.0, es gibt keine saubere HDR-Highlight-Trennung. Jede
Schwelle, die die Sonne zum Glühen bringt, wäscht auch die Wiese aus; jede
Schwelle, die die Wiese verschont, lässt nichts glühen. Ein sinnvoller Bloom
braucht zuerst echte HDR-Emissives (Nacht-Fenster, Sonne, Marker heller als 1.0) —
das ist ein eigener Folge-Schritt, kein Beiwerk dieser Licht-Phase.

**Auswirkung.** Deutlich weichere, wärmere Tageslicht-Szene; sanfte Schatten auf
Terrain/Gebäuden; keine Konsolen-/Render-Fehler; Performance unverändert (kein
zusätzlicher Pass). Golden-Hour liest jetzt als stimmungsvolle Dämmerung
(tieferes Bodenlicht bei tiefstehender Sonne) — bewusst akzeptiert, da Default-Zeit
Vormittag/Tag ist.

**Zukunft.** Nächste MVP3-Phasen: Kachel-Gitterlinien entschärfen/organische
Terrain-Ränder, Vegetation/Wald-Patches, Wasser-/Küsten-Shader. Danach optional:
HDR-Emissives + Bloom, Fog-of-War-Atmosphäre pro Sektor.

**Verifikation.** `npx tsc -b --force`, `npx eslint src tests`, `npx vitest run`
(152 Tests), `npm run build`; 3D-Screenshot-Smoke (Playwright, `vite preview`,
Basis `/`) bei Mittag, Golden-Hour, Nacht und Default-Vormittag.

**Dateien.** Geändert: `src/renderer/three/ThreeMapRenderer.ts`,
`src/renderer/three/SkyEnvironment.ts`, `src/renderer/three/environment.ts`,
`docs/3D_WORLD_ASSETS.md`, `docs/PATCHNOTES.md`.

## v0.46 — Organisches Terrain-Mesh (MVP3 Phase 1)

**Was.** Der Nutzer hat ein großes Vision-Dokument/Mockup für eine
Weltneugestaltung ("MVP3", Referenzen: Manor Lords, Foundation, Fabledom,
Kingdoms Reborn) geteilt und als erste, fundamentale Phase das **organische
Terrain-Mesh** gewählt. Statt eines Neubaus (die Welt hat seit v0.39 bereits
ein echtes Höhenfeld) wird das bestehende System ausgebaut — genau der
nächste Schritt, den `docs/3D_WORLD_ASSETS.md` §8 schon als "nächste
Code-Phase" angekündigt hatte:
- **Terrassierte Gebirge:** ein neuer `terrace()`-Helper snapt das
  Ridged-Fractal-Rauschen in 5 flache Absätze mit steilen Rissern
  (`tileTarget`s Mountain-Zweig, 65% terrassiert/35% Rest-Rauschen für
  Fels-Detail) — liest jetzt wie echte Gesteinsschichten/Plateaus statt
  gleichmäßig glatter Hügel. Bleibt garantiert im bisherigen Höhenbereich
  `[2.6, 6.0]`, keine Neukalibrierung der Splat-Textur-Bänder nötig.
- **Tiefere, geformte Flusstäler:** `riverBankDip` scannt jetzt Radius 2 statt
  nur die 4 direkten Nachbarn und carved ein V-Profil (`-0.22` an der Sohle,
  smoother Falloff zum Rand) statt eines flachen Einzel-Dips von `-0.06`.
- **Küsten-Dünen:** Sandkacheln direkt neben Wasser/Fluss bekommen ein feines,
  niedrigamplitudiges Rauschen (`+0.04`) statt einer toten Ebene — bewusst
  klein genug, um bebaubar zu bleiben.
- **Sichtbar glattere Kurven:** `ThreeMapRenderer.buildGroundMesh` unterteilt
  jede Kachel jetzt `GROUND_SUBDIV`-fach (Default 2×2) statt einem Vertex pro
  Kachelecke — Positionen kommen weiter direkt aus `terrainHeightAt` (bereits
  kontinuierlich), Vertexfarben werden bilinear aus dem unveränderten
  Eckpunkt-Farbraster interpoliert, keine zusätzlichen Terrain-Lookups.
  Weiterhin **ein** Draw-Call.

**Warum.** Phase 1 von mehreren geplanten MVP3-Phasen — Fundament, auf dem
Gebirgs-Module, Wald-Patches/Vegetation, Küsten-Deko usw. später aufbauen.
Ohne dramatischeres Relief hätten erweiterte Texturen/Vegetation weiterhin
"aufgesetzt" statt gewachsen gewirkt.

**Architektur.** Weiterhin eine **reine, deterministische Renderer-Funktion**
(`terrainHeightAt` liest nur `terrainAt` aus der Sim + Rauschen, mutiert
nichts, wird nie persistiert) — keine `SCHEMA_VERSION`-Änderung, keine
Migration. `tileTarget` bekommt zusätzlich einen modul-internen Memo-Cache,
weil die Mesh-Subdivision dieselben Kachel-Eckwerte jetzt mehrfach abfragt.
Bebaubares Land (grass/fertile/sand) bleibt bei den bisherigen, bewusst
niedrigen Amplituden — Gebäude/Autos positionieren sich weiterhin an einem
Höhen-Punkt ohne lokale Einebnung, dramatischeres Relief dort hätte das
sichtbar verschlechtert.

**Auswirkung.** Gebirge, Flusstäler und Küsten wirken deutlich plastischer;
Straßen (`fitRoadToTerrain`, Tilt-Kappung bei `MAX_TILT≈20°`) und Gebäude
sitzen weiter korrekt auf. Maximale Kartengröße wächst von ~10.400 auf
~41.400 Vertices (4×, ein Draw-Call, einmaliger Kostenpunkt nur bei
Sektor-Aufdeckung, nicht pro Frame).

**Zukunft.** Bewusst nicht Teil dieser Phase (spätere MVP3-Schritte): lokale
Terrain-Einebnung unter Gebäude-Footprints, Gebirgs-Modul-Assets
(`mountain_base/peak/ridge/cliff/…`), Wald-Patches/Vegetations-Cluster,
Küsten-/Hafen-Dekoration, Verkehrs-Graph, Atmosphäre-Erweiterungen.

**Verifikation.** `npx tsc -b --force`, `npx eslint src tests`, `npx vitest
run`, `npm run build`; 3D-Screenshot-Smoke (Playwright) für Gebirge,
Flusslauf, Küste und eine Bergstraße.

**Dateien.** Geändert: `src/renderer/three/terrainHeight.ts`,
`src/renderer/three/ThreeMapRenderer.ts`, `docs/3D_WORLD_ASSETS.md`,
`docs/PATCHNOTES.md`.

## v0.45 — Straßen-Texturen: Ordner-lokale PROMPTS.md + Doku-Fix

**Was.** `src/assets/textures/roads/PROMPTS.md` (neu, generiert): Schritt-für-
Schritt-Anweisung je der 6 Straßen-/Brücken-Texturen (Prompt, Format/Auflösung,
exakter Speicherpfad, was danach passiert) — direkt im Zielordner statt nur in
`docs/`, damit man beim Ablegen der generierten Bilder nicht zwischen `docs/`
und dem Textur-Ordner wechseln muss. Außerdem zwei stale Referenzen auf das in
v0.44 entfernte `roadSegment(mask)` in `roadTextureManifest.ts`/
`docs/ROAD_TEXTURES.md` korrigiert (Form kommt jetzt korrekt beschrieben direkt
aus den Nachbar-Mask-Bits in `buildRoadTile`, Kreisverkehr aus `mask === 15`).

**Architektur.** `renderRoadPromptsFile()` (neue Funktion in
`roadTextureManifest.ts`) nutzt dieselben `ROAD_TEXTURES`-Daten wie
`renderRoadTexturesDoc()` — keine Zweitquelle. `tests/roadTextures.test.ts`
prüft jetzt beide generierten Dateien gegen Drift (Liste statt Einzeltest, wie
bei `modelReadmes.test.ts`).

**Verifikation.** `npx tsc -b --force`, `npx eslint src tests`, `npx vitest run`
(152 Tests, 1 neu), `npm run build` — alle grün.

**Dateien.** Neu: `src/assets/textures/roads/PROMPTS.md` (generiert). Geändert:
`src/assets/roadTextureManifest.ts`, `tests/roadTextures.test.ts`,
`docs/ROAD_TEXTURES.md` (generiert), `docs/PATCHNOTES.md`.

## v0.44 — „Straßen als Textur statt 3D-Modell" + Wald-Kachel-Aufräumung

**Was.**
- **Waldkacheln aufgeräumt:** `forest.glb`/`forest_ground_tile.glb` entfernt —
  das waren die hässlichen, sich wiederholenden hellen Klumpen im Screenshot
  (dieselbe Modell-Instanz auf jeder Waldkachel). Waldflächen fallen jetzt auf
  das gesplattete Höhenfeld (v0.43) zurück, bis neue Baummodelle entstehen.
- **Straßen/Brücken laden nie wieder ein `.glb`.** Der komplette Drop-in-Pfad
  (`roadModel`/`bridgeModel`/`BRIDGE_MODELS`, `roadSegment()`-Rotationslogik)
  ist entfernt. Stattdessen ist die bestehende Mask-getriebene Geometrie
  (Kern + Arme + Randstreifen aus `buildRoadTile`) jetzt **texturiert statt
  einfarbig** und sitzt flach nahe `y≈0` im Gelände statt als erhöhte Platte.
- **Neu, ohne neue Sim-Konzepte, rein aus vorhandenen Renderer-Daten
  abgeleitet:**
  - **Kreisverkehr:** eine 4-Wege-Kreuzung bekommt automatisch eine runde statt
    eckige Kern-Geometrie.
  - **Gestrichelte Mittellinie:** texturiert statt Flächenfarbe, für die
    Straßenklassen mit `centerline: true`.
  - **Bergstraße/Pass:** liegt die Kachel auf Gebirgsterrain, wird eine
    rauere Textur statt Asphalt verwendet — ein Pass ist einfach eine
    Bergstraße am Sattelpunkt, kein eigener Typ.
  - **Steg vs. Brücke:** die gemessene, zusammenhängende Wasser-Spannweite
    entscheidet zwischen einem schmalen, pfeilerlosen Holzsteg (1 Kachel) und
    einer breiteren Brücke mit Geländer/Pfeilern (mehrere Kacheln).
  - **Randübergang** zu Gras/Erde nutzt die bereits dokumentierte
    `terrain_road_edge.png` wieder — keine Dopplung.
- **`src/assets/roadTextureManifest.ts`** (neu, mirror von
  `terrainTextureManifest.ts`): 6 neue Straßen-/Brücken-Texturen
  (`road_asphalt`, `road_mountain`, `road_marking_dash`, `road_roundabout`,
  `road_bridge_deck`, `road_boardwalk`), generiert `docs/ROAD_TEXTURES.md`,
  drift-geprüft von `tests/roadTextures.test.ts`. Drop-in-Ordner:
  `src/assets/textures/roads/{surface,markings,crossings}/`.
- **Aufgeräumt:** `src/assets/models/roads/`/`.../bridges/` sind jetzt nur noch
  eine historische Doku-Hülle (README/PROMPTS neu generiert mit Hinweis auf
  `docs/ROAD_TEXTURES.md`), `docs/3D_MODEL_MANIFEST.md`/`docs/3D_WORLD_ASSETS.md`
  entsprechend gekürzt und verlinkt. Tote Renderer-Funktionen entfernt
  (`roadSegment`, `roadSegmentNames`, `rotMask`, `rotSteps`).

**Warum.** Der Nutzer wollte nach den Wald-Kachel-Problemen wieder klare
Struktur in den Asset-Ordnern und ein klares Vorhaben, bevor weitergebaut wird
— das Nebeneinander aus "3D-Straßenmodelle (nie befüllt)" und dem neuen
Textursystem sollte aufgeräumt statt nur ergänzt werden. Die Recherche zeigte:
es gibt heute nur EINE Straßen-Building-Def (`id:'road'`) und keine Sim-Konzepte
für Brücke/Kreisverkehr/Steg/Bergpass — alles reine Renderer-Optik. Kreuzung,
Linie, Kreisverkehr, Bergstraße, Pass, Steg und Brücke lassen sich deshalb
komplett aus vorhandenen Renderer-Daten (Nachbarmaske, Terrain-Typ,
Wasser-Spannweite) ableiten, ohne `SCHEMA_VERSION`-Bump oder neue
`buildings.config.ts`-Kategorie — CLAUDE.md §2 "Erweitern statt neu bauen".

**Architektur.** Texturen laden lazy über den in v0.43 gebauten
`TextureLoader`/`textureCache` (jetzt als `loadTextureByUrl` verallgemeinert,
mit `loadSplatTexture`/`loadRoadTexture` als dünnen Wrappern). Jedes
Straßen-Oberflächen-Material ist EINE geteilte `MeshStandardMaterial`-Instanz
pro Rolle (`getRoadMats()`) statt pro Kachel — ein Drop-in leuchtet für alle
Straßen gleichzeitig auf (`material.map` + `needsUpdate`), ohne Custom-Shader
(anders als der Ground-Splat: Straßen sind flach lackiert, keine
Höhen-/Neigungs-Gewichtsmischung nötig). Ohne jede Textur bleibt exakt die
bisherige Flächenfarbe — kein Regressionsrisiko.

**Auswirkung/Zukunft.** Echte Stützmauern/Böschungen/Serpentinen/Tunnel bei
sehr großen Höhensprüngen bleiben bewusst zurückgestellt (bräuchten echte
zusätzliche Geometrie, keine reine Textur) — die Neigungs-Kappung verhindert
inzwischen zumindest, dass eine Straße sichtbar kippt oder schwebt. Sobald der
Nutzer echte Straßen-Texturen ablegt, greifen sie automatisch — kein weiterer
Code nötig.

**Verifikation.** `npx tsc -b --force`, `npx eslint src tests`, `npx vitest run`
(151 Tests, davon 3 neu in `tests/roadTextures.test.ts`), `npm run build` —
alle grün. 3D-Screenshot-Smoke via Playwright (`vite preview`): keine
Konsolen-/Shader-Fehler, Straßen-Netz (gerade/Kurve/Kreuzung) und eine Brücke
über Wasser weiterhin korrekt im Gelände, Regressionscheck nach dem Umbau von
`buildRoadTile`/`buildBridgeDeck`.

**Dateien.** Neu: `src/assets/roadTextureManifest.ts`,
`tests/roadTextures.test.ts`, `docs/ROAD_TEXTURES.md` (generiert),
`src/assets/textures/roads/*/.gitkeep`. Geändert:
`src/renderer/three/ThreeMapRenderer.ts` (Straßen-/Brücken-Umbau,
Texturloader-Refactor), `src/assets/registry.ts` (`roadTextureUrl`,
`roadModel`/`bridgeModel`/`hasAnyRoadModel` entfernt),
`src/assets/modelManifest.ts` (`BRIDGE_MODELS` entfernt, roads/bridges-Einträge
deprecated), `docs/3D_MODEL_MANIFEST.md`, `docs/3D_WORLD_ASSETS.md`,
`docs/PATCHNOTES.md`. Gelöscht:
`src/assets/models/terrain/forest.glb`,
`src/assets/models/terrain/forest_ground_tile.glb`.

## v0.43 — „Terrain System V2, Phase 2: Splatmap-Ground-Shader + Drop-in-Ordner"

**Was.** Der in v0.42 dokumentierte, aber bewusst zurückgestellte Splatmap-Shader
ist jetzt implementiert — der Nutzer hatte bereits reale Texturen (Gras, Erde,
Stein, Sand) mit ChatGPT erzeugt und in `src/assets/textures/terrain/…` abgelegt,
aber der Ordner existierte physisch noch gar nicht auf der Platte (nur von
`registry.ts`/der Doku referenziert) und es gab noch keinen Renderer-Code, der die
Dateien tatsächlich konsumiert — der Boden blieb daher weiterhin das flache,
vertex-gefärbte Höhenfeld.
- **Drop-in-Ordner angelegt:** `src/assets/textures/terrain/
  {grass,earth,stone,sand,snow,water,field,path}/` mit `.gitkeep`, exakt wie bei
  den 3D-Modell-Ordnern.
- **`ThreeMapRenderer.buildGroundMesh()`** blendet jetzt bis zu vier
  Repräsentativ-Texturen (`terrain_grass_01`, `terrain_earth_light`,
  `terrain_rock`, `terrain_sand`) direkt auf das bestehende vertex-gefärbte
  Höhenfeld — nicht als Ersatz, sondern als `onBeforeCompile`-Erweiterung
  desselben `MeshStandardMaterial`s (gleiches Muster wie der Wasser-/
  Sektor-Nebel-Shader). Die Mischgewichte pro Vertex kommen aus Höhe und
  Hangneigung (Splatmap-Konzept aus `docs/TERRAIN_TEXTURES.md`), kalibriert auf
  die tatsächlichen Zahlen aus `terrainHeight.ts` (Bauland ~0–0.25, Gebirge erst
  ab 2.6 — die Meterangaben in der Doku waren aspirational und nicht 1:1
  übertragbar).
- **Nie kaputt:** Fehlt eine Kategorie-Textur, fällt ihr Gewicht auf 0 und die
  Deckung (`coverage`) sinkt dort automatisch Richtung reine Vertexfarbe zurück
  — kein falsches Material, kein Schwarz/Fehlbild. Ohne jede abgelegte Textur
  bleibt der Boden exakt wie zuvor (v0.39).

**Warum.** Reine Dokumentation half nicht mehr weiter, sobald echte Texturdateien
vorlagen — das eigentliche "sieht man was?"-Ziel des Nutzers brauchte den
Verbraucher-Code, nicht nur die Spezifikation.

**Architektur.** Texturen werden lazy über einen modulweiten `TextureLoader` +
Cache geladen (`loadSplatTexture`, mirror von `loadModel`/`modelCache`). Das
Laden ist async; solange es läuft, zeigt der Boden die normale Vertexfarbe, dann
wird das Material per `needsUpdate` + neuem `customProgramCacheKey` live
nachkompiliert (kein Rebuild der Geometrie nötig). Ein `terrainKey`-Staleness-
Check verhindert, dass eine inzwischen ersetzte Terrain-Geometrie noch nachträglich
texturiert wird.

**Auswirkung/Zukunft.** Stein/Sand blenden bereits automatisch mit ein, weil der
Nutzer sie schon abgelegt hat; Schnee/Wasser/Feld/Weg folgen genauso automatisch,
sobald Dateien für diese Kategorien existieren — dafür ist keine weitere
Code-Änderung nötig. Bei der aktuellen Standard-Kamerahöhe liest sich die
Textur eher als satter, photografischer Farbton (die Einzel-Grashalme sind bei
dieser Zoomstufe sub-Pixel) statt als scharfe Nahaufnahme — das ist erwartetes
Mipmapping-Verhalten, keine fehlerhafte Anwendung (per Pixel-Stichprobe
verifiziert: gerendertes Grün ist spürbar wärmer/gelbstichiger als die alte
flache Kachelfarbe). Feintuning von Kachelgröße/Kontrast ist ein einfacher,
eigenständiger Folgeschritt, sobald der Nutzer den Look live beurteilt hat.

**Verifikation.** `npx tsc -b --force`, `npx eslint src tests`, `npx vitest run`
(148 Tests, unverändert), `npm run build` — alle grün. 3D-Screenshot-Smoke via
Playwright (`vite preview`): keine Konsolen-/Shader-Fehler, `onBeforeCompile`
feuert nachweislich, Pixel-Stichprobe bestätigt reale Texturfarben statt der
alten Flächenfarbe.

**Dateien.** Neu: `src/assets/textures/terrain/*/.gitkeep` (8 Ordner). Geändert:
`src/renderer/three/ThreeMapRenderer.ts` (Splat-Ladepfad + Ground-Shader),
`docs/PATCHNOTES.md`.

## v0.42 — „Terrain System V2: Splatmap-Materialdoku & Textur-Drop-in vorbereitet"

**Was.** Neue Dokumentation + Drop-in-Infrastruktur für ein Terrain-
Materialsystem — noch **keine** Renderer-Änderung:
- **`docs/TERRAIN_TEXTURES.md`** (neu, generiert): vollständige Spezifikation für
  35 Boden-/Material-Texturen in 8 Kategorien (Gras, Erde, Stein, Sand, Schnee,
  Wasser, Felder, Wege) — je Textur Ordner, Auflösung, Stil, Palette, Einsatz,
  Materialeigenschaften, Mischverhalten, benötigte Normal-/Roughness-/AO-/
  Height-Maps, Detailstufe, Priorität und ein copy-paste-fertiger
  ChatGPT-/Bildgenerator-Prompt.
- **Splatmap-Konzept dokumentiert:** Regeln, wie Höhe, Hangneigung und
  Wassernähe die Materialgewichte pro Fläche bestimmen (z. B. 70 % Gras/20 %
  Erde/10 % Stein statt eines harten Terrain-Typs), plus Biome-Materialsets
  (welche Texturen pro Biom zur Auswahl stehen).
- **Drop-in vorbereitet:** neuer Ordner `src/assets/textures/terrain/
  {grass,earth,stone,sand,snow,water,field,path}/` + `terrainTextureUrl()` in
  `src/assets/registry.ts` (Discovery per `import.meta.glob`, wie bei allen
  anderen Assets). Eine abgelegte Textur wird gefunden, aber aktuell noch nicht
  gerendert — der Ground-Shader, der sie tatsächlich mischt, ist bewusst
  **nicht** Teil dieser Phase.

**Warum.** Der Nutzer will die Bodenoberfläche künftig aus weich gemischten
Splatmap-Texturen bestehen lassen statt aus vertex-gefärbtem Höhenfeld plus
einzelnen kleinen Terrain-Modellen (Gras-/Felsbüschel) — "kein Aneinanderreihen
von Modellen, sondern ein lebendiges Ganzes". Bevor eine einzige Textur
existiert (der Nutzer erstellt sie extern mit ChatGPT), muss feststehen: welche
Textur, in welcher Auflösung, mit welchem Motiv, wie sie sich mit ihren
Nachbarn mischt. Das liefert diese Phase — die eigentliche Shader-
Implementierung folgt, sobald reale Texturen zum Verifizieren vorliegen (siehe
v0.40/v0.41: derselbe Doku-zuerst-Ansatz wie bei den 3D-Modellen).

**Architektur.** `src/assets/terrainTextureManifest.ts` ist die einzige Quelle
(mirror von `modelManifest.ts`): `docs/TERRAIN_TEXTURES.md` wird daraus
generiert und von `tests/terrainTextures.test.ts` gegen Drift geprüft — exakt
dasselbe Muster wie die 3D-Modell-Docs (CLAUDE.md §2 „Erweitern statt neu
bauen"). Technische Angaben (Auflösung, Maps, Detailstufe) sind pro
Material-Kategorie EINMAL hinterlegt (`CATEGORY_DEFAULTS`) statt 35-mal
wiederholt — dieselbe Lösung wie `SIZE_CLASS_BUDGETS` bei den 3D-Modellen.
`ThreeMapRenderer.buildGroundMesh()` ist unverändert (weiterhin vertex-gefärbtes
Höhenfeld, v0.39) — reine Datendeklaration + Registry-Erweiterung, kein
Rendering-Risiko in dieser Phase.

**Auswirkung/Zukunft.** Sobald der Nutzer erste Texturen ablegt, sind Name,
Ordner und Blend-Absicht bereits eindeutig festgelegt. Nächster Schritt (eigene
Phase): ein Splatmap-Ground-Shader in `ThreeMapRenderer`, der die
Materialgewichte aus Höhe/Neigung/Feuchtigkeit berechnet und die abgelegten
Texturen weich mischt — mit Fallback auf das aktuelle vertex-gefärbte Höhenfeld,
solange keine Texturen vorhanden sind (bricht nie, wie überall im Projekt).

**Verifikation.** `npx tsc -b --force`, `npx eslint src tests`, `npx vitest run`
(148 Tests, davon 3 neu in `tests/terrainTextures.test.ts`), `npm run build` —
alle grün. Kein 3D-Screenshot-Smoke nötig (keine Renderer-Code-Änderung).

**Dateien.** Neu: `src/assets/terrainTextureManifest.ts`,
`tests/terrainTextures.test.ts`, `docs/TERRAIN_TEXTURES.md` (generiert).
Geändert: `src/assets/registry.ts` (`terrainTextureUrl`/`hasAnyTerrainTexture`),
`docs/3D_WORLD_ASSETS.md` (Querverweis in §3/§7), `docs/PATCHNOTES.md`.

## v0.41 — „World Graphics V2, Phase 2: Gebirge/Flüsse, Straßen-Gelände, Gebäude-Rotation, Sektor-Nebel, Verkehrs-Pathing"

**Was.** Die zweite World-Graphics-V2-Phase liefert die Rendering-/Gameplay-Seite
zu der in v0.40 dokumentierten Konzept-Liste:
- **Gebirge & Flüsse organischer.** `terrainHeight.ts` nutzt für Gebirge jetzt
  **Ridged-Fractal-Noise** (drei Oktaven) statt glatter Rolling-Hill-Noise —
  scharfe Gratlinien und Felsplatten statt runder Blobs. Wasser/Fluss-Betten
  bekommen etwas Unebenheit (statt einer perfekt flachen Wanne), und Land direkt
  neben Fluss/See senkt sich leicht zum Ufer ab ("gräbt sich ein").
- **Straßen folgen dem Gelände.** Jedes Straßensegment kippt jetzt nach dem
  lokalen Höhengradienten (Finite-Differenzen von `terrainHeightAt`, auf ~20°
  begrenzt) und bekommt eine erdfarbene Schürze an der Unterkante — auf sanft
  geneigtem Grasland/Wald zeigt sich nie mehr eine schwebende Kante oder Stufe
  zwischen Nachbarsegmenten.
- **Gebäude-Rotation.** Vor dem Platzieren lässt sich jedes Gebäude in
  90°-Schritten drehen (Taste **R** oder der Dreh-Button im Platzierungs-Banner);
  die Geister-Vorschau zeigt einen kleinen Pfeil an der gewählten Vorderseite.
  Rein kosmetisch — Grundfläche, Validierung und Kosten bleiben exakt wie vorher,
  nur die Modell-/Node-Ausrichtung dreht sich. Neues optionales Feld
  `BuildingInstance.rotation` (0/90/180/270) wird beim Platzieren gespeichert.
- **Sektor-Nebel.** Gesperrte Sektoren zeigen jetzt zusätzlich zur gedimmten
  Bodenfarbe einen dichten, sanft wogenden Nebelschleier (eine Ebene je Sektor,
  animiert über denselben Zeit-Uniform wie die Wasseroberfläche) — hohe
  Landmarken/Berge können weiter als Silhouette durchscheinen ("keine komplette
  Sicht", kein Blackout).
- **Verkehrs-Pathing.** Der Ambient-Verkehr fährt jetzt **Haus → Straße → Ziel**
  über dieselbe BFS-Straßensuche wie der Missions-Lieferwagen, statt an jeder
  Kreuzung zufällig abzubiegen. Ohne Wohnhaus/Ziel-Gebäude (frühes Spiel) fällt
  eine Route auf einen kurzen, richtungstreuen Zufallslauf zurück, damit auf der
  Karte nie schlagartig aller Verkehr verschwindet.

**Warum.** v0.40 hat die komplette Modell-Dokumentation für World Graphics V2
vorbereitet, aber bewusst keine Rendering-/Gameplay-Änderung vorgenommen. Dieser
Durchgang setzt die fünf dort als "Konzept, noch nicht implementiert" markierten
Abschnitte um — mit vorhandenen prozeduralen Mitteln (keine neuen `.glb` nötig,
alles bleibt Drop-in-fähig für später).

**Architektur.** Alles erweitert bestehende Systeme statt neue zu bauen
(CLAUDE.md §2): `terrainHeight.ts` bleibt die eine reine Höhenquelle (nur die
Rauschfunktion für Gebirge/Wasser geändert); Straßen-Tilt/-Schürze ist ein
zusätzlicher Schritt in `ThreeMapRenderer.buildRoad`; Rotation ist ein optionales
Feld auf `BuildingInstance` (kein Migrationszwang, siehe unten) plus ein
optionales `IMapRenderer.setPlacingRotation` (2D/Iso-Renderer ignorieren es
ungerührt); Sektor-Nebel ist ein zusätzlicher InstancedMesh-Pass neben
`buildGroundMesh`/`buildWater`; Verkehr nutzt die bereits vorhandene
`roadPath()`-BFS (bisher nur vom Missions-Lieferwagen genutzt) auch für den
Ambient-Verkehr, statt eine zweite Pathing-Logik zu bauen. Simulation bleibt
unberührt — Terrain-Höhe, Straßen-Optik und Nebel sind rein visuell, Rotation
ändert nur die Darstellung, Verkehr ist reine Ambient-Deko ohne Gameplay-Wirkung.

**Saves.** `BuildingInstance.rotation` ist ein neues **optionales** Feld
(`z.union([...]).optional()` in `schemas.ts`) — alte Spielstände parsen unverändert
(Feld bleibt `undefined` ≙ 0°), keine `SCHEMA_VERSION`-Erhöhung und keine
Migration nötig (wie zuvor bei `targetUpgradeLevel`/`constructionEndsAt`).

**Auswirkung/Zukunft.** Die Bausteine aus v0.40 §7–§12 sind jetzt aktiv:
schärfere Gebirge/Flüsse, geländetreue Straßen, drehbare Gebäude, Sektor-Nebel,
zielgerichteter Verkehr. Offen für spätere Phasen: echte Gebirgs-/Fluss-Terrain-
Features (Pässe, Wasserfälle, Schluchten als eigene platzierte Formen statt nur
Höhenfeld-Rauschen), automatischer Straßenanschluss/Gehweg zwischen Gebäude und
Straße, Bürgerhinweis-Sprechblasen im Nebel, Serpentinen/Tunnel für große
Höhenunterschiede.

**Verifikation.** `npx tsc -b --force`, `npx eslint src tests`, `npx vitest run`
(145 Tests inkl. `terrainHeight.test.ts` mit den bestehenden Invarianten —
Gebirge hoch, Wasser unter Wasserlinie, Bauland gleichmäßig, stetig), `npm run
build` — alle grün. 3D-Screenshot-Smoke (Playwright, `vite preview`, `/`):
Karte lädt ohne Konsolenfehler, Gebirge zeigt sichtbar zerklüftete Textur,
Platzierungs-Banner zeigt den Dreh-Button und wechselt bei Taste R sichtbar
von 0° auf 90°, Nebel-Ebene über dem gesperrten Sektor sichtbar.

**Dateien.** Geändert: `src/renderer/three/terrainHeight.ts` (Ridged-Noise
Gebirge, Fluss-/See-Bett-Unebenheit, Uferabsenkung), `src/renderer/three/
ThreeMapRenderer.ts` (Straßen-Gelände-Fit + Schürze, Gebäude-Rotation anwenden +
Ghost-Pfeil + `setPlacingRotation`, Sektor-Nebel-Pass, Verkehrs-Pathing via
`roadPath`), `src/game/types.ts` + `src/game/config/schemas.ts`
(`BuildingInstance.rotation`), `src/game/commands/controller.ts`
(`placeBuilding` nimmt optionale Rotation entgegen), `src/state/store.ts`
(`placingRotation` + `rotatePlacing`), `src/renderer/IMapRenderer.ts` +
`src/renderer/MapRenderer.ts` (Rotation optional durchgereicht),
`src/components/MapView.tsx` (Taste R, Dreh-Button im Banner), `src/styles.css`,
`src/i18n/de.json`, `docs/PATCHNOTES.md`.

## v0.40 — „World Graphics V2, Phase 1: 3D-Asset-Doku konsolidiert & vollständig"

**Was.** Reine Dokumentations-/Datenüberarbeitung, kein Rendering- oder
Gameplay-Code geändert:
- **Eine Quelle statt drei widersprüchlicher Docs.** `docs/3D_MODELS.md` (v0.29,
  veraltet — nutzte noch alte Namen wie `grass.glb`/`water.glb`) ist entfallen;
  seine noch gültigen Inhalte (Node-Namen `rotor`/`chimney`, Kartenmodi,
  Integrationsschritte) sind in `docs/3D_MODEL_MANIFEST.md` aufgegangen.
  `docs/3D_MODEL_MANIFEST.md` ist jetzt der kurze, testgeprüfte Namens-Index;
  `docs/3D_WORLD_ASSETS.md` das entschlackte Zielbild/Stilhandbuch. Beide
  duplizieren keine Modell-Einzellisten mehr, sondern verweisen auf die
  generierten `src/assets/models/<ordner>/PROMPTS.md`.
- **Jedes Modell — aktuell verdrahtet *und* geplant — vollständig spezifiziert.**
  `src/assets/modelManifest.ts` bekam ein erweitertes Datenmodell (`SizeClass` +
  `SIZE_CLASS_BUDGETS`, sowie Footprint/Höhe/Pivot/Front/Platzierung/Biom/
  Instancing/Animations- & Effekt-Nodes/Spawn-Regel/Live-Status je Eintrag). Jede
  generierte `PROMPTS.md` trägt jetzt pro Modell einen vollständigen Spec-Block
  statt nur Name+Motiv.
- **Alle in der „World Graphics V2"-Anfrage genannten künftigen Modelle ergänzt:**
  schroffes Gebirge (Wand/Ecke/Tal-Pass/Tunnel/Spitze), Gebirgsflüsse (Quelle →
  Kurve/Gabelung → Mündung, kleine/große Wasserfälle), Küste & Klippen (Sand/Fels,
  Kliffkante/-ecke, Hero-Küstenklippe), Straßen-Geländeanpassung (`road_slope`,
  `road_bridge_entry`, neue `props/infrastructure/`-Kategorie für Stützmauer/
  Böschung), Sektor-Nebel & Bürgerhinweise (`locked_sector_fog_veil`,
  `landmark_silhouette_hint`, `marker_citizen_hint`), fehlende Hero-Landmarken
  (Mine, Damm, Marktviertel, Waterfront) sowie neue Kategorien für Wegkreuze,
  Wanderwege, Naturdenkmäler, ländliche Streusiedlungen, saisonale Deko und zwei
  Endgame-Landmarken-Platzhalter. Lebendige-Welt-Effekte (Vögel, Schmetterlinge,
  Wind-Sway, Wasserbewegung, Brandung, Wolkenschatten) sind bewusst als
  „Partikel/Shader, kein `.glb`" dokumentiert statt als Modell-Kategorie.
- **Konzept-Kapitel für die noch ausstehenden Code-Phasen** in
  `docs/3D_WORLD_ASSETS.md` ergänzt (explizit als *noch nicht implementiert*
  markiert): Straßen-Geländeanpassung, Gebäude-Rotation/Platzierungsvorschau/
  automatischer Straßenanschluss, Sektor-Nebel/Silhouetten/Bürgerhinweise,
  Verkehrs-Pathing Haus→Straße→Ziel.

**Warum.** Der Nutzer forderte eine grafische Weltüberarbeitung („World Graphics
V2") mit ~14 Rendering-/Gameplay-Systemen — realistisch mehrere Code-Phasen. Ein
Teil der Anfrage war explizit als **verpflichtend** markiert: die vollständige
Überarbeitung der 3D-Asset-Dokumentation, damit jedes künftige Modell (auch
Landmarken, Terrain-Stücke, Küsten-/Fluss-/Gebirgsobjekte, Dekorationen) schon
jetzt einen eindeutigen, vollständig spezifizierten Platz hat, bevor überhaupt
eine `.glb`-Datei existiert. Diese Phase liefert genau das — die Blaupause, auf
der jede folgende Rendering-Code-Phase (organisches Gebirge, Flusstäler, Straßen-
Gelände-Logik, Gebäude-Rotation, Sektor-Nebel, Verkehrs-Pathing) aufbaut.

**Architektur.** `src/assets/modelManifest.ts` bleibt die **einzige** Quelle für
Modellnamen UND jetzt auch für deren volle Spezifikation; die drei `docs/*.md`
tragen nur noch das, was sich nicht automatisch generieren lässt (Zielbild,
Stilphilosophie, Konzepte). Kein neues System — konsequente Erweiterung des
bestehenden Drop-in-/Fallback-Mechanismus (CLAUDE.md §1/§2/§5). Keine Änderung an
`ThreeMapRenderer.ts`s Lade-/Fallback-Logik, an `registry.ts`, an
`GameController`/State oder an Savegames — reine Datendeklaration plus generierte
Dokumentation.

**Auswirkung/Zukunft.** Jedes künftig abgelegte `.glb` (auch für noch nicht
gebaute Features) hat bereits Dateiname, Footprint, Budget, Platzierungs- und
Biom-Regeln — kein Rätselraten mehr für Artists. Die als „Konzept, noch nicht
implementiert" markierten Abschnitte in `docs/3D_WORLD_ASSETS.md` sind die
Roadmap für die nächsten Code-Phasen (Terrain-/Gebirgs-Rendering, Straßen-
Gelände-Logik, Gebäude-Rotation & Platzierungsvorschau, Sektor-Nebel/Hinweise,
Verkehrs-Pathing) — bewusst nicht Teil dieser Phase.

**Verifikation.** `npx tsc -b --force`, `npx eslint src tests`, `npx vitest run`
(inkl. `tests/modelReadmes.test.ts` und `tests/manifest.test.ts`), `npm run
build` — alle grün. Kein 3D-Screenshot-Smoke nötig (keine Renderer-Code-Änderung).

**Dateien.** Geändert: `src/assets/modelManifest.ts` (SizeClass-Budgets, erweitertes
`PromptEntry`-Schema, alle neuen World-Graphics-V2-Modelleinträge), `docs/
3D_WORLD_ASSETS.md`, `docs/3D_MODEL_MANIFEST.md` (beide v0.40, entschlackt),
`src/renderer/three/ThreeMapRenderer.ts`/`src/assets/registry.ts`/`src/i18n/
de.json` (Doku-Verweise auf das entfallene `docs/3D_MODELS.md` umgebogen).
Gelöscht: `docs/3D_MODELS.md` (Inhalt in `3D_MODEL_MANIFEST.md` aufgegangen).
**Assets:** alle `src/assets/models/<ordner>/README.md` + `PROMPTS.md` neu
generiert (`WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`).

## v0.39 — „Organische Welt: Höhenfeld-Boden, Gebirge, saubere Platzierung & Proportionen"

**Was.** Die Karte ist nicht mehr flach:
- **Organischer Boden statt Kachel-Boxen.** Der Grund ist jetzt ein durchgehendes,
  vertex-gefärbtes, beleuchtetes **Höhenfeld**: klare Hügel, geneigte organische
  Formen, **riesige, smooth verlaufende Gebirge** im Westen/Norden, abgesenkte
  Seen/Flüsse/Meer. Ein Klick-Boden bleibt für die Kachelauswahl.
- **Alles sitzt sauber auf dem Boden.** Gebäude, Straßen, Baustellen, Auswahl-Ringe,
  Geister-Vorschau, Bäume/Sträucher, Autos, Lieferwagen, Marker und Rauch lesen
  **dieselbe** Höhenfunktion (`terrainHeightAt`) — nichts schwebt oder versinkt.
  Bebaubares Land ist bewusst **flach/ruhig** gehalten, damit Gebäude sauber stehen;
  Wasser bekommt eine flache Wasseroberfläche über dem abgesenkten Bett.
- **Proportionen korrigiert.** Kleine Deko-/Natur-Props behalten ihre **reale Höhe**
  (1 Kachel ≈ 4 m): eine **Parkbank ist nicht mehr so groß wie ein Baum**. Zentrale
  Tabelle `DECO_TARGET_HEIGHT`; prozedurale Deko zeichnet jetzt pro id die richtige
  Form (Bank, Brunnen, Blumenbeet, Baum) in passender Größe.
- **Prompts & Anweisungen erweitert.** `terrain/PROMPTS.md` und `props/PROMPTS.md`
  bekommen eine klare **Maßstabs-/Höhen-/Pivot-Regel** (1 Kachel ≈ 4 m, Pivot
  unten-mittig, nichts schwebt, Höhen-Richtwerte je Objekttyp) plus neue Einträge
  für Gebirge/Felsen/Klippen/Hügel, Bäume/Sträucher/Hecke/Schilf.

**Warum.** Eine flache Kachelfläche wirkt leblos; klare Hügel und große Gebirge geben
der Welt Charakter und Tiefe (3D-Welt als visueller Kern). Gleichzeitig müssen
Bauflächen sauber bleiben und Modelle in stimmigen Größen zueinander stehen — genau
die genannten Fehler (schwebende/gleich große Objekte) sind damit behoben.

**Architektur.** Neue **eine Höhenquelle** `src/renderer/three/terrainHeight.ts`
(rein, testbar): leitet die Höhe aus dem Terraintyp (`terrainAt`, Sim) + kohärentem
Value-Noise ab — biome-abhängig (Land sanft, Gebirge groß, Wasser abgesenkt), bilinear
geglättet. Der `ThreeMapRenderer` baut den Boden als **ein** `BufferGeometry`-Heightfield
(Vertexfarben aus den angrenzenden Kacheln, `computeVertexNormals`, ein Draw-Call) und
setzt jede Platzierung auf `terrainHeightAt`. Rein visuell — Simulation, Saves und
Kachel-Koordinaten bleiben unberührt (CLAUDE.md §1/§3); Bebaubarkeit/Picking laufen
weiter über die logischen Kacheln.

**Performance.** Der Boden ist ein einzelner Mesh (statt tausender Instanz-Boxen);
`terrainHeightAt` ist billig (2-Oktaven-Noise) und wird nur beim Terrain-Rebuild bzw.
pro Objekt-Platzierung ausgewertet, nicht pro Frame.

**Auswirkung/Zukunft.** Drop-in-Fels-/Gipfel-/Hügel-Modelle sitzen automatisch auf der
geneigten Oberfläche (Prompts liegen bereit). Später möglich: Footprints unter Gebäuden
exakt einebnen, Klippen/Terrassen, Uferlinien, Gebirgs-Hero-Modelle, oder die Höhe an
Gameplay koppeln.

**Verifikation.** `tsc -b --force`, ESLint, **145 Tests** (5 neue Höhenfeld-Tests:
Gebirge hoch, Wasser unter Wasserlinie, Bauland sanft, stetig), Build — alles grün.
3D-Screenshot-Smoke: organische Gebirge & Hügel, Stadt sauber auf flacher Fläche,
Bäume in korrekter Baumgröße, keine Konsolenfehler.

**Dateien.** Neu: `src/renderer/three/terrainHeight.ts`, `tests/terrainHeight.test.ts`.
Geändert: `src/renderer/three/ThreeMapRenderer.ts` (Heightfield-Boden, Höhen-Platzierung
überall, `DECO_TARGET_HEIGHT` + `decorationProc`, Wasser auf `WATER_LEVEL`),
`src/assets/modelManifest.ts` (`SCALE_NOTE` + erweiterte terrain/props-Prompts),
`src/assets/models/terrain/PROMPTS.md`, `src/assets/models/props/PROMPTS.md` (generiert),
`docs/PATCHNOTES.md`.

## v0.38 — „Gebäude-Vorschau direkt aus dem 3D-Modell (keine PNGs mehr nötig)"

**Was.** Die Vorschau eines Gebäudes (Baumenü, Gebäude-Sheet, Level-up-Karten,
Event-Popup) wird jetzt **automatisch aus seiner `.glb` gerendert**. Wer ein Modell
in `src/assets/models/buildings/` ablegt, braucht **keine `<id>.png`-Vorschau mehr**.
Reihenfolge der Quellen: **`.glb`-Thumbnail → `<id>.png` (falls vorhanden) → eingebaute
SVG-Grafik**. Solange das Thumbnail noch rendert, zeigt die Karte die SVG/PNG, blinkt
also nie leer.

**Warum.** Es gibt inzwischen viele Gebäude-Modelle. Bisher brauchte jede Karte
zusätzlich ein handgezeichnetes PNG — doppelte Pflege. Jetzt genügt die `.glb`: ein
Asset für Welt **und** Vorschau, konsistenter Look, weniger Dateien.

**Architektur.** Neuer Offscreen-Renderer `src/renderer/three/modelThumbnail.ts`:
**ein** geteilter WebGL-Kontext zeichnet jedes Modell **einmal** in ein transparentes
256²-Canvas (3/4-Ansicht, Welt-Beleuchtung) und liefert eine PNG-Data-URL, **gecacht
pro Modell-URL**. `BuildingArt` (in `BuildingArtwork.tsx`) nutzt einen kleinen
`useModelThumbnail`-Hook und wählt die Quelle in obiger Reihenfolge. Rein
präsentationsseitig — keine Simulation/Save/Koordinaten berührt (CLAUDE.md §1). Ist
WebGL nicht verfügbar (z. B. Tests), fällt es sauber auf PNG/SVG zurück.

**Performance.** Genau ein zusätzlicher WebGL-Kontext (Singleton, nicht pro Gebäude),
jedes Modell wird nur einmal gerendert und das Ergebnis gecacht; die Karten zeigen
danach ein statisches `<img>`.

**Auswirkung/Zukunft.** Neue Gebäude brauchen nur noch die `.glb`. Später ließe sich
das Thumbnail leicht auf die aktuelle Upgrade-Stufe (`<id>_stage<N>.glb`) oder eine
kleine Rotations-Vorschau erweitern.

**Verifikation.** `tsc -b --force`, ESLint, **140 Tests**, Build — grün. Sicht-Check
mit temporären Test-`.glb`: „Kleines Haus" zeigt das aus dem Modell gerenderte
Thumbnail, Nachbarn ohne Modell weiter ihr SVG; keine Konsolenfehler. (Die Test-`.glb`
wurden nach der Prüfung wieder entfernt.)

**Dateien.** Neu: `src/renderer/three/modelThumbnail.ts`. Geändert:
`src/components/art/BuildingArtwork.tsx` (GLB-zuerst + Hook), `src/styles.css`
(`.bld-art-model`), `docs/ASSETS.md`, `docs/ARCHITECTURE.md`, `docs/PATCHNOTES.md`.

## v0.37 — „Lebendige Welt: Tag/Nacht-Zyklus + dynamischer Himmel + Wasser"

**Was.** Die 3D-Welt bekommt eine **lebendige Atmosphäre**. Neu:
- **Tag/Nacht-Zyklus** mit dynamischem Himmel: ein Farbverlaufs-Himmel (Gradient-Dome)
  von Zenit zu Horizont, eine **wandernde Sonne** (Aufgang im Osten → Zenit → Untergang
  im Westen), nachts ein **kühler Mond** aus der Gegenrichtung, **Sterne**, die nur
  nachts aufscheinen, sowie Sonnen-/Mondscheibe am Himmel.
- **Atmosphärische Beleuchtung + Fog**, die sich stufenlos mit der Tageszeit umfärben
  (goldene Morgen-/Abenddämmerung, heller Mittag, tiefblaue Nacht — nie ganz schwarz,
  damit die Stadt lesbar bleibt).
- **Lebendiges Wasser:** Wasser-/Fluss-Kacheln bekommen eine **animierte, sanft
  wellende Oberfläche** (GPU-Vertex-Shader), die die Himmelsstimmung aufnimmt und
  nachts von selbst dunkler wird.
- **HUD-Regler** (nur 3D): ein Chip zum **An-/Ausschalten des Zyklus** (Sonne/Mond-
  Icon + Uhrzeit) und ein **Tageszeit-Schieber** zum manuellen Einstellen. Standard:
  Zyklus **aus** bei angenehmem Vormittag — es ändert sich nichts, bis man ihn
  aktiviert.

**Warum.** Die 3D-Welt ist der visuelle Kern des Spiels (Strategie). Ein statischer
Himmel mit fester Sonne wirkt leblos; ein Tag/Nacht-Rhythmus und bewegtes Wasser geben
der Stadt sofort Tiefe und Stimmung — ohne ein einziges neues 3D-Modell.

**Architektur.** Rein **präsentationsseitig** — kein Eingriff in Simulation, Saves
oder Koordinaten (CLAUDE.md §1/§3). Die *Mathematik* der Atmosphäre liegt in einem
reinen, WebGL-freien Modul `src/renderer/three/environment.ts` (Sonnenstand + alle
Farben/Intensitäten je Tageszeit, in `tests/environment.test.ts` geprüft). Die
three.js-Umsetzung kapselt `src/renderer/three/SkyEnvironment.ts` (Dome, Sonne/Mond,
Sterne, die drei Szenen-Lichter + Fog); der `ThreeMapRenderer` ersetzt seinen alten
statischen Licht-/Himmel-Block dadurch und ruft `env.update(dt)` pro Frame. Die
Tageszeit-Einstellungen liegen in einem eigenen, persistenten Store
`src/renderer/three/environmentSettings.ts` (localStorage `cmb.environment`, **nicht**
im Savegame → keine Schema-Änderung, alte Spielstände laden unverändert) — nach dem
Muster von `cameraSettings.ts`, sodass HUD und Renderer dieselben Werte live teilen.

**Performance.** Der Himmel ist ein einzelner vertex-gefärbter Dome (Neufärbung pro
Frame nur über einen vorbereiteten Buffer), Sterne sind ein `Points`-Objekt, das
Wasser eine **einzelne InstancedMesh** mit GPU-Wellen (ein `uTime`-Uniform, keine
CPU-Matrix-Updates). Gedimmte gesperrte Sektoren bekommen bewusst **keine**
Wasser-Oberfläche (Nebel-des-Krieges bleibt erhalten).

**Auswirkung/Zukunft.** Fundament für stimmungsvolle Screenshots und spätere Effekte
(Fenster-Leuchten bei Nacht, Wetter, Jahreszeiten) — alle können auf dem
`EnvGrade`-Modell aufbauen. Ein späteres Drop-in-Skybox-Modell ließe sich analog
ergänzen. Optional könnte der Zyklus künftig an die Spielzeit gekoppelt werden.

**Verifikation.** `tsc -b --force`, ESLint, **140 Tests** (9 neue Env-Tests), Build —
alles grün. 3D-Screenshot-Smoke (Playwright, Basis `/`) für **Morgen/Nacht/
Sonnenuntergang** ohne Konsolenfehler; Wasser-Shader mit real gerenderten Instanzen
gegengeprüft (keine Shader-Fehler).

**Dateien.** Neu: `src/renderer/three/environment.ts`,
`src/renderer/three/environmentSettings.ts`, `src/renderer/three/SkyEnvironment.ts`,
`tests/environment.test.ts`. Geändert: `src/renderer/three/ThreeMapRenderer.ts`
(SkyEnvironment integriert, statischer Licht-/Himmel-Block entfernt, animierte
Wasseroberfläche, Frame-/Dispose-Anbindung), `src/components/hud/CameraControls.tsx`
(Tag/Nacht-Regler), `src/i18n/de.json`, `src/styles.css`. **Keine** neuen Assets/
Ordner nötig (prozedural).

## v0.36 — „Generierungs-Prompts pro Ordner (PROMPTS.md), auto-synchron"

**Was.** Jeder Modellordner hat jetzt neben der `README.md` (Namensliste) eine
**`PROMPTS.md`** mit **copy-paste-fertigen Text-zu-3D-Prompts** für jedes Modell —
aktuelle *und* geplante. Für Gebäude wird **ein Prompt pro Config-Gebäude** erzeugt
(alle aus `buildings.config.ts`, inkl. Footprint, Stufen-Dateinamen und
Baustellen-Modell), plus ein Block für geplante Landmarken/Hero-Bauten. Die übrigen
Ordner (terrain/roads/bridges/props/vehicles/markers/effects/ui) listen je Modell
einen Prompt, gruppiert in „Aktiv genutzt" und „Geplant".

**Warum.** Damit man für **alle** Modelle — die es gibt und die noch kommen — direkt
einen fertigen Prompt zur Hand hat, genau im richtigen Ordner, ohne Stil-/Technik-
Regeln jedes Mal neu zusammenzusuchen.

**Architektur.** Gleiche Single-Source wie die READMEs: alles kommt aus
`src/assets/modelManifest.ts` (neu: `STYLE_PREFIX`, `BUILDING_PROMPTS`,
`BUILDING_LANDMARK_PROMPTS`, `FOLDER_PROMPTS`, `renderFolderPrompts`,
`buildBuildingsPrompts`). Jeder Block enthält den gemeinsamen Stil-/Technik-Prefix
(identisch zu `docs/3D_WORLD_ASSETS.md` §6) + ein englisches Motiv (Text-zu-3D-Tools
arbeiten damit am besten). Der Renderer nutzt weiterhin dieselben Namensarrays →
Code, README und Prompts können nicht auseinanderlaufen.

**Auto-synchron.** `tests/modelReadmes.test.ts` generiert/prüft jetzt **README *und*
PROMPTS** je Ordner und erzwingt zusätzlich, dass **jede** Gebäude-ID einen Prompt in
`BUILDING_PROMPTS` hat. Neues Gebäude ohne Prompt/Motiv → Test schlägt fehl.
Regenerieren: `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`.

**Auswirkung/Zukunft.** Ein neues Gebäude in der Config zieht automatisch einen
Prompt-Slot nach sich; neue Modellnamen ergänzt man an einer Stelle. Damit lässt sich
die 3D-Welt Modell für Modell füllen, ohne Doku-Drift.

**Dateien.** Geändert: `src/assets/modelManifest.ts`, `tests/modelReadmes.test.ts`,
`docs/3D_MODEL_MANIFEST.md`, `docs/PATCHNOTES.md`. Neu (generiert):
`src/assets/models/<ordner>/PROMPTS.md` (9 Dateien inkl. `buildings/`).

## v0.35 — „Plattform-Pivot: natives PC-Spiel (Tauri), eine Codebasis"

**Was wurde geändert.** City Mayor Builder wird ab sofort als **natives PC-Spiel**
entwickelt (Windows zuerst, später Steam/macOS/Linux, danach Mobile) — aus **einer**
Codebasis. Der Browser bleibt reine Dev-/Test-Umgebung; **GitHub Pages ist kein
Zielplattform mehr**. Konkret:
- **Tauri 2** als Desktop-Wrapper eingerichtet: neues `src-tauri/` (Rust-Crate +
  `tauri.conf.json` mit fester `devUrl`, Fenster 1280×800, strikter CSP,
  Windows-Bundle nsis/msi), Deps `@tauri-apps/api`/`@tauri-apps/cli`, Skripte
  `tauri:dev`/`tauri:build`.
- **Vite Dual-Mode:** `base` von `/City-Mayor-Builder-Arbeitstitel-/` auf `'/'`
  (Root-Origin für Dev, Preview und Tauri gleichermaßen), fester Dev-Port 5173
  (`strictPort`), Build-Target für WebView2/WKWebView.
- **CI ohne Pages:** `deploy.yml` → `ci.yml` (nur Lint/Typecheck/Test/Build, kein
  Deploy). GitHub = nur Versionsverwaltung/Backup/Zusammenarbeit.
- **Verbindliche Doku:** neu `CLAUDE.md` (Arbeitsregeln), `docs/PROJECT_STRATEGY.md`
  (kanonische Strategie), `docs/ARCHITECTURE.md` (Seam/Modi/Assets/Migration),
  gefülltes `README.md`; `docs/CONCEPT.md` verweist auf den Pivot.

**Warum.** Die Zielplattform ist ein vollwertiges Spiel, kein Browser-Tab. Die
Grundlage (Desktop-Wrapper + verbindliche Regeln) sollte **einmal sauber** stehen,
bevor 3D-Welt und Gameplay weiter ausgebaut werden — statt später ein Komplettumbau.

**Welche Architektur wurde gewählt.** Bewusst **minimal-invasiv**: Die Simulation
(`src/game/`) ist bereits vollständig vom Rendering getrennt (verifiziert: keine
`three`/`pixi`/`react`/`zustand`/Renderer/UI-Imports unter `src/game/**`; Seam =
`GameController` + `IMapRenderer` + Zustand-Bridge, config-getrieben mit Zod, lineare
Save-Migrationen bis `SCHEMA_VERSION 9`). Deshalb war für Tauri **kein** Umbau der
Spiellogik nötig — nur Infrastruktur. Tauri 2 wurde gewählt, weil dieselbe Basis
später Android/iOS trägt (gleiche Simulation, nur UI/Kamera/Touch angepasst). Der
Rust-Wrapper ist bewusst dünn (nur Fenster + Frontend laden).

**Auswirkungen.**
- `npm run dev` läuft jetzt auf `http://localhost:5173/` (statt Unterpfad); Assets
  werden unter `/assets/…` ausgeliefert. Da alle Asset-URLs aus
  `import.meta.glob('?url')` stammen und `base` automatisch erben, war **ein** Wert
  ausreichend — kein Pfad-Refactor, kein Code an Registry/Renderer.
- Savegames: unverändert `localStorage` (`cmb.save.*`) — funktioniert in der
  Tauri-WebView. Der Origin unterscheidet sich von der alten Pages-URL, daher wandern
  bestehende Browser-Saves nicht automatisch mit; Übertragung via Export/Import im
  Einstellungen-Panel.
- Kein GitHub-Pages-Deploy mehr; die öffentliche Pages-URL wird nicht weiter bespielt.

**Was wird dadurch später einfacher.** Native Datei-Saves (Tauri-`fs`), Auto-Updater,
Installer/Steam und die **Mobile-Version** (Tauri 2 Android/iOS) docken jetzt an eine
bestehende native Struktur an, ohne die Spiellogik anzufassen.

**Geänderte/neue Dateien.**
- Neu: `src-tauri/{Cargo.toml,build.rs,tauri.conf.json,src/main.rs,src/lib.rs,
  capabilities/default.json,icons/README.md}`, `CLAUDE.md`,
  `docs/PROJECT_STRATEGY.md`, `docs/ARCHITECTURE.md`, `.github/workflows/ci.yml`.
- Geändert: `vite.config.ts`, `package.json`, `package-lock.json`, `.gitignore`,
  `README.md`, `docs/CONCEPT.md`, `docs/PATCHNOTES.md`.
- Entfernt: `.github/workflows/deploy.yml`.

**Neue Ordner/Assets nötig.** `src-tauri/icons/` muss vor dem ersten Desktop-Build
lokal mit `npx tauri icon <quelle-1024.png>` befüllt werden (Icon-Binaries sind
gitignored; siehe `src-tauri/icons/README.md`). `src-tauri/target` und
`src-tauri/gen` sind generiert und gitignored.

**Hinweis zur Verifikation.** Der Windows-Build (`npm run tauri:build`) läuft nur auf
einem Windows-Host mit Rust + WebView2 — nicht in der Linux-Cloud-Umgebung. Verifiziert
wurde der Browser-Pfad (tsc/eslint/Tests/Build/3D-Screenshot) sowie die Gültigkeit der
Tauri-Konfiguration; die Desktop-Build-Schritte stehen im `README.md`.

## v0.34 — „Pro-Ordner-Modellisten, Upgrade-Stufen, Baustellen- & Welt-UI-Modelle"

Baut auf v0.33 auf und macht das Entwickeln eigener Modelle noch geführter.

**Modellliste pro Ordner (auto-synchron).** Jeder Modellordner hat jetzt eine
`README.md` direkt daneben (`src/assets/models/<ordner>/README.md`) mit exakt den
Modellnamen, die *dieser* Ordner anbindet — inkl. Aliassen, Ausrichtung und
Hinweisen. Quelle ist das neue `src/assets/modelManifest.ts` (die **einzige**
Namensquelle, die auch der Renderer nutzt) plus `buildings.config.ts` für die
Gebäudeliste. Ein Test (`tests/modelReadmes.test.ts`) hält alle READMEs synchron —
neues Gebäude/Modellname → Test schlägt fehl, bis regeneriert
(`WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`). Der Renderer
importiert seine Namensarrays jetzt aus `modelManifest.ts`, sodass Code und Doku
nicht mehr auseinanderlaufen können.

**Upgrade-Stufen pro Gebäude.** `<id>.glb` deckt weiterhin alle Stufen ab; optional
liefert `<id>_stage2.glb … _stage<N>.glb` je Ausbaustufe ein eigenes Modell (Stufe
N ≙ Upgrade-Level N−1) — automatisch nach `upgradeLevel` gewählt.

**Baustellen-Modell pro Gebäude — jetzt auch bei Upgrades.** Während Bau *und*
Upgrade zeigt der Renderer eine Baustelle: pro Gebäude `<id>_construction.glb`,
sonst ein generisches Baustellen-Prop (`construction_site` …), sonst ein
prozedurales Gerüst. Beim Upgrade bleibt die aktuelle Stufe darunter sichtbar.

**Welt-UI mit 3D-Modellen (neuer Ordner `models/ui/`, Loader `uiModel()`).** Der
Auswahlring unter dem gewählten Gebäude ist per `ui_selection_ring.glb` ersetzbar
(sonst prozedural). Über dem gewählten Gebäude schwebt ein Aktions-/Upgrade-Button
(`ui_upgrade_button` wenn Upgrade bereit, sonst `ui_build_button`) — nur, wenn das
Modell vorhanden ist. `ui_level_badge` ist als Slot reserviert.

Exakte Namen: die jeweilige Ordner-`README.md` bzw. `docs/3D_MODEL_MANIFEST.md` §0.

## v0.33 — „Drop-in 3D-Modelle für die ganze Welt (Renderer-Anbindung)"

Bisher las der 3D-Renderer nur **Gebäude**-Modelle ein; alles andere war rein
prozedural und ignorierte eingelegte `.glb`. Jetzt konsumiert der Renderer die
**gesamte** Drop-in-Pipeline — du kannst für **Gebirge/Terrain, Straßen, Brücken,
Props/Vegetation, Fahrzeuge, Marker und Effekte** eigene Modelle entwickeln, in den
passenden Ordner legen und siehst sie sofort. Fehlt ein Modell, bleibt der
prozedurale Fallback — das Spiel bricht nie. Gameplay/Savegames unberührt.

**Neu automatisch geladen (Dateiname = Schlüssel, rekursiv):**
- **Terrain/Gebirge** (`models/terrain/…`): Kachelmodell je Terraintyp ersetzt die
  farbige Basis-Kachel (`grass_tile`/`grass`, `forest_ground_tile`/`forest`,
  `ocean_tile`/`water`, `river_straight`/`river`, `mountain_ground_tile`/`mountain`,
  `sand_tile`/`sand`, `fertile_ground_tile`/`fertile`). Auf Gebirgs-Kacheln werden
  zusätzlich Gipfel/Felsen gestreut (`mountain_peak_medium`/`_large`/`rock_large`).
- **Straßen** (`models/roads/…`): Segment nach Nachbar-Maske gewählt und gedreht —
  `road_straight`, `road_curve`, `road_t_intersection`, `road_cross_intersection`,
  `road_end` (Kanonik: gerade = N–S, Kurve = N+E; Klassenvarianten
  `road_main_*` bevorzugt). **Brücken** (`models/bridges/…`) über Wasser/Fluss:
  `bridge_medium_road`, `bridge_small_stone`, … (sonst prozeduraler Deck-Fallback).
- **Props/Vegetation** (`models/props/nature/…`): Bäume/Büsche gecullt (nie auf
  Stadt/Straße) — `pine_tree`/`tree`, `bush_small`/`bush`.
- **Fahrzeuge** (`models/vehicles/…`): Verkehr `car`/`car_small`, Missions-Van
  `service_van`/`car_van` (Ausrichtung: Front +z).
- **Marker** (`models/markers/…`): schwebendes 3D-Modell statt Billboard —
  `marker_task`/`marker_problem`/`marker_construction`/`marker_upgrade` (+ Aliasse).
- **Effekte** (`models/effects/…`): Schornstein-Rauch `smoke_chimney` (sonst
  prozeduraler Sprite-Puff).

**Robustheit:** Modelle werden gecacht und pro Nutzung geklont; viele gleiche
Modelle (Terrain/Props) laufen als eine `InstancedMesh` (ein Draw-Call, gedeckelt).
Geteilte Cache-Ressourcen werden beim Neuaufbau **nicht** disposed — behebt einen
latenten Bug, der auch Gebäudemodelle nach dem ersten Rebuild leer gerendert hätte.

Exakte Namen, Aliasse und Ausrichtungs-Konventionen: **`docs/3D_MODEL_MANIFEST.md`
§0**.

## v0.32 — „3D-Welt-Asset-Struktur nach Referenzbild (Drop-in-Pipeline)"

Struktur- und Doku-Slice: die komplette 3D-Welt (wie im Referenzbild — Küstenwelt
mit Gebirge, Wald, Fluss, See, Meer, Stadtzentrum, Landmarken) lässt sich künftig
Modell für Modell als `.glb` einlegen, ohne Code-Änderung. Gameplay/Savegames
unberührt.

**Referenzbild analysiert** in Zonen (West Gebirge/Minen/Wasserfälle · Mitte
Stadtzentrum/Wohnviertel/Markt/Build-Zonen · Nord Felder/Fluss/Brücke · Ost Küste/
Leuchtturm/Hafen/Schiff · Süd See/Wald) → daraus eine vollständige Modellstruktur
für Terrain, Gebirge, Wasser, Küste, Gebäude, Landmarken, **Hero-Modelle**, Props,
Fahrzeuge, Marker und Effekte abgeleitet.

**Rekursive Drop-in-Pipeline** — Modelle werden jetzt **rekursiv** aus den
Unterordnern jeder Kategorie erkannt (`models/<kat>/**/*.glb`, Key = Dateiname).
Damit funktioniert die verschachtelte Ordnerstruktur als reines Drop-in.

**Neue Ordnerstruktur** angelegt:
`buildings/{housing,administration,economy,services,resources,energy,leisure,landmarks}`,
`terrain/{tiles,cliffs,mountains,water,coast,biome,hero}`, `roads`, `bridges`,
`props/{nature,city,construction,harbor,farm}`, `vehicles`, `markers`, `effects`.
Neuer Loader `bridgeModel()`; `roadModel/propModel/markerModel/effectModel/
vehicleModel/terrainModel/buildingModel` decken den Rest ab.

**BuildingDef.visual erweitert** (alle optional, honoriert vom 3D-Renderer):
`model3d` (explizite Datei), `model3dLod`, `fallbackModel`, `scale`,
`rotationOffset`, `footprintVisualOffset`, `sizeClass`. Auflösung: `model3d` →
`<id>[_stage<N>]` → `fallbackModel` → prozeduraler Platzhalter.

**Doku `docs/3D_WORLD_ASSETS.md` (neu)** — verbindliche Bauanleitung: Zonen-Analyse,
Modellstandard (Stil, Format, Pivot, 1 Tile = 1 Einheit, Größenrichtwerte),
Poly-/Textur-Budget + LOD/Instancing, komplette Modelllisten mit Dateinamen je
Kategorie inkl. **Hero-Modellen**, Fallback-Regeln, Marker-Arten (3D/Billboard/UI),
Effekte (Partikel vs. `.glb`), „Welt nicht statisch"-Leitlinien + Terrain-Daten-
Konzept, Prompt-Vorlagen und empfohlene Startreihenfolge. `docs/3D_MODELS.md`
verweist darauf.

**Fallbacks** für jeden Typ definiert (Gebäude/Terrain/Wasser/Straße/Brücke/Prop/
Fahrzeug/Marker/Hero) — immer spielbar, klar als Platzhalter erkennbar.

**Master-Manifest `docs/3D_MODEL_MANIFEST.md` (neu)** — die eine, verbindliche
Namensliste **aller** 3D-Modelle mit exakten Dateinamen (Gebäude aus der Config
abgeleitet: ID, Datei, Footprint, Level, Stufen; dazu Terrain/Straßen/Brücken/
Props/Fahrzeuge/Marker/Effekte). Ein Test (`tests/manifest.test.ts`) hält die Liste
synchron: kommt ein Gebäude in `buildings.config.ts` dazu, schlägt der Test fehl,
bis es im Manifest steht.

## v0.31 — „3D-Quality-Pass: Straßen, Verkehr, Marker, Vegetation, aktive Missionen"

Gezielter Politur-Durchgang für die 3D-Stadt — lesbarer, glaubwürdiger, lebendiger.
Kein Gameplay-Umbau, Savegames unberührt, alles additiv mit Platzhalter-Fallbacks.

**Straßen (§3)** — statt „dunkler Platten mit Punkten" jetzt ein echtes, auto-getiltes
Straßennetz: dunkle Fahrbahn + heller **Bordstein/Gehweg** an offenen Kanten +
**Mittelmarkierung** (nur größere Klassen), mit sauberen Kreuzungen, T-Stücken,
Kurven und Enden aus dem Nachbar-Muster. **Straßentyp-Hierarchie** vorbereitet
(residential/main/wide/industrial/boulevard) — künftige Straßen-IDs greifen ohne
Renderer-Änderung. Neuer Ordner `models/roads/` + `roadModel()`-Fallback.

**Verkehr (§4)** — Autos fahren nicht mehr kreuz und quer: **Momentum** (fahren
geradeaus durch, biegen nur an Kreuzungen ab, kein U-Turn außer an Sackgassen),
**Rechts-Spur-Versatz**, geformte Auto-Meshes (Karosserie + Kabine) und ein
**moderater Cap** (glaubwürdig statt massenhaft). Verschwinden sauber, wenn ihre
Straße abgerissen wird.

**Marker (§5)** — die diffusen transparenten Kästen sind weg. Jetzt **ein
farbcodierter Prioritäts-Pin pro Gebäude** (Aktiv-Mission > Baustelle > Problem >
Upgrade bereit), als kamera-zugewandtes Billboard mit Symbol, Umriss und Puls
(nur Missionsziele). Nie gestapelt.

**Vegetation-Culling (§7)** — Bäume/Büsche stehen **nie mehr auf Gebäuden oder
Straßen**: eigene, aus der Belegung gecullte Vegetations-Ebene (Instancing, gecappt),
mit Größen-/Rotationsvariation; nach Abriss wächst Natur auf freien Feldern nach.
Dazu leichte Gras-Farbvariation gegen die flache Sheet-Optik.

**Aktive Stadtarbeit in 3D (§6)** — „Essen verteilen" nutzt jetzt die Welt: bei
Missionsstart **fokussiert die Kamera** das erste Ziel, ein **Lieferwagen** startet
an Farm/Markt/Lager und **fährt per Wegfindung (BFS über das Straßennetz) zu den
Zielhäusern**, Ziele tragen deutliche Aktiv-Marker. Abschluss weiter per Klick.

**Platzierung & Auswahl (§10/§11)** — schönerer Bau-Ghost (klare grüne/rote
Footprint-Fläche + leuchtender Umriss + Volumen-Andeutung statt weißem Kasten);
kräftigerer, leicht leuchtender Auswahl-Ring.

**Pipeline (§14)** — neue Modellordner `models/{roads,props,markers,effects}/` mit
`roadModel()`/`propModel()`/`markerModel()`/`effectModel()` — Drop-in wie gehabt,
Fallback prozedural. Umfassende Welt-Asset-Doku folgt in v0.32.

## v0.30.1 — „3D-Fixes: sichtbare Straßen, Pan-Richtung, 2D für Prototyp"

- **Straßen waren im 3D-Modus unsichtbar**, weil sie unter den erhöhten
  Terrain-Kacheln lagen. Sie sitzen jetzt bündig **auf** dem Boden (mit feiner
  Mittelmarkierung) und bilden ein klar lesbares Straßennetz.
- **Schwenken vertikal invertiert:** Ziehen nach oben/unten war getauscht (links/
  rechts war korrekt). „Karte greifen und schieben" funktioniert jetzt in beide
  Richtungen konsistent.
- **2D/Isometrie im Prototyp wieder wählbar:** In den Einstellungen gibt es einen
  Kartenansicht-Schalter (3D / Isometrisch / 2D-Raster). **3D bleibt Standard**
  (und langfristig der einzige Modus); 2D/Iso sind fürs Testen und zum leichteren
  Unterscheiden von Gebäudetypen gedacht. Rein optisch — Spielstand identisch.
  (Der doppelte Debug-Schalter im Debug-Panel entfällt.)

## v0.30 — „3D-Kamera & Navigation: hochwertige Steuerung, nur noch 3D"

Kompletter Umbau der 3D-Navigation zu einer Steuerung, die sich wie in modernen
Aufbauspielen anfühlt — und die Karte läuft für Spieler jetzt **ausschließlich in
3D**. Gameplay, Wirtschaft, Gebäude, Missionen und Spielstände sind unverändert.

**Probleme der alten Kamera**
- Steuerung inline & verstreut im Renderer, kein zentraler Controller.
- Linksklick-Ziehen pannte immer (auch heikel im Baumodus), Rotation lag auf
  Shift, Rechtsklick-Ziehen pannte (kollidierte mit „Abbrechen").
- Kein Smoothing/Inertia, keine Pan-Weltgrenzen (man flog aus der Welt), nur grobe
  Zoom/Pitch-Limits. Keine Tastatur, keine Presets, keine Touch-Gesten, kein
  Cursor-Feedback, keine Einstellungen.

**Neue Kamera-Architektur**
- Zentraler, three-freier **`CameraController3D`** (Zielpunkt + Distanz/Yaw/Pitch,
  Clamping, Smoothing, Inertia, Presets, Fokus) — **unit-getestet** (9 Tests).
- **`CameraInputController`** bündelt Maus/Rad/Tastatur/Touch, gated den Baumodus
  und gibt Cursor-Feedback. **`cameraSettings`** speichert die Feineinstellungen.

**Maussteuerung**
- Linksklick-Ziehen = **schwenken** ("Karte greifen"). STRG+Links oder
  **Mittelklick** = **drehen + neigen**. Mausrad = **Zoom zum Cursor**.
- Rechtsklick bleibt **Abbrechen** und pannt nie. Klick (ohne Ziehen) wählt aus.

**Tastatur:** WASD/Pfeile bewegen, Q/E drehen, Bild↑/↓ neigen, +/- zoomen,
Leertaste = Zentrum, F = Auswahl fokussieren, Shift = schneller, ESC = abbrechen.

**Touch (vorbereitet):** 1 Finger schwenken, Pinch zoomen, 2-Finger-Twist drehen,
2 Finger vertikal neigen, Tippen auswählen.

**Grenzen & Bediengefühl**
- Zoom 10–200, Pitch 28°–84° (nie überkopf), Schwenk an die endliche Welt
  geklemmt — man kann nicht mehr aus der Karte fliegen.
- Weiche Übergänge + leichte Pan-Inertia; direkte Eingabe bleibt erhalten.
  Abschaltbar über „Weiche Kamera".

**Nur noch ein Kartenmodus — 3D als Standard**
- Kein sichtbarer 2D/Iso/3D-Umschalter mehr. 3D ist der einzige Spielermodus;
  `flat2d`/`isometric2d` überleben nur als **Debug-Fallback** (Einstellungen →
  Debug → Render-Engine). Kein Savegame-Risiko (Einstellung in localStorage).

**Kamera-Presets statt Moduswechsel** (unten mittig auf der Karte)
- **Stadtansicht** (schräg), **Bauansicht** (fast top-down für Straßen/
  Platzierung), **Übersicht** (weit raus), **Zentrum** (aufs Rathaus).
- Im Baumodus zusätzlich ein prominenter **„Bauansicht"**-Knopf. Dazu **Kompass**
  (Ausrichtung zurücksetzen) und **Zoom +/−**.

**Einstellungen (gespeichert):** Bewegungs-/Zoom-/Drehtempo, Drehen/Zoom umkehren,
weiche Kamera, Randscrollen, Reset — ersetzen den alten Kartenmodus-Schalter.

**Konflikte vermieden:** Kamera-Eingaben hängen nur am Canvas → UI-Klicks/-Scrolls
bewegen die Kamera nicht. Baumodus: Linksklick platziert/malt, Kamera bewegt sich
per Mittelklick/Tastatur; Rotation nur bewusst (STRG/Mittelklick).

**Marker in 3D:** Stadtarbeit-Ziele sind **Billboard-Sprites** — immer zur Kamera
gerichtet, bleiben bei Drehung/Neigung korrekt und lesbar.

**Technik & Doku**
- 2D/Iso-Renderer unangetastet und weiter lauffähig (Debug). `IMapRenderer` um
  optionale Kamera-Methoden erweitert; MapView swappt die Engine weiterhin sauber.
- Neu: **`docs/3D_CAMERA_CONTROLS.md`** (Maus/Tastatur/Touch/Presets/Einstellungen/
  Konfliktregeln/Struktur/Grenzen). `tsc -b --force`, ESLint, **110 Tests** und
  `vite build` grün; 3D-Standard + Stadt-/Bauansicht per Screenshot verifiziert.

## v0.29 — „Echte 3D-Karte (three.js) mit Live-Effekten"

Die Karte kann jetzt **wirklich in 3D** gerendert werden — ein neuer, echter
three.js-Renderer neben 2D-Raster und Isometrie. Einstellungen → Kartenansicht →
**3D**. Spiellogik, Platzierung, Ressourcen, Bedürfnisse, Stadtarbeit, Sektoren
und Spielstände bleiben unangetastet; 3D ist reine Darstellung (in localStorage,
nicht im Save).

**Neuer 3D-Rendermodus (`true3d`)**
- Vollständige three.js-Szene: perspektivische Kamera, Sonnenlicht + weiche
  **Schatten**, Hemisphären-Licht, Himmel/Nebel.
- **Kamera:** Ziehen/Rechtsklick = schwenken, Mausrad = zoomen, Umschalt+Ziehen =
  drehen/neigen. „Karte zentrieren" und Fokus-auf-Auswahl funktionieren wie in 2D.
- **Terrain** als instanziierte Kacheln mit leichtem Relief (Berge höher, Wasser
  tiefer, Wald mit Low-Poly-Bäumen); gesperrte Sektoren abgedunkelt.
- **Gebäude** als echte 3D-Körper: Modell aus `.glb`, falls vorhanden, sonst
  prozeduraler Block (Wände + Sattel-/Flachdach, Kanten, Kategorie-Farbe mit
  leichter Variation). **Ausbaustufen** wachsen in Höhe/Größe.
- **Auswahl** per Raycast-Klick + Boden-Ring; **Bauen** per Boden-Raycast mit
  grün/rotem Ghost (nutzt dieselbe Platzierungs-Prüfung wie 2D).

**Live-Effekte in 3D**
- **Fahrender Straßenverkehr:** Autos fahren automatisch über zusammenhängende
  Straßen (gedeckelt, prozedural; echte Fahrzeug-Modelle über `vehicles/*.glb`).
- **Bauarbeiten:** Gebäude im Bau transparent + gelber Gerüst-Käfig.
- **Schornsteinrauch** über aktiven Produktions-/Energiegebäuden, **Windrad-Rotor**
  dreht sich (auch über einen `rotor`-Node in echten Modellen).

**Drop-in-3D-Assets (keine Migration, kein Pflicht-Asset)**
- Neue Registry-Loader `buildingModel(id, stage)`, `terrainModel(name)`,
  `vehicleModel(name)` binden jede `.glb` unter `src/assets/models/{buildings,
  terrain,vehicles}/` automatisch ein. Fehlt ein Modell → Platzhalter, nie ein
  Absturz.
- **Ausbaustufen** brauchen standardmäßig 0 Extra-Dateien (Auto-Skalierung);
  optionale Varianten je Stufe über `<id>_stage<N>.glb`.
- **Benannte Nodes** `rotor`/`chimney` treiben Live-Effekte in echten Modellen.

**Doku `docs/3D_MODELS.md` komplett neu**
- Genaue **Ordnerstruktur** (wo welche Datei hinkommt), **Modell-Aufbau** (Format,
  Pivot, Maßstab 1 Tile = 1 Einheit, Achsen, Poly-/Material-Vorgaben), Umgang mit
  **Versionen/Upgrades**, **Live-Ansichten** (Bau/Verkehr) und die „wenige
  Dateien"-Strategie (~40 Dateien für den vollen Look, UI teilt sich Assets).
- Vollständige **Prompt-Liste** für Text-zu-3D-Tools (Gebäude, Terrain, Fahrzeuge)
  inkl. Stil-Prefix und Checkliste vor dem Export.

**Technik**
- Neuer Renderer `src/renderer/three/ThreeMapRenderer.ts`, gemeinsames Interface
  `IMapRenderer`; `MapView` wechselt die Engine (Pixi ↔ three.js) automatisch beim
  Umschalten zwischen 2D/Iso und 3D. `RenderMode` um `true3d` erweitert.
- Abhängigkeit `three` (+ Typen) ergänzt. `tsc -b --force`, ESLint, 101 Tests und
  `vite build` grün; 3D-Ansicht per Screenshot einer ausgebauten Stadt verifiziert.

## v0.28 — „Iso-Ausbau: Dächer, Bäume, Straßen, Schornsteinrauch + 3D-Modell-Doku"

Grafischer Ausbau der isometrischen Karte und Vorbereitung echter 3D-Modelle.

**Karte hübscher (§ „grafisch ansprechender")**
- Gebäude bekommen **Satteldächer** in Kategorie-Tönung (rot=Wohnen, weiß=Dienste,
  gold=Wirtschaft, grau=Produktion, …), **Fensterreihen** an den besonnten Wänden
  und eine **leichte Farb-Variation pro Gebäude**, damit eine Straße gleicher
  Häuser nicht monoton wirkt. Die klobigen 2-Buchstaben-Labels sind im Iso-Modus
  weg — die Stadt liest sich über Form/Farbe/Dach.
- **Ausbaustufen sichtbar (§ verschiedene Stufen):** höhere `upgradeLevel`
  wachsen in Höhe **und** bekommen zusätzliche Dach-Etagen — Haus → Doppelhaus →
  … liest sich als echtes Wachstum.
- **Dekorationen** sind jetzt echte kleine Props (Baum mit Krone, Blumenbeet,
  Brunnen, Bank) statt flacher beschrifteter Kacheln.
- **Straßen** haben Bordstein-Rand + helleren Belag + Mittelpunkt → lesen sich als
  Straßen, nicht als dunkle Tiles.

**Erste Live-Effekte (§ Live-Effekte)**
- **Schornsteinrauch** steigt über aktiven Produktions-/Energiegebäuden auf —
  gepoolte, gecappte Partikel im neuen `liveLayer`, nur im Iso-Modus, performant
  auch bei 250+ Gebäuden. Zusammen mit Bau-/Upgrade-Balken und Aktivitäts-Ringen
  wirkt die Stadt lebendig.
- Struktur für **fahrende Fahrzeuge/Routen** (Liefermissionen, Einsätze) ist über
  `liveLayer` + `vehicles/`-Ordner + `vehicleImage()` vorbereitet (nächster Slice).

**Echte 3D-Modelle — neue Doku `docs/3D_MODELS.md`**
- **Wo:** Iso-Sprites nach `src/assets/buildings/iso/<id>_iso.png` (sofort nutzbar),
  echte Modelle nach `src/assets/models/{buildings,terrain,vehicles}/<id>.glb`.
- **Wie:** Stufe A = 3D-Modell einmalig als transparentes Iso-PNG rendern (nutzt
  die bestehende Drop-in-Pipeline, kein Browser-3D nötig); Stufe B = späterer
  `true3d`-RenderMode mit three.js/Babylon lädt `.glb` (Projektion/Anker sind schon
  vorbereitet). Verknüpfung je Gebäude über `BuildingDef.visual`
  (`isoSprite`/`model3dRef`/`heightClass`/`anchor`), mit Fallback-Kette ohne Crash.
- **Prompts:** vollständige Modell-/Sprite-Liste (alle Gebäude) plus Iso-Kamera-/
  Licht-/Format-Vorgaben und Prompt-Präfix für Text-zu-3D-Tools (Meshy/Rodin/Tripo/…)
  bzw. gerenderte Iso-Frames.

**Verifikation:** tsc/eslint/vitest (101) grün, vite build ok, Iso-Screenshot einer
ausgebauten 267-Gebäude-Stadt geprüft (Dächer, Bäume, Straßen, Depth-Sorting).

## v0.27 — „Isometrie Slice 1: RenderMode, Iso-Projektion, extrudierte Gebäude"

Erster sauberer Schritt vom 2D-Raster zur isometrischen 2.5D-Karte (Iso-Mockup als
Zielrichtung). Bewusst **kein** Rewrite: Spiellogik, Gebäudeplatzierung, Ressourcen,
Bedürfnisse, Stadtarbeit, Sektoren und Savegames bleiben unverändert; nur die
Kartendarstellung ist erweitert. `flat2d` bleibt vollwertiger Fallback.

**Mockup-Analyse — was für MVP2 realistisch war:** isometrische Projektion,
Diamant-Terrain, extrudierte Gebäude-Platzhalter mit Höhe/Tiefe/Schattierung,
Depth-Sorting, Kamera/Zoom/Pan, Iso-Ghost/Auswahl/Overlays, Asset-Pipeline für
Iso-Sprites. **Später:** echte Iso-/3D-Gebäudesprites, Fluss/Ufer/Brücke, Gebirge-
Props, Fahrzeuge/Routen, feinere Straßen-Autotiles, Iso-Culling.

**RenderMode-System (§3)**
- `RenderMode = 'flat2d' | 'isometric2d'` in `useUiStore`, in **localStorage**
  persistiert (`cmb.renderMode`) — nicht im Savegame, also kein Speicherstand-Risiko.
- Umschalter in **Einstellungen → „Kartenansicht"** (2D-Raster / Isometrisch).
- `MapView` schiebt den Modus in den Renderer; `MapRenderer.setRenderMode` baut
  Terrain neu, erzwingt einen Gebäude-Redraw und zentriert die Kamera.

**Iso-Projektion (§4)** — neues `src/renderer/projection.ts` als einzige Quelle der
Wahrheit: `tileCenterWorld`, `footprintCenterWorld`, `isoTileDiamond`,
`isoFootprintDiamond`, `pickTile` (inverse), `isoDepth`. 2:1-Diamanten
(`isoW=64/isoH=32`, konfigurierbar). Kamera/Zoom/Pan laufen über die Container-
Transform → modus-unabhängig; Klick/Platzierung über `pickTile`. Logik bleibt in
Tile-Koordinaten.

**Depth Sorting (§5)** — `buildingLayer.sortableChildren`, `zIndex = (x+y)*8+(w+h)`:
hinten→vorne, große/vordere Gebäude überdecken korrekt. Terrain immer darunter,
Marker/Overlays darüber, UI (React) ganz oben. Flat-Modus unverändert.

**Gebäude im Iso-Modus (§7/§12/§17)** — Fallback-Kette: Straße = flacher Asphalt-
Diamant → `isoSprite` (async geladen, unten-mittig verankert, auf Footprint
skaliert) → **extrudierter Diamant-Block** (Deckfläche + zwei schattierte Wände,
Höhe aus `visual.heightClass`/Kategorie/Upgrade, 2-Buchstaben-Code + Upgrade-Pips).
Fehlt ein Asset, bleibt der Platzhalter — nie ein Crash.

**Terrain/Marker/Overlays iso** — Diamant-Terrain mit Relief-Hinweisen (Wald/
Gebirge/Wasser), gesperrte Sektoren als getönter Diamant + „+"; Coverage-Overlay,
Effekt-Radien, Ghost, Auswahl, Aktivitäts-Zielmarker und Bau-Vorschau alle in
Iso-Projektion an Weltkoordinaten gekoppelt.

**Asset-Pipeline (§7/§8/§11)** — `registry.ts` erkennt jetzt
`src/assets/buildings/iso/<id>_iso.png` (`buildingIsoImage`) und
`src/assets/terrain/<name>_iso.png` (`terrainIsoImage`). Neue Ordner:
`buildings/iso`, `terrain`, `props`, `models/{buildings,terrain,vehicles}`.

**3D-Vorbereitung (§9/§26)** — `BuildingDef.visual` trägt bereits
`cardArt/sheetArt/mapSprite2d/isoPreview/model3dRef/heightClass` (v0.26) für eine
konsistente Asset-Familie; `models/`-Ordner (bevorzugt `.glb`) angelegt. Die Iso-
Sprites sind Übergang **oder** finaler 2.5D-Stil **oder** aus 3D gerenderte Frames.

**Dokumentation (§25)** — neu: `docs/ISO_RENDERING.md` (Modi, Projektion, Layer,
Depth Sorting, Kamera, Fallbacks, Marker-Anker, 3D-Ausblick) und `docs/ISO_ASSETS.md`
(Ordner, Dateinamen, Größen, Stil-Prefix, Prompts für alle Gebäude/Terrain/Props/
Fahrzeuge/3D-Modelle).

**Akzeptanz (§24) erfüllt:** RenderMode flat2d/isometric2d ✓, flat2d unverändert ✓,
iso aktivierbar ✓, Tiles iso projiziert ✓, Gebäude korrekt positioniert ✓, Straßen
sichtbar ✓, Depth Sorting ✓, Kamera/Zoom/Pan ✓, `isoSprite`-Pipeline ✓, Fallback ✓,
Doku ✓, UI unverändert über der Karte ✓, keine Savegames betroffen ✓.

**Nächste Schritte:** reale Iso-Gebäudesprites ablegen (Slice 2); Iso-Terrain-
Sprites + Fluss/Ufer/Brücke + Gebirge-Props (Slice 3); Fahrzeuge/Routen (Slice 5).

## v0.26 — „UI-/UX-Überarbeitung: mockup-getreuer, größer, grafischer"

Gezielte Überarbeitung der Spieloberfläche anhand der aktuellen Screenshots, mit
dem Mockup als verbindlicher Zielreferenz. Karte bleibt 2D; bestehende Systeme,
Asset-Pipeline und die Trennung Logik/UI/Registry wurden weiterverwendet — keine
Parallelsysteme.

**Erkannte Probleme (aus den Screenshots)**
- Baushop: Gebäudebild und Werte/Badges wirkten überlappt, Karten klein; bei
  wenigen Gebäuden ein breites, halb-leeres schwarzes Bottom-Sheet.
- Wichtige Funktionen (Bürgermeister, Handel, Stadtarbeit, Wirtschaft) im
  Hamburger-Menü versteckt; „Karte" unnötig prominent als erster Quick-Button.
- Overlay-Button konnte das UI nicht ausblenden.
- Panels (Stadt-Status, Bürgeranliegen, Stadtarbeit) klein, textlastig, grafikarm;
  „Details ansehen" öffnete kein großes rechtes Sheet.

**Baushop komplett neu (§3)**
- Zonen-Karten: fester **Bildbereich** oben (großes Thumbnail, Footprint- und
  „Neu"/„Großprojekt"-Badges nur in den Ecken), darunter getrennt **Titel**,
  **Kernwerte** (Kosten · Bauzeit · Kapazität/Produktion · Unterhalt), **Status**
  (Freigeschaltet / Ab Level X / gebaut X/Y / Großprojekt) und ein eigener
  **Bauen-Button**. Keine Text-/Bild-Überlappung mehr, in keiner Kategorie.
- Größere Karten, zentriertes Raster; bei wenigen Gebäuden füllen dezente
  „Weitere Gebäude folgen"-Kacheln die Reihe — kein leeres schwarzes Loch mehr.
- Bautabs zeigen jetzt **Kategorie-Grafiken** (`CategoryArt`) statt reiner Icons.

**Quick-Actions & Menü neu priorisiert (§6/§7/§20)**
- Immer sichtbar unten rechts: **Bauen**, **Bürgermeister**, **Stadtarbeit**
  (ab L4), **Handel** (mit Handelskontor), **Overlay**, **Statistiken**,
  **UI ausblenden**, **Menü** — grafische Buttons (Drop-in-PNGs möglich).
- „Karte zentrieren" ist nicht mehr prominent, sondern liegt (mit Einstellungen)
  im Hamburger-Menü, das jetzt nur noch Sekundäres enthält.

**UI-ausblenden-Toggle mit Restore (§8)**
- „UI ausblenden" blendet das gesamte Overlay aus; die 2D-Karte bleibt voll
  spielbar. Ein deutlicher **„UI einblenden"**-Button bleibt unten rechts sichtbar.

**Rechtes Side-Sheet-System (§5)**
- Große Detailansichten docken rechts als vollhohe Sheets an (Stadt-Status-Details,
  Stadtarbeit, Handel, Bürgermeister, Wirtschaft). „Details ansehen" im linken
  Status-Panel öffnet dieses große rechte Sheet; kompakte Übersichten bleiben
  links. Solange ein rechtes Sheet offen ist, tritt das kompakte Bürgeranliegen-
  Widget zur Seite.

**Größer & grafischer (§16-§19)**
- Bürgeranliegen: größerer Porträt-Avatar, Belohnungen als Grafik-Chips
  (`RewardArt`: Geld/Gold/XP).
- Stadtarbeit-Board: große Aktivitäts-Illustration (`ActivityArt`) je Karte plus
  kleines Absender-Porträt; Featured-Charakter vergrößert.
- Stadt-Status: größere Icons/Balken. HUD- und Panelabstände erhöht.

**Asset-Pipeline auf UI ausgeweitet (§10-§13)**
- `src/assets/registry.ts` erkennt jetzt zusätzlich Drop-in-Bilder aus
  `ui/buttons`, `ui/categories`, `ui/markers`, `ui/activities`, `ui/events`,
  `ui/rewards`, `vehicles`, `overlays` (alle mit Fallback, nie ein Crash).
- Neue Art-Komponenten `CategoryArt`, `ActivityArt`, `RewardArt`, `MarkerArt`,
  `EventArt` (Bild wenn vorhanden, sonst Vektor/Glyph-Fallback).
- **`docs/UI_ASSETS.md`**: vollständige Liste aller UI-Bildgruppen mit exaktem
  Dateinamen, Zielordner, Größe (512×512, transparent), Stilhinweis, Verwendungs-
  ort und je einem Generierungs-Prompt.

**3D-/Isometrie-Konsistenz vorbereitet (§14)**
- `BuildingDef.visual` um `cardArt`, `sheetArt`, `mapSprite2d`, `isoPreview`,
  `model3dRef` erweitert, damit Baushop-Vorschau, Detail-Sheet, späteres
  Kartensprite und die spätere Iso-/3D-Variante dieselbe Asset-Familie teilen.
  Optional, vom 2D-Renderer ignoriert, ohne Datenmigration (`passthrough`).
  Dokumentiert in `docs/CONCEPT.md` §21 und `docs/UI_ASSETS.md`.

**Noch offen / Nächste Schritte**
- Kartengebäude, Karten-Marker und Fahrzeug-/Route-Animation (§4) sind noch nicht
  asset-gebunden — Ordner, Registry und Doku dafür stehen bereits bereit.
- Optionale Button-/Kategorie-/Aktivitäts-PNGs sind noch nicht beigelegt; bis
  dahin rendern die eingebauten Fallbacks.

## v0.25 — „Stadtarbeit wird aktiv: mehrere Aufträge, keine starren Cooldowns, Bronze/Silber/Gold"

Erste Ausbaustufe der Stadtarbeit-Überarbeitung (MVP2-Spec §2/§6/§7/§10/§12/§16).
Ziel: weg von „Aufgabe klicken → Sofortbelohnung → Cooldown", hin zu einem echten
Auftragsbrett, das aus der realen Stadt gespeist wird und aktives Spielen belohnt.
Das bestehende generische Aktivitäts-System wurde **erweitert** (keine Parallel-
Logik), Sim/UI/Rendering bleiben getrennt, die Karte bleibt 2D.

**Neu / geändert**
- **Mehrere Aufträge gleichzeitig (§16.1):** Neues `getActivityBoard()` liefert das
  komplette Missionsbrett — jede freigeschaltete Aktivität mit Belohnungsvorschau
  und einer **echten Verfügbarkeitsprüfung** aus der Stadt heraus (Freischalt-
  Level, benötigtes Quellgebäude, genügend Kartenziele, freier Auftragsslot).
- **Keine starren Cooldowns mehr (§2):** Lieferungen und Inspektionen haben **keinen**
  festen Cooldown — eine Lieferung ist verfügbar, solange Lebensmittelquelle und
  Wohngebiete existieren, und kann sofort erneut gestartet werden. Nur Bürger-
  meister-Entscheidungen behalten einen kurzen Cooldown, damit eine einzelne
  Politik nicht spam-gefarmt wird.
- **Qualitätsstufen Bronze/Silber/Gold (§6):** Lieferungen werden nach Tempo gegen
  ihr Zeitlimit bewertet (Gold ≤ 60 % der Zeit, Silber innerhalb, Bronze danach —
  ein verpasstes Limit lässt den Auftrag nie scheitern, senkt nur die Wertung).
  Die Belohnung skaliert mit der Wertung (Bronze ×0,6 / Silber ×1,0 / Gold ×1,35),
  zusätzlich zur Level-Belohnungsstufe. Das Abschluss-Popup zeigt die Medaille.
- **Aufträge aus der echten Stadt (§10):** `requiresAnyBuilding` an Aktivitäten und
  Entscheidungs-Optionen — z. B. „Essen verteilen" braucht Hof/Markt/Supermarkt,
  „Baumaterial liefern" ein Sägewerk/Steinbruch/Lager. Fehlt die Quelle, zeigt die
  Karte klar den Grund („Passendes Gebäude fehlt") statt eines toten Buttons.
- **Reichere Entscheidungen (§12):** Optionen tragen jetzt **mehrere gleichzeitige
  Effekte** (`buffs[]`) mit echten Trade-offs. Die drei Entscheidungen bieten
  3–4 Optionen (voll/maßvoll fördern, Liefervertrag übers Kontor, ablehnen; großes/
  kleines/gesponsertes Fest; volle/teilweise/keine Überstunden). Gebäude-gebundene
  Optionen sind ohne das nötige Gebäude sichtbar, aber gesperrt.
- **Kategorien & Schwierigkeit:** Jede Aktivität hat `category` (Versorgung/Inspektion/
  Politik/Event/…) und `difficulty` (Leicht/Mittel/Schwer). Die Auftragskarten zeigen
  Kategorie-, Schwierigkeits- und Zeitlimit-Badges.
- **Kein AFK-Verdienst:** Unverändert laufen alle Belohnungen ausschließlich über
  Commands beim aktiven Abschluss — offline entsteht kein Einkommen.

**UI**
- Auftragsbrett (`ActivityPanel`) und das Featured-Widget (`CityWorkPanel`) lesen
  jetzt das Board: Badges, Belohnungsvorschau, Restzeit-Timer bei laufender Mission,
  klare Blockier-Gründe. Abschluss-Popup mit Bronze/Silber/Gold-Medaille.

**Nächste Phasen (bewusst noch offen, spec-vermerkt)**
- §4/§16.2: sichtbares Lieferfahrzeug/animierte Route auf der Karte (renderer-lastig)
  — kommt als eigener Schritt; aktuell werden Ziele weiter als pulsierende Marker
  angeklickt.
- Inspektions-Ursachen-Minispiel (Problemursache wählen) als Folgeausbau.

## v0.24 — „Grafik-Asset-Pipeline: echte Bilder per Drop-in"

Damit das UI **exakt wie das Mockup** werden kann, braucht es echte gerenderte
Bild-Assets (gemalte/isometrische Grafiken). Diese kann die Umgebung nicht selbst
erzeugen — deshalb wurde stattdessen die **Einbaustelle** dafür gebaut: eine
Drop-in-Pipeline. Sobald Bilder abgelegt werden, zeigt die UI sie automatisch;
fehlt ein Bild, rendert weiter die eingebaute SVG-Grafik.

**Neu**
- `src/assets/registry.ts` — erkennt via `import.meta.glob` automatisch alle
  Bilder in `src/assets/resources|buildings|portraits/`, gekeyt nach Dateiname.
  Kein Wiring pro Datei, kein manuelles Manifest.
- `ResourceArt`, `BuildingArt`, `CitizenPortrait` rendern jetzt **Bild zuerst**
  (wenn vorhanden), sonst den SVG-Platzhalter. Bürgerporträts rotieren über
  `citizen_1..N` per Seed; Rollen (Bürgermeister/Händler/Feuerwehr/Bauamt) nutzen
  eigene Dateien.
- **`docs/ASSETS.md`** — vollständige Asset-Liste (alle Ressourcen, alle 34
  Gebäude, Bürger/Berater) mit exakten Dateinamen, Größen, technischen Vorgaben
  und je einem **fertigen Bild-Generierungs-Prompt** plus einheitlichem Stil-
  Prefix, sodass ein KI-Bildgenerator konsistente Grafiken im Mockup-Look liefert.

**Wichtig / ehrlich**
- Es liegen noch **keine** finalen Bilder bei — bis welche abgelegt werden, sieht
  das Spiel aus wie v0.23 (SVG-Cartoons). Die Pipeline ist getestet: ein Testbild
  in `src/assets/resources/money.png` ersetzte sofort und ohne Codeänderung die
  Geld-Grafik im HUD.
- Noch **nicht** an die Pipeline gebunden (bewusst, als möglicher Folgeschritt):
  die Kartengebäude im 2D-Renderer, Karten-Marker/Service-Symbole und große
  Aktivitäts-/Event-Bildkarten.

## v0.23 — „Cartoon-Artwork: illustrierte UI statt SVG-Icons"

Umsetzung der ausdrücklichen Vorgabe „generierte/cartoonartige Bilder statt
einfacher SVG-Icons". Die sichtbaren UI-Flächen zeigen jetzt kleine illustrierte
Spielgrafiken — Ressourcenobjekte, Gebäudebilder und Bürgerporträts — statt
Line-Icons. Alles ist cel-schattiertes SVG (keine externen Assets), aber bewusst
bildhaft gebaut (Dächer, Fenster, Gesichter, Kleidung, Schattierung) und sitzt in
austauschbaren Komponenten, sodass später echte Sprites an denselben Aufrufstellen
eingesetzt werden können. Karte bleibt 2D-Prototyp; Spiellogik unverändert.

**Neues Artwork-System (`src/components/art/`)**
- `ResourceArt` — bildhafte Ressourcen: Münzstapel (Geld), Goldbarren (Gold),
  Holzstapel mit Jahresringen (Holz), facettierter Felsblock (Stein), Obst-/
  Brotkiste (Nahrung), glänzender Wassertropfen (Wasser), Bürgergruppe
  (Einwohner), freundliches Medaillen-Emblem (Zufriedenheit).
- `BuildingArt` — pro Gebäude-ID eine eigene Cartoon-Illustration auf einem
  begrünten Grundstück: Häuschen mit Satteldach & Schornstein, Reihenhaus,
  Apartmentblock, Wohnturm, Rathaus/Verwaltung mit Säulen & Fahne, Farm mit Silo
  & Feld, Sägewerk mit Sägeblatt, Steinbruch, Brunnen, Wasserturm, Lagerhalle,
  Läden mit Markise & Emblem (Markt/Bäckerei/Büro/Handelskontor), Notdienste mit
  Wappen (Feuerwehr/Polizei/Krankenhaus), Kraftwerk mit Kühltürmen, Windrad,
  Park, Baum, Blumenbeet, Brunnen, Bank, Straße. Fallback pro Kategorie.
- `CitizenPortrait` / `AdvisorPortrait` — Cartoon-Figuren mit Gesicht, Frisur,
  Kleidung und Rollen-Kopfbedeckung (Bauhelm, Feuerwehrhelm, Händlerkappe,
  Bürgermeister-Krone) auf rollengefärbtem Hintergrund. Deterministisch aus einem
  Seed: gleiches Anliegen → gleiche Person, verschiedene Anliegen → sichtbar
  unterschiedliche Bürger (Haut-, Haar-, Kleidungsvarianten).

**Wo das Artwork eingebunden ist**
- HUD-Ressourcenkarten (`GameHud`) zeigen `ResourceArt` statt Lucide-Icons.
- Baumenü-Karten (`BuildMenu`) und Gebäude-Info-Sheet (`FloatingBuildingSheet`,
  neuer Bild-Hero oben links) zeigen `BuildingArt`.
- Bürgeranliegen (`CitizenRequestsPanel`), Stadtarbeit (`CityWorkPanel`),
  Aktivitätsboard (`ActivityPanel`) und Entscheidungs-Popup (`DecisionModal`)
  zeigen Porträts statt Avatar-Icons.
- **Level-Up-Popup** (`EventModal`) zeigt jetzt für jede neu freigeschaltete
  Gebäudeart eine Artwork-Karte plus die Levelbelohnung (Geld/Gold mit
  Ressourcen-Artwork) und einen „Zum Baumenü"-Button — statt einer reinen
  Textzeile (Mockup §8).

**Was noch Platzhalter/2D bleibt**
- Alle Grafiken sind stilisierte SVG-Platzhalter im einheitlichen Cartoon-Stil,
  keine gerenderten Raster-Assets — die Komponenten sind aber so gebaut, dass
  finale Sprites 1:1 an denselben Stellen eingesetzt werden können.
- Die Karte selbst bleibt der 2D-Prototyp; nur die UI-Grafiken wurden ersetzt.

**Verifikation:** `tsc -b --force`, `eslint`, `vite build` und `vitest run`
(97 Tests) grün; Playwright-Smoke bestätigt fehlerfreies Rendern von HUD,
Baumenü und Wohn-Thumbnails.

## v0.22 — „UI-Überarbeitung: hochwertiges City-Builder-Interface nach Mockup"

Komplette Neugestaltung von HUD, Panels, Baumenü, Gebäude-Sheet und Overlays
entlang des vorgegebenen UI-Mockups. Die 2D-Prototyp-Karte bleibt unverändert —
nur die Oberfläche wurde überarbeitet. Es wurde bewusst kein paralleles System
gebaut: alle Panels lesen die vorhandenen echten Spielwerte über den bestehenden
Controller/Store, das Rendering bleibt sauber von der Simulation getrennt.

**Wie wurde das UI dem Mockup angepasst?**
Aus der alten Top-Bar-/Bottom-Bar-Struktur wurde ein permanentes HUD-Rahmen­
layout wie im Mockup: oben die Ressourcen-HUD-Leiste, links oben der Stadtstatus,
links unten die Stadtarbeiten, rechts die Bürgeranliegen, unten das Baumenü,
unten rechts die Schnellaktionen, mittig das Gebäude-Info-Sheet und ein
Versorgungs-Banner oben.

**Neue Komponenten**
- `GameHud` + `ResourceCard` — obere Ressourcenleiste mit rundem Level-Badge,
  XP-Balken und je einer Karte pro Ressource (Icon-Chip · großer Wert ·
  Zuwachs/min). Menü-Button rechts (`MenuPanel`).
- `CityStatusPanel` — permanentes Stadtstatus-Widget (Zufriedenheit, Wasser,
  Essen, Arbeit, Umwelt, Sicherheit) mit Icon, Balken und konkreter
  Statuszeile; „Details ansehen" öffnet die volle Kontrollraum-Ansicht
  (`CityStatusDetail`, vormals das ausführliche Panel).
- `CityWorkPanel` — permanentes Stadtarbeiten-Widget mit Absender-Avatar,
  Timer, Beschreibung, Fortschrittsbalken und Belohnung; „Alle Aufträge"
  öffnet das vollständige Board (`ActivityPanel`).
- `CitizenRequestsPanel` — Bürgeranliegen rechts als lebendige Karten mit
  Porträt, Sprechblase, Aufgabe, Fortschrittsbalken und Belohnung
  (ersetzt/erweitert das frühere `QuestPanel`).
- `QuickActionBar` — Schnellaktionen unten rechts: Bauen, Karte (Kamera
  zentrieren), Overlay, Statistiken, Einstellungen — erweiterbar angelegt.
- `ServiceOverlayBanner` — Versorgungs-Banner oben mittig („Wasser-Versorgung —
  92 % abgedeckt"), gespeist aus den Coverage-Zählwerten der Simulation.

**Neue HUD-Leiste (§2)** — Level-Badge + XP-Balken, dann Geld (mit stabilem
Einkommen/min), Holz, Stein, Nahrung, Wasser (Frischwasser oder Abdeckung),
Einwohner (mit Zuzugsrate) und Zufriedenheit (Prozent + Laune). Kompakte
Zahlen (`61,5 Mio.`, `1,2 Mio.`, `12.500`).

**Gebäude-Info-Sheet (§6)** — breiteres Sheet mit Kopf (Icon, Name,
Level-Pips, Status-Badge, Schließen), Kategorie-/Status-Zeile, einer klaren
Werte-Grid (Bewohner/Wohnungen/Radius/Produktion/Einnahmen/Unterhalt statt
Fließtext), Problem-/Vorteil-Diagnosen und großen, beschrifteten Aktions-
Buttons (Ausbau · Verschieben · Radius · Abreißen) mit Kosten/Wirkung.

**Service-Overlay & Marker (§7/§8)** — Beim Auswählen eines Radius-Gebäudes
erscheint das Versorgungs-Banner oben; die Karte färbt versorgte/teilweise/
unversorgte Gebäude wie bisher (Coverage-Overlay), plus Overlay-Modus über den
Schnellbutton (Rahmen-Hervorhebung). Marker/Overlays leiten sich aus
Simulationsdaten und Weltkoordinaten ab, nicht aus Bildschirmpixeln.

**Baumenü (§9)** — Gebäudekarten jetzt vertikal mit Bild-/Miniatur-Fläche oben,
Name, Kosten, Bauzeit, Größe, Limit und „Neu"-Badge; Kategorie-Tabs mit
Neu-/Problem-Punkten. Das Menü sitzt eingerückt zwischen Stadtarbeiten und
Schnellaktionen, sodass nichts verdeckt wird.

**Angebundene echte Spielwerte** — Ressourcen/Produktion/Einkommen,
Zufriedenheit & Bedürfnisse, Bevölkerung/Zuzug, Quests & Fortschritt,
Gebäude-Effekte/Upgrades, Bau-/Upgrade-Kosten, Serviceabdeckung, Aktivitäten
und Handelsaufträge. Kein Wert ist hartkodiert; Näherungen (z. B. „N Gebäude
ohne Wasser", Umwelt-Score) sind klar aus der Simulation abgeleitet.

**Design-Tokens (§16)** — zentrale Tokens erweitert: transluzente Panel-Flächen
über der hellen Karte, größere Radien/Schatten, Ressourcen-/Status-/Marker-
Farben, Badge- und Button-Stile — konsistent und leicht anpassbar.

**Was bleibt bewusst 2D / 3D-Vorbereitung (§14)** — Die Karte bleibt 2D-
Prototyp; kein Rendering-Umbau. Das UI ist rendering-unabhängig gehalten:
Marker/Sheet koppeln an Gebäude-/Weltkoordinaten (nicht an Pixel-Hacks), die
Kamera wird über eine schmale `MapApi`-Brücke angesteuert, Overlays kommen aus
Simulationsdaten — damit ist der Wechsel auf eine 2.5D/Iso-Ansicht später ohne
UI-Neubau möglich.

**Verifikation** — `tsc`, ESLint und `vite build` sauber; 97/97 Vitest-Tests
grün; Browser-Smoke-Test bestätigt fehlerfreien Start und das vollständige neue
HUD (Ressourcenkarten, Stadtstatus, Bürgeranliegen, Schnellaktionen, Baumenü,
Gebäude-Sheet).

## v0.21 — „Aktive Stadt: kein AFK-Farmen mehr, echtes Stadtmanagement"

Die große Richtungsänderung weg vom Idle-/AFK-Spiel hin zum aktiven
Bürgermeister-Städtebau. Verdient wird nur noch beim Spielen; dazu ein neues
Stadtarbeit-System, realistische Einwohnerzahlen, ein straffes Nahrungs-/
Wasser-Balancing und eine Reihe Bugfixes. Savegame-kompatibel über eine
Migration (Schema **v8 → v9**); alte Spielstände laden unverändert.

**Kein passives AFK-Farmen mehr (§1/§16)**
- Bei geschlossenem oder im Hintergrund liegendem Spiel läuft **nur noch**:
  Bau- und Upgrade-Timer (inkl. deren XP bei Abschluss), Ablauf von Buffs/
  Ereignissen und Cooldowns. **Nichts** wird offline produziert, verkauft,
  verdient, verbraucht oder bevölkert.
- Technisch: Die gesamte Wirtschaft (Produktion, Verbrauch, Bedürfnisse,
  Zufriedenheit, Einkommen, Bevölkerungsfluss, Feuer) läuft in `advanceLiveEconomy`
  und wird nur bei `live`-Ticks ausgeführt. `App.tsx` tickt live nur, wenn der
  Tab sichtbar ist (`document.visibilityState === 'visible'`).
- Der passive Überlauf-Export ist **komplett entfernt**. Ersatz: deutlich
  höhere aktive Verkaufspreise (Holz 2 → **10**, Stein 4 → **20**, Nahrung 1 →
  **5**, Frischwasser 1 → **3** pro Einheit), nur über das Handelskontor.

**Neues aktives Stadtarbeit-System (§2/§15/§3)**
- Ein generisches, config-getriebenes Aktivitäten-System (`activities.config.ts`)
  mit vier MVP2-Typen:
  - **Lieferung** (Essen/Baumaterial verteilen): 3–5 Zielgebäude leuchten auf
    der Karte, per Klick beliefern; schnelle Erledigung gibt einen Zeitbonus.
  - **Stadtinspektion**: Problemgebäude finden und begutachten.
  - **Bürgermeister-Entscheidung**: Popup mit Berater/Bürger und 2–3 Optionen
    samt klaren Vor-/Nachteilen (Kosten ↔ Produktions-/Zufriedenheits-Buff).
  - **Handelsaufträge**: rotierende Angebote am Handelskontor, deterministisch
    pro Zeitfenster; seltene Großaufträge bis ~1 Mio.
- Belohnungen skalieren nach Level-Band (früh Tausender, ab L6 Zehntausender,
  ab L10 Hunderttausender) und laufen ausschließlich über Controller-Commands →
  inhärent aktiv, nie offline. Eigenes **Stadtarbeit-Panel**, Kartenmarker mit
  Zielringen, Abschluss-Popup, Sound-Hook (`services/feedback.ts`) vorbereitet.
- **Manuelle Essens-Verteilung (§3)**: die `food_delivery`-Aktivität gewährt
  einen zeitlich begrenzten Verteil-Buff, der Häuser ohne Marktabdeckung
  vorübergehend voll versorgt — echter Unterschied „produzieren vs. verteilen"
  ohne neue Simulation.

**Realistische Einwohnerzahlen (§9)**
- Neuer Config-Wert `populationScale = 20`: Jedes Haus fasst das 20-fache seiner
  angegebenen Haushalte, sodass eine ausgebaute L11-Stadt ~80–120k Einwohner
  erreicht (statt ~5,5k). Alle Pro-Kopf-Größen (Steuer 40 → 2, Nahrung/Wasser/
  Arbeit) werden durch 20 geteilt, Wachstums- und Service-Kapazitäten mal 20 —
  die Ökonomie bleibt größenordnungsgleich, nur die Zahlen sind glaubwürdig.

**Nahrung & Wasser als echte Engpässe (§8)**
- Nahrungsbedarf pro Kopf ~40 % straffer als eine neutrale Neuskalierung.
- Brunnen 200 → **120**, Wasserpumpe 3000 → **1800/3000/4600**, kleine Häuser
  brauchen mehr Wasser (4 → 6, ausgebaut 8 → 12) — Wasser wächst mit der Stadt
  und macht Pumpen/Upgrades nötig.

**Sektor-Aufgaben korrekt gezählt (§5)**
- `stats.sectorsUnlocked` zählt jetzt nur **zusätzliche** Sektoren; der
  Startsektor zählt nicht mehr mit. „Erste Erweiterung" verlangt damit wirklich
  einen ersten Kauf. Neue Folge-Aufgaben `qe_expand3`/`qe_expand4`.

**Handel dauerhaft per UI erreichbar (§6)**
- Sobald ein Handelskontor gebaut wurde, erscheint ein permanenter
  **Handel-Button** in der Fußleiste — kein Gebäude-Suchen mehr. Ein Kontor
  reicht fürs ganze Spiel, Upgrades verbessern die Kurse.

**Aktive Aufgaben & entzerrte Progression (§10–§14)**
- Neue Aufgaben-Zieltypen `upgrade`, `activity`, `tradeEarnings`.
- Viele neue aktive Aufgaben für L6–L8 (Reihenhäuser, Sägewerk/Steinbruch
  ausbauen, Büro, Essen verteilen, Inspektion, Handelsaufträge, große
  Handelsziele).
- **Wohn-Freischaltungen entzerrt (§13)**: Apartment L9 → **L10**, Reihenhaus-
  Ausbau L8 → **L9**, Mehrfamilienhaus L10 → **L11**, Stadthaus L12 → **L13** —
  kein Wohn-Upgrade mehr im selben Level wie ein neues Wohngebäude (per Test
  abgesichert).

**Bugfix: Energie-Gebäude sichtbar (§18/§19)**
- Das Baumenü hatte keinen **Infrastruktur/Energie-Tab** — Kohlekraftwerk und
  Windpark konnten nie erscheinen. Neue Kategorie **Energie**; Windpark schon ab
  **L11** (erneuerbare Alternative zur Kohle). Bautabs vollständig überarbeitet,
  leere Tabs werden ausgeblendet.

**Karte nach Westen erweitert (§17)**
- Zwei neue Sektor-Spalten (`worldBounds.minSx -2`) mit einem Gebirge und zwei
  Tal-Korridoren; hinter der Felswand liegt Land für ein späteres Biom. Der
  Steinbruch-Fels-Bonus wird dadurch wertvoller.

**Stabiles Einkommen für Großprojekte (§20)**
- Die Großprojekt-Empfehlung und das Wirtschafts-Panel zeigen jetzt das
  **stabile** Einkommen (ohne temporäre Boosts); aktive Boosts werden separat
  ausgewiesen. Einmalige Handels-/Auftragsgelder fließen nicht in /min-Werte.

**Bessere Service-Overlays (§21)**
- Versorgungs-Overlays füllen betroffene Gebäude-Grundflächen jetzt farbig
  (versorgt/teilweise/ohne) und zeigen eine Zusammenfassung mit Zählwerten.

**3D-/Visual-Vorbereitung**
- Optionales, ungenutztes `visual`-Feld auf Gebäuden (Höhenklasse, 2D/Iso/3D-
  Asset-Referenzen, Overlay-Anker) — vorbereitet für spätere hochwertige
  Darstellung, ohne die Spiellogik zu berühren. Marker/Overlays rechnen bereits
  in Welt-Koordinaten.

**Balancing-Feinschliff (§1/§22)**
- XP-Kurve unverändert (L1–5 bleiben schnell), aber Level-Up-Geldgeschenke
  L2–L5 um ~15 % gesenkt — die neuen aktiven Aufgaben tragen den frühen
  Geldfluss.

**Tests & Verifikation**
- **97/97 Vitest-Tests grün**, `tsc`, ESLint und `vite build` sauber. Neue
  Tests: Offline-Gating, das Aktivitäten-System (Lieferung/Entscheidung/
  Handelsauftrag), die v8→v9-Migration und die Wohn-Progressions-Invariante.
  Browser-Smoke-Test: sauberer Start ohne Fehler, Energie-Tab vorhanden.

**Empfohlene nächste Balancing-Schritte**
- Ein Zeit-Skip-Durchlauf L1–14 über die Debug-Tools, um Nahrungs-/Wasser-
  Korridore und die ×20-Einwohnerkurve im echten Verlauf zu prüfen.
- Das schwergewichtige Service-Overlay (Karten-Abdunkelung, Legende als
  Vollpanel) und tiefere Ausbaupfade für Reihenhaus/Apartment/Wohnturm sind
  bewusst als Folge-Schritt offen gelassen.

---

## v0.20 — „Langzeit-Ausbau, aktiver Handel & Steuer-Regler bis 500 %"

Großer Balancing- und Mechanik-Pass für das Mid-/Late-Game. Der kritische
Upgrade-Bug ist behoben, Wohn- und Produktionsgebäude bekommen lange, teure
Ausbaupfade, überschüssige Rohstoffe werden für aktive Spieler zu Geld, und der
Steuer-Regler wird zu einem echten Entscheidungswerkzeug. Alles bleibt
config-getrieben und savegame-kompatibel (Schema v8 unverändert; das neue
`targetUpgradeLevel`-Feld ist optional, alte Spielstände laden unverändert).

**Kritischer Upgrade-Fix (§2) — Gebäude behalten ihre Wirkung während des Ausbaus**
- Bisher verlor ein Gebäude beim Upgrade *sofort* seine Funktion: Bewohner
  raus, Produktion/Radius/Versorgung/Lager auf 0, bis der Ausbau fertig war.
- Neu: Ein Ausbau merkt sich nur ein **Ziel** (`targetUpgradeLevel`) und lässt
  `upgradeLevel` (die *abgeschlossene* Stufe) unangetastet. Solange gebaut wird,
  bleiben **alle Eigenschaften der aktuellen Stufe voll aktiv** — Wohnkapazität,
  Bewohner, Produktionsrate, Radius, Service-Coverage, Lager, Jobs, Einnahmen,
  Unterhalt. Erst bei Abschluss schaltet der Tick sauber auf die Zielstufe um.
- Kein Doppel-Effekt, kein Produktions-Blackout, kein Wegzug mehr. Geprüft durch
  neue Tests (Rathaus behält seinen Lagerausbau, Sägewerk produziert
  ununterbrochen weiter) — greift für Live-Tick *und* Offline-Catch-up.
- UI: „Ausbau läuft — aktuelle Stufe bleibt voll aktiv" inkl. Zielstufen-Name.

**Langsamere Levelprogression (§1)**
- XP-Kurve ab L4 um ~15–30 % gestreckt (L5 620 statt 480, L10 ~5 700 statt
  4 400, L14 ~21 400 statt 16 800). L1–3 bleiben bewusst schnell, damit der gute
  Early-Flow erhalten bleibt — Level-Ups fühlen sich jetzt wertvoller an.

**Wohngebäude-Ausbaupfade (§3/§4/§5) — Zentrum bleibt langfristig wichtig**
- Kleines Haus hat jetzt einen 6-stufigen Pfad auf gleicher 2×2-Fläche:
  Kleines Haus → Ausgebautes Haus (L3) → **Doppelhaus (ab L8)** →
  Mehrfamilienhaus (L10) → Stadthaus (L12) → Wohnblock (L14, 16 Haushalte).
- Das Doppelhaus ist wie gefordert **erst ab Level 8** verfügbar. Höhere Stufen
  sind teuer (bis 1,4 Mio. €) und anspruchsvoller (mehr Wasser/Unterhalt), dafür
  wird das Gründerhaus dauerhaft wertvoll — ein voll ausgebautes Kleines Haus
  ersetzt eine ganze Straße Starterhäuser. Reihenhaus/Apartment/Wohnturm haben
  bereits mehrstufige Pfade und bleiben.

**Produktionsgebäude-Upgrades (§14)**
- Sägewerk ab **L7** (ab 200.000 €): Verbesserte Sägen → Automatisiertes
  Sägewerk → Industrie-Sägewerk (45 → 300 Holz/min).
- Steinbruch ab **L8** (ab 300.000 €): Bessere Fördertechnik → Schweres Gerät →
  Industrieller Steinbruch (38 → 240 Stein/min).
- Farm ab **L8** (ab 300.000 €): Bewässerung → Moderne Landwirtschaft →
  Automatisierte Farm (220 → 1 250 Nahrung/min). Höhere Farmstufen brauchen
  jetzt **Wasser** — mehr Nahrung heißt auch mehr Wasserwerk (echtes Trade-off).
- Spätere Stufen kosten Millionen und ziehen mehr Arbeitskräfte/Energie/Unterhalt.

**Aktiver Rohstoff-Überlauf (§6)**
- Läuft ein Lager voll, wird überschüssige Produktion **nur im aktiven Spiel** zu
  Geld (Holz 2 €, Stein 4 €, Nahrung/Trinkwasser 1 € je Einheit). Offline/
  Catch-up gibt es **kein** Export-Geld — kein AFK-Gelddrucker. Anzeige in der
  Stadtkasse: „Überschuss-Export: +X €/min".

**Neues Gebäude: Handelskontor (§7)**
- Ab L5 baubar. Schaltet **aktiven Handel** frei: Rohstoffe manuell verkaufen
  (Hälfte/alles) oder — teuer, mit 4× Aufschlag — kaufen. Upgrades (Rohstoffbörse
  +25 %, Exportzentrum +50 % Verkaufskurs) verbessern den Kurs. Kaufen liegt weit
  über jedem Verkaufskurs, also kein Arbitrage-Exploit — Produktion bleibt die
  Hauptquelle. Eigenes Handels-Panel, geöffnet über das Gebäude-Sheet.

**Verschiebbare Produktionsgebäude (§8)**
- Sägewerk, Steinbruch und Farm sind jetzt über das Gebäude-Sheet **verschiebbar**
  (kleine Umzugsgebühr). Zielort wird neu geprüft (Terrain, Straße), Standortbonus
  neu berechnet — frühe Fehlplatzierung ist keine dauerhafte Strafe mehr.

**Steuer-Regler bis 500 % (§9)**
- Band von ±50 % auf **50–500 %** erweitert. Hohe Sätze bringen mehr Geld pro
  Kopf, kosten aber massiv Zufriedenheit (Wohnsteuer bei 300–500 %: −48 … −96),
  wodurch Zuzug einbricht und Bürger wegziehen — ein Werkzeug, kein Gratisgeld.
  UI: Warnfarben ab 150 %/250 % und eine Effekt-Vorschau der Zufriedenheitskosten.

**Prototyp-Cheats (§10)**
- Neuer, klar als Test markierter **Debug-Bereich** (Feature-Flag `debugTools`,
  über Einstellungen): +100.000 € / +1.000.000 €, alle Lager auffüllen, alle
  Bauten abschließen, alle Upgrades abschließen. Läuft über GameController-Commands
  (mit Reason geloggt), nie am normalen Datenfluss vorbei.

**Farm & Ressourcenwert (§11/§12/§13)**
- Nahrungsverbrauch pro Kopf angehoben (0,03 → 0,05) — Nahrung ist jetzt ein
  echter, aber fairer Engpass; eine wachsende Stadt braucht mehr/aufgewertete
  Farmen und einen guten fruchtbaren Standort.
- Standortboni verstärkt und sichtbarer: Steinbruch an Fels bis **+70 %**, Farm
  auf fruchtbarem Boden bis **+50 %** — die frühe Entscheidung Gebirge vs.
  fruchtbares Land hat jetzt spürbar unterschiedliche Stärken.
- Volle Lager sind sinnvoller (aktiver Export + Handelskontor), teure
  Material-Upgrades verbrauchen Überschüsse — Rohstoffe fühlen sich wertvoller an.

**Level-7-Aufgabe (§16)**
- Neue Bauamt-Aufgabe „Mehr Wohnraum": 10 Kleine Häuser + 6 Reihenhäuser (passt
  genau zu den Wohnlimits bei L7). Belohnung: Geld, XP **und Material** (Holz/
  Stein — neu unterstützt). Zählt Lebenszeit-Bauten, erfüllt sich also automatisch,
  wenn schon genug gebaut wurde.

**Geänderte Dateien**
- Logik: `types.ts` (targetUpgradeLevel), `buildings/effects.ts` (isContributing),
  `simulation/derived.ts`, `simulation/tick.ts` (live-Flag, Überlauf-Export,
  Upgrade-Abschluss), `commands/controller.ts` (Upgrade-Fix, Handel, Cheats,
  Überlauf-Anzeige).
- Config: `types.ts`, `schemas.ts`, `balancing.config.ts`, `levels.config.ts`,
  `buildings.config.ts`, `needs.config.ts`, `quests.config.ts`.
- UI: `TradePanel.tsx` (neu), `DebugPanel.tsx` (neu), `App.tsx`, `store.ts`,
  `FloatingBuildingSheet.tsx`, `EconomyPanel.tsx`, `SettingsPanel.tsx`,
  `i18n/de.json`, `styles.css`.
- Tests: `tests/upgrade.test.ts` (neu, 7 Tests), `tests/systems.test.ts`
  (Steuerband). **92/92 Tests grün, Lint + Build sauber.**

**Empfohlene nächste Balancing-Tests**
- Simulierter Durchlauf L1–14 mit Zeit-Skip (Debug): Wie lange bis zur ersten
  Doppelhaus-/Sägewerk-Stufe? Fühlen sich die 200k/300k-Schwellen fair an?
- Voll-Lager-Szenario: Reicht der aktive Export, um Warten zu überbrücken, ohne
  Produktion zu entwerten? Sind die Export-/Handelskurse (2/4/1) stimmig?
- Nahrungs-Engpass: Ab welcher Einwohnerzahl reicht 1 Farm nicht mehr? Passt der
  neue Verbrauch (0,05) zu den Farmstufen und dem Wasserbedarf?
- Steuer-Stresstest: Bei welchem Satz kippt die Stadt in den Wegzug? Ist 500 %
  ein sinnvoller „Notgroschen" oder zu hart/zu weich?
- Upgrade-während-Betrieb: Große Stadt, mehrere gleichzeitige Upgrades — bleibt
  Zufriedenheit/Versorgung durchgehend stabil?

## v0.19.1 — „Neu anfangen repariert"

**Bugfix:** Der „Neu anfangen"-Button funktionierte nicht zuverlässig. Ursache:
Der Reset löschte den Spielstand und lud die Seite neu — beim Neuladen schrieb
der `beforeunload`-Autosave aber sofort den **alten** Zustand zurück, sodass die
alte Stadt wieder auftauchte.

**Fix:** Reset läuft jetzt **in-place, ganz ohne Reload**
(`GameController.resetTo`): ein frischer Spielstand wird direkt in den laufenden
Controller getauscht, sofort gespeichert und die Ansicht neu aufgebaut (frischer
Pixi-Renderer per Remount-Key). Kein Reload → kein Zurückschreiben. Der Import
eines Spielstands nutzt jetzt denselben sicheren Pfad.

- Bestätigungsdialog „Spielstand wirklich löschen und neu anfangen?", danach eine
  Erfolgsmeldung.
- Zusätzlicher Button **„Neustart mit Startbonus"** (Test-Start mit extra Geld +
  Gold) für schnelles Balancing-Testen (§10).
- Verifiziert: neuer Unit-Test (`resetTo` ersetzt den Zustand vollständig und
  reaktiviert die Tutorial-Aufgabe) **und** ein echter Browser-Test (Reset ohne
  Reload, frischer Spielstand bleibt bestehen). 85/85 Tests grün, Lint + Build ok.

## v0.19 — „Spieltypische UI: Marker, Bürgeranliegen & klare Gebäude-Popups"

Reiner UI/UX-Pass (§ Vorgabe: keine neue Gameplay-Logik). Die 2D-Prototyp-Karte
bleibt, aber die Oberfläche wird deutlich spieltypischer und lesbarer — mit
Problem-/Vorteil-Markern direkt auf der Karte, einem klar strukturierten
Gebäude-Popup, Bürgeranliegen statt Checklisten-Aufgaben und „Neu"-Ankündigungen.
Alle Anzeigen lesen bestehende Simulationsdaten; nichts am Spielverlauf geändert,
Savegame bleibt v8-kompatibel.

### 1. Problem- & Vorteil-Marker auf der Karte (Items 4/12)

Neues geteiltes **Diagnose-Modul** (`buildings/diagnostics.ts`) benennt für jedes
Gebäude, was gut läuft und was fehlt — die *eine* Quelle für Karte **und** Popup:

- **Problem-Blase (rot, „!")** über einem Gebäude bei: kein Straßenzugang, Lager
  voll (Produktion gestoppt), Betrieb pausiert (Brand), „hier will keiner
  einziehen".
- **Ausbau-Blase (bernstein, Pfeil nach oben)** wenn ein bezahlbares, freigeschaltetes
  Upgrade bereitsteht — wie die Bau-Blasen der Referenzbilder.
- Immer nur **ein** Marker pro Gebäude (Problem schlägt Ausbau), damit die Karte
  nicht zur Icon-Wand wird. Der bestehende Standortbonus-Stern bleibt separat.

### 2. Gebäude-Popup komplett überarbeitet (Items 2/12)

- **Kopf** mit Kategorie-Zeile und **farbigem Status-Badge**: Aktiv · Im Bau ·
  **Upgrade läuft** · Pausiert · Braucht Aufmerksamkeit · Ausbau bereit.
- Neuer **„Was läuft gut / Was fehlt"-Block**: grüne Vorteile (Standortbonus mit
  %, Ausbau bezahlbar, an Straße angeschlossen) und rote Probleme in klaren
  Zeilen, aus demselben Diagnose-Modul — keine widersprüchlichen Hinweise mehr.
- Bau-Status unterscheidet jetzt sichtbar **„Im Bau"** vs. **„Upgrade läuft"**.
- Wohngebäude behalten die Zuzugs-Erklärung aus v0.18 („Zuzug +X/min" bzw. Grund).

### 3. Aufgaben werden zu Bürgeranliegen (Items 6/13/14)

Jede Aufgabe hat jetzt einen **Absender** (`sender` in der Quest-Config, rein
präsentativ) und liest sich als lebendige Bitte statt Checkliste:

- **Bürger · Bauamt · Feuerwehr · Händler · Bürgermeister-Team** — jeweils mit
  **farbigem Avatar** (Platzhalter-Icon) und Absender-Label auf der Quest-Karte.
- Panel-Titel „Aufgaben" → **„Bürgeranliegen"**, Belohnung klar mit Icon separat,
  Claim-Button rechts. Der Fokus: „du hast jemandem geholfen" — die Belohnung
  kommt weiter vom Spielsystem.

### 4. Neue Gebäude werden angekündigt (Item 7)

- **Level-Up-Popup** listet jetzt konkret die neu freigeschalteten Gebäude
  (`event.level_up.body_unlocks`) mit Verweis aufs Baumenü.
- **„Neu"-Badge** auf frisch freigeschalteten Baukarten und ein **grüner Punkt**
  auf der Kategorie-Kachel. Verschwindet automatisch, sobald gebaut oder das
  Level steigt — kein persistenter „gesehen"-Zustand nötig.
- **Roter Empfehlungs-Punkt** auf einer Kategorie-Kachel, wenn ein dort baubares
  Bedürfnis unter 60 % liegt (z. B. Wasser knapp → Kachel „Versorgung").

### Neue/erweiterte UI-Komponenten & Vorbereitung echter Assets

- Neu: geteiltes `buildingDiagnostics`/`primaryMarker`-Modul, Marker-Renderer,
  Bürgeranliegen-Quest-Karten mit Avataren, Status-Badge & Diagnose-Block im
  Sheet, „Neu"/Empfehlungs-Badges im Baumenü, Level-Up-Ankündigung.
- Alle Grafiken weiterhin **programmatisch** (Pixi) bzw. als CSS/Lucide-Platzhalter,
  bewusst so gekapselt (Marker, Avatare, Badges als eigene Zeichen-/Style-Bausteine),
  dass echte Sprites/Avatare später ohne Aufruferänderung eingesetzt werden können.

### Geänderte Dateien

- Neu `game/buildings/diagnostics.ts`; `buildings/placement.ts` (`isConnectedToRoad` exportiert)
- `commands/controller.ts` — `getBuildingDiagnostics`/`getBuildingMarker`/`isNewBuilding`/`unlocksAtLevel`
- `config/types.ts` + `schemas.ts` — `QuestSender`/`sender`
- `config/quests.config.ts` — Absender an allen Quests
- `renderer/MapRenderer.ts` — Marker-Blasen; `App.tsx` — Level-Up-Ankündigung
- UI: `FloatingBuildingSheet` (Status/Diagnosen), `QuestPanel` (Bürgeranliegen),
  `BuildMenu` (Neu-/Empfehlungs-Badges), `de.json`, `styles.css`
- Tests: neu `diagnostics.test.ts` (3 Tests)

**Verifikation:** 84/84 Tests grün, Lint sauber, Build erfolgreich.

### Bewusst als nächste UI-Iterationen gestaffelt

Aus dem großen UI-Wunschzettel noch offen (jeweils eigene, testbare Schritte):
Service-Overlay-Modus mit oberer Kapazitäts-/Bedarfsleiste + Berater-Box (§3/§15),
HappinessBreakdown mit „betroffene Gebäude anzeigen"-Klick (§5), aus Gebäude-Problemen
automatisch generierte Bürgeranliegen (§13), HUD-Neuordnung mit Ressourcenbildern
(§9), sowie echte Bild-Assets für Gebäudekarten/Avatare (§11).

## v0.18 — „Aktiver Anfang & echtes Wachstum: die Stadt füllt sich wieder"

Dieser Patch behebt die im Durchspielen gefundenen Kernprobleme: die **kaputte
Bevölkerungs-Kurve** (große Stadt blieb weit unter Kapazität, obwohl zufrieden),
**Wohngebäude-Spam**, und der **zähe, passive Early-Game-Loop**. Alles über die
bestehenden Systeme (Wachstumsformel, `buildLimit`, Kostenpfad, Quest-Engine) —
keine Parallel-Logik, alle Werte in Configs. Savegame bleibt kompatibel
(Schema v8, keine Migration nötig — nur Config-Änderungen).

### 1. Kritischer Zuzugs-Fix: 8.909/45.677 trotz 99 % ist Geschichte (Item 15)

**Ursache:** Der Zuzug war ein **flacher Wert** (`growthPerMin`, ~10 Bürger/min)
— völlig unabhängig von der Stadtgröße. Eine 45.000-Kapazität-Stadt füllte sich
im selben Tempo wie ein Dorf. Von 0 auf 45.677 hätte bei 10/min **rund 62
Stunden reiner Simulationszeit** gebraucht — daher blieb die große, zufriedene
Stadt dauerhaft halbleer.

**Fix:** Zuzug skaliert jetzt mit dem **freien Wohnraum** und der Zufriedenheit
(`moveInPerMin` in `tick.ts`, neuer Config-Wert `growthFillRatePerMin`). Ein
Anteil des leeren Wohnraums zieht pro Minute ein — je zufriedener, desto mehr;
ein flacher Sockel (`growthPerMin`) hält kleine Dörfer am Füllen. Dieselbe Formel
speist die UI-Anzeige, also stimmt „angezeigte" und „tatsächliche" Rate überein.

**Simulierte Füllkurve** (45.000 Kapazität, voll versorgt, `growthFillRatePerMin`
= 0,06):

| Zufriedenheit | nach 1 min | 10 min | 30 min | 60 min | voll |
|---|---|---|---|---|---|
| **99 %** | ~2.700 | ~20.600 | ~37.900 | ~44.000 | ~90 min |
| **75 %** | ~1.600 | ~13.800 | ~30.100 | ~40.200 | ~2 h |
| **65 %** | ~1.200 | ~10.500 | ~24.800 | ~36.000 | >90 min |

(Offline-Catch-up rechnet dieselbe Formel in 60-s-Chunks, füllt also gleich
schnell nach. Ein Dorf mit 5 Plätzen ist weiter in Minuten voll.)

**Zuzug wird jetzt erklärt:** Der Controller liefert `getGrowthStatus()` (wächst
/ voll / unzufrieden / kein Wohnraum + Rate). Angezeigt im **Stadtstatus**
(Einwohner/Kapazität + „Zuzug: +X/min" oder Grund) **und direkt am Wohngebäude**
im Info-Sheet („Hier will aktuell niemand einziehen: …").

### 2. Wohngebäude-Limits pro Level — Verdichtung statt Spam (Items 1, 2)

Wohngebäude sind nicht mehr endlos spammbar. Neue `buildLimit`-Tabellen pro Typ,
config-basiert und skalierbar, abgestimmt auf Kapazität/Jobs/Versorgung:

| Level | Kleines Haus | Reihenhaus | Apartment | Wohnturm |
|---|---|---|---|---|
| 1–5 | 8 | — | — | — |
| 6–8 | 10 | 6 | — | — |
| 9–11 | 12 | 8 | 8 | — |
| 12–13 | 12 | 8 | 8 | 6 |
| 14–15 | 12 | 12 | 12 | 12 |
| 16+ | 14→16 | 14 | 14 | 16 |

Das Limit erzwingt genau das gewünschte Verhalten: **mehr Bedeutung pro Gebäude**
und **Upgrades/dichtere Typen statt Wiederholung**. Das Build-Menü zeigt weiterhin
Bestand/Limit und „mehr ab Level X".

### 3. First-Build-Discount: das erste Kerngebäude gratis/günstig (Items 3, 9)

Neues generisches Config-Feld `firstBuildDiscount` (0..1): das **allererste**
Exemplar eines Kernwirtschaftsgebäudes ist gratis oder billiger, danach normaler
Preis. Gekoppelt an die **Lebenszeit-Bauzahl** (`stats.built`), nicht die aktuelle
— Abreißen & Neubauen kann den Rabatt nicht farmen.

- **Gratis:** erstes Sägewerk, erster Brunnen, erste Farm
- **50 %:** erster Steinbruch, erster Markt, erstes Lager

Der Wirtschafts-Loop startet damit sofort beim Freischalten — kein Geld-Warten,
besonders an der berüchtigten **Level-5-Wand**. Das Build-Menü zeigt „1. gratis".

### 4. Aktiver Early-Game-Loop: parallele Aufgaben (Items 6, 8, 9)

Sechs neue **parallele Nebenaufgaben** laufen zusätzlich zur Hauptkette (kein
Vorgänger, aktivieren sich sofort bei ihrem Level) und belohnen aktives Spielen
mit Geld/XP/Gold — der Spieler hat immer ein konkretes Ziel statt auf Einnahmen zu
warten:

- L2 „Erste Holzlieferung" (120 Holz) · L3 „Erste Nachbarschaft" (30 Bürger)
- L4 „Volle Speisekammer" (150 Nahrung) · L4 „Steinbruch läuft" (120 Stein)
- L5 „Erste Erweiterung" (1. Sektor) · L5 „Zufriedene Bürger" (80 %)

Reine Config in `quests.config.ts` über bestehende Objective-Typen — keine neue
Quest-Logik.

### Geänderte Dateien

- `config/types.ts`, `config/schemas.ts` — `firstBuildDiscount`, `growthFillRatePerMin`
- `config/balancing.config.ts` — `growthPerMin` 10→12, `growthFillRatePerMin` 0,06
- `config/buildings.config.ts` — Wohn-`buildLimit`s, `firstBuildDiscount` (6 Gebäude)
- `config/quests.config.ts` — 6 parallele Early-Quests
- `buildings/effects.ts` — Rabatt im `effectiveBuildCost`-Pfad (+ `isFirstBuildDiscounted`)
- `simulation/tick.ts` — `moveInPerMin`, freihausbasierter Zuzug
- `commands/controller.ts` — `getGrowthStatus`, `isFirstBuildDiscount`, Lebenszeit-Kosten
- UI: `CityStatusPanel` (Zuzugsanzeige), `FloatingBuildingSheet` (Zuzugs-Diagnose),
  `BuildMenu` (Gratis-Badge), `de.json`, `styles.css`
- Tests: `balancing.test.ts` (+4 v0.18-Tests), Anpassungen in `simulation.test.ts`

**Verifikation:** 81/81 Tests grün, Lint sauber, Build erfolgreich.

### Bewusst als nächste Schritte gestaffelt (aus dem großen Wunschzettel)

Um den funktionierenden Stand nicht zu gefährden, sind diese größeren Systeme als
eigene, jeweils testbare Iterationen vorgesehen (Reihenfolge = Empfehlung):

1. **Gebäude-Rotation** (Item 13) — Footprint drehen + Rotation im Savegame.
2. **Marktplatz 4×4 als Zentrum** (Item 5) + **Gründerhaus/Altstadt-Prestige** (Item 4)
   — eigenes „Zentrum"-Feature mit sichtbarem Anker.
3. **Handelsposten / aktiver Ressourcenverkauf** (Items 7, 8) — Verkaufen/Kaufen
   über `EconomyService`, config-basierte Angebote mit Cooldown.
4. **Upgrade-Bug „alte Werte während Upgrade aktiv"** + Fake-Shop + Gold-Speedup +
   robuster Neustart-Button (aus dem vorherigen Wunschzettel).
5. **Level 15 Energie-Meilenstein-Ausbau**, **pro-Typ-Wohnbedürfnisse** (Item 14),
   **Biom-Standortboni-Ausbau** (Item 12).

### Empfohlene nächste Balancing-Tests

- 45k-Stadt bei 60–70 % Zufriedenheit: füllt sie sich noch angenehm, oder zu langsam?
- L6–L9 mit den neuen Limits: reichen 10 Häuser + 6 Reihenhäuser für flüssiges
  Wachstum bis zum Apartment-Unlock?
- First-Build-Discount: startet der Loop bei L2–L5 jetzt ohne Wartephase (Sitzung
  ohne >30 s Leerlauf)?
- Aktiv vs. AFK: 30 min aktives Quest-Spiel vs. 30 min AFK — ist der aktive
  Vorsprung deutlich spürbar?

## v0.17 — „Ausbaupfade & begrenzte Welt: das Zentrum wächst in die Höhe"

Wachstum passiert ab jetzt nicht mehr nur durch Ausbreitung, sondern durch
**Verdichtung**: Gebäude lassen sich über viele Stufen ausbauen, das Zentrum
entwickelt sich sichtbar in die Höhe, und die Welt ist von Anfang an als
**große, begrenzte Karte mit allen Biomen** sichtbar. Alles über die bestehenden
generischen Systeme (Effekte, Level-Gate, Coverage) — keine Parallel-Logik.

### Viele neue Ausbaustufen — Verdichten schlägt Zubauen (Items 1–4, 6, 7)

- **Wohngebäude** bekommen echte Ausbaupfade auf demselben Grundstück:
  - **Kleines Haus** → Haus → Doppelhaus → **Stadthaus** (1 → 4 Haushalte)
  - **Reihenhaus** → erweitert → **Wohnzeile** (12 → 26 Haushalte)
  - **Apartmenthaus** → groß → **Wohnkomplex** (90 → 200 Haushalte)
  - **Wohnturm** → **Hochhaus** → **Wolkenkratzer** (360 → 720 Haushalte,
    ~3.600 Einwohner auf einem Turm)
- Ausbauen ist **pro Fläche wertvoller als neu bauen**: ein aufgestockter Turm
  bringt mehr Einwohner pro Tile als ein zweiter Turm auf neuer Fläche — der
  eigentliche Langzeit-Motor, wenn der Platz knapp wird.
- **Generische Ausbaustufen auch für Dienste & Wirtschaft** (alles über die
  vorhandenen Effekte — Reichweite, Kapazität, Jobs, Lager): Brunnen, Wasserwerk,
  Markt, Park, Bürogebäude, Lagerhaus, Feuerwehr, Polizei, Krankenhaus.
- **Kostenkurven fürs Late-Game**: höhere Stufen kosten Millionen und bleiben
  echte Sparziele; alle Werte in der Config.

### Ausbau ist an das Level gekoppelt (Item 3)

- Jede Ausbaustufe kann ein **`unlockLevel`** haben (neues, optionales
  Config-Feld). Ein Gebäude steigt nur so hoch, wie es die Stadt „verdient" hat —
  die Verdichtung bleibt über die gesamte Progression ein Ziel statt sofort
  ausgereizt. Gleiches Level-Gate wie bei Gebäude-Freischaltungen, kein neues
  System. Das Bau-Panel zeigt gesperrte Stufen als **„Ausbau ab Level X"** an.

### Sichtbare Zentrums-Entwicklung & Prestige (Items 1, 8, 12)

- Ausgebaute Gebäude **sehen entwickelter aus**: mit jeder Stufe wachsen ein
  längerer Schlagschatten (Höhe von oben), ein zurückgesetzter „Turmkern" und
  die Stufen-Pips — das Zentrum verdichtet sich sichtbar zur Skyline.
- Das **Rathaus** ist jetzt selbst ausbaubar (Rathaus → Großes Rathaus →
  **Prachtrathaus**): mehr Verwaltungs-Jobs, größerer Zentral-Speicher und eine
  breitere Ansehens-Aura — ein Prestige-Meilenstein für die Gründungsstadt.
- Ausgebaute Gebäude tragen im Info-Panel ihren **Stufen-Namen**
  („Wolkenkratzer" statt „Wohnturm").

### Konzeptwechsel: große, aber begrenzte Welt (Items 9–11)

- Die Karte ist keine unendliche Open-End-Fläche mehr, sondern ein **großes,
  endliches Spielbrett** (`worldBounds` in der Config). **Alle Biome sind ab der
  ersten Minute sichtbar** (gesperrt/abgedunkelt) — Wald, Gebirge, Fluss,
  **Meeresküste** im fernen Osten und Ebenen sind von Anfang an als Ziele da.
- Sektoren bleiben **freischaltbar** wie bisher; nur jenseits der Weltgrenze
  existiert nichts mehr und lässt sich nichts freischalten (harte Kante statt
  endlosem Nachwachsen).
- **Speicherstand-Migration v7 → v8**: alte (Open-End-)Spielstände werden auf
  das begrenzte Brett gehoben — fehlende Sektoren im Weltrahmen werden ergänzt,
  bereits freigeschaltete/bebaute Sektoren bleiben unangetastet.

### Technik

- `BuildingUpgradeDef` um `unlockLevel` + `nameKey` erweitert (Typen + Zod).
- `controller.upgradeBuilding` prüft das Level; neuer `getUpgradeInfo`-Helfer als
  einzige Quelle für die Ausbau-UI (nächste Stufe, Level-Sperre, Bezahlbarkeit).
- `world.ts`: `isSectorInBounds`/`allWorldSectors`; Grenzen in
  `materializeSector`/`-Neighbors`, `unlockSector`, `foundDistrict`.
- Neue Tests: Level-Gate & Kapazitätswachstum beim Ausbau, Rathaus-Prestige,
  harte Weltkante, v7→v8-Migration. **77 Tests grün**, Lint + Build sauber.

## v0.16 — „Großstadt-Skalierung: Reichweiten, Kapazität & echte Bevölkerung"

Die Stadt wächst — jetzt skalieren die Systeme mit. Servicegebäude bekommen
realistische Einzugsgebiete, Wohngebäude glaubwürdige Einwohnerzahlen, und ein
neues, generisches **Radius-vs-Kapazität**-Modell sorgt dafür, dass große Städte
nicht mit Mini-Radien geflutet werden — Planung bleibt trotzdem wichtig. Alles
in den Configs, kein neues Parallelsystem.

### Radius vs. Kapazität — neues generisches Modell (Items 1, 2)

- Der bestehende `coverage`-Effekt hat jetzt ein optionales Feld **`capacity`**
  (versorgbare Einwohner). Ein Servicegebäude deckt einen **Radius** ab *und*
  versorgt nur bis zu einer **Kapazität** gut. Wächst die Stadt über die
  Kapazität hinaus, sinkt die Deckung auch im Radius — man braucht ein paar
  starke Stationen, nicht eine pro Block. Ohne `capacity` (Parks) bleibt es
  reine Radius-Deckung. Ein Feld, kein Sonderfall — gilt automatisch für alle
  Coverage-Bedürfnisse.
- Umgesetzt im `derived`-Layer (`coverageCapacity` pro Bedürfnis) und im Tick
  (Deckung = Radius-Anteil × min(1, Kapazität/versorgte Einwohner)).

### Realistischere Reichweiten & Kapazitäten (Items 1, 7)

- **Feuerwehr** Radius 12 → **18**; **Polizei** 11 → **16** (+ Kapazität 8.000
  Einw.); **Krankenhaus** 11 → **18** (+ Kapazität 15.000 Einw.).
- **Markt** Radius 9 → **14**, **Supermarkt** 10 → **16**.
- **Brunnen** Radius 7 → **9**, Kapazität 60 → **200**; **Wasserpumpe** Radius
  12 → **18**, Kapazität 240 → **3.000**.
- **Kraftwerk** 250 → **3.500**, **Windpark** 120 → **1.500** Energie.
- **Wasseraufbereitung** 40 → **400** Trinkwasser/min, Puffer 800 → 6.000.
- **Park** Radius 8 → 11, **Spielplatz** 5 → 7.
- Höhere Bau-Limits im Late-Game (Farm, Pumpe, Feuerwehr, Büro, Laden u. a.),
  damit eine Großstadt genug Kernservices bauen kann.

### Realistische Einwohner-/Wohnkapazitäten (Items 3, 4)

- Wohngebäude tragen jetzt echte Stadt-Bevölkerung, über **Haushalte pro
  Gebäude** (nicht absurd große Haushalte):
  - Reihenhaus 24 → **48** Einw. (12 Haushalte)
  - Apartment 96 → **360** Einw. (90 Haushalte)
  - Wohnturm 300 → **1.800** Einw. (360 Haushalte)
  - Kleines Haus bleibt bewusst klein (Vorstadt, ~5).
- Damit erreicht eine ausgebaute Stadt glaubwürdig **~10× so viele** Bürger
  (Größenordnung 30.000+ statt ~3.000).
- **Versorgung zieht mit:** Wasser-/Energiebedarf der Wohngebäude, Farm-Output
  (42 → **220**/min), Bäckerei (14 → **90**), Trinkwasser, Lager-Puffer für
  Konsumgüter (Essen/Trinkwasser 600 → **3.000**) und **Arbeitsplätze**
  (Büro 400 → **2.000**, Laden 8 → 40, Markt/Supermarkt hoch) skalieren
  gemeinsam, damit das Verhältnis stimmt. Essensbedarf pro Kopf 0,05 → **0,03**.

### Verschiebbare Servicegebäude (Item 5)

- Zentrale Versorgungs-/Servicegebäude sind jetzt **verschiebbar** (über das
  bestehende Relocate-System im Gebäude-Sheet, mit Platzierungs-Neuprüfung und
  Umzugsgebühr): **Brunnen, Wasserpumpe, Wasseraufbereitung, Markt, Supermarkt,
  Feuerwehr, Polizei, Krankenhaus**. Normale Wohn-/Produktionsgebäude bleiben
  bewusst nicht verschiebbar (Abriss & Neubau).
- Gebühren pro Typ konfigurierbar (`relocationCost`), z. B. Krankenhaus 120.000.

### Bessere Reichweiten-/Kapazitäts-Darstellung (Item 6)

- Die Coverage-Legende zeigt bei kapazitätsbegrenzten Diensten jetzt die
  **Auslastung „X/Y Einwohner"** und färbt sie rot bei Überlastung — man sieht
  sofort, ob **Reichweite oder Kapazität** das Problem ist. In-Range-Häuser
  erscheinen bei Überlastung als „unterversorgt".

### Configs & Dateien

- `buildings.config.ts` (Radien, Kapazitäten, Wohn-/Bedarfs-/Job-/Produktions-
  werte, Relocate-Flags), `needs.config.ts` (Essensbedarf), `config/types.ts` +
  `schemas.ts` (`coverage.capacity`), `simulation/derived.ts` + `tick.ts`
  (Kapazitätsmodell), `buildings/coverage.ts` + `renderer/MapRenderer.ts` +
  `components/MapView.tsx` + i18n + CSS (Auslastungs-Anzeige). Keine
  Save-Migration nötig — Werte liegen in Configs, Bestände rechnen robust neu.

### Empfohlene weitere Skalierungs-Tests

- Reife Großstadt (30.000+): Happiness-Landung 70–90 %, Wasser/Energie/Essen im
  Gleichgewicht mit wenigen Kern-Services; Auslastungs-Overlay bei Polizei/
  Krankenhaus prüfen; Einkommen vs. Unterhalt bei großer Bevölkerung
  gegenrechnen (ggf. `taxPerCapitaPerMin` später nachjustieren).

## v0.15 — „Langzeit-Balancing: echte Investitionen & langsamere Progression"

Ein zusammenhängender Balancing-Pass (keine isolierten Zahlenänderungen): Preise,
XP-Kurve, Belohnungen und Limits wurden **gemeinsam** neu abgestimmt. Ziel: Level
1–3 bleiben schnell und verständlich, ab Level 4 wird die Stadtentwicklung zu
einer echten Langzeitplanung mit glaubwürdigen Kosten. Alles bleibt in den
Configs — kein neuer Balancing-Code, bestehende Systeme wurden weiterverwendet.

### Realistischere Gebäudepreise nach Level & Typ (Items 1, 2, 9)

- **Level 1–3 bleiben günstig** (Straße 300, Kleines Haus 9.000, Sägewerk 11.000,
  Brunnen 6.500) — der Einstieg bleibt flüssig.
- **Ab Level 4 steigen die Kosten spürbar:** Farm 14k→28k, Steinbruch 22k→45k,
  Markt 30k→55k, Reihenhaus 34k→60k, Laden 46k→85k, Wasserpumpe 60k→130k,
  Logistikzentrum 105k→190k.
- **Große öffentliche Gebäude sind jetzt echte Stadtinvestitionen:** Feuerwehr
  90k→240k, Polizeiwache 95k→**520k**, Supermarkt 80k→340k, Kraftwerk 160k→480k,
  Windpark 120k→360k, Wasseraufbereitung 90k→260k, Bürokomplex 400k→**850k**,
  Wohnturm 420k→**900k**, **Krankenhaus 140k→2,2 Mio.**
- Große Gebäude haben zusätzlich **längere Bauzeiten** (Krankenhaus/Wohnturm 10
  min, Büro 9 min, Kraftwerk 8 min) — Investitionscharakter statt Impulskauf.
- Materialkosten (Holz/Stein) ziehen mit, damit Produktion & Fläche mitzählen.

### Level-Fortschritt deutlich verlangsamt (Item 3)

- Neue XP-Kurve: **L10 jetzt ~4.400 XP** (vorher 2.500), **L14 ~16.800**. L1–3
  gehen weiter schnell, danach kostet jedes Level deutlich mehr — Level-Ups
  fühlen sich wie Meilensteine an und späte Level spannen über mehrere Sessions.

### Anti-Spam für Bürgergebäude (Item 4)

- **Wohngebäude geben viel weniger XP:** Kleines Haus 10→5, Reihenhaus 20→8,
  Apartment 45→22, Wohnturm 70→35. Eine Häuserwand levelt **nicht** mehr hoch.
- Dafür geben **Meilensteine, Versorgung und Großprojekte deutlich mehr XP:**
  Markt 20→45, Supermarkt 34→80, Feuerwehr 40→85, Polizei 42→95, Krankenhaus
  52→**140**, Büro 90→**200**, Kraftwerk 55→120, Wasserpumpe 28→50.
- **Quest-XP stark erhöht** (die „Qualitäts"-Progression): Meilenstein-Quests
  geben jetzt bis zu 560 XP statt 150 — aktives Spiel treibt das Leveln, nicht
  Masse. XP ist jetzt Qualität, nicht Quantität.

### Lagerhaus-Spam verhindert (Item 7) — neuer generischer Mechanismus

- Lagerhaus-Basispreis 40k→85k **und** neues generisches `costScaling`: **jedes
  weitere Lagerhaus kostet 40 % mehr** als das vorige (85k → 119k → 167k …).
  Lagerkapazität ist damit eine bewusste Investition statt billiger Massenbau.
  Der Mechanismus ist config-only und später auf jedes Gebäude anwendbar.
- Das Baukarten-UI zeigt den **tatsächlich nächsten Preis** und „Jedes weitere
  kostet mehr".

### Einnahmen & Progression verbunden (Items 5, 10)

- Level-Up- und Quest-Geldbelohnungen steigen mit (L10-Reward 250k→500k, L14
  1,8 Mio.), damit die höheren Preise nicht frustrieren — Großprojekte bleiben
  ein Sparziel, aber erreichbar über Steuern, Gewerbe und Quests.

### UI für große Zahlen, Limits & Großprojekte (Item 11)

- Große Werte werden weiterhin kompakt formatiert (15.000, 1,2 Mio.).
- **Großprojekt-Kennzeichnung:** teure Gebäude tragen ein „Großprojekt"-Label.
  Kann man sie sich (noch) nicht leisten, erklärt die Karte **hilfreich** statt
  bloß „zu wenig Geld": „Mehr Einnahmen nötig. Aktuell X/min, empfohlen ~Y/min.
  Baue mehr Firmen-/Bürogebäude oder erhöhe deine Steuern."
- Bau-Limits zeigen weiterhin klar „x/max gebaut · mehr ab Level N".

### Balancing-Tests (Item 12)

- Neue Test-Suite `balancing.test.ts` sichert die Kernaussagen ab: früher
  Einstieg bezahlbar, Wohn-Spam levelt nicht, Lagerhaus wird teurer,
  Großprojekt-Erkennung + Einkommens-Empfehlung, XP-Qualität > Quantität.
- Kompatibilität: Kosten/XP liegen in Configs (nicht im Save) — **keine
  Save-Migration nötig**; bestehende Spielstände behalten ihr Level (Level wird
  nie gesenkt).

### Empfohlene nächste Balancing-Tests

- L4–6-Spielgefühl live prüfen (planen ohne Frust), Einkommens-Kurve gegen die
  neuen Preise messen, Krankenhaus-Sparzeit bei gut gebauter Wirtschaft prüfen.

## v0.14 — „MVP 2: Die erste echte Lieferkette (Trinkwasser)"

Die erste durchgehende **Produktions- und Versorgungskette**: aus Flusswasser
wird ein echtes, gelagertes **Trinkwasser-Produkt**, das transportiert, gelagert
und im Supermarkt an die Bürger verteilt wird (Items 2–4).

### Neue Ressource & Bedürfnis: Trinkwasser

- **Trinkwasser** ist eine echte, lagerbare Ressource (kein Hintergrund-Wert) —
  klar getrennt von der Wasser-*Infrastruktur* (Brunnen/Wasserwerk).
- **Neues Bedürfnis „Trinkwasser"** (ab L12): ein Konsum-Bedürfnis wie Essen,
  das aus dem verteilten Produkt gedeckt wird. Läuft über denselben generischen
  Konsum-Pfad — der Tick wurde dafür auf beliebige Ressourcen verallgemeinert
  (`consumesResource`), kein Sonderfall.

### Die Kette: Fluss → Werk → Lager/Supermarkt → Bürger

- **Wasseraufbereitung** (3×2, ab L11): muss **direkt an einem Fluss** stehen
  (neue generische `adjacentTerrain`-Regel). Produziert 40 Trinkwasser/min in
  einen eigenen Puffer, mit Jobs, Unterhalt und Strombedarf; profitiert wie jeder
  Produzent vom Logistikzentrum.
- **Lagerhaus** puffert jetzt auch Trinkwasser (die „Lager"-Stufe der Kette).
- **Supermarkt** (3×2, ab L12): der stärkere Nachfolger des Markts — verteilt
  **Essen UND Trinkwasser** an Wohnhäuser im Radius, lagert Trinkwasser und zeigt
  seinen belieferten Bereich über das generische Deckungs-Overlay.

### Sichtbarkeit

- Klick auf ein Verteilgebäude zeigt (über das bestehende Deckungs-Overlay)
  **welche Wohnhäuser versorgt sind und welche nicht**.
- **Trinkwasser-Anzeige im HUD**, sobald die Kette existiert (Lager vorhanden).
- Straßenanbindung bleibt Voraussetzung — ohne Anschluss keine Lieferung.

### Technik & generische Vorbereitung

- Reine Wiederverwendung: `produce`/`storage`/`distribution`/Konsum-Bedürfnis
  bilden die Kette; das Effekt-System hat den `inputsPerMinute`-Hook für spätere
  mehrstufige Ketten bereits. Save-Migration v6 → v7 ergänzt Ressource/Bedürfnis/
  Statistik. **Ausblick:** animierte Transport-Linien auf der Karte und
  Problem-Marker folgen im nächsten Schritt.

## v0.13 — „MVP 2: Balance & Rollen"

Ein Balancing-Pass, der Gebäude glaubwürdigere Größen und Rollen gibt und Sprawl
teurer macht.

### Wasserwerk-Ausbau (Item 1)

- **Wasserwerk-Limit 3 → 5** (gestaffelt: L7 max 2, L9 max 3, L11 max 5). Der
  Wert „3" war das Bau-Limit — größere Städte dürfen jetzt mehr Wasserwerke
  bauen. Wasser bleibt bedarfsgesteuert, wird also nicht überstark.

### Bürogebäude = echter Großarbeitgeber (Item 5)

- **Büro: 60 → 400 Arbeitsplätze** in kompakten 4×2. Ein Innenstadt-Turm, der
  ganze Distrikte beschäftigt. Da die Gewerbe-Einnahmen mit den **besetzten**
  Jobs skalieren, ist ein Büro ohne Einwohner zum Besetzen wenig wert — das
  balanciert die riesige Jobzahl von selbst. Kosten/Unterhalt/Strombedarf/
  Einnahmen entsprechend hoch, Limit knapp (max 1 → 4 mit Level).

### Wohnen neu austariert (Item 6)

- **Reihenhaus 20 → 24**, **Apartment 48 → 96** Bewohner — dichter und
  glaubwürdiger.
- **Neuer Wohnturm** (3×3, ab L12): bis **300 Bewohner**, damit eine Stadt ihre
  Bürotürme überhaupt bemannen kann. Hoher Wasser-/Strom-/Unterhaltsbedarf, und
  seine Bewohner reagieren stark auf ihr Umfeld — ein Turm ohne Parks drumherum
  ist ein trister Ort.
- **Schnelleres Wachstum** (Zuzug 4 → 10/min), damit die großen Kapazitäten in
  glaubwürdiger Zeit gefüllt werden.

### Sprawl kostet mehr (Item 7)

- **Sektor-Erweiterung deutlich teurer**: Basis 80k → **120k**, Distanz- und
  Mengenfaktor angehoben. Jeder Sektor kostet mehr, und je mehr man besitzt,
  desto teurer der nächste — in die Breite zu wuchern ist eine bewusste, teure
  Entscheidung. Gute, dichte Planung wird belohnt; Geld bleibt wertvoll.

## v0.12 — „MVP 2 Teil 4: Fluss-Distrikt"

Die erste **Fern-Expansion**: Am Fluss lässt sich ein eigener **Distrikt**
gründen — eine zweite Ausbaufläche mit eigenem Zentrum und eigenem Straßennetz,
fernab der Innenstadt (§8).

### Distrikt gründen

- Klick auf einen gesperrten **Fluss-Sektor** (ab Level 12) bietet die Option
  **„Fluss-Distrikt gründen"** an. Das große Einmalprojekt schaltet den Sektor
  als **eigenen Distrikt** frei und pflanzt ein **Distrikt-Zentrum** ans Wasser.
- Das Zentrum funktioniert wie ein kleines Rathaus: es lagert Waren, schafft ein
  paar Jobs, hebt die lokale Stimmung — und vor allem **setzt es ein eigenes
  Straßennetz**. So baut man am Fluss „quasi eine neue Stadt", ohne eine
  40-Felder-Straße aus der Innenstadt ziehen zu müssen.
- Angrenzende Sektoren werden anschließend Teil des Fluss-Distrikts (die
  Distrikt-Zugehörigkeit vererbt sich beim Freischalten).

### Technik

- Reine Wiederverwendung: das Straßennetz wurde schon immer aus **jedem**
  Distrikt-Zentrum geseedet (`computeRoadNetwork`), die Karte ist eine
  Sparse-Sektoren-Welt (§8). Neu sind nur ein `district_center`-Gebäude, ein
  `foundDistrict`-Command und die Option im Sektor-Dialog. Kein Save-Umbau nötig
  (Distrikte sind bereits im Schema).

### Damit ist der MVP-2-Gameplay-Kern beisammen

Energienetz, Notdienste, Steuer-Regler und die erste Fern-Expansion stehen. Was
noch offen ist (Cloud-Save/Login, Mobile-Layout, Besichtigungsmodus), hängt an
Infrastruktur-Entscheidungen und kommt später.

## v0.11 — „MVP 2 Teil 3: Steuer-Regler"

Der Bürgermeister bekommt echte fiskalische Kontrolle: zwei **Steuersätze**, die
sich direkt auf Einnahmen und Zufriedenheit auswirken. Der klassische SimCity-
Zielkonflikt — mehr Geld gegen weniger Laune.

### Steuersätze als Regler

- **Wohnsteuer** und **Gewerbesteuer** lassen sich in der Wirtschaftsübersicht
  zwischen **50 % und 150 %** einstellen (Regler ab Level 6).
- Höher = mehr Geld sofort, aber **weniger Zufriedenheit** (und damit weniger
  Zuzug und ein schlechterer Steuer-Faktor). Niedriger = Goodwill statt Geld.
- Die **Wohnsteuer** spüren die Bürger stark (bis −12 Zufriedenheit bei 150 %),
  die **Gewerbesteuer** wirkt sanfter (Geschäftsklima, bis −5). So ist die
  Gewerbesteuer der schonendere Hebel, wenn die Kasse klemmt.

### Technik

- Neues `policy`-Feld im Spielstand (Save-Migration v5 → v6, startet neutral),
  ein zentraler `setTaxRate`-Command; Einnahmen laufen weiter durch die eine
  `computeIncome`-Quelle, der Zufriedenheits-Malus wird im Tick verrechnet.

### Nächster MVP-2-Baustein

Die erste **Fern-Expansion ins Fluss-Biom** (Fernstraße + Distrikt).

## v0.10 — „MVP 2 Teil 2: Notdienste" (Polizei & Krankenhaus)

Die Stadt bekommt ein Sicherheitsnetz. Nach dem bewährten **Feuerwehr-Muster**
(radiusbasierte Deckung) kommen zwei neue Bedürfnisse dazu — ohne Sonderpfade,
dieselbe Coverage-Mechanik wie bei Freizeit und Feuerwehr.

### Zwei neue Bedürfnisse: Sicherheit & Gesundheit

- **Sicherheit** (ab L13) und **Gesundheit** (ab L14) sind radiusbasierte
  Deckungs-Bedürfnisse: Wohnhäuser im Einzugsradius sind versorgt, der Rest
  nicht — unversorgte Viertel drücken die Zufriedenheit.

### Zwei neue Gebäude

- **Polizeiwache** (ab L13, 2×2): Sicherheitsdeckung im Radius 11, Jobs,
  Unterhalt, Strombedarf. Limit bis max 4.
- **Krankenhaus** (ab L14, 3×2): Gesundheitsdeckung im Radius 11 — größerer
  Bau, höhere Betriebs- und Stromkosten als die Wache. Limit bis max 3.

### Progression

- **Level 13 & 14** neu (XP 5.800 / 7.200) mit **Quests „Für Ordnung sorgen"
  und „Gesunde Stadt"**. Save-Migration v4 → v5 ergänzt die neuen Bedürfnisse
  in alten Spielständen.

### Nächste MVP-2-Bausteine (geplant)

Steuer-/Mieten-Regler und die erste Fern-Expansion ins Fluss-Biom.

## v0.9 — „MVP 2 startet: Das Stromnetz" (Teil 1)

Erster Baustein von **MVP 2**: die Stadt bekommt ein **Energienetz**. Ab **Level 11**
verlangen Industrie, Gewerbe und dichte Wohnhäuser Strom — plötzlich ist Energie
ein neues Bedürfnis, und ohne Kraftwerk sinkt die Zufriedenheit. Genau der
„Level-up erzeugt das nächste Problem"-Motor (§4).

### Neues Bedürfnis: Energie

- **Energie** ist ein stadtweites Kapazitäts-Bedürfnis (wie Wasser, aber ohne
  Radius — ein Kraftwerk speist das ganze Netz). Der Bedarf kommt aus den
  Gebäuden selbst: Sägewerk, Steinbruch, Farm, Bäckerei, Wasserwerk, Markt,
  Laden, **Bürogebäude (30)**, Feuerwehr, Logistikzentrum, Reihenhaus und
  **Apartment (20)** ziehen Strom. Schaltet auf Level 11 frei.

### Zwei Kraftwerke mit echtem Trade-off

- **Kohlekraftwerk** (ab L11, 3×3): dichte, verlässliche Leistung (+250 Energie),
  aber es **verpestet** einen weiten Radius (Ambiente −3) und **frisst Geld als
  Brennstoff** (2.500/min Unterhalt). Die Standardantwort auf den L11-Engpass —
  bezahlt in Luftqualität und Cash. Limit gestaffelt bis max 4.
- **Windpark** (ab L12, 3×3): **sauber** (Ambiente +1), viel günstiger im
  Betrieb (800/min), liefert aber weniger (+120 Energie) und braucht Platz. Der
  grüne, flächenhungrige Weg: lieber mehrere statt eines dreckigen Kraftwerks.

### Progression

- **Level 11 & 12** neu (XP-Kurve 3.400 / 4.500), plus **Quests „Licht an" und
  „Sauberes Netz"**. Alte Spielstände werden migriert (Schema v3 → v4, Energie-
  Bedürfnis wird ergänzt).

### Nächste MVP-2-Bausteine (geplant)

Notdienste (Polizei/Krankenhaus nach dem Feuerwehr-Muster), Steuer-/Mieten-
Regler, weitere Level 13–20 und die erste **Fern-Expansion ins Fluss-Biom**.

## v0.8 — „Geld verdient man, Kosten spürt man"

Feintuning nach Spieler-Feedback: **Geld war zu viel, Kosten zu niedrig.** Leitidee
jetzt: Geld wird über **Herausforderungen (Quests) belohnend verdient** und über
**spürbar teurere Bauten** wieder ausgegeben — Rohstoffe sind der eigentliche
Engpass, fließen dafür aber schneller.

### Bau- & Rohstoffkosten deutlich erhöht

- **Geldkosten quer durch alle Gebäude angehoben** (~1,5× früh, bis ~2× spät):
  z. B. Kleines Haus 6.000 → **9.000**, Markt 20.000 → **30.000**, Laden 30.000 →
  **46.000**, Lagerhaus 26.000 → **40.000**, Feuerwehr 60.000 → **90.000**,
  Apartment 90.000 → **145.000**, Bürogebäude 120.000 → **185.000**. Bauen ist
  wieder eine Entscheidung, kein Rundungsfehler.
- **Rohstoffkosten (Holz/Stein) teurer** — Material ist jetzt der harte Engpass,
  nicht das Geld.

### Dafür: schnellere Produktion

- **Sägewerk 32 → 45**, **Steinbruch 26 → 38**, **Farm 30 → 42**, **Bäckerei
  9 → 14** pro Minute. Teurere Bauten, aber die Rohstoffe kommen schneller rein —
  wer aktiv einsammelt und verbaut, kommt gut voran.

### Geld über Herausforderungen, nicht AFK

- **Quest-Belohnungen kräftig erhöht** (grob +60 %): z. B. erste Straßen 6.000 →
  **8.000**, Markt-Quest 35.000 → **60.000**, Feuerwehr 70.000 → **130.000**,
  Metropole 250.000 → **400.000**. Wer die Herausforderungen aktiv abschließt,
  finanziert damit die nächste Ausbaustufe — deutlich lohnender als passives
  Farmen.

### Lagerhaus-Limit erhöht (4 → 10)

- Das **Lagerhaus-Limit steigt auf max 10** (gestaffelt: L6 max 3, L8 max 6,
  L10 max 10). Pro Lager weiterhin knappe 600 je Ressource + Geld-, Material- und
  Unterhaltskosten — ein echtes Logistikviertel ist jetzt möglich, bleibt aber
  eine Investition, kein Spam.

### Nächster Schritt

Danach geht es weiter mit **MVP 2** (Energie & Kraftwerke, Polizei/Krankenhaus
nach dem Feuerwehr-Muster, Level 11–20, Steuer-/Mieten-Regler, erste
Fern-Expansion ins Fluss-Biom).

## v0.7 — „Aktiv statt AFK: Lager, Limits, Arbeit & Logistik"

Balance-Kurskorrektur nach Spieler-Feedback (riesige Stadt, nur 1.450 Einwohner,
+251k/min, Lager spammbar, Arbeit bei 23 %). Leitbild jetzt klar wie SimCity/CoC:
**aktiv spielen wird belohnt, AFK-Farmen + Gebäude-Spam nicht.**

### Karten-Lesbarkeit zurückgestellt

- Gebäude wieder mit **2-Buchstaben-Kürzeln** (bessere Übersicht im Prototyp).
  Echte Gebäude-Modelle kommen mit der späteren 2.5D/3D-Ansicht.

### Lager umgedreht: knapp statt spammbar

- **Kleinere Caps, höhere Produktion:** Rathaus-Lager 1.000 → **400**, Lagerhaus
  2.000 → **600** je Ressource; Sägewerk 14 → **32**, Steinbruch 11 → **26**,
  Farm 15 → **30** pro Minute.
- **Lagerhaus jetzt limitiert** (max 4). Man kann sich kein 39.000-Puffer mehr
  zusammenspammen — Produktion läuft heiß, das Lager bleibt knapp, also lohnt es
  sich, zurückzukommen und die Rohstoffe zu **verbauen** statt sie zu horten.

### Mehr Grenzen gegen Spam

- Bau-Limits neu/erweitert: **Markt** (max 4), **Wasserwerk** (max 3),
  **Feuerwehr** (max 3), **Lagerhaus** (max 4), **Logistikzentrum** (max 3),
  **Bürogebäude** (max 5) — jeweils mit Level gestaffelt.

### Arbeitsplätze: Bürogebäude (4×2)

- Neues **Bürogebäude** (großes 4×2-Grundstück, 60 Arbeitsplätze, Gewerbeerlös,
  Unterhalt), ab Level 8. Löst den Arbeits-Engpass: eine reine Wohnstadt muss
  jetzt echte Arbeitgeber ansiedeln, nicht nur Häuser stapeln.

### Geld an eine ausbalancierte Stadt gekoppelt

- **Wohnsteuer 90 → 40 pro Kopf.** Rohe Einwohnerzahl druckt kein Geld mehr;
  der Ertrag kommt zunehmend aus **Gewerbe & Produktion**, die mit *besetzten*
  Arbeitsplätzen skalieren. Eine gut gezonte, beschäftigte Stadt verdient
  deutlich mehr als eine Häuserwand — Geld belohnt gute Planung, nicht AFK-Wachstum.

### Erste echte Logistik/Lieferkette (§1)

- Neues **Logistikzentrum** (3×3, ab Level 7): hebt den **Produktions-Ausstoß
  aller Produktionsgebäude im Radius um +25 %**. Läuft über denselben
  Produktions-Bonus-Pfad wie der Geländebonus — ein gut platziertes Depot bei den
  Sägewerken/Steinbrüchen/Farmen ist eine echte Planungsentscheidung. Limitiert
  (max 3), mit Jobs + Unterhalt.
- *Technisch:* generischer `logistics`-Effekt; Produzenten werden im derived-Layer
  in einem zweiten Pass aufgelöst, damit ein Depot Producer unabhängig von der
  Iterationsreihenfolge boostet. Kein Tick-Umbau nötig.

## v0.6 — „Endgame-Balance & saubere Karte"

Nach einer durchgespielten Nacht (Level 10, 7,3 Mio. Geld, Lager randvoll)
gezielt die Endgame-Schwächen adressiert — plus ein Karten-Look, der endlich
nach Stadt statt nach Tabelle aussieht.

### Karte: Gebäude als Glyphen statt Kürzel

- Der Renderer zeichnete Gebäude als abgeschnittene 2-Buchstaben-Namen
  („St", „Ap", „Re"). Jetzt echte Gebäude-Glyphen: Häuser mit Dach, Fenster-
  Raster und Tür (Fensterdichte skaliert mit der Grundfläche, Apartments wirken
  dichter), Produktion mit Schlot, Freizeit als Grünfläche mit Bäumen. Upgrade-
  Stufe bleibt an tieferem Dach + Pips ablesbar. Rein visuell.

### Lager skaliert mit der Stadt

- Holz/Stein/Essen liefen bei ~2.300 gegen eine harte Wand, Produktion verpuffte.
  Rathaus-Lager 300 → **1.000** je Ressource, Lagerhaus 200 → **2.000** je
  Ressource. Ein Lagerhaus lohnt sich jetzt wirklich, und die Obergrenze wächst
  mit der Stadt statt bei 2.300 zu ersticken.

### Unterhaltskosten: Einkommen wird netto (Geld-Sink)

- Große Städte ertranken in Geld (+221k/min, kein Ausgabeziel). Neu: ein
  generischer **`upkeep`-Effekt** — Gebäude kosten im Betrieb laufend Geld.
  Einkommen ist damit **netto = Einnahmen − Unterhalt**.
- Unterhalt liegt v. a. auf **Betriebs-Infrastruktur** (Läden, Märkte, Produktion,
  Wasserwerk, Feuerwehr, Lagerhaus, Parks) und skaliert bei Wohngebäuden mit der
  **Haushaltszahl** — er wächst also mit der Stadt, ohne das frühe Spiel zu
  erdrücken (Straßen kosten minimal pro Feld → sanfter Druck zu kompakten
  Layouts).
- **UI:** Kopfleisten-Geld zeigt jetzt das **Netto**-Einkommen (rot bei Defizit);
  Wirtschaftspanel und Geld-Popover schlüsseln Einnahmen → Unterhalt → Netto auf.
- *Technisch:* Aggregiert im derived-Layer (`upkeep`), verrechnet in der einen
  `computeIncome`-Quelle; der Tick bucht `netto × dt` und floored Geld bei 0.
- *Hinweis:* Erster Balancing-Durchlauf mit runden Werten — die exakte Netto-
  Quote lässt sich später an echten Spielständen feinjustieren (alle Werte in
  `buildings.config`).

### Der eigentliche Endgame-Fix bleibt Content

- Level 10 ist die Content-Decke (bewusster Cliffhanger). Der nächste Schritt
  ist MVP-2-Inhalt (Level 11+, Fluss-Distrikt, Notdienste, Energie) — dann
  bekommt das Geld wieder echte Ausgabeziele.

## v0.5 — „UI/UX-Überarbeitung: modernes City-Builder-Gefühl"

Ein durchgehender Oberflächen-Pass in Richtung eines hochwertigen, modernen
Aufbau-Spiels. Die Spielmechanik bleibt unverändert — neu sind Darstellung,
Interaktion und ein Baukasten wiederverwendbarer UI-Bausteine. Keine Emojis,
durchgängig SVG-Icons; die Spiellogik bleibt strikt von React/Pixi getrennt.

### Wiederverwendbare Komponenten-Basis (§15)

Neu als eigenständige, kombinierbare Bausteine — nicht als Einmal-Widgets:
`Popover`, `Modal`, `ConfirmModal`, `EventModal`, `ResourceBadge`,
`ResourceDetailPopover`, `ActionBubble`, `BuildingPreview`, `FloatingBuildingSheet`,
`EconomyPanel`, `CityStatusPanel` sowie ein zentrales Icon-Modul
(`common/icons.tsx`). Ressourcen-, Bedürfnis- und Kategorie-Icons haben jetzt
**eine** Quelle der Wahrheit — ein neues Icon ist eine Zeile, keine Suche durch
die Komponenten.

### Kopfleiste: Ressourcen-Badges mit Detail-Popover (§2, §12)

- Jede Ressource ist ein **anklickbares Badge** mit Farbakzent; ein Klick öffnet
  ein **Detail-Popover** (Bestand vs. Lagerkapazität als Balken, Produktion pro
  Minute, kurze Erklärung „woher kommt das?").
- Das **Geld-Badge** zeigt das Netto-Einkommen und verlinkt direkt in die
  Wirtschaftsübersicht.

### Gebäude-Interaktion: schwebendes Sheet + Aktions-Bubbles (§3, §4, §13)

- Das Gebäude-Panel ist jetzt ein **schwebendes Sheet über der Karte** statt
  eines abdunkelnden Vollbild-Dialogs — die Stadt bleibt sichtbar.
- Beim Anklicken **zentriert die Kamera sanft** auf das Gebäude (weiche
  Ease-Animation; jede manuelle Geste bricht sie ab).
- Aktionen (Upgrade, Verschieben/Umsetzen, Abriss) sind **runde Aktions-Bubbles**
  im Tonfall der Aktion; Abriss läuft über den gemeinsamen `ConfirmModal`.

### Visuelles Baumenü mit Mini-Vorschau (§5, §12)

- Jede Gebäudekarte zeigt eine **programmatische Mini-Vorschau** (Gebäude-Körper
  mit Fenstern, Straßen als Fahrbahn, Grün als Laub) — dieselbe Bildsprache wie
  auf der Karte, ganz ohne Assets, gestochen scharf in jeder Größe.

### Stadt-Status: umsetzbare Hinweise (§10)

- Neues **Stadt-Status-Panel**: zuerst **anklickbare Alarme** (Bedürfnis niedrig,
  Lager voll, Quest-Belohnung wartet) — jeder Alarm führt direkt zur Lösung
  (ins Baumenü mit vorgewähltem Gebäude bzw. ins passende Panel) —, darunter die
  vollständige Bedürfnis-Aufschlüsselung mit Balken.

### Wirtschaftspanel (§11)

- Eigenes **Wirtschaftspanel** mit Einnahmen-Split (Wohnen/Gewerbe/Produktion)
  als Balken, Gesamtsumme und Beschäftigungsgrad. Liest ausschließlich die
  bestehende `computeIncome`-Quelle — keine Zahl wird im UI nachgerechnet.

### Vereinheitlichtes Popup-System (§9)

- **Toast** (flüchtig) · **EventModal** (bestätigungspflichtige Momente wie
  Level-Up und neuer Sektor, datengetrieben aus einer UI-Event-Queue) ·
  **ConfirmModal** (destruktive Aktionen). Alle bauen auf einer gemeinsamen
  `Modal`-Hülle auf.

### Karten-Interaktion (§7, §13)

- **Straßen per Ziehen bauen:** Mit gedrückter Maustaste über die Karte fahren
  legt einen ganzen Straßenzug; Überlappungen bleiben stumm, echte Blocker
  (Geld, gesperrter Sektor) melden sich einmalig.
- **Kamerafokus** beim Auswählen (siehe oben).

### Bewusst als nächste Schritte offen

Karten-verankerte Aktions-Blasen, die ein Gebäude beim Verschieben der Karte
mitverfolgen, echte Gebäude-Sprites und der Besichtigungsmodus bleiben spätere
Ausbaustufen — die Komponenten-Basis ist darauf ausgelegt.

## v0.4 — „Wirtschaft, Wohnraum & Versorgung"

Ein zusammenhängender System-Pass: glaubwürdige Geldgrößen mit mehreren
Einnahmequellen, ein echtes Wohn-/Bevölkerungsmodell, ein generisches
Versorgungs-Overlay und verschiebbare Spezialgebäude. Alle Werte liegen in
Configs; die Spiellogik bleibt frei von React/Pixi.

### Wirtschaft auf glaubwürdiger Größenordnung (§3–§5)

- **Geld läuft jetzt auf Stadt-Maßstab** statt zweistelliger Spielgeld-Beträge:
  kleines Haus 6.000, Reihenhaus 22.000, Apartment 90.000, Markt 20.000,
  Wasserpumpe 40.000, Sektor-Freischaltung ab ~80.000. Startkapital 45.000.
- **Materialien (Holz/Stein/Essen) bleiben kleinskalig** — dadurch sind sie ein
  *eigener* Engpass neben Geld: Geld kauft den Bauplatz, Material und Versorgung
  begrenzen, *was* du baust. Geld blockiert nicht mehr jede Aktion (§3).
- **Mehrere Einnahmequellen statt nur Miete** (§5), als generischer `revenue`-
  Effekt: **Wohnen** (Grundsteuer pro Kopf, zufriedenheitsabhängig), **Gewerbe**
  (Läden/Markt, skaliert mit besetzten Arbeitsplätzen) und **Produktion**
  (Industrieabgaben). Neue Quellen (Tourismus, Transport) sind reine Config.
- **Neues Finanz-/Wirtschaftspanel** im Bürgermeister-Tab zeigt Einnahmen pro
  Minute nach Quelle + Beschäftigungsgrad — „woher das Geld kommt" auf einen
  Blick. In der Kopfleiste steht das Netto-Einkommen pro Minute am Geldwert.
- **Zahlenformat** `formatMoney`: 12.500 · 250.000 · 1,2 Mio. · 1,2 Mrd.
- *Technisch:* `economy/income.ts` (`computeIncome`) ist die einzige Quelle der
  Wahrheit — Tick und UI rechnen identisch.

### Echtes Wohn- & Bevölkerungsmodell (§6/§7)

- Wohngebäude bestehen jetzt aus **Wohnungen × Bewohner pro Wohnung**
  (generischer `housing`-Effekt) statt einer einzelnen Zahl:
  - **Kleines Haus** – 1 Wohnung, bis 5 Bewohner: Vorstadt, hohe Wohnqualität,
    reagiert stark auf Grün & Industrie in der Nähe.
  - **Reihenhaus** – 5 Wohnungen (bis 20 Bewohner): dichter, höhere Versorgungs-
    und Wassernachfrage.
  - **Apartment** – 16 Wohnungen (bis 48 Bewohner): hohe Verdichtung, braucht
    Infrastruktur & Parks.
  - Haus-Upgrades erhöhen Wohnungen und Bewohner sichtbar.
- Einwohnerzahl ergibt sich aus **tatsächlicher Belegung**: mehr Wohnraum füllt
  sich nur nach und nach und nur bei guter Versorgung/Zufriedenheit. Die
  Kopfzeile zeigt „Einwohner / Kapazität" + Wohnungszahl.
- **Haustyp-Profile** wirken spürbar über `ambienceSensitivity` (Vorstadt
  gewichtet Umgebungsqualität stärker) und unterschiedlichen Wasserbedarf.
- Wasserbedarf kommt jetzt **vollständig aus den Häusern** (skaliert mit Typ &
  Ausbaustufe), nicht mehr aus einer pauschalen Pro-Kopf-Zahl.

### Generisches Versorgungs-Overlay (§1)

- **Ein System für alle Versorgungsarten** (`buildings/coverage.ts`): Klick auf
  ein Versorgungsgebäude zeigt **alle Gebäude desselben Typs** samt Radien und
  markiert jedes Wohngebäude nach Zustand — *versorgt*, *mehrfach versorgt*,
  *unterversorgt* (Kapazität reicht nicht) oder *nicht versorgt*. Das
  ausgewählte Quellgebäude ist hervorgehoben.
- Funktioniert ohne Sonderlogik für Wasser, Freizeit, Essen-Verteilung und
  Brandschutz — und ist damit für Polizei/Gesundheit/Bildung/Umwelt/ÖPNV
  vorbereitet (nur neue Config nötig).
- Halbtransparente Flächen + Status-Punkte über den Gebäuden + **Legende** unten
  links; Überlappungen bleiben lesbar.

### Verschiebbare Spezialgebäude (§2)

- Normale Gebäude bleiben **nach dem Bau unverschiebbar** (abreißen & neu bauen).
- **Nicht abreißbare Spezialgebäude** (Rathaus, Bürgermeisterhaus) sind dafür
  über eine eigene Aktion im Gebäude-Sheet **verschiebbar** — Fehlplatzierungen
  beschädigen den Spielstand nicht mehr dauerhaft. Platzierungsregeln
  (Straße, Untergrund, freier Platz) werden erneut geprüft; optionale Gebühr
  (`relocationCost`) per Config. Steuerung über `canDemolish`/`canRelocate`.

### Migration

- Save-Schema **v2 → v3**: gespeichertes Geld wird ×100 skaliert, damit alte
  Spielstände ihren relativen Wohlstand behalten. Wohn-/Einkommensmodell ist
  config-abgeleitet und greift automatisch.

### Für später vorbereitet

Generischer `revenue`-Effekt (weitere Einnahmearten), generisches
Coverage-System (weitere Versorgungsbedürfnisse), `housing`-Modell (Hochhäuser
mit hoher Verdichtung), `canRelocate` (Distrikt-Zentren).

---

## v0.3 — „Stadtplanung mit Konsequenzen"

Großer Balancing- und Planungs-Pass: Produktionsgebäude sind jetzt wertvoll
statt Spam, Bürger sind anspruchsvoller, Standort und Nähe zählen mehr, und
Fehlplatzierungen haben Konsequenzen (kein freies Verschieben mehr). Alle
neuen Stellschrauben liegen in Configs.

### Gebäude-Limits pro Level (kein Spam mehr)

- **Produktionsgebäude haben jetzt eine Obergrenze, die mit dem Level wächst**
  (`buildLimit` pro Gebäude in `buildings.config.ts`):
  - Sägewerk: 2 (L2) → 3 (L5) → 5 (L8)
  - Steinbruch: 2 (L4) → 3 (L7) → 4 (L10)
  - Farm: 2 (L4) → 3 (L6) → 5 (L9)
  - Kleiner Laden: 2 (L6) → 4 (L9); Bäckerei: 2 (L9)
- **Wohnhäuser, Straßen und Dekoration bleiben unbegrenzt baubar** (§13) — das
  Wachstum wird durch Versorgung/Bedürfnisse gesteuert, nicht durch harte Caps.
- Erreichtes Limit ist klar sichtbar: Zähler „2/2 gebaut · mehr ab Level 7" auf
  der Baukarte (ausgegraut), und beim Platzierungsversuch ein deutlicher Toast
  „Limit erreicht: Mehr Sägewerke ab Level 7."
- *Technisch:* reines Config-Feld + Helfer `buildLimitAt`/`countOf`/`nextLimitLevel`
  (`buildings/limits.ts`); Platzierung prüft `limit_reached`; `getBuildLimit()`
  am Controller liefert der UI Stand/Cap/nächstes Level.

### Produktion neu balanciert (weniger Gebäude, mehr Wert)

- Sägewerk **9 → 14 Holz/min**, Steinbruch **6 → 11 Stein/min**, Farm
  **10 → 15 Essen/min**, Bäckerei **6 → 9**, Kleiner Laden **4 → 6 Geld/min**.
- Wenige, gut platzierte Betriebe reichen jetzt für eine sinnvolle Produktion;
  Standortboni (Wald/Gebirge/Boden) wiegen dadurch schwerer.

### Bürger werden anspruchsvoller (Zufriedenheit realistischer)

- **Erwartungs-Inflation:** Mit jedem Level steigt der Bedarf pro Bedürfnis um
  4 % (`needExpectationPerLevel`). Eine wachsende Stadt muss weiter investieren —
  Zufriedenheit klebt nicht mehr bei 100 %, eine gut geplante Stadt liegt eher
  bei 70–90 %.
- **Wasserbedarf nach Haustyp/-stufe:** Wohnhäuser stellen jetzt eigenen
  Wasserbedarf (neuer, generischer `demand`-Effekt): Kleines Haus 3 → 7 → 13 je
  Ausbaustufe, Reihenhaus 9, Apartment 24. Größer/höher ausgebaut = mehr
  Wasserdruck (§3/§4).
- Beides zusammen macht Unterversorgung spürbar und Überversorgung nicht
  automatisch perfekt.

### Nähe & Radien wichtiger

- **Marktplatz verteilt Essen nur noch im Radius 9** (statt stadtweit): Nur
  Wohnhäuser in Reichweite bekommen volle Versorgung, der Rest fällt auf den
  Ohne-Markt-Deckel zurück. Markt gehört jetzt mitten ins Wohngebiet (§8).
- **Rathaus gibt einen kleinen Attraktivitäts-Bonus** an die direkt umliegenden
  Blocks (Ambience +2, Radius 3) — läuft über dieselbe Zoning-/Ambience-Mechanik
  wie Parks (§9).
- **Farm** wirkt sich jetzt (leicht) negativ auf direkte Wohnnähe aus
  (Ambience −1), wie Sägewerk/Steinbruch — Wohn- und Industriegebiete trennen
  lohnt sich mehr (§11/§12). Ambience-Deckel auf Zufriedenheit **15 → 20**, damit
  Grünflächen stärker zählen.
- Radius wird beim Platzieren/Anklicken weiterhin als Overlay angezeigt.

### Verschieben deaktiviert, Abriss inszeniert

- **Gebäude lassen sich nach dem Bau nicht mehr verschieben** (§5): realistische
  Planung, Fehlplatzierung hat Konsequenzen. Der Info-Dialog erklärt: „Gebäude
  können nach dem Bau nicht verschoben werden. Reiße es ab und baue es neu."
  Verschiebe-Button und Gedrückt-Halten-Geste sind aus (Feature-Flag
  `features.moveBuildings` — Engine-Befehl bleibt für später erhalten).
- **Abriss-Rückerstattung 50 % → 25 %** (`demolishRefundFactor`, konfigurierbar):
  Umplanen bleibt möglich, kostet aber etwas.
- **Abriss-Animation:** kleine Staubwolke am Gebäudeplatz; die
  Rückerstattung erscheint weiter als Toast.

### Expansion inszeniert

- **Neues Gebiet freischalten** blitzt jetzt sichtbar auf dem neuen Sektor auf
  und zeigt ein zentrales Popup „Neues Gebiet freigeschaltet" (§7) — Expansion
  fühlt sich belohnend an statt nur ein UI-Zustand zu wechseln.

### Spielplatz & Grün

- **Spielplatz ist jetzt 2×2** statt 1×1 (§10) — Freizeitplanung braucht Platz.
- Parks, Spielplatz, Bäume und der Rathaus-Bonus verbessern über Ambience die
  Wohnqualität und damit die Zufriedenheit (§11).

### Für später vorbereitet (Architektur)

- **Generischer `demand`-Effekt** und **radiusbasierte `distribution`** sind so
  angelegt, dass weitere Bedürfnisse (Strom, Sicherheit, Gesundheit, Bildung)
  und Verteil-Dienste reine Config-Einträge werden.
- Produktionsketten bleiben über `inputsPerMinute` vorbereitet (Verbrauch →
  Produktion, im Tick implementiert); Logistik/Verkehr kann später als
  Modifikator auf Produktion/Verteilung aufsetzen, ohne neue Struktur.

### Balancing-Referenz (geänderte Werte)

| Wert | vorher | jetzt |
|---|---|---|
| Sägewerk | 9 Holz/min | 14 Holz/min |
| Steinbruch | 6 Stein/min | 11 Stein/min |
| Farm | 10 Essen/min | 15 Essen/min |
| Bäckerei | 6 Essen/min | 9 Essen/min |
| Kleiner Laden | 4 Geld/min | 6 Geld/min |
| Abriss-Rückerstattung | 50 % | 25 % |
| Ambience-Deckel (Zufriedenheit) | ±15 | ±20 |
| Erwartung pro Level | — | +4 % Bedarf |
| Wasserbedarf Kl. Haus (Stufe 0/1/2) | 0 | 3 / 7 / 13 |
| Markt-Verteilung | stadtweit | Radius 9 |
| Rathaus-Aura | — | Ambience +2, Radius 3 |
| Spielplatz | 1×1 | 2×2 |

### Was als Nächstes testen

- Sehr frühes Spiel (L1–3): fühlt sich das Sammeln mit 1–2 Sägewerken flott an?
- Nach vielen Wohnhäusern ohne Brunnen/Pumpe: sinkt die Zufriedenheit spürbar?
- Markt weit weg vs. mitten im Wohngebiet: Unterschied bei „Essen"?
- Produktionsgebäude direkt neben Wohnhäusern: Ambience-Malus sichtbar?
- Produktions-Limit erreichen: klare Meldung, Karte ausgegraut?
- Abriss + neues Gebiet freischalten: Animationen und Popups sichtbar?
- Nach längerer Offline-Zeit: Lager gedeckelt, keine Wunderwerte.

## v0.2.2 — „Wohnen mit Aussicht" (Zoning aktiv)

- **Wohnqualität wirkt jetzt auf die Zufriedenheit.** Die bisher nur berechnete
  Umgebungsqualität (`ambience`) ist jetzt ein echter Spielfaktor: Wohnhäuser
  in der Nähe von **Parks und Dekoration** werden zufriedener, Wohnhäuser neben
  **Industrie** (Sägewerk, Steinbruch) unzufriedener. Damit wird das Trennen von
  Wohn- und Industriegebieten (§12) eine echte Planungsentscheidung statt bloßer
  Vorbereitung.
  - *Wirkung:* stadtweiter, wohnraum-gewichteter Ambience-Schnitt × Faktor,
    gedeckelt auf ±15 Zufriedenheitspunkte (`ambienceHappinessPerPoint`,
    `ambienceHappinessCap` in `balancing.config.ts`).
  - *Sichtbar:* neue Zeile „Wohnqualität" im Zufriedenheits-Panel mit
    Punktbeitrag und Hinweis („… trenne Wohn- und Industriegebiete"); der
    Gebäudedialog zeigt die Umgebung pro Wohnhaus weiterhin einzeln.
  - *Technisch:* `avgAmbience` wird in `derived.ts` einmal pro Strukturänderung
    aggregiert (Tick bleibt O(1) dafür); der Tick addiert den gedeckelten
    Beitrag zur Zufriedenheit. Wohlstands-abhängige Gewichtung (reiche Bürger
    meiden Industrie stärker) kann später als Faktor auf denselben Wert
    aufsetzen — keine neue Struktur nötig.

## v0.2.1 — „Umbauen ohne Reue"

- **Abreißen erstattet Material zurück.** Beim Abriss gibt es **50 %** der
  investierten Bau- **und** Ausbaukosten zurück (pro Ressource abgerundet, Geld
  uneingeschränkt, Material im Rahmen der Lagerkapazität). Der
  Abriss-Bestätigungsdialog zeigt die Rückerstattung vorab an, ein Toast
  bestätigt sie danach.
  - *Warum:* Umplanen soll ein Werkzeug sein, keine Bestrafung. Der 50-%-Abschlag
    verhindert nur, dass Bauen–Abreißen–Schleifen kostenlos sind.
  - *Technisch:* `demolishRefundFactor` in `balancing.config.ts`; reine Funktion
    `demolishRefund(def, upgradeLevel, factor)` (in `buildings/effects.ts`);
    Rückerstattung läuft über den `EconomyService` (`grantResources`), also
    denselben Buchungsweg wie jede andere Gutschrift. `getDemolishRefund()` am
    Controller liefert der UI die Vorschau.
- **Verschieben direkt aus der Auswahl.** Ein ausgewähltes Gebäude lässt sich
  über den „Verschieben"-Button im Info-Dialog aufheben und neu platzieren
  (zusätzlich zum Gedrückt-Halten auf der Karte). Verschieben bleibt kostenlos.

## v0.2 — „Stadtplanung statt Warten"

Ziel dieses Updates: weniger AFK-Wartespiel, mehr aktives Planen und Gestalten.
Geld ist nicht mehr der einzige limitierende Faktor — Fläche, Straßennetz,
Versorgungsradien, Ressourcenlogistik und Standortwahl entscheiden über die
Entwicklung der Stadt.

### Wirtschaft & Ressourcen

- **Kein manuelles Einsammeln mehr.** Produktionsgebäude liefern automatisch
  ins Stadtlager. Volle Lager stoppen die Produktion — Lagerhäuser sind jetzt
  eine echte Ausbau-Entscheidung. Die Kopfleiste zeigt pro Ressource
  Bestand/Kapazität und (per Tooltip) die Produktionsrate; volle Lager werden
  gelb hervorgehoben.
  - *Warum:* Das Abklicken von Ertrags-Bubbles war reine Beschäftigung ohne
    Entscheidung. Der frei gewordene Klick-Fokus liegt jetzt auf Planung.
  - *Technisch:* Produktion bucht im Tick direkt über die Storage-Caps;
    `stats.produced` ersetzt `stats.collected` (Quests zählen produzierte
    statt eingesammelte Mengen). Alte Spielstände werden migriert
    (Schema v1 → v2), ungesammelte Puffer werden einmalig gutgeschrieben.
- **Produktionswerte erhöht** — weniger Gebäude-Spam nötig: Sägewerk
  6 → 9 Holz/min, Steinbruch 4 → 6 Stein/min, Farm 8 → 10 Essen/min,
  Bäckerei 5 → 6 Essen/min.
- **Gelddominanz reduziert:** Steuern 0,5 → 0,3 pro Bürger/min, Steuerfaktor
  hängt stärker an der Zufriedenheit (0,35×–1,5×). Der Kleine Laden erzeugt
  4 statt 8 Geld/min. Baukosten mittlerer Gebäude verlangen mehr Holz/Stein.
  Idle-Einkommen allein trägt den Ausbau nicht mehr — produzieren, versorgen
  und expandieren schon.

### Standortvorteile (neu)

- Produktionsgebäude erhalten **Terrain-Boni** (config-gesteuert über
  `locationBonus` in `buildings.config.ts`):
  - Sägewerk: +5 % pro Waldtile im Umkreis 3 (max. +50 %)
  - Steinbruch: +8 % pro Gebirgstile im Umkreis 3 (max. +60 %)
  - Farm: +4 % pro fruchtbarem Boden im Umkreis 2 (max. +40 %)
- Überbaute Tiles zählen nicht — wer den Wald ums Sägewerk zubaut, verliert
  den Bonus.
- **Sichtbar gemacht:** grüner Badge am Gebäude, Bonus-Prozente live in der
  Platzierungsvorschau (grünes Banner), Bonuszeile im Gebäudedialog und
  Hinweis auf der Baukarte („Bonus in der Nähe von: Wald").

### Brunnen & Versorgung mit Radius

- Brunnen (Radius 7) und Wasserpumpe (Radius 12) versorgen **nur noch
  Wohnhäuser in ihrem Umkreis**. Gesamtkapazität × abgedeckter
  Wohnraum-Anteil = Wasser-Erfüllung.
- Beim Platzieren und beim Anklicken wird der Radius als Overlay eingeblendet
  (ebenso für Parks, Feuerwehr und Dekorations-Auren).
- *Technisch:* Capacity-Effekte können ein `radius`-Feld tragen; die
  Coverage-Berechnung ist generisch pro Bedürfnis (`needCoverage` in
  `derived.ts`) — künftige radiusbasierte Dienste (Polizei, Krankenhaus,
  Schule) sind reine Config-Einträge.

### Straßen-Autotiling

- Straßen verbinden sich jetzt sichtbar: Gehweg-Rahmen, Asphaltkörper,
  Mittelstreifen auf Geraden, Kurven-Markierung in Ecken, T-Kreuzungen und
  **Kreisverkehr-Optik** bei Vierfach-Kreuzungen. Straßen docken optisch am
  Rathaus an.
- *Warum:* Die Stadt soll geplant und urban wirken, nicht wie gewürfelte
  Blöcke.

### Gebäude verschieben (neu)

- **Gedrückt halten (~0,3 s) hebt ein Gebäude auf**, ziehen und klicken setzt
  es ab. Alternativ: „Verschieben"-Button im Gebäudedialog. Rechtsklick/ESC
  bricht ab.
- Verschieben ist kostenlos — Umplanen wird nicht bestraft. Auch das Rathaus
  darf umziehen (nur Abriss bleibt für einzigartige Gebäude gesperrt).
- Während des Tragens: Original ausgegraut, Ghost mit Gültigkeits-Färbung,
  Radius-Vorschau und großem Feedback-Banner.

### Platzierungs-Feedback

- **Großes zentrales Banner** statt kleiner Toasts: zeigt beim Bauen und
  Verschieben live den konkreten Grund („Braucht Anschluss an eine verbundene
  Straße", „Dieser Sektor ist noch gesperrt", …), grün bei gültiger Position,
  inklusive Standortbonus-Anzeige.

### Sichtbare Ausbaustufen

- Ausgebaute Gebäude zeigen **Stufen-Pips** auf dem Dach, ein tieferes
  Dachband und eine kräftigere Kontur. Im Gebäudedialog zeigt eine
  Pip-Leiste Stufe und Maximum.

### Gebäudedialog & UI

- Gebäude-Infos erscheinen als **zentrierter, großer Dialog** mit Icons pro
  Effekt, Produktionsrate inkl. Bonus, Umgebungsqualität, Bauzeit-Status und
  klar getrennten Aktionen (Verschieben / Ausbauen / Abreißen mit
  Inline-Bestätigung statt Browser-Popup).
- **Baumenü:** Karten mit Kosten-Chips (Icons statt Textwüste), Bauzeit,
  Footprint-Größe, Effektzeile, Standortbonus-Hinweis und Schloss-Symbol für
  gesperrte Gebäude; sortiert nach Freischalt-Level; Schließen-Button.
- Größere Toasts, mehr Abstand in den Leisten, Lager-voll-Warnung in der
  Kopfleiste.

### Karte

- **Weiher im Nachbarsektor (West/Süd):** kleiner See mit Sandufer in Sektor
  (0,2). Das Ufer bleibt bebaubar und ist für spätere Wasser-Gameplay-Gebäude
  (Fischerhütte, Kajak-Verleih) reserviert — Anbindung ans Biome-/Effekt-
  System ist vorbereitet.
- **Gebirgszug am Westrand** als Ziel für Steinbruch-Boni.
- Berge, Seen und Flüsse haben erkennbare Tile-Details. Bestehende
  Spielstände erhalten das neue Terrain per Migration (nur unbebaute Tiles
  werden neu abgeleitet).

### Vorbereitet für später (Architektur, bewusst noch ohne Gameplay)

- **Produktionsketten:** `produce`-Effekte unterstützen `inputsPerMinute` —
  ein Gebäude kann Ressourcen verbrauchen und skaliert seine Produktion mit
  der Input-Verfügbarkeit. Getriebe für Weizen → Bäckerei, Erz → Fabrik ist
  im Tick implementiert; Logistik über Auto/Schiff/Flugzeug kann später als
  Modifikator auf dieselbe Schnittstelle aufsetzen.
- **Wohn-/Industrietrennung:** neuer `ambience`-Effekt (positiv: Parks,
  Dekoration; negativ: Sägewerk, Steinbruch). Die Umgebungsqualität wird pro
  Wohnhaus berechnet und im Gebäudedialog angezeigt — die spätere
  Wohnattraktivität (wohlhabende Bürger meiden Industrienähe) braucht nur
  noch eine Formel, keine neue Datenstruktur.

### Balancing-Referenz (geänderte Werte)

| Wert | vorher | jetzt |
|---|---|---|
| Steuern pro Bürger/min | 0,5 | 0,3 |
| Steuerfaktor (Zufriedenheit) | 0,5–1,5× | 0,35–1,5× |
| Sägewerk | 6 Holz/min | 9 Holz/min (+Waldbonus) |
| Steinbruch | 4 Stein/min | 6 Stein/min (+Gebirgsbonus) |
| Farm | 8 Essen/min | 10 Essen/min (+Bodenbonus) |
| Bäckerei | 5 Essen/min | 6 Essen/min |
| Kleiner Laden | 8 Geld/min | 4 Geld/min |
| Brunnen | global | 25 Wasser, Radius 7 |
| Wasserpumpe | global | 90 Wasser, Radius 12 |
| Kleines Haus | 50 G, 10 H | 50 G, 15 H |
| Reihenhaus | 180 G, 50 H, 20 S | 160 G, 60 H, 30 S |
| Apartmenthaus | 520 G, 80 H, 120 S | 450 G, 100 H, 140 S |
