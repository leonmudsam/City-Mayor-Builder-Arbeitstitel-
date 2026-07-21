# SAVE_MIGRATION — Save-Strategie (Schema v10 → v13)

> Verbindliche Dokumentation der Savegame-Entscheidungen: v10 = Insel-Basis
> (MVP4, harter Neustart mit Backup für Vor-Insel-Saves), v11 = Ausbaustufe 2.0
> (echte Migration mit 100 %-Erstattung), v12 = manuelle
> Stadtarbeit-Routen/Fahrzeugwahl, v13 = reservierte Missionsladung. Insel-Saves
> brechen nie.

## Migration v12 → v13 (Ladungsreservierung)

Schema **v13** ergänzt eine laufende Aktivität um das optionale Feld
`reserved?: Partial<Record<ResourceId, number>>`. Neue Liefermissionen reservieren
ihren gesamten kanonischen `costPerTarget × Zielanzahl`-Bedarf beim Start aus dem
globalen Ressourcenpool. Auslieferungen verbrauchen diese Reserve; ein Abbruch
gibt den unverbrauchten Rest zurück. So kann dieselbe Ware nicht parallel für
Bau, Handel und Mission verwendet werden.

Die lineare Migration normalisiert nur auf Version 13. Eine laufende v12-Mission
ohne `reserved` bleibt im kompatiblen bisherigen Verbrauchspfad; es wird keine
Ladung erfunden und nichts doppelt abgezogen. `tests/storage.test.ts` und
`tests/activityReservation.test.ts` prüfen Migration, Roundtrip, Reservierung,
Verbrauch und Rückgabe.

Stadtarbeit Redesign 4.0 (v0.69) fügt keine persistierten Felder hinzu; das
Schema bleibt v13.

## Migration v11 → v12 (Stadtarbeit 2D)

Schema **v12** ergänzt eine laufende Fahraktivität um zwei optionale Felder:

- `vehicle`: die in der Planung validierte `DriveVehicle`-ID.
- `plannedRoadPath`: die lückenlose Liste orthogonal zusammenhängender
  Straßenkacheln `{x,y}`.

Die Migration setzt ausschließlich `schemaVersion = 12`. Alte laufende
Missionen besitzen die Felder nicht und bleiben dadurch semantisch unverändert:
Der Renderer nutzt das Standardfahrzeug aus der Activity-Config und seine
bisherige Wegfindung. Es wird weder eine Route erfunden noch eine Mission
abgebrochen. Neue Pläne werden vor dem Speichern am Controller-Rand gegen
Fahrzeugfreigabe, Zielmenge, Zielreihenfolge und `derived.roadNetwork`
validiert.

**Tests:** `tests/storage.test.ts` prüft `11→12` ohne erfundene Aktivität;
`tests/missions.test.ts` prüft persistierte Fahrzeugwahl/Route;
`tests/routeAnalysis.test.ts` prüft Lücken, Reihenfolge und unerlaubtes Nachspiel.

## Migration v10 → v11 (Ausbaustufe 2.0, `migrations.ts`)

Schema **v11** bündelt beide Datenmodell-Umbauten des Programms
„Ausbaustufe 2.0" in **einer** Migration (vom Nutzer so entschieden):
organische **Regionen** ersetzen die 36 Quadrat-Sektoren, und **Gebäudesystem
2.0** vergrößert fast alle Footprints (Rathaus 3×3→5×5, Feuerwache 2×2→5×5 …)
bei gleichzeitig neuen Stufenketten. Ein v10-Save wird beim Laden vollautomatisch
übernommen:

1. **Rathaus-Umzug:** Das Rathaus wird deterministisch auf den neuen
   Bake-Start (`BAKED_START.townHall`, 5×5) gesetzt; die 5 gebackenen
   Startstraßen werden gratis ergänzt, sofern die Kacheln frei sind.
2. **Sektoren → Regionen:** Eine Region gilt als freigeschaltet, wenn die
   **Mehrheit ihrer Kacheln** in zuvor freigeschalteten v10-Sektoren
   (Kantenlänge 64) lag. Die Startregion ist immer frei; als Teaser markierte
   Regionen (`unlockable:false`, z. B. die Nebelinsel) bleiben immer gesperrt.
   Distrikt-Zentren ordnen ihre Region ihrem Distrikt zu; Distrikte ohne
   überlebendes Zentrum werden aufgelöst.
3. **Gebäude-Prüfung mit 100 %-Erstattung:** In deterministischer Reihenfolge
   (Rathaus → Distrikt-Zentren → Rest nach Id) wird jedes Gebäude gegen die
   neue Welt geprüft (inkrementelle Belegung + Terrain + Regions-Status;
   Straßenanschluss bewusst NICHT — fehlende Straßen sind nur ein
   Diagnose-Hinweis). Entfallene Defs (`house_row`, `apartment`) und Gebäude,
   deren neuer Footprint nicht mehr passt, werden abgerissen und zu **100 %
   zu den ALTEN v10-Preisen** erstattet (`src/game/storage/legacyCosts.ts`,
   ein eingefrorener Kosten-Auszug der v10-Config). Über das neue
   Stufen-Maximum hinaus ausgebaute Gebäude werden geclampt, die alten
   Spätstufen ebenfalls erstattet (z. B. Sägewerk Stufe 3, Wasserpumpe Stufe 2).
4. **Level-Rederivierung:** Das Level wird aus den unveränderten XP mit der
   neuen 20-Level-Kurve neu bestimmt.
5. **Aufräumen:** Brände/Aktivitäts-Ziele auf entfernte Gebäude werden
   bereinigt, aktive Quests auf die neue Zielstruktur normalisiert
   (Fortschritt berechnet der nächste Tick neu), `stats.sectorsUnlocked` →
   `stats.regionsUnlocked` (Startregion zählt nicht).

**UI-Hinweis:** `consumeMigrationNotice()` liefert dem Storage-Adapter eine
Zusammenfassung (`migrationNotice`: erstattete Gebäude + Summen); `App.tsx`
zeigt daraus einmalig einen Toast („Ausbaustufe 2.0 … zu 100 % erstattet").

**Tests:** `tests/storage.test.ts` („migration v10 → v11") mit v10-Fixtures:
Rathaus-Umzug + Regions-Stubs, Erstattung entfallener Defs zu Alt-Preisen,
Footprint-Kollision (2×2→3×3), Stufen-Clamp mit Spätstufen-Erstattung,
Sektor-Mehrheits-Freischaltung inkl. Teaser-Sperre.

---

## Historie: Schema v10 (MVP4-Welt-Neuaufbau)

Vom Nutzer explizit gewählt: **harter Neustart mit Backup** für Vor-Insel-Saves.

## Entscheidung

Mit Schema **v10** wurde die Spielwelt vollständig ersetzt (Insel aus dem
GLB-Bake statt der handdesignten 128×80-Testkarte). Saves ≤ v9 beschreiben eine
**Geografie, die es nicht mehr gibt** — eine Koordinaten-Migration würde Gebäude
ins Meer oder ins Gebirge setzen. Deshalb gilt (Prototyp-Phase, Auftrag §22):

1. **Kein Migrationsversuch** für Saves ≤ v9.
2. **Einmaliges Backup:** Der rohe alte Save wird beim ersten Laden unter dem
   localStorage-Key **`cmb.save.backup.v9`** gesichert (niemals überschrieben,
   niemals von der Runtime geladen).
3. **Sauberer Neustart** auf der Insel + einmalige UI-Meldung
   („Willkommen auf der neuen Insel! … als Backup gesichert").
4. **Kein stiller Verlust:** Der Backup-Key bleibt erhalten; wer den alten Stand
   ansehen will, kann ihn als JSON exportieren.

Dies ist eine **bewusst sanktionierte, einmalige Ausnahme** von CLAUDE.md §3
(„Saves brechen nie"). **Ab v10 gilt der Vertrag wieder uneingeschränkt**: jede
künftige Schema-Änderung ergänzt genau eine Migration n→n+1 in
`src/game/storage/migrations.ts` — Insel-Saves brechen nie.

## Technischer Ablauf

- `migrations.ts`: `migrateAndValidate` wirft für Version 1–9 einen
  **`LegacyWorldSaveError`** (statt zu migrieren); < 1 oder > `SCHEMA_VERSION`
  bleibt `SaveValidationError` (korrupt).
- `localStorageAdapter.ts` (`load`): fängt `LegacyWorldSaveError`, schreibt das
  Roh-JSON nach `cmb.save.backup.v9` (nur falls dort noch nichts liegt), räumt
  den aktiven Slot und liefert `undefined` → `App.tsx` startet ein frisches
  Spiel und zeigt die Meldung (`adapter.legacyBackupCreated`).
- `newGame.ts`: `SCHEMA_VERSION = 10`.

## Slim-Save (v10-Format)

Gleichzeitig wurde das Save-Format verschlankt — bei 147.456 Kacheln wäre das
alte Format (jede Kachel serialisiert) auf mehrere MB gewachsen:

| | v9 (alt) | v10 (neu) |
| --- | --- | --- |
| Sektoren | 40 × 256 Kachel-Objekte | **36 Stubs** `{id,sx,sy,districtId,status}` |
| Terrain | pro Kachel gespeichert | **nie gespeichert** — deterministisch aus `islandTerrain.gen.ts` (+ sparse `terrainOverrides` für Debug/Tests) |
| Belegung | `tile.buildingId` pro Kachel | abgeleitet aus `buildings` (Laufzeit-Index, `rebuildOccupancyIndex` beim Laden) |
| Save-Größe | ~500 KB+ | **wenige KB** |

Konsequenz: `tileAt()` liefert eine **abgeleitete** Sicht; Belegungs-Mutationen
laufen ausschließlich über `occupyTiles`/`clearTiles` (`src/game/map/world.ts`).

## Test-Abdeckung

`tests/storage.test.ts`: Roundtrip v10, Slim-Format (36 Stubs, keine
Kachel-Arrays, < 50 KB), `terrainOverrides`-Persistenz, Korrupt-Abweisung,
`LegacyWorldSaveError` für v1/v5/v9.
