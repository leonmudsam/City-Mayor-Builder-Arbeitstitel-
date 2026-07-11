import { AlertTriangle, ChevronRight, Gift, Info, PackageX, Sparkles, X } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import type { NeedId, ResourceId } from '../../game/types.ts';
import { NeedIcon } from '../common/icons.tsx';
import { t } from '../../i18n/index.ts';

// The city's control room (§10): actionable alerts first (each one clicks
// through to the fix), then the full needs breakdown. This is the game's main
// teaching surface — it always answers "what should I do next?". Alert
// detection is presentation logic over derived data; no game state is mutated.

interface Alert {
  id: string;
  severity: 'bad' | 'warn' | 'info';
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}

const NEED_SUGGESTION: Partial<Record<NeedId, string>> = {
  housing: 'house_small',
  water: 'well',
  food: 'farm',
  work: 'shop_small',
  leisure: 'park',
};

export function CityStatusPanel() {
  const game = useGame();
  const { setPanel, startPlacing } = useUiStore();
  const { state } = game;
  const level = state.level.current;
  const activeNeeds = game.config.needs.filter((n) => n.unlockLevel <= level);

  const alerts: Alert[] = [];

  // 1. Needs running low — the highest-value hint, links to the fix.
  for (const need of activeNeeds) {
    const ns = state.citizens.needs[need.id];
    const pct = Math.round(ns.fulfillment * 100);
    if (state.citizens.population > 0 && pct < 80) {
      const suggestion = NEED_SUGGESTION[need.id];
      const def = suggestion ? game.config.buildings.get(suggestion) : undefined;
      const canBuild = def && def.unlockLevel <= level;
      alerts.push({
        id: `need_${need.id}`,
        severity: pct < 50 ? 'bad' : 'warn',
        text: t('ui.status.need_low', { need: t(need.nameKey), pct }),
        ...(canBuild && suggestion
          ? { actionLabel: t('building.' + suggestion), onAction: () => startPlacing(suggestion) }
          : {}),
      });
    }
  }

  // 2. Storage full — production is being wasted.
  for (const resId of ['wood', 'stone', 'food'] as ResourceId[]) {
    const cap = game.derived.storageCaps[resId];
    if (cap > 0 && state.resources[resId] >= cap && game.derived.productionPerMin[resId] > 0) {
      alerts.push({
        id: `full_${resId}`,
        severity: 'warn',
        text: t('ui.status.storage_full', { resource: t(`resource.${resId}`) }),
      });
    }
  }

  // 3. A quest reward is waiting to be claimed.
  if (state.quests.active.some((q) => q.claimable)) {
    alerts.push({
      id: 'quest_claim',
      severity: 'info',
      text: t('ui.status.quest_ready'),
      actionLabel: t('ui.quests'),
      onAction: () => setPanel('quests'),
    });
  }

  return (
    <aside className="panel side-panel status-panel">
      <div className="panel-head">
        <h3>
          <Sparkles size={17} /> {t('ui.status.title')}
        </h3>
        <button className="btn-icon" onClick={() => setPanel(undefined)} title={t('ui.close')}>
          <X size={16} />
        </button>
      </div>

      <div className="status-happiness">
        <span>{t('ui.happiness')}</span>
        <strong>{Math.round(state.citizens.happiness)}/100</strong>
      </div>

      <div className="status-alerts">
        {alerts.length === 0 ? (
          <div className="status-ok">
            <Sparkles size={15} /> {t('ui.status.all_good')}
          </div>
        ) : (
          alerts.map((a) => <AlertRow key={a.id} alert={a} />)
        )}
      </div>

      <div className="status-needs">
        <h4>{t('ui.status.needs')}</h4>
        {activeNeeds.map((need) => {
          const pct = Math.round(state.citizens.needs[need.id].fulfillment * 100);
          return (
            <div key={need.id} className="status-need">
              <span className="status-need-name">
                <NeedIcon id={need.id} size={13} />
                {t(need.nameKey)}
              </span>
              <div className="status-need-bar">
                <div
                  className={`status-need-fill ${pct < 60 ? 'bad' : pct < 90 ? 'warn' : 'good'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={`status-need-pct ${pct < 60 ? 'text-bad' : pct < 90 ? 'text-warn' : 'text-good'}`}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function AlertRow({ alert }: { alert: Alert }) {
  const Icon = alert.severity === 'info' ? Info : alert.id.startsWith('full_') ? PackageX : AlertTriangle;
  return (
    <div className={`status-alert status-alert-${alert.severity}`}>
      <Icon size={15} />
      <span className="status-alert-text">{alert.text}</span>
      {alert.onAction && alert.actionLabel && (
        <button className="status-alert-action" onClick={alert.onAction}>
          {alert.id === 'quest_claim' ? <Gift size={13} /> : null}
          {alert.actionLabel}
          <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
}
