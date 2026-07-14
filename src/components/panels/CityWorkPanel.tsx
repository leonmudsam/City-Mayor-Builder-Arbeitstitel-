import {
  ClipboardList,
  Crown,
  Gift,
  HardHat,
  MapPin,
  PackageCheck,
  Search,
  Store,
  Timer,
  User,
  type LucideIcon,
} from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { rewardTierFor } from '../../game/simulation/activities.ts';
import { formatDuration, formatMoney, t } from '../../i18n/index.ts';
import { playFeedback } from '../../services/feedback.ts';
import type { QuestSender } from '../../game/config/types.ts';

// Persistent Stadtarbeiten widget (mockup §4, bottom-left): the featured job —
// the running run if there is one, else the best available task — shown with a
// sender avatar, timer, description, progress bar and reward. "Alle Aufträge"
// opens the full board (ActivityPanel). It only renders once the city has any
// activities unlocked, so early levels stay uncluttered.
const SENDER_ICON: Record<QuestSender, LucideIcon> = {
  citizen: User,
  buildingDept: HardHat,
  fire: Crown,
  merchant: Store,
  mayor: Crown,
};
const TYPE_ICON = { delivery: PackageCheck, inspection: Search, decision: ClipboardList } as const;

export function CityWorkPanel() {
  const game = useGame();
  const { setPanel, pushToast } = useUiStore();

  const defs = game.getActivityDefs();
  if (defs.length === 0) return null;

  const now = game.state.meta.lastSimTime;
  const active = game.state.activities.active;
  const activeDef = active ? defs.find((d) => d.id === active.defId) : undefined;
  const available = defs.filter((d) => now >= game.activityReadyAt(d.id));
  // The featured task: the running one, or the first ready non-decision, or any ready.
  const featured =
    activeDef ??
    available.find((d) => d.type !== 'decision') ??
    available[0] ??
    defs[0]!;

  const badge = available.length + (active ? 1 : 0);
  const Avatar = SENDER_ICON[featured.sender];
  const TypeIcon = TYPE_ICON[featured.type];
  const tier = rewardTierFor(featured, game.state.level.current);

  const running = activeDef && active;
  const done = running ? active!.targets.filter((tg) => tg.done).length : 0;
  const total = running ? active!.targets.length : 0;
  const remaining = running && active!.expiresAt ? active!.expiresAt - now : undefined;
  const readyAt = game.activityReadyAt(featured.id);
  const onCooldown = !running && now < readyAt;

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
          <span className={`work-avatar avatar-${featured.sender}`}>
            <Avatar size={22} />
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
                <Gift size={12} /> {rewardLabel(tier)}
              </span>
            </div>
            <p className="muted work-hint">{t('ui.activity.click_targets')}</p>
          </>
        ) : (
          <div className="work-feature-foot">
            <span className="work-reward">
              <Gift size={12} /> {rewardLabel(tier)}
            </span>
            <button className="btn-primary btn-tiny" disabled={onCooldown} onClick={startFeatured}>
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

function rewardLabel(tier: { money: number; xp: number; gold?: number }): string {
  const parts: string[] = [];
  if (tier.money > 0) parts.push(`${formatMoney(tier.money)} ${t('resource.money')}`);
  parts.push(`${tier.xp} XP`);
  if (tier.gold) parts.push(`${tier.gold} ${t('ui.gold')}`);
  return parts.join(' · ');
}
