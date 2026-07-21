import { Clock3, Fuel, Gauge, Medal, PackageOpen, Route, TrafficCone } from 'lucide-react';
import type { ActivityRoutePreview } from '../../game/commands/controller.ts';
import { formatDuration, t } from '../../i18n/index.ts';

export function RouteSummary({ preview, roadPath }: { preview: ActivityRoutePreview | undefined; roadPath: { x: number; y: number }[] }) {
  const analysis = preview?.analysis;
  const infrastructure = preview?.infrastructure;
  const cargo = preview?.cargoPlan;
  const loadUtilisation = cargo?.capacity ? Math.min(100, (Math.min(cargo.capacity, cargo.totalRequired) / cargo.capacity) * 100) : 0;
  const distance = analysis ? `${((analysis.distanceTiles * 4) / 1000).toFixed(1).replace('.', ',')} km` : `${Math.max(0, roadPath.length - 1)} Kacheln`;
  const duration = infrastructure?.estimatedDurationMs ?? analysis?.estimatedDurationMs;
  const empty = preview?.cargoRoute?.emptyTravelRatio ?? infrastructure?.emptyTravelRatio;

  return (
    <div className="citywork-v4-summary">
      <Metric icon={<Route size={17} />} label="Distanz" value={distance} hint={analysis ? 'geplante Strecke' : 'Route wächst live'} />
      <Metric icon={<Clock3 size={17} />} label="Fahrzeit" value={duration ? formatDuration(duration) : '–'} hint="inkl. Be-/Entladen" />
      <Metric icon={<Fuel size={17} />} label="Leerfahrt" value={empty !== undefined ? `${Math.round(empty * 100)} %` : '–'} hint={empty !== undefined && empty <= 0.2 ? 'Gut' : 'reduzierbar'} {...(empty !== undefined && empty > 0.35 ? { tone: 'warn' as const } : {})} />
      <Metric icon={<PackageOpen size={17} />} label="Nachfüllen" value={String(preview?.cargoRoute?.plannedResupplies ?? 0)} hint={`${preview?.cargoRoute?.requiredResupplies ?? Math.max(0, (cargo?.loadsRequired ?? 1) - 1)} erforderlich`} />
      <Metric icon={<Gauge size={17} />} label="Auslastung" value={`${Math.round(loadUtilisation)} %`} hint={`${cargo?.totalRequired.toLocaleString('de-DE') ?? 0} Gesamtbedarf`} />
      <Metric icon={<TrafficCone size={17} />} label="Verkehr" value={analysis ? t(`ui.route.risk.${analysis.congestionRisk}`) : 'Wird geprüft'} hint="echte Netzlast" {...(analysis?.congestionRisk === 'high' ? { tone: 'bad' as const } : analysis?.congestionRisk === 'medium' ? { tone: 'warn' as const } : {})} />
      <div className="citywork-v4-quality">
        <span><Medal size={18} /> Erwartete Qualität</span>
        <strong>{analysis ? t(`ui.route.medal.${analysis.expectedMedal}`) : 'Route vervollständigen'}</strong>
        <div><i style={{ width: `${analysis?.efficiencyScore ?? 0}%` }} /></div>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: JSX.Element;
  label: string;
  value: string;
  hint: string;
  tone?: 'warn' | 'bad';
}) {
  return (
    <div className={`citywork-v4-metric${tone ? ` ${tone}` : ''}`}>
      <span>{icon}{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}
