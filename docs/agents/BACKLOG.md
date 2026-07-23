# BACKLOG — themensortiert (Single Source of Truth)

> **Zweck:** OPEN_TASKS.md ist nach historischen Aufträgen (8.0/7.0/6.1/5.0/4.0/
> Active Ops/9.0) sortiert — Themen liegen dort verstreut und wirken „verloren".
> Diese Datei bündelt **jeden offenen Auftrag genau einmal, nach Thema**, mit
> Status und Priorität. Bei jeder erledigten Sache hier abhaken **und** die
> Detailquelle (OPEN_TASKS/PLAN-Doc) pflegen. Legende: ✅ fertig · 🟡 teilweise ·
> ❌ offen · `[P0]` Auftrag aktiv · `[P1]` wichtig · `[P2]` später/drop-in.

Stand: 23. Juli 2026 (nach v0.81). Fortschritt zuletzt: Sägewerk aktiv (A1–A4),
Transport (A5), zentraler Start (S1/S2), Fog/Kamera (S3).

---

## 0. AKTIVER AUFTRAG: § 10.0 — Active Resource Loops, Storage, Smart Roads, Final Compaction `[P0]`
> Master-Spec: [`ACTIVE_RESOURCE_LOOPS_10_PLAN.md`](ACTIVE_RESOURCE_LOOPS_10_PLAN.md) ·
> Audit: [`ACTIVE_RESOURCE_LOOPS_10_AUDIT.md`](ACTIVE_RESOURCE_LOOPS_10_AUDIT.md).
> Die 10.0-UI ist schon gebaut (real-data-wired); es fehlt die **Sim** dahinter.
- ✅ R1 Audit (UI voraus, Sim = A1–A5, Welt 512²/34.082/Start 1.400).
- ❌ `[P0]` R2 Dauerbetrieb (persistentes `workArea`, Auto-Pause/Resume, kein Auto-Delete, Save v20).
- ❌ `[P0]` R3 Ressourcennetz (`ResourceNetworkSummary` + benannte Standorte + Lagervergleich) → Thema 2/3.
- ❌ `[P0]` R4 Frühtransport (Handkarren/Handtragen, `InventoryTransferRule`) → Thema 2.
- ❌ `[P0]` R5 Stadtarbeit Ladungsprognose + Nachfüllmarker → Thema 2.
- ❌ `[P0]` R6 Straßen A→B terrainbasiert + Kontrollpunkte → **erledigt zugleich Thema 1**.
- ✅ `[P0]` **R7+R8** (D-035, v0.83): dritte Verdichtung X/Z 0,84 (~−44 %) + weiches
  Uferprofil (Nutzerwunsch, Waterfront 636→1.210); 13 Regionen, zentraler Start 9
  (1.668 bebaubar, Küstenzugang), Save v20. 🟡 offen: Ufer-Feinschliff + stärkere
  Bau-Glättung (falls Placement zu steil) → siehe [[shore-transition-request]].
- ❌ `[P0]` R9 adaptive Uferplattform (Thema 6) · R10 Migration + Balancing.

---

## 1. Straßen & Infrastruktur-Bau
- ✅ Straßen platzieren (1×1, Baumenü), Straßengraph als Sim (`roadNetwork`,
  Anschlussprüfung, Routen, Verkehrsauslastung, regionale Kostenfaktoren).
- ✅ Straßenplan-Vorschau als Modul (`roads/roadPlanning.ts`: Status/Kosten/Brücke
  je Kachel) — genutzt in der Stadtarbeit-Routenplanung.
- ✅ Straßen-Redesign visuell (Gehweg, Laternen, Texturen, Brückenoberfläche).
- 🟡 `[P1]` **Straßenbau als Plan→Vorschau→Bestätigen→Command** (§18.3, Kosten erst
  beim Bestätigen). Vorschau existiert, Bau läuft noch kachelweise sofort.
  (OPEN_TASKS „8.0 G2 Pkt 6".) **Hängt an Pkt 4.①.**
- ❌ `[P1]` **Brücken / Viadukte / Tunnel spielbar bauen** — aktuell nur gebackene
  Hooks (6/24/17), nicht baubar: Kosten, Freigaben, Rampen, Pfeiler, Portale,
  Navigation. (Terrain 6.1 / Häfen 7.0.)
- ❌ `[P2]` **Straßen-Ausbaustufen/-klassen** (Feldweg→Asphalt→Schnellstraße) —
  existiert nicht (genau ein `road`-Typ). *War bisher nirgends erfasst.*
- ❌ `[P2]` Lane-/Kreuzungsbelegung & Kollisionsvermeidung.
- ❌ `[P1]` Echte Straßendaten (nicht faken): Qualität/Zustand, Sperrungen,
  dynamischer Verkehr, Steigung/Höhenprofil aus der Straßenprojektion.

## 2. Stadtarbeit & aktive Aufgaben (Missionen)
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
- ❌ `[P0]` **A6 Steinbruch** (= S7): `operations/nodes.ts` `tree→rock` generalisieren
  + Passiv-Produktionstests migrieren.
- ❌ `[P0]` **A7 Farm** (= S7, Feld-Lebenszyklus) · **A8 Feuerwehr-Dispatch** (= S8).
- ❌ `[P1]` A9 Regeneration-Ausbau (Aufforstung/Setzlinge, `RegenerationProfile`,
  geologische Neuvorkommen).
- ❌ `[P1]` A10 Automatisierung (Vorarbeiter, wiederkehrende Arbeitszonen,
  Lagerregeln, wiederkehrende Transporte).
- ❌ `[P0]` A5-Reste: Zwischenlager-Puffer als eigene Lager, Kraftstoff/Fahrzeugzustand.

## 4. Bauen, Verschieben, Kamera (Core Gameplay 8.0 · G2)
> Reihenfolge zwingend; ① zuerst.
- ❌ `[P1]` ① **Terrain-Picking gegen Höhenfeld** statt y=0-Ebene
  (`ThreeMapRenderer.ts` `groundPointAt`/`pickTileAt`/`updateGhostAt`/`paint`).
  **Voraussetzung für sauberen Straßen-/Gebäudebau.**
- ❌ `[P1]` ② Kamera im Baumodus (LMB/RMB-Belegung, §10.3).
- ❌ `[P1]` ③ Echter GLB-Ghost (Rotation/Sockel/Anschluss/Radius, `placementDiagnostics`).
- ❌ `[P1]` ④ Verschieben als Entwurf (Ghost, Ursprung, Bestätigung = 1 Command).
- ❌ `[P1]` ⑤ Wirkungsradien terrainfolgend (`getCoverageOverlay`).
- ❌ `[P1]` ⑥ Straßenbau als Plan→Vorschau→Bestätigen (= Thema 1).
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
