import { AlertTriangle, Check, CornerDownLeft, MapPin, Route, Trash2, Undo2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import type { ResourceId, RoadVariant } from '../../game/types.ts';
import { formatMoney, t } from '../../i18n/index.ts';
import { useGame, useUiStore } from '../../state/store.ts';
import { DataMetric, StatusChip } from '../common/GamePanel.tsx';
import { ResourceIcon } from '../common/icons.tsx';
import { buildSmartRoadPlanView, getSmartRoadPlanPreview } from './adapters.ts';

const int = (value: number): string => Math.round(value).toLocaleString('de-DE');
const pct = (value: number): string => `${value.toLocaleString('de-DE', { maximumFractionDigits: 1 })} %`;
const VARIANT_LABEL: Record<RoadVariant, string> = {
  flat: 'Landstraße',
  slope: 'Hangstraße',
  pass: 'Passstraße',
  support: 'Stützstraße',
  viaduct: 'Viadukt',
  bridge: 'Brücke',
  coast: 'Küstenstraße',
};

function HeightProfile({ points }: { points: readonly { terrainHeight: number; roadHeight: number }[] }) {
  if (points.length < 2) return <div className="smart-road-profile-empty">Start und Ziel setzen</div>;
  const values = points.flatMap((point) => [point.terrainHeight, point.roadHeight]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0.25, max - min);
  const polyline = (field: 'terrainHeight' | 'roadHeight') => points.map((point, index) => {
    const x = (index / Math.max(1, points.length - 1)) * 240;
    const y = 58 - ((point[field] - min) / range) * 48;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg className="smart-road-profile" viewBox="0 0 240 64" role="img" aria-label="Höhenprofil von Gelände und Fahrbahn">
      <defs>
        <linearGradient id="road-profile-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#69df8e" stopOpacity=".3" />
          <stop offset="1" stopColor="#69df8e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline className="terrain-line" points={polyline('terrainHeight')} />
      <polyline className="road-line" points={polyline('roadHeight')} />
    </svg>
  );
}

export function SmartRoadPlannerHud() {
  const game = useGame();
  const { roadPlanPath, setRoadPlanPath, clearRoadPlan, stopPlacing, pushToast } = useUiStore();
  // Spielerisch gibt es genau eine Straße. `road_elevated` bleibt nur als
  // Legacy-Save-Definition erhalten und ist niemals ein Werkzeug im Planner.
  const roadDefId = 'road';
  const raw = useMemo(
    () => getSmartRoadPlanPreview(game, roadPlanPath, roadDefId),
    [game, game.version, roadPlanPath],
  );
  const view = useMemo(
    () => buildSmartRoadPlanView(game, roadPlanPath, roadDefId, raw),
    [game, roadPlanPath, raw],
  );
  const affordable = game.canAffordCost(raw.totalCost);
  const missing = Object.entries(raw.totalCost)
    .map(([res, need]) => ({
      res: res as ResourceId,
      need: need ?? 0,
      have: game.state.resources[res as ResourceId] ?? 0,
    }))
    .filter((item) => item.have < item.need);
  const variants = (Object.entries(view.variantCounts) as [RoadVariant, number][])
    .filter(([, count]) => count > 0);

  const confirm = () => {
    if (!view.valid || !affordable) return;
    const result = game.buildRoadPath(roadPlanPath, roadDefId);
    if (!result.ok) {
      pushToast(`Straßenbau nicht möglich: ${t(`error.${result.error}`)}`, 'error');
      return;
    }
    pushToast(`${result.built} Straßenabschnitte gebaut.`, 'success');
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
    <section className="smart-road-planner smart-road-overhaul" onClick={(event) => event.stopPropagation()}>
      <header>
        <span className="smart-road-icon"><Route size={22} /></span>
        <div>
          <small>Automatische Geländeanpassung</small>
          <h3>Straße platzieren</h3>
        </div>
        <StatusChip tone={view.valid ? 'good' : view.blockedCount > 0 || view.profileError === 'invalid_anchor' ? 'danger' : 'info'}>
          {view.valid ? 'Straße ist platzierbar' : roadPlanPath.length < 2 ? 'Start und Ziel setzen' : 'Trasse anpassen'}
        </StatusChip>
        <button type="button" className="icon-button" onClick={stopPlacing} title="Straßenplanung schließen">
          <CornerDownLeft size={18} />
        </button>
      </header>

      <div className="smart-road-workspace">
        <aside className="smart-road-guide">
          <strong>Eine Straße – alle Varianten</strong>
          <p>Zeichne die Verbindung. Steigung, Kehren, Stützmauern, Viadukte und Brücken entstehen automatisch.</p>
          <ol>
            <li><b>1</b> Startpunkt anklicken</li>
            <li><b>2</b> Ziehen oder Ziel anklicken</li>
            <li><b>3</b> Vorschau prüfen und bauen</li>
          </ol>
          <div className="smart-road-variant-list">
            {variants.map(([variant, count]) => (
              <span key={variant} className={`variant-${variant}`}><i />{VARIANT_LABEL[variant]} <b>{count}</b></span>
            ))}
          </div>
        </aside>

        <div className="smart-road-profile-card">
          <div className="smart-road-anchors">
            <span className="anchor-start"><MapPin size={15} /><small>Startpunkt</small><b>{view.start ? `${view.start.x}, ${view.start.y}` : 'Karte anklicken'}</b></span>
            <i />
            <span className="anchor-end"><MapPin size={15} /><small>Endpunkt</small><b>{view.end ? `${view.end.x}, ${view.end.y}` : 'Ziel setzen'}</b></span>
          </div>
          <HeightProfile points={view.tiles} />
          <div className="smart-road-profile-legend"><span className="terrain">Gelände</span><span className="road">Fahrbahn ≤ 8 %</span></div>
        </div>

        <aside className="smart-road-analysis">
          <h4>Vorschau – {VARIANT_LABEL[view.dominantVariant]}</h4>
          <div className="smart-road-metrics">
            <DataMetric label="Länge" value={`${int(view.lengthMeters)} m`} />
            <DataMetric label="Höhendifferenz" value={`${view.elevationDeltaMeters >= 0 ? '+' : ''}${int(view.elevationDeltaMeters)} m`} />
            <DataMetric label="Max. Steigung" value={pct(view.maxGradePercent)} tone={view.maxGradePercent <= 8 ? 'good' : 'danger'} />
            <DataMetric label="Ø Steigung" value={pct(view.averageGradePercent)} />
          </div>
          <div className="smart-road-costs">
            <strong>Benötigt</strong>
            {Object.entries(view.costs).length === 0 && <span>Noch keine Baukosten</span>}
            {Object.entries(view.costs).map(([resource, amount]) => (
              <span key={resource}><ResourceIcon id={resource as ResourceId} size={15} />{t(`resource.${resource}`)} <b>{int(amount ?? 0)}</b></span>
            ))}
          </div>
        </aside>
      </div>

      {view.warnings.map((item) => (
        <p className={`inline-warning tone-${item.tone}`} key={item.code}><AlertTriangle size={13} /> {item.label}</p>
      ))}
      {!affordable && missing.length > 0 && roadPlanPath.length > 0 && (
        <p className="inline-warning tone-danger"><AlertTriangle size={13} /> Nicht genug Material: {missing.map((item) => `${t(`resource.${item.res}`)} ${int(item.have)}/${int(item.need)}`).join(', ')}</p>
      )}

      <div className="smart-road-actions">
        <button type="button" className="secondary-action" disabled={roadPlanPath.length === 0} onClick={() => setRoadPlanPath(roadPlanPath.slice(0, -1))}>
          <Undo2 size={15} /> Letzten Punkt lösen
        </button>
        <button type="button" className="secondary-action" onClick={clearRoadPlan} disabled={roadPlanPath.length === 0}>
          <Trash2 size={15} /> Verwerfen
        </button>
        <button type="button" className="primary-action" onClick={confirm} disabled={!view.valid || !affordable}>
          <Check size={17} /> Für {formatMoney(view.cost)} bestätigen
        </button>
      </div>
    </section>
  );
}
