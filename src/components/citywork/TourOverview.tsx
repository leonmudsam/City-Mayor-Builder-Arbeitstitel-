import { ArrowDownToLine, Flag, RotateCcw, Warehouse } from 'lucide-react';
import { BuildingArt } from '../art/index.ts';
import type { CargoRouteStop } from '../../game/activities/logistics.ts';
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
  vehicle,
}: {
  source: TourDisplayPoint;
  targets: TourDisplayPoint[];
  orderedTargetIds: string[];
  cargoStops?: CargoRouteStop[];
  vehicle?: ActivityVehicleDef;
}) {
  const targetMap = new Map(targets.map((target) => [target.id, target]));
  const stops = cargoStops?.length
    ? cargoStops
    : [
        { type: 'source' as const, buildingId: source.id, pathIndex: 0, amount: 0, cargoAfter: 0 },
        ...orderedTargetIds.map((buildingId, index) => ({
          type: 'delivery' as const,
          buildingId,
          pathIndex: index + 1,
          amount: 0,
          cargoAfter: 0,
        })),
      ];

  return (
    <section className="citywork-v4-tour">
      <div className="citywork-v4-section-head">
        <div><small>Live aus deiner Route</small><strong>Tourübersicht</strong></div>
        <span>{orderedTargetIds.length}/{targets.length} Stopps</span>
      </div>
      <div className="citywork-v4-tour-list">
        {stops.map((stop, index) => {
          const point = stop.type === 'delivery' ? targetMap.get(stop.buildingId) : source;
          if (!point) return null;
          const next = stops[index + 1];
          const distanceTiles = next ? Math.max(0, next.pathIndex - stop.pathIndex) : 0;
          const meta = stopMeta(stop.type);
          return (
            <article key={`${stop.type}-${stop.buildingId}-${stop.pathIndex}`} className={`citywork-v4-tour-stop ${stop.type}`}>
              <span className="citywork-v4-tour-line"><i>{index + 1}</i></span>
              <span className="citywork-v4-tour-art">
                <BuildingArt id={point.buildingDefId} category={point.category} stage={point.upgradeLevel} px={48} />
              </span>
              <div>
                <small>{meta.icon}{meta.label}</small>
                <strong>{point.label}</strong>
                <span>{stop.amount > 0 ? `${stop.amount.toLocaleString('de-DE')} laden/liefern` : point.subtitle}</span>
              </div>
              <dl>
                <div><dt>Ladung danach</dt><dd>{stop.amount > 0 ? stop.cargoAfter.toLocaleString('de-DE') : '–'}</dd></div>
                <div><dt>Zeit</dt><dd>{stop.type === 'delivery' ? `${vehicle?.unloadTimeSecPerTarget ?? 5}s` : `${vehicle?.loadTimeSec ?? 8}s`}</dd></div>
                {next && <div><dt>Nächste Etappe</dt><dd>{formatDistance(distanceTiles)}</dd></div>}
              </dl>
            </article>
          );
        })}
        {orderedTargetIds.length < targets.length && (
          <div className="citywork-v4-tour-open">
            <Flag size={18} />
            <span><strong>{targets.length - orderedTargetIds.length} Ziele offen</strong><small>Führe die Route über die blauen Liefermarker.</small></span>
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
