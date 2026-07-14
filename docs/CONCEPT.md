# Spielkonzept „Stadt & Bürgermeister" (Arbeitstitel) — Planungsdokument v2

> **Status:** Reines Konzept, keine Implementierung. Grundlage für spätere MVP-1-Umsetzung.
> **Repo:** leonmudsam/City-Mayor-Builder-Arbeitstitel- (aktuell leer, grüne Wiese)
> **Branch:** claude/city-builder-concept-w2f70y
>
> **Änderungen in v2 (nach Feedback):**
> 1. Welt ist **open-end**: unbegrenzt erweiterbar, auch nach dem letzten Level.
> 2. **Keine Zweitstädte** — eine Hauptstadt, die über Fernstraßen/Bahnlinien in entfernte Biome hineinwächst (Fern-Distrikte gehören zur Hauptstadt).
> 3. **Kartenmaßstab deutlich vergrößert** (Sektoren-System, mehrere hundert Gebäude pro Biom).
> 4. **Gold/Shop/Transaktionen nach hinten geschoben**, Gameplay-Features dafür früher.
> 5. **UI ohne Emojis** — professionelle Icon-Bibliothek, geordnete Button-Gruppen, moderner Look.

---

## 0. Kontext

Ziel ist ein Städtebau-Spiel (Inspiration: SimCity, Anno, Clash of Clans, RCT) mit dem Spieler als Bürgermeister. Erste Version: statische Web-App auf GitHub Pages, ohne Backend, mit lokalem Spielstand. Die Architektur muss so geschnitten sein, dass Login, Cloud-Saves, echtes Payment und langfristig Mobile/PC ohne Grundumbau möglich sind. Dieses Dokument ist das vollständige Grundkonzept: Vision, Gameplay-Loop, MVP-Abgrenzung, Systeme, Architektur, Datenmodelle, Repo-Struktur, Deployment und Roadmap.

---

## 1. Kritische Einschätzung (ehrlich)

**Die Idee ist gut, aber der beschriebene Umfang ist ein Mehrjahresprojekt.** Das ist kein Problem, solange wir radikal priorisieren:

1. **Zu groß für den Anfang:** Flughafen, Hafen, Skigebiet, Surfen, Inseln, Tourismus, Events, Leaderboards, POV-Modus, Verkehrssimulation. Alles gute Roadmap-Punkte — nichts davon gehört in die ersten Monate. Gefahr: 20 Systeme zu 30 % statt 5 Systeme zu 100 %.
2. **Der Kern ist klein und stark:** Bauen → Produzieren → Bedürfnisse erfüllen → Zufriedenheit → Wachstum → Expansion. Wenn dieser Loop in 10 Minuten Spaß macht, trägt er alles Weitere.
3. **Die Bürgermeister-Rolle ist das echte Alleinstellungsmerkmal** und muss früh sichtbar sein (ab Level 3, nicht Level 20).
4. **Open-End-Welt ist die richtige Entscheidung** — sie macht Expansion zum Endgame-Motor statt eines künstlichen Endes. Sie kostet aber Architektur-Disziplin ab Tag 1: Die Karte darf nie als festes Array geplant werden, sondern als wachsende Sektoren-Struktur (§8). Wird das im MVP falsch gebaut, ist es später der teuerste Umbau des Projekts.
5. **GitHub-Pages-Strategie ist richtig** für den Prototyp: kostenlos, schnell, kein Serverbetrieb. Akzeptierte Einschränkungen: Spielstand lokal manipulierbar (für einen Prototyp okay), keine Secrets im Build, Basis-Pfad in Vite konfigurieren, Hash-Routing.
6. **Größtes technisches Risiko:** Simulation und UI verweben sich schleichend. Dagegen hilft nur eine harte Regel ab Tag 1: **Spiellogik ist ein reines TypeScript-Modul ohne React-Import; UI sendet nur Commands und liest nur Snapshots.** Das ist zugleich die Vorbereitung für spätere serverseitige Validierung.
7. **Echte 3D-POV ist auf Jahre außer Reichweite.** Der Stufenplan in §10 liefert 80 % des Erlebnisses für 5 % der Kosten.
8. **Werte-Inflation vermeiden:** 13 vorgeschlagene Werte sind zu viele. MVP 1 kommt mit 4 Lagerressourcen + 4 Kapazitätswerten aus (§6). Jeder weitere Wert braucht eine Gameplay-Rechtfertigung.

**Fazit:** Machbar und vielversprechend — wenn MVP 1 klein bleibt und die zwei Architektur-Grundsätze (Sim/UI-Trennung, Sektoren-Welt) von Anfang an gelten.

---

## 2. Getroffene Annahmen (revidierbar)

| # | Entscheidung | Gewählt | Begründung |
|---|---|---|---|
| A1 | **Perspektive** | Top-Down-2D-Grid im MVP, Architektur iso-fähig | Schnellster Weg zum hübschen Prototyp. Datenmodell bleibt reines Grid — Isometrie ist später ein Rendering-Upgrade, kein Datenumbau. |
| A2 | **Zeitmodell** | Echtzeit mit Offline-Fortschritt (Catch-up beim Laden) | Passt zu Bauzeiten, Daily-Quests und dem Mobile-Ziel. Offline-Ertrag wird durch Lagerkapazität natürlich begrenzt. |
| A3 | **Sprache** | UI Deutsch, alle Strings ab Tag 1 in `i18n/de.json`; Code/Config-Keys englisch | Englisch ist später nur eine zweite Datei. |
| A4 | **Grafik** | Spiel-Assets: CC0-Packs (Kenney.nl: City Kit, Roads, Figuren, Fahrzeuge). UI: professionelle SVG-Icon-Bibliothek (Lucide), **keine Emojis** | Konsistenter Cartoon-Look auf der Karte, cleanes modernes UI drumherum. Beides lizenzfrei, später ersetzbar. |

---

## 3. Spielvision (verdichtet)

> **„Du bist nicht die Stadt — du bist ihr Bürgermeister."**
> Ein charmantes, cartoonhaftes Aufbau-Spiel im Browser: Du gründest eine kleine Stadt, produzierst Ressourcen, erfüllst die Bedürfnisse deiner Bürger und schaltest mit jedem Level neue Gebäude und Systeme frei. Die Welt ist offen: Deine Stadt wächst über Fernstraßen und Bahnlinien in immer neue Biome hinein — es gibt kein Kartenende und kein Spielende, nur die nächste Expansion. Und du bist als Bürgermeister selbst Teil der Stadt: eigenes Haus, Reden, Stadtfeste, Beschwerden, Reputation.

**Genre-Einordnung:** Casual-Aufbau (SimCity-BuildIt-Tiefe), nicht Hardcore-Wirtschaftssim. Tiefe entsteht über Jahre durch Biome und Systeme, nicht durch Komplexität pro System.

**Die drei Säulen:**
1. **Bauen & endlos wachsen** — Aufbau-Loop mit klaren Freischaltungen und Expansion als Dauermotor.
2. **Bürger mit Bedürfnissen** — Zufriedenheit als zentrales Feedback-System, nicht als Strafmechanik.
3. **Der Bürgermeister** — persönliche Präsenz in der Stadt (USP, früh erlebbar).

---

## 4. Core Gameplay Loop

**Kurz-Loop (1–5 Minuten, „Check-in"):**
```
Ressourcen einsammeln → fertige Gebäude aktivieren → neuen Bau/Upgrade starten
→ Quest abschließen → Belohnung → nächstes Ziel sehen
```

**Mittel-Loop (Session, 15–45 Minuten):**
```
Bedürfnis-Engpass erkennen (z. B. „Essen bei 60 %")
→ passende Gebäude bauen → Zufriedenheit steigt → neue Bürger ziehen zu
→ mehr Steuern & XP → Level-Up → neue Freischaltungen → neuer Engpass (gewollt!)
```

**Lang-Loop (Dauermotor, kein Ende):**
```
Sektor für Sektor expandieren → Fernstraße/Bahnlinie in ein neues Biom bauen
→ dort einen neuen Distrikt der Hauptstadt gründen → neue Ressourcen & Gebäude
→ Distrikt ausbauen → nächstes Biom am Horizont
```

**Design-Regel:** Jedes Level-Up löst ein Problem *und* erzeugt sichtbar das nächste (mehr Bürger → mehr Wasserbedarf → Brunnen reichen nicht → Wasserwerk). Wachstum erzeugt Nachfrage, Nachfrage erzeugt Bauziele. Nach dem letzten Level übernimmt die Expansion diese Rolle: Neue Distrikte sind immer möglich, Meilenstein-Belohnungen (Einwohnerzahlen, Distrikt-Vollausbau, Prestige-Projekte) halten die Motivation ohne Level-Zwang am Laufen.

---

## 5. MVP-Abgrenzung

### MVP 1 — „Spielbarer Kern" (GitHub Pages, ohne Backend)

| Bereich | Enthalten |
|---|---|
| Plattform | Statische Web-App (Vite + React + TS), Desktop-Browser first, GitHub Pages via Actions |
| Speichern | localStorage über `SaveAdapter`-Interface, Auto-Save, Export/Import (JSON-Download) als Backup |
| Karte | Sektoren-Welt (§8): Startregion 4×4 Sektoren à 16×16 Tiles (= 64×64), umliegende Sektoren sichtbar aber gesperrt, **Expansion durch Sektor-Freischaltung ist Kern-Feature des MVP** |
| Gebäude | ~18 Gebäudetypen (§7), platzieren/verschieben/abreißen, Bauzeiten in Echtzeit, 2–3 Upgrade-Stufen für Häuser |
| Ressourcen | Geld, Holz, Stein, Essen (lagerbar) + Wasser als Versorgungskapazität (§6) |
| Bedürfnisse | Wohnraum, Wasser, Essen, Arbeit, Freizeit → Zufriedenheit 0–100 |
| Progression | Level 1–10, XP durch Bauen/Quests/Meilensteine, klare Freischaltungsliste pro Level |
| Quests | Lineare Tutorial-/Aufbau-Quests (~20–25 Stück), tragen durch Level 1–10 |
| Bürgermeister | Bürgermeisterhaus (ab L3), 3 Aktionen mit Cooldown (§9), Beschwerde-/Lob-Nachrichten |
| Atmosphäre | Animierte Sprites (Autos, Fußgänger), Gebäude-Zustände (Baustelle / aktiv / „Ertrag bereit"), Demonstranten/Feier-Zustände |
| UI | Icon-basiertes HUD (§11), Baumenü mit Kategorien, Gebäude-Panel, Quest-Panel, Zufriedenheits-Widget, Bürgermeister-Panel |
| Gold (spät im MVP 1) | Gold-Währung über `EconomyService` mit Transaktionslog, Speedup/Sofort-Fertigstellung, Test-Shop hinter Flag — **bewusst als letzter MVP-1-Baustein**, damit Gameplay zuerst steht (§14) |

### MVP 2 — „Online & Tiefe"
Optionaler Login + Cloud-Save (Supabase, `CloudSaveAdapter`), Energie + Kraftwerke, Feuerwehr-Muster auf Polizei/Krankenhaus übertragen, Steuern-/Mieten-Regler, Level 11–20, **erste Fern-Expansion: Fernstraße ins Fluss-Biom, erster Distrikt** (§8), Achievements, Daily-Quests, Reputation sichtbar, Mobile-Web-Layout, IndexedDB, Besichtigungsmodus Stufe 2 (§10).

### MVP 3 — „Produkt"
Echte Accounts für Online-Features, echter Shop + Payment (Stripe), serverseitige Validierung (Gold), Bahnlinien als zweite Fernverbindung, Gebirgs-/Meer-Biom mit Distrikten, Events/Leaderboards, Isometrie-Upgrade, Stadtrundgang (§10).

### Später / Langfristig (Jahre)
Flughafen, Inseln, Skigebiet, Surfen, Freizeitparks, Stadien, Tourismus-System, POV-Modus, native Mobile-App (Capacitor zuerst), PC-Version.

### Bewusst gestrichen aus MVP 1
Verkehrssimulation (Straßen sind Bau-Voraussetzung + Deko, kein Pathfinding-Verkehr), Energie-Netz, individuell simulierte Bürger (Bürger = Statistik + dekorative Sprites), Katastrophen, Handel, Multiplayer, 3D. **Ebenfalls verschoben:** Alles rund um Kauf/Zahlung — im MVP 1 existiert Gold nur als spät eingebautes, flag-geschütztes System; echtes Payment erst MVP 3.

### Alleinstellungsmerkmale — früh sichtbar
1. **Bürgermeister-Rolle** (ab Level 3, im Tutorial angeteasert).
2. **Endlose Expansion** — schon im MVP spürbar: gesperrte Sektoren und das Fluss-Biom am Horizont wecken „da will ich hin".
3. **„Stadt zeigt ihre Stimmung"**: Glückliche Bürger feiern sichtbar, unglückliche demonstrieren vor dem Rathaus.

---

## 6. Ressourcen- & Bedürfnis-System

### Werte im MVP 1 (bewusst reduziert)

**Lagerbare Ressourcen** (mit Lagerkapazität, produziert über Zeit):
| Ressource | Quelle | Verwendung |
|---|---|---|
| Geld | Steuern (pro Bürger × Zufriedenheitsfaktor), Quests | Alles bauen, Upgrades |
| Holz | Sägewerk | Baukosten früher Gebäude |
| Stein | Steinbruch | Baukosten mittlerer Gebäude/Upgrades |
| Essen | Farm (produziert) → Markt (verteilt) | Bedürfnis „Essen", laufender Verbrauch |

**Kapazitätswerte** (nicht lagerbar, Angebot vs. Nachfrage):
- **Wasser:** Brunnen/Pumpen liefern Kapazität, Bürger verbrauchen. Deckung < 100 % → Bedürfnis leidet.
- **Wohnraum:** Summe Hauskapazität. Freier Wohnraum + gute Zufriedenheit → Zuzug (Wachstumsmotor).
- **Arbeitsplätze:** Produktions-/Gewerbegebäude bieten Jobs. Arbeitslosigkeit senkt Zufriedenheit *und* unbesetzte Jobs senken Produktionseffizienz — ein Wert, zwei Wirkungen.
- **Freizeit:** Parks etc. liefern Freizeitpunkte mit Einzugsradius.

**Abgeleitete Werte:** Einwohner, Zufriedenheit (0–100), XP/Level, Gold (Premium, §14).

### Zufriedenheits-Formel (einfach & erklärbar)
```
Bedürfnis-Erfüllung b_i = min(1, Angebot_i / Nachfrage_i)   je Bedürfnis
Zufriedenheit = 100 × Σ (gewicht_i × b_i)                    (Gewichte aus Config)
MVP-Gewichte: Wasser 25 %, Essen 25 %, Wohnen 20 %, Arbeit 15 %, Freizeit 15 %
```
Wirkung: Steuerfaktor 0,5×–1,5×; Zuzug nur bei Zufriedenheit ≥ 60; unter 40 Wegzug + Demonstranten vorm Rathaus. Jedes Bedürfnis zeigt im UI seine Erfüllung einzeln — der Spieler sieht sofort, *was* fehlt.

### Später (im Datenmodell als generische Listen vorgesehen)
Energie (MVP 2, Kapazitätswert), Sicherheit/Gesundheit/Bildung (MVP 2, radiusbasiert wie Freizeit — **gleicher Mechanismus, keine Sonderfälle**), Umwelt (MVP 3, Malus-Aura von Industrie), Wirtschaftskraft (MVP 3), Reputation (§9). Neue Ressourcen/Bedürfnisse = neuer Config-Eintrag, kein neuer Code — das ist der Architektur-Test.

---

## 7. Gebäude- & Level-System

### Kategorien (= Baumenü- & Config-Struktur)
`roads` Straßen/Wege · `residential` Wohnen · `production` Ressourcen · `services` Versorgung · `leisure` Freizeit · `economy` Wirtschaft (ab L6) · `government` Verwaltung & Bürgermeister · `infrastructure` Infrastruktur inkl. Fernverbindungen (ab MVP 2) · `decoration` Dekoration · `special` Spezialgebäude (ab MVP 2)

**Gemeinsames Gebäude-Schema** (alle Kategorien nutzen dieselben Bausteine): Footprint (1×1 bis 4×4), Kosten, Bauzeit, Straßenanschluss ja/nein, optional: produziert X / liefert Kapazität Y / Jobs / Wohnraum / Bedürfnis-Radius, Upgrade-Stufen, Freischalt-Level, Biom-Anforderung (später).

### MVP-1-Gebäudeliste (18 Typen)
Rathaus (vorplatziert, Upgrade = Stadtausbau-Meilenstein), Straße, Kleines Haus, Reihenhaus, Apartment (L9), Sägewerk, Steinbruch, Farm, Brunnen, Wasserpumpe, Markt, Bäckerei (L9), Lagerhaus, Kleiner Laden (L6), Park, Spielplatz, Feuerwehr (L8), Bürgermeisterhaus (L3) + 4 Dekorationen (Baum, Blumenbeet, Zierbrunnen, Bank).

### Level 1–10 (MVP 1)
Änderungen gegenüber deiner Vorlage: (a) Bürgermeisterhaus auf L3 vorgezogen (USP früh), (b) Polizei/Krankenhaus in MVP 2 (Feuerwehr reicht als Muster), (c) Expansion ist ab L5 laufendes Feature, nicht erst L10-Belohnung.

| Lv | Freischaltung | Neues Problem/Ziel (der „Motor") |
|---|---|---|
| 1 | Rathaus, Straße, Kleines Haus | Tutorial: 2 Häuser + Straße, erste Bürger |
| 2 | Sägewerk, Holz, Bauzeiten | Häuser brauchen Holz — Produktion beginnt |
| 3 | Brunnen, Wasserbedürfnis; **Bürgermeisterhaus + Aktion „Rede halten"** | Bürger dursten; Spieler erlebt den USP |
| 4 | Farm, Essensbedürfnis; Steinbruch, Stein | Zwei Produktionsketten parallel |
| 5 | Markt (verteilt Essen), volles Zufriedenheits-UI; **Sektor-Expansion freigeschaltet** | Erste Kette Farm → Markt; erster Sektor-Kauf als Quest |
| 6 | Kleiner Laden, Arbeitsplatz-Bedürfnis, Lagerhaus | Arbeitslosigkeit vs. unbesetzte Jobs balancieren |
| 7 | Park, Spielplatz, Freizeitbedürfnis, Dekoration | Stadt verschönern lohnt sich messbar |
| 8 | Feuerwehr, milde Brand-Ereignisse (Gebäude pausiert, keine Zerstörung); Aktion „Einsatzbesuch" | Erstes Risiko-System |
| 9 | Apartment, Bäckerei, Haus-Upgrade II; Aktion „Stadtfest" | Verdichtung: mehr Bürger pro Fläche |
| 10 | **Flussufer-Sektoren + Ausblick auf Fern-Expansion**: „Demnächst"-Bauplätze (Fernstraße, Brücke, Wasserkraft), Meilenstein-Belohnung | Cliffhanger auf MVP 2 statt abruptem Ende |

### Level 11–50 (Roadmap, in Bändern)
- **11–15 (MVP 2):** Energie + Wasserkraft, Polizei & Kriminalität, Krankenhaus, Schule, Steuer-/Mieten-Regler, **Fernstraße + Fluss-Distrikt** (Brücken, Kayak-Verleih)
- **16–20:** Gebirgs-Biom per Fernstraße (Erzmine, Seilbahn, Aussichtspunkt), Fabriken + Umwelt-Malus, Busnetz
- **21–25:** Meer-Biom (Hafen, Fischerei, Strand), Hotels, Tourismus-Grundsystem, **Bahnlinie** als schnellere Fernverbindung
- **26–30:** Bahnhof-Ausbau, Museum/Kino/Kultur, große Parks, Stadion
- **31–40:** Flughafen, Inseln (per Fähre/Hafen), Freizeitpark, Skigebiet, Events-System
- **41–50:** Metropol-Level: Hochhäuser, Großevents, Prestige-Projekte, Bürgermeister-Anwesen Endstufe

**Nach Level 50 — Open End:** Level enden, das Spiel nicht. Expansion, Distrikte, Prestige-Projekte (Wahrzeichen mit Langzeit-Bauzielen), Meilenstein-Serien (Einwohner-Marken, „Distrikt komplett ausgebaut") und wiederkehrende Events tragen das Endgame unbegrenzt weiter.

**XP-Quellen:** Bauen/Upgraden (Hauptquelle), Quests, Meilensteine. **Kurve:** L1–5 in der ersten Stunde, L6–10 über einige Tage Check-in-Spiel. Alle Zahlen in `levels.config` + `balancing.config`, nie im Code.

---

## 8. Map- & Biome-Konzept (Open-End-Welt)

### Grundmodell: Sektoren statt fester Karte
- Die Welt ist ein **konzeptionell unbegrenztes Gitter aus Sektoren à 16×16 Tiles**. Es gibt keine Weltgrenze im Datenmodell — nur freigeschaltete, sichtbare und noch nicht erzeugte Sektoren.
- **Sparse Storage:** Der Spielstand speichert nur existierende Sektoren (`Record<sectorId, SectorState>`), nicht ein riesiges Array. Neue Sektoren werden erst beim Freischalten materialisiert. Das macht „unendlich" speicherbar und ist die wichtigste Architektur-Entscheidung dieses Features.
- Jedes Tile: `terrainType` (grass, forest, water, river, mountain, sand, fertile), optional `buildingId`. Gebäude belegen Footprints 1×1 bis 4×4.
- Straßenanschluss: Nachbarschafts-Check per Flood-Fill vom Rathaus (bzw. vom Distrikt-Zentrum), keine Verkehrssimulation.

### Maßstab (angepasst: Expansion soll sich lohnen)
- **Startregion:** 4×4 Sektoren = 64×64 Tiles, davon 1 Sektor anfangs bebaubar. Umliegende Sektoren sind sichtbar, aber gesperrt („da will ich hin"-Effekt).
- **Rechenprobe:** Ein durchschnittliches Gebäude belegt ~2×2 Tiles; mit Straßen und Deko braucht ein Gebäude effektiv ~6–8 Tiles. Ein Biom-Gebiet von 9–16 Sektoren (~2 300–4 000 Tiles) fasst damit **300–600 Gebäude** — genau die gewünschte Größenordnung „mehrere hundert Gebäude pro Biom".
- **Sektor-Kosten skalieren** mit Entfernung vom Rathaus und Anzahl bereits gekaufter Sektoren (Formel in `balancing.config`). Expansion bleibt dadurch dauerhaft ein Sparziel und wird nie trivial.

### Eine Stadt, viele Distrikte (statt Zweitstädten)
- Es gibt **genau eine Stadt**. Entfernte Biome werden nicht als neue Städte gegründet, sondern als **Distrikte der Hauptstadt** erschlossen.
- **Ablauf einer Fern-Expansion:** (1) Fernstraße oder später Bahnlinie als großes Bauprojekt Richtung Zielbiom bauen (Meilenstein mit hohen Kosten + Bauzeit — ein Ereignis, kein Klick). (2) Am Zielort entsteht ein **Distrikt-Zentrum** (kleiner Rathaus-Ableger). (3) Um das Distrikt-Zentrum werden Sektoren des neuen Bioms freischaltbar — dort baut man „quasi eine neue Stadt", die aber voll zur Hauptstadt gehört.
- **Geteilt bleibt alles Globale:** Level, Geld, Gold, Lagerressourcen, Zufriedenheit als stadtweiter Wert (Bedürfnisse mit Radius wirken lokal — automatisch dadurch, dass Radien nicht über die Distanz reichen). Distrikte sind also *Orte*, keine getrennten Spielstände. Das hält die Simulation einfach und das Gefühl „meine eine große Stadt" intakt.
- Zwischen Stadt und Distrikt liegt unerschlossenes Land — die Fernverbindung wird als Straßen-/Schienen-Band durch nicht kaufbare „Korridor-Sektoren" gerendert (reine Deko mit fahrenden Autos/Zügen, keine Logik).
- Konsequenz fürs Datenmodell: „mehrere Städte pro Account" (früherer Plan) entfällt zugunsten von „eine Stadt, mehrere Distrikte". Ein `districtId` pro Sektor genügt.

### Biome als Config, nicht als Sondercode
Ein Biom = Terrain-Typen + Gebäude-Whitelist + Boni (aus `biomes.config`). „Sägewerk nur an Wald-Tiles, +25 % am Waldrand" ist ein Config-Eintrag. Rollout: MVP 1 Ebene + Wald (+ Fluss sichtbar), MVP 2 Fluss-Distrikt, dann Gebirge (L16+), Meer (L21+), Inseln (L31+).

### Startkarte: handgebaut
Die Startregion wird als Config designt (Fluss im Osten, Wald im Norden, fruchtbare Ebene im Zentrum). Handdesign garantiert eine gute erste Spielerfahrung. Weiter entfernte Biom-Regionen werden pro Biom aus handgebauten Vorlagen + leichter Variation erzeugt (kein volles Procedural Generation nötig).

### Performance bei hunderten Gebäuden (MVP-relevant!)
- **Rendering:** Pixi-Viewport mit Culling — nur sichtbare Sektoren werden gerendert; Sektor-Container werden beim Verlassen des Sichtbereichs deaktiviert. Ambient-Sprites (Autos, Fußgänger) existieren nur in sichtbaren Sektoren.
- **Simulation:** Produktions- und Bedürfniswerte werden pro Gebäude beim Platzieren/Upgraden in **Sektor-Aggregate** eingerechnet; der Sekunden-Tick arbeitet auf Aggregaten statt über alle Gebäude zu iterieren. Damit bleibt der Tick auch bei tausenden Gebäuden konstant schnell — und genau das erlaubt Open End überhaupt.

---

## 9. Bürgermeister-Feature (USP)

**Designprinzip:** Kein Sims-Klon — der Bürgermeister ist eine *Rolle mit Präsenz*, kein simulierter Charakter. Drei Bausteine:

1. **Bürgermeisterhaus** (ab L3): Physisches Gebäude, upgradebar Haus → Villa → Anwesen (an Meilensteine gekoppelt, nicht nur an Geld). Jede Stufe: +1 Aktions-Slot oder kürzere Cooldowns.
2. **Bürgermeister-Aktionen** (Cooldown-basiert, aus `mayorActions.config`):
   | Aktion | ab | Effekt | Cooldown |
   |---|---|---|---|
   | Rede halten | L3 | +10 Zufriedenheit für 30 Min | 4 h |
   | Einsatzbesuch | L8 | Laufendes Ereignis (Brand) sofort beendet + Bonus | 8 h |
   | Stadtfest | L9 | 2 h Zufriedenheits- & Steuerbonus, Fest-Deko am Markt | 24 h |
   Aktionen sind **Buffs mit Inszenierung**: Bürgermeister-Sprite läuft sichtbar zum Ort, Bürger versammeln sich — geringe Sim-Komplexität, hoher Charme. Später: Eröffnungszeremonien (Distrikt-Eröffnung!), Krisenmanagement, Wahlkampf.
3. **Stadt-Dialog:** Nachrichten-Feed im Rathaus-Panel: Beschwerden bei Engpässen („Familie Weber: Der Brunnen ist zu weit weg!"), Lob & Einladungen bei hoher Zufriedenheit (Annehmen = Mini-Buff + Szene). Templategesteuert aus Config.

**Reputation** (MVP 2): 0–100, steigt durch Aktionen/Meilensteine, sinkt bei ignorierten Beschwerden; schaltet Aktions-Stufen frei. Im MVP 1 nur als verdecktes Datenfeld mitgeloggt, UI in MVP 2.

---

## 10. Besichtigungs- & POV-Feature (gestuft, realistisch)

1. **MVP 1 — „Lebendige Karte":** Freies Zoomen/Schwenken (Pixi-Viewport), bewegte Sprites, Gebäude-Zustandsanimationen. Kein eigener Modus, einfach eine gute Kamera.
2. **MVP 2 — „Besichtigungsmodus":** UI ausblenden, sanfte Kamerafahrt entlang der Straßen (auch zu Distrikten über die Fernstraße — die Anreise ist Teil des Erlebnisses), Klick auf markante Gebäude öffnet illustrierte „Postkarten-Szene" mit 2–3 animierten Ebenen. Teilbar als Screenshot.
3. **MVP 3 — „Stadtrundgang":** Kamera folgt einem Bürger/Bus auf dem Straßengraph (einfaches A* nur für die Kamera), leichte Parallaxe für Pseudo-Tiefe. Fühlt sich wie POV an, bleibt 2D.
4. **Langfristig — echte POV:** Nur nach 3D-/Engine-Entscheidung. Bewusst nicht versprochen.

---

## 11. UI/UX-Konzept (Web, MVP 1)

**Designsprache:** Professionell und modern — **keine Emojis im UI**. Stattdessen eine konsistente SVG-Icon-Bibliothek (**Lucide**: MIT-Lizenz, tree-shakeable React-Komponenten, einheitlicher Strichstil) plus wenige eigene Icons für Spielressourcen (Holz, Stein, Essen, Gold als kleine SVG-Symbole im Stil des Asset-Packs). Ein zentrales Design-Token-Set (Farben, Abstände, Radien, Typografie) als CSS-Variablen — der Cartoon-Charme lebt auf der Karte, das UI drumherum bleibt clean.

**Layout (Desktop-first, Mobile-tauglich geplant):**
```
┌────────────────────────────────────────────────────────────────┐
│ Kopfleiste:  [Level 7 ▸ XP-Balken]   [Geld] [Holz] [Stein]     │
│              [Essen] [Wasser %]  ·  [Gold]            [Menü]   │
├─────────────┬───────────────────────────────────┬──────────────┤
│ Quests      │                                   │ Kontextpanel │
│ (einklapp-  │           STADTKARTE              │ Gebäude-Info │
│  bar)       │      (Pixi-Canvas, Pan/Zoom)      │ o. Bürgerm.- │
│             │                                   │ Feed         │
├─────────────┴───────────────────────────────────┴──────────────┤
│ Fußleiste:  [Bürgermeister] [Zufriedenheit] [Einwohner]        │
│                    [BAUEN]        [Shop] [Einstellungen]       │
└────────────────────────────────────────────────────────────────┘
```

**Button-Ordnung (intuitiv, feste Gruppen):**
- **Kopfleiste = nur Status** (Level, Ressourcen, Gold) — keine Aktionen. Tooltips zeigen Lager/Produktion pro Minute.
- **Fußleiste = Aktionen**, in drei festen Gruppen: links *Stadt-Status* (Bürgermeister, Zufriedenheit, Einwohner — öffnen Panels), Mitte *Bauen* (primärer, größter Button), rechts *System* (Shop, Einstellungen). Jeder Button: Icon + kurzes Label, konsistente Größen, klare Hover-/Aktiv-Zustände.
- **Baumenü:** Bottom-Sheet mit Kategorie-Tabs (Icons + Label, Reihenfolge = §7). Gebäudekarten zeigen Bild, Kosten, Bauzeit, Effekt in einer Zeile. Gesperrtes sichtbar mit „ab Level X". Platzierung: Geister-Vorschau, grün/rot-Validierung, Drag zum Verschieben.
- **Gebäude-Panel** (Klick aufs Gebäude): Status/Produktion, Upgrade, Sofort-Fertigstellen (Gold), Abreißen — destruktive Aktion visuell abgesetzt und mit Bestätigung.
- **Zufriedenheits-Widget:** Wert + Trend; aufgeklappt alle Bedürfnisse als Einzelbalken mit „Was hilft?"-Link direkt ins passende Baumenü. (Wichtigstes Lern-UI des Spiels.)
- **Bürgermeister-Panel:** Aktionen mit Cooldown-Ringen + Nachrichten-Feed. Eigener, prominenter Button (USP).
- **Expansion:** Gesperrte Sektoren zeigen beim Anklicken Preis + „Freischalten"-Dialog; Fern-Expansionen (MVP 2) bekommen eine eigene Karten-Übersicht („Weltkarte"-Zoomstufe).
- **Shop:** Tab „Gold" (Test-Shop, klar gebrandet „Testversion — alles kostenlos") + Tab „Boosts". Erscheint im UI erst, wenn das Gold-System eingebaut wird (spät im MVP 1).
- **Mobile-Pfad (MVP 2):** Panels werden Bottom-Sheets, Leisten kompakt, Touch-Gesten (Pinch-Zoom, Long-Press). Keine neue Informationsarchitektur nötig, weil alle Panels schon eigenständige Overlays sind.

---

## 12. Technisches Architekturkonzept

### Tech-Stack (Empfehlung mit Begründung)
| Baustein | Wahl | Warum |
|---|---|---|
| Build/App | **Vite + React 18 + TypeScript (strict)** | Vite: schnell, perfekte GitHub-Pages-Unterstützung (`base`-Option). React für die UI-Panels. **Kein Next.js** — SSR nutzlos auf Pages, nur Ballast. |
| Karten-Rendering | **PixiJS v8** (+ pixi-viewport) | WebGL-Performance für hunderte animierte Sprites, Pan/Zoom eingebaut, Container-basiertes Sektor-Culling (§8), und der spätere Iso-Umstieg ist machbar. SVG/DOM-Grid stirbt performativ an der Open-End-Welt; Phaser bringt eine eigene Engine-Welt mit, die mit React konkurriert — Pixi integriert sich sauberer. |
| UI-Icons | **Lucide React** | Konsistenter, moderner Icon-Satz statt Emojis (§11), MIT-Lizenz. |
| State (UI-Bindung) | **Zustand** | Minimal; UI abonniert Snapshots des Sim-States. |
| Validierung | **Zod** | Configs und Save-Games beim Laden validieren. |
| Tests | **Vitest** | Sim ist pures TS → unit-testbar (Balancing-Tests). |
| Später Backend | **Supabase** (MVP 2) | Auth + Postgres + RLS + Edge Functions, Free-Tier, kein Serverbetrieb. |
| Später Mobile | **Capacitor-Wrapper** | Web-Code wiederverwenden; Engine-Port bleibt Option für viel später. |

### Schichtenmodell (die wichtigste Regel des Projekts)
```
┌────────────────────────────────────────────────────┐
│ UI (React + Pixi-Renderer)                         │  liest Snapshots, rendert
│   sendet nur Commands ▼        ▲ abonniert State   │
├────────────────────────────────────────────────────┤
│ GameController (Command-API)                       │  placeBuilding(), collectYield(),
│                                                    │  unlockSector(), performMayorAction()…
├────────────────────────────────────────────────────┤
│ Simulation Engine (pures TypeScript, KEIN React,   │  tick(state, config, dt) → state
│ KEIN DOM, KEIN Pixi)                               │  Systeme: Construction, Production,
│                                                    │  Needs, Happiness, Population,
│                                                    │  Quests, Events, Mayor, Expansion
├──────────────────────┬─────────────────────────────┤
│ EconomyService       │ Config-Layer (typed + Zod)  │  Geld/Ressourcen/Gold zentral,
│ (Gold spät im MVP 1) │                             │  Transaktionslog
├──────────────────────┴─────────────────────────────┤
│ Persistence: SaveAdapter-Interface                 │  MVP1: LocalStorageSaveAdapter
│                                                    │  MVP2: IndexedDB-/CloudSaveAdapter
└────────────────────────────────────────────────────┘
```

**Entscheidungen in MVP 1, die MVP 2/3 billig machen:**
1. **Sim als pure Functions** `tick(state, config, elapsed) → newState`, deterministisch (seeded RNG im State). → Offline-Catch-up = großes `elapsed`; serverseitige Validierung später = dieselbe Funktion auf dem Server.
2. **Command-Pattern:** UI ruft nie Sim-Interna, nur benannte Commands mit Validierung. → Commands sind später 1:1 API-Requests.
3. **SaveAdapter-Interface** (`load/save/list/delete`, async) + **`schemaVersion` + Migrationskette** ab dem allerersten Save. → Adapter tauschen statt Speicherlogik umbauen.
4. **Sektoren-Welt mit Sparse Storage und Sim-Aggregaten** (§8) ab Tag 1 — Open End darf nie ein nachträglicher Umbau werden.
5. **Alle Zahlen in Config** (Zod-validiert). → Balancing ohne Code-Änderung; später serverseitig ausspielbar.
6. **Geld/Ressourcen/Gold nur über `EconomyService`** mit Pflicht-`reason` + Transaktionslog. Der Service existiert ab Tag 1 für Geld/Ressourcen; **Gold wird erst spät im MVP 1 als weitere Währung eingehängt** — dieselbe Schnittstelle, kein Umbau (§14).
7. **Feature-Flags** (`features.config`): `goldSystem`, `testShop`, `debugTools`, später `cloudSave`, `liveShop`.
8. **IDs statt Objektreferenzen** im State. → Serialisierung, Diffs, spätere DB-Zeilen trivial.
9. **Hash-Router** + Vite `base` für Pages.

### Game-Loop & Zeit
- Sim-Tick 1×/Sekunde (Logik, auf Sektor-Aggregaten), Rendering 60 fps entkoppelt (Pixi-Ticker, nur Interpolation/Deko).
- `lastSimTime` im State; beim Laden `elapsed = now − lastSimTime` → Catch-up (Produktion bis Lagergrenze, Bauten schreiten fort), bei großem `elapsed` in Chunks.
- Auto-Save alle 30 s + bei `visibilitychange`/`beforeunload`.

---

## 13. Datenmodelle (Kernschema)

```ts
// ---- Spielstand (persistiert) ----
interface SaveGame {
  schemaVersion: number;            // Pflicht ab Save #1, Migrationskette
  meta: { cityName: string; createdAt: number; lastSimTime: number; playTimeSec: number };
  rngSeed: number;
  level: { current: number; xp: number };
  resources: Record<ResourceId, number>;
  gold: { balance: number };                       // eingehängt, sobald goldSystem-Flag aktiv
  goldTransactions: GoldTransaction[];             // lokal, später DB-Tabelle
  world: {
    sectors: Record<SectorId, SectorState>;       // SPARSE: nur existierende Sektoren!
    districts: Record<DistrictId, DistrictState>; // MVP1: nur 'main'; später Fern-Distrikte
  };
  buildings: Record<BuildingInstanceId, BuildingInstance>;
  citizens: { population: number; happiness: number;
              needs: Record<NeedId, { supply: number; demand: number }> };
  mayor: { houseLevel: number; reputation: number;   // reputation: MVP1 verdeckt
           actionCooldowns: Record<MayorActionId, number>;
           messages: MayorMessage[] };
  quests: { completed: QuestId[]; active: ActiveQuest[] };
  achievements: Record<AchievementId, { unlockedAt?: number; progress: number }>;
  events: ActiveEvent[];            // z. B. laufender Brand
}

interface SectorState {
  id: SectorId;                     // "x:y" im Sektor-Gitter (kann negativ sein → open end)
  districtId: DistrictId;
  status: 'locked' | 'unlocked';
  tiles: TileState[];               // 16×16, kompakt kodiert
  aggregates: SectorAggregates;     // Produktion/Kapazitäten vorverrechnet (Performance, §8)
}

interface DistrictState {
  id: DistrictId; nameKey: string;
  centerBuildingId: BuildingInstanceId;            // Rathaus bzw. Distrikt-Zentrum
  connection?: { type: 'highway' | 'railway'; builtAt: number };  // Fernverbindung (ab MVP 2)
}

interface BuildingInstance {
  id: string; defId: BuildingDefId;
  x: number; y: number; upgradeLevel: number;      // Welt-Koordinaten (Sektor-übergreifend)
  status: 'constructing' | 'active' | 'yieldReady' | 'paused';
  constructionEndsAt?: number; lastYieldAt?: number;
}

interface GoldTransaction {
  id: string; timestamp: number; amount: number;   // + / −
  reason: 'level_up_reward' | 'quest_reward' | 'achievement_reward'
        | 'test_shop_grant' | 'building_speedup' | 'instant_finish'
        | 'resource_purchase' | 'test_reset' | string;
  balanceAfter: number; context?: Record<string, unknown>;
}

// ---- Config (nicht persistiert, versioniert im Code) ----
interface BuildingDef {          // buildings.config.ts
  id: string; category: BuildingCategory; nameKey: string;
  size: { w: number; h: number }; requiresRoad: boolean;
  unlockLevel: number; cost: Partial<Record<ResourceId, number>>;
  constructionSec: number; sprite: string;
  effects: BuildingEffect[];     // generisch — s. u.
  upgrades?: BuildingUpgradeDef[];
  biomeRequirement?: TerrainType[];   // ab MVP 2 genutzt
}
// Ein generisches Effekt-System statt Sonderfällen:
type BuildingEffect =
  | { type: 'produce';      resource: ResourceId; perMinute: number }
  | { type: 'capacity';     need: NeedId; amount: number }              // Wasser, Wohnen, Jobs
  | { type: 'needCoverage'; need: NeedId; amount: number; radius: number } // Freizeit, später mehr
  | { type: 'storage';      resource: ResourceId; amount: number }
  | { type: 'taxBonus';     multiplier: number };

interface LevelDef   { level: number; xpRequired: number; unlocks: BuildingDefId[];
                       rewards: { money?: number; gold?: number }; featureUnlocks?: FeatureId[] }
interface QuestDef   { id: string; titleKey: string; trigger: QuestCondition;
                       objectives: Objective[]; rewards: Rewards; nextQuestId?: string }
interface MayorActionDef { id: string; unlockLevel: number; cooldownSec: number;
                           effects: TimedBuff[]; presentation: SceneRef }
interface ShopOfferDef   { id: string; kind: 'gold_grant' | 'speedup' | 'resource_pack' | 'debug';
                           price: { gold?: number; realMoneyCents?: number };  // realMoney erst MVP3
                           testOnly: boolean }
interface BiomeDef   { id: string; terrainTypes: TerrainType[];
                       buildingBonuses: Record<BuildingDefId, number>; unlockLevel: number }
interface ExpansionDef { // Sektor-Preisformel + Fernverbindungs-Projekte (ab MVP 2)
  sectorCost: { base: number; distanceFactor: number; countFactor: number };
  connections: { type: 'highway' | 'railway'; unlockLevel: number;
                 cost: Partial<Record<ResourceId, number>>; constructionSec: number }[];
}
```

**Config-Dateien:** `buildings.config.ts`, `resources.config.ts`, `needs.config.ts`, `levels.config.ts`, `quests.config.ts`, `achievements.config.ts`, `shop.config.ts`, `mayorActions.config.ts`, `biomes.config.ts`, `expansion.config.ts`, `map.startRegion.config.ts`, `balancing.config.ts`, `features.config.ts` (Flags). Alles typisiert + Zod-validiert beim App-Start (Fail-fast bei kaputter Config).

---

## 14. Gold-System, Test-Shop & Payment-Roadmap (bewusst nach hinten geschoben)

**Reihenfolge-Entscheidung:** Gold, Test-Shop und Transaktionen sind im MVP 1 der **letzte** Baustein (Schritt 11 in §19), nicht der achte wie in v1. Zuerst steht das komplette Gameplay (Bauen, Bedürfnisse, Expansion, Bürgermeister, Atmosphäre); Gold wird dann als zusätzliche Währung in den bereits existierenden `EconomyService` eingehängt. Das geht, weil der Service ab Tag 1 Geld und Ressourcen mit denselben Mechanismen (zentrale Buchung, Pflicht-`reason`, Transaktionslog) verwaltet — Gold ist dann nur ein weiterer Eintrag, kein neues System.

### Gold-Design (fair, nicht Pay-to-Win)
- **Gold beschleunigt und verschönert, es kauft keine Macht:** Speedups, Sofort-Fertigstellung, begrenzte Ressourcen-Pakete, Kosmetik, später Event-Komfort. Kein spielrelevantes Gebäude ist gold-exklusiv.
- **Verdienbar im Spiel:** Level-Ups, Quests, Achievements, Meilensteine, später Daily/Weekly.
- **Preisformel Speedup:** `ceil(restMinuten / K)` Gold (K aus `balancing.config`) — eine Formel, überall gleich.

### EconomyService (zentraler Engpass, bewusst)
```
EconomyService
  spend(currency, amount, reason, context) → Result   // prüft Balance, bucht Transaktion
  grant(currency, amount, reason, context) → Result
  getBalance(currency) / getTransactions()
```
Regel: **Kein Code außer dem EconomyService verändert je einen Kontostand** — gilt für Geld, Ressourcen und Gold gleichermaßen. MVP 1: rein lokal, manipulierbar — akzeptiert, es ist ein Prototyp. Weil alles durch diesen einen Service läuft, wird in MVP 3 nur seine Innenseite gegen API-Calls getauscht.

### Test-Shop (Ende MVP 1, hinter `testShop`-Flag)
- Eigener Shop-Tab, klar gebrandet: „Testversion — alle Käufe kostenlos".
- Angebote aus `shop.config` mit `testOnly: true`: +100 / +1.000 / +10.000 Gold, Gold auf 0, Ressourcen auffüllen, „+1 h Spielzeit simulieren" (Zeit-Skip für Balancing-Tests), Spielstand-Reset.
- Käufe erzeugen normale Transaktionen (`reason: 'test_shop_grant'`) — der Datenfluss ist identisch mit dem späteren echten Shop, nur die Bezahlung fehlt. Flag aus = Tab weg, nichts bricht.

### Payment-Roadmap (erst MVP 3)
- **MVP 2:** Transaktionslog wandert mit Cloud-Save in die DB (Historie ist dann schon da).
- **MVP 3:** Stripe (Web-Payments): Client startet Checkout → Webhook/Edge Function validiert → **Server** schreibt Gold-Gutschrift in DB → Client synct. Goldstand-Quelle der Wahrheit ist dann die DB, nie der Client. Kauf-Wiederherstellung über die Transaktionshistorie. Test-Shop bleibt als Dev-Flag für Staging. Rechtliches (Impressum, Datenschutz, Widerruf, Jugendschutz) als eigener MVP-3-Punkt eingeplant.

---

## 15. Speicher-Konzept (MVP 1)

- `SaveAdapter`-Interface: `save(slot, data)`, `load(slot)`, `list()`, `delete(slot)` — async von Anfang an (localStorage ist sync, aber das Interface async, damit IndexedDB/Cloud später drop-in sind).
- **MVP 1:** `LocalStorageSaveAdapter`, 1 Slot, JSON. Tiles kompakt kodiert; dank Sparse-Sektoren wächst der Save nur mit dem, was der Spieler wirklich erschlossen hat. Wechsel auf IndexedDB in MVP 2 fest vorgesehen (große Städte sprengen sonst das 5-MB-localStorage-Limit).
- **Save-Hygiene:** `schemaVersion` + Migrationskette (v1→v2→…), Zod-Validierung nach dem Laden, korrupter Save → Fehlermeldung + Backup-Slot statt Silent-Reset.
- **Export/Import:** Spielstand als JSON-Datei herunterladen/hochladen (Spieler-Backup, Gerätewechsel, Bug-Reports — „Cloud-Save für Arme").
- Auto-Save: 30-s-Intervall + `visibilitychange` + nach jedem kostenpflichtigen Command.

---

## 16. Repository-Struktur

```
/
├── .github/workflows/deploy.yml        # Build + Pages-Deploy (§17)
├── public/                             # statische Assets (Favicon etc.)
├── src/
│   ├── main.tsx / App.tsx
│   ├── components/                     # React-UI
│   │   ├── hud/                        # TopBar, BottomBar, LevelBadge, HappinessWidget
│   │   ├── panels/                     # BuildMenu, BuildingPanel, MayorPanel, QuestPanel,
│   │   │                               #   ExpansionDialog, ShopPanel
│   │   └── common/                     # Buttons, Dialoge, Icons (Lucide-Wrapper), Tokens
│   ├── renderer/                       # PixiJS: MapRenderer, Sektor-Culling, Sprite-Layer,
│   │                                   #   Ambient-Animationen, Viewport
│   ├── game/                           # ⚠ pures TS — kein React/DOM/Pixi-Import (Lint-Regel!)
│   │   ├── engine/                     # GameLoop, tick(), Catch-up, seeded RNG
│   │   ├── commands/                   # GameController + Command-Definitionen
│   │   ├── simulation/                 # Systeme: construction, production, needs,
│   │   │                               #   happiness, population, events, quests
│   │   ├── economy/                    # EconomyService (Geld/Ressourcen/Gold), Transaktionen
│   │   ├── buildings/                  # Platzierungsregeln, Footprint-/Straßen-Checks
│   │   ├── map/                        # Sektoren, Terrain, Aggregate, Flood-Fill, Expansion
│   │   ├── progression/                # XP, Level, Freischaltungen, Achievements, Meilensteine
│   │   ├── mayor/                      # Aktionen, Cooldowns, Nachrichten-Feed
│   │   ├── shop/                       # Shop-Logik (test/live-agnostisch)
│   │   ├── storage/                    # SaveAdapter, LocalStorageSaveAdapter, Migrationen,
│   │   │                               #   Export/Import
│   │   └── config/                     # alle *.config.ts + Zod-Schemas + Loader
│   ├── state/                          # Zustand-Store: Snapshot-Bridge Sim → UI
│   ├── services/                       # App-Dienste (Feature-Flags, Analytics-Stub)
│   ├── i18n/                           # de.json (alle UI-Texte), i18n-Helfer
│   ├── types/                          # gemeinsame TS-Typen (SaveGame, IDs …)
│   ├── utils/
│   └── assets/                         # Sprites/Spritesheets (Kenney), eigene Ressourcen-Icons
├── tests/                              # Vitest: Sim-Systeme, Migrationen, Balancing-Szenarien
├── docs/CONCEPT.md                     # dieses Konzept, versioniert im Repo
├── vite.config.ts                      # base: '/City-Mayor-Builder-Arbeitstitel-/'
└── package.json / tsconfig.json / eslint.config.js
```
ESLint-Regel `no-restricted-imports` erzwingt: `src/game/**` importiert nie aus `react`, `pixi.js`, `src/components`, `src/renderer` — die Architekturregel wird maschinell geprüft, nicht nur vereinbart.

---

## 17. Deployment-Strategie (GitHub Pages + Actions)

- **Workflow `deploy.yml`:** Trigger `push` auf `main` (+ `workflow_dispatch`). Jobs: `npm ci` → `lint` → `typecheck` → `vitest run` → `vite build` → `actions/upload-pages-artifact` → `actions/deploy-pages`. Pages-Source: „GitHub Actions".
- **PR-Workflow:** gleicher Build ohne Deploy als Statuscheck.
- Vite `base` auf den Repo-Pfad; Hash-Routing; Assets mitgebundlet (kein CDN nötig).
- Versionsanzeige im Spiel-Footer (Commit-Hash aus Build-Env) — hilft beim Bug-Reporting mit Save-Export.

---

## 18. Roadmap (zusammengefasst)

| Phase | Inhalt | Größenordnung* |
|---|---|---|
| **MVP 1** | Spielbarer Kern (§5): Level 1–10, Sektoren-Expansion, Bürgermeister, Atmosphäre; Gold/Test-Shop als letzter Baustein; GitHub Pages | ~6–10 Wochen Feierabend-Tempo |
| **MVP 1.5** | Balancing-Pass, Polish, Sound-Grundlagen, Feedback-Runde | ~2 Wochen |
| **MVP 2** | Supabase-Login + Cloud-Save, Energie, Notdienste, Steuer-Regler, L11–20, **Fernstraße + Fluss-Distrikt**, Achievements, Mobile-Web, Besichtigungsmodus | ~2–4 Monate |
| **MVP 3** | Echter Shop + Stripe, Server-Validierung Gold, Bahnlinien, Gebirge/Meer-Distrikte, Events/Leaderboards, ggf. Iso-Upgrade | ~4–6 Monate |
| **Später** | Flughafen/Inseln/Ski/Tourismus, POV-Stufe 3, Capacitor-Mobile-App, L31–50 + Open-End-Endgame | offen |

*grobe Orientierung, kein Versprechen — Solo-Projekt-Tempo schwankt.

---

## 19. Konkrete nächste Schritte (spätere Implementierung, Reihenfolge)

Gameplay zuerst, Monetarisierung zuletzt:

1. **Projekt-Setup:** Vite + React + TS strict, ESLint (inkl. Architektur-Importregel), Vitest, Pages-Workflow — „Hello City" live auf Pages deployen (Deployment zuerst validieren, nicht zuletzt).
2. **Config-Layer + Datenmodell:** Typen, Zod-Schemas, erste `buildings/resources/levels/needs`-Configs.
3. **Sim-Kern:** State, `tick()`, Production/Construction/Needs/Happiness auf Sektor-Aggregaten + Unit-Tests (inkl. Catch-up-Test).
4. **Save-System:** SaveAdapter, localStorage-Implementierung, schemaVersion + Migrationsgerüst, Export/Import.
5. **Sektoren-Welt + Rendering:** Pixi-Viewport mit Sektor-Culling, Terrain, Gebäude-Sprites, Platzierung mit Validierung (erster „spielbarer" Moment).
6. **HUD + Baumenü + Gebäude-Panel** (React + Lucide-Icons, Design-Tokens), Command-Anbindung.
7. **Progression + Quests:** XP/Level, Freischaltungen, Tutorial-Questkette Level 1–5.
8. **Sektor-Expansion:** Freischalt-Dialog, Preisformel, Expansion-Quest (Level 5).
9. **Bürgermeister-Feature:** Haus, 3 Aktionen, Nachrichten-Feed.
10. **Atmosphäre-Pass:** Auto-/Fußgänger-Sprites, Gebäude-Animationszustände, Demonstranten/Feier-Zustände; Level-6–10-Content, Feuerwehr-Event, L10-Cliffhanger.
11. **Gold + Test-Shop (zuletzt):** Gold als Währung im EconomyService aktivieren (`goldSystem`-Flag), Speedup-Flow, Test-Shop (`testShop`-Flag), Transaktions-Ansicht in den Debug-Tools.
12. **Balancing- & Polish-Pass** mit Zeit-Skip-Debugtools, dann Feedback von Testspielern.

---

## 20. Verifikation dieses Plans

Da dies ein Konzept-Dokument ist (keine Code-Änderung), besteht die Verifikation aus: (a) Konzept als `docs/CONCEPT.md` ins Repo committen und auf den Branch `claude/city-builder-concept-w2f70y` pushen, (b) beim Implementierungsstart Schritt 1 (§19) gegen dieses Dokument prüfen — insbesondere die Architekturregeln (§12) als ESLint-Regeln verankern, damit das Konzept durchgesetzt wird statt nur dokumentiert.

---

## 21. Visual layer & 3D-Vorbereitung (v0.21)

Das Spiel bleibt im MVP2 ein 2D-Prototyp (Pixi, programmatisch gezeichnete
Gebäude), soll aber später ohne Umbau der Spiellogik auf eine hochwertige
2.5D-/3D-Darstellung wechseln können. Dafür gilt:

- **Logik ist rendering-unabhängig.** Die Simulation liest nur logische Felder
  (Position, Footprint, Rotation, Level, Status, Effekte, Radius, Produktion).
  Ob ein Gebäude als 2D-Tile, Sprite, Iso-Asset oder 3D-Modell erscheint, ist
  ausschließlich Sache der Renderer-Schicht.
- **`BuildingDef.visual`** (optional, aktuell ungenutzt) hält die visuellen
  Daten getrennt von der Logik: `heightClass`, `sprite2d`, `spriteIso`,
  `model3d`, `overlayAnchor` und optionale `stages[]` pro Upgrade-Stufe. So
  lassen sich Upgrade-Visuals (Haus → Doppelhaus → … → Hochhaus) und spätere
  3D-Modelle je Stufe einhängen, ohne Datenmigration. Der aktuelle Renderer
  leitet die Skyline-Höhe weiterhin aus `upgradeLevel` ab.
- **Marker & Overlays** (Problem-/Ziel-Marker, Bürger-Sprechblasen,
  Coverage-Tints, Kamera-Fokus) rechnen bereits in Welt-/Tile-Koordinaten und
  werden in Container transformiert — kein DOM-Pixel-Hack. Eine spätere Iso-/
  3D-Kamera kann dieselben Weltkoordinaten nutzen.
- **Terrain-Höhen** (Gebirge, Täler, Küste, Wasser­tiefe) sind noch nicht als
  Datenfelder modelliert; die Terrain-Typen sind aber sauber getrennt, sodass
  eine spätere Höhenkarte additiv ergänzt werden kann, ohne bestehende Daten zu
  brechen. Bewusst keine toten Felder jetzt — erst bei Bedarf.
