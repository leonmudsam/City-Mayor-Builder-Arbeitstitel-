import { Bug, CheckCheck, Coins, Hammer, PackageOpen, X } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { t } from '../../i18n/index.ts';

// Prototype cheats (§10): a clearly-labelled debug area for balancing tests,
// gated behind the debugTools feature flag. Every action routes through a
// controller command (which re-checks the flag and logs a reason), so nothing
// here bypasses the normal state flow — it just skips the wait/cost.
export function DebugPanel() {
  const game = useGame();
  const { setPanel, pushToast } = useUiStore();

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
    </aside>
  );
}
