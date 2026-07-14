import { Award, Droplets } from 'lucide-react';
import { useGame } from '../../state/store.ts';
import { xpForNextLevel } from '../../game/progression/levels.ts';
import { formatMoney, t } from '../../i18n/index.ts';
import { GoldIcon, ResourceIcon } from '../common/icons.tsx';
import { ResourceBadge } from './ResourceBadge.tsx';
import { ResourceDetailPopover } from './ResourceDetailPopover.tsx';

// Status only (§11): level + resource badges, no actions. Each material badge
// opens a detail popover; the layout is a thin composition over ResourceBadge.
export function TopBar() {
  const game = useGame();
  const { state, derived } = game;
  const res = state.resources;
  const caps = derived.storageCaps;
  const nextXp = xpForNextLevel(game.config, state.level.current);
  const prevXp = game.config.levels.find((l) => l.level === state.level.current)?.xpRequired ?? 0;
  const xpProgress = nextXp === undefined ? 1 : Math.min(1, (state.level.xp - prevXp) / (nextXp - prevXp));
  const waterNeed = state.citizens.needs.water;
  const waterPct = state.level.current >= 3 ? Math.round(waterNeed.fulfillment * 100) : undefined;
  const income = game.getIncome().net;

  return (
    <header className="topbar">
      <div className="topbar-level" title={`${state.level.xp} XP`}>
        <Award size={16} />
        <span>{t('ui.level')} {state.level.current}</span>
        <div className="xpbar">
          <div className="xpbar-fill" style={{ width: `${xpProgress * 100}%` }} />
        </div>
      </div>
      <div className="topbar-resources">
        <ResourceBadge
          icon={<ResourceIcon id="money" />}
          value={formatMoney(res.money)}
          sub={income === 0 ? undefined : income > 0 ? `+${formatMoney(income)}` : `−${formatMoney(-income)}`}
          warn={income < 0}
          accent="var(--res-money)"
          detail={<ResourceDetailPopover id="money" />}
        />
        <ResourceBadge
          icon={<ResourceIcon id="wood" />}
          value={`${fmt(res.wood)}/${fmt(caps.wood)}`}
          warn={caps.wood > 0 && res.wood >= caps.wood}
          accent="var(--res-wood)"
          detail={<ResourceDetailPopover id="wood" />}
        />
        <ResourceBadge
          icon={<ResourceIcon id="stone" />}
          value={`${fmt(res.stone)}/${fmt(caps.stone)}`}
          warn={caps.stone > 0 && res.stone >= caps.stone}
          accent="var(--res-stone)"
          detail={<ResourceDetailPopover id="stone" />}
        />
        <ResourceBadge
          icon={<ResourceIcon id="food" />}
          value={`${fmt(res.food)}/${fmt(caps.food)}`}
          warn={caps.food > 0 && res.food >= caps.food}
          accent="var(--res-food)"
          detail={<ResourceDetailPopover id="food" />}
        />
        {caps.freshwater > 0 && (
          <ResourceBadge
            icon={<ResourceIcon id="freshwater" />}
            value={`${fmt(res.freshwater)}/${fmt(caps.freshwater)}`}
            warn={res.freshwater >= caps.freshwater}
            accent="var(--res-water)"
          />
        )}
        {waterPct !== undefined && (
          <ResourceBadge
            icon={<Droplets size={15} />}
            value={`${waterPct}%`}
            warn={waterPct < 100}
            accent="var(--res-water)"
          />
        )}
        {game.config.features.goldSystem && (
          <ResourceBadge icon={<GoldIcon size={15} />} value={fmt(state.gold.balance)} accent="var(--res-gold)" />
        )}
      </div>
    </header>
  );
}

function fmt(n: number): string {
  return Math.floor(n).toLocaleString('de-DE');
}
