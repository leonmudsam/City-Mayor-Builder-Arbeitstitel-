import { create } from 'zustand';
import { useSyncExternalStore } from 'react';
import type { GameController } from '../game/commands/controller.ts';
import type { SectorId } from '../game/types.ts';

// The React side never mutates game state directly: it reads snapshots off
// the controller (re-rendering via the version counter) and sends commands.

let gameController: GameController | undefined;

export function setController(controller: GameController): void {
  gameController = controller;
}

export function getController(): GameController {
  if (!gameController) throw new Error('GameController not initialized');
  return gameController;
}

/** Re-renders the component whenever the simulation state changes. */
export function useGame(): GameController {
  const controller = getController();
  useSyncExternalStore(
    (onChange) => controller.subscribe(onChange),
    () => controller.version,
  );
  return controller;
}

// ---- Pure UI state (panels, placement mode, toasts) ------------------------

export interface Toast {
  id: number;
  text: string;
  kind: 'info' | 'error' | 'success';
}

/** A staged, acknowledge-me moment shown in an EventModal (§9). */
export interface GameEvent {
  id: number;
  kind: 'levelUp' | 'sectorUnlocked' | 'fire' | 'celebrate' | 'activityDone';
  titleKey: string;
  bodyKey: string;
  params?: Record<string, string | number>;
}

type PanelId =
  | 'build'
  | 'mayor'
  | 'happiness'
  | 'status'
  | 'economy'
  | 'settings'
  | 'quests'
  | 'trade'
  | 'debug'
  | 'activities'
  | undefined;

interface UiState {
  openPanel: PanelId;
  placingDefId: string | undefined;
  /** Building currently being relocated (hold-drag or "Verschieben" button). */
  movingBuildingId: string | undefined;
  selectedBuildingId: string | undefined;
  sectorDialog: SectorId | undefined;
  toasts: Toast[];
  events: GameEvent[];
  setPanel(panel: PanelId): void;
  startPlacing(defId: string): void;
  stopPlacing(): void;
  startMoving(id: string): void;
  stopMoving(): void;
  selectBuilding(id?: string): void;
  openSectorDialog(id?: SectorId): void;
  pushToast(text: string, kind?: Toast['kind']): void;
  removeToast(id: number): void;
  pushEvent(event: Omit<GameEvent, 'id'>): void;
  dismissEvent(id: number): void;
}

let toastId = 0;
let eventId = 0;

export const useUiStore = create<UiState>((set) => ({
  openPanel: 'quests',
  placingDefId: undefined,
  movingBuildingId: undefined,
  selectedBuildingId: undefined,
  sectorDialog: undefined,
  toasts: [],
  events: [],
  setPanel: (panel) => set((s) => ({ openPanel: s.openPanel === panel ? undefined : panel })),
  startPlacing: (defId) =>
    set({ placingDefId: defId, movingBuildingId: undefined, selectedBuildingId: undefined, sectorDialog: undefined, openPanel: undefined }),
  stopPlacing: () => set({ placingDefId: undefined }),
  startMoving: (id) =>
    set({ movingBuildingId: id, placingDefId: undefined, selectedBuildingId: undefined, sectorDialog: undefined, openPanel: undefined }),
  stopMoving: () => set({ movingBuildingId: undefined }),
  selectBuilding: (id) =>
    set(id ? { selectedBuildingId: id, placingDefId: undefined, sectorDialog: undefined } : { selectedBuildingId: undefined }),
  openSectorDialog: (id) =>
    set(id ? { sectorDialog: id, selectedBuildingId: undefined, placingDefId: undefined } : { sectorDialog: undefined }),
  pushToast: (text, kind = 'info') =>
    set((s) => {
      toastId += 1;
      const toast: Toast = { id: toastId, text, kind };
      return { toasts: [...s.toasts.slice(-3), toast] };
    }),
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((toast) => toast.id !== id) })),
  pushEvent: (event) =>
    set((s) => {
      eventId += 1;
      // Cap the backlog so a burst of events can never stack indefinitely.
      return { events: [...s.events.slice(-4), { ...event, id: eventId }] };
    }),
  dismissEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
}));
