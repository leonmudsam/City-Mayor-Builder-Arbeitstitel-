import { CloudFog, CloudRain, Sparkles, Sun, X, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { uiImage } from '../../assets/registry.ts';
import {
  getEnvironmentSettings,
  setEnvironmentSettings,
  subscribeEnvironmentSettings,
  type WeatherMode,
} from '../../renderer/three/environmentSettings.ts';
import { useGame, useUiStore } from '../../state/store.ts';
import { formatClockTime } from '../../game/time/gameTime.ts';
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

/** Presentation-only control room for the renderer's live sky and weather.
 *  Die Tageszeit/Sonne ist seit § P-B an die EINE Ingame-Uhr gekoppelt (D-038) —
 *  hier gibt es deshalb keinen manuellen Zeitregler mehr; nur die reine
 *  Atmosphäre (klar/Regen/Nebel) bleibt frei wählbar und hat keine Sim-Wirkung. */
export function WeatherPanel() {
  const game = useGame();
  const setPanel = useUiStore((state) => state.setPanel);
  const [env, setEnv] = useState(getEnvironmentSettings());
  const panorama = uiImage('weather_cycle_premium');
  const clock = game.getGameClock();

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
          <span>{t(`ui.season.${clock.seasonKey}`)} · {t('ui.clock.day')} {clock.day}</span>
          <strong>
            {weatherOptions.find((option) => option.id === env.weather)?.title} · {formatClockTime(clock)}
          </strong>
          <small>Sonne folgt der Ingame-Uhr · Wetter ist reine Atmosphäre (keine Sim-Wirkung)</small>
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
    </aside>
  );
}
