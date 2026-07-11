import { Crown, MessageCircleWarning, MessageSquareHeart, Info, Wallet } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { formatDuration, formatMoney, t } from '../../i18n/index.ts';

export function MayorPanel() {
  const game = useGame();
  const pushToast = useUiStore((s) => s.pushToast);
  const { state } = game;
  const now = state.meta.lastSimTime;
  const hasHouse = state.mayor.houseLevel >= 1;
  const income = game.getIncome();

  return (
    <aside className="panel side-panel mayor-panel">
      <div className="panel-head">
        <h3>
          <Crown size={17} /> {t('ui.mayor')}
        </h3>
      </div>

      <div className="finance-box">
        <div className="finance-head">
          <Wallet size={15} />
          <span>{t('ui.finance.title')}</span>
          <span className="finance-total">{t('ui.finance.per_min', { amount: formatMoney(income.net) })}</span>
        </div>
        <FinanceRow label={t('ui.finance.residential')} value={income.residential} />
        <FinanceRow label={t('ui.finance.commercial')} value={income.commercial} />
        <FinanceRow label={t('ui.finance.industrial')} value={income.industrial} />
        <FinanceRow label={t('ui.finance.upkeep')} value={-income.upkeep} />
        <div className="finance-foot muted">{t('ui.finance.employment', { pct: Math.round(income.employment * 100) })}</div>
      </div>

      {!hasHouse && <p className="muted">{t('ui.mayor.locked')}</p>}

      <div className="mayor-actions">
        {game.config.mayorActions.map((action) => {
          const locked = action.unlockLevel > state.level.current || !hasHouse;
          const readyAt = state.mayor.actionCooldowns[action.id] ?? 0;
          const cooling = now < readyAt;
          return (
            <button
              key={action.id}
              className="mayor-action"
              disabled={locked || cooling}
              title={t(action.descriptionKey)}
              onClick={() => {
                const result = game.performMayorAction(action.id);
                if (result.ok) pushToast(t(`message.mayor.${action.id}`), 'success');
                else pushToast(t(`error.${result.error}`), 'error');
              }}
            >
              <span className="mayor-action-name">{t(action.nameKey)}</span>
              <span className="mayor-action-desc">
                {locked
                  ? t('ui.locked_at', { level: action.unlockLevel })
                  : cooling
                    ? t('ui.cooldown', { time: formatDuration(readyAt - now) })
                    : t(action.descriptionKey)}
              </span>
            </button>
          );
        })}
      </div>

      {state.buffs.length > 0 && (
        <div className="buff-list">
          <h4>{t('ui.buffs.active')}</h4>
          {state.buffs.map((buff) => (
            <div key={buff.id} className="buff">
              {buff.kind === 'happiness' ? `+${buff.amount} ${t('ui.happiness')}` : `×${buff.amount} ${t('resource.money')}`}
              <span className="muted"> · {formatDuration(buff.endsAt - now)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="message-feed message-feed-mayor">
        {state.mayor.messages.length === 0 && <p className="muted">{t('ui.no_messages')}</p>}
        {state.mayor.messages.slice(0, 12).map((msg) => (
          <div key={msg.id} className={`message message-${msg.kind}`}>
            {msg.kind === 'complaint' ? <MessageCircleWarning size={14} /> : msg.kind === 'praise' ? <MessageSquareHeart size={14} /> : <Info size={14} />}
            <span>{t(msg.textKey, msg.params)}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function FinanceRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="finance-row">
      <span>{label}</span>
      <span className="finance-value">{t('ui.finance.per_min', { amount: formatMoney(value) })}</span>
    </div>
  );
}
