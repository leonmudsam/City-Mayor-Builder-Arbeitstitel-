import { Car, Flag, Gamepad2, Timer, X } from 'lucide-react';
import { getMapApi, useGame, useUiStore } from '../../state/store.ts';
import { formatDuration, t } from '../../i18n/index.ts';

// § A6 Fahrmodus-HUD: erscheint, während der Spieler selbst ein Missionsfahrzeug
// steuert. Zeigt Missionsname, Restzeit, verbleibende Ziele und die Steuerung —
// plus „Fahrt beenden". Der Renderer besitzt Fahrzeug/Kamera; hier wird nur der
// vom Controller gespiegelte Missionszustand angezeigt.
export function DriveHud() {
  const game = useGame();
  const driveActive = useUiStore((s) => s.driveActive);
  const active = game.state.activities.active;
  if (!driveActive || !active) return null;

  const def = game.config.activities.activities.find((a) => a.id === active.defId);
  const now = game.state.meta.lastSimTime;
  const done = active.targets.filter((tg) => tg.done).length;
  const total = active.targets.length;
  const remaining = active.expiresAt !== undefined ? active.expiresAt - now : undefined;
  const late = remaining !== undefined && remaining <= 0;

  return (
    <div className="drive-hud">
      <div className="drive-hud-head">
        <Car size={18} />
        <span className="drive-hud-name">{def ? t(def.nameKey) : t('ui.drive.title')}</span>
      </div>
      <div className="drive-hud-stats">
        <span className="drive-hud-stat">
          <Flag size={13} /> {t('ui.activity.targets', { done, total })}
        </span>
        {remaining !== undefined && (
          <span className={`drive-hud-stat${late ? ' is-late' : ''}`}>
            <Timer size={13} /> {formatDuration(Math.max(0, remaining))}
          </span>
        )}
      </div>
      <p className="drive-hud-hint">
        <Gamepad2 size={13} /> {t('ui.drive.controls')}
      </p>
      <button className="btn-tiny drive-hud-exit" onClick={() => getMapApi()?.exitDrive()}>
        <X size={14} /> {t('ui.drive.exit')}
      </button>
    </div>
  );
}
