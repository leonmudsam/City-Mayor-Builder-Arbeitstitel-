import { create } from 'zustand';
import { useSyncExternalStore } from 'react';
import type { GameController } from '../game/commands/controller.ts';
import type { RegionId, ResourceId } from '../game/types.ts';
import type { CameraPreset } from '../renderer/three/CameraConfig.ts';
import type {
  InfoLayerMode,
  InfrastructureLayerMode,
  MapCameraView,
  RoadPlanOverlayTile,
  WorkAreaOverlay,
  WorldRevealState,
} from '../renderer/IMapRenderer.ts';
import type { WorkAreaSelectionMode } from '../components/operations/viewModels.ts';

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
  /** Lightweight live view for the minimap camera frame. */
  getCameraView(): MapCameraView;
  /** Focus a position chosen on the minimap. */
  focusGround(x: number, z: number, dist?: number): void;
  /** Renderer-only building information filter. */
  setInfoLayer(mode: InfoLayerMode): void;
  setInfrastructureLayer(mode: InfrastructureLayerMode): void;
  setWorkAreaOverlay(overlay: WorkAreaOverlay | undefined): void;
  setRoadPlanOverlay(tiles: RoadPlanOverlayTile[]): void;
  /** Dev-only renderer state; progression is still controller-owned. */
  setWorldReveal(state: WorldRevealState): void;
  /** § A6: Läuft eine selbst-fahrbare Fahrmission (Button zeigen)? */
  canDrive(): boolean;
  /** § A6: In das Missionsfahrzeug einsteigen (false, wenn nicht möglich). */
  enterDrive(): boolean;
  /** § A6: Fahrmodus verlassen. */
  exitDrive(): void;
  /** Automatisches Missionsfahrzeug verfolgen oder Kamera wieder freigeben. */
  setMissionFollow(active: boolean): void;
  isMissionFollowing(): boolean;
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
  kind: 'levelUp' | 'regionUnlocked' | 'fire' | 'celebrate' | 'activityDone';
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
  | 'weather'
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
  /** World-space marker filter; presentation state, never persisted in the save. */
  infoLayerMode: InfoLayerMode;
  setInfoLayerMode(mode: InfoLayerMode): void;
  infrastructureLayerMode: InfrastructureLayerMode;
  setInfrastructureLayerMode(mode: InfrastructureLayerMode): void;
  /** Dev-only visibility audit, deliberately not persisted. */
  fogDisabled: boolean;
  revealLockedRegionsVisually: boolean;
  toggleRegionFog(): void;
  /** § Change 9.0 / S3: Dev-Cheat „Kamera-Grenzen aus" — getrennt vom Nebel
   *  (§7.3). Erlaubt freies Fliegen über gesperrte Regionen. Nicht persistiert. */
  /** Hide-the-whole-UI toggle (§8): blanks the HUD frame so the map is clean;
   *  a small restore button stays visible to bring the chrome back. */
  uiHidden: boolean;
  toggleUiHidden(): void;
  /** Player-facing 3D camera preset (replaces the old mode switch). */
  cameraPreset: CameraPreset;
  setCameraPreset(preset: CameraPreset): void;
  /** § A6 Fahrmodus aktiv: der Renderer meldet Ein-/Ausstieg, die UI zeigt das
   *  Fahr-HUD (Timer, verbleibende Ziele, „Fahrt beenden") statt der Panels. */
  driveActive: boolean;
  setDriveActive(active: boolean): void;
  missionFollow: boolean;
  setMissionFollow(active: boolean): void;
  /** UI-only draft route. Targets are committed only through startActivity(). */
  activityPlannerDefId: string | undefined;
  openActivityPlanner(defId: string): void;
  closeActivityPlanner(): void;
  /** Rein visueller Arbeitsgebiets-Entwurf. Persistiert erst über den
   *  bestehenden startBuildingOperationWithNodes-Command. */
  workAreaPlannerBuildingId: string | undefined;
  workAreaSelectionMode: WorkAreaSelectionMode;
  workAreaRadius: number;
  workAreaSelectedNodeIds: string[];
  workAreaHoverNodeId: string | undefined;
  openWorkAreaPlanner(buildingId: string, radius: number, selectedNodeIds: string[]): void;
  closeWorkAreaPlanner(): void;
  setWorkAreaSelectionMode(mode: WorkAreaSelectionMode): void;
  setWorkAreaRadius(radius: number): void;
  setWorkAreaSelectedNodeIds(nodeIds: string[]): void;
  toggleWorkAreaNode(nodeId: string, selected?: boolean): void;
  setWorkAreaHoverNode(nodeId?: string): void;
  /** Große, aber rein lesende Ressourcen-Netzwerksicht. */
  resourceNetworkResource: ResourceId | undefined;
  openResourceNetwork(resource: ResourceId): void;
  closeResourceNetwork(): void;
  /** Infrastruktur-Netzübersicht (§I5): Straßen/Brücken/Anleger/Schiffe. */
  infrastructureNetworkOpen: boolean;
  openInfrastructureNetwork(): void;
  closeInfrastructureNetwork(): void;
  /** UI-only Straßenentwurf. Kosten/Validierung kommen aus roadPathPreview;
   *  gebaut wird erst nach Bestätigung über placeBuilding. */
  roadPlanPath: { x: number; y: number }[];
  setRoadPlanPath(path: { x: number; y: number }[]): void;
  clearRoadPlan(): void;
  placingDefId: string | undefined;
  /** Cosmetic facing (degrees) chosen for the building about to be placed
   *  (§ Gebäude-Rotation). Resets to 0 whenever placement starts/stops. */
  placingRotation: 0 | 90 | 180 | 270;
  rotatePlacing(): void;
  /** Building currently being relocated (hold-drag or "Verschieben" button). */
  movingBuildingId: string | undefined;
  selectedBuildingId: string | undefined;
  regionDialog: RegionId | undefined;
  toasts: Toast[];
  events: GameEvent[];
  setPanel(panel: PanelId): void;
  startPlacing(defId: string): void;
  stopPlacing(): void;
  startMoving(id: string): void;
  stopMoving(): void;
  selectBuilding(id?: string): void;
  openRegionDialog(id?: RegionId): void;
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
  infoLayerMode: 'problems',
  setInfoLayerMode: (mode) => {
    getMapApi()?.setInfoLayer(mode);
    set({ infoLayerMode: mode });
  },
  infrastructureLayerMode: 'off',
  setInfrastructureLayerMode: (mode) => {
    getMapApi()?.setInfrastructureLayer(mode);
    set({ infrastructureLayerMode: mode, ...(mode === 'problems' ? { infoLayerMode: 'problems' as const } : {}) });
  },
  fogDisabled: false,
  revealLockedRegionsVisually: false,
  toggleRegionFog: () =>
    set((state) => {
      const fogDisabled = !state.fogDisabled;
      const revealLockedRegionsVisually = fogDisabled;
      getMapApi()?.setWorldReveal({
        fogDisabled,
        revealLockedRegionsVisually,
        unlockAllRegionsGameplay: false,
      });
      return { fogDisabled, revealLockedRegionsVisually };
    }),
  uiHidden: false,
  toggleUiHidden: () => set((s) => ({ uiHidden: !s.uiHidden })),
  cameraPreset: 'city',
  setCameraPreset: (preset) => {
    getMapApi()?.applyPreset(preset);
    set({ cameraPreset: preset });
  },
  driveActive: false,
  setDriveActive: (active) => set({ driveActive: active }),
  missionFollow: false,
  setMissionFollow: (active) => {
    getMapApi()?.setMissionFollow(active);
    set({ missionFollow: active });
  },
  activityPlannerDefId: undefined,
  openActivityPlanner: (defId) =>
    set({
      activityPlannerDefId: defId,
      workAreaPlannerBuildingId: undefined,
      resourceNetworkResource: undefined,
      infrastructureNetworkOpen: false,
      roadPlanPath: [],
      openPanel: undefined,
      selectedBuildingId: undefined,
      regionDialog: undefined,
      placingDefId: undefined,
    }),
  closeActivityPlanner: () => set({ activityPlannerDefId: undefined }),
  workAreaPlannerBuildingId: undefined,
  workAreaSelectionMode: 'circle',
  workAreaRadius: 1,
  workAreaSelectedNodeIds: [],
  workAreaHoverNodeId: undefined,
  openWorkAreaPlanner: (buildingId, radius, selectedNodeIds) =>
    set({
      workAreaPlannerBuildingId: buildingId,
      workAreaSelectionMode: 'circle',
      workAreaRadius: radius,
      workAreaSelectedNodeIds: [...new Set(selectedNodeIds)],
      workAreaHoverNodeId: undefined,
      resourceNetworkResource: undefined,
      infrastructureNetworkOpen: false,
      activityPlannerDefId: undefined,
      openPanel: undefined,
      selectedBuildingId: undefined,
      regionDialog: undefined,
      placingDefId: undefined,
      movingBuildingId: undefined,
      roadPlanPath: [],
    }),
  closeWorkAreaPlanner: () =>
    set({
      workAreaPlannerBuildingId: undefined,
      workAreaSelectedNodeIds: [],
      workAreaHoverNodeId: undefined,
    }),
  setWorkAreaSelectionMode: (mode) => set({ workAreaSelectionMode: mode }),
  setWorkAreaRadius: (radius) => set({ workAreaRadius: Math.max(1, Math.round(radius)) }),
  setWorkAreaSelectedNodeIds: (nodeIds) => set({ workAreaSelectedNodeIds: [...new Set(nodeIds)] }),
  toggleWorkAreaNode: (nodeId, selected) =>
    set((state) => {
      const next = new Set(state.workAreaSelectedNodeIds);
      const shouldSelect = selected ?? !next.has(nodeId);
      if (shouldSelect) next.add(nodeId);
      else next.delete(nodeId);
      return { workAreaSelectedNodeIds: [...next] };
    }),
  setWorkAreaHoverNode: (nodeId) => set({ workAreaHoverNodeId: nodeId }),
  resourceNetworkResource: undefined,
  openResourceNetwork: (resource) =>
    set({
      resourceNetworkResource: resource,
      workAreaPlannerBuildingId: undefined,
      activityPlannerDefId: undefined,
      openPanel: undefined,
      selectedBuildingId: undefined,
      regionDialog: undefined,
      placingDefId: undefined,
      movingBuildingId: undefined,
      roadPlanPath: [],
    }),
  closeResourceNetwork: () => set({ resourceNetworkResource: undefined }),
  infrastructureNetworkOpen: false,
  openInfrastructureNetwork: () =>
    set({
      infrastructureNetworkOpen: true,
      resourceNetworkResource: undefined,
      workAreaPlannerBuildingId: undefined,
      activityPlannerDefId: undefined,
      openPanel: undefined,
      selectedBuildingId: undefined,
      regionDialog: undefined,
      placingDefId: undefined,
      movingBuildingId: undefined,
      roadPlanPath: [],
    }),
  closeInfrastructureNetwork: () => set({ infrastructureNetworkOpen: false }),
  roadPlanPath: [],
  setRoadPlanPath: (path) => set({ roadPlanPath: path.map((point) => ({ x: Math.round(point.x), y: Math.round(point.y) })) }),
  clearRoadPlan: () => set({ roadPlanPath: [] }),
  placingDefId: undefined,
  placingRotation: 0,
  rotatePlacing: () => set((s) => ({ placingRotation: (((s.placingRotation + 90) % 360) as 0 | 90 | 180 | 270) })),
  movingBuildingId: undefined,
  selectedBuildingId: undefined,
  regionDialog: undefined,
  toasts: [],
  events: [],
  setPanel: (panel) =>
    set((s) => {
      const openPanel = s.openPanel === panel ? undefined : panel;
      return openPanel
        ? {
            openPanel,
            selectedBuildingId: undefined,
            regionDialog: undefined,
            activityPlannerDefId: undefined,
            workAreaPlannerBuildingId: undefined,
            resourceNetworkResource: undefined,
            infrastructureNetworkOpen: false,
            roadPlanPath: [],
          }
        : { openPanel: undefined };
    }),
  startPlacing: (defId) =>
    set({
      placingDefId: defId,
      placingRotation: 0,
      movingBuildingId: undefined,
      selectedBuildingId: undefined,
      regionDialog: undefined,
      openPanel: undefined,
      activityPlannerDefId: undefined,
      workAreaPlannerBuildingId: undefined,
      resourceNetworkResource: undefined,
      infrastructureNetworkOpen: false,
      roadPlanPath: [],
    }),
  stopPlacing: () => set({ placingDefId: undefined, placingRotation: 0, roadPlanPath: [] }),
  startMoving: (id) =>
    set({
      movingBuildingId: id,
      placingDefId: undefined,
      selectedBuildingId: undefined,
      regionDialog: undefined,
      openPanel: undefined,
      activityPlannerDefId: undefined,
      workAreaPlannerBuildingId: undefined,
      resourceNetworkResource: undefined,
      infrastructureNetworkOpen: false,
      roadPlanPath: [],
    }),
  stopMoving: () => set({ movingBuildingId: undefined }),
  selectBuilding: (id) =>
    set(
      id
        ? {
            selectedBuildingId: id,
            placingDefId: undefined,
            regionDialog: undefined,
            openPanel: undefined,
            activityPlannerDefId: undefined,
            workAreaPlannerBuildingId: undefined,
            resourceNetworkResource: undefined,
            infrastructureNetworkOpen: false,
            roadPlanPath: [],
          }
        : { selectedBuildingId: undefined },
    ),
  openRegionDialog: (id) =>
    set(
      id
        ? {
            regionDialog: id,
            selectedBuildingId: undefined,
            placingDefId: undefined,
            openPanel: undefined,
            activityPlannerDefId: undefined,
            workAreaPlannerBuildingId: undefined,
            resourceNetworkResource: undefined,
            infrastructureNetworkOpen: false,
            roadPlanPath: [],
          }
        : { regionDialog: undefined },
    ),
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
