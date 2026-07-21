import { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Focus, Layers3, Minus, Plus, RotateCcw, TrafficCone } from 'lucide-react';
import { uiImage } from '../../assets/registry.ts';
import type { CargoRouteStop } from '../../game/activities/logistics.ts';
import type { RouteAnalysis, RouteRoadAnchors, RouteSegment } from '../../game/activities/routeAnalysis.ts';
import type { GameController } from '../../game/commands/controller.ts';
import { WORLD_TILES, regionIdAt, terrainAt } from '../../game/config/startRegion.config.ts';
import type { BuildingCategory, TerrainType } from '../../game/types.ts';

const CANVAS_W = 1400;
const CANVAS_H = 900;
const MIN_ZOOM = 0.55;
const MAX_ZOOM = 7;
const TERRAIN: Record<TerrainType, string> = {
  water: '#17637c',
  river: '#2a8ca4',
  sand: '#ad9b65',
  fertile: '#76954b',
  grass: '#4f814d',
  forest: '#2e633f',
  mountain: '#777b78',
};
const BUILDINGS: Partial<Record<BuildingCategory, { wall: string; roof: string }>> = {
  residential: { wall: '#dfbd7b', roof: '#9c4933' },
  economy: { wall: '#c78d4e', roof: '#69452d' },
  production: { wall: '#9c8053', roof: '#4f4030' },
  services: { wall: '#d4d9d0', roof: '#476b7b' },
  government: { wall: '#ded6bd', roof: '#ad7d2c' },
  leisure: { wall: '#89a66a', roof: '#3f6d56' },
};

export interface CityworkMapPoint {
  id: string;
  x: number;
  y: number;
  label: string;
  subtitle: string;
}

interface ViewState {
  centerX: number;
  centerY: number;
  zoom: number;
}

interface Interaction {
  kind: 'pan' | 'draw';
  clientX: number;
  clientY: number;
  view: ViewState;
  moved: boolean;
  button: number;
}

export function ManualRouteMap({
  game,
  source,
  targets,
  anchors,
  roadPath,
  analysis,
  referenceSegments,
  visitOrder,
  cargoStops,
  fitNonce,
  focusRequest,
  onPathChange,
  onInvalid,
}: {
  game: GameController;
  source: { x: number; y: number; label: string };
  targets: CityworkMapPoint[];
  anchors: RouteRoadAnchors | undefined;
  roadPath: { x: number; y: number }[];
  analysis: RouteAnalysis | undefined;
  referenceSegments: RouteSegment[] | undefined;
  visitOrder: string[];
  cargoStops?: CargoRouteStop[];
  fitNonce: number;
  focusRequest?: { x: number; y: number; nonce: number };
  onPathChange(path: { x: number; y: number }[]): void;
  onInvalid(): void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const interactionRef = useRef<Interaction>();
  const rightDraggedRef = useRef(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showBuildings, setShowBuildings] = useState(true);
  const [routePhase, setRoutePhase] = useState(0);
  const fit = useMemo(() => fitView([source, ...targets]), [source, targets]);
  const [view, setView] = useState<ViewState>(fit);
  const roadTiles = useMemo(() => {
    const roads = new Map<string, string>();
    for (const building of Object.values(game.state.buildings)) {
      if (game.config.buildings.get(building.defId)?.category === 'roads') {
        roads.set(`${building.x},${building.y}`, building.defId);
      }
    }
    return roads;
  }, [game, game.version]);
  const traffic = useMemo(() => {
    const result = new Map<string, number>();
    for (const segment of referenceSegments ?? []) {
      for (const point of segment.path) {
        const id = `${Math.floor(point.x)},${Math.floor(point.y)}`;
        result.set(id, Math.max(result.get(id) ?? 0, segment.load));
      }
    }
    return result;
  }, [referenceSegments]);
  const markerImages = useImageMap({
    source: uiImage('marker_source'),
    delivery: uiImage('marker_delivery'),
    resupply: uiImage('marker_resupply'),
  });

  useEffect(() => setView(fit), [fitNonce, fit.centerX, fit.centerY, fit.zoom]);
  useEffect(() => {
    if (!focusRequest) return;
    setView((current) => ({
      ...current,
      centerX: focusRequest.x,
      centerY: focusRequest.y,
      zoom: Math.max(3.2, current.zoom),
    }));
  }, [focusRequest]);
  useEffect(() => {
    if (roadPath.length < 2) return;
    const timer = window.setInterval(() => setRoutePhase((value) => (value + 1) % 24), 120);
    return () => window.clearInterval(timer);
  }, [roadPath.length]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement | null;
      if (element?.tagName === 'INPUT' || element?.tagName === 'TEXTAREA' || element?.isContentEditable) return;
      if (event.code === 'Space') {
        event.preventDefault();
        setSpaceHeld(true);
      }
      if (event.key === '+' || event.key === '=') {
        setView((current) => ({ ...current, zoom: clamp(current.zoom * 1.2, MIN_ZOOM, MAX_ZOOM) }));
      }
      if (event.key === '-') {
        setView((current) => ({ ...current, zoom: clamp(current.zoom / 1.2, MIN_ZOOM, MAX_ZOOM) }));
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') setSpaceHeld(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const transform = mapTransform(view);
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    const background = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    background.addColorStop(0, '#163d43');
    background.addColorStop(1, '#0a242c');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const minX = Math.max(0, Math.floor(view.centerX - CANVAS_W / transform.scale / 2) - 3);
    const maxX = Math.min(WORLD_TILES - 1, Math.ceil(view.centerX + CANVAS_W / transform.scale / 2) + 3);
    const minY = Math.max(0, Math.floor(view.centerY - CANVAS_H / transform.scale / 2) - 3);
    const maxY = Math.min(WORLD_TILES - 1, Math.ceil(view.centerY + CANVAS_H / transform.scale / 2) + 3);
    const unlocked = new Set(
      Object.values(game.state.world.regions)
        .filter((region) => region.status === 'unlocked')
        .map((region) => region.id),
    );

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const point = toScreen(x, y, transform);
        const terrain = terrainAt(x, y);
        const regionId = regionIdAt(x, y);
        const visible = regionId === 0 || unlocked.has(regionId);
        const shade = ((x * 31 + y * 17) % 7) - 3;
        ctx.globalAlpha = visible ? 1 : 0.32;
        ctx.fillStyle = shadeColor(TERRAIN[terrain], shade * 1.35);
        ctx.fillRect(point.x - 0.5, point.y - 0.5, transform.scale + 1, transform.scale + 1);
        if (transform.scale > 13 && terrain !== 'water' && terrain !== 'river' && (x + y) % 5 === 0) {
          ctx.fillStyle = terrain === 'forest' ? 'rgba(11,54,31,.24)' : 'rgba(255,245,192,.08)';
          ctx.beginPath();
          ctx.arc(point.x + transform.scale * 0.65, point.y + transform.scale * 0.35, transform.scale * 0.08, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;

    drawRegionBorders(ctx, minX, maxX, minY, maxY, transform);
    drawRoadNetwork(ctx, roadTiles, traffic, showTraffic, minX, maxX, minY, maxY, transform);
    if (showBuildings) drawBuildings(ctx, game, targets, minX, maxX, minY, maxY, transform);
    drawRoute(ctx, roadPath, cargoStops, transform, routePhase, analysis !== undefined);

    if (anchors) {
      const resupplies = cargoStops?.filter((stop) => stop.type === 'resupply').length ?? 0;
      drawImageMarker(
        ctx,
        anchors.source,
        markerImages.source,
        '#4bd884',
        source.label,
        resupplies > 0 ? `Quelle · ${resupplies}× nachladen` : 'Quelle / Start',
        undefined,
        transform,
      );
      if (resupplies > 0) drawMarkerBadge(ctx, anchors.source, markerImages.resupply, resupplies, transform);
      anchors.targets.forEach((anchor, index) => {
        const target = targets[index];
        if (!target) return;
        const visitIndex = visitOrder.indexOf(target.id);
        drawImageMarker(
          ctx,
          anchor,
          markerImages.delivery,
          visitIndex >= 0 ? '#57d88a' : '#4aa7df',
          target.label,
          visitIndex >= 0 ? `Stopp ${visitIndex + 1}` : 'Lieferziel',
          visitIndex >= 0 ? visitIndex + 1 : undefined,
          transform,
        );
      });
    }
  }, [
    analysis,
    anchors,
    cargoStops,
    game,
    game.version,
    markerImages,
    roadPath,
    roadTiles,
    routePhase,
    showBuildings,
    showTraffic,
    source.label,
    targets,
    traffic,
    view,
    visitOrder,
  ]);

  const worldAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const rect = canvas.getBoundingClientRect();
    const transform = mapTransform(view);
    return {
      x: view.centerX + ((clientX - rect.left) / rect.width) * CANVAS_W / transform.scale - CANVAS_W / transform.scale / 2,
      y: view.centerY + ((clientY - rect.top) / rect.height) * CANVAS_H / transform.scale - CANVAS_H / transform.scale / 2,
    };
  };

  const appendRoad = (clientX: number, clientY: number, noisy: boolean) => {
    const world = worldAt(clientX, clientY);
    if (!world || !anchors) return;
    const tile = { x: Math.floor(world.x), y: Math.floor(world.y) };
    const id = `${tile.x},${tile.y}`;
    const last = roadPath.at(-1);
    if (!roadTiles.has(id)) {
      if (noisy) onInvalid();
      return;
    }
    if (!last) {
      if (tile.x === anchors.source.x && tile.y === anchors.source.y) onPathChange([tile]);
      else if (noisy) onInvalid();
      return;
    }
    if (tile.x === last.x && tile.y === last.y) return;
    const previous = roadPath.at(-2);
    if (previous && tile.x === previous.x && tile.y === previous.y) {
      onPathChange(roadPath.slice(0, -1));
      return;
    }
    const dx = tile.x - last.x;
    const dy = tile.y - last.y;
    if (dx !== 0 && dy !== 0) {
      if (noisy) onInvalid();
      return;
    }
    const steps = Math.abs(dx) + Math.abs(dy);
    const sx = Math.sign(dx);
    const sy = Math.sign(dy);
    const extension = Array.from({ length: steps }, (_, index) => ({
      x: last.x + sx * (index + 1),
      y: last.y + sy * (index + 1),
    }));
    if (extension.length === 0 || extension.some((point) => !roadTiles.has(`${point.x},${point.y}`))) {
      if (noisy) onInvalid();
      return;
    }
    onPathChange([...roadPath, ...extension]);
  };

  return (
    <div className={`citywork-v4-map${spaceHeld ? ' is-panning' : ''}`}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        aria-label="Interaktive, stilisierte 2D-Routenkarte"
        onContextMenu={(event) => {
          event.preventDefault();
          if (!rightDraggedRef.current && roadPath.length > 1) onPathChange(roadPath.slice(0, -1));
          rightDraggedRef.current = false;
        }}
        onPointerDown={(event) => {
          const world = worldAt(event.clientX, event.clientY);
          const overRoad = world ? roadTiles.has(`${Math.floor(world.x)},${Math.floor(world.y)}`) : false;
          const pan = event.button === 1 || event.button === 2 || spaceHeld || !overRoad;
          interactionRef.current = {
            kind: pan ? 'pan' : 'draw',
            clientX: event.clientX,
            clientY: event.clientY,
            view,
            moved: false,
            button: event.button,
          };
          if (!pan && event.button === 0) appendRoad(event.clientX, event.clientY, true);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const interaction = interactionRef.current;
          if (!interaction) return;
          if (Math.hypot(event.clientX - interaction.clientX, event.clientY - interaction.clientY) > 3) interaction.moved = true;
          if (interaction.kind === 'pan') {
            const transform = mapTransform(interaction.view);
            const rect = event.currentTarget.getBoundingClientRect();
            setView({
              ...interaction.view,
              centerX: interaction.view.centerX - ((event.clientX - interaction.clientX) / rect.width) * CANVAS_W / transform.scale,
              centerY: interaction.view.centerY - ((event.clientY - interaction.clientY) / rect.height) * CANVAS_H / transform.scale,
            });
          } else {
            appendRoad(event.clientX, event.clientY, false);
          }
        }}
        onPointerUp={(event) => {
          if (interactionRef.current?.button === 2) rightDraggedRef.current = interactionRef.current.moved;
          interactionRef.current = undefined;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          interactionRef.current = undefined;
        }}
        onDoubleClick={(event) => {
          const world = worldAt(event.clientX, event.clientY);
          if (!world || !anchors) return;
          const candidates = [anchors.source, ...anchors.targets];
          const closest = [...candidates].sort(
            (a, b) => Math.hypot(a.x - world.x, a.y - world.y) - Math.hypot(b.x - world.x, b.y - world.y),
          )[0];
          if (closest) setView((current) => ({ ...current, centerX: closest.x, centerY: closest.y, zoom: Math.max(3.4, current.zoom) }));
        }}
        onWheel={(event) => {
          event.preventDefault();
          setView((current) => ({ ...current, zoom: clamp(current.zoom * (event.deltaY < 0 ? 1.14 : 0.87), MIN_ZOOM, MAX_ZOOM) }));
        }}
      />

      <div className="citywork-v4-map-hint">
        <span>Auf Straße ziehen: Route</span>
        <span>Freie Fläche / rechte Taste: Verschieben</span>
      </div>
      <div className="citywork-v4-map-zoom">
        <button onClick={() => setView((current) => ({ ...current, zoom: clamp(current.zoom * 1.2, MIN_ZOOM, MAX_ZOOM) }))} title="Hineinzoomen"><Plus size={18} /></button>
        <button onClick={() => setView((current) => ({ ...current, zoom: clamp(current.zoom / 1.2, MIN_ZOOM, MAX_ZOOM) }))} title="Herauszoomen"><Minus size={18} /></button>
        <button onClick={() => setView(fit)} title="Auftrag einpassen"><Focus size={18} /></button>
      </div>
      <div className="citywork-v4-map-layers">
        <button className={showTraffic ? 'active' : ''} onClick={() => setShowTraffic((value) => !value)} title="Verkehrslast"><TrafficCone size={17} /></button>
        <button className={showBuildings ? 'active' : ''} onClick={() => setShowBuildings((value) => !value)} title="Gebäude"><Building2 size={17} /></button>
        <button onClick={() => onPathChange(anchors ? [{ ...anchors.source }] : [])} title="Route zurücksetzen"><RotateCcw size={17} /></button>
        <span><Layers3 size={14} /> Ebenen</span>
      </div>
    </div>
  );
}

function useImageMap(urls: Record<string, string | undefined>): Record<string, HTMLImageElement | undefined> {
  const stableUrls = Object.values(urls).join('|');
  const [images, setImages] = useState<Record<string, HTMLImageElement | undefined>>({});
  useEffect(() => {
    let cancelled = false;
    for (const [key, url] of Object.entries(urls)) {
      if (!url) continue;
      const image = new Image();
      image.onload = () => {
        if (!cancelled) setImages((current) => ({ ...current, [key]: image }));
      };
      image.src = url;
    }
    return () => {
      cancelled = true;
    };
  }, [stableUrls]);
  return images;
}

function fitView(points: { x: number; y: number }[]): ViewState {
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const width = Math.max(15, maxX - minX + 13);
  const height = Math.max(12, maxY - minY + 11);
  const scale = Math.min(CANVAS_W / width, CANVAS_H / height);
  const baseScale = Math.min(CANVAS_W / 38, CANVAS_H / 28);
  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    zoom: clamp(scale / baseScale, 0.85, 2.75),
  };
}

function mapTransform(view: ViewState) {
  const baseScale = Math.min(CANVAS_W / 38, CANVAS_H / 28);
  return { centerX: view.centerX, centerY: view.centerY, scale: baseScale * view.zoom };
}

function toScreen(x: number, y: number, transform: { centerX: number; centerY: number; scale: number }) {
  return {
    x: CANVAS_W / 2 + (x - transform.centerX) * transform.scale,
    y: CANVAS_H / 2 + (y - transform.centerY) * transform.scale,
  };
}

function drawRegionBorders(
  ctx: CanvasRenderingContext2D,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  transform: ReturnType<typeof mapTransform>,
) {
  ctx.strokeStyle = 'rgba(245,217,145,.15)';
  ctx.lineWidth = Math.max(1, transform.scale * 0.05);
  ctx.setLineDash([Math.max(3, transform.scale * 0.22), Math.max(3, transform.scale * 0.18)]);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const region = regionIdAt(x, y);
      if (regionIdAt(x + 1, y) !== region) {
        const a = toScreen(x + 1, y, transform);
        const b = toScreen(x + 1, y + 1, transform);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      if (regionIdAt(x, y + 1) !== region) {
        const a = toScreen(x, y + 1, transform);
        const b = toScreen(x + 1, y + 1, transform);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  }
  ctx.setLineDash([]);
}

function drawRoadNetwork(
  ctx: CanvasRenderingContext2D,
  roads: ReadonlyMap<string, string>,
  traffic: ReadonlyMap<string, number>,
  showTraffic: boolean,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  transform: ReturnType<typeof mapTransform>,
) {
  for (const [id, defId] of roads) {
    const [x, y] = id.split(',').map(Number) as [number, number];
    if (x < minX || x > maxX || y < minY || y > maxY) continue;
    const center = toScreen(x + 0.5, y + 0.5, transform);
    const highway = defId.includes('highway') || defId.includes('avenue');
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(3,12,16,.74)';
    ctx.lineWidth = Math.max(highway ? 9 : 7, transform.scale * (highway ? 0.74 : 0.62));
    drawRoadLinks(ctx, center, x, y, roads, transform);
    ctx.strokeStyle = highway ? '#809ba2' : '#697d7d';
    ctx.lineWidth = Math.max(highway ? 6 : 4, transform.scale * (highway ? 0.52 : 0.42));
    drawRoadLinks(ctx, center, x, y, roads, transform);
    if (showTraffic) {
      const load = traffic.get(id) ?? 0;
      ctx.strokeStyle = ['rgba(91,213,125,.28)', 'rgba(211,210,73,.38)', 'rgba(244,163,48,.46)', 'rgba(235,78,58,.58)'][load]!;
      ctx.lineWidth = Math.max(2, transform.scale * 0.16);
      drawRoadLinks(ctx, center, x, y, roads, transform);
    }
    if (transform.scale > 18) {
      ctx.setLineDash([transform.scale * 0.2, transform.scale * 0.23]);
      ctx.strokeStyle = 'rgba(237,232,193,.42)';
      ctx.lineWidth = Math.max(1, transform.scale * 0.035);
      drawRoadLinks(ctx, center, x, y, roads, transform);
      ctx.setLineDash([]);
    }
  }
}

function drawBuildings(
  ctx: CanvasRenderingContext2D,
  game: GameController,
  targets: CityworkMapPoint[],
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  transform: ReturnType<typeof mapTransform>,
) {
  const targetIds = new Set(targets.map((target) => target.id));
  const buildings = Object.values(game.state.buildings)
    .filter((building) => building.x >= minX - 8 && building.x <= maxX + 2 && building.y >= minY - 8 && building.y <= maxY + 2)
    .sort((a, b) => a.y - b.y || a.x - b.x);
  for (const building of buildings) {
    const definition = game.config.buildings.get(building.defId);
    if (!definition || definition.category === 'roads') continue;
    const point = toScreen(building.x, building.y, transform);
    const width = Math.max(3, definition.size.w * transform.scale);
    const height = Math.max(3, definition.size.h * transform.scale);
    if (definition.category === 'decoration') {
      ctx.fillStyle = '#2f6f42';
      ctx.beginPath();
      ctx.arc(point.x + width / 2, point.y + height / 2, Math.max(2, Math.min(width, height) * 0.35), 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    const palette = BUILDINGS[definition.category] ?? { wall: '#a89b83', roof: '#5d6670' };
    const lift = Math.min(height * 0.24, transform.scale * 0.9);
    ctx.fillStyle = 'rgba(0,8,10,.27)';
    roundedRect(ctx, point.x + transform.scale * 0.14, point.y + transform.scale * 0.2, width, height, Math.max(2, transform.scale * 0.12));
    ctx.fill();
    ctx.fillStyle = targetIds.has(building.id) ? '#d7a55a' : palette.wall;
    roundedRect(ctx, point.x, point.y - lift * 0.2, width, height, Math.max(2, transform.scale * 0.1));
    ctx.fill();
    ctx.fillStyle = palette.roof;
    ctx.beginPath();
    ctx.moveTo(point.x - transform.scale * 0.07, point.y + height * 0.18);
    ctx.lineTo(point.x + width * 0.5, point.y - lift);
    ctx.lineTo(point.x + width + transform.scale * 0.07, point.y + height * 0.18);
    ctx.lineTo(point.x + width * 0.82, point.y + height * 0.36);
    ctx.lineTo(point.x + width * 0.18, point.y + height * 0.36);
    ctx.closePath();
    ctx.fill();
    if (transform.scale > 15 && width > 14) {
      ctx.fillStyle = 'rgba(188,229,238,.75)';
      const windowSize = clamp(transform.scale * 0.12, 2, 6);
      ctx.fillRect(point.x + width * 0.22, point.y + height * 0.53, windowSize, windowSize * 0.75);
      ctx.fillRect(point.x + width * 0.66, point.y + height * 0.53, windowSize, windowSize * 0.75);
    }
  }
}

function drawRoute(
  ctx: CanvasRenderingContext2D,
  path: readonly { x: number; y: number }[],
  cargoStops: readonly CargoRouteStop[] | undefined,
  transform: ReturnType<typeof mapTransform>,
  phase: number,
  complete: boolean,
) {
  if (path.length < 2) return;
  const stops = [...(cargoStops ?? [])].sort((a, b) => a.pathIndex - b.pathIndex);
  for (let index = 1; index < path.length; index += 1) {
    const previous = toScreen(path[index - 1]!.x + 0.5, path[index - 1]!.y + 0.5, transform);
    const current = toScreen(path[index]!.x + 0.5, path[index]!.y + 0.5, transform);
    const lastStop = [...stops].reverse().find((stop) => stop.pathIndex < index);
    const nextStop = stops.find((stop) => stop.pathIndex >= index);
    const emptyReturn = lastStop?.cargoAfter === 0 && nextStop?.type === 'resupply';
    const afterReload = lastStop?.type === 'resupply';
    const color = emptyReturn ? '#e65f4e' : afterReload ? '#f0a42e' : complete ? '#5bd88a' : '#4bc8d1';
    ctx.beginPath(); ctx.moveTo(previous.x, previous.y); ctx.lineTo(current.x, current.y);
    ctx.strokeStyle = emptyReturn ? 'rgba(224,67,48,.3)' : 'rgba(43,226,213,.25)';
    ctx.lineWidth = Math.max(12, transform.scale * (complete ? 0.76 : 0.64));
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(previous.x, previous.y); ctx.lineTo(current.x, current.y);
    if (emptyReturn) ctx.setLineDash([Math.max(8, transform.scale * 0.4), Math.max(5, transform.scale * 0.28)]);
    ctx.lineDashOffset = -phase;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(5, transform.scale * (complete ? 0.42 : 0.34));
    ctx.stroke();
    ctx.setLineDash([]);
    if (index % 5 === 0 && transform.scale > 11) drawDirectionArrow(ctx, previous, current, color, Math.max(4, transform.scale * 0.22));
  }
}

function drawDirectionArrow(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  color: string,
  size: number,
) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const x = (from.x + to.x) / 2;
  const y = (from.y + to.y) / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.65, size * 0.62);
  ctx.lineTo(-size * 0.25, 0);
  ctx.lineTo(-size * 0.65, -size * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawImageMarker(
  ctx: CanvasRenderingContext2D,
  anchor: { x: number; y: number },
  image: HTMLImageElement | undefined,
  color: string,
  title: string,
  subtitle: string,
  order: number | undefined,
  transform: ReturnType<typeof mapTransform>,
) {
  const point = toScreen(anchor.x + 0.5, anchor.y + 0.5, transform);
  const size = clamp(transform.scale * 1.45, 38, 72);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.58)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  if (image) {
    ctx.drawImage(image, point.x - size / 2, point.y - size * 0.86, size, size);
  } else {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y - size * 0.35, size * 0.34, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  if (order !== undefined) {
    ctx.fillStyle = '#06202b';
    ctx.beginPath();
    ctx.arc(point.x + size * 0.34, point.y - size * 0.72, size * 0.19, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = `900 ${clamp(size * 0.2, 12, 16)}px Inter, system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(order), point.x + size * 0.34, point.y - size * 0.72);
  }
  if (transform.scale > 9) drawMarkerLabel(ctx, point.x, point.y + size * 0.08, title, subtitle, color);
}

function drawMarkerLabel(ctx: CanvasRenderingContext2D, x: number, y: number, title: string, subtitle: string, color: string) {
  ctx.font = '800 13px Inter, system-ui';
  const width = Math.max(ctx.measureText(title).width, ctx.measureText(subtitle).width) + 24;
  const left = x - width / 2;
  ctx.fillStyle = 'rgba(3,18,27,.92)';
  roundedRect(ctx, left, y, width, 39, 8);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#f6f8f4';
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(title, x, y + 16);
  ctx.font = '700 12px Inter, system-ui';
  ctx.fillStyle = '#9cb2bc';
  ctx.fillText(subtitle, x, y + 31);
}

function drawMarkerBadge(
  ctx: CanvasRenderingContext2D,
  anchor: { x: number; y: number },
  image: HTMLImageElement | undefined,
  count: number,
  transform: ReturnType<typeof mapTransform>,
) {
  const point = toScreen(anchor.x + 0.5, anchor.y + 0.5, transform);
  const size = clamp(transform.scale * 0.64, 24, 34);
  const x = point.x - size * 1.1;
  const y = point.y - size * 1.4;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.6)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = 'rgba(4,24,34,.94)';
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size * 0.58, 0, Math.PI * 2);
  ctx.fill();
  if (image) ctx.drawImage(image, x, y, size, size);
  else {
    ctx.fillStyle = '#ef9e2b';
    ctx.font = `900 ${Math.max(12, size * 0.45)}px Inter, system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↻', x + size / 2, y + size / 2);
  }
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = '900 12px Inter, system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(count), x + size * 0.9, y + size * 0.9);
}

function drawRoadLinks(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  x: number,
  y: number,
  roads: ReadonlyMap<string, string>,
  transform: ReturnType<typeof mapTransform>,
) {
  for (const [dx, dy] of [[1, 0], [0, 1]] as const) {
    if (!roads.has(`${x + dx},${y + dy}`)) continue;
    const neighbour = toScreen(x + dx + 0.5, y + dy + 0.5, transform);
    ctx.beginPath(); ctx.moveTo(center.x, center.y); ctx.lineTo(neighbour.x, neighbour.y); ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(center.x, center.y, Math.max(1, ctx.lineWidth / 2), 0, Math.PI * 2);
  ctx.fillStyle = ctx.strokeStyle as string;
  ctx.fill();
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function shadeColor(hex: string, amount: number) {
  const value = Number.parseInt(hex.slice(1), 16);
  const channel = (shift: number) => clamp(((value >> shift) & 255) + amount, 0, 255);
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
