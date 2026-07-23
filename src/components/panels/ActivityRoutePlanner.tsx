import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CircleDollarSign,
  Filter,
  HelpCircle,
  PackageCheck,
  Play,
  RotateCcw,
  Route,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import { uiImage, vehicleImage } from '../../assets/registry.ts';
import type { InfrastructureWarning } from '../../game/activities/logistics.ts';
import type { ActivityBoardEntry, GameController } from '../../game/commands/controller.ts';
import type { ActivityCategory, ActivityDef, DriveVehicle } from '../../game/config/types.ts';
import { regionIdAt } from '../../game/config/startRegion.config.ts';
import type { BuildingInstance } from '../../game/types.ts';
import { formatDuration, formatMoney, t } from '../../i18n/index.ts';
import { playFeedback } from '../../services/feedback.ts';
import { useGame, useUiStore } from '../../state/store.ts';
import { CitizenPortrait } from '../art/index.ts';
import { InfrastructureAdvisor } from '../citywork/InfrastructureAdvisor.tsx';
import { ManualRouteMap, type CityworkMapPoint } from '../citywork/ManualRouteMap.tsx';
import { RouteSummary } from '../citywork/RouteSummary.tsx';
import { TourOverview, type TourDisplayPoint } from '../citywork/TourOverview.tsx';
import { VehicleSelector } from '../citywork/VehicleSelector.tsx';

interface RoutePoint extends CityworkMapPoint, TourDisplayPoint {
  building: BuildingInstance;
}

type BoardFilter = 'all' | ActivityCategory;

const FILTER_LABELS: Partial<Record<BoardFilter, string>> = {
  all: 'Alle',
  supply: 'Versorgung',
  logistics: 'Logistik',
  safety: 'Notfall',
  trade: 'Handel',
  environment: 'Umwelt',
  inspection: 'Verwaltung',
};

export function ActivityRoutePlanner({ defId }: { defId: string }) {
  const game = useGame();
  const closePlanner = useUiStore((state) => state.closeActivityPlanner);
  const openPlanner = useUiStore((state) => state.openActivityPlanner);
  const pushToast = useUiStore((state) => state.pushToast);
  const setMissionFollow = useUiStore((state) => state.setMissionFollow);
  const active = game.state.activities.active?.defId === defId ? game.state.activities.active : undefined;
  const context = useMemo(
    () => game.getActivityPlanningContext(defId),
    [game, game.version, defId],
  );
  const def = context?.def;
  const targetIds = context?.targetBuildingIds ?? [];
  const anchors = useMemo(
    () => game.getActivityRouteAnchors(defId, targetIds),
    [game, game.version, defId, targetIds],
  );
  const defaultVehicle = context?.vehicles[0]?.id ?? def?.vehicle ?? 'van';
  const [selectedVehicle, setSelectedVehicle] = useState<DriveVehicle>(
    active?.vehicle ?? defaultVehicle,
  );
  const [roadPath, setRoadPath] = useState<{ x: number; y: number }[]>(() =>
    active?.plannedRoadPath?.map((point) => ({ ...point })) ?? (anchors ? [{ ...anchors.source }] : []),
  );
  const [fitNonce, setFitNonce] = useState(0);
  const [boardFilter, setBoardFilter] = useState<BoardFilter>('all');

  const source = useMemo(
    () => sourcePoint(game, def, context?.sourceBuildingIds[0]),
    [game, game.version, def, context?.sourceBuildingIds],
  );
  const targets = useMemo(
    () => targetIds.map((id) => buildingPoint(game, id)).filter((point): point is RoutePoint => point !== undefined),
    [game, game.version, targetIds],
  );
  const selectedVehicleDef = context?.vehicles.find((vehicle) => vehicle.id === selectedVehicle);
  const preview = useMemo(
    () => game.getActivityRoutePreview(defId, targetIds, roadPath, selectedVehicle),
    [game, game.version, defId, targetIds, roadPath, selectedVehicle],
  );
  const referenceAnalysis = useMemo(
    () => game.analyseActivityRoute(defId, targetIds),
    [game, game.version, defId, targetIds],
  );
  const warnings = useMemo<InfrastructureWarning[]>(
    () => preview?.analysis
      ? game.getActivityInfrastructureWarnings(defId, preview.orderedTargetIds, selectedVehicle, {
          vehicle: selectedVehicle,
          roadPath,
        })
      : [],
    [game, game.version, defId, preview?.analysis, preview?.orderedTargetIds, selectedVehicle, roadPath],
  );
  const routeComplete = preview?.complete === true && !warnings.some((warning) => warning.severity === 'critical');
  const board = game.getActivityBoard().filter((entry) => entry.def.drive);
  const filteredBoard = board.filter((entry) => boardFilter === 'all' || entry.def.category === boardFilter);
  const filters = useMemo(
    () => ['all', ...new Set(board.map((entry) => entry.def.category).filter(Boolean))] as BoardFilter[],
    [board],
  );
  const futureVehicles = game.config.activities.vehicles.filter((vehicle) => vehicle.future);

  useEffect(() => {
    const vehicle = active?.vehicle ?? defaultVehicle;
    setSelectedVehicle(vehicle);
    setRoadPath(active?.plannedRoadPath?.map((point) => ({ ...point })) ?? (anchors ? [{ ...anchors.source }] : []));
    setFitNonce((value) => value + 1);
  }, [defId]); // Missionwechsel startet immer mit einem frischen, auftragsbezogenen Plan.

  useEffect(() => {
    if (roadPath.length === 0 && anchors) setRoadPath([{ ...anchors.source }]);
  }, [anchors, roadPath.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        if (roadPath.length > 1) setRoadPath((path) => path.slice(0, -1));
        else closePlanner();
      }
      if (event.key === 'r' || event.key === 'R') {
        setRoadPath(anchors ? [{ ...anchors.source }] : []);
        pushToast('Route zurückgesetzt.', 'info');
      }
      if (event.key === 'f' || event.key === 'F') setFitNonce((value) => value + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [anchors, closePlanner, pushToast, roadPath.length]);

  if (!def || !context || !source || !anchors || targets.length < 2 || context.vehicles.length === 0) {
    return (
      <section className="citywork-planner citywork-empty">
        <Route size={42} />
        <h2>{t('ui.route.unavailable')}</h2>
        <p>Baue zuerst eine passende Quelle, mindestens zwei Ziele und ein verbundenes Straßennetz.</p>
        <button className="btn-primary" onClick={closePlanner}>{t('ui.close')}</button>
      </section>
    );
  }

  const resetPath = () => setRoadPath([{ ...anchors.source }]);
  const startRoute = () => {
    if (!routeComplete || !preview) {
      pushToast('Verbinde Quelle, alle Pflichtziele und notwendige Nachfüllstopps.', 'error');
      return;
    }
    const plan = { vehicle: selectedVehicle, roadPath };
    const result = active
      ? game.setActiveActivityRoute(preview.orderedTargetIds, plan)
      : game.startActivity(def.id, preview.orderedTargetIds, plan);
    if (!result.ok) {
      pushToast(t(`error.${result.error}`), 'error');
      return;
    }
    closePlanner();
    playFeedback('activity_start');
    pushToast('Mission gestartet – das Fahrzeug folgt deiner Route.', 'success');
    requestAnimationFrame(() => setMissionFollow(true));
  };

  return (
    <section className="citywork-planner citywork-v4">
      <header className="citywork-v4-header">
        <div className="citywork-v4-brand">
          <span><Route size={27} /></span>
          <div><strong>Stadtarbeit</strong><small>Plane deine Route. Liefere clever.</small></div>
        </div>
        <div className="citywork-v4-steps" aria-label="Planungsfortschritt">
          {[
            ['1', 'Auftrag', true],
            ['2', 'Fahrzeug', true],
            ['3', 'Route planen', false],
            ['4', 'Bestätigen', false],
          ].map(([number, label, done], index) => (
            <div key={String(number)} className={index === 2 ? 'active' : done ? 'done' : routeComplete ? 'ready' : ''}>
              <span>{done ? <Check size={13} /> : number}</span>
              <strong>{label}</strong>
            </div>
          ))}
        </div>
        <div className="citywork-v4-header-actions">
          <button onClick={() => pushToast('Mausrad zoomt · freie Fläche zieht die Karte · F passt alles ein · R setzt zurück.', 'info')} title="Hilfe"><HelpCircle size={19} /></button>
          <button onClick={closePlanner} title={t('ui.close')}><X size={22} /></button>
        </div>
      </header>

      <div className="citywork-v4-layout">
        <aside className="citywork-v4-jobs">
          <div className="citywork-v4-section-head">
            <div><small>Schritt 1</small><strong>Aufträge</strong></div>
            <span>{board.filter((entry) => entry.available).length} bereit</span>
          </div>
          <div className="citywork-v4-filters">
            <Filter size={14} />
            {filters.map((filter) => (
              <button key={filter} className={boardFilter === filter ? 'active' : ''} onClick={() => setBoardFilter(filter)}>
                {FILTER_LABELS[filter] ?? filter}
              </button>
            ))}
          </div>
          <div className="citywork-v4-job-list">
            {filteredBoard.map((entry) => (
              <MissionCard
                key={entry.def.id}
                entry={entry}
                selected={entry.def.id === defId}
                current={entry.def.id === defId}
                onSelect={() => openPlanner(entry.def.id)}
              />
            ))}
          </div>
          <div className="citywork-v4-brief">
            <Sparkles size={16} />
            <div><strong>Warum ist diese Tour anspruchsvoll?</strong><span>{complexityTags(def, preview?.cargoRoute?.requiredResupplies ?? 0).join(' · ')}</span></div>
          </div>
        </aside>

        <main className="citywork-v4-center">
          <div className="citywork-v4-map-head">
            <div>
              <small>Schritt 3 · Routenplanung</small>
              <h2>{t(def.nameKey)}</h2>
              <p>Zeichne direkt auf den Straßen. Die Reihenfolge entsteht aus deinem Weg.</p>
            </div>
            <div className="citywork-v4-map-actions">
              <span>2D</span>
              <button onClick={resetPath}><RotateCcw size={15} /> Route löschen</button>
            </div>
          </div>
          <div className="citywork-v4-map-stage">
            <ManualRouteMap
              game={game}
              source={source}
              targets={targets}
              anchors={anchors}
              roadPath={roadPath}
              analysis={preview?.analysis}
              referenceSegments={referenceAnalysis?.segments}
              visitOrder={preview?.orderedTargetIds ?? []}
              {...(preview?.cargoRoute ? { cargoStops: preview.cargoRoute.stops } : {})}
              fitNonce={fitNonce}
              onPathChange={setRoadPath}
              onInvalid={() => pushToast('Wähle einen angrenzenden Straßenabschnitt.', 'info')}
            />
            <InfrastructureAdvisor
              warnings={warnings}
              routeComplete={routeComplete}
              // TODO(CLAUDE_LOGIC): InfrastructureWarning braucht roadPoint/segmentId,
              // damit ein einzelner Hinweis statt der gesamten Tour fokussiert werden kann.
              onShowRoute={() => setFitNonce((value) => value + 1)}
            />
            <RouteSummary preview={preview} roadPath={roadPath} />
          </div>
        </main>

        <aside className="citywork-v4-right">
          <VehicleSelector
            vehicles={context.vehicles}
            futureVehicles={futureVehicles}
            level={game.state.level.current}
            selected={selectedVehicle}
            {...(preview?.cargoPlan ? { cargoPlan: preview.cargoPlan } : {})}
            {...(preview?.cargoRoute ? { cargoRoute: preview.cargoRoute } : {})}
            cargoAssetKey={cargoAsset(def)}
            onSelect={setSelectedVehicle}
          />
          <TourOverview
            source={source}
            targets={targets}
            orderedTargetIds={preview?.orderedTargetIds ?? []}
            {...(preview?.cargoRoute ? { cargoStops: preview.cargoRoute.stops } : {})}
            {...(preview?.progress ? { progress: preview.progress } : {})}
            {...(selectedVehicleDef ? { vehicle: selectedVehicleDef } : {})}
          />
          <section className={`citywork-v4-confirm${routeComplete ? ' ready' : ''}`}>
            <div className="citywork-v4-section-head">
              <div><small>Schritt 4</small><strong>Mission bestätigen</strong></div>
              <span>{routeComplete ? 'Bereit' : 'Route offen'}</span>
            </div>
            <div className="citywork-v4-confirm-main">
              <span className="citywork-v4-confirm-vehicle">
                {selectedVehicleDef && vehicleImage(selectedVehicleDef.imageKey)
                  ? <img src={vehicleImage(selectedVehicleDef.imageKey)} alt="" />
                  : <Truck size={38} />}
              </span>
              <dl>
                <div><dt>Ladung</dt><dd>{preview?.cargoPlan?.totalRequired.toLocaleString('de-DE') ?? '–'}</dd></div>
                <div><dt>Stopps</dt><dd>{preview?.orderedTargetIds.length ?? 0}/{targetIds.length}</dd></div>
                <div><dt>Nachfüllen</dt><dd>{preview?.cargoRoute?.plannedResupplies ?? 0}</dd></div>
                <div><dt>Leerfahrt</dt><dd>{Math.round((preview?.cargoRoute?.emptyTravelRatio ?? 0) * 100)} %</dd></div>
                <div><dt>Zeit</dt><dd>{preview?.infrastructure ? formatDuration(preview.infrastructure.estimatedDurationMs) : '–'}</dd></div>
                <div><dt>Risiko</dt><dd>{preview?.analysis ? t(`ui.route.risk.${preview.analysis.congestionRisk}`) : '–'}</dd></div>
              </dl>
            </div>
            <div className="citywork-v4-confirm-reward">
              <span><CircleDollarSign size={16} /> {formatMoney(context.reward.money)}</span>
              <span>{context.reward.xp} XP</span>
              <strong>{preview?.analysis ? t(`ui.route.medal.${preview.analysis.expectedMedal}`) : 'Prognose offen'}</strong>
            </div>
            {!routeComplete && (
              <p><AlertTriangle size={14} /> Quelle, alle Ziele und nötige Nachfüllstopps müssen lückenlos verbunden sein.</p>
            )}
            <button className="citywork-v4-start" disabled={!routeComplete} onClick={startRoute}>
              <Truck size={20} /> Mission starten <Play size={16} />
            </button>
          </section>
        </aside>
      </div>
    </section>
  );
}

function MissionCard({
  entry,
  selected,
  current,
  onSelect,
}: {
  entry: ActivityBoardEntry;
  selected: boolean;
  current: boolean;
  onSelect(): void;
}) {
  const image = uiImage(missionImage(entry.def));
  const tags = complexityTags(entry.def, entry.def.cargoModel ? 1 : 0).slice(0, 2);
  return (
    <button
      className={`citywork-v4-job${selected ? ' selected' : ''}${entry.available || current ? '' : ' locked'}`}
      disabled={!entry.available && !current}
      onClick={onSelect}
    >
      <span className="citywork-v4-job-art">{image ? <img src={image} alt="" /> : <PackageCheck size={38} />}</span>
      <span className="citywork-v4-job-copy">
        <i>{categoryLabel(entry.def.category)} · {entry.def.difficulty ? t(`activity.difficulty.${entry.def.difficulty}`) : 'Planbar'}</i>
        <strong>{t(entry.def.nameKey)}</strong>
        <small>{t(entry.def.descriptionKey)}</small>
        <em>{tags.map((tag) => <b key={tag}>{tag}</b>)}</em>
        <span><CircleDollarSign size={12} /> {formatMoney(entry.reward.money)} <b>{entry.reward.xp} XP</b></span>
      </span>
      <span className="citywork-v4-job-person"><CitizenPortrait role={entry.def.sender} seed={entry.def.id} size={42} /></span>
    </button>
  );
}

function buildingPoint(game: GameController, id?: string): RoutePoint | undefined {
  if (!id) return undefined;
  const building = game.state.buildings[id];
  const definition = building && game.config.buildings.get(building.defId);
  if (!building || !definition) return undefined;
  const region = game.config.regions.get(regionIdAt(building.x, building.y));
  return {
    id,
    x: building.x + definition.size.w / 2,
    y: building.y + definition.size.h / 2,
    label: t(definition.nameKey),
    subtitle: region ? t(region.nameKey) : 'Stadtgebiet',
    buildingDefId: building.defId,
    category: definition.category,
    upgradeLevel: building.upgradeLevel,
    building,
  };
}

function sourcePoint(game: GameController, def: ActivityDef | undefined, sourceBuildingId?: string): RoutePoint | undefined {
  const explicit = buildingPoint(game, sourceBuildingId);
  if (explicit) return explicit;
  if (def?.requiresAnyBuilding) {
    const building = Object.values(game.state.buildings)
      .filter((candidate) => candidate.status === 'active' && def.requiresAnyBuilding!.includes(candidate.defId))
      .sort((a, b) => a.id.localeCompare(b.id))[0];
    const point = buildingPoint(game, building?.id);
    if (point) return point;
  }
  return buildingPoint(game, Object.values(game.state.buildings).find((building) => building.defId === 'town_hall')?.id);
}

function missionImage(def: ActivityDef) {
  if (def.id.includes('food') || def.id.includes('water')) return 'mission_food_route';
  if (def.category === 'safety') return 'mission_emergency_route';
  if (def.category === 'trade' || def.id.includes('log')) return 'mission_trade_route';
  if (def.category === 'environment') return 'mission_return_cargo';
  return 'mission_construction_route';
}

function cargoAsset(def: ActivityDef) {
  const resource = def.cargoModel?.resource;
  if (!resource) return 'cargo_materials';
  return `cargo_${resource === 'freshwater' ? 'water' : resource}`;
}

function categoryLabel(category: ActivityCategory | undefined) {
  return category ? FILTER_LABELS[category] ?? 'Spezialtransport' : 'Stadtarbeit';
}

function complexityTags(def: ActivityDef, resupplies: number) {
  const tags = [`${def.targetCount?.max ?? 0} Lieferziele`];
  if (resupplies > 0) tags.push(`${resupplies} Nachfüllung${resupplies === 1 ? '' : 'en'}`);
  if (def.cargoModel?.perishable) tags.push('Verderbliche Ware');
  if (def.difficulty === 'hard') tags.push('Hohes Verkehrsrisiko');
  if (def.vehicle === 'heavy_transporter' || def.vehicle === 'large_truck') tags.push('Schweres Fahrzeug');
  if (def.timeLimitSec && def.timeLimitSec <= 75) tags.push('Enges Zeitfenster');
  return tags;
}
