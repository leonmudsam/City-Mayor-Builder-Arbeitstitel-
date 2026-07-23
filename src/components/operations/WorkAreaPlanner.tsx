import {
  Ban,
  CircleDot,
  Clock3,
  Focus,
  Hexagon,
  MousePointer2,
  Route,
  SquareDashed,
  Trees,
  Users,
  Warehouse,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { formatDuration } from '../../i18n/index.ts';
import { getMapApi, useGame, useUiStore } from '../../state/store.ts';
import { CapacityBar, DataMetric, GamePanel, GameSectionHeader, StatusChip } from '../common/GamePanel.tsx';
import { buildWorkAreaPlannerView, defaultWorkAreaSelection } from './adapters.ts';
import type { WorkAreaSelectionMode } from './viewModels.ts';

const MODES: {
  id: WorkAreaSelectionMode;
  label: string;
  icon: JSX.Element;
  available: boolean;
  detail: string;
}[] = [
  { id: 'single', label: 'Einzel', icon: <MousePointer2 size={15} />, available: true, detail: 'Ein Ressourcenknoten pro Klick.' },
  { id: 'circle', label: 'Gebiet', icon: <CircleDot size={15} />, available: true, detail: 'Radius wählen und verfügbare Knoten übernehmen.' },
  {
    id: 'rectangle',
    label: 'Rechteck',
    icon: <SquareDashed size={15} />,
    available: false,
    detail: 'Visuell vorbereitet; Pointer-Flächenauswahl ist noch nicht an den Controller-Entwurf angebunden.',
  },
  {
    id: 'polygon',
    label: 'Polygon',
    icon: <Hexagon size={15} />,
    available: false,
    detail: 'Visuell vorbereitet; Kontrollpunkte sind noch kein vorhandener UI-State.',
  },
  { id: 'exclude', label: 'Ausnehmen', icon: <Ban size={15} />, available: true, detail: 'Klick entfernt einen Knoten aus der Auswahl.' },
];

export function WorkAreaPlanner() {
  const game = useGame();
  const {
    workAreaPlannerBuildingId,
    workAreaSelectionMode,
    workAreaRadius,
    workAreaSelectedNodeIds,
    workAreaHoverNodeId,
    closeWorkAreaPlanner,
    setWorkAreaSelectionMode,
    setWorkAreaRadius,
    setWorkAreaSelectedNodeIds,
    pushToast,
  } = useUiStore();

  const view = useMemo(
    () =>
      workAreaPlannerBuildingId
        ? buildWorkAreaPlannerView(
            game,
            workAreaPlannerBuildingId,
            workAreaSelectionMode,
            workAreaRadius,
            workAreaSelectedNodeIds,
          )
        : undefined,
    [
      game,
      game.version,
      workAreaPlannerBuildingId,
      workAreaRadius,
      workAreaSelectedNodeIds,
      workAreaSelectionMode,
    ],
  );
  const confirm = useCallback(() => {
    if (!view?.canConfirm || !workAreaPlannerBuildingId) return;
    const result = game.startBuildingOperationWithNodes(workAreaPlannerBuildingId, view.selectedNodeIds);
    if (!result.ok) {
      pushToast('Das Arbeitsgebiet enthält keine gültigen Ressourcenknoten.', 'error');
      return;
    }
    pushToast(`Arbeitsgebiet für ${view.buildingName} übernommen.`, 'success');
    closeWorkAreaPlanner();
  }, [closeWorkAreaPlanner, game, pushToast, view, workAreaPlannerBuildingId]);

  useEffect(() => {
    const api = getMapApi();
    if (!view) {
      api?.setWorkAreaOverlay(undefined);
      return;
    }
    api?.setWorkAreaOverlay({
      center: view.center,
      radius: view.radius,
      efficientRadius: view.efficientRange,
      maximumRadius: view.maximumRange,
      nodes: view.nodes.map(({ id, x, y, state }) => ({ id, x, y, state })),
    });
    return () => api?.setWorkAreaOverlay(undefined);
  }, [view]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, select, textarea') || target?.isContentEditable) return;
      if (event.key === 'Enter' && view?.canConfirm) {
        event.preventDefault();
        confirm();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirm, view?.canConfirm]);

  if (!view || !workAreaPlannerBuildingId) return null;
  const hovered = view.nodes.find((node) => node.id === workAreaHoverNodeId);
  const autoSelect = () =>
    setWorkAreaSelectedNodeIds(defaultWorkAreaSelection(game, workAreaPlannerBuildingId, view.radius));
  return (
    <div className="active-operation-layout work-area-layout" onClick={(event) => event.stopPropagation()}>
      <GamePanel
        title={`Arbeitsgebiet · ${view.buildingName}`}
        eyebrow="Aktiver Betrieb"
        icon={<Trees size={23} />}
        className="work-area-panel"
        actions={
          <button className="icon-button" type="button" onClick={closeWorkAreaPlanner} aria-label="Arbeitsgebiet schließen">
            <X size={18} />
          </button>
        }
      >
        <div className="operation-mode-tabs" role="tablist" aria-label="Auswahlmodus">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={workAreaSelectionMode === mode.id}
              className={workAreaSelectionMode === mode.id ? 'active' : ''}
              disabled={!mode.available}
              title={mode.detail}
              onClick={() => setWorkAreaSelectionMode(mode.id)}
            >
              {mode.icon}
              {mode.label}
            </button>
          ))}
        </div>

        <section className="work-area-radius">
          <GameSectionHeader
            title="Einsatzradius"
            detail={`Effizient bis ${view.efficientRange}, maximal ${view.maximumRange} Felder`}
            action={<StatusChip tone={view.radius <= view.efficientRange ? 'good' : 'warning'}>{view.radius} Felder</StatusChip>}
          />
          <input
            type="range"
            min={1}
            max={view.maximumRange}
            value={view.radius}
            onChange={(event) => setWorkAreaRadius(Number(event.target.value))}
            aria-label="Einsatzradius"
          />
          <div className="range-scale">
            <span>1</span>
            <span>Effizient {view.efficientRange}</span>
            <span>Maximum {view.maximumRange}</span>
          </div>
          <button type="button" className="secondary-action full" onClick={autoSelect}>
            <Focus size={15} /> Verfügbare Knoten im Radius auswählen
          </button>
        </section>

        <div className="work-area-summary-grid">
          <DataMetric label="Geeignete Knoten" value={view.validNodeCount} icon={<Trees size={17} />} tone="good" />
          <DataMetric label="Reserviert" value={view.reservedNodeCount} icon={<Ban size={17} />} tone="warning" />
          <DataMetric label="Erwarteter Ertrag" value={`${view.expectedYieldMin} ${view.resourceLabel}`} tone="info" />
          <DataMetric label="Geschätzte Dauer" value={formatDuration(view.estimatedDurationSeconds * 1000)} icon={<Clock3 size={17} />} />
          <DataMetric label="Mittlere Entfernung" value={`${view.averageDistanceTiles} Felder`} icon={<Route size={17} />} />
          <DataMetric label="Arbeiterplätze" value={view.workerSlots} icon={<Users size={17} />} />
        </div>

        <CapacityBar
          label={`Lokales Lager · Prognose ${Math.round(view.storageAfter)}`}
          used={view.localStored}
          reserved={view.localReserved}
          capacity={view.localCapacity}
        />

        {hovered ? (
          <div className={`work-area-node-card node-${hovered.state}`}>
            <span className="node-state-dot" />
            <div>
              <strong>{hovered.label}</strong>
              <span>{hovered.stateLabel} · {hovered.amountMin} {hovered.resourceLabel}</span>
            </div>
            <dl>
              <div><dt>Entfernung</dt><dd>{hovered.distanceTiles}</dd></div>
              <div><dt>Effizienz</dt><dd>{hovered.efficiencyPct}%</dd></div>
            </dl>
          </div>
        ) : (
          <p className="operation-hint"><MousePointer2 size={14} /> Ressourcenknoten auf der Karte überfahren oder anklicken.</p>
        )}

        {view.warnings.map((item) => (
          <p key={`${item.code}:${item.label}`} className={`inline-warning tone-${item.tone}`}>
            {item.label}
          </p>
        ))}

        <button type="button" className="primary-action full" disabled={!view.canConfirm} onClick={confirm}>
          <Trees size={16} /> {view.existingOperation ? 'Arbeitsgebiet aktualisieren' : 'Auftrag starten'}
        </button>
      </GamePanel>

      <aside className="operation-context-card">
        <Warehouse size={20} />
        <div>
          <small>Kartenlegende</small>
          <strong>{view.resourceLabel}-Netz</strong>
        </div>
        <ul className="overlay-legend">
          <li><i className="legend-selected" /> Ausgewählt</li>
          <li><i className="legend-valid" /> Verfügbar</li>
          <li><i className="legend-reserved" /> Reserviert</li>
          <li><i className="legend-invalid" /> Nicht im aktuellen Radius</li>
        </ul>
        <p>Die cyanfarbene Fläche und alle Linien folgen dem gebackenen Gelände. Orange markiert den maximalen Bereich.</p>
      </aside>
    </div>
  );
}
