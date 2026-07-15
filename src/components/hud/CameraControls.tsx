import { useEffect, useRef } from 'react';
import { Eye, Grid3x3, Maximize2, Crosshair, Plus, Minus, Compass } from 'lucide-react';
import { getMapApi, useUiStore } from '../../state/store.ts';
import type { CameraPreset } from '../../renderer/three/CameraConfig.ts';
import { t } from '../../i18n/index.ts';

// 3D view controls (§9/§14, v0.30): camera presets replace the old 2D/iso/3D
// mode switch, plus a compass (reset-north) and zoom buttons. During build mode a
// prominent "Bauansicht" shortcut drops the camera near top-down for precise
// road/placement work. All of this only moves the camera — never the render mode.
const PRESETS: { id: CameraPreset; icon: typeof Eye; key: string }[] = [
  { id: 'city', icon: Eye, key: 'ui.camera.preset.city' },
  { id: 'build', icon: Grid3x3, key: 'ui.camera.preset.build' },
  { id: 'overview', icon: Maximize2, key: 'ui.camera.preset.overview' },
  { id: 'center', icon: Crosshair, key: 'ui.camera.preset.center' },
];

export function CameraControls() {
  const renderMode = useUiStore((s) => s.renderMode);
  const cameraPreset = useUiStore((s) => s.cameraPreset);
  const setCameraPreset = useUiStore((s) => s.setCameraPreset);
  const placing = useUiStore((s) => s.placingDefId);
  const needleRef = useRef<HTMLSpanElement>(null);

  // Rotate the compass needle to the live camera yaw without re-rendering React
  // every frame (§16 performance): read the yaw in a rAF and set a transform.
  useEffect(() => {
    if (renderMode !== 'true3d') return;
    let raf = 0;
    const tick = () => {
      const yaw = getMapApi()?.getYaw() ?? 0;
      const el = needleRef.current;
      if (el) el.style.transform = `rotate(${(yaw * 180) / Math.PI}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [renderMode]);

  if (renderMode !== 'true3d') return null;

  return (
    <div className="camera-controls">
      {placing !== undefined && (
        <button
          className={`camera-buildview${cameraPreset === 'build' ? ' active' : ''}`}
          onClick={() => setCameraPreset(cameraPreset === 'build' ? 'city' : 'build')}
          title={t('ui.camera.buildview.hint')}
        >
          <Grid3x3 size={16} /> {t('ui.camera.buildview')}
        </button>
      )}
      <div className="camera-presets">
        {PRESETS.map(({ id, icon: Icon, key }) => (
          <button
            key={id}
            className={`camera-preset${cameraPreset === id ? ' active' : ''}`}
            onClick={() => setCameraPreset(id)}
            title={t(key)}
          >
            <Icon size={16} />
            <span>{t(key)}</span>
          </button>
        ))}
      </div>
      <div className="camera-tools">
        <button
          className="camera-compass"
          onClick={() => getMapApi()?.resetNorth()}
          title={t('ui.camera.compass')}
        >
          <span className="camera-compass-needle" ref={needleRef}>
            <Compass size={22} />
          </span>
        </button>
        <div className="camera-zoom">
          <button onClick={() => getMapApi()?.zoomStep(1)} title={t('ui.camera.zoomIn')}>
            <Plus size={16} />
          </button>
          <button onClick={() => getMapApi()?.zoomStep(-1)} title={t('ui.camera.zoomOut')}>
            <Minus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
