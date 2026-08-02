import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Focus, Gamepad2, Layers3, Minus, Plus, RotateCcw, TrafficCone, Trees } from 'lucide-react';
import { uiImage } from '../../assets/registry.ts';
import {
  DRIVE_KEYS,
  beginDrive,
  driveInputFromKeys,
  drivePose,
  nextTurn,
  reachedTarget,
  stepDrive,
  loadedTileSpeed,
  vehicleTileSpeed,
  type DriveState,
  type TurnHint,
} from '../../game/activities/driving.ts';
import type { CargoRouteStop } from '../../game/activities/logistics.ts';
import type { RouteAnalysis, RouteRoadAnchors, RouteSegment } from '../../game/activities/routeAnalysis.ts';
import type { GameController } from '../../game/commands/controller.ts';
import { WORLD_TILES, regionIdAt } from '../../game/config/startRegion.config.ts';
import { worldTerrainAt } from '../../game/map/world.ts';
import { ROAD_TILE_METERS } from '../../game/roads/roadProfile.ts';
import type { BuildingCategory, BuildingInstance, RoadVariant } from '../../game/types.ts';
import type { BuildingDef } from '../../game/config/types.ts';
import {
  buildNatureChunks,
  buildWorldImage,
  drawNature,
  type NatureChunks,
  type WorldImage,
} from './worldMapLayers.ts';

const CANVAS_W = 1400;
const CANVAS_H = 900;
/**
 * Ganz herausgezoomt passt die komplette Insel ins Bild (§10 „große 2D
 * Weltkarte"): 512 Kacheln × Grundmaßstab müssen unter die Leinwandhöhe passen.
 */
const MIN_ZOOM = 0.055;
const MAX_ZOOM = 7;
/** Ab dieser Kachelgröße (px) lohnen Gebäudedetails, Beschriftungen, Fahrbahnmarkierung. */
const DETAIL_SCALE = 15;
/**
 * Unterhalb dieser Kachelgröße ist die Karte eine Übersicht: Gebäude und
 * Infrastruktur-Marker entfallen. Ohne das läge über der ganzen Insel ein
 * Teppich aus Mindestbreiten — die Übersicht zeigte dann alles außer der Insel.
 */
const OVERVIEW_SCALE = 5;
const BUILDINGS: Partial<Record<BuildingCategory, { wall: string; roof: string }>> = {
  residential: { wall: '#e3c68a', roof: '#9c4933' },
  economy: { wall: '#cf9755', roof: '#69452d' },
  production: { wall: '#a68a5c', roof: '#4f4030' },
  services: { wall: '#dde2d9', roof: '#476b7b' },
  government: { wall: '#e6dec5', roof: '#ad7d2c' },
  leisure: { wall: '#93b072', roof: '#3f6d56' },
};
/**
 * § 5 des Auftrags — hervorzuhebende Infrastruktur. Die Zuordnung kommt aus der
 * echten Gebäude-Config (Lagerwirkung, Logistikwirkung, Hafenfläche, aktiver
 * Betrieb), nicht aus einer Id-Liste: ein neues Lagergebäude erscheint dadurch
 * automatisch auf der Karte, ohne dass hier jemand nachträgt.
 */
type InfraKind = 'storage' | 'logistics' | 'harbour' | 'operation';
const INFRA_STYLE: Record<InfraKind, { color: string; label: string }> = {
  storage: { color: '#f0b74a', label: 'Lager' },
  logistics: { color: '#57c8e0', label: 'Logistik' },
  harbour: { color: '#5ad0a8', label: 'Hafen' },
  operation: { color: '#e08a4a', label: 'Betrieb' },
};

function infraKindOf(def: BuildingDef): InfraKind | undefined {
  if (def.waterfront) return 'harbour';
  if (def.effects?.some((effect) => effect.type === 'storage')) return 'storage';
  if (def.effects?.some((effect) => effect.type === 'logistics')) return 'logistics';
  if (def.operation) return 'operation';
  return undefined;
}

export interface CityworkMapPoint {
  id: string;
  x: number;
  y: number;
  label: string;
  subtitle: string;
}

/** Was das Fahr-HUD anzeigt. Bewusst gedrosselt aus der Fahrschleife gemeldet. */
export interface DriveReadout {
  speedKph: number;
  targetLabel: string | undefined;
  targetMeters: number | undefined;
  turn: TurnHint | undefined;
  turnMeters: number | undefined;
  remaining: number;
}

interface ViewState {
  centerX: number;
  centerY: number;
  zoom: number;
}

interface Interaction {
  kind: 'pan' | 'draw';
  clientX: number;
  clientY: number;
  view: ViewState;
  moved: boolean;
  button: number;
}

type Transform = { centerX: number; centerY: number; scale: number };

// Weltbild und Vegetation überleben das Schließen des Planers: sie hängen nur am
// Freischaltzustand, und ihn erneut zu backen kostet spürbar Zeit.
let worldImageCache: { key: string; image: WorldImage } | undefined;
let natureCache: { key: string; chunks: NatureChunks } | undefined;

export function ManualRouteMap({
  game,
  source,
  targets,
  anchors,
  roadPath,
  analysis,
  referenceSegments,
  referencePath,
  visitOrder,
  cargoStops,
  fitNonce,
  focusRequest,
  vehicleSpeedKph,
  loadRatio,
  editEnabled = true,
  driving = false,
  onArrive,
  onExitDrive,
  onDriveReadout,
  onPathChange,
  onInvalid,
}: {
  game: GameController;
  source: { x: number; y: number; label: string };
  targets: CityworkMapPoint[];
  anchors: RouteRoadAnchors | undefined;
  roadPath: { x: number; y: number }[];
  analysis: RouteAnalysis | undefined;
  referenceSegments: RouteSegment[] | undefined;
  /** Der automatisch optimierte Weg — als „alternative Route" sichtbar (§5). */
  referencePath?: { x: number; y: number }[] | undefined;
  visitOrder: string[];
  cargoStops?: CargoRouteStop[];
  fitNonce: number;
  focusRequest?: { x: number; y: number; nonce: number };
  /** Höchstgeschwindigkeit des gewählten Fahrzeugs (Config-Wert, kein zweiter Tempowert). */
  vehicleSpeedKph?: number | undefined;
  /**
   * § P4: Füllstand des Fahrzeugs 0..1. Ein volles Fahrzeug fährt langsamer
   * (`loadedTileSpeed`) — dieselbe Regel wie in der Sim, keine zweite Tabelle.
   */
  loadRatio?: number | undefined;
  /** Standardmäßig bleibt die Smart-Route gesperrt; Zoomen und Verschieben funktionieren weiter. */
  editEnabled?: boolean;
  /**
   * § P2 (D-050): DIESE Karte ist die Fahransicht. Ist `driving` gesetzt, steuert
   * der Spieler das Fahrzeug hier mit WASD/Pfeiltasten über dasselbe
   * Straßennetz, das er sonst mit der Maus zeichnet — kein zweiter Renderer,
   * keine 3D-Welt, keine zweite Karte.
   */
  driving?: boolean;
  /** Zielgebäude erreicht — der Aufrufer schließt den Stopp über den Command ab. */
  onArrive?(buildingId: string): void;
  /** Q/ESC: aussteigen. */
  onExitDrive?(): void;
  /** Gedrosselte Fahrdaten fürs HUD (≈4×/s, nicht je Bild). */
  onDriveReadout?(readout: DriveReadout): void;
  onPathChange(path: { x: number; y: number }[]): void;
  onInvalid(): void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const interactionRef = useRef<Interaction>();
  const rightDraggedRef = useRef(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showBuildings, setShowBuildings] = useState(true);
  const [showNature, setShowNature] = useState(true);
  const [routePhase, setRoutePhase] = useState(0);
  const fit = useMemo(() => fitView([source, ...targets]), [source, targets]);
  const [view, setView] = useState<ViewState>(fit);
  // § P2: Zustand der laufenden Fahrt. Bewusst Refs — 60 Bilder/s durch React
  // zu schicken wäre genau die Art Re-Render, die CLAUDE.md §6 verbietet.
  const driveRef = useRef<DriveState>();
  const viewRef = useRef<ViewState>();
  const heldRef = useRef<Set<string>>(new Set());
  const drivingRef = useRef(false);
  /** Bereits gefahrene Strecke (§5 „Handelswege"), gedeckelt. */
  const trailRef = useRef<{ x: number; y: number }[]>([]);

  const roadTiles = useMemo(() => {
    const roads = new Map<string, BuildingInstance>();
    for (const building of Object.values(game.state.buildings)) {
      if (game.config.buildings.get(building.defId)?.category === 'roads') {
        roads.set(`${building.x},${building.y}`, building);
      }
    }
    return roads;
  }, [game, game.version]);
  /** Befahrbare Kacheln als reine Menge — die Form, die `stepDrive` erwartet. */
  const roadSet = useMemo<ReadonlySet<string>>(() => new Set(roadTiles.keys()), [roadTiles]);
  /** Alle von Stadtgebäuden belegten Kacheln — dort wird Vegetation verdeckt. */
  const occupied = useMemo(() => {
    const result = new Set<string>();
    for (const building of Object.values(game.state.buildings)) {
      const definition = game.config.buildings.get(building.defId);
      if (!definition) continue;
      for (let dy = 0; dy < definition.size.h; dy++) {
        for (let dx = 0; dx < definition.size.w; dx++) result.add(`${building.x + dx},${building.y + dy}`);
      }
    }
    return result;
  }, [game, game.version]);

  // § P3: Weltbild und Vegetation der ECHTEN Insel. Beide hängen NUR am
  // Freischaltzustand — hingen sie an der Belegung, würde jeder Bauklick das
  // halbe Eiland neu backen (D-045).
  const unlockKey = useMemo(
    () => Object.values(game.state.world.regions)
      .filter((region) => region.status === 'unlocked')
      .map((region) => region.id)
      .sort((a, b) => a - b)
      .join(','),
    [game, game.version],
  );
  // Als Menge, nicht als Zeichenkettensuche: Das Weltbild fragt das für JEDE
  // der 262.144 Kacheln ab — ein `split()` je Kachel kostete dort mehr als die
  // gesamte Farbberechnung.
  const unlockedIds = useMemo(
    () => new Set(unlockKey ? unlockKey.split(',').map(Number) : []),
    [unlockKey],
  );
  const isLocked = useCallback(
    (regionId: number) => regionId !== 0 && !unlockedIds.has(regionId),
    [unlockedIds],
  );
  const worldImage = useMemo(() => {
    if (worldImageCache?.key === unlockKey) return worldImageCache.image;
    const image = buildWorldImage(isLocked, regionIdAt);
    worldImageCache = { key: unlockKey, image };
    return image;
  }, [unlockKey, isLocked]);
  const natureChunks = useMemo(() => {
    if (natureCache?.key === unlockKey) return natureCache.chunks;
    const regionIds = Object.values(game.state.world.regions).map((region) => region.id);
    const chunks = buildNatureChunks(regionIds, isLocked, (x, y) => worldTerrainAt(game.state, x, y));
    natureCache = { key: unlockKey, chunks };
    return chunks;
    // `game` liefert nur die Terrain-Overrides; die Verteilung selbst hängt am
    // Freischaltzustand, deshalb ist `unlockKey` der Schlüssel.
  }, [unlockKey, isLocked, game]);

  /**
   * Noch offene Ziele in Reihenfolge, mit Footprint. Als Ref, damit die
   * Fahr-Schleife sie ohne Neuaufbau lesen kann; die Wahrheit über „erledigt"
   * bleibt der Spielstand (`targets[].done`), nicht die Karte.
   */
  const arrivalTargetsRef = useRef<
    { buildingId: string; label: string; x: number; y: number; size: { w: number; h: number } }[]
  >([]);
  arrivalTargetsRef.current = (game.state.activities.active?.targets ?? [])
    .filter((target) => !target.done)
    .flatMap((target) => {
      const building = game.state.buildings[target.buildingId];
      const definition = building && game.config.buildings.get(building.defId);
      if (!building || !definition) return [];
      const label = targets.find((point) => point.id === target.buildingId)?.label ?? 'Ziel';
      return [{ buildingId: target.buildingId, label, x: building.x, y: building.y, size: definition.size }];
    });
  const traffic = useMemo(() => {
    const result = new Map<string, number>();
    for (const segment of referenceSegments ?? []) {
      for (const point of segment.path) {
        const id = `${Math.floor(point.x)},${Math.floor(point.y)}`;
        result.set(id, Math.max(result.get(id) ?? 0, segment.load));
      }
    }
    return result;
  }, [referenceSegments]);
  const markerImages = useImageMap({
    source: uiImage('marker_source'),
    delivery: uiImage('marker_delivery'),
    resupply: uiImage('marker_resupply'),
  });

  useEffect(() => setView(fit), [fitNonce, fit.centerX, fit.centerY, fit.zoom]);
  useEffect(() => {
    if (!focusRequest) return;
    setView((current) => ({
      ...current,
      centerX: focusRequest.x,
      centerY: focusRequest.y,
      zoom: Math.max(3.2, current.zoom),
    }));
  }, [focusRequest]);
  useEffect(() => {
    if (roadPath.length < 2) return;
    const timer = window.setInterval(() => setRoutePhase((value) => (value + 1) % 24), 120);
    return () => window.clearInterval(timer);
  }, [roadPath.length]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement | null;
      if (element?.tagName === 'INPUT' || element?.tagName === 'TEXTAREA' || element?.isContentEditable) return;
      if (event.code === 'Space') {
        event.preventDefault();
        setSpaceHeld(true);
      }
      if (event.key === '+' || event.key === '=') {
        setView((current) => ({ ...current, zoom: clamp(current.zoom * 1.2, MIN_ZOOM, MAX_ZOOM) }));
      }
      if (event.key === '-') {
        setView((current) => ({ ...current, zoom: clamp(current.zoom / 1.2, MIN_ZOOM, MAX_ZOOM) }));
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') setSpaceHeld(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // § P2: Der Zeichenvorgang ist eine FUNKTION, kein Effekt-Rumpf — die
  // Fahr-Schleife muss ihn 60×/s aufrufen können, ohne React neu zu rendern
  // (CLAUDE.md §6: keine unnötigen Re-Renders).
  const drawScene = useCallback((view: ViewState, drive: DriveState | undefined) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const transform = mapTransform(view);
    const project = (x: number, y: number) => toScreen(x, y, transform);
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    // Offener Ozean außerhalb der Insel.
    const background = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    background.addColorStop(0, '#0f3c4c');
    background.addColorStop(1, '#07222c');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const bounds = {
      minX: Math.max(0, Math.floor(view.centerX - CANVAS_W / transform.scale / 2) - 2),
      maxX: Math.min(WORLD_TILES - 1, Math.ceil(view.centerX + CANVAS_W / transform.scale / 2) + 2),
      minY: Math.max(0, Math.floor(view.centerY - CANVAS_H / transform.scale / 2) - 2),
      maxY: Math.min(WORLD_TILES - 1, Math.ceil(view.centerY + CANVAS_H / transform.scale / 2) + 2),
    };

    // ---- Ebene 1: die echte Welt --------------------------------------------
    // Ein Zeichenaufruf. Terrain, Höhenrelief, Klippen, Küste und Wassertiefe
    // stecken im gebackenen Weltbild (`worldMapLayers`), das dieselben Höhen und
    // Masken liest wie der 3D-Renderer.
    const origin = project(0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      worldImage.canvas,
      origin.x,
      origin.y,
      WORLD_TILES * transform.scale,
      WORLD_TILES * transform.scale,
    );

    // ---- Ebene 2: Vegetation aus derselben Verteilung wie die 3D-Welt -------
    if (showNature) drawNature(ctx, natureChunks, occupied, bounds, project, transform.scale);

    drawRegionBorders(ctx, bounds, transform);
    drawRoadNetwork(ctx, roadTiles, traffic, showTraffic, bounds, transform);
    if (showBuildings && transform.scale >= OVERVIEW_SCALE) drawBuildings(ctx, game, targets, bounds, transform);
    drawInfrastructure(ctx, game, bounds, transform);
    if (referencePath && referencePath.length > 1 && !drive) drawAlternativeRoute(ctx, referencePath, transform);
    if (trailRef.current.length > 1) drawTrail(ctx, trailRef.current, transform);
    drawRoute(ctx, roadPath, cargoStops, transform, routePhase, analysis !== undefined);

    if (anchors) {
      const resupplies = cargoStops?.filter((stop) => stop.type === 'resupply').length ?? 0;
      drawImageMarker(
        ctx,
        anchors.source,
        markerImages.source,
        '#4bd884',
        source.label,
        resupplies > 0 ? `Quelle · ${resupplies}× nachladen` : 'Quelle / Start',
        undefined,
        transform,
      );
      if (resupplies > 0) drawMarkerBadge(ctx, anchors.source, markerImages.resupply, resupplies, transform);
      anchors.targets.forEach((anchor, index) => {
        const target = targets[index];
        if (!target) return;
        const visitIndex = visitOrder.indexOf(target.id);
        drawImageMarker(
          ctx,
          anchor,
          markerImages.delivery,
          visitIndex >= 0 ? '#57d88a' : '#4aa7df',
          target.label,
          visitIndex >= 0 ? `Stopp ${visitIndex + 1}` : 'Lieferziel',
          visitIndex >= 0 ? visitIndex + 1 : undefined,
          transform,
        );
      });
    }

    if (drive) drawVehicle(ctx, drive, transform);
  }, [
    analysis,
    anchors,
    cargoStops,
    game,
    game.version,
    markerImages,
    natureChunks,
    occupied,
    referencePath,
    roadPath,
    roadTiles,
    routePhase,
    showBuildings,
    showNature,
    showTraffic,
    source.label,
    targets,
    traffic,
    visitOrder,
    worldImage,
  ]);

  // Normaler Neuzeichnen-Pfad (Planung): React-Zustand ändert sich → neu malen.
  useEffect(() => {
    if (drivingRef.current) return; // während der Fahrt führt die rAF-Schleife
    drawScene(view, undefined);
  }, [drawScene, view]);

  /**
   * Alles, was die Fahr-Schleife braucht, aber bei jedem Command eine neue
   * Identität bekommt. Über diesen Ref sieht sie stets die aktuellen Werte,
   * ohne dass der Effekt (und mit ihm die Fahrt) neu aufgesetzt wird.
   */
  const liveRef = useRef({
    drawScene,
    roadSet,
    roadPath,
    anchors,
    zoom: view.zoom,
    maxSpeed: loadedTileSpeed(vehicleTileSpeed(vehicleSpeedKph ?? 0), loadRatio ?? 0),
    onArrive,
    onExitDrive,
    onDriveReadout,
  });
  liveRef.current = {
    drawScene,
    roadSet,
    roadPath,
    anchors,
    zoom: view.zoom,
    maxSpeed: loadedTileSpeed(vehicleTileSpeed(vehicleSpeedKph ?? 0), loadRatio ?? 0),
    onArrive,
    onExitDrive,
    onDriveReadout,
  };
  /**
   * Der Startpunkt als WERT, nicht als Objektidentität.
   *
   * `anchors` ist ein `useMemo` über `game.version` — es bekommt bei JEDEM
   * Command eine neue Identität. Stand es im Abhängigkeitsarray der Fahrt (so
   * war es zuerst), setzte schon ein erreichter Stopp die Schleife neu auf: das
   * Fahrzeug sprang an den Start zurück und der Zoom auf den Anfangswert. Der
   * Fahrer merkt das sofort, ein Test ohne Ankunft nie — gefunden hat es der
   * Smoke im laufenden Spiel.
   */
  const spawnKey = anchors ? `${anchors.source.x},${anchors.source.y}` : '';

  // ---- § P2/P3: die Fahrt in DIESER Karte ---------------------------------
  //
  // Physik und Reichweite kommen aus `game/activities/driving.ts` — derselben
  // Quelle, aus der auch der 3D-Renderer fährt (§2/§8: kein zweites Fahrmodell).
  // Seit P3 ist die Fahrt straßengebunden: W gibt Gas, A/D wählen an der
  // Kreuzung, S bremst und fährt rückwärts. Die Schleife läuft an React vorbei
  // über Refs; nur Ein-/Aussteigen und erreichte Ziele lösen ein Update aus.
  useEffect(() => {
    drivingRef.current = driving;
    if (!driving) {
      driveRef.current = undefined;
      heldRef.current.clear();
      trailRef.current = [];
      // Beim Aussteigen die zuletzt gefahrene Ansicht in den React-Zustand
      // zurückschreiben, damit die Karte nicht zurückspringt.
      if (viewRef.current) setView(viewRef.current);
      return;
    }

    // Startpunkt: der Quellanker der Route, sonst der Anfang des Weges.
    const spawn = liveRef.current.anchors?.source ?? liveRef.current.roadPath[0];
    if (!spawn) return;
    const towards = liveRef.current.roadPath.find((point) => point.x !== spawn.x || point.y !== spawn.y);
    const initial = beginDrive(liveRef.current.roadSet, spawn, towards);
    if (!initial) {
      // Eine einzelne Straßenkachel ist kein Netz — das wird gesagt, nicht
      // durch ein stehendes Fahrzeug vorgetäuscht.
      liveRef.current.onExitDrive?.();
      return;
    }
    driveRef.current = initial;
    trailRef.current = [drivePose(initial)];
    // Fahrzoom: nah genug, um Abzweigungen zu erkennen, weit genug, um die
    // Umgebung zu sehen. Ein engerer Wert (der erste Ansatz stand bei 4,2)
    // zeigte nur noch Fahrbahn und Wiese.
    viewRef.current = { centerX: spawn.x, centerY: spawn.y, zoom: clamp(liveRef.current.zoom, 2.1, 2.8) };

    const onKey = (event: KeyboardEvent, down: boolean) => {
      const element = event.target as HTMLElement | null;
      if (element?.tagName === 'INPUT' || element?.tagName === 'TEXTAREA' || element?.isContentEditable) return;
      const key = event.key.toLowerCase();
      if (down && (key === 'escape' || key === 'q')) {
        liveRef.current.onExitDrive?.();
        return;
      }
      if (!DRIVE_KEYS.has(key)) return;
      if (down) heldRef.current.add(key);
      else heldRef.current.delete(key);
      event.preventDefault();
    };
    const onKeyDown = (event: KeyboardEvent) => onKey(event, true);
    const onKeyUp = (event: KeyboardEvent) => onKey(event, false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let raf = 0;
    let last = performance.now();
    let lastReadout = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      // Ein Tabwechsel darf das Fahrzeug nicht quer über die Insel schleudern.
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const drive = driveRef.current;
      const currentView = viewRef.current;
      if (!drive || !currentView) return;

      const live = liveRef.current;
      const input = driveInputFromKeys(heldRef.current);
      const stepped = stepDrive(drive, input, dt, live.roadSet, live.maxSpeed);
      driveRef.current = stepped;
      const pose = drivePose(stepped);
      // Gefahrene Strecke mitschreiben (grob, damit die Liste nicht wächst).
      const lastTrail = trailRef.current.at(-1);
      if (!lastTrail || Math.hypot(pose.x - lastTrail.x, pose.y - lastTrail.y) > 0.6) {
        trailRef.current.push({ x: pose.x, y: pose.y });
        if (trailRef.current.length > 600) trailRef.current.shift();
      }
      // Die Karte folgt dem Fahrzeug (Verfolgerblick von oben).
      currentView.centerX += (pose.x - currentView.centerX) * Math.min(1, dt * 6);
      currentView.centerY += (pose.y - currentView.centerY) * Math.min(1, dt * 6);
      live.drawScene(currentView, stepped);

      // Nächstes offenes Ziel erreicht? Genau dieselbe Regel wie in 3D.
      const openTarget = arrivalTargetsRef.current[0];
      if (openTarget && reachedTarget(pose, openTarget, openTarget.size)) {
        live.onArrive?.(openTarget.buildingId);
      }

      // HUD-Daten gedrosselt melden — 60×/s durch React zu schicken wäre genau
      // der Re-Render, den die Schleife vermeidet.
      if (now - lastReadout > 240 && live.onDriveReadout) {
        lastReadout = now;
        const turn = nextTurn(stepped, live.roadSet, input.steer);
        const distance = openTarget
          ? Math.hypot(
              openTarget.x + openTarget.size.w / 2 - pose.x,
              openTarget.y + openTarget.size.h / 2 - pose.y,
            )
          : undefined;
        live.onDriveReadout({
          speedKph: Math.abs(stepped.speed) * ROAD_TILE_METERS * 3.6,
          targetLabel: openTarget?.label,
          targetMeters: distance === undefined ? undefined : distance * ROAD_TILE_METERS,
          turn: turn?.turn,
          turnMeters: turn ? turn.distanceTiles * ROAD_TILE_METERS : undefined,
          remaining: arrivalTargetsRef.current.length,
        });
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
    // ABSICHTLICH nur `driving` und der Startanker ALS WERT: Straßen,
    // Zeichenfunktion, Anker und Rückrufe wechseln bei JEDEM Command die
    // Identität (`game.version`). Stünden sie hier, würde ein erreichter Stopp
    // die Fahrt neu aufsetzen und das Fahrzeug zum Startpunkt zurückwerfen.
    // Sie kommen deshalb aus `liveRef`.
  }, [driving, spawnKey]);

  const worldAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const rect = canvas.getBoundingClientRect();
    const transform = mapTransform(view);
    return {
      x: view.centerX + ((clientX - rect.left) / rect.width) * CANVAS_W / transform.scale - CANVAS_W / transform.scale / 2,
      y: view.centerY + ((clientY - rect.top) / rect.height) * CANVAS_H / transform.scale - CANVAS_H / transform.scale / 2,
    };
  };

  const appendRoad = (clientX: number, clientY: number, noisy: boolean) => {
    if (!editEnabled) return;
    const world = worldAt(clientX, clientY);
    if (!world || !anchors) return;
    const tile = { x: Math.floor(world.x), y: Math.floor(world.y) };
    const id = `${tile.x},${tile.y}`;
    const last = roadPath.at(-1);
    if (!roadTiles.has(id)) {
      if (noisy) onInvalid();
      return;
    }
    if (!last) {
      if (tile.x === anchors.source.x && tile.y === anchors.source.y) onPathChange([tile]);
      else if (noisy) onInvalid();
      return;
    }
    if (tile.x === last.x && tile.y === last.y) return;
    const previous = roadPath.at(-2);
    if (previous && tile.x === previous.x && tile.y === previous.y) {
      onPathChange(roadPath.slice(0, -1));
      return;
    }
    const dx = tile.x - last.x;
    const dy = tile.y - last.y;
    if (dx !== 0 && dy !== 0) {
      if (noisy) onInvalid();
      return;
    }
    const steps = Math.abs(dx) + Math.abs(dy);
    const sx = Math.sign(dx);
    const sy = Math.sign(dy);
    const extension = Array.from({ length: steps }, (_, index) => ({
      x: last.x + sx * (index + 1),
      y: last.y + sy * (index + 1),
    }));
    if (extension.length === 0 || extension.some((point) => !roadTiles.has(`${point.x},${point.y}`))) {
      if (noisy) onInvalid();
      return;
    }
    onPathChange([...roadPath, ...extension]);
  };

  return (
    <div className={`citywork-v4-map${spaceHeld ? ' is-panning' : ''}${editEnabled ? ' is-editable' : ' is-smart-locked'}`}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        aria-label="Logistikkarte der Stadt – Draufsicht auf die echte Spielwelt"
        onContextMenu={(event) => {
          event.preventDefault();
          if (editEnabled && !rightDraggedRef.current && roadPath.length > 1) onPathChange(roadPath.slice(0, -1));
          rightDraggedRef.current = false;
        }}
        onPointerDown={(event) => {
          // § P2: Während der Fahrt führt die Verfolgeransicht — Ziehen und
          // Zeichnen würden gegen sie arbeiten.
          if (driving) return;
          const world = worldAt(event.clientX, event.clientY);
          const overRoad = world ? roadTiles.has(`${Math.floor(world.x)},${Math.floor(world.y)}`) : false;
          const pan = !editEnabled || event.button === 1 || event.button === 2 || spaceHeld || !overRoad;
          interactionRef.current = {
            kind: pan ? 'pan' : 'draw',
            clientX: event.clientX,
            clientY: event.clientY,
            view,
            moved: false,
            button: event.button,
          };
          if (!pan && event.button === 0) appendRoad(event.clientX, event.clientY, true);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const interaction = interactionRef.current;
          if (!interaction) return;
          if (Math.hypot(event.clientX - interaction.clientX, event.clientY - interaction.clientY) > 3) interaction.moved = true;
          if (interaction.kind === 'pan') {
            const transform = mapTransform(interaction.view);
            const rect = event.currentTarget.getBoundingClientRect();
            setView({
              ...interaction.view,
              centerX: interaction.view.centerX - ((event.clientX - interaction.clientX) / rect.width) * CANVAS_W / transform.scale,
              centerY: interaction.view.centerY - ((event.clientY - interaction.clientY) / rect.height) * CANVAS_H / transform.scale,
            });
          } else {
            appendRoad(event.clientX, event.clientY, false);
          }
        }}
        onPointerUp={(event) => {
          if (interactionRef.current?.button === 2) rightDraggedRef.current = interactionRef.current.moved;
          interactionRef.current = undefined;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          interactionRef.current = undefined;
        }}
        onDoubleClick={(event) => {
          const world = worldAt(event.clientX, event.clientY);
          if (!world || !anchors) return;
          const candidates = [anchors.source, ...anchors.targets];
          const closest = [...candidates].sort(
            (a, b) => Math.hypot(a.x - world.x, a.y - world.y) - Math.hypot(b.x - world.x, b.y - world.y),
          )[0];
          if (closest) setView((current) => ({ ...current, centerX: closest.x, centerY: closest.y, zoom: Math.max(3.4, current.zoom) }));
        }}
        onWheel={(event) => {
          // Kein `preventDefault()`: React hängt `wheel` passiv ein, der Aufruf
          // wirkt nicht und schreibt nur eine Warnung in die Konsole.
          const factor = event.deltaY < 0 ? 1.14 : 0.87;
          // Beim Fahren gehört die Ansicht der Schleife: den Zoom dort ändern,
          // sonst würde ein React-Update die Verfolgeransicht überschreiben.
          if (driving && viewRef.current) {
            viewRef.current.zoom = clamp(viewRef.current.zoom * factor, MIN_ZOOM, MAX_ZOOM);
            return;
          }
          setView((current) => ({ ...current, zoom: clamp(current.zoom * factor, MIN_ZOOM, MAX_ZOOM) }));
        }}
      />

      {driving ? (
        <div className="citywork-v4-map-drive">
          <span><Gamepad2 size={15} /> W Gas · S Bremse/Rückwärts · A/D Abzweigung</span>
          <span>Q oder ESC: aussteigen</span>
        </div>
      ) : (
        <div className="citywork-v4-map-hint">
          {editEnabled
            ? <span>Auf Straße ziehen: Route korrigieren</span>
            : <span>Smart-Route aktiv · Ziehen: Karte verschieben</span>}
          <span>Mausrad: Zoom</span>
        </div>
      )}
      <div className="citywork-v4-map-zoom">
        <button onClick={() => setView((current) => ({ ...current, zoom: clamp(current.zoom * 1.2, MIN_ZOOM, MAX_ZOOM) }))} title="Hineinzoomen"><Plus size={18} /></button>
        <button onClick={() => setView((current) => ({ ...current, zoom: clamp(current.zoom / 1.2, MIN_ZOOM, MAX_ZOOM) }))} title="Herauszoomen"><Minus size={18} /></button>
        <button onClick={() => setView(fit)} title="Auftrag einpassen"><Focus size={18} /></button>
      </div>
      <div className="citywork-v4-map-layers">
        <button className={showTraffic ? 'active' : ''} onClick={() => setShowTraffic((value) => !value)} title="Verkehrslast"><TrafficCone size={17} /></button>
        <button className={showBuildings ? 'active' : ''} onClick={() => setShowBuildings((value) => !value)} title="Gebäude"><Building2 size={17} /></button>
        <button className={showNature ? 'active' : ''} onClick={() => setShowNature((value) => !value)} title="Landschaft"><Trees size={17} /></button>
        {editEnabled && (
          <button onClick={() => onPathChange(anchors ? [{ ...anchors.source }] : [])} title="Route zurücksetzen"><RotateCcw size={17} /></button>
        )}
        <span><Layers3 size={14} /> Ebenen</span>
      </div>
    </div>
  );
}

function useImageMap(urls: Record<string, string | undefined>): Record<string, HTMLImageElement | undefined> {
  const stableUrls = Object.values(urls).join('|');
  const [images, setImages] = useState<Record<string, HTMLImageElement | undefined>>({});
  useEffect(() => {
    let cancelled = false;
    for (const [key, url] of Object.entries(urls)) {
      if (!url) continue;
      const image = new Image();
      image.onload = () => {
        if (!cancelled) setImages((current) => ({ ...current, [key]: image }));
      };
      image.src = url;
    }
    return () => {
      cancelled = true;
    };
  }, [stableUrls]);
  return images;
}

function fitView(points: { x: number; y: number }[]): ViewState {
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const width = Math.max(15, maxX - minX + 13);
  const height = Math.max(12, maxY - minY + 11);
  const scale = Math.min(CANVAS_W / width, CANVAS_H / height);
  const baseScale = Math.min(CANVAS_W / 38, CANVAS_H / 28);
  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    zoom: clamp(scale / baseScale, 0.85, 2.75),
  };
}

function mapTransform(view: ViewState): Transform {
  const baseScale = Math.min(CANVAS_W / 38, CANVAS_H / 28);
  return { centerX: view.centerX, centerY: view.centerY, scale: baseScale * view.zoom };
}

function toScreen(x: number, y: number, transform: Transform) {
  return {
    x: CANVAS_W / 2 + (x - transform.centerX) * transform.scale,
    y: CANVAS_H / 2 + (y - transform.centerY) * transform.scale,
  };
}

/**
 * § P2/P3: Das gesteuerte Fahrzeug in der Draufsicht — ein gerichteter Keil,
 * damit die Fahrtrichtung auch bei kleinem Zoom ablesbar bleibt. Bewusst
 * schlicht: die Karte ist eine Logistikansicht, kein zweiter Renderer.
 */
function drawVehicle(ctx: CanvasRenderingContext2D, drive: DriveState, transform: Transform): void {
  const pose = drivePose(drive);
  const point = toScreen(pose.x, pose.y, transform);
  const size = Math.max(9, transform.scale * 0.62);
  ctx.save();
  ctx.translate(point.x, point.y);
  // Der Keil zeigt ungedreht nach oben (−y). Weltvorwärts ist `(sin h, cos h)`,
  // und die Karte bildet +y nach UNTEN ab — daraus folgt der Bildwinkel π − h.
  ctx.rotate(Math.PI - pose.heading);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = size * 0.5;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.72);
  ctx.lineTo(size * 0.5, size * 0.6);
  ctx.lineTo(0, size * 0.3);
  ctx.lineTo(-size * 0.5, size * 0.6);
  ctx.closePath();
  ctx.fillStyle = '#ffd45e';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = Math.max(1, size * 0.09);
  ctx.strokeStyle = 'rgba(38, 24, 4, 0.85)';
  ctx.stroke();
  ctx.restore();
}

function drawRegionBorders(ctx: CanvasRenderingContext2D, bounds: Bounds, transform: Transform) {
  ctx.strokeStyle = 'rgba(245,217,145,.16)';
  ctx.lineWidth = Math.max(1, transform.scale * 0.05);
  ctx.setLineDash([Math.max(3, transform.scale * 0.22), Math.max(3, transform.scale * 0.18)]);
  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      const region = regionIdAt(x, y);
      if (regionIdAt(x + 1, y) !== region) {
        const a = toScreen(x + 1, y, transform);
        const b = toScreen(x + 1, y + 1, transform);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      if (regionIdAt(x, y + 1) !== region) {
        const a = toScreen(x, y + 1, transform);
        const b = toScreen(x + 1, y + 1, transform);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  }
  ctx.setLineDash([]);
}

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** Bauwerksvarianten, die als Brücke/Viadukt eigenständig gezeichnet werden. */
const ELEVATED_VARIANTS: ReadonlySet<RoadVariant> = new Set(['bridge', 'viaduct', 'support']);

/**
 * Straßennetz in der Draufsicht.
 *
 * Die Straßenklasse kommt aus dem Spielstand, nicht aus einem Namensvergleich:
 * `roadEngineering.variant` ist das aus dem Höhenprofil abgeleitete Bauwerk
 * (Brücke, Viadukt, Stützmauer …), das auch die 3D-Welt baut. Die Strichstärke
 * folgt zusätzlich der ECHTEN Verkehrslast der Referenzanalyse — eine
 * Straßenhierarchie (Haupt-/Nebenstraße) gibt es im Spiel bisher nicht und wird
 * hier deshalb auch nicht erfunden.
 */
function drawRoadNetwork(
  ctx: CanvasRenderingContext2D,
  roads: ReadonlyMap<string, BuildingInstance>,
  traffic: ReadonlyMap<string, number>,
  showTraffic: boolean,
  bounds: Bounds,
  transform: Transform,
) {
  for (const [id, building] of roads) {
    const [x, y] = id.split(',').map(Number) as [number, number];
    if (x < bounds.minX || x > bounds.maxX || y < bounds.minY || y > bounds.maxY) continue;
    const center = toScreen(x + 0.5, y + 0.5, transform);
    const variant = building.roadEngineering?.variant;
    const elevated = variant !== undefined && ELEVATED_VARIANTS.has(variant);
    const load = traffic.get(id) ?? 0;
    const busy = load >= 2;
    // Nach OBEN gedeckelt: eine Kachel ist 4 m breit, aber beim Heranzoomen darf
    // die Fahrbahn nicht zur Landebahn werden — sonst verschwindet die Stadt
    // unter ihren eigenen Straßen.
    // Die Mindestbreite darf die Kachel nicht überschreiten — in der
    // Inselübersicht sonst ein Straßenteppich statt einer Landkarte.
    const floor = Math.min(1, transform.scale / 9);
    const casing = clamp(transform.scale * (busy ? 0.76 : 0.62), (busy ? 9 : 7) * floor, busy ? 30 : 25);
    const surface = clamp(transform.scale * (busy ? 0.54 : 0.42), (busy ? 6 : 4) * floor, busy ? 21 : 17);
    ctx.lineCap = 'round';
    ctx.strokeStyle = elevated ? 'rgba(12,26,32,.85)' : 'rgba(3,12,16,.74)';
    ctx.lineWidth = casing;
    drawRoadLinks(ctx, center, x, y, roads, transform);
    ctx.strokeStyle = elevated ? '#9aa8ae' : busy ? '#7d8f90' : '#697d7d';
    ctx.lineWidth = surface;
    drawRoadLinks(ctx, center, x, y, roads, transform);
    if (showTraffic) {
      ctx.strokeStyle = ['rgba(91,213,125,.28)', 'rgba(211,210,73,.38)', 'rgba(244,163,48,.46)', 'rgba(235,78,58,.58)'][load]!;
      ctx.lineWidth = Math.max(2, transform.scale * 0.16);
      drawRoadLinks(ctx, center, x, y, roads, transform);
    }
    if (transform.scale > DETAIL_SCALE + 3) {
      ctx.setLineDash([transform.scale * 0.2, transform.scale * 0.23]);
      ctx.strokeStyle = 'rgba(237,232,193,.42)';
      ctx.lineWidth = Math.max(1, transform.scale * 0.035);
      drawRoadLinks(ctx, center, x, y, roads, transform);
      ctx.setLineDash([]);
    }
  }
}

function drawBuildings(
  ctx: CanvasRenderingContext2D,
  game: GameController,
  targets: CityworkMapPoint[],
  bounds: Bounds,
  transform: Transform,
) {
  const targetIds = new Set(targets.map((target) => target.id));
  const buildings = Object.values(game.state.buildings)
    .filter((building) =>
      building.x >= bounds.minX - 8 && building.x <= bounds.maxX + 2
      && building.y >= bounds.minY - 8 && building.y <= bounds.maxY + 2)
    .sort((a, b) => a.y - b.y || a.x - b.x);
  for (const building of buildings) {
    const definition = game.config.buildings.get(building.defId);
    if (!definition || definition.category === 'roads') continue;
    const point = toScreen(building.x, building.y, transform);
    const width = Math.max(3, definition.size.w * transform.scale);
    const height = Math.max(3, definition.size.h * transform.scale);
    if (definition.category === 'decoration') {
      ctx.fillStyle = '#2f6f42';
      ctx.beginPath();
      ctx.arc(point.x + width / 2, point.y + height / 2, Math.max(2, Math.min(width, height) * 0.35), 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    const palette = BUILDINGS[definition.category] ?? { wall: '#a89b83', roof: '#5d6670' };
    const lift = Math.min(height * 0.24, transform.scale * 0.9);
    ctx.fillStyle = 'rgba(0,8,10,.3)';
    roundedRect(ctx, point.x + transform.scale * 0.14, point.y + transform.scale * 0.2, width, height, Math.max(2, transform.scale * 0.12));
    ctx.fill();
    ctx.fillStyle = targetIds.has(building.id) ? '#d7a55a' : palette.wall;
    roundedRect(ctx, point.x, point.y - lift * 0.2, width, height, Math.max(2, transform.scale * 0.1));
    ctx.fill();
    ctx.fillStyle = palette.roof;
    ctx.beginPath();
    ctx.moveTo(point.x - transform.scale * 0.07, point.y + height * 0.18);
    ctx.lineTo(point.x + width * 0.5, point.y - lift);
    ctx.lineTo(point.x + width + transform.scale * 0.07, point.y + height * 0.18);
    ctx.lineTo(point.x + width * 0.82, point.y + height * 0.36);
    ctx.lineTo(point.x + width * 0.18, point.y + height * 0.36);
    ctx.closePath();
    ctx.fill();
    if (transform.scale > DETAIL_SCALE && width > 14) {
      ctx.fillStyle = 'rgba(188,229,238,.75)';
      const windowSize = clamp(transform.scale * 0.12, 2, 6);
      ctx.fillRect(point.x + width * 0.22, point.y + height * 0.53, windowSize, windowSize * 0.75);
      ctx.fillRect(point.x + width * 0.66, point.y + height * 0.53, windowSize, windowSize * 0.75);
    }
  }
}

/**
 * § 5 des Auftrags: „Die 2D Stadtarbeit-Karte muss besonders zeigen … Lager,
 * Häfen, Produktionsgebäude." Die Auswahl ist config-getrieben (`infraKindOf`).
 */
function drawInfrastructure(
  ctx: CanvasRenderingContext2D,
  game: GameController,
  bounds: Bounds,
  transform: Transform,
) {
  if (transform.scale < OVERVIEW_SCALE) return;
  for (const building of Object.values(game.state.buildings)) {
    if (building.x < bounds.minX - 4 || building.x > bounds.maxX + 2) continue;
    if (building.y < bounds.minY - 4 || building.y > bounds.maxY + 2) continue;
    const definition = game.config.buildings.get(building.defId);
    if (!definition) continue;
    const kind = infraKindOf(definition);
    if (!kind) continue;
    const style = INFRA_STYLE[kind];
    const center = toScreen(building.x + definition.size.w / 2, building.y + definition.size.h / 2, transform);
    const radius = clamp(transform.scale * 0.42, 7, 17);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.55)';
    ctx.shadowBlur = 7;
    ctx.fillStyle = 'rgba(6,24,32,.92)';
    ctx.beginPath();
    ctx.arc(center.x, center.y - radius * 1.5, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = style.color;
    ctx.lineWidth = Math.max(1.5, radius * 0.18);
    ctx.beginPath();
    ctx.arc(center.x, center.y - radius * 1.5, radius, 0, Math.PI * 2);
    ctx.stroke();
    drawInfraGlyph(ctx, kind, center.x, center.y - radius * 1.5, radius * 0.52, style.color);
  }
}

function drawInfraGlyph(
  ctx: CanvasRenderingContext2D,
  kind: InfraKind,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.2, size * 0.3);
  ctx.beginPath();
  if (kind === 'harbour') {
    // Anker: Schaft, Querbalken, Haken.
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size * 0.7);
    ctx.moveTo(x - size * 0.7, y - size * 0.35);
    ctx.lineTo(x + size * 0.7, y - size * 0.35);
    ctx.moveTo(x - size * 0.75, y + size * 0.2);
    ctx.quadraticCurveTo(x, y + size * 1.15, x + size * 0.75, y + size * 0.2);
  } else if (kind === 'operation') {
    // Werk: Schornstein und Halle.
    ctx.moveTo(x - size, y + size * 0.7);
    ctx.lineTo(x - size, y - size * 0.2);
    ctx.lineTo(x, y + size * 0.2);
    ctx.lineTo(x, y - size * 0.2);
    ctx.lineTo(x + size, y + size * 0.2);
    ctx.lineTo(x + size, y + size * 0.7);
    ctx.closePath();
  } else if (kind === 'logistics') {
    // Verteilkreuz.
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
  } else {
    // Lagerkiste.
    ctx.rect(x - size * 0.85, y - size * 0.7, size * 1.7, size * 1.4);
    ctx.moveTo(x - size * 0.85, y - size * 0.15);
    ctx.lineTo(x + size * 0.85, y - size * 0.15);
  }
  ctx.stroke();
}

/** Der automatisch optimierte Weg als „alternative Route" (§5, blau gestrichelt). */
function drawAlternativeRoute(
  ctx: CanvasRenderingContext2D,
  path: readonly { x: number; y: number }[],
  transform: Transform,
) {
  ctx.save();
  ctx.setLineDash([Math.max(6, transform.scale * 0.34), Math.max(5, transform.scale * 0.3)]);
  ctx.strokeStyle = 'rgba(90,166,232,.5)';
  ctx.lineWidth = Math.max(3, transform.scale * 0.2);
  ctx.lineCap = 'round';
  ctx.beginPath();
  path.forEach((point, index) => {
    const screen = toScreen(point.x + 0.5, point.y + 0.5, transform);
    if (index === 0) ctx.moveTo(screen.x, screen.y);
    else ctx.lineTo(screen.x, screen.y);
  });
  ctx.stroke();
  ctx.restore();
}

/** Bereits gefahrene Strecke (§5) — die eigene Spur, hell und ohne Pfeile. */
function drawTrail(
  ctx: CanvasRenderingContext2D,
  trail: readonly { x: number; y: number }[],
  transform: Transform,
) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 226, 150, .34)';
  ctx.lineWidth = Math.max(3, transform.scale * 0.24);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  trail.forEach((point, index) => {
    const screen = toScreen(point.x, point.y, transform);
    if (index === 0) ctx.moveTo(screen.x, screen.y);
    else ctx.lineTo(screen.x, screen.y);
  });
  ctx.stroke();
  ctx.restore();
}

function drawRoute(
  ctx: CanvasRenderingContext2D,
  path: readonly { x: number; y: number }[],
  cargoStops: readonly CargoRouteStop[] | undefined,
  transform: Transform,
  phase: number,
  complete: boolean,
) {
  if (path.length < 2) return;
  const stops = [...(cargoStops ?? [])].sort((a, b) => a.pathIndex - b.pathIndex);
  for (let index = 1; index < path.length; index += 1) {
    const previous = toScreen(path[index - 1]!.x + 0.5, path[index - 1]!.y + 0.5, transform);
    const current = toScreen(path[index]!.x + 0.5, path[index]!.y + 0.5, transform);
    const lastStop = [...stops].reverse().find((stop) => stop.pathIndex < index);
    const nextStop = stops.find((stop) => stop.pathIndex >= index);
    const emptyReturn = lastStop?.cargoAfter === 0 && nextStop?.type === 'resupply';
    const afterReload = lastStop?.type === 'resupply';
    const color = emptyReturn ? '#e65f4e' : afterReload ? '#f0a42e' : complete ? '#5bd88a' : '#4bc8d1';
    ctx.beginPath(); ctx.moveTo(previous.x, previous.y); ctx.lineTo(current.x, current.y);
    ctx.strokeStyle = emptyReturn ? 'rgba(224,67,48,.3)' : 'rgba(43,226,213,.25)';
    ctx.lineWidth = Math.max(12, transform.scale * (complete ? 0.76 : 0.64));
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(previous.x, previous.y); ctx.lineTo(current.x, current.y);
    if (emptyReturn) ctx.setLineDash([Math.max(8, transform.scale * 0.4), Math.max(5, transform.scale * 0.28)]);
    ctx.lineDashOffset = -phase;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(5, transform.scale * (complete ? 0.42 : 0.34));
    ctx.stroke();
    ctx.setLineDash([]);
    if (index % 5 === 0 && transform.scale > 11) drawDirectionArrow(ctx, previous, current, color, Math.max(4, transform.scale * 0.22));
  }
}

function drawDirectionArrow(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  color: string,
  size: number,
) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const x = (from.x + to.x) / 2;
  const y = (from.y + to.y) / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.65, size * 0.62);
  ctx.lineTo(-size * 0.25, 0);
  ctx.lineTo(-size * 0.65, -size * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawImageMarker(
  ctx: CanvasRenderingContext2D,
  anchor: { x: number; y: number },
  image: HTMLImageElement | undefined,
  color: string,
  title: string,
  subtitle: string,
  order: number | undefined,
  transform: Transform,
) {
  const point = toScreen(anchor.x + 0.5, anchor.y + 0.5, transform);
  const size = clamp(transform.scale * 1.45, 38, 72);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.58)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  if (image) {
    ctx.drawImage(image, point.x - size / 2, point.y - size * 0.86, size, size);
  } else {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y - size * 0.35, size * 0.34, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  if (order !== undefined) {
    ctx.fillStyle = '#06202b';
    ctx.beginPath();
    ctx.arc(point.x + size * 0.34, point.y - size * 0.72, size * 0.19, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = `900 ${clamp(size * 0.2, 12, 16)}px Inter, system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(order), point.x + size * 0.34, point.y - size * 0.72);
  }
  if (transform.scale > 9) drawMarkerLabel(ctx, point.x, point.y + size * 0.08, title, subtitle, color);
}

function drawMarkerLabel(ctx: CanvasRenderingContext2D, x: number, y: number, title: string, subtitle: string, color: string) {
  ctx.font = '800 13px Inter, system-ui';
  const width = Math.max(ctx.measureText(title).width, ctx.measureText(subtitle).width) + 24;
  const left = x - width / 2;
  ctx.fillStyle = 'rgba(3,18,27,.92)';
  roundedRect(ctx, left, y, width, 39, 8);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#f6f8f4';
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(title, x, y + 16);
  ctx.font = '700 12px Inter, system-ui';
  ctx.fillStyle = '#9cb2bc';
  ctx.fillText(subtitle, x, y + 31);
}

function drawMarkerBadge(
  ctx: CanvasRenderingContext2D,
  anchor: { x: number; y: number },
  image: HTMLImageElement | undefined,
  count: number,
  transform: Transform,
) {
  const point = toScreen(anchor.x + 0.5, anchor.y + 0.5, transform);
  const size = clamp(transform.scale * 0.64, 24, 34);
  const x = point.x - size * 1.1;
  const y = point.y - size * 1.4;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.6)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = 'rgba(4,24,34,.94)';
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size * 0.58, 0, Math.PI * 2);
  ctx.fill();
  if (image) ctx.drawImage(image, x, y, size, size);
  else {
    ctx.fillStyle = '#ef9e2b';
    ctx.font = `900 ${Math.max(12, size * 0.45)}px Inter, system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↻', x + size / 2, y + size / 2);
  }
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = '900 12px Inter, system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(count), x + size * 0.9, y + size * 0.9);
}

function drawRoadLinks(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  x: number,
  y: number,
  roads: ReadonlyMap<string, BuildingInstance>,
  transform: Transform,
) {
  for (const [dx, dy] of [[1, 0], [0, 1]] as const) {
    if (!roads.has(`${x + dx},${y + dy}`)) continue;
    const neighbour = toScreen(x + dx + 0.5, y + dy + 0.5, transform);
    ctx.beginPath(); ctx.moveTo(center.x, center.y); ctx.lineTo(neighbour.x, neighbour.y); ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(center.x, center.y, Math.max(1, ctx.lineWidth / 2), 0, Math.PI * 2);
  ctx.fillStyle = ctx.strokeStyle as string;
  ctx.fill();
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
