# Patch Notes

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
