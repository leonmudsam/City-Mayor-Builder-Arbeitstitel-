import {
  AlertTriangle,
  ArrowUp,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  Coins,
  Flame,
  Home,
  Leaf,
  Lock,
  MapPinned,
  Move,
  Route,
  Grid2X2,
  PackageOpen,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
  UserX,
  Warehouse,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useGame, useUiStore } from '../../state/store.ts';
import { effectiveEffects } from '../../game/buildings/effects.ts';
import type { BuildingEffect } from '../../game/config/types.ts';
import type { BuildingInstance } from '../../game/types.ts';
import type { Diagnosis } from '../../game/buildings/diagnostics.ts';
import { ActionBubble } from '../common/ActionBubble.tsx';
import { ConfirmModal } from '../common/ConfirmModal.tsx';
import { BuildingArt } from '../art/index.ts';
import { formatDuration, formatMoney, t } from '../../i18n/index.ts';
import { regionIdAt, terrainAt } from '../../game/config/startRegion.config.ts';

/** Money costs use the compact format; materials stay plain integers. */
function costLabel(cost: Partial<Record<string, number>>): string {
  return Object.entries(cost)
    .map(([res, amount]) => `${res === 'money' ? formatMoney(amount ?? 0) : amount} ${t(`resource.${res}`)}`)
    .join(', ');
}

/**
 * A building's info sheet that floats over the map rather than covering it
 * (§3): the map stays visible and the camera has already centred the building
 * (renderer focus). Actions are round bubbles (§4); demolish routes through the
 * shared ConfirmModal (§9). All gameplay stays in the controller.
 */
export function FloatingBuildingSheet() {
  const game = useGame();
  const { selectedBuildingId, selectBuilding, startMoving, setPanel, pushToast } = useUiStore();
  const [confirmDemolish, setConfirmDemolish] = useState(false);
  const [previewStage, setPreviewStage] = useState<number>();
  useEffect(() => setPreviewStage(undefined), [selectedBuildingId]);
  if (!selectedBuildingId) return null;
  const b = game.state.buildings[selectedBuildingId];
  const def = b && game.config.buildings.get(b.defId);
  if (!b || !def) return null;

  const effects = effectiveEffects(def, b.upgradeLevel);
  const upgrade = game.getUpgradeInfo(b.id);
  const maxLevel = upgrade.maxStage;
  const viewedStage = Math.min(maxLevel, previewStage ?? b.upgradeLevel);
  const bonusPct = game.derived.productionBonus[b.id] ?? 0;
  const ambience = game.derived.ambience[b.id];
  const now = game.state.meta.lastSimTime;
  const refund = game.getDemolishRefund(b.id);
  const refundLabel = costLabel(refund);
  const canRelocate = game.config.features.moveBuildings || def.canRelocate === true;
  const relocateAffordable = !def.relocationCost || game.canAffordCost(def.relocationCost);
  // A building that has been upgraded reads by its stage name (§ prestige/visual
  // development): "Wolkenkratzer", not "Wohnturm".
  const stageNameKey = b.upgradeLevel > 0 ? (def.upgrades?.[b.upgradeLevel - 1]?.nameKey ?? def.nameKey) : def.nameKey;
  // Problems & benefits (§2/§4): the shared diagnostics, grouped for the sheet.
  // "no_movein" is shown by the dedicated growth note below, so drop it here to
  // avoid saying the same thing twice.
  const diagnostics = game.getBuildingDiagnostics(b.id);
  const problems = diagnostics.filter((d) => d.kind === 'problem' && d.code !== 'no_movein');
  const benefits = diagnostics.filter((d) => d.kind === 'benefit');
  const status = buildingStatus(b, diagnostics);
  const regionId = regionIdAt(b.x, b.y);
  const region = game.config.regions.get(regionId);
  const terrain = terrainAt(b.x, b.y);
  const radius = effects.reduce((max, effect) => {
    if ('radius' in effect && typeof effect.radius === 'number') return Math.max(max, effect.radius);
    return max;
  }, 0);
  const roadStatus = diagnostics.some((diagnosis) => diagnosis.code === 'no_road')
    ? { label: t('diag.no_road'), tone: 'bad' }
    : def.requiresRoad
      ? { label: t('diag.road_ok'), tone: 'good' }
      : { label: 'Nicht erforderlich', tone: 'muted' };
  const close = () => selectBuilding(undefined);

  return (
    <>
      <div className="floating-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="floating-sheet-head">
          <div className="sheet-hero">
            <span className="sheet-hero-art">
              <BuildingArt id={def.id} category={def.category} px={158} stage={viewedStage} />
            </span>
            <div className="sheet-hero-text">
              <span className="sheet-kicker">Gebäude-Details</span>
              <h3>
                {t(stageNameKey)}
                {maxLevel > 0 && (
                  <span className="level-pips" title={`${t('ui.building_level')} ${b.upgradeLevel + 1}/${maxLevel + 1}`}>
                    {Array.from({ length: maxLevel + 1 }, (_, i) => (
                      <span key={i} className={`pip${i <= b.upgradeLevel ? ' filled' : ''}`} />
                    ))}
                  </span>
                )}
              </h3>
              <div className="sheet-substatus">
                <span className="sheet-category">{t(`category.${def.category}`)}</span>
                <span className="sheet-stage">Stufe {b.upgradeLevel + 1}/{maxLevel + 1}</span>
                <span className={`sheet-status-badge ${status.tone}`}>{t(status.key)}</span>
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={close} title={t('ui.close')}>
            <X size={18} />
          </button>
        </div>

        {maxLevel > 0 && (
          <section className="building-stage-gallery">
            <div className="building-stage-gallery-head">
              <span>Gebäude-Entwicklung</span>
              <small>
                Vorschau · Stufe {viewedStage + 1}/{maxLevel + 1}
              </small>
            </div>
            <div className="building-stage-strip">
              {Array.from({ length: maxLevel + 1 }, (_, stage) => {
                const stageDef = stage > 0 ? def.upgrades?.[stage - 1] : undefined;
                const levelGate = stageDef?.unlockLevel;
                const locked = levelGate !== undefined && game.state.level.current < levelGate;
                return (
                  <button
                    key={stage}
                    className={`${viewedStage === stage ? 'active' : ''}${stage === b.upgradeLevel ? ' current' : ''}`}
                    onClick={() => setPreviewStage(stage)}
                    title={
                      stageDef?.nameKey
                        ? t(stageDef.nameKey)
                        : `${t(def.nameKey)} · Stufe ${stage + 1}`
                    }
                  >
                    <span className="building-stage-art">
                      <BuildingArt id={def.id} category={def.category} px={66} stage={stage} />
                      {locked && (
                        <i>
                          <Lock size={12} />
                          Lv. {levelGate}
                        </i>
                      )}
                    </span>
                    <b>Stufe {stage + 1}</b>
                    <small>{stage === b.upgradeLevel ? 'Aktuell' : locked ? `Ab Level ${levelGate}` : 'Vorschau'}</small>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {b.status === 'constructing' && b.constructionEndsAt !== undefined && (
          <>
            <p className="dialog-status">
              <Clock size={15} /> {t(b.targetUpgradeLevel !== undefined ? 'ui.upgrade_running' : 'ui.construction')} —{' '}
              {t('ui.ready_in', { time: formatDuration(b.constructionEndsAt - now) })}
            </p>
            {b.targetUpgradeLevel !== undefined && (
              // §2/§17: reassure that the current stage stays fully active during
              // the upgrade, and name the stage the building is heading toward.
              <p className="dialog-hint sheet-upgrade-note">
                {t('ui.upgrade_running.keeps')}
                {def.upgrades?.[b.targetUpgradeLevel - 1]?.nameKey && (
                  <> {t('ui.upgrade_to', { name: t(def.upgrades[b.targetUpgradeLevel - 1]!.nameKey!) })}</>
                )}
              </p>
            )}
          </>
        )}
        {b.status === 'paused' && (
          <p className="dialog-status text-bad">
            <Flame size={15} /> {t('message.fire', { building: t(def.nameKey) })}
          </p>
        )}

        {(() => {
          // "Werte" block (mockup §6): the building's key figures as a compact
          // label/value grid rather than a wall of sentences. Derived straight
          // from the effective effects — no new state.
          const stats = effects.flatMap((eff) => effectStats(eff, bonusPct));
          if (bonusPct > 0) stats.push({ icon: <Sparkles size={14} />, label: t('ui.location_bonus_short'), value: `+${Math.round(bonusPct)}%`, tone: 'good' });
          if (ambience !== undefined) stats.push({ icon: <Leaf size={14} />, label: t('ui.ambience'), value: `${ambience >= 0 ? '+' : ''}${ambience}`, tone: ambience >= 0 ? 'good' : 'bad' });
          if (stats.length === 0) return null;
          return (
            <div className="sheet-stat-grid">
              {stats.map((s, i) => (
                <div key={i} className="sheet-stat">
                  <span className="sheet-stat-label">{s.icon} {s.label}</span>
                  <span className={`sheet-stat-value${s.tone ? ` text-${s.tone}` : ''}`}>{s.value}</span>
                </div>
              ))}
            </div>
          );
        })()}

        <section className="building-site-analysis">
          <div className="building-site-copy">
            <h4>
              <MapPinned size={15} /> {t('ui.building.site_analysis')}
            </h4>
            <div className="building-site-row">
              <span>{t('ui.building.region')}</span>
              <strong>{region ? t(region.nameKey) : '—'}</strong>
            </div>
            <div className="building-site-row">
              <span>{t('ui.building.terrain')}</span>
              <strong>{t(`terrain.${terrain}`)}</strong>
            </div>
            <div className="building-site-row">
              <span>{t('ui.building.road')}</span>
              <strong className={`text-${roadStatus.tone}`}>{roadStatus.label}</strong>
            </div>
            <div className="building-site-row">
              <span>{t('ui.building.footprint')}</span>
              <strong>
                <Grid2X2 size={13} /> {def.size.w}×{def.size.h}
              </strong>
            </div>
            <div className="building-site-row">
              <span>{t('ui.location_bonus_short')}</span>
              <strong className={bonusPct > 0 ? 'text-good' : 'muted'}>{bonusPct > 0 ? `+${Math.round(bonusPct)}%` : '—'}</strong>
            </div>
          </div>
          <div className="building-radius-preview">
            <span>{t('ui.building.coverage')}</span>
            <div className="building-radius-map">
              {radius > 0 ? (
                <i
                  style={{
                    width: `${46 + 78 * Math.min(1, radius / 24)}px`,
                    height: `${46 + 78 * Math.min(1, radius / 24)}px`,
                  }}
                />
              ) : <b>—</b>}
              <Route size={22} />
            </div>
            <strong>{radius > 0 ? t('ui.radius.tiles', { n: radius }) : 'Kein Radius'}</strong>
          </div>
        </section>

        {(problems.length > 0 || benefits.length > 0) && (
          <div className="sheet-diagnostics">
            {problems.map((d, i) => (
              <div key={`p${i}`} className="sheet-diag problem">
                <AlertTriangle size={14} />
                <span>{t(`diag.${d.code}`, d.params)}</span>
              </div>
            ))}
            {benefits.map((d, i) => (
              <div key={`b${i}`} className="sheet-diag benefit">
                <CheckCircle2 size={14} />
                <span>{t(`diag.${d.code}`, d.params)}</span>
              </div>
            ))}
          </div>
        )}

        {def.category === 'residential' && b.status === 'active' && <ResidentialGrowthNote />}

        <div className="action-bubbles">
          {upgrade.next && b.status === 'active' && (
            upgrade.lockedUntilLevel !== undefined ? (
              // The stage exists but the city is too low a level (§ level-coupled
              // densification): show why, don't just hide it.
              <ActionBubble
                icon={<ArrowUp size={18} />}
                label={t('ui.upgrade_locked', { level: upgrade.lockedUntilLevel })}
                disabled
                onClick={() => {}}
              />
            ) : (
              <ActionBubble
                icon={<ArrowUp size={18} />}
                label={`${upgrade.next.nameKey ? t('ui.upgrade_to', { name: t(upgrade.next.nameKey) }) : t('ui.upgrade')} · ${costLabel(upgrade.next.cost)}`}
                tone="primary"
                disabled={!upgrade.affordable}
                onClick={() => {
                  const result = game.upgradeBuilding(b.id);
                  if (!result.ok) pushToast(t(`error.${result.error}`), 'error');
                }}
              />
            )
          )}
          {def.tradePost && b.status === 'active' && (
            <ActionBubble
              icon={<Store size={18} />}
              label={t('ui.trade.open')}
              tone="primary"
              onClick={() => setPanel('trade')}
            />
          )}
          {canRelocate && (
            <ActionBubble
              icon={<Move size={18} />}
              label={def.canRelocate ? `${t('ui.relocate')}${def.relocationCost ? ` · ${costLabel(def.relocationCost)}` : ''}` : t('ui.move')}
              disabled={!relocateAffordable}
              onClick={() => startMoving(b.id)}
            />
          )}
          {!def.unique && (
            <ActionBubble icon={<Trash2 size={18} />} label={t('ui.demolish')} tone="danger" onClick={() => setConfirmDemolish(true)} />
          )}
        </div>
        {!canRelocate && !def.unique && <p className="dialog-hint">{t('ui.move.disabled')}</p>}
      </div>

      {confirmDemolish && (
        <ConfirmModal
          title={t('ui.demolish')}
          message={t('ui.demolish.confirm')}
          danger
          confirmLabel={t('ui.demolish')}
          detail={refundLabel ? t('ui.demolish.refund', { resources: refundLabel }) : undefined}
          onConfirm={() => {
            game.demolishBuilding(b.id);
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
 * The building's headline status for the sheet badge (§2): the same states the
 * game already tracks, plus a "needs attention" / "upgrade ready" read derived
 * from the shared diagnostics — no new state.
 */
function buildingStatus(b: BuildingInstance, diagnostics: Diagnosis[]): { key: string; tone: string } {
  if (b.status === 'constructing') {
    // An in-progress upgrade is flagged by targetUpgradeLevel (upgradeLevel now
    // only advances on completion), so this correctly reads "upgrading" even for
    // a base→stage-1 upgrade where upgradeLevel is still 0 (§2).
    return b.targetUpgradeLevel !== undefined
      ? { key: 'ui.status.upgrading', tone: 'busy' }
      : { key: 'ui.status.constructing', tone: 'busy' };
  }
  if (b.status === 'paused') return { key: 'ui.status.paused', tone: 'bad' };
  if (diagnostics.some((d) => d.kind === 'problem')) return { key: 'ui.status.attention', tone: 'bad' };
  if (diagnostics.some((d) => d.code === 'upgrade_ready')) return { key: 'ui.status.upgrade_ready', tone: 'good' };
  return { key: 'ui.status.active', tone: 'good' };
}

/**
 * Move-in status shown on a residential building (§11/§15): explains, right at
 * the home the player clicked, whether citizens are arriving and — if not — why
 * ("nobody wants to move in: …"). Population is a city-wide figure, so this
 * mirrors the city's growth model rather than inventing per-house occupancy.
 */
function ResidentialGrowthNote() {
  const game = useGame();
  const g = game.getGrowthStatus();
  if (g.growing) {
    return (
      <p className="sheet-growth text-good">
        <TrendingUp size={14} /> {t('ui.growth.moving_in', { rate: Math.round(g.ratePerMin).toLocaleString('de-DE') })}
      </p>
    );
  }
  const key =
    g.reason === 'housing_full'
      ? 'ui.growth.full'
      : g.reason === 'unhappy'
        ? 'ui.growth.nobody_here'
        : 'ui.growth.no_housing';
  return (
    <p className={`sheet-growth ${g.reason === 'unhappy' ? 'text-bad' : 'text-warn'}`}>
      <UserX size={14} /> {t(key)}
    </p>
  );
}

function effectIcon(eff: BuildingEffect) {
  switch (eff.type) {
    case 'produce':
      return <TrendingUp size={15} />;
    case 'housing':
      return <Home size={15} />;
    case 'revenue':
      return <Coins size={15} />;
    case 'capacity':
      return eff.need === 'housing' ? <Home size={15} /> : <PackageOpen size={15} />;
    case 'coverage':
      return <Leaf size={15} />;
    case 'storage':
      return <Warehouse size={15} />;
    case 'jobs':
      return <BriefcaseBusiness size={15} />;
    case 'distribution':
      return <PackageOpen size={15} />;
    case 'protection':
      return <ShieldCheck size={15} />;
    case 'ambience':
      return <Leaf size={15} />;
    case 'logistics':
      return <Truck size={15} />;
    case 'upkeep':
      return <TrendingDown size={15} />;
    case 'demand':
      return null;
  }
}

interface SheetStat {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'good' | 'bad';
}

/** One effect → its "Werte" grid rows (label + value). Empty for effects that
 *  have no legible figure (ambience/demand are shown elsewhere or implied). */
function effectStats(eff: BuildingEffect, bonusPct: number): SheetStat[] {
  const icon = effectIcon(eff);
  switch (eff.type) {
    case 'produce': {
      const rate = eff.perMinute * (1 + bonusPct / 100);
      return [{ icon, label: t(`resource.${eff.resource}`), value: `+${rate % 1 === 0 ? rate : rate.toFixed(1)}/min`, tone: 'good' }];
    }
    case 'housing':
      return [
        { icon, label: t('ui.housing.units'), value: String(eff.units) },
        { icon: <Home size={14} />, label: t('need.housing'), value: `${eff.units * eff.minResidentsPerUnit}–${eff.units * eff.maxResidentsPerUnit}` },
      ];
    case 'revenue':
      return [{ icon, label: t(`ui.revenue.${eff.category}`), value: `+${formatMoney(eff.perMinute)}/min`, tone: 'good' }];
    case 'capacity':
      return [
        { icon, label: t(`need.${eff.need}`), value: `+${eff.amount}` },
        ...(eff.radius !== undefined ? [{ icon: <MapPinned size={14} />, label: t('ui.radius'), value: t('ui.radius.tiles', { n: eff.radius }) }] : []),
      ];
    case 'coverage':
      return [
        { icon, label: t(`need.${eff.need}`), value: t('ui.effect.covers') },
        { icon: <MapPinned size={14} />, label: t('ui.radius'), value: t('ui.radius.tiles', { n: eff.radius }) },
      ];
    case 'storage':
      return [{ icon, label: `${t('ui.storage')} ${t(`resource.${eff.resource}`)}`, value: `+${eff.amount}` }];
    case 'jobs':
      return [{ icon, label: t('ui.jobs'), value: `+${eff.amount}` }];
    case 'distribution':
      return [{ icon, label: `${t('ui.distribution')} ${t(`need.${eff.need}`)}`, value: t('ui.radius.tiles', { n: eff.radius }) }];
    case 'protection':
      return [{ icon, label: t('ui.protection'), value: t('ui.radius.tiles', { n: eff.radius }) }];
    case 'logistics':
      return [{ icon, label: t('ui.logistics'), value: `+${eff.boostPct}% · ${t('ui.radius.tiles', { n: eff.radius })}`, tone: 'good' }];
    case 'upkeep':
      return [{ icon, label: t('ui.finance.upkeep'), value: `−${formatMoney(eff.perMinute)}/min`, tone: 'bad' }];
    case 'ambience':
    case 'demand':
      return [];
  }
}
