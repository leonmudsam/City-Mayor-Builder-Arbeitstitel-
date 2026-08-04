// § Stadtarbeit 3.0 — DAS EINSATZ-HUD IN DER ECHTEN WELT (A4/A5/A7).
//
// Ersetzt den alten `DriveHud` (drei Zeilen Text). Der Auftrag verlangt:
// „großer Fokus auf Welt, wenige klare Panels, klare Aktion am aktuellen Ort".
// Also genau vier Flächen, und keine davon ist eine Liste:
//
//   unten links  — Tempo und Fahrzustand
//   unten mitte  — nächstes Ziel, offene Ziele, Ladung
//   mitte links  — die nächste Kreuzung mit ihren Richtungen (nur wenn es eine gibt)
//   rechts       — Fahrzeug, Ladung, AKTION AM AKTUELLEN ORT
//
// Jede Zahl ist eine Projektion: Tempo, Kreuzung und „wo stehe ich" kommen aus
// der Fahrschleife (`onDriveStatus`), Bestand und Blockergrund aus dem
// Controller. Hier wird nichts nachgerechnet — sonst gäbe es zwei
// Reichweitenbegriffe, und das HUD böte „Laden" an, wo der Command ablehnt
// (D-048).

import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUp, Gauge, LogOut, PackageMinus, PackagePlus, RotateCcw, Truck } from 'lucide-react';
import { useMemo } from 'react';
import type { CityworkReloadBlocker } from '../../game/commands/controller.ts';
import { t } from '../../i18n/index.ts';
import { getMapApi, useGame, useUiStore } from '../../state/store.ts';

const int = (n: number) => Math.round(n).toLocaleString('de-DE');

/** Ein Satz je Ablehnungsgrund — vollständig getippt, damit keiner fehlt (D-046). */
const BLOCKER_TEXT: Record<CityworkReloadBlocker, string> = {
  no_mission: 'Kein laufender Auftrag.',
  no_cargo_mission: 'Dieser Auftrag transportiert nichts.',
  not_a_store: 'Hier gibt es kein Lager zum Aufnehmen.',
  cargo_full: 'Das Fahrzeug ist voll.',
  insufficient: 'Hier liegt zu wenig von dieser Ware.',
};

const TURN_ICON = {
  left: <ArrowLeft size={16} />,
  straight: <ArrowUp size={16} />,
  right: <ArrowRight size={16} />,
  around: <RotateCcw size={16} />,
} as const;

const TURN_KEY = { left: 'A', straight: 'W', right: 'D', around: 'S' } as const;
const TURN_LABEL = { left: 'links', straight: 'geradeaus', right: 'rechts', around: 'wenden' } as const;

export function MissionHud() {
  const game = useGame();
  const driveActive = useUiStore((s) => s.driveActive);
  const status = useUiStore((s) => s.driveStatus);
  const pushToast = useUiStore((s) => s.pushToast);
  const active = game.state.activities.active;

  const cargo = useMemo(
    () => (active ? game.getActivityCargoStatus() : undefined),
    [game, game.version, active],
  );
  // Das Gebäude, an dem der Wagen steht — dieselbe Ankunftsregel wie beim
  // Abliefern; das HUD misst keine eigene Entfernung.
  const here = useMemo(
    () => (status?.atBuildingId ? game.getCityworkBuildingInfo(status.atBuildingId) : undefined),
    [game, game.version, status?.atBuildingId],
  );

  if (!driveActive || !active) return null;

  const def = game.config.activities.activities.find((a) => a.id === active.defId);
  const done = active.targets.filter((target) => target.done).length;
  const total = active.targets.length;
  const drivenTiles = Math.max(0, (active.plannedRoadPath?.length ?? 1) - 1);

  const deliverHere = here?.delivery && !here.delivery.done ? here.buildingId : undefined;
  const loadBlocker = here?.reloadBlocker;

  return (
    <>
      {/* Kreuzung: erscheint NUR, wenn es wirklich etwas zu entscheiden gibt.
          Eine Kurve ist keine Kreuzung — sie anzukündigen wäre Lärm. */}
      {status?.junction && (
        <div className="mission-junction">
          <span className="mission-junction-head">
            Nächste Kreuzung <strong>in {int(status.junction.distanceMeters)} m</strong>
          </span>
          <div className="mission-junction-turns">
            {status.junction.turns.map((turn) => (
              <span key={turn} className="mission-turn">
                {TURN_ICON[turn]}
                <small>{TURN_LABEL[turn]}</small>
                <kbd>{TURN_KEY[turn]}</kbd>
              </span>
            ))}
          </div>
        </div>
      )}

      <aside className="mission-side">
        <header>
          <Truck size={18} />
          <span>
            <strong>{def ? t(def.nameKey) : 'Einsatz'}</strong>
            <small>{active.vehicle ? t(`vehicle.${active.vehicle}`) : 'Fahrzeug'}</small>
          </span>
        </header>

        {cargo && (
          <div className="mission-cargo">
            <span>Ladung · {t(`resource.${cargo.resource}`)}</span>
            <strong>
              {int(cargo.onboard)} <i>/ {int(cargo.capacity)}</i>
            </strong>
            <span className="mission-bar">
              <span
                className="mission-bar-fill"
                style={{ width: `${cargo.capacity > 0 ? Math.min(100, (cargo.onboard / cargo.capacity) * 100) : 0}%` }}
              />
            </span>
          </div>
        )}

        {/* § A5 — DIE AKTION AM AKTUELLEN ORT. Der eigentliche Unterschied zum
            alten Fahr-HUD: Hier steht nicht, was man tun könnte, sondern was
            man HIER tun kann. */}
        <section className="mission-action">
          <h4>Aktion am Ort</h4>
          {!here && <p className="mission-action-empty">Fahre an ein Gebäude heran.</p>}
          {here && (
            <>
              <p className="mission-action-place">
                {t(here.nameKey)}
                {here.upgradeLevel > 0 && <span> · Stufe {here.upgradeLevel + 1}</span>}
              </p>
              {here.stock.length > 0 && (
                <ul className="mission-action-stock">
                  {here.stock.map((entry) => (
                    <li key={entry.resource}>
                      <span>{t(`resource.${entry.resource}`)}</span>
                      <strong>{int(entry.amount)}</strong>
                    </li>
                  ))}
                </ul>
              )}
              {deliverHere && (
                <button
                  type="button"
                  className="primary-action"
                  onClick={() => {
                    const result = game.progressActivity(deliverHere);
                    pushToast(result.ok ? 'Geliefert.' : t(`error.${result.error}`), result.ok ? 'success' : 'error');
                  }}
                >
                  <PackageMinus size={15} /> Hier abladen
                </button>
              )}
              <button
                type="button"
                className="secondary-action"
                disabled={loadBlocker !== undefined}
                title={loadBlocker ? BLOCKER_TEXT[loadBlocker] : undefined}
                onClick={() => {
                  const result = game.reloadActivityCargo(here.buildingId);
                  pushToast(result.ok ? 'Geladen.' : t(`error.${result.error}`), result.ok ? 'success' : 'error');
                }}
              >
                <PackagePlus size={15} /> Hier laden
              </button>
              {loadBlocker && (
                <p className="mission-action-note">
                  <AlertTriangle size={13} /> {BLOCKER_TEXT[loadBlocker]}
                </p>
              )}
            </>
          )}
        </section>

        <button type="button" className="mission-leave" onClick={() => getMapApi()?.exitDrive()}>
          <LogOut size={15} /> Einsatz verlassen <kbd>Q</kbd>
        </button>
      </aside>

      <footer className="mission-bar-bottom">
        <span className="mission-speed">
          <Gauge size={16} />
          <strong>{status?.stopped ? 0 : int(status?.speedKph ?? 0)}</strong>
          <small>km/h</small>
        </span>
        <span className="mission-metric">
          <small>Offene Ziele</small>
          <strong>
            {total - done} <i>von {total}</i>
          </strong>
        </span>
        <span className="mission-metric">
          <small>Gefahren</small>
          <strong>{(drivenTiles * 0.02).toFixed(2)} km</strong>
        </span>
        <span className="mission-hint">
          <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> an der Kreuzung ·{' '}
          <kbd>Leer</kbd> anhalten · <kbd>Q</kbd> verlassen
        </span>
      </footer>
    </>
  );
}
