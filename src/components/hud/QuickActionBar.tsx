import { BarChart3, ClipboardList, Crown, EyeOff, Hammer, Layers, Menu, Store } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { buttonImage } from '../../assets/registry.ts';
import { t } from '../../i18n/index.ts';

// Bottom-right quick actions (§6/§7/§20): the primary Build button plus a row of
// the *primary* destinations — Bürgermeister, Stadtarbeit, Handel, Overlay,
// Statistiken — that used to be buried in the hamburger, plus a hide-UI toggle
// and the menu (now only secondary items). "Karte" is demoted into the menu.
// Every entry routes through existing panel/overlay state — no new nav model.
export function QuickActionBar() {
  const game = useGame();
  const { openPanel, overlayMode, setPanel, toggleOverlay, toggleUiHidden } = useUiStore();
  const hasTrade = game.hasTradePost();
  const hasActivities = game.getActivityDefs().length > 0;

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
          icon={<Crown size={18} />}
          img="btn_mayor"
          label={t('ui.mayor')}
          active={openPanel === 'mayor'}
          onClick={() => setPanel('mayor')}
        />
        {hasActivities && (
          <QuickButton
            icon={<ClipboardList size={18} />}
            img="btn_activities"
            label={t('ui.activities.short')}
            active={openPanel === 'activities'}
            onClick={() => setPanel('activities')}
          />
        )}
        {hasTrade && (
          <QuickButton
            icon={<Store size={18} />}
            img="btn_trade"
            label={t('ui.trade.short')}
            active={openPanel === 'trade'}
            onClick={() => setPanel('trade')}
          />
        )}
        <QuickButton
          icon={<Layers size={18} />}
          img="btn_overlay"
          label={t('ui.quick.overlay')}
          active={overlayMode}
          onClick={toggleOverlay}
        />
        <QuickButton
          icon={<BarChart3 size={18} />}
          img="btn_statistics"
          label={t('ui.quick.stats')}
          active={openPanel === 'economy'}
          onClick={() => setPanel('economy')}
        />
        <QuickButton icon={<EyeOff size={18} />} label={t('ui.quick.hide')} onClick={toggleUiHidden} />
        <QuickButton
          icon={<Menu size={18} />}
          img="btn_menu"
          label={t('ui.menu')}
          active={openPanel === 'menu' || openPanel === 'settings'}
          onClick={() => setPanel('menu')}
        />
      </div>
    </div>
  );
}

function QuickButton({
  icon,
  img,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  img?: string;
  label: string;
  active?: boolean;
  onClick(): void;
}) {
  // A dropped-in PNG (src/assets/ui/buttons/<img>.png) replaces the glyph tile.
  const src = img ? buttonImage(img) : undefined;
  return (
    <button className={`quick-btn${active ? ' active' : ''}`} onClick={onClick} title={label}>
      <span className="quick-btn-icon">
        {src ? <img src={src} width={34} height={34} alt="" aria-hidden="true" /> : icon}
      </span>
      <span className="quick-btn-label">{label}</span>
    </button>
  );
}
