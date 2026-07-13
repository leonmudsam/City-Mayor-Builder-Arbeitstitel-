import { useEffect, useState } from 'react';
import { loadConfig } from './game/config/index.ts';
import { createNewGame } from './game/newGame.ts';
import { GameController } from './game/commands/controller.ts';
import { LocalStorageSaveAdapter } from './game/storage/localStorageAdapter.ts';
import { DEFAULT_SLOT } from './game/storage/saveAdapter.ts';
import { importSave } from './game/storage/exportImport.ts';
import { setController, useUiStore } from './state/store.ts';
import { MapView } from './components/MapView.tsx';
import { TopBar } from './components/hud/TopBar.tsx';
import { BottomBar } from './components/hud/BottomBar.tsx';
import { BuildMenu } from './components/panels/BuildMenu.tsx';
import { FloatingBuildingSheet } from './components/panels/FloatingBuildingSheet.tsx';
import { QuestPanel } from './components/panels/QuestPanel.tsx';
import { MayorPanel } from './components/panels/MayorPanel.tsx';
import { CityStatusPanel } from './components/panels/CityStatusPanel.tsx';
import { EconomyPanel } from './components/panels/EconomyPanel.tsx';
import { SectorDialog } from './components/panels/SectorDialog.tsx';
import { SettingsPanel } from './components/panels/SettingsPanel.tsx';
import { Toasts } from './components/common/Toasts.tsx';
import { EventModal } from './components/common/EventModal.tsx';
import { t } from './i18n/index.ts';

const adapter = new LocalStorageSaveAdapter();

export function App() {
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string>();

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
        setController(controller);
        controller.update(Date.now()); // offline catch-up
        controller.subscribe((event) => {
          if (event.type === 'levelUp') {
            const level = controller!.state.level.current;
            // Announce what the new level unlocks (§7) so new buildings aren't missed.
            const unlocks = controller!.unlocksAtLevel(level).map((id) => t(`building.${id}`)).join(', ');
            useUiStore.getState().pushEvent({
              kind: 'levelUp',
              titleKey: 'event.level_up.title',
              bodyKey: unlocks ? 'event.level_up.body_unlocks' : 'event.level_up.body',
              params: unlocks ? { level, buildings: unlocks } : { level },
            });
            save();
          }
        });
        if (cancelled) return;

        tickTimer = setInterval(() => controller?.update(Date.now()), 1000);
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

  if (bootError) return <div className="boot-error">Fehler beim Start: {bootError}</div>;
  if (!ready) return <div className="boot-loading">{t('app.title')} …</div>;
  return <GameScreen />;
}

function GameScreen() {
  const openPanel = useUiStore((s) => s.openPanel);
  const events = useUiStore((s) => s.events);
  const dismissEvent = useUiStore((s) => s.dismissEvent);
  const currentEvent = events[0];

  const handleImport = (json: string): boolean => {
    try {
      const state = importSave(json);
      void adapter.save(DEFAULT_SLOT, state).then(() => window.location.reload());
      return true;
    } catch {
      return false;
    }
  };

  const handleReset = () => {
    void adapter.delete(DEFAULT_SLOT).then(() => window.location.reload());
  };

  return (
    <div className="app">
      <TopBar />
      <main className="main">
        <MapView />
        {openPanel === 'quests' && <QuestPanel />}
        {openPanel === 'mayor' && <MayorPanel />}
        {openPanel === 'status' && <CityStatusPanel />}
        {openPanel === 'economy' && <EconomyPanel />}
        {openPanel === 'settings' && <SettingsPanel onImport={handleImport} onReset={handleReset} />}
        <FloatingBuildingSheet />
        <SectorDialog />
        {openPanel === 'build' && <BuildMenu />}
      </main>
      <BottomBar />
      <Toasts />
      {currentEvent && <EventModal event={currentEvent} onClose={() => dismissEvent(currentEvent.id)} />}
    </div>
  );
}
