# Patch Notes

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
