import { AlertTriangle, Check, Coins, CornerDownLeft, GitBranch, MapPin, Route, Trash2, Undo2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { formatMoney } from '../../i18n/index.ts';
import { useGame, useUiStore } from '../../state/store.ts';
import { DataMetric, StatusChip } from '../common/GamePanel.tsx';
import { buildSmartRoadPlanView } from './adapters.ts';

export function SmartRoadPlannerHud() {
  const game = useGame();
  const { roadPlanPath, setRoadPlanPath, clearRoadPlan, stopPlacing, pushToast } = useUiStore();
  const view = useMemo(() => buildSmartRoadPlanView(game, roadPlanPath), [game, game.version, roadPlanPath]);
  const raw = useMemo(() => game.roadPathPreview(roadPlanPath), [game, game.version, roadPlanPath]);
  const affordable = game.canAffordCost(raw.totalCost);

  const confirm = () => {
    if (!view.valid || !affordable) return;
    let built = 0;
    for (const tile of raw.tiles) {
      if (tile.status === 'exists') continue;
      const result = game.placeBuilding('road', tile.x, tile.y);
      if (!result.ok) {
        pushToast(`Straßenbau nach ${built} Segmenten gestoppt: ${result.error}`, 'error');
        clearRoadPlan();
        return;
      }
      built += 1;
    }
    pushToast(`${built} Straßensegmente gebaut.`, 'success');
    clearRoadPlan();
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, select, textarea') || target?.isContentEditable) return;
      if (event.key === 'Enter' && view.valid && affordable) {
        event.preventDefault();
        confirm();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <section className="smart-road-planner" onClick={(event) => event.stopPropagation()}>
      <header>
        <span className="smart-road-icon"><Route size={20} /></span>
        <div>
          <small>Smart Planning</small>
          <h3>Straßenentwurf</h3>
        </div>
        <StatusChip tone={view.valid ? 'good' : view.blockedCount > 0 ? 'danger' : 'info'}>
          {view.valid ? 'Baubar' : roadPlanPath.length < 2 ? 'Start und Ziel setzen' : 'Prüfung nötig'}
        </StatusChip>
      </header>

      <div className="smart-road-anchors">
        <span className="anchor-start"><MapPin size={15} /><small>Start</small><b>{view.start ? `${view.start.x}, ${view.start.y}` : 'Karte anklicken'}</b></span>
        <i />
        <span className="anchor-end"><MapPin size={15} /><small>Ziel</small><b>{view.end ? `${view.end.x}, ${view.end.y}` : 'Pfad ziehen'}</b></span>
      </div>

      <div className="smart-road-metrics">
        <DataMetric label="Neue Segmente" value={view.lengthTiles} />
        <DataMetric label="Kosten" value={formatMoney(view.cost)} icon={<Coins size={15} />} tone={affordable ? 'neutral' : 'danger'} />
        <DataMetric label="Brücken" value={view.bridgeCount} tone={view.bridgeCount > 0 ? 'info' : 'neutral'} />
        <DataMetric label="Konflikte" value={view.blockedCount} tone={view.blockedCount > 0 ? 'danger' : 'good'} />
      </div>

      {view.warnings.map((item) => (
        <p className={`inline-warning tone-${item.tone}`} key={item.code}>
          <AlertTriangle size={13} /> {item.label}
        </p>
      ))}
      {!affordable && roadPlanPath.length > 0 && (
        <p className="inline-warning tone-danger"><AlertTriangle size={13} /> Das Stadtbudget deckt die echten Gesamtkosten nicht.</p>
      )}

      <div className="smart-road-actions">
        <button
          type="button"
          className="secondary-action"
          disabled={roadPlanPath.length === 0}
          onClick={() => setRoadPlanPath(roadPlanPath.slice(0, -1))}
        >
          <Undo2 size={15} /> Letztes Segment
        </button>
        <button
          type="button"
          className="secondary-action"
          disabled
          title="Eine alternative Routenberechnung existiert noch nicht im Controller."
        >
          <GitBranch size={15} /> Alternative Route
        </button>
        <button type="button" className="secondary-action" onClick={clearRoadPlan} disabled={roadPlanPath.length === 0}>
          <Trash2 size={15} /> Leeren
        </button>
        <button type="button" className="primary-action" onClick={confirm} disabled={!view.valid || !affordable}>
          <Check size={16} /> Für {formatMoney(view.cost)} bauen
        </button>
        <button type="button" className="icon-button" onClick={stopPlacing} title="Straßenplanung schließen">
          <CornerDownLeft size={17} />
        </button>
      </div>
    </section>
  );
}
