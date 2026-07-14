import { Crown, HardHat, Store, User, type LucideIcon } from 'lucide-react';
import { Modal } from './Modal.tsx';
import { useGame, useUiStore } from '../../state/store.ts';
import { RESOURCE_ICON } from './icons.tsx';
import { AdvisorPortrait } from '../art/index.ts';
import { formatMoney, t } from '../../i18n/index.ts';
import { playFeedback } from '../../services/feedback.ts';
import type { ActivityDef, QuestSender } from '../../game/config/types.ts';
import type { ResourceId } from '../../game/types.ts';

// Mayor decision popup (§ Bürgermeister-Entscheidung): a face, a short brief,
// and 2–3 options with visible trade-offs. Choosing routes through the
// controller's chooseDecision command, which books the cost and applies the
// buff/reward — the modal only renders and dispatches.
const SENDER_ICON: Record<QuestSender, LucideIcon> = {
  citizen: User,
  buildingDept: HardHat,
  fire: Crown,
  merchant: Store,
  mayor: Crown,
};

export function DecisionModal({ def, onClose }: { def: ActivityDef; onClose: () => void }) {
  const game = useGame();
  const pushToast = useUiStore((s) => s.pushToast);
  const Avatar = SENDER_ICON[def.sender];

  const choose = (optionId: string) => {
    const result = game.chooseDecision(def.id, optionId);
    if (result.ok) {
      playFeedback('decision');
      pushToast(t('ui.activity.decided'), 'success');
      onClose();
    } else {
      pushToast(t(`error.${result.error}`), 'error');
    }
  };

  return (
    <Modal title={t(def.nameKey)} icon={<Avatar size={20} />} tone="primary" onClose={onClose}>
      <div className="decision-modal">
        <div className="decision-sender">
          <AdvisorPortrait role={def.sender} size={52} />
          <span className="muted">{t(`quest.sender.${def.sender}`)}</span>
        </div>
        <p className="decision-brief">{t(def.descriptionKey)}</p>
        <div className="decision-options">
          {def.options?.map((opt) => (
            <button key={opt.id} className="decision-option" onClick={() => choose(opt.id)}>
              <span className="decision-option-label">{t(`activity.${def.id}.option.${opt.id}`)}</span>
              <span className="decision-option-effect">
                {opt.cost &&
                  Object.entries(opt.cost).map(([res, amount]) => {
                    const Icon = RESOURCE_ICON[res as ResourceId];
                    return (
                      <span key={res} className="decision-cost">
                        −{formatMoney(amount ?? 0)} <Icon size={12} />
                      </span>
                    );
                  })}
                <span className="muted">{t(`activity.${def.id}.option.${opt.id}.effect`)}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
