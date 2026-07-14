import { ArrowDownToLine, ArrowUpFromLine, Store, X } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { RESOURCE_ICON } from '../common/icons.tsx';
import { formatMoney, t } from '../../i18n/index.ts';
import type { ResourceId } from '../../game/types.ts';

// Handelskontor UI (§7): sell surplus for money, buy at a markup to bridge a
// shortage. All pricing/validation lives in the controller (getTradeQuote /
// sellResource / buyResource) — this panel only reads quotes and sends commands.
const TRADABLE: ResourceId[] = ['wood', 'stone', 'food', 'freshwater'];
const BUY_PACK = 50;

export function TradePanel() {
  const game = useGame();
  const { setPanel, pushToast } = useUiStore();

  // The panel is only reachable while a trading post exists; guard anyway.
  if (!game.hasTradePost()) {
    return (
      <aside className="panel side-panel">
        <div className="panel-head">
          <h3>
            <Store size={17} /> {t('ui.trade.title')}
          </h3>
          <button className="btn-icon" onClick={() => setPanel(undefined)} title={t('ui.close')}>
            <X size={16} />
          </button>
        </div>
        <p className="muted">{t('ui.trade.needs_post')}</p>
      </aside>
    );
  }

  return (
    <aside className="panel side-panel trade-panel">
      <div className="panel-head">
        <h3>
          <Store size={17} /> {t('ui.trade.title')}
        </h3>
        <button className="btn-icon" onClick={() => setPanel(undefined)} title={t('ui.close')}>
          <X size={16} />
        </button>
      </div>

      <div className="trade-rows">
        {TRADABLE.map((res) => {
          const Icon = RESOURCE_ICON[res];
          const have = Math.floor(game.state.resources[res]);
          const cap = game.derived.storageCaps[res] ?? 0;
          const quote = game.getTradeQuote(res);
          if (quote.sell <= 0 && quote.buy <= 0) return null;
          const room = Math.max(0, Math.floor(cap - game.state.resources[res]));
          const sell = (amount: number) => {
            const r = game.sellResource(res, amount);
            if (r.ok) pushToast(t('ui.trade.sold', { amount, resource: t(`resource.${res}`) }), 'success');
            else pushToast(t(`error.${r.error}`), 'error');
          };
          const buy = () => {
            const r = game.buyResource(res, Math.min(BUY_PACK, room));
            if (r.ok) pushToast(t('ui.trade.bought', { amount: Math.min(BUY_PACK, room), resource: t(`resource.${res}`) }), 'success');
            else pushToast(t(`error.${r.error}`), 'error');
          };
          return (
            <div key={res} className="trade-row">
              <div className="trade-row-head">
                <span className="trade-row-name">
                  <Icon size={16} /> {t(`resource.${res}`)}
                </span>
                <span className="trade-row-have">
                  {have}
                  {cap !== Number.POSITIVE_INFINITY && cap > 0 && <span className="muted"> / {cap}</span>}
                </span>
              </div>
              <div className="trade-row-prices">
                <span className="trade-price sell" title={t('ui.trade.sell_price')}>
                  <ArrowUpFromLine size={13} /> {formatMoney(quote.sell)}
                </span>
                <span className="trade-price buy" title={t('ui.trade.buy_price')}>
                  <ArrowDownToLine size={13} /> {formatMoney(quote.buy)}
                </span>
              </div>
              <div className="trade-row-actions">
                <button className="btn-secondary trade-btn" disabled={have <= 0} onClick={() => sell(Math.ceil(have / 2))}>
                  {t('ui.trade.sell_half')}
                </button>
                <button className="btn-secondary trade-btn" disabled={have <= 0} onClick={() => sell(have)}>
                  {t('ui.trade.sell_all')}
                </button>
                <button
                  className="btn-secondary trade-btn"
                  disabled={room <= 0 || game.state.resources.money < Math.min(BUY_PACK, room) * quote.buy}
                  onClick={buy}
                >
                  {t('ui.trade.buy_pack', { amount: BUY_PACK })}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="muted economy-note">{t('ui.trade.note')}</p>
    </aside>
  );
}
