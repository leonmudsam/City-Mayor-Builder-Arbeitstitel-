import { Boxes, Bug, Download, Gift, Grid3x3, RefreshCw, Upload, X } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { exportSave, importSave } from '../../game/storage/exportImport.ts';
import { t } from '../../i18n/index.ts';

declare const __APP_VERSION__: string;

export function SettingsPanel({
  onImport,
  onReset,
}: {
  onImport(json: string): boolean;
  onReset(variant?: 'normal' | 'bonus'): void;
}) {
  const game = useGame();
  const { setPanel, pushToast } = useUiStore();
  const debugTools = game.config.features.debugTools;
  const renderMode = useUiStore((s) => s.renderMode);
  const setRenderMode = useUiStore((s) => s.setRenderMode);

  return (
    <aside className="panel side-panel">
      <div className="panel-head">
        <h3>{t('ui.settings')}</h3>
        <button className="btn-icon" onClick={() => setPanel(undefined)}>
          <X size={16} />
        </button>
      </div>

      {/* Map render mode (§3): flat top-down grid vs isometric 2.5D. Purely a
          view choice — the city, buildings and savegame are identical. */}
      <div className="settings-group">
        <span className="settings-group-label">{t('ui.render.mode')}</span>
        <div className="settings-segmented">
          <button
            className={`settings-seg${renderMode === 'flat2d' ? ' active' : ''}`}
            onClick={() => setRenderMode('flat2d')}
          >
            <Grid3x3 size={15} /> {t('ui.render.flat2d')}
          </button>
          <button
            className={`settings-seg${renderMode === 'isometric2d' ? ' active' : ''}`}
            onClick={() => setRenderMode('isometric2d')}
          >
            <Boxes size={15} /> {t('ui.render.isometric2d')}
          </button>
        </div>
        <span className="settings-group-hint">{t('ui.render.hint')}</span>
      </div>

      <button
        className="btn-secondary"
        onClick={() => {
          const blob = new Blob([exportSave(game.state)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${game.state.meta.cityName.replaceAll(' ', '_')}.citysave.json`;
          a.click();
          URL.revokeObjectURL(url);
        }}
      >
        <Download size={16} /> {t('ui.export')}
      </button>
      <button
        className="btn-secondary"
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json,application/json';
          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            const text = await file.text();
            try {
              importSave(text); // validate before handing over
              if (!onImport(text)) pushToast(t('ui.import.error'), 'error');
            } catch {
              pushToast(t('ui.import.error'), 'error');
            }
          };
          input.click();
        }}
      >
        <Upload size={16} /> {t('ui.import')}
      </button>
      <button
        className="btn-danger"
        onClick={() => {
          if (window.confirm(t('ui.reset.confirm'))) {
            onReset('normal');
            pushToast(t('ui.reset.done'), 'success');
          }
        }}
      >
        <RefreshCw size={16} /> {t('ui.reset')}
      </button>
      <button
        className="btn-secondary"
        onClick={() => {
          if (window.confirm(t('ui.reset.confirm'))) {
            onReset('bonus');
            pushToast(t('ui.reset.done'), 'success');
          }
        }}
      >
        <Gift size={16} /> {t('ui.reset.bonus')}
      </button>
      {debugTools && (
        <button className="btn-secondary" onClick={() => setPanel('debug')}>
          <Bug size={16} /> {t('ui.debug.title')}
        </button>
      )}
      <p className="muted version">v{__APP_VERSION__}</p>
    </aside>
  );
}
