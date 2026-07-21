import {
  CircleOff,
  Factory,
  HeartPulse,
  Layers3,
  ShieldAlert,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { InfoLayerMode } from '../../renderer/IMapRenderer.ts';
import { useUiStore } from '../../state/store.ts';
import { t } from '../../i18n/index.ts';

const MODES: { id: InfoLayerMode; icon: LucideIcon; key: string }[] = [
  { id: 'off', icon: CircleOff, key: 'ui.info_layer.off' },
  { id: 'problems', icon: ShieldAlert, key: 'ui.info_layer.problems' },
  { id: 'needs', icon: HeartPulse, key: 'ui.info_layer.needs' },
  { id: 'upgrades', icon: Sparkles, key: 'ui.info_layer.upgrades' },
  { id: 'production', icon: Factory, key: 'ui.info_layer.production' },
  { id: 'all', icon: Layers3, key: 'ui.info_layer.all' },
];

/**
 * Presentation-only filter for world-space building bubbles. The renderer reads
 * existing diagnostics/effects; no demand, production or reward logic lives here.
 */
export function InfoLayerControl() {
  const mode = useUiStore((state) => state.infoLayerMode);
  const setMode = useUiStore((state) => state.setInfoLayerMode);

  return (
    <nav className="info-layer-control" aria-label={t('ui.info_layer.title')}>
      <span className="info-layer-title">
        <Layers3 size={15} />
        {t('ui.info_layer.title')}
      </span>
      <div className="info-layer-modes">
        {MODES.map(({ id, icon: Icon, key }) => (
          <button
            key={id}
            className={mode === id ? 'active' : ''}
            onClick={() => setMode(id)}
            title={t(key)}
            aria-pressed={mode === id}
          >
            <Icon size={16} />
            <span>{t(key)}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
