import {
  ArrowUp,
  BriefcaseBusiness,
  Building2,
  Clock,
  Flame,
  Home,
  Leaf,
  Move,
  PackageOpen,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Warehouse,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useGame, useUiStore } from '../../state/store.ts';
import { effectiveEffects } from '../../game/buildings/effects.ts';
import type { BuildingEffect } from '../../game/config/types.ts';
import { formatDuration, t } from '../../i18n/index.ts';

/**
 * Centered building dialog: the important facts in one clear, readable place
 * instead of a small side panel (§6 of the UX pass).
 */
export function BuildingPanel() {
  const game = useGame();
  const { selectedBuildingId, selectBuilding, startMoving, pushToast } = useUiStore();
  const [confirmDemolish, setConfirmDemolish] = useState(false);
  if (!selectedBuildingId) return null;
  const b = game.state.buildings[selectedBuildingId];
  const def = b && game.config.buildings.get(b.defId);
  if (!b || !def) return null;

  const effects = effectiveEffects(def, b.upgradeLevel);
  const nextUpgrade = def.upgrades?.[b.upgradeLevel];
  const maxLevel = def.upgrades ? def.upgrades.length : 0;
  const bonusPct = game.derived.productionBonus[b.id] ?? 0;
  const ambience = game.derived.ambience[b.id];
  const now = game.state.meta.lastSimTime;
  const close = () => selectBuilding(undefined);

  return (
    <div className="dialog-backdrop" onClick={close}>
      <div className="dialog building-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <h3>
            <Building2 size={18} />
            {t(def.nameKey)}
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

        <div className="dialog-buttons dialog-buttons-stack">
          <button
            className="btn-secondary"
            onClick={() => {
              startMoving(b.id);
            }}
          >
            <Move size={16} />
            {t('ui.move')}
          </button>

          {nextUpgrade && b.status === 'active' && (
            <button
              className="btn-primary"
              disabled={!game.canAffordCost(nextUpgrade.cost)}
              onClick={() => {
                const result = game.upgradeBuilding(b.id);
                if (!result.ok) pushToast(t(`error.${result.error}`), 'error');
              }}
            >
              <ArrowUp size={16} />
              {t('ui.upgrade')} (
              {Object.entries(nextUpgrade.cost)
                .map(([res, amount]) => `${amount} ${t(`resource.${res}`)}`)
                .join(', ')}
              )
            </button>
          )}

          {!def.unique &&
            (confirmDemolish ? (
              <div className="confirm-row">
                <span>{t('ui.demolish.confirm')}</span>
                <button
                  className="btn-danger"
                  onClick={() => {
                    game.demolishBuilding(b.id);
                    close();
                  }}
                >
                  {t('ui.demolish')}
                </button>
                <button className="btn-secondary" onClick={() => setConfirmDemolish(false)}>
                  {t('ui.cancel')}
                </button>
              </div>
            ) : (
              <button className="btn-danger" onClick={() => setConfirmDemolish(true)}>
                <Trash2 size={16} />
                {t('ui.demolish')}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

function effectIcon(eff: BuildingEffect) {
  switch (eff.type) {
    case 'produce':
      return <TrendingUp size={15} />;
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
  }
}

function describeEffect(eff: BuildingEffect, bonusPct: number): string | undefined {
  switch (eff.type) {
    case 'produce': {
      const rate = eff.perMinute * (1 + bonusPct / 100);
      return t('ui.effect.produce', { rate: rate % 1 === 0 ? rate : rate.toFixed(1), resource: t(`resource.${eff.resource}`) });
    }
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
      return t('ui.effect.distribution', { need: t(`need.${eff.need}`) });
    case 'protection':
      return t('ui.effect.protection', { radius: eff.radius });
    case 'ambience':
      return undefined; // shown via the aggregated "Umgebung" line
  }
}
