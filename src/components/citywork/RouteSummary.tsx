import { Clock3, Flag, PackageOpen, RotateCcw } from 'lucide-react';
import type { ActivityRoutePreview } from '../../game/commands/controller.ts';
import { formatDuration, t } from '../../i18n/index.ts';

/**
 * Die primäre Stadtarbeit-Zusammenfassung zeigt bewusst nur die vier Werte,
 * die vor dem Start eine Entscheidung verändern. Tiefere Qualitäts- und
 * Verkehrsdaten bleiben in den Controller-ReadModels, aber nicht in der
 * Standardansicht.
 */
export function RouteSummary({
  preview,
  roadPath,
  targetsTotal,
}: {
  preview: ActivityRoutePreview | undefined;
  roadPath: { x: number; y: number }[];
  targetsTotal: number;
}) {
  const cargo = preview?.cargoPlan;
  const duration = preview?.infrastructure?.estimatedDurationMs ?? preview?.analysis?.estimatedDurationMs;
  const reloads =
    preview?.cargoRoute?.plannedResupplies ??
    Math.max(0, (cargo?.loadsRequired ?? 1) - 1);
  const reached = preview?.progress.deliveryTargetsCompleted ?? preview?.orderedTargetIds.length ?? 0;

  return (
    <div className="citywork-v4-summary citywork-smart-summary" aria-label="Wichtigste Routendaten">
      <Metric
        icon={<PackageOpen size={17} />}
        label="Ladung"
        value={cargo ? cargo.totalRequired.toLocaleString('de-DE') : 'Keine Fracht'}
        hint={cargo ? t(`resource.${cargo.resource}`) : 'Einsatzauftrag'}
      />
      <Metric
        icon={<Flag size={17} />}
        label="Ziele"
        value={`${reached}/${targetsTotal}`}
        hint={reached === targetsTotal ? 'vollständig geplant' : 'noch nicht verbunden'}
        {...(reached === targetsTotal ? {} : { tone: 'warn' as const })}
      />
      <Metric
        icon={<Clock3 size={17} />}
        label="Fahrzeit"
        value={duration ? formatDuration(duration) : '–'}
        hint={roadPath.length > 1 ? 'inkl. Be- und Entladen' : 'Straße fehlt'}
      />
      <Metric
        icon={<RotateCcw size={17} />}
        label="Nachladen"
        value={reloads === 0 ? 'Nein' : `${reloads}×`}
        hint={reloads === 0 ? 'direkte Tour' : 'automatisch eingeplant'}
      />
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
  tone?: 'warn';
}) {
  return (
    <div className={`citywork-v4-metric${tone ? ` ${tone}` : ''}`}>
      <span>{icon}{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}
