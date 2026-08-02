# BACKLOG — themensortiert (Single Source of Truth)

> **Zweck:** OPEN_TASKS.md ist nach historischen Aufträgen (8.0/7.0/6.1/5.0/4.0/
> Active Ops/9.0) sortiert — Themen liegen dort verstreut und wirken „verloren".
> Diese Datei bündelt **jeden offenen Auftrag genau einmal, nach Thema**, mit
> Status und Priorität. Bei jeder erledigten Sache hier abhaken **und** die
> Detailquelle (OPEN_TASKS/PLAN-Doc) pflegen. Legende: ✅ fertig · 🟡 teilweise ·
> ❌ offen · `[P0]` Auftrag aktiv · `[P1]` wichtig · `[P2]` später/drop-in.

Stand: 1. August 2026. Straßen-, Höhenprofil- und Fundamentstatus wurden gegen
den produktiven Vertrag abgeglichen; die übrigen historischen Themen bleiben
unverändert fortgeführt.

---

## 0. AKTIVER AUFTRAG: Infrastruktur 2.0 — Höhenstraßen, Brücken, Schifffahrt `[P0]`
> Master-Spec: [`INFRASTRUCTURE_2_PLAN.md`](INFRASTRUCTURE_2_PLAN.md) · Entscheid: **D-036**.
> **Vorgezogen auf ausdrücklichen Nutzerwunsch (24.07.2026):** entscheidender Punkt
> zum Weiterspielen — die verdichtete Welt (D-035) blockiert Expansion über Höhen/Wasser.
- ✅ `[P0]` **I1 Eine automatische Straße für Höhe und Wasser:** Der Spieler baut
  ausschließlich `road`; Profil und Terrain wählen `flat`/`slope`/`pass`/
  `support`/`viaduct`/`bridge`/`coast`. `road_elevated` bleibt nur für alte Saves
  und API-Kompatibilität ladbar. Deckhöhe, Brückendeck und instanzierte Stützen
  lesen das eingefrorene `roadEngineering`.
- 🟡 `[P0]` **I2 Saubere Straßenstruktur:** terrainbewusstes A→B-Routing,
  automatische Kehren, 8-%-Profil, geglättete Kurven, farbige Höhenvorschau und
  atomarer Bulk-Bau sind produktiv. Offen bleiben frei ziehbare
  Kontrollpunkt-Griffe, eine echte Alternativroute und eine flüchtige
  Cursor-Endpunktvorschau.
- 🟡 `[P0]` **I3 Küste/Ufer + Anleger als Netzknoten**: ✅ Netzknoten-Modell (v0.96,
  `networkSegments.ts` + `harborNodes.ts` — Stadtnetz vs. lokales Netz, `linksToCityVia`);
  ❌ R9 adaptive Uferplattform (Renderer/Bake) offen.
- 🟡 `[P0]` **I4 Schifffahrtsnetz**: ✅ persistente Routen (v0.97, **Save v22** +
  Migration v21→v22): `shippingRoutes.ts`, Frachtkahn, Kapazität/Fahrzeit/Kosten/
  Pause/Löschen, 10 Tests. ❌ offen: 3D-Schiffe, echte multimodale Legs.
  (Routen-UI ✅ mit I5/v0.98.)
- 🟡 `[P1]` **I5**: ✅ Infrastruktur-Netz-UI (v0.98, Reiter Straßen/Brücken/Anleger/
  Schiffe + Routenbedienung). ❌ **Bevölkerungs-Rebalancing braucht Entscheidung**
  (kein einheitlicher Faktor → echte Neubalancierung von Level-/Questzielen +
  Migration; siehe OPEN_TASKS).

## 0b. ZURÜCKGESTELLT (nach Infrastruktur 2.0): § 10.0 — Active Resource Loops, Storage, Compaction `[P0]`
> Master-Spec: [`ACTIVE_RESOURCE_LOOPS_10_PLAN.md`](ACTIVE_RESOURCE_LOOPS_10_PLAN.md) ·
> Audit: [`ACTIVE_RESOURCE_LOOPS_10_AUDIT.md`](ACTIVE_RESOURCE_LOOPS_10_AUDIT.md).
> Die 10.0-UI ist schon gebaut (real-data-wired); es fehlt die **Sim** dahinter.
- ✅ R1 Audit (UI voraus, Sim = A1–A5, Welt 512²/34.082/Start 1.400).
- ✅ `[P0]` **R2 Dauerbetrieb** (v0.99, **Save v23** + Migration v22→v23): persistentes
  `workArea` (circle) + `continuous`, Status `waiting`, Auto-Pause/Resume statt
  Auto-Delete, `getContinuousOperationStatus`. 5 Tests.
  ⏳ Rechteck-/Polygonflächen offen (UI-Entwurfsvertrag nötig).
- ✅ `[P0]` **R2/§5 Durchsatz-Diagnose** (v1.00): falsche passive `produce`-Rate für
  Betriebe aus Gebäudefenster + Baumenü entfernt; `getOperationThroughput` projiziert
  die echte Arbeitsschleife mit den Tick-Formeln. Keine Save-/Sim-Änderung. 2 Tests.
  ⏳ Gemessener rollierender Durchsatz offen (braucht persistierte Historie).
- 🟡 `[P0]` **R3 Ressourcennetz**: ✅ Lagervergleich (v1.01, `buildStorageComparison` — Belegung/frei/Engpass, nur physische Lager). ❌ getrennte Rathaus-/Lagerhausanteile offen (braucht Bestandsmodell je Gebäude).
- 🟡 `[P0]` **R4 Frühtransport**: ✅ Handkarren real (v0.91) + hart kodierter Platzhalter entfernt (v1.01, Methoden nur noch aus dem Katalog). ❌ `InventoryTransferRule` + physisches Rathauslager offen.
- ✅ `[P0]` **R5 Ladungsprognose + Nachfüllmarker** (v1.02): `required`/`requiredForBuildingId`
  je Nachfüllstopp aus Vorausschau auf dem echten Weg; UI zeigt Pflicht vs. optional. 2 Tests.
- ➡️ `[P0]` R6 Straßen A→B terrainbasiert + Kontrollpunkte → **wandert in Infrastruktur 2.0 / I2**.
- ✅ `[P0]` **R7+R8** (D-035, v0.83): dritte Verdichtung X/Z 0,84 (~−44 %) + weiches
  Uferprofil (Nutzerwunsch, Waterfront 636→1.210); 13 Regionen, zentraler Start 9
  (1.668 bebaubar, Küstenzugang), Save v20. 🟡 offen: Ufer-Feinschliff + stärkere
  Bau-Glättung (falls Placement zu steil) → siehe [[shore-transition-request]].
- ➡️ `[P0]` R9 adaptive Uferplattform → **wandert in Infrastruktur 2.0 / I3** · **R10**: ✅ Migrationskette lückenlos abgesichert (v1.03, Test gegengeprüft); ❌ Balancing-Abschluss offen (haengt an P-B2 + Bevoelkerungs-Entscheid).

---

## 1. Straßen & Infrastruktur-Bau
- ✅ Straßen platzieren (1×1, Baumenü), Straßengraph als Sim (`roadNetwork`,
  Anschlussprüfung, Routen, Verkehrsauslastung, regionale Kostenfaktoren).
- ✅ Straßenplan-Vorschau als kanonisches Modul (`roads/roadPlanning.ts`): Status,
  automatische Variante, Terrain-/Deckhöhe, Steigung, Freiraum und echte Kosten
  je Kachel plus gemeinsames `RoadHeightProfile` für HUD und Renderer.
- ✅ Straßen-Redesign visuell (Gehweg, Laternen, Texturen, Brückenoberfläche).
- ✅ `[P1]` **Straßenbau als Plan→Vorschau→Bestätigen→Command** (§18.3):
  `roadPathPreview` bleibt mutationsfrei; `buildRoadPath` prüft den Gesamtpfad,
  bucht die exakt gezeigte Geld-/Materialsumme einmal ab und schreibt alle neuen
  Abschnitte in einem Bulk-Commit mit genau einer Zustandsbenachrichtigung.
- ✅ `[P0]` **Höhenstraßen / Brücken / Viadukte automatisch:** Das eine öffentliche
  `road`-Werkzeug überwindet Wasser, Klippen und Höhenzüge über profilgesteuerte
  Varianten. Unmögliche Landanker oder ein nicht auf ≤8 % verlängerbarer Pfad
  bleiben ehrlich unbaubar.
- ❌ `[P1]` Tunnel/Portale sowie spielmechanische Durchfahrtshöhen und
  Schiffsklassen. Viadukte gehören nicht mehr zu diesem offenen Punkt.
- ✅ `[P0]` **Eine Straße statt auswählbarer Bauklassen:** Varianten und ihre
  Zuschläge sind datengetrieben, aber keine separaten Spielerwerkzeuge.
  Schnellstraßen wären eine spätere Gameplay-Entscheidung, kein Teil des
  automatischen Konstruktionsprofils.
- ❌ `[P2]` Lane-/Kreuzungsbelegung & Kollisionsvermeidung.
- 🟡 `[P1]` Echte Straßendaten (nicht faken): ✅ Steigung/Höhenprofil und
  persistiertes Engineering; ❌ Qualität/Zustand, Sperrungen und dynamischer
  Verkehr.

## 2. Stadtarbeit & aktive Aufgaben (Missionen)
> Auftrag „Stadtarbeit Overhaul" §§1–13 läuft. Karte: `CITYWORK_MAP_PIPELINE.md`
> (D-051). Fahrt: D-050 — es gibt **eine** Fahrphysik für 3D und 2D.
- ✅ `[P0]` **P2 Ausführungsart als Wahl** (v1.30, Save v30, D-050): `auto`
  (Stadt fährt) gegen `manual` (Spieler fährt, +20 %), beim Start festgeschrieben;
  gefahren wird in der 2D-Stadtarbeitskarte, nie in der 3D-Welt.
- ✅ `[P0]` **P3 Karte aus der echten Welt + Straßenfahren** (v1.33, Save v31,
  D-051): Höhenrelief, Wassertiefe, Klippen-/Strandküste, Vegetation aus
  `collectRegionNature`; Marker für Lager/Logistik/Hafen/Betrieb aus den
  Config-Wirkungen; Brücken/Viadukte aus `roadEngineering.variant`; alternative
  Route und gefahrene Spur; Fahren straßengebunden (W/S/A/D), Tempo aus
  `speedKph`; Fahr-Status mit Abbiegehinweis. 38 Tests.
- ❌ `[P0]` **P4 Lagerbestände je Gebäude** (= §8 des Auftrags, NÄCHSTER SCHRITT):
  Stadtarbeit rechnet mit einem globalen Pool, das Nachlade-Panel des Mockups
  zeigt drei Bestände. Lokale Inventare gibt es in `operations/**` —
  **zusammenführen, kein drittes Lagermodell**. Migration v31→v32.
- ❌ `[P1]` **§9 Verkehrsrückkopplung:** `congestionScore` kommt aus der
  Anrainerdichte, nicht aus gefahrenen Routen.
- ❌ `[P1]` **§10 Gesamtlayout nach Mockup** (LINKS/MITTE/RECHTS/UNTEN); bisher
  nur der Fahr-Status unten.
- ✅ Redesign 4.0: Route zeichnen/Pan/Zoom, Live-Tour, Cargo, Nachfüllstopps,
  Leerfahrt, Infrastrukturberater, Fahrzeugkarten, 9 Missionen + Entscheidungs-Events.
- ✅ Neue Missionen sind **drop-in** (`activities.config.ts`) — Erweitern statt neu.
- ❌ `[P1]` Logistik-Daten 2 (`CITYWORK_LOGIC_2_PLAN.md`): `sourceBuildingId` als
  Command-Param · Plan-Legs (Zwischenlager, Depot-Rückkehr, Rückwaren, optionale
  Ziele, Fahrzeugwechsel, mehrere Fahrzeuge) · gebäudeeigener Quellbestand ·
  adaptive Mengen (L5) · Zwischenlager (L6) · **Bahn/Flug (L7)**
  (`freight_train`/`cargo_plane` sind `future:true`, Legs fehlen).
- ❌ `[P1]` Echte Sim-Daten je Fahrt: Kraftstoff, Fahrzeugzustand/Schäden,
  `rewardMultiplier` an Auszahlung koppeln, 3D-Etappen (Quellhalt/Nachladen/Rückfahrt).
- ❌ `[P2]` `RouteTrafficForecast.criticalSegments` auf der Planungskarte markieren
  (`ManualRouteMap.tsx`, Daten liegen an).
- ❌ `[P1]` Multimodale Legs `road→harbor→water→harbor→road` (mit Häfen 7.0).

## 3. Aktive Betriebe (Active Operations 2.0) — überlappt 9.0 S6–S8
- ✅ A1–A4 Sägewerk aktiv (Arbeiter, Baumknoten, lokales Lager, Regeneration).
- ✅ A5 Transport ins Zentrallager (+ Mehrfachladung, Rückruf, Betriebskosten).
- ✅ `[P0]` **A6 Steinbruch + A7 Farm** (= S7, v1.25, D-046): Knoten auf
  `tree`/`rock`/`crop` generalisiert, Stein wächst nie nach, Logistik-Zuschlag auf
  Tempo statt Passivrate, Wortfeld je Knotentyp (`nodeVocabulary.ts`), sichtbare
  Endlichkeit. 22 Tests. ⏳ offen: Rechteck/Polygon, Abbauanimationen, Mesh-Raycast.
- ❌ `[P0]` **A8 Feuerwehr-Dispatch** (= S8).
- ❌ `[P1]` A9 Regeneration-Ausbau (Aufforstung/Setzlinge, `RegenerationProfile`,
  geologische Neuvorkommen).
- ❌ `[P1]` A10 Automatisierung (Vorarbeiter, wiederkehrende Arbeitszonen,
  Lagerregeln, wiederkehrende Transporte).
- ❌ `[P0]` A5-Reste: Zwischenlager-Puffer als eigene Lager, Kraftstoff/Fahrzeugzustand.

## 4. Bauen, Verschieben, Kamera (Core Gameplay 8.0 · G2)
> Reihenfolge zwingend; ① zuerst.
- ✅ `[P1]` ① **Terrain-Picking gegen Höhenfeld** statt y=0-Ebene (v0.94):
  reiner Helfer `terrainPicking.ts` (`raycastHeightfield`) treibt `groundPointAt` →
  `pickTileAt`/`updateGhostAt`/`paint`/`selectAt`/Cursor-Zoom treffen auf Hängen
  exakt. `terrainHeightAt` bleibt einzige Höhenquelle. 6 Tests. Keine Save-Änderung.
- ✅ `[P1]` ② **Kamera im Baumodus** (§10.3, v0.95): reine Stelle
  `cameraInputMapping.ts` (`deriveDragMode`/`deriveClickAction`) — Mitteltaste
  schwenkt, Rechts-Zug dreht, Rechts-Klick bricht ab, `Strg`+Links dreht; Bauentwurf
  überlebt jede Kamerabewegung. 6 Tests. Keine Save-Änderung.
- ✅ `[P1]` ③ **Echter GLB-Ghost inkl. Anschlusspunkt** (v1.26, D-047): GLB/Rotation/
  Sockel/Radius waren vorhanden; neu sind `connectedRoadTiles` als **einzige**
  Aufzählung der Anschlusskacheln, `PlacementDiagnostics.roadTiles`/`requiresRoad`,
  **eine** Diagnose statt drei Einzelabfragen im Ghost, Marker auf den
  Anschlusskacheln und eine eigene Warnstufe „baubar, aber ohne Wirkung"
  (`requiresRoad` blockiert nicht — im Startzustand 3.652 von 3.721 Kacheln gültig
  UND unverbunden). 7 Tests. Keine Save-/Sim-Änderung.
- ✅ `[P1]` ④ **Verschieben als Entwurf** (v1.27, D-048): `setMoving()` war ein
  No-op (Kommentar auf den entfernten 2D-/Iso-Modus) — der „Versetzen"-Knopf von
  **14 der 34 Gebäude** führte ins Leere, `onMove` wurde nie gerufen. Neu:
  `placementDraft()` als EINE Ghost-Strecke für Bauen und Versetzen,
  `moveOriginGroup` markiert den Ursprung, Bestätigung = genau ein Command.
  `evaluateMove` trägt Command **und** `moveDiagnostics` (D-048), damit der Ghost
  nicht grün ist, wo `feature_disabled`/`insufficient` ablehnt. 10 Tests.
  Keine Save-/Sim-Änderung. Offen: Stufe-0-Modell im Ghost, kein Drag-and-Drop.
- ✅ `[P1]` ⑤ Wirkungsradien — **erledigt (v1.28, D-049).** Terrainfolgend war
  längst umgesetzt; falsch war die **Form**: Reichweite ist Chebyshev (Quadrat),
  gezeichnet wurde ein eingeschriebener Kreis → 19–30 % der versorgten Kacheln
  unsichtbar. Die Simulation liefert die Fläche jetzt mit
  (`CoverageSourceView.area`). Zusätzlich: Radius bei Hover; Arbeitsgebiet
  ebenfalls quadratisch. 4 Tests. Keine Save-/Sim-Änderung.
  Offen (Sim, nicht Render): `nodesInWorkArea` bietet 120–171 Kacheln an, die
  `previewOperation` per Chebyshev verwirft.
- ✅ `[P1]` ⑥ Straßenbau als Plan→Vorschau→Bestätigen (= Thema 1): ein
  mutationsfreier Preview-Vertrag und ein atomarer `buildRoadPath`-Bulk-Command.
- ❌ `[P2]` G3–G8: Weltmaßstab-Klärung, Bevölkerungsmodell (Save-Migration),
  Lieferketten §7, aktive Minispiele §8.

## 5. Welt: Grafik, Vegetation, Performance (9.0 S4/S5 + Vegetation 2 + Map 5.0)
- ✅ S3 Fog of War (globale weiche Front, Kamera-Clamping, Cheat).
- ❌ `[P0]` **S4 Vegetations-Performance**: Kachel-Chunking, LOD/Chunk, HLOD-
  Waldcluster, Impostor-Billboards, Shader-Wind, Waldboden-Schattenmaske, Dev-Panel.
  **Enthält den inkrementellen Deko-/Vegetations-Neuaufbau bei Unlock (S3d).**
- ❌ `[P0]` **S5 Lebendige Welt**: Waldstruktur, Mammutbäume (`giant_pine_*`/
  `ancient_tree_*` drop-in), Unterholz, Tierhabitate.
- ❌ `[P1]` Zielhardware-Abnahme (Windows): FPS/Draw-Calls/VRAM Stadt+Vollinsel messen;
  Caps nur datenbasiert ändern.
- ❌ `[P2]` Optimierte Welt-GLBs einlegen (Felsbogen, Urbaum, Ruine, Wüstenfelsnadel,
  Sumpfbaum, Seeinsel, Schilf, Totholz, Felscluster) + weitere PBR-Sets.
- ❌ `[P2]` TODO(CLAUDE_LOGIC): Morgenküste/Westbucht spielmechanisch Wüste/Sumpf?
  (`worldVisualProfiles.ts` — dann Config+Balancing+Migration.)

## 6. Häfen & Wasser-Infrastruktur (Overhaul 7.0)
- ❌ `[P1]` Persistente Schifffahrtsrouten (Commands, Schiffszuteilung, Kapazität,
  Reisezeit, Betriebskosten, Pausen/Löschen).
- ❌ `[P1]` Hafenbetrieb: Arbeitskräfte, Energie, lokales Lager, Umschlag, Straßen-
  Vor-/Nachlauf. `water_only` versorgt keine Region automatisch.
- ❌ `[P1]` Remote Construction über zwei Häfen (reservierte Baumaterialien).
- ❌ `[P2]` `trade_harbor`/`ferry_terminal`/`fishing_harbor`/`shipyard` aktivieren
  (Assets in `HARBOR_SYSTEM_PLAN.md`, erst nach Config-/Balancing-Entscheidung).

## 7. Konkrete Code-Marker `TODO(CLAUDE_LOGIC)`
- ❌ `[P2]` `RegionDialog.tsx` — Regionsdialog-Skeleton ausbauen (`regionPreview.ts`).
- ❌ `[P2]` `worldVisualProfiles.ts` — Wüsten-/Sumpf-Gameplay nur über Config.
- ❌ `[P2]` `ActivityRoutePlanner.tsx` / `controller.ts:1039` — Infrastrukturwarnung
  mit `roadPoint`/`segmentId`.

## 8. Gebäude — Proportionen, Größen & Art (Content-/Balancing-Pass)
> Das **System** ist da & datengetrieben (`def.size{w,h}` = Grundfläche;
> `sizeClass`/`visual.heightClass` = Höhe; Auto-Fit auf Footprint × `visual.scale`;
> `visual.rotationOffset`/`footprintVisualOffset`). Offen ist der **Review-Pass**:
- ✅ Automatische Fundamente sind kanonisch: `foundationPlanForSurface` ordnet
  `BUILDABLE_FLAT`/`BUILDABLE_SLOPE`/`BUILDABLE_TERRACE`/`WATER_EDGE`/`CLIFF`
  einer Konstruktion zu und liefert dieselben Zusatzkosten und dieselbe Bauzeit
  an Diagnose, Command, Ghost und Renderer. `validatePlacement` bleibt trotzdem
  die alleinige Autorität dafür, ob ein Standort überhaupt zulässig ist.
- ❌ `[P1]` **Proportionen vergleichen** — alle Gebäude gegeneinander (und gegen
  Mockups) prüfen: relative Grundfläche UND Höhe glaubwürdig? (Rathaus grand,
  Haus klein, Kraftwerk massiv). Tooling vorhanden: `modelThumbnail.ts` +
  Bau-Shop-Vorschauen → Vergleichsansicht/Screenshot rendern.
- ❌ `[P1]` **Größen anpassen** je Gebäude: `visual.scale`/`heightClass` (rein
  **kosmetisch, save-sicher**) und ggf. `sizeClass`.
- ❌ `[P2]` **`size{w,h}` justieren** = **Balancing-Änderung** (betrifft Platzierung/
  Radien/Kosten, kann bestehende Platzierungen ungültig machen) — nur mit
  `config.test.ts`/`balancing.test.ts`-Abgleich, nicht leichtfertig.
- ❌ `[P2]` Konsistente Sockel/Anschlusspunkte & Stufen-Silhouetten pro Kette
  (Sägewerk→Großsägewerk→Holzkombinat etc.) gegenprüfen.

## 9. Assets & Build (drop-in, kein Bug)
- ❌ `[P2]` Erweiterter Biom-Prop-Katalog (Wasserfälle/Windmühlen/Boote/Landmarken) —
  Prompts existieren, prozedurale Fallbacks decken den Kern.
- ❌ `[P2]` Alte Referenz-GLBs nach `reference/legacy-world/` archivieren;
  Regionsbild-Batchrenderer.
- ❌ `[P2]` **Nativer Tauri-Build** lokal (Cloud kann nicht — nur Browser-Pfad).

---

**Reihenfolge-Realität:** Der aktive Auftrag 9.0 (§24) bindet an **S4→S8**. Themen
1/2/4/6 (Straßen, Stadtarbeit-Erweiterung, Bauen/Kamera, Häfen) sind **ältere,
unabhängige Aufträge** und können auf Wunsch vorgezogen werden (z. B. Thema 4.①
Picking → Thema 1 Straßenbau als spürbarer Kern-Fix).
