import { useEffect, useRef } from 'react';
import { MapRenderer } from '../renderer/MapRenderer.ts';
import { getController, useUiStore } from '../state/store.ts';
import { t } from '../i18n/index.ts';

export function MapView() {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<MapRenderer>(undefined);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const controller = getController();
    const ui = useUiStore.getState();

    const renderer = new MapRenderer(controller, {
      onSelectBuilding: (id) => useUiStore.getState().selectBuilding(id),
      onClickLockedSector: (id) => useUiStore.getState().openSectorDialog(id),
      onCancelPlacement: () => useUiStore.getState().stopPlacing(),
      onQuickCollect: (id) => {
        const b = controller.state.buildings[id];
        if (b && Math.floor(b.buffer) >= 1) return controller.collectYield(id).ok;
        return false;
      },
      onPlace: (defId, x, y) => {
        const result = controller.placeBuilding(defId, x, y);
        if (!result.ok) {
          ui.pushToast(t(`error.${result.error}`), 'error');
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

    // Mirror UI state (placement/selection) into the renderer.
    const unsubscribe = useUiStore.subscribe((s) => {
      renderer.setPlacing(s.placingDefId);
      renderer.setSelected(s.selectedBuildingId);
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useUiStore.getState().stopPlacing();
        useUiStore.getState().selectBuilding(undefined);
        useUiStore.getState().openSectorDialog(undefined);
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      unsubscribe();
      renderer.destroy();
      rendererRef.current = undefined;
    };
  }, []);

  const placing = useUiStore((s) => s.placingDefId);

  return (
    <div className="map-host" ref={hostRef}>
      {placing && <div className="placement-hint">{t('ui.placement.hint')}</div>}
    </div>
  );
}
