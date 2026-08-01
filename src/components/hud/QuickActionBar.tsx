import { useState } from 'react';
import {
  BriefcaseBusiness,
  Crown,
  Hammer,
  Home,
  Landmark,
  Map,
  MoreHorizontal,
  Store,
  Waves,
  X,
} from 'lucide-react';
import { getMapApi, useGame, useUiStore } from '../../state/store.ts';
import { t } from '../../i18n/index.ts';

/**
 * Active-Simplicity-Navigation: Sechs klare Hauptziele bleiben dauerhaft
 * sichtbar. Seltenere Werkzeuge (Handel und Infrastruktur) liegen gesammelt in
 * einem kleinen Zusatzmenü. Dadurch konkurrieren keine technischen Utilities
 * mehr mit dem primären Spielfluss.
 */
export function QuickActionBar() {
  const game = useGame();
  const [moreOpen, setMoreOpen] = useState(false);
  const { openPanel, cameraPreset, setPanel, setCameraPreset, infrastructureNetworkOpen, openInfrastructureNetwork } =
    useUiStore();
  const hasTrade = game.hasTradePost();
  const hasActivities = game.getActivityDefs().length > 0;

  const showCity = () => {
    getMapApi()?.centerOnCity();
    setCameraPreset('city');
    setPanel(undefined);
    setMoreOpen(false);
  };
  const showRegions = () => {
    setCameraPreset('overview');
    setPanel(undefined);
    setMoreOpen(false);
  };
  const openPrimaryPanel = (panel: 'build' | 'activities' | 'economy' | 'mayor') => {
    setMoreOpen(false);
    setPanel(panel);
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
          label={t('ui.build')}
          active={openPanel === 'build'}
          featured
          onClick={() => openPrimaryPanel('build')}
        />
        <PrimaryButton
          icon={<Landmark size={21} />}
          label={t('ui.economy.title')}
          active={openPanel === 'economy'}
          onClick={() => openPrimaryPanel('economy')}
        />
        {hasActivities && (
          <PrimaryButton
            icon={<BriefcaseBusiness size={21} />}
            label={t('ui.activities.short')}
            active={openPanel === 'activities'}
            onClick={() => openPrimaryPanel('activities')}
          />
        )}
        <PrimaryButton
          icon={<Crown size={21} />}
          label={t('ui.nav.mayor')}
          active={openPanel === 'mayor'}
          onClick={() => openPrimaryPanel('mayor')}
        />
        <PrimaryButton
          icon={<Map size={21} />}
          label={t('ui.nav.regions')}
          active={openPanel === undefined && cameraPreset === 'overview'}
          onClick={showRegions}
        />
      </nav>

      <div
        className={`quick-actions nav-overflow${moreOpen ? ' is-open' : ''}`}
        onBlur={(event) => {
          if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
          setMoreOpen(false);
        }}
      >
        <QuickButton
          icon={moreOpen ? <X size={18} /> : <MoreHorizontal size={19} />}
          label="Mehr"
          active={moreOpen || openPanel === 'trade' || infrastructureNetworkOpen}
          expanded={moreOpen}
          controls="nav-more-menu"
          onClick={() => setMoreOpen((open) => !open)}
        />
        {moreOpen && (
          <div id="nav-more-menu" className="nav-more-menu" role="menu" aria-label="Weitere Bereiche">
            <button
              className={openPanel === 'trade' ? 'active' : ''}
              disabled={!hasTrade}
              onClick={() => {
                setMoreOpen(false);
                setPanel('trade');
              }}
              role="menuitem"
            >
              <Store size={17} />
              <span>
                <strong>{t('ui.trade.title')}</strong>
                <small>{hasTrade ? 'Rohstoffe kaufen und verkaufen' : 'Handelskontor benötigt'}</small>
              </span>
            </button>
            <button
              className={infrastructureNetworkOpen ? 'active' : ''}
              onClick={() => {
                setMoreOpen(false);
                openInfrastructureNetwork();
              }}
              role="menuitem"
            >
              <Waves size={17} />
              <span>
                <strong>{t('ui.nav.infrastructure')}</strong>
                <small>Netze und Verbindungen prüfen</small>
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PrimaryButton({
  icon,
  label,
  active = false,
  featured = false,
  disabled = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  featured?: boolean;
  disabled?: boolean;
  onClick(): void;
}) {
  return (
    <button
      className={`primary-nav-btn${active ? ' active' : ''}${featured ? ' featured' : ''}`}
      onClick={onClick}
      title={label}
      disabled={disabled}
    >
      <span className="primary-nav-icon">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function QuickButton({
  icon,
  label,
  active = false,
  expanded,
  controls,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  expanded?: boolean;
  controls?: string;
  onClick(): void;
}) {
  return (
    <button
      className={`quick-btn${active ? ' active' : ''}`}
      onClick={onClick}
      title={label}
      aria-expanded={expanded}
      aria-controls={controls}
    >
      <span className="quick-btn-icon">{icon}</span>
      <span className="quick-btn-label">{label}</span>
    </button>
  );
}
