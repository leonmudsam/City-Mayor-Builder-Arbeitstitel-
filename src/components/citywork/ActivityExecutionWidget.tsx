import { Bot, Camera, CameraOff, Flag, Gamepad2, Map, Route, Timer, Truck, X } from 'lucide-react';
import { vehicleImage } from '../../assets/registry.ts';
import { formatDuration, t } from '../../i18n/index.ts';
import { playFeedback } from '../../services/feedback.ts';
import { useGame, useUiStore } from '../../state/store.ts';

export function ActivityExecutionWidget() {
  const game = useGame();
  const active = game.state.activities.active;
  const openPlanner = useUiStore((state) => state.openActivityPlanner);
  const missionFollow = useUiStore((state) => state.missionFollow);
  const setMissionFollow = useUiStore((state) => state.setMissionFollow);
  if (!active) return null;
  const definition = game.config.activities.activities.find((activity) => activity.id === active.defId);
  if (!definition?.drive) return null;
  const vehicle = game.config.activities.vehicles.find(
    (candidate) => candidate.id === (active.vehicle ?? definition.vehicle),
  );
  const image = vehicle ? vehicleImage(vehicle.imageKey) : undefined;
  const mode = game.getActiveTransportMode();
  const done = active.targets.filter((target) => target.done).length;
  const next = active.targets.find((target) => !target.done);
  const nextBuilding = next && game.state.buildings[next.buildingId];
  const nextDefinition = nextBuilding && game.config.buildings.get(nextBuilding.defId);
  const remaining =
    active.expiresAt !== undefined ? Math.max(0, active.expiresAt - game.state.meta.lastSimTime) : undefined;

  return (
    <aside className="citywork-execution">
      <div className="citywork-execution-art">
        {image ? <img src={image} alt="" /> : <Truck size={42} />}
        <span><i /> Auftrag läuft</span>
      </div>
      <div className="citywork-execution-copy">
        <small>Aktive Stadtarbeit</small>
        <strong>{t(definition.nameKey)}</strong>
        <p><Map size={13} /> Nächstes Ziel: {nextDefinition ? t(nextDefinition.nameKey) : 'Ziel wird angefahren'}</p>
        <div className="citywork-execution-progress"><i style={{ width: `${(done / active.targets.length) * 100}%` }} /></div>
        <div className="citywork-execution-stats">
          <span><Flag size={12} /> {done} / {active.targets.length}</span>
          {remaining !== undefined && <span><Timer size={12} /> {formatDuration(remaining)}</span>}
          <span>{vehicle ? t(vehicle.nameKey) : t('ui.route.vehicle.van')}</span>
          {/* § P2 (D-050): Die beim Start festgeschriebene Ausführungsart bleibt
              sichtbar — sonst rätselt der Spieler, warum sich das Fahrzeug
              bewegt (oder eben nicht). */}
          <span>{mode === 'manual' ? <><Gamepad2 size={12} /> Du fährst</> : <><Bot size={12} /> Die Stadt fährt</>}</span>
        </div>
      </div>
      <div className="citywork-execution-actions">
        {/* § P2 (D-050): DER Einstieg ans Lenkrad — und er führt in die
            2D-Stadtarbeitskarte, nicht in die 3D-Welt. Wer mit Q/ESC aussteigt,
            kommt hier wieder hinein. */}
        {mode === 'manual' && (
          <button
            onClick={() => {
              playFeedback('activity_start');
              openPlanner(active.defId);
            }}
          >
            <Gamepad2 size={15} /> {t('ui.drive.start')}
          </button>
        )}
        <button
          className={missionFollow ? 'active' : ''}
          onClick={() => {
            const nextState = !missionFollow;
            setMissionFollow(nextState);
          }}
        >
          {missionFollow ? <CameraOff size={15} /> : <Camera size={15} />}
          {missionFollow ? 'Freie Kamera' : 'Fahrzeug folgen'}
        </button>
        <button onClick={() => openPlanner(active.defId)}><Route size={15} /> 2D-Route</button>
        <button
          className="danger"
          onClick={() => {
            setMissionFollow(false);
            game.abandonActivity();
          }}
        >
          <X size={15} /> Abbrechen
        </button>
      </div>
    </aside>
  );
}
