import { Crosshair, Settings, X, type LucideIcon } from 'lucide-react';
import { getMapApi, useUiStore } from '../../state/store.ts';
import { t } from '../../i18n/index.ts';

// Main menu (§6/§20, top-right hamburger): now holds only SECONDARY entries.
// The primary destinations (Bürgermeister, Handel, Stadtarbeit, Statistiken,
// Overlay) moved to the always-visible quick-action bar. "Karte zentrieren" —
// demoted from a prominent quick button — lives here, together with Settings.
export function MenuPanel() {
  const setPanel = useUiStore((s) => s.setPanel);

  const items: { icon: LucideIcon; label: string; onClick(): void }[] = [
    { icon: Crosshair, label: t('ui.quick.map'), onClick: () => { getMapApi()?.centerOnCity(); setPanel(undefined); } },
    { icon: Settings, label: t('ui.settings'), onClick: () => setPanel('settings') },
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
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.label} className="menu-item" onClick={item.onClick}>
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
