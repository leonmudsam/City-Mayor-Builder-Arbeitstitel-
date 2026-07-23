# Neue Insel — Regionsplan 6.1

40 Regionen folgen Bergkämmen, Küsten, Waldkanten, Plateaus und Wasserläufen.
Geometrie und Nachbarschaft sind generiert; Name, Biom, Level, Kosten und
Produktionscharakter liegen in `regions.config.ts`. Die vollständige Tabelle
wird nach `docs/REGIONS.md` generiert.

## Progressionsanker

| Rolle | Region | Begründung |
|---|---|---|
| Zentraler Start | 24 Herzland | 1.290 Baukacheln, neutral, Score 71,27 |
| frühe Waldexpansion | 1 Westforst | echter Startnachbar, L3, Holzbonus |
| frühe Westexpansion | 3 Westweiden | echter Startnachbar, L4, 3.128 Baukacheln |
| Ankunftskorridor | 8 Ankunftsforst | Küstenpunkt und künftiger Hafen, noch keine Mission |
| Hochgebirgskern | 7 Kronengebirge | L18, keine Baufläche, markante Silhouette |
| trockene Zone | 16 Sonnenkliff | visuelles Wüstenprofil, `TODO(CLAUDE_LOGIC)` |
| Sumpfzone | 40 Schilfdelta | visuelles Sumpfprofil, `TODO(CLAUDE_LOGIC)` |
| Fernteaser | 4/25 | gesperrt bis ehrliches Reise-/Schifffahrtsgameplay existiert |

## Regeln

- Startregion neutral, kostenlos und vom Bake gewählt.
- Ziel Startregion 900–1.400; frühe Nachbarfläche 3.000–5.200.
- Nur Bake-IDs 1–40, keine Rechtecksektoren.
- Voraussetzungsketten dürfen nur echte Landnachbarn verwenden.
- Getrennte Landmassen werden nicht durch automatische Freischaltung
  vorgetäuscht; Hafen-/Wasserwegkandidaten sind Daten-Hooks.
- Der Reveal-Cheat ändert nur Sichtbarkeit, niemals Progression oder Save.
