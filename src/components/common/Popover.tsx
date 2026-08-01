import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

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
  children: ReactNode | ((controls: { close: () => void }) => ReactNode);
  align?: 'start' | 'end';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, ready: false });
  const anchorRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    const popover = popRef.current;
    if (!anchor || !popover) return;
    const anchorRect = anchor.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const gap = 10;
    const viewportPad = 12;
    const preferredLeft = align === 'end' ? anchorRect.right - popoverRect.width : anchorRect.left;
    const left = Math.max(
      viewportPad,
      Math.min(preferredLeft, window.innerWidth - popoverRect.width - viewportPad),
    );
    const roomBelow = window.innerHeight - anchorRect.bottom - viewportPad;
    const top =
      roomBelow >= popoverRect.height + gap || anchorRect.top < popoverRect.height + gap
        ? anchorRect.bottom + gap
        : anchorRect.top - popoverRect.height - gap;
    setPosition({ top: Math.max(viewportPad, top), left, ready: true });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(updatePosition);
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(updatePosition);
    if (popRef.current) observer?.observe(popRef.current);
    if (anchorRef.current) observer?.observe(anchorRef.current);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

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

  const floatingPanel =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={popRef}
            className={`popover popover-portal popover-${align}${className ? ` ${className}` : ''}`}
            role="dialog"
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              visibility: position.ready ? 'visible' : 'hidden',
            }}
          >
            {typeof children === 'function' ? children({ close }) : children}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="popover-wrap">
      {trigger({
        open,
        toggle: () => {
          setPosition((current) => ({ ...current, ready: false }));
          setOpen((value) => !value);
        },
        ref: anchorRef,
      })}
      {floatingPanel}
    </div>
  );
}
