import { useEffect } from 'react';

/**
 * Gives non-modal sheets the same Escape behaviour as the shared Modal.
 * The callback remains owned by the sheet, so no UI state is mutated here.
 */
export function useEscapeClose(onClose: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [enabled, onClose]);
}
