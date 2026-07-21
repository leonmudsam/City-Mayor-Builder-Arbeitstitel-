import { useEffect, useRef, useState } from 'react';
import { CloudFog, CloudRain, CloudSun, Grid3x3, Plus, Minus, Compass, Pause, Play } from 'lucide-react';
import { getMapApi, useUiStore } from '../../state/store.ts';
import {
  getEnvironmentSettings,
  setEnvironmentSettings,
  subscribeEnvironmentSettings,
} from '../../renderer/three/environmentSettings.ts';
import { t } from '../../i18n/index.ts';

// 3D view controls (§9/§14, v0.30): camera presets replace the old 2D/iso/3D
// mode switch, plus a compass (reset-north) and zoom buttons. During build mode a
// prominent "Bauansicht" shortcut drops the camera near top-down for precise
// road/placement work. All of this only moves the camera — never the render mode.
export function CameraControls() {
  const cameraPreset = useUiStore((s) => s.cameraPreset);
  const setCameraPreset = useUiStore((s) => s.setCameraPreset);
  const placing = useUiStore((s) => s.placingDefId);
  const needleRef = useRef<HTMLSpanElement>(null);

  // Rotate the compass needle to the live camera yaw without re-rendering React
  // every frame (§16 performance): read the yaw in a rAF and set a transform.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const yaw = getMapApi()?.getYaw() ?? 0;
      const el = needleRef.current;
      if (el) el.style.transform = `rotate(${(yaw * 180) / Math.PI}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

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

/** Format a normalised time-of-day (0..1) as HH:MM. */
function clock(tod: number): string {
  const total = Math.round(tod * 24 * 60);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Day/night HUD: toggle the auto-cycle and scrub the time of day (§ Atmosphäre,
 *  v0.37). Reads/writes the shared environmentSettings store the SkyEnvironment
 *  also listens to, so changes apply live. Purely visual — no game effect. */
export function DayNightControl() {
  const [env, setEnv] = useState(getEnvironmentSettings());
  const openPanel = useUiStore((state) => state.openPanel);
  const setPanel = useUiStore((state) => state.setPanel);
  useEffect(() => subscribeEnvironmentSettings(() => setEnv(getEnvironmentSettings())), []);
  const visualSpeed = env.dayLengthMin <= 4 ? 4 : env.dayLengthMin <= 8 ? 2 : 1;
  const WeatherIcon = env.weather === 'rain' ? CloudRain : env.weather === 'fog' ? CloudFog : CloudSun;
  const weatherLabel =
    env.weather === 'rain' ? t('ui.weather.rain') : env.weather === 'fog' ? t('ui.weather.fog') : t('ui.weather.clear');

  return (
    <div className="hud-environment">
      <button
        className={`hud-weather-open${openPanel === 'weather' ? ' active' : ''}`}
        onClick={() => setPanel('weather')}
        title={t('ui.weather.open')}
        aria-label={t('ui.weather.open')}
      >
        <WeatherIcon className="hud-environment-sun" size={24} />
      </button>
      <div className="hud-environment-copy">
        <strong>{t('ui.env.season')}</strong>
        <span>{t('ui.env.day')} · {clock(env.timeOfDay)} · {weatherLabel}</span>
        <input
          type="range"
          className="env-time"
          min={0}
          max={0.999}
          step={0.001}
          value={env.timeOfDay}
          onChange={(e) => setEnvironmentSettings({ timeOfDay: Number(e.target.value), cycle: false })}
          title={t('ui.env.time')}
          aria-label={t('ui.env.time')}
        />
      </div>
      <button
        className={`env-cycle${env.cycle ? ' active' : ''}`}
        onClick={() => setEnvironmentSettings({ cycle: !env.cycle })}
        title={t('ui.env.cycle')}
      >
        {env.cycle ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <div className="hud-env-speeds" aria-label={t('ui.env.speed')}>
        {[1, 2, 4].map((speed) => (
          <button
            key={speed}
            className={visualSpeed === speed ? 'active' : ''}
            onClick={() => setEnvironmentSettings({ dayLengthMin: speed === 1 ? 16 : speed === 2 ? 8 : 4 })}
            title={`${speed}× · ${t('ui.env.speed')}`}
          >
            {speed}×
          </button>
        ))}
      </div>
    </div>
  );
}
