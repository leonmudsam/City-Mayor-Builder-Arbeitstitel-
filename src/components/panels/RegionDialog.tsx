import { ArrowDownRight, ArrowUpRight, Building2, Lock, Ruler, Waves, X } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { formatMoney, t } from '../../i18n/index.ts';
import { eventImage, uiImage } from '../../assets/registry.ts';

/** Vor-/Nachteil-Zeile aus einem Faktor (>1 Vorteil, <1 Nachteil). `invert`
 *  dreht die Wertung um (Straßenkosten: hoher Faktor = Nachteil). */
type CharacterRow = { key: string; pct: number; good: boolean };

function buildCharacter(
  mods: Partial<Record<string, number>> | undefined,
  roadCostFactor: number | undefined,
): CharacterRow[] {
  const rows: CharacterRow[] = [];
  for (const [key, factor] of Object.entries(mods ?? {})) {
    if (factor === undefined || factor === 1) continue;
    rows.push({ key: `ui.region.mod.${key}`, pct: Math.round((factor - 1) * 100), good: factor > 1 });
  }
  if (roadCostFactor !== undefined && roadCostFactor !== 1) {
    // Höhere Straßenkosten sind ein NACHTEIL, obwohl der Faktor > 1 ist.
    rows.push({ key: 'ui.region.mod.roadCost', pct: Math.round((roadCostFactor - 1) * 100), good: false });
  }
  // Vorteile zuerst, dann Nachteile — schnelle Lesbarkeit vor dem Kauf.
  return rows.sort((a, b) => Number(b.good) - Number(a.good));
}

/**
 * Landschaft-erschließen-Dialog (§ Welt 2.0): der Spieler kauft keine Quadrate,
 * sondern benannte Landschaften mit Charakter. Zeigt Name, Biom, Baufläche und
 * — schon VOR der Freischaltung (§5 Auftrag B) — die Vor-/Nachteile
 * (Produktions-Boni, teurere Straßen), damit die Erschließung eine echte
 * strategische Entscheidung ist.
 */
export function RegionDialog() {
  const game = useGame();
  const { regionDialog, openRegionDialog, pushToast, selectBuilding } = useUiStore();
  if (regionDialog === undefined) return null;
  const def = game.config.regions.get(regionDialog);
  if (!def) return null;
  const cost = game.getRegionCost(regionDialog);
  const levelOk = game.state.level.current >= def.unlockLevel;
  const prereqsMissing = (def.prerequisiteRegionIds ?? []).filter(
    (p) => game.state.world.regions[String(p)]?.status !== 'unlocked',
  );
  const affordable = game.canAffordCost({ money: cost });
  // River district: only offered on a locked river landscape at the right level.
  const district = game.canFoundDistrict(regionDialog);
  const districtAffordable = game.canAffordCost(district.cost);
  const heroKey =
    def.biome === 'gebirge' || def.biome === 'huegel'
      ? 'region_unlock_highland'
      : def.biome === 'kueste' || def.biome === 'see' || def.biome === 'insel'
        ? 'region_unlock_coast'
        : def.biome === 'ebene' || def.biome === 'flusstal' || def.biome === 'fruchtbar'
          ? 'region_unlock_fertile'
          : undefined;
  const hero = (heroKey ? uiImage(heroKey) : undefined) ?? eventImage('region_unlock_hero');

  return (
    <div className="dialog-backdrop" onClick={() => openRegionDialog(undefined)}>
      <div className="dialog region-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <h3>
            <Lock size={16} /> {t(def.nameKey)}
          </h3>
          <button className="btn-icon" onClick={() => openRegionDialog(undefined)}>
            <X size={16} />
          </button>
        </div>
        <div className="region-unlock-hero">
          {hero && <img src={hero} alt="" aria-hidden="true" />}
          <div className="region-unlock-hero-shade" />
          <div className="region-unlock-hero-copy">
            <span>{t('ui.region.discovered')}</span>
            <strong>{t(def.nameKey)}</strong>
            <small>{t(`biome.${def.biome}`)}</small>
          </div>
        </div>
        <p className="muted">
          {t(`biome.${def.biome}`)}
          {' · '}
          {def.unlockable
            ? levelOk
              ? t('ui.region.desc')
              : t('ui.region.locked_level', { level: def.unlockLevel })
            : t('ui.region.never_unlockable')}
        </p>
        {prereqsMissing.length > 0 && (
          <p className="muted">
            {t('ui.region.prereqs')}
            {': '}
            {prereqsMissing.map((p) => t(game.config.regions.get(p)?.nameKey ?? '')).join(', ')}
          </p>
        )}

        <div className="region-decision-grid">
          {/* Charakter-Vorschau (§5 Auftrag B): Baufläche + Boni/Nachteile,
              sichtbar BEVOR die Landschaft erschlossen ist. */}
          <div className="region-character">
          <p className="region-character-head">{t('ui.region.character')}</p>
          <p className="region-buildable">
            <Ruler size={14} /> {t('ui.region.buildable_tiles', { count: def.buildableTiles })}
          </p>
          {(() => {
            const rows = buildCharacter(def.productionModifiers, def.roadCostFactor);
            if (rows.length === 0) return <p className="muted">{t('ui.region.no_modifiers')}</p>;
            return (
              <ul className="region-mods">
                {rows.map((r) => (
                  <li key={r.key} className={r.good ? 'region-mod-good' : 'region-mod-bad'}>
                    {r.good ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    <span>{t(r.key)}</span>
                    <span className="region-mod-pct">
                      {r.pct > 0 ? '+' : ''}
                      {r.pct}%
                    </span>
                  </li>
                ))}
              </ul>
            );
          })()}
          </div>
          <section className="region-future-buildings">
            <h4>
              <Building2 size={15} /> {t('ui.region.future_buildings')}
            </h4>
            {/* § C5: begünstigte Gebäude aus dem Regionscharakter (controller.regionPreview). */}
            {(() => {
              const favoured = game.regionPreview(regionDialog)?.favouredBuildings ?? [];
              if (favoured.length === 0) return <p>{t('ui.region.future_buildings_pending')}</p>;
              return (
                <ul className="region-future-list">
                  {favoured.map((fav) => {
                    const bDef = game.config.buildings.get(fav.defId);
                    return (
                      <li key={fav.defId} className="region-future-item">
                        <Building2 size={14} />
                        <span>{bDef ? t(bDef.nameKey) : fav.defId}</span>
                        <span className="region-mod-pct region-mod-good">
                          +{fav.modifierPct}% {t(`resource.${fav.resource}`)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              );
            })()}
          </section>
        </div>
        {def.unlockable && (
          <>
            <p className="sector-price">
              {t('ui.cost')}: {formatMoney(cost)} {t('resource.money')}
            </p>
            <div className="dialog-buttons">
              <button className="btn-secondary" onClick={() => openRegionDialog(undefined)}>
                {t('ui.cancel')}
              </button>
              <button
                className="btn-primary"
                disabled={!levelOk || !affordable || prereqsMissing.length > 0}
                onClick={() => {
                  const result = game.unlockRegion(regionDialog);
                  if (result.ok) {
                    openRegionDialog(undefined);
                    pushToast(t('ui.region.unlocked_title') + ' ✓', 'success');
                  } else {
                    pushToast(t(`error.${result.error}`) ?? t('error.generic'), 'error');
                  }
                }}
              >
                {t('ui.unlock')}
              </button>
            </div>
          </>
        )}

        {district.eligible && (
          <div className="sector-district">
            <p className="sector-district-head">
              <Waves size={15} /> {t('ui.district.title')}
            </p>
            <p className="muted">{t('ui.district.desc')}</p>
            <p className="sector-price">
              {t('ui.cost')}: {formatMoney(district.cost.money ?? 0)} {t('resource.money')}
              {district.cost.wood ? ` · ${district.cost.wood} ${t('resource.wood')}` : ''}
              {district.cost.stone ? ` · ${district.cost.stone} ${t('resource.stone')}` : ''}
            </p>
            <button
              className="btn-primary btn-district"
              disabled={!districtAffordable}
              onClick={() => {
                const result = game.foundDistrict(regionDialog);
                if (result.ok) {
                  openRegionDialog(undefined);
                  selectBuilding(game.state.world.districts['river']?.centerBuildingId);
                  pushToast(t('ui.district.founded'), 'success');
                } else {
                  pushToast(t(`error.${result.error}`) ?? t('error.generic'), 'error');
                }
              }}
            >
              {t('ui.district.found')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
