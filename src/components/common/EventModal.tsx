import {
  Award,
  CheckCircle2,
  Clock3,
  Flame,
  Gauge,
  MapPin,
  PartyPopper,
  Route,
  Star,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { Modal } from './Modal.tsx';
import { useGame, useUiStore, type GameEvent } from '../../state/store.ts';
import { BuildingArt, ResourceArt } from '../art/index.ts';
import { formatMoney, t } from '../../i18n/index.ts';

// Prominent one-off event notifications (§9): level-ups, new districts, fires.
// Distinct from toasts (which are transient, low-priority) — an EventModal is a
// staged moment the player should acknowledge. A level-up additionally shows a
// card with the artwork of every newly-unlocked building and the level reward,
// plus a shortcut into the build menu (mockup §8 "Level-Up-Popup"). Content is
// data-driven from the UI event queue so new event kinds need no new component.

const EVENT_META: Record<GameEvent['kind'], { icon: LucideIcon; tone: 'primary' | 'good' | 'bad' }> = {
  levelUp: { icon: Award, tone: 'primary' },
  regionUnlocked: { icon: MapPin, tone: 'good' },
  fire: { icon: Flame, tone: 'bad' },
  celebrate: { icon: PartyPopper, tone: 'good' },
  activityDone: { icon: CheckCircle2, tone: 'good' },
};

export function EventModal({ event, onClose }: { event: GameEvent; onClose: () => void }) {
  const meta = EVENT_META[event.kind];
  const Icon = meta.icon;
  const isLevelUp = event.kind === 'levelUp';
  const isActivityResult = event.kind === 'activityDone' && event.params?.elapsed !== undefined;
  const buildingIds = String(event.params?.buildingIds ?? '')
    .split(',')
    .filter(Boolean);

  return (
    <Modal
      title={t(event.titleKey, event.params)}
      icon={<Icon size={20} />}
      tone={meta.tone}
      onClose={onClose}
      footer={
        isLevelUp && buildingIds.length > 0 ? (
          <button
            className="btn-primary"
            onClick={() => {
              useUiStore.getState().setPanel('build');
              onClose();
            }}
          >
            {t('ui.to_build_menu')}
          </button>
        ) : (
          <button className="btn-primary" onClick={onClose}>
            {t('ui.ok')}
          </button>
        )
      }
    >
      {isLevelUp && buildingIds.length > 0 ? (
        <LevelUpBody level={Number(event.params?.level ?? 0)} buildingIds={buildingIds} />
      ) : isActivityResult ? (
        <ActivityResultBody event={event} />
      ) : (
        <div className="event-modal-body">
          <div className={`event-modal-glyph event-glyph-${meta.tone}`}>
            <Icon size={40} />
          </div>
          <p>{t(event.bodyKey, event.params)}</p>
        </div>
      )}
    </Modal>
  );
}

function ActivityResultBody({ event }: { event: GameEvent }) {
  const stars = event.titleKey.endsWith('_gold') ? 3 : event.titleKey.endsWith('_silver') ? 2 : 1;
  return (
    <div className="activity-result-body">
      <div className="activity-result-medal">
        <span><Truck size={38} /></span>
        <div>{[0, 1, 2].map((index) => <Star key={index} size={24} fill={index < stars ? 'currentColor' : 'none'} className={index < stars ? 'earned' : ''} />)}</div>
        <strong>{String(event.params?.quality ?? 'Abgeschlossen')}</strong>
        <small>{String(event.params?.name ?? '')}</small>
      </div>
      <div className="activity-result-grid">
        <span><Clock3 size={16} /><small>Gesamtzeit</small><strong>{String(event.params?.elapsed ?? '–')}</strong></span>
        <span><Route size={16} /><small>Strecke</small><strong>{String(event.params?.distance ?? '–')}</strong></span>
        <span><Gauge size={16} /><small>Effizienz</small><strong>{String(event.params?.efficiency ?? '–')} %</strong></span>
        <span><CheckCircle2 size={16} /><small>Straßenanteil</small><strong>{String(event.params?.roadCoverage ?? '–')}</strong></span>
      </div>
      <div className="activity-result-reward">
        <span><strong>{String(event.params?.money ?? '0')}</strong><small>Geld</small></span>
        <span><strong>{String(event.params?.xp ?? '0')} XP</strong><small>Erfahrung</small></span>
        <span><strong>{String(event.params?.vehicle ?? '–')}</strong><small>Fahrzeug</small></span>
      </div>
    </div>
  );
}

/** The rich level-up content: unlocked buildings as artwork cards + the reward. */
function LevelUpBody({ level, buildingIds }: { level: number; buildingIds: string[] }) {
  const game = useGame();
  const reward = game.config.levels.find((l) => l.level === level)?.rewards ?? {};
  return (
    <div className="levelup-body">
      <p className="levelup-lead">{t('event.level_up.unlocked_intro')}</p>
      <div className="levelup-grid">
        {buildingIds.map((id) => {
          const def = game.config.buildings.get(id);
          if (!def) return null;
          return (
            <div key={id} className="levelup-card">
              <BuildingArt id={id} category={def.category} px={54} />
              <span className="levelup-card-name">{t(def.nameKey)}</span>
            </div>
          );
        })}
      </div>
      {(reward.money || reward.gold) && (
        <div className="levelup-reward">
          <span className="levelup-reward-label">{t('ui.reward')}</span>
          {reward.money ? (
            <span className="levelup-reward-item">
              <ResourceArt id="money" size={22} /> {formatMoney(reward.money)}
            </span>
          ) : null}
          {reward.gold ? (
            <span className="levelup-reward-item">
              <ResourceArt id="gold" size={22} /> {reward.gold}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
