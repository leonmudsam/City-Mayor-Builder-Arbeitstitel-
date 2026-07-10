import { Award, Coins, Droplets, Logs, Mountain, Star, Wheat } from 'lucide-react';
import { useGame } from '../../state/store.ts';
import { xpForNextLevel } from '../../game/progression/levels.ts';
import { t } from '../../i18n/index.ts';

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
        <Stat icon={<Coins size={15} />} label={t('resource.money')} value={fmt(res.money)} />
        <Stat icon={<Logs size={15} />} label={t('resource.wood')} value={`${fmt(res.wood)}/${fmt(caps.wood)}`} />
        <Stat icon={<Mountain size={15} />} label={t('resource.stone')} value={`${fmt(res.stone)}/${fmt(caps.stone)}`} />
        <Stat icon={<Wheat size={15} />} label={t('resource.food')} value={`${fmt(res.food)}/${fmt(caps.food)}`} />
        {waterPct !== undefined && (
          <Stat icon={<Droplets size={15} />} label={t('need.water')} value={`${waterPct}%`} warn={waterPct < 100} />
        )}
        {game.config.features.goldSystem && (
          <Stat icon={<Star size={15} />} label={t('resource.gold')} value={fmt(state.gold.balance)} />
        )}
      </div>
    </header>
  );
}

function Stat({ icon, label, value, warn }: { icon: React.ReactNode; label: string; value: string; warn?: boolean }) {
  return (
    <div className={`stat${warn ? ' stat-warn' : ''}`} title={label}>
      {icon}
      <span>{value}</span>
    </div>
  );
}

function fmt(n: number): string {
  return Math.floor(n).toLocaleString('de-DE');
}
