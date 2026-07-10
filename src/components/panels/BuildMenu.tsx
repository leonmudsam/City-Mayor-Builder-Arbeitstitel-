import { useState } from 'react';
import { Factory, Flower2, Home, Landmark, Route, ShoppingBasket, Store, TreePine } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import type { BuildingCategory } from '../../game/types.ts';
import type { BuildingDef } from '../../game/config/types.ts';
import { t } from '../../i18n/index.ts';

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

export function BuildMenu() {
  const game = useGame();
  const startPlacing = useUiStore((s) => s.startPlacing);
  const [category, setCategory] = useState<BuildingCategory>('roads');

  const buildings = game.config.buildingList.filter((b) => b.category === category && b.buildable !== false);
  const level = game.state.level.current;

  return (
    <div className="panel build-menu">
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
  const disabled = locked || !affordable || Boolean(uniqueBuilt);

  return (
    <button className={`build-card${disabled ? ' disabled' : ''}`} onClick={onPick} disabled={disabled}>
      <div className="build-card-name">{t(def.nameKey)}</div>
      <div className="build-card-info">
        {Object.entries(def.cost).map(([res, amount]) => (
          <span key={res} className={game.state.resources[res as keyof typeof game.state.resources] < (amount ?? 0) ? 'cost-missing' : ''}>
            {amount} {t(`resource.${res}`)}
          </span>
        ))}
        {def.constructionSec > 0 && <span>{def.constructionSec}s</span>}
      </div>
      <div className="build-card-effect">{effectSummary(def)}</div>
      {locked && <div className="build-card-lock">{t('ui.locked_at', { level: def.unlockLevel })}</div>}
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
      case 'capacity':
        parts.push(`+${eff.amount} ${t(`need.${eff.need}`)}`);
        break;
      case 'coverage':
        parts.push(`${t(`need.${eff.need}`)} (Radius ${eff.radius})`);
        break;
      case 'storage':
        parts.push(`+${eff.amount} Lager`);
        break;
      case 'jobs':
        parts.push(`+${eff.amount} ${t('ui.jobs')}`);
        break;
      case 'distribution':
        parts.push(`Verteilt ${t(`need.${eff.need}`)}`);
        break;
      case 'protection':
        parts.push(`Brandschutz (Radius ${eff.radius})`);
        break;
    }
  }
  return [...new Set(parts)].join(' · ');
}
