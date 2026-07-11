import { useGame, useUiStore } from '../../state/store.ts';
import type { ResourceId } from '../../game/types.ts';
import { ResourceIcon } from '../common/icons.tsx';
import { formatMoney, t } from '../../i18n/index.ts';

// The detail card behind a resource badge (§2, §12): where a resource stands
// (stock vs. capacity), how fast it changes, and a one-line explanation of what
// feeds it — so the HUD teaches, not just displays. Money links to the economy
// breakdown; materials show production/min and fill state.

function fmt(n: number): string {
  return Math.floor(n).toLocaleString('de-DE');
}

export function ResourceDetailPopover({ id }: { id: ResourceId }) {
  const game = useGame();
  const setPanel = useUiStore((s) => s.setPanel);
  const stock = game.state.resources[id];
  const cap = game.derived.storageCaps[id];
  const perMin = game.derived.productionPerMin[id];

  if (id === 'money') {
    const income = game.getIncome();
    return (
      <div className="res-detail">
        <div className="res-detail-head">
          <ResourceIcon id="money" size={16} />
          <span>{t('resource.money')}</span>
          <span className="res-detail-stock">{formatMoney(stock)}</span>
        </div>
        <div className="res-detail-rows">
          <DetailRow label={t('ui.finance.residential')} value={`+${formatMoney(income.residential)}`} />
          <DetailRow label={t('ui.finance.commercial')} value={`+${formatMoney(income.commercial)}`} />
          <DetailRow label={t('ui.finance.industrial')} value={`+${formatMoney(income.industrial)}`} />
          <DetailRow label={t('ui.finance.total')} value={`+${formatMoney(income.total)}`} strong />
        </div>
        <p className="res-detail-note">{t('ui.resource.note.money')}</p>
        <button className="btn-link res-detail-link" onClick={() => setPanel('economy')}>
          {t('ui.economy.open')}
        </button>
      </div>
    );
  }

  const full = cap > 0 && stock >= cap;
  const fillPct = cap > 0 ? Math.min(100, Math.round((stock / cap) * 100)) : 0;
  return (
    <div className="res-detail">
      <div className="res-detail-head">
        <ResourceIcon id={id} size={16} />
        <span>{t(`resource.${id}`)}</span>
        <span className="res-detail-stock">
          {fmt(stock)}
          {cap > 0 && <span className="muted"> / {fmt(cap)}</span>}
        </span>
      </div>
      {cap > 0 && (
        <div className="res-detail-bar">
          <div className={`res-detail-bar-fill${full ? ' full' : ''}`} style={{ width: `${fillPct}%` }} />
        </div>
      )}
      <div className="res-detail-rows">
        <DetailRow label={t('ui.production')} value={perMin > 0 ? `+${perMin % 1 === 0 ? perMin : perMin.toFixed(1)} /min` : '—'} />
        {cap > 0 && <DetailRow label={t('ui.storage')} value={fmt(cap)} />}
      </div>
      <p className="res-detail-note">{full ? t('ui.storage.full') : t(`ui.resource.note.${id}`)}</p>
    </div>
  );
}

function DetailRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`res-detail-row${strong ? ' strong' : ''}`}>
      <span>{label}</span>
      <span className="res-detail-value">{value}</span>
    </div>
  );
}
