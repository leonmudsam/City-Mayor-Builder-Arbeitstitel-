import { useCallback, useEffect, useRef, useState } from 'react';
import { loadConfig } from './game/config/index.ts';
import { createNewGame } from './game/newGame.ts';
import { GameController } from './game/commands/controller.ts';
import type { GameState } from './game/types.ts';
import { LocalStorageSaveAdapter } from './game/storage/localStorageAdapter.ts';
import { DEFAULT_SLOT } from './game/storage/saveAdapter.ts';
import { importSave } from './game/storage/exportImport.ts';
import { setController, useUiStore } from './state/store.ts';
import { MapView } from './components/MapView.tsx';
import { GameHud } from './components/hud/GameHud.tsx';
import { QuickActionBar } from './components/hud/QuickActionBar.tsx';
import { BuildMenu } from './components/panels/BuildMenu.tsx';
import { FloatingBuildingSheet } from './components/panels/FloatingBuildingSheet.tsx';
import { CitizenRequestsPanel } from './components/panels/CitizenRequestsPanel.tsx';
import { MayorPanel } from './components/panels/MayorPanel.tsx';
import { CityStatusPanel } from './components/panels/CityStatusPanel.tsx';
import { CityStatusDetail } from './components/panels/CityStatusDetail.tsx';
import { CityWorkPanel } from './components/panels/CityWorkPanel.tsx';
import { EconomyPanel } from './components/panels/EconomyPanel.tsx';
import { SectorDialog } from './components/panels/SectorDialog.tsx';
import { SettingsPanel } from './components/panels/SettingsPanel.tsx';
import { TradePanel } from './components/panels/TradePanel.tsx';
import { DebugPanel } from './components/panels/DebugPanel.tsx';
import { ActivityPanel } from './components/panels/ActivityPanel.tsx';
import { MenuPanel } from './components/panels/MenuPanel.tsx';
import { formatMoney } from './i18n/index.ts';
import { Toasts } from './components/common/Toasts.tsx';
import { EventModal } from './components/common/EventModal.tsx';
import { t } from './i18n/index.ts';

const adapter = new LocalStorageSaveAdapter();

/** Optional "how to start over" flavour for the reset button (§10). */
export type ResetVariant = 'normal' | 'bonus';

export function App() {
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string>();
  // Bumped on reset/import to remount the game view (fresh Pixi renderer, no
  // stale sector/building caches) — the controller instance itself is reused.
  const [gameKey, setGameKey] = useState(0);
  const controllerRef = useRef<GameController | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let tickTimer: ReturnType<typeof setInterval> | undefined;
    let saveTimer: ReturnType<typeof setInterval> | undefined;
    let controller: GameController | undefined;

    const save = () => {
      if (controller) void adapter.save(DEFAULT_SLOT, controller.state);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') save();
      else controller?.update(Date.now());
    };

    (async () => {
      try {
        const config = loadConfig();
        const existing = await adapter.load(DEFAULT_SLOT);
        const state = existing ?? createNewGame(config, 'Neustadt', Date.now());
        controller = new GameController(config, state);
        controllerRef.current = controller;
        setController(controller);
        controller.update(Date.now()); // offline catch-up
        controller.subscribe((event) => {
          if (event.type === 'levelUp') {
            const level = controller!.state.level.current;
            // Announce what the new level unlocks (§9 Level-Up-Popup) so new
            // buildings aren't missed — pass the ids so the modal can show a
            // card with each building's artwork, not just a name list.
            const unlockIds = controller!.unlocksAtLevel(level);
            const unlocks = unlockIds.map((id) => t(`building.${id}`)).join(', ');
            useUiStore.getState().pushEvent({
              kind: 'levelUp',
              titleKey: 'event.level_up.title',
              bodyKey: unlocks ? 'event.level_up.body_unlocks' : 'event.level_up.body',
              params: unlocks ? { level, buildings: unlocks, buildingIds: unlockIds.join(',') } : { level },
            });
            save();
          } else if (event.type === 'activityCompleted') {
            // Celebrate the finished Stadtarbeit run (§ Abschlussmeldung).
            useUiStore.getState().pushEvent({
              kind: 'activityDone',
              titleKey: 'event.activity.title',
              bodyKey: 'event.activity.body',
              params: { name: t(`activity.${event.defId}`), money: formatMoney(event.money), xp: event.xp },
            });
            save();
          }
        });
        if (cancelled) return;

        // Foreground tick. The economy only runs while the tab is actually
        // visible (§ no AFK farming) — a hidden tab still advances build
        // timers via non-live ticks, same as offline catch-up.
        tickTimer = setInterval(
          () => controller?.update(Date.now(), document.visibilityState === 'visible'),
          1000,
        );
        saveTimer = setInterval(save, 30_000);
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('beforeunload', save);
        setReady(true);
      } catch (error) {
        setBootError(String(error));
      }
    })();

    return () => {
      cancelled = true;
      if (tickTimer) clearInterval(tickTimer);
      if (saveTimer) clearInterval(saveTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', save);
      save();
    };
  }, []);

  /** Swap in a fresh (or imported) state in place, persist it, and remount the
   *  view — no page reload, so the autosave can't clobber the change (§10). */
  const applyState = useCallback((next: GameState) => {
    const controller = controllerRef.current;
    if (!controller) return;
    const ui = useUiStore.getState();
    ui.stopPlacing();
    ui.stopMoving();
    ui.selectBuilding(undefined);
    ui.openSectorDialog(undefined);
    ui.setPanel(undefined);
    controller.resetTo(next);
    void adapter.save(DEFAULT_SLOT, next);
    controller.update(Date.now());
    setGameKey((k) => k + 1);
  }, []);

  const handleReset = useCallback(
    (variant: ResetVariant = 'normal') => {
      const controller = controllerRef.current;
      if (!controller) return;
      const fresh = createNewGame(controller.config, 'Neustadt', Date.now());
      if (variant === 'bonus') {
        // A generous test-start for balancing the early game quickly (§10).
        fresh.resources.money += 200_000;
        fresh.gold.balance += 500;
      }
      applyState(fresh);
    },
    [applyState],
  );

  const handleImport = useCallback(
    (json: string): boolean => {
      try {
        applyState(importSave(json));
        return true;
      } catch {
        return false;
      }
    },
    [applyState],
  );

  if (bootError) return <div className="boot-error">Fehler beim Start: {bootError}</div>;
  if (!ready) return <div className="boot-loading">{t('app.title')} …</div>;
  return <GameScreen key={gameKey} onImport={handleImport} onReset={handleReset} />;
}

function GameScreen({ onImport, onReset }: { onImport(json: string): boolean; onReset(variant?: ResetVariant): void }) {
  const openPanel = useUiStore((s) => s.openPanel);
  const events = useUiStore((s) => s.events);
  const dismissEvent = useUiStore((s) => s.dismissEvent);
  const currentEvent = events[0];

  return (
    <div className="app">
      <GameHud />
      <main className="main">
        <MapView />

        {/* Persistent HUD frame (mockup): status left-top, city work left-bottom,
            citizen requests right, quick actions right-bottom. */}
        <CityStatusPanel />
        <CityWorkPanel />
        <CitizenRequestsPanel />
        <QuickActionBar />

        {/* Overlay panels, opened from the HUD / menu — only one at a time. */}
        {openPanel === 'mayor' && <MayorPanel />}
        {openPanel === 'status' && <CityStatusDetail />}
        {openPanel === 'economy' && <EconomyPanel />}
        {openPanel === 'settings' && <SettingsPanel onImport={onImport} onReset={onReset} />}
        {openPanel === 'trade' && <TradePanel />}
        {openPanel === 'debug' && <DebugPanel />}
        {openPanel === 'activities' && <ActivityPanel />}
        {openPanel === 'menu' && <MenuPanel />}

        <FloatingBuildingSheet />
        <SectorDialog />
        {openPanel === 'build' && <BuildMenu />}
      </main>
      <Toasts />
      {currentEvent && <EventModal event={currentEvent} onClose={() => dismissEvent(currentEvent.id)} />}
    </div>
  );
}
