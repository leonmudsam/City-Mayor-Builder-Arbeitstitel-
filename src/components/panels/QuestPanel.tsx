import { Check, Crown, Flame, Gift, HardHat, Store, User, type LucideIcon } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { objectiveTarget } from '../../game/simulation/quests.ts';
import { formatMoney, t } from '../../i18n/index.ts';
import type { QuestObjective, QuestSender } from '../../game/config/types.ts';

// Quests reframed as living requests from the city (§6/§14): each card carries a
// sender avatar + label ("a citizen", "the fire service") so a task reads as
// "you helped someone", not a checklist. Purely presentational — the reward and
// progress still come from the existing quest system.
const SENDER_META: Record<QuestSender, { icon: LucideIcon; tone: string }> = {
  citizen: { icon: User, tone: 'citizen' },
  buildingDept: { icon: HardHat, tone: 'dept' },
  fire: { icon: Flame, tone: 'fire' },
  merchant: { icon: Store, tone: 'merchant' },
  mayor: { icon: Crown, tone: 'mayor' },
};

export function QuestPanel() {
  const game = useGame();
  const pushToast = useUiStore((s) => s.pushToast);
  const active = game.state.quests.active;
  if (active.length === 0) return null;

  return (
    <aside className="panel quest-panel">
      <h3>{t('ui.requests')}</h3>
      {active.slice(0, 4).map((quest) => {
        const def = game.config.quests.get(quest.questId);
        if (!def) return null;
        const sender = def.sender ?? 'citizen';
        const meta = SENDER_META[sender];
        const Avatar = meta.icon;
        return (
          <div key={quest.questId} className={`quest quest-${meta.tone}`}>
            <div className="quest-head">
              <span className={`quest-avatar avatar-${meta.tone}`}>
                <Avatar size={18} />
              </span>
              <div className="quest-head-text">
                <div className="quest-sender">{t(`quest.sender.${sender}`)}</div>
                <div className="quest-title">{t(def.titleKey)}</div>
              </div>
            </div>
            <div className="quest-desc">{t(def.descriptionKey)}</div>
            <ul className="quest-objectives">
              {def.objectives.map((obj, i) => {
                const progress = quest.progress[i] ?? 0;
                const target = objectiveTarget(obj);
                const done = progress >= target;
                return (
                  <li key={i} className={done ? 'done' : ''}>
                    {done ? <Check size={13} /> : <span className="dot" />}
                    {describeObjective(obj)} ({Math.floor(progress)}/{target})
                  </li>
                );
              })}
            </ul>
            <div className="quest-reward-row">
              <span className="quest-reward">
                <Gift size={13} />
                {questRewardLabel(def.rewards)}
              </span>
              {quest.claimable && (
                <button
                  className="btn-primary btn-claim"
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
    </aside>
  );
}

function questRewardLabel(rewards: { money?: number; gold?: number; xp?: number }): string {
  const parts: string[] = [];
  if (rewards.money) parts.push(`${formatMoney(rewards.money)} ${t('resource.money')}`);
  if (rewards.gold) parts.push(`${rewards.gold} ${t('ui.gold')}`);
  if (rewards.xp) parts.push(`${rewards.xp} XP`);
  return parts.join(' · ');
}

function describeObjective(obj: QuestObjective): string {
  switch (obj.type) {
    case 'build':
      return t('ui.objective.build', { building: t(`building.${obj.defId}`) });
    case 'population':
      return `${obj.amount} ${t('ui.population')}`;
    case 'resource':
      return t('ui.objective.resource', { amount: obj.amount, resource: t(`resource.${obj.resource}`) });
    case 'produce':
      return t('ui.objective.produce', { amount: obj.amount, resource: t(`resource.${obj.resource}`) });
    case 'level':
      return `${t('ui.level')} ${obj.level}`;
    case 'sectors':
      return t('ui.objective.sectors', { count: obj.count });
    case 'mayorAction':
      return t(`mayor.action.${obj.actionId}`);
    case 'happiness':
      return `${obj.amount} ${t('ui.happiness')}`;
    case 'upgrade':
      return obj.defId
        ? t('ui.objective.upgrade_def', { building: t(`building.${obj.defId}`), count: obj.count })
        : t('ui.objective.upgrade', { count: obj.count });
    case 'activity':
      return t('ui.objective.activity', { count: obj.count });
    case 'tradeEarnings':
      return t('ui.objective.trade_earnings', { amount: obj.amount });
  }
}
