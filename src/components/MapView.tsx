import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Move, RotateCw, Sparkles } from 'lucide-react';
import { ThreeMapRenderer } from '../renderer/three/ThreeMapRenderer.ts';
import type { HoverInfo, IMapRenderer, RendererCallbacks } from '../renderer/IMapRenderer.ts';
import { getController, setMapApi, useUiStore, type MapApi } from '../state/store.ts';
import { ServiceOverlayBanner } from './hud/ServiceOverlayBanner.tsx';
import { t } from '../i18n/index.ts';

interface CoverageInfo {
  label: string;
  underCapacity: boolean;
  counts: { supplied: number; partial: number; unsupplied: number };
  capacity?: { servable: number; used: number };
}

/** Imperative camera surface exposed to the HUD. */
function makeMapApi(r: IMapRenderer): MapApi {
  return {
    centerOnCity: () => r.centerOnCity(),
    applyPreset: (p) => r.applyPreset(p),
    focusSelected: () => r.focusSelected(),
    resetNorth: () => r.resetNorth(),
    zoomStep: (d) => r.zoomStep(d),
    getYaw: () => r.getYaw(),
    getCameraView: () => r.getCameraView(),
    focusGround: (x, z, dist) => r.focusGround(x, z, dist),
    canDrive: () => r.canDrive(),
    enterDrive: () => r.enterDrive(),
    exitDrive: () => r.exitDrive(),
  };
}

export function MapView() {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<IMapRenderer>(undefined);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | undefined>(undefined);
  const [coverage, setCoverage] = useState<CoverageInfo | undefined>(undefined);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const controller = getController();
    const ui = useUiStore.getState();

    const callbacks: RendererCallbacks = {
      onSelectBuilding: (id) => {
        // While a Stadtarbeit run is active, clicking one of its map targets
        // delivers/inspects it instead of opening the building sheet (§ aktive
        // Karte). Any other building still selects normally.
        const active = controller.state.activities.active;
        if (id && active?.targets.some((tg) => tg.buildingId === id && !tg.done)) {
          const result = controller.progressActivity(id);
          if (result.ok) {
            useUiStore.getState().pushToast(t('ui.activity.delivered'), 'success');
          } else {
            ui.pushToast(t(`error.${result.error}`), 'error');
          }
          return;
        }
        useUiStore.getState().selectBuilding(id);
      },
      onClickLockedRegion: (id) => useUiStore.getState().openRegionDialog(id),
      onCancelPlacement: () => {
        useUiStore.getState().stopPlacing();
        useUiStore.getState().stopMoving();
      },
      onRequestMove: (id) => useUiStore.getState().startMoving(id),
      onMove: (id, x, y) => {
        const result = controller.moveBuilding(id, x, y);
        if (result.ok) {
          useUiStore.getState().stopMoving();
        } else {
          ui.pushToast(t(`error.${result.error}`), 'error');
        }
      },
      onHoverInfo: (info) => setHoverInfo(info),
      // § A6 Fahrmodus: Ein-/Ausstieg spiegeln + erreichte Ziele abschließen.
      onDriveChange: (isActive) => useUiStore.getState().setDriveActive(isActive),
      onDriveProgress: (id) => {
        const result = controller.progressActivity(id);
        if (result.ok) useUiStore.getState().pushToast(t('ui.activity.delivered'), 'success');
      },
      onRegionUnlocked: () => {
        useUiStore.getState().pushEvent({
          kind: 'regionUnlocked',
          titleKey: 'event.region.title',
          bodyKey: 'event.region.body',
        });
      },
      onCoverageInfo: (info) => setCoverage(info),
      onPlace: (defId, x, y, rotation) => {
        const result = controller.placeBuilding(defId, x, y, rotation);
        if (!result.ok) {
          ui.pushToast(placementErrorText(defId, result.error), 'error');
          return;
        }
        // Roads & decoration stay in placement mode for quick drawing.
        const def = controller.config.buildings.get(defId);
        if (def && def.category !== 'roads' && def.category !== 'decoration') {
          useUiStore.getState().stopPlacing();
        }
      },
      // Drag-painting a road: silent on overlap so a swipe doesn't spam toasts,
      // but a real blocker (funds, locked sector) still surfaces once.
      onDragPlace: (defId, x, y) => {
        const result = controller.placeBuilding(defId, x, y);
        if (!result.ok && result.error !== 'occupied') {
          ui.pushToast(placementErrorText(defId, result.error), 'error');
        }
      },
    };

    // Build the 3D renderer (the only render path since § Welt 2.0); expose the
    // camera to the HUD and apply the player's current camera preset (§ presets).
    const renderer: IMapRenderer = new ThreeMapRenderer(controller, callbacks);
    rendererRef.current = renderer;
    void renderer.init(host);
    setMapApi(makeMapApi(renderer));
    renderer.applyPreset(ui.cameraPreset);

    // Mirror UI state into the renderer.
    const unsubscribe = useUiStore.subscribe((s) => {
      renderer.setPlacing(s.placingDefId);
      renderer.setPlacingRotation(s.placingRotation);
      renderer.setMoving(s.movingBuildingId);
      renderer.setSelected(s.selectedBuildingId);
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useUiStore.getState().stopPlacing();
        useUiStore.getState().stopMoving();
        useUiStore.getState().selectBuilding(undefined);
        useUiStore.getState().openRegionDialog(undefined);
      }
      // Rotate the building about to be placed, 90° per press (§ Gebäude-Rotation).
      if ((e.key === 'r' || e.key === 'R') && useUiStore.getState().placingDefId !== undefined) {
        useUiStore.getState().rotatePlacing();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      unsubscribe();
      setMapApi(undefined);
      renderer.destroy();
      rendererRef.current = undefined;
    };
  }, []);

  const placing = useUiStore((s) => s.placingDefId);
  const moving = useUiStore((s) => s.movingBuildingId);
  const overlayMode = useUiStore((s) => s.overlayMode);
  const active = placing !== undefined || moving !== undefined;

  // Headline supply figure for the top-centre banner (§7): share of served
  // consumers among all in-radius consumers.
  const banner = coverage ? coverageBanner(coverage) : undefined;

  return (
    <div className={`map-host${overlayMode ? ' overlay-active' : ''}`} ref={hostRef}>
      {active && <PlacementBanner info={hoverInfo} moving={moving !== undefined} />}
      {banner && !active && <ServiceOverlayBanner label={banner.label} detail={banner.detail} tone={banner.tone} />}
      {coverage && !active && <CoverageLegend info={coverage} />}
    </div>
  );
}

/** Turn coverage counts into the top-centre banner's headline. */
function coverageBanner(info: CoverageInfo): { label: string; detail: string; tone: 'good' | 'warn' | 'bad' } {
  const { supplied, partial, unsupplied } = info.counts;
  const total = supplied + partial + unsupplied;
  const pct = total > 0 ? Math.round((supplied / total) * 100) : 100;
  const tone: 'good' | 'warn' | 'bad' = pct >= 90 ? 'good' : pct >= 60 ? 'warn' : 'bad';
  return { label: info.label, detail: t('ui.overlay.covered', { pct }), tone };
}

/** Build-limit failures carry the next unlock level for a clear message (§16). */
function placementErrorText(defId: string, error: string): string {
  if (error !== 'limit_reached') return t(`error.${error}`);
  const controller = getController();
  const limit = controller.getBuildLimit(defId);
  const building = t(controller.config.buildings.get(defId)?.nameKey ?? '');
  if (limit?.nextLevel !== undefined) return t('ui.limit.reached_next', { building, level: limit.nextLevel });
  return t('ui.limit.reached_max', { building });
}

/** Legend for the coverage overlay: what each home color means (§1) + a summary
 *  of how many buildings are served / partial / unserved (§21). */
function CoverageLegend({ info }: { info: CoverageInfo }) {
  const states = ['supplied', 'redundant', 'partial', 'unsupplied'] as const;
  const fmt = (n: number) => Math.round(n).toLocaleString('de-DE');
  return (
    <div className="coverage-legend">
      <div className="coverage-legend-head">{t('ui.coverage.legend', { label: info.label })}</div>
      {info.capacity && (
        <div className={`coverage-legend-cap${info.underCapacity ? ' over' : ''}`}>
          {t('ui.coverage.capacity', { used: fmt(info.capacity.used), servable: fmt(info.capacity.servable) })}
        </div>
      )}
      <div className="coverage-legend-summary">
        {t('ui.coverage.summary', {
          supplied: info.counts.supplied,
          partial: info.counts.partial,
          unsupplied: info.counts.unsupplied,
        })}
      </div>
      <div className="coverage-legend-items">
        {states.map((s) => (
          <span key={s} className="coverage-legend-item">
            <span className={`coverage-swatch coverage-${s}`} />
            {t(`ui.coverage.${s}`)}
          </span>
        ))}
      </div>
      {info.underCapacity && <div className="coverage-legend-warn">{t('ui.coverage.undercapacity', { label: info.label })}</div>}
    </div>
  );
}

/**
 * Large, central placement feedback: the reason a spot doesn't work (or the
 * location bonus it would get) — no squinting at small toasts (§ UX).
 */
function PlacementBanner({ info, moving }: { info: HoverInfo | undefined; moving: boolean }) {
  const controller = getController();
  const defName = info ? t(controller.config.buildings.get(info.defId)?.nameKey ?? '') : '';
  const placingDefId = useUiStore((s) => s.placingDefId);
  const placingRotation = useUiStore((s) => s.placingRotation);
  const rotatePlacing = useUiStore((s) => s.rotatePlacing);
  // Rotation is cosmetic-only and roads auto-orient from their neighbour mask
  // (§ Gebäude-Rotation), so the control only makes sense for regular buildings.
  const rotatable = !moving && placingDefId !== undefined && controller.config.buildings.get(placingDefId)?.category !== 'roads';

  let className = 'placement-banner';
  let icon = <Move size={18} />;
  let text = moving ? t('ui.move.hint') : t('ui.placement.hint');
  if (info?.error) {
    className += ' banner-bad';
    icon = <AlertTriangle size={18} />;
    text = `${defName}: ${t(`error.${info.error}`)}`;
  } else if (info && info.bonusPct > 0) {
    className += ' banner-bonus';
    icon = <Sparkles size={18} />;
    text = `${defName}: ${t('ui.location_bonus', { pct: Math.round(info.bonusPct) })}`;
  } else if (info) {
    className += ' banner-ok';
    icon = <CheckCircle2 size={18} />;
    text = `${defName}: ${moving ? t('ui.move.valid') : t('ui.placement.valid')}`;
  }

  return (
    <div className={className}>
      {icon}
      <span>{text}</span>
      {rotatable && (
        <button
          type="button"
          className="banner-rotate"
          onClick={rotatePlacing}
          title={t('ui.placement.rotate_hint')}
        >
          <RotateCw size={16} />
          {placingRotation}°
        </button>
      )}
      <span className="banner-sub">{t('ui.placement.cancel_hint')}</span>
    </div>
  );
}
