// The contract MapView drives, satisfied by the 3D three.js `ThreeMapRenderer`.
// Seit § Welt 2.0 / Gebäudesystem 2.0 ist 3D der EINZIGE Renderweg — der alte
// 2D-/Iso-Pixi-Renderer wurde entfernt (Nutzer-Entscheidung, keine parallelen
// Renderwege). Der Renderer liest Controller-Snapshots und meldet Interaktionen
// über `RendererCallbacks` zurück.

import type { BuildingRotation, WaterfrontPlacementPreview } from '../game/buildings/placement.ts';
import type { FoundationPlan } from '../game/buildings/foundation.ts';
import type { MoveBlocker } from '../game/commands/controller.ts';
import type { RegionId, ResourceId } from '../game/types.ts';
import type { CameraPreset } from './three/CameraConfig.ts';

/** What the cursor currently hovers in placement/move mode (drives the banner). */
export interface HoverInfo {
  defId: string;
  /** `MoveBlocker` ist die Obermenge von `PlacementError` — beim Versetzen können
   *  zusätzlich Versetzbarkeit und Budget scheitern (§ G2 ④). */
  error: MoveBlocker | undefined;
  bonusPct: number;
  x: number;
  y: number;
  /** Grenzt die Grundfläche ans verbundene Straßennetz? (§ G2 ③) */
  roadAccess: boolean;
  /**
   * Baubar, aber ohne Wirkung: Das Gebäude braucht eine Straße und hat hier
   * keine. Die Platzierung scheitert daran **nicht** — deshalb ist dieser
   * Hinweis die einzige Warnung, die der Spieler vor dem Klick bekommt.
   */
  roadWarning: boolean;
  foundation: FoundationPlan;
  rotation?: BuildingRotation;
  waterfront?: WaterfrontPlacementPreview;
  /**
   * Nur im Verschiebemodus gesetzt (§ G2 ④). Das Gebäude bleibt bis zum
   * Bestätigungsklick an seinem Platz — die Vorschau nennt deshalb die Gebühr,
   * die dieser eine Klick abbucht, und ob das Ziel überhaupt ein Umzug ist.
   */
  move?: {
    buildingId: string;
    origin: { x: number; y: number };
    relocationCost?: Partial<Record<ResourceId, number>>;
    unchanged: boolean;
  };
}

/** Rein visuelle Arbeitsgebiets-Projektion. Keine dieser Angaben wird vom
 * Renderer persistiert oder in Simulationszustand zurückgeschrieben. */
export interface WorkAreaOverlayNode {
  id: string;
  x: number;
  y: number;
  state: 'available' | 'selected' | 'reserved' | 'excluded' | 'invalid';
}

export interface WorkAreaOverlay {
  center: { x: number; y: number };
  radius: number;
  efficientRadius: number;
  maximumRadius: number;
  nodes: WorkAreaOverlayNode[];
}

export interface RoadPlanOverlayTile {
  x: number;
  y: number;
  status: 'start' | 'end' | 'ok' | 'bridge' | 'elevated' | 'exists' | 'blocked';
  variant: import('../game/types.ts').RoadVariant;
  terrainHeight: number;
  roadHeight: number;
  gradePercent: number;
  clearance: number;
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
  /** § Change 9.0 / S3: Dev-Cheat „Kamera-Grenzen aus". Bewusst getrennt von
   *  `fogDisabled`/`revealLockedRegionsVisually` (§7.3) — erlaubt freies Fliegen
   *  über gesperrte Regionen, ohne den Nebel zu deaktivieren. Nicht persistiert. */
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
  /** Arbeitsgebietsmodus: Kartenklick/-hover auf einen echten Ressourcenknoten. */
  onWorkAreaNodeClick?(id: string): void;
  onWorkAreaNodeHover?(id: string | undefined, clientX?: number, clientY?: number): void;
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
  /** Terrainfolgende, rein visuelle Planungs-Layer. */
  setWorkAreaOverlay(overlay: WorkAreaOverlay | undefined): void;
  setRoadPlanOverlay(tiles: RoadPlanOverlayTile[]): void;
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
