import {
  Boxes,
  Building2,
  ChevronRight,
  CircleDollarSign,
  Factory,
  LocateFixed,
  PackageCheck,
  PackageOpen,
  Truck,
  Warehouse,
  X,
} from 'lucide-react';
import { useMemo } from 'react';
import type { ResourceId } from '../../game/types.ts';
import { getMapApi, useGame, useUiStore } from '../../state/store.ts';
import { CapacityBar, DataMetric, GamePanel, StatusChip } from '../common/GamePanel.tsx';
import { buildResourceNetworkView } from './adapters.ts';
import type { ResourceLocationView } from './viewModels.ts';

function locationIcon(kind: ResourceLocationView['kind']) {
  if (kind === 'network') return <Boxes size={18} />;
  if (kind === 'production') return <Factory size={18} />;
  if (kind === 'transport') return <Truck size={18} />;
  if (kind === 'town_hall') return <Building2 size={18} />;
  return <Warehouse size={18} />;
}

export function ResourceNetworkPanel({ resource }: { resource: ResourceId }) {
  const game = useGame();
  const { closeResourceNetwork, selectBuilding } = useUiStore();
  const view = useMemo(() => buildResourceNetworkView(game, resource), [game, game.version, resource]);

  const focus = (buildingId: string | undefined) => {
    if (!buildingId) return;
    const building = game.state.buildings[buildingId];
    const def = building && game.config.buildings.get(building.defId);
    if (!building || !def) return;
    getMapApi()?.focusGround(building.x + def.size.w / 2, building.y + def.size.h / 2, 35);
  };

  return (
    <GamePanel
      title={`${view.resourceLabel} · Gesamtübersicht`}
      eyebrow="Ressourcennetz"
      icon={<Boxes size={24} />}
      className="resource-network-panel"
      actions={<button type="button" className="icon-button" onClick={closeResourceNetwork}><X size={18} /></button>}
    >
      <div className="resource-network-headline">
        <DataMetric label="Gesamtbestand" value={view.totalOwned.toLocaleString('de-DE')} icon={<PackageOpen size={18} />} tone="info" />
        <DataMetric label="Für Bau verfügbar" value={view.accessibleForConstruction.toLocaleString('de-DE')} icon={<PackageCheck size={18} />} tone="good" />
        <DataMetric label="In Betriebslagern" value={view.inProductionBuildings.toLocaleString('de-DE')} icon={<Factory size={18} />} tone="warning" />
        <DataMetric label="Unterwegs" value={view.inTransit.toLocaleString('de-DE')} icon={<Truck size={18} />} />
        <DataMetric label="Reserviert" value={view.reserved.toLocaleString('de-DE')} icon={<CircleDollarSign size={18} />} />
      </div>

      {/* § R3 Lagervergleich: Wo staut es sich? Nur physische Standorte — der
          zentrale Pool hat im aktuellen Modell keinen Ort (§7.2). */}
      {view.storageComparison.locations > 0 && (
        <div className="resource-network-headline">
          <DataMetric
            label="Lager belegt"
            value={`${view.storageComparison.utilizationPct} %`}
            icon={<Warehouse size={18} />}
            tone={view.storageComparison.utilizationPct >= 85 ? 'warning' : 'info'}
            detail={`${view.storageComparison.totalStored.toLocaleString('de-DE')} / ${view.storageComparison.totalCapacity.toLocaleString('de-DE')}`}
          />
          <DataMetric label="Freier Lagerplatz" value={view.storageComparison.totalFree.toLocaleString('de-DE')} icon={<PackageOpen size={18} />} />
          <DataMetric
            label="Standorte (voll/fast voll)"
            value={`${view.storageComparison.locations} (${view.storageComparison.fullLocations})`}
            {...(view.storageComparison.fullLocations > 0 ? { tone: 'warning' as const } : {})}
          />
          {view.storageComparison.fullestLocationName && (
            <DataMetric
              label="Engpass zuerst"
              value={view.storageComparison.fullestLocationName}
              detail={`${view.storageComparison.fullestPct} % belegt`}
            />
          )}
        </div>
      )}

      <div className="resource-location-list">
        <header>
          <div><h3>Standorte</h3><small>Echte lokale Lager und zentraler Controller-Bestand</small></div>
          <span>{view.locations.length}</span>
        </header>
        {view.locations.map((location) => (
          <article key={location.id} className={`resource-location location-${location.kind}`}>
            <span className="resource-location-icon">{locationIcon(location.kind)}</span>
            <div className="resource-location-copy">
              <strong>{location.displayName}</strong>
              <small>{location.regionName}</small>
              {location.detail && <p>{location.detail}</p>}
            </div>
            <div className="resource-location-stock">
              <strong>{location.storedAmount.toLocaleString('de-DE')}</strong>
              <small>{view.resourceLabel}</small>
              <StatusChip tone={location.status === 'full' ? 'danger' : location.status === 'nearly_full' ? 'warning' : location.status === 'network' ? 'info' : 'good'}>
                {location.statusLabel}
              </StatusChip>
            </div>
            {location.capacity !== undefined && (
              <CapacityBar
                used={location.storedAmount}
                reserved={location.reservedAmount}
                capacity={location.capacity}
                label="Kapazität"
              />
            )}
            {location.buildingId && (
              <div className="resource-location-actions">
                <button type="button" className="secondary-action" onClick={() => focus(location.buildingId)}>
                  <LocateFixed size={14} /> Standort
                </button>
                <button type="button" className="secondary-action" onClick={() => selectBuilding(location.buildingId)}>
                  Details <ChevronRight size={14} />
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="resource-data-note">
        <Warehouse size={17} />
        <div>
          <strong>Datenabgrenzung</strong>
          {view.dataNotes.map((note) => <p key={note}>{note}</p>)}
        </div>
      </div>
    </GamePanel>
  );
}
