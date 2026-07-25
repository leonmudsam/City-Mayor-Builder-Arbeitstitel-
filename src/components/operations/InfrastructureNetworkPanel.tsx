// Infrastruktur-Netz-Panel (§ Infrastruktur 2.0 / I5). Reiter Straßen · Brücken ·
// Anleger · Schiffe. Zeigt ausschließlich **echte** Werte aus den vorhandenen Reads
// (`getInfrastructureNetworkOverview`, `getHarborNetworkOverview`,
// `getShippingRoutes`) — keine erfundenen Kapazitäts-, Verkehrs- oder Netzlastdaten
// (CLAUDE.md: nichts vortäuschen). Fehlt eine Größe noch, steht sie hier nicht.

import { Anchor, Route, Ship, TrafficCone, Waves, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getMapApi, useGame, useUiStore } from '../../state/store.ts';
import { DataMetric, GamePanel, StatusChip } from '../common/GamePanel.tsx';

type Tab = 'roads' | 'bridges' | 'harbors' | 'ships';

const TABS: { id: Tab; label: string; icon: JSX.Element }[] = [
  { id: 'roads', label: 'Straßen', icon: <Route size={16} /> },
  { id: 'bridges', label: 'Brücken', icon: <TrafficCone size={16} /> },
  { id: 'harbors', label: 'Anleger', icon: <Anchor size={16} /> },
  { id: 'ships', label: 'Schiffe', icon: <Ship size={16} /> },
];

const n = (value: number) => value.toLocaleString('de-DE');

export function InfrastructureNetworkPanel() {
  const game = useGame();
  const { closeInfrastructureNetwork, selectBuilding } = useUiStore();
  const [tab, setTab] = useState<Tab>('roads');

  const data = useMemo(
    () => ({
      overview: game.getInfrastructureNetworkOverview(),
      harbors: game.getHarborNetworkOverview(),
      segments: game.getRoadSegments(),
      routes: game.getShippingRoutes(),
      shipping: game.getShippingNetworkOverview(),
    }),
    [game, game.version],
  );

  const focus = (buildingId: string) => {
    const building = game.state.buildings[buildingId];
    const def = building && game.config.buildings.get(building.defId);
    if (!building || !def) return;
    selectBuilding(buildingId);
    getMapApi()?.focusGround(building.x + def.size.w / 2, building.y + def.size.h / 2, 35);
  };

  return (
    <GamePanel
      title="Infrastruktur · Netzübersicht"
      eyebrow="Infrastruktur"
      icon={<Waves size={24} />}
      className="infrastructure-network-panel"
      actions={
        <button type="button" className="icon-button" onClick={closeInfrastructureNetwork}>
          <X size={18} />
        </button>
      }
    >
      <div className="infrastructure-tabs" role="tablist">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            className={`infrastructure-tab${tab === entry.id ? ' is-active' : ''}`}
            onClick={() => setTab(entry.id)}
          >
            {entry.icon} {entry.label}
          </button>
        ))}
      </div>

      {tab === 'roads' && (
        <>
          <div className="resource-network-headline">
            <DataMetric label="Straßenkacheln (verbunden)" value={n(data.overview.roadTiles)} icon={<Route size={18} />} tone="info" />
            <DataMetric label="Bodenstraßen gebaut" value={n(data.overview.groundRoadTiles)} icon={<Route size={18} />} />
            <DataMetric label="Teilnetze" value={n(data.segments.length)} icon={<Waves size={18} />} />
            <DataMetric
              label="Angeschlossene Gebäude"
              value={`${n(data.overview.connected)} / ${n(data.overview.buildings)}`}
              tone={data.overview.disconnected > 0 ? 'warning' : 'good'}
            />
          </div>
          <ul className="infrastructure-list">
            {data.segments.map((segment) => (
              <li key={segment.id} className="infrastructure-row">
                <span className="infrastructure-row-main">
                  {segment.kind === 'city' ? 'Stadtnetz' : 'Lokales Netz'}
                  <small> · {n(segment.tileCount)} Kacheln</small>
                </span>
                <StatusChip tone={segment.kind === 'city' ? 'good' : 'warning'}>
                  {segment.kind === 'city' ? 'Hauptnetz' : `${segment.harborIds.length} Anleger`}
                </StatusChip>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === 'bridges' && (
        <>
          <div className="resource-network-headline">
            <DataMetric
              label="Höhenstraßen / Brücken"
              value={n(data.overview.elevatedRoadTiles)}
              icon={<TrafficCone size={18} />}
              tone="info"
            />
          </div>
          <p className="panel-note">
            Höhenstraßen überbrücken Wasser und Klippen. Deck und Pfeiler entstehen automatisch aus
            dem Gelände — je Kachel entscheidet der Untergrund. Durchfahrtshöhe und Schiffsklassen
            sind noch nicht modelliert.
          </p>
        </>
      )}

      {tab === 'harbors' && (
        <>
          <div className="resource-network-headline">
            <DataMetric label="Anleger" value={n(data.harbors.harbors)} icon={<Anchor size={18} />} tone="info" />
            <DataMetric label="Betriebsbereit" value={n(data.harbors.operational)} tone="good" />
            <DataMetric label="Am Stadtnetz" value={n(data.harbors.onCityNetwork)} />
            <DataMetric
              label="Lokal, per Schiff anschließbar"
              value={n(data.harbors.linkableToCity)}
              {...(data.harbors.linkableToCity > 0 ? { tone: 'warning' as const } : {})}
            />
          </div>
          <p className="panel-note">
            Wasserwege gesamt: {n(data.overview.waterNodes)} Knoten · {n(data.overview.waterEdges)} Kanten.
            Lokale Teilnetze: {n(data.harbors.localSegments)}.
          </p>
        </>
      )}

      {tab === 'ships' && (
        <>
          <div className="resource-network-headline">
            <DataMetric label="Schiffsrouten" value={n(data.shipping.routes)} icon={<Ship size={18} />} tone="info" />
            <DataMetric label="Aktiv" value={n(data.shipping.active)} tone="good" />
            <DataMetric label="Pausiert" value={n(data.shipping.paused)} />
            <DataMetric
              label="Betriebskosten je Rundfahrt"
              value={n(data.shipping.operatingCostPerCycle)}
              {...(data.shipping.operatingCostPerCycle > 0 ? { tone: 'warning' as const } : {})}
            />
          </div>
          {data.routes.length === 0 ? (
            <p className="panel-note">
              Noch keine Schiffsroute. Eine Route verbindet zwei Anleger dauerhaft und bringt Ware
              über das Wasser, wo kein Landweg existiert.
            </p>
          ) : (
            <ul className="infrastructure-list">
              {data.routes.map((route) => (
                <li key={route.id} className="infrastructure-row">
                  <button type="button" className="infrastructure-row-main" onClick={() => focus(route.originHarborId)}>
                    {game.config.buildings.get(game.state.buildings[route.sourceBuildingId]?.defId ?? '')?.id ?? 'Quelle'}
                    <small>
                      {' '}· {n(route.waterDistance)} Kacheln Wasserweg · geliefert {n(route.deliveredTotal ?? 0)}
                    </small>
                  </button>
                  <div className="infrastructure-row-actions">
                    <StatusChip tone={route.paused ? 'warning' : route.waitingForCargo ? 'warning' : 'good'}>
                      {route.paused ? 'Pausiert' : route.waitingForCargo ? 'Wartet auf Ware' : 'Unterwegs'}
                    </StatusChip>
                    <button type="button" className="ghost-button" onClick={() => game.setShippingRoutePaused(route.id, !route.paused)}>
                      {route.paused ? 'Fortsetzen' : 'Pausieren'}
                    </button>
                    <button type="button" className="ghost-button" onClick={() => game.deleteShippingRoute(route.id)}>
                      Löschen
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </GamePanel>
  );
}
