import { useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, LockKeyhole, Map, Settings } from 'lucide-react';
import { WORLD_TILES, regionIdAt, startRegionConfig, terrainAt } from '../../game/config/startRegion.config.ts';
import type { BuildingCategory, TerrainType } from '../../game/types.ts';
import { getMapApi, useGame, useUiStore } from '../../state/store.ts';
import { t } from '../../i18n/index.ts';

const SIZE = 256;
const TERRAIN: Record<TerrainType, [number, number, number]> = {
  water: [31, 91, 128],
  river: [47, 137, 174],
  sand: [194, 170, 113],
  fertile: [125, 143, 58],
  grass: [72, 126, 67],
  forest: [35, 88, 54],
  mountain: [111, 112, 109],
};

const BUILDING_COLOR: Partial<Record<BuildingCategory, string>> = {
  roads: 'rgba(209, 207, 180, .76)',
  residential: '#f2d47b',
  production: '#d99a55',
  services: '#72c8df',
  energy: '#e8cf58',
  leisure: '#7ed991',
  economy: '#d39be7',
  government: '#f6b84a',
  infrastructure: '#9eb8c6',
  special: '#f6e3a4',
};

interface MiniMarker {
  id: string;
  x: number;
  y: number;
  category: BuildingCategory;
  problem: boolean;
  target: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/**
 * Live island minimap. Terrain/region ownership comes from the same baked world
 * grid as the renderer; buildings, mission stops and diagnostics come from the
 * current controller snapshot. Only the camera outline is polled, avoiding a
 * React render on every frame.
 */
export function WorldMiniMap() {
  const game = useGame();
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const draggingRef = useRef(false);
  const setCameraPreset = useUiStore((s) => s.setCameraPreset);
  const setPanel = useUiStore((s) => s.setPanel);
  const [focusRegionId, setFocusRegionId] = useState(startRegionConfig.startRegionId);

  const unlockedKey = Object.values(game.state.world.regions)
    .filter((region) => region.status === 'unlocked')
    .map((region) => region.id)
    .sort((a, b) => a - b)
    .join(',');
  const unlocked = useMemo(() => new Set(unlockedKey.split(',').filter(Boolean).map(Number)), [unlockedKey]);

  const targetIds = useMemo(
    () => new Set(game.state.activities.active?.targets.filter((target) => !target.done).map((target) => target.buildingId) ?? []),
    [game.version],
  );
  const markers = useMemo<MiniMarker[]>(
    () =>
      Object.values(game.state.buildings).map((building) => {
        const def = game.config.buildings.get(building.defId);
        return {
          id: building.id,
          x: building.x + (def?.size.w ?? 1) / 2,
          y: building.y + (def?.size.h ?? 1) / 2,
          category: def?.category ?? 'special',
          problem: game.getBuildingDiagnostics(building.id).some((diagnosis) => diagnosis.kind === 'problem'),
          target: targetIds.has(building.id),
        };
      }),
    [game, game.version, targetIds],
  );

  useEffect(() => {
    const canvas = baseCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const image = ctx.createImageData(SIZE, SIZE);

    for (let py = 0; py < SIZE; py++) {
      const wy = Math.min(WORLD_TILES - 1, Math.floor((py / SIZE) * WORLD_TILES));
      for (let px = 0; px < SIZE; px++) {
        const wx = Math.min(WORLD_TILES - 1, Math.floor((px / SIZE) * WORLD_TILES));
        const regionId = regionIdAt(wx, wy);
        const base = TERRAIN[terrainAt(wx, wy)];
        const isUnlocked = regionId === 0 || unlocked.has(regionId);
        const light = isUnlocked ? 1 : 0.34;
        const blue = isUnlocked ? 0 : 18;
        const offset = (py * SIZE + px) * 4;
        const macro = ((px * 13 + py * 7 + wx * 3 + wy * 5) % 19) / 190 - 0.05;
        const relief = terrainAt(wx, wy) === 'mountain' ? 0.9 + ((wx + wy) % 9) / 32 : 1 + macro;
        image.data[offset] = Math.round(base[0] * light * relief);
        image.data[offset + 1] = Math.round(base[1] * light * relief);
        image.data[offset + 2] = Math.min(255, Math.round(base[2] * light * relief) + blue);
        image.data[offset + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);

    // Organic borders sampled directly from the baked region grid.
    for (let py = 1; py < SIZE - 1; py++) {
      const wy = Math.floor((py / SIZE) * WORLD_TILES);
      for (let px = 1; px < SIZE - 1; px++) {
        const wx = Math.floor((px / SIZE) * WORLD_TILES);
        const region = regionIdAt(wx, wy);
        if (region === 0) continue;
        const edge = regionIdAt(wx + 2, wy) !== region || regionIdAt(wx, wy + 2) !== region;
        if (!edge) continue;
        ctx.fillStyle = unlocked.has(region) ? 'rgba(255,202,82,.82)' : 'rgba(186,207,222,.26)';
        ctx.fillRect(px, py, 1, 1);
      }
    }
  }, [unlocked]);

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const scale = SIZE / WORLD_TILES;

    const draw = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);

      for (const marker of markers) {
        const x = marker.x * scale;
        const y = marker.y * scale;
        if (marker.category === 'roads') {
          ctx.fillStyle = BUILDING_COLOR.roads!;
          ctx.fillRect(x - 0.65, y - 0.65, 1.3, 1.3);
          continue;
        }
        ctx.beginPath();
        ctx.arc(x, y, marker.target ? 3.6 : marker.problem ? 2.7 : 1.9, 0, Math.PI * 2);
        ctx.fillStyle = marker.target ? '#63d8ff' : marker.problem ? '#f2665d' : (BUILDING_COLOR[marker.category] ?? '#e8e4ca');
        ctx.fill();
        if (marker.target) {
          ctx.lineWidth = 1.4;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
        }
      }

      const hall = startRegionConfig.townHall;
      ctx.beginPath();
      ctx.arc(hall.x * scale, hall.y * scale, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#f2b84b';
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = '#fff4cc';
      ctx.stroke();

      const view = getMapApi()?.getCameraView();
      if (!view) return;
      const region = regionIdAt(
        clamp(Math.floor(view.targetX), 0, WORLD_TILES - 1),
        clamp(Math.floor(view.targetZ), 0, WORLD_TILES - 1),
      );
      setFocusRegionId((current) => (current === region || region === 0 ? current : region));

      const width = clamp(view.dist * 0.5, 12, 112) * scale;
      const height = width * clamp(0.52 + view.pitch * 0.2, 0.55, 0.78);
      ctx.save();
      ctx.translate(view.targetX * scale, view.targetZ * scale);
      ctx.rotate(-view.yaw);
      ctx.strokeStyle = 'rgba(255, 248, 213, .95)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(0, 0, 0, .75)';
      ctx.shadowBlur = 3;
      ctx.strokeRect(-width / 2, -height / 2, width, height);
      ctx.beginPath();
      ctx.moveTo(0, -height / 2 - 4);
      ctx.lineTo(-3.5, -height / 2 + 2);
      ctx.lineTo(3.5, -height / 2 + 2);
      ctx.closePath();
      ctx.fillStyle = '#fff6cf';
      ctx.fill();
      ctx.restore();
    };

    draw();
    const timer = window.setInterval(draw, 120);
    return () => window.clearInterval(timer);
  }, [markers]);

  const focusRegion = game.config.regions.get(focusRegionId);
  const focusRegionState = game.state.world.regions[String(focusRegionId)];
  const modifier = focusRegion
    ? Object.entries(focusRegion.productionModifiers ?? {}).find(([, factor]) => factor !== undefined && factor > 1)
    : undefined;

  const focusFromPointer = (clientX: number, clientY: number) => {
    const canvas = baseCanvasRef.current;
    const api = getMapApi();
    if (!canvas || !api) return;
    const rect = canvas.getBoundingClientRect();
    const x = clamp(((clientX - rect.left) / rect.width) * WORLD_TILES, 0, WORLD_TILES - 1);
    const z = clamp(((clientY - rect.top) / rect.height) * WORLD_TILES, 0, WORLD_TILES - 1);
    setCameraPreset('city');
    api.focusGround(x, z, Math.min(api.getCameraView().dist, 92));
  };

  return (
    <aside className="world-minimap">
      <div className="world-minimap-head">
        <span><Map size={15} /> {t('ui.minimap.title')}</span>
        <span className="world-minimap-actions">
          <button onClick={() => setPanel('settings')} title={t('ui.settings')}>
            <Settings size={15} />
          </button>
          <button
            onClick={() => {
              getMapApi()?.centerOnCity();
              setCameraPreset('city');
            }}
            title={t('ui.camera.preset.center')}
          >
            <Crosshair size={16} />
          </button>
        </span>
      </div>
      <button
        className="world-minimap-map"
        onPointerDown={(event) => {
          draggingRef.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          focusFromPointer(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (draggingRef.current) focusFromPointer(event.clientX, event.clientY);
        }}
        onPointerUp={(event) => {
          draggingRef.current = false;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          draggingRef.current = false;
        }}
        title={t('ui.minimap.drag_hint')}
      >
        <canvas ref={baseCanvasRef} width={SIZE} height={SIZE} />
        <canvas className="world-minimap-overlay" ref={overlayCanvasRef} width={SIZE} height={SIZE} />
      </button>
      <div className="world-minimap-region">
        <span>{t('ui.minimap.focus')}</span>
        <div>
          <strong>{focusRegion ? t(focusRegion.nameKey) : t('ui.nav.city')}</strong>
          <b className={focusRegionState?.status === 'unlocked' ? 'text-good' : 'text-warn'}>
            {focusRegionState?.status === 'unlocked' ? t('ui.minimap.unlocked') : (
              <>
                <LockKeyhole size={11} /> {t('ui.minimap.locked')}
              </>
            )}
          </b>
        </div>
        <small>
          {modifier
            ? `${t(`ui.region.mod.${modifier[0]}`)} +${Math.round(((modifier[1] ?? 1) - 1) * 100)}%`
            : t(`biome.${focusRegion?.biome ?? 'ebene'}`)}
        </small>
      </div>
    </aside>
  );
}
