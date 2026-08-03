import {
  AlertTriangle,
  Anchor,
  ArrowUp,
  Axe,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Coins,
  Grid2X2,
  Home,
  Layers,
  Leaf,
  Lock,
  MapPinned,
  Move,
  PackageOpen,
  Pause,
  Pickaxe,
  Play,
  Route,
  Sprout,
  ShieldCheck,
  Sparkles,
  Square,
  Store,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  UserX,
  Warehouse,
  Wheat,
  X,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { effectiveEffects } from '../../game/buildings/effects.ts';
import type { Diagnosis } from '../../game/buildings/diagnostics.ts';
import type { BuildingDef, BuildingEffect } from '../../game/config/types.ts';
import { regionIdAt, terrainAt } from '../../game/config/startRegion.config.ts';
import type { BuildingInstance, ResourceNodeType } from '../../game/types.ts';
import { formatGameDuration, formatMoney, t } from '../../i18n/index.ts';
import { getMapApi, useGame, useUiStore } from '../../state/store.ts';
import { BuildingArt } from '../art/index.ts';
import { ConfirmModal } from '../common/ConfirmModal.tsx';
import { useEscapeClose } from '../common/useEscapeClose.ts';
import { TransportPlanner } from '../logistics/TransportPlanner.tsx';
import { buildBuildingOperationView, defaultWorkAreaSelection } from '../operations/adapters.ts';
import { nodeVocabulary } from '../operations/nodeVocabulary.ts';

function costLabel(cost: Partial<Record<string, number>>): string {
  return Object.entries(cost)
    .map(([resource, amount]) =>
      `${resource === 'money' ? formatMoney(amount ?? 0) : amount} ${t(`resource.${resource}`)}`,
    )
    .join(' · ');
}

/**
 * AS-3 building sheet: the default view answers four questions only:
 * what is it, is it healthy, what are its core values and what should happen
 * next? Site diagnostics and manual logistics remain available on demand.
 */
export function FloatingBuildingSheet() {
  const game = useGame();
  const {
    selectedBuildingId,
    selectBuilding,
    startMoving,
    startPlacing,
    setPanel,
    pushToast,
    openWorkAreaPlanner,
    openResourceNetwork,
    openFieldTool,
  } = useUiStore();
  const [confirmDemolish, setConfirmDemolish] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [previewStage, setPreviewStage] = useState<number>();

  useEffect(() => {
    setPreviewStage(undefined);
    setDetailsOpen(false);
    setConfirmDemolish(false);
  }, [selectedBuildingId]);
  useEscapeClose(
    () => selectBuilding(undefined),
    selectedBuildingId !== undefined && !confirmDemolish,
  );

  if (!selectedBuildingId) return null;
  const building = game.state.buildings[selectedBuildingId];
  const def = building && game.config.buildings.get(building.defId);
  if (!building || !def) return null;

  const effects = effectiveEffects(def, building.upgradeLevel);
  const upgrade = game.getUpgradeInfo(building.id);
  const maxLevel = upgrade.maxStage;
  const viewedStage = Math.min(maxLevel, previewStage ?? building.upgradeLevel);
  const bonusPct = game.derived.productionBonus[building.id] ?? 0;
  const ambience = game.derived.ambience[building.id];
  const diagnostics = game.getBuildingDiagnostics(building.id);
  const visibleDiagnostics = diagnostics.filter((diagnosis) => diagnosis.code !== 'no_movein');
  const problems = visibleDiagnostics.filter((diagnosis) => diagnosis.kind === 'problem');
  const benefits = visibleDiagnostics.filter((diagnosis) => diagnosis.kind === 'benefit');
  const primaryProblem = problems[0];
  const status = buildingStatus(building, visibleDiagnostics);
  const operationInfo = def.operation ? game.getBuildingOperationInfo(building.id) : undefined;
  const activeOperationInfo = building.status === 'active' ? operationInfo : undefined;
  // § D-058: Eine Farm ist der Betrieb auf `crop` — gefragt wird die Config,
  // nicht die Gebäude-Id. Wer eine zweite Farm einträgt, bekommt den Knopf
  // ohne weiteres Zutun.
  const isFarm = def.operation?.nodeType === 'crop' && building.status === 'active';
  const fieldSummary = isFarm ? game.getFarmFieldSummary(building.id) : undefined;
  const logisticsWarning = activeOperationInfo
    ? game.getLogisticsWarnings().find((warning) => warning.buildingId === building.id)
    : undefined;
  const radius = effects.reduce((largest, effect) => {
    if ('radius' in effect && typeof effect.radius === 'number') return Math.max(largest, effect.radius);
    return largest;
  }, 0);
  const stats = effects.flatMap((effect) => effectStats(effect, bonusPct, def.operation !== undefined));
  if (bonusPct > 0) {
    stats.push({
      icon: <Sparkles size={14} />,
      label: t('ui.location_bonus_short'),
      value: `+${Math.round(bonusPct)}%`,
      tone: 'good',
    });
  }
  if (ambience !== undefined) {
    stats.push({
      icon: <Leaf size={14} />,
      label: t('ui.ambience'),
      value: `${ambience >= 0 ? '+' : ''}${ambience}`,
      tone: ambience >= 0 ? 'good' : 'bad',
    });
  }

  const refund = game.getDemolishRefund(building.id);
  const refundLabel = costLabel(refund);
  const canRelocate = game.config.features.moveBuildings || def.canRelocate === true;
  const relocateAffordable = !def.relocationCost || game.canAffordCost(def.relocationCost);
  const canDemolish = def.canDemolish !== false && !def.unique;
  const stageNameKey =
    building.upgradeLevel > 0
      ? (def.upgrades?.[building.upgradeLevel - 1]?.nameKey ?? def.nameKey)
      : def.nameKey;
  const close = () => selectBuilding(undefined);
  const openArea = () => {
    if (!activeOperationInfo) return;
    openWorkAreaPlanner(
      building.id,
      activeOperationInfo.efficientRadius,
      defaultWorkAreaSelection(game, building.id, activeOperationInfo.efficientRadius),
    );
  };

  let nextTitle = 'Kein Handlungsbedarf';
  let nextDescription = 'Das Gebäude arbeitet wie vorgesehen.';
  let nextTone: 'good' | 'warn' | 'neutral' = 'good';
  let nextActionLabel: string | undefined;
  let nextAction: (() => void) | undefined;
  let nextActionIcon: ReactNode = <Route size={16} />;
  let nextActionDisabled = false;

  if (building.status === 'constructing') {
    nextTitle = building.targetUpgradeLevel !== undefined ? 'Ausbau läuft' : 'Bau läuft';
    nextDescription =
      building.constructionEndsAt !== undefined
        ? t('ui.ready_in', { time: formatGameDuration(building.constructionEndsAt - game.state.meta.lastSimTime) })
        : 'Die Baustelle wird automatisch fertiggestellt.';
    nextTone = 'neutral';
  } else if (building.status === 'paused') {
    nextTitle = 'Gebäude außer Betrieb';
    nextDescription = t('message.fire', { building: t(def.nameKey) });
    nextTone = 'warn';
  } else if (logisticsWarning) {
    nextTitle = 'Lieferung braucht Aufmerksamkeit';
    nextDescription = logisticsWarningText(logisticsWarning.code, t(`resource.${logisticsWarning.resource}`));
    nextTone = 'warn';
    nextActionLabel = 'Logistik prüfen';
    nextActionIcon = <Warehouse size={16} />;
    nextAction = () => openResourceNetwork(logisticsWarning.resource);
  } else if (primaryProblem) {
    nextTitle = t(`diag.${primaryProblem.code}`, primaryProblem.params);
    nextDescription = 'Öffne die Diagnose für Ursache und Standortdaten.';
    nextTone = 'warn';
    const road = primaryProblem.code === 'no_road'
      ? game.config.buildingList.find(
          (candidate) =>
            candidate.category === 'roads' &&
            candidate.buildable !== false &&
            candidate.unlockLevel <= game.state.level.current &&
            game.canAffordCost(game.getBuildCost(candidate.id)),
        )
      : undefined;
    if (road) {
      nextActionLabel = 'Straße anbinden';
      nextActionIcon = <Route size={16} />;
      nextAction = () => startPlacing(road.id);
    } else {
      nextActionLabel = 'Problem ansehen';
      nextActionIcon = <AlertTriangle size={16} />;
      nextAction = () => setDetailsOpen(true);
    }
  } else if (activeOperationInfo && !activeOperationInfo.active) {
    nextTitle = 'Betrieb startklar';
    nextDescription = 'Ein Klick richtet das empfohlene Arbeitsgebiet als Dauerbetrieb ein.';
    nextTone = 'neutral';
    nextActionLabel = 'Betrieb starten';
    nextActionIcon = operationIcon(activeOperationInfo.nodeType, 16);
    nextAction = () => {
      const result = game.startBuildingOperation(building.id);
      if (!result.ok) pushToast(nodeVocabulary(activeOperationInfo.nodeType).emptyArea, 'error');
    };
  } else if (activeOperationInfo) {
    nextTitle = 'Betrieb läuft automatisch';
    nextDescription = 'Arbeitsgebiet und Lieferautomatik übernehmen die laufende Arbeit.';
  } else if (upgrade.next) {
    nextTone = 'neutral';
    if (upgrade.lockedUntilLevel !== undefined) {
      nextTitle = `Nächste Stufe ab Level ${upgrade.lockedUntilLevel}`;
      nextDescription = 'Deine Stadt muss zuerst weiter wachsen.';
      nextActionLabel = `Level ${upgrade.lockedUntilLevel}`;
      nextActionIcon = <Lock size={16} />;
      nextActionDisabled = true;
    } else if (!upgrade.affordable) {
      nextTitle = 'Ressourcen für die nächste Stufe sammeln';
      nextDescription = costLabel(upgrade.next.cost);
      nextActionLabel = 'Noch nicht bezahlbar';
      nextActionIcon = <Lock size={16} />;
      nextActionDisabled = true;
    } else {
      nextTitle = upgrade.next.nameKey ? t(upgrade.next.nameKey) : 'Nächste Ausbaustufe';
      nextDescription = `Upgrade · ${costLabel(upgrade.next.cost)}`;
      nextActionLabel = 'Upgrade starten';
      nextActionIcon = <ArrowUp size={16} />;
      nextAction = () => {
        const result = game.upgradeBuilding(building.id);
        if (!result.ok) pushToast(t(`error.${result.error}`), 'error');
      };
    }
  } else if (def.tradePost) {
    nextTitle = 'Handel verwalten';
    nextDescription = 'Preise, Käufe und Verkäufe liegen gesammelt im Handel.';
    nextTone = 'neutral';
    nextActionLabel = 'Handel öffnen';
    nextActionIcon = <Store size={16} />;
    nextAction = () => setPanel('trade');
  }

  return (
    <>
      <aside
        className="floating-sheet as3-building-sheet"
        aria-label={`Gebäudedetails: ${t(stageNameKey)}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="as3-building-hero">
          <span className="as3-building-hero-art">
            <BuildingArt id={def.id} category={def.category} px={148} stage={viewedStage} />
          </span>
          <span className="as3-building-hero-copy">
            <small>{t(`category.${def.category}`)}</small>
            <h2>{t(stageNameKey)}</h2>
            <span>
              Stufe {building.upgradeLevel + 1}
              <i>von {maxLevel + 1}</i>
            </span>
          </span>
          <span className={`as3-building-status ${status.tone}`}>{t(status.key)}</span>
          <button className="as3-icon-button" type="button" onClick={close} title={t('ui.close')}>
            <X size={18} />
          </button>
        </header>

        {activeOperationInfo ? (
          <CompactOperationSummary buildingId={building.id} />
        ) : (
          <section className="as3-building-stats" aria-label="Kernwerte">
            {stats.slice(0, 4).map((stat, index) => (
              <span className="as3-building-stat" key={`${stat.label}-${index}`}>
                <i>{stat.icon}</i>
                <small>{stat.label}</small>
                <strong className={stat.tone ? `text-${stat.tone}` : undefined}>{stat.value}</strong>
              </span>
            ))}
            {stats.length === 0 && (
              <span className="as3-building-stat wide">
                <i><CheckCircle2 size={16} /></i>
                <small>Status</small>
                <strong>Bereit</strong>
              </span>
            )}
          </section>
        )}

        {def.category === 'residential' && building.status === 'active' && <ResidentialGrowthNote />}

        <section className={`as3-next-step ${nextTone}`}>
          <span className="as3-next-step-icon">
            {nextTone === 'warn' ? <AlertTriangle size={18} /> : nextTone === 'good' ? <CheckCircle2 size={18} /> : <Sparkles size={18} />}
          </span>
          <span>
            <small>Nächster Schritt</small>
            <strong>{nextTitle}</strong>
            <p>{nextDescription}</p>
          </span>
          {nextActionLabel && (
            <button
              type="button"
              className="as3-primary-button"
              onClick={nextAction}
              disabled={nextActionDisabled}
            >
              {nextActionIcon}
              {nextActionLabel}
            </button>
          )}
        </section>

        {(radius > 0 || activeOperationInfo || isFarm) && (
          <div className="as3-building-map-actions">
            {/* § D-058: Der Zugang zum Feldsystem. Eine Farm ist ein Gebäude MIT
                FELDERN — ohne diesen Knopf existierte die Mechanik nur im Code. */}
            {isFarm && (
              <button type="button" onClick={() => openFieldTool(building.id)}>
                <Wheat size={15} />
                Felder verwalten
                <span>{fieldSummary?.tiles ?? 0} Kacheln</span>
              </button>
            )}
            {radius > 0 && (
              <button type="button" onClick={() => getMapApi()?.focusSelected()}>
                <Route size={15} />
                Wirkungsbereich auf Karte
                <span>{radius} Felder</span>
              </button>
            )}
            {activeOperationInfo && (
              <button type="button" onClick={openArea}>
                <MapPinned size={15} />
                Arbeitsgebiet
                <span>{activeOperationInfo.efficientRadius} Felder</span>
              </button>
            )}
          </div>
        )}

        <details
          className="as3-building-details"
          open={detailsOpen}
          onToggle={(event) => setDetailsOpen(event.currentTarget.open)}
        >
          <summary>
            <span>
              <ChevronDown size={16} />
              Mehr Details
            </span>
            <small>Standort, Stufen und Verwaltung</small>
          </summary>
          <div className="as3-building-details-body">
            {maxLevel > 0 && (
              <BuildingStageGallery
                def={def}
                currentStage={building.upgradeLevel}
                viewedStage={viewedStage}
                onView={setPreviewStage}
              />
            )}

            <BuildingSiteDetails
              building={building}
              radius={radius}
              bonusPct={bonusPct}
            />

            {stats.length > 4 && (
              <section className="as3-detail-card">
                <h3>Weitere Werte</h3>
                <div className="as3-detail-value-grid">
                  {stats.slice(4).map((stat, index) => (
                    <span key={`${stat.label}-${index}`}>
                      <small>{stat.icon}{stat.label}</small>
                      <strong className={stat.tone ? `text-${stat.tone}` : undefined}>{stat.value}</strong>
                    </span>
                  ))}
                </div>
              </section>
            )}

            {(problems.length > 0 || benefits.length > 0) && (
              <section className="as3-detail-card">
                <h3>Diagnose</h3>
                <div className="as3-diagnostics">
                  {problems.map((diagnosis) => (
                    <p className="problem" key={`problem-${diagnosis.code}`}>
                      <AlertTriangle size={14} />
                      {t(`diag.${diagnosis.code}`, diagnosis.params)}
                    </p>
                  ))}
                  {benefits.map((diagnosis) => (
                    <p className="benefit" key={`benefit-${diagnosis.code}`}>
                      <CheckCircle2 size={14} />
                      {t(`diag.${diagnosis.code}`, diagnosis.params)}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {activeOperationInfo && <OperationDetails buildingId={building.id} />}

            <section className="as3-detail-card as3-building-management">
              <h3>Verwaltung</h3>
              <div>
                {def.tradePost && building.status === 'active' && (
                  <button type="button" onClick={() => setPanel('trade')}>
                    <Store size={15} />
                    Handel öffnen
                  </button>
                )}
                {canRelocate && (
                  <button
                    type="button"
                    disabled={!relocateAffordable}
                    onClick={() => startMoving(building.id)}
                  >
                    <Move size={15} />
                    {def.relocationCost ? `Versetzen · ${costLabel(def.relocationCost)}` : 'Versetzen'}
                  </button>
                )}
                {canDemolish && (
                  <button type="button" className="danger" onClick={() => setConfirmDemolish(true)}>
                    <Trash2 size={15} />
                    Abreißen
                  </button>
                )}
              </div>
            </section>
          </div>
        </details>
      </aside>

      {confirmDemolish && (
        <ConfirmModal
          title={t('ui.demolish')}
          message={t('ui.demolish.confirm')}
          danger
          confirmLabel={t('ui.demolish')}
          detail={refundLabel ? t('ui.demolish.refund', { resources: refundLabel }) : undefined}
          onConfirm={() => {
            game.demolishBuilding(building.id);
            if (refundLabel) pushToast(t('ui.demolish.refunded', { resources: refundLabel }), 'success');
            setConfirmDemolish(false);
            close();
          }}
          onCancel={() => setConfirmDemolish(false)}
        />
      )}
    </>
  );
}

/**
 * Werkzeugsymbol des Betriebs (§A6). Die Axt stand bis zuletzt auch über einem
 * Steinbruch — dasselbe Versehen wie „Bäume in Reichweite": der Referenzschnitt
 * war das Sägewerk. Unbelegte Knotentypen bekommen ein neutrales Symbol.
 */
function operationIcon(nodeType: ResourceNodeType, size: number): ReactNode {
  switch (nodeType) {
    case 'tree':
      return <Axe size={size} />;
    case 'rock':
      return <Pickaxe size={size} />;
    case 'crop':
      return <Sprout size={size} />;
    default:
      return <Layers size={size} />;
  }
}

function CompactOperationSummary({ buildingId }: { buildingId: string }) {
  const game = useGame();
  const { pushToast } = useUiStore();
  const info = game.getBuildingOperationInfo(buildingId);
  const view = buildBuildingOperationView(game, buildingId);
  if (!info || !view) return null;

  const throughput = game.getOperationThroughput(buildingId);
  const autoTransport = game.getAutoTransport(buildingId);
  const storagePct =
    info.inventory.capacity > 0
      ? Math.min(100, Math.round((info.inventory.used / info.inventory.capacity) * 100))
      : 0;
  const resourceName = t(`resource.${info.resource}`);
  const warning = game.getLogisticsWarnings().find((candidate) => candidate.buildingId === buildingId);

  const toggleAutoTransport = () => {
    const result = game.setAutoTransport(buildingId, !autoTransport.enabled);
    if (!result.ok) pushToast(t(`error.${result.error}`), 'error');
  };

  return (
    <section className="as3-operation-summary">
      <header>
        <span>
          {operationIcon(info.nodeType, 15)}
          Betrieb
        </span>
        <strong className={view.status === 'active' ? 'good' : 'warn'}>{view.statusLabel}</strong>
      </header>
      <div className="as3-operation-metrics">
        <span>
          <TrendingUp size={15} />
          <small>Produktion</small>
          <strong>
            {throughput && throughput.perMinute > 0
              ? `${throughput.perMinute.toLocaleString('de-DE')} ${resourceName}/min`
              : throughput?.idleReason
                ? t(`ui.operation.idle.${throughput.idleReason}`)
                : 'Bereit'}
          </strong>
        </span>
        <span>
          <Users size={15} />
          <small>Arbeiter</small>
          <strong>{info.workersBusy} / {info.workerSlots}</strong>
        </span>
        <span>
          <PackageOpen size={15} />
          <small>Lager</small>
          <strong>{Math.round(info.inventory.used)} / {info.inventory.capacity}</strong>
        </span>
      </div>
      <div className="as3-operation-storage">
        <i style={{ width: `${storagePct}%` }} className={info.storageFull ? 'full' : ''} />
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={autoTransport.enabled}
        className={`as3-auto-toggle${autoTransport.enabled ? ' enabled' : ''}`}
        onClick={toggleAutoTransport}
      >
        <span><Truck size={15} /></span>
        <span>
          <strong>Lieferautomatik</strong>
          <small>{autoTransport.enabled ? 'Bestes Lager und Fahrzeug werden automatisch gewählt.' : 'Aus · manuelle Planung unter „Mehr Details“.'}</small>
        </span>
        <i aria-hidden="true"><b /></i>
      </button>
      {warning && autoTransport.enabled && (
        <p className="as3-operation-warning">
          <AlertTriangle size={14} />
          {logisticsWarningText(warning.code, resourceName)}
        </p>
      )}
    </section>
  );
}

function OperationDetails({ buildingId }: { buildingId: string }) {
  const game = useGame();
  const { openResourceNetwork } = useUiStore();
  const info = game.getBuildingOperationInfo(buildingId);
  const view = buildBuildingOperationView(game, buildingId);
  if (!info || !view) return null;

  const autoTransport = game.getAutoTransport(buildingId);
  const resourceName = t(`resource.${info.resource}`);
  const running = info.active !== undefined;
  const vocabulary = nodeVocabulary(info.nodeType);
  const continuous = game.getContinuousOperationStatus(buildingId);

  return (
    <section className="as3-detail-card as3-operation-details">
      <h3>Betriebsdetails</h3>
      <div className="as3-detail-value-grid">
        <span>
          <small><MapPinned size={13} /> {vocabulary.inRange}</small>
          <strong>{info.availableNodes}</strong>
        </span>
        {/*
          § A6: Bei einem nicht nachwachsenden Vorkommen ist der Restbestand im
          Arbeitsgebiet die eigentliche strategische Zahl — er sagt, wie lange der
          Standort überhaupt noch trägt. Bei Holz/Nahrung wäre dieselbe Zahl
          irreführend (sie füllt sich wieder auf), deshalb steht sie nur hier.
        */}
        {!info.renewable && continuous !== undefined ? (
          <span>
            <small><Layers size={13} /> {t('ui.operation.remaining_in_area')}</small>
            <strong>{continuous.remainingInArea.toLocaleString('de-DE')} {resourceName}</strong>
          </span>
        ) : (
          <span>
            <small><Warehouse size={13} /> Frei im Lager</small>
            <strong>{Math.max(0, Math.round(info.inventory.free))} {resourceName}</strong>
          </span>
        )}
        <span>
          <small><PackageOpen size={13} /> Reserviert</small>
          <strong>{Math.round(Object.values(info.inventory.reserved).reduce((sum, amount) => sum + amount, 0))}</strong>
        </span>
      </div>
      {!info.renewable && (
        <p className="as3-operation-warning">
          <AlertTriangle size={14} />
          {continuous?.remainingInArea === 0 ? t('ui.operation.exhausted_hint') : t('ui.operation.finite_deposit')}
        </p>
      )}

      {view.workers.length > 0 && (
        <div className="as3-worker-list">
          {view.workers.map((worker) => (
            <span key={worker.id}>
              <i><Users size={13} /></i>
              <span>
                <strong>{worker.displayName}</strong>
                <small>{worker.statusLabel}{worker.detail ? ` · ${worker.detail}` : ''}</small>
              </span>
              <em>{worker.progressPct}%</em>
            </span>
          ))}
        </div>
      )}

      <div className="as3-operation-detail-actions">
        <button type="button" onClick={() => openResourceNetwork(info.resource)}>
          <Warehouse size={15} />
          Ressourcennetz
        </button>
        {running && (
          <>
            {info.active?.paused ? (
              <button type="button" onClick={() => game.resumeBuildingOperation(buildingId)}>
                <Play size={15} />
                Fortsetzen
              </button>
            ) : (
              <button type="button" onClick={() => game.pauseBuildingOperation(buildingId)}>
                <Pause size={15} />
                Pausieren
              </button>
            )}
            <button type="button" className="danger" onClick={() => game.cancelBuildingOperation(buildingId)}>
              <Square size={14} />
              Betrieb stoppen
            </button>
          </>
        )}
      </div>

      {!autoTransport.enabled && (
        <details className="as3-manual-transport">
          <summary>
            <Truck size={14} />
            Manuellen Transport planen
            <ChevronDown size={14} />
          </summary>
          <TransportPlanner compact sourceBuildingId={buildingId} resource={info.resource} />
        </details>
      )}
    </section>
  );
}

function BuildingStageGallery({
  def,
  currentStage,
  viewedStage,
  onView,
}: {
  def: BuildingDef;
  currentStage: number;
  viewedStage: number;
  onView(stage: number): void;
}) {
  const game = useGame();
  const maxStage = def.upgrades?.length ?? 0;
  return (
    <section className="as3-detail-card">
      <h3>Gebäudestufen</h3>
      <div className="as3-stage-strip">
        {Array.from({ length: maxStage + 1 }, (_, stage) => {
          const stageDef = stage > 0 ? def.upgrades?.[stage - 1] : undefined;
          const locked =
            stageDef?.unlockLevel !== undefined && game.state.level.current < stageDef.unlockLevel;
          return (
            <button
              type="button"
              key={stage}
              className={`${viewedStage === stage ? 'active' : ''}${currentStage === stage ? ' current' : ''}`}
              onClick={() => onView(stage)}
            >
              <BuildingArt id={def.id} category={def.category} px={62} stage={stage} />
              <span>
                <strong>Stufe {stage + 1}</strong>
                <small>{currentStage === stage ? 'Aktuell' : locked ? `Ab Level ${stageDef?.unlockLevel}` : 'Vorschau'}</small>
              </span>
              {locked && <Lock size={12} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function BuildingSiteDetails({
  building,
  radius,
  bonusPct,
}: {
  building: BuildingInstance;
  radius: number;
  bonusPct: number;
}) {
  const game = useGame();
  const def = game.config.buildings.get(building.defId);
  if (!def) return null;

  const region = game.config.regions.get(regionIdAt(building.x, building.y));
  const terrain = terrainAt(building.x, building.y);
  const infrastructure = game.getBuildingInfrastructureStatus(building.id);
  const harborConnections = def.waterfront ? game.getAvailableHarborConnections(building.id) : [];

  return (
    <section className="as3-detail-card">
      <h3>Standort</h3>
      <div className="as3-site-grid">
        <span>
          <small>Region</small>
          <strong>{region ? t(region.nameKey) : '—'}</strong>
        </span>
        <span>
          <small>Gelände</small>
          <strong>{t(`terrain.${terrain}`)}</strong>
        </span>
        <span>
          <small>Straße</small>
          <strong className={infrastructure?.modes.road || !def.requiresRoad ? 'text-good' : 'text-bad'}>
            {def.requiresRoad ? (infrastructure?.modes.road ? 'Verbunden' : 'Fehlt') : 'Nicht nötig'}
          </strong>
        </span>
        <span>
          <small>Grundfläche</small>
          <strong><Grid2X2 size={13} /> {def.size.w}×{def.size.h}</strong>
        </span>
        <span>
          <small>Standortbonus</small>
          <strong className={bonusPct > 0 ? 'text-good' : undefined}>{bonusPct > 0 ? `+${Math.round(bonusPct)}%` : '—'}</strong>
        </span>
        <span>
          <small>Wirkungsradius</small>
          <strong>{radius > 0 ? `${radius} Felder` : '—'}</strong>
        </span>
        {def.waterfront && (
          <>
            <span>
              <small><Anchor size={12} /> Wasserweg</small>
              <strong className={infrastructure?.modes.water ? 'text-good' : 'text-bad'}>
                {infrastructure?.modes.water ? 'Erreichbar' : 'Fehlt'}
              </strong>
            </span>
            <span>
              <small>Hafenverbindungen</small>
              <strong>{harborConnections.filter((connection) => connection.status === 'planned').length}</strong>
            </span>
          </>
        )}
      </div>
    </section>
  );
}

function buildingStatus(
  building: BuildingInstance,
  diagnostics: Diagnosis[],
): { key: string; tone: 'good' | 'bad' | 'busy' } {
  if (building.status === 'constructing') {
    return building.targetUpgradeLevel !== undefined
      ? { key: 'ui.status.upgrading', tone: 'busy' }
      : { key: 'ui.status.constructing', tone: 'busy' };
  }
  if (building.status === 'paused') return { key: 'ui.status.paused', tone: 'bad' };
  if (diagnostics.some((diagnosis) => diagnosis.kind === 'problem')) {
    return { key: 'ui.status.attention', tone: 'bad' };
  }
  if (diagnostics.some((diagnosis) => diagnosis.code === 'upgrade_ready')) {
    return { key: 'ui.status.upgrade_ready', tone: 'good' };
  }
  return { key: 'ui.status.active', tone: 'good' };
}

function ResidentialGrowthNote() {
  const game = useGame();
  const growth = game.getGrowthStatus();
  if (growth.growing) {
    return (
      <p className="as3-growth-note text-good">
        <TrendingUp size={14} />
        {t('ui.growth.moving_in', { rate: Math.round(growth.ratePerMin).toLocaleString('de-DE') })}
      </p>
    );
  }
  const key =
    growth.reason === 'housing_full'
      ? 'ui.growth.full'
      : growth.reason === 'unhappy'
        ? 'ui.growth.nobody_here'
        : 'ui.growth.no_housing';
  return (
    <p className={`as3-growth-note ${growth.reason === 'unhappy' ? 'text-bad' : 'text-warn'}`}>
      <UserX size={14} />
      {t(key)}
    </p>
  );
}

function logisticsWarningText(
  code: 'no_storage_target' | 'no_route' | 'no_vehicle' | 'storage_full',
  resourceName: string,
): string {
  switch (code) {
    case 'no_storage_target':
      return `Kein freies Lager nimmt ${resourceName} an.`;
    case 'no_route':
      return 'Zwischen Betrieb und Lager fehlt eine befahrbare Straße.';
    case 'no_vehicle':
      return 'Noch kein passendes Lieferfahrzeug verfügbar.';
    case 'storage_full':
      return `Das lokale ${resourceName}-Lager ist voll.`;
  }
}

interface SheetStat {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: 'good' | 'bad';
}

function effectIcon(effect: BuildingEffect): ReactNode {
  switch (effect.type) {
    case 'produce':
      return <TrendingUp size={15} />;
    case 'housing':
      return <Home size={15} />;
    case 'revenue':
      return <Coins size={15} />;
    case 'capacity':
      return effect.need === 'housing' ? <Home size={15} /> : <PackageOpen size={15} />;
    case 'coverage':
    case 'ambience':
      return <Leaf size={15} />;
    case 'storage':
      return <Warehouse size={15} />;
    case 'jobs':
      return <BriefcaseBusiness size={15} />;
    case 'distribution':
      return <PackageOpen size={15} />;
    case 'protection':
      return <ShieldCheck size={15} />;
    case 'logistics':
      return <Truck size={15} />;
    case 'upkeep':
      return <TrendingDown size={15} />;
    case 'demand':
      return null;
  }
}

function effectStats(
  effect: BuildingEffect,
  bonusPct: number,
  isActiveOperation = false,
): SheetStat[] {
  const icon = effectIcon(effect);
  switch (effect.type) {
    case 'produce': {
      if (isActiveOperation) return [];
      const rate = effect.perMinute * (1 + bonusPct / 100);
      return [{
        icon,
        label: t(`resource.${effect.resource}`),
        value: `+${rate % 1 === 0 ? rate : rate.toFixed(1)}/min`,
        tone: 'good',
      }];
    }
    case 'housing':
      return [
        { icon, label: 'Wohneinheiten', value: String(effect.units) },
        {
          icon: <Home size={14} />,
          label: 'Bewohner',
          value: `${effect.units * effect.minResidentsPerUnit}–${effect.units * effect.maxResidentsPerUnit}`,
        },
      ];
    case 'revenue':
      return [{
        icon,
        label: 'Einnahmen',
        value: `+${formatMoney(effect.perMinute)}/min`,
        tone: 'good',
      }];
    case 'capacity':
      return [
        { icon, label: t(`need.${effect.need}`), value: `+${effect.amount}` },
        ...(effect.radius !== undefined
          ? [{ icon: <MapPinned size={14} />, label: 'Radius', value: `${effect.radius} Felder` }]
          : []),
      ];
    case 'coverage':
      return [
        { icon, label: t(`need.${effect.need}`), value: 'Versorgung' },
        { icon: <MapPinned size={14} />, label: 'Radius', value: `${effect.radius} Felder` },
      ];
    case 'storage':
      return [{ icon, label: `${t(`resource.${effect.resource}`)}-Lager`, value: `+${effect.amount}` }];
    case 'jobs':
      return [{ icon, label: 'Arbeitsplätze', value: `+${effect.amount}` }];
    case 'distribution':
      return [{ icon, label: `${t(`need.${effect.need}`)} verteilen`, value: `${effect.radius} Felder` }];
    case 'protection':
      return [{ icon, label: 'Schutzradius', value: `${effect.radius} Felder` }];
    case 'logistics':
      return [{
        icon,
        label: 'Logistik',
        value: `+${effect.boostPct}% · ${effect.radius} Felder`,
        tone: 'good',
      }];
    case 'upkeep':
      return [{
        icon,
        label: 'Unterhalt',
        value: `−${formatMoney(effect.perMinute)}/min`,
        tone: 'bad',
      }];
    case 'ambience':
    case 'demand':
      return [];
  }
}
