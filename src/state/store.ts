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

type PanelId = 'build' | 'mayor' | 'happiness' | 'settings' | 'quests' | undefined;

interface UiState {
  openPanel: PanelId;
  placingDefId: string | undefined;
  /** Building currently being relocated (hold-drag or "Verschieben" button). */
  movingBuildingId: string | undefined;
  selectedBuildingId: string | undefined;
  sectorDialog: SectorId | undefined;
  toasts: Toast[];
  setPanel(panel: PanelId): void;
  startPlacing(defId: string): void;
  stopPlacing(): void;
  startMoving(id: string): void;
  stopMoving(): void;
  selectBuilding(id?: string): void;
  openSectorDialog(id?: SectorId): void;
  pushToast(text: string, kind?: Toast['kind']): void;
  removeToast(id: number): void;
}

let toastId = 0;

export const useUiStore = create<UiState>((set) => ({
  openPanel: 'quests',
  placingDefId: undefined,
  movingBuildingId: undefined,
  selectedBuildingId: undefined,
  sectorDialog: undefined,
  toasts: [],
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
}));
