import { useState } from 'react';
import {
  Clock,
  Coins,
  Factory,
  Flower2,
  Home,
  Landmark,
  Lock,
  Logs,
  Mountain,
  Route,
  ShoppingBasket,
  Sparkles,
  Store,
  TreePine,
  Wheat,
  X,
} from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import type { BuildingCategory, ResourceId } from '../../game/types.ts';
import type { BuildingDef } from '../../game/config/types.ts';
import { formatMoney, t } from '../../i18n/index.ts';

const CATEGORY_ORDER: { id: BuildingCategory; icon: React.ReactNode }[] = [
  { id: 'roads', icon: <Route size={16} /> },
  { id: 'residential', icon: <Home size={16} /> },
  { id: 'production', icon: <Factory size={16} /> },
  { id: 'services', icon: <ShoppingBasket size={16} /> },
  { id: 'leisure', icon: <TreePine size={16} /> },
  { id: 'economy', icon: <Store size={16} /> },
  { id: 'government', icon: <Landmark size={16} /> },
  { id: 'decoration', icon: <Flower2 size={16} /> },
];

const RESOURCE_ICONS: Record<ResourceId, React.ReactNode> = {
  money: <Coins size={13} />,
  wood: <Logs size={13} />,
  stone: <Mountain size={13} />,
  food: <Wheat size={13} />,
};

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
              key={cat.id}
              className={`btn-tab${category === cat.id ? ' active' : ''}`}
              onClick={() => setCategory(cat.id)}
            >
              {cat.icon}
              <span>{t(`category.${cat.id}`)}</span>
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
  const affordable = game.canAffordCost(def.cost);
  const uniqueBuilt = def.unique && Object.values(game.state.buildings).some((b) => b.defId === def.id);
  const limit = game.getBuildLimit(def.id);
  const limitReached = limit ? limit.count >= limit.max : false;
  const disabled = locked || !affordable || Boolean(uniqueBuilt) || limitReached;

  return (
    <button className={`build-card${disabled ? ' disabled' : ''}${locked ? ' locked' : ''}`} onClick={onPick} disabled={disabled}>
      <div className="build-card-top">
        <span className="build-card-name">{t(def.nameKey)}</span>
        <span className="build-card-size">{def.size.w}×{def.size.h}</span>
      </div>
      <div className="build-card-info">
        {Object.entries(def.cost).map(([res, amount]) => (
          <span
            key={res}
            className={`chip${game.state.resources[res as ResourceId] < (amount ?? 0) ? ' cost-missing' : ''}`}
          >
            {RESOURCE_ICONS[res as ResourceId]}
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
      {uniqueBuilt && <div className="build-card-lock">{t('error.unique_exists')}</div>}
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
      case 'demand':
        break;
    }
  }
  return [...new Set(parts)].join(' · ');
}
