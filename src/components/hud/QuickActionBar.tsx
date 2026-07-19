import { BarChart3, ClipboardList, Crown, EyeOff, Hammer, Home, Layers, Map, Store } from 'lucide-react';
import { getMapApi, useGame, useUiStore } from '../../state/store.ts';
import { buttonImage } from '../../assets/registry.ts';
import { t } from '../../i18n/index.ts';

// Mockup-faithful bottom navigation: the six main destinations stay centred and
// readable, while view/overlay/menu utilities form a smaller group on the right.
// Every entry still routes through the existing panel/camera state.
export function QuickActionBar() {
  const game = useGame();
  const { openPanel, overlayMode, cameraPreset, setPanel, toggleOverlay, toggleUiHidden, setCameraPreset } = useUiStore();
  const hasTrade = game.hasTradePost();
  const hasActivities = game.getActivityDefs().length > 0;

  const showCity = () => {
    getMapApi()?.centerOnCity();
    setCameraPreset('city');
    setPanel(undefined);
  };
  const showRegions = () => {
    setCameraPreset('overview');
    setPanel(undefined);
  };

  return (
    <div className="quick-bar">
      <nav className="primary-nav" aria-label={t('ui.nav.main')}>
        <PrimaryButton
          icon={<Home size={21} />}
          label={t('ui.nav.city')}
          active={openPanel === undefined && cameraPreset === 'city'}
          onClick={showCity}
        />
        <PrimaryButton
          icon={<Hammer size={23} />}
          img="btn_build"
          label={t('ui.build')}
          active={openPanel === 'build'}
          featured
          onClick={() => setPanel('build')}
        />
        {hasActivities && (
          <PrimaryButton
            icon={<ClipboardList size={21} />}
            img="btn_activities"
            label={t('ui.activities.short')}
            active={openPanel === 'activities'}
            onClick={() => setPanel('activities')}
          />
        )}
        <PrimaryButton
          icon={<Map size={21} />}
          label={t('ui.nav.regions')}
          active={openPanel === undefined && cameraPreset === 'overview'}
          onClick={showRegions}
        />
        <PrimaryButton
          icon={<BarChart3 size={21} />}
          img="btn_statistics"
          label={t('ui.quick.stats')}
          active={openPanel === 'economy'}
          onClick={() => setPanel('economy')}
        />
        <PrimaryButton
          icon={<Crown size={21} />}
          img="btn_mayor"
          label={t('ui.nav.mayor')}
          active={openPanel === 'mayor'}
          onClick={() => setPanel('mayor')}
        />
      </nav>

      <div className="quick-actions">
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
        <QuickButton icon={<EyeOff size={18} />} label={t('ui.quick.hide')} onClick={toggleUiHidden} />
      </div>
    </div>
  );
}

function PrimaryButton({
  icon,
  img,
  label,
  active = false,
  featured = false,
  onClick,
}: {
  icon: React.ReactNode;
  img?: string;
  label: string;
  active?: boolean;
  featured?: boolean;
  onClick(): void;
}) {
  const src = img ? buttonImage(img) : undefined;
  return (
    <button
      className={`primary-nav-btn${active ? ' active' : ''}${featured ? ' featured' : ''}`}
      onClick={onClick}
      title={label}
    >
      <span className="primary-nav-icon">
        {src ? <img src={src} width={38} height={38} alt="" aria-hidden="true" /> : icon}
      </span>
      <span>{label}</span>
    </button>
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
