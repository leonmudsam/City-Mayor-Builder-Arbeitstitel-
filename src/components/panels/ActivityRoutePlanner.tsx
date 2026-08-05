import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  CircleDollarSign,
  Bot,
  Filter,
  Gamepad2,
  HelpCircle,
  PackageCheck,
  Play,
  Route,
  SlidersHorizontal,
  Truck,
  X,
} from 'lucide-react';
import { uiImage, vehicleImage } from '../../assets/registry.ts';
import type { InfrastructureWarning } from '../../game/activities/logistics.ts';
import type { ActivityBoardEntry, GameController } from '../../game/commands/controller.ts';
import type { ActivityCategory, ActivityDef, DriveVehicle } from '../../game/config/types.ts';
import { modeRewardFactor, type TransportMode } from '../../game/activities/transportOrder.ts';
import { regionIdAt } from '../../game/config/startRegion.config.ts';
import { TILE_METERS } from '../../renderer/worldProjection.ts';
import type { BuildingInstance } from '../../game/types.ts';
import { formatMoney, t } from '../../i18n/index.ts';
import { playFeedback } from '../../services/feedback.ts';
import { getMapApi, useGame, useUiStore } from '../../state/store.ts';
import '../../styles/citywork-smart.css';
import { CitizenPortrait } from '../art/index.ts';
import { ManualRouteMap, type CityworkMapPoint } from '../citywork/ManualRouteMap.tsx';
import { MapBuildingCard } from '../citywork/MapBuildingCard.tsx';
import { RouteSummary } from '../citywork/RouteSummary.tsx';
import { SupplyPicker } from '../citywork/SupplyPicker.tsx';
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
  // § D-057: Der WIRKLICHE Ladezustand des Wagens. Reine Projektion aus der
  // Simulation — die Oberflaeche rechnet keine Menge nach (D-048).
  const cargoStatus = useMemo(
    () => (active ? game.getActivityCargoStatus() : undefined),
    [game, game.version, active],
  );

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
  const anchors = useMemo(
    () => game.getActivityRouteAnchors(defId, targetIds),
    [game, game.version, defId, targetKey],
  );
  const defaultVehicle = context?.vehicles[0]?.id ?? def?.vehicle ?? 'van';
  const [selectedVehicle, setSelectedVehicle] = useState<DriveVehicle>(
    active?.vehicle ?? defaultVehicle,
  );
  // Die gefahrene Strecke des laufenden Auftrags. Vor der Annahme ist sie leer —
  // es gibt keinen vorgezeichneten Weg mehr (§4).
  const [roadPath, setRoadPath] = useState<{ x: number; y: number }[]>(
    () => active?.plannedRoadPath?.map((point) => ({ ...point })) ?? [],
  );
  // § P2 (D-050/D-054): Ausführungsart des Auftrags — WER fährt. Läuft die
  // Mission schon, ist die Wahl gefallen und wird nur noch angezeigt.
  const [executionMode, setExecutionMode] = useState<TransportMode>(active?.mode ?? 'auto');
  /**
   * § D-068: Wo der Wagen GERADE steht — gemeldet aus der Fahrschleife der
   * WELT, nicht aus dieser Karte. Die Karte fährt nicht mehr; sie zeigt, was
   * draußen passiert. Dieselbe Ankunftsregel wie beim Abliefern, also misst
   * die Oberfläche keine eigene Entfernung (D-057).
   */
  const storageAtHand = useUiStore((state) => state.driveStatus?.atBuildingId);
  /**
   * § P5 (§6): Das befragte Gebäude. Der Zustand liegt HIER und nicht in der
   * Karte — die Karte meldet den Klick, der Planer beantwortet ihn. Zwei Stellen
   * für „was ist ausgewählt" laufen unweigerlich auseinander.
   */
  const [inspectedId, setInspectedId] = useState<string | undefined>(undefined);
  const [fitNonce, setFitNonce] = useState(0);
  const [boardFilter, setBoardFilter] = useState<BoardFilter>('all');
  const [showJobs, setShowJobs] = useState(false);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const initializedPlanKey = useRef('');

  // § P4 (§8): Der Ladeort ist eine ECHTE Wahl mit echten Beständen — nicht mehr
  // das erste Gebäude nach Id-Sortierung. `supplyOptions` ist leer, wo es nichts
  // zu wählen gibt (Auftrag ohne Ladung oder ohne Lager als Quelle); dann bleibt
  // die Oberfläche unverändert, statt eine Wahl vorzutäuschen.
  const supplyOptions = useMemo(
    () => game.getActivitySupplyOptions(defId, targetIds.length),
    [game, game.version, defId, targetKey],
  );
  const sourceBuildingId = useMemo(
    () => game.getActivitySourceBuildingId(defId),
    [game, game.version, defId],
  );
  const source = useMemo(
    () => sourcePoint(game, def, sourceBuildingId ?? context?.sourceBuildingIds[0]),
    [game, game.version, def, sourceBuildingId, context?.sourceBuildingIds],
  );
  const targets = useMemo(
    () => targetIds.map((id) => buildingPoint(game, id)).filter((point): point is RoutePoint => point !== undefined),
    [game, game.version, targetKey],
  );
  // § Overhaul 2.0 (§4/§14.1, D-054): KEIN Routenvorschlag mehr. Der Planer
  // errechnet weder Reihenfolge noch Weg noch Fahrzeug — er zeigt den Auftrag
  // und die Stadt. Die Strecke entsteht erst beim Fahren und wird über
  // `recordActivityDrive` aufgezeichnet; ein laufender Auftrag zeigt genau das,
  // was bisher gefahren wurde.
  useEffect(() => {
    if (!anchors || !context) return;
    const planKey = `${defId}:${targetKey}:${active ? 'active' : 'draft'}`;
    if (initializedPlanKey.current === planKey) return;
    initializedPlanKey.current = planKey;
    setSelectedVehicle(active?.vehicle ?? defaultVehicle);
    setRoadPath(active?.plannedRoadPath?.map((point) => ({ ...point })) ?? []);
    setShowAdjustments(false);
    setShowJobs(false);
    setFitNonce((value) => value + 1);
  }, [active, anchors, context, defaultVehicle, defId, targetKey]);

  // Die aufgezeichnete Strecke des laufenden Auftrags nachziehen: der Command
  // schreibt sie ohne `notify` mit (Bildrate), sichtbar wird sie beim nächsten
  // regulären Update — Ankunft, Ausstieg, Tick.
  useEffect(() => {
    if (!active?.plannedRoadPath) return;
    setRoadPath(active.plannedRoadPath.map((point) => ({ ...point })));
  }, [active, game.version]);

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
      if (event.key === 'f' || event.key === 'F') setFitNonce((value) => value + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closePlanner, showAdjustments, showJobs]);

  const selectedVehicleDef = context?.vehicles.find((vehicle) => vehicle.id === selectedVehicle);
  const preview = useMemo(
    () => game.getActivityRoutePreview(defId, targetIds, roadPath, selectedVehicle),
    [game, game.version, defId, targetKey, roadPath, selectedVehicle],
  );
  // Verkehrsdichte-Ebene der Karte: eine reine Darstellung des vorhandenen
  // Netzes zwischen Quelle und Zielen — kein Wegvorschlag (§13).
  const referenceAnalysis = useMemo(
    () => game.analyseActivityRoute(defId, targetIds),
    [game, game.version, defId, targetKey],
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
  const board = game.getActivityBoard().filter((entry) => entry.def.drive);
  const filteredBoard = board.filter((entry) => boardFilter === 'all' || entry.def.category === boardFilter);
  const filters = useMemo(
    () => ['all', ...new Set(board.map((entry) => entry.def.category).filter(Boolean))] as BoardFilter[],
    [board],
  );
  const futureVehicles = game.config.activities.vehicles.filter((vehicle) => vehicle.future);

  // Die Fahrzeugwahl ist eine Wahl — sie zieht keine Route nach sich (§13).
  const selectVehicle = (vehicle: DriveVehicle) => {
    if (!context) return;
    setSelectedVehicle(vehicle);
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

  // Der Aufschlag kommt aus DERSELBEN Funktion, die ihn später auszahlt
  // (`modeRewardFactor`) — die angezeigte Prämie ist die gezahlte Prämie.
  const rewardFactor = modeRewardFactor(executionMode, game.config.activities.manualDriveBonusFactor);
  const bonusPercent = Math.round(
    (modeRewardFactor('manual', game.config.activities.manualDriveBonusFactor) - 1) * 100,
  );

  /**
   * § D-068: Der EINE Weg ans Steuer — Planer schließen, dann in der Welt
   * einsteigen. Er steht hier als Funktion, weil ihn drei Stellen brauchen
   * (Auftrag annehmen, Weiterfahren, Zwischenbilanz); drei Kopien wären drei
   * Gelegenheiten, das Schließen zu vergessen und die Kamera gegen ein
   * halboffenes Panel arbeiten zu lassen.
   */
  const enterMission = () => {
    closePlanner();
    requestAnimationFrame(() => {
      if (getMapApi()?.enterDrive()) {
        pushToast('Einsatz gestartet – W/A/S/D an der Kreuzung, Q zum Verlassen.', 'success');
      } else {
        pushToast('Kein befahrbarer Straßenanschluss für diesen Einsatz.', 'error');
      }
    });
  };

  // § Overhaul 2.0 (§4): Angenommen wird der AUFTRAG, nicht eine Lösung. Es geht
  // keine Route mit an den Command — sie entsteht unterwegs. Die Zielliste ist
  // die eingefrorene Auswahl des Auftrags, KEINE Reihenfolge: welches Ziel wann
  // bedient wird, entscheidet erst die Fahrt (`progressActivity`).
  const startRoute = () => {
    const plan = { vehicle: selectedVehicle, mode: executionMode };
    const result = active
      ? game.setActiveActivityRoute(active.targets.map((target) => target.buildingId), plan)
      : game.startActivity(def.id, targetIds, plan);
    if (!result.ok) {
      pushToast(t(`error.${result.error}`), 'error');
      return;
    }
    playFeedback('activity_start');
    // § D-068 (Stadtarbeit 3.0): DER EINSATZ FINDET IN DER WELT STATT.
    //
    // Das kehrt D-050 um („gefahren wird in der 2D-Karte, nicht in der
    // 3D-Welt") — ausdrücklich und auf Nutzerwunsch: „echte Weltansicht statt
    // flacher Karte". Kein zweiter Renderer: Es ist derselbe
    // `ThreeMapRenderer` mit einer Einsatzkamera, und `activities/driving.ts`
    // bleibt die eine Fahrphysik, die beide Ansichten schon heute teilen.
    if (executionMode === 'manual') {
      enterMission();
      return;
    }
    closePlanner();
    pushToast('Mission gestartet – dein Fahrzeug übernimmt ab hier.', 'success');
    requestAnimationFrame(() => setMissionFollow(true));
  };

  // Reine Projektionen — die Oberfläche rechnet weder Bestand noch Betrieb nach.
  const inspectedInfo = inspectedId ? game.getCityworkBuildingInfo(inspectedId) : undefined;
  // § D-068: Die Entfernung zum Fahrzeug stand hier, solange die Karte selbst
  // fuhr und die Position aus ihrer Fahrschleife kam. Sie fährt nicht mehr —
  // und eine Entfernung aus einer zweiten Rechnung wäre genau der zweite
  // Reichweitenbegriff, den D-057 vermeidet. Die Karte sagt jetzt, WO der Wagen
  // steht (`atBuildingId`), nicht wie weit er weg ist.
  const inspectedDistance = undefined;

  const selectedImage = selectedVehicleDef ? vehicleImage(selectedVehicleDef.imageKey) : undefined;
  const openTargets = active ? active.targets.filter((target) => !target.done).length : targetIds.length;
  /** Tatsächlich angefahrene Ziele in Besuchsreihenfolge — das Protokoll (§5). */
  const visitedTargetIds = active
    ? active.targets.filter((target) => target.done).map((target) => target.buildingId)
    : [];
  const drivenTiles = active?.plannedRoadPath?.length ?? 0;
  // Was der Spieler wissen muss, steht hier — und zwar als Aufgabe, nicht als
  // fertige Lösung (§13: keine automatische Route, keine feste Stoppliste).
  const planExplanation = selectedVehicleDef
    ? `${Math.round(selectedVehicleDef.speedKph)} km/h · ${selectedVehicleDef.capacity} Einheiten Ladung`
    : 'Wähle ein Fahrzeug für diesen Auftrag.';

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

        {/*
          § 7 des Auftrags („Oben: Auftragstitel, Fracht, offene Ziele,
          aktueller Modus"). Vier Angaben, die sonst über drei Panels verteilt
          waren — und die während der Fahrt der einzige Grund waren, überhaupt
          nach rechts zu schauen.
        */}
        <div className="citywork-smart-progress" aria-label="Auftragsstatus">
          <span className="done"><Check size={13} /> Auftrag gewählt</span>
          {cargoStatus && (
            <span><PackageCheck size={13} /> {Math.floor(cargoStatus.onboard)}{cargoStatus.capacity > 0 ? ` / ${cargoStatus.capacity}` : ''}</span>
          )}
          <span className={active ? 'active' : ''}>{openTargets} Ziele offen</span>
          <span className="done">
            {active?.mode === 'auto' ? <><Bot size={13} /> Die Stadt fährt</> : <><Gamepad2 size={13} /> Du fährst</>}
          </span>
        </div>

        <div className="citywork-smart-header-actions">
          <button
            onClick={() => pushToast('Du bekommst das Problem, nicht die Lösung: Ladeort und Fahrzeug wählst du, den Weg fährst du selbst. Jedes Ziel zählt, sobald du dort ankommst.', 'info')}
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
              <span className={`citywork-smart-state${active ? ' ready' : ''}`}>
                <Gamepad2 size={13} />
                {active ? 'Auftrag läuft' : 'Deine Aufgabe'}
              </span>
              <h2>{source.label} → {targetIds.length} Ziele</h2>
              {/* § D-068: Die Karte ist die ÜBERSICHT — wo liegen Ziele, Lager,
                  Quellen. Gefahren wird in der Stadt. */}
              <p>
                {active
                  ? `Übersicht über deinen Einsatz. ${drivenTiles} Kacheln gefahren — weiter geht es in der Stadt.`
                  : 'Ladeort und Fahrzeug wählst du. Der Weg entsteht beim Fahren, nicht vorher.'}
              </p>
            </div>
            <div className="citywork-smart-map-actions">
              <button onClick={() => setShowJobs((value) => !value)}>
                <PackageCheck size={15} /> Auftrag wechseln
              </button>
              <button onClick={() => setFitNonce((value) => value + 1)}>
                <Route size={15} /> Alles zeigen
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
              visitOrder={visitedTargetIds}
              {...(preview?.cargoRoute ? { cargoStops: preview.cargoRoute.stops } : {})}
              fitNonce={fitNonce}
              {...(selectedVehicleDef ? { vehicleSpeedKph: selectedVehicleDef.speedKph } : {})}
              {...(preview?.cargoPlan && preview.cargoPlan.capacity > 0
                ? { loadRatio: Math.min(1, preview.cargoPlan.totalRequired / preview.cargoPlan.capacity) }
                : {})}
              editEnabled={false}
              inspectedId={inspectedId}
              onInspect={setInspectedId}
              onPathChange={setRoadPath}
              onInvalid={() => pushToast('Nutze einen direkt angrenzenden Straßenabschnitt.', 'info')}
            />
            {inspectedInfo && (
              <MapBuildingCard
                info={inspectedInfo}
                distanceTiles={inspectedDistance}
                atHand={storageAtHand === inspectedInfo.buildingId}
                onClose={() => setInspectedId(undefined)}
                onReload={() => {
                  const result = game.reloadActivityCargo(inspectedInfo.buildingId);
                  if (result.ok) pushToast('Nachgeladen. Die Ware kommt aus genau diesem Lager.', 'success');
                  else pushToast(t(`error.${result.error}`), 'error');
                }}
              />
            )}
            <RouteSummary preview={preview} roadPath={roadPath} targetsTotal={targetIds.length} cargoStatus={cargoStatus} />
          </div>
        </main>

        <aside className="citywork-smart-decision">
          <section className={`citywork-smart-ready-card${active ? ' ready' : ''}`}>
            <span className="citywork-smart-kicker">{active ? 'Auftrag läuft' : 'Deine Entscheidung'}</span>
            <div className="citywork-smart-vehicle-hero">
              <span>{selectedImage ? <img src={selectedImage} alt="" /> : <Truck size={48} />}</span>
              <div>
                <small>Deine Auswahl</small>
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

            {def.drive && (
              <div className="citywork-mode-choice" role="group" aria-label="Ausführungsart">
                {(
                  [
                    {
                      mode: 'auto' as const,
                      icon: <Bot size={20} />,
                      title: 'Fahren lassen',
                      hint: 'Die Stadt fährt die Strecke selbst ab.',
                    },
                    {
                      mode: 'manual' as const,
                      icon: <Gamepad2 size={20} />,
                      title: 'Selbst fahren',
                      hint: `WASD / Pfeiltasten · +${bonusPercent} % Prämie`,
                    },
                  ] satisfies { mode: TransportMode; icon: JSX.Element; title: string; hint: string }[]
                ).map((option) => (
                  <button
                    key={option.mode}
                    className={executionMode === option.mode ? 'active' : ''}
                    disabled={active !== undefined}
                    aria-pressed={executionMode === option.mode}
                    onClick={() => setExecutionMode(option.mode)}
                  >
                    {option.icon}
                    <strong>{option.title}</strong>
                    <small>{option.hint}</small>
                  </button>
                ))}
              </div>
            )}

            <div className="citywork-smart-reward">
              <span><CircleDollarSign size={15} /> {formatMoney(Math.round(context.reward.money * rewardFactor))}</span>
              <span>{Math.round(context.reward.xp * rewardFactor)} XP</span>
            </div>

            {/*
              § Overhaul 2.0 (§4): Der Knopf nimmt den AUFTRAG an. Er wartete
              vorher auf eine vollständige automatische Route — jetzt gibt es
              keine, die fertig sein könnte. Läuft der Auftrag bereits, führt
              derselbe Knopf zurück ans Steuer — und zwar IN DIE STADT (D-068),
              nicht in diese Karte; sie hört hier auf, Spielfläche zu sein.
            */}
            {active && executionMode === 'manual' ? (
              <button className="citywork-smart-start" onClick={enterMission}>
                <Play size={17} /> Weiterfahren
              </button>
            ) : (
              <button className="citywork-smart-start" onClick={startRoute}>
                <Play size={17} />
                {executionMode === 'manual' ? 'Auftrag annehmen und einsteigen' : 'Auftrag annehmen'}
              </button>
            )}
          </section>

          <button
            className="citywork-smart-adjust-toggle"
            aria-expanded={showAdjustments}
            onClick={() => setShowAdjustments((value) => !value)}
          >
            <SlidersHorizontal size={16} />
            Fahrzeug und Tour
            <ChevronDown size={16} />
          </button>

          <SupplyPicker
            options={supplyOptions}
            selectedId={sourceBuildingId}
            locked={Boolean(active)}
            nameOf={(option) => {
              const definition = game.config.buildings.get(option.defId);
              return definition ? t(definition.nameKey) : option.defId;
            }}
            distanceOf={(option) => {
              const first = targets[0];
              return first ? Math.hypot(option.x - first.x, option.y - first.y) * TILE_METERS : undefined;
            }}
            onSelect={(buildingId) => {
              const result = game.setActivitySource(defId, buildingId);
              if (!result.ok) pushToast('Dieser Ladeort ist für den Auftrag nicht wählbar.');
              else setFitNonce((value) => value + 1);
            }}
          />

          {showAdjustments && (
            <div className="citywork-smart-adjustments">
              <VehicleSelector
                compact
                vehicles={context.vehicles}
                futureVehicles={futureVehicles}
                level={game.state.level.current}
                selected={selectedVehicle}
                {...(preview?.cargoPlan ? { cargoPlan: preview.cargoPlan } : {})}
                {...(preview?.cargoRoute ? { cargoRoute: preview.cargoRoute } : {})}
                cargoAssetKey={cargoAsset(def)}
                onSelect={selectVehicle}
              />

              {/*
                Keine geplante Stoppliste mehr (§13), sondern das Protokoll:
                erledigte Ziele in der Reihenfolge, in der SIE angefahren wurden.
                Vor der Annahme steht hier nichts — es gibt nichts zu
                protokollieren.
              */}
              <TourOverview
                compact
                source={source}
                targets={targets}
                orderedTargetIds={visitedTargetIds}
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
