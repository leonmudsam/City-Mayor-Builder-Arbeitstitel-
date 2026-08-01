import {
  Activity,
  Crown,
  Hammer,
  Info,
  Landmark,
  MessageCircleWarning,
  MessageSquareHeart,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { formatDuration, t } from '../../i18n/index.ts';
import { useEscapeClose } from '../common/useEscapeClose.ts';

/**
 * Die Stadtverwaltung ergänzt Status und Wirtschaft, statt deren Kennzahlen
 * erneut abzubilden. Im Fokus stehen nur verfügbare Bürgermeister-Aktionen,
 * laufende Effekte und die jüngsten Rückmeldungen aus der Stadt.
 */
export function MayorPanel() {
  const game = useGame();
  const setPanel = useUiStore((s) => s.setPanel);
  const pushToast = useUiStore((s) => s.pushToast);
  useEscapeClose(() => setPanel(undefined));
  const { state } = game;
  const now = state.meta.lastSimTime;
  const hasHouse = state.mayor.houseLevel >= 1;
  const actionStates = game.config.mayorActions.map((action) => {
    const locked = action.unlockLevel > state.level.current || !hasHouse;
    const readyAt = state.mayor.actionCooldowns[action.id] ?? 0;
    return { action, locked, readyAt, cooling: now < readyAt };
  });
  const readyAction = actionStates.find(({ locked, cooling }) => !locked && !cooling);

  return (
    <aside className="panel side-panel mayor-panel mayor-panel-simple">
      <div className="panel-head">
        <h3>
          <Crown size={18} /> {t('ui.mayor.administration')}
        </h3>
        <button className="btn-icon" onClick={() => setPanel(undefined)} title={t('ui.close')}>
          <X size={16} />
        </button>
      </div>

      <section className={`mayor-hero${hasHouse ? ' is-ready' : ' is-locked'}`}>
        <span className="mayor-hero-icon"><Landmark size={24} /></span>
        <div>
          <small>{t('ui.mayor.office')}</small>
          <strong>{hasHouse ? t('ui.mayor.office_ready') : t('ui.mayor.office_missing')}</strong>
          <span>
            {hasHouse
              ? t('ui.mayor.office_hint_ready')
              : t('ui.mayor.office_hint_locked')}
          </span>
        </div>
      </section>

      <div className="mayor-shortcuts">
        <button type="button" onClick={() => setPanel('status')}>
          <Activity size={16} />
          <span>
            <small>{t('ui.mayor.city_health')}</small>
            <strong>{t('ui.status.title')}</strong>
          </span>
        </button>
        <button type="button" onClick={() => setPanel('economy')}>
          <Wallet size={16} />
          <span>
            <small>{t('ui.mayor.city_finance')}</small>
            <strong>{t('ui.economy.title')}</strong>
          </span>
        </button>
      </div>

      <section className="mayor-decision">
        <div className="mayor-section-title">
          <div>
            <small>{t('ui.mayor.next_decision')}</small>
            <strong>
              {readyAction
                ? t(readyAction.action.nameKey)
                : hasHouse
                  ? t('ui.mayor.all_cooling')
                  : t('ui.mayor.build_office')}
            </strong>
          </div>
          <Sparkles size={18} />
        </div>

        {!hasHouse ? (
          <button className="mayor-build-cta" type="button" onClick={() => setPanel('build')}>
            <Hammer size={17} />
            <span>
              <strong>Zum Bau-Shop</strong>
              <small>Bürgermeisterhaus auswählen und platzieren</small>
            </span>
          </button>
        ) : (
          <div className="mayor-actions">
            {actionStates.map(({ action, locked, readyAt, cooling }) => (
              <button
                key={action.id}
                className={`mayor-action${readyAction?.action.id === action.id ? ' is-primary' : ''}`}
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
            ))}
          </div>
        )}
      </section>

      {(state.buffs.length > 0 || state.mayor.messages.length > 0) && (
        <details className="mayor-details">
          <summary>{t('ui.mayor.activity')}</summary>
          {state.buffs.length > 0 && (
            <div className="buff-list">
              <h4>{t('ui.buffs.active')}</h4>
              {state.buffs.map((buff) => (
                <div key={buff.id} className="buff">
                  {buff.kind === 'happiness'
                    ? `+${buff.amount} ${t('ui.happiness')}`
                    : `×${buff.amount} ${t('resource.money')}`}
                  <span className="muted"> · {formatDuration(buff.endsAt - now)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="message-feed message-feed-mayor">
            {state.mayor.messages.length === 0 && <p className="muted">{t('ui.no_messages')}</p>}
            {state.mayor.messages.slice(0, 3).map((msg) => (
              <div key={msg.id} className={`message message-${msg.kind}`}>
                {msg.kind === 'complaint'
                  ? <MessageCircleWarning size={14} />
                  : msg.kind === 'praise'
                    ? <MessageSquareHeart size={14} />
                    : <Info size={14} />}
                <span>{t(msg.textKey, msg.params)}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </aside>
  );
}
