import { useEffect, useRef, useState, type ReactNode } from 'react';

// A small anchored floating panel (§2, §15): opens on hover or click of its
// trigger, positions itself under the trigger, and closes on outside-click or
// Escape. Purely presentational — it holds no game logic, so the HUD badges,
// the coverage legend and future tooltips can all reuse it.

export function Popover({
  trigger,
  children,
  align = 'start',
  className,
}: {
  trigger: (props: { open: boolean; toggle: () => void; ref: React.Ref<HTMLButtonElement> }) => ReactNode;
  children: ReactNode;
  align?: 'start' | 'end';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target) || popRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="popover-wrap">
      {trigger({ open, toggle: () => setOpen((v) => !v), ref: anchorRef })}
      {open && (
        <div ref={popRef} className={`popover popover-${align}${className ? ` ${className}` : ''}`} role="dialog">
          {children}
        </div>
      )}
    </div>
  );
}
