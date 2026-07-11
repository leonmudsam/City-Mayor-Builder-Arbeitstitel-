import { Lock, Waves, X } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { formatMoney, t } from '../../i18n/index.ts';

export function SectorDialog() {
  const game = useGame();
  const { sectorDialog, openSectorDialog, pushToast, selectBuilding } = useUiStore();
  if (!sectorDialog) return null;
  const cost = game.getSectorCost(sectorDialog);
  const levelOk = game.state.level.current >= 5;
  const affordable = game.canAffordCost({ money: cost });
  // River district: only offered on a locked river-biome sector at the right level.
  const district = game.canFoundDistrict(sectorDialog);
  const districtAffordable = game.canAffordCost(district.cost);

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
                const result = game.foundDistrict(sectorDialog);
                if (result.ok) {
                  openSectorDialog(undefined);
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
