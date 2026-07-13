import { useState } from 'react';
import { Clock, Lock, Sparkles, X } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import type { BuildingCategory, ResourceId } from '../../game/types.ts';
import type { BuildingDef } from '../../game/config/types.ts';
import { formatMoney, t } from '../../i18n/index.ts';
import { CategoryIcon, ResourceIcon } from '../common/icons.tsx';
import { BuildingPreview } from '../common/BuildingPreview.tsx';

const CATEGORY_ORDER: BuildingCategory[] = [
  'roads',
  'residential',
  'production',
  'services',
  'leisure',
  'economy',
  'government',
  'decoration',
];

export function BuildMenu() {
  const game = useGame();
  const { startPlacing, setPanel } = useUiStore();
  const [category, setCategory] = useState<BuildingCategory>('roads');

  const buildings = game.config.buildingList
    .filter((b) => b.category === category && b.buildable !== false)
    .sort((a, b) => a.unlockLevel - b.unlockLevel);
  const level = game.state.level.current;

  return (
    <div className="panel build-menu">
      <div className="build-menu-head">
        <div className="build-tabs">
          {CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              className={`btn-tab${category === cat ? ' active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              <CategoryIcon id={cat} />
              <span>{t(`category.${cat}`)}</span>
            </button>
          ))}
        </div>
        <button className="btn-icon" onClick={() => setPanel(undefined)} title={t('ui.close')}>
          <X size={18} />
        </button>
      </div>
      <div className="build-cards">
        {buildings.map((def) => (
          <BuildCard key={def.id} def={def} locked={def.unlockLevel > level} onPick={() => startPlacing(def.id)} />
        ))}
      </div>
    </div>
  );
}

function BuildCard({ def, locked, onPick }: { def: BuildingDef; locked: boolean; onPick: () => void }) {
  const game = useGame();
  // The price actually charged for the next copy (escalating costs, §7).
  const cost = game.getBuildCost(def.id);
  const affordable = game.canAffordCost(cost);
  const uniqueBuilt = def.unique && Object.values(game.state.buildings).some((b) => b.defId === def.id);
  const limit = game.getBuildLimit(def.id);
  const limitReached = limit ? limit.count >= limit.max : false;
  const disabled = locked || !affordable || Boolean(uniqueBuilt) || limitReached;
  // Big public buildings / infrastructure read as investments, not impulse buys.
  const major = game.isMajorProject(def.id);
  // When a major project is merely unaffordable, explain how to get there
  // instead of a bare "too little money" (§11): show current vs. recommended
  // steady net income.
  const scaled = def.costScaling !== undefined && limit !== undefined && limit.count > 0;
  // First-build discount active (§3): the first ever copy is free/cheap.
  const firstFree = game.isFirstBuildDiscount(def.id);

  return (
    <button
      className={`build-card${disabled ? ' disabled' : ''}${locked ? ' locked' : ''}${major ? ' major' : ''}`}
      onClick={onPick}
      disabled={disabled}
    >
      <div className="build-card-media">
        <BuildingPreview category={def.category} size={def.size} />
        <span className="build-card-size">{def.size.w}×{def.size.h}</span>
      </div>
      <div className="build-card-body">
        <div className="build-card-name">
          {t(def.nameKey)}
          {major && <span className="build-card-tag">{t('ui.major_project')}</span>}
          {firstFree && !locked && <span className="build-card-tag free">{t('ui.first_build_free')}</span>}
        </div>
        <div className="build-card-info">
          {Object.entries(cost).map(([res, amount]) => (
            <span
              key={res}
              className={`chip${game.state.resources[res as ResourceId] < (amount ?? 0) ? ' cost-missing' : ''}`}
            >
              <ResourceIcon id={res as ResourceId} size={13} />
              {res === 'money' ? formatMoney(amount ?? 0) : amount}
            </span>
          ))}
          {def.constructionSec > 0 && (
            <span className="chip">
              <Clock size={13} />
              {def.constructionSec}s
            </span>
          )}
        </div>
        <div className="build-card-effect">{effectSummary(def)}</div>
        {scaled && <div className="build-card-scaled">{t('ui.cost_scaled')}</div>}
        {def.locationBonus && (
          <div className="build-card-bonus">
            <Sparkles size={12} />
            {t('ui.location_bonus_hint', { terrain: t(`terrain.${def.locationBonus.terrain}`) })}
          </div>
        )}
        {locked && (
          <div className="build-card-lock">
            <Lock size={12} />
            {t('ui.locked_at', { level: def.unlockLevel })}
          </div>
        )}
        {!locked && limit && (
          <div className={`build-card-limit${limitReached ? ' reached' : ''}`}>
            {t('ui.limit.count', { count: limit.count, max: limit.max })}
            {limitReached && limit.nextLevel !== undefined && ` · ${t('ui.limit.more_at', { level: limit.nextLevel })}`}
          </div>
        )}
        {!locked && !affordable && !limitReached && !uniqueBuilt && major && (
          <div className="build-card-invest">
            {t('ui.major_project_hint', {
              current: formatMoney(game.getIncome().net),
              recommended: formatMoney(game.recommendedIncomeFor(def.id)),
            })}
          </div>
        )}
        {uniqueBuilt && <div className="build-card-lock">{t('error.unique_exists')}</div>}
      </div>
    </button>
  );
}

function effectSummary(def: BuildingDef): string {
  const parts: string[] = [];
  for (const eff of def.effects) {
    switch (eff.type) {
      case 'produce':
        parts.push(`+${eff.perMinute} ${t(`resource.${eff.resource}`)}/min`);
        break;
      case 'housing':
        parts.push(`${eff.units} ${t('ui.housing.units')} · ${eff.units * eff.maxResidentsPerUnit} ${t('need.housing')}`);
        break;
      case 'revenue':
        parts.push(`+${formatMoney(eff.perMinute)} ${t('resource.money')}/min`);
        break;
      case 'capacity':
        parts.push(
          eff.radius !== undefined
            ? `+${eff.amount} ${t(`need.${eff.need}`)} (${t('ui.radius')} ${eff.radius})`
            : `+${eff.amount} ${t(`need.${eff.need}`)}`,
        );
        break;
      case 'coverage':
        parts.push(`${t(`need.${eff.need}`)} (${t('ui.radius')} ${eff.radius})`);
        break;
      case 'storage':
        parts.push(`+${eff.amount} ${t('ui.storage')}`);
        break;
      case 'jobs':
        parts.push(`+${eff.amount} ${t('ui.jobs')}`);
        break;
      case 'distribution':
        parts.push(t('ui.effect.distribution', { need: t(`need.${eff.need}`), radius: eff.radius }));
        break;
      case 'protection':
        parts.push(t('ui.effect.protection', { radius: eff.radius }));
        break;
      case 'ambience':
        if (eff.amount > 0) parts.push(`${t('ui.ambience')} +${eff.amount}`);
        break;
      case 'logistics':
        parts.push(t('ui.effect.logistics', { boost: eff.boostPct, radius: eff.radius }));
        break;
      case 'upkeep':
        parts.push(t('ui.effect.upkeep', { amount: formatMoney(eff.perMinute) }));
        break;
      case 'demand':
        break;
    }
  }
  return [...new Set(parts)].join(' · ');
}
