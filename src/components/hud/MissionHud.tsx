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

import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUp, Gauge, LogOut, PackageMinus, PackagePlus, RotateCcw, Truck, Warehouse } from 'lucide-react';
import { useMemo } from 'react';
import type { MissionStopRole } from '../../game/activities/missionStops.ts';
import type { CityworkReloadBlocker } from '../../game/commands/controller.ts';
import { ROAD_TILE_METERS } from '../../game/roads/roadProfile.ts';
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

/**
 * § A6: So viele Halte zeigt das HUD. Vier, weil eine längere Liste unterwegs
 * niemand liest — und weil eine vollständige Liste aller Stadtlager genau das
 * „Excel" wäre, gegen das dieser Auftrag angetreten ist.
 */
const MAX_STOPS = 4;

/** § D-046: jede Rolle beschriftet, vom Compiler eingefordert. */
const STOP_ROLE: Record<MissionStopRole, { label: string; icon: JSX.Element }> = {
  source: { label: 'Start', icon: <Warehouse size={13} /> },
  target: { label: 'Ziel', icon: <PackageMinus size={13} /> },
  storage: { label: 'Lager', icon: <PackagePlus size={13} /> },
};

/** Kacheln → Meter, mit derselben Kachelgröße wie die Straße (kein zweiter Maßstab). */
const metres = (tiles: number) => Math.round(tiles * ROAD_TILE_METERS);

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
  // § A6: Die Halte des Einsatzes — Quelle, offene Ziele, Lager mit Ware.
  // Gefiltert wird in der Simulation (`open`), sortiert wird hier nach der
  // Entfernung zum Wagen: „wo muss ich hin" ist eine Frage des Standorts, und
  // die Liste selbst darf davon nicht abhängen (sonst wäre sie nicht mehr
  // deterministisch).
  const stops = useMemo(() => game.getMissionStops({ open: true }), [game, game.version]);
  const at = status?.at;
  const nearest = useMemo(
    () => stops
      .map((stop) => ({
        stop,
        // Ohne gemeldeten Standort bleibt die Ordnung die der Simulation
        // (Quelle, Ziele, Lager) — geraten wird keine Entfernung.
        distance: at ? Math.hypot(stop.cx - at.x, stop.cy - at.y) : undefined,
      }))
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
      .slice(0, MAX_STOPS),
    [stops, at?.x, at?.y],
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

        {/* § A6 — DIE HALTE. Nicht die Route, nicht die Reihenfolge: die ORTE,
            die für diesen Einsatz etwas bedeuten, nach Entfernung sortiert. Wer
            zuerst am näheren Ziel vorbeikommt, liefert dort (D-070) — deshalb
            ist das eine Auskunft, keine Vorgabe. */}
        {nearest.length > 0 && (
          <section className="mission-stops">
            <h4>Halte in der Nähe</h4>
            <ul>
              {nearest.map(({ stop, distance }) => (
                <li key={stop.buildingId} className={stop.buildingId === here?.buildingId ? 'is-here' : ''}>
                  <span className={`mission-stop-role role-${stop.role}`}>
                    {STOP_ROLE[stop.role].icon}
                    {STOP_ROLE[stop.role].label}
                  </span>
                  <span className="mission-stop-name">{t(stop.nameKey)}</span>
                  {stop.amount !== undefined && stop.resource && (
                    <span className="mission-stop-amount">{int(stop.amount)}</span>
                  )}
                  <span className="mission-stop-distance">
                    {stop.buildingId === here?.buildingId
                      ? 'hier'
                      : distance === undefined
                        ? '—'
                        : `${int(metres(distance))} m`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
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
          {/* Kachel → Meter kommt aus dem Straßenprofil, nicht aus einer Zahl
              im HUD: Zwei Umrechnungen wären zwei Kilometerstände. */}
          <strong>{((drivenTiles * ROAD_TILE_METERS) / 1000).toFixed(2)} km</strong>
        </span>
        <span className="mission-hint">
          <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> an der Kreuzung ·{' '}
          <kbd>Leer</kbd> anhalten · <kbd>Q</kbd> verlassen
        </span>
      </footer>
    </>
  );
}
