import { AlertTriangle, Briefcase, Building2, Factory, PackageOpen, SlidersHorizontal, TrendingDown, TrendingUp, Wallet, X } from 'lucide-react';
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

  // Tax sliders unlock once the commercial economy exists (§ tax sliders, MVP 2).
  const bal = game.config.balancing;
  const { taxRateMin, taxRateMax } = bal;
  const showTax = game.state.level.current >= 6;
  const taxSliders = [
    { kind: 'residential' as const, rate: game.state.policy.residentialTaxRate, happPer: bal.residentialTaxHappinessPer },
    { kind: 'commercial' as const, rate: game.state.policy.commercialTaxRate, happPer: bal.commercialTaxHappinessPer },
  ];
  // Warn as the rate climbs into punishing territory (§9): amber ≥ 150 %, red ≥ 250 %.
  const taxTone = (rate: number) => (rate >= 2.5 ? 'danger' : rate >= 1.5 ? 'warn' : '');
  const overflow = game.getOverflowExport();

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

      <div className={`economy-total${income.net < 0 ? ' negative' : ''}`}>
        <span className="economy-total-label">{t('ui.finance.net')}</span>
        <span className="economy-total-value">{t('ui.finance.per_min', { amount: formatMoney(income.net) })}</span>
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

      <div className="economy-ledger">
        <div className="economy-ledger-row">
          <span>{t('ui.finance.total')}</span>
          <span className="text-good">+{formatMoney(income.total)}</span>
        </div>
        <div className="economy-ledger-row">
          <span>
            <TrendingDown size={13} /> {t('ui.finance.upkeep')}
          </span>
          <span className="text-bad">−{formatMoney(income.upkeep)}</span>
        </div>
      </div>

      <div className="economy-employment">
        <Briefcase size={15} />
        <span>{t('ui.finance.employment', { pct: Math.round(income.employment * 100) })}</span>
      </div>

      {overflow.active && (
        // Active overflow export (§6): only shows while a full store is spilling
        // into money — and only for a live, foreground session.
        <div className="economy-overflow">
          <PackageOpen size={15} />
          <span>{t('ui.finance.overflow', { amount: formatMoney(overflow.perMin) })}</span>
        </div>
      )}

      {showTax && (
        <div className="economy-tax">
          <div className="economy-tax-head">
            <SlidersHorizontal size={15} /> {t('ui.tax.title')}
          </div>
          {taxSliders.map(({ kind, rate, happPer }) => {
            const tone = taxTone(rate);
            const penalty = Math.round((rate - 1) * happPer);
            return (
              <div key={kind} className={`economy-tax-row${tone ? ` tax-${tone}` : ''}`}>
                <div className="economy-tax-label">
                  <span>{t(`ui.tax.${kind}`)}</span>
                  <span className="economy-tax-value">{Math.round(rate * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={Math.round(taxRateMin * 100)}
                  max={Math.round(taxRateMax * 100)}
                  step={5}
                  value={Math.round(rate * 100)}
                  onChange={(e) => game.setTaxRate(kind, Number(e.target.value) / 100)}
                  aria-label={t(`ui.tax.${kind}`)}
                />
                {/* Effect preview (§9): the happiness cost/benefit of this rate. */}
                <div className="economy-tax-effect">
                  {penalty > 0 ? (
                    <span className={`text-${tone === 'danger' ? 'bad' : 'warn'}`}>
                      {tone === 'danger' && <AlertTriangle size={12} />} {t('ui.tax.happiness_cost', { pts: penalty })}
                    </span>
                  ) : penalty < 0 ? (
                    <span className="text-good">{t('ui.tax.happiness_gain', { pts: -penalty })}</span>
                  ) : (
                    <span className="muted">{t('ui.tax.neutral')}</span>
                  )}
                </div>
              </div>
            );
          })}
          <p className="muted economy-tax-note">{t('ui.tax.note')}</p>
        </div>
      )}

      <p className="muted economy-note">{t('ui.economy.note')}</p>
    </aside>
  );
}
