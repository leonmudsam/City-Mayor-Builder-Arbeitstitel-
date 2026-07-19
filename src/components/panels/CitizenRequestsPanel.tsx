import { useEffect, useState } from 'react';
import { Check, ChevronRight, Gift, MessageCircle, User, X } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { objectiveTarget } from '../../game/simulation/quests.ts';
import { formatMoney, t } from '../../i18n/index.ts';
import type { QuestDef, QuestObjective } from '../../game/config/types.ts';
import type { GameController } from '../../game/commands/controller.ts';
import type { ResourceId } from '../../game/types.ts';
import { CitizenPortrait, ResourceArt, RewardArt } from '../art/index.ts';

/**
 * Compact civic inbox from the main-world mockup. Selecting a card opens the
 * matching large detail sheet; both surfaces read the same live quest snapshot.
 */
export function CitizenRequestsPanel() {
  const game = useGame();
  const pushToast = useUiStore((state) => state.pushToast);
  const [expanded, setExpanded] = useState(false);
  const [selectedQuestId, setSelectedQuestId] = useState<string>();
  const sheetConflict = useUiStore((state) =>
    state.openPanel !== undefined ||
    state.regionDialog !== undefined ||
    state.selectedBuildingId !== undefined ||
    state.activityPlannerDefId !== undefined
  );
  useEffect(() => {
    if (sheetConflict) setSelectedQuestId(undefined);
  }, [sheetConflict]);
  const active = game.state.quests.active;
  if (active.length === 0) return null;

  const shown = expanded ? active : active.slice(0, 4);
  const claimable = active.filter((quest) => quest.claimable).length;
  const selectedQuest = active.find((quest) => quest.questId === selectedQuestId);
  const selectedDef = selectedQuest ? game.config.quests.get(selectedQuest.questId) : undefined;

  return (
    <>
      <aside className="hud-panel citizen-requests">
        <div className="hud-panel-head">
          <h3>
            <User size={16} /> {t('ui.requests')}
          </h3>
          <span className={`hud-badge${claimable > 0 ? ' alert' : ''}`}>{claimable || active.length}</span>
        </div>

        <div className="request-list">
          {shown.map((quest) => {
            const def = game.config.quests.get(quest.questId);
            if (!def) return null;
            const sender = def.sender ?? 'citizen';
            return (
              <div
                key={quest.questId}
                className={`request-card${quest.claimable ? ' is-claimable' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedQuestId(quest.questId)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') setSelectedQuestId(quest.questId);
                }}
              >
                <div className="request-top">
                  <span className="request-avatar">
                    <CitizenPortrait role={sender} seed={quest.questId} size={54} />
                  </span>
                  <div className="request-bubble">{t(def.descriptionKey)}</div>
                </div>
                <div className="request-task">{t(def.titleKey)}</div>
                <div className="request-objectives">
                  {def.objectives.map((objective, index) => {
                    const progress = quest.progress[index] ?? 0;
                    const target = objectiveTarget(objective);
                    const pct = target > 0 ? Math.min(100, (progress / target) * 100) : 0;
                    const done = progress >= target;
                    return (
                      <div key={index} className="request-obj">
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
                  <button
                    className="request-detail-link"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedQuestId(quest.questId);
                    }}
                  >
                    {t('ui.details')} <ChevronRight size={13} />
                  </button>
                  <span className="request-reward">
                    <RewardRow rewards={def.rewards} />
                  </span>
                  {quest.claimable && (
                    <button
                      className="btn-primary btn-tiny"
                      onClick={(event) => {
                        event.stopPropagation();
                        const result = game.claimQuest(quest.questId);
                        if (result.ok) {
                          setSelectedQuestId(undefined);
                          pushToast(t('ui.request_done', { title: t(def.titleKey) }), 'success');
                        }
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
          <button className="hud-panel-more" onClick={() => setExpanded((value) => !value)}>
            {expanded ? t('ui.requests.less') : t('ui.requests.all')}
          </button>
        )}
      </aside>

      {selectedQuest && selectedDef && (
        <CitizenRequestDetail
          quest={selectedQuest}
          def={selectedDef}
          game={game}
          onClose={() => setSelectedQuestId(undefined)}
          onClaim={() => {
            const result = game.claimQuest(selectedQuest.questId);
            if (!result.ok) return;
            setSelectedQuestId(undefined);
            pushToast(t('ui.request_done', { title: t(selectedDef.titleKey) }), 'success');
          }}
        />
      )}
    </>
  );
}

function CitizenRequestDetail({
  quest,
  def,
  game,
  onClose,
  onClaim,
}: {
  quest: { questId: string; progress: number[]; claimable: boolean };
  def: QuestDef;
  game: GameController;
  onClose(): void;
  onClaim(): void;
}) {
  const sender = def.sender ?? 'citizen';
  return (
    <section className="citizen-request-sheet" aria-label={t('ui.requests.detail')}>
      <div className="citizen-request-sheet-head">
        <span>{t('ui.requests.detail')}</span>
        <button className="btn-icon" onClick={onClose} title={t('ui.close')}>
          <X size={18} />
        </button>
      </div>
      <div className="citizen-request-hero">
        <CitizenPortrait role={sender} seed={quest.questId} size={82} />
        <div>
          <span className="citizen-request-kind">{t(`quest.sender.${sender}`)}</span>
          <h2>{t(def.titleKey)}</h2>
          <p><MessageCircle size={15} /> {t(def.descriptionKey)}</p>
        </div>
      </div>
      <div className="citizen-request-progress">
        <h3>{t('ui.request.progress')}</h3>
        {def.objectives.map((objective, index) => {
          const progress = quest.progress[index] ?? 0;
          const target = objectiveTarget(objective);
          const done = progress >= target;
          return (
            <div className={`citizen-objective${done ? ' done' : ''}`} key={index}>
              <span className="citizen-objective-state">{done ? <Check size={15} /> : index + 1}</span>
              <div>
                <strong>{objectiveText(objective, game)}</strong>
                <div className="request-obj-bar">
                  <span style={{ width: `${Math.min(100, (progress / Math.max(1, target)) * 100)}%` }} />
                </div>
              </div>
              <b>{Math.floor(progress)} / {target}</b>
            </div>
          );
        })}
      </div>
      <div className="citizen-request-rewards">
        <h3><Gift size={16} /> {t('ui.request.rewards')}</h3>
        <RewardRow rewards={def.rewards} />
      </div>
      <div className="citizen-request-actions">
        <button className="btn-secondary" onClick={onClose}>{t('ui.close')}</button>
        {quest.claimable && <button className="btn-primary" onClick={onClaim}>{t('ui.claim')}</button>}
      </div>
    </section>
  );
}

function objectiveText(objective: QuestObjective, game: GameController): string {
  switch (objective.type) {
    case 'build':
      return t('ui.objective.build', {
        building: t(game.config.buildings.get(objective.defId)?.nameKey ?? objective.defId),
      });
    case 'population':
      return t('ui.objective.population', { amount: objective.amount });
    case 'resource':
      return t('ui.objective.resource', { amount: objective.amount, resource: t(`resource.${objective.resource}`) });
    case 'produce':
      return t('ui.objective.produce', { amount: objective.amount, resource: t(`resource.${objective.resource}`) });
    case 'level':
      return t('ui.objective.level', { level: objective.level });
    case 'regions':
      return t('ui.objective.regions', { count: objective.count });
    case 'mayorAction':
      return t('ui.objective.mayor_action', { count: objective.count });
    case 'happiness':
      return t('ui.objective.happiness', { amount: objective.amount });
    case 'upgrade':
      return objective.defId
        ? t('ui.objective.upgrade_def', {
            building: t(game.config.buildings.get(objective.defId)?.nameKey ?? objective.defId),
            count: objective.count,
          })
        : t('ui.objective.upgrade', { count: objective.count });
    case 'activity':
      return t('ui.objective.activity', { count: objective.count });
    case 'tradeEarnings':
      return t('ui.objective.trade_earnings', { amount: formatMoney(objective.amount) });
  }
}

function RewardRow({ rewards }: { rewards: QuestDef['rewards'] }) {
  return (
    <>
      {rewards.money ? (
        <span className="reward-chip">
          <RewardArt kind="money" px={18} /> {formatMoney(rewards.money)}
        </span>
      ) : null}
      {rewards.gold ? (
        <span className="reward-chip">
          <RewardArt kind="gold" px={18} /> {rewards.gold}
        </span>
      ) : null}
      {rewards.xp ? (
        <span className="reward-chip">
          <RewardArt kind="xp" px={18} /> {rewards.xp} XP
        </span>
      ) : null}
      {Object.entries(rewards.resources ?? {}).map(([resource, amount]) => (
        <span className="reward-chip" key={resource}>
          <ResourceArt id={resource as ResourceId} size={18} /> {amount}
        </span>
      ))}
    </>
  );
}
