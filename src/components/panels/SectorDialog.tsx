import { Lock, X } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { formatMoney, t } from '../../i18n/index.ts';

export function SectorDialog() {
  const game = useGame();
  const { sectorDialog, openSectorDialog, pushToast } = useUiStore();
  if (!sectorDialog) return null;
  const cost = game.getSectorCost(sectorDialog);
  const levelOk = game.state.level.current >= 5;
  const affordable = game.canAffordCost({ money: cost });

  return (
    <div className="dialog-backdrop" onClick={() => openSectorDialog(undefined)}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <h3>
            <Lock size={16} /> {t('ui.sector.title')}
          </h3>
          <button className="btn-icon" onClick={() => openSectorDialog(undefined)}>
            <X size={16} />
          </button>
        </div>
        <p className="muted">{levelOk ? t('ui.sector.desc') : t('ui.sector.locked_level')}</p>
        <p className="sector-price">
          {t('ui.cost')}: {formatMoney(cost)} {t('resource.money')}
        </p>
        <div className="dialog-buttons">
          <button className="btn-secondary" onClick={() => openSectorDialog(undefined)}>
            {t('ui.cancel')}
          </button>
          <button
            className="btn-primary"
            disabled={!levelOk || !affordable}
            onClick={() => {
              const result = game.unlockSector(sectorDialog);
              if (result.ok) {
                openSectorDialog(undefined);
                pushToast(t('ui.sector.title') + ' ✓', 'success');
              } else {
                pushToast(t(`error.${result.error}`) ?? t('error.generic'), 'error');
              }
            }}
          >
            {t('ui.unlock')}
          </button>
        </div>
      </div>
    </div>
  );
}
