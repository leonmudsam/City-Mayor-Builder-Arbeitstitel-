import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, MapPin, Move, Sparkles } from 'lucide-react';
import { MapRenderer, type HoverInfo } from '../renderer/MapRenderer.ts';
import { getController, useUiStore } from '../state/store.ts';
import { t } from '../i18n/index.ts';

export function MapView() {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<MapRenderer>(undefined);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | undefined>(undefined);
  const [showUnlock, setShowUnlock] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const controller = getController();
    const ui = useUiStore.getState();
    let unlockTimer: ReturnType<typeof setTimeout> | undefined;

    const renderer = new MapRenderer(controller, {
      onSelectBuilding: (id) => useUiStore.getState().selectBuilding(id),
      onClickLockedSector: (id) => useUiStore.getState().openSectorDialog(id),
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
      onSectorUnlocked: () => {
        setShowUnlock(true);
        if (unlockTimer) clearTimeout(unlockTimer);
        unlockTimer = setTimeout(() => setShowUnlock(false), 2800);
      },
      onPlace: (defId, x, y) => {
        const result = controller.placeBuilding(defId, x, y);
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
    });
    rendererRef.current = renderer;
    void renderer.init(host);

    // Mirror UI state (placement/move/selection) into the renderer.
    const unsubscribe = useUiStore.subscribe((s) => {
      renderer.setPlacing(s.placingDefId);
      renderer.setMoving(s.movingBuildingId);
      renderer.setSelected(s.selectedBuildingId);
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useUiStore.getState().stopPlacing();
        useUiStore.getState().stopMoving();
        useUiStore.getState().selectBuilding(undefined);
        useUiStore.getState().openSectorDialog(undefined);
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      if (unlockTimer) clearTimeout(unlockTimer);
      unsubscribe();
      renderer.destroy();
      rendererRef.current = undefined;
    };
  }, []);

  const placing = useUiStore((s) => s.placingDefId);
  const moving = useUiStore((s) => s.movingBuildingId);
  const active = placing !== undefined || moving !== undefined;

  return (
    <div className="map-host" ref={hostRef}>
      {active && <PlacementBanner info={hoverInfo} moving={moving !== undefined} />}
      {showUnlock && (
        <div className="event-popup">
          <MapPin size={22} />
          <div>
            <strong>{t('ui.sector.unlocked_title')}</strong>
            <span>{t('ui.sector.unlocked_desc')}</span>
          </div>
        </div>
      )}
    </div>
  );
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

/**
 * Large, central placement feedback: the reason a spot doesn't work (or the
 * location bonus it would get) — no squinting at small toasts (§ UX).
 */
function PlacementBanner({ info, moving }: { info: HoverInfo | undefined; moving: boolean }) {
  const controller = getController();
  const defName = info ? t(controller.config.buildings.get(info.defId)?.nameKey ?? '') : '';

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
      <span className="banner-sub">{t('ui.placement.cancel_hint')}</span>
    </div>
  );
}
