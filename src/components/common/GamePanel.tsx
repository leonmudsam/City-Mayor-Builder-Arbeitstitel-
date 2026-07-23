import type { HTMLAttributes, ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { capacityTone, clampPercent, type CapacityTone, type VisualTone } from '../operations/viewModels.ts';

export function GamePanel({
  title,
  eyebrow,
  icon,
  actions,
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLElement> & {
  title: string;
  eyebrow?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className={`game-panel ${className}`.trim()} {...props}>
      <header className="game-panel-head">
        <span className="game-panel-emblem">{icon}</span>
        <div>
          {eyebrow && <small>{eyebrow}</small>}
          <h2>{title}</h2>
        </div>
        {actions && <div className="game-panel-actions">{actions}</div>}
      </header>
      <div className="game-panel-body">{children}</div>
    </section>
  );
}

export function GameSectionHeader({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="game-section-head">
      <div>
        <h3>{title}</h3>
        {detail && <small>{detail}</small>}
      </div>
      {action}
    </div>
  );
}

export function DataMetric({
  label,
  value,
  icon,
  detail,
  tone = 'neutral',
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  detail?: string;
  tone?: VisualTone;
}) {
  return (
    <div className={`data-metric tone-${tone}`}>
      {icon && <span className="data-metric-icon">{icon}</span>}
      <span className="data-metric-copy">
        <small>{label}</small>
        <strong>{value}</strong>
        {detail && <span>{detail}</span>}
      </span>
    </div>
  );
}

export function CapacityBar({
  used,
  capacity,
  reserved = 0,
  label,
  tone,
}: {
  used: number;
  capacity: number;
  reserved?: number;
  label?: string;
  tone?: CapacityTone;
}) {
  const usedPct = capacity > 0 ? clampPercent((used / capacity) * 100) : 0;
  const reservedPct = capacity > 0 ? clampPercent((reserved / capacity) * 100) : 0;
  const resolvedTone = tone ?? capacityTone(used, capacity);
  return (
    <div className={`capacity-bar capacity-${resolvedTone}`}>
      <div className="capacity-bar-label">
        <span>{label ?? 'Kapazität'}</span>
        <strong>{Math.round(used).toLocaleString('de-DE')} / {Math.round(capacity).toLocaleString('de-DE')}</strong>
      </div>
      <div
        className="capacity-bar-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={Math.max(0, capacity)}
        aria-valuenow={Math.max(0, Math.min(capacity, used))}
      >
        <i className="capacity-bar-used" style={{ width: `${usedPct}%` }} />
        {reserved > 0 && <i className="capacity-bar-reserved" style={{ left: `${usedPct}%`, width: `${Math.min(reservedPct, 100 - usedPct)}%` }} />}
      </div>
    </div>
  );
}

const STATUS_ICONS: Record<VisualTone, JSX.Element | undefined> = {
  neutral: undefined,
  good: <CheckCircle2 size={12} />,
  info: <Info size={12} />,
  warning: <TriangleAlert size={12} />,
  danger: <AlertCircle size={12} />,
};

export function StatusChip({ children, tone = 'neutral' }: { children: ReactNode; tone?: VisualTone }) {
  return (
    <span className={`status-chip tone-${tone}`}>
      {STATUS_ICONS[tone]}
      {children}
    </span>
  );
}

export function EmptyStateCard({
  title,
  detail,
  icon,
  action,
}: {
  title: string;
  detail: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state-card">
      {icon && <span>{icon}</span>}
      <strong>{title}</strong>
      <p>{detail}</p>
      {action}
    </div>
  );
}
