import { useState } from 'react';
import { Check, Gift, User } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { objectiveTarget } from '../../game/simulation/quests.ts';
import { formatMoney, t } from '../../i18n/index.ts';
import { CitizenPortrait } from '../art/index.ts';

// Bürgeranliegen (mockup §5, right column): the city's open requests as living
// citizen cards — an illustrated portrait, a spoken wish (speech bubble), the
// concrete task with a progress bar, and the reward. Reframes the quest system
// as "you helped someone"; reward & progress still come from the quest engine.

export function CitizenRequestsPanel() {
  const game = useGame();
  const pushToast = useUiStore((s) => s.pushToast);
  const [expanded, setExpanded] = useState(false);
  const active = game.state.quests.active;
  if (active.length === 0) return null;

  const shown = expanded ? active : active.slice(0, 4);
  const claimable = active.filter((q) => q.claimable).length;

  return (
    <aside className="hud-panel citizen-requests">
      <div className="hud-panel-head">
        <h3>
          <User size={16} /> {t('ui.requests')}
        </h3>
        {claimable > 0 ? (
          <span className="hud-badge alert">{claimable}</span>
        ) : (
          <span className="hud-badge">{active.length}</span>
        )}
      </div>

      <div className="request-list">
        {shown.map((quest) => {
          const def = game.config.quests.get(quest.questId);
          if (!def) return null;
          const sender = def.sender ?? 'citizen';
          return (
            <div key={quest.questId} className={`request-card${quest.claimable ? ' is-claimable' : ''}`}>
              <div className="request-top">
                <span className="request-avatar">
                  <CitizenPortrait role={sender} seed={quest.questId} size={42} />
                </span>
                <div className="request-bubble">{t(def.descriptionKey)}</div>
              </div>
              <div className="request-task">{t(def.titleKey)}</div>
              <div className="request-objectives">
                {def.objectives.map((obj, i) => {
                  const progress = quest.progress[i] ?? 0;
                  const target = objectiveTarget(obj);
                  const pct = target > 0 ? Math.min(100, (progress / target) * 100) : 0;
                  const done = progress >= target;
                  return (
                    <div key={i} className="request-obj">
                      <div className="request-obj-bar">
                        <div className={`request-obj-fill${done ? ' done' : ''}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`request-obj-count${done ? ' done' : ''}`}>
                        {done && <Check size={12} />}
                        {Math.floor(progress)}/{target}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="request-foot">
                <span className="request-reward">
                  <Gift size={13} /> {rewardLabel(def.rewards)}
                </span>
                {quest.claimable && (
                  <button
                    className="btn-primary btn-tiny"
                    onClick={() => {
                      const result = game.claimQuest(quest.questId);
                      if (result.ok) pushToast(t('ui.request_done', { title: t(def.titleKey) }), 'success');
                    }}
                  >
                    {t('ui.claim')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {active.length > 4 && (
        <button className="hud-panel-more" onClick={() => setExpanded((v) => !v)}>
          {expanded ? t('ui.requests.less') : t('ui.requests.all')}
        </button>
      )}
    </aside>
  );
}

function rewardLabel(rewards: { money?: number; gold?: number; xp?: number }): string {
  const parts: string[] = [];
  if (rewards.money) parts.push(`${formatMoney(rewards.money)} ${t('resource.money')}`);
  if (rewards.gold) parts.push(`${rewards.gold} ${t('ui.gold')}`);
  if (rewards.xp) parts.push(`${rewards.xp} XP`);
  return parts.join(' · ');
}
