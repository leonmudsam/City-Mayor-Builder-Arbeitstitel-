import { ClipboardList, Gift, MapPin, PackageCheck, Search, Timer } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { formatDuration, formatMoney, t } from '../../i18n/index.ts';
import { playFeedback } from '../../services/feedback.ts';
import { CitizenPortrait } from '../art/index.ts';

// Persistent Stadtarbeiten widget (mockup §4, bottom-left): the featured job —
// the running run if there is one, else the best available task — shown with an
// illustrated sender portrait, timer, description, progress bar and reward.
// "Alle Aufträge" opens the full board (ActivityPanel). It only renders once the
// city has any activities unlocked, so early levels stay uncluttered.
const TYPE_ICON = { delivery: PackageCheck, inspection: Search, decision: ClipboardList } as const;

export function CityWorkPanel() {
  const game = useGame();
  const { setPanel, pushToast } = useUiStore();

  const board = game.getActivityBoard();
  if (board.length === 0) return null;

  const now = game.state.meta.lastSimTime;
  const active = game.state.activities.active;
  const activeEntry = active ? board.find((e) => e.def.id === active.defId) : undefined;
  const startable = board.filter((e) => e.available);
  // The featured task: the running one, or the first startable non-decision,
  // or any startable, else just the first card.
  const featuredEntry =
    activeEntry ??
    startable.find((e) => e.def.type !== 'decision') ??
    startable[0] ??
    board[0]!;
  const featured = featuredEntry.def;

  const badge = startable.length + (active ? 1 : 0);
  const TypeIcon = TYPE_ICON[featured.type];
  const reward = featuredEntry.reward;

  const running = activeEntry && active;
  const done = running ? active!.targets.filter((tg) => tg.done).length : 0;
  const total = running ? active!.targets.length : 0;
  const remaining = running && active!.expiresAt ? active!.expiresAt - now : undefined;
  const onCooldown = !running && featuredEntry.reason === 'cooldown';
  const readyAt = featuredEntry.readyAt;
  const blocked = !running && !featuredEntry.available && featuredEntry.def.type !== 'decision';

  const startFeatured = () => {
    if (featured.type === 'decision') {
      setPanel('activities');
      return;
    }
    const result = game.startActivity(featured.id);
    if (result.ok) {
      playFeedback('activity_start');
      pushToast(t('ui.activity.started'), 'info');
    } else {
      pushToast(t(`error.${result.error}`), 'error');
    }
  };

  return (
    <aside className="hud-panel city-work">
      <div className="hud-panel-head">
        <h3>
          <ClipboardList size={16} /> {t('ui.activities.title')}
        </h3>
        {badge > 0 && <span className="hud-badge">{badge}</span>}
      </div>

      <div className={`work-feature${running ? ' is-running' : ''}`}>
        <div className="work-feature-head">
          <span className="work-avatar">
            <CitizenPortrait role={featured.sender} seed={featured.id} size={58} />
          </span>
          <div className="work-feature-title">
            <span className="work-feature-name">
              <TypeIcon size={13} /> {t(featured.nameKey)}
            </span>
            {running && remaining !== undefined ? (
              <span className="work-feature-timer">
                <Timer size={12} /> {formatDuration(remaining)}
              </span>
            ) : onCooldown ? (
              <span className="work-feature-timer">
                <Timer size={12} /> {formatDuration(readyAt - now)}
              </span>
            ) : blocked ? (
              <span className="work-feature-timer">{t(`activity.reason.${featuredEntry.reason ?? 'busy'}`)}</span>
            ) : (
              <span className="work-feature-timer ready">{t('ui.activity.available')}</span>
            )}
          </div>
        </div>
        <p className="work-feature-desc">{t(featured.descriptionKey)}</p>

        {running ? (
          <>
            <div className="work-progress">
              <div className="work-progress-fill" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
            </div>
            <div className="work-progress-foot">
              <span>
                <MapPin size={12} /> {t('ui.activity.targets', { done, total })}
              </span>
              <span className="work-reward">
                <Gift size={12} /> {rewardLabel(reward)}
              </span>
            </div>
            <p className="muted work-hint">{t('ui.activity.click_targets')}</p>
          </>
        ) : (
          <div className="work-feature-foot">
            <span className="work-reward">
              <Gift size={12} /> {rewardLabel(reward)}
            </span>
            <button className="btn-primary btn-tiny" disabled={onCooldown || blocked} onClick={startFeatured}>
              {featured.type === 'decision' ? t('ui.activity.decide') : t('ui.activity.start')}
            </button>
          </div>
        )}
      </div>

      <button className="hud-panel-more solid" onClick={() => setPanel('activities')}>
        {t('ui.activities.all')}
      </button>
    </aside>
  );
}

function rewardLabel(reward: { money: number; xp: number }): string {
  const parts: string[] = [];
  if (reward.money > 0) parts.push(`${formatMoney(reward.money)} ${t('resource.money')}`);
  if (reward.xp > 0) parts.push(`${reward.xp} XP`);
  return parts.join(' · ') || t('ui.activity.reward_choice');
}
