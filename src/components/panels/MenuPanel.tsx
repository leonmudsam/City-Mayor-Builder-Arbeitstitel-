import { Settings, X, type LucideIcon } from 'lucide-react';
import { useUiStore } from '../../state/store.ts';
import { t } from '../../i18n/index.ts';

// Main menu (§6/§20, top-right hamburger): now holds only SECONDARY entries.
// The primary destinations (Bürgermeister, Handel, Stadtarbeit, Statistiken,
// Overlay) live in the always-visible quick-action bar; camera framing moved to
// the 3D view controls (presets + Zentrum, v0.30). Only Settings remains here.
export function MenuPanel() {
  const setPanel = useUiStore((s) => s.setPanel);

  const items: { icon: LucideIcon; label: string; onClick(): void }[] = [
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
