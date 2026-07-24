# Ingame-Zeit — EINE verbindliche Zeit (P-B, D-038)

> Teil des Spielbarkeits-Auftrags (Nutzer, 24.07.2026). Ziel: „Eine einzige
> verbindliche Ingame-Zeit für alle Systeme … die Uhr muss sichtbar korrekt laufen
> und 1×/2×/4× müssen alle zeitabhängigen Systeme konsistent antreiben."

## 1. Befund (vor P-B)

Es gab faktisch **zwei** Zeiten:

1. **Simulationsuhr** `state.meta.lastSimTime` (ms). Wird ausschließlich über
   `controller.advanceByRealTime(realMs, live)` vorgeschoben und dort mit der
   Geschwindigkeit multipliziert. **Alle** Sim-Systeme (Bau, Upgrades, Betriebe,
   Transport, Wirtschaft, Cooldowns, Missions-Ablauf) rechnen bereits gegen diese
   eine Uhr — sie skalieren also korrekt gemeinsam, Pause hält alles an. Diese
   Seite war **schon konsistent**.
2. **Sichtbare „Uhr"** im HUD: las die **kosmetische** Renderer-Tageszeit
   (`environmentSettings.timeOfDay`) und zeigte **statische** Strings „Tag 1" /
   „Frühling". Sie war komplett von der Simulation entkoppelt → wirkte „stehen
   geblieben" und reagierte nicht sauber auf 1×/2×/4×. Zusätzlich fälschte die
   Speed-Leiste die Tageslänge (`dayLengthMin` je Stufe) vor.

Der eigentliche Fehler war also die **entkoppelte Anzeige**, nicht die Simulation.

## 2. Fix (P-B1)

- **Kanonisches Zeitmodul** `src/game/time/gameTime.ts` (rein, keine Renderer-/
  React-Importe, §1). Eine zentrale Zahl:
  `SIM_MS_PER_GAME_MINUTE = 10_000` — bei 1× vergeht eine **Ingame-Minute je 10
  Echtzeitsekunden** (6 Ingame-Min/Echtzeitmin; 2× → 5 s, 4× → 2,5 s). Kein anderes
  System führt einen eigenen Zeitfaktor.
- **`gameClockAt(createdAt, simTime) → GameClock`**: reine Projektion der einen
  Simulationsuhr auf Tag/Stunde/Minute/`timeOfDay`/Jahreszeit. Neue Städte starten
  Tag 1, 08:00 (`START_MINUTE_OF_DAY`). Tag = 1440 Ingame-Min, Jahreszeit = 28
  Ingame-Tage.
- **Controller-Read `getGameClock()`** — die EINE Zeitquelle für die UI.
- **HUD `DayNightControl`** liest nur noch `game.getGameClock()` (re-rendert über
  `useGame()`/`version` bei jedem Tick — **kein `setInterval` in React**, §7.4):
  „Tag N · HH:MM · Jahreszeit", bei Pause „· Pausiert". Der manuelle Tageszeit-
  Regler und der Speed-`dayLengthMin`-Hack sind entfernt (waren Parallelzeit).

## 3. Ratio & Sonne (Nutzerentscheid nach Test, v0.89)

Der Nutzer wählte eine **schnellere Uhr** und eine **an die Uhr gekoppelte Sonne**:

- `SIM_MS_PER_GAME_MINUTE = 4000` — 1× → 1 Ingame-Minute je **4 Echtzeitsekunden**
  (15 Ingame-Min/Echtzeitmin). Voller Ingame-Tag = **96 Echtzeitminuten** bei 1×,
  48 bei 2×, **24 bei 4×** — lebendig genug für eine sichtbar wandernde Sonne.
- **Sonne gekoppelt:** der HUD (`DayNightControl`, immer gemountet) treibt
  `environmentSettings.timeOfDay` aus `getGameClock().timeOfDay` (cycle aus). Bei
  Pause steht die Uhr → steht die Sonne. Schritt je Ingame-Minute (winzig bei
  1440-Min-Tag → optisch glatt). Der manuelle Tageszeit-Regler ist auch aus dem
  Wetter-Panel entfernt — die Uhr besitzt die Zeit; dort bleibt nur die reine
  Wetter-Atmosphäre (klar/Regen/Nebel), weiterhin ohne Sim-/Save-Wirkung.

## 4. Offen — P-B2 (Dauern in Ingame-Zeit + Rebalancing)

- Bau-/Upgrade-/Arbeits-/Transport-/Missionsdauern in **Ingame-Minuten** ausdrücken
  (Config) und über `gameMinutesToSimMs()` in Simulationszeit umrechnen; Countdown-
  Anzeigen in Ingame-Zeit. Anschließend **neu balancieren** (§9): kleine Gebäude
  wenige reale Minuten, mittlere spürbar, große/Upgrades langfristig; 4×
  beschleunigt, trivialisiert aber nicht. Balancing-Tests anpassen.
- Doku dazu: `TIMED_PROCESS_MIGRATION.md` (folgt mit P-B2).

## 5. Tests (`tests/gameTime.test.ts`, 7 Fälle)

Start am Morgen; Minuten-/Stunden-/Tages-/Jahreszeit-Rollover; 1× = Echtzeit;
2×/4× skalieren Uhr **und** `lastSimTime` exakt proportional; **Pause friert
Simulationszeit, Bau und Uhr ein**; Bauzeit bei 2× in halber Echtzeit fertig;
Save/Load erhält die Uhr. Belegt §17 „Zeit" + „Zeitabhängige Systeme".
