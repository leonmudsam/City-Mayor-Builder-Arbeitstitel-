import { useEffect } from 'react';
import { useUiStore } from '../../state/store.ts';

export function Toasts() {
  const { toasts, removeToast } = useUiStore();

  useEffect(() => {
    if (toasts.length === 0) return;
    const newest = toasts[toasts.length - 1];
    if (!newest) return;
    const timer = setTimeout(() => removeToast(newest.id), 3500);
    return () => clearTimeout(timer);
  }, [toasts, removeToast]);

  return (
    <div className="toasts">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.kind}`} onClick={() => removeToast(toast.id)}>
          {toast.text}
        </div>
      ))}
    </div>
  );
}
