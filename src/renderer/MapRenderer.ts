import { Application, Container, Graphics, Text, type TextStyleOptions } from 'pixi.js';
import type { GameController } from '../game/commands/controller.ts';
import type { SectorState } from '../game/types.ts';
import { SECTOR_SIZE } from '../game/map/world.ts';
import { validatePlacement } from '../game/buildings/placement.ts';
import { startRegionConfig } from '../game/config/startRegion.config.ts';
import { t } from '../i18n/index.ts';
import {
  CATEGORY_COLORS,
  COLOR_CONSTRUCTION,
  COLOR_FIRE,
  COLOR_GHOST_BAD,
  COLOR_GHOST_OK,
  COLOR_LOCKED_OVERLAY,
  COLOR_SELECTION,
  COLOR_YIELD,
  TERRAIN_COLORS,
} from './colors.ts';

const TILE = 32;
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 3;

export interface RendererCallbacks {
  onSelectBuilding(id: string | undefined): void;
  onClickLockedSector(id: string): void;
  onPlace(defId: string, x: number, y: number): void;
  onCancelPlacement(): void;
  /** Quick-collect when tapping a building with ready yield. Returns true if collected. */
  onQuickCollect(id: string): boolean;
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
  private overlayLayer = new Container();
  private ghost = new Graphics();
  private selectionBox = new Graphics();

  private sectorViews = new Map<string, { container: Container; status: string }>();
  private lastVersion = -1;
  private placingDefId: string | undefined;
  private hoverTile: { x: number; y: number } | undefined;
  private selectedId: string | undefined;
  private destroyed = false;

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
    this.world.addChild(this.terrainLayer, this.buildingLayer, this.overlayLayer);
    this.overlayLayer.addChild(this.selectionBox, this.ghost);
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
    this.placingDefId = defId;
    if (!defId) this.ghost.clear();
  }

  setSelected(id: string | undefined): void {
    this.selectedId = id;
  }

  // ---- Input ----------------------------------------------------------------

  private bindInput(): void {
    const canvas = this.app.canvas;
    let dragging = false;
    let moved = false;
    let last = { x: 0, y: 0 };

    canvas.addEventListener('pointerdown', (e) => {
      dragging = true;
      moved = false;
      last = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener('pointermove', (e) => {
      const tile = this.screenToTile(e.offsetX, e.offsetY);
      this.hoverTile = tile;
      if (!dragging) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      if (moved) {
        this.world.position.x += dx;
        this.world.position.y += dy;
      }
      last = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener('pointerup', (e) => {
      dragging = false;
      if (moved) return;
      if (e.button === 2) {
        this.callbacks.onCancelPlacement();
        return;
      }
      const tile = this.screenToTile(e.offsetX, e.offsetY);
      this.handleClick(tile.x, tile.y);
    });
    canvas.addEventListener('pointerleave', () => {
      dragging = false;
      this.hoverTile = undefined;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
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

  private handleClick(x: number, y: number): void {
    const state = this.controller.state;
    if (this.placingDefId) {
      const def = this.controller.config.buildings.get(this.placingDefId);
      if (def) {
        const px = x - Math.floor(def.size.w / 2);
        const py = y - Math.floor(def.size.h / 2);
        this.callbacks.onPlace(this.placingDefId, px, py);
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
    const lx = x - sx * SECTOR_SIZE;
    const ly = y - sy * SECTOR_SIZE;
    const buildingId = sector?.tiles[ly * SECTOR_SIZE + lx]?.buildingId;
    if (buildingId) {
      const collected = this.callbacks.onQuickCollect(buildingId);
      if (!collected) this.callbacks.onSelectBuilding(buildingId);
    } else {
      this.callbacks.onSelectBuilding(undefined);
    }
  }

  // ---- Rendering --------------------------------------------------------------

  private frame(): void {
    this.cullSectors();
    if (this.controller.version !== this.lastVersion) {
      this.lastVersion = this.controller.version;
      this.syncSectors();
      this.redrawBuildings();
    }
    this.drawGhost();
    this.drawSelection();
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
        // Subtle tile grid + terrain detail dots for forest.
        g.rect(lx * TILE, ly * TILE, TILE, 1).fill({ color: 0x000000, alpha: 0.05 });
        g.rect(lx * TILE, ly * TILE, 1, TILE).fill({ color: 0x000000, alpha: 0.05 });
        if (tile.terrain === 'forest') {
          g.circle(lx * TILE + TILE / 2, ly * TILE + TILE / 2, TILE / 5).fill({ color: 0x2e6b32, alpha: 0.8 });
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

    for (const b of Object.values(state.buildings)) {
      const def = this.controller.config.buildings.get(b.defId);
      if (!def) continue;
      const g = new Graphics();
      const w = def.size.w * TILE;
      const h = def.size.h * TILE;
      const color = CATEGORY_COLORS[def.category];

      if (def.category === 'roads') {
        g.rect(2, 2, w - 4, h - 4).fill(color);
        g.rect(w / 2 - 1, 6, 2, h - 12).fill({ color: 0xf5f0e6, alpha: 0.7 });
      } else if (def.category === 'decoration') {
        g.circle(w / 2, h / 2, w / 2 - 4).fill(color);
      } else {
        g.roundRect(2, 2, w - 4, h - 4, 6).fill(color);
        g.roundRect(2, 2, w - 4, Math.max(6, h / 4), 6).fill({ color: 0xffffff, alpha: 0.18 }); // "roof" highlight
        g.roundRect(2, 2, w - 4, h - 4, 6).stroke({ width: 1.5, color: 0x000000, alpha: 0.25 });
      }

      const container = new Container();
      container.position.set(b.x * TILE, b.y * TILE);
      container.addChild(g);

      if (def.category !== 'roads' && def.category !== 'decoration') {
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
      if (b.status === 'active' && Math.floor(b.buffer) >= 1) {
        const bubble = new Graphics();
        bubble.circle(w - 6, 4, 8).fill(COLOR_YIELD).stroke({ width: 1.5, color: 0x7a6520 });
        container.addChild(bubble);
      }
      this.buildingLayer.addChild(container);
    }
  }

  private drawGhost(): void {
    this.ghost.clear();
    if (!this.placingDefId || !this.hoverTile) return;
    const def = this.controller.config.buildings.get(this.placingDefId);
    if (!def) return;
    const px = this.hoverTile.x - Math.floor(def.size.w / 2);
    const py = this.hoverTile.y - Math.floor(def.size.h / 2);
    const error = validatePlacement(this.controller.state, this.controller.config, this.controller.derived, def, px, py);
    const color = error ? COLOR_GHOST_BAD : COLOR_GHOST_OK;
    this.ghost
      .roundRect(px * TILE + 1, py * TILE + 1, def.size.w * TILE - 2, def.size.h * TILE - 2, 4)
      .fill({ color, alpha: 0.35 })
      .stroke({ width: 2, color });
  }

  private drawSelection(): void {
    this.selectionBox.clear();
    if (!this.selectedId) return;
    const b = this.controller.state.buildings[this.selectedId];
    const def = b && this.controller.config.buildings.get(b.defId);
    if (!b || !def) return;
    this.selectionBox
      .roundRect(b.x * TILE - 2, b.y * TILE - 2, def.size.w * TILE + 4, def.size.h * TILE + 4, 6)
      .stroke({ width: 2.5, color: COLOR_SELECTION, alpha: 0.9 });
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
