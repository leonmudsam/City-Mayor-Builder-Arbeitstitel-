# SAVE_MIGRATION — Weltneustart für Schema v15

## Entscheidung

Terrain & World Scale Overhaul 6.1 verändert X/Z-Projektion, Wasserlinie,
Startregion, Regionsflächen und alle Weltkoordinaten. Eine automatische
Projektion von Gebäuden, Straßen, Distrikten, Freischaltungen und aktiven
Fahrmissionen wäre nicht verlustfrei. Deshalb nutzt v14→v15 denselben sicheren,
transparenten Neustartpfad wie der vollständige Weltwechsel 6.0.

## Verhalten v14 → v15

1. `migrateV14ToV15` wirft einen typisierten `WorldRebuildSaveError`.
2. Der Storage-Adapter sichert den unveränderten Roh-Save einmalig unter
   `cmb.save.backup.world-v14`.
3. Der Backup-Key wird niemals automatisch überschrieben.
4. Der aktive inkompatible Slot wird entfernt; ein sauberes v15-Spiel startet
   in Region 24 „Herzland“.
5. Die vorhandene Neustartmeldung informiert über die Sicherung.

Es gibt weder Koordinatenraten noch stillen Datenverlust.

## Historische Stände

- v1–v9: `cmb.save.backup.v9`.
- v10–v13: historischer 13→14-Weltwechsel, Backup
  `cmb.save.backup.world-v13`.
- v14: 14→15-Terrainwechsel, Backup `cmb.save.backup.world-v14`.
- v15: normaler Roundtrip; Terrain/Höhe/Regionen bleiben Bake-Daten, der Save
  enthält nur Gameplayzustand und sparse Terrain-Overrides.
- Korrupte oder zukünftige Daten bleiben `SaveValidationError`.

`tests/storage.test.ts` prüft v15-Roundtrip, beide Weltbackup-Generationen,
Nichtüberschreiben und den expliziten Migrationsschritt 14→15.
