import { Application, Container, Graphics, Text, type TextStyleOptions } from 'pixi.js';
import type { GameController } from '../game/commands/controller.ts';
import type { BuildingInstance, SectorState } from '../game/types.ts';
import type { BuildingDef } from '../game/config/types.ts';
import { SECTOR_SIZE } from '../game/map/world.ts';
import { validatePlacement, type PlacementError } from '../game/buildings/placement.ts';
import { locationBonusPct } from '../game/buildings/location.ts';
import { effectiveEffects } from '../game/buildings/effects.ts';
import { startRegionConfig } from '../game/config/startRegion.config.ts';
import { t } from '../i18n/index.ts';
import {
  CATEGORY_COLORS,
  COLOR_ASPHALT,
  COLOR_BONUS,
  COLOR_CONSTRUCTION,
  COLOR_FIRE,
  COLOR_GHOST_BAD,
  COLOR_GHOST_OK,
  COLOR_LANE,
  COLOR_LOCKED_OVERLAY,
  COLOR_SELECTION,
  COLOR_SIDEWALK,
  COVERAGE_COLORS,
  RADIUS_COLORS,
  TERRAIN_COLORS,
} from './colors.ts';

const TILE = 32;
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 3;
/** Press-and-hold this long on a building to pick it up for moving. */
const HOLD_TO_MOVE_MS = 280;

/** What the cursor currently hovers in placement/move mode (drives the banner). */
export interface HoverInfo {
  defId: string;
  error: PlacementError | undefined;
  bonusPct: number;
}

export interface RendererCallbacks {
  onSelectBuilding(id: string | undefined): void;
  onClickLockedSector(id: string): void;
  onPlace(defId: string, x: number, y: number): void;
  /** Drag-painting a road across tiles — placement failures stay silent (§7). */
  onDragPlace(defId: string, x: number, y: number): void;
  onCancelPlacement(): void;
  /** Hold gesture picked up a building — UI enters move mode. */
  onRequestMove(id: string): void;
  /** Move-mode drop. */
  onMove(id: string, x: number, y: number): void;
  /** Ghost validation changed — UI shows/hides the placement banner. */
  onHoverInfo(info: HoverInfo | undefined): void;
  /** A sector just went from locked → unlocked (central "new area" popup). */
  onSectorUnlocked(id: string): void;
  /** Coverage overlay is active (or cleared) — UI shows/hides the legend (§1). */
  onCoverageInfo(info: { label: string; underCapacity: boolean } | undefined): void;
}

/** Short-lived visual effect (demolish dust, sector-unlock flash). */
interface FxItem {
  gfx: Graphics;
  age: number;
  ttl: number;
  kind: 'puff' | 'flash';
}

/**
 * Renders the world with per-sector containers and viewport culling: only
 * sectors intersecting the camera view are visible — the prerequisite for the
 * open-end world (§8). All visuals are drawn programmatically in MVP 1;
 * swapping in sprite assets later only touches this layer.
 */
export class MapRenderer {
  private app = new Application();
  private world = new Container();
  private terrainLayer = new Container();
  private buildingLayer = new Container();
  private fxLayer = new Container();
  private overlayLayer = new Container();
  private coverageLayer = new Graphics();
  private ghost = new Graphics();
  private ghostRadius = new Graphics();
  private selectionBox = new Graphics();

  private fx: FxItem[] = [];
  /** Footprints from the previous redraw — used to detect demolitions. */
  private prevFootprints = new Map<string, { x: number; y: number; w: number; h: number }>();
  private sectorViews = new Map<string, { container: Container; status: string }>();
  private lastVersion = -1;
  private placingDefId: string | undefined;
  private movingId: string | undefined;
  private hoverTile: { x: number; y: number } | undefined;
  private selectedId: string | undefined;
  private lastHoverKey = '';
  private coverageKey = '';
  private hasCoverage = false;
  private destroyed = false;
  /** Target for the world container while easing the camera onto a building (§13). */
  private focusTarget: { x: number; y: number } | undefined;

  constructor(
    private controller: GameController,
    private callbacks: RendererCallbacks,
  ) {}

  async init(host: HTMLElement): Promise<void> {
    await this.app.init({ background: 0x10151c, resizeTo: host, antialias: true });
    if (this.destroyed) {
      this.app.destroy(true);
      return;
    }
    host.appendChild(this.app.canvas);
    this.world.addChild(this.terrainLayer, this.buildingLayer, this.fxLayer, this.overlayLayer);
    this.overlayLayer.addChild(this.coverageLayer, this.ghostRadius, this.selectionBox, this.ghost);
    this.app.stage.addChild(this.world);

    // Center the camera on the town hall.
    const th = startRegionConfig.townHall;
    this.world.scale.set(1);
    this.world.position.set(
      this.app.screen.width / 2 - (th.x + 1.5) * TILE,
      this.app.screen.height / 2 - (th.y + 1.5) * TILE,
    );

    this.bindInput();
    this.app.ticker.add(() => this.frame());
  }

  destroy(): void {
    this.destroyed = true;
    if (this.app.renderer) this.app.destroy(true);
  }

  setPlacing(defId: string | undefined): void {
    if (this.placingDefId === defId) return;
    this.placingDefId = defId;
    if (!defId) this.clearGhost();
  }

  setMoving(id: string | undefined): void {
    if (this.movingId === id) return;
    this.movingId = id;
    this.lastVersion = -1; // re-render so the picked-up building dims
    if (!id) this.clearGhost();
  }

  setSelected(id: string | undefined): void {
    this.selectedId = id;
    if (id) this.focusBuilding(id);
  }

  /** Ease the camera so the selected building sits centred on screen (§13). */
  private focusBuilding(id: string): void {
    const b = this.controller.state.buildings[id];
    const def = b && this.controller.config.buildings.get(b.defId);
    if (!b || !def) return;
    const scale = this.world.scale.x;
    const centerPx = { x: (b.x + def.size.w / 2) * TILE, y: (b.y + def.size.h / 2) * TILE };
    this.focusTarget = {
      x: this.app.screen.width / 2 - centerPx.x * scale,
      y: this.app.screen.height / 2 - centerPx.y * scale,
    };
  }

  private clearGhost(): void {
    this.ghost.clear();
    this.ghostRadius.clear();
    if (this.lastHoverKey !== '') {
      this.lastHoverKey = '';
      this.callbacks.onHoverInfo(undefined);
    }
  }

  // ---- Input ----------------------------------------------------------------

  private bindInput(): void {
    const canvas = this.app.canvas;
    let dragging = false;
    let moved = false;
    let last = { x: 0, y: 0 };
    let holdTimer: ReturnType<typeof setTimeout> | undefined;
    let paintedKey = '';

    const cancelHold = (): void => {
      if (holdTimer !== undefined) clearTimeout(holdTimer);
      holdTimer = undefined;
    };

    canvas.addEventListener('pointerdown', (e) => {
      dragging = true;
      moved = false;
      paintedKey = '';
      this.focusTarget = undefined; // any manual interaction cancels the camera ease
      last = { x: e.clientX, y: e.clientY };
      // Press-and-hold on a building picks it up for moving (only when the
      // move feature is enabled — off in MVP 1, §5).
      if (this.controller.config.features.moveBuildings && e.button === 0 && !this.placingDefId && !this.movingId) {
        const tile = this.screenToTile(e.offsetX, e.offsetY);
        const buildingId = this.buildingAt(tile.x, tile.y);
        if (buildingId) {
          holdTimer = setTimeout(() => {
            holdTimer = undefined;
            dragging = false;
            this.hoverTile = tile;
            this.callbacks.onRequestMove(buildingId);
          }, HOLD_TO_MOVE_MS);
        }
      }
    });
    canvas.addEventListener('pointermove', (e) => {
      const tile = this.screenToTile(e.offsetX, e.offsetY);
      this.hoverTile = tile;
      if (!dragging) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) {
        moved = true;
        cancelHold();
      }
      if (moved) {
        if (this.placingDefId && this.isPaintableRoad(this.placingDefId)) {
          // Drag to draw a run of road (§7): each newly entered tile is placed.
          const key = `${tile.x}:${tile.y}`;
          if (key !== paintedKey) {
            paintedKey = key;
            this.callbacks.onDragPlace(this.placingDefId, tile.x, tile.y);
          }
        } else if (!this.movingId) {
          // While carrying a building the pointer steers the ghost, not the camera.
          this.world.position.x += dx;
          this.world.position.y += dy;
        }
      }
      last = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener('pointerup', (e) => {
      dragging = false;
      cancelHold();
      if (e.button === 2) {
        this.callbacks.onCancelPlacement();
        return;
      }
      const tile = this.screenToTile(e.offsetX, e.offsetY);
      if (this.movingId) {
        const b = this.controller.state.buildings[this.movingId];
        const def = b && this.controller.config.buildings.get(b.defId);
        if (b && def) {
          const { x, y } = this.snapTopLeft(def, tile.x, tile.y);
          this.callbacks.onMove(this.movingId, x, y);
        }
        return;
      }
      if (moved) return;
      this.handleClick(tile.x, tile.y);
    });
    canvas.addEventListener('pointerleave', () => {
      dragging = false;
      cancelHold();
      this.hoverTile = undefined;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.focusTarget = undefined;
        const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
        const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, this.world.scale.x * factor));
        const worldX = (e.offsetX - this.world.position.x) / this.world.scale.x;
        const worldY = (e.offsetY - this.world.position.y) / this.world.scale.y;
        this.world.scale.set(newScale);
        this.world.position.set(e.offsetX - worldX * newScale, e.offsetY - worldY * newScale);
      },
      { passive: false },
    );
  }

  private screenToTile(sx: number, sy: number): { x: number; y: number } {
    return {
      x: Math.floor((sx - this.world.position.x) / this.world.scale.x / TILE),
      y: Math.floor((sy - this.world.position.y) / this.world.scale.y / TILE),
    };
  }

  /** Center the footprint under the cursor. */
  private snapTopLeft(def: BuildingDef, tileX: number, tileY: number): { x: number; y: number } {
    return { x: tileX - Math.floor(def.size.w / 2), y: tileY - Math.floor(def.size.h / 2) };
  }

  /** A 1×1 road is the only building you draw by dragging (§7). */
  private isPaintableRoad(defId: string): boolean {
    const def = this.controller.config.buildings.get(defId);
    return Boolean(def && def.category === 'roads' && def.size.w === 1 && def.size.h === 1);
  }

  private buildingAt(x: number, y: number): string | undefined {
    const sx = Math.floor(x / SECTOR_SIZE);
    const sy = Math.floor(y / SECTOR_SIZE);
    const sector = this.controller.state.world.sectors[`${sx}:${sy}`];
    if (!sector || sector.status !== 'unlocked') return undefined;
    return sector.tiles[(y - sy * SECTOR_SIZE) * SECTOR_SIZE + (x - sx * SECTOR_SIZE)]?.buildingId;
  }

  private handleClick(x: number, y: number): void {
    const state = this.controller.state;
    if (this.placingDefId) {
      const def = this.controller.config.buildings.get(this.placingDefId);
      if (def) {
        const pos = this.snapTopLeft(def, x, y);
        this.callbacks.onPlace(this.placingDefId, pos.x, pos.y);
      }
      return;
    }
    const sx = Math.floor(x / SECTOR_SIZE);
    const sy = Math.floor(y / SECTOR_SIZE);
    const sector = state.world.sectors[`${sx}:${sy}`];
    if (sector && sector.status === 'locked') {
      this.callbacks.onClickLockedSector(sector.id);
      return;
    }
    this.callbacks.onSelectBuilding(this.buildingAt(x, y));
  }

  // ---- Rendering --------------------------------------------------------------

  private frame(): void {
    this.animateFocus();
    this.cullSectors();
    if (this.controller.version !== this.lastVersion) {
      this.lastVersion = this.controller.version;
      this.syncSectors();
      this.redrawBuildings();
    }
    this.updateFx();
    this.drawGhost();
    this.drawCoverage();
    this.drawSelection();
  }

  /**
   * Generic coverage overlay (§1): when a supply building is selected, show
   * every source of that type, their combined reach, and each home tinted by
   * how well it's served (supplied / partial / redundant / unsupplied). Pure
   * overlay data comes from the game layer; this only paints it. Recomputed
   * only when the selection or world version changes (not per frame).
   */
  private drawCoverage(): void {
    const active = this.selectedId && !this.placingDefId && !this.movingId;
    const key = active ? `${this.selectedId}|${this.controller.version}` : '';
    if (key === this.coverageKey) return;
    this.coverageKey = key;
    this.coverageLayer.clear();

    const overlay = active ? this.controller.getCoverageOverlay(this.selectedId!) : undefined;
    this.hasCoverage = Boolean(overlay);
    if (!overlay) {
      this.callbacks.onCoverageInfo(undefined);
      return;
    }
    const groupColor = RADIUS_COLORS[overlay.colorKey] ?? COLOR_SELECTION;
    const g = this.coverageLayer;

    // Combined reach of every source (low alpha so overlaps stay readable).
    for (const s of overlay.sources) {
      const cx = (s.x + s.w / 2) * TILE;
      const cy = (s.y + s.h / 2) * TILE;
      const half = s.radius * TILE;
      g.roundRect(cx - half, cy - half, half * 2, half * 2, 10).fill({ color: groupColor, alpha: 0.06 });
    }
    for (const s of overlay.sources) {
      const cx = (s.x + s.w / 2) * TILE;
      const cy = (s.y + s.h / 2) * TILE;
      const half = s.radius * TILE;
      g.roundRect(cx - half, cy - half, half * 2, half * 2, 10).stroke({ width: s.selected ? 2.5 : 1.5, color: groupColor, alpha: s.selected ? 0.85 : 0.4 });
      // Source footprint marker.
      g.roundRect(s.x * TILE + 2, s.y * TILE + 2, s.w * TILE - 4, s.h * TILE - 4, 5)
        .stroke({ width: s.selected ? 3 : 2, color: COVERAGE_COLORS.source, alpha: s.selected ? 1 : 0.6 });
    }
    // Consumers: a clear status dot + border, no map-wide flood of color.
    for (const c of overlay.consumers) {
      const color = COVERAGE_COLORS[c.state];
      g.roundRect(c.x * TILE + 2, c.y * TILE + 2, c.w * TILE - 4, c.h * TILE - 4, 5).stroke({ width: 2, color, alpha: 0.9 });
      const dotX = (c.x + c.w / 2) * TILE;
      const dotY = (c.y + c.h / 2) * TILE;
      g.circle(dotX, dotY, 5).fill({ color, alpha: 0.95 }).stroke({ width: 1.5, color: 0x10151c, alpha: 0.6 });
    }
    this.callbacks.onCoverageInfo({ label: t(overlay.labelKey), underCapacity: overlay.underCapacity });
  }

  /** Smoothly move the world container toward the current focus target. */
  private animateFocus(): void {
    const target = this.focusTarget;
    if (!target) return;
    const dx = target.x - this.world.position.x;
    const dy = target.y - this.world.position.y;
    if (Math.abs(dx) + Math.abs(dy) < 0.6) {
      this.world.position.set(target.x, target.y);
      this.focusTarget = undefined;
      return;
    }
    this.world.position.set(this.world.position.x + dx * 0.18, this.world.position.y + dy * 0.18);
  }

  /** Advance and retire short-lived effects (demolish dust, unlock flash). */
  private updateFx(): void {
    if (this.fx.length === 0) return;
    const dt = this.app.ticker.deltaMS;
    for (const item of this.fx) {
      item.age += dt;
      const p = Math.min(1, item.age / item.ttl);
      if (item.kind === 'puff') {
        item.gfx.alpha = 1 - p;
        item.gfx.scale.set(1 + p * 0.9);
      } else {
        // flash: quick bright pop, then ease out.
        item.gfx.alpha = (1 - p) * 0.55;
      }
    }
    this.fx = this.fx.filter((item) => {
      if (item.age < item.ttl) return true;
      item.gfx.destroy();
      return false;
    });
  }

  private spawnPuff(x: number, y: number, w: number, h: number): void {
    const g = new Graphics();
    for (const [ox, oy, r] of [[-9, -3, 8], [9, -1, 7], [0, -11, 7], [-5, 7, 6], [7, 7, 6], [0, 2, 8]] as const) {
      g.circle(ox, oy, r).fill({ color: 0xd8d2c6, alpha: 0.92 });
    }
    g.position.set((x + w / 2) * TILE, (y + h / 2) * TILE);
    this.fxLayer.addChild(g);
    this.fx.push({ gfx: g, age: 0, ttl: 520, kind: 'puff' });
  }

  private spawnSectorFlash(sx: number, sy: number): void {
    const g = new Graphics();
    const size = SECTOR_SIZE * TILE;
    g.roundRect(2, 2, size - 4, size - 4, 10)
      .fill({ color: 0xffffff, alpha: 1 })
      .stroke({ width: 4, color: 0x8fe388, alpha: 1 });
    g.position.set(sx * size, sy * size);
    this.fxLayer.addChild(g);
    this.fx.push({ gfx: g, age: 0, ttl: 1400, kind: 'flash' });
  }

  /** Show only sectors intersecting the viewport (open-end performance, §8). */
  private cullSectors(): void {
    const view = this.app.screen;
    const scale = this.world.scale.x;
    const minX = (-this.world.position.x / scale / TILE / SECTOR_SIZE) - 1;
    const minY = (-this.world.position.y / scale / TILE / SECTOR_SIZE) - 1;
    const maxX = (view.width - this.world.position.x) / scale / TILE / SECTOR_SIZE;
    const maxY = (view.height - this.world.position.y) / scale / TILE / SECTOR_SIZE;
    for (const [id, entry] of this.sectorViews) {
      const [sx, sy] = id.split(':').map(Number) as [number, number];
      entry.container.visible = sx >= minX && sx <= maxX + 1 && sy >= minY && sy <= maxY + 1;
    }
  }

  private syncSectors(): void {
    for (const sector of Object.values(this.controller.state.world.sectors)) {
      const existing = this.sectorViews.get(sector.id);
      if (existing && existing.status === sector.status) continue;
      // Locked → unlocked: celebrate the expansion (flash + central popup, §7).
      if (existing && existing.status === 'locked' && sector.status === 'unlocked') {
        this.spawnSectorFlash(sector.sx, sector.sy);
        this.callbacks.onSectorUnlocked(sector.id);
      }
      if (existing) this.terrainLayer.removeChild(existing.container);
      const container = this.buildSectorView(sector);
      this.terrainLayer.addChild(container);
      this.sectorViews.set(sector.id, { container, status: sector.status });
    }
  }

  private buildSectorView(sector: SectorState): Container {
    const container = new Container();
    container.position.set(sector.sx * SECTOR_SIZE * TILE, sector.sy * SECTOR_SIZE * TILE);
    const g = new Graphics();
    for (let ly = 0; ly < SECTOR_SIZE; ly++) {
      for (let lx = 0; lx < SECTOR_SIZE; lx++) {
        const tile = sector.tiles[ly * SECTOR_SIZE + lx];
        if (!tile) continue;
        const color = TERRAIN_COLORS[tile.terrain];
        g.rect(lx * TILE, ly * TILE, TILE, TILE).fill(color);
        // Subtle tile grid + terrain detail.
        g.rect(lx * TILE, ly * TILE, TILE, 1).fill({ color: 0x000000, alpha: 0.05 });
        g.rect(lx * TILE, ly * TILE, 1, TILE).fill({ color: 0x000000, alpha: 0.05 });
        if (tile.terrain === 'forest') {
          g.circle(lx * TILE + TILE / 2, ly * TILE + TILE / 2, TILE / 5).fill({ color: 0x2e6b32, alpha: 0.8 });
        } else if (tile.terrain === 'mountain') {
          g.poly([
            lx * TILE + 6, ly * TILE + TILE - 8,
            lx * TILE + TILE / 2, ly * TILE + 8,
            lx * TILE + TILE - 6, ly * TILE + TILE - 8,
          ]).fill({ color: 0x6f6f78, alpha: 0.9 });
        } else if (tile.terrain === 'water' || tile.terrain === 'river') {
          g.rect(lx * TILE + 6, ly * TILE + TILE / 2 - 1, TILE - 12, 2).fill({ color: 0xffffff, alpha: 0.18 });
        }
      }
    }
    if (sector.status === 'locked') {
      g.rect(0, 0, SECTOR_SIZE * TILE, SECTOR_SIZE * TILE).fill({ color: COLOR_LOCKED_OVERLAY, alpha: 0.55 });
      g.rect(1, 1, SECTOR_SIZE * TILE - 2, SECTOR_SIZE * TILE - 2).stroke({ width: 2, color: 0xffffff, alpha: 0.25 });
      const label = new Text({ text: '+', style: lockStyle });
      label.anchor.set(0.5);
      label.position.set((SECTOR_SIZE * TILE) / 2, (SECTOR_SIZE * TILE) / 2);
      container.addChild(g, label);
      return container;
    }
    container.addChild(g);
    return container;
  }

  private redrawBuildings(): void {
    this.buildingLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    const state = this.controller.state;
    const now = state.meta.lastSimTime;

    // Detect demolitions (a footprint that existed last redraw is gone) and
    // puff a little dust where the building stood (§6).
    const current = new Map<string, { x: number; y: number; w: number; h: number }>();
    for (const b of Object.values(state.buildings)) {
      const def = this.controller.config.buildings.get(b.defId);
      if (def) current.set(b.id, { x: b.x, y: b.y, w: def.size.w, h: def.size.h });
    }
    for (const [id, fp] of this.prevFootprints) {
      if (!current.has(id)) this.spawnPuff(fp.x, fp.y, fp.w, fp.h);
    }
    this.prevFootprints = current;

    // Road connectivity lookup for auto-tiling (visual only). District-center
    // footprints count as connections so roads dock onto the town hall.
    const roadKeys = new Set<string>();
    const dockKeys = new Set<string>();
    for (const b of Object.values(state.buildings)) {
      const def = this.controller.config.buildings.get(b.defId);
      if (!def) continue;
      if (def.category === 'roads') roadKeys.add(`${b.x},${b.y}`);
    }
    for (const district of Object.values(state.world.districts)) {
      const center = state.buildings[district.centerBuildingId];
      const def = center && this.controller.config.buildings.get(center.defId);
      if (!center || !def) continue;
      for (let dy = 0; dy < def.size.h; dy++) {
        for (let dx = 0; dx < def.size.w; dx++) dockKeys.add(`${center.x + dx},${center.y + dy}`);
      }
    }

    for (const b of Object.values(state.buildings)) {
      const def = this.controller.config.buildings.get(b.defId);
      if (!def) continue;
      const container = new Container();
      container.position.set(b.x * TILE, b.y * TILE);
      const g = new Graphics();
      container.addChild(g);
      const w = def.size.w * TILE;
      const h = def.size.h * TILE;

      if (def.category === 'roads') {
        this.drawRoad(g, b, roadKeys, dockKeys);
      } else if (def.category === 'decoration') {
        g.circle(w / 2, h / 2, w / 2 - 4).fill(CATEGORY_COLORS[def.category]);
      } else {
        this.drawStructure(g, def, b, w, h);
        const label = new Text({ text: t(def.nameKey).slice(0, 2), style: labelStyle });
        label.anchor.set(0.5);
        label.position.set(w / 2, h / 2);
        container.addChild(label);
      }

      if (b.status === 'constructing' && b.constructionEndsAt !== undefined) {
        const total = (b.upgradeLevel > 0 ? def.upgrades?.[b.upgradeLevel - 1]?.constructionSec ?? def.constructionSec : def.constructionSec) * 1000;
        const progress = total > 0 ? Math.min(1, 1 - (b.constructionEndsAt - now) / total) : 1;
        g.rect(0, 0, w, h).fill({ color: 0x10151c, alpha: 0.45 });
        g.rect(4, h - 8, w - 8, 5).fill({ color: 0x000000, alpha: 0.5 });
        g.rect(4, h - 8, (w - 8) * progress, 5).fill(COLOR_CONSTRUCTION);
      }
      if (b.status === 'paused') {
        const flame = new Graphics();
        flame.circle(w / 2, 4, 7).fill(COLOR_FIRE);
        container.addChild(flame);
      }
      // Location bonus badge: this building produces more thanks to its spot.
      if ((this.controller.derived.productionBonus[b.id] ?? 0) > 0 && b.status === 'active') {
        const badge = new Graphics();
        badge.circle(w - 7, 7, 7).fill(COLOR_BONUS).stroke({ width: 1.5, color: 0x1d4a28 });
        badge.poly([w - 7, 3, w - 3.5, 9, w - 10.5, 9]).fill(0xffffff);
        container.addChild(badge);
      }
      if (b.id === this.movingId) container.alpha = 0.35;
      this.buildingLayer.addChild(container);
    }
  }

  /** Auto-tiled road: sidewalk frame, asphalt body, connection-aware markings. */
  private drawRoad(g: Graphics, b: BuildingInstance, roadKeys: Set<string>, dockKeys: Set<string>): void {
    const linksTo = (x: number, y: number): boolean => roadKeys.has(`${x},${y}`) || dockKeys.has(`${x},${y}`);
    const n = linksTo(b.x, b.y - 1);
    const e = linksTo(b.x + 1, b.y);
    const s = linksTo(b.x, b.y + 1);
    const w = linksTo(b.x - 1, b.y);
    const count = Number(n) + Number(e) + Number(s) + Number(w);
    const P = 7; // asphalt inset; the rim reads as sidewalk

    g.rect(0.5, 0.5, TILE - 1, TILE - 1).fill(COLOR_SIDEWALK);
    g.rect(P, P, TILE - 2 * P, TILE - 2 * P).fill(COLOR_ASPHALT);
    if (n) g.rect(P, 0, TILE - 2 * P, P).fill(COLOR_ASPHALT);
    if (s) g.rect(P, TILE - P, TILE - 2 * P, P).fill(COLOR_ASPHALT);
    if (w) g.rect(0, P, P, TILE - 2 * P).fill(COLOR_ASPHALT);
    if (e) g.rect(TILE - P, P, P, TILE - 2 * P).fill(COLOR_ASPHALT);

    if (count === 4) {
      // Roundabout: green island with a white ring.
      g.circle(TILE / 2, TILE / 2, 8).fill(COLOR_ASPHALT);
      g.circle(TILE / 2, TILE / 2, 5).fill(0x6fa25a).stroke({ width: 1.5, color: COLOR_LANE, alpha: 0.7 });
    } else if (count === 2 && n && s) {
      for (const y of [3, 13, 23]) g.rect(TILE / 2 - 1, y, 2, 6).fill({ color: COLOR_LANE, alpha: 0.75 });
    } else if (count === 2 && e && w) {
      for (const x of [3, 13, 23]) g.rect(x, TILE / 2 - 1, 6, 2).fill({ color: COLOR_LANE, alpha: 0.75 });
    } else if (count === 2) {
      // Corner: a quarter-circle lane hint between the two open directions.
      const cx = w ? 0 : TILE;
      const cy = n ? 0 : TILE;
      const start = cx === 0 ? (cy === 0 ? 0 : Math.PI * 1.5) : cy === 0 ? Math.PI * 0.5 : Math.PI;
      const r = TILE / 2;
      g.moveTo(cx + r * Math.cos(start), cy + r * Math.sin(start));
      g.arc(cx, cy, r, start, start + Math.PI * 0.5);
      g.stroke({ width: 2, color: COLOR_LANE, alpha: 0.45 });
    }
  }

  /** Non-road structure with visible upgrade level (roof band + level pips). */
  private drawStructure(g: Graphics, def: BuildingDef, b: BuildingInstance, w: number, h: number): void {
    const base = CATEGORY_COLORS[def.category];
    g.roundRect(2, 2, w - 4, h - 4, 6).fill(base);
    // Higher levels get a deeper roof band and a darker outline: upgraded
    // buildings must be recognizable at a glance.
    const roofH = Math.max(6, h / 4 + b.upgradeLevel * 3);
    g.roundRect(2, 2, w - 4, roofH, 6).fill({ color: 0xffffff, alpha: 0.18 + b.upgradeLevel * 0.08 });
    g.roundRect(2, 2, w - 4, h - 4, 6).stroke({ width: 1.5 + b.upgradeLevel * 0.75, color: 0x000000, alpha: 0.25 + b.upgradeLevel * 0.1 });
    for (let i = 0; i < b.upgradeLevel; i++) {
      g.roundRect(5 + i * 8, 5, 6, 6, 2).fill(0xffffff).stroke({ width: 1, color: 0x000000, alpha: 0.35 });
    }
  }

  private drawGhost(): void {
    const defId = this.movingId ? this.controller.state.buildings[this.movingId]?.defId : this.placingDefId;
    const def = defId ? this.controller.config.buildings.get(defId) : undefined;
    if (!def || !this.hoverTile) {
      if (this.placingDefId || this.movingId) return; // keep last ghost while pointer is off-canvas
      this.clearGhost();
      return;
    }
    const { x, y } = this.snapTopLeft(def, this.hoverTile.x, this.hoverTile.y);
    const error = validatePlacement(this.controller.state, this.controller.config, this.controller.derived, def, x, y, {
      ...(this.movingId ? { ignoreBuildingId: this.movingId } : {}),
    });
    const bonusPct = error ? 0 : locationBonusPct(this.controller.state, def, x, y);
    const color = error ? COLOR_GHOST_BAD : bonusPct > 0 ? COLOR_BONUS : COLOR_GHOST_OK;

    this.ghost.clear();
    this.ghost
      .roundRect(x * TILE + 1, y * TILE + 1, def.size.w * TILE - 2, def.size.h * TILE - 2, 4)
      .fill({ color, alpha: 0.35 })
      .stroke({ width: 2, color });

    this.ghostRadius.clear();
    if (!error) this.drawEffectRadii(this.ghostRadius, def, x, y);

    const key = `${def.id}|${error ?? ''}|${Math.round(bonusPct)}`;
    if (key !== this.lastHoverKey) {
      this.lastHoverKey = key;
      this.callbacks.onHoverInfo({ defId: def.id, error, bonusPct });
    }
  }

  /** Chebyshev radii render as squares around the footprint center. */
  private drawEffectRadii(g: Graphics, def: BuildingDef, x: number, y: number, upgradeLevel = 0): void {
    const cx = (x + def.size.w / 2) * TILE;
    const cy = (y + def.size.h / 2) * TILE;
    for (const eff of effectiveEffects(def, upgradeLevel)) {
      let radius: number | undefined;
      let colorKey: string | undefined;
      if (eff.type === 'capacity' && eff.radius !== undefined) {
        radius = eff.radius;
        colorKey = eff.need === 'water' ? 'water' : 'leisure';
      } else if (eff.type === 'coverage') {
        radius = eff.radius;
        colorKey = 'leisure';
      } else if (eff.type === 'protection') {
        radius = eff.radius;
        colorKey = 'protection';
      } else if (eff.type === 'ambience' && eff.amount > 0) {
        radius = eff.radius;
        colorKey = 'ambience';
      }
      if (radius === undefined || !colorKey) continue;
      const color = RADIUS_COLORS[colorKey] ?? COLOR_SELECTION;
      const half = radius * TILE;
      g.roundRect(cx - half, cy - half, half * 2, half * 2, 8)
        .fill({ color, alpha: 0.08 })
        .stroke({ width: 2, color, alpha: 0.55 });
    }
  }

  private drawSelection(): void {
    this.selectionBox.clear();
    if (!this.selectedId || this.movingId) return;
    const b = this.controller.state.buildings[this.selectedId];
    const def = b && this.controller.config.buildings.get(b.defId);
    if (!b || !def) return;
    this.selectionBox
      .roundRect(b.x * TILE - 2, b.y * TILE - 2, def.size.w * TILE + 4, def.size.h * TILE + 4, 6)
      .stroke({ width: 2.5, color: COLOR_SELECTION, alpha: 0.9 });
    // The coverage overlay already shows a supply building's reach in full; for
    // everything else, fall back to the simple radius outlines.
    if (!this.hasCoverage) this.drawEffectRadii(this.selectionBox, def, b.x, b.y, b.upgradeLevel);
  }
}

const labelStyle: TextStyleOptions = {
  fontFamily: 'system-ui, sans-serif',
  fontSize: 13,
  fontWeight: '700',
  fill: 0xffffff,
  stroke: { color: 0x000000, width: 3 },
};

const lockStyle: TextStyleOptions = {
  fontFamily: 'system-ui, sans-serif',
  fontSize: 40,
  fontWeight: '700',
  fill: 0xffffff,
};
