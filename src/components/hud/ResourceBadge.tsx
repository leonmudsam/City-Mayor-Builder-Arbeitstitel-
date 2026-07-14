import { type ReactNode } from 'react';
import { Popover } from '../common/Popover.tsx';

// A single HUD status chip (§2, §12): icon + value, with an optional trend
// sub-label and warn state. Clicking opens a detail popover (storage,
// production, sources) supplied by the caller. Pure presentation — it never
// reads game state itself, so the same badge serves money, materials and gold.

export function ResourceBadge({
  icon,
  value,
  sub,
  warn = false,
  accent,
  detail,
}: {
  icon: ReactNode;
  value: string;
  sub?: string | undefined;
  warn?: boolean;
  accent?: string | undefined;
  detail?: ReactNode;
}) {
  const style = accent ? ({ '--badge-accent': accent } as React.CSSProperties) : undefined;

  if (!detail) {
    return (
      <div className={`res-badge${warn ? ' res-badge-warn' : ''}`} style={style}>
        <span className="res-badge-icon">{icon}</span>
        <span className="res-badge-value">{value}</span>
        {sub && <span className="res-badge-sub">{sub}</span>}
      </div>
    );
  }

  return (
    <Popover
      className="res-popover"
      trigger={({ toggle, open, ref }) => (
        <button
          ref={ref}
          className={`res-badge res-badge-btn${warn ? ' res-badge-warn' : ''}${open ? ' active' : ''}`}
          style={style}
          onClick={toggle}
        >
          <span className="res-badge-icon">{icon}</span>
          <span className="res-badge-value">{value}</span>
          {sub && <span className="res-badge-sub">{sub}</span>}
        </button>
      )}
    >
      {detail}
    </Popover>
  );
}
