import { Droplets } from 'lucide-react';

// Top-centre supply banner (mockup §7): "Wasser-Versorgung — 92 % abgedeckt".
// Shown while a radius/coverage building is selected (or the overlay mode is on)
// so the player reads the headline supply figure without opening a panel. Pure
// presentation — the label and detail are derived from simulation counts by the
// caller (MapView), never from screen pixels.
export function ServiceOverlayBanner({
  label,
  detail,
  tone,
}: {
  label: string;
  detail: string;
  tone: 'good' | 'warn' | 'bad';
}) {
  return (
    <div className={`service-banner service-banner-${tone}`}>
      <span className="service-banner-icon">
        <Droplets size={17} />
      </span>
      <span className="service-banner-text">
        <strong>{label}</strong>
        <span>{detail}</span>
      </span>
    </div>
  );
}
