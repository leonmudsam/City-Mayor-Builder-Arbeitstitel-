import { Check, Gift } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { objectiveTarget } from '../../game/simulation/quests.ts';
import { t } from '../../i18n/index.ts';
import type { QuestObjective } from '../../game/config/types.ts';

export function QuestPanel() {
  const game = useGame();
  const pushToast = useUiStore((s) => s.pushToast);
  const active = game.state.quests.active;
  if (active.length === 0) return null;

  return (
    <aside className="panel quest-panel">
      <h3>{t('ui.quests')}</h3>
      {active.slice(0, 3).map((quest) => {
        const def = game.config.quests.get(quest.questId);
        if (!def) return null;
        return (
          <div key={quest.questId} className="quest">
            <div className="quest-title">{t(def.titleKey)}</div>
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
            {quest.claimable && (
              <button
                className="btn-primary btn-claim"
                onClick={() => {
                  const result = game.claimQuest(quest.questId);
                  if (result.ok) pushToast(`${t(def.titleKey)} ✓`, 'success');
                }}
              >
                <Gift size={15} />
                {t('ui.claim')}
                {def.rewards.money ? ` (+${def.rewards.money} ${t('resource.money')})` : ''}
              </button>
            )}
          </div>
        );
      })}
    </aside>
  );
}

function describeObjective(obj: QuestObjective): string {
  switch (obj.type) {
    case 'build':
      return `${t(`building.${obj.defId}`)} bauen`;
    case 'population':
      return `${obj.amount} ${t('ui.population')}`;
    case 'resource':
      return `${obj.amount} ${t(`resource.${obj.resource}`)} besitzen`;
    case 'collect':
      return `${obj.amount} ${t(`resource.${obj.resource}`)} einsammeln`;
    case 'level':
      return `${t('ui.level')} ${obj.level}`;
    case 'sectors':
      return `${obj.count} Sektoren freischalten`;
    case 'mayorAction':
      return t(`mayor.action.${obj.actionId}`);
    case 'happiness':
      return `${obj.amount} ${t('ui.happiness')}`;
  }
}
