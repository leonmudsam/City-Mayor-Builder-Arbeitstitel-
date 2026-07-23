import { useEffect, useState } from 'react';
import { Anchor, Clock, Hammer, Lock, Sparkles, X } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import type { BuildingCategory, NeedId, ResourceId } from '../../game/types.ts';
import type { BuildingDef } from '../../game/config/types.ts';
import { formatMoney, t } from '../../i18n/index.ts';
import { ResourceIcon } from '../common/icons.tsx';
import { BuildingArt, CategoryArt } from '../art/index.ts';

type BuildCategorySelection = 'recommended' | BuildingCategory;

// Full tab order (§19). Previously `infrastructure` and the new `energy`
// category were missing, so the coal plant / wind farm never appeared anywhere
// — now every category a building can belong to has a tab. Empty tabs are
// hidden below, so players only see categories that actually hold something.
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

// Which build category best answers a struggling need (§8 problem badge on tabs).
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

export function BuildMenu() {
  const game = useGame();
  const { startPlacing, setPanel } = useUiStore();
  const [category, setCategory] = useState<BuildCategorySelection>('recommended');
  const [inspectedId, setInspectedId] = useState<string>();
  const level = game.state.level.current;

  // Only show tabs that actually hold at least one buildable building, so the
  // added infrastructure/special tabs don't appear empty (§19).
  const nonEmpty = new Set(game.config.buildingList.filter((b) => b.buildable !== false).map((b) => b.category));
  const tabs = CATEGORY_ORDER.filter((cat) => nonEmpty.has(cat));

  // Categories that hold a freshly-unlocked building ("Neu" dot) or that would
  // fix a struggling need ("!" dot) — computed once, shown on the tabs.
  const newCategories = new Set<BuildingCategory>();
  for (const b of game.config.buildingList) if (game.isNewBuilding(b.id)) newCategories.add(b.category);
  const problemCategories = new Set<BuildingCategory>();
  for (const need of game.config.needs) {
    if (need.unlockLevel > level || game.state.citizens.population <= 0) continue;
    if (game.state.citizens.needs[need.id].fulfillment < 0.6) {
      const cat = NEED_CATEGORY[need.id];
      if (cat) problemCategories.add(cat);
    }
  }

  const candidates = game.config.buildingList.filter((building) => building.buildable !== false);
  const recommended = candidates
    .sort(
      (a, b) =>
        Number(a.unlockLevel > level) - Number(b.unlockLevel > level) ||
        recommendationScore(b) - recommendationScore(a) ||
        a.unlockLevel - b.unlockLevel,
    )
    .slice(0, 8);
  const buildings =
    category === 'recommended'
      ? recommended
      : candidates.filter((building) => building.category === category).sort((a, b) => a.unlockLevel - b.unlockLevel);
  const inspected = game.config.buildings.get(
    buildings.some((building) => building.id === inspectedId) ? inspectedId! : buildings[0]?.id ?? '',
  );
  const [previewStage, setPreviewStage] = useState(0);
  useEffect(() => setPreviewStage(0), [inspected?.id]);

  function recommendationScore(def: BuildingDef): number {
    const built = Object.values(game.state.buildings).some((building) => building.defId === def.id);
    return (
      (newCategories.has(def.category) && game.isNewBuilding(def.id) ? 100 : 0) +
      (problemCategories.has(def.category) ? 70 : 0) +
      (!built ? 25 : 0) +
      Math.max(0, 20 - def.unlockLevel)
    );
  }

  return (
    <div className="panel build-menu">
      <div className="build-menu-head">
        <div className="build-menu-title">
          <span>{t('ui.build.catalog')}</span>
          <small>{buildings.length} Gebäude</small>
        </div>
        <div className="build-tabs">
          <button
            className={`btn-tab${category === 'recommended' ? ' active' : ''}`}
            onClick={() => setCategory('recommended')}
          >
            <Sparkles size={19} />
            <span>{t('ui.build.recommended')}</span>
          </button>
          {tabs.map((cat) => (
            <button
              key={cat}
              className={`btn-tab${category === cat ? ' active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              <CategoryArt id={cat} px={26} />
              <span>{t(`category.${cat}`)}</span>
              {newCategories.has(cat) && <span className="tab-dot new" title={t('ui.new_building')} />}
              {problemCategories.has(cat) && !newCategories.has(cat) && (
                <span className="tab-dot problem" title={t('ui.build_recommended')} />
              )}
            </button>
          ))}
        </div>
        <button className="btn-icon" onClick={() => setPanel(undefined)} title={t('ui.close')}>
          <X size={18} />
        </button>
      </div>
      <div className="build-menu-body">
        <div className="build-cards">
          {buildings.map((def) => (
            <BuildCard
              key={def.id}
              def={def}
              locked={def.unlockLevel > level}
              onInspect={() => setInspectedId(def.id)}
              onPick={() => startPlacing(def.id)}
            />
          ))}
          {category !== 'recommended' &&
            Array.from({ length: Math.max(0, 4 - buildings.length) }).map((_, i) => (
              <div key={`filler-${i}`} className="build-card build-card-filler" aria-hidden="true">
                <div className="build-card-filler-art">
                  <CategoryArt id={category} px={44} />
                </div>
                <span className="build-card-filler-text">{t('ui.build.more_coming')}</span>
              </div>
            ))}
        </div>
        {inspected && (
          <aside className="build-menu-preview">
            <span>{t('ui.build.preview')}</span>
            <div className="build-preview-art">
              <BuildingArt id={inspected.id} category={inspected.category} px={224} stage={previewStage} />
            </div>
            <h3>{t(inspected.nameKey)}</h3>
            <div className="build-preview-meta">
              <span>{t(`category.${inspected.category}`)}</span>
              <b>{inspected.waterfront
                ? `${inspected.waterfront.landWidth}×${inspected.waterfront.landDepth}`
                : `${inspected.size.w}×${inspected.size.h}`}</b>
            </div>
            <p>{effectSummary(inspected) || t('ui.build.site_hint')}</p>
            {inspected.waterfront && (
              <div className="build-preview-bonus">
                <Anchor size={14} />
                {t('ui.build.waterfront_requirement', {
                  land: `${inspected.waterfront.landWidth}×${inspected.waterfront.landDepth}`,
                  water: `${inspected.waterfront.waterWidth}×${inspected.waterfront.waterDepth}`,
                  depth: inspected.waterfront.minimumWaterDepth,
                })}
              </div>
            )}
            {(inspected.upgrades?.length ?? 0) > 0 && (
              <div className="build-preview-stages" aria-label="Gebäudestufen">
                {Array.from({ length: (inspected.upgrades?.length ?? 0) + 1 }, (_, stage) => (
                  <button
                    key={stage}
                    className={previewStage === stage ? 'active' : ''}
                    onClick={() => setPreviewStage(stage)}
                    title={`Stufe ${stage + 1}`}
                  >
                    <BuildingArt id={inspected.id} category={inspected.category} px={48} stage={stage} />
                    <span>{stage + 1}</span>
                  </button>
                ))}
              </div>
            )}
            {inspected.locationBonus && (
              <div className="build-preview-bonus">
                <Sparkles size={14} />
                {t('ui.location_bonus_hint', { terrain: t(`terrain.${inspected.locationBonus.terrain}`) })}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

function BuildCard({
  def,
  locked,
  onInspect,
  onPick,
}: {
  def: BuildingDef;
  locked: boolean;
  onInspect(): void;
  onPick(): void;
}) {
  const game = useGame();
  // The price actually charged for the next copy (escalating costs, §7).
  const cost = game.getBuildCost(def.id);
  const affordable = game.canAffordCost(cost);
  const uniqueBuilt = def.unique && Object.values(game.state.buildings).some((b) => b.defId === def.id);
  const limit = game.getBuildLimit(def.id);
  const limitReached = limit ? limit.count >= limit.max : false;
  const disabled = locked || !affordable || Boolean(uniqueBuilt) || limitReached;
  // Big public buildings / infrastructure read as investments, not impulse buys.
  const major = game.isMajorProject(def.id);
  // When a major project is merely unaffordable, explain how to get there
  // instead of a bare "too little money" (§11): show current vs. recommended
  // steady net income.
  const scaled = def.costScaling !== undefined && limit !== undefined && limit.count > 0;
  // First-build discount active (§3): the first ever copy is free/cheap.
  const firstFree = game.isFirstBuildDiscount(def.id);
  // Freshly unlocked this level and not built yet (§7): a "Neu" badge.
  const isNew = !locked && game.isNewBuilding(def.id);

  // The single most important secondary effect, as a short capacity/output line.
  const highlight = effectSummary(def);

  return (
    <button
      className={`build-card${disabled ? ' disabled' : ''}${locked ? ' locked' : ''}${major ? ' major' : ''}`}
      onClick={onPick}
      onMouseEnter={onInspect}
      onFocus={onInspect}
      disabled={disabled}
    >
      {/* Zone 1 — media: big thumbnail, footprint + new badge in the corners,
          never overlapped by text (text lives in the separate body below). */}
      <div className="build-card-media">
        <BuildingArt id={def.id} category={def.category} px={128} />
        <span className="build-card-size">{def.waterfront
          ? `${def.waterfront.landWidth}×${def.waterfront.landDepth}`
          : `${def.size.w}×${def.size.h}`}</span>
        {isNew && <span className="build-card-new">{t('ui.new')}</span>}
        {major && <span className="build-card-badge major">{t('ui.major_project')}</span>}
        {firstFree && !locked && <span className="build-card-badge free">{t('ui.first_build_free')}</span>}
      </div>

      <div className="build-card-body">
        {/* Zone 2 — title */}
        <div className="build-card-name">{t(def.nameKey)}</div>

        {/* Zone 3 — key values */}
        <div className="build-card-info">
          {Object.entries(cost).map(([res, amount]) => (
            <span
              key={res}
              className={`chip${game.state.resources[res as ResourceId] < (amount ?? 0) ? ' cost-missing' : ''}`}
            >
              <ResourceIcon id={res as ResourceId} size={13} />
              {res === 'money' ? formatMoney(amount ?? 0) : amount}
            </span>
          ))}
          {def.constructionSec > 0 && (
            <span className="chip">
              <Clock size={13} />
              {def.constructionSec}s
            </span>
          )}
        </div>
        {highlight && <div className="build-card-effect">{highlight}</div>}
        {def.waterfront && (
          <div className="build-card-bonus">
            <Anchor size={12} />
            {t('ui.build.water_footprint', {
              width: def.waterfront.waterWidth,
              depth: def.waterfront.waterDepth,
              minimum: def.waterfront.minimumWaterDepth,
            })}
          </div>
        )}
        {def.locationBonus && (
          <div className="build-card-bonus">
            <Sparkles size={12} />
            {t('ui.location_bonus_hint', { terrain: t(`terrain.${def.locationBonus.terrain}`) })}
          </div>
        )}

        {/* Zone 4 — status */}
        <div className="build-card-status">
          {locked ? (
            <span className="build-card-lock">
              <Lock size={12} />
              {t('ui.locked_at', { level: def.unlockLevel })}
            </span>
          ) : uniqueBuilt ? (
            <span className="build-card-lock">{t('error.unique_exists')}</span>
          ) : limit ? (
            <span className={`build-card-limit${limitReached ? ' reached' : ''}`}>
              {t('ui.limit.count', { count: limit.count, max: limit.max })}
              {limitReached && limit.nextLevel !== undefined && ` · ${t('ui.limit.more_at', { level: limit.nextLevel })}`}
            </span>
          ) : (
            <span className="build-card-ready">{t('ui.status.unlocked')}</span>
          )}
          {scaled && <span className="build-card-scaled">{t('ui.cost_scaled')}</span>}
        </div>
        {!locked && !affordable && !limitReached && !uniqueBuilt && major && (
          <div className="build-card-invest">
            {t('ui.major_project_hint', {
              current: formatMoney(game.getStableIncome().net),
              recommended: formatMoney(game.recommendedIncomeFor(def.id)),
            })}
          </div>
        )}

        {/* Zone 5 — action */}
        <div className={`build-card-action${disabled ? ' is-disabled' : ''}`}>
          {locked ? (
            <>
              <Lock size={13} /> {t('ui.locked_at', { level: def.unlockLevel })}
            </>
          ) : (
            <>
              <Hammer size={13} /> {t('ui.build')}
            </>
          )}
        </div>
      </div>
    </button>
  );
}

function effectSummary(def: BuildingDef): string {
  const parts: string[] = [];
  for (const eff of def.effects) {
    switch (eff.type) {
      case 'produce':
        parts.push(`+${eff.perMinute} ${t(`resource.${eff.resource}`)}/min`);
        break;
      case 'housing':
        parts.push(`${eff.units} ${t('ui.housing.units')} · ${eff.units * eff.maxResidentsPerUnit} ${t('need.housing')}`);
        break;
      case 'revenue':
        parts.push(`+${formatMoney(eff.perMinute)} ${t('resource.money')}/min`);
        break;
      case 'capacity':
        parts.push(
          eff.radius !== undefined
            ? `+${eff.amount} ${t(`need.${eff.need}`)} (${t('ui.radius')} ${eff.radius})`
            : `+${eff.amount} ${t(`need.${eff.need}`)}`,
        );
        break;
      case 'coverage':
        parts.push(`${t(`need.${eff.need}`)} (${t('ui.radius')} ${eff.radius})`);
        break;
      case 'storage':
        parts.push(`+${eff.amount} ${t('ui.storage')}`);
        break;
      case 'jobs':
        parts.push(`+${eff.amount} ${t('ui.jobs')}`);
        break;
      case 'distribution':
        parts.push(t('ui.effect.distribution', { need: t(`need.${eff.need}`), radius: eff.radius }));
        break;
      case 'protection':
        parts.push(t('ui.effect.protection', { radius: eff.radius }));
        break;
      case 'ambience':
        if (eff.amount > 0) parts.push(`${t('ui.ambience')} +${eff.amount}`);
        break;
      case 'logistics':
        parts.push(t('ui.effect.logistics', { boost: eff.boostPct, radius: eff.radius }));
        break;
      case 'upkeep':
        parts.push(t('ui.effect.upkeep', { amount: formatMoney(eff.perMinute) }));
        break;
      case 'demand':
        break;
    }
  }
  return [...new Set(parts)].join(' · ');
}
