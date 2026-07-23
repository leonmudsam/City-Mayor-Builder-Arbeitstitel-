# Core Gameplay Overhaul 8.0 — Umsetzungsplan

Stand: 22. Juli 2026 · Basis: v0.74 (Save v15) · Audit:
`CORE_GAMEPLAY_OVERHAUL_AUDIT.md`

Leitsatz des Auftrags, an dem jede Phase gemessen wird:

> Jede Änderung soll den Spieler häufiger planen, entscheiden und optimieren
> lassen, statt auf Einnahmen, Bauzeiten oder Cooldowns zu warten.

## Verbindliche Leitplanken

- Keine Spiellogik in React oder Three.js; keine direkte State-Mutation aus der UI.
- Bestehende datengetriebene Systeme **erweitern** — keine zweite Stadtarbeits-,
  Straßen-, Gebäude-, Verkehrs- oder Regionssimulation.
- Jede persistierte Datenmodelländerung braucht `SCHEMA_VERSION`-Bump **und**
  eine lineare Migration `n→n+1`.
- Fehlende Simulationsdaten werden in der UI nicht vorgetäuscht. Lieber eine
  Zeile weglassen als einen Platzhalter zeigen.
- Nicht alle Systeme gleichzeitig umbauen: eine Phase, ein grüner
  Verifikationslauf, ein Handoff-Eintrag.

---

## Phase G1 — kritische Bugs · ✅ abgeschlossen

| Punkt | Stand |
|---|---|
| Stadtarbeit „4/5" (§3.1) | ✅ `evaluateCargoRoute` zählt Zweitkontakte; `skipped`-Stopps sichtbar |
| Getrennte Stoppzählung (§3.2) | ✅ `ActivityStopStatus`, `ActivityProgress`, „Lieferziele 5/5 · Nachladen 1/1" |
| Abschluss-Popup (§3.3) | ✅ `ActivityRunResult` aus echten Werten; keine „– %"-Platzhalter |
| Verkehrslast in der Planung (§9) | ✅ `forecastRouteTraffic` ab der ersten Kachel, 4 Stufen |
| Props beim Unlock (§16) | ✅ `vegetationBudget.ts`, Budget pro Region statt Index-Deckelung |

**Bewusst offen aus G1:** `criticalSegments` werden berechnet, aber noch nicht
auf der Planungskarte markiert (§9 letzter Satz) — kleine Folgeaufgabe in
`ManualRouteMap.tsx`.

## Phase G8 (vorgezogen) — Zeitvertrag · ✅ abgeschlossen

Vorgezogen, weil §26 die Grundlage für „aktives Spiel statt AFK" ist und alle
späteren Phasen (Missionen, Lieferketten, Ereignisse) gegen eine echte
Simulationsuhr entwickelt werden müssen.

| Punkt | Stand |
|---|---|
| `SimulationSpeed` 0/1/2/4 | ✅ `getSpeed`/`setSpeed`, Sitzungseinstellung ohne Save-Wirkung |
| `advanceByRealTime` | ✅ reale Zeit × Faktor → ein Tick-Pfad, Einnahmen und Verbrauch untrennbar |
| Pause stoppt alles | ✅ keine Simulationszeit ⇒ keine Wirtschaft, kein Bau, keine Mission |
| Renderer folgt der Uhr | ✅ `simDt` für Tageszeit/Verkehr/Mission/Tiere; Kamera bleibt in Echtzeit |
| Keine FPS-/Tickraten-Abhängigkeit | ✅ testgesichert |

**Rest von G8** (aktiver Loop, Ereignisse, saisonale Nachfrage) bleibt offen und
wandert hinter G5/G6.

---

## Phase G2 — Bauen, Verschieben, Kamera · **als Nächstes**

Reihenfolge ist zwingend: **G2.1 zuerst**, sonst zeigen alle weiteren
Verbesserungen korrekte Vorschauen auf falschen Kacheln.

### G2.1 Präzises Terrain-Picking (Audit 2.1) — P0

- `groundPointAt` gegen das Höhenfeld auflösen: Schrittsuche entlang des Strahls
  bis zum Vorzeichenwechsel von `rayY − terrainHeightAt(x, z)`, danach binäre
  Verfeinerung. `terrainHeightAt` bleibt die **einzige** Bodenhöhenquelle.
- Die flache Ebene bleibt nur Rückfall für Strahlen, die die Insel verfehlen.
- Gleicher Pfad für `pickTileAt`, `updateGhostAt`, `paint` und
  `CameraInputController.onWheel` (Zoom zum Cursor).
- **Tests:** reine Strahl/Höhenfeld-Tests (flach ≡ Ebene, erhöht auf
  `terrainHeightAt`, Konvergenz, Determinismus, Meer-Fallback).
- **Danach erneut prüfen:** Anleger-/Wassergebäude-Ablehnung (Audit 2.4) —
  vermutlich damit erledigt. Erst wenn nicht, an der Validierung ansetzen.

### G2.2 Kamera im Baumodus (Audit 2.2) — P0

Belegung gemäß §10.3: mittlere Taste schwenkt, rechte Taste **zieht = drehen**
und nur der Rechts-*Klick* bricht ab, `Strg`+Zug dreht, WASD/Pfeile und
Randscrollen bleiben aktiv, Mausrad zoomt. Der Bauentwurf überlebt jede
Kamerabewegung.

### G2.3 Echter GLB-Ghost (§13.1)

Reales Modell, Rotation, Sockel, Footprint, Straßen- und Wasseranschlusspunkt,
Radius; grün/gelb/rot aus `placementDiagnostics` statt aus einer eigenen
Prüfung.

### G2.4 Verschieben als Entwurf (§13.2)

Gebäude bleibt logisch an der alten Position, Ghost an der neuen, Ursprung
markiert, Abbruch ohne Wirkung, Bestätigung = genau ein Command.

### G2.5 Gebäuderadien im 3D (§15)

`getCoverageOverlay` auf das Gelände projizieren (terrainfolgend, keine
schwebende Scheibe), Farbe je Serviceart, sichtbar bei Hover, Auswahl und
während der Platzierung.

### G2.6 Straßenbau als Entwurf (§10.2)

Startpunkt → Live-Vorschau (Verlauf, Länge, Kosten, Steigung, Kurven, Brücken,
Kollisionen) → weitere Wegpunkte → „Bauen" bestätigt. Kein Bau bei jedem Klick.
Nutzt den bestehenden `roadPlanning.ts`-Pfad, kein zweites Straßensystem.

**Verifikation G2:** zusätzlich zum Standardlauf ein 3D-Screenshot-Smoke
(Playwright im Scratchpad, `vite preview`, Basis `/`) mit Cursor-/Ghost-Abgleich
auf flachem **und** erhöhtem Gelände.

---

## Phase G3 — Welt und Regionen

Alles hier ist Bake-Arbeit mit Save-Wirkung; **eine** Migration für das gesamte
Paket, nicht drei einzelne.

1. **Vorabklärung (§17/§18):** Die Insel wurde in 6.1 bereits um 20 % verdichtet.
   Mit dem Auftraggeber klären, ob „Welt zu groß" die Fläche oder die
   Regionsanzahl meint. Ohne diese Klärung keine zweite Skalierung.
2. **Regionen 40 → 18–24 (§18):** Zusammenlegung entlang echter Geografie
   (Flüsse, Gebirgskämme, Plateaus, Täler, Küsten). Neue IDs, Levelzuordnung,
   Freischaltkosten; bestehende Gebäude über die Migration umhängen.
3. **Erste Erweiterung kostenlos auf Level 3 (§19):** kein Bürgeranliegen dafür;
   Anliegen zu Regionen erst ab der dritten erschlossenen Region. Startregion
   zählt nicht als Kauf.
4. **Nebel (§24):** einheitliche absolute Oberhöhe, mehrere transparente
   Schichten, weicher Regionsrand, keine erkennbaren Einzelkörper. Kameraseitige
   Regionsgrenze mit weicher Rückführung statt unsichtbarer Wand; im Dev-Cheat
   abschaltbar.
5. **Vegetationspersistenz:** Der Determinismus aus G1 gilt weiter. Beim
   Vollinsel-Reveal Instanzzahl, Draw-Calls und VRAM auf Zielhardware messen und
   `REGION_PROP_BUDGET` **nur datenbasiert** anpassen.

## Phase G4 — Bevölkerungsmodell

Siehe Audit 2.5. Eine absolute Einheit, Wohnkapazitäten an der sichtbaren
Gebäudegröße (§20.3), Arbeitsplätze gegengeprüft (§20.4), frühe Level auf eine
sichtbare Kleinstadt ausgelegt (§21) — ohne die Geldproduktion zu verbilligen.
Persistierte Bevölkerung ⇒ **lineare Migration v15→v16**.
Der Textabgleich (§22) ist bereits erledigt und durch `tests/questText.test.ts`
gegen Rückfall gesichert.

## Phase G5 — Stadtarbeit vertiefen

Weniger, dafür bedeutendere Aufträge (1–3 aktiv statt fünf gleichartige, §5).
Lagerstopps als echte Logistikknoten (§6, `LogisticsHubProfile`).
Stadtinspektion als aktives Minispiel (§8.1). Verkehrsprognose um echte
Streckendaten erweitern, sobald sie existieren (Audit 2.6).

## Phase G6 — Lieferketten

`SupplyChain` als **eigenes** dauerhaftes System neben der Stadtarbeit (§7):
einmal eingerichtet, danach automatisch, mit laufenden Kosten, Analyse und
Optimierung. Stadtarbeit erzeugt Sonderprobleme **innerhalb** dieser Ketten,
ersetzt sie nicht. Neue persistierte Felder ⇒ Migration.

## Phase G7 — Straßen und Infrastruktur

Viadukt-/Hochstraße (§11) mit Pfeilern bis zum Boden, geglätteter Fahrbahn und
Rampen; Bergstraße, Serpentinen, Tunnel und Eisenbahnviadukt vorbereitet.
Netzbereichs-Upgrades ab Level 13 (§12) statt Kachel-für-Kachel.

## Phase G8 (Rest) — aktiver Loop

Verkehrssteuerung (§8.2), Baustellenkoordination (§8.3), Ressourcenengpass
(§8.4), Ereignisse und saisonale Nachfrage. Prüfmaßstab §27: Jede aktive Aufgabe
enthält mindestens Planung, Risiko, Priorisierung, Zeitdruck,
Ressourcenentscheidung, Infrastrukturbezug oder alternative Lösungswege — keine
reinen Klickaufgaben, keine identischen Aufträge mit größeren Zahlen.

---

## Akzeptanzkriterien (§31) — Stand

| # | Kriterium | Stand |
|---|---|---|
| 1 | Alle abgeschlossenen Ziele werden erkannt | ✅ G1 |
| 2 | Nachfüll- und Lieferstopps getrennt | ✅ G1 |
| 3 | Routenplanung intuitiver | ⏳ teilweise (Bedienung §4.2 offen, G2) |
| 4 | Verkehrslast in der Planung | ✅ G1 |
| 5 | Abschluss-Popup vollständig | ✅ G1 |
| 6–9 | Ghost, Cursor, Kamera, Straßenentwurf | ⏳ G2 |
| 10 | Viadukte | ⏳ G7 |
| 11 | Gebäuderadien im 3D | ⏳ G2.5 |
| 12 | Anleger zuverlässig platzierbar | ⏳ G2.1, danach erneut prüfen |
| 13 | Props bleiben beim Unlock | ✅ G1 |
| 14–17 | Welt, Regionen, Level-3-Erweiterung | ⏳ G3 |
| 18–20 | Bevölkerung, Kleinstadt | ⏳ G4 |
| 19 | Questtext = Fortschrittswert | ✅ G1 |
| 21–22 | Nebel, Kameragrenze | ⏳ G3 |
| 23 | Dichtere Natur | ⏳ G3 |
| 24–27 | Lager, Stadtarbeit, Lieferketten, Inspektion | ⏳ G5/G6 |
| 28–29 | Pause und Zeitfaktoren | ✅ G8 (vorgezogen) |
| 30 | Aktiver City-Builder statt AFK | ⏳ Gesamtziel |
| 31 | Browser, Tauri, Tests, TS, ESLint, Build | ✅ bis auf Tauri/Screenshot-Smoke |
