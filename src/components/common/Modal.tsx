import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { t } from '../../i18n/index.ts';

// Shared modal shell (§9, §15): a dimmed backdrop plus a centered card. Every
// blocking dialog (confirm, event) builds on this so backdrop behaviour, the
// close button and Escape handling live in exactly one place.

export function Modal({
  title,
  icon,
  onClose,
  children,
  footer,
  tone = 'neutral',
  dismissable = true,
}: {
  title: string;
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  tone?: 'neutral' | 'primary' | 'good' | 'bad';
  dismissable?: boolean;
}) {
  useEffect(() => {
    if (!dismissable) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, dismissable]);

  return (
    <div className="dialog-backdrop" onClick={() => dismissable && onClose()}>
      <div className={`dialog modal modal-${tone}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="panel-head">
          <h3>
            {icon}
            {title}
          </h3>
          {dismissable && (
            <button className="btn-icon" onClick={onClose} title={t('ui.close')}>
              <X size={18} />
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
