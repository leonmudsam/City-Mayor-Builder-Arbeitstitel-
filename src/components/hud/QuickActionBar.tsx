import { BarChart3, Hammer, Layers, Map as MapIcon, Settings } from 'lucide-react';
import { getMapApi, useUiStore } from '../../state/store.ts';
import { t } from '../../i18n/index.ts';

// Bottom-right quick actions (mockup §10): the primary build button plus the
// map/overlay/stats/settings row. Designed to grow later (Handel, Energie,
// Logistik…) — each entry is just a QuickButton. Everything routes through the
// existing panel/overlay state, so no new navigation model is introduced.
export function QuickActionBar() {
  const { openPanel, overlayMode, setPanel, toggleOverlay } = useUiStore();

  return (
    <div className="quick-bar">
      <button
        className={`quick-build${openPanel === 'build' ? ' active' : ''}`}
        onClick={() => setPanel('build')}
        title={t('ui.build')}
      >
        <Hammer size={20} />
        <span>{t('ui.build')}</span>
      </button>
      <div className="quick-actions">
        <QuickButton
          icon={<MapIcon size={18} />}
          label={t('ui.quick.map')}
          onClick={() => getMapApi()?.centerOnCity()}
        />
        <QuickButton
          icon={<Layers size={18} />}
          label={t('ui.quick.overlay')}
          active={overlayMode}
          onClick={toggleOverlay}
        />
        <QuickButton
          icon={<BarChart3 size={18} />}
          label={t('ui.quick.stats')}
          active={openPanel === 'economy'}
          onClick={() => setPanel('economy')}
        />
        <QuickButton
          icon={<Settings size={18} />}
          label={t('ui.quick.settings')}
          active={openPanel === 'settings' || openPanel === 'menu'}
          onClick={() => setPanel('menu')}
        />
      </div>
    </div>
  );
}

function QuickButton({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick(): void;
}) {
  return (
    <button className={`quick-btn${active ? ' active' : ''}`} onClick={onClick} title={label}>
      <span className="quick-btn-icon">{icon}</span>
      <span className="quick-btn-label">{label}</span>
    </button>
  );
}
