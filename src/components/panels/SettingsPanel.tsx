import { useSyncExternalStore } from 'react';
import { Bug, Download, Gift, RefreshCw, RotateCcw, Upload, X } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { exportSave, importSave } from '../../game/storage/exportImport.ts';
import {
  getCameraSettings,
  resetCameraSettings,
  setCameraSettings,
  subscribeCameraSettings,
  type CameraSettings,
} from '../../renderer/three/cameraSettings.ts';
import { GraphicsQualityControl } from './PerformancePanel.tsx';
import { t } from '../../i18n/index.ts';

declare const __APP_VERSION__: string;

/** Live view of the framework-agnostic camera settings store. */
function useCameraSettings(): CameraSettings {
  return useSyncExternalStore(subscribeCameraSettings, getCameraSettings, getCameraSettings);
}

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

  return (
    <aside className="panel side-panel">
      <div className="panel-head">
        <h3>{t('ui.settings')}</h3>
        <button className="btn-icon" onClick={() => setPanel(undefined)}>
          <X size={16} />
        </button>
      </div>

      <CameraSettingsControls />

      <GraphicsQualityControl />

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
      {import.meta.env.DEV && debugTools && (
        <button className="btn-secondary" onClick={() => setPanel('debug')}>
          <Bug size={16} /> {t('ui.debug.title')}
        </button>
      )}
      <p className="muted version">v{__APP_VERSION__}</p>
    </aside>
  );
}

/** 3D-camera feel settings (§12): speeds, invert, smoothing, edge scrolling. */
function CameraSettingsControls() {
  const s = useCameraSettings();
  return (
    <div className="settings-group">
      <span className="settings-group-label">{t('ui.camera.settings')}</span>
      <SettingSlider label={t('ui.camera.panSpeed')} value={s.panSpeed} onChange={(v) => setCameraSettings({ panSpeed: v })} />
      <SettingSlider label={t('ui.camera.zoomSpeed')} value={s.zoomSpeed} onChange={(v) => setCameraSettings({ zoomSpeed: v })} />
      <SettingSlider label={t('ui.camera.rotateSpeed')} value={s.rotateSpeed} onChange={(v) => setCameraSettings({ rotateSpeed: v })} />
      <SettingToggle label={t('ui.camera.smooth')} checked={s.smooth} onChange={(v) => setCameraSettings({ smooth: v })} />
      <SettingToggle label={t('ui.camera.invertRotate')} checked={s.invertRotate} onChange={(v) => setCameraSettings({ invertRotate: v })} />
      <SettingToggle label={t('ui.camera.invertZoom')} checked={s.invertZoom} onChange={(v) => setCameraSettings({ invertZoom: v })} />
      <SettingToggle label={t('ui.camera.edgeScroll')} checked={s.edgeScroll} onChange={(v) => setCameraSettings({ edgeScroll: v })} />
      <button className="btn-secondary settings-camera-reset" onClick={() => resetCameraSettings()}>
        <RotateCcw size={15} /> {t('ui.camera.reset')}
      </button>
      <span className="settings-group-hint">{t('ui.camera.hint')}</span>
    </div>
  );
}

function SettingSlider({ label, value, onChange }: { label: string; value: number; onChange(v: number): void }) {
  return (
    <label className="settings-slider">
      <span>{label}</span>
      <input
        type="range"
        min={0.3}
        max={3}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="settings-slider-val">{value.toFixed(1)}×</span>
    </label>
  );
}

function SettingToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange(v: boolean): void }) {
  return (
    <label className="settings-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
