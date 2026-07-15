import { Bug, CheckCheck, Coins, Hammer, PackageOpen, X } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import type { RenderMode } from '../../renderer/projection.ts';
import { t } from '../../i18n/index.ts';

const RENDER_MODES: { id: RenderMode; label: string }[] = [
  { id: 'true3d', label: '3D' },
  { id: 'isometric2d', label: 'Iso' },
  { id: 'flat2d', label: '2D' },
];

// Prototype cheats (§10): a clearly-labelled debug area for balancing tests,
// gated behind the debugTools feature flag. Every action routes through a
// controller command (which re-checks the flag and logs a reason), so nothing
// here bypasses the normal state flow — it just skips the wait/cost.
export function DebugPanel() {
  const game = useGame();
  const { setPanel, pushToast } = useUiStore();
  const renderMode = useUiStore((s) => s.renderMode);
  const setRenderMode = useUiStore((s) => s.setRenderMode);

  if (!game.config.features.debugTools) return null;

  const done = (label: string) => pushToast(label, 'success');

  return (
    <aside className="panel side-panel debug-panel">
      <div className="panel-head">
        <h3>
          <Bug size={17} /> {t('ui.debug.title')}
        </h3>
        <button className="btn-icon" onClick={() => setPanel(undefined)} title={t('ui.close')}>
          <X size={16} />
        </button>
      </div>

      <p className="debug-banner">{t('ui.debug.banner')}</p>

      <button
        className="btn-secondary"
        onClick={() => {
          game.debugGrantMoney(100_000);
          done(t('ui.debug.money_done', { amount: '100.000' }));
        }}
      >
        <Coins size={16} /> {t('ui.debug.money_100k')}
      </button>
      <button
        className="btn-secondary"
        onClick={() => {
          game.debugGrantMoney(1_000_000);
          done(t('ui.debug.money_done', { amount: '1.000.000' }));
        }}
      >
        <Coins size={16} /> {t('ui.debug.money_1m')}
      </button>
      <button
        className="btn-secondary"
        onClick={() => {
          game.debugFillResources();
          done(t('ui.debug.resources_done'));
        }}
      >
        <PackageOpen size={16} /> {t('ui.debug.fill_resources')}
      </button>
      <button
        className="btn-secondary"
        onClick={() => {
          game.debugFinishConstruction('build');
          done(t('ui.debug.builds_done'));
        }}
      >
        <Hammer size={16} /> {t('ui.debug.finish_builds')}
      </button>
      <button
        className="btn-secondary"
        onClick={() => {
          game.debugFinishConstruction('upgrade');
          done(t('ui.debug.upgrades_done'));
        }}
      >
        <CheckCheck size={16} /> {t('ui.debug.finish_upgrades')}
      </button>

      {/* Render-engine fallback (v0.30): 3D is the normal mode; 2D/iso survive
          only here for debugging the legacy Pixi renderer. */}
      <span className="settings-group-label">{t('ui.debug.renderEngine')}</span>
      <div className="settings-segmented">
        {RENDER_MODES.map((m) => (
          <button
            key={m.id}
            className={`settings-seg${renderMode === m.id ? ' active' : ''}`}
            onClick={() => setRenderMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
