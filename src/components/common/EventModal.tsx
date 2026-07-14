import { Award, CheckCircle2, Flame, MapPin, PartyPopper, type LucideIcon } from 'lucide-react';
import { Modal } from './Modal.tsx';
import type { GameEvent } from '../../state/store.ts';
import { t } from '../../i18n/index.ts';

// Prominent one-off event notifications (§9): level-ups, new districts, fires.
// Distinct from toasts (which are transient, low-priority) — an EventModal is a
// staged moment the player should acknowledge. Content is data-driven from the
// UI event queue so new event kinds need no new component.

const EVENT_META: Record<GameEvent['kind'], { icon: LucideIcon; tone: 'primary' | 'good' | 'bad' }> = {
  levelUp: { icon: Award, tone: 'primary' },
  sectorUnlocked: { icon: MapPin, tone: 'good' },
  fire: { icon: Flame, tone: 'bad' },
  celebrate: { icon: PartyPopper, tone: 'good' },
  activityDone: { icon: CheckCircle2, tone: 'good' },
};

export function EventModal({ event, onClose }: { event: GameEvent; onClose: () => void }) {
  const meta = EVENT_META[event.kind];
  const Icon = meta.icon;
  return (
    <Modal
      title={t(event.titleKey, event.params)}
      icon={<Icon size={20} />}
      tone={meta.tone}
      onClose={onClose}
      footer={
        <button className="btn-primary" onClick={onClose}>
          {t('ui.ok')}
        </button>
      }
    >
      <div className="event-modal-body">
        <div className={`event-modal-glyph event-glyph-${meta.tone}`}>
          <Icon size={40} />
        </div>
        <p>{t(event.bodyKey, event.params)}</p>
      </div>
    </Modal>
  );
}
