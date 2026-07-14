import { useState } from 'react';
import { ClipboardList, Gift, MapPin, PackageCheck, Search, Store, Timer, X } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { DecisionModal } from '../common/DecisionModal.tsx';
import { RESOURCE_ICON } from '../common/icons.tsx';
import { CitizenPortrait } from '../art/index.ts';
import { formatDuration, formatMoney, t } from '../../i18n/index.ts';
import { playFeedback } from '../../services/feedback.ts';
import type { ActivityDef } from '../../game/config/types.ts';
import type { ActivityBoardEntry } from '../../game/commands/controller.ts';
import type { ResourceId } from '../../game/types.ts';

// Stadtarbeit panel (§ aktives Stadtmanagement): the player's mission board when
// they can't build. Several missions are offered at once (§16.1); delivery/
// inspection activities put targets on the map; decisions open a trade-off
// modal; trade contracts rotate. Everything is a controller command — the panel
// just renders the board snapshot and dispatches.
const TYPE_ICON = { delivery: PackageCheck, inspection: Search, decision: ClipboardList } as const;

export function ActivityPanel() {
  const game = useGame();
  const { setPanel, pushToast } = useUiStore();
  const [decision, setDecision] = useState<ActivityDef | undefined>();

  const now = game.state.meta.lastSimTime;
  const board = game.getActivityBoard();
  const active = game.state.activities.active;
  const activeDef = active ? board.find((e) => e.def.id === active.defId)?.def : undefined;
  const contracts = game.getTradeContracts();

  return (
    <aside className="panel side-panel activity-panel">
      <div className="panel-head">
        <h3>
          <ClipboardList size={17} /> {t('ui.activities.title')}
        </h3>
        <button className="btn-icon" onClick={() => setPanel(undefined)} title={t('ui.close')}>
          <X size={16} />
        </button>
      </div>

      {activeDef && active && (
        // The running delivery/inspection: click the map targets to finish it.
        <div className="activity-running">
          <div className="activity-running-head">
            <MapPin size={15} /> {t(activeDef.nameKey)}
          </div>
          <div className="activity-progress-bar">
            <div
              className="activity-progress-fill"
              style={{ width: `${(active.targets.filter((tg) => tg.done).length / active.targets.length) * 100}%` }}
            />
          </div>
          <div className="activity-running-foot">
            <span>{t('ui.activity.targets', { done: active.targets.filter((tg) => tg.done).length, total: active.targets.length })}</span>
            {active.expiresAt !== undefined && (
              <span className={`activity-timer${now > active.expiresAt ? ' is-over' : ''}`}>
                <Timer size={12} /> {formatDuration(Math.max(0, Math.ceil((active.expiresAt - now) / 1000)))}
              </span>
            )}
            <button className="btn-secondary btn-tiny" onClick={() => game.abandonActivity()}>
              {t('ui.activity.abandon')}
            </button>
          </div>
          <p className="muted activity-hint">
            {t('ui.activity.click_targets')}
            {active.expiresAt !== undefined && ` ${t('ui.activity.quality_hint')}`}
          </p>
        </div>
      )}

      <div className="activity-cards">
        {board.map((entry) => {
          const { def } = entry;
          const Icon = TYPE_ICON[def.type];
          const start = () => {
            if (def.type === 'decision') {
              setDecision(def);
              return;
            }
            const result = game.startActivity(def.id);
            if (result.ok) {
              playFeedback('activity_start');
              pushToast(t('ui.activity.started'), 'info');
            } else {
              pushToast(t(`error.${result.error}`), 'error');
            }
          };
          const showCooldown = entry.reason === 'cooldown';
          return (
            <div key={def.id} className={`activity-card${entry.available ? '' : ' is-disabled'}`}>
              <div className="activity-card-head">
                <CitizenPortrait role={def.sender} seed={def.id} size={40} />
                <div className="activity-card-title">
                  <span className="activity-card-sender">{t(`quest.sender.${def.sender}`)}</span>
                  <span className="activity-card-name">
                    <Icon size={13} /> {t(def.nameKey)}
                  </span>
                </div>
              </div>
              <div className="activity-badges">
                {def.category && <span className={`activity-badge cat-${def.category}`}>{t(`activity.category.${def.category}`)}</span>}
                {def.difficulty && <span className={`activity-badge diff-${def.difficulty}`}>{t(`activity.difficulty.${def.difficulty}`)}</span>}
                {def.timeLimitSec !== undefined && (
                  <span className="activity-badge badge-time">
                    <Timer size={11} /> {formatDuration(def.timeLimitSec)}
                  </span>
                )}
              </div>
              <p className="activity-card-desc">{t(def.descriptionKey)}</p>
              <div className="activity-card-foot">
                <span className="activity-reward">
                  <Gift size={12} /> {activityRewardLabel(entry)}
                </span>
                {showCooldown ? (
                  <span className="activity-cooldown">
                    <Timer size={12} /> {formatDuration(Math.ceil((entry.readyAt - now) / 1000))}
                  </span>
                ) : def.type === 'decision' || entry.available ? (
                  <button className="btn-primary btn-tiny" disabled={!entry.available && def.type !== 'decision'} onClick={start}>
                    {def.type === 'decision' ? t('ui.activity.decide') : t('ui.activity.start')}
                  </button>
                ) : (
                  <span className="activity-blocked">{t(`activity.reason.${entry.reason ?? 'busy'}`)}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {game.hasTradePost() && (
        <div className="activity-contracts">
          <h4 className="activity-subhead">
            <Store size={14} /> {t('ui.contracts.title')}
          </h4>
          {contracts.length === 0 && <p className="muted">{t('ui.contracts.none')}</p>}
          {contracts.map((offer) => (
            <div key={offer.id} className={`contract-card${offer.fulfilled ? ' is-done' : ''}`}>
              <div className="contract-demands">
                {Object.entries(offer.template.demands).map(([res, amount]) => {
                  const Icon = RESOURCE_ICON[res as ResourceId];
                  const have = Math.floor(game.state.resources[res as ResourceId]);
                  return (
                    <span key={res} className={`contract-demand${have < (amount ?? 0) ? ' short' : ''}`}>
                      <Icon size={13} /> {amount}
                    </span>
                  );
                })}
              </div>
              <div className="contract-foot">
                <span className="contract-reward">
                  <Gift size={12} /> {formatMoney(offer.template.rewardMoney)} · {offer.template.rewardXp} XP
                  {offer.template.rewardGold ? ` · ${offer.template.rewardGold} ${t('ui.gold')}` : ''}
                </span>
                {offer.fulfilled ? (
                  <span className="contract-done">{t('ui.contracts.fulfilled')}</span>
                ) : (
                  <button
                    className="btn-primary btn-tiny"
                    disabled={!offer.affordable}
                    onClick={() => {
                      const r = game.fulfillTradeContract(offer.id);
                      if (r.ok) {
                        playFeedback('activity_done');
                        pushToast(t('ui.contracts.delivered'), 'success');
                      } else pushToast(t(`error.${r.error}`), 'error');
                    }}
                  >
                    {t('ui.contracts.fulfill')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="muted activity-note">{t('ui.activities.note')}</p>
      {decision && <DecisionModal def={decision} onClose={() => setDecision(undefined)} />}
    </aside>
  );
}

function activityRewardLabel(entry: ActivityBoardEntry): string {
  const { def, reward } = entry;
  const parts: string[] = [];
  if (reward.money > 0) parts.push(formatMoney(reward.money));
  if (reward.xp > 0) parts.push(`${reward.xp} XP`);
  // Decisions pay through their options (money + buffs), not the flat band —
  // hint at that instead of showing a misleading 0.
  if (def.type === 'decision') parts.push(t('ui.activity.reward_choice'));
  return parts.join(' · ') || t('ui.activity.reward_choice');
}
