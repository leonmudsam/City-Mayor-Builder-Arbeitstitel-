import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Move, RotateCw, Sparkles } from 'lucide-react';
import { ThreeMapRenderer } from '../renderer/three/ThreeMapRenderer.ts';
import type { HoverInfo, IMapRenderer, RendererCallbacks } from '../renderer/IMapRenderer.ts';
import { getController, setMapApi, useUiStore, type MapApi } from '../state/store.ts';
import { ServiceOverlayBanner } from './hud/ServiceOverlayBanner.tsx';
import { t } from '../i18n/index.ts';
import { buildSmartRoadPlanView, buildWorkAreaPlannerView } from './operations/adapters.ts';
import { WaterfrontPlacementHud } from './operations/WaterfrontPlacementHud.tsx';

interface CoverageInfo {
  label: string;
  underCapacity: boolean;
  counts: { supplied: number; partial: number; unsupplied: number };
  capacity?: { servable: number; used: number };
}

/** Fügt einen Straßen-KONTROLLPUNKT an (Start, Zwischenpunkt oder Ziel). Die
 * lückenlose, terrainbewusste Verbindung dazwischen erzeugt der Router im
 * Controller (`roadPathPreview`, § Infrastruktur 2.0 / I2) — die UI sammelt nur
 * die geklickten/gezogenen Ankerpunkte. Aufeinanderfolgende Duplikate (Klick auf
 * dieselbe Kachel, Drag über dieselbe Kachel) werden verworfen. Reiner UI-State. */
function pushRoadPoint(target: { x: number; y: number }): void {
  const state = useUiStore.getState();
  const tile = { x: Math.round(target.x), y: Math.round(target.y) };
  const last = state.roadPlanPath[state.roadPlanPath.length - 1];
  if (last && last.x === tile.x && last.y === tile.y) return;
  state.setRoadPlanPath([...state.roadPlanPath, tile]);
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
    setInfoLayer: (mode) => r.setInfoLayer(mode),
    setInfrastructureLayer: (mode) => r.setInfrastructureLayer(mode),
    setWorkAreaOverlay: (overlay) => r.setWorkAreaOverlay(overlay),
    setRoadPlanOverlay: (tiles) => r.setRoadPlanOverlay(tiles),
    setWorldReveal: (state) => r.setWorldReveal(state),
    canDrive: () => r.canDrive(),
    enterDrive: () => r.enterDrive(),
    exitDrive: () => r.exitDrive(),
    setMissionFollow: (active) => r.setMissionFollow(active),
    isMissionFollowing: () => r.isMissionFollowing(),
  };
}

export function MapView() {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<IMapRenderer>(undefined);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | undefined>(undefined);
  const [coverage, setCoverage] = useState<CoverageInfo | undefined>(undefined);
  const [workAreaHover, setWorkAreaHover] = useState<{ id: string; x: number; y: number }>();

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
        const activeDef = active
          ? controller.config.activities.activities.find((activity) => activity.id === active.defId)
          : undefined;
        if (id && !activeDef?.drive && active?.targets.some((tg) => tg.buildingId === id && !tg.done)) {
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
      onWorkAreaNodeClick: (id) => {
        const state = useUiStore.getState();
        if (state.workAreaSelectionMode === 'single') state.setWorkAreaSelectedNodeIds([id]);
        else state.toggleWorkAreaNode(id, state.workAreaSelectionMode === 'exclude' ? false : undefined);
      },
      onWorkAreaNodeHover: (id, clientX, clientY) => {
        useUiStore.getState().setWorkAreaHoverNode(id);
        const rect = host.getBoundingClientRect();
        setWorkAreaHover(
          id && clientX !== undefined && clientY !== undefined
            ? { id, x: clientX - rect.left, y: clientY - rect.top }
            : undefined,
        );
      },
      // § A6 Fahrmodus: Ein-/Ausstieg spiegeln + erreichte Ziele abschließen.
      onDriveChange: (isActive) => useUiStore.getState().setDriveActive(isActive),
      onDriveProgress: (id) => {
        const result = controller.progressActivity(id);
        if (result.ok) {
          useUiStore.getState().pushToast(t('ui.activity.delivered'), 'success');
          if (!controller.state.activities.active) useUiStore.getState().setMissionFollow(false);
        }
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
        // § 12.2 Gründung: Der allererste Klick setzt das Rathaus. Eigener
        // Command (kostenlos, einmalig) statt einer Ausnahme im Baupfad.
        if (defId === 'town_hall' && !controller.isCityFounded()) {
          const founded = controller.foundCity(x, y);
          if (!founded.ok) {
            ui.pushToast(placementErrorText(defId, founded.error), 'error');
            return;
          }
          useUiStore.getState().stopPlacing();
          ui.pushToast(t('ui.founding.done'), 'success');
          return;
        }
        // Alle Straßen-Bauklassen (Bodenstraße, Höhenstraße/Brücke) laufen über den
        // Straßenentwurf-Planer, nicht über Sofortbau (§ Infrastruktur 2.0 / I1).
        if (controller.config.buildings.get(defId)?.category === 'roads') {
          pushRoadPoint({ x, y });
          return;
        }
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
        if (controller.config.buildings.get(defId)?.category === 'roads') {
          pushRoadPoint({ x, y });
          return;
        }
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
    renderer.setInfoLayer(ui.infoLayerMode);
    renderer.setInfrastructureLayer(ui.infrastructureLayerMode);
    renderer.setRoadPlanOverlay([]);
    renderer.setWorkAreaOverlay(undefined);
    const syncWorldReveal = (state = useUiStore.getState()) => renderer.setWorldReveal({
      fogDisabled: state.fogDisabled,
      revealLockedRegionsVisually: state.revealLockedRegionsVisually,
      unlockAllRegionsGameplay: [...controller.config.regions.values()]
        .filter((region) => region.unlockable)
        .every((region) => controller.state.world.regions[String(region.id)]?.status === 'unlocked'),
    });
    syncWorldReveal(ui);

    // Mirror UI state into the renderer.
    const unsubscribe = useUiStore.subscribe((s) => {
      renderer.setPlacing(s.placingDefId);
      renderer.setPlacingRotation(s.placingRotation);
      renderer.setMoving(s.movingBuildingId);
      renderer.setSelected(s.selectedBuildingId);
      renderer.setInfoLayer(s.infoLayerMode);
      renderer.setInfrastructureLayer(s.infrastructureLayerMode);
      const placingRoadClass = s.placingDefId && controller.config.buildings.get(s.placingDefId)?.category === 'roads'
        ? s.placingDefId
        : undefined;
      const roadPlan = placingRoadClass && s.roadPlanPath.length > 0
        ? buildSmartRoadPlanView(controller, s.roadPlanPath, placingRoadClass)
        : undefined;
      renderer.setRoadPlanOverlay(roadPlan?.tiles ?? []);
      syncWorldReveal(s);
    });
    const unsubscribeController = controller.subscribe(() => syncWorldReveal());

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useUiStore.getState().stopPlacing();
        useUiStore.getState().stopMoving();
        useUiStore.getState().selectBuilding(undefined);
        useUiStore.getState().openRegionDialog(undefined);
        useUiStore.getState().closeWorkAreaPlanner();
        useUiStore.getState().closeResourceNetwork();
        renderer.setWorkAreaOverlay(undefined);
        renderer.setRoadPlanOverlay([]);
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
      unsubscribeController();
      setMapApi(undefined);
      renderer.destroy();
      rendererRef.current = undefined;
    };
  }, []);

  const placing = useUiStore((s) => s.placingDefId);
  const moving = useUiStore((s) => s.movingBuildingId);
  const overlayMode = useUiStore((s) => s.overlayMode);
  const active = placing !== undefined || moving !== undefined;
  // Beim Straßenplanen ist der SmartRoadPlannerHud die einzige Autorität: das
  // Ein-Kachel-Hover-Banner würde den Endpunkt isoliert prüfen und fälschlich
  // „Braucht Anschluss…" melden, obwohl der pfad-bewusste Planer „Baubar" zeigt.
  const planningRoad = placing !== undefined && getController().config.buildings.get(placing)?.category === 'roads';

  // Headline supply figure for the top-centre banner (§7): share of served
  // consumers among all in-radius consumers.
  const banner = coverage ? coverageBanner(coverage) : undefined;

  return (
    <div className={`map-host${overlayMode ? ' overlay-active' : ''}`} ref={hostRef}>
      {active && hoverInfo?.waterfront
        ? <WaterfrontPlacementHud info={hoverInfo} />
        : active && !planningRoad && <PlacementBanner info={hoverInfo} moving={moving !== undefined} />}
      {banner && !active && <ServiceOverlayBanner label={banner.label} detail={banner.detail} tone={banner.tone} />}
      {coverage && !active && <CoverageLegend info={coverage} />}
      {workAreaHover && <WorkAreaMapTooltip hover={workAreaHover} />}
    </div>
  );
}

function WorkAreaMapTooltip({ hover }: { hover: { id: string; x: number; y: number } }) {
  const game = getController();
  const state = useUiStore.getState();
  if (!state.workAreaPlannerBuildingId) return null;
  const view = buildWorkAreaPlannerView(
    game,
    state.workAreaPlannerBuildingId,
    state.workAreaSelectionMode,
    state.workAreaRadius,
    state.workAreaSelectedNodeIds,
  );
  const node = view?.nodes.find((candidate) => candidate.id === hover.id);
  if (!node) return null;
  return (
    <div
      className="work-area-map-tooltip"
      style={{
        left: `${hover.x}px`,
        top: `${hover.y}px`,
        transform: `translate(${hover.x > window.innerWidth * 0.65 ? '-105%' : '18px'}, ${hover.y > window.innerHeight * 0.65 ? '-105%' : '18px'})`,
      }}
    >
      <strong>{node.label}</strong>
      <span>{node.stateLabel}</span>
      <dl>
        <div><dt>Ertrag</dt><dd>{node.amountMin} {node.resourceLabel}</dd></div>
        <div><dt>Entfernung</dt><dd>{node.distanceTiles} Felder</dd></div>
        <div><dt>Effizienz</dt><dd>{node.efficiencyPct}%</dd></div>
      </dl>
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
    text = info.waterfront
      ? `${defName}: ${t('ui.placement.waterfront_valid', {
          depth: info.waterfront.minimumDepth.toFixed(1),
          road: info.waterfront.roadAccess ? t('ui.yes') : t('ui.not_yet'),
        })}`
      : `${defName}: ${moving ? t('ui.move.valid') : t('ui.placement.valid')}`;
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
          {info?.rotation ?? placingRotation}°
        </button>
      )}
      <span className="banner-sub">{t('ui.placement.cancel_hint')}</span>
    </div>
  );
}
