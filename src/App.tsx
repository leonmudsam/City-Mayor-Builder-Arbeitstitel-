import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye } from 'lucide-react';
import { loadConfig } from './game/config/index.ts';
import { createNewGame } from './game/newGame.ts';
import { GameController, type ActivityRunResult } from './game/commands/controller.ts';
import type { GameState } from './game/types.ts';
import { LocalStorageSaveAdapter } from './game/storage/localStorageAdapter.ts';
import { DEFAULT_SLOT } from './game/storage/saveAdapter.ts';
import { importSave } from './game/storage/exportImport.ts';
import { getController, setController, useUiStore } from './state/store.ts';
import { MapView } from './components/MapView.tsx';
import { GameHud } from './components/hud/GameHud.tsx';
import { MissionHud } from './components/hud/MissionHud.tsx';
import { MissionReview } from './components/hud/MissionReview.tsx';
import { FoundingHud } from './components/hud/FoundingHud.tsx';
import { QuickActionBar } from './components/hud/QuickActionBar.tsx';
import { CameraControls } from './components/hud/CameraControls.tsx';
import { WorldMiniMap } from './components/hud/WorldMiniMap.tsx';
import { InfoLayerControl } from './components/hud/InfoLayerControl.tsx';
import { BuildMenu } from './components/panels/BuildMenu.tsx';
import { FloatingBuildingSheet } from './components/panels/FloatingBuildingSheet.tsx';
import { CitizenRequestsPanel } from './components/panels/CitizenRequestsPanel.tsx';
import { MayorPanel } from './components/panels/MayorPanel.tsx';
import { CityStatusPanel } from './components/panels/CityStatusPanel.tsx';
import { CityStatusDetail } from './components/panels/CityStatusDetail.tsx';
import { EconomyPanel } from './components/panels/EconomyPanel.tsx';
import { RegionDialog } from './components/panels/RegionDialog.tsx';
import { SettingsPanel } from './components/panels/SettingsPanel.tsx';
import { TradePanel } from './components/panels/TradePanel.tsx';
import { DebugPanel } from './components/panels/DebugPanel.tsx';
import { ActivityPanel } from './components/panels/ActivityPanel.tsx';
import { ActivityRoutePlanner } from './components/panels/ActivityRoutePlanner.tsx';
import { WeatherPanel } from './components/panels/WeatherPanel.tsx';
import { ActivityExecutionWidget } from './components/citywork/ActivityExecutionWidget.tsx';
import { WorkAreaPlanner } from './components/operations/WorkAreaPlanner.tsx';
import { FarmFieldPanel } from './components/operations/FarmFieldPanel.tsx';
import { ResourceNetworkPanel } from './components/operations/ResourceNetworkPanel.tsx';
import { InfrastructureNetworkPanel } from './components/operations/InfrastructureNetworkPanel.tsx';
import { SmartRoadPlannerHud } from './components/operations/SmartRoadPlannerHud.tsx';
import { formatDuration, formatMoney } from './i18n/index.ts';
import { Toasts } from './components/common/Toasts.tsx';
import { EventModal } from './components/common/EventModal.tsx';
import { t } from './i18n/index.ts';

const adapter = new LocalStorageSaveAdapter();

/**
 * Übersetzt den Abschlussbericht einer Stadtarbeit in Anzeigeparameter
 * (§ Overhaul 8.0 / §3.3). Ein Parameter entsteht nur, wenn die Simulation für
 * diesen Auftragstyp wirklich einen Wert hat — das Popup blendet fehlende
 * Kennzahlen aus, statt sie mit „–" vorzutäuschen.
 */
function activityResultParams(result: ActivityRunResult): Record<string, string | number> {
  const percent = (value: number): string => `${Math.round(value * 100)} %`;
  const params: Record<string, string | number> = { elapsed: formatDuration(result.elapsedMs) };
  if (result.drivingDurationMs !== undefined) params.drivingTime = formatDuration(result.drivingDurationMs);
  if (result.handlingDurationMs !== undefined) params.handlingTime = formatDuration(result.handlingDurationMs);
  if (result.distanceTiles !== undefined) {
    params.distance = `${((result.distanceTiles * 4) / 1000).toFixed(2).replace('.', ',')} km`;
  }
  if (result.emptyTravelRatio !== undefined) params.emptyTravel = percent(result.emptyTravelRatio);
  if (result.loadUtilisation !== undefined) params.utilisation = percent(result.loadUtilisation);
  if (result.trafficLoad !== undefined) params.traffic = percent(result.trafficLoad);
  if (result.spoilageRisk !== undefined && result.spoilageRisk > 0) params.spoilage = percent(result.spoilageRisk);
  if (result.resupplyStops !== undefined) params.resupplies = result.resupplyStops;
  if (result.deliveryTargetsCompleted !== undefined && result.deliveryTargetsTotal !== undefined) {
    params.deliveries = `${result.deliveryTargetsCompleted} / ${result.deliveryTargetsTotal}`;
  }
  if (result.efficiencyScore !== undefined) params.efficiency = `${result.efficiencyScore} %`;
  if (result.roadCoverage !== undefined) params.roadCoverage = percent(result.roadCoverage);
  if (result.vehicle) params.vehicle = t(`vehicle.${result.vehicle}`);
  return params;
}

/** Optional "how to start over" flavour for the reset button (§10). */
export type ResetVariant = 'normal' | 'bonus';

export function App() {
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string>();
  // Bumped on reset/import to remount the game view (fresh 3D renderer, no
  // stale region/building caches) — the controller instance itself is reused.
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
    // §26: Beim Zurückkehren wird NICHT mehr auf die Wanduhr gesprungen — der
    // reguläre Tick meldet die real verstrichene Zeit ohnehin als ein großes
    // Delta und rechnet sie mit der aktiven Geschwindigkeit um. Ein zusätzlicher
    // Sprung auf `Date.now()` würde Pause und Zeitfaktor still übergehen.
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') save();
    };

    (async () => {
      try {
        const config = loadConfig();
        const existing = await adapter.load(DEFAULT_SLOT);
        // § MVP4: Ein Vor-Insel-Save (≤ v9) wurde beim Laden gesichert und der
        // Slot geräumt — den Umzug einmalig freundlich erklären.
        if (adapter.legacyBackupCreated) {
          useUiStore.getState().pushToast(t('ui.legacy_save.notice'), 'success');
        }
        // § Ausbaustufe 2.0: Wurde der Save gerade migriert (v10→v11), den
        // Umbau einmalig erklären — inkl. Erstattungssumme, falls Gebäude
        // den neuen Footprints/Regionen weichen mussten.
        if (adapter.migrationNotice) {
          const notice = adapter.migrationNotice;
          adapter.migrationNotice = undefined;
          const money = notice.refunded.money ?? 0;
          useUiStore
            .getState()
            .pushToast(
              notice.removedBuildings > 0
                ? t('ui.migration.v11_refund', {
                    count: notice.removedBuildings,
                    money: money.toLocaleString('de-DE'),
                  })
                : t('ui.migration.v11_notice'),
              'success',
            );
        }
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
            // Celebrate the finished Stadtarbeit run (§ Abschlussmeldung). A
            // graded run (delivery) shows its Bronze/Silber/Gold medal (§6).
            const quality = event.quality;
            useUiStore.getState().pushEvent({
              kind: 'activityDone',
              titleKey: quality ? `event.activity.title_${quality}` : 'event.activity.title',
              bodyKey: quality ? 'event.activity.body_quality' : 'event.activity.body',
              params: {
                name: t(`activity.${event.defId}`),
                money: formatMoney(event.money),
                xp: event.xp,
                ...(quality ? { quality: t(`activity.quality.${quality}`) } : {}),
                // §3.3: Jede Kennzahl kommt aus der echten Simulation. Fehlt
                // ein Wert für diesen Auftragstyp, wird der Parameter NICHT
                // gesetzt — das Popup lässt die Zeile dann weg, statt „–" zu
                // zeigen.
                ...(event.result ? activityResultParams(event.result) : {}),
              },
            });
            save();
          }
        });
        if (cancelled) return;

        // Foreground tick. The economy only runs while the tab is actually
        // visible (§ no AFK farming) — a hidden tab still advances build
        // timers via non-live ticks, same as offline catch-up.
        //
        // § Overhaul 8.0 / §26: Der Tick liefert REALE verstrichene Zeit; der
        // Controller rechnet sie mit der gewählten Geschwindigkeit in
        // Simulationszeit um. Dadurch skalieren Einnahmen, Verbrauch,
        // Produktion und Bauzeit zwingend gemeinsam, und Pause hält alles an.
        // Die Länge des Intervalls beeinflusst die Wirtschaft nicht — nur wie
        // fein sie aufgelöst wird.
        let lastRealTick = Date.now();
        tickTimer = setInterval(() => {
          const now = Date.now();
          const realDelta = now - lastRealTick;
          lastRealTick = now;
          controller?.advanceByRealTime(realDelta, document.visibilityState === 'visible');
        }, 1000);
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
    ui.openRegionDialog(undefined);
    ui.closeWorkAreaPlanner();
    ui.closeResourceNetwork();
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

// Panels that dock as large sheets on the RIGHT side (§5). While one is open the
// compact citizen-requests widget steps aside so the sheet has the full column.
const RIGHT_SHEET_PANELS = new Set(['build', 'status', 'economy', 'trade', 'mayor', 'activities', 'settings', 'debug', 'weather']);

function GameScreen({ onImport, onReset }: { onImport(json: string): boolean; onReset(variant?: ResetVariant): void }) {
  const openPanel = useUiStore((s) => s.openPanel);
  const activityPlannerDefId = useUiStore((s) => s.activityPlannerDefId);
  const workAreaPlannerBuildingId = useUiStore((s) => s.workAreaPlannerBuildingId);
  const fieldToolBuildingId = useUiStore((s) => s.fieldToolBuildingId);
  const resourceNetworkResource = useUiStore((s) => s.resourceNetworkResource);
  const infrastructureNetworkOpen = useUiStore((s) => s.infrastructureNetworkOpen);
  const placingDefId = useUiStore((s) => s.placingDefId);
  const selectedBuildingId = useUiStore((s) => s.selectedBuildingId);
  const regionDialog = useUiStore((s) => s.regionDialog);
  const uiHidden = useUiStore((s) => s.uiHidden);
  const toggleUiHidden = useUiStore((s) => s.toggleUiHidden);
  const events = useUiStore((s) => s.events);
  const dismissEvent = useUiStore((s) => s.dismissEvent);
  const currentEvent = events[0];
  /** § A7: Läuft ein Einsatz, tritt das Stadt-HUD zurück (siehe unten). */
  const driveActive = useUiStore((s) => s.driveActive);
  const rightSheetOpen =
    selectedBuildingId !== undefined ||
    regionDialog !== undefined ||
    (openPanel !== undefined && RIGHT_SHEET_PANELS.has(openPanel));

  // Hidden-UI mode (§8): only the map and a small restore button remain, so the
  // 2D city stays fully playable with a clean, chrome-free view.
  if (uiHidden) {
    return (
      <div className="app">
        <main className="main">
          <MapView />
          <button className="ui-restore" onClick={toggleUiHidden} title={t('ui.quick.show')}>
            <Eye size={18} />
            <span>{t('ui.quick.show')}</span>
          </button>
          <MissionHud />
          <MissionReview />
        </main>
        <Toasts />
      </div>
    );
  }

  return (
    <div className="app">
      <GameHud />
      <main className="main">
        <MapView />

        {activityPlannerDefId ? (
          <ActivityRoutePlanner key={activityPlannerDefId} defId={activityPlannerDefId} />
        ) : fieldToolBuildingId ? (
          <>
            {/* § D-058: Das Feldwerkzeug ist ein Entwurf am Cursor — die
                Kamerabedienung bleibt, damit der Spieler zum Ziel fahren kann. */}
            <FarmFieldPanel key={fieldToolBuildingId} />
            <CameraControls />
          </>
        ) : workAreaPlannerBuildingId ? (
          <>
            <WorkAreaPlanner key={workAreaPlannerBuildingId} />
            <CameraControls />
          </>
        ) : resourceNetworkResource ? (
          <>
            <ResourceNetworkPanel key={resourceNetworkResource} resource={resourceNetworkResource} />
            <CameraControls />
          </>
        ) : infrastructureNetworkOpen ? (
          <>
            <InfrastructureNetworkPanel />
            <CameraControls />
          </>
        ) : (
          <>
            {/* Eine große Arbeitsfläche hat Vorrang vor dem passiven HUD. Zuvor
                blieben Status, Minimap und Info-Layer unter Bau-Shop/Sheets
                liegen und erzeugten die gemeldeten Überlagerungen.

                § A7 (Stadtarbeit 3.0): Der laufende EINSATZ ist die größte
                Arbeitsfläche von allen. „Großer Fokus auf Welt, wenige klare
                Panels" heißt: Stadtstatus, Anliegen, Minimap, Info-Layer,
                Kamerasteuerung und Schnellleiste treten zurück — sie
                beantworten Fragen, die man am Steuer nicht stellt, und sie
                lagen ausgerechnet dort, wo das eigene Fahrzeug fährt. Das
                Auftrags-Widget geht mit: Seine drei Knöpfe (einsteigen,
                folgen, Karte) sind Wege IN den Einsatz — im Einsatz sind sie
                Wege im Kreis. */}
            {!rightSheetOpen && !driveActive && <CityStatusPanel />}
            {!rightSheetOpen && !driveActive && <WorldMiniMap />}
            {!rightSheetOpen && !driveActive && <InfoLayerControl />}
            {!rightSheetOpen && !driveActive && (
              <div className="right-hud-stack">
                <CitizenRequestsPanel />
              </div>
            )}
            {!rightSheetOpen && !driveActive && <CameraControls />}
            {!driveActive && <QuickActionBar />}

            {/* Large right-docked detail sheets (§5) — one at a time. */}
            {openPanel === 'mayor' && <MayorPanel />}
            {openPanel === 'status' && <CityStatusDetail />}
            {openPanel === 'economy' && <EconomyPanel />}
            {openPanel === 'settings' && <SettingsPanel onImport={onImport} onReset={onReset} />}
            {openPanel === 'trade' && <TradePanel />}
            {openPanel === 'debug' && <DebugPanel />}
            {openPanel === 'activities' && <ActivityPanel />}
            {openPanel === 'weather' && <WeatherPanel />}
            <FloatingBuildingSheet />
            <RegionDialog />
            {openPanel === 'build' && <BuildMenu />}
            {!driveActive && <ActivityExecutionWidget />}
            <MissionHud />
            {/* § D-061: erscheint beim Aussteigen, nicht auf Knopfdruck. */}
            <MissionReview />
            {/* § 12.2: Gründung — erscheint nur, solange kein Rathaus steht. */}
            <FoundingHud />
            {placingDefId !== undefined
              && getController().config.buildings.get(placingDefId)?.category === 'roads'
              && <SmartRoadPlannerHud />}
          </>
        )}
      </main>
      <Toasts />
      {currentEvent && <EventModal event={currentEvent} onClose={() => dismissEvent(currentEvent.id)} />}
    </div>
  );
}
