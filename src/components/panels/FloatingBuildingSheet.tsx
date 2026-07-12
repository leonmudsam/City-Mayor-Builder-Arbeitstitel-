import {
  ArrowUp,
  BriefcaseBusiness,
  Building2,
  Clock,
  Coins,
  Flame,
  Home,
  Leaf,
  Move,
  PackageOpen,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
  Warehouse,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useGame, useUiStore } from '../../state/store.ts';
import { effectiveEffects } from '../../game/buildings/effects.ts';
import type { BuildingEffect } from '../../game/config/types.ts';
import { ActionBubble } from '../common/ActionBubble.tsx';
import { ConfirmModal } from '../common/ConfirmModal.tsx';
import { formatDuration, formatMoney, t } from '../../i18n/index.ts';

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
  const { selectedBuildingId, selectBuilding, startMoving, pushToast } = useUiStore();
  const [confirmDemolish, setConfirmDemolish] = useState(false);
  if (!selectedBuildingId) return null;
  const b = game.state.buildings[selectedBuildingId];
  const def = b && game.config.buildings.get(b.defId);
  if (!b || !def) return null;

  const effects = effectiveEffects(def, b.upgradeLevel);
  const upgrade = game.getUpgradeInfo(b.id);
  const maxLevel = upgrade.maxStage;
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
  const close = () => selectBuilding(undefined);

  return (
    <>
      <div className="floating-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="floating-sheet-head">
          <h3>
            <Building2 size={17} />
            {t(stageNameKey)}
            {maxLevel > 0 && (
              <span className="level-pips" title={`${t('ui.building_level')} ${b.upgradeLevel + 1}/${maxLevel + 1}`}>
                {Array.from({ length: maxLevel + 1 }, (_, i) => (
                  <span key={i} className={`pip${i <= b.upgradeLevel ? ' filled' : ''}`} />
                ))}
              </span>
            )}
          </h3>
          <button className="btn-icon" onClick={close} title={t('ui.close')}>
            <X size={18} />
          </button>
        </div>

        {b.status === 'constructing' && b.constructionEndsAt !== undefined && (
          <p className="dialog-status">
            <Clock size={15} /> {t('ui.construction')} — {t('ui.ready_in', { time: formatDuration(b.constructionEndsAt - now) })}
          </p>
        )}
        {b.status === 'paused' && (
          <p className="dialog-status text-bad">
            <Flame size={15} /> {t('message.fire', { building: t(def.nameKey) })}
          </p>
        )}

        <ul className="effect-list">
          {effects.map((eff, i) => {
            const line = describeEffect(eff, bonusPct);
            return line ? (
              <li key={i}>
                {effectIcon(eff)}
                <span>{line}</span>
              </li>
            ) : null;
          })}
          {bonusPct > 0 && (
            <li className="text-good">
              <Sparkles size={15} />
              <span>{t('ui.location_bonus', { pct: Math.round(bonusPct) })}</span>
            </li>
          )}
          {ambience !== undefined && (
            <li className={ambience >= 0 ? 'text-good' : 'text-bad'}>
              <Leaf size={15} />
              <span>
                {t('ui.ambience')}: {ambience >= 0 ? '+' : ''}{ambience}
              </span>
            </li>
          )}
        </ul>

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

function describeEffect(eff: BuildingEffect, bonusPct: number): string | undefined {
  switch (eff.type) {
    case 'produce': {
      const rate = eff.perMinute * (1 + bonusPct / 100);
      return t('ui.effect.produce', { rate: rate % 1 === 0 ? rate : rate.toFixed(1), resource: t(`resource.${eff.resource}`) });
    }
    case 'housing':
      return `${t('ui.effect.housing', { units: eff.units, residents: eff.units * eff.maxResidentsPerUnit })} (${t('ui.effect.housing_units', { min: eff.minResidentsPerUnit, max: eff.maxResidentsPerUnit })})`;
    case 'revenue':
      return t('ui.effect.revenue', { amount: formatMoney(eff.perMinute), category: t(`ui.revenue.${eff.category}`) });
    case 'capacity':
      return eff.radius !== undefined
        ? t('ui.effect.capacity_radius', { amount: eff.amount, need: t(`need.${eff.need}`), radius: eff.radius })
        : t('ui.effect.capacity', { amount: eff.amount, need: t(`need.${eff.need}`) });
    case 'coverage':
      return t('ui.effect.coverage', { need: t(`need.${eff.need}`), radius: eff.radius });
    case 'storage':
      return t('ui.effect.storage', { amount: eff.amount, resource: t(`resource.${eff.resource}`) });
    case 'jobs':
      return t('ui.effect.jobs', { amount: eff.amount });
    case 'distribution':
      return t('ui.effect.distribution', { need: t(`need.${eff.need}`), radius: eff.radius });
    case 'demand':
      return undefined;
    case 'protection':
      return t('ui.effect.protection', { radius: eff.radius });
    case 'ambience':
      return undefined;
    case 'logistics':
      return t('ui.effect.logistics', { boost: eff.boostPct, radius: eff.radius });
    case 'upkeep':
      return t('ui.effect.upkeep', { amount: formatMoney(eff.perMinute) });
  }
}
