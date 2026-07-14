import { BarChart3, ClipboardList, Crown, Settings, Store, X, type LucideIcon } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { t } from '../../i18n/index.ts';
import type { PanelTarget } from '../../state/store.ts';

// Main menu (mockup §2, top-right hamburger): the hub for secondary destinations
// that no longer live on a bottom bar — mayor office, statistics, trade, city
// work board and settings. Each entry just switches the shared panel state.
export function MenuPanel() {
  const game = useGame();
  const setPanel = useUiStore((s) => s.setPanel);

  const items: { id: PanelTarget; icon: LucideIcon; label: string; show: boolean }[] = [
    { id: 'mayor', icon: Crown, label: t('ui.mayor'), show: true },
    { id: 'economy', icon: BarChart3, label: t('ui.economy.title'), show: true },
    { id: 'activities', icon: ClipboardList, label: t('ui.activities.title'), show: game.getActivityDefs().length > 0 },
    { id: 'trade', icon: Store, label: t('ui.trade.title'), show: game.hasTradePost() },
    { id: 'settings', icon: Settings, label: t('ui.settings'), show: true },
  ];

  return (
    <aside className="panel menu-panel">
      <div className="panel-head">
        <h3>{t('ui.menu')}</h3>
        <button className="btn-icon" onClick={() => setPanel(undefined)} title={t('ui.close')}>
          <X size={16} />
        </button>
      </div>
      <div className="menu-list">
        {items
          .filter((i) => i.show)
          .map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className="menu-item" onClick={() => setPanel(item.id)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
      </div>
    </aside>
  );
}
