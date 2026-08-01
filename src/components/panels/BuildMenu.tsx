import { Anchor, Check, ChevronDown, Clock, Hammer, Lock, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import type { GameController } from '../../game/commands/controller.ts';
import type { BuildingDef } from '../../game/config/types.ts';
import type { BuildingCategory, NeedId, ResourceId } from '../../game/types.ts';
import { formatGameDuration, formatMoney, t } from '../../i18n/index.ts';
import { useGame, useUiStore } from '../../state/store.ts';
import { BuildingArt, CategoryArt } from '../art/index.ts';
import { ResourceIcon } from '../common/icons.tsx';
import { useEscapeClose } from '../common/useEscapeClose.ts';

type BuildCategorySelection = 'recommended' | BuildingCategory;

const CATEGORY_ORDER: BuildingCategory[] = [
  'roads',
  'residential',
  'production',
  'services',
  'energy',
  'economy',
  'leisure',
  'government',
  'infrastructure',
  'decoration',
  'special',
];

/**
 * The four everyday decisions stay one click away. Less frequent categories
 * remain fully accessible through one compact selector instead of competing
 * with eleven permanently visible tabs.
 */
const PRIMARY_CATEGORIES: BuildingCategory[] = ['roads', 'residential', 'production', 'services'];

const NEED_CATEGORY: Partial<Record<NeedId, BuildingCategory>> = {
  housing: 'residential',
  water: 'services',
  food: 'services',
  work: 'economy',
  leisure: 'leisure',
  safety: 'services',
  health: 'services',
  energy: 'energy',
};

interface BuildAvailability {
  cost: Partial<Record<ResourceId, number>>;
  locked: boolean;
  affordable: boolean;
  uniqueBuilt: boolean;
  limitReached: boolean;
  limit?: { count: number; max: number; nextLevel?: number | undefined };
  firstFree: boolean;
  isNew: boolean;
  canBuild: boolean;
}

/**
 * Active-Simplicity catalog: choose a building first, then use one unambiguous
 * placement CTA. Merely inspecting a card never starts placement.
 */
export function BuildMenu() {
  const game = useGame();
  const { startPlacing, setPanel } = useUiStore();
  useEscapeClose(() => setPanel(undefined));
  const [category, setCategory] = useState<BuildCategorySelection>('recommended');
  const [inspectedId, setInspectedId] = useState<string>();
  const level = game.state.level.current;

  const candidates = game.config.buildingList.filter((building) => building.buildable !== false);
  const nonEmpty = new Set(candidates.map((building) => building.category));
  const tabs = CATEGORY_ORDER.filter((candidate) => nonEmpty.has(candidate));
  const primaryTabs = PRIMARY_CATEGORIES.filter((candidate) => nonEmpty.has(candidate));
  const secondaryTabs = tabs.filter((candidate) => !primaryTabs.includes(candidate));

  const newCategories = new Set<BuildingCategory>();
  for (const building of candidates) {
    if (game.isNewBuilding(building.id)) newCategories.add(building.category);
  }
  const problemCategories = new Set<BuildingCategory>();
  for (const need of game.config.needs) {
    if (need.unlockLevel > level || game.state.citizens.population <= 0) continue;
    if (game.state.citizens.needs[need.id].fulfillment < 0.6) {
      const matchingCategory = NEED_CATEGORY[need.id];
      if (matchingCategory) problemCategories.add(matchingCategory);
    }
  }

  const recommended = [...candidates]
    .sort(
      (a, b) =>
        Number(a.unlockLevel > level) - Number(b.unlockLevel > level) ||
        recommendationScore(game, b, newCategories, problemCategories) -
          recommendationScore(game, a, newCategories, problemCategories) ||
        a.unlockLevel - b.unlockLevel,
    )
    .slice(0, 8);
  const buildings =
    category === 'recommended'
      ? recommended
      : candidates
          .filter((building) => building.category === category)
          .sort((a, b) => a.unlockLevel - b.unlockLevel);
  const inspected =
    buildings.find((building) => building.id === inspectedId) ??
    buildings.find((building) => building.unlockLevel <= level) ??
    buildings[0];

  const selectCategory = (next: BuildCategorySelection) => {
    setCategory(next);
    setInspectedId(undefined);
  };

  return (
    <section className="panel build-menu as3-build-menu" aria-label={t('ui.build.catalog')}>
      <header className="as3-build-header">
        <div className="as3-build-heading">
          <span className="as3-eyebrow">Bauen</span>
          <h2>{t('ui.build.catalog')}</h2>
          <small>{category === 'recommended' ? 'Passend für deine Stadt' : `${buildings.length} Gebäude`}</small>
        </div>

        <nav className="as3-build-categories" aria-label="Baukategorien">
          <button
            type="button"
            className={category === 'recommended' ? 'active' : ''}
            aria-pressed={category === 'recommended'}
            onClick={() => selectCategory('recommended')}
          >
            <Sparkles size={15} />
            {t('ui.build.recommended')}
          </button>
          {primaryTabs.map((candidate) => (
            <button
              type="button"
              key={candidate}
              className={category === candidate ? 'active' : ''}
              aria-pressed={category === candidate}
              onClick={() => selectCategory(candidate)}
            >
              <CategoryArt id={candidate} px={20} />
              {t(`category.${candidate}`)}
              {newCategories.has(candidate) && <i className="as3-category-signal new" title={t('ui.new_building')} />}
              {problemCategories.has(candidate) && !newCategories.has(candidate) && (
                <i className="as3-category-signal problem" title={t('ui.build_recommended')} />
              )}
            </button>
          ))}
          {secondaryTabs.length > 0 && (
            <label className={`as3-build-more${category !== 'recommended' && secondaryTabs.includes(category) ? ' active' : ''}`}>
              <span className="sr-only">Weitere Baukategorie</span>
              <select
                value={category !== 'recommended' && secondaryTabs.includes(category) ? category : ''}
                onChange={(event) => {
                  if (event.target.value) selectCategory(event.target.value as BuildingCategory);
                }}
              >
                <option value="">Mehr</option>
                {secondaryTabs.map((candidate) => (
                  <option key={candidate} value={candidate}>
                    {t(`category.${candidate}`)}
                    {newCategories.has(candidate) ? ' · Neu' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </label>
          )}
        </nav>

        <button className="as3-icon-button" type="button" onClick={() => setPanel(undefined)} title={t('ui.close')}>
          <X size={18} />
        </button>
      </header>

      <div className="as3-build-grid" aria-label={`${buildings.length} Gebäude`}>
        {buildings.map((def) => (
          <BuildCard
            key={def.id}
            def={def}
            selected={inspected?.id === def.id}
            onInspect={() => setInspectedId(def.id)}
          />
        ))}
      </div>

      {inspected && (
        <BuildSelection
          def={inspected}
          onBuild={() => startPlacing(inspected.id)}
        />
      )}
    </section>
  );
}

function BuildCard({
  def,
  selected,
  onInspect,
}: {
  def: BuildingDef;
  selected: boolean;
  onInspect(): void;
}) {
  const game = useGame();
  const availability = buildAvailability(game, def);
  const footprint = def.waterfront
    ? `${def.waterfront.landWidth}×${def.waterfront.landDepth}`
    : `${def.size.w}×${def.size.h}`;
  const summary = effectSummary(def);

  return (
    <button
      type="button"
      className={`as3-build-card${selected ? ' selected' : ''}${availability.locked ? ' locked' : ''}`}
      aria-pressed={selected}
      onClick={onInspect}
    >
      <span className="as3-build-card-art">
        <BuildingArt id={def.id} category={def.category} px={126} />
        <span className="as3-build-footprint">{footprint}</span>
        {availability.isNew && <span className="as3-build-badge">Neu</span>}
        {availability.locked && (
          <span className="as3-build-lock">
            <Lock size={13} />
            Level {def.unlockLevel}
          </span>
        )}
        {selected && (
          <span className="as3-build-selected">
            <Check size={13} />
          </span>
        )}
      </span>

      <span className="as3-build-card-copy">
        <strong>{t(def.nameKey)}</strong>
        <span className="as3-build-card-cost">
          {Object.entries(availability.cost).map(([resource, amount]) => (
            <span
              key={resource}
              className={game.state.resources[resource as ResourceId] < (amount ?? 0) ? 'missing' : ''}
            >
              <ResourceIcon id={resource as ResourceId} size={13} />
              {resource === 'money' ? formatMoney(amount ?? 0) : amount}
            </span>
          ))}
          {def.constructionSec > 0 && (
            <span>
              <Clock size={12} />
              {formatGameDuration(def.constructionSec * 1000)}
            </span>
          )}
        </span>
        {summary && <small>{summary}</small>}
      </span>
    </button>
  );
}

function BuildSelection({ def, onBuild }: { def: BuildingDef; onBuild(): void }) {
  const game = useGame();
  const availability = buildAvailability(game, def);
  const reason = unavailableReason(def, availability);
  const footprint = def.waterfront
    ? `${def.waterfront.landWidth}×${def.waterfront.landDepth} Land`
    : `${def.size.w}×${def.size.h}`;
  const decisionFacts = [
    footprint,
    def.constructionSec > 0 ? formatGameDuration(def.constructionSec * 1000) : undefined,
    def.locationBonus ? `bis +${def.locationBonus.maxPct}% Standort` : undefined,
    availability.limit ? `Limit ${availability.limit.count}/${availability.limit.max}` : undefined,
  ].filter((value): value is string => Boolean(value));

  return (
    <footer className="as3-build-selection" aria-live="polite">
      <span className="as3-build-selection-art">
        <BuildingArt id={def.id} category={def.category} px={72} />
      </span>
      <span className="as3-build-selection-copy">
        <small>Ausgewählt</small>
        <strong>{t(def.nameKey)}</strong>
        <span>{reason ?? effectSummary(def) ?? t('ui.build.site_hint')}</span>
        <span className="as3-build-selection-meta">
          {decisionFacts.map((fact) => (
            <span key={fact}>{fact}</span>
          ))}
        </span>
      </span>
      {def.waterfront && (
        <span className="as3-build-selection-note">
          <Anchor size={15} />
          Küstenplatzierung
        </span>
      )}
      <span className="as3-build-selection-cost">
        {Object.entries(availability.cost).map(([resource, amount]) => (
          <span key={resource}>
            <ResourceIcon id={resource as ResourceId} size={15} />
            {resource === 'money' ? formatMoney(amount ?? 0) : amount}
          </span>
        ))}
      </span>
      <button
        type="button"
        className="as3-primary-button"
        disabled={!availability.canBuild}
        onClick={onBuild}
      >
        {availability.locked ? <Lock size={16} /> : <Hammer size={16} />}
        {availability.locked ? `Ab Level ${def.unlockLevel}` : 'Platzieren'}
      </button>
    </footer>
  );
}

function buildAvailability(game: GameController, def: BuildingDef): BuildAvailability {
  const cost = game.getBuildCost(def.id);
  const locked = def.unlockLevel > game.state.level.current;
  const affordable = game.canAffordCost(cost);
  const uniqueBuilt = Boolean(
    def.unique && Object.values(game.state.buildings).some((building) => building.defId === def.id),
  );
  const limit = game.getBuildLimit(def.id);
  const limitReached = Boolean(limit && limit.count >= limit.max);
  const firstFree = game.isFirstBuildDiscount(def.id);
  const isNew = !locked && game.isNewBuilding(def.id);
  return {
    cost,
    locked,
    affordable,
    uniqueBuilt,
    limitReached,
    ...(limit ? { limit } : {}),
    firstFree,
    isNew,
    canBuild: !locked && affordable && !uniqueBuilt && !limitReached,
  };
}

function unavailableReason(def: BuildingDef, availability: BuildAvailability): string | undefined {
  if (availability.locked) return `Wird mit Stadtlevel ${def.unlockLevel} freigeschaltet.`;
  if (availability.uniqueBuilt) return 'Dieses einzigartige Gebäude steht bereits.';
  if (availability.limitReached) {
    return availability.limit?.nextLevel
      ? `Baulimit erreicht · mehr ab Level ${availability.limit.nextLevel}.`
      : 'Baulimit erreicht.';
  }
  if (!availability.affordable) return 'Für den Bau fehlen noch Ressourcen.';
  if (availability.firstFree) return 'Der erste Bau erhält den Startbonus.';
  return undefined;
}

function recommendationScore(
  game: GameController,
  def: BuildingDef,
  newCategories: Set<BuildingCategory>,
  problemCategories: Set<BuildingCategory>,
): number {
  const built = Object.values(game.state.buildings).some((building) => building.defId === def.id);
  return (
    (newCategories.has(def.category) && game.isNewBuilding(def.id) ? 100 : 0) +
    (problemCategories.has(def.category) ? 70 : 0) +
    (!built ? 25 : 0) +
    Math.max(0, 20 - def.unlockLevel)
  );
}

/** One card gets one promise. Full effect lists belong to building details. */
function effectSummary(def: BuildingDef): string {
  if (def.operation) return 'Dauerbetrieb mit einstellbarem Arbeitsgebiet';
  for (const effect of def.effects) {
    switch (effect.type) {
      case 'produce':
        return `+${effect.perMinute} ${t(`resource.${effect.resource}`)}/min`;
      case 'housing':
        return `${effect.units * effect.maxResidentsPerUnit} Bewohner`;
      case 'revenue':
        return `+${formatMoney(effect.perMinute)} Einnahmen/min`;
      case 'capacity':
        return `+${effect.amount} ${t(`need.${effect.need}`)}`;
      case 'coverage':
        return `${t(`need.${effect.need}`)} · ${effect.radius} Felder`;
      case 'storage':
        return `+${effect.amount} Lager`;
      case 'jobs':
        return `+${effect.amount} Arbeitsplätze`;
      case 'distribution':
        return `${t(`need.${effect.need}`)} verteilen · ${effect.radius} Felder`;
      case 'protection':
        return `Schutzradius · ${effect.radius} Felder`;
      case 'ambience':
        if (effect.amount > 0) return `Umgebung +${effect.amount}`;
        break;
      case 'logistics':
        return `Logistik +${effect.boostPct}%`;
      case 'upkeep':
        return `${formatMoney(effect.perMinute)} Unterhalt/min`;
      case 'demand':
        break;
    }
  }
  return '';
}
