import { Clock3, Flag, PackageOpen, RotateCcw } from 'lucide-react';
import type { ActivityCargoStatus, ActivityRoutePreview } from '../../game/commands/controller.ts';
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
  cargoStatus,
}: {
  preview: ActivityRoutePreview | undefined;
  roadPath: { x: number; y: number }[];
  targetsTotal: number;
  /** Laufender Auftrag: der WIRKLICHE Ladezustand des Wagens (D-057). */
  cargoStatus?: ActivityCargoStatus | undefined;
}) {
  const cargo = preview?.cargoPlan;
  const duration = preview?.infrastructure?.estimatedDurationMs ?? preview?.analysis?.estimatedDurationMs;
  const reached = preview?.progress.deliveryTargetsCompleted ?? preview?.orderedTargetIds.length ?? 0;

  return (
    <div className="citywork-v4-summary citywork-smart-summary" aria-label="Wichtigste Routendaten">
      <Metric
        icon={<PackageOpen size={17} />}
        label="Ladung"
        // § D-057: Läuft der Auftrag, zeigt die Anzeige, was WIRKLICH auf dem
        // Wagen liegt — vorher stand hier der Gesamtbedarf der Tour, also eine
        // Zahl, die den Wagen nie beschrieben hat.
        value={
          cargoStatus
            ? `${Math.round(cargoStatus.onboard).toLocaleString('de-DE')}${cargoStatus.capacity > 0 ? ` / ${cargoStatus.capacity.toLocaleString('de-DE')}` : ''}`
            : cargo
              ? cargo.totalRequired.toLocaleString('de-DE')
              : 'Keine Fracht'
        }
        hint={
          cargoStatus
            ? `${t(`resource.${cargoStatus.resource}`)} · ${cargoStatus.carriedLoads} von ${cargoStatus.openTargets} Stopps gedeckt`
            : cargo
              ? t(`resource.${cargo.resource}`)
              : 'Einsatzauftrag'
        }
        {...(cargoStatus && cargoStatus.carriedLoads === 0 && cargoStatus.openTargets > 0
          ? { tone: 'warn' as const }
          : {})}
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
        // Kein „automatisch eingeplant" mehr: Es wird nichts automatisch
        // nachgeladen. Entweder passt die Tour auf den Wagen, oder der Spieler
        // fährt ein Lager an (D-039: automatisiert wird Ausführung, nie Wahl).
        value={
          cargoStatus
            ? cargoStatus.needsReload
              ? `${Math.max(1, cargoStatus.openTargets - cargoStatus.carriedLoads)}×`
              : 'Nein'
            : reloadsPlanned(preview) === 0
              ? 'Nein'
              : `${reloadsPlanned(preview)}×`
        }
        hint={
          cargoStatus
            ? cargoStatus.needsReload
              ? 'an einem Lager aufnehmen'
              : 'Ladung reicht'
            : reloadsPlanned(preview) === 0
              ? 'direkte Tour'
              : 'Traglast reicht nicht für alle Stopps'
        }
        {...(cargoStatus?.needsReload ? { tone: 'warn' as const } : {})}
      />
    </div>
  );
}

/** Vor dem Start: wie oft die geplante Tour die Traglast überschreitet. */
function reloadsPlanned(preview: ActivityRoutePreview | undefined): number {
  return preview?.cargoRoute?.plannedResupplies ?? Math.max(0, (preview?.cargoPlan?.loadsRequired ?? 1) - 1);
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
