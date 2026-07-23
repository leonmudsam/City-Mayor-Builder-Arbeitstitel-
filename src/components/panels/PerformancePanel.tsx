import { useSyncExternalStore } from 'react';
import { Gauge, MonitorCog } from 'lucide-react';
import {
  getGraphicsSettings,
  setGraphicsQuality,
  subscribeGraphicsSettings,
  type GraphicsSettings,
} from '../../renderer/three/graphicsSettings.ts';
import { GRAPHICS_QUALITY_LEVELS, type GraphicsQualityLevel } from '../../renderer/three/graphicsQuality.ts';
import { getPerfStats, subscribePerfStats, type PerfStats } from '../../renderer/three/perfStats.ts';
import { t } from '../../i18n/index.ts';

/** Live-Sicht auf den framework-agnostischen Grafik-Store. */
function useGraphicsSettings(): GraphicsSettings {
  return useSyncExternalStore(subscribeGraphicsSettings, getGraphicsSettings, getGraphicsSettings);
}

/** Live-Sicht auf die Renderer-Performance-Telemetrie (§ Säule B). */
function usePerfStats(): PerfStats {
  return useSyncExternalStore(subscribePerfStats, getPerfStats, getPerfStats);
}

/**
 * Grafik-Qualitätsauswahl (§ Säule B): vier Stufen (Niedrig/Mittel/Hoch/Ultra).
 * Schreibt in den persistierten Grafik-Store; der Renderer baut die Vegetation
 * live mit neuen Budgets/Schatten neu auf. Spieler-tauglich (auch außerhalb Dev).
 */
export function GraphicsQualityControl() {
  const { quality } = useGraphicsSettings();
  return (
    <section className="graphics-quality">
      <p className="settings-group-head">
        <MonitorCog size={15} /> {t('ui.graphics.title')}
      </p>
      <p className="muted settings-hint">{t('ui.graphics.desc')}</p>
      <div className="graphics-quality-row" role="radiogroup" aria-label={t('ui.graphics.title')}>
        {GRAPHICS_QUALITY_LEVELS.map((level: GraphicsQualityLevel) => (
          <button
            key={level}
            role="radio"
            aria-checked={quality === level}
            className={`graphics-quality-btn${quality === level ? ' is-active' : ''}`}
            onClick={() => setGraphicsQuality(level)}
          >
            {t(`ui.graphics.quality.${level}`)}
          </button>
        ))}
      </div>
    </section>
  );
}

/**
 * Dev-Performance-Anzeige (§ Säule B): FPS, Draw-Calls, Dreiecke, Vegetations-
 * Instanzen und aktive Stufe — damit Optimierungen an MESSWERTEN statt an einem
 * subjektiven Eindruck festgemacht werden. Reine Anzeige, keine Save-/Sim-Wirkung.
 */
export function PerfReadout() {
  const stats = usePerfStats();
  return (
    <section className="perf-readout">
      <p className="settings-group-head">
        <Gauge size={15} /> {t('ui.perf.title')}
      </p>
      <ul className="perf-readout-list">
        <li><span>{t('ui.perf.fps')}</span><strong>{stats.fps}</strong></li>
        <li><span>{t('ui.perf.draws')}</span><strong>{stats.drawCalls}</strong></li>
        <li><span>{t('ui.perf.tris')}</span><strong>{stats.triangles.toLocaleString('de-DE')}</strong></li>
        <li><span>{t('ui.perf.veg')}</span><strong>{stats.vegInstances.toLocaleString('de-DE')}</strong></li>
        <li><span>{t('ui.perf.veg_groups')}</span><strong>{stats.vegGroups}</strong></li>
        <li><span>{t('ui.perf.quality')}</span><strong>{t(`ui.graphics.quality.${stats.quality}`)}</strong></li>
      </ul>
    </section>
  );
}
