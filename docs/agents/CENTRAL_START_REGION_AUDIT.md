# CENTRAL START REGION AUDIT — § Change 9.0, Phase S1/S2

> Audit vor Implementierung (Auftrag §2/§24.1). Grundlage sind die **echten**
> Bake-Daten (`tools/bake-report.md`, `src/game/config/world/islandTerrain.gen.ts`
> → `BAKED_START`), nicht Schätzungen. Weltform kommt aus dem Offline-Bake
> (`tools/bakeWorld.mjs`) und wird nie zur Laufzeit geladen.

## 1. Ist-Zustand (gemessen)

| Kennwert | Ist (Region 13) | Ziel (§3.3/§4/§22) | Bewertung |
|---|---:|---|---|
| Startregion-Id | 13 (grass) | zentral, groß | ⚠️ kleinste Region |
| Direkt bebaubare Kacheln | **820** | **1.200–1.600** | ❌ zu klein |
| Regionsgröße gesamt | 821 | Kern zusammenhängend | ❌ Region ≈ nur Start-Pocket |
| Rathaus (5×5-Anker) | (137,194) | flach, zentral | ✅ ΔH=0.70, flach |
| Expansionsrichtungen (Nachbarn) | **2** (Region 7, 10) | **≥3** | ❌ Sackgassen-Risiko |
| Küstenkante | **0** | Wasser/Hafen erreichbar | ❌ kein direkter Wasserzugang |
| Zentralität | 0.782 | hoch | 🟡 nahe, aber nicht Schwerpunkt |
| Frühfläche inkl. Nachbarn | 5.999 | 1.800–9.500 | ✅ im Zielband |
| Ressourcen-Score | 1.000 | Holz/Stein/Nahrung/Wasser | ✅ (aber siehe §4) |
| Startstraßen | 16 Kacheln, 2 Achsen | erweiterbar | ✅ |

Insel-Referenzpunkte: Bounding-Box-Mitte (256,256), Flächenschwerpunkt der
größten Landmasse **(167.65,225.84)**, Region-13-Zentrum **(141,201)**. Region 13
liegt also spürbar **nordwestlich** des echten Schwerpunkts.

## 2. Kernbefund

Region 13 wurde in Compaction 8.1 bewusst als **kleine, dedizierte Start-Pocket**
(820 Kacheln, 0 Küste, 2 Nachbarn) gebacken. Das erfüllt das alte Ziel
(650–950 Kacheln), **widerspricht** aber dem neuen Auftrag (§3.3: 1.200–1.600
zusammenhängend bebaubar, ≥3 Expansionsrichtungen, erreichbarer Wasserzugang,
langfristiges Zentrum). Die Region ist zu klein für „20–35 frühe Gebäude + echtes
Straßennetz + Wohnblöcke + Sägewerk + Farm + Gewerbe + Grün".

## 3. Ursache & vorhandene Mechanik (nicht neu bauen — §1)

Der Bake besitzt **bereits** ein Startkandidaten-Scoring, das dem geforderten
`StartRegionCandidate` (§3.2) fast 1:1 entspricht: `BAKED_START.score` enthält
`buildableTiles`, `earlyBuildableTiles`, `flatnessScore`, `centralityScore`,
`expansionDirectionScore`, `resourceAccessScore`, `infrastructureScore`,
`waterRisk`, `cliffRisk`, `totalScore` (`tools/bake-report.md` „Top-10-Startflächen").
Die Ursache des Problems ist **nicht** ein fehlendes System, sondern die
**Zielvorgabe des Scorings** (Region-Zielgröße ~6200/min 2400 beim Merge, Start
650–950) und die dedizierte Kleinregion 13.

**Fix-Richtung:** Nicht die Rathausposition manuell verschieben (§3.2 verbietet
das). Stattdessen im Bake:
1. Start-Scoring auf **1.200–1.600 zusammenhängend bebaubar** (Flood-Fill der
   Kern-Baufläche mit Hang-Limit), **≥3 Expansionsrichtungen** und **erreichbaren
   Wasserzugang** (Distanz zu Küste/Fluss als Score-Term) umstellen.
2. Region-13-Sonderfall aufheben oder die Region so vergrößern/zusammenlegen, dass
   der Start in einer echten großen Zentralregion nahe (167,225) liegt.
3. Rathaus + Startstraßen im so gewählten Kern neu setzen (flachster 7×7-Block).
4. Bake neu ausführen → `islandTerrain.gen.ts`/`islandRegions.gen.ts`/
   `islandBuildability.gen.ts` + `bake-report.md` regenerieren.

## 4. Frühressourcen im Startgebiet (§4) — zu prüfen nach Re-Bake

`resourceAccessScore` ist heute 1.000, aber die 4.1–4.4-Anforderungen sind
**qualitativ** (Waldrand in Reichweite, mehrere kleine Steinvorkommen, fruchtbare
Fläche, erreichbarer Fluss/See ohne Klippenblock). Der Re-Bake muss diese pro
Kandidat als getrennte Terme führen: `earlyWoodAccess`, `earlyStoneAccess`,
`earlyFoodAccess`, `freshwaterAccess`, `harborPotential` (§3.2-Interface) — heute
nur als ein aggregierter `resourceAccessScore` vorhanden.

## 5. Regionen/Level/Kosten (§5, Phase S2)

Aktuell 13 Regionen (1 Start + 12), Levelanforderungen/Kosten in
`src/game/config/regions.config.ts` + `levels.config.ts`. Der neue Start ändert
die Nachbarschaft → §5.1-Progression (Level 3 kostenlose Wahl aus 2 Nachbarn,
Level 5/6-7/8-Erweiterungen) muss gegen `config.test.ts`/`balancing.test.ts` neu
validiert werden. **Level-3-Gratiswahl** (§5.2) existiert als Mechanik noch nicht
— prüfen, ob `unlockRegion` einen kostenlosen Pfad kennt (heute Kosten aus Config).

## 6. Problem-/Fix-/Test-Matrix (§2)

| Problem | Ursache | Betroffene Dateien | Geplanter Fix | Tests |
|---|---|---|---|---|
| Start zu klein (820<1.200) | Bake-Ziel „kleine Pocket" (Region 13) | `tools/bakeWorld.mjs`, `world/*.gen.ts` | Start-Scoring auf 1.200–1.600 zusammenhängend, Region 13 vergrößern/mergen, Re-Bake | neuer `startRegion.test.ts`: buildable∈[1200,1600] |
| Nur 2 Expansionsrichtungen | dedizierte Rand-Pocket | `bakeWorld.mjs` | ≥3-Nachbarn-Term ins Scoring | Test: ≥3 Nachbarn der Startregion |
| Kein Wasserzugang (0 Küste) | Region 13 küstenlos | `bakeWorld.mjs` | `freshwaterAccess`/`harborPotential` als Score-Term, Kandidat mit erreichbarer Küste | Test: Distanz Start→Wasser < Schwelle |
| Nicht echtes Zentrum | Region-13-Zentrum (141,201) vs. Schwerpunkt (167,225) | `bakeWorld.mjs` | Zentralität stärker gewichten / Region am Schwerpunkt wählen | Test: centralityScore ≥ Schwelle |
| Frühressourcen nur aggregiert | ein `resourceAccessScore` | `bakeWorld.mjs`, `bake-report.md` | Wood/Stone/Food/Water/Harbor getrennt ausweisen (§3.2) | Report-Snapshot-Test |
| Level-3-Gratiswahl fehlt | kein kostenloser Unlock-Pfad | `regions.config.ts`, `commands/controller.ts` | kostenlose Erstwahl aus 2 Nachbarn | `config.test.ts`/neuer Command-Test |
| Save bricht bei neuem Bake | Weltgeometrie/Regionen ändern sich | `newGame.ts`, `storage/migrations.ts` | `SCHEMA_VERSION`↑ + Backup/Neustart wie v14/v16, alte Saves sichern | `storage.test.ts` |

## 7. Risiko / Reihenfolge

Der Re-Bake ist **save-brechend** (neue Regionen/Koordinaten) — wie die früheren
Weltumbauten (v14/v16) braucht er einen einmaligen Backup-/Neustartpfad und eine
`SCHEMA_VERSION`-Erhöhung. **Vor** S1 unbedingt ein sauberer Git-Sicherungspunkt
(aktuell ist v0.79/Active-Operations **uncommitted**). Reihenfolge: S1 (Bake) →
S2 (Regionsbalancing/Tests) erst danach.
