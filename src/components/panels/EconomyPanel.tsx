import { Briefcase, Building2, Factory, TrendingUp, Wallet, X } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { formatMoney, t } from '../../i18n/index.ts';

// Dedicated economy view (§11): where the money comes from, split by sector,
// with the employment factor that scales commercial/industrial revenue. Reads
// the single computeIncome source of truth via the controller — no numbers are
// re-derived in the UI.
export function EconomyPanel() {
  const game = useGame();
  const setPanel = useUiStore((s) => s.setPanel);
  const income = game.getIncome();
  const max = Math.max(income.residential, income.commercial, income.industrial, 1);

  const rows = [
    { key: 'residential', icon: <Building2 size={15} />, value: income.residential },
    { key: 'commercial', icon: <TrendingUp size={15} />, value: income.commercial },
    { key: 'industrial', icon: <Factory size={15} />, value: income.industrial },
  ] as const;

  return (
    <aside className="panel side-panel economy-panel">
      <div className="panel-head">
        <h3>
          <Wallet size={17} /> {t('ui.economy.title')}
        </h3>
        <button className="btn-icon" onClick={() => setPanel(undefined)} title={t('ui.close')}>
          <X size={16} />
        </button>
      </div>

      <div className="economy-total">
        <span className="economy-total-label">{t('ui.finance.total')}</span>
        <span className="economy-total-value">{t('ui.finance.per_min', { amount: formatMoney(income.total) })}</span>
      </div>

      <div className="economy-rows">
        {rows.map((row) => (
          <div key={row.key} className="economy-row">
            <div className="economy-row-head">
              <span className="economy-row-name">
                {row.icon}
                {t(`ui.finance.${row.key}`)}
              </span>
              <span className="economy-row-value">+{formatMoney(row.value)}</span>
            </div>
            <div className="economy-bar">
              <div className={`economy-bar-fill economy-${row.key}`} style={{ width: `${(row.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="economy-employment">
        <Briefcase size={15} />
        <span>{t('ui.finance.employment', { pct: Math.round(income.employment * 100) })}</span>
      </div>
      <p className="muted economy-note">{t('ui.economy.note')}</p>
    </aside>
  );
}
