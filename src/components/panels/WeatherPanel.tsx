import { CloudFog, CloudRain, Clock3, Pause, Play, Sparkles, Sun, X, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { uiImage } from '../../assets/registry.ts';
import {
  getEnvironmentSettings,
  setEnvironmentSettings,
  subscribeEnvironmentSettings,
  type WeatherMode,
} from '../../renderer/three/environmentSettings.ts';
import { useUiStore } from '../../state/store.ts';
import { t } from '../../i18n/index.ts';

const weatherOptions: {
  id: WeatherMode;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  position: string;
}[] = [
  { id: 'clear', icon: Sun, title: 'Sonnig', subtitle: 'Klare Fernsicht', position: 'left center' },
  { id: 'rain', icon: CloudRain, title: 'Sommerregen', subtitle: 'Kühl und dramatisch', position: 'center center' },
  { id: 'fog', icon: CloudFog, title: 'Morgennebel', subtitle: 'Weich und atmosphärisch', position: 'right center' },
];

const timePresets = [
  { label: 'Morgen', time: '06:30', value: 0.271 },
  { label: 'Mittag', time: '12:00', value: 0.5 },
  { label: 'Abend', time: '18:15', value: 0.76 },
  { label: 'Nacht', time: '22:00', value: 0.917 },
];

function clock(tod: number): string {
  const total = Math.round(tod * 24 * 60);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Presentation-only control room for the renderer's live sky and weather.
 *  No forecast or simulation bonus is implied: every control only changes
 *  environmentSettings, which the Three renderer consumes directly. */
export function WeatherPanel() {
  const setPanel = useUiStore((state) => state.setPanel);
  const [env, setEnv] = useState(getEnvironmentSettings());
  const panorama = uiImage('weather_cycle_premium');

  useEffect(() => subscribeEnvironmentSettings(() => setEnv(getEnvironmentSettings())), []);

  return (
    <aside className="side-panel weather-panel">
      <div className="panel-head weather-panel-head">
        <div>
          <span className="panel-kicker">
            <Sparkles size={13} /> Visuelle Weltstimmung
          </span>
          <h3>Wetter &amp; Tageszeit</h3>
        </div>
        <button className="btn-icon" onClick={() => setPanel(undefined)} title={t('ui.close')}>
          <X size={17} />
        </button>
      </div>

      <section
        className={`weather-current weather-current-${env.weather}`}
        style={panorama ? { backgroundImage: `url(${panorama})` } : undefined}
      >
        <div className="weather-current-shade" />
        <div className="weather-current-copy">
          <span>Frühling · Tag 1</span>
          <strong>
            {weatherOptions.find((option) => option.id === env.weather)?.title} · {clock(env.timeOfDay)}
          </strong>
          <small>Reine Atmosphäre · keine Auswirkung auf die Simulation</small>
        </div>
      </section>

      <section className="weather-section">
        <div className="weather-section-title">
          <span>Atmosphäre</span>
          <small>Live in der 3D-Welt</small>
        </div>
        <div className="weather-presets">
          {weatherOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                className={env.weather === option.id ? 'active' : ''}
                onClick={() => setEnvironmentSettings({ weather: option.id })}
              >
                <span
                  className="weather-preset-art"
                  style={
                    panorama
                      ? { backgroundImage: `url(${panorama})`, backgroundPosition: option.position }
                      : undefined
                  }
                />
                <span className="weather-preset-copy">
                  <Icon size={17} />
                  <span>
                    <b>{option.title}</b>
                    <small>{option.subtitle}</small>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="weather-section">
        <div className="weather-section-title">
          <span>Tageszeit</span>
          <small>{clock(env.timeOfDay)}</small>
        </div>
        <div className="weather-time-row">
          {timePresets.map((preset) => (
            <button
              key={preset.label}
              className={Math.abs(env.timeOfDay - preset.value) < 0.035 ? 'active' : ''}
              onClick={() => setEnvironmentSettings({ timeOfDay: preset.value, cycle: false })}
            >
              <Clock3 size={15} />
              <b>{preset.time}</b>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
        <input
          className="weather-time-slider"
          type="range"
          min={0}
          max={0.999}
          step={0.001}
          value={env.timeOfDay}
          onChange={(event) =>
            setEnvironmentSettings({ timeOfDay: Number(event.target.value), cycle: false })
          }
          aria-label={t('ui.env.time')}
        />
      </section>

      <div className="weather-cycle-row">
        <button
          className={`btn-primary${env.cycle ? ' active' : ''}`}
          onClick={() => setEnvironmentSettings({ cycle: !env.cycle })}
        >
          {env.cycle ? <Pause size={16} /> : <Play size={16} />}
          {env.cycle ? 'Tageslauf pausieren' : 'Tageslauf starten'}
        </button>
        <div className="weather-speed" aria-label={t('ui.env.speed')}>
          {[1, 2, 4].map((speed) => {
            const active =
              (speed === 1 && env.dayLengthMin > 8) ||
              (speed === 2 && env.dayLengthMin > 4 && env.dayLengthMin <= 8) ||
              (speed === 4 && env.dayLengthMin <= 4);
            return (
              <button
                key={speed}
                className={active ? 'active' : ''}
                onClick={() => setEnvironmentSettings({ dayLengthMin: speed === 1 ? 16 : speed === 2 ? 8 : 4 })}
              >
                {speed}×
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
