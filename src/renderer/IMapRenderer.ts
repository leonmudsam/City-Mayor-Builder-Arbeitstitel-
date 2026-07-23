// The contract MapView drives, satisfied by the 3D three.js `ThreeMapRenderer`.
// Seit § Welt 2.0 / Gebäudesystem 2.0 ist 3D der EINZIGE Renderweg — der alte
// 2D-/Iso-Pixi-Renderer wurde entfernt (Nutzer-Entscheidung, keine parallelen
// Renderwege). Der Renderer liest Controller-Snapshots und meldet Interaktionen
// über `RendererCallbacks` zurück.

import type { PlacementError } from '../game/buildings/placement.ts';
import type { BuildingRotation, WaterfrontPlacementPreview } from '../game/buildings/placement.ts';
import type { RegionId } from '../game/types.ts';
import type { CameraPreset } from './three/CameraConfig.ts';

/** What the cursor currently hovers in placement/move mode (drives the banner). */
export interface HoverInfo {
  defId: string;
  error: PlacementError | undefined;
  bonusPct: number;
  rotation?: BuildingRotation;
  waterfront?: WaterfrontPlacementPreview;
}

/** Renderer-owned camera state exposed as plain numbers for lightweight HUDs. */
export interface MapCameraView {
  targetX: number;
  targetZ: number;
  dist: number;
  yaw: number;
  pitch: number;
}

/** Presentation-only filter for the world-space building marker layer. */
export type InfoLayerMode = 'off' | 'problems' | 'needs' | 'upgrades' | 'production' | 'all';
export type InfrastructureLayerMode = 'off' | 'all' | 'roads' | 'waterways' | 'harbors' | 'trade' | 'supply' | 'problems';

/**
 * Explizite Trennung von Sichtprüfung und Progression. Nur der Controller darf
 * `unlockAllRegionsGameplay` verändern; der Renderer liest den Wert lediglich,
 * damit Debugzustände eindeutig diagnostizierbar bleiben.
 */
export interface WorldRevealState {
  fogDisabled: boolean;
  revealLockedRegionsVisually: boolean;
  unlockAllRegionsGameplay: boolean;
}

export interface RendererCallbacks {
  onSelectBuilding(id: string | undefined): void;
  /** Klick auf eine gesperrte Landschaft → Erschließen-Dialog (§ Welt 2.0). */
  onClickLockedRegion(id: RegionId): void;
  /** `rotation` is the cosmetic facing (degrees) chosen before placing. */
  onPlace(defId: string, x: number, y: number, rotation?: 0 | 90 | 180 | 270): void;
  /** Drag-painting a road across tiles — placement failures stay silent (§7). */
  onDragPlace(defId: string, x: number, y: number): void;
  onCancelPlacement(): void;
  /** Hold gesture picked up a building — UI enters move mode. */
  onRequestMove(id: string): void;
  /** Move-mode drop. */
  onMove(id: string, x: number, y: number): void;
  /** Ghost validation changed — UI shows/hides the placement banner. */
  onHoverInfo(info: HoverInfo | undefined): void;
  /** Eine Landschaft wurde gerade erschlossen (zentrales "Neues Gebiet"-Popup). */
  onRegionUnlocked(id: RegionId): void;
  /** § A6 Fahrmodus: Ein-/Ausstieg ins gesteuerte Fahrzeug (UI zeigt Fahr-HUD). */
  onDriveChange?(active: boolean): void;
  /** § A6 Fahrmodus: erreichtes Missionsziel — die UI ruft progressActivity auf. */
  onDriveProgress?(buildingId: string): void;
  /** Coverage overlay is active (or cleared) — UI shows/hides the legend (§1). */
  onCoverageInfo(
    info:
      | {
          label: string;
          underCapacity: boolean;
          counts: { supplied: number; partial: number; unsupplied: number };
          capacity?: { servable: number; used: number };
        }
      | undefined,
  ): void;
}

export interface IMapRenderer {
  init(host: HTMLElement): Promise<void>;
  destroy(): void;
  setPlacing(defId: string | undefined): void;
  /** Cosmetic facing for the ghost/placed building (§ Gebäude-Rotation). */
  setPlacingRotation(rotation: 0 | 90 | 180 | 270): void;
  setMoving(id: string | undefined): void;
  setSelected(id: string | undefined): void;
  /** Changes only which renderer-owned marker billboards are visible. */
  setInfoLayer(mode: InfoLayerMode): void;
  setInfrastructureLayer(mode: InfrastructureLayerMode): void;
  /** Dev-Präsentation und echte Progression bleiben strikt getrennt. */
  setWorldReveal(state: WorldRevealState): void;
  centerOnCity(): void;
  applyPreset(preset: CameraPreset): void;
  focusSelected(): void;
  resetNorth(): void;
  zoomStep(dir: number): void;
  getYaw(): number;
  getCameraView(): MapCameraView;
  /** Focus a world position selected through a HUD surface such as the minimap. */
  focusGround(x: number, z: number, dist?: number): void;
  /** § A6: Läuft eine selbst-fahrbare Fahrmission (Button zeigen)? */
  canDrive(): boolean;
  /** § A6: Ist der Fahrmodus gerade aktiv? */
  isDriving(): boolean;
  /** § A6: In das gesteuerte Fahrzeug einsteigen (false, wenn nicht möglich). */
  enterDrive(): boolean;
  /** § A6: Fahrmodus verlassen. */
  exitDrive(): void;
  /** Automatisches Missionsfahrzeug mit der 3D-Kamera verfolgen. */
  setMissionFollow(active: boolean): void;
  isMissionFollowing(): boolean;
}

export type { CameraPreset };
