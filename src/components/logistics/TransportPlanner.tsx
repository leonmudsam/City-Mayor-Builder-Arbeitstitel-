import { AlertTriangle, ArrowRight, Clock3, Coins, PackageOpen, Route, Truck, Warehouse, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { vehicleImage } from '../../assets/registry.ts';
import type { DriveVehicle, ResourceId } from '../../game/types.ts';
import { formatDuration } from '../../i18n/index.ts';
import { useGame, useUiStore } from '../../state/store.ts';
import { CapacityBar, DataMetric, EmptyStateCard, StatusChip } from '../common/GamePanel.tsx';
import { buildTransportPlannerView } from '../operations/adapters.ts';

export function TransportPlanner({
  sourceBuildingId,
  resource,
  compact = false,
  onClose,
}: {
  sourceBuildingId: string;
  resource: ResourceId;
  compact?: boolean;
  onClose?: () => void;
}) {
  const game = useGame();
  const pushToast = useUiStore((state) => state.pushToast);
  const targets = game.getInventoryTransferTargets(sourceBuildingId, resource);
  const unlocked = game.config.activities.vehicles.find(
    (vehicle) => !vehicle.future && vehicle.unlockLevel <= game.state.level.current,
  );
  const [amount, setAmount] = useState(() => Math.max(1, Math.floor(game.getAvailableForTransfer(sourceBuildingId, resource))));
  const [targetId, setTargetId] = useState<string | undefined>(() => targets[0]?.buildingId);
  const [methodId, setMethodId] = useState<string | undefined>(() => unlocked?.id ?? 'handcart');

  const view = useMemo(
    () => buildTransportPlannerView(game, sourceBuildingId, resource, amount, targetId, methodId),
    [amount, game, game.version, methodId, resource, sourceBuildingId, targetId],
  );

  useEffect(() => {
    if (view.selectedTargetId !== targetId) setTargetId(view.selectedTargetId);
  }, [targetId, view.selectedTargetId]);
  useEffect(() => {
    setAmount((current) => Math.max(0, Math.min(current, view.availableAmount)));
  }, [view.availableAmount]);

  const selectedTarget = view.targets.find((target) => target.buildingId === view.selectedTargetId);
  const selectedMethod = view.methods.find((method) => method.id === view.selectedMethodId);
  const confirm = () => {
    if (!view.canConfirm || !view.selectedTargetId || !view.selectedMethodId || view.selectedMethodId === 'handcart') return;
    const result = game.createInventoryTransfer({
      sourceBuildingId,
      targetBuildingId: view.selectedTargetId,
      resource,
      amount: view.amount,
      vehicleId: view.selectedMethodId as DriveVehicle,
    });
    if (!result.ok) {
      pushToast(`Transport konnte nicht gestartet werden: ${result.error}`, 'error');
      return;
    }
    pushToast(`${view.amount} ${view.resourceLabel} für den Transport reserviert.`, 'success');
    onClose?.();
  };

  return (
    <section className={`transport-planner${compact ? ' compact' : ''}`}>
      <header className="transport-planner-head">
        <div>
          <small>Transport & Logistik</small>
          <h4>{view.sourceName} <ArrowRight size={14} /> Ziel auswählen</h4>
        </div>
        {onClose && <button type="button" className="icon-button" onClick={onClose}><X size={16} /></button>}
      </header>

      {view.availableAmount <= 0 ? (
        <EmptyStateCard
          icon={<PackageOpen size={21} />}
          title={`Kein ${view.resourceLabel} verfügbar`}
          detail="Reservierte Ware bleibt sichtbar, kann aber nicht doppelt verplant werden."
        />
      ) : view.targets.length === 0 ? (
        <EmptyStateCard
          icon={<Warehouse size={21} />}
          title="Kein physisches Transportziel"
          detail="Es gibt noch kein aktives Gebäude, das diese Ressource in das zentrale Netz einlagern kann."
        />
      ) : (
        <>
          <div className="transport-flow" aria-label="Transportfluss">
            <span><Warehouse size={17} /><b>{view.sourceName}</b><small>{view.availableAmount} verfügbar</small></span>
            <i />
            <span><Truck size={17} /><b>{selectedMethod?.displayName ?? 'Methode wählen'}</b><small>{selectedMethod?.speedLabel ?? '–'}</small></span>
            <i />
            <span><PackageOpen size={17} /><b>{selectedTarget?.displayName ?? 'Ziel wählen'}</b><small>{selectedTarget?.regionName ?? '–'}</small></span>
          </div>

          <label className="transport-amount">
            <span>
              Transportmenge
              <strong>{view.amount} / {view.availableAmount} {view.resourceLabel}</strong>
            </span>
            <input
              type="range"
              min={1}
              max={Math.max(1, view.availableAmount)}
              value={Math.max(1, view.amount)}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </label>

          <div className="transport-choice-grid">
            <div>
              <h5>Transportmethode</h5>
              <div className="transport-method-list">
                {view.methods.map((method) => {
                  const image = method.imageKey ? vehicleImage(method.imageKey) : undefined;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      className={method.id === view.selectedMethodId ? 'selected' : ''}
                      disabled={!method.available}
                      title={method.disabledReason}
                      onClick={() => setMethodId(method.id)}
                    >
                      <span className="transport-method-art">
                        {image ? <img src={image} alt="" /> : <Truck size={24} />}
                      </span>
                      <span>
                        <strong>{method.displayName}</strong>
                        <small>{method.available ? `${method.capacity} Einheiten · ${method.speedLabel}` : method.disabledReason}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h5>Zielstandort</h5>
              <div className="transport-target-list">
                {view.targets.map((target) => (
                  <button
                    type="button"
                    key={target.buildingId}
                    className={target.buildingId === view.selectedTargetId ? 'selected' : ''}
                    onClick={() => setTargetId(target.buildingId)}
                  >
                    <span>
                      <strong>{target.displayName}</strong>
                      <small>{target.regionName}</small>
                    </span>
                    <StatusChip
                      tone={
                        target.routeQuality === 'good'
                          ? 'good'
                          : target.routeQuality === 'blocked'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {target.routeQualityLabel}
                    </StatusChip>
                    {target.distanceTiles > 0 && <small>{target.distanceTiles} Felder · {formatDuration(target.estimatedDurationSeconds * 1000)}</small>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {selectedMethod?.capacity ? (
            <CapacityBar
              label={`Ladung · ${view.loads ?? 0} Fahrt${view.loads === 1 ? '' : 'en'}`}
              used={Math.min(view.amount, selectedMethod.capacity)}
              capacity={selectedMethod.capacity}
            />
          ) : null}

          <div className="transport-metrics">
            <DataMetric label="Distanz" value={view.distanceTiles ?? '–'} detail="Felder" icon={<Route size={16} />} />
            <DataMetric label="Dauer" value={view.estimatedDurationSeconds ? formatDuration(view.estimatedDurationSeconds * 1000) : '–'} icon={<Clock3 size={16} />} />
            <DataMetric label="Straßenanteil" value={view.roadCoveragePct !== undefined ? `${view.roadCoveragePct}%` : '–'} tone={view.roadCoveragePct && view.roadCoveragePct >= 90 ? 'good' : 'warning'} />
            <DataMetric label="Betriebskosten" value={view.operatingCost ?? '–'} icon={<Coins size={16} />} />
          </div>

          {view.warnings.map((item) => (
            <p className={`inline-warning tone-${item.tone}`} key={`${item.code}:${item.label}`}>
              <AlertTriangle size={13} /> {item.label}
            </p>
          ))}

          <button type="button" className="primary-action full" disabled={!view.canConfirm} onClick={confirm}>
            <Truck size={16} /> Transport starten
          </button>
        </>
      )}
    </section>
  );
}
