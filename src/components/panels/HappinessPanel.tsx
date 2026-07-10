import { X } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { t } from '../../i18n/index.ts';

/** The game's most important teaching UI: shows WHAT is missing and how to fix it. */
export function HappinessPanel() {
  const game = useGame();
  const { setPanel, startPlacing } = useUiStore();
  const { state } = game;
  const activeNeeds = game.config.needs.filter((n) => n.unlockLevel <= state.level.current);

  const suggestions: Record<string, string | undefined> = {
    housing: 'house_small',
    water: 'well',
    food: 'farm',
    work: 'shop_small',
    leisure: 'park',
  };

  return (
    <aside className="panel side-panel">
      <div className="panel-head">
        <h3>
          {t('ui.happiness')}: {Math.round(state.citizens.happiness)}/100
        </h3>
        <button className="btn-icon" onClick={() => setPanel(undefined)}>
          <X size={16} />
        </button>
      </div>
      {activeNeeds.map((need) => {
        const ns = state.citizens.needs[need.id];
        const pct = Math.round(ns.fulfillment * 100);
        const suggestion = suggestions[need.id];
        const suggestionDef = suggestion ? game.config.buildings.get(suggestion) : undefined;
        const canBuild = suggestionDef && suggestionDef.unlockLevel <= state.level.current;
        return (
          <div key={need.id} className="need-row">
            <div className="need-head">
              <span>{t(need.nameKey)}</span>
              <span className={pct < 60 ? 'text-bad' : pct < 90 ? 'text-warn' : 'text-good'}>{pct}%</span>
            </div>
            <div className="need-bar">
              <div
                className={`need-bar-fill ${pct < 60 ? 'bad' : pct < 90 ? 'warn' : 'good'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {pct < 90 && (
              <div className="need-hint">
                {t(`ui.needs.hint.${need.id}`)}
                {canBuild && (
                  <button className="btn-link" onClick={() => startPlacing(suggestion as string)}>
                    {t(`building.${suggestion}`)} {t('ui.build').toLowerCase()}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}
