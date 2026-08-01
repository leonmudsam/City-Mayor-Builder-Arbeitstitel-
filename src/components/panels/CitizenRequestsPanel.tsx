import { useEffect, useState } from 'react';
import {
  Archive,
  Check,
  ChevronRight,
  Filter,
  Gift,
  MapPinned,
  MessageCircle,
  User,
  X,
} from 'lucide-react';
import { getMapApi, useGame, useUiStore } from '../../state/store.ts';
import { objectiveTarget } from '../../game/simulation/quests.ts';
import { formatMoney, t } from '../../i18n/index.ts';
import type { QuestDef, QuestObjective } from '../../game/config/types.ts';
import type { GameController } from '../../game/commands/controller.ts';
import type { ActiveQuest, ResourceId } from '../../game/types.ts';
import { CitizenPortrait, ResourceArt, RewardArt } from '../art/index.ts';

type InboxFilter = 'active' | 'ready' | 'completed';

/**
 * Compact civic inbox plus one large, filterable sheet. Priority/role/region
 * metadata is deliberately not invented: claim readiness and the existing
 * QuestSender are the canonical values until the controller exposes richer data.
 */
export function CitizenRequestsPanel() {
  const game = useGame();
  const pushToast = useUiStore((state) => state.pushToast);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [filter, setFilter] = useState<InboxFilter>('active');
  const [selectedQuestId, setSelectedQuestId] = useState<string>();
  const sheetConflict = useUiStore(
    (state) =>
      state.openPanel !== undefined ||
      state.regionDialog !== undefined ||
      state.selectedBuildingId !== undefined ||
      state.activityPlannerDefId !== undefined,
  );

  useEffect(() => {
    if (sheetConflict) {
      setSelectedQuestId(undefined);
      setInboxOpen(false);
    }
  }, [sheetConflict]);

  useEffect(() => {
    if (!inboxOpen && selectedQuestId === undefined) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setSelectedQuestId(undefined);
      setInboxOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [inboxOpen, selectedQuestId]);

  const active = game.state.quests.active;
  if (active.length === 0 && game.state.quests.completed.length === 0) return null;

  const claimable = active.filter((quest) => quest.claimable).length;
  const prioritised = [...active].sort(
    (left, right) => Number(right.claimable) - Number(left.claimable),
  );
  const selectedQuest = active.find((quest) => quest.questId === selectedQuestId);
  const selectedDef = selectedQuest ? game.config.quests.get(selectedQuest.questId) : undefined;

  const claim = (quest: ActiveQuest, def: QuestDef) => {
    const result = game.claimQuest(quest.questId);
    if (!result.ok) return;
    setSelectedQuestId(undefined);
    pushToast(t('ui.request_done', { title: t(def.titleKey) }), 'success');
  };

  return (
    <>
      <aside className="hud-panel citizen-requests">
        <div className="hud-panel-head">
          <h3>
            <User size={16} /> {t('ui.requests')}
          </h3>
          <span
            className={`hud-badge${claimable > 0 ? ' alert' : ''}`}
            title={claimable > 0 ? `${claimable} Belohnungen bereit` : undefined}
          >
            {active.length}
          </span>
        </div>

        <div className="request-list">
          {prioritised.slice(0, 2).map((quest) => {
            const def = game.config.quests.get(quest.questId);
            if (!def) return null;
            return (
              <RequestCard
                key={quest.questId}
                quest={quest}
                def={def}
                game={game}
                compact
                onSelect={() => setSelectedQuestId(quest.questId)}
                onClaim={() => claim(quest, def)}
              />
            );
          })}
        </div>

        <button
          className="hud-panel-more request-open-inbox"
          onClick={() => {
            setSelectedQuestId(undefined);
            setInboxOpen(true);
          }}
        >
          {t('ui.requests.all')} <ChevronRight size={14} />
        </button>
      </aside>

      {(inboxOpen || (selectedQuest && selectedDef)) && (
        <div
          className="request-sheet-layer"
          onMouseDown={(event) => {
            if (event.target !== event.currentTarget) return;
            setSelectedQuestId(undefined);
            setInboxOpen(false);
          }}
        >
          {inboxOpen && !selectedQuest && (
            <CitizenRequestsInbox
              game={game}
              filter={filter}
              onFilter={setFilter}
              onClose={() => setInboxOpen(false)}
              onSelect={(questId) => setSelectedQuestId(questId)}
              onClaim={claim}
            />
          )}

          {selectedQuest && selectedDef && (
            <CitizenRequestDetail
              quest={selectedQuest}
              def={selectedDef}
              game={game}
              onBack={() => {
                setSelectedQuestId(undefined);
                if (!inboxOpen) setInboxOpen(false);
              }}
              onCloseAll={() => {
                setSelectedQuestId(undefined);
                setInboxOpen(false);
              }}
              onClaim={() => claim(selectedQuest, selectedDef)}
            />
          )}
        </div>
      )}
    </>
  );
}

function RequestCard({
  quest,
  def,
  game,
  compact = false,
  onSelect,
  onClaim,
}: {
  quest: ActiveQuest;
  def: QuestDef;
  game: GameController;
  compact?: boolean;
  onSelect(): void;
  onClaim(): void;
}) {
  const sender = def.sender ?? 'citizen';
  const summary = questProgressSummary(quest, def);
  const focusObjective = def.objectives[summary.focusIndex];
  const focusText = focusObjective ? objectiveText(focusObjective, game) : t(def.descriptionKey);
  return (
    <article
      className={`request-card request-role-${sender}${compact ? ' request-card-compact' : ''}${quest.claimable ? ' is-claimable' : ''}`}
    >
      <button className="request-card-open" type="button" onClick={onSelect}>
        <div className="request-top">
          <span className="request-avatar">
            <CitizenPortrait role={sender} seed={quest.questId} size={compact ? 46 : 54} />
          </span>
          <div className="request-card-copy">
            <div className="request-card-meta">
              <span className="request-role">{t(`quest.sender.${sender}`)}</span>
              {quest.claimable && <span className="request-priority">{t('ui.requests.ready')}</span>}
            </div>
            <strong className="request-task">{t(def.titleKey)}</strong>
            <p className="request-next-step">{focusText}</p>
          </div>
        </div>

        <div className="request-card-progress">
          <div className="request-obj-bar">
            <div
              className={`request-obj-fill${quest.claimable ? ' done' : ''}`}
              style={{ width: `${summary.pct}%` }}
            />
          </div>
          <span className={quest.claimable ? 'done' : ''}>
            {quest.claimable && <Check size={12} />}
            {quest.claimable ? t('ui.requests.ready') : `${summary.current}/${summary.target}`}
          </span>
        </div>
      </button>

      <div className="request-foot">
        {!compact && (
          <span className="request-reward">
            <RewardRow rewards={def.rewards} />
          </span>
        )}
        {quest.claimable ? (
          <button className="btn-primary btn-tiny" onClick={onClaim}>
            {t('ui.claim')}
          </button>
        ) : (
          <button className="request-detail-link" onClick={onSelect}>
            {t('ui.details')} <ChevronRight size={13} />
          </button>
        )}
      </div>
    </article>
  );
}

function CitizenRequestsInbox({
  game,
  filter,
  onFilter,
  onClose,
  onSelect,
  onClaim,
}: {
  game: GameController;
  filter: InboxFilter;
  onFilter(filter: InboxFilter): void;
  onClose(): void;
  onSelect(questId: string): void;
  onClaim(quest: ActiveQuest, def: QuestDef): void;
}) {
  const active = filter === 'ready' ? game.state.quests.active.filter((quest) => quest.claimable) : game.state.quests.active;
  const completed = game.state.quests.completed
    .map((questId) => game.config.quests.get(questId))
    .filter((def): def is QuestDef => def !== undefined);

  return (
    <section
      className="citizen-inbox-sheet"
      role="dialog"
      aria-modal="true"
      aria-label={t('ui.requests.all')}
    >
      <header className="citizen-inbox-head">
        <div>
          <span>{t('ui.requests')}</span>
          <h2>{t('ui.requests.all')}</h2>
        </div>
        <button className="btn-icon" onClick={onClose} title={t('ui.close')}>
          <X size={19} />
        </button>
      </header>
      <nav className="citizen-inbox-filters" aria-label={t('ui.requests.filter_all')}>
        <Filter size={15} />
        {([
          ['active', t('ui.requests.active')],
          ['ready', t('ui.requests.filter_ready')],
          ['completed', t('ui.requests.completed')],
        ] as const).map(([id, label]) => (
          <button key={id} className={filter === id ? 'active' : ''} onClick={() => onFilter(id)}>
            {label}
          </button>
        ))}
      </nav>
      <div className="citizen-inbox-content">
        {filter !== 'completed' &&
          active.map((quest) => {
            const def = game.config.quests.get(quest.questId);
            return def ? (
              <RequestCard
                key={quest.questId}
                quest={quest}
                def={def}
                game={game}
                onSelect={() => onSelect(quest.questId)}
                onClaim={() => onClaim(quest, def)}
              />
            ) : null;
          })}
        {filter === 'completed' &&
          completed.map((def) => (
            <article className="request-archive-card" key={def.id}>
              <Archive size={18} />
              <div>
                <strong>{t(def.titleKey)}</strong>
                <span>{t(`quest.sender.${def.sender ?? 'citizen'}`)}</span>
              </div>
              <Check size={17} />
            </article>
          ))}
        {((filter !== 'completed' && active.length === 0) || (filter === 'completed' && completed.length === 0)) && (
          <p className="citizen-inbox-empty">{t('ui.requests.no_entries')}</p>
        )}
      </div>
    </section>
  );
}

function CitizenRequestDetail({
  quest,
  def,
  game,
  onBack,
  onCloseAll,
  onClaim,
}: {
  quest: ActiveQuest;
  def: QuestDef;
  game: GameController;
  onBack(): void;
  onCloseAll(): void;
  onClaim(): void;
}) {
  const sender = def.sender ?? 'citizen';
  // § C3: kanonische Kartenprojektion des Anliegens (Controller-Read-Helper).
  const focus = game.questFocus(quest.questId);
  return (
    <section
      className={`citizen-request-sheet request-role-${sender}`}
      role="dialog"
      aria-modal="true"
      aria-label={t('ui.requests.detail')}
    >
      <div className="citizen-request-sheet-head">
        <span>{t('ui.requests.detail')}</span>
        <button className="btn-icon" onClick={onBack} title={t('ui.close')}>
          <X size={18} />
        </button>
      </div>
      <div className="citizen-request-hero">
        <CitizenPortrait role={sender} seed={quest.questId} size={92} />
        <div>
          <span className="citizen-request-kind">{t(`quest.sender.${sender}`)}</span>
          <h2>{t(def.titleKey)}</h2>
          <p>
            <MessageCircle size={15} /> {t(def.descriptionKey)}
          </p>
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
              <b>
                {Math.floor(progress)} / {target}
              </b>
            </div>
          );
        })}
      </div>
      <div className="citizen-request-rewards">
        <h3>
          <Gift size={16} /> {t('ui.request.rewards')}
        </h3>
        <RewardRow rewards={def.rewards} />
      </div>
      <div className="citizen-request-actions">
        {/* § C3 erledigt: Kartenfokus kommt aus controller.questFocus (reine Projektion). */}
        <button
          className="btn-secondary"
          disabled={!focus}
          onClick={() => {
            if (!focus) return;
            getMapApi()?.focusGround(focus.x, focus.y);
            onCloseAll();
          }}
        >
          <MapPinned size={15} /> {t('ui.request.show_on_map')}
        </button>
        {quest.claimable ? (
          <button className="btn-primary" onClick={onClaim}>
            {t('ui.claim')}
          </button>
        ) : (
          <button className="btn-secondary" onClick={onBack}>
            {t('ui.close')}
          </button>
        )}
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

function questProgressSummary(
  quest: ActiveQuest,
  def: QuestDef,
): { pct: number; focusIndex: number; current: number; target: number } {
  const objectiveProgress = def.objectives.map((objective, index) => {
    const target = Math.max(1, objectiveTarget(objective));
    const current = Math.max(0, quest.progress[index] ?? 0);
    return {
      index,
      current,
      target,
      ratio: Math.min(1, current / target),
    };
  });
  const focus = objectiveProgress.find((objective) => objective.current < objective.target)
    ?? objectiveProgress.at(-1)
    ?? { index: 0, current: 0, target: 1, ratio: 0 };
  const pct = quest.claimable ? 100 : Math.round(focus.ratio * 100);
  return {
    pct,
    focusIndex: focus.index,
    current: Math.floor(focus.current),
    target: focus.target,
  };
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
