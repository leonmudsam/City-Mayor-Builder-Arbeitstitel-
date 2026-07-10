import { Crown, Frown, Hammer, Meh, ScrollText, Settings, Smile, Users } from 'lucide-react';
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

  return (
    <footer className="bottombar">
      <div className="bar-group">
        <button className={btn(openPanel === 'mayor')} onClick={() => setPanel('mayor')} title={t('ui.mayor')}>
          <Crown size={18} />
          <span>{t('ui.mayor')}</span>
        </button>
        <button className={btn(openPanel === 'happiness')} onClick={() => setPanel('happiness')} title={t('ui.happiness')}>
          <HappyIcon size={18} className={happiness < 40 ? 'icon-bad' : happiness >= 65 ? 'icon-good' : ''} />
          <span>{happiness}</span>
        </button>
        <div className="bar-stat" title={t('ui.population')}>
          <Users size={18} />
          <span>{Math.floor(game.state.citizens.population)}</span>
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
