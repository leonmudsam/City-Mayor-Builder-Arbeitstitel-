import { type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal.tsx';
import { t } from '../../i18n/index.ts';

// Generic confirm dialog (§9): replaces ad-hoc inline "are you sure?" rows.
// Reused for demolish and any other destructive/irreversible action.

export function ConfirmModal({
  title,
  message,
  detail,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  detail?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      title={title}
      icon={<AlertTriangle size={18} />}
      tone={danger ? 'bad' : 'neutral'}
      onClose={onCancel}
      footer={
        <>
          <button className="btn-secondary" onClick={onCancel}>
            {cancelLabel ?? t('ui.cancel')}
          </button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
      {detail && <div className="modal-detail">{detail}</div>}
    </Modal>
  );
}
