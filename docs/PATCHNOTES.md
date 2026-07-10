# Patch Notes

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
