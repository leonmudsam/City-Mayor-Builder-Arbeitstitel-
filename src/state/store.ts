import { create } from 'zustand';
import { useSyncExternalStore } from 'react';
import type { GameController } from '../game/commands/controller.ts';
import type { SectorId } from '../game/types.ts';
import type { RenderMode } from '../renderer/projection.ts';
import type { CameraPreset } from '../renderer/three/CameraConfig.ts';

// v0.30: 3D is the only player-facing map. The 2D/iso engines survive only as a
// developer fallback behind a debug key — there is no user-visible mode switch.
// The setting is presentation-only (localStorage, never the savegame).
const DEBUG_RENDER_KEY = 'cmb.debugRenderMode';
function loadRenderMode(): RenderMode {
  try {
    const v = localStorage.getItem(DEBUG_RENDER_KEY);
    if (v === 'flat2d' || v === 'isometric2d') return v; // dev fallback only
  } catch {
    /* ignore storage failures */
  }
  return 'true3d';
}

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

// ---- Map API bridge --------------------------------------------------------
// The renderer owns the camera; the HUD (Quick-action "Karte") needs to recall
// it without importing the renderer. MapView registers a small imperative API
// here, mirroring the controller bridge above — no renderer internals leak.

export interface MapApi {
  centerOnCity(): void;
  /** Apply a 3D camera preset (Stadt/Bau/Übersicht/Zentrum). No-op in 2D debug. */
  applyPreset(preset: CameraPreset): void;
  focusSelected(): void;
  resetNorth(): void;
  zoomStep(dir: number): void;
  /** Current camera yaw in radians (for the compass). */
  getYaw(): number;
}

let mapApi: MapApi | undefined;
export function setMapApi(api: MapApi | undefined): void {
  mapApi = api;
}
export function getMapApi(): MapApi | undefined {
  return mapApi;
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

export type PanelId =
  | 'build'
  | 'mayor'
  | 'happiness'
  | 'status'
  | 'economy'
  | 'settings'
  | 'trade'
  | 'debug'
  | 'activities'
  | 'menu'
  | undefined;

/** A concrete panel destination (never `undefined`) — for menu/nav lists. */
export type PanelTarget = NonNullable<PanelId>;

interface UiState {
  openPanel: PanelId;
  /** SimCity-style service overlay toggle (§7/§10): dims the map & emphasises
   *  supply status. The renderer already paints a selected building's coverage;
   *  this flag drives the persistent city-wide overlay chrome. */
  overlayMode: boolean;
  toggleOverlay(): void;
  /** Hide-the-whole-UI toggle (§8): blanks the HUD frame so the map is clean;
   *  a small restore button stays visible to bring the chrome back. */
  uiHidden: boolean;
  toggleUiHidden(): void;
  /** Effective map render mode. Players always get 'true3d'; 'flat2d'/'isometric2d'
   *  are a developer fallback set from the debug panel (§ 3D-only). */
  renderMode: RenderMode;
  setRenderMode(mode: RenderMode): void;
  /** Player-facing 3D camera preset (replaces the old mode switch). */
  cameraPreset: CameraPreset;
  setCameraPreset(preset: CameraPreset): void;
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
  openPanel: undefined,
  overlayMode: false,
  toggleOverlay: () => set((s) => ({ overlayMode: !s.overlayMode })),
  uiHidden: false,
  toggleUiHidden: () => set((s) => ({ uiHidden: !s.uiHidden })),
  renderMode: loadRenderMode(),
  setRenderMode: (mode) =>
    set(() => {
      try {
        // Only 2D/iso are persisted (dev fallback); 3D clears the override.
        if (mode === 'true3d') localStorage.removeItem(DEBUG_RENDER_KEY);
        else localStorage.setItem(DEBUG_RENDER_KEY, mode);
      } catch {
        /* ignore storage failures */
      }
      return { renderMode: mode };
    }),
  cameraPreset: 'city',
  setCameraPreset: (preset) => {
    getMapApi()?.applyPreset(preset);
    set({ cameraPreset: preset });
  },
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
