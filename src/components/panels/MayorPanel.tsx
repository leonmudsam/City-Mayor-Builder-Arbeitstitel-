import { Crown, MessageCircleWarning, MessageSquareHeart, Info } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { formatDuration, t } from '../../i18n/index.ts';

export function MayorPanel() {
  const game = useGame();
  const pushToast = useUiStore((s) => s.pushToast);
  const { state } = game;
  const now = state.meta.lastSimTime;
  const hasHouse = state.mayor.houseLevel >= 1;

  return (
    <aside className="panel side-panel mayor-panel">
      <div className="panel-head">
        <h3>
          <Crown size={17} /> {t('ui.mayor')}
        </h3>
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

      <div className="message-feed">
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
