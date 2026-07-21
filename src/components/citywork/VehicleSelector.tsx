import { Clock3, Fuel, Gauge, LockKeyhole, Plane, ShieldCheck, TrainFront, Truck } from 'lucide-react';
import { uiImage, vehicleImage } from '../../assets/registry.ts';
import type { CargoPlan, CargoRouteEvaluation } from '../../game/activities/logistics.ts';
import type { ActivityVehicleDef, DriveVehicle } from '../../game/config/types.ts';
import { t } from '../../i18n/index.ts';

export function VehicleSelector({
  vehicles,
  futureVehicles,
  level,
  selected,
  cargoPlan,
  cargoRoute,
  cargoAssetKey,
  onSelect,
}: {
  vehicles: ActivityVehicleDef[];
  futureVehicles: ActivityVehicleDef[];
  level: number;
  selected: DriveVehicle;
  cargoPlan?: CargoPlan;
  cargoRoute?: CargoRouteEvaluation;
  cargoAssetKey?: string;
  onSelect(vehicle: DriveVehicle): void;
}) {
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selected);
  const initialLoad = cargoPlan ? Math.min(cargoPlan.capacity, cargoPlan.totalRequired) : 0;
  const lastStop = cargoRoute?.stops.at(-1);
  const plannedLoad = lastStop?.cargoAfter ?? initialLoad;
  const restCapacity = Math.max(0, (cargoPlan?.capacity ?? 0) - plannedLoad);
  const loadPct = cargoPlan?.capacity ? Math.min(100, (plannedLoad / cargoPlan.capacity) * 100) : 0;
  const cargoImage = uiImage(cargoAssetKey ?? cargoKey(cargoPlan?.resource));

  return (
    <section className="citywork-v4-vehicle-zone">
      <div className="citywork-v4-section-head">
        <div><small>Schritt 2</small><strong>Fahrzeug & Ladung</strong></div>
        <span>{vehicles.filter((vehicle) => vehicle.unlockLevel <= level).length} verfügbar</span>
      </div>

      <div className="citywork-v4-vehicle-strip">
        {vehicles.map((vehicle) => {
          const image = vehicleImage(vehicle.imageKey);
          const locked = vehicle.unlockLevel > level;
          return (
            <button
              type="button"
              key={vehicle.id}
              className={`citywork-v4-vehicle${selected === vehicle.id ? ' selected' : ''}${locked ? ' locked' : ''}`}
              onClick={() => !locked && onSelect(vehicle.id)}
              disabled={locked}
            >
              <span className="citywork-v4-vehicle-art">
                {image ? <img src={image} alt="" /> : <Truck size={50} />}
                {locked && <i><LockKeyhole size={12} /> L{vehicle.unlockLevel}</i>}
              </span>
              <span className="citywork-v4-vehicle-name">
                <strong>{t(vehicle.nameKey)}</strong>
                <i aria-hidden="true" />
              </span>
              <span className="citywork-v4-vehicle-facts">
                <b><ShieldCheck size={12} /> {vehicle.capacity.toLocaleString('de-DE')}</b>
                <b><Gauge size={12} /> {vehicle.speedKph} km/h</b>
                <b><Clock3 size={12} /> {vehicle.loadTimeSec ?? 8}s laden</b>
              </span>
              <span className="citywork-v4-vehicle-tags">
                <em>{t(vehicle.strengthsKeys[0]!)}</em>
                <em>{t(vehicle.strengthsKeys[1]!)}</em>
                <b>{t(vehicle.weaknessesKeys[0]!)}</b>
                <b>{t(vehicle.weaknessesKeys[1]!)}</b>
              </span>
            </button>
          );
        })}
      </div>

      <div className="citywork-v4-cargo">
        <div className="citywork-v4-cargo-art">
          {cargoImage ? <img src={cargoImage} alt="" /> : <Truck size={40} />}
        </div>
        <div className="citywork-v4-cargo-main">
          <small>Geplante Ladung · {selectedVehicle ? t(selectedVehicle.nameKey) : 'Fahrzeug'}</small>
          <strong>{plannedLoad.toLocaleString('de-DE')} / {(cargoPlan?.capacity ?? 0).toLocaleString('de-DE')}</strong>
          <div className="citywork-v4-cargo-bar"><i style={{ width: `${loadPct}%` }} /></div>
          <span>
            <b>{cargoPlan ? t(`resource.${cargoPlan.resource}`) : 'Keine Fracht'}</b>
            <em>Restkapazität {restCapacity.toLocaleString('de-DE')}</em>
          </span>
        </div>
        <div className="citywork-v4-cargo-stats">
          <span><Fuel size={14} /> {selectedVehicle ? t(`vehicle.consumption.${selectedVehicle.consumption}`) : '–'}</span>
          <span><Truck size={14} /> {cargoPlan?.totalRequired.toLocaleString('de-DE') ?? 0} Bedarf</span>
          <span className={(cargoRoute?.requiredResupplies ?? 0) > (cargoRoute?.plannedResupplies ?? 0) ? 'warn' : ''}>
            <Clock3 size={14} /> {cargoRoute?.plannedResupplies ?? 0}/{cargoRoute?.requiredResupplies ?? Math.max(0, (cargoPlan?.loadsRequired ?? 1) - 1)} Nachfüllungen
          </span>
        </div>
      </div>

      {futureVehicles.length > 0 && (
        <div className="citywork-v4-future">
          <span>Spätere Transportmittel</span>
          {futureVehicles.map((vehicle) => (
            <div key={vehicle.id}>
              {vehicle.id === 'freight_train' ? <TrainFront size={18} /> : <Plane size={18} />}
              <strong>{t(vehicle.nameKey)}</strong>
              <small>ab Level {vehicle.unlockLevel}</small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function cargoKey(resource: CargoPlan['resource'] | undefined) {
  if (!resource) return 'cargo_materials';
  return `cargo_${resource === 'freshwater' ? 'water' : resource}`;
}
