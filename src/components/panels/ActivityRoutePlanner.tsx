import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bot,
  Check,
  Clock3,
  Gauge,
  GitFork,
  GripVertical,
  Medal,
  Play,
  RotateCcw,
  Route,
  Save,
  Sparkles,
  TrafficCone,
  Truck,
  X,
} from 'lucide-react';
import { WORLD_TILES, regionIdAt, startRegionConfig, terrainAt } from '../../game/config/startRegion.config.ts';
import type { ActivityDef } from '../../game/config/types.ts';
import type { GameController } from '../../game/commands/controller.ts';
import type { BuildingInstance, TerrainType } from '../../game/types.ts';
import { formatDuration, formatMoney, t } from '../../i18n/index.ts';
import { getMapApi, useGame, useUiStore } from '../../state/store.ts';
import { playFeedback } from '../../services/feedback.ts';
import { ActivityArt, CitizenPortrait } from '../art/index.ts';

const MAP_SIZE = 640;
const TERRAIN: Record<TerrainType, [number, number, number]> = {
  water: [21, 79, 109],
  river: [34, 117, 151],
  sand: [158, 139, 91],
  fertile: [99, 122, 54],
  grass: [52, 105, 59],
  forest: [24, 70, 43],
  mountain: [82, 86, 89],
};
const SEGMENT_COLORS = ['#53d173', '#f0c64f', '#f18a3b', '#e84d45'] as const;

interface RoutePoint {
  id: string;
  x: number;
  y: number;
  building: BuildingInstance;
}

interface RouteMetrics {
  distanceKm: number;
  seconds: number;
  crossings: number;
  risk: 'low' | 'medium' | 'high';
  efficiency: number;
  medal: 'gold' | 'silver' | 'bronze';
}

export function ActivityRoutePlanner({ defId }: { defId: string }) {
  const game = useGame();
  const closePlanner = useUiStore((state) => state.closeActivityPlanner);
  const pushToast = useUiStore((state) => state.pushToast);
  const active = game.state.activities.active?.defId === defId ? game.state.activities.active : undefined;
  const def = game.config.activities.activities.find((activity) => activity.id === defId);
  const draft = game.getActivityRoutePlan(defId);
  const initialTargets = active?.targets.map((target) => target.buildingId) ?? draft?.targetBuildingIds ?? [];
  const [originalRoute] = useState(initialTargets);
  const [route, setRoute] = useState(initialTargets);
  const [routeName, setRouteName] = useState(() => `${def ? t(def.nameKey) : t('ui.route.title')} 1`);
  const [tab, setTab] = useState<'overview' | 'targets' | 'vehicle'>('overview');
  const source = buildingPoint(game, draft?.sourceBuildingId) ?? {
    id: 'town-hall',
    x: startRegionConfig.townHall.x + 1.5,
    y: startRegionConfig.townHall.y + 1.5,
  };
  const points = useMemo(
    () => route.map((id) => buildingPoint(game, id)).filter((point): point is RoutePoint => point !== undefined),
    [game, route],
  );
  const metrics = useMemo(() => analyseRoute(source, points), [source.x, source.y, points]);

  if (!def || (!active && !draft) || route.length < 2) {
    return (
      <section className="route-planner route-planner-empty">
        <Route size={34} />
        <h2>{t('ui.route.unavailable')}</h2>
        <button className="btn-primary" onClick={closePlanner}>{t('ui.close')}</button>
      </section>
    );
  }

  const optimise = () => setRoute(nearestNeighbour(source, points).map((point) => point.id));
  const moveStop = (index: number, delta: number) => {
    const next = [...route];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(index, 1);
    if (item) next.splice(target, 0, item);
    setRoute(next);
  };
  const saveRoute = () => {
    localStorage.setItem(`cmb.activityRoute.${defId}`, JSON.stringify({ name: routeName, targets: route }));
    pushToast(t('ui.route.saved'), 'success');
  };
  const loadLastRoute = () => {
    try {
      const raw = localStorage.getItem(`cmb.activityRoute.${defId}`);
      if (!raw) return pushToast(t('ui.route.no_saved'), 'info');
      const saved = JSON.parse(raw) as { name?: string; targets?: string[] };
      const sameTargets =
        Array.isArray(saved.targets) &&
        saved.targets.length === originalRoute.length &&
        saved.targets.every((id) => originalRoute.includes(id));
      if (!sameTargets) return pushToast(t('ui.route.saved_outdated'), 'info');
      setRoute(saved.targets!);
      if (saved.name) setRouteName(saved.name);
      pushToast(t('ui.route.loaded'), 'success');
    } catch {
      pushToast(t('ui.route.saved_outdated'), 'error');
    }
  };
  const startRoute = () => {
    if (active) {
      const result = game.setActiveActivityRoute(route);
      if (!result.ok) {
        pushToast(t(`error.${result.error}`), 'error');
        return;
      }
    } else {
      const result = game.startActivity(def.id, route);
      if (!result.ok) {
        pushToast(t(`error.${result.error}`), 'error');
        return;
      }
    }
    closePlanner();
    playFeedback('activity_start');
    pushToast(t('ui.route.started'), 'success');
    if (def.drive) {
      requestAnimationFrame(() => {
        const api = getMapApi();
        if (!api?.canDrive() || !api.enterDrive()) pushToast(t('ui.drive.unavailable'), 'error');
      });
    }
  };

  return (
    <section className="route-planner">
      <header className="route-planner-head">
        <div className="route-title-icon"><Route size={25} /></div>
        <div>
          <span>{t('ui.route.eyebrow')}</span>
          <h2>{t(def.nameKey)}</h2>
        </div>
        <div className="route-brief">
          <CitizenPortrait role={def.sender} seed={def.id} size={38} />
          <p>{t(def.descriptionKey)}</p>
        </div>
        <button className="route-close" onClick={closePlanner} title={t('ui.close')}><X size={19} /></button>
      </header>

      <div className="route-planner-layout">
        <div className="route-map-shell">
          <ActivityRouteMap game={game} source={source} points={points} />
          <div className="route-source-badge">
            <span><Truck size={18} /></span>
            <div><small>{t('ui.route.source')}</small><strong>{sourceName(game, draft?.sourceBuildingId)}</strong></div>
          </div>
          <div className="route-traffic-legend">
            <strong><TrafficCone size={14} /> {t('ui.route.traffic')}</strong>
            {[
              ['#53d173', t('ui.route.traffic.free')],
              ['#f0c64f', t('ui.route.traffic.light')],
              ['#f18a3b', t('ui.route.traffic.medium')],
              ['#e84d45', t('ui.route.traffic.jam')],
            ].map(([color, label]) => (
              <span key={label}><i style={{ background: color }} />{label}</span>
            ))}
            <label><input type="checkbox" defaultChecked /> {t('ui.route.overlay.traffic')}</label>
            <label><input type="checkbox" /> {t('ui.route.overlay.quality')}</label>
          </div>
          <div className="route-map-actions">
            <button onClick={() => setRoute(originalRoute)}><RotateCcw size={15} /> {t('ui.route.reset')}</button>
            <button onClick={loadLastRoute}><Route size={15} /> {t('ui.route.last')}</button>
            <button className="route-optimise" onClick={optimise}><Bot size={16} /> {t('ui.route.optimise')}</button>
            <button onClick={saveRoute}><Save size={15} /> {t('ui.route.save')}</button>
          </div>
        </div>

        <aside className="route-details">
          <h3>{t('ui.route.details')}</h3>
          <label className="route-name">
            <span>{t('ui.route.name')}</span>
            <input value={routeName} onChange={(event) => setRouteName(event.target.value)} />
          </label>
          <div className="route-tabs">
            <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>{t('ui.route.tab.overview')}</button>
            <button className={tab === 'targets' ? 'active' : ''} onClick={() => setTab('targets')}>{t('ui.route.tab.targets', { count: route.length })}</button>
            <button className={tab === 'vehicle' ? 'active' : ''} onClick={() => setTab('vehicle')}>{t('ui.route.tab.vehicle')}</button>
          </div>

          {tab === 'overview' && (
            <>
              <div className="route-metrics">
                <Metric icon={<Route />} label={t('ui.route.length')} value={`${metrics.distanceKm.toFixed(2).replace('.', ',')} km`} />
                <Metric icon={<Clock3 />} label={t('ui.route.time')} value={formatDuration(metrics.seconds * 1000)} />
                <Metric icon={<GitFork />} label={t('ui.route.crossings')} value={String(metrics.crossings)} />
                <Metric
                  icon={<Gauge />}
                  label={t('ui.route.risk')}
                  value={t(`ui.route.risk.${metrics.risk}`)}
                  tone={metrics.risk === 'low' ? 'good' : metrics.risk === 'medium' ? 'warn' : 'bad'}
                />
              </div>
              <div className="route-efficiency">
                <div><span>{t('ui.route.efficiency')}</span><strong>{metrics.efficiency}%</strong></div>
                <div className="route-efficiency-bar"><i style={{ width: `${metrics.efficiency}%` }} /></div>
                <span className={`route-medal ${metrics.medal}`}><Medal size={24} /> {t(`ui.route.medal.${metrics.medal}`)}</span>
              </div>
              <div className="route-costs">
                <strong>{t('ui.route.reward')}</strong>
                <span>{formatMoney(game.getActivityBoard().find((entry) => entry.def.id === def.id)?.reward.money ?? 0)}</span>
                <span>{game.getActivityBoard().find((entry) => entry.def.id === def.id)?.reward.xp ?? 0} XP</span>
              </div>
            </>
          )}

          {tab === 'vehicle' && (
            <div className="route-vehicle">
              <ActivityArt id={def.id} type={def.type} px={82} />
              <div><small>{t('ui.route.vehicle')}</small><strong>{vehicleName(def)}</strong><span>{t('ui.route.vehicle_hint')}</span></div>
            </div>
          )}

          {(tab === 'targets' || tab === 'overview') && (
            <div className="route-targets">
              <strong>{t('ui.route.targets_order')}</strong>
              {points.map((point, index) => {
                const buildingDef = game.config.buildings.get(point.building.defId);
                const region = game.config.regions.get(regionIdAt(Math.floor(point.x), Math.floor(point.y)));
                return (
                  <div className="route-target-row" key={point.id}>
                    <span className="route-target-index">{index + 1}</span>
                    <div>
                      <strong>{buildingDef ? t(buildingDef.nameKey) : point.building.defId}</strong>
                      <small>{region ? t(region.nameKey) : t('ui.route.city_area')}</small>
                    </div>
                    <button onClick={() => moveStop(index, -1)} disabled={index === 0} title={t('ui.route.move_up')}><ArrowUp size={14} /></button>
                    <button onClick={() => moveStop(index, 1)} disabled={index === points.length - 1} title={t('ui.route.move_down')}><ArrowDown size={14} /></button>
                    <GripVertical size={15} />
                  </div>
                );
              })}
            </div>
          )}

          <footer className="route-details-actions">
            <button className="btn-secondary" onClick={closePlanner}>{t('ui.cancel')}</button>
            <button className="btn-primary" onClick={startRoute}><Play size={16} /> {t('ui.route.start')}</button>
          </footer>
        </aside>
      </div>

      <div className="route-suggestions">
        <h3>{t('ui.route.analysis')}</h3>
        <button onClick={optimise}><span className="suggestion-icon good"><Check /></span><div><strong>{t('ui.route.tip.bridge')}</strong><small>{t('ui.route.tip.bridge.desc')}</small></div><b>{t('ui.route.recommended')}</b></button>
        <button onClick={optimise}><span className="suggestion-icon warn"><Sparkles /></span><div><strong>{t('ui.route.tip.traffic')}</strong><small>{t('ui.route.tip.traffic.desc')}</small></div><b>{t('ui.route.hint')}</b></button>
        <button onClick={() => setTab('vehicle')}><span className="suggestion-icon info"><Truck /></span><div><strong>{t('ui.route.tip.vehicle')}</strong><small>{t('ui.route.tip.vehicle.desc')}</small></div><b>{t('ui.route.tip')}</b></button>
      </div>
    </section>
  );
}

function ActivityRouteMap({
  game,
  source,
  points,
}: {
  game: GameController;
  source: { x: number; y: number };
  points: RoutePoint[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const routeKey = points.map((point) => point.id).join(',');
  const unlockedKey = Object.values(game.state.world.regions)
    .filter((region) => region.status === 'unlocked')
    .map((region) => region.id)
    .sort((a, b) => a - b)
    .join(',');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const unlocked = new Set(unlockedKey.split(',').filter(Boolean).map(Number));
    const image = ctx.createImageData(MAP_SIZE, MAP_SIZE);
    for (let py = 0; py < MAP_SIZE; py++) {
      const wy = Math.min(WORLD_TILES - 1, Math.floor((py / MAP_SIZE) * WORLD_TILES));
      for (let px = 0; px < MAP_SIZE; px++) {
        const wx = Math.min(WORLD_TILES - 1, Math.floor((px / MAP_SIZE) * WORLD_TILES));
        const terrain = terrainAt(wx, wy);
        const base = TERRAIN[terrain];
        const region = regionIdAt(wx, wy);
        const visible = region === 0 || unlocked.has(region);
        const light = visible ? 0.92 : 0.43;
        const offset = (py * MAP_SIZE + px) * 4;
        image.data[offset] = Math.round(base[0] * light);
        image.data[offset + 1] = Math.round(base[1] * light);
        image.data[offset + 2] = Math.round(base[2] * light + (visible ? 0 : 10));
        image.data[offset + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    ctx.fillStyle = 'rgba(3, 13, 20, .18)';
    ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

    const scale = MAP_SIZE / WORLD_TILES;
    ctx.fillStyle = 'rgba(214, 221, 214, .5)';
    for (const building of Object.values(game.state.buildings)) {
      if (building.defId !== 'road') continue;
      ctx.fillRect(building.x * scale, building.y * scale, Math.max(1.2, scale), Math.max(1.2, scale));
    }

    const all = [{ x: source.x, y: source.y }, ...points];
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let index = 1; index < all.length; index++) {
      const a = all[index - 1]!;
      const b = all[index]!;
      const segment = routePolyline(a, b, index).map((point) => ({ x: point.x * scale, y: point.y * scale }));
      const trace = () => {
        ctx.beginPath();
        ctx.moveTo(segment[0]!.x, segment[0]!.y);
        for (const point of segment.slice(1)) ctx.lineTo(point.x, point.y);
      };
      ctx.strokeStyle = 'rgba(1, 8, 12, .72)';
      ctx.lineWidth = 11;
      trace();
      ctx.stroke();
      ctx.strokeStyle = SEGMENT_COLORS[segmentLoad(a, b, index)];
      ctx.lineWidth = 7;
      trace();
      ctx.stroke();
      ctx.setLineDash([9, 8]);
      ctx.strokeStyle = 'rgba(255,255,255,.72)';
      ctx.lineWidth = 1.5;
      trace();
      ctx.stroke();
      ctx.setLineDash([]);
    }

    marker(ctx, source.x * scale, source.y * scale, 'Q', '#54ca73');
    points.forEach((point, index) => marker(ctx, point.x * scale, point.y * scale, String(index + 1), '#178ad0'));
  }, [game, points, routeKey, source.x, source.y, unlockedKey]);

  return <canvas ref={canvasRef} width={MAP_SIZE} height={MAP_SIZE} aria-label={t('ui.route.map')} />;
}

function marker(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, color: string) {
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(4, 16, 24, .92)';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = '800 14px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y + 0.5);
}

function buildingPoint(game: GameController, id?: string): RoutePoint | undefined {
  if (!id) return undefined;
  const building = game.state.buildings[id];
  const def = building && game.config.buildings.get(building.defId);
  if (!building || !def) return undefined;
  return {
    id,
    x: building.x + def.size.w / 2,
    y: building.y + def.size.h / 2,
    building,
  };
}

function sourceName(game: GameController, id?: string): string {
  const point = buildingPoint(game, id);
  const def = point && game.config.buildings.get(point.building.defId);
  return def ? t(def.nameKey) : t('ui.route.city_depot');
}

function nearestNeighbour(source: { x: number; y: number }, points: RoutePoint[]): RoutePoint[] {
  const remaining = [...points];
  const ordered: RoutePoint[] = [];
  let current = source;
  while (remaining.length > 0) {
    remaining.sort(
      (a, b) =>
        Math.hypot(a.x - current.x, a.y - current.y) - Math.hypot(b.x - current.x, b.y - current.y) ||
        a.id.localeCompare(b.id),
    );
    const next = remaining.shift();
    if (!next) break;
    ordered.push(next);
    current = next;
  }
  return ordered;
}

function analyseRoute(source: { x: number; y: number }, points: RoutePoint[]): RouteMetrics {
  const route = [source, ...points];
  let tiles = 0;
  for (let index = 1; index < route.length; index++) {
    const a = route[index - 1]!;
    const b = route[index]!;
    tiles += Math.hypot(b.x - a.x, b.y - a.y) * 1.28;
  }
  const optimal = nearestNeighbour(source, points);
  const optimalRoute = [source, ...optimal];
  let optimalTiles = 0;
  for (let index = 1; index < optimalRoute.length; index++) {
    const a = optimalRoute[index - 1]!;
    const b = optimalRoute[index]!;
    optimalTiles += Math.hypot(b.x - a.x, b.y - a.y) * 1.28;
  }
  const efficiency = Math.max(48, Math.min(98, Math.round((optimalTiles / Math.max(1, tiles)) * 96)));
  const load = route.slice(1).reduce((sum, point, index) => sum + segmentLoad(route[index]!, point, index + 1), 0);
  const averageLoad = load / Math.max(1, points.length);
  const risk = averageLoad < 1.15 ? 'low' : averageLoad < 2.1 ? 'medium' : 'high';
  const seconds = Math.max(45, Math.round(tiles / 1.7 + points.length * 12));
  return {
    distanceKm: Math.max(0.42, (tiles * 4) / 1000),
    seconds,
    crossings: Math.max(2, Math.round(tiles / 18)),
    risk,
    efficiency,
    medal: efficiency >= 86 ? 'gold' : efficiency >= 68 ? 'silver' : 'bronze',
  };
}

function segmentLoad(a: { x: number; y: number }, b: { x: number; y: number }, index: number): 0 | 1 | 2 | 3 {
  // TODO(CLAUDE_LOGIC): Durch echte Straßengraph-Segmente, Verkehrslast und
  // Prognosedaten ersetzen. Diese deterministische Schätzung ist nur die
  // visuelle Schnittstelle des Mockups und verändert keinerlei Simulationswert.
  const hash = Math.abs(Math.floor(a.x * 13 + a.y * 17 + b.x * 19 + b.y * 23 + index * 29));
  const roll = hash % 10;
  return roll < 5 ? 0 : roll < 8 ? 1 : roll < 9 ? 2 : 3;
}

function routePolyline(
  a: { x: number; y: number },
  b: { x: number; y: number },
  index: number,
): { x: number; y: number }[] {
  const horizontalFirst = index % 2 === 0;
  const offset = ((index % 3) - 1) * 1.8;
  if (horizontalFirst) {
    const midX = (a.x + b.x) / 2 + offset;
    return [a, { x: midX, y: a.y }, { x: midX, y: b.y }, b];
  }
  const midY = (a.y + b.y) / 2 + offset;
  return [a, { x: a.x, y: midY }, { x: b.x, y: midY }, b];
}

function vehicleName(def: ActivityDef): string {
  const names: Record<string, string> = {
    van: t('ui.route.vehicle.van'),
    fire_truck: t('ui.route.vehicle.fire'),
    logging_truck: t('ui.route.vehicle.logging'),
    police_car: t('ui.route.vehicle.police'),
    flatbed: t('ui.route.vehicle.flatbed'),
  };
  return names[def.vehicle ?? 'van'] ?? t('ui.route.vehicle.van');
}

function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'good' | 'warn' | 'bad';
}) {
  return (
    <div className={`route-metric${tone ? ` ${tone}` : ''}`}>
      <span>{icon}</span>
      <div><small>{label}</small><strong>{value}</strong></div>
    </div>
  );
}
