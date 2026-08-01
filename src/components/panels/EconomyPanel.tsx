import {
  AlertTriangle,
  Briefcase,
  Building2,
  Factory,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { formatMoney, t } from '../../i18n/index.ts';
import { useEscapeClose } from '../common/useEscapeClose.ts';

/**
 * Eine Wirtschaftsseite, eine Wahrheit: oben nur Einnahmen, Kosten und Netto,
 * darunter genau die stärkste Einnahmequelle. Steuerdetails bleiben vollständig
 * bedienbar, liegen aber hinter einer bewussten Vertiefung statt neben dem
 * Kernentscheid zu konkurrieren.
 */
export function EconomyPanel() {
  const game = useGame();
  const setPanel = useUiStore((s) => s.setPanel);
  const income = game.getIncome();
  useEscapeClose(() => setPanel(undefined));
  const sources = [
    { key: 'residential', icon: <Building2 size={15} />, value: income.residential },
    { key: 'commercial', icon: <TrendingUp size={15} />, value: income.commercial },
    { key: 'industrial', icon: <Factory size={15} />, value: income.industrial },
  ] as const;
  const strongest = sources.reduce((best, current) => current.value > best.value ? current : best);

  const bal = game.config.balancing;
  const showTax = game.state.level.current >= 6;
  const taxSliders = [
    {
      kind: 'residential' as const,
      rate: game.state.policy.residentialTaxRate,
      happinessPer: bal.residentialTaxHappinessPer,
    },
    {
      kind: 'commercial' as const,
      rate: game.state.policy.commercialTaxRate,
      happinessPer: bal.commercialTaxHappinessPer,
    },
  ];
  const taxTone = (rate: number) => (rate >= 2.5 ? 'danger' : rate >= 1.5 ? 'warn' : '');

  return (
    <aside className="panel side-panel economy-panel economy-panel-simple">
      <div className="panel-head">
        <h3>
          <Wallet size={17} /> {t('ui.economy.title')}
        </h3>
        <button className="btn-icon" onClick={() => setPanel(undefined)} title={t('ui.close')}>
          <X size={16} />
        </button>
      </div>

      <section className="economy-hero" aria-label={t('ui.finance.title')}>
        <div>
          <span>{t('ui.finance.total')}</span>
          <strong className="text-good">+{formatMoney(income.total)}</strong>
          <small>{t('ui.economy.per_minute')}</small>
        </div>
        <div>
          <span>{t('ui.finance.upkeep')}</span>
          <strong className="text-bad">−{formatMoney(income.upkeep)}</strong>
          <small>{t('ui.economy.running_costs')}</small>
        </div>
        <div className={income.net < 0 ? 'negative' : 'positive'}>
          <span>{t('ui.finance.net')}</span>
          <strong>{income.net >= 0 ? '+' : '−'}{formatMoney(Math.abs(income.net))}</strong>
          <small>{t('ui.economy.available_each_minute')}</small>
        </div>
      </section>

      <section className="economy-focus-card">
        <span className="economy-focus-icon">{strongest.icon}</span>
        <div>
          <small>{t('ui.economy.strongest_source')}</small>
          <strong>{t(`ui.finance.${strongest.key}`)}</strong>
          <span>+{formatMoney(strongest.value)}/min</span>
        </div>
        <div>
          <TrendingDown size={15} />
          <small>{t('ui.economy.cost_block')}</small>
          <strong>{t('ui.finance.upkeep')}</strong>
          <span>−{formatMoney(income.upkeep)}/min</span>
        </div>
      </section>

      <details className="economy-details">
        <summary>{t('ui.economy.show_breakdown')}</summary>
        <div className="economy-rows">
          {sources.map((source) => (
            <div key={source.key} className="economy-row">
              <span className="economy-row-name">
                {source.icon}
                {t(`ui.finance.${source.key}`)}
              </span>
              <strong>+{formatMoney(source.value)}/min</strong>
            </div>
          ))}
        </div>
        <div className="economy-employment">
          <Briefcase size={15} />
          <span>{t('ui.finance.employment', { pct: Math.round(income.employment * 100) })}</span>
        </div>
        <p className="muted economy-note">{t('ui.economy.note')}</p>
      </details>

      {showTax && (
        <details className="economy-details economy-tax-details">
          <summary>
            <SlidersHorizontal size={15} /> {t('ui.tax.title')}
          </summary>
          <div className="economy-tax">
            {taxSliders.map(({ kind, rate, happinessPer }) => {
              const tone = taxTone(rate);
              const penalty = Math.round((rate - 1) * happinessPer);
              return (
                <div key={kind} className={`economy-tax-row${tone ? ` tax-${tone}` : ''}`}>
                  <div className="economy-tax-label">
                    <span>{t(`ui.tax.${kind}`)}</span>
                    <span className="economy-tax-value">{Math.round(rate * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={Math.round(bal.taxRateMin * 100)}
                    max={Math.round(bal.taxRateMax * 100)}
                    step={5}
                    value={Math.round(rate * 100)}
                    onChange={(event) => game.setTaxRate(kind, Number(event.target.value) / 100)}
                    aria-label={t(`ui.tax.${kind}`)}
                  />
                  <div className="economy-tax-effect">
                    {penalty > 0 ? (
                      <span className={`text-${tone === 'danger' ? 'bad' : 'warn'}`}>
                        {tone === 'danger' && <AlertTriangle size={12} />}
                        {t('ui.tax.happiness_cost', { pts: penalty })}
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
          </div>
        </details>
      )}
    </aside>
  );
}
