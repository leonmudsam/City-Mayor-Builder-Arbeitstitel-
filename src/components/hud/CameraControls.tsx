import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { CloudFog, CloudRain, CloudSun, Grid3x3, Plus, Minus, Compass, Pause, Play } from 'lucide-react';
import { getMapApi, useGame, useUiStore } from '../../state/store.ts';
import { getFpsSample, subscribeFps } from '../../services/fpsMeter.ts';
import {
  getEnvironmentSettings,
  setEnvironmentSettings,
  subscribeEnvironmentSettings,
} from '../../renderer/three/environmentSettings.ts';
import { formatClockTime } from '../../game/time/gameTime.ts';
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

/**
 * Dauerhafte, gedrosselte FPS-Anzeige neben der Uhr (§ P-E / §15.1). Liest den
 * ~alle 500 ms veröffentlichten Snapshot des `fpsMeter` über useSyncExternalStore
 * — **kein** React-Update pro Frame. Farbe: grün ≥55, gold 35–54, rot <35.
 */
export function FpsIndicator() {
  const sample = useSyncExternalStore(subscribeFps, getFpsSample, getFpsSample);
  const tone = sample.fps >= 55 ? 'good' : sample.fps >= 35 ? 'warn' : 'bad';
  return (
    <div
      className={`hud-fps hud-fps-${tone}`}
      title={`${sample.fps} FPS · ${sample.frameMs} ms/Frame`}
      aria-label={`${sample.fps} FPS`}
    >
      <strong>{sample.fps}</strong>
      <span>FPS</span>
    </div>
  );
}

/**
 * Zeit- und Atmosphären-HUD. Die sichtbare **Uhr ist jetzt eine reine Projektion
 * der EINEN Simulationsuhr** (`game.getGameClock()`, § P-B): Tag, Uhrzeit und
 * Jahreszeit laufen live mit der gewählten Geschwindigkeit und stehen bei Pause
 * still — kein eigener Timer in React (§7.4). Die Geschwindigkeitsleiste steuert
 * seit § Overhaul 8.0 (§26) die ECHTE Simulation: Pause hält Einkommen, Verbrauch,
 * Produktion, Wachstum, Bauzeit, Betriebe, Transport und Missionen gemeinsam an,
 * 2×/4× beschleunigen sie gemeinsam. Das Wetter/Atmosphäre bleibt rein visuell und
 * wird im Wetter-Panel eingestellt.
 */
export function DayNightControl() {
  const game = useGame();
  const [env, setEnv] = useState(getEnvironmentSettings());
  const openPanel = useUiStore((state) => state.openPanel);
  const setPanel = useUiStore((state) => state.setPanel);
  useEffect(() => subscribeEnvironmentSettings(() => setEnv(getEnvironmentSettings())), []);
  const speed = game.getSpeed();
  const gameClock = game.getGameClock();
  // § P-B (D-038, Nutzerentscheid): die Sonne ist an die EINE Uhr gekoppelt — der
  // Renderer-`timeOfDay` folgt der Ingame-Uhrzeit (cycle aus, die Uhr treibt ihn).
  // Bei Pause steht die Uhr → steht die Sonne. Schritt je Ingame-Minute (winzig bei
  // 1440-Minuten-Tag → optisch glatt); kein eigener Timer.
  //
  // § Prototyp-Zeitsystem: Im Modus `day_only` bleibt die WELT hell, während die
  // UHR normal weiterläuft — die Kopplung entfällt, `gameClock` nicht. Alles, was
  // an der Zeit hängt (Bau, Betriebe, Transport, Missionen), bleibt unberührt.
  const visualTimeMode = env.visualTimeMode;
  useEffect(() => {
    if (visualTimeMode !== 'dynamic') return;
    setEnvironmentSettings({ timeOfDay: gameClock.timeOfDay, cycle: false });
  }, [gameClock.timeOfDay, visualTimeMode]);
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
        <strong>{t(`ui.season.${gameClock.seasonKey}`)}</strong>
        <span>
          {t('ui.clock.day')} {gameClock.day} · {formatClockTime(gameClock)}
          {speed === 0 ? ` · ${t('ui.clock.paused')}` : ''} · {weatherLabel}
        </span>
      </div>
      <button
        className={`env-cycle${speed === 0 ? ' active' : ''}`}
        onClick={() => game.setSpeed(speed === 0 ? 1 : 0)}
        title={t(speed === 0 ? 'ui.env.resume' : 'ui.env.pause')}
        aria-label={t(speed === 0 ? 'ui.env.resume' : 'ui.env.pause')}
      >
        {speed === 0 ? <Play size={16} /> : <Pause size={16} />}
      </button>
      <div className="hud-env-speeds" aria-label={t('ui.env.speed')}>
        {([1, 2, 4] as const).map((option) => (
          <button
            key={option}
            className={speed === option ? 'active' : ''}
            onClick={() => game.setSpeed(option)}
            title={`${option}× · ${t('ui.env.speed')}`}
          >
            {option}×
          </button>
        ))}
      </div>
    </div>
  );
}
