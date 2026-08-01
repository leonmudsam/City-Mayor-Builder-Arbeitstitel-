import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  CircleDollarSign,
  Filter,
  HelpCircle,
  PackageCheck,
  Play,
  Route,
  SlidersHorizontal,
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
import { formatMoney, t } from '../../i18n/index.ts';
import { playFeedback } from '../../services/feedback.ts';
import { useGame, useUiStore } from '../../state/store.ts';
import '../../styles/citywork-smart.css';
import { CitizenPortrait } from '../art/index.ts';
import { ManualRouteMap, type CityworkMapPoint } from '../citywork/ManualRouteMap.tsx';
import { RouteSummary } from '../citywork/RouteSummary.tsx';
import {
  createSmartRouteSuggestion,
  type SmartRouteSuggestion,
} from '../citywork/smartRoutePlan.ts';
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

const WARNING_LABELS: Record<InfrastructureWarning['code'], string> = {
  oversized_target: 'Eine Lieferung braucht mehrere Fahrten.',
  many_reloads: 'Mehrere automatische Nachladefahrten sind nötig.',
  high_empty_travel: 'Die Route enthält viel Leerfahrt.',
  low_vehicle_suitability: 'Das Fahrzeug passt nur bedingt zu diesem Auftrag.',
  oversized_vehicle: 'Ein kleineres Fahrzeug wäre wirtschaftlicher.',
  perishable_no_cooling: 'Für diese Ladung ist Kühlung empfehlenswert.',
  incomplete_road: 'Ein Straßenabschnitt ist noch nicht verbunden.',
  narrow_streets: 'Das Fahrzeug verliert Zeit im engen Straßennetz.',
};

export function ActivityRoutePlanner({ defId }: { defId: string }) {
  const game = useGame();
  const closePlanner = useUiStore((state) => state.closeActivityPlanner);
  const openPlanner = useUiStore((state) => state.openActivityPlanner);
  const pushToast = useUiStore((state) => state.pushToast);
  const setMissionFollow = useUiStore((state) => state.setMissionFollow);
  const active = game.state.activities.active?.defId === defId ? game.state.activities.active : undefined;

  // Der Controller friert den Auftrag einmalig ein. Die UI erzeugt keinen
  // eigenen Missionszustand und würfelt beim erneuten Öffnen nichts neu aus.
  useEffect(() => {
    game.selectActivity(defId);
  }, [game, defId]);

  const selectionStatus = game.getActivitySelectionStatus(defId);
  const context = useMemo(
    () => game.getActivityPlanningContext(defId),
    [game, game.version, defId],
  );
  const def = context?.def;
  const targetIds = context?.targetBuildingIds ?? [];
  const targetKey = targetIds.join('|');
  const vehicleKey = context?.vehicles.map((vehicle) => vehicle.id).join('|') ?? '';
  const anchors = useMemo(
    () => game.getActivityRouteAnchors(defId, targetIds),
    [game, game.version, defId, targetKey],
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
  const [showJobs, setShowJobs] = useState(false);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const initializedPlanKey = useRef('');

  const source = useMemo(
    () => sourcePoint(game, def, context?.sourceBuildingIds[0]),
    [game, game.version, def, context?.sourceBuildingIds],
  );
  const targets = useMemo(
    () => targetIds.map((id) => buildingPoint(game, id)).filter((point): point is RoutePoint => point !== undefined),
    [game, game.version, targetKey],
  );
  const smartSuggestion = useMemo(
    () => context
      ? createSmartRouteSuggestion(game, defId, targetIds, context.vehicles)
      : undefined,
    [game, game.version, defId, targetKey, vehicleKey],
  );

  // Standardfall: Fahrzeug, Zielreihenfolge und echte Straßenkette werden einmal
  // automatisch vorgeschlagen. Laufende Missionen behalten ihren gespeicherten
  // Plan; Simulations-Ticks überschreiben keine UI-Eingabe.
  useEffect(() => {
    if (!anchors || !context) return;
    const planKey = `${defId}:${targetKey}:${active ? 'active' : 'draft'}`;
    if (initializedPlanKey.current === planKey) return;
    initializedPlanKey.current = planKey;
    if (active?.plannedRoadPath?.length) {
      setSelectedVehicle(active.vehicle ?? defaultVehicle);
      setRoadPath(active.plannedRoadPath.map((point) => ({ ...point })));
    } else if (smartSuggestion) {
      setSelectedVehicle(smartSuggestion.vehicle);
      setRoadPath(smartSuggestion.roadPath.map((point) => ({ ...point })));
    } else {
      setSelectedVehicle(defaultVehicle);
      setRoadPath([{ ...anchors.source }]);
    }
    setManualMode(false);
    setShowAdjustments(false);
    setShowJobs(false);
    setFitNonce((value) => value + 1);
  }, [
    active,
    anchors,
    context,
    defaultVehicle,
    defId,
    smartSuggestion,
    targetKey,
  ]);

  useEffect(() => {
    if (roadPath.length === 0 && anchors) setRoadPath([{ ...anchors.source }]);
  }, [anchors, roadPath.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        if (showJobs) setShowJobs(false);
        else if (showAdjustments) setShowAdjustments(false);
        else closePlanner();
      }
      if (event.key === 'r' || event.key === 'R') {
        if (smartSuggestion) {
          setSelectedVehicle(smartSuggestion.vehicle);
          setRoadPath(smartSuggestion.roadPath.map((point) => ({ ...point })));
          setManualMode(false);
          pushToast('Bester Routenvorschlag wiederhergestellt.', 'info');
        }
      }
      if (event.key === 'f' || event.key === 'F') setFitNonce((value) => value + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closePlanner, pushToast, showAdjustments, showJobs, smartSuggestion]);

  const selectedVehicleDef = context?.vehicles.find((vehicle) => vehicle.id === selectedVehicle);
  const preview = useMemo(
    () => game.getActivityRoutePreview(defId, targetIds, roadPath, selectedVehicle),
    [game, game.version, defId, targetKey, roadPath, selectedVehicle],
  );
  const referenceAnalysis = useMemo(
    () => game.analyseActivityRoute(defId, smartSuggestion?.orderedTargetIds ?? targetIds),
    [game, game.version, defId, targetKey, smartSuggestion?.orderedTargetIds],
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
  const blockingWarning = warnings.find((warning) => warning.severity === 'critical');
  const visibleWarning = blockingWarning ?? warnings.find((warning) => warning.severity === 'warn') ?? warnings[0];
  const routeComplete = preview?.complete === true && !blockingWarning;
  const board = game.getActivityBoard().filter((entry) => entry.def.drive);
  const filteredBoard = board.filter((entry) => boardFilter === 'all' || entry.def.category === boardFilter);
  const filters = useMemo(
    () => ['all', ...new Set(board.map((entry) => entry.def.category).filter(Boolean))] as BoardFilter[],
    [board],
  );
  const futureVehicles = game.config.activities.vehicles.filter((vehicle) => vehicle.future);

  const applySmartSuggestion = (suggestion: SmartRouteSuggestion | undefined) => {
    if (!suggestion) {
      setManualMode(true);
      setShowAdjustments(true);
      pushToast('Das Straßennetz ist nicht vollständig verbunden. Korrigiere den fehlenden Abschnitt.', 'error');
      return;
    }
    setSelectedVehicle(suggestion.vehicle);
    setRoadPath(suggestion.roadPath.map((point) => ({ ...point })));
    setManualMode(false);
    setFitNonce((value) => value + 1);
    pushToast(
      suggestion.ready ? 'Fahrzeug und Route wurden automatisch optimiert.' : 'Vorschlag erstellt – ein Abschnitt braucht deine Hilfe.',
      suggestion.ready ? 'success' : 'info',
    );
  };

  const selectVehicle = (vehicle: DriveVehicle) => {
    if (!context) return;
    const suggestion = createSmartRouteSuggestion(game, defId, targetIds, [{ id: vehicle }]);
    if (suggestion) {
      setSelectedVehicle(vehicle);
      setRoadPath(suggestion.roadPath.map((point) => ({ ...point })));
      setManualMode(false);
      setFitNonce((value) => value + 1);
    } else {
      setSelectedVehicle(vehicle);
      setManualMode(true);
    }
  };

  if (selectionStatus === 'stale' && !active) {
    return (
      <section className="citywork-planner citywork-smart citywork-empty">
        <AlertTriangle size={42} />
        <h2>Ein Lieferziel wurde abgerissen</h2>
        <p>Aktualisiere den Auftrag. Es wird bewusst kein Ziel im Hintergrund ausgetauscht.</p>
        <div className="citywork-empty-actions">
          <button
            className="btn-primary"
            onClick={() => {
              game.refreshActivitySelection(defId);
              initializedPlanKey.current = '';
              setRoadPath([]);
            }}
          >
            Auftrag aktualisieren
          </button>
          <button className="btn-secondary" onClick={() => { game.clearActivitySelection(); closePlanner(); }}>
            Abbrechen
          </button>
        </div>
      </section>
    );
  }

  if (!def || !context || !source || !anchors || targets.length < 2 || context.vehicles.length === 0) {
    return (
      <section className="citywork-planner citywork-smart citywork-empty">
        <Route size={42} />
        <h2>{t('ui.route.unavailable')}</h2>
        <p>Baue eine passende Quelle, mindestens zwei Ziele und ein verbundenes Straßennetz.</p>
        <button className="btn-primary" onClick={closePlanner}>{t('ui.close')}</button>
      </section>
    );
  }

  const startRoute = () => {
    if (!routeComplete || !preview) {
      pushToast('Die automatische Route braucht noch einen verbundenen Straßenabschnitt.', 'error');
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
    pushToast('Mission gestartet – dein Fahrzeug übernimmt ab hier.', 'success');
    requestAnimationFrame(() => setMissionFollow(true));
  };

  const selectedImage = selectedVehicleDef ? vehicleImage(selectedVehicleDef.imageKey) : undefined;
  const planExplanation =
    !smartSuggestion
      ? 'Zwischen Quelle und Ziel fehlt ein durchgehender Straßenweg.'
      : selectedVehicle === smartSuggestion.vehicle
      ? smartSuggestion.explanation
      : 'Die Route wurde automatisch an deine Fahrzeugwahl angepasst.';

  return (
    <section className="citywork-planner citywork-smart">
      <header className="citywork-smart-header">
        <div className="citywork-smart-brand">
          <span><Route size={24} /></span>
          <div>
            <small>Stadtarbeit</small>
            <strong>{t(def.nameKey)}</strong>
          </div>
        </div>

        <div className="citywork-smart-progress" aria-label="Planungsfortschritt">
          <span className="done"><Check size={13} /> Auftrag gewählt</span>
          <span className={roadPath.length > 1 ? 'done' : 'active'}>
            {roadPath.length > 1 ? <Check size={13} /> : <Sparkles size={13} />} Vorschlag
          </span>
          <span className={routeComplete ? 'active' : ''}>3&nbsp; Bestätigen</span>
        </div>

        <div className="citywork-smart-header-actions">
          <button
            onClick={() => pushToast('Der Vorschlag ist startklar. Nur unter „Plan anpassen“ kannst du Fahrzeug oder Weg ändern.', 'info')}
            title="Hilfe"
          >
            <HelpCircle size={18} />
          </button>
          <button onClick={closePlanner} title={t('ui.close')}><X size={21} /></button>
        </div>
      </header>

      <div className="citywork-smart-workspace">
        <main className="citywork-smart-map-panel">
          <div className="citywork-smart-map-head">
            <div>
              <span className={`citywork-smart-state${routeComplete ? ' ready' : ''}`}>
                <Sparkles size={13} />
                {routeComplete ? 'Automatisch geplant' : 'Feinplanung nötig'}
              </span>
              <h2>{source.label} → {targetIds.length} Ziele</h2>
              <p>
                {routeComplete
                  ? 'Fahrzeug, Reihenfolge und Nachladen sind vorbereitet. Du kannst direkt starten.'
                  : 'Der beste vorhandene Weg ist sichtbar. Öffne „Plan anpassen“, um den offenen Punkt zu korrigieren.'}
              </p>
            </div>
            <div className="citywork-smart-map-actions">
              <button onClick={() => setShowJobs((value) => !value)}>
                <PackageCheck size={15} /> Auftrag wechseln
              </button>
              <button className="primary" onClick={() => applySmartSuggestion(smartSuggestion)}>
                <Sparkles size={15} /> Neu optimieren
              </button>
            </div>
          </div>

          <div className="citywork-smart-map-stage">
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
              editEnabled={manualMode}
              onPathChange={setRoadPath}
              onInvalid={() => pushToast('Nutze einen direkt angrenzenden Straßenabschnitt.', 'info')}
            />
            <RouteSummary preview={preview} roadPath={roadPath} targetsTotal={targetIds.length} />
            {manualMode && (
              <div className="citywork-smart-editing">
                <SlidersHorizontal size={15} />
                Manuelle Feinplanung aktiv
              </div>
            )}
          </div>
        </main>

        <aside className="citywork-smart-decision">
          <section className={`citywork-smart-ready-card${routeComplete ? ' ready' : ''}`}>
            <span className="citywork-smart-kicker">{routeComplete ? 'Bereit zur Abfahrt' : 'Deine Hilfe nötig'}</span>
            <div className="citywork-smart-vehicle-hero">
              <span>{selectedImage ? <img src={selectedImage} alt="" /> : <Truck size={48} />}</span>
              <div>
                <small>{selectedVehicle === smartSuggestion?.vehicle ? 'Automatisch gewählt' : 'Deine Auswahl'}</small>
                <strong>{selectedVehicleDef ? t(selectedVehicleDef.nameKey) : 'Lieferfahrzeug'}</strong>
                <p>{planExplanation}</p>
              </div>
            </div>

            {visibleWarning && (
              <div className={`citywork-smart-warning ${visibleWarning.severity}`}>
                <AlertTriangle size={16} />
                <span>{WARNING_LABELS[visibleWarning.code]}</span>
              </div>
            )}

            {!visibleWarning && routeComplete && (
              <div className="citywork-smart-ok">
                <Check size={16} />
                Alle Ziele und nötigen Nachladehalte sind verbunden.
              </div>
            )}

            <div className="citywork-smart-reward">
              <span><CircleDollarSign size={15} /> {formatMoney(context.reward.money)}</span>
              <span>{context.reward.xp} XP</span>
            </div>

            <button className="citywork-smart-start" disabled={!routeComplete} onClick={startRoute}>
              <Play size={17} /> Route starten
            </button>
          </section>

          <button
            className="citywork-smart-adjust-toggle"
            aria-expanded={showAdjustments}
            onClick={() => setShowAdjustments((value) => !value)}
          >
            <SlidersHorizontal size={16} />
            Plan anpassen
            <ChevronDown size={16} />
          </button>

          {showAdjustments && (
            <div className="citywork-smart-adjustments">
              <VehicleSelector
                compact
                {...(smartSuggestion ? { recommended: smartSuggestion.vehicle } : {})}
                vehicles={context.vehicles}
                futureVehicles={futureVehicles}
                level={game.state.level.current}
                selected={selectedVehicle}
                {...(preview?.cargoPlan ? { cargoPlan: preview.cargoPlan } : {})}
                {...(preview?.cargoRoute ? { cargoRoute: preview.cargoRoute } : {})}
                cargoAssetKey={cargoAsset(def)}
                onSelect={selectVehicle}
              />

              <div className="citywork-smart-route-tools">
                <button onClick={() => applySmartSuggestion(smartSuggestion)}>
                  <Sparkles size={15} /> Automatik wiederherstellen
                </button>
                <button
                  className={manualMode ? 'active' : ''}
                  onClick={() => {
                    setManualMode((value) => !value);
                    setFitNonce((value) => value + 1);
                  }}
                >
                  <Route size={15} /> {manualMode ? 'Zeichnen beenden' : 'Weg selbst korrigieren'}
                </button>
              </div>

              <TourOverview
                compact
                source={source}
                targets={targets}
                orderedTargetIds={preview?.orderedTargetIds ?? []}
                {...(preview?.cargoRoute ? { cargoStops: preview.cargoRoute.stops } : {})}
                {...(preview?.progress ? { progress: preview.progress } : {})}
                {...(selectedVehicleDef ? { vehicle: selectedVehicleDef } : {})}
              />
            </div>
          )}
        </aside>
      </div>

      {showJobs && (
        <aside className="citywork-smart-jobs">
          <div className="citywork-smart-jobs-head">
            <div><small>Auftrag wählen</small><strong>{board.filter((entry) => entry.available).length} verfügbar</strong></div>
            <button onClick={() => setShowJobs(false)}><X size={18} /></button>
          </div>
          <div className="citywork-smart-filters">
            <Filter size={14} />
            {filters.map((filter) => (
              <button key={filter} className={boardFilter === filter ? 'active' : ''} onClick={() => setBoardFilter(filter)}>
                {FILTER_LABELS[filter] ?? filter}
              </button>
            ))}
          </div>
          <div className="citywork-smart-job-list">
            {filteredBoard.map((entry) => (
              <MissionCard
                key={entry.def.id}
                entry={entry}
                selected={entry.def.id === defId}
                current={entry.def.id === defId}
                onSelect={() => {
                  setShowJobs(false);
                  openPlanner(entry.def.id);
                }}
              />
            ))}
          </div>
        </aside>
      )}
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
  const locked = !entry.available && !current;
  return (
    <button
      className={`citywork-smart-job${selected ? ' selected' : ''}${locked ? ' locked' : ''}`}
      disabled={locked}
      onClick={onSelect}
    >
      <span className="citywork-smart-job-art">{image ? <img src={image} alt="" /> : <PackageCheck size={30} />}</span>
      <span className="citywork-smart-job-copy">
        <small>{categoryLabel(entry.def.category)}</small>
        <strong>{t(entry.def.nameKey)}</strong>
        <span>{t(entry.def.descriptionKey)}</span>
      </span>
      <span className="citywork-smart-job-reward">
        <b>{formatMoney(entry.reward.money)}</b>
        <small>{entry.reward.xp} XP</small>
      </span>
      <CitizenPortrait role={entry.def.sender} seed={entry.def.id} size={34} />
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
