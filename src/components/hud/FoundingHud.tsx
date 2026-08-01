import { useEffect } from 'react';
import { MapPin, Sparkles } from 'lucide-react';
import { startRegionConfig } from '../../game/config/startRegion.config.ts';
import { useGame, useUiStore } from '../../state/store.ts';
import { t } from '../../i18n/index.ts';

/**
 * § Welt-Feinschliff 12.2 — GRÜNDUNG.
 *
 * Nutzerwunsch: „Das Rathaus soll man am Anfang selbst entscheiden können wo man
 * es platziert." Vorher stand es auf einem vom Bake gewählten Anker.
 *
 * Bewusst KEIN neues Bau-/Platzierungssystem (§2): Die Gründung nutzt exakt den
 * vorhandenen Platzierungsmodus (`placingDefId`), denselben Ghost und dieselbe
 * `validatePlacement`-Instanz. Dieses Panel ist nur die Erklärung dazu — plus
 * ein Knopf, der den vom Bake geprüften Vorschlag übernimmt, damit niemand
 * suchen MUSS.
 */
export function FoundingHud(): JSX.Element | null {
  const game = useGame();
  const placingDefId = useUiStore((s) => s.placingDefId);
  const startPlacing = useUiStore((s) => s.startPlacing);
  const pushToast = useUiStore((s) => s.pushToast);
  const founded = game.isCityFounded();

  // Solange nicht gegründet ist, ist der Gründungsmodus der einzige Modus.
  useEffect(() => {
    if (!founded && placingDefId !== 'town_hall') startPlacing('town_hall');
  }, [founded, placingDefId, startPlacing]);

  if (founded) return null;

  const suggestion = startRegionConfig.townHall;
  const acceptSuggestion = (): void => {
    const result = game.foundCity(suggestion.x, suggestion.y);
    if (!result.ok) {
      pushToast(t(`error.${result.error}`), 'error');
      return;
    }
    useUiStore.getState().stopPlacing();
    pushToast(t('ui.founding.done'), 'success');
  };

  return (
    <div className="founding-hud" role="status">
      <div className="founding-hud__icon"><MapPin size={20} /></div>
      <div className="founding-hud__body">
        <h2 className="founding-hud__title">{t('ui.founding.title')}</h2>
        <p className="founding-hud__text">{t('ui.founding.body')}</p>
      </div>
      <button type="button" className="founding-hud__suggest" onClick={acceptSuggestion}>
        <Sparkles size={16} />
        <span>{t('ui.founding.suggestion')}</span>
      </button>
    </div>
  );
}
