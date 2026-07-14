import { ClipboardList, Crown, Frown, Hammer, Meh, ScrollText, Settings, Smile, Store, Users, Wallet } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { t } from '../../i18n/index.ts';

// Fixed groups (concept §11): left = city status, center = build (primary),
// right = system. The top bar holds status only, this bar holds actions.
export function BottomBar() {
  const game = useGame();
  const { openPanel, setPanel } = useUiStore();
  const happiness = Math.round(game.state.citizens.happiness);
  const HappyIcon = happiness >= 65 ? Smile : happiness >= 40 ? Meh : Frown;
  const claimable = game.state.quests.active.some((q) => q.claimable);
  // Stadtarbeit unlocks with its first activity (§ aktives Stadtmanagement);
  // trade becomes permanently reachable once a trading post exists (§6).
  const hasActivities = game.getActivityDefs().length > 0;
  const hasTrade = (game.state.stats.built['trading_post'] ?? 0) > 0;
  const activityBadge = game.state.activities.active !== undefined;

  return (
    <footer className="bottombar">
      <div className="bar-group">
        <button className={btn(openPanel === 'mayor')} onClick={() => setPanel('mayor')} title={t('ui.mayor')}>
          <Crown size={18} />
          <span>{t('ui.mayor')}</span>
        </button>
        <button
          className={btn(openPanel === 'status') + (happiness < 40 ? ' attention' : '')}
          onClick={() => setPanel('status')}
          title={t('ui.status.title')}
        >
          <HappyIcon size={18} className={happiness < 40 ? 'icon-bad' : happiness >= 65 ? 'icon-good' : ''} />
          <span>{happiness}</span>
        </button>
        <button className={btn(openPanel === 'economy')} onClick={() => setPanel('economy')} title={t('ui.economy.title')}>
          <Wallet size={18} />
          <span>{t('ui.economy.short')}</span>
        </button>
        {hasActivities && (
          <button
            className={btn(openPanel === 'activities') + (activityBadge ? ' attention' : '')}
            onClick={() => setPanel('activities')}
            title={t('ui.activities.title')}
          >
            <ClipboardList size={18} />
            <span>{t('ui.activities.short')}</span>
          </button>
        )}
        {hasTrade && (
          <button className={btn(openPanel === 'trade')} onClick={() => setPanel('trade')} title={t('ui.trade.title')}>
            <Store size={18} />
            <span>{t('ui.trade.short')}</span>
          </button>
        )}
        <div className="bar-stat" title={`${t('ui.population')} · ${game.derived.housingUnits} ${t('ui.housing.units')}`}>
          <Users size={18} />
          <span>
            {Math.floor(game.state.citizens.population)}
            <span className="bar-stat-cap"> / {game.derived.capacity.housing}</span>
          </span>
        </div>
      </div>
      <div className="bar-group bar-group-center">
        <button className={`btn-build${openPanel === 'build' ? ' active' : ''}`} onClick={() => setPanel('build')}>
          <Hammer size={20} />
          <span>{t('ui.build')}</span>
        </button>
      </div>
      <div className="bar-group">
        <button className={btn(openPanel === 'quests') + (claimable ? ' attention' : '')} onClick={() => setPanel('quests')} title={t('ui.quests')}>
          <ScrollText size={18} />
          <span>{t('ui.quests')}</span>
        </button>
        <button className={btn(openPanel === 'settings')} onClick={() => setPanel('settings')} title={t('ui.settings')}>
          <Settings size={18} />
        </button>
      </div>
    </footer>
  );
}

function btn(active: boolean): string {
  return `btn-bar${active ? ' active' : ''}`;
}
