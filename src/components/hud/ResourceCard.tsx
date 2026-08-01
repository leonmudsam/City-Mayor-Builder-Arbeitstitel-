import { type ReactNode } from 'react';
import { Popover } from '../common/Popover.tsx';

// A single HUD resource card (mockup top bar): a coloured icon chip, the big
// headline value and a small trend line beneath it. Pure presentation — it
// never reads game state, so the same card serves money, materials, gold,
// population and happiness. When `detail` is supplied the whole card becomes a
// button that opens a popover (storage / production breakdown).
export function ResourceCard({
  icon,
  value,
  sub,
  subTone = 'good',
  warn = false,
  accent,
  title,
  detail,
}: {
  icon: ReactNode;
  value: string;
  sub?: string | undefined;
  subTone?: 'good' | 'bad' | 'muted';
  warn?: boolean;
  accent?: string | undefined;
  title?: string;
  detail?: ReactNode | ((close: () => void) => ReactNode);
}) {
  const style = accent ? ({ '--card-accent': accent } as React.CSSProperties) : undefined;
  const body = (
    <>
      <span className="res-card-icon">{icon}</span>
      <span className="res-card-text">
        <span className="res-card-value">{value}</span>
        {sub && <span className={`res-card-sub res-card-sub-${subTone}`}>{sub}</span>}
      </span>
    </>
  );

  if (!detail) {
    return (
      <div className={`res-card${warn ? ' res-card-warn' : ''}`} style={style} title={title}>
        {body}
      </div>
    );
  }

  return (
    <Popover
      trigger={({ toggle, open, ref }) => (
        <button
          ref={ref}
          className={`res-card res-card-btn${warn ? ' res-card-warn' : ''}${open ? ' active' : ''}`}
          style={style}
          onClick={toggle}
          title={title}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          {body}
        </button>
      )}
    >
      {({ close }) => (typeof detail === 'function' ? detail(close) : detail)}
    </Popover>
  );
}
