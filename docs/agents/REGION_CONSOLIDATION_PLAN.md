# Region-Konsolidierungsplan — § Final World Compaction 8.1

**Stand:** v0.76 (Save-Schema v16) · **Quelle:** deterministischer Bake
`tools/bakeWorld.mjs` aus `reference/world/island 3d new.glb` (nie zur Laufzeit
geladen). Verbindliche Config: `src/game/config/regions.config.ts`, Kostenmodell
`src/game/regions/regionCost.ts`.

## 1. Warum konsolidiert wurde

Die v15-Insel hatte **40 kleinteilige Regionen**. In der Praxis lieferten viele
davon beim Freischalten nur wenige hundert Kacheln — eine Erweiterung fühlte sich
folgenlos an, die Karte wirkte zersplittert, und die Progression zerfiel in zu
viele bedeutungslose Mikroschritte (§4 des Auftrags).

Der Umbau fasst diese 40 Landschaften zu **einer zentralen Startregion plus zwölf
bedeutenden Freischaltungen** (insgesamt 13) zusammen. Jede Freischaltung ist jetzt
eine spürbare, strategische Entscheidung mit eigenem Charakter, eigener Baufläche
und eigenem Preis.

> **Kein 1:1-Umbenennen.** Die 13 Regionen entstehen nicht durch Umetikettieren
> alter IDs, sondern durch **Neusegmentierung der (zusätzlich verdichteten)
> Geometrie**: Biom-Cluster → Saaten → kostenbasiertes Mehrquellen-Wachstum
> (fremdes Biom +4, Fluss +6, Höhe ×4) → Merge zu kleiner Komponenten → finale
> IDs nach Größe. Ein deterministisches „alte ID → neue ID"-Mapping existiert
> deshalb bewusst nicht; die Provenienz ist die Geometrie selbst.

## 2. Save-Behandlung statt Gebäude-Remap

Weil **jede** Weltkoordinate, jede Region-ID, die Wasserlinie und der Startanker
gleichzeitig neu sind, wäre eine Koordinatenprojektion alter Gebäude nicht
verlustfrei — unter den meisten projizierten Positionen läge nun Wasser, Gebirge
oder gesperrtes Gebiet. Der Auftrag lässt für genau diesen Fall den transparenten
Weltneustart zu (§13).

- **Migration `v15 → v16`** (`src/game/storage/migrations.ts`) wirft
  `WorldRebuildSaveError`.
- Der Storage-Adapter sichert den alten Stand **einmalig** unter
  `cmb.save.backup.world-v15` und räumt den aktiven Slot.
- **Kein stiller Verlust, keine erfundene Projektion.** Es gibt daher auch keinen
  Gebäude-Refund pro Objekt wie bei `v10→v11` — der gesamte alte Spielstand bleibt
  als Backup erhalten.

## 3. Die 13 Regionen (Ziel-Struktur)

Freischaltweg: **L** = über Land, **S** = über See (verlangt aktiven Hafen —
`dock_small`/`river_port` — in einer bereits erschlossenen Region). Die Quellinsel
ist ein Archipel: nur fünf Regionen hängen über Land zusammen; die übrigen werden
über eine schmale Wasserstraße erschlossen (`requiresHarbor` + gebackene
`seaAdjacent`). Preise sind aus `regionCost.ts` abgeleitet (§8), keine
Fantasiewerte.

| ID | Name | Biom | Baufläche | Level | Kosten | Weg | Freischaltregel | Charakter | Distrikt |
|---:|------|------|----------:|:-----:|-------:|:---:|-----------------|-----------|----------|
| 13 | Zentralland | Zentrum | 820 | 1 | — | Start | frei, vorab | neutral (Bezugspunkt) | Hauptstadt |
| 10 | Nordwald | Wald | 2 224 | 3 | 95 000 | L | Nachbar von 13 · **gratis wählbar** | +45 % Holz | – |
| 7 | Westweiden | Ebene | 2 955 | 3 | 90 000 | L | Nachbar von 13 · **gratis wählbar** | +25 % Nahrung | – |
| 3 | Südterrassen | Hügel | 2 955 | 6 | 215 000 | L (über 7) | Landnachbar erschlossen | +30 % Stein, +15 % Nahrung; teurere Straßen | – |
| 2 | Nordostküste | Küste | 3 361 | 7 | 315 000 | L (über 10) | Landnachbar erschlossen | +20 % Nahrung/Stein | – |
| 4 | Südplateau | Ebene | 4 663 | 9 | 400 000 | S (über 3) | **Hafen nötig** | +30 % Nahrung | – |
| 5 | Flussgarten | Flusstal | 3 889 | 10 | 655 000 | L (über 4) | Landnachbar erschlossen | +30 % Nahrung, +25 % Wasser | **Fluss-Distrikt** |
| 12 | Südforst | Wald | 1 676 | 11 | 545 000 | L (über 5) | Landnachbar erschlossen | +55 % Holz; teurere Straßen | – |
| 6 | Ostebene | Ebene | 4 178 | 12 | 810 000 | L (über 5) | Landnachbar erschlossen | +20 % Nahrung, +15 % Energie | – |
| 11 | Ostforst | Wald | 1 636 | 14 | 1 130 000 | L (über 6) | Landnachbar erschlossen | +60 % Holz; teurere Straßen | – |
| 9 | Sonneninsel | Küste | 1 098 | 16 | 1 495 000 | S | **Hafen nötig** | +35 % Energie, −Wasser; teure Straßen | – |
| 8 | Nordinsel | Insel | 794 | 18 | 2 775 000 | S | **Hafen nötig** | +40 % Stein, +15 % Nahrung; teure Straßen | – |
| 1 | Kronengebirge | Gebirge | 3 833 | 20 | 6 690 000 | S | **Hafen nötig** (Endgame) | +90 % Stein, +20 % Energie, −Nahrung; sehr teure Straßen | – |

**Fluss-Distrikt:** Regionen mit Flusskacheln sind Kandidaten für die einmalige
Distriktgründung (§8): 5 (Flussgarten, 21 Flusskacheln), 1 (Kronengebirge, 12),
12 (Südforst, 2). Vorgesehener Primärkandidat ist **Flussgarten (5)**; es kann nur
ein Fluss-Distrikt gleichzeitig bestehen.

## 4. Erste Erweiterung gratis (§6)

Ab **Level 3** ist die erste Erweiterung nach der Startregion kostenlos. Der
Spieler wählt eine seiner beiden Land-Nachbarlandschaften — **Nordwald (10)** oder
**Westweiden (7)** — frei aus; die jeweils andere bleibt reguläre Kaufoption.

- Keine Geld-, keine XP-Belohnung, kein Bürgeranliegen — reine Progressionsgeste
  (`controller.unlockRegion` überspringt für die Gratisregion die XP-Vergabe).
- UI: Regionsdialog zeigt „🎁 Erste Erweiterung gratis" + „Kostenlos"; beim
  Erreichen von Level 3 erscheint einmalig `message.free_expansion_hint`.
- `controller.getFreeRegionExpansionOptions()` liefert `[7, 10]`; nach der ersten
  Erschließung `[]`.

## 5. Erreichbarkeit / Hafenpflicht

`regionUnlockBlocker(state, id)` (in `src/game/map/world.ts`) entscheidet:

1. Landnachbar einer erschlossenen Region → sofort erschließbar.
2. Sonst Seenachbar einer erschlossenen Region **und** aktiver Hafen → erschließbar.
3. Sonst `needs_harbor` (Seezugang, aber kein Hafen) bzw. `not_adjacent`.

Ohne diese Seeregel wären 8 der 12 Freischaltungen dauerhaft unerreichbar (Archipel).
Der Regionsdialog benennt beide Blocker ehrlich statt nur den Knopf zu sperren.

## 6. Tests (Regressionsschutz)

- `tests/regionCost.test.ts` — Preise folgen dem Faktormodell; Struktur (1 Start,
  12 Freischaltungen), Erreichbarkeit, Hafenkennzeichnung.
- `tests/regions.test.ts` — Gratis-Erst-Erweiterung ohne Belohnung, Hafen-Gate,
  Land-/Nicht-Nachbar-Ablehnung, Regionscharakter, Bürger-Hinweis.
- `tests/world.gen.test.ts` / `tests/newIslandBake.test.ts` — Geometrie, Startkern
  650–950, zweite Verdichtung.
- `tests/storage.test.ts` — v15→v16 Backup-Neustart.
