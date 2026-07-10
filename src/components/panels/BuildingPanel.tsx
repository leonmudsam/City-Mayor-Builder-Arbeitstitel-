import { ArrowUp, PackagePlus, Trash2, X } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { effectiveEffects } from '../../game/buildings/effects.ts';
import { formatDuration, t } from '../../i18n/index.ts';

export function BuildingPanel() {
  const game = useGame();
  const { selectedBuildingId, selectBuilding, pushToast } = useUiStore();
  if (!selectedBuildingId) return null;
  const b = game.state.buildings[selectedBuildingId];
  const def = b && game.config.buildings.get(b.defId);
  if (!b || !def) return null;

  const produce = effectiveEffects(def, b.upgradeLevel).find((e) => e.type === 'produce');
  const nextUpgrade = def.upgrades?.[b.upgradeLevel];
  const now = game.state.meta.lastSimTime;

  return (
    <aside className="panel side-panel">
      <div className="panel-head">
        <h3>
          {t(def.nameKey)}
          {b.upgradeLevel > 0 && ` ${'I'.repeat(b.upgradeLevel + 1)}`}
        </h3>
        <button className="btn-icon" onClick={() => selectBuilding(undefined)} title={t('ui.close')}>
          <X size={16} />
        </button>
      </div>

      {b.status === 'constructing' && b.constructionEndsAt !== undefined && (
        <p className="muted">
          {t('ui.construction')} — {t('ui.ready_in', { time: formatDuration(b.constructionEndsAt - now) })}
        </p>
      )}
      {b.status === 'paused' && <p className="text-bad">{t('message.fire', { building: def.nameKey })}</p>}

      <ul className="effect-list">
        {effectiveEffects(def, b.upgradeLevel).map((eff, i) => (
          <li key={i}>{describeEffect(eff)}</li>
        ))}
      </ul>

      {produce && produce.type === 'produce' && b.status === 'active' && (
        <button
          className="btn-primary"
          disabled={Math.floor(b.buffer) < 1}
          onClick={() => {
            const result = game.collectYield(b.id);
            if (!result.ok) pushToast(t('error.generic'), 'error');
          }}
        >
          <PackagePlus size={16} />
          {t('ui.collect')} ({Math.floor(b.buffer)}/{produce.bufferCap})
        </button>
      )}

      {nextUpgrade && b.status === 'active' && (
        <button
          className="btn-secondary"
          disabled={!game.canAffordCost(nextUpgrade.cost)}
          onClick={() => {
            const result = game.upgradeBuilding(b.id);
            if (!result.ok) pushToast(t(`error.${result.error}`), 'error');
          }}
        >
          <ArrowUp size={16} />
          {t('ui.upgrade')} (
          {Object.entries(nextUpgrade.cost)
            .map(([res, amount]) => `${amount} ${t(`resource.${res}`)}`)
            .join(', ')}
          )
        </button>
      )}

      {!def.unique && (
        <button
          className="btn-danger"
          onClick={() => {
            if (window.confirm(t('ui.demolish.confirm'))) {
              game.demolishBuilding(b.id);
              selectBuilding(undefined);
            }
          }}
        >
          <Trash2 size={16} />
          {t('ui.demolish')}
        </button>
      )}
    </aside>
  );
}

function describeEffect(eff: ReturnType<typeof effectiveEffects>[number]): string {
  switch (eff.type) {
    case 'produce':
      return `${t('ui.provides')}: ${eff.perMinute} ${t(`resource.${eff.resource}`)}/min`;
    case 'capacity':
      return `${t('ui.provides')}: ${eff.amount} ${t(`need.${eff.need}`)}`;
    case 'coverage':
      return `${t(`need.${eff.need}`)} im Radius ${eff.radius}`;
    case 'storage':
      return `+${eff.amount} Lager (${t(`resource.${eff.resource}`)})`;
    case 'jobs':
      return `${eff.amount} ${t('ui.jobs')}`;
    case 'distribution':
      return `Verteilt ${t(`need.${eff.need}`)} in der Stadt`;
    case 'protection':
      return `Brandschutz im Radius ${eff.radius}`;
  }
}
