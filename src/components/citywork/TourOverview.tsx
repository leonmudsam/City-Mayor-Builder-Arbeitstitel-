import { AlertTriangle, ArrowDownToLine, Flag, PackageCheck, RotateCcw, Warehouse } from 'lucide-react';
import { BuildingArt } from '../art/index.ts';
import type { ActivityProgress, CargoRouteStop } from '../../game/activities/logistics.ts';
import type { ActivityVehicleDef } from '../../game/config/types.ts';
import type { BuildingCategory } from '../../game/types.ts';

export interface TourDisplayPoint {
  id: string;
  label: string;
  subtitle: string;
  buildingDefId: string;
  category: BuildingCategory;
  upgradeLevel: number;
}

export function TourOverview({
  source,
  targets,
  orderedTargetIds,
  cargoStops,
  progress,
  vehicle,
}: {
  source: TourDisplayPoint;
  targets: TourDisplayPoint[];
  orderedTargetIds: string[];
  cargoStops?: CargoRouteStop[];
  progress?: ActivityProgress;
  vehicle?: ActivityVehicleDef;
}) {
  const targetMap = new Map(targets.map((target) => [target.id, target]));
  const stops: CargoRouteStop[] = cargoStops?.length
    ? cargoStops
    : [
        { type: 'source', buildingId: source.id, pathIndex: 0, amount: 0, cargoAfter: 0, status: 'completed' },
        ...orderedTargetIds.map((buildingId, index) => ({
          type: 'delivery' as const,
          buildingId,
          pathIndex: index + 1,
          amount: 0,
          cargoAfter: 0,
          status: 'completed' as const,
        })),
      ];
  // §3.2: Lieferziele und Nachfüllstopps werden NIE in einer Zahl vermischt.
  const deliveriesDone = progress?.deliveryTargetsCompleted ?? orderedTargetIds.length;
  const deliveriesTotal = progress?.deliveryTargetsTotal ?? targets.length;
  const resupplyDone = progress?.resupplyStopsCompleted ?? 0;
  const resupplyTotal = progress?.resupplyStopsTotal ?? 0;

  return (
    <section className="citywork-v4-tour">
      <div className="citywork-v4-section-head">
        <div><small>Live aus deiner Route</small><strong>Tourübersicht</strong></div>
        <span>Lieferziele {deliveriesDone}/{deliveriesTotal}</span>
      </div>
      {resupplyTotal > 0 && (
        <p className="citywork-v4-tour-resupply">Nachladen {resupplyDone}/{resupplyTotal}</p>
      )}
      {cargoStops && cargoStops.length > 0 && vehicle && (
        <div className="citywork-cargo-timeline" aria-label="Ladungsverlauf">
          {cargoStops.map((stop, index) => {
            const before =
              stop.type === 'delivery'
                ? stop.cargoAfter + stop.amount
                : Math.max(0, stop.cargoAfter - stop.amount);
            const delta = stop.type === 'delivery' ? -stop.amount : stop.amount;
            const pct = vehicle.capacity > 0 ? Math.min(100, (stop.cargoAfter / vehicle.capacity) * 100) : 0;
            return (
              <div key={`cargo-${stop.type}-${stop.pathIndex}-${index}`} className={`cargo-timeline-stop ${stop.type} ${stop.status}`}>
                <span>{stopMeta(stop.type).icon}</span>
                <div>
                  <small>{before.toLocaleString('de-DE')} → {stop.cargoAfter.toLocaleString('de-DE')}</small>
                  <i><b style={{ width: `${pct}%` }} /></i>
                </div>
                <strong className={delta < 0 ? 'out' : 'in'}>{delta > 0 ? '+' : ''}{delta.toLocaleString('de-DE')}</strong>
              </div>
            );
          })}
          <p><PackageCheck size={13} /> Jeder Wert stammt aus der Cargo-Auswertung der gezeichneten Route.</p>
        </div>
      )}
      <div className="citywork-v4-tour-list">
        {stops.map((stop, index) => {
          const point = stop.type === 'delivery' ? targetMap.get(stop.buildingId) : source;
          if (!point) return null;
          const next = stops[index + 1];
          const distanceTiles = next ? Math.max(0, next.pathIndex - stop.pathIndex) : 0;
          const skipped = stop.status === 'skipped';
          const meta = skipped
            ? { label: 'Zu wenig Ladung', icon: <AlertTriangle size={12} /> }
            : stopMeta(stop.type);
          return (
            <article
              key={`${stop.type}-${stop.buildingId}-${stop.pathIndex}`}
              className={`citywork-v4-tour-stop ${stop.type}${skipped ? ' skipped' : ''}`}
            >
              <span className="citywork-v4-tour-line"><i>{index + 1}</i></span>
              <span className="citywork-v4-tour-art">
                <BuildingArt id={point.buildingDefId} category={point.category} stage={point.upgradeLevel} px={48} />
              </span>
              <div>
                <small>{meta.icon}{meta.label}</small>
                <strong>{point.label}</strong>
                <span>
                  {skipped
                    ? 'Leer vorbeigefahren — fülle nach und fahre erneut vorbei.'
                    : stop.amount > 0
                      ? `${stop.amount.toLocaleString('de-DE')} laden/liefern`
                      : point.subtitle}
                </span>
              </div>
              <dl>
                <div><dt>Ladung danach</dt><dd>{stop.amount > 0 ? stop.cargoAfter.toLocaleString('de-DE') : '–'}</dd></div>
                <div><dt>Zeit</dt><dd>{stop.type === 'delivery' ? `${vehicle?.unloadTimeSecPerTarget ?? 5}s` : `${vehicle?.loadTimeSec ?? 8}s`}</dd></div>
                {next && <div><dt>Nächste Etappe</dt><dd>{formatDistance(distanceTiles)}</dd></div>}
              </dl>
            </article>
          );
        })}
        {deliveriesDone < deliveriesTotal && (
          <div className="citywork-v4-tour-open">
            <Flag size={18} />
            <span><strong>{deliveriesTotal - deliveriesDone} Ziele offen</strong><small>Führe die Route über die blauen Liefermarker.</small></span>
          </div>
        )}
      </div>
    </section>
  );
}

function stopMeta(type: CargoRouteStop['type']) {
  if (type === 'resupply') return { label: 'Nachfüllen', icon: <RotateCcw size={12} /> };
  if (type === 'delivery') return { label: 'Lieferstopp', icon: <ArrowDownToLine size={12} /> };
  return { label: 'Start / Quelle', icon: <Warehouse size={12} /> };
}

function formatDistance(tiles: number) {
  const metres = tiles * 4;
  return metres >= 1000 ? `${(metres / 1000).toFixed(1).replace('.', ',')} km` : `${metres} m`;
}
