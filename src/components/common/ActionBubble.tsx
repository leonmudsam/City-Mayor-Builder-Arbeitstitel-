import { type ReactNode } from 'react';

// A round action button (§4): icon in a circle with a label beneath, in the
// tone of the action (neutral / primary / danger). Used as the action cluster
// on the floating building sheet, and reusable anywhere a compact, tappable
// action is wanted (mobile-friendly hit target).

export function ActionBubble({
  icon,
  label,
  tone = 'neutral',
  disabled = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  tone?: 'neutral' | 'primary' | 'danger';
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`action-bubble action-bubble-${tone}`} onClick={onClick} disabled={disabled} title={label}>
      <span className="action-bubble-ring">{icon}</span>
      <span className="action-bubble-label">{label}</span>
    </button>
  );
}
