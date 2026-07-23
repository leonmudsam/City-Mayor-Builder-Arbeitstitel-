import {
  CircleOff,
  Factory,
  HeartPulse,
  Layers3,
  ShieldAlert,
  Sparkles,
  Network,
  type LucideIcon,
} from 'lucide-react';
import type { InfoLayerMode, InfrastructureLayerMode } from '../../renderer/IMapRenderer.ts';
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

const INFRASTRUCTURE_MODES: { id: InfrastructureLayerMode; key: string }[] = [
  { id: 'off', key: 'ui.infrastructure.off' },
  { id: 'all', key: 'ui.infrastructure.all' },
  { id: 'roads', key: 'ui.infrastructure.roads' },
  { id: 'waterways', key: 'ui.infrastructure.waterways' },
  { id: 'harbors', key: 'ui.infrastructure.harbors' },
  { id: 'trade', key: 'ui.infrastructure.trade' },
  { id: 'supply', key: 'ui.infrastructure.supply' },
  { id: 'problems', key: 'ui.infrastructure.problems' },
];

/**
 * Presentation-only filter for world-space building bubbles. The renderer reads
 * existing diagnostics/effects; no demand, production or reward logic lives here.
 */
export function InfoLayerControl() {
  const mode = useUiStore((state) => state.infoLayerMode);
  const setMode = useUiStore((state) => state.setInfoLayerMode);
  const infrastructureMode = useUiStore((state) => state.infrastructureLayerMode);
  const setInfrastructureMode = useUiStore((state) => state.setInfrastructureLayerMode);

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
      <label className="infrastructure-layer-select">
        <Network size={16} />
        <span>{t('ui.infrastructure.title')}</span>
        <select
          value={infrastructureMode}
          onChange={(event) => setInfrastructureMode(event.target.value as InfrastructureLayerMode)}
        >
          {INFRASTRUCTURE_MODES.map((entry) => (
            <option key={entry.id} value={entry.id}>{t(entry.key)}</option>
          ))}
        </select>
      </label>
    </nav>
  );
}
